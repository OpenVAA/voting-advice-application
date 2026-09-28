---
phase: 165-review-stack-comment-remediation
plan: 23
subsystem: api
tags: [send-email, zod, localization, local-adapter, data-contracts, comment-hygiene]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-01 instruments (hygiene-changed-files.sh, record-hygiene-read.sh, assert-absent.sh, ledger-check.sh) and 165-19 (the wave-5 dependency)
provides:
  - SupabaseAdminWriter.sendEmail templates typed { subject, body }, matching the send-email Edge Function
  - SendEmailResultSchema with success and dry_run required
  - getLocalized returning strings only, with non-string tiers falling through
  - LocalServerDataProvider filtering nominations by electionRound, and categories/questions by electionId, constituencyId and electionRound with get_questions semantics
  - localServerDataProvider.test.ts, the first unit spec for the local server data provider
affects: [165-24, 165-36, local data adapter deployments, send-email callers]

actuals:
  tokens: 12000
  tasks: 3
  commits: 5
plan_head_before: 10fa86064d2bb819b4c93dd06fd511c2dd1a99cb
plan_head_after: 764c4b2437802e820115176639680bdc3b91bf7f

tech-stack:
  added: []
  patterns:
    - "A local appliesTo predicate carries the get_questions 'null or empty list applies to all' rule; filterData is left alone because an empty target list matches nothing there"
    - "A localization tier counts only when typeof value === 'string'"

key-files:
  created:
    - apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.test.ts
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-23.tsv
  modified:
    - packages/app-shared/src/data/schemas/sendEmailResult.schema.ts
    - packages/app-shared/src/data/schemas/sendEmailResult.schema.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts
    - packages/app-shared/src/data/getLocalized.ts
    - packages/app-shared/src/data/getLocalized.test.ts
    - apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.ts
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md

key-decisions:
  - "The local adapter's electionId filter on categories now keeps an empty electionIds list, as get_questions does; filterData dropped it before"
  - "A nomination with no electionRound counts as round 1, the data model default and the nominations.election_round column default"
  - "getLocalized docblock names the SQL counterpart's fallback order but states that this function is stricter: the SQL get_localized does not skip non-string values"

patterns-established:
  - "Local server provider specs stub read/exists on an instance and mock $lib/server/constants, so no filesystem or private env is needed"

requirements-completed: [165-SC2, 165-SC3, C-4080520102, C-4080507215, C-4080507169, C-4080515146, C-4080515180]

coverage:
  - id: D1
    description: "sendEmail sends { subject, body } templates and reports a response missing success as a failure; the schema requires success and dry_run on every branch"
    requirement: "C-4080520102"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/app-shared test:unit sendEmailResult (11/11)"
        status: pass
      - kind: unit
        ref: "yarn build --filter=@openvaa/app-shared && yarn workspace @openvaa/frontend test:unit supabaseAdminWriter (16/16)"
        status: pass
      - kind: other
        ref: "bash scripts/assert-absent.sh 'html: string' -- apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "getLocalized returns a tier only when it is a string; { en: 42 } and { en: null } yield null, { en: null, fi: 'x' } yields 'x'"
    requirement: "C-4080507169"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/app-shared test:unit getLocalized (15/15)"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit localizeRow (8/8)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The local server DataProvider filters nominations by electionRound and categories/questions by electionId, constituencyId and electionRound with get_questions semantics"
    requirement: "C-4080515146"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit localServerDataProvider (10/10)"
        status: pass
    human_judgment: false
  - id: D4
    description: "All eight shipped files are hygiene-clean with recorded reads; frontend check, both package lints and the project-scoped-query guard pass"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "bash scripts/hygiene-changed-files.sh --check-reads --files <the eight files> (exit 0, unread=0)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend check (0 errors, 0 warnings); eslint on apps/frontend/src and packages/app-shared/src (exit 0); node scripts/assert-project-scoped-queries.mjs (exit 0)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 23: Data-Contract Fixes Summary

**The `send-email` request and response contracts now match the Edge Function on every branch, `getLocalized` can no longer return a non-string, and the local server adapter filters nominations by round and questions by election, constituency and round with the same rules as `get_questions`.**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-09-27T22:12:23Z
- **Completed:** 2026-09-27T22:23:47Z
- **Tasks:** 3 of 3
- **Files modified:** 8 shipped files, plus the read log and the ledger

## Accomplishments

- `SupabaseAdminWriter.sendEmail` takes `templates: Record<string, { subject: string; body: string }>`. The old `{ subject, text, html }` shape failed the function's `tmpl.body` check on every request. The method has **no production caller**: `git grep -n "sendEmail" -- apps packages tests ':(exclude)*.test.ts'` finds only its own definition and docblock references. The `tests/` hits are `SupabaseAdminClient.sendEmail`, a different class. So no call site changed.
- `SendEmailResultSchema` now requires `success` and `dry_run`. `grep -n 'optional()'` on the schema file lists six members: `status`, `error`, `subject` and `body` on the recipient entry, plus `sent` and `failed`. Neither `success` nor `dry_run` is among them.
- `getLocalized` checks each tier with `typeof === 'string'`. The first-key fallback scans the keys in order for the first string. The docblock now cites `010-utility-functions.sql`.
- `LocalServerDataProvider.getNominationData` honours `electionRound`. `getQuestionData` applies all three filters to categories, and separately to questions, then keeps the `categoryId` join.
- All eight files pass the D-04 gate, and their reads are recorded. Every planning reference in both admin-writer files is gone (`T-157-*`, `D-DISC-4`, `C4`/`C5(b)`, `162-REVIEW WR-03`), along with the historical narrative ("used to", "the branch this replaced", "erroneously placed … on the parallel branch").

## Task Commits

1. **Task 1 (tracer): the send-email contract end to end** — `de777aeb7` (fix)
   - `9509f571c` (style): prettier on one pre-existing line of the admin writer spec, kept in its own commit
2. **Task 2: `getLocalized` returns strings only** — `987eb1f31` (fix)
3. **Task 3: local-adapter filter parity and the hygiene reads** — `aacde743d` (fix)
4. **Ledger rows** — `764c4b243` (chore)

**Plan metadata:** the SUMMARY commit that follows

## TDD evidence (RED runs)

| Task | RED command | RED result | GREEN result |
|---|---|---|---|
| 1 | `yarn workspace @openvaa/app-shared test:unit sendEmailResult` | 2 failed / 9 passed: `rejects a payload with no success`, `rejects a payload with no dry_run` (`expected true to be false`) | 11/11 |
| 1 | `yarn workspace @openvaa/frontend test:unit supabaseAdminWriter` | 1 failed / 15 passed: `reports a payload with no success as a failure` (`expected { type: 'success', sent: 1, … } to deeply equal { type: 'failure' }`) | 16/16 |
| 2 | `yarn workspace @openvaa/app-shared test:unit getLocalized` | 2 failed / 13 passed (`expected 42 to be null`, `expected 42 to be 'Hello'`) | 15/15 |
| 3 | `yarn workspace @openvaa/frontend test:unit localServerDataProvider` | 8 failed / 2 passed. The existing `electionId` filter dropped `catEmpty`, whose empty `electionIds` list `get_questions` keeps | 10/10 |

After Task 1 the tracer gate re-ran both of its `<verify>` commands. Both exited 0 (`end-of-phase` mode, automated-only verify), so the plan went on to Tasks 2 and 3.

## Verification (final runs; exit statuses read directly)

| Command | Exit | Result |
|---|---|---|
| `yarn workspace @openvaa/app-shared test:unit` | 0 | 10 files, 100 tests |
| `yarn workspace @openvaa/frontend test:unit` | 0 | 108 files, 1874 tests |
| `yarn workspace @openvaa/frontend check` | 0 | 2781 files, 0 errors, 0 warnings |
| root `eslint --flag v10_config_lookup_from_file src/` in `apps/frontend` | 0 | 0 errors; 1 warning, the pre-existing `candidateContext.svelte.test.ts` item already in deferred-items (165-06) |
| root `eslint --flag v10_config_lookup_from_file src/` in `packages/app-shared` | 0 | clean |
| `node scripts/assert-project-scoped-queries.mjs` | 0 | 0 violations |
| `bash scripts/hygiene-changed-files.sh --check-reads --files <8 files>` | 0 | `unread=0`, `VERDICT: CLEAN` |
| `bash scripts/assert-absent.sh '000-functions\.sql\|T-157' -- packages/app-shared/src/data/getLocalized.ts` | 0 | absent |
| `bash scripts/tip-proofs.sh` (it reads `supabaseAdminWriter.ts` under `LATER PLAN: 165-23`) | 0 | all PASS; `project_id: this.projectId` is intact |
| `bash scripts/ledger-check.sh` | 0 | 78 rows, PASSED |

`yarn workspace <pkg> lint` itself fails with "command not found: eslint", as the orchestrator notes predict. So the root binary was run with the same arguments.

## Review-comment dispositions

| Comment | Disposition | Commit | What changed |
|---|---|---|---|
| C-4080520102 | fix | `de777aeb7` | `sendEmail` sends `{ subject, body }` templates, the shape the function validates. The function renders `body` as both the text part and the escaped HTML part. |
| C-4080507215 | fix | `de777aeb7` | `success` and `dry_run` are required. A response without them is rejected, and `sendEmail` returns its failure arm. |
| C-4080507169 | fix | `987eb1f31` | String-only tiers, with a first-string-key fallback. Otherwise the result is `null`. |
| C-4080515146 | fix | `aacde743d` | The local provider filters nominations by `electionRound`; a missing round counts as 1. |
| C-4080515180 | fix | `aacde743d` | The local provider filters categories and questions by `electionId`, `constituencyId` and `electionRound`, each independently, where a missing or empty list applies to all. |

## Decisions Made

See `key-decisions`. The one with behavioural reach: on the local adapter, a category or question whose `electionIds` list is **empty** is now returned for any `electionId`. Before, `filterData` dropped it. `get_questions` and the data model both define an empty filter as "applies to all", so this brings the two adapters into agreement (the plan's parity goal).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Two docblocks stated things that are not true**
- **Found during:** Tasks 1 and 3
- **Issue:** The recipient-schema docblock said "All four push sites", but the function builds a `RecipientResult` at three sites. The `warnIfUnsupported` TODO said "when locale and includeUnconfirmed are supported", but `locale` is already honoured, and the function checks only `includeUnconfirmed`.
- **Fix:** Rewrote both to say what is true now.
- **Commits:** `de777aeb7`, `aacde743d`

**2. [Rule 3 - Blocking] The new spec could not import the provider without mocking `$lib/server/constants`**
- **Found during:** Task 3 RED
- **Issue:** `localPaths.ts` → `$lib/server/constants` → `$env/dynamic/private`, and vitest has no alias for that module (`Failed to resolve import`).
- **Fix:** Mocked `$lib/server/constants` in the spec, following `authorize-endpoint.test.ts`. `read` and `exists` are stubbed, so the paths are never used.
- **Commit:** `aacde743d`

**3. [Rule 1 - Bug] The `getLocalized` docblock would have claimed parity it does not have**
- **Found during:** Task 2
- **Issue:** The SQL `get_localized` returns `p_val ->> key` for any value type. It does not skip non-strings.
- **Fix:** The docblock says the TypeScript function follows the SQL fallback order but is stricter.
- **Commit:** `987eb1f31`

**4. [Formatting] One pre-existing prettier difference in `supabaseAdminWriter.test.ts`**
- An escaped single quote, which prettier wants double-quoted. Per the orchestrator notes it went into its own `style` commit, `9509f571c`, and was kept out of the Task 1 fix.

**Not created:** `scripts/hygiene-allow/165-23.tsv`, which the plan lists in `files_modified`. No finding needed an allowlist entry: the gate is clean with no allowed items, and the two `TODO` notes are informational (`residue todo-class`, not counted). An empty allowlist file would record nothing.

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking) plus 1 formatting split. **Impact:** none on scope; each change keeps a comment or the test harness truthful.

## Issues Encountered

- zsh does not word-split an unquoted `$F` list, so the first lint and gate call saw a single path argument. From then on, lint, gate and commit steps ran through bash helper scripts with arrays, and commits staged explicit paths only.
- eslint `func-style` rejected an arrow `const inScope = …` inside the filter closure, so it became a function declaration.

## Threat Flags

None. The plan's register covers every surface touched: T-165-36 (required discriminators), T-165-37 (non-string tiers degrade to `null`) and T-165-38 (scoped local loads). No new endpoint, auth path or file access was added.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- The phase-wide gate plans (165-24 / 165-36) can include these eight files in their per-changed-file sweep; each one's current blob has a recorded read.
- No new deferred item. The only lint warning seen is the pre-existing `candidateContext.svelte.test.ts` one, already logged.

---
*Phase: 165-review-stack-comment-remediation*
*Completed: 2026-09-27*

## Self-Check: PASSED

- Created files exist: `localServerDataProvider.test.ts`, `hygiene-reads/165-23.tsv`, this SUMMARY.
- Commits `de777aeb7`, `9509f571c`, `987eb1f31`, `aacde743d` and `764c4b243` exist.
- `git status --short` lists only the maintainer's `MainContent.svelte` edit and `.planning/milestone.lock`, neither staged.
