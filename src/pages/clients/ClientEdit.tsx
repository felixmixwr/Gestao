import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { supabase } from '../../lib/supabase'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../lib/toast-hooks'
import { useViaCep } from '../../hooks/useViaCep'
import { formatPhone, formatCep, validatePhone, validateCep } from '../../utils/masks'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'

const schema = z.object({
  rep_name: z.string({ required_error: 'Obrigatório' }).trim().min(1, 'Obrigatório'),
  company_name: z.string().optional().transform(v => v || null),
  legal_name: z.string().optional().transform(v => v || null),
  document: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.replace(/\D/g, '') : null))
    .refine((v) => !v || v.length === 11 || v.length === 14, {
      message: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos'
    }),
  email: z.string().optional().transform(v => v && v.trim() ? v.trim() : null).refine((v) => !v || z.string().email().safeParse(v).success, { message: 'Email inválido' }),
  phone: z
    .string()
    .optional()
    .transform((v) => (v ? v.replace(/\D/g, '') : null))
    .refine((v) => !v || validatePhone(v), { message: 'Telefone deve ter 10 ou 11 dígitos' }),
  address: z.string().optional().transform(v => v || null),
  city: z.string().optional().transform(v => v || null),
  state: z.string().optional().transform(v => v || null),
  cep: z
    .string()
    .optional()
    .transform((v) => (v ? v.replace(/\D/g, '') : null))
    .refine((v) => !v || validateCep(v), { message: 'CEP deve ter 8 dígitos' }),
  notes: z.string().optional().transform(v => v || null)
})

type FormValues = z.infer<typeof schema>

type Client = {
  id: string
  rep_name?: string | null
  company_name?: string | null
  legal_name?: string | null
  document?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  cep?: string | null
  notes?: string | null
}

export default function ClientEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { fetchCep, error: cepError } = useViaCep()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forceUpdate, setForceUpdate] = useState(0)

  const {
    handleSubmit,
    control,
    setValue,
    trigger,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  async function fetchClient() {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (clientError) throw clientError

      setClient(clientData)

      // Preencher formulário com dados do cliente
      reset({
        rep_name: clientData.rep_name || '',
        company_name: clientData.company_name || '',
        legal_name: clientData.legal_name || '',
        document: clientData.document || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        address: clientData.address || '',
        city: clientData.city || '',
        state: clientData.state || '',
        cep: clientData.cep || '',
        notes: clientData.notes || ''
      })
    } catch (err: any) {
      console.error('Erro ao buscar cliente:', err)
      setError(err?.message || 'Erro ao carregar dados do cliente')
    } finally {
      setLoading(false)
    }
  }

  async function handleCepSearch(cep: string) {
    console.log('Buscando CEP:', cep)
    
    if (!validateCep(cep)) {
      console.log('CEP inválido:', cep)
      return
    }
    
    const cepData = await fetchCep(cep)
    console.log('Dados do CEP recebidos:', cepData)
    
    if (cepData) {
      console.log('Preenchendo campos:', {
        address: cepData.logradouro,
        city: cepData.localidade,
        state: cepData.uf
      })
      
      // Usar setValue com todas as opções
      setValue('address', cepData.logradouro, { 
        shouldValidate: true, 
        shouldDirty: true, 
        shouldTouch: true 
      })
      setValue('city', cepData.localidade, { 
        shouldValidate: true, 
        shouldDirty: true, 
        shouldTouch: true 
      })
      setValue('state', cepData.uf, { 
        shouldValidate: true, 
        shouldDirty: true, 
        shouldTouch: true 
      })
      
      console.log('Valores definidos:', {
        address: cepData.logradouro,
        city: cepData.localidade,
        state: cepData.uf
      })
      
      // Forçar re-renderização dos campos
      await trigger(['address', 'city', 'state'])
      
      // Forçar re-renderização do componente
      setForceUpdate(prev => prev + 1)
      
      addToast({ message: 'Endereço preenchido automaticamente!', type: 'success' })
    } else if (cepError) {
      console.log('Erro ao buscar CEP:', cepError)
      addToast({ message: cepError, type: 'error' })
    }
  }

  function formatCpfCnpj(value: string) {
    const digits = (value || '').replace(/\D/g, '').slice(0, 14)
    if (digits.length <= 11) {
      // CPF: 000.000.000-00 (parcial progressivo)
      const part1 = digits.slice(0, 3)
      const part2 = digits.slice(3, 6)
      const part3 = digits.slice(6, 9)
      const part4 = digits.slice(9, 11)
      let out = part1
      if (part2) out += `.${part2}`
      if (part3) out += `.${part3}`
      if (part4) out += `-${part4}`
      return out
    } else {
      // CNPJ: 00.000.000/0000-00 (parcial progressivo)
      const part1 = digits.slice(0, 2)
      const part2 = digits.slice(2, 5)
      const part3 = digits.slice(5, 8)
      const part4 = digits.slice(8, 12)
      const part5 = digits.slice(12, 14)
      let out = part1
      if (part2) out += `.${part2}`
      if (part3) out += `.${part3}`
      if (part4) out += `/${part4}`
      if (part5) out += `-${part5}`
      return out
    }
  }

  useEffect(() => {
    fetchClient()
  }, [id])

  const onSubmit = async (values: FormValues) => {
    if (!id) return

    try {
      const { error } = await supabase
        .from('clients')
        .update(values)
        .eq('id', id)

      if (error) throw error

      addToast({ message: 'Cliente atualizado com sucesso!', type: 'success' })
      navigate(`/clients/${id}`)
    } catch (err: any) {
      console.error('Erro ao atualizar cliente:', err)
      addToast({ 
        message: err?.message || 'Erro ao atualizar cliente', 
        type: 'error' 
      })
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loading />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <GenericError 
        title="Erro ao carregar cliente" 
        message={error} 
        onRetry={fetchClient} 
      />
    )
  }

  if (!client) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Cliente não encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            O cliente que você está tentando editar não existe ou foi removido.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate('/clients')}>
              Voltar para lista de clientes
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Editar Cliente</h2>
          <p className="mt-1 text-sm text-gray-600">
            Atualize as informações do cliente {client.rep_name || client.company_name}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Seção: Dados do Cliente */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Dados do Cliente</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Representante */}
              <Controller
                name="rep_name"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do representante *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Ex: João Silva"
                    />
                    {errors.rep_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.rep_name.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Empresa */}
              <Controller
                key={`company_name-${forceUpdate}`}
                name="company_name"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da empresa
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Ex: Construtora ABC Ltda"
                    />
                    {errors.company_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Razão Social */}
              <Controller
                key={`legal_name-${forceUpdate}`}
                name="legal_name"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Razão social
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Ex: Construtora ABC Ltda"
                    />
                    {errors.legal_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.legal_name.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Documento */}
              <Controller
                name="document"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CPF/CNPJ
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formatCpfCnpj(field.value || '')}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 14)
                        field.onChange(digits)
                      }}
                      onBlur={field.onBlur}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    />
                    {errors.document && (
                      <p className="mt-1 text-sm text-red-600">{errors.document.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Seção: Informações de Contato */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Informações de Contato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <Controller
                key={`email-${forceUpdate}`}
                name="email"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="exemplo@empresa.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Telefone */}
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formatPhone(field.value || '')}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
                        field.onChange(digits)
                      }}
                      onBlur={field.onBlur}
                      placeholder="(00) 00000-0000"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Seção: Endereço */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Endereço</h3>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CEP */}
              <Controller
                name="cep"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formatCep(field.value || '')}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
                        field.onChange(digits)
                      }}
                      onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        const cep = e.currentTarget.value.replace(/\D/g, '')
                        if (cep.length === 8) {
                          handleCepSearch(cep)
                        }
                      }}
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        const cep = e.target.value.replace(/\D/g, '')
                        if (cep.length === 8) {
                          handleCepSearch(cep)
                        }
                      }}
                      placeholder="00000-000"
                    />
                    {errors.cep && (
                      <p className="mt-1 text-sm text-red-600">{errors.cep.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Cidade */}
              <Controller
                key={`city-${forceUpdate}`}
                name="city"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Ex: São Paulo"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Estado */}
              <Controller
                key={`state-${forceUpdate}`}
                name="state"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Ex: SP"
                    />
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Endereço */}
            <Controller
              key={`address-${forceUpdate}`}
              name="address"
              control={control}
              render={({ field }) => (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Ex: Rua das Flores, 123 - Centro"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Seção: Observações */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Observações</h3>
            
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Informações adicionais sobre o cliente..."
                  />
                  {errors.notes && (
                    <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/clients/${id}`)} 
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
