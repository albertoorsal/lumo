import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { clearError, login } from './authSlice'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const { status, error } = useAppSelector((s) => s.auth)
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const submitting = status === 'authenticating'

  if (status === 'authenticated') {
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    dispatch(clearError())
    await dispatch(login({ username: username.trim(), password }))
    setPassword('')
  }

  return (
    <main className="login">
      <form onSubmit={handleSubmit} noValidate>
        <h1>Iniciar sesión</h1>

        <label htmlFor="username">Correo</label>
        <input
          id="username"
          type="username"
          value={username}
          autoComplete="username"
          required
          disabled={submitting}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          autoComplete="current-password"
          required
          disabled={submitting}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting || !username || !password}>
          {submitting ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
