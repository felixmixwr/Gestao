# 🧹 Limpeza de Scripts SQL Desnecessários

## ⚠️ Scripts que podem ser DELETADOS

Estes scripts SQL **NÃO são mais necessários** porque a solução final **NÃO usa RPC**:

### ❌ Deletar:
- `FIX_FINAL_EXECUTAR_AGORA.sql` - ❌ Tentativa de corrigir RPC (não usado)
- `FORCE_UPDATE_FUNCTION.sql` - ❌ Tentativa de corrigir RPC (não usado)
- `EXECUTAR_ESTE_AGORA.sql` - ❌ Tentativa de corrigir RPC (não usado)
- `CORRECAO_FINAL_REPORT_NUMBER.sql` - ❌ Tentativa de corrigir RPC (não usado)
- `db/migrations/014_fix_create_bombing_report_ambiguity.sql` - ❌ Correção RPC (não usado)
- `db/migrations/015_fix_all_report_functions_ambiguity.sql` - ❌ Correção RPC (não usado)
- `scripts/apply_migration_014.sql` - ❌ Aplicação de migration desnecessária
- `FIX_AMBIGUIDADE_SQL_CONFIRMACAO.md` - ❌ Documentação de tentativas falhadas

## ✅ Scripts NECESSÁRIOS

Estes scripts **DEVEM ser mantidos**:

### ✅ Manter:
- `db/migrations/013_add_programacao_bombeamento_fields.sql` - ✅ Adiciona campos essenciais
- `scripts/apply_migration_013.sql` - ✅ Aplicação da migration 013
- `scripts/SQL/reports-rpc-functions.sql` - ✅ Funções RPC (outras partes do sistema usam)

## 🔄 Por que a RPC não é mais usada?

A função `create_bombing_report` tinha bugs SQL de ambiguidade que eram difíceis de corrigir. A solução foi:

**Usar INSERT direto** igual ao fluxo normal de criação de relatórios (`NewReport.tsx`):

```typescript
// ✅ SOLUÇÃO FINAL (sem RPC)
const { data: reportResult } = await supabase
  .from('reports')
  .insert(reportData)
  .select('id, report_number')
  .single();
```

## 📝 Como limpar

### Opção 1: Deletar manualmente
```bash
cd WorldRental_FelixMix

# Deletar scripts temporários
rm -f FIX_FINAL_EXECUTAR_AGORA.sql
rm -f FORCE_UPDATE_FUNCTION.sql
rm -f EXECUTAR_ESTE_AGORA.sql
rm -f CORRECAO_FINAL_REPORT_NUMBER.sql
rm -f FIX_AMBIGUIDADE_SQL_CONFIRMACAO.md

# Deletar migrations desnecessárias
rm -f db/migrations/014_fix_create_bombing_report_ambiguity.sql
rm -f db/migrations/015_fix_all_report_functions_ambiguity.sql
rm -f scripts/apply_migration_014.sql
```

### Opção 2: Mover para pasta de backup
```bash
mkdir -p _backup_scripts_nao_usados
mv FIX_*.sql _backup_scripts_nao_usados/
mv FORCE_*.sql _backup_scripts_nao_usados/
mv EXECUTAR_*.sql _backup_scripts_nao_usados/
mv CORRECAO_*.sql _backup_scripts_nao_usados/
mv db/migrations/014_*.sql _backup_scripts_nao_usados/
mv db/migrations/015_*.sql _backup_scripts_nao_usados/
```

## ⚠️ IMPORTANTE

**NÃO delete** o arquivo `scripts/SQL/reports-rpc-functions.sql` mesmo que tenha a função `create_bombing_report`, porque:

1. Outras partes do sistema podem usar outras funções deste arquivo
2. Pode ser referência futura
3. A função RPC corrigida pode ser útil para outros casos

---

**Resumo:** A solução final NÃO usa RPC, então todos os scripts de correção de RPC são desnecessários.


