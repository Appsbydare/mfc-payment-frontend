import React, { useState } from 'react'
import Papa from 'papaparse'
import apiService from '../services/api'
import toast from 'react-hot-toast'

const attendanceColumns = [
  'Customer Name', 'Customer Email', 'Event Starts At', 'Offering Type Name', 'Venue Name', 'Instructors', 'Booking Method', 'Customer Membership ID', 'Membership ID', 'Membership Name', 'Booking Source', 'Status', 'Checkin Timestamp'
]
const paymentColumns = [
  'Date', 'Customer', 'Memo', 'Amount', 'Invoice'
]

interface ImportResults {
  attendance: {
    processed: number;
    duplicates: number;
    added: number;
    errors: string[];
  };
  payments: {
    processed: number;
    duplicates: number;
    added: number;
    errors: string[];
  };
}

const DataImport: React.FC = () => {
  // State for attendance data
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [attendanceFileName, setAttendanceFileName] = useState<string>('')
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null)
  
  // State for payment data
  const [paymentData, setPaymentData] = useState<any[]>([])
  const [paymentFileName, setPaymentFileName] = useState<string>('')
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  
  // Status and validation
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState<boolean>(false)
  const [importResults, setImportResults] = useState<ImportResults | null>(null)


  // File upload handlers
  const handleAttendanceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setAttendanceFileName(file.name)
    setAttendanceFile(file)
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => (header || '').replace(/^\uFEFF/, '').trim(),
      transform: (value: any) => (typeof value === 'string' ? value.trim() : value),
      complete: (results: any) => {
        setAttendanceData(results.data as any[])
        // no-op: status text removed; rely on Import Results box
      },
      error: () => {
        toast.error('Error parsing attendance file')
      }
    })
  }

  const handlePaymentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setPaymentFileName(file.name)
    setPaymentFile(file)
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => (header || '').replace(/^\uFEFF/, '').trim(),
      transform: (value: any) => (typeof value === 'string' ? value.trim() : value),
      complete: (results: any) => {
        setPaymentData(results.data as any[])
        // no-op: status text removed; rely on Import Results box
      },
      error: () => {
        toast.error('Error parsing payment file')
      }
    })
  }

  // Validation logic
  const validateData = () => {
    const errors: string[] = []
    
    // Check if files are selected
    if (!attendanceFile && !paymentFile) {
      errors.push('Please select at least one file to import')
    }
    
    // Attendance columns validation
    if (attendanceData.length > 0) {
      const cols = Object.keys(attendanceData[0])
      const requiredCols = ['Customer Name', 'Customer Email', 'Event Starts At', 'Offering Type Name', 'Venue Name']
      requiredCols.forEach(col => {
        if (!cols.includes(col)) errors.push(`Attendance: Missing required column "${col}"`)
      })
    }
    
    // Payment columns validation
    if (paymentData.length > 0) {
      const cols = Object.keys(paymentData[0])
      const requiredCols = ['Date', 'Customer', 'Memo', 'Amount', 'Invoice']
      requiredCols.forEach(col => {
        if (!cols.includes(col)) errors.push(`Payment: Missing required column "${col}"`)
      })
    }
    
    setValidationErrors(errors)
    
    if (errors.length === 0) {
      toast.success('Data validation successful!')
    } else {
      toast.error('Data validation failed')
    }
  }

  // Import logic
  const importData = async () => {
    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors first')
      return
    }

    if (!attendanceFile && !paymentFile) {
      toast.error('Please select at least one file to import')
      return
    }

    setIsImporting(true)

    try {
      const formData = new FormData()
      
      if (attendanceFile) {
        formData.append('attendanceFile', attendanceFile)
      }
      
      if (paymentFile) {
        formData.append('paymentFile', paymentFile)
      }

      const response = await apiService.importData(formData)
      
      if (response.success) {
        setImportResults(response.results)
        toast.success('Data imported successfully!')
        
        // Clear files after successful import
        setAttendanceFile(null)
        setPaymentFile(null)
        setAttendanceFileName('')
        setPaymentFileName('')
        setAttendanceData([])
        setPaymentData([])
        
      } else {
        throw new Error(response.message || 'Import failed')
      }
      
    } catch (error: any) {
      console.error('Import error:', error)
      toast.error(`Import failed: ${error.message}`)
    } finally {
      setIsImporting(false)
    }
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
            data.slice(0, 5).map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col} className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100">
                    {col === 'Amount' ? `€${parseFloat(row[col] || 0).toFixed(2)}` : (row[col] || '')}
                  </td>
                ))}
              </tr>
            ))
          )}
          {data.length > 5 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-2 text-center text-gray-500 text-xs">
                Showing first 5 of {data.length} records...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Import Manager</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Import attendance and payment data from CSV files to Google Sheets
        </p>
      </div>

      {/* Attendance Section */}
      <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-md">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Monthly Attendance Data (GoTeamUp Export)</h2>
        <div className="flex items-center gap-2 mb-2">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleAttendanceUpload} 
            onClick={(e) => { (e.currentTarget as HTMLInputElement).value = '' }}
            className="hidden" 
            id="attendance-upload" 
          />
          <label 
            htmlFor="attendance-upload" 
            className="btn-secondary cursor-pointer px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
          >
            Browse
          </label>
          <span className="text-gray-600 dark:text-gray-300 text-sm">
            {attendanceFileName || 'Select May Attendances.csv file...'}
          </span>
          {attendanceData.length > 0 && (
            <span className="text-green-600 dark:text-green-400 text-sm">
              ({attendanceData.length} records)
            </span>
          )}
        </div>
        {renderTable(attendanceColumns, attendanceData)}
      </div>

      {/* Payment Section */}
      <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-md">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Historical Payment Data (All Time)</h2>
        <div className="flex items-center gap-2 mb-2">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handlePaymentUpload} 
            onClick={(e) => { (e.currentTarget as HTMLInputElement).value = '' }}
            className="hidden" 
            id="payment-upload" 
          />
          <label 
            htmlFor="payment-upload" 
            className="btn-secondary cursor-pointer px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
          >
            Browse
          </label>
          <span className="text-gray-600 dark:text-gray-300 text-sm">
            {paymentFileName || 'Select Historical Payment Data.csv file...'}
          </span>
          {paymentData.length > 0 && (
            <span className="text-green-600 dark:text-green-400 text-sm">
              ({paymentData.length} records)
            </span>
          )}
        </div>
        {renderTable(paymentColumns, paymentData)}
      </div>

      {/* Import Results */}
      {importResults && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">Import Results</h3>
          <div className="space-y-2 text-sm">
            {importResults.attendance.processed > 0 && (
              <div>
                <strong>Attendance Data:</strong>
                <ul className="ml-4 text-green-700 dark:text-green-300">
                  <li>Processed: {importResults.attendance.processed} records</li>
                  <li>Added: {importResults.attendance.added} new records</li>
                  <li>Duplicates removed: {importResults.attendance.duplicates} records</li>
                </ul>
              </div>
            )}
            {importResults.payments.processed > 0 && (
              <div>
                <strong>Payment Data:</strong>
                <ul className="ml-4 text-green-700 dark:text-green-300">
                  <li>Processed: {importResults.payments.processed} records</li>
                  <li>Added: {importResults.payments.added} new records</li>
                  <li>Duplicates removed: {importResults.payments.duplicates} records</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions and Status */}
      <div className="flex flex-row gap-3 items-center">
        <button 
          className="btn-primary" 
          onClick={validateData}
          disabled={isImporting}
        >
          Validate Data
        </button>
        <button 
          className="btn-secondary" 
          onClick={importData}
          disabled={isImporting || validationErrors.length > 0}
        >
          {isImporting ? 'Importing...' : 'Import Data'}
        </button>
      </div>
      
      {validationErrors.length > 0 && (
        <div className="bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200 rounded p-3 mt-2">
          <h4 className="font-semibold mb-2">Validation Errors:</h4>
          <ul className="list-disc pl-5">
            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

export default DataImport 