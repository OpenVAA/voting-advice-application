---
phase: 161-project-scoping-project-id-parameterisation
plan: 09
subsystem: testing
tags: [playwright, e2e-harness, sveltekit-hooks, static-analysis, pgtap, postgres, multi-tenancy]

requires:
  - phase: 161-08
    provides: 'The proven isolation claim — the E2E project is read-clean against 751 default-project rows — which is what makes a no-reset closing run evidence rather than luck'
  - phase: 161-06
    provides: 'The e2eDocPreconditionGate class check and its exact allowlist, extended here rather than duplicated'
  - phase: 161-05
    provides: 'scripts/assert-project-scoped-queries.mjs and its two fixtures, made self-proving and fail-closed here'
  - phase: 161-02
    provides: 'Migration 00005 (get_nominations gains a required p_project_id) whose entity joins this plan qualifies'
provides:
  - 'A served-project preflight: the application publishes its resolved project id on the HTML root and global setup aborts before any spec body when it disagrees with the project the harness seeds'
  - 'Three documents that instruct a run sequence which works, held there by an extended gate rather than by memory'
  - 'A project-scoping guard that fails closed on an empty call-site corpus and proves itself against its fixtures in the spelling lint:check actually calls'
  - 'Check 6: the aliased / destructured / computed-access escape hatches are forbidden outright and each pinned by a committed fixture expectation'
  - 'Migration 00007: get_nominations cannot return an entity belonging to another project, with pgTAP assertions over entity ids'
affects: [162-permissions-auth-model, e2e-harness, supabase-rpcs]

actuals:
  tokens: 61072
  tasks: 6
  commits: 6

tech-stack:
  added: []
  patterns:
    - 'Two-sided placeholder contract: app.html declares %projectId%, hooks.server.ts substitutes it, and the harness treats an unsubstituted placeholder as a mismatch rather than as agreement'
    - 'Self-proving guard in the wired spelling: fixture expectations run inside main() so there is no second command to remember and none to drop'
    - 'Non-vacuity as a floor, never an exact count: the guard fails on zero examined sites while the fixtures supply the exact numbers'
    - 'Discriminating documentation gate: a co-occurrence population narrowed by an exemption derived from the harness own project constant, rather than a banned string'

key-files:
  created:
    - apps/supabase/supabase/migrations/00007_get_nominations_entity_project_scope.sql
  modified:
    - apps/frontend/src/app.html
    - apps/frontend/src/hooks.server.ts
    - tests/global-setup.ts
    - CLAUDE.md
    - tests/README.md
    - tests/IDURA-TEST-RUNBOOK.md
    - packages/dev-seed/tests/e2eDocPreconditionGate.test.ts
    - packages/dev-seed/tests/projectScopingGate.test.ts
    - scripts/assert-project-scoped-queries.mjs
    - scripts/fixtures/project-scoped-queries/violation.fixture.ts
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
    - apps/supabase/scripts/schema-migration-parity.expected.txt

key-decisions:
  - 'The mechanism landed before the documentation, so a reader working from a stale copy of the instructions gets a named abort rather than a silent empty application'
  - 'The published project id mirrors constants.PUBLIC_PROJECT_ID normalisation rather than calling the adapter resolver, because that resolver throws and a throw in transformPageChunk would 500 every page including pages that touch no data'
  - 'The escape hatches are forbidden outright rather than chased with a wider receiver pattern: the receiver is an open expression grammar, so a widening is a guess about the next spelling while a prohibition is decidable and has no next case'
  - 'The documentation gate exempts a dev server whose window carries PUBLIC_PROJECT_ID set to the harness own E2E_PROJECT_ID constant, so a CORRECT instruction does not need an allowlist entry'
  - 'The entity project predicate belongs in the JOIN condition, never the WHERE clause: on a LEFT JOIN a WHERE predicate would discard every nomination whose entity is of another type and empty the result set'
  - 'The RLS read-grant gap is recorded and carried to Phase 162 rather than fixed here'

patterns-established:
  - 'Prove a preflight in BOTH directions before believing it: a check never seen to fail has not been shown to check anything'
  - 'Seed the illegal state a test exists to detect, plus a control proving the illegal row is visible, so a zero is a measurement rather than an empty instrument'

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: 'The served application publishes its configured project id, and a mismatch with the project the harness seeds aborts global setup before any spec body'
    requirement: PRESHIP-01
    verification:
      - kind: e2e
        ref: 'tests/global-setup.ts#assertServedProject — observed RED twice (attribute absent; id mismatch naming both ids) against a deliberately mis-scoped server on :5273'
        status: pass
      - kind: e2e
        ref: 'tests/e2e-runs/161-09-t1 (a11y-smoke, --no-db-reset): exit 0, 18 expected, 0 unexpected, preflight 1/0, one E2E SERVED PROJECT OK line'
        status: pass
      - kind: unit
        ref: 'yarn typecheck (exit 0) && yarn typecheck:tests (exit 0)'
        status: pass
    human_judgment: false
  - id: D2
    description: 'CLAUDE.md, tests/README.md and tests/IDURA-TEST-RUNBOOK.md instruct an E2E sequence that produces a valid run, and a gate holds them there'
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: 'packages/dev-seed/tests/e2eDocPreconditionGate.test.ts#no live document instructs a plain `yarn dev` as the way to serve the application under test — RED against the pre-edit text (9 unlisted) and RED against an injected reintroduction (CLAUDE.md:441)'
        status: pass
      - kind: unit
        ref: 'yarn workspace @openvaa/dev-seed test:unit (exit 0, 664 tests)'
        status: pass
    human_judgment: false
  - id: D3
    description: 'The project-scoping guard fails closed on an empty call-site corpus and proves itself against its fixtures in the spelling lint:check calls'
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: 'packages/dev-seed/tests/projectScopingGate.test.ts#exits non-zero when the access matcher has stopped matching — RED (exit 0 with "0 raw client call(s) examined") before, GREEN after'
        status: pass
      - kind: other
        ref: 'node scripts/assert-project-scoped-queries.mjs with ACCESS_RE broken: exit 1 (was exit 0 in the review reproduction); reverted, exit 0'
        status: pass
    human_judgment: false
  - id: D4
    description: 'The three demonstrated guard evasions are caught and each pinned by a committed fixture expectation'
    requirement: PRESHIP-01
    verification:
      - kind: other
        ref: 'scripts/assert-project-scoped-queries.mjs self-test — three per-shape expectations observed failing before the fix, and the three violations reported at violation.fixture.ts:49, :55, :61 after'
        status: pass
      - kind: other
        ref: 'yarn lint:check (exit 0); clean fixture still 0 violations'
        status: pass
    human_judgment: false
  - id: D5
    description: 'get_nominations cannot return an entity belonging to another project, and a pgTAP assertion fails if that becomes possible again'
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: 'apps/supabase/supabase/tests/database/07-rpc-security.test.sql section 8 — tests 14, 18, 19 observed failing against the pre-fix function (have 1, want 0), all passing after; supabase test db 397/397, Result PASS'
        status: pass
      - kind: other
        ref: 'yarn assert:schema-migration-parity (exit 0); migration and schema function bodies compared byte-for-byte, IDENTICAL'
        status: pass
    human_judgment: false
  - id: D6
    description: 'The full gate suite is green at the tip of this plan, taken with no intervening database reset'
    requirement: PRESHIP-01
    verification:
      - kind: e2e
        ref: 'tests/e2e-runs/161-09-close: exit 0, observed_expected=155, observed_unexpected=0, observed_flaky=0, observed_skipped=0, preflight 1/0, db_reset=false, head equals HEAD'
        status: pass
    human_judgment: false
  - id: D7
    description: 'The bank-auth runbook steps are reconciled to the project the harness reads'
    verification: []
    human_judgment: true
    rationale: 'The bank-auth and bank-auth-journey Playwright projects are opt-in behind PLAYWRIGHT_BANK_AUTH and need a live Idura tenant or the mock issuer plus a separately served Edge Function; they were not executed here. The edit is a reconciliation to the value the served-project preflight now requires, and to the project SupabaseAdminClient already reads, so it is at least as correct as what it replaces — but only an operator running EFLOW-10 / EFLOW-10b can confirm the whole flow end to end.'

duration: 60min
completed: 2026-09-05
status: complete
---

# Phase 161 Plan 09: Close criteria 2 and 4 on evidence Summary

**The served project became observable and a mismatch became an abort; the scoping guard stopped being able to report a clean bill while checking nothing; and `get_nominations` stopped being able to hand project A's ballot project B's candidate.**

## Performance

- **Duration:** ~60 min
- **Started:** 2026-09-05T13:14:00Z
- **Completed:** 2026-09-05T14:12:00Z
- **Tasks:** 6 of 6
- **Files modified:** 18 (1 created)

## Accomplishments

- **A served-project gate that was observed failing before it was believed.** `app.html` carries `data-project-id="%projectId%"` on `<body>`, `hooks.server.ts` substitutes the resolved public project id on the existing `%lang%` transform, and `tests/global-setup.ts` compares it with `resolveE2eProjectId()` immediately after the served-checkout clause. Both failure directions were exercised on a real mis-scoped server.
- **Three documents that now describe a sequence that works**, and a second class check in `e2eDocPreconditionGate.test.ts` that keeps them there — proven red twice before it was accepted.
- **A guard that can no longer report a clean bill while checking nothing.** An empty call-site corpus is a violation; the fixture self-test runs in `main()` on every invocation, so the spelling wired into `lint:check` is the self-proving one, and `package.json` did not have to change for that to be true.
- **The three demonstrated evasions are closed by prohibition**, each with its own committed expectation, and the widening reddened no correct code.
- **Migration 00007 qualifies all four entity joins**, with a pgTAP section that seeds the illegal cross-project nomination and asserts over entity ids rather than nomination ids.
- **One full gate suite, green, with no reset**: 155/155, exit 0, preflight 1/0, at exactly this plan's HEAD.

## Task Commits

1. **Task 1: The served project is observable, and a mismatch aborts global setup** — `fa26b8801` (feat)
2. **Task 2: Three documents instruct a sequence that works, held by a gate** — `816e9ef0b` (docs)
3. **Task 3: The guard fails closed and proves itself in its wired spelling** — `4047f77df` (fix)
4. **Task 4: The three demonstrated evasions are caught and pinned** — `2c96df525` (fix)
5. **Task 5: `get_nominations` cannot return another project's entity** — `c742489e1` (fix)
6. **Task 6: Stale record corrected, three todos settled on measurement** — `b9cddbcfd` (docs)

Task 6's other product is the closing run at `tests/e2e-runs/161-09-close`, which is gitignored; its counts are transcribed below, following the convention `161-07-SUMMARY.md` established.

## Files Created/Modified

- `apps/supabase/supabase/migrations/00007_get_nominations_entity_project_scope.sql` — **created.** Qualifies the four entity `LEFT JOIN`s with `p_project_id`. `CREATE OR REPLACE` with no `DROP`: the arity is unchanged, unlike 00005 whose arity changed from four to five.
- `apps/frontend/src/app.html` — `data-project-id="%projectId%"` on `<body>`.
- `apps/frontend/src/hooks.server.ts` — `SERVED_PROJECT_ID` at module scope, substituted on the existing `transformPageChunk`.
- `tests/global-setup.ts` — `assertServedProject`, reusing the exported `FAILURE_HEADLINE` so the wrapper's preflight verdict counts a project mismatch too.
- `CLAUDE.md`, `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md` — the run sequence, and a documented second preflight clause.
- `packages/dev-seed/tests/e2eDocPreconditionGate.test.ts` — the second retired-instruction class, its discrimination rule and its 3-entry allowlist.
- `packages/dev-seed/tests/projectScopingGate.test.ts` — the vacuity reproduction and the wired-spelling self-proof.
- `scripts/assert-project-scoped-queries.mjs` — non-vacuity floor, self-test in `main()`, check 6.
- `scripts/fixtures/project-scoped-queries/violation.fixture.ts` — the three evasion shapes.
- `apps/supabase/supabase/schema/503-entity-rpcs.sql` — byte-identical function body to the migration.
- `apps/supabase/supabase/tests/database/07-rpc-security.test.sql` — the cross-project probe row, two controls and two entity assertions; plan 23 → 27.
- `apps/supabase/scripts/schema-migration-parity.expected.txt` — re-baselined; the diff is exactly the four join lines plus two comments.

## Evidence

### Task 1 — the served-project gate, both directions

**RED (a), the attribute-absent case**, against a plain `FRONTEND_PORT=5273 yarn dev` before the publication side existed:

```
E2E PREFLIGHT OK /…/voting-advice-application-gsd/apps/frontend (verified against /…/voting-advice-application-gsd)
Error: E2E PREFLIGHT FAILED — the server on port 5273 serves a different project than this suite seeds.
  reason:            the served document carries no data-project-id attribute, so the project it queries cannot be established
  observed project:  (attribute absent)
  expected project:  00000000-0000-0000-0000-0000000000e2
```

**RED (b), the mismatch case**, against the same server after the publication side landed:

```
Error: E2E PREFLIGHT FAILED — the server on port 5273 serves a different project than this suite seeds.
  reason:            the served application queries a different project than this suite seeds
  observed project:  00000000-0000-0000-0000-000000000001
  expected project:  00000000-0000-0000-0000-0000000000e2
  expected port:     5273 (http://localhost:5273)
  remedies:
    - run the suite through `tests/scripts/e2e-run.sh`, which spawns a dev server on the project the suite seeds; or
    - if you are driving your own server, start it with PUBLIC_PROJECT_ID set to the expected project above
```

Both cases were exercised, so the acceptance criterion is answered for both: the ABSENT case and the MISMATCH case each abort.

**Ordering, against a genuinely foreign checkout** (an unrelated project's Vite server holds `:5173` on this host). The checkout diagnosis fires first and no served-project line is reached:

```
Error: E2E PREFLIGHT FAILED — the server on port 5173 is not this checkout's dev server.
  reason:            the listener is not this checkout's Vite dev server (GET …/@fs/…/+layout.svelte returned 403, expected 200)
  observed:          HTTP 200 -> http://localhost:5173/; <title>Handmade wooden Moomin magnets — Harallt</title>; served module root: /Users/…/Kaljarv/harallt/apps/web
```

**GREEN:** `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/161-09-t1 --project a11y-smoke --no-db-reset` → wrapper exit 0, `exit` file `0`, `observed_expected=18`, `observed_unexpected=0`, `preflight-successes=1`, `preflight-failures=0`, and exactly one `E2E SERVED PROJECT OK` line.

`yarn typecheck` → 0. `yarn typecheck:tests` → 0. Both exit codes read directly, never through a pipe.

### Task 2 — the documents and their gate

**RED against the pre-edit text** — 9 unvouched co-occurrences of `yarn dev` with an E2E invocation:

```
CLAUDE.md:35   'yarn test:e2e # Run Playwright E2E tests (requires yarn dev running; preflight-checked)'
CLAUDE.md:284  '# Full E2E — `yarn dev` supplies both prerequisites: local Supabase, and ONE fresh dev server…'
CLAUDE.md:285  'yarn dev'
tests/README.md:8   '# Prereqs: yarn install && (in another shell) yarn dev'
tests/README.md:32  '- stop the other server occupying the port, then start this repo's `yarn dev`; or'
tests/README.md:35  '**The alternate-port hatch.** …'
tests/README.md:37  'Related: `yarn dev` now refuses to start when its port is already taken…'
tests/README.md:84  'yarn dev'
tests/IDURA-TEST-RUNBOOK.md:302 '> The dev server has to be on 5174 for this run as well…'
```

**RED against an injected reintroduction** — with a `yarn dev` / `yarn test:e2e` block appended to `CLAUDE.md` after the edits, the gate fired again on the injected line alone:

```
CLAUDE.md:441 — 'yarn dev' names `yarn dev` within 3 lines of an E2E invocation. A plain `yarn dev` serves the
DEFAULT project while the suite seeds its own, so the suite would drive an empty application; instruct
`tests/scripts/e2e-run.sh` instead, or add this line to DEV_COMMAND_ALLOWLIST with the reason it is not a run recipe.
```

The injection was reverted and the gate returned to 7/7.

**Disposition of every surviving `yarn dev` mention** (`grep -rn "yarn dev" CLAUDE.md tests/README.md tests/IDURA-TEST-RUNBOOK.md`):

| Location | Framing | Disposition |
|---|---|---|
| `IDURA:40` "Repo running locally (`yarn dev`)" | development | stays — the manual Idura walkthrough's prerequisite, not an E2E one |
| `IDURA:155` `yarn dev # Supabase + frontend on :5173` | development | stays — Step 5 of the manual walkthrough, which browses the locally seeded default project |
| `IDURA:305` `PUBLIC_PROJECT_ID=…00e2 FRONTEND_PORT=5174 yarn dev` | prerequisite | **corrected** — now names the project the harness reads; exempted by the gate's scoping rule |
| `IDURA:361` "You MUST therefore start `yarn dev` … with the following env" | prerequisite | stays — it defers the env to Step B-3's block, which is corrected |
| `IDURA:418` "MUST NOT leak into a default `yarn dev`" | development | stays — a prohibition on leaking test env |
| `IDURA:440` `yarn dev # SvelteKit on :5173 inherits the IdP env` | prerequisite | stays — the `export PUBLIC_PROJECT_ID=…00e2` two lines above now scopes it |
| `CLAUDE.md:15,98,214` command maps and setup list | development | stay — they define the command |
| `CLAUDE.md:60,61` alternate port and `strictPort` | development | stay — port mechanics |
| `CLAUDE.md:99-101` `dev:clean` / `dev:reset` / `dev:reset-with-data` | development | stay — different commands; the needle excludes the `dev:` siblings |
| `CLAUDE.md:154` "the `yarn dev` script builds packages" | development | stays |
| `CLAUDE.md:297` "a plain `yarn dev` serves the **default** project" | explanatory | **new** — the one-sentence mechanism the plan asked for |
| `CLAUDE.md:415` troubleshooting `dev:reset` | development | stays |
| `README:15` "a plain `yarn dev` serves the **default** one" | explanatory | **new** |
| `README:19` `PUBLIC_PROJECT_ID=…00e2 yarn dev` | prerequisite | **corrected**; exempted by the scoping rule, and the live case that exercises that rule |
| `README:48,51,53` preflight remedy, port hatch, `strictPort` | development / port | **allowlisted**, three entries with reasons |
| `README:100` `PUBLIC_PROJECT_ID=…00e2 yarn dev` (reseed recipe) | prerequisite | **corrected** |
| `README:105,291` `dev:clean`, "an ordinary `yarn dev` session" | development | stay |

`yarn workspace @openvaa/dev-seed test:unit` → exit 0 (664 tests after task 4; 662 at the time of this task).

### Task 3 — non-vacuity and the self-proving spelling

**RED**, from `projectScopingGate.test.ts` against the pre-fix script:

```
× exits non-zero when the access matcher has stopped matching
  → expected +0 not to be +0 // Object.is equality
× proves itself against its fixtures in the spelling that is actually wired, with no flag
  → expected 'Project-scoped query guard — 5 guarde…' to contain 'self-test'
```

The first is the review's reproduction verbatim: the mutated copy printed `0 raw client call(s) examined` and still exited 0.

**GREEN**, the same reproduction re-run by hand on the real script with `ACCESS_RE` replaced by a matcher that matches nothing:

```
[ERROR] …: no raw client call sites were examined across 5 guarded source(s). A matcher that matches nothing
        reports zero violations forever, so an empty call-site corpus is a failure rather than a clean bill.
Project-scoped query guard — … 0 raw client call(s) examined, 2 violation(s); self-test … 5 expectation(s) FAILED.
BROKEN_MATCHER_EXIT=1
```

Reverted → `REVERTED_EXIT=0`.

A plain invocation now reports the fixture outcome:

```
Project-scoped query guard — 5 guarded source(s), 0 deferred, 5 adapter source(s) on disk, 5 raw client call(s)
examined, 0 violation(s); self-test flagged 6 line(s) in scripts/fixtures/project-scoped-queries/violation.fixture.ts
(6 access(es)) and 0 in scripts/fixtures/project-scoped-queries/clean.fixture.ts (1 access(es)), matching the
committed expectation.
```

`package.json` is **unchanged**, which is the point of the decision: `"assert:project-scoped-queries": "node scripts/assert-project-scoped-queries.mjs"`. `yarn lint:check` → exit 0, read directly.

### Task 4 — the three evasions, per shape

| Shape | Before | After |
|---|---|---|
| `const db = this.supabase; db.from('elections')` | UNCAUGHT — `self-test expectation failed — … did not produce the check-6 aliased-client violation` | CAUGHT — `violation.fixture.ts:49: this aliases the raw client to a local binding…` |
| `const { from } = this.supabase; from('candidates')` | UNCAUGHT — `… did not produce the check-6 destructured-client violation` | CAUGHT — `violation.fixture.ts:55: this destructures the raw client to a local binding…` |
| `this.supabase['from']('nominations')` | UNCAUGHT — `… did not produce the check-6 computed-access violation` | CAUGHT — `violation.fixture.ts:61: computed member access on the client…` |

Before the fix the three were not merely unreported but **uncounted**: the violating fixture yielded 3 access sites with all three shapes present. After it, 6.

**Route chosen: prohibition, not a widened receiver pattern.** The receiver is an open-ended expression grammar, so every widening is a guess about which spelling the next author reaches for, while a prohibition is decidable by inspection and has no next case. It costs nothing here because a guarded source has no legitimate need for any of the three: the sanctioned route is `scopedFrom`, and the accessor that hands the client to it is a plain member read the rule does not touch. The reasoning is in the guard's docblock at `CLIENT_BINDING_RE`.

The clean fixture is untouched: `… and 0 in scripts/fixtures/project-scoped-queries/clean.fixture.ts (1 access(es)), matching the committed expectation.` `yarn lint:check` → exit 0.

### Task 5 — the entity joins

**RED**, `yarn workspace @openvaa/supabase test:db` against the pre-fix function with the probe row seeded:

```
# Failed test 14: "the two project-scoped counts partition this fixture's anon-visible confirmed nominations…"
#         have: 5   want: 4
# Failed test 18: "get_nominations for project A returns no row whose entity belongs to project B"
#         have: 1   want: 0
# Failed test 19: "a nomination whose entity belongs to another project is dropped entirely rather than returned with null entity columns"
#         have: 1   want: 0
# Looks like you failed 3 tests of 27
Files=12, Tests=397 … Result: FAIL
```

Test 18 is CR-01 reproduced inside the suite rather than in an ad-hoc probe. Test 14's red is a second, independent statement of the same leak: pre-fix the cross-project row IS returned by project A's call.

**GREEN**, after applying migration 00007 (`supabase migration up --local`, applying `00007` only):

```
All tests successful.
Files=12, Tests=397 … Result: PASS
```

**PASS count before and after:** 393 → 397. The delta is exactly the four assertions added to section 8 (its plan went 23 → 27); no other file's plan changed.

**`00005` and `00006` are byte-unchanged.** `git status --short apps/supabase/supabase/migrations/` reports only `?? 00007_get_nominations_entity_project_scope.sql`, and `git diff --stat` over that directory is empty.

**The migration and the schema file define byte-identical bodies** — the `CREATE OR REPLACE FUNCTION public.get_nominations (…) … $$;` span was extracted from both files and compared: `IDENTICAL`. `yarn assert:schema-migration-parity` → exit 0.

**No valid nomination was dropped**, measured on the live database after the fix:

```
cross_project_nominations=0
total_nominations=377
00000000-0000-0000-0000-000000000001 rpc_rows=377 table_rows=377
00000000-0000-0000-0000-0000000000e2 rpc_rows=0   table_rows=0
```

The default project's RPC returns every one of its 377 nominations, and the count of nominations whose entity belongs to a different project is zero — so the only rows the change can affect do not exist in real data, and the fixture's probe row is the only one it drops.

### Task 6 — the closing run

Disk before the run: `81Gi` available (well above the 5 GiB floor); `docker system df` — Images 16.11GB, Containers 16.66MB, Local Volumes 12.74GB, Build Cache 0B.

`tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/161-09-close --no-db-reset`, read from the artefacts:

```
exit                  0
observed_expected     155
observed_unexpected   0
observed_flaky        0
observed_skipped      0
observed_workers      6
observed_retries      0
observed_duration_ms  633766
preflight-successes   1
preflight-failures    0
db_reset              false
e2e_project_id        00000000-0000-0000-0000-0000000000e2
head                  b9cddbcfde9b15b821b0159c3d3e384182a85f3a  (= HEAD)
started/ended         2026-09-05T13:56:42Z / 2026-09-05T14:07:25Z
```

No `db-reset.log` exists in the run directory. A grep for "did not run" and "interrupted" over the run's stdout returns 0. The dirty files the wrapper recorded are the three pre-existing `.planning/` artefacts, not source.

`yarn test:unit` → exit 0 (25/25 turbo tasks; `@openvaa/frontend` 1630, `@openvaa/dev-seed` 664, `@openvaa/data` 244, and the rest). `yarn lint:check` → exit 0. Both read directly, never through a pipe.

## The four criteria, re-stated

| # | Criterion | Verdict now | Evidence |
|---|---|---|---|
| 1 | `PUBLIC_PROJECT_ID` exists, defaults, documented, no silent fallback | **ACHIEVED** (unchanged) | Verified in `161-VERIFICATION.md`; this plan additionally closed the todo that owned the retired constant, re-measuring `git grep DEFAULT_SEED_PROJECT_ID -- apps packages tests scripts` as empty |
| 2 | Every project-scoped query is parameterised, and a missing parameter is caught by a guard rather than a reviewer | **ACHIEVED** | The guard fails closed on an empty corpus (reproduction re-run, exit 1 where it was 0); it proves itself in the spelling `lint:check` calls; the three demonstrated evasions are each caught and each pinned; and `get_nominations`' entity joins now carry the project term, with a pgTAP assertion observed red first |
| 3 | E2E creates its own project; no `db:reset` precondition, proven by two green runs in a row | **ACHIEVED** (re-exercised) | `161-09-close` is a further green full-suite run with `db_reset=false` and no `db-reset.log`, taken on the database this plan's own tasks had been writing to — including the pgTAP transaction and an applied migration |
| 4 | E2E prerequisite documentation matches, and the retired grep is empty | **ACHIEVED** | Three documents corrected; the retirement half stays green; the new class check was proven red against the pre-edit text and against an injected reintroduction; and the mechanism half means a stale copy of the instructions now produces a named abort rather than an empty application |

**Criterion 2's remaining honest caveats**, carried and not claimed as closed: guard check 4 still tests `p_project_id` against the raw argument slice, so the token satisfies it from inside a comment (low severity — the SQL parameter has no DEFAULT, so a genuine omission fails loudly at PostgREST); and `utils/` remains outside both walkers, so a DB-touching helper added there would be outside the guard by construction.

## Carried forward to Phase 162

- **The RLS read-grant gap.** Re-measured at this HEAD: `apps/supabase/supabase/schema/302-rls.sql` defines **13** `anon_select_*` policies and **zero** of them reference `project_id`. That is why CR-01 is a tenant-attribution defect rather than a read amplification — the leaked entity row was already anon-readable directly. Phase 162's criteria 2 and 5 own read-grant scoping; it must not be absorbed here.
- **The write side of the same defect.** Nothing prevents the illegal row this plan's pgTAP fixture deliberately creates: `nominations` carries separate foreign keys to project and to entity with no composite constraint, and `validate_nomination` never reads `project_id`. A composite FK `(project_id, candidate_id)` or a project check inside the trigger belongs with the permissions work.
- **`identity-callback` validates presence, not shape**, unlike its two sibling consumers of the same variable.
- **Storage RLS does not validate the project segment of the object path.**

## Decisions Made

See `key-decisions` in the frontmatter. Two are worth restating because they departed from a proposal in the source documents:

- **DR-24 as executed.** `161-REVIEW.md` WR-02 proposed `"… --self-test && node …"` in `package.json`. Instead the self-test moved INTO `main()`, matching `assert-no-session-in-loads.mjs`, so the wired spelling is the self-proving one and `package.json` needed no change at all. A second command is a command a future edit can drop.
- **The gate's exemption rule.** The plan asked only that legitimate development uses of `yarn dev` survive. A pure co-occurrence rule would have forced an allowlist entry for the CORRECT instruction (`PUBLIC_PROJECT_ID=…00e2 yarn dev` beside `yarn test:e2e`), which would have made a correct instruction indistinguishable from a vouched-for wrong one. The rule instead exempts a window carrying `PUBLIC_PROJECT_ID=<E2E_PROJECT_ID>`, built from the harness's own constant, so the exemption is decidable against the thing it is an exemption from.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The check-6 binding matcher backtracked into a false positive on a legitimate multi-line call**

- **Found during:** Task 4
- **Issue:** `CLIENT_BINDING_RE` was written as `… #?supabase\b\s*(?![.[(])`. The consuming `\s*` is satisfiable by backtracking: the engine gives back the whitespace, finds a newline where it needed a non-dot, and reports a bare binding. It flagged the adapter's own `const { data: entityRow, error } = await this.supabase\n  .rpc('get_candidate_user_data', …)` at `supabaseDataWriter.ts:211`.
- **Fix:** Moved the whitespace inside the lookahead — `… #?supabase\b(?!\s*[.[(])` — which cannot be satisfied by giving anything back. The measurement and the reason are recorded above the constant.
- **Files modified:** `scripts/assert-project-scoped-queries.mjs`
- **Verification:** Real corpus back to 0 violations with 5 sites examined; the three fixture shapes still caught; `yarn lint:check` exit 0.
- **Committed in:** `2c96df525`

**2. [Rule 3 - Blocker] `resolveProjectId` is not where the plan's `read_first` said it was**

- **Found during:** Task 1
- **Issue:** The plan directed reading `constants.ts` for "`PUBLIC_PROJECT_ID` and `resolveProjectId`". `resolveProjectId` is module-private to `supabaseAdapter.ts`, takes an override parameter, and **throws** on an unset or non-canonical value. Calling it from `transformPageChunk` would convert a misconfiguration into a 500 on every page render, including pages that touch no data — precisely the outcome `constants.ts`'s own comment says the fail-fast was placed at the adapter to avoid.
- **Fix:** Published `constants.PUBLIC_PROJECT_ID.trim().toLowerCase()`, which is the same single source the resolver reads for the no-override case under the resolver's whole normalisation. An unusable value reaches the document as the empty string, which reads as a mismatch to the gate rather than as agreement, while the adapter still fails loudly at its own boundary. All three reasons are written into the hook.
- **Files modified:** `apps/frontend/src/hooks.server.ts`
- **Verification:** The served page published `00000000-0000-0000-0000-000000000001` under a default-scoped server and `…00e2` under the wrapper; the gate distinguished them.
- **Committed in:** `fa26b8801`

**3. [Rule 2 - Missing critical] Two further IDURA steps carried the same defect the plan named at Step E-4**

- **Found during:** Task 2
- **Issue:** The plan named Step E-4's `PUBLIC_PROJECT_ID` export. Step E-1's generated `/tmp/eflow10.env` and Step B-3's `export PUBLIC_PROJECT_ID=…0001` carry the identical conflict: the `identity-callback` Edge Function would create the candidate in the DEFAULT project while the spec's `new SupabaseAdminClient()` reads the E2E project, so the journey's own database proof would look in the wrong place. Leaving two of three corrected would have left the page self-contradicting, which is what the plan's "rather than leaving two conflicting instructions on the page" forbids.
- **Fix:** All three now name the project the harness reads.
- **Files modified:** `tests/IDURA-TEST-RUNBOOK.md`
- **Verification:** Not executed — see `coverage` D7. The opt-in `bank-auth` projects need a live Idura tenant or the mock issuer plus a separately served Edge Function.
- **Committed in:** `816e9ef0b`

**4. [Rule 1 - Bug] The existing partition assertion had to exclude the deliberately-illegal probe row**

- **Found during:** Task 5
- **Issue:** Seeding a cross-project nomination made the section-8 partition assertion's right-hand side count a row that, after the fix, neither project's call returns — correctly, since its entity belongs to project B and its nomination to project A. Left as it was, the assertion would have demanded the leak back.
- **Fix:** Excluded the probe id from the right-hand side, with the reasoning written above the predicate.
- **Files modified:** `apps/supabase/supabase/tests/database/07-rpc-security.test.sql`
- **Verification:** Test 14 red before the fix (`have: 5, want: 4` — the leak) and green after.
- **Committed in:** `c742489e1`

---

**Total deviations:** 4 auto-fixed (2 × Rule 1, 1 × Rule 2, 1 × Rule 3).
**Impact on plan:** No scope creep. Three are corrections discovered by the plan's own instruments; the fourth is a documentation reconciliation the plan's stated intent required.

## Issues Encountered

- **The freshness-probe todo could not be actioned as written, and was not.** Its prerequisite — two consecutive green no-reset runs with no probe warning — is not merely unmet but false: the closing run emits **25** probe warnings, and every one names a concurrently-seeding `e2e-perm-*` sibling prefix rather than residue from an aborted run. Promoting the polarity today would redden the suite deterministically with no defect behind it. The measurement and what would have to change first are recorded on the todo itself, which stays open.
- **The pgTAP suite runs against the live local database**, so migration 00007 had to be applied with `supabase migration up --local` rather than by a reset. That was deliberate: a reset would have destroyed the state the closing run's `--no-db-reset` posture exists to exercise.

## Known Stubs

None. No hardcoded empty values, placeholder text or unwired components were introduced.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 161's four criteria are all met on the evidence recorded above, and the phase closes. Phase 162 (Permissions & Auth Model Refactor) inherits the four carried items listed under "Carried forward", of which the 13 project-unscoped `anon_select_*` policies are the substantive one: until they are scoped, project isolation is enforced in application queries and in one RPC, not at the database security boundary.

---

_Phase: 161-project-scoping-project-id-parameterisation_
_Completed: 2026-09-05_

## Self-Check: PASSED

- `apps/supabase/supabase/migrations/00007_get_nominations_entity_project_scope.sql` — present on disk.
- All six task commits plus this SUMMARY's commit resolve in `git log`: `fa26b8801`, `816e9ef0b`, `4047f77df`, `2c96df525`, `c742489e1`, `b9cddbcfd`, `3f2b59892`.
