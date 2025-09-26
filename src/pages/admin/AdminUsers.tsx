import React, { useState, useEffect } from 'react'
import { AdminAPI, type BanUserData } from '../../lib/admin-api'
import { Button } from '../../components/Button'
import { formatDate } from '../../utils/format'

interface AdminUsersProps {
  onNavigate: (page: string) => void
}

interface User {
  id: string
  email: string
  created_at: string
  admin_users?: any[]
  banned_users?: any[]
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ onNavigate }) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [banModalOpen, setBanModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banReason, setBanReason] = useState('')
  const [banExpires, setBanExpires] = useState('')
  const [banning, setBanning] = useState(false)

  const limit = 20

  useEffect(() => {
    loadUsers()
  }, [currentPage])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const offset = (currentPage - 1) * limit
      const { users: usersData, total: totalCount } = await AdminAPI.getUsers(limit, offset)
      
      setUsers(usersData)
      setTotal(totalCount)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      setError('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) return

    try {
      setBanning(true)
      
      const banData: BanUserData = {
        user_id: selectedUser.id,
        email: selectedUser.email,
        reason: banReason,
        expires_at: banExpires || null
      }

      const result = await AdminAPI.banUser(banData)
      
      if (result.success) {
        alert('Usuário banido com sucesso!')
        setBanModalOpen(false)
        setSelectedUser(null)
        setBanReason('')
        setBanExpires('')
        loadUsers() // Reload users
      } else {
        alert(`Erro ao banir usuário: ${result.error}`)
      }
    } catch (error) {
      console.error('Erro ao banir usuário:', error)
      alert('Erro inesperado ao banir usuário')
    } finally {
      setBanning(false)
    }
  }

  const openBanModal = (user: User) => {
    setSelectedUser(user)
    setBanModalOpen(true)
  }

  const closeBanModal = () => {
    setBanModalOpen(false)
    setSelectedUser(null)
    setBanReason('')
    setBanExpires('')
  }

  const isUserBanned = (user: User) => {
    return user.banned_users && user.banned_users.length > 0 && user.banned_users[0].is_active
  }

  const isUserAdmin = (user: User) => {
    return user.admin_users && user.admin_users.length > 0 && user.admin_users[0].is_active
  }

  const totalPages = Math.ceil(total / limit)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
              <p className="text-gray-600 mt-2">Visualize e gerencie todos os usuários do sistema</p>
            </div>
            <Button onClick={() => onNavigate('dashboard')} variant="outline">
              ← Voltar ao Dashboard
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter(isUserAdmin).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuários Banidos</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter(isUserBanned).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Usuários</h2>
          </div>
          
          {error ? (
            <div className="p-6 text-center">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadUsers} variant="primary">
                Tentar Novamente
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Criação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {isUserAdmin(user) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Admin
                            </span>
                          )}
                          {isUserBanned(user) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Banido
                            </span>
                          )}
                          {!isUserAdmin(user) && !isUserBanned(user) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Ativo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {!isUserBanned(user) && (
                            <Button
                              onClick={() => openBanModal(user)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              Banir
                            </Button>
                          )}
                          <Button
                            onClick={() => onNavigate('logs')}
                            variant="outline"
                            size="sm"
                          >
                            Ver Logs
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {((currentPage - 1) * limit) + 1} a {Math.min(currentPage * limit, total)} de {total} usuários
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Anterior
                  </Button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ban Modal */}
        {banModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Banir Usuário</h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Usuário:</strong> {selectedUser.email}
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo do Ban *
                  </label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Digite o motivo do ban..."
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Expiração (opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={banExpires}
                    onChange={(e) => setBanExpires(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deixe em branco para ban permanente
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleBanUser}
                    disabled={!banReason.trim() || banning}
                    variant="primary"
                    className="flex-1"
                  >
                    {banning ? 'Banindo...' : 'Confirmar Ban'}
                  </Button>
                  <Button
                    onClick={closeBanModal}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
