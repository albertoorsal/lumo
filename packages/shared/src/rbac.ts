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
 * granular permissios in format `resources:action`
 * A role is a container of permissions; the guards evaluates permisions, not roles
 * excepto in very specific cases.
 */
export const Permission = {
  USERS_READ: "users:read",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
  ROLES_READ: "roles:read",
  ROLES_ASSIGN: "roles:assing",
  AUDIT_READ: "audit:read",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

/**
 * MATRIX ROLE -> Permissions. The source of the thurth for seed
 */
export const ROLES_PERMISSIONS: Record<RoleName, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission),
  ADMIN: [
    Permission.USERS_READ,
    Permission.USERS_UPDATE,
    Permission.USERS_DELETE,
    Permission.ROLES_READ,
  ],
  USER: [],
};

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  "users:read": "List and view users",
  "users:create": "Create users",
  "users:update": "Edit users",
  "users:delete": "Delete users",
  "roles:read": "List and view roles and permissions",
  "roles:assing": "Assign roles to users",
  "audit:read": "View the audit log",
};
