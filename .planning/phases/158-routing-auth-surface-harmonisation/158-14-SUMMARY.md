---
phase: 158-routing-auth-surface-harmonisation
plan: 14
subsystem: auth
tags: [sveltekit, universal-load, server-load, cookies, concurrency, ob-1, vitest]

requires:
  - phase: 158-06
    provides: 'the candidate auth endpoint move, and the settled route/hook surface these two subtrees sit under'
  - phase: 158-13
    provides: '`scripts/assert-no-session-in-loads.mjs` and the subtree server-load shape these two new loads are scanned by; `admin/layout.server.test.ts`, the sibling spec this one does not clobber'
  - phase: 158-11
    provides: '`APP_GATES` / `appGateHandle` — the 307 that bounces an unauthenticated `/admin/**` before any load runs, which is why E6 could not drive the real admin route'
  - phase: 157.2
    provides: '`routes/(voters)/(located)/+layout.server.ts` and `+layout.ts` — THE ANALOG both halves of this plan were copied from, and the plan that was forbidden from applying it here'
provides:
  - 'Two additive `+layout.server.ts` files, byte-identical, returning the filtered Supabase cookie array for each admin feature subtree'
  - 'Both admin feature universal loads rebuilt from their OWN data — no `await parent()` for the client — with the streaming read intact'
  - '`apps/frontend/src/routes/admin/(protected)/layout.server.test.ts` — 15 cases driving BOTH loads, every one carrying its positive control inside the same expectation'
  - 'Section E of the negative-control ledger: six controls, including E6, the first measurement in this phase of the load-overlap claim itself'
  - "OB-1 discharged with option (i) / (a+); the obligation's status board can be closed"
affects: [158-16, 158-17, admin-app, root-universal-load]

actuals:
  tokens: 6941
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - 'A byte-identical pair is kept identical by NAMING NEITHER SIBLING: the docstring refers to "this subtree", the directory supplies the feature, and a plain `diff` (not a normalising one) is then the invariant'
    - 'A spec injects the constant its subject derives from, via `vi.mock` over the seam, when the ambient value is environment-dependent — turning an environment-fragile assertion into a strictly stronger derivation test'
    - 'A concurrency claim is measured with two live arms in ONE run on ONE server, differing only in the line under test, rather than inferred from a rendering check'

key-files:
  created:
    - apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.server.ts
    - apps/frontend/src/routes/admin/(protected)/question-info/+layout.server.ts
    - apps/frontend/src/routes/admin/(protected)/layout.server.test.ts
  modified:
    - apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.ts
    - apps/frontend/src/routes/admin/(protected)/question-info/+layout.ts
    - apps/frontend/src/routes/+layout.ts
    - .planning/phases/158-routing-auth-surface-harmonisation/158-NEGATIVE-CONTROL-LEDGER.md

key-decisions:
  - 'OB-1 discharged with option (i) — apply (a+) — not (ii). The analog copied is `routes/(voters)/(located)/+layout.server.ts` and its `+layout.ts` partner.'
  - "The two pairs are LITERALLY byte-identical, not identical-up-to-a-name. The plan's prohibition asked for a normalising diff; naming neither feature in the docstring makes a plain `diff` exit 0, which is strictly stronger and needs no normaliser to be trusted. Cost: the docstring no longer says which feature — the directory does."
  - "The spec INJECTS `SUPABASE_COOKIE_PREFIX` through `vi.mock('$lib/api/dataProvider')`. Measured: the real constant resolves to the `'sb-'` fallback under vitest, against which the decoy legitimately matches, so a spec read against the ambient value would pass in production and fail here."
  - 'No auth user and no `project_admin` row were written to the developer database, and the running `:5173` server was not touched. The consequence is stated as a limit rather than papered over: E6 measures the framework mechanism, not the admin route end to end.'
  - "The stale sentence in `routes/+layout.ts` was corrected in place rather than deferred, because this change falsified it. It is outside the plan's `files_modified` and is recorded below as a deviation."

patterns-established:
  - 'Vacuity control and literal control as a PAIR: two stub shapes that fail DIFFERENT subsets of the same spec, so neither is a proxy for the other'
  - "A comment-filtering grep is itself controlled before its zero is believed — `\\s` is not POSIX BRE and `^\\s*[*/]` is not portable by assumption"

requirements-completed: [D10-C08, D10-C11]

coverage:
  - id: D1
    description: 'Each admin feature subtree has its own `+layout.server.ts` returning the filtered Supabase cookie array, derived from the shared constant and never from a spelled literal'
    requirement: 'D10-C08'
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/admin/(protected)/layout.server.test.ts — 15/15"
        status: pass
      - kind: other
        ref: "grep -v '^\\s*[*/]' <both loads> | grep -cE \"startsWith\\('sb|startsWith\\(\\\"sb\" -> 0 (control: 1)"
        status: pass
    human_judgment: false
  - id: D2
    description: 'Neither new server load puts a browser-script-inaccessible cookie into a serialised payload, proven in the same expectation as a positive control that the array is not empty'
    requirement: 'D10-C08'
    verification:
      - kind: unit
        ref: "layout.server.test.ts#forwards exactly the auth-storage cookie, with the four httpOnly values absent and the sentinel present in one expectation"
        status: pass
      - kind: other
        ref: 'yarn lint:check -> assert-no-session-in-loads corpus 10 -> 12, 0 violations'
        status: pass
    human_judgment: false
  - id: D3
    description: "Both admin feature universal loads build their client from their own data, with no `await parent()`, and keep the question-data read unawaited"
    requirement: 'D10-C11'
    verification:
      - kind: other
        ref: "comment-filtered grep: 'await parent()' -> 0 (pre-change control on HEAD~2 -> 1); 'await .*getQuestionData' -> 0 (control -> 1)"
        status: pass
      - kind: other
        ref: 'diff over both file pairs -> exit 0; git diff --stat over the parent protected load and eslint.config.mjs -> empty'
        status: pass
    human_judgment: false
  - id: D4
    description: 'The de-serialisation actually produces overlap — a nested load without `await parent()` starts before its blocking ancestor finishes'
    requirement: 'D10-C11'
    verification:
      - kind: integration
        ref: '158-NEGATIVE-CONTROL-LEDGER.md § Section E, control E6 — two live arms, one server, +403 ms vs +0 ms, 401 ms measured overlap'
        status: pass
    human_judgment: true
    rationale: 'E6 measures the FRAMEWORK mechanism on purpose-built probe routes, not the `/admin/**` chain, because `appGateHandle` bounces an unauthenticated caller with 307 before any load runs and an authenticated admin would have required writing an auth user into the developer database. The composition of "the admin loads have this shape" and "this shape overlaps" is an inference; a human should route the end-to-end observation to 158-16.'

duration: 35min
completed: 2026-09-02
status: complete
---

# Phase 158 Plan 14: OB-1 — the two admin feature loads run in parallel again Summary

**Both admin feature subtrees now carry their own filtered cookie array and rebuild their Supabase client from it instead of waiting on the root load's four round-trips — and the overlap that unblocking is supposed to buy was measured on a live server rather than inferred from a page that renders either way.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 2/2
- **Commits:** 4

## OB-1's discharge

**Option (i) — apply (a+).** Not (ii), not partially.

The analog copied is **`apps/frontend/src/routes/(voters)/(located)/+layout.server.ts`** and its partner **`apps/frontend/src/routes/(voters)/(located)/+layout.ts`** — the one load 157.2 was allowed to treat, whose `+layout.server.ts` carries the operator's accepted cost in its own docstring and whose `+layout.ts` carries the "do not fix it by awaiting" comment this plan preserved.

The `OB-1` status board can be closed. The two rows that read *"blocked"* in its table — `routes/admin/(protected)/argument-condensation/+layout.ts` and `routes/admin/(protected)/question-info/+layout.ts` — are treated.

## The two new server loads, as landed

Both files are **byte-identical**; this is one of them, verbatim below the docstring:

```ts
import { SUPABASE_COOKIE_PREFIX } from '$lib/api/dataProvider';
import type { UniversalCookie } from '$lib/api/dataProvider';

export async function load({ cookies }) {
  // ⚠ THE FILTER BELOW IS A DATA-PROTECTION BOUNDARY, NOT A TIDINESS MEASURE, … `requestCookies` is a LOCAL and never a return value; only `supabaseCookies` leaves this function. The prefix is imported and NEVER spelled: …
  const requestCookies = cookies.getAll();
  const supabaseCookies: Array<UniversalCookie> = requestCookies
    .filter(({ name }) => name.startsWith(SUPABASE_COOKIE_PREFIX))
    .map(({ name, value }) => ({ name, value }));

  return { supabaseCookies };
}
```

The universal-load construction, quoted from `argument-condensation/+layout.ts` (its sibling is byte-identical):

```ts
const supabaseClient = createSupabaseUniversalClient({ fetch, cookies: data.supabaseCookies });
const dataProvider = createDataProvider({ fetch, client: supabaseClient });
```

`data`, not `await parent()`. And the read, still unawaited:

```ts
return {
  questionData: dataProvider
    .getQuestionData({
      locale: lang
    })
    .catch((e) => e)
};
```

## The spec's primary expectation, quoted

Absences and positive control in **one** expectation, which is the whole point — an absence-only assertion passes trivially against the empty array a broken filter produces:

```ts
const { supabaseCookies } = await load(eventWithJar([...httpOnlyJarEntries, SENTINEL, DECOY]));

expect(report(supabaseCookies)).toEqual({
  leaked: [],
  forwarded: [{ name: STORAGE_KEY, value: 'the-session-blob' }]
});
```

`leaked` is the subset of the four `httpOnly` cookies' values found by substring in `JSON.stringify(supabaseCookies)`; `forwarded` is the array itself. Against `supabaseCookies: []` the `leaked` half passes and the `forwarded` half fails — **measured**, not argued (control E1). `toEqual` is exact on keys, so a forwarded `path` or `httpOnly` fails here too, which is the "name and value and nothing else" clause.

The four forbidden names are taken from `COOKIE` in `$lib/cookies`, the one registry that declares them, and the spec fails if a fifth is registered without the fixture growing.

**15 cases, 15 passed.**

## The numbers the plan asked for

| Measurement | Result | Its control |
|---|---|---|
| Comment-filtered grep for a spelled cookie prefix, both server loads | **0** | A copy with `startsWith('sb-')` scores **1** (E5) |
| Comment-filtered grep for `await parent()`, both universal loads | **0** | `HEAD~2`'s copy of the same file scores **1** (E4) |
| Comment-filtered grep for an awaited `getQuestionData`, universal load | **0** | An awaited form scores **1** |
| `grep -c "lib/supabase"` per new server load | **0** and **0** | A fixture containing the path scores **1** |
| `diff` between the two **server** loads | **exit 0** | — |
| `diff` between the two **universal** loads | **exit 0** | Before this plan the same command scored **exit 1** (see corrections) |
| `git diff --stat -- 'admin/(protected)/+layout.ts'` | **empty** | — |
| `git diff --stat -- apps/frontend/eslint.config.mjs` | **empty** | — |
| `yarn typecheck --force` | **exit 0**, `svelte-check found 0 errors and 0 warnings` | — |
| `yarn lint:check` | **exit 0**, all 15 chain links | — |
| `yarn workspace @openvaa/frontend test:unit` | **79 files, 1485 tests, all passing** | 158-13 left it at 78 / 1470; the delta is this plan's one file and 15 cases |
| `assert-no-session-in-loads` corpus | **10 → 12**, 0 violations | The two new loads are INSIDE 158-13's guard, not beside it |

The comment filter itself was controlled before any of its zeros were believed: `grep -v "^\s*[*/]"` over a fixture with `await parent()` on an indented `//` line, a docstring ` * ` line and a code line returns **3** unfiltered and **1** filtered (E3). `\s` is not POSIX BRE and this platform's grep honouring it was a fact to check, not to assume.

## The concurrency claim, measured

**A page renders whether its loads overlap or not**, so nothing about the rendered admin page could have proved this plan did anything. The unmeasured link was never our code — it was the framework: *does a nested universal load that omits `await parent()` genuinely start before its blocking ancestor finishes, in this SvelteKit version?* Every argument in `OB-1` rests on that and nobody in this phase had watched it.

Two arms, built identical except for the one line under test, both under a 400 ms blocking ancestor, driven twice each against **one** one-off dev server on `FRONTEND_PORT=5273`:

| Arm | Child work starts, relative to the blocker's start | Reading |
|---|---:|---|
| `await parent()` | **+403 ms**, **+402 ms** | Begins at the blocker's END, to the millisecond. **Serialised.** |
| own `+layout.server.ts` | **+0 ms**, **+0 ms** | Begins at the blocker's START, finishes 401 ms before it. **Overlapping.** |

Both arms *enter* at +0/+1 ms — SvelteKit starts every load concurrently in both shapes, so an entry timestamp would have shown no difference and would have been the wrong instrument. The arm that moves is where the work starts. The parallel arm also logged `"got":"present"` at that instant: it already held its own server load's return, which is the mechanism rather than a side effect of it.

Verbatim timestamps: `158-NEGATIVE-CONTROL-LEDGER.md` § Section E, control **E6**. The probe directory was deleted; port 5273 was released; the user's `:5173` server and the database were never touched.

### ⚠ What was NOT measured, stated plainly

**E6 measures the framework mechanism on purpose-built routes, not the `/admin/**` chain end to end.** The real admin route could not be driven: `appGateHandle` bounces an unauthenticated caller with **307 before any load runs** (158-11), so an authenticated admin session is required, and creating one means writing an auth user and a `project_admin` row into the developer's database — which this plan declined to do rather than mutate the user's state for a measurement.

So the admin half rests on a **composition of two separately measured facts**: E4 and the comment-filtered greps establish that both admin feature loads have the parallel arm's shape (`await parent()` **0**, against **1** before the change), and E6 establishes that that shape overlaps. **The composition is an inference, not an observation.** The observation belongs with criterion 11's admin E2E spec in **`158-16`**, which will already hold an authenticated admin session on the cold-entry path where the serialisation bites.

**No latency improvement on the admin route is claimed here.** The plan did not ask for one, and none was measured.

## The rendered-payload half of OB-1

`OB-1` asks for the `httpOnly` prohibition to be discharged *by observation* on a rendered SSR payload, with an `sb-`-prefixed sentinel as the positive control. **That half is owned by the admin end-to-end spec (`158-16`, criterion 11), not duplicated here** — the plan says so explicitly, on the ground that the E2E spec is already loading an authenticated admin page while this plan owns the unit half. This plan's contribution to that obligation is the unit half, above, plus the fact that both new loads now sit inside `scripts/assert-no-session-in-loads.mjs`'s corpus.

## Deviations from Plan

### Corrections to the plan's stated premises

**1. The two universal loads were NOT byte-identical before this plan.** The plan's `must_haves.truths` says they "were byte-identical before this plan". Measured at `HEAD~2`: `diff` exits **1**, on one docstring line — `Load the data for a argument condensation.` versus `Load the data for question info generation.` (the first also carries a grammar error). The plan is internally inconsistent about this too: its verify block wants a **raw** `diff` to exit 0 while its prohibitions ask for a **normalising** diff. Resolved by making the pairs *literally* identical — the docstring names neither feature, since the directory does — so the raw `diff` exits 0 and no normaliser has to be trusted. Cost recorded: the docstring no longer names its feature.

**2. `grep -c "lib/supabase"` is a substring match over the whole file, comments included.** The first draft of the server load explained the seam by naming the banned path in prose, which scored **1** against an acceptance criterion that demands **0**. Both analogs score 0, so the precedent is clear; the sentence was reworded to describe the ban without spelling the path, and the exact path with its measured ESLint message remains one hop away in `dataProvider.ts`'s own comment. This is instrument trap #3 from the brief, hit live.

**3. `SUPABASE_COOKIE_PREFIX` is `'sb-'` under vitest.** Measured on 2026-09-02: `$env/dynamic/public` supplies no `PUBLIC_SUPABASE_URL` in a unit run, so `resolveSupabaseCookiePrefix` returns its non-throwing fallback. A decoy named `sb-feature-flags` therefore genuinely matches the ambient constant, and the plan's decoy case would have been environment-dependent — passing in production, failing in the unit suite. The plan did not anticipate this. Resolved by injecting the constant through `vi.mock` over the seam, which is also a stronger claim: the decoy case now fails unless the load reads the constant at request time, and control **E2** confirms it fires against a load spelling `'sb-'`.

### [Rule 1 — stale documentation falsified by this change] `routes/+layout.ts`'s consumer count

- **Found during:** Task 2.
- **Issue:** the root universal load's docstring said *"The five nested universal loads take the finished client from `await parent()`, so the reconstruction happens once rather than six times."* Re-measured at HEAD: **two** (`(voters)/nominations/+layout.ts` and `admin/(protected)/+layout.ts`). It was already stale by one before this plan — 157.2 converted the voter analog and left the sentence — and this plan falsified it by two more.
- **Fix:** the sentence was re-measured and rewritten in place, naming the two remaining loads, why neither pays for the client, and recording that it previously said five. `apps/frontend/src/routes/+layout.ts` is **outside the plan's `files_modified`**; it is not the parent protected load and not the lint config, so neither of the plan's two empty-diffstat guards covers it. Changed lines: **1 insertion, 1 deletion**, comment only, no behaviour.
- **Commit:** `c49c0bffc`.

### [Additive, beyond the plan's output spec] Section E of the negative-control ledger

The plan's `<output>` asks only for this summary. The phase's ledger is where controls live, and its own completeness note invites later plans to append sections. Section E records six controls (E1–E6) including E6's verbatim timestamps, so `OB-1`'s discharge evidence is findable at the phase's closing gate rather than only in this file. Committed separately as `9b8de8a2b`.

## Authentication gates

None. No auth flow was exercised, and none was needed for the unit half.

## Known Stubs

None. Two stub shapes were written and run as **controls** (E1, E2) and neither was committed; the working tree after `feat(158-14)` carries the real filter, and `git status` is clean apart from the pre-existing untracked `.planning/milestone.lock`, which is not this plan's.

## Deferred / not run

- **The E2E suite was NOT run.** It needs a fresh dev server on `:5173` and a database reset, both of which are the user's current state, and this plan deliberately left both alone. **No E2E test was skipped, retried until green, or annotated as flaky** — none was touched at all. The frontend unit suite (1485 tests) is green, as are `yarn typecheck --force` and `yarn lint:check`.
- **The admin-route end-to-end overlap observation**, for the reason given above. Routed to `158-16`.

## Threat Flags

None. Both new files are additive server loads whose only surface is the request's own cookie jar; the two rewritten universal loads change where a client's cookies come from, not what is reachable. `T-158-78` (a new route file silently needing an allowlist entry) was disposed `accept` on the promise that the lint chain would be run — it was, exit 0, with `git diff --stat` over `eslint.config.mjs` empty.

## Self-Check: PASSED

Files claimed created, all found:

- `apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.server.ts`
- `apps/frontend/src/routes/admin/(protected)/question-info/+layout.server.ts`
- `apps/frontend/src/routes/admin/(protected)/layout.server.test.ts`

Commits claimed, all found in `git log`:

- `9ee2e0e3b` `test(158-14): add the failing spec for the two admin subtree cookie loads`
- `3e4ef147c` `feat(158-14): give each admin feature subtree its own cookie-array server load`
- `c49c0bffc` `feat(158-14): point both admin feature loads at their own data, keeping the streaming shape`
- `9b8de8a2b` `docs(158-14): record OB-1's controls, including the measured load overlap`

## TDD Gate Compliance

Task 1 carried `tdd="true"` and the gate sequence is in the log in order: `test(158-14)` at `9ee2e0e3b` (RED — the spec fails to resolve `./argument-condensation/+layout.server`, no load exists), then `feat(158-14)` at `3e4ef147c` (GREEN — 15/15). No REFACTOR commit was needed. The RED commit leaves the frontend unit suite red at that one commit, which is the gate working as intended.
