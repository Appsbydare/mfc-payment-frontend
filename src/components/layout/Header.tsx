import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { Moon, Sun, Bell, User } from 'lucide-react'
import { toggleDarkMode } from '@store/uiSlice'
import { RootState } from '@store/index'
import DateSelector from '../DateSelector'

interface HeaderProps {
  fromDate?: string
  toDate?: string
  onFromDateChange?: (date: string) => void
  onToDateChange?: (date: string) => void
}

const Header: React.FC<HeaderProps> = ({ 
  fromDate, 
  toDate, 
  onFromDateChange, 
  onToDateChange 
}) => {
  const dispatch = useDispatch()
  const isDarkMode = useSelector((state: RootState) => state.ui.isDarkMode)
  const location = useLocation()

  // Get page title based on current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/payment-calculator':
        return 'Monthly Payment Calculator'
      case '/dashboard':
        return 'Dashboard'
      case '/data-import':
        return 'Data Import'
      case '/rule-manager':
        return 'Rule Manager'
      case '/reports':
        return 'Reports'
      case '/settings':
        return 'Settings'
      default:
        return 'Malta Fight Co. - Payment Automation System'
    }
  }

  return (
    <header className="w-full bg-white/30 dark:bg-gray-900/30 shadow-lg border-b border-gray-200 dark:border-gray-700 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3 min-h-[56px] gap-1.5">
        {/* Left: Logo */}
        <div className="flex items-center w-32">
          <img
            src={isDarkMode ? '/Logo_White.png' : '/Logo_Black.png'}
            alt="MFC Logo"
            className="h-16 w-16 object-contain select-none"
            style={{ maxWidth: 64, maxHeight: 64 }}
            draggable="false"
          />
        </div>
        {/* Centered Title */}
        <span 
          className="text-gray-900 dark:text-white font-bold"
          style={{ fontFamily: 'Impact, sans-serif', fontSize: location.pathname === '/payment-calculator' ? 32 : 42 }}
        >
          {getPageTitle()}
        </span>
        
        {/* Right: Date Selector (for Payment Calculator) or Button group */}
        {location.pathname === '/payment-calculator' && fromDate && toDate && onFromDateChange && onToDateChange ? (
          <div className="flex items-center gap-4">
            <DateSelector
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={onFromDateChange}
              onToDateChange={onToDateChange}
            />
            <div className="flex items-center gap-2">
              <button
                aria-label="Toggle dark mode"
                title="Toggle dark mode"
                onClick={() => dispatch(toggleDarkMode())}
                className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Moon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                )}
              </button>
              <button
                aria-label="Notifications"
                title="Notifications"
                className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm"
              >
                <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                aria-label="User profile"
                title="User profile"
                className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm"
              >
                <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
              onClick={() => dispatch(toggleDarkMode())}
              className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            <button
              aria-label="Notifications"
              title="Notifications"
              className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm"
            >
              <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              aria-label="User profile"
              title="User profile"
              className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm"
            >
              <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header 