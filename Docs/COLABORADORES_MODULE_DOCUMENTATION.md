# 📋 Módulo de Colaboradores - Documentação

## 🎯 Visão Geral

O módulo de **Colaboradores** foi implementado com sucesso, oferecendo um CRUD completo para gerenciar os colaboradores da empresa, incluindo dependentes, documentos e horas extras com cálculo automático.

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

#### `colaboradores` (Tabela Principal)
- **id**: UUID (PK)
- **nome**: string (obrigatório)
- **funcao**: enum (Motorista Operador de Bomba, Auxiliar de Bomba, Programador, Administrador Financeiro, Fiscal de Obras, Mecânico)
- **tipo_contrato**: enum (fixo, diarista)
- **salario_fixo**: decimal (default 0)
- **data_pagamento_1/2**: date (opcional)
- **valor_pagamento_1/2**: decimal (opcional)
- **equipamento_vinculado_id**: UUID (FK → pumps.id)
- **registrado**: boolean
- **vale_transporte**: boolean
- **qtd_passagens_por_dia**: int (opcional)
- **company_id**: UUID (FK → companies.id)
- **created_at/updated_at**: timestamp

#### `colaboradores_dependentes`
- **id**: UUID (PK)
- **colaborador_id**: UUID (FK)
- **nome_completo**: string
- **data_nascimento**: date
- **local_nascimento**: string (opcional)
- **tipo_dependente**: string (opcional)

#### `colaboradores_documentos`
- **id**: UUID (PK)
- **colaborador_id**: UUID (FK)
- **tipo_documento**: enum (CNH, RG, Comprovante Residência, Reservista, Título Eleitor, CTPS, PIS, Outros)
- **dados_texto**: JSONB (opcional)
- **arquivo_url**: string (opcional)

#### `colaboradores_horas_extras`
- **id**: UUID (PK)
- **colaborador_id**: UUID (FK)
- **data**: date
- **horas**: decimal
- **valor_calculado**: decimal (calculado automaticamente)
- **tipo_dia**: enum (segunda-sexta, sabado)

## ⚙️ Funcionalidades Implementadas

### 1. **CRUD Completo de Colaboradores**
- ✅ Listagem com filtros avançados
- ✅ Cadastro com validações
- ✅ Edição de dados
- ✅ Exclusão com confirmação
- ✅ Visualização detalhada

### 2. **Gestão de Dependentes**
- ✅ Adicionar dependentes
- ✅ Listar dependentes por colaborador
- ✅ Excluir dependentes

### 3. **Gestão de Documentos**
- ✅ Upload de arquivos para Supabase Storage
- ✅ Campos específicos por tipo de documento
- ✅ Download de documentos
- ✅ Dados textuais estruturados

### 4. **Cálculo Automático de Horas Extras**
- ✅ Valor da diária = salário fixo / 30
- ✅ Segunda a sexta: diária / 2 por hora extra
- ✅ Sábado: diária completa por hora extra
- ✅ Cálculo automático no banco de dados

### 5. **Validações de Negócio**
- ✅ Mínimo de 2 auxiliares por bomba
- ✅ Validação de campos obrigatórios
- ✅ Controle de acesso por empresa (RLS)

## 🎨 Interface do Usuário

### Página Principal (`/colaboradores`)
- **Listagem**: Tabela responsiva com filtros
- **Busca**: Por nome do colaborador
- **Filtros**: Por função, tipo de contrato, status
- **Ações**: Ver detalhes, editar, excluir

### Modal de Cadastro/Edição
- **Campos básicos**: Nome, função, tipo de contrato
- **Campos condicionais**: Pagamentos (se contrato fixo)
- **Vinculação**: Equipamento (bomba)
- **Status**: Registrado, vale transporte

### Modal de Detalhes
- **Aba Informações**: Dados básicos e resumo financeiro
- **Aba Dependentes**: Lista e gestão de dependentes
- **Aba Documentos**: Lista e gestão de documentos
- **Aba Horas Extras**: Lista e gestão de horas extras

## 🔧 Componentes Criados

### Componentes Principais
- `ColaboradoresList.tsx` - Listagem principal
- `ColaboradorForm.tsx` - Formulário de cadastro/edição
- `ColaboradorDetails.tsx` - Modal de detalhes

### Componentes Auxiliares
- `DependenteForm.tsx` - Formulário de dependentes
- `DocumentoForm.tsx` - Formulário de documentos
- `HoraExtraForm.tsx` - Formulário de horas extras

### Tipos TypeScript
- `colaboradores.ts` - Todos os tipos e interfaces
- Atualização do `supabase.ts` com novas tabelas

## 🚀 Integrações Implementadas

### 1. **Sistema de Bombas**
- ✅ Vinculação de colaboradores a bombas
- ✅ Validação de mínimo de auxiliares
- ✅ Listagem de bombas disponíveis

### 2. **Sistema de Empresas**
- ✅ Controle de acesso por empresa (RLS)
- ✅ Isolamento de dados por empresa

### 3. **Sistema de Autenticação**
- ✅ Integração com Supabase Auth
- ✅ Controle de permissões

## 📊 Regras de Cálculo

### Horas Extras
```typescript
// Valor da diária
const valorDiaria = salarioFixo / 30

// Valor da hora extra
let valorHoraExtra
if (tipoDia === 'segunda-sexta') {
  valorHoraExtra = valorDiaria / 2
} else if (tipoDia === 'sabado') {
  valorHoraExtra = valorDiaria
}

// Total
const total = horas * valorHoraExtra
```

### Validações
- **Auxiliares por bomba**: Mínimo 2 auxiliares
- **Vale transporte**: Quantidade de passagens obrigatória
- **Salário**: Não pode ser negativo

## 🔐 Segurança

### Row Level Security (RLS)
- ✅ Políticas para todas as tabelas
- ✅ Isolamento por empresa
- ✅ Controle de acesso baseado em usuário autenticado

### Validações
- ✅ Validação de entrada no frontend
- ✅ Validação de negócio no banco
- ✅ Sanitização de dados

## 📁 Arquivos Criados/Modificados

### Scripts SQL
- `scripts/SQL/colaboradores-database-create.sql` - Criação completa das tabelas

### Tipos TypeScript
- `src/types/colaboradores.ts` - Tipos e interfaces
- `src/lib/supabase.ts` - Atualização com novas tabelas

### Componentes
- `src/components/ColaboradoresList.tsx`
- `src/components/ColaboradorForm.tsx`
- `src/components/ColaboradorDetails.tsx`
- `src/components/DependenteForm.tsx`
- `src/components/DocumentoForm.tsx`
- `src/components/HoraExtraForm.tsx`

### Páginas
- `src/pages/colaboradores/Colaboradores.tsx`

### Rotas
- `src/routes/index.tsx` - Adicionada rota `/colaboradores`

### Layout
- `src/components/Layout.tsx` - Adicionado link no menu

## 🎯 Próximos Passos (Integrações Futuras)

### 1. **Módulo de Programação**
- Seleção automática de motoristas e auxiliares
- Validação de disponibilidade
- Vinculação com bombas

### 2. **Módulo Financeiro**
- Lançamento automático de pagamentos fixos
- Lançamento de horas extras
- Relatórios de folha de pagamento

### 3. **Módulo de Relatórios**
- Relatórios de colaboradores por bomba
- Relatórios de horas extras
- Relatórios de custos operacionais

## ✅ Status de Implementação

- ✅ **Banco de dados**: 100% implementado
- ✅ **Backend**: 100% implementado (Supabase)
- ✅ **Frontend**: 100% implementado
- ✅ **Validações**: 100% implementadas
- ✅ **Integração com bombas**: 100% implementada
- ✅ **Cálculo de horas extras**: 100% implementado
- ✅ **Upload de documentos**: 100% implementado
- ✅ **Controle de acesso**: 100% implementado

## 🚀 Como Usar

1. **Execute o script SQL** no Supabase:
   ```sql
   -- Execute o arquivo: scripts/SQL/colaboradores-database-create.sql
   ```

2. **Acesse o módulo**:
   - Navegue para `/colaboradores`
   - Use o menu lateral para acessar "Colaboradores"

3. **Funcionalidades disponíveis**:
   - Cadastrar novos colaboradores
   - Editar dados existentes
   - Visualizar detalhes completos
   - Gerenciar dependentes
   - Gerenciar documentos
   - Registrar horas extras

## 📝 Observações Importantes

- **Validação de auxiliares**: O sistema impede vincular menos de 2 auxiliares por bomba
- **Cálculo automático**: As horas extras são calculadas automaticamente pelo banco
- **Upload de arquivos**: Documentos são armazenados no Supabase Storage
- **Controle de acesso**: Cada empresa vê apenas seus próprios colaboradores
- **Responsividade**: Interface adaptada para mobile e desktop

---

**Módulo implementado com sucesso!** 🎉

O sistema está pronto para uso e integração com os demais módulos do sistema.




