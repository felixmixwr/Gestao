import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../lib/toast-hooks'
import { useViaCep } from '../../hooks/useViaCep'
import { formatPhone, formatCep, validatePhone, validateCep } from '../../utils/masks'

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

export default function NewClient() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { fetchCep, error: cepError } = useViaCep()
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingData, setPendingData] = useState<FormValues | null>(null)
  const [forceUpdate, setForceUpdate] = useState(0)

  const {
    handleSubmit,
    control,
    setValue,
    trigger,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      rep_name: '',
      company_name: '',
      legal_name: '',
      document: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      cep: '',
      notes: ''
    }
  })

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

  async function doInsert(values: FormValues) {
    // Preparar dados para inserção, garantindo que o campo 'name' seja preenchido
    const insertData = {
      ...values,
      // Garantir que o campo 'name' seja preenchido com company_name ou rep_name
      name: values.company_name || values.rep_name || 'Cliente sem nome'
    }
    
    console.log('Inserindo cliente:', insertData) // Debug log
    console.log('Campos específicos:', {
      name: insertData.name,
      company_name: insertData.company_name,
      email: insertData.email,
      rep_name: insertData.rep_name,
      phone: insertData.phone,
      address: insertData.address,
      city: insertData.city,
      state: insertData.state
    })
    
    const insertRes = await supabase
      .from('clients')
      .insert(insertData)
      .select()
      .single()

    if (insertRes.error) {
      console.error('Erro ao inserir cliente:', insertRes.error)
      throw insertRes.error
    }
    return insertRes.data
  }

  const onSubmit = async (values: FormValues) => {
    try {
      // valida duplicidade por document (se informado)
      if (values.document) {
        setCheckingDuplicate(true)
        const dup = await supabase
          .from('clients')
          .select('id')
          .eq('document', values.document)
          .limit(1)
        setCheckingDuplicate(false)
        if (dup.error) throw dup.error
        if (dup.data && dup.data.length > 0) {
          setPendingData(values)
          setConfirmOpen(true)
          return
        }
      }

      const created = await doInsert(values)
      addToast({ message: 'Cliente criado', type: 'success' })
      navigate('/clients')
      return created
    } catch (err: any) {
      console.error('Create client error:', { message: err?.message, values })
      addToast({ message: err?.message || 'Erro ao criar cliente', type: 'error' })
    }
  }

  async function confirmDuplicate() {
    if (!pendingData) return
    try {
      const created = await doInsert(pendingData)
      addToast({ message: 'Cliente criado (duplicado permitido)', type: 'success' })
      navigate('/clients')
      return created
    } catch (err: any) {
      console.error('Create duplicate client error:', { message: err?.message, values: pendingData })
      addToast({ message: err?.message || 'Erro ao criar cliente', type: 'error' })
    } finally {
      setConfirmOpen(false)
      setPendingData(null)
    }
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Novo Cliente</h2>
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
            
            <div className="space-y-6">
              {/* CEP primeiro para preenchimento automático */}
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
                        console.log('CEP onKeyUp:', cep, 'length:', cep.length)
                        if (cep.length === 8) {
                          console.log('Chamando handleCepSearch com CEP (onKeyUp):', cep)
                          handleCepSearch(cep)
                        }
                      }}
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        const cep = e.target.value.replace(/\D/g, '')
                        console.log('CEP onBlur:', cep, 'length:', cep.length)
                        if (cep.length === 8) {
                          console.log('Chamando handleCepSearch com CEP (onBlur):', cep)
                          handleCepSearch(cep)
                        } else {
                          console.log('CEP não tem 8 dígitos, não buscando')
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
              
              {/* Endereço */}
              <Controller
                key={`address-${forceUpdate}`}
                name="address"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endereço
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Ex: Rua das Flores, 123"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                    )}
                  </div>
                )}
              />
              
              {/* Cidade e Estado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        maxLength={2}
                      />
                      {errors.state && (
                        <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>
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
                    Notas adicionais
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

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => history.back()} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || checkingDuplicate}>
              {isSubmitting || checkingDuplicate ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Documento já existe"
        message={<div>Já existe um cliente com o mesmo documento. Deseja criar mesmo assim?</div>}
        confirmText="Criar duplicado"
        cancelText="Cancelar"
        onConfirm={confirmDuplicate}
        onCancel={() => { setConfirmOpen(false); setPendingData(null) }}
      />
    </Layout>
  )
}


