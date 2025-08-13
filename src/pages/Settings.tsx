import React, { useState } from 'react'

const initialCoaches = [
  { name: 'Alice Smith', email: 'alice@mfc.com', rate: 45, active: true },
  { name: 'Bob Johnson', email: 'bob@mfc.com', rate: 40, active: true },
  { name: 'Charlie Wilson', email: 'charlie@mfc.com', rate: 42, active: true },
  { name: 'Diana Garcia', email: 'diana@mfc.com', rate: 38, active: true },
  { name: 'Eva Martinez', email: 'eva@mfc.com', rate: 41, active: true },
]

const Settings: React.FC = () => {
  const [tab, setTab] = useState(0)
  // Coaches state
  const [coaches, setCoaches] = useState(initialCoaches)
  const [coachForm, setCoachForm] = useState({ name: '', email: '', rate: '', active: true })
  const [editIndex, setEditIndex] = useState<number | null>(null)
  // General settings state
  const [splits, setSplits] = useState({ coach: 43.5, bgm: 30, mgmt: 8.5, mfc: 18 })
  const [fixedRate, setFixedRate] = useState(false)
  const [defaultSessionPrice, setDefaultSessionPrice] = useState(10)
  // Database state
  const [dbStatus] = useState('OK (mock)')
  const [backupStatus, setBackupStatus] = useState('No recent backup')

  // Handlers for coaches
  const handleCoachInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setCoachForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }
  const handleAddCoach = () => {
    if (!coachForm.name || !coachForm.email || !coachForm.rate) return
    setCoaches([...coaches, { ...coachForm, rate: parseFloat(coachForm.rate) }])
    setCoachForm({ name: '', email: '', rate: '', active: true })
  }
  const handleEditCoach = (i: number) => {
    setEditIndex(i)
    setCoachForm({ ...coaches[i], rate: coaches[i].rate.toString() })
  }
  const handleSaveCoach = () => {
    if (editIndex === null) return
    const updated = [...coaches]
    updated[editIndex] = { ...coachForm, rate: parseFloat(coachForm.rate) }
    setCoaches(updated)
    setEditIndex(null)
    setCoachForm({ name: '', email: '', rate: '', active: true })
  }
  const handleCancelEdit = () => {
    setEditIndex(null)
    setCoachForm({ name: '', email: '', rate: '', active: true })
  }

  // Handlers for general settings
  const handleSplits = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSplits(s => ({ ...s, [name]: parseFloat(value) }))
  }

  // Handlers for database
  const handleBackup = () => {
    setBackupStatus('Backup completed (mock)')
  }
  const handleRestore = () => {
    setBackupStatus('Restore completed (mock)')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
      </div>
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        {['Coaches', 'General', 'Database'].map((label, i) => (
          <button
            key={label}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${tab === i ? 'border-primary-600 text-primary-700 dark:text-primary-300' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-primary-600'}`}
            onClick={() => setTab(i)}
          >
            {label}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      {tab === 0 && (
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-md">
          <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Coach Management</h2>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Full Name</label>
              <input name="name" value={coachForm.name} onChange={handleCoachInput} className="input-field" />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Email</label>
              <input name="email" value={coachForm.email} onChange={handleCoachInput} className="input-field" type="email" />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Hourly Rate</label>
              <input name="rate" value={coachForm.rate} onChange={handleCoachInput} className="input-field" type="number" min="0" step="0.01" />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <label className="text-gray-700 dark:text-gray-200">Active</label>
              <input name="active" type="checkbox" checked={coachForm.active} onChange={handleCoachInput} />
            </div>
            {editIndex === null ? (
              <button className="btn-primary h-10" onClick={handleAddCoach}>Add Coach</button>
            ) : (
              <div className="flex gap-2">
                <button className="btn-primary h-10" onClick={handleSaveCoach}>Save</button>
                <button className="btn-secondary h-10" onClick={handleCancelEdit}>Cancel</button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Coach Name</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Email</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Hourly Rate</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Status</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coaches.map((c, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{c.name}</td>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{c.email}</td>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">€{c.rate.toFixed(2)}</td>
                    <td className="px-3 py-2 border-b text-gray-900 dark:text-gray-100">{c.active ? 'Active' : 'Inactive'}</td>
                    <td className="px-3 py-2 border-b"><button className="btn-secondary" onClick={() => handleEditCoach(i)}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab === 1 && (
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-md">
          <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">General Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Default Payment Split Percentages</label>
              <div className="flex gap-2 mb-2">
                <input name="coach" value={splits.coach} onChange={handleSplits} className="input-field w-20" type="number" min="0" max="100" step="0.01" />
                <span className="text-gray-700 dark:text-gray-200">Coach %</span>
                <input name="bgm" value={splits.bgm} onChange={handleSplits} className="input-field w-20" type="number" min="0" max="100" step="0.01" />
                <span className="text-gray-700 dark:text-gray-200">BGM %</span>
              </div>
              <div className="flex gap-2 mb-2">
                <input name="mgmt" value={splits.mgmt} onChange={handleSplits} className="input-field w-20" type="number" min="0" max="100" step="0.01" />
                <span className="text-gray-700 dark:text-gray-200">Management %</span>
                <input name="mfc" value={splits.mfc} onChange={handleSplits} className="input-field w-20" type="number" min="0" max="100" step="0.01" />
                <span className="text-gray-700 dark:text-gray-200">MFC Retained %</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Default Price Per Session</label>
              <input value={defaultSessionPrice} onChange={e => setDefaultSessionPrice(Number(e.target.value))} className="input-field w-32" type="number" min="0" step="0.01" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={fixedRate} onChange={e => setFixedRate(e.target.checked)} />
              <span className="text-gray-700 dark:text-gray-200">Use fixed rate for unlimited plans</span>
            </div>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Other global settings and preferences can be added here as needed.</div>
        </div>
      )}
      {tab === 2 && (
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-md">
          <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Database Settings</h2>
          <div className="mb-4 flex flex-col md:flex-row gap-4">
            <div>
              <div className="font-medium mb-1 text-gray-700 dark:text-gray-200">Database Status:</div>
              <div className="mb-2 text-gray-700 dark:text-gray-300">{dbStatus}</div>
              <button className="btn-secondary mb-2" onClick={handleBackup}>Trigger Backup</button>
              <button className="btn-secondary mb-2 ml-2" onClick={handleRestore}>Restore Backup</button>
              <div className="text-sm text-gray-700 dark:text-gray-300">{backupStatus}</div>
            </div>
            <div>
              <div className="font-medium mb-1 text-gray-700 dark:text-gray-200">Export All Data</div>
              <button className="btn-primary">Download Export (mock)</button>
            </div>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Other database and environment settings can be added here as needed.</div>
        </div>
      )}
    </div>
  )
}

export default Settings 