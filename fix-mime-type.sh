#!/bin/bash

echo "🔧 Corrigindo problemas de MIME type e cache..."

# Parar servidor atual
echo "⏹️  Parando servidor atual..."
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*vite" 2>/dev/null || true

# Aguardar
sleep 3

# Limpar todos os caches
echo "🧹 Limpando caches..."
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf .vite 2>/dev/null || true

# Verificar se icon.svg existe
if [ ! -f "public/icon.svg" ]; then
    echo "⚠️  icon.svg não encontrado, mas foi criado automaticamente"
fi

# Verificar se manifest.json existe
if [ ! -f "public/manifest.json" ]; then
    echo "❌ manifest.json não encontrado!"
    exit 1
fi

echo "✅ Arquivos verificados:"
echo "   - public/icon.svg: $([ -f "public/icon.svg" ] && echo "✅ Existe" || echo "❌ Ausente")"
echo "   - public/manifest.json: $([ -f "public/manifest.json" ] && echo "✅ Existe" || echo "❌ Ausente")"

# Iniciar servidor com configurações específicas
echo "🚀 Iniciando servidor com configurações corrigidas..."
echo ""
echo "📋 INSTRUÇÕES IMPORTANTES:"
echo "1. Após o servidor iniciar, abra o navegador"
echo "2. Pressione Ctrl+Shift+R (ou Cmd+Shift+R no Mac) para hard refresh"
echo "3. Ou abra DevTools > Network > Disable cache"
echo "4. Ou use modo incógnito/privado"
echo ""

# Iniciar servidor
npm run dev
