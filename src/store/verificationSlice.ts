import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface MasterRow {
  customerName: string
  eventStartsAt: string
  membershipName: string
  classType?: string
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

interface VerificationState {
  activeTab: number
  masterData: MasterRow[]
  summary: any | null
  filter: string
  sortKey: string
  sortDir: 'asc' | 'desc'
  existingKeys: string[]
  pendingEdits: Record<string, MasterRow>
  editingKey: string
  editDraft: Partial<MasterRow>
}

const initialState: VerificationState = {
  activeTab: 0,
  masterData: [],
  summary: null,
  filter: '',
  sortKey: '',
  sortDir: 'asc',
  existingKeys: [],
  pendingEdits: {},
  editingKey: '',
  editDraft: {},
}

const verificationSlice = createSlice({
  name: 'verification',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<number>) => {
      state.activeTab = action.payload
    },
    setMasterData: (state, action: PayloadAction<MasterRow[]>) => {
      state.masterData = action.payload
    },
    setSummary: (state, action: PayloadAction<any>) => {
      state.summary = action.payload
    },
    setFilter: (state, action: PayloadAction<string>) => {
      state.filter = action.payload
    },
    setSorting: (state, action: PayloadAction<{ key: string; dir: 'asc' | 'desc' }>) => {
      state.sortKey = action.payload.key
      state.sortDir = action.payload.dir
    },
    setExistingKeys: (state, action: PayloadAction<string[]>) => {
      state.existingKeys = action.payload
    },
    setPendingEdits: (state, action: PayloadAction<Record<string, MasterRow>>) => {
      state.pendingEdits = action.payload
    },
    updatePendingEdit: (state, action: PayloadAction<{ key: string; data: MasterRow }>) => {
      state.pendingEdits[action.payload.key] = action.payload.data
    },
    removePendingEdit: (state, action: PayloadAction<string>) => {
      delete state.pendingEdits[action.payload]
    },
    setEditingKey: (state, action: PayloadAction<string>) => {
      state.editingKey = action.payload
    },
    setEditDraft: (state, action: PayloadAction<Partial<MasterRow>>) => {
      state.editDraft = action.payload
    },
    updateEditDraft: (state, action: PayloadAction<Partial<MasterRow>>) => {
      state.editDraft = { ...state.editDraft, ...action.payload }
    },
    clearEditState: (state) => {
      state.editingKey = ''
      state.editDraft = {}
    },
    updateMasterRow: (state, action: PayloadAction<MasterRow>) => {
      const index = state.masterData.findIndex(r => r.uniqueKey === action.payload.uniqueKey)
      if (index >= 0) {
        state.masterData[index] = action.payload
      }
    },
    clearAllState: (state) => {
      Object.assign(state, initialState)
    },
  },
})

export const {
  setActiveTab,
  setMasterData,
  setSummary,
  setFilter,
  setSorting,
  setExistingKeys,
  setPendingEdits,
  updatePendingEdit,
  removePendingEdit,
  setEditingKey,
  setEditDraft,
  updateEditDraft,
  clearEditState,
  updateMasterRow,
  clearAllState,
} = verificationSlice.actions

export default verificationSlice.reducer
