import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './Button';
import { formatCurrency, formatDate } from '../utils/format';
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

  useEffect(() => {
    loadNotas();
  }, [reportId, refreshTrigger]); // Adicionado refreshTrigger como dependência

  const loadNotas = async () => {
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
  };

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
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Notas Fiscais ({notas.length})</h3>
        {onRefresh && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              loadNotas();
              onRefresh();
            }}
          >
            Atualizar
          </Button>
        )}
      </div>

      {notas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhuma nota fiscal vinculada a este relatório</p>
          <p className="text-sm mt-2 text-gray-400">
            Cada relatório pode ter apenas uma nota fiscal
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notas.map((nota) => (
            <div
              key={nota.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">
                      NF {nota.numero_nota}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        nota.status
                      )}`}
                    >
                      {nota.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Emissão:</span>{' '}
                      {formatDate(nota.data_emissao)}
                    </div>
                    <div>
                      <span className="font-medium">Vencimento:</span>{' '}
                      {formatDate(nota.data_vencimento)}
                    </div>
                    <div>
                      <span className="font-medium">Valor:</span>{' '}
                      <span className="font-semibold text-green-600">
                        {formatCurrency(nota.valor)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  {nota.anexo_url && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        handleDownloadAnexo(nota.anexo_url!, nota.numero_nota)
                      }
                    >
                      Ver Anexo
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      // TODO: Implementar visualização detalhada da nota
                      console.log('Ver detalhes da nota:', nota.id);
                    }}
                  >
                    Detalhes
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
