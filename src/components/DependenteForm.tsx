import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CreateDependenteData } from '../types/colaboradores'
// Ícones substituídos por emojis

interface DependenteFormProps {
  colaboradorId: string
  onSave: () => void
  onCancel: () => void
}

export default function DependenteForm({ colaboradorId, onSave, onCancel }: DependenteFormProps) {
  const [formData, setFormData] = useState<CreateDependenteData>({
    colaborador_id: colaboradorId,
    nome_completo: '',
    data_nascimento: '',
    local_nascimento: '',
    tipo_dependente: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof CreateDependenteData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validar formulário antes de enviar
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    try {
      // Converter data para o formato do banco (YYYY-MM-DD)
      const convertDateToISO = (dateStr: string) => {
        // Se já está no formato ISO (YYYY-MM-DD), retorna como está
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr
        }
        
        // Se está no formato brasileiro (DD/MM/YYYY)
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
          const [day, month, year] = dateStr.split('/')
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
        
        // Tentar converter usando Date (aceita vários formatos)
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) {
          throw new Error('Formato de data inválido')
        }
        
        return date.toISOString().split('T')[0]
      }

      // Preparar dados para inserção
      let dataNascimentoISO: string
      try {
        dataNascimentoISO = convertDateToISO(formData.data_nascimento)
      } catch (err) {
        setError('Formato de data inválido. Use DD/MM/AAAA ou AAAA-MM-DD')
        setLoading(false)
        return
      }

      const dataToInsert = {
        colaborador_id: colaboradorId,
        nome_completo: formData.nome_completo.trim(),
        data_nascimento: dataNascimentoISO,
        local_nascimento: formData.local_nascimento?.trim() || null,
        tipo_dependente: formData.tipo_dependente?.trim() || null
      }

      const { error } = await supabase
        .from('colaboradores_dependentes')
        .insert(dataToInsert)

      if (error) {
        console.error('Erro detalhado:', error)
        throw error
      }
      
      onSave()
    } catch (err: any) {
      console.error('Erro ao salvar dependente:', err)
      setError(err?.message || 'Erro ao salvar dependente')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    if (!formData.nome_completo.trim()) return 'Nome completo é obrigatório'
    if (!formData.data_nascimento) return 'Data de nascimento é obrigatória'
    
    // Validar se a data não está vazia
    if (!formData.data_nascimento.trim()) {
      return 'Data de nascimento é obrigatória'
    }
    
    return null
  }

  const validationError = validateForm()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Novo Dependente</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.nome_completo}
              onChange={(e) => handleInputChange('nome_completo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Data de Nascimento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Nascimento *
            </label>
            <input
              type="date"
              value={formData.data_nascimento}
              onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Local de Nascimento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local de Nascimento
            </label>
            <input
              type="text"
              value={formData.local_nascimento}
              onChange={(e) => handleInputChange('local_nascimento', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tipo de Dependente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Dependente
            </label>
            <input
              type="text"
              value={formData.tipo_dependente}
              onChange={(e) => handleInputChange('tipo_dependente', e.target.value)}
              placeholder="Ex: Filho, Cônjuge, Pai, Mãe..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !!validationError}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <span>💾</span>
              )}
              Salvar
            </button>
          </div>

          {/* Validação */}
          {validationError && (
            <div className="text-red-600 text-sm">
              {validationError}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
