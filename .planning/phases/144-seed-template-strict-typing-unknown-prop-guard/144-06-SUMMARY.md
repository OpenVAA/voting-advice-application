---
phase: 144-seed-template-strict-typing-unknown-prop-guard
plan: "06"
subsystem: testing
tags: [typescript, turbo, ci, github-actions, ts-expect-error, negative-control, dev-seed, tsc]

# Dependency graph
requires:
  - phase: 144-02
    provides: the twelve named `FixedRow` aliases and the widened `packages/dev-seed/tsconfig.json` `include` that puts `tests/**` inside the compiler's view
  - phase: 144-04
    provides: the Pass 0 runtime guard `assertKnownRowProps`, which is the only cover for the construction sites excess property checking cannot reach
  - phase: 144-05
    provides: the strict zod layer, and the final `tests/` specs that had to exist before row `X`'s green half could be measured
provides:
  - a standing type-only negative-control fixture that is type-checked on every gate run and never executed as a test
  - a root `typecheck` script and an extended `lint:check` chain, making `turbo run typecheck` blocking locally
  - a named type-check step in the CI static job, making a type failure legible in the Actions UI
  - ledger rows `G-NEW` and `X-NEW`, and the D-06b section recording which form of the command belongs where
affects: [144-07, any future phase adding a package with a typecheck task, any future edit to lint:check or the CI static job]

actuals:
  tokens: 8110
  tasks: 2
  commits: 5

tech-stack:
  added: []
  patterns:
    - "`-test.ts` suffix (not `.test.ts`) for a type-only fixture: inside the tsconfig `include`, outside the vitest include glob"
    - "A negative control held by a `@ts-expect-error` directive is self-guarding: deleting the offending key turns the gate red via TS2578, so the control cannot rot into a decoration"
    - "Shipped gate unforced, evidence runs forced — the split is written beside the ledger rows, not only in a plan file"

key-files:
  created:
    - packages/dev-seed/tests/template/strictRowTypes.type-test.ts
  modified:
    - package.json
    - .github/workflows/main.yaml
    - .planning/phases/144-seed-template-strict-typing-unknown-prop-guard/144-NEGATIVE-CONTROL-LEDGER.md

key-decisions:
  - "Both command forms were run for both rows rather than choosing one and rewriting the pre-registration: row `X-NEW` under the register's `tsc` form AND the plan's turbo form, row `G-NEW` under the register's bare turbo form AND the plan's new `yarn typecheck` script. They agree in every cell."
  - "The `@ts-expect-error` directives sit INSIDE the object literal, immediately above the offending property, rather than above a single-line literal as R4.4 measured — prettier owns line breaking in this repo and a reformat would have silently detached a directive from its error."
  - "Row `G-NEW`'s instrument legitimately differs from row `G-OLD`'s (turbo gate vs bare tsc). `G-OLD` measured whether the compiler could see `tests/`; `G-NEW` measures whether the gate does. Stated in the row rather than glossed."
  - "The tsc present-arm log carries a provenance header instead of being 0 bytes, because tsc prints nothing on success and an empty file is not evidence."

patterns-established:
  - "Type-only fixture: `*.type-test.ts` under `tests/`, type-checked by the package tsconfig, invisible to vitest, with a file-header contract naming the gate command and the reach limitation"
  - "Deliberate CI redundancy is stated in a comment beside the step, so a later reader does not delete it as duplication"

requirements-completed: [TMPL-01]

coverage:
  - id: D1
    description: "A standing type-only fixture holds both D-01 exemplars behind directives and the D-01 legality case without one; it is type-checked but never executed"
    requirement: "TMPL-01"
    verification:
      - kind: other
        ref: "TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/dev-seed (log tc-X-present-1.log — exit 0, 0 diagnostics, cache bypass force executing 84a48627f1baa460)"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit (log vt-06-t1.log — 47 files / 525 tests, 0 mentions of strictRowTypes.type-test.ts)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The fixture cannot silently rot — deleting the offending key leaves an unused directive, which is itself a diagnostic (row X-NEW)"
    requirement: "TMPL-01"
    verification:
      - kind: other
        ref: "TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/dev-seed on the deleted arm (log tc-X-NEW-1.log — exit 2, TS2578)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit -p packages/dev-seed/tsconfig.json on the deleted arm (log tc-X-NEW-tsc-1.log — exit 2, same TS2578 at the same position)"
        status: pass
    human_judgment: false
  - id: D3
    description: "turbo run typecheck is wired into both package.json's lint:check chain and the CI static job as its own named step"
    requirement: "TMPL-01"
    verification:
      - kind: other
        ref: "TURBO_FORCE=true yarn lint:check (log lint-06-close.log — exit 0, final link 22 successful / 0 cached)"
        status: pass
      - kind: other
        ref: "node -e script asserting scripts.typecheck === 'turbo run typecheck', lint:check ends with 'yarn typecheck', typecheck:tests still points at tests/tsconfig.json"
        status: pass
    human_judgment: false
  - id: D4
    description: "A deliberate type error under packages/dev-seed/tests/ now fails the gate, where the narrow tsconfig was blind to it (row G-NEW vs G-OLD)"
    requirement: "TMPL-01"
    verification:
      - kind: other
        ref: "TURBO_FORCE=true yarn typecheck with the byte-identical G-OLD probe restored (log tc-G-NEW-1.log — exit 2, TS2322 naming tests/__probe144/g.ts)"
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true yarn typecheck after probe removal (log tc-G-restore-1.log — exit 0, 22 successful / 0 cached)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The CI step actually blocks a merge in GitHub Actions"
    verification: []
    human_judgment: true
    rationale: "The step is asserted present, correctly ordered and locally green, but no CI run has executed it on this branch — only a real Actions run proves the gate blocks. 144-07 or the first push settles it."

# Metrics
duration: 20 min
completed: 2026-08-23
status: complete
---

# Phase 144 Plan 06: Wire the type-check gate, and prove it catches — Summary

**`turbo run typecheck` is now a blocking gate in both `package.json` and CI, and a standing self-guarding `@ts-expect-error` fixture proves it catches: a deliberate error under `packages/dev-seed/tests/` went from exit 0 / silent to exit 2 / named.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-08-23T16:24:00Z
- **Completed:** 2026-08-23T16:44:00Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- **The phase's central claim stopped being IDE-only.** Before this plan nothing in any gate type-checked `packages/dev-seed`; a tightened `Template` type that no gate reads is a comment. `turbo run typecheck` now runs from `lint:check` locally and from its own named step in the CI static job.
- **The catch is measured, not asserted.** Row `G-NEW`: `144-01`'s byte-identical probe, at the byte-identical path, now exits **2** with a diagnostic naming the file, where `G-OLD` exited **0** and never named it.
- **The fixture cannot rot.** Row `X-NEW`: deleting the offending key leaves an unused directive, which is itself `TS2578` — so "cleaning up" the control turns the gate red instead of quietly disabling it. Measured under both instruments, both halves on the same tree.
- **The reach limitation is stated in the file itself**, not left for a reader to infer: excess property checking is a fresh-object-literal rule, so `src/templates/_helpers/buildMinimal.ts`'s programmatic `perm-*` rows are outside TMPL-01's guarantee entirely, and `assertKnownRowProps` (`144-04`) is the only cover there.

## Task Commits

1. **Task 1 — land the type-only fixture** — `64819a519` (test)
2. **Task 1 — fill row `X-NEW`** — `d76bb04f2` (docs)
3. **Task 2 — wire the gate into `package.json` and CI** — `9beaac244` (feat)
4. **Task 2 — fill row `G-NEW`, record D-06b** — `c68fcd8aa` (docs)
5. **Close — provenance header on row `X-NEW`'s silent tsc log** — `d5d252ea0` (docs)

## Files Created/Modified

- `packages/dev-seed/tests/template/strictRowTypes.type-test.ts` — **created.** Two D-01 exemplars behind directives, the D-01 legality case without one, and a file-header contract.
- `package.json` — new root `typecheck` script; `lint:check` extended with it as the last chain link.
- `.github/workflows/main.yaml` — named type-check step in the static job, between ESLint and unit tests.
- `.planning/phases/.../144-NEGATIVE-CONTROL-LEDGER.md` — rows `G-NEW` and `X-NEW` filled; new § `D-06b` section.

---

## The measurements this plan owes, stated in full

### Row `X-NEW` — deleted arm

**Exit 2** under both instruments. The diagnostic, verbatim and identical under both:

```
packages/dev-seed/tests/template/strictRowTypes.type-test.ts(50,3): error TS2578: Unused '@ts-expect-error' directive.
```

The turbo log prints the same line prefixed `@openvaa/dev-seed:typecheck: ` with the path workspace-relative (`tests/template/strictRowTypes.type-test.ts(50,3)`). Code **TS2578**; the diagnostic **names the file**.

**Present arm — the pair's green half, same tree, one line more:** exit **0**, **0 diagnostics** under both instruments (`tc-X-present-1.log`, forced verdict `cache bypass, force executing 84a48627f1baa460`, `7 successful, 0 cached`; and `tc-X-present-tsc-1.log`, `grep -c 'error TS'` → 0). This reproduces row `X-OLD`, which measured the same fixture shape at 0 diagnostics under a transiently widened config. The two rows are cross-referenced in the ledger.

**Restore, proven four ways:** `git diff --exit-code` → 0; `git hash-object` → `9085fb0b1cc171e42102a9397cc72a8ad6871b31`, identical to `git rev-parse HEAD:<path>`; `git status --porcelain -- packages apps tests` → empty; and the post-restore re-run is green **at task hash `84a48627f1baa460`, byte-identical to the present arm's** — the compiler was returned to exactly the tree it started from.

### Row `G-NEW`

**Exit 2** under both `TURBO_FORCE=true yarn typecheck` and `TURBO_FORCE=true npx turbo run typecheck`. Verbatim:

```
@openvaa/dev-seed:typecheck: tests/__probe144/g.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'.
```

turbo's trailer: `Failed: @openvaa/dev-seed#typecheck` / `ERROR  run failed: command  exited (2)`. Forced verdict `cache bypass, force executing 1551280ae4997bef` — **the same task hash under both command forms**, `0 cached` in both aggregates.

**Row `G-OLD`, restated so the pair reads as a pair:** the byte-identical probe (`export const notANumber: number = 'definitely not a number';`) at the byte-identical path, under the narrow `include: ["src/**/*"]`, exited **0** with **0 diagnostics** and was **not named anywhere** in the output. Exit 0 → exit 2; silent → named. That delta is Truth #2.

**Restore:** probe directory removed, `find packages/dev-seed -name '__probe144*'` → no matches, re-run green at `22 successful, 22 total` / `0 cached, 22 total`.

### `lint:check` — verbatim before and after

Before (`package.json:33`):

```json
"lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests",
```

After:

```json
"lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck",
"typecheck": "turbo run typecheck",
```

**`typecheck:tests` is unchanged, byte for byte:** `"typecheck:tests": "node_modules/.bin/tsc -p tests/tsconfig.json --noEmit"`. It is kept because it covers the Playwright tree, which has its own `tests/tsconfig.json` and no turbo task; dropping it would have silently narrowed the gate this phase is widening (threat T-144-44).

The new `typecheck` script is **unforced** — no `TURBO_FORCE` — because caching in the shipped gate is a feature and CI cold-starts anyway.

### The new CI step, verbatim

```yaml
      # DELIBERATELY REDUNDANT with the step above: `yarn lint:check` already chains
      # `yarn typecheck` as its last link, so this step re-runs an (almost certainly
      # cached) turbo task. It is here anyway, and on purpose. A named step is what
      # makes the type-check gate legible in the Actions UI when it fails — the
      # Phase-142.1 precedent, where the frontend `svelte-check` is its own named step
      # even though `yarn build` runs in the same job. Deleting it would not weaken the
      # gate; it would only make a type failure surface as "ESlint check" instead.
      # Note it is UNFORCED on purpose (no TURBO_FORCE): caching here is a feature and
      # CI cold-starts anyway. Every *evidence* run in Phase 144 forces; the shipped
      # gate does not. See 144-NEGATIVE-CONTROL-LEDGER.md, rows `G-NEW` / `X-NEW`.
      - name: "Type-check all packages (turbo run typecheck)"
        run: yarn typecheck
```

Placed after `- run: yarn lint:check` (line 67) and before `- run: yarn test:unit` (line 83). Ordering asserted mechanically: `A=67 < B=70 < C=83`.

### Plan-close gate set

- `TURBO_FORCE=true yarn lint:check` → **exit 0**, end to end. All four links ran: `turbo run lint` (`Running lint in 15 packages`, 70 `:lint:` output lines), `eslint … tests`, `yarn typecheck:tests`, and the newly chained `yarn typecheck` whose own aggregate closes the log at `22 successful, 22 total` / `0 cached, 22 total`. Log `lint-06-close.log` (and a second confirming run, `lint-06-verify.log`).
  - ⚠ For a later reader: `lint:check` short-circuits on `&&`. A red means the **first** failing link failed and the later links never ran — it is never a whole-gate result. This run was green, so the statement above is a full-chain observation.
- `TURBO_FORCE=true npx turbo run typecheck` → **exit 0**, `22 successful, 22 total` / `0 cached, 22 total`, with **22 of 22** verdict lines reading `cache bypass, force executing`. Log `tc-06-close.log`.
- **The fixture is absent from the vitest file list:** `yarn workspace @openvaa/dev-seed test:unit` → `Test Files 47 passed (47)`, `Tests 525 passed (525)`, and `grep -c 'strictRowTypes.type-test.ts'` over the log → **0**. The file count is unchanged from the pre-fixture run, so the `-test.ts` suffix really is outside vitest's include glob.

---

## Decisions Made

- **Both command forms run for both rows.** `144-01` pre-registered `X-NEW`'s instrument as bare `tsc` and `G-NEW`'s as bare turbo; `144-06`'s action text names different forms for both. Rather than pick one and quietly rewrite a pre-registration, every half was measured under **both** forms in the same iteration. They agree in every cell, and the divergence is flagged in the rows.
- **Directives placed inside the object literal, not above a one-line literal.** R4.4 measured the fixture with the whole literal on one line and the directive above it. This repo runs prettier over `packages/**`, and a reformat that broke that line would have detached the directive from the error it suppresses — silently converting the control into a `TS2578` or a real error. Putting each directive immediately above its offending property is prettier-stable and was verified green.
- **The legality case lives in the same file as the exemplars**, per R4.4's placement recommendation, so it cannot rot: if `questions._elections` ever stopped compiling, this gate goes red.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] The plan's predicted exit code is 1; the measured value is 2, for both rows**

- **Found during:** Task 1 (row `X-NEW`) and Task 2 (row `G-NEW`)
- **Issue:** `144-06-PLAN.md` predicts `exit 1` in both actions and both acceptance-criteria lists. `tsc` exits **2** when a run completes with diagnostics, and turbo propagates that code.
- **Fix:** Recorded **2** in both rows with an explicit correction note, rather than writing a number no command produced. This corroborates the same one-off already recorded independently by `144-01` (`X-OLD`, row `P`) and `144-02` (`T1-NEW`, `T2-NEW`) — the plan text under-predicts `tsc`'s exit code by one consistently across the whole phase.
- **Files modified:** the ledger rows `G-NEW`, `X-NEW`
- **Verification:** exit code captured directly from both instruments in both iterations; turbo's own trailer reads `exited (2)`
- **Committed in:** `d76bb04f2`, `c68fcd8aa`

**2. [Rule 2 — Missing critical] `tc-X-present-tsc-1.log` was 0 bytes and therefore not evidence**

- **Found during:** plan-close self-check
- **Issue:** `tsc` prints nothing on success, so the direct-`tsc` present-arm log was empty. An empty file cannot be distinguished from a run that never happened — precisely the failure mode this ledger's "measurement, never citation" clause exists to prevent.
- **Fix:** Re-took the log with a provenance header (command, HEAD, fixture blob hash, exit code), matching the convention `144-01` used for its own silent `tsc` successes, and noted the header in row `X-NEW`'s cell.
- **Files modified:** the ledger row `X-NEW`; the log
- **Verification:** `test -s` on the log now passes; `grep -c 'error TS'` → 0
- **Committed in:** `d5d252ea0`

**3. [Rule 3 — Blocking] Prettier reformatted the fixture on first write**

- **Found during:** Task 1
- **Issue:** The initial fixture failed `prettier --check`, which would have failed the repo's `format:check` gate in CI.
- **Fix:** Ran `prettier --write` on the file (it collapsed the type-only import to one line), then **re-measured the present arm** on the formatted file rather than trusting the pre-format measurement.
- **Files modified:** `packages/dev-seed/tests/template/strictRowTypes.type-test.ts`
- **Verification:** `prettier --check` clean; `TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/dev-seed` re-run green; eslint clean (0 mentions of the fixture in the dev-seed lint log)
- **Committed in:** `64819a519` (part of the task commit)

---

**Total deviations:** 3 auto-fixed (1 bug/record correction, 1 missing critical, 1 blocking).
**Impact on plan:** No scope change. Two are record-honesty corrections that make the rows say what the machine said; one is a formatting fix that would otherwise have failed a different gate in CI.

## Issues Encountered

- **Row `G-NEW`'s instrument legitimately differs from `G-OLD`'s.** `G-OLD` ran bare `tsc`; `G-NEW` runs the turbo gate. This is not the pair-integrity violation that `144-02`'s § "Instrument and exit-code corrections" warned about — `G-OLD` measured whether the **compiler** could see `tests/`, and `G-NEW` measures whether the **gate** does, which is a strictly stronger claim and the entire content of Truth #2. The injection is byte-identical, so the pair is still a pair. Stated in the row rather than glossed.

## Corrections carried forward (NOT fixed here — `144-07` owns them)

- `REQUIREMENTS.md:57` / F13 still say the corpus is "six" sites; `144-05`'s census re-derived it as **4 blind + 3 already-failable + 3 unfailable-by-construction = 10**.
- `144-RESEARCH.md` R2.2's headline word says twelve sentinel pairs; the correct figure is **10**.
- The E2E suite was **not** run by this plan and this plan claims nothing about it. `144-05-SUMMARY.md`'s line that "144-06 owns the E2E gate" is wrong — **`144-07` owns the full E2E gate.** This plan owns the TYPECHECK gate only.

## User Setup Required

None — no external service configuration required. Note that the new CI step will run on the next push to a branch covered by `.github/workflows/main.yaml`; no secrets or variables were added.

## Next Phase Readiness

- Ledger placeholder count is down to **10** (rows `C` and `Z`, both owned by `144-07`). No row this plan owns carries a placeholder.
- `TURBO_FORCE=true yarn lint:check` and `TURBO_FORCE=true npx turbo run typecheck` are both green on the committed tree with forced verdicts, so `144-07` starts from a clean gate set.
- `144-07` still owes: rows `C` and `Z`, the ledger's empty § Gates / § Final counts / § Completeness sections, the three record corrections listed above, and the full E2E gate.

## Self-Check: PASSED

- All four key files present on disk (`[ -f ]`).
- All five commits found in `git log --oneline --all`: `64819a519`, `d76bb04f2`, `9beaac244`, `c68fcd8aa`, `d5d252ea0`.
- All thirteen referenced logs exist and are non-empty under `${TMPDIR:-/tmp}/gsd-144/`.
- Both tasks' `<verify><automated>` blocks re-run at close: **exit 0** each.
- Working tree clean: `git status --porcelain -- packages apps tests` → empty; no `__probe144*` survives.

---

_Phase: 144-seed-template-strict-typing-unknown-prop-guard_
_Completed: 2026-08-23_
