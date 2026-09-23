---
phase: 157-adapter-boundary-typing
plan: 02
subsystem: infra
tags: [app-shared, zod, jsonb, validation, supabase, adapter-boundary]

requires:
  - phase: 157
    plan: 01
    provides: "the app-shared foundation this plan extends (logger + `getLocalized` + the built `dist/`)"
provides:
  - "`StoredImageSchema` + `type StoredImage` — the interface relocated out of the Supabase adapter"
  - "`StoredAnswersSchema` + `type StoredAnswers` + `type StoredAnswer`"
  - "`StoredSettingsSchema` + `type StoredSettings`"
  - "`StoredCustomizationSchema` + `type StoredCustomization`"
  - "`SendEmailResultSchema` + `type SendEmailResult` + `type RecipientResult`"
  - "`packages/app-shared/src/data/schemas/` and its barrel, reachable through the root barrel from the built `dist/`"
  - "`zod` as `@openvaa/app-shared`'s first third-party runtime dependency, in the bare catalog form"
affects: [157-07]

actuals:
  tokens: 11101
  tasks: 3
  commits: 6

tech-stack:
  added:
    - "zod 4.3.6 (catalog), as a runtime dependency of `@openvaa/app-shared`"
  patterns:
    - "Validate the STORED shape, derive the APPLICATION shape — the schema and the published type are deliberately different objects"
    - "`z.strictObject` at EVERY nesting level, with one rejection test per level, because strictness is per-object and does not descend"
    - "`safeParse`-only surface: no throwing `validateX` wrapper, so the adapter edge can degrade rather than fail (T-157-06)"

key-files:
  created:
    - packages/app-shared/src/data/schemas/index.ts
    - packages/app-shared/src/data/schemas/storedImage.schema.ts
    - packages/app-shared/src/data/schemas/storedImage.schema.test.ts
    - packages/app-shared/src/data/schemas/storedAnswers.schema.ts
    - packages/app-shared/src/data/schemas/storedAnswers.schema.test.ts
    - packages/app-shared/src/data/schemas/storedSettings.schema.ts
    - packages/app-shared/src/data/schemas/storedSettings.schema.test.ts
    - packages/app-shared/src/data/schemas/storedCustomization.schema.ts
    - packages/app-shared/src/data/schemas/storedCustomization.schema.test.ts
    - packages/app-shared/src/data/schemas/sendEmailResult.schema.ts
    - packages/app-shared/src/data/schemas/sendEmailResult.schema.test.ts
  modified:
    - packages/app-shared/package.json
    - packages/app-shared/src/index.ts
    - yarn.lock
    - apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts

key-decisions:
  - "`z.strictObject(...)` chosen over `.strict()` — same semantics, but strictness is visible at the declaration site rather than at the end of a chain"
  - "`StoredSettingsSchema` makes EVERY field optional, including ones `DynamicSettings` requires: the column defaults to `'{}'::jsonb` and the provider merges the parsed value over the shipped defaults"
  - "`StoredAnswerValueSchema` is deliberately a loose union — the stored blob carries no question type, so the value's admissible shape is not knowable at this seam"
  - "`SendEmailResultSchema` makes `sent`/`failed` optional and `results` required, because the dry-run branch returns no counts"
  - "`RecipientResult.user_id` and `.email` are REQUIRED: all four push sites in the Edge Function set both"
  - "No throwing `validateX` wrapper was written (T-157-06); the schemas expose `safeParse` only"

patterns-established:
  - "Prohibition greps stay literal-clean: a JSDoc line that NAMES the forbidden token trips the guard, so the token is described rather than spelled"

requirements-completed: [REVIEW-ADP-01]

coverage:
  - id: D1
    description: "Each of the five stored shapes parses a representative valid payload and rejects an unknown key at every nesting level"
    requirement: REVIEW-ADP-01
    verification:
      - kind: unit
        ref: "packages/app-shared/src/data/schemas/*.test.ts (38 cases across 5 files)"
        status: pass
  - id: D2
    description: "`{}` parses for `StoredSettingsSchema` and `StoredCustomizationSchema`"
    verification:
      - kind: unit
        ref: "storedSettings.schema.test.ts + storedCustomization.schema.test.ts, first case of each"
        status: pass
  - id: D3
    description: "`StoredImage` is importable from `@openvaa/app-shared` and the adapter no longer declares it"
    verification:
      - kind: unit
        ref: "grep -c 'interface StoredImage' storageUrl.ts -> 0; yarn workspace @openvaa/frontend typecheck -> 2687 files, 0 errors"
        status: pass
  - id: D4
    description: "The schemas resolve through the built `dist/` for 157-07"
    verification:
      - kind: integration
        ref: "node -e \"import('@openvaa/app-shared')...\" for all five schema names, run from apps/frontend"
        status: pass

status: complete
---

# Phase 157 Plan 02: Zod Schemas at the Adapter Boundary Summary

Five strict zod schemas now describe the STORED shape of every unvalidated Supabase JSONB read
the adapter performs, shipped from `@openvaa/app-shared`, with one unknown-key rejection test per
nesting level and `StoredImage` relocated out of the adapter to sit beside its schema.

## Accomplishments

- **Task 1 (TDD).** `zod` added as the package's first third-party runtime dependency in the bare
  catalog form; `StoredImageSchema` and `StoredAnswersSchema` written RED-first; the `StoredImage`
  interface deleted from `storageUrl.ts` and its three importers repointed at the package.
- **Task 2 (TDD).** `StoredSettingsSchema` (three nesting levels, every field optional) and
  `StoredCustomizationSchema` (reusing `StoredImageSchema` rather than re-declaring it).
- **Task 3 (TDD).** `SendEmailResultSchema` mirroring all three Edge Function return branches, the
  schemas barrel, the root-barrel entry, and the full build / test / lint / format gate.

## Names and nesting depths, recorded for 157-07

The plan asked for the exact export names and the depth each schema reaches, so 157-07 wires its
parse calls against measured names rather than guesses.

| Export | Kind | Deepest strict level | Reached at |
|---|---|---|---|
| `StoredImageSchema` | `z.strictObject` | **2** | `focalPoint` |
| `StoredImage` | `z.infer` type | — | — |
| `StoredAnswersSchema` | `z.record` (top level NOT strict — keys are question ids) | **2** | the per-question answer object |
| `StoredAnswers`, `StoredAnswer` | `z.infer` types | — | — |
| `StoredSettingsSchema` | `z.strictObject` | **4** | `results.cardContents.candidate[]` entry object; the notification path reaches 3 (`notifications` -> `candidateApp`) |
| `StoredSettings` | `z.infer` type | — | — |
| `StoredCustomizationSchema` | `z.strictObject` | **2** | the image objects, the `candidateAppFAQ[]` entry (the image reaches 3 via `focalPoint`) |
| `StoredCustomization` | `z.infer` type | — | — |
| `SendEmailResultSchema` | `z.strictObject` | **2** | the `results[]` entry object |
| `SendEmailResult`, `RecipientResult` | `z.infer` types | — | — |

**Nullability, since every call site differs.** `StoredImageSchema` is NON-nullable so it can be
reused as a member of `StoredCustomizationSchema`; call sites reading a nullable `image` column use
`StoredImageSchema.nullable()`. Inside `StoredCustomizationSchema` the three image members are
already `.nullable().optional()`. `StoredAnswersSchema`'s per-question values are
`.nullable()` (the application type permits a `null` entry), and its `info` member is
`.nullable().optional()`.

**Degradation posture (T-157-06).** No throwing wrapper was written. The schemas expose `safeParse`
usage only, so 157-07 can fall back to the provider's existing empty-value branches
(`_getAppSettings` returns `{}` on `PGRST116`, `_getAppCustomization` returns `{}`) rather than
taking the app down on one malformed row.

## Verification — commands run and real output

| Command | Result |
|---|---|
| `yarn workspace @openvaa/app-shared test:unit` | **79 passed (79)**, 10 files — 41 baseline + 38 new schema cases |
| `yarn workspace @openvaa/frontend test:unit` | **807 passed (807)**, 53 files (unchanged from baseline) |
| `yarn test:unit` (whole monorepo) | **25 successful, 25 total** tasks |
| `yarn build` | **14 successful, 14 total** (after one forced rebuild — see deviation 5) |
| `yarn workspace @openvaa/frontend typecheck` | **2687 FILES 0 ERRORS 0 WARNINGS** |
| `yarn lint:check` | **exit 0** — 22/22 turbo tasks, all seven assert-scripts clean |
| `yarn format:check` | "All matched files use Prettier code style!" |
| `node -e "import('@openvaa/app-shared')..."` from `apps/frontend` | exit 0; all five schema names present in the built `dist/` |

Per-schema case counts: `storedImage` 7, `storedAnswers` 7, `storedSettings` 8,
`storedCustomization` 7, `sendEmailResult` 9 — **38** new cases.

Prohibition greps, all clean:

- `grep -rn '\.merge(\|error\.errors' packages/app-shared/src/data/schemas` -> **0**
- `grep -rn 'TranslationKey' packages/app-shared/src` -> **0**
- `grep -c 'interface StoredImage' apps/.../utils/storageUrl.ts` -> **0**
- `grep -c "from '@openvaa/app-shared'" apps/.../utils/storageUrl.ts` -> **1**
- `grep -c "data/schemas" packages/app-shared/src/index.ts` -> **1**
- `grep -n '"zod"' packages/app-shared/package.json` -> `"zod": "catalog:"`, no version range
- `grep -c 'strict' packages/app-shared/src/data/schemas/storedSettings.schema.ts` -> **26** (>= 3)
- Every `z.record(` call in the schemas directory is the TWO-argument v4 form

**Lockfile churn (T-157-SC).** `git diff --stat yarn.lock` over the whole plan: **1 file changed,
1 insertion** — a single `zod: "catalog:"` line inside the existing `@openvaa/app-shared` workspace
entry. **Zero new third-party package entries.** `node -e` against `node_modules/zod/package.json`
reports **4.3.6**, the already-resolved catalog version. The slopsquatting risk this gate exists for
is structurally absent, as the plan's threat register predicted.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Three frontend files outside the plan's file list had to be repointed**

- **Found during:** Task 1.
- **Issue:** The plan's `files_modified` names only `storageUrl.ts` for the `StoredImage` move, but
  three other frontend files import the type from that module:
  `utils/storageUrl.test.ts:3`, `dataProvider/supabaseDataProvider.ts:34`, and
  `dataWriter/supabaseDataWriter.ts:24`. Deleting the interface without touching them breaks the
  frontend typecheck.
- **Fix considered and rejected:** leaving a `export type { StoredImage } from '@openvaa/app-shared'`
  re-export shim in `storageUrl.ts`. That satisfies both acceptance criteria with a one-file edit,
  but leaves two import paths for one type — the drift this phase exists to remove, and a
  contradiction of the plan's own key_link wording ("the type moves").
- **Fix applied:** repointed all three at `@openvaa/app-shared`. In the provider the new name was
  merged into the existing `import type { DynamicSettings } from '@openvaa/app-shared'` line, so the
  net import count did not grow.
- **Files modified:** the three named above.
- **Commit:** `9743f1277`

**2. [Rule 3 - Blocking] The schemas barrel and the root-barrel entry landed in Task 1, not Task 3**

- **Found during:** Task 1.
- **Issue:** Both barrel files are declared under Task 3, but the frontend cannot resolve
  `StoredImage` from `@openvaa/app-shared` until the root barrel re-exports `./data/schemas`. Keeping
  them for Task 3 would have left commits `9743f1277` and `c0728627b` with a non-compiling frontend.
- **Fix:** created both in Task 1 with the two modules that existed then; Task 2 and Task 3 each
  extended `schemas/index.ts` in place. The final content is exactly what Task 3 specifies — five
  modules, alphabetised — and the root barrel carries exactly one `./data/schemas` line, in the
  alphabetised position after `./data/localized.type`.
- **Files modified:** `packages/app-shared/src/data/schemas/index.ts`, `packages/app-shared/src/index.ts`
- **Commits:** `9743f1277`, `dd20e7fa9`, `945978e76`

**3. [Rule 3 - Blocking] Import order in `storedSettings.schema.test.ts`**

- **Found during:** Task 2 lint.
- **Issue:** `simple-import-sort/imports` is `'error'`, and its single configured group orders
  `^\./` BEFORE `^\.\./`. My `../../settings/dynamicSettings` import sat above
  `./storedSettings.schema`. 1 error.
- **Fix:** `eslint --fix` reordered the two lines. No behaviour change.
- **Files modified:** `packages/app-shared/src/data/schemas/storedSettings.schema.test.ts`
- **Commit:** `dd20e7fa9`

**4. [Rule 3 - Blocking] A JSDoc line tripped the plan's own prohibition grep**

- **Found during:** Task 2 verification. Same failure class as 157-01 deviation 1.
- **Issue:** The acceptance criterion is that `grep -rn 'TranslationKey' packages/app-shared/src`
  returns 0 lines. My `StoredCustomizationSchema` docblock EXPLAINED why `AppCustomization` stays in
  the frontend by naming the generated union in prose, so the grep returned 1. No code referenced it.
- **Fix:** reworded to "the generated frontend translation-key union", with an added sentence stating
  that the guard is a literal search and the name is therefore described rather than spelled. The
  explanation survives; the guard stays meaningful.
- **Files modified:** `packages/app-shared/src/data/schemas/storedCustomization.schema.ts`
- **Commit:** `dd20e7fa9`

**5. [Rule 3 - Blocking] A build failure that was NOT the plan's predicted spurious one**

- **Found during:** Task 1, first `yarn build` after the barrel edit.
- **Issue:** `@openvaa/matching` failed with `TS2305`/`TS2724` — `'"@openvaa/core"' has no exported
  member 'CoordinateOrMissing'` / `'HasAnswers'`. The plan warned about a non-reproducing first-build
  failure of this family; **this one reproduced on a second run**, so it was diagnosed rather than
  re-run away. Root cause measured: `packages/core/dist/` contained `index.js`, its sourcemap and a
  `tsconfig.tsbuildinfo`, but **no `.d.ts` files at all** — every declaration subdirectory
  (`controller/`, `entity/`, `id/`, `matching/`, `pipelines/`, `serializable/`) was empty and
  `dist/index.d.ts` was absent. The turbo cache had restored a `dist` whose buildinfo told
  `tsc --emitDeclarationOnly` there was nothing to emit, so consumers resolved the untyped `.js`.
- **Fix:** `yarn build --force` (14/14, 0 cached, 19.4 s) regenerated the declarations. Every
  subsequent warm and cold build has been green.
- **Scope judgement:** this is a pre-existing turbo-cache / `tsBuildInfoFile`-inside-`dist`
  interaction in `packages/core`, whose build config this plan never touched. Per the plan's scope
  boundary it was recovered from, not fixed. **Recorded so 157-17 and later app-shared-touching plans
  know the recovery is `yarn build --force`, not a bare re-run**, and so the phase's later plans can
  decide whether the underlying cache/buildinfo interaction is worth a separate fix.
- **Files modified:** none.

### Factual corrections to the plan's premises

Neither changed any code, but both would mislead 157-07 if left unrecorded.

**A. The `notifications` divergence runs the other way.** The plan states that
`notifications.{candidateApp,voterApp}.{title,content}` are "locale objects in storage and plain
strings in `DynamicSettings`". Measured: `NotificationData` in
`packages/app-shared/src/settings/dynamicSettings.type.ts` already types both as `LocalizedString`.
The schema and the declared type therefore AGREE on the stored side. The real divergence is on the
OUTPUT side: `SupabaseDataProvider._getAppSettings:61-73` replaces both with a locale-resolved plain
string before returning, so the provider's return value is **not** literally
`Partial<DynamicSettings>` despite being annotated as one. The schema is identical either way; the
docblock in `storedSettings.schema.ts` records the correction so the next reader does not invert it.
**157-07 should not "fix" the schema to expect plain strings here.**

**B. `SendEmailResultSchema` does not match the plan's illustrative example.** The plan's behaviour
line says `safeParse({ sent: 2, failed: 0, results: [{ status: 'sent' }] })` succeeds. Measured
against `apps/supabase/supabase/functions/send-email/index.ts`, that payload is not one the function
can produce: all four `results` push sites set `user_id` and `email`, so both are required in the
schema and that literal is rejected. Conversely the plan implies `sent`/`failed` are required, but
the dry-run branch at `:194-201` returns `{ success, dry_run, results }` with **no counts at all** —
so both are `.optional()` and only `results` is required. The tests assert the three real branches
instead of the illustrative literal. `RecipientResult.status` is `z.enum(['sent','failed']).optional()`:
the enum is the discriminant the plan asked for, and the optionality is the dry-run branch, which
sets no status.

## In scope, not criterion-mandated

`SendEmailResultSchema` closes research § H.3(ii) — the `// Add typing for return results if possible`
comment at `adminWriter/supabaseAdminWriter.ts:80`. It sits under no numbered phase criterion, and is
recorded here so a verifier does not mark the phase incomplete for the reverse reason. The
`Array<unknown>` return type itself is still in place; replacing it is 157-07's edit.

## Known Stubs

None. Every artifact is production code. No placeholder, TODO, skipped test or unrun `<verify>` was
left behind, and no schema was written without its per-nesting-level rejection cases.

## Threat Flags

None. This plan added no network, auth or file-access surface. Register dispositions:

- **T-157-04** (tampered JSONB reaching domain constructors) — mitigated at the vocabulary level:
  strict at every nesting level, with a rejection test per level in all five files. The parse call
  is 157-07's.
- **T-157-05** (`send-email` invoke result as `Array<unknown>`) — schema delivered; the parse call is
  157-07's.
- **T-157-06** (a throwing parse at the adapter edge) — mitigated by construction: dev-seed's
  throwing `validateTemplate` wrapper was deliberately NOT copied, so there is nothing here for a
  caller to throw from.
- **T-157-SC** (npm/yarn install surface) — verdict OK, measured: one lockfile line, zero new
  third-party packages, `zod` resolving to the already-present 4.3.6.

## Commits

| Task | Gate | Commit | Message |
|---|---|---|---|
| 1 | RED | `cb3072350` | `test(157-02): add failing tests for the stored image and answers schemas` |
| 1 | GREEN | `9743f1277` | `feat(157-02): add the stored image and answers schemas to app-shared` |
| 2 | RED | `c0728627b` | `test(157-02): add failing tests for the settings and customization schemas` |
| 2 | GREEN | `dd20e7fa9` | `feat(157-02): add the stored settings and customization schemas` |
| 3 | RED | `5b95b34c4` | `test(157-02): add failing tests for the send-email result schema` |
| 3 | GREEN | `945978e76` | `feat(157-02): add the send-email result schema and complete the schemas barrel` |

No REFACTOR commits: each GREEN implementation needed no cleanup.

## TDD Gate Compliance

All three tasks ran the full RED/GREEN cycle, each RED observed failing before its module existed:

- Task 1 RED: 2 test files failed with `Cannot find module './storedImage.schema'` / `'./storedAnswers.schema'`; GREEN took the package 41 -> 55.
- Task 2 RED: 2 test files failed on the two missing column schemas; GREEN took it 55 -> 70.
- Task 3 RED: 1 test file failed on the missing send-email schema; GREEN took it 70 -> 79.

Every `test(...)` gate commit precedes its `feat(...)` gate commit in `git log`.

## Concurrency hygiene

Every commit used explicit per-file `git add`. No `git add -A`, no `git add .`, no `git commit -a`,
no `git stash`, no `git clean`. The untracked `.planning/state.json` was left alone. The database was
not touched: no `db:types`, no `db:reset*`, no pgTAP, and `db:lint:sql` was not run.

## Self-Check: PASSED

All 11 created source files and both modified barrels exist on disk; all 6 commit hashes resolve in
`git log`.
