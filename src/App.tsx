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
  const [fromDate, setFromDate] = React.useState<string>('')
  const [toDate, setToDate] = React.useState<string>('')

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // Initialize default dates once on app start
  React.useEffect(() => {
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    setFromDate(firstDayOfMonth.toISOString().split('T')[0])
    setToDate(today.toISOString().split('T')[0])
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/data-import" element={<DataImport />} />
          <Route path="/rule-manager" element={<RuleManager />} />
          <Route
            path="/payment-calculator"
            element={<PaymentCalculator fromDate={fromDate} toDate={toDate} />}
          />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </div>
  )
}

export default App 