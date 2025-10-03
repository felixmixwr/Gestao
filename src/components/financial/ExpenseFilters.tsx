import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Calendar, Filter, X, Search, RefreshCw } from 'lucide-react';
import { DatePicker } from '../ui/date-picker';
import { EXPENSE_CATEGORY_OPTIONS, EXPENSE_TYPE_OPTIONS, EXPENSE_STATUS_OPTIONS } from '../../types/financial';
import type { ExpenseFilters as ExpenseFiltersType, ExpenseCategory, ExpenseType, ExpenseStatus } from '../../types/financial';

interface ExpenseFiltersProps {
  filters: ExpenseFiltersType;
  onFiltersChange: (filters: ExpenseFiltersType) => void;
  onClearFilters: () => void;
  pumps: Array<{ id: string; prefix: string; model?: string; brand?: string }>;
  companies: Array<{ id: string; name: string }>;
  loading?: boolean;
}

export function ExpenseFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  pumps,
  companies,
  loading = false
}: ExpenseFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value || undefined
    });
  };

  const handleCategoryChange = (category: string) => {
    if (category === 'all') {
      const newFilters = { ...filters };
      delete newFilters.categoria;
      onFiltersChange(newFilters);
    } else {
      onFiltersChange({
        ...filters,
        categoria: [category as ExpenseCategory]
      });
    }
  };

  const handleTypeChange = (type: string) => {
    if (type === 'all') {
      const newFilters = { ...filters };
      delete newFilters.tipo_custo;
      onFiltersChange(newFilters);
    } else {
      onFiltersChange({
        ...filters,
        tipo_custo: [type as ExpenseType]
      });
    }
  };

  const handleStatusChange = (status: string) => {
    if (status === 'all') {
      const newFilters = { ...filters };
      delete newFilters.status;
      onFiltersChange(newFilters);
    } else {
      onFiltersChange({
        ...filters,
        status: [status as ExpenseStatus]
      });
    }
  };

  const handleBombaChange = (pumpId: string) => {
    if (pumpId === 'all') {
      const newFilters = { ...filters };
      delete newFilters.pump_id;
      onFiltersChange(newFilters);
    } else {
      onFiltersChange({
        ...filters,
        pump_id: pumpId
      });
    }
  };

  const handleCompanyChange = (companyId: string) => {
    if (companyId === 'all') {
      const newFilters = { ...filters };
      delete newFilters.company_id;
      onFiltersChange(newFilters);
    } else {
      onFiltersChange({
        ...filters,
        company_id: companyId
      });
    }
  };

  const handleDateRangeChange = (field: 'data_inicio' | 'data_fim', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.categoria && filters.categoria.length > 0) count++;
    if (filters.tipo_custo && filters.tipo_custo.length > 0) count++;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.pump_id) count++;
    if (filters.company_id) count++;
    if (filters.data_inicio) count++;
    if (filters.data_fim) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Filtros Básicos' : 'Filtros Avançados'}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtros Básicos */}
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por descrição..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={filters.categoria?.[0] || 'all'}
              onValueChange={handleCategoryChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {EXPENSE_CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{option.value === 'Mão de obra' ? '👷' : 
                                                   option.value === 'Diesel' ? '⛽' : 
                                                   option.value === 'Manutenção' ? '🔧' : 
                                                   option.value === 'Imposto' ? '📋' : '📦'}</span>
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Custo */}
          <div className="space-y-2">
            <Label>Tipo de Custo</Label>
            <Select
              value={filters.tipo_custo?.[0] || 'all'}
              onValueChange={handleTypeChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {EXPENSE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtros Avançados */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-gray-900">Filtros Avançados</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status?.[0] || 'all'}
                    onValueChange={handleStatusChange}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      {EXPENSE_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${option.color.split(' ')[0]}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bomba */}
                <div className="space-y-2">
                  <Label>Bomba</Label>
                  <Select
                    value={filters.pump_id || 'all'}
                    onValueChange={handleBombaChange}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as bombas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as bombas</SelectItem>
                      {pumps.map((pump) => (
                        <SelectItem key={pump.id} value={pump.id}>
                          {pump.prefix} - {pump.model || 'N/A'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Empresa */}
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Select
                    value={filters.company_id || 'all'}
                    onValueChange={handleCompanyChange}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as empresas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as empresas</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Data de Início */}
                <DatePicker
                  label="Data Início"
                  value={filters.data_inicio || ''}
                  onChange={(value) => handleDateRangeChange('data_inicio', value)}
                  placeholder="Selecionar data início"
                />

                {/* Data de Fim */}
                <DatePicker
                  label="Data Fim"
                  value={filters.data_fim || ''}
                  onChange={(value) => handleDateRangeChange('data_fim', value)}
                  placeholder="Selecionar data fim"
                />
              </div>
            </div>
          )}
        </div>

        {/* Filtros Ativos */}
        {activeFiltersCount > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700">Filtros Ativos:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
              >
                Limpar todos
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Busca: "{filters.search}"
                  <button
                    onClick={() => handleSearchChange('')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.categoria && filters.categoria.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Categoria: {filters.categoria[0]}
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.tipo_custo && filters.tipo_custo.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Tipo: {filters.tipo_custo[0]}
                  <button
                    onClick={() => handleTypeChange('all')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.status && filters.status.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Status: {filters.status[0]}
                  <button
                    onClick={() => handleStatusChange('all')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.pump_id && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Bomba: {pumps.find(p => p.id === filters.pump_id)?.prefix || 'N/A'}
                  <button
                    onClick={() => handleBombaChange('all')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.company_id && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Empresa: {companies.find(c => c.id === filters.company_id)?.name || 'N/A'}
                  <button
                    onClick={() => handleCompanyChange('all')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.data_inicio && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Desde: {new Date(filters.data_inicio).toLocaleDateString('pt-BR')}
                  <button
                    onClick={() => handleDateRangeChange('data_inicio', '')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.data_fim && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Até: {new Date(filters.data_fim).toLocaleDateString('pt-BR')}
                  <button
                    onClick={() => handleDateRangeChange('data_fim', '')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para filtros rápidos (presets)
interface QuickFiltersProps {
  onApplyFilter: (filter: ExpenseFiltersType) => void;
  onClearFilters: () => void;
}

export function QuickFilters({ onApplyFilter, onClearFilters }: QuickFiltersProps) {
  const quickFilters = [
    {
      label: 'Hoje',
      filter: {
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: new Date().toISOString().split('T')[0]
      }
    },
    {
      label: 'Esta Semana',
      filter: {
        data_inicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        data_fim: new Date().toISOString().split('T')[0]
      }
    },
    {
      label: 'Este Mês',
      filter: {
        data_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        data_fim: new Date().toISOString().split('T')[0]
      }
    },
    {
      label: 'Apenas Diesel',
      filter: {
        categoria: ['Diesel' as ExpenseCategory]
      }
    },
    {
      label: 'Custos Fixos',
      filter: {
        tipo_custo: ['fixo' as ExpenseType]
      }
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Filtros Rápidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-600"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Limpar
          </Button>
          {quickFilters.map((quickFilter, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onApplyFilter(quickFilter.filter)}
              className="text-xs"
            >
              {quickFilter.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}



