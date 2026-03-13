import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  reporter: [['html', { open: 'never' }]],

  use: {
    baseURL: process.env.SBO_URL,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
  {
    name: 'bo-setup',
    testMatch: /.*bo[\\/]+auth\.setup\.ts/,
  },
  {
    name: 'bo-no-auth',
    testMatch: /.*bo[\\/]+auth[\\/]+.*\.spec\.ts/,
    testIgnore: /.*bo[\\/]+auth[\\/]+logout\.spec\.ts/,
    workers: 1,
  },
  {
    name: 'bo-authenticated',
    testMatch: [
      /.*bo[\\/]+smoke[\\/]+.*\.spec\.ts/,
    ],
    testIgnore: [
      /.*bo[\\/]+smoke[\\/]+system-bank.*\.spec\.ts/,
    ],
    dependencies: ['bo-setup'],
    use: {
      storageState: 'playwright/.auth/bo-user.json',
    },
  },
  {
    name: 'bo-authenticated-system-bank',
    testMatch: [
      /.*bo[\\/]+smoke[\\/]+system-bank.*\.spec\.ts/,
    ],
    workers: 1,
    dependencies: ['bo-setup'],
    use: {
      storageState: 'playwright/.auth/bo-user.json',
    },
  },
  {
    name: 'bo-logout',
    testMatch: /.*bo[\\/]+auth[\\/]+logout\.spec\.ts/,
    dependencies: ['bo-no-auth', 'bo-authenticated', 'bo-authenticated-system-bank'],
  },
]
});
