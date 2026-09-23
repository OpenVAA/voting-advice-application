# Phase 157 — Review fixes

Six findings from `157-REVIEW.md`, fixed and committed one per finding. Everything else in that
review is untouched, including the findings the review classes as blockers: the degrade-to-empty
posture (Lot B CR-01/CR-02/CR-04), the logger's production level (Lot B CR-03), adapter singleton
concurrency (Lot B CR-06 / Lot C CR-04), the admin-app auth outage (Lot C CR-01/CR-02, pre-existing
per the orchestrator's own correction) and the dead `/api/auth/login` route (Lot C CR-05).

Every fix carries a regression test proven non-vacuous by a RED/GREEN round trip: the test was
written first, run against the unfixed code and observed to fail for the right reason, then run
again after the fix.

## The table

| ID | What changed | RED → GREEN | Commit |
|----|--------------|-------------|--------|
| **Lot A CR-01** — `StoredAnswersSchema` rejects four shapes the DB permits | `packages/app-shared/src/data/schemas/storedAnswers.schema.ts`. Read `public.validate_answer_value` directly rather than the review's summary and widened to match it: `value` optional on input (`:165-169` returns early when it is absent OR null, one condition for both), `info` accepts a plain string (`:171-177`), the array member accepts locale objects (`multipleText`, `:217-227`) and numbers (`multipleChoiceCategorical` ids, `:197-216`). Two members are NORMALISED on output so the boundary type still matches `LocalizedAnswer`: absent `value` → `null`, plain-string `info` → a single-key locale object under the default locale. | 4 new accept-cases, each citing the SQL line that permits it. RED: `Tests 4 failed \| 6 passed`, all four `expected false to be true`. GREEN: `10 passed`. | `d6721f2aa` |
| **Lot A CR-02** — required inner members contradict "Every field is optional here" | `packages/app-shared/src/data/schemas/storedSettings.schema.ts`. `analytics.platform.{name,code,infoUrl}` and `survey.{linkTemplate,showIn}` are now optional. Docstring restated as a rule the schema is checked against, naming the one member that stays required and why (`CardContentSchema.question` is that union arm's identifier, not a settings field). Unknown-key strictness untouched. | 2 new accept-cases, each asserting a SIBLING setting survives — the sibling is the damage. RED: `Tests 2 failed \| 12 passed`. GREEN: `14 passed`. | `f15bea1db` |
| **Lot A CR-03** — `log.*` can throw, and every call site is a catch block | `packages/app-shared/src/logging/logger.ts`. `configureLogger` drops explicitly-undefined members from the merge; `emit` resolves the threshold defensively and drops a record it has no threshold for; the sink/console emit is wrapped; `serialiseError` guards `String(value)`. What is emitted, and at what level, is unchanged. | 4 new tests, one per measured trigger plus a "later sink still works" case. RED: `Tests 4 failed \| 11 passed`. GREEN: `15 passed`. | `c1d923061` |
| **Lot A CR-04** — `getLocalized` throws on a non-object JSONB value | `packages/app-shared/src/data/getLocalized.ts`. Guards `typeof value !== 'object' \|\| Array.isArray(value)` → `null`. Premise re-verified independently: `name`/`short_name`/`info` are bare `jsonb` with no `CHECK` in `102-entities.sql` and `103-questions.sql`, and `is_localized_string` is referenced by zero constraints — its only caller is `validate_answer_value`. The array half also closes IN-01. | 3 new tests (scalar, array, does-not-throw). RED: `Tests 3 failed \| 9 passed`, `TypeError: Cannot use 'in' operator to search for 'en' in plain name`. GREEN: `12 passed`. | `feb7afa22` |
| **Lot B CR-05** — `?electionId=` yields a silently empty voter app | Both halves. `(voters)/(located)/+layout.ts` now tests selections through a `hasSelection` predicate at all three guards instead of by truthiness, which also closes the second producer of an empty array (`getImpliedConstituencyIds` returns `[]`, not `undefined`, when handed no elections). `convertFilterValue` throws on an empty array rather than reporting a successful empty read. | A new load-level test drives the layout with `?electionId=`, `?constituencyId=`, both, and neither. RED: the two `electionId=[]` cases resolved with data instead of redirecting (`load resolved with data instead of redirecting to the selector`); the other two passed as controls. GREEN: `4 passed`. Helper test flipped from pinning `[] → []` to expecting the throw: RED `1 failed \| 5 passed`, GREEN `6 passed`. | `ea804eca6`, plus `96cf35535` for a lint-only type-parameter rename in the same test |
| **Lot C CR-03** — destructured reactive context accessors freeze the job views | `apps/frontend/src/routes/admin/(protected)/jobs/+page.svelte` and `apps/frontend/src/lib/admin/components/jobs/FeatureJobs.svelte` now read `ctx.jobs.X` inside the tracking scope, including in the template. The in-repo TODO on `FeatureJobs.svelte`'s past-jobs section ("Currently has a bug… not showing past jobs") is removed: it named this bug. | Two mount-and-update component tests drive the real components against a fake context with the same reactive shape (prototype getters over `$derived.by`, fresh collection per recompute) and update the registry AFTER mount. RED for `FeatureJobs`: `2 failed`, the placeholders never clear — re-verified against the FINAL test file by reverting the component and re-running. RED for the page: `expected [ '0', '0', '0', '0' ] to deeply equal [ '1', '1', '1', '1' ]`. GREEN: `2 passed` each. | `7b7178bc5` |

## Two decisions worth recording

**CR-01, the `info` half: normalised rather than widened.** The natural fix is to widen
`LocalizedAnswer['info']` to `LocalizedString | string | null`, which is what the database says and
what every reader already handles (`translate()` takes both; `getSavedAnswer` branches on
`isLocalizedString`). It was tried and measured: it takes the frontend typecheck from 3 errors to 1,
and the last one does not close without redesigning the candidate open-answer input. The reason is
that `LocalizedCandidateData.answers` is an `Answers & LocalizedAnswers` INTERSECTION, so `info`
resolves there to the nonsense type `string & LocalizedString` — and that nonsense type is the only
reason the existing `<Input type={cond ? 'textarea' : 'textarea-multilingual'} value={answer?.info}>`
typechecks at all, since the intersection satisfies both arms of the `InputProps` union while either
honest type satisfies neither. Untangling that is a real piece of work with a UI decision inside it
(how a multilingual editor should present an unlocalised legacy string), so it was left alone and the
schema normalises instead. The normalisation is behaviour-neutral for readers: `translateObject`
resolves a single-key locale object to its one string for every requested locale, which is exactly
what `translate()` does with a plain string.

**CR-01's fifth case was NOT fixed.** The review notes in passing that nothing in the database
rejects an unknown key inside an answer object, so `{q1:{value:'x',legacyField:1}}` still wipes the
blob. That is the strictness/degrade posture, which is explicitly out of scope here (Lot B
CR-01/CR-02/CR-04), and it is a decision about what `safeParse` failure should mean rather than about
what the schema admits. The four enumerated shapes are fixed; this one is left, deliberately, for
whoever takes the posture decision.

## Findings whose premises were checked and held

Every premise checked out, so nothing was rejected. Specifically re-measured rather than taken on
trust: the four SQL branches behind CR-01 (read from `011-validation-functions.sql`, not from the
review's table); the absence of any `CHECK` on the localized columns and the zero constraint
references to `is_localized_string` behind CR-04; `parseParams`' empty-value filter behind CR-05; and
the prototype-getter-over-`$derived.by` shape behind Lot C CR-03. The one place the review's
prescription was not followed verbatim is CR-01's `info` member, above, and CR-05's adapter half,
where the throw was placed in `convertFilterValue` rather than in each provider method so that all
four call sites are covered by one guard.

## Verification

Run after all six fixes were committed.

| Gate | Result |
|------|--------|
| `yarn build` | `Tasks: 14 successful, 14 total` — no `--force` needed |
| `yarn lint:check` | exit 0. `@openvaa/frontend:lint: ✖ 1 problem (0 errors, 1 warning)` — the pre-existing unused `question` in `candidateContext.svelte.test.ts`. Also unchanged: `@openvaa/dev-seed:lint: ✖ 15 problems (0 errors, 15 warnings)` and the two pre-existing `tests/` warnings |
| `yarn format:check` | exit 0 — `All matched files use Prettier code style!` |
| `yarn test:unit` | exit 0. `Tasks: 25 successful, 25 total`. Frontend `Test Files 59 passed (59)`, `Tests 940 passed (940)` (baseline 932, +8). app-shared `Test Files 10 passed (10)`, `Tests 95 passed (95)` (+12 new; this reconciles with the review's own recorded baseline of 83, not with the 79 quoted in the dispatch) |
| `svelte-check` (`yarn workspace @openvaa/frontend typecheck`) | `COMPLETED 2697 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` (baseline 2694 files; +3 new test files) |

The typecheck earned its keep. CR-01's first shape — `value` left optional rather than defaulted —
built clean and passed the whole unit suite while producing three real assignability errors that only
`svelte-check` reported, and it is what surfaced the `string & LocalizedString` intersection
described above.

E2E was not run: the orchestrator owns the cardinal gate, and it needs a clean database and a dev
server it controls.

---

## Post-fix cardinal E2E gate (orchestrator-run)

Run by the orchestrator after the six fixes landed, per CLAUDE.md's E2E hard rule.

| Field | Value |
|---|---|
| HEAD | `5ef212902` |
| Command | `yarn test:e2e` — unfiltered, no grep, no `--project` |
| Database | `yarn db:reset` (NOT `db:reset-with-data` — see the note below) |
| Dev server | exactly one fresh `yarn dev`, PID 81531 on `:5173`; port confirmed free first |
| Preflight | `E2E PREFLIGHT OK …/apps/frontend (verified against …/voting-advice-application-gsd)` |
| Result | **`150 passed (10.4m)`, exit 0** |
| Failed | 0 |
| Skipped | 0 |
| Flaky | 0 |
| Did-not-run | 0 |
| Free disk before run | 141 GiB |
| `tests/e2e-runs/` | untouched |

Count is unchanged from 157-18's own gate (150), as expected: the six fixes added unit and
component coverage, not E2E specs.

**The database prerequisite is `yarn db:reset`, not `yarn db:reset-with-data`.** 157-18
measured this and it is repeated here because it is the second document that could have
propagated the wrong one: `db:reset-with-data` seeds the `seed_`-prefixed `default` template
into a suite that asserts against `e2e/base`, and CI's own e2e job seeds nothing.
`setupFromTemplate` whitelists `seed_` in its freshness probe, so the wrong prerequisite
fails *quietly* rather than loudly. The plan text and the pause handoff both had it wrong.

## What this gate does NOT clear

The suite passing is not evidence about the deferred findings, and must not be read as such.
Every remaining blocker is a silent-degradation or concurrency defect whose trigger is
malformed or concurrent input; the fixtures are well-formed and single-threaded, and zero
E2E specs touch the admin app. A green suite and an open blocker list are both true here.
