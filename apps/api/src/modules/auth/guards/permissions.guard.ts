import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type AuthenticatedUser, type Permission, RoleName } from '@app/shared';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import { Observable } from 'rxjs';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest().user as
      AuthenticatedUser | undefined;
    if (!user) throw new ForbiddenException('Without active session');

    const missing = required.filter((p) => !user.permissions.includes(p));
    if (missing.length) {
      throw new ForbiddenException(`Missing Permissions ${missing.join(', ')}`);
    }
    return true;
  }
}
