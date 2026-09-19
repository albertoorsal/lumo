import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '@app/shared';
import { User } from './entities/user.entity.js';
import { PermissionGuard } from '../auth/guards/permissions.guard.js';
import { RequiredPermissions } from '../auth/decorators/permissions.decorator.js';

@UseGuards(PermissionGuard)
@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  @RequiredPermissions(Permission.USERS_READ)
  @Get()
  async findAll() {
    const rows = await this.users.find({ relations: { roles: true } });
    return rows.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      isActive: u.isActive,
      roles: u.roles.map((r) => r.name),
    }));
  }
}
