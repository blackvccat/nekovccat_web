@echo off
REM Launcher shell only. All logic and Chinese messages live in dev-win.ps1.
REM Reason: cmd.exe mis-parses batch files containing multi-byte characters,
REM so this file is intentionally ASCII-only.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev-win.ps1" %*
