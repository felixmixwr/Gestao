import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { formatCurrency } from '../../types/financial';
import type { FinancialStats } from '../../types/financial';

// Cores para os gráficos
const COLORS = {
  categories: {
    'Mão de obra': '#10B981', // Verde
    'Diesel': '#3B82F6', // Azul
    'Manutenção': '#F59E0B', // Amarelo
    'Imposto': '#EF4444', // Vermelho
    'Outros': '#6B7280' // Cinza
  },
  default: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
};

interface ExpenseChartsProps {
  stats: FinancialStats;
  loading?: boolean;
}

export function ExpenseCharts({ stats, loading = false }: ExpenseChartsProps) {
  if (loading) {
    return <ChartsSkeleton />;
  }

  // Preparar dados para gráfico de pizza (categorias)
  const pieData = Object.entries(stats.total_por_categoria).map(([category, value]) => ({
    name: category,
    value,
    color: COLORS.categories[category as keyof typeof COLORS.categories] || COLORS.default[0]
  }));

  // Preparar dados para gráfico de barras (bombas)
  const barData = stats.total_por_bomba.map(item => ({
    bomba: item.bomba_prefix,
    valor: item.total,
    bomba_id: item.bomba_id
  }));

  // Preparar dados para gráfico de linha (tempo)
  const lineData = stats.despesas_por_periodo
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .map(item => ({
      periodo: item.periodo,
      valor: item.total,
      label: formatPeriodLabel(item.periodo)
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Pizza - Distribuição por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Distribuição por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legenda personalizada */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
                <span className="font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Barras - Despesas por Bomba */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Despesas por Bomba
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="bomba" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  labelFormatter={(label) => `Bomba: ${label}`}
                />
                <Bar 
                  dataKey="valor" 
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Linha - Evolução Temporal */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📉 Evolução das Despesas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="periodo" 
                  tickFormatter={(value) => formatPeriodLabel(value)}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  labelFormatter={(label) => `Período: ${formatPeriodLabel(label)}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para gráfico de comparação de tipos de custo
interface CostTypeComparisonProps {
  stats: FinancialStats;
  loading?: boolean;
}

export function CostTypeComparison({ stats, loading = false }: CostTypeComparisonProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparação por Tipo de Custo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const costTypeData = Object.entries(stats.despesas_por_tipo).map(([tipo, valor]) => ({
    tipo: tipo === 'fixo' ? 'Fixo' : 'Variável',
    valor,
    color: tipo === 'fixo' ? '#3B82F6' : '#10B981'
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💰 Comparação por Tipo de Custo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costTypeData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
              <YAxis dataKey="tipo" type="category" />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Valor']}
                labelFormatter={(label) => `Tipo: ${label}`}
              />
              <Bar dataKey="valor" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para gráfico de tendência mensal
interface MonthlyTrendProps {
  stats: FinancialStats;
  loading?: boolean;
}

export function MonthlyTrend({ stats, loading = false }: MonthlyTrendProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendência Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const monthlyData = stats.despesas_por_periodo
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .map(item => ({
      mes: formatPeriodLabel(item.periodo),
      valor: item.total
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📅 Tendência Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Valor']}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="valor" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorValor)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para dashboard de gráficos compacto
interface CompactChartsProps {
  stats: FinancialStats;
  loading?: boolean;
}

export function CompactCharts({ stats, loading = false }: CompactChartsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-32 bg-gray-100 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const pieData = Object.entries(stats.total_por_categoria).map(([category, value]) => ({
    name: category,
    value,
    color: COLORS.categories[category as keyof typeof COLORS.categories] || COLORS.default[0]
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Gráfico de Pizza Compacto */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Valor']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Barras Compacto */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Por Bomba</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.total_por_bomba.slice(0, 3)}>
                <Bar dataKey="total" fill="#3B82F6" />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Valor']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Estatístico */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Resumo</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-medium">{formatCurrency(stats.total_despesas)}</span>
            </div>
            <div className="flex justify-between">
              <span>Bombas:</span>
              <span className="font-medium">{stats.total_por_bomba.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Categorias:</span>
              <span className="font-medium">{Object.keys(stats.total_por_categoria).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Períodos:</span>
              <span className="font-medium">{stats.despesas_por_periodo.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Função auxiliar para formatar labels de período
function formatPeriodLabel(periodo: string): string {
  const [year, month] = periodo.split('-');
  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

// Skeleton para loading
function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    </div>
  );
}
