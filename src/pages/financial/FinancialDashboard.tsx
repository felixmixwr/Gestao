import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar, Filter, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { KPICard, CategoryStatsCard } from '../../components/financial/ExpenseCard';
import { ExpenseTable, TableSummary } from '../../components/financial/ExpenseTable';
import { ExpenseCharts, CompactCharts } from '../../components/financial/ExpenseCharts';
import { ExpenseFilters, QuickFilters } from '../../components/financial/ExpenseFilters';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { 
  getExpenses, 
  getFinancialStats, 
  getPumpsForSelect, 
  getCompaniesForSelect,
  deleteExpense
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
        loadStats()
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

  const handleFiltersChange = (newFilters: ExpenseFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleQuickFilter = (filter: ExpenseFiltersType) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
          <p className="text-gray-600 mt-1">
            Controle completo de despesas e análise financeira
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
          <ExpenseFilters
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total de Despesas"
          value={stats?.total_despesas || 0}
          icon="💰"
          color="blue"
          subtitle={`${expenses.length} despesas`}
        />
        <KPICard
          title="Despesas por Bomba"
          value={stats?.total_por_bomba.length || 0}
          icon="🚛"
          color="green"
          subtitle="Bombas ativas"
        />
        <KPICard
          title="Despesas por Empresa"
          value={stats?.total_por_empresa.length || 0}
          icon="🏢"
          color="orange"
          subtitle="Empresas"
        />
        <KPICard
          title="Categorias"
          value={Object.keys(stats?.total_por_categoria || {}).length}
          icon="📊"
          color="purple"
          subtitle="Tipos diferentes"
        />
      </div>

      {/* Gráficos */}
      <div className="space-y-6">
        {stats && (
          <>
            <ExpenseCharts stats={stats} />
            <CompactCharts stats={stats} />
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
      />

      {/* Tabela de Despesas */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Despesas Recentes</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {expenses.length} despesas
            </Badge>
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
        </div>
        
        <ExpenseTable
          expenses={expenses}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
          onView={handleViewExpense}
          onExport={handleExport}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          pumps={pumps}
          companies={companies}
        />
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚡ Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/financial/expenses/new')}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <Plus className="h-6 w-6" />
              <span>Nova Despesa</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/financial/reports')}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <Calendar className="h-6 w-6" />
              <span>Relatórios</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/financial/invoices')}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <DollarSign className="h-6 w-6" />
              <span>Notas Fiscais</span>
            </Button>
          </div>
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
  );
}

