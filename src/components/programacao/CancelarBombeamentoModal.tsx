import { useState } from 'react';
import { Button } from '../Button';

interface CancelarBombeamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo?: string) => Promise<void>;
  programacao: {
    cliente?: string;
    data: string;
    endereco: string;
    numero: string;
  };
}

export function CancelarBombeamentoModal({
  isOpen,
  onClose,
  onConfirm,
  programacao
}: CancelarBombeamentoModalProps) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(motivo || undefined);
      onClose();
      setMotivo(''); // Limpar após confirmação
    } catch (error) {
      console.error('Erro ao cancelar bombeamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMotivo('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">Cancelar Bombeamento</h2>
          <p className="text-sm text-red-100 mt-1">
            Confirme o cancelamento desta programação
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Dados da Programação */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-700 mb-2">Programação</h3>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-gray-600">Cliente:</span>{' '}
                <span className="font-medium text-gray-900">{programacao.cliente || 'Não informado'}</span>
              </p>
              <p>
                <span className="text-gray-600">Data:</span>{' '}
                <span className="font-medium text-gray-900">
                  {new Date(programacao.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              </p>
              <p>
                <span className="text-gray-600">Endereço:</span>{' '}
                <span className="font-medium text-gray-900">
                  {programacao.endereco}, {programacao.numero}
                </span>
              </p>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-red-600 text-xl mr-3">⚠️</span>
              <div className="text-sm text-red-800">
                <p className="font-semibold">Atenção!</p>
                <p className="mt-1">
                  Ao cancelar, este bombeamento será marcado como não realizado.
                  Esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>
          </div>

          {/* Campo de Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo do Cancelamento (opcional)
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={3}
              placeholder="Descreva o motivo do cancelamento..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Este motivo será registrado no histórico da programação
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Voltar
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </Button>
        </div>
      </div>
    </div>
  );
}


