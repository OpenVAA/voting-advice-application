## 161 — CR-05's nullish-coalesced owner + the owner-expression grammar — ACCEPTED RESIDUAL (operator, 2026-09-13)

The sixth re-verification found CR-05 in the CR-04 closure: two owner bindings the new
`OWNER_BINDING_RE` could not read, because its lookahead excluded BARE CHARACTERS `[.?![]` and so
declined `const self = this!;` and `const self = this ?? other;` alongside the chain continuations
`this!.supabase` / `this?.supabase` it was written to decline.

**Closed in `ab2fe6d9b`:** the `!` position, now two characters wide (`!(?:\.|=)`) — reports a
terminating `this!`, declines a mid-chain `!.` and a comparison `!=`/`!==`. Sites 40 → 41, escape
hatches 19 → 20, owner family pinned at 2 by name, two new near-miss controls committed, three
mutations each reddening their own control.

**Accepted as a permanent residual:** the `??` half, and the six owner-EXPRESSION spellings
(`{ ...this }`, `Object.assign({}, this)`, `() => this`, `for (const o of [this])`,
`const [o] = [this]`, and a getter returning `this`). All are STATED in the guard's residual list and
pinned in `RESIDUAL_PHRASES`, so they are measured in both directions rather than silent.

**What closing the `??` half would cost, measured rather than estimated:** narrowing the `?`
exclusion to a `?` not followed by a second `?` makes the lookahead an admitted punctuator position.
The gate spec's back-pressure then requires the rule be registered on `MATCHER_NAMES` — 2 spec
failures for the regex alone, 6 more on registration, because the punctuator enumeration recognises
only the three token forms `?.`, `!.` and `?.(` and derives a disposition matrix a lookahead-only
matcher has no links for. Whether such a matcher belongs in a matrix built for member-access chains
is a genuine design question and was deliberately left unanswered.

**Known and NOT fixed:** the back-pressure predicate asserts `not.toContain('\\?')` — it looks for an
ESCAPED `\?` and is blind to a bare `?` inside an excluding character class, which is why CR-05 could
arrive under a green suite. `ab2fe6d9b` deliberately does not exploit that hole to make the rule look
enumerated. Any future widening of this rule must re-open the `MATCHER_NAMES` question rather than
assume it was settled here.

**Live exposure: ZERO**, re-measured at this HEAD for every shape named above.


## ~~161-03 — pgTAP `07-rpc-security` test 14 is DB-state-dependent (out of scope)~~ — CLOSED

**Closed by 161-02.1, struck by 161-09 (2026-09-05).** The partition assertion's right-hand side is
scoped on disk: `AND n.project_id IN (test_id('project_a'), test_id('project_b'))`, with the comment
above it recording the `have: 4, want: 381` measurement and why scoping is not a weakening. Re-measured
by 161-09 while the local database held 377 previously-seeded nominations in the default project:
`yarn workspace @openvaa/supabase test:db` PASSES, 397/397. The entry below is kept as the record of
what was found; it is no longer open.

## 161-03 — pgTAP `07-rpc-security` test 14 is DB-state-dependent (out of scope)

`yarn workspace @openvaa/supabase test:db` exits 1 on one assertion authored by 161-02
(`d3104a13d`): *"the two project-scoped counts partition the anon-visible confirmed nominations
rather than merely filtering them"* — `have: 4`, `want: 381`.

**Not attributable to 161-03**, which changed no SQL and no DB artefact: the plan's full file list is
`index.ts`, `config.toml`, `.env.example`, `IDURA-TEST-RUNBOOK.md`, `SKILL.md` and one todo.

**Diagnosis, arithmetic-exact.** The local database holds a previously seeded default-template
dataset: 377 `nominations` and 327 `seed_`-prefixed candidates across 1 project. The fixture adds 2
projects and 4 nominations inside the test transaction, so the anon-visible confirmed total becomes
`377 + 4 = 381` — exactly the observed `want`. The assertion holds only on a database without a
pre-existing bulk dataset, so it encodes a clean-DB precondition it does not state or enforce.

**Not fixed here** — it is a second plan's assertion and a second phase's call. Two options for
whoever owns it: scope the partition assertion to the fixture's own projects, or state the
`yarn db:reset` precondition in the suite. The operator's seeded data was deliberately left intact
rather than reset, since the arithmetic already settles attribution.

## 161-09 — `.planning/WINDOWS.md` rejects appends: rendered table disagrees with its fenced JSON (out of scope)

`gsd-tools windows append` refuses to write, reporting that the ledger's rendered table disagrees with
the fenced JSON entries in its header or separator row. Pre-existing at this HEAD and untouched by this
plan, which added nothing to `WINDOWS.md` and edited no part of it.

**Not attributable to 161-09** and not repaired here: the ledger is a cross-phase artefact, hand-editing
its rendered table is exactly what the tool forbids, and ledger population is documented as best-effort
rather than blocking. The one entry this plan would have filed — the bank-auth runbook steps reconciled
but not executed — is recorded instead in `161-09-SUMMARY.md` under `coverage` D7 with
`human_judgment: true` and its rationale.

**For whoever owns it:** repair the fenced JSON block directly, or discard the stale table edit and
re-run any `windows` command so the table is regenerated.

## Out of scope, found during 161-12

- `.planning/WINDOWS.md` is in an inconsistent state: `gsd-tools windows append` refuses to write, reporting
  that the rendered table disagrees with the fenced JSON entries that are its source of truth. Pre-existing
  and unrelated to this plan's files; ledger population is best-effort and does not block execution. The
  entry that could not be appended is the already-recorded open residual (`send-email` accepts any admin
  role without comparing `scope_id` to the project), which is carried in `161-11-SUMMARY.md`,
  `161-12-SUMMARY.md` and `STATE.md`, so it is not lost — only absent from the ledger.
- `gsd-tools query state.advance-plan` cannot parse `STATE.md` ("Cannot parse Current Plan or Total Plans in
  Phase"): the Current Position block records plan progress as prose rather than in the `N of M` form the
  handler expects. Pre-existing. Position was updated by hand instead.

## Out of scope, found during 161-14

- `packages/dev-seed/tests/ensureProject.test.ts > reuses the default account instead of creating one`
  failed once during the first full `yarn workspace @openvaa/dev-seed test:unit` of this plan, with
  `ensureProject: failed to upsert the projects row: An invalid response was received from the upstream
  server` — a 502 from the local PostgREST while `default-template.integration.test.ts` was seeding
  concurrently. It passed in isolation immediately afterwards and passed in two subsequent full runs of
  the same suite, and again under `yarn test:unit` (25/25 tasks, 1630 + 669 tests). Not attributable to
  this plan: nothing here is imported at runtime by `@openvaa/dev-seed`'s source, and the only file this
  plan touches under `packages/` is the repo-meta gate spec, which reads `scripts/` as text.
  status: open
  **What:** a live-database unit test that can 502 under concurrent load from the integration test in the
  same suite. Worth a look because an intermittently-failing test is a real defect by this repository's own
  standard, but the cause is the local Supabase stack's behaviour under concurrency rather than the test's
  assertions, and diagnosing it is not this plan's file set.

## Filed as follow-ups during 161-16 (per D-N2)

Four residuals this plan STATES and PINS but does not close. Each is measured by an assertion in
`packages/dev-seed/tests/projectScopingGate.test.ts` and stated in the guard's module docblock, so
neither half can go stale without a test failure. Each has an entry under `.planning/todos/pending/`
naming what it is, why it is not done here, and what would make it worth doing.

| Follow-up | Entry | Source finding |
|---|---|---|
| Run checks 6 and 8 over the outside corpus | `2026-09-07-run-escape-hatch-and-schema-hop-checks-outside-the-adapter-directory.md` | WR-06 |
| Exclude string / template spans, as comment spans already are | `2026-09-07-exclude-string-literal-spans-from-the-project-scoped-query-guard.md` | IN-02 |
| The binding rule's initialiser shape, wrong in both directions | `2026-09-07-widen-the-client-binding-rule-to-the-whole-initialiser.md` | WR-02, IN-01 |
| The fixtures are read by no typechecker, linter or formatter | `2026-09-07-typecheck-lint-and-format-the-project-scoped-query-fixtures.md` | IN-03 (prior IN-08) |

  status: open
  **What:** four stated residuals of the project-scoped query guard, each measured and each pinned to
  the docblock sentence that states it. None is a live leak today — the first two are reach
  limitations with no live site, the third is wrong in a direction that over-reports as well as one
  that under-reports, and the fourth is a missing gate over fixture files rather than over product
  code. They are filed rather than closed because each is a change to the guard's behaviour or to the
  repository's build configuration, and this plan's file set is the gate spec, the guard's docblock
  and `.gitignore`.
