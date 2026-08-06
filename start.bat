@echo off
setlocal enabledelayedexpansion
title AquaTwin Enterprise Launcher

:: Set working directory to this script's location (Digital_twin_dev/)
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

echo =============================================================
echo               AquaTwin Environment Startup
echo =============================================================

:: ── 1. Verify Node.js ────────────────────────────────────────
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is missing! Please install Node.js v18+
    pause & exit /b 1
)
echo [OK] Node.js found.

:: ── 2. Verify Python ─────────────────────────────────────────
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is missing! Please install Python 3.10+
    pause & exit /b 1
)
echo [OK] Python found.

:: ── 3. Ollama (GPU mode - default on Windows) ────────────────
echo.
echo Checking Ollama service...
where ollama >nul 2>nul
if %errorlevel% neq 0 goto :ollama_missing

tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I "ollama.exe" >NUL
if %errorlevel% neq 0 (
    echo Starting Ollama on GPU...
    start "Ollama Engine" /MIN cmd /c "ollama serve"
    ping 127.0.0.1 -n 6 >nul
) else (
    echo [OK] Ollama already running.
)
echo Verifying AI models...
ollama pull qwen2.5:1.5b
ollama pull qwen2.5:3b
ollama pull deepseek-r1:1.5b
goto :docker_section

:ollama_missing
echo [WARNING] Ollama not found. AI features will be unavailable.

:: ── 4. Docker / Grafana ──────────────────────────────────────
:docker_section
echo.
echo Checking Docker...
where docker >nul 2>nul
if %errorlevel% neq 0 goto :docker_not_installed

:: Docker installed — check if daemon is running
docker info >nul 2>nul
if %errorlevel% equ 0 goto :docker_ready

:: Daemon not running — auto-launch Docker Desktop
echo Docker Desktop is not running. Launching it now...
if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    goto :docker_wait
)
if exist "%LOCALAPPDATA%\Programs\Docker\Docker\Docker Desktop.exe" (
    start "" "%LOCALAPPDATA%\Programs\Docker\Docker\Docker Desktop.exe"
    goto :docker_wait
)
echo [WARNING] Cannot find Docker Desktop.exe. Open it manually.
goto :skip_docker

:docker_wait
echo Waiting for Docker engine to start (up to 60 seconds)...
set "DOCKER_WAIT=0"

:docker_wait_loop
ping 127.0.0.1 -n 6 >nul
docker info >nul 2>nul
if %errorlevel% equ 0 goto :docker_ready
set /a DOCKER_WAIT+=1
echo   Still waiting... [%DOCKER_WAIT%/12]
if %DOCKER_WAIT% lss 12 goto :docker_wait_loop
echo [WARNING] Docker took too long to start. Grafana skipped.
goto :skip_docker

:docker_not_installed
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║           Docker is NOT installed                    ║
echo  ║                                                      ║
echo  ║  Grafana dashboard requires Docker Desktop.          ║
echo  ║  Download it from:                                   ║
echo  ║  https://www.docker.com/products/docker-desktop      ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
set /p DOCKER_CHOICE="  Continue without Grafana dashboard? (Y/N): "
if /i "%DOCKER_CHOICE%"=="Y" (
    echo [SKIPPED] Grafana skipped. All other services will start normally.
    goto :skip_docker
)
echo Exiting. Please install Docker Desktop and try again.
pause & exit /b 1

:docker_ready
echo [OK] Docker engine is running.
echo Starting Grafana container...
docker compose -f "%PROJECT_DIR%docker-compose.grafana.yml" up -d
echo [OK] Grafana running at http://localhost:3005

:skip_docker

:: ── 5. Backend ───────────────────────────────────────────────
echo.
echo Starting Backend...
start "AquaTwin Backend" /D "%PROJECT_DIR%backend" cmd /k "npm run dev"
ping 127.0.0.1 -n 4 >nul

:: ── 6. Python Telemetry Simulator (Star + Line + Bus) ────────
echo Starting Telemetry Simulator...
start "AquaTwin Simulator" /D "%PROJECT_DIR%python-generator" cmd /k "python main.py"

:: ── 7. Hydroponic Generator ───────────────────────────────────
if exist "%PROJECT_DIR%hydro-generator\main.py" (
    echo Starting Hydroponic Telemetry Simulator...
    start "AquaTwin Hydro Simulator" /D "%PROJECT_DIR%hydro-generator" cmd /k "python main.py"
)

:: ── 8. Frontend ──────────────────────────────────────────────
echo Starting Frontend...
start "AquaTwin Frontend" /D "%PROJECT_DIR%frontend" cmd /k "npm run dev"

:: ── 9. Open browser ──────────────────────────────────────────
ping 127.0.0.1 -n 5 >nul
start "" http://localhost:5173

echo.
echo =============================================================
echo   All services launched!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:3001
echo   Grafana  : http://localhost:3005
echo   You can close this window safely.
echo =============================================================
pause
