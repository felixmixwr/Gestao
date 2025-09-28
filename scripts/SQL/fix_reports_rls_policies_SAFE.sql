-- Script SEGURO para corrigir políticas RLS da tabela reports
-- Verifica se políticas existem antes de criar novas

-- 1. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reports';

-- 2. Habilitar RLS se não estiver habilitado
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 3. Remover TODAS as políticas existentes para evitar conflitos
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
        RAISE NOTICE 'Política removida: %', policy_record.policyname;
    END LOOP;
    
    RAISE NOTICE '✅ Todas as políticas existentes foram removidas';
END $$;

-- 4. Criar políticas permissivas para usuários autenticados
DO $$ 
BEGIN
    -- Política para SELECT - permite visualizar todos os relatórios
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reports' 
        AND policyname = 'Allow authenticated users to select reports'
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Allow authenticated users to select reports" ON public.reports
        FOR SELECT 
        TO authenticated
        USING (true);
        RAISE NOTICE '✅ Política SELECT criada';
    ELSE
        RAISE NOTICE 'ℹ️ Política SELECT já existe';
    END IF;
    
    -- Política para INSERT - permite criar novos relatórios
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reports' 
        AND policyname = 'Allow authenticated users to insert reports'
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Allow authenticated users to insert reports" ON public.reports
        FOR INSERT 
        TO authenticated
        WITH CHECK (true);
        RAISE NOTICE '✅ Política INSERT criada';
    ELSE
        RAISE NOTICE 'ℹ️ Política INSERT já existe';
    END IF;
    
    -- Política para UPDATE - permite atualizar relatórios
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reports' 
        AND policyname = 'Allow authenticated users to update reports'
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Allow authenticated users to update reports" ON public.reports
        FOR UPDATE 
        TO authenticated
        USING (true)
        WITH CHECK (true);
        RAISE NOTICE '✅ Política UPDATE criada';
    ELSE
        RAISE NOTICE 'ℹ️ Política UPDATE já existe';
    END IF;
    
    -- Política para DELETE - permite deletar relatórios (opcional)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reports' 
        AND policyname = 'Allow authenticated users to delete reports'
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Allow authenticated users to delete reports" ON public.reports
        FOR DELETE 
        TO authenticated
        USING (true);
        RAISE NOTICE '✅ Política DELETE criada';
    ELSE
        RAISE NOTICE 'ℹ️ Política DELETE já existe';
    END IF;
    
    RAISE NOTICE '🎉 Todas as políticas RLS foram configuradas com sucesso!';
END $$;

-- 5. Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'reports' AND schemaname = 'public'
ORDER BY policyname;

-- 6. Verificar se RLS está funcionando
SELECT 
  'RLS Status' as info,
  CASE 
    WHEN rowsecurity THEN 'Habilitado' 
    ELSE 'Desabilitado' 
  END as status
FROM pg_tables 
WHERE tablename = 'reports' AND schemaname = 'public';

-- 7. Contar políticas ativas
SELECT 
  'Políticas Ativas' as info,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'reports' AND schemaname = 'public';

-- 8. Teste opcional de inserção (descomente se necessário)
/*
DO $$
DECLARE
    test_report_id UUID;
    client_count INTEGER;
    pump_count INTEGER;
    company_count INTEGER;
BEGIN
    -- Verificar se há dados necessários
    SELECT COUNT(*) INTO client_count FROM public.clients;
    SELECT COUNT(*) INTO pump_count FROM public.pumps;
    SELECT COUNT(*) INTO company_count FROM public.companies;
    
    IF client_count = 0 OR pump_count = 0 OR company_count = 0 THEN
        RAISE NOTICE '⚠️ Dados insuficientes para teste (clientes: %, bombas: %, empresas: %)', 
                     client_count, pump_count, company_count;
        RETURN;
    END IF;
    
    -- Tentar inserir um relatório de teste
    INSERT INTO public.reports (
        report_number,
        date,
        client_id,
        pump_id,
        company_id,
        start_date,
        end_date,
        total_hours,
        status,
        client_rep_name,
        pump_prefix,
        realized_volume,
        total_value
    ) VALUES (
        'TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
        CURRENT_DATE,
        (SELECT id FROM public.clients LIMIT 1),
        (SELECT id FROM public.pumps LIMIT 1),
        (SELECT id FROM public.companies LIMIT 1),
        NOW(),
        NOW(),
        1,
        'ENVIADO_FINANCEIRO',
        'Teste',
        'TEST',
        10.5,
        1000.00
    ) RETURNING id INTO test_report_id;
    
    IF test_report_id IS NOT NULL THEN
        RAISE NOTICE '✅ Teste de inserção bem-sucedido! ID: %', test_report_id;
        
        -- Limpar o relatório de teste
        DELETE FROM public.reports WHERE id = test_report_id;
        RAISE NOTICE '✅ Relatório de teste removido';
    ELSE
        RAISE NOTICE '❌ Falha no teste de inserção';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro no teste: %', SQLERRM;
END $$;
*/




