import React, { useState } from 'react'
import { Button } from './Button'
import { CreateEmpresaTerceiraData, UpdateEmpresaTerceiraData, EmpresaTerceira, validarCNPJ, formatarCNPJ, formatarTelefone } from '../types/bombas-terceiras'

interface EmpresaTerceiraFormProps {
  empresa?: EmpresaTerceira
  onSubmit: (data: CreateEmpresaTerceiraData | UpdateEmpresaTerceiraData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function EmpresaTerceiraForm({ empresa, onSubmit, onCancel, loading = false }: EmpresaTerceiraFormProps) {
  const [formData, setFormData] = useState({
    nome_fantasia: empresa?.nome_fantasia || '',
    razao_social: empresa?.razao_social || '',
    cnpj: empresa?.cnpj || '',
    telefone: empresa?.telefone || '',
    email: empresa?.email || '',
    endereco: empresa?.endereco || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nome_fantasia.trim()) {
      newErrors.nome_fantasia = 'Nome fantasia é obrigatório'
    }

    if (formData.cnpj && !validarCNPJ(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ inválido'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const submitData = {
      ...formData,
      nome_fantasia: formData.nome_fantasia.trim(),
      razao_social: formData.razao_social.trim() || undefined,
      cnpj: formData.cnpj.trim() || undefined,
      telefone: formData.telefone.trim() || undefined,
      email: formData.email.trim() || undefined,
      endereco: formData.endereco.trim() || undefined
    }

    if (empresa) {
      await onSubmit({ id: empresa.id, ...submitData })
    } else {
      await onSubmit(submitData)
    }
  }

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarCNPJ(e.target.value)
    setFormData(prev => ({ ...prev, cnpj: formatted }))
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarTelefone(e.target.value)
    setFormData(prev => ({ ...prev, telefone: formatted }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Seção: Dados da Empresa */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Dados da Empresa</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome Fantasia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome fantasia *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.nome_fantasia}
              onChange={(e) => setFormData(prev => ({ ...prev, nome_fantasia: e.target.value }))}
              placeholder="Ex: Construtora ABC Ltda"
            />
            {errors.nome_fantasia && (
              <p className="mt-1 text-sm text-red-600">{errors.nome_fantasia}</p>
            )}
          </div>

          {/* Razão Social */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Razão social
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.razao_social}
              onChange={(e) => setFormData(prev => ({ ...prev, razao_social: e.target.value }))}
              placeholder="Ex: Construtora ABC Ltda"
            />
            {errors.razao_social && (
              <p className="mt-1 text-sm text-red-600">{errors.razao_social}</p>
            )}
          </div>

          {/* CNPJ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CNPJ
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.cnpj}
              onChange={handleCNPJChange}
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
            {errors.cnpj && (
              <p className="mt-1 text-sm text-red-600">{errors.cnpj}</p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.telefone}
              onChange={handleTelefoneChange}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
            {errors.telefone && (
              <p className="mt-1 text-sm text-red-600">{errors.telefone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Seção: Informações de Contato */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Informações de Contato</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="exemplo@empresa.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Seção: Endereço */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Endereço</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Endereço completo
          </label>
          <textarea
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.endereco}
            onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
            placeholder="Ex: Rua das Flores, 123 - Centro - São Paulo/SP - CEP: 01234-567"
          />
          {errors.endereco && (
            <p className="mt-1 text-sm text-red-600">{errors.endereco}</p>
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
          {loading ? 'Salvando...' : empresa ? 'Atualizar Empresa' : 'Criar Empresa'}
        </Button>
      </div>
    </form>
  )
}
