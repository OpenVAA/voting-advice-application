---
phase: 157-adapter-boundary-typing
plan: 05
subsystem: frontend
tags: [adapter, supabase, rpc, typescript, filters, tdd, refactor]

requires:
  - phase: 157-adapter-boundary-typing
    plan: 04
    provides: "the applied 4-argument public.get_nominations and the regenerated packages/supabase-types/src/database.ts entry carrying p_election_round — the compile-time contract this plan calls against"
provides:
  - "convertFilterValue<TType extends string | number>(value: FilterValue<TType> | null | undefined): Array<TType | null> — the single named scalar-or-array conversion for RPC fan-outs"
  - "FilterByElectionRound, a scalar electionRound?: number filter type, composed into GetNominationsOptions and AnyFilter"
  - "supabaseDataProvider._getNominationData forwards p_election_round and no longer carries the two as Array<string> casts"
  - "a measured post-plan cast baseline for supabaseDataProvider.ts: 62 lines match ' as ', 88 token occurrences"
affects: [157-06, 157-07, 157-08]

actuals:
  tokens: 22463
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "One named, colocated, unit-tested pure helper owns a conversion that was previously spelled inline at two call sites nine lines apart."
    - "A filter axis whose SQL predicate is a scalar equality is typed as a scalar, not as FilterValue<T>, so it adds no level to an RPC fan-out."
    - "An undefined filter converts to the single-element [null] sentinel (one unfiltered call), while an empty array converts to [] (zero calls); the two are asserted against each other so a later simplification cannot merge them."

key-files:
  created:
    - apps/frontend/src/lib/api/adapters/supabase/utils/convertFilterValue.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/convertFilterValue.test.ts
  modified:
    - apps/frontend/src/lib/api/base/getDataFilters.type.ts
    - apps/frontend/src/lib/api/base/getDataOptions.type.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts

key-decisions:
  - "The helper signature was widened to accept null as well as undefined. The plan's artifacts line specified `FilterValue<TType> | undefined` while its behavior block required `convertFilterValue(null)` to return `[null]`; FilterValue<TType> = TType | Array<TType> does not admit null, so the two were mutually unsatisfiable and the behaviour block won."
  - "p_election_round is passed as `options?.electionRound` (number | undefined), not the plan's `?? null`. The regenerated type is `p_election_round?: number`, which does not admit null, and undefined is behaviour-identical here because JSON.stringify drops the key and the SQL DEFAULT NULL applies. This matches the sibling coercion already documented at the same call site."
  - "The prohibition's literal grep (`grep -n 'electionRound' getDataOptions.type.ts` shows a scalar number) is unsatisfiable alongside the plan's own instruction to COMPOSE the filter type, since composition means the field name never appears in that file. The prohibition was verified by a stronger method instead: a throwaway type probe proving a scalar is accepted and an array is rejected."
  - "FilterByElectionRound was also added to the AnyFilter union. AnyFilter is documented as 'any filter in getData options' and has zero other references in the tree; leaving the new filter out would have silently falsified that doc for a zero-risk one-line cost."

patterns-established:
  - "Prove a type-level prohibition with a throwaway compile probe (accept the allowed shape, reject the banned shape, read the exact tsc error) rather than with a grep for a spelling, when the plan's own composition instruction makes the spelling absent by construction."
  - "The comment-hygiene guard scans GIT-TRACKED files only. A lint:check run made while a new source file is still untracked reports zero violations for it. Commit first, then lint, or the guard is a no-op on exactly the file you just wrote."

requirements-completed: [REVIEW-ADP-02]

coverage:
  - id: D1
    description: "convertFilterValue(undefined) returns [null], convertFilterValue('a') returns ['a'], convertFilterValue(['a','b']) returns ['a','b'], and convertFilterValue([]) returns [] and is asserted to differ from the undefined case."
    requirement: REVIEW-ADP-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/utils/convertFilterValue.test.ts — 6 tests, all passing; `yarn workspace @openvaa/frontend test:unit --run convertFilterValue` reports `Tests 6 passed (6)`"
        status: pass
    human_judgment: false
  - id: D2
    description: "The inline scalar-or-array conversion no longer appears in _getNominationData; both call sites go through the named helper, and the two as Array<string> casts are gone."
    requirement: REVIEW-ADP-02
    verification:
      - kind: other
        ref: "grep -c 'convertFilterValue' supabaseDataProvider.ts = 3 (>=2); grep -c 'as Array<string>' supabaseDataProvider.ts = 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "GetNominationsOptions carries an electionRound filter that reaches get_nominations as p_election_round."
    requirement: REVIEW-ADP-02
    verification:
      - kind: unit
        ref: "supabaseDataProvider.test.ts 'forwards an electionRound option to the RPC as p_election_round' — asserts toHaveBeenCalledWith({..., p_election_round: 2}) and toHaveBeenCalledTimes(1)"
        status: pass
      - kind: other
        ref: "grep -c 'p_election_round' supabaseDataProvider.ts = 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "electionRound is a scalar number, not a FilterValue<number>, so the fan-out stays two-dimensional (T-157-12)."
    verification:
      - kind: other
        ref: "throwaway type probe: `{ electionRound: 1 }` compiles clean, `{ electionRound: [1, 2] }` fails with `Type 'number[]' is not assignable to type 'number'.` — exactly 1 error over 2692 files"
        status: pass
      - kind: unit
        ref: "supabaseDataProvider.test.ts 'fans out over arrays without multiplying by the election round' — 2 elections x 2 constituencies x round 1 = exactly 4 RPC calls"
        status: pass
    human_judgment: false
  - id: D5
    description: "No runtime guard was mistaken for a cast, and the frontend unit suite stays green including the pre-existing nomination-shape assertions."
    verification:
      - kind: other
        ref: "grep -c \"typeof settings.notifications === 'object'\" supabaseDataProvider.ts = 1 (unchanged)"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit — 55 files, 897 passed (889 baseline + 6 helper + 2 provider); supabaseDataProvider.test.ts 49 passed"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-08-30
status: complete
---

# Phase 157 Plan 05: The convertFilterValue Helper and the Election-Round Wiring Summary

**The nomination fan-out's two inline scalar-or-array conversions are now one named, six-case unit-tested helper generic over `string | number`, `get_nominations` receives `p_election_round`, and the two `as Array<string>` casts are gone — taking `supabaseDataProvider.ts` from 64 cast lines / 90 ` as ` tokens to 62 / 88, with the frontend suite at 897 passed and `yarn lint:check` back at exit 0.**

## Performance

- **Duration:** ~9 min (started 2026-08-30T17:24:40Z, gates complete 17:33:47Z)
- **Tasks:** 3 of 3
- **Commits:** 5 (Task 1 is TDD, so it is two: RED then GREEN, plus one style fix for the comment-hygiene guard)
- **Files:** 6 (2 created, 4 modified)

## Task Commits

| # | Task | Commit | Type |
|---|------|--------|------|
| 1a | Task 1 RED — the six failing cases | `82699c6c7` | `test` |
| 1b | Task 1 GREEN — the helper | `423f01d5b` | `feat` |
| 2 | Task 2 — `FilterByElectionRound` and the option | `e72202b6d` | `feat` |
| 3 | Task 3 — the fan-out rewrite and `p_election_round` | `497a5c4d9` | `refactor` |
| 3b | Comment-hygiene fix on the Task 1 JSDoc | `ae028b448` | `style` |

**TDD gate sequence:** `test(...)` at `82699c6c7` → `feat(...)` at `423f01d5b`. RED was a genuine red: the run before the implementation existed failed at the import (`Test Files 1 failed (1)`, `Tests no tests`), not on an assertion, and no test passed unexpectedly. No REFACTOR commit was needed — the helper is four lines.

## The helper's final signature, verbatim

```ts
export function convertFilterValue<TType extends string | number>(
  value: FilterValue<TType> | null | undefined
): Array<TType | null> {
  if (value == null) return [null];
  return Array.isArray(value) ? value : [value];
}
```

Note the `| null`, which the plan's artifacts line did not carry — see deviation 1.

## The measured cast baseline for 157-07 and 157-08

The plan's `<output>` asks for the remaining `as` count in `supabaseDataProvider.ts` so the later plans work from a measurement rather than a research-time figure. Both figures fact 19 uses (`157-CONTEXT.md:314` — "64 lines match ` as `, 87 token occurrences"), measured on this file at the three relevant points:

| Point | Lines matching `' as '` | Token occurrences of `' as '` |
|---|---|---|
| `157-CONTEXT.md` fact 19 (research time) | 64 | 87 |
| Immediately before this plan's Task 3 (`git show HEAD:…` at `e72202b6d`) | 64 | **90** |
| After this plan (`ae028b448`) | **62** | **88** |

**Two separate things are visible here, and they must not be confused.** This plan's own delta is exactly **−2 lines and −2 tokens** — the two `as Array<string>` casts, and nothing else. The token count had *already* drifted 87 → 90 before Task 3 ran, from other Phase 157 plans landing in this file; the line count happened to land back on 64. **157-07 and 157-08 should plan against 62 / 88, not against fact 19's 64 / 87, and should re-measure rather than assume, because this file is a shared surface that several plans in this phase edit.**

Reproduce with:

```bash
P=apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
grep -c ' as ' $P        # 62
grep -o ' as ' $P | wc -l # 88
```

The specific criterion-1 grep is unchanged at zero: `grep -c 'as Array<string>' $P` returns **0**.

## The `jsonb_array_length` hazard 157-04 handed forward: measured unreachable through this plan

157-04 handed forward a measured, real hazard — `get_questions(NULL, NULL, 1)` raises `ERROR: cannot get array length of a non-array` (SQLSTATE `22023`) against a row whose `election_rounds` is a non-array JSONB, and it fires **only on a non-NULL filter parameter**, which is exactly the code path this plan builds. The orchestrator asked to be told explicitly if this plan's conversion can emit a non-NULL filter parameter that reaches a malformed column.

**It cannot, and the reason is structural rather than incidental.** The hazard lives in the `jsonb_array_length` guards of `get_questions`, on JSONB array columns:

```sql
-- apps/supabase/supabase/schema/505-question-rpcs.sql:41-44
AND (p_election_round IS NULL
     OR qc.election_rounds IS NULL
     OR jsonb_array_length(qc.election_rounds) = 0
     OR qc.election_rounds @> to_jsonb(p_election_round))
```

This plan does not call `get_questions`. Its only RPC is `get_nominations`, whose round predicate is a scalar integer equality:

```sql
-- apps/supabase/supabase/schema/503-entity-rpcs.sql:82
AND (p_election_round IS NULL OR n.election_round = p_election_round)
```

Measured, not assumed:

- `sed -n '10,110p' apps/supabase/supabase/schema/503-entity-rpcs.sql | grep -c jsonb_array_length` returns **0** — the whole `get_nominations` body contains no `jsonb_array_length` call on any axis, including its `p_election_id` and `p_constituency_id` predicates, which are also plain equalities (`:78-79`).
- The column it filters is `nominations.election_round integer DEFAULT 1` with `CONSTRAINT nominations_election_round_check CHECK (election_round >= 1)` (`104-nominations.sql:45,53`) — a constrained scalar `integer`, not an unconstrained JSONB.

So the reachable-side warning 157-04 issued applies to **157-06**, which is the plan that calls `get_questions` with a real election and constituency. It does not apply here. This plan neither reintroduces nor papers over the residual; it simply does not touch that predicate. 157-04's recommendation still stands unaddressed: a `CHECK (jsonb_typeof(...) = 'array')` on the six JSONB filter columns, owned by Phase 160 or 164.

## The one behavioural difference the refactor introduces, and why it is the right one

The old inline form branched on **truthiness**:

```ts
const electionIds: Array<string | null> = options?.electionId ? … : [null];
```

`convertFilterValue` branches on `== null` instead. The two agree on every input except a **falsy-but-present** filter value — an empty string `''` (or, for a numeric axis, `0`):

| Input | Old behaviour | New behaviour |
|---|---|---|
| `undefined` | `[null]` | `[null]` — same |
| `[]` | `[]` (an empty array is truthy, so this already fanned out to zero calls) | `[]` — same |
| `['a','b']` | `['a','b']` | `['a','b']` — same |
| `'a'` | `['a']` | `['a']` — same |
| `''` | `[null]` — silently treated as *no filter* | `['']` — treated as *filter by empty string* |

The new behaviour is the intended one: conflating a present-but-empty filter value with the absence of a filter is the T-157-13 class the plan's own threat register asks to mitigate. **Reachability was checked at all three call sites rather than argued:**

1. `(voters)/(located)/+layout.ts:97` — guarded upstream by `if (!electionId || !constituencyId)` at `:39` and `if (!electionId)` at `:47`, which replace a falsy id with implied ids before the provider is called. An `''` cannot reach it.
2. `(voters)/nominations/+layout.ts:40` — passes `locale` only. Unaffected.
3. `admin/utils/loadElectionData.ts:41` — the parameter is typed `electionId: Id` (required, `Id = string`), so an `''` there is a caller bug, not a supported input.

Recorded rather than hidden, because it is the only semantic change in an otherwise mechanical refactor.

## Wire-payload identity for existing callers

No caller passes `electionRound` today (`157-RESEARCH.md` B.3 measured this, and it was re-confirmed: the option did not exist before this plan). For every existing caller, `p_election_round` is therefore `undefined`, and the argument object is serialized by `JSON.stringify`, which drops `undefined`-valued keys. Measured:

```
{"p_election_id":"e1","p_constituency_id":"c1","p_include_unconfirmed":false}
{"p_election_id":"e1","p_constituency_id":"c1","p_include_unconfirmed":false}
identical: true
```

The second object is the first plus `p_election_round: undefined`. The bytes on the wire are unchanged for every existing read path — which is the substance of the argument that the E2E suite is unaffected by this plan (see "Not run", below). It is also the mechanism the call site's pre-existing comment already documents for `p_election_id`/`p_constituency_id`.

## Decisions Made

### The helper accepts `null`, because the plan's own two halves disagreed

`<artifacts_this_plan_produces>` specifies `(value: FilterValue<TType> | undefined)`. The `<behavior>` block's second case requires `convertFilterValue(null)` to return `[null]`. `FilterValue<TType> = TType | Array<TType>` (`getDataFilters.type.ts:39`) admits neither `null` nor `undefined`, so the signature as written cannot be called with `null` at all. Rather than guess, the behaviour block was treated as the contract and the signature widened by `| null`. This costs nothing at the call sites — the two option fields are `Id | Array<Id> | undefined` — and it makes the implementation's own `value == null` guard honest instead of unreachable-by-type.

### `p_election_round` is passed as `undefined`, not `null`

The plan's Task 3 action says "pass `options?.electionRound ?? null` directly". The regenerated type is `p_election_round?: number` (`packages/supabase-types/src/database.ts:1192`), which does not admit `null`; `?? null` is a compile error. `options?.electionRound` is already `number | undefined` and needs no coercion at all. This is behaviour-identical (the key is dropped, the SQL `DEFAULT NULL` applies) and it is the same coercion the two sibling arguments at the same call site already use, with the reasoning already recorded in the comment immediately above them.

### The scalar prohibition was proven by compile probe, not by the plan's grep

The plan's Task 2 acceptance criterion and its `MUST NOT make electionRound a FilterValue<number>` prohibition both verify via `grep -n 'electionRound' apps/frontend/src/lib/api/base/getDataOptions.type.ts`. That grep returns **empty**, and must — because the same plan instructs "Compose it into `GetNominationsOptions`", and composition puts the field in `getDataFilters.type.ts`, exactly as `electionId` and `constituencyId` already are. The two requirements are mutually unsatisfiable as literally worded.

The prohibition's *intent* was verified with a stronger instrument, a throwaway probe compiled and then deleted:

```ts
const a: GetNominationsOptions = { electionRound: 1 };      // no error
const b: GetNominationsOptions = { electionRound: [1, 2] }; // must fail
```

```
ERROR "src/lib/api/base/__scalarprobe.ts" 5:36 "Type 'number[]' is not assignable to type 'number'."
COMPLETED 2692 FILES 1 ERRORS 0 WARNINGS 1 FILES_WITH_PROBLEMS
```

Exactly one error, on exactly the array line, with the resolved type reported as `number`. That is a direct measurement of the resolved option type; the grep would only ever have been a measurement of a spelling. The T-157-12 fan-out consequence is separately covered by a unit test asserting 2 x 2 x round-1 produces exactly 4 calls.

## Deviations from Plan

### 1. [Rule 3 — Blocking] The specified helper signature could not express the specified behaviour

- **Found during:** Task 1, writing the RED test
- **Issue:** `<artifacts_this_plan_produces>` gives `(value: FilterValue<TType> | undefined)`; `<behavior>` requires `convertFilterValue(null)` to return `[null]`. `FilterValue<TType> = TType | Array<TType>` excludes `null`, so the null case is a type error against the specified signature.
- **Fix:** widened to `FilterValue<TType> | null | undefined`. The behaviour block was treated as authoritative because the action text also says "return `[null]` when the value is `null` or `undefined`" — two of the plan's three statements agree, and only the artifacts line dissents.
- **Files:** `convertFilterValue.ts`
- **Committed in:** `423f01d5b`

### 2. [Rule 3 — Blocking] `?? null` does not compile against the regenerated RPC type

- **Found during:** Task 3
- **Issue:** the plan says to pass `options?.electionRound ?? null`. 157-04 regenerated `p_election_round?: number` — no `null` in the union.
- **Fix:** pass `options?.electionRound` (already `number | undefined`). Behaviour-identical, and consistent with the sibling `?? undefined` coercions and their existing comment at the same call site.
- **Files:** `supabaseDataProvider.ts`
- **Committed in:** `497a5c4d9`

### 3. [Scope] `supabaseDataProvider.test.ts` is modified but not in `files_modified`

- **Found during:** Task 3
- **Issue:** the plan's frontmatter `files_modified` lists five files and omits `supabaseDataProvider.test.ts`, while Task 3's action explicitly instructs "Extend `supabaseDataProvider.test.ts` with a case asserting that an `electionRound` option reaches the RPC as `p_election_round`" and its acceptance criteria require that case to exist. The file also *had* to change regardless: two existing assertions use `toHaveBeenCalledWith` with an exact argument object, which fails the moment a key is added.
- **Action:** modified it, and declaring it here. Three assertions changed or added: the two exact-match objects gained `p_election_round: undefined`, and two new cases were added (forwarding, and fan-out arity).
- **Committed in:** `497a5c4d9`

### 4. [Rule 2] `FilterByElectionRound` was also composed into `AnyFilter`

- **Found during:** Task 2
- **Issue:** `AnyFilter` is documented "Any filter in getData options" and is the intersection of the four existing filter types. Adding a fifth filter type without adding it there falsifies that doc.
- **Action:** added. `grep -rn "AnyFilter"` across `apps/frontend/src` and `packages/` returns exactly **one** hit — its own declaration — so the type has zero consumers and the change cannot affect any call site. Zero risk, and it keeps the file's stated invariant true.
- **Committed in:** `e72202b6d`

### 5. [Rule 1] The Task 1 JSDoc violated the comment-hygiene guard

- **Found during:** the post-Task-3 full `yarn lint:check`
- **Issue:** `yarn lint:check` exited **1** with 7 rule-2 (D-A4) violations, all seven in `convertFilterValue.ts` — conventionally wrapped JSDoc prose, which the forced-line-break rule correctly reads as sentences broken across lines at the same indent.
- **Root cause of the late detection, which matters more than the fix:** an earlier `yarn lint:check`, run after the helper was written, reported `files scanned: 1579 … 0 violation(s)`. **The comment-hygiene guard scans git-TRACKED files only.** At that moment `convertFilterValue.ts` was still untracked, so the guard was a silent no-op on the one file being written. The file count moving 1579 → 1580 is the visible tell.
- **Fix:** each JSDoc paragraph rewritten as a single unwrapped line. Re-run: exit **0**, `files scanned: 1580 … 0 violation(s)`.
- **Committed in:** `ae028b448`

---

**Total deviations:** 2 blocking auto-fixes where the plan's text did not compile against measured reality, 1 scope declaration, 1 additive consistency fix, 1 guard violation of my own making. **Impact on scope:** none. All four planned artifacts were produced and every acceptance criterion is met or superseded by a stronger measurement.

## Issues Encountered

**The comment-hygiene guard's tracked-files-only scope is a trap for exactly this workflow.** Writing a new source file, running `lint:check`, seeing zero violations, and *then* committing produces a false green — the guard never looked at the new file. Anyone writing a new file in this tree should commit before trusting a hygiene result, or run `yarn lint:check` a second time after the first commit. This is the fourth time in Phase 157 that rule 2 has bitten; the first three were about the rule's content, this one is about its scope.

**`yarn format:check` reports 3 files, all pre-existing.** `dataWriter.type.ts`, `universalDataWriter.ts` and `adminContext.svelte.ts` are flagged. `git diff --name-only 82699c6c7~1 HEAD` shows this plan's commits touch exactly six files and none of those three; they arrived from other Phase 157 plans. `npx prettier --check` over this plan's six files reports "All matched files use Prettier code style!". Not fixed — out of scope per the executor's scope boundary, and flagging it here for whichever plan owns those files.

**No build-recovery needed.** `yarn build` succeeded first time (14/14, FULL TURBO); the `packages/core/dist` declaration-emit hazard did not fire.

**No database was touched**, per the standing instruction. `db:reset*`, `db:types`, pgTAP and `db:lint:sql` were all left alone. This plan's diff contains no SQL and no generated types.

## Verification Performed

| Gate | Command | Result |
|------|---------|--------|
| Helper unit tests | `yarn workspace @openvaa/frontend test:unit --run convertFilterValue` | **`Tests 6 passed (6)`** |
| Provider unit tests | `yarn workspace @openvaa/frontend test:unit --run supabaseDataProvider` | **`Tests 49 passed (49)`** (was 47) |
| Frontend unit suite | `yarn workspace @openvaa/frontend test:unit` | **55 files, `897 passed`** — 889 baseline + 6 helper + 2 provider |
| Monorepo unit suite | `yarn test:unit` | **exit 0, `Tasks: 25 successful, 25 total`**; app-shared **79 passed** (baseline), data 244, dev-seed 603, llm 39, argument-condensation 30 |
| Frontend typecheck | `yarn workspace @openvaa/frontend typecheck` | **`COMPLETED 2691 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`** |
| Lint and all guards | `yarn lint:check` | **exit 0**; frontend workspace `✖ 1 problem (0 errors, 1 warning)` — the stated clean signature, the warning pre-existing in `candidateContext.svelte.test.ts:19`; comment hygiene **1580 files / 0 violations**; parity census unmoved at 25 files → 3424 lines; all other guards 0 violations |
| Frontend lint, cache-bypassed | `yarn workspace @openvaa/frontend lint` | **`✖ 1 problem (0 errors, 1 warning)`** — run directly so turbo's cache hit could not mask the new files |
| Prettier, this plan's files | `npx prettier --check` over the 6 files | **"All matched files use Prettier code style!"** |
| Build | `yarn build` | **exit 0, `Tasks: 14 successful, 14 total`** |
| Criterion-1 grep | `grep -c 'as Array<string>' supabaseDataProvider.ts` | **0** |
| Task 3 greps | `grep -c` on the provider | `convertFilterValue` = **3** (≥2 ✅), `p_election_round` = **1** ✅, `typeof settings.notifications === 'object'` = **1** ✅ (untouched) |
| Task 2 grep | `grep -c 'FilterByElectionRound' getDataFilters.type.ts` | **2** (≥1 ✅) |
| Task 1 greps | `grep -c` on the helper | `TType extends string \| number` = **1** ✅; `^export function convertFilterValue` = **1** ✅ (a declaration, not an arrow const, so `func-style` holds) |
| Scalar prohibition | throwaway `tsc` probe | array form rejected: **`Type 'number[]' is not assignable to type 'number'.`**; probe deleted |
| No accidental deletions | `git diff --diff-filter=D --name-only 82699c6c7~1 HEAD` | **empty** |

**Not run, and why:**

- **The E2E suite.** The phase E2E gate is the orchestrator's, and 157-04 made the same call for the same reason. The substantive argument specific to this plan is the wire-payload identity measured above: no existing caller supplies `electionRound`, `JSON.stringify` drops the `undefined` key, and the serialized RPC argument object is byte-identical to before for every existing read path. The only other change is the `''`-handling difference, shown unreachable at all three call sites. This is a claim about the diff, not a substitute for the gate — if the orchestrator wants it closed, the run is `yarn db:reset` + one fresh dev server on :5173 + `yarn test:e2e`.
- **`yarn db:lint:sql`**, per the standing instruction (exit 1 since Phase 151 on pre-existing plpgsql advisories). This plan's diff contains no SQL.
- **Anything touching the database**, per the standing instruction.

## Known Stubs

None. No placeholder values, no `TODO`/`FIXME` markers, no skipped or `.todo` tests, no unwired path. The helper is four lines and fully exercised; both provider call sites are live; `p_election_round` is forwarded on every call.

## Threat Flags

None — no new security surface. The plan's `<threat_model>` dispositions, each verified:

- **T-157-12 (denial of service, fan-out multiplication):** mitigated and *tested*, not just typed. `electionRound` is a scalar (compile probe above), and a unit test asserts 2 elections x 2 constituencies x round 1 = exactly **4** RPC calls, not 8.
- **T-157-13 (tampering, conflating an empty filter with no filter):** mitigated. `convertFilterValue([])` → `[]` and `convertFilterValue(undefined)` → `[null]`, both asserted, plus a direct `.not.toEqual()` contrast assertion so a later simplification that merged them would fail loudly. The refactor in fact *strengthens* this by removing the old truthiness branch, which conflated `''` with no-filter.
- **T-157-07 (tampering, RPC parameter handling):** accepted, unchanged. Values remain named, typed RPC arguments (`uuid`, `integer`) against a `LANGUAGE sql` body with no dynamic statement.
- **T-157-SC (supply chain):** zero packages installed. `yarn.lock` and every `package.json` are untouched by this plan's diff — `git diff --name-only 82699c6c7~1 HEAD` lists six files, all under `apps/frontend/src/lib/api/`.

The adapter-boundary ESLint guard from 157-15 did not fire: the new helper lives under `src/lib/api/adapters/**` (allowlisted by construction) and imports no `@supabase/*` package and touches no `.supabase` member. Its own 82-assertion self-test is part of the 897 passing.

## Self-Check: PASSED

- `apps/frontend/src/lib/api/adapters/supabase/utils/convertFilterValue.ts` — FOUND
- `apps/frontend/src/lib/api/adapters/supabase/utils/convertFilterValue.test.ts` — FOUND
- `apps/frontend/src/lib/api/base/getDataFilters.type.ts` — FOUND (modified)
- `apps/frontend/src/lib/api/base/getDataOptions.type.ts` — FOUND (modified)
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` — FOUND (modified)
- Commits `82699c6c7`, `423f01d5b`, `e72202b6d`, `497a5c4d9`, `ae028b448` — all FOUND
- No tracked file deleted across any of the five commits — CONFIRMED
- `STATE.md` and `ROADMAP.md` — NOT touched, per the orchestrator's instruction that it owns those writes
