---
phase: 175-organization-editing-profile-questions-preview
plan: 07
subsystem: api
tags: [supabase-adapter, data-writer, contestant-store, svelte-runes, closed-map, immutability-trigger, colour, localized-string, tdd, integration]

requires:
  - phase: 175-organization-editing-profile-questions-preview (plan 02)
    provides: short_name frozen on confirmation on the four entity tables; the refusal's one prefix for every protected column
  - phase: 175-organization-editing-profile-questions-preview (plan 03)
    provides: the database's check of a stored colour (null, or hex under normal and dark)
  - phase: 175-organization-editing-profile-questions-preview (plan 04)
    provides: normalizeLocalizedName, sameLocalizedName; the two nameLocked sentences
  - phase: 175-organization-editing-profile-questions-preview (plan 06)
    provides: what Input emits for a name (a live proxy) and for a colour (lowercase #rrggbb or undefined)
provides:
  - "EditableEntityProps widened: image, name, shortName, color, firstName, lastName; EditableEntityColor"
  - "UpdateEntityPropertiesResult ('saved' with the written properties in both forms, or 'nameRefused'); SavedEntityProps"
  - "ContestantUserData.localizedNames: an organization's stored name and short name by locale; LocalizedEntityNames"
  - "SetPropertiesOptions.locale"
  - "the closed map ENTITY_PROPERTY_COLUMNS and the constant NAME_REFUSAL_PREFIX in supabaseDataWriter.ts"
  - "parseLocalizedStringColumn, parseColorColumn, localizedStringOf, colorOf, STORED_HEX_COLOR in parseJsonbColumn.ts"
  - "store: setProperty, resetProperty, the widened unsavedProperties, current.localizedNames, SaveUserDataResult ('success' | 'nameRefused' | 'failure')"
affects: [175-08, 175-09, 175-12, 175-13, 179]

actuals:
  tokens: 33751 # chars/4 over the six commits' diff outside .planning/ (135003 chars)
  tasks: 3
  commits: 6 # MEASURED: git rev-list --count 4890dc9e9..53d3c523c, before this file's own commit
plan_head_before: 4890dc9e93da35c3da04b440cc0b7700f5057074
plan_head_after: 53d3c523c351911747803c6fe2965518da3f9956

tech-stack:
  added: []
  patterns:
    - "A property write is one statement of the columns given, behind a closed map from entity type to writable property and column; a property outside the target type's entry throws before any request"
    - "The one refusal a user can cause is a returned, named result; the raised text is never returned"
    - "A staged property is held in memory, in the form it is saved in, and only while that form differs from the saved one"
    - "A dynamic column list is read back as a row of opaque Json values, each then parsed by its column's parse"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/api/base/dataWriter.type.ts
    - apps/frontend/src/lib/api/base/universalDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/parseJsonbColumn.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts

key-decisions:
  - "The refusal of a changed name is matched on SQLSTATE P0001 together with the start of its message, as measured against the local stack; assumption A2 held and no correction was needed"
  - "The writer result carries a written name in both forms, and the call takes an optional locale so that the one-locale form follows the rule of the entity read"
  - "A name admits null in EditableEntityProps beside the short name and the colour: a name with no entry left is staged and written as null"
  - "save() makes two property calls, the names last (U-12); the split is one six-line block and everything after it is written for either design"
  - "listedPropertySaved is true when any property was stored: every property the store stages is one the entity list shows"
  - "The store exposes staged names in current.localizedNames; the saved names by locale have no getter of their own, which plan 175-08 foresees adding"

patterns-established:
  - "updateEntityProperties is the one path a name, a colour or a logo takes to the database, for either entity type"

requirements-completed: []

coverage:
  - id: D1
    description: "The entity read carries an organization's stored name and short name by locale, parsed; a candidate's carries none"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "supabaseDataWriter.test.ts, 'the generic entity path' — four getEntityUserData cases (three red at c6a90b207, one control)"
        status: pass
      - kind: integration
        ref: "supabaseDataWriter.integration.test.ts — 'an unconfirmed organization saves its names and colour' reads localizedNames back through getEntityUserData"
        status: pass
    human_judgment: false
  - id: D2
    description: "updateEntityProperties writes the properties given and no others, by a closed map; one update, read back and parsed; values normalised and checked before any request"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "supabaseDataWriter.test.ts — 144 cases; red 48 failed / 96 passed at c6a90b207, green 144 passed at 34932b190"
        status: pass
    human_judgment: false
  - id: D3
    description: "The database's refusal of a changed name on a confirmed row reaches the caller as a named result, recognised by its code and prefix as measured"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "supabaseDataWriter.test.ts — 'resolves to the name-refused result…' and four 'throws for …' cases"
        status: pass
      - kind: integration
        ref: "supabaseDataWriter.integration.test.ts — 'A2: the refusal a signed-in editor receives…', 'a confirmed organization's name is refused and its colour saved…', 'a confirmed organization's short name is refused…'"
        status: pass
    human_judgment: false
  - id: D4
    description: "The store stages names, colour and logo in memory while they differ, discards them with the answer draft, and save() resolves to one of three outcomes"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "contestantUserDataState.svelte.test.ts — 65 cases; red 40 failed / 25 passed at 221dc7197, green 65 passed at f523ece5e"
        status: pass
    human_judgment: false
  - id: D5
    description: "The same writes against the running stack, as a signed-in editor, for both entity types"
    requirement: GEN-03
    verification:
      - kind: integration
        ref: "gate row integration of 175-07-close: 16 passed, 0 failed, 0 skipped (integration.json)"
        status: pass
    human_judgment: false
  - id: D6
    description: "A name, a colour and a logo edited on a page and saved through this path, in a browser"
    verification: []
    human_judgment: true

duration: 35min
completed: 2026-10-08
status: complete
---

# Phase 175 Plan 07: The Path of a Name, a Colour and a Logo from the Store to the Database — Summary

**`updateEntityProperties` writes the properties it is given, for the entity type each belongs to, as one update behind a closed map, and answers the database's refusal of a locked name as the named result `nameRefused`; the store stages names, colour and logo in memory only while they differ from what is saved, and `save()` resolves to `success`, `nameRefused` or `failure`. Each was shown red first (48 of 144 writer cases, then 40 of 65 store cases). Against the running stack 16 of 16 integration cases pass, and assumption A2 held as measured: HTTP 400, code `P0001`, the raised text as the message. The seven gate rows are at 0. No page reads any of it yet.**

## Performance

- **Duration:** about 35 min (17:05Z → 17:40Z)
- **Tasks:** 3 of 3
- **Files:** 9 modified, none created (1932 lines added, 117 removed); every one is in the plan's list

## Task Commits

1. **Task 1, red** — `c6a90b207` `test(175-07): the property writer writes names, colour and logo by a closed map` (1 file)
2. **Task 1, green** — `34932b190` `feat(175-07): the property writer writes the changed properties of either entity type, by a closed map` (6 files: the two base files, the writer, the parse module, and the store with its test double adapted by the one call)
3. **Task 2, red** — `221dc7197` `test(175-07): the store stages names, colour and logo in memory and reports a refused name` (1 file)
4. **Task 2, green** — `f523ece5e` `feat(175-07): the store stages an entity's names, colour and logo and saves what changed` (3 files)
5. **Task 3, the cases** — `f7fc874d7` `test(175-07): an organization editor's property writes against the running stack` (1 file)
6. **Task 3, the checklist's finding** — `53d3c523c` `refactor(175-07): one hex colour pattern for the adapter's colour write and its read-back` (2 files)

Each was made by pathspec. No other agent's commit sits between them.

## Each task's verify command, with its real exit status

Evidence under `tests/e2e-runs/175-unit/` as `175-07-t<N>-verify.sh` / `.log` / `.exit` / `.head`. Each script was compared, byte for byte, with the `<automated>` block of the plan file.

| Verify | Head | Exit | What it showed |
|---|---|---|---|
| **Task 1, as written** | `34932b190` | **0** | the six searches; red head `c6a90b207` before the commit that changed `universalDataWriter.ts`; red 48 failed, green 0 failed of 144; the writer's unit file; `assert:adapter-casts`; `assert:project-scoped-queries`; `check` 2130 files, 0 errors, 0 warnings; comment hygiene |
| **Task 2, as written** | `f523ece5e` | **0** | the four searches; red head `221dc7197` before the store's commit; red 40 failed, green 0 failed of 65; the whole frontend unit suite 172 files passed, 1 skipped, 2919 tests passed, 11 skipped; `check` 0 / 0; ESLint on the context directory (exit 0, one warning in a file this plan did not touch, see below); comment hygiene |
| **Task 3, first run** | `53d3c523c` | **1** | **a defect of my transcription, not of the plan or the tree**: the shell tool decoded the two `'` escapes of the plan's last stage into quote characters, which ended the script's single-quoted argument early (`SyntaxError`). Every earlier stage had passed, the gates verdict included. Kept as `175-07-t3-verify.as-transcribed.sh` |
| **Task 3, as written** | `53d3c523c` | **0** | the command taken from the plan file by a script, not retyped: the two searches; `gates 175-07-close --rows …` PASS; `integration.json` with 0 failed, 0 skipped and a passed case for each of the five prescribed titles |

Tasks 1 and 2's scripts were byte-identical to the plan's commands on their first run.

## Gates

**Gate rows `175-07-close`** — `tests/e2e-runs/175-gates/175-07-close`, head `53d3c523c`, `TURBO_FORCE=true`, driver exit 0, 20:34:32 → 20:37:23 local, on AC power, no Sleep entry in the window.

| Row | Exit | Seconds | Numbers |
|---|---|---|---|
| typecheck | 0 | 18 | 23 turbo tasks |
| lint | 0 | 44 | `yarn lint:check`, every link |
| integration | 0 | 3 | **16 cases: 16 passed, 0 failed, 0 skipped** (`integration.json`); the teardown's own assertion passed |
| unit | 0 | 64 | 25 turbo tasks; frontend **172 files passed, 1 skipped; 2919 tests passed, 16 skipped** (2838 at `175-06-close`, +81: 45 writer cases, 36 store cases; the 5 further skipped are the new integration cases, which skip without a declared stack); dev-seed 1037; the harness's own 7 files / 102 tests |
| check-frontend | 0 | 9 | 2761 files, 0 errors, 0 warnings |
| build | 0 | 15 | 14 turbo tasks |
| format | 0 | 18 | |

- `node 175-verdict.mjs gates 175-07-close --rows typecheck,lint,integration,unit,check-frontend,build,format` → **exit 0, PASS** (`175-07-close.verdict.txt`).
- The same without `--rows` → **exit 1**, "not the full gate set of 14" (`175-07-close.refusal-full-set.txt`): a subset is not read as the full set.
- `175-verdict.mjs scope` and `… hygiene` both exit 0 at `53d3c523c`.

**No E2E run was made**, as the plan rules: no page reads the new members. Plan 175-08's full run is this plan's boundary proof.

## The A2 measurement

Measured first, before the writer's match was written, by the integration case itself: the case and its fixture were drafted, the case alone was run against the local stack (`175-07-a2-measure.json`, exit 0), run once more with the error's fields printed (`175-07-a2-probe.log`), and the file was then set aside until Task 3.

A signed-in organization editor's own `update({ name })` of a **confirmed** organization, through PostgREST and supabase-js, returns:

| Field | Value |
|---|---|
| HTTP status | 400 |
| `error.code` | `P0001` |
| `error.message` | the raised text, beginning `Entity name is immutable once confirmed: column public.organizations.n…` |
| `error.details`, `error.hint` | `null`, `null` |
| `data` | `null` |

**Assumption A2 held.** The writer's match is `error.code === 'P0001' && error.message.startsWith('Entity name is immutable once confirmed: column ')`, and no correction commit was needed (Task 3's step 2 did nothing). Both halves are needed: the colour check of plan 175-03 raises under the same SQLSTATE, and four unit cases hold the match to the pair (the same code with another message, the same message under another code, with no code, and quoted inside another message each throw).

## What was built — every name

### The types (`lib/api/base/dataWriter.type.ts`)

```ts
export type EditableEntityColor = { normal: string };

export type EditableEntityProps = {
  image?: ImageWithFile;
  name?: LocalizedString | null;
  shortName?: LocalizedString | null;
  color?: EditableEntityColor | null;
  firstName?: string;
  lastName?: string;
};

export type LocalizedEntityNames = { name: LocalizedString | null; shortName: LocalizedString | null };

export type ContestantUserData<TNominations extends boolean | undefined = undefined> = {
  entity: LocalizedEntityData;
  localizedNames?: LocalizedEntityNames;   // an organization has it, a candidate does not
  nominations: TNominations extends true ? DPDataType['nominations'] : undefined;
};

export type SavedEntityProps = {
  image?: Image | null;
  name?: string;              // one locale's text, '' when no locale holds a name
  shortName?: string | null;
  color?: Colors | null;
  firstName?: string;
  lastName?: string;
};

export type UpdateEntityPropertiesResult =
  | { type: 'saved'; properties: SavedEntityProps; localizedNames: Partial<LocalizedEntityNames> }
  | { type: 'nameRefused' };

export type SetPropertiesOptions = WithTargetEntity & WithEditableEntityProps & { locale?: string };

// DataWriter, UniversalDataWriter and SupabaseDataWriter
updateEntityProperties: (opts: SetPropertiesOptions) => DWReturnType<UpdateEntityPropertiesResult, TType>;
```

`saved.properties` holds a member for each property written, in the form `getEntityUserData` gives on the entity; `saved.localizedNames` holds each written name as stored by locale. A written `name` is therefore returned in both forms.

### The public guard (`universalDataWriter.ts`)

Throws synchronously, as it did: `updateEntityProperties: no property was given` when every member is `undefined`, and `updateEntityProperties: the image carries no file` when an `image` is given without one. The image-only text is gone from the source.

### The writer (`supabaseDataWriter.ts`)

**The closed map**, beside `ENTITY_TABLES`, declared `as const satisfies Record<ServedEntityType, Partial<Record<keyof EditableEntityProps, string>>>`:

| Entity type | Property | Column | Where the column comes from |
|---|---|---|---|
| candidate | `image` | `image` | literal: the shared map holds only names that differ |
| candidate | `firstName` | `first_name` | `PROPERTY_MAP.firstName` |
| candidate | `lastName` | `last_name` | `PROPERTY_MAP.lastName` |
| organization | `image` | `image` | literal |
| organization | `name` | `name` | literal |
| organization | `shortName` | `short_name` | `PROPERTY_MAP.shortName` |
| organization | `color` | `color` | literal |

Every column the method writes or reads back is taken from this map; none is spelled a second time in the method.

**`_updateEntityProperties`**, in order:

1. Every given property (a member that is not `undefined`) is looked up in the target type's entry with `Object.hasOwn`. One that is absent rejects with `updateEntityProperties: the property '<p>' cannot be written for an entity of type '<t>'`. `subtype`, `confirmed` and an inherited name such as `constructor` are refused this way.
2. Each value is brought to its stored form, still before any request: a name through `normalizeLocalizedName` (a value that is neither `null` nor an object of entries rejects); a short name the same, `null` when nothing is left; a colour to `{ normal: '#rrggbb' }` in lowercase, six digits, or `null` — anything but `#` and three or six hex digits under `normal` **alone** rejects, a `{ normal, dark }` pair included; a person's name trimmed (a non-string rejects).
3. The image is uploaded, last, through the existing helper.
4. One `scopedFrom(table).update(fields).eq('id', id).select(<the columns written>).single()`.
5. On an error: `{ type: 'nameRefused' }` for the measured pair, otherwise `throw new Error('updateEntityProperties: ' + error.message)`.
6. The read-back is parsed column by column (`parseImageColumn`, `parseLocalizedStringColumn`, `parseColorColumn`), and a name is translated with `getLocalized(stored, locale ?? this.defaultLocale, this.defaultLocale)`, the rule of the entity read.

`NAME_REFUSAL_PREFIX` is the constant, with a doc line naming `public.enforce_entity_immutability` and its file. The cast to `LocalizedCandidateData` and its `// reason:` comment are gone.

**`_getEntityUserData`** returns `localizedNames` for an entity type whose map entry holds `name`: the two columns of the RPC's row, each through `parseLocalizedStringColumn`, `null` where the column holds nothing. A column that is not a localized string is reported at `error` with the column and the row and never the value; an object keeps the locales whose entry is text. The mapping through `toDataObject` is unchanged. For a candidate the member is absent, not `undefined`.

### The parses (`utils/parseJsonbColumn.ts`)

```ts
export const STORED_HEX_COLOR: RegExp;   // '#' and three or six hex digits, either case
export function parseLocalizedStringColumn(stored: Json | undefined, source: ParseSource): ParseOutcome<LocalizedString>;
export function parseColorColumn(stored: Json | undefined, source: ParseSource): ParseOutcome<Colors>;
export function localizedStringOf(outcome: ParseOutcome<LocalizedString>): LocalizedString | null;
export function colorOf(outcome: ParseOutcome<Colors>): Colors | null;
```

Each is `parseWithPartialPreserve` over a small zod schema, with a constant event name, in the form of the image's.

### The store (`contestantUserDataState.svelte.ts`, `.type.ts`)

```ts
export type SaveUserDataResult =
  | { type: 'success' | 'nameRefused'; listedPropertySaved: boolean }
  | { type: 'failure' };

// ContestantUserDataState
setProperty: <TProperty extends keyof EditableEntityProps>(
  property: TProperty,
  value: Exclude<EditableEntityProps[TProperty], undefined>
) => void;
resetProperty: (property: keyof EditableEntityProps) => void;
setImage: (image: ImageWithFile) => void;      // unchanged signature
resetImage: () => void;                         // unchanged signature
save: () => Promise<SaveUserDataResult>;
readonly unsavedProperties: Array<keyof EditableEntityProps>;
readonly current: ContestantUserData<true> | undefined;   // now with localizedNames
```

- **One holder**, `#staged = $state.raw<EditableEntityProps>({})`, replaced whole on every change. It has no `localStorage` handle. The image is one of its members; `#editedImage` is gone.
- **`setProperty`** stages the value in the form it is saved in and only while that form differs from the saved one: a name through `normalizeLocalizedName` and `sameLocalizedName` against the saved names by locale; a colour by the hex colour under `normal` (`parseColorString` → `rgbToHex`, so letter case and the three-digit form make no difference, and a stored `{ normal, dark }` pair equals a staged `{ normal }` of the same colour); a first or last name trimmed, against the saved one trimmed. A value that is the saved one removes the property from the staged set. Every staged value is a new plain value built by the normaliser, never the object handed in.
- **`current`** shows a staged image, colour, first name or last name on `entity`, and a staged name or short name in `localizedNames`. `entity.name` and `entity.shortName` stay the saved ones, in one locale. The whole value is a plain copy.
- **Discarded** by `init` on another entity, `leaveEntity`, `resetUnsaved` and the effect on the answers lock. `init` with the same entity keeps the staged properties and the answer draft.
- **`reloadEntityData`** stores the names by locale with the entity, under the same loaded-entity guard.

### What `save()` sends, and in which order

1. **The answers**, when the draft holds any: `updateAnswers({ target, answers })`. Unchanged. An unverified or empty read-back resolves `{ type: 'failure' }` before any property is sent, with everything kept.
2. **The staged properties that are not names** — `image`, `color` — in one `updateEntityProperties({ target, properties, locale })`, when any is staged.
3. **The staged names** — `name`, `shortName`, or `firstName`, `lastName` — in a second call, when any is staged.

Only staged properties are sent, so a property the user did not change is never in a call. Each saved result is merged into the stored entity and into the stored names, under the loaded-entity check. Then:

| What happened | Resolves to | What is left staged |
|---|---|---|
| every call stored | `{ type: 'success', listedPropertySaved }` | nothing; the answer draft is cleared |
| the names' call answered `nameRefused` | `{ type: 'nameRefused', listedPropertySaved }` | nothing: the staged names are discarded, what the first call stored stays merged, the draft is cleared |
| the answers could not be verified | `{ type: 'failure' }` | everything |
| a property call threw | the promise rejects, as before | everything, the properties an earlier call stored included, so Save retries all of it |
| a call that carries no name answered `nameRefused` | rejects with `save: a write that carries no name was refused for a name` | everything |

`listedPropertySaved` is true when at least one property was stored.

### Ruling 1's block, and what the fallback changes

The split is **one block of six lines** in `save()`, under the comment that begins "The names are written in a call of their own": from `const nameProperties = { ...staged };` to `const writes = [otherProperties, nameProperties];`. Everything after it — the loop over `writes`, the refusal, the merge, the resets, the result — is written for either design.

**The fallback to D-05 as written** replaces the block with `const writes = [staged];`. Then, with no other line changed: a refused statement stores nothing of the properties, the staged names are discarded, the logo and the colour stay staged, and the result is `{ type: 'nameRefused', listedPropertySaved: false }`. Under it:

- In the store's test file, five cases turn: "a refused name does not cost the answers, the logo or the colour of the same save" (the colour and the logo still unsaved and not merged, one call), "writes the names in a call of their own, after the other properties" and its candidate twin (one call each), "a candidate's refused names are discarded and its image kept" (the image still staged, not stored), and "rejects when the write of the names throws after the other properties were stored" (it becomes the one-call failure case beside it).
- The integration cases stand as they are: the writer is one statement in both designs, and "a confirmed organization's name is refused and its colour saved" already sends a name and a colour in one call and expects neither stored.
- **One thing the plan's fallback list does not name:** the image is uploaded before the statement is sent, so under the fallback a refused save that carries a logo leaves an uploaded object in Storage that no row names, and a second press of Save uploads it again.
- Items (d) to (f) of the plan's ruling 1 are in plans 175-04, 175-09 and 175-12.

## Task 1 — the cases, and the existing cases that were restated

**Red at `c6a90b207`** (`175-07-writer-red.json`, exit 1): 144 cases, **48 failed, 96 passed**. By group: 39 of 39 in the new group "updateEntityProperties, the properties of each entity type"; 5 of 6 in "updateEntityProperties"; 4 of 18 in "the generic entity path". Of the new cases one passed in red, as the control: a candidate's entity read carries no names by locale.

**Green at `34932b190`** (`175-07-writer-green.json`, exit 0): the same 144, all passed. The writer's test file is identical at the two heads.

**Existing cases restated, in the red commit, because this task changes what they assert by design:**

| Case | Was | Is |
|---|---|---|
| "updateEntityProperties for an organization writes the organizations table within the configured project" | the result `{ image }` | the saved result holding `{ image }` |
| "uploads the image file, writes the image column alone and returns the image alone" | the same | the same |
| "reads the stored image back instead of fabricating a return value when nothing changed" | the same | the same |
| "refuses a call that carries no image file" | one case: a call with no property throws the image-only text | three: a call with no property, and one whose members are all `undefined`, throw naming the method; an image without a file throws whatever else the call carries |

Every other existing case of the file stands unchanged, the three no-write and project-scope cases of the image among them.

## Task 2 — the cases, and the existing cases that were restated

**Red at `221dc7197`** (`175-07-store-red.json`, exit 1): 65 cases, **40 failed, 25 passed**. 36 of 36 in the new group "staged properties" (23 staging cases, 13 `save()` cases); 4 existing cases whose result gained a member. The 25 that passed are the existing cases this task does not change.

**Green at `f523ece5e`** (`175-07-store-green.json`, exit 0): the same 65, all passed.

**Existing cases restated:** four expectations of `{ type: 'success' }` gained `listedPropertySaved` — `true` where an image was saved ("save() for an organization targets the organization…", "a save still in flight when B is loaded…"), `false` where answers alone were ("save() for A empties A's key…", "a save still in flight when the entity is left…"). `makeOrganizationUserData` gained the names by locale. No other existing expectation changed.

**The test file differs between the red and the green head** by its writer double alone: it translates a written name as the writer does (the locale asked for, else the default, else the first stored), where the red file read the asked locale only. One case, "writes the names in a call of their own…", needed it. No case's expectation changed.

## Task 3 — the integration cases, by name

In the group "an editor's writes of its own entity's names and colour", each asserting the outcome and the stored state separately:

1. **"A2: the refusal a signed-in editor receives for a changed name on a confirmed row carries the trigger's code and the start of its message"** — the editor's own client, past the writer.
2. **"an unconfirmed organization saves its names and colour, and the stored row holds them"** — a name in two locales, a short name and `#2546A8`; the stored colour is exactly `{ normal: '#2546a8' }`; the entity read gives the names back by locale.
3. **"a confirmed organization's name is refused and its colour saved, the refused write changing neither"** — a changed name with a colour in one call resolves `nameRefused` and stores neither; the colour alone resolves `saved` and is stored, `#0a0` as `#00aa00`.
4. **"a confirmed organization's short name is refused, and the stored short name is what it was"**.
5. **"an unconfirmed candidate saves its names, and the stored row holds them"** — `'  Ada '` is stored as `Ada`.

The fixture gained a confirmed organization, created confirmed by the service role, and its editor; the teardown removes both and its own assertion covers the row. The 11 cases the file held before pass unchanged.

## The code review checklist

Over the three tasks. Recorded before the gate rows; the one finding was fixed before them.

| Item | Outcome |
|---|---|
| Solves the issue | yes for the path; no page uses it yet |
| OWASP top 10 | T-175-31: the closed map, with `Object.hasOwn`, so no inherited name passes. T-175-32: a colour is hex or it is not sent. T-175-33: the raised text is in no result; every other error is thrown, and its message does hold database text, so a page must go on showing its own sentence and never `e.message`. Column names in the update and in the read-back come from the map alone, never from the caller |
| Code style guide | `Array<T>`, explicit return types, TSDoc on every export and helper. Two points kept as the plan and the files have them: positional parameters where the two differ in type (`setProperty(property, value)`, as `setAnswer(questionId, answer)`), and module helpers above the class, as `servedEntityType` and `editedAnswersKey` are |
| No `any` | none |
| No repetition | **Finding, fixed in `53d3c523c`:** the hex pattern was written in the writer and again in the parse module; it is `STORED_HEX_COLOR` once. `Input`'s own pattern of plan 175-06 is a third and stands in the component |
| New entities documented | every type, member, constant and function |
| Repo markdown | no guide or skill names the changed API (searched `apps/docs`, `.claude/skills` and every tracked `.md`) |
| Tracking events | not answered here: nothing a user reaches by itself; the page is plan 175-09's |
| Errors handled and logged | a parse failure is reported once, at `error`, by the shared helper; a failed write throws with the method's name; nothing is swallowed |
| Parts sharing the dependency | the two callers of `save()` branch on `result?.type !== 'success'` and typecheck unchanged; `unsavedProperties` has no reader outside the store; `ContestantUserData.localizedNames` is optional, so every existing construction stands |
| Supabase adapter: mixin | unchanged |
| Supabase adapter: row mapping uses the shared maps | yes for the three properties the map holds; three literals, named above |
| Supabase adapter: every query project-scoped | `scopedFrom` for the update and the no-write read; `assert:project-scoped-queries` exit 0; a unit case reads the filter |
| No cast chain under the adapter | `assert:adapter-casts` exit 0. Two type statements were added and are named under deviations: the row type of a dynamic column list, and one key narrowing |
| WCAG, keyboard, screen reader | no markup |
| Comment hygiene | every added or changed comment read; `yarn assert:comment-hygiene` exit 0 before each commit. Two comments this plan changed carried a decision id and lost it |
| Commit history | test, feat, test, feat, test, refactor; linear |
| `[db]` tag | no database change |

## Deviations from Plan

**1. The A2 measurement came before Task 1, by the integration case, and the file was then set aside.** The orchestrator asked for the measurement first. The case and its fixture were written, run alone twice, and the file restored to its committed state until Task 3. Evidence: `175-07-a2-measure.json` / `.log` / `.exit` (0), `175-07-a2-probe.log`.

**2. `SetPropertiesOptions` gained `locale?`.** The plan asks for a written name's "localized string by the locale rule the read uses"; the method had no locale to apply. The store passes its own.

**3. `name` admits `null`**, where the plan names the short name and the colour. Ruling 3 has a name with no entry left written as null, and the store stages the normalised name, which is then `null`.

**4. A colour holding a `dark` member is refused**, as "a value of any other shape". The store stages `{ normal }` alone, so no caller of the tree sends one.

**5. The no-write read-back stands.** An image that carries no uploadable file writes nothing and reads the stored columns back, as before, so three existing cases stand as they were.

**6. Two type statements under the adapter, neither a cast chain.** `.single<Partial<Record<string, Json>>>()` states the row type of a column list built at run time, which the client cannot infer; every value is opaque `Json` and is parsed. `property as keyof EditableEntityProps` narrows a key of the closed map after `Object.entries`. In the store, `Object.keys(properties) as Array<keyof EditableEntityProps>`.

**7. `setImage` now throws before an entity is loaded**, as `setAnswer` does and as `setProperty` does. It was silent. The profile page calls it only with an entity loaded.

**8. The store's test double was corrected in the green commit** (above). The plan's verify does not ask that the file be identical at the two heads.

**9. A sixth commit, `53d3c523c`**, for the checklist's finding, as Task 3's step 4 allows.

**10. Task 3's verify exited 1 on its first run, from my transcription** (table above); taken from the plan file by a script it exits 0.

**11. The title of the A2 case begins "A2:", as the plan prescribes** and as its verify reads. "A2" is the research record's label for the assumption. The orchestrator's rule is that a test title carries no decision or plan id; an assumption label is neither by the letter and is one in kind. **Left as the plan writes it, and open for a ruling:** renaming is one line of the test file and one string of the plan's verify.

**12. The green reports were taken on the commits that hold the code**, after each commit, so that each `.head` names a tree with it. The suites had passed on the working tree before each commit.

**13. `listedPropertySaved` does not consult a list.** All six editable properties are members of the listed entity, so it is "a property was stored".

**Not recorded in `.planning/WINDOWS.md`:** there is no stub, no skipped test and no verify left unrun.

## What was not done or not verified

- **No E2E run**, by the plan. The store's new members, the two results and the entity read's new member are unproven in a browser until plan 175-08's full run, and unused by a page until plan 175-09.
- **No direct unit cases for the two new parses** in `parseJsonbColumn.test.ts`. They are covered through five writer cases (the stored names read, a null column, a scalar and a partly valid object, a malformed read-back name, a malformed read-back colour).
- **The saved names by locale have no getter of their own.** `current.localizedNames` includes unsaved edits; plan 175-08's name clause reads the saved value and foresees adding the getter.
- **A staged property is not compared again when the same entity is initialised with fresh data.** A value staged before the reload stays staged even if the fresh saved value now equals it.
- **Two image branches the public guard makes unreachable are as they were:** an image of `null`, and an image with a `url` and no file.
- **An ESLint warning printed by Task 2's verify is not this plan's:** `contestantContext.svelte.test.ts:20`, `'question' is assigned a value but never used`. The stage exits 0. Plan 175-08 rewrites that file's group.
- **`GEN-01` and `GEN-03` are not completed by this plan**: it supplies the path; the pages are plans 175-09 to 175-11. `requirements-completed` is empty on purpose.

## What the next plans should know

- **175-08 — the name clause.** The saved names by locale are `#savedData.localizedNames` inside the store, with no public reader. Add a read-only getter beside `savedEntityData` (suggested name `savedLocalizedNames`, type `LocalizedEntityNames | undefined`) and read `missingRequiredLocale(savedLocalizedNames?.name, requiredNameLocale())` from it. A candidate's saved names are `savedEntityData.firstName` and `.lastName`. `parseColorColumn` and `colorOf` exist if the reader wants a parsed colour, but the entity read still passes `color` through unparsed.
- **175-09 — staging.** Name: `userData.setProperty('name', value)`; abbreviation: `userData.setProperty('shortName', value)`. The value may be the live proxy `Input` emits: the store copies and normalises it, so no snapshot is needed. Colour: `userData.setProperty('color', value ? { normal: value } : null)`. A candidate's names: `userData.setProperty('firstName', value)`, `('lastName', value)`. Logo: `userData.setImage(image)` as today. A property of another entity type is not refused when staged; it makes `save()` reject.
- **175-09 — reading back.** A multilingual input's `value` is `userData.current?.localizedNames?.name` (or `.shortName`): a plain object by locale, or `null`. The colour is `userData.current?.entity.color?.normal`. A candidate's names are on `userData.current.entity`. Do **not** hand a multilingual input `entity.name`: it is one locale's string, and stays the saved one while a name is staged.
- **175-09 — the outcome.** `const result = await userData.save()`; `'success'` and `'nameRefused'` carry `listedPropertySaved`. After `'nameRefused'` nothing is unsaved and the names by locale are the stored ones again. `save()` still rejects for a thrown write; the rejection's message can hold database text.
- **175-09 — Cancel.** `resetUnsaved()` discards every staged property; an `Input` that holds a refused colour text keeps it until it is remounted (plan 175-06's note).
- **The question page** treats `'nameRefused'` as "not success". It cannot receive one today: the navigation guard discards staged properties before that page is reached.
- **175-12:** after a save of a name the menu's title is stale until the entity list is read again; `listedPropertySaved` is what says so.
- **175-13:** the integration test still runs in no CI job; it gained five cases. `DataWriter.updateEntityProperties` and `ContestantUserDataState` changed their documented contracts.
- **Phase 179:** `updateEntityProperties` is the path CI1's save takes; a property outside the entity type's entry rejects by name.
- **Orchestrator:** nothing in `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` or `CLAUDE.md` was edited; `CAND-APP-PLAN.md` stays untracked; nothing under `tests/e2e-runs/` was deleted. One point is open for a ruling: deviation 11.

## The state the local database is left in

Unchanged in kind from plan 175-06's close. No reset was run. The schema is the tree's; the data is `seed.sql` plus the `default` dataset, which the `unit` row wrote again; the E2E project is empty; pgTAP's helpers are still in `public`, so `yarn db:types` is valid only after another reset.

The integration test ran four times against the default project: the A2 case alone twice, the whole file once, and the whole file once more in the gate. Each run created its rows, users and grants under identifiers of its own and removed them, and each run's teardown assertion passed, so nothing of it is left. The Supabase stack and Docker were never restarted, and no image was pruned.

## Files touched that the plan did not list

None. The nine files changed are the nine the plan lists.

Gitignored evidence: under `tests/e2e-runs/175-unit/`, `175-07-writer-red`, `-writer-green`, `-store-red`, `-store-green`, each with `.json`, `.log`, `.exit` and `.head`; `175-07-a2-measure.*`, `175-07-a2-probe.log`, `175-07-integration-dev.*`; `175-07-t1-verify.*`, `175-07-t2-verify.*`, `175-07-t3-verify.*` and `175-07-t3-verify.as-transcribed.sh`. Under `tests/e2e-runs/175-gates/`, `175-07-close` with its `.log`, `.exit`, `.launched`, `.verdict.txt`, `.refusal-full-set.txt`, `.scope.txt` and `.hygiene.txt`.

## Known Stubs

None.

## Threat Flags

None. The plan's register covers what was added: the writer's property list (T-175-31), the colour it sends (T-175-32), the raised text (T-175-33), the freeze seen through the writer (T-175-34), an unchanged name in another byte form (T-175-35), the three outcomes (T-175-36) and staged names in storage (T-175-37).

## Self-Check: PASSED

Checked after writing:

- The nine modified files exist, and `git diff --name-only 4890dc9e9 53d3c523c` lists exactly those nine paths, none outside `apps/frontend/src/lib/`.
- `c6a90b207`, `34932b190`, `221dc7197`, `f523ece5e`, `f7fc874d7` and `53d3c523c` are ancestors of `HEAD`; `git rev-list --count 4890dc9e9..53d3c523c` is 6.
- The four reports and their `.head` files exist under `tests/e2e-runs/175-unit/`, with exits 1, 0, 1, 0; the case counts in this file were read from them by group.
- `175-07-t1-verify.exit`, `175-07-t2-verify.exit` and `175-07-t3-verify.exit` hold 0; `tests/e2e-runs/175-gates/175-07-close.exit` holds 0 and `175-07-close/integration.json` exists.
- The writer's test file is identical at `c6a90b207` and `34932b190`; the store's test file differs between `221dc7197` and `f523ece5e` by four lines of its writer double.
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` are unchanged since `4890dc9e9`.
