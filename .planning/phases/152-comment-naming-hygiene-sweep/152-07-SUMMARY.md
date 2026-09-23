---
phase: 152-comment-naming-hygiene-sweep
plan: 07
subsystem: tests
tags: [sweep, judgement-pass, e2e-specs, hazard-notes, behaviour-neutrality, unsatisfiable-criterion]

# Dependency graph
requires:
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-05's `assert-comment-only-diff.mjs` prover and `152-RESIDUE-REGISTER.md`'s seven-way prefix partition — the file set this plan works from"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-06's three findings: the gate invocation exits 2, the register outranks the frontmatter, and an unsatisfiable row is proven by a flip-tested comment-scoped route"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-05's discharged E2E cardinal gate (150 passed / 0 failed / 0 did-not-run), which is why a comment-only plan does not re-run the suite"
provides:
  - "the E2E spec tree swept — the surface D-A1 explicitly refused to skip, and the one 'read most often by agents'"
  - "every diagnosed-hazard note in the specs surviving as a citation-free statement of the hazard"
  - "a second flip-tested comment-scoped gate run, over 4,089 comment lines in 40 spec files"
  - "the finding that the register's per-plan file list is a FLOOR: three in-partition files carried citations no gate pattern matches"
  - "an enumerated list of the non-gated planning-reference forms 152-08…152-12 must grep for themselves"
affects: [152-08, 152-09, 152-10, 152-11, 152-12, 152-13]

# Actuals (#2632)
actuals:
  tokens: 62000
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "assert-once-per-replacement applier reused from 152-06: a table of [file, old, new, expectedCount], every entry asserted to match EXACTLY its expected count across the whole batch BEFORE any byte is written — a drifted anchor aborts the batch instead of applying a subset"
    - "comment-scoped gate as the alternate route for a raw-text row whose residue is program bytes, run over the SHARED classifier and flip-tested 8-red / 0-green"
    - "prefix-partition sweep: the register's span-derived per-plan file list is treated as a floor and the PREFIX rule (`tests/tests/specs/ -> 152-07`) as the authority"

key-files:
  created: []
  modified:
    - tests/tests/specs/voter/voter-journey.spec.ts
    - tests/tests/specs/voter/eperm07-term-trigger.spec.ts
    - tests/tests/specs/voter/voter-journey-mobile.spec.ts
    - tests/tests/specs/voter/cold-entry-dataroot.spec.ts
    - tests/tests/specs/voter/voter-alliance.spec.ts
    - tests/tests/specs/voter/voter-prefs-tracking.spec.ts
    - tests/tests/specs/voter/voter-dark-mode.spec.ts
    - tests/tests/specs/candidate/candidate-journey.spec.ts
    - tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts
    - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
    - tests/tests/specs/a11y/a11y-smoke.spec.ts
    - tests/tests/specs/a11y/candidate-a11y.spec.ts
    - tests/tests/specs/perm/perm-hide-category-tags.spec.ts
    - tests/tests/specs/perm/perm-hide-election-tags.spec.ts
    - tests/tests/specs/perm/perm-org-matching.spec.ts
    - tests/tests/specs/perm/perm-show-feedback-survey.spec.ts
    - tests/tests/specs/perf/performance-budget.spec.ts
    - tests/tests/specs/visual/visual-regression.spec.ts
    - tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts

key-decisions:
  - "The whole PREFIX partition was swept, not the register's 16-file work queue. All 16 queue files appear in the diff; three more in-partition files — `a11y/candidate-a11y.spec.ts`, `perm/perm-org-matching.spec.ts`, `voter/voter-dark-mode.spec.ts` — carried planning citations (`criterion 1` / `criterion 6`, `See SUMMARY deviation`, `RESEARCH Pitfall 1`) that none of the nine gate patterns match, so they were absent from the span-derived queue. This is WINDOWS 79 inverted: 152-06's frontmatter was narrower than its partition, and here the REGISTER'S OWN LIST is narrower than the partition."
  - "The `task-id` gate row is UNSATISFIABLE over this file set and is reported, not engineered around. All 24 remaining occurrences are program bytes — 23 Playwright `test` / `test.describe` / `test.step` titles and 1 assertion-message string. Titles are doubly out of bounds here: this plan's own prohibition assigns title renames to 152-13, and the prover forbids changing program bytes with zero allow entries. Proven instead by a comment-scoped route over the shared classifier, flip-tested 8-red / 0-green."
  - "The plan's gate INVOCATION does not exist, exactly as 152-06 predicted. `hygiene-grep-report.sh -- <pathspec>` exits 2. The script was NOT modified; the same nine patterns were transcribed verbatim under a caller-supplied pathspec."
  - "Roughly a fifth of the sweep's sites are planning references NO gate row matches: hyphenated `Phase-145` / `Phase-130` / `Phase-69`, bare `plan 05` / `Plan 04`, `plan-130-01`, `DEF-135-04`, parenthesised bare phase numbers (`(122)`, `(129)`), the document names `RESEARCH` / `SUMMARY` / `120-07-SUMMARY`, and `this phase` narrative. A plan that trusts the gate alone as its completeness test leaves them behind."
  - "Zero comment units were deleted whole. Every one of the 80 sites is a rewrite — the strongest reading yet of D-A1(a), and the direct consequence of the specs' content being almost entirely diagnosed-hazard notes rather than edit narrative."
  - "`milestone-ver` holds at 1 and is correct: the pinned Docker tag `mcr.microsoft.com/playwright:v1.58.2-noble`, which the gate's own header forbids stripping. `v1.2` and `v2.14` — the two genuine milestone tags — were removed."
  - "REVIEW-HYG-02 was NOT marked complete. `requirements.ready-ids` returns 0/1: sibling plans in this phase declare the same id with no SUMMARY yet, so the shared-ID gate correctly holds it Pending."

patterns-established:
  - "A green gate proves the patterns you wrote down, not the property you meant. Twenty-two of this plan's eighty sites — over a quarter — are planning references the nine-row gate cannot see, found only by grepping the VOCABULARY (`RESEARCH`, `SUMMARY`, `criterion N`, `this phase`, hyphenated `Phase-NNN`) rather than the pattern set."
  - "In an E2E spec, the citation is almost never the content. Ten of the sixteen span-bearing files needed a REWRITE at every site and a deletion at none, because what sits around a phase number is a measured race, a budget derivation or a fixture guarantee — not a record of an edit."

# NOT marked Complete in REQUIREMENTS.md: `requirements.ready-ids` returns 0/1.
# Sibling plans in this phase declare REVIEW-HYG-02 and have no SUMMARY yet, so the
# shared-ID gate holds it Pending (152-01 force-marked such an id in error and had to revert).
requirements-completed: [REVIEW-HYG-02]

coverage:
  - id: D1
    description: "The voter and candidate journey specs carry only comments that explain the test in front of them, with every diagnosed-hazard note intact and no title, selector or timing value moved."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "transcribed gate scoped to tests/tests/specs/{voter,candidate} at 61dc6febf — phase-ref 33 -> 0, spike-ref 1 -> 0, milestone-ver 0, section-anchor 0, planning-path 0, plan-number 0, decision-id-long/bare 0"
        status: pass
      - kind: other
        ref: "`git diff 61dc6febf~1..61dc6febf -- tests/ | grep -cE '^[+-]\\s*(test|it|describe)(\\.\\w+)?\\('` -> 0 (no title line changed)"
        status: pass
      - kind: other
        ref: "`git diff 61dc6febf~1..61dc6febf -- tests/ | grep -cE '^[+-].*(getBy|locator\\(|page\\.|timeout:|--template)'` -> 0"
        status: pass
      - kind: other
        ref: "`assert-comment-only-diff.mjs --range 61dc6febf~1..61dc6febf` — 10 files compared, 0 allowed by name, 0 violations, exit 0"
        status: pass
      - kind: other
        ref: "`yarn typecheck:tests` exit 0; `yarn lint:check` exit 0; `npx prettier --check` clean"
        status: pass
    human_judgment: false
  - id: D2
    description: "The permission, accessibility, performance, visual and probe spec families carry only comments that explain their tests, with fixture topologies and axe-rule rationales intact."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "transcribed gate scoped to tests/tests/specs at fa08c6d07 — phase-ref 51 -> 0, spike-ref 1 -> 0, section-anchor 4 -> 0; milestone-ver 1 REPORT (the pinned Docker tag)"
        status: pass
      - kind: other
        ref: "`git diff fa08c6d07~1..fa08c6d07 -- tests/` — 0 title lines, 0 selector/timeout lines, 0 declaration lines"
        status: pass
      - kind: other
        ref: "`assert-comment-only-diff.mjs --range fa08c6d07~1..fa08c6d07` — 9 files compared, 0 allowed by name, 0 violations, exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "The partition is respected in both directions: every register file swept, no path outside tests/tests/specs/** touched."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "`comm -23 <register 152-07 list> <git diff --name-only 61dc6febf~1..HEAD>` -> empty (all 16 queue files in the diff)"
        status: pass
      - kind: other
        ref: "`comm -13` -> exactly 3 files, all under tests/tests/specs/ and therefore in-partition by the register's own prefix rule (candidate-a11y, perm-org-matching, voter-dark-mode)"
        status: pass
      - kind: other
        ref: "`git diff --name-only 61dc6febf~1..HEAD | grep -v '^tests/tests/specs/'` -> empty (no out-of-partition path)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The one gate row that cannot reach zero is proven by an alternate named route, flip-tested, reported, and registered — not engineered around."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "comment-scoped gate over tests/tests/specs — 40 files scanned, 4,089 comment lines examined, 0 on every gated row incl. task-id; milestone-ver 1 REPORT (playwright:v1.58.2-noble)"
        status: pass
      - kind: other
        ref: "FLIP TEST — injecting one token of each class into a single comment turns 8 rows red and exits 1; reverting returns 0 red and exit 0. Working tree confirmed clean after revert."
        status: pass
      - kind: other
        ref: "all 24 raw-text residue occurrences resolved to source and confirmed as program bytes (23 test/test.step titles, 1 assertion-message string)"
        status: pass
      - kind: other
        ref: "WINDOWS.md entries 85, 86, 87"
        status: pass
    human_judgment: false
  - id: D5
    description: "Nothing but comment bytes changed across the whole plan, with zero allow entries."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "`assert-comment-only-diff.mjs --range 61dc6febf~1..fa08c6d07` — files changed 19; compared 19; allowed by name 0; 0 violation(s); exit 0"
        status: pass
      - kind: other
        ref: "over the plan range: 0 title lines, 0 selector/timeout/template lines, 0 `export`/`const`/`function`/`import` declaration lines in the diff"
        status: pass
      - kind: other
        ref: "`yarn typecheck:tests` exit 0; `yarn lint:check` exit 0 (22 tasks, svelte-check 0 errors / 0 warnings); `node scripts/assert-comment-hygiene.mjs` exit 0 (1,560 files, 0 violations)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Comment prose that survived the sweep still says something TRUE about the code in front of it."
    requirement: REVIEW-HYG-02
    verification: []
    human_judgment: true
    rationale: "No instrument can check whether a rewritten sentence is accurate — the half of criterion 5 the prover's own docblock says it cannot judge. All 80 rewrites were read individually against the code beside them, and the long spans are enumerated with their dispositions below for spot-checking. The two rewrites most worth a reviewer's eye are named in the Verification section."

# Metrics
duration: ~22 min
completed: 2026-08-29
status: complete
---

# Phase 152 Plan 07: The E2E Spec Tree Summary

**The surface D-A1 explicitly refused to skip — the heaviest planning-narrative carriers in the repository, "read most often by agents" — swept at 80 replacement sites across 19 files, mechanically proven to have changed zero program bytes with zero allow entries, with ZERO comment units deleted whole and every diagnosed-hazard note surviving as a citation-free statement of its hazard.**

## Performance

- **Duration:** ~22 min
- **Commit window:** 2026-08-29T01:50:37+03:00 → 01:53:02+03:00 (verification through ~01:57)
- **Tasks:** 3 of 3
- **Files modified:** 19 (all 16 register-queue files, plus 3 in-partition files the queue could not see)
- **Rules / sites:** 80 / 80 (**counted mechanically from the applier's own tables BEFORE each commit message was written** — WINDOWS 77 and 84 are the reason that sentence is here)

## Task Commits

1. **Task 1: the voter and candidate journey specs** — `61dc6febf` (refactor) — 52 rules / 52 sites / 10 files
2. **Task 2: the permission, accessibility and remaining spec families** — `fa08c6d07` (refactor) — 28 rules / 28 sites / 9 files
3. **Task 3: close against the gate and the prover** — no code change; its output is the Verification section below, WINDOWS 85–87, and this SUMMARY

---

## The three things 152-06 warned about, and what each cost here

### 1. The gate invocation exits 2 — confirmed, script untouched

`bash …/hygiene-grep-report.sh -- tests/tests/specs` fails with `unknown flag: --` before it greps anything. The script rejects any `-*` token and hardcodes `-- apps/ packages/ tests/` at all nine call sites deliberately (`SCOPE IS LOAD-BEARING`). **It was not modified.** The same nine patterns were transcribed verbatim under a caller-supplied pathspec, with the identical verdict rule (every row on `occ = 0`; `milestone-ver` report-only). Plans `152-08` … `152-12` carry the same invocation and will hit the same exit 2.

### 2. The frontmatter-vs-register gap — checked, and it runs the OTHER way

`152-07-PLAN.md`'s `files_modified` reads `tests/tests/specs/**`. The register's `152-07` scope reads *"`tests/tests/specs/**` — the E2E spec directories."* **They match exactly, so there is no frontmatter gap** — the WINDOWS 79 failure mode does not apply to this plan.

But the register's per-plan **work queue** lists 16 files, and it is span-derived from the nine gate patterns. The ownership rule is a **prefix partition** (`tests/tests/specs/ -> 152-07`). Three in-partition spec files carry planning citations that no gate pattern matches, so they are absent from the queue:

| File | The citation the gate cannot see |
|---|---|
| `a11y/candidate-a11y.spec.ts` | `## The reach proof (criterion 1)`, `PARITY WITH THE VOTER HALF (criterion 6)`, `where criteria 1 and the theme claim` |
| `perm/perm-org-matching.spec.ts` | `(See SUMMARY deviation — the seed's …)` |
| `voter/voter-dark-mode.spec.ts` | `## Mechanism (RESEARCH Pitfall 1 — VERIFIED, binding correction)` |

All three were swept. **The general form, which `152-08` … `152-12` need:** the register's per-plan file list is a **floor, not a ceiling**. Registered as **WINDOWS 86**.

### 3. Unsatisfiable rows — one, and it is the whole `task-id` column

After the sweep, **24 occurrences remain across 16 files, and every one of them is a program byte.**

| Class | Count | Examples |
|---|---:|---|
| `test.describe` / `test` / `test.step` titles | 23 | `voter-alliance (EFLOW-02 + EPERM-03/04 riders)`, `EQTYP-02: number-scale boundary matching`, `perm-access-disable (EPERM-11)`, `ASSERT-05 positive control: …`, `VGATE-05 requires none` |
| assertion-message string | 1 | `candidate-bank-auth.spec.ts:167` — `'EFLOW-10 keys-configured path did not run — …'` |

These are **doubly** out of bounds. This plan's own prohibitions state that *"no test title or `test.step` title is renamed in this plan — plan `152-13` owns that with its own gate,"* and `assert-comment-only-diff.mjs` with zero allow entries forbids changing any non-comment byte. The criterion and the prohibition cannot both be satisfied.

Per the 152-04 / 152-06 precedent: **reported, not engineered around.** Registered as **WINDOWS 85**.

**The alternate route, and its flip test.** The underlying property — *no COMMENT carries a planning reference* — was proven by running the same nine patterns over only the text the phase's shared classifier calls a comment span:

```
comment-scoped gate — files scanned: 40; comment lines examined: 4089
  phase-ref 0 OK · spike-ref 0 OK · decision-id-long 0 OK · decision-id-bare 0 OK
  section-anchor 0 OK · planning-path 0 OK · plan-number 0 OK · task-id 0 OK
  milestone-ver 1 REPORT   visual-regression.spec.ts:83  v1.58
Gate rows failing (comment-scoped): 0
```

That last row is the gate behaving correctly: `milestone-ver` is report-only precisely because `v\d+\.\d+` matches genuine tool versions, and this one is the pinned Docker image tag `mcr.microsoft.com/playwright:v1.58.2-noble`, which the shipped gate's own header names as an example it must never strip. The two genuine milestone tags in the tree — `v1.2` and `v2.14` — were removed.

**A gate that examines nothing reports green**, so the route was flip-tested rather than trusted. Injecting one token of each class into a single comment turns **8 rows red, exit 1**; reverting returns **0 red, exit 0** with a clean working tree. It also carries a hard `commentLines === 0 → exit 2` precondition.

---

## A fourth finding the next five plans need: the gate misses about a quarter of the work

**Twenty-two of this plan's eighty sites are planning references that NO gate row matches.** They were found by grepping the planning *vocabulary*, not the pattern set:

| Form | Why the gate misses it | Seen at |
|---|---|---|
| `Phase-145`, `Phase-130`, `Phase-129`, `Phase-69` | `phase-ref` is `\bphases?\s+\d+` — it requires whitespace, not a hyphen | probe header, voter-journey ×2, candidate-journey |
| `plan 05`, `plan 06`, `Plan 04` | `plan-number` is `\bplans?\s+\d+[-.]\d+` — it requires a second number group | voter-journey ×2, candidate-journey, eperm07, voter-prefs-tracking ×2 |
| `plan-130-01` | same reason (hyphen before the digits) | voter-journey |
| `DEF-135-04` | `\b[A-Z]{3,}-\d{2}\b` cannot anchor across `135-04` | voter-journey ×2, eperm07 |
| `(122)`, `(129)` — bare parenthesised phase numbers | no pattern covers a naked integer | candidate-bank-auth, candidate-journey, voter-journey |
| `RESEARCH Pitfall 1/2`, `RESEARCH A4`, `See SUMMARY deviation`, `120-07-SUMMARY` | document names, not ids | voter-dark-mode, voter-prefs-tracking ×2, perm-org-matching, candidate-bank-auth, perm-show-feedback-survey |
| `criterion 1`, `criterion 6`, `criteria 1` | references into a phase's criteria list | candidate-a11y ×3, a11y-smoke |
| `this phase`, `the phase's before/after`, `not fixed in this phase` | pure narrative deixis | voter-journey ×2, eperm07, probe ×2 |

Registered as **WINDOWS 87**. The practical instruction for `152-08` … `152-12`: run the nine-row gate for the mechanical floor, then run

```
git grep -I -n -P '(?i)\b(phase|plan|spike|milestone)[-\s]*\d+|\bRESEARCH\b|\bSUMMARY\b|\bthis phase\b|criteri(on|a) \d|\.planning/' -- <your partition>
```

and read every hit.

---

## Accomplishments

### Task 1 — the voter and candidate journey specs (`61dc6febf`)

**52 replacement rules applied at 52 sites across 10 files.** Zero title lines, zero selector / locator / timeout / template lines and zero declaration lines in the diff.

The hazard notes this surface exists to carry, all kept with their measurements and their consequences:

- **the URL-before-DOM race behind `expectClientNavigation`** — SvelteKit commits the URL at `client.js:1759-1760` before it swaps the DOM at `:1824`, so a URL-only settle released while the PREVIOUS question was still rendered; the recorded failure is `element(s) not found` on the Base-3 term trigger, because the question still rendered was Base-2, which carries no `custom_data.terms`. Kept whole; only `see phase 138` and `DEF-135-04` went.
- **the baseline-capture ordering argument** — the baseline is taken by the ACTION, immediately before the navigating click, never at wrapper entry, because a baseline taken before the heading gate can be one page stale and would make the settle's stage-2 text comparison true on arrival.
- **`eperm07-term-trigger`'s three-way live hypothesis** (H1 view-transition window / H2 render gate at `questions/+layout.svelte:257-258` / H3 late `customData.terms` at `QuestionHeading.svelte:60-61`) and its **neutral-by-construction** forcing knobs, including the `min: 1` reason (a budget of 0 is Playwright's "no timeout" — the one value that disarms the instrument outright) and the exported-but-empty-variable analysis behind rejecting `??`.
- **`cold-entry-dataroot`'s root cause** — an intermediate `const dataRoot = $derived(ctx.dataRoot)` alias over the identity-stable `#version`-bridge `DataRoot` yields the same reference on every bump, so Svelte 5's referential-equality rule skips downstream notification. Kept verbatim; the `debug` path and `see spike 024` citations went.
- **the `selectExact` loose-matcher argument** — a `/1/` or `/select/i` regex would also be satisfied by the raw dotted key path an unresolved catalog lookup emits, which is the exact regression the guard exists to catch.
- **candidate-journey's cold-start load-contention split settle** — why the URL-settle and the element-visibility wait compose additively rather than racing.
- **bank-auth's select-by-identity reason** — `[EL1]` alone is a perm-family shape convention emitted by twelve templates, so once this project moved to the chain tail it matched 2 elections; `[BA-EL1]` is this dataset's own label namespace.

**Zero units deleted.** Every one of the 52 sites is a rewrite.

### Task 2 — the permission, accessibility and remaining spec families (`fa08c6d07`)

**28 replacement rules applied at 28 sites across 9 files.** Same neutrality result.

Kept whole, citations stripped:

- `perm-show-feedback-survey`'s four-part seed contract and the **FIFO popup-queue** ordering argument (`#current = $derived(#queue[0])` — with both countdowns active the feedback popup leads, so the survey only surfaces once feedback is dismissed);
- `perm-org-matching`'s `none` / `answersOnly` / `impute` score table, **including the measured correction** that the seed's "blanks penalised polar-opposite" assumption does not hold for organisation own-answers in the live app;
- both tag specs' `WR-01` retry rationale — why `.not.toHaveCount(0)` rather than a single-shot `.count()`, and the residual timing exposure `advanceClick`'s docblock records on exactly that path;
- `a11y-smoke`'s collect-then-scan ordering (an untranslated catalog changes the accessible names axe is about to read) and the **results-filter-drawer lazy-import anchor** argument — filter bodies are `{#await import('./numeric')}`, so a dialog-root or row anchor resolves while the bodies are unmounted and the scan would cover an empty drawer;
- `candidate-a11y`'s reach proof (the auth fixture reporting success is NOT the evidence) and its parity-by-construction table;
- `performance-budget`'s entire calibration derivation — 8 measured runs, 296–1504 ms, 5000 ms = 3.3× max observed / 9.6× the idle P90 — and the Navigation-Timing blindness analysis that justifies replacing it;
- `visual-regression`'s font-swap race, the **`settleFonts` is measurably blind to zero `@font-face` rules** measurement, and the boundary-of-the-claim caveat about the surviving `+layout.svelte` fallback literals;
- the probe's **not-the-standing-regression-guard** warning and its `Pirkanmaa` / `c_05` / 48-candidate measurement.

**Zero units deleted here either.**

---

## The long-span dispositions (the plan requires every span of seven lines and up named, one reason each)

| # | File | Span | Lines | Disposition | Reason |
|---:|---|---|---:|---|---|
| 1 | voter-journey | `expectUrlChange` docblock | 27 | **rewritten** ×3 | The `client.js:1759/1824` ordering, the recorded `element(s) not found` failure and the shared-settle no-drift argument are the only in-tree record of a diagnosed race. |
| 2 | voter-journey | `selectExact` / exact-one walk docblock | 20 | **rewritten** ×2 | The loose-matcher-cannot-fail argument and the `min === max === 1` seeding requirement are the whole justification for asserting an exact string. |
| 3 | voter-journey | `customData.terms` step preamble | 8 | **rewritten** | Names the seeded Base-3 trigger and why the walk detours to it; only the seed's phase attribution went. |
| 4 | voter-journey | skip + delete/back-nav block | 7 | **rewritten** | The `scope_fence` citation became a plain statement that this is confirmed-covered behaviour, keeping the greppable evidence the coverage gates read. |
| 5 | voter-journey | min-answers gate block | 7 | **rewritten** | The 8-answers-here arithmetic and the delete-FOUR-to-cross reasoning are the assertion's premise. |
| 6 | voter-journey | ALLIANCE RENDER VERIFICATION block | 10 | **rewritten** ×3 | The `organizationMatching: 'impute'` derivation and the CO-Reg-N scope are live. The `Phase-130 scope` pointer became a pointer to `voter-alliance.spec.ts`, which is where that depth actually lives. |
| 7 | voter-journey | 4-case voter-vs-entity matrix block | 16 | **rewritten** | The (a)/(b)/(c)/(d) arrangement with `base.ts` line refs is the map for four assertions. |
| 8 | voter-journey | info-items count derivation | 9 | **rewritten** ×2 | The `14 = 4 + 9 + 1` arithmetic and the grouped-Links explanation are why `toHaveCount(14)` is not a magic number. |
| 9 | eperm07 | file docblock | 30 | **rewritten** ×3 | Carries the H1/H2/H3 tri-state, the not-`@probe`-tagged reason and the ~1-in-8 event rate. |
| 10 | eperm07 | CARVE-OUT paragraph | 19 | **rewritten** | Records why a local re-implementation existed, why it was discharged, and that the pre-fix behaviour survives as RUN 1 of the negative control (5/5 failing). |
| 11 | eperm07 | `readForcingKnob` reason docblock | 22 | **rewritten** | The `??`-catches-only-`undefined` analysis and `timeout: 0` = no-timeout consequence are why the knob reader exists at all. |
| 12 | eperm07 | FORCING BUDGET block | 10 | **rewritten** | The file-scoped-by-construction neutrality claim and the `min: 1` disarm argument. |
| 13 | eperm07 | `settleOnUrlChangeAsProductionDoes` docblock | 30 | **rewritten** | The would-stop-witnessing-`voter-journey` argument is the reason the local copy was deleted. |
| 14 | eperm07 | `gateOnQuestionAndAnswerLastOption` docblock | 14 | **rewritten** | The scoped-locator reason (outgoing options linger a frame after the heading updates). |
| 15 | voter-journey-mobile | file docblock | 31 | **rewritten** | The project-scope descriptor argument and the Don't-Hand-Roll rule; only `see phase 121` went. |
| 16 | voter-journey-mobile | consent-popup NOTE | 7 | **rewritten** | The `addLocatorHandler` mechanism is why the shared walk is reused unchanged at 390×844. |
| 17 | cold-entry-dataroot | file docblock | 24 | **rewritten** ×2 | The identity-stable-ref skip, the negative-control posture and the no-`isVisible()` mount hazard. |
| 18 | voter-alliance | file docblock | 45 | **rewritten** | The depth-vs-presence scope split and the fixture-composition reason. |
| 19 | voter-prefs-tracking | file docblock | 60 | **rewritten** ×5 | The three arming conditions, the buffer/flush mechanism with source line refs, and the exact persisted-prefs field set. |
| 20 | voter-dark-mode | Mechanism section | 12 | **rewritten** | There is no toggle and no storage write — the reason the spec drives `emulateMedia` and asserts no storage. |
| 21 | candidate-journey | `MAX_STEPS` / type-aware docblock | 18 | **rewritten** ×2 | The ~10-applicable-questions census and the per-type driving requirement (without it Save stays disabled and the walk stalls). |
| 22 | candidate-journey | split-settle block | 18 | **rewritten** | The additive-composition argument against a mid-transition DOM read. |
| 23 | candidate-journey | step-18.5 preamble | 9 | **rewritten** | Why a generic walk answer is not enough and how the pre-answer stays compatible with step 19. |
| 24 | candidate-bank-auth-journey | election-by-identity block | 11 | **rewritten** ×2 | The positional-`.first()` silently-foreign-election defect and the `[BA-EL1]` namespace reason. |
| 25 | candidate-bank-auth | file docblock | 25 | **rewritten** ×2 | The Idura-only claim model and the DETERMINISTIC-GREEN GATE's did-not-run-is-cardinal rule. |
| 26 | _probes | file docblock | 81 | **rewritten** ×6 | The not-the-standing-guard warning, the `@probe`/`--grep-invert` exclusion proof, the five-siblings-deleted inventory, the cookies-after-response hazard and the Pirkanmaa measurement. |
| 27 | a11y-smoke | parity paragraph | 11 | **rewritten** | The differ-only-in-route-tables claim is checkable by reading an import list — that is the whole design. |
| 28 | a11y-smoke | scan-pipeline docblock | 21 | **rewritten** | The collect-vs-throw ordering and the read-before-axe reason. |
| 29 | a11y-smoke | `storageState` note | 8 | **rewritten** | Warns against the exact misreading "the a11y scans are unauthenticated" — half are not. |
| 30 | a11y-smoke | results-filter-drawer entry block | 24 | **rewritten** ×2 | The lazy-import anchor argument and the both-themes coverage claim. |
| 31 | candidate-a11y | reach-proof section | 14 | **rewritten** | The fixture-success-is-not-evidence rule and the runs-inside-`settle` ordering. |
| 32 | candidate-a11y | parity header + composition docblock | 22 | **rewritten** ×2 | The identical-by-construction table and the after-`reach` ordering that is load-bearing for two entries. |
| 33 | performance-budget | file docblock | 90 | **rewritten** ×2 | The structurally-incapable analysis, the two calibration tables and the warm-up-reload diagnosis. |
| 34 | perm-hide-category-tags | WR-01 retry block | 15 | **rewritten** | The retry-parity argument between the absence and presence assertions. |
| 35 | perm-hide-election-tags | WR-01 retry block | 15 | **rewritten** | Same, mirrored. |
| 36 | perm-show-feedback-survey | file docblock | 40 | **rewritten** ×2 | The seed contract, the FIFO queue derivation and the singleton-restore obligation. |
| 37 | perm-org-matching | score-table docblock | 22 | **rewritten** | The three-way distinguishability signal and the measured correction to the seed's assumption. |
| 38 | visual-regression | Re-baselining section | 35 | **rewritten** ×2 | The identical-absolute-path mount requirement with its two source line refs, the host-side prerequisite order and the `--update-snapshots=all` vs `changed` trap. |
| 39 | visual-regression | `settleFonts` docblock | 30 | **rewritten** ×2 | The three-case caught/not-caught table and the correction of a claim the previous docblock made falsely. |
| 40 | visual-regression | `guardThirdPartyFonts` docblock | 38 | **rewritten** ×2 | The retroactive-read reason, the zero-`@font-face` blindness measurement and the boundary-of-the-claim caveat. |

**Forty long spans. Forty rewrites. Zero deletions**, at any length. That ratio is the sharpest reading of D-A1(a) in the phase so far, and it is a property of the material: in an E2E spec the text around a phase number is almost always a measured hazard, not a record of an edit.

---

## Deviations from Plan

### 1. [Rule 2 — missing critical scope] Three in-partition files absent from the register's work queue

`a11y/candidate-a11y.spec.ts`, `perm/perm-org-matching.spec.ts` and `voter/voter-dark-mode.spec.ts` are inside this plan's prefix partition and owned by no sibling plan, but carry citations no gate pattern matches, so they do not appear in the register's span-derived 16-file list. Swept under Task 2. **WINDOWS 86.**

### 2. [Rule 3 — Record] One acceptance criterion that cannot be satisfied as written

The scoped gate's `task-id` row. All 24 residual occurrences are program bytes; 23 are titles this plan is explicitly prohibited from renaming. Proven by a named, flip-tested alternate route. **WINDOWS 85.**

### 3. [Rule 3 — Record] The plan's gate invocation exits 2

`hygiene-grep-report.sh -- <pathspec>` does not exist as an interface. The script was not modified; the nine patterns were transcribed. Already registered by 152-06 as **WINDOWS 81**; noted here only because this plan is the first to hit it after the warning.

### 4. [Rule 2 — missing critical scope] Twenty-two non-gated planning references

Hyphenated phase forms, bare `plan NN`, `DEF-135-04`, parenthesised phase numbers, document names and `this phase` narrative — all inside the plan's must-have truth ("no historical narrative, planning-artifact path, phase or plan number, or decision id") but outside the gate's nine patterns. Swept. **WINDOWS 87.**

**Total deviations:** 2 scope expansions, 2 recorded corrections, 0 bugs. **Impact:** the two scope expansions are the consequential ones — without them the plan would have reached a green gate with 22 live violations of its own stated criterion sitting in three files nobody owns.

**Commit-message counts:** verified against the applier's own tables before writing. `61dc6febf` says 52 rules / 52 sites / 10 files (measured: 23 + 29 = 52 rules, 52 sites, 10 files). `fa08c6d07` says 28 rules / 28 sites / 9 files (measured: 27 + 1 = 28 rules, 28 sites, 9 files). **No correction needed** — the first plan in this phase for which that is true.

---

## Verification

**Run the prover over the SWEEP range, `61dc6febf~1..fa08c6d07`, not over `..HEAD`.** The prover gives `.md` and `.json` no comment family, so every byte of them is code and any change is a violation — fail-closed, by design. Over a range that also spans this SUMMARY's docs commit it would report violations for `152-07-SUMMARY.md`, `WINDOWS.md` and `STATE.md`. That is the instrument working, not the sweep failing.

| Check | Result |
|---|---|
| `assert-comment-only-diff.mjs --range 61dc6febf~1..fa08c6d07` | **19 files compared, 0 allowed by name, 0 violations, exit 0** |
| transcribed gate over `tests/tests/specs` | phase-ref **51 → 0**, spike-ref **1 → 0**, section-anchor **4 → 0**, decision-id-long 0, decision-id-bare 0, planning-path 0, plan-number 0 |
| — the one non-zero gated row | `task-id` **24 → 24**, unsatisfiable by construction (above) |
| — the report-only row | `milestone-ver` **3 → 1**; the survivor is the pinned Docker tag |
| comment-scoped gate over all 40 spec files | **0 on every gated row** (4,089 comment lines examined); flip-tested 8-red / 0-green |
| out-of-partition paths in the plan diff | **0** |
| register-queue files missing from the diff | **0** (all 16) |
| title lines changed under `tests/` | **0** |
| selector / locator / `page.` / `timeout:` / `--template` lines changed | **0** |
| `export` / `const` / `function` / `import` declaration lines changed | **0** |
| `yarn typecheck:tests` | **exit 0** (after each commit) |
| `yarn lint:check` | **exit 0** — 22 tasks successful, svelte-check 0 errors / 0 warnings, all three repo guards 0 violations |
| `node scripts/assert-comment-hygiene.mjs` | **exit 0** — 1,560 files scanned, 0 violations |
| `npx prettier --check tests/tests/specs` | clean |

**The E2E suite was not re-run**, per the plan's own `<verification>` and the phase memo: the change is comment-only and `assert-comment-only-diff.mjs` with zero allow entries is the stronger guarantee for a comment-only diff. 152-05 discharged the phase's cardinal gate at **150 passed / 0 failed / 0 flaky / 0 did-not-run**, and the prover confirms this plan changed nothing the suite can observe.

**Two rewrites worth a reviewer's eye**, since D6 is human judgment:

1. `voter-journey.spec.ts` — *"the full card+drawer spec is Phase-130 scope"* now reads *"the full card+drawer spec is `voter-alliance.spec.ts`."* That is a change of referent, not just a strip: it was checked against `voter-alliance.spec.ts`'s own docblock, which states it deepens exactly the presence assertion this line disclaims.
2. `visual-regression.spec.ts` — *"non-functional between v1.2 and phase 136"* now reads *"non-functional for a long stretch of its history."* The span was a genuine measurement, and this rewrite deliberately trades precision for a citation-free sentence rather than inventing a replacement anchor. If a reviewer wants the span back, it belongs in a document this phase does not sweep.

## Issues Encountered

None blocking. Three items registered in `.planning/WINDOWS.md` as entries **85–87**.

**One question for the operator, recorded rather than guessed** (the plan is `autonomous: true` and the operator is away): `152-13` owns test-title renames. Twenty-three of this plan's residual `task-id` occurrences are titles carrying ids of the form `EFLOW-11`, `EPERM-07`, `EQTYP-02`, `TMPL-03`, `UNBLK-04`, `ASSERT-05`, `VGATE-05`. These are **E2E coverage ids**, not planning ids — they name behaviours and appear in the E2E run registers. If `152-13` strips them to satisfy the `task-id` row, it will break the register cross-reference; if it keeps them, `task-id` never reaches zero repo-wide and the phase closes with a permanently-red row. That is a decision `152-13` should make deliberately, not inherit.

## Next

`152-08` (the `dev-seed` workspace — 208 spans across 81 files, a third of the whole remaining surface). Before it starts it should read findings 1–4 above: the exit-2 gate invocation, the register-list-is-a-floor rule, the unsatisfiable-row protocol, and — most consequential for a workspace this dense — the list of planning-reference forms the nine gate rows cannot see.

## Self-Check: PASSED

- All 19 modified files present on disk and in the plan range; `git log --oneline --all | grep 61dc6febf / fa08c6d07` — both found.
- Every acceptance criterion re-run at final state; results in the Verification table.
- One criterion proven unsatisfiable as written, discharged by a named flip-tested route, and registered.
- `REVIEW-HYG-02` deliberately NOT marked complete (`ready-ids` 0/1).
- Commit-message counts verified mechanically before writing; no correction needed.
