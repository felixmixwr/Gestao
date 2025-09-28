import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDateBR } from '../../utils/formatters'
import { Database } from '../../lib/supabase'

type Pump = Database['public']['Tables']['pumps']['Row'] & {
  company_name?: string
}

type Report = Database['public']['Tables']['reports']['Row'] & {
  client_name?: string
  total_value?: number
  clients?: {
    rep_name?: string
    company_name?: string
  }
}

export default function PumpDetails() {
  const { id } = useParams<{ id: string }>()
  const [pump, setPump] = useState<Pump | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchPumpDetails() {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      // Buscar dados da bomba
      const { data: pumpData, error: pumpError } = await supabase
        .from('pumps')
        .select(`
          *,
          companies!pumps_owner_company_id_fkey(name)
        `)
        .eq('id', id)
        .single()

      if (pumpError) throw pumpError

      // Buscar relatórios que usaram esta bomba
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          *,
          clients(rep_name, company_name)
        `)
        .eq('pump_id', id)
        .order('created_at', { ascending: false })

      if (reportsError) throw reportsError

      // Transformar dados
      const pumpWithCompany = {
        ...pumpData,
        company_name: pumpData.companies?.name
      }

      const reportsWithClient = (reportsData || []).map(report => ({
        ...report,
        client_name: report.clients?.rep_name || report.clients?.company_name || 'Cliente não informado',
        total_value: report.total_hours * 50 // Valor fixo por hora para exemplo
      }))

      setPump(pumpWithCompany)
      setReports(reportsWithClient)
    } catch (err: any) {
      console.error('Erro ao buscar detalhes da bomba:', err)
      setError(err?.message || 'Erro ao carregar dados da bomba')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPumpDetails()
  }, [id])

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
        title="Erro ao carregar bomba" 
        message={error} 
        onRetry={fetchPumpDetails} 
      />
    )
  }

  if (!pump) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Bomba não encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            A bomba que você está procurando não existe ou foi removida.
          </p>
          <div className="mt-6">
            <Link to="/pumps">
              <Button>Voltar para lista de bombas</Button>
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Disponível':
        return 'success'
      case 'Em Uso':
        return 'warning'
      case 'Em Manutenção':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getStatusBannerColor = (status: string) => {
    switch (status) {
      case 'Em Uso':
        return 'bg-yellow-50 border-yellow-200'
      case 'Em Manutenção':
        return 'bg-red-50 border-red-200'
      default:
        return ''
    }
  }

  const showStatusBanner = pump.status === 'Em Uso' || pump.status === 'Em Manutenção'

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {pump.prefix}
            </h2>
            <p className="mt-1 text-sm text-gray-600">{pump.model || 'Modelo não informado'}</p>
          </div>
          <div className="mt-4 flex gap-3 md:ml-4 md:mt-0">
            <Link to="/pumps">
              <Button variant="outline">Voltar</Button>
            </Link>
            <Link to={`/pumps/${pump.id}/edit`}>
              <Button>Editar</Button>
            </Link>
          </div>
        </div>

        {/* Status Banner */}
        {showStatusBanner && (
          <div className={`rounded-lg border p-4 ${getStatusBannerColor(pump.status)}`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {pump.status === 'Em Uso' ? (
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">
                  {pump.status === 'Em Uso' ? 'Bomba em uso' : 'Bomba em manutenção'}
                </h3>
                <p className="text-sm">
                  {pump.status === 'Em Uso' 
                    ? 'Esta bomba está atualmente sendo utilizada em um trabalho.'
                    : 'Esta bomba está em manutenção e não está disponível para uso.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Informações da Bomba */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Bomba</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Prefixo</label>
                <p className="mt-1 text-sm text-gray-900">{pump.prefix}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Modelo</label>
                <p className="mt-1 text-sm text-gray-900">{pump.model || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Tipo</label>
                <p className="mt-1 text-sm text-gray-900">{pump.pump_type || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Marca</label>
                <p className="mt-1 text-sm text-gray-900">{pump.brand || '-'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Capacidade</label>
                <p className="mt-1 text-sm text-gray-900">
                  {pump.capacity_m3h ? `${pump.capacity_m3h} m³/h` : '-'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Ano</label>
                <p className="mt-1 text-sm text-gray-900">{pump.year || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(pump.status)} size="sm">
                    {pump.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Empresa Proprietária</label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {pump.company_name === 'FELIX MIX' ? 'FELIX MIX' : 
                   pump.company_name === 'WORLDPAV' ? 'WORLDPAV' : 
                   pump.company_name || '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-500">Total Faturado</label>
                <p className="mt-1 text-2xl font-bold text-green-600">
                  {formatCurrency(pump.total_billed)}
                </p>
              </div>
            </div>
          </div>

          {pump.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-500">Observações</label>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{pump.notes}</p>
            </div>
          )}
        </div>

        {/* Relatórios */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Relatórios</h3>
            <Link to="/reports/new">
              <Button size="sm" className="bg-[#2663eb] text-white hover:bg-[#1e4fd1]">+ Novo Relatório</Button>
            </Link>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum relatório encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Esta bomba ainda não foi utilizada em nenhum relatório.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Relatório
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.report_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.client_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateBR(report.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.realized_volume || 0}m³
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(report.total_value || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.created_at ? formatDateBR(report.created_at) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
