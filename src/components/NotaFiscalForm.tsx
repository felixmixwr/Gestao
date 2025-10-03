import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { Button } from './Button';
import { FormField } from './FormField';
import { CurrencyInputWithValidation } from './CurrencyInputWithValidation';
import { integrarNFCriadaEnhanced } from '../lib/notas-fiscais-planner-integration-enhanced';
import { getCurrentDateString } from '../utils/date-utils';

// Schema de validação simplificado
const notaFiscalSchema = z.object({
  numero_nota: z.string().nonempty('Número da nota é obrigatório'),
  data_emissao: z.string().nonempty('Data de emissão é obrigatória'),
  data_vencimento: z.string().nonempty('Data de vencimento é obrigatória'),
  valor: z.number().positive('Valor deve ser maior que zero'),
  anexo: z.any().optional()
});

type NotaFiscalData = z.infer<typeof notaFiscalSchema>;

interface NotaFiscalFormProps {
  reportId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const NotaFiscalForm: React.FC<NotaFiscalFormProps> = ({
  reportId,
  onSuccess,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<NotaFiscalData>({
    resolver: zodResolver(notaFiscalSchema),
    mode: 'onSubmit', // Validação apenas no submit
    defaultValues: {
      numero_nota: '',
      data_emissao: getCurrentDateString(),
      data_vencimento: '',
      valor: 0
    }
  });

  // Debug: mostrar valores e erros
  const watchedValues = watch();
  console.log('Valores do formulário:', watchedValues);
  console.log('Erros do formulário:', errors);

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
      
      setValue('anexo', file);
    } else {
      setValue('anexo', null);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${reportId}-${Date.now()}.${fileExt}`;
    const filePath = `notas-fiscais/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data: NotaFiscalData) => {
    try {
      setIsSubmitting(true);
      
      let anexoUrl: string | null = null;
      
      // Upload do anexo se fornecido
      if (data.anexo && data.anexo instanceof File) {
        setUploadProgress(0);
        anexoUrl = await uploadFile(data.anexo);
        setUploadProgress(100);
      }

      console.log('Dados a serem salvos:', {
        relatorio_id: reportId,
        numero_nota: data.numero_nota,
        data_emissao: data.data_emissao,
        data_vencimento: data.data_vencimento,
        valor: data.valor,
        anexo_url: anexoUrl,
        status: 'Faturada'
      });

      // Salvar nota fiscal no banco
      const { data: insertedData, error } = await supabase
        .from('notas_fiscais')
        .insert({
          relatorio_id: reportId,
          numero_nota: data.numero_nota,
          data_emissao: data.data_emissao,
          data_vencimento: data.data_vencimento,
          valor: data.valor,
          anexo_url: anexoUrl,
          status: 'Faturada'
        })
        .select();

      if (error) {
        console.error('Erro detalhado:', error);
        throw new Error(`Erro ao salvar nota fiscal: ${error.message}`);
      }

      console.log('Nota fiscal salva com sucesso:', insertedData);
      
      // Integrar com o planner - criar evento de vencimento
      try {
        const notaSalva = insertedData[0];
      await integrarNFCriadaEnhanced({
        numero_nota: notaSalva.numero_nota,
        valor: notaSalva.valor,
        data_vencimento: notaSalva.data_vencimento,
        data_emissao: notaSalva.data_emissao,
        status: notaSalva.status,
        relatorio_id: notaSalva.relatorio_id
      });
        console.log('✅ Integração com planner realizada com sucesso');
      } catch (integrationError) {
        console.warn('⚠️ Erro na integração com planner:', integrationError);
        // Não falha a operação principal, apenas loga o aviso
      }
      
      alert('Nota fiscal criada com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar nota fiscal:', error);
      alert(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Adicionar Nota Fiscal</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Número da Nota"
            {...register('numero_nota')}
            error={errors.numero_nota?.message}
            placeholder="Ex: 001234"
            required
          />
          
          <CurrencyInputWithValidation
            value={watch('valor')}
            onChange={(value) => setValue('valor', value)}
            label="Valor (R$)"
            placeholder="0,00"
            error={errors.valor?.message}
            required
            minValue={0.01}
            maxValue={999999.99}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Data de Emissão"
            type="date"
            {...register('data_emissao')}
            error={errors.data_emissao?.message}
            required
          />
          
          <FormField
            label="Data de Vencimento"
            type="date"
            {...register('data_vencimento')}
            error={errors.data_vencimento?.message}
            min={watch('data_emissao')}
            required
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
