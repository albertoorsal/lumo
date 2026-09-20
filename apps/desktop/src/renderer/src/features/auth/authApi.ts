import { AuthenticatedUser, RoleName } from '@app/shared'
import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@renderer/shared/baseQuery'

export interface UserListItem {
  id: string
  email: string
  fullName: string | null
  isActive: boolean
  roles: RoleName[]
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Me', 'Users'],
  endpoints: (builder) => ({
    /** verifyme */
    getMe: builder.query<AuthenticatedUser, void>({
      query: () => '/auth/me',
      providesTags: ['Me']
    }),
    getUsers: builder.query<UserListItem[], void>({
      query: () => '/users',
      providesTags: ['Users']
    })
  })
})

export const { useGetMeQuery, useGetUsersQuery } = api
