/**
 SQL equivalentes (referência):
 - Relatórios pendentes hoje:
   SELECT COUNT(*) FROM reports WHERE status='PENDENTE' AND date = current_date;
 - Relatórios pendentes (total):
   SELECT COUNT(*) FROM reports WHERE status='PENDENTE';
 - Bombas disponíveis:
   SELECT COUNT(*) FROM pumps WHERE status='Disponível';
 - Faturado no mês:
   SELECT COALESCE(SUM(total_value),0) FROM reports WHERE date BETWEEN date_trunc('month', current_date) AND (date_trunc('month', current_date) + interval '1 month' - interval '1 day');
 - Últimos 5 relatórios:
   SELECT id, report_number, date, client_rep_name, pump_prefix, realized_volume, total_value, status, whatsapp_digits FROM reports ORDER BY date DESC LIMIT 5;
 */

import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../components/Layout'
import { KpiCard } from '../components/KpiCard'
import { Select } from '../components/Select'
import { FormField } from '../components/FormField'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { RecentReportsList, RecentReportItem } from '../components/RecentReportsList'
import { Button } from '../components/Button'
import { GenericError } from './errors/GenericError'
import { Database } from '../lib/supabase'

type Company = Database['public']['Tables']['companies']['Row']
type Pump = Database['public']['Tables']['pumps']['Row']

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

export default function Dashboard() {
  // Estados dos KPIs
  const [kpiLoading, setKpiLoading] = useState(true)
  const [kpiError, setKpiError] = useState<string | null>(null)
  const [pendingToday, setPendingToday] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
  const [pumpsAvailable, setPumpsAvailable] = useState(0)
  const [revenueMonth, setRevenueMonth] = useState(0)

  // Estados da lista de relatórios
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [recentReports, setRecentReports] = useState<RecentReportItem[] | null>(null)

  // Estados dos filtros
  const [companies, setCompanies] = useState<Company[]>([])
  const [pumps, setPumps] = useState<Pump[]>([])
  const [filters, setFilters] = useState({
    period: '',
    customDate: '',
    companyId: '',
    pumpId: ''
  })

  const todayIso = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])
  
  // Função para calcular datas baseadas no período selecionado
  const getDateRange = useMemo(() => {
    const now = new Date()
    
    switch (filters.period) {
      case 'hoje':
        return {
          start: todayIso,
          end: todayIso
        }
      case 'ontem': {
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayIso = format(yesterday, 'yyyy-MM-dd')
        return {
          start: yesterdayIso,
          end: yesterdayIso
        }
      }
      case 'ultimos-7-dias': {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return {
          start: format(weekAgo, 'yyyy-MM-dd'),
          end: todayIso
        }
      }
      case 'ultimos-30-dias': {
        const monthAgo = new Date(now)
        monthAgo.setDate(monthAgo.getDate() - 30)
        return {
          start: format(monthAgo, 'yyyy-MM-dd'),
          end: todayIso
        }
      }
      case 'personalizado': {
        return {
          start: filters.customDate,
          end: filters.customDate
        }
      }
      default: {
        // Padrão: mês atual
        const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
        const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0))
        return {
          start: format(start, 'yyyy-MM-dd'),
          end: format(end, 'yyyy-MM-dd')
        }
      }
    }
  }, [filters.period, filters.customDate, todayIso])

  async function fetchCompaniesAndPumps() {
    try {
      // Buscar empresas
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('name')

      if (companiesError) throw companiesError
      setCompanies(companiesData || [])

      // Buscar bombas
      const { data: pumpsData, error: pumpsError } = await supabase
        .from('pumps')
        .select('*')
        .order('prefix')

      if (pumpsError) throw pumpsError
      setPumps(pumpsData || [])
    } catch (err: any) {
      console.error('Erro ao buscar empresas e bombas:', err)
    }
  }

  async function fetchKpis(signal: AbortSignal) {
    setKpiLoading(true)
    setKpiError(null)
    try {
      // Relatórios pendentes hoje
      let pendingTodayQuery = supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'PENDENTE')
        .eq('date', todayIso)

      // Aplicar filtros
      if (filters.companyId) {
        pendingTodayQuery = pendingTodayQuery.eq('company_id', filters.companyId)
      }
      if (filters.pumpId) {
        pendingTodayQuery = pendingTodayQuery.eq('pump_id', filters.pumpId)
      }

      const pendingTodayRes = await pendingTodayQuery
      if (pendingTodayRes.error) throw pendingTodayRes.error
      if (signal.aborted) return
      setPendingToday(pendingTodayRes.count ?? 0)

      // Relatórios pendentes total
      let pendingTotalQuery = supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'PENDENTE')

      if (filters.companyId) {
        pendingTotalQuery = pendingTotalQuery.eq('company_id', filters.companyId)
      }
      if (filters.pumpId) {
        pendingTotalQuery = pendingTotalQuery.eq('pump_id', filters.pumpId)
      }

      const pendingTotalRes = await pendingTotalQuery
      if (pendingTotalRes.error) throw pendingTotalRes.error
      if (signal.aborted) return
      setPendingTotal(pendingTotalRes.count ?? 0)

      // Bombas disponíveis (corrigido para contar todas as bombas, não apenas disponíveis)
      let pumpsQuery = supabase
        .from('pumps')
        .select('id', { count: 'exact', head: true })

      if (filters.companyId) {
        pumpsQuery = pumpsQuery.eq('owner_company_id', filters.companyId)
      }

      const pumpsRes = await pumpsQuery
      if (pumpsRes.error) throw pumpsRes.error
      if (signal.aborted) return
      setPumpsAvailable(pumpsRes.count ?? 0)

      // Faturado no período
      let revenueQuery = supabase
        .from('reports')
        .select('total_value, date')
        .gte('date', getDateRange.start)
        .lte('date', getDateRange.end)

      if (filters.companyId) {
        revenueQuery = revenueQuery.eq('company_id', filters.companyId)
      }
      if (filters.pumpId) {
        revenueQuery = revenueQuery.eq('pump_id', filters.pumpId)
      }

      const revenueRes = await revenueQuery
      if (revenueRes.error) throw revenueRes.error
      const sum = (revenueRes.data as any[] | null)?.reduce((acc, cur) => acc + (Number(cur.total_value) || 0), 0) ?? 0
      if (signal.aborted) return
      setRevenueMonth(sum)
    } catch (err: any) {
      if (signal.aborted) return
      setKpiError(err?.message || 'Falha ao carregar KPIs')
    } finally {
      if (!signal.aborted) setKpiLoading(false)
    }
  }

  async function fetchRecent(signal: AbortSignal) {
    setListLoading(true)
    setListError(null)
    try {
      console.log('🔍 [DASHBOARD] Carregando últimos relatórios...')
      
      // 1. Carregar relatórios básicos
      const res = await supabase
        .from('reports')
        .select('id, report_number, date, client_rep_name, pump_prefix, realized_volume, total_value, status, whatsapp_digits, client_id, pump_id, company_id')
        .order('date', { ascending: false })
        .limit(5)

      if (res.error) throw res.error
      if (signal.aborted) return
      
      console.log('✅ [DASHBOARD] Relatórios básicos carregados:', res.data?.length || 0)
      
      if (res.data && res.data.length > 0) {
        console.log('🔍 [DASHBOARD] Enriquecendo dados com relacionamentos...')
        
        // 2. Enriquecer com dados dos clientes
        const clientIds = [...new Set(res.data.map(r => r.client_id).filter(Boolean))]
        console.log('🔍 [DASHBOARD] Client IDs únicos:', clientIds)
        
        const { data: clientsData } = await supabase
          .from('clients')
          .select('*')
          .in('id', clientIds)
        
        console.log('📊 [DASHBOARD] Clientes carregados:', clientsData)
        
        // 3. Enriquecer com dados das bombas
        const pumpIds = [...new Set(res.data.map(r => r.pump_id).filter(Boolean))]
        console.log('🔍 [DASHBOARD] Pump IDs únicos:', pumpIds)
        
        const { data: pumpsData } = await supabase
          .from('pumps')
          .select('*')
          .in('id', pumpIds)
        
        console.log('📊 [DASHBOARD] Bombas carregadas:', pumpsData)
        
        // 4. Enriquecer com dados das empresas
        const companyIds = [...new Set(res.data.map(r => r.company_id).filter(Boolean))]
        console.log('🔍 [DASHBOARD] Company IDs únicos:', companyIds)
        
        const { data: companiesData } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds)
        
        console.log('📊 [DASHBOARD] Empresas carregadas:', companiesData)
        
        // 5. Combinar os dados
        const enrichedReports = res.data.map(report => ({
          ...report,
          clients: clientsData?.find(c => c.id === report.client_id),
          pumps: pumpsData?.find(p => p.id === report.pump_id),
          companies: companiesData?.find(comp => comp.id === report.company_id)
        }))
        
        console.log('✅ [DASHBOARD] Dados enriquecidos com sucesso!')
        console.log('📊 [DASHBOARD] Primeiro relatório enriquecido:', enrichedReports[0])
        
        setRecentReports(enrichedReports as RecentReportItem[])
      } else {
        console.log('⚠️ [DASHBOARD] Nenhum relatório retornado!')
        setRecentReports([])
      }
    } catch (err: any) {
      if (signal.aborted) return
      console.error('❌ [DASHBOARD] Erro ao carregar relatórios:', err)
      setListError(err?.message || 'Falha ao carregar relatórios')
    } finally {
      if (!signal.aborted) setListLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchCompaniesAndPumps()
    fetchKpis(controller.signal)
    fetchRecent(controller.signal)
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchKpis(controller.signal)
    return () => controller.abort()
  }, [filters])

  function validateFilters() {
    // Validar período personalizado
    if (filters.period === 'personalizado' && !filters.customDate) {
      alert('Por favor, selecione uma data para o período personalizado.')
      return false
    }
    
    // Validar se a data personalizada não é futura
    if (filters.period === 'personalizado' && filters.customDate) {
      const selectedDate = new Date(filters.customDate)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // Final do dia atual
      
      if (selectedDate > today) {
        alert('A data selecionada não pode ser futura.')
        return false
      }
    }
    
    return true
  }

  function applyFilters() {
    if (!validateFilters()) {
      return
    }
    
    const controller = new AbortController()
    fetchKpis(controller.signal)
    return () => controller.abort()
  }

  function clearFilters() {
    setFilters({
      period: '',
      customDate: '',
      companyId: '',
      pumpId: ''
    })
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Dashboard
            </h2>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Período"
              options={[
                { value: 'hoje', label: 'Hoje' },
                { value: 'ontem', label: 'Ontem' },
                { value: 'ultimos-7-dias', label: 'Últimos 7 dias' },
                { value: 'ultimos-30-dias', label: 'Últimos 30 dias' },
                { value: 'personalizado', label: 'Personalizado' }
              ]}
              value={filters.period}
              onChange={(value) => setFilters(prev => ({ ...prev, period: value }))}
            />
            {filters.period === 'personalizado' && (
              <FormField
                label="Data"
                type="date"
                value={filters.customDate}
                onChange={(e) => setFilters(prev => ({ ...prev, customDate: e.target.value }))}
              />
            )}
            <Select
              label="Empresa"
              options={companies.map(company => ({
                value: company.id,
                label: company.name
              }))}
              value={filters.companyId}
              onChange={(value) => setFilters(prev => ({ ...prev, companyId: value }))}
            />
            <Select
              label="Bomba"
              options={pumps.map(pump => ({
                value: pump.id,
                label: (pump as any).prefix || pump.id
              }))}
              value={filters.pumpId}
              onChange={(value) => setFilters(prev => ({ ...prev, pumpId: value }))}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
            <Button onClick={applyFilters}>
              Aplicar Filtros
            </Button>
          </div>
        </div>

        {/* KPIs */}
        {kpiError ? (
          <GenericError title="Erro ao carregar KPIs" message={kpiError} onRetry={() => {
            const controller = new AbortController()
            fetchKpis(controller.signal)
          }} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Relatórios pendentes hoje"
              value={pendingToday}
              loading={kpiLoading}
              icon={
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              }
            />
            <KpiCard
              title="Relatórios pendentes (total)"
              value={pendingTotal}
              loading={kpiLoading}
              icon={
                <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              }
            />
            <KpiCard
              title="Total de Bombas"
              value={pumpsAvailable}
              loading={kpiLoading}
              icon={
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              }
            />
            <KpiCard
              title="Faturado no período"
              value={formatCurrency(revenueMonth)}
              loading={kpiLoading}
              icon={
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              }
            />
          </div>
        )}

        {/* Últimos relatórios */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Últimos 5 relatórios</h3>
              <Link to="/reports">
                <Button variant="outline">Ver todos</Button>
              </Link>
            </div>
            {listError ? (
              <GenericError title="Erro ao carregar relatórios" message={listError} onRetry={() => {
                const controller = new AbortController()
                fetchRecent(controller.signal)
              }} />
            ) : listLoading ? (
              <div className="animate-pulse h-24 bg-gray-100 rounded" />
            ) : (
              <RecentReportsList reports={recentReports ?? []} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
