import { expect, test } from '@playwright/test';
import path from 'path';
import { BOGameProviderPage } from '../../../pages/bo/GameProviderPage';
import { ENV } from '../../../utils/env';
import { useLocaleInContext } from '../../../utils/i18n';

test.describe('BO Game Provider Management', () => {
  test.beforeEach(async ({ page }) => {
    await useLocaleInContext(page.context(), ENV.SBO_LOCALE);
    await page.goto(`${ENV.SBO_URL}/dashboard`);
  });

  test('game provider list page opens with default filters', async ({ page }) => {
    const gameProviderPage = new BOGameProviderPage(page);

    await gameProviderPage.gotoGameProviderList();
    await gameProviderPage.expectGameProviderListVisible();
    await expect(gameProviderPage.filterBox).toContainText(await gameProviderPage.copy('all_game_provider'));
    await expect(gameProviderPage.filterBox).toContainText(await gameProviderPage.copy('all_type'));
    await expect(gameProviderPage.filterBox).toContainText(await gameProviderPage.copy('all_status'));
  });

  test('game provider list shows provider rows with type and status', async ({ page }) => {
    const gameProviderPage = new BOGameProviderPage(page);

    await gameProviderPage.gotoGameProviderList();
    await gameProviderPage.expectGameProviderListVisible();

    const texts = await gameProviderPage.topRowTexts();
    expect(texts[0].length).toBeGreaterThan(0);
    expect(texts[1].length).toBeGreaterThan(0);
    expect(texts[2].length).toBeGreaterThan(0);
    expect(texts[3].length).toBeGreaterThan(0);
    expect(texts[4]).toContain(await gameProviderPage.statusText('Enable'));
  });

  test('first row exposes two action buttons', async ({ page }) => {
    const gameProviderPage = new BOGameProviderPage(page);

    await gameProviderPage.gotoGameProviderList();
    await gameProviderPage.expectGameProviderListVisible();
    await expect(gameProviderPage.page.locator('tr.el-table__row').first().locator('.bg-mainBlue.el-tooltip__trigger')).toHaveCount(2);
  });

  test('can open provider game list and return to provider list', async ({ page }) => {
    const gameProviderPage = new BOGameProviderPage(page);

    await gameProviderPage.gotoGameProviderList();
    await gameProviderPage.expectGameProviderListVisible();

    const providerTexts = await gameProviderPage.topRowTexts();
    const provider = providerTexts[0];
    const typeText = providerTexts[1];
    await gameProviderPage.openFirstRowGameList();
    await gameProviderPage.expectProviderGameListVisible(provider, typeText);
    await gameProviderPage.clickBackToProviders();
    await gameProviderPage.expectReturnedToProviderList();
  });

  test('add game dialog can open and close without saving', async ({ page }) => {
    const gameProviderPage = new BOGameProviderPage(page);

    await gameProviderPage.gotoGameProviderList();
    await gameProviderPage.expectGameProviderListVisible();
    await gameProviderPage.openFirstRowGameList();
    await gameProviderPage.clickAddGame();
    await gameProviderPage.expectAddGameDialogVisible();
    await gameProviderPage.closeAddGameDialog();
  });

  test('add game dialog validates required fields', async ({ page }) => {
    const gameProviderPage = new BOGameProviderPage(page);

    await gameProviderPage.gotoGameProviderList();
    await gameProviderPage.expectGameProviderListVisible();
    await gameProviderPage.openFirstRowGameList();
    await gameProviderPage.clickAddGame();
    await gameProviderPage.expectAddGameDialogVisible();
    await gameProviderPage.confirmAddGameDialog();
    await gameProviderPage.expectAddGameRequiredErrors();
  });

  test('game provider api dialog can open close and requires site selection', async ({ page }) => {
    const gameProviderPage = new BOGameProviderPage(page);

    await gameProviderPage.gotoGameProviderList();
    await gameProviderPage.expectGameProviderListVisible();
    const providerName = (await gameProviderPage.topRowTexts())[0];
    await gameProviderPage.openFirstRowApiDialog();
    await gameProviderPage.expectApiDialogVisible(providerName);
    await gameProviderPage.confirmApiDialog();
    await gameProviderPage.expectApiDialogRequiredError();
    await gameProviderPage.closeApiDialog();
  });

  test('game provider api dialog shows json and remark after selecting a non-branch-2 site', async ({ page }) => {
    const gameProviderPage = new BOGameProviderPage(page);

    await gameProviderPage.gotoGameProviderList();
    await gameProviderPage.expectGameProviderListVisible();
    const providerName = (await gameProviderPage.topRowTexts())[0];
    await gameProviderPage.openFirstRowApiDialog();
    await gameProviderPage.expectApiDialogVisible(providerName);
    const selectedSite = await gameProviderPage.selectFirstVisibleApiSiteExcluding('branch-2');
    expect(selectedSite).not.toBe('branch-2');
    await gameProviderPage.expectApiJsonAndRemarkVisible(selectedSite);
    await gameProviderPage.confirmApiDialog();
    await gameProviderPage.expectApiDialogRequiredError();
    await gameProviderPage.closeApiDialog();
  });

  test('jdb add game validates the visible game parameter fields', async ({ page }) => {
    const gameProviderPage = new BOGameProviderPage(page);
    const imagePath = path.resolve('tests/fixtures/images/valid-square.png');
    const uniqueName = `GPFMT${Date.now().toString().slice(-6)}`;

    await gameProviderPage.gotoGameProviderList();
    await gameProviderPage.expectGameProviderListVisible();
    await gameProviderPage.openRowGameList('JDB');
    await gameProviderPage.clickAddGame();
    await gameProviderPage.expectAddGameDialogVisible();

    const parameterLabels = await gameProviderPage.visibleGameParameterLabels();
    await gameProviderPage.expectVisibleGameParameterFields(parameterLabels);
    await gameProviderPage.fillGameName(await gameProviderPage.copy('locale_0'), uniqueName);
    await gameProviderPage.confirmAddGameDialog();
    await gameProviderPage.expectRequiredErrorsForGameParameters(parameterLabels);
    await gameProviderPage.expectUploadImageRequiredError();

    await gameProviderPage.uploadGameImage(imagePath);
    await gameProviderPage.confirmAddGameDialog();
    await gameProviderPage.expectRequiredErrorsForGameParameters(parameterLabels);
  });

  test('can create and edit a newly added jdb game', async ({ page }) => {
    const gameProviderPage = new BOGameProviderPage(page);
    const imagePath = path.resolve('tests/fixtures/images/valid-square.png');
    const baseSuffix = Date.now().toString().slice(-6);
    const gameName = `AUTOGP${baseSuffix}`;
    const editedGameName = `${gameName}E`;
    const code = `T${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    await gameProviderPage.gotoGameProviderList();
    await gameProviderPage.expectGameProviderListVisible();
    await gameProviderPage.openRowGameList('JDB');
    await gameProviderPage.clickAddGame();
    await gameProviderPage.expectAddGameDialogVisible();
    await gameProviderPage.fillGameName(await gameProviderPage.copy('locale_0'), gameName);
    await gameProviderPage.fillGameParameter('Gtype', '1');
    await gameProviderPage.fillGameParameter('Mtype', '2');
    await gameProviderPage.fillGameParameter('Code', code);
    await gameProviderPage.uploadGameImage(imagePath);
    await gameProviderPage.confirmAddGameDialog();
    await gameProviderPage.expectToastSuccess();
    expect(await gameProviderPage.openPageContainingGame(gameName)).toBeTruthy();
    await gameProviderPage.expectGameRowVisible(gameName);

    await gameProviderPage.openGameEditByName(gameName);
    await gameProviderPage.expectEditGameDialogVisible();
    await gameProviderPage.fillGameName(await gameProviderPage.copy('locale_0'), editedGameName);
    await gameProviderPage.fillGameParameter('Gtype', '11');
    await gameProviderPage.fillGameParameter('Mtype', '22');
    await gameProviderPage.confirmAddGameDialog();
    await gameProviderPage.expectToastSuccess();
    expect(await gameProviderPage.openPageContainingGame(editedGameName)).toBeTruthy();
    await gameProviderPage.expectGameRowVisible(editedGameName);

    await gameProviderPage.openGameEditByName(editedGameName);
    await gameProviderPage.expectEditGameDialogVisible();
    await expect(await gameProviderPage.inputValueByLabel(await gameProviderPage.copy('locale_0'))).toBe(editedGameName);
    await expect(await gameProviderPage.inputValueByLabel('Gtype')).toBe('11');
    await expect(await gameProviderPage.inputValueByLabel('Mtype')).toBe('22');
    await expect(await gameProviderPage.inputValueByLabel('Code')).toBe(code);
    await gameProviderPage.closeAddGameDialog();
  });
});
