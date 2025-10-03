import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, TrendingUp, BarChart3, PieChart, LineChart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { DatePicker } from '../../components/ui/date-picker';
import { ExpenseCharts, CostTypeComparison, MonthlyTrend } from '../../components/financial/ExpenseCharts';
import { ExpensesExportButton } from '../../components/financial/ExpensesExportButton';
import { getExpenses, getFinancialStats, getPumpsForSelect, getCompaniesForSelect, getFaturamentoBrutoStats, getFaturamentoPorPeriodo } from '../../lib/financialApi';
import { formatCurrency } from '../../types/financial';
import type { ExpenseWithRelations, FinancialStats, ExpenseFilters } from '../../types/financial';

export function FinancialReports() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [faturamentoStats, setFaturamentoStats] = useState<any>(null);
  const [faturamentoPorPeriodo, setFaturamentoPorPeriodo] = useState<any[]>([]);
  const [pumps, setPumps] = useState<Array<{ id: string; prefix: string; model?: string; brand?: string }>>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [filters] = useState<ExpenseFilters>({});
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
      
      // Carregar dados de faturamento
      const [faturamentoStatsData, faturamentoPeriodoData] = await Promise.all([
        getFaturamentoBrutoStats(),
        getFaturamentoPorPeriodo()
      ]);
      
      setFaturamentoStats(faturamentoStatsData);
      setFaturamentoPorPeriodo(faturamentoPeriodoData);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      const [expensesData, statsData] = await Promise.all([
        getExpenses(filters),
        getFinancialStats(filters)
      ]);
      
      setExpenses(expensesData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
    }
  };


  const handlePeriodChange = (field: 'inicio' | 'fim', value: string) => {
    setReportPeriod(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateRangePreset = (days: number) => {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - days);
    
    setReportPeriod({
      inicio: inicio.toISOString().split('T')[0],
      fim: fim.toISOString().split('T')[0]
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/financial')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Relatórios Financeiros</h1>
                <p className="text-gray-600 mt-1">
                  Análise detalhada de faturamento bruto, despesas e performance financeira
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ExpensesExportButton
                expenses={expenses}
                filters={{
                  data_inicio: reportPeriod.inicio,
                  data_fim: reportPeriod.fim
                }}
                disabled={loading || expenses.length === 0}
              />
            </div>
          </div>

          {/* Filtros de Período */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Período do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DatePicker
                  label="Data Inicial"
                  value={reportPeriod.inicio}
                  onChange={(value) => handlePeriodChange('inicio', value)}
                  placeholder="Selecionar data inicial"
                />
                
                <DatePicker
                  label="Data Final"
                  value={reportPeriod.fim}
                  onChange={(value) => handlePeriodChange('fim', value)}
                  placeholder="Selecionar data final"
                />
                
                <div className="space-y-2">
                  <Label>Períodos Rápidos</Label>
                  <div className="flex flex-wrap gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleDateRangePreset(7)}>
                      7 dias
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDateRangePreset(30)}>
                      30 dias
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDateRangePreset(90)}>
                      90 dias
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo Executivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Faturamento Bruto</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(faturamentoStats?.total_faturado || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {faturamentoStats?.total_relatorios_pagos || 0} relatórios pagos
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Volume Bombeado</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(faturamentoStats?.volume_total_bombeado || 0).toFixed(2)} m³
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Volume total
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Despesas</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(stats?.total_despesas || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {expenses.length} despesas no período
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <PieChart className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Lucro Líquido</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency((faturamentoStats?.total_faturado || 0) - (stats?.total_despesas || 0))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Faturamento - Despesas
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <LineChart className="h-6 w-6 text-purple-600" />
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

          {/* Despesas por Categoria */}
          {stats && Object.keys(stats.total_por_categoria).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Despesas por Categoria
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
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <span className="text-lg">
                              {category === 'Mão de obra' ? '👷' : 
                               category === 'Diesel' ? '⛽' : 
                               category === 'Manutenção' ? '🔧' : 
                               category === 'Imposto' ? '📋' : '📦'}
                            </span>
                          </div>
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
                  {stats.total_por_bomba.slice(0, 5).map((bomba) => (
                    <div key={bomba.bomba_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg">
                          <span className="text-lg">🚛</span>
                        </div>
                        <div>
                          <p className="font-medium">{bomba.bomba_prefix}</p>
                          <p className="text-sm text-gray-600">Bomba</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">{formatCurrency(bomba.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumo do Relatório */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Período</h4>
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
      </div>
    </div>
  );
}