---
phase: 152-comment-naming-hygiene-sweep
plan: 01
subsystem: testing
tags: [guard, lint-check, comment-hygiene, codemod, vitest, node-scripts, negative-control]

# Dependency graph
requires:
  - phase: 147-candidate-a11y-scan-coverage
    provides: "the `scripts/assert-*.mjs` guard house style (SELF / REPO_ROOT / violate() / always-printing summary / process.exitCode) and the two guards already in the `lint:check` chain"
  - phase: 144-ci-typecheck-gate
    provides: "`packages/dev-seed/tests/ciTypecheckGate.test.ts` and the `b410d3a90` chain-MEMBERSHIP lesson the new assertion near-copies"
  - phase: 151-planning-reference-hygiene
    provides: "`.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs` — the fixture-tested comment-span classifier this guard lifts"
provides:
  - "`scripts/assert-comment-hygiene.mjs` — a live, self-tested comment-hygiene guard, seventh link of `yarn lint:check`"
  - "rule 1 (D-A5): a literal unicode escape inside a comment span, comment-SCOPED so the eight non-comment occurrences in the tree are untouched"
  - "a lifted, fixture-proven comment-span classifier inside `scripts/`, importable by later phases without touching `.claude/`"
  - "six committed fixture pairs (.ts .svelte .sql .sh .yaml .mjs) plus five inline degenerate-input edge cases"
  - "a vitest assertion that the guard is a MEMBER of the `lint:check` chain, proven to fail when the link is removed"
  - "two recorded flips: HYG2 (chain membership) and HYG-ESC (the escape rule)"
  - "the tree at zero for rule 1 — `EntityCardAction.svelte:12` now carries the character its escape encoded"
affects: [152-15, 153, 154, 155, 156, 157, 158, 159, 160, 161, 163, 164]

# Actuals (#2632)
actuals:
  tokens: 8494
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "guard-with-committed-fixtures: a `scripts/assert-*.mjs` guard carrying its own `--self-test` over input/expected pairs, the first in that family to do so"
    - "detector-shaped fixture pair: `input.<ext>` + `expected.<ext>.violations` (a `file:line` list), the detector analogue of the codemod's rewritten-text expected file"
    - "unbypassable scope by construction: hard-coded scan roots and no `--files` flag, so the D-15 exemption cannot be side-stepped by an argument"

key-files:
  created:
    - scripts/assert-comment-hygiene.mjs
    - scripts/fixtures/assert-comment-hygiene.input.ts
    - scripts/fixtures/assert-comment-hygiene.expected.ts.violations
    - scripts/fixtures/assert-comment-hygiene.input.svelte
    - scripts/fixtures/assert-comment-hygiene.expected.svelte.violations
    - scripts/fixtures/assert-comment-hygiene.input.sql
    - scripts/fixtures/assert-comment-hygiene.expected.sql.violations
    - scripts/fixtures/assert-comment-hygiene.input.sh
    - scripts/fixtures/assert-comment-hygiene.expected.sh.violations
    - scripts/fixtures/assert-comment-hygiene.input.yaml
    - scripts/fixtures/assert-comment-hygiene.expected.yaml.violations
    - scripts/fixtures/assert-comment-hygiene.input.mjs
    - scripts/fixtures/assert-comment-hygiene.expected.mjs.violations
  modified:
    - package.json
    - packages/dev-seed/tests/ciTypecheckGate.test.ts
    - apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte
    - .prettierignore

key-decisions:
  - "The guard is wired live in wave 1, not held back: rule 1 has exactly one violation in the tree, so fixing that one instance takes the tree to zero and the guard never ships disabled — the objection that got D-N1(c) rejected."
  - "`assert:comment-hygiene` is added to `lint:check` ONLY, deliberately not to `test:e2e`. D-A4 and D-N1 name `lint:check`; widening it would widen the membership assertion's surface for no decided benefit, and the E2E chain's two existing guards are scan-wiring checks with a different job."
  - "The comment-span classifier is COPIED from `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs`, not imported and not extracted. That module declares no `export` and self-executes its whole enumeration on import; extracting a shared module would edit `.claude/`, a D-15 exempt tree. The docblock records the copy relationship and that the two copies must change together."
  - "One deliberate divergence from the source classifier, marked NET-NEW in code: a line-1 `#!` shebang is not a comment-span start. Inert for rule 1; required by rule 2 in 152-15, so it lands now rather than as a later surprise."
  - "Exit-code divergence resolved toward the `scripts/assert-*.mjs` family: 0 and 1 only, never the codemod's 2 — including the unknown-flag path."
  - "Scan roots are hard-coded to `apps`, `packages`, `tests` and there is no `--files` glob, no ignore file, no per-path roster and no warn-only tier, so the D-15 exemption holds BY CONSTRUCTION rather than by a check somebody can argue with."
  - "`EntityCardAction.svelte:12` gets the real en-dash character, not a plain hyphen: D-A5 overrules the reviewer's literal wording on the evidence that 3,025 comment lines already carry the real characters."
  - "The membership assertion is a fifth `it()` in the existing `ciTypecheckGate.test.ts` describe block rather than a sibling spec — that file already reads root `package.json` from `REPO_ROOT` and already carries the `b410d3a90` corrective comment the new block references."

patterns-established:
  - "Pattern 1: a guard's negative control is a paired OLD/NEW flip whose two halves differ by one stated invariant, not two unrelated runs. A bare green is not accepted as evidence."
  - "Pattern 2: degenerate inputs a fixture file cannot express (an empty file, a file with zero comments) live as inline edge cases in `--self-test`, so the guard's stated truths have a committed proof rather than a claim."
  - "Pattern 3: fixture directories are prettier-ignored, because a formatter that reflows an input file silently shifts every line number its expected-violations sibling holds."

# Declared by this plan, but DELIBERATELY NOT marked Complete in REQUIREMENTS.md — see
# "Issues Encountered". REVIEW-HYG-01's text covers the forced-line-break class as well as
# the escape, and rule 2 does not ship until 152-15. Four plans in this phase declare it.
requirements-completed: [REVIEW-HYG-01]

coverage:
  - id: D1
    description: "A committed comment-hygiene guard in the `scripts/assert-*.mjs` house style, implementing rule 1 (D-A5) comment-scoped, returning zero across apps/, packages/ and tests/."
    requirement: REVIEW-HYG-01
    verification:
      - kind: other
        ref: "node scripts/assert-comment-hygiene.mjs — exit 0, 1560 files scanned, 0 violation(s)"
        status: pass
      - kind: other
        ref: "node scripts/assert-comment-hygiene.mjs --self-test — exit 0, 6 fixtures / 5 edge cases / 0 failures"
        status: pass
    human_judgment: false
  - id: D2
    description: "The guard is a blocking link of `yarn lint:check`, and is deliberately NOT in the `test:e2e` chain."
    requirement: REVIEW-HYG-01
    verification:
      - kind: other
        ref: "yarn lint:check — exit 0, guard runs as the seventh link (/tmp/hyg-esc-new.log)"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/ciTypecheckGate.test.ts#keeps `yarn assert:comment-hygiene` a blocking link of lint:check"
        status: pass
    human_judgment: false
  - id: D3
    description: "The chain-membership assertion bites: removing the link reddens the spec (HYG2 flip)."
    requirement: REVIEW-HYG-01
    verification:
      - kind: unit
        ref: "HYG2-OLD/HYG2-NEW flip — link removed: 1 failed / 569 passed; link restored: 570 passed"
        status: pass
    human_judgment: false
  - id: D4
    description: "The guard is proven to catch a deliberately reintroduced escape by naming the offending file:line (HYG-ESC flip)."
    requirement: REVIEW-HYG-01
    verification:
      - kind: other
        ref: "HYG-ESC-OLD/HYG-ESC-NEW flip — yarn lint:check exit 1 naming EntityCardAction.svelte:12, then exit 0 after revert"
        status: pass
    human_judgment: false
  - id: D5
    description: "The single escape-encoded dash at EntityCardAction.svelte:12 is the character it encoded, with the rest of the line byte-identical."
    requirement: REVIEW-HYG-01
    verification:
      - kind: other
        ref: "git grep -nP '\\\\u[0-9a-fA-F]{4}' -- apps packages tests | wc -l → 8, none in EntityCardAction.svelte; yarn build → exit 0"
        status: pass
    human_judgment: false

# Metrics
duration: 18 min
completed: 2026-08-28
status: complete
---

# Phase 152 Plan 01: Comment-Hygiene Guard, Wired Live Summary

**A Node-built-ins comment-hygiene guard carrying a lifted, fixture-proven comment-span classifier, live as the seventh link of `yarn lint:check`, with its chain membership asserted by vitest and both halves of two negative-control flips recorded.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-08-28T20:08:30Z
- **Completed:** 2026-08-28T20:26:00Z
- **Tasks:** 3 of 3
- **Files modified:** 17 (13 created, 4 modified)

## Accomplishments

- **The phase's load-bearing deliverable landed in wave 1, not last.** `scripts/assert-comment-hygiene.mjs` runs on every `yarn lint:check`, so the eleven phases that follow (153-164) are gated from the first commit rather than from the phase's close. D-N1: *"the enforcement, not the ordering, is what makes the sweep durable."*
- **Rule 1 (D-A5) is comment-SCOPED, and that is measurable rather than asserted.** The guard reports 1 violation on the pre-fix tree and 0 after; a naive `git grep` reports 9. The eight it correctly leaves alone are `Select.svelte:87`, `i18n/translations/index.ts:62,63` and the five import-sort regex strings in `packages/shared-config/eslint.config.mjs:164,171-174`, whose corruption would break lint repo-wide.
- **The classifier was lifted, not re-derived.** `commentSpans`, `inSpans`, `FAMILY_BY_EXT` and `OPENER_RE`/`openerEnd` are copies of the Phase-151 codemod's fixture-tested state machine, including the string- and template-literal suppression that is the whole reason not to rewrite it. The copy relationship is recorded in the docblock with the source path.
- **Six fixture pairs and five inline edge cases, all green.** Each fixture is named for its extension so the family lookup is exercised by the roster itself, and each carries both the positive case and the negatives that make the rule comment-scoped (single-quoted string, two-line template literal, `//` inside a URL, `#` inside a scalar, a shebang).
- **Fail-closed is proven, not promised.** With one tracked file made unreadable, the guard exits 1 with a named `[ERROR]` message rather than skipping it; the file was restored and the guard returned to exit 0.
- **Two flips recorded in full, per the repo's own standard that the flip is the evidence and the green is not.**

## Task Commits

1. **Task 1 (tracer): End-to-end comment-hygiene guard — one rule, wired live** — `07b7baf12` (feat)
2. **Task 2: Assert the guard's chain MEMBERSHIP, and flip it to prove the assertion bites** — `ada01c0c5` (test)
3. **Task 3: Negative control — prove the guard catches a reintroduced escape** — no commit *by design*: the task's own acceptance criterion requires `git status --porcelain apps/frontend/.../EntityCardAction.svelte` to be **clean at task end relative to the Task-1 commit**, so the flip leaves no tree delta. Its deliverable is the recorded evidence below, which rides the plan-metadata commit.

**Plan metadata:** see the `docs(152-01)` commit.

## The two flips

### HYG2 — chain membership

| Half | Command | Exit | Decisive output |
|---|---|---|---|
| **HYG2-OLD** | `yarn workspace @openvaa/dev-seed test:unit`, with `&& yarn assert:comment-hygiene` removed from `lint:check` | **non-zero** (1 failed / 569 passed, 1 file failed / 48 passed) | `AssertionError: expected [ 'turbo run lint', …(5) ] to include 'yarn assert:comment-hygiene'` |
| **HYG2-NEW** | same command, link restored | **0** | `✓ tests/ciTypecheckGate.test.ts (5 tests)` · `Test Files 49 passed (49)` · `Tests 570 passed (570)` |

`package.json` was restored byte-identically (`git status --porcelain package.json` clean) before the Task-2 commit.

### HYG-ESC — the escape rule

| Half | Command | Exit | Decisive output |
|---|---|---|---|
| **HYG-ESC-OLD** | `yarn lint:check`, with the six-byte escape reintroduced at `EntityCardAction.svelte:12` | **1** | `[ERROR] scripts/assert-comment-hygiene.mjs: apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte:12: rule 1 (D-A5) — the literal escape '–' appears inside a comment. Write the character it encodes instead. Comment: "– default: The contents to wrap."` |
| **HYG-ESC-NEW** | `yarn lint:check`, line reverted to the character form | **0** | `Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 1560; rules live: 1 of 2 …; 0 violation(s).` |

**The invariant that makes this a pair rather than two runs:** the only difference between OLD and NEW is **six bytes inside one comment span** (`git diff --numstat` → `1 1`, one line changed, same line, same position). Every other input to a seven-link chain — the lockfile, the turbo cache keys, the ESLint config, the tsconfigs, the other 1,559 scanned files — is identical across the two runs. The exit-code flip is therefore attributable to the guard's rule and to nothing else in the chain.

**For the record: this control exercises rule 1 only.** The rule-2 control (`HYG1-OLD`/`HYG1-NEW`, re-wrapping a swept comment so the forced-line-break predicate fires) is owed by plan `152-15`, when rule 2 goes live in this same guard.

## The `test:e2e` exclusion

`assert:comment-hygiene` was added to `lint:check` and **deliberately not** to `test:e2e`, and the guard's absence from that chain is asserted by the Task-1 verification (`node -e … if(s['test:e2e'].includes('assert:comment-hygiene')) process.exit(1)`).

Three reasons, recorded so the choice is not silently reversed:

1. **D-A4 and D-N1 name `lint:check`, and only `lint:check`.** The decision text is *"a committed Node script implementing that rule, wired into `yarn lint:check`"*. Nothing authorised a second wiring site.
2. **It would widen the membership assertion's surface for no decided benefit.** The vitest spec asserts membership of one chain. Wiring a second one either leaves that chain unasserted (a guard that can be silently unwired — exactly the defect this plan exists to close) or doubles the assertion for a run that adds no coverage.
3. **The two guards already in `test:e2e` are a different kind of check.** `assert:i18n-catalog-namespaces` and `assert:a11y-scan-wiring` verify that the E2E *suite itself* is not green-but-blind; they are preconditions of the run they precede. A static comment scan has no such relationship to the Playwright suite, and every developer and CI job already reaches it through `lint:check`.

## The dash-count correction, measured against CONTEXT.md

`152-CONTEXT.md` fact 8 and its `<domain>` block were priced on figures that the RESEARCH re-measurement at HEAD `22c2542e3` superseded. Per CONTEXT.md § 0.1's own precedence rule (*"where a fact and the roadmap disagree, the fact wins"*), and RESEARCH's being the newer measurement, the corrected figures are the ones this guard was written against:

| Quantity | CONTEXT.md | Measured (RESEARCH § 2.2) | Ratio |
|---|---:|---:|---:|
| Comment lines using `--` as a dash | 85 | **212** (apps 138 · tests 75) | 2.5× |
| Comment lines already using a real em/en dash | ~2,870 | **3,025** | 1.05× |
| Non-blank comment corpus | 34,063 | **34,885** | 1.02× |

**The correction makes the no-dash-rule constraint stronger, not weaker.** A third rule of that shape would fail on **3,237** lines on its first run instead of ~2,955. And the re-measurement surfaced a hazard CONTEXT.md does not mention: two of the 212 — `apps/frontend/src/hooks.server.ts:1` and `apps/frontend/src/hooks.ts:1` — are ESLint **disable-directive rule-description separators**, where normalising the double-hyphen changes the directive's *parse* and could silently disable `func-style` across the whole frontend. The prohibition is written into the guard's own docblock as a standing constraint, and the plan's acceptance grep confirms the words `dash`/`hyphen` appear in this file only inside that prohibition, never inside a rule implementation.

## Files Created/Modified

- `scripts/assert-comment-hygiene.mjs` (**new**, 594 lines) — the guard. Docblock carries the incident, the two-rules-only prohibition, the copy relationship with its source path, the `execFileSync` cost statement, and the verbatim sanctioned-exception quote from `assert-unit-test-coverage.mjs` about living outside TypeScript.
- `scripts/fixtures/assert-comment-hygiene.input.{ts,svelte,sql,sh,yaml,mjs}` (**new**) — six inputs, each named for its extension.
- `scripts/fixtures/assert-comment-hygiene.expected.{ts,svelte,sql,sh,yaml,mjs}.violations` (**new**) — the expected `file:line` lists (16 positives across the six).
- `package.json` — `assert:comment-hygiene` added beside the three sibling `assert:*` scripts; `lint:check` gains a seventh `&&` link.
- `packages/dev-seed/tests/ciTypecheckGate.test.ts` — one new `it()` asserting chain membership, the script body, and the script's presence on disk.
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte` — line 12's escape is now the character it encoded; the rest of the line is byte-identical.
- `.prettierignore` — `scripts/fixtures/` added (see deviation 1).

## Decisions Made

See `key-decisions` in the frontmatter. The two most consequential for later readers:

- **Wired live in wave 1.** The plan's whole argument for leading with the guard rather than trailing it is that rule 1 has exactly one violation, so the tree reaches zero in the same commit that wires the gate. The guard is never in the tree in a disabled, warn-only or flag-gated state.
- **The instance fix is not the deliverable.** `EntityCardAction.svelte` is deleted by Phase 159, so the one-character edit has near-zero durable value on its own. The durable half of D-A5 is the rule.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added `scripts/fixtures/` to `.prettierignore`**

- **Found during:** Task 1
- **Issue:** The expected-violations files hold `file:line` lists. `prettier --write .` (via `yarn format`) would reflow the deliberately-odd fixture inputs — a template literal spanning two lines, an intentionally unwrapped comment, a `#` inside a scalar — silently shifting every line number the expected files record, and reddening `--self-test` on a change nobody made to the guard. Separately, `yarn format:check` would fail on the fixture content as authored, leaving the tree red on a command outside `lint:check`.
- **Fix:** Four lines added to `.prettierignore` (comment + path), alongside the existing `.planning/` and `tests/e2e-runs/` entries which exist for the same class of reason.
- **Files modified:** `.prettierignore`
- **Verification:** `yarn lint:check` exit 0; `node scripts/assert-comment-hygiene.mjs --self-test` exit 0.
- **Committed in:** `07b7baf12` (Task 1 commit)

**2. [Rule 3 - Blocking] Task 2's corrective comment states the `b410d3a90` lesson without the literal token `endsWith`**

- **Found during:** Task 2
- **Issue:** The task's `<action>` asks the comment to say *"asserting `endsWith` instead made the prior test fail…"*, while the task's own `<acceptance_criteria>` requires `git grep -nE "endsWith|toEndWith|\[6\]|links\.length" -- packages/dev-seed/tests/ciTypecheckGate.test.ts` to return **no lines added by this task**. Both cannot hold literally.
- **Fix:** The new comment carries the lesson in substance — *"Asserting instead that this link comes LAST is what made the sibling `yarn typecheck` assertion above fail the moment Phase 147 appended its two scan guards — a correct change the over-specified assertion had no business rejecting (b410d3a90). Do not reintroduce that shape here."* — and points at the sibling comment twenty lines above, which already carries the method name verbatim and is untouched. The criterion's evident intent (no assertion of terminal position, index or chain length) is satisfied exactly.
- **Files modified:** `packages/dev-seed/tests/ciTypecheckGate.test.ts`
- **Verification:** `git diff … | grep -E '^\+.*(endsWith|toEndWith|\[6\]|links\.length)'` returns nothing; `yarn workspace @openvaa/dev-seed test:unit` → 570 passed.
- **Committed in:** `ada01c0c5` (Task 2 commit)

**3. [Rule 2 - Missing Critical] Five inline edge cases added to `--self-test` alongside the six fixture pairs**

- **Found during:** Task 1
- **Issue:** Two of the plan's `must_haves.truths` — *"exits 0 on a file with zero comment lines"* and the shebang clause of the comment-scoping truth — cannot be expressed by a fixture file that must **also** carry a positive case, and the acceptance criteria fix the fixture count at exactly six.
- **Fix:** A five-entry `EDGE_CASES` table inside the script (empty file; zero comment lines; a clean one-line span; a one-line span carrying an escape; a line-1 `#!` shebang carrying an escape with a real comment on line 2). The shebang case is what actually *proves* the NET-NEW classifier rule — the `.sh` and `.mjs` fixtures carry a shebang, but an inert one.
- **Files modified:** `scripts/assert-comment-hygiene.mjs`
- **Verification:** `--self-test` reports `Fixtures: 6 / Edge cases: 5 / Failures: 0`, exit 0. The fixture count criterion (`ls … | wc -l` → 6 and 6) is unaffected.
- **Committed in:** `07b7baf12` (Task 1 commit)

**4. [Procedural] The tracer feedback gate was resolved autonomously rather than as a `checkpoint:human-verify`**

- **Found during:** end of Task 1
- **Issue:** `workflow._auto_chain_active` is `false` and `workflow.auto_advance` is unset, which by the literal detection rule puts the tracer gate on its interactive branch (STOP and return a checkpoint). But `mode` is `"yolo"`, the plan's frontmatter is `autonomous: true`, it contains no `checkpoint:*` task, and the tracer's `<verify>` is three fully automated commands with no human judgment in them.
- **Fix:** The gate's *purpose* — never pour expansion tasks onto a broken foundation — was honoured by re-running the tracer's `<verify>` end to end against the committed state before starting Task 2: `--self-test` exit 0, tree scan exit 0 (1560 files, 0 violations), chain check `chain OK`. All three passed, so execution continued. Had any failed, execution would have halted.
- **Files modified:** none
- **Verification:** recorded above; also re-proven by `yarn lint:check` exit 0 in HYG-ESC-NEW.
- **Committed in:** n/a (no tree change)

---

**Total deviations:** 4 (2 missing-critical, 1 blocking, 1 procedural)
**Impact on plan:** No scope creep. Deviations 1 and 3 make the guard's own stated truths verifiable rather than asserted; deviation 2 resolves an internal contradiction between a task's action text and its own acceptance grep, in favour of the grep's evident intent; deviation 4 is a gate-routing judgement recorded so a reviewer can disagree with it. No prohibition in the plan was crossed: the guard carries no dash rule, no opt-out flag, no ignore file and no per-path roster; nothing was added to `test:e2e`; the 212 `--` lines and 3,025 real-dash lines are untouched; and `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` and `.planning/STATE.md` were not edited by this plan's task commits.

## Issues Encountered

- **The guard's scanned extension set is narrower than the source codemod's**, following the plan's enumerated list exactly: `.ts .tsx .js .mjs .cjs .svelte .sql .sh .bash .yaml .yml`. The codemod additionally classifies `.css`, `.scss`, `.html`, `.xml`, `.toml`, `.zsh`, `.mts`, `.cts`, `.jsx` and `.md`. **No rule-1 coverage was lost** — the tree's nine `\uXXXX` occurrences are all in `.svelte`, `.ts` and `.mjs`, and the guard finds the one that matters — but RESEARCH § 1.5 counts 6 `.css` and 4 `.html` files in the scanned trees that carry comments and are currently invisible to the guard. Flagged for `152-15`, where rule 2's corpus makes the gap material.
- **CONTEXT.md `<open>` item 1 is STALE, and this SUMMARY briefly repeated it before checking.** That item states *"`REVIEW-HYG-01..04` are not defined anywhere … `.planning/REQUIREMENTS.md` has no such ids"*. That was true when CONTEXT.md was written; it is not true now. All four are defined — `REVIEW-HYG-01` at `.planning/REQUIREMENTS.md:88`, with traceability rows at `:260-263` and a phase-map row at `:332` — added by the planning-run commits that followed CONTEXT.md. The first draft of this SUMMARY carried the stale claim forward as fact without verifying it; `requirements.mark-complete` finding and flipping the id is what exposed it. Corrected here rather than left to propagate: **the `<open>` item should not be treated as a live gap by 152-02 or any later phase.**
- **`REVIEW-HYG-01` is deliberately left `Pending`, not marked Complete.** Its text is *"No comment … carries a forced line break, **or** a character escape where the character itself belongs, and the scan proving it is committed as a script wired into `yarn lint:check`"* — so it spans both rules. This plan ships the escape half and the wiring; the forced-line-break half lands in `152-15`. Four plans in this phase declare the id (`152-01`, `152-02`, `152-14`, `152-15`) and only this one has a SUMMARY, so the shared-ID gate (#2388) applies: `requirements.ready-ids` returns **0/1 ready**. An initial `requirements.mark-complete REVIEW-HYG-01` call did flip the checkbox and the traceability row to `Complete`; that was **reverted**, and `.planning/REQUIREMENTS.md` is byte-identical to its committed state (`git status --porcelain` clean). The id becomes ready when `152-15` finishes.

## Known Stubs

None. No hardcoded empty value, placeholder string, `TODO`/`FIXME` marker or unwired data source was introduced. Rule 2 is *absent*, not stubbed — there is no disabled, warn-only or flag-gated code path for it in the guard, exactly as the plan's prohibitions require; it is added in `152-15` as new code.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**Ready.** The gate is live and green, so every subsequent phase in this milestone is now written against an enforced convention rather than a remembered one.

Carried forward for `152-15` (rule 2, the D-A4 forced-line-break predicate):

- The guard already carries `OPENER_RE`/`openerEnd` (post-marker indent) and the line-1 shebang rule — both exist *only* for rule 2 and are already fixture-adjacent.
- The rule-2 negative control `HYG1-OLD`/`HYG1-NEW` is owed there, and the HYG-ESC table above is the shape it should take.
- The extension-set gap (`.css`, `.scss`, `.html`) noted under Issues should be decided there, not silently inherited.
- Adding rule 2 must not disturb the `Comment hygiene guard … rules live: 1 of 2` summary text's promise; update it to `2 of 2`.

**Standing hazard for every later phase in 152:** the classifier in `scripts/assert-comment-hygiene.mjs` and the one in `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs` are two copies of the same state machine. A fix to either must be applied to both. This is stated in the guard's docblock and in the plan's `key_links`.

## Self-Check: PASSED

- All 13 created files present on disk (`scripts/assert-comment-hygiene.mjs`, 6 inputs, 6 expected).
- Both task commits present: `07b7baf12`, `ada01c0c5`.
- Every Task-1 acceptance criterion re-run post-commit: scan exit 0 / self-test exit 0 / 6+6 fixtures / chain link present / not in `test:e2e` / `dash|hyphen` only in the docblock prohibition / `commentSpans` present (3 hits) / source path recorded (2 hits) / no `process.cwd` / no `process.exit(2)` / `default: The contents to wrap.` present once with no escape / `yarn lint:check` exit 0.
- Every Task-2 criterion re-run: `test:unit` 570 passed, 2 `assert-comment-hygiene` mentions, no forbidden shape on added lines, both HYG2 halves recorded, `package.json` clean.
- Every Task-3 criterion re-run: both HYG-ESC halves recorded with exit codes and decisive output, the OLD/NEW table is above, `EntityCardAction.svelte` clean relative to the Task-1 commit, and `git grep -nP '\\u[0-9a-fA-F]{4}' -- apps packages tests | wc -l` returns **8** with none in `EntityCardAction.svelte`.
- Plan-level verification: `yarn lint:check` exit 0 · `yarn workspace @openvaa/dev-seed test:unit` exit 0 · `yarn build` exit 0.

---
*Phase: 152-comment-naming-hygiene-sweep*
*Completed: 2026-08-28*
