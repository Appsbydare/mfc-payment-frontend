import React, { useState } from 'react'
import { apiService } from '../services/api'

const coaches = ['All Coaches', 'Alice Smith', 'Bob Johnson', 'Charlie Wilson', 'Diana Garcia', 'Eva Martinez']
const reportHistory = [
  { date: '2025-06-05 14:30', type: 'Monthly Summary', period: 'May 2025', status: 'Completed', action: 'Download' },
  { date: '2025-06-05 14:25', type: 'Coach Payslips', period: 'May 2025', status: 'Completed', action: 'Download' },
  { date: '2025-06-05 14:20', type: 'BGM Report', period: 'May 2025', status: 'Completed', action: 'Download' },
  { date: '2025-05-01 16:45', type: 'Monthly Summary', period: 'April 2025', status: 'Completed', action: 'Download' },
  { date: '2025-05-01 16:40', type: 'All Payslips', period: 'April 2025', status: 'Completed', action: 'Download' },
]

const Reports: React.FC = () => {
  const [selectedCoach, setSelectedCoach] = useState('All Coaches')
  const [exportFormat, setExportFormat] = useState('PDF')
  const [saveToLocal, setSaveToLocal] = useState(true)
  const [status, setStatus] = useState('Ready to generate reports.')

  // Generate report via backend
  const handleGenerate = async (type: string) => {
    try {
      setStatus(`Generating ${type}...`)
      const now = new Date()
      const filters = {
        month: now.getUTCMonth() + 1,
        year: now.getUTCFullYear(),
      }
      const res = await apiService.generateReport(type, filters)
      if ((res as any).success !== false) {
        setStatus(`${type} generated successfully!`)
      } else {
        setStatus(`Failed to generate ${type}`)
      }
    } catch (e: any) {
      setStatus(`Error: ${e?.message || 'Failed to generate report'}`)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Payslip Generation</h1>
      </div>
      {/* Report Generation Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Summary & BGM */}
        <div className="space-y-4">
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-md">
            <div className="font-semibold mb-2">Monthly Summary Report</div>
            <div className="mb-2 text-gray-700 dark:text-gray-300">Generate comprehensive monthly payment summary for all parties</div>
            <button className="btn-primary w-full" onClick={() => handleGenerate('Monthly Summary Report')}>Generate Monthly Summary</button>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-md">
            <div className="font-semibold mb-2">BGM (Landlord) Report</div>
            <div className="mb-2 text-gray-700 dark:text-gray-300">Generate detailed landlord payment report with breakdown</div>
            <button className="btn-primary w-full" onClick={() => handleGenerate('BGM Report')}>Generate BGM Report</button>
          </div>
        </div>
        {/* Individual Payslips & Management */}
        <div className="space-y-4">
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-md">
            <div className="font-semibold mb-2">Individual Payslips</div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-gray-700 dark:text-gray-300">Select Coach:</label>
              <select className="input-field" value={selectedCoach} onChange={e => setSelectedCoach(e.target.value)}>
                {coaches.map(coach => <option key={coach} value={coach}>{coach}</option>)}
              </select>
            </div>
            <button className="btn-primary w-full" onClick={() => handleGenerate('Payslips')}>Generate Payslips</button>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-md">
            <div className="font-semibold mb-2">Management Report</div>
            <div className="mb-2 text-gray-700 dark:text-gray-300">Generate management team payment summary</div>
            <button className="btn-primary w-full" onClick={() => handleGenerate('Management Report')}>Generate Management Report</button>
          </div>
        </div>
      </div>
      {/* Status/Message Area */}
      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">{status}</div>
      {/* Report History Table */}
      <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-md">
        <div className="font-semibold mb-2">Report History</div>
        <div className="overflow-x-auto rounded-lg">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr>
                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Date Generated</th>
                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Report Type</th>
                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Period</th>
                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Status</th>
                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportHistory.map((row, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.date}</td>
                  <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.type}</td>
                  <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.period}</td>
                  <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{row.status}</td>
                  <td className="px-3 py-2 border-b"><button className="btn-secondary">{row.action}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Export Options */}
      <div className="flex flex-row items-center gap-4 mt-2">
        <div className="flex items-center gap-2">
          <label className="text-gray-700 dark:text-gray-300">Export Format:</label>
          <select className="input-field" value={exportFormat} onChange={e => setExportFormat(e.target.value)}>
            <option value="PDF">PDF</option>
            <option value="CSV">CSV</option>
            <option value="XLSX">Excel</option>
          </select>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={saveToLocal} onChange={e => setSaveToLocal(e.target.checked)} />
          <span className="text-gray-700 dark:text-gray-300">Save to local folder</span>
        </label>
      </div>
    </div>
  )
}

export default Reports 