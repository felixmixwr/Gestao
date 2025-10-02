import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Home, 
  BarChart2, 
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

export function BottomTabs() {
  const location = useLocation()

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }


  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = isActive(tab.href)

          return (
            <Link
              key={tab.name}
              to={tab.href}
              className="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 relative"
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
