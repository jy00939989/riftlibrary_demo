@echo off
title 归墟图书馆 - 本地服务 8080
cd /d "%~dp0"

REM 检查 8080 是否已被占用
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo.
    echo  [提示] 8080 端口已经在跑了，直接打开页面即可。
    echo.
    start "" "http://localhost:8080"
    pause
    exit /b 0
)

echo.
echo  ============================================
echo   归墟图书馆 本地静态服务
echo   地址: http://localhost:8080
echo   关闭本窗口即停止服务
echo  ============================================
echo.

start "" "http://localhost:8080"
python -m http.server 8080

pause
