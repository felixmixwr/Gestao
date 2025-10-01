import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { formatCurrency, getCategoryColor, getExpenseIcon, EXPENSE_CATEGORY_OPTIONS } from '../../types/financial';
import type { ExpenseWithRelations, ExpenseFilters } from '../../types/financial';
import { ChevronLeft, ChevronRight, Search, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';

interface ExpenseTableProps {
  expenses: ExpenseWithRelations[];
  loading?: boolean;
  onEdit?: (expense: ExpenseWithRelations) => void;
  onDelete?: (expense: ExpenseWithRelations) => void;
  onView?: (expense: ExpenseWithRelations) => void;
  onExport?: () => void;
  filters?: ExpenseFilters;
  onFiltersChange?: (filters: ExpenseFilters) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
}

export function ExpenseTable({
  expenses,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onExport,
  filters = {},
  onFiltersChange,
  pagination,
  onPageChange
}: ExpenseTableProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (value: string) => {
    if (onFiltersChange) {
      onFiltersChange({ ...filters, search: value });
    }
  };

  const handleCategoryFilter = (category: string) => {
    if (onFiltersChange) {
      const categories = category === 'all' 
        ? undefined 
        : [category as any];
      onFiltersChange({ ...filters, categoria: categories });
    }
  };

  const handleDateFilter = (field: 'data_inicio' | 'data_fim', value: string) => {
    if (onFiltersChange) {
      onFiltersChange({ ...filters, [field]: value });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
          </div>
        </div>
        <div className="border rounded-lg">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0">
              <div className="flex justify-between items-center">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com filtros e ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar despesas..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Filtros expandidos */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <Select onValueChange={handleCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {EXPENSE_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <Input
                type="date"
                value={filters.data_inicio || ''}
                onChange={(e) => handleDateFilter('data_inicio', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data Fim</label>
              <Input
                type="date"
                value={filters.data_fim || ''}
                onChange={(e) => handleDateFilter('data_fim', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Bomba</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Nenhuma despesa encontrada
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getExpenseIcon(expense.categoria)}</span>
                      <div>
                        <p className="font-medium">{expense.descricao}</p>
                        {expense.observacoes && (
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {expense.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getCategoryColor(expense.categoria)}>
                      {expense.categoria}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(expense.valor)}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <span className="capitalize text-sm">
                      {expense.tipo_custo}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm">
                      {new Date(expense.data_despesa).toLocaleDateString('pt-BR')}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm font-medium">
                      {expense.bomba_prefix || 'N/A'}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm">
                      {expense.company_name || 'N/A'}
                    </span>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onView && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(expense)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(expense)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(expense)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} despesas
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                const isActive = page === pagination.page;
                
                return (
                  <Button
                    key={page}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange?.(page)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para resumo da tabela
interface TableSummaryProps {
  totalExpenses: number;
  totalValue: number;
  averageValue: number;
}

export function TableSummary({ totalExpenses, totalValue, averageValue }: TableSummaryProps) {
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">Total de Despesas</p>
          <p className="text-2xl font-bold text-blue-600">{totalExpenses}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Valor Total</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Valor Médio</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(averageValue)}</p>
        </div>
      </div>
    </div>
  );
}



