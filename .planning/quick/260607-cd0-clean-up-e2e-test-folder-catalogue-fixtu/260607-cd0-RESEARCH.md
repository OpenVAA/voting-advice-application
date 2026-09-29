# Quick Task 260607-cd0: E2E test-folder cleanup — Research (judgment layer)

**Researched:** 2026-06-07
**Domain:** Playwright E2E test infrastructure organization (`tests/tests/`)
**Confidence:** HIGH (grounded in actual file reads + import-grep across the suite)

## Summary

This is the JUDGMENT layer. It does NOT execute the exhaustive import-graph catalogue —
that is the executor's mechanical job. It gives the executor (a) a crisp classification rule,
(b) a tiered definition of "duplicate", (c) a verdict on each scouted overlap pair, (d) the
correct grep methodology (including the barrel-export trap), and (e) the consolidation risks.

**Headline finding — the scouted "overlap" pairs are NOT duplicates.** Every pair the scout
flagged is documented in-code as a *deliberate* sibling: a domain assembler (`utils/`) next to
its generic Playwright-primitive counterpart (`helpers/`), or a legacy module next to its
function-fixture successor that coexist by design until a later migration. The real cleanup
wins are (1) **3 genuinely dead modules** with zero spec importers, and (2) a **folder-split
that is principled but unevenly applied**. The duplication-by-name premise should be largely
refuted in the report, with the executor's energy redirected to dead-code removal + a small
number of true near-duplicate functions surfaced by behavioral (not filename) comparison.

**Primary recommendation:** Catalogue against the taxonomy in §1; classify duplicates by the
tiers in §2; treat §3's verdicts as the authoritative starting point; lead the proposed
deprecation plan with the 3 confirmed dead modules (§3.5), not the scouted name-pairs.

## User Constraints (from CONTEXT.md)

- **Analysis only this run.** Produce CATALOGUE + OVERLAP analysis + PROPOSED deprecation plan.
  Delete/rewrite nothing now.
- **Scope:** `fixtures/`, `helpers/`, `utils/`, `setup/` + a stray-artifact cleanup *proposal*.
- **Deprecate = consolidate** (in the follow-up): merge dupes into ONE canonical module,
  rewrite all spec imports, delete the redundant file. The proposed plan must name the
  canonical target, list files to delete, and list every import site to rewrite.
- **Discretion:** report format/location, the taxonomy, the "duplicate" definition, and
  whether to unify `helpers/` vs `utils/` — present as recommendation, not foregone conclusion.

## 1. Taxonomy & Boundaries

The repo already has a written, coherent boundary (`helpers/README.md` + `helpers/index.ts`
docstring, traceable to `86.2-RESEARCH.md`). It is principled, not accidental. Use it verbatim
as the classification rule; do NOT invent a new taxonomy.

| Layer | Working definition (this repo) | Operates on | Naming |
|-------|--------------------------------|-------------|--------|
| **fixture** | A Playwright `test.extend` *fixture function* (`create*Page`, `createEmailBucket`, …) modelling a page surface or capability, OR a **composition root** that `mergeTests`-style assembles fixtures and re-exports `{ test, expect }`. | A `Page`/`Locator`, wired into the test object | `*.fixture.ts` (leaf), or a bare composition root (`views.ts`, `candidate-journey.ts`, `perm-l10n.ts`, `voter-journey.fixture.ts`) |
| **helper** | Thin generic Playwright wrapper, **NO domain knowledge**. Distils one recurring wait/race/probe shape. | raw `Page`/`Locator`/`SupabaseAdminClient` only | `*.helper.ts`, exported through `helpers/index.ts` |
| **util** | Domain-specific assembler or catalog (the voter journey, the testId catalog, the Supabase test client, the route builder, translation reader). | the voter/candidate domain, filesystem, env | plain `*.ts` in `utils/` |
| **setup** | Playwright project-dependency `*.setup.ts` / `*.teardown.ts` run as a dependency project, plus the `setupFromTemplate.ts` shared driver. Seeds/tears down DB state for a spec class. | `SupabaseAdminClient`, seed templates | `*.setup.ts` / `*.teardown.ts` |

**Crisp classifier rule (recommend to executor):**
1. Is it a Playwright project-dependency that seeds/tears down DB state? → **setup**.
2. Does it return a `test.extend` fixture fn or re-export `{ test, expect }`? → **fixture**.
3. Does it touch ONLY raw Playwright primitives (no `testIds`, no domain routes/journeys)? → **helper**.
4. Otherwise (domain assembler / catalog / fs / env reader) → **util**.

**helpers/ vs utils/ split — verdict: KEEP, do not unify.** The split is a real semantic
axis (generic-primitive vs domain-aware), is documented with a tie-breaker ("when in doubt
prefer utils/"), and the README's own contract notes are load-bearing (e.g. `walkVoterIteration`
maxSteps=6, `iterateSelectOptions` combobox/listbox ARIA contract). Collapsing them would
erase a meaningful "this code knows nothing about OpenVAA" guarantee. Recommend the report
**refute** the "two buckets for shared code = redundant" framing. The only defensible tidy is
to confirm every file is on the correct side (see §3.1 — navigation is correctly split today).

## 2. Definition of "duplicate" (tiered — apply consistently)

| Tier | Name | Evidence required | Action |
|------|------|-------------------|--------|
| **D1** | Exact / near-exact copy | Same function body (modulo whitespace/renames); copy-paste constants (e.g. `MAILPIT_URL`, `POLL_*` literals appearing in two files). | Merge; one canonical source. |
| **D2** | Functional overlap | Same *job*, different name/signature, verified by reading both bodies — NOT by filename similarity. e.g. two functions that both "walk Home→intro→question". | Merge only if call-sites can adopt one signature without behavior loss; otherwise document as intentional sibling. |
| **D3** | Superseded / dead | Zero spec (and zero transitive) importers, OR a legacy module fully replaced by a fixture that all live specs use. | Delete (D3-dead) or schedule migration then delete (D3-superseded). |

**Evidence rules for the executor:**
- D1 needs a body diff, not a name match. Constant duplication (the `emailBucket.fixture`
  docstring literally says it mirrors `emailHelper.ts:15`) is D1-at-the-constant-level but
  D3-superseded at the module level — classify at the level the consolidation acts on.
- D2 must cite the two function bodies and the divergence (different seed assumptions,
  rigidity contract, scope). "Different name, same concept" alone is NOT D2 — most scouted
  pairs fail this and are legitimately distinct (§3).
- D3-dead requires the full grep in §5 returning zero importers across `tests/` AND a check
  that no transitive-only importer is itself dead (cascade — see `paths.ts` in §3.5).

## 3. Verdicts on the scouted overlap signals

Read each pair's source + traced importers. **None of the four named pairs is a deletable
duplicate.** Details:

### 3.1 navigation: `helpers/navigation.helper.ts` vs `utils/voterNavigation.ts` vs `utils/buildRoute.ts` + `utils/paths.ts` — NOT duplicates
- `navigation.helper.ts` (`clickAndRaceSettle`, `expectLandedOn`) is the **generic** click+settle
  wrapper. Its docstring *explicitly* states it co-exists with `voterNavigation.ts`'s
  `advanceClick` by design (one generic, one voter-journey-specific). Correct helpers/utils split.
- `voterNavigation.ts` (380 LOC) is the **domain** voter-journey assembler with seed-UUID
  caching — a different layer, not a copy.
- `buildRoute.ts` (typed route builder, 12 importers) and `paths.ts` (fs path constants) are
  unrelated concerns to navigation; lumping them in was a naming-proximity artifact. **buildRoute
  is heavily used and stays.** (`paths.ts` is dead for a *different* reason — §3.5.)
- **Verdict:** legitimately distinct (D-none). Report should retire this signal.

### 3.2 email: `utils/emailHelper.ts` vs `fixtures/shared/emailBucket.fixture.ts` — D3-superseded (NOT D1)
- `emailBucket.fixture.ts` **wraps** the same Mailpit HTTP plumbing and its docstring says it is
  a SIBLING that coexists "until emailHelper.ts is retired."
- `emailHelper` still has **2 live importers** (`candidate-journey.spec.ts`,
  `perm-localisation-positive.spec.ts`). So it is NOT dead — it is *superseded-but-still-used*.
- **Verdict:** D3-superseded. Consolidation = migrate those 2 specs onto `emailBucket` fixture,
  then delete `emailHelper.ts`. There IS D1 constant duplication inside (`MAILPIT_URL`, poll
  literals) — but the right fix is the module-level migration, not extracting a shared constant
  that would then have one importer. This is the ONE genuine consolidation among the named pairs,
  but it is gated on a fixture-migration of 2 specs — flag as medium-effort, not a free delete.

### 3.3 i18n: `utils/translations.ts` vs `fixtures/candidate/perm-l10n.ts` — NOT a pair (one is dead, the other unrelated)
- `perm-l10n.ts` is a **fixture composition root** (assembles candidate fixtures + langSelector
  + multilingualTextField + recipientEmail option). It has nothing to do with reading translation
  JSON.
- `translations.ts` is a **filesystem reader** that flattens locale JSON into a `TRANSLATIONS`
  map — and it has **ZERO importers anywhere in `tests/`** (verified: only self-reference).
- **Verdict:** not a duplicate pair. `translations.ts` is **D3-dead** (→ §3.5). `perm-l10n.ts`
  stays (live composition root for the localisation perm specs).

### 3.4 voter intro: `utils/voterIntro.ts` vs `fixtures/voter/voterIntroPage.fixture.ts` — NOT duplicates
- `voterIntroPage.fixture.ts` (54 LOC) = page-object fixture for the `/intro` page only
  (`goToPage`/`expectPageVisible`), consumed via the `views.ts` composition root.
- `voterIntro.ts` (222 LOC) = the **minimal-seed perm journey assembler** (home→intro→elections→
  constituencies walk with hard-assertion rigidity), imported directly by **7 perm specs**.
  Different scope (full walk vs single page), different layer (util vs fixture), different
  consumers. Some surface overlap in the bypass-intro step, but adopting one for the other would
  lose either the perm seed assumptions or the fixture composition.
- **Verdict:** legitimately distinct (D-none, possibly weak D2 at the single `bypassIntroThen`
  step — executor may note as a future micro-extraction, not a consolidation target now).

### 3.5 NEW finding — genuine dead code (the real cleanup win)

| Module | Importers (whole `tests/`) | Tier | Note |
|--------|----------------------------|------|------|
| `utils/translations.ts` | **0** | D3-dead | No spec or fixture imports `TRANSLATIONS`. |
| `utils/paths.ts` | **1**, only `translations.ts` | D3-dead (cascade) | `FRONTEND_DIR`/`REPO_ROOT` consumed solely by the dead `translations.ts`. Dies *with* it. |
| `utils/answerQuestion.ts` | **0** | D3-dead | Zero importers (symbol + path grep). |

These 3 (a 2-file cascade + 1 standalone) are the cleanest, lowest-risk deletions and should
**lead** the proposed deprecation plan. The follow-up can delete all three with no import
rewrites (translations+paths) / no rewrites (answerQuestion). **Caveat for executor:** before
the follow-up deletes, re-run the grep — `paths.ts` is only dead *conditionally on* deleting
`translations.ts`; if a future change adds a `paths.ts` consumer, it un-dies.

## 4. Playwright / fixture-org best practice (alignment check)

The suite already follows idiomatic Playwright:
- **Function-fixtures + composition roots** (`views.ts`, `candidate-journey.ts`, `perm-l10n.ts`,
  `voter-journey.fixture.ts`) each do `test.extend` and re-export `{ test, expect }`. This is the
  standard `mergeTests`/fixture-composition model. Specs import `{ test, expect }` from the root
  they need. This is correct — do not "flatten" composition roots into one mega-root.
- **Page-object-as-fixture** rather than classic POM classes — a deliberate, documented choice.
- **Helpers take primitives, never fixture instances** (README "Fixture boundary") — matches the
  Playwright guidance that helpers stay framework-generic.

**Pitfalls when consolidating fixtures (warn the planner):**
- **Fixture identity / multiple roots:** `views.ts` and the legacy `index.ts` root "coexist until
  a future phase migrates Page-Object specs." Merging composition roots can change which fixtures
  a spec receives and silently break worker/test scope. Do not merge roots in this cleanup.
- **Worker vs test scope:** seed-UUID caching in `voterNavigation.ts` is process-cached; setup
  projects are worker-scoped. Consolidating anything touching seed state risks isolation leaks
  (exactly the Phase-93 Cluster-B election-count leak — see `phase93-e2e-regression-clusters.md`).
- **Import cycles:** `voterNavigation.ts` already imports `voterHomePage.fixture` AND
  `helpers/index.ts`; `navigation.helper.ts` imports `voterNavigation.ts`. There is a
  util↔helper↔fixture web — any "merge into one file" risks a cycle. Prefer leaving layers split.

## 5. Catalogue methodology (HOW the executor builds the usage map)

**Grep both import forms — the barrel hides direct usage.** `helpers/index.ts` re-exports 6
symbols. A spec importing `{ TIMEOUTS }` from `'../../helpers'` will NOT match a grep for
`timeouts.helper` / `helpers/timeouts`. To map true usage of any helper module:
1. Grep the **module path** (`helpers/settle.helper`, `utils/voterIntro`).
2. ALSO grep each **exported symbol** it provides (`settleNetworkIdle`, `walkVoterIteration`,
   `TIMEOUTS`, `clickAndRaceSettle`, …) to catch barrel imports from `'../../helpers'`.
3. ALSO grep the **barrel path** (`from '../../helpers'`) and resolve which symbols each barrel
   importer actually destructures.

**Transitive usage:** a module used by zero *specs* but imported by a *live fixture/util* is NOT
dead (e.g. `voterHomePage.fixture` is pulled in by `voterNavigation.ts`). Build the map as:
`spec → (fixture roots | direct utils/helpers) → transitive utils/helpers`. Mark a module dead
ONLY if the transitive closure from every spec excludes it. Confirmed dead set today:
`translations.ts`, `paths.ts` (cascade), `answerQuestion.ts`.

**Recommended grep recipe per module:**
```bash
# module path + every exported symbol, across all of tests/
grep -rln "<module-path>\|<Symbol1>\|<Symbol2>" tests/ --include="*.ts" | grep -v "<self-file>"
```
Cross-check counts against this run's spot-checks: `testIds` 47, `supabaseAdminClient` 34,
`buildRoute` 12, `testsDir` 9, `voterIntro` 7 (all perm specs), `voterNavigation` 4,
`candidateJourneyConstants` 4, `testCredentials` 4, `emailHelper` 2 (specs), `missingNominations`
1, `answerQuestion`/`translations` 0, `paths` 1-cascade-only.

**setup/ catalogue:** the 22 `perm-*` setup/teardown pairs map 1:1 to perm specs by name and run
as Playwright dependency projects (not imported by specs). Catalogue them by the playwright-config
project graph (project `dependencies`), NOT by `import` grep — they won't show up in import greps.
`setup/shared/setupFromTemplate.ts` is the shared driver they all call; verify its importers
separately.

## 6. Consolidation risks / load-bearing "duplicates"

- **`emailHelper.ts` is load-bearing** (2 live spec importers). Its consolidation is a
  spec-migration, not a delete. Sequence: migrate `candidate-journey.spec.ts` +
  `perm-localisation-positive.spec.ts` to the `emailBucket` fixture, run those specs green,
  THEN delete. Do not delete first.
- **Template / `--likely-only` coupling (CLAUDE.md):** the voter fixtures
  (`answeredVoterPage`, `walkVoterIteration` maxSteps=6) are coupled to the `e2e/base` seed and
  the `--likert-only` flag, which drops non-ordinal opinion questions. Any consolidation touching
  voter-walk code can silently change step counts / question types and break specs only under the
  non-`--likert-only` seed. Treat voter-walk modules as high-risk; prefer leaving them split.
- **Phase-93 regression precedent:** stale seed literals (`test-*` vs `test-e2e-base-*`) and a
  dropped playwright serialization edge caused election-count leaks. Consolidating
  `voterNavigation.ts` / setup modules risks re-introducing both. The cleanup should avoid
  touching seed-literal-bearing or setup-graph code unless absolutely necessary.
- **Composition-root coexistence** (`views.ts` ↔ legacy `index.ts`; `candidate-journey.ts` ↔
  `perm-l10n.ts`): documented as intentional until a separate migration phase. NOT in scope to
  merge here.
- **Barrel churn:** if any `helpers/` file is removed/renamed, `helpers/index.ts` re-exports must
  be updated in the same commit or every barrel importer breaks at once. List barrel edits as
  explicit steps in the follow-up plan.

## 7. Stray-artifact cleanup proposal (verified gitignore status)

| Artifact | Status (verified `git check-ignore`) | Recommendation |
|----------|---------------------------------------|----------------|
| `tests/playwright-results/` | IGNORED | No action (already gitignored). Optionally `rm -rf` locally — not tracked. |
| `tests/playwright-results-cell4/` | IGNORED | Same — already ignored; safe local delete, no repo change. |
| `tests/playwright-report/` | IGNORED | Same — already ignored. |
| `tests/.planning/` | IGNORED | Same — already ignored. |
| `tests/TEMP.md` | **MISSING** (does not exist) | No action — already gone. |
| `tests/IDURA-TEST-RUNBOOK.md` | **UNTRACKED, not ignored** | DECISION NEEDED: either (a) move into a tracked docs location and commit, or (b) add to `.gitignore` if it's a scratch runbook. Do not silently delete — it's an authored doc, not generated output. |

Net: the output dirs are *already* gitignored (the scout's "tracked/stale" concern is stale —
they are not tracked). The only real action item is `IDURA-TEST-RUNBOOK.md` (keep-and-track vs
ignore — surface to user). Root `TEMP.md` (the one in git status) is at repo root, outside
`tests/` scope, and the `tests/TEMP.md` named in CONTEXT.md does not exist.

## Assumptions Log

| # | Claim | Risk if wrong |
|---|-------|---------------|
| A1 | `translations.ts`, `paths.ts`, `answerQuestion.ts` are dead based on grep of `tests/` only. | If a non-`tests/` consumer or a dynamic/string import exists, deletion breaks it. Executor must re-grep the whole repo + check for dynamic imports before the follow-up deletes. |
| A2 | The 22 perm setup/teardown pairs are 1:1 with perm specs via the playwright project graph. | If a setup is orphaned (no matching spec/project edge) it could be dead too — executor should diff setup files against playwright-config project deps. |

## Open Questions

1. **`IDURA-TEST-RUNBOOK.md` disposition** — keep+track or gitignore? User decision; not
   inferable from code.
2. **Legacy voter `index.ts` composition root** — referenced by `views.ts` docstring as
   coexisting, but not in the scouted inventory. Executor should confirm whether it still exists
   and who imports it as part of the full catalogue.

## Sources

- **Primary (HIGH):** Direct reads of `helpers/README.md`, `helpers/index.ts`,
  `navigation.helper.ts`, `voterNavigation.ts`, `buildRoute.ts`, `paths.ts`, `emailHelper.ts`,
  `emailBucket.fixture.ts`, `translations.ts`, `perm-l10n.ts`, `voterIntro.ts`,
  `voterIntroPage.fixture.ts`, `views.ts`, `candidate-journey.ts`, `voter-journey.fixture.ts`;
  import-grep + `git check-ignore` across `tests/`.
- **Secondary:** `.planning/debug/phase93-e2e-regression-clusters.md` (seed-literal + isolation
  regression precedent); `CLAUDE.md` Testing section (`--likert-only`/template coupling).

**Confidence breakdown:** Taxonomy HIGH (in-tree doc) · Overlap verdicts HIGH (read both bodies +
traced importers) · Dead-code HIGH (zero-importer grep verified, cascade noted) · Stray artifacts
HIGH (git-verified).
