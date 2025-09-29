import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { DatePicker } from '../../components/ui/date-picker'
import { formatCurrency } from '../../utils/formatters'
import { z } from 'zod'
import { ReportStatus } from '../../types/reports'

// Função para formatar telefone brasileiro
const formatPhoneNumber = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '')
  
  // Aplica a máscara baseada no tamanho
  if (numbers.length === 11) {
    // Formato: (XX) XXXXX-XXXX
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (numbers.length === 10) {
    // Formato: (XX) XXXX-XXXX
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  } else if (numbers.length > 11) {
    // Para números com código do país, remove os primeiros 2 dígitos (55)
    const withoutCountryCode = numbers.slice(2)
    if (withoutCountryCode.length === 11) {
      return withoutCountryCode.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (withoutCountryCode.length === 10) {
      return withoutCountryCode.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
  }
  
  return phone // Retorna o original se não conseguir formatar
}

// Função para formatar valor de entrada (quando usuário digita)
const formatCurrencyInput = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '')
  
  if (!numbers) return ''
  
  // Converte para número e divide por 100 para ter centavos
  const amount = parseInt(numbers) / 100
  
  // Formata como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Função para converter valor formatado de volta para número
const parseCurrency = (formattedValue: string): number => {
  const numbers = formattedValue.replace(/\D/g, '')
  return numbers ? parseInt(numbers) / 100 : 0
}

const reportSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  client_rep_name: z.string().min(1, 'Nome do representante é obrigatório'),
  client_phone: z.string().optional(),
  work_address: z.string().min(1, 'Endereço da obra é obrigatório'),
  pump_id: z.string().min(1, 'Bomba é obrigatória'),
  pump_prefix: z.string().min(1, 'Prefixo da bomba é obrigatório'),
  pump_owner_company_id: z.string().min(1, 'Empresa proprietária é obrigatória'),
  service_company_id: z.string().min(1, 'Empresa do serviço é obrigatória'),
  planned_volume: z.string().optional(),
  realized_volume: z.string().min(1, 'Volume realizado é obrigatório'),
  driver_id: z.string().optional(),
  assistants: z.array(z.object({
    id: z.string().min(1, 'Auxiliar é obrigatório')
  })).min(1, 'Pelo menos um auxiliar é obrigatório'),
  total_value: z.string().min(1, 'Valor total é obrigatório'),
  observations: z.string().optional(),
  status: z.string().min(1, 'Status é obrigatório')
})

type ReportFormData = z.infer<typeof reportSchema>

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company_name: string | null
  rep_name: string | null
}

interface Pump {
  id: string
  prefix: string
  model: string | null
  brand: string | null
  owner_company_id: string
  is_terceira?: boolean
  empresa_nome?: string
  valor_diaria?: number
}

interface Company {
  id: string
  name: string
}

interface Colaborador {
  id: string
  nome: string
  funcao: string
}

export default function EditReport() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [formData, setFormData] = useState<ReportFormData>({
    date: '',
    client_id: '',
    client_rep_name: '',
    client_phone: '',
    work_address: '',
    pump_id: '',
    pump_prefix: '',
    pump_owner_company_id: '',
    service_company_id: '',
    planned_volume: '',
    realized_volume: '',
    driver_id: '',
    assistants: [{ id: '' }], // Começa com um auxiliar
    total_value: '',
    observations: '',
    status: 'ENVIADO_FINANCEIRO'
  })

  const [clients, setClients] = useState<Client[]>([])
  const [pumps, setPumps] = useState<Pump[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (id) {
      loadReportData()
    }
    loadClients()
    loadPumps()
    loadCompanies()
    loadColaboradores()
  }, [id])

  const loadReportData = async () => {
    try {
      setLoadingData(true)
      
      const { data: report, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (report) {
        // Inicializar dados básicos
        const initialData = {
          date: report.date || '',
          client_id: report.client_id || '',
          client_rep_name: report.client_rep_name || '',
          client_phone: report.whatsapp_digits || '',
          work_address: report.work_address || '',
          pump_id: report.pump_id || '',
          pump_prefix: report.pump_prefix || '',
          pump_owner_company_id: '',
          service_company_id: report.service_company_id || '',
          planned_volume: report.planned_volume?.toString() || '',
          realized_volume: report.realized_volume?.toString() || '',
          driver_id: '',
          assistants: [{ id: '' }], // Começa com um auxiliar vazio
          total_value: report.total_value ? formatCurrency(report.total_value) : '',
          observations: '',
          status: report.status || 'ENVIADO_FINANCEIRO'
        }

        setFormData(initialData)

        // Carregar dados relacionados em paralelo
        const promises = []

        // Cliente
        if (report.client_id) {
          promises.push(
            supabase
              .from('clients')
              .select('*')
              .eq('id', report.client_id)
              .single()
              .then(({ data: client }) => {
                if (client) {
                  setFormData(prev => ({
                    ...prev,
                    client_phone: client.phone ? formatPhoneNumber(client.phone) : ''
                  }))
                }
              })
          )
        }

        // Bomba
        if (report.pump_id) {
          promises.push(
            supabase
              .from('pumps')
              .select('*')
              .eq('id', report.pump_id)
              .single()
              .then(({ data: pump }) => {
                if (pump) {
                  setFormData(prev => ({
                    ...prev,
                    pump_owner_company_id: pump.owner_company_id || ''
                  }))
                }
              })
          )
        }

        // Motorista
        if (report.driver_name) {
          promises.push(
            supabase
              .from('colaboradores')
              .select('*')
              .eq('nome', report.driver_name)
              .eq('funcao', 'Motorista Operador de Bomba')
              .single()
              .then(({ data: driver }) => {
                if (driver) {
                  setFormData(prev => ({
                    ...prev,
                    driver_id: driver.id
                  }))
                }
              })
          )
        }

        // Auxiliares
        const assistants: { id: string }[] = []
        if (report.assistant1_name) {
          promises.push(
            supabase
              .from('colaboradores')
              .select('*')
              .eq('nome', report.assistant1_name)
              .eq('funcao', 'Auxiliar de Bomba')
              .single()
              .then(({ data: assistant1 }) => {
                if (assistant1) {
                  assistants.push({ id: assistant1.id })
                }
              })
          )
        }

        if (report.assistant2_name) {
          promises.push(
            supabase
              .from('colaboradores')
              .select('*')
              .eq('nome', report.assistant2_name)
              .eq('funcao', 'Auxiliar de Bomba')
              .single()
              .then(({ data: assistant2 }) => {
                if (assistant2) {
                  assistants.push({ id: assistant2.id })
                }
              })
          )
        }

        // Aguardar todas as consultas
        await Promise.all(promises)

        // Atualizar auxiliares
        if (assistants.length > 0) {
          setFormData(prev => ({
            ...prev,
            assistants
          }))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id, 
          name, 
          email, 
          phone,
          company_name,
          rep_name
        `)
        .order('name')

      if (error) throw error
      
      const transformedClients = (data || []).map((client: any) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        company_name: client.company_name || 'Sem empresa',
        rep_name: client.rep_name
      }))
      
      setClients(transformedClients)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadPumps = async () => {
    try {
      // Carregar bombas internas
      const { data: pumpsData, error: pumpsError } = await supabase
        .from('pumps')
        .select('id, prefix, model, brand, owner_company_id')
        .order('prefix')

      if (pumpsError) throw pumpsError

      // Carregar bombas de terceiros
      const { data: bombasTerceirasData, error: bombasTerceirasError } = await supabase
        .from('view_bombas_terceiras_com_empresa')
        .select('*')
        .order('prefixo')

      if (bombasTerceirasError) throw bombasTerceirasError

      // Transformar bombas de terceiros para o formato esperado
      const bombasTerceirasFormatted = (bombasTerceirasData || []).map((bomba: any) => ({
        id: bomba.id,
        prefix: bomba.prefixo,
        model: bomba.modelo,
        brand: `${bomba.empresa_nome_fantasia} - R$ ${bomba.valor_diaria || 0}/dia`,
        owner_company_id: bomba.empresa_id,
        is_terceira: true,
        empresa_nome: bomba.empresa_nome_fantasia,
        valor_diaria: bomba.valor_diaria
      }))

      // Combinar bombas internas e de terceiros
      const allPumps = [
        ...(pumpsData || []).map(pump => ({ ...pump, is_terceira: false })),
        ...bombasTerceirasFormatted
      ]

      setPumps(allPumps)
    } catch (error) {
      console.error('Erro ao carregar bombas:', error)
    }
  }

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    }
  }

  const loadColaboradores = async () => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, nome, funcao')
        .in('funcao', ['Motorista Operador de Bomba', 'Auxiliar de Bomba'])
        .order('nome')

      if (error) throw error
      setColaboradores(data || [])
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error)
    }
  }

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    
    if (client) {
      setFormData(prev => ({
        ...prev,
        client_id: clientId,
        client_rep_name: client.rep_name || '',
        client_phone: client.phone ? formatPhoneNumber(client.phone) : ''
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        client_id: '',
        client_rep_name: '',
        client_phone: ''
      }))
    }
  }

  const handlePumpChange = (pumpId: string) => {
    const pump = pumps.find(p => p.id === pumpId)
    
    setFormData(prev => ({
      ...prev,
      pump_id: pumpId,
      pump_prefix: pump?.prefix || '',
      pump_owner_company_id: pump?.owner_company_id || ''
    }))
  }

  const addAssistant = () => {
    setFormData(prev => ({
      ...prev,
      assistants: [...prev.assistants, { id: '' }]
    }))
  }

  const removeAssistant = (index: number) => {
    if (formData.assistants.length > 1) {
      setFormData(prev => ({
        ...prev,
        assistants: prev.assistants.filter((_, i) => i !== index)
      }))
    }
  }

  const updateAssistant = (index: number, assistantId: string) => {
    setFormData(prev => ({
      ...prev,
      assistants: prev.assistants.map((assistant, i) => 
        i === index ? { ...assistant, id: assistantId } : assistant
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setErrors({})

      // Validar dados
      const validatedData = reportSchema.parse(formData)

      // Obter usuário atual
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Erro de autenticação:', authError)
        throw new Error('Erro de autenticação')
      }
      if (!user) throw new Error('Usuário não autenticado')

      // Usar a empresa do serviço selecionada como company_id do relatório
      const companyId = validatedData.service_company_id
      
      if (!companyId) {
        console.error('Nenhuma empresa do serviço selecionada')
        throw new Error('Por favor, selecione a empresa do serviço.')
      }

      // Obter nomes dos colaboradores selecionados
      const driver = colaboradores.find(c => c.id === validatedData.driver_id)
      const assistants = validatedData.assistants.map(assistant => 
        colaboradores.find(c => c.id === assistant.id)
      ).filter(Boolean)

      // Atualizar relatório
      const reportData = {
        date: validatedData.date,
        client_id: validatedData.client_id,
        client_rep_name: validatedData.client_rep_name,
        work_address: validatedData.work_address,
        whatsapp_digits: validatedData.client_phone,
        pump_id: validatedData.pump_id,
        pump_prefix: validatedData.pump_prefix,
        planned_volume: validatedData.planned_volume ? parseFloat(validatedData.planned_volume) : null,
        realized_volume: parseFloat(validatedData.realized_volume),
        total_value: parseCurrency(validatedData.total_value),
        status: validatedData.status as ReportStatus,
        driver_name: driver?.nome || null,
        assistant1_name: assistants[0]?.nome || null,
        assistant2_name: assistants[1]?.nome || null,
        service_company_id: validatedData.service_company_id,
        company_id: companyId
      }

      console.log('Dados do relatório a serem atualizados:', reportData)
      
      const { error: reportError } = await supabase
        .from('reports')
        .update(reportData)
        .eq('id', id)

      if (reportError) {
        console.error('Erro ao atualizar relatório:', reportError)
        throw new Error(`Erro ao atualizar relatório: ${reportError.message}`)
      }

      // Redirecionar para detalhes do relatório
      navigate(`/reports/${id}`)
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        console.error('Erro ao atualizar relatório:', error)
        
        let errorMessage = 'Erro desconhecido'
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === 'object' && error !== null) {
          errorMessage = JSON.stringify(error)
        }
        
        setErrors({ general: `Erro ao atualizar relatório: ${errorMessage}` })
      }
    } finally {
      setLoading(false)
    }
  }

  const clientOptions = clients.map(client => ({
    value: client.id,
    label: client.company_name || 'Sem empresa'
  }))

  const pumpOptions = pumps.map(pump => ({
    value: pump.id,
    label: `${pump.prefix} - ${pump.brand || 'N/A'} ${pump.model || ''}`
  }))

  const motoristaOptions = colaboradores
    .filter(colaborador => colaborador.funcao === 'Motorista Operador de Bomba')
    .map(colaborador => ({
      value: colaborador.id,
      label: colaborador.nome
    }))

  const auxiliarOptions = colaboradores
    .filter(colaborador => colaborador.funcao === 'Auxiliar de Bomba')
    .map(colaborador => ({
      value: colaborador.id,
      label: colaborador.nome
    }))

  const statusOptions = [
    { value: 'ENVIADO_FINANCEIRO', label: 'Enviado Financeiro' },
    { value: 'RECEBIDO_FINANCEIRO', label: 'Recebido Financeiro' },
    { value: 'AGUARDANDO_APROVACAO', label: 'Aguardando Aprovação' },
    { value: 'NOTA_EMITIDA', label: 'Nota Emitida' },
    { value: 'AGUARDANDO_PAGAMENTO', label: 'Aguardando Pagamento' },
    { value: 'PAGO', label: 'Pago' }
  ]

  if (loadingData) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Editar Relatório</h1>
          <Button
            variant="outline"
            onClick={() => navigate(`/reports/${id}`)}
          >
            Voltar
          </Button>
        </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Seção: Informações Básicas */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Informações Básicas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data */}
            <DatePicker
              value={formData.date}
              onChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
              label="Data"
              required
              error={errors.date}
            />

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.client_id}
                onChange={(e) => handleClientChange(e.target.value)}
              >
                <option value="">Selecione um cliente</option>
                {clientOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
              )}
            </div>

            {/* Nome do Representante */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Representante *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.client_rep_name ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, client_rep_name: e.target.value }))}
                placeholder="Ex: João Silva"
              />
              {errors.client_rep_name && (
                <p className="mt-1 text-sm text-red-600">{errors.client_rep_name}</p>
              )}
            </div>

            {/* Telefone do Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone do Cliente
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.client_phone ?? ''}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value)
                  setFormData(prev => ({ ...prev, client_phone: formatted }))
                }}
                placeholder="(00) 00000-0000"
              />
              {errors.client_phone && (
                <p className="mt-1 text-sm text-red-600">{errors.client_phone}</p>
              )}
            </div>

            {/* Endereço da Obra */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço da Obra *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.work_address ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, work_address: e.target.value }))}
                placeholder="Ex: Rua das Flores, 123 - Centro"
              />
              {errors.work_address && (
                <p className="mt-1 text-sm text-red-600">{errors.work_address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Seção: Informações da Bomba */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Informações da Bomba</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bomba */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bomba *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.pump_id}
                onChange={(e) => handlePumpChange(e.target.value)}
              >
                <option value="">Selecione uma bomba</option>
                {pumpOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.pump_id && (
                <p className="mt-1 text-sm text-red-600">{errors.pump_id}</p>
              )}
            </div>

            {/* Prefixo da Bomba */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prefixo da Bomba *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.pump_prefix ?? ''}
                disabled
                placeholder="Preenchido automaticamente"
              />
              {errors.pump_prefix && (
                <p className="mt-1 text-sm text-red-600">{errors.pump_prefix}</p>
              )}
            </div>

            {/* Empresa do Serviço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa do Serviço *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.service_company_id}
                onChange={(e) => setFormData(prev => ({ ...prev, service_company_id: e.target.value }))}
              >
                <option value="">Selecione a empresa do serviço</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {errors.service_company_id && (
                <p className="mt-1 text-sm text-red-600">{errors.service_company_id}</p>
              )}
            </div>

            {/* Volume Planejado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume Planejado (m³)
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.planned_volume ?? ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  planned_volume: e.target.value 
                }))}
                placeholder="Ex: 50.0"
              />
              {errors.planned_volume && (
                <p className="mt-1 text-sm text-red-600">{errors.planned_volume}</p>
              )}
            </div>

            {/* Volume Realizado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume Realizado (m³) *
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.realized_volume ?? ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  realized_volume: e.target.value 
                }))}
                placeholder="Ex: 45.5"
              />
              {errors.realized_volume && (
                <p className="mt-1 text-sm text-red-600">{errors.realized_volume}</p>
              )}
            </div>

            {/* Valor Total */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Total (R$) *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.total_value ?? ''}
                onChange={(e) => {
                  const formatted = formatCurrencyInput(e.target.value)
                  setFormData(prev => ({ ...prev, total_value: formatted }))
                }}
                placeholder="R$ 0,00"
              />
              {errors.total_value && (
                <p className="mt-1 text-sm text-red-600">{errors.total_value}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status}</p>
              )}
            </div>
          </div>
        </div>

        {/* Seção: Equipe */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Equipe</h3>
          
          <div className="space-y-6">
            {/* Motorista */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motorista Operador da Bomba
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.driver_id ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, driver_id: e.target.value }))}
              >
                <option value="">Selecione um motorista</option>
                {motoristaOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.driver_id && (
                <p className="mt-1 text-sm text-red-600">{errors.driver_id}</p>
              )}
            </div>

            {/* Auxiliares Dinâmicos */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Auxiliares
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAssistant}
                  className="text-blue-600 hover:text-blue-700"
                >
                  + Adicionar Auxiliar
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.assistants.map((assistant, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Auxiliar {index + 1}
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={assistant.id}
                        onChange={(e) => updateAssistant(index, e.target.value)}
                      >
                        <option value="">Selecione um auxiliar</option>
                        {auxiliarOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {formData.assistants.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAssistant(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-6"
                      >
                        🗑️
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {errors.assistants && (
                <p className="mt-1 text-sm text-red-600">{errors.assistants}</p>
              )}
            </div>
          </div>
        </div>

        {/* Seção: Observações */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Observações</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.observations || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              placeholder="Observações adicionais sobre o bombeamento..."
            />
            {errors.observations && (
              <p className="mt-1 text-sm text-red-600">{errors.observations}</p>
            )}
          </div>
        </div>

        {/* Erro geral */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{errors.general}</p>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/reports/${id}`)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
      </div>
    </Layout>
  )
}
