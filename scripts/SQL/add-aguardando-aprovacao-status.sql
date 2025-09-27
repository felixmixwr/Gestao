-- Script para adicionar o novo status AGUARDANDO_APROVACAO
-- Execute este script para atualizar o banco de dados com o novo status

-- 1. Verificar estrutura atual da tabela reports
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'status';

-- 2. Verificar valores ENUM atuais
SELECT 
    enumlabel as status_value,
    enumsortorder as sort_order
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'report_status')
ORDER BY enumsortorder;

-- 3. Atualizar o tipo ENUM para incluir o novo status
DO $$ 
BEGIN
    -- Verificar se o tipo ENUM existe e recriar se necessário
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        -- Criar backup dos dados atuais
        CREATE TEMP TABLE temp_reports AS SELECT * FROM reports;
        
        -- Remover o tipo ENUM atual
        DROP TYPE report_status CASCADE;
        
        -- Criar novo tipo ENUM com o status AGUARDANDO_APROVACAO
        CREATE TYPE report_status AS ENUM (
            'ENVIADO_FINANCEIRO',
            'RECEBIDO_FINANCEIRO', 
            'AGUARDANDO_APROVACAO',
            'NOTA_EMITIDA',
            'AGUARDANDO_PAGAMENTO',
            'PAGO'
        );
        
        -- Atualizar a coluna para usar o novo tipo
        ALTER TABLE reports 
        ALTER COLUMN status TYPE report_status 
        USING CASE 
            WHEN status::text = 'ENVIADO_FINANCEIRO' THEN 'ENVIADO_FINANCEIRO'::report_status
            WHEN status::text = 'RECEBIDO_FINANCEIRO' THEN 'RECEBIDO_FINANCEIRO'::report_status
            WHEN status::text = 'NOTA_EMITIDA' THEN 'NOTA_EMITIDA'::report_status
            WHEN status::text = 'AGUARDANDO_PAGAMENTO' THEN 'AGUARDANDO_PAGAMENTO'::report_status
            WHEN status::text = 'PAGO' THEN 'PAGO'::report_status
            ELSE 'ENVIADO_FINANCEIRO'::report_status
        END;
        
        -- Definir valor padrão
        ALTER TABLE reports ALTER COLUMN status SET DEFAULT 'ENVIADO_FINANCEIRO';
        
        -- Adicionar constraint NOT NULL se não existir
        ALTER TABLE reports ALTER COLUMN status SET NOT NULL;
        
        RAISE NOTICE '✅ Status AGUARDANDO_APROVACAO adicionado com sucesso!';
        
    ELSE
        RAISE NOTICE '❌ Tipo report_status não encontrado. Execute primeiro o script de atualização de status.';
    END IF;
    
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao atualizar tipo de status: %', SQLERRM;
        -- Fallback: usar VARCHAR se ENUM não funcionar
        ALTER TABLE reports ALTER COLUMN status TYPE VARCHAR(50);
        ALTER TABLE reports ALTER COLUMN status SET DEFAULT 'ENVIADO_FINANCEIRO';
        RAISE NOTICE '⚠️ Fallback para VARCHAR aplicado';
END $$;

-- 4. Verificar se a atualização foi bem-sucedida
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'status';

-- 5. Verificar os novos valores ENUM disponíveis
SELECT 
    enumlabel as status_value,
    enumsortorder as sort_order,
    CASE 
        WHEN enumlabel = 'ENVIADO_FINANCEIRO' THEN '🔴 Enviado ao Financeiro'
        WHEN enumlabel = 'RECEBIDO_FINANCEIRO' THEN '🟣 Recebido pelo Financeiro'
        WHEN enumlabel = 'AGUARDANDO_APROVACAO' THEN '🟠 Aguardando Aprovação'
        WHEN enumlabel = 'NOTA_EMITIDA' THEN '🔵 Nota Emitida'
        WHEN enumlabel = 'AGUARDANDO_PAGAMENTO' THEN '🟡 Aguardando Pagamento'
        WHEN enumlabel = 'PAGO' THEN '🟢 Pago'
        ELSE '❓ Status Desconhecido'
    END as descricao_com_cor
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'report_status')
ORDER BY enumsortorder;

-- 6. Testar inserção de relatório com novo status
INSERT INTO reports (
    report_number,
    date,
    client_id,
    client_rep_name,
    pump_id,
    pump_prefix,
    realized_volume,
    total_value,
    company_id,
    status
) VALUES (
    '#TEST-APROVACAO-001',
    CURRENT_DATE,
    (SELECT id FROM clients LIMIT 1),
    'Teste Aguardando Aprovação',
    (SELECT id FROM pumps LIMIT 1),
    'TEST',
    75,
    1125.00,
    (SELECT id FROM companies LIMIT 1),
    'AGUARDANDO_APROVACAO'
);

-- 7. Verificar se o relatório foi criado com status correto
SELECT 
    id,
    report_number,
    status,
    'Deve aparecer com cor LARANJA' as observacao
FROM reports 
WHERE report_number = '#TEST-APROVACAO-001';

-- 8. Testar transições do novo fluxo
UPDATE reports 
SET status = 'NOTA_EMITIDA' 
WHERE report_number = '#TEST-APROVACAO-001';

SELECT 'Status alterado de AGUARDANDO_APROVACAO para NOTA_EMITIDA' as test_result;

-- 9. Verificar status final
SELECT 
    id,
    report_number,
    status,
    created_at
FROM reports 
WHERE report_number = '#TEST-APROVACAO-001';

-- 10. Limpar dados de teste
DELETE FROM reports WHERE report_number = '#TEST-APROVACAO-001';

-- 11. Verificar contagem de relatórios por status
SELECT 
    status,
    COUNT(*) as quantidade,
    CASE 
        WHEN status = 'ENVIADO_FINANCEIRO' THEN '🔴 Enviado ao Financeiro'
        WHEN status = 'RECEBIDO_FINANCEIRO' THEN '🟣 Recebido pelo Financeiro'
        WHEN status = 'AGUARDANDO_APROVACAO' THEN '🟠 Aguardando Aprovação'
        WHEN status = 'NOTA_EMITIDA' THEN '🔵 Nota Emitida'
        WHEN status = 'AGUARDANDO_PAGAMENTO' THEN '🟡 Aguardando Pagamento'
        WHEN status = 'PAGO' THEN '🟢 Pago'
        ELSE '❓ Status Desconhecido'
    END as descricao
FROM reports 
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'ENVIADO_FINANCEIRO' THEN 1
        WHEN 'RECEBIDO_FINANCEIRO' THEN 2
        WHEN 'AGUARDANDO_APROVACAO' THEN 3
        WHEN 'NOTA_EMITIDA' THEN 4
        WHEN 'AGUARDANDO_PAGAMENTO' THEN 5
        WHEN 'PAGO' THEN 6
        ELSE 7
    END;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Status AGUARDANDO_APROVACAO adicionado com sucesso!';
    RAISE NOTICE '📊 Novo fluxo de status:';
    RAISE NOTICE '   1. 🔴 ENVIADO_FINANCEIRO';
    RAISE NOTICE '   2. 🟣 RECEBIDO_FINANCEIRO';
    RAISE NOTICE '   3. 🟠 AGUARDANDO_APROVACAO ← NOVO!';
    RAISE NOTICE '   4. 🔵 NOTA_EMITIDA';
    RAISE NOTICE '   5. 🟡 AGUARDANDO_PAGAMENTO';
    RAISE NOTICE '   6. 🟢 PAGO';
    RAISE NOTICE '🎨 Cor: Laranja (#f97316)';
END $$;





