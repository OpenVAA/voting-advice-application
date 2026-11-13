---
phase: 177-define-nominations
plan: 09
subsystem: data-writer
tags: [nominations, data-writer, supabase-adapter, zod, refusals, integration-test, project-scoping-gate]
status: complete
requires:
  - "177-07: public.set_entity_nominations, its keys, its answer and its refusals"
  - "177-06: public.get_nomination_parent_options, and parent.entity_id in get_entity_nominations"
  - "177-05: the cap's message start and SQLSTATE P0001"
  - "177-04: the parent foreign key's refusal, SQLSTATE 23503"
  - "177-08: the data package's entity data types; the gate run 177-08-close"
  - "177-01: 177-gates.sh, 177-verdict.mjs"
provides:
  - "dataWriter.type.ts: NominationParentChoice, DesiredNomination, SetEntityNominationsOptions, SetEntityNominationsResult, NominationContest, NominationParentOption, GetNominationParentOptionsOptions; EntityNominationParent.entityId"
  - "DataWriter / UniversalDataWriter: setEntityNominations(opts), getNominationParentOptions(opts), with protected abstract _setEntityNominations and _getNominationParentOptions"
  - "SupabaseDataWriter: one rpc('set_entity_nominations') and one rpc('get_nomination_parent_options'); the two named refusals as results; entityNominationOf maps parent.entity_id"
  - "utils/nominationParentOptions.ts (parseNominationParentOptions), utils/setEntityNominationsAnswer.ts (parseSetEntityNominationsAnswer); utils/entityNominations.ts requires parent.entity_id"
  - "scripts/assert-project-scoped-queries.mjs: PROJECT_SCOPED_RPCS.set_entity_nominations, .get_nomination_parent_options; the two parse modules in GUARDED_SOURCES"
  - "supabaseDataWriter.integration.test.ts: ten cases of an editor's nominations against the local stack (30 in the file)"
  - "the gate run tests/e2e-runs/177-gates/177-09-close, ten rows green at 11ebf3cfe"
affects: [177-14, 177-15, 177-17, 177-18, 177-21]
tech-stack:
  added: []
  patterns:
    - "a refusal a page can name is a result member, recognised by SQLSTATE plus the start of the message or the name of the constraint; every other failure is thrown with the method's name"
    - "a definer read that answers NULL is narrowed to null and mapped to undefined, never to an empty list"
    - "an integration case reads a refusal twice: through the writer for its result, and through the editor's own client for the code the writer recognises it by"
key-files:
  created:
    - apps/frontend/src/lib/api/adapters/supabase/utils/nominationParentOptions.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/nominationParentOptions.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/setEntityNominationsAnswer.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/setEntityNominationsAnswer.test.ts
  modified:
    - apps/frontend/src/lib/api/base/dataWriter.type.ts
    - apps/frontend/src/lib/api/base/universalDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.test.ts
    - scripts/assert-project-scoped-queries.mjs
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/page.svelte.test.ts"
decisions:
  - "an option's entity is typed OrganizationData | AllianceData, and the parser admits no other entity type: the function answers organizations for a candidate and alliances for an organization"
  - "the parent foreign key's refusal is recognised by SQLSTATE 23503 and the constraint's name anywhere in the message, without the quotes around it"
  - "the two public methods throw synchronously on a target without an id and on a list that is not one, as updateEntityProperties does; an entity type the application does not serve rejects before any request"
  - "the counts of the write's answer are integers and nothing narrower; an answer that cannot be read throws and is never reported as saved"
  - "the entity list's colour mapping and the options' are one function, shownColorsOf"
  - "the two parse modules joined GUARDED_SOURCES of the project-scoping gate, which refuses an adapter source that is in neither of its lists"
requirements-completed: [NOM-04, NOM-05, NOM-06]
metrics:
  started: "2026-10-11T03:01:05Z"
  completed: "2026-10-11T03:25:00Z"
  duration: "24 minutes"
  tasks: 3
  files: 13
actuals:
  tokens: 29495 # chars/4 over git diff d7f6990fe..11ebf3cfe -- apps packages scripts (117,979 characters)
  tasks: 3
  commits: 6 # git rev-list --count d7f6990fe..11ebf3cfe
plan_head_before: d7f6990fe6395ae0a672f0609dafef851ed0ceaf
plan_head_after: 11ebf3cfe0ce83a2c56317ed6399010ef673f28d
---

# Phase 177 Plan 09: The Writer's Nomination Write and Parent-Option Read, Their Types, Parsers and Named Refusals — Summary

The data writer now writes an entity's nominations with one call of `set_entity_nominations` and reads the entities a nomination may be placed under with one call of `get_nomination_parent_options`; two refusals reach the caller as named results (`hasCandidates`, `tooManyPending`), every other failure is thrown, a refused read is `undefined` and never an empty list, and all of it is asserted through the real API against the local stack.

`requirements-completed` names NOM-04, NOM-05 and NOM-06 because the plan's frontmatter does; no page calls either method until plan 177-15. `REQUIREMENTS.md`, `STATE.md` and `ROADMAP.md` were not touched.

## Read this first

- **All three verify blocks exit 0 as written**, and the gate run `177-09-close` is PASS on the final head, the `integration` row at 30 of 30.
- **Research assumption A1 held.** A lone party-less candidate row inserted by the editor's own client into a closed-list election came back as an ordinary error body: HTTP 400, `code` `23514`, message beginning `Nomination parent required: `; no row was stored. *Task 3*.
- **The last stage of Task 3's verify has a defect, and passes for a reason beside its intent.** It searches the integration row's log for `setEntityNominations`, but vitest's default reporter prints no title of a passed test. The search finds the string in one line only: the header vitest prints above the A1 case's recorded output, which carries the describe's title. The stage's intent was run by a command of my own on the row's JSON report: ten cases under that describe, ten passed (exit 0). Both statuses are in *Each task's verify command*. *Deviations*, 4.
- **Two files outside the plan's list of three places were touched**: the project-scoping gate's `GUARDED_SOURCES` gained the two new parse modules (the gate refuses an adapter source in neither of its lists — in the plan's file, but not in its text), and the nominations page's test gained `entityId` in four fixtures (the type gained a required member). *Deviations*, 1 and 2.
- **Six commits, not the plan's five**: one small test commit makes the writer cases assert a call before they read its arguments, so that the expectation-only control is clean. *Deviations*, 3.
- **Both red runs on the committed tests fail partly on absent code, not on expectations** (a missing module; a missing method). An expectation-only control on uncommitted skeletons was run for each, as plan 177-08 did. *Task 1*, *Task 2*.
- **Between the Task 1 commit `527f271b6` and the Task 2 commit `2ee846c45` the tree does not pass `yarn lint:check`**: the type gained `entityId` before `entityNominationOf` mapped it, and the two parse modules were not yet in the scoping gate's list. The plan's order produces the first; the second was found when Task 2 ran the gate. From `2ee846c45` on every gate is green. *Inferred for those commits; the gates were run on the working tree of each task and on the final head, not on each intermediate commit.*
- **No E2E run** closes this plan, by its ruling 3. The gate's reset emptied the local database; the default dataset was seeded again afterwards.

## Task Commits

| Task | Commit | Subject |
|---|---|---|
| 1 (tests, red) | `bb4c13779` | `test(177-09): the answers of the parent options and of the nominations write, narrowed at the adapter` |
| 1 | `527f271b6` | `feat(177-09): the types of a nomination write and of the parent options, and their parsers` |
| 2 (tests, red) | `ac90ca1ef` | `test(177-09): the writer's nomination write and parent-option read` |
| 2 (tests; deviation 3) | `ae078b2d3` | `test(177-09): the writer cases read a call's arguments only after asserting the call` |
| 2 | `2ee846c45` | `feat(177-09): the writer sets an entity's nominations and reads its parent options` |
| 3 | `11ebf3cfe` | `test(177-09): an editor's nominations through the real API — the named refusals, the lock and the parent options` |

## Each task's verify command, with its real exit status

Each `<automated>` block was written byte for byte to a script and run with `bash`.

| Block | Script | Exit | Head |
|---|---|---|---|
| Task 1 | `tests/e2e-runs/177-unit/177-09-t1-verify.sh` | 0 | `527f271b6` |
| Task 2 | `tests/e2e-runs/177-unit/177-09-t2-verify.sh` | 0 | `2ee846c45` |
| Task 3 | `tests/e2e-runs/177-unit/177-09-t3-verify.sh` | 0 | `11ebf3cfe` |
| Task 3, last stage restated: the ten cases under the describe that names `setEntityNominations` are in `177-09-close/integration.json`, each `passed` | `177-09-t3-intent.log` | 0 | `11ebf3cfe` |

## Task 1 — the types and the three parsers

### The types, as written (`apps/frontend/src/lib/api/base/dataWriter.type.ts`)

```ts
export type EntityNominationParent = { entityType: EntityType; entityId: Id; name: string; shortName?: string };

export type NominationParentChoice =
  | { kind: 'none' }
  | { kind: 'entity'; entityType: EntityType; entityId: Id }
  | { kind: 'other'; name: string }
  | { kind: 'keep' };

export type DesiredNomination = {
  id?: Id;
  electionId: Id;
  constituencyId: Id;
  electionSymbol: string;
  parent: NominationParentChoice;
};

export type SetEntityNominationsResult =
  | { type: 'saved'; inserted: number; updated: number; deleted: number; unchanged: number; parentsCreated: number }
  | { type: 'refused'; reason: 'hasCandidates' | 'tooManyPending' };

export type NominationContest = { electionId: Id; constituencyId: Id };

export type NominationParentOption = {
  entity: OrganizationData | AllianceData;
  nominatedIn: ReadonlyArray<NominationContest>;
};

export type SetEntityNominationsOptions = WithTargetEntity & { nominations: ReadonlyArray<DesiredNomination> };

export type GetNominationParentOptionsOptions = WithTargetEntity & {
  contests: ReadonlyArray<NominationContest>;
  locale: string;
};
```

Each has a TSDoc; the result type's lists each `type` and each `reason` and says that nothing of a refused call was stored.

### The parsers

| Module | Function | Outcomes |
|---|---|---|
| `utils/entityNominations.ts` | `parseEntityNominations` | the parent's schema gained `entity_id`, a non-empty string; a parent without it throws naming `<i>.parent.entity_id` |
| `utils/nominationParentOptions.ts` | `parseNominationParentOptions(raw: Json \| undefined): Array<NominationParentOptionRow> \| null` | `null` is `null`; an array of elements of seven members (`id`, `entity_type`, `name`, `short_name`, `color`, `image`, `nominated`) parses, unknown members dropped in an element and in a contest; `entity_type` is `organization` or `alliance` and nothing else; anything else throws `The answer of get_nomination_parent_options did not match its schema at: <paths>` |
| `utils/setEntityNominationsAnswer.ts` | `parseSetEntityNominationsAnswer(raw: Json \| undefined): SetEntityNominationsAnswer` | an object with the five integer counts parses, unknown members dropped; anything else, `null` included, throws `The answer of set_entity_nominations did not match its schema at: <paths>` |

No message holds a stored value: each test file has a case that plants a marker in the refused values and asserts that the message does not contain it.

### The red runs

| Run | Tree | Exit | Result |
|---|---|---|---|
| `177-09-parse-red` | the three test files, no module (head `d7f6990fe`) | 1 | 9 failed, 121 passed, and two files not collected: `Failed to resolve import "./nominationParentOptions"` and `"./setEntityNominationsAnswer"`. The 9 are `AssertionError`s of `entityNominations.test.ts` (the parent's id dropped; a parent without one not refused) |
| `177-09-parse-red-skeleton` | the tests committed (`bb4c13779`), and two uncommitted skeleton modules that answer an empty list and five zeroes (kept as `177-09-parse-red-skeleton.*.ts.kept`) | 1 | 55 failed, 123 passed; every failure an `AssertionError` |
| `177-09-t1-verify` | the modules (`527f271b6`) | 0 | 178 passed in `utils/` |

Observed, not inferred: the counts and the error classes are read from the kept logs. A skeleton that answers nothing answers the "nothing" cases right, so it cannot turn every case red.

## Task 2 — the writer's two methods

### The signatures, as written

`DataWriter` (interface) and `UniversalDataWriter` (public, then protected abstract):

```ts
setEntityNominations(opts: SetEntityNominationsOptions): DWReturnType<SetEntityNominationsResult>
getNominationParentOptions(opts: GetNominationParentOptionsOptions): DWReturnType<Array<NominationParentOption> | undefined>

protected abstract _setEntityNominations(opts: SetEntityNominationsOptions): DWReturnType<SetEntityNominationsResult>;
protected abstract _getNominationParentOptions(opts: GetNominationParentOptionsOptions): DWReturnType<Array<NominationParentOption> | undefined>;
```

- The public methods throw, before any request and synchronously as `updateEntityProperties` does, for a target with no id (`setEntityNominations: the target entity has no id`) and for `nominations` or `contests` that is not an array.
- `SupabaseDataWriter._setEntityNominations` narrows the type with `servedEntityType` (a faction or an alliance rejects with `Unsupported entity type: …` before any request), calls `rpc('set_entity_nominations', { p_entity_type, p_entity_id, p_nominations })` once, and maps each nomination to the function's keys: `id` only when the nomination states one, `election_id`, `constituency_id`, `election_symbol` as given, and `parent` as `{kind}`, `{kind, entity_type, entity_id}` or `{kind, name}`.
- **The two refusals**: `isListedUnderRefusal` — code `23503` and the message contains `nominations_parent_nomination_id_fkey`; `isPendingCapRefusal` — code `P0001` and the message starts `A caller may originate at most `. Each constant's docstring names the schema file and what raises it. Every other error is thrown as `setEntityNominations: <the database's message>`.
- `_getNominationParentOptions` calls `rpc('get_nomination_parent_options', { p_project_id: this.projectId, p_entity_type, p_entity_id, p_contests })` once, with `p_contests` an array of `{ election_id, constituency_id }`; `null` resolves to `undefined`; an error is thrown as `getNominationParentOptions: <message>`.
- `entityNominationOf` maps `parent.entity_id` to `entityId`.
- The writer holds no statement on `nominations` (the verify's search for `from('nominations')` exits 1, as required).

### Every other implementer of the writer

`git grep -n -E "extends UniversalDataWriter|implements DataWriter" -- apps/frontend/src tests` finds one line: `UniversalDataWriter` itself. `SupabaseDataWriter` extends it through `supabaseAdapterMixin(UniversalDataWriter)` and is the only subclass. The store's test builds a fake cast to the class (`contestantUserDataState.svelte.test.ts`), which needs no member it does not call. No other implementer gained the members because there is none.

### The project-scoping gate

`PROJECT_SCOPED_RPCS` gained `get_nomination_parent_options: 'requires p_project_id'` and `set_entity_nominations: 'scoped-by-identity: entity type + entity id + RLS'`, each with a paragraph above the map. Observed: with the two entries removed, the gate exits 1 naming both calls by file and line (`177-09-scoped-probe.log`; the file was restored with `git checkout --`).

### The red runs

| Run | Tree | Exit | Result |
|---|---|---|---|
| `177-09-writer-red` | the test file, no method (head `527f271b6`) | 1 | 57 failed, 160 passed: 44 with `TypeError: writer.… is not a function`, 13 with an `AssertionError` (the parent's id not mapped, and cases that expect a named throw) |
| `177-09-writer-red-skeleton` | the tests committed (`ac90ca1ef`); uncommitted: public methods that check nothing, a write that answers five zeroes without a request, a read that answers an empty list (kept as `177-09-writer-red-skeleton.*.ts.kept`) | 1 | 56 failed; five of the error blocks a `TypeError` of the test itself reading the arguments of a call that was not made |
| `177-09-writer-red-skeleton-r2` | the same skeleton, the cases reading a call's arguments through a helper that asserts the call first (committed as `ae078b2d3`) | 1 | 56 failed, 161 passed; every failure an `AssertionError` |
| `177-09-t2-verify` | the methods (`2ee846c45`) | 0 | 816 passed and 20 skipped under `src/lib/api` |

## Task 3 — through the real API

A describe of its own, with rows of its own written with the service role in the default project: a closed-list election (`organization_list`) and one of the default type, each with a constituency; a confirmed party nominated at the closed-list contest only; a confirmed party with no nomination; an unconfirmed party with an editor and a nomination under which a candidate is listed; an alliance; three candidates with editors; and ten filler organizations whose unconfirmed nominations are recorded as created by one editor. The teardown removes all of it, the rows the cases wrote included, restores the project's settings and fails if anything is left.

| Case | Result |
|---|---|
| a first save with a typed name | `saved`, `inserted: 1`; read back: no parent, `customData.requestedParentOrganization` the trimmed name, the symbol trimmed |
| a save that links a listed party with no nomination at the contest | `saved`, `inserted: 1`, `unchanged: 1`, `parentsCreated: 1`; the party's nomination is unconfirmed and `created_by` the editor; read back: `parent.entityId` is the party's id |
| a second save of the stored set (`other` with the same name, `entity` naming the same party) | `saved`, `unchanged: 2`, nothing else; the stored rows equal what they were |
| an organization's editor removing the nomination a candidate is listed under | `{ type: 'refused', reason: 'hasCandidates' }`; both nominations still there |
| the caller's eleventh unconfirmed parent nomination | `{ type: 'refused', reason: 'tooManyPending' }`; the candidate has no nomination and the party's are what they were |
| under the lock, a save that changes a symbol | rejects `setEntityNominations: set_entity_nominations: a nomination could not be written; nominations are locked …`; the stored symbol unchanged; the lock restored in a `finally`; the same call with the lock off is `saved`, `updated: 1` |
| a candidate's save with `none` in the closed-list election | rejects `setEntityNominations: Nomination parent required: …`; nothing stored |
| a candidate's parent options | hold the confirmed party as `{ type, id, name, shortName }` with `nominatedIn` the one contest of the two asked; every option an organization; the unconfirmed party absent |
| an organization's parent options; an entity the caller does not edit | hold the alliance as `{ type: 'alliance', id, name }`; `undefined` for another editor's candidate and for the organization a candidate stands under |
| a lone party-less row inserted past the writer | error `code` `23514`, message start `Nomination parent required: `; nothing stored |

### What PostgREST answered — observed

The research's status column (RQ-3) was the documentation's. Read through the editors' own clients:

| Refusal | HTTP | `code` | Message | Where observed |
|---|---|---|---|---|
| a removed nomination with a candidate listed under it | 409 | `23503` | `update or delete on table "nominations" violates foreign key constraint "nominations_parent_nomination_id_fkey" on table "nominations"`, with `details` present | code and constraint name: the committed case; status and whole message: a scratch probe |
| the cap | 400 | `P0001` | `A caller may originate at most 10 unconfirmed parent nominations; this caller already holds 10. An administrator must confirm or reject some before more can be created.` | code and start: the committed case; status and whole message: the probe |
| the lock on an update | 403 | `42501` | `set_entity_nominations: a nomination could not be written; nominations are locked or the rows are no longer the caller's` | the probe; the committed case asserts the message through the writer |
| `none` where a parent is required, through the function | 400 | `23514` | begins `Nomination parent required: ` | the probe; the committed case asserts the start through the writer |
| the same rule at the request's own COMMIT (assumption A1) | 400 | `23514` | begins `Nomination parent required: ` | the committed case, which also prints the line into the row's log |
| a refused read of the parent options | 200 | — | `data` null, `error` null | the probe; the committed case asserts `undefined` through the writer |

The probe was a temporary set of `console.info` lines in the integration file, run once and removed before the commit (`177-09-integration-probe.log`); it is an observation, not a test of the suite.

### Four planted defects, each seen caught

A scratch run of the integration file against the writer with four things altered, restored with `git checkout --` (`177-09-integration-mutants.log`): the cap's prefix as the wording before plan 177-05, the foreign key under another name, a refused options read mapped to an empty list, and the parent's entity id not mapped. Five cases red, each the one that names the altered thing; 25 passed.

### Gate rows

`bash $P/177-gates.sh 177-09-close --rows typecheck,lint,db-reset,types-regen,types-clean,integration,unit,check-frontend,build,format`, in the background; head `11ebf3cfe`; `177-verdict.mjs gates 177-09-close --rows …`: **PASS**, not stale, no Sleep entry inside the run window (05:20:16 to 05:23:23 local).

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 19 |
| lint | 0 | 48 |
| db-reset | 0 | 30 |
| types-regen | 0 | 2 |
| types-clean | 0 | 0 |
| integration | 0 | 5 — 30 of 30 |
| unit | 0 | 37 |
| check-frontend | 0 | 9 — 2813 files, 0 errors, 0 warnings |
| build | 0 | 17 |
| format | 0 | 19 |

Unit totals: frontend 3687 passed and 30 skipped (3580 and 20 at `177-08-close`: 107 more passed, and the ten new integration cases skip in the unit run); data 318; dev-seed 1046; app-shared 148; supabase 462 (the last two were not compared with an earlier run). Power: AC, 100 %. Docker VM free space: 17.31 GiB before the gate, 17.27 GiB after.

## For later plans

### For plans 177-14 and 177-15 — the import paths and the exact shape of an option's `entity`

```ts
import type {
  DesiredNomination,
  EntityNomination,
  EntityNominationParent,
  GetNominationParentOptionsOptions,
  NominationContest,
  NominationParentChoice,
  NominationParentOption,
  SetEntityNominationsOptions,
  SetEntityNominationsResult
} from '$lib/api/base/dataWriter.type';
```

The methods are on the writer every caller already holds (`UniversalDataWriter` from `$lib/api/base/universalDataWriter`): `writer.setEntityNominations({ target: { type, id }, nominations })` and `writer.getNominationParentOptions({ target: { type, id }, contests, locale })`.

An option's `entity`, exactly as `nominationParentOptionOf` builds it:

```ts
{
  type: 'organization' | 'alliance',   // organizations for a candidate, alliances for an organization; never mixed
  id: string,
  name: string,                         // localized to `locale`, then the adapter's default locale; '' when no locale holds one
  shortName?: string,                   // left out when not stored
  image?: { url: string; urlDark?: string; alt?: string },   // left out when not stored or malformed
  color?: { normal: string; dark: string }                    // through ensureColors: adjusted for contrast, dark derived; left out when not stored or not a colour
}
```

- No `answers`, `info`, `order`, `customData` or `subtype` is stated: the data root's defaults apply. The object is assignable to `OrganizationData | AllianceData` and so to `provideEntityData`'s argument.
- `nominatedIn` holds `{ electionId, constituencyId }` for the contests **asked about** at which the option is nominated, in the order asked; an option nominated elsewhere only carries `[]`.
- `getNominationParentOptions` resolves to `undefined` for a refused read — the details page's "the options cannot be read" — and to `[]` when the project lists nothing. `locale` is required; there is no default.
- **`keep` is the way to leave a stored link as it is** (177-07's finding stands): the unit and integration cases send `keep` for an unchanged row. `entity` naming the linked party is also `unchanged` where the party holds one nomination at the contest — observed in the integration case.
- `electionSymbol` is a required string; `''` is "no symbol". `id` is stated only for a stored nomination; `id: undefined` is left out of the call.
- The public methods **throw synchronously** on a bad target or a list that is not one; a caller that awaits inside `try` catches both that and a rejection.

### For plan 177-18 — what a refused save looks like

- `refused` carries a `reason` and nothing else. A thrown error's message is `setEntityNominations: ` followed by the database's own text, which can name a row id or a stored value (T-177-39): a page shows its own message and never the error's.
- Under the lock the writer **throws** (`42501`, HTTP 403), for an update, a delete and an insert alike; it is not a named result. `42501` is still four things through this function (177-07); the writer tells none of them apart.
- A candidate left with neither a party nor a typed name where one is required **throws** (`23514`).

### For plan 177-21

- **No sentence of the docs or the skills was found made false by this plan.** The developers' guide and the skills do not mention the two new methods, the two refusals or `EntityNominationParent.entityId`; `apps/docs/…/contestant-app/home-and-tasks/+page.md` (the paragraph "The view reads `contestantCtx.nominations` …") is where a reader would look for the parent's members.
- `177-RESEARCH.md` RQ-3's status column is now observed; the table above holds what came back.
- The header comment of `supabaseDataWriter.integration.test.ts`, item 5, says a candidate "reads one nomination with the organization's type and names"; it now also reads the organization's id. Not false, and left as it is: a further commit would have made the gate run stale.
- The frontend's unit count is now 3687 passed and 30 skipped; the writer integration file holds 30 cases.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The project-scoping gate refused the two new parse modules**
- **Found during:** Task 2, the first run of `yarn assert:project-scoped-queries`
- **Issue:** the gate's check 5 fails on an adapter source that is in neither `GUARDED_SOURCES` nor `DEFERRED_SOURCES`; the plan names the `PROJECT_SCOPED_RPCS` entries only.
- **Fix:** both modules added to `GUARDED_SOURCES`, beside `utils/entityNominations.ts`. The gate's own test (`packages/dev-seed/tests/projectScopingGate.test.ts`) passes, 121 of 121.
- **Files modified:** `scripts/assert-project-scoped-queries.mjs`
- **Commit:** `2ee846c45`

**2. [Rule 3 - Blocking] Fixtures that state a nomination's parent**
- **Found during:** Task 1
- **Issue:** `EntityNominationParent.entityId` is required, and the parent's schema requires `entity_id`. Four fixtures of `nominations/page.svelte.test.ts` (outside the plan's list) no longer typecheck without the member, and three fixtures of `supabaseDataWriter.test.ts` (a Task 2 file) would throw in the parser.
- **Fix:** the member added to each, in the Task 1 commit, so that no committed unit test fails on a fixture. The page test passes unchanged, 27 of 27.
- **Commit:** `527f271b6`

### Other deviations

**3. A sixth commit.** `ae078b2d3` adds `onlyRpcArguments`, a test helper that asserts the client was called once before a case reads the call's arguments. Without it five error blocks of the skeleton control were `TypeError`s of the test itself.

**4. The last stage of Task 3's verify.** `grep -q -F "setEntityNominations" <the integration log>` is true only because the A1 case prints a line and vitest heads it with the case's full path; the default reporter prints `✓ <file> (30 tests)` and no title. The describe's title and the printed line were written for what they say, not for the search. The intent — the cases were collected and ran — is read from `integration.json`: exit 0, ten of ten passed.

**5. `_getUserEntities` was touched.** Its three lines that turn a stored colour into the colours an entity is shown in became the function `shownColorsOf`, which the options use too. No behaviour changed; its cases pass.

**6. Evidence beyond the plan:** the two skeleton controls, the status probe, the four planted defects and the scoping-gate probe. Each ran on an uncommitted tree and left nothing in it.

## Code review checklist

| Item | Outcome |
|---|---|
| The changes solve what the plan set out | Yes: the three tasks' acceptance criteria, each verify at exit 0 |
| OWASP top 10 | Read for injection (arguments are passed as RPC parameters, never concatenated), broken access control (the write runs under the caller's own row-level security; the read is refused with NULL, kept apart from an empty list) and information exposure (a named refusal returns no raised text; the parsers' messages hold schema paths only, asserted). A thrown error carries the database's message, as every other writer method's does: noted for 177-18 |
| Code style guide | Followed: types with `Array<…>`, TSDoc on every exported symbol and on the module-level functions |
| No `any` | None added. Two `as never` in unit cases that hand the writer a value outside its option type, each with a `reason` comment, as the file's existing cases do |
| No repeated code | The colour mapping extracted rather than copied; the integration file's editor creation lifted to one module-level function both describes use. The three parsers repeat the five-line "safeParse, name the paths, throw" form of the two that existed |
| New functions documented | Yes |
| Repo documentation | No markdown touched; nothing found made false. The guide has no entry for the two methods: reported for 177-21 |
| Tracking events | Not applicable: no user-facing function yet |
| Svelte component guidelines | Not applicable: no component |
| Errors handled and logged | Failures are thrown with the method's name; malformed colour and image columns are reported by the existing parse functions, asserted in a unit case |
| Failing checks | None on the final head |
| Parts sharing dependencies | `getEntityUserData` now requires `parent.entity_id`, which the database states since plan 177-06; the nominations view reads the parent's names only. The full unit suite and the frontend check are green |
| WCAG; keyboard and screen reader | Not applicable: nothing rendered |
| Developers' and Publishers' Guides | Not touched; see *For plan 177-21* |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit; every added comment read: no history, no plan or decision id |
| Commit history | Linear; tests before code; one commit that amends a test of the same plan (deviation 3) |
| No fixes of itself | `ae078b2d3` changes a test file `ac90ca1ef` added: a candidate for squashing when the branch is shipped |
| Formatting changes apart | No formatting-only change |
| `[db]` tag | Not applicable: no schema, migration or generated type changed |
| Supabase adapter: the mixin | Unchanged; the new methods use `this.supabase` and `this.projectId` |
| Supabase adapter: `COLUMN_MAP` / `PROPERTY_MAP` | Not used for the new mapping: the keys are those of a JSON argument and of a JSON answer, not columns of a row, and are written out as `entityNominationOf` writes its own |
| Supabase adapter: `safeGetSession` | Not applicable: no route guard |

## Prohibitions

- **PROH-177-23** — held: a refusal the writer names returns `{ type, reason }` and nothing else (unit cases assert that the result holds none of the raised text); sixteen other error shapes are thrown, among them each named refusal's message under another code and the cap's message quoted inside another.
- **PROH-177-24** — held: the writer's two new methods issue one `rpc(` each; a unit case asserts that no table is reached; the verify's search for `from('nominations')` in the writer finds nothing.

## Threat Flags

None beyond the plan's register. T-177-39 to T-177-43 are each mitigated as planned; T-177-42 is now measured (the table of what PostgREST answered).

## Sentences the work made false, reported and not edited

None found. See *For plan 177-21* for what is missing rather than false.

## Not done, or not verified

- **No E2E run**, by the plan's ruling 3; the latest full run is still `177-07-close`.
- **pgTAP was not run**: the plan's rows do not name it and no schema file changed.
- **An option with a stored image or colour through the real API** — unit cases only; the integration fixture stores neither.
- **Providing the options to a data root** (`provideEntityData`) was not exercised; the shape is assignable by type. Whether an option whose id the root already holds is replaced or kept is plan 177-14's to observe.
- **`23505`** (two callers creating one parent's nomination at once) was not produced through the API; the unit case throws for it.
- **The intermediate commits were not gated one by one** (see *Read this first*).
- `yarn eslint scripts/assert-project-scoped-queries.mjs`, asked directly, reports eight findings on lines this plan did not touch; `yarn lint:check` does not lint that file and is green. Not looked into.

## The state the local stack is left in

The gate's `db-reset` row emptied the local database at 05:20 local. Afterwards `yarn db:seed:default`: exit 0, 752 rows. The stack was not restarted. The integration cases left nothing: their teardown checks it and the row is green. The default project's settings are as the seed wrote them. The working tree is clean but for the operator's untracked `CAND-APP-PLAN.md`.

## Known Stubs

None.

## Evidence (gitignored)

`tests/e2e-runs/177-unit/177-09-*` — the three verify scripts with their logs, exit statuses and heads; `parse-red`, `parse-red-skeleton`, `writer-red`, `writer-red-skeleton`, `writer-red-skeleton-r2` with the kept skeletons; `integration-local`, `-local-r2`, `-probe`, `-mutants`; `scoped-probe`; `t3-intent`; the hygiene, cast, scoping and check logs; `seed-default`. `tests/e2e-runs/177-gates/177-09-close/` — the gate run.

## Self-Check: PASSED

The four created files, the gate run's `integration.json` and this summary exist; the six commits `bb4c13779`, `527f271b6`, `ac90ca1ef`, `ae078b2d3`, `2ee846c45` and `11ebf3cfe` are ancestors of HEAD.
