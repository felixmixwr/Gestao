import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { integrarNFAtualizadaEnhanced, integrarNFCanceladaEnhanced } from '../lib/notas-fiscais-planner-integration-enhanced';
import { Button } from './Button';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface NotaFiscalStatusManagerProps {
  notaId: string;
  numeroNota: string;
  valor: number;
  dataEmissao: string;
  dataVencimento: string;
  statusAtual: 'Faturada' | 'Paga' | 'Cancelada';
  onStatusChanged?: () => void;
}

export const NotaFiscalStatusManager: React.FC<NotaFiscalStatusManagerProps> = ({
  notaId,
  numeroNota,
  valor,
  dataEmissao,
  dataVencimento,
  statusAtual,
  onStatusChanged
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (novoStatus: 'Faturada' | 'Paga' | 'Cancelada') => {
    if (novoStatus === statusAtual) return;

    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('notas_fiscais')
        .update({ status: novoStatus })
        .eq('id', notaId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        alert(`Erro ao atualizar status: ${error.message}`);
        return;
      }

      // Integrar com o planner
      try {
        await integrarNFAtualizadaEnhanced(
          {
            numero_nota: numeroNota,
            valor: valor,
            data_vencimento: dataVencimento,
            data_emissao: dataEmissao,
            status: novoStatus,
            relatorio_id: relatorioId
          },
          statusAtual
        );
        console.log('✅ Integração com planner realizada com sucesso');
      } catch (integrationError) {
        console.warn('⚠️ Erro na integração com planner:', integrationError);
        // Não falha a operação principal, apenas loga o aviso
      }

      alert(`Status alterado para: ${novoStatus}`);
      
      if (onStatusChanged) {
        onStatusChanged();
      }

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status da nota fiscal');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Faturada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Paga':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Faturada':
        return <Clock className="h-4 w-4" />;
      case 'Paga':
        return <CheckCircle className="h-4 w-4" />;
      case 'Cancelada':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Status atual */}
      <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center gap-1 ${getStatusColor(statusAtual)}`}>
        {getStatusIcon(statusAtual)}
        {statusAtual}
      </div>

      {/* Botões de ação */}
      <div className="flex items-center gap-2">
        {statusAtual === 'Faturada' && (
          <>
            <Button
              size="sm"
              onClick={() => updateStatus('Paga')}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Marcar como Paga
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus('Cancelada')}
              disabled={isUpdating}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </>
        )}

        {statusAtual === 'Paga' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateStatus('Faturada')}
            disabled={isUpdating}
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <Clock className="h-4 w-4 mr-1" />
            Reverter para Faturada
          </Button>
        )}

        {statusAtual === 'Cancelada' && (
          <Button
            size="sm"
            onClick={() => updateStatus('Faturada')}
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Clock className="h-4 w-4 mr-1" />
            Reativar
          </Button>
        )}
      </div>

      {isUpdating && (
        <div className="text-sm text-gray-500">
          Atualizando...
        </div>
      )}
    </div>
  );
};
