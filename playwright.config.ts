import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const shouldRunGlobalSetup = process.env.PW_SKIP_BO_GLOBAL_SETUP !== '1';

export default defineConfig({
  testDir: './tests',
  reporter: [['html', { open: 'never' }]],
  globalSetup: shouldRunGlobalSetup ? './tests/bo/global.setup.ts' : undefined,

  use: {
    baseURL: process.env.SBO_URL,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
});
