import React from 'react'
import { Link } from 'react-router-dom'

interface DashboardCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray'
  loading?: boolean
  onClick?: () => void
  linkTo?: string
  actionText?: string
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-100'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
    hover: 'hover:bg-green-100'
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    border: 'border-orange-200',
    hover: 'hover:bg-orange-100'
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-200',
    hover: 'hover:bg-red-100'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-100'
  },
  gray: {
    bg: 'bg-gray-50',
    icon: 'text-gray-600',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-100'
  }
}

export function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  loading = false,
  onClick,
  linkTo,
  actionText
}: DashboardCardProps) {
  const colors = colorClasses[color]
  
  const cardContent = (
    <div className={`
      relative p-6 rounded-lg border-2 transition-all duration-200 cursor-pointer
      ${colors.bg} ${colors.border} ${onClick || linkTo ? colors.hover : ''}
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
            title
          )}
        </h3>
        
        <div className="mb-1">
          {loading ? (
            <div className="h-8 bg-gray-300 rounded w-1/2 animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">
              {value}
            </p>
          )}
        </div>

        {subtitle && (
          <div className="text-sm text-gray-500">
            {loading ? (
              <div className="h-3 bg-gray-300 rounded w-1/3 animate-pulse" />
            ) : (
              subtitle
            )}
          </div>
        )}

        {/* Botão de ação */}
        {actionText && (onClick || linkTo) && !loading && (
          <div className="mt-4">
            <span className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
              {actionText} →
            </span>
          </div>
        )}
      </div>
    </div>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} className="block">
        {cardContent}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {cardContent}
      </button>
    )
  }

  return cardContent
}

// Componente de skeleton para loading
export function DashboardCardSkeleton() {
  return (
    <div className="p-6 rounded-lg border-2 border-gray-200 bg-gray-50 animate-pulse">
      <div className="absolute top-4 right-4">
        <div className="w-8 h-8 bg-gray-300 rounded" />
      </div>
      
      <div className="pr-12">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
        <div className="h-8 bg-gray-300 rounded w-1/2 mb-1" />
        <div className="h-3 bg-gray-300 rounded w-1/3" />
      </div>
    </div>
  )
}

