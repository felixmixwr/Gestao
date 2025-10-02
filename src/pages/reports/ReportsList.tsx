import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { MultiSelect } from '../../components/MultiSelect'
import { DateRangePicker } from '../../components/ui/date-range-picker';
import { ExportModal } from '../../components/ExportModal'
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
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [totalReports, setTotalReports] = useState(0)
  const [filters, setFilters] = useState<ReportFilters>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [dateFilterType, setDateFilterType] = useState<string>('all')
  
  // Estados para ordenação
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Estados para busca
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<'id' | 'date' | 'client' | 'pump' | 'volume' | 'value' | 'company'>('id')
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  
  // Estados para filtros de empresa
  const [companySearchTerm, setCompanySearchTerm] = useState('')
  const [filteredCompanies, setFilteredCompanies] = useState<Array<{ id: string; name: string }>>([])
  
  // Estados para exportação
  const [showExportModal, setShowExportModal] = useState(false)
  
  // Estado para itens por página
  const [itemsPerPage, setItemsPerPage] = useState(25)

  useEffect(() => {
    loadClients()
    loadPumps()
    loadCompanies()
  }, [])

  useEffect(() => {
    loadReports()
  }, [filters, currentPage, searchTerm, searchType, sortField, sortDirection, itemsPerPage])

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
      setCompanies(data || [])
      setFilteredCompanies(data || [])
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

      // Aplicar ordenação apenas se não for por status (status será ordenado customizado)
      if (sortField !== 'status') {
        query = query.order(sortField, { ascending: sortDirection === 'asc' })
      } else {
        // Para status, usar ordenação padrão por data de criação
        query = query.order('created_at', { ascending: false })
      }

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

      // Aplicar filtros de busca
      if (searchTerm.trim()) {
        console.log('🔍 [DEBUG] Aplicando busca:', { searchTerm, searchType })
        
        switch (searchType) {
          case 'id':
            query = query.ilike('report_number', `%${searchTerm}%`)
            break
          case 'date':
            query = query.ilike('date', `%${searchTerm}%`)
            break
          case 'client':
            query = query.ilike('client_rep_name', `%${searchTerm}%`)
            break
          case 'pump':
            query = query.ilike('pump_prefix', `%${searchTerm}%`)
            break
          case 'volume': {
            const volumeNum = parseFloat(searchTerm)
            if (!isNaN(volumeNum)) {
              query = query.eq('realized_volume', volumeNum)
            }
            break
          }
          case 'value': {
            const valueNum = parseFloat(searchTerm.replace(/[^\d.,]/g, '').replace(',', '.'))
            if (!isNaN(valueNum)) {
              query = query.eq('total_value', valueNum)
            }
            break
          }
          case 'company': {
            // Buscar por nome da empresa através do relacionamento
            query = query.ilike('companies.name', `%${searchTerm}%`)
            break
          }
        }
      }

      // Aplicar filtros avançados
      if (filters.report_number) {
        query = query.ilike('report_number', `%${filters.report_number}%`)
      }
      
      if (filters.client_name) {
        query = query.ilike('client_rep_name', `%${filters.client_name}%`)
      }
      
      if (filters.company_name) {
        query = query.ilike('companies.name', `%${filters.company_name}%`)
      }
      
      if (filters.pump_name) {
        query = query.ilike('pump_prefix', `%${filters.pump_name}%`)
      }
      
      if (filters.volume_min !== undefined) {
        query = query.gte('realized_volume', filters.volume_min)
      }
      
      if (filters.volume_max !== undefined) {
        query = query.lte('realized_volume', filters.volume_max)
      }
      
      if (filters.value_min !== undefined) {
        query = query.gte('total_value', filters.value_min)
      }
      
      if (filters.value_max !== undefined) {
        query = query.lte('total_value', filters.value_max)
      }

      // 1. Primeiro, contar o total de registros para calcular paginação
      console.log('🔍 [DEBUG] Contando total de registros...')
      
      // Criar uma query separada apenas para contagem
      let countQuery = supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .order(sortField, { ascending: sortDirection === 'asc' })

      // Aplicar os mesmos filtros na query de contagem
      if (filters.status && filters.status.length > 0) {
        countQuery = countQuery.in('status', filters.status)
      }
      if (filters.dateFrom) {
        countQuery = countQuery.gte('date', filters.dateFrom)
      }
      if (filters.dateTo) {
        countQuery = countQuery.lte('date', filters.dateTo)
      }
      if (filters.pump_prefix) {
        countQuery = countQuery.eq('pump_prefix', filters.pump_prefix)
      }
      if (filters.client_id) {
        countQuery = countQuery.eq('client_id', filters.client_id)
      }
      if (searchTerm.trim()) {
        switch (searchType) {
          case 'id':
            countQuery = countQuery.ilike('report_number', `%${searchTerm}%`)
            break
          case 'date':
            countQuery = countQuery.ilike('date', `%${searchTerm}%`)
            break
          case 'client':
            countQuery = countQuery.ilike('client_rep_name', `%${searchTerm}%`)
            break
          case 'pump':
            countQuery = countQuery.ilike('pump_prefix', `%${searchTerm}%`)
            break
          case 'volume': {
            const volumeNum = parseFloat(searchTerm)
            if (!isNaN(volumeNum)) {
              countQuery = countQuery.eq('realized_volume', volumeNum)
            }
            break
          }
          case 'value': {
            const valueNum = parseFloat(searchTerm.replace(/[^\d.,]/g, '').replace(',', '.'))
            if (!isNaN(valueNum)) {
              countQuery = countQuery.eq('total_value', valueNum)
            }
            break
          }
          case 'company': {
            // Buscar por nome da empresa através do relacionamento
            countQuery = countQuery.ilike('companies.name', `%${searchTerm}%`)
            break
          }
        }
      }

      console.log('🔍 [DEBUG] Executando query de contagem...')
      const { count: totalCount, error: countError } = await countQuery

      if (countError) {
        console.error('❌ [ERROR] Erro ao contar registros:', countError)
        console.error('❌ [ERROR] Detalhes do erro:', countError.message, countError.details, countError.hint)
        throw countError
      }

      console.log('✅ [SUCCESS] Contagem executada com sucesso!')
      console.log('📊 [DATA] Resultado da contagem:', totalCount)

      const totalRecords = totalCount || 0
      const calculatedTotalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage))
      
      console.log('📊 [DATA] Total de registros:', totalRecords)
      console.log('📊 [DATA] Total de páginas calculadas:', calculatedTotalPages)
      console.log('📊 [DATA] itemsPerPage:', itemsPerPage)
      console.log('📊 [DATA] currentPage:', currentPage)
      
      setTotalPages(calculatedTotalPages)
      setTotalReports(totalRecords)

      // 2. Aplicar paginação na query principal
      console.log('🔍 [DEBUG] Aplicando paginação...')
      let { data: reportsData, error } = await query

      // Se a ordenação for por status, carregar todos os dados para ordenação customizada
      if (sortField === 'status') {
        console.log('🔍 [DEBUG] Carregando todos os dados para ordenação customizada por status...')
        // Não aplicar range ainda, vamos ordenar primeiro
      } else {
        // Para outras ordenações, aplicar paginação diretamente no banco
        const { data: paginatedData, error: paginationError } = await query.range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)
        if (paginationError) {
          console.error('❌ [ERROR] Erro na paginação:', paginationError)
          throw paginationError
        }
        reportsData = paginatedData
      }

      if (error) {
        console.error('❌ [ERROR] Erro na query principal:', error)
        throw error
      }

      console.log('✅ [SUCCESS] Relatórios básicos carregados!')
      console.log('📊 [DATA] Total de relatórios retornados:', reportsData?.length || 0)
      console.log('📊 [DATA] Ordenação atual:', { sortField, sortDirection })
      
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
        
        // Buscar bombas internas
        const { data: pumpsData } = await supabase
          .from('pumps')
          .select('*')
          .in('id', pumpIds)
        
        console.log('📊 [DATA] Bombas internas carregadas:', pumpsData)
        
        // Buscar bombas terceiras para IDs que não foram encontrados nas bombas internas
        const foundPumpIds = pumpsData?.map(p => p.id) || []
        const missingPumpIds = pumpIds.filter(id => !foundPumpIds.includes(id))
        
        let bombasTerceirasData = []
        if (missingPumpIds.length > 0) {
          console.log('🔍 [DEBUG] Buscando bombas terceiras para IDs:', missingPumpIds)
          const { data: bombasTerceiras } = await supabase
            .from('view_bombas_terceiras_com_empresa')
            .select('*')
            .in('id', missingPumpIds)
          
          bombasTerceirasData = bombasTerceiras || []
          console.log('📊 [DATA] Bombas terceiras carregadas:', bombasTerceirasData)
        }
        
        // 4. Enriquecer com dados das empresas
        const companyIds = [...new Set(reportsData.map(r => r.company_id).filter(Boolean))]
        console.log('🔍 [DEBUG] Company IDs únicos:', companyIds)
        
        const { data: companiesData } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds)
        
        console.log('📊 [DATA] Empresas carregadas:', companiesData)
        
        // 5. Combinar os dados
        const enrichedReports = reportsData.map(report => {
          // Buscar bomba interna primeiro
          let pumpData = pumpsData?.find(p => p.id === report.pump_id)
          
          // Se não encontrou bomba interna, buscar bomba terceira
          if (!pumpData) {
            const bombaTerceira = bombasTerceirasData?.find(bt => bt.id === report.pump_id)
            if (bombaTerceira) {
              pumpData = {
                id: bombaTerceira.id,
                prefix: bombaTerceira.prefixo,
                model: bombaTerceira.modelo,
                brand: `${bombaTerceira.empresa_nome_fantasia} - R$ ${bombaTerceira.valor_diaria || 0}/dia`,
                owner_company_id: bombaTerceira.empresa_id,
                is_terceira: true,
                empresa_nome: bombaTerceira.empresa_nome_fantasia,
                valor_diaria: bombaTerceira.valor_diaria
              }
            }
          }
          
          return {
            ...report,
            clients: clientsData?.find(c => c.id === report.client_id),
            pumps: pumpData,
            companies: companiesData?.find(comp => comp.id === report.company_id)
          }
        })
        
        console.log('✅ [SUCCESS] Dados enriquecidos com sucesso!')
        console.log('📊 [DATA] Primeiro relatório enriquecido:', enrichedReports[0])
        console.log('📊 [DATA] Client data do primeiro:', enrichedReports[0]?.clients)
        console.log('📊 [DATA] Pump data do primeiro:', enrichedReports[0]?.pumps)
        console.log('📊 [DATA] Company data do primeiro:', enrichedReports[0]?.companies)
        
        // 6. Aplicar ordenação customizada por status se necessário
        let finalReports = enrichedReports
        if (sortField === 'status') {
          console.log('🔍 [DEBUG] Aplicando ordenação customizada por status...')
          finalReports = enrichedReports.sort((a, b) => {
            const orderA = getStatusOrder(a.status)
            const orderB = getStatusOrder(b.status)
            
            if (sortDirection === 'asc') {
              return orderA - orderB
            } else {
              return orderB - orderA
            }
          })
          console.log('📊 [DATA] Ordenação customizada aplicada')
          
          // 7. Aplicar paginação no frontend para ordenação por status
          console.log('🔍 [DEBUG] Aplicando paginação no frontend...')
          const startIndex = (currentPage - 1) * itemsPerPage
          const endIndex = startIndex + itemsPerPage
          finalReports = finalReports.slice(startIndex, endIndex)
          console.log('📊 [DATA] Paginação aplicada:', { startIndex, endIndex, total: enrichedReports.length })
        }
        
        setReports(finalReports)
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

  // Funções de busca
  const handleSearch = () => {
    setCurrentPage(1) // Reset para primeira página
    loadReports()
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSearchType('id')
    setCompanySearchTerm('')
    setFilteredCompanies(companies)
    setFilters({})
    setCurrentPage(1)
    loadReports()
  }

  const handleAdvancedSearch = (advancedFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...advancedFilters }))
    setCurrentPage(1)
    loadReports()
  }

  const clearAdvancedSearch = () => {
    setFilters({})
    setCompanySearchTerm('')
    setFilteredCompanies(companies)
    setCurrentPage(1)
    loadReports()
  }

  // Função para lidar com ordenação
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Se já está ordenando por este campo, alternar direção
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      // Se é um novo campo, começar com descendente
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1) // Voltar para primeira página
  }

  // Função para lidar com mudança de itens por página
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Voltar para primeira página
  }

  // Função para ordenar status customizado
  const getStatusOrder = (status: string) => {
    const statusOrder = {
      'ENVIADO_FINANCEIRO': 1,
      'RECEBIDO_FINANCEIRO': 2,
      'AGUARDANDO_APROVACAO': 3,
      'NOTA_EMITIDA': 4,
      'AGUARDANDO_PAGAMENTO': 5,
      'PAGO': 6
    }
    return statusOrder[status as keyof typeof statusOrder] || 999
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
    setSearchTerm('')
    setSearchType('id')
    setCompanySearchTerm('')
    setFilteredCompanies(companies)
    setShowAdvancedSearch(false)
    setCurrentPage(1)
    // Não resetar itemsPerPage - manter a preferência do usuário
  }

  const hasActiveFilters = () => {
    return (
      (filters.status && filters.status.length > 0) ||
      dateFilterType !== 'all' ||
      filters.pump_prefix ||
      filters.client_id ||
      searchTerm.trim() ||
      filters.report_number ||
      filters.client_name ||
      filters.company_name ||
      filters.pump_name ||
      filters.volume_min !== undefined ||
      filters.volume_max !== undefined ||
      filters.value_min !== undefined ||
      filters.value_max !== undefined
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
      className: 'w-20 font-mono text-xs font-semibold',
      sortable: true
    },
    {
      key: 'date' as keyof ReportWithRelations,
      label: 'DATA',
      className: 'w-20',
      sortable: true,
      render: (value: string | null) => value ? formatDateLocal(value) : '-'
    },
    {
      key: 'client_rep_name' as keyof ReportWithRelations,
      label: 'CLIENTE',
      className: 'w-32',
      sortable: true,
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
      sortable: true,
      render: (value: string | null) => value || '-'
    },
    {
      key: 'realized_volume' as keyof ReportWithRelations,
      label: 'VOL (M³)',
      className: 'w-20',
      sortable: true,
      render: (value: number | null) => value ? value.toLocaleString('pt-BR') : '-'
    },
    {
      key: 'total_value' as keyof ReportWithRelations,
      label: 'VALOR',
      className: 'w-24',
      sortable: true,
      render: (value: number | null) => value ? formatCurrency(value) : '-'
    },
    {
      key: 'status' as keyof ReportWithRelations,
      label: 'STATUS',
      className: 'w-32 cursor-pointer hover:bg-gray-100 select-none',
      sortable: true,
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
      render: (_: any, _report: ReportWithRelations) => (
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewReport(_report)}
            className="px-2 py-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded text-xs font-medium"
          >
            Ver
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleWhatsApp(_report)}
            disabled={!_report.clients?.phone}
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
          <div className="flex gap-2">
            <Button 
              size="sm"
              onClick={() => setShowExportModal(true)}
              disabled={reports.length === 0}
              className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📊 Exportar
            </Button>
            <Button 
              size="sm"
              onClick={() => window.location.href = '/reports/new'}
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium"
            >
              Novo Relatório
            </Button>
          </div>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">

          {/* Barra de Busca */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Campo de Busca */}
              <div className="flex-1">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Digite o termo de busca..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="id">ID do Relatório</option>
                    <option value="date">Data</option>
                    <option value="client">Cliente</option>
                    <option value="company">Empresa</option>
                    <option value="pump">Bomba</option>
                    <option value="volume">Volume (m³)</option>
                    <option value="value">Valor (R$)</option>
                  </select>
                  <Button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium"
                  >
                    🔍 Buscar
                  </Button>
                  <Button
                    onClick={clearSearch}
                    variant="outline"
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md text-sm font-medium"
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              
              {/* Botão de Busca Avançada */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  variant="outline"
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md text-sm font-medium"
                >
                  {showAdvancedSearch ? '🔽 Busca Simples' : '🔍 Busca Avançada'}
                </Button>
              </div>
            </div>

            {/* Busca Avançada */}
            {showAdvancedSearch && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Filtros Avançados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* ID do Relatório */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID do Relatório
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: RPT-20241201-0001"
                      value={filters.report_number || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, report_number: e.target.value || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Nome do Cliente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Cliente
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: João Silva"
                      value={filters.client_name || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, client_name: e.target.value || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Nome da Empresa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Empresa
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: Felix Mix"
                        value={companySearchTerm}
                        onChange={(e) => {
                          const value = e.target.value
                          setCompanySearchTerm(value)
                          
                          // Filtrar empresas em tempo real
                          if (value.trim()) {
                            const filtered = companies.filter(company => 
                              company.name.toLowerCase().includes(value.toLowerCase())
                            )
                            setFilteredCompanies(filtered)
                          } else {
                            setFilteredCompanies(companies)
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {companySearchTerm && filteredCompanies.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {filteredCompanies.map((company) => (
                            <div
                              key={company.id}
                              onClick={() => {
                                setCompanySearchTerm(company.name)
                                setFilters(prev => ({ ...prev, company_name: company.name }))
                                setFilteredCompanies([])
                              }}
                              className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                            >
                              {company.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prefixo da Bomba */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prefixo da Bomba
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: WR-001"
                      value={filters.pump_name || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, pump_name: e.target.value || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Volume Mínimo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Volume Mínimo (m³)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 10.0"
                      value={filters.volume_min || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, volume_min: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Volume Máximo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Volume Máximo (m³)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 100.0"
                      value={filters.volume_max || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, volume_max: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Valor Mínimo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Mínimo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 100.00"
                      value={filters.value_min || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, value_min: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Valor Máximo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Máximo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1000.00"
                      value={filters.value_max || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, value_max: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Botões da Busca Avançada */}
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => handleAdvancedSearch(filters)}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium"
                  >
                    🔍 Aplicar Filtros
                  </Button>
                  <Button
                    onClick={clearAdvancedSearch}
                    variant="outline"
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md text-sm font-medium"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Filtros */}
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter - MultiSelect */}
              <MultiSelect
                label="Status"
                value={filters.status || []}
                onChange={(values) => {
                  setFilters(prev => ({ 
                    ...prev, 
                    status: values.length > 0 ? values as ReportStatus[] : undefined 
                  }))
                  setCurrentPage(1)
                }}
                options={getAllStatusOptions()}
                placeholder="Selecione os status"
                maxDisplayItems={2}
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
                        <div className="flex flex-wrap gap-1">
                          {filters.status.map((status) => (
                            <span key={status} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Status: {getStatusLabel(status)}
                            </span>
                          ))}
                        </div>
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
                      {filters.company_name && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Empresa: {filters.company_name}
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

          {/* Results Summary e Controles de Paginação */}
          {!loading && (
            <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-4">
                <div>
                  {hasActiveFilters() ? (
                    <span>
                      Mostrando <strong>{reports.length}</strong> de <strong>{totalReports}</strong> relatório(s) com os filtros aplicados
                    </span>
                  ) : (
                    <span>
                      Total de <strong>{totalReports}</strong> relatório(s)
                    </span>
                  )}
                </div>
                
                {/* Dropdown de Itens por Página */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Mostrar:
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={75}>75</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                  <span className="text-sm text-gray-500">por página</span>
                </div>
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
                    className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase ${column.className || ''} ${(column as any).sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    onClick={() => (column as any).sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {(column as any).sortable && sortField === column.key && (
                        <span className="text-blue-600">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
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
        {totalPages > 0 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || totalPages <= 1}
            >
              Primeira
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || totalPages <= 1}
            >
              Anterior
            </Button>
            
            {/* Mostrar números das páginas */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages <= 1}
            >
              Próxima
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages <= 1}
            >
              Última
            </Button>
          </div>
        )}

        {/* Modal de Exportação */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          reports={reports}
          filters={filters}
          onExport={(format) => {
            console.log(`Exportação ${format.toUpperCase()} realizada com sucesso!`)
          }}
        />

      </div>
    </Layout>
  )
}
