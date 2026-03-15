import path from 'path';
import { BOCustomerServicePage } from '../../../pages/bo/CustomerServicePage';
import { buildCustomerServiceDraft } from '../helpers/data';
import { MANAGED_BO_SITE } from '../helpers/site';
import { expect, test } from './test';

const fixture = (name: string) => path.resolve(process.cwd(), 'tests/fixtures/images', name);
const IMAGE_LOGO = fixture('service-logo-l1-valid.png');
const SITE = MANAGED_BO_SITE;

// ── Helpers ────────────────────────────────────────────────────────────────────

async function goToCustomerService(csPage: BOCustomerServicePage) {
  await csPage.gotoCustomerService();
  await csPage.expectCustomerServiceVisible();
}

async function createService(
  csPage: BOCustomerServicePage,
  data: { name: string; serviceId: string },
  siteName: string,
) {
  await csPage.openAddDialog();
  await csPage.expectAddDialogVisible();
  await csPage.selectDialogSiteByName(siteName);
  await csPage.fillName(data.name);
  await csPage.fillServiceId(data.serviceId);
  await csPage.uploadImage(IMAGE_LOGO);
  await csPage.submitDialogAndWaitForCreate();
}

async function deleteServiceByName(csPage: BOCustomerServicePage, name: string) {
  if (!(await csPage.rowByName(name).count())) return;
  await csPage.clickDeleteByName(name);
  await csPage.confirmDeleteDialog();
  await csPage.expectServiceNotInList(name);
}

// Clean up stale auto-created services before tests run against the managed site
async function deleteStaleServices(csPage: BOCustomerServicePage) {
  await csPage.selectSiteByName(SITE);
  for (let i = 0; i < 20; i++) {
    const texts = await csPage.listRowTexts();
    const stale = texts.find((t) => t.startsWith('AutoCS'));
    if (!stale) break;
    await csPage.clickDeleteByName(stale);
    await csPage.confirmDeleteDialog();
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe('BO Customer Service', () => {
  let csPage: BOCustomerServicePage;

  test.beforeEach(async ({ page }) => {
    csPage = new BOCustomerServicePage(page);
    await goToCustomerService(csPage);
  });

  test('customer service page opens with site selector and add button', async () => {
    await csPage.expectCustomerServiceVisible();
    await csPage.expectAddButtonVisible();
  });

  test('add dialog can open and cancel', async () => {
    await csPage.openAddDialog();
    await csPage.expectAddDialogVisible();
    await csPage.cancelDialog();
    await csPage.expectCustomerServiceVisible();
  });

  test('add dialog shows name and id fields immediately', async () => {
    await csPage.openAddDialog();
    await csPage.expectAddDialogVisible();
    // Fields are visible immediately — no site pre-selection required to reveal them
    const dialog = csPage['dialog']();
    await expect(dialog.locator('input.el-input__inner').first()).toBeVisible();
  });

  test('add dialog requires valid name before submit', async () => {
    await csPage.openAddDialog();
    await csPage.selectDialogSiteByName(SITE);
    // Fill an invalid name (numbers not allowed) to trigger format validation
    await csPage.fillName('12345');
    await csPage.submitDialog();
    await csPage.expectFormValidationVisible('service_name_validate');
  });

  test('customer service item can be created and appears in list', async () => {
    const draft = buildCustomerServiceDraft();
    await deleteStaleServices(csPage);
    await createService(csPage, draft, SITE);
    await csPage.selectSiteByName(SITE);
    await csPage.expectServiceInList(draft.name);
    // Cleanup
    await deleteServiceByName(csPage, draft.name);
  });

  test('customer service item can be edited', async () => {
    const draft = buildCustomerServiceDraft();
    await deleteStaleServices(csPage);
    await createService(csPage, draft, SITE);
    await csPage.selectSiteByName(SITE);
    await csPage.openEditByName(draft.name);
    await csPage.expectEditDialogVisible();
    await csPage.fillName(draft.editedName);
    await csPage.submitDialogAndWaitForCreate();
    await csPage.selectSiteByName(SITE);
    await csPage.expectServiceInList(draft.editedName);
    await csPage.expectServiceNotInList(draft.name);
    // Cleanup
    await deleteServiceByName(csPage, draft.editedName);
  });

  test('customer service item can be deleted', async () => {
    const draft = buildCustomerServiceDraft();
    await deleteStaleServices(csPage);
    await createService(csPage, draft, SITE);
    await csPage.selectSiteByName(SITE);
    await csPage.clickDeleteByName(draft.name);
    await csPage.confirmDeleteDialog();
    await csPage.expectServiceNotInList(draft.name);
  });

  test('delete dialog can be canceled without removing the row', async () => {
    const draft = buildCustomerServiceDraft();
    await deleteStaleServices(csPage);
    await createService(csPage, draft, SITE);
    await csPage.selectSiteByName(SITE);
    await csPage.clickDeleteByName(draft.name);
    await csPage.cancelDeleteDialog();
    await csPage.expectServiceInList(draft.name);
    // Cleanup
    await deleteServiceByName(csPage, draft.name);
  });

  test('add button is disabled when list reaches 6 items', async () => {
    test.setTimeout(120000);
    await deleteStaleServices(csPage);
    const created: string[] = [];
    // Fill up to 6 items
    for (let i = 0; i < 6; i++) {
      const draft = buildCustomerServiceDraft();
      await createService(csPage, draft, SITE);
      await csPage.selectSiteByName(SITE);
      created.push(draft.name);
    }
    await csPage.expectAddButtonDisabled();
    // Cleanup — delete all created items
    for (const name of created) {
      await deleteServiceByName(csPage, name);
    }
  });

  test('sort mode can open and cancel without changing list order', async () => {
    test.setTimeout(60000);
    const draft1 = buildCustomerServiceDraft();
    const draft2 = buildCustomerServiceDraft();
    await deleteStaleServices(csPage);
    await createService(csPage, draft1, SITE);
    await csPage.selectSiteByName(SITE);
    await createService(csPage, draft2, SITE);
    await csPage.selectSiteByName(SITE);

    const orderBefore = await csPage.listRowTexts();
    await csPage.openSortMode();
    await csPage.cancelSortMode();
    const orderAfter = await csPage.listRowTexts();
    expect(orderAfter).toEqual(orderBefore);

    // Cleanup
    await deleteServiceByName(csPage, draft1.name);
    await deleteServiceByName(csPage, draft2.name);
  });
});
