# Implementação do Novo Módulo de Notas Fiscais

## Resumo das Alterações

Este documento descreve a implementação completa do novo fluxo de notas fiscais conforme solicitado. O sistema agora permite criar notas fiscais diretamente vinculadas a relatórios, com upload de anexos e gestão completa do ciclo de vida das notas.

## Alterações Implementadas

### 1. Banco de Dados

#### Nova Tabela: `notas_fiscais`
- **Arquivo**: `db/migrations/005_create_notas_fiscais_table.sql`
- **Estrutura**:
  - `id`: UUID (chave primária)
  - `relatorio_id`: UUID (FK para reports)
  - `numero_nota`: VARCHAR(50) (obrigatório)
  - `data_emissao`: DATE (obrigatório)
  - `data_vencimento`: DATE (obrigatório)
  - `valor`: DECIMAL(10,2) (obrigatório, > 0)
  - `anexo_url`: TEXT (opcional, URL do Supabase Storage)
  - `status`: VARCHAR(20) (padrão: 'Faturada')
  - `created_at`, `updated_at`: TIMESTAMP

#### Políticas RLS
- Usuários autenticados podem ler, inserir, atualizar e deletar
- Índices criados para performance otimizada

### 2. Frontend - Componentes Criados

#### `NotaFiscalForm.tsx`
- **Localização**: `src/components/NotaFiscalForm.tsx`
- **Funcionalidades**:
  - Formulário com validação usando React Hook Form + Zod
  - Campos obrigatórios: número, data emissão, data vencimento, valor
  - Upload de anexo (PDF ou XML, máximo 10MB)
  - Validação de tipos de arquivo
  - Progress bar durante upload
  - Integração com Supabase Storage

#### `NotasFiscaisLista.tsx`
- **Localização**: `src/components/NotasFiscaisLista.tsx`
- **Funcionalidades**:
  - Lista todas as notas fiscais vinculadas a um relatório
  - Cards com informações resumidas
  - Status colorido (Faturada, Paga, Cancelada)
  - Botão para download de anexos
  - Botão para ver detalhes (placeholder)

### 3. Frontend - Páginas Modificadas

#### `ReportDetails.tsx`
- **Alterações**:
  - Importação dos novos componentes
  - Botão "+ Adicionar NF" que mostra/esconde formulário
  - Formulário embutido (não modal)
  - Lista de notas fiscais vinculadas ao relatório
  - Callbacks para atualização após criação de NF

#### `NotesList.tsx`
- **Alterações**:
  - **REMOVIDO**: Botão "+ Nova Nota"
  - Atualizada para usar tabela `notas_fiscais`
  - Query com JOIN para buscar dados do relatório e cliente
  - Colunas atualizadas: número, cliente, valor, emissão, vencimento, status
  - Estatísticas atualizadas: total, valor total, com anexos, pagas
  - Botões para ver relatório e download de anexo

### 4. Tipos TypeScript

#### `supabase.ts`
- Adicionado tipo `notas_fiscais` com Row, Insert e Update
- Campos tipados corretamente conforme esquema do banco

## Fluxo de Uso

### 1. Criação de Nota Fiscal
1. Usuário acessa detalhes de um relatório (`/reports/:id`)
2. Clica em "+ Adicionar NF"
3. Preenche formulário com dados obrigatórios
4. Opcionalmente faz upload de anexo (PDF/XML)
5. Submete o formulário
6. Nota é salva na tabela `notas_fiscais` vinculada ao relatório
7. Anexo é armazenado no Supabase Storage (bucket `attachments`)

### 2. Visualização de Notas
1. **Na página de Notas** (`/notes`):
   - Lista todas as notas fiscais do sistema
   - Mostra cliente, valor, datas, status
   - Permite download de anexos
   - Link para ver o relatório vinculado

2. **Na página de Detalhes do Relatório**:
   - Mostra todas as notas vinculadas ao relatório específico
   - Cards com informações resumidas
   - Botões para ações (detalhes, anexo)

## Validações Implementadas

### Frontend
- Número da nota obrigatório
- Datas obrigatórias (vencimento >= emissão)
- Valor obrigatório (> 0.01)
- Anexo opcional, mas validado se fornecido:
  - Tipos permitidos: PDF, XML
  - Tamanho máximo: 10MB

### Backend
- Constraint CHECK no valor (> 0)
- Foreign Key para relatórios
- RLS para segurança
- Triggers para updated_at

## Arquivos Modificados

### Novos Arquivos
- `db/migrations/005_create_notas_fiscais_table.sql`
- `src/components/NotaFiscalForm.tsx`
- `src/components/NotasFiscaisLista.tsx`
- `NOTAS_FISCAIS_IMPLEMENTATION.md`

### Arquivos Modificados
- `src/lib/supabase.ts` - Adicionados tipos da nova tabela
- `src/pages/reports/ReportDetails.tsx` - Integração com componentes de NF
- `src/pages/notes/NotesList.tsx` - Migração para nova tabela

## Configuração do Supabase Storage

Para que o upload de anexos funcione, é necessário:

1. **Criar bucket `attachments`** no Supabase Storage
2. **Configurar políticas** do bucket:
   ```sql
   -- Política para upload
   CREATE POLICY "Allow authenticated uploads" ON storage.objects
   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
   
   -- Política para leitura
   CREATE POLICY "Allow public read" ON storage.objects
   FOR SELECT USING (true);
   ```

3. **Estrutura de pastas**:
   ```
   attachments/
   └── notas-fiscais/
       ├── {relatorio_id}-{timestamp}.pdf
       └── {relatorio_id}-{timestamp}.xml
   ```

## Próximos Passos (Opcional)

1. **Página de detalhes da nota fiscal** - Implementar visualização completa
2. **Edição de notas fiscais** - Permitir alteração de dados
3. **Relatórios de notas fiscais** - Dashboards e exportações
4. **Notificações** - Alertas para vencimentos próximos
5. **Status avançados** - Workflow mais complexo (Enviada, Aprovada, etc.)

## Testes Recomendados

1. **Migração do banco** - Executar migration e verificar tabela
2. **Upload de anexos** - Testar PDF e XML
3. **Validações** - Testar campos obrigatórios e limites
4. **Integração** - Criar NF e verificar na listagem
5. **Relacionamentos** - Verificar vinculação com relatórios

---

**Status**: ✅ Implementação Completa
**Data**: $(date)
**Desenvolvedor**: Claude Sonnet (AI Assistant)
