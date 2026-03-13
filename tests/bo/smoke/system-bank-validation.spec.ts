import { expect, test } from '@playwright/test';
import { BOSystemBankListPage } from '../../../pages/bo/SystemBankListPage';
import { ENV } from '../../../utils/env';
import { useLocaleInContext } from '../../../utils/i18n';

test.describe('BO System Bank Validation', () => {
  test.beforeEach(async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);
    await page.goto(`${ENV.SBO_URL}/dashboard`);
  });

  test('add system bank requires all mandatory fields', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();
    await systemBankPage.clickAddBank();
    await systemBankPage.expectAddPageVisible();
    await systemBankPage.submitForm();
    await systemBankPage.expectFormErrorCount(await systemBankPage.copy('required_field'), 3);
  });

  test('add system bank can cancel without saving', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);
    const bankCode = `TMP${Date.now().toString().slice(-6)}`;

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();
    await systemBankPage.clickAddBank();
    await systemBankPage.expectAddPageVisible();
    await systemBankPage.fillFormBankCode(bankCode);
    await systemBankPage.cancelForm();

    await systemBankPage.expectSystemBankListVisible();
    await systemBankPage.searchByBankCode(bankCode);
    await expect(systemBankPage.listRows()).toHaveCount(0);
  });

  test('cannot create duplicate system bank code', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();
    const existingBankCode = (await systemBankPage.topRowTexts())[0];
    await systemBankPage.clickAddBank();
    await systemBankPage.expectAddPageVisible();
    await systemBankPage.createBank({
      region: await systemBankPage.copy('region_code_1'),
      bankCode: existingBankCode,
      bankName: `DUP BANK ${Date.now().toString().slice(-6)}`,
    });

    await systemBankPage.expectAlertContains(await systemBankPage.copy('000487', 'error_code'));
    await expect(page).toHaveURL(/\/system\/bank\/add$/);
  });
});
