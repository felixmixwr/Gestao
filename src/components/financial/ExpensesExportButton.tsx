import React, { useState } from 'react';
import { Download, FileText, Settings, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { ExpensesExporter, ExpensesExportData, ExpensesExportOptions } from '../../utils/expenses-exporter';
import { ExpenseWithRelations } from '../../types/financial';
import { toast } from '../../lib/toast';

interface ExpensesExportButtonProps {
  expenses: ExpenseWithRelations[];
  filters?: {
    company_id?: string;
    pump_id?: string;
    categoria?: string[];
    tipo_custo?: string[];
    status?: string[];
    data_inicio?: string;
    data_fim?: string;
  };
  companyName?: string;
  pumpPrefix?: string;
  disabled?: boolean;
}

export function ExpensesExportButton({
  expenses,
  filters,
  companyName,
  pumpPrefix,
  disabled = false
}: ExpensesExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExpensesExportOptions>({
    itemsPerPage: 25,
    includeCharts: false,
    includeSummary: true
  });

  const handleExport = async () => {
    if (expenses.length === 0) {
      toast.error('Nenhuma despesa encontrada para exportar');
      return;
    }

    setIsExporting(true);
    
    try {
      const exportData: ExpensesExportData = {
        expenses,
        filters,
        companyName,
        pumpPrefix
      };

      await ExpensesExporter.exportToPDF(exportData, exportOptions);
      
      toast.success(`PDF exportado com sucesso! ${expenses.length} despesas incluídas.`);
      setIsOpen(false);
      
    } catch (error) {
      console.error('Erro ao exportar despesas:', error);
      toast.error('Erro ao exportar PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const getTotalValue = () => {
    return expenses.reduce((sum, expense) => sum + Math.abs(expense.valor), 0);
  };

  const getPaidExpenses = () => {
    return expenses.filter(expense => expense.status === 'pago').length;
  };

  const getPendingExpenses = () => {
    return expenses.filter(expense => expense.status === 'pendente').length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || expenses.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Exportar PDF
          {expenses.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {expenses.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exportar Despesas para PDF
          </DialogTitle>
          <DialogDescription>
            Configure as opções de exportação para gerar um relatório profissional das despesas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo das despesas */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Resumo das Despesas</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total de despesas:</span>
                <div className="font-semibold">{expenses.length}</div>
              </div>
              <div>
                <span className="text-gray-600">Valor total:</span>
                <div className="font-semibold text-red-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(getTotalValue())}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Despesas pagas:</span>
                <div className="font-semibold text-green-600">{getPaidExpenses()}</div>
              </div>
              <div>
                <span className="text-gray-600">Despesas pendentes:</span>
                <div className="font-semibold text-yellow-600">{getPendingExpenses()}</div>
              </div>
            </div>
          </div>

          {/* Opções de exportação */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Opções de Exportação
            </h4>

            {/* Itens por página */}
            <div className="space-y-2">
              <Label htmlFor="itemsPerPage">Itens por página</Label>
              <select
                id="itemsPerPage"
                value={exportOptions.itemsPerPage.toString()}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  itemsPerPage: parseInt(e.target.value) as 25 | 50 | 100 | 200
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="25">25 itens (padrão)</option>
                <option value="50">50 itens</option>
                <option value="100">100 itens</option>
                <option value="200">200 itens</option>
              </select>
              <p className="text-xs text-gray-500">
                {Math.ceil(expenses.length / exportOptions.itemsPerPage)} página(s) serão geradas
              </p>
            </div>

            {/* Incluir resumo executivo */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="includeSummary">Incluir resumo executivo</Label>
                <p className="text-xs text-gray-500">
                  Adiciona estatísticas e análises no início do relatório
                </p>
              </div>
              <Switch
                id="includeSummary"
                checked={exportOptions.includeSummary}
                onCheckedChange={(checked) => setExportOptions(prev => ({
                  ...prev,
                  includeSummary: checked
                }))}
              />
            </div>

            {/* Incluir gráficos */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="includeCharts">Incluir gráficos</Label>
                <p className="text-xs text-gray-500">
                  Adiciona gráficos profissionais de análise no final do relatório (pizza, barras, tabelas)
                </p>
              </div>
              <Switch
                id="includeCharts"
                checked={exportOptions.includeCharts}
                onCheckedChange={(checked) => setExportOptions(prev => ({
                  ...prev,
                  includeCharts: checked
                }))}
              />
            </div>
          </div>

          {/* Informações do arquivo */}
          <div className="bg-blue-50 rounded-lg p-3">
            <h5 className="font-medium text-blue-900 mb-2">Informações do Arquivo</h5>
            <div className="text-sm text-blue-800 space-y-1">
              <div>Formato: PDF (A4)</div>
              <div>Orientação: Retrato</div>
              <div>Páginas estimadas: {Math.ceil(expenses.length / exportOptions.itemsPerPage) + (exportOptions.includeCharts ? 1 : 0)}</div>
              <div>Estrutura: Cabeçalho → Resumo → Despesas → Gráficos</div>
              {companyName && <div>Empresa: {companyName}</div>}
              {pumpPrefix && <div>Bomba: {pumpPrefix}</div>}
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || expenses.length === 0}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Gerar PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
