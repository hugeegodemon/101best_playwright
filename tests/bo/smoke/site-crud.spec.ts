import path from 'path';
import { expect, test } from '@playwright/test';
import { BOSiteListPage } from '../../../pages/bo/SiteListPage';
import { ENV } from '../../../utils/env';
import { useLocaleInContext } from '../../../utils/i18n';

const fixture = (name: string) => path.resolve(process.cwd(), 'tests/fixtures/images', name);

test.describe('BO Site CRUD', () => {
  test.describe.configure({ mode: 'serial' });
  const siteSuffix = () => String(Date.now()).slice(-8);

  test.beforeEach(async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);
    await page.goto(`${ENV.SBO_URL}/dashboard`);
  });

  test('can create site and show it at top of site list', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const suffix = siteSuffix();
    const siteName = `AS${suffix}`;

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.completeMinimalCreateFlow({
      siteName,
      hiddenCode: `HC${suffix.slice(-6)}`,
      frontendUrl: `www.as${suffix}-front.com`,
      backendUrl: `www.as${suffix}-back.com`,
      webLogoPath: fixture('logo-web.png'),
      h5LogoPath: fixture('logo-h5.png'),
    });
    await sitePage.expectCreateSuccessAndReturnToList();
    await sitePage.waitForToastToDisappear();
    await sitePage.searchSite(siteName);
    await sitePage.expectSearchShowsSite(siteName);
    const texts = await sitePage.rowTextsBySiteName(siteName);
    const regionText = await sitePage.regionText();
    expect(texts[0]).toContain(siteName);
    expect(texts[1]).toContain(regionText);
    expect(texts[2]).toContain('Asia/Ho_Chi_Minh');
    expect(texts[3]).toBe('ON');
  });

  test('can edit created site and keep hidden code disabled on edit page', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const suffix = siteSuffix();
    const siteName = `AS${suffix}`;
    const editedName = `${siteName}E`;
    const editedFrontendUrl = `www.as${suffix}-fe.com`;
    const editedBackendUrl = `www.as${suffix}-be.com`;

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.completeMinimalCreateFlow({
      siteName,
      hiddenCode: `HC${suffix.slice(-6)}`,
      frontendUrl: `www.as${suffix}-front.com`,
      backendUrl: `www.as${suffix}-back.com`,
      webLogoPath: fixture('logo-web.png'),
      h5LogoPath: fixture('logo-h5.png'),
    });
    await sitePage.expectCreateSuccessAndReturnToList();
    await sitePage.waitForToastToDisappear();
    await sitePage.searchSite(siteName);
    await sitePage.expectSearchShowsSite(siteName);

    await sitePage.clickEditRowBySiteName(siteName);
    await sitePage.expectEditSiteVisible();
    await sitePage.expectEditFieldStates();

    await sitePage.fillEditBasicFields({
      siteName: editedName,
      frontendUrl: editedFrontendUrl,
      backendUrl: editedBackendUrl,
    });
    await sitePage.saveEdit();
    await expect(page).toHaveURL(/\/system\/branch$/);
    await sitePage.waitForToastToDisappear();
    await sitePage.searchSite(editedName);
    await sitePage.expectSearchShowsSite(editedName);
  });

  test('can toggle created site back-office and frontend status from list', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const suffix = siteSuffix();
    const siteName = `AS${suffix}`;

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.completeMinimalCreateFlow({
      siteName,
      hiddenCode: `HC${suffix.slice(-6)}`,
      frontendUrl: `www.as${suffix}-front.com`,
      backendUrl: `www.as${suffix}-back.com`,
      webLogoPath: fixture('logo-web.png'),
      h5LogoPath: fixture('logo-h5.png'),
    });
    await sitePage.expectCreateSuccessAndReturnToList();
    await sitePage.waitForToastToDisappear();
    await sitePage.searchSite(siteName);
    await sitePage.expectSearchShowsSite(siteName);

    await sitePage.toggleRowBackOfficeStatus(siteName);
    await page.waitForTimeout(800);
    let texts = await sitePage.rowTextsBySiteName(siteName);
    expect(texts[0]).toContain(siteName);
    expect(texts[3]).toBe('OFF');
    expect(texts[4]).toBe('ON');

    await sitePage.toggleRowFrontendStatus(siteName);
    await page.waitForTimeout(800);
    texts = await sitePage.rowTextsBySiteName(siteName);
    expect(texts[0]).toContain(siteName);
    expect(texts[3]).toBe('OFF');
    expect(texts[4]).toBe('OFF');
  });

  test('edit site keeps primary language and hidden code disabled while other basic fields stay editable', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const suffix = siteSuffix();
    const siteName = `AS${suffix}`;

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.completeMinimalCreateFlow({
      siteName,
      hiddenCode: `HC${suffix.slice(-6)}`,
      frontendUrl: `www.as${suffix}-front.com`,
      backendUrl: `www.as${suffix}-back.com`,
      webLogoPath: fixture('logo-web.png'),
      h5LogoPath: fixture('logo-h5.png'),
    });
    await sitePage.expectCreateSuccessAndReturnToList();
    await sitePage.waitForToastToDisappear();
    await sitePage.searchSite(siteName);
    await sitePage.expectSearchShowsSite(siteName);

    await sitePage.clickEditRowBySiteName(siteName);
    await sitePage.expectEditSiteVisible();
    await sitePage.expectEditFieldEditability();
  });
});
