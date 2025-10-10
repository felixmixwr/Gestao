# Correção de Erro de Foreign Key para Bombas Terceiras

## Problema Identificado

Ao criar um relatório com uma bomba terceira, o sistema apresentava o seguinte erro:

```
Erro ao criar relatório: Erro ao inserir relatório: insert or update on table "reports" violates foreign key constraint "reports_pump_id_fkey"
```

## Causa do Problema

A tabela `reports` possuía uma foreign key constraint `reports_pump_id_fkey` que referenciava apenas a tabela `pumps`, não incluindo as bombas terceiras da tabela `bombas_terceiras`. Quando o sistema tentava inserir um relatório com uma bomba terceira, a constraint falhava porque o ID da bomba não existia na tabela `pumps`.

## Soluções Implementadas

### 1. Correção da Foreign Key Constraint

**Arquivo:** `db/migrations/011_fix_reports_pump_id_constraint.sql`

- Removida a constraint existente `reports_pump_id_fkey`
- Criada uma função personalizada `check_pump_reference()` que valida se o `pump_id` existe em qualquer uma das tabelas:
  - `pumps` (bombas internas)
  - `bombas_terceiras` (bombas de terceiros)
- Criado um trigger `check_pump_reference_trigger` que executa a validação antes de inserir/atualizar registros na tabela `reports`

### 2. Melhoria na Interface do Usuário

**Arquivo:** `src/pages/reports/NewReport.tsx`

- Adicionado estado `selectedPump` para rastrear a bomba selecionada
- Atualizada a função `handlePumpChange` para detectar bombas terceiras
- Modificado o schema de validação para tornar os campos de equipe opcionais
- Implementada lógica condicional para ocultar a seção "Equipe" quando uma bomba terceira for selecionada
- Adicionado aviso informativo quando uma bomba terceira é selecionada

### 3. Interface Atualizada

- **Seção Equipe:** Ocultada automaticamente para bombas terceiras
- **Aviso Informativo:** Exibido quando bomba terceira é selecionada, explicando que a equipe será fornecida pela empresa proprietária
- **Validação:** Campos de motorista e auxiliares tornados opcionais para bombas terceiras

## Arquivos Modificados

1. `db/migrations/011_fix_reports_pump_id_constraint.sql` - Migração do banco de dados
2. `src/pages/reports/NewReport.tsx` - Componente de criação de relatórios
3. `scripts/apply_migration_011.sql` - Script para aplicar a migração
4. `scripts/test_bombas_terceiras_fix.sql` - Script de teste das correções

## Como Aplicar as Correções

### 1. Aplicar Migração do Banco de Dados

Execute o script `scripts/apply_migration_011.sql` no SQL Editor do Supabase:

```sql
-- Execute o conteúdo do arquivo apply_migration_011.sql
```

### 2. Verificar Correções

Execute o script `scripts/test_bombas_terceiras_fix.sql` para verificar se as correções foram aplicadas corretamente.

### 3. Testar Interface

1. Acesse a página de criação de relatórios
2. Selecione uma bomba terceira
3. Verifique se a seção "Equipe" é ocultada
4. Verifique se o aviso informativo é exibido
5. Tente criar o relatório - deve funcionar sem erros

## Benefícios das Correções

1. **Resolução do Erro:** Relatórios com bombas terceiras podem ser criados sem erros de foreign key
2. **Melhor UX:** Interface mais intuitiva que oculta campos irrelevantes para bombas terceiras
3. **Validação Robusta:** Sistema valida corretamente referências tanto para bombas internas quanto terceiras
4. **Flexibilidade:** Suporte completo para ambos os tipos de bombas no sistema

## Testes Recomendados

1. Criar relatório com bomba interna (deve funcionar normalmente)
2. Criar relatório com bomba terceira (deve funcionar e ocultar equipe)
3. Verificar se os relatórios são salvos corretamente no banco de dados
4. Testar edição de relatórios existentes
5. Verificar se a listagem de relatórios funciona corretamente

## Observações Importantes

- A migração é segura e não afeta dados existentes
- O trigger criado valida automaticamente todas as inserções e atualizações
- A interface se adapta automaticamente ao tipo de bomba selecionada
- Não há impacto na performance do sistema















