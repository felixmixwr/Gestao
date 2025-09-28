-- Script para migrar relatórios NOTA_EMITIDA para Pagamentos a receber
-- Cria registros na tabela pagamentos_receber para todos os relatórios com status NOTA_EMITIDA

-- =============================================
-- 1. VERIFICAR RELATÓRIOS COM STATUS NOTA_EMITIDA
-- =============================================

-- Contar relatórios com status NOTA_EMITIDA
SELECT 
  COUNT(*) as total_nota_emitida,
  SUM(total_value) as valor_total_nota_emitida
FROM public.reports 
WHERE status = 'NOTA_EMITIDA';

-- Listar relatórios que serão migrados
SELECT 
  r.id,
  r.report_number,
  r.date,
  r.client_rep_name,
  r.total_value,
  r.status,
  c.name as cliente_nome,
  c.phone as cliente_telefone,
  comp.name as empresa_nome
FROM public.reports r
LEFT JOIN public.clients c ON r.client_id = c.id
LEFT JOIN public.companies comp ON r.company_id = comp.id
WHERE r.status = 'NOTA_EMITIDA'
ORDER BY r.date DESC;

-- =============================================
-- 2. MIGRAR RELATÓRIOS PARA PAGAMENTOS A RECEBER
-- =============================================

-- Inserir registros na tabela pagamentos_receber
INSERT INTO public.pagamentos_receber (
  relatorio_id,
  cliente_id,
  empresa_id,
  empresa_tipo,
  valor_total,
  forma_pagamento,
  prazo_data,
  prazo_dias,
  status,
  observacoes,
  created_at,
  updated_at
)
SELECT 
  r.id as relatorio_id,
  r.client_id as cliente_id,
  r.company_id as empresa_id,
  'interna' as empresa_tipo, -- Assumindo que são empresas internas
  r.total_value as valor_total,
  'boleto'::public.forma_pagamento as forma_pagamento, -- Default para boleto
  CURRENT_DATE + INTERVAL '5 days' as prazo_data, -- Default 5 dias
  5 as prazo_dias,
  'aguardando'::public.status_pagamento as status,
  'Migrado automaticamente de NOTA_EMITIDA' as observacoes,
  NOW() as created_at,
  NOW() as updated_at
FROM public.reports r
WHERE r.status = 'NOTA_EMITIDA'
AND NOT EXISTS (
  -- Evitar duplicatas
  SELECT 1 FROM public.pagamentos_receber pr 
  WHERE pr.relatorio_id = r.id
);

-- =============================================
-- 3. ATUALIZAR STATUS DOS RELATÓRIOS
-- =============================================

-- Atualizar status dos relatórios para AGUARDANDO_PAGAMENTO
UPDATE public.reports 
SET 
  status = 'AGUARDANDO_PAGAMENTO',
  updated_at = NOW()
WHERE status = 'NOTA_EMITIDA';

-- =============================================
-- 4. VERIFICAR RESULTADO DA MIGRAÇÃO
-- =============================================

-- Verificar quantos pagamentos foram criados
SELECT 
  COUNT(*) as pagamentos_criados,
  SUM(valor_total) as valor_total_migrado
FROM public.pagamentos_receber 
WHERE observacoes = 'Migrado automaticamente de NOTA_EMITIDA';

-- Verificar se ainda há relatórios com NOTA_EMITIDA
SELECT 
  COUNT(*) as relatorios_nota_emitida_restantes
FROM public.reports 
WHERE status = 'NOTA_EMITIDA';

-- Verificar relatórios agora em AGUARDANDO_PAGAMENTO
SELECT 
  COUNT(*) as relatorios_aguardando_pagamento,
  SUM(total_value) as valor_total_aguardando
FROM public.reports 
WHERE status = 'AGUARDANDO_PAGAMENTO';

-- =============================================
-- 5. VERIFICAR PAGAMENTOS CRIADOS
-- =============================================

-- Listar pagamentos criados com dados relacionados
SELECT 
  pr.id,
  pr.relatorio_id,
  r.report_number,
  r.date,
  pr.valor_total,
  pr.forma_pagamento,
  pr.prazo_data,
  pr.status as status_pagamento,
  c.name as cliente_nome,
  comp.name as empresa_nome,
  pr.created_at
FROM public.pagamentos_receber pr
JOIN public.reports r ON pr.relatorio_id = r.id
LEFT JOIN public.clients c ON pr.cliente_id = c.id
LEFT JOIN public.companies comp ON pr.empresa_id = comp.id
WHERE pr.observacoes = 'Migrado automaticamente de NOTA_EMITIDA'
ORDER BY pr.created_at DESC;

-- =============================================
-- 6. RESUMO FINAL
-- =============================================

-- Mostrar resumo da migração
SELECT 
  'Migração concluída com sucesso!' as status,
  (SELECT COUNT(*) FROM public.pagamentos_receber WHERE observacoes = 'Migrado automaticamente de NOTA_EMITIDA') as pagamentos_criados,
  (SELECT COUNT(*) FROM public.reports WHERE status = 'AGUARDANDO_PAGAMENTO') as relatorios_aguardando_pagamento,
  (SELECT COUNT(*) FROM public.reports WHERE status = 'NOTA_EMITIDA') as relatorios_nota_emitida_restantes;




