import path from 'path';
import { BOCarouselPage } from '../../../pages/bo/CarouselPage';
import { BOSiteListPage } from '../../../pages/bo/SiteListPage';
import { boSmokeAuthFile } from '../helpers/auth-file';
import { buildCarouselLinkDraft, dateTimeOffset } from '../helpers/data';
import { LANGUAGE_VALIDATION_BO_SITE, MANAGED_BO_SITE } from '../helpers/site';
import { expect, test } from './test';

const fixture = (name: string) => path.resolve(process.cwd(), 'tests/fixtures/images', name);
const authFile = boSmokeAuthFile();
const displayedUrl = (url: string) => `https://${url}`;
const MANAGED_CAROUSEL_SITE = MANAGED_BO_SITE;
const LANGUAGE_VALIDATION_CAROUSEL_SITE = LANGUAGE_VALIDATION_BO_SITE;

async function createScheduledHyperlink(
  carouselPage: BOCarouselPage,
  siteName: string,
  url: string,
  startTime: string,
  successToastKey?: string
) {
  await carouselPage.selectListSiteByName(siteName);
  await carouselPage.openAddDialog();
  await carouselPage.selectDialogSiteByName(siteName);
  await carouselPage.fillHyperlink(url);
  await carouselPage.chooseHyperlinkTarget('SameTab');
  await carouselPage.fillStartTime(startTime);
  await carouselPage.chooseTimeMode('Permanent');
  await carouselPage.uploadPrimaryLanguageImages(
    fixture('carousel-web-valid.jpg'),
    fixture('carousel-h5-valid.jpg')
  );
  await carouselPage.submitAddDialogAndWaitForCreate();
  if (successToastKey) {
    await carouselPage.expectLatestAlertContains(await carouselPage.copy(successToastKey));
  }
  await carouselPage.selectListSiteByName(siteName);
  await carouselPage.clickArchiveFilter('Schedule');
}

async function createPastStartHyperlink(
  carouselPage: BOCarouselPage,
  siteName: string,
  url: string,
  startTime: string,
  successToastKey?: string,
  show = true
) {
  await carouselPage.selectListSiteByName(siteName);
  await carouselPage.openAddDialog();
  await carouselPage.selectDialogSiteByName(siteName);
  await carouselPage.fillHyperlink(url);
  await carouselPage.chooseHyperlinkTarget('SameTab');
  await carouselPage.fillStartTime(startTime);
  await carouselPage.chooseTimeMode('Permanent');
  await carouselPage.uploadPrimaryLanguageImages(
    fixture('carousel-web-valid.jpg'),
    fixture('carousel-h5-valid.jpg')
  );
  await carouselPage.submitAddDialogAndWaitForCreate();
  if (successToastKey) {
    await carouselPage.expectLatestAlertContains(await carouselPage.copy(successToastKey));
  }
  await carouselPage.selectListSiteByName(siteName);
  await carouselPage.clickArchiveFilter('Publish');
  await carouselPage.toggleDisplayFilter(show);
}

async function ensurePastStartHyperlinkVisibleInPublishShow(
  carouselPage: BOCarouselPage,
  siteName: string,
  url: string,
  startTime: string,
  successToastKey?: string
) {
  const expectedUrl = displayedUrl(url);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await createPastStartHyperlink(carouselPage, siteName, url, startTime, successToastKey, true);
    await carouselPage.expectCurrentView(true, 'Publish');

    if ((await carouselPage.rowByText(expectedUrl).count()) > 0) {
      return;
    }

    await clearManagedCarouselSite(carouselPage);
  }

  throw new Error(`Unable to place carousel in publish-show view: ${expectedUrl}`);
}

async function removeCarouselFromCurrentView(
  carouselPage: BOCarouselPage,
  rowText: string
) {
  const inactiveMessage = await carouselPage.copy('confirm_inactive_again');
  const deletionMessage = await carouselPage.copy('confirm_deletion_again');

  await carouselPage.clickLowerRowByText(rowText);
  const confirmText = await carouselPage.currentConfirmDialogText();

  if (confirmText.includes(inactiveMessage)) {
    await carouselPage.confirmInactiveAndWaitForStatusChange();
    await carouselPage.clickArchiveFilter('Unpublish');
    await carouselPage.expectRowVisibleByText(rowText);
    await carouselPage.clickDeleteRowByText(rowText);
    await carouselPage.expectConfirmDeletionDialog();
    await carouselPage.confirmDeletionAndWaitForDelete();
    return;
  }

  if (confirmText.includes(deletionMessage)) {
    await carouselPage.confirmDeletionAndWaitForDelete();
    return;
  }

  throw new Error(`Unexpected carousel confirm dialog: ${confirmText}`);
}

async function clearCarouselRowsInView(
  carouselPage: BOCarouselPage,
  status: 'Publish' | 'Schedule' | 'Unpublish',
  show = true
) {
  const inactiveMessage = await carouselPage.copy('confirm_inactive_again');
  const deletionMessage = await carouselPage.copy('confirm_deletion_again');

  await carouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
  await carouselPage.clickArchiveFilter(status);

  if (status === 'Publish') {
    await carouselPage.toggleDisplayFilter(show);
  }

  for (let attempt = 0; attempt < 50; attempt += 1) {
    if ((await carouselPage.rowCount()) === 0) {
      return;
    }

    const rowText = await carouselPage.firstRowText();

    if (status === 'Unpublish') {
      await carouselPage.clickDeleteRowByText(rowText);
      await carouselPage.expectConfirmDeletionDialog();
      await carouselPage.confirmDeletionAndWaitForDelete();
    } else if (status === 'Publish') {
      await carouselPage.clickLowerRowByText(rowText);
      const confirmText = await carouselPage.currentConfirmDialogText();

      if (confirmText.includes(inactiveMessage)) {
        await carouselPage.confirmInactiveAndWaitForStatusChange();
        await carouselPage.clickArchiveFilter('Unpublish');

        if ((await carouselPage.rowCount()) > 0) {
          await carouselPage.clickDeleteRowByText(await carouselPage.firstRowText());
          await carouselPage.expectConfirmDeletionDialog();
          await carouselPage.confirmDeletionAndWaitForDelete();
        }
      } else if (confirmText.includes(deletionMessage)) {
        await carouselPage.confirmDeletionAndWaitForDelete();
      } else {
        throw new Error(`Unexpected carousel confirm dialog during cleanup: ${confirmText}`);
      }
    } else {
      await removeCarouselFromCurrentView(carouselPage, rowText);
    }

    await carouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
    await carouselPage.clickArchiveFilter(status);

    if (status === 'Publish') {
      await carouselPage.toggleDisplayFilter(show);
    }
  }

  throw new Error(
    `Failed to clear carousel rows in ${status}${status === 'Publish' ? `:${show ? 'show' : 'hide'}` : ''} view`
  );
}

async function clearManagedCarouselSite(carouselPage: BOCarouselPage) {
  await clearCarouselRowsInView(carouselPage, 'Publish', true);
  await clearCarouselRowsInView(carouselPage, 'Publish', false);
  await clearCarouselRowsInView(carouselPage, 'Schedule');
  await clearCarouselRowsInView(carouselPage, 'Unpublish');
}

async function seedPublishedCarousels(
  carouselPage: BOCarouselPage,
  count: number,
  prefix: string
) {
  for (let index = 0; index < count; index += 1) {
    const draft = buildCarouselLinkDraft(`${prefix}-${index}`);
    await createPastStartHyperlink(carouselPage, MANAGED_CAROUSEL_SITE, draft.url, dateTimeOffset(-120 - index));
  }
}

test.describe('BO Carousel', () => {
  test.describe.configure({ timeout: 120000, mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await clearManagedCarouselSite(carouselPage);
  });

  test.afterAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(120000);
    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();
    const carouselPage = new BOCarouselPage(page);

    try {
      await page.goto('/dashboard');
      await carouselPage.gotoCarouselList();
      await carouselPage.expectCarouselListVisible();
      await clearManagedCarouselSite(carouselPage);
    } finally {
      await context.close();
    }
  });

  test('carousel list page opens with site selector and default list', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
    await carouselPage.clickArchiveFilter('Publish');
    await carouselPage.toggleDisplayFilter(true);
    await carouselPage.expectDefaultListVisible();
  });

  test('add carousel dialog can open and cancel', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSite();
    await carouselPage.openAddDialog();
    await carouselPage.cancelAddDialog();
  });

  test('site selector is required on add carousel dialog', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSite();
    await carouselPage.openAddDialog();
    await carouselPage.confirmAddDialog();
    await carouselPage.expectRequiredErrorCount(5);
  });

  test('hyperlink type shows url input and target options', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSite();
    await carouselPage.openAddDialog();
    await carouselPage.selectFirstDialogSite();
    await carouselPage.waitForImageUploadsReady();
    await carouselPage.expectHyperlinkFieldsVisible();
  });

  test('hyperlink type validates https url format', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSite();
    await carouselPage.openAddDialog();
    await carouselPage.selectFirstDialogSite();
    await carouselPage.waitForImageUploadsReady();
    await carouselPage.fillHyperlink('abc');
    await carouselPage.confirmAddDialog();
    await carouselPage.expectAnyErrorTextByKey('info_43');
  });

  test('none link type hides hyperlink and specific game fields', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSite();
    await carouselPage.openAddDialog();
    await carouselPage.selectFirstDialogSite();
    await carouselPage.waitForImageUploadsReady();
    await carouselPage.chooseLinkType('None');
    await carouselPage.expectNoneLinkFieldsHidden();
  });

  test('specific game type requires game selection', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSite();
    await carouselPage.openAddDialog();
    await carouselPage.selectFirstDialogSite();
    await carouselPage.waitForImageUploadsReady();
    await carouselPage.chooseLinkType('SpecificGame');
    await carouselPage.expectSpecificGameFieldsVisible();
    await carouselPage.confirmAddDialog();
    await carouselPage.expectRequiredErrorCount(7);
  });

  test('upload image validates jpg webp format and size limit', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSite();
    await carouselPage.openAddDialog();
    await carouselPage.selectFirstDialogSite();
    await carouselPage.waitForImageUploadsReady();

    await carouselPage.uploadWebImage(fixture('carousel-web-invalid.png'));
    await carouselPage.expectLatestAlertContains(await carouselPage.copy('info_63'));

    await carouselPage.uploadWebImage(fixture('carousel-web-oversize.jpg'));
    await carouselPage.expectLatestAlertContains(await carouselPage.copy('file_size_exceeds', 'backend', { size: 600 }));

    await carouselPage.cancelAddDialog();
    await carouselPage.openAddDialog();
    await carouselPage.selectFirstDialogSite();
    await carouselPage.waitForImageUploadsReady();

    await carouselPage.uploadInitialH5Image(fixture('carousel-h5-invalid.png'));
    await carouselPage.expectLatestAlertContains(await carouselPage.copy('info_63'));

    await carouselPage.uploadInitialH5Image(fixture('carousel-h5-oversize.jpg'));
    await carouselPage.expectLatestAlertContains(await carouselPage.copy('file_size_exceeds', 'backend', { size: 150 }));
  });

  test('carousel image language tabs follow the site primary and other language settings', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const carouselPage = new BOCarouselPage(page);
    const localeSettings = await sitePage.fetchSiteLocaleSettingsBySiteName(LANGUAGE_VALIDATION_CAROUSEL_SITE);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSiteByName(LANGUAGE_VALIDATION_CAROUSEL_SITE);
    await carouselPage.openAddDialog();
    await carouselPage.selectDialogSiteByName(LANGUAGE_VALIDATION_CAROUSEL_SITE);
    await carouselPage.waitForImageUploadsReady();
    await carouselPage.expectImageLanguageTabs(
      localeSettings.localeLabelsInOrder,
      localeSettings.primaryLocaleLabel
    );
  });

  test('create banner payload only includes locales allowed by the selected site', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const carouselPage = new BOCarouselPage(page);
    const localeSettings = await sitePage.fetchSiteLocaleSettingsBySiteName(MANAGED_CAROUSEL_SITE);
    const draft = buildCarouselLinkDraft('carousel-payload-locales');
    const startTime = dateTimeOffset(420);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
    await carouselPage.openAddDialog();
    await carouselPage.selectDialogSiteByName(MANAGED_CAROUSEL_SITE);
    await carouselPage.fillHyperlink(draft.url);
    await carouselPage.chooseHyperlinkTarget('SameTab');
    await carouselPage.fillStartTime(startTime);
    await carouselPage.chooseTimeMode('Permanent');
    await carouselPage.uploadPrimaryLanguageImages(
      fixture('carousel-web-valid.jpg'),
      fixture('carousel-h5-valid.jpg')
    );

    const { requestBody } = await carouselPage.submitAddDialogAndWaitForCreateTransaction();
    const imageLocaleCodes = carouselPage.extractImageLocaleCodesFromPayload(requestBody);
    const allowedLocaleCodes = [localeSettings.primaryLocaleCode, ...localeSettings.otherLocaleCodes];

    expect(imageLocaleCodes.length).toBeGreaterThan(0);
    expect(imageLocaleCodes.every((localeCode) => allowedLocaleCodes.includes(localeCode))).toBe(true);

    await carouselPage.expectLatestAlertContains(await carouselPage.copy('create_banner_information_1'));
    await carouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
    await carouselPage.clickArchiveFilter('Schedule');
    await removeCarouselFromCurrentView(carouselPage, displayedUrl(draft.url));
  });

  test('permanent time option disables end time', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSite();
    await carouselPage.openAddDialog();
    await carouselPage.selectFirstDialogSite();
    await carouselPage.waitForImageUploadsReady();
    await carouselPage.chooseTimeMode('Permanent');
    await carouselPage.expectEndTimeDisabled();
  });

  test('other time option requires end time for none link type', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSite();
    await carouselPage.openAddDialog();
    await carouselPage.selectDialogSiteByName(MANAGED_CAROUSEL_SITE);
    await carouselPage.waitForImageUploadsReady();
    await carouselPage.chooseLinkType('None');
    await carouselPage.chooseTimeMode('Other');
    await carouselPage.confirmAddDialog();
    await carouselPage.expectRequiredErrorCount(4);
  });

  test('other time validates start time is earlier than end time', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);
    const startTime = dateTimeOffset(120);
    const endTime = dateTimeOffset(60);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSite();
    await carouselPage.openAddDialog();
    await carouselPage.selectDialogSiteByName(MANAGED_CAROUSEL_SITE);
    await carouselPage.waitForImageUploadsReady();
    await carouselPage.chooseLinkType('None');
    await carouselPage.fillStartTime(startTime);
    await carouselPage.chooseTimeMode('Other');
    await carouselPage.fillEndTime(endTime);
    await carouselPage.confirmAddDialog();
    await carouselPage.expectAnyErrorTextByKey('time_validate_1');
    await carouselPage.expectAnyErrorTextByKey('time_validate_2');
  });

  test('hyperlink carousel can be scheduled and appears in schedule list', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);
    const draft = buildCarouselLinkDraft('carousel-link');
    const startTime = dateTimeOffset(360);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
    await createScheduledHyperlink(
      carouselPage,
      MANAGED_CAROUSEL_SITE,
      draft.url,
      startTime,
      'create_banner_information_1'
    );
    await carouselPage.clickArchiveFilter('Schedule');
    await carouselPage.expectRowVisibleByTexts([displayedUrl(draft.url), startTime]);
  });

  test('specific game carousel can be scheduled and appears in schedule list', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);
    const startTime = dateTimeOffset(40);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
    await carouselPage.openAddDialog();
    await carouselPage.selectDialogSiteByName(MANAGED_CAROUSEL_SITE);
    await carouselPage.chooseLinkType('SpecificGame');
    const provider = await carouselPage.chooseFirstGameProvider();
    await carouselPage.chooseFirstGameType();
    await carouselPage.chooseFirstGameName();
    await carouselPage.fillStartTime(startTime);
    await carouselPage.chooseTimeMode('Permanent');
    await carouselPage.uploadPrimaryLanguageImages(
      fixture('carousel-web-valid.jpg'),
      fixture('carousel-h5-valid.jpg')
    );
    await carouselPage.submitAddDialogAndWaitForCreate();
    await carouselPage.expectLatestAlertContains(await carouselPage.copy('create_banner_information_1'));
    await carouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
    await carouselPage.clickArchiveFilter('Schedule');
    await carouselPage.expectRowVisibleByTexts([provider, startTime]);
  });

  test('past-start hyperlink carousel appears in publish show list when display slots remain', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);
    const draft = buildCarouselLinkDraft('carousel-publish');

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await ensurePastStartHyperlinkVisibleInPublishShow(
      carouselPage,
      MANAGED_CAROUSEL_SITE,
      draft.url,
      dateTimeOffset(-5),
      'create_banner_information_0'
    );
    await carouselPage.expectRowVisibleByText(displayedUrl(draft.url));
  });

  test('publish-show carousel can be unpublished and then deleted from offline list', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);
    const draft = buildCarouselLinkDraft('carousel-lower');

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await ensurePastStartHyperlinkVisibleInPublishShow(
      carouselPage,
      MANAGED_CAROUSEL_SITE,
      draft.url,
      dateTimeOffset(-10)
    );
    await carouselPage.expectRowVisibleByText(displayedUrl(draft.url));
    await removeCarouselFromCurrentView(carouselPage, displayedUrl(draft.url));
    await carouselPage.expectRowNotVisibleByText(displayedUrl(draft.url));
  });

  test('scheduled hyperlink carousel can open edit dialog and submit successfully', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);
    const draft = buildCarouselLinkDraft('carousel-edit');
    const startTime = dateTimeOffset(10000);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
    await createScheduledHyperlink(carouselPage, MANAGED_CAROUSEL_SITE, draft.url, startTime);
    await carouselPage.clickArchiveFilter('Schedule');
    await carouselPage.openEditRowByText(displayedUrl(draft.url));
    await carouselPage.expectEditDialogSiteDisabled();
    await carouselPage.submitEditDialogAndWaitForUpdate();
    await carouselPage.expectRowVisibleByText(displayedUrl(draft.url));
  });

  test('offline carousel edit without time changes shows generic success toast', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);
    const draft = buildCarouselLinkDraft('carousel-offline-edit');

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await ensurePastStartHyperlinkVisibleInPublishShow(
      carouselPage,
      MANAGED_CAROUSEL_SITE,
      draft.url,
      dateTimeOffset(-12)
    );
    await carouselPage.clickLowerRowByText(displayedUrl(draft.url));
    await carouselPage.expectConfirmInactiveDialog();
    await carouselPage.confirmInactiveAndWaitForStatusChange();
    await carouselPage.clickArchiveFilter('Unpublish');
    await carouselPage.expectRowVisibleByText(displayedUrl(draft.url));

    await carouselPage.openEditRowByText(displayedUrl(draft.url));
    await carouselPage.expectEditDialogSiteDisabled();
    await carouselPage.submitEditDialogAndWaitForUpdate();
    await carouselPage.expectLatestAlertContains(await carouselPage.copy('create_banner_information_3'));
    await carouselPage.expectRowVisibleByText(displayedUrl(draft.url));

    await carouselPage.clickDeleteRowByText(displayedUrl(draft.url));
    await carouselPage.expectConfirmDeletionDialog();
    await carouselPage.confirmDeletionAndWaitForDelete();
  });

  test('reorder mode can drag and save', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);
    await seedPublishedCarousels(carouselPage, 2, 'carousel-reorder-seed');

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
    await carouselPage.clickArchiveFilter('Publish');
    await carouselPage.toggleDisplayFilter(true);

    const before = await carouselPage.rowTexts();
    const firstBefore = before[0] ?? '';
    const secondBefore = before[1] ?? '';

    await carouselPage.enterReorderMode();
    await carouselPage.dragRowToIndex(0, 1);
    await carouselPage.saveReorderAndWaitForSuccess();
    await carouselPage.expectLatestAlertContains(await carouselPage.copy('success'));

    const after = await carouselPage.rowTexts();
    expect(after[0] ?? '').toContain(secondBefore);
    expect(after[1] ?? '').toContain(firstBefore);

    await carouselPage.enterReorderMode();
    await carouselPage.dragRowToIndex(1, 0);
    await carouselPage.saveReorderAndWaitForSuccess();

    const restored = await carouselPage.rowTexts();
    expect(restored[0] ?? '').toContain(firstBefore);
  });

  test('publish-show list can switch display status and move the row between show and hide views', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);
    const draft = buildCarouselLinkDraft('carousel-display');

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await ensurePastStartHyperlinkVisibleInPublishShow(
      carouselPage,
      MANAGED_CAROUSEL_SITE,
      draft.url,
      dateTimeOffset(-15)
    );
    await carouselPage.expectRowVisibleByText(displayedUrl(draft.url));

    await carouselPage.toggleRowDisplayStatusByText(displayedUrl(draft.url));
    await carouselPage.expectLatestAlertContains(await carouselPage.copy('success'));
    await carouselPage.expectRowNotVisibleByText(displayedUrl(draft.url));

    await carouselPage.toggleDisplayFilter(false);
    await carouselPage.expectRowVisibleByText(displayedUrl(draft.url));

    await carouselPage.toggleRowDisplayStatusByText(displayedUrl(draft.url));
    await carouselPage.expectLatestAlertContains(await carouselPage.copy('success'));
    await carouselPage.expectRowNotVisibleByText(displayedUrl(draft.url));

    await carouselPage.toggleDisplayFilter(true);
    await carouselPage.expectRowVisibleByText(displayedUrl(draft.url));

    await removeCarouselFromCurrentView(carouselPage, displayedUrl(draft.url));
  });

  test('schedule item can open lower-action confirmation and be removed from the list', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);
    const draft = buildCarouselLinkDraft('carousel-unpublish');
    const startTime = dateTimeOffset(11000);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
    await createScheduledHyperlink(carouselPage, MANAGED_CAROUSEL_SITE, draft.url, startTime);
    await carouselPage.clickArchiveFilter('Schedule');
    await carouselPage.expectRowVisibleByText(displayedUrl(draft.url));
    await removeCarouselFromCurrentView(carouselPage, displayedUrl(draft.url));
    await carouselPage.expectRowNotVisibleByText(displayedUrl(draft.url));
  });

  test('past-start carousel auto-switches to publish hide list and shows create-time limit warning when display slots are full', async ({ page }) => {
    test.setTimeout(240000);
    const carouselPage = new BOCarouselPage(page);
    const draft = buildCarouselLinkDraft('carousel-limit');
    await seedPublishedCarousels(carouselPage, 8, 'carousel-limit-seed');

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
    await createPastStartHyperlink(
      carouselPage,
      MANAGED_CAROUSEL_SITE,
      draft.url,
      dateTimeOffset(-20),
      'create_banner_information_2',
      false
    );
    await carouselPage.expectCurrentView(false, 'Publish');
    await carouselPage.expectRowVisibleByText(displayedUrl(draft.url));

    await removeCarouselFromCurrentView(carouselPage, displayedUrl(draft.url));
  });

  test('publish-hide list shows limit warning when switching hidden carousel back to show while display slots are full', async ({ page }) => {
    test.setTimeout(240000);
    const carouselPage = new BOCarouselPage(page);
    const draft = buildCarouselLinkDraft('carousel-hide-limit');
    await seedPublishedCarousels(carouselPage, 8, 'carousel-hide-limit-seed');

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
    await createPastStartHyperlink(
      carouselPage,
      MANAGED_CAROUSEL_SITE,
      draft.url,
      dateTimeOffset(-25),
      undefined,
      false
    );
    await carouselPage.expectCurrentView(false, 'Publish');
    await carouselPage.expectRowVisibleByText(displayedUrl(draft.url));

    await carouselPage.toggleRowDisplayStatusByText(displayedUrl(draft.url));
    await carouselPage.expectLatestAlertContainsAny([
      await carouselPage.copy('create_banner_information_2'),
      await carouselPage.copy('000420', 'error_code'),
      await carouselPage.copy('000442', 'error_code'),
    ]);
    await carouselPage.expectCurrentView(false, 'Publish');
    await carouselPage.expectRowVisibleByText(displayedUrl(draft.url));

    await removeCarouselFromCurrentView(carouselPage, displayedUrl(draft.url));
  });

  test('concurrent update warning is handled', async ({ page, browser }) => {
    const carouselPage = new BOCarouselPage(page);
    const draft = buildCarouselLinkDraft('carousel-race-edit');
    const startTime = dateTimeOffset(12000);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
    await createScheduledHyperlink(carouselPage, MANAGED_CAROUSEL_SITE, draft.url, startTime);
    await carouselPage.clickArchiveFilter('Schedule');
    await carouselPage.openEditRowByText(displayedUrl(draft.url));

    const secondContext = await browser.newContext({ storageState: authFile });
    const secondPage = await secondContext.newPage();
    const secondCarouselPage = new BOCarouselPage(secondPage);

    try {
      await secondPage.goto(new URL('/dashboard', page.url()).toString());
      await secondCarouselPage.gotoCarouselList();
      await secondCarouselPage.expectCarouselListVisible();
      await secondCarouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
      await secondCarouselPage.clickArchiveFilter('Schedule');
      await removeCarouselFromCurrentView(secondCarouselPage, displayedUrl(draft.url));

      await carouselPage.submitEditDialogAndWaitForUpdateResult();
      await carouselPage.expectLatestAlertContainsAny([
        await carouselPage.copy('000416', 'error_code'),
        await carouselPage.copy('000439', 'error_code'),
        await carouselPage.copy('000684', 'error_code'),
      ]);
    } finally {
      await secondContext.close();
    }
  });

  test('concurrent delete warning is handled', async ({ page, browser }) => {
    const carouselPage = new BOCarouselPage(page);
    const draft = buildCarouselLinkDraft('carousel-race-delete');
    const startTime = dateTimeOffset(13000);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
    await createScheduledHyperlink(carouselPage, MANAGED_CAROUSEL_SITE, draft.url, startTime);
    await carouselPage.clickArchiveFilter('Schedule');
    await carouselPage.clickLowerRowByText(displayedUrl(draft.url));
    await carouselPage.expectConfirmDeletionDialog();

    const secondContext = await browser.newContext({ storageState: authFile });
    const secondPage = await secondContext.newPage();
    const secondCarouselPage = new BOCarouselPage(secondPage);

    try {
      await secondPage.goto(new URL('/dashboard', page.url()).toString());
      await secondCarouselPage.gotoCarouselList();
      await secondCarouselPage.expectCarouselListVisible();
      await secondCarouselPage.selectListSiteByName(MANAGED_CAROUSEL_SITE);
      await secondCarouselPage.clickArchiveFilter('Schedule');
      await removeCarouselFromCurrentView(secondCarouselPage, displayedUrl(draft.url));

      await carouselPage.confirmDeletionAndWaitForDeleteResult();
      await carouselPage.expectLatestAlertContainsAny([
        await carouselPage.copy('000416', 'error_code'),
        await carouselPage.copy('000439', 'error_code'),
        await carouselPage.copy('000684', 'error_code'),
      ]);
    } finally {
      await secondContext.close();
    }
  });
});
