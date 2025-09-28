-- Script COMPLETO para migrar NOTA_EMITIDA para Pagamentos a receber
-- 1. Migra todos os relatórios existentes com status NOTA_EMITIDA
-- 2. Cria trigger automático para futuros relatórios

-- =============================================
-- PARTE 1: MIGRAR RELATÓRIOS EXISTENTES
-- =============================================

-- Verificar quantos relatórios serão migrados
SELECT 
  'Relatórios a serem migrados:' as info,
  COUNT(*) as total_nota_emitida,
  SUM(total_value) as valor_total_nota_emitida
FROM public.reports 
WHERE status = 'NOTA_EMITIDA';

-- Migrar relatórios existentes para pagamentos_receber
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
  'interna' as empresa_tipo,
  r.total_value as valor_total,
  'boleto'::public.forma_pagamento as forma_pagamento,
  CURRENT_DATE + INTERVAL '5 days' as prazo_data,
  5 as prazo_dias,
  'aguardando'::public.status_pagamento as status,
  'Migrado automaticamente de NOTA_EMITIDA' as observacoes,
  NOW() as created_at,
  NOW() as updated_at
FROM public.reports r
WHERE r.status = 'NOTA_EMITIDA'
AND NOT EXISTS (
  SELECT 1 FROM public.pagamentos_receber pr 
  WHERE pr.relatorio_id = r.id
);

-- Atualizar status dos relatórios migrados
UPDATE public.reports 
SET 
  status = 'AGUARDANDO_PAGAMENTO',
  updated_at = NOW()
WHERE status = 'NOTA_EMITIDA';

-- =============================================
-- PARTE 2: CRIAR TRIGGER AUTOMÁTICO
-- =============================================

-- Criar função para processar NOTA_EMITIDA automaticamente
CREATE OR REPLACE FUNCTION process_nota_emitida_to_pagamentos_receber()
RETURNS TRIGGER AS $$
DECLARE
    cliente_uuid UUID;
    empresa_uuid UUID;
    empresa_tipo_val TEXT;
BEGIN
    -- Só processa se o status mudou para NOTA_EMITIDA
    IF NEW.status = 'NOTA_EMITIDA' AND (OLD.status IS NULL OR OLD.status != 'NOTA_EMITIDA') THEN
        
        -- Busca dados do cliente e empresa do relatório
        SELECT 
            r.client_id,
            r.company_id,
            CASE 
                WHEN c.id IS NOT NULL THEN 'interna'
                WHEN et.id IS NOT NULL THEN 'terceira'
                ELSE 'interna'
            END
        INTO cliente_uuid, empresa_uuid, empresa_tipo_val
        FROM public.reports r
        LEFT JOIN public.companies c ON r.company_id = c.id
        LEFT JOIN public.empresas_terceiras et ON r.company_id = et.id
        WHERE r.id = NEW.id;
        
        -- Verifica se já existe um pagamento para este relatório
        IF NOT EXISTS (
            SELECT 1 FROM public.pagamentos_receber 
            WHERE relatorio_id = NEW.id
        ) THEN
            -- Insere o pagamento
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
                observacoes
            ) VALUES (
                NEW.id,
                cliente_uuid,
                empresa_uuid,
                empresa_tipo_val,
                NEW.total_value,
                'boleto'::public.forma_pagamento,
                CURRENT_DATE + INTERVAL '5 days',
                5,
                'aguardando'::public.status_pagamento,
                'Criado automaticamente quando relatório mudou para NOTA_EMITIDA'
            );
        END IF;
        
        -- Atualiza o status do relatório para AGUARDANDO_PAGAMENTO
        NEW.status := 'AGUARDANDO_PAGAMENTO';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_nota_emitida_to_pagamentos_receber ON public.reports;

-- Criar novo trigger
CREATE TRIGGER trigger_nota_emitida_to_pagamentos_receber
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION process_nota_emitida_to_pagamentos_receber();

-- =============================================
-- PARTE 3: VERIFICAR RESULTADOS
-- =============================================

-- Verificar migração de relatórios existentes
SELECT 
  'Relatórios migrados:' as info,
  COUNT(*) as pagamentos_criados,
  SUM(valor_total) as valor_total_migrado
FROM public.pagamentos_receber 
WHERE observacoes = 'Migrado automaticamente de NOTA_EMITIDA';

-- Verificar se ainda há relatórios com NOTA_EMITIDA
SELECT 
  'Relatórios NOTA_EMITIDA restantes:' as info,
  COUNT(*) as quantidade
FROM public.reports 
WHERE status = 'NOTA_EMITIDA';

-- Verificar relatórios agora em AGUARDANDO_PAGAMENTO
SELECT 
  'Relatórios AGUARDANDO_PAGAMENTO:' as info,
  COUNT(*) as quantidade,
  SUM(total_value) as valor_total
FROM public.reports 
WHERE status = 'AGUARDANDO_PAGAMENTO';

-- Verificar trigger criado
SELECT 
  'Trigger criado:' as info,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_nota_emitida_to_pagamentos_receber';

-- =============================================
-- PARTE 4: LISTAR PAGAMENTOS CRIADOS
-- =============================================

-- Listar pagamentos criados com dados relacionados
SELECT 
  'Pagamentos criados:' as info,
  pr.id,
  r.report_number,
  r.date,
  pr.valor_total,
  pr.forma_pagamento,
  pr.prazo_data,
  pr.status as status_pagamento,
  c.name as cliente_nome,
  comp.name as empresa_nome
FROM public.pagamentos_receber pr
JOIN public.reports r ON pr.relatorio_id = r.id
LEFT JOIN public.clients c ON pr.cliente_id = c.id
LEFT JOIN public.companies comp ON pr.empresa_id = comp.id
WHERE pr.observacoes = 'Migrado automaticamente de NOTA_EMITIDA'
ORDER BY pr.created_at DESC
LIMIT 10;

-- =============================================
-- PARTE 5: RESUMO FINAL
-- =============================================

-- Mostrar resumo completo
SELECT 
  'MIGRAÇÃO CONCLUÍDA COM SUCESSO!' as status,
  'Todos os relatórios NOTA_EMITIDA foram migrados para Pagamentos a receber' as migracao,
  'Trigger automático criado para futuros relatórios' as automacao,
  'Agora quando um relatório mudar para NOTA_EMITIDA, será automaticamente movido para Pagamentos a receber' as comportamento;

-- Estatísticas finais
SELECT 
  (SELECT COUNT(*) FROM public.pagamentos_receber WHERE observacoes = 'Migrado automaticamente de NOTA_EMITIDA') as pagamentos_migrados,
  (SELECT COUNT(*) FROM public.reports WHERE status = 'AGUARDANDO_PAGAMENTO') as relatorios_aguardando_pagamento,
  (SELECT COUNT(*) FROM public.reports WHERE status = 'NOTA_EMITIDA') as relatorios_nota_emitida_restantes,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'trigger_nota_emitida_to_pagamentos_receber') as trigger_ativo;




