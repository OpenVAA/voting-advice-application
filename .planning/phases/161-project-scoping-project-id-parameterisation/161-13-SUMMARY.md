---
phase: 161-project-scoping-project-id-parameterisation
plan: 13
subsystem: tooling
tags: [static-analysis, lint-gate, sveltekit-routes, edge-functions, supabase, multi-tenant, project-scoping, playwright, e2e]

requires:
  - phase: 161-project-scoping-project-id-parameterisation
    provides: "check 7's name-anchored `INVOKE_RE` and the `identity-callback` disposition, which is what lets the third live invocation be read correctly the moment its file enters the corpus rather than needing a second matcher"
  - phase: 161-project-scoping-project-id-parameterisation
    provides: "migration 00008, whose changed function signature is the reason this phase's closing E2E run resets the database instead of running against hand-applied state"
provides:
  - "check 9 — a table or rpc reached on a Supabase client anywhere under the frontend source tree outside the adapter directory is a named violation"
  - "`enumerateFrontendSourcesOutsideAdapter()`, a 550-file corpus that fails closed when the walk throws or finds nothing"
  - "a written, checked statement of the guard's reach in its own module docblock, so `all project-scoped table and rpc access lives under the adapter directory` is an assertion rather than a comment"
  - "the outside-boundary fixture pair, proving the rule both fires and stays narrow"
  - "a second committed vacuity reproduction, this one for a walker that has stopped walking rather than a matcher that has stopped matching"
  - "the phase's closing full-suite E2E run: 155/0/0/0, exit 0, preflight 1/0, with the database rebuilt from the migration set"
affects: [162 scope-aware authorization, e2e-harness, frontend route handlers]

actuals:
  tokens: 22136
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A boundary rule stated where it is enforced: the sentence a guard's reach depends on is written into the guard and checked by it, because a statement without a check is a comment and a widening without a statement leaves the reader guessing what is now claimed"
    - "A floor on the ENUMERATION rather than on the sites, for a corpus whose correct site count is zero. A site floor would assert the opposite of what the boundary says and would redden a correct tree"
    - "Separate fixture pairs per corpus, because the same call can be legitimate at one address and a violation at another; sharing one pair would force one of the two meanings to give way"

key-files:
  created:
    - scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts
    - scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts
  modified:
    - scripts/assert-project-scoped-queries.mjs
    - packages/dev-seed/tests/projectScopingGate.test.ts

key-decisions:
  - "DR-38 honoured in both halves: the invocation check was WIDENED outright (a corpus change only, since it is anchored on the function name) while the table and rpc checks got a STATEMENT instead, because checks 1 to 4 answer a bare access with `use the scoped helper` and a route handler has no such helper — that advice would be advice the file cannot take"
  - "DR-39 honoured: the widened corpus's floor sits on the enumeration. Measured: the correct number of outside table accesses is zero and the only outside site at all is one Edge Function invocation whose removal would be a good change, so a floor on sites would fail a correct tree"
  - "DR-40 honoured: a separate committed pair under the same fixture directory, because the adapter clean fixture's dispositioned rpc call is legitimate inside the adapter and a boundary violation outside it"
  - "DR-41 honoured: the closing run omitted `--no-db-reset`, so the suite exercised a database built from the migration set including 00008 rather than one carrying hand-applied state"
  - "The boundary matcher's residual is written into the guard rather than left for the next reader: it reads the client by its conventional name, so a client rebound to an unrelated local outside the adapter is not seen. That is the shape check 6 forbids outright inside the adapter, and it is not forbidden here only because a prohibition needs a corpus somebody has read end to end"

patterns-established:
  - "Comment family per file rather than per guard: a corpus containing `.svelte` sources is read through the shared classifier's own extension map, so prose inside an HTML comment is not taken for live code"
  - "Two vacuity reproductions, one per failure mode: a matcher that stopped matching (`ACCESS_RE`) and a walker that stopped walking (the outside enumeration). The second is the one a large corpus needs, because a shorter list still looks like a list"

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: "A project-scoped table or rpc access anywhere in the frontend source tree outside the adapter directory is a named violation"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "scripts/assert-project-scoped-queries.mjs --self-test#outside-boundary.violation.fixture.ts produced the check-9 boundary violation for a table read"
        status: pass
      - kind: unit
        ref: "scripts/assert-project-scoped-queries.mjs --self-test#outside-boundary.violation.fixture.ts produced the check-9 boundary violation for an rpc call"
        status: pass
      - kind: command
        ref: "node scripts/assert-project-scoped-queries.mjs (550 outside source(s) walked, 0 violation(s), exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The rule is narrow as well as present: a storage bucket, an adapter-surface call and a non-client `from(` outside the adapter directory are all left alone"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "scripts/assert-project-scoped-queries.mjs --self-test#outside-boundary.clean.fixture.ts produced 0 violation(s) and yielded exactly 1 site (the bucket access must be excluded)"
        status: pass
      - kind: command
        ref: "yarn lint:check (23/23 turbo tasks, 0 [ERROR] lines across every assert gate)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The third live Edge Function invocation — in a route handler, reached through `locals.supabase` — is examined and held to its written deployment-scoped disposition"
    requirement: PRESHIP-01
    verification:
      - kind: command
        ref: "node scripts/assert-project-scoped-queries.mjs summary line reports `1 outside site(s) examined` with 0 violations, and the corpus contains apps/frontend/src/routes/api/candidate/preregister/+server.ts"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#walks a non-empty frontend corpus that excludes the adapter directory"
        status: pass
    human_judgment: false
  - id: D4
    description: "The widened corpus cannot go vacuous: an enumeration that throws or yields nothing is a failure rather than a clean bill"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#exits non-zero when the walk outside the adapter directory finds nothing"
        status: pass
      - kind: command
        ref: "a copy of the guard whose outside walker throws exits 1 naming the enumeration failure; a copy returning [] exits 1 naming the empty walk"
        status: pass
    human_judgment: false
  - id: D5
    description: "The full E2E suite is green at the phase's closing HEAD, taken through the wrapper with the database rebuilt from the migration set"
    requirement: PRESHIP-01
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/161-13-close: exit 0, observed_expected=155, observed_unexpected=0, observed_flaky=0, observed_skipped=0, preflight 1/0, db_reset=true, head=9215476ea"
        status: pass
    human_judgment: false
  - id: D6
    description: "The sentence the boundary asserts — all project-scoped table and rpc access lives under the adapter directory — is true of the codebase and not merely true under this matcher"
    requirement: PRESHIP-01
    verification:
      - kind: other
        ref: "a repository-wide read of every table/rpc call shape in apps/frontend/src outside the adapter directory, on any receiver, before the rule was written: zero hits"
        status: pass
    human_judgment: true
    rationale: "The check proves zero violations under its own matcher, and the matcher reads the client by its conventional name. A client rebound to an unrelated local (`const db = locals.supabase`) is outside its reach, so the sentence's truth rests partly on a read of the tree rather than wholly on the rule. The residual is written into the guard's own docblock rather than left implicit, but confirming it stays true is a reading, not a run."

duration: 30 min
completed: 2026-09-05
status: complete
---

# Phase 161 Plan 13: The Guard's Reach Beyond the Adapter Directory Summary

**The project-scoped query guard now walks the 550 frontend sources outside the adapter directory and asserts, as check 9, the sentence its own reach depends on — so a table or rpc reached from a route handler is a named violation instead of being outside every check by construction, and the one live Edge Function invocation already out there is examined rather than invisible.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-09-05T19:05:00Z
- **Completed:** 2026-09-05T19:35:00Z
- **Tasks:** 3
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- **Check 9, the boundary.** `BOUNDARY_ACCESS_RE` and `checkBoundary` report a table or rpc reached on a Supabase client anywhere under `apps/frontend/src` that is not under the adapter directory, naming the file, the line and the boundary in full. The receiver is deliberately wider than `ACCESS_RE`'s, because out here the client is a request-scoped object handed to a route (`locals.supabase`) rather than a field of a class.
- **A statement AND a widening, split by what each rule can honestly claim.** The invocation check was widened outright — a corpus change only, since 161-12 anchored it on the function name. The table and rpc checks got the boundary statement instead: checks 1 to 4 answer a bare access with "use the scoped helper", and a route handler has none, so that message would be advice the file cannot take.
- **A floor on the enumeration.** The widened walk fails closed when it throws and when it yields no files, in the voice of the adapter corpus's own empty-list failure. No floor was put on outside call sites, because the correct number of those is zero and a floor there would redden a correct tree.
- **The third live invocation, examined.** `apps/frontend/src/routes/api/candidate/preregister/+server.ts:16` invokes `identity-callback` through `locals.supabase`. It is now one of the guard's examined sites and is held to the deployment-scoped disposition 161-12 wrote for that function.
- **Two more committed fixtures and a second vacuity reproduction.** The boundary rule has a violating fixture it catches and a clean one it does not, both exercised in the ordinary `lint:check` invocation; and the gate spec now breaks the outside walker on purpose, which is the failure mode a 550-file corpus actually has.
- **The phase's closing full-suite E2E run, green.** 155 expected, 0 unexpected, 0 flaky, 0 skipped, exit 0, preflight 1 success / 0 failures, against a database rebuilt from the migration set.

## Task Commits

1. **Task 1 (tracer, TDD): the boundary and the widened corpus**
   - RED — `27ce316e9` (`test`): the fixture pair and its self-test expectations, wired through a `checkOutsideSource` that ran only the invocation check. Three expectations failed: the violating fixture yielded 0 sites where 2 were expected, and neither boundary message appeared.
   - GREEN — `6785dec12` (`feat`): `FRONTEND_SRC_DIR`, `enumerateFrontendSourcesOutsideAdapter()`, `BOUNDARY_ACCESS_RE`, `checkBoundary`, the `main` integration with its enumeration floor, the extended summary line and the docblock's reach statement.
   - No REFACTOR commit was needed; the GREEN implementation is the shipped shape.
2. **Task 2: the widened corpus derived independently of the guard** — `9215476ea` (`test`)
3. **Task 3: the closing full-suite E2E run** — no commit. `tests/e2e-runs/` is gitignored, so the run produces no tracked artefact; its evidence is the transcription below, following the convention `161-07-SUMMARY.md` established and `161-09-SUMMARY.md` repeated.

## Files Created/Modified

- `scripts/assert-project-scoped-queries.mjs` — check 9 and its matcher, the widened walker and its enumeration floor, the outside-corpus loop in `main`, the extended summary line, a per-file comment family, and the reach statement in the module docblock. The check count in the docblock moved from EIGHT to NINE.
- `scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts` — a table read and an rpc call on a Supabase receiver in a route-shaped module. The rpc call deliberately passes the project key its disposition requires, because the boundary is about where the call lives.
- `scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts` — four near misses the rule must leave alone: a storage bucket, the adapter's public surface on a receiver that names Supabase, a `from(` whose receiver is not a client at all, and the deployment-scoped invocation the live route makes.
- `packages/dev-seed/tests/projectScopingGate.test.ts` — `frontendSourcesOutsideAdapterOnDisk()`, the corpus assertions, the declared-and-read assertions for the matcher and the walker, and the widened-corpus vacuity probe.

## The guard's summary line, transcribed verbatim

```
Project-scoped query guard — 5 guarded source(s), 0 deferred, 5 adapter source(s) on disk, 5 raw client call(s) examined, 2 Edge Function invocation(s), 7 client-touching site(s) in all, 550 source(s) outside the adapter directory walked, 1 outside site(s) examined, 0 violation(s); self-test flagged 9 line(s) in scripts/fixtures/project-scoped-queries/violation.fixture.ts (9 access(es)) and 0 in scripts/fixtures/project-scoped-queries/clean.fixture.ts (4 access(es)), plus 2 line(s) in scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts (2 site(s)) and 0 in scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts (1 site(s)), matching the committed expectation.
```

Every count in the new expectations was re-derived by running the guard and reading the number it printed. None was guessed and then made to match.

## The closing E2E run, transcribed

Wrapper: `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/161-13-close`, invoked WITHOUT `--no-db-reset` per DR-41 — this phase's migration `00008` alters a granted function's signature, so the suite ran against a database built from the migration set rather than one carrying hand-applied state.

| Field | Value |
|---|---|
| wrapper exit | `0` (read from the command, never through a pipe) |
| `observed_expected` | 155 |
| `observed_unexpected` | 0 |
| `observed_flaky` | 0 |
| `observed_skipped` | 0 |
| preflight successes | 1 |
| preflight failures | 0 |
| `db_reset` | `true` |
| `observed_workers` / `observed_retries` | 6 / 0 |
| `observed_duration_ms` | 631695 |
| run HEAD | `9215476ea` — the plan's closing HEAD, with only the pre-existing untracked `.planning/milestone.lock` dirty |
| started / ended | `2026-09-05T19:19:09Z` / `2026-09-05T19:30:19Z` |

No test was skipped, retried until green, or annotated as flaky, and none failed to run. The artefacts under `tests/e2e-runs/` are gitignored (`.gitignore:50`), so **this transcription is the surviving tracked evidence of the run** — the same caveat the previous closing run carried. Nothing under `tests/e2e-runs/` from a previous run was deleted; the directory still holds every prior run's evidence beside this one.

`yarn lint:check` and `yarn test:unit` were both re-run at that same HEAD and both exited 0 — 23/23 and 25/25 turbo tasks, with zero `[ERROR]` lines across all fifteen assert gates. Each exit code was read from the command itself.

## The phase-level close: which plan discharged which gap

`161-VERIFICATION.md` graded criterion 2 PARTIALLY ACHIEVED on two recorded gaps. Both are now discharged, and each by a measurement rather than an assertion.

| Gap in `161-VERIFICATION.md` | Plan | What discharged it, and by which measurement |
|---|---|---|
| **CR-01** — "Every query that is project-scoped is parameterised by it": `identity-callback`'s existing-candidate lookup queried `candidates` with no project term and discarded the error | **161-10** | The lookup was extracted to a vitest-reachable module, scoped with `project_id` and made to throw on a failed read. Measured by a committed spec that reddens if either the project filter or the error check is reverted, plus a text-level pin holding the entry point on the extracted helper |
| _(the same criterion, a second unparameterised surface found alongside it)_ | **161-11** | `resolve_email_variables` took a required, undefaulted `p_project_id` qualifying all four of its entity lookups; migration `00008` dropped the three-argument form and re-issued both grants. Measured by three pgTAP assertions pinning the cross-project boundary and one pinning that the parameter is genuinely required |
| **CR-02** — "A query missing the parameter is caught by a guard rather than by a reviewer", part one: `.functions.invoke(…)` and `.schema(…).from(…)` were invisible to every check, with two live invocation sites in the adapter | **161-12** | Check 7 holds every invocation to a written disposition in `PROJECT_SCOPED_EDGE_FUNCTIONS`; check 8 forbids the schema hop outright. Measured by fixture expectations in both directions, the fixture site counts moving 6→9 and 1→4, and a per-family non-vacuity floor that caught the pooled floor going silent |
| **CR-02**, part two: `enumerateAdapterSources()` walks only `ADAPTER_DIR`, "so a query issued from anywhere else in the frontend is invisible to every check by construction". The recorded `missing:` asks for "either widening enumeration beyond ADAPTER_DIR **or** a written, checked statement of that boundary" | **161-13** (this plan) | Both, because on their own each is half an answer. The invocation check was widened over a 550-file corpus and the boundary was written into the guard as check 9 and enforced. Measured by the guard's summary line (`550 source(s) outside the adapter directory walked, 1 outside site(s) examined, 0 violation(s)`), by the outside fixture pair asserted in the wired invocation, and by a mutation probe proving the widened corpus fails closed when its walker finds nothing |

## Decisions Made

- **`checkOutsideSource` as the outside-corpus sibling of `checkSource`.** The plan describes running `checkBoundary` and `checkEdgeFunctionInvocations` per outside file; giving that pair a named function means `main` and the self-test exercise the identical composition, so the fixture counts the self-test pins are the same numbers the real corpus produces.
- **The boundary message states the boundary rather than prescribing a helper.** It says all project-scoped table and rpc access lives under the adapter directory, that an access here is outside every check that decides whether a table is project-scoped, and that there is no scoped helper at this address — then points at the adapter. A message telling a route handler to call `this.scopedFrom(…)` would be wrong about the file it is printed for.
- **The residual is documented, not quietly carried.** `BOUNDARY_ACCESS_RE` anchors on the client's conventional name, so a rebound local is out of reach. Rather than widen the receiver — the guess-the-next-spelling trap `CLIENT_BINDING_RE` and `SCHEMA_HOP_RE` both refused — the limit is stated in the declaration's docblock, alongside why a prohibition was not chosen here.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The widened corpus contains `.svelte` sources, whose prose can sit in an HTML comment**

- **Found during:** Task 1
- **Issue:** Every existing check read comment spans through the fixed `TS_FAMILY` (`//` and `/* */`), which is correct for a corpus of `.ts` adapter sources. The widened corpus includes `.svelte` files, where a shape quoted inside `<!-- -->` would have been read as live code — a false positive in exactly the direction that gets a new rule switched off.
- **Fix:** `commentMapOf` and `checkEdgeFunctionInvocations` gained an optional comment-family parameter defaulting to `TS_FAMILY`, so no existing call site changes behaviour, and `checkOutsideSource` resolves the family per file through the shared classifier's own `familyFor` extension map — which already declares `svelte: { c: true, html: true }`. No fourth hand-rolled reading of what a comment is.
- **Files modified:** `scripts/assert-project-scoped-queries.mjs`
- **Verification:** `node scripts/assert-project-scoped-queries.mjs` exits 0 with `0 violation(s)` over the real 550-file corpus, which includes every `.svelte` source under `apps/frontend/src`; the adapter corpus's own counts are unchanged (5 / 2 / 7).
- **Committed in:** `6785dec12` (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 × Rule 2 — missing critical functionality).
**Impact on plan:** Additive and confined to how the guard reads comments; it changes no adapter-side result and no acceptance criterion. Nothing was widened to make the boundary green, no coverage was reduced, and `ACCESS_RE`'s declaration is byte-identical to the string the gate spec pins.

## Flagged assumptions

- **Row 2 (empty).** Honoured as written and in the direction the plan specified: the widened corpus gets an enumeration floor (asserted by a committed mutation probe), and its converse is deliberately NOT asserted — zero outside call sites is a legitimate and desirable state, so no floor sits on that number. Recorded as still UNRESOLVED in the sense the probe table means: nothing wires a check that would notice if that judgement were wrong.
- **Row 4 (ordering).** Honoured. Every new expectation matches by distinctive substring with `some(…)`; none depends on message position or index. The walker sorts, so two runs over an unchanged tree emit the same messages in the same order — an incidental property no assertion relies on.

## Issues Encountered

None. `yarn test:unit` output contains lines matching the word "failed", all of them pre-existing build-time warnings from `@openvaa/docs` (Shiki language loading) and the `argument-condensation` prompt registry. They are out of scope under the scope boundary — untouched by this plan, present before it, and not test failures: turbo reported 25/25 tasks successful and the command exited 0.

## Known Stubs

None. Every declaration this plan added is read by a checker or by an assertion, and the gate spec asserts that from outside the guard for both the matcher and the walker.

## Threat Flags

None. This plan added no network endpoint, auth path, file access pattern or schema change. Its five register entries are discharged as follows: T-161-13-01 by check 9 and the docblock statement; T-161-13-02 by running the invocation check over the widened corpus, which brings the route handler's `identity-callback` call into the examined set; T-161-13-03 by the enumeration floor and its committed mutation probe; T-161-13-04 by the clean outside fixture plus the real corpus's required zero; T-161-13-05 accepted as planned, with the transcription above standing as the tracked evidence. T-161-13-SC holds: no package was installed.

## Residual, restated rather than left implicit

One item stays OPEN and is untouched by this plan, exactly as `161-11-SUMMARY.md` and `161-12-SUMMARY.md` recorded it: **`send-email` accepts any admin role without comparing `scope_id` to the project.** Nothing here narrows it, and no disposition claims otherwise — `requires a project term` promises only that the call names a project, which is what check 7 enforces. It belongs to the scope-aware authorization work in Phase 162.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Both of `161-VERIFICATION.md`'s recorded gaps are discharged with the measurements tabulated above, and the phase's closing full-suite E2E run is green at this HEAD. The phase is ready for re-verification (`/gsd-verify-work 161`); per the standing convention, that re-verification should AMEND the stale `missing:` entries rather than append an addendum beside them, so no closed item propagates as a false premise into Phase 162.

## Self-Check: PASSED

- Both created files present on disk: `scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts`, `scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts`.
- Both modified files present: `scripts/assert-project-scoped-queries.mjs`, `packages/dev-seed/tests/projectScopingGate.test.ts`.
- All three commits present in `git log`: `27ce316e9`, `6785dec12`, `9215476ea`. No file deletions in any of them.
- All five plan-level verification checks re-run at HEAD and green: the guard (exit 0, `0 violation(s)`, outside counts on the summary line), its self-test (exit 0, no failed expectation), `yarn workspace @openvaa/dev-seed test:unit` (exit 0, 60 files / 669 tests, both vacuity probes passing, `git status --porcelain scripts/` clean of any probe copy), `yarn lint:check` and `yarn test:unit` (both exit 0), and the closing E2E run (exit 0, 155/0/0/0, preflight 1/0).

---

_Phase: 161-project-scoping-project-id-parameterisation_
_Completed: 2026-09-05_
