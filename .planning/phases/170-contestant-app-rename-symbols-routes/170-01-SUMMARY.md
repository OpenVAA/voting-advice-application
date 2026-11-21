---
phase: 170-contestant-app-rename-symbols-routes
plan: 01
subsystem: frontend
tags: [rename, codemod, sveltekit, i18n, paraglide, settings, lint-gate, e2e]

requires: []
provides:
  - "Every app-level symbol of D-02, D-03, D-04, D-05, D-07 and D-08 under its contestant name, with no URL changed"
  - "rename.mjs and rename.map.mjs: the ordered mapping table for all four plans and the codemod that applies it"
  - "scripts/assert-no-candidate-app-names.mjs: the D-18 search gate in report mode, with a fixture self-test, not yet wired into lint:check"
  - "170-gates.sh, 170-e2e.sh, 170-verdict.mjs, catalogue-identity.mjs: the per-plan gate set, one E2E run, the verdicts and the catalogue identity check"
  - "The recorded baseline every later run of the phase is compared against: gate set 170-01-baseline and E2E 171/171/0"
affects: [170-02, 170-03, 170-04, 171, 173, 174]

actuals:
  tokens: 187159
  tasks: 4
  commits: 8
plan_head_before: 990f0d662aee21b6d162949d6872cd86c389372c
plan_head_after: 1cde6bfec195dbb2248fa7b20d65f6edb3bb2cc6

tech-stack:
  added: []
  patterns:
    - "One ordered mapping table drives content rewrites and the move list alike; a pure git mv commit precedes the content commit, and formatter output is a third commit"
    - "A text gate proves itself on a fixture with POSITIVE and NEGATIVE blocks and masks its two exempt names instead of skipping paths"
    - "Gate and E2E runs start in the background with an exit marker; verdicts are read from evidence files and committed trees, never from a pipe"

key-files:
  created:
    - .planning/phases/170-contestant-app-rename-symbols-routes/rename.map.mjs
    - .planning/phases/170-contestant-app-rename-symbols-routes/rename.mjs
    - .planning/phases/170-contestant-app-rename-symbols-routes/catalogue-identity.mjs
    - .planning/phases/170-contestant-app-rename-symbols-routes/170-gates.sh
    - .planning/phases/170-contestant-app-rename-symbols-routes/170-e2e.sh
    - .planning/phases/170-contestant-app-rename-symbols-routes/170-verdict.mjs
    - .planning/phases/170-contestant-app-rename-symbols-routes/170-EVIDENCE.md
    - .planning/phases/170-contestant-app-rename-symbols-routes/evidence/base-rev.txt
    - .planning/phases/170-contestant-app-rename-symbols-routes/evidence/skill-links-baseline.txt
    - scripts/assert-no-candidate-app-names.mjs
    - scripts/fixtures/assert-no-candidate-app-names.input.ts
    - scripts/fixtures/assert-no-candidate-app-names.expected.ts.violations
  modified:
    - apps/frontend/src/lib/contestant/ (moved from lib/candidate/)
    - apps/frontend/src/lib/contexts/contestant/ (moved from lib/contexts/candidate/)
    - apps/frontend/src/lib/dynamic-components/navigation/contestant/ (moved from navigation/candidate/)
    - apps/frontend/messages/<locale>/contestantApp.<page>.json (119 files, moved)
    - apps/frontend/src/lib/routes/route.ts
    - apps/frontend/src/lib/routes/appGates.ts
    - apps/frontend/src/lib/contexts/app/appContext.type.ts
    - apps/frontend/svelte.config.js
    - apps/frontend/vitest.config.ts
    - apps/frontend/project.inlang/settings.json
    - apps/frontend/src/lib/types/generated/translationKey.ts
    - packages/app-shared/src/data/schemas/storedSettings.schema.ts
    - packages/app-shared/src/data/schemas/storedCustomization.schema.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-disable-contestant-app.ts
    - scripts/assert-i18n-catalog-namespaces.mjs
    - apps/docs/scripts/docs-scripts.config.ts
    - apps/docs/scripts/generate-component-docs.ts
    - CLAUDE.md
    - .claude/skills/components/SKILL.md

key-decisions:
  - "Two rows of the mapping table were tightened against what the plan states, because each matched one name that says which entity type: P3-09 (a publishers'-guide page) and P2-05 (a regex literal in an Edge Function test)"
  - "The docs-links gate row sets aside github-path findings in the two generated docs subtrees for plans 1 to 3, because the plan forbids regenerating those pages before plan 4 and the validator reads them"
  - "The drivers pin Node v24.21.0 when it is installed instead of taking the newest version at or above 24.15, which on this host is v25.2.1"
  - "The catalogue identity check is strict about keys, so its controls ran on a scratch copy with the key mapping applied"

patterns-established:
  - "Pure move, then content, then formatter output: three commits per plan of the rename"
  - "A row that overreaches is tightened in the map and in the gate together, never repaired in the tree"

requirements-completed: [NAME-01]

coverage:
  - id: D1
    description: "The search gate exists with --report, --only and --self-test, reports every app-level form of its fixture and no entity-typed form, holds exactly two exemption lines, and is not a link of lint:check"
    requirement: NAME-01
    verification:
      - kind: other
        ref: "node scripts/assert-no-candidate-app-names.mjs --self-test (exit 0, 81 findings on the fixture, 81 expected)"
        status: pass
      - kind: other
        ref: "node scripts/assert-no-candidate-app-names.mjs on the base tree (exit 1, 3477 findings; symbols 1744)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The mapping table for all four plans is one file; the codemod is dry-run by default and a second run after the apply rewrites nothing"
    requirement: NAME-01
    verification:
      - kind: other
        ref: "node rename.mjs --check --plan 1 (exit 0; 0 rewrites, 0 moves, 0 collisions pending); gate row idempotent in 170-01-close"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every plan-1 symbol carries its contestant name: no finding of group symbols remains outside the two generated docs subtrees, and the tree type-checks, lints, unit-tests and builds"
    requirement: NAME-01
    verification:
      - kind: other
        ref: "node 170-verdict.mjs gates 170-01-close (exit 0; 14 rows at status 0, including residue)"
        status: pass
      - kind: unit
        ref: "yarn test:unit (exit 0; frontend 2035 tests in 129 files; routes: 162 tests in 8 files)"
        status: pass
    human_judgment: false
  - id: D4
    description: "No message value changed in any of the seven locales"
    requirement: NAME-01
    verification:
      - kind: other
        ref: "node catalogue-identity.mjs --base 990f0d662 (exit 0; 595 keys compared per locale); negative control exit 1 naming the key"
        status: pass
    human_judgment: false
  - id: D5
    description: "No URL changed: CONTESTANT still holds /candidate, src/routes/candidate/ exists, the two auth-endpoint keys keep their names, config.toml is byte-identical to the base revision"
    requirement: NAME-01
    verification:
      - kind: other
        ref: "plan verification item 6 and the inverse-mapping comparison of the two changed files under routes/api (170-EVIDENCE.md section 2.4)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The renamed tree is green on one full E2E run with the baseline's test counts"
    requirement: NAME-01
    verification:
      - kind: e2e
        ref: "node 170-verdict.mjs e2e 170-01-close --same-total-as 170-01-baseline (exit 0; 171 passed of 171, 0 failed, 0 flaky, 0 did-not-run)"
        status: pass
    human_judgment: false
  - id: D7
    description: "get_candidate_user_data and invite-candidate occur exactly as often, in exactly as many files, as at the base revision"
    requirement: NAME-01
    verification:
      - kind: other
        ref: "node 170-verdict.mjs exemptions (exit 0; 51 occ / 15 files and 73 occ / 32 files / 10 paths at both revisions)"
        status: pass
    human_judgment: false
  - id: D8
    description: "No name that says which entity type was renamed, and no prose rule ran over the message catalogues (PROH-170-01, PROH-170-02)"
    requirement: NAME-01
    verification: []
    human_judgment: true
    rationale: "The plan marks both prohibitions as verified by judgment. The supporting instruments are green (fixture negatives, exemption counts, catalogue identity, type checks), but where the app/entity line runs is a reading of the mapping table, which is the artefact to review."

duration: 40min
completed: 2026-10-05
status: complete
---

# Phase 170 Plan 01: Contestant App Rename — Symbols Summary

**The candidate app's identifiers, alias, contexts, route-constant names, stored settings keys and message namespaces are renamed to contestant across 465 source files by one ordered mapping table, with no URL and no message value changed, and the renamed tree is green on fourteen gates and a 171-test E2E run identical in counts to the baseline.**

## Performance

- **Duration:** 40 min
- **Started:** 2026-10-05T18:44:13Z
- **Completed:** 2026-10-05T19:24:50Z
- **Tasks:** 4 of 4
- **Files modified:** 476 (465 outside `.planning/`)
- **Base revision:** `990f0d662aee21b6d162949d6872cd86c389372c` (pinned in `evidence/base-rev.txt`)

## Accomplishments

- Built the phase's tooling: the codemod and its mapping table for all four plans, the search gate in report mode with a fixture that proves both directions, the catalogue identity check with a positive and a negative control, and the gate, E2E and verdict drivers.
- Recorded a green baseline on the untouched tree: eleven gate rows at 0 and one full E2E run at 171 passed, 0 failed, 0 flaky, 0 did-not-run.
- Renamed every plan-1 name in three source commits — a pure move of 158 paths at 100% similarity, the content, and the formatter's output — leaving every URL where it was.
- Closed green on the committed tree: fourteen gate rows at 0, the catalogue identical in all seven locales (595 keys each), both exempt names untouched, and an E2E run with the baseline's counts.

## Task Commits

1. **Task 1: Build the tooling**
   - `884291ea6` `chore[lint](170-01): add the app-name search gate, unwired` — the gate and its two fixture files, nothing else.
   - `fa235d53a` `docs(170-01): add the rename codemod, its mapping table, the drivers and the baseline evidence` — the phase-directory tooling.
2. **Task 2: Record the baseline**
   - `25b21ad6a` `docs(170-01): record the baseline gate set and E2E run on the untouched tree`.
3. **Task 3: Move and rename, in three commits**
   - `023cc9c23` `refactor[frontend](170-01): move the app's lib, context, navigation and catalogue files to contestant names` — the pure move: 158 paths, every row `R100`, 0 insertions and 0 deletions. Does not build.
   - `c522c0e3f` `refactor[frontend](170-01): rename the candidate app's symbols, settings keys and message namespaces to contestant` — the content: 304 files, 1445 insertions and 1445 deletions. 1446 codemod rewrites in 301 files, the hand edits listed below, the regenerated `translationKey.ts`.
   - `7c5980b2b` `docs(170-01): keep the hygiene-codemod fixture twins identical; scope the docs-links gate row` — the two `.planning/phases/151` fixture twins and the gate-driver change.
   - `81ef5d4e6` `style(170-01): import order and line width after the rename` — formatter output only, 20 files.
4. **Task 4: Close plan 1**
   - `1cde6bfec` `docs(170-01): record the plan-1 close — gate set, residue, exemptions, identity and E2E`.

## Gate and E2E Results

| What | Label / command | Exit | Result |
|---|---|---|---|
| Baseline gate set | `170-gates.sh 170-01-baseline --plan 0` | 0 | 11 rows, all 0 |
| Baseline E2E | `170-e2e.sh 170-01-baseline` | 0 | 171 total, 171 passed, 0 failed, 0 flaky, 0 skipped, 0 did-not-run |
| Closing gate set | `170-gates.sh 170-01-close --plan 1` | 0 | 14 rows, all 0 (build, typecheck, lint, format, check-frontend, check-docs, unit, build-frontend, build-docs, docs-links, skill-links, idempotent, residue, exemptions) |
| Closing E2E | `170-e2e.sh 170-01-close` | 0 | 171 total, 171 passed, 0 failed, 0 flaky, 0 skipped, 0 did-not-run |
| `170-verdict.mjs gates 170-01-close` | | 0 | not stale |
| `170-verdict.mjs e2e 170-01-close --same-total-as 170-01-baseline` | | 0 | same total, passed and skipped |
| `170-verdict.mjs exemptions` | | 0 | 51 / 15 and 73 / 32 at both revisions |
| `catalogue-identity.mjs --base 990f0d662…` | | 0 | 595 keys compared in each of seven locales |
| `rename.mjs --check --plan 1` | | 0 | nothing pending |
| `assert-no-candidate-app-names.mjs --self-test` | | 0 | 81 of 81 |

Run directories: `tests/e2e-runs/170-gates/170-01-baseline`, `tests/e2e-runs/170-gates/170-01-close`, `tests/e2e-runs/170-e2e/170-01-baseline`, `tests/e2e-runs/170-e2e/170-01-close`. There was no red run. The full record is `170-EVIDENCE.md` sections 1 and 2.

## Residue Edits That Were Not a Map Row

- **`AppType` (ruling 1).** `'candidate'` → `'contestant'` at six sites: the union in `appContext.type.ts`, `appType.set(...)` in `routes/candidate/+layout.svelte`, the comparisons in `Banner.svelte`, `EntityOpinions.svelte` and `QuestionHeading.svelte`, and one fixture in `hoverShadedRule.test.ts`. `UserRole` was left alone.
- **Docs generator (ruling 10).** In `docs-scripts.config.ts` the `join(…)` path segment and the entry name; in `generate-component-docs.ts` both `categorySubdir` assignments. The pages were not regenerated.
- **Fixture twins (ruling 16).** The same one-word substitution in the two hygiene-codemod fixtures under `.planning/phases/151-…/scripts/fixtures/`; `diff -r` against the skill's `sources/` is empty and the codemod's self-test exits 0.

No comment needed a correction of fact in this plan. The comment above the two auth keys in `route.ts` is still true (their paths still carry the old segment) and is plan 170-02's to rewrite.

## Stored State the Rename Leaves Behind

- **Stale stored settings keys (D-07).** No stored row is migrated. A row that still holds `access.candidateApp`, `notifications.candidateApp`, the `candidateApp` root, `candidateAppFAQ` or `candPoster` is read as if the key were absent — so an app closed with `access.candidateApp: false` reads as open. Nothing is deployed, and the E2E project heals itself because every template seed replaces the whole settings JSONB. A developer who needs a clean local default project runs `yarn db:reset`.
- **Browser storage (D-03, ruling 23).** Four keys are renamed, not two: `'contestantContext-preselectedElectionIds'`, `'contestantContext-preselectedConstituencyIds'`, `'contestantContext-isPreregistered'` and `'ContestantContext-contestantUserDataStore-editedAnswers'`. A value under an old key is orphaned in place.

## Decisions Made

Nothing in `<rulings>` was decided differently. Four calls the plan does not make:

1. **P3-09 and P2-05 tightened in the map** (see deviations 1 and 2).
2. **The docs-links row sets stale generated pages aside for plans 1 to 3** (deviation 3).
3. **Driver Node selection** (deviation 5).
4. **Catalogue identity controls on a scratch copy with the key mapping applied.** The check is strict: a key must exist under its mapped name. On the untouched tree it therefore exits 1 for the 174 keys per locale not yet renamed, which would have made a one-value control exit 1 for the wrong reason. The controls ran on a scratch copy in which only the key mapping had been applied: exit 0 unchanged, exit 1 naming the key after one value was edited.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Map row P3-09 matched a path that names the entity**
- **Found during:** Task 1, reading the gate's report against the "must not move" list.
- **Issue:** `candidate-(answers|…)\b` matches `moderation-of-candidate-answers`, a publishers'-guide page — one path and its route string in `apps/docs/src/lib/navigation.config.ts`. The research counted zero entity matches for this pattern. As stated, plan 170-03 would have moved that page and rewritten its route.
- **Fix:** the row and the gate's pattern gained the look-behind `(?<![\w-])`. It was the only match preceded by a word character or a hyphen. A fixture negative covers it.
- **Files modified:** `rename.map.mjs`, `scripts/assert-no-candidate-app-names.mjs`, the gate's fixture.
- **Committed in:** `884291ea6`, `fa235d53a`.

**2. [Rule 1 - Bug] Map row P2-05 matched a regex literal that names the entity**
- **Found during:** Task 1, same review.
- **Issue:** `/candidate(?![\w.-])` matches `toMatch(/candidate lookup failed/i)` in `apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts`. As stated, plan 170-02 would have rewritten the expectation and broken that test.
- **Fix:** the look-ahead became `(?![\w.-]| lookup failed)` in the row and in the gate. Of the 21 matches not followed by a URL delimiter it was the only one that is not a URL. A fixture negative covers it.
- **Files modified:** the same three.
- **Committed in:** `884291ea6`, `fa235d53a`.

**3. [Rule 3 - Blocking] The docs-links gate row cannot be 0 on plan 1's tree as the plan defines it**
- **Found during:** Task 3, before the content commit.
- **Issue:** Ruling 10 says the generated docs pages are stale between plans 1 and 4 and that "no per-plan gate reads them". Measured: `yarn workspace @openvaa/docs validate:links --check` exits 1 with 15 `github-path` findings, every one in a page under `frontend/components/generated/` whose source link names a file under the moved `lib/candidate/`. The plan also says not to regenerate the pages here, so the row "every row 0" could not hold.
- **Fix:** `170-gates.sh` treats the row as it already treats `residue`: for `--plan` 1, 2 and 3 a `github-path` finding located in a file under either generated subtree is set aside and counted; any other finding fails the row; with `--plan` 0 or 4 the validator's own status is the row's status. Exercised in both directions on captured output (as measured: 0; one planted finding outside the subtrees: 1). The raw validator output and its exit status are in the row's log.
- **Not done:** regenerating the pages in plan 1, which the plan forbids and which would recur in plan 2 for the generated route map.
- **Files modified:** `170-gates.sh`.
- **Committed in:** `7c5980b2b`.
- **This is a change to the instrument and is put to the operator for review** (`170-EVIDENCE.md` section 7). Until plan 170-04 regenerates the pages, `validate:links --check` run by hand exits 1 on this branch.

**4. [Rule 3 - Blocking] One acceptance criterion of Task 3 cannot hold as written**
- **Issue:** "`git diff <base> HEAD --stat -- apps/frontend/src/routes/api apps/supabase/supabase/config.toml` shows no change". Two files under `routes/api` (`candidate/auth/callback/+server.ts`, `oidc/callback/+server.ts`) use plan-1 route keys and the alias; rows P1-01 and P1-14 must rewrite them or the tree does not type-check.
- **What was measured instead:** two `M` rows and no add, delete or rename under `routes/api`; 17 tracked files there at both revisions; `config.toml` with 0 diff lines; and both changed files, with the plan-1 names mapped back and whitespace removed, identical to the base revision. No path moved and no URL string changed. No code was bent to the criterion.

**5. [Rule 3 - Blocking] The drivers do not take "the newest Node at or above 24.15"**
- **Issue:** on this host that is v25.2.1, a different major from every other command of the phase.
- **Fix:** `170-gates.sh` and `170-e2e.sh` put v24.21.0 first when it is installed, as the plan's environment preamble prescribes, and fall back to the newest version at or above 24.15 otherwise.

**6. [Scope boundary] One unrelated autofix was kept out of the formatter commit**
- `yarn lint:fix` removed an unused `eslint-disable-next-line` directive in `tests/tests/support/mockOidcIssuerEntry.ts`, a file the rename did not touch. That change was reverted before the commit, so the formatter commit holds only files the rename touched. Any later `yarn lint:fix` will propose it again.

---

**Total deviations:** 6 (2 map rows tightened, 3 blocking issues resolved without changing application code, 1 scope exclusion).
**Impact on plan:** deviations 1 and 2 prevent two wrong rewrites in plans 170-02 and 170-03. Deviation 3 changes what one gate row means for plans 1 to 3 and needs the operator's eye. None changes application behaviour.

## Issues Encountered

None beyond the deviations above. No gate row and no E2E test was red at any point.

## Known Stubs

None.

## Next Plan Readiness — What 170-02 Must Know

- **Labels to compare against:** gate set `170-01-baseline`, E2E `170-01-baseline` (171 / 171 / 0 skipped). The wrapper's port is 5273.
- **`rename.mjs --moves` and the logout handler.** The pair `routes/api/candidate/auth/logout/+server.ts` → `routes/api/auth/logout/+server.ts` is reported on stderr as `# collision` and is not in the move list. `--moves --apply` exits **1** while that collision exists and names the old directory that still holds the file; `--check --plan 2` counts it as pending until the merge commit removes the old handler. Both are intended.
- **P2-05 is not the row the plan prints**: its look-ahead also spares ` lookup failed`. Read it from `rename.map.mjs`.
- **docs-links** will again report set-aside findings in plan 2, now also under `frontend/routing/generated/` once the route tree moves. The count carried from this plan is 15; the residue carried is 42 lines of group `symbols`, all under the generated docs subtrees.
- **Hand edits the gate's `urls` group will ask for:** the `join('candidate', …)` anchor in `scripts/assert-no-session-in-loads.mjs`, and the sibling-prefix probes in `appGates.test.ts` (`'/candidate-portal'` is a gate pattern; `'/candidates'` is not and must be changed by hand).
- **Four tree-diagram citations** in `.claude/skills/spike-findings-voting-advice-application-gsd/references/migration-inventory-and-order.md` read `candidate/contestantContext…` until row P2-06 rewrites the directory half.
- **The comment above the two auth keys in `route.ts`** still describes the app-named paths; D-06 rewrites it with the keys.
- **`yarn lint:fix`** proposes the unrelated change of deviation 6 every time; keep it out of the formatter commit.
- **Stack state:** the local Supabase stack was not restarted or reset in this plan; nothing listens on 5173 or 5273.

## Self-Check: PASSED

- Every file under `key-files.created` exists, as do the moved directories, `contestantApp.common.json`, the renamed dev-seed template and both closing run directories.
- All eight commits (`884291ea6`, `fa235d53a`, `25b21ad6a`, `023cc9c23`, `c522c0e3f`, `7c5980b2b`, `81ef5d4e6`, `1cde6bfec`) are ancestors of HEAD.
- `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` and root `package.json` are unchanged since the base revision; `CAND-APP-PLAN.md` is untracked and untouched.
