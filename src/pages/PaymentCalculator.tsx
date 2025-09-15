import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'

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

const PaymentCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [sortKey, setSortKey] = useState<string>('eventStartsAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState<string>('')
  const [masterData, setMasterData] = useState<any[]>([])
  const [verificationSummary, setVerificationSummary] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleLoadMasterData = async () => {
    try {
      setLoading(true)
      const result = await apiService.getAttendanceVerificationMaster()
      
      if (result.success) {
        setMasterData(result.data)
        setVerificationSummary(result.summary)
      }
    } catch (error: any) {
      console.error('Error loading master data:', error)
      toast.error('Failed to load verification data')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    try {
      toast.loading('Verifying payments...', { id: 'verify' })
      
      const result = await apiService.verifyAttendanceData()
      
      if (result.success) {
        if (result.message === 'Uploaded Data already verified!') {
          toast.success(result.message, { id: 'verify' })
        } else {
          toast.success(result.message, { id: 'verify' })
        }
        
        // Reload the master data
        await handleLoadMasterData()
      } else {
        toast.error('Verification failed', { id: 'verify' })
      }
    } catch (error: any) {
      console.error('Verification error:', error)
      toast.error(error?.message || 'Verification failed', { id: 'verify' })
    }
  }

  // Load Master data on mount
  useEffect(() => {
    handleLoadMasterData()
  }, [])

  const handleExport = () => {
    try {
      if (masterData.length === 0) {
        toast.error('No data to export')
        return
      }

      const escape = (v: any) => {
        const s = String(v ?? '')
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return '"' + s.replace(/"/g, '""') + '"'
        }
        return s
      }

      const headers = [
        'Customer Name', 'Event Starts At', 'Membership Name', 'Instructors', 'Status',
        'Discount', 'Discount %', 'Verification Status', 'Invoice #', 'Amount',
        'Payment Date', 'Session Price', 'Coach Amount', 'BGM Amount', 'Management Amount', 'MFC Amount'
      ]

      const csv = [
        headers.join(','),
        ...masterData.map(r => [
          escape(r.customerName),
          escape(r.eventStartsAt),
          escape(r.membershipName),
          escape(r.instructors),
          escape(r.status),
          escape(r.discount),
          escape(r.discountPercentage),
          escape(r.verificationStatus),
          escape(r.invoiceNumber),
          escape(r.amount),
          escape(r.paymentDate),
          escape(r.sessionPrice),
          escape(r.coachAmount),
          escape(r.bgmAmount),
          escape(r.managementAmount),
          escape(r.mfcAmount)
        ].join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance_verification_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success(`Exported ${masterData.length} records`)
    } catch (e: any) {
      toast.error(e?.message || 'Export failed')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Verification Master Table</h1>
        <div className="flex items-center gap-2">
          <button 
            className="btn-primary"
            onClick={handleVerify}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Verify Payments'}
          </button>
          <button 
            className="btn-secondary"
            onClick={handleExport}
            disabled={masterData.length === 0}
          >
            Export CSV
          </button>
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
          <>
            {/* Verification Summary */}
            {verificationSummary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 dark:text-blue-400">Total Records</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{verificationSummary.totalRecords}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-sm text-green-600 dark:text-green-400">Verified</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{verificationSummary.verifiedRecords}</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="text-sm text-red-600 dark:text-red-400">Unverified</div>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100">{verificationSummary.unverifiedRecords}</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 dark:text-purple-400">Verification Rate</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{(verificationSummary.verificationRate || 0).toFixed(1)}%</div>
                </div>
              </div>
            )}
            
            {/* Master Table */}
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Master Table {masterData ? `(${masterData.length} records)` : ''}
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    className="input-field" 
                    placeholder="Filter..." 
                    value={filter} 
                    onChange={e => setFilter(e.target.value)} 
                  />
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
                <div className="overflow-x-auto">
                  <div className="max-h-[560px] overflow-y-auto">
                    <table className="min-w-[2000px] w-full table-fixed text-sm text-left">
                      <colgroup>
                        <col className="w-32" />
                        <col className="w-48" />
                        <col className="w-48" />
                        <col className="w-44" />
                        <col className="w-24" />
                        <col className="w-32" />
                        <col className="w-24" />
                        <col className="w-24" />
                        <col className="w-28" />
                        <col className="w-32" />
                        <col className="w-32" />
                        <col className="w-28" />
                        <col className="w-28" />
                        <col className="w-28" />
                        <col className="w-32" />
                        <col className="w-28" />
                      </colgroup>
                      <thead className="sticky top-0 z-10 bg-primary-50/80 dark:bg-slate-800/90 text-primary-800 dark:text-primary-200">
                        <tr>
                          {[ 
                            { key: 'customerName', label: 'Customer Name' },
                            { key: 'eventStartsAt', label: 'Event Starts At' },
                            { key: 'membershipName', label: 'Membership Name' },
                            { key: 'instructors', label: 'Instructors' },
                            { key: 'status', label: 'Status' },
                            { key: 'discount', label: 'Discount' },
                            { key: 'discountPercentage', label: 'Discount %' },
                            { key: 'verificationStatus', label: 'Verification Status' },
                            { key: 'invoiceNumber', label: 'Invoice #' },
                            { key: 'amount', label: 'Amount' },
                            { key: 'paymentDate', label: 'Payment Date' },
                            { key: 'sessionPrice', label: 'Session Price' },
                            { key: 'coachAmount', label: 'Coach Amount' },
                            { key: 'bgmAmount', label: 'BGM Amount' },
                            { key: 'managementAmount', label: 'Management Amount' },
                            { key: 'mfcAmount', label: 'MFC Amount' },
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
                        {masterData
                          .filter((r: any) => !filter || JSON.stringify(r).toLowerCase().includes(filter.toLowerCase()))
                          .sort((a: any, b: any) => {
                            const av = a[sortKey] ?? ''
                            const bv = b[sortKey] ?? ''
                            if (av < bv) return sortDir === 'asc' ? -1 : 1
                            if (av > bv) return sortDir === 'asc' ? 1 : -1
                            return 0
                          })
                          .map((r: any, idx: number) => (
                          <tr
                            key={idx}
                            className={`${r.verificationStatus === 'Verified' ? 'bg-primary-50/60 dark:bg-primary-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-800/60`}
                          >
                            <td className="px-3 py-2 border-b truncate" title={r.customerName}>{r.customerName}</td>
                            <td className="px-3 py-2 border-b whitespace-nowrap">{r.eventStartsAt}</td>
                            <td className="px-3 py-2 border-b truncate" title={r.membershipName}>{r.membershipName}</td>
                            <td className="px-3 py-2 border-b whitespace-nowrap truncate" title={r.instructors}>{r.instructors}</td>
                            <td className="px-3 py-2 border-b whitespace-nowrap">{r.status}</td>
                            <td className="px-3 py-2 border-b truncate" title={r.discount}>{r.discount}</td>
                            <td className="px-3 py-2 border-b whitespace-nowrap text-center">
                              {r.discountPercentage ? `${r.discountPercentage.toFixed(1)}%` : ''}
                            </td>
                            <td className="px-3 py-2 border-b whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                r.verificationStatus === 'Verified' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {r.verificationStatus}
                              </span>
                            </td>
                            <td className="px-3 py-2 border-b whitespace-nowrap">{r.invoiceNumber}</td>
                            <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.amount || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 border-b whitespace-nowrap">{r.paymentDate}</td>
                            <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.sessionPrice || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.coachAmount || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.bgmAmount || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.managementAmount || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 border-b whitespace-nowrap text-right">€{Number(r.mfcAmount || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                        {masterData.length === 0 && !loading && (
                          <tr><td className="px-3 py-4 text-gray-500" colSpan={16}>No verification data available. Click "Verify Payments" to process data.</td></tr>
                        )}
                        {loading && (
                          <tr><td className="px-3 py-4 text-gray-500" colSpan={16}>Loading verification data...</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab !== 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 p-4">This tab will be re-enabled shortly. Attendance Verification is available now.</div>
        )}
      </div>
    </div>
  )
}

export default PaymentCalculator
