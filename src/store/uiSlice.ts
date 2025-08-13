import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  isDarkMode: boolean
  sidebarOpen: boolean
  loading: boolean
  currentPage: string
}

const initialState: UIState = {
  isDarkMode: false,
  sidebarOpen: true,
  loading: false,
  currentPage: 'dashboard',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload
    },
  },
})

export const {
  toggleDarkMode,
  setDarkMode,
  toggleSidebar,
  setSidebarOpen,
  setLoading,
  setCurrentPage,
} = uiSlice.actions

export default uiSlice.reducer 