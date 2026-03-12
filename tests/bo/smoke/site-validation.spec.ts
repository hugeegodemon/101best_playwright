import path from 'path';
import { expect, test } from '@playwright/test';
import { BOSiteListPage } from '../../../pages/bo/SiteListPage';
import { ENV } from '../../../utils/env';
import { useLocaleInContext } from '../../../utils/i18n';

const fixture = (name: string) => path.resolve(process.cwd(), 'tests/fixtures/images', name);
const BANGLA = '\u09ac\u09be\u0982\u09b2\u09be';

test.describe('BO Site Validation', () => {
  test.beforeEach(async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);
    await page.goto(`${ENV.SBO_URL}/dashboard`);
  });

  test('add site requires mandatory basic fields before next step', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.clickNextStep();

    await expect(page).toHaveURL(/\/system\/branch\/add$/);
    await sitePage.expectFieldError('Site Name', 'Required');
    await sitePage.expectFieldError('Status', 'Required');
    await sitePage.expectFieldError('Frontend Status', 'Required');
    await sitePage.expectFieldError('Region', 'Required');
    await sitePage.expectFieldError('Time Zone', 'Required');
    await sitePage.expectFieldError('Primary language (required in backend)', 'Required');
    await sitePage.expectFieldError('Hidden code', 'Required');
    await sitePage.expectErrorTextCount('Required', 11);
  });

  test('other regions cannot include selected primary region', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.selectRegion('Vietnam');
    await sitePage.openOtherRegions();
    await sitePage.expectOptionNotVisible('Vietnam');
    await sitePage.closeSelectDropdown();
  });

  test('other languages cannot include selected primary language', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.selectPrimaryLanguage('English');
    await sitePage.openOtherLanguages();
    await sitePage.expectOptionNotVisible('English');
    await sitePage.expectOptionVisible(BANGLA);
    await sitePage.closeSelectDropdown();
  });

  test('add site validates hidden code and url formats before next step', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.fillSiteName('SiteValid01');
    await sitePage.selectStatus('Enable');
    await sitePage.selectFrontendStatus('Enable');
    await sitePage.selectRegion('Vietnam');
    await sitePage.selectTimeZone('Asia/Ho_Chi_Minh');
    await sitePage.selectPrimaryLanguage('English');
    await sitePage.fillHiddenCode('A#');
    await sitePage.fillFrontendUrl('bad-url');
    await sitePage.fillBackendUrl('bad-url');
    await sitePage.clickNextStep();

    await expect(page).toHaveURL(/\/system\/branch\/add$/);
    await sitePage.expectFieldError('Hidden code', '1\u20138 alphanumerics');
    await sitePage.expectAnyErrorText('Please enter a valid URL format');
  });

  test('game settings can open and go back without losing basic information', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const suffix = String(Date.now()).slice(-8);
    const data = {
      siteName: `GS${suffix}`,
      hiddenCode: `HC${suffix.slice(-6)}`,
      frontendUrl: `www.gs${suffix}-front.com`,
      backendUrl: `www.gs${suffix}-back.com`,
    };

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.fillRequiredBasicFields(data);
    await sitePage.uploadSiteLogoH5(fixture('logo-h5.png'));
    await sitePage.uploadSiteLogoWeb(fixture('logo-web.png'));
    await sitePage.clickNextStep();

    await sitePage.expectGameSettingsVisible();
    await sitePage.expectGameProviderVisible('Slots');
    await sitePage.clickPreviousStep();
    await sitePage.expectAddSiteVisible();
    await sitePage.expectBasicInfoValues(data);
  });

  test('game settings allows changing provider switch before successful create', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const suffix = String(Date.now()).slice(-8);

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.fillRequiredBasicFields({
      siteName: `GT${suffix}`,
      hiddenCode: `HC${suffix.slice(-6)}`,
      frontendUrl: `www.gt${suffix}-front.com`,
      backendUrl: `www.gt${suffix}-back.com`,
    });
    await sitePage.uploadSiteLogoH5(fixture('logo-h5.png'));
    await sitePage.uploadSiteLogoWeb(fixture('logo-web.png'));
    await sitePage.clickNextStep();

    await sitePage.expectGameSettingsVisible();
    await expect(sitePage.firstGameSettingSwitch()).toBeVisible();
    await sitePage.firstGameSettingSwitch().click({ force: true });
    await sitePage.saveFromGameSettings();
    await sitePage.expectCreateSuccessAndReturnToList();
  });
});
