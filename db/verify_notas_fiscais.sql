-- Script para verificar se a tabela notas_fiscais foi criada corretamente
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'notas_fiscais';

-- 2. Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela
SELECT COUNT(*) as total_notas FROM notas_fiscais;

-- 4. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notas_fiscais';

-- 5. Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notas_fiscais';

-- 6. Teste de inserção (substitua 'test-report-id' por um ID real de relatório)
-- ATENÇÃO: Execute apenas se quiser criar uma nota de teste
/*
INSERT INTO notas_fiscais (relatorio_id, numero_nota, data_emissao, data_vencimento, valor, status)
VALUES (
  'test-report-id', 
  'TESTE001', 
  '2024-01-01', 
  '2024-01-31', 
  100.00, 
  'Faturada'
);
*/

-- 7. Verificar se a inserção funcionou
-- SELECT * FROM notas_fiscais WHERE numero_nota = 'TESTE001';
