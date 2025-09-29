import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './Button';
import { DatePicker } from './ui/date-picker';

interface NotaFiscalFormSimpleProps {
  reportId: string;
  onSuccess: () => void;
  onCancel: () => void;
  onRefresh?: () => void; // Adicionado callback para atualizar a lista
}

export const NotaFiscalFormSimple: React.FC<NotaFiscalFormSimpleProps> = ({
  reportId,
  onSuccess,
  onCancel,
  onRefresh
}) => {
  const [formData, setFormData] = useState({
    numero_nota: '',
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: '',
    valor: '',
    anexo: null as File | null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['application/pdf', 'application/xml', 'text/xml'];
      const allowedExtensions = ['.pdf', '.xml'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        alert('Apenas arquivos PDF ou XML são permitidos');
        e.target.value = '';
        return;
      }
      
      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo permitido: 10MB');
        e.target.value = '';
        return;
      }
      
      setFormData(prev => ({ ...prev, anexo: file }));
    } else {
      setFormData(prev => ({ ...prev, anexo: null }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.numero_nota.trim()) {
      newErrors.numero_nota = 'Número da nota é obrigatório';
    }

    if (!formData.data_emissao) {
      newErrors.data_emissao = 'Data de emissão é obrigatória';
    }

    if (!formData.data_vencimento) {
      newErrors.data_vencimento = 'Data de vencimento é obrigatória';
    }

    if (!formData.valor || parseCurrency(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    // Validar se data de vencimento é posterior à data de emissão
    if (formData.data_emissao && formData.data_vencimento) {
      if (new Date(formData.data_vencimento) < new Date(formData.data_emissao)) {
        newErrors.data_vencimento = 'Data de vencimento deve ser posterior à data de emissão';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFile = async (file: File): Promise<string> => {
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }

    console.log('Usuário autenticado:', user.id);

    const fileExt = file.name.split('.').pop();
    const fileName = `${reportId}-${Date.now()}.${fileExt}`;
    const filePath = `notas-fiscais/${fileName}`;

    console.log('Tentando upload para:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Erro detalhado do upload:', uploadError);
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    console.log('Upload realizado com sucesso:', publicUrl);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Verificar se já existe uma nota fiscal para este relatório
      console.log('🔍 Verificando se já existe nota fiscal para este relatório...');
      const { data: existingNota, error: checkError } = await supabase
        .from('notas_fiscais')
        .select('id, numero_nota')
        .eq('relatorio_id', reportId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = não encontrado, que é o que queremos
        console.error('Erro ao verificar nota existente:', checkError);
        throw new Error(`Erro ao verificar nota fiscal existente: ${checkError.message}`);
      }

      if (existingNota) {
        console.log('❌ Já existe uma nota fiscal para este relatório:', existingNota);
        alert(`Já existe uma nota fiscal para este relatório (Número: ${existingNota.numero_nota}). Cada relatório pode ter apenas uma nota fiscal.`);
        return;
      }

      console.log('✅ Nenhuma nota fiscal encontrada para este relatório. Prosseguindo...');
      
      let anexoUrl: string | null = null;
      
      // Upload do anexo se fornecido
      if (formData.anexo) {
        setUploadProgress(0);
        anexoUrl = await uploadFile(formData.anexo);
        setUploadProgress(100);
      }

      const dataToSave = {
        relatorio_id: reportId,
        numero_nota: formData.numero_nota.trim(),
        data_emissao: formData.data_emissao,
        data_vencimento: formData.data_vencimento,
        valor: parseCurrency(formData.valor),
        anexo_url: anexoUrl,
        status: 'Faturada' as const
      };

      console.log('Dados a serem salvos:', dataToSave);

      // Salvar nota fiscal no banco
      const { data: insertedData, error } = await supabase
        .from('notas_fiscais')
        .insert(dataToSave)
        .select();

      if (error) {
        console.error('Erro detalhado:', error);
        throw new Error(`Erro ao salvar nota fiscal: ${error.message}`);
      }

      console.log('Nota fiscal salva com sucesso:', insertedData);
      alert('Nota fiscal criada com sucesso!');
      
      // Atualizar a lista de notas
      if (onRefresh) {
        onRefresh();
      }
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar nota fiscal:', error);
      alert(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove tudo que não for dígito
    const numericValue = value.replace(/\D/g, '');
    
    // Converte para número e divide por 100 para ter os centavos
    const number = parseFloat(numericValue) / 100;
    
    // Formata como moeda brasileira
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const parseCurrency = (formattedValue: string): number => {
    // Remove pontos e vírgulas, mantém apenas dígitos
    const numericValue = formattedValue.replace(/[^\d]/g, '');
    
    // Converte para número e divide por 100 para compensar a formatação
    return parseFloat(numericValue) / 100;
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const formatted = formatCurrency(value);
    setFormData(prev => ({ ...prev, valor: formatted }));
    
    if (errors.valor) {
      setErrors(prev => ({ ...prev, valor: '' }));
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Informações Básicas */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Informações da Nota Fiscal</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número da Nota Fiscal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="numero_nota"
                value={formData.numero_nota}
                onChange={handleInputChange}
                placeholder="Ex: 001234"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.numero_nota ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.numero_nota && (
                <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{errors.numero_nota}</span>
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor da Nota (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="valor"
                value={formData.valor}
                onChange={handleCurrencyChange}
                placeholder="0,00"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.valor ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.valor && (
                <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{errors.valor}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Datas */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Datas</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              value={formData.data_emissao}
              onChange={(value) => handleInputChange({ target: { name: 'data_emissao', value } })}
              label="Data de Emissão"
              required
              error={errors.data_emissao}
            />
            
            <DatePicker
              value={formData.data_vencimento}
              onChange={(value) => handleInputChange({ target: { name: 'data_vencimento', value } })}
              label="Data de Vencimento"
              minDate={formData.data_emissao}
              required
              error={errors.data_vencimento}
            />
          </div>
        </div>

        {/* Anexo */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span>Anexo (Opcional)</span>
          </h4>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept=".pdf,.xml"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <div className="mt-2 text-xs text-gray-500">
              <p>Arquivos aceitos: PDF, XML</p>
              <p>Tamanho máximo: 10MB</p>
            </div>
            {formData.anexo && (
              <div className="mt-2 flex items-center space-x-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Arquivo selecionado: {formData.anexo.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {uploadProgress !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Enviando arquivo...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex items-center space-x-1 px-3 py-2 text-sm"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Cancelar</span>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-1 px-3 py-2 text-sm"
          >
            {isSubmitting ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Salvar Nota Fiscal</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
