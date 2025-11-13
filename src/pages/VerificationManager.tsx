import React, { useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import apiService from '../services/api'
import toast from 'react-hot-toast'
import { RootState } from '../store'
import {
  MasterRow,
  setActiveTab,
  setMasterData,
  setSummary,
  setFilter,
  setSorting,
  setExistingKeys,
  setPendingEdits,
  updatePendingEdit,
  setEditingKey,
  setEditDraft,
  updateEditDraft,
  clearEditState,
  updateMasterRow,
} from '../store/verificationSlice'

type PaymentVerificationRow = {
  invoice: string
  date: string
  amount: number
  customer: string
  package: string
  discount: string
  discountAmount?: number
  discountPercentage?: number
  tax: number
  netPrice: number
  numberOfSessions: number
  discountedSessionPrice: number
  attendanceVerified?: boolean
  consumedSessions?: number
  pendingSessions?: number
}

const VerificationManager: React.FC = () => {
  const dispatch = useDispatch()
  const {
    activeTab,
    masterData,
    summary,
    filter,
    sortKey,
    sortDir,
    existingKeys,
    pendingEdits,
    editingKey,
    editDraft,
  } = useSelector((state: RootState) => state.verification)
  
  const [loadingStates, setLoadingStates] = React.useState({
    loadVerified: false,
    verify: false,
    export: false,
    rewrite: false,
    saveEdit: false,
    coachesSummary: false
  })

  // Coaches Summary state
  const [coachesSummaryData, setCoachesSummaryData] = React.useState<any[]>([])
  const [coachesSummaryLoading, setCoachesSummaryLoading] = React.useState(false)
  const [coachesDateRange, setCoachesDateRange] = React.useState({ fromDate: '', toDate: '' })
  const [selectedCoach, setSelectedCoach] = React.useState<string | null>(null)
  const [coachSessions, setCoachSessions] = React.useState<any[]>([])
  const [coachSessionsLoading, setCoachSessionsLoading] = React.useState(false)
  const [coachesFilterText, setCoachesFilterText] = React.useState('')
  const [coachesSortKey, setCoachesSortKey] = React.useState<'coachName'|'totalSessions'|'totalAmount'|'totalCoachAmount'|'totalBgmAmount'|'totalManagementAmount'|'totalMfcAmount'|'averageSessionAmount'>('totalCoachAmount')
  const [coachesSortDir, setCoachesSortDir] = React.useState<'asc'|'desc'>('desc')

  const [paymentData, setPaymentData] = React.useState<PaymentVerificationRow[]>([])
  const [paymentSummary, setPaymentSummary] = React.useState<any | null>(null)
  const [paymentLoading, setPaymentLoading] = React.useState(false)
  const [paymentFilter, setPaymentFilter] = React.useState('')
  const [paymentSortKey, setPaymentSortKey] = React.useState<keyof PaymentVerificationRow>('date')
  const [paymentSortDir, setPaymentSortDir] = React.useState<'asc' | 'desc'>('desc')

  // Helper function to update loading states
  const setLoading = (key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }))
  }

  // Check if any operation is loading
  const isAnyLoading = Object.values(loadingStates).some(Boolean)

  // Convert existingKeys array to Set for easier operations
  const existingKeysSet = useMemo(() => new Set(existingKeys), [existingKeys])

  // Utility function to generate uniqueKey if missing
  const generateUniqueKey = (row: MasterRow): string => {
    const date = row.eventStartsAt || '';
    const customer = row.customerName || '';
    const membership = row.membershipName || '';
    const instructors = row.instructors || '';
    const status = row.status || '';
    const verificationStatus = row.verificationStatus || '';
    
    // Include more fields to ensure uniqueness, especially for multiple sessions same day
    const baseKey = `${date}_${customer}_${membership}_${instructors}_${status}_${verificationStatus}`;
    return baseKey.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  }

  // Ensure all rows have uniqueKey and handle duplicates
  const ensureUniqueKeys = (rows: MasterRow[]): MasterRow[] => {
    const keyCount: Record<string, number> = {};
    
    return rows.map((row, index) => {
      let uniqueKey = row.uniqueKey || generateUniqueKey(row);
      
      // Handle duplicate keys by adding sequence number
      if (keyCount[uniqueKey]) {
        keyCount[uniqueKey]++;
        uniqueKey = `${uniqueKey}_${keyCount[uniqueKey]}`;
      } else {
        keyCount[uniqueKey] = 1;
      }
      
      // If still no uniqueKey, use index as fallback
      if (!uniqueKey || uniqueKey.trim() === '') {
        uniqueKey = `row_${index}_${Date.now()}`;
      }
      
      return {
        ...row,
        uniqueKey
      };
    });
  }

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
      const as = `${av ?? ''}`
      const bs = `${bv ?? ''}`
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
    })
    return out
  }, [filtered, sortKey, sortDir])

  const loadPaymentVerification = React.useCallback(async () => {
    try {
      setPaymentLoading(true)
      toast.loading('Loading payment verification...', { id: 'payment-verification' })
      const response: any = await apiService.getPaymentVerificationTable()
      if (response?.success) {
        const rows: PaymentVerificationRow[] = (response.data || []).map((row: any) => {
          const amount = Number(row.amount ?? row.totalAmount ?? 0) || 0
          const tax = Number(row.tax ?? 0) || 0
          const netPriceRaw = Number(row.netPrice ?? (Number(row.amount ?? row.totalAmount ?? 0) - tax - Number(row.discountAmount ?? row.discount_amount ?? 0))) || 0
          const netPrice = netPriceRaw < 0 ? 0 : netPriceRaw
          const discountPercentage = Number(row.discountPercentage ?? row.discount_percentage ?? 0) || 0
          const discountAmount = Number(row.discountAmount ?? row.discount_amount ?? 0) || 0
          return {
            invoice: String(row.invoice ?? ''),
            date: String(row.date ?? ''),
            customer: String(row.customer ?? ''),
            package: String(row.package ?? ''),
            discount: String(row.discount ?? ''),
            amount,
            discountAmount,
            discountPercentage,
            tax,
            netPrice,
            numberOfSessions: Number(row.numberOfSessions ?? row.totalSessions ?? 0) || 0,
            discountedSessionPrice: Number(row.discountedSessionPrice ?? row.invoiceVerifiedSessionPrice ?? 0) || 0,
            attendanceVerified: Boolean(row.attendanceVerified),
            consumedSessions: Number(row.consumedSessions ?? 0) || 0,
            pendingSessions: Number(row.pendingSessions ?? 0) || 0
          }
        })
        setPaymentData(rows)
        setPaymentSummary(response.summary || null)
        toast.success(`Loaded ${rows.length} payment records`, { id: 'payment-verification' })
      } else {
        toast.error(response?.message || 'Failed to load payment verification data', { id: 'payment-verification' })
      }
    } catch (error: any) {
      console.error('❌ Payment verification load error:', error)
      toast.error(error?.message || 'Failed to load payment verification data', { id: 'payment-verification' })
    } finally {
      setPaymentLoading(false)
    }
  }, [])

  const filteredPaymentData = React.useMemo(() => {
    const query = paymentFilter.trim().toLowerCase()
    if (!query) return paymentData
    return paymentData.filter(row => {
      return [
        row.invoice,
        row.customer,
        row.package,
        row.discount,
      ].some(value => (value || '').toLowerCase().includes(query))
    })
  }, [paymentFilter, paymentData])

  const sortedPaymentData = React.useMemo(() => {
    const rows = [...filteredPaymentData]
    rows.sort((a, b) => {
      const aValue = a[paymentSortKey]
      const bValue = b[paymentSortKey]
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return paymentSortDir === 'asc' ? aValue - bValue : bValue - aValue
      }
      const aStr = String(aValue ?? '')
      const bStr = String(bValue ?? '')
      if (paymentSortKey === 'date') {
        const aDate = new Date(aStr).getTime()
        const bDate = new Date(bStr).getTime()
        if (!Number.isFinite(aDate) || !Number.isFinite(bDate)) {
          return paymentSortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
        }
        return paymentSortDir === 'asc' ? aDate - bDate : bDate - aDate
      }
      return paymentSortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
    return rows
  }, [filteredPaymentData, paymentSortKey, paymentSortDir])

  const formatCurrency = React.useCallback((value: number) => `€${(Number(value) || 0).toFixed(2)}`, [])
  const formatPercent = React.useCallback((value?: number) => `${(Number(value) || 0).toFixed(2)}%`, [])

  const paymentColumns: {
    key: keyof PaymentVerificationRow
    label: string
    align?: 'left' | 'right'
    format?: (row: PaymentVerificationRow) => React.ReactNode
  }[] = React.useMemo(() => ([
    { key: 'date', label: 'Date' },
    { key: 'invoice', label: 'Invoice' },
    { key: 'customer', label: 'Customer' },
    { key: 'package', label: 'Package' },
    { key: 'discount', label: 'Discount' },
    { key: 'amount', label: 'Invoice Amount', align: 'right', format: (row) => formatCurrency(row.amount) },
    { key: 'tax', label: 'Tax', align: 'right', format: (row) => formatCurrency(row.tax) },
    { key: 'discountAmount', label: 'Discount Amount', align: 'right', format: (row) => formatCurrency(row.discountAmount ?? 0) },
    { key: 'netPrice', label: 'Net Price', align: 'right', format: (row) => formatCurrency(row.netPrice) },
    { key: 'discountPercentage', label: 'Actual Discount %', align: 'right', format: (row) => formatPercent(row.discountPercentage) },
    { key: 'numberOfSessions', label: 'Number of Sessions', align: 'right', format: (row) => Number(row.numberOfSessions || 0).toFixed(0) },
    { key: 'consumedSessions', label: 'Consumed Sessions', align: 'right', format: (row) => Number(row.consumedSessions || 0).toFixed(0) },
    { key: 'pendingSessions', label: 'Pending Sessions', align: 'right', format: (row) => Number(row.pendingSessions || 0).toFixed(0) },
    { key: 'discountedSessionPrice', label: 'Discounted Session Price', align: 'right', format: (row) => formatCurrency(row.discountedSessionPrice) },
    { key: 'attendanceVerified', label: 'Attendance Verified', format: (row) => row.attendanceVerified ? 'Yes' : 'No' },
  ]), [formatCurrency, formatPercent])

  const handlePaymentSort = (key: keyof PaymentVerificationRow) => {
    if (paymentSortKey === key) {
      setPaymentSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setPaymentSortKey(key)
      setPaymentSortDir(key === 'date' ? 'desc' : 'asc')
    }
  }

  const paymentStats = React.useMemo(() => {
    const totalInvoices = paymentSummary?.totalInvoices ?? paymentData.length
    const totalTax = paymentSummary?.totalTax ?? paymentData.reduce((sum, row) => sum + (row.tax || 0), 0)
    const totalNetPrice = paymentSummary?.totalNetPrice ?? paymentData.reduce((sum, row) => sum + (row.netPrice || 0), 0)
    const invoicesWithDiscounts = paymentSummary?.invoicesWithDiscounts ?? paymentData.filter(row => !!row.discount).length
    const attendanceVerifiedCount = paymentSummary?.attendanceVerifiedCount ?? paymentData.filter(row => row.attendanceVerified).length
    const attendanceUnverifiedPercent = paymentSummary?.attendanceUnverifiedPercent ?? (
      totalInvoices > 0 ? ((totalInvoices - attendanceVerifiedCount) / totalInvoices) * 100 : 0
    )
    return {
      totalInvoices,
      totalTax,
      totalNetPrice,
      invoicesWithDiscounts,
      attendanceVerifiedCount,
      attendanceUnverifiedPercent,
    }
  }, [paymentSummary, paymentData])

  const handleSort = (key: keyof MasterRow) => {
    if (sortKey === key) {
      dispatch(setSorting({ key: key as string, dir: sortDir === 'asc' ? 'desc' : 'asc' }))
    } else {
      dispatch(setSorting({ key: key as string, dir: 'asc' }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified': return 'bg-green-100 text-green-800'
      case 'Manually verified': return 'bg-blue-100 text-blue-800'
      case 'Not Verified': return 'bg-red-100 text-red-800'
      case 'Package Cannot be found': return 'bg-orange-100 text-orange-800'
      case 'Pending Attendance': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Removed loadMaster to avoid accidental reprocessing and to fix unused variable warning

  const handleLoadVerified = async () => {
    try {
      setLoading('loadVerified', true)
      toast.loading('Loading verified data...', { id: 'load-verified' })
      
      
      const res = await apiService.getAttendanceVerificationMaster()
      if ((res as any).success) {
        const rawRows = (res as any).data || []
        const rows = ensureUniqueKeys(rawRows)
        dispatch(setMasterData(rows))
        dispatch(setSummary((res as any).summary || {}))
        const keyArray = rows.map((r: any) => r.uniqueKey).filter(Boolean)
        dispatch(setExistingKeys(keyArray))
        toast.success('Verified data loaded', { id: 'load-verified' })
      } else {
        toast.error((res as any).message || 'Failed to load verified data', { id: 'load-verified' })
      }
    } catch (e: any) {
      console.error('❌ Load verified error:', e)
      toast.error(e?.message || 'Failed to load verified data', { id: 'load-verified' })
    } finally {
      setLoading('loadVerified', false)
    }
  }

  const runVerification = async () => {
    try {
      setLoading('verify', true)
      
      // Always run new V2 verification (no discounts here)
      toast.loading('Starting verification...', { id: 'verify-process' })
      console.log('🔄 Starting V2 verification...')
      const res = await apiService.verifyAttendanceDataV2({})
      if (!(res as any).success) {
        toast.error((res as any).message || 'Verification failed', { id: 'verify-process' })
        return
      }
      console.log('✅ V2 verification completed')
      toast.success('Verification completed successfully!', { id: 'verify-process' })
      const raw = (res as any).data || []
      const rows = ensureUniqueKeys(raw)
      dispatch(setMasterData(rows))
      if (existingKeysSet && existingKeysSet.size > 0) {
        const newCount = rows.filter((r: any) => r.uniqueKey && !existingKeysSet.has(r.uniqueKey)).length
        if (newCount > 0) toast.success(`${newCount} new records found since last load`)
      }
      const summaryFromResponse = (res as any).summary || {}
      dispatch(setSummary(summaryFromResponse))
      toast.success(`Verification complete: ${summaryFromResponse.verifiedRecords || 0}/${summaryFromResponse.totalRecords || 0} verified`, { duration: 4000 })
      
    } catch (e: any) {
      console.error('❌ Verification process error:', e)
      toast.error(e?.message || 'Verification process failed')
    } finally {
      setLoading('verify', false)
    }
  }

  const handleVerify = () => {
    if (isAnyLoading) return
    // Always run verification without the discount batch
    runVerification()
  }


  const handleRewrite = async () => {
    try {
      setLoading('rewrite', true)
      // Determine rows to upsert: pending manual edits + newly verified rows not yet in sheet
      const edits = Object.values(pendingEdits)
      const newRows = masterData.filter(r => (r.uniqueKey ? !existingKeysSet.has(r.uniqueKey) : false))
      const rowsToUpsert = [...edits, ...newRows]

      if (rowsToUpsert.length === 0) {
        toast.success('Nothing to rewrite. No new or edited rows.')
        setLoading('rewrite', false)
        return
      }

      const res = await apiService.upsertMasterRows(rowsToUpsert as any)
      if ((res as any).success) {
        toast.success(((res as any).message) || 'Master updated successfully')
        // Refresh existing keys and clear pending edits
        try {
          const reload = await apiService.getAttendanceVerificationMaster()
          if ((reload as any).success) {
            dispatch(setMasterData((reload as any).data || []))
            dispatch(setSummary((reload as any).summary || {}))
            const keyArray = ((reload as any).data || []).map((r: any) => r.uniqueKey).filter(Boolean)
            dispatch(setExistingKeys(keyArray))
            dispatch(setPendingEdits({}))
          }
        } catch {}
      }
    } catch (e: any) {
      toast.error(e?.message || 'Rewrite failed')
    } finally {
      setLoading('rewrite', false)
    }
  }

  const handleExportReport = async () => {
    try {
      setLoading('export', true)
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
      setLoading('export', false)
    }
  }

  const handleSaveEdit = async (row: MasterRow) => {
    if (!row.uniqueKey) { toast.error('Missing UniqueKey for this row'); return }
    try {
      setLoading('saveEdit', true)
      const original = masterData.find(r => r.uniqueKey === row.uniqueKey) as MasterRow
      const merged: MasterRow = {
        ...original,
        ...editDraft,
        verificationStatus: 'Manually verified' as any,
      }

      // Compose change history entry
      const changedFields: string[] = []
      const fieldsToTrack: (keyof MasterRow)[] = ['discount','discountPercentage','invoiceNumber','amount','paymentDate','tax','numberOfSessions','discountedSessionPrice','coachAmount','managementAmount','mfcAmount']
      fieldsToTrack.forEach(k => {
        const beforeVal = (original as any)[k]
        const afterVal = (merged as any)[k]
        if (String(beforeVal ?? '') !== String(afterVal ?? '')) {
          changedFields.push(String(k))
        }
      })
      const ts = new Date().toISOString()
      const note: string = `${ts}: Manual edit (${changedFields.join(', ')})`
      const previousHistory: string = typeof original.changeHistory === 'string' ? original.changeHistory : ''
      let changeHistoryText: string
      if (previousHistory) {
        changeHistoryText = `${previousHistory} | ${note}`
      } else {
        changeHistoryText = note
      }
      (merged as any).changeHistory = changeHistoryText

      const saveResult = await apiService.upsertMasterRows([merged as any])

      if (!(saveResult as any).success) {
        throw new Error((saveResult as any).error || (saveResult as any).message || 'Failed to save changes');
      }

      // Update local state and caches
      dispatch(updateMasterRow(merged))
      const updatedKeys = [...existingKeys, merged.uniqueKey || ''].filter(Boolean)
      dispatch(setExistingKeys(Array.from(new Set(updatedKeys))))
      dispatch(updatePendingEdit({ key: merged.uniqueKey as string, data: merged }))
      dispatch(clearEditState())
      toast.success('Changes saved')
    } catch (e: any) {
      console.error('❌ Save edit failed:', e)
      toast.error(e?.message || 'Failed to save changes')
    } finally {
      setLoading('saveEdit', false)
    }
  }

  const handleCancelEdit = () => {
    console.log('❌ Canceling edit mode');
    dispatch(clearEditState())
  }

  useEffect(() => {
    if (activeTab === 1 && paymentData.length === 0 && !paymentLoading) {
      loadPaymentVerification()
    }
  }, [activeTab, paymentData.length, paymentLoading, loadPaymentVerification])

  // Coaches Summary functions
  const loadCoachesSummary = async () => {
    try {
      setCoachesSummaryLoading(true);
      toast.loading('Loading coaches summary...', { id: 'coaches-summary' });

      const params: any = {};
      if (coachesDateRange.fromDate) params.fromDate = coachesDateRange.fromDate;
      if (coachesDateRange.toDate) params.toDate = coachesDateRange.toDate;

      const response = await apiService.getCoachesSummary(params);

      if (response.success) {
        setCoachesSummaryData(response.data || []);
        const isMockData = response.message?.includes('Mock data');
        toast.success(
          isMockData
            ? 'Coaches summary loaded (Demo Mode - Connect backend for real data)'
            : (response.message || 'Coaches summary loaded successfully'),
          { id: 'coaches-summary' }
        );
      } else {
        toast.error(response.message || 'Failed to load coaches summary', { id: 'coaches-summary' });
      }
    } catch (error: any) {
      console.error('❌ Error loading coaches summary:', error);
      toast.error(error?.message || 'Failed to load coaches summary', { id: 'coaches-summary' });
    } finally {
      setCoachesSummaryLoading(false);
    }
  };

  const loadCoachSessions = async (coachName: string) => {
    try {
      setCoachSessionsLoading(true);
      setSelectedCoach(coachName);

      const params: any = {};
      if (coachesDateRange.fromDate) params.fromDate = coachesDateRange.fromDate;
      if (coachesDateRange.toDate) params.toDate = coachesDateRange.toDate;

      const response = await apiService.getCoachSessions(coachName, params);

      if (response.success) {
        setCoachSessions(response.data || []);
      } else {
        toast.error(response.message || 'Failed to load coach sessions');
        setCoachSessions([]);
      }
    } catch (error: any) {
      console.error(`❌ Error loading sessions for coach ${coachName}:`, error);
      toast.error(error?.message || 'Failed to load coach sessions');
      setCoachSessions([]);
    } finally {
      setCoachSessionsLoading(false);
    }
  };

  const handleCoachesDateRangeChange = (field: 'fromDate' | 'toDate', value: string) => {
    setCoachesDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleBackToSummary = () => {
    setSelectedCoach(null);
    setCoachSessions([]);
  };

  // Coaches Summary derived views (filter + sort)
  const filteredCoaches = useMemo(() => {
    const q = coachesFilterText.trim().toLowerCase()
    if (!q) return coachesSummaryData
    return coachesSummaryData.filter(c => `${c.coachName}`.toLowerCase().includes(q))
  }, [coachesSummaryData, coachesFilterText])

  const sortedCoaches = useMemo(() => {
    const out = [...filteredCoaches]
    out.sort((a: any, b: any) => {
      const av = a[coachesSortKey]
      const bv = b[coachesSortKey]
      const an = typeof av === 'number' ? av : parseFloat(`${av}`)
      const bn = typeof bv === 'number' ? bv : parseFloat(`${bv}`)
      if (!Number.isNaN(an) && !Number.isNaN(bn)) {
        return coachesSortDir === 'asc' ? an - bn : bn - an
      }
      const as = `${av ?? ''}`
      const bs = `${bv ?? ''}`
      return coachesSortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
    })
    return out
  }, [filteredCoaches, coachesSortKey, coachesSortDir])

  const handleCoachesSort = (key: typeof coachesSortKey) => {
    if (coachesSortKey === key) {
      setCoachesSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setCoachesSortKey(key)
      setCoachesSortDir('asc')
    }
  }

  const exportCoachesCSV = () => {
    const headers = ['Coach Name','Sessions','Total Amount','Coach Amount','BGM Amount','Management Amount','MFC Amount','Avg Session']
    const rows = sortedCoaches.map(c => [
      c.coachName,
      c.totalSessions,
      c.totalAmount,
      c.totalCoachAmount,
      c.totalBgmAmount,
      c.totalManagementAmount,
      c.totalMfcAmount,
      c.averageSessionAmount
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `coaches_summary_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  // Auto-load coaches summary when tab is opened
  useEffect(() => {
    if (activeTab === 3 && coachesSummaryData.length === 0 && !coachesSummaryLoading) {
      loadCoachesSummary()
    }
  }, [activeTab])

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
              onClick={() => dispatch(setActiveTab(idx))}
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
              onChange={(e) => dispatch(setFilter(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
              placeholder="Search by customer, membership, status, invoice..."
            />
            <div className="flex gap-2">
              <button onClick={handleLoadVerified} disabled={loadingStates.loadVerified || isAnyLoading} className="px-3 py-2 rounded bg-gray-600 text-white disabled:opacity-50">
                {loadingStates.loadVerified ? 'Loading...' : 'Load Verified Data'}
              </button>
              <button onClick={handleVerify} disabled={loadingStates.verify || isAnyLoading} className="px-4 py-2 rounded bg-primary-600 text-white disabled:opacity-50 font-medium">
                {loadingStates.verify ? 'Processing...' : 'Verify Payments'}
              </button>
              <button onClick={handleExportReport} disabled={loadingStates.export || isAnyLoading} className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50">
                {loadingStates.export ? 'Exporting...' : 'Export Report'}
              </button>
              <button onClick={handleRewrite} disabled={loadingStates.rewrite || isAnyLoading} className="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-50">
                {loadingStates.rewrite ? 'Rewriting...' : 'Rewrite Master'}
              </button>
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
                  {['customerName','eventStartsAt','membershipName','classType','sessionType','instructors','status','discount','discountPercentage','verificationStatus','actions','invoiceNumber','invoiceAmount','amount','paymentDate','tax','numberOfSessions','discountedSessionPrice','coachAmount','managementAmount','mfcAmount','changeHistory'].map((key, idx) => (
                    <th key={key} onClick={() => handleSort(key as keyof MasterRow)} className="px-3 py-2 text-left font-semibold whitespace-nowrap cursor-pointer select-none text-white">
                      {['Customer Name','Event Starts At','Membership Name','Class Type','Session Type','Instructors','Status','Discount','Discount %','Verification Status','Actions','Invoice #','Invoiced Amount','Verified Amount','Payment Date','Tax','Number of Sessions','Discounted Session Price','Coach Amount','Management Amount','MFC Amount','Change History'][idx]}
                      {sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, idx) => {
                  const isEditing = editingKey && r.uniqueKey === editingKey && r.uniqueKey !== undefined && r.uniqueKey !== ''
                  const draft = isEditing ? { ...r, ...editDraft } : r
                  // Debug logging for editing state
                  if (isEditing) {
                    console.log(`✏️ Row ${idx} is in editing mode. UniqueKey: ${r.uniqueKey}, EditingKey: ${editingKey}`);
                  }
                  return (
                    <tr key={r.uniqueKey || `row-${idx}`} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-3 py-2 whitespace-nowrap text-white">{draft.customerName}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">{draft.eventStartsAt}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">{draft.membershipName}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">{draft.classType || ''}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">{draft.sessionType || ''}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">{draft.instructors}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">{draft.status}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">
                        {isEditing ? (
                          <input className="w-32 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded" value={`${draft.discount ?? ''}`} onChange={(e)=>dispatch(updateEditDraft({discount: e.target.value}))} />
                        ) : (
                          draft.discount
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input 
                            type="number" 
                            step="0.01" 
                            className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" 
                            value={`${draft.discountPercentage ?? 0}`} 
                            onChange={(e)=>dispatch(updateEditDraft({discountPercentage: parseFloat(e.target.value || '0')}))} 
                          />
                        ) : (
                          Number(draft.discountPercentage || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap" onDoubleClick={() => { 
                        if (r.uniqueKey) {
                          console.log('🖱️ Double-clicked row with uniqueKey:', r.uniqueKey);
                          console.log('🔍 Row data:', { customer: r.customerName, date: r.eventStartsAt, membership: r.membershipName });
                          console.log('📝 Current editingKey before set:', editingKey);
                          dispatch(setEditingKey(r.uniqueKey)); 
                          dispatch(setEditDraft({}));
                        } else {
                          console.warn('⚠️ Row has no uniqueKey, cannot edit');
                          toast.error('Cannot edit row: missing unique identifier');
                        }
                      }}>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(draft.verificationStatus)}`}>
                          {draft.verificationStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button 
                              className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50" 
                              onClick={() => handleSaveEdit(r)}
                              disabled={loadingStates.saveEdit}
                            >
                              {loadingStates.saveEdit ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button className="px-3 py-1 rounded bg-gray-600 text-white" onClick={handleCancelEdit}>Cancel</button>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">
                        {isEditing ? (
                          <input className="w-40 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded" value={`${draft.invoiceNumber ?? ''}`} onChange={(e)=>dispatch(updateEditDraft({invoiceNumber: e.target.value}))} />
                        ) : (
                          draft.invoiceNumber
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {Number((draft as any).invoiceAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input 
                            type="number" 
                            step="0.01" 
                            className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" 
                            value={`${draft.amount ?? 0}`} 
                            onChange={(e)=>dispatch(updateEditDraft({amount: parseFloat(e.target.value || '0')}))} 
                          />
                        ) : (
                          Number(draft.amount || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">
                        {isEditing ? (
                          <input 
                            type="date" 
                            className="w-40 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded" 
                            value={`${draft.paymentDate ?? ''}`} 
                            onChange={(e)=>dispatch(updateEditDraft({paymentDate: e.target.value}))} 
                          />
                        ) : (
                          draft.paymentDate
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input 
                            type="number" 
                            step="0.01" 
                            className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" 
                            value={`${draft.tax ?? 0}`} 
                            onChange={(e)=>dispatch(updateEditDraft({tax: parseFloat(e.target.value || '0')}))} 
                          />
                        ) : (
                          Number(draft.tax || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {Number(draft.numberOfSessions || 0).toFixed(0)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input type="number" step="0.01" className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" value={`${draft.discountedSessionPrice ?? 0}`} onChange={(e)=>dispatch(updateEditDraft({discountedSessionPrice: parseFloat(e.target.value || '0')}))} />
                        ) : (
                          Number(draft.discountedSessionPrice || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input type="number" step="0.01" className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" value={`${draft.coachAmount ?? 0}`} onChange={(e)=>dispatch(updateEditDraft({coachAmount: parseFloat(e.target.value || '0')}))} />
                        ) : (
                          Number(draft.coachAmount || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input type="number" step="0.01" className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" value={`${draft.managementAmount ?? 0}`} onChange={(e)=>dispatch(updateEditDraft({managementAmount: parseFloat(e.target.value || '0')}))} />
                        ) : (
                          Number(draft.managementAmount || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-white">
                        {isEditing ? (
                          <input type="number" step="0.01" className="w-24 px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded text-right" value={`${draft.mfcAmount ?? 0}`} onChange={(e)=>dispatch(updateEditDraft({mfcAmount: parseFloat(e.target.value || '0')}))} />
                        ) : (
                          Number(draft.mfcAmount || 0).toFixed(2)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-white">{draft.changeHistory || ''}</td>
                    </tr>
                  )
                })}
                {isAnyLoading && (
                  <tr><td className="px-3 py-4 text-gray-500" colSpan={18}>Loading...</td></tr>
                )}
                {!isAnyLoading && sorted.length === 0 && (
                  <tr><td className="px-3 py-4 text-gray-500" colSpan={18}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={loadPaymentVerification}
                disabled={paymentLoading}
                className="px-3 py-2 rounded bg-primary-600 text-white disabled:opacity-50"
              >
                {paymentLoading ? 'Loading...' : 'Refresh'}
              </button>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {paymentData.length > 0 ? `${paymentData.length} invoice${paymentData.length === 1 ? '' : 's'} loaded` : 'No data loaded yet'}
              </span>
            </div>
            <input
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-72 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
              placeholder="Search invoices, customers, packages..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="bg-gray-800 text-white rounded-lg p-3">
              <div className="text-xs uppercase tracking-wide text-gray-400">Total Invoices</div>
              <div className="text-2xl font-semibold">{paymentStats.totalInvoices}</div>
            </div>
            <div className="bg-gray-800 text-white rounded-lg p-3">
              <div className="text-xs uppercase tracking-wide text-gray-400">Attendance Verified</div>
              <div className="text-2xl font-semibold">{paymentStats.attendanceVerifiedCount}</div>
            </div>
            <div className="bg-gray-800 text-white rounded-lg p-3">
              <div className="text-xs uppercase tracking-wide text-gray-400">Not Verified %</div>
              <div className="text-2xl font-semibold">{formatPercent(paymentStats.attendanceUnverifiedPercent)}</div>
            </div>
            <div className="bg-gray-800 text-white rounded-lg p-3">
              <div className="text-xs uppercase tracking-wide text-gray-400">Total Net Price</div>
              <div className="text-2xl font-semibold">{formatCurrency(paymentStats.totalNetPrice)}</div>
            </div>
            <div className="bg-gray-800 text-white rounded-lg p-3">
              <div className="text-xs uppercase tracking-wide text-gray-400">Total Tax</div>
              <div className="text-2xl font-semibold">{formatCurrency(paymentStats.totalTax)}</div>
            </div>
          </div>

          <div className="relative border border-gray-200 dark:border-gray-700 rounded max-h-[calc(100vh-300px)] overflow-x-auto overflow-y-auto">
            <table className="min-w-[1300px] text-sm">
              <thead className="sticky top-0 bg-gray-800 text-white z-10">
                <tr>
                  {paymentColumns.map(col => (
                    <th
                      key={col.key}
                      onClick={() => handlePaymentSort(col.key)}
                      className={`px-3 py-2 text-left font-semibold whitespace-nowrap cursor-pointer select-none ${col.align === 'right' ? 'text-right' : ''}`}
                    >
                      {col.label}
                      {paymentSortKey === col.key ? (paymentSortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedPaymentData.map((row, idx) => (
                  <tr key={`${row.invoice}-${idx}`} className="border-t border-gray-100 dark:border-gray-700">
                    {paymentColumns.map((col) => {
                      const cellValue = col.format ? col.format(row) : (row[col.key] ?? '')
                      const alignClass = col.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                      return (
                        <td
                          key={col.key}
                          className={`px-3 py-2 whitespace-nowrap text-white ${alignClass}`}
                        >
                          {cellValue}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {paymentLoading && (
                  <tr>
                    <td className="px-3 py-4 text-gray-400" colSpan={paymentColumns.length}>Loading payment verification data...</td>
                  </tr>
                )}
                {!paymentLoading && sortedPaymentData.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-gray-400" colSpan={paymentColumns.length}>
                      {paymentData.length === 0 ? 'No payment verification data loaded yet. Click Refresh to load data.' : 'No matching records for your search.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">Verification Summary section - Coming soon</div>
      )}

      {activeTab === 3 && (
        <div className="space-y-4">
          {selectedCoach ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Sessions for {selectedCoach}</h2>
                <button
                  onClick={handleBackToSummary}
                  className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
                >
                  Back to Summary
                </button>
              </div>

              <div className="relative border border-gray-200 dark:border-gray-700 rounded max-h-[calc(100vh-250px)] overflow-x-auto overflow-y-auto">
                <table className="min-w-[1000px] text-sm">
                  <thead className="sticky top-0 bg-gray-800 text-white z-10">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Date</th>
                      <th className="px-3 py-2 text-left font-semibold">Customer</th>
                      <th className="px-3 py-2 text-left font-semibold">Session Type</th>
                      <th className="px-3 py-2 text-right font-semibold">Session Amount</th>
                      <th className="px-3 py-2 text-right font-semibold">Coach Amount</th>
                      <th className="px-3 py-2 text-right font-semibold">BGM Amount</th>
                      <th className="px-3 py-2 text-right font-semibold">Management Amount</th>
                      <th className="px-3 py-2 text-right font-semibold">MFC Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coachSessions.map((session, idx) => (
                      <tr key={idx} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2 whitespace-nowrap text-white">{session.date}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-white">{session.customer}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-white">{session.sessionType}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-white">€{session.sessionAmount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-green-400 font-medium">€{session.coachAmount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-blue-400">€{session.bgmAmount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-purple-400">€{session.managementAmount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-orange-400">€{session.mfcAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                    {coachSessionsLoading && (
                      <tr><td className="px-3 py-4 text-gray-500 text-center" colSpan={8}>Loading coach sessions...</td></tr>
                    )}
                    {!coachSessionsLoading && coachSessions.length === 0 && (
                      <tr><td className="px-3 py-4 text-gray-500 text-center" colSpan={8}>No sessions found for this coach.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={coachesDateRange.fromDate}
                    onChange={(e) => handleCoachesDateRangeChange('fromDate', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
                    placeholder="From Date"
                  />
                  <input
                    type="date"
                    value={coachesDateRange.toDate}
                    onChange={(e) => handleCoachesDateRangeChange('toDate', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
                    placeholder="To Date"
                  />
                  <input
                    type="text"
                    value={coachesFilterText}
                    onChange={(e) => setCoachesFilterText(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
                    placeholder="Filter by coach name"
                  />
                  <button
                    onClick={loadCoachesSummary}
                    disabled={coachesSummaryLoading}
                    className="px-4 py-2 rounded bg-primary-600 text-white disabled:opacity-50 font-medium"
                  >
                    {coachesSummaryLoading ? 'Loading...' : 'Load Summary'}
                  </button>
                  <button
                    onClick={exportCoachesCSV}
                    disabled={sortedCoaches.length === 0}
                    className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50 font-medium"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="text-sm text-white bg-gray-800 p-3 rounded-lg">
                <span className="mr-4 font-medium">Total Coaches: {sortedCoaches.length}</span>
                <span className="mr-4">Total Sessions: {sortedCoaches.reduce((acc, coach) => acc + coach.totalSessions, 0)}</span>
                <span className="mr-4 text-green-400">Total Coach Amount: €{sortedCoaches.reduce((acc, coach) => acc + coach.totalCoachAmount, 0).toFixed(2)}</span>
              </div>

              <div className="relative border border-gray-200 dark:border-gray-700 rounded max-h-[calc(100vh-300px)] overflow-x-auto overflow-y-auto">
                <table className="min-w-[1200px] text-sm">
                  <thead className="sticky top-0 bg-gray-800 text-white z-10">
                    <tr>
                      {[
                        {key:'coachName', label:'Coach Name'},
                        {key:'totalSessions', label:'Sessions'},
                        {key:'totalAmount', label:'Total Amount'},
                        {key:'totalCoachAmount', label:'Coach Amount'},
                        {key:'totalBgmAmount', label:'BGM Amount'},
                        {key:'totalManagementAmount', label:'Management Amount'},
                        {key:'totalMfcAmount', label:'MFC Amount'},
                        {key:'averageSessionAmount', label:'Avg Session'}
                      ].map(col => (
                        <th key={col.key} onClick={() => handleCoachesSort(col.key as any)} className="px-3 py-2 text-left font-semibold whitespace-nowrap cursor-pointer select-none">
                          {col.label}{coachesSortKey === col.key ? (coachesSortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCoaches.map((coach, idx) => (
                      <tr key={coach.coachName || idx} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2 whitespace-nowrap text-white font-medium">{coach.coachName}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-white">{coach.totalSessions}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-white">€{coach.totalAmount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-green-400 font-medium">€{coach.totalCoachAmount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-blue-400">€{coach.totalBgmAmount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-purple-400">€{coach.totalManagementAmount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-orange-400">€{coach.totalMfcAmount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-white">€{coach.averageSessionAmount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => loadCoachSessions(coach.coachName)}
                            className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                          >
                            View Sessions
                          </button>
                        </td>
                      </tr>
                    ))}
                    {coachesSummaryLoading && (
                      <tr><td className="px-3 py-4 text-gray-500 text-center" colSpan={9}>Loading coaches summary...</td></tr>
                    )}
                    {!coachesSummaryLoading && sortedCoaches.length === 0 && (
                      <tr><td className="px-3 py-4 text-gray-500 text-center" colSpan={9}>No coaches data available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 2 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">Verification Summary section - Coming soon</div>
      )}
    </div>
  )
}

export default VerificationManager





