import { BOPromotionPage } from '../../../pages/bo/PromotionPage';
import { BOSiteListPage } from '../../../pages/bo/SiteListPage';
import { dateTimeOffset, uniqueAlpha } from '../helpers/data';
import { LANGUAGE_VALIDATION_BO_SITE, MANAGED_BO_SITE } from '../helpers/site';
import { expect } from './test';
import { test } from './test';

const STALE_DEBUG_CATEGORY_NAMES = ['Autopdvkeavm', 'Autokgwneavm', 'Autotigqeavm'];
const STALE_PROMOTION_CATEGORY_PATTERNS = ['AutoPromoSort', 'AutoPromoLimit'];

function buildPromotionCategoryName(prefix = 'AutoPromoCat') {
  return `${prefix}${uniqueAlpha(6)}`;
}

async function createCategory(
  promotionPage: BOPromotionPage,
  sitePage: BOSiteListPage,
  siteName: string,
  name: string
) {
  const localeSettings = await sitePage.fetchSiteLocaleSettingsBySiteName(siteName);

  await promotionPage.gotoPromotion();
  await promotionPage.expectPromotionVisible();
  await promotionPage.selectSiteByName(siteName);
  await promotionPage.expectCategoryTabVisible();
  await deleteCategoryIfPresent(promotionPage, name);
  await promotionPage.openAddCategoryDialog();
  await promotionPage.selectAddCategorySiteByName(siteName);
  await promotionPage.fillAddCategoryPrimaryName(name);
  await promotionPage.selectCategoryColorByIndex(0);

  const { requestBody } = await promotionPage.submitAddCategoryDialogAndWaitForCreateTransaction();
  const payload = requestBody as {
    branchId?: number;
    promotionTypeName?: Record<string, string>;
    promotionTypeColor?: string;
  };

  expect(payload.branchId).toBeGreaterThan(0);
  expect(payload.promotionTypeName).toEqual({ [localeSettings.primaryLocaleCode]: name });
  expect(payload.promotionTypeColor).toMatch(/^[A-F0-9]{6}$/);
  await promotionPage.expectLatestAlertContains(/Added successfully|Success/i);
  await promotionPage.expectCategoryRowVisibleByText(name);
}

async function deleteCategoryIfPresent(promotionPage: BOPromotionPage, name: string) {
  if (!(await promotionPage.hasCategoryRow(name))) {
    return;
  }

  await promotionPage.clickDeleteCategoryByText(name);
  await promotionPage.expectConfirmDeleteCategoryDialog();
  await promotionPage.confirmDeleteCategoryAndWaitForDelete();
  await promotionPage.expectLatestAlertContains(/Deleted successfully|Success/i);
  await promotionPage.expectCategoryRowNotVisibleByText(name);
}

async function deleteCategoriesMatchingText(promotionPage: BOPromotionPage, text: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (!(await promotionPage.hasCategoryRow(text))) {
      return;
    }

    await promotionPage.clickDeleteCategoryByText(text);
    await promotionPage.expectConfirmDeleteCategoryDialog();
    await promotionPage.confirmDeleteCategoryAndWaitForDelete();
    await promotionPage.expectLatestAlertContains(/Deleted successfully|Success/i);
  }

  throw new Error(`Failed to delete categories matching text: ${text}`);
}

async function deleteCategoriesMatchingAnyText(promotionPage: BOPromotionPage, texts: string[]) {
  for (const text of texts) {
    await deleteCategoriesMatchingText(promotionPage, text);
  }
}

async function reloadPromotionCategoryPage(promotionPage: BOPromotionPage) {
  await promotionPage.page.reload();
  await promotionPage.expectPromotionVisible();
  await promotionPage.selectSiteByName(MANAGED_BO_SITE);
  await promotionPage.expectCategoryTabVisible();
}

test.describe('BO Promotion', () => {
  test('promotion page opens with category tab and site selector', async ({ page }) => {
    const promotionPage = new BOPromotionPage(page);

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.expectCategoryTabVisible();
  });

  test('promotion settings tab shows site category filters and schedule status controls', async ({ page }) => {
    const promotionPage = new BOPromotionPage(page);

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.clickPromotionSettingsTab();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.expectPromotionSettingsTabVisible();
  });

  test('add promotion dialog can open and cancel from promotion settings tab', async ({ page }) => {
    const promotionPage = new BOPromotionPage(page);

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.clickPromotionSettingsTab();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.expectPromotionSettingsTabVisible();
    await promotionPage.openAddPromotionDialog();
    await promotionPage.cancelAddPromotionDialog();
  });

  test('add promotion dialog hides promotion information fields until dialog site is selected', async ({ page }) => {
    const promotionPage = new BOPromotionPage(page);

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.clickPromotionSettingsTab();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.expectPromotionSettingsTabVisible();
    await promotionPage.openAddPromotionDialog();
    await promotionPage.expectAddPromotionAwaitingSiteSelection();
  });

  test('add promotion dialog title languages follow the site primary and other language settings', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const localeSettings = await sitePage.fetchSiteLocaleSettingsBySiteName(LANGUAGE_VALIDATION_BO_SITE);

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.clickPromotionSettingsTab();
    await promotionPage.selectSiteByName(LANGUAGE_VALIDATION_BO_SITE);
    await promotionPage.expectPromotionSettingsTabVisible();
    await promotionPage.openAddPromotionDialog();
    await promotionPage.selectAddPromotionSiteByName(LANGUAGE_VALIDATION_BO_SITE);
    await promotionPage.expectAddPromotionTitleLanguages(
      localeSettings.localeLabelsInOrder,
      localeSettings.primaryLocaleLabel
    );
  });

  test('add promotion dialog category options include created category', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const name = buildPromotionCategoryName('AutoPromoOption');

    await createCategory(promotionPage, sitePage, MANAGED_BO_SITE, name);

    try {
      await promotionPage.clickPromotionSettingsTab();
      await promotionPage.selectSiteByName(MANAGED_BO_SITE);
      await promotionPage.expectPromotionSettingsTabVisible();
      await promotionPage.openAddPromotionDialog();
      await promotionPage.selectAddPromotionSiteByName(MANAGED_BO_SITE);
      await promotionPage.expectAddPromotionCategoryOptionVisible(name);
    } finally {
      await reloadPromotionCategoryPage(promotionPage);
      await deleteCategoryIfPresent(promotionPage, name);
    }
  });

  test('add promotion dialog requires all mandatory fields after site is selected', async ({ page }) => {
    const promotionPage = new BOPromotionPage(page);

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.clickPromotionSettingsTab();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.expectPromotionSettingsTabVisible();
    await promotionPage.openAddPromotionDialog();
    await promotionPage.selectAddPromotionSiteByName(MANAGED_BO_SITE);
    await promotionPage.submitAddPromotionDialog();
    await promotionPage.expectAddPromotionRequiredErrorCount(8);
  });

  test('add promotion dialog shows time mode and pin-to-top options after site selection', async ({ page }) => {
    const promotionPage = new BOPromotionPage(page);

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.clickPromotionSettingsTab();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.expectPromotionSettingsTabVisible();
    await promotionPage.openAddPromotionDialog();
    await promotionPage.selectAddPromotionSiteByName(MANAGED_BO_SITE);
    await promotionPage.expectAddPromotionTimeAndPinOptionsVisible();
  });

  test('add promotion dialog keeps end time input disabled until start time is chosen', async ({ page }) => {
    const promotionPage = new BOPromotionPage(page);

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.clickPromotionSettingsTab();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.expectPromotionSettingsTabVisible();
    await promotionPage.openAddPromotionDialog();
    await promotionPage.selectAddPromotionSiteByName(MANAGED_BO_SITE);
    await promotionPage.expectAddPromotionEndTimeInputDisabledUntilStartSelected();
  });

  test('add promotion dialog other mode enables end time input after start time is chosen', async ({ page }) => {
    const promotionPage = new BOPromotionPage(page);

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.clickPromotionSettingsTab();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.expectPromotionSettingsTabVisible();
    await promotionPage.openAddPromotionDialog();
    await promotionPage.selectAddPromotionSiteByName(MANAGED_BO_SITE);
    await promotionPage.fillAddPromotionStartTime(dateTimeOffset(120));
    await promotionPage.chooseAddPromotionEndTimeMode('Other');
    await promotionPage.expectAddPromotionEndTimeInputEnabled();
  });

  test('add promotion dialog requires both web and h5 images before submit', async ({ page }) => {
    test.setTimeout(60000);

    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const categoryName = buildPromotionCategoryName('AutoPromoImage');

    await createCategory(promotionPage, sitePage, MANAGED_BO_SITE, categoryName);

    try {
      await promotionPage.clickPromotionSettingsTab();
      await promotionPage.selectSiteByName(MANAGED_BO_SITE);
      await promotionPage.expectPromotionSettingsTabVisible();
      await promotionPage.openAddPromotionDialog();
      await promotionPage.selectAddPromotionSiteByName(MANAGED_BO_SITE);
      await promotionPage.selectAddPromotionCategoryByName(categoryName);
      await promotionPage.fillAddPromotionStartTime(dateTimeOffset(120));
      await promotionPage.chooseAddPromotionEndTimeMode('Permanent');
      await promotionPage.chooseAddPromotionPinTop(false);
      await promotionPage.fillAddPromotionPrimaryTitle(buildPromotionCategoryName('AutoPromoTitle'));
      await promotionPage.fillAddPromotionPrimaryContent('Autopromo image validation content');
      await promotionPage.submitAddPromotionDialog();
      await promotionPage.expectAddPromotionImageRequiredErrors();
    } finally {
      await reloadPromotionCategoryPage(promotionPage);
      await deleteCategoryIfPresent(promotionPage, categoryName);
    }
  });

  test('add category dialog can open and cancel', async ({ page }) => {
    const promotionPage = new BOPromotionPage(page);

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.openAddCategoryDialog();
    await promotionPage.cancelAddCategoryDialog();
  });

  test('category add dialog hides localized name fields until dialog site is selected', async ({ page }) => {
    const promotionPage = new BOPromotionPage(page);

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.openAddCategoryDialog();
    await promotionPage.expectAddCategoryAwaitingSiteSelection();
  });

  test('category table headers follow the site primary and other language settings', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const localeSettings = await sitePage.fetchSiteLocaleSettingsBySiteName(LANGUAGE_VALIDATION_BO_SITE);

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.selectSiteByName(LANGUAGE_VALIDATION_BO_SITE);
    await promotionPage.expectCategoryTabVisible();
    await promotionPage.expectCategoryTableHeaders(localeSettings.localeLabelsInOrder);
  });

  test('category add dialog name fields follow the site primary and other language settings', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const localeSettings = await sitePage.fetchSiteLocaleSettingsBySiteName(LANGUAGE_VALIDATION_BO_SITE);

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.selectSiteByName(LANGUAGE_VALIDATION_BO_SITE);
    await promotionPage.openAddCategoryDialog();
    await promotionPage.selectAddCategorySiteByName(LANGUAGE_VALIDATION_BO_SITE);
    await promotionPage.expectAddCategorySubmitEnabled();
    await promotionPage.expectAddCategoryNameLanguages(
      localeSettings.localeLabelsInOrder,
      localeSettings.primaryLocaleLabel
    );
  });

  test('category add dialog requires primary locale name before submit', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const localeSettings = await sitePage.fetchSiteLocaleSettingsBySiteName(LANGUAGE_VALIDATION_BO_SITE);

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.selectSiteByName(LANGUAGE_VALIDATION_BO_SITE);
    await promotionPage.openAddCategoryDialog();
    await promotionPage.selectAddCategorySiteByName(LANGUAGE_VALIDATION_BO_SITE);
    await promotionPage.expectAddCategorySubmitEnabled();
    await promotionPage.submitAddCategoryDialog();
    await promotionPage.expectAddCategoryPrimaryNameRequired(localeSettings.primaryLocaleLabel);
  });

  test('category add dialog requires color before submit', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const localeSettings = await sitePage.fetchSiteLocaleSettingsBySiteName(MANAGED_BO_SITE);
    const name = buildPromotionCategoryName('AutoPromoNeedColor');

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.openAddCategoryDialog();
    await promotionPage.selectAddCategorySiteByName(MANAGED_BO_SITE);
    await promotionPage.fillAddCategoryPrimaryName(name);
    await promotionPage.submitAddCategoryDialog();
    await promotionPage.expectAddCategoryRequiredErrorCount(1);
    await promotionPage.expectAddCategoryNameLanguages(
      localeSettings.localeLabelsInOrder,
      localeSettings.primaryLocaleLabel
    );
  });

  test('category can be created successfully and deleted from category list', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const name = buildPromotionCategoryName();

    for (const staleName of STALE_DEBUG_CATEGORY_NAMES) {
      await promotionPage.gotoPromotion();
      await promotionPage.expectPromotionVisible();
      await promotionPage.selectSiteByName(MANAGED_BO_SITE);
      await promotionPage.expectCategoryTabVisible();
      await deleteCategoryIfPresent(promotionPage, staleName);
    }

    await createCategory(promotionPage, sitePage, MANAGED_BO_SITE, name);

    await promotionPage.clickDeleteCategoryByText(name);
    await promotionPage.expectConfirmDeleteCategoryDialog();
    await promotionPage.confirmDeleteCategoryAndWaitForDelete();
    await promotionPage.expectLatestAlertContains(/Deleted successfully|Success/i);
    await promotionPage.expectCategoryRowNotVisibleByText(name);
  });

  test('category delete can be canceled without removing the row', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const name = buildPromotionCategoryName('AutoPromoCancelDelete');

    await createCategory(promotionPage, sitePage, MANAGED_BO_SITE, name);

    await promotionPage.clickDeleteCategoryByText(name);
    await promotionPage.expectConfirmDeleteCategoryDialog();
    await promotionPage.cancelConfirmDialog();
    await promotionPage.expectCategoryRowVisibleByText(name);

    await promotionPage.clickDeleteCategoryByText(name);
    await promotionPage.expectConfirmDeleteCategoryDialog();
    await promotionPage.confirmDeleteCategoryAndWaitForDelete();
    await promotionPage.expectLatestAlertContains(/Deleted successfully|Success/i);
    await promotionPage.expectCategoryRowNotVisibleByText(name);
  });

  test('category edit requires primary locale name before submit', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const localeSettings = await sitePage.fetchSiteLocaleSettingsBySiteName(MANAGED_BO_SITE);
    const name = buildPromotionCategoryName('AutoPromoEditRequired');

    await createCategory(promotionPage, sitePage, MANAGED_BO_SITE, name);
    await promotionPage.openEditCategoryDialogByText(name);
    await promotionPage.clearEditCategoryPrimaryName();
    await promotionPage.submitEditCategoryDialog();
    await promotionPage.expectEditCategoryRequiredErrorCount(1);
    await promotionPage.expectEditCategoryPrimaryNameRequired(localeSettings.primaryLocaleLabel);
    await promotionPage.cancelEditCategoryDialog();
    await promotionPage.expectCategoryRowVisibleByText(name);

    await promotionPage.clickDeleteCategoryByText(name);
    await promotionPage.expectConfirmDeleteCategoryDialog();
    await promotionPage.confirmDeleteCategoryAndWaitForDelete();
    await promotionPage.expectLatestAlertContains(/Deleted successfully|Success/i);
    await promotionPage.expectCategoryRowNotVisibleByText(name);
  });

  test('category edit dialog can open with site locked and cancel without changes', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const name = buildPromotionCategoryName('AutoPromoEditCancel');

    await createCategory(promotionPage, sitePage, MANAGED_BO_SITE, name);
    await promotionPage.openEditCategoryDialogByText(name);
    await promotionPage.expectEditCategorySiteDisabled();
    await promotionPage.cancelEditCategoryDialog();
    await promotionPage.expectCategoryRowVisibleByText(name);

    await promotionPage.clickDeleteCategoryByText(name);
    await promotionPage.expectConfirmDeleteCategoryDialog();
    await promotionPage.confirmDeleteCategoryAndWaitForDelete();
    await promotionPage.expectLatestAlertContains(/Deleted successfully|Success/i);
    await promotionPage.expectCategoryRowNotVisibleByText(name);
  });

  test('created category appears in promotion settings category filter', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const name = buildPromotionCategoryName('AutoPromoSettings');

    await createCategory(promotionPage, sitePage, MANAGED_BO_SITE, name);
    await promotionPage.clickPromotionSettingsTab();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.expectPromotionSettingsTabVisible();
    await promotionPage.expectSettingsCategoryOptionVisible(name);

    await promotionPage.clickCategoryTab();
    await promotionPage.expectCategoryTabVisible();
    await promotionPage.clickDeleteCategoryByText(name);
    await promotionPage.expectConfirmDeleteCategoryDialog();
    await promotionPage.confirmDeleteCategoryAndWaitForDelete();
    await promotionPage.expectLatestAlertContains(/Deleted successfully|Success/i);
    await promotionPage.expectCategoryRowNotVisibleByText(name);
  });

  test('category can be edited successfully from category list', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const localeSettings = await sitePage.fetchSiteLocaleSettingsBySiteName(MANAGED_BO_SITE);
    const name = buildPromotionCategoryName('AutoPromoEdit');
    const editedName = buildPromotionCategoryName('AutoPromoEdited');

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.expectCategoryTabVisible();
    await deleteCategoriesMatchingText(promotionPage, 'AutoPromoEditDbg');

    await createCategory(promotionPage, sitePage, MANAGED_BO_SITE, name);
    await deleteCategoryIfPresent(promotionPage, editedName);

    await promotionPage.openEditCategoryDialogByText(name);
    await promotionPage.expectEditCategorySiteDisabled();
    await promotionPage.fillEditCategoryPrimaryName(editedName);

    const { requestBody } = await promotionPage.submitEditCategoryDialogAndWaitForUpdateTransaction();
    const payload = requestBody as {
      branchId?: number;
      promotionTypeName?: Record<string, string>;
      promotionTypeColor?: string;
    };

    expect(payload.branchId).toBeGreaterThan(0);
    expect(payload.promotionTypeName).toEqual({ [localeSettings.primaryLocaleCode]: editedName });
    expect(payload.promotionTypeColor).toMatch(/^[A-F0-9]{6}$/);

    await promotionPage.expectLatestAlertContains(/Updated successfully|Edited successfully|Success/i);
    await promotionPage.expectCategoryRowVisibleByText(editedName);
    await promotionPage.expectCategoryRowNotVisibleByText(name);

    await promotionPage.clickDeleteCategoryByText(editedName);
    await promotionPage.expectConfirmDeleteCategoryDialog();
    await promotionPage.confirmDeleteCategoryAndWaitForDelete();
    await promotionPage.expectLatestAlertContains(/Deleted successfully|Success/i);
    await promotionPage.expectCategoryRowNotVisibleByText(editedName);
  });

  test('category reorder mode can cancel without changing list order', async ({ page }) => {
    test.setTimeout(60000);
    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const firstName = buildPromotionCategoryName('AutoPromoSortOne');
    const secondName = buildPromotionCategoryName('AutoPromoSortTwo');

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.expectCategoryTabVisible();
    await deleteCategoriesMatchingAnyText(promotionPage, STALE_PROMOTION_CATEGORY_PATTERNS);

    try {
      await createCategory(promotionPage, sitePage, MANAGED_BO_SITE, firstName);
      await createCategory(promotionPage, sitePage, MANAGED_BO_SITE, secondName);

      const orderBeforeSort = await promotionPage.categoryRowTexts();
      expect(orderBeforeSort.indexOf(secondName)).toBeGreaterThanOrEqual(0);
      expect(orderBeforeSort.indexOf(firstName)).toBeGreaterThanOrEqual(0);

      await promotionPage.openCategorySortMode();
      await promotionPage.dragCategoryRowByTextToCategoryRow(secondName, firstName);

      const orderDuringSort = await promotionPage.categoryRowTexts();
      expect(orderDuringSort.indexOf(firstName)).toBeLessThan(orderDuringSort.indexOf(secondName));

      await promotionPage.cancelCategorySortMode();

      const orderAfterCancel = await promotionPage.categoryRowTexts();
      expect(orderAfterCancel).toEqual(orderBeforeSort);
    } finally {
      await reloadPromotionCategoryPage(promotionPage);
      await deleteCategoryIfPresent(promotionPage, secondName);
      await deleteCategoryIfPresent(promotionPage, firstName);
    }
  });

  test('category reorder mode can drag and save new list order', async ({ page }) => {
    test.setTimeout(60000);
    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const firstName = buildPromotionCategoryName('AutoPromoSortSaveOne');
    const secondName = buildPromotionCategoryName('AutoPromoSortSaveTwo');

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.expectCategoryTabVisible();
    await deleteCategoriesMatchingAnyText(promotionPage, STALE_PROMOTION_CATEGORY_PATTERNS);

    try {
      await createCategory(promotionPage, sitePage, MANAGED_BO_SITE, firstName);
      await createCategory(promotionPage, sitePage, MANAGED_BO_SITE, secondName);

      const orderBeforeSort = await promotionPage.categoryRowTexts();
      expect(orderBeforeSort.indexOf(secondName)).toBeLessThan(orderBeforeSort.indexOf(firstName));

      await promotionPage.openCategorySortMode();
      await promotionPage.dragCategoryRowByTextToCategoryRow(secondName, firstName);

      const orderDuringSort = await promotionPage.categoryRowTexts();
      expect(orderDuringSort.indexOf(firstName)).toBeLessThan(orderDuringSort.indexOf(secondName));

      const { requestBody } = await promotionPage.submitCategorySortAndWaitForTransaction();
      const payload = requestBody as {
        branchId?: number;
        promotionTypeSort?: number[];
      };

      expect(payload.branchId).toBeGreaterThan(0);
      expect(payload.promotionTypeSort).toBeDefined();
      expect(payload.promotionTypeSort).toHaveLength(orderBeforeSort.length);
      await promotionPage.expectLatestAlertContains(/Sorted successfully|Updated successfully|Success/i);
      await reloadPromotionCategoryPage(promotionPage);

      const orderAfterSave = await promotionPage.categoryRowTexts();
      expect(orderAfterSave.indexOf(firstName)).toBeLessThan(orderAfterSave.indexOf(secondName));
    } finally {
      await reloadPromotionCategoryPage(promotionPage);
      await deleteCategoryIfPresent(promotionPage, secondName);
      await deleteCategoryIfPresent(promotionPage, firstName);
    }
  });

  test('category list disables add action when category count reaches 12', async ({ page }) => {
    test.setTimeout(180000);

    const sitePage = new BOSiteListPage(page);
    const promotionPage = new BOPromotionPage(page);
    const createdNames: string[] = [];

    await promotionPage.gotoPromotion();
    await promotionPage.expectPromotionVisible();
    await promotionPage.selectSiteByName(MANAGED_BO_SITE);
    await promotionPage.expectCategoryTabVisible();
    await deleteCategoriesMatchingAnyText(promotionPage, STALE_PROMOTION_CATEGORY_PATTERNS);

    try {
      const initialRowCount = (await promotionPage.categoryRowTexts()).length;
      const categoriesNeeded = Math.max(0, 12 - initialRowCount);

      for (let index = 0; index < categoriesNeeded; index += 1) {
        const name = buildPromotionCategoryName('AutoPromoLimitCap');
        createdNames.push(name);
        await createCategory(promotionPage, sitePage, MANAGED_BO_SITE, name);
      }

      const rowsAtLimit = await promotionPage.categoryRowTexts();
      expect(rowsAtLimit).toHaveLength(12);
      await promotionPage.expectAddCategoryButtonDisabled();
    } finally {
      await reloadPromotionCategoryPage(promotionPage);

      for (const name of createdNames.reverse()) {
        await deleteCategoryIfPresent(promotionPage, name);
      }

      await deleteCategoriesMatchingAnyText(promotionPage, STALE_PROMOTION_CATEGORY_PATTERNS);
    }
  });
});
