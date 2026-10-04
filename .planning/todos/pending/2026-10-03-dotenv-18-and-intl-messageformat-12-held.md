---
created: 2026-10-03
title: "dotenv 18 and intl-messageformat 12 are held by the 30-day new-major rule; they clear 2026-10-17T21:18Z and 2026-10-15T12:27Z"
area: root tests (dotenv), apps/frontend i18n (intl-messageformat)
severity: follow-up (no advisory on the held versions), time-boxed
source: Phase 169 plan 169-10 Task 2 step 5 and Task 3 step 2 (D-23, D-03); evidence 169-EVIDENCE.md § 1 and § 3 (169-10)
re_check_trigger: "intl-messageformat on or after 2026-10-15T12:27Z; dotenv on or after 2026-10-17T21:18Z"
files:
  - .yarnrc.yml (catalog `dotenv: ^17.3.1`, resolves 17.4.2)
  - tests/playwright.config.ts, tests/seed-test-data.ts (`import dotenv from 'dotenv'`)
  - apps/frontend/package.json (`"intl-messageformat": "^11.1.3"`, resolves 11.2.15)
  - apps/frontend/src/lib/i18n/overrides.ts (`import { IntlMessageFormat } from 'intl-messageformat'`)
---

## Problem

On 2026-10-03 both packages had a new major line younger than 30 days, so D-03 held them on the newest release of
their current major:

- `dotenv` 17.4.2. 18.0.0 was published 2026-09-17T21:18:40Z; 18.0.5 (2026-09-30) is the newest.
- `intl-messageformat` 11.2.15. 12.0.0 was published 2026-09-15T12:27Z; 12.1.2 (2026-09-19) is the newest.

GitHub lists no advisory for either held version, so this is a currency item, not a security one. PROH-169-19 applies:
do not bump either one early through a range widening or an `npmPreapprovedPackages` entry.

## Steps (once the trigger date has passed)

1. Re-measure: `node .planning/phases/169-dependency-bump-to-latest-safe-versions/169-version-probe.mjs --only dotenv,intl-messageformat --node 24.21.0`. Take the newest release that is at least 7 days old.
2. `intl-messageformat`:
   - Bump `apps/frontend/package.json` and run `yarn install`.
   - Read the 12.0 changelog and adapt `overrides.ts` if its API changed.
   - Run the frontend i18n tests (`git grep -l "overrides" -- 'apps/frontend/src/lib/i18n/**/*.test.ts'`) and `yarn workspace @openvaa/frontend check`.
   - Commit it alone.
3. `dotenv`:
   - Bump the catalog to `^18.x` and run `yarn install`.
   - Check 18's default logging. No `.env` value may be printed; keep `quiet` loading if 18 logs by default.
   - Run `yarn typecheck:tests`, then `npx playwright test --list -c tests/playwright.config.ts`. It must exit 0, and its output must contain no `.env` value.
   - Commit it alone.
4. Run the full gate set (`169-gates.sh`, or the CI equivalent if the phase has closed).
