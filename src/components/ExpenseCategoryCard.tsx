import React from 'react'

interface ExpenseCategoryCardProps {
  category: string
  amount: number
  percentage: number
  icon: React.ReactNode
  color: 'red' | 'gray' | 'yellow' | 'brown'
  loading?: boolean
}

const colorClasses = {
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-200',
    progress: 'bg-red-600'
  },
  gray: {
    bg: 'bg-gray-50',
    icon: 'text-gray-600',
    border: 'border-gray-200',
    progress: 'bg-gray-600'
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    border: 'border-yellow-200',
    progress: 'bg-yellow-600'
  },
  brown: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    border: 'border-amber-200',
    progress: 'bg-amber-600'
  }
}

export function ExpenseCategoryCard({
  category,
  amount,
  percentage,
  icon,
  color,
  loading = false
}: ExpenseCategoryCardProps) {
  const colors = colorClasses[color]
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value || 0)
  }

  if (loading) {
    return (
      <div className={`p-4 rounded-lg border-2 ${colors.bg} ${colors.border} animate-pulse`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded" />
            <div className="h-4 bg-gray-300 rounded w-24" />
          </div>
          <div className="h-4 bg-gray-300 rounded w-16" />
        </div>
        <div className="h-6 bg-gray-300 rounded w-20 mb-2" />
        <div className="h-2 bg-gray-300 rounded" />
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${colors.bg} ${colors.border}`}>
      {/* Header com ícone, categoria e porcentagem */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 ${colors.icon}`}>
            {icon}
          </div>
          <h3 className="text-sm font-medium text-gray-900">
            {category}
          </h3>
        </div>
        <span className="text-sm font-medium text-gray-600">
          {percentage.toFixed(1)}%
        </span>
      </div>

      {/* Valor */}
      <div className="mb-3">
        <p className="text-lg font-bold text-gray-900">
          {formatCurrency(amount)}
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colors.progress} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
