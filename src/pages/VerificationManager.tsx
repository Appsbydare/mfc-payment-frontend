import React, { useEffect, useMemo, useState } from 'react'
import apiService from '../services/api'
import toast from 'react-hot-toast'

type MasterRow = {
  customerName: string
  eventStartsAt: string
  membershipName: string
  instructors: string
  status: string
  discount: string
  discountPercentage: number
  verificationStatus: 'Verified' | 'Not Verified' | 'Package Cannot be found'
  invoiceNumber: string
  amount: number
  paymentDate: string
  packagePrice: number
  sessionPrice: number
  discountedSessionPrice: number
  coachAmount: number
  bgmAmount: number
  managementAmount: number
  mfcAmount: number
  uniqueKey?: string
  changeHistory?: string
}

const VerificationManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [masterData, setMasterData] = useState<MasterRow[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState<string>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set())
  const [pendingEdits, setPendingEdits] = useState<Record<string, MasterRow>>({})
  const [editingKey, setEditingKey] = useState<string>('')
  const [editDraft, setEditDraft] = useState<Partial<MasterRow>>({})

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return masterData
    return masterData.filter(r =>
      r.customerName.toLowerCase().includes(q) ||
      r.membershipName.toLowerCase().includes(q) ||
      r.verificationStatus.toLowerCase().includes(q) ||
      (r.invoiceNumber || '').toLowerCase().includes(q)
    )
  }, [filter, masterData])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const out = [...filtered]
    out.sort((a: any, b: any) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const an = typeof av === 'number' ? av : parseFloat(av || 'NaN')
      const bn = typeof bv === 'number' ? bv : parseFloat(bv || 'NaN')
      if (!isNaN(an) && !isNaN(bn)) return sortDir === 'asc' ? an - bn : bn - an
      const as = String(av ?? '')
      const bs = String(bv ?? '')
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
    })
    return out
  }, [filtered, sortKey, sortDir])

  const handleSort = (key: keyof MasterRow) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key as string); setSortDir('asc') }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified': return 'bg-green-100 text-green-800'
      case 'Manually verified': return 'bg-blue-100 text-blue-800'
      case 'Not Verified': return 'bg-red-100 text-red-800'
      case 'Package Cannot be found': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Removed loadMaster to avoid accidental reprocessing and to fix unused variable warning

  const handleLoadVerified = async () => {
    try {
      setLoading(true)
      toast.loading('Loading verified data...', { id: 'load-verified' })
      const res = await apiService.getAttendanceVerificationMaster()
      if ((res as any).success) {
        const rows = (res as any).data || []
        setMasterData(rows)
        setSummary((res as any).summary || {})
        const keySet = new Set<string>(rows.map((r: any) => r.uniqueKey).filter(Boolean))
        setExistingKeys(keySet)
        toast.success('Verified data loaded', { id: 'load-verified' })
      } else {
        toast.error((res as any).message || 'Failed to load verified data', { id: 'load-verified' })
      }
    } catch (e: any) {
      console.error('❌ Load verified error:', e)
      toast.error(e?.message || 'Failed to load verified data', { id: 'load-verified' })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    try {
      setLoading(true)
      
      // Use the new batch verification process (all steps in memory, single write at end)
      toast.loading('Starting batch verification process...', { id: 'batch-verify' })
      console.log('🔄 Starting batch verification process...')
      
      // Only verify if there is NEW data (server will gate when forceReverify=false)
      const batchRes = await apiService.batchVerificationProcess(false)
      if (!(batchRes as any).success) {
        toast.error((batchRes as any).message || 'Batch verification failed', { id: 'batch-verify' })
        return
      }
      
      console.log('✅ Batch verification completed')
      toast.success('Batch verification completed successfully!', { id: 'batch-verify' })
      
      // Update UI with final data
      const finalData = (batchRes as any).data || []
      setMasterData(finalData)
      
      // Track which are newly verified compared to loaded keys
      if (existingKeys && existingKeys.size > 0) {
        const newCount = finalData.filter((r: any) => r.uniqueKey && !existingKeys.has(r.uniqueKey)).length
        if (newCount > 0) {
          toast.success(`${newCount} new records found since last load`)
        }
      }

      // Use the summary from the response
      const responseSummary = (batchRes as any).summary || {}
      setSummary(responseSummary)
      
      // Final success message
      toast.success(`Verification complete: ${responseSummary.verifiedRecords || 0}/${responseSummary.totalRecords || 0} verified`, { duration: 4000 })
      
    } catch (e: any) {
      console.error('❌ Batch verification process error:', e)
      toast.error(e?.message || 'Batch verification process failed')
    } finally {
      setLoading(false)
    }
  }


  const handleRewrite = async () => {
    try {
      setLoading(true)
      // Determine rows to upsert: pending manual edits + newly verified rows not yet in sheet
      const edits = Object.values(pendingEdits)
      const newRows = masterData.filter(r => (r.uniqueKey ? !existingKeys.has(r.uniqueKey) : false))
      const rowsToUpsert = [...edits, ...newRows]

      if (rowsToUpsert.length === 0) {
        toast.success('Nothing to rewrite. No new or edited rows.')
        setLoading(false)
        return
      }

      const res = await apiService.upsertMasterRows(rowsToUpsert as any)
      if ((res as any).success) {
        toast.success(((res as any).message) || 'Master updated successfully')
        // Refresh existing keys and clear pending edits
        try {
          const reload = await apiService.getAttendanceVerificationMaster()
          if ((reload as any).success) {
            setMasterData((reload as any).data || [])
            setSummary((reload as any).summary || {})
            setExistingKeys(new Set<string>(((reload as any).data || []).map((r: any) => r.uniqueKey).filter(Boolean)))
            setPendingEdits({})
          }
        } catch {}
      }
    } catch (e: any) {
      toast.error(e?.message || 'Rewrite failed')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async () => {
    try {
      setLoading(true)
      toast.loading('Generating Excel report...', { id: 'export-report' })
      
      const res = await apiService.exportAttendanceVerification({ format: 'csv' })
      if ((res as any).success) {
        toast.success('Excel report downloaded successfully!', { id: 'export-report' })
      } else {
        toast.error((res as any).message || 'Export failed', { id: 'export-report' })
      }
    } catch (e: any) {
      console.error('❌ Export Error:', e)
      toast.error(e?.message || 'Export failed', { id: 'export-report' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async (row: MasterRow) => {
    if (!row.uniqueKey) { toast.error('Missing UniqueKey for this row'); return }
    try {
      setLoading(true)
      const original = masterData.find(r => r.uniqueKey === row.uniqueKey) as MasterRow
      const merged: MasterRow = {
        ...original,
        ...editDraft,
        verificationStatus: 'Manually verified' as any,
      }

      // Compose change history entry
      const changedFields: string[] = []
      const fieldsToTrack: (keyof MasterRow)[] = ['discount','discountPercentage','invoiceNumber','amount','paymentDate','packagePrice','sessionPrice','discountedSessionPrice','coachAmount','bgmAmount','managementAmount','mfcAmount']
      fieldsToTrack.forEach(k => {
        const beforeVal = (original as any)[k]
        const afterVal = (merged as any)[k]
        if (String(beforeVal ?? '') !== String(afterVal ?? '')) changedFields.push(String(k))
      })
      const ts = new Date().toISOString()
      const note: string = `${ts}: Manual edit (${changedFields.join(', ')})`
      const previousHistory: string = typeof original.changeHistory === 'string' ? original.changeHistory : ''
      const changeHistoryText: string = previousHistory ? `${previousHistory} | ${note}` : note
      (merged as any).changeHistory = changeHistoryText

      await apiService.upsertMasterRows([merged as any])

      // Update local state and caches
      setMasterData(prev => prev.map(r => r.uniqueKey === merged.uniqueKey ? merged : r))
      setExistingKeys(prev => new Set<string>([...prev, merged.uniqueKey || '']))
      setPendingEdits(prev => ({ ...prev, [merged.uniqueKey as string]: merged }))
      setEditingKey('')
      setEditDraft({})
      toast.success('Changes saved')
    } catch (e: any) {
      console.error('❌ Save edit failed:', e)
      toast.error(e?.message || 'Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingKey('')
    setEditDraft({})
  }


  // Start with empty data - user must click Refresh to load
  useEffect(() => {
    // No auto-loading - start with empty table
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Verification Manager</h1>

      <div className="mb-4">
        <nav className="flex gap-2" aria-label="Tabs">
          {['Master Verification', 'Payment Verification', 'Verification Summary', 'Coaches Summary'].map((label, idx) => (
            <button
              key={label}
              onClick={() => setActiveTab(idx)}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === idx
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
              placeholder="Search by customer, membership, status, invoice..."
            />
            <div className="flex gap-2">
              <button onClick={handleLoadVerified} disabled={loading} className="px-3 py-2 rounded bg-gray-600 text-white disabled:opacity-50">Load Verified Data</button>
              <button onClick={handleVerify} disabled={loading} className="px-4 py-2 rounded bg-primary-600 text-white disabled:opacity-50 font-medium">
                {loading ? 'Processing...' : 'Verify Payments'}
              </button>
              <button onClick={handleExportReport} disabled={loading} className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50">Export Report</button>
              <button onClick={handleRewrite} disabled={loading} className="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-50">Rewrite Master</button>
            </div>
          </div>

          <div className="text-sm text-white bg-gray-800 p-3 rounded-lg">
            <span className="mr-4 font-medium">Total: {summary?.totalRecords || 0}</span>
            <span className="mr-4 text-green-400">Verified: {summary?.verifiedRecords || 0}</span>
            <span className="mr-4 text-red-400">Unverified: {summary?.unverifiedRecords || 0}</span>
            <span className="text-blue-400">Rate: {summary?.verificationRate?.toFixed?.(1) || '0.0'}%</span>
          </div>

          <div className="relative border border-gray-200 dark:border-gray-700 rounded max-h-[calc(100vh-260px)] overflow-x-auto overflow-y-auto">
            <table className="min-w-[1750px] text-sm">
              <thead className="sticky top-0 bg-gray-800 text-white z-10">
                <tr>
                  {['customerName','eventStartsAt','membershipName','instructors','status','discount','discountPercentage','verificationStatus','invoiceNumber','amount','paymentDate','packagePrice','sessionPrice','discountedSessionPrice','coachAmount','bgmAmount','managementAmount','mfcAmount','changeHistory','actions'].map((key, idx) => (
                    <th key={key} onClick={() => handleSort(key as keyof MasterRow)} className="px-3 py-2 text-left font-semibold whitespace-nowrap cursor-pointer select-none text-white">
                      {['Customer Name','Event Starts At','Membership Name','Instructors','Status','Discount','Discount %','Verification Status','Invoice #','Amount','Payment Date','Package Price','Session Price','Discounted Session Price','Coach Amount','BGM Amount','Management Amount','MFC Amount','Change History','Actions'][idx]}
                      {sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, idx) => {
                  const isEditing = editingKey && r.uniqueKey === editingKey
                  const draft = isEditing ? { ...r, ...editDraft } : r
                  return (
                    <tr key={idx} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-3 py-2 whitespace-nowrap text-white">{draft.customerName}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">{draft.eventStartsAt}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">{draft.membershipName}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">{draft.instructors}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">{draft.status}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">
                        {isEditing ? (
                          <input className="w-32 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded" value={String(draft.discount || '')} onChange={(e)=>setEditDraft(d=>({...d, discount:e.target.value}))} />
                        ) : (
                          draft.discount
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" value={String(draft.discountPercentage ?? 0)} onChange={(e)=>setEditDraft(d=>({...d, discountPercentage: Number(e.target.value || 0)}))} />
                        ) : (
                          Number(draft.discountPercentage || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap" onDoubleClick={() => { setEditingKey(r.uniqueKey || ''); setEditDraft({}); }}>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(draft.verificationStatus)}`}>
                          {draft.verificationStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">
                        {isEditing ? (
                          <input className="w-40 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded" value={String(draft.invoiceNumber || '')} onChange={(e)=>setEditDraft(d=>({...d, invoiceNumber:e.target.value}))} />
                        ) : (
                          draft.invoiceNumber
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" value={String(draft.amount ?? 0)} onChange={(e)=>setEditDraft(d=>({...d, amount:Number(e.target.value || 0)}))} />
                        ) : (
                          Number(draft.amount || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">
                        {isEditing ? (
                          <input className="w-40 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded" value={String(draft.paymentDate || '')} onChange={(e)=>setEditDraft(d=>({...d, paymentDate:e.target.value}))} />
                        ) : (
                          draft.paymentDate
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" value={String(draft.packagePrice ?? 0)} onChange={(e)=>setEditDraft(d=>({...d, packagePrice:Number(e.target.value || 0)}))} />
                        ) : (
                          Number(draft.packagePrice || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" value={String(draft.sessionPrice ?? 0)} onChange={(e)=>setEditDraft(d=>({...d, sessionPrice:Number(e.target.value || 0)}))} />
                        ) : (
                          Number(draft.sessionPrice || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" value={String(draft.discountedSessionPrice ?? 0)} onChange={(e)=>setEditDraft(d=>({...d, discountedSessionPrice:Number(e.target.value || 0)}))} />
                        ) : (
                          Number(draft.discountedSessionPrice || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" value={String(draft.coachAmount ?? 0)} onChange={(e)=>setEditDraft(d=>({...d, coachAmount:Number(e.target.value || 0)}))} />
                        ) : (
                          Number(draft.coachAmount || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" value={String(draft.bgmAmount ?? 0)} onChange={(e)=>setEditDraft(d=>({...d, bgmAmount:Number(e.target.value || 0)}))} />
                        ) : (
                          Number(draft.bgmAmount || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" value={String(draft.managementAmount ?? 0)} onChange={(e)=>setEditDraft(d=>({...d, managementAmount:Number(e.target.value || 0)}))} />
                        ) : (
                          Number(draft.managementAmount || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" value={String(draft.mfcAmount ?? 0)} onChange={(e)=>setEditDraft(d=>({...d, mfcAmount:Number(e.target.value || 0)}))} />
                        ) : (
                          Number(draft.mfcAmount || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">{draft.changeHistory || ''}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={() => handleSaveEdit(r)}>Save Changes</button>
                            <button className="px-3 py-1 rounded bg-gray-600 text-white" onClick={handleCancelEdit}>Cancel</button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
                {loading && (
                  <tr><td className="px-3 py-4 text-gray-500" colSpan={18}>Loading...</td></tr>
                )}
                {!loading && sorted.length === 0 && (
                  <tr><td className="px-3 py-4 text-gray-500" colSpan={18}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">This section will be enabled next. Master Verification is available now.</div>
      )}
    </div>
  )
}

export default VerificationManager


