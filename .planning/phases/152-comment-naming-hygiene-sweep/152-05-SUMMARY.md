---
phase: 152-comment-naming-hygiene-sweep
plan: 05
subsystem: tooling
tags: [codemod, sweep, residue, criterion-5, behaviour-neutrality, partition, e2e-cardinal-gate]

# Dependency graph
requires:
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-02's five instruments — the retargeted codemod (rule 6 inverted, importable), the `occ`-reading gate, `assert-comment-only-diff.mjs`, and `152-BASELINE.md`'s fixed pre-sweep state"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-01's `scripts/assert-comment-hygiene.mjs`, which must still exit 0 after this wave"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-04's precedent: an unsatisfiable criterion is reported and registered, never engineered around"
provides:
  - "`152-RESIDUE-REGISTER.md` — criterion 5's proof: all 98 declined matches hand-reviewed and classified, plus the post-mechanical measurement and the seven-way work queue"
  - "the mechanical strip itself, as ONE commit over `apps/**`, `packages/**` and `tests/**`, proven to have changed only comment bytes with zero allow entries"
  - "a REPAIRED codemod: three global repair rules that reached text no deletion had touched are now mark-anchored, with regression fixtures"
  - "a total, disjoint, arithmetically-checked partition of the 641 remaining judgement spans across plans 152-06 … 152-12"
  - "the E2E cardinal gate, discharged: 150 passed / 0 failed / 0 did-not-run"
affects: [152-06, 152-07, 152-08, 152-09, 152-10, 152-11, 152-12, 152-13, 152-14, 152-15]

# Actuals (#2632)
actuals:
  tokens: 58000
  tasks: 3
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "repair-local sentinel: a SECOND sentinel (`MARK`) live only inside the repair function, so every punctuation and enclosure rule must name it as an anchor and structurally cannot reach text the deletion never touched"
    - "exact delta over a changed-file set: when a pass touches 41 of 1,560 files, measure the other 1,519 once and compute the delta over the 41 — the result is exact rather than a second whole-tree estimate that can disagree with the first"
    - "ordered path-prefix partition: expressing a work split as a first-match prefix rule makes totality and disjointness structural properties rather than after-the-fact checks"

key-files:
  created:
    - .planning/phases/152-comment-naming-hygiene-sweep/152-RESIDUE-REGISTER.md
    - .planning/phases/152-comment-naming-hygiene-sweep/152-residue.tsv
    - .planning/phases/152-comment-naming-hygiene-sweep/152-residue.prose.tsv
    - .planning/phases/152-comment-naming-hygiene-sweep/152-hygiene.json
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/hygiene-codemod.input.ts
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/hygiene-codemod.expected.ts
  modified:
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-codemod.mjs
    - tests/playwright.config.ts
    - packages/dev-seed/src/template/permittedKeys.ts
    - packages/dev-seed/tests/assertKnownRowProps.test.ts
    - apps/frontend/src/lib/_guards/eslint-store-guard.test.ts
    - "(41 files in total across apps/**, packages/** and tests/** — full list in the apply commit `bfcf2dae5`)"

key-decisions:
  - "The codemod was FIXED before the apply was kept, not patched around. Reading the first apply diff found three repair rules that were GLOBAL over the line and reached text no deletion had touched — including one that turned `z.record(z.string(), z.unknown())` into `z.record(z.string, z.unknown)`, a falsified code sample in a shipped docblock. The first apply was reverted, `repair()` was made mark-anchored, three regression fixtures were hand-written, and only then was the apply re-run and kept."
  - "62 hand-fixes were made INSIDE the apply commit rather than deferred. The mechanical strip removes the citation and leaves the sentence; the plan's Task 2 names that as the correctness step and it is the whole reason the diff must be read. Two of the 62 were worse than ungrammatical: a QUOTED GIT COMMIT SUBJECT was truncated (falsifying a record), and three multi-line wrapped `.planning/` paths were half-deleted by a line-scoped pattern."
  - "The judgement surface is reported in SPANS, not occurrences, and the two numbers are kept visibly apart. Occurrences fell 8.6% (948 → 866); spans fell 4.5% (671 → 641). Quoting the first as though it sized the second would hand the next seven plans an estimate roughly twice as optimistic as the truth."
  - "The partition is an ORDERED PATH-PREFIX RULE, not a hand-assigned file list, so `UNASSIGNED = 0` and `in-two-lists = 0` are structural. A partition that silently drops a file is how a phase reaches a green gate with untouched violations."
  - "REVIEW-HYG-02 was NOT marked complete. `requirements.ready-ids` returns 0/1: sibling plans in this phase declare the same id and have no SUMMARY yet, so the shared-ID gate (#2388) correctly holds it Pending."
  - "Two of criterion 5's three example classes are historical, not one. The plan's objective records `console.warn` = 0; measured here, ESLint `message:` = 0 as well. Only the test-title member survives, at 81 of 98."

patterns-established:
  - "A codemod's arithmetic balance and its fixture suite can both be green while it is corrupting text. The only thing that found the three repair defects was reading the real apply diff — which is exactly what `SKILL.md:265` and `:314` predict, and the reason the plan makes the diff read the correctness step."
  - "When a mechanical pass and a judgement pass share a surface, report the delta in the JUDGEMENT unit. The occurrence delta flatters the mechanical pass; the span delta is what the next agent is actually sized against."

# Copied verbatim from 152-05-PLAN.md. NOT marked Complete in REQUIREMENTS.md:
# `requirements.ready-ids` returns 0/1 — REVIEW-HYG-02 is also declared by sibling
# plans in this phase that have no SUMMARY yet, so the shared-ID gate (#2388) holds it
# Pending. 152-01 force-marked one such id in error and had to revert; this plan did not.
requirements-completed: [REVIEW-HYG-02]

coverage:
  - id: D1
    description: "Criterion 5's proof: the codemod runs dry-run first, and every match it declined for not being comment-shaped is hand-reviewed, resolved to its source line and classified."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "dry run with --residue-out/--json-out — MODE: DRY-RUN, arithmetic OK, `git status --porcelain -- apps packages tests` empty afterwards"
        status: pass
      - kind: other
        ref: "`awk -F'\\t' '$3==\"not-a-comment-span\"' 152-residue.tsv | wc -l` → 98 (apps 8 · packages 58 · tests 32), inside the plan's 80-130 band and matching RESEARCH § 6 exactly"
        status: pass
      - kind: other
        ref: "152-RESIDUE-REGISTER.md § 4.4 — 98 rows, one per declined match, each with file:line, resolved source text and a class from an 8-class scheme whose counts sum to 98"
        status: pass
      - kind: other
        ref: "console.warn = 0 and ESLint `message:` = 0 measured by git grep over apps/packages/tests, both exit 1 with no output; zero of the 98 resolved lines contain either"
        status: pass
    human_judgment: false
  - id: D2
    description: "The mechanical strip landed as ONE commit over the three trees and is mechanically proven to have changed no program bytes."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "`assert-comment-only-diff.mjs --range bfcf2dae5~1..bfcf2dae5` — files changed 41; compared 41; allowed by name 0; 0 violation(s); exit 0"
        status: pass
      - kind: other
        ref: "`git rev-list --count 01d1568e6..HEAD -- apps packages tests` → 1"
        status: pass
      - kind: other
        ref: "`git show --stat bfcf2dae5 -- '*.md'` and `-- .planning .claude .agents CLAUDE.md` both empty (0 lines)"
        status: pass
      - kind: other
        ref: "second dry run after the apply — 0 hits for all eight rules (structural idempotency)"
        status: pass
      - kind: other
        ref: "`packages/core/src/controller/abortError.ts` (a scanned, zero-reference file) byte-identical across the apply commit"
        status: pass
    human_judgment: false
  - id: D3
    description: "Three global repair rules that reached text no deletion had touched are fixed and cannot regress."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "`node …/hygiene-codemod.mjs --self-test` — 5 fixtures / 0 failures, including three NEW regression cases covering the pre-existing empty enclosure, the sentence-leading dot and the hollow code span"
        status: pass
      - kind: other
        ref: "post-fix apply diff: `.strict()`, `import()` and `z.record(z.string(), z.unknown())` survive byte-identical; `covered only .ts and .svelte` keeps its space; no hollow backtick pair remains"
        status: pass
    human_judgment: false
  - id: D4
    description: "The tree is green on every gate the plan names, and the E2E cardinal rule is discharged because this plan edited files under tests/."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "`yarn build` — 14 tasks successful"
        status: pass
      - kind: other
        ref: "`yarn lint:check` — 22 tasks successful; svelte-check 0 errors / 0 warnings on both frontend and docs"
        status: pass
      - kind: other
        ref: "`yarn test:unit` — 25 tasks successful; frontend 816 tests, dev-seed 570 tests, all passed"
        status: pass
      - kind: other
        ref: "`node scripts/assert-comment-hygiene.mjs` — 1560 files scanned, 0 violations, exit 0"
        status: pass
      - kind: other
        ref: "`yarn test:e2e` after `yarn db:reset` on ONE fresh dev server — 150 passed (10.3m), exit 0. Zero failed, zero flaky, zero did-not-run."
        status: pass
    human_judgment: false
  - id: D5
    description: "The judgement waves receive a total, disjoint, arithmetically-checked work queue sized in the unit the work is done in."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "post-apply gate row table with a per-row delta against 152-BASELINE.md; 8-row total 948 → 866; `--assert-clean` still exit 1 with 6 failing rows"
        status: pass
      - kind: other
        ref: "span measurement with the shared classifier — 641 spans / 282 files; delta computed exactly over the 41 touched files (180 → 150)"
        status: pass
      - kind: other
        ref: "partition arithmetic — 130+44+208+13+132+105+9 = 641 spans; 36+16+81+6+71+66+6 = 282 files; 0 files in two lists; 0 unassigned"
        status: pass
    human_judgment: false

# Metrics
duration: 34 min
completed: 2026-08-28
status: complete
---

# Phase 152 Plan 05: The Mechanical Strip, and Criterion 5 Discharged as a Proof Summary

**82 planning-reference occurrences stripped from comments across 41 files in one commit that is mechanically proven to have changed zero program bytes; all 98 declined matches hand-reviewed and classified; three global repair-pass defects found by reading the diff and fixed at the instrument; and the 641 remaining judgement spans partitioned into seven checked, non-overlapping queues.**

## Performance

- **Duration:** ~34 min
- **Started:** 2026-08-28T21:38:37Z
- **Completed:** 2026-08-28T22:12:35Z
- **Tasks:** 3 of 3
- **Files modified:** 41 source files + 1 instrument + 2 fixtures; 4 artifacts created

## Task Commits

1. **Task 1: the residue hand review** — `01d1568e6` (docs)
2. *(deviation, Rule 1)* **the repair pass reached text no deletion had touched** — `f2f0108a1` (fix)
3. **Task 2: the mechanical strip, one commit** — `bfcf2dae5` (refactor)
4. **Task 3: the post-mechanical measurement and the seven-way queue** — `5e8a8db19` (docs)

---

## ⚠ THE FINDING THIS PLAN EXISTS TO HAVE MADE

The plan says, in terms, that the `hits + residue == total` balance is a completeness check and never a correctness one, and that the correctness step is reading the diff. **It was right, and the diff read paid for itself on the first pass.**

The codemod's balance line read `OK`. Its five fixtures were green. Its residue table matched `152-BASELINE.md` byte for byte. And the apply it produced contained, among other things:

```diff
- * `z.record(z.string(), z.unknown())` on purpose — D-04 keeps exactly ONE
+ * `z.record(z.string, z.unknown)` on purpose — keeps exactly ONE
```

That is a **falsified code sample in a shipped docblock**, on a line whose actual deletion (`D-04`) was somewhere else entirely. Nothing in the instrument's own reporting could have found it. `SKILL.md:265` records six Phase-151 artifacts that were self-consistent and wrong; `SKILL.md:314` records what that produced — 38 broken comments in the test tree, 28 in the routing surface, 6 in the components. This is the same failure, caught one step earlier because the plan mandated the read.

**The first apply was reverted.** The instrument was fixed. Then the apply was re-run and kept.

---

## Accomplishments

### Task 1 — criterion 5's proof, discharged as an obligation

`152-RESIDUE-REGISTER.md` (995 lines) records the dry run verbatim, confirms the tree was unchanged afterwards, and hand-reviews **all 98** `not-a-comment-span` rows — every one resolved back to its source line and classified.

**The count is 98, not criterion 5's 126.** The correction from Phase 151's stale figure is recorded rather than silently applied, and it is confirmed at **two independent measurement points four commits apart** (RESEARCH § 6 at HEAD `22c2542e3`, and this session), with an identical per-tree split of apps 8 · packages 58 · tests 32.

The eight classes, summing to 98:

| Class | Count | What it is | Owner |
|---|---:|---|---|
| A1 | 73 | `describe` / `it` / `test` / `test.describe` title | `152-13` |
| A2 | 8 | Playwright `test.step()` title | `152-13` |
| B1 | 2 | a shell script's own `PHASE n` stage marker in an `echo` | nobody — correct as written |
| B2 | 4 | a shell `echo` writing operator-facing or generated-report content | nobody (§ 5) |
| C | 1 | a Deno import URL matched by the report-only `milestone-version` row | nobody — correct as written |
| D | 6 | an assertion message or skip diagnostic | nobody (§ 5) |
| E | 3 | a shell variable whose value is a runtime string | nobody (§ 5) |
| F | 1 | a `throw new Error(...)` message | nobody (§ 5) |

Every other residue reason is named too, with a count, a representative line and one sentence on why the codemod declines it — including `markdown-file`, listed at **zero** with an explicit note that a reason with no representative is reported as having none rather than omitted.

**Measured beyond the plan's brief: TWO of criterion 5's three example classes are historical, not one.** The plan's objective records `console.warn = 0`. Measured here, ESLint `message:` is **also** zero on this tree — the only two `message:` fields in `packages/shared-config/eslint.config.mjs` read *"Use const assertion or a string union type instead."* and *"Use the $lib alias instead of deep relative imports."*, neither carrying a planning reference. Only the test-title member survives. Registered as `WINDOWS.md` **76**, because naming a class with zero members is exactly the kind of self-consistent-and-wrong artifact this phase is guarding against.

**The criterion-5-versus-review-comment-#4 contradiction is disposed of explicitly**, in § 6, naming `152-13` as the owner of the deliberate test-title renames — with the note that `packages/filters/tests/filter.test.ts:315` (comment #4's own site) does **not** appear in the 98, because its token `TIR3` is not in the codemod's pattern set. The residue TSV is a *lower bound* on the title surface, and comment #4's own site proves it.

### The deviation — three global repair rules, fixed at the instrument (`f2f0108a1`)

`repair()`'s docblock promises to repair *"ONLY in their immediate neighbourhood … anything outside a sentinel's immediate neighbourhood is never examined."* Three of its rules broke that promise. All three were measured on the real apply, not reasoned about:

| # | The rule | What it did |
|---|---|---|
| (i) | the global empty-parenthesis rule | deleted **pre-existing** empty parens anywhere on the line: `.strict()` → `.strict `, `import()` → `import `, `z.record(z.string(), z.unknown())` → `z.record(z.string, z.unknown)` |
| (ii) | the global punctuation-adjacency rule | ate the space before a sentence-leading `.`: `covered only .ts and .svelte` → `covered only.ts and.svelte` — nowhere near any deletion |
| (iii) | the doubled-backtick rule | never matched, because step 6 had already put a space between the backticks, leaving a hollow `` ` ` `` pair |

**Fix:** a second sentinel (`MARK`) live only inside `repair()`. Step 6 converts the deletion sentinel into a mark instead of straight into a space; step 3 leaves a mark inside the bracket it empties; every enclosure and punctuation rule that follows now *requires* the mark as an anchor; step 9 collapses mark runs and turns the mark back into a space. A construct the deletion never touched is now structurally unreachable.

**Three regression fixtures were hand-written, not `--emit-fixtures`-generated** — none of the five existing fixtures covered any of the three, and a fixture that never fails is not a test. `--self-test` is 5 fixtures / 0 failures.

Registered as `WINDOWS.md` **78**, because the same defect class may exist in the inherited source at `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs`, which Phase 151 ran over the whole repo and which this phase did not re-audit.

### Task 2 — the mechanical strip, one commit, proven behaviour-neutral (`bfcf2dae5`)

128 hits over 41 files: `artifact-path` 26, `decision-id-bare` 65, `task-id` 35, `plan-number` 1, `decision-id-long` 1. `phase-ref` and `spike-ref` scored **0 hits by design** — rule 6's inversion defers all 734 of them to the judgement waves.

**The behaviour-neutrality proof, which is the bar the plan sets:**

```
Comment-only diff prover (phase 152: REVIEW-HYG-02 criterion 5) — range
bfcf2dae55c89de3c29fc1784b08cd59752b9d6f~1..bfcf2dae55c89de3c29fc1784b08cd59752b9d6f;
files changed: 41; compared: 41; allowed by name: 0; 0 violation(s).
Zero non-comment byte changes, with ZERO allow entries.
```

Every other Task-2 criterion, measured:

| Criterion | Result |
|---|---|
| `git show --stat bfcf2dae5 -- '*.md'` | 0 lines |
| `git show --stat bfcf2dae5 -- .planning .claude .agents CLAUDE.md` | 0 lines |
| `git rev-list --count 01d1568e6..HEAD -- apps packages tests` | **1** — one commit over the three trees |
| second dry run, per rule | 0 / 0 / 0 / 0 / 0 / 0 / 0 / 0 — idempotent |
| `git grep 'see phases? N' -- apps packages tests` | **642**, exactly the baseline. The inverted rule 6 created none. |
| a scanned zero-reference file left byte-identical | `packages/core/src/controller/abortError.ts` — confirmed |
| `yarn build` / `yarn lint:check` / `yarn test:unit` / `assert-comment-hygiene.mjs` | all exit 0 |

### Task 3 — the seven-way queue, and the number that actually sizes it

`152-RESIDUE-REGISTER.md` § 7 carries the post-apply gate table with a **per-row delta** against `152-BASELINE.md`: `decision-id-long` 1 → **0** (OK), `plan-number` 1 → **0** (OK), `decision-id-bare` 78 → 13, `task-id` 123 → 88, `planning-path` 11 → 1, `section-anchor` 21 → 16, 8-row total **948 → 866**. `--assert-clean` still exits 1 with 6 failing rows, which is correct — the judgement work is not done.

**⚠ The finding the next seven plans need:** occurrences fell **8.6%**; the judgement surface fell **4.5%**. Remaining: **641 spans across 282 files**. The delta is *exact*, not re-estimated — the apply touched 41 files and left the other ~1,519 byte-identical, so `180 → 150` over those 41 is the whole delta and the whole-tree figure is `671 → 641`. Nearly every citation a regex could strip safely shared a span with a deferred phase reference, so the span survives with its judgement still owed. **Size 152-06 … 152-12 on 641, not on the occurrence drop.**

The partition, as an ordered path-prefix rule so totality and disjointness are structural:

```
130 + 44 + 208 + 13 + 132 + 105 + 9 = 641   ==  641 measured spans   ✓
 36 + 16 +  81 +  6 +  71 +  66 + 6 = 282   ==  282 measured files   ✓
files in more than one list = 0   ·   files in no list = 0            ✓
```

The `152-08` / `152-09` imbalance (208 spans vs 13) is stated in the register rather than hidden: `dev-seed` is where the densest planning prose in the repo lives, and RESEARCH § 4.4 argues that keeping its source and test halves with one agent is worth the imbalance.

The three named hard cases carry their dispositions, **including a correction**: the Supabase data-writer timing block is `:88-104` (seventeen lines), **not** the `:86-90` that both `152-CONTEXT.md` and this plan give.

### The E2E cardinal gate — discharged

This plan edited 13 files under `tests/`, so per `152-03`'s assignment it owns CLAUDE.md's cardinal rule for this phase. Run on a clean database (`yarn db:reset`) against exactly one fresh dev server on `:5173`:

```
150 passed (10.3m)
E2E_EXIT=0
```

**Zero failed, zero flaky, zero did-not-run.** Log preserved at `tests/e2e-runs/152-05-cardinal-gate/run.log` (gitignored, as that tree is by design). The dev server was stopped afterwards.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Three repair-pass rules reached text no deletion had touched**

- **Found during:** Task 2, reading the first apply diff
- **Issue:** `repair()`'s empty-enclosure, punctuation-adjacency and doubled-backtick rules were global over the comment line rather than anchored on the deletion, contradicting the function's own docblock. Consequences included a falsified code sample (`z.record(z.string, z.unknown)`), corrupted whitespace far from any deletion (`only.ts and.svelte`), and hollow `` ` ` `` pairs.
- **Fix:** reverted the apply; introduced a repair-local `MARK` sentinel and re-anchored every affected rule on it; added three hand-reviewed regression fixtures; re-applied.
- **Files modified:** `.planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-codemod.mjs`, `scripts/fixtures/hygiene-codemod.input.ts`, `scripts/fixtures/hygiene-codemod.expected.ts`
- **Verification:** `--self-test` 5/0; the three constructs verified byte-identical in the post-fix apply diff
- **Commit:** `f2f0108a1`

**2. [Rule 1 - Bug] 62 sentences left ungrammatical by a removed citation**

- **Found during:** Task 2's diff read (the plan names this as the correctness step and instructs that they be fixed in the same commit)
- **Fix:** each rewritten by hand inside the apply commit. Full `file:line` list below.
- **Commit:** `bfcf2dae5`
- **Two of the 62 were worse than ungrammatical and are called out separately:**
  - `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:19` — a **quoted git commit subject** was truncated by the strip (`refactor(115-02): widen svelte/store ESLint guard ... (SWEEP-03)` → `... `). Quoting a commit message minus part of its text falsifies the record — `SKILL.md:23` exactly. The quote was dropped and the SHA kept.
  - `tests/playwright.config.ts:276`, `:345`, `:435` — three **multi-line wrapped `.planning/` paths** were half-deleted: the line-scoped pattern took the head and left the continuation dangling (`146-visual-gate-self-hosted-inter-height-independent-sensitivity \``). Each sentence was rewritten rather than patched.

### Corrections recorded rather than applied

**3. [Rule 3 - Record] The apply commit message says "40 HAND-FIXES". The counted figure is 62.**

The message was written before the sites were enumerated. It was **not** corrected by rewriting history: `bfcf2dae5` sits on the shared `integration/ship-12-squash` branch and interactive rebase is unavailable in this environment, so rewriting it is the more dangerous of the two options. A reviewer reading only that commit message will see a number 22 too low. Registered as `WINDOWS.md` **77**, and the accurate list is below.

**Total deviations:** 2 auto-fixed bugs (1 instrument defect, 62 prose sites) + 1 recorded correction. **Impact:** the instrument fix is the more important of the two — without it, roughly 20 additional corruptions would have shipped, several of them in code samples rather than prose.

---

## The 62 hand-fixes, with `file:line`

Line numbers are post-apply. Columns: site · the broken text the codemod produced · the text it was replaced with (first line of each, where the fix spans several).

| Site | Codemod output | Hand-fixed to |
|---|---|---|
| `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:6` | `* lock-in self-test — the ESLint guard's APP-WIDE REACH,` | `* Lock-in self-test — …` |
| `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:17` | `* Traceability:. The CONSTRUCTION half — …` | `* The CONSTRUCTION half — … (quoted commit subject dropped, SHA kept)` |
| `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:131` | `// the guard glob covered only .ts and .svelte …` | `// The guard glob covered …` |
| `apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.test.ts:261` | `… are the leak-safe strings` / `forbids anyone from depending on` | `… the leak-safe strings nothing is allowed to depend on` |
| `apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.test.ts:299` | `// / criterion 5 -- the leak-safety bar …` | `// Criterion 5 -- the leak-safety bar …` |
| `apps/frontend/static/fonts/inter.css:1` | `/* Inter — self-hosted (phase 146, 05).` | `/* Inter — self-hosted (phase 146).` |
| `apps/frontend/static/fonts/inter.css:8` | `… is recorded in` / `* */` | `… is recorded in the phase's visual-noise ledger. */` |
| `packages/dev-seed/src/assertKnownRowProps.ts:36` | `… decided in` / `* § \`<guard_spec>\`).` | `… an omission, recorded in the guard's own spec.` |
| `packages/dev-seed/src/index.ts:21` | `(see phase 144,` / `*     ). Pure: …` | `(see phase 144). Pure: …` |
| `packages/dev-seed/src/template/permittedKeys.ts:633` | `// the deny-list, and the documented exclusions …` | `// The deny-list, and …` |
| `packages/dev-seed/src/template/permittedKeys.ts:640` | `… the real path.` / `* writes \`apps/supabase/migrations/…\`, which does not exist.` | `… the real path. The shorter … form, which appears in older notes, does not exist.` |
| `packages/dev-seed/src/template/schema.ts:173` | `… on purpose, because gives row-level authority …` | `… because row-level authority belongs to the runtime unknown-key guard …` |
| `packages/dev-seed/src/template/types.ts:8` | `… on purpose — keeps exactly ONE` | `… on purpose — there is exactly ONE row-level authority …` |
| `packages/dev-seed/src/template/types.ts:29` | `* key. (This is option A of § R1.4. Option B — …` | `* key. (The rejected alternative was a mapped-type override on \`z.infer\`; …` |
| `packages/dev-seed/src/template/types.ts:186` | `… single row-level authority` / `* . What this catches …` | `… single row-level authority.` / `* What this catches …` |
| `packages/dev-seed/src/writer.ts:179` | `// Placement is unchanged from — immediately above Pass 1 —` | `// Placement is unchanged — immediately above Pass 1 —` |
| `packages/dev-seed/tests/assertKnownRowProps.test.ts:6` | `… are invisible to` / `* This spec is the guard's contract.` | `… are invisible to the type layer. This spec is …` |
| `packages/dev-seed/tests/assertKnownRowProps.test.ts:19` | `*   4. ** 's deny/exclude split**, …` | `*   4. **The deny/exclude split**, …` |
| `packages/dev-seed/tests/assertKnownRowProps.test.ts:51` | `// the three-part message` | `// The three-part message` |
| `packages/dev-seed/tests/assertKnownRowProps.test.ts:248` | `// the deny-list and its documented, non-throwing exclusion table` | `// The deny-list and its …` |
| `packages/dev-seed/tests/assertKnownRowProps.test.ts:312` | `// And the one column declares today is denied …` | `// And the one column declared today is denied …` |
| `packages/dev-seed/tests/assertKnownRowProps.test.ts:393` | `// And the split is the one specifies: …` | `// And the split is the specified one: …` |
| `packages/dev-seed/tests/cli/resolve-template.test.ts:106` | `// ── (Phase 144) — the built-in branch validates too.` | `// ── Phase 144 — the built-in branch validates too.` |
| `packages/dev-seed/tests/fixtures/negctl-questions-entity-type-camel.ts:2` | `— phase 144, 's control, CAMEL arm (CR-01).` | `— phase 144, the deny-list control, CAMEL arm (CR-01).` |
| `packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts:2` | `— phase 144, 's control.` | `— phase 144, the deny-list control.` |
| `packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts:12` | `… is exactly why needs a deny-list beside the` | `… is exactly why the guard needs a deny-list beside the` |
| `packages/dev-seed/tests/template.test.ts:99` | `// ── (Phase 144) — the strictness behaviour …` | `// ── Phase 144 — the strictness behaviour …` |
| `packages/dev-seed/tests/template/latent.schema.test.ts:35` | `// among the four sites makes failable.` | `// among the four sites strictness makes failable.` |
| `packages/dev-seed/tests/template/linkSentinels.test.ts:213` | `* chose the shape where that world does not exist: …` | `* The shape chosen makes that world impossible: …` |
| `packages/dev-seed/tests/template/linkSentinels.test.ts:283` | `// 's two exemplars, in executable form.` | `// The two exemplars, in executable form.` |
| `packages/dev-seed/tests/template/permittedKeys.test.ts:248` | `// the same two keys are NOT read on these collections.` | `// The same two keys are NOT read …` |
| `packages/dev-seed/tests/template/strictRowTypes.type-test.ts:33` | `… those rows are outside 's guarantee altogether.` | `… outside the type layer's guarantee altogether.` |
| `packages/question-info/tests/questionTypes.test.ts:242` | `` `singleChoiceOrdinal` (ledger -iii) `` / `// iii's mitigation a guard.` | `` `singleChoiceOrdinal`, … `` / `… gives the collision its guard.` |
| `packages/question-info/tests/questionTypes.test.ts:446` | `// this block's three assertions above read only …` | `// The three assertions above read only …` |
| `packages/question-info/tests/questionTypes.test.ts:597` | `// the three assertions that stood here pinned …` | `// The three assertions that stood here pinned …` |
| `packages/question-info/tests/questionTypes.test.ts:604` | `… decoration that E9 deletes elsewhere …` | `… decoration deleted elsewhere …` |
| `tests/playwright.config.ts:275` | `Single source of that wiring's derivation:` / `* \` § *Decision (A)* — …` | `The wiring's derivation is recorded in the ordering decision — …` |
| `tests/playwright.config.ts:344` | `Single source …:` / `* 146-visual-gate-…-sensitivity \`` / `* § Derivation. */` | `The measured noise and this derivation are recorded in the visual-noise ledger. */` |
| `tests/playwright.config.ts:427` | `… not predicted: see in` / `// 0 mismatches over 91 scheduled projects.` | `… not predicted: 0 mismatches over 91 scheduled projects.` |
| `tests/playwright.config.ts:430` | `… do not restate it here, cite it:` / `//   § Decision (A)` | `The SINGLE SOURCE of the derivation is the ordering decision … deliberately not restated here.` |
| `tests/playwright.config.ts:876` | `// new mechanism, and recorded in as a gap in that list.` | `// new mechanism, and recorded as a gap in that list.` |
| `tests/scripts/tcp-forward.mjs:346` | `… that mimics the -2 bind bug --` | `… that mimics the v4-only bind bug --` |
| `tests/scripts/visual-container.sh:30` | `MEASUREMENT-ONLY overlays ('s` / `zero-tolerance noise matrix, 's height control)` | `overlays (the zero-tolerance noise matrix and the height control)` |
| `tests/scripts/visual-container.sh:61` | `… or Playwright. says` / `the block must be proven live …` | `… or Playwright. The block must be proven live …` |
| `tests/scripts/visual-container.sh:412` | `# a green suite behind an unproven block proves nothing, …` | `# A green suite behind an unproven block proves nothing, …` |
| `tests/tests/fixtures/voter/voter-journey.fixture.ts:101` | `` * ## Why this is not `waitForURL(...).catch(() => null)` (see the debug record `` | `` * ## Why this is not `waitForURL(...).catch(() => null)` `` |
| `tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts:11` | `The standing guard for is` / `the anon-client assertion in` | `The standing guard is the anon-client assertion in` |
| `tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts:33` | `… and (quoted above) deliberately keeps it that way.` | `… and the decision quoted above deliberately keeps it that way.` |
| `tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts:78` | `exactly the constituency Phase 145 decision nominates` / `'s surface without the spec …` | `exactly the constituency the Phase 145 decision nominates` / `that surface without the spec …` |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts:17` | `… and the strictness parity` / `* criterion 6 asks about …` | `… and the strictness parity that criterion 6 asks about …` |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts:71` | `* The raw-key step COLLECTS rather than throws, per` | `… per the ordering decision's § *Decision (B)*` |
| `tests/tests/specs/a11y/candidate-a11y.spec.ts:113` | `* steps. They are outside 's wording (…)` | `* steps. They are outside the criterion's wording (…)` |
| `tests/tests/specs/a11y/candidate-a11y.spec.ts:123` | `*    standalone config. re-took it inside the real suite, …` | `*    standalone config. It was re-taken inside the real suite, …` |
| `tests/tests/specs/visual/visual-regression.spec.ts:56` | `* Recorded evidence for all of the above:` *(referent deleted)* | `* All of the above is recorded evidence, not recollection.` |
| `tests/tests/specs/visual/visual-regression.spec.ts:96` | `* Demonstrated in BOTH directions by rows F2-BOGUS-RED and F3-BOGUS-GREEN in` *(referent deleted)* | `… by the F2-BOGUS-RED and F3-BOGUS-GREEN control rows.` |
| `tests/tests/utils/axeScan.ts:15` | `` * `candidate-a11y.spec.ts`. criterion 6 requires … `` | `` * `candidate-a11y.spec.ts`. Criterion 6 requires … `` |
| `tests/tests/utils/axeScan.ts:303` | `// reported softly — § *Decision (B)*: …` | `// reported softly, per § *Decision (B)*: …` |
| `tests/tests/utils/rawKeyScan.ts:46` | `* surfaces). The candidate half was blind, and 's` | `… and the negative control's \`RK1-OLD\` / \`RK2-OLD\` rows …` |
| `tests/tests/utils/rawKeyScan.ts:52` | `* (§ *Decision (B)*). Both verdicts are reported; neither` / `* short-circuits the other.` | *(joined into one line)* |
| `tests/tests/utils/rawKeyScan.ts:325` | `* § *Decision (B)* settles criterion 5's reporting question …` | `* The ordering decision's § *Decision (B)* settles …` |
| `tests/tests/utils/selectElection.ts:59` | `* Diagnosed in (12 runs at a` / `* fixed HEAD, 12/12 correlation).` | `* Diagnosed over 12 runs at a fixed HEAD, 12/12 correlation.` |
| `tests/tests/utils/tcpForward.test.ts:13` | `… upstream-dial contract` *(sentence lost its full stop with the parenthetical)* | `… upstream-dial contract.` |

*(62 rows. Where two source lines collapsed into one, the pair is shown on one row.)*

---

## Known Stubs

None. No placeholder, `TODO`, `FIXME`, empty return value or unwired data source was introduced by this plan. The 59 `todo-class` residue rows are **pre-existing** `TODO` / `FIXME` / `HACK` markers that the codemod scans solely so they are provably reported; D-14 does not authorise deleting them and this plan did not.

## Threat Flags

None. No file changed by this plan introduces network surface, an auth path, a file-access pattern or a schema change. The change class is comment bytes only, proven mechanically.

Two threat-register dispositions were exercised and held:

- **`T-152-01` (Tampering — the codemod escaping its span).** All four mitigation layers ran. The fourth, the diff read, is the one that fired: three repair rules were reaching outside their span. `assert-comment-only-diff.mjs` then confirmed zero non-comment byte changes with zero allow entries.
- **`T-152-04` (Tampering — path scope).** The apply touched no `.md` file and nothing under `.planning/`, `.claude/`, `.agents/` or `CLAUDE.md`. Asserted, not assumed.
- **`T-152-15` (Tampering — aligned comment tables).** No column shift found in the diff read. The mark-anchored repair strengthens this: there is still deliberately no global multi-space collapse, and the mark now confines every whitespace rule to the deletion site.

## Registered gaps (`.planning/WINDOWS.md`)

| # | What |
|---|---|
| **75** | 14 residue rows (classes B2 / D / E / F) are planning references in runtime strings that are **not** test titles. `152-13` owns test titles only; no plan in Phase 152 owns these 14. Each is defensible where it sits — a ledger path that must resolve on disk, a step prefix matched against live Playwright output, a diagnostic pointing at `.planning/debug/answer-surface-wait-timeout.md`. |
| **76** | Two of criterion 5's three example classes are historical, not one: `console.warn` = 0 **and** ESLint `message:` = 0. |
| **77** | The apply commit message says "40 HAND-FIXES"; the counted figure is **62**. Not corrected by rewriting history on a shared integration branch. |
| **78** | The three repair-pass defects may also exist in the inherited source at `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs`, which Phase 151 ran over the whole repo and which this phase did not re-audit. |

## Requirements

`REVIEW-HYG-02` is declared by this plan and is **NOT** marked Complete. `requirements.ready-ids` returns **0/1**: sibling plans in Phase 152 declare the same id and have no `*-SUMMARY.md` yet, so the shared-ID gate (#2388) correctly holds it Pending. `152-01` force-marked such an id in error and had to revert; this plan did not repeat that.

## Issues Encountered

None outstanding. The one blocking issue — the repair pass corrupting text — was found, fixed at the instrument, fixture-covered and committed before the apply was kept.

## Next

Ready for `152-06`. Its queue is `152-RESIDUE-REGISTER.md` § 7.4: **130 spans across 36 files**, led by `tests/playwright.config.ts` at **53** — 8% of the whole remaining judgement surface in one file, and it should be its own task within that plan.

Three things `152-06` … `152-12` must carry from here:

1. **Size on 641 spans, not on the 8.6% occurrence drop.** § 7.2.
2. **Do not touch the 98 declined rows.** 81 are `152-13`'s, with its own gate; 17 are nobody's (`WINDOWS.md` 75).
3. **Never substitute the inherited `hygiene-grep-report.sh --assert-clean`.** It is green on 682 of this phase's violations.

## Self-Check: PASSED

- `152-RESIDUE-REGISTER.md`, `152-residue.tsv`, `152-residue.prose.tsv`, `152-hygiene.json` — all present on disk.
- All four commits present in `git log`: `01d1568e6`, `f2f0108a1`, `bfcf2dae5`, `5e8a8db19`.
- Every `<acceptance_criteria>` from all three tasks re-run this session: all pass.
- Plan-level `<verification>`: dry run left the tree unchanged; prover 0 violations / 0 allow entries; second run idempotent; apply touched no `.md` and no exempt path; `yarn build` / `yarn lint:check` / `yarn test:unit` / `assert-comment-hygiene.mjs` green; the retargeted gate still exits 1; the queue is total and disjoint.
- E2E cardinal gate: **150 passed / 0 failed / 0 did-not-run**, exit 0.
