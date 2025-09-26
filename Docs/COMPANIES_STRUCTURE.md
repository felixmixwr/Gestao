# Estrutura das Empresas - FELIX MIX e WORLDPAV

## 🏢 Empresas do Sistema

O sistema está configurado para trabalhar com duas empresas específicas:

### **FELIX MIX**
- **ID:** `felix-mix-id`
- **Nome:** FELIX MIX
- **Descrição:** Empresa principal do sistema

### **WORLDPAV**
- **ID:** `worldpav-id`
- **Nome:** WORLDPAV
- **Descrição:** Empresa parceira do sistema

## 📋 Scripts de Configuração

### 1. Limpar e Configurar Empresas
```sql
-- Execute no Supabase SQL Editor:
cleanup-companies.sql
```

Este script:
- ✅ Remove empresas existentes que não sejam FELIX MIX ou WORLDPAV
- ✅ Insere as duas empresas específicas
- ✅ Atualiza bombas para usar as empresas corretas
- ✅ Verifica se tudo foi configurado corretamente

### 2. Criar Sistema de Bombas
```sql
-- Execute no Supabase SQL Editor:
pump-database-simple.sql
```

Este script:
- ✅ Cria tabela `pumps` com referência às empresas
- ✅ Insere bombas de exemplo já associadas às empresas corretas

## 🎯 Distribuição das Bombas de Exemplo

### FELIX MIX
- **BM-001**: Modelo ABC-123 (Estacionária) - Status: Disponível
- **BM-003**: Modelo DEF-789 (Estacionária) - Status: Disponível

### WORLDPAV
- **BM-002**: Modelo XYZ-456 (Lança) - Status: Em Uso

## 🔍 Filtros e Seleções

### Na Lista de Bombas (`/pumps`)
- **Filtro por Empresa:** Dropdown com opções:
  - "Todas as empresas"
  - "FELIX MIX"
  - "WORLDPAV"

### No Formulário de Nova Bomba (`/pumps/new`)
- **Campo Empresa Proprietária:** Select com opções:
  - "FELIX MIX"
  - "WORLDPAV"

### Nos Detalhes da Bomba (`/pumps/:id`)
- **Empresa Proprietária:** Exibida em destaque
- **Relatórios:** Filtrados por bomba (que já tem empresa associada)

## 📊 Funcionalidades por Empresa

### Rastreabilidade
- ✅ Todas as bombas têm empresa proprietária definida
- ✅ Relatórios herdam a empresa da bomba utilizada
- ✅ Filtros permitem visualizar dados por empresa
- ✅ Relatórios mostram origem (FELIX MIX ou WORLDPAV)

### Controle de Acesso
- ✅ Sistema preparado para controle de acesso por empresa
- ✅ Dados segregados por empresa proprietária
- ✅ Relatórios filtrados por empresa

## 🚀 Como Usar

### 1. Configurar Banco de Dados
```bash
# Execute os scripts na ordem:
1. cleanup-companies.sql  (limpa e configura empresas)
2. setup-complete.sql     (ou pump-database-simple.sql)
```

### 2. Acessar o Sistema
- **Lista de Bombas:** `/pumps`
- **Nova Bomba:** `/pumps/new`
- **Detalhes:** `/pumps/:id`

### 3. Filtrar por Empresa
- Use o dropdown "Empresa" na lista de bombas
- Selecione "FELIX MIX" ou "WORLDPAV" para ver apenas bombas da empresa

## 📈 Relatórios e Faturamento

### Por Empresa
- **FELIX MIX:** Total faturado com bombas da FELIX MIX
- **WORLDPAV:** Total faturado com bombas da WORLDPAV

### Automático
- ✅ `total_billed` atualizado automaticamente por empresa
- ✅ Relatórios associados à empresa da bomba
- ✅ Controle de origem dos recursos

## 🔧 Manutenção

### Adicionar Nova Empresa
```sql
INSERT INTO companies (id, name) VALUES ('nova-empresa-id', 'NOVA EMPRESA');
```

### Alterar Empresa de uma Bomba
```sql
UPDATE pumps SET owner_company_id = 'nova-empresa-id' WHERE prefix = 'BM-001';
```

### Verificar Distribuição
```sql
SELECT 
  c.name as empresa,
  COUNT(p.id) as total_bombas,
  SUM(p.total_billed) as total_faturado
FROM companies c
LEFT JOIN pumps p ON c.id = p.owner_company_id
GROUP BY c.id, c.name
ORDER BY c.name;
```

## ✅ Checklist de Verificação

- [ ] Empresas FELIX MIX e WORLDPAV cadastradas
- [ ] Bombas de exemplo associadas às empresas corretas
- [ ] Filtros funcionando por empresa
- [ ] Formulário de nova bomba com empresas corretas
- [ ] Detalhes mostrando empresa proprietária
- [ ] Relatórios associados à empresa da bomba
- [ ] Sistema de faturamento por empresa funcionando
