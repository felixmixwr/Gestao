import { useState, useEffect } from 'react'
import { X, Plus, TrendingUp, TrendingDown, Calendar, DollarSign, Fuel, Wrench, Package, Eye } from 'lucide-react'
import { Badge } from './Badge'
import { Button } from './Button'
import { formatCurrency, formatVolume, formatLiters, formatDate, getMaintenanceTypeColor, getMaintenanceStatusColor, getInvestmentCategoryColor, getMaintenanceIcon, getDieselIcon, getInvestmentIcon } from '../types/pump-advanced'
import { PumpDetails, Maintenance, DieselEntry, Investment } from '../types/pump-advanced'
import { PumpAdvancedAPI } from '../lib/pump-advanced-api'
import { FinancialIntegrationAlert } from './FinancialIntegrationAlert'
import { PumpKPICharts } from './PumpKPICharts'

interface PumpDetailModalProps {
  pumpId: string
  isOpen: boolean
  onClose: () => void
  onMaintenanceAdded?: () => void
  onDieselAdded?: () => void
  onInvestmentAdded?: () => void
}

export function PumpDetailModal({ 
  pumpId, 
  isOpen, 
  onClose, 
  onMaintenanceAdded, 
  onDieselAdded, 
  onInvestmentAdded 
}: PumpDetailModalProps) {
  const [pumpDetails, setPumpDetails] = useState<PumpDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'maintenance' | 'diesel' | 'investments' | 'reports' | 'charts'>('overview')
  const [showAddForm, setShowAddForm] = useState<'maintenance' | 'diesel' | 'investment' | null>(null)
  const [showFinancialAlert, setShowFinancialAlert] = useState(false)

  useEffect(() => {
    if (isOpen && pumpId) {
      loadPumpDetails()
    }
  }, [isOpen, pumpId])

  async function loadPumpDetails() {
    try {
      setLoading(true)
      setError(null)
      const details = await PumpAdvancedAPI.getPumpDetails(pumpId)
      setPumpDetails(details)
    } catch (err: any) {
      console.error('Erro ao carregar detalhes da bomba:', err)
      setError(err?.message || 'Erro ao carregar dados da bomba')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMaintenance(data: any) {
    try {
      await PumpAdvancedAPI.createMaintenance({ ...data, pump_id: pumpId })
      setShowFinancialAlert(true)
      setTimeout(() => setShowFinancialAlert(false), 3000)
      await loadPumpDetails()
      onMaintenanceAdded?.()
    } catch (err: any) {
      console.error('Erro ao adicionar manutenção:', err)
      alert(err?.message || 'Erro ao adicionar manutenção')
    }
  }

  async function handleAddDiesel(data: any) {
    try {
      await PumpAdvancedAPI.createDieselEntry({ ...data, pump_id: pumpId })
      setShowFinancialAlert(true)
      setTimeout(() => setShowFinancialAlert(false), 3000)
      await loadPumpDetails()
      onDieselAdded?.()
    } catch (err: any) {
      console.error('Erro ao adicionar abastecimento:', err)
      alert(err?.message || 'Erro ao adicionar abastecimento')
    }
  }

  async function handleAddInvestment(data: any) {
    try {
      await PumpAdvancedAPI.createInvestment({ ...data, pump_id: pumpId })
      setShowFinancialAlert(true)
      setTimeout(() => setShowFinancialAlert(false), 3000)
      await loadPumpDetails()
      onInvestmentAdded?.()
    } catch (err: any) {
      console.error('Erro ao adicionar investimento:', err)
      alert(err?.message || 'Erro ao adicionar investimento')
    }
  }

  if (!isOpen) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!pumpDetails) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{pumpDetails.prefix}</h2>
              <p className="text-sm text-gray-600">{pumpDetails.model || 'N/A'} - {pumpDetails.prefix}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-100 text-green-800">
              {pumpDetails.status}
            </Badge>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Eye },
              { id: 'maintenance', label: 'Manutenções', icon: Wrench },
              { id: 'diesel', label: 'Diesel', icon: Fuel },
              { id: 'investments', label: 'Investimentos', icon: Package },
              { id: 'reports', label: 'Relatórios', icon: TrendingUp },
              { id: 'charts', label: 'Gráficos', icon: TrendingDown }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {showFinancialAlert && (
            <FinancialIntegrationAlert />
          )}

          {activeTab === 'overview' && (
            <OverviewTab pumpDetails={pumpDetails} />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceTab 
              pumpDetails={pumpDetails}
              onAddMaintenance={handleAddMaintenance}
              showAddForm={showAddForm === 'maintenance'}
              onShowAddForm={() => setShowAddForm('maintenance')}
              onHideAddForm={() => setShowAddForm(null)}
            />
          )}

          {activeTab === 'diesel' && (
            <DieselTab 
              pumpDetails={pumpDetails}
              onAddDiesel={handleAddDiesel}
              showAddForm={showAddForm === 'diesel'}
              onShowAddForm={() => setShowAddForm('diesel')}
              onHideAddForm={() => setShowAddForm(null)}
            />
          )}

          {activeTab === 'investments' && (
            <InvestmentsTab 
              pumpDetails={pumpDetails}
              onAddInvestment={handleAddInvestment}
              showAddForm={showAddForm === 'investment'}
              onShowAddForm={() => setShowAddForm('investment')}
              onHideAddForm={() => setShowAddForm(null)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab pumpDetails={pumpDetails} />
          )}

          {activeTab === 'charts' && (
            <ChartsTab pumpDetails={pumpDetails} />
          )}
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ pumpDetails }: { pumpDetails: PumpDetails }) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Volume Total</p>
              <p className="text-2xl font-bold text-blue-900">{formatVolume(pumpDetails.kpis.total_volume_pumped)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Diesel Consumido</p>
              <p className="text-2xl font-bold text-green-900">{formatLiters(pumpDetails.kpis.total_diesel_consumed)}</p>
            </div>
            <Fuel className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Faturamento</p>
              <p className="text-2xl font-bold text-yellow-900">{formatCurrency(0)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Custos</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(pumpDetails.kpis.total_maintenance_cost + pumpDetails.kpis.total_diesel_cost + pumpDetails.kpis.total_investment_cost)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Informações Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações da Bomba</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Modelo:</span>
              <span className="font-medium">{pumpDetails.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Prefixo:</span>
              <span className="font-medium">{pumpDetails.prefix}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge className="bg-green-100 text-green-800">{pumpDetails.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ano:</span>
              <span className="font-medium">{pumpDetails.year || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Estatísticas</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Manutenções:</span>
              <span className="font-medium">{pumpDetails.maintenances.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Abastecimentos:</span>
              <span className="font-medium">{pumpDetails.diesel_entries.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Investimentos:</span>
              <span className="font-medium">{pumpDetails.investments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Relatórios:</span>
              <span className="font-medium">{pumpDetails.recent_reports?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MaintenanceTab({ 
  pumpDetails, 
  onAddMaintenance, 
  showAddForm, 
  onShowAddForm, 
  onHideAddForm 
}: { 
  pumpDetails: PumpDetails
  onAddMaintenance: (data: any) => void
  showAddForm: boolean
  onShowAddForm: () => void
  onHideAddForm: () => void
}) {
  if (showAddForm) {
    return (
      <MaintenanceForm 
        onSubmit={onAddMaintenance}
        onCancel={onHideAddForm}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Histórico de Manutenções</h3>
        <Button onClick={onShowAddForm} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Manutenção
        </Button>
      </div>

      {pumpDetails.maintenances.length === 0 ? (
        <div className="text-center py-8">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma manutenção registrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pumpDetails.maintenances.map((maintenance) => (
            <div key={maintenance.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getMaintenanceIcon(maintenance.type)}</span>
                    <h4 className="font-semibold text-gray-900">{maintenance.os_name}</h4>
                    <Badge className={getMaintenanceTypeColor(maintenance.type)}>
                      {maintenance.type}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Data:</span>
                      <p className="font-medium">{formatDate(maintenance.date)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Valor:</span>
                      <p className="font-medium">{formatCurrency(maintenance.value)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <p className="font-medium">{maintenance.status}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Próxima:</span>
                      <p className="font-medium">{formatDate(maintenance.next_maintenance_date || '')}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mt-2">{maintenance.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getMaintenanceStatusColor(maintenance.status)}>
                    {maintenance.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DieselTab({ 
  pumpDetails, 
  onAddDiesel, 
  showAddForm, 
  onShowAddForm, 
  onHideAddForm 
}: { 
  pumpDetails: PumpDetails
  onAddDiesel: (data: any) => void
  showAddForm: boolean
  onShowAddForm: () => void
  onHideAddForm: () => void
}) {
  if (showAddForm) {
    return (
      <DieselForm 
        onSubmit={onAddDiesel}
        onCancel={onHideAddForm}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Histórico de Abastecimentos</h3>
        <Button onClick={onShowAddForm} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Abastecimento
        </Button>
      </div>

      {pumpDetails.diesel_entries.length === 0 ? (
        <div className="text-center py-8">
          <Fuel className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum abastecimento registrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pumpDetails.diesel_entries.map((entry) => (
            <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getDieselIcon()}</span>
                    <h4 className="font-semibold text-gray-900">
                      {formatDate(entry.date)}
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Quantidade:</span>
                      <p className="font-medium">{formatLiters(entry.liters_filled)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Custo/L:</span>
                      <p className="font-medium">{formatCurrency(entry.cost_per_liter)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <p className="font-medium">{formatCurrency(entry.total_cost)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Quilometragem:</span>
                      <p className="font-medium">{entry.current_mileage.toLocaleString('pt-BR')} km</p>
                    </div>
                  </div>

                  {entry.notes && (
                    <p className="text-sm text-gray-500 mt-2">{entry.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InvestmentsTab({ 
  pumpDetails, 
  onAddInvestment, 
  showAddForm, 
  onShowAddForm, 
  onHideAddForm 
}: { 
  pumpDetails: PumpDetails
  onAddInvestment: (data: any) => void
  showAddForm: boolean
  onShowAddForm: () => void
  onHideAddForm: () => void
}) {
  if (showAddForm) {
    return (
      <InvestmentForm 
        onSubmit={onAddInvestment}
        onCancel={onHideAddForm}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Histórico de Investimentos</h3>
        <Button onClick={onShowAddForm} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Investimento
        </Button>
      </div>

      {pumpDetails.investments.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum investimento registrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pumpDetails.investments.map((investment) => (
            <div key={investment.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getInvestmentIcon(investment.category)}</span>
                    <h4 className="font-semibold text-gray-900">{investment.name}</h4>
                    <Badge className={getInvestmentCategoryColor(investment.category)}>
                      {investment.category}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {formatDate(investment.date)} - {formatCurrency(investment.value)}
                  </p>
                  
                  {investment.description && (
                    <p className="text-sm text-gray-500">{investment.description}</p>
                  )}
                  
                  {investment.supplier && (
                    <p className="text-sm text-gray-500">Fornecedor: {investment.supplier}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReportsTab({ pumpDetails }: { pumpDetails: PumpDetails }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Relatórios Recentes</h3>
      
      {!pumpDetails.recent_reports || pumpDetails.recent_reports.length === 0 ? (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum relatório encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pumpDetails.recent_reports.map((report: any) => (
            <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{report.report_number}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {formatDate(report.date)}
                  </p>
                  
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-600">
                      Volume: <span className="font-medium">{formatVolume(report.volume_pumped)}</span>
                    </span>
                    <span className="text-gray-600">
                      Data: <span className="font-medium">{formatDate(report.date)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ChartsTab({ pumpDetails }: { pumpDetails: PumpDetails }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Análise de Dados</h3>
      <PumpKPICharts pumpId={pumpDetails.id} />
    </div>
  )
}

function MaintenanceForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    os_name: '',
    type: 'preventiva' as 'preventiva' | 'corretiva',
    date: new Date().toISOString().split('T')[0],
    cost: 0,
    description: ''
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Nova Manutenção</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome da OS
          </label>
          <input
            type="text"
            required
            value={formData.os_name}
            onChange={(e) => setFormData({ ...formData, os_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'preventiva' | 'corretiva' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="preventiva">Preventiva</option>
            <option value="corretiva">Corretiva</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data
          </label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit">Salvar</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

function DieselForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    liters_filled: 0,
    cost_per_liter: 0,
    current_mileage: 0,
    notes: ''
  })

  const totalCost = formData.liters_filled * formData.cost_per_liter

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...formData,
      total_cost: totalCost
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Novo Abastecimento</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data
          </label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade (Litros)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={formData.liters_filled}
            onChange={(e) => setFormData({ ...formData, liters_filled: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custo por Litro
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={formData.cost_per_liter}
            onChange={(e) => setFormData({ ...formData, cost_per_liter: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quilometragem Atual
          </label>
          <input
            type="number"
            min="0"
            required
            value={formData.current_mileage}
            onChange={(e) => setFormData({ ...formData, current_mileage: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Valor Total:</strong> {formatCurrency(totalCost)}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observações
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit">Salvar</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

function InvestmentForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'equipamento' as 'equipamento' | 'melhoria' | 'upgrade' | 'outros',
    date: new Date().toISOString().split('T')[0],
    value: 0,
    supplier: '',
    description: ''
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Novo Investimento</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Investimento
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoria
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="equipamento">Equipamento</option>
            <option value="melhoria">Melhoria</option>
            <option value="upgrade">Upgrade</option>
            <option value="outros">Outros</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data
          </label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fornecedor
        </label>
        <input
          type="text"
          value={formData.supplier}
          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit">Salvar</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}