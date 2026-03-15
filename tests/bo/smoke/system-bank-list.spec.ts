import { expect, test } from './test';
import { BOSystemBankListPage } from '../../../pages/bo/SystemBankListPage';
import { buildMissValue } from '../helpers/data';

test.describe('BO System Bank List @serial', () => {
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
    await systemBankPage.expectListHasRows();

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
    await systemBankPage.expectListHasRows();

    const initialRowCount = await systemBankPage.listRows().count();
    const secondRowBankCode =
      initialRowCount > 1
        ? ((await systemBankPage.listRows().nth(1).locator('td').first().innerText()).trim())
        : null;
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
    await systemBankPage.expectBankInList(bankCode);

    if (secondRowBankCode) {
      await systemBankPage.expectBankInList(secondRowBankCode);
    }
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
    await systemBankPage.expectListHasRows();

    const topRowTexts = await systemBankPage.topRowTexts();
    const bankName = topRowTexts[1];
    await systemBankPage.searchByBankName(bankName);

    await systemBankPage.expectBankInList(topRowTexts[0], bankName);
  });

  test('system bank list can filter rows by region', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);
    const region = await systemBankPage.copy('region_code_1');

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();
    await systemBankPage.selectFilterRegion(region);
    await systemBankPage.clickSearch();

    await systemBankPage.expectListHasRows();
    await systemBankPage.expectAllRowsContain(region);
  });

  test('system bank list can show no data for unmatched filters', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();
    await systemBankPage.fillBankCode(buildMissValue('NO_BANK'));
    await systemBankPage.clickSearch();

    await systemBankPage.expectNoData();
  });

  test('system bank list can combine region and bank code filters', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);
    const region = await systemBankPage.copy('region_code_1');

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();
    await systemBankPage.selectFilterRegion(region);
    await systemBankPage.clickSearch();
    await systemBankPage.expectListHasRows();
    const [bankCode] = await systemBankPage.topRowTexts();

    await systemBankPage.clickReset();
    await systemBankPage.selectFilterRegion(region);
    await systemBankPage.fillBankCode(bankCode);
    await systemBankPage.clickSearch();

    await systemBankPage.expectBankInList(bankCode);
    await systemBankPage.expectAllRowsContain(region);
  });

  test('can open first system bank edit page', async ({ page }) => {
    const systemBankPage = new BOSystemBankListPage(page);

    await systemBankPage.gotoSystemBankList();
    await systemBankPage.expectSystemBankListVisible();

    await systemBankPage.openTopRowEdit();
    await systemBankPage.expectEditPageVisible();
  });
});
