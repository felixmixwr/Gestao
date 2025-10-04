import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { DatePicker } from '../../components/ui/date-picker';
import { Select } from '../../components/Select'
import { ReportWithRelations, ReportStatus } from '../../types/reports'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'

const STATUS_OPTIONS = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'PAGO', label: 'Pago' },
  { value: 'NOTA_EMITIDA', label: 'Nota Emitida' }
]

export default function ReportEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<ReportWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [pumps, setPumps] = useState<Array<{ id: string; prefix: string }>>([])
  // const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]) // Removido variável não utilizada

  // Estados do formulário
  const [formData, setFormData] = useState({
    date: '',
    client_id: '',
    client_rep_name: '',
    pump_id: '',
    pump_prefix: '',
    realized_volume: '',
    total_value: '',
    status: 'PENDENTE' as ReportStatus,
    driver_name: '',
    assistant1_name: '',
    assistant2_name: '',
    observations: ''
  })

  useEffect(() => {
    if (id) {
      loadReport()
      loadRelatedData()
    }
  }, [id])

  const loadReport = async () => {
    try {
      setLoading(true)
      console.log('🔍 [REPORT_EDIT] Carregando relatório:', id)
      
      // 1. Carregar relatório básico
      const { data: reportData, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      console.log('✅ [REPORT_EDIT] Relatório básico carregado:', reportData?.report_number)
      
      if (reportData) {
        console.log('🔍 [REPORT_EDIT] Enriquecendo dados com relacionamentos...')
        
        // 2. Enriquecer com dados do cliente
        if (reportData.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('id', reportData.client_id)
            .single()
          
          reportData.clients = clientData
        }
        
        // 3. Enriquecer com dados da bomba
        if (reportData.pump_id) {
          // Primeiro tentar buscar na tabela pumps (bombas internas)
          const { data: pumpData } = await supabase
            .from('pumps')
            .select('*')
            .eq('id', reportData.pump_id)
            .single()
          
          if (pumpData) {
            reportData.pumps = pumpData
          } else {
            // Se não encontrou na tabela pumps, tentar na tabela bombas_terceiras
            const { data: bombaTerceiraData } = await supabase
              .from('view_bombas_terceiras_com_empresa')
              .select('*')
              .eq('id', reportData.pump_id)
              .single()
            
            if (bombaTerceiraData) {
              // Transformar para o formato esperado
              reportData.pumps = {
                id: bombaTerceiraData.id,
                prefix: bombaTerceiraData.prefixo,
                model: bombaTerceiraData.modelo,
                brand: `${bombaTerceiraData.empresa_nome_fantasia} - R$ ${bombaTerceiraData.valor_diaria || 0}/dia`,
                owner_company_id: bombaTerceiraData.empresa_id,
                is_terceira: true,
                empresa_nome: bombaTerceiraData.empresa_nome_fantasia,
                valor_diaria: bombaTerceiraData.valor_diaria
              }
            }
          }
        }
        
        // 4. Enriquecer com dados da empresa
        if (reportData.company_id) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', reportData.company_id)
            .single()
          
          reportData.companies = companyData
        }
        
        console.log('✅ [REPORT_EDIT] Dados enriquecidos com sucesso!')
        
        // Preencher formulário
        setFormData({
          date: reportData.date || '',
          client_id: reportData.client_id || '',
          client_rep_name: reportData.client_rep_name || '',
          pump_id: reportData.pump_id || '',
          pump_prefix: reportData.pump_prefix || '',
          realized_volume: reportData.realized_volume?.toString() || '',
          total_value: reportData.total_value?.toString() || '',
          status: reportData.status || 'PENDENTE',
          driver_name: reportData.driver_name || '',
          assistant1_name: reportData.assistant1_name || '',
          assistant2_name: reportData.assistant2_name || '',
          observations: reportData.observations || ''
        })
        
        setReport(reportData as ReportWithRelations)
      }
    } catch (error) {
      console.error('❌ [REPORT_EDIT] Erro ao carregar relatório:', error)
      setError('Erro ao carregar relatório')
    } finally {
      setLoading(false)
    }
  }

  const loadRelatedData = async () => {
    try {
      // Carregar clientes
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name')
        .order('name')
      setClients(clientsData || [])

      // Carregar bombas
      const { data: pumpsData } = await supabase
        .from('pumps')
        .select('id, prefix')
        .order('prefix')
      setPumps(pumpsData || [])

      // Carregar empresas (comentado - não utilizado no momento)
      // const { data: companiesData } = await supabase
      //   .from('companies')
      //   .select('id, name')
      //   .order('name')
    } catch (error) {
      console.error('Erro ao carregar dados relacionados:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!report) return

    try {
      setSaving(true)
      
      const updateData = {
        date: formData.date,
        client_id: formData.client_id || null,
        client_rep_name: formData.client_rep_name,
        pump_id: formData.pump_id || null,
        pump_prefix: formData.pump_prefix,
        realized_volume: parseFloat(formData.realized_volume) || null,
        total_value: parseFloat(formData.total_value) || null,
        status: formData.status,
        driver_name: formData.driver_name,
        assistant1_name: formData.assistant1_name,
        assistant2_name: formData.assistant2_name,
        observations: formData.observations
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', report.id)

      if (error) throw error

      // Redirecionar para detalhes do relatório
      navigate(`/reports/${report.id}`)
    } catch (error) {
      console.error('Erro ao atualizar relatório:', error)
      setError('Erro ao atualizar relatório')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Se mudou a bomba, preencher automaticamente prefixo e empresa do serviço
      if (field === 'pump_id') {
        const pump = pumps.find(p => p.id === value)
        if (pump) {
          newData.pump_prefix = pump.prefix || ''
          
          // Buscar empresa do serviço baseada na empresa da bomba
          if (pump.empresa_nome) {
            const serviceCompany = companies.find(c => c.name === pump.empresa_nome)
            if (serviceCompany) {
              newData.service_company_id = serviceCompany.id
              console.log('🔧 Empresa do serviço preenchida automaticamente (edição):', {
                bomba: pump.prefix,
                empresa: pump.empresa_nome,
                company_id: serviceCompany.id
              })
            }
          }
        }
      }
      
      return newData
    })
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loading />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <GenericError 
        title="Erro ao carregar relatório" 
        message={error} 
        onRetry={loadReport} 
      />
    )
  }

  if (!report) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Relatório não encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            O relatório que você está tentando editar não existe ou foi removido.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate('/reports')}>
              Voltar para lista de relatórios
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editar Relatório {report.report_number}
            </h1>
            <p className="text-gray-600">
              Atualize as informações do relatório
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/reports/${report.id}`)}
            >
              Cancelar
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
              <div className="space-y-4">
                <DatePicker
                  value={formData.date}
                  onChange={(value) => handleInputChange('date', value)}
                  label="Data"
                  required
                />
                
                <Select
                  label="Cliente"
                  value={formData.client_id}
                  onChange={(value) => handleInputChange('client_id', value)}
                  options={clients.map(client => ({ value: client.id, label: client.name }))}
                  placeholder="Selecione um cliente"
                />
                
                <FormField
                  label="Representante do Cliente"
                  value={formData.client_rep_name}
                  onChange={(e) => handleInputChange('client_rep_name', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Informações da Bomba */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Informações da Bomba</h2>
              <div className="space-y-4">
                <Select
                  label="Bomba"
                  value={formData.pump_id}
                  onChange={(value) => handleInputChange('pump_id', value)}
                  options={pumps.map(pump => ({ value: pump.id, label: pump.prefix }))}
                  placeholder="Selecione uma bomba"
                />
                
                <FormField
                  label="Prefixo da Bomba"
                  value={formData.pump_prefix}
                  onChange={(e) => handleInputChange('pump_prefix', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Detalhes do Bombeamento */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Detalhes do Bombeamento</h2>
              <div className="space-y-4">
                <FormField
                  label="Volume Realizado (m³)"
                  type="number"
                  step="0.1"
                  value={formData.realized_volume}
                  onChange={(e) => handleInputChange('realized_volume', e.target.value)}
                  required
                />
                
                <FormField
                  label="Valor Total (R$)"
                  type="number"
                  step="0.01"
                  value={formData.total_value}
                  onChange={(e) => handleInputChange('total_value', e.target.value)}
                  required
                />
                
                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(value) => handleInputChange('status', value)}
                  options={STATUS_OPTIONS}
                />
              </div>
            </div>

            {/* Equipe */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Equipe</h2>
              <div className="space-y-4">
                <FormField
                  label="Motorista"
                  value={formData.driver_name}
                  onChange={(e) => handleInputChange('driver_name', e.target.value)}
                />
                
                <FormField
                  label="Auxiliar 1"
                  value={formData.assistant1_name}
                  onChange={(e) => handleInputChange('assistant1_name', e.target.value)}
                />
                
                <FormField
                  label="Auxiliar 2"
                  value={formData.assistant2_name}
                  onChange={(e) => handleInputChange('assistant2_name', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Observações</h2>
            <FormField
              label="Observações"
              type="textarea"
              value={formData.observations}
              onChange={(e) => handleInputChange('observations', e.target.value)}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/reports/${report.id}`)} 
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
