@echo off
REM End-to-End Encrypted File Sharing System - Setup Script

echo.
echo ================================================
echo  End-to-End Encrypted File Sharing System
echo  Quick Setup Script
echo ================================================
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo X Node.js not found. Please install Node.js 18+
    exit /b 1
)

echo OK Node.js version:
node --version

REM Backend setup
echo.
echo Setting up Backend...
cd backend
call npm install
copy .env.example .env

echo.
echo IMPORTANT: Edit backend\.env with your MongoDB URI
echo Example: MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/e2e-file-sharing
echo.
pause

REM Frontend setup
echo.
echo Setting up Frontend...
cd ..\frontend
call npm install
copy .env.example .env.local

echo.
echo OK Setup Complete!
echo.
echo Start Development Servers:
echo.
echo Terminal 1 - Backend:
echo   cd backend ^&^& npm run dev
echo.
echo Terminal 2 - Frontend:
echo   cd frontend ^&^& npm run dev
echo.
echo Then open: http://localhost:5173
echo.
pause
