import { Link } from 'react-router-dom'
import { Badge } from './Badge'
import { format } from 'date-fns'

export interface RecentReportItem {
  id: string
  report_number: string
  date: string
  client_rep_name: string | null
  pump_prefix: string | null
  realized_volume: number | null
  total_value: number | null
  status: 'PENDENTE' | 'CONFIRMADO' | 'PAGO' | 'NOTA_EMITIDA'
  whatsapp_digits?: string | null
  client_id?: string | null
  pump_id?: string | null
  company_id?: string | null
  clients?: {
    id: string
    name: string
    email: string | null
    phone: string | null
    company_name: string | null
  }
  pumps?: {
    id: string
    prefix: string
    model: string | null
    brand: string | null
  }
  companies?: {
    id: string
    name: string
  }
}

function statusToVariant(status: RecentReportItem['status']) {
  switch (status) {
    case 'PENDENTE':
      return 'danger' as const
    case 'CONFIRMADO':
      return 'warning' as const
    case 'PAGO':
      return 'success' as const
    case 'NOTA_EMITIDA':
      return 'info' as const
    default:
      return 'default' as const
  }
}

function formatCurrency(value: number | null | undefined) {
  if (value == null) return '-'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface RecentReportsListProps {
  reports: RecentReportItem[] | null | undefined
}

export function RecentReportsList({ reports }: RecentReportsListProps) {
  if (!reports || reports.length === 0) {
    return (
      <div className="text-gray-500">Nenhum relatório encontrado.</div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bomba</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reports.map((r) => {
            const phone = r.clients?.phone?.replace(/\D/g, '') || r.whatsapp_digits || ''
            const repName = r.client_rep_name || 'Cliente'
            const companyName = r.companies?.name || 'empresa'
            const volume = r.realized_volume || 0
            const value = r.total_value || 0
            const date = format(new Date(r.date), 'dd/MM/yyyy')
            
            const whatsappLink = phone
              ? `https://wa.me/55${phone}?text=${encodeURIComponent(
                  `Olá ${repName}, aqui é Henrique da ${companyName}. Sobre o bombeamento ${r.report_number} em ${date}: volume ${volume} m³, valor ${formatCurrency(value)}. Confirma a forma de pagamento e se posso emitir a nota? Obrigado.`
                )}`
              : null

            return (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{r.report_number}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{format(new Date(r.date), 'dd/MM/yyyy')}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div>
                    <div className="font-medium text-gray-900">{r.client_rep_name ?? '-'}</div>
                    <div className="text-gray-500 text-xs">
                      {r.clients?.name || r.clients?.company_name || '-'}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{r.pump_prefix ?? '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{r.realized_volume ?? '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(r.total_value)}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusToVariant(r.status)} size="sm">{r.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link
                    to={`/reports/${r.id}`}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    Ver
                  </Link>
                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 shadow-sm hover:bg-green-100"
                    >
                      WhatsApp
                    </a>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}




