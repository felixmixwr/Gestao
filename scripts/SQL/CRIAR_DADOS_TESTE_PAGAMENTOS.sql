-- ============================================
-- SCRIPT PARA CRIAR DADOS DE TESTE DE PAGAMENTOS
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- Este script cria alguns registros de exemplo na tabela pagamentos_receber
-- para demonstrar a funcionalidade de mostrar PIX/Boleto nos eventos

-- 1. Verificar se existem relatórios para vincular
SELECT id, date, total_value 
FROM reports 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Criar alguns pagamentos de teste (substitua os IDs pelos seus relatórios existentes)
-- IMPORTANTE: Substitua 'SEU_RELATORIO_ID_AQUI' pelos IDs reais dos seus relatórios

-- Exemplo de pagamento PIX
INSERT INTO pagamentos_receber (
  relatorio_id,
  cliente_id,
  empresa_id,
  empresa_tipo,
  valor_total,
  forma_pagamento,
  prazo_data,
  prazo_dias,
  status,
  observacoes
)
SELECT 
  r.id,
  r.client_id,
  r.company_id,
  CASE 
    WHEN c.id IS NOT NULL THEN 'interna'
    WHEN et.id IS NOT NULL THEN 'terceira'
    ELSE 'interna'
  END,
  r.total_value,
  'pix'::forma_pagamento,
  CURRENT_DATE,
  0,
  'pago'::status_pagamento,
  'Pagamento PIX confirmado automaticamente'
FROM reports r
LEFT JOIN companies c ON r.company_id = c.id
LEFT JOIN empresas_terceiras et ON r.company_id = et.id
WHERE r.id IN (
  SELECT id FROM reports ORDER BY created_at DESC LIMIT 1
)
ON CONFLICT (relatorio_id) DO NOTHING;

-- Exemplo de pagamento Boleto
INSERT INTO pagamentos_receber (
  relatorio_id,
  cliente_id,
  empresa_id,
  empresa_tipo,
  valor_total,
  forma_pagamento,
  prazo_data,
  prazo_dias,
  status,
  observacoes
)
SELECT 
  r.id,
  r.client_id,
  r.company_id,
  CASE 
    WHEN c.id IS NOT NULL THEN 'interna'
    WHEN et.id IS NOT NULL THEN 'terceira'
    ELSE 'interna'
  END,
  r.total_value,
  'boleto'::forma_pagamento,
  CURRENT_DATE + INTERVAL '5 days',
  5,
  'pago'::status_pagamento,
  'Pagamento via Boleto confirmado'
FROM reports r
LEFT JOIN companies c ON r.company_id = c.id
LEFT JOIN empresas_terceiras et ON r.company_id = et.id
WHERE r.id IN (
  SELECT id FROM reports ORDER BY created_at DESC LIMIT 1 OFFSET 1
)
ON CONFLICT (relatorio_id) DO NOTHING;

-- 3. Verificar os pagamentos criados
SELECT 
  pr.*,
  r.date as relatorio_data,
  r.total_value as relatorio_valor
FROM pagamentos_receber pr
JOIN reports r ON pr.relatorio_id = r.id
ORDER BY pr.created_at DESC;

-- 4. Verificar notas fiscais relacionadas
SELECT 
  nf.*,
  pr.forma_pagamento,
  pr.status as status_pagamento
FROM notas_fiscais nf
LEFT JOIN pagamentos_receber pr ON nf.relatorio_id = pr.relatorio_id
ORDER BY nf.created_at DESC;
