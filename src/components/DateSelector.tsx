import React from 'react'

interface DateSelectorProps {
  fromDate: string
  toDate: string
  onFromDateChange: (date: string) => void
  onToDateChange: (date: string) => void
}

const DateSelector: React.FC<DateSelectorProps> = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-gray-900 dark:text-white">From:</span>
        <input
          type="date"
          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={fromDate}
          onChange={e => onFromDateChange(e.target.value)}
          style={{ minWidth: 120 }}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-gray-900 dark:text-white">To:</span>
        <input
          type="date"
          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={toDate}
          onChange={e => onToDateChange(e.target.value)}
          style={{ minWidth: 120 }}
        />
      </div>
    </div>
  )
}

export default DateSelector
