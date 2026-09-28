---
phase: 158-routing-auth-surface-harmonisation
plan: 17
subsystem: admin server library / Supabase client factories
tags: [credentials, admin-jobs, supabase, session, rls, negative-control]
status: complete
requires:
  - '158-15 (assertValidJobId, the refusal seam)'
  - '158-16 (the admin E2E spec — the gate that authorised this change)'
  - '158-12 (requireAdminIdentity — the one authorization decision)'
provides:
  - 'createSupabaseJobClient — a client authorised as the admin who started a job, with no session state of its own'
  - 'the job-scoped credential on both long-running admin features'
  - 'negative-control ledger section G (three rows)'
affects:
  - 'apps/frontend/src/lib/api/dataProvider.ts (seam re-export + the `client` arm docstring)'
  - 'the admin LLM write path — every read and every write a job makes'
tech-stack:
  added: []
  patterns:
    - 'a named client factory per authority, sibling to anon.ts, asserted off the object handed to the library'
    - 'resolve the verified session ONCE at job start; never again mid-run'
key-files:
  created:
    - apps/frontend/src/lib/supabase/job.ts
    - apps/frontend/src/lib/supabase/job.test.ts
  modified:
    - apps/frontend/src/lib/api/dataProvider.ts
    - apps/frontend/src/lib/server/admin/features/condenseArguments.ts
    - apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts
    - apps/frontend/src/lib/server/admin/features/adminJobLifetime.test.ts
    - .planning/phases/158-routing-auth-surface-harmonisation/158-NEGATIVE-CONTROL-LEDGER.md
    - tests/tests/specs/admin/admin-access.spec.ts
decisions:
  - 'NO fourth AdapterSource arm — the existing `client` arm already means "the caller supplies the client"'
  - 'the job reads AND writes on its own client; the reads move too'
  - 'the job source carries the plain global fetch, not the request-scoped one'
metrics:
  duration: '~1h20m wall clock (≈16:05–17:25 EEST, of which ~21 min is the two full E2E gate runs and ~8 min the four database resets)'
  completed: 2026-09-02
actuals:
  tokens: 23600
  tasks: 3
  commits: 4
---

# Phase 158 Plan 17: The Admin Job's Own Credential Summary

A long-running admin job now resolves its initiating admin's verified session **once** at job start
and runs its whole multi-minute life on a client built from that session's credential — with session
persistence and automatic renewal both disabled and no storage adapter at all — instead of borrowing
the initiating HTTP request's cookie-bearing client and outliving the response it was going to write
to.

---

## What was built

| Symbol | Home | What it is |
|---|---|---|
| `createSupabaseJobClient({ accessToken })` | `apps/frontend/src/lib/supabase/job.ts` | the factory: a client carrying one admin's authority and no session state of its own; raises when handed no credential |
| the contract spec | `apps/frontend/src/lib/supabase/job.test.ts` | six cases, every claim read off the object handed to the library |
| the seam re-export | `apps/frontend/src/lib/api/dataProvider.ts` | the only legal import path for a module outside the adapter boundary |
| three round-trip cases | `apps/frontend/src/lib/server/admin/features/adminJobLifetime.test.ts` | run against both features; red half is the coupling itself |
| ledger section G | `158-NEGATIVE-CONTROL-LEDGER.md` | three rows, 190 table rows before → 226 after |

---

## The installed client package, and the option names read from it

**`@supabase/supabase-js` 2.99.3** (`node_modules/@supabase/supabase-js/package.json`). Everything
below was READ from the installed package in this tree, not recalled:

| Option | Where read | What it says |
|---|---|---|
| `auth.persistSession` | `dist/index.d.mts` | *"Whether to persist a logged-in session to storage. Defaults to true."* |
| `auth.autoRefreshToken` | `dist/index.d.mts` | *"Automatically refreshes the token for logged-in users. Defaults to true."* |
| `global.headers` | `dist/index.d.mts` | *"Optional headers for initializing the client."* |
| `accessToken` | `dist/index.d.mts` | the third-party-auth callback. **Not used** — its own doc says *"When set, the `auth` namespace of the Supabase client cannot be used"*, which would make the two options above unassertable, and the credential here is Supabase-issued rather than third-party. |

**Why the header is what decides, measured rather than assumed.** In `dist/index.mjs` the client
sets `this.headers = settings.global.headers` and hands that record to its PostgREST client as
`headers`. Its own transport wrapper then reads:

```js
if (!headers.has("apikey")) headers.set("apikey", supabaseKey);
if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${accessToken}`);
```

The `if (!headers.has(...))` is the load-bearing clause: the token supplied on `global.headers` is
already present, so the client's own session lookup — which with `persistSession: false` would fall
back to the anon key — can never displace it. The same file passes
`hasCustomAuthorizationHeader: Object.keys(this.headers).some(k => k.toLowerCase() === "authorization")`
into the auth client, so the library recognises this shape explicitly rather than tolerating it.

---

## The arm decision, and its reason

**No fourth `AdapterSource` arm was added. The existing `client` arm is used.**

The union's own docstring argues at length that its arms are exhaustive and `resolveAdapterConfig`
**throws** rather than falling through, so an arm added without a matching branch there is the exact
failure that throw exists to prevent. Research question **O4** asked whether a job fits the union at
all, on the grounds that a job's lifetime differs from all three arms'.

It fits, and the lifetime objection dissolves on reading the arms: **they name where a client came
from, not how long it lives.** The `client` arm's contract is "the caller holds a finished client and
names it", which is exactly what a job does. A `job` arm would have resolved through
`{ ...locales, fetch: source.fetch, client: source.client }` — a copy of the `client` branch, byte
for byte — buying no behaviour and adding one more opportunity to land an arm without its branch.
What IS specific to the job is the client's own lifetime, and that argument is written where the
client is built (`job.ts`) rather than in a union that has no lifetime semantics to express it.

The `client` arm's docstring was extended in the same commit to name its second caller, so the union
still enumerates its callers rather than leaving one undocumented.

---

## The read-path decision, and its reason

**The reads moved onto the job client too.**

Both features' `@param args.source` documentation asserts that the whole run reads and writes as one
identity. Leaving `loadElectionData` on the request's client would have made that sentence false the
moment the writer moved, and would have left the run's four reads exposed to precisely the mid-run
expiry the change removes from its writes. `loadElectionData` takes an `AdapterSource` and needed no
edit; it is handed `jobSource` instead of `source`. Its own docstring — *"the reads below run on the
same credentials the caller writes with"* — stays true, and is now true of a better credential.

**The transport decision, recorded with it.** The job source carries `globalThis.fetch`, not
`source.fetch`. `event.fetch` is scoped to a response the job outlives, and the whole point of the
change is that nothing the job does depends on that response still being there. Neither
`SupabaseAdminWriter` nor `SupabaseDataProvider` calls `this.fetch` on this path — it is inert here —
but the arm requires a value and the honest value is the one with no request in it.

---

## The resolution and the construction, quoted from both features

Both files carry these lines identically, differing only where the feature's own name appears.
`condenseArguments.ts`:

```ts
  assertValidJobId(jobId);

  // THIS JOB'S OWN CREDENTIAL, RESOLVED ONCE AND FIXED FOR THE WHOLE RUN — after the guard above and ahead of everything else, so an invalid start still does no credential work. …
  const { session } = await source.locals.safeGetSession();

  // The job's own source, and it names a CLIENT rather than the request's `locals`. …
  const jobSource: AdapterSource = {
    fetch: globalThis.fetch,
    client: createSupabaseJobClient({ accessToken: session?.access_token })
  };

  // Create controller immediately - it will be initialized with pipeline later
  const controller = new PipelineController(jobId);

  // This job's own writer, over this job's own credential, constructed here and held for the whole run …
  const adminWriter = createAdminWriter(jobSource);
```

`generateQuestionInfo.ts` is byte-identical from `assertValidJobId(jobId);` through
`const adminWriter = createAdminWriter(jobSource);`.

**The ordering is the property, and it composes with 158-15's guard rather than displacing it.**
`assertValidJobId` is still the first statement, so an invalid start does no credential work — and
that is asserted rather than argued: the six guard cases assert `mocks.createSupabaseJobClient` was
never called, `mocks.createAdminWriter` was never called, no controller was constructed and no data
load was attempted, with a positive control proving each of those observation points can record.

---

## The replaced markers

Each construction site carried eight lines of `// reason: DEFERRED —` naming the coupling, two
failure modes and the remedy. They are **replaced, not deleted**. Both failure modes stay named,
each now paired with how it is closed, and the boundary is stated in one sentence at the site:

> `reason:` the writer used to be built from the initiating request's client, which carries an
> adapter onto that request's jar, while the action awaits this call for the job's whole
> multi-minute duration. Two failure modes followed from that, and BOTH ARE NOW CLOSED by the client
> above rather than by care taken here — they stay named because a reader arriving after the next
> incident needs to know what was considered, not only what was chosen:
>   1. A refreshed session emitted as a `Set-Cookie` on a response that is only generated when the
>      job finishes reaches nobody once the platform gateway has timed the connection out (Render's
>      default is 100s; these jobs run for minutes), and the initiating admin's session silently
>      regresses to the tokens it held before. CLOSED: the job's client renews nothing on its own and
>      has no adapter to write through, so no such emission is ever attempted.
>   2. Once the response HAS been generated, `@sveltejs/kit` replaces `event.cookies.set` with a
>      thrower ("Cannot use 'cookies.set(...)' after the response has been generated"), so any path
>      outliving its response — a late `insertJobResult` on an aborted job, or a future move to
>      fire-and-forget — raised inside the Supabase client's own renewal rather than at an obvious
>      call site. CLOSED: there is no such path left for it to raise on.
> What this does NOT settle is what a job should do when the initiating admin's session expires
> partway through the run: the crash mode is gone, the authority question is open.

Neither comment cites a planning path or a plan number.

---

## The question this does NOT settle

Quoted from its own record — `.planning/phases/157.2-per-request-adapter-instancing/deferred-items.md`,
§ *"OPEN — a long-running admin job's initiating admin can have their token expire mid-run"*:

> This is a *proposal*, not a ruling — it does not answer B4's authority question about what a job
> should do when the initiating admin's session expires; it removes the crash mode while leaving
> that question open.

The site comments say the same thing in their own words ("the crash mode is gone, the authority
question is open"), so the record and the code do not drift. The entry's own list of shapes an answer
could take — background execution, a service-role writer for job records, a pre-flight token-lifetime
check, refusing to start a job whose token expires too soon, making the action return before the job
completes — remains a list of shapes and not a recommendation.

**What this plan DID discharge of that entry**, so a later reader can see the boundary: the entry's
named remedy ("resolve the verified session ONCE at job start and build the job's own client from
its tokens with `persistSession: false` and `autoRefreshToken: false`") is implemented, and its
stated blocker ("it needs an integration gate first — which is why Phase 158 criterion 11 is a
prerequisite for it") is satisfied by `158-16`'s spec, which was run on both sides of the change.
**I did not edit that file** — it is not in this plan's `files_modified` and belongs to a different
phase's directory. Its status line still reads "unchanged and unsolved by design"; `158-09` should
settle it.

---

## The refresh-path prohibition — and why the plan's grep for it cannot return 0

**The prohibition holds. The plan's literal command cannot show it.**

The plan's verify is `grep -cE 'refreshSession|refresh_token' -r apps/frontend/src/lib/server/admin
apps/frontend/src/routes/admin`, failing when any printed count exceeds 0. Measured at this plan's
START, before any of its commits, it printed **two non-zero counts**:

```
apps/frontend/src/routes/admin/+layout.server.ts:1
apps/frontend/src/routes/admin/layout.server.test.ts:3
```

All four hits are PROSE and a test fixture's field list, landed by `158-13` — the plan that REMOVED
the refresh token from that load and wrote a docstring explaining what it removed, plus a spec whose
`FORBIDDEN_MEMBERS` array names the credential it forbids. **A guard that names what it forbids
cannot survive a substring grep for that name.** This is the fourth or fifth time this phase's
record has been fooled by `grep -c` on a prose pattern.

The corrected measurements, both taken at this plan's close:

| Measurement | Command | Result |
|---|---|---|
| an actual refresh call anywhere on the admin surface | `git grep -nE '\.refreshSession\(\|refreshSession\(' -- apps/frontend/src/lib/server/admin apps/frontend/src/routes/admin` | **no hits** (exit 1) |
| the credential name in NON-comment, NON-test lines | per-file `grep -nE 'refreshSession\|refresh_token'` piped through `grep -vE '^[0-9]+: *(\*\|//\|/\*)'`, tests excluded | **0 lines** |
| hits this plan introduced | the same count on `condenseArguments.ts` at `f6ff905ec` vs at HEAD | **0 → 0** |

The single non-test hit is a docstring line beginning ` * This load used to return …`.

---

## The mechanism round trip

Collected case count in `adminJobLifetime.test.ts`: **11 before this plan, 17 after.** Three new
cases, each run against both features. No pre-existing case was removed.

The red half is the **real pre-change construction**, restored byte-for-byte from `f6ff905ec` with
`git show f6ff905ec:<path> > <path>` and put back with `git checkout HEAD -- <path>` (`git diff
--stat HEAD` for both paths printed nothing afterwards). The assertions are byte-identical in both
halves; what differs is which source the job hands its writer.

| | RED (pre-change construction) | GREEN (this plan's change) |
|---|---|---|
| Run | 17 tests, **10 failed** / 7 passed | 17 tests, **17 passed** |
| the credential case | `AssertionError: expected [] to deeply equal [ 'A' ]` — `- [ "A", ]` / `+ []`: the pre-change job never asked the verification path at all | passes |
| the session-store case | `AssertionError: expected [ { jobId: 'job-A', …(1) } ] to deeply equal [ { jobId: 'job-A', …(1) } ]` — `- "carriesJarAdapter": false` / `+ "carriesJarAdapter": true` | passes |
| the pre-existing isolation case, incidentally | `- "observedTag": "job:session-token-of-B"` / `+ "observedTag": "request:B"` | passes |

`grep -cE 'setTimeout|setInterval|vi\.useFakeTimers|Promise\.race'` on the file prints **0**: no
ordering construct entered a file whose own docstring records that it contains none.

**One thing changed that the ledger's Section F closing note said had not changed before, and it is
named here rather than left for a reader to notice.** Three PRE-EXISTING expectations changed VALUE:
`observedTag` went from a bare admin tag (`'A'`) to a credential name (`'job:session-token-of-A'`),
and each gained `carriesJarAdapter`. The reason is that the thing being attributed changed — the
apparatus now reports WHICH CREDENTIAL a write executed under rather than which admin's fetch was
tagged. The isolation property those cases assert is unchanged, and still fails if crossed.

---

## The end-to-end gate, before and after

Same command, same prerequisites, on both sides:

```
npx playwright test -c ./tests/playwright.config.ts ./tests --project=admin-access --grep-invert @probe
```

`--reporter=list` was appended to both runs and nothing else; it changes what is printed, not what
is selected.

| | BEFORE | AFTER |
|---|---|---|
| Tree | `56a5608f4` — this plan's HEAD, before any of its commits | this plan's work through `6888a531c` plus the task-3 spec |
| Prerequisite | plain `yarn db:reset`, one warm dev server on `:5173` | the same, re-established |
| Result | **130 passed (10.3m)**, exit 0 | **130 passed (10.6m)**, exit 0 |
| `admin-access` itself | ✓ 1.6s | ✓ 1.7s |
| its teardown | ✓ | ✓ |

`--project=admin-access` collects 130 tests rather than one because the project takes a dependency
edge on the tail of the perm serial chain; that cost is recorded as accepted in
`158-ADMIN-E2E-SCHEDULING.md`.

**A false start, recorded so the BEFORE number is not misread.** The BEFORE run was first attempted
after `yarn db:reset-with-data` — the state the environment note described — and was killed at two
failures (`eperm07-term-trigger`, `voter-journey`). That is the known default-template contamination
the 157.2 deferred-items file describes, in which the voter app sees two elections. The recorded
BEFORE is the re-run after a plain `yarn db:reset`, which is what this plan's own precondition asks
for. **The environment note and the plan's precondition disagreed, and the precondition was right.**

---

## The served-application control (a ledger row the plan did not ask for)

A green end-to-end run against a **stale** Vite SSR module graph is indistinguishable from a green
one against a live graph — so the AFTER gate above, on its own, does not prove the served
application executes the new module. Row **G3** is that proof: an unconditional raise planted in
`createSupabaseJobClient` reddened the admin spec by name —

```
Error: exactly one admin_jobs row, authored by this run's admin, recording the failure it caused …
- Array [ Object { "author": "test-e2e-admin@…", "endStatus": "failed", … } ]
+ Array []
```

— and the dev server's own log carried the plant, immediately after its HMR line:

```
[vite] (ssr) page reload src/lib/supabase/job.ts
[Admin App argument condensation] PLANT-158-17: the served application reached createSupabaseJobClient.
```

Un-planted and re-run: 1 passed, with the row present —
`1 | test-e2e-admin@test.openvaa.local | failed`.

**Two ways the fast `--no-deps` loop produces a confident wrong answer, both measured here and both
recorded in section G.** They are not covered by `158-ADMIN-E2E-SCHEDULING.md`, which documents the
loop as a debugging affordance:

1. **The first attempt at G3 was VACUOUS.** With the plant in place but `admin_jobs` not emptied
   first, the spec **passed** — the read-back filters on `author` and `election_id` and matched the
   row the previous loop run had left. The envelope assertion above it cannot separate the cases
   either: "raised before writing" and "wrote its row then raised" both produce
   `{transport: 200, type: 'failure', status: 500, generic: true}`. Empty `admin_jobs` between runs
   or the loop's job-write half means nothing.
2. **A red run poisons the in-memory job store.** After the planted run, three consecutive UNPLANTED
   runs failed identically, and the dev server's log gave the real reason: `Error with
   UniversalAdapter.fetch when parsing response from '/api/admin/jobs/start': 409`. The action
   registers its job in an in-memory store before calling the feature; the planted run raised before
   the job recorder existed, so that job stayed "running" forever and every later start conflicted.
   The residue lives in the dev-server process. **A `--no-deps` loop that has once gone red needs a
   server restart before its next green means anything** — that is what the 409 chain was, and for
   several minutes it looked exactly like a regression in this plan's change.

---

## Deviations from Plan

### **1. [Rule 3 — Blocking] `yarn lint:check` was RED at this plan's HEAD, from a prior plan's file**

- **Found during:** Task 1 verification.
- **Issue:** The standing comment-hygiene guard (phase 152, REVIEW-HYG-01), chained into
  `yarn lint:check`, reported **60 rule-2 violations at HEAD `56a5608f4`** — every one of them in
  `tests/tests/specs/admin/admin-access.spec.ts`, every one landed by `158-16` at `23f0255d7`. Both
  Task 1's and Task 2's acceptance criteria require `yarn lint:check` to exit 0, and no amount of
  work inside this plan's own `files_modified` could have made that true.
- **Fix:** The wrapped comment paragraphs joined into single lines, matching the shape the phase-152
  sweep left the rest of the tree in. **Comment lines only** — `git diff` filtered to non-comment
  lines is empty, so no assertion, locator, status or identifier moved. Guard re-measured after:
  1626 files scanned, **0 violations**, exit 0.
- **Files modified:** `tests/tests/specs/admin/admin-access.spec.ts` (outside this plan's
  `files_modified`, deliberately, and committed separately so the diff stays legible).
- **Commit:** `c6f8bd080`.
- **Note for the phase gate:** `158-16`'s spec was committed against a red standing guard. That is a
  process observation about the wave, not about the spec's quality.

### **2. [Rule 3 — Blocking] the job-lifetime spec's apparatus had to move with the signature**

- **Found during:** Task 2 typecheck (2 errors, both in `adminJobLifetime.test.ts`).
- **Issue:** Both features' `source` parameter changed shape (it must now expose the verified-session
  helper), so the spec's `taggedSource` no longer type-checked. Task 2's acceptance requires
  `yarn typecheck` to exit 0, so the apparatus had to land in Task 2 rather than Task 3.
- **Fix:** `taggedSource` now returns the request context both features take, `credentialOf` became
  the one reader, and `$lib/api/dataProvider`'s `createSupabaseJobClient` is faked. The three NEW
  cases still landed in Task 3, so the round trip's red half was observed exactly as planned.
- **Commit:** `6888a531c` (apparatus), `290a7e4d0` (the new cases).

### **3. [reported, not leaned on] the plan's refresh-prohibition grep is unsatisfiable at HEAD**

See the section above. The prohibition holds; the instrument cannot show it. Corrected measurements
are recorded there rather than a green claim against a command that prints non-zero.

---

## Verification

| # | Claim | Result |
|---|---|---|
| 1 | job-client contract spec asserts both options, the credential's placement, no adapter, and the raise | `vitest run src/lib/supabase/job.test.ts` — **6 passed**, exit 0 (RED beforehand: 5 failed / 1 passed against a defaults-built client) |
| 2 | comment-filtered grep for an adapter in `job.ts` returns 0 | **0** — and the RAW, unfiltered `grep -cE 'cookies\|getAll\|setAll' job.ts` is also **0**, which is strictly stronger |
| 3 | the seam re-export exists | `grep -c 'createSupabaseJobClient' dataProvider.ts` → **3** |
| 4 | neither feature builds its writer from the request's source | `grep -cE 'createAdminWriter\(source\)'` → **0** for both; `grep -cE 'createSupabaseJobClient\|jobClient'` → **3** for both |
| 5 | the refresh-path prohibition | holds — see the corrected measurements above; the plan's literal grep is prose-fooled |
| 6 | the round trip's halves, and no ordering construct | 10 failed → 17 passed; ordering-construct grep **0** |
| 7 | the E2E gate before and after | **130 passed** both sides, exit 0 both sides |
| 8 | `yarn typecheck`, frontend `test:unit`, `yarn lint:check` | **0 errors / 0 warnings**; **81 files, 1546 tests passed** (1540 at the 158-15 baseline, +6 from `job.test.ts`); **exit 0** |
| 9 | `git status --porcelain apps packages tests scripts` at close | *(empty)* |

Exit codes were read from `$?` on a redirected file, never through a `tail` pipe.

---

## Ledger

Section **G** appended; sections A–F untouched. Table rows **190 → 226**.

| Row | Establishes | Red half |
|---|---|---|
| G1 | every writer call executes under the token the job's own session lookup returned | the real pre-change construction |
| G2 | no write to the request's session store is attempted on the job's path | the same restoration, the other field |
| G3 | the SERVED application executes the new module, and the admin spec sees it | an unconditional raise in the factory |

---

## Dispositions ledger

`158-D10-DISPOSITIONS.md` is **not** in this plan's `files_modified`, so per the wave's own
instruction I left it alone and say so here. Its `EDGE-OB5-unclassified` row is untouched by me;
`158-09` is the gate and will trace it. The three rows it assigns to `158-17` — `EDGE-C12-ordering`,
`EDGE-C12-concurrency-a` and `EDGE-C12-concurrency-b` — are all discharged by the work above:
ordering by the six `assertValidJobId` guard cases plus the new "resolved ONCE" case, and both
concurrency edges by the two pre-existing overlapping-job cases now reading credentials rather than
tags, plus the `carriesJarAdapter` case.

---

## What I did to the environment, and how I leave it

- **Database:** reset four times. Left at plain `yarn db:reset` (migrations + `seed.sql`, **no**
  dataset) — the state the AFTER gate ran on, whose own teardowns removed the admin identity and the
  `admin_jobs` rows it caused. It is **not** at the 752-row `db:reset-with-data` state the
  environment note described; that state contaminates the E2E suite, which is what the false start
  above measured.
- **Dev server:** the one that was on `:5173` when I started had to be stopped — a red `--no-deps`
  run had left a job stuck in its in-memory store (see above), which no file edit can clear. I
  started a replacement, warmed it, and ran the AFTER gate against it. **It has since died, and that
  is now a measurement rather than an expectation:** the AFTER gate finished at 17:12:14 and the
  server exited at 17:32:05 with code **129 (SIGHUP)** — reaped twenty minutes later, when the
  background task that owned it ended. Both gate runs therefore ran against a live, warm server and no
  recorded result is affected. **Nothing is listening on `:5173` now**, and no stray `vite` or
  `concurrently` process remains — so start your own. **Supabase is still up** (REST 200, Studio 307):
  `concurrently`'s SIGTERM took only the frontend and the shared-package watcher, not the Docker stack.
  The Vite server on `:5174` is a different project of the user's and was not touched.
- **Working tree:** clean. `.planning/milestone.lock` remains untracked, as it was before.
- **`PLAYWRIGHT_BANK_AUTH`-gated specs:** still unrun. Nothing here closes that `WINDOWS.md` gap.

---

## Commits

| Commit | What |
|---|---|
| `c6f8bd080` | `style(158-17)` — join the admin spec's wrapped comment paragraphs (deviation 1) |
| `f6ff905ec` | `feat(158-17)` — the job-scoped client, its contract spec, the seam re-export, the arm decision |
| `6888a531c` | `feat(158-17)` — both features resolve once and build their own client; markers replaced |
| `290a7e4d0` | `test(158-17)` — the round trip, the ledger section, the gate on both sides |

---

## Self-Check: PASSED

Every file this summary claims exists on disk (`job.ts`, `job.test.ts`, this summary). Every commit
hash it names resolves in `git log --all` (`c6f8bd080`, `f6ff905ec`, `6888a531c`, `290a7e4d0`).
`git status --porcelain apps packages tests scripts` prints nothing.
