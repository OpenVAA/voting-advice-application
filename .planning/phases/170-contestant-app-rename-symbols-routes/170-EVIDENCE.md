# Phase 170 — Evidence

Every number here is the output of a command run at the time stated. `PD` is `.planning/phases/170-contestant-app-rename-symbols-routes`. Every command ran under `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"` (Node v24.21.0, Yarn 4.18.1).

## 1 Baseline

Measured 2026-10-05 on the tree the phase starts from.

### 1.1 The tree and the base revision

| Command | Output |
|---|---|
| `git status --porcelain -- . ':(exclude).planning'` | `?? CAND-APP-PLAN.md` (the operator's untracked file; nothing else) |
| `git rev-parse HEAD` | `990f0d662aee21b6d162949d6872cd86c389372c` → `PD/evidence/base-rev.txt` |
| `git grep -i -l contestant -- ':!.planning'` | nothing (exit 1) — the target namespace is empty |
| `git grep -n -P "\bAuth(Callback\|Logout)\b" -- ':!.planning'` | nothing (exit 1) |

### 1.2 Path populations

`git ls-files -- ':!.planning' | grep -E "(routes|lib|contexts|navigation|api|fixtures|setup|specs|generated)/candidate(/|$)|candidateApp\.|candidate-app|candidate-(journey|a11y|bank-auth|preview)|candidateJourneyConstants|candidate-user-management|navigation/candidate" | wc -l` → **238**

| Family | Command | Count |
|---|---|---|
| Page tree | `git ls-files apps/frontend/src/routes/candidate` | 34 |
| API tree | `git ls-files apps/frontend/src/routes/api/candidate` | 4 |
| `lib/candidate/` | `git ls-files apps/frontend/src/lib/candidate` | 26 |
| Context directory | `git ls-files apps/frontend/src/lib/contexts/candidate` | 7 |
| Navigation | `git ls-files apps/frontend/src/lib/dynamic-components/navigation/candidate` | 3 |
| Message catalogues | `git ls-files apps/frontend/messages \| grep -c candidateApp` | 119 |
| Tests | `git ls-files tests \| grep -i -c candidate` | 26 |
| Docs section | `git ls-files 'apps/docs/src/routes/(content)/developers-guide/candidate-app'` | 5 |
| Docs redirect stubs | `git ls-files 'apps/docs/src/routes/(content)/developers-guide/candidate-user-management'` | 5 |
| Generated component docs | `git ls-files '…/frontend/components/generated' \| grep -i -c candidate` | 8 |
| dev-seed template | `git ls-files packages/dev-seed \| grep candidate-app` | `packages/dev-seed/src/templates/e2e/perm/perm-disable-candidate-app.ts` |

### 1.3 Visual baselines

`git ls-files -s tests/tests/specs/visual/__screenshots__/`

```
100644 402f4bf8d8af61bfc2db5fac26d4df25d8acbebc 0	tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/candidate-preview-desktop.png
100644 8878188644373d9a6069c98b46819d4be546f2a5 0	tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/candidate-preview-mobile.png
100644 15dabda71245dbd8a975dfb6179932add208910e 0	tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-desktop.png
100644 78d8fad28d06d7d550bf006a9d544f4e8f76e6a3 0	tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-mobile.png
```

`node PD/170-verdict.mjs baselines` → exit 0 (both preview blobs unchanged).

### 1.4 Skill-link audit (a standing red that predates the phase)

| Command | Output |
|---|---|
| `bash .claude/scripts/audit-skill-links.sh` | exit 1; last summary line `Checked: 711  Dangling: 222  Skipped: 205` → `222` in `PD/evidence/skill-links-baseline.txt` |
| `bash .claude/scripts/audit-skill-links.sh components` | exit 0; `Checked: 30  Dangling: 0  Skipped: 14` |

### 1.5 Host

| What | Output |
|---|---|
| `docker ps --format '{{.Names}}'` | the thirteen `supabase_*_openvaa-local` containers, plus `my-redis` (unrelated). No second Supabase stack. |
| `docker run --rm alpine df -k /` | 31,003,652 KiB available (29.57 GiB; the floor is 13.8 GiB) |
| `lsof -nP -iTCP:5173 -sTCP:LISTEN` | nothing (exit 1) |
| `lsof -nP -iTCP:5273 -sTCP:LISTEN` | nothing (exit 1) |

### 1.6 The exempt names

`node PD/170-verdict.mjs exemptions` at the base tree → exit 0:

```
get_candidate_user_data: base 51 occ / 15 files / 0 paths; HEAD 51 occ / 15 files / 0 paths
invite-candidate: base 73 occ / 32 files / 10 paths; HEAD 73 occ / 32 files / 10 paths
```

### 1.7 The search gate on the untouched tree — the starting population

| Command | Exit | Output |
|---|---|---|
| `node scripts/assert-no-candidate-app-names.mjs --self-test` | 0 | `self-test passed: 81 finding(s) on the fixture, 81 expected.` |
| `node scripts/assert-no-candidate-app-names.mjs` | 1 | `2689 tracked file(s) scanned; 3477 finding(s) (symbols 1744, urls 584, tests 914, prose 235).` |
| `node scripts/assert-no-candidate-app-names.mjs --report --only symbols` | 0 | 1744 findings |
| `node scripts/assert-no-candidate-app-names.mjs --only bogus` | 2 | usage error |

Group `symbols` is above zero: the instrument sees the old names.

**The fixture, checked independently of the gate's own matcher.** A scratch script read the fixture's block markers and the gate's findings: every code line of the POSITIVE blocks (70 lines) is reported at least once, no comment or directive line is reported, and no line of the NEGATIVE block (33 lines) is reported — 0 structural problems, 81 findings. The committed `.violations` file is that reviewed list.

**The report, read against the entity-typed forms.**

- No path finding sits on an entity-typed path of the research's "must not move" list (after the two tightenings of section 6).
- `/candidate URL` matches, aggregated by the token before the slash: `` ` `` 50, space 47, `lib` 45, `en` 43, `contexts` 41, `api` 38, `routes` 36, `\` 23, `'` 22, `navigation` 7, `$lib` 6, `API_ROOT}` 3, `fi` 3, `(` 3, `"` 1, `localhost` 1, `..` 1, `redirectSiteUrl}` 1, `siteUrl}` 1, `localhost:5173` 1. None of the tabulated entity prefixes.
- Slashless and percent-encoded matches were read one by one (51 and 2 distinct contexts): alias imports, route citations, URL literals, the docs generator's `categorySubdir`, and four tree-diagram citations of the context directory. No slash-separated entity prose.

### 1.8 The codemod on the untouched tree

| Command | Exit | Output |
|---|---|---|
| `node PD/rename.mjs --plan 4` | 0 | `total: 2898 rewrite(s) in 410 file(s); 225 path(s) would move` |
| `node PD/rename.mjs --plan 1 --moves` | 0 | 158 tab-separated pairs, nothing written (`git status` unchanged) |
| `node PD/rename.mjs --plan 2 --moves` | 0 | 194 pairs and one collision on stderr: `routes/api/candidate/auth/logout/+server.ts` → `routes/api/auth/logout/+server.ts` (the destination exists; not a move) |
| `node PD/rename.mjs --plan 3 --moves` | 0 | 220 pairs, the same collision |
| `node PD/rename.mjs --plan 4 --moves` | 0 | 225 pairs, the same collision |

Plan 1's 158 pairs are 26 (`lib/candidate`) + 7 (context) + 3 (navigation) + 119 (catalogues) + 2 (`candidateHome.helpers`) + 1 (dev-seed template).

### 1.9 The catalogue identity check and its controls

The script is strict (a key must exist under its mapped name), so on the untouched tree it exits 1 for the 174 keys per locale that are not yet renamed (`1218 difference(s)` = 174 × 7). Its controls therefore ran on a scratch copy outside the repository in which the rename's key mapping had been applied (file names and the `candidateApp` key prefix; no value touched).

| Command | Exit | Output |
|---|---|---|
| `node PD/catalogue-identity.mjs --base 990f0d662 --after-root <scratch>/messages-after` (keys renamed, no value changed) | **0** | `595 keys compared` for each of da, en, et, fi, fr, lb, sv |
| the same, after appending ` X` to the value of `contestantApp.common.contactSupport` in the scratch `fi` catalogue | **1** | `fi candidateApp.common.contactSupport: value changed` |

Both directions were observed.

### 1.10 The baseline gate set

`bash PD/170-gates.sh 170-01-baseline --plan 0`, started in the background; marker `tests/e2e-runs/170-gates/170-01-baseline.exit` holds **0**. Run directory `tests/e2e-runs/170-gates/170-01-baseline`, head `884291ea6` (the base revision plus the gate's three files), Node v24.21.0, `TURBO_FORCE=true`, 18:58:21Z to 19:01:11Z.

| Row | Status | Seconds |
|---|---|---|
| build | 0 | 41 |
| typecheck | 0 | 16 |
| lint | 0 | 40 |
| format | 0 | 17 |
| check-frontend | 0 | 7 |
| check-docs | 0 | 3 |
| unit | 0 | 31 |
| build-frontend | 0 | 7 |
| build-docs | 0 | 4 |
| docs-links | 0 | 2 |
| skill-links | 0 | 1 |

`node PD/170-verdict.mjs gates 170-01-baseline` → exit 0 (11 rows expected, 11 recorded, not stale).

### 1.11 The baseline E2E run

`bash PD/170-e2e.sh 170-01-baseline`, started in the background; marker `tests/e2e-runs/170-e2e/170-01-baseline.exit` holds **0**. Run directory `tests/e2e-runs/170-e2e/170-01-baseline`, head `fa235d53a` (tree-equal to the gate run's head outside `.planning/`), port 5273, `--no-db-reset`, wrapper exit 0, one preflight success and no preflight failure, 4.5 min.

| total | passed | failed | flaky | skipped | didNotRun |
|---|---|---|---|---|---|
| **171** | **171** | 0 | 0 | 0 | 0 |

100 Playwright projects. The five projects plan 170-03 renames, which every later run of the phase is compared against:

| Project | passed / total |
|---|---|
| `candidate-journey` | 1 / 1 |
| `data-setup-candidate-journey` | 1 / 1 |
| `data-teardown-candidate-journey` | 1 / 1 |
| `candidate-a11y-scan` | 14 / 14 |
| `cold-entry-dataroot-candidate` | 1 / 1 |

`node PD/170-verdict.mjs e2e 170-01-baseline --expect-project candidate-journey --expect-project candidate-a11y-scan --expect-project cold-entry-dataroot-candidate` → exit 0. Nothing listened on port 5273 after the run. No source file changed during the two runs (`git status --porcelain -- . ':(exclude).planning'` lists only the untracked `CAND-APP-PLAN.md`).

## 2 Plan 1

Measured 2026-10-05.

### 2.1 The three source commits of the rename

| Commit | What | Check |
|---|---|---|
| `023cc9c23` | pure move, 158 paths | `git show --stat -M100% --format=` → `158 files changed, 0 insertions(+), 0 deletions(-)`; `git show -M100% --name-status --format= \| awk '$1 != "R100"'` prints nothing. Before the commit: the staged listing at `diff.renameLimit=1` held no row other than `R100`, and none of the three old directories existed on disk |
| `c522c0e3f` | content, 304 files, 1445 insertions and 1445 deletions | `node PD/rename.mjs --plan 1 --apply` → `1446 rewrite(s) in 301 file(s) WRITTEN`; the hand edits of section 6; the regenerated `translationKey.ts` (174 keys under the new prefix, 0 under the old) |
| `81ef5d4e6` | formatter output, 20 files | `yarn lint:fix` (exit 0) then `yarn format` (exit 0); every file is one the rename touched |

Per-rule rewrites of the apply: P1-01 186, P1-02 10, P1-03 578, P1-04 13, P1-05 78, P1-06 45, P1-07 108, P1-08 55, P1-09 165, P1-10 17, P1-11 12, P1-12 9, P1-13 17, P1-14 26, P1-15 66, P1-16 32, P1-17a 11, P1-17b 8, P1-18 8, P1-19 1, P1-20 1.

Reviewed with `--rule` before the apply: P1-13 (17 matches, all in `route.ts`), P1-16 (the helper file, its test and the one import in the home page), P1-17a and P1-17b (the two error modules and their five consumers). `--moves` listed only the expected families; no row overreached in plan 1.

### 2.2 Working-tree checks before the content commit

| Command | Exit |
|---|---|
| `yarn build` | 0 |
| `yarn workspace @openvaa/frontend generate:translation-key-type` | 0 |
| `yarn workspace @openvaa/frontend paraglide:compile` | 0 |
| `yarn dev:clean` | 0 |
| `yarn typecheck` | 0 |
| `yarn typecheck:tests` | 0 |
| `yarn workspace @openvaa/frontend check` | 0 (2640 files, 0 errors, 0 warnings) |
| `yarn test:unit` | 0 (25 turbo tasks; frontend 2035 tests in 129 files) |
| `node scripts/assert-i18n-catalog-namespaces.mjs` | 0 (`contestantApp.*: 159, adminApp.*: 121, other: 315`) |

### 2.3 Task 3 verify commands, on the committed tree

Both exited 0: `rename.mjs --check --plan 1`, the three old directories absent, `src/routes/candidate` present, the regenerated key type identical to the committed one, svelte-check clean; the catalogue identity check, the i18n gate, and `yarn workspace @openvaa/frontend test:unit src/lib/routes/` (8 files, 162 tests).

### 2.4 No URL work in this plan

The plan's criterion reads "`git diff <base> HEAD --stat -- apps/frontend/src/routes/api apps/supabase/supabase/config.toml` shows no change". **As written it cannot hold**: two files under `routes/api` use plan-1 names (route keys and the alias) and must change with them, or the tree does not type-check.

| Measurement | Result |
|---|---|
| `git diff <base> HEAD -M --name-status -- apps/frontend/src/routes/api apps/supabase/supabase/config.toml` | two `M` rows: `api/candidate/auth/callback/+server.ts`, `api/oidc/callback/+server.ts`. No add, delete or rename |
| `config.toml` | 0 diff lines |
| Files tracked under `routes/api` | 17 at the base revision, 17 at HEAD |
| Both changed files, with `ContestantApp` mapped back to `CandApp` and `$contestant` to `$candidate` and whitespace removed | identical to the base revision |

So the only change under `routes/api` is the renamed route keys and alias import; no path moved and no URL string changed.

### 2.5 The closing gate set

`bash PD/170-gates.sh 170-01-close --plan 1`; marker `tests/e2e-runs/170-gates/170-01-close.exit` holds **0**. Run directory `tests/e2e-runs/170-gates/170-01-close`, head `81ef5d4e6`.

| Row | Status | Seconds |
|---|---|---|
| build | 0 | 15 |
| typecheck | 0 | 17 |
| lint | 0 | 40 |
| format | 0 | 16 |
| check-frontend | 0 | 8 |
| check-docs | 0 | 3 |
| unit | 0 | 31 |
| build-frontend | 0 | 7 |
| build-docs | 0 | 4 |
| docs-links | 0 | 1 |
| skill-links | 0 | 1 |
| idempotent | 0 | 1 |
| residue | 0 | 0 |
| exemptions | 0 | 1 |

- **docs-links.** `yarn workspace @openvaa/docs validate:links --check` itself exits **1** on this tree with 15 findings, every one a `github-path` finding in a page under `frontend/components/generated/` whose source link names a file the rename moved. The row sets those aside for plans 1 to 3 (section 7) and reports status 0. **Carried to plan 170-04: 15 findings, cleared by regenerating the pages.**
- **residue.** `--report --only symbols`: 42 findings, all under the generated docs subtrees; 0 remain outside them. **Carried to plan 170-04: 42 lines.**
- **idempotent.** `rename.mjs --check --plan 1: 0 rewrite(s) in 0 file(s), 0 move(s), 0 collision(s) pending`.
- **skill-links.** Dangling 222 (baseline 222); `audit-skill-links.sh components` exit 0.

`node PD/170-verdict.mjs gates 170-01-close` → exit 0 (14 rows expected, 14 recorded, not stale).

### 2.6 Catalogue identity (D-19 (i))

`node PD/catalogue-identity.mjs --base 990f0d662aee21b6d162949d6872cd86c389372c` → exit 0:

```
da: 595 keys compared
en: 595 keys compared
et: 595 keys compared
fi: 595 keys compared
fr: 595 keys compared
lb: 595 keys compared
sv: 595 keys compared
catalogue-identity.mjs: identical through the key mapping
```

### 2.7 The exempt names

`node PD/170-verdict.mjs exemptions` → exit 0:

```
get_candidate_user_data: base 51 occ / 15 files / 0 paths; HEAD 51 occ / 15 files / 0 paths
invite-candidate: base 73 occ / 32 files / 10 paths; HEAD 73 occ / 32 files / 10 paths
```

### 2.8 The closing E2E run

`bash PD/170-e2e.sh 170-01-close`; marker `tests/e2e-runs/170-e2e/170-01-close.exit` holds **0**. Run directory `tests/e2e-runs/170-e2e/170-01-close`, head `81ef5d4e6`, wrapper exit 0, one preflight success and no preflight failure, 4.5 min.

| Run | total | passed | failed | flaky | skipped | didNotRun |
|---|---|---|---|---|---|---|
| `170-01-baseline` | 171 | 171 | 0 | 0 | 0 | 0 |
| `170-01-close` | **171** | **171** | 0 | 0 | 0 | 0 |

100 projects in both runs; `candidate-journey` 1/1, `data-setup-candidate-journey` 1/1, `data-teardown-candidate-journey` 1/1, `candidate-a11y-scan` 14/14, `cold-entry-dataroot-candidate` 1/1, `admin-access` 1/1, as in the baseline.

`node PD/170-verdict.mjs e2e 170-01-close --same-total-as 170-01-baseline` → exit 0.

### 2.9 Red runs

None. Each of the two closing runs was made once, on the committed tree, and was green.

## 3 Plan 2

Measured 2026-10-05. Start revision `9a10c837a8e418f32246f29080a12863801e6c88` (`PD/evidence/plan-02-start-rev.txt`).

### 3.1 The logout merge (Task 1)

**Caller enumeration, re-run before the merge.**

| Command | Output |
|---|---|
| `git grep -n 'super\.logout' -- apps/frontend/src` | nothing (exit 1) |
| `git grep -n 'extends .*UniversalDataWriter' -- apps/frontend/src` | one line: `supabaseDataWriter.ts`, `export class SupabaseDataWriter extends supabaseAdapterMixin(UniversalDataWriter)` |
| `git grep -n 'auth/logout' -- tests` | nothing (exit 1) |
| `git grep -n "UNIVERSAL_API_ROUTES\.logout" -- ':!.planning'` | one reader: `universalDataWriter.ts`, inside `UniversalDataWriter.logout` |

All three agree with the research. The handler that stood at `api/auth/logout` had no live caller: its only reader is `UniversalDataWriter.logout`, which the one concrete writer overrides (`async logout() { return this._logout(); }`) without calling `super`.

**Red.** `server.test.ts` was written first and run against the handler as it stood: `yarn workspace @openvaa/frontend test:unit src/routes/api/auth/logout/` → **exit 1**, 1 failed and 1 passed of 2. The failing assertion is the scope:

```
FAIL  src/routes/api/auth/logout/server.test.ts > POST /api/auth/logout > signs out the local session only, exactly once
AssertionError: expected "vi.fn()" to be called once with arguments: [ { scope: 'local' } ]
Received: 1st vi.fn() call: []      Number of calls: 1
```

The response-body test passed against the old handler, as expected: the old handler already answered `{ ok: true, type: 'success' }`. The red state was observed and not committed.

**Green.** After the merge:

| Command | Exit | Result |
|---|---|---|
| `yarn workspace @openvaa/frontend test:unit src/routes/api/auth/logout/ src/lib/api/adapters/supabase/dataWriter/ src/lib/routes/ src/lib/_guards/eslint-adapter-boundary-guard.test.ts` | 0 | 11 files, 312 tests |
| `yarn workspace @openvaa/frontend test:unit src/routes/api/auth/logout/` | 0 | 1 file, 2 tests |
| `yarn workspace @openvaa/frontend lint` | 0 | 0 errors (one warning in a file this plan does not touch) |
| `yarn workspace @openvaa/frontend check` | 0 | 0 errors, 0 warnings |
| `node scripts/assert-comment-hygiene.mjs` | 0 | |

The first lint run exited 1 on the import order of the merged handler (`simple-import-sort/imports`); `eslint --fix` on that one file reordered its two type imports before the commit.

**The commit, `b3ae09d56`.** `git show --name-status --format=` lists exactly: `D apps/frontend/src/routes/api/candidate/auth/logout/+server.ts`, `A apps/frontend/src/routes/api/auth/logout/server.test.ts`, and `M` for the surviving handler, `route.ts`, `supabaseDataWriter.test.ts`, `eslint.config.mjs` and `eslint-adapter-boundary-guard.test.ts`. No `R` row. No added line names `AuthLogout` or `AuthCallback` as a key; `supabaseDataWriter.ts` and `appGates.test.ts` are not in it. In `route.ts` the diff is the import of `UNIVERSAL_API_ROUTES` and the logout key's value; the callback key and the comment above the two keys are unchanged in this commit.

**Counts in the adapter-boundary block.** The second group of `ADAPTER_BOUNDARY_ALLOWLIST` holds eight entries after the deletion (nine before), six of them route files (seven before). Corrected: the group's size in the docblock and in the inline header, "The nine below" in the same comment, "the logout pair" (now one handler), the count of route files in the docblock, the same count in the comment above the `hooks.server.ts` entry, and "the nine grandfathered sites" in `eslint-adapter-boundary-guard.test.ts`. Two things about those counts are stated here rather than left implicit: the comment above `hooks.server.ts` read "eight route files above" when seven were listed, so it was already one off before this plan and now reads six; and the docblock's clause "which measured eight before `157-16` cleared one" could not stay beside "Six", so the sentence now reads "Six are route files, of the eight `157-RESEARCH.md` § F.6 measured".

### 3.2 The route move (Task 2)

**Dry run and review, before any move.** `node PD/rename.mjs --plan 2` → 316 rewrites in 87 files as the table stood; after the two map changes below, 315 in 86.

- `--rule P2-06` (37 matches) and `--rule P2-07` (2) were read one by one. Every one is a path citation of the route tree, of `lib/contestant/components` or of the context directory, or a URL fixture. No slash-separated prose pair naming the entity.
- `--rule P2-05`: the 13 matches outside `tests/`, `apps/frontend/src` and `apps/docs` are the two Edge Function redirects, two lines of `packages/app-shared/src/logging/logger.test.ts` (a sample route attribute) and nine comment lines in dev-seed templates that cite the app's URLs. All are URLs. Every match was then tabulated with its context by a scratch script, which found **two that must not be rewritten** — residue log rows 7 and 8.
- `git grep -n -I 'hero-candidate' -- ':!.planning'`: the PNG, the two fallbacks in the app's login page, and the gate's own pattern and fixture lines. No reference in settings defaults, docs, dev-seed templates, tests or visual baselines.

**Pure move, `40cb307b5`.** `node PD/rename.mjs --plan 2 --moves` printed 38 pairs and no collision (the merge had removed the old logout handler): 34 under `routes/candidate/`, the callback, the two files of `api/candidate/preregister/`, and the poster. No path under `tests/`, none outside the expected families.

| Check | Result |
|---|---|
| `git -c diff.renameLimit=1 diff --cached -M100% --name-status \| awk '$1 != "R100"'` (before the commit) | prints nothing |
| `git diff --cached -M100% --shortstat` (before the commit) | `38 files changed, 0 insertions(+), 0 deletions(-)` |
| `git show -M100% --name-status --format= 40cb307b5 \| awk '$1 != "R100"'` | prints nothing |
| `git show --stat -M100% --format= 40cb307b5` | `38 files changed, 0 insertions(+), 0 deletions(-)` |
| `apps/frontend/src/routes/candidate`, `apps/frontend/src/routes/api/candidate`, `static/images/hero-candidate.png` | none exists on disk |
| Poster blob: `git ls-files -s …/hero-contestant.png` against `git ls-tree <base-rev> …/hero-candidate.png` | `88a00570e03d2e0f939442002a33d72b3e46cdfd` in both |

**Content, `68573e5b1`.** `node PD/rename.mjs --plan 2 --apply` → `315 rewrite(s) in 86 file(s) WRITTEN`. Per rule: P2-01 20, P2-01b 1, P2-02 14, P2-03 7, P2-04 35, P2-05 197, P2-06 37, P2-07 2, P2-08 2. With the hand edits (residue log rows 9 to 14) the commit is 87 files, 280 insertions and 280 deletions.

**Formatter output, `88c19c10e`.** `yarn lint:fix` (exit 0) then `yarn format` (exit 0): 6 files, every one in the content commit — one reflowed `it.each` table in `route.test.ts` and re-aligned Markdown tables in five documents. The unrelated autofix in `tests/tests/support/mockOidcIssuerEntry.ts` was proposed again and dropped again (residue log row 6).

**Working-tree checks before the content commit**, after `yarn dev:clean` (exit 0) and `yarn build` (exit 0):

| Command | Exit |
|---|---|
| `yarn workspace @openvaa/frontend test:unit src/lib/routes/ src/lib/_guards/ src/routes/` | 0 |
| `yarn workspace @openvaa/frontend check` | 0 (0 errors, 0 warnings) |
| `yarn typecheck:tests` | 0 |
| `yarn workspace @openvaa/supabase test:unit` | 0 (15 files, 206 tests) |
| `node scripts/assert-no-session-in-loads.mjs` | 0 (12 server-load modules, 0 violations) |

The three unit test files that hold slashless and percent-encoded URL fixtures (`buildRoute.redirects.test.ts`, `loginRedirectTarget.test.ts`, `appGates.test.ts`) were read as a diff: every fixture and its expectation moved together, and the only `candidate/` left in `src/lib/routes/*.test.ts` is the voter results route's entity segment.

**Both `<automated>` blocks of Task 2, on the committed tree:** exit 0 and exit 0 (13 files and 293 tests in the first; 15 files and 206 tests, `typecheck:tests`, and the gate's self-test at 81 of 81 in the second).

**Acceptance criteria, each checked by a command on the committed tree:** `export const CONTESTANT = '/contestant';`, ``AuthCallback: `${API_ROOT}/auth/callback` `` and `AuthLogout: UNIVERSAL_API_ROUTES.logout` in `route.ts`; `fetch(ROUTE.AuthLogout` and `buildRoute('AuthCallback')` in `supabaseDataWriter.ts`; ``preregister: `${API_ROOT}/contestant/preregister` `` in `universalApiRoutes.ts`; the exact `additional_redirect_urls` line in `config.toml`, whose diff against the start revision is that line and two lines of the comment block above it and nothing else; ``redirectTo: `${redirectSiteUrl}/contestant` `` and `/contestant/complete-registration` in the two Edge Functions; `path.join('contestant', '+layout.server.ts')` in the no-session gate; `tests/tests/specs/candidate/` and `tests/tests/fixtures/candidate/` still present; `ContestantAppAuth` nowhere in the tree. The callback handler is byte-identical to the file the pure move carried: no commit after `40cb307b5` touches it.

`node scripts/assert-no-candidate-app-names.mjs --report --only urls` → 28 findings, all under `frontend/components/generated/`; 0 outside the two generated docs subtrees. `node PD/rename.mjs --check --plan 2` → exit 0 (`0 rewrite(s) in 0 file(s), 0 move(s), 0 collision(s) pending`).

**`CLAUDE.md`.** Row P2-04 rewrote one line of it, the route directory citation under § *Frontend (SvelteKit)* → *Routing* (`apps/frontend/src/routes/candidate/` → `…/contestant/`, twice on the line). No other line of the file changed.

### 3.3 The allowlist on the running auth service (Task 3)

Instrument: `bash PD/170-allowlist-probe.sh <before|after>`. It carries one row beyond the plan's list, `http://localhost:5173/api/evil` (rejected in both modes), so that every form the comment block in `config.toml` says was measured is a row of the probe.

**Before the restart** — `config.toml` already edited, the container still carrying the old list. Exit **0**:

```
container: GOTRUE_URI_ALLOW_LIST=https://127.0.0.1:3000,http://localhost:5173/api/candidate/auth/callback,http://localhost:5173/*/api/candidate/auth/callback

redirect_to                                                observed   expected   verdict
http://localhost:5173/api/auth/callback                    rejected   rejected   OK
http://localhost:5173/fi/api/auth/callback                 rejected   rejected   OK
http://localhost:5173/fi/en/api/auth/callback              rejected   rejected   OK
http://localhost:5173/fi/api/auth/callback/extra           rejected   rejected   OK
http://localhost:5173/fi/api/evil                          rejected   rejected   OK
http://localhost:5173/api/evil                             rejected   rejected   OK
http://localhost:5173/                                     rejected   rejected   OK
http://localhost:5173/api/candidate/auth/callback          allowed    allowed    OK
http://localhost:5173/fi/api/candidate/auth/callback       allowed    allowed    OK
http://evil.example.com/api/auth/callback                  rejected   rejected   OK
```

**The restart.** `docker ps --format '{{.Names}}'` before: the thirteen `supabase_*_openvaa-local` containers and `my-redis`. Nothing listened on 5173, 5273, 8777 or 9443, and no run of this plan was in flight. `yarn db:stop` → exit 0 (`"project_id_filter":"openvaa-local","backup":true`); `docker ps` then listed `my-redis` alone. `yarn db:start` → exit 0. `docker ps` afterwards: identical to the list before (`diff` empty), so nothing outside this project's stack stopped. `GET /rest/v1/` → 200 and `GET /storage/v1/bucket` → 200 on the first poll.

**After the restart.** Exit **0**:

```
container: GOTRUE_URI_ALLOW_LIST=https://127.0.0.1:3000,http://localhost:5173/api/auth/callback,http://localhost:5173/*/api/auth/callback

redirect_to                                                observed   expected   verdict
http://localhost:5173/api/auth/callback                    allowed    allowed    OK
http://localhost:5173/fi/api/auth/callback                 allowed    allowed    OK
http://localhost:5173/fi/en/api/auth/callback              rejected   rejected   OK
http://localhost:5173/fi/api/auth/callback/extra           rejected   rejected   OK
http://localhost:5173/fi/api/evil                          rejected   rejected   OK
http://localhost:5173/api/evil                             rejected   rejected   OK
http://localhost:5173/                                     rejected   rejected   OK
http://localhost:5173/api/candidate/auth/callback          rejected   rejected   OK
http://localhost:5173/fi/api/candidate/auth/callback       rejected   rejected   OK
http://evil.example.com/api/auth/callback                  rejected   rejected   OK
```

The environment line equals the required string exactly. Both directions were observed on the live service, so the instrument reads it. Assumption A1 of the research is confirmed in the direction that matters: the edited list reached the service only through the explicit stop and start.

### 3.4 The closing gate set

`bash PD/170-gates.sh 170-02-close --plan 2`, started in the background; marker `tests/e2e-runs/170-gates/170-02-close.exit` holds **0**. Run directory `tests/e2e-runs/170-gates/170-02-close`, head `88c19c10e`, Node v24.21.0, `TURBO_FORCE=true`, 19:39:54Z to 19:42:21Z.

| Row | Status | Seconds |
|---|---|---|
| build | 0 | 16 |
| typecheck | 0 | 17 |
| lint | 0 | 41 |
| format | 0 | 16 |
| check-frontend | 0 | 8 |
| check-docs | 0 | 3 |
| unit | 0 | 31 |
| build-frontend | 0 | 7 |
| build-docs | 0 | 4 |
| docs-links | 0 | 2 |
| skill-links | 0 | 1 |
| idempotent | 0 | 0 |
| residue | 0 | 1 |
| exemptions | 0 | 0 |

- **unit.** Frontend 2037 tests in 130 files — the plan-1 close had 2035 in 129; the difference is `server.test.ts` and its two tests.
- **docs-links.** `validate:links --check` itself exits 1 with 15 findings, the same 15 as at the plan-1 close, every one a `github-path` finding under `frontend/components/generated/`. The route move added none: no finding sits under `frontend/routing/generated/`. **Carried to plan 170-04: 15 findings.**
- **residue.** Groups `symbols,urls`: 0 findings remain; 70 lines under the generated docs subtrees set aside (symbols 42, urls 28). **Carried to plan 170-04: 70 lines.**
- **exemptions.** `get_candidate_user_data` 51 occ / 15 files and `invite-candidate` 73 occ / 32 files / 10 paths at the base revision and at HEAD.
- **skill-links.** Dangling 222 (baseline 222); `audit-skill-links.sh components` exit 0.

`node PD/170-verdict.mjs gates 170-02-close` → exit 0 (14 rows expected, 14 recorded, not stale).

### 3.5 The closing E2E run

`bash PD/170-e2e.sh 170-02-close`, started in the background after the restart; marker `tests/e2e-runs/170-e2e/170-02-close.exit` holds **0**. Run directory `tests/e2e-runs/170-e2e/170-02-close`, head `88c19c10e`, port 5273, `--no-db-reset`, wrapper exit 0, one preflight success and no preflight failure, 4.5 min.

| Run | total | passed | failed | flaky | skipped | didNotRun |
|---|---|---|---|---|---|---|
| `170-01-baseline` | 171 | 171 | 0 | 0 | 0 | 0 |
| `170-02-close` | **171** | **171** | 0 | 0 | 0 | 0 |

`node PD/170-verdict.mjs e2e 170-02-close --same-total-as 170-01-baseline --expect-project candidate-journey --expect-project admin-access` → exit 0 (`candidate-journey` 1/1, `admin-access` 1/1; not stale). The sign-out steps of those two projects post to the merged handler from both apps.

After the run nothing listened on 5173, 5273, 8777 or 9443, the working tree outside `.planning/` held only the untracked `CAND-APP-PLAN.md`, and `170-allowlist-probe.sh after` exited 0 again.

### 3.6 The bank-auth projects (Task 4)

Driver: `bash PD/170-bankauth.sh 170-02 1`, started in the background; marker `tests/e2e-runs/170-e2e/170-02-bankauth.exit` holds **0**; log `tests/e2e-runs/170-e2e/170-02-bankauth.driver.log`; 19:48:26Z to 19:53:38Z. It ran without a terminal: the function server ran detached with its output in a log file, and every wait was a loop inside the script.

| Project | Edge environment, read back from the serving container by that one key | Run directory | total / passed / failed / flaky / skipped / did-not-run | Preflight OK / failed | Wrapper exit |
|---|---|---|---|---|---|
| `bank-auth` | `IDENTITY_PROVIDER_ISSUER=https://test-idp.example.com` (OPTIONS 200) | `tests/e2e-runs/170-e2e/170-02-bankauth-1` | 8 / 8 / 0 / 0 / 0 / 0 | 1 / 0 | 0 |
| `bank-auth-journey` | `IDENTITY_PROVIDER_ISSUER=https://127.0.0.1:9443` (OPTIONS 200) | `tests/e2e-runs/170-e2e/170-02-bankauth-journey-1` | 131 / 131 / 0 / 0 / 0 / 0 | 1 / 0 | 0 |

Both runs at head `88c19c10e`. The counts are the ones Phase 169 recorded for the same two projects (8 and 131).

| Verdict command | Exit | Output |
|---|---|---|
| `node PD/170-verdict.mjs e2e 170-02-bankauth-1 --expect-project bank-auth` | 0 | `project bank-auth: 6/6 passed`; not stale |
| `node PD/170-verdict.mjs e2e 170-02-bankauth-journey-1 --expect-project bank-auth-journey` | 0 | `project bank-auth-journey: 1/1 passed`; not stale |

What the two projects reach that the default suite does not: `bank-auth` posts a synthetic token to the `identity-callback` function and reads back its magic link, whose redirect target is now `${SITE_URL}/contestant`; the journey walks `/contestant/preregister` through the mock issuer and `/api/oidc/callback` to the pages under `contestant/preregister/`, and its `preregister()` step posts to `/api/contestant/preregister`.

**Restore** (`tests/e2e-runs/170-e2e/170-02-bankauth.restore.txt`): `yarn db:stop` exit 0, `yarn db:start` exit 0; the edge-runtime container running; `OPTIONS` 200 for `identity-callback`, `invite-candidate` and `send-email`; `IDENTITY_PROVIDER_ISSUER` in the restored container back to the default (`https://openvaa.test.idura.broker`); ports 5273, 8777 and 9443 free. `restore: OK`.

**After the driver:**

| Check | Result |
|---|---|
| `bash PD/170-allowlist-probe.sh after` | exit 0, ten rows OK; the container line is the new list. The restore recreated the auth container and it still carries the new allowlist |
| `docker ps --format '{{.Names}}'` | identical to the list before the plan's first restart: the thirteen `supabase_*_openvaa-local` containers, among them `supabase_edge_runtime_openvaa-local`, and `my-redis` |
| Listeners on 5173, 5273, 8777, 9443 | none |
| `git status --porcelain -- . ':(exclude).planning'` | `?? CAND-APP-PLAN.md` and nothing else: no generated value reached the repository |
| The scratch directory | removed by the driver's exit trap |
| Function server, mock issuer, JWKS server | no such process alive |

One process on this host is not this plan's and was left alone: a Vite dev server on port 5199 that was running before the plan started.

### 3.7 Red runs

None. The gate set and the full E2E run were each made once, on the committed tree, and were green.

## 4 Plan 3

Measured 2026-10-05. Start revision `91cb8087d57a34e41180b3eb9152868bf20843d7` (`PD/evidence/plan-03-start-rev.txt`).

### 4.1 Re-measurement before the move (Task 1, step 1)

| What | Command | Output |
|---|---|---|
| Tracked test paths carrying the name | `git ls-files tests \| grep -i candidate \| wc -l` | **26**: 14 under `fixtures/candidate/`, 4 under `setup/candidate/`, 4 under `specs/candidate/` (three specs and `.gitkeep`), `specs/a11y/candidate-a11y.spec.ts`, `utils/candidateJourneyConstants.ts`, the two preview baselines |
| Distinct app test ids in source | `git grep -h -o -E "data-testid=(\"\|'\|\{['\"\`])candidate-[A-Za-z0-9-]*" -- apps/frontend/src \| sed -E "s/.*(candidate-[A-Za-z0-9-]*)/\1/" \| sort -u \| wc -l` | **34**, in 8 files: `ContestantNav.svelte` and seven pages under `routes/contestant/` (`(protected)/+page`, `preview`, `profile`, `questions`, `questions/[questionId]`, `help`, `privacy`) |
| The same at the base revision | the same command with `<base-rev>` | **34** |
| Raw-string `getByTestId` uses outside the registry | `git grep -n -o -P "getByTestId\(['\"\`]candidate-[a-z0-9-]*" -- tests` | 10 sites: 1 in `candidateHomePage.fixture.ts`, 3 in `candidateQuestionsOverviewPage.fixture.ts`, 6 in `candidate-journey.spec.ts` (five of them `candidate-nav-*`) |
| The default suite, enumerated | `yarn playwright test -c ./tests/playwright.config.ts --list --grep-invert @probe` | exit 0; `Total: 171 tests in 99 files`, 100 projects |
| The three renamed spec projects, enumerated with their dependencies | the same with `--project candidate-journey --project candidate-a11y-scan --project cold-entry-dataroot-candidate` | exit 0; `Total: 21 tests in 8 files`; `candidate-journey` 1, `candidate-a11y-scan` 14, `cold-entry-dataroot-candidate` 1 |
| Per project, in the full listing | counted from the listing | `candidate-a11y-scan` 14, `candidate-journey` 1, `cold-entry-dataroot-candidate` 1, `data-setup-candidate-journey` 1, `data-teardown-candidate-journey` 1 |
| Blob ids of the two preview baselines | `git ls-files -s tests/tests/specs/visual/__screenshots__/` | `402f4bf8d8af61bfc2db5fac26d4df25d8acbebc` (desktop), `8878188644373d9a6069c98b46819d4be546f2a5` (mobile) — the ids of section 1.3 |

### 4.2 Dry run and review (Task 1, step 2)

`node PD/rename.mjs --plan 3` → `total: 915 rewrite(s) in 78 file(s); 26 path(s) would move`.

Per rule: P3-01 28, P3-02 18, P3-03 2, P3-04 77, P3-05 41, P3-06 4, P3-07 5, P3-08 8, P3-09 127, P3-10 135, P3-11 315, P3-12 68, P3-13a 4, P3-13b 9, P3-13c 13, P3-14 16, P3-15a 4, P3-15b 3, P3-15c 6, P3-15d 3, P3-15e 3, P3-16a 3, P3-16b 8, P3-17 15.

Read with `--rule`, every match outside `tests/`:

- **P3-09** (37 outside `tests/`): 36 `data-testid` attributes in the eight source files, and one comment in `packages/dev-seed/src/templates/e2e/perm/perm-hide-hero.ts` that cites the test id `candidate-questions-hero`. Inside `tests/` the matched tokens are the 34 ids, the three stem templates (`candidate-home-{…}`, `candidate-nav-*`), the prose `candidate-home route`, and one citation of a spec file that is not in the tree (`candidate-profile-validation.spec.ts`). None names the entity.
- **P3-12** (2): the import alias `CandidateLogoutButton` and its one use in `apps/frontend/src/lib/layouts/main/Banner.svelte`. It aliases the app's own `LogoutButton` from `$contestant/components/logoutButton`.
- **P3-13a**, **P3-13b**: no match outside `tests/`.
- **P3-13c** (13, **all outside `tests/`**): nine in `supabaseDataWriter.test.ts` (the local helper `setupCandidateSession`, declared twice) and four comment mentions in dev-seed templates of `mintCandidateSession` and `candidateSessionMinter`, helpers that exist nowhere in the tree. Applied as ruling 3 and the plan's artifact list state; put to the operator in section 7.
- **P3-14**, **P3-15d**, **P3-04**: the sibling-prefix constant in `appGates.test.ts`, the gate's spec-path constant, the load alias `candidateLoad` in `routes/admin/layout.server.test.ts`, and two citations of the journey project.
- **P3-10** leaves every `testIds.voter.…` member alone: its one match on a line under `specs/voter/` is `testIds.candidate.questions.list` in `cold-entry-dataroot.spec.ts`. `testIds.voter.results.candidateSection` occurs at 10 sites before and after.

No row was tightened in this plan.

### 4.3 The three commits of the rename (Task 1, steps 3 to 7)

| Commit | What | Check |
|---|---|---|
| `d025b96a6` | pure move, 26 paths | `node PD/rename.mjs --plan 3 --moves` printed 26 pairs and no collision, every one in the expected families. Before the commit: `git -c diff.renameLimit=1 diff --cached -M100% --name-status \| awk '$1 != "R100"'` prints nothing, `--shortstat` is `26 files changed, 0 insertions(+), 0 deletions(-)`, and none of the three old directories exists on disk. After: `git show -M100% --name-status --format= d025b96a6 \| awk '$1 != "R100"'` prints nothing; `git show --stat -M100% --format=` ends `26 files changed, 0 insertions(+), 0 deletions(-)` |
| `705c2eb50` | content, 78 files, 764 insertions and 764 deletions | `node PD/rename.mjs --plan 3 --apply` → `915 rewrite(s) in 78 file(s) WRITTEN`, plus the hand edits of residue log row 15 |
| `f0f221eff` | formatter output, 3 files | `yarn lint:fix` (exit 0) then `yarn format` (exit 0): two statements reflowed in `contestantHomePage.fixture.ts` and `contestantQuestionsOverviewPage.fixture.ts`, three tables re-aligned in `tests/README.md`; and residue log row 16. The unrelated autofix in `tests/tests/support/mockOidcIssuerEntry.ts` was proposed again and dropped again |

**Hand edits and checks of step 5.**

- `tests/tests/utils/testIds.ts`: the namespace key is `contestant: {`; `voter: {` is still there. Two comments in the file cite a member by its namespace path (`candidate.passwordSetter.confirm`, `candidate.profile.imageUpload`); both now name `contestant.…`, since the path they cite changed.
- `tests/playwright.config.ts`, read after the apply: the five project names once each, `testDir: './tests/specs/contestant'` three times, the `testMatch` regular expressions `/contestant-a11y\.spec\.ts/`, `/contestant-bank-auth\.spec\.ts/`, `/contestant-bank-auth-journey\.spec\.ts/`, `/contestant-journey\.(setup\|teardown\|spec)\.ts/`, the tag in `grep` and in `grepInvert`, and every `dependencies` and `teardown` string. No quoted project name, regular expression or tag holding `candidate` or `cand-` is left in the file.
- The screenshot arguments are `contestant-preview-desktop.png` and `contestant-preview-mobile.png`; both files exist under `__screenshots__/visual-regression.spec.ts/`.
- The notification markers agree: `[notif-contestant]` and `[notif-contestant-content]` in the dev-seed template, `[notif-contestant]` five times in the spec.
- `node scripts/assert-a11y-scan-wiring.mjs` → exit 0, `0 violation(s)`.

**Working-tree checks before the content commit**, after `yarn dev:clean` (exit 0):

| Command | Exit | Result |
|---|---|---|
| `yarn typecheck:tests` | 0 | |
| `yarn eslint tests` | 0 | 0 errors; the one warning is the unused directive of residue log row 6 |
| `node scripts/assert-a11y-scan-wiring.mjs` | 0 | |
| `yarn workspace @openvaa/frontend check` | 0 | 0 errors, 0 warnings |
| `yarn workspace @openvaa/dev-seed test:unit` | 0 | 66 files, 901 tests |
| `yarn workspace @openvaa/frontend test:unit src/lib/routes/ src/routes/admin/ src/lib/api/adapters/supabase/dataWriter/` | 0 | 12 files, 263 tests |
| `yarn playwright test -c ./tests/playwright.config.ts --list --grep-invert @probe` | 0 | `Total: 171 tests in 99 files` — the total of section 4.1 |

The per-project counts of the two listings were compared with the project names normalised: identical for all 100 projects.

### 4.4 Task 1 verify commands and acceptance criteria, on the committed tree

Both `<automated>` blocks exited 0: `rename.mjs --check --plan 3` (`0 rewrite(s) in 0 file(s), 0 move(s), 0 collision(s) pending`), the three old directories absent, the a11y gate, `typecheck:tests`, `170-verdict.mjs baselines`; then the listing of the three renamed spec projects (`Total: 21 tests in 8 files`), `yarn eslint tests` and svelte-check.

| Criterion | Measured |
|---|---|
| The pure-move commit lists only `R100` rows, 0 insertions and 0 deletions | section 4.3 |
| The five project names and the spec directory in the config | each `name:` string once; `testDir: './tests/specs/contestant'` three times |
| `contestant: {` and `voter: {` in `testIds.ts` | 1 and 1 |
| Distinct `contestant-…` ids in the eight source files equal the `candidate-…` ids at the base revision | **34** and **34**; 0 `candidate-…` test id left in `apps/frontend/src` |
| No test-id line changed under `routes/(voters)` or `lib/components` | `git diff -U0 <plan-03-start-rev> HEAD -- 'apps/frontend/src/routes/(voters)' apps/frontend/src/lib/components` is empty |
| The enumerated total equals the total at the start | 171 and 171 |
| `assert-no-candidate-app-names.mjs --report --only tests` | exit 0; `0 finding(s) (tests 0)` — none anywhere, the generated docs subtrees included |

### 4.5 The closing gate set (Task 2)

Two runs, because the tree changed between them (section 4.7). Both started in the background with an exit marker; both markers hold **0**.

| Row | `170-03-close` (head `f0f221eff`) | `170-03-close-r2` (head `d21e837ef`) |
|---|---|---|
| build | 0 | 0 |
| typecheck | 0 | 0 |
| lint | 0 | 0 |
| format | 0 | 0 |
| check-frontend | 0 | 0 |
| check-docs | 0 | 0 |
| unit | 0 | 0 |
| build-frontend | 0 | 0 |
| build-docs | 0 | 0 |
| docs-links | 0 | 0 |
| skill-links | 0 | 0 |
| idempotent | 0 | 0 |
| residue | 0 | 0 |
| exemptions | 0 | 0 |

`170-03-close`: 20:07:01Z to 20:09:53Z. `170-03-close-r2`: 20:24:15Z to 20:27:05Z. Node v24.21.0, `TURBO_FORCE=true`. The verdict is read from the second run, the one made on the tree the plan closes on:

- **lint.** The row runs the a11y wiring gate (`A11y-scan wiring guard … — 0 violation(s).`) and `eslint tests`.
- **unit.** Frontend 2037 tests in 130 files, as at the plan-2 close.
- **residue.** Groups `symbols,urls,tests`: 0 findings remain; 70 lines under the generated docs subtrees set aside (symbols 42, urls 28, **tests 0**). **Carried to plan 170-04: 70 lines.**
- **docs-links.** `validate:links --check` itself exits 1 with the same 15 `github-path` findings under `frontend/components/generated/`. **Carried to plan 170-04: 15 findings.**
- **idempotent.** `rename.mjs --check --plan 3: 0 rewrite(s) in 0 file(s), 0 move(s), 0 collision(s) pending`.
- **exemptions.** `get_candidate_user_data` 51 occ / 15 files and `invite-candidate` 73 occ / 32 files / 10 paths at the base revision and at HEAD.
- **skill-links.** Dangling 222 (baseline 222); `audit-skill-links.sh components` exit 0.

`node PD/170-verdict.mjs gates 170-03-close` → exit 0 (resolved to `170-03-close-r2`; 14 rows expected, 14 recorded; not stale).

### 4.6 The closing E2E run (Task 2)

| Run | Head | Marker | total | passed | failed | flaky | skipped | didNotRun |
|---|---|---|---|---|---|---|---|---|
| `170-01-baseline` | | 0 | 171 | 171 | 0 | 0 | 0 | 0 |
| `170-03-close` | `f0f221eff` | **1** | 171 | 164 | **1** | 0 | 0 | **6** |
| `170-03-close-r2` | `d21e837ef` | **0** | **171** | **171** | 0 | 0 | 0 | 0 |

`170-03-close-r2`: run directory `tests/e2e-runs/170-e2e/170-03-close-r2`, port 5273, `--no-db-reset`, wrapper exit 0, one preflight success and no preflight failure, 20:27:10Z to 20:32:13Z (4.4 min), 100 projects.

Each renamed project beside its old name in the baseline:

| New name | passed / total | Old name, in `170-01-baseline` | passed / total |
|---|---|---|---|
| `contestant-journey` | 1 / 1 | `candidate-journey` | 1 / 1 |
| `data-setup-contestant-journey` | 1 / 1 | `data-setup-candidate-journey` | 1 / 1 |
| `data-teardown-contestant-journey` | 1 / 1 | `data-teardown-candidate-journey` | 1 / 1 |
| `contestant-a11y-scan` | 14 / 14 | `candidate-a11y-scan` | 14 / 14 |
| `cold-entry-dataroot-contestant` | 1 / 1 | `cold-entry-dataroot-candidate` | 1 / 1 |

No project name holding `candidate` is in the run's `byProject`.

`node PD/170-verdict.mjs e2e 170-03-close --same-total-as 170-01-baseline` with the five `--renamed-project` pairs → exit 0 (resolved to `170-03-close-r2`; not stale). `node PD/170-verdict.mjs baselines` → exit 0. `git status --porcelain tests/tests/specs/visual/__screenshots__/` prints nothing after the run. Nothing listened on port 5273 afterwards.

### 4.7 Red runs

**One: E2E `170-03-close`, at head `f0f221eff`.** Marker 1, wrapper exit 1; 171 total, 164 passed, 1 failed, 6 did not run. The gate set on the same head was green.

- **The failing test:** project `voter-results-redraw`, `tests/tests/specs/voter/voter-results-redraw.spec.ts`, "scroll survives entity open, entity close and an entity-tab switch, and neither subtree remounts", at the first step: `the page scrolled when the entity drawer opened (document height 2127 -> 2114 …)`, expected `1095`, received `1394`.
- **The six that did not run:** `data-setup-perm-closed-project` (1) and `perm-closed-project` (5). The closed-project trio depends on every other project, so one failure upstream keeps it from running.
- **Not the rename.** The spec, its fixtures and every page it drives are untouched by this plan's commits; the application files the plan changed are `data-testid` values on the contestant app's pages and navigation, and an import alias in `Banner.svelte`.

**Root cause, from the failing run's own trace** (`tests/playwright-results/…/trace.zip`, read with a scratch script):

1. The walk to `/results` ends with the fixture selecting the first election (click landed at 15.238 s of the trace).
2. The test read its baseline 253 ms later (15.491 s: `y` 1095, height 2127) and started its click on the card title at 15.499 s.
3. The click's log: `element is not stable` at 15.550, 15.594 and 15.652 s, each followed by `retrying click action`; `element is visible, enabled and stable` at 15.779 s; `scrolling into view if needed`; click at 15.783 s.
4. The screencast frames show the cards creeping upward between 15.55 and 15.77 s, and the frame after the click shows the clicked card at the top of the viewport with the document at its end.
5. `1394 = 2114 − 720`: the received offset is the document's maximum scroll offset at a 720 px viewport.

Playwright 1.63.0 (`node_modules/playwright-core/lib/coreBundle.js`, `_retryPointerAction`) picks the pre-click scroll from `[undefined, { block: 'end' }, { block: 'center' }, { block: 'start' }][retry % 4]`, and the retry counter advances on a `not stable` result as on any other. The fourth attempt therefore called `scrollIntoView({ block: 'start' })` on the title, which scrolled the page to its end — after the baseline had been read. The assertion compared the application against a baseline the harness had invalidated.

**What was moving, re-tested in isolation** (run `tests/e2e-runs/170-e2e/170-03-redraw-probe-1`, project `voter-results-redraw` alone, the spec carrying a temporary probe that was not committed; wrapper exit 0, 7 passed). At the instant the test would begin:

| Reading | Before any settle | After the document's finite animations finished | Two frames later |
|---|---|---|---|
| Finite animations running | **28** | 0 | 0 |
| `scrollHeight` | 3742 | 3684 | 3684 |
| Document offset of the fourth card's title | 1465 | 1407 | 1407 |

The 28: four on the de-selected election option (67 ms left), 21 on the pseudo-elements of the navigation's document View Transition (233 ms left), two on a `div` (317 ms left), and one on the `<p>` "Select an election first" (383 ms left — its `transition:slide` at the default 400 ms, in `results/[[electionTab]]/+layout.svelte`). The option and the placeholder sit above the list and shrink as they slide out, so every card moves upward: 58 px in total in that run. The diagnosis is confirmed in both halves — the layout moves for about 400 ms after the landing, and a retried click scrolls.

**Fix, `d21e837ef`:** the test awaits the document's finite animations (`awaitAnimationsSettled`, the helper the a11y specs use) before its scrolled start. One import and one statement with its comment; nothing in the application changes. It was not re-run on an unchanged tree: the gate set and the E2E run were both made again on the fixed head under new labels and are the runs the verdicts read.

**What the fix does not claim.** The rate of the failure before the fix is not measured: it occurred once in the four default-suite runs made before the fix (`170-01-baseline`, `170-01-close`, `170-02-close`, `170-03-close`) and not in the isolated run. The second green run does not by itself measure the rate after it either. What is measured is the mechanism: before the settle the target is moving, after it nothing is, and the click that scrolled was a retried one. A click retried for any other reason would scroll the same way. The test's other click, the tab switch, follows a drawer close rather than a selection and was not changed.

### 4.8 The in-container visual run against the moved baselines (Task 3, D-19 (ii))

Made at head `f23b5b36b`, whose tree outside `.planning/` is the tree of `d21e837ef`. No E2E run was in flight.

**Preconditions.**

| Check | Result |
|---|---|
| `docker info` | exit 0 |
| `docker image inspect "mcr.microsoft.com/playwright@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27" --format '{{.Architecture}} {{.Os}}'` (the `PW_IMAGE` default of `tests/scripts/visual-container.sh`) | exit 0, `amd64 linux`; image id `sha256:2c1f4e0fd6450f43ddb46d60c2a6df30855a8588e165b1f2559fb0eda8d7ff35` |
| Listener on 5173 | none, so the script's default port was used. Port **5173** |

**Host recipe, in order.**

| Step | Exit | Notes |
|---|---|---|
| `yarn build` | 0 | 14 tasks |
| `yarn db:reset` (background, marker `tests/e2e-runs/170-gates/170-03-db-reset-1.exit`) | 0 | started 20:35:19Z; `Reset local database.` |
| `GET http://127.0.0.1:54321/storage/v1/bucket` | 200 on the first poll (20:36:06Z) | lists `public-assets` and `private-assets`; `GET /rest/v1/` 200 |
| `yarn db:seed --template e2e/base` | 0 | 143 rows |
| `yarn dev:clean` | 0 | |
| `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2 yarn workspace @openvaa/frontend dev --host 0.0.0.0`, in the background in its own process group, output in `tests/e2e-runs/170-e2e/170-03-visual.dev.log` | listening on `*:5173` | `GET /` → 200, and the page publishes `data-project-id="00000000-0000-0000-0000-0000000000e2"` |

The service-role key the bucket poll needs was taken from `supabase status -o env` into a shell variable and not printed; `.env` was not read.

**The run.** `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/170-e2e/170-03-visual`, in the background; marker `tests/e2e-runs/170-e2e/170-03-visual.exit` holds **0**. No update flag: `update-snapshots` occurs 0 times in the run's `pw-args.txt` and `docker-argv.txt`. Playwright's arguments were `test -c tests/playwright.config.ts --project=visual-regression --workers=1 --retries=0 --reporter=html,json`.

| File | Content |
|---|---|
| `status` | `0` |
| `observed.txt` | `observed_workers=1`, `observed_retries=0`, `observed_expected=7`, `observed_unexpected=0`, `observed_flaky=0`, `observed_skipped=0`, `observed_duration_ms=68981` |
| `provenance.txt` | `uname_m=x86_64`, Ubuntu 24.04.4 LTS, Node v24.20.0 inside the container |
| `results.json` | seven tests, all `expected`: `data-setup-base`, `auth-setup`, four `visual-regression` tests titled "screenshot matches baseline", `data-teardown-base` |
| `stdout.log` | one `E2E PREFLIGHT OK` line |

**After the run.** The dev server was stopped by its process group (`kill -TERM -- -<pgid>`); nothing listens on 5173, and no process of the group is left.

| Verdict | Exit | Output |
|---|---|---|
| `node PD/170-verdict.mjs visual 170-03-visual` | 0 | `observed: expected 7, unexpected 0, flaky 0, skipped 0` |
| `node PD/170-verdict.mjs baselines` | 0 | `desktop: blob 402f4bf8d unchanged (contestant-preview-desktop.png)`, `mobile: blob 887818864 unchanged (contestant-preview-mobile.png)` |
| `git status --porcelain tests/tests/specs/visual/__screenshots__/` | | prints nothing: the run compared against the moved baselines and wrote none |

`git ls-files -s tests/tests/specs/visual/__screenshots__/`:

```
100644 402f4bf8d8af61bfc2db5fac26d4df25d8acbebc 0	tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/contestant-preview-desktop.png
100644 8878188644373d9a6069c98b46819d4be546f2a5 0	tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/contestant-preview-mobile.png
100644 15dabda71245dbd8a975dfb6179932add208910e 0	tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-desktop.png
100644 78d8fad28d06d7d550bf006a9d544f4e8f76e6a3 0	tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-mobile.png
```

The two preview ids are those of section 1.3 under the old names. There was no pixel difference and no red visual run.

**The database, left neutral.** `yarn db:reset` once more (background, marker `tests/e2e-runs/170-gates/170-03-db-reset-2.exit`): **0**, started 20:38:34Z. `GET /storage/v1/bucket` → 200 on the first poll (20:39:05Z); `GET /rest/v1/` → 200. Read back through REST with the service role: `projects` holds one row, `00000000-0000-0000-0000-000000000001`, and `elections` is empty — migrations plus `seed.sql`.

**The database was reset twice in this task. Whatever the local database held before is gone:** the E2E project's row and anything a developer had seeded into the default project. The first reset is what the recorded visual recipe requires; the second removes the rows `db:seed --template e2e/base` wrote into the default project and whatever the visual project's setup and teardown left. The next E2E run creates the E2E project again in its global setup.

**The stack afterwards.** `docker ps`: the thirteen `supabase_*_openvaa-local` containers and `my-redis`, as before the plan. `bash PD/170-allowlist-probe.sh after` → exit 0: the auth container the resets recreated still carries the new allowlist. Nothing listens on 5173, 5273, 8777 or 9443. The Vite dev server on port 5199 that belongs to another session was not touched.

## 5 Plan 4

Measured 2026-10-05. Start revision `55fe8a84462314ac6c0a8e1b600cff514fa5573c` (`PD/evidence/plan-04-start-rev.txt`). Every gate, the six bank-auth runs and the closing E2E run were made on head `e222a9b884b639359bf98bf82d686a19a7fb30a4`, the last commit of the plan that touches anything outside `.planning/`.

### 5.1 Re-measurement before any edit (Task 1, step 1)

`node scripts/assert-no-candidate-app-names.mjs --report` → exit 0, `2689 tracked file(s) scanned; 292 finding(s) (symbols 42, urls 28, tests 0, prose 222)`.

| Group | Findings | Outside the two generated docs subtrees |
|---|---|---|
| symbols | 42 | **0** |
| urls | 28 | **0** |
| tests | 0 | **0** |
| prose | 222 | 218 |

Groups `symbols`, `urls` and `tests` show findings only under `frontend/components/generated/`, as plan 3 left them. The 70 lines and the 15 docs-link findings the gate rows set aside for plans 1 to 3 are those.

### 5.2 SQL comments, the migration mirror and the local database (Task 1)

**Dry run for the SQL paths.** `node PD/rename.mjs --plan 4 --paths apps/supabase/supabase/schema/ apps/supabase/supabase/seed.sql apps/supabase/supabase/tests/database/` → `7 rewrite(s) in 5 file(s)`; P4-01 2, P4-02 5; no path would move. Every match read with `--rule`:

| File | Matches | What the line is |
|---|---|---|
| `schema/106-app-settings.sql` | 1 (`candidate-app FAQ`) | a `--` comment line |
| `schema/302-rls.sql` | 2 (`voter and candidate apps`, `candidate app also submits feedback`) | two `--` comment lines |
| `seed.sql` | 2 (`candidate-app session`, `the candidate app resolves`) | two `--` comment lines |
| `tests/database/19-entity-immutability.test.sql` | 1 (`the candidate application's hottest write`) | a `--` comment line |
| `tests/database/22-content-policies.test.sql` | 1 (`from the candidate app`) | a pgTAP description string: it changes the text the test prints and nothing it asserts |

No match sits in executable SQL. Under `schema/` and in the regenerated migration every changed line begins with `--` (6 removed, 6 added, classified by command).

| Step | Command | Exit | Result |
|---|---|---|---|
| Apply | the same command with `--apply` | 0 | `7 rewrite(s) in 5 file(s) WRITTEN` |
| Mirror | `yarn schema:regenerate` | 0 | `26 schema file(s) -> 6372 line(s)`; the migration's diff is the same three comment lines |
| Parity | `node scripts/assert-schema-migration-parity.mjs` | 0 | `generated copy is current` |
| Apply locally | `yarn db:reset`, background, marker `tests/e2e-runs/170-gates/170-04-db-reset.exit` | **0** | 20:45:24Z to 20:45:53Z |
| Storage | `GET /storage/v1/bucket` with the service-role key read from `supabase status -o env` into a shell variable | | 200 on the first poll (20:46:12Z) |
| Types | `yarn db:types`, then `git status --porcelain packages/supabase-types` | 0 | prints nothing: the generated types are unchanged |
| SQL lint | `yarn db:lint:sql` | 0 | `0 error(s), 3 warning(s)`; the three warnings are the advisor's "Foreign keys without indexes" rows, none on an object the comments touch |
| pgTAP | `yarn workspace @openvaa/supabase test:db`, background, marker `170-04-pgtap-task1.exit` | **0** | `Files=36, Tests=1335`, `Result: PASS` |

Commit `edba1482d` (`docs[db]…`): six files, all under `apps/supabase/supabase/`, 10 insertions and 10 deletions. `node PD/170-verdict.mjs exemptions` → exit 0 (51 / 15 and 73 / 32 / 10 at both revisions). `git diff <plan-04-start-rev> HEAD --stat -- packages/supabase-types` prints nothing.

**The local database was reset.** Whatever it held is gone; plan 3 had already left it at migrations plus `seed.sql`.

### 5.3 The docs section, the prose phrase and the agent docs (Task 2)

**Dry run and review.** `node PD/rename.mjs --plan 4` over the tree after 5.2 → `205 rewrite(s) in 109 file(s); 5 path(s) would move`: P4-01 57 in 36 files, P4-02 148 in 87 files. With the SQL paths the plan's two rows made 212 rewrites in 114 files.

- **Every P4-02 match ending in "application" was read (7).** All mean the app: a docs heading in `about/features`, two README sentences under `lib/contestant/` and `routes/contestant/`, the help page's component docstring, and three lines of `contestant-a11y.spec.ts` (two comments and one assertion message). None is a candidate's application to stand.
- **No match under `apps/frontend/messages/` or a `publishers-guide` directory for P4-02** (0). P4-01 has one match in the publishers' guide: the link `/developers-guide/candidate-app/bank-authentication` in `app-settings/+page.md`, which must follow the section.
- **Matches that are not comments or docs prose** (read line by line): the six route strings and the section title in `navigation.config.ts`, four `redirect(308, …)` targets, seven log-message prefixes in four route files (`[Candidate App protected layout]` and the like); in unit tests one test title, four test-table labels and two assertion messages; in the suite two Playwright test titles (`perm-access-disable.spec.ts`, `perm-question-video.spec.ts`), one setup error message and one assertion message. No identifier, selector, key or URL of the application is among them. The enumerated E2E total is unchanged (5.7).
- No row was tightened.

**The pure move.** `node PD/rename.mjs --plan 4 --moves` printed five pairs and no collision: the five pages of `developers-guide/candidate-app/` to `developers-guide/contestant-app/`, and no other path. Commit `fc309c010`: `git show -M100% --name-status --format= fc309c010 | awk '$1 != "R100"'` prints nothing; `5 files changed, 0 insertions(+), 0 deletions(-)`; the old directory does not exist. `candidate-user-management/` was not renamed (ruling 18) and no redirect stub was left at the old section URL.

**The docs site after the apply.**

| Check | Result |
|---|---|
| `navigation.config.ts` | title `'Contestant app'`; six routes under `/developers-guide/contestant-app` (the section and its five pages) |
| The five redirect stubs | four target `/developers-guide/contestant-app/{pre-registration-and-invitation,password-validation,registration,login-and-password-reset}`, the fifth `/developers-guide/development/seed-data`; each target's `+page.md` exists |
| `yarn workspace @openvaa/docs generate:docs`, background, marker `170-04-generate-docs.exit` | **0** |
| Generated pages | 7 under `…/components/generated/contestant/components/`, 1 under `…/generated/dynamic-components/navigation/contestant/ContestantNav/`; the 8 pages under the two old generated directories removed (`git rm -r`); 0 tracked paths remain there |
| The generator's diff of `navigation.config.ts` | exactly the title and the six route strings; no "New" or "Removed" marker (assumption A3 holds) |
| The regenerated listing, read | the source directory, the section heading `### Contestant App Components`, eight links and eight import lines; nothing else |
| The regenerated route map, read | `candidate/` → `contestant/` twice, and the `api/` subtree redrawn: `auth/` holds `callback/` and `logout/`, `contestant/` holds `preregister/` |
| Six other generated pages changed | each by one line the source already carried: `contestantApp.common.…` keys in four usage examples, `ContestantContext` in one docstring, the `DrawerHost` docstring |
| `yarn workspace @openvaa/docs validate:links --check` | exit **0**, `Total findings: 0` — strict, nothing set aside |
| `yarn workspace @openvaa/docs check` | exit 0; 696 files, 0 errors, 0 warnings |
| R8: the auth endpoints in the docs | `deployment/+page.md`: "allow `<frontend origin>/api/auth/callback` as a redirect URL"; `backend/authentication`, `backend/email` and three pages of the section name `/api/auth/callback`; `login-and-password-reset` names `/api/auth/logout` with `signOut({ scope: 'local' })`. `git grep -E 'api/candidate' -- apps/docs` prints nothing |

**Agent docs, read across the whole phase** (`git diff <base-rev> HEAD -- CLAUDE.md .claude .agents ROADMAP.md tests/README.md tests/IDURA-TEST-RUNBOOK.md`, 19 files). Every hunk is a substitution that leaves its statement true. One statement the rename had made false was corrected by hand: `CLAUDE.md` listed the context-provider directories as "app, voter, candidate, …" (residue log row 18). `.agents/` holds no match. `CLAUDE.md` contains `$contestant`, `getContestantContext()` and `apps/frontend/src/routes/contestant/`.

| Check | Exit | Result |
|---|---|---|
| `bash .claude/scripts/audit-skill-links.sh components` | 0 | `Checked: 30  Dangling: 0  Skipped: 14` |
| `bash .claude/scripts/audit-skill-links.sh` | 1 | `Dangling: 222`, the baseline's number |
| `diff -r .claude/skills/ship-review-stack/sources/ .planning/phases/151-ship-v0-2-akita-review-stack/scripts/` | 0 | prints nothing |

**What did not change.**

| Check | Exit | Result |
|---|---|---|
| `git diff <base-rev> HEAD -- 'apps/docs/src/routes/(content)/publishers-guide'` | | four changed lines: three settings keys (`contestantApp` twice as a list item, once as a heading) and the one link. No prose |
| `node PD/catalogue-identity.mjs --base <base-rev>` | 0 | 595 keys compared in each of seven locales; identical through the key mapping |
| `yarn workspace @openvaa/docs check:research-quotes --base <base-rev>` | 0 | 22 spans, all identical to the base |
| Root `package.json` | | unchanged by this task |

**Commits.** `165c76d94` (content: 130 files, 342 insertions, 344 deletions) and `aa2c20753` (formatter output: 8 files — seven docs pages whose tables re-aligned, and one assertion in `contestant-a11y.spec.ts` wrapped). `generate:docs` ends with the docs workspace's formatter, which had reflowed those seven hand-written pages; they were set back to the codemod's output before the content commit so the reflow is in the formatter commit alone (residue log row 21). `yarn lint:fix` proposed the unrelated autofix in `mockOidcIssuerEntry.ts` a fourth time; dropped.

### 5.4 The search gate: residue pass, wiring and negative control (Task 3)

**Residue pass.** After 5.3, `node scripts/assert-no-candidate-app-names.mjs` → exit **0**, `0 finding(s) (symbols 0, urls 0, tests 0, prose 0)`. The pass found nothing: no tree edit, no map row, no anchor change and no commit. The gate's source and its two fixture files are byte-identical to the plan's start revision (`git diff --stat <plan-04-start-rev> HEAD -- scripts/assert-no-candidate-app-names.mjs scripts/fixtures/ PD/rename.map.mjs` prints nothing). The exemption list holds exactly two entries, each on one line: `/get_candidate_user_data/g, // the user-data RPC — see phase 173` and `/invite-candidate/g // the invitation Edge Function — see phase 174`.

**Wiring.** Root `package.json`: the script `"assert:no-candidate-app-names": "node scripts/assert-no-candidate-app-names.mjs"`, and `&& yarn assert:no-candidate-app-names` directly after `yarn assert:comment-hygiene`. The chain has 20 links and the gate is link 8.

**Statements about the chain.** Searched the tracked tree outside `.planning/` for the chain's length, a link's position or a list of its gates. Two statements cited `assert:schema-migration-parity` as "link 12" and now say link 13: `.claude/skills/database/SKILL.md` and `apps/supabase/README.md`. The components skill's "link 6" (`assert-a11y-scan-wiring`) is still true. No docs page lists the chain's text gates, and every wiring test under `packages/dev-seed/tests/` asserts membership, never position or length.

**Negative control.**

| Step | Command | Exit | Output |
|---|---|---|---|
| (a) clean tree | `node scripts/assert-no-candidate-app-names.mjs` | **0** | `0 finding(s)` |
| (a) | `node scripts/assert-no-candidate-app-names.mjs --self-test` | **0** | `81 finding(s) on the fixture, 81 expected` |
| (b) one comment line `// negative control: getCandidateContext` appended to `apps/frontend/src/lib/routes/route.ts` | `node scripts/assert-no-candidate-app-names.mjs` | **1** | `apps/frontend/src/lib/routes/route.ts:144: CandidateContext` |
| (b) | `yarn lint:check`, background, marker `tests/e2e-runs/170-gates/170-04-negctl-lint.exit` | **1** | the chain ran its first seven links green and stopped at the gate, with the same finding line and `1 finding(s) (symbols 1, …)` in its output — the wiring is live |
| (c) `route.ts` restored; the same line appended to `apps/supabase/supabase/functions/invite-candidate/index.ts` | `node scripts/assert-no-candidate-app-names.mjs` | **1** | `apps/supabase/supabase/functions/invite-candidate/index.ts:209: CandidateContext` — the exemption is a mask on one name, not a skipped directory |
| (d) both files restored | `git status --porcelain -- . ':(exclude).planning'` | | the uncommitted wiring (three files) and `?? CAND-APP-PLAN.md`, nothing else |
| (d) | `node scripts/assert-no-candidate-app-names.mjs` | **0** | `0 finding(s)` |

Commit `e222a9b88`: `package.json` and the two statements above. Then `node PD/rename.mjs --check --plan 4` → exit 0, `0 rewrite(s) in 0 file(s), 0 move(s), 0 collision(s) pending`.

### 5.5 The bank-auth projects, three consecutive runs each (Task 4)

Driver: `bash PD/170-bankauth.sh 170-04 3`, background; marker `tests/e2e-runs/170-e2e/170-04-bankauth.exit` holds **0**; log `170-04-bankauth.driver.log`; 20:56:43Z to 21:11:07Z. The driver was invoked as plan 2 left it and needed no change. The working tree was clean outside `.planning/` before and after.

| Project | Issuer read back from the serving container | Run | total / passed / failed / flaky / skipped / did-not-run | Project's own tests | Preflight OK / failed | Wrapper exit |
|---|---|---|---|---|---|---|
| `bank-auth` | `IDENTITY_PROVIDER_ISSUER=https://test-idp.example.com` (OPTIONS 200) | `170-04-bankauth-1` | 8 / 8 / 0 / 0 / 0 / 0 | 6 / 6 | 1 / 0 | 0 |
| | | `170-04-bankauth-2` | 8 / 8 / 0 / 0 / 0 / 0 | 6 / 6 | 1 / 0 | 0 |
| | | `170-04-bankauth-3` | 8 / 8 / 0 / 0 / 0 / 0 | 6 / 6 | 1 / 0 | 0 |
| `bank-auth-journey` | `IDENTITY_PROVIDER_ISSUER=https://127.0.0.1:9443` (OPTIONS 200) | `170-04-bankauth-journey-1` | 131 / 131 / 0 / 0 / 0 / 0 | 1 / 1 | 1 / 0 | 0 |
| | | `170-04-bankauth-journey-2` | 131 / 131 / 0 / 0 / 0 / 0 | 1 / 1 | 1 / 0 | 0 |
| | | `170-04-bankauth-journey-3` | 131 / 131 / 0 / 0 / 0 / 0 | 1 / 1 | 1 / 0 | 0 |

All six run directories are under `tests/e2e-runs/170-e2e/`, each with head `e222a9b88`. The three runs of each project were consecutive and all green; no run was dropped or repeated. The counts are those of plan 2's single runs (8 and 131). Each `node PD/170-verdict.mjs e2e <label> --expect-project <project>` → exit 0, not stale.

**Restore** (`170-04-bankauth.restore.txt`): `yarn db:stop` exit 0, `yarn db:start` exit 0; the edge-runtime container running; `OPTIONS` 200 for `identity-callback`, `invite-candidate` and `send-email`; the restored container's issuer back to the default (`https://openvaa.test.idura.broker`); ports 5273, 8777 and 9443 free; `restore: OK`.

| After the driver | Result |
|---|---|
| `bash PD/170-allowlist-probe.sh after` | exit 0, ten rows OK; `GOTRUE_URI_ALLOW_LIST=https://127.0.0.1:3000,http://localhost:5173/api/auth/callback,http://localhost:5173/*/api/auth/callback` |
| Listeners on 5173, 5273, 8777, 9443 | none |
| `docker ps` | the thirteen `supabase_*_openvaa-local` containers, healthy, and `my-redis` |
| `git status --porcelain -- . ':(exclude).planning'` | `?? CAND-APP-PLAN.md` and nothing else |
| The scratch directory; function server, mock issuer, JWKS server | removed; no such process alive |

### 5.6 The closing gate set (Task 5)

`bash PD/170-gates.sh 170-04-close --plan 4 --db`, background; marker `tests/e2e-runs/170-gates/170-04-close.exit` holds **0**; 21:11:26Z to 21:14:29Z; Node v24.21.0, `TURBO_FORCE=true`; head `e222a9b88`. A first gate set on the same head, `170-04-pre` (20:53:20Z to 20:56:22Z, marker **0**), was made before the bank-auth runs so that a red row would not cost six runs; it is not the closing run and its sixteen rows are the same.

| Row | `170-04-pre` | `170-04-close` | Read from the closing run's log |
|---|---|---|---|
| build | 0 | 0 | |
| typecheck | 0 | 0 | |
| lint | 0 | 0 | `yarn lint:check`, now with the search gate: `No-candidate-app-names guard — 2689 tracked file(s) scanned; 0 finding(s)` |
| format | 0 | 0 | |
| check-frontend | 0 | 0 | |
| check-docs | 0 | 0 | |
| unit | 0 | 0 | 25 turbo tasks, 0 cached; frontend 2037 tests, dev-seed 901, as at the plan-3 close |
| build-frontend | 0 | 0 | |
| build-docs | 0 | 0 | |
| docs-links | 0 | 0 | `validate:links --check: exit 0`, `Total findings: 0` — the validator's own status, nothing set aside |
| skill-links | 0 | 0 | Dangling 222 (baseline 222); `audit-skill-links.sh components` exit 0 |
| idempotent | 0 | 0 | `rename.mjs --check --plan 4`: nothing pending |
| residue | 0 | 0 | groups `symbols,urls,tests,prose`: `0 finding(s) remain; 0 line(s) under the generated docs subtrees set aside` |
| exemptions | 0 | 0 | 51 / 15 and 73 / 32 / 10 at both revisions |
| pgtap | 0 | 0 | `Result: PASS` |
| sql-lint | 0 | 0 | `0 error(s), 3 warning(s)` |

`node PD/170-verdict.mjs gates 170-04-close` → exit 0 (16 rows expected, 16 recorded; not stale).

**Identity and service checks on the same head.** `node PD/catalogue-identity.mjs --base <base-rev>` → exit 0, seven `595 keys compared` lines. `node PD/170-verdict.mjs baselines` → exit 0 (blobs `402f4bf8d` and `887818864` unchanged). `bash PD/170-allowlist-probe.sh after` → exit 0.

### 5.7 The closing E2E run (Task 5)

`bash PD/170-e2e.sh 170-04-close`, background; marker `tests/e2e-runs/170-e2e/170-04-close.exit` holds **0**; run directory `tests/e2e-runs/170-e2e/170-04-close`, port 5273, `--no-db-reset`, wrapper exit 0, one preflight success and no preflight failure, 21:14:47Z to 21:19:50Z (4.5 min), 100 projects, head `e222a9b88`.

| Run | Head | Marker | total | passed | failed | flaky | skipped | didNotRun |
|---|---|---|---|---|---|---|---|---|
| `170-01-baseline` | | 0 | 171 | 171 | 0 | 0 | 0 | 0 |
| `170-04-close` | `e222a9b88` | **0** | **171** | **171** | 0 | 0 | 0 | 0 |

| New name | Total in `170-04-close` | Old name, total in `170-01-baseline` |
|---|---|---|
| `contestant-journey` | 1 | `candidate-journey` 1 |
| `data-setup-contestant-journey` | 1 | `data-setup-candidate-journey` 1 |
| `data-teardown-contestant-journey` | 1 | `data-teardown-candidate-journey` 1 |
| `contestant-a11y-scan` | 14 | `candidate-a11y-scan` 14 |
| `cold-entry-dataroot-contestant` | 1 | `cold-entry-dataroot-candidate` 1 |

No project name holding `candidate` is in the run's `byProject`. `node PD/170-verdict.mjs e2e 170-04-close --same-total-as 170-01-baseline` with the five `--renamed-project` pairs → exit 0. The verdict is read from the run's own `summary.json`.

### 5.8 The closing table

Everything below describes one tree, head `e222a9b88`. Later commits touch `.planning/` only, and each verdict checks tree equality outside `.planning/`.

| What | Label or command | Exit | Result |
|---|---|---|---|
| Gate set, 16 rows | `170-04-close` | 0 | every row 0 (5.6) |
| Search gate, alone | `node scripts/assert-no-candidate-app-names.mjs` | 0 | 0 findings; two declared exemptions |
| Search gate, self-test | `… --self-test` | 0 | 81 of 81 |
| Catalogue identity | `catalogue-identity.mjs --base <base-rev>` | 0 | 595 keys × 7 locales identical |
| Visual baselines | `170-verdict.mjs baselines` | 0 | both blobs unchanged; nothing uncommitted under `__screenshots__/` |
| Exempt names | `170-verdict.mjs exemptions` | 0 | counts unchanged since the base revision |
| Allowlist on the running service | `170-allowlist-probe.sh after` | 0 | ten rows OK |
| Full E2E | `170-04-close` | 0 | 171 / 171, 0 failed, 0 flaky, 0 skipped, 0 did-not-run; the baseline's counts |
| `bank-auth` ×3 | `170-04-bankauth-{1,2,3}` | 0, 0, 0 | 8 / 8 each |
| `bank-auth-journey` ×3 | `170-04-bankauth-journey-{1,2,3}` | 0, 0, 0 | 131 / 131 each |
| No old route directory | `test ! -e apps/frontend/src/routes/candidate && test ! -e apps/frontend/src/routes/api/candidate` | 0 | |
| `route.ts` names the new root | `git grep -c 'contestant' -- apps/frontend/src/lib/routes/route.ts` | 0 | 3 |

Host afterwards: nothing listens on 5173, 5273, 8777 or 9443; the stack is up and healthy on the new allowlist with the default function environment; `git status --porcelain -- . ':(exclude).planning'` prints `?? CAND-APP-PLAN.md` only.

### 5.9 Red runs

None. No gate row and no E2E or bank-auth run was red in this plan, and no run was repeated on an unchanged tree to see whether it passes: `170-04-pre` and `170-04-close` are two gate sets on one head, the first made ahead of the bank-auth runs.

## 6 Residue log

Edits to the mapping table that depart from the row as `170-01-PLAN.md § mapping_table` states it, and every tree edit that was not a map row.

| # | Plan | Kind | What | Why |
|---|---|---|---|---|
| 1 | 3 (found while building the gate in plan 1) | map row tightened | P3-09 gained the look-behind `(?<![\w-])`; the gate's test-id pattern carries the same | The row as stated matches `moderation-of-candidate-answers`, a publishers'-guide page named for the entity: one path and its route string in `apps/docs/src/lib/navigation.config.ts`. It was the only match preceded by a word character or a hyphen. |
| 2 | 2 (found while building the gate in plan 1) | map row tightened | P2-05's look-ahead became `(?![\w.-]\| lookup failed)`; the gate's URL pattern carries the same | The row as stated matches the regex literal `/candidate lookup failed/i` in `apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts`, which names the entity. Rewriting it would break that test. It was the only match of its kind among the 21 matches not followed by a URL delimiter. |

| 3 | 1 | hand edit (ruling 1) | The `AppType` member `'candidate'` → `'contestant'` at six sites: `appContext.type.ts` (the union), `routes/candidate/+layout.svelte` (`appType.set`), `Banner.svelte`, `EntityOpinions.svelte`, `QuestionHeading.svelte` (the three comparisons), `entityCard/tests/hoverShadedRule.test.ts` (one fixture) | The value is spelled exactly like the entity type; no pattern can tell them apart. `UserRole` was left alone. |
| 4 | 1 | hand edit (ruling 10) | `apps/docs/scripts/docs-scripts.config.ts`: the `join(…)` path segment → `'contestant'`, the entry's `name` → `'Contestant App Components'`. `generate-component-docs.ts`: both `categorySubdir` assignments → `'contestant/components'` | A path assembled from segments and a generated-page subdirectory name; no row matches either. The pages were not regenerated. |
| 5 | 1 | hand edit (ruling 16) | The same one-word substitution in the two fixture twins under `.planning/phases/151-ship-v0-2-akita-review-stack/scripts/fixtures/` | `diff -r` against `.claude/skills/ship-review-stack/sources/` prints nothing (exit 0); `hygiene-codemod.mjs --self-test` exit 0. |
| 6 | 1 | formatter output dropped | `yarn lint:fix` also removed an unused `eslint-disable-next-line` directive in `tests/tests/support/mockOidcIssuerEntry.ts`, a file the rename did not touch; that one change was reverted before the formatter commit | It predates the rename and is not this phase's to fix. Any later `yarn lint:fix` will propose it again. |
| 7 | 2 | map row tightened | P2-05's look-ahead became `(?![\w.-]\| lookup failed\|\/i\b)`; the gate's URL pattern carries the same, with a fixture negative (`{ candidateTab: /candidate/i }`) | The row as tightened in plan 1 still matched `candidateTab: /candidate/i` in `tests/tests/specs/voter/voter-journey.spec.ts`, a regular expression that matches the voter results tab's label. It names the entity. Rewriting it would have made that locator match nothing. Plan 1 looked only at the matches not followed by a URL delimiter; this one is followed by a slash, which is one. It is the only regex literal of the form `/candidate/<flags>` in the tree (`git grep -P`). Committed as `320dee73a` (gate) and `a8a7c7f54` (map). |
| 8 | 2 | map row added | P2-01b, `\$\{API_ROOT\}\/candidate\/auth\/(callback\|logout)` → `${API_ROOT}/auth/$1`, placed after P2-01 | In `route.ts` the callback's path is assembled from the API root constant, so the string `api/candidate` is not in the file: P2-01 does not see it and P2-05 would have written `${API_ROOT}/contestant/auth/callback`. One match. Committed in `a8a7c7f54`. |
| 9 | 2 | hand edit | `scripts/assert-no-session-in-loads.mjs`: the anchor `path.join('candidate', '+layout.server.ts')` → `'contestant'` | A path assembled from segments; no row matches it. |
| 10 | 2 | hand edit | `appGates.test.ts`: the sibling-prefix probes `['/candidate-portal', '/candidates']` → `['/contestant-portal', '/contestants']` | The negative test must probe ids that merely begin with the app's root. `'/candidates'` is spelled like the entity plural, so no row can match it. |
| 11 | 2 | hand edit (D-21) | `route.ts`: the comment above `AuthCallback` and `AuthLogout` rewritten to what is now true | The old comment said the keys keep the app's name because their paths do. |
| 12 | 2 | hand edit (D-21) | `supabaseDataWriter.ts`, `_logout`: the path segment the comment names, `'candidate'` → `'contestant'` | The comment says which segment a pathname read would return for an unprefixed route of the app. Only the quoted segment changed. |
| 13 | 2 | hand edit (D-21) | `supabaseDataWriter.test.ts`: one test title (`/candidate-prefix` → `/contestant-prefix`) and two comments | The codemod left the first comment quoting a mixed path (`/contestant/candidate/auth/logout`: the second segment sits behind the look-behind) and turned the second into a claim about `contestant/auth/callback`, a path that never existed. Both now state the mechanism without quoting a path that is not real. |
| 14 | 2 | hand edit, in the merge commit | `eslint.config.mjs` and `eslint-adapter-boundary-guard.test.ts`: the counts of section 3.1 and the surviving logout entry's comment | The deletion of the old handler's entry changes them. |
| 15 | 3 | hand edit | `tests/tests/utils/testIds.ts`: the registry’s namespace key `candidate: {` → `contestant: {`, and the namespace path in two comments of the same file (`candidate.passwordSetter.confirm`, `candidate.profile.imageUpload`) | The key is a bare object property; no row can tell it from the entity word. The two comments cite members by that path, which the rename changed. `yarn typecheck:tests` proves every use of the key. |
| 16 | 3 | hand edit (formatting), in the formatter commit | `tests/README.md`: the three boxes of the project-family diagram re-squared around the longer names | A fenced block is outside the formatter’s reach. The two upper boxes were made ragged by this plan’s names, one line of the lower box by plan 1’s; the first and the last of the three were already one column out of square at the base revision. |
| 17 | 3 | test fix outside the rename | `tests/tests/specs/voter/voter-results-redraw.spec.ts`: the scroll-survival test awaits the document’s finite animations before its scrolled start (one import, one statement and its comment) | The plan’s first closing E2E run was red on this test. Diagnosis, isolated re-test and what the fix does not claim: section 4.7. Commit `d21e837ef`. |
| 18 | 4 | hand edit (D-21) | `CLAUDE.md` § *Frontend (SvelteKit)* → *Key directories*: the context-provider list "(app, voter, candidate, data, …)" → "(app, voter, contestant, data, …)" | The list names the directories under `lib/contexts/`, and plan 1 moved that one. No row can see a bare word in a list. Commit `165c76d94`. |
| 19 | 4 | hand edit | `.claude/skills/database/SKILL.md` and `apps/supabase/README.md`: `assert:schema-migration-parity` is "link 13 of `yarn lint:check`", not link 12 | The new gate was inserted as link 8, ahead of it. Commit `e222a9b88`. |
| 20 | 4 | formatter output dropped | The unused `eslint-disable-next-line` directive in `tests/tests/support/mockOidcIssuerEntry.ts`, proposed by `yarn lint:fix` a fourth time | As row 6. |
| 21 | 4 | procedure | Seven hand-written docs pages were set back to the codemod's output (`git checkout HEAD -- <file>`, then `rename.mjs --plan 4 --apply --paths apps/docs/`) before the content commit | `generate:docs` ends with the docs workspace's formatter, which re-aligned their tables around the longer name. The reflow is in `aa2c20753`, not in the content commit. |

No map row and no gate anchor was changed in plan 4, and the residue pass over the gate's output found nothing to fix.

## 7 Notes for the operator

- **The `docs-links` gate row sets stale generated pages aside for plans 1 to 3 — a change to the instrument, for review.** Ruling 10 says the generated docs pages are stale between plans 1 and 4 and that "no per-plan gate reads them". Measured, that is not so: `validate:links --check` reads their GitHub source links and exits 1 with 15 `github-path` findings once `lib/candidate/` has moved, and the plan forbids regenerating the pages in plan 1. `170-gates.sh` therefore treats the row as it already treats `residue`: for `--plan` 1, 2 and 3 a `github-path` finding located in a file under either generated subtree is set aside and counted; any other finding fails the row; with `--plan` 0 or 4 the validator's own status is the row's status. The set-aside was exercised in both directions on captured output (as measured: exit 0; with one planted finding outside the subtrees: exit 1). The alternative is to run `yarn workspace @openvaa/docs generate:docs` at the end of every plan instead of only in plan 4.
- **One acceptance criterion of plan 170-01 cannot hold as written** (no change under `routes/api`); what it guards was measured another way — section 2.4.

- **The gate reports `$candidate/…` under two groups** (`symbols` and, as a slashless URL, `urls`) until plan 1 removes the alias. It is double reporting of one form, not a second form.
- **Node selection in the drivers.** `170-gates.sh` and `170-e2e.sh` put the phase's pinned v24.21.0 first when it is installed and fall back to the newest version at or above 24.15 otherwise. The plan's wording ("the newest Node at or above 24.15") would select v25.2.1 on this host, a different major from every other command of the phase; the drivers follow the plan's environment preamble instead.
- **`CAND-APP-PLAN.md`** is untracked and untouched. If it is ever committed outside `.planning/`, the gate will report it.
- **Plan 170-02 changed the search gate a second time** (`320dee73a`): its URL pattern now also spares `/candidate/i`, the regex literal of residue log row 7. The declared exemption list is still exactly two entries; this is an anchor of one pattern, like the ` lookup failed` anchor of plan 1.
- **Plan 170-02 changed one line of `CLAUDE.md`**: the route directory citation under § *Frontend (SvelteKit)* → *Routing*, by map row P2-04. Nothing else in the file changed.
- **The local stack must be restarted once by anyone who pulls plan 170-02.** `additional_redirect_urls` is read into the auth container when the stack starts; `yarn db:stop` then `yarn db:start` applies it. Until then the running service rejects the neutral callback on `localhost` and still admits the two old URLs (section 3.3, "before"). The E2E suite does not notice either way, because its redirects are built on `127.0.0.1`.
- **The generated route-map page is stale in a form no gate pattern sees.** `frontend/routing/generated/+page.md` draws the route tree with `candidate/` as a directory name (two lines). Neither the docs link validator nor the search gate reports it. Plan 170-04 regenerates the page.
- **Plan 170-03 changed a test the rename does not touch, to close a red E2E run.** `voter-results-redraw.spec.ts` failed once in the plan’s closing run. The cause is a race between the results landing’s own slide-out transitions and Playwright’s click retries, which scroll (section 4.7); it predates the phase. The fix is in the test only (`d21e837ef`). The failure’s rate before and after is not measured; the mechanism is.
- **The names of map row P3-13c read as entity-typed, and were renamed as ruling 3 states — for review.** All 13 matches are outside `tests/`. Nine are the helper `setupCandidateSession` in `supabaseDataWriter.test.ts`, whose own docstring says it sets up “a mock session with candidate role JWT” and which mints a grant with `target_type: candidate`; four are comment mentions in dev-seed templates of `mintCandidateSession` and `candidateSessionMinter`, helpers that exist nowhere in the tree. They are now `setupContestantSession`, `mintContestantSession` and `contestantSessionMinter`, as ruling 3 and the plan’s artifact list name them. Reverting is one map row, one gate pattern and its fixture line.
- **Two app-flavoured locals have no map row and no gate pattern, and were left alone:** `candidatePayloadSatisfiesTheHelper` in `routes/admin/layout.server.test.ts` (now typed from `contestantLoad`) and `candidateDialog` in `perm-per-app-notifications.spec.ts` (the dialog that carries `[notif-contestant]`). Every other `candidate`-prefixed identifier left under `tests/` names the entity (`candidateEmail`, `candidateIds`, `candidateSection`, `TEST_CANDIDATE_PASSWORD`, `UNREGISTERED_CANDIDATE_EMAIL`, `candidateTab` and the like).
- **Two comments cite spec files that are not in the tree.** `contestant-journey.spec.ts` names `contestant-profile-validation.spec.ts` (rewritten by row P3-09, the stem being a test-id stem), and `packages/dev-seed/src/supabaseAdminClient.ts` names `candidate-settings.spec.ts` (no row matches it). Neither was corrected: both predate the phase.

### Added at the close (plan 170-04)

- **`CAND-APP-PLAN.md` is untracked and was not touched** in any plan: not edited, moved, staged or committed. The gate scans tracked files, so it is not a finding. If it is ever committed outside `.planning/`, the gate will report it, because it is written in the old names.
- **The gate's declared exemption list is exactly two entries** (ruling 8): `get_candidate_user_data`, which Phase 173 deletes, and `invite-candidate`, which Phase 174 deletes. Each is a mask on the name, so an old app-level name planted in the same file or directory is still reported (5.4, step c). In addition, and not as an exemption of any name, the gate does not scan `.planning/`, skips its own source and its two fixture files and `.yarn/`, and masks its own script name wherever it is cited (`package.json` must name it, and the name holds the hyphenated compound the prose pattern forbids). All of this is stated in the gate's header. It reads against the letter of D-18 and is for review.
- **The two standing reds of ruling 22 are still red and were not touched.** `bash .claude/scripts/audit-skill-links.sh`: exit 1, `Dangling: 222` at the base revision and `Dangling: 222` at the close; `audit-skill-links.sh components` exit 0 at both. `bash .claude/scripts/audit-skill-drift.sh`: exit 1 at the close with `Drifted: 2` — `data` (one commit since 2026-09-24, not this phase's) and `ship-review-stack` (the one-word fixture rewrite of plan 1). The drift count at the base revision was not recorded.
- **The five wording differences W1 to W5** between the amended roadmap and requirements and `170-CONTEXT.md` stand as `170-RESEARCH.md` lists them, and `170-CONTEXT.md` was followed in each. W1: criterion 3 says a search "finds none outside the planning record"; D-18 adds the two named exemptions, so 51 and 73 occurrences remain by decision. W2: the identity-provider return is `/api/oidc/callback`, which carries no app name and did not move. W3: the invitation link still lands on a path with no page (D-11). W4: the traceability table maps E2E-03 to Phase 179 only; it was this phase's closing criterion too. W5: NAME-01 names one spelling, `contestantApp`; the decisions name several (`ContestantApp*`, `AuthCallback`, `AuthLogout`).
- **The calls of rulings 12 to 25, none decided differently:** the gate masks its own script name (12); the prose pattern carries two path scopes, the message catalogues and the publishers' guide (13); formatter output is its own commit in every plan (14); the merged logout handler's test is `server.test.ts` (15); the two hygiene-codemod fixtures and their twins under `.planning/phases/151-…` were rewritten together and `diff -r` is empty (16); `ROUTE.AuthLogout` reads `UNIVERSAL_API_ROUTES.logout` (17); `developers-guide/candidate-user-management/` keeps its name and its four stubs point at the moved section (18); `candidate-app-menu` and the dev-seed template key were plan-1 rows (19, and see the next note); bank-auth ran once per project at the end of plan 2 and three times per project here (20); the visual run happened once, in plan 3 (21); the two standing reds (22); four browser-storage keys, not two (23); the `candidateHome` stem (24); SQL comments with the database workflow that follows (25).
- **Ruling 19 says plan 170-04 "changes no executable token in application source". Measured, it changed string literals:** seven log-message prefixes in four files under `routes/contestant/` (for example `[Candidate App protected layout]` → `[Contestant App protected layout]`), and in tests one unit-test title, four test-table labels, two assertion messages, two Playwright test titles, one setup error message and one assertion message. They are the prose phrase inside a string, the gate's prose pattern forbids them, and none is a name the application or the suite resolves: the enumerated and the run E2E totals are unchanged.
- **The docs site's `about/features` page changed one heading,** `### Candidate application` → `### Contestant application`. The page is outside the publishers' guide, so the prose row reached it. It is the only match of the plan in the docs' *About* section; if what the app is called there belongs to Phase 171, this is the line.
- **Prose forms no row and no gate pattern names were left alone.** D-14 gates the phrase "candidate app" and the compound "candidate-app". The prose "candidate context" (22 mentions in 18 files: the docs section's pages, comments, and "voter/candidate contexts" in three skill files), and in `tests/README.md` "candidate settings-perm chain" (twice, once inside the fenced diagram) and "Candidate-journey seed overlay" (twice), still say candidate. The README's diagram needed no re-squaring, because no row lengthened a line in it.
- **The gate has no wiring test.** Several gates of the chain have a unit test under `packages/dev-seed/tests/` that asserts their link is in `lint:check`. This plan did not add one for the new gate; the plan does not ask for it. The wiring is proven by the recorded negative control and by the `lint` row.
- **`170-gates.sh` still carries the set-aside for plans 1 to 3** in its `docs-links` and `residue` rows. With `--plan 4` neither is used: both rows were strict in `170-04-pre` and `170-04-close` and both are 0 with nothing set aside.
- **The local database was reset in plans 170-03 (twice) and 170-04 (once).** Any earlier local data is gone. The stack itself was restarted with `yarn db:stop` and `yarn db:start` only, twice in plan 2 and once in plan 4 by the bank-auth driver.
- **One gate set more than the plan lists.** `170-04-pre` ran on the final head before the bank-auth runs, so that a red row would be found before six runs were spent on the tree. The closing verdict is read from `170-04-close`.
- **The three names left for review in plan 3 are unchanged here:** the helper `setupContestantSession` (renamed by row P3-13c, reads as entity-typed) and the locals `candidatePayloadSatisfiesTheHelper` and `candidateDialog` (kept).
