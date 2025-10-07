import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Moon, Sun, Bell, User } from 'lucide-react'
import { toggleDarkMode } from '@store/uiSlice'
import { RootState } from '@store/index'
// Date selectors are rendered inside page content, not in header

const Header: React.FC = () => {
  const dispatch = useDispatch()
  const isDarkMode = useSelector((state: RootState) => state.ui.isDarkMode)

  // Header keeps brand only; page titles live within their own windows

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
        {/* Centered Brand */}
        <span 
          className="text-gray-900 dark:text-white"
          style={{ fontFamily: 'Impact, sans-serif', fontSize: 42, fontWeight: 400 }}
        >
          Malta Fight Co. - Payment System
        </span>
        
        {/* Right: Buttons */}
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
    </header>
  )
}

export default Header 