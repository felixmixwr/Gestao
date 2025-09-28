# 🚀 Guia de Início Rápido - WorldRental Felix Mix

## ✅ Checklist de Instalação

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite o arquivo .env com suas credenciais do Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
VITE_OWNER_COMPANY_NAME=Felix Mix
VITE_SECOND_COMPANY_NAME=WorldRental
```

### 3. Configurar Banco de Dados
1. Acesse o painel do Supabase
2. Vá em SQL Editor
3. Execute o arquivo `database-setup.sql` completo
4. Verifique se todas as tabelas foram criadas

### 4. Executar o Projeto
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## 🎯 Próximos Passos

### 1. Criar Usuários
- Acesse Authentication > Users no Supabase
- Crie usuários para teste
- Associe-os às empresas na tabela `users`

### 2. Testar Funcionalidades
- Faça login com um usuário criado
- Navegue pelas páginas (ainda são placeholders)
- Teste o sistema de toast notifications

### 3. Implementar Funcionalidades
Use os componentes e utilitários prontos para implementar:

#### Exemplo: Criar Lista de Clientes
```tsx
// src/pages/clients/ClientsList.tsx
import { useEffect, useState } from 'react'
import { clientsApi } from '@/lib/api'
import { Table } from '@/components/Table'
import { useToast } from '@/lib/toast'

export default function ClientsList() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const { data, error } = await clientsApi.getAll('company-id')
      if (error) throw error
      setClients(data || [])
    } catch (error) {
      addToast({ message: 'Erro ao carregar clientes', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefone' },
  ]

  return (
    <Layout>
      <Table 
        data={clients}
        columns={columns}
        loading={loading}
        emptyMessage="Nenhum cliente encontrado"
      />
    </Layout>
  )
}
```

## 🔧 Componentes Disponíveis

### Formulários
```tsx
import { FormField, FormTextarea, Select } from '@/components'

// Uso básico
<FormField 
  label="Nome"
  required
  error={errors.name?.message}
  {...register('name')}
/>

<Select
  label="Status"
  options={[
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' }
  ]}
  value={status}
  onChange={setStatus}
/>
```

### Validação
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientSchema } from '@/utils/validators'

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(clientSchema)
})
```

### API Calls
```tsx
import { clientsApi } from '@/lib/api'

// Criar cliente
const { data, error } = await clientsApi.create({
  name: 'Cliente Teste',
  email: 'teste@email.com',
  company_id: 'company-id'
})

// Listar clientes
const { data: clients } = await clientsApi.getAll('company-id')
```

### Toast Notifications
```tsx
import { useToast } from '@/lib/toast'

const { addToast } = useToast()

// Sucesso
addToast({ message: 'Cliente criado com sucesso!', type: 'success' })

// Erro
addToast({ message: 'Erro ao salvar cliente', type: 'error' })
```

## 🎨 Estilização

O projeto usa TailwindCSS com classes utilitárias prontas:

```tsx
// Botões
<Button variant="primary">Primário</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="danger">Perigo</Button>

// Cards
<div className="card">Conteúdo do card</div>

// Inputs
<input className="input" placeholder="Digite aqui..." />

// Layout
<div className="space-y-6">Conteúdo com espaçamento</div>
```

## 🔍 Debugging

### Verificar Conexão Supabase
```tsx
// No console do navegador
console.log(supabase.from('companies').select('*'))
```

### Logs de Erro
Todos os erros são logados no console e mostrados via toast.

### Verificar RLS
Se houver problemas de permissão, verifique as políticas RLS no Supabase.

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [TailwindCSS](https://tailwindcss.com/)

## 🆘 Problemas Comuns

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo `.env` existe e tem as variáveis corretas

### Erro: "Invalid JWT"
- Verifique se a chave anônima está correta no `.env`

### Página em branco
- Verifique o console do navegador para erros JavaScript
- Confirme se todas as dependências foram instaladas

### Erro de RLS
- Verifique se as políticas RLS estão configuradas corretamente
- Confirme se o usuário tem acesso às tabelas necessárias

## 🎉 Pronto para Desenvolver!

Agora você tem um scaffold completo e funcional. Comece implementando as funcionalidades específicas usando os componentes e utilitários fornecidos.

**Dica**: Use o sistema de toast para feedback imediato e sempre trate erros adequadamente usando os wrappers da API.


