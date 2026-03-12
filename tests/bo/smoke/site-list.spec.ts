import { expect, test } from '@playwright/test';
import { BOSiteListPage } from '../../../pages/bo/SiteListPage';
import { ENV } from '../../../utils/env';
import { useLocaleInContext } from '../../../utils/i18n';

test.describe('BO Site List', () => {
  test.beforeEach(async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);
    await page.goto(`${ENV.SBO_URL}/dashboard`);
  });

  test('site list page opens and can search existing site then reset filters', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);

    await sitePage.gotoSiteList();
    await sitePage.expectSiteListVisible();

    const existingSite = await sitePage.topSiteName();

    await sitePage.searchSite(existingSite);
    await sitePage.expectSearchShowsSite(existingSite);

    await sitePage.clickReset();
    await sitePage.expectSearchInputEmpty();
  });

  test('site list can show no data for unmatched filters and reset back to list', async ({ page }) => {
    const sitePage = new BOSiteListPage(page);

    await sitePage.gotoSiteList();
    await sitePage.expectSiteListVisible();

    await sitePage.fillSearchKeyword(`NO_SITE_${Date.now()}`);
    await sitePage.clickSearch();
    await sitePage.expectNoData();

    await sitePage.clickReset();
    await sitePage.expectSearchInputEmpty();
  });
});
