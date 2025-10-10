#!/bin/bash

# Script para aplicar a migração 012 - Create felix_chat_history table
# Executa a migração para criar a tabela de histórico de chat da FELIX IA

echo "🚀 Aplicando migração 012: Create felix_chat_history table"

# Verificar se o arquivo de migração existe
if [ ! -f "db/migrations/012_create_felix_chat_history.sql" ]; then
    echo "❌ Erro: Arquivo de migração não encontrado"
    echo "   Caminho esperado: db/migrations/012_create_felix_chat_history.sql"
    exit 1
fi

# Verificar se as variáveis de ambiente do Supabase estão configuradas
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠️  Aviso: Variáveis de ambiente do Supabase não configuradas"
    echo "   Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY"
    echo "   Ou execute manualmente no dashboard do Supabase"
    echo ""
    echo "📋 SQL para executar manualmente:"
    echo "----------------------------------------"
    cat db/migrations/012_create_felix_chat_history.sql
    echo "----------------------------------------"
    exit 0
fi

# Aplicar migração usando psql
echo "📊 Executando migração no Supabase..."

psql "$SUPABASE_URL" -c "$(cat db/migrations/012_create_felix_chat_history.sql)"

if [ $? -eq 0 ]; then
    echo "✅ Migração 012 aplicada com sucesso!"
    echo ""
    echo "📋 Tabela criada: felix_chat_history"
    echo "🔒 RLS habilitado com políticas de segurança"
    echo "📊 Índices criados para performance"
    echo "🔄 Trigger para updated_at configurado"
    echo ""
    echo "🎯 A tabela está pronta para uso pela FELIX IA!"
else
    echo "❌ Erro ao aplicar migração 012"
    echo "   Verifique as credenciais e conectividade com o Supabase"
    exit 1
fi

echo ""
echo "🔍 Para verificar a tabela criada:"
echo "   SELECT * FROM felix_chat_history LIMIT 5;"
echo ""
echo "📚 Para mais informações, consulte:"
echo "   - INTEGRACAO_FELIX_SUPABASE.md"
echo "   - DOCUMENTACAO_FELIX_IA.md"





