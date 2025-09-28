-- Script completo para criar todas as tabelas do módulo Colaboradores

-- 1. Criar ENUMs necessários
CREATE TYPE funcao_colaborador AS ENUM (
  'Motorista Operador de Bomba',
  'Auxiliar de Bomba', 
  'Programador',
  'Administrador Financeiro',
  'Fiscal de Obras',
  'Mecânico'
);

CREATE TYPE tipo_contrato_colaborador AS ENUM (
  'fixo',
  'diarista'
);

CREATE TYPE tipo_documento_colaborador AS ENUM (
  'CNH',
  'RG',
  'Comprovante Residência',
  'Reservista',
  'Título Eleitor',
  'CTPS',
  'PIS',
  'Outros'
);

CREATE TYPE tipo_dia_hora_extra AS ENUM (
  'segunda-sexta',
  'sabado'
);

-- 2. Criar tabela principal de colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  funcao funcao_colaborador NOT NULL,
  tipo_contrato tipo_contrato_colaborador NOT NULL,
  salario_fixo DECIMAL(10,2) DEFAULT 0,
  data_pagamento_1 INTEGER, -- dia do mês (1-31)
  data_pagamento_2 INTEGER, -- dia do mês (1-31)
  valor_pagamento_1 DECIMAL(10,2),
  valor_pagamento_2 DECIMAL(10,2),
  equipamento_vinculado_id UUID REFERENCES pumps(id),
  registrado BOOLEAN DEFAULT false,
  vale_transporte BOOLEAN DEFAULT false,
  qtd_passagens_por_dia INTEGER,
  cpf VARCHAR(11),
  telefone VARCHAR(11),
  email VARCHAR(255),
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de dependentes
CREATE TABLE IF NOT EXISTS colaboradores_dependentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  nome_completo VARCHAR(255) NOT NULL,
  data_nascimento DATE NOT NULL,
  local_nascimento VARCHAR(255),
  tipo_dependente VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de documentos
CREATE TABLE IF NOT EXISTS colaboradores_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  tipo_documento tipo_documento_colaborador NOT NULL,
  dados_texto JSONB DEFAULT '{}',
  arquivo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela de horas extras
CREATE TABLE IF NOT EXISTS colaboradores_horas_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  horas DECIMAL(4,2) NOT NULL,
  valor_calculado DECIMAL(10,2) NOT NULL,
  tipo_dia tipo_dia_hora_extra NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_colaboradores_updated_at 
  BEFORE UPDATE ON colaboradores 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_company_id ON colaboradores(company_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_funcao ON colaboradores(funcao);
CREATE INDEX IF NOT EXISTS idx_colaboradores_tipo_contrato ON colaboradores(tipo_contrato);
CREATE INDEX IF NOT EXISTS idx_colaboradores_equipamento ON colaboradores(equipamento_vinculado_id);
CREATE INDEX IF NOT EXISTS idx_dependentes_colaborador_id ON colaboradores_dependentes(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_documentos_colaborador_id ON colaboradores_documentos(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_horas_extras_colaborador_id ON colaboradores_horas_extras(colaborador_id);

-- 8. Comentários para documentação
COMMENT ON TABLE colaboradores IS 'Tabela principal de colaboradores da empresa';
COMMENT ON TABLE colaboradores_dependentes IS 'Dependentes dos colaboradores';
COMMENT ON TABLE colaboradores_documentos IS 'Documentos dos colaboradores';
COMMENT ON TABLE colaboradores_horas_extras IS 'Registro de horas extras dos colaboradores';

-- 9. Habilitar RLS (Row Level Security)
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores_dependentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores_horas_extras ENABLE ROW LEVEL SECURITY;

-- 10. Criar políticas RLS básicas (permissivas para usuários autenticados)
CREATE POLICY "Allow all operations for authenticated users on colaboradores" ON colaboradores
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on dependentes" ON colaboradores_dependentes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on documentos" ON colaboradores_documentos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on horas_extras" ON colaboradores_horas_extras
  FOR ALL USING (auth.role() = 'authenticated');





