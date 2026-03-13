import path from 'path';
import { test } from './test';
import { BOSiteListPage } from '../../../pages/bo/SiteListPage';
import { buildSiteDraft } from '../helpers/data';

const fixture = (name: string) => path.resolve(process.cwd(), 'tests/fixtures/images', name);

test.describe('BO Site Image Validation', () => {

  test('layout 1 site logo enforces required dimensions', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();

    await sitePage.uploadSiteLogoH5(fixture('wrong-size-64.png'));
    await sitePage.expectLatestAlertContains(await sitePage.copy('size_error', 'backend', { width: 92, height: 48 }));

    await sitePage.uploadSiteLogoWeb(fixture('wrong-size-64.png'));
    await sitePage.expectLatestAlertContains(await sitePage.copy('size_error', 'backend', { width: 226, height: 70 }));
  });

  test('layout 2 site logo enforces required dimensions', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.selectTemplate('Layout 2');

    await sitePage.uploadSiteLogoH5(fixture('logo-h5.png'));
    await sitePage.expectLatestAlertContains(await sitePage.copy('size_error', 'backend', { width: 78, height: 40 }));

    await sitePage.uploadSiteLogoWeb(fixture('logo-web.png'));
    await sitePage.expectLatestAlertContains(await sitePage.copy('size_error', 'backend', { width: 124, height: 64 }));
  });

  test('site logo enforces png webp format and 80KB size limit', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();

    await sitePage.uploadSiteLogoWeb(fixture('logo-web.jpg'));
    await sitePage.expectLatestAlertContains(await sitePage.copy('info_60'));

    await sitePage.uploadSiteLogoWeb(fixture('logo-web-oversize.png'));
    await sitePage.expectLatestAlertContains(await sitePage.copy('file_size_exceeds', 'backend', { size: 80 }));

    await sitePage.uploadSiteLogoH5(fixture('logo-h5.jpg'));
    await sitePage.expectLatestAlertContains(await sitePage.copy('info_60'));

    await sitePage.uploadSiteLogoH5(fixture('logo-h5-oversize.png'));
    await sitePage.expectLatestAlertContains(await sitePage.copy('file_size_exceeds', 'backend', { size: 80 }));
  });

  test('site logo accepts valid png assets and allows next step', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const site = buildSiteDraft('AutoSite');

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.fillRequiredBasicFields(site);

    await sitePage.uploadSiteLogoH5(fixture('logo-h5.png'));
    await sitePage.uploadSiteLogoWeb(fixture('logo-web.png'));

    await sitePage.clickNextStep();
    await sitePage.expectGameSettingsVisible();
  });

  test('frontend favicon accepts webp format', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.uploadFrontendFavicon(fixture('valid-square.webp'));
    await sitePage.expectNoVisibleAlerts();
  });

  test('backend favicon accepts svg format', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.uploadBackendFavicon(fixture('valid-icon.svg'));
    await sitePage.expectNoVisibleAlerts();
  });
});
