import { LoginRequest } from '@app/shared'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'

export type AuthStatus =
  | 'bootstrapping' // Save sessions
  | 'anonymous'
  | 'authenticating'
  | 'authenticated'

interface AuthState {
  accessToken: string | null
  status: AuthStatus
  error: null
}

const initialState: AuthState = {
  accessToken: null,
  status: 'bootstrapping',
  error: null
}

export const bootstrapSession = createAsyncThunk<string | null, void, { rejectValue: string }>(
  'auth/bootstrap',
  async () => {
    const result = await window.api.auth.refresh()
    return result.ok && result.data ? result.data.accessToken : null
  }
)

export const login = createAsyncThunk<string, LoginRequest, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    const result = await window.api.auth.login(credentials)
    if (!result.ok || !result.data) {
      return rejectWithValue(result.error?.message ?? 'Login was not succesfull')
    }
    return result.data.accessToken
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  await window.api.auth.logout()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    tokenRefreshed(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
      state.status = 'authenticated'
    },
    sessionExpired(state) {
      state.accessToken = null
      state.status = 'anonymous'
      state.error = 'Session expired. Try login again'
    },
    clearError(state) {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.accessToken = action.payload
        state.status = action.payload ? 'authenticated' : 'anonymous'
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.status = 'anonymous'
      })
      .addCase(login.pending, (state) => {
        state.status = 'authenticating'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.accessToken = action.payload
        state.status = 'authenticated'
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'anonymous'
        state.accessToken = null
        state.error = action.payload ?? 'Login was not succesfull'
      })
      .addCase(logout.fulfilled, (state) => {
        state.accessToken = null
        state.status = 'anonymous'
        state.error = null
      })
  }
})

export const { tokenRefreshed, sessionExpired, clearError } = authSlice.actions
export default authSlice.reducer
