import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CreateDocumentoData, TIPOS_DOCUMENTO } from '../types/colaboradores'

interface DocumentoFormProps {
  colaboradorId: string
  onSave: () => void
  onCancel: () => void
}

export default function DocumentoForm({ colaboradorId, onSave, onCancel }: DocumentoFormProps) {
  const [formData, setFormData] = useState<CreateDocumentoData>({
    colaborador_id: colaboradorId,
    tipo_documento: 'RG',
    dados_texto: {},
    arquivo_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  const handleInputChange = (field: keyof CreateDocumentoData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDadosTextoChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      dados_texto: {
        ...prev.dados_texto,
        [key]: value
      }
    }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${colaboradorId}_${Date.now()}.${fileExt}`
      const filePath = `colaboradores/documentos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      handleInputChange('arquivo_url', data.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload do arquivo')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log('Dados a serem salvos:', formData)
      
      const { error } = await supabase
        .from('colaboradores_documentos')
        .insert(formData)

      if (error) {
        console.error('Erro do Supabase:', error)
        throw error
      }
      
      console.log('Documento salvo com sucesso!')
      onSave()
    } catch (err) {
      console.error('Erro completo:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar documento')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    if (!formData.tipo_documento) return 'Tipo de documento é obrigatório'
    return null
  }

  const validationError = validateForm()

  // Função para formatar campos específicos
  const formatFieldValue = (field: string, value: string, tipo: string) => {
    switch (tipo) {
      case 'CNH':
        if (field === 'numero') {
          // CNH: 12345678901 (11 dígitos)
          return value.replace(/\D/g, '').slice(0, 11)
        }
        if (field === 'validade') {
          // Data: DD/MM/AAAA
          return value.replace(/\D/g, '').replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3').slice(0, 10)
        }
        break
      case 'RG':
        if (field === 'numero') {
          // RG: 123456789 (9 dígitos)
          return value.replace(/\D/g, '').slice(0, 9)
        }
        break
      case 'Comprovante Residência':
        if (field === 'cep') {
          // CEP: 12345-678
          return value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').slice(0, 9)
        }
        break
      case 'Reservista':
        if (field === 'numero') {
          // Reservista: 123456789 (9 dígitos)
          return value.replace(/\D/g, '').slice(0, 9)
        }
        break
      case 'Título Eleitor':
        if (field === 'numero') {
          // Título: 123456789012 (12 dígitos)
          return value.replace(/\D/g, '').slice(0, 12)
        }
        break
      case 'CTPS':
        if (field === 'numero') {
          // CTPS: 123456789 (9 dígitos)
          return value.replace(/\D/g, '').slice(0, 9)
        }
        break
      case 'PIS':
        if (field === 'numero') {
          // PIS: 123.45678.89-0
          return value.replace(/\D/g, '').replace(/(\d{3})(\d{5})(\d{2})(\d{1})/, '$1.$2.$3-$4').slice(0, 14)
        }
        break
    }
    return value
  }

  const getDocumentoFields = (tipo: string) => {
    switch (tipo) {
      case 'CNH':
        return [
          { key: 'numero', label: 'Número da CNH', placeholder: '12345678901', maxLength: 11 },
          { key: 'categoria', label: 'Categoria', placeholder: 'Ex: A, B, C, D, E' },
          { key: 'validade', label: 'Data de Validade', placeholder: 'DD/MM/AAAA', maxLength: 10 },
          { key: 'uf', label: 'UF de Emissão', placeholder: 'Ex: SP, RJ, MG' }
        ]
      case 'RG':
        return [
          { key: 'numero', label: 'Número do RG', placeholder: '123456789', maxLength: 9 },
          { key: 'orgao_emissor', label: 'Órgão Emissor', placeholder: 'Ex: SSP, DETRAN' },
          { key: 'uf', label: 'UF de Emissão', placeholder: 'Ex: SP, RJ, MG' }
        ]
      case 'Comprovante Residência':
        return [
          { key: 'endereco', label: 'Endereço Completo', placeholder: 'Rua, número, bairro' },
          { key: 'cidade', label: 'Cidade', placeholder: 'Nome da cidade' },
          { key: 'uf', label: 'UF', placeholder: 'Ex: SP, RJ, MG' },
          { key: 'cep', label: 'CEP', placeholder: '12345-678', maxLength: 9 }
        ]
      case 'Reservista':
        return [
          { key: 'numero', label: 'Número do Reservista', placeholder: '123456789', maxLength: 9 },
          { key: 'serie', label: 'Série', placeholder: 'Ex: 123456' },
          { key: 'uf', label: 'UF de Emissão', placeholder: 'Ex: SP, RJ, MG' }
        ]
      case 'Título Eleitor':
        return [
          { key: 'numero', label: 'Número do Título', placeholder: '123456789012', maxLength: 12 },
          { key: 'zona', label: 'Zona Eleitoral', placeholder: 'Ex: 123' },
          { key: 'secao', label: 'Seção', placeholder: 'Ex: 456' },
          { key: 'uf', label: 'UF', placeholder: 'Ex: SP, RJ, MG' }
        ]
      case 'CTPS':
        return [
          { key: 'numero', label: 'Número da CTPS', placeholder: '123456789', maxLength: 9 },
          { key: 'serie', label: 'Série', placeholder: 'Ex: 123456' },
          { key: 'uf', label: 'UF de Emissão', placeholder: 'Ex: SP, RJ, MG' }
        ]
      case 'PIS':
        return [
          { key: 'numero', label: 'Número do PIS', placeholder: '123.45678.89-0', maxLength: 14 }
        ]
      default:
        return [
          { key: 'numero', label: 'Número', placeholder: 'Número do documento' },
          { key: 'descricao', label: 'Descrição', placeholder: 'Descrição adicional' }
        ]
    }
  }

  const getFieldType = (field: string, tipo: string) => {
    if (field === 'validade') return 'text'
    if (field === 'cep') return 'text'
    if (field === 'numero' && tipo === 'PIS') return 'text'
    return 'text'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Novo Documento</h2>
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

          {/* Tipo de Documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Documento *
            </label>
            <select
              value={formData.tipo_documento}
              onChange={(e) => handleInputChange('tipo_documento', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {TIPOS_DOCUMENTO.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          {/* Campos específicos do documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dados do Documento
            </label>
            <div className="space-y-3">
              {getDocumentoFields(formData.tipo_documento).map(field => (
                <div key={field.key}>
                  <label className="block text-sm text-gray-600 mb-1">
                    {field.label}
                  </label>
                  <input
                    type={getFieldType(field.key, formData.tipo_documento)}
                    value={formData.dados_texto?.[field.key] || ''}
                    onChange={(e) => {
                      const formattedValue = formatFieldValue(field.key, e.target.value, formData.tipo_documento)
                      handleDadosTextoChange(field.key, formattedValue)
                    }}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Upload de arquivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arquivo (opcional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <span className="mx-auto text-4xl text-gray-400">📤</span>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Fazer upload de arquivo</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                  </label>
                  <p className="pl-1">ou arraste e solte</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, PDF até 10MB
                </p>
                {formData.arquivo_url && (
                  <p className="text-sm text-green-600">
                    Arquivo carregado com sucesso!
                  </p>
                )}
                {uploadingFile && (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Carregando...</span>
                  </div>
                )}
              </div>
            </div>
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
