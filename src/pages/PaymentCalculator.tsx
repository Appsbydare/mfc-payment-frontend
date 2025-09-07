import React, { useMemo, useState, useEffect } from 'react'
import DateSelector from '../components/DateSelector'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'
import PaymentCategorization from '../components/PaymentCategorization'

const tabs = [
  { label: 'Attendance Verification' },
  { label: 'Payment Verification' },
  { label: 'Verification Summary' },
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
  const [localFromDate, setLocalFromDate] = useState(fromDate)
  const [localToDate, setLocalToDate] = useState(toDate)
  const [calcResult, setCalcResult] = useState<any | null>(null)

  // Sync local state with props when they change
  useEffect(() => {
    setLocalFromDate(fromDate)
    setLocalToDate(toDate)
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
  const [hasUnverifiedData, setHasUnverifiedData] = useState(false)


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
        setHasUnverifiedData(false)
      } else {
        toast.error('Verification failed')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Verification failed')
    }
  }

  // Auto-load persisted verification results and check unverified indicator
  const loadPersisted = async () => {
    try {
      const [persisted, settings] = await Promise.all([
        apiService.getAttendanceVerification().catch(() => ({ success: false } as any)),
        apiService.getSettingsSheet().catch(() => ({ success: false } as any)),
      ])
      if ((persisted as any).success) {
        const rows = (persisted as any).data || []
        if (rows.length > 0) {
          setVerifyResult({ rows, summary: {} })
        }
      }
      if ((settings as any).success) {
        const map = new Map((settings as any).data.map((r: any) => [String((r.key ?? r.Key) || '').toLowerCase(), r]))
        const flag: any = map.get('has_unverified_data')
        const flagVal = flag ? (flag.value ?? flag.Value ?? flag['Value'] ?? flag['value']) : undefined
        setHasUnverifiedData(String(flagVal || '').toLowerCase() === 'true')
      }
    } catch {}
  }

  // Load persisted data on component mount
  useEffect(() => {
    loadPersisted()
  }, [])

  // Also load when switching to Attendance Verification tab
  useEffect(() => {
    if (activeTab === 0) {
      loadPersisted()
    }
  }, [activeTab])

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
              onClick={() => setActiveTab(i)}
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
              {hasUnverifiedData && (
                <div className="text-sm px-3 py-1 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  There are unverified data. Click "Verify Payments" to verify.
                </div>
              )}
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
                      { key: 'UnitPrice', label: 'Unit Price' },
                      { key: 'EffectiveAmount', label: 'Effective Amount' },
                      { key: 'CoachAmount', label: 'Coach Amount' },
                      { key: 'BgmAmount', label: 'BGM Amount' },
                      { key: 'ManagementAmount', label: 'Management Amount' },
                      { key: 'MfcAmount', label: 'MFC Amount' },
                      { key: 'Invoice', label: 'Invoice' },
                      { key: 'PaymentDate', label: 'Payment Date' },
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
                      <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.UnitPrice || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.EffectiveAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.CoachAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.BgmAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.ManagementAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.MfcAmount || 0).toFixed(2)}</td>
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
                    </tr>
                  ))}
                  {!verifyResult && (
                          <tr><td className="px-3 py-4 text-gray-500" colSpan={16}>Click Verify Payments to load rows.</td></tr>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLoadVerificationSummary}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Load Summary
                </button>
              </div>
            </div>
            
            {/* Combined Calculation and Verification Summary */}
            <div className="space-y-6">
              {/* Calculation Summary */}
      {calcResult && (
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-md">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Calculation Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded border border-gray-200 dark:border-gray-700">
              <div className="font-semibold text-gray-700 dark:text-gray-200">Attendance</div>
              <div className="text-gray-900 dark:text-gray-100">Total: {calcResult.counts.attendanceTotal}</div>
              <div className="text-gray-900 dark:text-gray-100">Group: {calcResult.counts.groupSessions}</div>
              <div className="text-gray-900 dark:text-gray-100">Private: {calcResult.counts.privateSessions}</div>
            </div>
            <div className="p-3 rounded border border-gray-200 dark:border-gray-700">
              <div className="font-semibold text-gray-700 dark:text-gray-200">Payments</div>
              <div className="text-gray-900 dark:text-gray-100">Count: {calcResult.counts.paymentsCount}</div>
              <div className="text-gray-900 dark:text-gray-100">Discount-tagged: {calcResult.counts.discountPayments}</div>
              <div className="text-gray-900 dark:text-gray-100">Total: €{Number(calcResult.revenue.totalPayments || 0).toFixed(2)}</div>
              <div className="text-gray-900 dark:text-gray-100">Group Revenue (allocated): €{Number(calcResult.revenue.groupRevenue || 0).toFixed(2)}</div>
              <div className="text-gray-900 dark:text-gray-100">Private Revenue (allocated): €{Number(calcResult.revenue.privateRevenue || 0).toFixed(2)}</div>
              {calcResult.discounts && (
                <div className="mt-2 text-gray-900 dark:text-gray-100">
                  <div>Full Discounts: {calcResult.discounts.fullCount} (ignored)</div>
                  <div>Partial Discounts: {calcResult.discounts.partialCount} (included)</div>
                </div>
              )}
            </div>
            <div className="p-3 rounded border border-gray-200 dark:border-gray-700">
              <div className="font-semibold text-gray-700 dark:text-gray-200">Notes</div>
              <div className="text-gray-900 dark:text-gray-100">{calcResult.notes}</div>
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

              {/* Verification Summary */}
              {verificationSummary ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Record Counts */}
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-md">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                      📊 Verification Counts
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Records:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{verificationSummary.totalRecords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Verified:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">{verificationSummary.verifiedRecords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">{verificationSummary.unverifiedRecords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Manual:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{verificationSummary.manuallyVerifiedRecords}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-md">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                      💰 Financial Metrics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Discounted:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">€{verificationSummary.totalDiscountedAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tax Amount:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">€{verificationSummary.totalTaxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">MFC Future:</span>
                        <span className="font-semibold text-purple-600 dark:text-purple-400">€{verificationSummary.totalFuturePaymentsMFC.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Verified:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">€{verificationSummary.totalVerifiedAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Unverified:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">€{verificationSummary.totalUnverifiedAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-md">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                      📈 Performance Metrics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{verificationSummary.verificationCompletionRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">MFC Retention:</span>
                        <span className="font-semibold text-purple-600 dark:text-purple-400">{verificationSummary.mfcRetentionRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${verificationSummary.verificationCompletionRate}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Verification Progress
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 backdrop-blur-md text-center">
                  <p className="text-gray-600 dark:text-gray-400">Click "Load Summary" to view verification metrics</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Verification</h2>
            </div>
            
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-md">
              <div className="overflow-x-auto">
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="min-w-full text-sm">
                  <thead>
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
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Coach</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Group Units</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Private Units</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Group Payment</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Private Payment</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Total</th>
                </tr>
              </thead>
              <tbody>
                {(calcResult?.coachBreakdown || []).map((row: any) => (
                  <tr key={row.coach}>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.coach}</td>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.groupAttendances}</td>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.privateAttendances}</td>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">€{Number(row.groupPayment || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">€{Number(row.privatePayment || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100 font-semibold">€{Number(row.totalPayment || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 4 && (
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
        {activeTab === 5 && (
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
        {activeTab === 6 && (
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