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
import { formatCurrency, getCategoryColor, getExpenseIcon, getTransactionTypeColor, getTransactionTypeIcon, EXPENSE_CATEGORY_OPTIONS, TRANSACTION_TYPE_OPTIONS } from '../../types/financial';
import type { ExpenseWithRelations, ExpenseFilters } from '../../types/financial';
import { ChevronLeft, ChevronRight, Search, Filter, Download, Eye, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DatePicker } from '../ui/date-picker';

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
  const [sortField, setSortField] = useState<string>('data_despesa');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  const handleTransactionTypeFilter = (type: string) => {
    if (onFiltersChange) {
      const types = type === 'all' 
        ? undefined 
        : [type as any];
      onFiltersChange({ ...filters, tipo_transacao: types });
    }
  };

  const handleDateFilter = (field: 'data_inicio' | 'data_fim', value: string) => {
    if (onFiltersChange) {
      onFiltersChange({ ...filters, [field]: value });
    }
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      // Se clicou no mesmo campo, alternar direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Se clicou em campo diferente, usar 'desc' por padrão para data
      setSortField(field);
      setSortDirection(field === 'data_despesa' ? 'desc' : 'desc');
    }
    
    // Notificar componente pai sobre a ordenação
    if (onFiltersChange) {
      onFiltersChange({ 
        ...filters, 
        sortField: field, 
        sortDirection: field === sortField && sortDirection === 'asc' ? 'desc' : 'desc'
      });
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
          {/* Botão de exportação removido - agora está no cabeçalho da seção */}
        </div>
      </div>

      {/* Filtros expandidos */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <label className="text-sm font-medium mb-2 block">Tipo de Transação</label>
              <Select onValueChange={handleTransactionTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {TRANSACTION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <DatePicker
                label="Data Início"
                value={filters.data_inicio || ''}
                onChange={(value) => handleDateFilter('data_inicio', value)}
                placeholder="Selecionar data início"
              />
            </div>

            <div>
              <DatePicker
                label="Data Fim"
                value={filters.data_fim || ''}
                onChange={(value) => handleDateFilter('data_fim', value)}
                placeholder="Selecionar data fim"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ordenação</label>
              <div className="flex items-center gap-2">
                <Select onValueChange={(value) => {
                  if (value === 'data_despesa') {
                    handleSort('data_despesa');
                  } else if (value === 'valor') {
                    handleSort('valor');
                  } else if (value === 'descricao') {
                    handleSort('descricao');
                  }
                }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data_despesa">Data</SelectItem>
                    <SelectItem value="valor">Valor</SelectItem>
                    <SelectItem value="descricao">Descrição</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSort(sortField)}
                  className="flex items-center gap-1"
                >
                  {sortDirection === 'asc' ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Descrição</TableHead>
              <TableHead className="w-[120px]">Categoria</TableHead>
              <TableHead className="w-[120px] text-right">Valor</TableHead>
              <TableHead className="w-[100px]">Tipo Transação</TableHead>
              <TableHead className="w-[80px]">Tipo Custo</TableHead>
              <TableHead className="w-[100px]">Data</TableHead>
              <TableHead className="w-[80px]">Bomba</TableHead>
              <TableHead className="w-[120px]">Empresa</TableHead>
              <TableHead className="w-[100px] text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  Nenhuma despesa encontrada
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-gray-50">
                  <TableCell className="w-[300px]">
                    <div className="flex items-center gap-2">
                      <span className="text-lg flex-shrink-0">{getExpenseIcon(expense.categoria)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{expense.descricao}</p>
                        {expense.observacoes && (
                          <p className="text-sm text-gray-500 truncate">
                            {expense.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="w-[120px]">
                    <div className="flex justify-center">
                      <Badge className={getCategoryColor(expense.categoria)}>
                        {expense.categoria}
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell className="w-[120px] text-right">
                    <span className={`font-semibold ${expense.valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(expense.valor)}
                    </span>
                  </TableCell>
                  
                  <TableCell className="w-[100px]">
                    <div className="flex justify-center">
                      <Badge className={getTransactionTypeColor(expense.tipo_transacao)}>
                        <span className="flex items-center gap-1">
                          <span>{getTransactionTypeIcon(expense.tipo_transacao)}</span>
                          {expense.tipo_transacao}
                        </span>
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell className="w-[80px]">
                    <span className="capitalize text-sm">
                      {expense.tipo_custo}
                    </span>
                  </TableCell>
                  
                  <TableCell className="w-[100px]">
                    <span className="text-sm">
                      {expense.data_despesa ? expense.data_despesa : 'Sem data'}
                    </span>
                  </TableCell>
                  
                  <TableCell className="w-[80px]">
                    <span className="text-sm font-medium">
                      {expense.bomba_prefix || 'N/A'}
                    </span>
                  </TableCell>
                  
                  <TableCell className="w-[120px]">
                    <span className="text-sm truncate">
                      {expense.company_name || 'N/A'}
                    </span>
                  </TableCell>
                  
                  <TableCell className="w-[100px] text-center">
                    <div className="flex items-center justify-center gap-1">
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
  faturamentoBruto?: number;
}

export function TableSummary({ totalExpenses, totalValue, averageValue, faturamentoBruto }: TableSummaryProps) {
  // Calcular caixa da empresa (faturamento - despesas)
  const caixaEmpresa = (faturamentoBruto || 0) + totalValue; // totalValue já é negativo (despesas)
  const isPositive = caixaEmpresa >= 0;

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">Total de Despesas</p>
          <p className="text-2xl font-bold text-blue-600">{totalExpenses}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Caixa de Empresa</p>
          <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(caixaEmpresa)}
          </p>
          <p className="text-xs text-gray-500">
            Faturamento - Despesas
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Valor Total</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalValue)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Valor Médio</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(averageValue)}</p>
        </div>
      </div>
    </div>
  );
}






