# Módulo de Notas Fiscais - Documentação

## Visão Geral

O módulo de Notas Fiscais permite a criação, visualização e gerenciamento de notas fiscais do sistema WorldRental/FelixMix. Este módulo está integrado com relatórios existentes e permite a geração de documentos fiscais para clientes.

## Arquivos Implementados

### Componentes
- `src/components/NoteForm.tsx` - Formulário para criação/edição de notas
- `src/components/FileDownloadButton.tsx` - Botão para download de arquivos (XLSX/PDF)

### Páginas
- `src/pages/notes/NotesList.tsx` - Listagem de todas as notas fiscais
- `src/pages/notes/NotesPendingReports.tsx` - Relatórios pendentes para criação de notas
- `src/pages/notes/NoteDetails.tsx` - Detalhes de uma nota fiscal específica

### Utilitários
- `src/utils/format.ts` - Helpers para formatação de moeda, data, telefone, etc.

### Rotas
- `/notes` - Lista de notas fiscais
- `/notes/pending` - Relatórios pendentes
- `/notes/:id` - Detalhes de uma nota específica

## Estrutura da Tabela `notes`

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nf_number VARCHAR NOT NULL,           -- Número da nota fiscal
  company_name VARCHAR NOT NULL,        -- Nome da empresa cliente
  company_logo VARCHAR NOT NULL,         -- Logo da empresa (Felix Mix/WorldRental)
  phone VARCHAR NOT NULL,                -- Telefone do cliente
  nf_date DATE NOT NULL,                -- Data da nota
  nf_due_date DATE NOT NULL,            -- Data de vencimento
  address VARCHAR,                      -- Endereço do cliente
  cnpj_cpf VARCHAR,                     -- CNPJ ou CPF
  city VARCHAR,                         -- Cidade
  cep VARCHAR,                          -- CEP
  uf VARCHAR,                          -- Estado (UF)
  nf_value DECIMAL(10,2) NOT NULL,      -- Valor da nota
  descricao TEXT,                      -- Descrição dos serviços
  obs TEXT,                            -- Observações
  report_id UUID REFERENCES reports(id), -- Relatório vinculado (opcional)
  file_xlsx_path VARCHAR,              -- Caminho do arquivo XLSX
  file_pdf_path VARCHAR,               -- Caminho do arquivo PDF
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Funcionalidades Implementadas

### 1. Listagem de Notas (`NotesList.tsx`)
- ✅ Query Supabase: `select * from notes order by created_at desc limit 50`
- ✅ Tabela com colunas: Número, Cliente, Valor, Vencimento, Relatório, Ações
- ✅ Botões de download mockados (XLSX/PDF)
- ✅ Botão "Nova Nota" (apenas para admin/financeiro)
- ✅ Estatísticas: Total de notas, Valor total, Notas com arquivos

### 2. Relatórios Pendentes (`NotesPendingReports.tsx`)
- ✅ Query Supabase: Relatórios sem notas associadas
- ✅ Lista com: Número, Data, Responsável, Bomba, Horas, Valor
- ✅ Botão "Criar Nota" com dados pré-preenchidos
- ✅ Cálculo automático de valor (R$ 50/hora - mock)

### 3. Formulário de Nota (`NoteForm.tsx`)
- ✅ Validação com `react-hook-form` + `zod`
- ✅ Campos: Logo, Telefone, Datas, Cliente, Endereço, CNPJ/CPF, Valor, Descrição, Obs
- ✅ Geração automática de número sequencial
- ✅ Preenchimento automático de dados do relatório
- ✅ Salvamento na tabela `notes`

### 4. Detalhes da Nota (`NoteDetails.tsx`)
- ✅ Query Supabase: `select * from notes where id = :id`
- ✅ Exibição completa dos dados da nota
- ✅ Links para relatório vinculado
- ✅ Botões de download mockados
- ✅ Status dos arquivos (disponível/pendente)

### 5. Download de Arquivos (`FileDownloadButton.tsx`)
- ✅ Props: `path`, `label`, `fileType`
- ✅ Botão desabilitado quando `path` é null
- ✅ Tooltip "Arquivo não disponível"
- ✅ Mock de URL (`#`) até backend estar pronto

## Permissões e Controle de Acesso

### Roles Implementados
- **Admin**: Pode criar, visualizar e gerenciar todas as notas
- **Financeiro**: Pode criar e visualizar notas
- **Usuário Comum**: Apenas visualização de notas existentes

### Verificações de Permissão
```typescript
const canCreateNotes = ['admin', 'financeiro'].includes(userRole);
```

## Como Rodar

### 1. Instalação de Dependências
```bash
npm install
```

### 2. Configuração do Ambiente
Certifique-se de que as variáveis do Supabase estão configuradas:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 3. Executar o Projeto
```bash
npm run dev
```

### 4. Acessar as Páginas
- **Lista de Notas**: `http://localhost:5173/notes`
- **Relatórios Pendentes**: `http://localhost:5173/notes/pending`
- **Detalhes da Nota**: `http://localhost:5173/notes/:id`

## Como Mockar Notas para Teste

### 1. Via Interface (Recomendado)
1. Acesse `/notes/pending`
2. Selecione um relatório pendente
3. Clique em "Criar Nota"
4. Preencha os dados necessários
5. Clique em "Criar Nota"

### 2. Via SQL Direto
```sql
INSERT INTO notes (
  nf_number,
  company_name,
  company_logo,
  phone,
  nf_date,
  nf_due_date,
  nf_value,
  descricao
) VALUES (
  '000001',
  'Empresa Teste LTDA',
  'Felix Mix',
  '(11) 99999-9999',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  1500.00,
  'Serviços de bomba - teste'
);
```

## Integração Futura com Backend

### 1. Geração de Arquivos
Quando o backend estiver implementado, os campos `file_xlsx_path` e `file_pdf_path` serão preenchidos automaticamente após a criação da nota.

### 2. Download Real
O componente `FileDownloadButton` será atualizado para usar:
```typescript
// Substituir mock por:
const { data } = await supabase.storage
  .from('invoices')
  .createSignedUrl(filePath, 3600); // 1 hora de validade

window.open(data.signedUrl, '_blank');
```

### 3. View de Relatórios Pendentes
Implementar a view `pending_reports_for_invoice` no banco:
```sql
CREATE VIEW pending_reports_for_invoice AS
SELECT 
  r.id,
  r.report_number,
  r.created_at,
  c.name as responsible_name,
  p.prefix as pump_prefix,
  (r.total_hours * 50) as total_value,
  c.name as client_name,
  comp.name as company_name,
  r.start_date,
  r.end_date,
  r.total_hours
FROM reports r
LEFT JOIN notes n ON n.report_id = r.id
JOIN clients c ON c.id = r.client_id
JOIN pumps p ON p.id = r.pump_id
JOIN companies comp ON comp.id = r.company_id
WHERE n.id IS NULL;
```

### 4. Sistema de Roles
Implementar verificação real de roles do usuário:
```typescript
const { data: userProfile } = await supabase
  .from('user_profiles')
  .select('role')
  .eq('user_id', user.id)
  .single();

const userRole = userProfile?.role || 'user';
```

## Próximos Passos

1. **Backend de Geração de Arquivos**
   - Implementar geração de XLSX
   - Implementar geração de PDF
   - Configurar storage do Supabase

2. **Melhorias na Interface**
   - Implementar toast notifications
   - Adicionar loading states
   - Melhorar responsividade

3. **Funcionalidades Avançadas**
   - Edição de notas existentes
   - Cancelamento de notas
   - Relatórios de notas por período

4. **Integração com Sistema de Pagamentos**
   - Marcar notas como pagas
   - Controle de vencimentos
   - Relatórios financeiros

## Troubleshooting

### Problema: "Erro ao carregar notas"
**Solução**: Verifique se a tabela `notes` existe no banco e se as permissões RLS estão configuradas corretamente.

### Problema: "Sem permissão para criar notas"
**Solução**: Verifique se o usuário tem role 'admin' ou 'financeiro' no sistema.

### Problema: "Relatórios pendentes não aparecem"
**Solução**: Certifique-se de que existem relatórios na tabela `reports` e que não há notas associadas a eles.

## Contato

Para dúvidas ou problemas com o módulo de notas, consulte a documentação do projeto principal ou entre em contato com a equipe de desenvolvimento.
