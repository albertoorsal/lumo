import { ipcMain } from 'electron'
import type { IpcResult, LoginRequest, SessionResult } from '@app/shared'
import { tokenStore } from './token-store'
import { retry } from '@reduxjs/toolkit/query'

const API_URL = process.env.VITE_API_URL ?? 'http://localhost:3000/api'

interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    const err = new Error(payload.message ?? `HTTP ${res.status}`)
    ;(err as Error & { status?: number }).status = res.status
    throw err
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

function ok<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function fail(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } }
}

export function registerAuthIpc(): void {
  // Returns just access token to renderer
  ipcMain.handle(
    'auth:login',
    async (_e, credentials: LoginRequest): Promise<IpcResult<SessionResult>> => {
      try {
        if (
          typeof credentials?.username !== 'string' ||
          typeof credentials?.password !== 'string'
        ) {
          return fail('BAD_REQUEST', 'Credenciales malformadas')
        }

        const pair = await post<TokenPair>('/auth/login', {
          username: credentials.username.trim().toLowerCase(),
          password: credentials.password
        })

        await tokenStore.save(pair.refreshToken)
        return ok({ accessToken: pair.accessToken, expiresIn: pair.expiresIn })
      } catch (e) {
        const status = (e as { status?: number }).status
        if (status === 401) return fail('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos')
        if (status === 403) return fail('ACCOUNT_DISABLED', 'La cuenta está deshabilitada')
        if (status === 429) return fail('RATE_LIMITED', 'Demasiados intentos, espera un momento')
        return fail('NETWORK', 'No se pudo contactar al servidor')
      }
    }
  )

  // Renews the session using refresh saved token
  ipcMain.handle('auth:refresh', async (): Promise<IpcResult<SessionResult>> => {
    const refreshToken = await tokenStore.load()
    if (!refreshToken) return fail('NO_SESSION', 'No hay sesión guardada')

    try {
      const pair = await post<TokenPair>('/auth/refresh', { refreshToken })
      await tokenStore.save(pair.refreshToken) // rotación: guardamos el nuevo
      return ok({ accessToken: pair.accessToken, expiresIn: pair.expiresIn })
    } catch (e) {
      const status = (e as { status?: number }).status
      if (status === 401) {
        await tokenStore.clear()
        return fail('SESSION_EXPIRED', 'La sesión expiró')
      }
      return fail('NETWORK', 'No se pudo contactar al servidor')
    }
  })

  ipcMain.handle('auth:logout', async (): Promise<IpcResult<null>> => {
    const refreshToken = await tokenStore.load()
    await tokenStore.clear()
    if (refreshToken) {
      await post<void>('/auth/logout', { refreshToken }).catch(() => undefined)
    }
    return ok(null)
  })

  ipcMain.handle('auth:has-session', async (): Promise<IpcResult<boolean>> => {
    return ok((await tokenStore.load()) !== null)
  })
}
