@echo off
chcp 65001 >nul
cd /d %~dp0

echo ========================================
echo CENTRAL DE PRODUCAO - INSTALACAO
echo ========================================

where node >nul 2>nul || (
  echo ERRO: Node.js nao encontrado.
  echo Instale o Node.js LTS e execute novamente.
  pause
  exit /b 1
)

where docker >nul 2>nul || (
  echo ERRO: Docker nao encontrado.
  echo Instale/abra o Docker Desktop e execute novamente.
  pause
  exit /b 1
)

if not exist .env copy .env.example .env >nul

echo [1/5] Iniciando PostgreSQL...
docker compose up -d || goto :erro

echo [2/5] Instalando dependencias...
call npm install || goto :erro

echo [3/5] Gerando Prisma Client...
call npx prisma generate || goto :erro

echo [4/5] Criando banco...
call npx prisma migrate dev --name init || goto :erro

echo [5/5] Inserindo dados iniciais...
call npm run prisma:seed || goto :erro

echo.
echo INSTALACAO CONCLUIDA.
echo Agora execute INICIAR.bat
pause
exit /b 0

:erro
echo.
echo Ocorreu um erro durante a instalacao.
pause
exit /b 1
