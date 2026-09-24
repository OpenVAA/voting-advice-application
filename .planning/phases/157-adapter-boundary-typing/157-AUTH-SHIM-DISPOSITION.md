# 157 — `currentPassword` / `authToken` disposition, and the candidate-settings branch

**Produced by:** `157-09-PLAN.md` (an audit and a spike; no source file is modified)
**Measured:** 2026-08-30, at `HEAD` = `44c467624`, branch `integration/ship-12-squash`
**Discharges:** D-F1's binding operator NOTES — *"Also check that currentPassword and authToken are not used anywhere else."*
**Consumed by:** `157-10` (the branch decision) and `157-11` (the sweep — no task may say "remove `authToken`" without a row in the tables below)

> **Line numbers are a convenience, not the citation.** Phase 152's comment sweep rewrites 817 comment
> lines and will shift line numbers in nearly every file named here. Every row is anchored on a **file +
> symbol**; line numbers are the values measured on 2026-08-30 and are expected to drift. Where the
> numbers below differ from `157-RESEARCH.md` § D, **these are the current ones** — the research was
> measured at an earlier `HEAD`.

---

## 1. The four greps, with their numeric results

All four run from the repository root over `apps packages tests`.

| # | Command | Result | Note |
|---|---------|--------|------|
| 1 | `grep -rn 'currentPassword' apps packages tests` | **23 lines / 9 files** | |
| 2 | `grep -rn 'authToken' apps packages tests` | **106 lines / 21 files** | |
| 3 | `grep -rin 'withauth' apps packages tests` | **41 lines / 6 files** | case-**insensitive**, per the D-F1 correction |
| 4 | `grep -rn 'WithOptionalAuth' apps packages tests` | **18 lines / 2 files** | **separate grep, and not redundant** |

### Why greps 3 and 4 are both required (the close condition is two greps, not one)

The string `WithOptionalAuth` does **not** contain the substring `withauth` in any casing — it contains
`withoptionalauth`. Therefore `grep -rin 'withauth'` returning **0** does **not** prove `WithOptionalAuth`
was removed. Verified this session:

```
$ grep -rin 'withauth' apps packages tests | wc -l        →  41
$ grep -rn  'WithOptionalAuth' apps packages tests | wc -l →  18
```

The two hit sets are **disjoint**: grep 3's 41 hits are the `WithAuth` type; grep 4's 18 hits are the
`WithOptionalAuth<TParams>` generic, in two files that grep 3 reaches only for their *other*, unrelated
`WithAuth` mentions (`adminContext.svelte.ts:9`, `:113`, `:115`).

> **Criterion 4's close condition, stated for `157-11`:**
> `grep -rin 'withauth' apps packages tests` → **0** **AND** `grep -rn 'WithOptionalAuth' apps packages tests` → **0**.
> One grep alone does not close it.

**Also note grep 3 is the corrected one.** The lower-case, case-**sensitive** `grep -rn 'withAuth'` returns
zero (fact 18) — and that zero is meaningless. The exported type is `WithAuth`, capital W, defined at
`apps/frontend/src/lib/api/base/dataWriter.type.ts` (`export type WithAuth`, measured `:341`), with 41
references. A planner who re-runs the lower-case grep, gets zero, and marks criterion 4 vacuously met has
made exactly the error D-F1 exists to prevent.

---

## 2. `authToken` — per-file disposition, five classes (106 lines, 21 files)

Column *Lines* is measured-2026-08-30. Column *Disposition* is binding on `157-11`.

### Class 1 — Shim uses: `authToken: ''` passed purely to satisfy the type. **IN SCOPE — deleted by `157-11`.**

| File | Lines | Anchor symbol | Disposition |
|------|-------|---------------|-------------|
| `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts` | 21, 47 (comments), 64, 72 | module JSDoc; the `logout` and `setPassword` arrow-function fields | DELETE arg + the two comments |
| `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts` | 113 (comment), 115, 116 | `#injectAuthToken` | DELETE the whole private method |
| `apps/frontend/src/lib/contexts/admin/adminContext.type.ts` | 50 | `export type WithOptionalAuth<TParams>` | DELETE the type (becomes vacuous) — see § 1 close condition |
| `apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts` | 214, 231 | two `getCandidateUserData({ authToken: '', … })` calls | DELETE the property |
| `apps/frontend/src/lib/auth/getUserData.ts` | 29 (comment), 30 | `dataWriter.getBasicUserData({ authToken: '' })` | DELETE arg + comment |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | 29, 83, 120 (comments), 82, 194 | class JSDoc; `_setPassword`; `_preregister` comment; `this._getBasicUserData({ authToken: '' })` | DELETE params + the three comments |
| **`apps/frontend/src/routes/candidate/(protected)/+layout.server.ts`** | **43 (comment), 44** | `dataWriter.getCandidateUserData({ authToken: '', loadNominations: true })` | **DELETE — absent from the CONTEXT** |
| **`apps/frontend/src/routes/admin/(protected)/question-info/+page.server.ts`** | **56, 62, 72** | `getBasicUserData`, and two admin-job calls | **DELETE — absent from the CONTEXT** |
| **`apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts`** | **31, 37, 46** | `getBasicUserData`, and two admin-job calls | **DELETE — absent from the CONTEXT** |
| **`apps/frontend/src/routes/admin/(protected)/+layout.ts`** | **45** | `.logout({ authToken: '' })` | **DELETE — absent from the CONTEXT** |
| **`apps/frontend/src/routes/api/auth/login/+server.ts`** | **27 (comment), 29, 38** | `getBasicUserData`, `backendLogout` | **DELETE — absent from the CONTEXT** |

**Class 1 total: 29 lines across 11 files.**
**The five bolded `routes/` files are absent from `157-CONTEXT.md`'s list entirely** — 12 additional call
sites the CONTEXT does not know about. A sweep scoped to the CONTEXT's list leaves them behind and the
build breaks (they pass a property that no longer exists on the option type).

### Class 2 — Type declarations and stale JSDoc. **IN SCOPE.**

| File | Lines | Anchor | Disposition |
|------|-------|--------|-------------|
| `apps/frontend/src/lib/api/base/dataWriter.type.ts` | 345 | the `authToken: string` member of `export type WithAuth` | DELETE with the type |
| ″ | 113 | `@returns … an object with the `authToken`` on `login` | REWRITE — under Supabase `login` returns `{ type: 'success' }` and never a token |
| ″ | 129, 167, 182, 191, 200, 224 | six live `@param authToken - The authorization token.` lines | DELETE — they document a parameter that will not exist |
| ″ | 211 | a **commented-out** `//  * @param authToken …` (inside the commented-out `updateUserSettings` block) | DELETE with its block |

**Class 2 total: 9 lines in 1 file** = 1 type member + 7 `@param` lines (6 live + 1 commented) + 1 `@returns`.
A codemod that deletes the type and leaves eight stale JSDoc lines behind produces exactly the class of
comment Phase 152 exists to remove.

### Class 3 — Tests. **IN SCOPE — must be updated.**

| File | Lines | Disposition |
|------|-------|-------------|
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` | 26 lines: 96, 107, 119, 129, 143, **172**, 177, 191, 224, 244, 289, 317, 341, 380, 401, 418, 435, 445, 491, 551, 569, 600, 632, 659, 689, 714 | DROP the argument — **except `:172`, see below** |
| `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts` | 6 lines: 68, 83, 96, 116, 138, 163 | DROP the argument |

**Class 3 total: 32 lines across 2 files.**

> **`supabaseDataWriter.test.ts:172` is a test TITLE, not an argument.** Measured verbatim:
> ```ts
> it('calls updateUser with new password, ignoring currentPassword and authToken', async () => {
> ```
> It must be **renamed**, not have an argument dropped. A codemod that treats it as an argument site
> corrupts the title string.

`universalAdapter.test.ts` also contains 4 `authToken` hits — those are **class 5**, not class 3. See below.

### Class 4 — GENUINE admin auth tokens. **MUST NOT SWEEP.**

| File | Lines | What it is | Disposition |
|------|-------|-----------|-------------|
| `apps/frontend/src/lib/server/admin/features/condenseArguments.ts` | 26, 35, 42, 170, 197, 217, 234 | ~~a real token threaded through admin API calls~~ **RECLASSIFIED class 1 (2026-08-30)** — the file contains ZERO `Bearer`/`fetch(`/`headers`; its only caller passes `authToken: ''` (`argument-condensation/+page.server.ts:46`), and the four "threads" are object-literal fields feeding `SetQuestionOptions`/`InsertJobResultOptions`, both of which compose `WithAuth` and are on Task 2's empty-them list | ~~MUST NOT SWEEP~~ **SWEEP (operator release, 2026-08-30)** |
| **`apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts`** | **25, 38, 49, 169, 195, 215, 232** | the exact same pattern, file-for-file — and **RECLASSIFIED class 1 (2026-08-30)** for the same measured reason: zero `Bearer`/`fetch(`/`headers`, sole caller passes `authToken: ''` (`question-info/+page.server.ts:72`), threads feed the option types Task 2 empties | ~~MUST NOT SWEEP~~ **SWEEP (operator release, 2026-08-30)** |

**Class 4 total: 14 lines across 2 files.**

> **The CONTEXT's "One `authToken` that is NOT the shim" is wrong: there are TWO.** The two files are
> structurally identical — same JSDoc wording one line apart, same destructure, same `authToken: string;`
> member, same four downstream threads. Measured:
> `grep -rn 'authToken' apps/frontend/src/lib/server/admin/features/` → 14 lines, 7 in each file.
> A sweep that trusts the CONTEXT's count of one strips a live admin credential out of
> `generateQuestionInfo.ts`.

---

### ⚠ CORRECTION (2026-08-30) — the class-4 rows above were WRONG

`157-11` measured the premise and disproved it; the orchestrator re-verified independently before
releasing the prohibition. **This block amends the two rows in place — it is not an addendum.**
Any later plan (`157-12`, `157-17`, `157-18`) MUST read the reclassification, not the original text.

What was asserted: both files "thread a real admin auth token", so class 4, MUST NOT SWEEP.
The classification was made from a pattern-match on the file shape, without checking what the
value actually was.

What is measured, at HEAD `87028d540`:

| Check | Result |
|---|---|
| `grep -c "Bearer\|fetch(\|headers" condenseArguments.ts` | **0** |
| `grep -c "Bearer\|fetch(\|headers" generateQuestionInfo.ts` | **0** |
| value at every call site | `authToken: ''` (a literal empty string) |
| `universalAdapter.ts:46` | `authToken ? addHeader(...) : headers` — `''` emits **no header at all** |
| the eight "threads" | object-literal fields on `SetQuestionOptions = WithAuth & ...` (`dataWriter.type.ts:331`) and `InsertJobResultOptions = WithAuth & ...` (`:416`) — both on Task 2's empty-them list |

So the token is neither real nor independent: it is `''` end to end, reaching option types that are
themselves losing the field. Honouring the prohibition would have made
`yarn workspace @openvaa/frontend typecheck` unsatisfiable at the same time as the plan's own
"typecheck exits 0" criterion.

**Operator decision, 2026-08-30: B1 — extend the sweep**, with explicit release from prohibitions 1
and 2 for these two files ONLY. Task 1's branch is **remove**.

**Prohibition 3 STANDS, untouched under every option:** `FetchOptions.authToken` in
`universalAdapter.ts` / `.type.ts` / `.test.ts` is class 5 — it builds a real `Authorization: Bearer`
header and gates the disk cache via `hasAuthHeaders`. It is the one genuine bearer mechanism and it
survives, so reintroducing bearer auth remains a one-line change per call site.

**Consequence for downstream gates:** the Task-2/Task-3 survivor list becomes **3 files, not 5**.
`157-18` must compare against the amended list.

### Class 5 — The genuine `Authorization: Bearer` mechanism. **MUST NOT SWEEP.**

| File | Lines | What it is | Disposition |
|------|-------|-----------|-------------|
| `apps/frontend/src/lib/api/base/universalAdapter.ts` | 41, 46 | `{ authToken, disableCache }: FetchOptions = {}` destructured in `UniversalAdapter.fetch`, then `const fullHeaders = authToken ? addHeader(headers, 'Authorization', `Bearer ${authToken}`) : headers;` | **MUST NOT SWEEP** |
| `apps/frontend/src/lib/api/base/universalAdapter.type.ts` | 15 | `authToken?: string;` — the member of `export type FetchOptions` | **MUST NOT SWEEP** |
| `apps/frontend/src/lib/api/base/universalAdapter.test.ts` | 61, 196, 203, 353 | exercises it, including the cache-behaviour assertion `test('should NOT cache when authToken is provided', …)` at `:196` | **MUST NOT SWEEP** — these tests stay green unchanged |

**Class 5 total: 7 lines across 3 files.**

`FetchOptions.authToken` is a **different type** from `WithAuth`, it is **optional**, and it does real
work: it becomes an `Authorization: Bearer` header, and its presence also disables the disk cache
(`hasAuthHeaders(fullHeaders)` at `universalAdapter.ts:52`). Deleting it removes the only bearer-auth
capability in the adapter layer and breaks a passing cache test.

### Class 6 — Documentation. IN SCOPE (as a doc fix, not a codemod target).

| File | Lines | What it is | Disposition |
|------|-------|-----------|-------------|
| `apps/docs/src/routes/(content)/developers-guide/frontend/contexts/+page.md` | 42 | the `AuthContext` row lists `authToken` as a context member | **Already stale today** — `grep -n 'authToken' authContext.type.ts` returns nothing; `AuthContext` has no such member. `157-11` should delete the mention while it is in the area. |

### The bridge case — `universalDataWriter.ts`, the one non-mechanical part

`apps/frontend/src/lib/api/base/universalDataWriter.ts` — **14 lines: 185, 190, 194, 199, 203, 206, 211,
214, 218, 221, 226, 229, 277, 281.**

This file is **neither class 1 nor class 5** — it is the bridge between them. Six admin-job methods
destructure `authToken` out of their (class-1-valued) option types and pass it **straight into
`FetchOptions`** (class 5):

```ts
// universalDataWriter.ts:185-192
async getActiveJobs({ authToken, ...opts }: GetActiveJobsOptions): Promise<Array<JobInfo>> {
  const params = buildGetJobParams(opts);
  return (await this.get({ url: UNIVERSAL_API_ROUTES.jobsActive, params, authToken })) as Array<JobInfo>;
}
```

The same shape repeats in `getPastJobs` (`:194-201`), `startJob` (`:203-209`), `getJobProgress`
(`:211-216`), `abortJob` (`:218-224`) and `abortAllJobs` (`:226-231`). The helper's own signature names it
too (`:277-282`): `@param opts - Job query options with authToken omitted`, and
`opts: Omit<GetActiveJobsOptions, 'authToken'> | Omit<GetPastJobsOptions, 'authToken'>`.

**So the seven admin-job option types are not pure shims — their `authToken` is a real value on the way to
a real header.** It is only ever `''` today because `adminContext.svelte.ts`'s `#injectAuthToken` injects
`{ authToken: '', ...opts }` and the Supabase adapter authenticates from the session cookie instead.

**This is a decision `157-11` takes at its own checkpoint. Both candidate resolutions, recorded here so
that checkpoint has the evidence in front of it:**

- **(a) — recommended by `157-RESEARCH.md` § D.3.** Remove `WithAuth` from the seven admin-job types and
  remove the `authToken` pass-through from the six `universalDataWriter` methods, leaving
  `FetchOptions.authToken` (class 5) intact but unused by this path.
  *Evidence for it:* `adminContext` is the only caller and it passes `''`; `universalAdapter.ts:46`'s
  truthiness check means `''` produces **no header at all** today, so nothing changes at runtime.
  `#injectAuthToken` and `WithOptionalAuth` both disappear, which is what closes criterion 4's second grep.
- **(b).** Keep `authToken` on the seven admin-job types, on the grounds that the `/api` job routes are a
  genuine bearer-auth surface a future non-Supabase deployment might use.
  *Cost:* `grep -rin 'withauth'` **cannot return zero** unless the seven types are re-expressed against a
  new, differently-named type — more churn than (a), for a hypothetical consumer.

Under (a), re-introducing bearer auth later is a one-line change at each call site, because class 5
survives untouched.

### `authToken` reach — the arithmetic

| Class | Lines | Files | In scope? |
|-------|-------|-------|-----------|
| 1 — shim uses | 29 | 11 | yes, delete |
| 2 — type + JSDoc | 9 | 1 | yes, delete/rewrite |
| 3 — tests | 32 | 2 | yes, update (one is a title) |
| 4 — genuine admin tokens | 14 | 2 | **NO — MUST NOT SWEEP** |
| 5 — genuine `Bearer` mechanism | 7 | 3 | **NO — MUST NOT SWEEP** |
| 6 — documentation | 1 | 1 | yes, doc fix |
| bridge — `universalDataWriter` | 14 | 1 | decision at `157-11`'s checkpoint |
| **Total** | **106** | **21** | |

**21 files, not the CONTEXT's 10.** **Three MUST-NOT-SWEEP loci, not one.**

---

## 3. `currentPassword` — per-file disposition (23 lines, 9 files)

| File | Lines | Anchor symbol | Class | Disposition |
|------|-------|---------------|-------|-------------|
| `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte` | 35, 52, 64, 103, 108, 109 | `let currentPassword = $state('')`; the `setPassword({ currentPassword, password })` call; the reset in `handleSubmit`; the `<label for="currentPassword">`; the `<PasswordField id="currentPassword" bind:password={currentPassword}>` | live UI | **branch-dependent** — see § 5 |
| `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts` | 69, 71 (comment), 72 | the `setPassword` arrow-function field and its forwarding comment | 1 | branch-dependent |
| `apps/frontend/src/lib/contexts/auth/authContext.type.ts` | 37 (JSDoc), 38 (`@param`), 41 | `setPassword` on the `AuthContext` type | 2 | branch-dependent |
| `apps/frontend/src/lib/api/base/dataWriter.type.ts` | 153 (`@param currentPassword - The current password.`), 158 | `setPassword` on the `DataWriter` interface | 2 | branch-dependent |
| `apps/frontend/src/lib/api/base/universalDataWriter.ts` | 147, 259 | `setPassword` public wrapper; `protected abstract _setPassword` — **the D-F1 target** | 2 | branch-dependent |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | 82, 83 (comment) | `_setPassword({ password }: { password: string; currentPassword: string; authToken: string })` and the shim comment (note the `--` dash: also in 152's sweep scope) | 1 | branch-dependent |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` | **172 (TITLE)**, 178, 191 | `it('calls updateUser with new password, ignoring currentPassword and authToken', …)` | 3 | **`:172` renamed, not argument-dropped**; `:178`/`:191` branch-dependent |
| `tests/tests/utils/testIds.ts` | 55 | `currentPassword: 'settings-current-password',` under `candidate.settings` | 3 | branch-dependent |
| `tests/tests/specs/a11y/candidate-a11y.spec.ts` | 230 | `contentTestId: testIds.candidate.settings.currentPassword,` in the `cand-settings` case | 3 | **load-bearing a11y anchor** — branch-dependent, see § 5 |

**Total: 23 lines across 9 files.** Note `tests/` carries 2 of them — a sweep scoped to `apps/` misses both.

---

## 4. `WithAuth` disposition summary (41 refs / 6 files) and `WithOptionalAuth` (18 refs / 2 files)

Per-file `grep -ric 'withauth'`:

| File | Hits |
|------|------|
| `apps/frontend/src/lib/api/base/dataWriter.type.ts` | 19 |
| `apps/frontend/src/lib/api/base/universalDataWriter.ts` | 12 |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | 5 |
| `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts` | 3 |
| `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts` | 1 |
| `apps/frontend/src/lib/contexts/auth/authContext.type.ts` | 1 |
| **Total** | **41** |

**Dispositions:**

- **1 definition to delete** — `export type WithAuth = { authToken: string }` in `dataWriter.type.ts`
  (measured `:341-346`). It has exactly one member.
- **3 option types become EMPTY**, and their consuming signatures become zero-arg: `logout`,
  `backendLogout`, `getBasicUserData` (declared in `dataWriter.type.ts`, wrapped in
  `universalDataWriter.ts`, implemented in `supabaseDataWriter.ts` where the params are already named
  `_opts`). Plus **`AbortAllJobsOptions = WithAuth`**, which becomes `{}` and should simply be deleted.
- **10 option types LOSE ONE FIELD**: `SetAnswersOptions`, `SetPropertiesOptions`, `SetQuestionOptions`,
  `GetCandidateUserDataOptions`, `GetActiveJobsOptions`, `GetPastJobsOptions`, `StartJobOptions`,
  `GetJobProgressOptions`, `AbortJobOptions`, `InsertJobResultOptions`.
  **10, not the roadmap's 4 + 7 = 11** — the roadmap counts `AbortAllJobsOptions` among the seven
  admin-job types, but it is the one that becomes *empty* rather than losing a field.
- **`login`'s `Partial<WithAuth>` RETURN type is the one place `WithAuth` is not an input** —
  `dataWriter.type.ts:115`, `universalDataWriter.ts:47` and the abstract `_login` at
  `universalDataWriter.ts:253`. Under Supabase, `login` returns `{ type: 'success' }` and never an
  `authToken`, so `Partial<WithAuth>` is dead weight there and goes with the rest. The `@returns` JSDoc at
  `dataWriter.type.ts:113` must be rewritten with it.
- **`preregisterWithApiToken`** intersects `& WithAuth` at `dataWriter.type.ts:79`,
  `universalDataWriter.ts:97` and the abstract `_preregister` at `:246` — three more sites the sweep must
  reach.

**`WithOptionalAuth` (18 refs / 2 files)**, defined at `adminContext.type.ts:50`:

```ts
export type WithOptionalAuth<TParams> = Omit<TParams, 'authToken'> & { authToken?: string };
```

| File | Hits | Detail |
|------|------|--------|
| `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts` | 9 | 1 import + 8 method signatures |
| `apps/frontend/src/lib/contexts/admin/adminContext.type.ts` | 9 | 8 method declarations + the definition at `:50` |

It becomes **vacuous** once `authToken` is gone — it would `Omit` a key that no longer exists and re-add
it optionally. It must be deleted, and its deletion is provable **only by grep 4**.

---

## 5. The Supabase `current_password` spike — three items, measured against the live local stack

Run 2026-08-30 against the running local Supabase (`supabase status`: services up;
`http://127.0.0.1:54321`; GoTrue image `public.ecr.aws/supabase/gotrue:v2.187.0`; Supabase CLI **v2.83.0**,
catalog pin `supabase: ^2.78.1`). Installed client: **`@supabase/auth-js` 2.99.3**, `@supabase/supabase-js`
2.99.3 — both measured from `node_modules/*/package.json`.

### Spike item 1 — does `updateUser({ password, current_password })` typecheck at 2.99.3? → **PASS**

**Command** (scratch file at the repository root, outside `apps/ packages/ tests/`, deleted afterwards):

```ts
// .157-09-spike-scratch.ts
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('http://127.0.0.1:54321', 'anon-key');
export async function probe(password: string, currentPassword: string) {
  return supabase.auth.updateUser({ password, current_password: currentPassword });
}
```

```
$ npx tsc --noEmit --strict --skipLibCheck --module esnext --target es2022 \
      --moduleResolution bundler .157-09-spike-scratch.ts
$ echo $?
0
```

**Negative control** — to prove the check is real and not silently permissive, the same file with a bogus
property:

```
$ npx tsc --noEmit --strict --skipLibCheck --module esnext --target es2022 \
      --moduleResolution bundler .157-09-spike-negctl.ts
.157-09-spike-negctl.ts(4,47): error TS2353: Object literal may only specify known properties,
  and 'definitely_not_a_field' does not exist in type 'UserAttributes'.
$ echo $?
2
```

TypeScript 5.9.3. The field is genuinely on `UserAttributes` — quoted verbatim from the installed package:

```ts
// node_modules/@supabase/auth-js/dist/module/lib/types.d.ts:368-376
export interface UserAttributes {
    /**
     * The user's current password
     *
     * This is only ever present when the user is resetting
     * their password and GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD is true.
     *
     */
    current_password?: string;
```

**Verdict: PASS.** The first-party docs place `current_password` at supabase-js v2.102.0+ while this tree
has 2.99.3, yet the type is present and `tsc` accepts it. The doc/tree discrepancy is resolved in the
tree's favour. *(Note the `.d.ts`'s own words: the field is meaningful **only when the gate is true** —
which is item 2.)*

### Spike item 2 — is there a `config.toml` key for the gate at the pinned CLI? → **FAIL**

**Command 1 — the direct grep the research predicted:**

```
$ grep -n 'require_current_password' apps/supabase/supabase/config.toml
$ echo $?
1        # no match
```

**Command 2 — what IS in the file, in context** (`apps/supabase/supabase/config.toml:218-228`):

```
# If enabled, users will need to reauthenticate or have logged in recently to change their password.
secure_password_change = false
```

**Command 3 — the decisive one. Search the pinned CLI binary itself, since a key absent from *our*
`config.toml` might still be *supported*:**

```
$ BIN=node_modules/supabase/bin/supabase          # Mach-O 64-bit executable arm64, CLI v2.83.0
$ for k in require_current_password REQUIRE_CURRENT_PASSWORD secure_password_change SECURITY_UPDATE_PASSWORD; do
    echo -n "$k : "; strings "$BIN" | grep -c "$k"; done
require_current_password : 0
REQUIRE_CURRENT_PASSWORD : 0
secure_password_change : 2
SECURITY_UPDATE_PASSWORD : 1

$ strings "$BIN" | grep -o 'GOTRUE_SECURITY[A-Z_]*' | sort -u
GOTRUE_SECURITY_CAPTCHA_ENABLED
GOTRUE_SECURITY_CAPTCHA_PROVIDER
GOTRUE_SECURITY_CAPTCHA_SECRET
GOTRUE_SECURITY_MANUAL_LINKING_ENABLED
GOTRUE_SECURITY_REFRESH_TOKEN_REUSE_INTERVAL
GOTRUE_SECURITY_REFRESH_TOKEN_ROTATION_ENABLED
GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION

$ strings "$BIN" | grep -i 'current_password'
             # (no output at all)
```

And the toml binding, which shows what `secure_password_change` actually maps to:

```
$ strings "$BIN" | grep 'secure_password_change'
secure_password_change = false
SecurePasswordChange;toml:"secure_password_change" json:"secure_password_change"
```

**Verdict: FAIL.** **No `config.toml` key maps to
`GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD` at the pinned CLI.** The CLI emits exactly one
`GOTRUE_SECURITY_UPDATE_PASSWORD_*` variable — `…_REQUIRE_REAUTHENTICATION` — and it is bound to
`secure_password_change`. That is the **nonce / email-OTP reauthentication** path
(`UserAttributes.nonce`, `types.d.ts:388-394`: *"Call reauthenticate() to obtain the nonce first"*), a
**different mechanism** which the settings form does not implement. The string `current_password` does not
occur in the CLI binary at all.

**Consequence:** the current-password gate can be set only on hosted Supabase, so **local dev and E2E
would never exercise it.** Per `157-RESEARCH.md` § D.5, that makes item 2 blocking on its own.

### Spike item 3 — with the gate OFF, does GoTrue reject, ignore, or error on a wrong `current_password`? → **IGNORE (therefore FAIL)**

Measured against the live stack with a **throwaway** auth user created and deleted inside the probe — no
seeded candidate's password was touched. Probe script at the repository root, deleted afterwards.

| Step | Command | Observed output |
|------|---------|-----------------|
| 1 | `POST /auth/v1/admin/users` (service_role) `{ email, password: OrigPassword123!, email_confirm: true }` | `status 200`, id `2d84caf8-…`, email `spike157-09-throwaway@example.invalid` |
| 2 | `POST /auth/v1/token?grant_type=password` with the original password | `status 200`, `has_token: true` |
| **3** | **`PUT /auth/v1/user` with `{ password: BrandNewPassword456!, current_password: "ThisIsNotMyPassword999!" }`** (a deliberately WRONG current password) | **`status 200`** — full user object returned, **no error, no warning** |
| 4a | sign in with the **NEW** password | `status 200`, token issued — **the password change went through** |
| 4b | sign in with the **ORIGINAL** password | `status 400`, `invalid_credentials` — the old password is genuinely gone |
| 5 | same call again via **`supabase-js`** `sb.auth.updateUser({ password: 'YetAnother…', current_password: 'AlsoWrong000!' })` | `error: null`, `user_updated: true` |
| 5b | sign in with the client-set password | `status 200`, token issued |
| 6 | teardown: `DELETE /auth/v1/admin/users/{id}`, then re-list | `delete_status: 200`, `user_still_present: false` |

**Verdict: FAIL — GoTrue IGNORES it.** Not "reject", not "error": HTTP **200**, the password is changed,
and the supplied `current_password` has **no effect whatsoever**. Confirmed twice, once at the raw HTTP
level and once through the exact client the app uses. This is not inferred from item 1 — a type existing
is not a server enforcing, and here the server demonstrably does not enforce.

**Consequence:** option (b) *requires* the gate to be on, and item 2 established there is no way to turn it
on in this repository's local stack. Item 2 is therefore blocking, exactly as the research predicted.

### Spike cleanup — verified

- All three scratch files (`.157-09-spike-scratch.ts`, `.157-09-spike-negctl.ts`,
  `.157-09-spike-item3.mjs`) deleted. `git status --porcelain` shows nothing outside `.planning/`.
- **No leaked auth user.** `select count(*) from auth.users where email like 'spike157-09%'` → **0**.
  `select count(*) from auth.users` → **2**, both seed fixtures (`admin@openvaa.test`,
  `candidate@openvaa.test`, both created `14:42:37`, before the 14:45:55 probe). There are no
  non-internal triggers on `auth.users`, so no dependent row was created.
- **Database intact.** `candidates` 328 (= 327 `seed_`-prefixed dev-seed rows + `seed.sql`'s
  `00000000-…-020` "Test Candidate"), `organizations` 8, `questions` 26, `app_settings` 1. The pgTAP suite
  was **not** run, so the database is **not** contaminated and needs no reseed.
- `yarn db:types` and `yarn db:lint:sql` were **not** run, as instructed.

### Two further measured facts the decision turns on (neither is in the CONTEXT)

**(i) `canSubmit` never references `currentPassword` — the form submits with the field blank.** Measured
verbatim at `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte:42`:

```ts
let canSubmit = $derived(status !== 'loading' && isNewPasswordValid && !!password);
```

A user can leave the current-password box empty and change their password. The field is not merely
unverified — it is not even *required*.

**(ii) `error.changePassword` claims the check happened, in all SEVEN locale catalogs.** Rendered at
`+page.svelte:123`. Measured: `grep -rn 'changePassword' apps/frontend/src/lib/i18n/translations/*/candidateApp.settings.json`
→ **7 files** (`en`, `da`, `et`, `fi`, `fr`, `lb`, `sv`), each at `:5`:

| Locale | String |
|--------|--------|
| `en` | "Password change failed. Make sure that your current password is correct." |
| `da` | "Ændring af adgangskode mislykkedes. Tjek at din nuværende adgangskode er korrekt." |
| `et` | "Parooli vahetamine ebaõnnestus. Veendu, et sinu praegune parool on õige." |
| `fi` | "Salasanan vaihto epäonnistui. Varmista, että nykyinen salasanasi on oikein." |
| `fr` | "Échec du changement de mot de passe. Assurez-vous que votre mot de passe actuel est correct." |
| `lb` | "Passwuert konnt net geännert ginn. Kontrolléiert wgl., ob Äert aktuell Passwuert richteg ass." |
| `sv` | "Lösenordsändring misslyckades. Kontrollera att ditt nuvarande lösenord är korrekt." |

The app tells users, in seven languages, that their current password was checked. Item 3 proves it was
not.

### Spike scoreboard

| Item | Question | Verdict |
|------|----------|---------|
| **Spike item 1** | `updateUser({ password, current_password })` typechecks at 2.99.3? | **PASS** |
| **Spike item 2** | a `config.toml` key maps to `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD` at the pinned CLI? | **FAIL** — no such key; only `secure_password_change` → `…_REQUIRE_REAUTHENTICATION`, a different mechanism |
| **Spike item 3** | with the gate off, does GoTrue reject / ignore / error a wrong `current_password`? | **FAIL — it IGNORES it** (HTTP 200, password changed) |

**2 of 3 failed.**

---

## 6. BRANCH DECISION — the candidate-settings current-password field

### Status: ✅ **DECIDED — (a) delete the field.** Operator verdict taken 2026-08-30; `157-10` is released.

`157-09-PLAN.md` Task 3 is `checkpoint:decision` with `gate="blocking-human"`. The executor does not take
it. What is recorded here is the **evidence and the rule's own output**, not a chosen answer.

### What the plan's own rule selects

The plan states it in two sentences:

> *"If all three spike items passed, take branch (b): keep the field and make it verify."*
> *"If ANY of the three failed, take branch (a): delete the field."*

**Items 2 and 3 failed. Applying the plan's rule as written, the selected branch is (a) — delete the
field.** Option (b) is not merely more expensive here; it is **not implementable in this repository**:
making the field verify requires a GoTrue gate that has no `config.toml` key at the pinned CLI (item 2),
and without that gate the server measurably ignores the value (item 3). Passing `current_password` through
`_setPassword` today would change **nothing** at runtime while leaving the seven-locale claim standing —
i.e. it would look like a fix and be one only on hosted Supabase, never in local dev or E2E.

### BRANCH DECISION — operator verdict

| Field | Value |
|-------|-------|
| **Decision** | ☑ **(a) delete the field** — operator verdict, 2026-08-30. Option (b) declined as not implementable at the pinned CLI. |
| **Rule's output from measured verdicts** | **(a) delete** — items 2 and 3 failed |
| **Recorded by** | Operator, via the orchestrator, after reviewing the three-item spike dossier. |
| **Date** | 2026-08-30 |
| **Third option considered and declined** | Verifying the current password in-app via `signInWithPassword` before `updateUser` (needs no GoTrue gate, so it would work locally and in E2E) was put to the operator alongside (a) and (b). The operator chose (a). |

### Branch-independent obligation — binding under EITHER option

> **`candidateApp.settings.error.changePassword` must stop telling users their current password was
> checked, because the system does not perform that check.** This is `[measured: item 3 — HTTP 200, value
> ignored]`, not a stylistic preference, and it is **not contingent on the branch**. All seven locale
> catalogs (`en`, `da`, `et`, `fi`, `fr`, `lb`, `sv`) carry the claim at
> `apps/frontend/src/lib/i18n/translations/<locale>/candidateApp.settings.json:5` and all seven must be
> rewritten. Under (b) the claim could in principle become true — but item 2 shows it cannot become true
> *here*, so the obligation stands in both branches.
>
> Rewriting an existing key's **value** in all seven catalogs does **not** change the key set, so
> `yarn assert:i18n-catalog-namespaces` is unaffected by this obligation alone.

### Collateral of branch (a), enumerated (the branch the rule selects)

Source chain:
1. `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte` — `let currentPassword = $state('')` (`:35`), the `setPassword({ currentPassword, password })` argument (`:52`), the reset in `handleSubmit` (`:64`), and the whole `<div data-testid="settings-current-password">` block (`:102-113`) with its `<label for="currentPassword">` and `<PasswordField id="currentPassword" bind:password={currentPassword} autocomplete="current-password">`.
2. `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts` — the `setPassword` forwarding (`:69-72`) and its comment.
3. `apps/frontend/src/lib/contexts/auth/authContext.type.ts` — the `setPassword` signature (`:41`), its `@param currentPassword` (`:38`) and the long JSDoc paragraph (`:37`) that explains the shim.
4. `apps/frontend/src/lib/api/base/dataWriter.type.ts` — `setPassword`'s option intersection (`:158`) and its `@param currentPassword` (`:153`).
5. `apps/frontend/src/lib/api/base/universalDataWriter.ts` — the public `setPassword` (`:147`) and the `protected abstract _setPassword` (`:259`) — **the D-F1 target**.
6. `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — `_setPassword`'s parameter type (`:82`) and the shim comment (`:83`).

Tests:
7. `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` — `:172` **the test TITLE must be renamed** (it currently reads "ignoring currentPassword and authToken"); `:178` and `:191` drop the argument.
8. `tests/tests/utils/testIds.ts:55` — delete `currentPassword: 'settings-current-password',` from `candidate.settings`.
9. `tests/tests/specs/a11y/candidate-a11y.spec.ts:230` — **a LOAD-BEARING anchor, not a passing mention.** The `cand-settings` case uses `contentTestId: testIds.candidate.settings.currentPassword`, and the comment above it (`:225`) states why: *"Anchor on the current-password field: the settings form's inputs mount with the candidate's own settings data, while the 'Settings' heading is a static i18n title that renders before it."* It must be **RE-ANCHORED, not deleted**, to `testIds.candidate.settings.newPassword` (`'settings-new-password'`, `testIds.ts:56`) — measured to be rendered by the same form at `+page.svelte:115` and to satisfy the same "mounts with the candidate's own data" property. The `postLoginTestId` marker (`settings.updateButton`) is unaffected.

Localization:
10. Seven locale catalogs, keys `password.current` (`:12`) and `password.currentDescription` (`:13`) in `apps/frontend/src/lib/i18n/translations/{en,da,et,fi,fr,lb,sv}/candidateApp.settings.json`. **`password.currentDescription` is already dead** — its only reference is commented out at `+page.svelte:100`.
11. `apps/frontend/src/lib/types/generated/translationKey.ts` is **GENERATED** and **must be regenerated**: removing catalog keys without regenerating it fails `yarn assert:i18n-catalog-namespaces`, which runs inside `lint:check` (currently exit 0 and must stay so).
12. Plus the branch-independent `error.changePassword` rewrite in the same seven catalogs (value only, key retained).

### If the operator overrules to (b) — what the record would need

Per the plan's acceptance criteria, a (b) verdict must state **which `config.toml` key is set** and **what
`_setPassword` will forward**. On the measurements above, the first of those **cannot be filled**: no such
key exists at CLI v2.83.0. A (b) verdict therefore also has to say how the gate is to be enabled (hosted
dashboard only, with local dev and E2E left unable to exercise it) and how the seven-locale claim is to be
made true in an environment where the server ignores the field. `_setPassword` would forward
`current_password: currentPassword` into `this.supabase.auth.updateUser({ password, current_password })`,
and `canSubmit` (`+page.svelte:42`) would gain `&& !!currentPassword`.

---

## 7. Backstop — no source file was modified

```
$ git status --porcelain apps packages tests
             # (empty — 0 lines)

$ git status --porcelain
?? .planning/state.json          # pre-existing, not created by this plan
```

The three spike scratch files lived at the repository root (outside `apps/ packages/ tests/`) and were
deleted. No source file was edited at any point; nothing needed restoring.
