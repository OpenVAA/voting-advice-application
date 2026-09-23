---
phase: 145
phase_name: "default-seed-template-repair"
project: "OpenVAA Framework Evolution"
generated: "2026-08-24"
counts:
  decisions: 11
  lessons: 10
  patterns: 9
  surprises: 8
missing_artifacts:
  - "145-UAT.md"
---

# Phase 145 Learnings: Default Seed Template Repair

## Decisions

### The root cause is named from measurement, and all three roadmap guesses are disproved
The defect is an RLS-predicate asymmetry: `bulkImport`'s `PUBLISHABLE_TABLES` auto-default satisfies one of `anon_select_candidates`'s three clauses, so seeded candidates are `published` but carry no `terms_of_use_accepted` and are invisible to the voter app's anon client.

**Rationale:** The roadmap offered three candidate causes; all three were measured and disproved (organizations/nominations *were* seeded — 8/377 counted; `results.sections` was ruled out). A named cause resting on measured column state and a proven-anon credential beats a fix arrived at by trial.
**Source:** 145-01-SUMMARY.md, 145-VERIFICATION.md

### The fix lands on the template's row producer, never in `bulkImport`'s auto-default
`defaults/candidates-override.ts` emits `terms_of_use_accepted` on all 327 candidate rows.

**Rationale:** Fixing it in `PUBLISHABLE_TABLES` would have swept up `e2e/base`'s two deliberately-unaccepted rows, which exist as an in-repo negative control for exactly this policy.
**Source:** 145-04-SUMMARY.md, .planning/STATE.md

### The synthetic answer emitter reads the question's declared range (option A)
`emitNumberInDeclaredRange` reads `custom_data.min`/`max` off the question row, falling back to 0–100 only when the question declares neither — rather than widening the question's range (B) or clamping in a template override (C).

**Rationale:** Fixing the producer closes the defect class for every template that declares a range, instead of patching one template's symptom.
**Source:** 145-04.1-SUMMARY.md

### A malformed declared range (min > max) is left to throw
Faker throws and the seed run fails loudly; no fallback span is substituted.

**Rationale:** Silently substituting a span would hide a bad template — the same failure mode as the defect being fixed.
**Source:** 145-04.1-SUMMARY.md

### The criterion-1 evidence instrument is a `@probe`-tagged spec outside the cardinal gate
The standing regression guard for TMPL-03 remains 145-02's anon integration assertion; the Playwright probe is evidence only, and the distinction is written into the probe file's own header.

**Rationale:** D-04's rejection of a gate spec stays unbroken — the probe seeds nothing (out-of-band pre-step) and `test:e2e` appends `--grep-invert @probe`, so it can never leak into the gate.
**Source:** 145-03-SUMMARY.md, 145-VERIFICATION.md

### The tab assertion is over the tab SET, not a card count on a tab that may not exist
`expectEntityTabs` asserts `["Candidates","Parties","Alliances"]` rather than counting cards.

**Rationale:** An RLS-invisible entity type presents as a *missing tab* — the tab set is `Object.keys(matches[electionId])` and the nomination tree drops a whole leaf at zero nominations. A card-count assertion would have failed for an unreadable reason.
**Source:** 145-03-SUMMARY.md

### The anon guard is fronted by a role differential
The assertion is preceded by an `accounts` role-differential check, so a mis-keyed credential turns the guard red instead of green-forever.

**Rationale:** An assertion whose *value* is a credential must assert that credential's identity first, or it passes for the wrong reason.
**Source:** 145-02-SUMMARY.md

### The range guard exercises two declared ranges, not the one the plan asked for
The template's `[0,10]` and an off-centre `[3,6]`.

**Rationale:** A fix that merely hardcoded the template's range would still be red. A guard that cannot distinguish range-aware from hardcoded-10 is not a guard.
**Source:** 145-04.1-SUMMARY.md

### The prose sweep ran inside Task 1 with the code rename
Task 1's action text said not to touch prose; its acceptance criterion asserted zero retired-identifier occurrences across all of `packages/dev-seed`.

**Rationale:** 26 of the 52 occurrences live in docstrings and comments, so a code-only commit cannot reach zero. Two of Task 1's three statements require the sweep; one forbids it — the criterion won, and the substitution is purely mechanical so the code diff stays readable.
**Source:** 145-06-SUMMARY.md

### Row `CI1` closes DEFERRED with its runner half unobserved
The CI wiring was asserted at source level; the runner half was never observed.

**Rationale:** Filling it green on the strength of a source read would be the failure this phase's whole method exists to refuse. A grep is not a run.
**Source:** 145-08-SUMMARY.md

### Four residual `party_*` occurrences were recorded as observed-and-out-of-scope, not swept
**Rationale:** Sweeping them would widen the rename past what its strand proof actually covers.
**Source:** 145-08-SUMMARY.md

---

## Lessons

### The existing dev-seed suite was measurably blind, not merely untested
48/48 files and 552/552 tests green (exit 0) with the live-Supabase block forced to execute, over a dataset whose candidates the anon client cannot read — because every assertion authenticates as `service_role`.

**Context:** This is the phase's blindness half (`B1-OLD`), and it is why a role differential became the guard's precondition rather than an extra.
**Source:** 145-01-SUMMARY.md

### `yarn test:unit` re-seeds the live DB with no post-test teardown
`default-template.integration.test.ts` runs `runTeardown('seed_', …)` in its `beforeAll` and then rewrites the full default template, so the dataset the suite runs green over is not the dataset a pre-run diagnostic measured.

**Context:** Recorded as § Sequencing hazard. Without the extra same-session post-run probe, `B1-OLD` would have joined a greenness measured on one database state to an anon-unreadability measured on another. Corroborates the same finding from Phase 144's gate 7.
**Source:** 145-01-SUMMARY.md

### `zsh` does not populate `PIPESTATUS`
It uses lower-case, 1-indexed `pipestatus`. A `cmd | tee log` capture therefore records an empty exit code.

**Context:** Cost one re-run in 145-02 and recurred in 145-08's gate 1 — where the missing exit code meant the first "green" had been read from summary lines rather than an exit code, masking a real red. Portable form: `cmd > log 2>&1; EXIT=$?`.
**Source:** 145-02-SUMMARY.md, 145-08-SUMMARY.md

### Two plan verify sub-checks were unsatisfiable against their own pre-change baselines
`grep -c 'paths-filter' .github/workflows/main.yaml -le 1` was already 2 (one real use plus the comment saying there deliberately is none here); `grep -c 'createClient' default.test.ts -eq 0` was already 1 (the docstring *forbidding* it).

**Context:** In both cases the only string matching was the sentence documenting the property being asserted. Replaced with strictly stronger checks (job-scoped count of 0; call-site count `createClient(` of 0, plus an unchanged whole-file baseline). No product byte was changed to make a check pass.
**Source:** 145-02-SUMMARY.md

### An acceptance grep for a forbidden token constrains comments as well as code
A rationale comment naming `new Date(` and `Date.now(` while explaining that neither may be used tripped the plan's own forbidden-token check.

**Context:** Reworded to name the *class* of value ("a clock-derived value"). The same shape appeared three times in 145-06 — two ordinary English `any` words in comments, and a docstring example whose single quotes inflated a quoted-value count from 6 to 7.
**Source:** 145-04-SUMMARY.md, 145-06-SUMMARY.md

### `grep -c` counts lines where a set-membership check means occurrences
`sed -n '/const PUBLISHABLE_TABLES/,/\]);/p' | grep -c "'"` returns 10 for ten one-per-line table names, so a `-ge 20` check can never pass on an unchanged set.

**Context:** Evaluated two ways instead of weakened: `grep -o "'" | wc -l` gives 20, and a `diff` of the block against the previous HEAD is empty — proving membership identity directly.
**Source:** 145-04-SUMMARY.md

### `yarn db:reset-with-data` can die on a Supabase Storage/kong 502 wedge
The first invocation applied all migrations and the SQL seed, then failed at "Restarting containers…" with `Error status 502`; because the script chains with `&&`, the seeding half never ran, leaving a schema-only database.

**Context:** Recovered with `docker restart supabase_kong_openvaa-local` and polling `/storage/v1/bucket` until it stopped returning 502 (settled at 400/403 — reachable, auth required). Did not recur in 145-05, -06, -07 or -08.
**Source:** 145-04.1-SUMMARY.md

### `eslint --fix` on a new test file changes its blob hash after the RED half was measured
`simple-import-sort/imports` reordering meant the first RED log certified a red against bytes that were never committed.

**Context:** The whole suite was re-run to produce a second RED log from the exact committed bytes; the first was retained, not overwritten. This weakens a "byte-identical instrument" claim to an approximation if left unhandled.
**Source:** 145-04.1-SUMMARY.md

### A `beforeAll`-hoisted warm-up was needed because a cold parser load ate a per-test budget
`eslint-store-guard.test.ts`'s first `it` paid the ESLint flat-config + typescript-eslint parser cold start inside vitest's default 5000 ms budget: 5391 ms under the full 54-file suite, 651–1047 ms in isolation.

**Context:** The spec's verdict tracked machine load rather than the guard under test. Hoisted into a `beforeAll` with a 120 s hook timeout; no assertion, probe path, `ruleId` filter or case count changed. First `it` now 11 ms. The code review independently measured that the warm-up covers the `.svelte` parser too (first `.svelte` after warm-up: 41 ms).
**Source:** 145-08-SUMMARY.md, 145-REVIEW.md

### The Supabase CLI is not on the bare `PATH` in a non-login shell
Every invocation must go through `npx supabase` from `apps/supabase`, or the workspace `yarn db:*` scripts.

**Context:** Also observed: the CLI reports v2.83.0 with v2.115.0 available; deliberately not upgraded, since an unrequested toolchain bump mid-measurement invalidates the session.
**Source:** 145-01-SUMMARY.md, 145-03-SUMMARY.md

---

## Patterns

### Per-row blob-identity proof in the ledger
Each measured row cites `git hash-object` (or `git rev-parse HEAD:path`) of the file under test equalling the recording commit's blob, at *both* halves of a RED/GREEN pair.

**When to use:** Any before/after claim about a fix. "The instrument was unchanged" becomes a hash comparison rather than a recollection — independently reconfirmed by the phase verifier.
**Source:** 145-02-SUMMARY.md, 145-VERIFICATION.md

### Guard-of-the-guard for role-scoped assertions
An assertion whose value depends on a credential asserts that credential's identity first.

**When to use:** Any test that reads across a permission boundary (anon vs `service_role`, tenant scoping, RLS). Without it the guard passes for a mis-keyed credential and is green forever.
**Source:** 145-02-SUMMARY.md

### A comment correction after a measured commit lands as its own commit, never as an amend
`eab07013f` was cited by hash in three ledger rows; the rewording became `643891c6b`, and the suite was re-run there rather than argued from the earlier HEAD.

**When to use:** Any post-hoc edit to a commit whose hash appears in a record. Amending would leave the record naming a commit that no longer exists.
**Source:** 145-04-SUMMARY.md, 145-03-SUMMARY.md

### An injection's restore target is re-derived at the injection's own HEAD
The ledger's creation-time hash table is explicitly declared the WRONG target for any path a behaviour-changing commit has since modified; the correct blob is written into the injecting row *before* the file is touched.

**When to use:** Any transient injection later in a phase that has already changed the file. Closes threat T-145-20 — restoring against a stale creation-time hash silently reverts the fix.
**Source:** 145-05-SUMMARY.md, 145-07-SUMMARY.md

### Producer-side constraint reading
A generator that emits values for a declared domain reads the declaration rather than assuming a span.

**When to use:** Any synthetic data emitter facing a schema or template that declares bounds, enumerations, or selection counts. (Still open for `multipleChoiceCategorical` — see Surprises.)
**Source:** 145-04.1-SUMMARY.md

### Atomic rename across mixed positional and by-value consumers
Read every consumer in full first, classify each lookup, and commit the template and the by-value map (`ALLIANCE_MEMBERSHIP`) together.

**When to use:** Renaming identifiers that some consumers match positionally and others by value — so no intermediate tree exists in which, e.g., alliances seed with zero members.
**Source:** 145-06-SUMMARY.md

### Divergence documentation lives in the source file a future author will meet
`default.ts`'s own header carries a four-point `## external_id idiom` block explaining the deliberate divergence from `e2e/base`.

**When to use:** Any intentional inconsistency between two sibling artifacts. `.planning/` alone is not where the next author will look.
**Source:** 145-06-SUMMARY.md

### Derive every stated number ONCE, from the commit graph
Per-plan row tallies came from `git show <commit>:<file>` plus a row-scoped grep, not from plan summaries; § Final counts is the single derivation that requirements, roadmap and todos then cite.

**When to use:** Any multi-plan phase whose summaries each state running totals — reconstructing them from prose does not reconcile (it did not here).
**Source:** 145-08-SUMMARY.md

### A must-NOT-fire row is measured on both sides and compared as numbers
`A2-PRE` → `A2-POST` recorded 8 party cards → 8 party cards, so "it held" is an equality rather than an impression.

**When to use:** Every control that is supposed to stay unchanged across a fix.
**Source:** 145-05-SUMMARY.md

---

## Surprises

### Criterion 1's colour change straddles TWO fixes, not one
145-04's "the fix is one key" framing is true of the RLS defect only; 145-04.1's number-range emitter fix was equally load-bearing, because the voter app threw on render until it landed.

**Impact:** Recorded as a record correction in `A1-GREEN` and § Criterion 1 — writing it up as one key doing all the work would have handed 145-08 a false premise. It also produced an unplanned plan (145-04.1) mid-phase.
**Source:** 145-05-SUMMARY.md, 145-08-SUMMARY.md

### The synthetic emitter was drawing number answers outside the question's declared range
A latent defect surfaced only once candidates became anon-visible: the emitter drew 0–100 for a question declaring `{"min":0,"max":10}`, and `normalizeCoordinate` threw on render.

**Impact:** Blocked criterion 1's after half twice (two VOID Playwright logs, preserved by renaming rather than overwritten). Fixed producer-side; the live dataset now measures 327 answered, 0 outside `[0,10]`.
**Source:** 145-04.1-SUMMARY.md, 145-05-SUMMARY.md

### The same "emit what the declaration permits" contract is still broken for multi-choice
The code review measured 142 of 327 default-template candidates (43%) carrying a selection count outside the declared `minSelections: 2 / maxSelections: 3`.

**Impact:** Filed as a todo (WR-01) rather than fixed in-phase — the number case was the one blocking criterion 1. The defect class is confirmed to extend beyond the fixed branch.
**Source:** 145-REVIEW.md

### The shared journey fixture's first-constituency pick lands on Pirkanmaa (`con_05`), not Uudenmaa North
The probe docstring's claim was an inference from `default.ts`'s `sort_order`; the run showed `8 parties in constituency Pirkanmaa`.

**Impact:** Corrected to the measurement in a comment-only commit. It happens to be exactly D-08's nominated constituency, reached without steering — which is why the probe works at all.
**Source:** 145-03-SUMMARY.md

### The register's placeholder word appeared inside a real directory path
A cell citing a todo by its full path under `.planning/todos/pending/` made the ledger's own "no placeholder token in a filled row" check read 1 instead of 0.

**Impact:** The reference was spelled around (filename plus described directory) rather than the check weakened.
**Source:** 145-03-SUMMARY.md

### The rename does not strand rows — proven, not argued
Old idiom seeded, renamed idiom seeded over it with no reset (16 organizations / 10 constituencies, split 8+8 and 5+5), then `yarn db:seed:teardown` cleared both idioms completely.

**Impact:** The mechanism is the `seed_` prefix's invariance, which makes teardown's reach independent of the identifier idiom. D-05's durability concern discharged by measurement rather than by the plausible argument.
**Source:** 145-07-SUMMARY.md

### `con_01`–`con_05` collide with `ConstituenciesGenerator`'s synthetic id namespace
The new idiom contradicts the file's own stated convention, per the code review.

**Impact:** Filed as a standing todo (WR-04) rather than re-renamed — a second rename inside the same phase would outrun the strand proof that had just been taken.
**Source:** 145-REVIEW.md

### The standing todo the plan asked to create already existed
`2026-08-24-cold-results-navigation-crashes-dev-server.md` had been filed during context capture, already carrying the symptom, verbatim error, call site and reproduction.

**Impact:** Enriched in place with a D-07 standing-filing-of-record section rather than recreated. Separately, this is a real open defect (cold direct-URL results navigation crashes the dev server via `cookies.set`) that the phase's measured warm path never touches.
**Source:** 145-08-SUMMARY.md
