@echo off
REM Kiaan Studio - AI Engine Windows Launcher

set "PYTHON_CMD="

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
"%PYTHON_CMD%" "%~dp0run_engine.py" %*
