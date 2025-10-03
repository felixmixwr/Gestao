-- Script para diagnosticar problemas na Folha Salarial
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela colaboradores existe
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'colaboradores';

-- 2. Verificar estrutura da tabela colaboradores
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'colaboradores' 
ORDER BY ordinal_position;

-- 3. Contar total de colaboradores
SELECT COUNT(*) as total_colaboradores FROM colaboradores;

-- 4. Verificar colaboradores por função
SELECT 
  funcao,
  COUNT(*) as quantidade
FROM colaboradores 
GROUP BY funcao 
ORDER BY quantidade DESC;

-- 5. Verificar colaboradores por tipo de contrato
SELECT 
  tipo_contrato,
  COUNT(*) as quantidade
FROM colaboradores 
GROUP BY tipo_contrato 
ORDER BY quantidade DESC;

-- 6. Verificar colaboradores excluindo "Terceiros"
SELECT 
  COUNT(*) as colaboradores_sem_terceiros
FROM colaboradores 
WHERE funcao != 'Terceiros';

-- 7. Mostrar alguns colaboradores de exemplo
SELECT 
  id,
  nome,
  funcao,
  tipo_contrato,
  salario_fixo,
  company_id
FROM colaboradores 
WHERE funcao != 'Terceiros'
ORDER BY nome
LIMIT 10;

-- 8. Verificar se há políticas RLS ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'colaboradores';

-- 9. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'colaboradores';

-- 10. Inserir colaborador de teste (se necessário)
/*
INSERT INTO colaboradores (
  nome,
  funcao,
  tipo_contrato,
  salario_fixo,
  company_id,
  registrado,
  vale_transporte
) VALUES (
  'João Silva Teste',
  'Motorista Operador de Bomba',
  'fixo',
  3000.00,
  (SELECT id FROM companies LIMIT 1),
  true,
  false
);
*/

-- 11. Inserir colaborador diarista de teste (se necessário)
/*
INSERT INTO colaboradores (
  nome,
  funcao,
  tipo_contrato,
  salario_fixo,
  company_id,
  registrado,
  vale_transporte
) VALUES (
  'Maria Santos Teste',
  'Auxiliar de Bomba',
  'diarista',
  150.00,
  (SELECT id FROM companies LIMIT 1),
  true,
  false
);
*/
