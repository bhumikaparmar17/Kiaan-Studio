@echo off
REM Kiaan Studio - AI Engine Backend Bridge Worker Launcher

set "PYTHON_CMD="

if exist "%LOCALAPPDATA%\Python\bin\python.exe" (
    set "PYTHON_CMD=%LOCALAPPDATA%\Python\bin\python.exe"
    goto RUN
)

if exist "C:\Program Files\PostgreSQL\18\pgAdmin 4\python\python.exe" (
    set "PYTHON_CMD=C:\Program Files\PostgreSQL\18\pgAdmin 4\python\python.exe"
    goto RUN
)

where py >nul 2>nul
if %errorlevel% equ 0 (
    set "PYTHON_CMD=py"
    goto RUN
)

set "PYTHON_CMD=python"

:RUN
echo ========================================================
echo   KIAAN AI ENGINE - BACKEND BRIDGE WORKER DAEMON
echo ========================================================
"%PYTHON_CMD%" -u "%~dp0workers\backend_bridge_worker.py" %*
