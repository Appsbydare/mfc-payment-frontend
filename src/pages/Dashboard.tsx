import React, { useState } from 'react'
import { Users, DollarSign, UserCheck, AlertTriangle, CreditCard, Briefcase } from 'lucide-react'

const Dashboard: React.FC = () => {
  // Processing month state
  const [processingMonth, setProcessingMonth] = useState<string>(() => {
    const now = new Date()
    return now.toISOString().slice(0, 10)
  })

  // Stat cards data
  const stats = [
    {
      name: 'Total Attendances',
      value: '287',
      color: 'text-red-500',
      border: 'border-red-400',
      icon: Users,
      labelClass: 'text-2xl font-extrabold',
    },
    {
      name: 'Total Revenue',
      value: '€4,256.30',
      color: 'text-green-500',
      border: 'border-green-400',
      icon: DollarSign,
      labelClass: 'text-2xl font-extrabold',
    },
    {
      name: 'Coaches to Pay',
      value: '11',
      color: 'text-sky-500',
      border: 'border-sky-400',
      icon: UserCheck,
      labelClass: 'text-2xl font-extrabold',
    },
    {
      name: 'Pending Calculations',
      value: '23',
      color: 'text-yellow-500',
      border: 'border-yellow-400',
      icon: AlertTriangle,
      labelClass: 'text-2xl font-extrabold',
    },
    {
      name: 'BGM Payment',
      value: '€1,276.89',
      color: 'text-purple-500',
      border: 'border-purple-400',
      icon: CreditCard,
      labelClass: 'text-2xl font-extrabold',
    },
    {
      name: 'Management Pay',
      value: '€361.78',
      color: 'text-teal-500',
      border: 'border-teal-400',
      icon: Briefcase,
      labelClass: 'text-2xl font-extrabold',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Processing Month Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg text-gray-700 dark:text-gray-200">Current Processing Month</span>
          <input
            type="date"
            className="border rounded px-2 py-1 text-base"
            value={processingMonth}
            onChange={e => setProcessingMonth(e.target.value)}
            style={{ minWidth: 140 }}
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 p-6 flex flex-col items-center justify-center ${stat.border}`}
          >
            <div className="flex items-center mb-2">
              <stat.icon className={`h-10 w-10 mr-3 ${stat.color}`} />
              <span className="text-xl font-bold text-gray-700 dark:text-gray-200">{stat.name}</span>
            </div>
            <div className={`${stat.labelClass} ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full btn-primary">
              Import Monthly Data
            </button>
            <button className="w-full btn-secondary">
              Calculate Payments
            </button>
            <button className="w-full btn-secondary">
              Generate Reports
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              May attendance data imported (608 records)
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Payment rules updated for "Adult 10 Pack"
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              Historical payment data refreshed (667 records)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 