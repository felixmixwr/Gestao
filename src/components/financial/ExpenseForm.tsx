import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Calculator, Fuel } from 'lucide-react';
import { formatCurrency, calculateFuelTotal } from '../../types/financial';
import type { 
  ExpenseWithRelations, 
  CreateExpenseData, 
  UpdateExpenseData
} from '../../types/financial';
import { EXPENSE_CATEGORY_OPTIONS, EXPENSE_TYPE_OPTIONS } from '../../types/financial';

// Schema de validação com Zod
const expenseSchema = z.object({
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  categoria: z.enum(['Mão de obra', 'Diesel', 'Manutenção', 'Imposto', 'Outros'], {
    required_error: 'Selecione uma categoria'
  }),
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  tipo_custo: z.enum(['fixo', 'variável'], {
    required_error: 'Selecione um tipo de custo'
  }),
  data_despesa: z.string().min(1, 'Data é obrigatória'),
  bomba_id: z.string().min(1, 'Selecione uma bomba'),
  company_id: z.string().min(1, 'Selecione uma empresa'),
  quilometragem_atual: z.number().min(0).optional(),
  quantidade_litros: z.number().min(0).optional(),
  custo_por_litro: z.number().min(0).optional(),
  observacoes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: ExpenseWithRelations;
  onSubmit: (data: CreateExpenseData | UpdateExpenseData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  pumps: Array<{ id: string; prefix: string; model?: string; brand?: string }>;
  companies: Array<{ id: string; name: string }>;
}

export function ExpenseForm({
  expense,
  onSubmit,
  onCancel,
  loading = false,
  pumps,
  companies
}: ExpenseFormProps) {
  const [showFuelFields, setShowFuelFields] = useState(false);
  const [calculatedValue, setCalculatedValue] = useState<number>(0);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      descricao: expense?.descricao || '',
      categoria: expense?.categoria || 'Outros',
      valor: expense?.valor || 0,
      tipo_custo: expense?.tipo_custo || 'variável',
      data_despesa: expense?.data_despesa || new Date().toISOString().split('T')[0],
      bomba_id: expense?.bomba_id || '',
      company_id: expense?.company_id || '',
      quilometragem_atual: expense?.quilometragem_atual || 0,
      quantidade_litros: expense?.quantidade_litros || 0,
      custo_por_litro: expense?.custo_por_litro || 0,
      observacoes: expense?.observacoes || '',
    }
  });

  const selectedCategory = watch('categoria');
  const quantidadeLitros = watch('quantidade_litros') || 0;
  const custoPorLitro = watch('custo_por_litro') || 0;

  // Monitorar mudanças na categoria
  useEffect(() => {
    setShowFuelFields(selectedCategory === 'Diesel');
  }, [selectedCategory]);

  // Calcular valor automaticamente para diesel
  useEffect(() => {
    if (showFuelFields && quantidadeLitros > 0 && custoPorLitro > 0) {
      const total = calculateFuelTotal(quantidadeLitros, custoPorLitro);
      setCalculatedValue(total);
      setValue('valor', total);
    }
  }, [quantidadeLitros, custoPorLitro, showFuelFields, setValue]);

  const handleFormSubmit = async (data: ExpenseFormData) => {
    try {
      if (expense) {
        // Edição
        const updateData: UpdateExpenseData = {
          id: expense.id,
          ...data
        };
        await onSubmit(updateData);
      } else {
        // Criação
        await onSubmit(data);
      }
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {expense ? '✏️ Editar Despesa' : '➕ Nova Despesa'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                {...register('descricao')}
                placeholder="Ex: Abastecimento de diesel para bomba WM-001"
                className={errors.descricao ? 'border-red-500' : ''}
              />
              {errors.descricao && (
                <p className="text-sm text-red-600">{errors.descricao.message}</p>
              )}
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Controller
                name="categoria"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.categoria ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
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
                )}
              />
              {errors.categoria && (
                <p className="text-sm text-red-600">{errors.categoria.message}</p>
              )}
            </div>

            {/* Campos específicos para Diesel */}
            {showFuelFields && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <Fuel className="h-5 w-5" />
                  <span className="font-medium">Informações do Combustível</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quilometragem_atual">Quilometragem Atual (km)</Label>
                    <Input
                      id="quilometragem_atual"
                      type="number"
                      {...register('quilometragem_atual', { valueAsNumber: true })}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantidade_litros">Quantidade (L)</Label>
                    <Input
                      id="quantidade_litros"
                      type="number"
                      step="0.01"
                      {...register('quantidade_litros', { valueAsNumber: true })}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custo_por_litro">Custo por Litro (R$)</Label>
                    <Input
                      id="custo_por_litro"
                      type="number"
                      step="0.01"
                      {...register('custo_por_litro', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Cálculo automático */}
                {quantidadeLitros > 0 && custoPorLitro > 0 && (
                  <Alert>
                    <Calculator className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Valor calculado automaticamente:</strong> {formatCurrency(calculatedValue)}
                      <br />
                      <span className="text-sm text-gray-600">
                        {quantidadeLitros}L × {formatCurrency(custoPorLitro)} = {formatCurrency(calculatedValue)}
                      </span>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="valor">Valor da Despesa (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                {...register('valor', { valueAsNumber: true })}
                placeholder="0.00"
                className={errors.valor ? 'border-red-500' : ''}
                disabled={showFuelFields && quantidadeLitros > 0 && custoPorLitro > 0}
              />
              {errors.valor && (
                <p className="text-sm text-red-600">{errors.valor.message}</p>
              )}
              {showFuelFields && quantidadeLitros > 0 && custoPorLitro > 0 && (
                <p className="text-sm text-blue-600">
                  💡 Valor calculado automaticamente baseado na quantidade e custo por litro
                </p>
              )}
            </div>

            {/* Tipo de Custo */}
            <div className="space-y-2">
              <Label>Tipo de Custo *</Label>
              <Controller
                name="tipo_custo"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.tipo_custo ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.tipo_custo && (
                <p className="text-sm text-red-600">{errors.tipo_custo.message}</p>
              )}
            </div>

            {/* Data da Despesa */}
            <div className="space-y-2">
              <Label htmlFor="data_despesa">Data da Despesa *</Label>
              <Input
                id="data_despesa"
                type="date"
                {...register('data_despesa')}
                className={errors.data_despesa ? 'border-red-500' : ''}
              />
              {errors.data_despesa && (
                <p className="text-sm text-red-600">{errors.data_despesa.message}</p>
              )}
            </div>

            {/* Bomba */}
            <div className="space-y-2">
              <Label>Bomba *</Label>
              <Controller
                name="bomba_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.bomba_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione uma bomba" />
                    </SelectTrigger>
                    <SelectContent>
                      {pumps.map((pump) => (
                        <SelectItem key={pump.id} value={pump.id}>
                          {pump.prefix} - {pump.model || 'N/A'} ({pump.brand || 'N/A'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.bomba_id && (
                <p className="text-sm text-red-600">{errors.bomba_id.message}</p>
              )}
            </div>

            {/* Empresa */}
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <Controller
                name="company_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.company_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.company_id && (
                <p className="text-sm text-red-600">{errors.company_id.message}</p>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                {...register('observacoes')}
                placeholder="Informações adicionais sobre a despesa..."
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || loading}
                className="flex items-center gap-2"
              >
                {isSubmitting || loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    {expense ? 'Atualizar' : 'Salvar'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para visualização de despesa (read-only)
interface ExpenseViewProps {
  expense: ExpenseWithRelations;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
}

export function ExpenseView({ expense, onEdit, onDelete, onClose }: ExpenseViewProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{expense.categoria === 'Mão de obra' ? '👷' : 
                                        expense.categoria === 'Diesel' ? '⛽' : 
                                        expense.categoria === 'Manutenção' ? '🔧' : 
                                        expense.categoria === 'Imposto' ? '📋' : '📦'}</span>
              {expense.descricao}
            </CardTitle>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  Editar
                </Button>
              )}
              {onDelete && (
                <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600">
                  Excluir
                </Button>
              )}
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Fechar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Valor</Label>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(expense.valor)}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Data</Label>
              <p className="text-lg font-medium">
                {new Date(expense.data_despesa).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Categoria</Label>
              <Badge className="text-base px-3 py-1">
                {expense.categoria}
              </Badge>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Tipo</Label>
              <p className="text-lg font-medium capitalize">{expense.tipo_custo}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Bomba</Label>
              <p className="text-lg font-medium">{expense.bomba_prefix || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Empresa</Label>
              <p className="text-lg font-medium">{expense.company_name || 'N/A'}</p>
            </div>
          </div>

          {/* Informações específicas do Diesel */}
          {expense.categoria === 'Diesel' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-3">Informações do Combustível</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Quilometragem</Label>
                  <p className="text-lg font-medium">{expense.quilometragem_atual || 0} km</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Quantidade</Label>
                  <p className="text-lg font-medium">{expense.quantidade_litros || 0}L</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Custo/L</Label>
                  <p className="text-lg font-medium">{formatCurrency(expense.custo_por_litro || 0)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          {expense.observacoes && (
            <div>
              <Label className="text-sm text-gray-600">Observações</Label>
              <p className="text-gray-800 mt-1 p-3 bg-gray-50 rounded-lg">
                {expense.observacoes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



