import path from 'path';
import { BOCarouselPage } from '../../../pages/bo/CarouselPage';
import { buildCarouselLinkDraft, dateTimeOffset } from '../helpers/data';
import { test } from './test';

const fixture = (name: string) => path.resolve(process.cwd(), 'tests/fixtures/images', name);
const displayedUrl = (url: string) => `https://${url}`;
const EMPTY_CAROUSEL_SITE = '站長後台2';

async function createScheduledHyperlink(
  carouselPage: BOCarouselPage,
  siteName: string,
  url: string,
  startTime: string
) {
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
  await carouselPage.selectListSiteByName(siteName);
}

async function createPublishedHyperlink(
  carouselPage: BOCarouselPage,
  siteName: string,
  url: string,
  startTime: string
) {
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
  await carouselPage.selectListSiteByName(siteName);
}

test.describe('BO Carousel', () => {
  test('carousel list page opens with site selector and default list', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSite();
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

  test('hyperlink carousel can be scheduled and appears in schedule list', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);
    const draft = buildCarouselLinkDraft('carousel-link');
    const startTime = dateTimeOffset(360);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSiteByName(EMPTY_CAROUSEL_SITE);
    await createScheduledHyperlink(carouselPage, EMPTY_CAROUSEL_SITE, draft.url, startTime);
    await carouselPage.clickArchiveFilter('Schedule');
    await carouselPage.expectRowVisibleByTexts([displayedUrl(draft.url), startTime]);
  });

  test('specific game carousel can be scheduled and appears in schedule list', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);
    const startTime = dateTimeOffset(40);

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSiteByName(EMPTY_CAROUSEL_SITE);
    await carouselPage.openAddDialog();
    await carouselPage.selectDialogSiteByName(EMPTY_CAROUSEL_SITE);
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
    await carouselPage.selectListSiteByName(EMPTY_CAROUSEL_SITE);
    await carouselPage.clickArchiveFilter('Schedule');
    await carouselPage.expectFirstRowContains(provider);
  });

  test('published hyperlink carousel shows publish success and appears in list', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);
    const draft = buildCarouselLinkDraft('carousel-publish');

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await createPublishedHyperlink(carouselPage, EMPTY_CAROUSEL_SITE, draft.url, dateTimeOffset(-5));
    await carouselPage.expectRowVisibleByText(displayedUrl(draft.url));
  });

  test('published carousel can be deleted from list', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);
    const draft = buildCarouselLinkDraft('carousel-lower');

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await createPublishedHyperlink(carouselPage, EMPTY_CAROUSEL_SITE, draft.url, dateTimeOffset(-10));
    await carouselPage.expectRowVisibleByText(displayedUrl(draft.url));
    await carouselPage.clickLowerRowByText(displayedUrl(draft.url));
    await carouselPage.expectConfirmDeletionDialog();
    await carouselPage.confirmDeletionAndWaitForDelete();
    await carouselPage.expectRowNotVisibleByText(displayedUrl(draft.url));
  });

  test('scheduled hyperlink carousel can open edit dialog and submit successfully', async ({ page }) => {
    const carouselPage = new BOCarouselPage(page);
    const draft = buildCarouselLinkDraft('carousel-edit');

    await carouselPage.gotoCarouselList();
    await carouselPage.expectCarouselListVisible();
    await carouselPage.selectListSiteByName(EMPTY_CAROUSEL_SITE);
    await createScheduledHyperlink(carouselPage, EMPTY_CAROUSEL_SITE, draft.url, dateTimeOffset(60));
    await carouselPage.clickArchiveFilter('Schedule');
    await carouselPage.openEditRowByText(displayedUrl(draft.url));
    await carouselPage.submitEditDialogAndWaitForUpdate();
    await carouselPage.expectRowVisibleByText(displayedUrl(draft.url));
  });
});
