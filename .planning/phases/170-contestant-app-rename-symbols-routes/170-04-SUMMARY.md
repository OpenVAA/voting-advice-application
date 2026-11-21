---
phase: 170-contestant-app-rename-symbols-routes
plan: 04
subsystem: docs
tags: [rename, docs, prose, lint-gate, sql-comments, schema-mirror, bank-auth, e2e, phase-close]

requires:
  - phase: 170-01
    provides: "The mapping table and codemod, the search gate in report mode, the gate, E2E and verdict drivers, the catalogue identity check and the recorded baseline (171 / 171 / 0 skipped)"
  - phase: 170-02
    provides: "The app served under /contestant with the neutral auth endpoints, the allowlist probe and the bank-auth driver"
  - phase: 170-03
    provides: "Every app-level test name in its contestant form; the two preview baselines proven to be the same blobs"
provides:
  - "The docs section at /developers-guide/contestant-app, by a pure move, with the navigation, the redirect stubs, the generated component pages and the route map following"
  - "The prose phrase and the hyphenated compound naming the contestant app in comments, TSDoc, developer docs, CLAUDE.md, .claude/skills and SQL comments"
  - "assert:no-candidate-app-names as link 8 of yarn lint:check, at 0 findings, with exactly two declared exemptions and a recorded negative control"
  - "The phase's closing proof on one tree: 16 gate rows, one full E2E run at the baseline's counts, three consecutive runs of each bank-auth project"
affects: [171, 173, 174, 175, 177, 178, 179]

actuals:
  tokens: 65539
  tasks: 5
  commits: 6
plan_head_before: 55fe8a84462314ac6c0a8e1b600cff514fa5573c
plan_head_after: 27b8f9976da31caa59db0f213f53bcf67924e2b3

tech-stack:
  added: []
  patterns:
    - "A generator that ends with a formatter does not get to mix reflow into a content commit: the hand-written files it reformatted are set back to the codemod's output first, and the reflow lands in the formatter commit"
    - "A text gate's negative control is recorded in four steps: clean tree, a planted name through the gate and through the chain that runs it, a planted name beside an exempt name, and the restore"
    - "A cheap gate set is run ahead of the expensive runs that must describe the same tree; the closing verdict is still read from the run made after them"

key-files:
  created:
    - apps/docs/src/routes/(content)/developers-guide/contestant-app/ (moved from developers-guide/candidate-app/, five pages)
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/ (regenerated, seven pages)
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/contestant/ContestantNav/+page.md (regenerated)
    - .planning/phases/170-contestant-app-rename-symbols-routes/evidence/plan-04-start-rev.txt
  modified:
    - package.json
    - CLAUDE.md
    - ROADMAP.md
    - apps/docs/src/lib/navigation.config.ts
    - apps/docs/src/routes/(content)/developers-guide/candidate-user-management/ (four redirect targets)
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md
    - apps/docs/src/routes/(content)/developers-guide/frontend/routing/generated/+page.md
    - apps/supabase/supabase/schema/106-app-settings.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/seed.sql
    - apps/supabase/supabase/tests/database/19-entity-immutability.test.sql
    - apps/supabase/supabase/tests/database/22-content-policies.test.sql
    - apps/supabase/README.md
    - .claude/skills/components/SKILL.md
    - .claude/skills/database/SKILL.md
    - .claude/skills/BOUNDARIES.md
    - tests/README.md
    - .planning/phases/170-contestant-app-rename-symbols-routes/170-EVIDENCE.md
    - .planning/phases/170-contestant-app-rename-symbols-routes/deferred-items.md

key-decisions:
  - "The residue pass over the gate's output found nothing after the prose rows were applied, so no map row, no gate anchor and no fixture was changed in this plan"
  - "A gate set was run on the final head before the bank-auth runs as well as after them; the closing verdict is read from the later one"
  - "Prose forms that name the app without the word app (candidate context, candidate settings-perm chain) were left alone and logged, because neither the mapping table nor the gate names them"
  - "String literals that hold the prose phrase (log prefixes, test titles, assertion messages) were rewritten with it, although ruling 19 says this plan changes no executable token"

patterns-established:
  - "The search gate holds every later phase to the new names through lint:check; a phase that removes an exempt name also removes its line from the gate's exemption list"

requirements-completed: [NAME-01, NAME-02]

coverage:
  - id: D1
    description: "The SQL comments the prose rows touched are mirrored byte for byte into the generated migration, the schema is applied to the local database, the generated types are unchanged, and the SQL lint and the pgTAP suite pass"
    requirement: NAME-01
    verification:
      - kind: other
        ref: "node scripts/assert-schema-migration-parity.mjs (exit 0); git status --porcelain packages/supabase-types after yarn db:reset and yarn db:types (prints nothing)"
        status: pass
      - kind: integration
        ref: "gate rows pgtap and sql-lint in 170-04-close (status 0; pgTAP 36 files, Result: PASS; db:lint:sql 0 errors)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The docs section lives at /developers-guide/contestant-app by a pure move, with no stub at the old section URL; the navigation and the redirect stubs point at it; the generated component pages and the route map are regenerated; link validation finds nothing with nothing set aside"
    requirement: NAME-02
    verification:
      - kind: other
        ref: "git show -M100% --name-status --format= fc309c010 | awk '$1 != \"R100\"' (prints nothing; 5 files, 0 insertions, 0 deletions)"
        status: pass
      - kind: other
        ref: "gate row docs-links in 170-04-close (validate:links --check exit 0, Total findings: 0, strict); gate rows check-docs and build-docs (status 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The docs describe the auth endpoints at /api/auth/callback and /api/auth/logout, including the deployment page's instruction for the redirect allowlist"
    requirement: NAME-02
    verification:
      - kind: other
        ref: "content checks of 170-EVIDENCE.md section 5.3 (deployment page: allow <frontend origin>/api/auth/callback; git grep -E 'api/candidate' -- apps/docs prints nothing)"
        status: pass
      - kind: other
        ref: "bash 170-allowlist-probe.sh after (exit 0; the running auth service admits the two neutral callback URLs and no candidate URL)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The phrase naming the app reads contestant in comments, TSDoc, developer docs, CLAUDE.md and .claude/skills, each form with its own casing; no message catalogue value, no publishers'-guide prose and no quoted research span changed"
    requirement: NAME-01
    verification:
      - kind: other
        ref: "gate row residue in 170-04-close (groups symbols,urls,tests,prose: 0 findings remain, 0 set aside)"
        status: pass
      - kind: other
        ref: "node catalogue-identity.mjs --base 990f0d662 (exit 0; 595 keys compared in each of seven locales); yarn workspace @openvaa/docs check:research-quotes --base 990f0d662 (exit 0; 22 spans identical)"
        status: pass
      - kind: other
        ref: "git diff 990f0d662 HEAD -- 'apps/docs/src/routes/(content)/publishers-guide' (four changed lines: three settings keys and one link)"
        status: pass
    human_judgment: false
  - id: D5
    description: "assert:no-candidate-app-names is a link of yarn lint:check, exits 0 on the tree, declares exactly two exemptions, and a planted old name makes it exit 1, also inside the exempt function's own directory"
    requirement: NAME-01
    verification:
      - kind: other
        ref: "node scripts/assert-no-candidate-app-names.mjs (exit 0, 0 findings) and --self-test (exit 0, 81 of 81)"
        status: pass
      - kind: other
        ref: "negative control, 170-EVIDENCE.md section 5.4: gate exit 0 / 1 / 1 / 0; yarn lint:check exit 1 with the planted name (marker tests/e2e-runs/170-gates/170-04-negctl-lint.exit)"
        status: pass
      - kind: other
        ref: "gate row lint in 170-04-close (yarn lint:check exit 0 with the gate in the chain)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The closing run is green on one tree: 16 gate rows, one full E2E run with the baseline's counts, and three consecutive runs of each opt-in bank-auth project"
    requirement: NAME-02
    verification:
      - kind: other
        ref: "node 170-verdict.mjs gates 170-04-close (exit 0; 16 rows at status 0, not stale)"
        status: pass
      - kind: e2e
        ref: "node 170-verdict.mjs e2e 170-04-close --same-total-as 170-01-baseline with the five --renamed-project pairs (exit 0; 171 passed of 171, 0 failed, 0 flaky, 0 did-not-run)"
        status: pass
      - kind: e2e
        ref: "node 170-verdict.mjs e2e 170-04-bankauth-{1,2,3} --expect-project bank-auth and 170-04-bankauth-journey-{1,2,3} --expect-project bank-auth-journey (six times exit 0; 8 of 8 and 131 of 131)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Nothing else changed across the phase: every locale catalogue is value-identical to the base revision through the key mapping and the two visual baselines are the same blobs; the one behaviour change is the logout merge of plan 170-02"
    requirement: NAME-01
    verification:
      - kind: other
        ref: "node catalogue-identity.mjs --base 990f0d662 (exit 0); node 170-verdict.mjs baselines (exit 0; blobs 402f4bf8d and 887818864 unchanged); node 170-verdict.mjs exemptions (exit 0)"
        status: pass
    human_judgment: false
  - id: D8
    description: "The search gate was not made green by an exemption, a path skip, a mask or a loosened pattern, and no publishers'-guide naming or message value was rewritten (PROH-170-07, PROH-170-08)"
    requirement: NAME-01
    verification: []
    human_judgment: true
    rationale: "The plan marks both prohibitions as verified by judgment. The supporting facts are measured: the gate's source and fixtures are byte-identical to the plan's start revision, the exemption list holds two lines, and the publishers'-guide diff is three keys and one link. One heading in the docs' About section did change (Candidate application to Contestant application), which the operator may read as user-facing naming."
  - id: D9
    description: "String literals holding the prose phrase were rewritten with it: seven log prefixes under routes/contestant/, and test titles, labels and assertion messages"
    verification: []
    human_judgment: true
    rationale: "Ruling 19 says this plan changes no executable token in application source. The gate's prose pattern forbids the phrase wherever it stands, so the literals followed. No resolved name changed and the E2E totals are unchanged, but the departure from the ruling's wording is the operator's to accept."

duration: 40min
completed: 2026-10-05
status: complete
---

# Phase 170 Plan 04: Contestant App Rename — Docs, the Search Gate and the Phase Close Summary

**The docs site, the prose phrase, the agent docs and the SQL comments name the contestant app; the search gate is link 8 of `yarn lint:check` at zero findings with exactly two declared exemptions; and the phase closes on one tree with sixteen gate rows green, a 171-test E2E run identical in counts to the baseline and three consecutive green runs of each bank-auth project.**

## Performance

- **Duration:** 40 min
- **Started:** 2026-10-05T20:44:13Z
- **Completed:** 2026-10-05T21:24:00Z
- **Tasks:** 5 of 5
- **Files changed:** 142 (139 outside `.planning/`)
- **Start revision:** `55fe8a84462314ac6c0a8e1b600cff514fa5573c` (pinned in `evidence/plan-04-start-rev.txt`)
- **The tree every closing run describes:** `e222a9b884b639359bf98bf82d686a19a7fb30a4`

## The One Behaviour Change of the Phase

**The two logout handlers were merged into `api/auth/logout`, in plan 170-02 (`b3ae09d56`). Nothing else in the phase changes behaviour.** In that plan's terms:

- **A global-scope sign-out endpoint that nothing reached no longer exists at any route.** The handler that stood at `api/auth/logout` called `signOut()` with no argument, which the installed Supabase client treats as a global sign-out. Its only reader is `UniversalDataWriter.logout`, which the one concrete writer overrides without calling `super`.
- **The local-scope handler survives** with `signOut({ scope: 'local' })`. The contestant app and the admin app sign out exactly as they did.
- **The response body of the surviving route changed shape**, from `{ success: true }` to `{ ok: true, type: 'success' }`, and no caller reads it.

Which logout behaviour survives is still listed as open for operator confirmation in `170-CONTEXT.md`. A different answer changes that one commit.

This plan adds no behaviour change. Its only executable edits are the `lint:check` wiring and string literals that hold the prose phrase (see *Changes for the Operator's Eye*).

## The Search Gate, and the Two Lines Later Phases Delete

`yarn assert:no-candidate-app-names` runs `scripts/assert-no-candidate-app-names.mjs`. It is link 8 of the 20-link `lint:check` chain, directly after `assert:comment-hygiene`, so every local run and the CI validation job pass through it. It exits 0 on the tree: 2689 tracked files scanned, 0 findings in all four groups.

It does not scan `.planning/`, and it declares exactly two exemptions, each a mask on one name:

| Line in `EXEMPT` | Owner | What that phase does |
|---|---|---|
| `/get_candidate_user_data/g, // the user-data RPC — see phase 173` | **Phase 173** | deletes the RPC for entity-neutral names, and **deletes this line** |
| `/invite-candidate/g // the invitation Edge Function — see phase 174` | **Phase 174** | deletes the function, and **deletes this line** |

Each is a mask, not a skipped path: an old app-level name planted inside `functions/invite-candidate/index.ts` still makes the gate exit 1. As a structural necessity, and not as an exemption of any name, the gate also skips its own source and its two fixture files and `.yarn/`, and masks its own script name wherever it is cited. That reads against the letter of D-18 and is for review.

**Negative control, recorded:**

| Step | Gate exit | `yarn lint:check` exit |
|---|---|---|
| (a) clean tree; `--self-test` | 0; 0 (81 of 81) | |
| (b) an old name appended to `apps/frontend/src/lib/routes/route.ts` | **1**, naming the file and line | **1**, with the gate's finding in its output |
| (c) that file restored; the same name appended to `functions/invite-candidate/index.ts` | **1** | |
| (d) both restored | 0 | |

## Accomplishments

- Renamed the app in SQL comments under `schema/`, `seed.sql` and two pgTAP files, regenerated the migration mirror, applied it with a local reset, and proved the generated types unchanged, the SQL lint clean and the pgTAP suite green.
- Moved the five pages of the docs section by a pure-move commit at 100% similarity and re-pointed the navigation, the four redirect stubs and the publishers' guide's one link.
- Regenerated the component pages, the listing and the route map from the moved source; docs link validation is strict again and finds nothing.
- Applied the two prose rows: 212 rewrites in 114 files, with no message value, no publishers'-guide prose and no quoted research span changed.
- Wired the search gate into `lint:check` and recorded its negative control in both directions.
- Closed the phase on one tree: sixteen gate rows, one full E2E run, six bank-auth runs.

## Task Commits

1. **Task 1: SQL comments, the migration mirror, the local database**
   - `edba1482d` `docs[db](170-04): name the contestant app in schema, seed and pgTAP comments; regenerate the migration` — six files under `apps/supabase/supabase/`, 10 insertions and 10 deletions, every changed line under `schema/` and in the migration a `--` comment.
2. **Task 2: The docs site, the prose phrase and the agent docs**
   - `fc309c010` `docs(170-04): move the docs section to contestant-app` — the pure move: 5 paths, every row `R100`, 0 insertions and 0 deletions. Docs link validation fails on this commit; the next completes it.
   - `165c76d94` `docs(170-04): name the contestant app in docs, comments and agent docs` — the content: 130 files, 342 insertions and 344 deletions. 205 codemod rewrites in 109 files, the regenerated pages, the removal of the eight old generated pages and one hand correction in `CLAUDE.md`.
   - `aa2c20753` `style(170-04): reflow after the prose rename` — formatter output only, 8 files.
3. **Task 3: The search gate at zero, wired, with its negative control**
   - `e222a9b88` `chore[lint](170-04): wire the app-name search gate into lint:check` — `package.json` and the two statements that cite a later link by its position.
   - The residue pass found nothing, so there is no residue commit and no gate or fixture change.
4. **Task 4: Bank-auth, three runs per project** — no source commit; recorded in the evidence commit.
5. **Task 5: The closing gate**
   - `27b8f9976` `docs(170-04): record the docs move, the gate wiring, the bank-auth runs and the phase close` — evidence section 5, residue log rows 18 to 21, the closing notes, deferred items 7 to 10.

## Gate, E2E and Bank-Auth Results

Every row below was made on head `e222a9b88`. Each exit status was read from the command or from its exit marker, never through a pipe.

| What | Label / command | Exit | Result |
|---|---|---|---|
| Local reset | `yarn db:reset` (marker `170-04-db-reset.exit`) | 0 | storage bucket list 200 on the first poll |
| Generated types | `yarn db:types`, `git status --porcelain packages/supabase-types` | 0 | unchanged |
| Docs generator | `yarn workspace @openvaa/docs generate:docs` (marker `170-04-generate-docs.exit`) | 0 | |
| Gate set, ahead of the bank-auth runs | `170-gates.sh 170-04-pre --plan 4 --db` | 0 | 16 rows, all 0 |
| Bank-auth driver | `170-bankauth.sh 170-04 3` (marker `170-04-bankauth.exit`) | 0 | six wrappers 0; `restore: OK` |
| `bank-auth` ×3 | `170-verdict.mjs e2e 170-04-bankauth-{1,2,3} --expect-project bank-auth` | 0, 0, 0 | 8 total, 8 passed each; project 6/6; issuer `https://test-idp.example.com` |
| `bank-auth-journey` ×3 | `170-verdict.mjs e2e 170-04-bankauth-journey-{1,2,3} --expect-project bank-auth-journey` | 0, 0, 0 | 131 total, 131 passed each; project 1/1; issuer `https://127.0.0.1:9443` |
| Allowlist probe, after the restore | `170-allowlist-probe.sh after` | 0 | ten rows OK |
| **Closing gate set** | `170-gates.sh 170-04-close --plan 4 --db` | **0** | **16 rows, all 0**: build, typecheck, lint, format, check-frontend, check-docs, unit, build-frontend, build-docs, docs-links, skill-links, idempotent, residue, exemptions, pgtap, sql-lint |
| `170-verdict.mjs gates 170-04-close` | | 0 | 16 expected, 16 recorded; not stale |
| Catalogue identity | `catalogue-identity.mjs --base 990f0d662…` | 0 | 595 keys compared in each of seven locales |
| Visual baselines | `170-verdict.mjs baselines` | 0 | both blobs unchanged |
| Exempt names | `170-verdict.mjs exemptions` | 0 | 51 / 15 and 73 / 32 / 10 at both revisions |
| **Closing E2E** | `170-e2e.sh 170-04-close` | **0** | **171 total, 171 passed, 0 failed, 0 flaky, 0 skipped, 0 did-not-run** |
| `170-verdict.mjs e2e 170-04-close --same-total-as 170-01-baseline` + five `--renamed-project` pairs | | 0 | the baseline's total, passed and skipped; each renamed project at its old name's count; no old name present |
| Search gate | `node scripts/assert-no-candidate-app-names.mjs` | 0 | 0 findings |
| `rename.mjs --check --plan 4` | | 0 | nothing pending |

In the closing gate set the `docs-links` and `residue` rows are strict: the validator's own exit status, and four groups with nothing set aside. The 15 link findings and the 70 residue lines carried by plans 1 to 3 are gone with the regenerated pages.

Run directories: `tests/e2e-runs/170-gates/170-04-pre`, `tests/e2e-runs/170-gates/170-04-close`, `tests/e2e-runs/170-e2e/170-04-close`, `tests/e2e-runs/170-e2e/170-04-bankauth-{1,2,3}`, `tests/e2e-runs/170-e2e/170-04-bankauth-journey-{1,2,3}`. There was no red gate row and no red run, and no run was repeated on an unchanged tree to see whether it passes. The full record is `170-EVIDENCE.md` section 5.

## What Later Phases and Every Developer Need to Know

Obligations this phase places on later phases, from `170-CONTEXT.md` `<cross_phase>`:

- **Every developer restarts the local stack once.** `additional_redirect_urls` is read into the auth container when the stack starts. Anyone who pulls the phase runs `yarn db:stop` then `yarn db:start`; until then the running service rejects the neutral callback on `localhost` and still admits the two old URLs. The E2E suite does not notice either way.
- **The invitation redirect dangles** at `/contestant/complete-registration`. No page exists there, as none existed at the old path. Phases 174 and 178 give it a destination or remove its source.
- **The auth endpoints and their keys are neutral:** `api/auth/{callback,logout}`, `AuthCallback`, `AuthLogout`. Later phases' documents still cite them under the old names (for example `routes/api/candidate/auth/callback/+server.ts` in the Phase 178 material and FIX-01); their planners read those anchors as the neutral path.
- **`ContestantAppPreregister*` route constants and `contestantApp.preregister*` message keys are short-lived by design.** The legacy `register/` and `preregister/` trees moved to `contestant/` unchanged; Phase 178 removes `register/` and Phase 179 `preregister/`.
- **Phase 173 deletes the `get_candidate_user_data` line of the gate's exemption list; Phase 174 deletes the `invite-candidate` line.** Phase 173 also takes the `.candidate` members of the user-data state, and moves every protected route constant and E2E URL a second time if it adopts the selected entity as a route parameter.
- **Phase 171** builds inside the `contestantApp` settings root and beside `access.contestantApp`, and replaces `dynamic.contestantAppName`. What the app calls itself to its users, in the catalogues and in the publishers' guide, is still "Candidate App": this phase changed keys, never values.
- **Phases 175 and 177** put `access.nominationsLocked` beside `access.contestantApp`.
- **Every later phase is held to the new names** by `lint:check`, without a criterion of its own. A new old-style name fails the lint row.
- **Stale stored state is not migrated.** A stored settings row that still holds `access.candidateApp` or the `candidateApp` root is read as if the key were absent, and four browser-storage keys are orphaned in place. Nothing is deployed.

## How the Roadmap's Wording Reads Here

`170-RESEARCH.md` lists five differences between the amended roadmap and requirements and `170-CONTEXT.md`. **`170-CONTEXT.md` was followed in each.**

| # | The amended text says | What was done |
|---|---|---|
| W1 | Criterion 3: a search "finds none outside the planning record" | D-18: `.planning/` plus two named exemptions. 51 occurrences of `get_candidate_user_data` and 73 of `invite-candidate` remain, by decision |
| W2 | Criterion 2: the identity-provider return targets a `contestant/` URL or the neutral callback | D-05: the return is `/api/oidc/callback`, which carries no app name and did not move. What moved is where the flow lands afterwards |
| W3 | Criterion 2: every link that leaves the system arrives on the new routes, the invitation emails included | D-11: the invitation redirect is renamed and still lands on a path with no page |
| W4 | The traceability table maps E2E-03 to Phase 179 | E2E-03 was this phase's closing criterion, as it is every phase's |
| W5 | NAME-01: symbols are "renamed to `contestantApp`" | D-05: several spellings — `ContestantApp*`, `contestantApp`, `AuthCallback`, `AuthLogout` |

## Hand Edits Beyond the Mapping Table

- `CLAUDE.md` § *Frontend (SvelteKit)* → *Key directories*: the context-provider list names `contestant`, the directory plan 1 moved. A correction of fact under D-21.
- `.claude/skills/database/SKILL.md` and `apps/supabase/README.md`: `assert:schema-migration-parity` is link 13 of `lint:check`, since the new gate went in ahead of it.
- Root `package.json`: the script and its link.

No map row and no gate anchor was changed.

## Decisions Made

Nothing in the plan's decisions was decided differently. Calls the plan does not make are the four under `key-decisions` and the deviations below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `CLAUDE.md` listed a context directory that no longer exists**
- **Found during:** Task 2, step 5, reading the phase's hunks in the agent docs.
- **Issue:** § *Key directories* said "Svelte context providers (app, voter, candidate, data, …)". The directory is `lib/contexts/contestant/` since plan 1, and no row can see a bare word in a list.
- **Fix:** `candidate` → `contestant` in that list.
- **Files modified:** `CLAUDE.md`.
- **Committed in:** `165c76d94`.

**2. [Rule 1 - Bug] Two statements cited a gate by a position the wiring changed**
- **Found during:** Task 3, step 3, the search for statements about the chain.
- **Issue:** `.claude/skills/database/SKILL.md` and `apps/supabase/README.md` call `assert:schema-migration-parity` "link 12 of `yarn lint:check`". With the new link at position 8 it is link 13.
- **Fix:** both say link 13. The components skill's "link 6" is still true and was left.
- **Committed in:** `e222a9b88`.

**3. [Rule 3 - Blocking] The docs generator's formatter reflowed hand-written pages before the content commit**
- **Found during:** Task 2, step 7.
- **Issue:** `generate:docs` ends with `prettier --write .` in the docs workspace, which re-aligned the tables of seven hand-written pages the codemod had just rewritten. Committed as it stood, the content commit would have mixed reflow into the substitution.
- **Fix:** those pages were set back to the committed version and the codemod re-applied to `apps/docs/`, so the content commit holds the substitution and the generated pages; the reflow is in `aa2c20753`.
- **Verification:** the non-generated docs diff went from 68 changed lines to 55; `yarn format` afterwards reproduced the reflow.

**4. [Scope boundary] One unrelated autofix was kept out of the formatter commit a fourth time**
- `yarn lint:fix` proposed the removal of the unused `eslint-disable` directive in `tests/tests/support/mockOidcIssuerEntry.ts`; it was dropped.

### Acceptance criteria and expectations that did not hold as written

- **"Fix every finding in the tree" (Task 3, step 1) had nothing to fix.** The gate was at 0 findings once Task 2's prose rows and the regeneration were in. No residue commit and no gate commit were made, as the plan allows.
- **A handover expectation did not materialise.** Plan 3's summary expected a prose row to lengthen the line `candidate settings-perm chain:` inside the fenced diagram of `tests/README.md`. No row matches it, so the diagram is unchanged and needed no re-squaring.
- **Ruling 19's "no executable token" does not hold literally** (coverage item D9).

### Departures in procedure

- **One gate set more than the plan lists** (`170-04-pre`), on the final head before the bank-auth runs.
- **Polling.** A standalone `sleep` is blocked in this harness; each wait was a bounded loop on the marker file, at most about four minutes per command. Markers, logs and ceilings are as the plan states.
- **The storage poll's key** was read from `supabase status -o env` into a shell variable and not printed; `.env` was not read.
- **Two background jobs were started with `&` inside a foreground command** (the Task 1 pgTAP run and the docs generator) rather than with the tool's background mode. Both wrote the plan's markers and logs.

---

**Total deviations:** 4 (2 corrections of fact, 1 commit-hygiene step, 1 scope exclusion), plus the notes above.
**Impact on plan:** none changes application behaviour. Deviation 3 keeps the content commit reviewable as a substitution.

## Changes for the Operator's Eye

- **String literals changed with the prose phrase.** Seven log-message prefixes in four files under `routes/contestant/` (`[Candidate App protected layout]` → `[Contestant App protected layout]` and the like), and in tests one unit-test title, four table labels, two assertion messages, two Playwright test titles, one setup error message and one assertion message. None is a name the application or the suite resolves.
- **One heading on the docs' `about/features` page** now reads "Contestant application". It is outside the publishers' guide, so the prose row reached it. If what the app is called there is Phase 171's decision, this is the line.
- **`CLAUDE.md` changed in three lines** in this plan: two by the prose rows ("Contestant app:", "Contestant-app code") and the hand correction above. `.claude/skills`: five files and six lines, each a substitution of the phrase except the link position.
- **The local database was reset once** in this plan (and twice in plan 3). Any earlier local data is gone.
- **The stack was stopped and started once,** by the bank-auth driver's restore, with `yarn db:stop` and `yarn db:start` only. The other Supabase stack on this host and `my-redis` were not touched.
- **`CAND-APP-PLAN.md` is untracked and was not edited, moved, staged or committed** in any plan. The gate scans tracked files, so it is not a finding; if it is ever committed outside `.planning/`, the gate will report it.
- **Two standing reds predate the phase and are still red:** `audit-skill-links.sh` (exit 1, `Dangling: 222` before and after) and `audit-skill-drift.sh` (exit 1, two skills drifted at the close).

## Names and Calls Left for Operator Review, Across the Phase

**Open in `170-CONTEXT.md`:**

1. Which logout behaviour survives the merge. Implemented: `signOut({ scope: 'local' })` with the `DataApiActionResult` response.
2. Additional note 1 ("change the whole preregister route to register…") was read as the final layout of Phases 178–179, not as a Phase 170 change.

**Names renamed that no decision lists:**

3. The `AppType` value `'candidate'` → `'contestant'`, at six sites (ruling 1).
4. `getCandidateUserData` and its two siblings → `getContestantUserData` (ruling 2).
5. `CandidateLoginError`, `CandidatePreregistrationError` and their constants (ruling 4).
6. `'cand-nav-menu'`, `'[notif-cand]'`, and the poster `hero-candidate.png` → `hero-contestant.png`, the last by the operator's own ruling (ruling 5).
7. The dev-seed template `perm-disable-candidate-app` (ruling 11) and the DOM id `candidate-app-menu` (ruling 19).
8. Four browser-storage keys, not the two D-03 names (ruling 23).
9. The `candidateHome` stem (ruling 24).
10. **`setupCandidateSession` → `setupContestantSession`** in `supabaseDataWriter.test.ts`, with the comment-only names `mintContestantSession` and `contestantSessionMinter` (row P3-13c). It reads as entity-typed. Reverting is one map row, one gate pattern and its fixture line.
11. The test-side identifiers of ruling 3, including the registry namespace `testIds.contestant`.

**Names kept that read as app-flavoured:**

12. The locals `candidatePayloadSatisfiesTheHelper` (`routes/admin/layout.server.test.ts`) and `candidateDialog` (`perm-per-app-notifications.spec.ts`).
13. The docs directory `developers-guide/candidate-user-management/`, a redirect-only legacy URL (ruling 18).
14. The prose "candidate context" (22 mentions in 18 files), and in `tests/README.md` "candidate settings-perm chain" and "Candidate-journey seed overlay".
15. `UserRole`'s `'candidate'`, the `.candidate` members of the user-data state (Phase 173), and every name of the entity.

**Calls about instruments and form:**

16. The gate's structural skips beside its two exemptions (rulings 8 and 12).
17. The two map rows tightened and the one added against the plan's text: P3-09 (spares `moderation-of-candidate-answers`), P2-05 (spares the regex literals `/candidate lookup failed/i` and `/candidate/i`), P2-01b.
18. The `docs-links` gate row set generated pages aside for plans 1 to 3. With plan 4 it is strict; the set-aside code is still in `170-gates.sh` and unused.
19. Prose keeps each form's own casing, against the letter of D-14, which capitalises every form (ruling 6).
20. Dead tooling, the spike sources and root `ROADMAP.md` were rewritten mechanically (ruling 7); the two hygiene-codemod fixtures with their twins under `.planning/phases/151-…` (ruling 16).
21. `voter-results-redraw.spec.ts` was changed in plan 3 to close a red run; the failure's rate is not measured.
22. This plan's string literals and the `about/features` heading (above).

## Deferred Issues

Logged in `deferred-items.md`, none fixed. Rows 1 to 6 are the earlier plans'. Added here:

7. The `yarn lint:fix` proposal of deviation 4.
8. The prose forms of item 14 above.
9. The search gate has no wiring test of the kind several other gates have under `packages/dev-seed/tests/`. Removing its link from `lint:check` would turn nothing red.
10. `audit-skill-drift.sh` reports `ship-review-stack` as drifted, from plan 1's rewrite of the two fixture twins under one of that skill's targets.

The cross-phase defect ledger (`.planning/WINDOWS.md`) was not appended to: there is no stub, no skipped test and no verification that was not run.

## Issues Encountered

None. No gate row, no E2E test and no bank-auth run was red at any point in this plan.

## Known Stubs

None.

## Phase Readiness

Phase 170 is complete: NAME-01 and NAME-02, with E2E-03 as its closing criterion.

- **Roadmap criterion 1:** no `candidate/` route directory exists; pages are under `contestant/`, `preregister` under `api/contestant/`, the auth pair under `api/auth/`.
- **Criterion 2, as `170-CONTEXT.md` reads it:** the code-built redirects target the new URLs and the running auth service admits the neutral callback and no `candidate` URL; the invitation link dangles by D-11.
- **Criterion 3, as D-18 reads it:** the gate, a link of `lint:check`, finds no app-level old name outside `.planning/` and the two named exemptions, and the docs site describes the new routes.
- **Criterion 4:** no message value and no baseline pixel changed; the one behaviour change is the logout merge; every gate, the full E2E suite and the bank-auth projects are green on one tree.

**Host state:** the stack is up and healthy on the new allowlist with the default function environment; the database holds what the closing E2E run left in its own project. Nothing listens on 5173, 5273, 8777 or 9443. A Vite dev server on port 5199 belongs to another session and was left alone.

## Self-Check: PASSED

- `evidence/plan-04-start-rev.txt`, the five pages under `developers-guide/contestant-app/`, the regenerated pages under `…/generated/contestant/components/` and `…/navigation/contestant/ContestantNav/` exist; `developers-guide/candidate-app/` and the two old generated directories do not.
- All six commits (`edba1482d`, `fc309c010`, `165c76d94`, `aa2c20753`, `e222a9b88`, `27b8f9976`) are ancestors of HEAD; `git rev-list --count 55fe8a844..HEAD` was 6 when this file was written.
- The plan's seven verification items were re-run on the final tree and each exited 0.
- Every acceptance criterion of the five tasks was checked by command on the final tree.
- `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged since the start revision; `CAND-APP-PLAN.md` is untracked and untouched.
