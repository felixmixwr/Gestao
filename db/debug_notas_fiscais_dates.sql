-- Script para verificar os dados das notas fiscais e identificar problemas de data
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura da tabela notas_fiscais
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
ORDER BY ordinal_position;

-- 2. Verificar dados das notas fiscais
SELECT 
  id,
  numero_nota,
  data_emissao,
  data_vencimento,
  valor,
  status,
  created_at,
  updated_at
FROM notas_fiscais
ORDER BY created_at DESC;

-- 3. Verificar se há valores NULL ou inválidos nas datas
SELECT 
  COUNT(*) as total_notas,
  COUNT(data_emissao) as emissao_preenchida,
  COUNT(data_vencimento) as vencimento_preenchido,
  COUNT(CASE WHEN data_emissao IS NULL THEN 1 END) as emissao_null,
  COUNT(CASE WHEN data_vencimento IS NULL THEN 1 END) as vencimento_null
FROM notas_fiscais;

-- 4. Verificar formato das datas
SELECT 
  numero_nota,
  data_emissao,
  data_vencimento,
  CASE 
    WHEN data_emissao ~ '^\d{4}-\d{2}-\d{2}$' THEN 'Formato correto'
    ELSE 'Formato incorreto: ' || data_emissao
  END as formato_emissao,
  CASE 
    WHEN data_vencimento ~ '^\d{4}-\d{2}-\d{2}$' THEN 'Formato correto'
    ELSE 'Formato incorreto: ' || data_vencimento
  END as formato_vencimento
FROM notas_fiscais;

-- 5. Testar conversão de datas
SELECT 
  numero_nota,
  data_emissao,
  data_vencimento,
  data_emissao::date as emissao_convertida,
  data_vencimento::date as vencimento_convertido
FROM notas_fiscais;
