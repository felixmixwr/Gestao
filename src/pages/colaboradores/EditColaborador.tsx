import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../lib/toast-hooks'
import { COLABORADOR_FUNCOES, TIPOS_CONTRATO } from '../../types/colaboradores'

const schema = z.object({
  nome: z.string({ required_error: 'Obrigatório' }).trim().min(1, 'Nome é obrigatório'),
  funcao: z.enum(['Motorista Operador de Bomba', 'Auxiliar de Bomba', 'Programador', 'Administrador Financeiro', 'Fiscal de Obras', 'Mecânico'], {
    required_error: 'Função é obrigatória'
  }),
  tipo_contrato: z.enum(['fixo', 'diarista'], {
    required_error: 'Tipo de contrato é obrigatório'
  }),
  salario_fixo: z.number({ required_error: 'Salário é obrigatório' }).min(0, 'Salário não pode ser negativo'),
  data_pagamento_1: z.string().optional().transform(v => v && v.trim() ? v.trim() : null),
  data_pagamento_2: z.string().optional().transform(v => v && v.trim() ? v.trim() : null),
  valor_pagamento_1: z.number().optional(),
  valor_pagamento_2: z.number().optional(),
  equipamento_vinculado_id: z.string().optional().transform(v => v && v.trim() ? v.trim() : null),
  registrado: z.boolean().default(false),
  vale_transporte: z.boolean().default(false),
  qtd_passagens_por_dia: z.number().optional(),
  cpf: z.string().optional().transform(v => v && v.trim() ? v.trim() : null),
  telefone: z.string().optional().transform(v => v && v.trim() ? v.trim() : null),
  email: z.string().optional().transform(v => v && v.trim() ? v.trim() : null).refine((v) => !v || z.string().email().safeParse(v).success, { message: 'Email inválido' }),
  company_id: z.string({ required_error: 'Empresa é obrigatória' })
})

type FormValues = z.infer<typeof schema>

interface Pump {
  id: string
  prefix: string
  model?: string
  brand?: string
  status?: string
  company_name?: string
  companies?: { name: string }
}

export default function EditColaborador() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [pumps, setPumps] = useState<Pump[]>([])
  const [loadingPumps, setLoadingPumps] = useState(true)
  const [companies, setCompanies] = useState<{id: string, name: string}[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [loadingColaborador, setLoadingColaborador] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const tipoContrato = watch('tipo_contrato')
  const valeTransporte = watch('vale_transporte')

  useEffect(() => {
    if (id) {
      loadCompanies()
      loadPumps()
      loadColaborador()
    }
  }, [id])

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true)
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (err) {
      console.error('Erro ao carregar empresas:', err)
      addToast({ message: 'Erro ao carregar empresas', type: 'error' })
    } finally {
      setLoadingCompanies(false)
    }
  }

  const loadPumps = async () => {
    try {
      setLoadingPumps(true)

      const { data, error } = await supabase
        .from('pumps')
        .select(`
          id, 
          prefix, 
          model, 
          brand,
          status,
          companies!pumps_owner_company_id_fkey(name)
        `)
        .order('prefix')

      if (error) throw error
      
      // Transformar dados para incluir company_name
      const pumpsWithCompany = (data || []).map(pump => ({
        id: pump.id,
        prefix: pump.prefix,
        model: pump.model,
        brand: pump.brand,
        status: pump.status,
        company_name: (pump.companies as any)?.name || 'N/A'
      }))
      
      setPumps(pumpsWithCompany)
    } catch (err) {
      console.error('Erro ao carregar bombas:', err)
      addToast({ message: 'Erro ao carregar bombas', type: 'error' })
    } finally {
      setLoadingPumps(false)
    }
  }

  const loadColaborador = async () => {
    if (!id) return
    
    try {
      setLoadingColaborador(true)
      setError(null)

      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Preencher formulário com dados do colaborador
      setValue('nome', data.nome)
      setValue('funcao', data.funcao)
      setValue('tipo_contrato', data.tipo_contrato)
      setValue('salario_fixo', data.salario_fixo)
      setValue('data_pagamento_1', data.data_pagamento_1 || '')
      setValue('data_pagamento_2', data.data_pagamento_2 || '')
      setValue('valor_pagamento_1', data.valor_pagamento_1 || undefined)
      setValue('valor_pagamento_2', data.valor_pagamento_2 || undefined)
      setValue('equipamento_vinculado_id', data.equipamento_vinculado_id || '')
      setValue('registrado', data.registrado)
      setValue('vale_transporte', data.vale_transporte)
      setValue('qtd_passagens_por_dia', data.qtd_passagens_por_dia || undefined)
      setValue('cpf', data.cpf || '')
      setValue('telefone', data.telefone || '')
      setValue('email', data.email || '')
      setValue('company_id', data.company_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar colaborador')
    } finally {
      setLoadingColaborador(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (!id) return
    
    try {
      const { error } = await supabase
        .from('colaboradores')
        .update(values)
        .eq('id', id)
        .select()

      if (error) throw error

      addToast({ message: 'Colaborador atualizado com sucesso!', type: 'success' })
      navigate(`/colaboradores/${id}`)
    } catch (err: any) {
      console.error('Erro ao atualizar colaborador:', err)
      addToast({ message: err?.message || 'Erro ao atualizar colaborador', type: 'error' })
    }
  }


  if (loadingColaborador) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loading />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <GenericError 
        title="Erro ao carregar colaborador" 
        message={error} 
        onRetry={loadColaborador} 
      />
    )
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Editar Colaborador</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Seção: Dados do Colaborador */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Dados do Colaborador</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <Controller
                name="nome"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do colaborador *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Digite o nome completo"
                    />
                    {errors.nome && (
                      <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Empresa */}
              <Controller
                name="company_id"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={loadingCompanies}
                    >
                      <option value="">Selecione a empresa</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    {errors.company_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.company_id.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Função */}
              <Controller
                name="funcao"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Função *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="">Selecione a função</option>
                      {COLABORADOR_FUNCOES.map(funcao => (
                        <option key={funcao.value} value={funcao.value}>
                          {funcao.label}
                        </option>
                      ))}
                    </select>
                    {errors.funcao && (
                      <p className="mt-1 text-sm text-red-600">{errors.funcao.message}</p>
                    )}
                  </div>
                )}
              />

              {/* CPF */}
              <Controller
                name="cpf"
                control={control}
                render={({ field }) => {
                  const formatCPF = (value: string) => {
                    const digits = value.replace(/\D/g, '').slice(0, 11)
                    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                  }
                  
                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CPF *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formatCPF(field.value || '')}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
                          field.onChange(digits)
                        }}
                        onBlur={field.onBlur}
                        placeholder="000.000.000-00"
                      />
                      {errors.cpf && (
                        <p className="mt-1 text-sm text-red-600">{errors.cpf.message}</p>
                      )}
                    </div>
                  )
                }}
              />

              {/* Equipamento Vinculado */}
              <Controller
                name="equipamento_vinculado_id"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vincular a bomba (opcional)
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value || ''}
                      onChange={field.onChange}
                      disabled={loadingPumps}
                    >
                      <option value="">Selecione uma bomba</option>
                      {pumps.map(pump => (
                        <option key={pump.id} value={pump.id}>
                          {pump.prefix} - {pump.model} ({pump.brand}) - {pump.company_name} - {pump.status}
                        </option>
                      ))}
                    </select>
                    {errors.equipamento_vinculado_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.equipamento_vinculado_id.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Seção: Tipo de Pagamento */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-lg">💰</span>
              <span className="text-lg">💵</span>
              <h3 className="text-lg font-semibold text-gray-900">Tipo de Pagamento</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Forma de Pagamento */}
              <Controller
                name="tipo_contrato"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forma de pagamento *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="">Selecione a forma</option>
                      {TIPOS_CONTRATO.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                    {errors.tipo_contrato && (
                      <p className="mt-1 text-sm text-red-600">{errors.tipo_contrato.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Salário Fixo */}
              <Controller
                name="salario_fixo"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remuneração mensal (R$)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">R$</span>
                      </div>
                      <input
                        type="text"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={field.value ? field.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '')
                          const value = parseFloat(digits) / 100
                          field.onChange(value)
                        }}
                        onBlur={field.onBlur}
                        placeholder="0,00"
                      />
                    </div>
                    {errors.salario_fixo && (
                      <p className="mt-1 text-sm text-red-600">{errors.salario_fixo.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Campos específicos para contrato fixo */}
            {tipoContrato === 'fixo' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Datas e Valores de Pagamento</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="data_pagamento_1"
                    control={control}
                    render={({ field }) => {
                      const getCurrentDate = () => {
                        const now = new Date()
                        const year = now.getFullYear()
                        const month = String(now.getMonth() + 1).padStart(2, '0')
                        return `${year}-${month}`
                      }
                      
                      const formatDayInput = (value: string) => {
                        if (!value) return ''
                        const day = parseInt(value)
                        if (day >= 1 && day <= 31) {
                          const currentDate = getCurrentDate()
                          return `${currentDate}-${String(day).padStart(2, '0')}`
                        }
                        return value
                      }
                      
                      const getDayFromValue = (value: string) => {
                        if (!value) return ''
                        const parts = value.split('-')
                        return parts[2] || ''
                      }
                      
                      return (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dia Pagamento 1
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={getDayFromValue(field.value || '')}
                            onChange={(e) => {
                              const day = e.target.value
                              if (day === '') {
                                field.onChange('')
                              } else {
                                const fullDate = formatDayInput(day)
                                field.onChange(fullDate)
                              }
                            }}
                            onBlur={field.onBlur}
                            placeholder="Ex: 15"
                          />
                          {errors.data_pagamento_1 && (
                            <p className="mt-1 text-sm text-red-600">{errors.data_pagamento_1.message}</p>
                          )}
                        </div>
                      )
                    }}
                  />

                  <Controller
                    name="valor_pagamento_1"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valor Pagamento 1 (R$)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">R$</span>
                          </div>
                          <input
                            type="text"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={field.value ? field.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '')
                              const value = parseFloat(digits) / 100
                              field.onChange(value)
                            }}
                            onBlur={field.onBlur}
                            placeholder="0,00"
                          />
                        </div>
                        {errors.valor_pagamento_1 && (
                          <p className="mt-1 text-sm text-red-600">{errors.valor_pagamento_1.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="data_pagamento_2"
                    control={control}
                    render={({ field }) => {
                      const getCurrentDate = () => {
                        const now = new Date()
                        const year = now.getFullYear()
                        const month = String(now.getMonth() + 1).padStart(2, '0')
                        return `${year}-${month}`
                      }
                      
                      const formatDayInput = (value: string) => {
                        if (!value) return ''
                        const day = parseInt(value)
                        if (day >= 1 && day <= 31) {
                          const currentDate = getCurrentDate()
                          return `${currentDate}-${String(day).padStart(2, '0')}`
                        }
                        return value
                      }
                      
                      const getDayFromValue = (value: string) => {
                        if (!value) return ''
                        const parts = value.split('-')
                        return parts[2] || ''
                      }
                      
                      return (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dia Pagamento 2
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={getDayFromValue(field.value || '')}
                            onChange={(e) => {
                              const day = e.target.value
                              if (day === '') {
                                field.onChange('')
                              } else {
                                const fullDate = formatDayInput(day)
                                field.onChange(fullDate)
                              }
                            }}
                            onBlur={field.onBlur}
                            placeholder="Ex: 30"
                          />
                          {errors.data_pagamento_2 && (
                            <p className="mt-1 text-sm text-red-600">{errors.data_pagamento_2.message}</p>
                          )}
                        </div>
                      )
                    }}
                  />

                  <Controller
                    name="valor_pagamento_2"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valor Pagamento 2 (R$)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">R$</span>
                          </div>
                          <input
                            type="text"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={field.value ? field.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '')
                              const value = parseFloat(digits) / 100
                              field.onChange(value)
                            }}
                            onBlur={field.onBlur}
                            placeholder="0,00"
                          />
                        </div>
                        {errors.valor_pagamento_2 && (
                          <p className="mt-1 text-sm text-red-600">{errors.valor_pagamento_2.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Seção: Informações de Contato */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Informações de Contato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Telefone */}
              <Controller
                name="telefone"
                control={control}
                render={({ field }) => {
                  const formatPhone = (value: string) => {
                    const digits = value.replace(/\D/g, '').slice(0, 11)
                    if (digits.length <= 10) {
                      return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
                    } else {
                      return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                    }
                  }
                  
                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formatPhone(field.value || '')}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
                          field.onChange(digits)
                        }}
                        onBlur={field.onBlur}
                        placeholder="(00) 00000-0000"
                      />
                      {errors.telefone && (
                        <p className="mt-1 text-sm text-red-600">{errors.telefone.message}</p>
                      )}
                    </div>
                  )
                }}
              />

              {/* Email */}
              <Controller
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
                      placeholder="exemplo@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Seção: Configurações Adicionais */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Configurações Adicionais</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="registrado"
                  {...register('registrado')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="registrado" className="ml-2 block text-sm text-gray-900">
                  Colaborador registrado
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="vale_transporte"
                  {...register('vale_transporte')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="vale_transporte" className="ml-2 block text-sm text-gray-900">
                  Recebe vale transporte
                </label>
              </div>

              {valeTransporte && (
                <Controller
                  name="qtd_passagens_por_dia"
                  control={control}
                  render={({ field }) => (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantidade de Passagens por Dia
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={field.value?.toString() || ''}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        onBlur={field.onBlur}
                        placeholder="Ex: 4"
                      />
                      {errors.qtd_passagens_por_dia && (
                        <p className="mt-1 text-sm text-red-600">{errors.qtd_passagens_por_dia.message}</p>
                      )}
                    </div>
                  )}
                />
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(`/colaboradores/${id}`)} disabled={isSubmitting}>
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
