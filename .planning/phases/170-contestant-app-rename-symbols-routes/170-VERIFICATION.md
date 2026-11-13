---
phase: 170-contestant-app-rename-symbols-routes
verified: 2026-10-06T00:00:00Z
status: passed
score: 12/12 must-haves verified
covered_files:
  - ".planning/phases/170-contestant-app-rename-symbols-routes/170-01-PLAN.md"
  - ".planning/phases/170-contestant-app-rename-symbols-routes/170-01-SUMMARY.md"
  - ".planning/phases/170-contestant-app-rename-symbols-routes/170-02-PLAN.md"
  - ".planning/phases/170-contestant-app-rename-symbols-routes/170-02-SUMMARY.md"
  - ".planning/phases/170-contestant-app-rename-symbols-routes/170-03-PLAN.md"
  - ".planning/phases/170-contestant-app-rename-symbols-routes/170-03-SUMMARY.md"
  - ".planning/phases/170-contestant-app-rename-symbols-routes/170-04-PLAN.md"
  - ".planning/phases/170-contestant-app-rename-symbols-routes/170-04-SUMMARY.md"
  - "CLAUDE.md"
  - "apps/frontend/src/lib/routes/route.ts"
  - "apps/frontend/src/routes/api/auth/callback/+server.ts"
  - "apps/frontend/src/routes/api/auth/logout/+server.ts"
  - "apps/frontend/src/routes/api/auth/logout/server.test.ts"
  - "apps/frontend/svelte.config.js"
  - "apps/supabase/supabase/config.toml"
  - "apps/supabase/supabase/functions/identity-callback/index.ts"
  - "apps/supabase/supabase/functions/invite-candidate/index.ts"
  - "package.json"
  - "scripts/assert-no-candidate-app-names.mjs"
  - "tests/playwright.config.ts"
  - "tests/tests/specs/voter/voter-results-redraw.spec.ts"
covered_digest: "v3:sha256:97e2cd8d6aef67b59c879dd386c007234d6d6c2714c6b9e0c9d677d995caa8c7"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Judgment-tier prohibitions PROH-170-01 to PROH-170-08 (all verification: judgment, recorded as resolved in the plans)"
    expected: "The operator confirms the LLM-judge verdicts in the 'Prohibitions' section of this report. Each was checked against the tree and none was found violated; they remain unverified-prohibition, human review recommended, because the plans gave them no mechanical enforcement."
    why_human: "Judgment-tier prohibitions are never silently passed; the verdict here is non-authoritative."
  - test: "String literals changed beyond the mapping's letter (170-04 coverage D9) and the docs heading 'Contestant application' on developers-guide/about/features (D8)"
    expected: "The operator accepts that seven log-message prefixes under routes/contestant/, several test titles and assertion messages, and one docs heading now read 'Contestant ...'. No resolved name or message-catalogue value changed."
    why_human: "Ruling 19 said the plan changes no executable token; the gate's prose pattern forced the literals. Whether 'what the app is called' on the about/features heading is Phase 171's call is a naming decision."
  - test: "The test fix d21e837ef (170-03) to tests/tests/specs/voter/voter-results-redraw.spec.ts: confirm the recorded limitation"
    expected: "The operator accepts that the cause is evidenced but the failure rate is unmeasured, and that the tab-switch click of the same test keeps the same exposure to a retried click (deferred-items row 3)."
    why_human: "Under the repository's E2E hard rule a flaky test is a defect; whether a once-in-four-runs red with a measured mechanism and no repeat run is closed enough is the operator's call."
operator_acceptance:
  accepted_by: "operator"
  accepted_at: "2026-10-07"
  record: ".planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md"
  items:
    - item: "Judgment-tier prohibitions PROH-170-01 to PROH-170-08"
      decision: "C1 (a) — accepted; none violated"
    - item: "String literals changed beyond the mapping's letter, and the about/features heading"
      decision: "C2 (a) — accepted as they are"
    - item: "The voter-results-redraw test fix d21e837ef and its recorded limitation"
      decision: "C3 (a) — accepted as it is; no repeat-run measurement and no added wait on the tab-switch click were requested"
---

# Phase 170: Contestant App Rename - Symbols & Routes Verification Report

**Phase Goal:** The candidate app is the Contestant app everywhere in the code and in its URLs, with its behaviour unchanged, so that every later phase builds on the new names.
**Verified:** 2026-10-06
**Status:** passed (every truth verified; the eight judgment-tier prohibitions and the three operator-acceptance items were accepted by the operator on 2026-10-07 — decisions C1 (a), C2 (a), C3 (a) of `.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md`)
**Re-verification:** No - initial verification
**Head verified:** `b88b7f4c9`; tree-equal outside `.planning/` to `e222a9b88`, the head every closing run describes.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1: every page is served under `contestant/`; `preregister` under `api/contestant/`; auth pair at `api/auth/{callback,logout}`; no `candidate/` route resolves | VERIFIED | `ls apps/frontend/src/routes`: `(voters)`, `admin`, `api`, `contestant`; `routes/candidate` does not exist. `routes/contestant/` holds `(protected)`, `forgot-password`, `help`, `login`, `password-reset`, `preregister`, `privacy`, `register`. `routes/api/` holds `auth/{callback,logout}`, `contestant/preregister`, `oidc/*`; no `api/candidate`. `route.ts`: `CONTESTANT = '/contestant'`, `AuthCallback: ${API_ROOT}/auth/callback`, `AuthLogout: UNIVERSAL_API_ROUTES.logout` (`/api/auth/logout`). No redirect/shim for an old URL found (PROH-170-03). |
| 2 | SC2: outbound links target the new routes; allowlist admits the neutral callback and no `candidate/` URL | VERIFIED | `config.toml:195` `additional_redirect_urls = ["https://127.0.0.1:3000", ".../api/auth/callback", ".../*/api/auth/callback"]`, no `candidate` in the file. `identity-callback/index.ts:344` `redirectTo: ${redirectSiteUrl}/contestant`; `invite-candidate/index.ts:126` `/contestant/complete-registration` (dangling by D-11). `supabaseDataWriter.ts:87` password-reset `redirectTo` is built from `buildRoute('AuthCallback')`. No custom email template files exist (the `[auth.email.template.*]` blocks are commented out), so there is no template link to rename. I re-ran `170-allowlist-probe.sh after` against the running auth service: exit 0, all ten rows OK (neutral callback and `/fi/` form allowed; both `candidate` callbacks, two-segment prefix, suffix, other path and host rejected). |
| 3 | SC3: no `candidateApp`-type identifier, context, route constant, message namespace or test fixture outside `.planning/` and the two named exemptions; docs describe `contestant/` routes and `api/auth/` | VERIFIED | `node scripts/assert-no-candidate-app-names.mjs` exit 0 (2689 files, 0 findings in symbols/urls/tests/prose). My own `git grep -i -P 'candidate_?app\|candidate-?app\|getCandidateContext\|\$candidate\b\|candidate_?context\|candCtx\|candidateNav\|isCandidateRoute\|candidateUserData'` outside `.planning/`, the gate and its fixtures, minus the two exempt names: nothing but the gate's own `package.json` script name. `svelte.config.js` declares `$contestant` only; no `data-testid=cand...` in `apps/frontend/src`; no `Cand[A-Z]` identifier in apps/packages/tests; no tracked path under `routes/`, `lib/`, `tests/` carries the app name. Docs: `developers-guide/contestant-app/` (5 pages), redirect stubs target it, navigation points at it, `deployment` page says allow `<frontend origin>/api/auth/callback`; `git grep api/candidate` outside `.planning/` finds only the gate and its fixture. `hero-contestant.png` is the poster. |
| 4 | SC4a: user-facing text identical to base | VERIFIED | I flattened every locale catalogue at `990f0d662` and at HEAD with my own script: 699 leaf values in each of seven locales, identical sorted value multisets. `catalogue-identity.mjs --base 990f0d662` exit 0 (595 keys x 7 locales, identical through the key mapping). Diff of non-test `apps/frontend/src` for quoted strings shows only developer-facing error messages (`getContestantContext() called before ...`) and storage keys changing; `APP_GATES[].name` is read nowhere. Both visual baseline blobs unchanged (`170-verdict.mjs baselines` exit 0: `402f4bf8d`, `887818864`); no `update-snapshots`. |
| 5 | SC4b: the logout merge is the one knowing behaviour change, isolated and tested | VERIFIED | `b3ae09d56` is a single commit (`D routes/api/candidate/auth/logout`, `M routes/api/auth/logout/+server.ts`, `A server.test.ts`, plus route key/eslint allowlist/test touch-ups). Surviving handler calls `signOut({ scope: 'local' })`. I ran `yarn workspace @openvaa/frontend test:unit src/routes/api/auth/logout/`: exit 0, 2 of 2 passed (scope assertion + response shape). Evidence 3.1 records the red-first run against the old handler. Callback handler diff vs base is route-key renames only (`CandApp*` to `ContestantApp*`). |
| 6 | SC4c: the full E2E, unit, type, lint and build checks are green on the renamed tree | VERIFIED | I read `tests/e2e-runs/170-e2e/170-04-close/summary.json`: 171 total, 171 passed, 0 failed/flaky/skipped/did-not-run, 100 projects, one preflight success, no failure, exit 0. Baseline `170-01-baseline/summary.json`: 171/171, 100 projects. I compared per project with `candidate`->`contestant` normalised: 0 differences, no project name containing `cand`. Run `head` = `e222a9b884b6...`; `git diff --quiet e222a9b88 HEAD -- . ':(exclude).planning'` exits 0, so HEAD is tree-equal to the run's head outside `.planning/`. Gate set `170-04-close`: 16 rows all status 0 at the same head; `170-verdict.mjs gates 170-04-close` exit 0. Bank-auth: three runs each, `bank-auth` 8/8 and `bank-auth-journey` 131/131, all at head `e222a9b88`. |
| 7 | NAME-01 route constants: `ContestantApp*`, `AuthCallback`, `AuthLogout`; no `ContestantAppAuth*` ever | VERIFIED | `route.ts` lines 92-114; `ContestantAppAuth` has a gate pattern and does not occur. |
| 8 | Search gate exists, is link 8 of `lint:check`, declares exactly two exemptions, exits 0, and a planted name fails it | VERIFIED | `package.json:52`: `... assert:comment-hygiene && yarn assert:no-candidate-app-names && yarn assert:edge-env-defaults ...` (link 8). `EXEMPT` holds `/get_candidate_user_data/g` and `/invite-candidate/g` only. Gate exit 0; `--self-test` exit 0 (81 of 81). The negative control (exit 1 for a planted name, also inside `functions/invite-candidate/`) is recorded in evidence 5.4 and the `170-04-negctl-lint.exit` marker; I did not plant a name myself (that would write a file). Gate source diff since plan 1 is one anchor tightening (`320dee73a`, sparing the entity regex literal `/candidate/i`). |
| 9 | Exempt names untouched: `get_candidate_user_data` 51 occ/15 files, `invite-candidate` 73/32/10 paths at base and HEAD | VERIFIED | `170-verdict.mjs exemptions` exit 0, both revisions equal. |
| 10 | Docs, `CLAUDE.md`, `.claude/skills/**` describe the new names where the rename made them false | VERIFIED | `CLAUDE.md` lines 215/223/231/232/297 name `routes/contestant/`, `$contestant`, `lib/contestant/`, the `contestant` context directory, `getContestantContext()`; no stale route/alias/path left. `.claude/skills/components/SKILL.md` lists `$contestant/components`. Residual loose prose forms are logged (see Anti-Patterns, Warning). |
| 11 | SQL comments mirrored into the generated migration; types unchanged; SQL lint and pgTAP pass | VERIFIED | Gate rows `pgtap` and `sql-lint` status 0 in `170-04-close`; `assert-schema-migration-parity` is a link of `lint:check` and its row is green; `packages/supabase-types` has no diff in the plan. |
| 12 | Codemod and catalogue tooling are idempotent and reviewable | VERIFIED | `rename.mjs --check --plan 4` exit 0 (nothing pending); mapping table `rename.map.mjs` and codemod present. |

**Score:** 12/12 truths verified (0 present-but-behavior-unverified).

### Prohibitions (all `verification: judgment`; non-authoritative verdicts, flagged for human review)

| ID | Statement (short) | LLM-judge verdict | Basis |
|----|-------------------|-------------------|-------|
| PROH-170-01 | Do not rename entity-typed names | Not violated - FLAGGED `unverified-prohibition` | `packages/data` `Candidate*`, `candidateRecord.ts`, `candidates` table, `UserRole 'candidate'`, `LocalizedCandidateData`, voter `candidate` routes and test ids all still present. The gate's anchors exclude them and its fixture's NEGATIVE block proves it. |
| PROH-170-02 | Do not edit a catalogue value | Not violated - FLAGGED | Independent value-multiset comparison, 7 locales, identical. |
| PROH-170-03 | No redirect/alias/shim for old URLs, keys or poster | Not violated - FLAGGED | No `candidate` route directory, no `redirect(` to or from an old URL, no `hero-candidate`, no old route key exported. |
| PROH-170-04 | No behaviour change other than the logout merge | Not violated - FLAGGED | Callback handler diff is key renames only; `preregister/` tree moved unchanged; E2E counts equal per project. Residual risk: logout handler also changes the admin-facing endpoint from global to local scope; the operator knows (listed open). |
| PROH-170-05 | No visual baseline updated | Not violated - FLAGGED | Blobs unchanged; the in-container visual run (`170-03-visual`, 7/7 expected, no write) recorded; `update-snapshots` absent from its `pw-args.txt` per evidence 4.8. |
| PROH-170-06 | Entity-typed test ids/fixtures not renamed | Not violated - FLAGGED | `testIds.voter.results.candidateSection` and `unregisterCandidate` untouched; distinct app test ids 34 before and 34 after. |
| PROH-170-07 | Gate not made green by exemption, path skip, mask or loosening | Not violated - FLAGGED | Two `EXEMPT` lines only; one anchor tightened in 170-02 to spare an entity regex literal (reasonable, reviewed with fixture); gate source and fixtures byte-identical across plan 4. Structural self-skip (own source/fixtures, `.yarn/`) is disclosed and reads against the letter of D-18. |
| PROH-170-08 | Do not rewrite publishers' guide naming or message values | Not violated - FLAGGED | `publishers-guide` still says "Candidate App/application"; plan 4 diff there is three settings keys and one link. One heading outside the publishers' guide (`about/features`) was changed - see human item 2. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/frontend/src/routes/contestant/` | App page tree | VERIFIED | present, wired (`CONTESTANT`, `isContestantRoute`, `CONTESTANT_GATE`). |
| `apps/frontend/src/routes/api/auth/logout/+server.ts` + `server.test.ts` | One logout handler, local scope, tested | VERIFIED | content read; test passes. |
| `apps/frontend/src/routes/api/auth/callback/+server.ts` | Neutral callback | VERIFIED | present; reached by `AuthCallback` and the allowlist. |
| `apps/frontend/src/routes/api/contestant/preregister/` | Own API route | VERIFIED | present. |
| `apps/frontend/src/lib/routes/route.ts` | Constants | VERIFIED | see truth 7. |
| `apps/supabase/supabase/config.toml` | Allowlist | VERIFIED | probe-confirmed live. |
| `scripts/assert-no-candidate-app-names.mjs` (+ fixtures) | Gate | VERIFIED | exit 0 / self-test exit 0. |
| `tests/playwright.config.ts`, `testIds.ts`, specs/fixtures/setup under `contestant/` | Test naming | VERIFIED | 100 projects renamed 1:1, counts equal. |
| `apps/docs/.../developers-guide/contestant-app/` | Docs section | VERIFIED | 5 pages; stubs redirect to it; docs-links `Total findings: 0`. |
| `170-EVIDENCE.md`, `rename.map.mjs`, `rename.mjs`, drivers | Evidence and tooling | VERIFIED | present and consistent with the run directories I opened. |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `route.ts` `CONTESTANT` | `routes/contestant/` directory | filesystem router, route-consistency test | WIRED |
| `SupabaseDataWriter._logout` | `api/auth/logout/+server.ts` | `fetch(ROUTE.AuthLogout)` | WIRED |
| `_requestForgotPasswordEmail` | `config.toml` allowlist | `buildRoute('AuthCallback')` | WIRED (live probe OK) |
| `package.json lint:check` | the gate | `yarn assert:no-candidate-app-names` (link 8) | WIRED |
| `svelte.config.js` `$contestant` | `src/lib/contestant` | alias | WIRED |
| `playwright.config.ts` projects | `assert-a11y-scan-wiring.mjs` | regex over config | WIRED (exit 0) |
| `identity-callback` / `invite-candidate` | `/contestant`, `/contestant/complete-registration` | `redirectTo` | WIRED (second target dangles by D-11) |
| docs stubs | `/developers-guide/contestant-app/*` | `redirect(308, ...)` | WIRED |

### Data-Flow Trace (Level 4)

Not applicable: a rename phase adds no rendered data source. Settings keys (`contestantApp`, `access.contestantApp`) were checked as consumer/producer renames by the typecheck/unit/E2E rows.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Search gate | `node scripts/assert-no-candidate-app-names.mjs` | exit 0, 0 findings | PASS |
| Gate self-test | `... --self-test` | exit 0, 81/81 | PASS |
| Logout scope | `yarn workspace @openvaa/frontend test:unit src/routes/api/auth/logout/` | exit 0, 2/2 | PASS |
| Live allowlist | `bash 170-allowlist-probe.sh after` (read-only GETs) | exit 0, 10/10 OK | PASS |
| Catalogue identity | `node catalogue-identity.mjs --base 990f0d662` | exit 0 | PASS |
| Own value-multiset check | scratch script over 7 locales | identical | PASS |
| Baselines / exemptions | `170-verdict.mjs baselines`, `exemptions` | exit 0, exit 0 | PASS |
| Hygiene, i18n namespaces, a11y wiring, no-session-in-loads | the four `scripts/assert-*.mjs` | exit 0 | PASS |
| Codemod idempotent | `rename.mjs --check --plan 4` | exit 0 | PASS |

Not run by design: full E2E, `yarn dev`, `yarn db:reset`, stack stop/start. `yarn lint:check` / `yarn build` were not re-run; their rows are read from `tests/e2e-runs/170-gates/170-04-close` (head `e222a9b88`, tree-equal to HEAD), not from the summaries.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| NAME-01 | 170-01, 170-03, 170-04 | `candidateApp`-type symbols renamed to contestant forms; auth keys `AuthCallback`/`AuthLogout` | SATISFIED | truths 3, 7, 8; gate 0 findings |
| NAME-02 | 170-02, 170-04 | Routes move to `contestant/`; `preregister` to `api/contestant/`; Edge Function redirects, allowlist, docs; auth pair neutral; duplicate logout merged | SATISFIED | truths 1, 2, 5, 10 |

No orphaned requirement: REQUIREMENTS.md maps only NAME-01 and NAME-02 to Phase 170. (The traceability table still shows both as `Pending` and the ROADMAP plan checkboxes are unticked; the summaries say these files were deliberately left to the orchestrator.)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.claude/skills/components/SKILL.md` | 20 | "voter/candidate contexts" (the context is now `contestant`) | Warning | Agent-doc prose now slightly stale; logged as deferred item 8, neither the mapping nor the gate names the form. Same form in two spike-findings skill files and 22 "candidate context" mentions in docs and comments (e.g. `routes/contestant/+layout.svelte:38` "Init Candidate Context", `lib/contexts/contestant/contestantContext.svelte.ts:35`). |
| `tests/README.md` | 136, 156 | "candidate settings-perm chain", "Candidate-journey seed overlay" | Info | Naming residue; deferred item 8. |
| `apps/frontend/src/lib/contexts/app/appContext.svelte.ts`, `appContext.type.ts` | 84, 77 | `TODO: Refactor when Cand App is refactored` | Info | Pre-existing note; not matched by the gate (`Cand App` with a space). |
| `packages/app-shared/.../storedCustomization.schema.test.ts` | 20 | sample path `'brand/cand-poster.png'` | Info | Arbitrary fixture string; the key itself is `contestantPoster`. |
| `package.json` / `packages/dev-seed/tests` | - | No wiring test for the new gate (deferred item 9) | Warning | Removing the `lint:check` link would turn nothing red; the link is verified present today. |
| Debt markers | - | No unreferenced `TBD`/`FIXME`/`XXX` introduced by the phase seen in the files read | - | - |

None is a blocker: none is an app-level identifier, route, URL, message namespace or test fixture, which are the four things SC3 names.

### Test Fix `d21e837ef` (170-03): is the diagnosis evidenced?

**What changed:** three added lines in `tests/tests/specs/voter/voter-results-redraw.spec.ts`: an import of `awaitAnimationsSettled` from `../../utils/axeScan` and one `await awaitAnimationsSettled(page);` plus a comment, before the "entity OPEN" step's `scrollDown`. Nothing in the application changed. The helper exists, waits for all finite animations in the document subtree (including view-transition pseudo-elements), and excludes infinite ones.

**Supported by evidence (not merely asserted):**
- The red run is preserved (`tests/e2e-runs/170-e2e/170-03-close/summary.json`: 171 total, 164 passed, 1 failed, 6 did-not-run; the six are the closed-project trio that depends on every project). The failure was in the one spec the rename did not touch, at the first scroll assertion (expected 1095, received 1394).
- The causal chain is taken from that run's own Playwright trace: baseline read 253 ms after the landing click; the target click logged `element is not stable` three times, then succeeded on the fourth attempt; `1394 = 2114 - 720` (the document's maximum scroll offset at a 720 px viewport). The evidence names the mechanism in the installed Playwright (`_retryPointerAction` cycling the pre-click scroll through `[undefined, end, center, start]`, so retry 4 scrolls with `block: 'start'`).
- An independent isolated run (`170-03-redraw-probe-1`, temporary uncommitted probe) measured the movement at the instant the test would start: 28 finite animations running (de-selected option, 21 view-transition pseudo-elements, a `transition:slide` placeholder), `scrollHeight` 3742 vs 3684 after settling, the fourth card's offset 1465 vs 1407 (58 px), and zero animations two frames later. The two halves of the diagnosis (layout moves ~400 ms after landing; a retried click scrolls) are each measured.
- The fix targets exactly that window and uses an existing, already-used helper; it changes the test, not the assertion.

**Still unmeasured (recorded limitations, not gaps):**
- The failure rate before and after: one red in four default-suite runs before the fix; no repeat run on an unchanged tree; the second green run does not measure the post-fix rate.
- That the `awaitAnimationsSettled` wait fully removes the retry in the CI-speed environment (memory notes CI runs ~4.3x slower); no run counts click retries after the fix.
- Whether a click retried for another reason would scroll the same way. The test's tab-switch click has the same exposure and was left unchanged (deferred item 3).
- The probe's document height (3742) differs from the failing run's (2127), so the 58 px figure is from a different state of the same page, not a re-observation of the failing run.
- Under the repository's cardinal E2E rule ("no flaky tests"), the operator may want a repeat-run measurement; that is the human item 3.

### Human Verification — accepted by the operator, 2026-10-07

All three items below were put to the operator in `.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md` § C and each took its recommended option: C1 (a) accept, C2 (a) accept as they are, C3 (a) accept as it is. The limitation in item 3 stands as recorded: the failure rate of the fixed spec is unmeasured and the tab-switch click keeps the same exposure.

1. **Judgment-tier prohibitions PROH-170-01..08** - confirm the verdicts above. Expected: none violated. Why human: plans assigned them `verification: judgment`, which this verifier may not pass silently.
2. **String literals and one docs heading changed with the prose phrase** - seven log prefixes under `routes/contestant/`, test titles/assertion messages, and the `about/features` heading "Contestant application". Expected: accepted as non-resolving text, or the heading reverted to wait for Phase 171.
3. **170-03 test fix** - accept the recorded limitation (rate unmeasured, tab-switch click same exposure) or ask for a repeat-run measurement.

Already declared open by the operator and therefore NOT findings: which logout behaviour survives (local scope implemented; the admin-facing endpoint moved from global to local), the `preregister` to `register` note for Phases 178-179, names renamed/kept without decision (end of `170-04-SUMMARY.md`), the dangling `/contestant/complete-registration` (D-11), the IdP return staying at `/api/oidc/callback`, and the pre-existing reds `audit-skill-links.sh` / `audit-skill-drift.sh`.

### Gaps Summary

No gaps. Every roadmap success criterion and every plan truth holds in the tree; the gate, its self-test, the allowlist probe, the catalogue identity (twice, with an independent method) and the single-test logout check were run by this verifier, and the closing E2E and gate runs were read from their run directories and shown tree-equal to HEAD outside `.planning/`. The status is `human_needed` only because eight judgment-tier prohibitions and three operator-acceptance items must be surfaced rather than absorbed.

---

_Verified: 2026-10-06_
_Verifier: Claude (gsd-verifier)_
