# WorldRental - Felix Mix

Sistema completo de gestão para empresas de aluguel de bombas, desenvolvido com React + TypeScript + Vite e integrado ao Supabase. O sistema inclui módulos de autenticação, gestão de clientes, bombas, relatórios e notas fiscais.

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time + Storage)
- **Roteamento**: React Router DOM
- **Formulários**: React Hook Form + Zod
- **Validação**: Zod schemas
- **Utilitários**: date-fns, uuid, clsx, axios
- **Função Backend**: Node.js para geração de notas fiscais

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd WorldRental_FelixMix
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp env.example .env
```

4. Edite o arquivo `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_OWNER_COMPANY_NAME=Felix Mix
VITE_SECOND_COMPANY_NAME=WorldRental
```

## 🏃‍♂️ Como Executar

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Linting (opcional)
npm run lint
```

## 🗄️ Configuração do Supabase

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e a chave anônima (anon key)

### 1.1. Executar Migrações do Banco de Dados

Para configurar o módulo de Notas Fiscais (Invoices), execute os scripts SQL na seguinte ordem:

#### Opção 1: Via SQL Editor do Supabase (Recomendado)
1. Acesse o painel do Supabase
2. Vá em SQL Editor
3. Execute os scripts na ordem:

```sql
-- 1. Execute primeiro: 001_create_invoice_seq_and_table.sql
-- 2. Execute segundo: 002_trigger_set_invoice_number.sql  
-- 3. Execute terceiro: 003_view_pending_reports.sql
```

#### Opção 2: Via psql (linha de comando)
```bash
# Conecte ao seu banco Supabase
psql "postgresql://postgres:[password]@[host]:5432/postgres"

# Execute as migrações
\i db/migrations/001_create_invoice_seq_and_table.sql
\i db/migrations/002_trigger_set_invoice_number.sql
\i db/migrations/003_view_pending_reports.sql
```

**⚠️ Importante**: Execute os scripts na ordem correta (001 → 002 → 003) para evitar erros de dependência.

### 2. Estrutura das Tabelas

O sistema espera as seguintes tabelas no Supabase:

#### companies
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### clients
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_id UUID REFERENCES companies(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### pumps
```sql
CREATE TABLE pumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model TEXT,
  serial_number TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
  company_id UUID REFERENCES companies(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### reports
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  pump_id UUID REFERENCES pumps(id) NOT NULL,
  company_id UUID REFERENCES companies(id) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_hours INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### notes (Notas Gerais)
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### invoices (Notas Fiscais)
```sql
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES reports(id) ON DELETE SET NULL,
  nf_seq integer DEFAULT nextval('invoice_number_seq'),
  nf_number text, -- será populado pelo trigger (zero-padded)
  nf_date date,
  nf_value numeric(12,2),
  nf_due_date date,
  company_logo text,
  phone text,
  company_name text,
  address text,
  cnpj_cpf text,
  city text,
  cep text,
  uf text,
  descricao text,
  obs text,
  file_xlsx_path text,
  file_pdf_path text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 3. Configurar Row Level Security (RLS)

Ative o RLS em todas as tabelas e configure as políticas de acordo com suas necessidades de segurança.

### 4. Função RPC Opcional (Recomendada)

Para gerar números de relatório únicos de forma atômica, crie esta função RPC no Supabase:

```sql
CREATE OR REPLACE FUNCTION create_report_with_number(
  p_client_id UUID,
  p_pump_id UUID,
  p_company_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_total_hours INTEGER,
  p_notes TEXT DEFAULT NULL
) RETURNS reports
LANGUAGE plpgsql
AS $$
DECLARE
  report_number TEXT;
  new_report reports;
BEGIN
  -- Gera número único do relatório
  report_number := 'RPT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('report_sequence')::TEXT, 4, '0');
  
  -- Insere o relatório
  INSERT INTO reports (
    report_number,
    client_id,
    pump_id,
    company_id,
    start_date,
    end_date,
    total_hours,
    notes
  ) VALUES (
    report_number,
    p_client_id,
    p_pump_id,
    p_company_id,
    p_start_date,
    p_end_date,
    p_total_hours,
    p_notes
  ) RETURNING * INTO new_report;
  
  RETURN new_report;
END;
$$;

-- Criar sequência para números únicos
CREATE SEQUENCE IF NOT EXISTS report_sequence START 1;
```

## 🔐 Autenticação

O sistema usa autenticação via email/senha do Supabase. Para criar usuários:

1. Acesse o painel do Supabase
2. Vá em Authentication > Users
3. Clique em "Add user" e crie as contas necessárias

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── ConfirmDialog.tsx
│   ├── FormField.tsx
│   ├── KpiCard.tsx
│   ├── Layout.tsx
│   ├── Loading.tsx
│   ├── RequireAuth.tsx
│   └── Table.tsx
├── lib/                 # Configurações e utilitários
│   ├── api.ts          # Wrappers para operações Supabase
│   ├── auth.tsx        # Context de autenticação
│   ├── supabase.ts     # Cliente Supabase + tipos
│   └── toast.tsx       # Sistema de notificações
├── pages/              # Páginas da aplicação
│   ├── auth/
│   ├── clients/
│   ├── errors/
│   ├── notes/
│   ├── pumps/
│   ├── reports/
│   └── Dashboard.tsx
├── routes/             # Configuração de rotas
│   └── index.tsx
├── styles/             # Estilos globais
│   └── globals.css
├── utils/              # Utilitários e constantes
│   ├── constants.ts
│   ├── formatters.ts
│   └── validators.ts
└── main.tsx           # Ponto de entrada
```

## 🛣️ Rotas Disponíveis

### Autenticação
- `/login` - Login de usuários
- `/signup` - Cadastro de novos usuários

### Dashboard
- `/` - Dashboard principal com KPIs e métricas

### Clientes
- `/clients` - Lista de clientes
- `/clients/new` - Novo cliente
- `/clients/:id` - Detalhes do cliente
- `/clients/:id/edit` - Editar cliente

### Bombas
- `/pumps` - Lista de bombas com filtros
- `/pumps/new` - Nova bomba
- `/pumps/:id` - Detalhes da bomba
- `/pumps/:id/edit` - Editar bomba

### Relatórios
- `/reports` - Lista de relatórios
- `/reports/new` - Novo relatório
- `/reports/:id` - Detalhes do relatório
- `/reports/:id/edit` - Editar relatório

### Notas Fiscais
- `/notes` - Lista de notas fiscais
- `/notes/new` - Nova nota fiscal
- `/notes/pending` - Relatórios pendentes para nota
- `/notes/:id` - Detalhes da nota fiscal

### Utilitários
- `/test` - Página de teste e configuração do banco

## 🎨 Componentes Disponíveis

### Componentes Base
- **KpiCard**: Cards de métricas com ícones e tendências
- **Table**: Tabela responsiva com loading e estados vazios
- **FormField**: Campo de formulário com validação
- **FormTextarea**: Área de texto para formulários
- **Select**: Select com opções customizáveis
- **Button**: Botão com variantes e estados de loading
- **Badge**: Badge com cores e tamanhos variados
- **Loading**: Indicadores de carregamento
- **ConfirmDialog**: Modal de confirmação
- **Layout**: Layout principal com sidebar
- **RequireAuth**: Proteção de rotas

### Componentes Especializados
- **PumpCard**: Card específico para exibição de bombas
- **RecentReportsList**: Lista de relatórios recentes no dashboard
- **NoteForm**: Formulário completo para notas fiscais
- **NotePreview**: Preview de notas fiscais
- **FileDownloadButton**: Botão para download de arquivos (XLSX/PDF)

### Componentes de Input com Validação
- **AddressInput**: Input de endereço com validação
- **CEPInput**: Input de CEP com validação ViaCEP
- **CityInput**: Input de cidade com validação
- **CompanyNameInput**: Input de nome da empresa
- **CurrencyInput**: Input de valores monetários
- **DateInput**: Input de datas
- **DocumentInput**: Input de CNPJ/CPF com validação
- **PhoneInput**: Input de telefone com máscara
- **UFSelector**: Selector de estados brasileiros
- **CompanySelector**: Selector de empresas
- **TextAreaWithCounter**: Textarea com contador de caracteres

## 🔧 Utilitários

### Formatters (`src/utils/formatters.ts`)
- `formatCurrency()` - Formata valores como moeda brasileira
- `formatDateISO()` - Converte data para ISO8601
- `phoneToDigits()` - Limpa telefone e adiciona código do país
- `generateReportNumber()` - Gera número único de relatório

### Validators (`src/utils/validators.ts`)
- Schemas Zod para validação de formulários
- Tipos TypeScript derivados dos schemas

### API (`src/lib/api.ts`)
- Wrappers para todas as operações CRUD
- Tratamento padronizado de erros
- Suporte a RPC functions do Supabase

## 🚨 Tratamento de Erros

O sistema inclui:
- Toast notifications para feedback do usuário
- Tratamento de erros global
- Página de erro genérica
- Validação de formulários com mensagens em português

## 🎯 Funcionalidades Implementadas

### ✅ Sistema de Autenticação Completo
- **Login** (`/login`) - Autenticação de usuários existentes
- **Cadastro** (`/signup`) - Criação de novas contas com validação completa
- **Proteção de Rotas** - Todas as páginas protegidas por autenticação
- **Context Global** - Gerenciamento de estado de autenticação

### ✅ Dashboard Avançado
- **KPIs em Tempo Real** - Relatórios pendentes, bombas disponíveis, faturamento
- **Filtros Dinâmicos** - Por período, empresa, bomba
- **Últimos Relatórios** - Lista dos 5 relatórios mais recentes
- **Métricas Visuais** - Cards com ícones e formatação de moeda

### ✅ Sistema de Bombas Completo
- **Lista de Bombas** (`/pumps`) - Grid responsivo com filtros por status e empresa
- **Cadastro de Bombas** (`/pumps/new`) - Formulário completo com validação
- **Detalhes da Bomba** (`/pumps/:id`) - Informações completas e relatórios associados
- **Edição de Bombas** (`/pumps/:id/edit`) - Formulário de edição
- **Cálculo Automático** - Total faturado atualizado automaticamente via triggers SQL

### ✅ Sistema de Clientes Completo
- **Lista de Clientes** (`/clients`) - Tabela com busca e filtros
- **Cadastro de Clientes** (`/clients/new`) - Formulário com validação completa
- **Detalhes do Cliente** (`/clients/:id`) - Informações e histórico
- **Edição de Clientes** (`/clients/:id/edit`) - Formulário de edição

### ✅ Sistema de Relatórios Completo
- **Lista de Relatórios** (`/reports`) - Tabela com filtros avançados
- **Novo Relatório** (`/reports/new`) - Formulário completo com validação
- **Detalhes do Relatório** (`/reports/:id`) - Informações completas
- **Edição de Relatórios** (`/reports/:id/edit`) - Formulário de edição

### ✅ Sistema de Notas Fiscais Completo
- **Lista de Notas** (`/notes`) - Tabela com estatísticas e downloads
- **Nova Nota Fiscal** (`/notes/new`) - Formulário completo com validação
- **Relatórios Pendentes** (`/notes/pending`) - Relatórios sem nota fiscal
- **Detalhes da Nota** (`/notes/:id`) - Informações completas e downloads
- **Geração de Arquivos** - Backend Node.js para XLSX e PDF

### ✅ Função Backend de Geração de Notas
- **API REST** - Endpoint `/api/notes/generate` para geração de notas
- **Autenticação JWT** - Validação de tokens Supabase
- **Geração XLSX** - Criação de arquivos Excel a partir de templates
- **Conversão PDF** - Conversão automática para PDF
- **Upload Storage** - Armazenamento no Supabase Storage
- **Rollback Automático** - Reversão em caso de erro

### ✅ Sistema de Configuração
- **Página de Teste** (`/test`) - Configuração automática do banco
- **Scripts SQL** - Migrações completas para setup inicial
- **Validação de Ambiente** - Verificação de variáveis de ambiente

## 📝 Notas Importantes

- Todas as operações de banco de dados são feitas via Supabase
- O sistema está preparado para RLS (Row Level Security)
- Use os wrappers da API para manter consistência
- Os componentes são totalmente tipados com TypeScript
- O sistema de toast está integrado globalmente
- Sistema multi-empresa (Felix Mix e World Rental)
- Triggers SQL para cálculos automáticos
- Validação completa com Zod schemas
- Interface responsiva e moderna

## 🚀 Como Começar

### 1. Configuração Inicial
```bash
# Clone o repositório
git clone <url-do-repositorio>
cd WorldRental_FelixMix

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp env.example .env
# Edite o .env com suas credenciais do Supabase
```

### 2. Configuração do Banco de Dados
**Opção A - Automática (Recomendada):**
1. Execute `npm run dev`
2. Acesse `http://localhost:5173/test`
3. Clique em "Configurar Banco"
4. Siga as instruções na tela

**Opção B - Manual:**
1. Acesse o painel do Supabase
2. Execute os scripts SQL na ordem:
   - `db/migrations/001_create_invoice_seq_and_table.sql`
   - `db/migrations/002_trigger_set_invoice_number.sql`
   - `db/migrations/003_view_pending_reports.sql`

### 3. Primeiro Acesso
1. Acesse `http://localhost:5173/signup`
2. Crie sua conta
3. Confirme seu email
4. Faça login em `http://localhost:5173/login`
5. Explore o dashboard em `http://localhost:5173/`

## 🔧 Configuração da Função Backend

### Para Geração de Notas Fiscais
```bash
# Navegue para a função
cd functions/notes-generate

# Instale as dependências
npm install

# Configure o ambiente
cp env.example .env
# Edite com suas credenciais do Supabase

# Execute em desenvolvimento
npm run dev

# Deploy para produção
npm run deploy
```

### Configuração do Supabase Storage
```sql
-- Criar bucket para faturas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoices', 'invoices', false);
```

## 📚 Documentação Adicional

### Documentos Técnicos Disponíveis
- **`Docs/FINAL_STATUS.md`** - Status completo do projeto
- **`Docs/NOTES_MODULE_DOCUMENTATION.md`** - Documentação do módulo de notas fiscais
- **`Docs/PUMP_SYSTEM_DOCUMENTATION.md`** - Documentação do sistema de bombas
- **`Docs/DATABASE_SETUP_GUIDE.md`** - Guia de configuração do banco
- **`Docs/GETTING_STARTED.md`** - Guia de início rápido
- **`functions/notes-generate/README.md`** - Documentação da função backend

### Estrutura de Arquivos Importantes
```
📁 src/
├── 📁 components/          # 34 componentes implementados
├── 📁 pages/              # 25 páginas implementadas
├── 📁 lib/                # Configurações e APIs
├── 📁 utils/              # Utilitários e validações
└── 📁 types/              # Tipos TypeScript

📁 functions/
└── 📁 notes-generate/     # Função backend Node.js

📁 db/
└── 📁 migrations/         # Scripts SQL de migração

📁 Docs/                   # Documentação completa
```

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique se as variáveis de ambiente estão corretas
2. Confirme se as tabelas foram criadas no Supabase
3. Use a página `/test` para configuração automática
4. Verifique os logs do console para erros específicos
5. Consulte a documentação adicional em `Docs/`
6. Consulte a documentação do Supabase para configurações avançadas

## 🎉 Status do Projeto

**✅ PROJETO 100% FUNCIONAL**

- ✅ Sistema de autenticação completo
- ✅ Dashboard com KPIs em tempo real
- ✅ CRUD completo para clientes, bombas e relatórios
- ✅ Sistema de notas fiscais com geração de arquivos
- ✅ Função backend para geração de documentos
- ✅ Interface responsiva e moderna
- ✅ Validação completa de formulários
- ✅ Documentação técnica completa
- ✅ Scripts de configuração automática

**🚀 Pronto para uso em produção!**



