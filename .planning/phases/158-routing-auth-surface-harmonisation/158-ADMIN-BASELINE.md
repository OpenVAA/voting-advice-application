# Phase 158 — The admin path, re-measured at this HEAD

**ARM: GREEN**

**Measured:** 2026-09-02
**HEAD:** `5f122efd51dae8daa662a905eca5c77a56a33cc3`
**Branch:** `integration/ship-12-squash`
**Working tree:** clean apart from the untracked `.planning/milestone.lock`
**Produced by:** `158-10`, Task 1
**Obligations discharged:** `158-CARRIED-OBLIGATIONS.md` § **OB-6** (the re-measurement), § **OB-2** (the criterion-10 absence)

---

## Read this first — three things this measurement contradicts

Four sibling plans (`158-11` … `158-14`, and `158-15`'s criterion-11 spec) are about to be built on
this table. Three of the premises they would otherwise inherit are **wrong at this HEAD**. They are
stated here, at the top, because a reader who skips to the table will not find them.

### (1) The unauthenticated jobs endpoints return **401**, not 403

`157.2-09-SUMMARY.md`'s table records **403 `{"error":"Forbidden"}`** for the two jobs routes called
without a session. **OB-6 repeats it** — *"unauthenticated: the 307 and the 403."* At this HEAD both
routes return **401 `{"error":"Unauthorized"}`** (row 8, measured twice, both states).

This is not a regression. It is CR-01's deliberate 401-vs-403 split, live in
`apps/frontend/src/lib/server/admin/requireVerifiedAdmin.ts`: a missing session is `401 Unauthorized`
and only an authenticated **non-admin** gets `403 Forbidden`. The 403 in the older table was measured
before that split existed.

**Consequence for `158-15`:** a criterion-11 spec that asserts `403` for the unauthenticated arm
**will fail on a correct tree**. The unauthenticated arm is `307` (page) + `401` (endpoints). The 403
arm needs an *authenticated non-admin*, which this measurement did not create and which no row below
covers.

### (2) This plan's own stated precondition produces a database in which every admin page is a 200 on the error boundary

The plan's `<precondition>` names `yarn db:reset`. Measured: after a bare `yarn db:reset`, the
database carries `seed.sql` only — **no elections, no constituencies, no app settings**. The root
layout's DataProvider then returns empty (`A DataProvider returned an invalid result. { reason:
'empty' }`, logged at ERROR by the dev server on every request) and **the whole app renders its
generic error boundary** — `data-testid="error-message"`, *"Something went wrong, sorry!"* — while
still answering **HTTP 200**.

The voter root `GET /` did the same thing, which is what proves it is a database-state artifact and
not an admin-path defect.

So the measurement was taken **twice**, and both runs are recorded below:

| State | Database | What it is for |
|---|---|---|
| **A** | `yarn db:reset` — `seed.sql` only, 0 elections | The plan's stated precondition. Recorded to show it is inadequate, not to decide the arm. |
| **B** | `yarn db:reset-with-data` — `seed.sql` + dev-seed `default`, 752 rows | **The authoritative run. The arm is decided on State B.** |

**Consequence for `158-15`:** a spec that asserts only `expect(status).toBe(200)` passes on a page
showing "Something went wrong, sorry!". The spec must assert **page content**, and its fixture must
seed data. Under State A rows 3, 4 and 5 were all 200 and all three were the error boundary.

### (3) The authenticated admin SSR payload carries the full session, in the clear

Row 3's HTML embeds the SvelteKit data payload, and that payload contains `supabaseCookies` with the
`sb-…-auth-token` **cookie value**, plus a `session` object carrying `access_token` and
`refresh_token`. Detector: `data:{session:{access_token` → **1 hit** on row 3, **0** on the login page
(whose payload is `data:{session:null}`).

No values are transcribed into this artifact (T-158-55). This is recorded as **shape, not verdict** —
per `OB-1`'s own discharge clause an `sb-`-prefixed sentinel in the payload is the *positive control*
that the forwarded cookie array is genuinely present, so its presence is by design.

**Consequence for `158-13`** (the session-free subtree loads): the subtree it is about to make
session-free currently serialises the whole session into the document on every admin page load. That
is the shape it is changing, measured rather than assumed.

---

## Method

Reproduces `157.2-09-SUMMARY.md` § "The manual observation decision A2(a) assigns here", with two
deliberate narrowings.

1. **Stack.** `yarn db:reset` / `yarn db:reset-with-data`, then ONE fresh `yarn dev` per state, on
   `FRONTEND_PORT=5173`. `yarn test:unit` was not run at any point after either reset, so neither
   database was re-seeded behind the observation.
2. **Served-application identity, asserted before every run** (the preflight from `tests/README.md`
   § Run, performed by hand):

   ```
   curl -s -o /dev/null -w "%{http_code}" \
     "http://localhost:5173/@fs$(pwd)/apps/frontend/src/routes/+layout.svelte"   → 200
   curl -s http://localhost:5173/ | grep -oE '/@fs[^"]*?/\.svelte-kit'
     → /@fs/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/.svelte-kit
   ```

   The absolute module root the server emits equals this checkout's frontend root, so the server
   under measurement is this working tree's.
3. **Identity — narrower than `157.2`'s.** `157.2-09` used a `super_admin`. This run used
   **`project_admin`**, `scope_type` `project`, `scope_id` read at runtime out of
   `packages/dev-seed/src/supabaseAdminClient.ts`'s `TEST_PROJECT_ID` declaration (value
   `00000000-0000-0000-0000-000000000001`) — read from the source, never transcribed from a planning
   document. `project_admin` is the narrowest role in `ADMIN_ROLES`
   (`apps/frontend/src/lib/auth/roles.ts`) that `_getBasicUserData` maps to `role: 'admin'`, which
   satisfies T-158-51's "never wider than the measurement needs".
   Created through the auth admin API with `email_confirm: true`, against `http://localhost:54321`
   only.
4. **Login through the real form action**, never a minted cookie — the protected layout's identity
   read performs a verifying `getUser()` round trip and a synthetic token fails it.
5. **`curl` never follows redirects.** Every status below is the **first** response.

The driver script lived at the repository root as `.tmp-158-10-measure.mjs` for the duration of the
run and was deleted; `git status --porcelain apps packages tests scripts` prints nothing.

---

## STATE B — the authoritative run

Database: `yarn db:reset-with-data` (`seed.sql` + dev-seed `default`; 1 election, 5 constituencies,
26 questions, 377 nominations, 752 rows total). Fresh `yarn dev`. Temporary identity
`1bf54fdb-9532-4212-b850-6fbbd0adbad2`.

| # | Observation | Command | Observed |
|---|---|---|---|
| 1 | unauthenticated GET of the admin app root | `curl -s -i -o r -w '%{http_code}' 'http://localhost:5173/admin'` | **`307`**, `size_download=0`, `location: http://localhost:5173/admin/login?errorMessage=loginFailed` — fails closed |
| 2 | login through the admin login form action | `curl -s -X POST 'http://localhost:5173/admin/login' -H 'x-sveltekit-action: true' -H 'accept: application/json' --data-urlencode email=… --data-urlencode password=…` | **`200`**, 73 bytes, body `{"type":"redirect","status":303,"location":"http://localhost:5173/admin"}`; exactly one session cookie set, name `sb-127-auth-token` (value not recorded) |
| 3 | authenticated direct entry — a fresh GET of the admin app root, no prior client-side navigation | `curl -s -i -b jar -o r 'http://localhost:5173/admin'` | **`200`**, 224 117 bytes, **no `location` header at all** (the first response IS this 200), `node_ids: [0, 7, 8, 31]` |
| 4 | refresh — the same GET again | `curl -s -i -b jar -o r 'http://localhost:5173/admin'` | **`200`**, 224 117 bytes — **byte-identical to row 3**, no `location` header, `node_ids: [0, 7, 8, 31]` |
| 5 | refresh of a nested protected admin route | `curl -s -i -b jar -o r 'http://localhost:5173/admin/jobs'` | **`200`**, 224 138 bytes, no `location` header, `node_ids: [0, 7, 8, 10, 33]` |
| 6 | authenticated GET of the active-jobs endpoint | `curl -s -b jar 'http://localhost:5173/api/admin/jobs/active'` | **`200`**, 2 bytes, body `[]` |
| 7 | authenticated GET of the past-jobs endpoint | `curl -s -b jar 'http://localhost:5173/api/admin/jobs/past'` | **`200`**, 2 bytes, body `[]` |
| 8 | the same two endpoints unauthenticated | `curl -s 'http://localhost:5173/api/admin/jobs/{active,past}'` | **`401`** and **`401`**, 24 bytes each, body `{"error":"Unauthorized"}` — still fails closed. **NOT 403** — see flag (1) |

### Row 3, read strictly

The plan requires the FIRST response's status, its `location` header, and whether the returned HTML
carries the admin login form's markup.

| Property | Row 3 | Positive control — `GET /admin/login`, unauthenticated |
|---|--:|--:|
| first-response status | **200** | 200 |
| `location` header | **absent** | absent |
| `<form` tags | 1 | **2** |
| `id="email"` (the login email field) | **0** | **1** |
| `id="password"` (the login password field) | **0** | **1** |
| `autocomplete="current-password"` | **0** | **1** |
| `data-testid="error-message"` (error boundary) | **0** | 0 |
| `errorMessage=loginFailed` | **0** | — |
| `node_ids` | `[0, 7, 8, 31]` | `[0, 7, 35]` |

**Row 3's HTML does not carry the admin login form's markup**, and that zero is a measurement rather
than a broken detector: the same three greps return **1, 1, 1** against the login page in the same
run. The `node_ids` sets differ, so row 3 is a different SvelteKit node stack from the login page,
not the login page served at 200.

Row 3's rendered body opens with the admin shell — `data-testid="nav-menu-toggle"`,
`aria-controls="admin-app-menu"` — which the login page's body also carries (both sit under
`routes/admin/+layout.svelte`), which is exactly why the shell was **not** used as the discriminator.

### The arm

**ARM: GREEN.**

Rows 3, 4 and 6 are all `2xx` (200, 200, 200). Row 1 fails closed (`307` to the login page) and row 8
fails closed (`401` on both endpoints). Rows 5 and 7 are 2xx as well.

Criterion 8's defect — the admin universal load bouncing an authenticated admin to login on direct
entry and on refresh — **does not reproduce at `5f122efd5`**.

---

## STATE A — the plan's stated precondition, recorded because it is misleading

Database: `yarn db:reset` (`seed.sql` only; 0 elections). Fresh `yarn dev`. Temporary identity
`2fd7bb94-5ead-4878-986e-eb07b0a3163a`, same role and scope.

| # | Observation | Observed | Error boundary in the body? |
|---|---|---|---|
| 1 | unauthenticated GET of the admin app root | **`307`**, size 0, `location: …/admin/login?errorMessage=loginFailed` | n/a (empty body) |
| 2 | login through the admin login form action | **`200`**, 73 bytes, `{"type":"redirect","status":303,"location":"http://localhost:5173/admin"}` | n/a |
| 3 | authenticated direct entry | **`200`**, 202 405 bytes, no `location` header, `node_ids: [0, 7, 8, 31]` | **YES — 1 hit** |
| 4 | refresh, same GET | **`200`**, 202 405 bytes, no `location` header | **YES — 1 hit** |
| 5 | refresh of `/admin/jobs` | **`200`**, 202 416 bytes, no `location` header | **YES — 1 hit** |
| 6 | authenticated `GET /api/admin/jobs/active` | **`200`**, 2 bytes, `[]` | n/a |
| 7 | authenticated `GET /api/admin/jobs/past` | **`200`**, 2 bytes, `[]` | n/a |
| 8 | the same two endpoints unauthenticated | **`401`**, **`401`**, `{"error":"Unauthorized"}` | n/a |

**Every status matches State B. Every rendered admin page is the error boundary.** The voter root
`GET /` under State A also returned `200` with `data-testid="error-message"` present — which is what
identifies the cause as the empty database rather than the admin path.

### The instrument failure this run caught

Under State A the login-form-markup detector was **vacuous**. `GET /admin/login` returned `200` with
**zero `<form>` tags and zero `<input>` tags** — because the login page was itself rendering the
error boundary. Row 3's "0 hits for `id="email"`" was therefore worthless: its control was also 0,
so the search proved nothing.

Recorded rather than quietly fixed, because it is the concrete instance of this plan's own
prohibition — *"a search or observation is not reported as clean until the same instrument has been
shown to return non-zero on a control it should catch."* The detector only became load-bearing under
State B, where the control returns 1 / 1 / 1.

The error-boundary detector has its own control in the opposite direction: `data-testid="error-message"`
returns **1** on State A row 3 and **0** on State B row 3, so the State B zero is a measurement too.

---

## The temporary identity's deletion, with the leftover counts asserted

Both identities were deleted through the auth admin API and the leftovers counted, not assumed.
Counts are observed numbers returned by the service-role client.

Pre-existing baseline, taken before each creation: `auth_users_total` = **2**, `admin_jobs_total` = **0**.

| Assertion | State A identity `2fd7bb94-…3163a` | State B identity `1bf54fdb-…bad2` |
|---|--:|--:|
| `auth.users` rows with that id | **0** | **0** |
| `auth.users` rows with that email | **0** | **0** |
| `public.user_roles` rows for that user | **0** | **0** |
| `public.admin_jobs` rows authored by that email | **0** | **0** |
| `auth.users` total afterwards (baseline was 2) | **2** | **2** |
| error from any of the four counts | `null` | `null` |

`admin_jobs` is keyed by `author` (text), not by a user id — there is no `created_by` column — so the
job-row assertion is `.eq('author', <the temporary email>)`.

**Post-teardown confirmation, State B:** replaying the deleted identity's session cookie against
`GET /admin` returns **`307` → `/admin/login?errorMessage=loginFailed`**. The gate is live and the
identity is genuinely gone.

The local stack is left in the state the measurement found it, apart from the deliberate
`db:reset-with-data` seed, which is recorded here so a later reader knows the database is seeded
rather than bare.

---

## Criterion 10 / OB-2 — the generic login route is absent, proved non-vacuously

All searches use `git grep`, which reads **tracked files only** and therefore cannot match
`apps/frontend/tsconfig.tsbuildinfo` — the gitignored stale build cache that made the plain-`grep`
form of this same check return a false positive at `dbb22feba`
(`158-API-LOGIN-CALLER-MEASUREMENT.md` § "The instrument failure this run caught"). `-w` is used
instead of `\b`, because git's ERE engine does not honour `\b` and returns a false zero for any
pattern that uses it.

### The absence searches

| # | What it looks for | Command | Hits |
|--:|---|---|--:|
| S1 | the endpoint's path fragment | `git grep -nF "api/auth/login" -- apps packages tests` | **0** |
| S2a | the route map's login key, as read | `git grep -nF "UNIVERSAL_API_ROUTES.login" -- apps packages tests` | **0** |
| S2b | the route map's login key, as declared | ``git grep -nF 'login: `${API_ROOT}' -- apps packages tests`` | **0** |
| S3 | the two types the endpoint exported | `git grep -nw -e LoginParams -e LoginResult -- apps packages tests` | **0** |
| S4 | any fetch of an `/api/auth` path in the frontend | ``git grep -nE "fetch\(.*['\"`]/api/auth" -- apps/frontend/src`` | **0** |

### The positive controls — same run, same shape, pointed at the surviving sibling

| Control for | Command | Hits | Where |
|---|---|--:|---|
| S1 | `git grep -nF "api/auth/logout" -- apps packages tests` | **1** | `apps/frontend/eslint.config.mjs:54` |
| S1 widened | `git grep -nF "auth/logout" -- apps packages tests` | **9** | across 5 files |
| S2a | `git grep -nF "UNIVERSAL_API_ROUTES.logout" -- apps packages tests` | **1** | `apps/frontend/src/lib/api/base/universalDataWriter.ts:115` |
| S2b | ``git grep -nF 'logout: `${API_ROOT}' -- apps packages tests`` | **1** | `apps/frontend/src/lib/api/base/universalApiRoutes.ts:12` |
| S3 | `git grep -nw DataApiActionResult -- apps packages tests` | **99** | across the workspace |
| S4 | ``git grep -nE "fetch\(.*['\"`]/api" -- apps/frontend/src tests`` | **2** | `routes/candidate/preregister/+page.svelte:77`, `:95` |

**Every control is non-zero. The five zeros are facts about the tree, not artefacts of a broken
search.**

Route-directory shape, re-confirmed: `find apps/frontend/src/routes/api/auth -type f` returns exactly
one file, `apps/frontend/src/routes/api/auth/logout/+server.ts`.

### Two divergences from the earlier readings, stated rather than smoothed over

1. **The widened control dropped from 10 to 9.** `158-API-LOGIN-CALLER-MEASUREMENT.md` recorded 10
   hits for `auth/logout` at both `3c958cccc` and `dbb22feba`. At `5f122efd5` it is 9. The cause is
   `158-06`: `supabaseDataWriter.ts:69` now reads `ROUTE.CandAppAuthLogout` where it previously
   carried the path, and the test file's expectations moved with it. This is the search reflecting
   `158-06`'s move, not a caller disappearing.
2. **"IS consumed by the writer" is true of the *universal* writer, not the *Supabase* writer.** The
   plan's control clause says the sibling logout route "does still exist and IS consumed by the
   writer." Precisely: `/api/auth/logout` is consumed via `UNIVERSAL_API_ROUTES.logout` by
   `UniversalDataWriter.logout()` (`universalDataWriter.ts:115`). `SupabaseDataWriter._logout` now
   posts to `/api/candidate/auth/logout` instead, since `158-06`. Both routes exist and both are
   live; they are not duplicates of one another.

`/api/auth/logout` and its map key **must be left alone by this phase** — `158-API-LOGIN-CALLER-MEASUREMENT.md`
§ "The asymmetry, stated for the record" gives the reason, and this run reconfirms the key is read.

---

## What this measurement does NOT cover

Stated so a sibling plan does not read absence of a row as absence of a defect.

- **The authenticated non-admin arm.** No row creates a signed-in user without an admin role, so the
  `403 Forbidden` half of `requireVerifiedAdmin` is **unexercised here**. `158-12` needs it; this
  table does not supply it.
- **`AdminAppFactorAnalysis`.** `158-02` found it registered in `ROUTE` with two live callers and
  **no directory** (`.planning/todos/pending/2026-09-01-admin-factor-analysis-route-missing.md`). The
  nested protected route exercised in row 5 is `/admin/jobs`, which does exist. Row 5 says nothing
  about the factor-analysis route.
- **`/admin/question-info` and `/admin/argument-condensation`** — the two loads `OB-1` is about — were
  not requested. Row 5 covers `/admin/jobs`, whose `+layout.svelte` takes no `+layout.ts` of its own.
- **Concurrency and cold-module behaviour.** One sequential run per state. A defect that only appears
  under load, or only on a cold Vite SSR module, would not be visible here. This is precisely the
  residual risk the GREEN option's `cons` names, and the mitigation is criterion 11's durable spec.
- **The four job endpoints other than `active` and `past`** (`start`, `abort-all`, `single/[jobId]/abort`,
  `single/[jobId]/progress`) were not called; a POST would have created state the teardown assertion
  is written to prove absent.

---

## Reproduction

From the repository root, at `5f122efd5`:

```
yarn db:reset-with-data
yarn dev                       # one fresh server, FRONTEND_PORT=5173
# assert served-application identity (the two preflight curls above)
# create project_admin @ scope project / TEST_PROJECT_ID via the auth admin API
# POST the admin login form action, keep the cookie jar
# rows 1-8 with curl, never following redirects
# delete the identity, count the leftovers
```

Expect: `307 / 200 / 200 / 200 / 200 / 200 / 200 / 401+401`, four leftover counts of zero, and the
row-3 control returning 1 / 1 / 1 where row 3 returns 0 / 0 / 0.

---

## The operator's arm selection

_Task 2 records the operator's answer here, verbatim, with the date and the HEAD sha above._

**Answered 2026-09-02** at the `blocking-human` checkpoint (`158-10` Task 2), against the eight-row STATE B
table above, presented in full and not summarised. Decided against **HEAD
`5f122efd51dae8daa662a905eca5c77a56a33cc3`** — the sha this table was measured at.

### The operator's answer, verbatim

> **Arm selection: `green`.** Criterion 8 needs no code change. It becomes a durable regression spec,
> carried forward by criterion 11's spec (owned by 158-16) so the observation outlives the one-off curl.
> Task 3 therefore APPLIES the green arm: the scoped ROADMAP correction (one sentence, ≤ 12 changed lines,
> Phase 158 only) to the amendment written 2026-09-01, so the closing gate traces criterion 8 against a true
> statement. Record the residual risk the arm carries: it rests on one manual observation per database
> state, so an intermittent break — only under load, only on a cold Vite SSR module — would not be visible;
> criterion 11's spec running on every full suite is the mitigation.

> **OB-6 text: CORRECT IT where Task 3 records OB-6's status.** OB-6's own wording, "unauthenticated: the
> 307 and the 403", is stale at this HEAD. Write it as **the 307 and the 401**, and add the reason:
> `requireVerifiedAdmin` returns `401 Unauthorized` for a MISSING session and reserves `403 Forbidden` for
> an AUTHENTICATED NON-ADMIN — CR-01's deliberate split, landed after 157.2's observation. Make this
> correction where the disposition ledger and the ROADMAP record OB-6's status, so a later reader is not led
> into writing a criterion-11 spec that asserts 403 on the unauthenticated arm and fails on a correct tree.
> Note explicitly that the 403 arm requires an authenticated non-admin, which NO row in the baseline covers.

### What Task 3 did with it

| Consequence | Where it landed |
|---|---|
| The green arm applied | `.planning/ROADMAP.md` § Phase 158 — the 2026-09-01 amendment's closing sentence replaced; `git diff --stat` reports **1 file, 1 insertion, 1 deletion**, and `git diff -U0 \| grep -cE '^[-+]### Phase '` reports **0** |
| The residual risk recorded | `158-D10-DISPOSITIONS.md` § "OB-6 — discharged GREEN, with its residual risk named", and § "What this measurement does NOT cover" above |
| The OB-6 401 correction | `158-D10-DISPOSITIONS.md` § obligation status board (OB-6 row) and the ROADMAP sentence, both of which now say **307 and 401** |

### One attribution correction the answer settles

`158-10-PLAN.md`'s `key_links` and this artifact's flags (1) and (2) above both name **`158-15`** as the
criterion-11 spec. That is stale. The ROADMAP's plan list and `158-16-PLAN.md`'s own frontmatter
(`requirements: [D10-C11 …]`, and the `EDGE-C11-unclassified` flagged assumption) both put criterion 11's
E2E spec in **`158-16`**; `158-15` owns OB-5 deliverables 2-4 (the fail-loudly seam). The operator's answer
says `158-16` explicitly. **Read every "Consequence for `158-15`" above as a consequence for `158-16`,**
except flag (3), which genuinely addresses `158-13`. Recorded rather than silently rewritten, because the
measured text above is the record and only its addressee was wrong.
