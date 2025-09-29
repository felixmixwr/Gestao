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
    
    // Converte para número e divide por 100 para ter o valor real
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
    <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Adicionar Nota Fiscal (Versão Simplificada)</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número da Nota *
            </label>
            <input
              type="text"
              name="numero_nota"
              value={formData.numero_nota}
              onChange={handleInputChange}
              placeholder="Ex: 001234"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.numero_nota ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.numero_nota && (
              <p className="mt-1 text-sm text-red-600">{errors.numero_nota}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor (R$) *
            </label>
            <input
              type="text"
              name="valor"
              value={formData.valor}
              onChange={handleCurrencyChange}
              placeholder="0,00"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.valor ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.valor && (
              <p className="mt-1 text-sm text-red-600">{errors.valor}</p>
            )}
          </div>
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Anexo (PDF ou XML)
          </label>
          <input
            type="file"
            accept=".pdf,.xml"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            Arquivos aceitos: PDF, XML (máximo 10MB)
          </p>
          {formData.anexo && (
            <p className="mt-1 text-sm text-green-600">
              Arquivo selecionado: {formData.anexo.name}
            </p>
          )}
        </div>

        {uploadProgress !== null && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Nota Fiscal'}
          </Button>
        </div>
      </form>
    </div>
  );
};
