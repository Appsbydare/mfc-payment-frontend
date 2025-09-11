import React, { useMemo, useState, useEffect } from 'react'
import DateSelector from '../components/DateSelector'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'
import PaymentCategorization from '../components/PaymentCategorization'

const tabs = [
  { label: 'Attendance Verification' },
  { label: 'Payment Verification' },
  { label: 'Verification Summary' },
  { label: 'Discount Information' },
  { label: 'Coach Payments' },
  { label: 'BGM Payments' },
  { label: 'Management Payments' },
  { label: 'Exceptions' },
]

interface PaymentCalculatorProps {
  fromDate: string
  toDate: string
}

const PaymentCalculator: React.FC<PaymentCalculatorProps> = ({ fromDate, toDate }) => {
  const [activeTab, setActiveTab] = useState(0)
  
  // Load dates from localStorage or use defaults (12 months ago to today)
  const getDefaultFromDate = () => {
    const now = new Date()
    const twelveMonthsAgo = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()))
    return twelveMonthsAgo.toISOString().slice(0, 10)
  }
  
  const getDefaultToDate = () => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  }
  
  const getStoredDate = (key: string, fallback: string) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) || fallback
    }
    return fallback
  }
  
  // Force default dates if not provided in props
  const [localFromDate, setLocalFromDate] = useState(() => {
    const defaultFrom = getDefaultFromDate()
    const stored = getStoredDate('mfc-fromDate', fromDate || defaultFrom)
    // Use provided fromDate, or stored date, or default (12 months ago)
    return fromDate || stored
  })
  const [localToDate, setLocalToDate] = useState(() => getStoredDate('mfc-toDate', toDate || getDefaultToDate()))
  const [calcResult, setCalcResult] = useState<any | null>(null)

  // Save dates to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mfc-fromDate', localFromDate)
      localStorage.setItem('mfc-toDate', localToDate)
    }
  }, [localFromDate, localToDate])

  // Sync local state with props when they change (only if props are provided)
  useEffect(() => {
    if (fromDate) setLocalFromDate(fromDate)
    if (toDate) setLocalToDate(toDate)
  }, [fromDate, toDate])

  // Auto-load payment data when Payment Verification tab is clicked or on mount
  useEffect(() => {
    if (activeTab === 1 && paymentData.length === 0) {
      handleLoadPaymentData()
    }
  }, [activeTab])

  // Also load payment data on component mount
  useEffect(() => {
    if (paymentData.length === 0) {
      handleLoadPaymentData()
    }
  }, [])

  const [verifyResult, setVerifyResult] = useState<{ rows: any[]; summary: any } | null>(null)
  const [verificationSummary, setVerificationSummary] = useState<any | null>(null)
  const [sortKey, setSortKey] = useState<string>('Date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filter, setFilter] = useState<string>('')
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [unverifiedInvoices, setUnverifiedInvoices] = useState<any[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<string>('')
  const [showPaymentCategorization, setShowPaymentCategorization] = useState(false)
  const [paymentData, setPaymentData] = useState<any[]>([])


  const handleVerify = async () => {
    try {
      const payload: any = {}
      if (localFromDate || localToDate) {
        payload.fromDate = localFromDate || undefined
        payload.toDate = localToDate || undefined
      } else {
        const now = new Date()
        payload.month = now.getUTCMonth() + 1
        payload.year = now.getUTCFullYear()
      }
      
      // First perform calculation
      const calcRes = await apiService.calculatePayments(payload)
      if (calcRes.success) {
        setCalcResult(calcRes)
        toast.success('Calculation complete')
      } else {
        toast.error('Calculation failed')
        return
      }
      
      // Then perform verification
      const verifyRes = await apiService.verifyPayments(payload)
      if (verifyRes.success) {
        setVerifyResult({ rows: verifyRes.rows || [], summary: verifyRes.summary || {} })
        toast.success('Verification complete')
      } else {
        toast.error('Verification failed')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Verification failed')
    }
  }

  // Auto-verify on component mount with current date range (silent)
  useEffect(() => {
    // Auto-run verification when component mounts to show data by default
    const autoVerify = async () => {
      try {
        const payload: any = {}
        if (localFromDate || localToDate) {
          payload.fromDate = localFromDate || undefined
          payload.toDate = localToDate || undefined
        } else {
          const now = new Date()
          payload.month = now.getUTCMonth() + 1
          payload.year = now.getUTCFullYear()
        }
        
        // Silent verification - no toast messages
        try {
          const calcRes = await apiService.calculatePayments(payload)
          if (calcRes.success) {
            setCalcResult(calcRes)
          }
        } catch (calcError) {
          console.log('Auto-calculation failed:', calcError)
        }
        
        try {
          const verifyRes = await apiService.verifyPayments(payload)
          if (verifyRes.success) {
            setVerifyResult({ rows: verifyRes.rows || [], summary: verifyRes.summary || {} })
          }
        } catch (verifyError) {
          console.log('Auto-verification failed:', verifyError)
        }
      } catch (e) {
        // Silent fail - user can manually verify if needed
        console.log('Auto-verification failed, user can manually verify')
      }
    }
    
    // Run auto-verification after a short delay to let component settle
    const timer = setTimeout(autoVerify, 1000)
    return () => clearTimeout(timer)
  }, []) // Only run on mount

  // Re-run verification when date range changes (silent)
  useEffect(() => {
    if (localFromDate && localToDate) {
      const silentVerify = async () => {
        try {
          const payload: any = {}
          payload.fromDate = localFromDate || undefined
          payload.toDate = localToDate || undefined
          
          try {
            const calcRes = await apiService.calculatePayments(payload)
            if (calcRes.success) {
              setCalcResult(calcRes)
            }
          } catch (calcError) {
            console.log('Silent calculation failed:', calcError)
          }
          
          try {
            const verifyRes = await apiService.verifyPayments(payload)
            if (verifyRes.success) {
              setVerifyResult({ rows: verifyRes.rows || [], summary: verifyRes.summary || {} })
            }
          } catch (verifyError) {
            console.log('Silent verification failed:', verifyError)
          }
        } catch (e) {
          console.log('Silent verification failed')
        }
      }
      silentVerify()
    }
  }, [localFromDate, localToDate])

  const handleLoadVerificationSummary = async () => {
    try {
      const payload: any = {}
      if (fromDate || toDate) {
        payload.fromDate = fromDate || undefined
        payload.toDate = toDate || undefined
      } else {
        const now = new Date()
        payload.month = now.getUTCMonth() + 1
        payload.year = now.getUTCFullYear()
      }
      const res = await apiService.getVerificationSummary(payload)
      if (res.success) {
        setVerificationSummary(res.summary)
        toast.success('Verification summary loaded')
      } else {
        toast.error('Failed to load verification summary')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load verification summary')
    }
  }

  const handleStartManualVerification = async (row: any, rowIndex: number) => {
    try {
      const res = await apiService.getUnverifiedInvoices(row.Customer)
      if (res.success) {
        setUnverifiedInvoices(res.invoiceOptions)
        setEditingRow(rowIndex)
        setSelectedInvoice('')
      } else {
        toast.error('Failed to load unverified invoices')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load unverified invoices')
    }
  }

  const handleConfirmManualVerification = async (row: any) => {
    if (!selectedInvoice) {
      toast.error('Please select an invoice number')
      return
    }

    try {
      const res = await apiService.manuallyVerifyAttendance({
        attendanceId: `${row.Date}_${row.Customer}_${row.ClassType}`,
        invoiceNumber: selectedInvoice,
        customer: row.Customer
      })
      
      if (res.success) {
        toast.success('Attendance manually verified')
        
        // Update the local state immediately
        if (verifyResult && verifyResult.rows) {
          const updatedRows = verifyResult.rows.map((item: any) => {
            if (item.Date === row.Date && item.Customer === row.Customer && item.ClassType === row.ClassType) {
              return {
                ...item,
                Verified: true,
                Category: 'Manually Verified',
                Invoice: selectedInvoice
              }
            }
            return item
          })
          
          setVerifyResult({
            ...verifyResult,
            rows: updatedRows
          })
        }
        
        setEditingRow(null)
        setSelectedInvoice('')
        setUnverifiedInvoices([])
      } else {
        toast.error('Failed to verify attendance')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to verify attendance')
    }
  }

  const handleCancelManualVerification = () => {
    setEditingRow(null)
    setSelectedInvoice('')
    setUnverifiedInvoices([])
  }

  const handleLoadPaymentData = async () => {
    try {
      const res = await apiService.getSheetData('payments')
      if (res.success) {
        setPaymentData(res.data)
        // Remove setShowPaymentCategorization(true) to prevent interface issues
      } else {
        toast.error('Failed to load payment data')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load payment data')
    }
  }

  const handleVerifyPaymentData = async () => {
    try {
      // Apply verification logic to payment data
      const verifiedPayments = paymentData.map(payment => {
        let category = payment.Category || 'Payment'
        let isVerified = payment.IsVerified === 'true' || payment.IsVerified === true

        // Rule 1: If Memo contains "Fee", categorize as "Tax"
        if (payment.Memo && payment.Memo.toLowerCase().includes('fee')) {
          category = 'Tax'
          isVerified = true
        }

        // Rule 2: Check for 100% Discount (same day, same customer, same amount with opposite signs)
        const sameRecords = paymentData.filter(p => 
          p.Date === payment.Date && 
          p.Customer === payment.Customer && 
          Math.abs(parseFloat(p.Amount || '0')) === Math.abs(parseFloat(payment.Amount || '0'))
        )

        if (sameRecords.length >= 2) {
          // Check if we have positive and negative amounts (indicating discount)
          const amounts = sameRecords.map(p => parseFloat(p.Amount || '0'))
          const hasPositive = amounts.some(a => a > 0)
          const hasNegative = amounts.some(a => a < 0)
          
          if (hasPositive && hasNegative) {
            category = '100% Discount'
            isVerified = true
          }
        }

        return {
          ...payment,
          Category: category,
          IsVerified: isVerified
        }
      })

      // Update the local state
      setPaymentData(verifiedPayments)

      // Send updates to backend
      try {
        await apiService.updatePaymentVerification(verifiedPayments)
        toast.success('Payment verification completed')
      } catch (updateError) {
        console.log('Failed to update backend:', updateError)
        toast.success('Payment verification completed (local only)')
      }

    } catch (e: any) {
      toast.error(e?.message || 'Payment verification failed')
    }
  }

  const handlePaymentCategorizationUpdate = () => {
    // Refresh verification data when payment categories are updated
    handleVerify()
    handleLoadVerificationSummary()
  }

  const sortedFilteredRows = useMemo(() => {
    return (verifyResult?.rows || [])
      .filter((r: any) => !filter || JSON.stringify(r).toLowerCase().includes(filter.toLowerCase()))
      .sort((a: any, b: any) => {
        const av = a[sortKey] ?? ''
        const bv = b[sortKey] ?? ''
        if (av < bv) return sortDir === 'asc' ? -1 : 1
        if (av > bv) return sortDir === 'asc' ? 1 : -1
        return 0
      })
  }, [verifyResult, sortKey, sortDir, filter])

  const handleExport = () => {
    try {
      const escape = (v: any) => {
        const s = String(v ?? '')
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return '"' + s.replace(/"/g, '""') + '"'
        }
        return s
      }

      let csv = ''
      let filename = ''
      let headers: string[] = []
      let rows: any[] = []

      switch (activeTab) {
        case 0: // Attendance Verification
          if (!verifyResult || !Array.isArray(verifyResult.rows)) {
            toast.error('No attendance verification data to export')
            return
          }
          rows = verifyResult.rows
          headers = [
            'Date',
            'Customer',
            'Membership',
            'ClassType',
            'Instructors',
            'Verified',
            'Category',
            'UnitPrice',
            'EffectiveAmount',
            'CoachAmount',
            'BgmAmount',
            'ManagementAmount',
            'MfcAmount',
            'Invoice',
            'PaymentDate'
          ]
          filename = `attendance_verification_${new Date().toISOString().split('T')[0]}.csv`
          break

        case 1: // Payment Verification
          if (!paymentData || paymentData.length === 0) {
            toast.error('No payment data to export')
            return
          }
          rows = paymentData
          headers = [
            'Date',
            'Customer',
            'Amount',
            'Invoice',
            'Memo',
            'Category',
            'IsVerified'
          ]
          filename = `payment_verification_${new Date().toISOString().split('T')[0]}.csv`
          break

        case 2: // Verification Summary
          if (!verificationSummary) {
            toast.error('No verification summary data to export')
            return
          }
          // Export verification summary as a single row with summary data
          rows = [verificationSummary]
          headers = [
            'TotalRecords',
            'VerifiedCount',
            'UnverifiedCount',
            'PendingCount',
            'VerifiedPercentage',
            'LastUpdated'
          ]
          filename = `verification_summary_${new Date().toISOString().split('T')[0]}.csv`
          break

        case 3: // Coach Payments
          if (!calcResult || !Array.isArray(calcResult.coachBreakdown)) {
            toast.error('No coach payment data to export')
            return
          }
          rows = calcResult.coachBreakdown
          headers = [
            'Coach',
            'GroupAttendances',
            'PrivateAttendances',
            'GroupGross',
            'PrivateGross',
            'GroupPayment',
            'PrivatePayment',
            'TotalPayment',
            'BgmPayment',
            'ManagementPayment',
            'MfcRetained'
          ]
          filename = `coach_payments_${calcResult.calcId || 'latest'}.csv`
          break

        case 4: // BGM Payments
          if (!calcResult || !Array.isArray(calcResult.bgmBreakdown)) {
            toast.error('No BGM payment data to export')
            return
          }
          rows = calcResult.bgmBreakdown
          headers = [
            'BgmName',
            'TotalAmount',
            'PaymentDate',
            'Status'
          ]
          filename = `bgm_payments_${calcResult.calcId || 'latest'}.csv`
          break

        case 5: // Management Payments
          if (!calcResult || !Array.isArray(calcResult.managementBreakdown)) {
            toast.error('No management payment data to export')
            return
          }
          rows = calcResult.managementBreakdown
          headers = [
            'ManagementName',
            'TotalAmount',
            'PaymentDate',
            'Status'
          ]
          filename = `management_payments_${calcResult.calcId || 'latest'}.csv`
          break

        case 6: // Exceptions
          if (!calcResult || !Array.isArray(calcResult.exceptions)) {
            toast.error('No exception data to export')
            return
          }
          rows = calcResult.exceptions
          headers = [
            'Type',
            'Description',
            'Amount',
            'Date',
            'Status'
          ]
          filename = `exceptions_${calcResult.calcId || 'latest'}.csv`
          break

        default:
          toast.error('No data available for export')
          return
      }

      if (rows.length === 0) {
        toast.error('No data to export')
        return
      }

      csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => {
          // Handle different property naming conventions
          const propertyName = h.charAt(0).toLowerCase() + h.slice(1)
          return escape((r as any)[propertyName] ?? (r as any)[h] ?? '')
        }).join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success(`Exported ${rows.length} records to ${filename}`)
    } catch (e: any) {
      toast.error(e?.message || 'Export failed')
    }
  }

  return (
    <div className="space-y-4">
      {/* Window title + local date controls */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly Payment Calculator</h1>
        <div className="flex items-center gap-4">
          <DateSelector
            fromDate={localFromDate}
            toDate={localToDate}
            onFromDateChange={setLocalFromDate}
            onToDateChange={setLocalToDate}
          />
          <div className="flex gap-2">
            <button className="btn-primary" onClick={handleVerify}>Verify Payments</button>
            <button className="btn-secondary" onClick={handleExport}>Export Results</button>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-md">
        <div className="flex mb-4 gap-2">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => {
                setActiveTab(i)
                // Auto-load verification summary when switching to that tab
                if (i === 2 && !verificationSummary) {
                  handleLoadVerificationSummary()
                }
              }}
              className={`px-4 py-2 font-medium rounded-lg transition-all duration-200 ${
                activeTab === i 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Tab Content */}
        {activeTab === 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Attendance Verification</h2>
            </div>
            
      <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-700 dark:text-gray-300">Verification {verifyResult ? `(rows: ${verifyResult.rows.length})` : ''}</div>
          <div className="flex items-center gap-2">
            <input className="input-field" placeholder="Filter..." value={filter} onChange={e => setFilter(e.target.value)} />
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="overflow-x-auto">
            <div className="max-h-[560px] overflow-y-auto">
                    <table className="min-w-[1840px] w-full table-fixed text-sm text-left">
                <colgroup>
                  <col className="w-28" />
                  <col className="w-48" />
                  <col className="w-[360px]" />
                  <col className="w-[240px]" />
                  <col className="w-44" />
                  <col className="w-24" />
                  <col className="w-32" />
                  <col className="w-40" />
                  <col className="w-28" />
                  <col className="w-32" />
                  <col className="w-28" />
                  <col className="w-28" />
                  <col className="w-32" />
                  <col className="w-28" />
                  <col className="w-36" />
                  <col className="w-32" />
                  <col className="w-48" />
                  <col className="w-28" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-primary-50/80 dark:bg-slate-800/90 text-primary-800 dark:text-primary-200">
                  <tr>
                    {[
                      { key: 'Date', label: 'Date' },
                      { key: 'Customer', label: 'Customer' },
                      { key: 'Membership', label: 'Membership' },
                      { key: 'ClassType', label: 'ClassType' },
                      { key: 'Instructors', label: 'Instructors' },
                      { key: 'Verified', label: 'Verified' },
                      { key: 'Category', label: 'Category' },
                      { key: 'Actions', label: 'Actions' },
                      { key: 'Invoice', label: 'Invoice' },
                      { key: 'PaymentDate', label: 'Payment Date' },
                      { key: 'UnitPrice', label: 'Unit Price' },
                      { key: 'EffectiveAmount', label: 'Effective Amount' },
                      { key: 'CoachAmount', label: 'Coach Amount' },
                      { key: 'BgmAmount', label: 'BGM Amount' },
                      { key: 'ManagementAmount', label: 'Management Amount' },
                      { key: 'MfcAmount', label: 'MFC Amount' },
                      { key: 'DiscountName', label: 'Discount Name' },
                      { key: 'ApplicablePercentage', label: 'Discount %' },
                    ].map(col => (
                      <th
                        key={col.key}
                        onClick={() => { setSortKey(col.key); setSortDir(d => d==='asc'?'desc':'asc') }}
                        className="cursor-pointer select-none px-3 py-2 font-semibold border-b border-primary-200 dark:border-primary-700"
                      >
                        {col.label}{sortKey===col.key? (sortDir==='asc'?' ▲':' ▼'):''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedFilteredRows.map((r: any, idx: number) => (
                    <tr
                      key={idx}
                      className={`${r.Verified ? 'bg-primary-50/60 dark:bg-primary-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-800/60`}
                    >
                      <td className="px-3 py-2 border-b whitespace-nowrap">{r.Date}</td>
                      <td className="px-3 py-2 border-b truncate" title={r.Customer}>{r.Customer}</td>
                      <td className="px-3 py-2 border-b truncate" title={r.Membership}>{r.Membership}</td>
                      <td className="px-3 py-2 border-b truncate" title={r.ClassType}>{r.ClassType}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap truncate" title={r.Instructors}>{r.Instructors}</td>
                            <td className="px-3 py-2 border-b whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                r.Verified ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {r.Verified ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="px-3 py-2 border-b truncate" title={r.Category}>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                r.Category === 'Verified' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                r.Category === 'Manually Verified' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                r.Category === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                              }`}>
                                {r.Category === 'info_mismatch' ? 'No payment record' : (r.Category || 'Pending')}
                              </span>
                            </td>
                            <td className="px-3 py-2 border-b whitespace-nowrap">
                              {!r.Verified && r.Category !== 'Manually Verified' && (
                                <button
                                  onClick={() => handleStartManualVerification(r, idx)}
                                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                >
                                  Verify
                                </button>
                              )}
                            </td>
                            <td className="px-3 py-2 border-b whitespace-nowrap">
                              {editingRow === idx ? (
                                <div className="flex flex-col gap-1">
                                  <select
                                    value={selectedInvoice}
                                    onChange={(e) => setSelectedInvoice(e.target.value)}
                                    className="text-xs border rounded px-1 py-0.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                                  >
                                    <option value="">Select Invoice</option>
                                    {unverifiedInvoices.map((inv: any) => (
                                      <option key={inv.invoice} value={inv.invoice}>
                                        {inv.invoice} (€{inv.totalAmount.toFixed(2)})
                                      </option>
                                    ))}
                                  </select>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleConfirmManualVerification(r)}
                                      className="text-xs bg-green-600 text-white px-2 py-0.5 rounded hover:bg-green-700"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={handleCancelManualVerification}
                                      className="text-xs bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700"
                                    >
                                      ✗
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm">{r.Invoice || ''}</span>
                              )}
                            </td>
                      <td className="px-3 py-2 border-b whitespace-nowrap">{r.PaymentDate || ''}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.UnitPrice || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.EffectiveAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.CoachAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.BgmAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.ManagementAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.MfcAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b truncate" title={r.DiscountName || ''}>
                        {r.DiscountName ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            r.CoachPaymentType === 'full' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            r.CoachPaymentType === 'partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            r.CoachPaymentType === 'free' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {r.DiscountName}
                          </span>
                        ) : ''}
                      </td>
                      <td className="px-3 py-2 border-b whitespace-nowrap text-center">
                        {r.ApplicablePercentage ? `${Number(r.ApplicablePercentage).toFixed(1)}%` : ''}
                      </td>
                    </tr>
                  ))}
                  {!verifyResult && (
                          <tr><td className="px-3 py-4 text-gray-500" colSpan={18}>Click Verify Payments to load rows.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
          </div>
        )}
        
        {activeTab === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verification Summary</h2>
            </div>
            
            {/* Enhanced Verification Summary Layout */}
            <div className="space-y-6">
              {/* Verification Summary Cards - Moved to top */}
              {verificationSummary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Attendance Verification */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl shadow-lg border border-green-200 dark:border-green-700 p-6">
                    <h3 className="text-lg font-bold mb-4 text-green-800 dark:text-green-200 flex items-center">
                      <span className="mr-2">📋</span> Attendance Data
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-green-700 dark:text-green-300">Total Records:</span>
                        <span className="font-bold text-green-900 dark:text-green-100">{verificationSummary.totalAttendanceRecords || verificationSummary.totalRecords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700 dark:text-green-300">Verified:</span>
                        <span className="font-bold text-green-600">{verificationSummary.verifiedAttendanceRecords || verificationSummary.verifiedRecords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700 dark:text-green-300">Unverified:</span>
                        <span className="font-bold text-red-600">{verificationSummary.unverifiedAttendanceRecords || verificationSummary.unverifiedRecords}</span>
                      </div>
                      <div className="flex justify-between border-t border-green-200 dark:border-green-700 pt-2">
                        <span className="text-green-700 dark:text-green-300 font-semibold">Verification %:</span>
                        <span className="font-bold text-blue-600 text-lg">{(verificationSummary.attendanceVerificationRate || verificationSummary.verificationCompletionRate || 0).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Verification */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-700 p-6">
                    <h3 className="text-lg font-bold mb-4 text-blue-800 dark:text-blue-200 flex items-center">
                      <span className="mr-2">💳</span> Payment Data
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-blue-700 dark:text-blue-300">Total Records:</span>
                        <span className="font-bold text-blue-900 dark:text-blue-100">{verificationSummary.totalPaymentRecords || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700 dark:text-blue-300">Verified:</span>
                        <span className="font-bold text-green-600">{verificationSummary.verifiedPaymentRecords || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700 dark:text-blue-300">Unverified:</span>
                        <span className="font-bold text-red-600">{verificationSummary.unverifiedPaymentRecords || 0}</span>
                      </div>
                      <div className="flex justify-between border-t border-blue-200 dark:border-blue-700 pt-2">
                        <span className="text-blue-700 dark:text-blue-300 font-semibold">Verification %:</span>
                        <span className="font-bold text-blue-600 text-lg">{(verificationSummary.paymentVerificationRate || 0).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Categories */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-700 p-6">
                    <h3 className="text-lg font-bold mb-4 text-purple-800 dark:text-purple-200 flex items-center">
                      <span className="mr-2">🏷️</span> Payment Categories
                    </h3>
                    <div className="space-y-2 text-sm">
                      {verificationSummary.paymentCategoryBreakdown ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-purple-700 dark:text-purple-300">Payment:</span>
                            <span className="font-bold text-green-600">{verificationSummary.paymentCategoryBreakdown.payment || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-700 dark:text-purple-300">100% Discount:</span>
                            <span className="font-bold text-pink-600">{verificationSummary.paymentCategoryBreakdown.fullDiscount || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-700 dark:text-purple-300">Tax:</span>
                            <span className="font-bold text-purple-600">{verificationSummary.paymentCategoryBreakdown.tax || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-700 dark:text-purple-300">Discount:</span>
                            <span className="font-bold text-red-600">{verificationSummary.paymentCategoryBreakdown.discount || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-700 dark:text-purple-300">Refund:</span>
                            <span className="font-bold text-orange-600">{verificationSummary.paymentCategoryBreakdown.refund || 0}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-purple-500">No category data available</div>
                      )}
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-2xl shadow-lg border border-amber-200 dark:border-amber-700 p-6">
                    <h3 className="text-lg font-bold mb-4 text-amber-800 dark:text-amber-200 flex items-center">
                      <span className="mr-2">💰</span> Financial Metrics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-amber-700 dark:text-amber-300">Verified Amount:</span>
                        <span className="font-bold text-green-600">€{(verificationSummary.totalVerifiedAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-700 dark:text-amber-300">Tax Amount:</span>
                        <span className="font-bold text-purple-600">€{(verificationSummary.totalTaxAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-700 dark:text-amber-300">Discounted:</span>
                        <span className="font-bold text-red-600">€{(verificationSummary.totalDiscountedAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-amber-200 dark:border-amber-700 pt-2">
                        <span className="text-amber-700 dark:text-amber-300 font-semibold">MFC Retention:</span>
                        <span className="font-bold text-amber-600 text-lg">{(verificationSummary.mfcRetentionRate || 0).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Calculation Summary - Redesigned */}
              {calcResult && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
                    <span className="mr-2">📊</span> Calculation Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Attendance Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                      <div className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                        <span className="mr-2">👥</span> Attendance
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Verified:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{calcResult.counts.attendanceTotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Group Sessions:</span>
                          <span className="font-semibold text-blue-600">{calcResult.counts.groupSessions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Private Sessions:</span>
                          <span className="font-semibold text-purple-600">{calcResult.counts.privateSessions}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                      <div className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                        <span className="mr-2">💰</span> Revenue
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Verified:</span>
                          <span className="font-semibold text-green-600">€{Number(calcResult.revenue.totalPayments || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Group Revenue:</span>
                          <span className="font-semibold text-blue-600">€{Number(calcResult.revenue.groupRevenue || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Private Revenue:</span>
                          <span className="font-semibold text-purple-600">€{Number(calcResult.revenue.privateRevenue || 0).toFixed(2)}</span>
                        </div>
                        {calcResult.discounts && (
                          <div className="flex justify-between text-xs pt-1 border-t border-gray-200 dark:border-gray-600">
                            <span className="text-gray-500">Full Discounts Excluded:</span>
                            <span className="text-red-500">{calcResult.discounts.fullCount}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                      <div className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                        <span className="mr-2">ℹ️</span> Status
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="mb-2">✅ Using verified data only</div>
                        <div className="mb-2">🚫 Fees excluded from revenue</div>
                        <div className="mb-2">📊 Coach payments calculated</div>
                        <div className="text-xs text-green-600 font-medium mt-3">
                          {calcResult.notes}
                        </div>
                      </div>
                    </div>
          </div>
                  
                  {/* Revenue Splits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-3 rounded border border-gray-200 dark:border-gray-700">
                      <div className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Group Splits</div>
                      <div className="text-gray-900 dark:text-gray-100">Revenue: €{Number(calcResult.revenue.groupRevenue || 0).toFixed(2)}</div>
                      <div className="text-gray-900 dark:text-gray-100">Coach: €{Number(calcResult.splits?.group?.coach || 0).toFixed(2)} (43.5%)</div>
                      <div className="text-gray-900 dark:text-gray-100">BGM: €{Number(calcResult.splits?.group?.bgm || 0).toFixed(2)} (30%)</div>
                      <div className="text-gray-900 dark:text-gray-100">Management: €{Number(calcResult.splits?.group?.management || 0).toFixed(2)} (8.5%)</div>
                      <div className="text-gray-900 dark:text-gray-100">MFC: €{Number(calcResult.splits?.group?.mfc || 0).toFixed(2)} (18%)</div>
            </div>
            <div className="p-3 rounded border border-gray-200 dark:border-gray-700">
                      <div className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Private Splits</div>
                      <div className="text-gray-900 dark:text-gray-100">Revenue: €{Number(calcResult.revenue.privateRevenue || 0).toFixed(2)}</div>
                      <div className="text-gray-900 dark:text-gray-100">Coach: €{Number(calcResult.splits?.private?.coach || 0).toFixed(2)} (80%)</div>
                      <div className="text-gray-900 dark:text-gray-100">Landlord: €{Number(calcResult.splits?.private?.landlord || 0).toFixed(2)} (15%)</div>
                      <div className="text-gray-900 dark:text-gray-100">Management: €{Number(calcResult.splits?.private?.management || 0).toFixed(2)} (0%)</div>
                      <div className="text-gray-900 dark:text-gray-100">MFC: €{Number(calcResult.splits?.private?.mfc || 0).toFixed(2)} (5%)</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
        
        {activeTab === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Verification</h2>
              <button 
                className="btn-primary"
                onClick={handleVerifyPaymentData}
              >
                Categorize Payments
              </button>
            </div>
            
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-md">
              <div className="overflow-x-auto">
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md">
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Date</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Customer</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Amount</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Invoice</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Memo</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Category</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Verification Status</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentData.map((payment: any, index: number) => {
                      return (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-2 px-3 text-gray-900 dark:text-gray-100">{payment.Date}</td>
                          <td className="py-2 px-3 text-gray-900 dark:text-gray-100">{payment.Customer}</td>
                          <td className="py-2 px-3 text-gray-900 dark:text-gray-100">€{Number(payment.Amount || 0).toFixed(2)}</td>
                          <td className="py-2 px-3 text-gray-900 dark:text-gray-100">{payment.Invoice || ''}</td>
                          <td className="py-2 px-3 text-gray-900 dark:text-gray-100 max-w-xs truncate" title={payment.Memo}>
                            {payment.Memo || ''}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.Category === 'Discount' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              payment.Category === '100% Discount' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' :
                              payment.Category === 'Tax' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                              payment.Category === 'Refund' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                              payment.Category === 'Fee' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {payment.Category || 'Payment'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.IsVerified === 'true' || payment.IsVerified === true ? 
                              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {payment.IsVerified === 'true' || payment.IsVerified === true ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <button
                              onClick={() => {
                                setPaymentData(paymentData);
                                setShowPaymentCategorization(true);
                              }}
                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                            >
                              Edit Category
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {paymentData.length === 0 && (
                      <tr><td className="px-3 py-4 text-gray-500" colSpan={8}>Loading payment data...</td></tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
        </div>
      )}
        
        
        {activeTab === 3 && (
          <div className="space-y-4">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Discount Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="text-sm text-blue-600 dark:text-blue-400">Total Discounts Applied</div>
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    {calcResult?.summary?.discountBreakdown?.totalDiscounts || 0}
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Partial Discounts</div>
                  <div className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                    {calcResult?.summary?.discountBreakdown?.partialDiscounts || 0}
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <div className="text-sm text-red-600 dark:text-red-400">Free Classes</div>
                  <div className="text-xl font-bold text-red-900 dark:text-red-100">
                    {calcResult?.summary?.discountBreakdown?.freeDiscounts || 0}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Customer</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Date</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Discount Name</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Type</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Original Amount</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Discount Amount</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Effective Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(calcResult?.discountDetails || []).map((discount: any, index: number) => (
                    <tr key={index}>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{discount.customer}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{discount.date}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{discount.discountName}</td>
                      <td className="px-3 py-2 border-b">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          discount.coachPaymentType === 'full' ? 'bg-green-100 text-green-800' :
                          discount.coachPaymentType === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {discount.coachPaymentType}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">€{Number(discount.totalAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">€{Number(discount.discountAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100 font-semibold">€{Number(discount.effectiveAmount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!calcResult?.discountDetails || calcResult.discountDetails.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No discount information available for the selected period.
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 5 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Coach</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Group Gross</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Private Gross</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">BGM Amount</th>
                </tr>
              </thead>
              <tbody>
                {(calcResult?.coachBreakdown || []).map((row: any) => (
                  <tr key={`bgm-${row.coach}`}>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.coach}</td>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">€{Number(row.groupGross || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">€{Number(row.privateGross || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100 font-semibold">€{Number(row.bgmPayment || 0).toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="px-3 py-2 border-t font-semibold text-gray-900 dark:text-gray-100">Total</td>
                  <td className="px-3 py-2 border-t font-semibold text-gray-900 dark:text-gray-100">€{Number((calcResult?.coachBreakdown || []).reduce((s: number, r: any) => s + (r.groupGross || 0), 0)).toFixed(2)}</td>
                  <td className="px-3 py-2 border-t font-semibold text-gray-900 dark:text-gray-100">€{Number((calcResult?.coachBreakdown || []).reduce((s: number, r: any) => s + (r.privateGross || 0), 0)).toFixed(2)}</td>
                  <td className="px-3 py-2 border-t font-semibold text-gray-900 dark:text-gray-100">€{Number((calcResult?.coachBreakdown || []).reduce((s: number, r: any) => s + (r.bgmPayment || 0), 0)).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 7 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Coach</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Group Gross</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Private Gross</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Management Amount</th>
                </tr>
              </thead>
              <tbody>
                {(calcResult?.coachBreakdown || []).map((row: any) => (
                  <tr key={`mgmt-${row.coach}`}>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.coach}</td>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">€{Number(row.groupGross || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">€{Number(row.privateGross || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100 font-semibold">€{Number(row.managementPayment || 0).toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="px-3 py-2 border-t font-semibold text-gray-900 dark:text-gray-100">Total</td>
                  <td className="px-3 py-2 border-t font-semibold text-gray-900 dark:text-gray-100">€{Number((calcResult?.coachBreakdown || []).reduce((s: number, r: any) => s + (r.groupGross || 0), 0)).toFixed(2)}</td>
                  <td className="px-3 py-2 border-t font-semibold text-gray-900 dark:text-gray-100">€{Number((calcResult?.coachBreakdown || []).reduce((s: number, r: any) => s + (r.privateGross || 0), 0)).toFixed(2)}</td>
                  <td className="px-3 py-2 border-t font-semibold text-gray-900 dark:text-gray-100">€{Number((calcResult?.coachBreakdown || []).reduce((s: number, r: any) => s + (r.managementPayment || 0), 0)).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 7 && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4 text-sm text-gray-900 dark:text-gray-100">
            <div className="font-semibold mb-2">Discounts</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded border border-gray-200 dark:border-gray-700">
                <div>Full Discounts: {calcResult?.discounts?.fullCount ?? 0} (ignored)</div>
                <div>Partial Discounts: {calcResult?.discounts?.partialCount ?? 0} (included)</div>
              </div>
              <div className="p-3 rounded border border-gray-200 dark:border-gray-700">
                <div className="font-semibold">Manual Overrides</div>
                <div>No overrides applied yet.</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-600 dark:text-gray-300">Exceptions and manual overrides will appear here once flagged or entered.</div>
          </div>
        )}
      </div>
      
      {/* Payment Categorization Modal */}
      {showPaymentCategorization && (
        <PaymentCategorization
          onClose={() => setShowPaymentCategorization(false)}
          paymentData={paymentData}
          onUpdate={handlePaymentCategorizationUpdate}
        />
      )}
    </div>
  )
}

export default PaymentCalculator 