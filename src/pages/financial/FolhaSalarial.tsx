import { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, CheckCircle, DollarSign, Users, Clock, Truck } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useToast } from '../../lib/toast-hooks';
import { supabase } from '../../lib/supabase';
import { getCorFuncao, formatarSalario } from '../../types/colaboradores';
import type { Colaborador } from '../../types/colaboradores';

interface PagamentoFuncionario {
  id: string;
  nome: string;
  funcao: string;
  tipo_contrato: 'fixo' | 'diarista';
  salario_fixo: number;
  valor_pagamento_1: number;
  valor_pagamento_2: number;
  data_pagamento_1: string;
  data_pagamento_2: string;
  status_pagamento_1: 'pendente' | 'pago' | 'atrasado';
  status_pagamento_2: 'pendente' | 'pago' | 'atrasado';
  dias_ate_pagamento_1: number;
  dias_ate_pagamento_2: number;
  company_id: string;
}

interface ResumoPagamentos {
  total_pagamento_1: number;
  total_pagamento_2: number;
  funcionarios_pagamento_1: number;
  funcionarios_pagamento_2: number;
  proximos_vencimentos: PagamentoFuncionario[];
}

interface Bomba {
  id: string;
  prefix: string;
  model?: string;
  brand?: string;
}

export function FolhaSalarial() {
  const [funcionarios, setFuncionarios] = useState<PagamentoFuncionario[]>([]);
  const [resumo, setResumo] = useState<ResumoPagamentos | null>(null);
  const [bombas, setBombas] = useState<Bomba[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBombaModal, setShowBombaModal] = useState(false);
  const [funcionarioParaPagar, setFuncionarioParaPagar] = useState<PagamentoFuncionario | null>(null);
  const [tipoPagamento, setTipoPagamento] = useState<'pagamento_1' | 'pagamento_2' | 'diaria'>('pagamento_1');
  const [bombaSelecionada, setBombaSelecionada] = useState<Bomba | null>(null);
  const [processando, setProcessando] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadFolhaSalarial();
  }, []);

  const loadFolhaSalarial = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 [FolhaSalarial] Iniciando carregamento...');
      
      // Buscar todos os colaboradores e bombas
      const [colaboradoresResult, bombasResult] = await Promise.all([
        supabase
          .from('colaboradores')
          .select('*')
          .order('nome'),
        supabase
          .from('pumps')
          .select('id, prefix, model, brand')
          .order('prefix')
      ]);

      console.log('📊 [FolhaSalarial] Resultado colaboradores:', colaboradoresResult);
      console.log('🚛 [FolhaSalarial] Resultado bombas:', bombasResult);

      if (colaboradoresResult.error) {
        console.error('❌ [FolhaSalarial] Erro colaboradores:', colaboradoresResult.error);
        throw colaboradoresResult.error;
      }
      if (bombasResult.error) {
        console.error('❌ [FolhaSalarial] Erro bombas:', bombasResult.error);
        throw bombasResult.error;
      }

      const todosColaboradores = colaboradoresResult.data;
      const bombasData = bombasResult.data;

      // Filtrar colaboradores excluindo "Terceiros"
      const colaboradores = todosColaboradores?.filter(col => col.funcao !== 'Terceiros') || [];

      console.log('👥 [FolhaSalarial] Total colaboradores:', todosColaboradores?.length || 0);
      console.log('👥 [FolhaSalarial] Colaboradores (sem terceiros):', colaboradores.length);
      console.log('🚛 [FolhaSalarial] Bombas encontradas:', bombasData?.length || 0);

      setBombas(bombasData);

      // Processar dados dos funcionários
      console.log('🔄 [FolhaSalarial] Processando funcionários...');
      const funcionariosProcessados: PagamentoFuncionario[] = colaboradores.map(colaborador => {
        const hoje = new Date();
        const diaAtual = hoje.getDate();
        
        // Calcular datas de pagamento (dia 5 e 20)
        const dataPagamento1 = new Date(hoje.getFullYear(), hoje.getMonth(), 5);
        const dataPagamento2 = new Date(hoje.getFullYear(), hoje.getMonth(), 20);
        
        // Se já passou do dia 5, próxima data é do próximo mês
        if (diaAtual > 5) {
          dataPagamento1.setMonth(dataPagamento1.getMonth() + 1);
        }
        
        // Se já passou do dia 20, próxima data é do próximo mês
        if (diaAtual > 20) {
          dataPagamento2.setMonth(dataPagamento2.getMonth() + 1);
        }

        // Calcular dias até pagamento
        const diasAtePagamento1 = Math.ceil((dataPagamento1.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        const diasAtePagamento2 = Math.ceil((dataPagamento2.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        // Dividir salário (assumindo divisão igual)
        const valorPagamento1 = colaborador.salario_fixo / 2;
        const valorPagamento2 = colaborador.salario_fixo / 2;

        // Determinar status dos pagamentos
        const statusPagamento1 = diasAtePagamento1 < 0 ? 'atrasado' : 
                                diasAtePagamento1 === 0 ? 'pendente' : 'pendente';
        const statusPagamento2 = diasAtePagamento2 < 0 ? 'atrasado' : 
                                diasAtePagamento2 === 0 ? 'pendente' : 'pendente';

        return {
          id: colaborador.id,
          nome: colaborador.nome,
          funcao: colaborador.funcao,
          tipo_contrato: colaborador.tipo_contrato,
          salario_fixo: colaborador.salario_fixo,
          valor_pagamento_1: valorPagamento1,
          valor_pagamento_2: valorPagamento2,
          data_pagamento_1: dataPagamento1.toISOString().split('T')[0],
          data_pagamento_2: dataPagamento2.toISOString().split('T')[0],
          status_pagamento_1: statusPagamento1,
          status_pagamento_2: statusPagamento2,
          dias_ate_pagamento_1: diasAtePagamento1,
          dias_ate_pagamento_2: diasAtePagamento2,
          company_id: colaborador.company_id,
        };
      });

      console.log('✅ [FolhaSalarial] Funcionários processados:', funcionariosProcessados.length);
      setFuncionarios(funcionariosProcessados);

      // Calcular resumo
      console.log('📊 [FolhaSalarial] Calculando resumo...');
      const resumoCalculado: ResumoPagamentos = {
        total_pagamento_1: funcionariosProcessados.reduce((sum, f) => sum + f.valor_pagamento_1, 0),
        total_pagamento_2: funcionariosProcessados.reduce((sum, f) => sum + f.valor_pagamento_2, 0),
        funcionarios_pagamento_1: funcionariosProcessados.filter(f => f.dias_ate_pagamento_1 <= 3).length,
        funcionarios_pagamento_2: funcionariosProcessados.filter(f => f.dias_ate_pagamento_2 <= 3).length,
        proximos_vencimentos: funcionariosProcessados
          .filter(f => f.dias_ate_pagamento_1 <= 3 || f.dias_ate_pagamento_2 <= 3)
          .sort((a, b) => Math.min(a.dias_ate_pagamento_1, a.dias_ate_pagamento_2) - Math.min(b.dias_ate_pagamento_1, b.dias_ate_pagamento_2))
      };

      setResumo(resumoCalculado);
      console.log('🎉 [FolhaSalarial] Carregamento concluído com sucesso!');

    } catch (error) {
      console.error('❌ [FolhaSalarial] Erro ao carregar folha salarial:', error);
      // showToast('Erro ao carregar folha salarial', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDescontarFinanceiro = (funcionario: PagamentoFuncionario, tipo: 'pagamento_1' | 'pagamento_2') => {
    setFuncionarioParaPagar(funcionario);
    setTipoPagamento(tipo);
    setBombaSelecionada(null);
    setShowBombaModal(true);
  };

  const handleDescontarDiaria = (funcionario: PagamentoFuncionario) => {
    setFuncionarioParaPagar(funcionario);
    setTipoPagamento('diaria');
    setBombaSelecionada(null);
    setShowBombaModal(true);
  };

  const confirmarDesconto = async () => {
    if (!funcionarioParaPagar || !bombaSelecionada) return;

    try {
      setProcessando(true);

      let valor: number;
      let descricao: string;
      let dataPagamento: string;

      if (tipoPagamento === 'diaria') {
        // Para diaristas, usar o valor do salário como diária
        valor = funcionarioParaPagar.salario_fixo;
        descricao = `Diária - ${funcionarioParaPagar.nome}`;
        dataPagamento = new Date().toISOString().split('T')[0]; // Hoje
      } else {
        // Para funcionários fixos
        valor = tipoPagamento === 'pagamento_1' 
          ? funcionarioParaPagar.valor_pagamento_1 
          : funcionarioParaPagar.valor_pagamento_2;
        descricao = `Salário - ${funcionarioParaPagar.nome} (${tipoPagamento === 'pagamento_1' ? '1ª parcela' : '2ª parcela'})`;
        dataPagamento = tipoPagamento === 'pagamento_1' 
          ? funcionarioParaPagar.data_pagamento_1 
          : funcionarioParaPagar.data_pagamento_2;
      }

      // Buscar o owner_company_id da bomba selecionada
      const { data: bombaData, error: bombaError } = await supabase
        .from('pumps')
        .select('owner_company_id')
        .eq('id', bombaSelecionada.id)
        .single();

      if (bombaError) {
        console.error('Erro ao buscar empresa da bomba:', bombaError);
        throw new Error('Não foi possível identificar a empresa da bomba selecionada');
      }

      // Registrar como despesa no sistema financeiro (valor negativo para representar saída)
      const { error } = await supabase
        .from('expenses')
        .insert({
          descricao: descricao,
          valor: -Math.abs(valor), // Garantir que seja negativo (saída de dinheiro)
          categoria: 'Mão de obra',
          tipo_custo: 'fixo', // Adicionando tipo_custo obrigatório
          data_despesa: dataPagamento,
          status: 'pago',
          pump_id: bombaSelecionada.id,
          company_id: bombaData.owner_company_id, // Usando owner_company_id da bomba (correto!)
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      const tipoTexto = tipoPagamento === 'diaria' ? 'diária' : 'pagamento';
      console.log(`✅ ${tipoTexto === 'diária' ? 'Diária' : 'Pagamento'} de ${formatarSalario(valor)} registrado para ${funcionarioParaPagar.nome} na bomba ${bombaSelecionada.prefix}`);
      // showToast(`${tipoTexto === 'diária' ? 'Diária' : 'Pagamento'} de ${formatarSalario(valor)} registrado para ${funcionarioParaPagar.nome} na bomba ${bombaSelecionada.prefix}`, 'success');
      
      // Recarregar dados
      await loadFolhaSalarial();
      
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      // showToast('Erro ao registrar pagamento', 'error');
    } finally {
      setProcessando(false);
      setShowConfirmModal(false);
      setShowBombaModal(false);
      setFuncionarioParaPagar(null);
      setBombaSelecionada(null);
    }
  };

  const getStatusColor = (status: string, dias: number) => {
    if (dias < 0) return 'bg-red-100 text-red-800';
    if (dias === 0) return 'bg-orange-100 text-orange-800';
    if (dias <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (dias: number) => {
    if (dias < 0) return `${Math.abs(dias)} dias atrasado`;
    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Amanhã';
    return `${dias} dias`;
  };

  const getStatusIcon = (dias: number) => {
    if (dias < 0) return <AlertTriangle className="h-4 w-4" />;
    if (dias === 0) return <Clock className="h-4 w-4" />;
    if (dias <= 3) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const handleSelecionarBomba = (bomba: Bomba) => {
    setBombaSelecionada(bomba);
    setShowBombaModal(false);
    setShowConfirmModal(true);
  };

  const cancelarSelecaoBomba = () => {
    setShowBombaModal(false);
    setFuncionarioParaPagar(null);
    setBombaSelecionada(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
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
              <h1 className="text-3xl font-bold text-gray-900">Folha Salarial</h1>
              <p className="text-gray-600 mt-1">
                Controle de pagamentos dos funcionários - Dias 5 e 20
              </p>
            </div>
            <Button
              onClick={loadFolhaSalarial}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Atualizar
            </Button>
          </div>

          {/* Cards de Resumo */}
          {resumo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-green-800">Pagamento Dia 5</CardTitle>
                    <div className="p-2 bg-green-200 rounded-full">
                      <DollarSign className="h-5 w-5 text-green-700" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-green-700">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.total_pagamento_1)}
                    </div>
                    <p className="text-sm text-green-600 font-medium">
                      {resumo.funcionarios_pagamento_1} funcionários próximos
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-blue-800">Pagamento Dia 20</CardTitle>
                    <div className="p-2 bg-blue-200 rounded-full">
                      <DollarSign className="h-5 w-5 text-blue-700" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-blue-700">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.total_pagamento_2)}
                    </div>
                    <p className="text-sm text-blue-600 font-medium">
                      {resumo.funcionarios_pagamento_2} funcionários próximos
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-purple-800">Total Mensal</CardTitle>
                    <div className="p-2 bg-purple-200 rounded-full">
                      <Users className="h-5 w-5 text-purple-700" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-purple-700">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.total_pagamento_1 + resumo.total_pagamento_2)}
                    </div>
                    <p className="text-sm text-purple-600 font-medium">
                      {funcionarios.length} funcionários
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-orange-800">Próximos Vencimentos</CardTitle>
                    <div className="p-2 bg-orange-200 rounded-full">
                      <AlertTriangle className="h-5 w-5 text-orange-700" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-orange-700">
                      {resumo.proximos_vencimentos.length}
                    </div>
                    <p className="text-sm text-orange-600 font-medium">
                      nos próximos 3 dias
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lista de Funcionários */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Funcionários - Controle de Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Funcionário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Função
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pagamento Dia 5
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pagamento Dia 20
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {funcionarios.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-12 w-12 text-gray-300" />
                            <p className="text-lg font-medium">Nenhum funcionário encontrado</p>
                            <p className="text-sm">
                              {loading ? 'Carregando...' : 'Verifique se há funcionários cadastrados no sistema'}
                            </p>
                            {!loading && (
                              <Button
                                onClick={loadFolhaSalarial}
                                variant="outline"
                                size="sm"
                                className="mt-2"
                              >
                                Tentar Novamente
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      funcionarios.map((funcionario) => (
                      <tr key={funcionario.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {funcionario.nome}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            style={{ backgroundColor: getCorFuncao(funcionario.funcao) }}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                          >
                            {funcionario.funcao}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            funcionario.tipo_contrato === 'fixo' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {funcionario.tipo_contrato === 'fixo' ? 'Fixo' : 'Diarista'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatarSalario(funcionario.salario_fixo)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {funcionario.tipo_contrato === 'fixo' ? (
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatarSalario(funcionario.valor_pagamento_1)}
                                </div>
                                <span 
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(funcionario.status_pagamento_1, funcionario.dias_ate_pagamento_1)}`}
                                >
                                  {getStatusIcon(funcionario.dias_ate_pagamento_1)}
                                  <span className="ml-1">{getStatusText(funcionario.dias_ate_pagamento_1)}</span>
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDescontarFinanceiro(funcionario, 'pagamento_1')}
                                className="text-xs"
                              >
                                Descontar
                              </Button>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">-</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {funcionario.tipo_contrato === 'fixo' ? (
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatarSalario(funcionario.valor_pagamento_2)}
                                </div>
                                <span 
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(funcionario.status_pagamento_2, funcionario.dias_ate_pagamento_2)}`}
                                >
                                  {getStatusIcon(funcionario.dias_ate_pagamento_2)}
                                  <span className="ml-1">{getStatusText(funcionario.dias_ate_pagamento_2)}</span>
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDescontarFinanceiro(funcionario, 'pagamento_2')}
                                className="text-xs"
                              >
                                Descontar
                              </Button>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">-</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex gap-2">
                            {funcionario.tipo_contrato === 'fixo' ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDescontarFinanceiro(funcionario, 'pagamento_1')}
                                  className="text-xs"
                                >
                                  Pagar 1ª
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDescontarFinanceiro(funcionario, 'pagamento_2')}
                                  className="text-xs"
                                >
                                  Pagar 2ª
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDescontarDiaria(funcionario)}
                                className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                              >
                                Descontar Diária Hoje
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Modal de Seleção de Bomba */}
          {showBombaModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Selecionar Bomba
                  </h3>
                  <button
                    onClick={cancelarSelecaoBomba}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Para qual bomba deseja registrar a despesa {tipoPagamento === 'diaria' ? 'da diária' : 'do salário'} de{' '}
                    <span className="font-semibold">{funcionarioParaPagar?.nome}</span>?
                  </p>
                  <p className="text-sm text-gray-500">
                    Valor: {formatarSalario(
                      tipoPagamento === 'diaria'
                        ? funcionarioParaPagar?.salario_fixo || 0
                        : tipoPagamento === 'pagamento_1' 
                          ? funcionarioParaPagar?.valor_pagamento_1 || 0
                          : funcionarioParaPagar?.valor_pagamento_2 || 0
                    )}
                  </p>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {bombas.map((bomba) => (
                    <button
                      key={bomba.id}
                      onClick={() => handleSelecionarBomba(bomba)}
                      className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {bomba.prefix}
                          </div>
                          {bomba.model && (
                            <div className="text-sm text-gray-500">
                              {bomba.brand} {bomba.model}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={cancelarSelecaoBomba}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Confirmação */}
          <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={confirmarDesconto}
            title="Descontar do Financeiro"
            message={
              funcionarioParaPagar && bombaSelecionada
                ? tipoPagamento === 'diaria'
                  ? `Confirmar desconto de ${formatarSalario(funcionarioParaPagar.salario_fixo)} da diária de ${funcionarioParaPagar.nome} na bomba ${bombaSelecionada.prefix}?`
                  : `Confirmar desconto de ${formatarSalario(
                      tipoPagamento === 'pagamento_1' 
                        ? funcionarioParaPagar.valor_pagamento_1 
                        : funcionarioParaPagar.valor_pagamento_2
                    )} do salário de ${funcionarioParaPagar.nome} (${tipoPagamento === 'pagamento_1' ? '1ª parcela' : '2ª parcela'}) na bomba ${bombaSelecionada.prefix}?`
                : 'Confirmar desconto do financeiro?'
            }
            confirmText="Confirmar Desconto"
            cancelText="Cancelar"
            type="warning"
            loading={processando}
          />
        </div>
      </div>
    </div>
  );
}
