import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller.js';
import { User } from './entities/user.entity.js';
import { Role } from '../rbac/entities/role.entity.js';
import { Permission } from '../rbac/entities/permissions.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission])],
  controllers: [UsersController],
  exports: [TypeOrmModule],
})
export class UsersModule {}
