import { expect, Page, test } from '@playwright/test';
import { BOSystemBankListPage } from '../../../pages/bo/SystemBankListPage';
import { ENV } from '../../../utils/env';
import { useLocaleInContext } from '../../../utils/i18n';

async function createBankAndOpenEdit(page: Page, systemBankPage: BOSystemBankListPage, suffix: string) {
  const bankCode = `E${suffix}`;
  const bankName = `EDIT BANK ${suffix}`;

  await systemBankPage.gotoSystemBankList();
  await systemBankPage.expectSystemBankListVisible();
  await systemBankPage.clickAddBank();
  await systemBankPage.expectAddPageVisible();
  await systemBankPage.createBank({
    region: await systemBankPage.copy('region_code_1'),
    bankCode,
    bankName,
  });
  await expect(page).toHaveURL(/\/system\/bank$/);
  await systemBankPage.searchByBankCode(bankCode);
  await expect(systemBankPage.listRows()).toHaveCount(1);
  await systemBankPage.openEditByBankCode(bankCode);
  await systemBankPage.expectEditPageVisible();

  return { bankCode, bankName };
}

test.describe('BO System Bank Edit Validation', () => {
  test.beforeEach(async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);
    await page.goto(`${ENV.SBO_URL}/dashboard`);
  });

  test('edit system bank requires bank code and bank name', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await createBankAndOpenEdit(page, systemBankPage, `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`);
    await systemBankPage.fillFormBankCode('');
    await systemBankPage.fillFormBankName('');
    await systemBankPage.submitForm();

    await systemBankPage.expectFormErrorCount(await systemBankPage.copy('required_field'), 2);
  });

  test('edit system bank cannot use duplicate code in the same region', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();
    await systemBankPage.selectFilterRegion(await systemBankPage.copy('region_code_1'));
    await systemBankPage.clickSearch();
    await expect(systemBankPage.listRows().first()).toBeVisible();
    const duplicateBankCode = (await systemBankPage.topRowTexts())[0];

    await createBankAndOpenEdit(page, systemBankPage, `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`);
    await systemBankPage.fillFormBankCode(duplicateBankCode);
    await systemBankPage.submitForm();

    await systemBankPage.expectAlertContains(await systemBankPage.copy('000488', 'error_code'));
    await expect(page).toHaveURL(/\/system\/bank\/edit\?id=/);
  });

  test('edit system bank can cancel without saving changes', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);
    const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    const { bankCode, bankName } = await createBankAndOpenEdit(page, systemBankPage, unique);

    await systemBankPage.fillFormBankName(`${bankName} X`);
    await systemBankPage.cancelForm();

    await systemBankPage.expectSystemBankListVisible();
    await systemBankPage.searchByBankCode(bankCode);
    await systemBankPage.expectBankInList(bankCode, bankName);
  });
});
