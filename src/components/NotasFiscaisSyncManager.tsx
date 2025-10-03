import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { RefreshCw, CheckCircle, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { sincronizarTodasNotasFiscais, verificarEventosExistentes } from '../lib/sync-existing-notas-fiscais'
import { sincronizarTodosPagamentos } from '../lib/universal-payment-planner-integration';

interface NotasFiscaisSyncManagerProps {
  onSyncComplete?: () => void;
}

export const NotasFiscaisSyncManager: React.FC<NotasFiscaisSyncManagerProps> = ({
  onSyncComplete
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [eventosInfo, setEventosInfo] = useState({ total: 0, vencimentos: 0, pagamentos: 0 });
  const [syncLog, setSyncLog] = useState<string[]>([]);

  // Verificar eventos existentes ao carregar
  useEffect(() => {
    verificarEventosExistentes().then(setEventosInfo);
  }, []);

  const executarSincronizacao = async () => {
    setIsLoading(true);
    setSyncStatus('syncing');
    setSyncLog(['🔄 Iniciando sincronização...']);

    try {
      await sincronizarTodasNotasFiscais();
      setSyncStatus('success');
      setSyncLog(prev => [...prev, '✅ Sincronização concluída com sucesso!']);
      
      // Atualizar informações dos eventos
      const novaInfo = await verificarEventosExistentes();
      setEventosInfo(novaInfo);
      
      if (onSyncComplete) {
        onSyncComplete();
      }

    } catch (error) {
      setSyncStatus('error');
      setSyncLog(prev => [...prev, `❌ Erro na sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAllPayments = async () => {
    setIsLoading(true);
    setSyncStatus('syncing');
    setSyncLog([]);
    
    try {
      setSyncLog(prev => [...prev, '🔄 Iniciando sincronização universal de TODOS os pagamentos...']);
      setSyncLog(prev => [...prev, '📋 Buscando: PIX, Boleto, à vista, relatórios pagos, despesas pagas, etc.']);
      
      await sincronizarTodosPagamentos();
      setSyncStatus('success');
      setSyncLog(prev => [...prev, '✅ Sincronização universal concluída com sucesso!']);
      
      // Atualizar informações dos eventos
      const novaInfo = await verificarEventosExistentes();
      setEventosInfo(novaInfo);
      
      if (onSyncComplete) {
        onSyncComplete();
      }

    } catch (error) {
      setSyncStatus('error');
      setSyncLog(prev => [...prev, `❌ Erro na sincronização universal: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Sincronizando...';
      case 'success':
        return 'Sincronização concluída!';
      case 'error':
        return 'Erro na sincronização';
      default:
        return 'Pronto para sincronizar';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Sincronização com Planner
            </h3>
            <p className="text-sm text-gray-600">
              {getStatusText()}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={executarSincronizacao}
            disabled={isLoading}
            className={`${
              syncStatus === 'success' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Sincronizando...' : 'Sincronizar NF'}
          </Button>
          
          <Button
            onClick={handleSyncAllPayments}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            title="Sincroniza TODOS os pagamentos: PIX, Boleto, à vista, relatórios pagos, despesas pagas, etc."
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Sincronizar TODOS os Pagamentos
          </Button>
        </div>
      </div>

      {/* Estatísticas dos eventos */}
      <div className={`border rounded-lg p-4 mb-4 ${getStatusColor()}`}>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{eventosInfo.total}</p>
            <p className="text-sm text-gray-600">Total de Eventos</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full mx-auto mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{eventosInfo.vencimentos}</p>
            <p className="text-sm text-gray-600">Vencimentos</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mx-auto mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{eventosInfo.pagamentos}</p>
            <p className="text-sm text-gray-600">Pagamentos</p>
          </div>
        </div>
      </div>

      {/* Log da sincronização */}
      {syncLog.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Log da Sincronização</h4>
          <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
            {syncLog.map((log, index) => (
              <div key={index} className="text-xs font-mono text-gray-700 mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações sobre a sincronização */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">ℹ️ Sobre a Sincronização</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>Notas Faturadas:</strong> Criam eventos de vencimento na data de vencimento</li>
          <li>• <strong>Notas Pagas:</strong> Criam eventos de pagamento na data atual</li>
          <li>• <strong>Categorias:</strong> São criadas automaticamente (Financeiro e Pagamentos)</li>
          <li>• <strong>Lembretes:</strong> Eventos de vencimento têm lembrete 1 dia antes</li>
        </ul>
      </div>
    </div>
  );
};
