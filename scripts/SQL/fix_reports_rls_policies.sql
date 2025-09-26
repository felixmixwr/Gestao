-- Script para corrigir políticas RLS da tabela reports
-- Garante que usuários autenticados possam criar e visualizar relatórios

-- 1. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reports';

-- 2. Habilitar RLS se não estiver habilitado
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Users can view company reports" ON public.reports;
DROP POLICY IF EXISTS "Users can manage company reports" ON public.reports;
DROP POLICY IF EXISTS "Allow authenticated users to insert reports" ON public.reports;
DROP POLICY IF EXISTS "Allow authenticated users to select reports" ON public.reports;
DROP POLICY IF EXISTS "Allow authenticated users to update reports" ON public.reports;
DROP POLICY IF EXISTS "Allow authenticated users to delete reports" ON public.reports;

-- 4. Criar políticas permissivas para usuários autenticados
-- Política para SELECT - permite visualizar todos os relatórios
CREATE POLICY "Allow authenticated users to select reports" ON public.reports
FOR SELECT 
TO authenticated
USING (true);

-- Política para INSERT - permite criar novos relatórios
CREATE POLICY "Allow authenticated users to insert reports" ON public.reports
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Política para UPDATE - permite atualizar relatórios
CREATE POLICY "Allow authenticated users to update reports" ON public.reports
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para DELETE - permite deletar relatórios (opcional)
CREATE POLICY "Allow authenticated users to delete reports" ON public.reports
FOR DELETE 
TO authenticated
USING (true);

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
WHERE tablename = 'reports';

-- 6. Testar se um usuário autenticado pode inserir um relatório de teste
-- (Execute apenas se necessário para debug)
/*
DO $$
DECLARE
    test_user_id UUID;
    test_report_id UUID;
BEGIN
    -- Obter um usuário de teste (substitua por um ID real)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
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
            status
        ) VALUES (
            'TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
            CURRENT_DATE,
            (SELECT id FROM public.clients LIMIT 1),
            (SELECT id FROM public.pumps LIMIT 1),
            (SELECT id FROM public.companies LIMIT 1),
            NOW(),
            NOW(),
            1,
            'ENVIADO_FINANCEIRO'
        ) RETURNING id INTO test_report_id;
        
        IF test_report_id IS NOT NULL THEN
            RAISE NOTICE '✅ Teste de inserção bem-sucedido! ID do relatório: %', test_report_id;
            
            -- Limpar o relatório de teste
            DELETE FROM public.reports WHERE id = test_report_id;
            RAISE NOTICE '✅ Relatório de teste removido';
        ELSE
            RAISE NOTICE '❌ Falha no teste de inserção';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Nenhum usuário encontrado para teste';
    END IF;
END $$;
*/
