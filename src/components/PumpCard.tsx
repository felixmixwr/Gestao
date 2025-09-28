import { Link } from 'react-router-dom'
import { Badge } from './Badge'
// import { Button } from './Button'
import { formatCurrency } from '../utils/formatters'
import { Database } from '../lib/supabase'

type Pump = Database['public']['Tables']['pumps']['Row'] & {
  company_name?: string
}

interface PumpCardProps {
  pump: Pump
}

export function PumpCard({ pump }: PumpCardProps) {
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{pump.prefix}</h3>
          <p className="text-sm text-gray-600">{pump.model || 'Modelo não informado'}</p>
        </div>
        <Badge variant={getStatusVariant(pump.status)} size="sm">
          {pump.status}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tipo:</span>
          <span className="text-gray-900">{pump.pump_type || '-'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total Faturado:</span>
          <span className="font-semibold text-green-600">
            {formatCurrency(pump.total_billed)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Empresa:</span>
          <span className="text-gray-900 font-medium">
            {pump.company_name === 'FELIX MIX' ? 'FELIX MIX' : 
             pump.company_name === 'WORLDPAV' ? 'WORLDPAV' : 
             pump.company_name || '-'}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <Link to={`/pumps/${pump.id}`}>
          <button 
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 bg-[#2663eb] text-white border border-[#2663eb] hover:bg-[#1d4ed8] hover:border-[#1d4ed8] hover:text-white focus:ring-[#2663eb]"
          >
            Ver detalhes
          </button>
        </Link>
      </div>
    </div>
  )
}
