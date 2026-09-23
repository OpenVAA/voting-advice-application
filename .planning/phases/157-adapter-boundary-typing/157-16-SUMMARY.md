---
phase: 157-adapter-boundary-typing
plan: 16
subsystem: frontend/routes + tooling/lint-guards
tags: [adapter-boundary, allowlist-shrink, dataProvider, eslint, negative-control, REVIEW-ADP-06]
status: complete
requires:
  - 157-15 (the paired adapter-boundary ban, ADAPTER_BOUNDARY_ALLOWLIST at ten entries, the 82-assertion self-test)
  - 157-RESEARCH.md § F.6 row 1 and § F.7 (why this file and only this file)
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts (`_getAppSettings`, which already implements the read)
  - apps/supabase/supabase/schema/302-rls.sql:420 (`anon_select_app_settings`, which is why no session is needed)
provides:
  - "routes/candidate/preregister/+layout.server.ts reading through `dataProvider.getAppSettings()`, with zero Supabase references"
  - "ADAPTER_BOUNDARY_ALLOWLIST at NINE Group-2 entries (was ten); Group 1 unchanged at five"
  - "9 new guard self-test assertions at the de-allowlisted path (82 -> 91)"
  - "157-NEGATIVE-CONTROL-LEDGER.md rows F, G and H"
affects:
  - 158 (its worklist is now eight route files plus hooks.server.ts and app.d.ts, one fewer than 157-15 handed over)
  - 157-18 (the phase gate, which carries the E2E backstop for the preregistration journey)
tech-stack:
  added: []
  patterns:
    - "an allowlist entry is struck by deleting the file's Supabase USE, never by deleting the annotation"
    - "the shrink is proven by ESLint's resolved config (2 selectors -> 4 at the path), not by reading the array"
    - "a firing assertion is proven non-vacuous by re-injecting the allowlist entry and observing exactly those assertions go red"
key-files:
  created: []
  modified:
    - apps/frontend/src/routes/candidate/preregister/+layout.server.ts
    - apps/frontend/eslint.config.mjs
    - apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts
    - .planning/phases/157-adapter-boundary-typing/157-NEGATIVE-CONTROL-LEDGER.md
decisions:
  - "The rewrite does NOT hand `serverClient` to the adapter — a measured deviation from the plan's prohibition, because doing so would fire the guard at the de-allowlisted path and make `yarn lint:check` red by construction. The plan's own primary success criterion (the entry leaves 'because its Supabase use is gone') selects this branch."
  - "The route initialises the adapter exactly as `routes/+layout.ts` does (`init({ fetch })`), which is the existing production path for this same table and method; `app_settings` is anon-readable and no Supabase session exists in the preregistration flow."
  - "The discarded PostgREST error is now caught and logged rather than thrown, preserving the prior fail-closed-to-login behaviour on a read failure."
  - "The plan's `grep -c 'candidate/preregister' == 0` criterion is unsatisfiable and was replaced with a parsed-entry check; a correctly RETAINED entry contains that substring."
metrics:
  duration: ~35 min
  completed: 2026-08-30
actuals:
  tokens: 5460
  tasks: 2
  commits: 4
---

# Phase 157 Plan 16: Shrinking the Adapter-Boundary Allowlist to Nine Summary

`routes/candidate/preregister/+layout.server.ts` now reads app settings through
`dataProvider.getAppSettings()` and contains **zero** Supabase references. Its allowlist entry is gone,
the list ships at **nine** Group-2 entries, and ESLint's own resolved configuration confirms the path moved
from 2 boundary selectors to 4 — measured, not asserted.

## The plan premise that measurement contradicted, and how it was resolved

**The plan asked for three things that cannot all be true at once.** It required (a) `serverClient:
locals.supabase` in the rewritten file, (b) the allowlist entry removed so the guard covers that path, and
(c) `yarn lint:check` at exit 0. I probed both candidate rewrites through `eslint.lintText` **before
writing any code**, at a guarded path and at the allowlisted path:

| Fixture | At a GUARDED path | At the ALLOWLISTED path |
|---------|-------------------|-------------------------|
| **A** — the plan's literal instruction: `serverClient: locals.supabase` plus `import type { SupabaseAdapterConfig } from '$lib/api/adapters/supabase/supabaseAdapter.type'` | **2 boundary errors** — `no-restricted-syntax` at the `locals.supabase` member access, `no-restricted-imports` at the `$lib/api/adapters/…` import | 0 |
| **B** — the interface only: `dataProvider.init({ fetch })`, no server client, no adapters-path import | **0** | 0 |

So **(a) ∧ (b) ⟹ ¬(c)**, by construction. The guard's `MemberExpression[property.name='supabase']`
selector fires on `locals.supabase` itself, and its `^\$lib/(supabase|api/adapters)(/|$)` pattern fires on
the type import the protected layout uses. Handing the cookie-capable client to the adapter is *precisely*
what the guard forbids outside the boundary — which is why allowlist entry #4 is annotated
**158-MOSTLY-PERMANENT** for exactly that reason.

**Fixture B was implemented.** The plan's own text selects it: success criterion 1 says the file leaves the
allowlist "**because its Supabase use is gone**", and `must_haves.truths` #2 and #3 require the entry
removed and the list at nine. Fixture A satisfies only success criterion 4 (the `serverClient` pattern),
which criterion 1 already contradicts.

**The prohibition's hazard does not apply here, and this is not a shortcut around it.** The prohibition
exists because a recorded production incident traced broken admin login to a writer built on a plain client
— `signInWithPassword` on such a client does not write the session cookie onto the response. This route
signs nobody in. More concretely: at this point in the flow **no Supabase session exists at all** (the
visitor is pre-registering, authenticated only by the bank-auth `id_token` cookie), so a cookie-capable
client would carry no session to use. And `app_settings` is readable by `anon` under
`anon_select_app_settings` (`apps/supabase/supabase/schema/302-rls.sql:420`). The initialisation used is
**not invented**: `routes/+layout.ts` calls `dataProvider.init({ fetch })` and `getAppSettings()` on every
SSR request today, against this same table through this same method. The rationale is recorded in the file
so a future editor does not read the missing `serverClient` as an oversight.

**Cost of the deviation:** acceptance criterion `grep -c 'serverClient' >= 1` is **not met** (it returns 0),
and prohibition #2 is **not satisfied as literally worded**. Everything else in the plan is met.

## Task 1 — the rewrite

**Before:**

```ts
const { data: appSettingsRow } = await locals.supabase.from('app_settings').select('settings').limit(1).maybeSingle();
const preRegistrationEnabled = Boolean(
  (appSettingsRow?.settings as { preRegistration?: { enabled?: boolean } } | null)?.preRegistration?.enabled
);
```

**After:**

```ts
const dataProvider = await dataProviderPromise;
dataProvider.init({ fetch });
const appSettings: DPDataType['appSettings'] = await dataProvider
  .getAppSettings()
  .catch((e): DPDataType['appSettings'] => {
    logDebugError(`[Candidate App preregister layout] Error reading app settings: ${e?.message ?? 'No error message'}`, e);
    return {};
  });
const preRegistrationEnabled = Boolean(appSettings.preRegistration?.enabled);
```

The inline `as { preRegistration?: { enabled?: boolean } } | null` cast is gone: `DPDataType['appSettings']`
is `Partial<DynamicSettings>`, and `preRegistration.enabled` is a declared member of it
(`packages/app-shared/src/settings/dynamicSettings.type.ts:331`). That is a small piece of criterion 1
landing through criterion 6.

### The return statements, before and after

All four `load` return statements are **byte-identical**. Verified by diffing the return-bearing lines of
`git show 3d493fcee:<file>` against the working file — the only difference is the `return {};` **inside the
new `.catch` callback**, which is not a `load` return.

| # | Before | After |
|---|--------|-------|
| 1 | `return redirect(303, buildRoute({ route: 'CandAppLogin', locale: locals.currentLocale }));` | identical |
| 2 | `return { claims: undefined };` | identical |
| 3 | `return { claims: undefined };` | identical |
| 4 | `return { claims: { firstName: claims.data.firstName, lastName: claims.data.lastName } };` | identical |

### One deliberate behaviour preservation

The old code destructured **only** `data` from the PostgREST response, silently discarding `error`. A read
failure therefore left `appSettingsRow` undefined and fell through to the login redirect. The provider
**throws** on any non-`PGRST116` error, so letting it propagate would have converted that redirect into a
500 — a behaviour change the plan forbids. The `.catch` preserves the fail-closed-to-login path and logs the
error that was previously dropped on the floor (deviation Rule 2).

### Acceptance greps

| Check | Result |
|-------|--------|
| `grep -c "from('app_settings')"` | **0** |
| `grep -c 'locals\.supabase'` | **0** |
| `grep -c 'serverClient'` | **0** — deviation, see above |
| `grep -c 'dataProvider'` | 4 |

## Task 2 — the allowlist at nine, and the proof it took effect

Group 1 unchanged at five. Group 2 at **nine**: entry #1 struck. Parsed from the array rather than grepped:

| Check | Result |
|-------|--------|
| entries **equal to** `src/routes/candidate/preregister/+layout.server.ts` | **0** |
| Group-2 entry count | **9** |
| total `ADAPTER_BOUNDARY_ALLOWLIST` entries | **14** (5 + 9) |

The nine retained entries verbatim, in file order, each still carrying its Phase-158 annotation:

| # | Entry | Disposition |
|---|-------|-------------|
| 1 | `src/routes/candidate/auth/callback/+server.ts` | 158-MEDIUM — needs `auth.verifyOtp` + `auth.getUser` adapter methods that do not exist |
| 2 | `src/routes/candidate/auth/logout/+server.ts` | 158-EASY with a caveat — `_logout` `fetch`es THIS route, so moving it creates a cycle 158 must break first |
| 3 | `src/routes/candidate/(protected)/+layout.server.ts` | 158-MOSTLY-PERMANENT — two of three sites hand the cookie-capable client to the adapter |
| 4 | `src/routes/candidate/login/+page.server.ts` | 158-HARD — `signInWithPassword` + inline JWT role decode |
| 5 | `src/routes/admin/login/+page.server.ts` | 158-HARD — the file a recorded cookie-loss incident was fixed in |
| 6 | `src/routes/api/candidate/preregister/+server.ts` | 158-MEDIUM — `functions.invoke('identity-callback')` + `auth.verifyOtp` |
| 7 | `src/routes/api/auth/logout/+server.ts` | 158-EASY — a bare `auth.signOut()` |
| 8 | `src/hooks.server.ts` | 158-OWNED — POPULATES `event.locals.supabase` |
| 9 | `src/app.d.ts` | 158-OWNED — DECLARES `supabase` on `App.Locals`; unreachable by this guard on purpose |

### The shrink, measured by `eslint --print-config`

A deleted array line is a claim. ESLint's resolved configuration is the measurement. At HEAD `b3f636e1e`,
counting `no-restricted-syntax` selectors (**4** = guarded, **2** = allowlisted):

| File | at `157-15` close | at `157-16` close |
|------|-------------------|-------------------|
| `src/routes/candidate/preregister/+layout.server.ts` | **2** | **4** ← the shrink |
| `src/routes/admin/+layout.server.ts` (guarded control) | 4 | 4 |
| `src/routes/candidate/(protected)/+layout.server.ts` (retained) | 2 | 2 |
| `src/lib/api/adapters/…/supabaseDataProvider.ts` (Group 1) | 2 | 2 |

### No inherited entry was dropped — re-measured, not read

The required re-verification. Enumerated at HEAD `b3f636e1e` for the doubly-matched guarded file
`src/routes/admin/+layout.server.ts`, all four inherited entries survive byte-identically to `157-15`'s
recorded table (✔ marks an inherited entry):

- paths: `["svelte/store"` ✔`]`
- patterns: `["^(\\.\\./){2,}lib(/|$)"` ✔`, "^@supabase/", "^\\$lib/(supabase|api/adapters)(/|$)"]`
- selectors: `["TSEnumDeclaration"` ✔`, "ImportExpression[source.value='svelte/store']"` ✔`, "MemberExpression[property.name='supabase']", "ObjectPattern > Property[key.name='supabase']"]`

The de-allowlisted file resolves to that **same** four-and-four set. A dropped inherited entry produces
**zero** errors on the real tree, which is exactly why this is measured.

### The nine new self-test assertions, and the RED that proves them non-vacuous

`eslint-adapter-boundary-guard.test.ts` goes **82 -> 91**. `157-15`'s matrix had **no** silence case at this
path (its two grandfathered probes are `(protected)/+layout.server.ts` and `hooks.server.ts`), so nothing
needed inverting — coverage never passed through an untested state. Added:

| Group | Count | What it proves |
|-------|-------|----------------|
| Firing cases: 4 fixtures at the real de-allowlisted path | 4 | the guard now fires there |
| Discrimination silence: the same 4 fixtures at the still-allowlisted `src/hooks.server.ts` | 4 | "it fires" is a property of the allowlist edit, not of the fixtures |
| `lintFiles` over the REAL rewritten route file | 1 | the rewrite left no Supabase reference behind |

**The RED control.** The allowlist entry was re-injected and the spec re-run:

| | RED (entry re-injected) | GREEN (entry struck) |
|---|---|---|
| Exit | **1** | **0** |
| Result | **`4 failed \| 87 passed (91)`** | **`91 passed (91)`** |
| Which four | exactly the four `fires on …` cases | — |
| HEAD | `c92679ac7` + injected line | `b3f636e1e`, clean |

Exactly the four firing cases failed and **no others**. The discrimination-silence cases and the real-file
case stayed green, which is correct — re-adding the entry restores silence at that one path and changes
nothing else. A RED that had also taken down the silence cases would have meant the injection changed more
than the allowlist.

**Restoration, proven:** `apps/frontend/eslint.config.mjs` pre-injection blob
`49cd131f4fe45ef97ddd1c409c6ea26ae14e725d` -> post-restoration `49cd131f4fe45ef97ddd1c409c6ea26ae14e725d`
✔. `git status --porcelain apps` empty. Restored with `git checkout -- <single named path>`; no blanket
reset, no `git clean`, no `git stash`. **Post-`157-16` restoration target for later plans:**
`d5a742b590c2b9028e66bf7c7259f75cb4d2ff9f` at HEAD `b3f636e1e`.

## Verification

| Check | Result |
|-------|--------|
| `TURBO_FORCE=true yarn lint:check` | **PASS** — exit **0**, `@openvaa/frontend:lint: ✖ 1 problem (0 errors, 1 warning)`, the exact baseline string; `Tasks: 22 successful, 22 total`; `cache bypass, force executing 3fb5ca72fa938fdc` (distinct from `157-15`'s `21d900c93b319d8e` — not a replay) |
| `yarn format:check` | **PASS** — exit 0 |
| `yarn workspace @openvaa/frontend test:unit` | **PASS** — exit 0, **906 passed (906)** = 897 baseline + 9 new |
| `yarn workspace @openvaa/frontend typecheck` | **PASS** — exit 0, `2691 FILES 0 ERRORS 0 WARNINGS` |
| `yarn workspace @openvaa/app-shared test:unit` | **PASS** — **79 passed**, baseline |
| monorepo `yarn test:unit` | **PASS** — `Tasks: 25 successful, 25 total` |
| Comment-hygiene guard | **PASS** — 1580 files scanned, 0 violations (all changed files git-tracked before the lint run) |
| `git status --porcelain apps` | **PASS** — 0 lines |
| `git diff --name-only` lists exactly one route file | **PASS** — `apps/frontend/src/routes/candidate/preregister/+layout.server.ts` |
| No file deletions in any commit | **PASS** — `git diff --diff-filter=D` empty for all four |
| Database untouched | **PASS** — no `db:*`, no `db:types`, no pgTAP, no `db:lint:sql` |
| E2E preregistration journey | **DEFERRED** to `157-18` — the plan designates it `verification: backstop` at the phase gate |

## Deviations from Plan

**1. [Rule 1 — the plan's literal instruction makes `lint:check` red by construction] `serverClient` omitted from the rewrite**

- **Found during:** Task 1, **before writing any code**, by `lintText` probe.
- **Issue:** the plan simultaneously requires `serverClient: locals.supabase` in the file, the allowlist
  entry removed, and `lint:check` at exit 0. Measured: fixture A at a guarded path yields **2** boundary
  errors (the `locals.supabase` member access and the `$lib/api/adapters/…` type import). The three
  requirements are jointly unsatisfiable.
- **Fix:** fixture B — `dataProvider.init({ fetch })`, no server client, no adapters-path import. **0**
  boundary messages at a guarded path.
- **Why this is the correct call:** the plan's success criterion 1 ("its Supabase use is **gone**") and
  truths #2/#3 select this branch; the contradicting criterion 4 is about a pattern whose hazard —
  session-cookie loss on `signInWithPassword` — does not exist on a route that signs nobody in and where no
  Supabase session exists yet. `routes/+layout.ts` already reads this exact table through this exact method
  with this exact initialisation.
- **Cost:** acceptance criterion `grep -c 'serverClient' >= 1` **fails** (returns 0); prohibition #2 is not
  met as literally worded.
- **Files:** the route file. **Commit:** `a42b4126b`.

**2. [Rule 2 — a discarded error] The PostgREST error is now caught and logged**

- **Found during:** Task 1.
- **Issue:** the old code destructured only `data`, dropping `error` entirely; the provider throws instead,
  which would have turned a read failure from "redirect to login" into a 500.
- **Fix:** `.catch` restores the fail-closed-to-login behaviour and logs via `logDebugError`.
- **Files:** the route file. **Commit:** `a42b4126b`.

**3. [Rule 1 — an unsatisfiable acceptance criterion] `grep -c 'candidate/preregister' == 0` replaced with a parsed-entry check**

- **Found during:** Task 2 verification.
- **Issue:** retained Group-2 entry `src/routes/api/candidate/preregister/+server.ts` **contains**
  `candidate/preregister` as a substring. Driving the grep to zero would require deleting an entry that must
  stay, turning `lint:check` red on an untouched file. Measured, the grep returns **2** (that entry, plus the
  header comment documenting the removal).
- **Fix:** the check is performed on **parsed allowlist entries** — 0 entries equal the struck path, Group 2
  is 9 — and, more strongly, by ledger row `F`, which measures the guard's behaviour at the path rather than
  the config's text.
- **Files:** ledger. **Commit:** `a1eadc346`.

**4. [Rule 1 — stale inherited framing, twice] Two ten-entry framings amended rather than left standing**

- **Found during:** Task 2, after the entry was struck.
- **Issue (a):** `eslint.config.mjs`'s own top doc comment still described GROUP 2 as "the **ten**
  grandfathered sites … **Eight** are the route files", directly above a nine-entry array — the exact
  false-premise-propagation the standing "amend, don't merely append" rule exists to prevent.
- **Issue (b):** the ledger's `157-15` allowlist table and its "exactly **7 rows**" corpus field were
  likewise stale.
- **Fix:** the config header now reads nine/seven; the ledger's `157-15` section carries an
  `ALLOWLIST STATUS: SUPERSEDED` banner and the header carries a 10-row corpus amendment. **No measured cell
  of `157-14`'s or `157-15`'s was altered** — the `157-15` table is preserved verbatim as the `before` half
  of row `F`.
- **Files:** `eslint.config.mjs`, ledger. **Commits:** `b3f636e1e`, `a1eadc346`.

## Plan premise not met by the tree (not a deviation — a forward reference)

The plan states the rewrite inherits a zod parse gate "after `157-07`". **Measured: it does not, yet.**
`157-07` has a PLAN but **no SUMMARY** — it has not executed — and `SupabaseDataProvider._getAppSettings`
contains no `safeParse`, no schema import and no zod reference today (`grep` returns 0). The
`storedSettings.schema.ts` in `@openvaa/app-shared` exists but is not wired into the provider. The
"incidental win" is therefore **pending on `157-07`**, not banked here. What the route *does* inherit today
is the provider's `PGRST116` degrade-to-`{}` branch and its localisation pass. Recorded so a later reader
does not treat validated app-settings reads on this route as an accomplished fact.

## Handoff note for Phase 158

**Eight route files remain, plus two owned files.** What each still needs:

| File | Still needs |
|------|-------------|
| `routes/candidate/auth/callback/+server.ts` | new `DataWriter` methods wrapping `auth.verifyOtp` and `auth.getUser` |
| `routes/candidate/auth/logout/+server.ts` | the `_logout` -> this-route `fetch` cycle broken first, then a straight move |
| `routes/candidate/(protected)/+layout.server.ts` | only its third site is true leakage; the two server-client hand-offs need a sanctioned seam, not removal |
| `routes/candidate/login/+page.server.ts` | the three-login-paths-into-one collapse, plus a home for the inline JWT role decode |
| `routes/admin/login/+page.server.ts` | the same collapse; the cookie-loss incident file, so it needs the `serverClient` pattern preserved |
| `routes/api/candidate/preregister/+server.ts` | an Edge-Function wrapper following `_preregister`, plus `auth.verifyOtp` |
| `routes/api/auth/logout/+server.ts` | a `DataWriter` sign-out method |
| `hooks.server.ts` | it POPULATES `event.locals.supabase` — the structural reason the others can reach Supabase without importing it |
| `app.d.ts` | it DECLARES `supabase` on `App.Locals`; a type declaration the guard cannot and should not reach |

**The lesson `157-16` hands over:** an entry is struck by deleting the file's Supabase **use**, never its
annotation — and any file that must hand the cookie-capable client to the adapter (`(protected)`, the two
login paths) **cannot** leave the allowlist without a sanctioned seam, because the guard fires on
`locals.supabase` itself. That is a design question for 158, not an oversight in the list.

## Known Stubs

None introduced. No hardcoded empty value flowing to UI, no placeholder string, no `TODO`/`FIXME`, no
unwired data source. The `return {}` in the new `.catch` is a deliberate fail-closed degradation that
preserves the route's prior behaviour on a read failure, not a stub. The nine retained allowlist entries are
not stubs: they are the measured, annotated inventory Phase 158 owns, and this plan removed the first of
them.

## Threat Flags

None. No network endpoint, auth path, file-access pattern or schema change was added. `T-157-40` is
addressed by **removing** the hazard rather than by copying the pattern — the route hands no client to the
adapter at all, and the reason is recorded in the file. `T-157-41` is **pending on `157-07`** (see above)
rather than closed. `T-157-42` is closed by ledger row `G`: the entry was struck **and** the path was proven
guarded by a RED/GREEN pair, so coverage never passed through an untested state. `T-157-SC` holds: no
package was installed.

## Self-Check: PASSED

- `FOUND: apps/frontend/src/routes/candidate/preregister/+layout.server.ts`
- `FOUND: apps/frontend/eslint.config.mjs` (blob `d5a742b590c2b9028e66bf7c7259f75cb4d2ff9f`)
- `FOUND: apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts`
- `FOUND: .planning/phases/157-adapter-boundary-typing/157-NEGATIVE-CONTROL-LEDGER.md`
- `FOUND: a42b4126b` — `refactor(157-16): move the preregister app-settings read behind the DataProvider`
- `FOUND: c92679ac7` — `test(157-16): shrink the adapter-boundary allowlist to nine and prove the struck path is guarded`
- `FOUND: b3f636e1e` — `docs(157-16): amend the allowlist doc comment's stale ten-entry framing`
- `FOUND: a1eadc346` — `docs(157-16): record the allowlist shrink in the negative-control ledger`
- `git status --porcelain apps` → **0 lines**
- `git diff --name-only 3d493fcee..HEAD` → exactly the 4 declared files
