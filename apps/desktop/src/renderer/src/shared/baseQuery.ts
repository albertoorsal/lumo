import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { BaseQueryFn, FetchArgs, fetchBaseQuery, RootState } from '@reduxjs/toolkit/query'
import { sessionExpired, tokenRefreshed } from '@renderer/features/auth/authSlice'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: window.api.apiUrl(),
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  }
})

let refreshInFlight: Promise<string | null> | null = null

function refreshOnce(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = window.api.auth
      .refresh()
      .then((r) => (r.ok && r.data ? r.data.accessToken : null))
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    const newToken = await refreshOnce()
    if (newToken) {
      api.dispatch(tokenRefreshed(newToken))
      result = await rawBaseQuery(args, api, extraOptions) // re-try
    } else {
      api.dispatch(sessionExpired())
    }
  }

  return result
}
