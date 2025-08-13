import React, { useState } from 'react'

const coachPayments = [
  { name: 'Alice Smith', classes: 23, students: 156, revenue: '€1,245.30', payment: '€541.70' },
  { name: 'Bob Johnson', classes: 18, students: 124, revenue: '€987.60', payment: '€429.50' },
  { name: 'Charlie Wilson', classes: 15, students: 98, revenue: '€756.40', payment: '€329.03' },
  { name: 'Diana Garcia', classes: 12, students: 87, revenue: '€634.20', payment: '€275.88' },
  { name: 'Eva Martinez', classes: 20, students: 145, revenue: '€1,123.80', payment: '€488.85' },
]
const bgmPayments = [
  { source: 'Group Classes', revenue: '€3,456.78', pct: '30%', payment: '€1,037.03' },
  { source: 'Private Sessions', revenue: '€1,598.40', pct: '15%', payment: '€239.76' },
  { source: 'Semi-Private', revenue: '€234.50', pct: '15%', payment: '€35.18' },
]
const managementPayments = [
  { source: 'Group Classes', revenue: '€3,456.78', pct: '8.5%', payment: '€293.83' },
  { source: 'Private Sessions', revenue: '€1,598.40', pct: '5%', payment: '€79.92' },
  { source: 'Other Revenue', revenue: '€234.50', pct: '0%', payment: '€0.00' },
]
const exceptions = [
  { customer: 'John Smith', issue: 'Free Session', original: '€15.00', override: '€0.00', reason: 'Promotional class', action: 'Approved' },
  { customer: 'Sarah Wilson', issue: 'Refund Applied', original: '€112.20', override: '€0.00', reason: 'Package refunded', action: 'Pending' },
  { customer: 'Mike Garcia', issue: 'Discount', original: '€89.50', override: '€67.13', reason: 'Student discount', action: 'Review' },
]

const tabs = [
  { label: 'Coach Payments' },
  { label: 'BGM Payments' },
  { label: 'Management Payments' },
  { label: 'Exceptions' },
]

const PaymentCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [processingMonth, setProcessingMonth] = useState(() => {
    const now = new Date()
    return now.toISOString().slice(0, 10)
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly Payment Calculator</h1>
        <p className="text-gray-600 dark:text-gray-400">Calculation Controls</p>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg text-gray-900 dark:text-white">Processing Month:</span>
          <input
            type="date"
            className="border rounded px-2 py-1 text-base"
            value={processingMonth}
            onChange={e => setProcessingMonth(e.target.value)}
            style={{ minWidth: 140 }}
          />
        </div>
        <div className="flex-1 flex justify-end gap-2">
          <button className="btn-primary">Calculate All Payments</button>
          <button className="btn-secondary">Export Results</button>
        </div>
      </div>
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
          <div>
            <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Coach Payment Summary</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Coach Name</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Classes Taught</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Total Students</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Gross Revenue</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Coach Payment</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {coachPayments.map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.name}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.classes}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.students}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.revenue}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.payment}</td>
                      <td className="px-3 py-2 border-b"><button className="btn-secondary">View Details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 1 && (
          <div>
            <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">BGM (Landlord) Payment Summary</h2>
            <div className="text-xl font-bold text-primary-700 dark:text-primary-300 mb-2">Total BGM Payment for May 2025: €1,276.89</div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Revenue Source</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Total Revenue</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">BGM Percentage</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">BGM Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {bgmPayments.map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.source}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.revenue}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.pct}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.payment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 2 && (
          <div>
            <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Management Payment Summary</h2>
            <div className="text-xl font-bold text-primary-700 dark:text-primary-300 mb-2">Total Management Payment for May 2025: €361.78</div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Revenue Source</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Total Revenue</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Management %</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Management Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {managementPayments.map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.source}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.revenue}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.pct}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.payment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 3 && (
          <div>
            <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Exceptions & Manual Overrides</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Customer</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Issue Type</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Original Amount</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Override Amount</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Reason</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions.map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.customer}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.issue}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.original}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.override}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.reason}</td>
                      <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentCalculator 