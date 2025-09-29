import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, TrendingUp, BarChart3, PieChart, LineChart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ExpenseCharts, CostTypeComparison, MonthlyTrend } from '../../components/financial/ExpenseCharts';
import { getExpenses, getFinancialStats, getPumpsForSelect, getCompaniesForSelect } from '../../lib/financialApi';
import { formatCurrency } from '../../types/financial';
import type { ExpenseWithRelations, FinancialStats, ExpenseFilters } from '../../types/financial';

export function FinancialReports() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [pumps, setPumps] = useState<Array<{ id: string; prefix: string; model?: string; brand?: string }>>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadReportData();
    }
  }, [filters, reportPeriod]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [pumpsData, companiesData] = await Promise.all([
        getPumpsForSelect(),
        getCompaniesForSelect()
      ]);
      
      setPumps(pumpsData);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      const reportFilters = {
        ...filters,
        data_inicio: reportPeriod.inicio,
        data_fim: reportPeriod.fim
      };
      
      const [expensesData, statsData] = await Promise.all([
        getExpenses(reportFilters),
        getFinancialStats(reportFilters)
      ]);
      
      setExpenses(expensesData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
    }
  };

  const handleExportPDF = () => {
    // TODO: Implementar exportação para PDF
    console.log('Exportar para PDF');
  };

  const handleExportExcel = () => {
    // TODO: Implementar exportação para Excel
    console.log('Exportar para Excel');
  };

  const handleBack = () => {
    navigate('/financial');
  };

  const handlePeriodChange = (field: 'inicio' | 'fim', value: string) => {
    setReportPeriod(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuickPeriod = (type: 'today' | 'week' | 'month' | 'quarter' | 'year') => {
    const today = new Date();
    let inicio: Date;
    let fim = today;

    switch (type) {
      case 'today':
        inicio = fim = today;
        break;
      case 'week':
        inicio = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        inicio = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        inicio = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        inicio = new Date(today.getFullYear(), 0, 1);
        break;
    }

    setReportPeriod({
      inicio: inicio.toISOString().split('T')[0],
      fim: fim.toISOString().split('T')[0]
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios Financeiros</h1>
            <p className="text-gray-600 mt-1">
              Análise detalhada das despesas e performance financeira
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Excel
          </Button>
          <Button
            onClick={handleExportPDF}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Período do Relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={reportPeriod.inicio}
                onChange={(e) => handlePeriodChange('inicio', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={reportPeriod.fim}
                onChange={(e) => handlePeriodChange('fim', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Períodos Rápidos</Label>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPeriod('today')}
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPeriod('week')}
                >
                  Semana
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPeriod('month')}
                >
                  Mês
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPeriod('year')}
                >
                  Ano
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Despesas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.total_despesas || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {expenses.length} despesas no período
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Média por Despesa</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(expenses.length > 0 ? (stats?.total_despesas || 0) / expenses.length : 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Valor médio
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categorias</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Object.keys(stats?.total_por_categoria || {}).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Tipos diferentes
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <PieChart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bombas Ativas</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats?.total_por_bomba.length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Com despesas
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <LineChart className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Detalhados */}
      {stats && (
        <div className="space-y-6">
          <ExpenseCharts stats={stats} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CostTypeComparison stats={stats} />
            <MonthlyTrend stats={stats} />
          </div>
        </div>
      )}

      {/* Análise por Categoria */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Análise Detalhada por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.total_por_categoria).map(([category, total]) => {
                const percentage = stats.total_despesas > 0 
                  ? (total / stats.total_despesas) * 100 
                  : 0;
                
                return (
                  <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {category === 'Mão de obra' ? '👷' : 
                         category === 'Diesel' ? '⛽' : 
                         category === 'Manutenção' ? '🔧' : 
                         category === 'Imposto' ? '📋' : '📦'}
                      </span>
                      <div>
                        <p className="font-medium">{category}</p>
                        <p className="text-sm text-gray-600">{percentage.toFixed(1)}% do total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(total)}</p>
                      <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="h-2 rounded-full bg-blue-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Bombas */}
      {stats && stats.total_por_bomba.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Bombas por Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.total_por_bomba
                .sort((a, b) => b.total - a.total)
                .slice(0, 5)
                .map((bomba, index) => (
                  <div key={bomba.bomba_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">Bomba {bomba.bomba_prefix}</p>
                        <p className="text-sm text-gray-600">ID: {bomba.bomba_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(bomba.total)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo do Período */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Período Selecionado</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Início:</strong> {new Date(reportPeriod.inicio).toLocaleDateString('pt-BR')}</p>
                <p><strong>Fim:</strong> {new Date(reportPeriod.fim).toLocaleDateString('pt-BR')}</p>
                <p><strong>Duração:</strong> {
                  Math.ceil((new Date(reportPeriod.fim).getTime() - new Date(reportPeriod.inicio).getTime()) / (1000 * 60 * 60 * 24)) + 1
                } dias</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Estatísticas</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Total de Despesas:</strong> {expenses.length}</p>
                <p><strong>Valor Total:</strong> {formatCurrency(stats?.total_despesas || 0)}</p>
                <p><strong>Valor Médio:</strong> {formatCurrency(expenses.length > 0 ? (stats?.total_despesas || 0) / expenses.length : 0)}</p>
                <p><strong>Categorias:</strong> {Object.keys(stats?.total_por_categoria || {}).length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

