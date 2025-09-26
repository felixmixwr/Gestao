import React, { useState } from 'react'
import { Button } from './Button'
import { CreateBombaTerceiraData, UpdateBombaTerceiraData, BombaTerceira, EmpresaTerceira, STATUS_BOMBA_TERCEIRA_OPTIONS } from '../types/bombas-terceiras'

interface BombaTerceiraFormProps {
  bomba?: BombaTerceira
  empresaId?: string
  empresas: EmpresaTerceira[]
  onSubmit: (data: CreateBombaTerceiraData | UpdateBombaTerceiraData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function BombaTerceiraForm({ 
  bomba, 
  empresaId, 
  empresas, 
  onSubmit, 
  onCancel, 
  loading = false 
}: BombaTerceiraFormProps) {
  const [formData, setFormData] = useState({
    empresa_id: empresaId || bomba?.empresa_id || '',
    prefixo: bomba?.prefixo || '',
    modelo: bomba?.modelo || '',
    ano: bomba?.ano?.toString() || '',
    status: bomba?.status || 'ativa',
    valor_diaria: bomba?.valor_diaria ? bomba.valor_diaria.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) : '',
    observacoes: bomba?.observacoes || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Função para formatar valor como moeda brasileira
  const handleValorDiariaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // Remove tudo que não é dígito
    value = value.replace(/\D/g, '')
    
    // Converte para centavos e formata
    if (value === '') {
      setFormData(prev => ({ ...prev, valor_diaria: '' }))
      return
    }
    
    // Converte para número e divide por 100 para obter o valor em reais
    const numericValue = parseInt(value) / 100
    
    // Formata como moeda brasileira
    const formattedValue = numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    
    setFormData(prev => ({ ...prev, valor_diaria: formattedValue }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.empresa_id) {
      newErrors.empresa_id = 'Empresa é obrigatória'
    }

    if (!formData.prefixo.trim()) {
      newErrors.prefixo = 'Prefixo é obrigatório'
    }

    if (formData.ano && (isNaN(Number(formData.ano)) || Number(formData.ano) < 1900 || Number(formData.ano) > new Date().getFullYear() + 1)) {
      newErrors.ano = 'Ano inválido'
    }

    if (formData.valor_diaria) {
      // Remove formatação para validar o valor numérico
      const numericValue = parseFloat(formData.valor_diaria.replace(/\./g, '').replace(',', '.'))
      if (isNaN(numericValue) || numericValue < 0) {
        newErrors.valor_diaria = 'Valor deve ser um número positivo'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const submitData = {
      empresa_id: formData.empresa_id,
      prefixo: formData.prefixo.trim(),
      modelo: formData.modelo.trim() || undefined,
      ano: formData.ano ? Number(formData.ano) : undefined,
      status: formData.status as 'ativa' | 'em manutenção' | 'indisponível',
      valor_diaria: formData.valor_diaria ? parseFloat(formData.valor_diaria.replace(/\./g, '').replace(',', '.')) : undefined,
      observacoes: formData.observacoes.trim() || undefined
    }

    if (bomba) {
      await onSubmit({ id: bomba.id, ...submitData })
    } else {
      await onSubmit(submitData)
    }
  }

  const empresaOptions = empresas.map(empresa => ({
    value: empresa.id,
    label: empresa.nome_fantasia
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Seção: Dados da Bomba */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Dados da Bomba</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Empresa */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empresa *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              value={formData.empresa_id}
              onChange={(e) => setFormData(prev => ({ ...prev, empresa_id: e.target.value }))}
              disabled={!!empresaId}
            >
              <option value="">Selecione uma empresa</option>
              {empresaOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.empresa_id && (
              <p className="mt-1 text-sm text-red-600">{errors.empresa_id}</p>
            )}
          </div>

          {/* Prefixo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prefixo *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.prefixo}
              onChange={(e) => setFormData(prev => ({ ...prev, prefixo: e.target.value }))}
              placeholder="Ex: BT001, BT002"
            />
            {errors.prefixo && (
              <p className="mt-1 text-sm text-red-600">{errors.prefixo}</p>
            )}
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modelo
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.modelo}
              onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
              placeholder="Ex: Bomba Centrífuga 50HP"
            />
            {errors.modelo && (
              <p className="mt-1 text-sm text-red-600">{errors.modelo}</p>
            )}
          </div>

          {/* Ano */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ano de Fabricação
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.ano}
              onChange={(e) => setFormData(prev => ({ ...prev, ano: e.target.value }))}
              placeholder="Ex: 2020"
              min="1900"
              max={new Date().getFullYear() + 1}
            />
            {errors.ano && (
              <p className="mt-1 text-sm text-red-600">{errors.ano}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'ativa' | 'em manutenção' | 'indisponível' }))}
            >
              {STATUS_BOMBA_TERCEIRA_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status}</p>
            )}
          </div>
        </div>
      </div>

      {/* Seção: Informações Financeiras */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Informações Financeiras</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Valor da Diária */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Pago pela Diária
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">R$</span>
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.valor_diaria}
                onChange={(e) => handleValorDiariaChange(e)}
                placeholder="Ex: 500,00"
              />
            </div>
            {errors.valor_diaria && (
              <p className="mt-1 text-sm text-red-600">{errors.valor_diaria}</p>
            )}
          </div>
        </div>
      </div>

      {/* Seção: Observações */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Observações</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.observacoes}
            onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            placeholder="Observações sobre a bomba..."
          />
          {errors.observacoes && (
            <p className="mt-1 text-sm text-red-600">{errors.observacoes}</p>
          )}
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Salvando...' : bomba ? 'Atualizar Bomba' : 'Criar Bomba'}
        </Button>
      </div>
    </form>
  )
}
