-- Script para corrigir a estrutura da tabela reports
-- Adiciona todas as colunas necessárias que estão sendo usadas no código

-- 1. Verificar estrutura atual da tabela reports
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- 2. Adicionar colunas que estão faltando
DO $$ 
BEGIN
    -- Adicionar coluna client_rep_name se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'client_rep_name' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN client_rep_name TEXT;
        RAISE NOTICE 'Coluna client_rep_name adicionada à tabela reports';
    ELSE
        RAISE NOTICE 'Coluna client_rep_name já existe na tabela reports';
    END IF;
    
    -- Adicionar coluna pump_prefix se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'pump_prefix' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN pump_prefix TEXT;
        RAISE NOTICE 'Coluna pump_prefix adicionada à tabela reports';
    ELSE
        RAISE NOTICE 'Coluna pump_prefix já existe na tabela reports';
    END IF;
    
    -- Adicionar coluna realized_volume se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'realized_volume' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN realized_volume DECIMAL(10,2);
        RAISE NOTICE 'Coluna realized_volume adicionada à tabela reports';
    ELSE
        RAISE NOTICE 'Coluna realized_volume já existe na tabela reports';
    END IF;
    
    -- Adicionar coluna total_value se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'total_value' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN total_value DECIMAL(12,2) DEFAULT 0.0;
        RAISE NOTICE 'Coluna total_value adicionada à tabela reports';
    ELSE
        RAISE NOTICE 'Coluna total_value já existe na tabela reports';
    END IF;
    
    -- Adicionar coluna service_company_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'service_company_id' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN service_company_id UUID REFERENCES public.companies(id);
        RAISE NOTICE 'Coluna service_company_id adicionada à tabela reports';
    ELSE
        RAISE NOTICE 'Coluna service_company_id já existe na tabela reports';
    END IF;
    
    -- Adicionar coluna driver_name se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'driver_name' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN driver_name TEXT;
        RAISE NOTICE 'Coluna driver_name adicionada à tabela reports';
    ELSE
        RAISE NOTICE 'Coluna driver_name já existe na tabela reports';
    END IF;
    
    -- Adicionar coluna assistant1_name se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'assistant1_name' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN assistant1_name TEXT;
        RAISE NOTICE 'Coluna assistant1_name adicionada à tabela reports';
    ELSE
        RAISE NOTICE 'Coluna assistant1_name já existe na tabela reports';
    END IF;
    
    -- Adicionar coluna assistant2_name se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'assistant2_name' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN assistant2_name TEXT;
        RAISE NOTICE 'Coluna assistant2_name adicionada à tabela reports';
    ELSE
        RAISE NOTICE 'Coluna assistant2_name já existe na tabela reports';
    END IF;
    
    -- Adicionar coluna status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'status' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN status TEXT DEFAULT 'ENVIADO_FINANCEIRO';
        RAISE NOTICE 'Coluna status adicionada à tabela reports';
    ELSE
        RAISE NOTICE 'Coluna status já existe na tabela reports';
    END IF;
    
    -- Adicionar coluna paid_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'paid_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna paid_at adicionada à tabela reports';
    ELSE
        RAISE NOTICE 'Coluna paid_at já existe na tabela reports';
    END IF;
    
    -- Adicionar coluna work_address se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'work_address' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN work_address TEXT;
        RAISE NOTICE 'Coluna work_address adicionada à tabela reports';
    ELSE
        RAISE NOTICE 'Coluna work_address já existe na tabela reports';
    END IF;
    
    -- Adicionar coluna client_phone se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'client_phone' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN client_phone TEXT;
        RAISE NOTICE 'Coluna client_phone adicionada à tabela reports';
    ELSE
        RAISE NOTICE 'Coluna client_phone já existe na tabela reports';
    END IF;
    
    -- Adicionar coluna planned_volume se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'planned_volume' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN planned_volume DECIMAL(10,2);
        RAISE NOTICE 'Coluna planned_volume adicionada à tabela reports';
    ELSE
        RAISE NOTICE 'Coluna planned_volume já existe na tabela reports';
    END IF;
    
    -- Adicionar coluna observations se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'observations' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.reports ADD COLUMN observations TEXT;
        RAISE NOTICE 'Coluna observations adicionada à tabela reports';
    ELSE
        RAISE NOTICE 'Coluna observations já existe na tabela reports';
    END IF;
END $$;

-- 3. Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_reports_client_rep_name ON public.reports (client_rep_name);
CREATE INDEX IF NOT EXISTS idx_reports_pump_prefix ON public.reports (pump_prefix);
CREATE INDEX IF NOT EXISTS idx_reports_realized_volume ON public.reports (realized_volume);
CREATE INDEX IF NOT EXISTS idx_reports_total_value ON public.reports (total_value);
CREATE INDEX IF NOT EXISTS idx_reports_service_company_id ON public.reports (service_company_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_date ON public.reports (date);

-- 4. Verificar estrutura final
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- 5. Verificar se há registros na tabela
SELECT COUNT(*) as total_reports FROM public.reports;




