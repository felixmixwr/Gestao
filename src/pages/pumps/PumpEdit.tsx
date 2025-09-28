import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Layout } from '../../components/Layout'
import { FormField, FormTextarea } from '../../components/FormField'
import { Select } from '../../components/Select'
import { Button } from '../../components/Button'
import { supabase } from '../../lib/supabase'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../lib/toast-hooks'
import { Database } from '../../lib/supabase'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'

type Company = Database['public']['Tables']['companies']['Row']
type Pump = Database['public']['Tables']['pumps']['Row']

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

export default function PumpEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [pump, setPump] = useState<Pump | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingPrefix, setCheckingPrefix] = useState(false)

  const {
    handleSubmit,
    control,
    setError: setFormError,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange'
  })

  async function fetchPumpAndCompanies() {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      // Buscar dados da bomba
      const { data: pumpData, error: pumpError } = await supabase
        .from('pumps')
        .select('*')
        .eq('id', id)
        .single()

      if (pumpError) throw pumpError

      // Buscar empresas
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('name')

      if (companiesError) throw companiesError

      setPump(pumpData)
      setCompanies(companiesData || [])

      // Preencher formulário com dados da bomba
      reset({
        prefix: pumpData.prefix || '',
        model: pumpData.model || '',
        pump_type: pumpData.pump_type || null,
        brand: pumpData.brand || '',
        capacity_m3h: pumpData.capacity_m3h?.toString() || '',
        year: pumpData.year?.toString() || '',
        status: pumpData.status || 'Disponível',
        owner_company_id: pumpData.owner_company_id || '',
        notes: pumpData.notes || ''
      })
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err)
      setError(err?.message || 'Erro ao carregar dados da bomba')
    } finally {
      setLoading(false)
    }
  }

  async function checkPrefixUnique(prefix: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('pumps')
        .select('id')
        .eq('prefix', prefix)
        .neq('id', id) // Excluir a bomba atual da verificação
        .limit(1)

      if (error) throw error
      return !data || data.length === 0
    } catch (err: any) {
      console.error('Erro ao verificar prefixo:', err)
      return false
    }
  }

  useEffect(() => {
    fetchPumpAndCompanies()
  }, [id])

  const onSubmit = async (values: FormValues) => {
    if (!id) return

    try {
      // Verificar unicidade do prefixo se foi alterado
      if (values.prefix !== pump?.prefix) {
        setCheckingPrefix(true)
        const isUnique = await checkPrefixUnique(values.prefix)
        setCheckingPrefix(false)

        if (!isUnique) {
          setFormError('prefix', { 
            type: 'manual', 
            message: 'Prefixo já cadastrado' 
          })
          return
        }
      }

      // Preparar dados para atualização
      const updateData = {
        ...values
      }

      const { error } = await supabase
        .from('pumps')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      addToast({ message: 'Bomba atualizada com sucesso!', type: 'success' })
      navigate(`/pumps/${id}`)
    } catch (err: any) {
      console.error('Erro ao atualizar bomba:', err)
      addToast({ 
        message: err?.message || 'Erro ao atualizar bomba', 
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
        title="Erro ao carregar bomba" 
        message={error} 
        onRetry={fetchPumpAndCompanies} 
      />
    )
  }

  if (!pump) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Bomba não encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            A bomba que você está tentando editar não existe ou foi removida.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate('/pumps')}>
              Voltar para lista de bombas
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  const companyOptions = companies.map(company => ({
    value: company.id,
    label: company.name
  }))

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Editar Bomba</h2>
          <p className="mt-1 text-sm text-gray-600">
            Atualize as informações da bomba {pump.prefix}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              name="prefix"
              control={control}
              render={({ field }) => (
                <FormField
                  label="Prefixo"
                  required
                  error={errors.prefix?.message}
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Ex: BM-001"
                />
              )}
            />

            <Controller
              name="model"
              control={control}
              render={({ field }) => (
                <FormField
                  label="Modelo"
                  error={errors.model?.message}
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Ex: Modelo ABC-123"
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              name="pump_type"
              control={control}
              render={({ field }) => (
                <Select
                  label="Tipo da Bomba"
                  options={PUMP_TYPE_OPTIONS}
                  value={field.value || ''}
                  onChange={field.onChange}
                  error={errors.pump_type?.message}
                  placeholder="Selecione o tipo"
                />
              )}
            />

            <Controller
              name="brand"
              control={control}
              render={({ field }) => (
                <FormField
                  label="Marca"
                  error={errors.brand?.message}
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Ex: Schwing, Putzmeister"
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              name="capacity_m3h"
              control={control}
              render={({ field }) => (
                <FormField
                  label="Capacidade (m³/h)"
                  error={errors.capacity_m3h?.message}
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  type="number"
                  step="0.1"
                  placeholder="Ex: 45.5"
                />
              )}
            />

            <Controller
              name="year"
              control={control}
              render={({ field }) => (
                <FormField
                  label="Ano"
                  error={errors.year?.message}
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder="Ex: 2020"
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={field.value || ''}
                  onChange={field.onChange}
                  error={errors.status?.message}
                />
              )}
            />

            <Controller
              name="owner_company_id"
              control={control}
              render={({ field }) => (
                <Select
                  label="Empresa Proprietária"
                  required
                  options={companyOptions}
                  value={field.value || ''}
                  onChange={field.onChange}
                  error={errors.owner_company_id?.message}
                  placeholder="Selecione a empresa"
                />
              )}
            />
          </div>

          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <FormTextarea
                label="Observações"
                error={errors.notes?.message}
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Informações adicionais sobre a bomba..."
              />
            )}
          />

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/pumps/${id}`)} 
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
