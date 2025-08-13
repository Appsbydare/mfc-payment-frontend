import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Upload, 
  Settings, 
  Calculator, 
  FileText, 
  Cog 
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Data Import', href: '/data-import', icon: Upload },
  { name: 'Rule Manager', href: '/rule-manager', icon: Settings },
  { name: 'Payment Calculator', href: '/payment-calculator', icon: Calculator },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Cog },
]

const Sidebar: React.FC = () => {
  const location = useLocation()

  return (
    <div className="w-52 bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 mb-4 ml-0 flex flex-col h-[94vh] backdrop-blur-md">
      <nav className="flex-1 px-1 py-2">
        <ul className="space-y-0.5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center px-2 py-1 text-s font-medium rounded-lg transition-all gap-2 shadow-sm relative overflow-hidden
                    ${isActive
                      ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 shadow-md'
                      : 'text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                  `}
                  style={{ lineHeight: 1.1, minHeight: 32 }}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 h-full w-1 bg-primary-500 rounded-r-lg" />
                  )}
                  <item.icon className="h-4 w-4 z-10" />
                  <span className="z-10">{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

export default Sidebar 