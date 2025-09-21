import React, { useState, useEffect } from 'react'
import apiService from '../services/api'
import toast from 'react-hot-toast'

type Coach = {
  id?: number
  name: string
  email: string
  rate: number
  active: boolean
}

const Settings: React.FC = () => {
  const [tab, setTab] = useState(0)
  // Coaches state
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [coachForm, setCoachForm] = useState({ name: '', email: '', rate: '', active: true })
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  // General settings state
  const [splits, setSplits] = useState({ coach: 43.5, bgm: 30, mgmt: 8.5, mfc: 18 })
  const [fixedRate, setFixedRate] = useState(false)
  const [defaultSessionPrice, setDefaultSessionPrice] = useState(10)
  // Database state
  const [dbStatus] = useState('OK (mock)')
  const [backupStatus, setBackupStatus] = useState('No recent backup')

  // Load coaches from API
  const loadCoaches = async () => {
    try {
      setLoading(true)
      const response = await apiService.getCoaches()
      if (response.success) {
        // Transform the data to match our frontend format
        const transformedCoaches = response.data.map((coach: any, index: number) => ({
          id: index + 1,
          name: coach.Instructors || coach.name || '',
          email: coach.Email || coach.email || '',
          rate: parseFloat(coach['Hourly Rate'] || coach.rate || '0'),
          active: (coach.Status || coach.active || 'Active') === 'Active'
        }))
        setCoaches(transformedCoaches)
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load coaches')
    } finally {
      setLoading(false)
    }
  }

  // Handlers for coaches
  const handleCoachInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setCoachForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleAddCoach = async () => {
    if (!coachForm.name || !coachForm.email || !coachForm.rate) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const response = await apiService.createCoach({
        name: coachForm.name,
        email: coachForm.email,
        rate: parseFloat(coachForm.rate),
        active: coachForm.active
      })

      if (response.success) {
        toast.success('Coach added successfully')
        setCoachForm({ name: '', email: '', rate: '', active: true })
        await loadCoaches() // Reload coaches from API
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add coach')
    } finally {
      setLoading(false)
    }
  }

  const handleEditCoach = (i: number) => {
    setEditIndex(i)
    setCoachForm({ ...coaches[i], rate: coaches[i].rate.toString() })
  }

  const handleSaveCoach = async () => {
    if (editIndex === null) return

    try {
      setLoading(true)
      const coachToUpdate = coaches[editIndex]
      const response = await apiService.updateCoach(coachToUpdate.id!, {
        name: coachForm.name,
        email: coachForm.email,
        rate: parseFloat(coachForm.rate),
        active: coachForm.active
      })

      if (response.success) {
        toast.success('Coach updated successfully')
        setEditIndex(null)
        setCoachForm({ name: '', email: '', rate: '', active: true })
        await loadCoaches() // Reload coaches from API
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update coach')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditIndex(null)
    setCoachForm({ name: '', email: '', rate: '', active: true })
  }

  const handleDeleteCoach = async (id: number) => {
    if (!confirm('Are you sure you want to delete this coach?')) return

    try {
      setLoading(true)
      const response = await apiService.deleteCoach(id)
      if (response.success) {
        toast.success('Coach deleted successfully')
        await loadCoaches() // Reload coaches from API
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete coach')
    } finally {
      setLoading(false)
    }
  }

  // Load coaches on component mount
  useEffect(() => {
    if (tab === 0) {
      loadCoaches()
    }
  }, [tab])

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
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">System Settings</h1>

      <div className="mb-4">
        <nav className="flex gap-2" aria-label="Tabs">
          {['Coaches', 'General', 'Database'].map((label, i) => (
            <button
              key={label}
              onClick={() => setTab(i)}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === i
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      {/* Tab Content */}
      {tab === 0 && (
        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-bold mb-4 text-white">Coach Management</h2>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-white font-medium mb-1">Full Name</label>
                <input 
                  name="name" 
                  value={coachForm.name} 
                  onChange={handleCoachInput} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded" 
                  placeholder="Enter coach name"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-1">Email</label>
                <input 
                  name="email" 
                  value={coachForm.email} 
                  onChange={handleCoachInput} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded" 
                  type="email" 
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-1">Hourly Rate</label>
                <input 
                  name="rate" 
                  value={coachForm.rate} 
                  onChange={handleCoachInput} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  placeholder="Enter hourly rate"
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <label className="text-white">Active</label>
                <input name="active" type="checkbox" checked={coachForm.active} onChange={handleCoachInput} />
              </div>
              {editIndex === null ? (
                <button 
                  className="px-4 py-2 rounded bg-primary-600 text-white disabled:opacity-50 font-medium" 
                  onClick={handleAddCoach}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Coach'}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    className="px-4 py-2 rounded bg-primary-600 text-white disabled:opacity-50 font-medium" 
                    onClick={handleSaveCoach}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    className="px-4 py-2 rounded bg-gray-600 text-white disabled:opacity-50" 
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="relative border border-gray-200 dark:border-gray-700 rounded max-h-[calc(100vh-260px)] overflow-x-auto overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-gray-800 text-white z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Coach Name</th>
                  <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Email</th>
                  <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Hourly Rate</th>
                  <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Status</th>
                  <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coaches.map((c, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-3 py-2 whitespace-nowrap text-white">{c.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-white">{c.email}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">€{c.rate.toFixed(2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-1 rounded bg-blue-600 text-white text-xs disabled:opacity-50" 
                          onClick={() => handleEditCoach(i)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button 
                          className="px-3 py-1 rounded bg-red-600 text-white text-xs disabled:opacity-50" 
                          onClick={() => handleDeleteCoach(c.id!)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loading && (
                  <tr><td className="px-3 py-4 text-gray-500" colSpan={5}>Loading...</td></tr>
                )}
                {!loading && coaches.length === 0 && (
                  <tr><td className="px-3 py-4 text-gray-500" colSpan={5}>No coaches found</td></tr>
                )}
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