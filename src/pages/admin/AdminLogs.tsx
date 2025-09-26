import React, { useState, useEffect } from 'react'
import { AdminAPI, type AuditLogFilters } from '../../lib/admin-api'
import { Button } from '../../components/Button'
import { formatDate } from '../../utils/format'

interface AdminLogsProps {
  onNavigate: (page: string) => void
}

interface AuditLog {
  id: string
  user_id: string | null
  user_email: string | null
  action: string
  resource_type: string
  resource_id: string | null
  old_values: any | null
  new_values: any | null
  ip_address: string | null
  user_agent: string | null
  metadata: any
  created_at: string
}

export const AdminLogs: React.FC<AdminLogsProps> = ({ onNavigate }) => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<AuditLogFilters>({
    action: '',
    resource_type: '',
    date_from: '',
    date_to: '',
    limit: 50
  })
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const limit = 50

  useEffect(() => {
    loadLogs()
  }, [currentPage, filters])

  const loadLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const offset = (currentPage - 1) * limit
      const { logs: logsData, total: totalCount } = await AdminAPI.getAuditLogs({
        ...filters,
        limit,
        offset
      })
      
      setLogs(logsData)
      setTotal(totalCount)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
      setError('Erro ao carregar logs de auditoria')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      action: '',
      resource_type: '',
      date_from: '',
      date_to: '',
      limit: 50
    })
    setCurrentPage(1)
  }

  const openDetailModal = (log: AuditLog) => {
    setSelectedLog(log)
    setDetailModalOpen(true)
  }

  const closeDetailModal = () => {
    setDetailModalOpen(false)
    setSelectedLog(null)
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800'
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800'
      case 'BAN_USER':
        return 'bg-red-100 text-red-800'
      case 'UNBAN_USER':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const totalPages = Math.ceil(total / limit)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Logs de Auditoria</h1>
              <p className="text-gray-600 mt-2">Visualize todas as atividades e alterações do sistema</p>
            </div>
            <Button onClick={() => onNavigate('dashboard')} variant="outline">
              ← Voltar ao Dashboard
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ação</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as ações</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="BAN_USER">BAN_USER</option>
                <option value="UNBAN_USER">UNBAN_USER</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Recurso</label>
              <select
                value={filters.resource_type}
                onChange={(e) => handleFilterChange('resource_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os tipos</option>
                <option value="user">user</option>
                <option value="report">report</option>
                <option value="client">client</option>
                <option value="pump">pump</option>
                <option value="programacao">programacao</option>
                <option value="nota_fiscal">nota_fiscal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Logs</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Criações</p>
                <p className="text-2xl font-bold text-gray-900">{logs.filter(log => log.action === 'CREATE').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Atualizações</p>
                <p className="text-2xl font-bold text-gray-900">{logs.filter(log => log.action === 'UPDATE').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Exclusões</p>
                <p className="text-2xl font-bold text-gray-900">{logs.filter(log => log.action === 'DELETE').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Logs de Auditoria</h2>
          </div>
          
          {error ? (
            <div className="p-6 text-center">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadLogs} variant="primary">
                Tentar Novamente
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recurso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.user_email || 'Sistema'}
                        </div>
                        {log.user_id && (
                          <div className="text-sm text-gray-500">ID: {log.user_id}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.resource_type}</div>
                        {log.resource_id && (
                          <div className="text-sm text-gray-500">ID: {log.resource_id}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => openDetailModal(log)}
                          variant="outline"
                          size="sm"
                        >
                          Ver Detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {((currentPage - 1) * limit) + 1} a {Math.min(currentPage * limit, total)} de {total} logs
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Anterior
                  </Button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {detailModalOpen && selectedLog && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Detalhes do Log</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Informações Básicas</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>ID:</strong> {selectedLog.id}</div>
                      <div><strong>Data/Hora:</strong> {formatDate(selectedLog.created_at)}</div>
                      <div><strong>Ação:</strong> 
                        <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(selectedLog.action)}`}>
                          {selectedLog.action}
                        </span>
                      </div>
                      <div><strong>Tipo de Recurso:</strong> {selectedLog.resource_type}</div>
                      {selectedLog.resource_id && (
                        <div><strong>ID do Recurso:</strong> {selectedLog.resource_id}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Usuário</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Email:</strong> {selectedLog.user_email || 'Sistema'}</div>
                      {selectedLog.user_id && (
                        <div><strong>ID do Usuário:</strong> {selectedLog.user_id}</div>
                      )}
                      {selectedLog.ip_address && (
                        <div><strong>IP:</strong> {selectedLog.ip_address}</div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedLog.old_values && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Valores Anteriores</h4>
                    <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_values && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Novos Valores</h4>
                    <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Metadados</h4>
                    <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <Button onClick={closeDetailModal} variant="outline">
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
