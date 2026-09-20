/**
 * System Roles
 */
export const RoleName = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type RoleName = (typeof RoleName)[keyof typeof RoleName];

/**
 * Granular permissions in the format `resource:action`.
 * A role is a container of permissions; the guards evaluate permissions, not
 * roles, except in very specific cases.
 */
export const Permission = {
  USERS_READ: "users:read",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
  ROLES_READ: "roles:read",
  ROLES_ASSIGN: "roles:assign",
  AUDIT_READ: "audit:read",
  COMPANIES_READ: "companies:read",
  COMPANIES_CREATE: "companies:create",
  COMPANIES_UPDATE: "companies:update",
  COMPANIES_DELETE: "companies:delete",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

/**
 * ROLE -> Permissions matrix. The source of truth for the seed.
 */
export const ROLES_PERMISSIONS: Record<RoleName, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission),
  ADMIN: [
    Permission.USERS_READ,
    Permission.USERS_UPDATE,
    Permission.USERS_DELETE,
    Permission.ROLES_READ,
    Permission.COMPANIES_READ,
    Permission.COMPANIES_CREATE,
    Permission.COMPANIES_UPDATE,
    Permission.COMPANIES_DELETE,
  ],
  USER: [],
};

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  "users:read": "List and view users",
  "users:create": "Create users",
  "users:update": "Edit users",
  "users:delete": "Delete users",
  "roles:read": "List and view roles and permissions",
  "roles:assign": "Assign roles to users",
  "audit:read": "View the audit log",
  "companies:read": "List and view companies",
  "companies:create": "Create companies",
  "companies:update": "Edit companies",
  "companies:delete": "Delete companies",
};
