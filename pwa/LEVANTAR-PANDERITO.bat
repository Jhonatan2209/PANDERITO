@echo off
REM ============================================================
REM  LEVANTAR-PANDERITO.bat — doble clic para encender la app
REM  Abre el servidor de la PWA en el puerto 8080, visible para
REM  esta PC (localhost) y para el celular en el mismo wifi.
REM  Para APAGAR el servidor: cierra esta ventana (o Ctrl+C).
REM ============================================================
title Servidor Panderito (no cierres esta ventana)
cd /d "%~dp0"
echo.
echo  ============================================
echo   PANDERITO - Tus finanzas, tu junta
echo  ============================================
echo.
echo  En esta PC entra a:      http://localhost:8080
echo.
echo  Desde el celular (mismo wifi) usa la IPv4 de abajo con :8080
echo  (ejemplo: http://192.168.1.35:8080)
echo.
ipconfig | findstr /i "IPv4"
echo.
echo  Esta ventana ES el servidor: mientras este abierta, la app funciona.
echo  Para apagarla: cierra la ventana.
echo.
python -m http.server 8080 --bind 0.0.0.0
pause
