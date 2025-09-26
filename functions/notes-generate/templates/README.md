# Templates

Este diretório deve conter o template XLSX para geração de notas fiscais.

## Arquivo necessário:
- `fatura_template.xlsx` - Template Excel com placeholders para preenchimento automático

## Placeholders suportados:
- `{{LOGO}}` - Será substituído pela logo da empresa (felixmix.png ou worldrental.png)
- `{{FONE}}` - Telefone da empresa
- `{{DATA_EMISSAO}}` - Data de emissão da nota
- `{{EMPRESA}}` - Nome da empresa cliente
- `{{ENDERECO}}` - Endereço da empresa cliente
- `{{CNPJ_CPF}}` - CNPJ ou CPF da empresa cliente
- `{{MUNICIPIO}}` - Cidade da empresa cliente
- `{{CEP}}` - CEP da empresa cliente
- `{{UF}}` - Estado da empresa cliente
- `{{FATURA_NUMERO}}` - Número da fatura (gerado automaticamente)
- `{{VALOR}}` - Valor da nota fiscal
- `{{VENCIMENTO}}` - Data de vencimento
- `{{DESCRIMINACAO}}` - Descrição dos serviços
- `{{OBSERVACOES}}` - Observações adicionais

## Como usar:
1. Crie seu template Excel com os placeholders nas células desejadas
2. Salve como `fatura_template.xlsx` neste diretório
3. A função automaticamente encontrará e usará este template
