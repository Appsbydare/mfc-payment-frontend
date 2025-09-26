import { configureStore } from '@reduxjs/toolkit'
import authSlice from './authSlice'
import dataSlice from './dataSlice'
import paymentsSlice from './paymentsSlice'
import uiSlice from './uiSlice'
import verificationSlice from './verificationSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    data: dataSlice,
    payments: paymentsSlice,
    ui: uiSlice,
    verification: verificationSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 