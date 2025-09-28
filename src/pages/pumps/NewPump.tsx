import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../lib/toast-hooks'
import { Database } from '../../lib/supabase'

type Company = Database['public']['Tables']['companies']['Row']

const schema = z.object({
  prefix: z.string({ required_error: 'Obrigatório' }).trim().min(1, 'Obrigatório'),
  model: z.string().optional().transform(v => v && v.trim() ? v.trim() : null),
  pump_type: z.enum(['Estacionária', 'Lança']).optional().transform(v => v || null),
  brand: z.string().optional().transform(v => v && v.trim() ? v.trim() : null),
  capacity_m3h: z.string().optional().transform(v => {
    if (!v || !v.trim()) return null
    const num = parseFloat(v.replace(',', '.'))
    return isNaN(num) ? null : num
  }),
  year: z.string().optional().transform(v => {
    if (!v || !v.trim()) return null
    const num = parseInt(v)
    return isNaN(num) ? null : num
  }),
  status: z.enum(['Disponível', 'Em Uso', 'Em Manutenção']).default('Disponível'),
  owner_company_id: z.string({ required_error: 'Obrigatório' }).min(1, 'Obrigatório'),
  notes: z.string().optional().transform(v => v && v.trim() ? v.trim() : null)
})

type FormValues = z.infer<typeof schema>

const PUMP_TYPE_OPTIONS = [
  { value: 'Estacionária', label: 'Estacionária' },
  { value: 'Lança', label: 'Lança' }
]

const STATUS_OPTIONS = [
  { value: 'Disponível', label: 'Disponível' },
  { value: 'Em Uso', label: 'Em Uso' },
  { value: 'Em Manutenção', label: 'Em Manutenção' }
]

export default function NewPump() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [checkingPrefix, setCheckingPrefix] = useState(false)

  const {
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      prefix: '',
      model: '',
      pump_type: null,
      brand: '',
      capacity_m3h: null,
      year: null,
      status: 'Disponível',
      owner_company_id: '',
      notes: ''
    }
  })

  async function fetchCompanies() {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar empresas:', err)
      addToast({ message: 'Erro ao carregar empresas', type: 'error' })
    }
  }

  async function checkPrefixUnique(prefix: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('pumps')
        .select('id')
        .eq('prefix', prefix)
        .limit(1)

      if (error) throw error
      return !data || data.length === 0
    } catch (err: any) {
      console.error('Erro ao verificar prefixo:', err)
      return false
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const onSubmit = async (values: FormValues) => {
    try {
      // Verificar unicidade do prefixo
      setCheckingPrefix(true)
      const isUnique = await checkPrefixUnique(values.prefix)
      setCheckingPrefix(false)

      if (!isUnique) {
        setError('prefix', { 
          type: 'manual', 
          message: 'Prefixo já cadastrado' 
        })
        return
      }

      // Preparar dados para inserção
      const insertData = {
        ...values,
        total_billed: 0.0
      }

      const { error } = await supabase
        .from('pumps')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      addToast({ message: 'Bomba criada com sucesso!', type: 'success' })
      navigate('/pumps')
    } catch (err: any) {
      console.error('Erro ao criar bomba:', err)
      addToast({ 
        message: err?.message || 'Erro ao criar bomba', 
        type: 'error' 
      })
    }
  }

  const companyOptions = companies.map(company => ({
    value: company.id,
    label: company.name
  }))

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nova Bomba</h2>
          <p className="mt-1 text-sm text-gray-600">
            Cadastre uma nova bomba no sistema
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Seção: Dados da Bomba */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Dados da Bomba</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prefixo */}
              <Controller
                name="prefix"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prefixo *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Ex: BM-001"
                    />
                    {errors.prefix && (
                      <p className="mt-1 text-sm text-red-600">{errors.prefix.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Modelo */}
              <Controller
                name="model"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modelo
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Ex: Modelo ABC-123"
                    />
                    {errors.model && (
                      <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Tipo da Bomba */}
              <Controller
                name="pump_type"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo da Bomba
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                    >
                      <option value="">Selecione o tipo</option>
                      {PUMP_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.pump_type && (
                      <p className="mt-1 text-sm text-red-600">{errors.pump_type.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Marca */}
              <Controller
                name="brand"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marca
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Ex: Schwing, Putzmeister"
                    />
                    {errors.brand && (
                      <p className="mt-1 text-sm text-red-600">{errors.brand.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Seção: Especificações Técnicas */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Especificações Técnicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Capacidade */}
              <Controller
                name="capacity_m3h"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacidade (m³/h)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Ex: 45.5"
                    />
                    {errors.capacity_m3h && (
                      <p className="mt-1 text-sm text-red-600">{errors.capacity_m3h.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Ano */}
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ano de Fabricação
                    </label>
                    <input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Ex: 2020"
                    />
                    {errors.year && (
                      <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Seção: Status e Propriedade */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Status e Propriedade</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                    >
                      {STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Empresa Proprietária */}
              <Controller
                name="owner_company_id"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa Proprietária *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                    >
                      <option value="">Selecione a empresa</option>
                      {companyOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.owner_company_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.owner_company_id.message}</p>
                    )}
                  </div>
                )}
              />
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
                    Observações
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Informações adicionais sobre a bomba..."
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
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/pumps')} 
              disabled={isSubmitting || checkingPrefix}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || checkingPrefix}
            >
              {isSubmitting || checkingPrefix ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
