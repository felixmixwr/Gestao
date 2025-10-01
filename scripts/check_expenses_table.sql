-- Script para verificar o estado da tabela expenses
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') 
    THEN '✅ Tabela expenses EXISTE'
    ELSE '❌ Tabela expenses NÃO EXISTE'
  END as status_tabela;

-- 2. Verificar estrutura da tabela (se existir)
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela (se existir)
SELECT 
  CASE 
    WHEN COUNT(*) > 0 
    THEN '✅ Tabela tem ' || COUNT(*) || ' registros'
    ELSE '⚠️ Tabela está VAZIA'
  END as status_dados
FROM expenses;

-- 4. Verificar se as tabelas dependentes existem
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pumps') 
    THEN '✅ Tabela pumps EXISTE'
    ELSE '❌ Tabela pumps NÃO EXISTE'
  END as status_pumps;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') 
    THEN '✅ Tabela companies EXISTE'
    ELSE '❌ Tabela companies NÃO EXISTE'
  END as status_companies;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notas_fiscais') 
    THEN '✅ Tabela notas_fiscais EXISTE'
    ELSE '❌ Tabela notas_fiscais NÃO EXISTE'
  END as status_notas_fiscais;

-- 5. Verificar políticas RLS (se tabela existir)
SELECT 
  CASE 
    WHEN COUNT(*) > 0 
    THEN '✅ Existem ' || COUNT(*) || ' políticas RLS'
    ELSE '❌ NÃO existem políticas RLS'
  END as status_rls
FROM pg_policies 
WHERE tablename = 'expenses';

-- 6. Verificar se RLS está ativo (se tabela existir)
SELECT 
  CASE 
    WHEN rowsecurity = true 
    THEN '✅ RLS está ATIVO'
    ELSE '❌ RLS está DESATIVADO'
  END as status_rls_ativo
FROM pg_tables 
WHERE tablename = 'expenses';

-- 7. Listar políticas existentes (se existirem)
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'expenses';


