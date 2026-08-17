---
status: complete
phase: 67-default-seed-alliances
source:
  - .planning/phases/67-default-seed-alliances/67-01-SUMMARY.md
  - .planning/phases/67-default-seed-alliances/67-02-SUMMARY.md
started: 2026-05-08T08:26:25.888Z
updated: 2026-05-08T09:25:00.000Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server / Supabase. Clear ephemeral state (`yarn supabase:reset` for clean DB). Run `yarn dev` from a cold start. Supabase boots, seed runs without `validate_nomination` raise, Vite dev server comes up on port 5173, and the voter root URL responds with a live page.
result: pass
note: User confirmed pass — DB came up empty (expected, since `yarn dev` does not seed; only `yarn dev:reset-with-data` does). No other errors.

### 2. Database seed counts
expected: After `yarn dev:reset-with-data`, raw psql confirms `alliances=2`, `alliance_noms=10`, `org_noms_with_parent=30`, `org_noms_standalone=10`, `cand_noms=327` (377 nominations total).
result: pass
note: |
  User-confirmed table summary:
    alliances=2, nominations=377, candidates=327, organizations=8 (6 alliance-member + 2 standalone),
    constituencies=5, elections=1, questions=24, app_settings=1.
  The internal nominations breakdown (alliance/org-with-parent/org-standalone/candidate)
  was already verified by Plan 67-01 integration test (`alliance_noms=10`, `org_noms_with_parent=30`,
  `org_noms_standalone=10`, `cand_noms=327` — sums to 377). Aggregate totals match.

### 3. Voter results page renders 3-tab surface
expected: Walking through the voter app to results renders three entity tabs in this order: **Candidates**, **Organizations**, **Alliances**.
result: pass
note: |
  3-tab surface renders. The deferred concern that the Alliances tab body shows no content
  on click is the SC-2 PASS-WITH-CONCERNS item already captured in
  `.planning/todos/pending/2026-04-30-alliance-tab-rendering-and-sections-config.md`
  (3 remediation lanes A/B/C documented).

### 4. Candidates tab populates
expected: Selecting the Candidates tab shows candidate cards with submatch content (no empty state, no errors).
result: pass

### 5. Organizations tab shows both alliance-member and standalone parties
expected: Selecting the Organizations tab shows party cards including the standalone parties **party_people (PM)** and **party_coast (CP)** alongside the 6 alliance-member parties.
result: pass

### 6. Party cards show their top candidates
expected: Each party card includes a list of its top candidates as sub-entities (the v2.6 P64 reverse-fill driving `OrganizationNomination → CandidateNomination` rendering).
result: pass

### 7. Cross-constituency consistency
expected: Switching between constituency `c_01` and `c_05` shows the same alliance composition (Progressive Front = SDU+RF+GW; Conservative Bloc = BC+VC+RA) — no constituency-specific drift.
result: pass

### 8. Voter-app console clean
expected: With browser DevTools open during the full results flow, the console shows zero `[matching]` / `[filters]` / `DataNotFoundError` errors (the 3 cross-cutting fixes hold).
result: pass

### 9. AllianceNomination reverse-fill does not crash
expected: Loading any voter results view does not throw `Cannot read properties of undefined (reading 'length')` from `allianceNomination.ts` — the constructor accepts the `organizationNominationIds`-only path the supabase adapter produces.
result: pass
side_finding: |
  User reports `src/routes/(voters)/(located)/results/+layout.svelte` produces a Svelte 5
  runtime warning: "<slot /> or {@render ...} tag missing — inner content will not be rendered".
  Route hangs / inner content fails to render. Captured as a todo:
  `.planning/todos/pending/2026-05-08-results-layout-missing-slot-render-tag.md`.
  This is NOT an AllianceNomination regression — it is a Svelte 5 migration gap orthogonal
  to Phase 67's scope.

### 10. Playwright parity gate matches v2.6 baseline
expected: Running Playwright after `yarn supabase:reset` (NOT `yarn dev:reset-with-data`) yields **67p / 1f / 34c** — identical to the v2.6 baseline at HEAD `2c7ad2dea`.
result: pass
note: |
  First attempt (run on top of mixed default+e2e seed state from Test 2's
  `yarn dev:reset-with-data`) returned 47p / 9f / 46c — the documented mixed-seed
  contamination shape. Re-ran with the clean-DB protocol (`yarn supabase:reset`
  before Playwright per Phase 66 66-VALIDATION.md:73-82) and the parity gate
  reproduced cleanly at the recorded baseline.
  Sweep also surfaced a backlog of Svelte 5 / SSR / a11y warnings — captured at
  `.planning/todos/pending/2026-05-08-results-layout-missing-slot-render-tag.md`
  (now expanded into a Svelte 5 hardening sweep todo).

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
