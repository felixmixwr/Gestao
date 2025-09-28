import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { supabase } from '../../lib/supabase'
import { GenericError } from '../errors/GenericError'
import { format } from 'date-fns'
import { Badge } from '../../components/Badge'
import { useAuth } from '../../lib/auth-hooks'

type Client = {
  id: string
  rep_name?: string | null
  company_name?: string | null
  legal_name?: string | null
  document?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  cep?: string | null
  notes?: string | null
}

type Report = {
  id: string
  report_number: string
  date: string
  pump_prefix: string | null
  realized_volume: number | null
  total_value: number | null
  status: 'PENDENTE' | 'CONFIRMADO' | 'PAGO' | 'NOTA_EMITIDA'
}

function currency(v: number | null | undefined) {
  const n = Number(v || 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

export default function ClientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [reports, setReports] = useState<Report[]>([])

  const canSeeRevenue = useMemo(() => {
    const role = (user?.user_metadata as any)?.role
    return role === 'admin' || role === 'financeiro'
  }, [user])

  async function fetchAll(signal: AbortSignal) {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const clientRes = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (clientRes.error) throw clientRes.error
      if (signal.aborted) return
      setClient(clientRes.data as unknown as Client)

      const reportsRes = await supabase
        .from('reports')
        .select('id, report_number, date, pump_prefix, realized_volume, total_value, status')
        .eq('client_id', id)
        .order('date', { ascending: false })

      if (reportsRes.error) throw reportsRes.error
      if (signal.aborted) return
      setReports((reportsRes.data as unknown as Report[]) || [])
    } catch (err: any) {
      if (signal.aborted) return
      console.error('Fetch client details error:', { message: err?.message, id })
      setError(err?.message || 'Falha ao carregar cliente')
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchAll(controller.signal)
    return () => controller.abort()
  }, [id])

  const totalFaturado = useMemo(() => {
    return reports.reduce((acc, r) => acc + (Number(r.total_value) || 0), 0)
  }, [reports])

  function whatsappLink() {
    const digits = (client?.phone || '').replace(/\D/g, '')
    if (!digits) return null
    const text = `Olá ${client?.rep_name || ''}! Aqui é da Felix Mix. Estamos revisando seus relatórios. Qualquer dúvida, estamos à disposição.`
    return `https://wa.me/55${digits}?text=${encodeURIComponent(text)}`
  }

  if (error) {
    return (
      <GenericError title="Erro ao carregar cliente" message={error} onRetry={() => {
        const controller = new AbortController()
        fetchAll(controller.signal)
      }} />
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Detalhes do Cliente</h2>
          <div className="flex gap-3">
            {whatsappLink() && (
              <a href={whatsappLink()!} target="_blank" rel="noreferrer">
                <Button variant="outline">Entrar em contato (WhatsApp)</Button>
              </a>
            )}
            <Link to={`/clients/${id}/edit`}><Button variant="outline">Editar</Button></Link>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="animate-pulse h-24 bg-gray-100 rounded" />
          ) : client ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Representante:</span> <span className="ml-2">{client.rep_name || '-'}</span></div>
              <div><span className="text-gray-500">Empresa:</span> <span className="ml-2">{client.company_name || '-'}</span></div>
              <div><span className="text-gray-500">Razão Social:</span> <span className="ml-2">{client.legal_name || '-'}</span></div>
              <div><span className="text-gray-500">Documento:</span> <span className="ml-2">{client.document || '-'}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="ml-2">{client.email || '-'}</span></div>
              <div><span className="text-gray-500">Telefone:</span> <span className="ml-2">{client.phone || '-'}</span></div>
              <div><span className="text-gray-500">Endereço:</span> <span className="ml-2">{client.address || '-'}</span></div>
              <div><span className="text-gray-500">Cidade/UF:</span> <span className="ml-2">{client.city || '-'} / {client.state || '-'}</span></div>
              <div><span className="text-gray-500">CEP:</span> <span className="ml-2">{client.cep || '-'}</span></div>
              <div className="sm:col-span-2"><span className="text-gray-500">Notas:</span> <span className="ml-2">{client.notes || '-'}</span></div>
            </div>
          ) : (
            <div>Nenhum cliente encontrado.</div>
          )}
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card lg:col-span-1">
            <h3 className="text-lg font-semibold mb-2">Métricas</h3>
            {canSeeRevenue ? (
              <div className="text-sm">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Total faturado</span>
                  <span className="font-semibold">{currency(totalFaturado)}</span>
                </div>
                <div className="py-2 text-gray-500 text-xs">Somatório de total_value dos relatórios do cliente.</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Sem permissão para visualizar faturamento.</div>
            )}
          </div>

          <div className="card lg:col-span-2">
            <h3 className="text-lg font-semibold mb-2">Obras realizadas</h3>
            {loading ? (
              <div className="animate-pulse h-24 bg-gray-100 rounded" />
            ) : reports.length === 0 ? (
              <div className="text-gray-500">Nenhum relatório encontrado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nº</th>
                      <th>Data</th>
                      <th>Bomba</th>
                      <th>Volume</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id}>
                        <td>{r.report_number}</td>
                        <td>{format(new Date(r.date), 'dd/MM/yyyy')}</td>
                        <td>{r.pump_prefix ?? '-'}</td>
                        <td>{r.realized_volume ?? '-'}</td>
                        <td>{currency(r.total_value)}</td>
                        <td>
                          <Badge variant={r.status === 'PAGO' ? 'success' : r.status === 'CONFIRMADO' ? 'warning' : r.status === 'PENDENTE' ? 'danger' : 'info'} size="sm">{r.status}</Badge>
                        </td>
                        <td>
                          <Link to={`/reports/${r.id}`}><Button variant="outline">Ver</Button></Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          <Button variant="outline" onClick={() => navigate('/clients')}>Voltar</Button>
        </div>
      </div>
    </Layout>
  )
}




