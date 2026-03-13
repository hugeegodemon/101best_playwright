import { test as base, expect } from '@playwright/test';
import { ENV } from '../../../utils/env';
import { useLocaleInContext } from '../../../utils/i18n';

export { expect };

export const test = base.extend({
  page: async ({ page }, use) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);
    await use(page);
  },
});
