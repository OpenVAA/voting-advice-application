---
created: 2026-08-12
source: Phase 136 plan 136-06 (D-136-06-1)
resolves_phase: null
severity: high
area: CI / packages
---

# @openvaa/data and @openvaa/filters unit tests are executed by NO CI command

## The hole

`yarn test:unit` is `turbo run test:unit`, which only runs workspaces that DECLARE a `test:unit`
script: `app-shared`, `dev-seed`, `docs`, `frontend`, `supabase`. **`@openvaa/data` and
`@openvaa/filters` do not declare one.**

So the eleven `expect.arrayContaining` → `toEqual` conversions made in Phase 136 plan 02 — proven by
negative control to catch **8 over-inclusion regressions** the old matchers missed — are real guards
that no CI command runs.

This is sweep finding **F5's exact pathology on a different surface**, discovered inside the phase
built to eliminate it.

## Why it was not fixed in-phase

Wiring the two packages in turns `yarn test:unit` **RED** on a pre-existing failure:
`formatAnswer.test.ts` hard-codes `en-US`, while `formatDateAnswer` falls back to the **ambient
machine locale** (`fi` on this machine). That is a product decision, not an executor's call.

## The decision required

- **Option A — pin the test locale.** Smallest diff. Leaves a formatter whose output depends on the
  machine it runs on.
- **Option B — make `formatDateAnswer` take an explicit locale** instead of falling back to ambient.
  **Recommended.** An ambient-locale fallback in a date formatter is a latent product bug: dates
  would render differently for users depending on server locale. Touches product code.

## After the decision

1. Add `test:unit` scripts to `packages/data` and `packages/filters` (match the shape used by the
   other packages).
2. Confirm `yarn test:unit` exits 0 and that the F12 assertions actually execute — quote the task
   lines, do not assume.
3. Consider an invariant guard: every `packages/*` workspace containing test files must declare a
   `test:unit` script, failing by name otherwise. Phase 136 plan 03 added an analogous orphan check
   for Playwright probe files; this is the same class.

## Related

- `.planning/audits/2026-08-11-fake-guard-sweep.md` — F5 (the same pathology in CI env wiring)
- Phase 136 `136-02-SUMMARY.md` — the 17→25 negative-control delta these guards rest on
- Phase 136 `136-06-SUMMARY.md` — where this was found
- D-136-02-1 — the `formatAnswer.test.ts` locale failure itself
