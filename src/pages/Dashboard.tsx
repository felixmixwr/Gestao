import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { DashboardCard } from '../components/DashboardCard'
import { NextBombaCard } from '../components/NextBombaCard'
import { StatusCard } from '../components/StatusCard'
import { Link } from 'react-router-dom'
import { DashboardApi, DashboardStats } from '../lib/dashboard-api'
import { GenericError } from './errors/GenericError'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  // Função para carregar estatísticas
  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await DashboardApi.getStats()
      setStats(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Visão geral das operações e métricas principais
            </p>
          </div>
        </div>

        {/* Próxima Bomba - Card especial */}
        {!error && (
          <div className="mb-6">
            <NextBombaCard 
              proximaBomba={stats?.proxima_bomba || null} 
              loading={loading} 
            />
          </div>
        )}

        {/* Cards de Métricas */}
        {error ? (
          <GenericError 
            title="Erro ao carregar dashboard" 
            message={error} 
            onRetry={loadStats} 
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Programação de hoje */}
            <DashboardCard
              title="Programação Hoje"
              value={stats?.programacao_hoje.length || 0}
              subtitle="bombas programadas"
              color="blue"
              loading={loading}
              linkTo="/programacao"
              actionText="Ver programação"
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              }
            />

            {/* Programação de amanhã */}
            <DashboardCard
              title="Programação Amanhã"
              value={stats?.programacao_amanha.length || 0}
              subtitle="bombas programadas"
              color="blue"
              loading={loading}
              linkTo="/programacao"
              actionText="Ver programação"
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              }
            />

            {/* Volume previsto do dia */}
            <DashboardCard
              title="Volume Previsto Bombeado"
              value={`${stats?.volume_previsto_dia || 0} m³`}
              subtitle="volume previsto para hoje"
              color="green"
              loading={loading}
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              }
            />

            {/* Volume bombeado da semana */}
            <DashboardCard
              title="Volume Bombeado na Semana"
              value={`${stats?.volume_bombeado_semana || 0} m³`}
              subtitle="volume total da semana"
              color="blue"
              loading={loading}
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              }
            />

            {/* Faturamento do dia */}
            <DashboardCard
              title="Faturamento Hoje"
              value={formatCurrency(stats?.faturamento_dia || 0)}
              subtitle="receita do dia"
              color="green"
              loading={loading}
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              }
            />

            {/* Faturamento do mês */}
            <DashboardCard
              title="Faturamento Mês"
              value={formatCurrency(stats?.faturamento_mes || 0)}
              subtitle="receita acumulada"
              color="green"
              loading={loading}
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              }
            />

            {/* Colaboradores ativos */}
            <DashboardCard
              title="Colaboradores"
              value={stats?.colaboradores || 0}
              subtitle="funcionários ativos"
              color="gray"
              loading={loading}
              linkTo="/colaboradores"
              actionText="Ver colaboradores"
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              }
            />

            {/* Clientes ativos */}
            <DashboardCard
              title="Clientes"
              value={stats?.clientes || 0}
              subtitle="clientes cadastrados"
              color="blue"
              loading={loading}
              linkTo="/clients"
              actionText="Ver clientes"
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              }
            />

            {/* Relatórios emitidos */}
            <DashboardCard
              title="Relatórios"
              value={`${stats?.relatorios.dia || 0} hoje`}
              subtitle={`${stats?.relatorios.mes || 0} no mês`}
              color="orange"
              loading={loading}
              linkTo="/reports"
              actionText="Ver relatórios"
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              }
            />

            {/* Notas fiscais */}
            <DashboardCard
              title="Notas Fiscais"
              value={stats?.notas.quantidade || 0}
              subtitle={formatCurrency(stats?.notas.valor_total || 0)}
              color="purple"
              loading={loading}
              linkTo="/notes"
              actionText="Ver notas"
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                </svg>
              }
            />

            {/* Financeiro */}
            <DashboardCard
              title="Financeiro"
              value={formatCurrency(stats?.financeiro?.entradas || 0)}
              subtitle={`Saídas: ${formatCurrency(stats?.financeiro?.saidas || 0)}`}
              color="green"
              loading={loading}
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              }
            />
          </div>
        )}

        {/* Cards de Status dos Relatórios */}
        {!error && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Relatórios por Status
              </h3>
              <Link to="/reports">
                <span className="text-sm text-blue-600 hover:text-blue-800">
                  Ver todos os relatórios →
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {loading ? (
                // Skeleton loading para os cards de status
                Array.from({ length: 7 }).map((_, index) => (
                  <div key={index} className="p-6 rounded-lg border-2 border-gray-200 bg-gray-50 animate-pulse">
                    <div className="absolute top-4 right-4">
                      <div className="w-8 h-8 bg-gray-300 rounded" />
                    </div>
                    <div className="pr-12">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
                      <div className="h-8 bg-gray-300 rounded w-1/2 mb-1" />
                      <div className="h-3 bg-gray-300 rounded w-1/3" />
                    </div>
                  </div>
                ))
              ) : (
                stats?.relatorios_por_status?.map((statusData) => (
                  <StatusCard
                    key={statusData.status}
                    status={statusData.status}
                    quantidade={statusData.quantidade}
                    valor_total={statusData.valor_total}
                    loading={loading}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Programação de hoje - detalhes */}
        {stats?.programacao_hoje && stats.programacao_hoje.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Programação de Hoje
                </h3>
                <Link to="/programacao">
                  <span className="text-sm text-blue-600 hover:text-blue-800">
                    Ver programação completa →
                  </span>
                </Link>
              </div>
              <div className="space-y-3">
                {stats.programacao_hoje.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.endereco}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>👤 {item.responsavel}</span>
                          {item.bomba_prefix && (
                            <span>🚛 {item.bomba_prefix}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 ml-2">
                      {item.hora}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Programação de amanhã - detalhes */}
        {stats?.programacao_amanha && stats.programacao_amanha.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Programação de Amanhã
                </h3>
                <Link to="/programacao">
                  <span className="text-sm text-blue-600 hover:text-blue-800">
                    Ver programação completa →
                  </span>
                </Link>
              </div>
              <div className="space-y-3">
                {stats.programacao_amanha.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.endereco}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>👤 {item.responsavel}</span>
                          {item.bomba_prefix && (
                            <span>🚛 {item.bomba_prefix}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 ml-2">
                      {item.hora}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Próximas Despesas */}
        {stats?.financeiro?.proximas_despesas && stats.financeiro.proximas_despesas.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Próximas Despesas
                </h3>
                <Link to="/financial">
                  <span className="text-sm text-blue-600 hover:text-blue-800">
                    Ver módulo financeiro →
                  </span>
                </Link>
              </div>
              <div className="space-y-3">
                {stats.financeiro.proximas_despesas.map((despesa, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{despesa.descricao}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>📅 {despesa.data_vencimento}</span>
                          <span>🏷️ {despesa.categoria}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-red-600 ml-2">
                      {formatCurrency(despesa.valor)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
