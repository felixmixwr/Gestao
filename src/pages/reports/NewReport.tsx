import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
// import { CreateReportData } from '../../types/reports'
// import { formatCurrency } from '../../utils/formatters'
import { z } from 'zod'
import { getDefaultStatus } from '../../utils/status-utils'

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

// Função para formatar valor em Real brasileiro
const formatCurrency = (value: string): string => {
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
  assistant1_id: z.string().optional(),
  assistant2_id: z.string().optional(),
  total_value: z.string().min(1, 'Valor total é obrigatório'),
  observations: z.string().optional()
})

type ReportFormData = z.infer<typeof reportSchema>

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company_name: string | null
}

interface Pump {
  id: string
  prefix: string
  model: string | null
  brand: string | null
  owner_company_id: string
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

export default function NewReport() {
  const [formData, setFormData] = useState<ReportFormData>({
    date: new Date().toISOString().split('T')[0],
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
    assistant1_id: '',
    assistant2_id: '',
    total_value: '',
    observations: ''
  })

  const [clients, setClients] = useState<Client[]>([])
  const [pumps, setPumps] = useState<Pump[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  // const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  // const [selectedPump, setSelectedPump] = useState<Pump | null>(null)

  useEffect(() => {
    loadClients()
    loadPumps()
    loadCompanies()
    loadColaboradores()
  }, [])

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id, 
          name, 
          email, 
          phone,
          company_name
        `)
        .order('name')

      if (error) throw error
      
      console.log('Dados dos clientes:', data)
      console.log('Primeiro cliente:', data?.[0])
      
      // Usar o company_name que já vem da tabela
      const transformedClients = (data || []).map((client: any) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        company_name: client.company_name || 'Sem empresa'
      }))
      
      console.log('Clientes transformados:', transformedClients)
      setClients(transformedClients)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadPumps = async () => {
    try {
      const { data, error } = await supabase
        .from('pumps')
        .select('id, prefix, model, brand, owner_company_id')
        .order('prefix')

      if (error) throw error
      setPumps(data || [])
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
        client_rep_name: client.name, // Nome do representante
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
    // setSelectedPump(pump || null)
    
    setFormData(prev => ({
      ...prev,
      pump_id: pumpId,
      pump_prefix: pump?.prefix || '',
      pump_owner_company_id: pump?.owner_company_id || ''
    }))
  }

  const generateReportNumber = async (): Promise<string> => {
    try {
      // Tentar usar RPC se existir
      const { data, error } = await supabase.rpc('create_report_with_number', {
        date: formData.date,
        payload_json: formData
      })

      if (!error && data?.report_number) {
        return data.report_number
      }
    } catch (error) {
      console.log('RPC não disponível, gerando número no frontend')
    }

    // Gerar número no frontend - formato simples #REL-01, #REL-02, etc.
    let reportNumber: string
    let attempts = 0
    const maxAttempts = 10

    do {
      // Buscar o último número usado
      const { data: lastReport } = await supabase
        .from('reports')
        .select('report_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      let nextNumber = 1
      if (lastReport?.report_number) {
        const match = lastReport.report_number.match(/#REL-(\d+)/)
        if (match) {
          nextNumber = parseInt(match[1]) + 1
        }
      }

      reportNumber = `#REL-${String(nextNumber).padStart(2, '0')}`
      
      const { data } = await supabase
        .from('reports')
        .select('id')
        .eq('report_number', reportNumber)
        .single()

      if (!data) break
      
      attempts++
    } while (attempts < maxAttempts)

    if (attempts >= maxAttempts) {
      throw new Error('Não foi possível gerar um número único para o relatório')
    }

    return reportNumber
  }

  const updatePumpTotalBilled = async (pumpId: string, amount: number) => {
    try {
      // Tentar usar RPC se existir
      const { error } = await supabase.rpc('increment_pump_total_billed', {
        pump_id: pumpId,
        amount: amount
      })

      if (!error) return
    } catch (error) {
      console.log('RPC não disponível, atualizando manualmente')
    }

    // Atualizar manualmente
    const { data: pump, error: fetchError } = await supabase
      .from('pumps')
      .select('total_billed')
      .eq('id', pumpId)
      .single()

    if (fetchError) throw fetchError

    const newTotal = (pump.total_billed || 0) + amount

    const { error: updateError } = await supabase
      .from('pumps')
      .update({ total_billed: newTotal })
      .eq('id', pumpId)

    if (updateError) throw updateError
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setErrors({})

      // Validar dados
      const validatedData = reportSchema.parse(formData)

      // Gerar número do relatório
      const reportNumber = await generateReportNumber()

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
      const assistant1 = colaboradores.find(c => c.id === validatedData.assistant1_id)
      const assistant2 = colaboradores.find(c => c.id === validatedData.assistant2_id)

      // Criar relatório (usando apenas campos que existem na tabela)
      const reportData = {
        report_number: reportNumber,
        date: validatedData.date,
        client_id: validatedData.client_id,
        client_rep_name: validatedData.client_rep_name,
        pump_id: validatedData.pump_id,
        pump_prefix: validatedData.pump_prefix,
        realized_volume: parseFloat(validatedData.realized_volume),
        total_value: parseCurrency(validatedData.total_value),
        status: getDefaultStatus(),
        driver_name: driver?.nome || null,
        assistant1_name: assistant1?.nome || null,
        assistant2_name: assistant2?.nome || null,
        service_company_id: validatedData.service_company_id,
        company_id: companyId
      }

      console.log('Dados do relatório a serem inseridos:', reportData)
      console.log('Client ID sendo enviado:', validatedData.client_id)
      console.log('Client ID no reportData:', reportData.client_id)
      
      const { error: reportError } = await supabase
        .from('reports')
        .insert(reportData)

      if (reportError) {
        console.error('Erro ao inserir relatório:', reportError)
        throw new Error(`Erro ao inserir relatório: ${reportError.message}`)
      }

      // Atualizar total faturado da bomba
      await updatePumpTotalBilled(validatedData.pump_id, parseCurrency(validatedData.total_value))

      // Redirecionar para lista de relatórios
      window.location.href = '/reports'
      
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
        console.error('Erro ao criar relatório:', error)
        console.error('Tipo do erro:', typeof error)
        console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
        
        let errorMessage = 'Erro desconhecido'
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === 'object' && error !== null) {
          errorMessage = JSON.stringify(error)
        }
        
        setErrors({ general: `Erro ao criar relatório: ${errorMessage}` })
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Novo Relatório</h1>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/reports'}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data *
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

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
                  const formatted = formatCurrency(e.target.value)
                  setFormData(prev => ({ ...prev, total_value: formatted }))
                }}
                placeholder="R$ 0,00"
              />
              {errors.total_value && (
                <p className="mt-1 text-sm text-red-600">{errors.total_value}</p>
              )}
            </div>
          </div>
        </div>

        {/* Seção: Equipe */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Equipe</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Auxiliar 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auxiliar 1
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.assistant1_id ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, assistant1_id: e.target.value }))}
              >
                <option value="">Selecione um auxiliar</option>
                {auxiliarOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.assistant1_id && (
                <p className="mt-1 text-sm text-red-600">{errors.assistant1_id}</p>
              )}
            </div>

            {/* Auxiliar 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auxiliar 2
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.assistant2_id ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, assistant2_id: e.target.value }))}
              >
                <option value="">Selecione um auxiliar</option>
                {auxiliarOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.assistant2_id && (
                <p className="mt-1 text-sm text-red-600">{errors.assistant2_id}</p>
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
            onClick={() => window.location.href = '/reports'}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            Criar Relatório
          </Button>
        </div>
      </form>
      </div>
    </Layout>
  )
}
