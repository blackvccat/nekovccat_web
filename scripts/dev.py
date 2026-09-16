"""Manage this checkout's frontend and backend development processes.

Usage: backend/.venv/bin/python scripts/dev.py start|status|stop
"""
from pathlib import Path
import argparse
import json
import os
import signal
import socket
import subprocess
import sys
import time
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / "work"
SERVICES = {
    "backend": (8010, ROOT / "backend", [str(ROOT / "backend/.venv/bin/python"), "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8010"], "/health"),
    "frontend": (3010, ROOT / "frontend", ["npm", "run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3010"], "/api/health"),
}


def pid_file(name):
    return WORK / f"marcus-{name}.pid"


def owned_pid(name):
    try:
        pid = int(pid_file(name).read_text())
        os.kill(pid, 0)
        # Check the actual process working directory before trusting a stale PID.
        result = subprocess.run(["lsof", "-a", "-p", str(pid), "-d", "cwd", "-Fn"], capture_output=True, text=True)
        if any(line.startswith("n" + str(ROOT) + "/") or line == "n" + str(ROOT) for line in result.stdout.splitlines()):
            return pid
    except (OSError, ValueError):
        pass
    return None


def listening(port):
    with socket.socket() as connection:
        connection.settimeout(0.3)
        return connection.connect_ex(("127.0.0.1", port)) == 0


def healthy(port, path):
    try:
        with urlopen(f"http://127.0.0.1:{port}{path}", timeout=3) as response:
            return response.status == 200
    except Exception:
        return False


def internal_token():
    """访客模式的登录凭证由后端签名、前端校验；缺失时生成一个写进 backend/.env。"""
    env_path = ROOT / "backend" / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8", errors="replace").splitlines():
            key, separator, value = line.partition("=")
            if separator and key.strip() == "INTERNAL_API_TOKEN":
                token = value.strip().strip('"').strip("'")
                if len(token) >= 32:
                    return token
    token = os.urandom(32).hex()
    if env_path.exists():
        with env_path.open("a", encoding="utf-8") as handle:
            handle.write("\n# 前后端共享的内部令牌：访客模式用它签发和校验授权，至少 32 位；由 dev.py 首次发现缺失时生成。\n")
            handle.write(f"INTERNAL_API_TOKEN={token}\n")
        print("Generated INTERNAL_API_TOKEN and appended it to backend/.env (visitor mode needs it).")
    else:
        print("backend/.env is missing; visitor mode login will stay unavailable.")
    return token


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["start", "status", "stop"])
    args = parser.parse_args()
    WORK.mkdir(exist_ok=True)
    if args.action == "start":
        # Validate all ports before creating any process.
        for name, (port, _, _, _) in SERVICES.items():
            if listening(port) and not owned_pid(name):
                sys.exit(f"Port {port} is occupied by another process; left untouched.")
    for name in (reversed(SERVICES) if args.action == "stop" else SERVICES):
        port, cwd, command, path = SERVICES[name]
        pid = owned_pid(name)
        if args.action == "stop":
            if pid:
                if os.getpgid(pid) != pid:
                    sys.exit(f"Refusing to signal an unowned process group for {name}.")
                os.killpg(pid, signal.SIGTERM)
                pid_file(name).unlink(missing_ok=True)
                print(f"Stopped {name}.")
            continue
        if args.action == "start" and not pid:
            environment = os.environ.copy()
            # Both services share one internal token: the backend signs visitor proofs the frontend verifies.
            environment.update({"PYTHONUNBUFFERED": "1", "INTERNAL_API_TOKEN": internal_token(),
                                "CORS_ORIGINS": json.dumps(["http://127.0.0.1:3010", "http://localhost:3010"])})
            if name == "frontend":
                environment.update({"PYTHON_API_URL": "http://127.0.0.1:8010", "NEXT_PUBLIC_APP_URL": "http://127.0.0.1:3010/terminal"})
            with (WORK / f"marcus-{name}.log").open("ab") as log:
                proc = subprocess.Popen(command, cwd=cwd, env=environment, stdin=subprocess.DEVNULL, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
            pid_file(name).write_text(str(proc.pid) + "\n")
            pid = proc.pid
            deadline = time.monotonic() + 55
            while time.monotonic() < deadline and proc.poll() is None:
                if healthy(port, path):
                    break
                time.sleep(0.5)
        ready = healthy(port, path)
        print(f"{name}: {'ready' if ready and pid else 'not ready'} — http://127.0.0.1:{port} (PID {pid or '-'})")
        if args.action == "start" and not ready:
            sys.exit(f"Check work/marcus-{name}.log.")


if __name__ == "__main__":
    main()
