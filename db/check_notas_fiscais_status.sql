-- Script para verificar o estado da tabela notas_fiscais
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notas_fiscais') 
    THEN '✅ Tabela notas_fiscais EXISTE'
    ELSE '❌ Tabela notas_fiscais NÃO EXISTE'
  END as status_tabela;

-- 2. Verificar estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela
SELECT 
  CASE 
    WHEN COUNT(*) > 0 
    THEN '✅ Tabela tem ' || COUNT(*) || ' registros'
    ELSE '⚠️ Tabela está VAZIA'
  END as status_dados
FROM notas_fiscais;

-- 4. Verificar políticas RLS
SELECT 
  CASE 
    WHEN COUNT(*) > 0 
    THEN '✅ Existem ' || COUNT(*) || ' políticas RLS'
    ELSE '❌ NÃO existem políticas RLS'
  END as status_rls
FROM pg_policies 
WHERE tablename = 'notas_fiscais';

-- 5. Verificar se RLS está ativo
SELECT 
  CASE 
    WHEN rowsecurity = true 
    THEN '✅ RLS está ATIVO'
    ELSE '❌ RLS está DESATIVADO'
  END as status_rls_ativo
FROM pg_tables 
WHERE tablename = 'notas_fiscais';

-- 6. Listar políticas existentes
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'notas_fiscais';

-- 7. Verificar se há relatórios para vincular
SELECT 
  CASE 
    WHEN COUNT(*) > 0 
    THEN '✅ Existem ' || COUNT(*) || ' relatórios disponíveis'
    ELSE '⚠️ NÃO existem relatórios para vincular'
  END as status_relatorios
FROM reports;

-- 8. Mostrar alguns relatórios de exemplo (se existirem)
SELECT id, report_number, created_at 
FROM reports 
LIMIT 5;
