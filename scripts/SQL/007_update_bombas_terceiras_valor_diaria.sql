-- Script para alterar a tabela bombas_terceiras
-- Remove o campo proxima_manutencao e adiciona valor_diaria

-- Primeiro, remover a view que depende da coluna proxima_manutencao
DROP VIEW IF EXISTS public.view_bombas_terceiras_com_empresa;

-- Adicionar o campo valor_diaria
ALTER TABLE public.bombas_terceiras 
ADD COLUMN IF NOT EXISTS valor_diaria DECIMAL(10,2);

-- Remover o campo proxima_manutencao
ALTER TABLE public.bombas_terceiras 
DROP COLUMN IF EXISTS proxima_manutencao;

-- Recriar a view com o novo campo valor_diaria
CREATE OR REPLACE VIEW public.view_bombas_terceiras_com_empresa AS
SELECT
    bt.id,
    bt.empresa_id,
    et.nome_fantasia AS empresa_nome_fantasia,
    et.razao_social AS empresa_razao_social,
    et.cnpj AS empresa_cnpj,
    et.telefone AS empresa_telefone,
    et.email AS empresa_email,
    et.endereco AS empresa_endereco,
    bt.prefixo,
    bt.modelo,
    bt.ano,
    bt.status,
    bt.valor_diaria,
    bt.observacoes,
    bt.created_at,
    bt.updated_at
FROM
    public.bombas_terceiras bt
JOIN
    public.empresas_terceiras et ON bt.empresa_id = et.id;

-- Comentário explicativo
COMMENT ON COLUMN public.bombas_terceiras.valor_diaria IS 'Valor pago pela diária da bomba em reais';
