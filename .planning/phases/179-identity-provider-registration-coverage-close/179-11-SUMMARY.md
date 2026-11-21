---
phase: 179-identity-provider-registration-coverage-close
plan: 11
subsystem: contestant-app
tags: [frontend, identity-provider, user-level-data, gates, cookies, data-writer, endpoint, vitest, e2e]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-03: get_user_entities.pending_email_taken; 179-08: identityProviderAccount.ts (PLACEHOLDER_EMAIL_DOMAIN, AddressState, addressStateOf); 179-09: the registered_entities record in app_metadata; 179-10: account-access confirm-address"
provides:
  - "BasicUserData: addressState, pendingEmail, ownOrganizationUnnamed, pendingEmailTaken; email and username never a placeholder address"
  - "$F/lib/contestant/utils/identityProviderAccount.ts: REGISTERED_ENTITIES_KEY, ownOrganizationId, hasDefaultLocaleName"
  - "$F/lib/api/adapters/supabase/utils/userEntities.ts: parseCallerPendingEmailTaken"
  - "the set-password gate's predicate: passwordSet === false && addressState === 'proved'"
  - "COOKIE.identityProviderArrival = 'identity_provider_arrival'"
  - "DataWriter.requestAddressConfirmation({ email, locale }) answering 'sent' | 'in-use' | 'refused'; RequestAddressConfirmationOptions, AddressConfirmationResult; parseAddressConfirmationAnswer"
  - "$F/lib/server/contestant/identityProviderRegistration.ts: handleIdentityProviderRegistration, IDENTITY_PROVIDER_REGISTRATION_RESULT, IdentityProviderRegistrationDeps"
  - "POST /api/contestant/identity-provider; UNIVERSAL_API_ROUTES.identityProviderRegistration"
affects: [179-12, 179-13, 179-14, 179-17, 179-18, 179-19, 179-22]

tech-stack:
  added: []
  patterns:
    - "A server endpoint whose whole decision is a pure handler over injected effects; the +server.ts only builds the effects from the request"
    - "A caller fact of get_user_entities parsed beside password_set and thrown when malformed"

key-files:
  created:
    - apps/frontend/src/lib/server/contestant/identityProviderRegistration.ts
    - apps/frontend/src/lib/server/contestant/identityProviderRegistration.test.ts
    - apps/frontend/src/routes/api/contestant/identity-provider/+server.ts
  modified:
    - apps/frontend/src/lib/api/base/dataWriter.type.ts
    - apps/frontend/src/lib/api/base/universalDataWriter.ts
    - apps/frontend/src/lib/api/base/universalApiRoutes.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/invitationAccess.ts
    - apps/frontend/src/lib/contestant/utils/identityProviderAccount.ts
    - apps/frontend/src/lib/contestant/utils/identityProviderAccount.test.ts
    - apps/frontend/src/lib/contestant/gates/gates.ts
    - apps/frontend/src/lib/contestant/gates/gates.test.ts
    - apps/frontend/src/lib/cookies/index.ts
    - apps/frontend/src/lib/cookies/cookies.test.ts
    - apps/frontend/src/routes/contestant/password-reset/+page.server.ts
    - apps/frontend/src/routes/contestant/password-reset/page.server.test.ts
    - apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts
    - apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts
    - apps/frontend/src/routes/api/admin/jobs/adminJobsAuthorization.test.ts
    - apps/frontend/src/routes/admin/(protected)/layout.server.test.ts
    - tests/tests/specs/admin/admin-access.spec.ts

key-decisions:
  - "A pending address that is now another account's reads as addressState none, pendingEmail null and pendingEmailTaken true; only an account that was pending can read pendingEmailTaken true"
  - "email and username are emptied for any address on the placeholder domain; pendingEmail is set only in the state pending"
  - "ownOrganizationUnnamed narrows the entity list only when the account's record names an organization of this project, so no other account can be failed by the list; a malformed record names nothing"
  - "requestAddressConfirmation never throws: a 401, any other body and a failed call answer refused, logged without the address"
  - "The endpoint checks the session first (401), then same-origin JSON (403), then the body (400 for a malformed one); every domain outcome is 200 with one of five results"
  - "save checks the address state before it writes anything; names are saved before the address is asked for; the own organization must be listed for the caller and unconfirmed, which the endpoint reads through getUserEntities"
  - "The password-reset page's load gives no address to an identity-provider account that holds only its placeholder"

patterns-established:
  - "Red runs against stub modules whose exports exist and answer wrongly, captured with vitest's JUnit reporter and classified RED_EVIDENCE_OK"

requirements-completed: []

actuals:
  tokens: 24900
  tasks: 3
  commits: 4
plan_head_before: f591e24b037c549a2f38bf57797a0b49db2ca22d
plan_head_after: 7615a5b361661147b4cff9a06c38e4667696e89c

metrics:
  duration: "about 60 minutes of work plus three full runs, about 2 hours wall-clock (01:59 to 03:00 UTC, 2026-10-22)"
  completed: 2026-10-22
---

# Phase 179 Plan 11: The user-level facts and CI1's server endpoint Summary

Every signed-in load now knows, from the verified user and `get_user_entities` alone, what state the account's address is in (`none`, `pending` or `proved`), which address is pending, whether the identity's own party still needs a name, and whether the pending address has become another account's. A placeholder address never reaches `email` or `username`. The set-password gate is needed only for a proved address. The writer can ask `account-access` to prove a typed address as the signed-in user, the arrival marker has a cookie name, and one same-origin JSON endpoint saves the party's names and the address, sends the link again and clears the marker. Nothing renders or calls the new facts, method or endpoint yet.

## Tasks

| Task | Commit | What |
|---|---|---|
| 1 | 29c925113 | `feat`: the four `BasicUserData` members, the adapter's derivation, `ownOrganizationId` / `hasDefaultLocaleName` / `parseCallerPendingEmailTaken`, F's address-state term, the reset page's placeholder rule |
| 2 | b105510db | `feat`: `COOKIE.identityProviderArrival`, `requestAddressConfirmation` on the type, the base and the writer, `parseAddressConfirmationAnswer` |
| 3 | 5e165cbff | `feat`: `handleIdentityProviderRegistration`, `POST /api/contestant/identity-provider`, `UNIVERSAL_API_ROUTES.identityProviderRegistration` |
| (spec) | 7615a5b36 | `test`: `admin-access.spec.ts` plants the arrival marker among the httpOnly cookies that must not reach a page |

## Red runs (under `tests/e2e-runs/179-unit/`)

Each red run used stubs whose exports existed and answered wrongly. Each was captured with the JUnit reporter and classified with `gsd-tools check tdd-red-evidence`.

| Run | Head | Exit | Failed / total | Classifier | Target |
|---|---|---|---|---|---|
| `179-11-t1-red` | f591e24b0 | 1 | 28 / 343 | **RED_EVIDENCE_OK** | getBasicUserData > the account's address and the identity's own organization > reads a provider account on its placeholder with nothing pending as none, with no address anywhere |
| `179-11-t2-red` | 29c925113 | 1 | 13 / 260 | **RED_EVIDENCE_OK** | requestAddressConfirmation > answers in-use as the function answers it |
| `179-11-t3-red` | b105510db | 1 | 44 / 48 | **RED_EVIDENCE_OK** | save, the names > writes the names to the organization the record names, and nothing else, then clears the marker |

Semantic check: every failure in t1 and t3 was an assertion. In t2, two of the 13 were TypeErrors: the stub never called `functions.invoke`, so reading the call's arguments threw. The classifier's target was an assertion failure. The cases that passed in each red run were the ones a wrong stub satisfies: refusals, `null` answers, and the non-provider rows the old code already answered correctly.

## Producers of `BasicUserData` named by the type check

`yarn typecheck` on the Task 1 tree named **none** (0 errors). The only producer is `SupabaseDataWriter._getBasicUserData`. Three test fixtures used an `as BasicUserData` cast that hid them from the type check:

- `gates.test.ts` (`userWith`): rewritten without the cast, carrying the four members.
- `routes/contestant/(protected)/layout.server.test.ts` (`userWith`): two of its cases went red in the frontend suite when F's term arrived, because the fixture had no `addressState`. Now typed, with `addressState: 'proved'`.
- `contestantContext.svelte.test.ts` (`USER`): typed, with the four members.

Two RPC mocks drive the real adapter through `getBasicUserData` and needed `pending_email_taken: false` in their `get_user_entities` answer: `requireAdminIdentity.test.ts` and `adminJobsAuthorization.test.ts`.

## Verification

- **Gate rows on the uncommitted Task 1 tree** (`179-11-dirty-gates.sh` in the session scratchpad, the four rows of `179-gates.sh` run directly; label `179-11-t1-gates`): typecheck 0, integration 0 (32/32, including the new "address as proved" case, against the running stack), unit 0 (frontend 6210 passed, 32 skipped), check-frontend 0 (svelte-check: 0 errors, 0 warnings).
- `yarn assert:no-session-in-loads`: 0, both on the Task 1 tree and on the Task 3 tree.
- `yarn lint:check`: 0 on Task 1 (`179-11-t1-lint`), on Task 2 after an import-sort fix (`179-11-t2-lint-r2`; the first run, `179-11-t2-lint`, exited 1 on `simple-import-sort` in two files), on Task 3 after a test typing fix (`179-11-t3-lint-r2`; the first run exited 1 on six svelte-check errors in the new test file), and on the spec commit (`179-11-spec-lint`).
- `yarn assert:cookie-names`, `yarn assert:project-scoped-queries`: 0 for Task 2 and Task 3. `yarn assert:comment-hygiene`: 0 before every commit.
- Frontend unit suite at the final code: 263 files passed, 1 skipped; 6271 tests passed, 32 skipped (`179-11-t3-frontend-unit-r2`).
- **Held run** `179-e2e/179-11-held` (uncommitted Task 1 tree at f591e24b0): 569/569, wrapper exit 0, `restore: ok`, 12.9 min. `node $P/179-verdict.mjs control 179-11-held --full --same-projects-as 179-10-close --dirty-only apps/frontend/src/ --green`: **PASS**, 131 projects compared, 0 not as expected. The 16 kept copies (`179-11-held.<path>.kept`) were byte-identical (`cmp`) to the files committed in 29c925113.
- **Held run 2** `179-e2e/179-11-held-2` (the uncommitted `admin-access.spec.ts` edit on 5e165cbff): 569/569, wrapper exit 0, `restore: ok`. `179-verdict.mjs control 179-11-held-2 --full --same-projects-as 179-11-held --dirty-only tests/tests/specs/admin/admin-access.spec.ts --green`: **PASS**, 131 compared, 0 not as expected. The kept copy was byte-identical to the commit.
- **Close** `179-e2e/179-11-close`, `bash $P/179-e2e.sh 179-11-close` on the committed head 7615a5b36: 569/569, driver exit 0, wrapper exit 0, `restore: ok`, 0 Sleep / Wake entries in the window, on AC power. `node $P/179-verdict.mjs e2e 179-11-close --same-projects-as 179-11-held`: **PASS**, 131 projects compared, 0 not as expected. The plan adds no E2E test, so no `--except`.
- **Verify blocks**, byte for byte (`179-11-t{1,2,3}-verify.sh`) and restated (`-verify-restated.sh`: `yarn -s X > /dev/null` → `yarn X > /dev/null`, and `--dirty-only apps/frontend/src` → `apps/frontend/src/`):
  - t1 at 29c925113: as written 1, at the `yarn -s` stage ("Unsupported option name (-s)"); restated **0**.
  - t2 at b105510db: as written 1, at `yarn -s`; restated **0**.
  - t3 at 7615a5b36 (after the close): as written 1, at `yarn -s`; restated **0** (this includes the close verdict and `lint:check`).
  - t1 and t2 restated again at 7615a5b36 (`-verify-restated-final`): **0**, **0**.

## Code review checklist (`.agents/code-review-checklist.md`)

- **Solves the plan's issues:** yes, all three tasks. Nothing renders or calls the new pieces; 179-12 and 179-14 will.
- **OWASP:**
  - The endpoint answers 401 without a verified session. It answers 403 unless the request is JSON with an `Origin` equal to its own, so a cross-site form post or a no-CORS fetch cannot save anything (T-179-111).
  - It takes no entity from the request. A body carrying `id` or `target` is ignored, and a unit case asserts that. Names go only to the organization the account's `registered_entities` record names for this project, only when the caller's own list holds it unconfirmed, and RLS and `enforce_entity_immutability` still decide the write (T-179-112, PROH-179-18).
  - An address reaches `account-access` only through `requestAddressConfirmation`, only for an account with no proved address. The writer sends no header of its own, so the operation reads the caller from the session's token.
  - The placeholder never reaches `email` or `username`, nor the reset page's `email` (T-179-113).
  - F's term reads the state the server derives from `getUser()` (T-179-114). The facts are read from the verified user and the RPC, never from the session object; a unit case gives the session object different facts and asserts they are ignored (T-179-115).
  - No answer of the endpoint carries an address, a name or an id. The writer's log line on a failed confirmation names the failure, not the address.
- **Code style, TSDoc, `any`:** every new export and member is documented. There is no `any`. The test files cast hostile values with `as unknown as`, as their neighbours do.
- **Repetition:**
  - `UUID_PATTERN` now has a fourth copy (frontend `identityProviderAccount.ts`); three were already in the functions.
  - `REGISTERED_ENTITIES_KEY` is a second copy of the function's constant. A text test in `identityProviderAccount.test.ts` holds it equal to `ownEntity.ts`.
  - The small `isObject` / `isRecord` guards repeat a common pattern of this tree.
- **Docs:** no repository document was changed, because the plan lists none. The sentences this work makes incomplete are listed under *Items to report*.
- **Tracking events, Svelte components, WCAG, keyboard:** not applicable. No UI was added, and the endpoint is not yet linked.
- **Errors:**
  - A failed or malformed caller fact throws, as the password fact does.
  - The endpoint never rejects. A failure is logged by its message alone and answered `failed`.
  - `requestAddressConfirmation` never rejects. Every failure is `refused`.
- **Shared dependencies:**
  - The Admin App calls `getBasicUserData` on every job poll. It now also reads `pending_email_taken`, which the RPC always returns, and narrows the list only for a recorded organization. The admin unit specs were updated and the admin E2E projects are green.
  - The protected layout's `passwordSet` check is unchanged.
- **Comment hygiene:** no ids, no history; `assert:comment-hygiene` reported 0 before every commit.
- **Commit history:** four commits, linear, none `[db]`. The spec commit is separate because its own held run had to pass before it was committed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Privacy] The password-reset page rendered the placeholder address**
- **Found during:** Task 1, reading the four surfaces UI-SPEC T-6 names.
- **Issue:** `routes/contestant/password-reset/+page.server.ts` returns `user.email` from `locals.safeGetSession()`, not from `BasicUserData`. For an identity-provider account still on its placeholder, that put the placeholder under "Signed in as" and into the password manager's `username` field. UI-SPEC's premise ("each of the four already omits the address when there is none, so the rule is met by the user-level data carrying no address") did not hold for this one.
- **Fix:** the load answers `email: undefined` unless `addressStateOf` reads the verified user as `proved`. Unit cases cover a placeholder with nothing pending, a placeholder with an address pending, and a provider account on a proved address.
- **Files:** `password-reset/+page.server.ts`, `page.server.test.ts`. **Commit:** 29c925113, in the held set.

**2. [Rule 3 - Blocking] Fixtures and mocks the type check did not name**
- **Issue:** two `layout.server.test.ts` cases went red, and the admin specs' RPC mocks would have thrown on the missing `pending_email_taken`.
- **Fix:** the fixtures and mocks listed under *Producers* above. **Commit:** 29c925113.

**3. [Rule 3 - Blocking] A second unit pin of the cookie map**
- **Issue:** `routes/admin/(protected)/layout.server.test.ts` pins `Object.values(COOKIE)` to an exact list, and went red when the marker was added.
- **Fix:** `identity_provider_arrival` added to that list. **Commit:** b105510db.

**4. [Rule 2 - Coverage] The admin E2E spec's copy of the httpOnly cookie names**
- **Issue:** `tests/tests/specs/admin/admin-access.spec.ts` keeps a copy of the cookie names. Its comment says the unit pin reddens so that this copy grows with the map; 179-07 grew it the same way.
- **Fix:** the marker added to the copy. That changes a spec, so it was held uncommitted through `179-11-held-2` (green) before its own commit, 7615a5b36. This costs one full run more than the plan names.

**5. [Rule 2 - Coverage] `parseCallerPendingEmailTaken` unit cases** in `userEntities.test.ts` (not listed), beside `parseCallerPasswordSet`'s. They were written with the parser, not red first. The adapter-level cases that cover the same throw were red first.

**6. [Rule 3 - Blocking] `yarn -s` rejected by Yarn 4.18.1** in every verify block. Both forms were run and kept. The restated form also adds the trailing slash `179-verdict.mjs --dirty-only` needs for a directory.

**7. [Rule 3 - Tooling] `zsh` does not word-split a `$(…)` file list.** The first Task 1 `git commit -- $FILES` was refused, and nothing was committed. It was redone with the pathspec `apps/frontend/src`; the only changes under it were this task's.

### Judgement calls within the plan's text

- **The endpoint reads `getUserEntities` as a third writer method.** The plan names the writer's two methods. "Refused unless the own organization is … unconfirmed" needs the organization's `confirmed`, which only the entity list carries, and checking that it is listed also confirms the caller still edits it.
- **The verified user comes from `locals.safeGetSession()`**, not a bare `locals.supabase.auth.getUser()`. The checklist asks route guards to use `safeGetSession`, which performs the same `getUser()` verification.
- **A malformed body answers 400 `failed`.** The plan names 401 and 403 only. Every domain outcome is 200, and the five closed results are unchanged.
- **`save` checks the address state before writing anything.** A proved account sending names and an address gets `failed` with nothing written. The names-before-address order applies once the request is admissible.
- **`resend` answering `in-use` maps to `failed`**, as the plan's "answers `sent` or `failed`" states.
- **The confirmation mail's locale is the request's `locals.currentLocale`.** The body carries no locale.
- **The protected layout's `passwordSet` check was left alone.** It still validates only `passwordSet`; the gate wiring is 179-14's.

**Files touched that the plan did not list:** `utils/userEntities.ts`, `utils/userEntities.test.ts`, `utils/invitationAccess.ts`, `routes/contestant/password-reset/+page.server.ts`, `routes/contestant/password-reset/page.server.test.ts`, `routes/contestant/(protected)/layout.server.test.ts`, `contexts/contestant/contestantContext.svelte.test.ts`, `server/admin/requireAdminIdentity.test.ts`, `routes/api/admin/jobs/adminJobsAuthorization.test.ts`, `routes/admin/(protected)/layout.server.test.ts`, `tests/tests/specs/admin/admin-access.spec.ts`. The plan listed `cookies.test.ts` and `supabaseDataWriter.integration.test.ts`, and both were changed.

## Items to report rather than edit

- **Docs made incomplete** (no-edit for this plan):
  - `apps/docs/…/contestant-app/registration/+page.md` (around "A user who signed in by a mailed link has no password…" and the `getBasicUserData` row of its table) says F is decided on `passwordSet` alone and that `getBasicUserData` reads only `password_set`. 179-22 lists this file.
  - `apps/docs/…/backend/authentication/+page.md` ("The set-password gate is … decided on the server by the user-level data's `passwordSet`") is listed by no later plan, as far as the 179-20..24 file lists show.
- **`179-UI-SPEC.md` T-6** says each of the four surfaces is covered by the user-level data carrying no address. The reset page reads the session's verified user instead (deviation 1). No-edit file.
- **"A unit case per surface with a placeholder user"** (the plan's UI privacy truth):
  - The adapter and the reset page have such cases.
  - `NothingToEdit` has an empty-address case.
  - `SetPasswordGate.svelte` and the settings page have no unit spec at all, so neither has one. Both render `contestantCtx.user.email`, which the adapter now empties.
  - Settle in 179-12, 179-17 or 179-18 if a component case is wanted.
- **`privacyAllowlists.ts`** (`tests/tests/utils/`) allows exactly the current cookie names on a device. Whichever plan first sets `identity_provider_arrival` (the callback, 179-13 or 179-14) must add it there. Otherwise a device-state check will flag it.
- **The handler logs a caught error's message.** The writer's messages carry PostgREST text, which names columns and constraints but no address or token on the paths reached here. Keep that in mind if a later write path is added.
- **The `UUID_PATTERN` copy count is now four**, with no equality test across runtimes.

## Statements observed and inferred

- **Observed:** the three red runs, every gate exit above, the unit totals, the integration case on the running stack, the two held runs and the close run with their verdicts, and the byte-identity of the kept copies.
- **Inferred:**
  - That the endpoint behaves as its unit cases show when served. Nothing calls it, and no E2E test drives it; 179-14 does.
  - That `functions.invoke` on the server client sends the session's access token. This follows from supabase-js's `fetchWithAuth`; the operation's 401 path was observed in 179-10, not through this writer.

## Known Stubs

None. The red-run stubs were replaced before each commit.

## Self-Check: PASSED

- The three created files exist, and every modified file is on the tree.
- Commits 29c925113, b105510db, 5e165cbff and 7615a5b36 are ancestors of HEAD; `git rev-list --count f591e24b0..7615a5b36` = 4.
