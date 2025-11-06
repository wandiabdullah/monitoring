@echo off
REM Docker deployment script for monitoring system (Windows)

echo ================================
echo Monitoring System - Docker Deploy
echo ================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed!
    pause
    exit /b 1
)

echo [OK] Docker version:
docker --version
echo.
echo [OK] Docker Compose version:
docker-compose --version
echo.

:menu
cls
echo ================================
echo Monitoring System - Docker Menu
echo ================================
echo.
echo 1. Build and start containers
echo 2. Start existing containers
echo 3. Stop containers
echo 4. View logs
echo 5. Restart containers
echo 6. Clean up (remove containers and volumes)
echo 7. Rebuild (no cache)
echo 8. Show status
echo 9. Exit
echo.

set /p choice="Enter choice [1-9]: "

if "%choice%"=="1" goto build_start
if "%choice%"=="2" goto start
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto restart
if "%choice%"=="6" goto cleanup
if "%choice%"=="7" goto rebuild
if "%choice%"=="8" goto status
if "%choice%"=="9" goto exit

echo [ERROR] Invalid option!
pause
goto menu

:build_start
echo.
echo Building and starting containers...
docker-compose up -d --build
echo.
echo [OK] Containers started successfully!
echo Dashboard: http://localhost:5000
echo.
docker-compose ps
pause
goto menu

:start
echo.
echo Starting containers...
docker-compose start
echo.
echo [OK] Containers started!
docker-compose ps
pause
goto menu

:stop
echo.
echo Stopping containers...
docker-compose stop
echo [OK] Containers stopped!
pause
goto menu

:logs
echo.
echo Viewing logs (Ctrl+C to exit)...
docker-compose logs -f
pause
goto menu

:restart
echo.
echo Restarting containers...
docker-compose restart
echo [OK] Containers restarted!
docker-compose ps
pause
goto menu

:cleanup
echo.
echo WARNING: This will remove all containers and data!
set /p confirm="Are you sure? (yes/no): "
if "%confirm%"=="yes" (
    echo Cleaning up...
    docker-compose down -v
    echo [OK] Cleanup complete!
) else (
    echo Cleanup cancelled
)
pause
goto menu

:rebuild
echo.
echo Rebuilding containers (no cache)...
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo.
echo [OK] Rebuild complete!
echo Dashboard: http://localhost:5000
echo.
docker-compose ps
pause
goto menu

:status
echo.
echo Container Status:
docker-compose ps
echo.
echo Volumes:
docker volume ls | findstr monitoring
echo.
echo Networks:
docker network ls | findstr monitoring
pause
goto menu

:exit
echo.
echo Goodbye!
exit /b 0
