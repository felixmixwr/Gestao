import { ReactNode } from 'react'
import clsx from 'clsx'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  loading?: boolean
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function KpiCard({ title, value, subtitle, loading, icon, trend, className }: KpiCardProps) {
  return (
    <div className={clsx('card', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? (
              <span className="inline-block h-6 w-24 animate-pulse rounded bg-gray-200" />
            ) : (
              value
            )}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-1">
              <span
                className={clsx(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs mês anterior</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 text-primary-600">{icon}</div>
          </div>
        )}
      </div>
    </div>
  )
}
