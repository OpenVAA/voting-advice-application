---
phase: 158
plan: 09
subsystem: phase-gate
status: complete
tags: [gate, e2e, negative-controls, comment-hygiene, criteria-trace, lint-chain]
requires:
  - 158-01..158-08, 158-10..158-17 (all sixteen sibling plans complete)
provides:
  - the phase's thirteen-criteria trace, measured against the tree at HEAD
  - the negative-control ledger's closing audit (30 controls, counted)
  - a cardinal-clean full-suite run (153 passed, exit 0)
affects:
  - .planning/phases/158-routing-auth-surface-harmonisation/158-NEGATIVE-CONTROL-LEDGER.md
  - .planning/phases/158-routing-auth-surface-harmonisation/158-D10-DISPOSITIONS.md
  - .planning/phases/158-routing-auth-surface-harmonisation/158-VALIDATION.md
  - .planning/phases/157.2-per-request-adapter-instancing/deferred-items.md
tech-stack:
  added: []
  patterns: [phase-gate, positive-control-for-every-zero, three-signal-reading]
key-files:
  created:
    - .planning/phases/158-routing-auth-surface-harmonisation/158-09-SUMMARY.md
  modified:
    - tests/playwright.config.ts
    - tests/tests/specs/admin/admin-access.spec.ts
    - apps/frontend/src/lib/api/base/universalAdapter.test.ts
    - apps/frontend/src/lib/server/admin/features/adminJobLifetime.test.ts
    - apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts
    - apps/frontend/src/lib/server/admin/requireAdminIdentity.ts
    - apps/frontend/src/lib/supabase/job.test.ts
    - .planning/phases/158-routing-auth-surface-harmonisation/158-NEGATIVE-CONTROL-LEDGER.md
    - .planning/phases/158-routing-auth-surface-harmonisation/158-D10-DISPOSITIONS.md
    - .planning/phases/158-routing-auth-surface-harmonisation/158-VALIDATION.md
    - .planning/phases/157.2-per-request-adapter-instancing/deferred-items.md
    - .planning/WINDOWS.md
decisions:
  - "The chained comment-hygiene script does NOT enforce D-N1: it reports `rules live: 2 of 2 (unicode-escape-in-comment; forced-line-break)` and carries a standing prohibition on dash rules. The plan's original claim and its amendment are BOTH wrong, in opposite directions; the diff scan remains D-N1's only enforcement and is chained nowhere."
  - "The negative-control ledger holds THIRTY controls, not the twenty-one the plan asserts. The delta is reported per section rather than reconciled away."
  - "The gate's task order was inverted (Task 3 before Task 2's records) because the ledger's closing section and the EDGE-C11 settlement both need the suite result; a record written before its observation is the very failure T-158-46 forbids."
  - "yarn format:check was RED at the phase head before this gate ran. Fixed here; root-caused to the same per-plan decision to skip the lint chain that let 60 comment-hygiene violations through at 23f0255d7."
metrics:
  duration: ~3h
  completed: 2026-09-02
  tasks: 3
  commits: 4
actuals:
  tokens: 30000
  tasks: 3
  commits: 4
---

# Phase 158 Plan 09: The Phase Gate Summary

**All thirteen criteria trace to a named artifact and a passing command at HEAD, the full suite is cardinal-clean at 153 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run, and four of this gate's own instruments were caught reading the wrong thing before they were believed.**

---

## What this gate is, and what it refuses to do

The phase is closed on **measurement against the tree**, not on sixteen summaries. Where a planning document, an acceptance criterion or a sibling plan's claim disagreed with the tree, the tree won and the disagreement is recorded rather than smoothed. Five such disagreements are recorded below; four of them are in this plan's *own* text.

Every zero reported here carries a positive control. Where a criterion is satisfied only by inference, or only by a spec that could pass for the wrong reason, it says so.

---

## 1. The eight gate steps, in order, each with its own result

Run as separate steps at HEAD `c074bb04d`, branch `integration/ship-12-squash`. **The plain reset sits immediately before the suite, not at the head of the chain** — the head-of-chain order was measured by an earlier phase as four failures and seventy-nine did-not-run, deterministically, because the unit suite seeds the live database.

| # | Step | Command | Exit | Result |
|--:|---|---|--:|---|
| 1 | build | `yarn build --force` | **0** | 14 successful / 14 total, **0 cached** — a measurement, not a replay |
| 2 | lint | `yarn lint:check` | **0** | 11 assertion scripts, all 0 violations; `svelte-check found 0 errors and 0 warnings` |
| 3 | format | `yarn format:check` | **0** | `All matched files use Prettier code style!` — **red on first run; see § 6** |
| 4 | unit | `turbo run test:unit --force` | **0** | 25/25 tasks, **0 cached**; 216 files / 2713 tests; frontend **81 files / 1552 tests** |
| 5 | database | `npx supabase test db` (from `apps/supabase`) | **0** | three signals, quoted together below |
| 6 | reset | `yarn db:reset` (**plain**) | **0** | 12/12 containers healthy; storage answered |
| 7 | dev server | one fresh, warmed instance on `:5173` | — | preflight verified it against this checkout |
| 8 | **E2E** | `yarn test:e2e` | **0** | **153 passed (10.7m)** |

**Why the build and unit steps were forced.** `WINDOWS.md` row 57 records that `turbo build` has no `cache:false`, so an unforced gate is a cache replay rather than a measurement. The unforced runs were 13/14 and 14/25 cached; both were re-run with `--force` at 0 cached, and it is the forced runs that are recorded above.

**Step 5, read on all three signals together** — the planned count is identical on pass and on fail, so quoting it alone would prove nothing:

```
All tests successful.
Files=12, Tests=379,  1 wallclock secs
Result: PASS
```

Overall pass line present · file count **12**, non-zero · planned count **379**, exactly at the floor `157-18` recorded in `STATE.md` (`Files=12, Tests=379, Result: PASS`). No drift.

**Step 2 — the lint chain's ACTUAL link list, read at execution time.** The plan says nine assertion scripts. **There are eleven.** The plan's figure was correct when written and went stale when this phase chained its own two guards — precisely the staleness the plan itself warns about ("a count written down in a plan is stale the moment something is appended"):

`turbo run lint` → `eslint tests` → `typecheck:tests` → `typecheck` → `i18n-catalog-namespaces` · `a11y-scan-wiring` · `comment-hygiene` · `edge-env-defaults` · `declared-binaries` · `node-engine` · `env-pair-registry` · `schema-migration-parity` · `adapter-casts` · **`cookie-names` (added by 158-03)** · **`no-session-in-loads` (added by 158-13)**. 9 + 2 = 11.

**The Svelte checker ran, and this is the chain it ran inside.** `yarn lint:check` → `yarn typecheck` → `turbo run typecheck` → the frontend workspace's own `typecheck` script, which is literally `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`. Output: `svelte-check found 0 errors and 0 warnings`. Stated explicitly so no reader concludes it was skipped or adds it twice. **The workspace also has a stricter `check` script carrying `--fail-on-warnings`, which this gate does NOT run** — making warnings fatal is a separate decision, and it is not taken here.

---

## 2. The cardinal gate

```
E2E PREFLIGHT OK …/apps/frontend (verified against …/voting-advice-application-gsd)
153 passed (10.7m)
E2E_EXIT=0
```

| Quantity | Value |
|---|--:|
| passed | **153** |
| failed | **0** |
| flaky | **0** |
| skipped | **0** |
| did-not-run | **0** |
| Branch | `integration/ship-12-squash` |
| HEAD at the run | **`c074bb04d`** |

**The suite ran at `c074bb04d`, and HEAD has since moved to `8c5af0a06`. `git diff --name-only c074bb04d..HEAD` outside `.planning/` returns 0** — every later commit is documentation. The verdict therefore still holds for the source tree it was taken against, and that is stated rather than left for a reader to assume.

### The total, reconciled item by item — not reported bare

| Step | Count | Source |
|---|--:|---|
| Last recorded green before the admin work | 150 | pre-`158-16` |
| `+ data-setup-admin-auth` (setup project) | +1 | `158-16` T2 |
| `+ admin-access` (the spec) | +1 | `158-16` T3 |
| `+ data-teardown-admin-access` (teardown project) | +1 | `158-16` T2 |
| **Expected** | **153** | |
| **Observed** | **153** | this run |

**Reconciling 158-17's 130 against this 153 — they are not competing figures for the same population.** `158-17` ran `--project=admin-access --grep-invert @probe`, and `data-setup-admin-auth` takes a dependency edge on `voter-prefs-tracking`, the tail of the perm serial chain. A `--project` invocation therefore pulls that chain **transitively** — 130 tests, a proper subset of the 153. The gate's run has no project filter. Both numbers are right about different selections; neither is wrong.

**The three admin projects ran at 124/153, 125/153 and 126/153** — consecutively and alone, exactly the positions `158-ADMIN-E2E-SCHEDULING.md`'s reading 2 predicted from a different run. A prediction from one measurement, confirmed by another.

### Liveness — why this green is not a stale-graph green

Trap #8 is that a green run against a stale Vite SSR graph is indistinguishable from a live one. Three things exclude it here:

1. **A stale server WAS found and killed.** `lsof` showed a Vite dev server for this checkout (PID 6787, started 17:00:36, left by `158-17`'s session) still LISTENING on `[::1]:5173`. The briefing said none was running; the tree said otherwise, and the tree won. It was killed and `:5173` confirmed free. (`158-17`'s summary was independently amended mid-run to record that server exiting at 17:32:05 with code 129/SIGHUP — consistent with this kill.)
2. **The replacement was started AFTER every source-changing commit** and warmed across eight routes to sub-25 ms.
3. **The preflight passed**, asserting via `/@fs` that the served page came from *this* working tree.

`:5174` — the user's unrelated project — was checked and never touched.

---

## 3. All thirteen criteria, traced to an artifact and a command

Per decision **C6(a)** the ROADMAP's criteria are authoritative; `REVIEW-RT-01..07` were never backfilled into `REQUIREMENTS.md`, and `D10-C09`/`D10-C12` are dispositions-ledger criteria rather than checkboxes.

| # | Criterion | Artifact | Command / observation at HEAD |
|--:|---|---|---|
| 1 | One login path | `lib/auth/passwordLogin.ts`, `lib/auth/roles.ts` | Both entry points (`admin/login`, `candidate/login`) call the helper; `ADMIN_ROLES` declared **once** at `roles.ts:38`. `test:unit` → `passwordLogin.test.ts` green |
| 2 | One cookie-name locus | `lib/cookies/index.ts`, `scripts/assert-cookie-names.mjs` | Module declares all four names; `assert:cookie-names` → **783 files, 0 violations**; ledger § B holds 6 observed controls |
| 3 | Routes built with `buildRoute`, one locus | `lib/routes/` (13 files) | Frontend importers of the old locus → **0**; control (new locus) → **31**; `lib/utils/route` no longer exists |
| 4 | `(protected)` in that locus; the subpath misfire gone | `lib/routes/appGates.ts`, `routeConsistency.test.ts` | `pathname.includes('/candidate')` → **0** (control: `pathname` appears 6× in the same file, so the corpus is real). The hook now decides on `route.id` via `resolveAppGate(routeId)` / `isProtectedRoute(routeId)` |
| 5 | Permissions extracted; `loginRedirectTarget` moved; callbacks under `/api` | `lib/routes/loginRedirectTarget.ts`, `routes/api/candidate/auth/*` | Both moved files present; `safeRedirectTarget` called on **both** login actions and the callback |
| 6 | Candidate home props: defaults once, overrides only | `candidateHome.helpers.ts` + `.test.ts` | 12-case characterisation table, written **before** the rewrite, green after it |
| 7 | Test-only element, theme defaults, maintenance title | `routes/+layout.svelte`, `profile/+page.svelte` | `profile-image-error` → **0** (control `profile-image-upload` → 4); `?? '#` → **0** (control `??` → 4); title now `t('dynamic.appName')` + `t('maintenance.title')` |
| 8 | The admin app works | `158-ADMIN-BASELINE.md`, `requireVerifiedAdmin.ts` | All **six** `/api/admin/jobs/*` routes + the helper authorize on the verified identity (7 files). Live at the gate: unauthenticated `/api/admin/jobs/active` → **401**, `/admin` → **307**. Authenticated arm proven by `admin-access` in the suite |
| 9 | Admin surface gated and role-checked | `lib/routes/appGates.ts`; `requireAdminAction.ts` | (a) the hook loops over `APP_GATES` with no application named in a conditional — live `/admin` → 307. (b) both admin form actions call the shared admin-identity decision; `requireAdminIdentity.test.ts` green |
| 10 | `/api/auth/login` deleted | `158-API-LOGIN-CALLER-MEASUREMENT.md` | `git grep api/auth/login` → **0**; **positive control** `api/auth/logout` → 1. `find routes/api/auth -type f` → exactly one file, `logout/+server.ts` |
| 11 | First admin E2E coverage | `tests/tests/specs/admin/admin-access.spec.ts` | Ran at **125/153** inside the unfiltered full suite; setup 124, teardown 126; green |
| 12 | Job holds its own credential | `lib/supabase/job.ts`, both features | `auth: { persistSession: false, autoRefreshToken: false }`; both features resolve the session **once** via `source.locals.safeGetSession()` and pass `createSupabaseJobClient({ accessToken })`, with the global `fetch` |
| 13 | No server load serialises a refresh token | both subtree loads + `assert-no-session-in-loads.mjs` | Both return `{ userId, expiresAt }`. Guard: **corpus 12 modules (floor 10), 0 violations in the real corpus, 5 flagged in its own red fixture** — it demonstrates its own liveness on every run |

**Where a criterion rests on inference rather than execution, it is said here.** Criterion 7's **maintenance** arm is markup- and typecheck-verified only: `DEF-158-01` records that `access.underMaintenance: true` never reaches the rendered branch, so the maintenance title cannot be exercised end to end. Its default arm IS measured from served bytes. This is the "genuine remaining gap" T-158-50 requires be stated.

---

## 4. Task 1 — the comment scan and the logger grep

### The diff scan, and the third position on the lint chain

Scanned this phase's own diff (`bea81d1a8..HEAD`, 5 664 added lines across `apps/`, `tests/`, `scripts/`) for the five patterns. **20 hits. None is a relocation** — every one was authored by this phase, so the acceptance criterion's "attribute it to a relocation" escape does not apply and is not used.

Split by category, and the split is what settles the disposition:

| Pattern | This phase's added lines | Tree baseline at HEAD |
|---|--:|---|
| `.planning/` path | **2** | 8 lines / 7 files |
| `phase <N>` | 18 | 114 lines / 33 files |
| `plan <N>` | 3 | 34 lines / 16 files |
| `spike <N>` | 0 | 0 |
| ` -- ` as a dash | **0** | 566 lines / 93 files |

**The two `.planning/`-path references were fixed** (commit `12b81804b`) — `tests/playwright.config.ts` and `tests/tests/specs/admin/admin-access.spec.ts`, both authored by `158-16`. Decision **D-N1** bars exactly this: *"Do not write `.planning/`-path references into source comments."* The searchable filename is kept; the rotting directory path is gone. The other six such references in the tree predate this phase (152, 153, 155, plus a debug pointer in a `voter-journey` fixture) and are not this phase's to rewrite.

**The 21 `phase <N>` / `plan <N>` hits are REPORTED, not stripped.** They are not what D-N1 bars — its text names `.planning/`-path references — and they sit against a tree-wide baseline of 114 lines across 33 files. Stripping sixteen plans' rationale prose at the gate would be a mass unreviewed edit of explanatory comments, made at the last commit of the phase, to satisfy a pattern broader than the decision behind it. That is a judgement, and it is stated so it can be overruled.

**The chained assertion — and the position both the plan's original text and its amendment get wrong.**

```
yarn assert:comment-hygiene   →   exit 0
Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 1628; …
  rules live: 2 of 2 (unicode-escape-in-comment; forced-line-break). 0 violation(s).
```

- The plan's **original** claim — *"no comment scan is chained"* — is **FALSE**. `assert:comment-hygiene` is link 3 of 11.
- The plan's **amendment** — *"do not report a gap that has since been closed"* — is **ALSO FALSE for D-N1**. Measured: the script implements exactly two rules, neither about planning references, and its docstring carries a **standing prohibition** against ever adding a dash rule (212 comment lines already use `--`, two of them ESLint directive separators where a rewrite would change the directive's parse).
- **The measured third position:** a comment scan IS chained; it does NOT enforce D-N1; **the diff scan remains D-N1's only enforcement, and it is chained nowhere.** `158-VALIDATION.md`'s D-N1 row has been corrected accordingly.

The script additionally excludes root `scripts/` from its own scan — so two of the tree's eight `.planning/` references, which live in `assert-comment-hygiene.mjs`'s own docstring, are invisible to it.

### The logger coupling — which of the three tree states

**The third state: neither the old module nor a shim.** `apps/frontend/src/lib/utils/logger.ts` does not exist; `git ls-files` finds no re-export shim anywhere; the live module is `packages/app-shared/src/logging/logger.ts`, exporting `log` and `configureLogger`.

Of the **43** files this phase created or moved, exactly **two** touch the logger — `lib/auth/passwordLogin.ts` (created) and `lib/routes/parseParams.ts` (moved) — and both use the same symbol and the same specifier: `import { log } from '@openvaa/app-shared'`. Residue for every pre-rename spelling (`utils/logger`, `$lib/utils/logger`, `lib/utils/logger`): **0**. Positive control: **52** frontend files call `log.debug|info|warn|error`. Nothing to fix.

---

## 5. Task 2 — the ledger audit

Full working in the ledger's own closing section. The headline:

**Thirty controls, not twenty-one.** A · 3, B · 6, C · **4**, D · 4, E · **6**, F · **4**, G · **3**. The plan's enumeration is short by one in C, one in F, one in G, and omits **section E entirely** — six OB-1 controls including E6's measured 401 ms load overlap. `21 + 1 + 6 + 1 + 1 = 30`; the arithmetic closes on the discrepancies, which is what tells a miscount apart from a missing control.

Field checks: prediction phrasing **0**; `git status --porcelain apps packages tests scripts` **empty**; the `__ob1probe` directory gone; section B's shape (4 plants + 2 green negative controls, one of them the syntactic-exemption bridge) holds as the criterion states.

**Both edge arithmetics, computed from their own rows, reported separately and never summed:**
- Criteria 1–7: **14 == 12 authored + 2 flagged** ✓ (matches the plan)
- Criteria 8–13: **26 == 22 authored + 4 flagged** — the dispositions ledger's own computed figure; the plan asserts 25 == 21 + 4, and the ledger already records why (its stated plan range excluded `158-17`'s three `D10-C12` edges, and its in-range count was two low). The plan's `<automated>` floor of 25 is met.

---

## 6. Deviations

### [Rule 1 — Bug] `yarn format:check` was RED at the phase head

- **Found during:** Task 3, gate step 3.
- **Issue:** exit 1, six files — `universalAdapter.test.ts`, `adminJobLifetime.test.ts`, `requireAdminIdentity.test.ts`, `requireAdminIdentity.ts`, `supabase/job.test.ts`, `admin-access.spec.ts` — committed unformatted by `158-12`, `158-15`, `158-16` and `158-17`. None caused by this plan's own edits.
- **Fix:** `npx prettier --write` on exactly those six; `format:check` then exit 0, which also proves no seventh file had drifted.
- **Commit:** `c074bb04d`.

### [Rule 2 — Missing critical] Two authored `.planning/`-path comment references

Fixed at `12b81804b`; see § 4.

### [Sequencing] Task 3 was executed before Task 2's record-writing

The ledger's closing section and the `EDGE-C11` settlement both need the suite result. Writing them first would have made them predictions, which is exactly the failure **T-158-46** exists to forbid. The measurements for Task 2 were taken in order; only the writing moved.

---

## 7. How the phase's standing guards actually behaved

Recorded because the answer is not flattering and is the more useful half of a gate.

- **`23f0255d7` (`158-16`'s admin spec) was committed against a RED comment-hygiene guard** — 60 violations, fixed afterwards by `158-17` in a separate commit. `yarn lint:check` is exit 0 at HEAD; verified here.
- **The same commit also carried a format violation** (line 209, a quote-style issue), which survived `158-16` and `158-17` and reached this gate.
- **The common cause is one decision:** `158-16` deliberately did not run the lint/format chain, to avoid misattributing a red to a sibling plan. That is a defensible instinct about attribution and a bad outcome for enforcement — **a guard that each plan may opt out of is not a standing guard.** Both facts are logged in `WINDOWS.md`.

---

## 8. Instrument failures caught in this gate's own work

Four, all live, all in instruments I was about to believe:

1. **`git grep -nE` does not honour `\b`.** My first logger control returned **0 files** calling `log.debug|info|warn|error`; with `-w` it returns **52**. A false zero on the exact question the criterion asks.
2. **My criterion-4 control was vacuous.** `pathname.includes('/candidate')` → 0 *and* the control `pathname.includes` → 0. Two zeros prove nothing. Replaced with `pathname` → 6 occurrences in the same file, establishing the corpus is real.
3. **A prettier check run in `/tmp` is a false negative.** I tested a pre-edit blob at `/tmp/pre-edit-spec.ts`, where the repo's `prettier.config.mjs` does not reach; it "passed" under defaults. Re-run in place, it fails. It nearly had me attribute another plan's drift to my own edit.
4. **The `utils/route` absence check is substring-fooled.** `158-VALIDATION.md`'s command greps `apps packages tests` and returns **2** — both `apps/docs/scripts/utils/routes`, an unrelated module in another workspace with a plural name. Scoped to the frontend it is **0**, control 31. The criterion holds; the stated command does not.

5. **I transcribed a four-day-old measurement instead of re-running it.** § 11 first reported `grep -c "REVIEW-" REQUIREMENTS.md` → 0, copied from `158-CONTEXT.md` (2026-08-28). Re-measured at this HEAD it is **116**. The requirements were backfilled after that reading, and had the transcription stood, this gate would have handed Phase 159 the false premise that its predecessor's criteria are untracked — the exact propagation failure the standing lesson about amending stale lists warns about. **A gate that transcribes has stopped being a gate**, and this is the clearest instance in this record of why every figure here is re-measured.

And a sixth, in someone else's instrument: **the 157.2 deferred entry's own verification grep** (`refreshSession|refresh_token` under `lib/server/admin` and `routes/admin`) now returns **4** where it recorded 0. All four are prose and fixtures written by this phase's criterion-13 work. The prohibition still holds; the grep has been fooled by the very text written to remove the class it names.

---

## 9. The five routed items

| # | Item | Disposition |
|--:|---|---|
| 1 | `EDGE-OB5-unclassified` left OPEN in the dispositions ledger | **SETTLED.** Resolved by `158-12`'s operator-answered checkpoint (`ARM SELECTED: thrown-pin`) with deliverables 2–4 in `158-15`; the exploit premise was retracted on the record at `b5c9bb68d` **before** the fix was authored, so the row's residual risk did not materialise. `EDGE-C11-unclassified` settled alongside it — resolved by delivery, confirmed by the spec running at 125/153. Recorded in a new § 7; §§ 2 and 4 untouched. |
| 2 | 157.2's `deferred-items.md` status line | **SETTLED AS PARTIAL.** The heading and status are amended, not merely appended to — per the standing lesson that an addendum alone lets a stale item propagate. Crash mode **discharged** (measured in `job.ts` and both features); prerequisite gate **satisfied**; **decision B4's authority question remains open**, deliberately. The entry narrows; it does not close. |
| 3 | The `PLAYWRIGHT_BANK_AUTH` gap | **NOT CLOSED, and stated plainly.** See § 10. |
| 4 | `requirements.mark-complete` traceability | **NOT the no-op the briefing predicted — and the correction is mine to own.** It applied: `REVIEW-RT-02` flipped to `[x]`. `REVIEW-RT-01..07` ARE in `REQUIREMENTS.md` (`grep -c "REVIEW-"` → 116); only `D10-C08..C13` are absent (→ 0). Traceability is SPLIT, not missing. See § 11. |
| 5 | The ledger's closing section | **APPENDED**, 96 insertions / **0 deletions** — sections A–G provably undisturbed. |

---

## 10. The bank-auth gap — the one thing this gate could not close

**The `PLAYWRIGHT_BANK_AUTH`-gated projects (`bank-auth`, `bank-auth-journey`, and their setup/teardown) did not run — here, or anywhere since `158-03` rewrote all four cookie names across 17 call sites.** They are opt-in and excluded from the default suite, and running them needs the mock OIDC issuer plus the frontend server's own IdP-pointing environment per `IDURA-TEST-RUNBOOK.md` — operator responsibility, not set in this environment.

**This is the only behavioural evidence that the OIDC exchange still works.** What exists instead proves something narrower, and the distinction matters:

- a static byte-identity proof of the substitution (`158-03`),
- the chained `assert:cookie-names` guard — 783 files, 0 violations,
- six observed negative controls in ledger § B.

All three prove **the guard fires**. **None proves the round trip completes.** No amount of guard evidence substitutes for the exchange running once.

Logged as a new `unrun-verify` window; `WINDOWS.md` rows 217, 220 and 221 stay open for the same gap. It is not papered over and it is not closed.

---

## 11. Traceability, stated honestly

**The briefing predicted a no-op here, and I first wrote it up as one. Re-measured, that was WRONG in half — and the error was mine: I transcribed `158-CONTEXT.md`'s 2026-08-28 reading (`grep -c "REVIEW-"` → 0) instead of re-running it.** The tree wins. Both halves, measured at this HEAD:

- **`REVIEW-RT-01..07` ARE in `REQUIREMENTS.md`** — `grep -c "REVIEW-"` → **116**; all seven carry a checkbox and a traceability row. They were backfilled at some point after C6(a) was recorded, so C6(a)'s premise is now stale. `requirements.mark-complete` **did apply**: it flipped `REVIEW-RT-02` (the only one still `[ ]`) to `[x]` and its row from `Pending` to `Complete`. That tick is earned — criterion 2 is delivered by `158-03`, guarded by a chained assertion at 783 files / 0 violations, with six observed negative controls. All seven now read `Complete`.
- **`D10-C08..C13` are NOT in `REQUIREMENTS.md`** — `grep -cE 'D10-C(0[89]|1[0-3])'` → **0**. The six criteria the D10 widening added have no requirement id, exactly as C6(a) ruled, and their traceability lives in three other files: the ROADMAP entry, `158-D10-DISPOSITIONS.md`, and `158-VALIDATION.md`'s now-filled 51-row map.

**The honest position: traceability is SPLIT.** Seven of the thirteen criteria are tracked in `REQUIREMENTS.md`; six are not, and a reader who looks only there will see the routing work and miss the entire admin widening. The `applied: false` in the verb's own output refers to an incomplete write set, not to a refusal — it is not evidence either way, and reporting it as "expected no-op" without re-measuring would have propagated a stale premise into Phase 159. That is the failure this gate exists to catch, and it caught one of its own.

**One stale body text noted, not edited:** `REVIEW-RT-05`'s prose still says *"the callback-and-logout-under-`/api` clause is NOT built"*, written at `158-05` close. `158-06` built it — `routes/api/candidate/auth/{callback,logout}/+server.ts` both exist and are measured in § 3. The tick is genuinely earned; only the explanatory sentence lags.

---

## 12. Both manual-only verifications, quoted with their results

**(a) The production redirect allowlist** — `158-06-SUMMARY.md`, operator answer (a), verbatim:

> **(a) Production allowlist — CONFIRMED, TWO ENTRIES.** The operator commits to updating the production dashboard allowlist before the moved code deploys, with BOTH the `/en/`-prefixed and the unprefixed form of the new `/api/candidate/auth/callback` path.

A dated deployment-guide TODO was filed as the operator additionally required.

**(b) The non-default-locale run on the moved callback** — `158-06-SUMMARY.md`, verbatim:

> **The move therefore does not change locale derivation.** A request to `/fi/api/candidate/auth/callback` yields `locals.currentLocale === 'fi'` after the move exactly as `/fi/candidate/auth/callback` did before it.

That was measured by hand against the live GoTrue matcher with **both** arms exercised — `http://localhost:5173/fi/api/candidate/auth/callback` **MATCHED**, while `…/fi/en/api/…` (two segments), `…/callback/extra` (suffix pinned), `…/fi/api/evil`, and `http://evil.example.com/…` (host pinned) were all **rejected**. The rejections are what make the match meaningful.

---

## 13. Code review checklist walk

Walked over the phase diff, with the threat-model items measured. **Clean results are recorded, not omitted.**

| Item | Result |
|---|---|
| Changes solve the intended issues | **Clean** — all 13 criteria traced in § 3 |
| OWASP: credential/token logging in the shared helper (**T-158-49**) | **Clean, measured.** The helper takes a `logLabel`, not a credential; its own docstring says *"@param options.password — The submitted password. Never logged."*; **0** log calls interpolate a password or token |
| Redirect-target validation on every login path | **Clean.** `safeRedirectTarget` is called in `admin/login/+page.server.ts`, `candidate/login/+page.server.ts` and the moved `api/candidate/auth/callback` |
| Redirect allowlist not broadened | **Broadened exactly as the operator authorised, and no further.** `additional_redirect_urls` gained the unprefixed path and the single-segment mid-path form `http://localhost:5173/*/api/candidate/auth/callback`. The hard limit (host AND full path suffix pinned) holds, proven by the four rejection arms in § 12. Stating this as "not broadened" would be wrong |
| Avoid `any`; no ad-hoc casts | **Clean.** Added lines containing ` as any` → **0**, `: any` → **0**, `@ts-ignore` → **0** |
| Errors handled and logged | **Clean.** `158-15` replaced the swallowed-error seam with an explicit refusal; `requireVerifiedAdmin` splits 401/403 rather than collapsing them |
| User-facing strings localised | **Clean.** The phase adds **no** new i18n keys (it refactors rather than adds copy); the one changed user-facing string, the document title, is built from `t('dynamic.appName')` and `t('maintenance.title')` |
| Repeated code | **Clean and improved** — three login implementations collapsed to one; two hand-written hook auth arms collapsed to one table loop |
| New entities documented | **Clean.** Every module created carries a docblock |
| Failing checks troubleshot | **One found and fixed** — `format:check`, § 6 |
| Shared-dependency parts not unduly affected | **Clean** — 153/153, covering voter, candidate, perm and a11y families |
| WCAG A/AA; keyboard and screen reader | **Covered by suite, not by this gate directly.** `a11y-smoke` ran green inside the 153. No manual assistive-technology pass was performed |
| Commit history clean and linear | **Clean** — four conventional commits, one per unit of work |
| Supabase backend / adapter / Edge Function sections | **Not applicable** — no migration, no RLS policy, no Edge Function changed. `safeGetSession()` (not `getSession()`) is used on every route guard, as the adapter section requires |
| Repo documentation updated | **Partial** — planning records updated; no `apps/docs` change was required by the diff |

---

## 14. Coverage gaps, stated as gaps

1. **The `PLAYWRIGHT_BANK_AUTH` OIDC round trip has not run since the cookie rewrite** (§ 10). The largest gap, and the only one that leaves a behavioural claim unproven.
2. **Criterion 7's maintenance arm is not suite-verified** — `DEF-158-01`; the branch is unreachable at runtime, so the title change is markup- and typecheck-verified only.
3. **D-N1 has no chained enforcement.** The diff scan that enforces it is this plan's, run once, by hand. The next phase that writes a `.planning/` path into a comment will not be caught.
4. **21 `phase <N>` / `plan <N>` comment references were reported, not removed** (§ 4) — a judgement, open to being overruled.
5. **`158-LIB-UTILS-MOVE-PROPOSAL.md` awaits an operator read.** A judgement document; nothing in the tree moves on its strength, so it blocks no code.
6. **The authenticated non-admin (403) arm** and four of the six job endpoints (`start`, `abort-all`, `single/[jobId]/abort`, `single/[jobId]/progress`) remain unexercised end to end — carried forward from `158-ADMIN-BASELINE.md` § "What this measurement does NOT cover".
7. **No manual assistive-technology pass** was performed; a11y evidence is `a11y-smoke` inside the suite.
8. **`turbo` cache replay** is a standing hazard for any future unforced gate (`WINDOWS.md` row 57); this gate forced build and unit, but nothing in the repo forces them by default.
9. **Traceability is split** (§ 11): `REVIEW-RT-01..07` live in `REQUIREMENTS.md`, `D10-C08..C13` live only in the ROADMAP and two phase artifacts. A reader consulting `REQUIREMENTS.md` alone sees the routing work and misses the whole admin widening. C6(a)'s premise that the `REVIEW-RT-*` ids were never backfilled is itself now stale.
10. **`state.advance-plan` and `state.update-progress` both refuse this `STATE.md`** ("Cannot parse Current Plan or Total Plans in Phase"; "Progress field not found") — pre-existing, recorded by `158-16`, and reported here rather than worked around by hand-editing. `state.record-metric`, `state.record-session` and `roadmap.update-plan-progress` all applied cleanly.

---

## 15. Environment as this plan leaves it

- **No dev server is running.** The one this gate started was stopped; `:5173` verified **FREE**. Do not assume a server; start your own.
- **Supabase is UP**, at a **plain `yarn db:reset`** state — no dataset. Per `158-D10-DISPOSITIONS.md` § 3.2 that means a manual admin page observation is meaningless in this state (the app renders its error boundary while answering 200); the suite is fine because its specs seed their own fixtures.
- `edge_runtime` and `pooler` are **stopped**; neither is reached by the default suite. They matter for the bank-auth rig.
- Disk: **111 GiB free**. `tests/e2e-runs/` was **not** deleted (128 entries preserved).
- No credential or token value is transcribed anywhere in this record (**T-158-55**).

---

## Self-Check: PASSED

Files claimed created/modified — all present. Commits claimed — all in `git log`:

- `12b81804b` docs(158-09): drop the two authored planning-path references from test comments — **FOUND**
- `c074bb04d` style(158-09): format the six files four plans committed unformatted — **FOUND**
- `8c5af0a06` docs(158-09): audit the control ledger, fill the task map, settle two flagged edges — **FOUND**
- `.planning/phases/158-routing-auth-surface-harmonisation/158-09-SUMMARY.md` — **FOUND**
