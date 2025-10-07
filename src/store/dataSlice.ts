import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AttendanceRecord {
  id: string
  customer: string
  email: string
  date: string
  time: string
  classType: string
  venue: string
  instructors: string
  bookingMethod: string
  membership: string
  bookingSource: string
  status: string
}

interface PaymentRecord {
  id: string
  date: string
  customer: string
  memo: string
  amount: number
  invoice: string
}

interface DataState {
  attendanceData: AttendanceRecord[]
  paymentData: PaymentRecord[]
  isLoading: boolean
  error: string | null
}

const initialState: DataState = {
  attendanceData: [],
  paymentData: [],
  isLoading: false,
  error: null,
}

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setAttendanceData: (state, action: PayloadAction<AttendanceRecord[]>) => {
      state.attendanceData = action.payload
    },
    setPaymentData: (state, action: PayloadAction<PaymentRecord[]>) => {
      state.paymentData = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearData: (state) => {
      state.attendanceData = []
      state.paymentData = []
      state.error = null
    },
  },
})

export const {
  setAttendanceData,
  setPaymentData,
  setLoading,
  setError,
  clearData,
} = dataSlice.actions

export default dataSlice.reducer 