import type { Browser, Page } from '@playwright/test';
import { BOLoginPage } from '../../../pages/bo/LoginPage';
import { ENV } from '../../../utils/env';
import { useLocaleInContext } from '../../../utils/i18n';

export async function loginToBackOffice(page: Page, account: string, password: string): Promise<void> {
  const loginPage = new BOLoginPage(page);
  await loginPage.goto(ENV.SBO_URL);
  await loginPage.login(account, password);
}

export async function loginAsPrimaryUser(page: Page): Promise<void> {
  await loginToBackOffice(page, ENV.SBO_ACCOUNT, ENV.SBO_PASSWORD);
}

export async function loginAsAuthenticatedUser(page: Page): Promise<void> {
  await loginToBackOffice(page, ENV.SBO_AUTH_ACCOUNT, ENV.SBO_AUTH_PASSWORD);
}

export async function withFreshLoginPage(
  browser: Browser,
  callback: (page: Page) => Promise<void>
): Promise<void> {
  const context = await browser.newContext();

  try {
    await useLocaleInContext(context, ENV.SBO_LOCALE);
    const page = await context.newPage();
    await callback(page);
  } finally {
    await context.close();
  }
}
