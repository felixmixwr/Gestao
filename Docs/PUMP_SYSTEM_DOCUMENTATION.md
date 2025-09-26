# Sistema de Bombas - Documentação Técnica

## Visão Geral

O sistema de bombas foi implementado com três páginas principais que seguem os padrões estabelecidos no projeto:

- **PumpsList** (`/pumps`) - Lista de bombas com filtros e ordenação
- **NewPump** (`/pumps/new`) - Formulário para criação de novas bombas
- **PumpDetails** (`/pumps/:id`) - Detalhes da bomba e relatórios associados

## Estrutura do Banco de Dados

### Tabela `pumps`

```sql
- id: UUID (PK)
- prefix: VARCHAR(50) UNIQUE - Prefixo único da bomba (ex: BM-001)
- model: VARCHAR(100) - Modelo da bomba
- pump_type: ENUM('Estacionária', 'Lança') - Tipo da bomba
- brand: VARCHAR(100) - Marca da bomba
- capacity_m3h: DECIMAL(10,2) - Capacidade em m³/h
- year: INTEGER - Ano de fabricação
- status: ENUM('Disponível', 'Em Uso', 'Em Manutenção') - Status atual
- owner_company_id: UUID (FK) - Empresa proprietária
- total_billed: DECIMAL(12,2) - Total faturado (atualizado automaticamente)
- notes: TEXT - Observações
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Tabela `reports`

```sql
- total_value: DECIMAL(12,2) - Valor total do relatório
```

## Funcionalidades Implementadas

### 1. PumpsList (`/pumps`)

**Características:**
- Grid responsivo de cards usando `PumpCard` component
- Filtros por status e empresa proprietária
- Ordenação por faturamento total ou prefixo
- Botão "Nova Bomba" que redireciona para `/pumps/new`
- Cards mostram: prefixo, modelo, tipo, status (Badge), total faturado, empresa

**Filtros disponíveis:**
- Status: Todos, Disponível, Em Uso, Em Manutenção
- Empresa: Todas as empresas cadastradas
- Ordenação: Maior/menor faturamento, prefixo A-Z/Z-A

### 2. NewPump (`/pumps/new`)

**Campos do formulário:**
- `prefix*` (obrigatório, único) - Validação de unicidade antes do insert
- `model` - Modelo da bomba
- `pump_type` - Select com opções: Estacionária | Lança
- `brand` - Marca da bomba
- `capacity_m3h` - Capacidade em m³/h (number)
- `year` - Ano de fabricação (number, 1900-atual)
- `status` - Select com opções: Disponível | Em Uso | Em Manutenção
- `owner_company_id*` (obrigatório) - Select com empresas da tabela companies
- `notes` - Observações (textarea)

**Validações:**
- Prefixo obrigatório e único (verificação no banco antes do insert)
- Campos numéricos sanitizados
- Todos os campos opcionais podem ser nulos
- `total_billed` inicializado em 0.0 por padrão

**Comportamento:**
- On submit: inserir no Supabase e redirecionar para `/pumps`
- Loading states durante validação de unicidade e inserção
- Tratamento de erros com toast notifications

### 3. PumpDetails (`/pumps/:id`)

**Seções principais:**
1. **Header** - Prefixo, modelo, botões de ação
2. **Status Banner** - Banner amarelo para "Em Uso", vermelho para "Em Manutenção"
3. **Informações da Bomba** - Todos os dados cadastrais + total faturado
4. **Relatórios** - Lista de relatórios que usaram esta bomba

**Informações exibidas:**
- Dados completos da bomba (prefixo, modelo, tipo, marca, capacidade, ano, status, empresa)
- Total faturado em destaque
- Observações (se houver)
- Lista de relatórios com: número, cliente, período, horas, valor, data

**Banners de status:**
- **Em Uso**: Banner amarelo com ícone de aviso
- **Em Manutenção**: Banner vermelho com ícone de erro
- **Disponível**: Sem banner

## Integração com Relatórios

### Atualização Automática do `total_billed`

**Backend (Trigger SQL):**
```sql
-- Função que atualiza automaticamente o total_billed da bomba
CREATE OR REPLACE FUNCTION update_pump_total_billed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pumps 
  SET total_billed = (
    SELECT COALESCE(SUM(total_value), 0) 
    FROM reports 
    WHERE pump_id = NEW.pump_id
  )
  WHERE id = NEW.pump_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que executa a função automaticamente
CREATE TRIGGER trigger_update_pump_total_billed
  AFTER INSERT OR UPDATE OR DELETE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_pump_total_billed();
```

**Frontend (Atualização Otimista):**
- Após criação de relatório em `/reports/new`
- Fetch/refresh dos dados da bomba para atualizar `total_billed`
- Atualização da UI sem necessidade de reload completo

### Fluxo de Integração

1. **Criação de Relatório** (`/reports/new`):
   - Usuário seleciona bomba
   - Preenche dados do relatório
   - On submit: inserir relatório no banco
   - Trigger SQL atualiza automaticamente `pumps.total_billed`
   - Frontend faz refresh dos dados da bomba
   - UI atualizada com novo valor

2. **Visualização** (`/pumps/:id`):
   - Mostra `total_billed` atualizado
   - Lista todos os relatórios da bomba
   - Valores calculados dinamicamente

## Componentes Criados

### PumpCard
- Card responsivo para exibição no grid
- Badge colorido para status
- Formatação de moeda para total faturado
- Botão "Ver detalhes" que abre `/pumps/:id`

### Validações e UX

**Campos numéricos:**
- Sanitização automática de entrada
- Placeholders informativos
- Validação de range (ano: 1900-atual)

**Loading states:**
- Durante busca de dados
- Durante validação de unicidade
- Durante inserção/atualização

**Tratamento de erros:**
- Mensagens específicas para cada tipo de erro
- Toast notifications para feedback
- Fallbacks para dados não encontrados

## Scripts SQL Necessários

Execute o arquivo `pump-database-update.sql` no Supabase SQL Editor para:

1. Adicionar novas colunas à tabela `pumps`
2. Atualizar constraints e foreign keys
3. Criar trigger para atualização automática de `total_billed`
4. Criar índices para performance
5. Atualizar dados existentes

## Considerações Técnicas

### Performance
- Índices criados em campos frequentemente consultados
- Paginação implementada na lista de bombas
- Debounce na busca (se implementada futuramente)

### Segurança
- Validação de unicidade no frontend e backend
- Constraints de banco para integridade dos dados
- Sanitização de inputs numéricos

### Manutenibilidade
- Componentes reutilizáveis (`PumpCard`, `Badge`)
- Tipos TypeScript bem definidos
- Separação clara de responsabilidades
- Documentação completa dos fluxos

## Próximos Passos Sugeridos

1. **Implementar edição de bombas** (`/pumps/:id/edit`)
2. **Adicionar busca por texto** na lista de bombas
3. **Implementar paginação** na lista de bombas
4. **Adicionar exportação CSV** da lista de bombas
5. **Implementar histórico de alterações** das bombas
6. **Adicionar upload de fotos** das bombas
7. **Implementar notificações** para bombas em manutenção
