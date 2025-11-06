@echo off
REM Start Monitoring Backend Server (Windows)

echo Starting Monitoring Backend Server...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed!
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Create data directory
if not exist "backend\data" mkdir backend\data

REM Start server
echo Starting server...
echo Dashboard: http://localhost:5000
echo Press Ctrl+C to stop
echo.

cd backend
python app.py
