import React, { ReactNode, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-hooks'
import { APP_CONFIG } from '../utils/constants'
import { Sidebar, SidebarBody, SidebarLink } from './ui/sidebar'
import { BottomTabs } from './layout/BottomTabs'
import { NotificationManager } from './NotificationManager'
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  Building2, 
  UserCheck, 
  BarChart3, 
  DollarSign, 
  FileText,
  LogOut,
  Calculator
} from 'lucide-react'
import { motion } from 'framer-motion'

interface LayoutProps {
  children: ReactNode
}

interface NotificationContextProps {
  notifications: { [key: string]: number }
  clearNotification: (tabName: string) => void
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: <LayoutDashboard className="text-white h-5 w-5 flex-shrink-0" />
  },
  { 
    name: 'Programação', 
    href: '/programacao', 
    icon: <Calendar className="text-white h-5 w-5 flex-shrink-0" />
  },
  { 
    name: 'Clientes', 
    href: '/clients', 
    icon: <Users className="text-white h-5 w-5 flex-shrink-0" />
  },
  { 
    name: 'Bombas', 
    href: '/pumps', 
    icon: <Settings className="text-white h-5 w-5 flex-shrink-0" />
  },
  { 
    name: 'Bombas Terceiras', 
    href: '/bombas-terceiras/empresas', 
    icon: <Building2 className="text-white h-5 w-5 flex-shrink-0" />
  },
  { 
    name: 'Colaboradores', 
    href: '/colaboradores', 
    icon: <UserCheck className="text-white h-5 w-5 flex-shrink-0" />
  },
  { 
    name: 'Financeiro', 
    href: '/financial', 
    icon: <Calculator className="text-white h-5 w-5 flex-shrink-0" />
  },
  { 
    name: 'Relatórios', 
    href: '/reports', 
    icon: <BarChart3 className="text-white h-5 w-5 flex-shrink-0" />
  },
  { 
    name: 'Pagamentos a Receber', 
    href: '/pagamentos-receber', 
    icon: <DollarSign className="text-white h-5 w-5 flex-shrink-0" />
  },
  { 
    name: 'Notas', 
    href: '/notes', 
    icon: <FileText className="text-white h-5 w-5 flex-shrink-0" />
  },
]

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

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

  // Componente Logo
  const Logo = () => {
    return (
      <Link
        to="/"
        className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
      >
        <div className="h-5 w-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-blue-600">F</span>
        </div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-medium text-white whitespace-pre"
        >
          {APP_CONFIG.COMPANY_NAME}
        </motion.span>
      </Link>
    )
  }

  // Componente LogoIcon (versão compacta)
  const LogoIcon = () => {
    return (
      <Link
        to="/"
        className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
      >
        <div className="h-5 w-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-blue-600">F</span>
        </div>
      </Link>
    )
  }

  return (
    <NotificationManager>
      {({ notifications, clearNotification }: NotificationContextProps) => (
        <div className="min-h-screen bg-gray-50">
          {/* Sidebar */}
          <div className="hidden md:fixed md:inset-y-0 md:flex md:flex-col z-10">
            <Sidebar open={open} setOpen={setOpen}>
              <SidebarBody className="justify-between gap-10">
                <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                  {open ? <Logo /> : <LogoIcon />}
                  <div className="mt-8 flex flex-col gap-2">
                    {navigation.map((item, idx) => (
                      <SidebarLink 
                        key={idx} 
                        link={{
                          label: item.name,
                          href: item.href,
                          icon: item.icon
                        }} 
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <SidebarLink
                    link={{
                      label: getUserDisplayName(),
                      href: "/profile",
                      icon: (
                        <div className="h-7 w-7 flex-shrink-0 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white text-xs font-bold">
                          {getUserDisplayName().charAt(0).toUpperCase()}
                        </div>
                      ),
                    }}
                  />
                  <SidebarLink
                    link={{
                      label: "Sair",
                      href: "#",
                      icon: <LogOut className="text-white h-5 w-5 flex-shrink-0" />
                    }}
                    className="cursor-pointer"
                    onClick={handleSignOut}
                  />
                </div>
              </SidebarBody>
            </Sidebar>
          </div>

          {/* Main content */}
          <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${
            open 
              ? 'md:pl-64 lg:pl-64 xl:pl-64 2xl:pl-64' 
              : 'md:pl-16 lg:pl-16 xl:pl-16 2xl:pl-16'
          }`}>
            <main className="flex-1 pb-20 md:pb-0">
              <div className="py-4 md:py-6">
                <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 lg:px-8">
                  {children}
                </div>
              </div>
            </main>
          </div>

          {/* Bottom Tabs - Mobile Only */}
          <BottomTabs 
            notifications={notifications}
            onTabClick={(tabName) => clearNotification(tabName)}
          />
        </div>
      )}
    </NotificationManager>
  )
}
