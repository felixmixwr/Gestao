import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { DatePicker } from '../../components/ui/date-picker';
import { generateReportNumber } from '../../utils/reportNumberGenerator'
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

// Schema base para validação
const baseReportSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  client_rep_name: z.string().min(1, 'Nome do representante é obrigatório'),
  client_phone: z.string().min(1, 'Telefone do cliente é obrigatório'),
  work_address: z.string().min(1, 'Endereço da obra é obrigatório'),
  pump_id: z.string().min(1, 'Bomba é obrigatória'),
  pump_prefix: z.string().min(1, 'Prefixo da bomba é obrigatório'),
  pump_owner_company_id: z.string().min(1, 'Empresa proprietária é obrigatória'),
  service_company_id: z.string().min(1, 'Empresa do serviço é obrigatória'),
  planned_volume: z.string().min(1, 'Volume planejado é obrigatório'),
  realized_volume: z.string().min(1, 'Volume realizado é obrigatório'),
  total_value: z.string().min(1, 'Valor total é obrigatório'),
  observations: z.string().optional()
})

// Schema para bombas internas (com equipe obrigatória)
const internalPumpSchema = baseReportSchema.extend({
  driver_id: z.string().min(1, 'Motorista é obrigatório para bombas internas'),
  assistants: z.array(z.object({
    id: z.string().min(1, 'Auxiliar é obrigatório')
  })).min(1, 'Pelo menos um auxiliar é obrigatório para bombas internas')
})

// Schema para bombas terceiras (sem equipe obrigatória)
const thirdPartyPumpSchema = baseReportSchema.extend({
  driver_id: z.string().optional(),
  assistants: z.array(z.object({
    id: z.string().optional()
  })).optional()
})

// Função para criar schema dinâmico baseado no tipo de bomba
const createReportSchema = (isThirdPartyPump: boolean) => {
  return isThirdPartyPump ? thirdPartyPumpSchema : internalPumpSchema
}

// Tipo união para ReportFormData que aceita tanto bombas internas quanto terceiras
type ReportFormData = z.infer<typeof baseReportSchema> & {
  driver_id: string;
  assistants: Array<{ id: string }>;
}

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

// Função para obter a data atual no formato YYYY-MM-DD considerando fuso horário local
const getCurrentDateString = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function NewReport() {
  const [formData, setFormData] = useState<ReportFormData>({
    date: getCurrentDateString(),
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
    observations: ''
  })

  const [clients, setClients] = useState<Client[]>([])
  const [pumps, setPumps] = useState<Pump[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedPump, setSelectedPump] = useState<Pump | null>(null)
  // const [selectedClient, setSelectedClient] = useState<Client | null>(null)

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
          company_name,
          rep_name
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
        company_name: client.company_name || 'Sem empresa',
        rep_name: client.rep_name
      }))
      
      console.log('Clientes transformados:', transformedClients)
      setClients(transformedClients)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadPumps = async () => {
    try {
      // Carregar bombas internas com dados da empresa
      const { data: pumpsData, error: pumpsError } = await supabase
        .from('pumps')
        .select(`
          id, 
          prefix, 
          model, 
          brand, 
          owner_company_id,
          companies!pumps_owner_company_id_fkey (
            id,
            name
          )
        `)
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
        ...(pumpsData || []).map(pump => ({ 
          ...pump, 
          is_terceira: false,
          empresa_nome: (pump.companies as any)?.name || ''
        })),
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
    setSelectedPump(pump || null)
    
    console.log('🔍 [DEBUG] Bomba selecionada:', {
      pumpId,
      pump: pump,
      empresa_nome: pump?.empresa_nome,
      is_terceira: pump?.is_terceira
    })
    
    // Limpar campos de equipe se for bomba terceira
    const isThirdPartyPump = pump?.is_terceira || false
    
    // Buscar empresa do serviço baseada na empresa da bomba
    let serviceCompanyId = ''
    if (pump?.empresa_nome) {
      console.log('🔍 [DEBUG] Buscando empresa:', {
        empresa_nome: pump.empresa_nome,
        companies: companies.map(c => ({ id: c.id, name: c.name }))
      })
      
      const serviceCompany = companies.find(c => c.name === pump.empresa_nome)
      if (serviceCompany) {
        serviceCompanyId = serviceCompany.id
        console.log('✅ Empresa do serviço preenchida automaticamente:', {
          bomba: pump.prefix,
          empresa: pump.empresa_nome,
          company_id: serviceCompanyId
        })
      } else {
        console.log('❌ Empresa não encontrada na lista de companies:', pump.empresa_nome)
      }
    } else {
      console.log('❌ Bomba não tem empresa_nome definida')
    }
    
    setFormData(prev => ({
      ...prev,
      pump_id: pumpId,
      pump_prefix: pump?.prefix || '',
      pump_owner_company_id: pump?.owner_company_id || '',
      service_company_id: serviceCompanyId,
      // Limpar campos de equipe para bombas terceiras
      driver_id: isThirdPartyPump ? '' : prev.driver_id,
      assistants: isThirdPartyPump ? [] : prev.assistants
    }))
    
    // Limpar erros relacionados à equipe quando trocar de bomba
    if (isThirdPartyPump) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.driver_id
        delete newErrors.assistants
        return newErrors
      })
    }
  }

  const addAssistant = () => {
    // Não permitir adicionar auxiliares para bombas terceiras
    if (selectedPump?.is_terceira) return
    
    setFormData(prev => ({
      ...prev,
      assistants: [...(prev.assistants || []), { id: '' }]
    }))
  }

  const removeAssistant = (index: number) => {
    // Para bombas terceiras, não há auxiliares para remover
    if (selectedPump?.is_terceira) return
    
    // Para bombas internas, manter pelo menos um auxiliar
    const currentAssistants = formData.assistants || []
    if (currentAssistants.length > 1) {
      setFormData(prev => ({
        ...prev,
        assistants: currentAssistants.filter((_, i) => i !== index)
      }))
    }
  }

  const updateAssistant = (index: number, assistantId: string) => {
    setFormData(prev => ({
      ...prev,
      assistants: (prev.assistants || []).map((assistant, i) => 
        i === index ? { ...assistant, id: assistantId } : assistant
      )
    }))
  }

  const generateReportNumberLocal = async (): Promise<string> => {
    try {
      // Usar a nova função utilitária
      const reportNumber = await generateReportNumber(formData.date)
      console.log('Número do relatório gerado:', reportNumber)
      return reportNumber
    } catch (error) {
      console.error('Erro ao gerar número do relatório:', error)
      throw new Error('Não foi possível gerar um número único para o relatório')
    }
  }

  const updatePumpTotalBilled = async (pumpId: string, amount: number) => {
    try {
      // Verificar se é uma bomba terceira primeiro
      const { data: bombaTerceira } = await supabase
        .from('bombas_terceiras')
        .select('id')
        .eq('id', pumpId)
        .single()

      if (bombaTerceira) {
        console.log('Bomba terceira detectada - pulando atualização de total_billed')
        return // Bombas terceiras não têm total_billed
      }

      // Tentar usar RPC se existir
      const { error } = await supabase.rpc('increment_pump_total_billed', {
        pump_id: pumpId,
        amount: amount
      })

      if (!error) return
    } catch (error) {
      console.log('RPC não disponível, atualizando manualmente')
    }

    // Atualizar manualmente apenas para bombas internas
    const { data: pump, error: fetchError } = await supabase
      .from('pumps')
      .select('total_billed')
      .eq('id', pumpId)
      .single()

    if (fetchError) {
      console.log('Erro ao buscar bomba para atualização:', fetchError)
      return // Não falhar se não conseguir atualizar
    }

    const newTotal = (pump.total_billed || 0) + amount

    const { error: updateError } = await supabase
      .from('pumps')
      .update({ total_billed: newTotal })
      .eq('id', pumpId)

    if (updateError) {
      console.log('Erro ao atualizar total_billed:', updateError)
      // Não falhar se não conseguir atualizar
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setErrors({})

      // Validação prévia para garantir integridade dos dados
      const isThirdPartyPump = selectedPump?.is_terceira || false
      
      // Para bombas internas, garantir que pelo menos um auxiliar seja selecionado
      if (!isThirdPartyPump) {
        const hasValidAssistant = formData.assistants?.some(assistant => assistant.id && assistant.id.trim() !== '')
        if (!hasValidAssistant) {
          setErrors({ assistants: 'Pelo menos um auxiliar deve ser selecionado para bombas internas' })
          return
        }
      }

      // Validar dados com schema dinâmico baseado no tipo de bomba
      const dynamicSchema = createReportSchema(isThirdPartyPump)
      const validatedData = dynamicSchema.parse(formData)

      // Gerar número do relatório
      const reportNumber = await generateReportNumberLocal()

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
      const assistants = (validatedData.assistants || []).map(assistant => 
        colaboradores.find(c => c.id === assistant.id)
      ).filter(Boolean)

      // Criar relatório (usando apenas campos que existem na tabela)
      const reportData = {
        report_number: reportNumber,
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
        status: getDefaultStatus(),
        driver_name: driver?.nome || null,
        assistant1_name: assistants[0]?.nome || null,
        assistant2_name: assistants[1]?.nome || null,
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
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.client_id ? 'border-red-300' : 'border-gray-300'
                }`}
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
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.client_rep_name ? 'border-red-300' : 'border-gray-300'
                }`}
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
                Telefone do Cliente *
              </label>
              <input
                type="tel"
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.client_phone ? 'border-red-300' : 'border-gray-300'
                }`}
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
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.work_address ? 'border-red-300' : 'border-gray-300'
                }`}
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
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.pump_id ? 'border-red-300' : 'border-gray-300'
                }`}
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
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.service_company_id ? 'border-red-300' : 'border-gray-300'
                }`}
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
                Volume Planejado (m³) *
              </label>
              <input
                type="number"
                step="0.1"
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.planned_volume ? 'border-red-300' : 'border-gray-300'
                }`}
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
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.realized_volume ? 'border-red-300' : 'border-gray-300'
                }`}
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
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.total_value ? 'border-red-300' : 'border-gray-300'
                }`}
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

        {/* Seção: Equipe - Ocultar para bombas terceiras */}
        {!selectedPump?.is_terceira && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Equipe</h3>
            
            <div className="space-y-6">
              {/* Motorista */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motorista Operador da Bomba *
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.driver_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  value={formData.driver_id ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, driver_id: e.target.value }))}
                  required={!selectedPump?.is_terceira}
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
                    Auxiliares *
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
                  {(formData.assistants || []).map((assistant, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Auxiliar {index + 1}
                        </label>
                        <select
                          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.assistants ? 'border-red-300' : 'border-gray-300'
                          }`}
                          value={assistant.id}
                          onChange={(e) => updateAssistant(index, e.target.value)}
                          required={!selectedPump?.is_terceira}
                        >
                          <option value="">Selecione um auxiliar</option>
                          {auxiliarOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {(formData.assistants?.length || 0) > 1 && (
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
        )}

        {/* Aviso para bombas terceiras */}
        {selectedPump?.is_terceira && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Bomba Terceira Selecionada
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Esta é uma bomba de terceiros ({selectedPump.empresa_nome}). 
                    A equipe será fornecida pela empresa proprietária da bomba.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
