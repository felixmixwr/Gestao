import React, { useState } from 'react'
import { Button } from './Button'
import { ReportWithRelations } from '../types/reports'
import { exportReports, generateExportData, ExportOptions } from '../utils/reportExporter'
import { formatCurrency } from '../utils/formatters'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  reports: ReportWithRelations[]
  filters: any
  onExport?: (format: 'xlsx' | 'pdf') => void
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  reports,
  filters,
  onExport
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'xlsx' | 'pdf'>('xlsx')
  const [isExporting, setIsExporting] = useState(false)
  const [emailRecipients, setEmailRecipients] = useState('')
  const [sendEmail, setSendEmail] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // Gerar dados de exportação
      const exportData = generateExportData(reports, filters)
      
      // Configurar opções de exportação
      const options: ExportOptions = {
        format: selectedFormat,
        includeFilters: true,
        sendEmail: sendEmail && emailRecipients.trim() !== '',
        emailRecipients: sendEmail ? emailRecipients.split(',').map(email => email.trim()) : []
      }
      
      // Executar exportação
      await exportReports(exportData, options)
      
      // Callback para o componente pai
      if (onExport) {
        onExport(selectedFormat)
      }
      
      // Fechar modal após sucesso
      setTimeout(() => {
        setIsExporting(false)
        onClose()
      }, 1000)
      
    } catch (error) {
      console.error('Erro na exportação:', error)
      setIsExporting(false)
      alert('Erro ao exportar relatórios. Tente novamente.')
    }
  }

  const handleClose = () => {
    if (!isExporting) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            📊 Exportar Relatórios
          </h2>
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações do Relatório */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Resumo da Exportação</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Total de Registros:</strong> {reports.length}</p>
              <p><strong>Filtros Aplicados:</strong> {Object.keys(filters).length > 0 ? 'Sim' : 'Não'}</p>
              <p><strong>Data de Exportação:</strong> {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              {reports.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p><strong>Valor Total:</strong> {formatCurrency(reports.reduce((sum, r) => sum + (r.total_value || 0), 0))}</p>
                  <p><strong>Volume Total:</strong> {reports.reduce((sum, r) => sum + (r.realized_volume || 0), 0).toLocaleString('pt-BR')} m³</p>
                </div>
              )}
            </div>
          </div>

          {/* Seleção de Formato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Formato de Exportação
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="xlsx"
                  checked={selectedFormat === 'xlsx'}
                  onChange={(e) => setSelectedFormat(e.target.value as 'xlsx')}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center">
                  <span className="text-lg mr-2">📊</span>
                  <div>
                    <div className="font-medium text-gray-900">Excel (XLSX)</div>
                    <div className="text-sm text-gray-500">Planilha editável com formatação profissional</div>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={selectedFormat === 'pdf'}
                  onChange={(e) => setSelectedFormat(e.target.value as 'pdf')}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center">
                  <span className="text-lg mr-2">📄</span>
                  <div>
                    <div className="font-medium text-gray-900">PDF</div>
                    <div className="text-sm text-gray-500">Documento pronto para impressão e envio</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Opções de Email */}
          <div>
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                📧 Enviar por email após exportação
              </span>
            </label>
            
            {sendEmail && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emails dos Destinatários
                </label>
                <input
                  type="text"
                  placeholder="email1@exemplo.com, email2@exemplo.com"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separe múltiplos emails com vírgula
                </p>
              </div>
            )}
          </div>

          {/* Preview dos Filtros */}
          {Object.keys(filters).length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Filtros que serão incluídos:</h3>
              <div className="text-sm text-blue-700 space-y-1">
                {filters.status && filters.status.length > 0 && (
                  <div><strong>Status:</strong> {filters.status.join(', ')}</div>
                )}
                {(filters.dateFrom || filters.dateTo) && (
                  <div>
                    <strong>Período:</strong> 
                    {filters.dateFrom && ` De ${format(new Date(filters.dateFrom), 'dd/MM/yyyy', { locale: ptBR })}`}
                    {filters.dateTo && ` Até ${format(new Date(filters.dateTo), 'dd/MM/yyyy', { locale: ptBR })}`}
                  </div>
                )}
                {filters.searchTerm && (
                  <div><strong>Busca:</strong> {filters.searchTerm} ({filters.searchType})</div>
                )}
                {filters.pump_prefix && (
                  <div><strong>Bomba:</strong> {filters.pump_prefix}</div>
                )}
                {filters.client_id && (
                  <div><strong>Cliente:</strong> {filters.client_id}</div>
                )}
                {filters.report_number && (
                  <div><strong>ID Relatório:</strong> {filters.report_number}</div>
                )}
                {filters.client_name && (
                  <div><strong>Nome Cliente:</strong> {filters.client_name}</div>
                )}
                {filters.pump_name && (
                  <div><strong>Nome Bomba:</strong> {filters.pump_name}</div>
                )}
                {(filters.volume_min !== undefined || filters.volume_max !== undefined) && (
                  <div>
                    <strong>Volume:</strong> 
                    {filters.volume_min !== undefined && ` Mín: ${filters.volume_min} m³`}
                    {filters.volume_max !== undefined && ` Máx: ${filters.volume_max} m³`}
                  </div>
                )}
                {(filters.value_min !== undefined || filters.value_max !== undefined) && (
                  <div>
                    <strong>Valor:</strong> 
                    {filters.value_min !== undefined && ` Mín: ${formatCurrency(filters.value_min)}`}
                    {filters.value_max !== undefined && ` Máx: ${formatCurrency(filters.value_max)}`}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={isExporting}
            className="px-4 py-2"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Exportando...
              </>
            ) : (
              <>
                <span className="mr-2">
                  {selectedFormat === 'xlsx' ? '📊' : '📄'}
                </span>
                Exportar {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

