import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DatePicker } from '../../components/ui/date-picker';
import { Select } from '../../components/Select'
import { usePagamentosReceber } from '../../lib/pagamentos-receber-api'
import { PagamentoReceberCompleto, FormaPagamento, UpdatePagamentoReceberData } from '../../types/pagamentos-receber'
import { toast } from '../../lib/toast-hooks'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'

const FORMA_PAGAMENTO_OPTIONS = [
  { value: 'sem_forma', label: 'Sem forma de pagamento' },
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'a_vista', label: 'À Vista' }
]

export default function PagamentoEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { buscarPagamentoPorId, atualizarPagamento } = usePagamentosReceber()
  
  const [pagamento, setPagamento] = useState<PagamentoReceberCompleto | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    forma_pagamento: 'sem_forma' as FormaPagamento,
    prazo_data: '',
    prazo_dias: 30,
    observacoes: ''
  })

  useEffect(() => {
    if (id) {
      fetchPagamento()
    }
  }, [id])

  // Atualizar campos automaticamente quando forma de pagamento mudar
  useEffect(() => {
    if (formData.forma_pagamento === 'pix' || formData.forma_pagamento === 'a_vista' || formData.forma_pagamento === 'sem_forma') {
      // PIX e À Vista sempre vencem no mesmo dia
      const hoje = new Date().toISOString().split('T')[0]
      setFormData(prev => ({
        ...prev,
        prazo_data: hoje,
        prazo_dias: 0
      }))
    } else if (formData.forma_pagamento === 'sem_forma' as FormaPagamento) {
      // Sem forma de pagamento - definir prazo padrão de 30 dias
      const hoje = new Date()
      const prazo30dias = new Date(hoje.getTime() + (30 * 24 * 60 * 60 * 1000))
      setFormData(prev => ({
        ...prev,
        prazo_data: prazo30dias.toISOString().split('T')[0],
        prazo_dias: 30
      }))
    }
  }, [formData.forma_pagamento])

  // Calcular dias automaticamente quando data de vencimento mudar
  useEffect(() => {
    if (formData.prazo_data && formData.forma_pagamento !== 'pix' && formData.forma_pagamento !== 'a_vista' && formData.forma_pagamento !== 'sem_forma') {
      // Usar apenas a parte da data (YYYY-MM-DD) para evitar problemas de timezone
      const hoje = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const dataVencimento = formData.prazo_data // Já está no formato YYYY-MM-DD
      
      // Converter para Date objects no mesmo timezone
      const hojeDate = new Date(hoje + 'T00:00:00')
      const vencimentoDate = new Date(dataVencimento + 'T00:00:00')
      
      // Calcular diferença em dias
      const diffTime = vencimentoDate.getTime() - hojeDate.getTime()
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
      
      // Só atualizar se for um valor válido e não negativo
      if (diffDays >= 0) {
        setFormData(prev => ({
          ...prev,
          prazo_dias: diffDays
        }))
      }
    }
  }, [formData.prazo_data, formData.forma_pagamento])

  // Função para calcular informações de vencimento
  const getVencimentoInfo = () => {
    if (!formData.prazo_data) return null
    
    // Usar apenas a parte da data (YYYY-MM-DD) para evitar problemas de timezone
    const hoje = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const dataVencimento = formData.prazo_data // Já está no formato YYYY-MM-DD
    
    // Converter para Date objects no mesmo timezone
    const hojeDate = new Date(hoje + 'T00:00:00')
    const vencimentoDate = new Date(dataVencimento + 'T00:00:00')
    
    // Calcular diferença em dias
    const diffTime = vencimentoDate.getTime() - hojeDate.getTime()
    const diasRestantes = Math.round(diffTime / (1000 * 60 * 60 * 24))
    
    if (diasRestantes < 0) {
      return {
        status: 'vencido',
        texto: `Vencido há ${Math.abs(diasRestantes)} dia${Math.abs(diasRestantes) !== 1 ? 's' : ''}`,
        cor: 'text-red-600 bg-red-50 border-red-200'
      }
    } else if (diasRestantes === 0) {
      return {
        status: 'hoje',
        texto: 'Vence hoje',
        cor: 'text-orange-600 bg-orange-50 border-orange-200'
      }
    } else if (diasRestantes <= 3) {
      return {
        status: 'proximo',
        texto: `Vence em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`,
        cor: 'text-yellow-600 bg-yellow-50 border-yellow-200'
      }
    } else {
      return {
        status: 'normal',
        texto: `Vence em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`,
        cor: 'text-green-600 bg-green-50 border-green-200'
      }
    }
  }

  const fetchPagamento = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await buscarPagamentoPorId(id!)
      setPagamento(data)
      
      // Preencher formulário com dados atuais
      if (data) {
        setFormData({
          forma_pagamento: data.forma_pagamento as FormaPagamento,
          prazo_data: data.prazo_data ? data.prazo_data.split('T')[0] : '',
          prazo_dias: data.prazo_dias || 5,
          observacoes: data.observacoes || ''
        })
      }
    } catch (err: any) {
      console.error('Erro ao buscar pagamento:', err)
      setError(err?.message || 'Erro ao carregar pagamento')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!id || !pagamento) return
    
    try {
      setSaving(true)
      
      // Aplicar lógica de vencimento baseada na forma de pagamento
      let prazoData = formData.prazo_data
      let prazoDias = formData.prazo_dias
      
      if (formData.forma_pagamento === 'pix' || formData.forma_pagamento === 'a_vista' || formData.forma_pagamento === 'sem_forma') {
        // PIX e À Vista sempre vencem no mesmo dia
        prazoData = new Date().toISOString().split('T')[0] // Hoje
        prazoDias = 0
      } else if (formData.forma_pagamento === 'sem_forma' as FormaPagamento) {
        // Sem forma de pagamento - manter prazo de 30 dias
        const hoje = new Date()
        const prazo30dias = new Date(hoje.getTime() + (30 * 24 * 60 * 60 * 1000))
        prazoData = prazo30dias.toISOString().split('T')[0]
        prazoDias = 30
      }
      
      const updateData: UpdatePagamentoReceberData = {
        id,
        forma_pagamento: formData.forma_pagamento,
        prazo_data: prazoData ? new Date(prazoData).toISOString() : undefined,
        prazo_dias: prazoDias,
        observacoes: formData.observacoes
      }
      
      await atualizarPagamento(updateData)
      
      toast.success('Pagamento atualizado com sucesso!')
      navigate('/pagamentos-receber')
      
    } catch (err: any) {
      console.error('Erro ao atualizar pagamento:', err)
      toast.error('Erro ao atualizar pagamento')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/pagamentos-receber')
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
        title="Erro ao carregar pagamento" 
        message={error} 
        onRetry={fetchPagamento} 
      />
    )
  }

  if (!pagamento) {
    return (
      <GenericError 
        title="Pagamento não encontrado" 
        message="O pagamento solicitado não foi encontrado." 
        onRetry={() => navigate('/pagamentos-receber')} 
      />
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Pagamento</h1>
            <p className="text-sm text-gray-600 mt-1">
              Cliente: {pagamento.cliente_nome} • Valor: R$ {pagamento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Voltar
          </Button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Informações do Pagamento</h3>
            
            <div className="space-y-6">
              {/* Forma de Pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento *
                </label>
                <Select
                  options={FORMA_PAGAMENTO_OPTIONS}
                  value={formData.forma_pagamento}
                  onChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    forma_pagamento: value as FormaPagamento 
                  }))}
                />
              </div>

              {/* Aviso para PIX e À Vista */}
              {(formData.forma_pagamento === 'pix' || formData.forma_pagamento === 'a_vista' || formData.forma_pagamento === 'sem_forma') && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>PIX e À Vista</strong> sempre vencem no mesmo dia (hoje). 
                        A data de vencimento será automaticamente ajustada.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso para Sem Forma de Pagamento */}
              {formData.forma_pagamento === 'sem_forma' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Sem forma de pagamento</strong> definida. 
                        O prazo será definido automaticamente para 30 dias.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Data de Vencimento */}
              <div>
                <DatePicker
                  value={formData.prazo_data}
                  onChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    prazo_data: value 
                  }))}
                  label="Data de Vencimento"
                  required
                  className={formData.forma_pagamento === 'pix' || formData.forma_pagamento === 'a_vista' || formData.forma_pagamento === 'sem_forma' 
                    ? 'opacity-50 pointer-events-none' 
                    : ''
                  }
                />
                <p className="mt-1 text-xs text-gray-500">
                  Data limite para o pagamento
                </p>
                
                {/* Informação de vencimento */}
                {formData.prazo_data && formData.forma_pagamento !== 'pix' && formData.forma_pagamento !== 'a_vista' && formData.forma_pagamento !== 'sem_forma' && (() => {
                  const vencimentoInfo = getVencimentoInfo()
                  if (!vencimentoInfo) return null
                  
                  return (
                    <div className={`mt-2 px-3 py-2 rounded-md border ${vencimentoInfo.cor}`}>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">{vencimentoInfo.texto}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Prazo em Dias */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prazo em Dias
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    (formData.forma_pagamento === 'pix' || formData.forma_pagamento === 'a_vista' || formData.forma_pagamento === 'sem_forma') 
                      ? 'bg-gray-100 cursor-not-allowed' 
                      : ''
                  }`}
                  value={formData.prazo_dias}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    prazo_dias: parseInt(e.target.value) || 0 
                  }))}
                  disabled={formData.forma_pagamento === 'pix' || formData.forma_pagamento === 'a_vista'}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.forma_pagamento === 'pix' || formData.forma_pagamento === 'a_vista' 
                    ? 'PIX e À Vista sempre vencem no mesmo dia (0 dias)'
                    : formData.forma_pagamento === 'sem_forma'
                    ? 'Sem forma de pagamento definida (30 dias padrão)'
                    : 'Calculado automaticamente baseado na data de vencimento'
                  }
                </p>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    observacoes: e.target.value 
                  }))}
                  placeholder="Observações adicionais sobre o pagamento..."
                />
              </div>
            </div>
          </div>

          {/* Informações do Relatório */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Relatório</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Número do Relatório:</span>
                <p className="text-gray-600">{pagamento.relatorio_id}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Data do Relatório:</span>
                <p className="text-gray-600">
                  {new Date(pagamento.relatorio_data).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Empresa:</span>
                <p className="text-gray-600">{pagamento.empresa_nome || 'Sem empresa'}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Status Atual:</span>
                <p className="text-gray-600 capitalize">{pagamento.status}</p>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={saving}
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
