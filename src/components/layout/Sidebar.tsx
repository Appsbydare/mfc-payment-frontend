import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { 
  LayoutDashboard, 
  Upload, 
  Settings, 
  FileText, 
  Cog,
  Percent,
  ShieldCheck
} from 'lucide-react'
import { RootState } from '@store/index'
import { setSidebarOpen } from '@store/uiSlice'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Data Import', href: '/data-import', icon: Upload },
  { name: 'Rule Manager', href: '/rule-manager', icon: Settings },
  { name: 'Discount Manager', href: '/discount-manager', icon: Percent },
  { name: 'Verification Manager', href: '/verification-manager', icon: ShieldCheck },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Cog },
]

const Sidebar: React.FC = () => {
  const location = useLocation()
  const dispatch = useDispatch()
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen)
  const [isHovered, setIsHovered] = useState(false)

  const handleLinkClick = () => {
    // Collapse sidebar when a menu item is clicked
    dispatch(setSidebarOpen(false))
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  // Show expanded sidebar if it's open OR if mouse is hovering over collapsed sidebar
  const isExpanded = sidebarOpen || isHovered

  return (
    <div 
      className={`${isExpanded ? 'w-52' : 'w-16'} bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 mb-4 ml-0 flex flex-col h-[94vh] backdrop-blur-md transition-all duration-300 ease-in-out`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <nav className="flex-1 px-1 py-2">
        <ul className="space-y-0.5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center px-2 py-1 text-s font-medium rounded-lg transition-all gap-2 shadow-sm relative overflow-hidden group
                    ${isActive
                      ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 shadow-md'
                      : 'text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                  `}
                  style={{ lineHeight: 1.1, minHeight: 32 }}
                  title={!isExpanded ? item.name : undefined}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 h-full w-1 bg-primary-500 rounded-r-lg" />
                  )}
                  <item.icon className="h-4 w-4 z-10 flex-shrink-0" />
                  <span className={`z-10 transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                    {item.name}
                  </span>
                  
                  {/* Tooltip for collapsed state */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
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