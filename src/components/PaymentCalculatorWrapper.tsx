import React, { useState, useEffect } from 'react'
import Layout from './layout/Layout'
import PaymentCalculator from '../pages/PaymentCalculator'

const PaymentCalculatorWrapper: React.FC = () => {
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [defaultDatesSet, setDefaultDatesSet] = useState(false)

  // Set default dates on component mount
  useEffect(() => {
    const setDefaultDates = async () => {
      if (!defaultDatesSet) {
        try {
          // Get current month as default
          const today = new Date()
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
          setFromDate(firstDayOfMonth.toISOString().split('T')[0])
          setToDate(today.toISOString().split('T')[0])
          setDefaultDatesSet(true)
        } catch (error) {
          // If we can't get dates, set to current month
          const today = new Date()
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
          setFromDate(firstDayOfMonth.toISOString().split('T')[0])
          setToDate(today.toISOString().split('T')[0])
          setDefaultDatesSet(true)
        }
      }
    }
    
    setDefaultDates()
  }, [defaultDatesSet])

  return (
    <Layout
      fromDate={fromDate}
      toDate={toDate}
      onFromDateChange={setFromDate}
      onToDateChange={setToDate}
    >
      <PaymentCalculator 
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
      />
    </Layout>
  )
}

export default PaymentCalculatorWrapper
