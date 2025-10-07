import React from 'react'
import { Users, DollarSign, UserCheck, CreditCard, Briefcase } from 'lucide-react'

const Dashboard: React.FC = () => {
  const euro = (n: number) => `€${Number(n || 0).toFixed(2)}`

  // Static stat cards - no dynamic data fetching
  const stats = [
    {
      name: 'Verified Attendances',
      value: '0',
      subtitle: '0% of 0 total',
      color: 'text-green-500',
      border: 'border-green-400',
      icon: Users,
      labelClass: 'text-4xl',
    },
    {
      name: 'Verified Revenue',
      value: euro(0),
      subtitle: 'Verified payments total',
      color: 'text-blue-500',
      border: 'border-blue-400',
      icon: DollarSign,
      labelClass: 'text-4xl',
    },
    {
      name: 'Total Coach Payments',
      value: euro(0),
      subtitle: 'Future MFC (unverified)',
      color: 'text-sky-500',
      border: 'border-sky-400',
      icon: UserCheck,
      labelClass: 'text-4xl',
    },
    {
      name: 'Private Sessions',
      value: '0',
      subtitle: 'Pending verifications',
      color: 'text-orange-500',
      border: 'border-orange-400',
      icon: Users,
      labelClass: 'text-4xl',
    },
    {
      name: 'BGM Payment',
      value: euro(0),
      subtitle: 'Tax total',
      color: 'text-purple-500',
      border: 'border-purple-400',
      icon: CreditCard,
      labelClass: 'text-4xl',
    },
    {
      name: 'Management Pay',
      value: euro(0),
      subtitle: 'Discounted total',
      color: 'text-teal-500',
      border: 'border-teal-400',
      icon: Briefcase,
      labelClass: 'text-4xl',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Dashboard updating mechanism removed - awaiting new implementation
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
            <div className={`${stat.labelClass} ${stat.color}`} style={{ fontFamily: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif', fontWeight: 400 }}>{stat.value}</div>
            {stat.subtitle && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                {stat.subtitle}
              </div>
            )}
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