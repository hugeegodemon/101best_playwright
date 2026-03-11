# BO Test Cases

Updated: 2026-03-11

## Test Projects

- `bo-no-auth`
  - `tests/bo/auth/*.spec.ts`
  - 用於從登入頁開始的完整流程
- `bo-authenticated`
  - `tests/bo/smoke/*.spec.ts`
  - 用於已登入狀態下的 smoke / CRUD / 驗證流程
- `bo-setup`
  - `tests/bo/auth.setup.ts`
  - 建立 `bo-authenticated` 需要的登入狀態
- `bo-logout`
  - `tests/bo/auth/logout.spec.ts`

## Auth

### Login / Logout

File: [tests/bo/auth/login.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/auth/login.spec.ts)

- `user can login`

File: [tests/bo/auth/logout.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/auth/logout.spec.ts)

- `user can logout`

### Login Status / Password Login

File: [tests/bo/auth/admin-login-status.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/auth/admin-login-status.spec.ts)

- `enabled admin can login, updates last login info, and cannot login after being disabled`

File: [tests/bo/auth/reset-password-login.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/auth/reset-password-login.spec.ts)

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

## Summary

- Auth: 5 cases
- Dashboard / Navbar / Header: 11 cases
- Admin: 18 cases
- Operator: 19 cases
- Total: 53 cases
