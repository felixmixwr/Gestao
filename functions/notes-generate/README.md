# Notes Generate - Função Backend para Geração de Notas Fiscais

Esta função backend em Node.js gera notas fiscais em formato XLSX e PDF a partir de templates Excel, com integração completa ao Supabase.

## 🚀 Funcionalidades

- ✅ Autenticação JWT com Supabase
- ✅ Validação de permissões (roles: `financeiro`, `admin`)
- ✅ Geração de arquivos XLSX a partir de templates
- ✅ Conversão automática para PDF
- ✅ Upload para Supabase Storage
- ✅ Rollback automático em caso de erro
- ✅ Suporte a múltiplas empresas (Félix Mix, World Rental)

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- Conta no Supabase
- LibreOffice (opcional, para conversão PDF de alta qualidade)

## 🛠️ Instalação

### 1. Instalar dependências

```bash
cd functions/notes-generate
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET_INVOICES=invoices

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Configurar arquivos necessários

#### Templates
- Coloque o template Excel em: `templates/fatura_template.xlsx`
- O template deve conter placeholders como `{{EMPRESA}}`, `{{VALOR}}`, etc.

#### Logos
- Coloque as logos em: `public/logos/`
  - `felixmix.png` - Logo da Félix Mix
  - `worldrental.png` - Logo da World Rental

### 4. Configurar Supabase Storage

Crie o bucket `invoices` no Supabase Storage:

```sql
-- Criar bucket para faturas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoices', 'invoices', false);
```

## 🏃‍♂️ Como executar

### Desenvolvimento local

```bash
npm run dev
```

### Produção

```bash
npm start
```

### Teste de saúde

```bash
curl http://localhost:3000/health
```

## 📡 API Endpoints

### POST `/api/notes/generate`

Gera uma nova nota fiscal.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Payload:**
```json
{
  "report_id": "uuid-do-report",
  "company_logo": "felixmix",
  "phone": "44 99999-9999",
  "nf_date": "2025-09-25",
  "nf_due_date": "2025-10-10",
  "company_name": "Cliente Teste Ltda",
  "address": "Rua das Flores, 123",
  "cnpj_cpf": "00.000.000/0001-00",
  "city": "Maringá",
  "cep": "87000-000",
  "uf": "PR",
  "nf_value": 15000.00,
  "descricao": "Serviço de bombeamento de concreto",
  "obs": "Observações adicionais"
}
```

**Resposta de sucesso:**
```json
{
  "ok": true,
  "note": {
    "id": "uuid-da-nota",
    "nf_number": "2025001",
    "report_id": "uuid-do-report",
    "company_name": "Cliente Teste Ltda",
    "nf_value": 15000.00,
    "file_xlsx_path": "invoices/2025/2025001/2025001.xlsx",
    "file_pdf_path": "invoices/2025/2025001/2025001.pdf"
  },
  "download_xlsx_url": "https://signed-url-xlsx",
  "download_pdf_url": "https://signed-url-pdf"
}
```

**Resposta de erro:**
```json
{
  "ok": false,
  "message": "Descrição do erro"
}
```

## 🧪 Testando a API

### Exemplo com curl

```bash
curl -X POST http://localhost:3000/api/notes/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "report_id": "123e4567-e89b-12d3-a456-426614174000",
    "company_logo": "felixmix",
    "phone": "44 99999-9999",
    "nf_date": "2025-09-25",
    "nf_due_date": "2025-10-10",
    "company_name": "Cliente Teste Ltda",
    "address": "Rua das Flores, 123",
    "cnpj_cpf": "00.000.000/0001-00",
    "city": "Maringá",
    "cep": "87000-000",
    "uf": "PR",
    "nf_value": 15000,
    "descricao": "Serviço de bombeamento de concreto",
    "obs": "Obs de teste"
  }'
```

## 🚀 Deploy

### Supabase Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Deploy
supabase functions deploy notes-generate
```

### Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Netlify

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

## 📁 Estrutura do Projeto

```
functions/notes-generate/
├── index.js                 # Handler principal
├── package.json             # Dependências
├── README.md               # Este arquivo
├── lib/
│   └── helper_fill_xlsx.js # Helper para manipulação Excel
├── templates/
│   ├── README.md           # Instruções para templates
│   └── fatura_template.xlsx # Template Excel (adicionar manualmente)
└── public/
    └── logos/
        ├── README.md       # Instruções para logos
        ├── felixmix.png    # Logo Félix Mix (adicionar manualmente)
        └── worldrental.png # Logo World Rental (adicionar manualmente)
```

## 🔧 Placeholders do Template

O template Excel deve conter os seguintes placeholders:

| Placeholder | Descrição | Exemplo |
|-------------|-----------|---------|
| `{{LOGO}}` | Logo da empresa | Será substituído pela imagem |
| `{{FONE}}` | Telefone | "44 99999-9999" |
| `{{DATA_EMISSAO}}` | Data de emissão | "2025-09-25" |
| `{{EMPRESA}}` | Nome da empresa | "Cliente Teste Ltda" |
| `{{ENDERECO}}` | Endereço | "Rua das Flores, 123" |
| `{{CNPJ_CPF}}` | CNPJ/CPF | "00.000.000/0001-00" |
| `{{MUNICIPIO}}` | Cidade | "Maringá" |
| `{{CEP}}` | CEP | "87000-000" |
| `{{UF}}` | Estado | "PR" |
| `{{FATURA_NUMERO}}` | Número da fatura | "2025001" |
| `{{VALOR}}` | Valor da nota | "15.000,00" |
| `{{VENCIMENTO}}` | Data de vencimento | "2025-10-10" |
| `{{DESCRIMINACAO}}` | Descrição dos serviços | "Serviço de bombeamento..." |
| `{{OBSERVACOES}}` | Observações | "Obs adicionais" |

## 🛡️ Segurança

- ✅ Validação JWT obrigatória
- ✅ Verificação de roles (`financeiro`, `admin`)
- ✅ Validação de payload
- ✅ Sanitização de dados
- ✅ Rollback automático em caso de erro
- ✅ Headers de segurança (Helmet)

## 🐛 Troubleshooting

### Erro: "Template não encontrado"
- Verifique se o arquivo `templates/fatura_template.xlsx` existe
- Confirme o caminho correto do template

### Erro: "Logo não encontrada"
- Verifique se as logos estão em `public/logos/`
- Confirme os nomes: `felixmix.png` e `worldrental.png`

### Erro: "Token inválido"
- Verifique se o JWT está correto
- Confirme se o usuário tem role `financeiro` ou `admin`

### Erro: "Report não encontrado"
- Verifique se o `report_id` existe no banco
- Confirme se o status do report é `NOTA_EMITIDA`

### Erro de conversão PDF
- Instale LibreOffice para melhor qualidade
- Verifique se Puppeteer está funcionando corretamente

## 📝 Logs

A função gera logs detalhados para debugging:

```
🚀 Iniciando geração de nota fiscal...
✅ Usuário autenticado: user@example.com (financeiro)
✅ Payload validado para report: uuid-123
✅ Report validado: uuid-123
✅ Nota criada: 2025001
📊 Gerando arquivo XLSX...
📄 Convertendo para PDF...
📤 Fazendo upload: /tmp/fatura-2025001.xlsx → invoices/2025/2025001/2025001.xlsx
📤 Fazendo upload: /tmp/fatura-2025001.pdf → invoices/2025/2025001/2025001.pdf
✅ Nota fiscal gerada com sucesso!
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato com a equipe de desenvolvimento da WorldRental FelixMix.
