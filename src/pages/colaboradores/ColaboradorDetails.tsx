import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { supabase } from '../../lib/supabase'
import { 
  ColaboradorWithRelations, 
  formatarSalario,
  formatarData
} from '../../types/colaboradores'
import DependenteForm from '../../components/DependenteForm'
import DocumentoForm from '../../components/DocumentoForm'
import HoraExtraForm from '../../components/HoraExtraForm'

export default function ColaboradorDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [colaboradorData, setColaboradorData] = useState<ColaboradorWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'dependentes' | 'documentos' | 'horas_extras'>('info')
  
  // Estados para formulários
  const [showDependenteForm, setShowDependenteForm] = useState(false)
  const [showDocumentoForm, setShowDocumentoForm] = useState(false)
  const [showHoraExtraForm, setShowHoraExtraForm] = useState(false)

  useEffect(() => {
    if (id) {
      loadColaboradorDetails()
    }
  }, [id])

  const loadColaboradorDetails = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      setError(null)

      // Buscar colaborador com relações
      const { data: colaboradorData, error: colaboradorError } = await supabase
        .from('colaboradores')
        .select(`
          *,
          equipamento_vinculado:pumps(id, prefix, model, brand)
        `)
        .eq('id', id)
        .single()

      if (colaboradorError) throw colaboradorError

      // Buscar dependentes
      const { data: dependentes, error: dependentesError } = await supabase
        .from('colaboradores_dependentes')
        .select('*')
        .eq('colaborador_id', id)
        .order('nome_completo')

      if (dependentesError) throw dependentesError

      // Buscar documentos
      const { data: documentos, error: documentosError } = await supabase
        .from('colaboradores_documentos')
        .select('*')
        .eq('colaborador_id', id)
        .order('tipo_documento')

      if (documentosError) throw documentosError

      // Buscar horas extras
      const { data: horasExtras, error: horasExtrasError } = await supabase
        .from('colaboradores_horas_extras')
        .select('*')
        .eq('colaborador_id', id)
        .order('data', { ascending: false })

      if (horasExtrasError) throw horasExtrasError

      setColaboradorData({
        ...colaboradorData,
        dependentes: dependentes || [],
        documentos: documentos || [],
        horas_extras: horasExtras || []
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes do colaborador')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDependente = async (dependenteId: string) => {
    if (!confirm('Tem certeza que deseja excluir este dependente?')) return

    try {
      const { error } = await supabase
        .from('colaboradores_dependentes')
        .delete()
        .eq('id', dependenteId)

      if (error) throw error
      loadColaboradorDetails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir dependente')
    }
  }

  const handleDeleteDocumento = async (documentoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return

    try {
      const { error } = await supabase
        .from('colaboradores_documentos')
        .delete()
        .eq('id', documentoId)

      if (error) throw error
      loadColaboradorDetails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir documento')
    }
  }

  const handleDeleteHoraExtra = async (horaExtraId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta hora extra?')) return

    try {
      const { error } = await supabase
        .from('colaboradores_horas_extras')
        .delete()
        .eq('id', horaExtraId)

      if (error) throw error
      loadColaboradorDetails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir hora extra')
    }
  }

  const calcularTotalHorasExtras = () => {
    if (!colaboradorData?.horas_extras) return 0
    return colaboradorData.horas_extras.reduce((total, hora) => total + hora.valor_calculado, 0)
  }

  if (loading) {
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
        onRetry={loadColaboradorDetails} 
      />
    )
  }

  if (!colaboradorData) {
    return (
      <GenericError 
        title="Colaborador não encontrado" 
        message="O colaborador solicitado não foi encontrado." 
        onRetry={() => navigate('/colaboradores')} 
      />
    )
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{colaboradorData.nome}</h2>
            <p className="text-gray-600">{colaboradorData.funcao}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/colaboradores/${id}/edit`)}>
              ✏️ Editar
            </Button>
            <Button variant="outline" onClick={() => navigate('/colaboradores')}>
              ← Voltar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8">
            {[
              { id: 'info', label: 'Informações', icon: '👤' },
              { id: 'dependentes', label: 'Dependentes', icon: '👥' },
              { id: 'documentos', label: 'Documentos', icon: '📄' },
              { id: 'horas_extras', label: 'Horas Extras', icon: '⏰' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Nome</dt>
                      <dd className="text-sm text-gray-900">{colaboradorData.nome}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Função</dt>
                      <dd className="text-sm text-gray-900">{colaboradorData.funcao}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tipo de Contrato</dt>
                      <dd className="text-sm text-gray-900">{colaboradorData.tipo_contrato}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Salário Fixo</dt>
                      <dd className="text-sm text-gray-900">{formatarSalario(colaboradorData.salario_fixo)}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Status e Vínculos</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Registrado</dt>
                      <dd className="text-sm text-gray-900">
                        {colaboradorData.registrado ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Sim
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Não
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Vale Transporte</dt>
                      <dd className="text-sm text-gray-900">
                        {colaboradorData.vale_transporte ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Sim ({colaboradorData.qtd_passagens_por_dia} passagens/dia)
                          </span>
                        ) : (
                          <span className="text-gray-500">Não</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Equipamento Vinculado</dt>
                      <dd className="text-sm text-gray-900">
                        {colaboradorData.equipamento_vinculado ? (
                          <span className="text-blue-600">
                            {colaboradorData.equipamento_vinculado.prefix} - {colaboradorData.equipamento_vinculado.model}
                          </span>
                        ) : (
                          <span className="text-gray-500">Não vinculado</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Pagamentos */}
              {colaboradorData.tipo_contrato === 'fixo' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pagamentos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {colaboradorData.data_pagamento_1 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900">Pagamento 1</h4>
                        <p className="text-sm text-gray-600">
                          Data: {formatarData(colaboradorData.data_pagamento_1)}
                        </p>
                        {colaboradorData.valor_pagamento_1 && (
                          <p className="text-sm text-gray-600">
                            Valor: {formatarSalario(colaboradorData.valor_pagamento_1)}
                          </p>
                        )}
                      </div>
                    )}
                    {colaboradorData.data_pagamento_2 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900">Pagamento 2</h4>
                        <p className="text-sm text-gray-600">
                          Data: {formatarData(colaboradorData.data_pagamento_2)}
                        </p>
                        {colaboradorData.valor_pagamento_2 && (
                          <p className="text-sm text-gray-600">
                            Valor: {formatarSalario(colaboradorData.valor_pagamento_2)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resumo Financeiro */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo Financeiro</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Horas Extras:</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {formatarSalario(calcularTotalHorasExtras())}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-medium text-gray-700">Salário Fixo:</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatarSalario(colaboradorData.salario_fixo)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dependentes' && (
            <DependentesTab 
              dependentes={colaboradorData.dependentes || []}
              onAdd={() => setShowDependenteForm(true)}
              onDelete={handleDeleteDependente}
            />
          )}

          {activeTab === 'documentos' && (
            <DocumentosTab 
              documentos={colaboradorData.documentos || []}
              onAdd={() => setShowDocumentoForm(true)}
              onDelete={handleDeleteDocumento}
            />
          )}

          {activeTab === 'horas_extras' && (
            <HorasExtrasTab 
              horasExtras={colaboradorData.horas_extras || []}
              onAdd={() => setShowHoraExtraForm(true)}
              onDelete={handleDeleteHoraExtra}
            />
          )}
        </div>

        {/* Formulários modais */}
        {showDependenteForm && (
          <DependenteForm
            colaboradorId={colaboradorData.id}
            onSave={() => {
              setShowDependenteForm(false)
              loadColaboradorDetails()
            }}
            onCancel={() => setShowDependenteForm(false)}
          />
        )}

        {showDocumentoForm && (
          <DocumentoForm
            colaboradorId={colaboradorData.id}
            onSave={() => {
              setShowDocumentoForm(false)
              loadColaboradorDetails()
            }}
            onCancel={() => setShowDocumentoForm(false)}
          />
        )}

        {showHoraExtraForm && (
          <HoraExtraForm
            colaboradorId={colaboradorData.id}
            salarioFixo={colaboradorData.salario_fixo}
            onSave={() => {
              setShowHoraExtraForm(false)
              loadColaboradorDetails()
            }}
            onCancel={() => setShowHoraExtraForm(false)}
          />
        )}
      </div>
    </Layout>
  )
}

// Componente para aba de dependentes
function DependentesTab({ 
  dependentes, 
  onAdd, 
  onDelete
}: {
  dependentes: any[]
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Dependentes</h3>
        <Button onClick={onAdd}>
          <span>➕</span> Adicionar
        </Button>
      </div>

      {dependentes.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Nenhum dependente cadastrado</p>
      ) : (
        <div className="space-y-3">
          {dependentes.map(dependente => (
            <div key={dependente.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">{dependente.nome_completo}</h4>
                <p className="text-sm text-gray-600">
                  Nascimento: {formatarData(dependente.data_nascimento)}
                  {dependente.local_nascimento && ` • ${dependente.local_nascimento}`}
                  {dependente.tipo_dependente && ` • ${dependente.tipo_dependente}`}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onDelete(dependente.id)}>
                🗑️
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Componente para aba de documentos
function DocumentosTab({ 
  documentos, 
  onAdd, 
  onDelete
}: {
  documentos: any[]
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Documentos</h3>
        <Button onClick={onAdd}>
          <span>➕</span> Adicionar
        </Button>
      </div>

      {documentos.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Nenhum documento cadastrado</p>
      ) : (
        <div className="space-y-3">
          {documentos.map(documento => (
            <div key={documento.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{documento.tipo_documento}</h4>
                  {documento.dados_texto && (
                    <div className="mt-2 text-sm text-gray-600">
                      {Object.entries(documento.dados_texto).map(([key, value]) => (
                        <p key={key}>
                          <span className="font-medium">{key}:</span> {String(value)}
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Cadastrado em: {formatarData(documento.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {documento.arquivo_url && (
                    <a
                      href={documento.arquivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                      title="Baixar arquivo"
                    >
                      📥
                    </a>
                  )}
                  <Button variant="outline" size="sm" onClick={() => onDelete(documento.id)}>
                    🗑️
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Componente para aba de horas extras
function HorasExtrasTab({ 
  horasExtras, 
  onAdd, 
  onDelete
}: {
  horasExtras: any[]
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  const totalHoras = horasExtras.reduce((sum, hora) => sum + hora.horas, 0)
  const totalValor = horasExtras.reduce((sum, hora) => sum + hora.valor_calculado, 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Horas Extras</h3>
        <Button onClick={onAdd}>
          <span>➕</span> Adicionar
        </Button>
      </div>

      {/* Resumo */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Total de Horas</p>
            <p className="text-lg font-semibold text-blue-600">{totalHoras}h</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Valor Total</p>
            <p className="text-lg font-semibold text-blue-600">{formatarSalario(totalValor)}</p>
          </div>
        </div>
      </div>

      {horasExtras.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Nenhuma hora extra registrada</p>
      ) : (
        <div className="space-y-3">
          {horasExtras.map(horaExtra => (
            <div key={horaExtra.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">
                  {formatarData(horaExtra.data)}
                </h4>
                <p className="text-sm text-gray-600">
                  {horaExtra.horas}h • {horaExtra.tipo_dia === 'segunda-sexta' ? 'Segunda a Sexta' : 'Sábado'}
                </p>
                <p className="text-sm text-gray-600">
                  Valor: {formatarSalario(horaExtra.valor_calculado)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onDelete(horaExtra.id)}>
                🗑️
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
