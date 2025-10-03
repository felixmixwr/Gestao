import { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface AlertaFolhaSalarial {
  total_proximos_pagamentos: number;
  funcionarios_proximos: number;
  dias_ate_proximo_pagamento: number;
  data_proximo_pagamento: string;
  tipo_proximo_pagamento: 'pagamento_1' | 'pagamento_2';
}

export function FolhaSalarialAlert() {
  const [alerta, setAlerta] = useState<AlertaFolhaSalarial | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAlertaFolhaSalarial();
  }, []);

  const loadAlertaFolhaSalarial = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os colaboradores
      const { data: colaboradores, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('nome');

      if (error) throw error;

      const hoje = new Date();
      const diaAtual = hoje.getDate();
      
      // Calcular próximas datas de pagamento
      let proximaDataPagamento: Date;
      let tipoProximoPagamento: 'pagamento_1' | 'pagamento_2';
      
      if (diaAtual <= 5) {
        proximaDataPagamento = new Date(hoje.getFullYear(), hoje.getMonth(), 5);
        tipoProximoPagamento = 'pagamento_1';
      } else if (diaAtual <= 20) {
        proximaDataPagamento = new Date(hoje.getFullYear(), hoje.getMonth(), 20);
        tipoProximoPagamento = 'pagamento_2';
      } else {
        proximaDataPagamento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 5);
        tipoProximoPagamento = 'pagamento_1';
      }

      const diasAteProximoPagamento = Math.ceil((proximaDataPagamento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calcular total a pagar
      const totalProximosPagamentos = colaboradores.reduce((sum, colaborador) => {
        return sum + (colaborador.salario_fixo / 2);
      }, 0);

      const alertaData: AlertaFolhaSalarial = {
        total_proximos_pagamentos: totalProximosPagamentos,
        funcionarios_proximos: colaboradores.length,
        dias_ate_proximo_pagamento: diasAteProximoPagamento,
        data_proximo_pagamento: proximaDataPagamento.toLocaleDateString('pt-BR'),
        tipo_proximo_pagamento: tipoProximoPagamento
      };

      setAlerta(alertaData);

    } catch (error) {
      console.error('Erro ao carregar alerta da folha salarial:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertaColor = (dias: number) => {
    if (dias < 0) return 'border-red-200 bg-red-50';
    if (dias === 0) return 'border-orange-200 bg-orange-50';
    if (dias <= 3) return 'border-yellow-200 bg-yellow-50';
    return 'border-green-200 bg-green-50';
  };

  const getAlertaText = (dias: number) => {
    if (dias < 0) return 'Pagamentos em atraso!';
    if (dias === 0) return 'Pagamentos hoje!';
    if (dias === 1) return 'Pagamentos amanhã!';
    return `Pagamentos em ${dias} dias`;
  };

  const getAlertaIcon = (dias: number) => {
    if (dias <= 3) return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    return <Calendar className="h-5 w-5 text-green-600" />;
  };

  if (loading) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-4">
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!alerta) return null;

  // Só mostrar alerta se estiver próximo (3 dias ou menos)
  if (alerta.dias_ate_proximo_pagamento > 3) return null;

  return (
    <Card className={`${getAlertaColor(alerta.dias_ate_proximo_pagamento)} border-2`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            {getAlertaIcon(alerta.dias_ate_proximo_pagamento)}
            <span>Folha Salarial</span>
          </div>
          <Badge 
            variant={alerta.dias_ate_proximo_pagamento <= 1 ? "destructive" : "secondary"}
            className="text-xs"
          >
            {getAlertaText(alerta.dias_ate_proximo_pagamento)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                {alerta.funcionarios_proximos} funcionários
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(alerta.total_proximos_pagamentos)}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Próximo pagamento: {alerta.data_proximo_pagamento} 
            ({alerta.tipo_proximo_pagamento === 'pagamento_1' ? '1ª parcela' : '2ª parcela'})
          </div>
          
          <Button
            onClick={() => navigate('/financial/folha-salarial')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Gerenciar Folha Salarial
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
