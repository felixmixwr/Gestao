import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-hooks'
import { APP_CONFIG } from '../utils/constants'
import clsx from 'clsx'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: '🏠' },
    { name: 'Programação', href: '/programacao', icon: '📅' },
  { name: 'Clientes', href: '/clients', icon: '👥' },
  { name: 'Bombas', href: '/pumps', icon: '⚙️' },
  { name: 'Bombas Terceiras', href: '/bombas-terceiras/empresas', icon: '🏢' },
  { name: 'Colaboradores', href: '/colaboradores', icon: '👷' },
  { name: 'Relatórios', href: '/reports', icon: '📊' },
  { name: 'Pagamentos a Receber', href: '/pagamentos-receber', icon: '💰' },
  { name: 'Notas', href: '/notes', icon: '📝' },
]

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  // Extrair primeiro nome do email ou usar o nome completo se disponível
  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0]
    }
    if (user?.email) {
      return user.email.split('@')[0].split('.')[0]
    }
    return 'Usuário'
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col shadow-xl" style={{ backgroundColor: '#2663EB' }}>
          <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-4">
            {/* Logo/Brand */}
            <div className="flex items-center flex-shrink-0 px-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold" style={{ color: '#2663EB' }}>F</span>
                </div>
                <div className="ml-3">
                  <h1 className="text-lg font-bold text-white">
                    {APP_CONFIG.COMPANY_NAME}
                  </h1>
                  <p className="text-xs text-blue-100">
                    {APP_CONFIG.SECONDARY_COMPANY_NAME}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="mt-8 flex-1 space-y-2 px-4">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      'group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-white bg-opacity-20 text-white shadow-lg backdrop-blur-sm'
                        : 'text-blue-100 hover:bg-white hover:bg-opacity-10 hover:text-white'
                    )}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          {/* User section */}
          <div className="flex-shrink-0 border-t border-blue-400 border-opacity-30 p-4">
            <div className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {getUserDisplayName()}
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-blue-200 hover:text-white transition-colors duration-200"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <span className="sr-only">Abrir sidebar</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>
        
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
