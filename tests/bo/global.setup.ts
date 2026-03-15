import fs from 'fs';
import path from 'path';
import { chromium, type FullConfig } from '@playwright/test';
import { BOLoginPage } from '../../pages/bo/LoginPage';
import { boSmokeAuthFile } from './helpers/auth-file';
import { ENV } from '../../utils/env';
import { useLocaleInContext } from '../../utils/i18n';

const authDir = path.resolve(process.cwd(), 'playwright/.auth');
const authFile = boSmokeAuthFile();

async function globalSetup(_: FullConfig): Promise<void> {
  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();

  try {
    await useLocaleInContext(context, ENV.SBO_LOCALE);

    const page = await context.newPage();
    const loginPage = new BOLoginPage(page);

    await loginPage.goto(ENV.SBO_URL);
    await loginPage.login(ENV.SBO_SMOKE_ACCOUNT, ENV.SBO_SMOKE_PASSWORD);
    await loginPage.expectDashboardVisible();

    await context.storageState({ path: authFile });
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
