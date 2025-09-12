import React, { useEffect, useMemo, useState } from 'react'
import { Users, DollarSign, UserCheck, CreditCard, Briefcase } from 'lucide-react'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'
import DateSelector from '../components/DateSelector'

const Dashboard: React.FC = () => {
  // Date range (defaults: From = 12 months ago, To = today)
  const [fromDate, setFromDate] = useState<string>(() => {
    const now = new Date()
    const twelveMonthsAgo = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()))
    return twelveMonthsAgo.toISOString().slice(0, 10)
  })
  const [toDate, setToDate] = useState<string>(() => {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10)
  })
  const [summary, setSummary] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const euro = (n: number) => `€${Number(n || 0).toFixed(2)}`

  // Fetch verification summary for the selected range
  const fetchSummary = async () => {
    try {
      setIsLoading(true)
      const res = await apiService.getVerificationSummary({ fromDate, toDate })
      if (res.success) setSummary(res.summary)
      else toast.error('Failed to load dashboard summary')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load dashboard summary')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate])

  // Stat cards derived from verification summary
  const stats = useMemo(() => {
    const attendanceVerified = summary?.verifiedAttendanceRecords ?? summary?.verifiedRecords ?? 0
    const attendanceTotal = summary?.totalAttendanceRecords ?? summary?.totalRecords ?? 0
    const pendingVerifications = Math.max(0, attendanceTotal - attendanceVerified)
    const verificationRate = attendanceTotal > 0 ? ((attendanceVerified / attendanceTotal) * 100).toFixed(1) : '0'
    const totalVerifiedAmount = summary?.totalVerifiedAmount ?? 0
    
    return [
      {
        name: 'Verified Attendances',
        value: String(attendanceVerified),
        subtitle: `${verificationRate}% of ${attendanceTotal} total`,
        color: 'text-green-500',
        border: 'border-green-400',
        icon: Users,
        labelClass: 'text-4xl',
      },
      {
        name: 'Verified Revenue',
        value: euro(totalVerifiedAmount),
        subtitle: 'Verified payments total',
        color: 'text-blue-500',
        border: 'border-blue-400',
        icon: DollarSign,
        labelClass: 'text-4xl',
      },
      {
        name: 'Total Coach Payments',
        value: euro(summary?.totalFuturePaymentsMFC ?? 0),
        subtitle: 'Future MFC (unverified)',
        color: 'text-sky-500',
        border: 'border-sky-400',
        icon: UserCheck,
        labelClass: 'text-4xl',
      },
      {
        name: 'Private Sessions',
        value: String(pendingVerifications),
        subtitle: 'Pending verifications',
        color: 'text-orange-500',
        border: 'border-orange-400',
        icon: Users,
        labelClass: 'text-4xl',
      },
      {
        name: 'BGM Payment',
        value: euro(summary?.totalTaxAmount ?? 0),
        subtitle: 'Tax total',
        color: 'text-purple-500',
        border: 'border-purple-400',
        icon: CreditCard,
        labelClass: 'text-4xl',
      },
      {
        name: 'Management Pay',
        value: euro(summary?.totalDiscountedAmount ?? 0),
        subtitle: 'Discounted total',
        color: 'text-teal-500',
        border: 'border-teal-400',
        icon: Briefcase,
        labelClass: 'text-4xl',
      },
    ]
  }, [summary])

  return (
    <div className="space-y-4">
      {/* Page title + date controls */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex items-center gap-4">
          <DateSelector
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
          />
          <button className="btn-secondary" onClick={fetchSummary} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
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