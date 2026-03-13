import { expect, test } from '@playwright/test';
import { BOSystemBankListPage } from '../../../pages/bo/SystemBankListPage';
import { ENV } from '../../../utils/env';
import { useLocaleInContext } from '../../../utils/i18n';

test.describe('BO System Bank List', () => {
  test.beforeEach(async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);
    await page.goto(`${ENV.SBO_URL}/dashboard`);
  });

  test('system bank list page opens with region and bank filters', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();
    await expect(await systemBankPage.filterRegionText()).toBe(await systemBankPage.copy('all_regions'));
  });

  test('system bank list shows bank rows with edit action', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();

    const texts = await systemBankPage.topRowTexts();
    expect(texts[0].length).toBeGreaterThan(0);
    expect(texts[1].length).toBeGreaterThan(0);
    expect(texts[2].length).toBeGreaterThan(0);
    await expect(systemBankPage.topRow().locator('.bg-mainBlue.el-tooltip__trigger')).toHaveCount(1);
  });

  test('system bank list search filters by bank code and reset clears fields', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();

    const [bankCode] = await systemBankPage.topRowTexts();
    await systemBankPage.fillBankCode(bankCode);
    await systemBankPage.clickSearch();

    await expect(systemBankPage.listRows()).toHaveCount(1);
    await expect(systemBankPage.topRow()).toContainText(bankCode);

    await systemBankPage.clickReset();
    const filters = await systemBankPage.filterFieldValues();
    expect(filters.bankCode).toBe('');
    expect(filters.bankName).toBe('');

    await systemBankPage.clickSearch();
    await expect(systemBankPage.listRows()).toHaveCount(10);
  });

  test('system bank list add button opens add page', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();
    await systemBankPage.clickAddBank();
    await systemBankPage.expectAddPageVisible();
  });

  test('system bank list can search by bank name', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();

    const topRowTexts = await systemBankPage.topRowTexts();
    const bankName = topRowTexts[1];
    await systemBankPage.searchByBankName(bankName);

    await expect(systemBankPage.listRows()).toHaveCount(1);
    await systemBankPage.expectBankInList(topRowTexts[0], bankName);
  });

  test('system bank list can filter rows by region', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();
    await systemBankPage.selectFilterRegion(await systemBankPage.copy('region_code_1'));
    await systemBankPage.clickSearch();

    await expect(systemBankPage.listRows().first()).toBeVisible();
    await systemBankPage.expectAllRowsContain(await systemBankPage.copy('region_code_1'));
  });

  test('system bank list can show no data for unmatched filters', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();
    await systemBankPage.fillBankCode(`NO_BANK_${Date.now()}`);
    await systemBankPage.clickSearch();

    await systemBankPage.expectNoData();
  });

  test('system bank list can combine region and bank code filters', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();
    await systemBankPage.selectFilterRegion(await systemBankPage.copy('region_code_1'));
    await systemBankPage.fillBankCode('TCB');
    await systemBankPage.clickSearch();

    await expect(systemBankPage.listRows()).toHaveCount(1);
    await systemBankPage.expectBankInList('TCB');
    await systemBankPage.expectAllRowsContain(await systemBankPage.copy('region_code_1'));
  });

  test('can open first system bank edit page', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();

    await systemBankPage.openTopRowEdit();
    await systemBankPage.expectEditPageVisible();
  });
});
