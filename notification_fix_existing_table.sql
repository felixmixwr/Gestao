-- Fix para tabela notification_logs existente
-- Verificar estrutura e adaptar

-- 1. Verificar estrutura atual da tabela notification_logs
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notification_logs'
ORDER BY ordinal_position;

-- 2. Verificar se a coluna notification_type existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'notification_logs' 
      AND column_name = 'notification_type'
    ) 
    THEN 'Coluna notification_type EXISTE' 
    ELSE 'Coluna notification_type NÃO EXISTE' 
  END as status;

-- 3. Se a coluna não existir, adicionar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_logs' 
    AND column_name = 'notification_type'
  ) THEN
    ALTER TABLE notification_logs 
    ADD COLUMN notification_type VARCHAR(50) NOT NULL DEFAULT 'general';
    RAISE NOTICE 'Coluna notification_type adicionada';
  ELSE
    RAISE NOTICE 'Coluna notification_type já existe';
  END IF;
END $$;

-- 4. Adicionar outras colunas que podem estar faltando
DO $$
BEGIN
  -- Adicionar data se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_logs' 
    AND column_name = 'data'
  ) THEN
    ALTER TABLE notification_logs 
    ADD COLUMN data JSONB;
    RAISE NOTICE 'Coluna data adicionada';
  END IF;
  
  -- Adicionar delivered se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_logs' 
    AND column_name = 'delivered'
  ) THEN
    ALTER TABLE notification_logs 
    ADD COLUMN delivered BOOLEAN DEFAULT false;
    RAISE NOTICE 'Coluna delivered adicionada';
  END IF;
  
  -- Adicionar clicked se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_logs' 
    AND column_name = 'clicked'
  ) THEN
    ALTER TABLE notification_logs 
    ADD COLUMN clicked BOOLEAN DEFAULT false;
    RAISE NOTICE 'Coluna clicked adicionada';
  END IF;
  
  -- Adicionar error_message se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_logs' 
    AND column_name = 'error_message'
  ) THEN
    ALTER TABLE notification_logs 
    ADD COLUMN error_message TEXT;
    RAISE NOTICE 'Coluna error_message adicionada';
  END IF;
END $$;

-- 5. Verificar estrutura final
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'notification_logs'
ORDER BY ordinal_position;

-- 6. Teste de inserção com estrutura adaptada
INSERT INTO notification_logs (user_id, notification_type, title, body, data, delivered)
VALUES (
  NULL, 
  'system', 
  'Setup Completo', 
  'Sistema de notificações configurado com sucesso!',
  jsonb_build_object('setup_completed_at', NOW()),
  true
);

-- 7. Verificar se funcionou
SELECT COUNT(*) as total_logs FROM notification_logs;
SELECT 'Setup concluído!' as status;


