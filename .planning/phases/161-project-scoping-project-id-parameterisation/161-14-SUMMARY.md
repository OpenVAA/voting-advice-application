---
phase: 161-project-scoping-project-id-parameterisation
plan: 14
subsystem: testing
tags: [static-analysis, lint-gate, regex, optional-chaining, supabase, project-scoping]

# Dependency graph
requires:
  - phase: 161-project-scoping-project-id-parameterisation
    provides: "161-09's fixture-pair-plus-exact-count method and the three escape-hatch matchers; 161-12's schema-hop and Edge Function invocation checks plus the per-family non-vacuity floor; 161-13's boundary check, its outside fixture pair and the widened frontend walk"
provides:
  - "Six matcher declarations in scripts/assert-project-scoped-queries.mjs whose access operator is either of the two the language has, at every operator position each contains"
  - "A narrowed CLIENT_BINDING_RE that tells an optional-chained ACCESS apart from an aliased CLIENT without losing a nullish-coalesced alias"
  - "Twelve new committed fixture shapes across the four fixture files, including three negative controls (a bucket under the optional spelling in each corpus, an optional member read reaching no table, an adapter-surface call reached optionally)"
  - "Four raised exact self-test site counts and six exact per-shape message counts, so the closure is observable in the wired `yarn assert:project-scoped-queries` spelling"
  - "An independent behavioural derivation of the whole closure in packages/dev-seed/tests/projectScopingGate.test.ts, via a flagless regexDeclarationOf() slicer"
affects: [phase-162-grants-matrix, any-future-guard-widening, 161-verification-close]

actuals:
  tokens: 29985
  tasks: 3
  commits: 5
  plan_head_before: 77794b7b9652d69c62e1a7aca6cb7342119b9fb5

tech-stack:
  added: []
  patterns:
    - "An access OPERATOR is a closed set of two source tokens, so reading both is not the open-ended receiver widening the guard's own docblocks argue against"
    - "Where two committed shapes share one message text, pin them by an EXACT count rather than by `some(...)` — a `some(...)` cannot tell a doubled shape from a single one"
    - "A matcher repaired by NARROWING needs a committed shape proving what it still catches, not only one proving what it stopped catching"

key-files:
  created: []
  modified:
    - scripts/assert-project-scoped-queries.mjs
    - scripts/fixtures/project-scoped-queries/violation.fixture.ts
    - scripts/fixtures/project-scoped-queries/clean.fixture.ts
    - scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts
    - scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts
    - packages/dev-seed/tests/projectScopingGate.test.ts

key-decisions:
  - "CLIENT_BINDING_RE's trailing lookahead was repaired with an ALTERNATION excluding `?.` specifically, not with a bare `?` added to its character class. The character-class spelling also excludes `??` and silently stops reporting a genuine nullish-coalesced alias — reproduced live before the repair (alias count read 3, then 1 under the naive form, and 2 only under the alternation)."
  - "COMPUTED_ACCESS_RE uses an OPTIONAL GROUP holding the whole `?.` punctuator rather than an optional `?`. 161-REVIEW.md's own suggested form was measured wrong in both directions: it returns false on `this.supabase?.['from']('x')` (the optional spelling puts a dot between the `?` and the `[`) and newly matches a ternary `supabase ? ['a'] : b`."
  - "The two operator positions that 161-REVIEW.md left un-widened — the `this`-to-`supabase` operator in ACCESS_RE and SCHEMA_HOP_RE — were widened too, so `this?.supabase.from(…)` is not a remaining blind spot."
  - "The check-9 docblock's stated ONE RESIDUAL (a client rebound to an unrelated local outside the adapter directory) was left standing and unwidened. This change does not close it, and quietly widening the paragraph would overstate the guard's reach."
  - "No E2E run. No file under `apps/` was touched — the changed set is `scripts/**` plus one repo-meta unit test — so the phase's closing full-suite run at `tests/e2e-runs/161-13-close` still stands. The cardinal rule is not waived; there is nothing here that could move it."

patterns-established:
  - "Three-point matcher measurement: the optional spelling matches, the plain-dot control matches, and a stated near miss does not. Two points alone would be satisfied by a matcher that matched everything."
  - "A regex declaration sliced out of guard source into a FLAGLESS RegExp, so `.test` stays stateless and no assertion can be perturbed by the one before it; the slicer throws by name when the constant is absent, because an assertion over a regular expression that silently failed to be found is a pass from an instrument pointed at nothing."

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: "A project-scoped table or rpc reached through `?.` inside the adapter directory is a named, counted check-1/check-4 violation rather than an uncounted site"
    requirement: "PRESHIP-01"
    verification:
      - kind: other
        ref: "node scripts/assert-project-scoped-queries.mjs --self-test (violation fixture: 15 sites; check-1 message for 'candidates'; check-4 message for 'also_not_declared_anywhere')"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#reads the optional operator in ACCESS_RE, still reads the plain one, and leaves its near miss alone"
        status: pass
    human_judgment: false
  - id: D2
    description: "An optional-chained access on the right of a binding is reported ONCE, as an access, and a nullish-coalesced alias is still reported as an alias"
    requirement: "PRESHIP-01"
    verification:
      - kind: other
        ref: "node scripts/assert-project-scoped-queries.mjs --self-test (`aliases the raw client` exactly 2, `destructures the raw client` exactly 1)"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#tells an aliased client apart from an optional-chained access in CLIENT_BINDING_RE"
        status: pass
    human_judgment: false
  - id: D3
    description: "The three secondary adapter-side routes to a table — computed member, schema hop, Edge Function invocation — each read the optional operator at every position they contain"
    requirement: "PRESHIP-01"
    verification:
      - kind: other
        ref: "node scripts/assert-project-scoped-queries.mjs --self-test (`computed member access` exactly 2, `reaches a table through a schema call` exactly 2, check-7 message for 'also_not_dispositioned_anywhere')"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#reads the optional operator in SCHEMA_HOP_RE / COMPUTED_ACCESS_RE / INVOKE_RE, still reads the plain one, and leaves its near miss alone"
        status: pass
    human_judgment: false
  - id: D4
    description: "The boundary rule reads both access operators, proven in both directions by its own fixture pair"
    requirement: "PRESHIP-01"
    verification:
      - kind: other
        ref: "node scripts/assert-project-scoped-queries.mjs --self-test (outside violation 4 sites; boundary `from(` exactly 2, boundary `rpc(` exactly 2; outside clean 2 sites, zero violation lines)"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#reads the optional operator in BOUNDARY_ACCESS_RE, still reads the plain one, and leaves its near miss alone"
        status: pass
    human_judgment: false
  - id: D5
    description: "The guard is no less narrow than before: all four clean fixtures produce zero violation lines, both bucket exclusions hold under the optional spelling, and a call reaching no table is left alone"
    requirement: "PRESHIP-01"
    verification:
      - kind: other
        ref: "node scripts/assert-project-scoped-queries.mjs --self-test (0 violation lines in both clean fixtures; violation fixture holds at 15 with two bucket accesses excluded)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The live tree's numbers are unchanged by the widening, and both pre-existing vacuity probes still fire"
    requirement: "PRESHIP-01"
    verification:
      - kind: other
        ref: "node scripts/assert-project-scoped-queries.mjs (5 / 2 / 7 / 550 / 1 / 0 — identical to the pre-change run); yarn lint:check exit 0"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#exits non-zero when the access matcher has stopped matching"
        status: pass
    human_judgment: false

# Metrics
duration: 21 min
completed: 2026-09-06
status: complete
---

# Phase 161 Plan 14: The Optional-Chaining Gap Closure Summary

**Every matcher in the project-scoped query guard now reads both member-access operators the language has, at every operator position it contains — closing the seventh and last-named blind spot of the class this phase has closed six times before, measured by twelve new fixture shapes, four raised exact site counts, six exact per-shape message counts and an independent derivation from outside the guard.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-09-06T17:15:00Z
- **Completed:** 2026-09-06T17:36:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- `this.supabase?.from('elections')` and `locals.supabase?.rpc(…)` are now NAMED violations rather than uncounted sites. Before this plan they matched none of the six matcher families, so the per-family non-vacuity floor introduced by 161-12 could not see the family go silent either — the precise failure mode that floor exists to prevent, reproduced in a spelling nobody had enumerated.
- The binding rule was repaired by NARROWING without opening a second hole. It had been mis-classifying: `const b = this.supabase?.from('candidates')` and `const u = this.supabase?.restUrl` were both reported as `aliases the raw client`, a false statement about each that also put an access into the escape-hatch tally. The naive repair fixes that and silently stops reporting `const db = this.supabase ?? other`, a genuine alias. The alternation form holds all three cases, and the exact alias/destructure count pair is what proves which of the three candidate lookaheads is in the file.
- Three of the plan's shapes are NEGATIVE controls rather than violations: a storage bucket reached optionally in each corpus (the control for the access matchers' capturing chain group, which is what drops a bucket structurally), an optional member read reaching no table, and an adapter-surface call reached optionally. They are what make "the guard is no less narrow than before" a measurement.
- The closure is derived TWICE. The guard's own self-test proves it through fixtures and exact counts; the gate spec proves it again by reading each matcher declaration out of the guard as text, rebuilding it flagless, and measuring it at three points. Deleting either derivation leaves the invariant asserted by the other.
- `161-VERIFICATION.md`'s sole remaining criterion-2 `missing:` item is answered on disk. Its own wording asked for the operator to be made optional in four named matchers "and INVOKE_RE for consistency"; all six were widened, including the two `this`-to-`supabase` positions the review's suggested patch left blind.

## Task Commits

Each task was committed atomically:

1. **Task 1 (tracer): An optional-chained access is a counted access, never a mistaken alias** — `bf0e343db` (fix)
2. **Task 2: The three remaining adapter-side matchers read the optional operator** — `9da4883b4` (fix)
3. **Task 3: The boundary sees it too, and the closure is derived a second time** — `463d72087` (fix)

## The six changed matcher declarations, verbatim

Sliced out of the guard at the final HEAD by the same helper the gate spec uses:

```
ACCESS_RE            this\s*\??\.\s*#?supabase((?:\s*\??\.\s*[A-Za-z_$][\w$]*)*?)\s*\??\.\s*(from|rpc)\s*\(
SCHEMA_HOP_RE        this\s*\??\.\s*#?supabase(?:\s*\??\.\s*[A-Za-z_$][\w$]*)*\s*\??\.\s*schema\s*\(
BOUNDARY_ACCESS_RE   (?<![\w$])[\w$]*[Ss]upabase[\w$]*((?:\s*\??\.\s*[A-Za-z_$][\w$]*)*?)\s*\??\.\s*(from|rpc)\s*\(
COMPUTED_ACCESS_RE   \bsupabase\s*(?:\?\.\s*)?\[
INVOKE_RE            \??\.\s*functions\s*\??\.\s*invoke\s*\(
CLIENT_BINDING_RE    (?<![=!<>])=\s*(?:await\s+)?this\s*\??\.\s*#?supabase\b(?!\s*(?:\?\.|[.[(]))
```

Every chain capture group stayed CAPTURING. `collectAccesses` and `checkBoundary` both read it to drop buckets structurally, so turning one non-capturing would make every bucket read as a table — which is what the two bucket controls in the violation fixtures exist to catch.

## The final self-test numbers, as the guard printed them

```
self-test flagged 15 line(s) in violation.fixture.ts (15 access(es))
             and  0 line(s) in clean.fixture.ts (6 access(es))
        plus     4 line(s) in outside-boundary.violation.fixture.ts (4 site(s))
             and  0 line(s) in outside-boundary.clean.fixture.ts (2 site(s)),
matching the committed expectation.
```

Site-count arithmetic, now enumerated in the committed comment above the expectations:

| Fixture | Was | Now | Composition |
|---|---|---|---|
| `violation.fixture.ts` | 9 | **15** | 5 accesses + 5 escape hatches + 3 invocations + 2 schema hops (2 bucket accesses excluded) |
| `clean.fixture.ts` | 4 | **6** | 2 dispositioned rpcs + 4 invocations (1 bucket access excluded) |
| `outside-boundary.violation.fixture.ts` | 2 | **4** | a table read and an rpc call in each of the two operator spellings |
| `outside-boundary.clean.fixture.ts` | 1 | **2** | 2 dispositioned invocations, one per spelling (2 buckets and an adapter-surface call excluded) |

The six exact per-shape message counts, all asserted rather than observed:

| Message | Count | Why exact rather than `some(...)` |
|---|---|---|
| `aliases the raw client` | **2** | With the destructure count, a three-way discriminator on the binding lookahead: 3/1 unrepaired, 1/1 under the naive repair, 2/1 only when correct |
| `destructures the raw client` | **1** | (the other half of that discriminator) |
| `computed member access` | **2** | The message names neither member nor table, so only the number says the optional spelling is reached |
| `reaches a table through a schema call` | **2** | Same reason — the message names neither schema nor table |
| `` `from(` on a Supabase client outside `` | **2** | A `some(...)` cannot tell a doubled shape from a single one, and the optional spelling is now among them |
| `` `rpc(` on a Supabase client outside `` | **2** | (same) |

## The live corpus, before and after

Identical, which is the point — the guard gained reach without changing what the real tree reports, so `yarn lint:check` stays green for the same reason it was green before rather than for a new one.

| Number | Before (HEAD 77794b7b9) | After (HEAD 463d72087) |
|---|---|---|
| guarded sources / deferred / adapter sources on disk | 5 / 0 / 5 | 5 / 0 / 5 |
| raw client call(s) examined | 5 | **5** |
| Edge Function invocation(s) | 2 | **2** |
| client-touching site(s) in all | 7 | **7** |
| source(s) outside the adapter directory walked | 550 | **550** |
| outside site(s) examined | 1 | **1** |
| violation(s) | 0 | **0** |

## Gate results, each status read directly rather than through a pipe

| Command | Exit | Note |
|---|---|---|
| `node scripts/assert-project-scoped-queries.mjs` | **0** | `0 violation(s)`; live numbers above; self-test half 15/0/4/0 |
| `node scripts/assert-project-scoped-queries.mjs --self-test` | **0** | no `self-test expectation failed` line |
| `yarn test:unit` | **0** | 25/25 turbo tasks; `projectScopingGate.test.ts` 14 → **20** tests; frontend 91 files / 1630 tests, dev-seed 60 files / 669 tests |
| `yarn lint:check` | **0** | the wired `yarn assert:project-scoped-queries` link prints the new summary line |
| `npx prettier --check` (guard, fixture dir, gate spec) | **0** | fixture dir is `.prettierignore`d; the guard and the gate spec are checked |

No `.vacuity-probe-*` or `.boundary-vacuity-probe-*` file was left under `scripts/` after any run.

## Measured RED before each GREEN

The plan required the closure to be measured rather than asserted, so every expectation was seen failing before the matcher that satisfies it was touched. Recorded here because an expectation that has never been seen red has not been shown to test anything.

- **Task 1 RED** — violation fixture yielded 11 (expected 12); the two optional-chained pins absent; `aliases the raw client` read **3**, the exact reading predicted for an untouched lookahead; the clean fixture produced one violation, its optional member read mis-reported as an alias.
- **Task 2 RED** — violation 12 (expected 15), clean 5 (expected 6); `computed member access` 1, `reaches a table through a schema call` 1, and the check-7 pin for `also_not_dispositioned_anywhere` absent.
- **Task 3 RED** — outside violation 2 (expected 4), boundary `from(` 1 and boundary `rpc(` 1. The outside clean fixture already read 2 at this point, because `INVOKE_RE` had been widened in task 2 — the expected composition, not a surprise.

## Edge measurements taken beyond the committed assertions

- **(encoding)** All five widened access matchers were measured against whitespace on either side of the punctuator, across a line break, and with whitespace INSIDE it: 14/14 as specified — the optional spelling matches with surrounding whitespace and across a newline, and `this.supabase ? . from(` matches nothing. `\??\.` and `(?:\?\.\s*)?` both admit no whitespace between the two characters.
- **(encoding, comments)** Comment-span exclusion still holds under the widened matchers, evidenced structurally rather than by a separate probe: the new fixture docstrings quote optional-chained shapes in prose, and the site counts are exactly the code-only arithmetic. A broken exclusion would push every count up.
- **(adjacency)** Each fixture pair differing only in the access operator receives the same disposition — same check, same message text, same tally family. That is what the six exact per-shape counts encode.
- **(near miss)** `COMPUTED_ACCESS_RE` was measured false on `const x = supabase ? ['a'] : b;` and true on both computed spellings; `BOUNDARY_ACCESS_RE` false on `supabaseAdapter?.getElections()` and `Array.from(rows)`; `SCHEMA_HOP_RE` false on a plain optional-chained table access; `INVOKE_RE` false on `this.supabase?.functions.list()`. All are committed as assertions in the gate spec, not merely run once.

## Files Created/Modified

- `scripts/assert-project-scoped-queries.mjs` — six matcher declarations widened (one of them narrowed at its lookahead); `countIn` helper added inside `selfTest`; four exact site counts raised; six exact per-shape message counts and two `some(...)` literal pins added; module docblock reach paragraph, check-6 paragraph, check-8 docblock, check-9 docblock and three matcher docstrings updated.
- `scripts/fixtures/project-scoped-queries/violation.fixture.ts` — a module-level `fallbackClient` constant and seven methods: an optional-chained `candidates` read bound to a local, an optional-chained `also_not_declared_anywhere` rpc, a nullish-coalesced client binding, an optional-chained computed member on `questions`, an optional-chained schema hop, an optional-chained undispositioned invocation of `also_not_dispositioned_anywhere`, and an optional-chained bucket upload documented as not reported.
- `scripts/fixtures/project-scoped-queries/clean.fixture.ts` — an optional-chained `get_questions` carrying `p_project_id`, an optional-chained dispositioned Edge Function invocation, an optional-chained member read reaching no table, and a `restUrl` member on the locally declared client type to back it.
- `scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts` — an optional-chained table read and an optional-chained rpc call on the request-scoped client.
- `scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts` — an optional-chained bucket upload, an optional-chained dispositioned invocation (not reported but EXAMINED), and an optional-chained call through the adapter's public surface.
- `packages/dev-seed/tests/projectScopingGate.test.ts` — `regexDeclarationOf()` slicer; a `describe` block measuring five access matchers at three points each plus `CLIENT_BINDING_RE`'s three-way discrimination; `ACCESS_RE_DECL` moved byte-for-byte with the guard's declaration so the vacuity probe still mutates the real matcher.

## Decisions Made

Recorded in `key-decisions` above. The two that carry the most weight:

1. **The binding repair is an alternation, not a character class.** This is the plan's own prohibition ("do not close one hole by opening another") made concrete. The three candidate lookaheads were measured against all five relevant inputs before one was chosen, and the exact alias/destructure count pair is committed precisely so the choice cannot silently regress to either wrong candidate.
2. **The review's suggested patch was deliberately not followed verbatim.** `161-REVIEW.md` proposed a computed-access pattern that does not match the shape it names and newly matches a ternary, and left two operator positions un-widened. The forms that landed were measured true on all six target shapes and false on both near misses. Recording this so the divergence reads as a correction rather than as drift.

## Deviations from Plan

None — plan executed exactly as written. No deviation rule was invoked; no auto-fix was required.

## Issues Encountered

- **One transient unit-test failure, not attributable to this plan.** The first full `yarn workspace @openvaa/dev-seed test:unit` of the run showed `tests/ensureProject.test.ts > reuses the default account instead of creating one` failing with `ensureProject: failed to upsert the projects row: An invalid response was received from the upstream server` — a 502 from the local PostgREST while the default-template integration test was seeding concurrently. It passed in isolation immediately afterwards, and passed in two subsequent full runs of that suite and in the closing `yarn test:unit` (25/25 tasks, 669 + 1630 tests). Nothing in this plan is imported at runtime by `@openvaa/dev-seed`'s source; the only file touched under `packages/` is the repo-meta gate spec, which reads `scripts/` as text. Logged to `deferred-items.md` under "Out of scope, found during 161-14" rather than chased here.
- **`.planning/WINDOWS.md` still refuses appends.** `gsd-tools windows append` reports that the rendered table disagrees with the fenced JSON entries that are its source of truth — the same pre-existing inconsistency already recorded in this phase's `deferred-items.md` during 161-12. Ledger population is documented as best-effort and non-blocking, so the deferred item above is recorded in `deferred-items.md` instead and is not lost.

## Known Stubs

None. No hardcoded empty value, placeholder string, TODO, FIXME or skipped test was introduced, and every `<verify>` command in all three tasks was run to completion with its exit status read directly.

## Threat Flags

None. No file this plan touches reaches the running application: the guard and its four fixtures are lint-time source read as text and never imported, built or executed, and the one file under `packages/` is a repo-meta unit test. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary was introduced. The plan's own `<threat_model>` mitigations were all delivered — T-161-14-01 and T-161-14-02 by task 1's `ACCESS_RE` widening and task 3's `BOUNDARY_ACCESS_RE` widening, T-161-14-03 by task 2's three matchers, T-161-14-04 by moving `ACCESS_RE_DECL` with the declaration and re-running both vacuity probes, and T-161-14-05 by the alternation plus the exact alias count of 2.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **`161-VERIFICATION.md` criterion 2 should now re-verify as ACHIEVED.** Its `missing:` list held exactly one item and it is answered on disk, not in prose: the operator is optional in all six matchers (the four named plus `INVOKE_RE` plus `CLIENT_BINDING_RE`), each with a committed fixture shape the guard catches and an exact count that moved. A re-verification should re-derive the numbers rather than trust this summary, and should note that the `missing:` list itself needs amending rather than only appending — per the standing "re-verification must amend the missing list" rule.
- **One bookkeeping item for phase close, deliberately not done here.** `.planning/REQUIREMENTS.md:167` shows `[x]` for PRESHIP-01 while `161-VERIFICATION.md` grades it NOT FULLY SATISFIED. That checkbox was stale in the verification's own words; flipping or confirming it is a phase-close decision, and the plan's `<verification>` explicitly scoped it out of every task.
- **One residual carried forward, unchanged and unwidened.** Check 9's docblock still states it: a client rebound to an unrelated local outside the adapter directory (`const db = locals.supabase`) is not seen out here. That is the shape check 6 forbids outright inside the adapter directory, and it is not forbidden outside only because a prohibition needs a corpus somebody has read end to end.
- **Phase 162's deferred item is untouched:** `send-email` accepting any admin role without comparing `scope_id` to the project remains open and assigned there.

## Self-Check: PASSED

- All six modified files exist on disk (no files were created by this plan).
- All three task commits exist in `git log`: `bf0e343db`, `9da4883b4`, `463d72087`.
- `git rev-list --count 77794b7b9652d69c62e1a7aca6cb7342119b9fb5..HEAD` measured **3** task commits at SUMMARY-write time and **5** in total once the two docs commits landed. `actuals.commits` records the measured total of 5 with its `plan_head_before` base, so `/gsd-verify-work` can re-measure with the same instrument; the three task commits are the ones listed under "Task Commits" above.
- Every `<acceptance_criteria>` item from all three tasks was re-run and passes; the plan-level `<verification>` list was run in full with each status read directly.

---
*Phase: 161-project-scoping-project-id-parameterisation*
*Completed: 2026-09-06*
