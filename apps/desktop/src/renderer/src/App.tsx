import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Permission } from '@app/shared'
import { useAppDispatch } from './app/hooks'
import { bootstrapSession } from './features/auth/authSlice'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProtectedRoute } from './shared/ProtectedRoute'

export default function App() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    void dispatch(bootstrapSession())
  }, [dispatch])

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
        </Route>
        <Route element={<ProtectedRoute permission={Permission.AUDIT_READ} />}>
          <Route path="/auditoria" element={<div>Bitácora</div>} />
        </Route>
        <Route path="/denegado" element={<p>403 — Acceso denegado</p>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
