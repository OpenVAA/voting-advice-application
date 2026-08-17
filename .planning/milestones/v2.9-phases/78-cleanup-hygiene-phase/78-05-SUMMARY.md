---
phase: 78-cleanup-hygiene-phase
plan: 05
subsystem: dev-seed-cli-and-test-fixtures
tags: [clean-05, dev-seed-likert-only, voter-fixture-race-fix, path-b, cli-flag, template-filter, tdd]
requirements: [CLEAN-05]
type: execute
wave: 2
depends_on: [78-01]
provides:
  - "`@openvaa/dev-seed` CLI accepts `--likert-only` boolean flag"
  - "`applyLikertOnlyFilter(template)` exported from `packages/dev-seed/src/cli/likert-only.ts` — reusable direct-mutation filter"
  - "voter-fixture `answeredVoterPage` documents its --likert-only seed-mode dependency"
  - "CLAUDE.md `Seeding local data` section documents the --likert-only invocation + arg-forwarding caveat"
  - "Resolution of source todo 2026-05-11-voter-fixture-heterogeneous-question-types.md (Path B locked-in, Path A explicitly deferred)"
affects:
  - packages/dev-seed/src/cli/seed.ts
  - packages/dev-seed/src/cli/help.ts
  - packages/dev-seed/src/cli/likert-only.ts (new)
  - packages/dev-seed/tests/cli/likert-only.test.ts (new)
  - packages/dev-seed/tests/cli/help.test.ts
  - tests/tests/fixtures/voter.fixture.ts
  - CLAUDE.md
  - .planning/phases/78-cleanup-hygiene-phase/deferred-items.md
  - .planning/todos/completed/2026-05-11-voter-fixture-heterogeneous-question-types.md (moved from pending/)
tech-stack:
  added: []
  patterns:
    - "direct-mutation post-resolveTemplate hook (avoids template-builder refactor)"
    - "category-id → category-type Map lookup (since `category_type` lives on `question_categories`, not on individual questions)"
    - "conservative-default for unknown categories (treated as opinion → ordinal-only)"
    - "idempotent filter (second pass is no-op; dropped=0)"
key-files:
  created:
    - packages/dev-seed/src/cli/likert-only.ts
    - packages/dev-seed/tests/cli/likert-only.test.ts
    - .planning/phases/78-cleanup-hygiene-phase/78-05-SUMMARY.md
  modified:
    - packages/dev-seed/src/cli/seed.ts
    - packages/dev-seed/src/cli/help.ts
    - packages/dev-seed/tests/cli/help.test.ts
    - tests/tests/fixtures/voter.fixture.ts
    - CLAUDE.md
    - .planning/phases/78-cleanup-hygiene-phase/deferred-items.md
  moved:
    - ".planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md → .planning/todos/completed/"
decisions:
  - "Direct-mutation filter (Q5 RECOMMENDED) — implemented as a standalone module `cli/likert-only.ts` rather than inlined in `seed.ts`, so the filter is unit-testable in isolation (8 tests in `tests/cli/likert-only.test.ts`)."
  - "Filter looks up category type via `question_categories.fixed[].category_type` because the schema (`template/schema.ts:35-38`) keeps `questions.fixed[]` entries as `z.record(z.string(), z.unknown())` with no per-question `category_type` field — each question references its category via `category.external_id`."
  - "Unknown-category questions treated as opinion (kept iff `singleChoiceOrdinal`). Conservative default prevents Plan 06+ template-authors from accidentally smuggling unclassified non-Likert questions past the filter."
  - "voter.fixture.ts Option A annotation chosen (no behavioral change; 1-line `// reason:` annotation referencing the seed-mode dependency). Option B defensive assert deferred — the e2e seed shape under --likert-only is enforced by the CLI itself; runtime assertion would be redundant per CONTEXT D-13 simplicity goal."
  - "CLAUDE.md documents both the `yarn db:seed --template e2e --likert-only` canonical invocation AND the LANDMINE-9 yarn arg-forwarding caveat (`db:reset-with-data --likert-only` does NOT forward — manual chain required for full Likert-only reset)."
metrics:
  duration_seconds: 720
  tasks_completed: 2
  files_modified: 8
  files_created: 3
  completed: 2026-05-12
commits:
  - "8f1392fd1 test(78-05): add failing tests for --likert-only CLI flag"
  - "15435d4df feat(78-05): add --likert-only CLI flag to @openvaa/dev-seed"
  - "ad4b79891 docs(78-05): annotate voter.fixture + update CLAUDE.md for --likert-only"
---

# Phase 78 Plan 05: CLEAN-05 voter-fixture Path B — `--likert-only` CLI flag Summary

Shipped a `--likert-only` boolean CLI flag on `@openvaa/dev-seed` that produces a voter-fixture-compatible seed (16 singleChoiceOrdinal opinion questions + all info questions kept; non-ordinal opinion questions dropped). Path B was operator-locked-in on 2026-05-11 per the source todo; Path A (universal `answerCurrentQuestion` dispatcher) remains explicitly deferred. The 16 voter-app tests previously parked in the post-73 DATA_RACE pool are now unblocked at the seed level — full 3-run cold-start determinism verification is Plan 07's job.

## CLI Flag Implementation Summary

### `parseArgs` option

```ts
const { values } = parseArgs({
  options: {
    template: { type: 'string', short: 't' },
    seed: { type: 'string' },
    'external-id-prefix': { type: 'string' },
    'likert-only': { type: 'boolean' }, // NEW
    help: { type: 'boolean', short: 'h' }
  },
  strict: true,
  allowPositionals: false
});
```

### Post-`resolveTemplate` hook

```ts
const template = await resolveTemplate(templateArg, builtIns.templates);

if (values['likert-only']) {
  const stats = applyLikertOnlyFilter(template);
  if (stats.applied) {
    process.stdout.write(
      `[--likert-only] questions.fixed: ${stats.before} → ${stats.after} (dropped ${stats.dropped} non-ordinal opinion questions)\n`
    );
  } else {
    process.stdout.write('[--likert-only] template has no questions.fixed array; flag is a no-op for this template.\n');
  }
}
```

### Filter algorithm (`src/cli/likert-only.ts`)

```ts
export function applyLikertOnlyFilter(template: Template): LikertOnlyFilterStats {
  // 1. Build category-id → category-type map from question_categories.fixed[].
  // 2. Walk questions.fixed[]; for each q:
  //      categoryType = categoryTypes.get(q.category.external_id);
  //      if (categoryType === 'info') keep;
  //      else (opinion or unknown) keep iff q.type === 'singleChoiceOrdinal';
  // 3. Replace template.questions.fixed = filtered array.
  // 4. Return { applied, before, after, dropped } stats.
}
```

### Help text addition

```
      --likert-only                 Restrict opinion questions to singleChoiceOrdinal
                                    (info questions unaffected). Used by the E2E
                                    Likert-only voter-fixture per Phase 78 CLEAN-05.
```

## Tasks Executed

### Task 1 — CLI flag plumbing (TDD)

**RED commit** `8f1392fd1`: added 2 failing test files (`likert-only.test.ts` × 7 cases + `help.test.ts` × 1 new case). Module `src/cli/likert-only` not yet existing; USAGE string missing `--likert-only`. Confirmed failure mode by running `yarn workspace @openvaa/dev-seed test:unit tests/cli/likert-only.test.ts` (exit ≠ 0, "Cannot find module ../../src/cli/likert-only").

**GREEN commit** `15435d4df`: implemented `applyLikertOnlyFilter` + wired into `seed.ts` + updated USAGE. Confirmed:
- 8/8 `tests/cli/likert-only.test.ts` cases pass.
- 10/10 `tests/cli/help.test.ts` cases pass (1 new).
- `yarn workspace @openvaa/dev-seed typecheck` exits 0.
- `yarn workspace @openvaa/dev-seed build` exits 0 (`"build": "echo 'Nothing to build.'"`; the package runs through `tsx` at runtime, no compilation step).
- `yarn workspace @openvaa/dev-seed lint` reports 0 errors (15 pre-existing warnings).
- `yarn workspace @openvaa/dev-seed seed --help` includes `--likert-only` line.
- `parseArgs` accepts `--likert-only` and still rejects unknown flags (`--invalid-flag` errors with `ERR_PARSE_ARGS_UNKNOWN_OPTION`).

**Smoke seed (per Task 1 verify step):** NOT executed in this run. Local Supabase state is operator-managed; the plan's `<verify><automated>` block did NOT include the destructive `yarn db:reset && yarn db:seed --template e2e --likert-only` invocation, and per RESEARCH operators run the empirical seed at Plan 07's verification gate. The unit-test smoke against the actual `e2eTemplate` (last case in `tests/cli/likert-only.test.ts`) confirms the filter produces exactly **16 singleChoiceOrdinal opinion questions** + all info questions intact — same shape the destructive seed would produce.

### Task 2 — voter.fixture.ts annotation + 16-test smoke

**Commit** `ad4b79891` (rolled in with docs/CLAUDE.md edits + deferred-items + todo move).

**PART A — Option A annotation chosen:**

```ts
answeredVoterPage: async ({ page, voterAnswerCount, voterAnswerIndex }, use) => {
  // reason: requires --likert-only seed mode (singleChoiceOrdinal opinion questions only) per Phase 78 CLEAN-05 Path B. Run `yarn db:seed --template e2e --likert-only` first; see packages/dev-seed/src/cli/likert-only.ts.
  // Navigate Home -> Intro -> (optional pages) -> First Question
  await navigateToFirstQuestion(page);
  ...
```

1 LOC change. No behavioral modification. Verification gate `grep -q "likert-only" tests/tests/fixtures/voter.fixture.ts` returns OK.

Rationale: the seed-side filter is the single point of enforcement; a runtime defensive assert in the fixture would be redundant since `--likert-only` mode is the explicit contract for E2E voter-app runs. If a future regression introduces a non-Likert opinion question to the seed despite the flag, the existing 350ms-auto-advance race-test will surface the bug via fixture timeout — the annotation directs the operator to the canonical fix (re-run with `--likert-only`).

**PART B — 16-test smoke:**

The cold-start `--workers=1` smoke run was **NOT executed in this plan-execution agent** for three reasons:

1. The plan's `<verify><automated>` gate did NOT include the smoke command; the run is documented as **operator-executed** in the plan's `<verification>` checklist ("`(operator-executed) yarn db:seed --template e2e --likert-only` runs cleanly", "`(operator-executed) 16 voter-app tests ...`").
2. The cold-start full-suite voter-app run requires a healthy local Supabase + reset DB; the orchestrator did not stand up that environment for this plan.
3. Plan 07's 3-run determinism gate is the canonical sign-off per CONTEXT D-17 + D-18; a Plan 05 single-run smoke would not be authoritative (one passing run does not establish determinism).

**What this plan establishes instead:** the unit-test smoke (last case in `likert-only.test.ts`) walks the real `e2eTemplate` through the filter and asserts exactly 16 `singleChoiceOrdinal` questions remain + every non-info kept question is `singleChoiceOrdinal`. This is the deterministic correctness gate; the runtime gate transfers to Plan 07.

**Operator handoff for Plan 07 / VALIDATION:**

```bash
# Canonical Likert-only reset (manual chain — see LANDMINE-9 note below):
yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean

# Voter-app smoke (16-test cohort cold-start, single run):
yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=list \
  --grep "voter-detail|voter-journey|voter-matching|voter-results|voter-settings"
```

Expected outcome: 16 voter-app tests previously in the post-73 DATA_RACE pool now pass; any residual cascade from the candidate-profile cluster (LANDMINE-2 per CONTEXT) does NOT block Plan 05 close (Plan 07's parity-gate decides disposition).

## LANDMINE-9 Resolution (yarn arg-forwarding)

**Finding:** `yarn db:reset-with-data --likert-only` does NOT forward `--likert-only` to `db:seed`. Inspection of `package.json` (after Plan 01 rename):

```
"db:reset-with-data": "yarn supabase:reset && yarn db:seed --template default && yarn dev:clean"
```

Yarn appends trailing CLI args to the LAST command in an `&&`-chain — here, `dev:clean` — not to `db:seed` in the middle. Therefore the canonical Likert-only-reset invocation is the **explicit manual chain**:

```bash
yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean
```

Both `yarn db:reset-with-data` and `yarn dev:reset-with-data` (Plan 01 deprecated alias) hit the same limitation. CLAUDE.md `Seeding local data` documents the caveat.

**Alternative (not implemented in this plan):** add a new top-level script `yarn db:reset-with-likert-data` that hardcodes the chain. Deferred — adding scripts is template-customization territory and would muddy CLEAN-01's `db:*` namespace. The manual chain stays explicit per CONTEXT D-13's "≤1 LOC fixture change, no production code expansion" boundary.

## LANDMINE-2 Cascade Evidence

Not observed during Plan 05 execution (no E2E run performed). Plan 07's 3-run cold-start gate will surface any candidate-profile cluster cascade; Plan 05 documents the cascade evidence is NOT a blocker per `feedback_e2e_did_not_run.md` (cascade failures count as failures but inherited from upstream, not regressions of Plan 05).

## Source Todo Resolution

`.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` → `.planning/todos/completed/` (renamed via `git mv`). Added:
- `status: resolved-by-CLEAN-05`
- `resolved_date: 2026-05-12`
- `resolved_by_plan: 78-05`
- `resolved_commits:` list (3 commits)
- A `Resolution addendum (2026-05-12, Phase 78 Plan 05)` quote-block summarizing the Path B landing.

Heterogeneous-question-type voter-fixture coverage (Path A) remains explicitly **out of scope** per CONTEXT D-13 + the source todo's "Out of scope" line. Deferred to a future-milestone backlog item.

## Smoke Seed Outcome (Question-Type Distribution Probe)

Not executed (see Task 1 above for rationale). Operator-expected post-Plan-07-reset state:

| Question category type | Question type     | Count (expected post-filter) | Source                                  |
| ---------------------- | ----------------- | ---------------------------- | --------------------------------------- |
| opinion                | singleChoiceOrdinal | 16                         | sorts 0–7 (default) + 9–16 (voter)      |
| opinion                | singleChoiceCategorical | 0 (DROPPED)            | sort 17 test-question-directional-1 dropped |
| opinion                | boolean             | 0 (DROPPED)                | sort 18 test-question-boolean-1 dropped |
| info                   | text                | 4 (KEPT)                   | test-question-text, test-question-displayname, test-question-bio, test-question-social-1 |
| info                   | number              | 1 (KEPT)                   | test-question-number-1                   |

Total post-filter: **21 questions** (16 ordinal opinion + 5 info). Plan 05 unit-test smoke against the actual `e2eTemplate` confirms 16 ordinal + N info kept.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Lint quote error in seed.ts**
- **Found during:** Task 1 GREEN (after wiring the filter)
- **Issue:** Used backtick template literal for a no-interpolation log line in seed.ts:97, triggered `quotes: Strings must use singlequote` error from ESLint.
- **Fix:** Changed `` `[...] flag is a no-op for this template.\n` `` to `'[...] flag is a no-op for this template.\n'`.
- **Files modified:** `packages/dev-seed/src/cli/seed.ts` (single line).
- **Commit:** Squashed into `15435d4df`.

### Deferred Issues (out-of-scope, logged to deferred-items.md)

**1. [Pre-existing, Phase 76+77 stale assertion] `packages/dev-seed/tests/templates/e2e.test.ts:431`**
- Assertion `expect(fragmentOf('questions')?.fixed.length).toBe(18)` — stale: e2e template has 23 questions at HEAD (Phase 76 P01 added 3 info questions at sorts 19/20/21; Phase 77 P02 added test-question-number-1 at sort 22).
- Pre-existing on HEAD (verified via `git stash` + re-run yields the same 1 failure).
- Out of scope for Plan 05 per scope-boundary rule.
- Logged to `.planning/phases/78-cleanup-hygiene-phase/deferred-items.md` for Plan 07 verification-gate surface.

## Authentication Gates

None — no auth-protected resource accessed.

## Known Stubs

None.

## Threat Flags

None — the `--likert-only` flag is a developer-tooling addition to the local-only dev-seed CLI. It does not introduce network endpoints, auth paths, file access patterns, or schema changes at trust boundaries.

## TDD Gate Compliance

Plan 05 was executed in TDD mode (`tdd="true"` on Task 1). Gate sequence verified in git log:

1. **RED gate** — commit `8f1392fd1` (test-only): `test(78-05): add failing tests for --likert-only CLI flag` — added 2 failing test files (likert-only.test.ts × 7 cases + 1 new help.test.ts case).
2. **GREEN gate** — commit `15435d4df`: `feat(78-05): add --likert-only CLI flag to @openvaa/dev-seed` — implementation made all 8 RED tests + 1 help test pass.
3. No REFACTOR commit (no code-shape change needed post-GREEN beyond the inline lint-fix folded into GREEN).

## Self-Check: PASSED

- File `packages/dev-seed/src/cli/likert-only.ts` — FOUND (created by commit `15435d4df`).
- File `packages/dev-seed/tests/cli/likert-only.test.ts` — FOUND (created by commit `8f1392fd1`).
- File `packages/dev-seed/src/cli/seed.ts` — FOUND, modified by commits `8f1392fd1`/`15435d4df`/`ad4b79891` (last 2 changes).
- File `packages/dev-seed/src/cli/help.ts` — FOUND, modified by commit `15435d4df`.
- File `packages/dev-seed/tests/cli/help.test.ts` — FOUND, modified by commit `8f1392fd1`.
- File `tests/tests/fixtures/voter.fixture.ts` — FOUND, modified by commit `ad4b79891`.
- File `CLAUDE.md` — FOUND, modified by commit `ad4b79891`.
- File `.planning/phases/78-cleanup-hygiene-phase/deferred-items.md` — FOUND, modified by commit `ad4b79891`.
- File `.planning/todos/completed/2026-05-11-voter-fixture-heterogeneous-question-types.md` — FOUND with resolution addendum.
- File `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` — confirmed MOVED (no longer in pending/).
- Commit `8f1392fd1` — visible in git log (`test(78-05)`).
- Commit `15435d4df` — visible in git log (`feat(78-05)`).
- Commit `ad4b79891` — visible in git log (`docs(78-05)`).
- All grep gates from `<verification>` pass: `'likert-only'` in seed.ts; `singleChoiceOrdinal` in likert-only.ts; `likert-only` in voter.fixture.ts.
- `yarn workspace @openvaa/dev-seed build` exits 0.
- `yarn workspace @openvaa/dev-seed typecheck` exits 0.
- `yarn lint:check` exits 0 (only pre-existing warnings).
- `yarn workspace @openvaa/dev-seed test:unit` — 492/493 pass; 1 pre-existing failure logged to deferred-items.md.
