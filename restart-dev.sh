#!/bin/bash

echo "🔄 Reiniciando servidor de desenvolvimento..."

# Parar processos existentes do Vite
echo "⏹️  Parando processos existentes..."
pkill -f "vite" || true
pkill -f "node.*vite" || true

# Aguardar um momento
sleep 2

# Limpar cache do Vite
echo "🧹 Limpando cache..."
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf dist 2>/dev/null || true

# Reinstalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Iniciar servidor de desenvolvimento
echo "🚀 Iniciando servidor de desenvolvimento..."
npm run dev

echo "✅ Servidor reiniciado com sucesso!"
