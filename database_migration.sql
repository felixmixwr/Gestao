-- Migration para adicionar novos campos na tabela expenses
-- Execute estes comandos no SQL Editor do Supabase

-- Adicionar coluna payment_method (forma de pagamento)
ALTER TABLE expenses 
ADD COLUMN payment_method TEXT CHECK (payment_method IN ('cartao', 'pix'));

-- Adicionar coluna discount_type (tipo de desconto)
ALTER TABLE expenses 
ADD COLUMN discount_type TEXT CHECK (discount_type IN ('fixed', 'percentage'));

-- Adicionar coluna discount_value (valor do desconto)
ALTER TABLE expenses 
ADD COLUMN discount_value DECIMAL(10,2);

-- Adicionar coluna fuel_station (posto de combustível)
ALTER TABLE expenses 
ADD COLUMN fuel_station TEXT;

-- Definir valor padrão para payment_method nas linhas existentes
UPDATE expenses 
SET payment_method = 'cartao' 
WHERE payment_method IS NULL AND categoria = 'Diesel';

-- Comentários para documentar as colunas
COMMENT ON COLUMN expenses.payment_method IS 'Forma de pagamento: cartao ou pix';
COMMENT ON COLUMN expenses.discount_type IS 'Tipo de desconto: fixed (valor fixo) ou percentage (percentual)';
COMMENT ON COLUMN expenses.discount_value IS 'Valor do desconto (em reais ou percentual)';
COMMENT ON COLUMN expenses.fuel_station IS 'Nome do posto de combustível';
