import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CoachPayment {
  id: string
  name: string
  groupClasses: number
  privateSessions: number
  totalStudents: number
  grossRevenue: number
  coachPayment: number
}

interface BGMPayment {
  id: string
  revenueSource: string
  totalRevenue: number
  bgmPercentage: number
  bgmPayment: number
}

interface ManagementPayment {
  id: string
  revenueSource: string
  totalRevenue: number
  managementPercentage: number
  managementPayment: number
}

interface PaymentsState {
  coachPayments: CoachPayment[]
  bgmPayments: BGMPayment[]
  managementPayments: ManagementPayment[]
  isLoading: boolean
  error: string | null
}

const initialState: PaymentsState = {
  coachPayments: [],
  bgmPayments: [],
  managementPayments: [],
  isLoading: false,
  error: null,
}

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    setCoachPayments: (state, action: PayloadAction<CoachPayment[]>) => {
      state.coachPayments = action.payload
    },
    setBGMPayments: (state, action: PayloadAction<BGMPayment[]>) => {
      state.bgmPayments = action.payload
    },
    setManagementPayments: (state, action: PayloadAction<ManagementPayment[]>) => {
      state.managementPayments = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearPayments: (state) => {
      state.coachPayments = []
      state.bgmPayments = []
      state.managementPayments = []
      state.error = null
    },
  },
})

export const {
  setCoachPayments,
  setBGMPayments,
  setManagementPayments,
  setLoading,
  setError,
  clearPayments,
} = paymentsSlice.actions

export default paymentsSlice.reducer 