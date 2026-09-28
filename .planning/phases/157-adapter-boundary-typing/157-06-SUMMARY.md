---
phase: 157-adapter-boundary-typing
plan: 06
subsystem: frontend
tags: [adapter, supabase, rpc, jsonb, typescript, filters, tdd, refactor]

requires:
  - phase: 157-adapter-boundary-typing
    plan: 04
    provides: "the applied public.get_questions(uuid, uuid, integer) and its regenerated Args entry in packages/supabase-types/src/database.ts — the compile-time call contract this plan calls against"
  - phase: 157-adapter-boundary-typing
    plan: 05
    provides: "convertFilterValue, the named scalar-or-array conversion for RPC fan-outs, and FilterByElectionRound"
provides:
  - "SupabaseDataProvider._getQuestionData rewritten onto .rpc('get_questions', ...) — one call per (election, constituency) pair, no table round trips, no client-side election filter"
  - "GetQuestionsOptions extended to all three RPC filter axes, composed exactly like GetNominationsOptions"
  - "GetQuestionsPayload, the named jsonb payload type, and bySortOrderThenId — the single trust-boundary cast that 157-07's zod parse replaces"
  - "a measured post-plan cast baseline for supabaseDataProvider.ts: 61 lines match ' as ', 87 token occurrences, of which 4 are prose (83 real casts)"
affects: [157-07, 157-08, 157-18, 160-sql-lint, 164-nullability-audit]

actuals:
  tokens: 13488
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "A single named payload type plus one `as` at the jsonb boundary, rather than a cast per field read — the one place a later zod parse has to land."
    - "Fan out over every FilterValue axis the RPC types as a scalar, then union the payloads by row id; the union is what reproduces OR-over-the-array semantics against a scalar SQL parameter."
    - "When SQL filters two related result sets independently, the adapter must re-impose referential integrity between them, because independent filtering can return a child whose parent was excluded."

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/api/base/getDataOptions.type.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts

key-decisions:
  - "The plan's 'take the first element of an array electionId' instruction was NOT followed. It ships a nondeterministic loss of questions for multi-election candidates, and the sibling _getNominationData carries an in-file comment recording that this exact shape already shipped, broke variant-constituency.spec.ts:237, and had to be undone. Fan-out plus union was implemented instead."
  - "Deleting the .in('category_id', categoryIds) narrowing wholesale, as the plan instructs, orphans questions and crashes the question flow with DataNotFoundError. The buggy length > 0 guard was deleted; the category-membership constraint it carried was restored as an unconditional filter on the unioned payload."
  - "The jsonb_array_length residual IS reachable through this plan, but it was equally reachable before it — the old client-side filter threw TypeError on the same rows via the same call sites. The reachable COLUMN surface widens from 1 to 2 today (6 once callers use the new axes). Filed, not hardened."
  - "The plan's Task 1 acceptance greps (grep -c 'constituencyId' / 'electionRound' in getDataOptions.type.ts) are unsatisfiable alongside its own 'compose from the existing filter types' instruction, exactly as in 157-05. Verified by compile probe instead."

patterns-established:
  - "Before accepting a plan's 'narrow an array to its first element' instruction, grep the sibling method for a comment recording whether that shape has already been tried and reverted. Here the answer was in the same file, nine methods up."
  - "When a rewrite moves filtering from the client to SQL, enumerate what the deleted client-side code did BESIDES filtering. The .in('category_id', ...) call was 10% filter and 90% referential-integrity constraint, and only the filter half was replaced by the RPC."

requirements-completed: [REVIEW-ADP-03]

coverage:
  - id: D1
    description: "_getQuestionData issues get_questions RPC calls instead of two from(...).select('*') round trips, and no table query survives on the question read path."
    requirement: REVIEW-ADP-03
    verification:
      - kind: unit
        ref: "supabaseDataProvider.test.ts 'issues exactly one RPC call per read and no table query' — toHaveBeenCalledTimes(1) on the rpc mock plus expect(mockSupabase.from).not.toHaveBeenCalled()"
        status: pass
      - kind: other
        ref: "grep -c \"rpc('get_questions'\" = 1; grep -c \"from('question_categories')\" = 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Election, constituency and election-round filtering happens in SQL; the client-side category filter and its runtime-only electionIds cast are gone."
    requirement: REVIEW-ADP-03
    verification:
      - kind: other
        ref: "grep -c 'categories.filter(' = 0; grep -c 'electionIds?: Array<string>' = 0"
        status: pass
      - kind: unit
        ref: "supabaseDataProvider.test.ts 'forwards electionId to the RPC and does not re-filter the payload client-side' — a category the mock returns scoped to e2 survives a read filtered on e1, which a surviving client-side filter would have dropped"
        status: pass
    human_judgment: false
  - id: D3
    description: "All six shape fixups survive with their rationale comments, including the untrusted-JSONB min/max guard."
    requirement: REVIEW-ADP-03
    verification:
      - kind: unit
        ref: "The nine pre-existing question assertions all pass unchanged against the RPC-backed path (58 -> 60 tests in the file, 0 failing), plus new cases for the category_type default, the allowOpen bridge, choice localisation and the non-numeric min/max drop"
        status: pass
      - kind: other
        ref: "grep -c \"typeof customData.min === 'number'\" = 1; grep -c 'allow_open' = 2; grep -c 'LocalizedChoice' = 2"
        status: pass
    human_judgment: false
  - id: D4
    description: "The empty-category-list full-table read is gone: an empty filtered category list now yields zero questions rather than every question in the table."
    requirement: REVIEW-ADP-03
    verification:
      - kind: unit
        ref: "supabaseDataProvider.test.ts 'returns no questions when the filter leaves no categories' — categories [] with a non-empty questions payload returns 0 questions"
        status: pass
    human_judgment: false
  - id: D5
    description: "A multi-element electionId array is not narrowed to its first element; the fan-out unions the payloads and deduplicates by row id."
    verification:
      - kind: unit
        ref: "supabaseDataProvider.test.ts 'fans out over election and constituency arrays and merges the results by id' — 2 x 2 = 4 calls, identical payloads deduplicated to 1 category and 1 question"
        status: pass
      - kind: other
        ref: "compile probe: { electionId: ['e1','e2'], constituencyId: ['c1','c2'] } accepted, { electionRound: [1,2] } rejected with \"Type 'number[]' is not assignable to type 'number'.\" — exactly 1 error over 2692 files"
        status: pass
    human_judgment: false
  - id: D6
    description: "A question whose category the RPC filtered out is dropped, so no orphan reaches DataRoot."
    verification:
      - kind: unit
        ref: "supabaseDataProvider.test.ts 'drops a question whose category the RPC filtered out' — a question with category_id 'cat2' is dropped when only 'cat1' survives"
        status: pass
    human_judgment: false
  - id: D7
    description: "The voter question flow still renders end to end."
    verification:
      - kind: e2e
        ref: "NOT RUN — the gate needs db:reset plus an e2e seed and this plan was forbidden from touching the database. Filed to the WINDOWS ledger as an unrun-verify for 157-18."
        status: deferred
    human_judgment: true
  - id: D8
    description: "The tree's standing gates are green and the class-4 nullability casts Phase 164 owns are untouched."
    verification:
      - kind: other
        ref: "yarn lint:check exit 0, frontend '✖ 1 problem (0 errors, 1 warning)'; yarn format:check exit 0; yarn test:unit 25/25 (frontend 917, app-shared 79); yarn build 14/14; typecheck 2691 files 0 errors"
        status: pass
      - kind: other
        ref: "cast inventory diff over the whole file: -2 real casts, +1 -1 substitution; every removed cast is inside _getQuestionData and none is a RETURNS TABLE nullability compensation"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-08-30
status: complete
---

# Phase 157 Plan 06: The get_questions Read Path Summary

**`_getQuestionData` now reads categories and questions from one `get_questions` jsonb payload with all three filters applied in SQL — and the rewrite caught two defects that following the plan literally would have shipped: a nondeterministic loss of questions for multi-election candidates, and a `DataNotFoundError` crash from orphaned questions that is reachable in the e2e dataset today.**

Frontend unit suite **906 -> 917**, `supabaseDataProvider.test.ts` **49 -> 60**, casts in the provider **62/88 -> 61/87** raw (**85 -> 83** excluding prose), every standing gate green.

## Performance

- **Duration:** ~15 min (started 2026-08-30T18:01:36Z)
- **Tasks:** 3 of 3
- **Commits:** 4
- **Files:** 3 modified, exactly the three in `files_modified` — no scope drift

## Task Commits

| # | Task | Commit | Type |
|---|------|--------|------|
| 1 | Extend `GetQuestionsOptions` to the three filter axes | `2318e310c` | `feat` |
| 3a | RED — nine failing cases against the RPC payload | `243e8fa35` | `test` |
| 2 | GREEN — the rewrite, plus the nine pre-existing tests migrated to the RPC mock | `ef9b0f0f3` | `feat` |
| 2b | Drop questions whose category the RPC filtered out | `801833b1e` | `fix` |

**Task ordering deviates from the plan's 1-2-3**, deliberately. Task 2 breaks nine pre-existing tests the moment the data source moves, so committing it before Task 3 would have meant a red commit. Running Task 3's RED first produced a genuine red (9 failed / 49 passed, all nine failing at the assertion because `rpc` was never called — no test passed unexpectedly) and let the implementation land as a single green commit. **TDD gate sequence:** `test(...)` at `243e8fa35` -> `feat(...)` at `ef9b0f0f3`. The `fix(...)` at `801833b1e` is its own RED-then-GREEN pair within one commit (both orphan cases were written and observed failing before the one-line filter was added).

---

## THE VERDICT THE ORCHESTRATOR ASKED FOR: `jsonb_array_length` reachability

**This plan sits on the reachable side of the line 157-04 drew — but so did the code it replaces, through the same call sites and on the same rows. The change moves the failure from the client to the database and gives it a better message. It does, however, widen the reachable COLUMN surface.**

Measured, not argued.

### It is reachable

`get_questions` guards all three axes on both tables with `jsonb_array_length`:

```
$ awk '/CREATE OR REPLACE FUNCTION public.get_questions/,/^\$\$;/' \
    apps/supabase/supabase/schema/505-question-rpcs.sql | grep -c jsonb_array_length
6
```

Those six are `qc.election_ids`, `qc.constituency_ids`, `qc.election_rounds` and the same three on `q`. All six columns are bare `jsonb` (`103-questions.sql:20,48` and the `question_categories` block above it) with **no `CHECK` constraint anywhere in `schema/`** and no validation trigger — the only trigger on `questions` validates `choices`. Confirmed independently of 157-04.

Four of this plan's six call sites pass a non-NULL `electionId`, which is the condition 157-04 measured as necessary for the raise:

| Call site | passes |
|---|---|
| `(voters)/(located)/+layout.ts:91` | `electionId` (`Id \| Array<Id>`) — **non-NULL** |
| `candidate/(protected)/+layout.server.ts:76` | `electionId` (`Array<Id>`) — **non-NULL** |
| `lib/admin/utils/loadElectionData.ts:35` | `electionId` (`Id`) — **non-NULL** |
| `(voters)/nominations/+layout.ts:35` | `locale` only — all-NULL, short-circuits |
| `admin/(protected)/argument-condensation/+layout.ts:16` | `locale` only — all-NULL, short-circuits |
| `admin/(protected)/question-info/+layout.ts:16` | `locale` only — all-NULL, short-circuits |

So on a malformed row the three scoped call sites get `ERROR: cannot get array length of a non-array` (SQLSTATE `22023`) -> PostgREST error -> `throw new Error('getQuestionData: ...')` -> the loader's `.catch(e => e)` -> `isValidResult` fails -> error page. **What the user sees: the question flow does not render at all**, for every user, not just for the malformed row.

### But it is not a regression

The code being replaced fails on the identical input:

```js
const catElectionIds = { round: 1 };
!catElectionIds || catElectionIds.length === 0 || catElectionIds.some(...)
// TypeError: catElectionIds.some is not a function
```

`{round: 1}` is truthy, `.length` is `undefined` so `=== 0` is false, and `.some` is not a function. The old client-side filter therefore **threw** on exactly the same rows, gated by exactly the same condition (`if (options?.electionId)` — the same three call sites), and reached the same error page. The unscoped three call sites never touched `electionIds` before and now pass all-NULL parameters that Postgres short-circuits, so they were immune before and remain immune.

### What DOES change: the column surface widens

The old client-side filter only ever read **`question_categories.election_ids`**. The RPC evaluates all six columns. Today no caller passes `constituencyId` or `electionRound` to `getQuestionData`, so the surface reachable **right now** goes from **1 column to 2** — `questions.election_ids` is newly able to trip it. The remaining four become reachable the moment a caller uses the new option axes this plan added. That is a genuine, if narrow, widening and it is this plan's doing.

### Disposition

**Not hardened — filed.** Hardening is a contract change to SQL owned by `157-03`, applied to the database, and pinned by two 157-04 pgTAP assertions that would fail loudly on the change. That is the Rule 4 call 157-04 already made and the orchestrator explicitly told me not to pre-empt. 157-04's recommendation stands unaddressed and I second it: `CHECK (jsonb_typeof(...) = 'array')` on all six columns, Phase 160 or 164, then update section 12 of `11-question-rpcs.test.sql`. Recorded in `.planning/WINDOWS.md` as a `deviation` entry against `505-question-rpcs.sql:35`.

---

## The two defects the plan would have shipped

### 1. "Take the first element" — the anti-pattern this file already reverted once

The plan's Task 1 says: *"If an existing caller already passes an array `electionId`, keep accepting it and normalise with `convertFilterValue`, taking the first element and recording that narrowing in the SUMMARY — do not silently drop the extra values."* The hedge ("If an existing caller already passes an array") shows the plan did not know whether one did.

**One does, and the loss is nondeterministic.** `candidate/(protected)/+layout.server.ts:60-63` builds `electionId` as `removeDuplicates(nominations.map(n => n.electionId))` — a genuine multi-element array for any candidate nominated in more than one election. Measured against the e2e dataset:

```
candidates with nominations: 30
candidates in >1 election:    2
   test-e2e-base-ca-aa-special   el-reg, el-mun
   test-e2e-base-ca-independent  el-reg, el-mun
```

`ca-aa-special` is the partial-answer candidate the voter journey's 4-case coverage matrix is built around. For those two candidates `[0]` is whichever election the nominations query happened to return first, so the questions they lose vary run to run. `(voters)/(located)/+layout.ts` is also exposed: `electionId` is declared `Id | Array<Id>`, `parseParams` treats it as an array param ("AVAILABLE-multi", `parseParams.ts:30`), and `getImpliedElectionIds` returns every election when `appSettings.elections.disallowSelection` is set.

**The decisive evidence was nine methods up in the same file.** `_getNominationData` carries this comment, from the fix that undid the same shape:

> *"Picking `[0]` only — the prior shape — silently dropped the other elections' nominations and broke the multi-election partial-coverage dialog gate (variant-constituency.spec.ts:237)."*

**Resolution: fan out and union**, using `convertFilterValue` — the helper 157-05 built one plan earlier and described as "the single named scalar-or-array conversion for RPC fan-outs" — in the identical `flatMap`/`map` shape as `_getNominationData`. `electionRound` stays scalar, so the fan-out stays two-dimensional (T-157-12 preserved, proven by compile probe and by the 2x2x1 = 4-call unit test).

The union is semantically exact, not approximate: each call returns *unscoped rows + rows scoped to X*, so the union over `[A, B]` is *unscoped + scoped-to-A + scoped-to-B*, which is precisely what the deleted client-side `filterElectionId.includes(eid)` computed. The three alternatives were considered and rejected: `[0]` loses data; passing NULL when the array has >1 element widens the read to elections the caller is not scoped to; widening `p_election_id` to `uuid[]` is a change to SQL that is applied, published and pgTAP-pinned.

Because the option type keeps `FilterValue<Id>`, **no call site needed to change** — which is also why the strictly-scalar alternative was never viable: it would not have compiled against the candidate layout.

### 2. Deleting `.in('category_id', categoryIds)` orphans questions, and an orphan crashes

The plan says: *"DELETE the conditional `.in('category_id', categoryIds)` narrowing. Its `categoryIds.length > 0` guard meant an empty filtered category list read the entire questions table; the RPC filters questions itself, so the branch has nothing to guard."*

The premise "the RPC filters questions itself" is true but **incomplete**. The RPC filters questions on *their own* columns. That is not the same as filtering them *by surviving category*, and the difference runs in the dangerous direction: a question whose own filter columns are NULL survives a filter that excludes its category.

`Question.category` (`packages/data/src/objects/questions/base/question.ts:62`) resolves through `DataRoot.getQuestionCategory` -> `getChild`, which is:

```ts
if (!res) throw new DataNotFoundError(`Child in collection ${collection} with id ${id} not found`);
```

**Reachable in the e2e dataset as it stands.** `QG-Opin-EL-Reg` carries `_elections: ['test-e2e-base-el-reg']`; its question `QU-Opin-EL-Reg-1` carries none — the template comment says so explicitly: *"The category itself carries election_ids via `_elections` (above); the question inherits scoping via its category."* A voter selecting the **municipal** election therefore gets:

- categories: `QG-Opin-EL-Reg` excluded (`[el-reg] @> el-mun` is false)
- questions: `QU-Opin-EL-Reg-1` **included** (its own `election_ids` is NULL = applies to all)

-> an orphan -> `DataNotFoundError` the moment anything reads its category. The old `.in('category_id', categoryIds)` made this unreachable. 157-04's pgTAP section 10 covers the opposite direction only ("a question is excluded by its OWN election_ids while its category survives"), so nothing upstream would have caught it.

**Resolution:** delete the buggy `length > 0` *guard* (the plan's actual grievance, and criterion 4), keep the *constraint* it carried, as an unconditional filter on the unioned payload:

```ts
const questions = [...questionRows.values()]
  .filter((row) => categoryRows.has(row.category_id))
```

This is not the prohibited "client-side filter as a safety net" — that prohibition is about re-applying the election/constituency/round filter on top of the RPC, and its acceptance grep (`categories.filter(` = 0) still reads 0. This is referential integrity between two independently-filtered result sets. With it, an empty category list yields **zero** questions, which is the correct reading of criterion 4 and the exact inverse of the bug.

---

## What the rewrite looks like

`supabaseDataProvider.ts:476-548`, plus module-level types at `:37-63`.

```ts
const electionIds = convertFilterValue(options?.electionId);
const constituencyIds = convertFilterValue(options?.constituencyId);
const electionRound = options?.electionRound;

const results = await Promise.all(
  electionIds.flatMap((eid) =>
    constituencyIds.map((cid) =>
      this.supabase.rpc('get_questions', {
        p_election_id: eid ?? undefined,
        p_constituency_id: cid ?? undefined,
        p_election_round: electionRound
      })
    )
  )
);
```

Named arguments, per 157-04's instruction (the generator sorts `Args` alphabetically while the SQL positional order differs). `?? undefined` rather than `?? null` for the same reason 157-05 recorded: the regenerated type is `p_election_id?: string`, which does not admit `null`, and `JSON.stringify` drops the key so the SQL `DEFAULT NULL` applies.

Three supporting declarations were added at module scope rather than in a new file, to stay inside `files_modified`:

- `GetQuestionsPayload` — the named jsonb shape, with `Tables<'question_categories'>` / `Tables<'questions'>` rows, which is accurate because the function aggregates `to_jsonb(qc)` and therefore emits the same snake_case columns `select('*')` did.
- `bySortOrderThenId` — reapplies the RPC's own `sort_order NULLS LAST, id` ordering after the union. A single-call read already arrives sorted; without this a multi-election read would be served in call order. Rule 2 addition, since the deleted code carried a global `.order('sort_order')`.
- `QuestionCategoryRow` / `QuestionRow` aliases.

### The six shape fixups, all preserved

1. `type: row.category_type ?? 'opinion'` — comment intact.
2. `parseStoredImage` on both categories and questions — both `// reason:` comments intact.
3. Choice-label localisation — **improved**: `row.choices as Array<LocalizedChoice> | null` replaces the 5-line inline `Array<{ id; label; [k: string]: unknown }>` declaration, and because `LocalizedChoice.label` is `LocalizedString | string`, the `typeof === 'object'` guard narrows it and `getLocalized(choice.label, ...)` compiles with **no cast at all** — the inner `as Record<string, string>` is gone.
4. `customData.allowOpen` bridge from `allow_open`, including explicit-JSONB-wins precedence — comment intact.
5. The `type === 'number'` min/max lift with the non-numeric drop guard — comment intact, and now asserted directly (see below).
6. Explicit discriminant naming for `AnyQuestionVariantData` — comment intact.

### Cast accounting

The plan's `<output>` asks for the remaining ` as ` count. **Re-measured rather than assumed**, per the orchestrator's instruction — and 157-05's recorded figure was correct this time, no drift:

| Point | Lines matching `' as '` | Token occurrences | of which prose | real casts |
|---|---|---|---|---|
| 157-05's recorded baseline | 62 | 88 | — | — |
| Measured immediately before this plan | **62** | **88** | 3 | **85** |
| After this plan | **61** | **87** | 4 | **83** |

The raw delta is −1/−1 but the *real* delta is **−2**, because one new prose ` as ` entered a comment. The inventory diff is exact:

```
<   18  as Record<string          >   16  as Record<string
<    1  as QuestionCategoryData & { electionIds?: Array<string> | null }
<    1  as Array<{                 >    1  as Array<LocalizedChoice> | null
                                   >    1  as GetQuestionsPayload | null
```

- **−1** `choice.label as Record<string, string>` (dissolved by `LocalizedChoice`)
- **−1** `row as Record<string, unknown>` on the category `toDataObject` call — the RPC row types satisfy `Record<string, unknown>` directly, verified by removing the cast and re-running typecheck clean
- **−1** `cat as QuestionCategoryData & { electionIds?: ... }`, the runtime-only field cast the plan asked to delete
- **−1 +1** the inline choices shape becomes `Array<LocalizedChoice>`
- **+1** `data as GetQuestionsPayload | null` — the single jsonb trust boundary, deliberately one site so `157-07`'s `safeParse` has exactly one place to land

**No class-4 nullability cast was touched.** Every removed cast is inside `_getQuestionData`; none compensates for `RETURNS TABLE` nullability, and `get_questions` returns jsonb precisely so it adds none. Phase 164's surface is unchanged.

## Question-read callers, for 157-18's gate

| Caller | Options passed | Cardinality |
|---|---|---|
| `routes/(voters)/(located)/+layout.ts:91` | `electionId`, `locale` | `Id \| Array<Id>` — **can be multi** |
| `routes/candidate/(protected)/+layout.server.ts:76` | `electionId`, `locale` | `Array<Id>` — **measured multi for 2 of 30 e2e candidates** |
| `lib/admin/utils/loadElectionData.ts:35` | `electionId`, `locale` | `Id` scalar |
| `routes/(voters)/nominations/+layout.ts:35` | `locale` | unscoped |
| `routes/admin/(protected)/argument-condensation/+layout.ts:16` | `locale` | unscoped |
| `routes/admin/(protected)/question-info/+layout.ts:16` | `locale` | unscoped |

Plumbing that forwards but does not construct options: `base/universalDataProvider.ts:52`, `base/dataProvider.type.ts:70`, `adapters/apiRoute/dataProvider/apiRouteDataProvider.ts:38`, `server/api/adapters/local/dataProvider/localServerDataProvider.ts:103`.

**The two routes 157-18 must watch are the first two**, because they are the only ones whose behaviour this plan changes (fan-out, and the orphan drop on the municipal election).

## Test coverage

`supabaseDataProvider.test.ts`: **49 -> 60 tests**, all passing.

**Nine pre-existing question assertions kept — this is the parity evidence.** Only their data source moved, from `_mockResponses['question_categories'] / ['questions']` to `_mockRpcResponses['get_questions']`; every `expect` is byte-identical:

`returns { categories, questions } arrays` · `maps category_type to type on categories` · `localizes name, short_name, info on both categories and questions` · `localizes choice labels in choice-type questions` · `passes through settings, electionIds, constituencyIds, entityType` · `bridges the allow_open column into customData.allowOpen` · `bridges custom_data.min/max into top-level min/max for number questions only` · `converts image fields via parseStoredImage`

**One pre-existing test changed, necessarily.** `filters categories by electionId (including categories with null/empty electionIds)` asserted the client-side filter this plan deletes; its premise moved into SQL. It is now `forwards electionId to the RPC and does not re-filter the payload client-side`, and it is *stronger*: the mock deliberately returns a category scoped to `e2` during a read filtered on `e1`, so the assertion that all three categories come back is the direct negative test for the "MUST NOT reintroduce a client-side filter" prohibition.

**Eleven new cases** (nine in the RED commit, two with the orphan fix): payload shape · single-call-and-no-table-query · three-parameter forwarding under `p_` names · fan-out arity and union dedup · `category_type` null defaults to opinion · **non-numeric `custom_data` min/max dropped rather than coerced** (genuinely new — the pre-existing number test covers absent values and non-number rows, but never a non-numeric *value*) · `allowOpen` bridge · choice localisation to `fi` · RPC error throws · orphan question dropped · empty category list yields zero questions.

## Deviations from Plan

### 1. [Rule 1 — Bug] The array-narrowing instruction was not followed

- **Found during:** Task 1, grepping callers as the plan instructs
- **Issue:** `[0]` narrowing loses questions nondeterministically for the two measured multi-election e2e candidates; the sibling method's own comment records that this shape already shipped and broke `variant-constituency.spec.ts:237`.
- **Fix:** fan out over the array and union by row id, mirroring `_getNominationData`.
- **Committed in:** `ef9b0f0f3`
- **Criterion I could not meet as worded:** the plan's must-have truth *"issues ONE `get_questions` RPC call"* and Task 3's *"called exactly once per read"*. Both hold for every caller passing at most one election and one constituency — which is five of the six call sites and both plan-mandated assertions, and is asserted (`toHaveBeenCalledTimes(1)`). For a multi-element array it is one call per pair, asserted separately at 4. The threat-register intent behind the criterion (T-157-16, guarding against a reintroduced second round trip) is fully met: `expect(mockSupabase.from).not.toHaveBeenCalled()`.

### 2. [Rule 1 — Bug] The `.in('category_id', ...)` deletion was partial, not wholesale

- **Found during:** post-implementation semantic review of what the deleted code did besides filtering
- **Issue:** orphaned questions crash with `DataNotFoundError`; reachable today in `e2e/base` on the municipal election.
- **Fix:** the `length > 0` guard deleted (criterion 4 satisfied and inverted correctly), the category-membership constraint restored unconditionally.
- **Committed in:** `801833b1e`

### 3. [Rule 3 — Blocking] Task 1's acceptance greps are unsatisfiable

- **Issue:** `grep -c 'constituencyId'` and `grep -c 'electionRound'` on `getDataOptions.type.ts` both return **0**, and must, because the same task instructs "Compose from the existing filter types rather than re-declaring field shapes" — composition puts the field names in `getDataFilters.type.ts`. Identical to 157-05's deviation 3.
- **Fix:** verified by the stronger instrument 157-05 established, a throwaway compile probe: `{ electionId: 'e1', constituencyId: 'c1', electionRound: 2 }` and `{ electionId: ['e1','e2'], constituencyId: ['c1','c2'] }` compile clean; `{ electionRound: [1, 2] }` fails with `Type 'number[]' is not assignable to type 'number'.` — exactly 1 error over 2692 files. Probe deleted. Composition greps: `FilterByConstituency` = 3, `FilterByElectionRound` = 3.

### 4. [Ordering] Task 3's RED ran before Task 2

- Committing Task 2 first would have meant a red commit, since nine pre-existing tests break the moment the data source moves. See "Task Commits" above. Both tasks' `<verify>` are green at their completion points.

### 5. [Rule 2] `bySortOrderThenId` added

- The deleted queries carried `.order('sort_order')`. A `Map`-based union preserves insertion order, which is call order across a fan-out. Sorting restores the RPC's own `sort_order NULLS LAST, id` contract deterministically.

---

**Total deviations:** 2 correctness fixes to plan instructions that would have shipped user-visible defects, 1 unsatisfiable-criterion substitution, 1 ordering change, 1 additive ordering guard. **Impact on scope:** none — all three planned artifacts produced, exactly the three declared files touched.

## Issues Encountered

**The plan's most dangerous instruction had its own refutation in the same file.** The `[0]`-narrowing advice sits nine methods above a comment explaining that `[0]` narrowing already shipped, broke a named E2E spec, and was reverted. Grepping the sibling method before accepting a "narrow the array" instruction cost one command and caught a nondeterministic data-loss bug.

**"The RPC filters X itself" is not equivalent to "the client-side code that filtered X is redundant."** The `.in('category_id', ...)` call was doing two jobs and the RPC replaces one of them. This is the second defect in this plan of the same shape — a rewrite premise that is true about the filter and silent about everything else the deleted code guaranteed.

**Two `as unknown as` casts I wrote were unnecessary.** `Tables<'question_categories'>` and `Tables<'questions'>` satisfy `toDataObject`'s `Record<string, unknown>` constraint directly. Measured by deleting them and re-running typecheck rather than by reasoning. Worth noting because the *old* code carried `row as Record<string, unknown>` on the category call, so that cast had been unnecessary all along.

**No build recovery needed.** `yarn build` succeeded first time, 14/14. **No database was touched** — no `db:reset*`, no `db:types`, no pgTAP, no `db:lint:sql` (which exits 1 pre-existing since phase 151, and this plan's diff contains no SQL).

**`yarn format:check` is clean.** The three files 157-05 flagged as unformatted have been repaired by another plan since; both prettier passes report "All matched files use Prettier code style!".

## Verification Performed

| Gate | Command | Result |
|------|---------|--------|
| Provider unit tests | `yarn workspace @openvaa/frontend test:unit --run supabaseDataProvider` | **`Tests 60 passed (60)`** (was 49) |
| Frontend unit suite | `yarn workspace @openvaa/frontend test:unit` | **55 files, `917 passed`** — 906 baseline + 11 |
| Monorepo unit suite | `yarn test:unit` | **exit 0, `Tasks: 25 successful, 25 total`**; app-shared **79 passed** (baseline) |
| Frontend typecheck | `yarn workspace @openvaa/frontend typecheck` | **`COMPLETED 2691 FILES 0 ERRORS 0 WARNINGS`** |
| Lint and all 12 guards | `yarn lint:check` | **exit 0**; frontend `✖ 1 problem (0 errors, 1 warning)` — the stated clean signature, warning pre-existing at `candidateContext.svelte.test.ts:19` |
| Comment hygiene (post-commit) | inside `lint:check` | **1580 files scanned, 0 violations** — run AFTER committing, so it actually scanned this plan's files |
| Formatting | `yarn format:check` | **exit 0**, both workspaces "All matched files use Prettier code style!" |
| Build | `yarn build` | **exit 0, `Tasks: 14 successful, 14 total`** |
| Schema-migration parity | inside `lint:check` | **unmoved**: 25 files -> 3424 lines, 7 hunks, 91 signature lines |
| Task 2 greps | `grep -c` on the provider | `rpc('get_questions'` = **1** ✅ · `from('question_categories')` = **0** ✅ · `categories.filter(` = **0** ✅ · `electionIds?: Array<string>` = **0** ✅ · `LocalizedChoice` = **2** (≥1 ✅) · `allow_open` = **2** ✅ · `typeof customData.min === 'number'` = **1** ✅ |
| Scalar prohibition | throwaway `tsc` probe | array `electionRound` rejected; scalar and array election/constituency accepted; probe deleted |
| No accidental deletions | `git diff --diff-filter=D --name-only 2318e310c~1 HEAD` | **empty** |
| Scope | `git diff --name-only 2318e310c~1 HEAD` | **3 files**, exactly `files_modified` |

**Not run:**

- **The E2E suite.** The gate needs `yarn db:reset` plus an `e2e/base` seed and a fresh dev server on `:5173`, and this plan was explicitly forbidden from touching the database. **This is not a "the diff is safe" argument — this plan changes runtime behaviour on a hot read path in two ways** (fan-out union, orphan drop) and both changes are specifically about the multi-election / scoped-category cases the e2e dataset was built to exercise. Recorded in `.planning/WINDOWS.md` as an `unrun-verify` for 157-18. The run is `yarn db:reset` + `yarn db:seed --template e2e/base` + one fresh dev server + `yarn test:e2e`.
- **`yarn db:lint:sql`**, per the standing instruction. No SQL in this diff.

## Known Stubs

None. No placeholder values, no `TODO`/`FIXME`, no skipped or `.todo` tests, no unwired path. Both defects found during execution were fixed in-tree rather than deferred; the one item deliberately left unfixed — the `jsonb_array_length` non-array residual — is pre-existing SQL owned by another phase, pinned by passing 157-04 assertions, and filed in the ledger rather than stubbed.

## Threat Flags

None new. The plan's `<threat_model>` dispositions, each verified:

- **T-157-14 (tampering, `custom_data` -> `NumberQuestionData.min`/`max`):** mitigated and now *directly* asserted. The guard survives verbatim, and a new unit case feeds `{ min: '3', max: { evil: true } }` and asserts both are `undefined` — dropped, never coerced. The pre-existing test never covered a non-numeric value.
- **T-157-15 (information disclosure, over-broad read):** mitigated, and *more* than the plan expected. Filtering moved into the `SECURITY INVOKER` RPC so RLS gates the caller; the `length > 0` branch that read the entire questions table is gone, and a unit case pins empty-in/empty-out.
- **T-157-16 (repudiation, silent client-side filtering):** mitigated by three instruments — `categories.filter(` = 0, `expect(mockSupabase.from).not.toHaveBeenCalled()`, and the inverted filter test that fails if any election filter is re-applied client-side.
- **T-157-SC (supply chain):** zero packages installed; `yarn.lock` and every `package.json` untouched. The diff is three files, all under `apps/frontend/src/lib/api/`.

The 157-15/157-16 adapter-boundary ESLint guard did not fire: the rewritten method lives in the allowlisted adapter and imports no `@supabase/*` package.

**One threat NOT in the register, now closed:** the orphan-question path (defect 2) is an availability defect at the RPC-payload trust boundary — independently-filtered result sets that violate a referential invariant the consuming data model enforces by throwing. Worth adding to the register shape for any future plan that moves a join into SQL.

## Self-Check: PASSED

- `apps/frontend/src/lib/api/base/getDataOptions.type.ts` — FOUND (modified)
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` — FOUND (modified)
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` — FOUND (modified)
- Commits `2318e310c`, `243e8fa35`, `ef9b0f0f3`, `801833b1e` — all FOUND
- No tracked file deleted across any of the four commits — CONFIRMED
- `STATE.md` and `ROADMAP.md` — NOT touched, per the orchestrator's instruction that it owns those writes
