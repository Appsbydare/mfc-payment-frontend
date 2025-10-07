import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  token: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.token = null
    },
  },
})

export const { setUser, setToken, logout } = authSlice.actions
export default authSlice.reducer 