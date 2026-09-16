#!/usr/bin/env python3
"""添加、更新或停用访客模式的账号。

密码只以 PBKDF2-SHA256 哈希写进访客名单（默认 work/visitor-accounts.json，
该文件已被 .gitignore 排除）；--sql 会打印数据库版 INSERT，--db 则直接写
数据库的 visitor_accounts 表。两种存储都不存明文密码——数据库里能读明文的人
（同机的 WordPress、面板导出的 .sql、备份文件）等于拿到了访客的口令，
而拿到哈希什么都做不了。

    python scripts/add-visitor.py beibei --name 贝贝            # 交互式输入密码
    python scripts/add-visitor.py beibei --name 贝贝 --generate  # 生成随机强密码
    python scripts/add-visitor.py --list

写数据库（--db）：
    python scripts/add-visitor.py alice --name alice --ask-password --apps our-space,files --db
                                                    # 上面这行＝自定义密码 + 授权，一次做完
    python scripts/add-visitor.py alice --name alice --generate --apps our-space,files --db
                                                    # 换成随机强密码，其余一样
    python scripts/add-visitor.py alice --password '你的密码' --apps files --db  # 密码写在命令行里（会进历史）
    python scripts/add-visitor.py alice --apps files --db   # 只改授权，密码一个字都不碰
    python scripts/add-visitor.py alice --ask-password --db # 只改密码，显示名/授权/停用状态都保留
    python scripts/add-visitor.py --db --list            # 看数据库里现有账号
    python scripts/add-visitor.py alice --db --disable      # 停用（--enable 改回，--remove 删除）

规则很简单：**这回涉及密码的参数（--ask-password / --generate / --password）给了哪个，
就按哪个设密码；三个都没给又带了 --apps，就是「只改授权」。** 没给 --name 时保留原显示名。
"""
import argparse
import base64
import getpass
import hashlib
import json
import os
import re
import secrets
import string
import unicodedata
import urllib.parse
from pathlib import Path

# 与 backend/app/services/visitor_accounts.py 使用同一套哈希格式；
# backend/tests/test_visitor_login.py 会交叉验证两者一致，改一处必须同步另一处。
PBKDF2_SCHEME = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 600_000

DEFAULT_PATH = Path(__file__).resolve().parents[1] / "work" / "visitor-accounts.json"
DEFAULT_ENV_PATH = Path("/etc/marcusweb/backend.env")
NOTE = (
    "访客模式账号。password_hash 由 scripts/add-visitor.py 生成，不要手写明文密码；"
    "DATABASE_ENABLED=true 时数据库的 visitor_accounts 表与这份文件一起生效"
    "（用 --db 直接写库，不要在数据库里存明文密码）。"
)
APP_ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,31}$")
ALPHABET = string.ascii_letters + string.digits


def normalize_username(value: str) -> str:
    return unicodedata.normalize("NFKC", value).strip().casefold()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return (f"{PBKDF2_SCHEME}${PBKDF2_ITERATIONS}$"
            f"{base64.b64encode(salt).decode('ascii')}${base64.b64encode(digest).decode('ascii')}")


def load(path: Path) -> dict:
    if not path.exists():
        return {"_说明": NOTE, "visitors": []}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except ValueError as error:
        raise SystemExit(f"{path} 不是合法 JSON：{error}")
    if not isinstance(data, dict) or not isinstance(data.get("visitors"), list):
        raise SystemExit(f"{path} 缺少 visitors 数组。")
    return data


def save(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    try:
        path.chmod(0o600)
    except OSError:
        pass  # Windows 上以 ACL 为准，忽略即可。
    print(f"已写入 {path}")


def find(data: dict, key: str) -> dict | None:
    return next((entry for entry in data["visitors"] if normalize_username(str(entry.get("username", ""))) == key), None)


def parse_apps(value: str | None, current: list[str]) -> list[str]:
    """--apps a,b 覆盖授权；--apps none 清空；不给就保留原样。"""
    if value is None:
        return current
    if value.strip().lower() in ("", "none", "-"):
        return []
    ids: list[str] = []
    for item in value.split(","):
        app_id = item.strip().lower()
        if not APP_ID.fullmatch(app_id):
            raise SystemExit(f"应用 id 只能用小写字母、数字和连字符：{item!r}")
        if app_id not in ids:
            ids.append(app_id)
    if len(ids) > 32:
        raise SystemExit("一个访客最多 32 个应用。")
    return ids


def choose_password(args) -> str:
    """取得这次要设置的密码：--generate 随机、--password 直给、都不给就交互输入。"""
    if args.generate:
        return "".join(secrets.choice(ALPHABET) for _ in range(20))
    password = args.password
    if not password:
        first = getpass.getpass("访客密码：")
        if not first:
            raise SystemExit("密码不能为空。")
        if getpass.getpass("再输一次：") != first:
            raise SystemExit("两次输入不一致。")
        password = first
    if len(password) < 8:
        raise SystemExit("密码至少 8 位；访客模式只有一个口令，建议用 --generate 生成 20 位随机密码。")
    return password


def set_password(args, data: dict, key: str) -> str:
    password = choose_password(args)
    password_hash = hash_password(password)
    entry = find(data, key)
    if entry is None:
        data["visitors"].append({
            "username": normalize_username(args.username), "name": args.name or args.username,
            "password_hash": password_hash, "apps": parse_apps(args.apps, []),
        })
        print(f"已添加访客：{normalize_username(args.username)}")
    else:
        entry["password_hash"] = password_hash
        entry["apps"] = parse_apps(args.apps, list(entry.get("apps", [])))
        if args.name:
            entry["name"] = args.name
        print(f"已更新访客：{normalize_username(args.username)}")
    print(f"可用应用：{'、'.join(data['visitors'][-1 if entry is None else data['visitors'].index(entry)].get('apps', [])) or '（无）'}")
    return password, password_hash


def print_sql(args, key: str, password_hash: str) -> None:
    username = normalize_username(args.username)
    name = (args.name or args.username).replace("'", "''")
    apps = ",".join(parse_apps(args.apps, []))
    print()
    print("-- DATABASE_ENABLED=true 时在数据库执行（MySQL 可用下一行的 upsert 变体）：")
    print(f"INSERT INTO visitor_accounts (username, display_name, password_hash, apps, disabled) "
          f"VALUES ('{username}', '{name}', '{password_hash}', '{apps}', 0);")
    print("-- MySQL: ... ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), "
          "password_hash=VALUES(password_hash), apps=VALUES(apps);")


# ---------------------------------------------------------------------------
# 数据库模式（--db）：直接写 visitor_accounts，省掉手工算哈希这一步。
# 密码到这里仍然是先哈希再落库——数据库里存明文等于把访客的口令交给任何一个
# 能读库的人（同机的 WordPress、面板导出的 .sql、备份文件都算），而哈希泄漏了什么也拿不到。
# ---------------------------------------------------------------------------

def read_env_value(path: Path, key: str) -> str | None:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return None
    for line in lines:
        name, _, value = line.partition("=")
        if name.strip() == key and not line.lstrip().startswith("#"):
            return value.strip()
    return None


def parse_db_url(url: str) -> dict:
    parts = urllib.parse.urlsplit(url)
    scheme = parts.scheme.split("+")[0]
    if scheme not in ("mysql", "postgresql", "postgres"):
        raise SystemExit(f"只认 mysql:// 或 postgresql:// 的 DATABASE_URL，拿到的是 {parts.scheme}://")
    if not parts.hostname or not parts.path.strip("/"):
        raise SystemExit("DATABASE_URL 缺少主机名或库名。")
    return {
        "kind": "mysql" if scheme == "mysql" else "postgres",
        "host": parts.hostname,
        "port": parts.port,
        "user": urllib.parse.unquote(parts.username or ""),
        "password": urllib.parse.unquote(parts.password or ""),
        "database": parts.path.strip("/"),
    }


def venv_python() -> str:
    """这个仓库里虚拟环境的解释器路径——Windows 与 POSIX 的目录布局不同。"""
    return r"backend\.venv\Scripts\python.exe" if os.name == "nt" else "backend/.venv/bin/python"


def missing_driver(package: str) -> SystemExit:
    py = venv_python()
    return SystemExit(
        f"缺少 {package}：它没装在这个虚拟环境里。\n"
        f"  先装：{py} -m pip install {package}\n"
        f"  再跑：{py} scripts/add-visitor.py …"
    )


def db_connect(target: dict):
    """打开一个同步连接（脚本只依赖驱动本身，不拉起整个应用的异步栈）。"""
    if target["kind"] == "mysql":
        try:
            import pymysql
        except ImportError:
            raise missing_driver("PyMySQL")
        return pymysql.connect(
            host=target["host"], port=target["port"] or 3306, user=target["user"],
            password=target["password"], database=target["database"], charset="utf8mb4",
            autocommit=True,
        )
    try:
        import psycopg2
    except ImportError:
        raise missing_driver("psycopg2")
    connection = psycopg2.connect(
        host=target["host"], port=target["port"] or 5432, user=target["user"],
        password=target["password"], dbname=target["database"],
    )
    connection.autocommit = True
    return connection


def upsert_sql(kind: str) -> str:
    columns = ("INSERT INTO visitor_accounts (username, display_name, password_hash, apps, disabled) "
               "VALUES (%s, %s, %s, %s, %s)")
    if kind == "mysql":
        # 5.7 与 8 都支持这个写法（8 里 VALUES() 只是被标记为过时，仍然可用）。
        return columns + (" ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), "
                          "password_hash=VALUES(password_hash), apps=VALUES(apps), disabled=VALUES(disabled)")
    return columns + (" ON CONFLICT (username) DO UPDATE SET display_name=EXCLUDED.display_name, "
                      "password_hash=EXCLUDED.password_hash, apps=EXCLUDED.apps, disabled=EXCLUDED.disabled")


def registered_apps(path: Path) -> set[str]:
    """注册表里的应用 id；读不到就返回空集合（只用于提示，不做拦截）。"""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return set()
    apps = data.get("apps") if isinstance(data, dict) else data
    if not isinstance(apps, list):
        return set()
    return {str(entry.get("id")) for entry in apps if isinstance(entry, dict) and entry.get("id")}


def warn_unknown_apps(ids: list[str], registry_path: Path) -> None:
    """授权里出现注册表没有的 id 时提醒一句：这种条目不报错，只是访客页上不显示（打错字也算）。"""
    known = registered_apps(registry_path)
    unknown = [app_id for app_id in ids if app_id not in known]
    if known and unknown:
        print(f"注意：{'、'.join(unknown)} 不在 {registry_path.name} 里，访客页上不会显示它。"
              f"现有：{'、'.join(sorted(known))}")


def apps_value(ids: list[str]) -> str:
    """数据库的 apps 列是 varchar(255)，超了会在驱动层报“Data too long”，这里先给一句人能懂的。"""
    value = ",".join(ids)
    if len(value) > 255:
        raise SystemExit(f"授权列表 {len(value)} 字符，超过数据库 apps 列的 255；"
                         "少授几个应用，或把 visitor_accounts.apps 改成 TEXT。")
    return value


def run_database(args, key: str) -> int:
    url = args.db_url or read_env_value(args.db_env, "DATABASE_URL")
    if not url:
        raise SystemExit(f"{args.db_env} 里没有 DATABASE_URL；用 --db-url 指定，或先按部署文档配好。")
    target = parse_db_url(url)
    registry = read_env_value(args.db_env, "VISITOR_APPS_PATH") if args.db_env else None
    registry_path = Path(registry) if registry else Path(__file__).resolve().parents[1] / "work" / "visitor-apps.json"
    connection = db_connect(target)
    cursor = connection.cursor()
    try:
        try:
            if args.list:
                cursor.execute("SELECT username, display_name, apps, disabled FROM visitor_accounts ORDER BY username")
                rows = cursor.fetchall()
                if not rows:
                    print("数据库里还没有访客账号。")
                for username, name, apps, disabled in rows:
                    state = "已停用" if disabled else "可用"
                    print(f"- {username}（{name}）{state} · {'、'.join(filter(None, (apps or '').split(','))) or '无应用'}")
                return 0

            if args.remove:
                cursor.execute("DELETE FROM visitor_accounts WHERE username=%s", (key,))
                if not cursor.rowcount:
                    raise SystemExit(f"数据库里没有找到访客 {key}。")
                print(f"已从数据库删除访客：{key}")
                return 0

            if args.disable or args.enable:
                cursor.execute("UPDATE visitor_accounts SET disabled=%s WHERE username=%s", (0 if args.enable else 1, key))
                if not cursor.rowcount:
                    raise SystemExit(f"数据库里没有找到访客 {key}。")
                print(f"已{'启用' if args.enable else '停用'}访客：{key}")
                return 0

            # 先取一次现有行：--name/--apps 省略时要保留原有值（文件模式就是这个语义），
            # 顺带知道账号在不在，省得靠 UPDATE 的行数去猜。
            cursor.execute("SELECT display_name, apps, disabled FROM visitor_accounts WHERE username=%s", (key,))
            row = cursor.fetchone()
            existing = [item for item in ((row[1] if row else "") or "").split(",") if item]
            granted = parse_apps(args.apps, existing)
            name = args.name or (row[0] if row else None) or normalize_username(args.username)
            # 停用的账号不因为改密码就被悄悄放行：要恢复得显式 --enable。
            disabled = 0 if row is None else int(bool(row[2]))
            warn_unknown_apps(granted, registry_path)

            if args.apps is not None and not args.generate and not args.password and not args.ask_password:
                # 只改授权：不动密码，给一批访客批量加应用时不该顺手重置他们的口令。
                if row:
                    cursor.execute("UPDATE visitor_accounts SET apps=%s WHERE username=%s", (apps_value(granted), key))
                    print(f"已更新授权：{key}（密码没动；要一起改密码就加上 --ask-password，或用 --generate / --password）")
                    return 0
                # 账号还不存在：往下走交互式设密码，把他连着授权一起建出来。
                print(f"数据库里还没有 {key}，输入密码即可创建。")

            password = choose_password(args)
            cursor.execute(upsert_sql(target["kind"]), (
                key, name, hash_password(password), apps_value(granted), disabled,
            ))
            print(f"已写入数据库：{key}（{name}）")
            print(f"可用应用：{'、'.join(granted) or '（无）'}")
            if args.generate or args.password:
                print(f"密码（只显示这一次，请自己保存）：{password}")
            return 0
        finally:
            cursor.close()
    except Exception as error:  # noqa: BLE001 - 驱动异常类型太多，统一给出可读提示
        if type(error).__name__ in ("ProgrammingError", "OperationalError") and "visitor_accounts" in str(error):
            raise SystemExit("数据库里还没有 visitor_accounts 表：先启动一次后端（它会自动建表），再跑这个命令。") from None
        raise
    finally:
        connection.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="维护访客模式的账号名单")
    parser.add_argument("username", nargs="?", help="访客名（不区分大小写，会规范化成小写）")
    parser.add_argument("--name", help="显示给访客看的名字，默认与访客名相同")
    parser.add_argument("--apps", help="授权给该访客的应用 id，逗号分隔（如 our-space,guest-book）；none 表示清空；不改动就省略")
    parser.add_argument("--password", help="直接给定密码（会留在命令历史里，不推荐）")
    parser.add_argument("--ask-password", action="store_true",
                        help="交互输入密码（不进命令历史）；和 --apps 一起用就能一次设好密码与授权")
    parser.add_argument("--generate", action="store_true", help="生成 20 位随机密码并打印一次")
    parser.add_argument("--file", type=Path, default=DEFAULT_PATH, help=f"访客名单路径，默认 {DEFAULT_PATH}")
    parser.add_argument("--list", action="store_true", help="列出已有访客")
    parser.add_argument("--remove", action="store_true", help="删除该访客")
    parser.add_argument("--disable", action="store_true", help="停用该访客（保留记录）")
    parser.add_argument("--enable", action="store_true", help="重新启用该访客")
    parser.add_argument("--sql", action="store_true", help="额外打印数据库 INSERT 语句")
    parser.add_argument("--db", action="store_true", help="直接写数据库的 visitor_accounts 表（不必自己拼哈希）")
    parser.add_argument("--db-env", type=Path, default=DEFAULT_ENV_PATH,
                        help=f"从哪个环境文件读 DATABASE_URL，默认 {DEFAULT_ENV_PATH}")
    parser.add_argument("--db-url", help="直接给出数据库连接串，覆盖 --db-env")
    args = parser.parse_args()

    if args.db:
        if args.list:
            return run_database(args, "")
        if not args.username:
            raise SystemExit("数据库模式要给出访客名，或者用 --db --list 看现有账号。")
        key = normalize_username(args.username)
        if not key or len(key) > 64:
            raise SystemExit("访客名需要 1 到 64 个字符。")
        return run_database(args, key)

    data = load(args.file)
    if args.list or not args.username:
        if not data["visitors"]:
            print("访客名单为空。" if args.list else f"访客名单为空；添加：python scripts/add-visitor.py <访客名> --generate")
            return 0
        for entry in data["visitors"]:
            state = "已停用" if entry.get("disabled") else "可用"
            apps = "、".join(entry.get("apps", [])) or "无应用"
            print(f"- {entry.get('username')}（{entry.get('name')}）{state} · {apps}")
        return 0

    key = normalize_username(args.username)
    if not key or len(key) > 64:
        raise SystemExit("访客名需要 1 到 64 个字符。")

    if args.remove or args.disable or args.enable:
        entry = find(data, key)
        if entry is None:
            raise SystemExit(f"没有找到访客 {key}。")
        if args.remove:
            data["visitors"].remove(entry)
            print(f"已删除访客：{key}")
        else:
            entry["disabled"] = bool(args.disable)
            print(f"已{'停用' if args.disable else '启用'}访客：{key}")
        save(args.file, data)
        return 0

    if args.apps is not None and not args.generate and not args.password and not args.ask_password:
        # 只改授权：不动密码，这样给已有访客加应用不需要重置口令。
        entry = find(data, key)
        if entry is not None:
            entry["apps"] = parse_apps(args.apps, list(entry.get("apps", [])))
            if args.name:
                entry["name"] = args.name
            save(args.file, data)
            print(f"可用应用：{'、'.join(entry['apps']) or '（无）'}")
            print("（密码没动；要一起改密码就加上 --ask-password，或用 --generate / --password）")
            print("改完立刻生效：访客名单是每个请求实时读取的，不用重启后端。")
            return 0
        print(f"名单里还没有 {key}，输入密码即可创建。")

    password, password_hash = set_password(args, data, key)
    save(args.file, data)
    if args.generate or args.password:
        print(f"密码（只显示这一次，请自己保存）：{password}")
    if args.sql:
        print_sql(args, key, password_hash)
    print("改完立刻生效：访客名单是每个请求实时读取的，不用重启后端。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
