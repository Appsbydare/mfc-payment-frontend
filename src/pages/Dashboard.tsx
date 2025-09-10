import React, { useEffect, useMemo, useState } from 'react'
import { Users, DollarSign, UserCheck, CreditCard, Briefcase } from 'lucide-react'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'
import DateSelector from '../components/DateSelector'

const Dashboard: React.FC = () => {
  // Date range (defaults: From = first day of current year, To = today)
  const [fromDate, setFromDate] = useState<string>(() => {
    const now = new Date()
    const first = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)) // First day of current year
    return first.toISOString().slice(0, 10)
  })
  const [toDate, setToDate] = useState<string>(() => {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10)
  })
  const [calcResult, setCalcResult] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const euro = (n: number) => `€${Number(n || 0).toFixed(2)}`

  // Fetch calculation summary for the selected range
  const fetchSummary = async () => {
    try {
      setIsLoading(true)
      const res = await apiService.calculatePayments({ fromDate, toDate })
      if (res.success) {
        setCalcResult(res)
      } else {
        toast.error('Failed to load dashboard summary')
      }
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

  // Stat cards data derived from calculation result (using verified data calculations)
  const stats = useMemo(() => {
    const attendanceTotal = calcResult?.counts?.attendanceTotal ?? 0 // Verified attendance only
    const attendanceRaw = calcResult?.counts?.attendanceTotalRaw ?? 0 // Raw attendance count
    const totalRevenue = calcResult?.revenue?.totalPayments ?? 0 // Verified revenue (excludes fees)
    const bgmPayment = (calcResult?.splits?.group?.bgm ?? 0) + (calcResult?.splits?.private?.landlord ?? 0)
    const managementPayment = (calcResult?.splits?.group?.management ?? 0) + (calcResult?.splits?.private?.management ?? 0)
    const coachesCount = calcResult?.coachBreakdown?.length ?? 0
    const verificationRate = attendanceRaw > 0 ? ((attendanceTotal / attendanceRaw) * 100).toFixed(1) : '0'
    const totalCoachPayments = calcResult?.coachBreakdown?.reduce((sum: number, coach: any) => sum + (coach.totalPayment || 0), 0) ?? 0
    
    return [
      {
        name: 'Verified Attendances',
        value: String(attendanceTotal),
        subtitle: `${verificationRate}% of ${attendanceRaw} total`,
        color: 'text-green-500',
        border: 'border-green-400',
        icon: Users,
        labelClass: 'text-4xl',
      },
      {
        name: 'Verified Revenue',
        value: euro(totalRevenue),
        subtitle: 'Excludes fees & full discounts',
        color: 'text-blue-500',
        border: 'border-blue-400',
        icon: DollarSign,
        labelClass: 'text-4xl',
      },
      {
        name: 'Total Coach Payments',
        value: euro(totalCoachPayments),
        subtitle: `${coachesCount} active coaches`,
        color: 'text-sky-500',
        border: 'border-sky-400',
        icon: UserCheck,
        labelClass: 'text-4xl',
      },
      {
        name: 'Private Sessions',
        value: String(calcResult?.counts?.privateSessions ?? 0),
        subtitle: 'Verified private sessions',
        color: 'text-orange-500',
        border: 'border-orange-400',
        icon: Users,
        labelClass: 'text-4xl',
      },
      {
        name: 'BGM Payment',
        value: euro(bgmPayment),
        subtitle: 'Landlord share (30% + 15%)',
        color: 'text-purple-500',
        border: 'border-purple-400',
        icon: CreditCard,
        labelClass: 'text-4xl',
      },
      {
        name: 'Management Pay',
        value: euro(managementPayment),
        subtitle: 'Management share (8.5%)',
        color: 'text-teal-500',
        border: 'border-teal-400',
        icon: Briefcase,
        labelClass: 'text-4xl',
      },
    ]
  }, [calcResult])

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