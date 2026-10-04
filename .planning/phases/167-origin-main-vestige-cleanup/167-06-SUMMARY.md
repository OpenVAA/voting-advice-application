---
phase: 167-origin-main-vestige-cleanup
plan: 06
subsystem: gates
tags: [gate-evidence, audit, e2e, playwright, comment-hygiene, todos, vestiges, prettier]

requires:
  - phase: 167-origin-main-vestige-cleanup
    provides: commits ① to ⑥ (096896f47, 837b895c4, 879d0ccf0, ddcd396ef, dad0754fe, a02f3362e), 167-phase-base.txt and 167-hygiene-baseline.tsv
provides:
  - gate-evidence/ of quick task 261001-n8y inspected by category, deleted, and cited as deleted in VESTIGES and the 261001-n8y SUMMARY
  - the full D-26 gate set green at the final code commit 275250054, including one clean full E2E run (171 expected, 0 unexpected, 0 flaky, 0 skipped)
  - the D-25 same-moment audit comparison (no GHSA only in AFTER) and the AFTER set as Phase 169's starting point
  - reconciled todos (env-dir closed, two adapter notes, D-02 / kxi / globals todos filed) and ten VESTIGES rows marked fixed
  - style fix 275250054 for a docs format:check red introduced by commit ⑤
affects: [168, 169]

actuals:
  tokens: 9500
  tasks: 3
  commits: 1
plan_head_before: 9cc55af601b8b50b45012336d1fc48bbbee077fd
plan_head_after: 275250054d4efd0f477c253fee81cb672f2a056c

tech-stack:
  added: []
  patterns:
    - "Count-only secret scan with grep -rlE … | wc -l, then categorise env-bearing files by masked or structural reads (line counts, key names only, verbatim-tracked-content checks) so no value is ever printed"
    - "Same-moment audit: git archive the phase base's manifests + lockfile + script, audit it and HEAD minutes apart, compare the [NEW] high+ GHSA sets with comm"

key-files:
  created:
    - .planning/todos/pending/2026-10-02-writer-second-getuser-round-trip.md
    - .planning/todos/pending/2026-10-02-tracked-260930-kxi-gate-evidence-files.md
    - .planning/todos/pending/2026-10-02-declare-globals-in-shared-config.md
  modified:
    - apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte
    - .planning/todos/done/2026-08-28-vite-envdir-root-would-fix-six-empty-constants.md
    - .planning/todos/pending/2026-08-28-reintroduce-the-local-data-adapter.md
    - .planning/todos/pending/2026-09-27-adapter-selection-entrypoints.md
    - .planning/quick/261001-n8y-remove-the-legacy-src-lib-i18n-translati/261001-n8y-VESTIGES.md
    - .planning/quick/261001-n8y-remove-the-legacy-src-lib-i18n-translati/261001-n8y-SUMMARY.md
    - .planning/phases/167-origin-main-vestige-cleanup/167-VALIDATION.md

key-decisions:
  - "The docs workspace's own prettier --check (inside yarn format:check) was red on OpenVAALogo.svelte from commit ⑤; fixed in its own style[docs] commit 275250054 and every static gate re-run at that commit"
  - "gate-evidence/ held no credential: the one pattern hit (two lines) is verbatim content of a tracked docs page, a placeholder example; nothing needed rotating"
  - "The globals todo was filed because 167-04 recorded root globals 16.5.0 -> 15.14.0 (orchestrator ruling 7)"
  - "VEST-03, VEST-06, VEST-07, VEST-08 and VEST-09 are fully satisfied and marked complete"

patterns-established:
  - "Before a docs-touching commit, run the docs workspace's own `yarn workspace @openvaa/docs format:check`, not only root `prettier --check` on the files: the two configs wrap differently"

requirements-completed: [VEST-03, VEST-06, VEST-07, VEST-08, VEST-09]

coverage:
  - id: D1
    description: "gate-evidence/ scanned (counts only), its env-bearing files categorised without values, deleted, absent from git status; VESTIGES and the 261001-n8y SUMMARY each gained one deletion line; the tracked 260930-kxi files are byte-identical to the phase base"
    requirement: VEST-07
    verification:
      - kind: other
        ref: "test ! -e …/gate-evidence -> exit 0; git status --porcelain -- …/gate-evidence -> empty; tracked kxi files=2; git diff --exit-code 8c519ac97 -- <kxi files> -> exit 0 (before and after); git diff --numstat 8c519ac97 on both docs -> 1 0 after Task 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "Static gates green at the final code commit 275250054: typecheck, lint:check, format:check, test:unit, TURBO_FORCE build (frontend + docs), docs svelte-check"
    requirement: VEST-09
    verification:
      - kind: other
        ref: "TURBO_FORCE=true yarn typecheck 0 (23/23, 0 cached); TURBO_FORCE=true yarn lint:check 0; yarn format:check 0; TURBO_FORCE=true yarn test:unit 0 (25/25, 0 cached); yarn workspace @openvaa/docs check 0 (611 files, 0/0); TURBO_FORCE=true yarn build 0 (14/14, 0 cached; frontend:build 432 lines, docs:build 621 lines)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The phase adds no advisory: the [NEW] high+ GHSA set of HEAD equals the phase-base export's set, measured at the same moment, non-vacuous (9 = [NEW] 9)"
    requirement: VEST-09
    verification:
      - kind: other
        ref: "comm -13 before after -> empty (run twice: 06:32 at 9cc55af60 and 06:38 at 275250054; both sets stable)"
        status: pass
    human_judgment: false
  - id: D4
    description: "One full E2E run under the cardinal rule: db:reset, wrapper-owned dev server on 5273, preflight OK, 171 expected / 0 unexpected / 0 flaky / 0 skipped, head = 275250054"
    requirement: VEST-09
    verification:
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/167-gate -> exit 0; preflight-successes 1, preflight-failures 0; results.json stats; head == git rev-parse HEAD"
        status: pass
    human_judgment: false
  - id: D5
    description: "Reconciliation on disk: env-dir todo in done/ with the three-point resolution; both adapter todos carry the dated Phase 167 note and stay pending; D-02, kxi and globals todos filed; ten VESTIGES rows fixed with hashes (numstat 11 10)"
    requirement: VEST-08
    verification:
      - kind: other
        ref: "Task 3 verify block: done exit 0, pending-gone exit 0, resolves_phase count 1, adapter todos 1/1, filed-todo count 2; VESTIGES fixed rows 19 vs 9 at the phase base"
        status: pass
    human_judgment: false
  - id: D6
    description: "Comment hygiene: no gate row of hygiene-grep-report.sh rose above the 167-01 baseline (after-TSV byte-identical), assert:comment-hygiene exits 0, every comment line the phase added was read against the four rules"
    requirement: VEST-08
    verification:
      - kind: other
        ref: "paste baseline after | awk -> no row; yarn assert:comment-hygiene -> exit 0 (1757 files, 0 violations)"
        status: pass
    human_judgment: true
    rationale: "Historical narrative and reviewer-addressed notes are invisible to the scripts; the per-line reading is recorded below and a reviewer should spot-check it"

duration: 15min
completed: 2026-10-02
status: complete
---

# Phase 167 Plan 06: Gate-evidence, gates and reconciliation Summary

**The untracked `gate-evidence/` directory was scanned, categorised (no credential found) and deleted. Every D-26 gate is green at the final code commit `275250054`, including one full E2E run with 171 passed and 0 unexpected, flaky or skipped. A same-moment audit shows the phase added no advisory. The todos and VESTIGES rows are reconciled, and comment hygiene is no worse than at the phase base.**

## Performance

- **Duration:** about 15 min
- **Started:** 2026-10-02T06:30:26Z
- **Completed:** 2026-10-02T06:45Z
- **Tasks:** 3
- **Files modified:** 1 code file, 10 planning files (3 created, 1 moved, 6 edited), plus the deleted untracked directory

## Accomplishments

### D-23: gate-evidence/ (Task 1)

The steps ran in this order: scan, read, record, delete, cite.

1. **Tracked neighbours, before.** `git ls-files .planning/quick/ | grep gate-evidence` lists the two `260930-kxi` files. `git diff --exit-code 8c519ac97 -- <both>` exited 0.
2. **Secret-pattern scan, counts only.** Each count is `grep -rlE '<pattern>' "$E" | wc -l`. The directory held **65 files** (1.5 MB).

   | Pattern | Files matched |
   |---|---|
   | JWT-shaped `eyJ…\.…` | 0 |
   | PEM private-key header (`BEGIN … PRIVATE KEY` armour line) | 0 |
   | AWS key id `AKIA…` | 0 |
   | OpenAI-style `sk-…` | 0 |
   | `service_role` | 0 |
   | `(SECRET\|PASSWORD\|PRIVATE_KEY\|API_KEY\|CLIENT_SECRET)…[=:]` | **1** (`sweep/env-old.txt`, 2 lines) |
   | URL with inline credentials | 0 |

3. **Reading the likeliest env-bearing files, by category only:**
   - `g-db-status.log` (2 lines): Supabase CLI status output, trimmed to a stopped-services list of local container names and the "local development setup is running" line. It has no URL and no key.
   - `t3-yarn-install.log` (14 lines): a Yarn install log with one removed resolution (a frontend devDependency) and peer-dependency warnings. It has no credentials.
   - `sweep/env-example.txt` (45 lines): `file VARIABLE_NAME consumer-count` triples. These are variable names only, with no values.
   - `sweep/env-old.txt` (52 lines): `git grep` hit lines. All 52 were checked to be **verbatim content of tracked files** at the sweep base `72b336729`.
     - The 2 lines the secret pattern matched both come from the tracked `developers-guide/deployment` docs page. Each is an example `AWS_*` variable followed by a short placeholder value.
     - These are public repo content, not a credential.
   - **No non-local credential was found, so nothing needs rotating.**
4. **Delete.** `rm -rf "$E"`, after which `test ! -e "$E"` exited 0 and `git status --porcelain -- "$E"` printed nothing. No `.gitignore` rule was added.
5. **Cite.** One line was added under the header bullets of `261001-n8y-VESTIGES.md`, and one line to `261001-n8y-SUMMARY.md`, each naming `gate-evidence/` and Phase 167. `git diff --numstat 8c519ac97` reported `1 0` for each at the end of Task 1.
6. **Tracked neighbours, after.** The same `git diff --exit-code` exited 0, so PROH-167-10 holds.

### D-26: static gates (Task 2)

Every exit below was read directly with `cmd > log 2>&1; echo "exit=$?"`, never through a pipe. All were run at `275250054`, the final code commit.

| Gate | Exit | Detail |
|---|---|---|
| `TURBO_FORCE=true yarn typecheck` | 0 | 23/23, 0 cached |
| `TURBO_FORCE=true yarn lint:check` | 0 | 11/11 lint and 23/23 typecheck, 0 cached, all `assert:*` links |
| `yarn format:check` | 0 | root and docs |
| `TURBO_FORCE=true yarn test:unit` | 0 | 25/25, 0 cached. frontend 2018, dev-seed 897, data 244, supabase 205, app-shared 92, matching 43, llm 39, argument-condensation 30, filters 22, question-info 22, core 8 |
| `yarn workspace @openvaa/docs check` | 0 | 611 files, 0 errors, 0 warnings |
| `TURBO_FORCE=true yarn build` | 0 | 14/14, 0 cached. The log names `@openvaa/frontend:build` (432 lines) and `@openvaa/docs:build` (621 lines) |

The first gate pass, at `9cc55af60`, found `format:check` **red** (exit 1). The docs workspace's own `prettier --check` flagged `apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte`. The fix is in Deviations below. The whole set was then re-run at the fix commit, and the table above is that re-run.

### Zero-hit greps (criteria 2 and 3)

| Command | rc | n |
|---|---|---|
| D-09 whole-tree `git grep -n -E "CACHE_(DIR\|TTL\|LRU_SIZE\|EXPIRATION_INTERVAL)\|PUBLIC_CACHE_ENABLED\|/var/data/cache\|disableCache\|cachifyUrl\|cacheProxy\|hasAuthHeaders\|flat-cache\|api/cache\|cache disk\|BACKEND_API_TOKEN\|PUBLIC_(BROWSER\|SERVER)_BACKEND_URL" -- ':!.planning' ':!apps/docs' ':!yarn.lock' ':!.yarn' ':!security/audit-baseline.json'` | 1 | 0 |
| `git grep -n BACKEND_API_TOKEN -- ':!.planning' ':!apps/docs'` | 1 | 0 |

### D-04: sweep #14 at the final commit

Each command was `git grep -n -P "<pattern>" -- '*.svelte' ':!.planning' > out; rc=$?`, and n is the line count of `out`.

| Pattern | rc | n |
|---|---|---|
| **Positive control:** `git grep -n -P '^\s*\$:' 8c519ac97 -- '*.svelte'` | 0 | 2 |
| `export let ` | 1 | 0 |
| `^\s*\$:` | 1 | 0 |
| `(^\|[^a-zA-Z])on:[a-z]+=` | 1 | 0 |
| `<slot` | 1 | 0 |
| `createEventDispatcher` | 1 | 0 |
| `\$\$props\|\$\$restProps\|\$\$slots` | 1 | 0 |
| `svelte/legacy` | 1 | 0 |
| `<svelte:component` | 1 | 0 |
| `<svelte:fragment` | 1 | 0 |
| `beforeUpdate\|afterUpdate` | 1 | 0 |
| `\$\$Props` | 1 | 0 |
| `git grep -n -F '$app/stores' -- apps packages` | 1 | 0 |

The sweep ran at `9cc55af60`. The only later code commit, `275250054`, is a whitespace re-wrap of one `.svelte` file and adds none of these tokens.

### D-25: same-moment audit

BEFORE is `git archive 8c519ac97` of the root and workspace `package.json` files, `yarn.lock`, `.yarnrc.yml`, `.yarn/releases`, `scripts/assert-dependency-audit.mjs` and `security/`, audited in a scratch directory. AFTER is `yarn audit:deps` at HEAD, run seconds later. Both exit 1 as expected, because the NEW advisories are pre-existing. The gate is the set comparison. The pair was measured twice: 06:32:37–06:32:42 UTC at `9cc55af60`, and 06:38:01–06:38:06 UTC at `275250054`. The sets were identical across both measurements.

| | BEFORE (phase base) | AFTER (HEAD) |
|---|---|---|
| `[NEW]` header | 9 finding(s) | 9 finding(s) |
| Extracted high+ set size (non-vacuity) | 9 (= header) | 9 (= header) |
| `[ACCEPTED]` | 66 | 65 (lodash 1115806 left with `@testing-library/jest-dom` in ④) |
| `Note: … no longer appear` | 1123911, 1123912, 1138114, 1138115 | 1123911, 1123912, 1138114, 1138115 |
| Summary line | `9 new advisory(ies) at high+, 66 accepted` | `9 new advisory(ies) at high+, 65 accepted` |

**The NEW high+ set is identical on both sides.** This AFTER set is Phase 169's starting point:

| Package | Advisory id | GHSA |
|---|---|---|
| brace-expansion | 1240104, 1240105, 1240107 | GHSA-qhr7-859c-m2p7 |
| brace-expansion | 1240108, 1240109, 1240111 | GHSA-6j4f-fj2g-mc7p |
| devalue | 1240870 | GHSA-j22f-vq7h-c4qm |
| devalue | 1240872 | GHSA-mcm9-63f2-9j32 |
| undici | 1240042 | GHSA-rfgv-xxqx-mfg5 |

- `comm -13` over the GHSA columns (GHSAs only in AFTER) is **empty**. The phase added no advisory.
- `comm -23` (only in BEFORE) is also empty.
- `--update-baseline` was never run.

### D-26: full E2E run (last gate)

- **Run:** `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/167-gate`, started in the background and polled. Exit **0**.
- **Setup:** `db_reset=true`, a wrapper-owned dev server on port 5273 (`package_watcher=true`), `ci_env=unset`, `expected_retries=0`, 6 workers.
- **Preflight:** `preflight-successes` 1, `preflight-failures` 0. The preflight's project-id check also confirms that the dev server read a configured `PUBLIC_PROJECT_ID` that matches the harness project.
- **`results.json` stats:** `expected` **171**, `unexpected` **0**, `flaky` **0**, `skipped` **0**, duration 299.8 s.
- **`head`:** `275250054d4efd0f477c253fee81cb672f2a056c`, equal to `git rev-parse HEAD` at verification.
- **Run window:** 06:38:20Z to 06:43:59Z. Afterwards, port 5273 has no listener.
- **Evidence:** the run directory is gitignored and kept. `worktree-status.txt` records 9 dirty paths, all of them this plan's uncommitted `.planning` edits.
- **Coverage of the 167-02 change:** this is the run D-26 requires for commit ②'s `UniversalAdapter.fetch` change. The admin job reads and the auth endpoints went through the full suite green.
- **Docker headroom:** the Docker VM had 25.4 GiB free before the run (`docker run --rm alpine df -h /`). `docker builder prune -af` reclaimed 0 B. Docker was not restarted, and no images or volumes were pruned.

### Reconciliation (Task 3)

- **D-22, env-dir todo closed.** `git mv` to `done/2026-08-28-vite-envdir-root-would-fix-six-empty-constants.md`, with `resolved: '2026-10-02'`, `resolves_phase: 167` and a `resolution: >-` covering three points, each re-checked against the tree:
  - (a) `kit.env.dir` is `repoRoot`, and has been since `2a2cce8ed`.
  - (b) The backend-URL pair was removed with the cache proxy in `837b895c4`, and the whole-tree grep exits 1.
  - (c) The private-side widening is accepted. The note cites the `svelte.config.js` comment that `$env/*/public` exposes only `PUBLIC_`-prefixed keys, and `publicPrefix` is unset (grep rc 1).
  - The note also cites the corrected `vite.config.ts` comment (`a02f3362e`). The body is unchanged.
- **D-10, adapter todos.** `## Note (2026-10-02, Phase 167)` was appended to `2026-08-28-reintroduce-the-local-data-adapter.md` and `2026-09-27-adapter-selection-entrypoints.md`. The note says the cache proxy was removed in `837b895c4` and that any static-data cache should be designed with the local adapter. Both todos stay in `pending/`.
- **D-02 todo:** `.planning/todos/pending/2026-10-02-writer-second-getuser-round-trip.md`. It covers the Problem (fact 3), why it is not fixed in Phase 167, what a fix needs (reuse the verified identity, its own negative controls, a request-level `getUser` count pin, an E2E walk) and a link to the adapter-selection todo.
- **Residue todos (D-27, D-28):**
  - `2026-10-02-tracked-260930-kxi-gate-evidence-files.md`: the two tracked files, left untouched on the operator's NOTE. Their fate is an operator decision.
  - `2026-10-02-declare-globals-in-shared-config.md`: filed because 167-04 recorded that root `globals` moved from **16.5.0 to 15.14.0** (orchestrator ruling 7). It is 15.14.0 today.
  - No D-12 residue: both `@eslint/eslintrc` and `@eslint/js` left in ④.
  - No docs-ESLint-crash todo: Phase 168 D-15 owns it.
- **VESTIGES (D-27).** Exactly ten `deferred` rows became `fixed` with hashes:
  - `@testing-library/jest-dom` (④)
  - `@vitest/coverage-v8` (④)
  - the docs devDependencies: "fixed (5 of 6; `typedoc-plugin-markdown` kept for Phase 168)" (④)
  - `jsonrepair` (④)
  - the six docs ESLint duplicates plus the frontend `@typescript-eslint/eslint-plugin` (④)
  - `eslint-plugin-svelte`: "fixed: kept, now imported explicitly" (④)
  - `dotenv` / question-info `js-yaml` (③ + ④)
  - `BACKEND_API_TOKEN` (②)
  - the backend-URL pair and `/api/cache` (②)
  - `OpenVAALogo.svelte` (⑤)

  `git diff --numstat 8c519ac97` reports `11 10`, and the word diff touches only the Class and Reason/commit cells. The count of `| fixed` rows went from 9 to 19.
- **`167-VALIDATION.md`:** all 16 per-task rows are now ✅ green.

### Comment hygiene (D-27, orchestrator ruling 3)

- `hygiene-grep-report.sh --save-baseline $S/167-06-hygiene-after.tsv 167-hygiene-baseline.tsv` exited 0. The after-TSV is **identical** to the 167-01 baseline (captured at `PHASE_BASE`), row by row. `paste … | awk '$1 != $4 || ($1 != "milestone-ver" && $5 > $2)'` printed nothing. The report-only `milestone-ver` row is 14 / 11, the same as the baseline.
- `yarn assert:comment-hygiene` exited 0 (1757 files, 0 violations).
- **Every comment line the phase added under `apps/`, `packages/` and `tests/` was read** (`git diff -U0 8c519ac97..HEAD -- apps packages tests`):
  - `OpenVAALogo.svelte`: `xmlns="http://www.w3.org/2000/svg"` is a false positive (a URL, not a comment).
  - `OpenVAALogo.type.ts`: `@default 'primary'` passes. It is a fact about the code.
  - `universalAdapter.ts`: the class docstring and the `fetch` docstring (`@throws`) pass. They are present tense and concise.
  - `safeGetSession.test.ts`: the `UnexpectedClientAccess` docblock, the `unexpectedAccesses` doc, the `strict()` JSDoc, the symbols/`then` note, the client-stub docblock and the two per-case count notes all pass. Each describes what the code does.
  - `routes/+layout.server.ts` docblock: passes. It is present tense, with no "used to" or "MEASURED" narrative, and states the no-session rule and the guard.
  - `routes/admin/+layout.server.ts` and `routes/candidate/+layout.server.ts` docblocks: pass. The 167-02 rewrite removed the "used to return" / "must not go back" narrative.
    - The sentence "The reason is written out HERE, in full, rather than referenced …" was already there at the phase base. It is addressed to future readers of the file, not to a reviewer, so it is not a new hit.
  - `routes/README.md`: the server-endpoints bullet passes. It is present tense.
  - `vite.config.ts`: the comment above `resolveProjectIdEnv` passes, as already read in 167-05.
  - **Result: no hit, and no `style[…]` follow-up was needed.**

### Code-review checklist (`.agents/code-review-checklist.md`), against the phase diff

| Item | Disposition |
|---|---|
| Changes solve the issues | Yes: VEST-01..09 all satisfied (see requirements) |
| OWASP top 10 | Improves: removes an unauthenticated server-side fetch route (`/api/cache`, T-167-04, UNCONFIRMED by a run) and dead credential plumbing; no new surface |
| Code style guide | Yes; runes ports follow the frontend twin; docs Prettier now clean |
| No `any` | None added (the lint-red probes used `: any` temporarily and were deleted, never committed) |
| No repeated code | None added; code was mostly deleted |
| New entities documented | `UnexpectedClientAccess`, `strict()` and the stub are documented in the test file |
| Repo docs updated | `routes/README.md`, `CLAUDE.md` deployment sentence, `argument-condensation/README.md` updated; `apps/docs` pages are Phase 168's (D-01 fact 21) |
| Tracking events | N/A: no user-facing function added |
| New Svelte components follow guidelines | N/A: no new component; two ported |
| Errors handled and logged | `UniversalAdapter.fetch` keeps its error paths; messages interpolate the URL |
| Failing checks troubleshot | Yes: the docs `format:check` red was fixed at its cause (275250054) |
| Dependents not unduly affected | Yes: full unit, build and E2E (171/0/0/0) green; `globals` shift recorded and filed |
| WCAG A/AA | OpenVAALogo now forwards caller attributes (e.g. `aria-hidden`) to the `svg`; rendered classes unchanged |
| Keyboard / screen reader | No interaction change |
| Developers' / Publishers' Guides | Deferred to Phase 168 by design (D-01 fact 21) |
| Comment Hygiene | Passed (above) |
| Clean, linear commits following guidelines | Yes: six code commits plus one `style[docs]` commit, all with tagged subjects |
| No fixes of itself | **Open:** `275250054` reformats a file commit ⑤ `dad0754fe` introduced. At review-stack time it should be folded into ⑤ (fixup). History was not rewritten here |
| Formatting in its own commit | Yes, until it is folded into ⑤ |
| `[db]` tag | N/A: no migration or database change |
| Supabase adapter section | `supabaseDataWriter.ts` untouched; the auth paths are unchanged (D-02 todo filed) |

## Task Commits

1. **Task 1: gate-evidence (tracer).** This task makes no commit by plan design: its `.planning` edits land in the close commit. The tracer gate (end-of-phase mode, automated-only `<verify>`) re-ran green before Task 2.
2. **Task 2: gates.** No planned commit. **Deviation commit `275250054`:** `style[docs]: format OpenVAALogo with the docs Prettier config` (1 file, +13/−2).
3. **Task 3: reconciliation.** The planning commit `docs(167): close the phase — gate-evidence, gates and reconciliation` (`--no-verify`, D-24) also carries this SUMMARY.

## Hand-offs

**For Phase 168 (docs):**
- **Pages to rewrite (D-01 fact 21):** `developers-guide/deployment`, `backend/authentication`, `frontend/environmental-variables`, `frontend/data-api` and `frontend/accessing-data-and-state-management`. Drop `PUBLIC_CACHE_ENABLED`, `CACHE_*`, `/api/cache`, `flat-cache`, the Render disk step, `BACKEND_API_TOKEN` and `PUBLIC_*_BACKEND_URL`. Describe the single repo-root `.env`.
- **Render operator note (from 167-02):** existing services can detach the `/var/data/cache` disk and delete these env vars: `PUBLIC_CACHE_ENABLED`, `CACHE_DIR`, `CACHE_TTL`, `CACHE_LRU_SIZE`, `CACHE_EXPIRATION_INTERVAL`, `BACKEND_API_TOKEN`, `PUBLIC_BROWSER_BACKEND_URL` and `PUBLIC_SERVER_BACKEND_URL`. Keys left in place are inert.
- **Docs ESLint real-config load failure (from 167-04):** `eslint` in `apps/docs` exits 2 with `ERR_INTERNAL_ASSERTION`, the same before and after this phase. The bisected cause is the static `eslint-config-prettier` import beside `@openvaa/shared-config/eslint`'s own `compat.extends(…, 'prettier')` require. It is **UNCONFIRMED**, because 167-04 did not re-bisect it. Phase 168 D-15 owns this.
- **Still present for 168's D-13 removal:** `typedoc` and `typedoc-plugin-markdown`.
- **The runes ports of `OpenVAALogo` and `PeerNavigation` (⑤, plus the format fix `275250054`) are 168's base.** The code-style-guide's `$$restProps` / `concatClass` example is still Svelte 4 prose.

**For Phase 169 (dependencies):**
- **Starting point:** the AFTER advisory set above (9 ids / 5 GHSAs: brace-expansion ×6, devalue ×2, undici ×1). `yarn audit:deps` still exits 1.
- **Hand-edited baseline note:** "These 69 findings (63 high, 6 critical)". 169's `--update-baseline` must recheck the prose count.
- **Stale `via` text:** the two `flat-cache` rows still name `flat-cache@6.1.20`, which ESLint's `file-entry-cache` still pulls in.
- **Accepted ids that "no longer appear":** 1123911, 1123912, 1138114 and 1138115 (js-yaml), to drop at the reviewed update.
- **`js-yaml`** is now declared in `@openvaa/llm` (`879d0ccf0`).
- **Four majors 169 no longer bumps:** `@testing-library/jest-dom`, `@eslint/compat`, `vitest-browser-svelte` and `@vitest/coverage-v8`. All four were removed in ④.
- **The `globals` todo** above may be cheapest to take with 169's ESLint work.

## Decisions Made

See `key-decisions`. One precondition was checked differently from the plan. The plan's `grep -c '^PUBLIC_PROJECT_ID=' .env` precondition was not run, because the session's secret-read guard blocks any command that reads `.env`. I checked existence only (`test -f .env`, exit 0). The wrapper's preflight then confirmed the served project id matches the harness project, so the precondition held in effect.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Docs `format:check` red on `OpenVAALogo.svelte`, introduced by commit ⑤**
- **Found during:** Task 2, step 1 (`yarn format:check`, first pass at `9cc55af60`, exit 1)
- **Issue:** `yarn format:check` ends with `yarn workspace @openvaa/docs format:check` (`prettier --check .` under the docs workspace's config). That config wraps the one-line `$props()` destructure and the one-line `<svg …>` attribute list that ⑤ wrote. 167-05 had checked the files with root `prettier --check` only, and that check accepts both forms.
- **Fix:** ran the docs-config `prettier --write` on that single file. This is whitespace and line breaks only, with no token change. It is committed on its own as `style[docs]` (D-24 pattern: one revertable commit per concern).
- **Files modified:** `apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte`
- **Verification:** docs-config and root-config `prettier --check` both exit 0. The full static gate set re-ran at `275250054`, all exit 0. The E2E run is at that commit.
- **Committed in:** `275250054`

---

**Total deviations:** 1 auto-fixed (Rule 1).
**Impact on plan:** None on scope. The commit is a formatting fix of ⑤, and should be folded into ⑤ when the review stack is built (see the checklist).

## Issues Encountered

- The first static-gate run was stopped once the format red was found, and the whole set was re-run at the fix commit. A `turbo run build` child of the stopped run outlived its parent and was killed by PID. Only `-gsd` processes were touched.
- Gate-evidence found no credential, so there is nothing to rotate.

## User Setup Required

None. The Render operator note in Hand-offs is optional cleanup for existing deployments.

## Next Phase Readiness

- Phase 167 is complete: 6 of 6 plans, VEST-01..09 satisfied. It is ready for `/gsd-verify-work 167`.
- Phases 168 and 169 have their hand-offs above.

---
*Phase: 167-origin-main-vestige-cleanup*
*Completed: 2026-10-02*

## Self-Check: PASSED

- FOUND: the three new todos in `pending/` and the env-dir todo in `done/`; the pending copy is gone.
- FOUND: commit `275250054` on `fix/888-review-findings`.
- `gate-evidence/` absent; the two tracked kxi files unchanged against `8c519ac97`.
- The value-shaped grep of this SUMMARY (`eyJ…`, `AKIA…`, PEM armour) prints nothing.
- `tests/e2e-runs/167-gate/` holds `exit` 0, `preflight-successes` 1, `results.json` 171/0/0/0, `head` = `275250054`.
- Frontmatter of this SUMMARY and of the three new todos parses as YAML.
