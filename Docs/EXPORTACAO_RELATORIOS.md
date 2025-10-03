# Sistema de Exportação de Relatórios - Félix Mix / World Rental

## 📊 Visão Geral

O sistema de exportação permite gerar relatórios profissionais em formato XLSX (Excel) e PDF, incluindo todos os filtros aplicados na visualização atual. Os arquivos são formatados de forma apresentável para envio direto aos clientes.

## 🚀 Funcionalidades

### ✅ Exportação XLSX (Excel)
- **Formatação Profissional**: Cabeçalho com logo da empresa, cores corporativas
- **Dados Completos**: Todos os campos dos relatórios incluídos
- **Filtros Aplicados**: Informações dos filtros utilizados na busca
- **Formatação de Células**: Bordas, cores alternadas, alinhamento adequado
- **Valores Monetários**: Formatação em Real brasileiro (R$)
- **Volumes**: Formatação numérica com casas decimais

### ✅ Exportação PDF
- **Layout Profissional**: Cabeçalho colorido com identidade visual
- **Resumo Executivo**: Totais de valor e volume
- **Filtros Detalhados**: Lista completa dos filtros aplicados
- **Tabela Organizada**: Dados em formato tabular legível
- **Paginação**: Numeração de páginas automática
- **Rodapé Informativo**: Dados da empresa e data de exportação

## 🎯 Como Usar

### 1. Acessar a Lista de Relatórios
- Navegue para a página "Relatórios" no sistema
- Aplique os filtros desejados (status, período, cliente, bomba, etc.)

### 2. Iniciar Exportação
- Clique no botão **"📊 Exportar"** no cabeçalho da página
- O botão fica desabilitado quando não há relatórios para exportar

### 3. Configurar Exportação
No modal que aparece, você pode:

#### Selecionar Formato
- **📊 Excel (XLSX)**: Planilha editável com formatação profissional
- **📄 PDF**: Documento pronto para impressão e envio

#### Visualizar Resumo
- Total de registros que serão exportados
- Valor total dos relatórios
- Volume total bombeado
- Filtros aplicados que serão incluídos

#### Opções de Email (Futuro)
- Marcar para enviar por email após exportação
- Inserir emails dos destinatários

### 4. Executar Exportação
- Clique em **"Exportar XLSX"** ou **"Exportar PDF"**
- O arquivo será baixado automaticamente
- Nome do arquivo inclui timestamp: `relatorios_bombeamento_20241201_143022.xlsx`

## 📋 Campos Incluídos na Exportação

### Dados Principais
- **Nº**: Numeração sequencial
- **ID Relatório**: Número único do relatório
- **Data**: Data do bombeamento
- **Cliente**: Nome da empresa cliente
- **Representante**: Nome do representante do cliente
- **Telefone**: Contato WhatsApp
- **Endereço**: Local da obra

### Dados da Bomba
- **Bomba**: Prefixo da bomba utilizada
- **Modelo Bomba**: Modelo específico
- **Empresa Bomba**: Proprietária da bomba (interna ou terceira)

### Dados Operacionais
- **Volume Planejado**: Volume previsto (m³)
- **Volume Realizado**: Volume efetivamente bombeado (m³)
- **Motorista**: Nome do motorista
- **Auxiliar 1**: Primeiro auxiliar
- **Auxiliar 2**: Segundo auxiliar

### Dados Financeiros
- **Valor Total**: Valor cobrado (R$)
- **Status**: Status atual do pagamento
- **Observações**: Notas adicionais
- **Data Criação**: Quando o relatório foi criado

## 🔍 Filtros Suportados

Todos os filtros aplicados na interface são incluídos na exportação:

### Filtros de Status
- Enviado ao Financeiro
- Recebido pelo Financeiro
- Aguardando Aprovação
- Nota Emitida
- Aguardando Pagamento
- Pago

### Filtros de Período
- Hoje
- Ontem
- Últimos 7 dias
- Últimos 30 dias
- Período personalizado

### Filtros de Busca
- ID do Relatório
- Data
- Cliente
- Bomba
- Volume
- Valor

### Filtros Avançados
- ID específico do relatório
- Nome do cliente
- Prefixo da bomba
- Faixa de volume (mínimo/máximo)
- Faixa de valor (mínimo/máximo)

## 🎨 Formatação Visual

### XLSX (Excel)
- **Cabeçalho**: Azul corporativo (#0066CC)
- **Título**: Centralizado, negrito, tamanho 16
- **Cabeçalho da Tabela**: Fundo azul claro, texto branco
- **Linhas Alternadas**: Fundo cinza claro para melhor leitura
- **Bordas**: Linhas finas em todas as células
- **Valores**: Formatação monetária brasileira
- **Volumes**: Formatação numérica com 2 casas decimais

### PDF
- **Cabeçalho**: Fundo azul com texto branco
- **Informações**: Caixas coloridas para destacar dados
- **Tabela**: Cabeçalho azul, linhas alternadas
- **Rodapé**: Informações da empresa e data
- **Paginação**: Numeração automática

## 🧪 Testes

Para testar o sistema de exportação, você pode usar as funções de teste disponíveis no console do navegador:

```javascript
// Testar exportação XLSX
testExports.testXLSXExport()

// Testar exportação PDF
testExports.testPDFExport()

// Testar exportação sem filtros
testExports.testExportWithoutFilters()

// Executar todos os testes
testExports.runAllExportTests()
```

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   └── ExportModal.tsx          # Modal de configuração de exportação
├── utils/
│   ├── reportExporter.ts        # Lógica principal de exportação
│   └── exportTest.ts           # Funções de teste
└── pages/reports/
    └── ReportsList.tsx         # Interface principal com botão de exportação
```

## 🔧 Dependências

- **xlsx**: Para geração de arquivos Excel
- **jspdf**: Para geração de arquivos PDF
- **jspdf-autotable**: Para tabelas no PDF
- **date-fns**: Para formatação de datas

## 🚀 Próximas Funcionalidades

- [ ] Envio automático por email
- [ ] Agendamento de exportações
- [ ] Templates personalizáveis
- [ ] Exportação em lote
- [ ] Integração com sistemas externos
- [ ] Relatórios gráficos

## 📞 Suporte

Para dúvidas ou problemas com o sistema de exportação, entre em contato com a equipe de desenvolvimento.

---

**Sistema de Gestão Félix Mix / World Rental**  
*Gestão de Bombas de Concreto*









