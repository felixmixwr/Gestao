import { useState } from 'react';
import { Button } from '../Button';
import { formatCurrency } from '../../utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';

interface ConfirmarBombeamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (volumeRealizado: number, valorCobrado: number, pdfUrl?: string) => Promise<void>;
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
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ volume?: string; valor?: string; pdf?: string }>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: { volume?: string; valor?: string; pdf?: string } = {};

    if (!volumeRealizado || parseFloat(volumeRealizado) <= 0) {
      newErrors.volume = 'Volume realizado é obrigatório e deve ser maior que zero';
    }

    if (!valorCobrado || parseFloat(valorCobrado) <= 0) {
      newErrors.valor = 'Valor cobrado é obrigatório e deve ser maior que zero';
    }

    // Validar tipo de arquivo PDF
    if (pdfFile && !pdfFile.type.includes('pdf')) {
      newErrors.pdf = 'Apenas arquivos PDF são permitidos';
    }

    // Validar tamanho do arquivo (máximo 10MB)
    if (pdfFile && pdfFile.size > 10 * 1024 * 1024) {
      newErrors.pdf = 'O arquivo deve ter no máximo 10MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPdfFile(file);
      if (errors.pdf) {
        setErrors({ ...errors, pdf: undefined });
      }
    }
  };

  const uploadPdf = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `relatorio-${Date.now()}.${fileExt}`;
      const filePath = `relatorios/${fileName}`;

      console.log('Iniciando upload do PDF:', filePath);
      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      setUploadProgress(70);

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      console.log('Upload concluído:', publicUrl);
      setUploadProgress(100);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
  };

  const handleConfirm = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let pdfUrl: string | undefined;

      // Fazer upload do PDF se fornecido
      if (pdfFile) {
        setUploadProgress(0);
        pdfUrl = await uploadPdf(pdfFile);
      }

      await onConfirm(parseFloat(volumeRealizado), parseFloat(valorCobrado), pdfUrl);
      onClose();
    } catch (error) {
      console.error('Erro ao confirmar bombeamento:', error);
      setErrors({ ...errors, pdf: 'Erro ao fazer upload do arquivo. Tente novamente.' });
    } finally {
      setLoading(false);
      setUploadProgress(0);
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

            {/* Upload de PDF Escaneado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relatório Escaneado (PDF) <span className="text-gray-500">(Opcional)</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                <div className="space-y-1 text-center">
                  {pdfFile ? (
                    <div className="flex flex-col items-center">
                      <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-gray-700 font-medium mt-2">{pdfFile.name}</p>
                      <p className="text-xs text-gray-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button
                        type="button"
                        onClick={() => setPdfFile(null)}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Remover arquivo
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Selecione um arquivo</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept=".pdf,application/pdf"
                            className="sr-only"
                            onChange={handleFileChange}
                            disabled={loading}
                          />
                        </label>
                        <p className="pl-1">ou arraste aqui</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF até 10MB</p>
                    </>
                  )}
                </div>
              </div>
              {errors.pdf && (
                <p className="text-red-500 text-sm mt-1">{errors.pdf}</p>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Fazendo upload...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
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


