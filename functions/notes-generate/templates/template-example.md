# Exemplo de Template Excel

Para criar o template `fatura_template.xlsx`, use este exemplo como referência:

## Estrutura sugerida:

### Cabeçalho (linhas 1-5)
```
A1: {{LOGO}}
B1: NOTA FISCAL DE LOCAÇÃO
C1: Número: {{FATURA_NUMERO}}

A2: Data de Emissão: {{DATA_EMISSAO}}
B2: Data de Vencimento: {{VENCIMENTO}}
```

### Dados da Empresa (linhas 6-12)
```
A6: EMPRESA: {{EMPRESA}}
A7: CNPJ/CPF: {{CNPJ_CPF}}
A8: ENDEREÇO: {{ENDERECO}}
A9: CIDADE: {{MUNICIPIO}} - {{UF}}
A10: CEP: {{CEP}}
A11: TELEFONE: {{FONE}}
```

### Descrição dos Serviços (linhas 13-20)
```
A13: DESCRIÇÃO DOS SERVIÇOS:
A14: {{DESCRIMINACAO}}
```

### Valor (linhas 21-22)
```
A21: VALOR TOTAL: R$ {{VALOR}}
```

### Observações (linhas 23-25)
```
A23: OBSERVAÇÕES:
A24: {{OBSERVACOES}}
```

## Instruções:

1. Abra o Excel
2. Crie uma nova planilha
3. Insira os placeholders conforme o exemplo acima
4. Formate conforme necessário (fontes, cores, bordas)
5. Salve como `fatura_template.xlsx` na pasta `templates/`

## Dicas de formatação:

- Use fonte Arial ou Calibri, tamanho 11-12
- Centralize o cabeçalho
- Alinhe dados à esquerda
- Use bordas para separar seções
- Reserve espaço adequado para a logo (célula A1)
- Mantenha layout simples e profissional
