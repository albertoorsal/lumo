import { contextBridge, ipcMain, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IpcResult, LoginRequest, SessionResult } from '@app/shared'

const api = {
  auth: {
    login: (credentials: LoginRequest): Promise<IpcResult<SessionResult>> =>
      ipcRenderer.invoke('auth:login', credentials),

    refresh: (): Promise<IpcResult<SessionResult>> => ipcRenderer.invoke('auth:refresh'),

    logout: (): Promise<IpcResult<null>> => ipcRenderer.invoke('auth:logout'),

    hasSession: (): Promise<IpcResult<boolean>> => ipcRenderer.invoke('auth:has-session')
  },

  apiUrl: (): string => 'http://localhost:3000/api'
} as const

export type AppApi = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
    throw new Error('contextIsolation must be disable')
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
