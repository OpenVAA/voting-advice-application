---
phase: "170"
slug: "contestant-app-rename-symbols-routes"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-05"
---

# Phase 170 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^5.0.2 (frontend, packages, Edge Function source-text tests); Playwright 1.63.0 (E2E, a11y scan, visual regression — run only through `tests/scripts/e2e-run.sh` and `tests/scripts/visual-container.sh`); pgTAP via `supabase test db`; static gates: `yarn lint:check` (ESLint, two type checks, the `assert:*` scripts — plus `assert:no-candidate-app-names` from plan 170-04), svelte-check, Prettier |
| **Config file** | `apps/frontend/vitest.config.ts`, one `vitest.config.ts` per package, `apps/supabase/vitest.config.ts`, `tests/playwright.config.ts`, `apps/supabase/supabase/tests/database/*.test.sql` |
| **Quick run command** | The task's own `<automated>` command. For route work: `yarn workspace @openvaa/frontend test:unit src/lib/routes/` (about 2 s). After any codemod apply: `node .planning/phases/170-contestant-app-rename-symbols-routes/rename.mjs --check --plan N` (must exit 0) |
| **Full suite command** | `bash .planning/phases/170-contestant-app-rename-symbols-routes/170-gates.sh <label> --plan N [--db]` (every row read by its own exit status, `TURBO_FORCE=true`), then `bash .planning/phases/170-contestant-app-rename-symbols-routes/170-e2e.sh <label>` (one preflight-confirmed run with `--no-db-reset`); verdicts by `node .planning/phases/170-contestant-app-rename-symbols-routes/170-verdict.mjs gates|e2e|visual|baselines|exemptions …` |
| **Estimated runtime** | per-task commands under 2 min; gate set about 4 min; one full E2E run about 5 min; one bank-auth journey run about 5 min; the in-container visual run about 2 min after its host recipe |

**Environment.** A non-interactive shell's default `node` on the development host is below the `engines` floor, so every command block starts with `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`. `git grep -E` there does not understand `\b`; use `-P`. No single foreground command runs longer than about eight minutes (the executor's watchdog kills at ten): the gate set, every E2E run, the bank-auth driver, the visual run, a database reset and the docs generator are started in the background as `( <command>; echo $? > <marker> ) > <log> 2>&1`, polled every 30 to 60 seconds with one short command, and judged only once the marker file exists; each has a ceiling stated in its plan, after which the executor stops and reports.

---

## Sampling Rate

- **After every task commit:** the task's `<automated>` commands, each followed by its `<fails_when>`. A pure-move commit is exempt from "builds" and is checked by the exact-rename check instead (every row `R100`, 0 insertions, 0 deletions).
- **After every plan (= one wave):** the gate set for that plan, the search gate in report mode for the plan's pattern groups (the `residue` row), and one full E2E run whose total, passed and skipped counts must equal the baseline run's. Plan 170-02 adds the stack restart, the redirect-matcher probe before and after it, and one run of each bank-auth project. Plan 170-03 adds the in-container visual run.
- **Before `/gsd-verify-work`:** plan 170-04 Task 5 — the gate set with pgTAP and the SQL lint, the catalogue identity check, the baseline blob check, the redirect-matcher probe, one full E2E run and three consecutive runs of each bank-auth project, all on one tree.
- **Max feedback latency:** a per-task command answers within about two minutes; no three consecutive tasks lack an automated check.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 170-01-01 | 01 | 1 | NAME-01 | T-170-03, T-170-05, T-170-SC | The codemod reads only tracked files, never `.env`; the gate reports every app-level form and no entity-typed form, and its exemption list is exactly two entries | syntax + self-test + dry run | `node --check` on the four Node scripts, `bash -n` on the two drivers, `node scripts/assert-no-candidate-app-names.mjs --self-test`, `rename.mjs --plan 4` (dry run) | ❌ W0 (codemod, map, gate, fixtures, identity script, drivers and verdict tool are created here) | ⬜ pending |
| 170-01-02 | 01 | 1 | NAME-01 | T-170-05 | Evidence is tied to a committed tree; a red or flaky baseline stops the phase | baseline gates + E2E | `170-verdict.mjs gates 170-01-baseline`; `170-verdict.mjs e2e 170-01-baseline --expect-project candidate-journey --expect-project candidate-a11y-scan --expect-project cold-entry-dataroot-candidate` | ✅ | ⬜ pending |
| 170-01-03 | 01 | 1 | NAME-01 | T-170-01, T-170-03, T-170-04 | The app gate keeps its segment-exact predicate under its new name and its gate row reads `Contestant App`; no message value changes; no entity-typed name is touched | idempotency + generated-type freshness + svelte-check + identity + unit | `rename.mjs --check --plan 1`; `generate:translation-key-type` then `git diff --quiet` on the generated type; `yarn workspace @openvaa/frontend check`; `catalogue-identity.mjs --base …`; `node scripts/assert-i18n-catalog-namespaces.mjs`; `yarn workspace @openvaa/frontend test:unit src/lib/routes/` | ✅ | ⬜ pending |
| 170-01-04 | 01 | 1 | NAME-01 | T-170-02 | A stale stored key is read as absent — accepted, stated in the summary | gates + E2E + count equality | `170-verdict.mjs gates 170-01-close`; `170-verdict.mjs e2e 170-01-close --same-total-as 170-01-baseline`; `170-verdict.mjs exemptions` | ✅ | ⬜ pending |
| 170-02-01 | 02 | 2 | NAME-02 | T-170-08, T-170-10 | Sign-out clears this device's session only and answers a `DataApiActionResult`; no global-scope sign-out endpoint remains; the commit renames no identifier | unit (test first, red before the merge) + lint | `yarn workspace @openvaa/frontend test:unit src/routes/api/auth/logout/ src/lib/api/adapters/supabase/dataWriter/ src/lib/routes/ src/lib/_guards/eslint-adapter-boundary-guard.test.ts`; `yarn workspace @openvaa/frontend lint` | ❌ W0 (`apps/frontend/src/routes/api/auth/logout/server.test.ts` is created here) | ⬜ pending |
| 170-02-02 | 02 | 2 | NAME-02 | T-170-06, T-170-09, T-170-10, T-170-11 | The allowlist loses a path segment and gains no wildcard; the gate claims `/contestant` and no sibling; the adapter-boundary allowlist follows the moves | idempotency + filesystem + guards + unit + svelte-check | `rename.mjs --check --plan 2`; `test ! -e` on both old route directories; `node scripts/assert-no-session-in-loads.mjs`; route, guard, admin-layout and API route unit tests; `yarn workspace @openvaa/frontend check`; `yarn workspace @openvaa/supabase test:unit`; `yarn typecheck:tests` | ✅ | ⬜ pending |
| 170-02-03 | 02 | 2 | NAME-02 | T-170-06, T-170-07, T-170-13 | The running auth service admits the neutral callback URLs and rejects the `candidate` ones, a two-segment prefix, a suffix, a foreign path and a foreign host | live probe + gates + E2E | `bash 170-allowlist-probe.sh after`; `170-verdict.mjs gates 170-02-close`; `170-verdict.mjs e2e 170-02-close --same-total-as 170-01-baseline --expect-project candidate-journey --expect-project admin-access` | ❌ W0 (`170-allowlist-probe.sh` is created here) | ⬜ pending |
| 170-02-04 | 02 | 2 | NAME-02 | T-170-12, T-170-14 | Test keys and the TLS bypass never leave a scratch directory outside the repository | E2E, opt-in | `170-verdict.mjs e2e 170-02-bankauth-1 --expect-project bank-auth`; `170-verdict.mjs e2e 170-02-bankauth-journey-1 --expect-project bank-auth-journey`; `bash 170-allowlist-probe.sh after` | ❌ W0 (`170-bankauth.sh` is created here) | ⬜ pending |
| 170-03-01 | 03 | 3 | NAME-01 | T-170-15, T-170-16, T-170-17 | The a11y scan stays wired under its new names; no spec drops out of collection; no baseline is rewritten | idempotency + wiring gate + type check + blob ids + enumeration | `rename.mjs --check --plan 3`; `node scripts/assert-a11y-scan-wiring.mjs`; `yarn typecheck:tests`; `170-verdict.mjs baselines`; `yarn playwright test -c ./tests/playwright.config.ts --list --project contestant-journey --project contestant-a11y-scan --project cold-entry-dataroot-contestant`; `yarn eslint tests` | ✅ | ⬜ pending |
| 170-03-02 | 03 | 3 | NAME-01 | T-170-16, T-170-17 | Each renamed project runs as many tests as it did under its old name | gates + E2E | `170-verdict.mjs gates 170-03-close`; `170-verdict.mjs e2e 170-03-close --same-total-as 170-01-baseline` with five `--renamed-project` pairs; `170-verdict.mjs baselines` | ✅ | ⬜ pending |
| 170-03-03 | 03 | 3 | NAME-01 | T-170-15 | The visual run compares against the moved baselines and writes nothing | visual, opt-in, in-container | `170-verdict.mjs visual 170-03-visual`; `170-verdict.mjs baselines` | ✅ | ⬜ pending |
| 170-04-01 | 04 | 4 | NAME-01 | T-170-18 | No substitution reaches executable SQL; the migration mirrors the schema byte for byte | parity + types + SQL lint + pgTAP | `node scripts/assert-schema-migration-parity.mjs`; `git diff --quiet HEAD -- packages/supabase-types …`; `yarn db:lint:sql`; `yarn workspace @openvaa/supabase test:db` | ✅ | ⬜ pending |
| 170-04-02 | 04 | 4 | NAME-01, NAME-02 | T-170-20, T-170-21 | The deployment page names the exact callback URL; no catalogue value, publishers'-guide sentence or quoted research span changes | filesystem + link check + skill-link audit + identity + research-quote check | `test ! -e` on the old docs section and `test -f` on a moved page; `yarn workspace @openvaa/docs validate:links --check`; `bash .claude/scripts/audit-skill-links.sh components`; `catalogue-identity.mjs --base …`; `yarn workspace @openvaa/docs check:research-quotes --base …` | ✅ | ⬜ pending |
| 170-04-03 | 04 | 4 | NAME-01 | T-170-19 | The gate has exactly two exemptions, lost no pattern, and fails on a planted name, also inside the exempt function's directory | static gate + self-test + wiring check + idempotency + recorded negative control | `node scripts/assert-no-candidate-app-names.mjs` and `--self-test`; the `package.json` wiring check; `rename.mjs --check --plan 4` | ✅ | ⬜ pending |
| 170-04-04 | 04 | 4 | NAME-02 | T-170-22 | Test keys and the TLS bypass never leave a scratch directory outside the repository | E2E, opt-in, 3× per project (driver invoked, not rebuilt) | six `170-verdict.mjs e2e 170-04-bankauth[-journey]-<n> --expect-project …` checks; `bash 170-allowlist-probe.sh after` | ✅ | ⬜ pending |
| 170-04-05 | 04 | 4 | NAME-01, NAME-02 | T-170-19 | The closing evidence describes one tree; a did-not-run test is a failure | gates (with pgTAP and SQL lint) + identity + probe + E2E | `170-verdict.mjs gates 170-04-close`; `170-verdict.mjs e2e 170-04-close --same-total-as 170-01-baseline` with five `--renamed-project` pairs; `170-verdict.mjs baselines`; `170-verdict.mjs exemptions`; `catalogue-identity.mjs --base …`; `node scripts/assert-no-candidate-app-names.mjs`; `bash 170-allowlist-probe.sh after`; the six bank-auth verdicts re-checked for staleness | ✅ | ⬜ pending |

Paths above are abbreviated: `rename.mjs`, `catalogue-identity.mjs`, `170-verdict.mjs`, `170-allowlist-probe.sh` and `170-bankauth.sh` live in `.planning/phases/170-contestant-app-rename-symbols-routes/`. Each plan gives the commands in full.

### Requirement → test map

| Requirement | Behaviour | Proven by |
|-------------|-----------|-----------|
| NAME-01 | No app-level old name remains outside `.planning/` and the two exemptions | `node scripts/assert-no-candidate-app-names.mjs`, a link of `yarn lint:check` from 170-04-03 |
| NAME-01 | The gate fails on a planted old name | `--self-test` over the fixture, plus the recorded negative control of 170-04-03 |
| NAME-01 | Every renamed identifier and message key resolves | `yarn typecheck`, `yarn typecheck:tests`, both svelte-checks (gate rows) |
| NAME-01 | The two exemptions are untouched | `170-verdict.mjs exemptions` (counts at the base revision equal counts at HEAD) |
| NAME-01 | No message value changed | `catalogue-identity.mjs --base <base revision>`, with its own negative control |
| NAME-01 | The a11y scan is still wired under its new names | `node scripts/assert-a11y-scan-wiring.mjs` and per-project count equality in the E2E verdict |
| NAME-02 | Route constants, the tree on disk and the gate table agree | `yarn workspace @openvaa/frontend test:unit src/lib/routes/` |
| NAME-02 | No `candidate/` route directory is left | `test ! -e` on `src/routes/candidate` and `src/routes/api/candidate` |
| NAME-02 | The surviving logout handler signs out locally | `src/routes/api/auth/logout/server.test.ts` |
| NAME-02 | The allowlist admits the neutral callback and no `candidate` URL | `170-allowlist-probe.sh` before and after the restart, plus the container's `GOTRUE_URI_ALLOW_LIST` line |
| NAME-02 | Sign-in, registration, password reset and sign-out work on the new routes, in both apps | the full E2E run (journey, admin and perm projects) |
| NAME-02 | The identity-provider flow lands on `contestant/preregister/…` and the preregister API answers | the `bank-auth` and `bank-auth-journey` projects |
| NAME-02 | The docs describe the new routes and no link is broken | `yarn workspace @openvaa/docs validate:links --check` |
| Criterion 4 | The preview page renders as before, and the baselines are the same bytes | `visual-container.sh` run + `170-verdict.mjs baselines` |
| E2E-03 | Zero failed, zero flaky, zero did-not-run | `170-verdict.mjs e2e …` reading the run directory's `summary.json` |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No framework is installed and no package is added. Every Wave 0 item is created by the first task that needs it, before any task that depends on it, so no `<automated>` command carries a MISSING sentinel.

- [ ] `.planning/phases/170-contestant-app-rename-symbols-routes/rename.mjs` and `rename.map.mjs` — the codemod and its ordered mapping table for all four plans, dry run by default, with `--apply`, `--moves`, `--check`, `--paths`, `--rule` (170-01 Task 1)
- [ ] `scripts/assert-no-candidate-app-names.mjs` with `--report`, `--only`, `--self-test`, and `scripts/fixtures/assert-no-candidate-app-names.input.ts` / `.expected.ts.violations` — built in 170-01 Task 1, wired into `lint:check` in 170-04 Task 3
- [ ] `.planning/phases/170-contestant-app-rename-symbols-routes/catalogue-identity.mjs` — reads the "before" side from git objects at the base revision, with its negative control recorded (170-01 Task 1)
- [ ] `.planning/phases/170-contestant-app-rename-symbols-routes/170-gates.sh`, `170-e2e.sh`, `170-verdict.mjs` — so no plan transcribes a gate command or reads a status through a pipe (170-01 Task 1)
- [ ] `.planning/phases/170-contestant-app-rename-symbols-routes/evidence/base-rev.txt` and `evidence/skill-links-baseline.txt`, with the starting populations: the two exemption counts, the two baseline blob ids, the skill-link audit's dangling count (170-01 Task 1)
- [ ] The recorded baseline: the gate set and one full E2E run on the untouched tree, with the per-project counts later runs are compared against (170-01 Task 2)
- [ ] `apps/frontend/src/routes/api/auth/logout/server.test.ts` — the unit test D-06 requires; the name carries no `+` prefix, which SvelteKit reserves under `src/routes` (170-02 Task 1)
- [ ] `.planning/phases/170-contestant-app-rename-symbols-routes/170-allowlist-probe.sh` — the redirect-matcher probe with its expected table for both modes (170-02 Task 3)
- [ ] `.planning/phases/170-contestant-app-rename-symbols-routes/170-bankauth.sh` — the runbook's bank-auth procedure encoded once: built and proved in 170-02 Task 4, only invoked in 170-04 Task 4

---

## Manual-Only Verifications

All phase behaviors have automated verification.

Two instruments need a running local stack and so cannot be unit-level commands; both are scripted, both are run by the executor, and both leave their output in the evidence ledger:

| Behavior | Requirement | Instrument | Where |
|----------|-------------|------------|-------|
| The running auth service's redirect matcher admits the neutral callback and no `candidate` URL | NAME-02 | `170-allowlist-probe.sh <before\|after>` — a `GET /auth/v1/verify` with an invalid token per URL; no email sent, no user touched | 170-02 Task 3, re-run in 170-02 Task 4, 170-04 Tasks 4 and 5 |
| The identity-provider flow against the moved routes | NAME-02 | `170-bankauth.sh` — the opt-in `bank-auth` and `bank-auth-journey` projects through the E2E wrapper, with a served test JWKS and the function served with a test environment | 170-02 Task 4 (builds the driver; once per project), 170-04 Task 4 (invokes it; three times per project) |

If the bank-auth procedure cannot be driven without a terminal, the task stops with a blocking report; it is never replaced by a weaker check.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Per-task feedback within about two minutes; long gates run in the background and are judged from their summary files
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** {pending / approved YYYY-MM-DD}
