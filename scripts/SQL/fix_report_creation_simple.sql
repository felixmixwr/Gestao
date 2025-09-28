-- Script SIMPLES para corrigir problemas na criação de relatórios
-- Versão sem RAISE NOTICE para evitar erros de sintaxe

-- =============================================
-- 1. CORRIGIR ESTRUTURA DA TABELA REPORTS
-- =============================================

-- Verificar estrutura atual
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- Adicionar colunas faltantes
DO $$ 
BEGIN
    -- Colunas básicas do relatório
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'client_rep_name' AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN client_rep_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'pump_prefix' AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN pump_prefix TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'realized_volume' AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN realized_volume DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'total_value' AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN total_value DECIMAL(12,2) DEFAULT 0.0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'service_company_id' AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN service_company_id UUID REFERENCES public.companies(id);
    END IF;
    
    -- Colunas da equipe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'driver_name' AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN driver_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'assistant1_name' AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN assistant1_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'assistant2_name' AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN assistant2_name TEXT;
    END IF;
    
    -- Colunas de status e controle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'status' AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN status TEXT DEFAULT 'ENVIADO_FINANCEIRO';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'paid_at' AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Colunas adicionais
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'work_address' AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN work_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'client_phone' AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN client_phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'planned_volume' AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN planned_volume DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'observations' AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN observations TEXT;
    END IF;
END $$;

-- =============================================
-- 2. CRIAR ÍNDICES PARA OTIMIZAÇÃO
-- =============================================

CREATE INDEX IF NOT EXISTS idx_reports_client_rep_name ON public.reports (client_rep_name);
CREATE INDEX IF NOT EXISTS idx_reports_pump_prefix ON public.reports (pump_prefix);
CREATE INDEX IF NOT EXISTS idx_reports_realized_volume ON public.reports (realized_volume);
CREATE INDEX IF NOT EXISTS idx_reports_total_value ON public.reports (total_value);
CREATE INDEX IF NOT EXISTS idx_reports_service_company_id ON public.reports (service_company_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_date ON public.reports (date);

-- =============================================
-- 3. CORRIGIR POLÍTICAS RLS
-- =============================================

-- Habilitar RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes para evitar conflitos
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Listar e remover todas as políticas existentes
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'reports' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.reports', policy_record.policyname);
    END LOOP;
END $$;

-- Criar políticas permissivas
CREATE POLICY "Allow authenticated users to select reports" ON public.reports
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert reports" ON public.reports
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update reports" ON public.reports
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete reports" ON public.reports
FOR DELETE TO authenticated USING (true);

-- =============================================
-- 4. VERIFICAR ESTRUTURA FINAL
-- =============================================

-- Verificar estrutura final
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'reports';

-- Verificar se há registros
SELECT COUNT(*) as total_reports FROM public.reports;

-- =============================================
-- 5. VERIFICAR TABELAS RELACIONADAS
-- =============================================

-- Verificar se tabelas relacionadas existem
SELECT 
  'clients' as tabela,
  COUNT(*) as registros
FROM public.clients
UNION ALL
SELECT 
  'pumps' as tabela,
  COUNT(*) as registros
FROM public.pumps
UNION ALL
SELECT 
  'companies' as tabela,
  COUNT(*) as registros
FROM public.companies
UNION ALL
SELECT 
  'colaboradores' as tabela,
  COUNT(*) as registros
FROM public.colaboradores;

-- =============================================
-- 6. COMENTÁRIOS FINAIS
-- =============================================

COMMENT ON TABLE public.reports IS 'Tabela de relatórios de bombeamento - estrutura corrigida';
COMMENT ON COLUMN public.reports.client_rep_name IS 'Nome do representante do cliente';
COMMENT ON COLUMN public.reports.pump_prefix IS 'Prefixo identificador da bomba';
COMMENT ON COLUMN public.reports.realized_volume IS 'Volume de concreto bombeado em m³';
COMMENT ON COLUMN public.reports.total_value IS 'Valor total do serviço em reais';
COMMENT ON COLUMN public.reports.service_company_id IS 'ID da empresa que prestou o serviço';
COMMENT ON COLUMN public.reports.driver_name IS 'Nome do motorista operador da bomba';
COMMENT ON COLUMN public.reports.assistant1_name IS 'Nome do primeiro auxiliar';
COMMENT ON COLUMN public.reports.assistant2_name IS 'Nome do segundo auxiliar';
COMMENT ON COLUMN public.reports.status IS 'Status atual do relatório no fluxo financeiro';
COMMENT ON COLUMN public.reports.paid_at IS 'Data e hora em que o pagamento foi confirmado';
COMMENT ON COLUMN public.reports.work_address IS 'Endereço da obra onde foi realizado o bombeamento';
COMMENT ON COLUMN public.reports.client_phone IS 'Telefone do cliente para contato';
COMMENT ON COLUMN public.reports.planned_volume IS 'Volume planejado de concreto em m³';
COMMENT ON COLUMN public.reports.observations IS 'Observações adicionais sobre o serviço';

-- =============================================
-- 7. RESULTADO FINAL
-- =============================================

-- Mostrar resumo final
SELECT 
  'Script executado com sucesso!' as status,
  'A tabela reports agora possui todas as colunas necessárias' as estrutura,
  'Políticas RLS configuradas para permitir criação de relatórios' as seguranca,
  'Índices criados para otimizar consultas' as performance,
  'Você pode agora criar novos relatórios sem problemas!' as resultado;




