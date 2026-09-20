import type { Permission } from '@app/shared'
import { useAppSelector } from '@renderer/app/hooks'
import { usePermissions } from '@renderer/shared/Can'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export function ProtectedRoute({ permission }: { permission?: Permission }) {
  const status = useAppSelector((s) => s.auth.status)
  const location = useLocation()
  const { me, can } = usePermissions()

  if (status === 'bootstrapping') {
    return <p className="centered">Restoring session</p>
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!me) return <p className="centered">Loading profile...</p>

  if (permission && !can(permission)) {
    return <Navigate to="/denied" replace />
  }

  return <Outlet />
}
