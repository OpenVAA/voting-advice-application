---
phase: 141-package-unit-test-coverage-test-unit-invariant-guard
plan: 04
subsystem: e2e-test-infrastructure
tags: [assert-10, negative-control, teardown-prefix-guard, provenance-correction, evidence-only]
requires:
  - "tests/playwright.config.ts:138-240 (the shipped TEARDOWN-PREFIX-UNIQUENESS GUARD, built by Phase 140)"
  - "tests/tests/setup/shared/assertTeardown.ts (the 27-of-28 equality accounting the invariant protects)"
provides:
  - "141-ASSERT10-LEDGER.md — nine-row negative-control record discharging ASSERT-10"
  - "Corrected provenance in ROADMAP.md, REQUIREMENTS.md and 140-VERIFICATION.md"
affects:
  - ".planning/ROADMAP.md (Phase 140 status paragraph only)"
  - ".planning/REQUIREMENTS.md (ASSERT-10 parenthetical only)"
  - ".planning/phases/140-.../140-VERIFICATION.md (appended addendum only)"
tech-stack:
  added: []
  patterns:
    - "Negative control for an ALREADY-SHIPPED guard: the standing rule's 'demonstrate blindness' half becomes the legitimate-exclusion + clean-baseline pair (guard must be shown NOT to fire where it must not)"
    - "Config-load placement proven by stack frame (loadUserConfig/loadConfigFromFile), not inferred from where the code sits in the file"
    - "Injection scan re-uses the guard's OWN extraction regex, so the measured set cannot drift from the compared set"
key-files:
  created:
    - .planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-ASSERT10-LEDGER.md
  modified:
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md
    - .planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-VERIFICATION.md
decisions:
  - "D-15 honoured literally: zero edits to tests/playwright.config.ts; git diff --exit-code exits 0"
  - "Row C used 'e2e-perm-orgmatch' (prefix of exactly ONE declared prefix) rather than 'e2e-perm-not' (prefix of two), so the reported pair is deterministic rather than readdirSync-order dependent"
  - "D-04's '22 of 27' cross-file measurement recorded as NOT reproducing (measures 1 of 27); 141-CONTEXT.md:77 left as written rather than rewritten, so the drift stays visible"
  - "ROADMAP Phase 141 criterion 5's own provenance wording left untouched — the plan scoped Edit 1 to the Phase 140 paragraph and forbade touching other phase entries"
metrics:
  duration: ~10 min
  completed: 2026-08-18
actuals:
  tokens: 19000
  tasks: 2
  commits: 2
status: complete
---

# Phase 141 Plan 04: ASSERT-10 Evidence and Reconciliation Summary

Ran every branch of the already-shipped teardown-prefix guard red by injection — nine rows, all at HEAD
`9b6d939a1` — and corrected the three committed records that said the guard was never built.

## What was done

**This plan built nothing.** Per **D-15** `tests/playwright.config.ts` was read-only throughout; it is
byte-identical to how the plan found it (`git diff --exit-code` exits 0, asserted after both tasks). The
guard was built by **Phase 140** (`abe1fabb0`, hardened by `bdb759575` and `c15e444e8`). What Phase 140
skipped — and what this plan supplies — is the negative-control evidence the milestone's standing
acceptance rule demands. A guard observed only green is indistinguishable from a guard that cannot fail.

### Task 1 — the nine-row injection ledger (`0e413f363`)

`141-ASSERT10-LEDGER.md`. Every row is a run executed in this task; `141-RESEARCH.md` § Injection Ledger
is cited only as the template for the document's shape, never as a source of truth for an outcome.

Command for every row: `npx playwright test -c ./tests/playwright.config.ts --list`.

| Row | Branch | Exit | Outcome |
|-----|--------|------|---------|
| A | clean baseline | **0** | `Total: 143 tests in 94 files` |
| B | equality collision (`:220`→throw `:221`) | **1** | names `bank-auth-journey.teardown.ts` + scratch + shared prefix |
| C | containment overlap (`:230`→throw `:232`) | **1** | names shorter/longer file, quotes the `LIKE 'e2e-perm-orgmatch%'` scan |
| D | unparsed declaration, WR-03 (`:206`→throw `:207`) | **1** | names the file (`let PREFIX` + helper call) |
| E | legitimate exclusion — must NOT fire | **0** | `Total: 143 tests in 94 files` |
| F | enumeration scope outside `setup/` (`:221`) | **1** | reports `zz-scratch-f.teardown.ts` — **no `setup/` path segment** |
| G1 | empty prefix **with** helper call | **1** | **completeness** branch `:207`, names one file only |
| G2 | empty prefix **without** helper call | **0** | `Total: 143 tests in 94 files` |
| H | encoding scan (not an injection) | **0** | 27 of 28 declare; **0** non-ASCII; **0** normalisation-sensitive |
| I | clean revert | **0** | `Total: 143 tests in 94 files` — identical to row A |

Four findings worth carrying forward:

1. **Config-load placement was observed, not inferred.** `--list` does not run `globalSetup` and executes
   no spec body, and every throwing row's stack terminates in `loadUserConfig` → `loadConfig` →
   `loadConfigFromFile`. A check living in a fixture, a setup project or a spec would be invisible to
   every command in this ledger.
2. **The empty-prefix edge is closed one layer earlier than expected, and that is stronger.** An empty
   string is a prefix of all 27, so reaching the containment branch would fire against an arbitrary
   first-pair victim and tell the author nothing. It never gets there: the extraction regex captures
   `([^'"]+)` — *one or more* — so `const PREFIX = ''` does not parse at all. Row G1 (with helper call)
   hits the completeness branch at `:207` and names only its own file; row G2 (without) exits 0 as the
   legitimate exclusion. Two independent signals establish the branch — the throw site AND the fact that
   one file is named rather than a pair.
3. **Row F is the only row that discriminates scan scope.** All 28 teardowns live under `setup/` today,
   so a `setup/`-only scan would look identical in every other row. The reported path `zz-scratch-f.teardown.ts`
   carries no `setup/` segment where every other row reports `setup/…` — that is IN-02's whole-`TESTS_DIR`
   enumeration observed directly.
4. **Row E is the decisive blindness half.** `candidate-journey.teardown.ts` ships the prefix-free shape
   today; a guard that fired on it would be a false positive against a file already in the tree.

### Task 2 — the three provenance corrections (`775e7fe97`)

- **`ROADMAP.md`** Phase 140 status paragraph: F-140-01 marked **RESOLVED**, not deleted (the follow-up's
  existence is part of the record). Replacement names `abe1fabb0`/`bdb759575`/`c15e444e8`, states
  containment-plus-equality, the completeness check and config-load placement, and says what F-140-01
  *actually* left outstanding: the evidence, not the guard.
- **`REQUIREMENTS.md`** ASSERT-10: only the trailing parenthetical replaced; the requirement's own
  statement of the invariant is untouched — it was always the right requirement.
- **`140-VERIFICATION.md`**: **appended** addendum (70 insertions, **0 deletions**). The original
  `missing:` list and the `:238` paragraph are left verbatim. They were true at their own timestamp
  (`verified: 2026-08-15T19:15:00Z`); `abe1fabb0` landed the remedy at 20:04:35 the same evening; the item
  was never amended at the 2026-08-18 re-verification, and two downstream documents inherited the stale
  claim. Preserving the original is what makes that drift legible.

Each corrected sentence names a commit, so a future reader can check the claim rather than trust it —
the property whose absence produced this defect.

## Deviations from Plan

**None.** Plan executed as written. Two judgment calls made inside the plan's latitude, both recorded in
the ledger:

- Row C's overlap prefix is `'e2e-perm-orgmatch'` (a strict prefix of exactly one declared prefix) rather
  than something like `'e2e-perm-not'`, which is a prefix of both `e2e-perm-notloc-` and `e2e-perm-notif-`
  and would have made the reported pair depend on `readdirSync` order. The plan specified the branch, not
  the literal.
- The plan's Edit 1 was scoped to the Phase 140 paragraph, and its acceptance criteria forbid touching
  any other phase entry. ROADMAP Phase 141 success-criterion 5 contains a similar wording ("the remedy
  Phase 140 recorded but did not build"), but it sits in the Phase 141 entry and is already contextually
  corrected by that section's own Shape note. Left untouched deliberately — flagged here rather than
  silently widened.

## Interruption and recovery

The executor's first attempt died on an API server error immediately after all nine rows were collected
and immediately before the ledger `Write` landed. The orchestrator verified disk state (no ledger, no
summary, no `141-04` commits, `git status --porcelain` empty — injections cleanly reverted) and resumed.
No injection was re-run and no row was reconstructed or inferred: all nine outcomes survived in the
executor's context and were written from there. Recorded because "was this row re-derived from memory or
from a run?" is exactly the question a negative-control ledger exists to answer — the answer is that every
row came from a real run on 2026-08-18 at HEAD `9b6d939a1`, and none was regenerated after the drop.

## Authentication Gates

None.

## Verification

| Check | Result |
|-------|--------|
| `npx playwright test -c ./tests/playwright.config.ts --list` | exit **0**, `Total: 143 tests in 94 files` — matches ledger rows A and I |
| `git diff --exit-code -- tests/playwright.config.ts` | exit **0** (D-15 read-only held) |
| `git status --porcelain -- tests` | empty |
| `find tests -name 'zz-scratch*'` | no matches |
| ROADMAP no longer asserts `no config-load prefix-uniqueness guard exists`; names `abe1fabb0` | pass |
| REQUIREMENTS no longer asserts `the guard against a *future* duplicate was never built`; names `abe1fabb0` | pass |
| `140-VERIFICATION.md` addendum present, dated, attributed to Phase 141, cites `abe1fabb0` | pass |
| `git diff --numstat` scope | `ROADMAP.md` 1+/1−, `REQUIREMENTS.md` 1+/1−, `140-VERIFICATION.md` 70+/0− |
| `yarn lint:check` | not run — **discharged by inspection**: `git diff --name-only` for this plan lists three `.md` files and nothing lintable |
| `.agents/code-review-checklist.md` | **not applicable, recorded rather than skipped**: its three sections (Supabase Backend, Supabase Adapter, Edge Functions) apply to no file this plan touches — the plan modifies only `.planning/*.md` |

**Human-check (`<verify><human-check>` on task 2)** — "re-read the three corrected passages against
`tests/playwright.config.ts:137-240` and confirm each new sentence is factually true of the shipped
guard". Performed and recorded; there is no automated oracle for prose correctness, so a verifier should
re-confirm:

| Claim in the corrected prose | Shipped code | Verdict |
|---|---|---|
| equality check | `:220 if (a.prefix === b.prefix)` | true |
| containment check | `:230 if (a.prefix.startsWith(b.prefix) \|\| b.prefix.startsWith(a.prefix))` | true |
| completeness check (WR-03) | `:206 if (unparsedTeardownPrefixFiles.length > 0)` | true |
| `fs.existsSync` precondition (IN-01, `bdb759575`) | `:184 if (!fs.existsSync(teardownDir))` | true |
| whole-`TESTS_DIR` scope (IN-02, `c15e444e8`) | `:179 const teardownDir = TESTS_DIR;` | true |
| guard block `:138-240` | `:138` docblock opener, `:240` closing brace | true |
| config-load placement | stack frames `loadUserConfig`/`loadConfigFromFile` in rows B/C/D/F/G1 | true |
| commit attributions | `git log` subjects for `abe1fabb0`, `bdb759575`, `c15e444e8` | true |

## Success Criteria

| Criterion | Status |
|---|---|
| Guard fails by name on a duplicate prefix, by injection then reverted; disjoint set passes clean | met (rows B, A, I) |
| Containment, completeness and legitimate-exclusion branches proven, plus the empty-prefix edge in both sub-cases | met (rows C, D, E, G1, G2) |
| No `.planning/` document still asserts the guard was never built; each correction names the building commit | met (task 2) |
| `tests/playwright.config.ts` byte-identical to its pre-plan state | met |

## Probe Accounting

Both applicable ASSERT-10 edge items resolved **explicit**, and proven against the shipped code rather
than assumed:

- **`empty`** — an empty prefix declaration does not parse (regex requires `+`), so it never reaches the
  containment branch where it would fire against all 27. Both sub-cases observed (row G).
- **`encoding`** — UTF-16 code-unit `===`/`startsWith`, no `.normalize()`, no case folding anywhere in
  `:179-240`, matching the byte semantics of the `external_id LIKE '<prefix>%'` scan the invariant
  protects. ASCII scan over all 27 declared prefixes: 0 non-ASCII, 0 normalisation-sensitive (row H).

## Prohibition Discharge

**"The reconciliation must not overstate this phase's contribution."** Discharged, and load-bearing rather
than pro-forma — the defect being repaired *is* a broken provenance link, so inheriting credit here would
reproduce the failure in the very document meant to fix it. Concretely:

- The ledger opens by stating the guard was not built here, and carries a dedicated
  `## What this phase did NOT do` section with a commit table attributing construction to Phase 140.
- Both corrected records attribute construction to `abe1fabb0` and describe Phase 141's role as evidence
  and correction only.
- This summary's own first line under "What was done" states the plan built nothing.

## Threat Mitigations Applied

| Threat | Mitigation as executed |
|---|---|
| T-141-06 (scratch teardown left behind ⇒ every Playwright invocation throws) | targeted `rm` after each row; `git status --porcelain -- tests` asserted empty **between** rows; rows A and I record the identical total; final `find tests -name 'zz-scratch*'` empty |
| T-141-16 (tampering with `tests/playwright.config.ts`) | zero edits; `git diff --exit-code` asserted after both tasks; `SOFT_ASSERTION_BUDGETS` and the three sibling drift files untouched |
| T-141-05 (repudiation — unsourced ledger rows) | every row carries command, exit code and verbatim message from a run in this task; research ledger cited as template only |
| T-141-17 (whole-file write destroying ROADMAP entries) | `Edit` with scoped single-clause replacements; `git diff --numstat` confirms 1+/1− on each of ROADMAP/REQUIREMENTS and 70+/0− (append-only) on `140-VERIFICATION.md` |
| T-141-SC (package installs) | zero installs; only already-installed Playwright, Node and git were invoked |

**Injection isolation contract honoured.** No `git checkout .`, no `git stash`, no `git clean` at any
point — a sibling wave-1 plan (141-01) was operating under `packages/` concurrently and any blanket
revert would have destroyed its live injection. Every revert was a targeted `rm` of an exact path this
plan created, and every cleanliness assertion was scoped with `-- tests`.

**Wave contract honoured.** `141-MEASUREMENT.md` and `141-NEGATIVE-CONTROL.md` were not touched; this
plan's ledger is the separate file `141-ASSERT10-LEDGER.md`.

## Known Stubs

None. This plan produced no code and no placeholder content; every ledger row carries a real exit code.

## Follow-ups Surfaced

- **D-04's "22 of 27" figure is wrong and still stands in `141-CONTEXT.md:77`.** Measured 1 of 27
  cross-file this session (the single hit is `e2e-perm-notloc-` appearing as a residual mention in
  `bank-auth-journey.teardown.ts` — the historical scar of the CR-01 collision itself). Left in place
  deliberately: rewriting a decision record to match a later measurement destroys the drift trail. The
  ledger's `## D-04's measurement does not reproduce` section is where it is superseded.
- **Transferable lesson for re-verification passes** (recorded in the `140-VERIFICATION.md` addendum): a
  `missing:` list is read later as a live claim about the tree, not as a snapshot. Here the remedy landed
  within the hour, the item was never amended, and three documents inherited a falsehood while the code
  was already correct. Re-verification should re-check the `missing:` list against the tree, not only the
  must-haves that were previously unmet.

## Self-Check: PASSED

- `141-ASSERT10-LEDGER.md` — FOUND
- `.planning/ROADMAP.md` — FOUND
- `.planning/REQUIREMENTS.md` — FOUND
- `140-VERIFICATION.md` — FOUND
- commit `0e413f363` — FOUND
- commit `775e7fe97` — FOUND
