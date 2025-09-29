-- Script para corrigir números de relatório duplicados
-- Execute APENAS se o script anterior detectar duplicatas

-- ATENÇÃO: Este script modifica dados existentes!
-- Faça backup antes de executar

-- 1. Identificar duplicatas
WITH duplicates AS (
  SELECT 
    id,
    report_number,
    ROW_NUMBER() OVER (PARTITION BY report_number ORDER BY created_at) as rn
  FROM reports
  WHERE report_number IN (
    SELECT report_number 
    FROM reports 
    GROUP BY report_number 
    HAVING COUNT(*) > 1
  )
)
SELECT 
  id,
  report_number,
  rn,
  CASE 
    WHEN rn = 1 THEN 'MANTER'
    ELSE 'RENUMERAR'
  END as action
FROM duplicates
ORDER BY report_number, rn;

-- 2. Corrigir duplicatas (manter o mais antigo, renumerar os outros)
WITH duplicates AS (
  SELECT 
    id,
    report_number,
    ROW_NUMBER() OVER (PARTITION BY report_number ORDER BY created_at) as rn
  FROM reports
  WHERE report_number IN (
    SELECT report_number 
    FROM reports 
    GROUP BY report_number 
    HAVING COUNT(*) > 1
  )
),
new_numbers AS (
  SELECT 
    id,
    report_number,
    rn,
    CASE 
      WHEN rn = 1 THEN report_number
      ELSE 'RPT-' || to_char(created_at, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
    END as new_report_number
  FROM duplicates d
  JOIN reports r ON d.id = r.id
)
UPDATE reports 
SET report_number = nn.new_report_number
FROM new_numbers nn
WHERE reports.id = nn.id 
  AND nn.rn > 1;

-- 3. Verificar se ainda há duplicatas
SELECT 
  report_number, 
  COUNT(*) as count
FROM reports 
GROUP BY report_number 
HAVING COUNT(*) > 1;

-- 4. Se ainda houver duplicatas, usar timestamp como fallback
WITH remaining_duplicates AS (
  SELECT 
    id,
    report_number,
    ROW_NUMBER() OVER (PARTITION BY report_number ORDER BY created_at) as rn
  FROM reports
  WHERE report_number IN (
    SELECT report_number 
    FROM reports 
    GROUP BY report_number 
    HAVING COUNT(*) > 1
  )
)
UPDATE reports 
SET report_number = 'RPT-' || to_char(created_at, 'YYYYMMDD') || '-' || EXTRACT(EPOCH FROM created_at)::TEXT
FROM remaining_duplicates rd
WHERE reports.id = rd.id 
  AND rd.rn > 1;

-- 5. Verificação final
SELECT 
  COUNT(*) as total_reports,
  COUNT(DISTINCT report_number) as unique_numbers,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT report_number) THEN 'OK: Todos os números são únicos'
    ELSE 'ERRO: Ainda há duplicatas'
  END as status
FROM reports;
