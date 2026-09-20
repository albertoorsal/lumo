import type { ReactNode } from 'react'
import { type Permission, RoleName } from '@app/shared'
import { useGetMeQuery } from '../features/auth/authApi'

export function usePermissions() {
  const { data: me } = useGetMeQuery()

  const isSuperAdmin = me?.roles.includes(RoleName.SUPER_ADMIN) ?? false

  return {
    me,
    isSuperAdmin,
    can: (...required: Permission[]): boolean =>
      isSuperAdmin || required.every((p) => me?.permissions.includes(p) ?? false),
    canAny: (...required: Permission[]): boolean =>
      isSuperAdmin || required.some((p) => me?.permissions.includes(p) ?? false),
    hasRole: (role: RoleName): boolean => me?.roles.includes(role) ?? false
  }
}

interface CanProps {
  permission?: Permission | Permission[]
  role?: RoleName
  fallback?: ReactNode
  children: ReactNode
}

export function Can({ permission, role, fallback = null, children }: CanProps) {
  const { can, hasRole } = usePermissions()

  const permissionOk = permission
    ? can(...(Array.isArray(permission) ? permission : [permission]))
    : true
  const roleOk = role ? hasRole(role) : true

  return <>{permissionOk && roleOk ? children : fallback}</>
}
