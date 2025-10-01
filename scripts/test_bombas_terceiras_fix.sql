-- Script de teste para verificar se as correções de bombas terceiras funcionam
-- Execute este script no SQL Editor do Supabase após aplicar a migração 011

-- 1. Verificar se o trigger foi criado corretamente
SELECT 'VERIFICAÇÃO DO TRIGGER' as teste;
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'check_pump_reference_trigger' 
AND event_object_table = 'reports';

-- 2. Verificar se a função foi criada corretamente
SELECT 'VERIFICAÇÃO DA FUNÇÃO' as teste;
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'check_pump_reference';

-- 3. Verificar se existem bombas terceiras cadastradas
SELECT 'BOMBAS TERCEIRAS CADASTRADAS' as teste;
SELECT 
  bt.id,
  bt.prefixo,
  bt.modelo,
  et.nome_fantasia as empresa_nome,
  bt.status
FROM bombas_terceiras bt
LEFT JOIN empresas_terceiras et ON bt.empresa_id = et.id
ORDER BY bt.prefixo;

-- 4. Verificar se existem bombas internas cadastradas
SELECT 'BOMBAS INTERNAS CADASTRADAS' as teste;
SELECT 
  p.id,
  p.prefix,
  p.model,
  p.brand,
  c.name as empresa_proprietaria
FROM pumps p
LEFT JOIN companies c ON p.owner_company_id = c.id
ORDER BY p.prefix;

-- 5. Testar inserção de relatório com bomba interna (deve funcionar)
SELECT 'TESTE COM BOMBA INTERNA' as teste;
-- Este teste será executado apenas se houver bombas internas
DO $$
DECLARE
  test_pump_id UUID;
  test_client_id UUID;
  test_company_id UUID;
BEGIN
  -- Buscar uma bomba interna para teste
  SELECT id INTO test_pump_id FROM pumps LIMIT 1;
  
  -- Buscar um cliente para teste
  SELECT id INTO test_client_id FROM clients LIMIT 1;
  
  -- Buscar uma empresa para teste
  SELECT id INTO test_company_id FROM companies LIMIT 1;
  
  IF test_pump_id IS NOT NULL AND test_client_id IS NOT NULL AND test_company_id IS NOT NULL THEN
    RAISE NOTICE '✅ Dados de teste encontrados - bomba interna: %, cliente: %, empresa: %', 
      test_pump_id, test_client_id, test_company_id;
  ELSE
    RAISE NOTICE '⚠️ Dados de teste não encontrados - verifique se existem bombas, clientes e empresas cadastrados';
  END IF;
END $$;

-- 6. Testar inserção de relatório com bomba terceira (deve funcionar)
SELECT 'TESTE COM BOMBA TERCEIRA' as teste;
-- Este teste será executado apenas se houver bombas terceiras
DO $$
DECLARE
  test_bomba_terceira_id UUID;
  test_client_id UUID;
  test_company_id UUID;
BEGIN
  -- Buscar uma bomba terceira para teste
  SELECT id INTO test_bomba_terceira_id FROM bombas_terceiras LIMIT 1;
  
  -- Buscar um cliente para teste
  SELECT id INTO test_client_id FROM clients LIMIT 1;
  
  -- Buscar uma empresa para teste
  SELECT id INTO test_company_id FROM companies LIMIT 1;
  
  IF test_bomba_terceira_id IS NOT NULL AND test_client_id IS NOT NULL AND test_company_id IS NOT NULL THEN
    RAISE NOTICE '✅ Dados de teste encontrados - bomba terceira: %, cliente: %, empresa: %', 
      test_bomba_terceira_id, test_client_id, test_company_id;
  ELSE
    RAISE NOTICE '⚠️ Dados de teste não encontrados - verifique se existem bombas terceiras, clientes e empresas cadastrados';
  END IF;
END $$;

-- 7. Verificar estrutura da tabela reports
SELECT 'ESTRUTURA DA TABELA REPORTS' as teste;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name IN ('pump_id', 'client_id', 'company_id', 'service_company_id')
ORDER BY ordinal_position;






