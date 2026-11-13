---
phase: "171"
slug: "project-settings-served-entity-types-registration-mode-matri"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-05"
---

# Phase 171 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest per workspace (`@openvaa/app-shared`, `@openvaa/dev-seed`, `@openvaa/frontend`); pgTAP through `supabase test db`; Playwright through `tests/scripts/e2e-run.sh` |
| **Config file** | each workspace's own Vitest config; `apps/supabase/supabase/tests/database/`; `tests/playwright.config.ts`. Nothing is installed by this phase |
| **Quick run command** | `yarn workspace @openvaa/app-shared test:unit` (about 1 s); one frontend file: `yarn workspace @openvaa/frontend vitest run <filter>` (about 2 s) |
| **Full suite command** | `yarn test:unit`; the closing set `bash .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-gates.sh <label>`; E2E `bash .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-e2e.sh <label>` (both scripts are created by 171-04) |
| **Estimated runtime** | unit suites under 2 minutes; pgTAP estate a few minutes after `yarn db:reset`; one full E2E run about 11 minutes on this host |

Source: `171-RESEARCH.md` § *Validation Architecture*. Every gate is read by its own exit status, never through a pipe. A command expected to run longer than two minutes is started in the background and polled.

---

## Sampling Rate

- **After every task commit:** the task's own `<automated>` command (a targeted unit, pgTAP or static check; each has a stated failing direction).
- **After every plan:** the plan's one kind of gate (D-21). 171-01: `yarn test:unit`, `yarn workspace @openvaa/frontend check`, `yarn typecheck:tests`, `yarn lint:check`. 171-02: `yarn schema:regenerate`, `yarn db:reset`, `yarn db:types` with an inspected diff, `yarn workspace @openvaa/supabase test:db`, `yarn db:lint:sql`, then the frontend unit suite, check and `lint:check`. 171-03: the frontend unit suite, `yarn workspace @openvaa/frontend check`, `yarn lint:check`. 171-04: the closing set below.
- **Before `/gsd-verify-work` (D-22):** `171-gates.sh <label>` (thirteen gates, all `0`), then the default suite and the two opt-in bank-auth projects (`PLAYWRIGHT_BANK_AUTH=1`), each judged from its run directory's `summary.json`: zero failed, zero flaky, zero did-not-run. As run at the close: three wrapper runs, because the two opt-in projects need different Edge Function issuers and cannot share one run (see *Closing evidence* below).
- **Max feedback latency:** about 120 seconds for a per-task check (svelte-check is the slowest); longer gates run in the background.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 171-01-01 | 01 | 1 | SET-01, SET-02 | — | N/A (names reconciled against the tree Phase 170 left) | static | `test -s` on `171-NAME-MAP.md`, no unresolved row, the renamed settings root present | ✅ | ✅ green |
| 171-01-02 | 01 | 1 | SET-01, SET-02, NAME-03 | T-171-01 | A value outside the vocabulary fails the parse and the shipped default applies (sign-in only, candidate-only name) | unit | `yarn workspace @openvaa/app-shared test:unit` | ✅ | ✅ green |
| 171-01-03 | 01 | 1 | SET-02 | T-171-02, T-171-03 | The merge never mutates or clones its target and skips prototype keys; the app context recomputes from the base | unit | `yarn workspace @openvaa/frontend vitest run src/lib/utils/settings src/lib/contexts/app` | ✅ | ✅ green |
| 171-01-04 | 01 | 1 | SET-03 | T-171-04 | Every former reader of the removed switch asks the matrix cell through the accessor | typecheck + unit + lint | `yarn workspace @openvaa/frontend check`; `yarn test:unit`; `yarn lint:check` | ✅ | ✅ green |
| 171-02-01 | 02 | 2 | SET-01, SET-02 | T-171-05, T-171-07, T-171-08 | The function names three fixed paths, an empty `search_path` and an explicit grant; both censuses and the scoping disposition name it | static | `yarn assert:project-scoped-queries`; `yarn assert:comment-hygiene`; source greps | ✅ | ✅ green |
| 171-02-02 | 02 | 2 | SET-01, SET-02 | T-171-05, T-171-06, T-171-07, T-171-08 | pgTAP asserts the exact key set, the single all-null answer, the definer configuration and zero readable rows for `anon` | pgTAP + SQL lint | `yarn assert:schema-migration-parity`; `yarn workspace @openvaa/supabase test:db`; `yarn db:lint:sql` | ✅ | ✅ green |
| 171-02-03 | 02 | 2 | SET-01, SET-02, SET-03 | T-171-09 | The function's answer is parsed by the one schema; a bad value drops the root to defaults and is reported once with its path | unit | `yarn workspace @openvaa/frontend vitest run supabaseDataProvider.test`; `yarn assert:adapter-casts` | ✅ | ✅ green |
| 171-03-01 | 03 | 3 | NAME-03 | — | N/A (the catalogue change, the regenerated key union and the five readers land in one commit, so the typecheck is green on it) | unit + typecheck | `yarn workspace @openvaa/frontend vitest run src/lib/i18n/tests/translations.test.ts`; `yarn workspace @openvaa/frontend vitest run contestantAppName`; `yarn workspace @openvaa/frontend check` | ✅ | ✅ green |
| 171-03-02 | 03 | 3 | NAME-03 | T-171-16 | The name enters the five sentences as a message parameter at every call site; no new raw-HTML render | unit + typecheck | `yarn workspace @openvaa/frontend vitest run src/lib/i18n/tests/translations.test.ts`; `yarn workspace @openvaa/frontend check` | ✅ | ✅ green |
| 171-03-03 | 03 | 3 | SET-03 | T-171-12, T-171-13, T-171-14, T-171-15, T-171-17 | The registration-code leg is refused when `code` is off; the invitation leg is never refused and reads no setting; a failed read refuses | unit (load driven directly) + typecheck + lint | `yarn workspace @openvaa/frontend vitest run registrationCodeGuard register/layout.server`; `yarn lint:check` | ✅ | ✅ green |
| 171-04-01 | 04 | 4 | SET-01, SET-02 | T-171-18 | Every built-in template's root is parsed by the stored-settings schema and equals its declaration | unit | `yarn workspace @openvaa/dev-seed vitest run tests/templates` | ✅ `built-in-templates-contestant-app.test.ts`, `base-app-settings.test.ts` | ✅ green |
| 171-04-02 | 04 | 4 | SET-01, SET-02, NAME-03 | T-171-21 | The docs name environment variables, never a value | docs gates | `yarn workspace @openvaa/docs format:check`; `… check`; `… validate:links --check` | ✅ | ✅ green |
| 171-04-03 | 04 | 4 | SET-01, SET-03, NAME-03 | T-171-19, T-171-20, T-171-22 | Closed-project assertions run only on the terminal node; four axe scans of the login states; nothing written back | E2E (interim, default suite) | `171-e2e.sh 171-04-interim-2`; verdict from `summary.json` | ✅ six tests in `perm-closed-project.spec.ts`; `171-e2e.sh` | ✅ green |
| 171-04-04 | 04 | 4 | SET-01, SET-02, SET-03, NAME-03 | T-171-19 | The closing verdict rests on recorded exit statuses and on a run whose head equals the final tree | gates + E2E with the opt-in projects | `171-gates.sh 171-04-closing-2`; `171-e2e.sh 171-04-closing`; `171-bankauth.sh 171-04-closing` (which runs `PLAYWRIGHT_BANK_AUTH=1 171-e2e.sh 171-04-closing-bank-auth --project bank-auth --require-project bank-auth` and the same for `bank-auth-journey`) | ✅ `171-gates.sh`; `171-bankauth.sh` | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Rows of plans 01 to 03 are set from those plans' summaries (each records its gate and its closing E2E run) and from this plan's closing gate set, which ran every unit suite, pgTAP and both svelte-checks again on the final tree.

### Closing evidence (plan 04)

All on one tree, `45505e155a5e0ffb6a8d704476dcd80981041a2b`, with every exit status read from the command or from its marker file.

| What | Label and directory | Verdict |
|------|---------------------|---------|
| Gate set, first run | `171-04-closing` in `tests/e2e-runs/171-gates/` | red: 12 rows `0`, `db-types-drift` `1`. The row ran after pgTAP, whose first file commits its helper functions into `public`; the regenerated types gained 18 helper lines. The gate order was the defect, not the tree |
| **Gate set, closing run** | **`171-04-closing-2`** in `tests/e2e-runs/171-gates/` | **13 rows, all `0`**, no task cached; the drift row runs straight after the reset |
| E2E, interim | `171-04-interim` in `tests/e2e-runs/171-e2e/` | red: 177 total, 82 passed, 1 failed, 94 did not run. A new journey assertion read the heading on a landing that can carry the password-set message; moved to the freshly loaded login page |
| E2E, interim | `171-04-interim-2` | 177 of 177, 0 failed, 0 flaky, 0 did not run |
| **E2E, default suite, closing run** | **`171-04-closing`** | **177 of 177**, 0 failed, 0 flaky, 0 skipped, 0 did not run; wrapper exit 0; one preflight success, no preflight failure |
| **E2E, `bank-auth`** | **`171-04-closing-bank-auth`** | **8 of 8** (the project itself 6 of 6); Edge issuer `https://test-idp.example.com` |
| **E2E, `bank-auth-journey`** | **`171-04-closing-bank-auth-journey`** | **131 of 131** (the project itself 1 of 1); Edge issuer `https://127.0.0.1:9443` |

The default suite's total is the 171 tests of the earlier plans plus the six tests this plan adds to `perm-closed-project.spec.ts`, counted with `playwright test --list` (177 without the opt-in projects, 186 with them).

Requirement to test, at the cheapest level that proves it (D-20):

| Requirement | Unit | pgTAP | E2E |
|-------------|------|-------|-----|
| SET-01 | repeats collapse, canonical order, empty list and unknown type rejected (171-01-02); every template declares it (171-04-01) | the function returns the stored types raw (171-02-02) | the heading follows re-seeded types, a repeat included (171-04-03) |
| SET-02 | empty cell, empty row, empty matrix, repeats, unknown mode, unknown row, unserved row (171-01-02); lists replaced whole under the merge (171-01-03); root-level drop (171-02-03) | the function returns the stored matrix raw; both censuses (171-02-02) | an unserved row opens nothing (171-04-03) |
| SET-03 | the guard's decision and the load, invitation leg exempt (171-03-03) | — | sign-in only with an empty matrix; each entry on its mode; direct URLs refused; in a closed project and on the base dataset (171-04-03); the bank-auth journey (171-04-04) |
| NAME-03 | the name key for the three states (171-01-02); three keys in seven locales and the name helper (171-03-01); the name as a parameter of the five sentences (171-03-02) | — | the three headings by re-seeding alone (171-04-03) |

---

## Wave 0 Requirements

There is no separate Wave 0. Each new test file is created, test first, by the task that needs it:

- [x] `packages/app-shared/src/settings/contestantAppConfig.test.ts` (171-01-02) — SET-01, SET-02, NAME-03
- [x] new cases in `packages/app-shared/src/data/schemas/storedSettings.schema.test.ts`, including the unknown-key rejection for `registrationModes` (171-01-02)
- [x] new cases in `apps/frontend/src/lib/utils/settings.test.ts`; `settings.svelte.test.ts` for a `$state`-proxy target; `appContext.settingsRemerge.svelte.test.ts` (171-01-03)
- [x] `apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql`, or the next free number above 38 (171-02-01)
- [x] new cases in `supabaseDataProvider.test.ts` (171-02-03)
- [x] the named-key case in `apps/frontend/src/lib/i18n/tests/translations.test.ts` and `contestantAppName.test.ts` (171-03-01); the sentence-placeholder case in `translations.test.ts` (171-03-02)
- [x] `registrationCodeGuard.test.ts` and `layout.server.test.ts` beside the `register/` guard (171-03-03)
- [x] `packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts` (171-04-01)
- [x] `testIds` entries for the login entries and the code input; six new tests in `perm-closed-project.spec.ts` (171-04-03)

No framework is installed: existing infrastructure covers every requirement of the phase.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The eighteen constructed app names and thirty constructed sentences in `da`, `et`, `fi`, `fr`, `lb`, `sv` read naturally | NAME-03 | No automated check can assess grammaticality or naturalness. The strings are constructed from each catalogue's existing terms (phase 134 precedent: recorded as a deferred human-review item, not a blocker) | A native speaker of each locale reads the three names under `dynamic.contestantAppName` and the five sentences that take `{contestantAppName}` in `apps/frontend/messages/<locale>/`. Tracked in `.planning/todos/pending/2026-10-05-native-speaker-review-contestant-app-names.md` |

Every other behaviour of the phase has automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 171s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending — the sign-off items above are ticked from the phase's own evidence; `status` in the frontmatter stays `draft` until the phase is validated
