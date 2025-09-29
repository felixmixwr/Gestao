# Módulo de Programação - Documentação

## 📋 Visão Geral

O módulo de **Programação** foi implementado para gerenciar programações de obras e bombas no sistema de gestão. Ele oferece um fluxo completo desde o cadastro até a visualização em tempo real através de um quadro branco interativo estilo kanban.

## 🗄️ Estrutura do Banco de Dados

### Tabela `programacao`

```sql
CREATE TABLE programacao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prefixo_obra TEXT NOT NULL,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    fc TEXT,
    cliente TEXT NOT NULL,
    responsavel TEXT,
    cep TEXT NOT NULL,
    endereco TEXT NOT NULL,
    numero TEXT NOT NULL,
    bairro TEXT,
    cidade TEXT,
    estado TEXT,
    volume_previsto NUMERIC,
    fck TEXT,
    brita TEXT,
    slump TEXT,
    equipe TEXT,
    motorista_operador TEXT,
    auxiliares_bomba TEXT[], -- Array de auxiliares (mínimo 1)
    bomba_id UUID REFERENCES bombas(id),
    empresa_id UUID REFERENCES empresas(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Características de Segurança

- **RLS (Row Level Security)** ativado
- Política de acesso baseada em empresa do usuário
- Trigger automático para atualização do `updated_at`

## 🚀 Funcionalidades Implementadas

### 1. Página de Cadastro/Edição (`/programacao/nova` e `/programacao/:id`)

#### Estrutura do Formulário
- **Seção 1 — Dados da Obra**
  - Prefixo da obra (obrigatório)
  - Cliente (obrigatório)
  - Responsável
  - Empresa (obrigatório)

- **Seção 2 — Data e Horário**
  - Data (obrigatório)
  - Horário (obrigatório)
  - FC

- **Seção 3 — Endereço**
  - CEP (obrigatório) com integração ViaCEP
  - Endereço (preenchido automaticamente, mas editável)
  - Número (obrigatório)
  - Bairro, Cidade, Estado (autocompletados)

- **Seção 4 — Concreto**
  - Volume previsto (m³)
  - FCK
  - Brita (select com opções predefinidas)
  - Slump

- **Seção 5 — Equipe e Bomba**
  - Equipe
  - Motorista/Operador (select de colaboradores)
  - Auxiliares de bomba (select múltiplo, mínimo 2)
  - Bomba (select das bombas disponíveis)

#### Validações Implementadas
- Campos obrigatórios
- Mínimo de 2 auxiliares de bomba
- Validação de CEP via API ViaCEP
- Verificação de conflitos de horário para bombas

### 2. Quadro Branco Interativo (`/programacao/board`)

#### Características
- **Visualização em colunas**: 7 dias a partir da data atual
- **Drag & Drop**: Mover programações entre dias
- **Cards informativos** com:
  - Prefixo da obra
  - Cliente
  - Horário
  - Endereço resumido
  - Quantidade de auxiliares
  - Volume previsto

#### Funcionalidades
- **Filtros avançados**:
  - Por empresa
  - Por bomba
  - Por colaborador
  - Busca por texto (prefixo, cliente, endereço)

- **Ações nos cards**:
  - Editar (clique no ícone de lápis)
  - Excluir (clique no ícone de lixeira)
  - Drag & drop para mover entre dias

### 3. Integração com API ViaCEP

#### Funcionalidades
- Busca automática de endereço ao digitar CEP
- Validação de formato de CEP
- Preenchimento automático de campos de endereço
- Formatação automática do CEP (máscara)

### 4. Supabase Subscriptions (Tempo Real)

#### Implementação
- Hook personalizado `useProgramacaoSubscription`
- Atualizações automáticas no quadro quando há mudanças
- Suporte para eventos: INSERT, UPDATE, DELETE
- Cleanup automático das subscriptions

## 📁 Estrutura de Arquivos

```
src/
├── types/
│   └── programacao.ts              # Tipos TypeScript
├── lib/
│   ├── programacao-api.ts          # API functions (CRUD)
│   └── viacep-api.ts               # Integração ViaCEP
├── hooks/
│   └── useSupabaseSubscription.ts  # Hook para subscriptions
└── pages/
    └── programacao/
        ├── index.ts                # Exportações
        ├── NovaProgramacao.tsx     # Página de cadastro/edição
        └── ProgramacaoBoard.tsx    # Quadro interativo
```

## 🔧 Dependências Adicionadas

```json
{
  "react-beautiful-dnd": "^13.1.1",
  "@types/react-beautiful-dnd": "^13.1.4"
}
```

## 🎯 Rotas Configuradas

- `/programacao/board` - Quadro branco interativo
- `/programacao/nova` - Nova programação
- `/programacao/:id` - Editar programação existente

## 🎨 Navegação

O módulo foi adicionado ao sidebar de navegação com o ícone 📅 e nome "Programação".

## 🔄 Fluxo de Uso

1. **Acessar o quadro**: `/programacao/board`
2. **Criar nova programação**: Botão "Nova Programação"
3. **Preencher formulário**: Dados completos da obra
4. **Salvar**: Redirecionamento automático para o quadro
5. **Gerenciar no quadro**: Drag & drop, editar, excluir
6. **Filtrar e buscar**: Usar filtros e busca em tempo real

## 🚨 Observações Importantes

### Scripts SQL Necessários
Execute o script `setup_programacao_only.sql` no Supabase antes de usar o módulo:

```bash
# Script que cria APENAS a tabela programacao:
scripts/SQL/setup_programacao_only.sql

# Este script NÃO altera a tabela colaboradores existente
# Ele se adapta à estrutura atual da tabela colaboradores
```

### Configurações de RLS
O módulo usa a estrutura padrão do sistema com tabelas `companies` e `users` para controle de acesso por empresa.

### Performance
- O quadro carrega programações dos próximos 7 dias
- Subscriptions são gerenciadas automaticamente
- Filtros são aplicados em tempo real

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de permissão**: Verificar políticas RLS
2. **ViaCEP não funciona**: Verificar conexão com internet
3. **Drag & drop não funciona**: Verificar se react-beautiful-dnd está instalado
4. **Subscriptions não atualizam**: Verificar configuração do Supabase

### Logs Úteis
- Console do navegador mostra eventos de subscription
- Status de conexão do Supabase é logado
- Erros de API são exibidos via toast notifications

## 📈 Próximas Melhorias

1. **Calendário**: Implementar visualização em calendário
2. **Relatórios**: Gerar relatórios de programação
3. **Notificações**: Alertas para conflitos de horário
4. **Exportação**: Exportar programações para Excel/PDF
5. **Mobile**: Otimização para dispositivos móveis

---

**Versão**: 1.0.0  
**Data**: $(date)  
**Status**: ✅ Implementado e Funcional
