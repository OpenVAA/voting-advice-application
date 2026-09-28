---
phase: 158-routing-auth-surface-harmonisation
plan: 13
subsystem: auth
tags: [sveltekit, server-load, hydration-payload, session, guard-script, vitest]

requires:
  - phase: 158-03
    provides: "`scripts/assert-cookie-names.mjs` — the fixture-driven, `lint:check`-chained guard shape this plan follows, and the ledger's Section B convention"
  - phase: 158-06
    provides: "the candidate auth endpoint move, and the measured handler order the hook still runs in"
  - phase: 158-10
    provides: "`158-ADMIN-BASELINE.md` flag (3) — the measured shape of the authenticated admin SSR payload at this HEAD, before it was changed"
  - phase: 158-11
    provides: "`appGateHandle` and `APP_GATES`; the hook reads `safeGetSession()` and never a layout's returned payload, so it is unaffected by this narrowing"
provides:
  - "Both subtree server loads return the projection `{ userId, expiresAt }` or the null form — no credential in any server load's hydration payload"
  - "`getUserData`'s structural ancestor-data type narrowed with them, its REQUIRED member preserved"
  - "`scripts/assert-no-session-in-loads.mjs` — four checks, a proven-real corpus, a comment-blind spelling backstop and an always-on self-test"
  - "`apps/frontend/src/routes/admin/layout.server.test.ts` — 27 cases driving BOTH loads directly, including two compile-level producer/consumer assertions"
  - "Section D of the negative-control ledger: four controls, one per check, each with quoted red and green halves"
affects: [158-14, 158-16, admin-app, candidate-app, auth-context]

actuals:
  tokens: 18670
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A server load returns a PROJECTION of a credential-bearing object, never the object; the projection's key set is enumerated and compared in a unit spec so an adjacent member fails by name"
    - "A guard matches the destructure-and-return PAIR, scope-aware, because either half alone is legitimate"
    - "A guard's self-test runs on EVERY invocation, not behind a flag, so a clean corpus zero is only ever reported in a run where the same scanner was seen to flag something"
    - "A spelling backstop over source must be comment-blind when the codebase explains the banned thing in prose"

key-files:
  created:
    - apps/frontend/src/routes/admin/layout.server.test.ts
    - scripts/assert-no-session-in-loads.mjs
    - scripts/fixtures/assert-no-session-in-loads.input.ts
    - scripts/fixtures/assert-no-session-in-loads.expected.ts.violations
  modified:
    - apps/frontend/src/routes/admin/+layout.server.ts
    - apps/frontend/src/routes/candidate/+layout.server.ts
    - apps/frontend/src/lib/auth/getUserData.ts
    - package.json
    - .planning/phases/158-routing-auth-surface-harmonisation/158-NEGATIVE-CONTROL-LEDGER.md

key-decisions:
  - "The payload KEY stays `session`. The projection is the value, not the key. Renaming the key would have edited the one test that pins the consumer coupling (`authContext.svelte.test.ts`), which the plan forbids touching, and would have broken `getUserData`'s pre-check for no gain."
  - "Check 1 is SCOPE-AWARE, not file-scoped. The first implementation collected session bindings per file and flagged the guard's own fixture at a line where `session` is read off `url.searchParams` in a function with no verified-session call in it. `enclosingBlock()` exists because that false positive was observed."
  - "The corpus floor is 10, the number the tree actually yielded on 2026-09-02, not a guessed-low number. A deliberate removal of a load fails the guard, which is intended: lower the constant in the same commit, so the reduction is visible in the diff."
  - "The self-test is not behind a `--self-test` flag (the comment-hygiene guard's shape). The plan requires the fixture to be flagged in the SAME invocation that reports the real corpus clean, and a flag would let the clean run happen without it."
  - "The full E2E suite was NOT run. The live verification was done instead on a one-off dev server on an alternate port, with a pre-change/post-change control. Stated as a limitation below rather than implied."

patterns-established:
  - "Byte-identical sibling loads: the pair is regenerated from one file by `sed` on the application name and proven identical by a normalising `diff` in the verify block, so a docstring cannot name an artifact that exists for only one of them"
  - "Live payload verification with a pre-change control: the removal is attributed to THIS change by observing the detector flip 1 → 0 → 1 as the tree is moved between commits under one running server"

requirements-completed: [D10-C13]

coverage:
  - id: D1
    description: "Both subtree server loads return `{ userId, expiresAt }` or the null form; the identifier comes from the separately verified user; the expiry is an identity pass-through; two concurrent calls stay independent"
    requirement: "D10-C13"
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/admin/layout.server.test.ts (27 tests, both loads driven directly)"
        status: pass
      - kind: other
        ref: "live: authenticated GET /admin on a fresh server — `data:{session:{access_token` 1 (pre-change) → 0 (post-change), `session:{userId` 0 → 1, same server, same identity"
        status: pass
    human_judgment: false
  - id: D2
    description: "`getUserData`'s structural ancestor-data type narrowed with the producers, its REQUIRED member preserved; the coupling asserted at compile time from each load's own ReturnType"
    requirement: "D10-C13"
    verification:
      - kind: other
        ref: "yarn typecheck --force → 22 tasks successful, svelte-check 0 errors 0 warnings; the same assertions were observed FAILING against the pre-change type (line 165: \"Type 'true' is not assignable to type 'false'\")"
        status: pass
    human_judgment: false
  - id: D3
    description: "A chained repository-level assertion with a real corpus, a comment-blind spelling backstop, chain membership as a set operation, and an always-on self-test"
    requirement: "D10-C13"
    verification:
      - kind: other
        ref: "node scripts/assert-no-session-in-loads.mjs → exit 0, corpus 10, fixture flagged 5 in the same run; yarn lint:check → exit 0"
        status: pass
      - kind: other
        ref: "chain-membership node check → missing=[] (names assert:cookie-names, assert:adapter-casts, assert:comment-hygiene explicitly)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Four negative controls, one per check, each with quoted red and green halves; controls D2 and D3 record their green half in the same run as the matching red"
    requirement: "D10-C13"
    verification:
      - kind: manual_procedural
        ref: "158-NEGATIVE-CONTROL-LEDGER.md § Section D (D1–D4)"
        status: pass
    human_judgment: true
    rationale: "The controls are one-off planted observations; nothing in the suite re-runs them. A human confirms the recorded rows describe the guard that actually shipped."

duration: 16min
completed: 2026-09-02
status: complete
---

# Phase 158 Plan 13: The session leaves the document body

**Both subtree server loads now return `{ userId, expiresAt }` instead of the whole `Session`, so no refresh token is serialised into the hydration payload of any authenticated page — measured 1 → 0 on a running server with a pre-change control — and a four-check, corpus-proven, comment-blind guard in the `lint:check` chain stops a fourth load reintroducing the class quietly.**

## Performance

- **Duration:** ~16 min
- **Started:** 2026-09-02T08:31Z
- **Completed:** 2026-09-02T08:47Z
- **Tasks:** 3
- **Files modified:** 9 (4 created, 5 modified)

## Task Commits

1. **Task 1: Narrow both subtree loads, and the helper's structural type with them** — `9e0be395d`
2. **Task 2: The durable assertion — four checks, a real corpus, a comment-blind backstop** — `d51c7f83b`
3. **Task 3: Observe the guard red, then green, and record the controls** — `aaeaafb23`

---

## The projection as landed, and the key set the spec compares

Both loads, byte-identical up to their application name:

```ts
export async function load({ locals }) {
  const { session, user } = await locals.safeGetSession();

  return {
    session: session && user ? { userId: user.id, expiresAt: session.expires_at ?? null } : null
  };
}
```

**The destructuring that shows the identifier comes from the VERIFIED user**, quoted from `apps/frontend/src/routes/admin/+layout.server.ts:20`:

```ts
const { session, user } = await locals.safeGetSession();
```

`user` is the value `safeGetSession` obtains from a separate `supabase.auth.getUser()` round trip (`hooks.server.ts`), not `session.user` — the nested one the auth library wraps in an insecure-use proxy because it is unverified. `userId` is `user.id`.

**The enumerated key set the spec compares**, not a spot-check:

```ts
const PROJECTION_MEMBERS = ['expiresAt', 'userId'];
…
expect(Object.keys(data)).toEqual(['session']);
expect(Object.keys(projection).sort()).toEqual(PROJECTION_MEMBERS);
```

and five adjacent members are failed **by name**, each in its own case:

```ts
const FORBIDDEN_MEMBERS = ['access_token', 'refresh_token', 'user', 'provider_token', 'token_type'];
```

with a belt-and-braces `JSON.stringify(data)` assertion that neither fake credential value appears anywhere in the serialised payload, which catches a member nested one level down.

### The comment-stripped credential grep over each producer's CODE

| File | comment-stripped `grep -cE "access_token\|refresh_token"` |
|---|--:|
| `routes/admin/+layout.server.ts` | **0** |
| `routes/candidate/+layout.server.ts` | **0** |
| `routes/+layout.server.ts` (the analog, comment-stripped) | **0** |
| `routes/+layout.server.ts` (the analog, **unfiltered**) | **1** |

The last row is the positive control that makes the three zeros measurements rather than a broken instrument — and it is also the measured reason the guard's Check 2 strips comments.

### The two loads are still one idiom

```
$ diff <(sed 's/[Aa]dmin/APP/g' apps/frontend/src/routes/admin/+layout.server.ts) \
       <(sed 's/[Cc]andidate/APP/g' apps/frontend/src/routes/candidate/+layout.server.ts)
$ echo $?
0
```

Reaching that exit 0 forced a real correction: the first draft's docstring named `routes/admin/layout.server.test.ts` and `158-ADMIN-BASELINE.md`, both of which survive the candidate-side `sed` and both of which are admin-specific. Rather than let the normaliser paper over it, the sentences were rewritten to be TRUE IN BOTH FILES — the spec is referred to as "the ONE spec that drives BOTH of these loads", and the provenance moved to the spec's own docstring. A docstring that names an artifact existing for only one of a byte-identical pair is a small lie that the next reader inherits.

---

## The helper's structural type, before and after

**Before** (`apps/frontend/src/lib/auth/getUserData.ts`):

```ts
type ParentSessionData = { session?: { access_token: string } | null };
```

**After:**

```ts
type ParentSessionData = { session?: { userId: string } | null };
```

The member is still **REQUIRED**, which is the property the docstring says the type exists for: a truthy scalar must not pass as evidence of a session. That is asserted at compile time, not claimed:

```ts
type ParentData = Awaited<ReturnType<NonNullable<NonNullable<Parameters<typeof getUserData>[1]>['parent']>>>;
type Accepts<TShape> = TShape extends ParentData ? true : false;

const rejectsBareBoolean: Accepts<{ session: true }> = false;
const rejectsString: Accepts<{ session: 'yes' }> = false;
const rejectsNumber: Accepts<{ session: 1 }> = false;
const rejectsExpiryOnly: Accepts<{ session: { expiresAt: number | null } }> = false;
const acceptsTheProjection: Accepts<{ session: { userId: string; expiresAt: number | null } }> = true;
const acceptsTheNullForm: Accepts<{ session: null }> = true;

// The producer-to-consumer coupling, from each load's OWN return type rather than a re-declaration.
const adminPayloadSatisfiesTheHelper: Accepts<Awaited<ReturnType<typeof adminLoad>>> = true;
const candidatePayloadSatisfiesTheHelper: Accepts<Awaited<ReturnType<typeof candidateLoad>>> = true;
```

`ParentData` walks the exported function's own parameter types rather than re-declaring the shape, so the assertion and the original cannot drift apart — which is the class of defect this phase exists to remove.

**These assertions are load-bearing, proven by having been observed RED.** Against the pre-change tree, `yarn typecheck` reported, verbatim:

```
ERROR "src/routes/admin/layout.server.test.ts" 165:11 "Type 'true' is not assignable to type 'false'."
```

After the narrowing: `yarn typecheck --force` → **22 tasks successful**, `svelte-check found 0 errors and 0 warnings`.

---

## The authentication context spec was NOT edited

```
$ git status --porcelain apps/frontend/src/lib/contexts/auth/authContext.svelte.test.ts
(empty)
```

It passes unchanged — 4 tests — because the projection is still truthy or null and the derived flag reads `!!page.data.session`. Its path is clean in `git status` and it appears in no commit of this plan.

---

## The guard: corpus size, chain membership, and what it prints

```
$ node scripts/assert-no-session-in-loads.mjs
No-session-in-server-loads guard (phase 158: D10-C13) — corpus: 10 server-load module(s) under apps/frontend/src/routes (floor 10).
No-session-in-server-loads guard (phase 158: D10-C13) — 10 module(s), 463 line(s) scanned; 0 violation(s) in the real corpus; self-test flagged 5 line(s) in scripts/fixtures/assert-no-session-in-loads.input.ts (matching the committed expectation); 0 violation(s) in total.
$ echo $?
0
```

**Corpus size: 10**, printed on the first line of every run, pass or fail — including the Check 0 failure run, where it printed `0`. Floor: 10, derived from the tree on 2026-09-02, not guessed. Anchors: the root server loader and the two this plan narrowed.

**Check 3, quoted, and it is a SET operation and not an index:**

```js
const links = lintCheck.split('&&').map((link) => link.trim());
if (!links.includes(CHAIN_LINK)) { … }
```

`links.includes(...)` is membership of the chain's link set. There is no index and no terminal-position test anywhere in the check, deliberately: every link after a failing one is equally skipped, so position is incidental and asserting it would make appending the next guard a test failure.

**The chain-membership check from the plan's verify block:**

```
$ node -e "…const need=['yarn assert:no-session-in-loads','yarn assert:cookie-names','yarn assert:adapter-casts','yarn assert:comment-hygiene'];…"
missing=[]
chain links=15
exit 0
```

The list names the sibling guards explicitly, so the check proves the append did not drop one. `158-03`'s cookie-name guard is still in the chain after this plan's edit — asserted, not inferred from the diff. `yarn lint:check` exits **0**, with the new guard as the last link and the cookie guard immediately before it.

### The four checks, and the one design correction the fixture forced

| Check | What it asserts |
|---|---|
| 0 | The corpus resolves, is at or above the floor, contains three named anchors, and excludes the fixture directory. Failing it aborts the script before checks 1–3 run at all. |
| 1 | The destructure-and-return **PAIR**, scope-aware. Four shapes: shorthand, renamed member, `{ ...session }` re-wrap, and the whole-result `auth.session` form. |
| 2 | A credential field name in **CODE**, over comment-masked source. |
| 3 | Chain membership, as a set operation. |

**The correction.** Check 1's first implementation collected session bindings per FILE. It flagged the guard's own fixture at line 67 — a deliberate negative case in which `session` is read off `url.searchParams` in a function that contains no verified-session call at all — because a binding destructured in an *earlier* function was still in the file-scoped set. `enclosingBlock()` and an `inScope` filter were written in response, and the committed expectation records the outcome: **five** flagged lines, not six. The guard's own control caught it before it shipped.

---

## The four negative controls (ledger § Section D)

Ledger `^\|` count: **123 at the task's start → 152 after**, an increase of **29** against the required 4. Sections A, B and C were not touched; Section D was appended.

| Control | Check | Red half, observed | Green half, observed |
|---|---|---|---|
| **D1** | 1 (the pair) | The admin load restored to `return { session }` → **1 violation, exit 1**, naming `apps/frontend/src/routes/admin/+layout.server.ts:21`, the binding `'session'`, and the member it was returned as. | Plant removed by `git checkout --` on that one file → **0 violations, exit 0**. |
| **D2** | 1's precision | — | A `session` member returned from `(voters)/(located)/+layout.server.ts` that was NOT taken from the verified-session call is **never reported**, and it was present in the SAME run in which D1's plant WAS. **The count in that run is 1, not 2.** |
| **D3** | 2 (comment blindness) | The field name planted in CODE at `candidate/+layout.server.ts:21` → **1 violation, exit 1**. | In the SAME run, `routes/+layout.server.ts:16` — which does carry both field names, proven by an independent `grep` quoted in the ledger — is **not reported**. |
| **D4** | 0 (anti-vacuity) | Corpus repointed at `apps/frontend/src/lib/cookies` → corpus size printed as **0**, four violations, and `CHECK 0 FAILED — … Refusing to report a clean scan over a broken corpus.` **exit 1**. | Constant restored → `corpus: 10 … (floor 10)`, 0 violations, **exit 0**. |

**D1 and D2 were observed in one invocation. D3's two halves were observed in one invocation.** Both are recorded as such in the ledger, with the full verbatim output.

### D3's second half revises the plan's own estimate upward

The plan predicted an unfiltered scan would wrongly flag **one** file. Measured, with `maskComments` temporarily stubbed to `return source` and **no plant anywhere in the tree**: **6 violations across 3 files, every one of them correct** — `routes/+layout.server.ts:16`, `routes/admin/+layout.server.ts:8` and `routes/candidate/+layout.server.ts:8`. The two extra files are the loads *this plan* narrowed, whose new docstrings explain the class in the same prose the root loader does. The fixture's own flagged count also moved 5 → 9 in that run, because its docstring names both fields in prose on purpose. Exit 1; stub restored, exit 0.

Recorded because it is stronger than the plan's premise, not weaker: the comment mask is load-bearing against three files, and this plan created two of them.

---

## The live verification — the served payload, with a pre-change control

`<measurement_discipline>` requires asserting on the actual served payload, not the source diff, and the upstream note warns that an observation can be produced by more than one layer. Both were honoured.

**Method.** One **fresh** dev server started on `FRONTEND_PORT=5273`; the pre-existing server on `:5173` was neither stopped nor trusted nor used. Served-application identity asserted before any observation (`/@fs<cwd>/apps/frontend/src/routes/+layout.svelte` → 200; the emitted module root equals this checkout's frontend root). Database left exactly as found — no reset, no reseed. Login through the real form actions with the `seed.sql` identities. `curl` never followed redirects. No token value was transcribed anywhere; the projection below is quoted with its two values redacted.

| # | Observation | Observed |
|---|---|---|
| 1 | unauthenticated `GET /admin` | **307** → `…/admin/login?errorMessage=loginFailed` |
| 2 | admin login form action | **200**, `{"type":"redirect","status":303,"location":"…/admin"}`, one `sb-` cookie set (value not recorded) |
| 3 | authenticated `GET /admin` | **200**, 220 853 bytes, **no `location` header**, `node_ids: [0, 7, 8, 31]` |
| 4 | unauthenticated `GET /candidate/profile` | **303** → `…/candidate/login?redirectTo=candidate%2Fprofile` |
| 5 | candidate login form action | **200**, `{"type":"redirect","status":303,"location":"…/candidate"}` |

`node_ids [0, 7, 8, 31]` on row 3 reproduces `158-ADMIN-BASELINE.md` STATE B row 3 exactly.

### The payload detectors, and the control that makes them evidence

Run against the SAME server, the SAME identity, moving only the three source files between the pre-change commit and `HEAD`:

| Detector | pre-change tree | post-change tree |
|---|--:|--:|
| `data:{session:{access_token` (the baseline's own detector) | **1** | **0** |
| `refresh_token` anywhere in the document | **1** | **0** |
| `session:{userId` (the projection) | **0** | **1** |

**The flip is the evidence.** A zero on its own would not be: it could come from a broken detector, from a page that failed to render, or from some other layer. Here the same detector returns 1 on the same page from the same server minutes earlier, and returns 0 only after these three files change. No other layer can produce that.

**The projection as actually served** (both values redacted, per T-158-55):

```
session:{userId:"<uuid-redacted>",expiresAt:<epoch-redacted>}
```

Two members. Nothing else.

### And the 200 is not the error boundary, nor the login page

`158-ADMIN-BASELINE.md` records a database state in which every admin page answered 200 while rendering the error boundary, so the status was not trusted on its own:

| Detector | authenticated `/admin` | `/admin/login`, same run |
|---|--:|--:|
| `data-testid="error-message"` | **0** | 0 |
| `id="email"` | **0** | **1** |
| `id="password"` | **0** | **1** |
| `autocomplete="current-password"` | **0** | **1** |

The three zeros are measurements: the same instruments return 1 / 1 / 1 against the login page in the same run.

### One arm that failed, investigated rather than reported

Authenticated `GET /candidate` returned **307 → `/candidate/login?errorMessage=candidateNoNomination`**. That is the candidate protected layout's own `handleError`, reached because the `seed.sql` candidate has no nomination under the dev-seed data currently loaded; `handleError` also calls `signOut({ scope: 'local' })`, which is why a subsequent `/candidate/profile` request then took the hook's unauthenticated arm.

**It is not a regression from this plan, and that was proven rather than assumed.** With the three files checked out at the pre-change commit and the same login replayed against the same server, the identical `307 → …?errorMessage=candidateNoNomination` was observed. The arm is a database-data condition, upstream of anything this plan touched — the protected candidate layout reads `locals.safeGetSession()` directly and never reads `page.data.session`.

**Teardown.** The one-off `:5273` server was stopped (0 listeners afterwards); the pre-existing `:5173` server and the Supabase stack were left exactly as found; no database row was created or deleted; `git status --porcelain` over `apps packages tests scripts` prints nothing.

---

## Re-derived counts, against the tree as it stands

| Figure | Planning document | Re-measured here | Why |
|---|--:|--:|---|
| Server-load modules under the route tree | not stated | **10** | Enumerated for Check 0's floor rather than guessed |
| Files an unfiltered Check 2 would wrongly flag | **1** (plan `must_haves.truths` L32) | **3** (6 violations) | The plan was written before this plan's own two docstrings existed; they name the fields in the same prose |
| Frontend unit suite | 1443 (158-11) | **1470** (78 files) | +27 from `layout.server.test.ts` |
| Ledger `^\|` lines | 123 (158-11 close) | **152** | Section D |
| Root `lint:check` chain links | 14 | **15** | One appended |
| Unauthenticated `/api/admin/jobs/*` | 403 (157.2-09, OB-6 text) | not re-measured here | Corrected to **401** by 158-10 and confirmed by 158-11; this plan did not touch that surface |

---

## Files Created/Modified

- `apps/frontend/src/routes/admin/+layout.server.ts` — **modified.** The projection, plus the full docstring reason mirrored from the root loader.
- `apps/frontend/src/routes/candidate/+layout.server.ts` — **modified.** Byte-identical to the above up to the application name.
- `apps/frontend/src/lib/auth/getUserData.ts` — **modified.** `ParentSessionData` narrowed; docstring argument kept and its example updated.
- `apps/frontend/src/routes/admin/layout.server.test.ts` — **created.** 27 cases over both loads plus three compile-level assertion blocks.
- `scripts/assert-no-session-in-loads.mjs` — **created.** Four checks, always-on self-test.
- `scripts/fixtures/assert-no-session-in-loads.input.ts` — **created.** Five positive shapes, three negative controls, and a docstring that names both credential fields in prose so a broken mask shows up here too.
- `scripts/fixtures/assert-no-session-in-loads.expected.ts.violations` — **created.** The committed `path:line` expectation.
- `package.json` — **modified.** One script entry, one appended chain link.
- `.planning/phases/…/158-NEGATIVE-CONTROL-LEDGER.md` — **modified, append only.** Section D.

## Decisions Made

1. **The payload key stays `session`; only its value narrows.** Renaming it would have required editing `authContext.svelte.test.ts`, the one test that pins the coupling and the one file the plan forbids touching.
2. **Check 1 is scope-aware.** Forced by a false positive on the guard's own fixture — see above. A file-scoped binding set is the naive implementation and it flags correct code.
3. **The corpus floor is the measured 10, not a lower guess.** A removal fails loudly and the constant is lowered in the same commit; that is the sibling guards' fail-loud convention.
4. **The self-test is not behind a flag.** The plan's criterion is that the fixture is flagged in the SAME invocation that reports the corpus clean; a `--self-test` flag would allow a clean run without it.
5. **The whole-result binding form is matched too** (`const auth = await locals.safeGetSession(); return { session: auth.session }`), because a destructure-only pattern would miss the most obvious way round a destructure-only guard.

## Deviations from Plan

### Auto-fixed

**1. [Rule 1 — Bug] The guard's summary line attributed non-corpus violations to the real corpus**

- **Found during:** Task 2, on the first run with the fixture expectation missing.
- **Issue:** The line read `3 violation(s) in the real corpus` when all three were a fixture mismatch and two missing chain links. A number a reader would act on, describing a disclosure that was not there.
- **Fix:** `corpusViolations` counted separately from the total; the summary now reports the corpus count, the self-test's flagged count and whether it matched, and the total, as four distinct figures.
- **Committed in:** `d51c7f83b`.

**2. [Rule 1 — Bug] Check 1 was file-scoped and flagged its own fixture's negative control**

- **Found during:** Task 2, from the fixture's first run (line 67).
- **Fix:** `enclosingBlock()` plus an `inScope` predicate; a binding reaches a return only if it was bound before it and the return sits inside the binding's own block.
- **Committed in:** `d51c7f83b`.

**3. [Rule 2 — Missing critical] The loads' docstrings named admin-specific artifacts on the candidate side**

- **Found during:** Task 1, from the normalising diff, which is exactly what the diff is for.
- **Fix:** The two sentences rewritten to be true in both files; the provenance moved into the spec's own docstring. Not smoothed over by loosening the diff.
- **Committed in:** `9e0be395d`.

**4. [Rule 3 — Blocking] ESLint `@typescript-eslint/naming-convention` on the type parameter `T`**

- **Fix:** Renamed to `TShape` (`T` was rejected; `TCandidate` was rejected on readability grounds by hand, since "candidate" already names an application here).
- **Committed in:** `9e0be395d`.

### Recorded, not fixed

**5. The plan's `must_haves.truths` L32 undercounts the comment-blindness case.** It says an unfiltered scan would flag "the one file that is already correct". Measured: **three** files, six violations. Both numbers are stated in the ledger; only the measured one describes the shipped tree.

**Total deviations:** 4 auto-fixed (2× Rule 1, 1× Rule 2, 1× Rule 3), 1 recorded measurement correction.

## Issues Encountered

- **The pre-existing dev server on `:5173`** was neither stopped nor trusted. A one-off server on `:5273` was started for the live measurement and shut down afterwards; `:5173` was left exactly as found.
- **`GET /candidate` authenticated returns 307 `candidateNoNomination`** under the dev-seed data currently loaded. Reproduced identically on the pre-change tree, so it is a database-data condition rather than a regression. See the live-verification section.

## Verification Not Performed

Stated plainly rather than implied by omission.

- **The full E2E suite was not run.** It requires one fresh dev server on `:5173` (the port a pre-existing server holds, which is the user's) and a `db:reset`/`db:reset-with-e2e-data`, both of which would destroy local state this plan has no mandate to touch. The plan's own verify blocks specify unit tests, `yarn typecheck` and `yarn lint:check`, all of which pass; the live pre-change/post-change payload control above covers the behavioural risk the suite would have covered on the admin arm. **No E2E test was skipped, retried until green, or annotated as flaky** — the suite was not invoked at all, and no E2E file was touched by this plan.
- **The authenticated non-admin (403) arm** remains unexercised across this phase, as `158-10` and `158-11` both recorded. This plan does not change it.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change. The plan's register (`T-158-68` … `T-158-73`, `T-158-SC`) covers the surface; **no package was installed** — the guard uses Node built-ins and the existing in-repo `scripts/lib/comment-spans.mjs`.

## Known Stubs

None.

## Next Phase Readiness

- **`158-14`** (OB-1's two admin `+layout.server.ts` files returning the cookie array) adds two modules to this guard's corpus. Adding is above the floor and passes; the new loads must return `supabaseCookies` only, and this guard will flag them if either destructures a session and returns it.
- **`158-16`** (criterion 11's E2E spec) now has one more discriminating row available: the authenticated admin SSR payload must contain `session:{userId` and must NOT contain `access_token`. A spec asserting only the status would pass with the session back in the payload.
- **Standing note for any later plan editing a server load:** `yarn lint:check` now fails on a destructure-and-return pair, and the failure message names the file, the line and the binding.

---
*Phase: 158-routing-auth-surface-harmonisation*
*Completed: 2026-09-02*

## Self-Check: PASSED

All four created source/fixture files exist on disk; all three task commits (`9e0be395d`, `d51c7f83b`, `aaeaafb23`) resolve in `git log`.
