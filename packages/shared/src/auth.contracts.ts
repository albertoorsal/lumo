import type { Permission, RoleName } from "./rbac.js";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SessionResult {
  accessToken: string;
  expiresIn: number;
}

// VERIFY ME Response
export interface AuthenticatedUser {
  id: string;
  username: string;
  fullName: string | null;
  isActive: boolean;
  roles: RoleName[];
  permissions: Permission[];
  lastLoginAt: string | null;
}

export interface IpcResult<T> {
  ok: Boolean;
  data?: T;
  error?: { code: string; message: string };
}
