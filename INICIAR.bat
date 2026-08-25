@echo off
chcp 65001 >nul
cd /d %~dp0

echo ========================================
echo CENTRAL DE PRODUCAO DA COMUNICACAO
echo ========================================

docker compose up -d

if not exist node_modules (
  echo O sistema ainda nao foi instalado.
  echo Execute primeiro o arquivo INSTALAR.bat
  pause
  exit /b 1
)

echo.
echo Painel: http://localhost:3000
echo.
call npm run dev
pause
