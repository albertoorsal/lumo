import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { createHash, randomUUID } from 'node:crypto';
import type { AuthenticatedUser, Permission, RoleName } from '@app/shared';
import { User } from '../users/entities/user.entity.js';
import { RefreshToken } from '../../auth/entities/refresh-token.entity.js';
import { PasswordService } from './password.service.js';
import { LoginDto } from './dto/login.dto.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AccessPayload {
  sub: string;
  username: string;
  type: 'access';
}

interface RefreshPayload {
  sub: string;
  jti: string;
  fam: string;
  type: 'refresh';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly passwords: PasswordService,
  ) {}

  async login(dto: LoginDto, userAgent?: string): Promise<TokenPair> {
    const username = dto.username.trim().toLowerCase();

    // addSelect because passwordHash has select:false in the entity
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.username = :username', { username })
      .getOne();

    if (!user) {
      await this.passwords.wasteTime(dto.password);
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwords.verify(user.passwordHash, dto.password);
    if (!valid) {
      this.logger.warn(`Attempt failed by ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('The account is disabled');
    }

    await this.users.update(user.id, { lastLoginAt: new Date() });

    return this.issueTokenPair(user.id, randomUUID(), userAgent);
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const stored = await this.refreshTokens.findOne({
      where: { tokenHash: this.sha256(rawToken) },
    });
    if (stored && !stored.revokedAt) {
      await this.revokeFamily(stored.familyId);
    }
  }

  async refresh(rawToken: string, userAgent?: string): Promise<TokenPair> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(rawToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid session');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Incorrect token type');
    }

    const stored = await this.refreshTokens.findOne({
      where: { tokenHash: this.sha256(rawToken) },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid session');
    }

    // Reuse detection: someone presented a token that was already rotated.
    if (stored.revokedAt) {
      this.logger.error(
        `Refresh token reuse detected. user=${stored.userId} family=${stored.familyId}`,
      );
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException(
        'Session compromised, please log in again',
      );
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.users.findOne({ where: { id: stored.userId } });
    if (!user || !user.isActive) {
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException('Invalid session');
    }

    const next = await this.issueTokenPair(user.id, stored.familyId, userAgent);

    stored.revokedAt = new Date();
    await this.refreshTokens.save(stored);

    return next;
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokens.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async getProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: { roles: { permissions: true } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not available');
    }
    return AuthService.toAuthenticatedUser(user);
  }

  static toAuthenticatedUser(user: User): AuthenticatedUser {
    const roles = (user.roles ?? []).map((r) => r.name as RoleName);
    const permissions = [
      ...new Set(
        (user.roles ?? []).flatMap((r) =>
          (r.permissions ?? []).map((p) => p.code as Permission),
        ),
      ),
    ].sort();

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      isActive: user.isActive,
      roles,
      permissions,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    };
  }

  private async issueTokenPair(
    userId: string,
    familyId: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const user = await this.users.findOneOrFail({ where: { id: userId } });
    const accessTtl = Number(this.config.getOrThrow('JWT_ACCESS_TTL'));
    const refreshTtl = Number(this.config.getOrThrow('JWT_REFRESH_TTL'));
    const jti = randomUUID();

    const accessPayload: AccessPayload = {
      sub: user.id,
      username: user.username,
      type: 'access',
    };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: accessTtl,
    });

    const refreshPayload: RefreshPayload = {
      sub: user.id,
      jti,
      fam: familyId,
      type: 'refresh',
    };

    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: refreshTtl,
    });

    await this.refreshTokens.save(
      this.refreshTokens.create({
        id: jti,
        tokenHash: this.sha256(refreshToken),
        userId: user.id,
        familyId,
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
        userAgent: userAgent?.slice(0, 255) ?? null,
      }),
    );

    return { accessToken, refreshToken, expiresIn: accessTtl };
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.refreshTokens.update(
      { familyId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
