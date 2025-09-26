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
          <div className="overflow-x-auto -mx-6 px-6">
            <Table<ColaboradorRow>
              data={colaboradores}
              loading={loading}
              emptyMessage={debounced ? 'Nenhum colaborador encontrado para o filtro.' : 'Nenhum colaborador cadastrado.'}
            columns={[
              { 
                key: 'nome', 
                label: 'Nome', 
                className: 'w-[200px]',
                render: (v) => (
                  <div className="font-medium text-gray-900 truncate" title={v as string}>
                    {v ?? '-'}
                  </div>
                )
              },
              { 
                key: 'funcao', 
                label: 'Função', 
                className: 'w-[150px]',
                render: (v) => (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCorFuncao(v as any)}`}>
                    {v}
                  </span>
                )
              },
              { 
                key: 'tipo_contrato', 
                label: 'Contrato', 
                className: 'w-[90px]',
                render: (v) => (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCorTipoContrato(v as any)}`}>
                    {v}
                  </span>
                )
              },
              { 
                key: 'salario_fixo', 
                label: 'Salário', 
                className: 'w-[110px]',
                render: (v) => (
                  <div className="font-medium text-gray-900 text-right">
                    {formatarSalario(v as number)}
                  </div>
                )
              },
              { 
                key: 'equipamento_prefix', 
                label: 'Equipamento', 
                className: 'w-[110px]',
                render: (v) => v ? (
                  <span className="text-blue-600 font-medium">{v}</span>
                ) : (
                  <span className="text-gray-400">Não vinculado</span>
                )
              },
              { 
                key: 'registrado', 
                label: 'Status', 
                className: 'w-[130px]',
                render: (_v, item) => (
                  <div className="flex flex-col gap-1">
                    {item.registrado && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 w-fit">
                        Registrado
                      </span>
                    )}
                    {item.vale_transporte && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 w-fit">
                        Vale Transporte
                      </span>
                    )}
                  </div>
                )
              },
              { 
                key: 'id', 
                label: 'Ações', 
                className: 'w-[160px]',
                render: (_v, item) => (
                  <div className="flex gap-1 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs px-2 py-1"
                      onClick={(e) => { e.stopPropagation(); navigate(`/colaboradores/${item.id}`) }}
                    >
                      Ver
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs px-2 py-1"
                      onClick={(e) => { e.stopPropagation(); navigate(`/colaboradores/${item.id}/edit`) }}
                    >
                      Editar
                    </Button>
                  </div>
                )
              }
            ]}
            />
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
