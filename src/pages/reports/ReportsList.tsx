import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Layout } from '../../components/Layout'
// Removido: Table não é mais usado
// Removido: Badge não é mais usado
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { DateRangePicker } from '../../components/ui/date-range-picker';
import { ReportWithRelations, ReportFilters, ReportStatus } from '../../types/reports'
import { formatCurrency } from '../../utils/formatters'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  getStatusLabel, 
  getStatusOptions, 
  getAllStatusOptions
} from '../../utils/status-utils'

// Removido: STATUS_OPTIONS, getStatusVariant e getStatusLabel agora estão em status-utils.ts

export default function ReportsList() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<ReportWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [pumps, setPumps] = useState<Array<{ id: string; prefix: string }>>([])
  // const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]) // Removido variável não utilizada
  const [filters, setFilters] = useState<ReportFilters>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  // const [updatingStatus, setUpdatingStatus] = useState<string | null>(null) // Removido variável não utilizada
  const [dateFilterType, setDateFilterType] = useState<string>('all')

  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    loadClients()
    loadPumps()
    loadCompanies()
  }, [])

  useEffect(() => {
    loadReports()
  }, [filters, currentPage])

  const loadClients = async () => {
    try {
      console.log('🔍 [DEBUG] Carregando clientes...')
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('❌ [ERROR] Erro ao carregar clientes:', error)
        throw error
      }
      
      console.log('✅ [SUCCESS] Clientes carregados:', data?.length || 0)
      console.log('📊 [DATA] Lista de clientes:', data)
      setClients(data || [])
    } catch (error) {
      console.error('❌ [ERROR] Erro ao carregar clientes:', error)
    }
  }

  const loadPumps = async () => {
    try {
      console.log('🔍 [DEBUG] Carregando bombas...')
      const { data, error } = await supabase
        .from('pumps')
        .select('id, prefix')
        .order('prefix')

      if (error) {
        console.error('❌ [ERROR] Erro ao carregar bombas:', error)
        throw error
      }
      
      console.log('✅ [SUCCESS] Bombas carregadas:', data?.length || 0)
      console.log('📊 [DATA] Lista de bombas:', data)
      setPumps(data || [])
    } catch (error) {
      console.error('❌ [ERROR] Erro ao carregar bombas:', error)
    }
  }

  const loadCompanies = async () => {
    try {
      console.log('🔍 [DEBUG] Carregando empresas...')
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('❌ [ERROR] Erro ao carregar empresas:', error)
        throw error
      }
      
      console.log('✅ [SUCCESS] Empresas carregadas:', data?.length || 0)
      console.log('📊 [DATA] Lista de empresas:', data)
      // setCompanies(data || []) // Removido - variável não existe mais
    } catch (error) {
      console.error('❌ [ERROR] Erro ao carregar empresas:', error)
    }
  }

  const loadReports = async () => {
    try {
      setLoading(true)
      
      console.log('🔍 [DEBUG] Iniciando carregamento de relatórios...')
      console.log('🔍 [DEBUG] Filtros aplicados:', filters)
      console.log('🔍 [DEBUG] Página atual:', currentPage)
      
      // Tentar abordagem alternativa: queries separadas
      console.log('🔍 [DEBUG] Testando abordagem alternativa com queries separadas...')
      
      // 1. Carregar relatórios básicos
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters.status && filters.status.length > 0) {
        console.log('🔍 [DEBUG] Aplicando filtro de status:', filters.status)
        query = query.in('status', filters.status)
      }

      if (filters.dateFrom) {
        console.log('🔍 [DEBUG] Aplicando filtro de data inicial:', filters.dateFrom)
        query = query.gte('date', filters.dateFrom)
      }

      if (filters.dateTo) {
        console.log('🔍 [DEBUG] Aplicando filtro de data final:', filters.dateTo)
        query = query.lte('date', filters.dateTo)
      }

      if (filters.pump_prefix) {
        console.log('🔍 [DEBUG] Aplicando filtro de bomba:', filters.pump_prefix)
        query = query.eq('pump_prefix', filters.pump_prefix)
      }

      if (filters.client_id) {
        console.log('🔍 [DEBUG] Aplicando filtro de cliente:', filters.client_id)
        query = query.eq('client_id', filters.client_id)
      }

      // Por enquanto, vamos usar uma contagem simples
      console.log('🔍 [DEBUG] Executando query principal...')
      setTotalPages(1) // Simplificado por enquanto

      // Depois, aplicar paginação
      console.log('🔍 [DEBUG] Aplicando paginação...')
      const { data: reportsData, error } = await query
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)

      if (error) {
        console.error('❌ [ERROR] Erro na query principal:', error)
        throw error
      }

      console.log('✅ [SUCCESS] Relatórios básicos carregados!')
      console.log('📊 [DATA] Total de relatórios retornados:', reportsData?.length || 0)
      
      if (reportsData && reportsData.length > 0) {
        console.log('🔍 [DEBUG] Enriquecendo dados com relacionamentos...')
        
        // 2. Enriquecer com dados dos clientes
        const clientIds = [...new Set(reportsData.map(r => r.client_id).filter(Boolean))]
        console.log('🔍 [DEBUG] Client IDs únicos:', clientIds)
        
        const { data: clientsData } = await supabase
          .from('clients')
          .select('*')
          .in('id', clientIds)
        
        console.log('📊 [DATA] Clientes carregados:', clientsData)
        
        // 3. Enriquecer com dados das bombas
        const pumpIds = [...new Set(reportsData.map(r => r.pump_id).filter(Boolean))]
        console.log('🔍 [DEBUG] Pump IDs únicos:', pumpIds)
        
        const { data: pumpsData } = await supabase
          .from('pumps')
          .select('*')
          .in('id', pumpIds)
        
        console.log('📊 [DATA] Bombas carregadas:', pumpsData)
        
        // 4. Enriquecer com dados das empresas
        const companyIds = [...new Set(reportsData.map(r => r.company_id).filter(Boolean))]
        console.log('🔍 [DEBUG] Company IDs únicos:', companyIds)
        
        const { data: companiesData } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds)
        
        console.log('📊 [DATA] Empresas carregadas:', companiesData)
        
        // 5. Combinar os dados
        const enrichedReports = reportsData.map(report => ({
          ...report,
          clients: clientsData?.find(c => c.id === report.client_id),
          pumps: pumpsData?.find(p => p.id === report.pump_id),
          companies: companiesData?.find(comp => comp.id === report.company_id)
        }))
        
        console.log('✅ [SUCCESS] Dados enriquecidos com sucesso!')
        console.log('📊 [DATA] Primeiro relatório enriquecido:', enrichedReports[0])
        console.log('📊 [DATA] Client data do primeiro:', enrichedReports[0]?.clients)
        console.log('📊 [DATA] Pump data do primeiro:', enrichedReports[0]?.pumps)
        console.log('📊 [DATA] Company data do primeiro:', enrichedReports[0]?.companies)
        
        setReports(enrichedReports)
      } else {
        console.log('⚠️ [WARNING] Nenhum relatório retornado!')
        setReports([])
      }
    } catch (error) {
      console.error('❌ [ERROR] Erro ao carregar relatórios:', error)
      console.error('❌ [ERROR] Stack trace:', (error as Error).stack)
      setReports([])
    } finally {
      setLoading(false)
      console.log('🔍 [DEBUG] Carregamento de relatórios finalizado')
    }
  }

  const handleStatusChange = async (reportId: string, newStatus: ReportStatus) => {
    try {
      const updateData: any = { status: newStatus }
      
      if (newStatus === 'PAGO') {
        updateData.paid_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId)

      if (error) throw error

      // Recarregar relatórios
      await loadReports()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  // Função para formatar data considerando fuso horário local
const formatDateLocal = (dateString: string): string => {
  if (!dateString) return 'N/A'
  
  // Se a data está no formato YYYY-MM-DD, criar Date considerando fuso horário local
  const [year, month, day] = dateString.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)
  
  return format(localDate, 'dd/MM/yyyy', { locale: ptBR })
}

const handleWhatsApp = (report: ReportWithRelations) => {
    const phone = report.clients?.phone?.replace(/\D/g, '') || ''
    const ownerCompany = report.companies?.name || 'empresa'
    const repName = report.client_rep_name || 'Cliente'
    const volume = report.realized_volume || 0
    const value = report.total_value || 0
    const date = formatDateLocal(report.date)
    
    const template = `Olá ${repName}, aqui é Henrique da ${ownerCompany}. Sobre o bombeamento ${report.report_number} em ${date}: volume ${volume} m³, valor ${formatCurrency(value)}. Confirma a forma de pagamento e se posso emitir a nota? Obrigado.`
    
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(template)}`
    window.open(url, '_blank')
  }

  const handleViewReport = (report: ReportWithRelations) => {
    navigate(`/reports/${report.id}`)
  }


  const handleDateFilterChange = (filterType: string) => {
    setDateFilterType(filterType)
    
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let dateFrom: string | undefined
    let dateTo: string | undefined
    
    switch (filterType) {
      case 'today':
        dateFrom = today.toISOString().split('T')[0]
        dateTo = today.toISOString().split('T')[0]
        break
      case 'yesterday':
        dateFrom = yesterday.toISOString().split('T')[0]
        dateTo = yesterday.toISOString().split('T')[0]
        break
      case 'last7days': {
        const last7Days = new Date(today)
        last7Days.setDate(last7Days.getDate() - 7)
        dateFrom = last7Days.toISOString().split('T')[0]
        dateTo = today.toISOString().split('T')[0]
        break
      }
      case 'last30days': {
        const last30Days = new Date(today)
        last30Days.setDate(last30Days.getDate() - 30)
        dateFrom = last30Days.toISOString().split('T')[0]
        dateTo = today.toISOString().split('T')[0]
        break
      }
      case 'custom':
        // Não alterar as datas, manter as existentes
        return
      case 'all':
      default:
        dateFrom = undefined
        dateTo = undefined
        break
    }
    
    setFilters(prev => ({
      ...prev,
      dateFrom,
      dateTo
    }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setDateFilterType('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = () => {
    return (
      (filters.status && filters.status.length > 0) ||
      dateFilterType !== 'all' ||
      filters.pump_prefix ||
      filters.client_id
    )
  }

  const getDateFilterLabel = (filterType: string) => {
    switch (filterType) {
      case 'today': return 'Hoje'
      case 'yesterday': return 'Ontem'
      case 'last7days': return 'Últimos 7 dias'
      case 'last30days': return 'Últimos 30 dias'
      case 'custom': return 'Personalizado'
      default: return 'Todos os períodos'
    }
  }

  const columns = [
    {
      key: 'report_number' as keyof ReportWithRelations,
      label: 'NÚMERO',
      className: 'w-20 font-mono text-xs font-semibold'
    },
    {
      key: 'date' as keyof ReportWithRelations,
      label: 'DATA',
      className: 'w-20',
      render: (value: string | null) => value ? formatDateLocal(value) : '-'
    },
    {
      key: 'client_rep_name' as keyof ReportWithRelations,
      label: 'CLIENTE',
      className: 'w-32',
      render: (value: string | null, report: ReportWithRelations) => {
        const repName = value || '-'
        const companyName = report.clients?.name || report.clients?.company_name || '-'
        return (
          <div className="text-xs">
            <div className="font-semibold text-gray-900 truncate">{repName}</div>
            <div className="text-gray-500 text-xs truncate">{companyName}</div>
          </div>
        )
      }
    },
    {
      key: 'pump_prefix' as keyof ReportWithRelations,
      label: 'BOMBA',
      className: 'w-16 font-mono text-xs font-semibold',
      render: (value: string | null) => value || '-'
    },
    {
      key: 'realized_volume' as keyof ReportWithRelations,
      label: 'VOL (M³)',
      className: 'w-20',
      render: (value: number | null) => value ? value.toLocaleString('pt-BR') : '-'
    },
    {
      key: 'total_value' as keyof ReportWithRelations,
      label: 'VALOR',
      className: 'w-24',
      render: (value: number | null) => value ? formatCurrency(value) : '-'
    },
    {
      key: 'status' as keyof ReportWithRelations,
      label: 'STATUS',
      className: 'w-32',
      render: (value: ReportStatus, report: ReportWithRelations) => (
        <select
          value={value}
          onChange={(e) => {
            const newStatus = e.target.value as ReportStatus
            if (newStatus && newStatus !== value) {
              handleStatusChange(report.id, newStatus)
            }
          }}
          className={`px-2 py-1 rounded text-white text-xs font-medium border-0 cursor-pointer focus:outline-none ${
            value === 'ENVIADO_FINANCEIRO' ? 'bg-status-enviado' :
            value === 'RECEBIDO_FINANCEIRO' ? 'bg-status-recebido' :
            value === 'AGUARDANDO_APROVACAO' ? 'bg-status-aprovacao' :
            value === 'NOTA_EMITIDA' ? 'bg-status-nota' :
            value === 'AGUARDANDO_PAGAMENTO' ? 'bg-status-aguardando' :
            value === 'PAGO' ? 'bg-status-pago' :
            'bg-gray-500'
          }`}
        >
          {getStatusOptions(value).map(option => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
              className="bg-white text-gray-900"
            >
              {option.label}
            </option>
          ))}
        </select>
      )
    },
    {
      key: 'actions' as keyof ReportWithRelations,
      label: 'AÇÕES',
      className: 'w-24',
      render: (_: any, report: ReportWithRelations) => (
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewReport(report)}
            className="px-2 py-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded text-xs font-medium"
          >
            Ver
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleWhatsApp(report)}
            disabled={!report.clients?.phone}
            className="px-2 py-1 bg-green-50 border-green-300 text-green-700 hover:bg-green-100 rounded text-xs font-medium"
          >
            WhatsApp
          </Button>
        </div>
      )
    }
  ]

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <Button 
            size="sm"
            onClick={() => window.location.href = '/reports/new'}
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium"
          >
            Novo Relatório
          </Button>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">

          {/* Filtros */}
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <Select
                label="Status"
                value={filters.status?.[0] || ''}
                onChange={(value) => {
                  setFilters(prev => ({ 
                    ...prev, 
                    status: value ? [value as ReportStatus] : undefined 
                  }))
                  setCurrentPage(1)
                }}
                options={getAllStatusOptions()}
                placeholder="Selecione um status"
              />

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <select
                  value={dateFilterType}
                  onChange={(e) => handleDateFilterChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos os períodos</option>
                  <option value="today">Hoje</option>
                  <option value="yesterday">Ontem</option>
                  <option value="last7days">Últimos 7 dias</option>
                  <option value="last30days">Últimos 30 dias</option>
                  <option value="custom">Personalizado</option>
                </select>
                
                {dateFilterType === 'custom' && (
                  <div className="mt-2">
                    <DateRangePicker
                      value={filters.dateFrom && filters.dateTo ? {
                        start: filters.dateFrom,
                        end: filters.dateTo
                      } : null}
                      onChange={(range) => {
                        setFilters(prev => ({ 
                          ...prev, 
                          dateFrom: range?.start || undefined,
                          dateTo: range?.end || undefined
                        }))
                        setCurrentPage(1)
                      }}
                      label="Período"
                      placeholder="Selecionar período"
                    />
                  </div>
                )}
              </div>

              {/* Pump Filter */}
              <Select
                label="Bomba"
                value={filters.pump_prefix || ''}
                onChange={(value) => {
                  setFilters(prev => ({ ...prev, pump_prefix: value || undefined }))
                  setCurrentPage(1)
                }}
                options={pumps.map(pump => ({ value: pump.prefix, label: pump.prefix }))}
                placeholder="Todas as bombas"
              />

              {/* Client Filter */}
              <Select
                label="Cliente"
                value={filters.client_id || ''}
                onChange={(value) => {
                  setFilters(prev => ({ ...prev, client_id: value || undefined }))
                  setCurrentPage(1)
                }}
                options={clients.map(client => ({ value: client.id, label: client.name }))}
                placeholder="Todos os clientes"
              />
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters() && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-800">Filtros ativos:</span>
                    <div className="flex flex-wrap gap-2">
                      {filters.status && filters.status.length > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Status: {getStatusLabel(filters.status[0])}
                        </span>
                      )}
                      {dateFilterType !== 'all' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Período: {getDateFilterLabel(dateFilterType)}
                        </span>
                      )}
                      {filters.pump_prefix && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Bomba: {filters.pump_prefix}
                        </span>
                      )}
                      {filters.client_id && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Cliente: {clients.find(c => c.id === filters.client_id)?.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Results Summary */}
          {!loading && (
            <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
              <div>
                {hasActiveFilters() ? (
                  <span>
                    Mostrando <strong>{reports.length}</strong> relatório(s) com os filtros aplicados
                  </span>
                ) : (
                  <span>
                    Total de <strong>{reports.length}</strong> relatório(s)
                  </span>
                )}
              </div>
              <div>
                Página {currentPage} de {totalPages}
              </div>
            </div>
          )}

        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase ${column.className || ''}`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                    {hasActiveFilters() ? "Nenhum relatório encontrado com os filtros aplicados" : "Nenhum relatório encontrado"}
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                      {columns.map((column, colIndex) => (
                        <td key={colIndex} className={`px-3 py-2 ${column.className || ''}`}>
                          {column.render ? (column.render as any)(report[column.key], report) : String(report[column.key] || '')}
                        </td>
                      ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}

      </div>
    </Layout>
  )
}
