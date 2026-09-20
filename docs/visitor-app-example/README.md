# 真实访客应用示例：Notebook

这是一个可以直接复制使用的**真实访客应用**（不是区块数据）：界面是 HTML/JS，数据存后端、文件上传到后端、可以内嵌第三方页面。它演示了完整契约。

## 装成一个真实应用

```bash
# 1. 复制到服务器侧的应用目录（开发机上就是 work/visitor-apps/）
cp -r docs/visitor-app-example work/visitor-apps/notebook

# 2. 授权给某个访客（整份替换，记得带上原有的）
python scripts/add-visitor.py <访客名> --apps notebook

# 3. 让访客刷新登录状态即可，无需改代码、无需重新编译
```

## `app.json` 字段

| 字段 | 说明 |
| --- | --- |
| `apiVersion` | 固定 `1` |
| `id` | 必须等于文件夹名 |
| `title` / `subtitle` | 桌面图标与窗口标题 |
| `entry` | 入口 HTML 文件名（必填）。应用的界面就由它提供 |
| `permissions` | 申请的能力：`files`（上传/下载文件）、`data`（键值数据）。不写就都没有 |
| `embeds` | 允许内嵌的第三方源，形如 `["https://www.youtube.com"]`（只收 `https://` origin） |
| `window` | 可选窗口尺寸 `{width, height}`（默认 560×580） |
| `icon` / `wallpaper` / `watermark` | 可选，素材放在本应用的 `assets/`，登录后经授权下发 |

## 应用能用的接口（相对 shell 地址）

应用在**同源 iframe**里运行，shell 地址是 `/api/visitor/app-proxy/apps/<id>/shell`，所以相对路径都落在同一前缀下：

| 相对路径 | 方法 | 作用 |
| --- | --- | --- |
| `data` | GET | 读回全部键值 `{ "data": { key: value } }` |
| `data/<key>` | PUT / DELETE | 写 / 删一个键（值是 JSON） |
| `files` | GET | 列出已上传文件 `{ "files": [{name, size, updatedAt}] }` |
| `files/<name>` | PUT / GET / DELETE | 上传（请求体就是文件字节）/ 下载 / 删除 |

上层走的是受控转发口 `/api/visitor/app-proxy/...`：只转发到后端 `/api/visitor/apps/<id>/…`，凭据只留在宿主的 HttpOnly Cookie，应用拿不到；后端每次都按账号复核「这个访客有没有这个应用、有没有申请该能力」。

## 限制

- 单个数据值 ≤ 64 KB，每个应用每个访客 ≤ 200 条；
- 单个文件 ≤ 8 MB，每个应用每个访客 ≤ 200 个；
- 文件名只允许字母、数字、点、下划线、空格、连字符。

## 内嵌第三方

在 `app.json` 的 `embeds` 里声明源，然后在 HTML 里正常写 `<iframe src="https://…">` 即可。宿主的安全策略已放开 `frame-src`（`'self' https:`），所以第三方源也要由你自己把关。

## 为什么前端里没有它

应用界面是**登录后由后端下发的 HTML**，宿主只用一个同源 iframe 承载。所以：

- 登录前、以及没有服务器下发时，前端产物里**不存在**这个应用的任何界面、文案或素材；
- 应用代码也拿不到访客凭据（Cookie 在宿主，应用只是同源页面）。

## 安全边界

按当前设计，访客应用**只由站点主人编写**（同源 iframe，`sandbox` 里带 `allow-same-origin`）。如果以后要接受他人提交的应用，必须改成更强的隔离（独立源 + 只经 `postMessage` 过桥），那是另一套。
