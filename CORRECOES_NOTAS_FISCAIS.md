
# Instruções para Executar a Migração do Banco de Dados

## ✅ Correções Implementadas no Formulário

### Problemas Corrigidos:
1. **Formatação do valor**: Agora usa o componente `CurrencyInputWithValidation` que formata automaticamente valores monetários
2. **Validação de arquivo**: Melhorada para aceitar tanto por MIME type quanto por extensão
3. **Tratamento de erros**: Adicionado logs detalhados para debug
4. **Validação do schema**: Ajustado para aceitar File ou null no campo anexo

### Melhorias no Formulário:
- ✅ Input de valor com formatação automática (R$ 1.000,00)
- ✅ Validação melhorada de arquivos PDF/XML
- ✅ Logs detalhados para debug de erros
- ✅ Tratamento de erros mais robusto
- ✅ Feedback visual melhorado

## 🗄️ Migração do Banco de Dados

### Passo 1: Execute a Migração Principal
Copie e execute o seguinte SQL no **Supabase SQL Editor**:

```sql
-- Migration: Create notas_fiscais table
-- Description: Creates the new notas_fiscais table for the new NF workflow

-- Create notas_fiscais table
CREATE TABLE IF NOT EXISTS notas_fiscais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    relatorio_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    numero_nota VARCHAR(50) NOT NULL,
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    anexo_url TEXT,
    status VARCHAR(20) DEFAULT 'Faturada' CHECK (status IN ('Faturada', 'Paga', 'Cancelada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_relatorio_id ON notas_fiscais(relatorio_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_numero_nota ON notas_fiscais(numero_nota);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_status ON notas_fiscais(status);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_data_emissao ON notas_fiscais(data_emissao);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_notas_fiscais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notas_fiscais_updated_at
    BEFORE UPDATE ON notas_fiscais
    FOR EACH ROW
    EXECUTE FUNCTION update_notas_fiscais_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read all notas fiscais
CREATE POLICY "Allow authenticated users to read notas fiscais" ON notas_fiscais
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to insert notas fiscais
CREATE POLICY "Allow authenticated users to insert notas fiscais" ON notas_fiscais
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow authenticated users to update notas fiscais
CREATE POLICY "Allow authenticated users to update notas fiscais" ON notas_fiscais
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to delete notas fiscais
CREATE POLICY "Allow authenticated users to delete notas fiscais" ON notas_fiscais
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add comment to table
COMMENT ON TABLE notas_fiscais IS 'Tabela para armazenar notas fiscais vinculadas a relatórios';
COMMENT ON COLUMN notas_fiscais.relatorio_id IS 'ID do relatório ao qual a nota fiscal está vinculada';
COMMENT ON COLUMN notas_fiscais.numero_nota IS 'Número da nota fiscal';
COMMENT ON COLUMN notas_fiscais.data_emissao IS 'Data de emissão da nota fiscal';
COMMENT ON COLUMN notas_fiscais.data_vencimento IS 'Data de vencimento da nota fiscal';
COMMENT ON COLUMN notas_fiscais.valor IS 'Valor da nota fiscal';
COMMENT ON COLUMN notas_fiscais.anexo_url IS 'URL do anexo (PDF ou XML) armazenado no Supabase Storage';
COMMENT ON COLUMN notas_fiscais.status IS 'Status da nota fiscal: Faturada, Paga, Cancelada';
```

### Passo 2: Configure o Supabase Storage
**IMPORTANTE**: Se você receber erro de permissão "must be owner of relation objects", use o **Supabase Dashboard** em vez do SQL:

#### Opção A: Via Supabase Dashboard (Recomendado)
1. **Criar o Bucket**:
   - Vá para **Storage** → **Buckets**
   - Clique em **"New Bucket"**
   - Nome: `attachments`
   - Marque como **"Public"**
   - Clique em **"Create Bucket"**

2. **Configurar Políticas**:
   - Vá para **Storage** → **Buckets** → `attachments` → **"Policies"**
   - Clique em **"New Policy"** e adicione:

   **Política 1 - Upload**:
   - Name: `Allow authenticated uploads`
   - Operation: `INSERT`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'attachments'`

   **Política 2 - Leitura**:
   - Name: `Allow public read`
   - Operation: `SELECT`
   - Target roles: `public`
   - Policy definition: `bucket_id = 'attachments'`

   **Política 3 - Atualização**:
   - Name: `Allow authenticated update`
   - Operation: `UPDATE`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'attachments'`

   **Política 4 - Exclusão**:
   - Name: `Allow authenticated delete`
   - Operation: `DELETE`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'attachments'`

#### Opção B: Via SQL (se tiver permissões de superuser)
Execute o script corrigido: `db/setup_storage.sql`

### Passo 3: Testar o Sistema
Após configurar o storage, teste o sistema:

1. **Acesse um relatório** existente
2. **Clique em "+ Adicionar NF"**
3. **Preencha o formulário** com dados válidos
4. **Teste o upload** de um arquivo PDF pequeno
5. **Salve a nota fiscal**

## 🧪 Testando o Sistema

### 1. Teste de Criação de Nota Fiscal
1. Acesse um relatório existente
2. Clique em **"+ Adicionar NF"**
3. Preencha os campos:
   - **Número da Nota**: Ex: "001234"
   - **Valor**: Ex: "1000" (será formatado automaticamente para R$ 1.000,00)
   - **Data de Emissão**: Selecione uma data
   - **Data de Vencimento**: Selecione uma data posterior
   - **Anexo**: Opcionalmente, selecione um PDF ou XML
4. Clique em **"Salvar Nota Fiscal"**

### 2. Verificar na Listagem
1. Vá para a página **"Notas"**
2. Verifique se a nova nota aparece na lista
3. Teste os botões de ação (Ver Detalhes, Relatório, Anexo)

### 3. Verificar no Relatório
1. Volte para o relatório onde criou a nota
2. Verifique se a nota aparece na seção **"Notas Fiscais"**

## 🔍 Debug e Logs

O formulário agora inclui logs detalhados no console do navegador:
- Dados que serão salvos
- Erros detalhados do Supabase
- Status do upload de arquivos

Para ver os logs:
1. Abra o **Developer Tools** (F12)
2. Vá para a aba **Console**
3. Execute as ações no formulário
4. Monitore os logs para identificar problemas

## ✅ Status Final

- ✅ **Formulário corrigido** com formatação de valor
- ✅ **Validações melhoradas** para arquivos
- ✅ **Logs de debug** adicionados
- ✅ **Build funcionando** sem erros
- ✅ **Migração SQL** pronta para execução
- ✅ **Setup do Storage** documentado

**Próximo passo**: Execute as migrações SQL no Supabase e teste o sistema!
