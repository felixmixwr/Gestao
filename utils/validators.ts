import { z } from 'zod'

// Schema para validação de clientes
export const clientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').optional().or(z.literal('')),
  company_id: z.string().min(1, 'ID da empresa é obrigatório')
})

export type ClientFormData = z.infer<typeof clientSchema>

// Schema para validação de bombas
export const pumpSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  model: z.string().optional().or(z.literal('')),
  serial_number: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'maintenance'], {
    errorMap: () => ({ message: 'Status deve ser ativo, inativo ou manutenção' })
  }),
  company_id: z.string().min(1, 'ID da empresa é obrigatório')
})

export type PumpFormData = z.infer<typeof pumpSchema>

// Schema para validação de relatórios
export const reportSchema = z.object({
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  pump_id: z.string().min(1, 'Bomba é obrigatória'),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().min(1, 'Data de fim é obrigatória'),
  total_hours: z.number().min(0, 'Total de horas deve ser positivo'),
  notes: z.string().optional().or(z.literal(''))
}).refine((data) => {
  const startDate = new Date(data.start_date)
  const endDate = new Date(data.end_date)
  return endDate > startDate
}, {
  message: 'Data de fim deve ser posterior à data de início',
  path: ['end_date']
})

export type ReportFormData = z.infer<typeof reportSchema>

// Schema para validação de notas
export const noteSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  company_id: z.string().min(1, 'ID da empresa é obrigatório')
})

export type NoteFormData = z.infer<typeof noteSchema>

// Schema para validação de login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
})

export type LoginFormData = z.infer<typeof loginSchema>








