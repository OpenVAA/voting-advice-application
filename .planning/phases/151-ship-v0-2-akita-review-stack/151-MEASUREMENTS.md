---
phase: 151-ship-v0-2-akita-review-stack
plan: 04
artifact: measurements
measured_at: 2026-08-16T21:04:17Z
measured_at_local: 2026-08-17T00:04:17+03:00
measured_against_ref: feat-gsd-roadmap
measured_against_sha: df81f5e652fa96da10f0a99bb99d4bebb64e84cc
origin_main_sha: ac30f132a407084bf30626029a0a71a0a521982f

# --- Task 1: gate reach (D-18) ---
checklist_items_visible: 31
checklist_items_gfm_valid: 30
checklist_nbsp_defect_line: 8
reach_exhaustive: 0
reach_partial: 10
reach_none: 21
axe_route_entries: 7
axe_distinct_routes: 5
axe_themes: 2
axe_emitted_tests: 14
axe_wcag_tags: 4
app_route_files_total: 36
app_route_files_unscanned: 31
phase_147_executed: false
a6_test_glob_exempt: partial
db_lint_sql_is_sqlfluff: false
db_lint_sql_check_count: 2
supabase_tests_ci_conditional: true
---

# Phase 151 — Execution-Time Measurements

**`151-RESEARCH.md`'s own metadata declares its repo-state measurements expired.** This file is the
re-measurement. Every number below carries the command that produced it, run against
`feat-gsd-roadmap` at `df81f5e65` on 2026-08-16T21:04:17Z. A value here without a command is a
defect in this file.

Three things this file exists to stop:

1. **D-18's failure mode** — a disposition cell citing a gate whose reach was never measured, so a
   blind spot is laundered as "met". Every row below ends in a closed-vocabulary verdict
   (`exhaustive` / `partial` / `none`), and every `partial` names its complement in the same row.
2. **Carrying a research-time number forward.** Where a re-measured value differs, both are shown.
3. **Inheriting a mis-specified pattern.** This phase has now been bitten four times (C-5's `D-NN`
   word boundary, the `as any` left boundary, `git grep -I`, and — new below — a no-break space in
   the checklist itself). Each correction is recorded with the byte-level cause.

---

## 0. The checklist has 31 items, not 30 — and one of them is not a checkbox

**This is a measured correction to `151-RESEARCH.md` and it changes the index of the disposition
matrix, so it comes first.**

`151-RESEARCH.md` § Checklist Item × Existing Coverage Inventory says
"`.agents/code-review-checklist.md`, **30 items** `[VERIFIED: read this session]`" — and then lists
**16** General rows + 9 Supabase Backend + 3 Supabase Adapter + 3 Edge Functions = **31**. The table
was right; the total was wrong. The cause is a byte, not a miscount:

```
$ grep -c '^- \[' .agents/code-review-checklist.md          # visible bullets
31
$ grep -c '^- \[ \] ' .agents/code-review-checklist.md      # GFM-valid task-list markers
30
$ sed -n '8p' .agents/code-review-checklist.md | head -c 40 | hexdump -C
00000000  2d 20 5b c2 a0 5d c2 a0  41 76 6f 69 64 20 75 73  |- [..]..Avoid us|
00000010  69 6e 67 20 60 61 6e 79  60 20 61 74 20 61 6c 6c  |ing `any` at all|
00000020  20 63 6f 73 74 73 2e 20                           | costs. |
```

Line 8 — the **"Avoid using `any` at all costs"** item — is written
`- [<U+00A0>]<U+00A0>Avoid …`. Both the character inside the brackets and the one after them are
**U+00A0 NO-BREAK SPACE** (`c2 a0`), not ASCII `0x20`.

Two consequences, both load-bearing for this phase:

- **Any `grep '^- \[ \] '` census undercounts by exactly one**, which is how research arrived at 30.
  Every downstream item number ≥ 4 is ambiguous until the numbering is pinned. It is pinned below.
- **`- [<NBSP>]` is not a valid GFM task-list marker.** The item renders as a plain bullet
  containing a literal `[ ]`, not a tickable checkbox. A reviewer working the checklist in a PR
  **cannot tick the `any` item** — the single item this phase spends the most measurement effort on.

**Recorded as a finding, not fixed here.** See § 4, finding **F-07**. It maps to checklist items 6
(repo documentation markdown updated) and 15 (guide entries updated), on top of the stale-path
finding F-04 that the same file already carries.

### Canonical numbering used by this file and by `151-DISPOSITION.md`

**1–31, counting all visible bullets**, which is exactly `151-RESEARCH.md`'s own General-block
numbering (its `any` row is item 4, its repo-documentation row is item 7, WCAG is 13, guides 15,
commit history 16 — all reproduce). Blocks: General **1–16**, Supabase Backend **17–25**, Supabase
Adapter **26–28**, Edge Functions **29–31**.

```
$ awk '/^- \[ \] /{n++} /^### /{b=substr($0,5)} END{}' …    # DEFEATED by the NBSP — do not use
$ awk '/^- \[/{n++; print n, substr($0,7)}' .agents/code-review-checklist.md | tail -1
31 Error responses include appropriate HTTP status codes and descriptive error messages.
```

Plan 151-06 must index against **this** numbering. Any cell numbered against a 30-item census is
off by one from item 4 onward.

---

## 1. Checklist item × measured gate reach

Reach is the **D-18 question**: not "is there a gate", but "what does the gate actually touch".
Verdict vocabulary is closed — `exhaustive`, `partial`, `none` — so "covered" cannot be written
without committing to which of the three it is. Every `partial` names its complement in-row.

`none` means **no automated gate reaches this item at all**; it is agent/human review or nothing. It
does *not* mean the item is unimportant — 22 of 31 items are `none`, which is the headline number of
this whole table.

| # | Block | Item (abridged) | Automated gate + exact command | Measured reach — and its complement | Reach |
|---|---|---|---|---|---|
| 1 | General | Changes solve the PR's issues | none | No gate exists. Phase-level judgement, dispositioned once for the stack. | none |
| 2 | General | OWASP Top 10 review | none | No gate exists. Fully manual per D-20 — exhaustive agent review over auth / RLS / Edge Function / adapter / input-handling paths in the diff. | none |
| 3 | General | Follows the Code style guide | `yarn lint:check` = `turbo run lint` + `eslint --flag v10_config_lookup_from_file tests` + `tsc -p tests/tsconfig.json --noEmit` | Covers only the **flagged subset** of the guide: `@typescript-eslint/array-type: generic` (`shared-config/eslint.config.mjs:88-93`), `func-style: declaration` (`:85`), `no-restricted-syntax` TSEnum ban (`:77-83`), `naming-convention` typeParameter `^T[A-Z]` (`:105-118`), `quotes: single` (`:68-75`), `no-console` allowing warn/error/info (`:59-64`), `consistent-type-imports` (`:120-127`), `simple-import-sort` (`:158-179`). **Complement — NOT covered:** named function parameters (the guide states this itself: `apps/docs/…/code-style-guide/+page.md:88-90` — *"This requirement is not flagged by automatic checks."*), TSDoc presence (§ Comments, `:46-70`), file organisation `foo.ts` / `foo.type.ts` / `foo.test.ts` (`:114-120`), comment style, and the entire § Svelte components section (`:130-…`). Also **scope-limited**: 11 of 15 workspaces run `eslint … src/`; `apps/docs`, `apps/supabase`, `packages/shared-config`, `packages/supabase-types` have **no `lint` script at all**. | partial |
| 4 | General | Avoid `any`; document or `@ts-expect-error` | `@typescript-eslint/no-explicit-any: ['error', {ignoreRestArgs:true}]` — `packages/shared-config/eslint.config.mjs:98-103` | Corrected surface **14 files / 77 occurrences** (naive research pattern: 24 / 96 — see § 1.3). Of the 14, **7 are inside** the lint gate and **7 outside** it. **Complement:** `apps/frontend/vite.config.ts` (outside `src/`), 3 × `packages/dev-seed/tests/`, `packages/llm/tests/llmProvider.test.ts` (**57 occurrences — the single largest concentration in the repo, entirely unlinted**), 2 × `packages/question-info/tests/`. Plus a *severity* complement: the top-level `tests/` tree downgrades the rule to `warn` (`tests/eslint.config.mjs:78`). A6 fully resolved in § 1.3. | partial |
| 5 | General | No repeated code in PR or repo | none | No gate exists. Manual; explicitly inside D-05's fix bar. | none |
| 6 | General | New components/functions/entities documented | none | No gate exists. TSDoc presence is unenforced (see item 3's complement). | none |
| 7 | General | Repo documentation markdown updated | none | No gate exists. `apps/docs` `validate:links` exists but is **not a PR gate** — see item 15. Concrete target set measured in § 4: **13 files / 20 occurrences / 19 lines** of the stale `docs/src/routes/…` path. | none |
| 8 | General | Tracking events for new user-facing functions | none | No gate exists. Surface is `apps/frontend/src/lib/contexts/app/tracking/` (5 files) + `components/analytics/umami/`. Manual. | none |
| 9 | General | New Svelte components follow the guidelines | `yarn workspace @openvaa/frontend check` = `svelte-check --tsconfig ./tsconfig.json --fail-on-warnings` (CI job `frontend-and-shared-module-validation`, `.github/workflows/main.yaml:84-86`) | svelte-check covers **types + the Svelte compiler's own a11y/unused warnings at 0-tolerance**. It does **not** cover the guide's component conventions. **Complement — and a correction to research:** `eslint-plugin-svelte` is loaded as `compat.extends('plugin:svelte/prettier')` (`apps/frontend/eslint.config.mjs:20`) — the **prettier-conflict-DISABLE** config, which turns rules *off* and enables **none**. `plugin:svelte/recommended` appears nowhere (`git grep -n 'svelte/recommended' -- '*eslint.config*'` → empty). Research's "partial (eslint svelte plugin)" overstates: no svelte lint rule is active in `apps/frontend`. Also unreached: `**/_spikes-*/**` (`apps/frontend/eslint.config.mjs:38-40`). | partial |
| 10 | General | Errors handled and logged | none | No gate exists. Manual. (`no-console` permits `warn`/`error`/`info`, so it is not even a logging-shape constraint.) | none |
| 11 | General | Troubleshoot failing checks in the PR | the CI matrix — `.github/workflows/main.yaml` jobs `skill-drift-check`, `frontend-and-shared-module-validation`, `supabase-tests`, `dev-seed-integration`, `e2e-tests`, `e2e-visual` | 6 jobs exist, but **`supabase-tests` is conditional** on `steps.changes.outputs.supabase == 'true'` from a `dorny/paths-filter` over `apps/supabase/**` + `packages/supabase-types/**` (`main.yaml:87-93`), and **every one of its four steps carries that `if:`** (`:95,:101,:105,:110`). **Complement:** on a sibling-based stacked PR whose diff-vs-base excludes those paths, the job reports green having run **nothing**. It may not be cited as evidence for any stacked PR — see § 1.5. Dispositioned once, phase-level, with PR #1's expected reds documented per Pitfall 7. | partial |
| 12 | General | Shared-dependency blast radius | `yarn build` (turbo topological) + `yarn test:unit` (turbo) | Build + unit coverage: **1,522 tests across 149 files**, green at the 151-03 baseline. **Complement:** unit tests do not exercise the SSR/adapter boundary or the DB; the E2E suite (43 `.spec.ts`) does, but only via the `e2e-tests` job, and `apps/docs` `test:unit` is `vitest run --passWithNoTests` (an empty pass). Dispositioned once, phase-level. | partial |
| 13 | General | WCAG A and AA | `assertAxeScan` — `AxeBuilder.withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa'])`, `tests/tests/specs/a11y/a11y-smoke.spec.ts` | **Measured this run: 7 route entries → 5 distinct URLs → 14 emitted tests (× 2 themes).** Full derivation, route list and file/line citations in § 1.1. **Complement (measured, not assumed): 31 of the 36 `+page.svelte` route surfaces are never scanned** — all 18 candidate-app routes, all 5 admin routes, and 8 of the 13 voter routes. Phase 147 has **not** executed (§ 1.2), so D-18's snapshot still holds — but it holds as a *measured* fact now, not an inherited one. | partial |
| 14 | General | Keyboard + screen-reader usable | `assertNoRawI18nKeys` (`tests/tests/utils/rawKeyScan.ts:309`), wired into `assertAxeScan` at `a11y-smoke.spec.ts:471` | **Identical 7 × 2 reach** — one call site, inside the axe helper, so the raw-key gate has exactly the axe gate's reach and no more. **Complement is two-layered:** (a) same 31 unscanned route surfaces as item 13, incl. the two sites named in `.planning/todos/pending/2026-08-12-candidate-app-axe-and-rawkey-blind.md` (`candidate-journey.spec.ts:921`, `candidateProfilePage.fixture.ts:174`); (b) **no keyboard-navigation gate exists at all** — axe is a static-DOM auditor, it does not tab through the UI. The keyboard half of this item is `none` even on the 5 scanned routes. | partial |
| 15 | General | Developers'/Publishers' Guide entries updated | `apps/docs` `validate:links` → `tsx scripts/validate-links.ts`, reached via `generate:docs` | **Not a PR gate.** Its only invocation is `.github/workflows/docs.yml`, which triggers on `push` to `main` with `paths: apps/docs/**` and `workflow_dispatch` — there is **no `pull_request` trigger** (`docs.yml:3-9`). It therefore cannot fire on any PR in this stack, in any slice. Reach against the item is nil. Same stale-path target set as item 7. | none |
| 16 | General | Clean, linear history per the commit guidelines | `scripts/verify-commit-taxonomy.sh` (phase-local, built by 151-02) | A phase-local gate, not a repo/CI gate: it encodes criterion 4.1–4.6 and exits non-zero on a non-conforming range. **Complement:** 4.4 is asserted by a **named structural proxy** (shared-path pairs), not by the clause itself, and the script prints the proxy's name on every run so no record can overclaim. There is no CI-side history gate. The restructure *is* the evidence for this item. | partial |
| 17 | Supabase Backend | New content tables include all common columns | `yarn db:lint:sql` = `supabase db lint --schema public --fail-on warning` + `node scripts/lint-schema.mjs` | Neither check inspects column sets. **Complement: the entire item.** See § 1.4 for what `db:lint:sql` actually is (it is **not** sqlfluff). | none |
| 18 | Supabase Backend | RLS enabled + standard 5-policy pattern | `lint-schema.mjs` check **0013** (`apps/supabase/scripts/lint-schema.mjs:38-51`, ERROR) | Covers the **"RLS enabled"** half only — it lists `public` tables with `relrowsecurity = false`, excluding `schema_migrations`, `supabase_migrations` and `\_%`-prefixed names. **Complement:** the **5-policy pattern** (`anon_select`, `authenticated_select`, `admin_insert`, `admin_update`, `admin_delete`) is not checked at all — a table with RLS on and one policy passes. Agent review required for the policy set. | partial |
| 19 | Supabase Backend | RLS policies use `(SELECT auth.uid())` / `(SELECT auth.jwt())` scalar subqueries | none | No check reads policy bodies. Greppable over `apps/supabase/supabase/{migrations,schema}/*.sql` (27 files) — cheap to prove exhaustively by agent, but **no gate exists**. | none |
| 20 | Supabase Backend | RLS policies specify `TO anon` / `TO authenticated` | none | No check reads policy role targets. Same 27-file grep surface; no gate. | none |
| 21 | Supabase Backend | `SECURITY DEFINER` functions set `search_path = ''` | `supabase db lint --schema public --fail-on warning` (plpgsql_check) | plpgsql_check validates PL/pgSQL **bodies** (unreachable code, type mismatches); it does not assert function *attributes*. **Complement: the `search_path = ''` and schema-qualification requirements are entirely unchecked.** | none |
| 22 | Supabase Backend | B-tree indexes on `project_id` and FK columns | `lint-schema.mjs` check **0001** (`:53-76`, WARNING — and `lint:sql` runs `--fail-on warning`, so it does gate) | Covers **FK columns**: flags foreign-key constraints whose referencing columns lack a matching index prefix. **Complement:** a `project_id` column that is *not* a declared FK is invisible to it, and the check says nothing about index *type* (B-tree vs other). | partial |
| 23 | Supabase Backend | Trigger naming conventions | none | Neither check reads trigger names. No gate. | none |
| 24 | Supabase Backend | pgTAP transaction-boundary pattern + `create_test_data()` | none as a *lint*; `supabase test db` executes them in CI job `supabase-tests` | Execution is not conformance: a pgTAP file that never `ROLLBACK`s still passes if its assertions pass. **Complement:** the pattern itself is unchecked, **and** the executing job is the conditional one from item 11 — on a sibling-based PR it does not fire. Surface is **11** files under `apps/supabase/supabase/tests/database/`. | none |
| 25 | Supabase Backend | pgTAP assertion patterns (`ok()` / `lives_ok()`+`is()` / `throws_ok()`) | none | Same as item 24 — execution is not conformance. Agent review over the same 11 files. | none |
| 26 | Supabase Adapter | Adapter classes use `supabaseAdapterMixin` with `init({ fetch })` | none | No gate. Greppable and exhaustively provable by agent over the **24** files under `apps/frontend/src/lib/api/adapters/supabase/` — but nothing enforces it. | none |
| 27 | Supabase Adapter | Row mapping via `COLUMN_MAP`/`PROPERTY_MAP` from `@openvaa/supabase-types` | none | No gate. Type-checking catches a *wrong* map, not a *missing* one (hand-rolled snake→camel conversion type-checks fine). Same 24-file surface. | none |
| 28 | Supabase Adapter | `safeGetSession()` (not `getSession()`) for route guards | none | No gate. This is the highest-value greppable item in the block and **nothing enforces it** — `getSession()` is a valid call that compiles. Agent review. | none |
| 29 | Edge Functions | Verify caller is admin via JWT claims | none | No gate. 3 functions (`identity-callback`, `invite-candidate`, `send-email`), 5 tracked files under `apps/supabase/supabase/functions/`. Small surface — exhaustive agent review is affordable. | none |
| 30 | Edge Functions | `createClient()` with `service_role` for privileged operations | none | No gate. Same 3-function surface. | none |
| 31 | Edge Functions | HTTP status codes + descriptive error messages | none | No gate. Same 3-function surface. | none |

**Verdict census** — `exhaustive: 0`, `partial: 10`, `none: 21`. Nothing in this checklist is
exhaustively covered by an automated gate. That is the single most important row of this file: any
disposition matrix that fills a cell with "green CI" is wrong 21 times out of 31, and wrong *in
part* the other 10.

```
$ python3 - <<'EOF'   # census re-derived from the table itself, not hand-counted
import re, collections
rows=[l for l in open('.planning/phases/151-ship-v0-2-akita-review-stack/151-MEASUREMENTS.md')
      if re.match(r'^\| \d+ \| (General|Supabase|Edge)', l)]
print(len(rows), collections.Counter(l.rstrip().rstrip('|').rsplit('|',1)[1].strip() for l in rows))
EOF
31 Counter({'none': 21, 'partial': 10})
```

`partial` rows: **3, 4, 9, 11, 12, 13, 14, 16, 18, 22**. Every other row is `none`. No row is blank
and no row is `exhaustive`.

---

## 1.1 `assertAxeScan` — measured, not carried forward (C-8)

D-18's figure was "7 voter routes × 2 themes". **Re-measured at execution time it is still 7 × 2**
— but it is now a fact with a command behind it, and the reason it did not move is itself measured
(§ 1.2).

**Source read:** `tests/tests/specs/a11y/a11y-smoke.spec.ts`, **lines 215–330** (the `AXE_ROUTES`
table) and **lines 483–566** (the three emitting loops). File is 712 lines.

```
$ awk 'NR>=215 && NR<=330 && /^    name: /' tests/tests/specs/a11y/a11y-smoke.spec.ts
    name: 'home',
    name: 'elections-selector',
    name: 'constituencies-selector-located',
    name: 'questions',
    name: 'results',
    name: 'voter-detail-drawer',
    name: 'results-filter-drawer',
$ … | wc -l
7
```

**Route list, verbatim, with the URL each actually reaches:**

| # | Entry `name` | `fixture` | URL actually scanned | Note |
|---|---|---|---|---|
| 1 | `home` | `raw` | `/` | |
| 2 | `elections-selector` | `raw` | `/elections` | |
| 3 | `constituencies-selector-located` | `raw` | `/constituencies` | declares `routeId: 'Elections'` and walks the Continue gate, because `/constituencies` 307-redirects a bare goto |
| 4 | `questions` | `located` | `/questions` (intro) | |
| 5 | `results` | `answered` | `/results` | |
| 6 | `voter-detail-drawer` | `answered` | `/results` + drawer overlay | same URL as 5, different DOM state |
| 7 | `results-filter-drawer` | `answered` | `/results` + filter dialog, every row expanded | same URL as 5, different DOM state |

**7 entries resolve to 5 distinct URLs** — entries 5, 6 and 7 are three DOM states of `/results`.
Recorded because "7 routes" overstates route coverage by 2 if read literally.

**Theme count = 2**, and it is structural rather than a loop variable:

```
$ grep -nE "^\s*(test|voterJourneyTest)\(\`axe accessibility scan" tests/tests/specs/a11y/a11y-smoke.spec.ts
497:  test(`axe accessibility scan — ${route.name}`, …)                       # raw, light
508:  test(`axe accessibility scan — ${route.name} (dark)`, …)                # raw, dark
527:  voterJourneyTest(`axe accessibility scan — ${route.name}`, …)           # located, light
541:    voterJourneyTest(`axe accessibility scan — ${route.name} (dark)`, …)  # located, dark
550:  voterJourneyTest(`axe accessibility scan — ${route.name}`, …)           # answered, light
561:    voterJourneyTest(`axe accessibility scan — ${route.name} (dark)`, …)  # answered, dark
```

Three fixture families × light + dark = 6 declaration sites. Partition
(`a11y-smoke.spec.ts:492-494`): `raw` 3 entries, `located` 1, `answered` 3 → emitted tests
`(3 + 1 + 3) × 2 = ` **14**.

**Rule set = 4 WCAG tags**, `a11y-smoke.spec.ts:163`:
`const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];`

### The complement, measured

```
$ git ls-files 'apps/frontend/src/routes/**/+page.svelte' 'apps/frontend/src/routes/*/+page.svelte' | sort -u | wc -l
36
$ git ls-files 'apps/frontend/src/routes/candidate/**/+page.svelte' | wc -l
18
$ git ls-files 'apps/frontend/src/routes/admin/**/+page.svelte' | wc -l
5
```

| Surface | Route files | Scanned | Unscanned |
|---|---:|---:|---:|
| Voter (`(voters)/`) | 13 | 5 | **8** |
| Candidate (`candidate/`) | 18 | 0 | **18** |
| Admin (`admin/`) | 5 | 0 | **5** |
| **Total** | **36** | **5** | **31** |

**Named complement — surfaces `assertAxeScan` and `assertNoRawI18nKeys` do not reach:**

- **All 18 candidate-app routes**, including the whole `(protected)` set (`profile`, `questions`,
  `questions/[questionId]`, `preview`, `settings`), the auth surfaces (`login`, `register`,
  `register/password`, `forgot-password`, `password-reset`), the **5 preregistration routes**, plus
  `help` and `privacy`.
- **All 5 admin routes** — `admin/login` and the four `admin/(protected)` pages
  (`argument-condensation`, `jobs`, `question-info`, index).
- **8 voter routes** — `questions/[questionId]` (the per-question surface, i.e. the route a voter
  spends most of the journey on), `questions/category/[categoryId]`, `results/…/statistics`,
  `about`, `info`, `intro`, `nominations`, `privacy`.
- **Bank-auth / OIDC (Idura) flows** — no scan entry references them; they live behind
  `candidate/` and the `identity-callback` Edge Function.

D-18 predicted this complement. It is now measured against `df81f5e65`, so plan 151-06 may cite it.

---

## 1.2 Phase 147 has not executed — the reason the number did not move

C-8's premise was that Phase 147 ("Candidate-App Scan Reach") is scheduled *before* Phase 151 and
would invalidate the snapshot. It is scheduled, and it has **not run**:

```
$ ls -d .planning/phases/1[4-5]*/
.planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/
.planning/phases/151-ship-v0-2-akita-review-stack/
$ grep -n '147\.' .planning/ROADMAP.md | head -1
720:| 147. Candidate-App Scan Reach — Authenticated Fixture + Raw-Key Gate | 0/TBD | Not started | - |
```

**No phase directory exists for 141–150.** `.planning/ROADMAP.md:720` records Phase 147 as
`0/TBD — Not started`. The pending todo still carries `resolves_phase: 147` and both blind sites are
still blind:

```
$ git grep -n 'assertNoRawI18nKeys' -- tests/ | grep -v e2e-runs
tests/tests/specs/a11y/a11y-smoke.spec.ts:69   (import)
tests/tests/specs/a11y/a11y-smoke.spec.ts:471  (the sole call site)
tests/tests/utils/rawKeyScan.ts:309            (the definition)
```

One call site, inside `assertAxeScan`. The raw-key gate cannot have wider reach than the axe gate,
by construction.

**So the record says what D-18 predicted — measured this run, at this SHA.** If Phase 147 later
executes before the stack is opened, this section is the trigger to re-measure; nothing downstream
hard-codes 7.

---

## 1.3 Assumption A6, resolved — with the config lines that answer it

**A6 asked:** are the `any`-bearing test files eslint-**exempt** from `no-explicit-any`?

**Answer: NO test-glob exemption exists in the shared config — but the rule is nonetheless not
enforced on most of the surface, by two other mechanisms. Three mechanisms in total, and the
baseline found only the third.**

**(a) `packages/shared-config/eslint.config.mjs` — no test-glob exemption. Verified by absence:**

```
$ grep -n 'files:\|ignores:' packages/shared-config/eslint.config.mjs
22:    ignores: [
```

**One `ignores:` block, at lines 22–37, and no `files:` key anywhere in the 189-line file.** The
`ignores` list is `.DS_Store`, `node_modules`, `build`, `dist`, `package`, `.env*`, lockfiles,
`**/$types.d.ts`, `**/src/lib/paraglide/**`, `**/*.yaml` — **no test glob**. So
`@typescript-eslint/no-explicit-any: ['error', {ignoreRestArgs:true}]`
(**lines 98–103**) applies unconditionally to every file this config reaches. **A6's literal
question: answered `no`.**

**(b) `tests/eslint.config.mjs` — an explicit severity downgrade for the top-level `tests/` tree.**

```
$ grep -n 'no-explicit-any' tests/eslint.config.mjs
78:      '@typescript-eslint/no-explicit-any': 'warn'
```

Inside the `files: ['**/*.ts']` override block opened at **line 15**, under the comment
*"Tests may use any for mocking and test utilities"*. So for the Playwright `tests/` tree the rule
is `warn`, not `error` — it never fails `lint:check`. This is a **de facto** test exemption that the
151-03 baseline did not surface.

**(c) Workspace `tests/` directories are not linted at all** (151-03's finding, re-confirmed): every
workspace `lint` script is `eslint --flag v10_config_lookup_from_file src/`, so
`packages/*/tests/**` is outside the argument. Four workspaces have **no `lint` script at all**:

```
$ for f in apps/*/package.json packages/*/package.json; do node -e "const p=require('./$f');if(!(p.scripts&&p.scripts.lint))console.log('$f')"; done
apps/docs/package.json
apps/supabase/package.json
packages/shared-config/package.json
packages/supabase-types/package.json
```

**Surface, re-measured at `df81f5e65` — the 151-03 corrected figures reproduce exactly:**

```
$ CORR='(?<![A-Za-z0-9_]):\s*any\b|\bas\s+any\b|<any>'
$ git grep -l -P "$CORR" -- apps/ packages/ tests/ ':(exclude)*.md' ':(exclude)*.tsbuildinfo' | wc -l
14
$ git grep -o -P "$CORR" -- apps/ packages/ tests/ ':(exclude)*.md' ':(exclude)*.tsbuildinfo' | wc -l
77
$ git grep -l -P '(:\s*any\b|as\s+any\b|<any>)' -- apps/ packages/ tests/ | wc -l    # naive (research)
24
$ git grep -o -P '(:\s*any\b|as\s+any\b|<any>)' -- apps/ packages/ tests/ | wc -l
96
$ git grep -I -o '@ts-expect-error' -- apps/ packages/ tests/ | wc -l
7
$ git grep -I -o '@ts-ignore'       -- apps/ packages/ tests/ | wc -l
0
```

| Measure | Naive (research) | Corrected (151-03, re-confirmed here) |
|---|---:|---:|
| Files | 24 | **14** |
| Occurrences | 96 | **77** |

### Resulting shape for item 4's disposition

The item is **not** "fixed" and **not** simply "met". It is **"not flagged, and here is exactly
why"**, in three tiers:

| Tier | Files | Disposition shape |
|---|---:|---|
| Inside the gate, **lawfully green** | 7 | 4 carry an explicit `no-explicit-any` disable — checklist item 4's *"document the reason"* clause is already satisfied; 3 pass via `ignoreRestArgs: true` on `...args: Array<any>` or sit in a comment. **Disposition: met, with the disable directives as the evidence.** |
| Outside the gate — **`warn`-downgraded** (`tests/`) | 0 corrected-pattern matches today | The mechanism exists (`tests/eslint.config.mjs:78`) and is a standing hole even though it currently binds nothing. **Disposition: named as a gate weakness, not as a violation.** |
| Outside the gate — **unlinted entirely** | 7 | `apps/frontend/vite.config.ts`, 3 × `packages/dev-seed/tests/`, `packages/llm/tests/llmProvider.test.ts` (**57 occurrences**), 2 × `packages/question-info/tests/`. **Disposition: not flagged because unreached — the reviewer must read them, and the record must say the lint gate never did.** |

Repo-wide, **12 files** carry a `no-explicit-any` disable directive today
(`git grep -I -l 'eslint-disable.*no-explicit-any' -- apps/ packages/ tests/ | wc -l` → 12; the
151-03 baseline's 15 used the looser `-P 'no-explicit-any'`, which also matches the config and
prose). Both are recorded so the two records reconcile.

---

## 1.4 `yarn db:lint:sql` is not sqlfluff — a correction to research *and* to `CLAUDE.md`

`151-RESEARCH.md` and `CLAUDE.md` both describe `yarn db:lint:sql` as *"sqlfluff + Splinter
advisors"*. **Measured, it is neither sqlfluff nor the Splinter advisor suite.**

```
$ node -e "console.log(require('./package.json').scripts['db:lint:sql'])"
yarn workspace @openvaa/supabase lint:all
$ node -e "const s=require('./apps/supabase/package.json').scripts; console.log(s['lint:all'],'|',s['lint:sql'],'|',s['lint:schema'])"
yarn lint:sql && yarn lint:schema | supabase db lint --schema public --fail-on warning | node scripts/lint-schema.mjs
$ find apps/supabase -maxdepth 2 -name '.sqlfluff*' -o -maxdepth 2 -name 'sqlfluff*'
                                    # empty — sqlfluff is not configured anywhere
```

It is exactly two things:

1. **`supabase db lint --schema public --fail-on warning`** — plpgsql_check. Validates PL/pgSQL
   function **bodies**. Says nothing about DDL, policies, indexes, triggers or column sets.
2. **`node apps/supabase/scripts/lint-schema.mjs`** — a **174-line custom script** whose own header
   (lines 3–11) states it is *"derived from Supabase Splinter advisors"* and implements
   **exactly two** of them:
   - **0013** RLS disabled on public tables (**ERROR**) — `lint-schema.mjs:38-51`
   - **0001** Unindexed foreign keys (**WARNING**) — `lint-schema.mjs:53-76`

   *"Splinter advisors"* plural implies the whole advisor set. It is 2 checks.

**Reach against the 9-item Supabase Backend block (items 17–25):**

| Item | Covered by | Reach |
|---|---|---|
| 17 common columns | — | none |
| 18 RLS + 5-policy | 0013 covers *RLS enabled* only | partial |
| 19 scalar subqueries | — | none |
| 20 `TO anon`/`TO authenticated` | — | none |
| 21 `SECURITY DEFINER` + `search_path` | — | none |
| 22 indexes on `project_id` + FKs | 0001 covers *FK* columns only | partial |
| 23 trigger naming | — | none |
| 24 pgTAP BEGIN/ROLLBACK | — | none |
| 25 pgTAP assertion patterns | — | none |

**2 of 9 partially covered; 7 of 9 uncovered.**

**A second research correction while measuring the block:** research reports *"3 migrations,
56 `.sql` test files"*. There are 56 `.sql` files under `apps/supabase` **in total**, of which only
**11** are pgTAP tests:

```
$ git ls-files 'apps/supabase/**/*.sql' | sed 's|/[^/]*$||' | sort | uniq -c
   3 apps/supabase/benchmarks/data
  12 apps/supabase/benchmarks/pgbench
   2 apps/supabase/benchmarks/scripts
   1 apps/supabase/supabase
   3 apps/supabase/supabase/migrations
  24 apps/supabase/supabase/schema
  11 apps/supabase/supabase/tests/database
```

**3 migrations ✓, but 11 pgTAP tests — not 56.** The pgTAP review surface for items 24–25 is five
times smaller than research implies, which makes exhaustive agent review affordable. Recorded
because it changes an effort estimate in the *helpful* direction, and an unrecorded favourable
correction is as much a repudiation risk as an unfavourable one.

---

## 1.5 The `supabase-tests` CI job cannot be cited for any stacked PR

Recorded on its own because it is the one gate most likely to be cited in good faith and be wrong.

```
$ sed -n '81,113p' .github/workflows/main.yaml
  supabase-tests:
    runs-on: ubuntu-latest
    steps:
      - name: "Checkout source code"          # ← unconditional
      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            supabase:
              - 'apps/supabase/**'
              - 'packages/supabase-types/**'
      - uses: supabase/setup-cli@v1
        if: steps.changes.outputs.supabase == 'true'
      - name: "Start Supabase"
        if: steps.changes.outputs.supabase == 'true'
      - name: "Run pgTAP tests"
        if: steps.changes.outputs.supabase == 'true'
      - name: "Stop Supabase"
        if: always() && steps.changes.outputs.supabase == 'true'
```

**Every substantive step is gated.** When the filter is false the job runs checkout + paths-filter
and reports **success** — a green check that executed **zero tests**.

For this phase's stack the filter is evaluated against each PR's own diff versus **its sibling
base**, not versus `main`. Only the `[db]` slice's PR carries `apps/supabase/**` or
`packages/supabase-types/**` paths; every other PR in the stack shows `supabase-tests ✅` having run
nothing.

**Constraint on plan 151-06:** `supabase-tests` may be cited as evidence **only** for the `[db]`
slice's own PR, and only after confirming the filter fired. For every other PR it is a green tick
with no content behind it — the precise shape of the D-18 blind spot, delivered by CI itself. The
same workflow already documents this failure mode in prose at `main.yaml:138-160`, where the
`dev-seed-integration` job deliberately omits a `paths-filter` because *"a conditional guard is how
F5 happened in the first place"*.

---

## Slice anatomy (re-measured)

*(§ 2 of this record. Subsection numbers below are 2.x.)*

### 2.0 The refs everything below is measured against

Rebuilt this run with the plan-151-01 scripts, from `feat-gsd-roadmap` at `df81f5e65` and
`origin/main` at `ac30f132a`. All four OIDs are **unreferenced throwaway objects** — nothing was
branched, pushed or checked out — and every one is reproducible from the commands shown.

```
$ git rev-parse origin/main
ac30f132a407084bf30626029a0a71a0a521982f          # unchanged from research AND from 151-01 (C-12 clear)

$ git -c merge.renameLimit=20000 merge-tree --write-tree --name-only feat-gsd-roadmap origin/main
ecee2604c96479c5091c3cd3d9b18aac13b67ebe
apps/docs/static/images/youthvotes-logo.png
CONFLICT (file location): docs/static/images/youthvotes-logo.png added in origin/main inside a
directory that was renamed in feat-gsd-roadmap, …
$ echo $?
1                                                 # C-4 again: exit 1 on a directory-rename NOTIFICATION
$ git ls-tree -r --name-only ecee2604c | grep -i youthvotes
apps/docs/static/images/youthvotes-logo.png       # merge-ort already placed it; no manual resolution

$ git commit-tree ecee2604c -p feat-gsd-roadmap -p origin/main -m "…"
3808a75b8a5b0a75e5e3c42ab9f11c3c780cfeec          # TARGET

$ export GIT_INDEX_FILE=<scratch>/idx-a
$ scripts/build-rename-commit.sh ac30f132a407084bf30626029a0a71a0a521982f
moved=1316 kept=714 dropped=0                                    # stderr
   1316 R                                                        # taxonomy at diff.renameLimit=1
d01e69c5469bf89e4cc23882ba6cc5d37ba431c2          # C1  (no drop — 151-01 / D-09 Q4 convention)

$ export GIT_INDEX_FILE=<scratch>/idx-b
$ scripts/build-rename-commit.sh ac30f132a407084bf30626029a0a71a0a521982f --drop-prefix backend/
moved=1316 kept=465 dropped=249                                  # stderr
    249 D
   1316 R
d65ca1a95a877ddae009b96519254ae24fb0be56          # C1D (research's method — backend/ dropped inside PR #1)
```

| Symbol | OID | Meaning |
|---|---|---|
| `TARGET` | `3808a75b8` | materialised D-22 merge target at today's tip |
| `C1` | `d01e69c54` | pure-rename commit, **nothing dropped** — the 151-01 / D-09 Q4 convention, where the Strapi removal is slice 01b |
| `C1D` | `d65ca1a95` | pure-rename commit **with `backend/` dropped** — reconstructs research's measurement method, for reconciliation only |

**The anatomy below is measured `C1 → TARGET`**, because that is the partition plan 151-05 must
build. `C1D` appears only in § 2.2.

```
$ git -c diff.renameLimit=20000 diff --name-only -z --no-renames d01e69c54 3808a75b8 | tr '\0' '\n' | sed '/^$/d' | wc -l
4252                                              # the acceptance-criterion denominator
$ git -c diff.renameLimit=20000 diff --name-status --no-renames d01e69c54 3808a75b8 | cut -f1 | sort | uniq -c
3424 A
 424 D
 404 M
```

### 2.1 Per-area file counts

Areas are evaluated **in the listed order, first match wins**, so every path lands in exactly one
row — the rows are disjoint by construction and their sum is therefore an overlap check, not just a
tally. Produced by one pass over the 4,252-path list:

```
$ git -c diff.renameLimit=20000 diff --name-only -z --no-renames d01e69c54 3808a75b8 \
    | tr '\0' '\n' | sed '/^$/d' > files-c1.txt
$ python3 …  # first-match-wins classifier over files-c1.txt; full predicate list reproduced below
```

| Area (pathspec predicate, first match wins) | files | research | Δ |
|---|---:|---:|---|
| **A01b** strapi-removal — `backend/` ∪ `apps/frontend/tests/strapiDataProvider` | 252 | 3 (tests only) | see § 2.2 |
| **A02** `packages/*` excl. `dev-seed`, `supabase-types` | 97 | 97 | 0 |
| **A03** `apps/supabase/` ∪ `packages/supabase-types/` ∪ `supabase/` | 118 | 118 | 0 |
| **A04** `packages/dev-seed/` | 161 | 161 | 0 |
| **A05** `tests/` | 195 | 195 | 0 |
| **A06** `apps/frontend/src/lib/` | 526 | 526 | 0 |
| **A07** `apps/frontend/src/routes/` | 200 | 200 | 0 |
| **A07b** `apps/frontend/src/params/` | 6 | 6 | 0 |
| **A08** `apps/frontend/messages/` | 329 | 329 | 0 |
| **A09** `apps/docs/` ∪ `docs/` ∪ root `*.md` | 40 | 39 | +1 |
| **A11** `.planning/` ∪ `.claude/` ∪ `.agents/` | 2,283 | 2,248 | **+35** |
| **A10r** ▶ **RESIDUAL** `apps/frontend/` outside `src/` and `messages/` | **18** | *not named* | **new row** |
| **A10s** ▶ **RESIDUAL** `apps/frontend/src/` outside `lib/`, `routes/`, `params/` | **7** | *not named* | **new row** |
| **A10** root config / tooling (everything remaining) | 20 | 22 | −2 |
| **TOTAL** | **4,252** | — | — |

**The sum is 4,252 — exactly the independently measured total, so the divergence is 0.00% against a
2% allowance.** Sum-equals-total is the *overlap* proof (no path counted twice); first-match-wins
plus a residual bucket that absorbs everything is the *gap* proof (no path counted zero times).

**Every research-time code area reproduces to the file** except `.planning`/`.claude` (+35, this
phase's own artifacts) and the two rows research never had. The +1 in A09 is
`docs/key-generation.md`, the top-level file 151-01 already found needs a bare `docs` pathspec in
slice 09; the −2 in A10 is the reciprocal of A09's +1 plus a boundary shift, not a disappearance.

### 2.1a The residual `apps/frontend/` paths — enumerated

**This is the row the research's area table does not name, and it is exactly where a partition gap
would open.** 151-01 flagged slice 10 as "the weakest boundary … mixes root tooling with the ~25-file
`apps/frontend` shell remainder". Measured, the remainder is **25 files (18 + 7)**:

**A10r — `apps/frontend/` outside `src/` and `messages/` (18):**

```
apps/frontend/.gitignore                          apps/frontend/postcss.config.cjs
apps/frontend/Dockerfile                          apps/frontend/project.inlang/settings.json
apps/frontend/README.md                           apps/frontend/scripts/flatten-current-codemod.mjs   ← F-03
apps/frontend/capacitor.config.ts                 apps/frontend/scripts/store-to-state-codemod.mjs    ← F-03
apps/frontend/docker-compose.dev.yml              apps/frontend/static/images/e2e-test-image-1.jpg
apps/frontend/eslint.config.mjs                   apps/frontend/svelte.config.js
apps/frontend/package.json                        apps/frontend/tailwind.config.mjs
                                                  apps/frontend/tsconfig.json
                                                  apps/frontend/tsconfig.tsbuildinfo                  ← F-08
                                                  apps/frontend/vite.config.ts                        ← item 4, unlinted
                                                  apps/frontend/vitest.config.ts
```

**A10s — `apps/frontend/src/` outside `lib/`, `routes/`, `params/` (7):**

```
apps/frontend/src/app.css        apps/frontend/src/hooks.server.ts
apps/frontend/src/app.d.ts       apps/frontend/src/hooks.ts
apps/frontend/src/app.html       apps/frontend/src/tailwind-theme.css
apps/frontend/src/error.html
```

**Three consequences for plan 151-05's partition:**

1. **`hooks.server.ts` is in the residual bucket.** It is the SvelteKit server hook — Supabase
   session handling and locale resolution, i.e. an **auth-boundary file** (checklist item 2, OWASP).
   Leaving it in a "root config / tooling" slice buries the single most security-relevant frontend
   file in the least security-reviewed PR. 151-05 should give A10s a home with the frontend, not
   with `turbo.json`.
2. **Two dead one-shot codemods sit in A10r** (finding F-03) and would ride into whichever slice
   claims it.
3. **`tsconfig.tsbuildinfo` is a tracked build artifact** (finding F-08) and is likewise in A10r.

### 2.1b The root-config residual — enumerated (20)

```
.bg-shell/manifest.json      .github/workflows/main.yaml   .prettierignore
.changeset/README.md         .github/workflows/release.yml .yarn/releases/yarn-4.13.0.cjs
.changeset/config.json       .gitignore                    .yarn/releases/yarn-4.6.0.cjs
.env.example                 .husky/pre-commit             .yarnrc.yml
.github/dependabot.yml       .lintstagedrc.json            docker-compose.dev.yml
.github/workflows/docs.yml                                 package.json
                                                           render.example.yaml
                                                           turbo.json
                                                           yarn.lock
```

Note `.github/workflows/main.yaml` lands here — the file that defines every CI gate in § 1, and
whose conditional `supabase-tests` job is § 1.5's subject. Whichever slice owns it is where the CI
posture gets reviewed.

### 2.2 The +271 "drift" was a measurement-method difference, not repo drift

`151-01-SUMMARY.md` records: *"Research measured 3969 reconstructed files; today it is **4240**
(+271), because Phases 141–150 advanced `feat-gsd-roadmap` after the research session."*

**That attribution is false, and the arithmetic that replaces it is exact.**

**Refutation, three independent lines:**

1. **Phases 141–150 do not exist.** `ls -d .planning/phases/1[4-5]*/` returns only `140-…` and
   `151-…`; `.planning/ROADMAP.md:720` lists Phase 147 as `0/TBD — Not started`.
2. **`origin/main` never moved** — `ac30f132a` at research time, at 151-01, and now.
3. **The code surface is unchanged**, measured on research's own method (`C1D → TARGET`):

```
$ git -c diff.renameLimit=20000 diff --name-status --no-renames d65ca1a95 3808a75b8 | cut -f1 | sort | uniq -c
3424 A
 175 D          ← research: 175 D   (identical)
 404 M          ← research: 404 M   (identical)
$ git -c diff.renameLimit=20000 diff --name-only --no-renames d65ca1a95 3808a75b8 | wc -l
4003            ← research: 3969
$ … --diff-filter=A … | grep -cE '^(\.planning/|\.claude/)'
2282            ← research: 2248     (+34)
$ … --diff-filter=A … | grep -vcE '^(\.planning/|\.claude/)'
1142
$ git -c diff.renameLimit=20000 diff --name-only --no-renames d65ca1a95 3808a75b8 -- . ':(exclude).planning' ':(exclude).claude' | wc -l
1721            ← research: ~1723    (−2)
```

**`D` and `M` are byte-identical to research. The entire `A` delta is `.planning`/`.claude`.**

**The +271, decomposed:**

| Component | Files | Cause |
|---|---:|---|
| `backend/**` deletions retained in `C1` | **+249** | 151-01 ran `build-rename-commit.sh` **without** `--drop-prefix backend/` (D-09 Q4 moves the Strapi removal to slice 01b). Research's `C1` dropped `backend/`, so those 249 paths were already absent from its tree and never appeared in its `C1 → target` diff. **A method difference, present at commit 1 of the phase.** |
| `.planning`/`.claude` growth, research → `ca10b9736` | **+22** | Phase 151's own planning artifacts |
| **151-01's total** | **+271** | `4240 − 3969` |
| further `.planning` growth, `ca10b9736` → `df81f5e65` | +12 | Phase 151's plans 01–03 |
| **today's total** | **+283** | `4252 − 3969` = 249 + 34 |

**Zero of it is attributable to any phase between 141 and 150.** The correct statement for the
record is: *research measured with `--drop-prefix backend/`; 151-01 measured without it; the 249-file
difference is the Strapi tree moving from PR #1 into slice 01b, and the remaining 22–34 files are
this phase's own `.planning/` output. The product tree has not moved at all.*

151-01's substantive conclusion — *"nothing was hard-coded, so nothing broke"* — is untouched. Only
the cause is corrected.

### 2.3 Rename inventory — Pitfall 1 reproduced exactly

Measured on the **net** diff `origin/main → feat-gsd-roadmap` (the rename-sensitive comparison), at
both limits, with stderr captured rather than discarded:

```
$ git diff -M --name-status origin/main feat-gsd-roadmap 2>rn-default.err | cut -c1 | sort | uniq -c
3667 A
 668 D
  94 M
 908 R
$ cat rn-default.err
warning: exhaustive rename detection was skipped due to too many files.
warning: you may want to set your diff.renameLimit variable to at least 3667 and retry the command.
$ wc -c < rn-default.err
172

$ git -c diff.renameLimit=20000 diff -M --name-status origin/main feat-gsd-roadmap 2>rn-20000.err | cut -c1 | sort | uniq -c
3440 A
 441 D
  94 M
1135 R
$ wc -c < rn-20000.err
0
```

| Limit | A | D | M | **R** | stderr warning |
|---|---:|---:|---:|---:|---|
| default (git's built-in) | 3,667 | 668 | 94 | **908** | **yes — 172 bytes, 2 lines** |
| `diff.renameLimit=20000` | 3,440 | 441 | 94 | **1,135** | **no — 0 bytes** |

**C-2 reproduces to the file: 908 vs 1,135, a 227-rename divergence.** The 227 undetected renames do
not vanish — they reappear as 227 extra `A` **and** 227 extra `D`, which is how a "layout move"
silently becomes a "mass rewrite" in a reviewer's diff view. The warning goes to **stderr**, so any
invocation that pipes stdout and lets stderr scroll loses it entirely — that is Pitfall 1's actual
mechanism, and it is why every rename-sensitive command in this phase carries `-c
diff.renameLimit=20000`.

**Per-top-level-directory breakdown** (`diff.renameLimit=20000`, NUL-safe parse — the path
`apps/frontend/src/lib/server/api/README.md 21-40-30-014.md` contains a space, Pitfall 2):

```
$ git -c diff.renameLimit=20000 diff -M --name-status --diff-filter=R -z origin/main feat-gsd-roadmap \
    | python3 -c "…NUL-split, count (src_top, dst_top) pairs…"
```

| source → destination | renames | reading |
|---|---:|---|
| `frontend/` → `apps/` | 853 | the monorepo layout move |
| `docs/` → `apps/` | 271 | **C-3 confirmed exactly** — the refresh moved `docs/` too, not just `frontend/` |
| `backend/` → `apps/` | 5 | **spurious** — similarity pairs across a deleted tree |
| `backend/` → `.planning/` | 4 | **spurious** |
| `tests/` → `.planning/` | 1 | **spurious** |
| `frontend/` → `packages/` | 1 | **spurious** |
| **total** | **1,135** | |

**11 of the 1,135 detected renames are spurious cross-tree pairs** — the T-151-01-02 threat,
measured. This is the whole argument for deriving the path map **by rule**: `C1` produces
**1,316 R / 0 A / 0 M / 0 D at `diff.renameLimit=1`**, because every output blob OID is copied
unchanged, while similarity detection at its most generous limit finds only 1,135 and gets 11 of
them wrong.

1,316 (by rule) − 1,124 (`frontend/`+`docs/`, detected) = **192 renames similarity detection misses
even at limit 20000** — files whose content changed enough to break the pairing. A reviewer reading
the detected diff sees those 192 as add+delete pairs.

### 2.4 Segment overlap — re-measured, and it has not moved

The central tradeoff in plan 151-05's partition: D-09 splits the pre-v2.4 prefix chronologically and
the post-v2.4 tail by subsystem, so any file in **both** segments is read twice by the reviewer, the
first time in a version a later PR rewrites.

```
$ git merge-base origin/main feat-gsd-roadmap
9e0399286dfa269d23741b0b7829facbd084a971
$ git rev-parse 983eef384                      # v2.4 close, "chore(v2.4): Full Svelte 5 Rewrite — config and cleanup"
983eef384dc467af78cd7c64c9eb9d66c7d1ff95
$ git rev-list --count 9e0399286..983eef384    # prefix commits
35
$ git rev-list --count 983eef384..feat-gsd-roadmap
2538

$ git -c diff.renameLimit=20000 diff --name-only --no-renames 9e0399286 983eef384 \
    -- . ':(exclude).planning' ':(exclude).claude' | sort -u > seg-prefix.txt
$ git -c diff.renameLimit=20000 diff --name-only --no-renames 983eef384 feat-gsd-roadmap \
    -- . ':(exclude).planning' ':(exclude).claude' | sort -u > seg-tail.txt

$ wc -l < seg-prefix.txt                          # 3598
$ wc -l < seg-tail.txt                            # 901
$ comm -12 seg-prefix.txt seg-tail.txt | wc -l    # 459   both
$ comm -23 seg-prefix.txt seg-tail.txt | wc -l    # 3139  prefix-only
$ comm -13 seg-prefix.txt seg-tail.txt | wc -l    # 442   tail-only
```

| Set | `comm` invocation | files | research | Δ |
|---|---|---:|---:|---:|
| pre-v2.4 prefix (code only) | `wc -l < seg-prefix.txt` | **3,598** | 3,598 | **0** |
| post-v2.4 tail (code only) | `wc -l < seg-tail.txt` | **901** | 901 | **0** |
| **in both segments** | `comm -12 seg-prefix.txt seg-tail.txt` | **459** | 459 | **0** |
| prefix-only | `comm -23 seg-prefix.txt seg-tail.txt` | **3,139** | 3,139 | **0** |
| tail-only | `comm -13 seg-prefix.txt seg-tail.txt` | **442** | 442 | **0** |

**Every value re-measures identically. Zero drift.** Consistent with § 2.2: the product tree has not
moved since research, so the segment sets could not have moved either. The prefix commit count
(**35**) and the "already milestone-squashed" property also hold.

`--no-renames` is deliberate on both sides: the two lists are compared by path with `comm`, so
rename *detection* on one side and not the other would manufacture phantom differences. This is the
same trap 151-02 hit from the other direction (its `--union` total needed `--no-renames` to avoid
reporting a 1,135-file phantom gap).

**The tradeoff, stated for plan 151-05's operator decision:** 459 of the 901 tail files —
**51.0%** — are also touched by the chronological prefix. Reviewing the prefix chronologically means
reading a majority of the tail's files in a superseded version first. The number is current as of
`df81f5e65`.

<!-- gsd:write-continue -->
