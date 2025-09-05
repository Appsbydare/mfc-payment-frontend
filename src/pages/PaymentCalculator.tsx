import React, { useMemo, useState } from 'react'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'

const tabs = [
  { label: 'Coach Payments' },
  { label: 'BGM Payments' },
  { label: 'Management Payments' },
  { label: 'Exceptions' },
]

const PaymentCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [calcResult, setCalcResult] = useState<any | null>(null)
  const [verifyResult, setVerifyResult] = useState<{ rows: any[]; summary: any } | null>(null)
  const [sortKey, setSortKey] = useState<string>('Date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filter, setFilter] = useState<string>('')

  const handleCalculate = async () => {
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
      const res = await apiService.calculatePayments(payload)
      if (res.success) {
        setCalcResult(res)
        toast.success('Calculation completed')
      } else {
        toast.error('Calculation failed')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Calculation failed')
    }
  }

  const handleVerify = async () => {
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
      const res = await apiService.verifyPayments(payload)
      if (res.success) {
        setVerifyResult({ rows: res.rows || [], summary: res.summary || {} })
        toast.success('Verification complete')
      } else {
        toast.error('Verification failed')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Verification failed')
    }
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
      if (!calcResult || !Array.isArray(calcResult.coachBreakdown)) {
        toast.error('Nothing to export')
        return
      }
      const rows = calcResult.coachBreakdown as any[]
      const headers = [
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
        'MfcRetained',
      ]
      const escape = (v: any) => {
        const s = String(v ?? '')
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return '"' + s.replace(/"/g, '""') + '"'
        }
        return s
      }
      const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => escape((r as any)[h.charAt(0).toLowerCase() + h.slice(1)] ?? '')).join(',')),
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payment_summary_${calcResult.calcId || 'latest'}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error(e?.message || 'Export failed')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly Payment Calculator</h1>
        <p className="text-gray-600 dark:text-gray-400">Calculation Controls</p>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg text-gray-900 dark:text-white">From:</span>
          <input
            type="date"
            className="border rounded px-2 py-1 text-base"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            style={{ minWidth: 140 }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg text-gray-900 dark:text-white">To:</span>
          <input
            type="date"
            className="border rounded px-2 py-1 text-base"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            style={{ minWidth: 140 }}
          />
        </div>
        <div className="flex-1 flex justify-end gap-2">
          <button className="btn-primary" onClick={handleCalculate}>Calculate All Payments</button>
          <button className="btn-secondary" onClick={handleVerify}>Verify Payments</button>
          <button className="btn-secondary" onClick={handleExport}>Export Results</button>
        </div>
      </div>
      {/* Verification Table */}
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
              <table className="min-w-[1100px] w-full table-fixed text-sm text-left">
                <colgroup>
                  <col className="w-28" />
                  <col className="w-48" />
                  <col className="w-[360px]" />
                  <col className="w-[240px]" />
                  <col className="w-44" />
                  <col className="w-24" />
                  <col className="w-32" />
                  <col className="w-28" />
                  <col className="w-32" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-primary-50/90 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200">
                  <tr>
                    {['Date','Customer','Membership','ClassType','Instructors','Verified','Category','UnitPrice','EffectiveAmount','CoachAmount','BgmAmount','ManagementAmount','MfcAmount','Invoice','PaymentDate'].map(h => (
                      <th
                        key={h}
                        onClick={() => { setSortKey(h); setSortDir(d => d==='asc'?'desc':'asc') }}
                        className="cursor-pointer select-none px-3 py-2 font-semibold border-b border-primary-200 dark:border-primary-700"
                      >
                        {h}{sortKey===h? (sortDir==='asc'?' ▲':' ▼'):''}
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
                      <td className="px-3 py-2 border-b whitespace-nowrap">{r.Verified ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2 border-b truncate" title={r.Category}>{r.Category}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap">€{Number(r.UnitPrice || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap">€{Number(r.EffectiveAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap">€{Number(r.CoachAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap">€{Number(r.BgmAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap">€{Number(r.ManagementAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap">€{Number(r.MfcAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap">{r.Invoice || ''}</td>
                      <td className="px-3 py-2 border-b whitespace-nowrap">{r.PaymentDate || ''}</td>
                    </tr>
                  ))}
                  {!verifyResult && (
                    <tr><td className="px-3 py-4 text-gray-500" colSpan={15}>Click Verify Payments to load rows.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {calcResult && (
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-md">
          <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Calculation Summary</h2>
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
          {/* Splits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
            <div className="p-3 rounded border border-gray-200 dark:border-gray-700">
              <div className="font-semibold text-gray-700 dark:text-gray-200">Group Splits</div>
              <div className="text-gray-900 dark:text-gray-100">Revenue: €{Number(calcResult.splits.group.revenue || 0).toFixed(2)}</div>
              <div className="text-gray-900 dark:text-gray-100">Coach: €{Number(calcResult.splits.group.coach || 0).toFixed(2)} ({calcResult.splits.group.percentage.coach}%)</div>
              <div className="text-gray-900 dark:text-gray-100">BGM: €{Number(calcResult.splits.group.bgm || 0).toFixed(2)} ({calcResult.splits.group.percentage.bgm}%)</div>
              <div className="text-gray-900 dark:text-gray-100">Management: €{Number(calcResult.splits.group.management || 0).toFixed(2)} ({calcResult.splits.group.percentage.management}%)</div>
              <div className="text-gray-900 dark:text-gray-100">MFC: €{Number(calcResult.splits.group.mfc || 0).toFixed(2)} ({calcResult.splits.group.percentage.mfc}%)</div>
            </div>
            <div className="p-3 rounded border border-gray-200 dark:border-gray-700">
              <div className="font-semibold text-gray-700 dark:text-gray-200">Private Splits</div>
              <div className="text-gray-900 dark:text-gray-100">Revenue: €{Number(calcResult.splits.private.revenue || 0).toFixed(2)}</div>
              <div className="text-gray-900 dark:text-gray-100">Coach: €{Number(calcResult.splits.private.coach || 0).toFixed(2)} ({calcResult.splits.private.percentage.coach}%)</div>
              <div className="text-gray-900 dark:text-gray-100">Landlord: €{Number(calcResult.splits.private.landlord || 0).toFixed(2)} ({calcResult.splits.private.percentage.landlord}%)</div>
              <div className="text-gray-900 dark:text-gray-100">Management: €{Number(calcResult.splits.private.management || 0).toFixed(2)} ({calcResult.splits.private.percentage.management}%)</div>
              <div className="text-gray-900 dark:text-gray-100">MFC: €{Number(calcResult.splits.private.mfc || 0).toFixed(2)} ({calcResult.splits.private.percentage.mfc}%)</div>
            </div>
          </div>
        </div>
      )}
      {/* Tabs */}
      <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-md">
        <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === i ? 'border-primary-600 text-primary-700 dark:text-primary-300' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-primary-600'}`}
              onClick={() => setActiveTab(i)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Tab Content */}
        {activeTab === 0 && (
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
        {activeTab === 1 && (
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
        {activeTab === 2 && (
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
        {activeTab === 3 && (
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
    </div>
  )
}

export default PaymentCalculator 