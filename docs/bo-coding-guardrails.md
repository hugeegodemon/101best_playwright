# BO Test Coding Guardrails

This file defines the minimum bar for adding or changing BO Playwright test code in this repository.

## Scope

These guardrails apply to:

- `tests/bo/**`
- `pages/bo/**`
- `tests/bo/helpers/**`

## Core Rule

New test code must improve or preserve stability. Do not add code that only works because of timing luck.

## Mandatory Rules

### 1. Put actions in page objects

Do not keep UI action flows directly in specs if they are likely to be reused.

Examples:

- open page
- click search/reset/save
- open dialog
- submit form
- upload file
- change status

If a spec needs the same UI action more than once, move it into `pages/bo/`.

### 2. Do not add raw sleeps in specs

Do not add new `page.waitForTimeout(...)` in spec files unless there is no observable UI signal and the reason is documented in a short comment.

Preferred alternatives:

- `expect(locator).toBeVisible()`
- `expect(page).toHaveURL(...)`
- `expect.poll(...)`
- `locator.waitFor(...)`
- page object helper methods from [CommonPage.ts](/c:/Users/IE_Jason/playwright-bo/pages/bo/CommonPage.ts)

If a wait is needed after a reusable action, add it inside the page object, not inside the spec.

### 3. Wait for state changes after actions

Every common action should include a post-action wait when the UI is asynchronous.

Examples:

- after menu navigation: wait for page settle
- after search/reset: wait for list settle
- after save/submit: wait for network settle or success alert
- after opening a select: wait for visible options
- after upload: wait for alert or idle
- after opening/closing a dialog: wait for dialog visible/hidden

### 4. Use i18n instead of hard-coded UI copy

Do not hard-code display text when the system already exposes an i18n key.

Use:

- `BOI18n`
- page object text helpers
- existing i18n-based status helpers

This is especially required for:

- button text
- status text
- success/error message text
- dialog titles
- empty-state text

### 5. Use shared test data helpers

Do not create new ad hoc `Date.now()` / `Math.random()` generators in specs.

Use helpers in:

- [data.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/helpers/data.ts)

If a new entity type needs unique test data, add a builder/helper there first.

### 6. Keep auth/session boundaries explicit

If a test logs out, re-logs in, resets password, or otherwise invalidates shared session state, it must not run in the shared smoke/auth batch by default.

Use:

- `@isolated-session` for session-destructive cases
- `@serial` for environment-destructive or order-sensitive cases

Do not add a new Playwright project just to control execution order.

### 7. Specs should read like business flow, not driver scripts

A good spec should mostly express:

1. go to page
2. perform business action
3. verify business result

If a spec is full of low-level click/fill/wait details, move those details into page objects or helpers.

### 8. Prefer observable assertions over structure-only assertions

Prefer:

- row appears in list
- field becomes disabled
- success alert appears
- keyword is cleared
- no-data state is visible

Avoid relying only on:

- arbitrary DOM position
- generic container text
- unstable CSS structure

### 9. When reset behavior differs from assumption, test real behavior

If reset returns a full list, do not assert that it stays in `no data`.

Reset assertions should usually verify:

- filter value is cleared
- dropdown is reset
- list returns to default state

### 10. New unstable behavior must be fixed at the abstraction layer

If a flaky step is discovered:

- first fix the page object or helper
- only then update the spec

Do not patch the same timing issue independently in multiple specs.

## Preferred Waiting Pattern

Use this order of preference:

1. explicit UI state (`toBeVisible`, `toBeHidden`, `toHaveURL`)
2. list/data polling (`expect.poll`)
3. shared wait helper from `pages/bo/CommonPage.ts`
4. short fallback timeout inside page object only

## Tagging Rules

Use `@serial` when:

- tests mutate shared environment data
- the target resource cannot safely be created/edited in parallel
- order matters for correctness

Use `@isolated-session` when:

- tests sign out
- tests log in with another account
- tests reset password and then re-login
- tests invalidate the shared storage state

## Review Checklist

Before merging a new BO test case, verify:

- no new raw sleep was added to spec unless strictly necessary
- reusable actions live in page objects
- text assertions use i18n when possible
- generated data comes from shared helpers
- session-sensitive tests are tagged correctly
- the case passes when run alone
- if the case belongs to smoke, it does not obviously break parallel shared-state execution

## Current Smells To Avoid Expanding

These still exist in the repo and should not spread:

- leftover `waitForTimeout(3200)` in some older specs
- repeated success-alert stabilization in specs instead of page objects
- tests that assume reset returns `no data`
- direct single-file runs that depend on unstable global setup behavior

## Rule For New Work

It is acceptable to add new feature coverage now, but every new test must follow this file.

If new coverage requires breaking one of these rules, fix the underlying abstraction first.
