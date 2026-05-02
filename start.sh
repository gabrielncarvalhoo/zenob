#!/bin/bash
echo "🚀 Iniciando Zenob..."

# Mata todos os processos node/ts-node primeiro
pkill -f "ts-node" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 3

# Fallback: mata por porta
kill -9 $(lsof -ti:3000) 2>/dev/null
kill -9 $(lsof -ti:3001) 2>/dev/null
kill -9 $(lsof -ti:3002) 2>/dev/null
kill -9 $(lsof -ti:3003) 2>/dev/null
sleep 2

# Sobe o banco
docker start zenob-db
echo "✅ Banco de dados iniciado"

# Sobe o backend em background
cd ~/zenob/backend
DATABASE_URL="postgresql://zenob:zenob123@localhost:5432/zenob_dev?schema=public" ./node_modules/.bin/ts-node --transpile-only src/main.ts &
BACKEND_PID=$!
echo "✅ Backend iniciado (PID: $BACKEND_PID)"

# Aguarda o backend subir
sleep 3

# Sobe o frontend (Next.js detecta 3000 ocupada e vai para 3001)
cd ~/zenob/zenob-web
npm run dev