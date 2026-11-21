<#
.SYNOPSIS
Kiaan Studio - AI Engine PowerShell Launcher
Automatically detects available Python executables on your system and executes run_engine.py.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Candidates to try
$PythonCandidates = @(
    "C:\Program Files\PostgreSQL\18\pgAdmin 4\python\python.exe",
    "python",
    "py",
    "python3",
    "C:\Python312\python.exe",
    "C:\Python311\python.exe",
    "C:\Python310\python.exe"
)

$ValidPython = $null

foreach ($cand in $PythonCandidates) {
    if (Test-Path $cand) {
        $ValidPython = $cand
        break
    } else {
        $cmd = Get-Command $cand -ErrorAction SilentlyContinue
        if ($cmd -and $cmd.Source -notlike "*WindowsApps*") {
            $ValidPython = $cand
            break
        }
    }
}

if (-not $ValidPython) {
    # If no other candidate found, test if standard 'python' works
    try {
        $testOut = & python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $ValidPython = "python"
        }
    } catch {}
}

if (-not $ValidPython) {
    Write-Host "[ERROR] A working Python installation was not found." -ForegroundColor Red
    Write-Host "Please install Python 3.10+ from https://www.python.org/downloads/ (make sure to check 'Add python.exe to PATH')." -ForegroundColor Yellow
    exit 1
}

$TargetScript = Join-Path $ScriptDir "run_engine.py"
& $ValidPython $TargetScript @args
