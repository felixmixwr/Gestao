import React, { useState, useEffect } from 'react'
import { AdminAPI } from '../../lib/admin-api'
import { AdminDashboard } from './AdminDashboard'
import { AdminUsers } from './AdminUsers'
import { AdminLogs } from './AdminLogs'

export const AdminPanel: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const adminStatus = await AdminAPI.isAdmin()
      
      if (!adminStatus) {
        setError('Acesso negado. Você não tem permissões de administrador.')
        return
      }
      
      setIsAdmin(true)
    } catch (error) {
      console.error('Erro ao verificar acesso admin:', error)
      setError('Erro ao verificar permissões de administrador.')
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />
      case 'users':
        return <AdminUsers onNavigate={handleNavigate} />
      case 'logs':
        return <AdminLogs onNavigate={handleNavigate} />
      case 'banned':
        return <AdminUsers onNavigate={handleNavigate} />
      case 'settings':
        return (
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
                    <p className="text-gray-600 mt-2">Configurações do sistema administrativo</p>
                  </div>
                  <button
                    onClick={() => handleNavigate('dashboard')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    ← Voltar ao Dashboard
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center text-gray-500 py-8">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p>Configurações em desenvolvimento</p>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return <AdminDashboard onNavigate={handleNavigate} />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (error || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">
            {error || 'Você não tem permissões para acessar o painel administrativo.'}
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Apenas usuários com permissões de administrador podem acessar esta área.
            </p>
            <p className="text-sm text-gray-500">
              Se você acredita que deveria ter acesso, entre em contato com o administrador do sistema.
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentPage()}
    </div>
  )
}
