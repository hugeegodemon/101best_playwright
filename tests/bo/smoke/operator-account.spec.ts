import { test, expect } from './test';
import { BOOperatorPage } from '../../../pages/bo/OperatorPage';
import { BOI18n } from '../../../utils/i18n';
import { buildOperatorData, uniqueSeed } from '../helpers/data';

test.describe('BO Operator Account', () => {
  test('operator list page opens', async ({ page }) => {

    const operatorPage = new BOOperatorPage(page);
    await operatorPage.gotoOperatorList();
    await operatorPage.expectOperatorListVisible();
  });

  test('add operator page shows required fields and role is disabled before site selection', async ({ page }) => {

    const operatorPage = new BOOperatorPage(page);
    await operatorPage.gotoAddOperator();
    await operatorPage.expectAddOperatorVisible();
    await operatorPage.expectRoleDisabledBeforeSiteSelected();
  });

  test('selecting site enables role dropdown', async ({ page }) => {

    const operatorPage = new BOOperatorPage(page);
    await operatorPage.gotoAddOperator();
    await operatorPage.selectAddSiteByIndex(0);
    await operatorPage.expectRoleEnabledAfterSiteSelected();
  });

  test('create operator requires all mandatory fields', async ({ page }) => {

    const operatorPage = new BOOperatorPage(page);
    await operatorPage.gotoAddOperator();
    await operatorPage.save();
    await operatorPage.expectRequiredValidationErrors(8);
  });

  test('create operator shows status options enable disable and freeze', async ({ page }) => {

    const operatorPage = new BOOperatorPage(page);
    await operatorPage.gotoAddOperator();
    await operatorPage.openAddStatusOptions();
    await operatorPage.expectStatusOptionsVisible();
  });

  test('create operator validates account format', async ({ page }) => {
    const operatorPage = new BOOperatorPage(page);
    const operator = buildOperatorData();
    await operatorPage.gotoAddOperator();
    await operatorPage.fillAddOperatorForm({
      account: 'a123',
      name: operator.name,
      email: operator.email,
      password: operator.password,
      confirmPassword: operator.password,
    });
    await operatorPage.save();

    await operatorPage.expectFieldErrorContains('account', [/5.*20.*alphanumeric/i, /5.*20/i]);
  });

  test('create operator validates name format', async ({ page }) => {
    const operatorPage = new BOOperatorPage(page);
    const i18n = new BOI18n(page);
    const operator = buildOperatorData();
    await operatorPage.gotoAddOperator();
    await operatorPage.fillAddOperatorForm({
      account: operator.account,
      name: ' Operator1',
      email: `operator-name-${uniqueSeed()}@test.com`,
      password: operator.password,
      confirmPassword: operator.password,
    });
    await operatorPage.save();

    await operatorPage.expectFieldErrorContains('name', [
      await i18n.t('no_spaces_allowed'),
      /2.*20/i,
      /space/i,
    ]);
  });

  test('create operator validates email format', async ({ page }) => {
    const operatorPage = new BOOperatorPage(page);
    const i18n = new BOI18n(page);
    const operator = buildOperatorData();
    await operatorPage.gotoAddOperator();
    await operatorPage.fillAddOperatorForm({
      account: operator.account,
      name: operator.name,
      email: 'invalid-email',
      password: operator.password,
      confirmPassword: operator.password,
    });
    await operatorPage.save();

    await operatorPage.expectFieldErrorContains('e_mail', [
      await i18n.t('email_validate'),
      await i18n.error('000090_23'),
      /email/i,
    ]);
  });

  test('create operator requires matching confirm password', async ({ page }) => {
    const operatorPage = new BOOperatorPage(page);
    const i18n = new BOI18n(page);
    const operator = buildOperatorData();
    await operatorPage.gotoAddOperator();
    await operatorPage.fillAddOperatorForm({
      account: operator.account,
      name: operator.name,
      email: `operator-confirm-${uniqueSeed()}@test.com`,
      password: operator.password,
      confirmPassword: 'Test54321',
    });
    await operatorPage.save();

    await operatorPage.expectFieldErrorContains('confirm_password', [
      await i18n.t('need_same_password'),
      await i18n.t('must_match_password'),
      /match/i,
    ]);
  });

  test('create operator still requires role after site is selected', async ({ page }) => {
    const operatorPage = new BOOperatorPage(page);
    const operator = buildOperatorData();
    await operatorPage.gotoAddOperator();
    await operatorPage.selectAddSiteByIndex(0);
    await operatorPage.fillAddOperatorForm({
      account: operator.account,
      name: operator.name,
      email: `operator-role-${uniqueSeed()}@test.com`,
      password: operator.password,
      confirmPassword: operator.password,
    });
    await operatorPage.selectAddStatus('Enable');
    await operatorPage.save();

    await operatorPage.expectFieldErrorContains('role', [
      await new BOI18n(page).t('required_field'),
      /required/i,
    ]);
  });

  test('operator list search validates account minimum length', async ({ page }) => {

    const operatorPage = new BOOperatorPage(page);
    const i18n = new BOI18n(page);
    await operatorPage.gotoOperatorList();
    await operatorPage.searchByAccount('ab');

    await operatorPage.expectSearchValidationError([
      await i18n.t('search_account_validate'),
      await i18n.t('search_length_validate'),
      /least\s*3|at\s*least\s*3|至少\s*3|三碼以上|三字以上/i,
    ]);
  });

  test('operator list search can reset back to full list state', async ({ page }) => {

    const operatorPage = new BOOperatorPage(page);
    await operatorPage.gotoOperatorList();
    await operatorPage.searchByAccount('no-such-operator');
    await operatorPage.expectNoData();
    await operatorPage.clickReset();
    await operatorPage.clickSearch();
    await operatorPage.expectKeywordCleared();
    await operatorPage.expectListHasRows();
  });
});
