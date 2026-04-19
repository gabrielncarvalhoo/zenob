#!/bin/bash
echo "🚀 Iniciando Zenob..."

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

# Sobe o frontend
cd ~/zenob/zenob-web
npm run dev
