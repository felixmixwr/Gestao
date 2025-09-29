import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ExpenseForm, ExpenseView } from '../../components/financial/ExpenseForm';
import { createExpense, updateExpense, getExpenseById, getPumpsForSelect, getCompaniesForSelect } from '../../lib/financialApi';
import type { ExpenseWithRelations, CreateExpenseData, UpdateExpenseData } from '../../types/financial';

export function CreateExpense() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  
  const [expense, setExpense] = useState<ExpenseWithRelations | null>(null);
  const [pumps, setPumps] = useState<Array<{ id: string; prefix: string; model?: string; brand?: string }>>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [pumpsData, companiesData] = await Promise.all([
        getPumpsForSelect(),
        getCompaniesForSelect()
      ]);
      
      setPumps(pumpsData);
      setCompanies(companiesData);

      // Se está editando, carregar a despesa
      if (isEditing && id) {
        const expenseData = await getExpenseById(id);
        setExpense(expenseData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CreateExpenseData | UpdateExpenseData) => {
    try {
      setSaving(true);
      
      if (isEditing) {
        await updateExpense(data as UpdateExpenseData);
      } else {
        await createExpense(data as CreateExpenseData);
      }
      
      // Redirecionar para o dashboard
      navigate('/financial');
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      // TODO: Mostrar toast de erro
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/financial');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
          
          {/* Form skeleton */}
          <div className="space-y-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
              </div>
            ))}
          </div>
          
          {/* Buttons skeleton */}
          <div className="flex justify-end gap-3">
            <div className="h-10 bg-gray-200 rounded w-20 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Despesa' : 'Nova Despesa'}
          </h1>
        </div>
        
        {isEditing && expense && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <span className="font-medium">Editando:</span>
              <span>{expense.descricao}</span>
              <span className="text-sm">({new Date(expense.data_despesa).toLocaleDateString('pt-BR')})</span>
            </div>
          </div>
        )}
      </div>

      {/* Formulário */}
      <ExpenseForm
        expense={expense || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={saving}
        pumps={pumps}
        companies={companies}
      />

      {/* Informações adicionais */}
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <h3 className="font-medium text-gray-900">💡 Dicas</h3>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>
                <strong>Despesas de Diesel:</strong> Ao selecionar a categoria "Diesel", 
                campos adicionais aparecerão para controle detalhado do combustível.
              </span>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>
                <strong>Cálculo Automático:</strong> Para despesas de combustível, 
                o valor total é calculado automaticamente baseado na quantidade e preço por litro.
              </span>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>
                <strong>Observações:</strong> Use o campo de observações para adicionar 
                informações importantes sobre a despesa.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Página para visualizar despesa (read-only)
export function ViewExpense() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [expense, setExpense] = useState<ExpenseWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadExpense();
    }
  }, [id]);

  const loadExpense = async () => {
    try {
      setLoading(true);
      const data = await getExpenseById(id!);
      setExpense(data);
    } catch (error) {
      console.error('Erro ao carregar despesa:', error);
      navigate('/financial');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (expense) {
      navigate(`/financial/expenses/edit/${expense.id}`);
    }
  };

  const handleDelete = async () => {
    if (expense && window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        // TODO: Implementar exclusão
        console.log('Excluir despesa:', expense.id);
        navigate('/financial');
      } catch (error) {
        console.error('Erro ao excluir despesa:', error);
      }
    }
  };

  const handleClose = () => {
    navigate('/financial');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
          <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="space-y-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Despesa não encontrada</h1>
          <p className="text-gray-600 mb-6">
            A despesa que você está procurando não foi encontrada ou não existe mais.
          </p>
          <Button onClick={handleClose}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Detalhes da Despesa</h1>
        </div>
      </div>

      {/* Visualização da despesa */}
      <ExpenseView
        expense={expense}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClose={handleClose}
      />
    </div>
  );
}

