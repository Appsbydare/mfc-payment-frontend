import React, { useState } from 'react'
import Papa from 'papaparse'

const attendanceColumns = [
  'Customer', 'Email', 'Date', 'Time', 'Class Type', 'Venue', 'Instructors', 'Booking Method', 'Membership', 'Booking Source', 'Status'
]
const paymentColumns = [
  'Date', 'Customer', 'Memo', 'Amount', 'Invoice'
]

const DataImport: React.FC = () => {
  // State for attendance data
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [attendanceFileName, setAttendanceFileName] = useState<string>('')
  // State for payment data
  const [paymentData, setPaymentData] = useState<any[]>([])
  const [paymentFileName, setPaymentFileName] = useState<string>('')
  // Status and validation
  const [status, setStatus] = useState<string>('Ready to import data. Please select files and click Validate Data.')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // File upload handlers
  const handleAttendanceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttendanceFileName(file.name)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        setAttendanceData(results.data as any[])
      },
      error: () => setStatus('Error parsing attendance file.')
    })
  }
  const handlePaymentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPaymentFileName(file.name)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        setPaymentData(results.data as any[])
      },
      error: () => setStatus('Error parsing payment file.')
    })
  }

  // Validation logic
  const validateData = () => {
    const errors: string[] = []
    // Attendance columns
    if (attendanceData.length > 0) {
      const cols = Object.keys(attendanceData[0])
      attendanceColumns.forEach(col => {
        if (!cols.includes(col)) errors.push(`Attendance: Missing column "${col}"`)
      })
    }
    // Payment columns
    if (paymentData.length > 0) {
      const cols = Object.keys(paymentData[0])
      paymentColumns.forEach(col => {
        if (!cols.includes(col)) errors.push(`Payment: Missing column "${col}"`)
      })
    }
    setValidationErrors(errors)
    setStatus(errors.length === 0 ? 'Validation successful! Ready to import.' : 'Validation failed. See errors below.')
  }

  // Import logic (mocked)
  const importData = () => {
    if (validationErrors.length > 0) {
      setStatus('Cannot import: Please fix validation errors first.')
      return
    }
    setStatus('Importing data... (mocked)')
    setTimeout(() => setStatus('Data imported successfully!'), 1200)
  }

  // Table render helper
  const renderTable = (columns: string[], data: any[]) => (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md">
      <table className="min-w-full text-sm text-left">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col} className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-3 py-2 text-center text-gray-400">No data</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col} className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100">{row[col] || ''}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Import Manager</h1>
      </div>

      {/* Attendance Section */}
      <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-md">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Monthly Attendance Data (GoTeamUp Export)</h2>
        <div className="flex items-center gap-2 mb-2">
          <input type="file" accept=".csv" onChange={handleAttendanceUpload} className="hidden" id="attendance-upload" />
          <label htmlFor="attendance-upload" className="btn-secondary cursor-pointer px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200">Browse</label>
          <span className="text-gray-600 dark:text-gray-300 text-sm">{attendanceFileName || 'Select May Attendances.csv file...'}</span>
        </div>
        {renderTable(attendanceColumns, attendanceData)}
      </div>

      {/* Payment Section */}
      <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-md">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Historical Payment Data (All Time)</h2>
        <div className="flex items-center gap-2 mb-2">
          <input type="file" accept=".csv" onChange={handlePaymentUpload} className="hidden" id="payment-upload" />
          <label htmlFor="payment-upload" className="btn-secondary cursor-pointer px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200">Browse</label>
          <span className="text-gray-600 dark:text-gray-300 text-sm">{paymentFileName || 'Select Historical Payment Data.csv file...'}</span>
        </div>
        {renderTable(paymentColumns, paymentData)}
      </div>

      {/* Actions and Status */}
      <div className="flex flex-row gap-3">
        <button className="btn-primary" onClick={validateData}>Validate Data</button>
        <button className="btn-secondary" onClick={importData}>Import Data</button>
        <span className="ml-4 text-gray-600 dark:text-gray-300 text-sm flex-1">{status}</span>
      </div>
      {validationErrors.length > 0 && (
        <div className="bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200 rounded p-3 mt-2">
          <ul className="list-disc pl-5">
            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

export default DataImport 