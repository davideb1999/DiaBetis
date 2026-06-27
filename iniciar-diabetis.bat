@echo off
title DiaBetis
echo.
echo  =========================================
echo    DiaBetis - Iniciando servidores...
echo  =========================================
echo.

:: Liberar puertos con PowerShell (mas fiable que netstat)
echo  Liberando puertos...
powershell -NoProfile -Command "try { $p = (Get-NetTCPConnection -LocalPort 3000 -State Listen -EA Stop).OwningProcess; Stop-Process -Id $p -Force -EA SilentlyContinue; Write-Host '  Puerto 3000 liberado' } catch {}"
powershell -NoProfile -Command "try { $p = (Get-NetTCPConnection -LocalPort 4233 -State Listen -EA Stop).OwningProcess; Stop-Process -Id $p -Force -EA SilentlyContinue; Write-Host '  Puerto 4233 liberado' } catch {}"
timeout /t 2 /nobreak > nul

:: Backend (usa helper para evitar comillas anidadas)
echo  Arrancando backend...
start "DiaBetis Backend" /D "%~dp0backend" cmd /k iniciar.bat

:: Frontend
echo  Arrancando frontend...
start "DiaBetis Frontend" /D "%~dp0frontend" cmd /k npx ng serve

:: Esperar
echo  Esperando que arranquen (10 seg)...
timeout /t 10 /nobreak > nul

:: Obtener IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r "IPv4.*192\." 2^>nul') do (
    set LOCAL_IP=%%a
    goto :found
)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r "IPv4.*10\." 2^>nul') do (
    set LOCAL_IP=%%a
    goto :found
)

:found
set LOCAL_IP=%LOCAL_IP: =%

echo.
echo  =========================================
echo    DiaBetis esta corriendo
echo  =========================================
echo.
echo  En este ordenador:
echo    http://localhost:4233
echo.
echo  Desde el movil (misma red WiFi):
echo    http://%LOCAL_IP%:4233
echo.
echo  =========================================
echo.

start http://localhost:4233
pause
