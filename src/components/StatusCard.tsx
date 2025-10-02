import React from 'react'
import { Link } from 'react-router-dom'
import { getStatusLabel } from '../utils/status-utils'

interface StatusCardProps {
  status: string
  quantidade: number
  valor_total: number
  loading?: boolean
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'TODOS':
      return {
        bg: 'bg-gray-50',
        icon: 'text-gray-600',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-100'
      }
    case 'ENVIADO_FINANCEIRO':
      return {
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-100'
      }
    case 'RECEBIDO_FINANCEIRO':
      return {
        bg: 'bg-indigo-50',
        icon: 'text-indigo-600',
        border: 'border-indigo-200',
        hover: 'hover:bg-indigo-100'
      }
    case 'AGUARDANDO_APROVACAO':
      return {
        bg: 'bg-yellow-50',
        icon: 'text-yellow-600',
        border: 'border-yellow-200',
        hover: 'hover:bg-yellow-100'
      }
    case 'NOTA_EMITIDA':
      return {
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-100'
      }
    case 'AGUARDANDO_PAGAMENTO':
      return {
        bg: 'bg-orange-50',
        icon: 'text-orange-600',
        border: 'border-orange-200',
        hover: 'hover:bg-orange-100'
      }
    case 'PAGO':
      return {
        bg: 'bg-green-50',
        icon: 'text-green-600',
        border: 'border-green-200',
        hover: 'hover:bg-green-100'
      }
    default:
      return {
        bg: 'bg-gray-50',
        icon: 'text-gray-600',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-100'
      }
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'TODOS':
      return (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      )
    case 'ENVIADO_FINANCEIRO':
      return (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
        </svg>
      )
    case 'RECEBIDO_FINANCEIRO':
      return (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      )
    case 'AGUARDANDO_APROVACAO':
      return (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      )
    case 'NOTA_EMITIDA':
      return (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
        </svg>
      )
    case 'AGUARDANDO_PAGAMENTO':
      return (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
        </svg>
      )
    case 'PAGO':
      return (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    default:
      return (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      )
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

export function StatusCard({
  status,
  quantidade,
  valor_total,
  loading = false
}: StatusCardProps) {
  const colors = getStatusColor(status)
  const icon = getStatusIcon(status)
  const statusLabel = status === 'TODOS' ? 'Todos os Relatórios' : getStatusLabel(status)

  const cardContent = (
    <div className={`
      relative p-6 rounded-lg border-2 transition-all duration-200 cursor-pointer
      ${colors.bg} ${colors.border} ${colors.hover}
      ${loading ? 'animate-pulse' : ''}
    `}>
      {/* Ícone */}
      <div className="absolute top-4 right-4">
        <div className={`w-8 h-8 ${colors.icon}`}>
          {loading ? (
            <div className="w-8 h-8 bg-gray-300 rounded animate-pulse" />
          ) : (
            icon
          )}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="pr-12">
        <h3 className="text-sm font-medium text-gray-600 mb-2">
          {loading ? (
            <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse" />
          ) : (
            statusLabel
          )}
        </h3>
        
        <div className="mb-1">
          {loading ? (
            <div className="h-8 bg-gray-300 rounded w-1/2 animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">
              {quantidade}
            </p>
          )}
        </div>

        <p className="text-sm text-gray-500">
          {loading ? (
            <div className="h-3 bg-gray-300 rounded w-1/3 animate-pulse" />
          ) : (
            formatCurrency(valor_total)
          )}
        </p>

        {/* Botão de ação */}
        {!loading && (
          <div className="mt-4">
            <span className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
              Ver relatórios →
            </span>
          </div>
        )}
      </div>
    </div>
  )

  // Link para página de relatórios com filtro por status
  const linkTo = status === 'TODOS' ? '/reports' : `/reports?status=${status}`

  return (
    <Link to={linkTo} className="block">
      {cardContent}
    </Link>
  )
}
