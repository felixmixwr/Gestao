import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Layout } from '../../components/Layout';
import { Button } from '../../components/Button';
import { NotePreview } from '../../components/NotePreview';
import { CompanySelector } from '../../components/CompanySelector';
import { CurrencyInputWithValidation } from '../../components/CurrencyInputWithValidation';
import { DatePicker } from '../../components/ui/date-picker';
import { PhoneInputWithValidation } from '../../components/PhoneInputWithValidation';
import { CEPInputWithValidation } from '../../components/CEPInputWithValidation';
import { DocumentInputWithValidation } from '../../components/DocumentInputWithValidation';
import { UFSelector } from '../../components/UFSelector';
import { TextAreaWithCounter } from '../../components/TextAreaWithCounter';
import { CompanyNameInputWithValidation } from '../../components/CompanyNameInputWithValidation';
import { AddressInputWithValidation } from '../../components/AddressInputWithValidation';
import { CityInputWithValidation } from '../../components/CityInputWithValidation';

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

/**
 * Página para criação de nova nota fiscal com preview em tempo real
 */
export const NewNote: React.FC = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const {
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      company_logo: 'felixmix',
      phone: '',
      nf_date: new Date().toISOString().split('T')[0],
      nf_due_date: '',
      company_name: '',
      address: '',
      cnpj_cpf: '',
      city: '',
      cep: '',
      uf: '',
      nf_value: 0,
      descricao: '',
      obs: ''
    }
  });

  // Watch all form values for real-time preview
  const watchedValues = watch();

  // Verificar permissões do usuário
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // TODO: Implementar verificação de role do usuário
          setUserRole('admin'); // Mock
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
      } finally {
        setLoading(false);
      }
    };
    checkUserRole();
  }, []);

  const handleBack = () => {
    navigate('/notes');
  };

  const onSubmit = async (data: NoteFormData) => {
    try {
      setIsSubmitting(true);
      setGenerationError(null);

      // Gerar número da nota fiscal (sequencial simples)
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

      await supabase
        .from('notes')
        .insert(noteData);

      // Redirecionar para lista após sucesso
      navigate('/notes');
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      setGenerationError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreateNotes = ['admin', 'financeiro'].includes(userRole);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Verificando permissões...</div>
        </div>
      </Layout>
    );
  }

  if (!canCreateNotes) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              Você não tem permissão para criar notas fiscais
            </div>
            <Button onClick={handleBack}>
              Voltar para Lista
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Button
              variant="secondary"
              onClick={handleBack}
              className="mb-4"
            >
              ← Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Nova Nota Fiscal</h1>
            <p className="text-gray-600">
              Preencha os dados e visualize a nota em tempo real
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Dados da Nota</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Logo da Empresa */}
                <CompanySelector
                  value={watchedValues.company_logo}
                  onChange={(value) => setValue('company_logo', value)}
                  error={errors.company_logo?.message}
                />

                {/* Telefone */}
                <PhoneInputWithValidation
                  value={watchedValues.phone}
                  onChange={(value) => setValue('phone', value)}
                  error={errors.phone?.message}
                  label="Telefone"
                  required
                />

                {/* Data da Nota */}
                <DatePicker
                  value={watchedValues.nf_date}
                  onChange={(value) => setValue('nf_date', value)}
                  error={errors.nf_date?.message}
                  label="Data da Nota"
                  required
                />

                {/* Data de Vencimento */}
                <DatePicker
                  value={watchedValues.nf_due_date}
                  onChange={(value) => setValue('nf_due_date', value)}
                  error={errors.nf_due_date?.message}
                  label="Data de Vencimento"
                  minDate={watchedValues.nf_date}
                  required
                />

                {/* Nome da Empresa */}
                <CompanyNameInputWithValidation
                  value={watchedValues.company_name}
                  onChange={(value) => setValue('company_name', value)}
                  error={errors.company_name?.message}
                  label="Nome da Empresa"
                  required
                />

                {/* CNPJ/CPF */}
                <DocumentInputWithValidation
                  value={watchedValues.cnpj_cpf || ''}
                  onChange={(value) => setValue('cnpj_cpf', value)}
                  error={errors.cnpj_cpf?.message}
                  label="CNPJ/CPF"
                />

                {/* Endereço */}
                <AddressInputWithValidation
                  value={watchedValues.address || ''}
                  onChange={(value) => setValue('address', value)}
                  error={errors.address?.message}
                  label="Endereço"
                />

                {/* CEP */}
                <CEPInputWithValidation
                  value={watchedValues.cep || ''}
                  onChange={(value) => setValue('cep', value)}
                  onAddressFound={(address) => {
                    setValue('address', address.logradouro);
                    setValue('city', address.localidade);
                    setValue('uf', address.uf);
                  }}
                  error={errors.cep?.message}
                  label="CEP"
                />

                {/* Cidade */}
                <CityInputWithValidation
                  value={watchedValues.city || ''}
                  onChange={(value) => setValue('city', value)}
                  error={errors.city?.message}
                  label="Cidade"
                />

                {/* UF */}
                <UFSelector
                  value={watchedValues.uf || ''}
                  onChange={(value) => setValue('uf', value)}
                  error={errors.uf?.message}
                  label="UF"
                />

                {/* Valor */}
                <CurrencyInputWithValidation
                  value={watchedValues.nf_value}
                  onChange={(value) => setValue('nf_value', value)}
                  error={errors.nf_value?.message}
                  label="Valor da Nota"
                  placeholder="0,00"
                  required
                  minValue={0.01}
                  maxValue={999999.99}
                />

                {/* Descrição */}
                <TextAreaWithCounter
                  value={watchedValues.descricao || ''}
                  onChange={(value) => setValue('descricao', value)}
                  error={errors.descricao?.message}
                  label="Descrição"
                  placeholder="Descrição dos serviços prestados"
                  maxLength={500}
                  rows={3}
                />

                {/* Observações */}
                <TextAreaWithCounter
                  value={watchedValues.obs || ''}
                  onChange={(value) => setValue('obs', value)}
                  error={errors.obs?.message}
                  label="Observações"
                  placeholder="Observações adicionais"
                  maxLength={300}
                  rows={3}
                />

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
                          Erro ao salvar nota
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
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Salvando...' : 'Criar Nota'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Preview da Nota */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Preview da Nota</h2>
              <NotePreview data={watchedValues} />
            </div>

            {/* Informações de Ajuda */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800">💡 Dica</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>O preview é atualizado em tempo real conforme você preenche os campos. Campos marcados com * são obrigatórios.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
