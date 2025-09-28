-- Script para recriar a tabela completamente
-- CUIDADO: Este script irá deletar todos os dados da tabela!

-- 1. Fazer backup dos dados atuais
CREATE TEMP TABLE backup_horas_extras AS
SELECT * FROM colaboradores_horas_extras;

-- 2. Deletar a tabela atual
DROP TABLE IF EXISTS colaboradores_horas_extras CASCADE;

-- 3. Recriar a tabela com a estrutura correta
CREATE TABLE colaboradores_horas_extras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  horas DECIMAL(4,2) NOT NULL,
  valor_calculado DECIMAL(10,2) NOT NULL,
  tipo_dia tipo_dia_hora_extra NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Recriar apenas o registro do VINICIUS com valor correto
INSERT INTO colaboradores_horas_extras (
  colaborador_id, 
  data, 
  horas, 
  valor_calculado, 
  tipo_dia
) VALUES (
  (SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'),
  '2025-02-19',
  10,
  136.36,  -- Valor correto para 10h
  'segunda-sexta'
);

-- 5. Verificar se funcionou
SELECT 
  'APÓS RECRIAÇÃO' as status,
  id,
  horas,
  valor_calculado,
  created_at,
  CASE 
    WHEN valor_calculado = 136.36 THEN '✅ CORRETO'
    ELSE '❌ INCORRETO'
  END as resultado
FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
);

-- 6. Verificar o total
SELECT 
  'TOTAL FINAL' as status,
  COUNT(*) as total_registros,
  SUM(horas) as total_horas,
  SUM(valor_calculado) as total_valor
FROM colaboradores_horas_extras;





