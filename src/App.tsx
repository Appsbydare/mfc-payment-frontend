import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Layout from '@components/layout/Layout'
import Dashboard from '@pages/Dashboard'
import DataImport from '@pages/DataImport'
import RuleManager from '@pages/RuleManager'
import PaymentCalculator from '@pages/PaymentCalculator'
import Reports from '@pages/Reports'
import Settings from '@pages/Settings'
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
          <Route path="/payment-calculator" element={<PaymentCalculator />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </div>
  )
}

export default App 