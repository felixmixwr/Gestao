import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { usePagamentosReceberIntegrado } from '../../lib/pagamentos-receber-api-integrado'
import { PagamentoReceberIntegrado, FormaPagamento } from '../../lib/pagamentos-receber-api-integrado'
import { toast } from '../../lib/toast-hooks'

const FORMA_PAGAMENTO_OPTIONS = [
  { value: 'sem_forma', label: 'Sem forma de pagamento' },
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'a_vista', label: 'À Vista' }
]

export default function PagamentoEditIntegrado() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { buscarPagamentoIntegradoPorId, atualizarFormaPagamentoIntegrado } = usePagamentosReceberIntegrado()
  
  const [pagamento, setPagamento] = useState<PagamentoReceberIntegrado | null>(null)
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
    if (formData.forma_pagamento === 'pix' || formData.forma_pagamento === 'a_vista') {
      // PIX e À Vista sempre vencem no mesmo dia
      const hoje = new Date().toISOString().split('T')[0]
      setFormData(prev => ({
        ...prev,
        prazo_data: hoje,
        prazo_dias: 0
      }))
    } else if (formData.forma_pagamento === 'sem_forma') {
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
    if (formData.prazo_data) {
      const hoje = new Date()
      const vencimento = new Date(formData.prazo_data)
      const diffTime = vencimento.getTime() - hoje.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      setFormData(prev => ({
        ...prev,
        prazo_dias: diffDays
      }))
    }
  }, [formData.prazo_data])

  async function fetchPagamento() {
    if (!id) return
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 [PagamentoEdit-Integrado] Buscando pagamento:', id)
      const data = await buscarPagamentoIntegradoPorId(id)
      console.log('✅ [PagamentoEdit-Integrado] Pagamento carregado:', data)
      
      setPagamento(data)
      setFormData({
        forma_pagamento: data.forma_pagamento,
        prazo_data: data.prazo_data ? data.prazo_data.split('T')[0] : '',
        prazo_dias: data.prazo_dias || 30,
        observacoes: data.observacoes || ''
      })
    } catch (err: any) {
      console.error('❌ [PagamentoEdit-Integrado] Erro ao buscar pagamento:', err)
      setError(err?.message || 'Erro ao carregar pagamento')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pagamento) return
    
    setSaving(true)
    
    try {
      console.log('🔍 [PagamentoEdit-Integrado] Salvando pagamento:', pagamento.id)
      
      // Atualizar forma de pagamento
      await atualizarFormaPagamentoIntegrado(pagamento.id, formData.forma_pagamento)
      
      toast.success('Pagamento atualizado com sucesso!')
      navigate(`/pagamentos-receber/${pagamento.id}`)
    } catch (err: any) {
      console.error('❌ [PagamentoEdit-Integrado] Erro ao salvar:', err)
      toast.error('Erro ao atualizar pagamento')
    } finally {
      setSaving(false)
    }
  }

  const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const formatarData = (data: string): string => {
    if (!data) return 'N/A'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loading />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <GenericError message={error} />
      </Layout>
    )
  }

  if (!pagamento) {
    return (
      <Layout>
        <GenericError message="Pagamento não encontrado" />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <a href="/pagamentos-receber" className="text-gray-700 hover:text-blue-600 inline-flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  Pagamentos a Receber
                </a>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <a href={`/pagamentos-receber/${pagamento.id}`} className="ml-1 text-gray-700 hover:text-blue-600 md:ml-2">
                    #{pagamento.id.slice(0, 8)}
                  </a>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-gray-500 md:ml-2">Editar</span>
                </div>
              </li>
            </ol>
          </nav>
          <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Editar Pagamento #{pagamento.id.slice(0, 8)}
          </h2>
        </div>

        {/* Informações do pagamento */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Informações do Pagamento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <p className="text-sm text-gray-900">{pagamento.cliente_nome}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa
                </label>
                <p className="text-sm text-gray-900">{pagamento.empresa_nome}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relatório
                </label>
                <p className="text-sm text-gray-900">{pagamento.report_number}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <p className="text-sm text-gray-900 font-semibold">{formatarValor(pagamento.valor_total)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data do Relatório
                </label>
                <p className="text-sm text-gray-900">{formatarData(pagamento.relatorio_data)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Atual
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  pagamento.status_unificado === 'pago' ? 'bg-green-100 text-green-800' :
                  pagamento.status_unificado === 'vencido' ? 'bg-red-100 text-red-800' :
                  pagamento.status_unificado === 'proximo_vencimento' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {pagamento.status_unificado}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário de edição */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Editar Informações
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Forma de Pagamento */}
                <div>
                  <label htmlFor="forma_pagamento" className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Pagamento
                  </label>
                  <Select
                    id="forma_pagamento"
                    value={formData.forma_pagamento}
                    onChange={(value) => setFormData(prev => ({ ...prev, forma_pagamento: value as FormaPagamento }))}
                    options={FORMA_PAGAMENTO_OPTIONS}
                    placeholder="Selecione a forma de pagamento"
                  />
                </div>

                {/* Data de Vencimento */}
                <div>
                  <label htmlFor="prazo_data" className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    id="prazo_data"
                    value={formData.prazo_data}
                    onChange={(e) => setFormData(prev => ({ ...prev, prazo_data: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {formData.prazo_dias !== undefined && (
                    <p className="mt-1 text-sm text-gray-500">
                      {formData.prazo_dias > 0 ? `${formData.prazo_dias} dias para vencer` :
                       formData.prazo_dias === 0 ? 'Vence hoje' :
                       `${Math.abs(formData.prazo_dias)} dias vencido`}
                    </p>
                  )}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  id="observacoes"
                  rows={3}
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Adicione observações sobre o pagamento..."
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/pagamentos-receber/${pagamento.id}`)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}
