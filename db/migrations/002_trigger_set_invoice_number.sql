-- =============================================
-- 002_trigger_set_invoice_number.sql
-- Trigger para popular nf_number automaticamente se nulo
-- =============================================

-- Função para definir número da nota fiscal automaticamente
CREATE OR REPLACE FUNCTION set_invoice_number() 
RETURNS trigger AS $$
BEGIN
  -- Se nf_number não foi definido, criar automaticamente
  IF NEW.nf_number IS NULL THEN
    -- Usar nf_seq se disponível, senão usar próximo valor da sequence
    NEW.nf_number := lpad(
      coalesce(NEW.nf_seq::text, nextval('invoice_number_seq')::text), 
      6, 
      '0'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trg_set_invoice_number ON invoices;

-- Criar trigger para executar antes de INSERT
CREATE TRIGGER trg_set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW 
  EXECUTE FUNCTION set_invoice_number();

-- Comentários para documentação
COMMENT ON FUNCTION set_invoice_number() IS 'Função que popula automaticamente o campo nf_number com zero-padding de 6 dígitos';
COMMENT ON TRIGGER trg_set_invoice_number ON invoices IS 'Trigger que executa set_invoice_number() antes de inserir novos registros';