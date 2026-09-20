import { app, safeStorage } from 'electron'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

const FILE = () => join(app.getPath('userData'), 'session.bin')

/**
 * Persiste Refresh Token with the API of credentials
 * Keychain in macOs, DPAPI in Windows, libsecret linux.
 * If safestorage is not available, Not write in disk
 * Prefer the user login again each time
 */
class TokenStorage {
  private memoryOnly: string | null = null

  private get encryptionAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  async save(refreshToken: string) {
    if (!this.encryptionAvailable) {
      this.memoryOnly = refreshToken
      return
    }

    const encrypted = safeStorage.encryptString(refreshToken)
    await fs.writeFile(FILE(), encrypted, { mode: 0o600 })
  }

  async load(): Promise<string | null> {
    if (!this.encryptionAvailable) return this.memoryOnly

    try {
      const buffer = await fs.readFile(FILE())
      return safeStorage.decryptString(buffer)
    } catch {
      return null
    }
  }

  async clear(): Promise<void> {
    this.memoryOnly = null
    await fs.rm(FILE(), { force: true })
  }
}

export const tokenStore = new TokenStorage()
