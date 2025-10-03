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
import { Calendar, Filter, X, Search, RefreshCw, CalendarDays, Building2, Truck } from 'lucide-react';

interface ReportFilters {
  search?: string;
  client_id?: string;
  pump_id?: string;
  company_id?: string;
  status?: string[];
  data_inicio?: string;
  data_fim?: string;
  valor_min?: number;
  valor_max?: number;
  volume_min?: number;
  volume_max?: number;
}

interface ReportFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  onClearFilters: () => void;
  pumps: Array<{ id: string; prefix: string; model?: string; brand?: string }>;
  companies: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; name: string; email?: string }>;
  loading?: boolean;
}

const REPORT_STATUS_OPTIONS = [
  { value: 'PAGO', label: 'Pago', color: 'bg-green-100 text-green-800' },
  { value: 'PENDENTE', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' }
];

export function ReportFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  pumps,
  companies,
  clients,
  loading = false
}: ReportFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    inicio: filters.data_inicio || '',
    fim: filters.data_fim || ''
  });

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value || undefined
    });
  };

  const handleClientChange = (clientId: string) => {
    if (clientId === 'all') {
      const newFilters = { ...filters };
      delete newFilters.client_id;
      onFiltersChange(newFilters);
    } else {
      onFiltersChange({
        ...filters,
        client_id: clientId
      });
    }
  };

  const handlePumpChange = (pumpId: string) => {
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

  const handleStatusChange = (status: string) => {
    if (status === 'all') {
      const newFilters = { ...filters };
      delete newFilters.status;
      onFiltersChange(newFilters);
    } else {
      onFiltersChange({
        ...filters,
        status: [status]
      });
    }
  };

  const handleQuickDateFilter = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    setCustomDateRange({
      inicio: startDateStr,
      fim: endDateStr
    });
    
    onFiltersChange({
      ...filters,
      data_inicio: startDateStr,
      data_fim: endDateStr
    });
  };

  const handleCustomDateRange = () => {
    onFiltersChange({
      ...filters,
      data_inicio: customDateRange.inicio || undefined,
      data_fim: customDateRange.fim || undefined
    });
  };

  const handleValueRangeChange = (field: 'valor_min' | 'valor_max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    onFiltersChange({
      ...filters,
      [field]: numValue
    });
  };

  const handleVolumeRangeChange = (field: 'volume_min' | 'volume_max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    onFiltersChange({
      ...filters,
      [field]: numValue
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.client_id) count++;
    if (filters.pump_id) count++;
    if (filters.company_id) count++;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.data_inicio) count++;
    if (filters.data_fim) count++;
    if (filters.valor_min) count++;
    if (filters.valor_max) count++;
    if (filters.volume_min) count++;
    if (filters.volume_max) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Relatórios
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
              placeholder="Buscar por número do relatório, cliente..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>

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
                {REPORT_STATUS_OPTIONS.map((option) => (
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

          {/* Filtros Avançados */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-gray-900">Filtros Avançados</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cliente */}
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select
                    value={filters.client_id || 'all'}
                    onValueChange={handleClientChange}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os clientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os clientes</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
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
                    onValueChange={handlePumpChange}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as bombas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as bombas</SelectItem>
                      {pumps.map((pump) => (
                        <SelectItem key={pump.id} value={pump.id}>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-gray-500" />
                            {pump.prefix} - {pump.model || 'N/A'}
                          </div>
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
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-500" />
                            {company.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filtros de Data Personalizados */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  <h5 className="font-medium text-gray-900">Filtros de Data</h5>
                </div>
                
                {/* Filtros Rápidos de Data */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDateFilter(0)}
                    className="text-xs"
                  >
                    Hoje
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDateFilter(7)}
                    className="text-xs"
                  >
                    Últimos 7 dias
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDateFilter(30)}
                    className="text-xs"
                  >
                    Últimos 30 dias
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDateFilter(90)}
                    className="text-xs"
                  >
                    Últimos 90 dias
                  </Button>
                </div>

                {/* Data Personalizada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_inicio">Data Início</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="data_inicio"
                        type="date"
                        value={customDateRange.inicio}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, inicio: e.target.value }))}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_fim">Data Fim</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="data_fim"
                        type="date"
                        value={customDateRange.fim}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, fim: e.target.value }))}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCustomDateRange}
                  disabled={loading || (!customDateRange.inicio && !customDateRange.fim)}
                  className="w-full"
                >
                  Aplicar Filtro de Data Personalizado
                </Button>
              </div>

              {/* Filtros de Valor e Volume */}
              <div className="space-y-4 pt-4 border-t">
                <h5 className="font-medium text-gray-900">Filtros de Valor e Volume</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor_min">Valor Mínimo (R$)</Label>
                    <Input
                      id="valor_min"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={filters.valor_min || ''}
                      onChange={(e) => handleValueRangeChange('valor_min', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor_max">Valor Máximo (R$)</Label>
                    <Input
                      id="valor_max"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={filters.valor_max || ''}
                      onChange={(e) => handleValueRangeChange('valor_max', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="volume_min">Volume Mínimo (m³)</Label>
                    <Input
                      id="volume_min"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={filters.volume_min || ''}
                      onChange={(e) => handleVolumeRangeChange('volume_min', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="volume_max">Volume Máximo (m³)</Label>
                    <Input
                      id="volume_max"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={filters.volume_max || ''}
                      onChange={(e) => handleVolumeRangeChange('volume_max', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
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
              {filters.client_id && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Cliente: {clients.find(c => c.id === filters.client_id)?.name || 'N/A'}
                  <button
                    onClick={() => handleClientChange('all')}
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
                    onClick={() => handlePumpChange('all')}
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
                    onClick={() => onFiltersChange({ ...filters, data_inicio: undefined })}
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
                    onClick={() => onFiltersChange({ ...filters, data_fim: undefined })}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.valor_min && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Valor min: R$ {filters.valor_min.toFixed(2)}
                  <button
                    onClick={() => onFiltersChange({ ...filters, valor_min: undefined })}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.valor_max && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Valor max: R$ {filters.valor_max.toFixed(2)}
                  <button
                    onClick={() => onFiltersChange({ ...filters, valor_max: undefined })}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.volume_min && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Volume min: {filters.volume_min.toFixed(2)} m³
                  <button
                    onClick={() => onFiltersChange({ ...filters, volume_min: undefined })}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.volume_max && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Volume max: {filters.volume_max.toFixed(2)} m³
                  <button
                    onClick={() => onFiltersChange({ ...filters, volume_max: undefined })}
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

// Componente para filtros rápidos de relatórios
interface QuickReportFiltersProps {
  onApplyFilter: (filter: ReportFilters) => void;
  onClearFilters: () => void;
}

export function QuickReportFilters({ onApplyFilter, onClearFilters }: QuickReportFiltersProps) {
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
      label: 'Apenas Pagos',
      filter: {
        status: ['PAGO']
      }
    },
    {
      label: 'Pendentes',
      filter: {
        status: ['PENDENTE']
      }
    },
    {
      label: 'Valor > R$ 1000',
      filter: {
        valor_min: 1000
      }
    },
    {
      label: 'Volume > 50 m³',
      filter: {
        volume_min: 50
      }
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Filtros Rápidos de Relatórios</CardTitle>
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

