# To Do

Updated: 2026-03-15

## Carousel Batch 3

Scope: `Site Settings > Carousel`

- Completed in [tests/bo/smoke/carousel.spec.ts](/f:/code/101best/101best_playwright/tests/bo/smoke/carousel.spec.ts)
- Backlog cleared in [pages/bo/CarouselPage.ts](/f:/code/101best/101best_playwright/pages/bo/CarouselPage.ts)

## Promotion Batch 1

Scope: `Site Settings > Promotion`

- Completed image upload unblock: Web/H5 use `setInputFiles` on `input[type=file]` in dialog; upload triggers immediate API call; settled with `waitForAlertOrIdle`
- Promotion image fixtures: `promotion-web-valid.png` and `promotion-h5-valid.png` (1670×450px, ~3KB PNG)
- Completed test: `scheduled promotion can be created and appears in Scheduled list`
- Current implemented file: [tests/bo/smoke/promotion.spec.ts](/f:/code/101best/101best_playwright/tests/bo/smoke/promotion.spec.ts)
- Current page object: [pages/bo/PromotionPage.ts](/f:/code/101best/101best_playwright/pages/bo/PromotionPage.ts)
- Next: verify `submitAddPromotionDialogAndWaitForCreate` URL pattern matches actual API (`/api/v0/promotion`); adjust if endpoint differs
- Remaining test cases to consider: edit promotion, delete promotion, active/inactive status filter

## Notes

- Current implemented file: [tests/bo/smoke/carousel.spec.ts](/f:/code/101best/101best_playwright/tests/bo/smoke/carousel.spec.ts)
- Current page object: [pages/bo/CarouselPage.ts](/f:/code/101best/101best_playwright/pages/bo/CarouselPage.ts)
- This file is only for backlog items that are not implemented yet.
