import { useEffect, useState } from 'react'
import { Layout } from '../../components/Layout'
import { Table } from '../../components/Table'
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { GenericError } from '../errors/GenericError'
import { Colaborador, COLABORADOR_FUNCOES, TIPOS_CONTRATO, getCorFuncao, getCorTipoContrato, formatarSalario } from '../../types/colaboradores'

type ColaboradorRow = Colaborador & {
  equipamento_prefix?: string
}

const PAGE_SIZE = 20

const FUNCAO_OPTIONS = [
  { value: '', label: 'Todas as funções' },
  ...COLABORADOR_FUNCOES.map(funcao => ({
    value: funcao.value,
    label: funcao.label
  }))
]

const TIPO_CONTRATO_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  ...TIPOS_CONTRATO.map(tipo => ({
    value: tipo.value,
    label: tipo.label
  }))
]

export default function Colaboradores() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [colaboradores, setColaboradores] = useState<ColaboradorRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [funcaoFilter, setFuncaoFilter] = useState('')
  const [tipoContratoFilter, setTipoContratoFilter] = useState('')
  const [registradoFilter, setRegistradoFilter] = useState('')

  // debounce 350ms
  const timer = setTimeout(() => {
    setDebounced(query.trim())
  }, 350)

  useEffect(() => {
    return () => clearTimeout(timer)
  }, [query])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  async function fetchData(signal: AbortSignal) {
    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('colaboradores')
        .select(`
          *,
          equipamento_vinculado:pumps(prefix)
        `, { count: 'exact' })
        .order('nome')
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      if (debounced) {
        q = q.ilike('nome', `%${debounced}%`)
      }

      if (funcaoFilter) {
        q = q.eq('funcao', funcaoFilter)
      }

      if (tipoContratoFilter) {
        q = q.eq('tipo_contrato', tipoContratoFilter)
      }

      if (registradoFilter !== '') {
        q = q.eq('registrado', registradoFilter === 'true')
      }

      const { data, error, count } = await q
      if (error) throw error
      if (signal.aborted) return

      const colaboradoresWithPrefix = (data || []).map(colaborador => ({
        ...colaborador,
        equipamento_prefix: colaborador.equipamento_vinculado?.prefix
      }))

      setColaboradores(colaboradoresWithPrefix)
      setTotalCount(count || 0)
    } catch (err: any) {
      if (signal.aborted) return
      console.error('Fetch colaboradores error:', { message: err?.message, page, debounced })
      setError(err?.message || 'Falha ao carregar colaboradores')
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchData(controller.signal)
    return () => controller.abort()
  }, [debounced, page, funcaoFilter, tipoContratoFilter, registradoFilter])

  function exportCsv() {
    const headers = ['nome', 'funcao', 'tipo_contrato', 'salario_fixo', 'registrado', 'vale_transporte']
    const rows = colaboradores.map((c) => [
      c.nome,
      c.funcao,
      c.tipo_contrato,
      c.salario_fixo.toString(),
      c.registrado ? 'Sim' : 'Não',
      c.vale_transporte ? 'Sim' : 'Não'
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `colaboradores_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <GenericError title="Erro ao carregar colaboradores" message={error} onRetry={() => {
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
            <h2 className="text-lg font-semibold text-gray-900">Colaboradores</h2>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={exportCsv}>Exportar CSV</Button>
              <Link to="/colaboradores/new">
                <Button size="sm" className="bg-[#2663eb] text-white hover:bg-[#1e4fd1]">+ Novo Colaborador</Button>
              </Link>
            </div>
          </div>

          {/* Campo de Busca */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Buscar</h3>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buscar por nome..."
              value={query}
              onChange={(e) => { setPage(1); setQuery(e.target.value) }}
            />
          </div>

          {/* Filtros */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Função"
                options={FUNCAO_OPTIONS}
                value={funcaoFilter}
                onChange={(value) => { setPage(1); setFuncaoFilter(value) }}
              />
              
              <Select
                label="Tipo de Contrato"
                options={TIPO_CONTRATO_OPTIONS}
                value={tipoContratoFilter}
                onChange={(value) => { setPage(1); setTipoContratoFilter(value) }}
              />
              
              <Select
                label="Status"
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'true', label: 'Registrado' },
                  { value: 'false', label: 'Não Registrado' }
                ]}
                value={registradoFilter}
                onChange={(value) => { setPage(1); setRegistradoFilter(value) }}
              />
            </div>
          </div>

          {/* Results Summary */}
          {!loading && (
            <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
              <div>
                {debounced ? (
                  <span>
                    Mostrando <strong>{colaboradores.length}</strong> colaborador(es) para "{debounced}"
                  </span>
                ) : (
                  <span>
                    Total de <strong>{totalCount}</strong> colaborador(es)
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
                    NOME
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    FUNÇÃO
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    CONTRATO
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    SALÁRIO
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    EQUIPAMENTO
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
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : colaboradores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      {debounced ? 'Nenhum colaborador encontrado para o filtro.' : 'Nenhum colaborador cadastrado.'}
                    </td>
                  </tr>
                ) : (
                  colaboradores.map((colaborador) => (
                    <tr key={colaborador.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="text-xs">
                          <div className="font-semibold text-gray-900 truncate">{colaborador.nome || '-'}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCorFuncao(colaborador.funcao as any)}`}>
                          {colaborador.funcao}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCorTipoContrato(colaborador.tipo_contrato as any)}`}>
                          {colaborador.tipo_contrato}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900 text-right text-xs">
                          {formatarSalario(colaborador.salario_fixo)}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs">
                          {colaborador.equipamento_prefix ? (
                            <span className="text-blue-600 font-medium">{colaborador.equipamento_prefix}</span>
                          ) : (
                            <span className="text-gray-400">Não vinculado</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          {colaborador.registrado && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 w-fit">
                              Registrado
                            </span>
                          )}
                          {colaborador.vale_transporte && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 w-fit">
                              Vale Transporte
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/colaboradores/${colaborador.id}`)}
                            className="px-2 py-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded text-xs font-medium"
                          >
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/colaboradores/${colaborador.id}/edit`)}
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
