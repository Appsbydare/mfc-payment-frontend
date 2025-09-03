import React, { useState } from 'react'
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
          <button className="btn-secondary">Export Results</button>
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
              <div className="text-gray-900 dark:text-gray-100">Group Revenue: €{Number(calcResult.revenue.groupRevenue || 0).toFixed(2)}</div>
              <div className="text-gray-900 dark:text-gray-100">Private Revenue: €{Number(calcResult.revenue.privateRevenue || 0).toFixed(2)}</div>
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
          <div className="text-gray-600 dark:text-gray-300 text-sm">BGM payments breakdown will appear here once rules are applied.</div>
        )}
        {activeTab === 2 && (
          <div className="text-gray-600 dark:text-gray-300 text-sm">Management payments breakdown will appear here once rules are applied.</div>
        )}
        {activeTab === 3 && (
          <div className="text-gray-600 dark:text-gray-300 text-sm">Exceptions and manual overrides will be listed here.</div>
        )}
      </div>
    </div>
  )
}

export default PaymentCalculator 