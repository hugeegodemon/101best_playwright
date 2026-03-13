# To Do

Updated: 2026-03-13

## Carousel Batch 3

Scope: `Site Settings > Carousel`

- `reorder mode can drag and save`
  - cover entering reorder mode, drag sorting, confirm save, and success feedback
- `publish list can switch display status with correct confirmation flow`
  - cover display on/off toggle behavior and list refresh
- `schedule or publish item can run unpublish confirmation flow`
  - cover confirmation dialog content, confirm action, and list state change
- `delete flow with second confirmation is handled`
  - cover the full delete confirmation chain if the product requires a second confirmation step
- `display limit reached shows correct warning`
  - cover the max displayed-carousel constraint and warning message
- `concurrent update or delete warning is handled`
  - cover cases where another user already updated or deleted the same carousel item

## Notes

- Current implemented file: [tests/bo/smoke/carousel.spec.ts](/c:/Users/IE_Jason/playwright-bo/tests/bo/smoke/carousel.spec.ts)
- Current page object: [pages/bo/CarouselPage.ts](/c:/Users/IE_Jason/playwright-bo/pages/bo/CarouselPage.ts)
- This file is only for backlog items that are not implemented yet.
