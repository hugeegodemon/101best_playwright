# BO Test Cases

Updated: 2026-03-13

## Execution Model

- `tests/bo/global.setup.ts`
  - prepares smoke authenticated storage state once before the run
  - uses `SBO_SMOKE_ACCOUNT` / `SBO_SMOKE_PASSWORD`, or falls back to `SBO_ACCOUNT` / `SBO_PASSWORD`
- `tests/bo/auth/*.spec.ts`
  - login / logout / password reset login flows
  - uses `tests/bo/auth/test.ts` for shared locale setup without authenticated storage state
  - skips `global.setup.ts`
  - `@isolated-session` auth specs run in a separate CI step after smoke
- `tests/bo/smoke/*.spec.ts`
  - dashboard / navigation / CRUD / validation flows
  - uses `tests/bo/smoke/test.ts` for shared locale setup, authenticated storage state, and dashboard landing page
  - `@isolated-session` smoke specs run in a separate CI step after shared smoke and serial smoke
- `@serial` smoke specs
  - run in a separate CI step with `--grep "@serial" --workers=1`
  - current files: `site-crud.spec.ts`, `system-bank-list.spec.ts`, `system-bank-crud.spec.ts`, `system-bank-validation.spec.ts`, `system-bank-edit-validation.spec.ts`
- `@isolated-session` auth specs
  - run in a separate CI step with `--grep "@isolated-session" --workers=1`
  - current files: `reset-password-login.spec.ts`
- `@isolated-session` smoke specs
  - run in a separate CI step with `--grep "@isolated-session" --workers=1`
  - current files: `header.spec.ts` (`sign out action returns user to login page`)

## Auth

### Login / Logout

File: [tests/bo/auth/login.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/auth/login.spec.ts)

- `user can login`

File: [tests/bo/auth/logout.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/auth/logout.spec.ts)

- `user can logout`

### Login Status / Password Login

File: [tests/bo/auth/admin-login-status.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/auth/admin-login-status.spec.ts)

- `enabled admin can login, updates last login info, and cannot login after being disabled`

File: [tests/bo/auth/reset-password-login.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/auth/reset-password-login.spec.ts) `@isolated-session`

- `admin can login with new password after reset`
- `operator can login with new password after reset`

## Smoke

### Dashboard

File: [tests/bo/smoke/dashboard.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/dashboard.spec.ts)

- `dashboard page opens`

### Navbar / Header

File: [tests/bo/smoke/navbar.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/navbar.spec.ts)

- `main menus are visible`
- `can expand and collapse Operator menu`
- `can navigate to Admin List`
- `can expand Finance > Deposit and see Deposit Review`
- `can navigate to Finance > Deposit > Deposit Review`

File: [tests/bo/smoke/header.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/header.spec.ts)

- `can collapse and expand navbar`
- `language selector shows current language and opens options menu`
- `account avatar opens popper with account actions`
- `password action opens reset password dialog`
- `sign out action returns user to login page`

## Admin

### Admin CRUD

File: [tests/bo/smoke/admin-crud.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/admin-crud.spec.ts)

- `can create edit and search admin account`

### Admin Account Validation / Reset Password

File: [tests/bo/smoke/admin-account.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/admin-account.spec.ts)

- `create admin requires all mandatory fields`
- `cannot create duplicate admin account`
- `cannot create admin account with existing operator account`
- `create admin requires matching confirm password`
- `create admin validates account format`
- `create admin validates name format`
- `create admin validates email format`
- `admin list can search by account and reset filters`
- `edit admin keeps account disabled and shows reset password action`
- `edit admin requires name and email`
- `edit admin validates email format`
- `reset password dialog can cancel without saving`
- `reset password requires both password fields`
- `reset password requires matching confirm password`
- `reset password validates password format`
- `reset password cannot reuse old password`
- `reset password success shows success message`

## Operator

### Operator Account Validation

File: [tests/bo/smoke/operator-account.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/operator-account.spec.ts)

- `operator list page opens`
- `add operator page shows required fields and role is disabled before site selection`
- `selecting site enables role dropdown`
- `create operator requires all mandatory fields`
- `create operator shows status options enable disable and freeze`
- `create operator validates account format`
- `create operator validates name format`
- `create operator validates email format`
- `create operator requires matching confirm password`
- `create operator still requires role after site is selected`
- `operator list search validates account minimum length`
- `operator list search can reset back to no data state`

### Operator CRUD / Reset Password

File: [tests/bo/smoke/operator-crud.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/operator-crud.spec.ts)

- `can create edit and search operator account`
- `reset password validates and updates created operator account`

### Operator Role

File: [tests/bo/smoke/operator-role.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/operator-role.spec.ts)

- `role permission list page opens`
- `add role dialog can open and cancel`
- `add role requires role status and site`
- `add role validates role name format`
- `can create open edit dialog and change operator role status`

## Site

### Site Image Validation

File: [tests/bo/smoke/site-image.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/site-image.spec.ts)

- `layout 1 site logo enforces required dimensions`
- `layout 2 site logo enforces required dimensions`
- `site logo enforces png webp format and 80KB size limit`
- `site logo accepts valid png assets and allows next step`
- `frontend favicon accepts webp format`
- `backend favicon accepts svg format`

### Site Form Validation

File: [tests/bo/smoke/site-validation.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/site-validation.spec.ts)

- `add site requires mandatory basic fields before next step`
- `other regions cannot include selected primary region`
- `other languages cannot include selected primary language`
- `add site validates hidden code and url formats before next step`
- `game settings can open and go back without losing basic information`
- `game settings allows changing provider switch before successful create`

### Site List / CRUD

File: [tests/bo/smoke/site-list.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/site-list.spec.ts)

- `site list page opens and can search existing site then reset filters`
- `site list can show no data for unmatched filters and reset back to list`

File: [tests/bo/smoke/site-crud.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/site-crud.spec.ts) `@serial`

- `can create site and show it at top of site list`
- `can edit created site and keep hidden code disabled on edit page`
- `can toggle created site back-office and frontend status from list`
- `edit site keeps primary language and hidden code disabled while other basic fields stay editable`

### Site Carousel

File: [tests/bo/smoke/carousel.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/carousel.spec.ts)

- `carousel list page opens with site selector and default list`
- `add carousel dialog can open and cancel`
- `site selector is required on add carousel dialog`
- `hyperlink type shows url input and target options`
- `hyperlink type validates https url format`
- `specific game type requires game selection`
- `upload image validates jpg webp format and size limit`
- `permanent time option disables end time`
- `hyperlink carousel can be scheduled and appears in schedule list`
- `published hyperlink carousel shows publish success and appears in list`
- `published carousel can be deleted from list`
- `specific game carousel can be scheduled and appears in schedule list`
- `scheduled hyperlink carousel can open edit dialog and submit successfully`

## Game Provider

### Game Provider Management

File: [tests/bo/smoke/game-provider.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/game-provider.spec.ts)

- `game provider list page opens with default filters`
- `game provider list shows provider rows with type and status`
- `first row exposes two action buttons`
- `can open provider game list and return to provider list`
- `add game dialog can open and close without saving`
- `add game dialog validates required fields`
- `game provider api dialog can open close and requires site selection`
- `game provider api dialog shows json and remark after selecting a non-branch-2 site`
- `jdb add game validates the visible game parameter fields`
- `can create and edit a newly added jdb game`

## System Bank

### System Bank List

File: [tests/bo/smoke/system-bank-list.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/system-bank-list.spec.ts) `@serial`

- `system bank list page opens with region and bank filters`
- `system bank list shows bank rows with edit action`
- `system bank list search filters by bank code and reset clears fields`
- `system bank list add button opens add page`
- `system bank list can search by bank name`
- `system bank list can filter rows by region`
- `system bank list can show no data for unmatched filters`
- `system bank list can combine region and bank code filters`
- `can open first system bank edit page`

### System Bank CRUD

File: [tests/bo/smoke/system-bank-crud.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/system-bank-crud.spec.ts) `@serial`

- `can create edit and search system bank`

### System Bank Validation

File: [tests/bo/smoke/system-bank-validation.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/system-bank-validation.spec.ts) `@serial`

- `add system bank requires all mandatory fields`
- `add system bank can cancel without saving`
- `cannot create duplicate system bank code`

### System Bank Edit Validation

File: [tests/bo/smoke/system-bank-edit-validation.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/system-bank-edit-validation.spec.ts) `@serial`

- `edit system bank requires bank code and bank name`
- `edit system bank cannot use duplicate code in the same region`
- `edit system bank can cancel without saving changes`

## Summary

- Auth: 5 cases
- Dashboard / Navbar / Header: 11 cases
- Admin: 18 cases
- Operator: 18 cases
- Site: 31 cases
- Game Provider: 10 cases
- System Bank: 16 cases
- Total: 109 cases
