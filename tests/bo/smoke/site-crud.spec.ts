import path from 'path';
import { expect, test } from './test';
import { BOSiteListPage } from '../../../pages/bo/SiteListPage';
import { buildSiteDraft } from '../helpers/data';

const fixture = (name: string) => path.resolve(process.cwd(), 'tests/fixtures/images', name);

test.describe('BO Site CRUD @serial', () => {
  test.describe.configure({ mode: 'serial' });

  test('can create site and show it at top of site list', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const site = buildSiteDraft('AS');

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.completeMinimalCreateFlow({
      siteName: site.siteName,
      hiddenCode: site.hiddenCode,
      frontendUrl: site.frontendUrl,
      backendUrl: site.backendUrl,
      webLogoPath: fixture('logo-web.png'),
      h5LogoPath: fixture('logo-h5.png'),
    });
    await sitePage.expectCreateSuccessAndReturnToList();
    await sitePage.waitForToastToDisappear();
    await sitePage.searchSite(site.siteName);
    await sitePage.expectSearchShowsSite(site.siteName);
    const texts = await sitePage.rowTextsBySiteName(site.siteName);
    const regionText = await sitePage.regionText();
    expect(texts[0]).toContain(site.siteName);
    expect(texts[1]).toContain(regionText);
    expect(texts[2]).toContain('Asia/Ho_Chi_Minh');
    expect(texts[3]).toBe('ON');
  });

  test('can edit created site and keep hidden code disabled on edit page', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const site = buildSiteDraft('AS');
    const editedName = `${site.siteName}E`;
    const editedFrontendUrl = site.frontendUrl.replace('-front.com', '-fe.com');
    const editedBackendUrl = site.backendUrl.replace('-back.com', '-be.com');

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.completeMinimalCreateFlow({
      siteName: site.siteName,
      hiddenCode: site.hiddenCode,
      frontendUrl: site.frontendUrl,
      backendUrl: site.backendUrl,
      webLogoPath: fixture('logo-web.png'),
      h5LogoPath: fixture('logo-h5.png'),
    });
    await sitePage.expectCreateSuccessAndReturnToList();
    await sitePage.waitForToastToDisappear();
    await sitePage.searchSite(site.siteName);
    await sitePage.expectSearchShowsSite(site.siteName);

    await sitePage.clickEditRowBySiteName(site.siteName);
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
    const site = buildSiteDraft('AS');

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.completeMinimalCreateFlow({
      siteName: site.siteName,
      hiddenCode: site.hiddenCode,
      frontendUrl: site.frontendUrl,
      backendUrl: site.backendUrl,
      webLogoPath: fixture('logo-web.png'),
      h5LogoPath: fixture('logo-h5.png'),
    });
    await sitePage.expectCreateSuccessAndReturnToList();
    await sitePage.waitForToastToDisappear();
    await sitePage.searchSite(site.siteName);
    await sitePage.expectSearchShowsSite(site.siteName);

    await sitePage.toggleRowBackOfficeStatus(site.siteName);
    await page.waitForTimeout(800);
    let texts = await sitePage.rowTextsBySiteName(site.siteName);
    expect(texts[0]).toContain(site.siteName);
    expect(texts[3]).toBe('OFF');
    expect(texts[4]).toBe('ON');

    await sitePage.toggleRowFrontendStatus(site.siteName);
    await page.waitForTimeout(800);
    texts = await sitePage.rowTextsBySiteName(site.siteName);
    expect(texts[0]).toContain(site.siteName);
    expect(texts[3]).toBe('OFF');
    expect(texts[4]).toBe('OFF');
  });

  test('edit site keeps primary language and hidden code disabled while other basic fields stay editable', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);
    const site = buildSiteDraft('AS');

    await sitePage.gotoAddSite();
    await sitePage.expectAddSiteVisible();
    await sitePage.completeMinimalCreateFlow({
      siteName: site.siteName,
      hiddenCode: site.hiddenCode,
      frontendUrl: site.frontendUrl,
      backendUrl: site.backendUrl,
      webLogoPath: fixture('logo-web.png'),
      h5LogoPath: fixture('logo-h5.png'),
    });
    await sitePage.expectCreateSuccessAndReturnToList();
    await sitePage.waitForToastToDisappear();
    await sitePage.searchSite(site.siteName);
    await sitePage.expectSearchShowsSite(site.siteName);

    await sitePage.clickEditRowBySiteName(site.siteName);
    await sitePage.expectEditSiteVisible();
    await sitePage.expectEditFieldEditability();
  });
});
