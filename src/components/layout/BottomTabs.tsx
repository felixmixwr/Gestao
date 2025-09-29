import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Home, 
  BarChart2, 
  DollarSign, 
  Droplets, 
  Calendar,
  Calculator
} from 'lucide-react'

interface TabItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const tabs: TabItem[] = [
  {
    name: 'Início',
    href: '/',
    icon: Home,
    label: 'Início'
  },
  {
    name: 'Relatórios',
    href: '/reports',
    icon: BarChart2,
    label: 'Relatórios'
  },
  {
    name: 'Financeiro',
    href: '/financial',
    icon: Calculator,
    label: 'Financeiro'
  },
  {
    name: 'Bombas',
    href: '/pumps',
    icon: Droplets,
    label: 'Bombas'
  },
  {
    name: 'Programação',
    href: '/programacao',
    icon: Calendar,
    label: 'Programação'
  }
]

interface BottomTabsProps {
  notifications?: {
    [key: string]: number
  }
  onTabClick?: (tabName: string) => void
}

export function BottomTabs({ notifications = {}, onTabClick }: BottomTabsProps) {
  const location = useLocation()

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  const handleTabClick = (tabName: string) => {
    if (onTabClick) {
      onTabClick(tabName)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = isActive(tab.href)
          const notificationCount = notifications[tab.name] || 0

          return (
            <Link
              key={tab.name}
              to={tab.href}
              className="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 relative"
              onClick={() => handleTabClick(tab.name)}
            >
              <motion.div
                className="relative"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <Icon 
                  className={`h-5 w-5 transition-colors duration-200 ${
                    active 
                      ? 'text-blue-600' 
                      : 'text-gray-500'
                  }`} 
                />
                
                {/* Badge de notificação */}
                {notificationCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </motion.div>
                )}
              </motion.div>
              
              <motion.span
                className={`text-xs mt-1 transition-colors duration-200 ${
                  active 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-500'
                }`}
                animate={{
                  color: active ? '#2563eb' : '#6b7280'
                }}
              >
                {tab.label}
              </motion.span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
