@echo off
REM Gym Management System - Setup Script (for Windows)

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════╗
echo ║  Gym Management System - Setup Script  ║
echo ╚════════════════════════════════════════╝
echo.

REM Step 1: Check Node.js and npm
echo [1/5] Checking Node.js and npm...
where node >nul 2>nul
if !errorlevel! neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v14 or higher.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i

echo ✓ Node.js %NODE_VERSION% installed
echo ✓ npm %NPM_VERSION% installed
echo.

REM Step 2: Install dependencies
echo [2/5] Installing dependencies...
call npm install
if !errorlevel! neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Step 3: Setup environment file
echo [3/5] Setting up environment configuration...
if not exist .env (
    copy .env.example .env
    echo ✓ Created .env file from .env.example
    echo   Please edit .env and configure your settings if needed
) else (
    echo ✓ .env file already exists
)
echo.

REM Step 4: Initialize database
echo [4/5] Initializing database...
call npm run db:init
if !errorlevel! neq 0 (
    echo ❌ Failed to initialize database
    pause
    exit /b 1
)
echo ✓ Database initialized
echo.

REM Step 5: Ready to start
echo [5/5] Setup complete!
echo ✓ All preparations done
echo.

echo ════════════════════════════════════════
echo ✨ System ready to run!
echo ════════════════════════════════════════
echo.

echo To start the application:
echo   npm run dev    (Development mode with auto-reload)
echo   npm start      (Production mode)
echo.
echo Access the application at:
echo   http://localhost:5000
echo.
echo For more information, see:
echo   README.md - Main documentation
echo   docs/EXECUTION.md - How to run the application
echo.
pause
