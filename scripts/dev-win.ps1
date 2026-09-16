# MARCUS 本地开发环境控制脚本（Windows）
# 由 dev-win.bat 调用；也可以右键“使用 PowerShell 运行”。
# 用法: dev-win.bat [start|stop|status]        不带参数 = start
param(
  [string]$Action = 'start',
  [switch]$NoPause    # 供 VS Code 任务等非交互场合调用：结束后不等待按键
)

$ErrorActionPreference = 'Continue'
$root    = Split-Path -Parent $PSScriptRoot
$work    = Join-Path $root 'work'
$bPort   = 8010
$fPort   = 3010
$bLog    = Join-Path $work 'marcus-backend.log'
$fLog    = Join-Path $work 'marcus-frontend.log'
$bUrl    = "http://127.0.0.1:$bPort/health"
$fUrl    = "http://127.0.0.1:$fPort/api/health"
$homeUrl = "http://127.0.0.1:$fPort/terminal"

if (-not (Test-Path $work)) { New-Item -ItemType Directory -Path $work | Out-Null }

function Write-Head([string]$Text) {
  Write-Host ''
  Write-Host ('=' * 46) -ForegroundColor DarkCyan
  Write-Host "  $Text" -ForegroundColor Cyan
  Write-Host ('=' * 46) -ForegroundColor DarkCyan
}
function Write-Ok([string]$Text)   { Write-Host "  [成功] $Text" -ForegroundColor Green }
function Write-Bad([string]$Text)  { Write-Host "  [失败] $Text" -ForegroundColor Red }
function Write-Info([string]$Text) { Write-Host "  [提示] $Text" -ForegroundColor Yellow }

function Test-PortFree([int]$Port) {
  $c = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
  return (-not $c)
}
function Get-PortPid([int]$Port) {
  $c = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
  if ($c) { return ($c | Select-Object -First 1).OwningProcess }
  return $null
}
function Wait-Healthy([string]$Url, [int]$Seconds) {
  $end = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $end) {
    try {
      $r = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing
      if ($r.StatusCode -eq 200) { return $true }
    } catch { }
    Start-Sleep -Milliseconds 800
  }
  return $false
}
function Show-LogTail([string]$Path, [string]$Label) {
  if (-not (Test-Path $Path)) { return }
  Write-Host ''
  Write-Host "  ---- $Label 日志最后若干行 ($Path) ----" -ForegroundColor DarkGray
  # 不指定 -Encoding：Tee-Object 写出的是带 BOM 的 UTF-16，交给 Get-Content 自动识别。
  # PowerShell 5.1 会把原生命令的 stderr 记成错误对象，在日志里插入几行格式化的错误信息；
  # 这里按模式过滤掉，只留下服务本身输出的内容。
  $noise = '^(所在位置 行:|\s*\+ |python\.exe : |node\.exe : |npm\.cmd : |NativeCommandError)'
  Get-Content -Path $Path -Tail 80 -ErrorAction SilentlyContinue |
    Where-Object { $_ -notmatch $noise } |
    Select-Object -Last 15 |
    ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
  Write-Host '  ----------------------------------------' -ForegroundColor DarkGray
}

function Get-InternalToken {
  # 访客模式的登录凭证由后端用 INTERNAL_API_TOKEN 签名、前端用同一个值校验；
  # 本地没有就生成一个写进 backend\.env（该文件不进 Git），前后端共用同一个值。
  $envPath = Join-Path $root 'backend\.env'
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  if (Test-Path $envPath) {
    $text = [System.IO.File]::ReadAllText($envPath, $utf8)
    if ($text -match '(?m)^\s*INTERNAL_API_TOKEN\s*=\s*([^\r\n#]+)') {
      $token = $Matches[1].Trim().Trim('"')
      if ($token.Length -ge 32) { return $token }
    }
  }
  $token = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
  if (Test-Path $envPath) {
    $block = "`r`n# 前后端共享的内部令牌：访客模式用它签发和校验授权，至少 32 位；由 dev-win 首次发现缺失时生成。`r`nINTERNAL_API_TOKEN=$token`r`n"
    [System.IO.File]::AppendAllText($envPath, $block, $utf8)
    Write-Info '已生成 INTERNAL_API_TOKEN 并写入 backend\.env（访客模式登录需要它）'
  } else {
    Write-Info '缺少 backend\.env，访客模式登录将不可用（先按 README 复制 .env.example）。'
  }
  return $token
}

function Start-Backend([string]$token) {
  if (-not (Test-Path (Join-Path $root 'backend\.venv\Scripts\python.exe'))) {
    Write-Bad '缺少 backend\.venv，请先按 README 完成首次安装。'
    return $false
  }
  if (-not (Test-PortFree $bPort)) {
    Write-Info "端口 $bPort 已在运行，直接复用（不重复启动）。"
    Write-Info "如果它表现得像旧代码（改完后端却没生效），先运行 dev-win.bat stop 再启动：--reload 的 worker 可能已经和父进程失联。"
    return $true
  }
  # 每次启动前清空旧日志，否则失败时会看到上一次运行的残留内容。
  Remove-Item $bLog -ErrorAction SilentlyContinue
  # --reload：改了 backend/app 下的 Python 文件就自动重启，不用手动停再启。
  # 只盯 app 目录，避免 Harness 运行时写文件（work/ 下）或 __pycache__ 触发无限重载。
  # --timeout-graceful-shutdown：worker 有时关不干净（还有连接挂着），旧的会一直占着端口，
  # 新 worker 起不来，日志里却已经写了 Reloading…，于是「改了代码像没生效」。给个上限强制退出。
  $cmd = "cd '$root\backend'; `$env:PYTHONUNBUFFERED='1'; `$env:PYTHONDONTWRITEBYTECODE='1'; `$env:INTERNAL_API_TOKEN='$token'; " +
         "& '.\.venv\Scripts\python.exe' -m uvicorn app.main:app --host 127.0.0.1 --port $bPort --reload --reload-dir app --timeout-graceful-shutdown 3 2>&1 | " +
         "ForEach-Object { `"`$_`" } | Tee-Object -FilePath '$bLog'"
  Start-Process powershell -ArgumentList '-NoExit', '-NoProfile', '-Command', $cmd | Out-Null
  Write-Host "  [启动] 后端 http://127.0.0.1:$bPort （新窗口，日志同步写入 work\marcus-backend.log）" -ForegroundColor Gray
  return $true
}

function Start-Frontend([string]$token) {
  if (-not (Test-Path (Join-Path $root 'frontend\node_modules'))) {
    Write-Bad '缺少 frontend\node_modules，请先按 README 完成首次安装。'
    return $false
  }
  if (-not (Test-PortFree $fPort)) {
    Write-Info "端口 $fPort 已在运行，直接复用（不重复启动）。"
    return $true
  }
  Remove-Item $fLog -ErrorAction SilentlyContinue
  $cmd = "cd '$root\frontend'; " +
         "`$env:PYTHON_API_URL='http://127.0.0.1:$bPort'; " +
         "`$env:NEXT_PUBLIC_APP_URL='http://127.0.0.1:$fPort/terminal'; " +
         "`$env:INTERNAL_API_TOKEN='$token'; " +
         "`$env:NEXT_TELEMETRY_DISABLED='1'; " +
         "npm run dev -- --hostname 127.0.0.1 --port $fPort 2>&1 | " +
         "ForEach-Object { `"`$_`" } | Tee-Object -FilePath '$fLog'"
  Start-Process powershell -ArgumentList '-NoExit', '-NoProfile', '-Command', $cmd | Out-Null
  Write-Host "  [启动] 前端 http://127.0.0.1:$fPort （新窗口，日志同步写入 work\marcus-frontend.log）" -ForegroundColor Gray
  return $true
}

function Invoke-Start {
  Write-Head '启动 MARCUS 本地开发环境'
  # 两个服务必须用同一个内部令牌：访客模式的授权由后端签名、前端校验。
  $token = Get-InternalToken
  $bStarted = Start-Backend $token
  $fStarted = Start-Frontend $token

  Write-Host ''
  Write-Host '  正在等待服务就绪（前端首次要编译，最多等 90 秒）...' -ForegroundColor Gray
  $bOk = Wait-Healthy $bUrl 60
  $fOk = Wait-Healthy $fUrl 90

  if ($bOk -and $fOk) {
    Write-Head '启动成功：两个服务都在运行'
    Write-Host "  桌面入口    $homeUrl"                 -ForegroundColor White
    Write-Host "  接口文档    http://127.0.0.1:$bPort/docs" -ForegroundColor White
    Write-Host ''
    Write-Host '  两个服务各占一个新窗口，那里能看到实时日志，不要关掉。' -ForegroundColor Gray
    Write-Host '  要停止：再运行一次 dev-win.bat stop' -ForegroundColor Gray
    Write-Host ''
    Write-Host '  正在打开浏览器...' -ForegroundColor Gray
    Start-Process $homeUrl | Out-Null
  } else {
    Write-Head '启动没有完全成功'
    if ($bOk) { Write-Ok '后端已就绪' } else { Write-Bad '后端没有就绪' }
    if ($fOk) { Write-Ok '前端已就绪' } else { Write-Bad '前端没有就绪' }
    if ((-not $bOk) -and $bStarted) { Show-LogTail $bLog '后端' }
    if ((-not $fOk) -and $fStarted) { Show-LogTail $fLog '前端' }
    Write-Host ''
    Write-Info '把上面显示的日志内容发给我，就能定位原因。'
  }
}

function Invoke-Stop {
  Write-Head '停止 MARCUS 本地开发环境'
  foreach ($item in @(@{Port=$bPort; Name='后端'}, @{Port=$fPort; Name='前端'})) {
    $targetPid = Get-PortPid $item.Port
    if (-not $targetPid) {
      Write-Host "  $($item.Name)：本来就没在运行" -ForegroundColor Gray
      continue
    }
    $proc = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
    if (-not $proc -or @('node','python','cmd','powershell') -notcontains $proc.ProcessName) {
      $pname = if ($proc) { $proc.ProcessName } else { '未知程序' }
      Write-Info "$($item.Name)：端口 $($item.Port) 被 $pname (PID $targetPid) 占用，不属于本项目，已跳过。"
      continue
    }
    try {
      Stop-Process -Id $targetPid -Force -ErrorAction Stop
      Write-Ok "$($item.Name) 已停止（PID $targetPid）"
    } catch {
      Write-Bad "$($item.Name) 停止失败：$($_.Exception.Message)"
    }
    # --reload 的 worker 是 spawn 出来的子进程：父进程被杀了它还会活着并继续占端口，
    # 于是下一次 start 以为「已经在运行」而直接复用旧代码。这里按端口把残留子进程也清掉。
    for ($round = 0; $round -lt 4; $round++) {
      Start-Sleep -Milliseconds 400
      if (Test-PortFree $item.Port) { break }
      $nextPid = Get-PortPid $item.Port
      if (-not $nextPid -or $nextPid -eq $targetPid) { break }
      $child = Get-Process -Id $nextPid -ErrorAction SilentlyContinue
      if (-not $child -or @('node','python') -notcontains $child.ProcessName) { break }
      Stop-Process -Id $nextPid -Force -ErrorAction SilentlyContinue
      Write-Ok "$($item.Name)：清掉了残留的子进程（PID $nextPid）"
      $targetPid = $nextPid
    }
  }
  # uvicorn --reload 的 worker 是 spawn 出来的子进程：父进程一死，它就带着继承来的 socket 活着，
  # 端口记在已经消失的父 PID 名下，于是 stop 看不到、start 又以为「已经在运行」，一直跑旧代码。
  # 只认这个特征（命令行里同时有 multiprocessing.spawn 与 spawn_main），并且要求父进程已经不在。
  foreach ($item in @(@{Port=$bPort; Name='后端'}, @{Port=$fPort; Name='前端'})) {
    if (Test-PortFree $item.Port) { continue }
    Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
      $cmdLine = if ($_.CommandLine) { $_.CommandLine } else { '' }
      $parentAlive = Get-CimInstance Win32_Process -Filter "ProcessId = $($_.ParentProcessId)" -ErrorAction SilentlyContinue
      if ($cmdLine -match 'multiprocessing\.spawn' -and $cmdLine -match 'spawn_main\(' -and -not $parentAlive) {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        Write-Ok "$($item.Name)：清掉了失联的 --reload worker（PID $($_.ProcessId)）"
      }
    }
  }
  Start-Sleep -Milliseconds 800
  # 顺手关掉服务窗口本身
  foreach ($t in @('MARCUS-Backend','MARCUS-Frontend')) {
    Get-Process | Where-Object { $_.MainWindowTitle -eq $t } | ForEach-Object {
      Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
  }
  Start-Sleep -Seconds 2
  Write-Host ''
  if ((Test-PortFree $bPort) -and (Test-PortFree $fPort)) {
    Write-Ok "端口 $bPort 和 $fPort 都已释放，服务全部停止。"
  } else {
    Write-Info '端口仍在占用，请把本窗口内容发给我。'
  }
}

function Invoke-Status {
  Write-Head 'MARCUS 本地环境状态'
  $bOk = Wait-Healthy $bUrl 6
  $fOk = Wait-Healthy $fUrl 12
  if ($bOk) { Write-Ok "后端  http://127.0.0.1:$bPort  正在运行" }
  else      { Write-Bad  "后端  http://127.0.0.1:$bPort  没有运行" }
  if ($fOk) { Write-Ok "前端  http://127.0.0.1:$fPort  正在运行" }
  else      { Write-Bad  "前端  http://127.0.0.1:$fPort  没有运行" }
  Write-Host ''
  if ($bOk -and $fOk) {
    Write-Host "  可以直接打开：$homeUrl" -ForegroundColor White
  } else {
    Write-Info '要启动请运行 dev-win.bat（或双击它）。'
  }
}

switch ($Action.ToLower()) {
  'start'   { Invoke-Start }
  'stop'    { Invoke-Stop }
  # 后端有 --reload，但它偶尔重载不动（旧 worker 占着端口），改了代码像没生效；
  # 这时用 restart：先按端口清干净再拉起来。
  'restart' { Invoke-Stop; Invoke-Start }
  'status'  { Invoke-Status }
  default  {
    Write-Host '用法: dev-win.bat [start|stop|restart|status]' -ForegroundColor Yellow
    Write-Host '      不带参数 = start' -ForegroundColor Yellow
  }
}

Write-Host ''
if ((-not $NoPause) -and $Host.Name -eq 'ConsoleHost') {
  Read-Host '按回车键关闭本窗口（服务会继续在后台运行）' | Out-Null
}
