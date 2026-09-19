import 'dotenv/config';
import { runSeed } from './seed.js';
import dataSource from '../data-source.js';

async function main(): Promise<void> {
  const required = ['SUPER_ADMIN_USERNAME', 'SUPER_ADMIN_PASSWORD'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  await dataSource.initialize();
  console.log('Running seed...');

  try {
    await runSeed(dataSource, {
      username: process.env.SUPER_ADMIN_USERNAME!,
      password: process.env.SUPER_ADMIN_PASSWORD!,
      fullName: process.env.SUPER_ADMIN_NAME ?? 'Super Admin',
      isProduction: process.env.NODE_ENV === 'production',
    });
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
