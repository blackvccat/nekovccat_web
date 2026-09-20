# 本地开发环境说明（Windows）

这份文档说明本机已经装好的环境，以及每天怎么用。

## 已经装好的东西

| 项目 | 位置 | 说明 |
| --- | --- | --- |
| Python 3.12.10 | `%LOCALAPPDATA%\Programs\Python\Python312` | 项目要求 3.11/3.12；原本的 3.13/3.14 装不上锁定的依赖 |
| 后端虚拟环境 | `backend\.venv` | 依赖已装全，含 72MB 的 Harness 原生运行时 |
| 前端依赖 | `frontend\node_modules` | 已执行 `npm ci`，426 个包 |
| 后端配置 | `backend\.env` | 本地参数已配好，**只差 DeepSeek 密钥** |
| 访客账号 | `work\visitor-accounts.json` | 访客名、密码哈希与每人可用的应用 |
| 访客应用 | `work\visitor-apps\<id>\app.json` | 一个应用一个文件夹：该应用的元数据与能力声明（后端持有） |
| 访客应用私有素材 | `work\visitor-apps\<id>\assets\` | 该应用自己的图标与壁纸，登录后经后端下发 |

`work/` 已被 `.gitignore` 排除，里面的内容不会被提交。

## 每天怎么用

**启动：在 `scripts` 文件夹里双击 `dev-win.bat`。**

不带参数就是启动。脚本会自己判断、自己等编译完成，最后会明确告诉你结果：

- 成功时打印「启动成功：两个服务都在运行」，列出地址，**并自动打开浏览器**
- 失败时打印「[失败] …」并指出是哪个服务、为什么，还会把它日志的最后几行贴出来

改用命令行也可以：

```bat
cd scripts
dev-win.bat             启动（等同于 start）
dev-win.bat status      查看是否在运行
dev-win.bat stop        停止
dev-win.bat restart     重启（改完后端代码却没生效时用这个）
```

启动后会有两个新窗口（前后端各一个），**那里是实时日志，不要关掉**。同一个日志同时写入文件，出问题时把文件发我即可：

- `work\marcus-backend.log`
- `work\marcus-frontend.log`

启动后等 10-30 秒（前端首次要编译），然后打开：

- 桌面入口　　http://127.0.0.1:3010/terminal
- 接口文档　　http://127.0.0.1:8110/docs

## 在 VS Code 里开发（实时预览）

### 先记住一件事

**不要用 Live Server 和 PHP Live Server 这两个扩展**，它们只适用于纯 HTML/PHP 站点，右键"Open with Live Server"对这个项目无效。

这个项目的做法是：**开发服务器自己就是预览器**。你只需要开着它，改完代码保存，浏览器会自动更新。

### 一次性准备

1. 打开 VS Code，`文件 → 打开文件夹`，选择 **`O:\WEBSITE\nekovccat_web-main`**（整个项目根目录，不是单个文件）
2. 右下角会弹出「此工作区推荐的扩展」，点安装。推荐的是 Python、ESLint、Prettier、Tailwind CSS IntelliSense
3. 已经帮你配好了 `.vscode/` 里的设置：Python 解释器指向 `backend\.venv`、排除 `node_modules`/`.next` 降低 CPU 占用

### 日常流程

1. 按 `Ctrl + Shift + B` 启动本地环境（或者 `终端 → 运行任务 → 启动本地环境`）
2. 等窗口出现「启动成功」，浏览器会自己打开
3. **改代码 → 保存 → 浏览器自动刷新**，不用做任何额外操作

停止用「停止本地环境」任务，查看状态用「查看本地环境状态」。

### 什么能实时更新，什么不能

| 改什么 | 效果 |
| --- | --- |
| 前端页面、组件、样式（`frontend/src/`） | 保存即刷新，**最快** |
| 后端 Python（`backend/app/`） | 自动重启后端，约 1-2 秒 |
| `frontend/next.config.ts` | **不会热更新**，要停止再启动 |
| `backend/.env` | **不会热更新**，要停止再启动 |
| `work/visitor-apps/`（访客应用目录） | 立即生效，不用重启 |
| `work/visitor-accounts.json`（访客名单） | 立即生效，不用重启 |

### 预览必须用普通浏览器（重要）

**不要用 VS Code 内嵌的预览看这个站**，包括：

- `Simple Browser: Show` 命令
- Live Preview / Live Server 扩展

它们要么不支持 Next.js 的热更新 WebSocket，要么只认静态文件，结果是**页面能打开但改动不会自动同步**。这不是项目坏了，是预览器的问题。

正确做法：用默认浏览器（Edge / Chrome）打开 `http://127.0.0.1:3010`。VS Code 里按 `Ctrl+Shift+P` → `运行任务` → **在浏览器中打开预览**，就会用你的默认浏览器打开。

### 怎么确认自己看的是"活的"页面

开发模式下，**页面左下角会有一个 Next.js 的圆形标记**（`nextjs-portal`）。

- 看到它 → 你连的是开发服务器，改代码保存就会自动同步
- **看不到它** → 你打开的不是开发服务器，检查地址栏是不是 `http://127.0.0.1:3010`（不是 3011，也不是 `file:///...` 开头的本地文件路径）

### 改动不生效时按顺序检查

1. **地址栏是 `http://127.0.0.1:3010` 吗？**（`localhost:3010` 也可以）
2. **左下角有 Next.js 标记吗？** 没有就是打开错了地方
3. **页面是在服务启动之前打开的吗？** 如果是，按一次 `F5` 刷新。服务器重启过之后，旧标签页里的热更新连接是断的，刷新一次就恢复
4. **确认服务在运行**：VS Code 里运行「查看本地环境状态」任务
5. **改的文件是不是这两处**：`frontend/next.config.ts` 和 `backend/.env` 不会热更新，要停止再启动
6. **按 `F12` 看控制台有没有红色报错**，有就发我

### 调试（可选）

左侧「运行和调试」（`Ctrl + Shift + D`）里有两个配置：

- **调试后端 (FastAPI)**：能打断点
- **调试前端 (Next.js 服务端)**：能调试服务端渲染逻辑

注意：它们会自己占用 8110 / 3010 端口，所以用之前先执行「停止本地环境」，别和开发服务器同时跑。

## 如果启动失败

脚本会把原因直接打在窗口里，常见的两种：

| 窗口里显示 | 含义与处理 |
| --- | --- |
| `[失败] 缺少 backend\.venv` | 后端环境没了，重新执行首次安装 |
| `[失败] 缺少 frontend\node_modules` | 前端依赖没了，在 `frontend` 里跑 `npm ci` |
| `[提示] 端口 … 已在运行，直接复用` | 不是错误，服务本来就在跑 |
| `[失败] 后端没有就绪` + 日志 | 把窗口内容发我，或看 `work\marcus-backend.log` |

`stop` 只会关闭本项目的进程：它先看端口上的进程名是不是 `node`/`python`/`cmd`/`powershell`，不是就跳过并提示，不会误杀别的程序。

## 必须自己填的两样东西

### 1. DeepSeek 密钥（不填就没有 AI 回复）

到 <https://platform.deepseek.com> 申请，然后编辑 `backend\.env`：

```dotenv
DEEPSEEK_API_KEY=你的密钥
```

改完要**重启**才生效：`dev-win.bat stop` 再双击 `dev-win.bat`。

不填也能用，只是聊天时会提示「DeepSeek 尚未配置，请联系站点管理员。」，其它页面都正常。

### 2. 访客模式账号、正文与壁纸

访客模式是桌面上那个隐藏空间：打开桌面的「访客模式」窗口，输入访客名与密码，服务器校验通过后才会显示正文并换上专属壁纸。

登录靠一个前后端共享的 `INTERNAL_API_TOKEN`（后端用它签发短期凭证，前端用同一个值校验）：`dev-win.bat start` 会先读 `backend\.env`，没有就自动生成一个 64 位随机值写进去，并把同一个值传给前端，所以本地开箱可用。手工启动两个服务时要自己保证两边一致且不少于 32 个字符，否则登录会返回「访客模式尚未就绪，请联系站点管理员。」

用脚本添加账号（密码只以哈希写入 `work\visitor-accounts.json`）：

```bat
cd ..
python scripts\add-visitor.py marcus --name Marcus --generate
python scripts\add-visitor.py --list
python scripts\add-visitor.py marcus --disable
python scripts\add-visitor.py marcus --remove
```

- `--generate` 会生成 20 位随机密码并只打印一次；不带 `--generate` 时会让你手动输入两遍。
- 加账号、改密码**立刻生效**，不用重启后端；反复登录失败会被临时锁定（默认 10 次/15 分钟）。
- 想把账号放进数据库：把 `backend\.env` 的 `DATABASE_ENABLED` 改成 `true`，指向 MySQL 或 PostgreSQL，后端启动时会自动建表 `visitor_accounts`；然后用 `--db` 直接增删改，不用自己拼哈希，也不用手写 SQL：

  ```bash
  python scripts\add-visitor.py leo --name Leo --generate --apps our-space --db   # 添加/改密码
  python scripts\add-visitor.py --db --list                                      # 看数据库里有哪些
  python scripts\add-visitor.py leo --apps files --db                            # 只改授权，不动密码
  python scripts\add-visitor.py leo --db --disable                               # 停用（--enable 改回来）
  python scripts\add-visitor.py leo --db --remove                                # 删除
  ```

  服务器上跑的话用后端的 venv：`/srv/marcusweb/current/backend/.venv/bin/python scripts/add-visitor.py …`，连接串默认从 `/etc/marcusweb/backend.env` 的 `DATABASE_URL` 读（也可 `--db-url` 直接给）。**JSON 文件里的账号不会因此失效**——两份会合并读取，只有同一个名字同时出现在两边时才会被拒绝。MySQL 需要 `aiomysql`（Web 端用）与 `PyMySQL`（脚本用），两个都在 `requirements.txt` 里。表结构、参数规则（`--ask-password` 与"只改授权"的区别）、怎么加新应用，都写在 [../deployment/DATABASE.md](../deployment/DATABASE.md)。

访客应用是**一个应用一个文件夹**：`work\visitor-apps\<id>\app.json` 是元数据与能力声明，`entry` 指向的同目录 HTML（以及它引用的 js/css/图片）就是应用界面。界面在**登录后由服务器下发**，宿主用同源 iframe 承载——所以登录前前端产物里没有任何应用界面或素材。想加或搬一个应用，就复制一个 `<id>/` 文件夹（`app.json` + 入口 HTML + `assets/`），再用 `add-visitor.py <访客名> --apps <id>` 授权给某个访客。应用图标与壁纸放**它自己的** `assets/`，在 `app.json` 里用文件名引用（例：`"wallpaper": "seagull.jpg"`）；窗口尺寸写 `"window": {"width": 560, "height": 580}`。要上传或读写数据就在 `permissions` 里申请 `files` / `data`；要内嵌第三方页面就写 `embeds`。完整字段表与写法见 `docs/visitor-app-example/README.md`。

> 这些数据都不进前端包：应用视图与素材只经后端授权接口返回，登录前前端里没有任何应用素材；访客名单只在后端校验时读取。文件缺失只影响访客模式本身（返回「尚未配置」），不会让聊天 503。

## 网易云歌单为什么有 50 首

MARCUS Music 里加载网易云歌单时，官方外链播放器**自己的列表固定只给 10 首** —— 它内部拼的查询没有 `n` 参数，我们在播放器地址上怎么写都没用（实测加 `&n=50` 依旧 10 首）。但同一个接口只要带上 `n`，匿名请求也能给更多，所以：

- 后端 `GET /api/music/netease/playlist/{歌单id}?limit=50` 取前 N 首（`DEFAULT_TRACKS = 50`，上限 100，结果缓存 5 分钟）；`/api/music` 和聊天、访客接口一样要求共享 token。
- 歌单分两种脾气：**官方榜单**认 `n`，一次请求就把 50 首给全；**用户自建歌单**不认 `n`，无论怎么写都只内联前 10 首（`trackCount` 却是真实总数），这时按响应里的 `trackIds` 把缺的那些用 `/api/song/detail` 补齐 —— 所以「42 首」的歌单能列出 42 首。
- 前端 `/api/music/playlist?id=…&limit=50` 转发给后端（浏览器跨域直连不了网易云）。
- 音乐窗口里渲染成「歌单曲目」列表：点哪首就用官方**单曲**播放器播哪首，播放器下方那份列表会一直留着。

想改数量：前端 `frontend/src/lib/music/playlist.ts` 的 `PLAYLIST_TRACK_LIMIT` 与后端 `backend/app/services/netease_music.py` 的 `DEFAULT_TRACKS`/`MAX_TRACKS` 一起改。后端出网被限制时这个接口返回 503，界面只是不显示曲目列表，官方播放器本身照常工作。

## 改 MARCUS Music 的歌单

MARCUS Music 窗口点一下就展开，右边列出「歌单」，点一行就直接用官方播放器播放。这一列的内容写在 `frontend\src\lib\music\marcus-favorites.json` 里：

```json
{ "name": "列表里显示的名字", "url": "https://music.163.com/song?id=…", "note": "可选的一句话" }
```

- `url` 必须是网易云或 Spotify 的完整分享链接（歌曲、歌单都行），和粘贴到输入框里的链接规则一样；短链接、`javascript:`、站外地址会被跳过。
- 现在那一条是示例（网易云官方的热歌榜），直接改 `name` 与 `url` 就是你的歌单。改完刷新页面即可，不用重启前端。
- 链接写错不会让页面崩，只是那一行不显示；跑 `npm test` 会直接告诉你是哪一行有问题。

## 改图标（桌面图标与访客应用的图标）

图标不再写在代码里 —— 每个图标就是一个 SVG 文件，画稿都在 `work\icons-svg\`。`pixel-icon.tsx` 只剩一张「名字 → 文件名」的表（例如 `visitor: 'login.svg'`），访客应用的图标则由后端按下发地址。改完画稿跑一次同步就生效：

```bat
python scripts\pixel-icons.py sync      # 画稿 → 站点（公开目录 + 访客私有素材）
python scripts\pixel-icons.py preview   # 生成 work\icons-preview.html，按真实尺寸看一遍
python scripts\pixel-icons.py export    # 画稿 → work\icons\*.png（想按像素改的时候用）
python scripts\pixel-icons.py build     # PNG → 画稿（把改好的 PNG 变成 24×24 矢量像素）
```

`sync` 按「这个文件是不是访客应用的图标」分成两处：

| 画稿 | 同步到 | 谁能看到 |
| --- | --- | --- |
| 公开图标（`agent.svg`、`login.svg`、`explorer.svg`…） | `frontend\public\icons-svg\` | 所有人，随页面一起请求 |
| 访客应用 `app.json` 里被 `"icon"` 引用的文件（如 `our-room.svg`） | `work\visitor-apps\<id>\assets\` | 只有登录后被授权的访客，经 `/api/visitor/asset?app=<id>&kind=icon` 取 |

私有文件如果出现在公开目录里，`sync` 会删掉它并提示 —— 这是「登录前前端不留任何应用痕迹」那条规矩的执行点。

- 画稿两种都行：**矢量路径**（我原来的图标就是 24×24 网格上的矩形，只认直线 `M/L/H/V/Z`，有曲线会报错并指出是哪个文件）和**内嵌 PNG**（Figma / Illustrator 导出常见，浏览器照常渲染）。
- `export` 对矢量画稿导出 24×24 的 PNG（另存 8 倍放大图）；对「SVG 包着 PNG」的画稿则把里面那张 PNG 原样导出来给你改。
- `build` 把 PNG 变回**矢量像素画**（24×24 网格、图形裁到边界居中）。对「内嵌 PNG」的画稿来说这是一次格式转换：内嵌位图会被换成矩形路径，画稿文件里就没有那张 PNG 了 —— 所以它只处理你真正改过的 PNG，没动过的会跳过。
- 只想微调几个像素：`export` → 用画图软件改 `work\icons\` 里的 PNG → `build` → `sync`。想直接改画稿文本也行，改完直接 `sync`。
- 图标文件都进了版本库（`frontend/public/icons-svg/`），`work\icons\`（PNG）与 `work\icons-preview.html` 是本地中间产物，删掉重新 `export` 即可。
- 加一个新图标：把 SVG 丢进 `work\icons-svg\`，在 `pixel-icon.tsx` 的表里加一行（名字要同时加进 `PixelIconName`），再 `sync`。访客应用的图标不用改代码，在对应应用的 `work\visitor-apps\<id>\app.json` 里写 `"icon": "文件名.svg"` 即可（文件放它自己的 `assets\`）。

## 改代码后怎么看效果

前端是热更新：改完保存，浏览器自动刷新，不用重启。

后端（`backend/app/` 里的 Python 代码）已开启自动重载：改完保存会自动重启，约 1-2 秒。日志里会出现 `WatchFiles detected changes ... Reloading...`。

`frontend/next.config.ts` 和 `backend/.env` 这两处改动**不会**自动生效，要 `dev-win.bat stop` 再启动。

## 部署到 VPS 的思路

采用「本地构建、上传成品」的方式，服务器上不需要写代码：

1. 本地改代码、本地预览确认
2. 本地 `npm run build` 出成品
3. 把成品连同 `backend/`、`agent/` 一起传上去
4. 服务器上只用 systemd 把两个服务跑起来

命令和服务器侧的一次性配置见 `deployment/README.md`。服务器上**必须自己创建**的东西：

- `/var/lib/marcusweb-private/visitor-accounts.json`（访客名、密码哈希与授权应用；用 `--sql` 放进数据库时不需要）
- `/var/lib/marcusweb-private/visitor-apps/`（访客应用：一个应用一个文件夹，`<id>/app.json` + `<id>/assets/`）
- `/etc/marcusweb/` 下前后端两个 env 文件里的 `INTERNAL_API_TOKEN` 必须一致且**至少 32 个字符**

另外，standalone 产物的工作目录是 `.next/standalone`，相对路径的默认值会失效，所以 `backend.env` 里**必须显式写明** `VISITOR_ACCOUNTS_PATH`、`VISITOR_APPS_DIR` 的绝对路径；前端不需要私有路径，只持有签名 Cookie。

## 为什么另外写了脚本

项目自带的 `scripts/dev.py` 是给 macOS/Linux 写的，用到 `lsof` 和 `.venv/bin/python` 这类 Windows 上不存在的命令和路径，所以另外做了三个文件：

- `dev-win.bat` —— 双击入口，只负责转交给 PowerShell
- `dev-win.ps1` —— 真正的逻辑，中文提示都在这里
- 本文件 —— 中文说明

`dev-win.bat` 里刻意只写英文：cmd.exe 解析含中文的批处理文件时会出错（多字节字符会让解析器错位，出现 `illwindow`、`ortbusy` 这类截断），试过 UTF-8 和 GBK 两种编码都会坏，所以中文全部交给 PowerShell 输出。
