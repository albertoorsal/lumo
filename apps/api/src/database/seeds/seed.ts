import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import {
  PERMISSION_DESCRIPTIONS,
  ROLES_PERMISSIONS,
  RoleName,
  Permission as PermissionCode,
} from '@app/shared';
import { Role } from '../../modules/rbac/entities/role.entity.js';
import { Permission } from '../../modules/rbac/entities/permissions.entity.js';
import { User } from '../../modules/users/entities/user.entity.js';

const ARGON_OPTIONS: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const WEAK_DEFAULTS = [
  'ChangeThisPassword_2026!',
  'changeme',
  'admin',
  'password',
  'Password123',
];

export interface SeedOptions {
  username: string;
  password: string;
  fullName: string;
  isProduction: boolean;
}

export async function runSeed(
  ds: DataSource,
  opts: SeedOptions,
): Promise<void> {
  guardPassword(opts);

  await ds.transaction(async (manager) => {
    // ---------------------------------------------------- 1) permissions
    const permRepo = manager.getRepository(Permission);
    const permissionByCode = new Map<string, Permission>();

    for (const code of Object.values(PermissionCode)) {
      let perm = await permRepo.findOne({ where: { code } });
      if (!perm) {
        perm = permRepo.create({
          code,
          description: PERMISSION_DESCRIPTIONS[code],
        });
        console.log(`  + permission ${code}`);
      } else {
        perm.description = PERMISSION_DESCRIPTIONS[code]; // keep the description up to date
      }
      permissionByCode.set(code, await permRepo.save(perm));
    }

    // ------------------------------------------------------- 2) roles
    const roleRepo = manager.getRepository(Role);
    const roleByName = new Map<string, Role>();

    for (const [name, codes] of Object.entries(ROLES_PERMISSIONS)) {
      let role = await roleRepo.findOne({
        where: { name },
        relations: { permissions: true },
      });
      if (!role) {
        role = roleRepo.create({
          name,
          isSystem: true,
          description: `${name} role`,
        });
        console.log(`  + role ${name}`);
      }
      // Full reassignment: the code is the source of truth.
      role.permissions = codes.map((c) => permissionByCode.get(c)!);
      role.isSystem = true;
      roleByName.set(name, await roleRepo.save(role));
    }

    // --------------------------------------------- 3) super admin
    const userRepo = manager.getRepository(User);
    const username = opts.username.trim().toLowerCase();
    const superAdminRole = roleByName.get(RoleName.SUPER_ADMIN)!;

    let admin = await userRepo.findOne({
      where: { username },
      relations: { roles: true },
    });

    if (!admin) {
      admin = userRepo.create({
        username,
        fullName: opts.fullName,
        passwordHash: await argon2.hash(opts.password, ARGON_OPTIONS),
        isActive: true,
        roles: [superAdminRole],
      });
      await userRepo.save(admin);
      console.log(`  + super admin created: ${username}`);
    } else {
      // Do NOT overwrite the password of an existing user.
      const hasRole = admin.roles.some((r) => r.name === RoleName.SUPER_ADMIN);
      if (!hasRole) {
        admin.roles = [...admin.roles, superAdminRole];
        console.log(`  ~ SUPER_ADMIN role re-assigned to ${username}`);
      }
      if (!admin.isActive) {
        admin.isActive = true;
        console.log(`  ~ account ${username} reactivated`);
      }
      await userRepo.save(admin);
      console.log(`  = super admin already existed: ${username} (password unchanged)`);
    }
  });

  console.log('Seed completed.');
}

function guardPassword({ password, isProduction }: SeedOptions): void {
  if (!isProduction) return;

  if (WEAK_DEFAULTS.includes(password)) {
    throw new Error(
      'SUPER_ADMIN_PASSWORD is still the sample value. Change it before seeding production.',
    );
  }
  const strong =
    password.length >= 16 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  if (!strong) {
    throw new Error(
      'In production, SUPER_ADMIN_PASSWORD requires 16+ characters with uppercase, lowercase, digit and symbol.',
    );
  }
}
