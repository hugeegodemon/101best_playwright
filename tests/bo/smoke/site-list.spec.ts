import { expect, test } from './test';
import { BOSiteListPage } from '../../../pages/bo/SiteListPage';
import { buildMissValue } from '../helpers/data';

test.describe('BO Site List', () => {

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

    await sitePage.fillSearchKeyword(buildMissValue('NO_SITE'));
    await sitePage.clickSearch();
    await sitePage.expectNoData();

    await sitePage.clickReset();
    await sitePage.expectSearchInputEmpty();
  });
});
