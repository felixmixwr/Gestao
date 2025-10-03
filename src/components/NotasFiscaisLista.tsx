import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './Button';
import { formatCurrency } from '../utils/format';
import { formatDateSafe } from '../utils/date-utils';
import { NotaFiscalDetailsModal } from './NotaFiscalDetailsModal';
import { NotaFiscalStatusManager } from './NotaFiscalStatusManager';
import type { Database } from '../lib/supabase';

type NotaFiscal = Database['public']['Tables']['notas_fiscais']['Row'];

interface NotasFiscaisListaProps {
  reportId: string;
  onRefresh?: () => void;
  refreshTrigger?: number; // Adicionado trigger para forçar refresh
  onHasNotaFiscalChange?: (hasNota: boolean) => void; // Callback para comunicar se há nota fiscal
}

export const NotasFiscaisLista: React.FC<NotasFiscaisListaProps> = ({
  reportId,
  onRefresh,
  refreshTrigger,
  onHasNotaFiscalChange
}) => {
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNota, setSelectedNota] = useState<NotaFiscal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadNotas = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando notas fiscais para relatório:', reportId);
      
      const { data, error } = await supabase
        .from('notas_fiscais')
        .select('*')
        .eq('relatorio_id', reportId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar notas fiscais:', error);
        return;
      }

      console.log('✅ Notas fiscais carregadas:', data);
      setNotas(data || []);
      
      // Comunicar se há nota fiscal
      if (onHasNotaFiscalChange) {
        onHasNotaFiscalChange((data || []).length > 0);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar notas fiscais:', error);
    } finally {
      setLoading(false);
    }
  }, [reportId, onHasNotaFiscalChange]);

  useEffect(() => {
    loadNotas();
  }, [reportId, refreshTrigger, loadNotas]); // Adicionado refreshTrigger como dependência

  const handleDownloadAnexo = (anexoUrl: string, numeroNota: string) => {
    if (anexoUrl) {
      const link = document.createElement('a');
      link.href = anexoUrl;
      link.target = '_blank';
      link.download = `NF-${numeroNota}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenDetails = (nota: NotaFiscal) => {
    setSelectedNota(nota);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNota(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Faturada':
        return 'bg-blue-100 text-blue-800';
      case 'Paga':
        return 'bg-green-100 text-green-800';
      case 'Cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Notas Fiscais</h3>
        <div className="flex items-center justify-center h-20">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-7 h-7 bg-blue-100 rounded-lg">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Notas Fiscais</h3>
              <p className="text-xs text-gray-500">
                {notas.length === 0 ? 'Nenhuma nota fiscal vinculada' : `${notas.length} nota${notas.length > 1 ? 's' : ''} fiscal${notas.length > 1 ? 'is' : ''}`}
              </p>
            </div>
          </div>
          
          {onRefresh && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                loadNotas();
                onRefresh();
              }}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Atualizar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {notas.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Nenhuma nota fiscal</h4>
            <p className="text-xs text-gray-500 mb-2">
              Este relatório ainda não possui notas fiscais vinculadas
            </p>
            <p className="text-xs text-gray-400">
              Use o botão "Adicionar Nota Fiscal" acima para vincular uma nota
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notas.map((nota) => (
              <div
                key={nota.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    {/* Cabeçalho da Nota */}
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-md">
                          <span className="text-xs font-semibold text-blue-600">NF</span>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {nota.numero_nota}
                        </h4>
                      </div>
                      <NotaFiscalStatusManager
                        notaId={nota.id}
                        numeroNota={nota.numero_nota}
                        valor={nota.valor}
                        dataEmissao={nota.data_emissao}
                        dataVencimento={nota.data_vencimento}
                        statusAtual={nota.status}
                        onStatusChanged={() => {
                          loadNotas(); // Recarregar lista quando status mudar
                        }}
                      />
                    </div>
                    
                    {/* Informações da Nota */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500">Data de Emissão</div>
                        <div className="text-xs text-gray-900">{formatDateSafe(nota.data_emissao)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500">Data de Vencimento</div>
                        <div className="text-xs text-gray-900">{formatDateSafe(nota.data_vencimento)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500">Valor</div>
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(nota.valor)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col space-y-1 ml-3">
                    {nota.anexo_url && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleDownloadAnexo(nota.anexo_url!, nota.numero_nota)
                        }
                        className="flex items-center space-x-1 px-2 py-1 text-xs h-7"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Ver Anexo</span>
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenDetails(nota)}
                      className="flex items-center space-x-1 px-2 py-1 text-xs h-7"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Detalhes</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal de Detalhes */}
      <NotaFiscalDetailsModal
        nota={selectedNota}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onDownloadAnexo={handleDownloadAnexo}
      />
    </div>
  );
};
