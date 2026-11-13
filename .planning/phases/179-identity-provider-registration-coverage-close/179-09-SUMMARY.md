---
phase: 179-identity-provider-registration-coverage-close
plan: 09
subsystem: identity-callback
tags: [edge-function, identity-provider, organization, own-entity, app-metadata, pii, server-credential, vitest]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-08: registrationMatrix.ts (ServedEntityType), the request contract and the placeholder constant"
provides:
  - "$IC/organizationRecord.ts: createOrganization, deleteOrganization, OrganizationCreateClient, OrganizationDeleteClient, OrganizationDeleteFilter"
  - "$IC/ownEntity.ts: REGISTERED_ENTITIES_KEY, RegisteredEntities, OwnEntityResolution, OwnEntityLookupClient, readRegisteredEntity, withRegisteredEntity, resolveOwnEntity"
  - "$IC/appMetadata.ts: REMOVED_CLAIM_KEYS, RemovedClaimKey, IdentityAppMetadataInput, IdentityAppMetadata, identityAppMetadata"
  - "$IC/serverCredential.ts: SERVER_CREDENTIAL_HEADER, presentsServerCredential"
affects: [179-13, 179-15]

tech-stack:
  added: []
  patterns:
    - "A table-backed fake client that applies every eq filter and answers maybeSingle() as PostgREST does (two rows are an error), so an under-filtered query fails in the unit test as it would against the database"
    - "The app_metadata record is read, changed in one entry and written whole, because the auth service merges app_metadata at its top level only"

key-files:
  created:
    - apps/supabase/supabase/functions/identity-callback/organizationRecord.ts
    - apps/supabase/supabase/functions/identity-callback/organizationRecord.test.ts
    - apps/supabase/supabase/functions/identity-callback/ownEntity.ts
    - apps/supabase/supabase/functions/identity-callback/ownEntity.test.ts
    - apps/supabase/supabase/functions/identity-callback/appMetadata.ts
    - apps/supabase/supabase/functions/identity-callback/appMetadata.test.ts
    - apps/supabase/supabase/functions/identity-callback/serverCredential.ts
    - apps/supabase/supabase/functions/identity-callback/serverCredential.test.ts
  modified: []

key-decisions:
  - "P9 read null-removes, so identityAppMetadata always adds hetu: null and birthdate: null (PL-09 built)"
  - "resolveOwnEntity reads the grant with all five filters (user, entity scope, type, recorded id, editor) and then the row by id and project; J6 at its proposal: a record whose grant or row is gone answers gone, and the module creates nothing"
  - "A malformed record anywhere in registered_entities throws ERR_REGISTERED_ENTITIES_MALFORMED on read and on write; null or undefined app_metadata reads as no record"
  - "presentsServerCredential takes the configured value as a parameter and names the variable through a module constant, so assert:edge-function-env does not yet derive IDENTITY_CALLBACK_SERVER_SECRET as required; 179-15's literal requireEnv call in index.ts will"
  - "The constant-time comparison loops over the presented bytes and indexes the expected bytes modulo their length, so its time depends only on the presented length"

patterns-established:
  - "A red run against a wrong-answering stub, captured with vitest's JUnit reporter and classified by gsd-tools check tdd-red-evidence (as in 179-08)"

requirements-completed: []

actuals:
  tokens: 13699
  tasks: 3
  commits: 4
plan_head_before: 9219c8f415a752a59724f5f58dd582e122acd5bc
plan_head_after: d4dfe33f2e4ca92c2d337afbc6fcd605eb04027d

metrics:
  duration: "about 9 minutes (00:55 to 01:04 UTC, 2026-10-22)"
  completed: 2026-10-22
---

# Phase 179 Plan 09: The organization row, the own-entity record, the metadata builder and the server credential Summary

Four new pure modules beside `identity-callback/index.ts`, each with its own tests, and none of them called yet:

- **The organization row.** It is written unconfirmed and without a name, in the project the request names. It can be deleted again by id and project.
- **The own-entity record.** It lives at `app_metadata.registered_entities[<project>][<type>]`. It is resolved only through the user's live editor grant on exactly the recorded entity, so a user who edits two candidates is no longer a throw.
- **The metadata builder.** It never carries `hetu` or `birthdate`, and it sends both as null so an older account loses them.
- **The credential check.** It compares `x-identity-callback-secret` against the configured secret in constant time.

## Tasks

| Task | Commit | What |
|---|---|---|
| 1 | 0a6868d0b | `organizationRecord.ts` and its test (10 cases) |
| 2 | a6f25b415 | `ownEntity.ts` and its test (42 cases) |
| 3 | d7b82c05e | `appMetadata.ts` (5 cases) and `serverCredential.ts` (18 cases), with their tests |
| 3 (doc) | d4dfe33f2 | `docs`: a TSDoc line in `serverCredential.ts` that named the runtime's env call now names the variable instead (see Deviations 2) |

## Red runs (under `tests/e2e-runs/179-unit/`)

Each red run was made against a stub that exports the module's names and answers wrongly. Every failure is therefore an assertion, not an import error. Each was captured with the JUnit reporter and classified with `gsd-tools check tdd-red-evidence`.

| Run | Head | Exit | Failed / total | Classifier | Target |
|---|---|---|---|---|---|
| `179-09-t1-red` | 9219c8f41 | 1 | 10 / 10 | **RED_EVIDENCE_OK** | inserts exactly the project and an unconfirmed flag into organizations, and nothing else |
| `179-09-t2-red` | 0a6868d0b | 1 | 33 / 42 | **RED_EVIDENCE_OK** | resolves a user holding editor grants on two candidates of the project to the recorded one, without a throw |
| `179-09-t3-red-nofiles` | a6f25b415 | 1 | 0 / 0 | INVALID_RED `zero_tests_discovered` | the two paths were passed as one word (a zsh quoting slip), so vitest found no file. Kept under its own name. Not evidence. |
| `179-09-t3-red` | a6f25b415 | 1 | 22 / 23 | **RED_EVIDENCE_OK** | carries no value of a claim the provider extracted, even when the claims are handed to it |

In each run, the cases that passed are the ones a wrong stub happens to satisfy (read from each run's JUnit file):
- t2: the six "answers null" reads, the inherited-key read, "leaves the metadata it was given unchanged" and the `none` case (9).
- t3: "accepts a header equal to the configured secret", which an always-true stub satisfies (1).

## The P9 branch built

`179-PROBE-FINDINGS.md` reads `P9: null-removes`. So PL-09's strip is built: `identityAppMetadata` always answers `hetu: null` and `birthdate: null`, taken from `REMOVED_CLAIM_KEYS`. A test also holds that every claim either provider configuration extracts is in `REMOVED_CLAIM_KEYS`.

## The assumption-delta decision as built

- **Promoted:** the triple of the provider's `sub` (through the account it finds), the project and the entity type, stored as `app_metadata.registered_entities[<project>][<type>]`.
- `resolveOwnEntity` reads `grants` with `user_id`, `scope = 'entity'`, `target_type`, `target_id = <recorded id>` and `role = 'editor'`. It then reads the type's table by `id` and `project_id`.
- `findExistingCandidate` is untouched. Its removal is 179-13's.
- **The invariant** ("a record written for an identity is read back as its entity only through a live grant on it") is asserted for both `candidate` and `organization`. A record written by `withRegisteredEntity` is read back by `readRegisteredEntity` and resolves to `found` when the user also holds a grant on a second entity of the type. It resolves to `gone` when only the other entity's grant exists.

## Verification

- **The verify blocks, byte for byte** (`179-09-t{1,2,3}-verify.sh`): each exits 1, and only at the `yarn -s` stage. The `-verify-prefix` scripts, which are the same block cut just before that stage, exit 0 for all three at the final head.
- **Restated** (`yarn -s` changed to `yarn`, `-verify-restated.sh`): exit 0 for all three at the final head d4dfe33f2 (`-verify-restated-final`).
- **The first t3 run** (`179-09-t3-verify`, `-restated`, `-prefix`, head d7b82c05e) exited 1 at the `Deno\.` stage. See Deviations 2. After d4dfe33f2 the `-r2` runs give restated 0 and prefix 0.
- `yarn workspace @openvaa/supabase test:unit`: 21 → 25 files and 814 → 889 tests, green.
- `yarn lint:check` (`179-09-lint`, at d4dfe33f2): exit 0. That includes `assert:edge-function-env` (10 required names, unchanged) and `assert:edge-env-defaults`.
- An ad hoc strict `tsc --noEmit` over the four modules and their tests: exit 0. No repository gate typechecks Edge Function files.
- `yarn assert:comment-hygiene`: 0 violations before every commit.
- **No E2E run, and no close run.** The plan adds only modules that nothing loads:
  - The diff `9219c8f41..d4dfe33f2` is the 8 added files under `apps/supabase/supabase/functions/identity-callback/` and nothing else.
  - A `git grep` for imports of the four modules outside test files finds only `appMetadata.ts` importing `ownEntity.ts`. `index.ts` imports none of them.
  - No browser-observable surface, dataset, schema, harness or loaded function code changed. `179-07-close` (569/569) remains the latest full run.

## Code review checklist (`.agents/code-review-checklist.md`)

- **Solves the plan's issues:** yes, all four modules and their tests.
- **OWASP:** the plan's threat register is mitigated in code and test.
  - T-179-091: no claim values get through, and both keys are nulled.
  - T-179-092: nothing but the record and the grant is matched.
  - T-179-093 / T-179-094: `gone` means nothing is created.
  - T-179-095: a constant-time comparison over bytes; a missing header is refused before the secret is read.
  - T-179-096: a malformed record throws, and so does every client error.
  - Records are read through own properties only, so inherited names do not read as records. The record is written with computed keys, which set no prototype.
- **Code style / TSDoc:** every export is documented. No `any`.
- **Repetition:** `organizationRecord.ts` repeats `candidateRecord.ts`'s create and delete shape for the other table. The plan asks for a module of its own, and 179-13 removes the candidate lookup. The grant read in `ownEntity.ts` repeats the literals `'entity'` and `'editor'` that `writeEntityGrant` writes (see Deviations 3). `UUID_PATTERN` is now a third copy (also in `requestContract.ts` and `account-access/contract.ts`).
- **Docs:** no repository document describes these modules yet. The database skill's § Service Patterns 1 still describes `identity-callback` as finding a returning candidate through its grant, which is true until 179-13.
- **Tracking, Svelte, WCAG, keyboard:** not applicable (no UI).
- **Error handling:** every failure is a throw with a code. Messages carry the client's text only: no project, user or entity id, and no secret.
- **Comment hygiene:** no ids and no history.
- **Commit history:** 4 commits, linear, none `[db]`. The `docs` commit fixes a line of the commit before it. That is a candidate for squashing at ship time; this plan did not rewrite history.
- **Edge Functions section:** these modules decide no authority and create no client.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `yarn -s` rejected by Yarn 4.18.1 in all three verify blocks**
- **Found during:** Tasks 1–3 verify.
- **Fix:** both forms are kept. The block as written exits 1 at that stage. The restated block (`yarn workspace … test:unit > /dev/null`) exits 0. The prefix runs show that every stage before it passes.

**2. [Rule 1 - Doc accuracy] A TSDoc line in `serverCredential.ts` named `Deno.env.get(...)`**
- **Found during:** Task 3 verify, at the stage that asserts no `Deno.` in the module.
- **Issue:** the module reads no environment, but the `@param expected` line gave the caller's call as an example. The stage counts that comment.
- **Fix:** the line now names the environment variable rather than the runtime call (d4dfe33f2). No code changed. The comment had described a caller that does not exist yet, so the stage was not bent: the comment was inaccurate.

**3. [Judgement] The key link "the editor grant read with the vocabulary the grant write uses" (`ENTITY_GRANT_VOCABULARY`)**
- `ENTITY_GRANT_VOCABULARY` is a module-private constant of `entityGrant.ts`. `179-PATTERNS.md` lists `entityGrant.ts` as unchanged, and it is code the function loads.
- So `ownEntity.ts` does not import the constant. Instead it imports the type `EntityGrantType` derived from it, and it types the grant's `target_type` as that type (`const grantTargetType: EntityGrantType = entityType`). The served types are held to the grant vocabulary at compile time.
- The pattern string `ENTITY_GRANT_VOCABULARY` does not appear in `ownEntity.ts`. Exporting the constant (one word in `entityGrant.ts`) would make it appear, at the cost of changing a loaded file. That is left to the orchestrator.

**Files touched that the plan did not list:** none. Evidence files under `tests/e2e-runs/179-unit/` are gitignored.

### Judgement calls within the plan's text

- `readRegisteredEntity`:
  - `null` or `undefined` metadata reads as no record.
  - Metadata that is a string or an array throws as malformed.
  - The whole record is validated, so a malformed entry of another project throws too. A malformed record never reads as "none".
- `withRegisteredEntity` also throws when the id is not a uuid, so it cannot write a record the reader would reject.
- `presentsServerCredential(presented, expected)`:
  - `expected` is a value, not a reader. 179-15's plan checks the header in `index.ts` before it reaches `requireEnv`.
  - The module itself also answers false for a missing or empty header before it reads `expected`, as the behaviour asks.
- `resolveOwnEntity` reads the grant first and returns `gone` without reading the row when there is no grant.

## Items to report rather than edit

- **`ENTITY_GRANT_VOCABULARY` is not exported** (Deviations 3). If the key link must hold literally, `entityGrant.ts` needs `export` on the constant. Settle in 179-13, which edits the function anyway.
- **The database skill's** § Service Patterns 1 (`identity-callback` "creates user + candidate", "a returning identity's candidate is found through its grant") and § RLS 9 ("the same question is two service-role queries: the user's candidate-editor grants, then the entity table") become false when 179-13 wires `resolveOwnEntity`. Settle in 179-13 or 179-24.
- **`UUID_PATTERN`** now has three copies across the two functions. This is intentional (no shared module directory) and is not held equal by a test.

## Statements observed and inferred

- **Observed:** every red and green run above, the unit suite counts, `lint:check`, the ad hoc typecheck, the diff's file list, and that `index.ts` imports none of the new modules.
- **Inferred:** that the function and the suite behave exactly as at 179-07-close. Nothing loaded changed, and no E2E run was made.
- **Inferred, not probed:** that the auth service stores the nested `registered_entities` object as given. P9 observed top-level merge and null removal only.

## Known Stubs

None. The stubs used for the red runs were replaced before each commit.

## Self-Check: PASSED

- All eight files under key-files.created exist.
- Commits 0a6868d0b, a6f25b415, d7b82c05e and d4dfe33f2 are ancestors of HEAD.
