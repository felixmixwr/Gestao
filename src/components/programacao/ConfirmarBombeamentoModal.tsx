import { useState } from 'react';
import { Button } from '../Button';
import { formatCurrency } from '../../utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConfirmarBombeamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (volumeRealizado: number, valorCobrado: number) => Promise<void>;
  programacao: {
    cliente?: string;
    data: string;
    endereco: string;
    numero: string;
    bairro?: string;
    cidade?: string;
    volume_previsto?: number;
  };
}

export function ConfirmarBombeamentoModal({
  isOpen,
  onClose,
  onConfirm,
  programacao
}: ConfirmarBombeamentoModalProps) {
  const [volumeRealizado, setVolumeRealizado] = useState<string>(
    programacao.volume_previsto?.toString() || ''
  );
  const [valorCobrado, setValorCobrado] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ volume?: string; valor?: string }>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: { volume?: string; valor?: string } = {};

    if (!volumeRealizado || parseFloat(volumeRealizado) <= 0) {
      newErrors.volume = 'Volume realizado é obrigatório e deve ser maior que zero';
    }

    if (!valorCobrado || parseFloat(valorCobrado) <= 0) {
      newErrors.valor = 'Valor cobrado é obrigatório e deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onConfirm(parseFloat(volumeRealizado), parseFloat(valorCobrado));
      onClose();
    } catch (error) {
      console.error('Erro ao confirmar bombeamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const handleValorChange = (value: string) => {
    // Remove tudo exceto números e vírgula/ponto
    const cleaned = value.replace(/[^\d.,]/g, '');
    // Substitui vírgula por ponto para garantir número válido
    const normalized = cleaned.replace(',', '.');
    setValorCobrado(normalized);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">Confirmar Bombeamento</h2>
          <p className="text-sm text-blue-100 mt-1">
            Preencha os dados do bombeamento realizado
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Dados da Programação (Referência) */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-700 mb-3">Dados da Programação</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Cliente:</span>
                <p className="font-medium text-gray-900">{programacao.cliente || 'Não informado'}</p>
              </div>
              
              <div>
                <span className="text-gray-600">Data:</span>
                <p className="font-medium text-gray-900">{formatDate(programacao.data)}</p>
              </div>
              
              <div className="md:col-span-2">
                <span className="text-gray-600">Endereço:</span>
                <p className="font-medium text-gray-900">
                  {programacao.endereco}, {programacao.numero}
                  {programacao.bairro && ` - ${programacao.bairro}`}
                  {programacao.cidade && `, ${programacao.cidade}`}
                </p>
              </div>

              {programacao.volume_previsto && (
                <div>
                  <span className="text-gray-600">Volume Previsto:</span>
                  <p className="font-medium text-gray-900">{programacao.volume_previsto} m³</p>
                </div>
              )}
            </div>
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            {/* Volume Realizado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume Realizado (m³) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={volumeRealizado}
                onChange={(e) => {
                  setVolumeRealizado(e.target.value);
                  if (errors.volume) setErrors({ ...errors, volume: undefined });
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.volume ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: 25.5"
              />
              {errors.volume && (
                <p className="text-red-500 text-sm mt-1">{errors.volume}</p>
              )}
            </div>

            {/* Valor Cobrado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Cobrado (R$) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                <input
                  type="text"
                  value={valorCobrado}
                  onChange={(e) => {
                    handleValorChange(e.target.value);
                    if (errors.valor) setErrors({ ...errors, valor: undefined });
                  }}
                  className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.valor ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: 1500.00"
                />
              </div>
              {errors.valor && (
                <p className="text-red-500 text-sm mt-1">{errors.valor}</p>
              )}
              {valorCobrado && !errors.valor && (
                <p className="text-sm text-gray-600 mt-1">
                  Valor: {formatCurrency(parseFloat(valorCobrado) || 0)}
                </p>
              )}
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-yellow-600 text-xl mr-3">⚠️</span>
              <div className="text-sm text-yellow-800">
                <p className="font-semibold">Atenção!</p>
                <p className="mt-1">
                  Ao confirmar, um relatório de bombeamento será criado automaticamente com estes dados.
                  Esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Confirmando...' : 'Confirmar e Criar Relatório'}
          </Button>
        </div>
      </div>
    </div>
  );
}

