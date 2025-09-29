import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
// Removido: Badge não é mais usado
import { DatePicker } from '../../components/ui/date-picker';
import { NotaFiscalFormSimple } from '../../components/NotaFiscalFormSimple'
import { NotasFiscaisLista } from '../../components/NotasFiscaisLista'
import { ReportWithRelations, ReportStatus, NoteData } from '../../types/reports'
import { formatCurrency } from '../../utils/formatters'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  getStatusOptions
} from '../../utils/status-utils'

// Removido: STATUS_OPTIONS, getStatusVariant e getStatusLabel agora estão em status-utils.ts

export default function ReportDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<ReportWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  // Removido: showStatusDialog não é mais necessário
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [showNotaFiscalForm, setShowNotaFiscalForm] = useState(false)
  const [refreshNotas, setRefreshNotas] = useState(0) // Estado para forçar refresh
  const [hasNotaFiscal, setHasNotaFiscal] = useState(false) // Estado para controlar se já existe nota fiscal
  const [newStatus, setNewStatus] = useState<ReportStatus | null>(null)
  const [noteData, setNoteData] = useState<NoteData>({
    nf_number: '',
    nf_date: '',
    nf_value: 0,
    report_id: id || ''
  })
  const [updating, setUpdating] = useState(false)

  const loadReport = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔍 [REPORT_DETAILS] Carregando relatório:', id)
      
      // 1. Carregar relatório básico
      const { data: reportData, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      console.log('✅ [REPORT_DETAILS] Relatório básico carregado:', reportData?.report_number)
      
      if (reportData) {
        console.log('🔍 [REPORT_DETAILS] Enriquecendo dados com relacionamentos...')
        
        // 2. Enriquecer com dados do cliente
        if (reportData.client_id) {
          console.log('🔍 [REPORT_DETAILS] Carregando dados do cliente:', reportData.client_id)
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('id', reportData.client_id)
            .single()
          
          console.log('📊 [REPORT_DETAILS] Cliente carregado:', clientData)
          reportData.clients = clientData
        }
        
        // 3. Enriquecer com dados da bomba
        if (reportData.pump_id) {
          console.log('🔍 [REPORT_DETAILS] Carregando dados da bomba:', reportData.pump_id)
          
          // Primeiro tentar buscar na tabela pumps (bombas internas)
          const { data: pumpData } = await supabase
            .from('pumps')
            .select('*')
            .eq('id', reportData.pump_id)
            .single()
          
          if (pumpData) {
            console.log('📊 [REPORT_DETAILS] Bomba interna carregada:', pumpData)
            reportData.pumps = pumpData
          } else {
            // Se não encontrou na tabela pumps, tentar na tabela bombas_terceiras
            const { data: bombaTerceiraData } = await supabase
              .from('view_bombas_terceiras_com_empresa')
              .select('*')
              .eq('id', reportData.pump_id)
              .single()
            
            if (bombaTerceiraData) {
              console.log('📊 [REPORT_DETAILS] Bomba terceira carregada:', bombaTerceiraData)
              // Transformar para o formato esperado
              reportData.pumps = {
                id: bombaTerceiraData.id,
                prefix: bombaTerceiraData.prefixo,
                model: bombaTerceiraData.modelo,
                brand: `${bombaTerceiraData.empresa_nome_fantasia} - R$ ${bombaTerceiraData.valor_diaria || 0}/dia`,
                owner_company_id: bombaTerceiraData.empresa_id,
                is_terceira: true,
                empresa_nome: bombaTerceiraData.empresa_nome_fantasia,
                valor_diaria: bombaTerceiraData.valor_diaria
              }
            }
          }
        }
        
        // 4. Enriquecer com dados da empresa
        if (reportData.company_id) {
          console.log('🔍 [REPORT_DETAILS] Carregando dados da empresa:', reportData.company_id)
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', reportData.company_id)
            .single()
          
          console.log('📊 [REPORT_DETAILS] Empresa carregada:', companyData)
          reportData.companies = companyData
        }
        
        console.log('✅ [REPORT_DETAILS] Dados enriquecidos com sucesso!')
        console.log('📊 [REPORT_DETAILS] Relatório final:', reportData)
        
        setReport(reportData as ReportWithRelations)
      }
    } catch (error) {
      console.error('❌ [REPORT_DETAILS] Erro ao carregar relatório:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      loadReport()
    }
  }, [id, loadReport])

  const handleStatusChange = async () => {
    if (!newStatus || !report) return

    try {
      setUpdating(true)
      
      const updateData: { status: ReportStatus; paid_at?: string } = { status: newStatus }
      
      if (newStatus === 'PAGO') {
        updateData.paid_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', report.id)

      if (error) throw error

      // Recarregar relatório
      await loadReport()
      setNewStatus(null)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    } finally {
      setUpdating(false)
    }
  }

  // Função para formatar data considerando fuso horário local
const formatDateLocal = (dateString: string): string => {
  if (!dateString) return 'N/A'
  
  // Se a data está no formato YYYY-MM-DD, criar Date considerando fuso horário local
  const [year, month, day] = dateString.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)
  
  return format(localDate, 'dd/MM/yyyy', { locale: ptBR })
}

const handleWhatsApp = () => {
    if (!report) return

    const phone = report.whatsapp_digits?.replace(/\D/g, '') || ''
    const ownerCompany = report.companies?.name || 'empresa'
    const repName = report.client_rep_name || 'Cliente'
    const volume = report.realized_volume || 0
    const value = report.total_value || 0
    const date = formatDateLocal(report.date)
    
    const template = `Olá ${repName}, aqui é Henrique da ${ownerCompany}. Sobre o bombeamento ${report.report_number} em ${date}: volume ${volume} m³, valor ${formatCurrency(value)}. Confirma a forma de pagamento e se posso emitir a nota? Obrigado.`
    
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(template)}`
    window.open(url, '_blank')
  }

  const handleCreateNote = async () => {
    if (!report) return

    try {
      setUpdating(true)

      // Criar nota fiscal
      const { error: noteError } = await supabase
        .from('notes')
        .insert({
          title: `Nota Fiscal - ${report.report_number}`,
          content: `Número: ${noteData.nf_number}\nData: ${noteData.nf_date}\nValor: ${formatCurrency(noteData.nf_value)}`,
          company_id: report.company_id
        })
        .select()
        .single()

      if (noteError) throw noteError

      // Atualizar status do relatório
      const { error: reportError } = await supabase
        .from('reports')
        .update({ status: 'NOTA_EMITIDA' })
        .eq('id', report.id)

      if (reportError) throw reportError

      // Recarregar relatório
      await loadReport()
      setShowNoteDialog(false)
      setNoteData({
        nf_number: '',
        nf_date: '',
        nf_value: 0,
        report_id: id || ''
      })
    } catch (error) {
      console.error('Erro ao criar nota fiscal:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteReport = async () => {
    if (!report) return

    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o relatório ${report.report_number}?\n\nEsta ação não pode ser desfeita.`
    )

    if (!confirmDelete) return

    try {
      setUpdating(true)

      // Excluir relatório
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', report.id)

      if (error) throw error

      // Redirecionar para lista de relatórios
      navigate('/reports')
    } catch (error) {
      console.error('Erro ao excluir relatório:', error)
      alert('Erro ao excluir relatório. Tente novamente.')
    } finally {
      setUpdating(false)
    }
  }


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Relatório não encontrado</p>
        <Button
          variant="outline"
          onClick={() => window.location.href = '/reports'}
          className="mt-4"
        >
          Voltar para Relatórios
        </Button>
      </div>
    )
  }


  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Relatório {report.report_number}
            </h1>
            <p className="text-gray-600">
              Criado em {report.created_at ? format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Data não disponível'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate('/reports')}
            >
              Voltar
            </Button>
          </div>
        </div>

      {/* Status e Ações */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={report.status}
              onChange={(e) => {
                const newStatus = e.target.value as ReportStatus
                if (newStatus && newStatus !== report.status) {
                  setNewStatus(newStatus)
                  handleStatusChange()
                }
              }}
              className={`px-4 py-2 rounded-full text-white font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 ${
                report.status === 'ENVIADO_FINANCEIRO' ? 'bg-status-enviado' :
                report.status === 'RECEBIDO_FINANCEIRO' ? 'bg-status-recebido' :
                report.status === 'AGUARDANDO_APROVACAO' ? 'bg-status-aprovacao' :
                report.status === 'NOTA_EMITIDA' ? 'bg-status-nota' :
                report.status === 'AGUARDANDO_PAGAMENTO' ? 'bg-status-aguardando' :
                report.status === 'PAGO' ? 'bg-status-pago' :
                'bg-gray-500'
              }`}
            >
              {getStatusOptions(report.status).map(option => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                  className="bg-white text-gray-900"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleWhatsApp}
              disabled={!report.whatsapp_digits}
            >
              WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/reports/${report.id}/edit`)}
            >
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteReport}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Excluir
            </Button>
          </div>
        </div>
      </div>

      {/* Informações do Relatório */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Data:</span>
              <p className="text-gray-900">{formatDateLocal(report.date)}</p>
            </div>
        <div>
          <span className="text-sm font-medium text-gray-700">Cliente:</span>
          <p className="text-gray-900">{report.clients?.company_name || report.clients?.name || 'Não informado'}</p>
        </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Representante:</span>
              <p className="text-gray-900">{report.client_rep_name || 'Não informado'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Telefone:</span>
              <p className="text-gray-900">{report.whatsapp_digits || 'Não informado'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Email:</span>
              <p className="text-gray-900">{report.clients?.email || 'Não informado'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Endereço da Obra:</span>
              <p className="text-gray-900">{report.work_address || 'Não informado'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Informações da Bomba</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Prefixo:</span>
              <p className="text-gray-900">{report.pump_prefix || 'Não informado'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Modelo:</span>
              <p className="text-gray-900">{report.pumps?.model || 'Não informado'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Marca:</span>
              <p className="text-gray-900">{report.pumps?.brand || 'Não informado'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Empresa do Serviço:</span>
              <p className="text-gray-900">{report.companies?.name || 'Não informado'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Detalhes do Bombeamento</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Volume Realizado:</span>
              <p className="text-gray-900">
                {report.realized_volume ? `${report.realized_volume.toLocaleString('pt-BR')} m³` : 'Não informado'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Valor Total:</span>
              <p className="text-gray-900 font-semibold">
                {report.total_value ? formatCurrency(report.total_value) : 'Não informado'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Motorista:</span>
              <p className="text-gray-900">{report.driver_name || 'Não informado'}</p>
            </div>
            {/* Renderizar apenas auxiliares que foram adicionados */}
            {report.assistant1_name && (
              <div>
                <span className="text-sm font-medium text-gray-700">Auxiliar 1:</span>
                <p className="text-gray-900">{report.assistant1_name}</p>
              </div>
            )}
            {report.assistant2_name && (
              <div>
                <span className="text-sm font-medium text-gray-700">Auxiliar 2:</span>
                <p className="text-gray-900">{report.assistant2_name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Seção de Notas Fiscais */}
        <div className="space-y-4">
          {/* Cabeçalho da Seção */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notas Fiscais</h2>
              <p className="text-xs text-gray-600 mt-1">
                Gerencie as notas fiscais relacionadas a este relatório
              </p>
            </div>
            
            {/* Botão de Ação Principal */}
            <div className="flex items-center space-x-3">
              {hasNotaFiscal && (
                <div className="flex items-center space-x-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Nota fiscal vinculada</span>
                </div>
              )}
              
              <Button
                onClick={() => setShowNotaFiscalForm(!showNotaFiscalForm)}
                variant={showNotaFiscalForm ? "secondary" : "primary"}
                disabled={hasNotaFiscal}
                className="flex items-center space-x-1 px-3 py-2 text-sm"
              >
                {showNotaFiscalForm ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Cancelar</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Adicionar Nota Fiscal</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Formulário de Nota Fiscal */}
          {showNotaFiscalForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-sm font-semibold text-blue-900">Nova Nota Fiscal</h3>
              </div>
              <p className="text-xs text-blue-700 mb-4">
                Preencha os dados da nota fiscal para vincular ao relatório
              </p>
              
              <NotaFiscalFormSimple
                reportId={id!}
                onSuccess={() => {
                  setShowNotaFiscalForm(false);
                  setRefreshNotas(prev => prev + 1);
                }}
                onCancel={() => setShowNotaFiscalForm(false)}
                onRefresh={() => setRefreshNotas(prev => prev + 1)}
              />
            </div>
          )}

          {/* Lista de Notas Fiscais */}
          <NotasFiscaisLista 
            reportId={id!}
            onRefresh={() => setRefreshNotas(prev => prev + 1)}
            refreshTrigger={refreshNotas}
            onHasNotaFiscalChange={setHasNotaFiscal}
          />
        </div>

      </div>

      {/* Dialog de Alteração de Status removido - agora é feito diretamente no badge */}

      {/* Dialog de Nota Fiscal */}
      {showNoteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Adicionar Nota Fiscal</h3>
            <p className="text-gray-600 mb-4">Preencha os dados da nota fiscal:</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da NF <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={noteData.nf_number}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNoteData(prev => ({ ...prev, nf_number: e.target.value }))}
                  placeholder="Digite o número da nota fiscal"
                />
              </div>
              
              <DatePicker
                value={noteData.nf_date}
                onChange={(value) => setNoteData(prev => ({ ...prev, nf_date: value }))}
                label="Data da NF"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor da NF (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={noteData.nf_value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNoteData(prev => ({ 
                    ...prev, 
                    nf_value: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowNoteDialog(false)}
                disabled={updating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateNote}
                loading={updating}
              >
                Criar Nota
              </Button>
            </div>
          </div>
        </div>
      )}

      </div>
    </Layout>
  )
}
