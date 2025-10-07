import React, { useEffect, useState } from 'react'
import { apiService } from '../services/api'
import { ChevronDown, ChevronRight, Plus, Trash2, Save, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

function calcUnitPrice(price: any, sessions: any) {
  const p = parseFloat(String(price ?? ''))
  const s = parseFloat(String(sessions ?? ''))
  if (!isFinite(p) || !isFinite(s) || s <= 0) return ''
  return (p / s).toFixed(2)
}

// Membership categories will be derived from the rules list
const initialMemberships: { category: string; types: string[] }[] = []

const defaultRule = {
  name: '',
  category: '',
  price: '',
  sessions: '',
  unitPrice: '',
  coachPct: '',
  bgmPct: '',
  mgmtPct: '',
  mfcPct: '',
  privateSession: false,
  allowDiscounts: false,
  taxExempt: false,
  notes: '',
  attendanceAlias: '',
  paymentMemoAlias: ''
}

const RuleManager: React.FC = () => {
  // State for memberships and selection
  const [memberships, setMemberships] = useState(initialMemberships)
  const [expanded, setExpanded] = useState<{ [cat: string]: boolean }>({})
  const [selected, setSelected] = useState<{ category: string, type: string } | null>(null)
  const [search, setSearch] = useState('')
  // State for rule form
  const [rule, setRule] = useState(defaultRule)
  const [rulesList, setRulesList] = useState<any[]>([])
  const [, setLoading] = useState(false)

  useEffect(() => {
    refreshRules()
  }, [])

  const refreshRules = async () => {
    try {
      const res = await apiService.listRules()
      if ((res as any).success) {
        const list = ((res as any).data || []) as any[]
        setRulesList(list)
        // Build categories -> types from rules
        const byCat: Record<string, string[]> = {}
        list.forEach(r => {
          const cat = String(r.session_type).toLowerCase() === 'private' ? 'Private Sessions' : 'Group Classes'
          const name = r.rule_name || r.package_name
          if (!name) return
          if (!byCat[cat]) byCat[cat] = []
          if (!byCat[cat].includes(name)) byCat[cat].push(name)
        })
        setMemberships(Object.keys(byCat).map(category => ({ category, types: byCat[category].sort() })))
      }
    } catch (e) {
      // noop
    }
  }

  const loadToForm = (r: any) => {
    const form = {
      ...(defaultRule as any),
      id: r.id,
      name: r.rule_name || r.package_name || '',
      category: String(r.session_type).toLowerCase() === 'private' ? 'Private Sessions' : 'Group Classes',
      price: r.price || '',
      sessions: r.sessions || r.sessions_per_pack || '',
      unitPrice: r.unit_price || calcUnitPrice(r.price, r.sessions || r.sessions_per_pack),
      coachPct: r.coach_percentage || '',
      bgmPct: r.bgm_percentage || '',
      mgmtPct: r.management_percentage || '',
      mfcPct: r.mfc_percentage || '',
      privateSession: String(r.session_type).toLowerCase() === 'private',
      allowDiscounts: String(r.allow_discounts || '').toLowerCase() === 'true',
      taxExempt: false,
      notes: r.notes || '',
      attendanceAlias: r.attendance_alias || '',
      paymentMemoAlias: r.payment_memo_alias || '',
    }
    setRule(form as any)
  }

  // Handlers
  const handleExpand = (cat: string) => setExpanded(e => ({ ...e, [cat]: !e[cat] }))
  const handleSelect = (category: string, type: string) => {
    setSelected({ category, type })
    // Try load from existing rule directly
    const match = rulesList.find(r => (r.rule_name || r.package_name) === type)
    if (match) {
      loadToForm(match)
      return
    }
    setRule({ ...defaultRule, name: type, category })
  }
  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    // Keep category and privateSession in sync so saves persist the intended type
    if (name === 'category') {
      const newCategory = String(value)
      const isPrivate = /^private/i.test(newCategory)
      setRule(r => ({ ...r, category: newCategory, privateSession: isPrivate }))
      return
    }
    if (type === 'checkbox') {
      setRule(r => ({ ...r, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setRule(r => ({ ...r, [name]: value }))
    }
  }
  const handleAdd = () => {
    // Add new membership type (mock)
    setSelected(null)
    setRule(defaultRule)
  }
  const handleSave = async () => {
    try {
      setLoading(true)
      const sessionType = (() => {
        if (rule.category) return /^private/i.test(rule.category) ? 'private' : 'group'
        return rule.privateSession ? 'private' : 'group'
      })()
      const payload = {
        id: (rule as any).id || '',
        rule_name: rule.name,
        package_name: rule.name,
        session_type: sessionType,
        price: rule.price,
        sessions: rule.sessions,
        sessions_per_pack: rule.sessions,
        unit_price: rule.unitPrice || calcUnitPrice(rule.price, rule.sessions),
        coach_percentage: rule.coachPct,
        bgm_percentage: rule.bgmPct,
        management_percentage: rule.mgmtPct,
        mfc_percentage: rule.mfcPct,
        pricing_type: '',
        per_week: '',
        fixed_rate: '',
        allow_discounts: rule.allowDiscounts,
        notes: rule.notes,
        attendance_alias: rule.attendanceAlias,
        payment_memo_alias: rule.paymentMemoAlias,
      }
      await apiService.saveRule(payload)
      await refreshRules()
      toast.success('Rule saved successfully!')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }
  const handleDelete = async () => {
    try {
      if (!rule || !(rule as any).id) {
        toast.error('Select a saved rule to delete')
        return
      }
      setLoading(true)
      await apiService.deleteRuleById((rule as any).id)
      setSelected(null)
      setRule(defaultRule)
      await refreshRules()
      toast.success('Rule deleted successfully!')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete')
    } finally {
      setLoading(false)
    }
  }
  const handleReset = () => {
    if (selected) handleSelect(selected.category, selected.type)
    else setRule(defaultRule)
  }

  // Filter memberships by search
  const filteredMemberships = memberships.map(cat => ({
    ...cat,
    types: cat.types.filter(type => type.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.types.length > 0)

  return (
    <div className="space-y-4">
      {/* Page title */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rule Manager</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Panel: Membership Types */}
      <div className="w-full lg:w-1/3 bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-md">
        <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Membership Types</h2>
        <input
          type="text"
          placeholder="Search membership types..."
          className="input-field mb-3"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="max-h-96 overflow-y-auto">
          <ul>
            {filteredMemberships.map(cat => (
              <li key={cat.category}>
                <button
                  className="flex items-center w-full text-left font-semibold text-gray-800 dark:text-gray-200 py-1"
                  onClick={() => handleExpand(cat.category)}
                >
                  {expanded[cat.category] ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                  {cat.category}
                </button>
                {expanded[cat.category] && (
                  <ul className="ml-6">
                    {cat.types.map(type => (
                      <li key={type}>
                        <button
                          className={`w-full text-left py-1 px-2 rounded transition-colors ${selected && selected.type === type ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                          onClick={() => handleSelect(cat.category, type)}
                        >
                          {type}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
        <button className="btn-primary mt-4 w-full flex items-center justify-center gap-2" onClick={handleAdd}>
          <Plus className="w-4 h-4" /> Add New Membership Type
        </button>
      </div>

      {/* Right Panel: Membership Rules Configuration */}
      <div className="w-full lg:w-2/3 bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-md">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Membership Rules Configuration</h2>
        <div className="mb-4">
          <button type="button" className="btn-secondary" onClick={() => refreshRules()}>Refresh Rules</button>
        </div>
        <form className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Membership Name</label>
              <input name="name" value={rule.name} onChange={handleInput} className="input-field" />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Category</label>
              <select name="category" value={rule.category} onChange={handleInput} className="input-field">
                <option value="">Select...</option>
                {memberships.map(cat => <option key={cat.category} value={cat.category}>{cat.category}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Price</label>
              <input name="price" value={rule.price} onChange={handleInput} className="input-field" type="number" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Number of Sessions</label>
              <input name="sessions" value={rule.sessions} onChange={handleInput} className="input-field" type="number" min="1" />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Session Price</label>
              <input name="unitPrice" value={(rule.unitPrice || calcUnitPrice(rule.price, rule.sessions)) as any} onChange={handleInput} className="input-field" type="number" min="0" step="0.01" />
            </div>
          </div>

          {/* Alias Fields for Exact Matching */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-200">Exact Matching Aliases</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              These fields help the verification system match this rule exactly with attendance and payment data.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">
                  Attendance Report Name
                  <span className="text-xs text-gray-500 ml-1">(How it appears in attendance data)</span>
                </label>
                <input 
                  name="attendanceAlias" 
                  value={rule.attendanceAlias} 
                  onChange={handleInput} 
                  className="input-field" 
                  placeholder="e.g., 'Yoga Class', 'Personal Training'"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to use the membership name above</p>
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">
                  Payment Report Name
                  <span className="text-xs text-gray-500 ml-1">(How it appears in payment memos)</span>
                </label>
                <input 
                  name="paymentMemoAlias" 
                  value={rule.paymentMemoAlias} 
                  onChange={handleInput} 
                  className="input-field" 
                  placeholder="e.g., 'Yoga', 'PT Session'"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to use the membership name above</p>
              </div>
            </div>
          </div>

          {/* Payment Split Percentages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Coach %</label>
              <input name="coachPct" value={rule.coachPct} onChange={handleInput} className="input-field" type="number" min="0" max="100" step="0.01" />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">BGM (Landlord) %</label>
              <input name="bgmPct" value={rule.bgmPct} onChange={handleInput} className="input-field" type="number" min="0" max="100" step="0.01" />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Management %</label>
              <input name="mgmtPct" value={rule.mgmtPct} onChange={handleInput} className="input-field" type="number" min="0" max="100" step="0.01" />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">MFC Retained %</label>
              <input name="mfcPct" value={rule.mfcPct} onChange={handleInput} className="input-field" type="number" min="0" max="100" step="0.01" />
            </div>
          </div>

          {/* Special Rules / Exceptions */}
          <div className="bg-gray-100 dark:bg-gray-900/40 rounded-lg p-4">
            <div className="flex flex-col md:flex-row gap-4 mb-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="privateSession" checked={rule.privateSession} onChange={handleInput} />
                Private Session
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="allowDiscounts" checked={rule.allowDiscounts} onChange={handleInput} />
                Allow Discounts
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="taxExempt" checked={rule.taxExempt} onChange={handleInput} />
                Tax Exempt
              </label>
            </div>
            <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Notes:</label>
            <textarea name="notes" value={rule.notes} onChange={handleInput} className="input-field w-full min-h-[60px]" />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row gap-3 mt-2">
            <button type="button" className="btn-primary flex items-center gap-2" onClick={handleSave}><Save className="w-4 h-4" /> Save Rules</button>
            <button type="button" className="btn-secondary flex items-center gap-2" onClick={handleDelete}><Trash2 className="w-4 h-4" /> Delete Membership</button>
            <button type="button" className="btn-secondary flex items-center gap-2 ml-auto" onClick={handleReset}><RefreshCw className="w-4 h-4" /> Reset Changes</button>
          </div>
        </form>
        {/* Existing Rules (from Sheets) */}
        <div className="mt-6">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Existing Rules</h3>
          <div className="max-h-64 overflow-y-auto border rounded">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">ID</th>
                  <th className="px-2 py-1 text-left">Name</th>
                  <th className="px-2 py-1 text-left">Type</th>
                  <th className="px-2 py-1 text-left">Price</th>
                  <th className="px-2 py-1 text-left">Sessions</th>
                  <th className="px-2 py-1 text-left">Coach %</th>
                  <th className="px-2 py-1 text-left">Attendance Alias</th>
                  <th className="px-2 py-1 text-left">Payment Alias</th>
                </tr>
              </thead>
              <tbody>
                {rulesList.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => loadToForm(r)}>
                    <td className="px-2 py-1">{r.id}</td>
                    <td className="px-2 py-1">{r.rule_name || r.package_name}</td>
                    <td className="px-2 py-1">{r.session_type}</td>
                    <td className="px-2 py-1">{r.price}</td>
                    <td className="px-2 py-1">{r.sessions}</td>
                    <td className="px-2 py-1">{r.coach_percentage}</td>
                    <td className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400">{r.attendance_alias || '-'}</td>
                    <td className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400">{r.payment_memo_alias || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
export default RuleManager 