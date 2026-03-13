import { expect, test } from '@playwright/test';
import { BOSystemBankListPage } from '../../../pages/bo/SystemBankListPage';
import { ENV } from '../../../utils/env';
import { useLocaleInContext } from '../../../utils/i18n';

test.describe('BO System Bank CRUD', () => {
  test('can create edit and search system bank', async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);

    const systemBankPage = new BOSystemBankListPage(page);
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 5)}`;
    const bankCode = `AT${unique}`;
    const bankName = `AUTO BANK ${unique}`;
    const editedBankName = `${bankName} EDIT`;

    await test.step('1. Enter System Bank List page', async () => {
      await page.goto(`${ENV.SBO_URL}/dashboard`);
      await systemBankPage.gotoSystemBankList();
      await systemBankPage.expectSystemBankListVisible();
    });

    await test.step('2. Enter add page and create a new system bank', async () => {
      await systemBankPage.clickAddBank();
      await systemBankPage.expectAddPageVisible();
      await systemBankPage.createBank({
        region: await systemBankPage.copy('region_code_1'),
        bankCode,
        bankName,
      });
      await expect(page).toHaveURL(/\/system\/bank$/);
      await systemBankPage.expectToastContains(await systemBankPage.copy('success'));
    });

    await test.step('3. Verify the created bank appears in list', async () => {
      await systemBankPage.searchByBankCode(bankCode);
      await expect(systemBankPage.listRows()).toHaveCount(1);
      await systemBankPage.expectBankInList(bankCode, bankName);
    });

    await test.step('4. Click edit and enter edit page', async () => {
      await systemBankPage.openEditByBankCode(bankCode);
      await systemBankPage.expectEditPageVisible();
    });

    await test.step('5. Update created bank name', async () => {
      await systemBankPage.fillFormBankName(editedBankName);
      await systemBankPage.submitForm();
      await expect(page).toHaveURL(/\/system\/bank$/);
      await systemBankPage.expectToastContains(await systemBankPage.copy('update_success'));
      await page.reload({ waitUntil: 'networkidle' });
    });

    await test.step('6. Search again and verify edited bank exists in list', async () => {
      await systemBankPage.expectBankInListEventually(bankCode, editedBankName);
    });
  });
});
