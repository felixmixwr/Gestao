import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar, Filter, Download, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { KPICard, CategoryStatsCard } from '../../components/financial/ExpenseCard';
import { ExpenseTable, TableSummary } from '../../components/financial/ExpenseTable';
import { ExpenseCharts, CompactCharts } from '../../components/financial/ExpenseCharts';
import { AdvancedFilters, QuickFilters } from '../../components/financial/AdvancedFilters';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { FolhaSalarialAlert } from '../../components/financial/FolhaSalarialAlert';
import { CompanyFinancialCard } from '../../components/financial/CompanyFinancialCard';
import { 
  getExpenses, 
  getFinancialStats, 
  getPumpsForSelect, 
  getCompaniesForSelect,
  deleteExpense,
  getFaturamentoBrutoStats,
  getFaturamentoBruto,
  getFaturamentoMensal,
  getVolumeDiarioComBombas,
  getVolumeSemanalComBombas,
  getVolumeMensalComBombas,
  getPagamentosReceberStats,
  getPagamentosProximosVencimento,
  getColaboradoresCosts,
  getDadosFinanceirosPorEmpresa
} from '../../lib/financialApi';
import type { 
  ExpenseWithRelations, 
  FinancialStats, 
  ExpenseFilters as ExpenseFiltersType 
} from '../../types/financial';

export function FinancialDashboard() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [faturamentoStats, setFaturamentoStats] = useState<any>(null);
  const [faturamentoData, setFaturamentoData] = useState<any[]>([]);
  const [faturamentoMensal, setFaturamentoMensal] = useState<any[]>([]);
  const [volumeDiario, setVolumeDiario] = useState<any[]>([]);
  const [volumeSemanal, setVolumeSemanal] = useState<any[]>([]);
  const [volumeMensal, setVolumeMensal] = useState<any[]>([]);
  const [pagamentosStats, setPagamentosStats] = useState<any>(null);
  const [pagamentosProximos, setPagamentosProximos] = useState<any[]>([]);
  const [colaboradoresCosts, setColaboradoresCosts] = useState<any>(null);
  const [dadosPorEmpresa, setDadosPorEmpresa] = useState<any[]>([]);
  const [pumps, setPumps] = useState<Array<{ id: string; prefix: string; model?: string; brand?: string }>>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [filters, setFilters] = useState<ExpenseFiltersType>({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para modal de confirmação
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseWithRelations | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Recarregar dados quando filtros mudarem
  useEffect(() => {
    if (!loading) {
      console.log('🔄 [FinancialDashboard] Recarregando dados com filtros:', filters);
      loadExpenses();
      loadStats();
    }
  }, [filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [pumpsData, companiesData] = await Promise.all([
        getPumpsForSelect(),
        getCompaniesForSelect()
      ]);
      
      setPumps(pumpsData);
      setCompanies(companiesData);
      
      await Promise.all([
        loadExpenses(),
        loadStats(),
        loadFaturamentoStats(),
        loadFaturamentoData(),
        loadFaturamentoMensal(),
        loadVolumeDiario(),
        loadVolumeSemanal(),
        loadVolumeMensal(),
        loadPagamentosStats(),
        loadPagamentosProximos(),
        loadColaboradoresCosts(),
        loadDadosPorEmpresa()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      const data = await getExpenses(filters);
      setExpenses(data);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getFinancialStats(filters);
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadFaturamentoStats = async () => {
    try {
      const data = await getFaturamentoBrutoStats();
      setFaturamentoStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas de faturamento:', error);
    }
  };

  const loadFaturamentoData = async () => {
    try {
      const data = await getFaturamentoBruto(20);
      setFaturamentoData(data);
    } catch (error) {
      console.error('Erro ao carregar dados de faturamento:', error);
    }
  };

  const loadFaturamentoMensal = async () => {
    try {
      const data = await getFaturamentoMensal();
      setFaturamentoMensal(data);
    } catch (error) {
      console.error('Erro ao carregar faturamento mensal:', error);
    }
  };

  const loadVolumeDiario = async () => {
    try {
      const data = await getVolumeDiarioComBombas();
      setVolumeDiario(data);
    } catch (error) {
      console.error('Erro ao carregar volume diário:', error);
    }
  };

  const loadVolumeSemanal = async () => {
    try {
      const data = await getVolumeSemanalComBombas();
      setVolumeSemanal(data);
    } catch (error) {
      console.error('Erro ao carregar volume semanal:', error);
    }
  };

  const loadVolumeMensal = async () => {
    try {
      const data = await getVolumeMensalComBombas();
      setVolumeMensal(data);
    } catch (error) {
      console.error('Erro ao carregar volume mensal:', error);
    }
  };

  const loadPagamentosStats = async () => {
    try {
      const data = await getPagamentosReceberStats();
      setPagamentosStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas de pagamentos:', error);
    }
  };

  const loadPagamentosProximos = async () => {
    try {
      const data = await getPagamentosProximosVencimento();
      setPagamentosProximos(data);
    } catch (error) {
      console.error('Erro ao carregar pagamentos próximos:', error);
    }
  };

  const loadColaboradoresCosts = async () => {
    try {
      const data = await getColaboradoresCosts();
      setColaboradoresCosts(data);
    } catch (error) {
      console.error('Erro ao carregar custos de colaboradores:', error);
    }
  };

  const loadDadosPorEmpresa = async () => {
    try {
      const data = await getDadosFinanceirosPorEmpresa();
      setDadosPorEmpresa(data);
    } catch (error) {
      console.error('Erro ao carregar dados por empresa:', error);
    }
  };

  const handleFiltersChange = (newFilters: ExpenseFiltersType) => {
    console.log('🔍 [FinancialDashboard] Filtros alterados:', newFilters);
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleQuickFilter = (filter: ExpenseFiltersType) => {
    console.log('🚀 [FinancialDashboard] Aplicando filtro rápido:', filter);
    setFilters(prev => ({ ...prev, ...filter }));
  };

  const handleExport = () => {
    // TODO: Implementar exportação
    console.log('Exportar dados');
  };

  const handleEditExpense = (expense: ExpenseWithRelations) => {
    navigate(`/financial/expenses/edit/${expense.id}`);
  };

  const handleDeleteExpense = (expense: ExpenseWithRelations) => {
    setExpenseToDelete(expense);
    setShowDeleteModal(true);
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      setDeleting(true);
      await deleteExpense(expenseToDelete.id);
      
      // Recarregar dados após exclusão
      await Promise.all([
        loadExpenses(),
        loadStats()
      ]);
      
      // Fechar modal
      setShowDeleteModal(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      alert('Erro ao excluir despesa. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteExpense = () => {
    setShowDeleteModal(false);
    setExpenseToDelete(null);
  };

  const handleViewExpense = (expense: ExpenseWithRelations) => {
    navigate(`/financial/expenses/view/${expense.id}`);
  };

  // Calcular totais para resumo
  const totalValue = expenses.reduce((sum, expense) => sum + expense.valor, 0);
  const averageValue = expenses.length > 0 ? totalValue / expenses.length : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
          <p className="text-gray-600 mt-1">
            Controle completo de faturamento bruto, despesas e análise financeira
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
          <Button
            onClick={() => navigate('/financial/folha-salarial')}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Users className="h-4 w-4" />
            Folha Salarial
          </Button>
          <Button
            onClick={() => navigate('/financial/expenses/new')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="space-y-4">
          <AdvancedFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            pumps={pumps}
            companies={companies}
          />
          <QuickFilters
            onApplyFilter={handleQuickFilter}
            onClearFilters={handleClearFilters}
          />
        </div>
      )}

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <KPICard
          title="Faturamento Bruto"
          value={faturamentoStats?.total_faturado || 0}
          icon="💰"
          color="green"
          subtitle={`${faturamentoStats?.total_relatorios_pagos || 0} relatórios pagos`}
        />
        <KPICard
          title="Faturado Hoje"
          value={faturamentoStats?.faturado_hoje || 0}
          icon="📈"
          color="blue"
          subtitle={`${faturamentoStats?.relatorios_hoje || 0} relatórios hoje`}
        />
        <KPICard
          title="Total de Despesas"
          value={stats?.total_despesas || 0}
          icon="💸"
          color="red"
          subtitle={`${expenses.length} despesas`}
        />
        <KPICard
          title="Volume Bombeado"
          value={`${(faturamentoStats?.volume_total_bombeado || 0).toFixed(2)} m³`}
          icon="🚛"
          color="orange"
          subtitle="volume total bombeado"
        />
      </div>

      {/* KPIs de Pagamentos a Receber */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <KPICard
          title="Total a Receber"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pagamentosStats?.total_valor || 0)}
          icon="💰"
          color="green"
          subtitle={`${pagamentosStats?.total_pagamentos || 0} pagamentos`}
        />
        <KPICard
          title="Aguardando"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pagamentosStats?.valor_aguardando || 0)}
          icon="⏳"
          color="blue"
          subtitle={`${pagamentosStats?.aguardando || 0} pagamentos`}
        />
        <KPICard
          title="Próximo Vencimento"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pagamentosStats?.valor_proximo_vencimento || 0)}
          icon="⚠️"
          color="orange"
          subtitle={`${pagamentosStats?.proximo_vencimento || 0} pagamentos`}
        />
        <KPICard
          title="Vencidos"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pagamentosStats?.valor_vencido || 0)}
          icon="🚨"
          color="red"
          subtitle={`${pagamentosStats?.vencido || 0} pagamentos`}
        />
      </div>

      {/* Novos KPIs de Volume e Faturamento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <KPICard
          title="Faturamento Mês"
          value={faturamentoMensal.reduce((sum, item) => sum + (item.faturamento_total || 0), 0)}
          icon="📅"
          color="green"
          subtitle={`${faturamentoMensal.reduce((sum, item) => sum + (item.total_relatorios || 0), 0)} relatórios no mês`}
        />
        <KPICard
          title="Volume Diário"
          value={`${volumeDiario.reduce((sum, item) => sum + (item.volume_total || 0), 0).toFixed(2)} m³`}
          icon="📊"
          color="blue"
          subtitle={`${volumeDiario.length} bombas ativas hoje`}
        />
        <KPICard
          title="Volume Semanal"
          value={`${volumeSemanal.reduce((sum, item) => sum + (item.volume_total || 0), 0).toFixed(2)} m³`}
          icon="📈"
          color="purple"
          subtitle={`${volumeSemanal.length} bombas na semana`}
        />
        <KPICard
          title="Volume Mensal"
          value={`${volumeMensal.reduce((sum, item) => sum + (item.volume_total || 0), 0).toFixed(2)} m³`}
          icon="📋"
          color="purple"
          subtitle={`${volumeMensal.length} bombas no mês`}
        />
      </div>

      {/* Alerta de Folha Salarial */}
      <FolhaSalarialAlert />

      {/* Resumo Financeiro por Empresa */}
      <CompanyFinancialCard showAllCompanies={true} />

      {/* Detalhes por Bomba */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Volume Diário por Bomba */}
        {volumeDiario.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Volume Diário por Bomba
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {volumeDiario.slice(0, 5).map((item) => (
                  <div key={item.pump_prefix} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{item.pump_prefix}</p>
                      <p className="text-xs text-gray-500">{item.total_servicos} serviços</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">
                        {item.volume_total?.toFixed(2) || 0} m³
                      </p>
                      <p className="text-xs text-green-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.faturamento_total || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Volume Semanal por Bomba */}
        {volumeSemanal.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📈 Volume Semanal por Bomba
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {volumeSemanal.slice(0, 5).map((item) => (
                  <div key={item.pump_prefix} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{item.pump_prefix}</p>
                      <p className="text-xs text-gray-500">{item.total_servicos} serviços</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-purple-600">
                        {item.volume_total?.toFixed(2) || 0} m³
                      </p>
                      <p className="text-xs text-green-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.faturamento_total || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Volume Mensal por Bomba */}
        {volumeMensal.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 Volume Mensal por Bomba
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {volumeMensal.slice(0, 5).map((item) => (
                  <div key={item.pump_prefix} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{item.pump_prefix}</p>
                      <p className="text-xs text-gray-500">{item.total_servicos} serviços</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-indigo-600">
                        {item.volume_total?.toFixed(2) || 0} m³
                      </p>
                      <p className="text-xs text-green-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.faturamento_total || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Seção de Dados Recentes */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Faturamento Bruto Recente */}
        {faturamentoData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 Faturamento Bruto Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        RELATÓRIO
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        CLIENTE
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        BOMBA
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        DATA
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        VALOR
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        VOLUME
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {faturamentoData.slice(0, 8).map((item) => (
                      <tr key={item.relatorio_id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            <div className="font-semibold text-gray-900 truncate">{item.report_number}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            <div className="font-semibold text-gray-900 truncate">{item.cliente_nome}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            <div className="font-semibold text-gray-900 truncate">{item.bomba_prefix}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            <div className="text-gray-600">{new Date(item.data_relatorio).toLocaleDateString('pt-BR')}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            <div className="font-medium text-green-600 text-right">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_relatorio)}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            <div className="text-gray-600 text-right">{item.realized_volume || 0} m³</div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagamentos Próximos do Vencimento */}
        {pagamentosProximos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚠️ Pagamentos Próximos do Vencimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pagamentosProximos.slice(0, 8).map((pagamento) => (
                  <div key={pagamento.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{pagamento.cliente_nome || 'Cliente não identificado'}</p>
                      <p className="text-xs text-gray-500">
                        {pagamento.empresa_nome} • Vence em {new Date(pagamento.prazo_data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pagamento.valor_total)}
                      </p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {pagamento.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Despesas Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💸 Despesas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenses.slice(0, 8).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{expense.descricao}</p>
                    <p className="text-xs text-gray-500">
                      {expense.bomba_prefix} • {expense.categoria} • {new Date(expense.data_despesa).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.valor)}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      expense.status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {expense.status}
                    </span>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma despesa encontrada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="space-y-6">
        {stats && (
          <>
            <ExpenseCharts stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CompactCharts stats={stats} />
            </div>
          </>
        )}
      </div>

      {/* Estatísticas por Categoria */}
      {stats && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Despesas por Categoria</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.total_por_categoria).map(([category, total]) => {
              const percentage = stats.total_despesas > 0 
                ? (total / stats.total_despesas) * 100 
                : 0;
              
              return (
                <CategoryStatsCard
                  key={category}
                  category={category}
                  total={total}
                  percentage={percentage}
                  color="bg-blue-50"
                  icon={category === 'Mão de obra' ? '👷' : 
                        category === 'Diesel' ? '⛽' : 
                        category === 'Manutenção' ? '🔧' : 
                        category === 'Imposto' ? '📋' : '📦'}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Resumo da Tabela */}
      <TableSummary
        totalExpenses={expenses.length}
        totalValue={totalValue}
        averageValue={averageValue}
        faturamentoBruto={faturamentoStats?.total_faturado || 0}
      />

      {/* Lista Completa de Despesas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              📋 Lista Completa de Despesas
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {expenses.length} despesas
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseTable
            expenses={expenses}
            onEdit={handleEditExpense}
            onDelete={handleDeleteExpense}
            onView={handleViewExpense}
            onExport={handleExport}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDeleteExpense}
        onConfirm={confirmDeleteExpense}
        title="Excluir Despesa"
        message={
          expenseToDelete 
            ? `Tem certeza que deseja excluir a despesa "${expenseToDelete.descricao}"? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir esta despesa?'
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        loading={deleting}
      />
        </div>
      </div>
    </div>
  );
}

