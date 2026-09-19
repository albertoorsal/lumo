/**
 * Hashing Service
 */
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/** Params for Argon2id to OWASP */
const ARGON_OPTIONS: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

/**
 * The hash of a password that does not exist. Use it to spend the same amount
 * of CPU time when the username is not registered.
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$h6kFyF9r8P5sYlxLXxYbGm2xKcdW5oVJ0j1nQ8pGZ5s';

@Injectable()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain, ARGON_OPTIONS);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  // Consume the equivalent time as a real verification
  async wasteTime(plain: string): Promise<void> {
    try {
      await argon2.verify(DUMMY_HASH, plain);
    } catch {}
  }
}
