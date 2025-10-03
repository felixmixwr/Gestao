-- =============================================
-- Script para sincronizar status de notas fiscais
-- quando pagamento é marcado como pago
-- =============================================

-- 1. Verificar se a tabela notas_fiscais existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notas_fiscais') 
    THEN '✅ Tabela notas_fiscais EXISTE'
    ELSE '❌ Tabela notas_fiscais NÃO EXISTE - Execute primeiro: db/migrations/005_create_notas_fiscais_table.sql'
  END as status_tabela;

-- 2. Verificar estrutura da tabela notas_fiscais
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
    AND column_name IN ('id', 'relatorio_id', 'status', 'numero_nota')
ORDER BY column_name;

-- 3. Verificar se há notas fiscais na tabela
SELECT 
  CASE 
    WHEN COUNT(*) > 0 
    THEN '✅ Existem ' || COUNT(*) || ' notas fiscais'
    ELSE '⚠️ Nenhuma nota fiscal encontrada'
  END as status_notas
FROM notas_fiscais;

-- 4. Mostrar status atual das notas fiscais
SELECT 
  status,
  COUNT(*) as quantidade,
  SUM(valor) as valor_total
FROM notas_fiscais
GROUP BY status
ORDER BY status;

-- 5. Verificar relação entre notas fiscais e relatórios
SELECT 
  'Relação Notas Fiscais x Relatórios' as info,
  COUNT(nf.id) as total_notas,
  COUNT(r.id) as total_relatorios,
  COUNT(CASE WHEN r.status = 'PAGO' THEN 1 END) as relatorios_pagos,
  COUNT(CASE WHEN nf.status = 'Paga' THEN 1 END) as notas_pagas
FROM notas_fiscais nf
LEFT JOIN reports r ON nf.relatorio_id = r.id;

-- 6. Mostrar exemplos de notas fiscais com seus relatórios
SELECT 
  nf.id as nota_id,
  nf.numero_nota,
  nf.status as status_nota,
  nf.valor as valor_nota,
  r.id as relatorio_id,
  r.report_number,
  r.status as status_relatorio,
  r.total_value as valor_relatorio
FROM notas_fiscais nf
LEFT JOIN reports r ON nf.relatorio_id = r.id
ORDER BY nf.created_at DESC
LIMIT 10;

-- 7. Verificar se a view de KPIs está atualizada
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'view_kpis_financeiros_unificados') 
    THEN '✅ View KPIs EXISTE'
    ELSE '❌ View KPIs NÃO EXISTE'
  END as status_view_kpis;

-- 8. Testar KPIs de notas fiscais
SELECT 
  'KPIs de Notas Fiscais' as info,
  notas_faturadas,
  notas_pagas,
  (notas_faturadas + notas_pagas) as total_notas
FROM view_kpis_financeiros_unificados;

-- 9. Comentários sobre a sincronização
SELECT '=== SINCRONIZAÇÃO IMPLEMENTADA ===' as info;
SELECT 'Quando um pagamento for marcado como PAGO em Pagamentos a receber:' as passo1;
SELECT '1. O relatório será atualizado para status PAGO' as passo2;
SELECT '2. As notas fiscais vinculadas ao relatório serão atualizadas para status Paga' as passo3;
SELECT '3. Os KPIs serão recalculados automaticamente' as passo4;
SELECT '4. O KPI de notas pagas será atualizado' as passo5;
