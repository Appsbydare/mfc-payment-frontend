import React, { useEffect, useMemo, useState } from 'react'
import apiService from '../services/api'
import toast from 'react-hot-toast'

type MasterRow = {
  customerName: string
  eventStartsAt: string
  membershipName: string
  instructors: string
  status: string
  discount: string
  discountPercentage: number
  verificationStatus: 'Verified' | 'Not Verified' | 'Package Cannot be found'
  invoiceNumber: string
  amount: number
  paymentDate: string
  packagePrice: number
  sessionPrice: number
  discountedSessionPrice: number
  coachAmount: number
  bgmAmount: number
  managementAmount: number
  mfcAmount: number
}

const VerificationManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [masterData, setMasterData] = useState<MasterRow[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState<string>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return masterData
    return masterData.filter(r =>
      r.customerName.toLowerCase().includes(q) ||
      r.membershipName.toLowerCase().includes(q) ||
      r.verificationStatus.toLowerCase().includes(q) ||
      (r.invoiceNumber || '').toLowerCase().includes(q)
    )
  }, [filter, masterData])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const out = [...filtered]
    out.sort((a: any, b: any) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const an = typeof av === 'number' ? av : parseFloat(av || 'NaN')
      const bn = typeof bv === 'number' ? bv : parseFloat(bv || 'NaN')
      if (!isNaN(an) && !isNaN(bn)) return sortDir === 'asc' ? an - bn : bn - an
      const as = String(av ?? '')
      const bs = String(bv ?? '')
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
    })
    return out
  }, [filtered, sortKey, sortDir])

  const handleSort = (key: keyof MasterRow) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key as string); setSortDir('asc') }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified': return 'bg-green-100 text-green-800'
      case 'Not Verified': return 'bg-red-100 text-red-800'
      case 'Package Cannot be found': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const loadMaster = async () => {
    try {
      setLoading(true)
      const res = await apiService.getAttendanceVerificationMaster()
      if ((res as any).success) {
        setMasterData((res as any).data || [])
        setSummary((res as any).summary || null)
        toast.success('Data loaded from Google Sheets')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load verification data')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    try {
      setLoading(true)
      
      // Step 1: Verify Payments
      toast.loading('Verifying payments...', { id: 'verify-payments' })
      console.log('🔍 Step 1: Starting payment verification...')
      const verifyRes = await apiService.verifyAttendanceData(true)
      if (!(verifyRes as any).success) {
        toast.error((verifyRes as any).message || 'Payment verification failed', { id: 'verify-payments' })
        return
      }
      console.log('✅ Step 1: Payment verification completed')
      toast.success('Payments verified successfully', { id: 'verify-payments' })
      
      // Step 2: Add Discounts
      toast.loading('Applying discounts...', { id: 'add-discounts' })
      console.log('🔍 Step 2: Starting discount application...')
      const discountRes = await apiService.addDiscounts()
      if (!(discountRes as any).success) {
        toast.error((discountRes as any).message || 'Discount application failed', { id: 'add-discounts' })
        return
      }
      console.log('✅ Step 2: Discount application completed')
      toast.success(`Discounts applied to ${(discountRes as any).summary?.discountAppliedCount || 0} records`, { id: 'add-discounts' })
      
      // Step 3: Recalculate Discounts
      toast.loading('Recalculating amounts...', { id: 'recalculate-discounts' })
      console.log('🔍 Step 3: Starting amount recalculation...')
      const recalcRes = await apiService.recalculateDiscounts()
      if (!(recalcRes as any).success) {
        toast.error((recalcRes as any).message || 'Amount recalculation failed', { id: 'recalculate-discounts' })
        return
      }
      console.log('✅ Step 3: Amount recalculation completed')
      toast.success(`Amounts recalculated for ${(recalcRes as any).summary?.recalculatedCount || 0} discounted records`, { id: 'recalculate-discounts' })
      
      // Update UI with final data
      const finalData = (recalcRes as any).data || []
      setMasterData(finalData)
      
      // Calculate summary from the actual data
      const calculatedSummary = {
        totalRecords: finalData.length,
        verifiedRecords: finalData.filter((r: any) => r.verificationStatus === 'Verified').length,
        unverifiedRecords: finalData.filter((r: any) => r.verificationStatus !== 'Verified').length,
        verificationRate: finalData.length > 0 ? (finalData.filter((r: any) => r.verificationStatus === 'Verified').length / finalData.length) * 100 : 0
      }
      setSummary(calculatedSummary)
      
      // Final success message
      toast.success('Complete verification process finished successfully!', { duration: 4000 })
      
    } catch (e: any) {
      console.error('❌ Verification process error:', e)
      toast.error(e?.message || 'Verification process failed')
    } finally {
      setLoading(false)
    }
  }


  const handleRewrite = async () => {
    try {
      setLoading(true)
      const res = await apiService.rewriteMasterSheet()
      if ((res as any).success) {
        toast.success('Master sheet rewritten with verified data')
        await loadMaster()
      }
    } catch (e: any) {
      toast.error(e?.message || 'Rewrite failed')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async () => {
    try {
      setLoading(true)
      toast.loading('Generating Excel report...', { id: 'export-report' })
      
      const res = await apiService.exportAttendanceVerification({ format: 'csv' })
      if ((res as any).success) {
        toast.success('Excel report downloaded successfully!', { id: 'export-report' })
      } else {
        toast.error((res as any).message || 'Export failed', { id: 'export-report' })
      }
    } catch (e: any) {
      console.error('❌ Export Error:', e)
      toast.error(e?.message || 'Export failed', { id: 'export-report' })
    } finally {
      setLoading(false)
    }
  }


  // Start with empty data - user must click Refresh to load
  useEffect(() => {
    // No auto-loading - start with empty table
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Verification Manager</h1>

      <div className="mb-4">
        <nav className="flex gap-2" aria-label="Tabs">
          {['Master Verification', 'Payment Verification', 'Verification Summary', 'Coaches Summary'].map((label, idx) => (
            <button
              key={label}
              onClick={() => setActiveTab(idx)}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === idx
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
              placeholder="Search by customer, membership, status, invoice..."
            />
            <div className="flex gap-2">
              <button onClick={handleVerify} disabled={loading} className="px-4 py-2 rounded bg-primary-600 text-white disabled:opacity-50 font-medium">
                {loading ? 'Processing...' : 'Verify Payments'}
              </button>
              <button onClick={handleExportReport} disabled={loading} className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50">Export Report</button>
              <button onClick={handleRewrite} disabled={loading} className="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-50">Rewrite Master</button>
            </div>
          </div>

          <div className="text-sm text-white bg-gray-800 p-3 rounded-lg">
            <span className="mr-4 font-medium">Total: {summary?.totalRecords || 0}</span>
            <span className="mr-4 text-green-400">Verified: {summary?.verifiedRecords || 0}</span>
            <span className="mr-4 text-red-400">Unverified: {summary?.unverifiedRecords || 0}</span>
            <span className="text-blue-400">Rate: {summary?.verificationRate?.toFixed?.(1) || '0.0'}%</span>
          </div>

          <div className="relative border border-gray-200 dark:border-gray-700 rounded max-h-[calc(100vh-260px)] overflow-x-auto overflow-y-auto">
            <table className="min-w-[1400px] text-sm">
              <thead className="sticky top-0 bg-gray-800 text-white z-10">
                <tr>
                  {['customerName','eventStartsAt','membershipName','instructors','status','discount','discountPercentage','verificationStatus','invoiceNumber','amount','paymentDate','packagePrice','sessionPrice','discountedSessionPrice','coachAmount','bgmAmount','managementAmount','mfcAmount'].map((key, idx) => (
                    <th key={key} onClick={() => handleSort(key as keyof MasterRow)} className="px-3 py-2 text-left font-semibold whitespace-nowrap cursor-pointer select-none text-white">
                      {['Customer Name','Event Starts At','Membership Name','Instructors','Status','Discount','Discount %','Verification Status','Invoice #','Amount','Payment Date','Package Price','Session Price','Discounted Session Price','Coach Amount','BGM Amount','Management Amount','MFC Amount'][idx]}
                      {sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, idx) => (
                  <tr key={idx} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-3 py-2 whitespace-nowrap text-white">{r.customerName}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-white">{r.eventStartsAt}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-white">{r.membershipName}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-white">{r.instructors}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-white">{r.status}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-white">{r.discount}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">{Number(r.discountPercentage || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(r.verificationStatus)}`}>
                        {r.verificationStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-white">{r.invoiceNumber}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">{Number(r.amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-white">{r.paymentDate}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">{Number(r.packagePrice || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">{Number(r.sessionPrice || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">{Number(r.discountedSessionPrice || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">{Number(r.coachAmount || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">{Number(r.bgmAmount || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">{Number(r.managementAmount || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">{Number(r.mfcAmount || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {loading && (
                  <tr><td className="px-3 py-4 text-gray-500" colSpan={18}>Loading...</td></tr>
                )}
                {!loading && sorted.length === 0 && (
                  <tr><td className="px-3 py-4 text-gray-500" colSpan={18}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">This section will be enabled next. Master Verification is available now.</div>
      )}
    </div>
  )
}

export default VerificationManager


