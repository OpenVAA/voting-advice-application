# Phase 141: Package Unit-Test Coverage + `test:unit` Invariant Guard - Context

**Gathered:** 2026-08-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Every automated check under `packages/*` is visible to CI, and neither the
package-coverage hole nor the teardown-prefix hole can silently reopen.

Two guards and one wiring job:

1. **Wiring (UNIT-01/02/03)** — the five `packages/*` workspaces that hold test
   files but no `test:unit` script get one, measurement-first.
2. **Coverage guard (UNIT-04)** — a package with test files and no `test:unit`
   script fails by name.
3. **Prefix guard (ASSERT-10)** — two `*.teardown.ts` sites cannot claim
   overlapping external-ID prefixes. Folded in from Phase 140's F-140-01.

**Not in scope:** repairing any test that the measurement finds red (fix or
document, per UNIT-03 — but do not expand into the failing package's domain);
changing `--passWithNoTests` on already-wired packages; any Phase 142 assertion
redesign, even in the same files.

</domain>

<decisions>
## Implementation Decisions

### Scout measurement (supersedes two roadmap assumptions)

Both were measured at HEAD on 2026-08-18 during discussion, before any decision
was locked. Recorded here because they **shrink** the phase and the planner
should not re-derive them — but they do NOT discharge UNIT-03, which still
requires plan 01 to produce the committed per-package record.

- **D-01:** All five unwired packages are **green today**, with no live API key
  and no network. Measured per package with `npx vitest run` after `yarn build`:

  | Package | Files | Tests | Result |
  |---|---|---|---|
  | `core` | 3 | 8 | pass |
  | `matching` | 5 | 43 | pass |
  | `llm` | 2 | 39 | pass |
  | `question-info` | 2 | 20 | pass |
  | `argument-condensation` | 6 | 30 | pass |
  | **total** | **18** | **140** | **0 failures** |

  Every `apiKey` in these tests is a `'test-api-key'` literal; there are no
  `process.env` reads; `condenserIntegration.test.ts` is fully mocked
  (`vi.mock('fs/promises')` + canned LLM response objects). All five already
  ship a `vitest.config.ts` and the vitest catalog dependency.

  **Consequence for UNIT-02:** the anticipated "requires a live API key" blocker
  does not exist. All three Experimental packages are **wired**, not
  skip-contracted. UNIT-02 is satisfied via its first branch (appears as an
  executed `test:unit` task) for all three; **no skip contract is written.** The
  `turbo run test:unit --dry=json` cross-check against the set of workspaces
  containing test files is still owed — that is the evidence UNIT-02 needs.

- **D-02:** The 27 teardown prefixes are currently **distinct and mutually
  non-prefixing** — verified by extracting every `const PREFIX = '...'` and
  testing all ordered pairs for `startswith`. So ASSERT-10's guard passes on the
  current tree and needs no remediation commit ahead of it.

### ASSERT-10 — teardown prefix guard

- **D-03:** Strictness is **prefix-containment**, not string equality. Throw when
  any declared prefix is a prefix of another; that subsumes the exact-duplicate
  case WR-03 actually hit. Rationale: `bulk_delete` matches **by prefix**, so a
  future `e2e-perm-` would sweep every `e2e-perm-*` dataset while passing an
  equality check. The guard should match the real hazard, not its string proxy.
  Baseline is already clean (D-02), so this lands green.
  — **Reversibility:** reversible — one comparison in one config-load block.

- **D-04:** Extraction is a **declaration-site regex**, `/^const PREFIX = '([^']+)';/m`
  per file — NOT a whole-file scan, and NOT the comment-stripping approach its
  sibling guard uses.

  Rationale (measured): **22 of the 27 prefixes appear textually in more than one
  teardown file**, in docblock prose — `e2e-perm-notloc-` and
  `e2e-bankauth-notloc-` each appear in three files, precisely because Phase 140
  documented their disjointness in comments. A naive whole-file scan throws ~22
  false duplicates on its first run. Comment-stripping (the WR-04 fix on
  `SOFT_ASSERTION_BUDGETS`) would handle those, but still scans string literals;
  reading only the declaration line is immune **by construction** rather than by
  filtering.

  All 27 sites already use this exact uniform one-line shape, so the guard is
  **read-only — zero edits to the 27 teardown files.**
  — **Reversibility:** reversible.

- **D-05:** The guard lives at **config load in `tests/playwright.config.ts`**,
  alongside ORPHAN-PROBE and SOFT-ASSERTION-BUDGET. Config-load placement is
  load-bearing, not stylistic: `--list` does not run `globalSetup`, so a check
  living in a test or in setup would never fire under `playwright test --list`.
  Follow the two siblings' error-message register — name the offending files, the
  colliding prefixes, and what to do about it.
  — **Reversibility:** reversible.

- **D-06:** Rejected — moving all 27 prefixes into a shared exported registry so
  duplication is structurally impossible. It is the stronger design in the
  abstract, but it edits 27 files the scout showed need no edit, and this phase's
  job is to guard the invariant, not restructure the fixtures. Recorded in
  Deferred rather than dropped.

### UNIT-04 — orphaned-package guard

- **D-07:** The guard **wraps the root `test:unit` script**:
  `"test:unit": "node <guard> && turbo run test:unit"`. It fires on the exact
  command whose invariant it protects — every local run and CI `main.yaml:70`
  (`run: yarn test:unit`) — so it cannot be bypassed by running the suite the
  normal way. Composing root scripts with `&&` is already the in-tree idiom
  (`lint:check` chains turbo, eslint and `typecheck:tests`).
  — **Reversibility:** reversible.

- **D-08:** Guard implementation is a **plain root-level Node script with no
  build step** (e.g. `scripts/assert-unit-test-coverage.mjs`), not a
  `packages/dev-tools` entry point.

  Rationale — bootstrapping: the guard runs **before** `turbo run test:unit`,
  therefore before turbo has built anything. A workspace-hosted guard needing
  `tsx`/build output would have a chicken-and-egg dependency on the very pipeline
  it gates. A plain `.mjs` reading `package.json` files off disk has none.
  `packages/dev-tools` remains the right home for maintainer utilities invoked
  on their own (`keygen`, `pem-to-jwk`); this is a pipeline gate, not a utility.
  Planner may relocate the file if it finds a better home that preserves the
  no-build property — the constraint is the property, not the path.
  — **Reversibility:** reversible.

- **D-09:** Detection rule: a `packages/*` workspace containing at least one test
  file (`*.test.ts` / `*.spec.ts` / `*.test.tsx`, excluding `node_modules`) and
  declaring no `test:unit` script FAILS, with the message naming the workspace.
  Both directions must be observed per the ROADMAP criterion — adding the script
  or removing the test file makes it pass.

  Note for the planner: `packages/dev-tools`, `packages/shared-config` and
  `packages/supabase-types` currently have **zero** test files and no `test:unit`
  script — they must stay passing. The guard keys on "has tests but no script",
  not on "has no script".

### Wiring shape

- **D-10:** For `llm`, `question-info` and `argument-condensation`: **rename the
  existing `test` script to `test:unit`** rather than adding a second entry point
  or aliasing. One name per workspace, consistent with the other twelve. Verified
  safe: nothing in CI or the root scripts invokes a bare `yarn workspace X test`
  — CI calls `yarn test:unit` (`main.yaml:70`) and
  `yarn workspace @openvaa/dev-seed test:unit` (`main.yaml:197`). `test:watch`
  stays as-is.
  — **Reversibility:** reversible.

- **D-11:** For `core` and `matching`: add `test:unit` (neither has any test
  script today).

- **D-12:** All five newly-wired packages use **bare `vitest run`**, NOT
  `--passWithNoTests`. All five have real tests today (D-01), so the flag would
  buy nothing except silence if those tests were later deleted — an unfailable
  check of exactly the class Phase 140 spent six plans removing. Matches
  `frontend` and `supabase`.
  — **Reversibility:** reversible.

- **D-13:** The five already-wired packages carrying `--passWithNoTests`
  (`app-shared`, `data`, `dev-seed`, `filters`, `docs`) are **left alone** in this
  phase — harmonising them was offered and declined as out of scope. See Deferred.

### Plan-shape constraint (UNIT-03)

- **D-14:** UNIT-03 is a constraint on plan **shape**, not a task: plan 01
  measures every candidate package and commits the per-package pass/fail record;
  later plans wire only what plan 01 recorded green. The D-01 table above is
  discussion-time evidence and does **not** substitute for that commit — the
  record must predate the wiring commits in git order, which is the property
  UNIT-03 actually asserts.

### Post-research amendments (operator-confirmed 2026-08-18)

Three decisions below were re-opened after `141-RESEARCH.md` measured the tree at
HEAD `69d0a2d3c` and contradicted the premises D-03/D-04/D-05 and D-08/D-09 were
built on. Each was put to the operator and answered. These amendments **supersede**
the earlier text where they conflict; the superseded decisions are kept above for
provenance, not as instructions.

- **D-15 (supersedes D-03, D-04, D-05):** ASSERT-10 is **evidence-and-reconciliation,
  not construction.** The guard those three decisions specify **already exists** at
  `tests/playwright.config.ts:138-240`, landed by Phase 140 itself (`abe1fabb0`,
  hardened by `bdb759575` and `c15e444e8`). It already implements D-03's containment
  rule and D-05's config-load placement, and its declaration-site regex at `:199` is
  a strict **superset** of D-04's proposal — plus an unparsed-declaration
  completeness check D-04 never contemplated. D-04's supporting measurement ("22 of
  27 prefixes appear in more than one teardown file") **does not reproduce**;
  research measures 1 of 27.

  Therefore: **make no edits to `tests/playwright.config.ts`.** ASSERT-10's plan
  delivers (a) the four-branch injection ledger — equality collision,
  prefix-containment overlap, unparsed-declaration completeness, and the legitimate
  no-prefix exclusion — committed as the record SC-5 demands and which the standing
  acceptance rule never produced; (b) corrections to `ROADMAP.md:387` and
  `REQUIREMENTS.md:63`, both of which assert the guard does not exist, plus an
  addendum retiring the stale `missing:` item in `140-VERIFICATION.md` that is the
  origin of the error; (c) a recorded note that D-04's proposed regex is superseded
  by the shipped `:199` regex, and why adopting D-04 as written would be a
  functional downgrade.
  — **Reversibility:** reversible — documentation and a committed evidence artifact.

- **D-16 (supersedes D-09's scope clause):** The UNIT-04 guard scans **both
  `packages/*` and `apps/*`**, not `packages/*` alone. D-09's detection rule is
  otherwise unchanged — "has at least one test file and declares no `test:unit`"
  fails, naming the workspace; "has no test files" stays passing. All three `apps/*`
  workspaces already declare `test:unit`, so this lands green today; the operator
  chose to close the invariant everywhere rather than leave a named-but-unguarded
  root. The scanned roots must still be a single array constant so the set is
  visible in one place.
  — **Reversibility:** reversible — one array constant.

- **D-17 (amends D-08; adds the UNIT-02 cross-check to the UNIT-04 guard):** The
  UNIT-02 turbo cross-check is a **second assertion inside the same guard**, not a
  one-off artifact: *every workspace declaring `test:unit` must appear as an
  **executed** task in the turbo graph* — the mirror of UNIT-04's *every workspace
  with tests must declare `test:unit`*. Together they close both directions with one
  standing check.

  **This knowingly costs D-08's no-build bootstrapping property**, and the plan must
  say so out loud rather than let it erode silently: the guard now shells
  `npx turbo run test:unit --dry=json` before `turbo run test:unit` runs. D-08's
  *plain-`.mjs`, no-build-step, no-workspace-dependency* constraint otherwise still
  holds — the guard must not gain a `tsx`/build dependency of its own.

  **Trap the implementation must clear (research Pitfall 1):** `--dry=json` lists
  **all** workspaces, including unwired ones, as `"command": "<NONEXISTENT>"`. The
  naive "diff `tasks[].package` against the test-file set" implementation therefore
  **passes at HEAD, before any work lands** — a fake guard of exactly the class
  Phase 140 spent six plans removing. The discriminator is
  `command !== '<NONEXISTENT>'`. Currently 7 executed / 8 unwired; 12 / 3 once this
  phase's wiring lands. The plan must prove the cross-check discriminates by
  observing it **red** against a package that declares no script, not merely green
  at the end.
  — **Reversibility:** reversible.

### Claude's Discretion
- Exact guard filenames, error-message wording, and how the two guards are
  factored (shared helper vs. independent blocks) — subject to the constraints
  above.
- Plan count and wave structure. Note the two workstreams (UNIT-* wiring vs.
  ASSERT-10 prefix guard) touch disjoint files and have no ordering dependency
  between them; only UNIT-03's measure-before-wire ordering is load-bearing.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and phase definition
- `.planning/ROADMAP.md` § Phase 141 — the five success criteria, incl. criterion 5 (ASSERT-10)
- `.planning/REQUIREMENTS.md` — UNIT-01..04 (lines 31-34), ASSERT-10 (line 63)
- `.planning/REQUIREMENTS.md` § Standing acceptance rule — prove the guard fails before claiming it guards

### ASSERT-10 provenance (Phase 140 follow-up F-140-01)
- `.planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-VERIFICATION.md` § Re-verification addendum — why the guard is owed; names the unbuilt half of the remedy
- `.planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-GATES.md` § WR-03 — the race, and Gate 4 that now covers it
- `.planning/STATE.md` § Deferred Items — F-140-01 row, marked CONSUMED into this phase

### Guard shapes to follow (in-tree, proven)
- `tests/playwright.config.ts:35-50` — ORPHAN-PROBE guard: config-load `throw`, names the offending files
- `tests/playwright.config.ts:57-110` — SOFT-ASSERTION-BUDGET guard: equality not ceiling, comment-stripping (WR-04), and the docblock explaining why config-load placement is required for `--list`

### Wiring surfaces
- `package.json` (root) — `test:unit`, and `lint:check` as the `&&`-composition precedent
- `turbo.json` — `test:unit` task (`dependsOn: ["build"]`, `cache: false`)
- `.github/workflows/main.yaml:70` — `run: yarn test:unit`; `:197` — dev-seed's separate invocation
- `tests/tests/setup/shared/assertTeardown.ts` — `runTeardownAsserted`, the equality accounting the prefix guard protects

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Two config-load guards in `tests/playwright.config.ts`** — ORPHAN-PROBE and
  SOFT-ASSERTION-BUDGET give ASSERT-10 a proven shape to copy: `fs` read at
  config load, `throw new Error` naming the offence and the remedy, with a
  docblock explaining why a comment would not have sufficed.
- **`runTeardownAsserted`** (`tests/tests/setup/shared/assertTeardown.ts`) — the
  27-site shared helper Phase 140 landed. ASSERT-10 protects its equality
  accounting; it does not modify it.
- **All five target packages already have `vitest.config.ts`** and the vitest
  catalog dep — wiring is a `package.json` script line each, not test setup.

### Established Patterns
- Root scripts compose with `&&` (`lint:check`), so wrapping `test:unit` is idiomatic.
- `test:unit` runs under turbo with `dependsOn: ["build"]`, `cache: false` — the
  UNIT-04 guard runs *before* turbo and therefore before any build output exists.
- All 27 teardown prefixes declare uniformly as `const PREFIX = '<literal>';` on
  a single line — the property D-04's regex depends on.

### Integration Points
- Root `package.json` `test:unit` — the single chokepoint both local runs and CI
  pass through.
- `tests/playwright.config.ts` config-load block — where ASSERT-10 joins its two siblings.
- Five `packages/*/package.json` script blocks — the wiring surface.

</code_context>

<specifics>
## Specific Ideas

- The prefix guard should read as the third member of an established family, not
  as a new invention — same error register as ORPHAN-PROBE and
  SOFT-ASSERTION-BUDGET, same "a comment asking future authors to keep this in
  sync would be the same kind of non-guard this phase exists to remove" framing.
- Both guards need the milestone's two-run negative control: observed failing
  against an injected regression (a duplicate/containing prefix; a scratch
  package with a test file and no script), then observed passing after revert.
  For ASSERT-10 the injection must be a real duplicated **declaration**, since a
  prose mention deliberately must NOT trip it (D-04).

</specifics>

<deferred>
## Deferred Ideas

- **Shared teardown-prefix registry** (D-06) — move all 27 `const PREFIX`
  declarations into one exported module so collision is structurally impossible
  rather than detected. Stronger than the guard, but edits 27 files that
  otherwise need none. Revisit if the guard ever fires in anger.
- **Harmonise `--passWithNoTests`** (D-13) — strip the flag from `app-shared`,
  `data`, `dev-seed`, `filters`, `docs` so a package whose tests all vanish
  cannot report green. Same blindness class as ASSERT-02/03/05/06; offered
  during discussion and declined as out of scope for this phase.
- **Three sibling `Rigidity contract` drift files** — already recorded as a
  follow-up in `tests/playwright.config.ts:52-55`; not this phase's business,
  noted only so the planner does not widen `SOFT_ASSERTION_BUDGETS` while nearby.

### Reviewed Todos (not folded)
`gsd-tools query todo.match-phase 141` returned six matches, all scoring on the
generic `area: packages` / keyword `packages` rather than on this phase's scope.
None folded:

- *Edit the seed utility to use strict typing for templates and throw on unknown props* — already mapped to **Phase 144** (TMPL-01/02, ASSERT-04) in REQUIREMENTS.md. Folding it here would duplicate a scoped phase.
- *Remove automatic sentinel fan-out from dev-seed pipeline* — dev-seed data model, unrelated to test wiring.
- *Remove `CustomData[Question].vertical`* — data-model cleanup, unrelated.
- *Derive base-200/300 shades from opacity* — UI theming, unrelated.
- *After runes update, recheck app header styling / banner images / candidate nav* — UI regression check, unrelated.
- *Rewrite parent answer imputation* — matching-domain change; touches `packages/matching`, which this phase only *wires*. Changing its behaviour while wiring it would violate UNIT-03's measure-then-wire ordering.

</deferred>

---

*Phase: 141-Package Unit-Test Coverage + `test:unit` Invariant Guard*
*Context gathered: 2026-08-18*
