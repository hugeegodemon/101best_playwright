import type { Page } from '@playwright/test';
import { expect, test } from './test';
import { BOSystemBankListPage } from '../../../pages/bo/SystemBankListPage';
import { uniqueUpperAlnum } from '../helpers/data';

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

test.describe('BO System Bank Edit Validation @serial', () => {

  test('edit system bank requires bank code and bank name', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await createBankAndOpenEdit(page, systemBankPage, uniqueUpperAlnum(8));
    await systemBankPage.fillFormBankCode('');
    await systemBankPage.fillFormBankName('');
    await systemBankPage.submitForm();

    await systemBankPage.expectFormErrorCount(await systemBankPage.copy('required_field'), 2);
  });

  test('edit system bank cannot use duplicate code in the same region', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);
    const region = await systemBankPage.copy('region_code_1');

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();
    await systemBankPage.selectFilterRegion(region);
    await systemBankPage.clickSearch();
    await systemBankPage.expectListHasRows();
    const duplicateBankCode = (await systemBankPage.topRowTexts())[0];

    await createBankAndOpenEdit(page, systemBankPage, uniqueUpperAlnum(8));
    await systemBankPage.fillFormBankCode(duplicateBankCode);
    await systemBankPage.submitForm();

    await systemBankPage.expectAlertContains(await systemBankPage.copy('000488', 'error_code'));
    await expect(page).toHaveURL(/\/system\/bank\/edit\?id=/);
  });

  test('edit system bank can cancel without saving changes', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);
    const unique = uniqueUpperAlnum(8);
    const { bankCode, bankName } = await createBankAndOpenEdit(page, systemBankPage, unique);

    await systemBankPage.fillFormBankName(`${bankName} X`);
    await systemBankPage.cancelForm();

    await systemBankPage.expectSystemBankListVisible();
    await systemBankPage.searchByBankCode(bankCode);
    await systemBankPage.expectBankInList(bankCode, bankName);
  });
});
