import { test as base, expect } from '@playwright/test';
import { boSmokeAuthFile } from '../helpers/auth-file';
import { ENV } from '../../../utils/env';
import { useLocaleInContext } from '../../../utils/i18n';

const authFile = boSmokeAuthFile();

export { expect };

export const test = base.extend({
  storageState: authFile,
  page: async ({ page }, use) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);
    await page.goto('/dashboard');
    await use(page);
  },
});
