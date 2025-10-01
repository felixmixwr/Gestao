import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { DatePicker } from './ui/date-picker';
import { ApiService } from '../lib/api';
import { Button } from './Button';
import { FormField } from './FormField';
import { formatCurrency } from '../utils/format';

// Schema de validação
const noteFormSchema = z.object({
  company_logo: z.enum(['felixmix', 'worldrental'], {
    required_error: 'Selecione uma empresa'
  }),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  nf_date: z.string().min(1, 'Data da nota é obrigatória'),
  nf_due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  company_name: z.string().min(1, 'Nome da empresa é obrigatório'),
  address: z.string().optional(),
  cnpj_cpf: z.string().optional(),
  city: z.string().optional(),
  cep: z.string().optional(),
  uf: z.string().optional(),
  nf_value: z.number().min(0.01, 'Valor deve ser maior que zero'),
  descricao: z.string().optional(),
  obs: z.string().optional()
});

type NoteFormData = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  /** Dados pré-preenchidos (ex: de um relatório) */
  initialData?: Partial<NoteFormData> & { report_id?: string };
  /** Callback chamado após sucesso */
  onSuccess?: () => void;
  /** Callback chamado ao cancelar */
  onCancel?: () => void;
  /** Se está em modo de edição */
  isEditing?: boolean;
  /** ID da nota sendo editada */
  noteId?: string;
}

/**
 * Formulário para criação/edição de notas fiscais
 */
export const NoteForm: React.FC<NoteFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  isEditing = false,
  noteId
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      company_logo: initialData?.company_logo || 'felixmix',
      phone: initialData?.phone || '',
      nf_date: initialData?.nf_date || new Date().toISOString().split('T')[0],
      nf_due_date: initialData?.nf_due_date || '',
      company_name: initialData?.company_name || '',
      address: initialData?.address || '',
      cnpj_cpf: initialData?.cnpj_cpf || '',
      city: initialData?.city || '',
      cep: initialData?.cep || '',
      uf: initialData?.uf || '',
      nf_value: initialData?.nf_value || 0,
      descricao: initialData?.descricao || '',
      obs: initialData?.obs || ''
    }
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = form;
  const watchedValue = watch('nf_value');

  const onSubmit = async (data: NoteFormData) => {
    try {
      setGenerationError(null);
      setIsGenerating(true);

      // Se não há report_id, criar nota simples no banco (modo manual)
      if (!initialData?.report_id) {
        const { data: lastNote } = await supabase
          .from('notes')
          .select('nf_number')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const nextNumber = lastNote 
          ? (parseInt(lastNote.nf_number) + 1).toString().padStart(6, '0')
          : '000001';

        const noteData = {
          nf_number: nextNumber,
          company_logo: data.company_logo,
          phone: data.phone,
          nf_date: data.nf_date,
          nf_due_date: data.nf_due_date,
          company_name: data.company_name,
          address: data.address || null,
          cnpj_cpf: data.cnpj_cpf || null,
          city: data.city || null,
          cep: data.cep || null,
          uf: data.uf || null,
          nf_value: data.nf_value,
          descricao: data.descricao || null,
          obs: data.obs || null,
          report_id: null,
          file_xlsx_path: null,
          file_pdf_path: null
        };

        if (isEditing && noteId) {
          await supabase
            .from('notes')
            .update(noteData)
            .eq('id', noteId);
        } else {
          await supabase
            .from('notes')
            .insert(noteData);
        }

        onSuccess?.();
        return;
      }

      // Se há report_id, usar API backend para gerar arquivos
      const apiPayload = {
        report_id: initialData.report_id,
        company_logo: data.company_logo,
        phone: data.phone,
        nf_date: data.nf_date,
        nf_due_date: data.nf_due_date,
        company_name: data.company_name,
        address: data.address || '',
        cnpj_cpf: data.cnpj_cpf || '',
        city: data.city || '',
        cep: data.cep || '',
        uf: data.uf || '',
        nf_value: data.nf_value,
        descricao: data.descricao || '',
        obs: data.obs || ''
      };

      const result = await ApiService.generateNote(apiPayload);

      if (result.ok) {
        onSuccess?.();
      } else {
        throw new Error(result.message || 'Erro ao gerar nota fiscal');
      }

    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      setGenerationError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo da Empresa */}
        <FormField label="Logo da Empresa" error={errors.company_logo?.message}>
          <select
            {...register('company_logo')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="felixmix">Félix Mix</option>
            <option value="worldrental">World Rental</option>
          </select>
        </FormField>

        {/* Telefone */}
        <FormField label="Telefone" error={errors.phone?.message}>
          <input
            {...register('phone')}
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="(11) 99999-9999"
          />
        </FormField>

        {/* Data da Nota */}
        <DatePicker
          value={watch('nf_date')}
          onChange={(value) => setValue('nf_date', value)}
          label="Data da Nota"
          error={errors.nf_date?.message}
          required
        />

        {/* Data de Vencimento */}
        <DatePicker
          value={watch('nf_due_date')}
          onChange={(value) => setValue('nf_due_date', value)}
          label="Data de Vencimento"
          minDate={watch('nf_date')}
          error={errors.nf_due_date?.message}
          required
        />

        {/* Nome da Empresa */}
        <FormField label="Nome da Empresa" error={errors.company_name?.message}>
          <input
            {...register('company_name')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nome da empresa cliente"
          />
        </FormField>

        {/* CNPJ/CPF */}
        <FormField label="CNPJ/CPF" error={errors.cnpj_cpf?.message}>
          <input
            {...register('cnpj_cpf')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="00.000.000/0000-00"
          />
        </FormField>

        {/* Endereço */}
        <FormField label="Endereço" error={errors.address?.message}>
          <input
            {...register('address')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Rua, número, bairro"
          />
        </FormField>

        {/* CEP */}
        <FormField label="CEP" error={errors.cep?.message}>
          <input
            {...register('cep')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="00000-000"
          />
        </FormField>

        {/* Cidade */}
        <FormField label="Cidade" error={errors.city?.message}>
          <input
            {...register('city')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nome da cidade"
          />
        </FormField>

        {/* UF */}
        <FormField label="UF" error={errors.uf?.message}>
          <input
            {...register('uf')}
            type="text"
            maxLength={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="SP"
          />
        </FormField>

        {/* Valor */}
        <FormField label="Valor da Nota" error={errors.nf_value?.message}>
          <div className="relative">
            <input
              {...register('nf_value', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
            />
            {watchedValue > 0 && (
              <div className="mt-1 text-sm text-gray-600">
                {formatCurrency(watchedValue)}
              </div>
            )}
          </div>
        </FormField>
      </div>

      {/* Descrição */}
      <FormField label="Descrição" error={errors.descricao?.message}>
        <textarea
          {...register('descricao')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Descrição dos serviços prestados"
        />
      </FormField>

      {/* Observações */}
      <FormField label="Observações" error={errors.obs?.message}>
        <textarea
          {...register('obs')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Observações adicionais"
        />
      </FormField>

      {/* Erro de geração */}
      {generationError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erro ao gerar nota fiscal
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {generationError}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting || isGenerating}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isGenerating}
        >
          {isGenerating ? 'Gerando arquivos...' : 
           isSubmitting ? 'Salvando...' : 
           (isEditing ? 'Atualizar' : 'Criar Nota')}
        </Button>
      </div>
    </form>
  );
};
