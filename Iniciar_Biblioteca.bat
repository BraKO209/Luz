@echo off
title Biblioteca de Fresas y Google Drive
echo ========================================================
echo   Iniciando la Gran Biblioteca de Fresas y Google Drive
echo ========================================================
echo.
echo Abriendo en tu navegador...
start http://localhost:8080
echo.
echo El servidor esta en ejecucion en http://localhost:8080
echo (Puedes cerrar esta ventana cuando termines de usarla)
echo.
python -m http.server 8080
pause
