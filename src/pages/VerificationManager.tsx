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
  verificationStatus: 'Verified' | 'Not Verified'
  invoiceNumber: string
  amount: number
  paymentDate: string
  sessionPrice: number
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

  const loadMaster = async () => {
    try {
      setLoading(true)
      const res = await apiService.getAttendanceVerificationMaster()
      if ((res as any).success) {
        setMasterData((res as any).data || [])
        setSummary((res as any).summary || null)
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
      const res = await apiService.verifyAttendanceData()
      if ((res as any).success) {
        if ((res as any).message?.includes('already verified')) {
          toast.success('Uploaded Data already verified!')
        } else {
          toast.success((res as any).message || 'Verification complete')
        }
        setMasterData((res as any).data || [])
        setSummary((res as any).summary || null)
      }
    } catch (e: any) {
      toast.error(e?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMaster()
  }, [])

  return (
    <div className="p-6 overflow-y-auto max-h-[calc(100vh-100px)]">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Verification Manager</h1>

      <div className="mb-4">
        <nav className="flex gap-2" aria-label="Tabs">
          {['Master Verification', 'Payment Verification', 'Verification Summary', 'Coaches Summary'].map((label, idx) => (
            <button
              key={label}
              onClick={() => setActiveTab(idx)}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === idx
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700'
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
              <button onClick={loadMaster} disabled={loading} className="px-3 py-2 rounded bg-gray-600 text-white disabled:opacity-50">Refresh</button>
              <button onClick={handleVerify} disabled={loading} className="px-3 py-2 rounded bg-primary-600 text-white disabled:opacity-50">Verify Payments</button>
            </div>
          </div>

          {summary && (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <span className="mr-4">Total: {summary.totalRecords}</span>
              <span className="mr-4">Verified: {summary.verifiedRecords}</span>
              <span className="mr-4">Unverified: {summary.unverifiedRecords}</span>
              <span>Rate: {summary.verificationRate?.toFixed?.(1)}%</span>
            </div>
          )}

          <div className="overflow-auto border border-gray-200 dark:border-gray-700 rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <tr>
                  {['Customer Name','Event Starts At','Membership Name','Instructors','Status','Discount','Discount %','Verification Status','Invoice #','Amount','Payment Date','Session Price','Coach Amount','BGM Amount','Management Amount','MFC Amount'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr key={idx} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-3 py-2 whitespace-nowrap">{r.customerName}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.eventStartsAt}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.membershipName}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.instructors}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.status}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.discount}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.discountPercentage}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.verificationStatus}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.invoiceNumber}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.amount}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.paymentDate}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.sessionPrice}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.coachAmount}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.bgmAmount}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.managementAmount}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.mfcAmount}</td>
                  </tr>
                ))}
                {loading && (
                  <tr><td className="px-3 py-4 text-gray-500" colSpan={16}>Loading...</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td className="px-3 py-4 text-gray-500" colSpan={16}>No data</td></tr>
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


