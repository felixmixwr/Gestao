# Módulo Bombas de Terceiros - Documentação

## Visão Geral

O módulo Bombas de Terceiros permite o cadastro, gerenciamento e organização de bombas que pertencem a empresas terceiras, garantindo que possam ser filtradas e utilizadas em relatórios, programação e financeiro de forma idêntica às bombas internas (WORLD RENTAL e FELIX MIX).

## Estrutura do Banco de Dados

### Tabela: empresas_terceiras

```sql
CREATE TABLE empresas_terceiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_fantasia VARCHAR(255) NOT NULL,
    razao_social VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela: bombas_terceiras

```sql
CREATE TABLE bombas_terceiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas_terceiras(id) ON DELETE CASCADE,
    prefixo VARCHAR(50) NOT NULL,
    modelo VARCHAR(100),
    ano INTEGER,
    status status_bomba_terceira DEFAULT 'ativa',
    proxima_manutencao DATE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enum: status_bomba_terceira

```sql
CREATE TYPE status_bomba_terceira AS ENUM ('ativa', 'em manutenção', 'indisponível');
```

### View: view_bombas_terceiras_com_empresa

```sql
CREATE VIEW view_bombas_terceiras_com_empresa AS
SELECT 
    bt.id,
    bt.empresa_id,
    bt.prefixo,
    bt.modelo,
    bt.ano,
    bt.status,
    bt.proxima_manutencao,
    bt.observacoes,
    bt.created_at,
    bt.updated_at,
    et.nome_fantasia as empresa_nome_fantasia,
    et.razao_social as empresa_razao_social,
    et.cnpj as empresa_cnpj,
    et.telefone as empresa_telefone,
    et.email as empresa_email,
    et.endereco as empresa_endereco
FROM bombas_terceiras bt
LEFT JOIN empresas_terceiras et ON bt.empresa_id = et.id;
```

## Scripts SQL

Os scripts SQL estão localizados em:
- `scripts/SQL/005_create_empresas_terceiras_table.sql`
- `scripts/SQL/006_create_bombas_terceiras_table.sql`

## Estrutura do Frontend

### Componentes

#### EmpresaTerceiraCard
- Exibe informações resumidas da empresa
- Mostra estatísticas das bombas (total e ativas)
- Botões para ver detalhes e criar nova bomba

#### EmpresaTerceiraForm
- Formulário para criar/editar empresas terceiras
- Validação de CNPJ e email
- Formatação automática de CNPJ e telefone

#### BombaTerceiraCard
- Exibe informações da bomba com dados da empresa
- Mostra status e informações de manutenção
- Botões para ver detalhes e editar

#### BombaTerceiraForm
- Formulário para criar/editar bombas terceiras
- Seleção de empresa (pode ser pré-selecionada)
- Validação de campos obrigatórios

### Páginas

#### EmpresasList (`/bombas-terceiras/empresas`)
- Lista todas as empresas terceiras
- Estatísticas gerais do módulo
- Busca por nome da empresa
- Cards com informações resumidas

#### EmpresaForm (`/bombas-terceiras/empresas/nova`, `/bombas-terceiras/empresas/:id/editar`)
- Formulário para criar/editar empresa
- Validação completa dos dados
- Redirecionamento após salvar

#### EmpresaDetails (`/bombas-terceiras/empresas/:id`)
- Detalhes completos da empresa
- Estatísticas das bombas da empresa
- Lista de bombas associadas
- Opções para editar e excluir empresa

#### BombasList (`/bombas-terceiras/bombas`)
- Lista todas as bombas terceiras
- Filtros por empresa, status e manutenção próxima
- Busca por prefixo, modelo ou empresa
- Cards com informações resumidas

#### BombaForm (`/bombas-terceiras/bombas/nova`, `/bombas-terceiras/bombas/:id/editar`)
- Formulário para criar/editar bomba
- Seleção de empresa
- Validação de campos obrigatórios

#### BombaDetails (`/bombas-terceiras/bombas/:id`)
- Detalhes completos da bomba
- Informações da empresa proprietária
- Opções para editar e excluir bomba

## API e Serviços

### EmpresasTerceirasService

```typescript
// Métodos disponíveis:
- listarEmpresas(filters?: EmpresaTerceiraFilters): Promise<EmpresaTerceira[]>
- buscarEmpresaPorId(id: string): Promise<EmpresaTerceiraWithBombas | null>
- criarEmpresa(data: CreateEmpresaTerceiraData): Promise<EmpresaTerceira>
- atualizarEmpresa(data: UpdateEmpresaTerceiraData): Promise<EmpresaTerceira>
- excluirEmpresa(id: string): Promise<void>
- obterEstatisticas(): Promise<EmpresaTerceiraStats>
```

### BombasTerceirasService

```typescript
// Métodos disponíveis:
- listarBombas(filters?: BombaTerceiraFilters): Promise<BombaTerceiraWithEmpresa[]>
- buscarBombaPorId(id: string): Promise<BombaTerceiraWithEmpresa | null>
- criarBomba(data: CreateBombaTerceiraData): Promise<BombaTerceira>
- atualizarBomba(data: UpdateBombaTerceiraData): Promise<BombaTerceira>
- excluirBomba(id: string): Promise<void>
- listarBombasPorEmpresa(empresaId: string): Promise<BombaTerceira[]>
- obterEstatisticasPorEmpresa(): Promise<BombaTerceiraStatsByEmpresa[]>
```

## Tipos TypeScript

### Interfaces Principais

```typescript
interface EmpresaTerceira {
  id: string
  nome_fantasia: string
  razao_social?: string
  cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  created_at: string
  updated_at: string
}

interface BombaTerceira {
  id: string
  empresa_id: string
  prefixo: string
  modelo?: string
  ano?: number
  status: StatusBombaTerceira
  proxima_manutencao?: string
  observacoes?: string
  created_at: string
  updated_at: string
}
```

### Tipos de Status

```typescript
type StatusBombaTerceira = 'ativa' | 'em manutenção' | 'indisponível'
```

## Funcionalidades Implementadas

### ✅ Empresas Terceiras
- [x] Cadastro de empresas terceiras
- [x] Listagem com busca e filtros
- [x] Edição de empresas
- [x] Exclusão de empresas (com confirmação)
- [x] Validação de CNPJ
- [x] Formatação automática de campos
- [x] Estatísticas gerais

### ✅ Bombas Terceiras
- [x] Cadastro de bombas vinculadas a empresas
- [x] Listagem com filtros avançados
- [x] Edição de bombas
- [x] Exclusão de bombas (com confirmação)
- [x] Controle de status (ativa, em manutenção, indisponível)
- [x] Agendamento de manutenção
- [x] Observações e notas
- [x] Estatísticas por empresa

### ✅ Interface e UX
- [x] Design consistente com o sistema
- [x] Cards informativos
- [x] Filtros e busca
- [x] Navegação breadcrumb
- [x] Confirmações de exclusão
- [x] Feedback visual (loading, erros, sucesso)
- [x] Responsividade mobile

## Integrações Futuras

### 🔄 Programação
- Integrar bombas terceiras na seleção de bombas para programação
- Filtrar bombas por empresa terceira
- Mostrar informações da empresa na programação

### 🔄 Relatórios
- Permitir filtrar relatórios por empresa terceira
- Incluir bombas terceiras nos relatórios gerais
- Relatórios específicos por empresa terceira

### 🔄 Financeiro
- Custos e receitas associados às bombas terceiras
- Controle de pagamentos para empresas terceiras
- Relatórios financeiros por empresa

### 🔄 Manutenção e OS
- Sistema de ordens de serviço para bombas terceiras
- Controle de manutenção preventiva
- Histórico de manutenções

## Navegação

O módulo está acessível através do sidebar principal:
- **Bombas Terceiras** → `/bombas-terceiras/empresas`

### Rotas Disponíveis

```
/bombas-terceiras/empresas                    # Lista de empresas
/bombas-terceiras/empresas/nova              # Nova empresa
/bombas-terceiras/empresas/:id               # Detalhes da empresa
/bombas-terceiras/empresas/:id/editar        # Editar empresa
/bombas-terceiras/empresas/:empresaId/bombas/nova  # Nova bomba para empresa específica
/bombas-terceiras/bombas                     # Lista de bombas
/bombas-terceiras/bombas/nova                # Nova bomba
/bombas-terceiras/bombas/:id                 # Detalhes da bomba
/bombas-terceiras/bombas/:id/editar         # Editar bomba
```

## Validações e Regras de Negócio

### Empresas Terceiras
- Nome fantasia é obrigatório
- CNPJ deve ser válido (quando informado)
- Email deve ter formato válido (quando informado)
- CNPJ deve ser único no sistema

### Bombas Terceiras
- Prefixo é obrigatório e único por empresa
- Empresa deve existir
- Status padrão é "ativa"
- Ano deve estar entre 1900 e ano atual + 1

## Considerações Técnicas

### Performance
- Índices criados para consultas frequentes
- View otimizada para joins entre bombas e empresas
- Paginação implementada nas listagens

### Segurança
- Validação de dados no frontend e backend
- Sanitização de inputs
- Controle de acesso através de autenticação

### Manutenibilidade
- Código modular e bem documentado
- Separação clara de responsabilidades
- Tipos TypeScript para type safety
- Componentes reutilizáveis

## Próximos Passos

1. **Testes**: Implementar testes unitários e de integração
2. **Documentação da API**: Criar documentação Swagger/OpenAPI
3. **Logs**: Implementar sistema de logs para auditoria
4. **Backup**: Configurar backup automático das tabelas
5. **Monitoramento**: Implementar métricas de uso do módulo

