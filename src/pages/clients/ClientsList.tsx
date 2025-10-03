import { useEffect, useMemo, useRef, useState } from 'react'
import { Layout } from '../../components/Layout'
import { Table } from '../../components/Table'
import { Button } from '../../components/Button'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { GenericError } from '../errors/GenericError'

type ClientRow = {
  id: string
  rep_name?: string | null
  company_name?: string | null
  phone?: string | null
  email?: string | null
}

const PAGE_SIZE = 20

export default function ClientsList() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<ClientRow[]>([])
  const [totalCount, setTotalCount] = useState(0)

  // debounce 350ms
  const timer = useRef<number | null>(null)
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDebounced(query.trim()), 350)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [query])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), [totalCount])

  function formatPhone(value?: string | null) {
    const digits = (value || '').replace(/\D/g, '')
    if (digits.length === 11) {
      return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`
    }
    if (digits.length === 10) {
      return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6,10)}`
    }
    return value || '-'
  }

  function formatEmail(value?: string | null) {
    if (!value) return '-'
    return value
  }

  function getClientStatusBadge(client: ClientRow) {
    const hasContact = client.phone || client.email
    if (hasContact) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Contato Completo
        </span>
      )
    }
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
        Contato Incompleto
      </span>
    )
  }

  async function fetchData(signal: AbortSignal) {
    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      if (debounced) {
        // Busca por rep_name OU company_name
        q = q.or(`rep_name.ilike.%${debounced}%,company_name.ilike.%${debounced}%`)
      }

      const { data, error, count } = await q
      if (error) throw error
      if (signal.aborted) return
      setClients((data as unknown as ClientRow[]) || [])
      setTotalCount(count || 0)
    } catch (err: any) {
      if (signal.aborted) return
      console.error('Fetch clients error:', { message: err?.message, page, debounced })
      setError(err?.message || 'Falha ao carregar clientes')
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchData(controller.signal)
    return () => controller.abort()
  }, [debounced, page])

  function exportCsv() {
    const headers = ['rep_name', 'company_name', 'phone', 'email']
    const rows = clients.map((c) => [c.rep_name ?? '', c.company_name ?? '', c.phone ?? '', c.email ?? ''])
    const csv = [headers.join(','), ...rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clientes_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <GenericError title="Erro ao carregar clientes" message={error} onRetry={() => {
        const controller = new AbortController()
        fetchData(controller.signal)
      }} />
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 -mx-6">
          {/* Header do Card */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Clientes</h2>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={exportCsv}>Exportar CSV</Button>
              <Link to="/clients/new">
                <Button size="sm" className="bg-[#2663eb] text-white hover:bg-[#1e4fd1]">+ Novo Cliente</Button>
              </Link>
            </div>
          </div>

          {/* Campo de Busca */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Buscar</h3>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buscar por representante ou empresa..."
              value={query}
              onChange={(e) => { setPage(1); setQuery(e.target.value) }}
            />
          </div>

          {/* Results Summary */}
          {!loading && (
            <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
              <div>
                {debounced ? (
                  <span>
                    Mostrando <strong>{clients.length}</strong> cliente(s) para "{debounced}"
                  </span>
                ) : (
                  <span>
                    Total de <strong>{totalCount}</strong> cliente(s)
                  </span>
                )}
              </div>
              <div>
                Página {page} de {totalPages}
              </div>
            </div>
          )}

          {/* Tabela */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    REPRESENTANTE
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    EMPRESA
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    TELEFONE
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    EMAIL
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    STATUS
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    AÇÕES
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {debounced ? 'Nenhum cliente encontrado para o filtro.' : 'Nenhum cliente cadastrado.'}
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="text-xs">
                          <div className="font-semibold text-gray-900 truncate">{client.rep_name || '-'}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs">
                          <div className="font-semibold text-gray-900 truncate">{client.company_name || '-'}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-gray-600 text-xs">
                          {formatPhone(client.phone)}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-gray-600 truncate text-xs" title={client.email || ''}>
                          {formatEmail(client.email)}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {getClientStatusBadge(client)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/clients/${client.id}`)}
                            className="px-2 py-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded text-xs font-medium"
                          >
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/clients/${client.id}/edit`)}
                            className="px-2 py-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded text-xs font-medium"
                          >
                            Editar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
