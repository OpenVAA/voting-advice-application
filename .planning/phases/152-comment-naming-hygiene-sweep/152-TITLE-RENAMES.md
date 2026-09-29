# 152-13 — the test-title rename queue, its selection-safety proofs, and its citation chase

Built by plan `152-13`, Task 1. **No byte of `apps/`, `packages/` or `tests/` was changed while this
document was written**; the tree is untouched until Task 2.

---

## 0. What this document decides, and what it deliberately does not

Two families of token reach a test title in this repository and they look identical to the
`task-id` gate row:

1. **Planning references** — citations of phases, plans, decisions, criteria, research pitfalls,
   assumptions, risk registers, UAT gaps, `.planning/` artefacts. **This plan sweeps these.**
2. **E2E coverage ids** — `EFLOW-nn`, `EPERM-nn`, `EQTYP-nn`, `UNBLK-nn`, `TMPL-nn`, `GEN-nn`,
   `CLI-nn`, `ASSERT-nn`, `RUNES-nn`, `CLEAN-nn`, `NF-nn`, `CR-nn`, `VGATE-nn`. These name
   behaviours, are recorded verbatim in the E2E run registers, and one pair is cited by the
   **blocking** `e2e-visual` CI job. **This plan does not touch them, and does not rule on them.**

The disposition of family 2 is **DEFERRED-TO-OPERATOR** (phase memo item 12, first raised by
`152-07`, sharpened by `152-11`). It is not an ordinary unsatisfiable-by-construction row: it
*could* be satisfied, and must not be. See § 5.

---

## 1. Assumption A4 discharged — no CI step selects unit tests by title

`152-RESEARCH.md` flags A4 as verified for Playwright but **not** verified for vitest. Read
`.github/workflows/main.yaml` end to end. There are exactly **two** unit-test invocations, both
plain and unfiltered:

```yaml
# .github/workflows/main.yaml:94-95  (job: frontend-and-shared-module-validation)
      - name: "Run Frontend and shared module tests"
        run: yarn test:unit

# .github/workflows/main.yaml:239-240  (job: dev-seed tests, with Supabase up)
      - name: "Run dev-seed tests (incl. the NF-01 operation budget)"
        run: yarn workspace @openvaa/dev-seed test:unit
```

`test:unit` expands to (`package.json:30`):

```json
"test:unit": "yarn assert:unit-coverage && turbo run test:unit",
```

Neither carries `-t`, `--testNamePattern`, `--grep`, nor any positional title filter. The gate that
runs first, `scripts/assert-unit-test-coverage.mjs`, selects **workspaces and script bodies**
(`TEST_RUNNER = /(^|[\s&|;])vitest(\s|$)/`, `TEST_FILE_PATTERN` over dirents) — it never reads a
test title.

**Finding: no CI step selects unit tests by title.** A4 is discharged; the stop-and-record branch
in Task 1's action does not fire.

There are two E2E invocations, both **tag**-selected (§ 2).

## 2. E2E selection is by tag, not by title

The root script (`package.json:31`):

```json
"test:e2e": "yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring && playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe",
```

and the blocking visual job (`.github/workflows/main.yaml:369-370`):

```yaml
      - name: "Run visual regression tests (blocking)"
        run: PLAYWRIGHT_VISUAL=1 npx playwright test -c ./tests/playwright.config.ts --grep "@visual"
```

Selection is the inversion of the `@probe` tag and the selection of the `@visual` tag. **Consequence:
renaming a title cannot change which E2E specs or projects run** — with one caveat that is honoured
rather than assumed:

> **Playwright's `--grep` matches the title chain, and a `@tag` written inside a title IS part of
> that chain.** So a title that *contains* `@probe` or `@visual` is selection-bearing.

Measured: exactly one queued title contains a tag —
`tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts:133`,
`'@probe default-template results surface (TMPL-03, criterion 1)'`. It is fenced on two independent
grounds (§ 5) and is left byte-identical, so the caveat never becomes live. `git grep` over all three
trees for a title carrying `@probe`/`@visual` returns no other site in the queue.

**Out of scope by prohibition, and asserted unchanged in Task 2:** Playwright **project** names,
`testMatch` regexes, tag strings, setup and teardown names. These are a different family; a rename
there would be an E2E-suite-wide change.

## 3. How the two classes were told apart — by evidence, not by shape

Three independent evidence sources were consulted per token. **Shape was never used as the test**;
`D-07` and `EPERM-07` are the same shape and land in different classes.

| Evidence source | What was scanned | Method |
|---|---|---|
| **E2E run registers** | 1,400 textual files under `tests/e2e-runs/` (`results.json`, `list.txt`, `stdout.log`, `durations.csv`, `drive.sh`, ledgers) — the 6.8 GB tree minus traces/video | Exact **verbatim title** substring match, one pass per file over every extracted title |
| **CI** | all of `.github/` | Per-token literal search |
| **In-tree Markdown** | every tracked `*.md` outside `.planning/` and `.claude/` | Per-token word-boundary search |

The registers turned out to store titles **verbatim**, which makes the test exact rather than
heuristic:

```
tests/e2e-runs/140-f3-measure/results.json:3258:  "title": "18.5. EQTYP-01: multi-choice opinion — …"
tests/e2e-runs/146-noise/list.txt:140:  [_probes] › …:134:3 › @probe default-template results surface (TMPL-03, criterion 1) › parties list is non-empty @probe
```

### 3.1 Result — the split is clean and it is not the split the shape would predict

| | Titles | Register citations |
|---|---:|---|
| Every Playwright title in the residue queue | **19** | **all 19 cited**, 1–61 citing register files each |
| Every vitest title in the residue queue | 62 | **0 cited** |

Per-token evidence (`e2e-runs` = number of citing register files; `ci` = citing files under
`.github/`; `md` = citing in-tree Markdown outside `.planning/`):

| Token | e2e-runs | ci | in-tree md | Class |
|---|---:|---:|---|---|
| `EFLOW-01/02/06/08/09/11` | 21–41 | 0 | — | **2 — fenced** |
| `EFLOW-10` | 0 | 0 | — | **2 — fenced** (same family; sits in an assertion string, not a title) |
| `EPERM-03/04/07/09/10/11` | 12–56 | 0 | — | **2 — fenced** |
| `EQTYP-01/02` | 25 / 61 | 0 | — | **2 — fenced** |
| `UNBLK-04` | 39 | 0 | — | **2 — fenced** |
| `TMPL-03` | 1 | 0 | `packages/dev-seed/README.md` | **2 — fenced** |
| `TMPL-07` | 0 | **1** (`main.yaml:237` step comment) | — | **2 — fenced** |
| `NF-01` | 0 | **1** (`main.yaml:239` **step name**) | — | **2 — fenced** |
| `NF-02` | 0 | 0 | `packages/dev-seed/README.md` | **2 — fenced** |
| `GEN-04` | 0 | 0 | `packages/dev-seed/README.md` | **2 — fenced** |
| `CR-01` | 0 (dir label `140-cr01-gates`) | 0 | `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md` | **2 — fenced** |
| `TMPL-02/08/09`, `GEN-08/09/10`, `CLI-03/04`, `ASSERT-04/08`, `RUNES-05`, `CLEAN-04`, `VGATE-04/05` | 0 | 0 | — | **2 — fenced** by family (see § 5.1) |
| `T-58-07-02` | 0 | 0 | **`packages/dev-seed/README.md` ×3** | **2 — fenced** (see § 5.2) |
| `D-01`, `D-03a`, `D-04`, `D-05`, `D-06`, `D-07`, `D-09` | 0 | 0 | 0 | **1 — swept** |
| `TIR3`, `RES-1`, `P01`, `Risk #7`, `assumption A3`, `A2 fix`, `R3.3`, `UAT gap #1`, `Pitfall #N`, `criterion N`, `Success Criterion 5`, `Bug 1`, `Plan 05`, `RED until :378` | 0 | 0 | 0 | **1 — swept** |

The `D-07` row deserves its own sentence, because it is the one that proves shape is not the test.
`grep D-07 tests/e2e-runs/` returns 11 files — but every hit is the **candidate-journey Playwright
title** `"…(checkboxes + helper + D-07 save gating)"`, a different `D-07`, in a title that is fenced
anyway on ground (a). The `packages/dev-seed` `D-07`s are a different phase's decision ids with zero
register footprint. Shape-matching would have fused them; the citation chase separates them.

## 4. The rename table

**46 rows.** Every row's register-citation result is **none** — verified by the exact-verbatim scan
of § 3 over all 1,400 register files. The `plan-cites` column records planning records that quote the
title verbatim; **those documents are historical evidence and are NOT edited by this plan.**

Coverage: **46 renames across 24 files** (per **rewrite site** — one anchor per row; no row is a
multi-line rewrite). Counted from the table itself, not from the plan's estimate of "roughly 23
anchored occurrences across 20 files" — that estimate came from an anchored grep which, as the plan
warned, under-counts, and which additionally used `\s` in a POSIX ERE where it is undefined.

| # | File : line | Old title | New title | plan-cites |
|---:|---|---|---|---|
| 1 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:131` | `extension reach (D-05)` | `extension reach — .js / .mjs / .cjs under a guarded directory` | 8 |
| 2 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:146` | `dynamic import() closure (D-06)` | `dynamic import() closure` | 9 |
| 3 | `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts:1630` | `clears parentNominationId when the parent nomination is not in the result set (P01)` | `clears parentNominationId when the parent nomination is not in the result set` | 2 |
| 4 | `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts:103` | `candidateContext questionBlocks — Bug 1 (RUNES-05): entityType passed to getApplicableQuestions` | `candidateContext questionBlocks — RUNES-05: entityType passed to getApplicableQuestions` | 1 |
| 5 | `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts:112` | `every blocks-path getApplicableQuestions call receives entityType === Candidate (RED until :378 fix)` | `every blocks-path getApplicableQuestions call receives entityType === Candidate` | 0 |
| 6 | `apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts:265` | `removes the onChange listener on unmount (Pitfall 2 cleanup)` | `removes the onChange listener on unmount` | 0 |
| 7 | `apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts:97` | `Risk #7 backward-compat (childProxies omitted)` | `backward-compat when childProxies is omitted` | 1 |
| 8 | `packages/dev-seed/tests/assertKnownRowProps.test.ts:133` | `assertKnownRowProps — D-03a: one canonical keying (the five R3.3 cases)` | `assertKnownRowProps — one canonical keying (the five camelCase / snake_case cases)` | 0 |
| 9 | `packages/dev-seed/tests/assertKnownRowProps.test.ts:250` | `assertKnownRowProps — D-09: entity_type is denied, the other four skip_columns are excluded` | `assertKnownRowProps — entity_type is denied, the other four skip_columns are excluded` | 1 |
| 10 | `packages/dev-seed/tests/cli/resolve-template.test.ts:114` | `D-07: throws for a built-in carrying an unknown top-level key (was returned unvalidated)` | `throws for a built-in carrying an unknown top-level key (was returned unvalidated)` | 3 |
| 11 | `packages/dev-seed/tests/cli/resolve-template.test.ts:121` | `D-07: a valid built-in still resolves, unchanged in substance` | `a valid built-in still resolves, unchanged in substance` | 2 |
| 12 | `packages/dev-seed/tests/cli/resolve-template.test.ts:126` | ``D-07: the `Unknown template:` path is unchanged by the added validation`` | ``the `Unknown template:` path is unchanged by the added validation`` | 3 |
| 13 | `packages/dev-seed/tests/cli/resolve-template.test.ts:131` | `D-04 + D-07 fallout: every registered built-in passes the strict schema` | `every registered built-in passes the strict schema` | 2 |
| 14 | `packages/dev-seed/tests/cli/teardown.test.ts:252` | `runTeardown (CLI-03 / Pitfall #5 + #6)` | `runTeardown (CLI-03)` | 1 |
| 15 | `packages/dev-seed/tests/cli/teardown.test.ts:253` | `calls bulkDelete exactly once with the 10 allowed tables (Pitfall #6 — no accounts/projects/feedback/app_settings)` | `calls bulkDelete exactly once with the 10 allowed tables (no accounts/projects/feedback/app_settings)` | 0 |
| 16 | `packages/dev-seed/tests/cli/teardown.test.ts:299` | `collects candidate UUIDs BEFORE bulkDelete, lists+removes portraits AFTER (UAT gap #1)` | `collects candidate UUIDs BEFORE bulkDelete, lists+removes portraits AFTER` | 0 |
| 17 | `packages/dev-seed/tests/cli/teardown.test.ts:329` | `scopes listCandidatePortraitPaths to the UUIDs returned by listCandidateIdsByPrefix (UAT gap #1 — prefix isolation)` | `scopes listCandidatePortraitPaths to the UUIDs returned by listCandidateIdsByPrefix (prefix isolation)` | 0 |
| 18 | `packages/dev-seed/tests/determinism.test.ts:62` | `Pitfall #1: runPipeline + fanOutLocales is deterministic at the same seed (generateTranslationsForAllLocales: true)` | `runPipeline + fanOutLocales is deterministic at the same seed (generateTranslationsForAllLocales: true)` | 0 |
| 19 | `packages/dev-seed/tests/determinism.test.ts:81` | `Pitfall #1: locale fan-out produces all 3 locale keys at the default template` | `locale fan-out produces all 3 locale keys at the default template` | 0 |
| 20 | `packages/dev-seed/tests/generators/AppSettingsGenerator.test.ts:27` | `clamps count > 1 to 1 (app_settings UNIQUE on project_id per Pitfall 5)` | `clamps count > 1 to 1 (app_settings is UNIQUE on project_id)` | 0 |
| 21 | `packages/dev-seed/tests/latent/centroids.test.ts:44` | `returns [] when N === 0 (Pitfall-like edge)` | `returns [] when N === 0 (edge case)` | 0 |
| 22 | `packages/dev-seed/tests/latent/centroids.test.ts:124` | `produces finite coordinates over many seeds (Pitfall 1 regression via gaussian.ts)` | `produces finite coordinates over many seeds (regression guard via gaussian.ts)` | 0 |
| 23 | `packages/dev-seed/tests/latent/clustering.integration.test.ts:94` | `Clustering integration (Success Criterion 5)` | `Clustering integration — intra-party vs inter-party separation` | 0 |
| 24 | `packages/dev-seed/tests/latent/gaussian.test.ts:53` | `never returns NaN or Infinity (Pitfall 1 regression guard)` | `never returns NaN or Infinity (regression guard)` | 0 |
| 25 | `packages/dev-seed/tests/latent/latentEmitter.test.ts:79` | `falls back to defaultRandomValidEmit when candidate has no organization (Pitfall 4)` | `falls back to defaultRandomValidEmit when candidate has no organization` | 0 |
| 26 | `packages/dev-seed/tests/latent/latentEmitter.test.ts:88` | `falls back to defaultRandomValidEmit when organizations ref is empty (Pitfall 4)` | `falls back to defaultRandomValidEmit when organizations ref is empty` | 0 |
| 27 | `packages/dev-seed/tests/latent/latentEmitter.test.ts:162` | `candidate with unknown organization id falls back (Pitfall 4 defensive)` | `candidate with unknown organization id falls back (defensive)` | 0 |
| 28 | `packages/dev-seed/tests/latent/loadings.test.ts:54` | `returns {} for empty questions (Pitfall 3 regression)` | `returns {} for empty questions (regression guard)` | 0 |
| 29 | `packages/dev-seed/tests/latent/loadings.test.ts:126` | `produces finite entries over 50 distinct seeds (Pitfall 1 regression)` | `produces finite entries over 50 distinct seeds (regression guard)` | 0 |
| 30 | `packages/dev-seed/tests/latent/positions.test.ts:169` | `produces finite coords over 1000 varied-spread calls (Pitfall 1 regression)` | `produces finite coords over 1000 varied-spread calls (regression guard)` | 0 |
| 31 | `packages/dev-seed/tests/latent/project.test.ts:74` | `ordinal: always returns a string id, never index (Pitfall 5)` | `ordinal: always returns a string id, never index` | 0 |
| 32 | `packages/dev-seed/tests/latent/project.test.ts:231` | `QuestionsGenerator LIKERT_5 A2 fix` | `QuestionsGenerator LIKERT_5 choice normalizableValue` | 0 |
| 33 | `packages/dev-seed/tests/locales.test.ts:20` | `LOCALES is the hardcoded array ["en", "fi", "sv"] in exact order (Pitfall #1)` | `LOCALES is the hardcoded array ["en", "fi", "sv"] in exact order` | 0 |
| 34 | `packages/dev-seed/tests/template.test.ts:125` | ``D-04: still ACCEPTS an arbitrary key inside a fixed[] row — row keys are `assertKnownRowProps`’ authority, not zod’s`` | ``still ACCEPTS an arbitrary key inside a fixed[] row — row keys are `assertKnownRowProps`’ authority, not zod’s`` | 1 |
| 35 | `packages/dev-seed/tests/template.test.ts:134` | ``D-04: `.strict()` does not break the `.extend({ latent })` chain link`` | ``` `.strict()` does not break the `.extend({ latent })` chain link ``` | 2 |
| 36 | `packages/dev-seed/tests/template/linkSentinels.test.ts:254` | `criterion 4 — LINK_SENTINELS is the array the resolver iterates` | `LINK_SENTINELS is the array the resolver iterates` | 0 |
| 37 | `packages/dev-seed/tests/template/linkSentinels.test.ts:255` | `flattens to exactly the hand-enumerated ten (collection, key) pairs — asserted against the CONST (RES-1)` | `flattens to exactly the hand-enumerated ten (collection, key) pairs — asserted against the CONST` | 2 |
| 38 | `packages/dev-seed/tests/template/linkSentinels.test.ts:291` | `D-01 legality: questions._elections IS still read, and targets the election_ids jsonb column` | `questions._elections IS still read, and targets the election_ids jsonb column` | 3 |
| 39 | `packages/dev-seed/tests/template/permittedKeys.test.ts:324` | `the schema copy and the applied migration copy of the CASE block agree (assumption A3)` | `the schema copy and the applied migration copy of the CASE block agree` | 1 |
| 40 | `packages/dev-seed/tests/template/permittedKeys.test.ts:343` | `resolveCollectionName / permittedKeys — D-03a canonical keying` | `resolveCollectionName / permittedKeys — canonical keying` | 0 |
| 41 | `packages/dev-seed/tests/templates/base-app-settings.test.ts:44` | `fixed[0].external_id starts with "test-e2e-base-" so runTeardown("test-e2e-base-", ...) matches (Pitfall 6)` | `fixed[0].external_id starts with "test-e2e-base-" so runTeardown("test-e2e-base-", ...) matches` | 0 |
| 42 | `packages/dev-seed/tests/templates/base-app-settings.test.ts:50` | ``fixed[0] uses `settings` field (NOT `value`) so writer Pass-5 fires (Pitfall 2)`` | ``fixed[0] uses `settings` field (NOT `value`) so writer Pass-5 fires`` | 0 |
| 43 | `packages/dev-seed/tests/writer.test.ts:286` | `routes app_settings through updateAppSettings, NOT bulk_import (Pitfall 5)` | `routes app_settings through updateAppSettings, NOT bulk_import` | 0 |
| 44 | `packages/dev-seed/tests/writer.test.ts:384` | `passes a custom externalIdPrefix when provided (Plan 05 CLI hook)` | `passes a custom externalIdPrefix when provided (CLI hook)` | 0 |
| 45 | `packages/dev-seed/tests/writer.test.ts:429` | `builds alt text as "first_name last_name" trimmed, falling back to external_id when names are empty (WCAG 2.1 AA — Pitfall #4)` | `builds alt text as "first_name last_name" trimmed, falling back to external_id when names are empty (WCAG 2.1 AA)` | 0 |
| 46 | `packages/filters/tests/filter.test.ts:315` | `ChoiceQuestionFilter: TIR3 empty-include semantics` | `ChoiceQuestionFilter: empty-include semantics` | 4 |

**Row 46 is the site the plan exists for** — review comment #4 (*"Never use planning references in
test names. Also rem line breaks from comment."*). The comment above it was already de-cited by an
earlier wave-4 plan; the **title** was left for this plan, and `TIR3` is its last planning reference.

### 4.1 Row count against the residue TSV

The residue register's classes **A1 (73) + A2 (8) = 81 occurrences** are the codemod's
declined-title queue. **None of those 81 occurrences is renamed here** — every one is a coverage id
and is fenced (§ 5). All 46 rows above were found by the two-route sweep of § 6, i.e. **outside** the
TSV's queue. That inversion is the plan's most important finding and it is stated plainly rather
than smoothed over: *the authoritative queue turned out to contain only work this plan must not do,
and all the work it must do lay outside the queue.*

## 5. The fenced set — left byte-identical, and why

### 5.1 The coverage ids — DEFERRED-TO-OPERATOR

**81 residue occurrences across 62 vitest and 19 Playwright titles are left untouched.** Grounds:

**(a) Verbatim register cross-reference.** All 19 Playwright titles are quoted verbatim in
`tests/e2e-runs/**` — between 12 and 61 register files each. Renaming any of them orphans that
evidence, and a broken run-register cross-reference is not recoverable by re-reading a diff:

| Title | Register files citing it |
|---|---:|
| `EQTYP-02: number-scale boundary matching` | 61 |
| `perm-access-disable (EPERM-11)` | 56 |
| `perm-show-feedback-survey (EPERM-09)` | 56 |
| `in-flight selections + answers survive fi→en→fi locale switch (EFLOW-06)` | 56 |
| `perm-interactive-info (EPERM-07)` | 42 |
| `perm-org-matching (EPERM-10)`, `voter-prefs-tracking (EFLOW-08)` | 41 |
| `voter-alliance (EFLOW-02 + EPERM-03/04 riders)`, `voter-journey-mobile (EFLOW-11)`, `voter-nominations (UNBLK-04)` | 39 |
| `2.5. EFLOW-09: candidate nav-menu logged-out item set` | 26 |
| `19.5. EFLOW-09: candidate nav-menu logged-in item set (differs from logged-out)` | 25 |
| `EPERM-07 customData.terms: …`, `EFLOW-01: select-all/none control, …` | 21 |
| `18.5. EQTYP-01: multi-choice opinion — …` | 14 |
| `EPERM-03 rider: …`, `EPERM-04 rider: …`, `EFLOW-02: member-orgs drawer …` | 12 |
| `@probe default-template results surface (TMPL-03, criterion 1)` | 1 |

**(b) A blocking CI job.** `152-11` established that `VGATE-04/05` are cited by the **blocking**
`e2e-visual` job's provenance record. Stripping a coverage id therefore does not merely confuse a
reader — **it fails a required merge check.** `NF-01` is cited in a CI **step name**
(`main.yaml:239`) and `TMPL-07` in a CI step comment (`main.yaml:237`).

**(c) An in-tree Markdown cross-reference the phase may not edit.** `TMPL-03`, `GEN-04` and `NF-02`
are cross-referenced from `packages/dev-seed/README.md`; `CR-01` from `tests/README.md` and
`tests/IDURA-TEST-RUNBOOK.md`. Phase memo item 13 fences Markdown — the classifier maps `md` to an
empty comment family, so `assert-comment-only-diff.mjs` reads every Markdown byte as code and this
phase cannot repair a cross-reference it breaks there.

**(d) Family coherence.** The remaining members — `TMPL-02/08/09`, `GEN-08/09/10`, `CLI-03/04`,
`ASSERT-04/08`, `RUNES-05`, `CLEAN-04` — carry no citation of their own, but stripping half a
coverage vocabulary and keeping the other half produces a register that is worse than either
consistent choice. They stay with their family.

**The `task-id` gate row is therefore reported DEFERRED-TO-OPERATOR, not met and not
unsatisfiable-by-construction.** The distinction matters: the other unsatisfiable rows recorded in
this phase (`152-04`, `152-06`, `152-07`, `152-09`, `152-11`, `152-12`) *cannot* be satisfied without
editing program bytes the zero-allow-entry prover forbids. **This one can be satisfied, and must not
be.** That is an operator ruling, and the operator is away.

### 5.2 `T-58-07-02` — two titles, fenced on the Markdown ground alone

`packages/dev-seed/tests/cli/teardown.test.ts:379` and `:387`
(`throws T-58-07-02 mass-delete guard when prefix is …`).

By the evidence test this is **class 1**: a STRIDE threat-register id, 0 register citations, 0 CI
citations, 4 `.planning/` mentions. It would be swept — except that it is cited **three times in
`packages/dev-seed/README.md`** (lines 67, 303, 336), where it is used as the *name of the guard*:

> `The 2-char minimum (T-58-07-02) prevents …`

Stripping the id from the two titles would leave those three prose cross-references pointing at a
vocabulary the tests no longer use, and memo item 13 forbids this plan from repairing them.
**Left in place; registered.** This is the same shape as `152-12`'s ASVS disclosure control: the
correct edit is none, and the exemption is made legible rather than left to look like an oversight.

### 5.3 The `@probe` title — fenced twice over

`tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts:133` carries a coverage id
(`TMPL-03`), **is cited verbatim** in `tests/e2e-runs/146-noise/list.txt`, **and** contains the
`@probe` tag that `--grep-invert @probe` selects on. Its `criterion 1` fragment is class 1 and would
otherwise be row 47 of the table. It is left byte-identical.

### 5.4 Everything the acceptance grep still returns, and why

Task 2's acceptance criterion asks that

```
git grep -n -P "^\s*(await\s+)?(describe|it|test)(\.\w+)?\(\s*['\"\`][^'\"\`]*([Pp]hase\s*[0-9]|[A-Z]{2,}-?[0-9])" -- packages apps tests
```

return **no line that is not explained here as deliberately retained**. Post-rename it returns
**93 lines**, and they fall into exactly three documented classes — **zero of them is an
unexplained planning reference:**

*(the criterion as written in the plan uses `\s` inside a POSIX ERE, where `\s` is undefined and the
pattern silently matches nothing; it is run above with `-P` so it actually matches. The plan's
anchored form also under-counts by requiring the call at line start — same defect the objective
already flags for the queue-building grep.)*

| Class | Tokens | Lines | Disposition |
|---|---|---:|---|
| **E2E coverage / requirement ids** | `EFLOW-01/02/06/08/09/11`, `EPERM-03/04/07/09/10/11`, `EQTYP-01/02`, `UNBLK-04`, `TMPL-02/03/07/08/09`, `GEN-04/08/09/10`, `GEN-06a…g`, `CLI-03/04`, `ASSERT-04/08`, `RUNES-05`, `CLEAN-04`, `NF-01/02`, `CR-01`, `WR-04`, `IN-01` | 84 | **fenced — § 5.1**, DEFERRED-TO-OPERATOR |
| **Cryptographic algorithm names** | `RS256`, `RSA-OAEP-256`, `OAEP-256` | 7 | not references of any kind — JOSE algorithm identifiers. Deleting the numerals would make seven true statements false (memo item 7). |
| **Test-fixture entity labels** | `EL1`, `EL2`, `EL-1`, `CG-1`, `CG-2` | 4 | not references — the perm datasets' own election and constituency-group labels, asserted against by the specs. |

And the half of the criterion that this plan **does** close outright:

```
$ git grep -n -P "^\s*(await\s+)?(describe|it|test)(\.\w+)?\(\s*['\"\`][^'\"\`]*[Pp]hase\s*[0-9]" -- packages apps tests
$ echo $?   # 1 — no output
```

**No test title in `apps/`, `packages/` or `tests/` carries a phase number.** Nor a plan number, a
spike reference, a `§`, a `.planning/` path, a long or bare decision id, a criterion number, a
research pitfall number, a risk id, a UAT-gap id or an assumption id — see § 10.

## 6. Completeness — both numbers, per rewrite site, by two routes

Unit: **rewrite site** (memo item 19). Each row of § 4 is one site with one anchor; no row is a
multi-line rewrite, so per-site and per-line agree at 46 here — stated so the number can be compared
against sibling plans that had to distinguish them.

| Route | Sites found | Of which fenced | Of which renamed |
|---|---:|---:|---:|
| **A — the nine gate rows / the residue TSV's A1+A2 queue** | 81 occurrences over 81 title-token pairs | **81** | **0** |
| **B1 — widened scanner** (23 classes; 152-08's four, 152-09's ten, 152-11's three, 152-12's dated-marker class, plus this plan's own) | 122 title sites | 81 tokens | 13 |
| **B2 — deliberate read** of all 1,913 extracted titles, filtered to 408 by a planning-vocabulary/digit heuristic and read end to end | — | 2 | **33** |

**Gate blind spot for this partition: 33 of 46 renamed sites — 72%.** That is the highest measured in
the phase; the previous series was 27 / 64 / 54 / 37 / 30 / 67 %. It is high for a structural reason
worth recording: **this plan's partition is exactly the surface the gate was built to see (ids), so
everything the gate sees here is fenced and everything the gate cannot see is the work.**

**Classes only the read found** (none is reachable by any id-shaped pattern):

| Class | Example | Sites |
|---|---|---:|
| research **pitfall** numbers | `(Pitfall #1)`, `(Pitfall 4 defensive)`, `Pitfall-like edge` | 21 |
| planning **criterion** numbers | `criterion 4 — …`, `(Success Criterion 5)` | 2 |
| planning **risk register** | `Risk #7 backward-compat` | 1 |
| planning **UAT gap** | `(UAT gap #1 — prefix isolation)` | 2 |
| **assumption** ids | `(assumption A3)`, `LIKERT_5 A2 fix` | 2 |
| **research/requirement** ids below the two-digit floor | `(RES-1)`, `(P01)`, `R3.3` | 3 |
| planning-artifact **acronym without a hyphen** | `TIR3` | 1 |
| **plan-internal structure** | `Bug 1`, `RED until :378 fix` | 2 |
| bare **plan** number | `(Plan 05 CLI hook)` | 1 |

Two of these are genuinely new to the phase and are carried forward for `152-14`/`152-15`:
**`R\d\.\d` requirement numbering** (`R3.3`) and **single-digit-suffixed ids** (`RES-1`, `P01`) —
both defeat the register's `\b[A-Z]{2,}-\d{2}\b` floor by having only one digit.

**Route-A/register agreement is again not evidence of completeness** (memo item 17): the nine gate
rows and the residue TSV agree exactly at 81 over this partition, and 33 real sites sit outside both.

### 6.1 Out-of-scope findings, registered rather than fixed

Found while sweeping; **not** test titles, so not this plan's to touch:

- `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte:126,160` —
  two **comments** carrying `TIR3` (`post TIR3 cluster 1`). Inside `152-11`'s prefix; matched by no
  gate row (three letters + a bare digit, no hyphen). Comment residue, not a title.
- `packages/dev-seed/tests/latent/clustering.integration.test.ts:97` — a comment reading `B2 fix —`.
  Inside `152-08`'s prefix; same single-letter-plus-digit class.
- `packages/dev-seed/tests/generators/NominationsGenerator.test.ts:86` — a title carrying
  `per migration line 724-731`, an in-tree **line-range pointer**. Not a planning reference; flagged
  because memo item 21 makes line-range pointers a known dangling-reference hazard.

## 7. Pre-rename unit-suite baseline

`yarn test:unit` at `a2da7dbf6`, before any edit:

```
@openvaa/supabase 20 · @openvaa/core 8 · @openvaa/argument-condensation 30 · @openvaa/app-shared 21
@openvaa/matching 43 · @openvaa/llm 39 · @openvaa/question-info 22 · @openvaa/filters 22
@openvaa/data 244 · @openvaa/frontend 816 · @openvaa/dev-seed 570
```

**Total: 1,835 passed · 0 failed · 0 skipped · 0 todo · 173 test files · exit 0.**

Task 2 must reproduce exactly 1,835 with zero skipped and zero not-run.

## 8. pgTAP

`apps/supabase/**/*.sql` pgTAP descriptions were scanned for every class in § 6 and the nine gate
rows: **zero planning references in any pgTAP test description.** Nothing owed.

---

## 9. Landing record

| Rows | Commit | Result |
|---|---|---|
| 1–46 (all of § 4, every row) | **`cc319db17`** — `refactor(152-13): rename 46 test titles carrying planning references, 24 files` | **LANDED.** 24 files, 46 insertions, 46 deletions. One anchor per row; every old title asserted to occur exactly once in its file across the whole batch before any byte was written. |

**Final state.** 46 titles renamed. **17 of the 46 renamed titles carried planning-record
citations** — 46 citing-file references in total, across `WINDOWS.md`, six phase directories
(`143`, `144`, `152`, `154`, `164`, and `milestones/v2.8-phases/69`) and one `.planning/quick/`
session record. (An eighteenth site, the fenced `@probe` title, carries one more; 47 across all 49
candidates.) **No register and no planning record was edited** —
`git diff --stat cc319db17~2..cc319db17 -- tests/e2e-runs/` is empty, and the planning records are
historical evidence, deliberately left to read as they were written.

## 10. Task 3 — the closing gate, and why the repo-wide row is not green

The plan asks for `hygiene-grep-report.sh --assert-clean` to exit 0 repo-wide, and says that if it
does not, *"the failing rows name the partition that missed something; report which plan owns those
files rather than adjusting the gate."* **The gate was not adjusted.** It exits 1. Here is the
attribution, row by row and occurrence by occurrence.

### 10.1 The repo-wide gate, verbatim

```
  pattern               occ   files    bare  expect     verdict
  -----------------  ------  ------  ------  ---------  -------
  phase-ref              21       6      11  occ = 0    FAIL
  spike-ref               0       0       0  occ = 0    OK
  decision-id-long        0       0       -  occ = 0    OK
  decision-id-bare        2       2       -  occ = 0    FAIL
  section-anchor          5       1       -  occ = 0    FAIL
  planning-path           1       1       -  occ = 0    FAIL
  plan-number             0       0       -  occ = 0    OK
  milestone-ver           8       5       -  -          REPORT
  task-id                88      46       -  occ = 0    FAIL

Gate rows failing: 5   →   exit 1
```

### 10.2 Every failing occurrence attributed — and none of them is a test title

| Row | Occ | Where | Owner / disposition |
|---|---:|---|---|
| `phase-ref` | 12 | `apps/frontend/static/fonts/README.md` (2), `packages/dev-seed/README.md` (5), `tests/IDURA-TEST-RUNBOOK.md` (2), `tests/README.md` (3) | **Markdown — memo item 13, DEFERRED-TO-OPERATOR.** `152-08` and `152-11` registered the first two; the two under `tests/` are a **third, previously unregistered Markdown site** and are registered by this plan. |
| `phase-ref` | 5 | `apps/supabase/benchmarks/scripts/run-concurrency-scaling.sh:75,77,112,114,138` | **`152-12`, residue class B1 — correct as written.** `echo "--- PHASE 1: JSONB SCHEMA ---"` names the benchmark's own stage. Deleting the numeral makes a true statement false (memo items 7 and 18). |
| `phase-ref` | 2 | `apps/supabase/supabase/tests/database/00-helpers.test.sql:20,420` | **`152-12` — same class.** `-- Phase 1: Create persistent helper functions` / `-- Phase 2: Smoke tests` name the file's own two stages. |
| `decision-id-bare` | 1 | `apps/frontend/static/fonts/README.md:65` | **Markdown — memo item 13.** |
| `decision-id-bare` | 1 | `tests/scripts/visual-container.sh:505` | **Residue class B2** — an operator-facing `echo`. Registered unowned by `152-05` § 5. |
| `section-anchor` | 5 | `apps/frontend/static/fonts/README.md:19,22,32,34,47` | **Markdown — memo item 13.** Note **three of the five are OFL 1.1 licence sections** (`OFL 1.1 § 2`, `§ 5`) — real legal citations that must survive any ruling. |
| `planning-path` | 1 | `tests/tests/fixtures/voter/voter-journey.fixture.ts:149` | **Residue class F** — a `throw new Error(...)` pointing an engineer at a live operator diagnostic. Registered unowned by `152-05` § 5. |
| `task-id` | **70** | **test titles** across 38 files | **The fenced coverage ids — DEFERRED-TO-OPERATOR (§ 5.1).** |
| `task-id` | 8 | Markdown (`fonts/README.md`, `dev-seed/README.md` ×4, `IDURA-TEST-RUNBOOK.md` ×2, +1) | **Markdown — memo item 13.** |
| `task-id` | 4 | `tests/scripts/determinism-batch.sh:97,266,321,549` | **Residue classes B2 + E** — ledger header text and a shell variable holding a step prefix. |
| `task-id` | 6 | assertion / skip-diagnostic strings: `default-template.integration.test.ts:180,190`, `candidate-bank-auth.spec.ts:167`, `perm-hide-category-tags.spec.ts:50`, `perm-hide-election-tags.spec.ts:50`, `visual-regression.spec.ts:158` | **Residue class D** — the id is what tells a reader *which criterion* failed. Registered unowned by `152-05` § 5. |

`70 + 8 + 4 + 6 = 88`. The decomposition is exact; nothing is unaccounted for.

**The reading that matters:** every single failing occurrence is either (a) a coverage id in a test
title — the fenced question, (b) a Markdown byte — the other fenced question, or (c) a program byte
an earlier plan already registered as correct as written. **Not one is a test title carrying a
planning reference.** That is the property this plan owes, and it is proved below by a named route
rather than asserted.

### 10.3 The named alternate route — the same nine rows, scoped to test titles

`hygiene-grep-report.sh` hardcodes `-- apps/ packages/ tests/` at every call site (its own comment:
`SCOPE IS LOAD-BEARING`) and exits 2 on a caller-supplied pathspec. **It was not modified**
(memo item 2). Its nine patterns were transcribed verbatim from `hygiene-grep-report.sh:150-163` and
applied to the **1,913 test titles** extracted from `apps/`, `packages/` and `tests/` (vitest
`describe`/`it`/`test`, Playwright `test.describe`/`test`/`test.step`, and pgTAP descriptions):

```
title corpus: 1913 titles from apps/ packages/ tests/
  phase-ref          occ=  0  files=  0  OK
  spike-ref          occ=  0  files=  0  OK
  decision-id-long   occ=  0  files=  0  OK
  decision-id-bare   occ=  0  files=  0  OK
  section-anchor     occ=  0  files=  0  OK
  planning-path      occ=  0  files=  0  OK
  plan-number        occ=  0  files=  0  OK
  milestone-ver      occ=  0  files=  0  REPORT
  task-id            occ= 70  files= 38  FAIL   ← the fenced coverage ids, and only those
```

**Eight of nine gated rows clean; the ninth is exactly the fenced set.** `decision-id-bare` was
`11` over `5` files before the renames and is `0` after — that row was closed by this plan.

**Flip test** (a gate that examines nothing also reports green). One synthetic probe title carrying
`phase 999`, `spike 7`, `D-152-04`, `D-77`, `§`, `.planning/x.md`, `plan 12-34` and `ZZZZ-99` was
injected **into the scratch corpus, never into a tracked file** — memo item 22's hazard is avoided by
construction, not by careful `git checkout`:

```
  phase-ref 1 FAIL · spike-ref 1 FAIL · decision-id-long 1 FAIL · decision-id-bare 1 FAIL
  section-anchor 1 FAIL · planning-path 1 FAIL · plan-number 1 FAIL · task-id 70→71 FAIL
```

Eight rows go red, including `task-id` moving 70 → 71. The instrument reads.

### 10.4 The contrast that makes the green evidence

`152-BASELINE.md` records the **unmodified inherited** gate reporting OK on its collapsed-reference
row while live violations stood; the **retargeted** gate reported those same rows as failures. This
plan adds the third measurement in that series: the retargeted gate, scoped to the surface this plan
owns, now reports **clean on every row it is possible to close**, and the one row it cannot close is
red for a reason recorded in three places rather than for a reason nobody wrote down.

### 10.5 The behaviour-neutrality prover

| Run | Result |
|---|---|
| `--range cc319db17~1..cc319db17` **with 24 `--allow` entries, one per rename-table file, and no others** | files changed 24 · compared 0 · **allowed by name 24** · **0 violations** · **exit 0** |
| **Flip test** — the identical range with **zero** allow entries | 24 compared · **24 violations** · exit 1. Every one of the 24 is a title line; the prover sees and names each. |
| `--range d312957b3~1..cc319db17` (plan start through the rename commit) | 25 changed · **1 violation** — `152-TITLE-RENAMES.md` itself, because the classifier maps `md` to an empty comment family. **A scoping artefact of the range, not a property of the diff** (memo item 16). |

**The range is bounded at the last refactor commit `cc319db17`, not at `HEAD`, and that is
deliberate**: once the SUMMARY/STATE/ROADMAP/WINDOWS docs commit lands, `..HEAD` sweeps
`.planning/**.md` into the compared set and reports one violation per file. **No allow entry was
added for any `.planning/` path** — that would convert a scoping artefact into a standing exception,
and the zero-allow-entry rule is what makes the proof mean anything.

**This is the one plan in Phase 152 that legitimately changes non-comment bytes in the swept trees.**
The 24 allow entries are the price of that, and each is named on the command line so the exclusion is
visible in the command a reviewer reads. An unlisted non-comment change would still be a violation —
and the flip test shows the prover would have caught one.

### 10.6 Gates

| Gate | Result |
|---|---|
| `yarn build` | **exit 0** — 14/14 tasks, FULL TURBO |
| `yarn test:unit` | **exit 0** — **1,835 passed / 0 failed / 0 skipped / 0 todo / 173 files**, identical to the pre-rename baseline per workspace and in total |
| `yarn lint:check` | **exit 0** — svelte-check 0 errors / 0 warnings; i18n, a11y-wiring and comment-hygiene guards all 0 violations |
| `node scripts/assert-comment-hygiene.mjs` | **exit 0** — 1,560 files, 0 violations |
| `bash …/hygiene-grep-report.sh --assert-clean` | **exit 1** — 5 rows, every occurrence attributed in § 10.2; the version row stayed report-only throughout |

**The full E2E suite was NOT run here, and that is the plan's own instruction, not an omission.**
The phase's single cardinal-gate run belongs to `152-15`, after the forced-line-break sweep lands.
`152-05` discharged the cardinal gate at **150 passed / 0 failed / 0 flaky / 0 did-not-run, exit 0**.
For this plan specifically the stronger evidence is structural: **no Playwright title changed at
all** (all 19 are fenced), so no spec, project or `--grep` selection can have moved; and the unit
suite — the only suite whose titles did change — returns the identical count.
