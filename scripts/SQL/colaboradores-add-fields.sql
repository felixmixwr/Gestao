 -- Script SQL para adicionar campos CPF, telefone e email à tabela colaboradores
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar campo CPF
ALTER TABLE colaboradores 
ADD COLUMN IF NOT EXISTS cpf VARCHAR(11);

-- 2. Adicionar campo telefone
ALTER TABLE colaboradores 
ADD COLUMN IF NOT EXISTS telefone VARCHAR(11);

-- 3. Adicionar campo email
ALTER TABLE colaboradores 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 4. Criar índices para os novos campos (opcional, para melhor performance)
CREATE INDEX IF NOT EXISTS idx_colaboradores_cpf ON colaboradores(cpf);
CREATE INDEX IF NOT EXISTS idx_colaboradores_email ON colaboradores(email);

-- 5. Adicionar comentários para documentação
COMMENT ON COLUMN colaboradores.cpf IS 'CPF do colaborador (apenas números)';
COMMENT ON COLUMN colaboradores.telefone IS 'Telefone do colaborador (apenas números)';
COMMENT ON COLUMN colaboradores.email IS 'E-mail do colaborador';

-- 6. Verificar se os campos foram adicionados corretamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'colaboradores' 
  AND column_name IN ('cpf', 'telefone', 'email')
ORDER BY column_name;

-- 7. Mostrar mensagem de sucesso
SELECT 'Campos CPF, telefone e email adicionados com sucesso à tabela colaboradores!' as status;





