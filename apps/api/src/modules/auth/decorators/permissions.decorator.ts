import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@app/shared';

export const PERMISSIONS_KEY = 'requiredPermissions';

export const RequiredPermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
