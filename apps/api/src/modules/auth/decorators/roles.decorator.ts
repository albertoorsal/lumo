import { SetMetadata } from '@nestjs/common';
import type { RoleName } from '@app/shared';

export const ROLES_KEY = 'requiredRoles';
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
