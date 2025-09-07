import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  isDarkMode: boolean
  sidebarOpen: boolean
  loading: boolean
  currentPage: string
}

// Load theme from localStorage on initialization
const getInitialTheme = (): boolean => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('mfc-theme')
    if (savedTheme !== null) {
      return savedTheme === 'dark'
    }
  }
  return false
}

const initialState: UIState = {
  isDarkMode: getInitialTheme(),
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
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('mfc-theme', state.isDarkMode ? 'dark' : 'light')
      }
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('mfc-theme', state.isDarkMode ? 'dark' : 'light')
      }
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