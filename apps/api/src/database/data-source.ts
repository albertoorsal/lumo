import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../modules/users/entities/user.entity.js';
import { Role } from '../modules/rbac/entities/role.entity.js';
import { Permission } from '../modules/rbac/entities/permissions.entity.js';
import { RefreshToken } from '../auth/entities/refresh-token.entity.js';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Role, Permission, RefreshToken],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging:
    process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
};

export default new DataSource(dataSourceOptions);
