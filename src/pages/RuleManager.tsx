import React, { useEffect, useState } from 'react'
import { apiService } from '../services/api'
import { ChevronDown, ChevronRight, Plus, Trash2, Save, RefreshCw } from 'lucide-react'

function calcUnitPrice(price: any, sessions: any) {
  const p = parseFloat(String(price ?? ''))
  const s = parseFloat(String(sessions ?? ''))
  if (!isFinite(p) || !isFinite(s) || s <= 0) return ''
  return (p / s).toFixed(2)
}

// Mock data for membership types
const initialMemberships = [
  {
    category: 'Group Classes',
    types: [
      'Adult 10 Pack Pay As You Go',
      'Adult 5 Pack Pay As You Go',
      'Monthly Unlimited Adult',
      'Student 10 Pack',
      'Youth Boxing (13-17)'
    ]
  },
  {
    category: 'Private Sessions',
    types: [
      '1-on-1 Training',
      'Semi-Private (2 people)',
      'Personal Training Package'
    ]
  }
]

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
  notes: ''
}

const RuleManager: React.FC = () => {
  // State for memberships and selection
  const [memberships] = useState(initialMemberships)
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
        setRulesList((res as any).data || [])
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
      sessions: r.sessions || '',
      coachPct: r.coach_percentage || '',
      bgmPct: r.bgm_percentage || '',
      mgmtPct: r.management_percentage || '',
      mfcPct: r.mfc_percentage || '',
      privateSession: String(r.session_type).toLowerCase() === 'private',
      allowDiscounts: String(r.allow_discounts || '').toLowerCase() === 'true',
      taxExempt: false,
      notes: r.notes || '',
    }
    setRule(form as any)
  }

  // Handlers
  const handleExpand = (cat: string) => setExpanded(e => ({ ...e, [cat]: !e[cat] }))
  const handleSelect = (category: string, type: string) => {
    setSelected({ category, type })
    setRule({
      ...defaultRule,
      name: type,
      category,
      price: '112.20',
      sessions: '10',
      coachPct: '43.50',
      bgmPct: '30.00',
      mgmtPct: '8.50',
      mfcPct: '18.00',
      privateSession: false,
      allowDiscounts: true,
      taxExempt: false,
      notes: 'Standard adult group class package. 10 sessions valid for 3 months.'
    })
  }
  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
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
      const payload = {
        id: '',
        rule_name: rule.name,
        package_name: rule.name,
        session_type: rule.privateSession ? 'private' : 'group',
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
      }
      await apiService.saveRule(payload)
      await refreshRules()
      alert('Rule saved')
    } catch (e: any) {
      alert(e?.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }
  const handleDelete = async () => {
    try {
      if (!rule || !(rule as any).id) {
        alert('Select a saved rule to delete')
        return
      }
      setLoading(true)
      await apiService.deleteRuleById((rule as any).id)
      setSelected(null)
      setRule(defaultRule)
      await refreshRules()
      alert('Deleted')
    } catch (e: any) {
      alert(e?.message || 'Failed to delete')
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
export default RuleManager 