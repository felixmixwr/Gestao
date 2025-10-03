import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatCurrency, getCategoryColor, getExpenseIcon } from '../../types/financial';
import type { ExpenseWithRelations } from '../../types/financial';

interface ExpenseCardProps {
  expense: ExpenseWithRelations;
  onClick?: (expense: ExpenseWithRelations) => void;
  showActions?: boolean;
  onEdit?: (expense: ExpenseWithRelations) => void;
  onDelete?: (expense: ExpenseWithRelations) => void;
}

export function ExpenseCard({ 
  expense, 
  onClick, 
  showActions = false, 
  onEdit, 
  onDelete 
}: ExpenseCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(expense);
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
        onClick ? 'hover:border-blue-300' : ''
      }`}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getExpenseIcon(expense.categoria)}</span>
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {expense.descricao}
            </CardTitle>
          </div>
          {showActions && (
            <div className="flex gap-1">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(expense);
                  }}
                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                  title="Editar despesa"
                >
                  ✏️
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(expense);
                  }}
                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                  title="Excluir despesa"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Valor principal */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Valor:</span>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(expense.valor)}
            </span>
          </div>

          {/* Categoria e Tipo */}
          <div className="flex items-center justify-between">
            <Badge className={getCategoryColor(expense.categoria)}>
              {expense.categoria}
            </Badge>
            <span className="text-sm text-gray-600 capitalize">
              {expense.tipo_custo}
            </span>
          </div>

          {/* Bomba e Empresa */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Bomba:</span>
              <p className="font-medium">{expense.bomba_prefix || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-600">Empresa:</span>
              <p className="font-medium">{expense.company_name || 'N/A'}</p>
            </div>
          </div>

          {/* Data */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Data:</span>
            <span className="font-medium">
              {expense.data_despesa ? expense.data_despesa : 'Sem data'}
            </span>
          </div>

          {/* Informações específicas do Diesel */}
          {expense.categoria === 'Diesel' && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Litros:</span>
                <span className="font-medium">{expense.quantidade_litros || 0}L</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Custo/L:</span>
                <span className="font-medium">
                  {formatCurrency(expense.custo_por_litro || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Km Atual:</span>
                <span className="font-medium">{expense.quilometragem_atual || 0} km</span>
              </div>
            </div>
          )}

          {/* Observações */}
          {expense.observacoes && (
            <div className="text-sm">
              <span className="text-gray-600">Obs:</span>
              <p className="text-gray-800 mt-1 line-clamp-2">
                {expense.observacoes}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para KPIs de resumo
interface KPICardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function KPICard({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  subtitle, 
  trend 
}: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600'
  };

  const iconClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <Card className={`${colorClasses[color]} transition-all duration-200 hover:shadow-md h-full`}>
      <CardContent className="p-4 lg:p-6 h-full flex flex-col">
        <div className="flex items-start justify-between h-full">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium opacity-75 truncate">{title || 'Título'}</p>
            <p className="text-lg lg:text-2xl font-bold mt-1 break-words">
              {typeof value === 'number' ? formatCurrency(value || 0) : value || '0'}
            </p>
            {subtitle && (
              <p className="text-xs opacity-75 mt-1 truncate">{subtitle}</p>
            )}
            {trend && (
              <div className={`flex items-center mt-2 text-xs ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="mr-1">
                  {trend.isPositive ? '↗️' : '↘️'}
                </span>
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          <div className={`p-2 lg:p-3 rounded-full ${iconClasses[color]} flex-shrink-0 ml-3`}>
            <span className="text-lg lg:text-xl">{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para estatísticas por categoria
interface CategoryStatsCardProps {
  category: string;
  total: number;
  percentage: number;
  color: string;
  icon: string;
}

export function CategoryStatsCard({ 
  category, 
  total, 
  percentage, 
  color, 
  icon 
}: CategoryStatsCardProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
              <span className="text-lg">{icon}</span>
            </div>
            <div>
              <p className="font-medium">{category || 'Categoria'}</p>
              <p className="text-sm text-gray-600">{(percentage || 0).toFixed(1)}% do total</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{formatCurrency(total || 0)}</p>
            <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="h-2 rounded-full bg-blue-500" 
                style={{ width: `${percentage || 0}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}






