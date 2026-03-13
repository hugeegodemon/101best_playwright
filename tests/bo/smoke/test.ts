import path from 'path';
import { test as base, expect } from '@playwright/test';
import { ENV } from '../../../utils/env';
import { useLocaleInContext } from '../../../utils/i18n';

const authFile = path.resolve(process.cwd(), 'playwright/.auth/bo-smoke-user.json');

export { expect };

export const test = base.extend({
  storageState: authFile,
  page: async ({ page }, use) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);
    await page.goto('/dashboard');
    await use(page);
  },
});
