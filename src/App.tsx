// Deploy marker: 5bad002+1
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Layout from '@components/layout/Layout'
import Dashboard from '@pages/Dashboard'
import DataImport from '@pages/DataImport'
import RuleManager from '@pages/RuleManager'
import DiscountManager from '@pages/DiscountManager'
import Reports from '@pages/Reports'
import Settings from '@pages/Settings'
import VerificationManager from '@pages/VerificationManager'
import { RootState } from '@store/index'

function App() {
  const isDarkMode = useSelector((state: RootState) => state.ui.isDarkMode)

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/data-import" element={<DataImport />} />
          <Route path="/rule-manager" element={<RuleManager />} />
          <Route path="/discount-manager" element={<DiscountManager />} />
          <Route path="/verification-manager" element={<VerificationManager />} />
          <Route path="/payment-calculator" element={<Navigate to="/dashboard" replace />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </div>
  )
}

export default App 