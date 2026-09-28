---
phase: 158-routing-auth-surface-harmonisation
plan: 05
subsystem: auth
tags: [sveltekit, form-actions, jwt, rbac, supabase, eslint-boundary, vitest, playwright]

requires:
  - phase: 158-01
    provides: "`$lib/routes/` as the single routes locus, with `safeRedirectTarget` and `buildRoute` in one barrel, plus the measured `redirectTo` round-trip result"
  - phase: 158-08
    provides: "`158-API-LOGIN-CALLER-MEASUREMENT.md`, the `git grep -nE` word-boundary trap, and the measured duplicate role triple at `supabaseDataWriter.ts:194`"
  - phase: 157.2-04
    provides: "the deletion of `routes/api/auth/login/+server.ts`, which fired `REVIEW-RT-01`'s deletion clause upstream"
provides:
  - "`$lib/auth/roles.ts` — one declaration of `ADMIN_ROLES` and `CANDIDATE_ROLES`, plus `hasAnyRole` and a fail-closed `readUserRoles`"
  - "`$lib/auth/passwordLogin.ts` — one password sign-in, session read-back, claims decode and role gate, returning a discriminated outcome"
  - "Both login form actions reduced to thin wrappers, 57 lines to 28 lines each"
  - "A re-verification of the deleted generic login route at a later HEAD, with positive controls and a newly caught false-positive instrument"
  - "The upstream adapter-leakage allowlist observed and recorded, and the filed blocking follow-up's two halves given separate dispositions"
affects: [158-06, 158-07, 158-12, admin form actions, candidate auth, adapter boundary work]

actuals:
  tokens: 20000
  tasks: 4
  commits: 5

tech-stack:
  added: []
  patterns:
    - "A shared server helper that takes the CALLER'S request context as a required parameter, so session cookies land on the caller's response"
    - "A vendor-neutral structural port (`auth`) rather than a named client, so the helper needs no adapter-boundary allowlist entry"
    - "Role sets declared with `as const satisfies ReadonlyArray<Enums<'user_role_type'>>`, making a migration rename a compile error"

key-files:
  created:
    - apps/frontend/src/lib/auth/roles.ts
    - apps/frontend/src/lib/auth/passwordLogin.ts
    - apps/frontend/src/lib/auth/passwordLogin.test.ts
  modified:
    - apps/frontend/src/lib/auth/index.ts
    - apps/frontend/src/routes/admin/login/+page.server.ts
    - apps/frontend/src/routes/candidate/login/+page.server.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - .planning/phases/158-routing-auth-surface-harmonisation/158-API-LOGIN-CALLER-MEASUREMENT.md
    - .planning/todos/pending/2026-08-28-admin-login-supabase-independence.md

key-decisions:
  - "The helper takes a vendor-neutral `auth` port rather than the whole request context, which keeps `$lib/auth/passwordLogin.ts` off the adapter-boundary allowlist and leaves `apps/frontend/eslint.config.mjs` unmodified"
  - "The post-login redirect OVERRIDE stays hand-interpolated: `buildRoute` resolves a NAMED route from the route map and a validated `redirectTo` is an arbitrary path with no name, so neither arm of the plan's round-trip branch was literally available"
  - "The third copy of BOTH role sets, in `supabaseDataWriter._getBasicUserData`, was collapsed onto the shared module — the plan's own truth says the admin set is declared in exactly one place, and the filed follow-up names that duplicate as a closing condition"
  - "`readUserRoles` fails closed on every malformed input where the four inline decodes threw, including the base64url alphabet real tokens actually use"
  - "Test-fixture occurrences of role NAMES were left as literals; a fixture that read the constant under test would make the cross-role cases pass vacuously"

patterns-established:
  - "Absence verification with a positive control taken in the SAME run, and the instrument named when it produces a false positive"
  - "Log LABEL rather than credential: the helper logs the entry point's name plus the backend's message, never the password, token or claims payload"
  - "Privilege boundaries asserted in BOTH directions plus an admit case, so a rejection is shown to discriminate on the role set rather than on the fixture"

requirements-completed: [REVIEW-RT-01, REVIEW-RT-05]

coverage:
  - id: D1
    description: "One shared password-login helper performing the sign-in, session read-back, claims decode and role gate, returning a discriminated outcome that neither throws nor redirects"
    requirement: REVIEW-RT-01
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/auth/passwordLogin.test.ts#passwordLogin (11 cases)"
        status: pass
      - kind: e2e
        ref: "yarn test:e2e — 150 passed / 0 failed / 0 flaky / 0 skipped, incl. tests/tests/specs/candidate/candidate-journey.spec.ts:285 'full candidate journey end-to-end'"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both surviving login entry points are thin wrappers differing only in role set, redirect target and log label; 57 lines to 28 lines each"
    requirement: REVIEW-RT-01
    verification:
      - kind: other
        ref: "wc -l apps/frontend/src/routes/{admin,candidate}/login/+page.server.ts -> 28, 28 (was 57, 57)"
        status: pass
      - kind: e2e
        ref: "yarn test:e2e — candidate-journey login and logout legs green in a 150/150 run"
        status: pass
    human_judgment: false
  - id: D3
    description: "The admin role set declared exactly once, with the database named as the authoritative boundary in its own docblock, and the neither-gate-widened property proven in both directions"
    requirement: REVIEW-RT-05
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/auth/passwordLogin.test.ts#'rejects a candidate-only principal against the admin role set' and #'rejects an admin-only principal against the candidate role set'"
        status: pass
      - kind: other
        ref: "grep -ci 'authoritative' apps/frontend/src/lib/auth/roles.ts -> 2; grep -c 'enum ' -> 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The generic API login route's absence re-verified at a later HEAD, with positive controls in the same run and a newly caught false-positive instrument recorded"
    requirement: REVIEW-RT-01
    verification:
      - kind: other
        ref: "git grep S1-S4 -> 0/0/0/0/0 with six non-zero controls; the plan's own plain-grep verify form returns 1 from an untracked gitignored tsbuildinfo, recorded in 158-API-LOGIN-CALLER-MEASUREMENT.md"
        status: pass
    human_judgment: false
  - id: D5
    description: "The upstream adapter-leakage allowlist observed, and the filed blocking follow-up's backend-independence half left correctly OPEN"
    verification:
      - kind: other
        ref: "the rewritten admin wrapper copied to a non-allowlisted path still fires the boundary guard (1 error at 17:24), proving eslint.config.mjs:50 is still load-bearing"
        status: pass
    human_judgment: true
    rationale: "Whether the remaining single `.supabase` access per wrapper is an acceptable resting point, or must be driven behind the adapter now, is the operator's call under criterion 6 — this plan may only record what it found."

duration: 40min
completed: 2026-09-02
status: complete
---

# Phase 158 Plan 05: Login Collapse Summary

**One `passwordLogin` helper and one `roles.ts` behind both login form actions — 57-line entry points down to 28, the role sets declared once for three consumers, and the deleted generic endpoint's absence re-verified with a control that caught a false positive the plan's own verify command would have reported as a failure.**

## Performance

- **Duration:** ~40 min (of which 10.8 min was the full E2E suite and ~3 min `db:reset`)
- **Started:** 2026-09-01T20:44Z
- **Completed:** 2026-09-01T21:25Z
- **Tasks:** 4
- **Files modified:** 9 (3 created, 6 modified)

## Accomplishments

- **The duplication is gone.** The sign-in call, the session read-back, the JWT-claims decode and the role gate existed twice, line for line, in the two login form actions and a third time inside the Supabase data writer's role derivation. They now exist once. Each surviving entry point reads as: parse the form body, validate the redirect target, call the helper, translate the outcome.
- **Neither gate widened, proven in both directions.** A candidate-only principal is still rejected against the admin set and an admin-only principal against the candidate set, as two separately named unit cases plus an admit case that shows the rejections discriminate on the role set rather than on the fixture. The allowed set is a required parameter with no default, and no entry point reads a role from request input.
- **`ADMIN_ROLES` says what it is.** Its docblock states plainly that the database's row-level policies are the authoritative boundary and this set is an app-entry gate — "a change here is a change to who sees the door, never to who holds the key."
- **The absence verification caught its own instrument failing.** The plan's `<verify>` block specifies a plain `grep -rn`; run verbatim it returns **1**, from an untracked, gitignored `tsconfig.tsbuildinfo` still listing the deleted route's paths. `git grep` returns 0. Both readings are recorded, with the six positive controls that make the zeros meaningful.
- **The full E2E suite: 150 passed, 0 failed, 0 flaky, 0 skipped**, in 10.8 min against a fresh `db:reset` and a single fresh dev server — including the candidate journey's login and logout legs, which traverse the rewritten wrapper end to end.

## Task Commits

1. **Task 1: verify the generic API login route is absent** — `6f9e99115` (docs)
2. **Task 2: role sets and shared helper — RED** — `a306307c4` (test)
3. **Task 2: role sets and shared helper — GREEN** — `03cfda852` (feat)
4. **Task 3: thin the wrappers** — `e585787e7` (refactor)
5. **Task 4: read the upstream allowlist and record it** — `a97ffeee5` (docs)

No REFACTOR commit: the GREEN implementation needed no clean-up pass, and an empty commit is worse than none.

## Files Created/Modified

- `apps/frontend/src/lib/auth/roles.ts` — **new.** `ADMIN_ROLES`, `CANDIDATE_ROLES`, `hasAnyRole`, `readUserRoles`, plus two private helpers. 89 lines.
- `apps/frontend/src/lib/auth/passwordLogin.ts` — **new.** `passwordLogin`, `PasswordLoginContext`, `PasswordLoginOutcome`, and the single internal `signIn`. 122 lines.
- `apps/frontend/src/lib/auth/passwordLogin.test.ts` — **new.** 17 cases across three describes.
- `apps/frontend/src/lib/auth/index.ts` — two barrel lines.
- `apps/frontend/src/routes/admin/login/+page.server.ts` — 57 → 28 lines.
- `apps/frontend/src/routes/candidate/login/+page.server.ts` — 57 → 28 lines.
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — the third copy of both role sets replaced by two `hasAnyRole` calls.
- `.planning/…/158-API-LOGIN-CALLER-MEASUREMENT.md` — two appended sections (Task 1's re-verification, Task 4's allowlist observation).
- `.planning/todos/pending/2026-08-28-admin-login-supabase-independence.md` — status block naming which half is discharged.

`apps/frontend/src/lib/api/base/universalApiRoutes.ts` was **read and left unmodified**, per Task 3.

## Measurements

### Task 1 — the four searches and their controls, re-run at HEAD `dbb22feba`

| Search | Hits | Control | Hits |
|---|--:|---|--:|
| `git grep -nF "api/auth/login" -- apps packages tests` | **0** | same, `logout` | **1** |
| — | — | `git grep -nF "auth/logout"` (widened) | **10** |
| `git grep -nF "UNIVERSAL_API_ROUTES.login"` | **0** | same, `logout` | **1** |
| ``git grep -nF 'login: `${API_ROOT}'`` | **0** | same, `logout` | **1** |
| `git grep -nw -e LoginParams -e LoginResult` | **0** | `git grep -nw DataApiActionResult` | **99** |
| ``git grep -nE "fetch\(.*['\"`]/api/auth" -- apps/frontend/src`` | **0** | same, `/api` | **2** |

Every control fires and every control reproduces the count `158-08` recorded four commits earlier, so the zeros are facts about the tree.

### The instrument failure this run caught — NEW, not carried forward

`158-08` recorded a `\b`-in-`git grep -E` trap. This run caught a **different** one, in the plan's own verify command:

```
grep -rn "api/auth/login" apps packages tests --exclude-dir=node_modules \
  --exclude-dir=build --exclude-dir=.svelte-kit | wc -l     →  1     ← the plan's <verify>, FAILS
… --exclude='*.tsbuildinfo'                                  →  0     ← control on logout: 1
```

The single hit is `apps/frontend/tsconfig.tsbuildinfo`, untracked and gitignored (`.gitignore:29`), a stale TypeScript incremental cache still listing `./src/routes/api/auth/login/+server.ts`. It **survives `yarn typecheck`** (svelte-check does not rewrite it), so it is not self-healing. `.svelte-kit/types/src/routes/api/auth/` holds only `logout`, confirming the route really is gone. **`git grep` is the correct instrument for this measurement**; the plan's verify command, taken literally, reports a false failure.

### Where the deletion clause fired

`REVIEW-RT-01`'s "deleted rather than kept if the collapse leaves it unused" clause fired **upstream**, at `8ecfc9002` (`fix(157.2-04)`). This plan performs no deletion and claims none. What it owes the requirement is the *collapse*, which is D1 and D2 above.

### The role-enum spelling, read at execution time

**Found: `'candidate' | 'organization' | 'project_admin' | 'account_admin' | 'super_admin'`.** Read from three places, all agreeing:

- `packages/supabase-types/src/database.ts:1322` (the type) and `:1459` (the runtime constant)
- `apps/supabase/supabase/schema/000-enums.sql:22`
- `apps/supabase/supabase/migrations/00001_initial_schema.sql:22`

**Correction to the plan text.** The plan warned that "a concurrent phase renames one of its members, and the login file still reads the pre-rename spelling on the tree today." **No rename is present at this HEAD.** `git grep -nE "ALTER TYPE .*user_role_type"` returns nothing, `git grep -nw party` over the schema and generated types returns nothing, and the candidate login file's `'organization'` matched the enum exactly. The instruction to read the enum rather than transcribe from the plan was followed regardless, and `as const satisfies ReadonlyArray<UserRole>` is what will turn a future rename into a compile error here rather than a gate that silently admits nobody.

### Wrapper line counts

| File | Before | After |
|---|--:|--:|
| `routes/admin/login/+page.server.ts` | 57 | **28** |
| `routes/candidate/login/+page.server.ts` | 57 | **28** |

Exactly at the "at most half" bar (57 / 2 = 28.5).

### The redirect-target build form, and why

**Kept hand-interpolated: `` `/${locals.currentLocale}/${redirectTo}` ``.** Not because the round trip failed — `158-01` measured that it **HELD** and recorded no `REVIEW-RT-03` exclusion — but because **neither arm of the plan's branch was literally available**. `buildRoute` resolves a NAMED route from `ROUTE` via `resolveRoute`; a validated `redirectTo` is an arbitrary relative app path with no name in that map, so the builder structurally cannot express it. The fallback arm, which does have a name, **is** built with the route builder (`buildRoute({ route: 'AdminAppHome' | 'CandAppHome', locale })`).

Considered and rejected: routing the override through `localizeHref` (the route builder's own last step). It would have dropped the base-locale prefix — `/en/candidate/profile` becoming `/candidate/profile`, the same change `158-01` accepted for the hook — and made the two arms of the same `redirect()` agree on prefixing. **Rejected because no test covers the post-login deep-link URL** (`redirectTo` appears in no E2E spec), and changing an unguarded, security-relevant redirect for consistency alone is an unforced risk on a plan whose job is to preserve behaviour while removing duplication. Recorded here as an observation for whoever owns the inconsistency next; `/en/...` resolves correctly today via the `deLocalizeUrl` reroute hook, which the E2E suite exercises at `/en/candidate/auth/callback`.

### The debug logger symbol and import path

**`import { log } from '@openvaa/app-shared'`**, used as `log.error(...)` and `log.debug(...)`. Grepped before writing, as instructed: `git grep -nw logDebugError -- apps packages tests` returns **0** (positive control: `git grep -nw log -- apps/frontend/src` returns 181), so the retired name is genuinely gone and the rename had already landed. `packages/app-shared/src/logging/logger.ts:142` is the declaration; `configureLogger({ level: 'silent' })` is what the spec uses to keep the suite quiet, matching `adminJobsAuthorization.test.ts`.

### The upstream allowlist

`ADAPTER_BOUNDARY_ALLOWLIST` exists (declared `apps/frontend/eslint.config.mjs:27`, applied as `ignores` at `:300`). **Both** login files are in it — `:48` candidate, `:50` admin — annotated `158-HARD`. Group 1 (the boundary's inside) has 6 entries, group 2 (grandfathered) has 9. **Recorded as an observation, never as a criterion; the list was neither grown nor shrunk and `eslint.config.mjs` is unmodified by this plan.**

**Measured, not assumed: both entries are still LIVE.** The rewritten wrapper keeps exactly one `.supabase` access (`context: { auth: locals.supabase.auth, … }`). Copied to a non-allowlisted path under `src/routes/` and linted there, it still fires: `17:24 error A \`.supabase\` access reaches through the adapter boundary`. Striking either entry today would turn `lint:check` red. The probe file was deleted in the same run and the tree verified clean of it.

## Decisions Made

### The helper takes a vendor-neutral `auth` port, not the whole request context

The boundary guard is `MemberExpression[property.name='supabase']`, which fires on **any** `.supabase` access outside the allowlist. Had `passwordLogin.ts` taken `locals` and written `locals.supabase.auth.signInWithPassword(...)`, it would have needed its own allowlist entry — growing a list the plan forbids shrinking and that criterion 6 wants driven to zero.

Instead `PasswordLoginContext` names an `auth` port and a `getSession` callback, described **structurally** (no `@supabase/supabase-js` import), following the same-directory precedent in `getUserData.ts`, whose docblock says the helper "has no business naming the auth vendor." The single `.supabase` access stays in each wrapper, where the allowlist already records it. Net effect: `eslint.config.mjs` untouched, the helper needs no amnesty, and the plan's "keep the backend sign-in behind ONE internal function so its body can be swapped later" is satisfied at the port rather than inside the function.

### `readUserRoles` fails closed where the inline decodes threw

The four inline copies ran `JSON.parse(atob(session.access_token.split('.')[1]))` bare. Two latent defects, both now closed and both asserted:

1. **`atob` rejects the base64url alphabet.** JWTs are base64url (`-`, `_`, no padding) and `atob` throws `InvalidCharacterError` on `-`. The new decode normalises the alphabet and re-pads. The spec's case builds the fixture with `Buffer.toString('base64url')` and **asserts the two encodings differ**, so it cannot pass vacuously against an alphabet-neutral payload.
2. **A hostile `user_roles` entry of `null` threw** on `.role` in the old `.some(r => …)`. Entries are now filtered to objects carrying a `role` string.

Both failure modes previously produced an unhandled 500; they now produce a 403, which is the fail-closed direction.

### Test fixtures keep role-name literals

`grep -rn "project_admin" apps/frontend/src` returns **5 files**, not the ONE the acceptance criterion names. One is `roles.ts` (the declaration). The other four are **fixture data**: `supabaseDataWriter.test.ts:537,540`, `adminJobsAuthorization.test.ts:145` and this plan's own `passwordLogin.test.ts`. A fixture that read `ADMIN_ROLES[0]` instead would make the cross-role cases assert the constant against itself and pass even if the constant were wrong — the exact vacuity the two-direction structure exists to prevent. **The plan's `must_haves` truth is that the role SET is declared once, and it is.** A name appearing as a datum in a test is not a declaration.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing critical] The third copy of both role sets, in the Supabase data writer**

- **Found during:** Task 3, checking the "exactly ONE file" criterion.
- **Issue:** `supabaseDataWriter._getBasicUserData` inlined **both** role sets — the admin triple `158-08` measured at `:194`, and the candidate pair alongside it — as a third copy. The plan's own `must_haves` truth requires the admin set to be declared in exactly one place, and the filed blocking follow-up names this duplicate as a closing condition. The file is not in `files_modified`.
- **Fix:** Both `.some(...)` predicates replaced by `hasAnyRole(userRoles, CANDIDATE_ROLES)` / `hasAnyRole(userRoles, ADMIN_ROLES)`. Imported from `$lib/auth/roles` rather than the `$lib/auth` barrel, which re-exports `getUserData` and would have closed an import cycle back through `$lib/api/dataWriter` to this same file — the reason is recorded in a comment above the import.
- **Verification:** 1378/1378 unit, typecheck 0/0, `lint:check` 0 errors, full E2E 150/150. The writer's `_getBasicUserData` is covered by `supabaseDataWriter.test.ts` including the `project_admin` case at `:537`.
- **Committed in:** `e585787e7`

**2. [Rule 3 — Blocking] Neither arm of Task 3's redirect-build branch was available**

- **Found during:** Task 3.
- **Issue:** The task branches on the tracer plan's round-trip result: held → build with the route builder, did not hold → keep hand-built and cite the recorded exclusion. It **held**, and `158-01` recorded **no** exclusion to cite — but `buildRoute` takes a `Route` name and cannot express an arbitrary validated path, so the "build it" arm is structurally unavailable regardless of the round trip.
- **Fix:** The named fallback arm goes through `buildRoute`; the override arm stays interpolated, with an in-file comment stating why (`buildRoute` resolves a NAMED route; the leading `/{locale}/` is what keeps the result same-origin, so the validator must run first). The alternative considered and its rejection are recorded above under "The redirect-target build form".
- **Verification:** full E2E 150/150; `curl` on the running server confirms the unauthenticated bounce still emits `303 …/candidate/login?redirectTo=candidate%2Fprofile`.
- **Committed in:** `e585787e7`

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Neither is scope creep. Deviation 1 is required by the plan's own truth and closes one of the filed follow-up's two conditions; deviation 2 is a branch whose premise did not hold and is recorded with both arms and the rejected alternative.

## Two acceptance criteria that were measurably wrong

Recorded rather than quietly satisfied, because a later verifier re-running them will see the same numbers.

1. **`grep -c 'safeRedirectTarget' <login file>` is 1.** It is **2**, after the rewrite and **also before it** — the import line and the call site are two lines, and `grep -c` counts lines. The criterion's intent (the validator is still called before any redirect) holds and is visible in both files.
2. **`grep -rn "project_admin" apps/frontend/src` returns lines in exactly ONE file.** It returns **5 files**; one declaration and four test fixtures. Reasoning above under "Test fixtures keep role-name literals".

## Issues Encountered

- **The dev server had to be started fresh for the E2E gate**, per the served-application preflight: `db:reset`, then a single `yarn dev` on `:5173` with nothing else holding the port. The preflight passed and all 150 specs ran.
- **No E2E covers the post-login `redirectTo` deep link.** `redirectTo` appears in no spec under `tests/`. This is what made the redirect-form decision a risk judgement rather than a measurement, and it is the gap that would need closing before the base-locale prefix inconsistency is worth touching.

## Known Stubs

None. No stub, placeholder, `TODO`, `FIXME`, skipped test or unrun `<verify>` was introduced; every `<verify>` block in the plan was executed, including the one that reported a false failure (recorded above with its cause and the corrected form).

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change was introduced. The threat register's mitigations were applied as written: the allowed role set is a required parameter with no default (T-158-23), no entry point gains a role parameter (T-158-24), both wrappers still call the redirect validator (T-158-25), the helper logs a label and the backend's message but never the password, token or claims payload (T-158-26), the request context is required and the helper never makes a client (T-158-27), and the claims reader returns an empty list rather than throwing (T-158-29). No package was installed (T-158-SC).

## Next Phase Readiness

**Ready to consume:**
- `158-12` and the admin form-action work owe a role check consuming `$lib/auth/roles.ts` (carried obligation OB-5, deliverable 1). `ADMIN_ROLES` and `hasAnyRole` are exported and barrel-registered. **Do not write a fourth copy of the array.**
- Any future login surface should take `passwordLogin` rather than re-deriving the ladder. Adding one is a new wrapper, not a new implementation.

**Left open, deliberately:**
- The **backend-independence** half of `.planning/todos/pending/2026-08-28-admin-login-supabase-independence.md` — one `.supabase` access per wrapper, both allowlist entries still load-bearing and measured firing. Its role-module condition is discharged; its Supabase condition is not. Severity left at `blocking`.
- The writer's own claims decode (`supabaseDataWriter._getBasicUserData`) is still a separate copy of the `atob` decode. Collapsing it onto `readUserRoles` is a small, safe follow-up that this plan left alone to keep the adapter diff minimal.
- The base-locale prefix inconsistency between the two arms of the login redirect, described above, with the missing E2E coverage that would make changing it safe.

## Self-Check: PASSED

All eight claimed files verified present on disk; all five claimed commit hashes verified present in `git log --oneline --all`.

---
*Phase: 158-routing-auth-surface-harmonisation*
*Completed: 2026-09-02*
