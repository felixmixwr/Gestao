import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { 
  getPaidInvoices, 
  createExpenseFromInvoice, 
  getPumpsForSelect, 
  getCompaniesForSelect 
} from '../../lib/financialApi';
import { formatCurrency } from '../../types/financial';
import type { InvoiceIntegration, CreateExpenseData } from '../../types/financial';

export function InvoicesIntegration() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceIntegration[]>([]);
  const [pumps, setPumps] = useState<Array<{ id: string; prefix: string; model?: string; brand?: string }>>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [invoicesData, pumpsData, companiesData] = await Promise.all([
        getPaidInvoices(),
        getPumpsForSelect(),
        getCompaniesForSelect()
      ]);
      
      setInvoices(invoicesData);
      setPumps(pumpsData);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (invoice: InvoiceIntegration) => {
    try {
      setProcessing(invoice.nota_fiscal_id);
      
      // Buscar bomba e empresa relacionadas
      const bomba = pumps.find(p => p.prefix === invoice.bomba_prefix);
      const empresa = companies.find(c => c.name === invoice.empresa_nome);
      
      if (!bomba || !empresa) {
        alert('Não foi possível encontrar a bomba ou empresa relacionada. Verifique os dados.');
        return;
      }
      
      const expenseData: Partial<CreateExpenseData> = {
        bomba_id: bomba.id,
        company_id: empresa.id,
        categoria: 'Outros', // Categoria padrão
        tipo_custo: 'variável',
        status: 'pago'
      };
      
      await createExpenseFromInvoice(invoice.nota_fiscal_id, expenseData);
      
      // Recarregar lista
      await loadInitialData();
      
      alert('Despesa criada com sucesso a partir da nota fiscal!');
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      alert('Erro ao criar despesa. Tente novamente.');
    } finally {
      setProcessing(null);
    }
  };

  const handleBack = () => {
    navigate('/financial');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paga':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Faturada':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'Cancelada':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paga':
        return 'bg-green-100 text-green-800';
      case 'Faturada':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
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
          <h1 className="text-3xl font-bold text-gray-900">Integração com Notas Fiscais</h1>
          <p className="text-gray-600 mt-1">
            Gerencie despesas criadas automaticamente a partir de notas fiscais pagas
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Notas</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notas Pagas</p>
                <p className="text-2xl font-bold text-green-600">
                  {invoices.filter(inv => inv.status === 'Paga').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(invoices.reduce((sum, inv) => sum + inv.valor, 0))}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Notas Fiscais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notas Fiscais Pagas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma nota fiscal encontrada
              </h3>
              <p className="text-gray-600">
                Não há notas fiscais com status "Paga" para integração.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Data Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Bomba</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.nota_fiscal_id}>
                      <TableCell className="font-medium">
                        {invoice.numero_nota}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(invoice.valor)}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.data_emissao).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.data_vencimento).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(invoice.status)}
                            {invoice.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.empresa_nome || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {invoice.bomba_prefix || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleCreateExpense(invoice)}
                          disabled={processing === invoice.nota_fiscal_id}
                          className="flex items-center gap-2"
                        >
                          {processing === invoice.nota_fiscal_id ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Criando...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Criar Despesa
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ℹ️ Como funciona a integração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <span className="text-blue-500 mt-1">1.</span>
              <div>
                <strong>Busca Automática:</strong> O sistema busca automaticamente todas as notas fiscais 
                com status "Paga" na tabela de notas fiscais.
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-1">2.</span>
              <div>
                <strong>Criação de Despesa:</strong> Ao clicar em "Criar Despesa", uma nova entrada 
                é criada na tabela de despesas com os dados da nota fiscal.
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-orange-500 mt-1">3.</span>
              <div>
                <strong>Dados Mapeados:</strong> Os dados são mapeados automaticamente:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Valor da nota → Valor da despesa</li>
                  <li>Data de emissão → Data da despesa</li>
                  <li>Empresa relacionada → Empresa da despesa</li>
                  <li>Bomba relacionada → Bomba da despesa</li>
                  <li>Status definido como "Pago"</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-purple-500 mt-1">4.</span>
              <div>
                <strong>Edição Posterior:</strong> Após criar a despesa, você pode editá-la 
                normalmente para ajustar categoria, tipo de custo e outras informações.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

