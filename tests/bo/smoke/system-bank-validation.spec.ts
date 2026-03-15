import { expect, test } from './test';
import { BOSystemBankListPage } from '../../../pages/bo/SystemBankListPage';
import { uniqueDigits } from '../helpers/data';

test.describe('BO System Bank Validation @serial', () => {

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
    const bankCode = `TMP${uniqueDigits(6)}`;

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
    const region = await systemBankPage.copy('region_code_1');

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();
    await systemBankPage.selectFilterRegion(region);
    await systemBankPage.clickSearch();
    await systemBankPage.expectListHasRows();
    const existingBankCode = (await systemBankPage.topRowTexts())[0];
    await systemBankPage.clickAddBank();
    await systemBankPage.expectAddPageVisible();
    await systemBankPage.createBank({
      region,
      bankCode: existingBankCode,
      bankName: `DUP BANK ${uniqueDigits(6)}`,
    });

    await systemBankPage.expectAlertContains(await systemBankPage.copy('000487', 'error_code'));
    await expect(page).toHaveURL(/\/system\/bank\/add$/);
  });
});
