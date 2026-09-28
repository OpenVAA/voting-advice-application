# Phase 158 — Negative-Control Ledger

**A guard that has never been observed failing has not been shown to guard anything.** This file is
the phase's record that each guard it ships was *planted against, seen red, un-planted, and seen
green again* — in that order, with the **verbatim** failure message pasted rather than paraphrased
or predicted.

## Completeness

The phase sign-off block (`158-VALIDATION.md:88`, `:110`) declares the expected total:

| Section | Requirement | Plants expected | Plants filled | Owner |
|---|---|---:|---:|---|
| A. Route-pattern controls | REVIEW-RT-04 | 3 | **3** | plan 02 (this file's author) |
| B. Cookie-name controls | REVIEW-RT-02 | 6 | **6** | plan 03 |
| **Phase total** | | **9** | **9** | |

> **SECTION B NOW CARRIES ITS SIX FILLED ROWS, so the sign-off baseline of nine is met.** The
> section was opened as a header with an empty table on purpose, so that an unfinished ledger was
> visible at a glance rather than inferred from a count nobody ran; it stayed that way until the
> cookie-name plan landed its guard and observed it failing. Later plans in the phase may append
> further sections of their own; the nine plants above are the sign-off baseline, not a ceiling,
> and section B records one control beyond it.

## What a filled row must carry

Five fields, no fewer. A row missing any one of them is not evidence:

1. **The control** — what was planted, in one line.
2. **Where it was planted** — the file or directory, named.
3. **The command run** — the exact invocation, so the observation is reproducible.
4. **The observed failure message** — copied from the run's output. Not a summary of it.
5. **Removal confirmed green** — the same command re-run after the plant came out, and the result.

---

## Section A — route-pattern controls (REVIEW-RT-04)

Guard under test: `apps/frontend/src/lib/routes/routeConsistency.test.ts`, whose four checks bind
the exported `(protected)` group pattern, the SvelteKit route tree on disk, and the candidate auth
handler in `apps/frontend/src/hooks.server.ts` to each other.

Baseline before any plant: **40 tests, 40 passed.**

Command used for every row in this section:

```
yarn workspace @openvaa/frontend vitest run src/lib/routes/routeConsistency.test.ts
```

### A1 — the route tree drifts ahead of `ROUTE` (check C1)

| Field | Value |
|---|---|
| **Control** | A protected route added to the tree with no `ROUTE` entry addressing it. |
| **Planted at** | `apps/frontend/src/routes/candidate/(protected)/__probe__/+page.svelte` (new directory, one-line page body). |
| **Run** | 42 tests, **1 failed** / 41 passed. |
| **Removed** | `rm -rf 'apps/frontend/src/routes/candidate/(protected)/__probe__'`. |
| **Re-run** | 40 tests, **40 passed**. `git status --porcelain apps/frontend/src` empty. |

**Observed failure message, verbatim:**

```
FAIL  src/lib/routes/routeConsistency.test.ts > C1 — every protected route on disk is addressable through ROUTE (REVIEW-RT-04) > /candidate/(protected)/__probe__ is addressed by at least one ROUTE entry
AssertionError: The route tree carries an addressable page at /candidate/(protected)/__probe__, served at /candidate/__probe__, and no entry in the ROUTE map addresses it or anything below it. A protected route added without a ROUTE entry is still gated, because the hook's predicate is structural, but it cannot be linked to: buildRoute has no key for it, so every link to it has to be a hand written string, which is the drift this check exists to stop. Add a key to the ROUTE map in route.ts whose value is /candidate/(protected)/__probe__, or delete the page directory.: expected [] to not have a length of +0
```

**Names the specific offending directory:** yes — `/candidate/(protected)/__probe__`, twice, once as
the route id and once as the served path.

**Discriminating, not constant:** the other eight C1 rows stayed green in the same run, so C1
answered differently for the planted directory than for the eight real ones.

### A2 — `ROUTE` rots ahead of the route tree (check C2)

| Field | Value |
|---|---|
| **Control** | A `ROUTE` entry naming a protected route with no directory behind it. |
| **Planted at** | `apps/frontend/src/lib/routes/route.ts`, one line added to the `ROUTE` map: `` CandAppProbeGone: `${CANDIDATE_PROT}/__gone__`, ``. |
| **Run** | 41 tests, **1 failed** / 40 passed. |
| **Removed** | `git checkout -- apps/frontend/src/lib/routes/route.ts`. |
| **Re-run** | 40 tests, **40 passed**. `git status --porcelain apps/frontend/src` empty. |

**Observed failure message, verbatim:**

```
FAIL  src/lib/routes/routeConsistency.test.ts > C2 — every protected ROUTE entry names a route that exists (REVIEW-RT-04) > ROUTE.CandAppProbeGone has a directory on disk
AssertionError: ROUTE.CandAppProbeGone is /candidate/(protected)/__gone__, which carries the protected group segment, and there is no directory at /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/routes/candidate/(protected)/__gone__. A ROUTE entry with no route behind it produces a link to a page that does not exist, and nothing else in the tree notices. Either restore the route directory, or delete the ROUTE key and every caller that asks for it. If the gap is deliberate and is owned elsewhere, add CandAppProbeGone to KNOWN_UNBUILT_PROTECTED_ROUTES in this file with the reason, which keeps it counted rather than silent.: expected false to be true // Object.is equality
```

**Names the specific offending key:** yes — `ROUTE.CandAppProbeGone`, plus the absolute path of the
directory it expected to find.

### A3 — the hook stops using the pattern (check C4)

| Field | Value |
|---|---|
| **Control** | The subpath-unsafe pathname substring test restored inside the candidate auth handler. |
| **Planted at** | `apps/frontend/src/hooks.server.ts`, the handler's membership test rewritten from `if (isCandidateRoute(routeId)) {` back to `if (pathname.includes('/candidate')) {`. Located by expression, never by line number. |
| **Run** | 40 tests, **1 failed** / 39 passed. |
| **Removed** | `git checkout -- apps/frontend/src/hooks.server.ts`. |
| **Re-run** | 40 tests, **40 passed**. `git status --porcelain apps/frontend/src` empty. |

**Observed failure message, verbatim:**

```
FAIL  src/lib/routes/routeConsistency.test.ts > C4 — the candidate auth handler decides from the route id, not from the pathname (REVIEW-RT-04) > contains no includes or endsWith test on a pathname
AssertionError: candidateAuthHandle in /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/hooks.server.ts tests a pathname with includes or endsWith, and that is the subpath-unsafe defect class this handler was rewritten to close. A pathname carries the deployment's base path and the locale prefix and the resolved values of every route parameter, so a substring test fires when the app is served under a path that contains the word and fails to fire when it is served under one that does not. Decide membership from the SvelteKit route id instead, through isCandidateRoute and isProtectedRoute, which take a route id and compare whole segments. The prefix test pathname.startsWith( is deliberately NOT banned: it guards a served URL prefix rather than a route id and is correct as written. Offending constructs: pathname.includes( in the source line: if (pathname.includes('/candidate')) {
```

**Names the specific offending construct:** yes — `pathname.includes(`, together with the whole
source line it appeared on, quoted from the untouched file.

**The precision half, which is the point of scoping C4 to the handler body.** In the same red run,
the sibling assertion *"the handler body was located and the scan reached real source"* stayed
**green**. That assertion requires the extracted body to contain `pathname.startsWith(` — the API
skip, which guards a served URL prefix rather than a route id and is correct as written. So the run
proves both halves at once: the banned construct was caught, and the correct `startsWith` call
sitting three lines above it was not. Without that pairing, a C4 that simply banned every
`pathname` read would have gone red here for the wrong reason, and this row would be evidence of
nothing.

### Section A closing state

```
$ git status --porcelain apps/frontend/src
(empty)

$ yarn workspace @openvaa/frontend test:unit
Test Files  73 passed (73)
     Tests  1361 passed (1361)
```

No plant survives. Every plant was removed by deleting the directory it created or by
`git checkout --` on the single file it touched; no blanket working-tree reset was used, and
`git clean` was not run.

---

## Section B — cookie-name controls (REVIEW-RT-02)

**Six rows expected here. Six filled.** Two guards are under test in this section, because the
requirement names two failure modes and they are not the same kind of thing.

- **The literal-at-an-operation-site mode** is a source shape, and its guard is
  `scripts/assert-cookie-names.mjs`, the last member of the `yarn lint:check` chain. Controls B1
  through B4 plant one literal each, one per syntactic form; B5 and B6 are green negative controls.
- **The collision mode** is a value property of the map as a whole, which no source scan can see,
  and its guard is `apps/frontend/src/lib/cookies/cookies.test.ts` under `yarn test:unit`. Its
  control is recorded below the six, as an addition to the sign-off baseline rather than a
  substitution for any part of it.

Command used for rows B1 through B6:

```
node scripts/assert-cookie-names.mjs
```

Baseline before any plant: **scanned 770 file(s) under apps/frontend/src; 0 violation(s).** Exit 0.

| # | Control | Planted at | Command | Observed failure message | Removed, green again |
|---|---|---|---|---|---|
| B1 | A single-line cookie set naming its cookie with a literal. | `apps/frontend/src/routes/api/oidc/token/+server.ts:41` | `node scripts/assert-cookie-names.mjs` | 1 violation, naming the file, line 41, the literal and the operation. Verbatim in B1 below. | Exit 0, 0 violations. |
| B2 | The SAME call written multi-line, with the literal on its own line. | `apps/frontend/src/routes/api/oidc/token/+server.ts:41-45` | `node scripts/assert-cookie-names.mjs` | 1 violation, naming the file, line 41 and the literal. Verbatim in B2 below. | Exit 0, 0 violations. |
| B3 | A cookie get naming its cookie with a literal. | `apps/frontend/src/routes/api/oidc/token/+server.ts:19` | `node scripts/assert-cookie-names.mjs` | 1 violation, naming the file, line 19, the literal and the operation. Verbatim in B3 below. | Exit 0, 0 violations. |
| B4 | A browser cookie assignment opening with a literal name, in the component. | `apps/frontend/src/routes/candidate/preregister/+page.svelte:111` | `node scripts/assert-cookie-names.mjs` | 1 violation, naming the file and line 111 under the client-side clause. Verbatim in B4 below. | Exit 0, 0 violations. |
| B5 | NEGATIVE CONTROL. The Supabase SSR bridge's identifier-first-argument set call, left untouched, must stay green — and a real literal planted in that same file must still be caught. | `apps/frontend/src/lib/supabase/server.ts` (bridge untouched at its own call; probe literal at `:23`) | `node scripts/assert-cookie-names.mjs` | The bridge call is NOT reported in any run, clean or planted. With the probe literal planted in the same file, exactly one violation is reported and it is the probe. Verbatim in B5 below. | Probe removed, exit 0, 0 violations. |
| B6 | NEGATIVE CONTROL. The rewritten client-side write, whose name segment is an interpolation of a map member, must stay green. | `apps/frontend/src/routes/candidate/preregister/+page.svelte:109`, no plant | `node scripts/assert-cookie-names.mjs` | Never reported. In the B4 run the same file held BOTH forms and exactly one was flagged, the literal one. Verbatim in B6 below. | N/A — it is the shipped code, and every clean run above is its green. |

### B1 — a single-line cookie set with a literal name

| Field | Value |
|---|---|
| **Control** | `cookies.set('sb-probe-single', idToken, { path: '/' });` |
| **Planted at** | `apps/frontend/src/routes/api/oidc/token/+server.ts:41`, one line added before the success response. |
| **Run** | 1 violation, **exit 1**. |
| **Removed** | The file restored from its pre-plant copy. |
| **Re-run** | `scanned 770 file(s) under apps/frontend/src; 0 violation(s).` **exit 0**. |

**Observed failure message, verbatim:**

```
[ERROR] scripts/assert-cookie-names.mjs: apps/frontend/src/routes/api/oidc/token/+server.ts:41 names a cookie with the literal "sb-probe-single" as the first argument of a cookies.set call. Every cookie name this application chooses is declared once in apps/frontend/src/lib/cookies/index.ts, and read from there at every operation site, so that two files cannot disagree about a spelling and two cookies cannot silently share a name. Import COOKIE from $lib/cookies and pass the member for this cookie, adding a member if the cookie is new. If the name is not one this application chooses — if it arrives as a value from a library, the way the Supabase SSR bridge's does — then pass the value rather than a literal, and this guard will not see it (REVIEW-RT-02).
Cookie-name guard (phase 158: REVIEW-RT-02) — scanned 770 file(s) under apps/frontend/src; 1 violation(s).
```

**Names the specific offending site:** yes — the file, the line, the literal, and which of the three
operations it was written on.

### B2 — the same call, multi-line, with the literal on its own line

This is the control that catches a lazy pattern. A single-line regex over `cookies.set('` walks
straight past this shape while reporting a confident zero.

| Field | Value |
|---|---|
| **Control** | The same set as B1, rewritten across five lines with `'sb-probe-multiline'` alone on the second. |
| **Planted at** | `apps/frontend/src/routes/api/oidc/token/+server.ts:41-45`. |
| **Run** | 1 violation, **exit 1**. |
| **Removed** | The file restored from its pre-plant copy. |
| **Re-run** | `scanned 770 file(s) under apps/frontend/src; 0 violation(s).` **exit 0**. |

**Observed failure message, verbatim:**

```
[ERROR] scripts/assert-cookie-names.mjs: apps/frontend/src/routes/api/oidc/token/+server.ts:41 names a cookie with the literal "sb-probe-multiline" as the first argument of a cookies.set call. Every cookie name this application chooses is declared once in apps/frontend/src/lib/cookies/index.ts, and read from there at every operation site, so that two files cannot disagree about a spelling and two cookies cannot silently share a name. Import COOKIE from $lib/cookies and pass the member for this cookie, adding a member if the cookie is new. If the name is not one this application chooses — if it arrives as a value from a library, the way the Supabase SSR bridge's does — then pass the value rather than a literal, and this guard will not see it (REVIEW-RT-02).
Cookie-name guard (phase 158: REVIEW-RT-02) — scanned 770 file(s) under apps/frontend/src; 1 violation(s).
```

The reported line, 41, is the line the call OPENS on; the literal itself sits on 42. That is the line
a reader has to open to fix it, and it is stated here rather than left to be discovered.

**The naive pattern was measured against this same plant, rather than assumed to miss it:**

```
$ grep -cE "cookies\.(get|set|delete)\(\s*'" apps/frontend/src/routes/api/oidc/token/+server.ts
0

$ printf "cookies.set('sb-probe-single', x, {});\n" | grep -cE "cookies\.(get|set|delete)\(\s*'"
1
```

So the single-line pattern is CAPABLE of matching — it returns 1 on B1's shape — and returns 0 on
the planted file. The guard returned 1 on the same file in the same state. The difference is the
guard's tolerance of whitespace and newlines between the parenthesis and the name, and this pair of
commands is what establishes it rather than the code review that suggested it.

### B3 — a cookie get with a literal name

| Field | Value |
|---|---|
| **Control** | `const probe = cookies.get('sb-probe-get');` plus a use of it, so the plant compiles as real code rather than as dead syntax. |
| **Planted at** | `apps/frontend/src/routes/api/oidc/token/+server.ts:19`. |
| **Run** | 1 violation, **exit 1**. |
| **Removed** | The file restored from its pre-plant copy. |
| **Re-run** | `scanned 770 file(s) under apps/frontend/src; 0 violation(s).` **exit 0**. |

**Observed failure message, verbatim:**

```
[ERROR] scripts/assert-cookie-names.mjs: apps/frontend/src/routes/api/oidc/token/+server.ts:19 names a cookie with the literal "sb-probe-get" as the first argument of a cookies.get call. Every cookie name this application chooses is declared once in apps/frontend/src/lib/cookies/index.ts, and read from there at every operation site, so that two files cannot disagree about a spelling and two cookies cannot silently share a name. Import COOKIE from $lib/cookies and pass the member for this cookie, adding a member if the cookie is new. If the name is not one this application chooses — if it arrives as a value from a library, the way the Supabase SSR bridge's does — then pass the value rather than a literal, and this guard will not see it (REVIEW-RT-02).
Cookie-name guard (phase 158: REVIEW-RT-02) — scanned 770 file(s) under apps/frontend/src; 1 violation(s).
```

**Names the operation, not merely the file:** yes — `cookies.get`, distinguishing it from B1's set.

### B4 — the client-side write, in a component, with a literal name

The form a pattern keyed on the SvelteKit cookie API alone cannot see. In this application it is
also the only place one of the four cookies is ever produced, so a guard that misses this clause
misses the site whose breakage is hardest to notice.

| Field | Value |
|---|---|
| **Control** | A second browser cookie assignment whose template opens `sb-probe-client=` instead of with an interpolation. |
| **Planted at** | `apps/frontend/src/routes/candidate/preregister/+page.svelte:111`, two lines below the real write at `:109`. |
| **Run** | 1 violation, **exit 1**. |
| **Removed** | The file restored from its pre-plant copy. |
| **Re-run** | `scanned 770 file(s) under apps/frontend/src; 0 violation(s).` **exit 0**. |

**Observed failure message, verbatim:**

```
[ERROR] scripts/assert-cookie-names.mjs: apps/frontend/src/routes/candidate/preregister/+page.svelte:111 writes a cookie from the browser with a hand-written name: the assignment's right-hand side opens with a literal instead of with an interpolation of a declared name. This is the client-side write form, and in this application it is the sole producer of one of the cookies its two server-side readers consume, so a name written here by hand breaks the exchange in one direction only and reports nothing. Import COOKIE from $lib/cookies and open the template with the member for this cookie, leaving the attributes after it untouched (REVIEW-RT-02).
Cookie-name guard (phase 158: REVIEW-RT-02) — scanned 770 file(s) under apps/frontend/src; 1 violation(s).
```

**Discriminating, not blanket.** In this run the file held TWO browser cookie assignments — the
shipped one at `:109`, whose name segment is `${COOKIE.oidcCodeVerifier}`, and the plant at `:111`.
Exactly one was reported, and it was the plant. That single run is both B4's red and B6's green.

### B5 — NEGATIVE CONTROL: the Supabase SSR bridge is exempt by SHAPE, not by path

The bridge writes cookies whose names it is handed by the Supabase SSR package. This application
does not choose them and therefore cannot declare them, so they must not be flagged. The risk in
answering that with a path exemption is that the exemption becomes a place for a real literal to
hide. This control tests both halves.

| Field | Value |
|---|---|
| **Half (a), the exemption** | `event.cookies.set(name, value, { ...options, httpOnly: false, path: '/' });` in `apps/frontend/src/lib/supabase/server.ts`, left untouched. Its first argument is the identifier `name`. |
| **Half (a) result** | NOT reported, in every run recorded in this section. The file is inside the scanned tree — it is one of the 770 — and the guard reads it and declines to flag it. |
| **Half (b), the anti-hiding test** | `probe: () => event.cookies.set('sb-probe-in-bridge', 'x', { path: '/' }),` planted at `apps/frontend/src/lib/supabase/server.ts:23`, two lines above the bridge's own set call. |
| **Half (b) result** | **1 violation, exit 1** — the probe. The bridge's own call, in the same file and in the same run, stayed silent. |
| **Removed** | The file restored from its pre-plant copy. |
| **Re-run** | `scanned 770 file(s) under apps/frontend/src; 0 violation(s).` **exit 0**. |

**Observed failure message for half (b), verbatim:**

```
[ERROR] scripts/assert-cookie-names.mjs: apps/frontend/src/lib/supabase/server.ts:23 names a cookie with the literal "sb-probe-in-bridge" as the first argument of a cookies.set call. Every cookie name this application chooses is declared once in apps/frontend/src/lib/cookies/index.ts, and read from there at every operation site, so that two files cannot disagree about a spelling and two cookies cannot silently share a name. Import COOKIE from $lib/cookies and pass the member for this cookie, adding a member if the cookie is new. If the name is not one this application chooses — if it arrives as a value from a library, the way the Supabase SSR bridge's does — then pass the value rather than a literal, and this guard will not see it (REVIEW-RT-02).
Cookie-name guard (phase 158: REVIEW-RT-02) — scanned 770 file(s) under apps/frontend/src; 1 violation(s).
```

**Why this is the whole point.** Under a path-based exemption, half (b) would have printed
`0 violation(s)` and exited 0 — the file would have been skipped and the planted literal would have
been invisible. It printed 1 and exited 1. The bridge is silent because of the SHAPE of its first
argument, and there is no allowlisted path anywhere in the guard to hide behind. Verified
independently of the observation:

```
$ grep -c "supabase/server" scripts/assert-cookie-names.mjs
1
```

The single occurrence is in the docblock, which names the exemption's reasoning in prose. There is
no path comparison in the executable body.

### B6 — NEGATIVE CONTROL: the rewritten client-side write stays green

| Field | Value |
|---|---|
| **Control** | The shipped write: <code>document.cookie = &grave;${COOKIE.oidcCodeVerifier}=${codeVerifier}; path=/; max-age=600; secure; samesite=lax&grave;</code> |
| **Located at** | `apps/frontend/src/routes/candidate/preregister/+page.svelte:109`. No plant; this is production code. |
| **Run** | Not reported, in any run in this section. |
| **Observed clean output** | `Cookie-name guard (phase 158: REVIEW-RT-02) — scanned 770 file(s) under apps/frontend/src; 0 violation(s).` **exit 0**. |
| **Not vacuous** | In B4's run the same file carried a literal-opening assignment as well, and the guard reported that one and only that one. A clause incapable of firing would have reported neither; a clause that fired on every browser cookie write would have reported both. |

### Beyond the six — the collision mode, under the other guard

Not one of the six sign-off rows, and recorded here because D-G2 names TWO failure modes and the
five-field rule applies to the second one just as much. Its guard is the unit spec, not the source
scan, so its command is different.

| Field | Value |
|---|---|
| **Control** | A fifth key duplicating an existing wire name: `legacyIdToken` given the same value as `idToken`. |
| **Planted at** | `apps/frontend/src/lib/cookies/index.ts:19`. |
| **Command** | `yarn vitest run src/lib/cookies/cookies.test.ts` (from `apps/frontend`). |
| **Run** | 4 tests, **2 failed** / 2 passed. |
| **Removed** | The file restored from its pre-plant copy. |
| **Re-run** | 4 tests, **4 passed**. |

**Observed failure message, verbatim:**

```
FAIL  src/lib/cookies/cookies.test.ts > COOKIE — the cookie names this application chooses > gives every cookie a name no other cookie has
AssertionError: Two keys in the cookie map claim the same wire name. Two cookies sharing a name are one cookie: whichever is written second overwrites the first, and the reader of the first silently gets the second value.: expected [ Array(1) ] to deeply equal []

- Expected
+ Received

- []
+ [
+   "idToken and legacyIdToken both name the cookie 'id_token'",
+ ]
```

**Names both colliding keys:** yes — `idToken and legacyIdToken`, together with the name they both
claim. That is the property the requirement asks for, quoted from the run rather than predicted.

The two other tests behaved as they should in the same run: the positive control on a synthetic
colliding map stayed GREEN, proving the detector was answering rather than merely failing, and the
freeze assertion stayed GREEN, proving the plant reddened the collision check specifically and not
the file as a whole.

### Section B closing state

```
$ git status --porcelain apps scripts
(empty, apart from the new guard script itself before it was committed)

$ git grep -n "sb-probe" -- apps scripts
(no matches)

$ node scripts/assert-cookie-names.mjs
Cookie-name guard (phase 158: REVIEW-RT-02) — scanned 770 file(s) under apps/frontend/src; 0 violation(s).

$ yarn workspace @openvaa/frontend test:unit
Test Files  76 passed (76)
     Tests  1396 passed (1396)
```

No plant survives. Every plant was removed by restoring the single file it touched from a copy taken
before the plant; no blanket working-tree reset was used, and `git clean` was not run.

---

## Section C — app-gate controls (D10 criterion 9, REVIEW-RT-04)

Appended by plan `158-11`, which gave the Admin App a request-hook gate for the first time and moved
both applications' gates into one declared table. Sections A and B above are untouched.

Two guards are under test, plus one live observation of the running application:

- **`apps/frontend/src/lib/routes/routeConsistency.test.ts`**, which `158-02` shipped with four checks
  and which now carries a fifth, **C5**: a gated application subtree the route tree carries and the
  gate table has no row for is a failure, named. Controls **C1**, **C2** and **C3** are its.
- **The gate itself, live.** A guard going red proves the guard works; it does not prove the gate
  refuses. Control **C4** is the running application, and it is the row that matters most, because a
  gate that fails OPEN is invisible to a passing suite.

Baseline before any plant: **46 tests, 46 passed** — 40 before this plan, plus the six C5 and
non-vacuity cases it added. (Section A's baseline of 40 is the same file before the extension.)

Command used for rows C1 through C3:

```
yarn workspace @openvaa/frontend vitest run src/lib/routes/routeConsistency.test.ts
```

### C1 — the route tree drifts ahead of `ROUTE`, this time under the ADMIN subtree (check C1)

Section A's row A1 planted this under the candidate app. It is replanted under the admin app because
this plan's whole subject is the admin subtree, and a check that had only ever been observed firing on
one application is a check that has not been shown to answer per-application.

| Field | Value |
|---|---|
| **Control** | A protected admin route added to the tree with no `ROUTE` entry addressing it. |
| **Planted at** | `apps/frontend/src/routes/admin/(protected)/__probe__/+page.svelte` (new directory, one-line page body). |
| **Run** | 48 tests, **1 failed** / 47 passed. |
| **Removed** | `rm -rf 'apps/frontend/src/routes/admin/(protected)/__probe__'`. |
| **Re-run** | 46 tests, **46 passed**. `git status --porcelain apps/frontend/src/routes` empty. |

**Observed failure message, verbatim:**

```
FAIL  src/lib/routes/routeConsistency.test.ts > C1 — every protected route on disk is addressable through ROUTE (REVIEW-RT-04) > /admin/(protected)/__probe__ is addressed by at least one ROUTE entry
AssertionError: The route tree carries an addressable page at /admin/(protected)/__probe__, served at /admin/__probe__, and no entry in the ROUTE map addresses it or anything below it. A protected route added without a ROUTE entry is still gated, because the hook's predicate is structural, but it cannot be linked to: buildRoute has no key for it, so every link to it has to be a hand written string, which is the drift this check exists to stop. Add a key to the ROUTE map in route.ts whose value is /admin/(protected)/__probe__, or delete the page directory.: expected [] to not have a length of +0
```

**Names the specific offending directory:** yes — `/admin/(protected)/__probe__`, twice, once as the
route id and once as the served path `/admin/__probe__`.

**Discriminating, not constant:** the other ten C1 rows stayed green in the same run, including the
four real admin ones (`/admin/(protected)`, `…/argument-condensation`, `…/jobs`, `…/question-info`).
C1 answered differently for the planted directory than for the ten real ones.

### C2 — an application subtree with no row in the gate table (check C5)

This is the control the new check exists for, and the shape the Admin App itself had until this plan:
a `(protected)` group in the route tree and nothing in the request hook that knows about it.

| Field | Value |
|---|---|
| **Control** | The admin row deleted from the gate table: `Object.freeze([CANDIDATE_GATE, ADMIN_GATE])` rewritten to `Object.freeze([CANDIDATE_GATE])`. Located by expression, never by line number. |
| **Planted at** | `apps/frontend/src/lib/routes/appGates.ts`. |
| **Run** | 45 tests, **2 failed** / 43 passed. |
| **Removed** | `git checkout -- apps/frontend/src/lib/routes/appGates.ts`. |
| **Re-run** | 46 tests, **46 passed**. `git status --porcelain apps` shows only this plan's own guard extension. |

**Observed failure messages, verbatim — both of them:**

```
FAIL  src/lib/routes/routeConsistency.test.ts > C5 — every gated application subtree has a row in the gate table (D10-C09, REVIEW-RT-04) > /admin is claimed by a row of APP_GATES
AssertionError: The route tree carries a gated application subtree at /admin — it contains a (protected) route group — and no row of APP_GATES claims it. The request hook resolves exactly one row from the route id and returns early when none matches, so an application with no row is an application the hook does not gate at all: its (protected) routes are served to anyone who asks, and whatever its own layout does about that is the only thing standing between an unauthenticated caller and the page. Add a row to APP_GATES in appGates.ts whose predicate claims /admin, carrying that application's own login route and the redirect pair its protected layout already uses. Rows declared today: Candidate App: expected [] to not have a length of +0
```

```
FAIL  src/lib/routes/routeConsistency.test.ts > C5 — every gated application subtree has a row in the gate table (D10-C09, REVIEW-RT-04) > the admin row bounces with the same error message the admin protected layout redirects with
AssertionError: No row of APP_GATES names the admin login route, so the admin application has no gate row at all and the check below has nothing to compare.: expected undefined to be defined
```

**Names the specific offending subtree:** yes — `/admin`, together with the rows that WERE declared
(`Rows declared today: Candidate App`), which is what tells a reader which application is missing
rather than only that one is.

**The collected count moved, and that is itself evidence.** 46 → **45**. The per-row case
*"the %s row claims exactly one gated application subtree"* is generated from `APP_GATES`, so deleting
a row deletes its case. A check whose case count did not move when the table shrank would be a check
reading a hand-maintained list rather than the table.

### C3 — the hook stops deciding from the route id (check C4)

Section A's row A3 observed this before the gate table existed, against a handler that gated one
application. It is re-observed here because the handler has since been rewritten and renamed
(`candidateAuthHandle` → `appGateHandle`), and a scan located by a declared identifier is exactly the
kind of thing a rename breaks silently.

| Field | Value |
|---|---|
| **Control** | The subpath-unsafe pathname substring test reintroduced inside the handler body: a bare `if (pathname.includes('/candidate')) { }` inserted immediately above the gate lookup. Located by expression — the `const gate = resolveAppGate(routeId);` statement — never by line number. |
| **Planted at** | `apps/frontend/src/hooks.server.ts`. |
| **Run** | 46 tests, **1 failed** / 45 passed. |
| **Removed** | `git checkout -- apps/frontend/src/hooks.server.ts`. |
| **Re-run** | 46 tests, **46 passed**. `git status --porcelain apps tests scripts` shows only this plan's own guard extension. |

**Observed failure message, verbatim:**

```
FAIL  src/lib/routes/routeConsistency.test.ts > C4 — the application session-gate handler decides from the route id, not from the pathname (REVIEW-RT-04) > contains no includes or endsWith test on a pathname
AssertionError: appGateHandle in /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/hooks.server.ts tests a pathname with includes or endsWith, and that is the subpath-unsafe defect class this handler was rewritten to close. A pathname carries the deployment's base path and the locale prefix and the resolved values of every route parameter, so a substring test fires when the app is served under a path that contains the word and fails to fire when it is served under one that does not. Decide membership from the SvelteKit route id instead, through resolveAppGate and isProtectedRoute, which take a route id and compare whole segments. The prefix test pathname.startsWith( is deliberately NOT banned: it guards a served URL prefix rather than a route id and is correct as written. Offending constructs: pathname.includes( in the source line: if (pathname.includes('/candidate')) {: expected [ Array(1) ] to deeply equal []
```

**Names the specific offending construct:** yes — `pathname.includes(`, together with the whole source
line it appeared on, quoted from the untouched file, and the handler's current identifier
`appGateHandle`.

**BOTH HALVES IN THE SAME RUN, which is the point of this row.** In the run that produced the failure
above, the sibling assertion *"the handler body was located and the scan reached real source"* stayed
**GREEN**:

```
✓ C4 — the application session-gate handler decides from the route id, not from the pathname (REVIEW-RT-04) > the handler body was located and the scan reached real source
× C4 — the application session-gate handler decides from the route id, not from the pathname (REVIEW-RT-04) > contains no includes or endsWith test on a pathname
```

That green assertion requires the extracted body to contain `pathname.startsWith(` — the anchored
API-root skip, which guards a served URL prefix rather than a route id and is correct as written. So
one run proves both directions: the banned substring construct was caught, and the correct anchored
`startsWith` call a few lines above it was **not**. The ban is scoped by SHAPE, not by file. Without
this pairing a C4 that simply banned every `pathname` read would have gone red here for the wrong
reason and this row would be evidence of nothing.

Five other C5 and non-vacuity cases also stayed green in the same run, so the plant reddened C4
specifically rather than the file as a whole.

### C4 — the gate itself, observed refusing in the running application

A guard going red proves the guard works. It does not prove the gate refuses. This row is the gate,
live, and it exists because **a gate that fails OPEN is invisible to a green suite**.

| Field | Value |
|---|---|
| **Instrument** | The running application. One fresh dev server on an alternate port (`FRONTEND_PORT=5273 yarn workspace @openvaa/frontend dev`), so the pre-existing server on `:5173` was neither stopped nor trusted. `curl` never follows redirects; every status below is the FIRST response. |
| **Database** | `seed.sql` + dev-seed `default` already in place — **1 election, 5 constituencies, 2 auth users**, counted rather than assumed. Per `158-ADMIN-BASELINE.md` flag (2), a bare `db:reset` renders every page as the error boundary at HTTP 200, so a seeded database is a precondition for any of these statuses meaning anything. |
| **Served-application identity, asserted before the run** | `curl -s -o /dev/null -w '%{http_code}' "http://localhost:5273/@fs$(pwd)/apps/frontend/src/routes/+layout.svelte"` → **200**, and the module root the server echoes is `/@fs/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/.svelte-kit` — this checkout's. |
| **Identity** | `admin@openvaa.test` / `password123`, the `project_admin` that `apps/supabase/seed.sql` creates. Logged in through the real form action, never a minted cookie. Nothing was created, so nothing needed tearing down. |

**The refusal, unauthenticated — every admin route, first response:**

```
/admin                        307|0  location=http://localhost:5273/admin/login?errorMessage=loginFailed
/admin/jobs                   307|0  location=http://localhost:5273/admin/login?errorMessage=loginFailed
/admin/question-info          307|0  location=http://localhost:5273/admin/login?errorMessage=loginFailed
/admin/argument-condensation  307|0  location=http://localhost:5273/admin/login?errorMessage=loginFailed
/admin/login                  200|220929  location=<none>
/api/admin/jobs/active        401  {"error":"Unauthorized"}
/api/admin/jobs/past          401  {"error":"Unauthorized"}
```

**The candidate arm and the public voter surface, unauthenticated, unchanged:**

```
/candidate/profile    303|0  location=http://localhost:5273/candidate/login?redirectTo=candidate%2Fprofile
/candidate/questions  303|0  location=http://localhost:5273/candidate/login?redirectTo=candidate%2Fquestions
/candidate/login      200|225548  location=<none>
/                     200|224296  location=<none>
```

**Authenticated, with the seeded `project_admin`'s cookie jar:**

```
/admin       200|222252  location=<none>   (direct entry)
/admin       200|222252  location=<none>   (refresh — byte-identical)
/admin/jobs  200|222273  location=<none>
/admin/login 303|0       location=http://localhost:5273/admin
/candidate/login 303|0   location=http://localhost:5273/candidate
/api/admin/jobs/active  200  []
/api/admin/jobs/past    200  []
```

**The content discriminator, non-vacuous.** A 200 is not evidence on its own — `158-ADMIN-BASELINE.md`
recorded a run in which every admin page answered 200 while rendering the error boundary. Counted on
the authenticated `/admin` body against the unauthenticated `/admin/login` body **in the same run**:

| Detector | authenticated `/admin` | `/admin/login` |
|---|--:|--:|
| `id="email"` | **0** | **1** |
| `id="password"` | **0** | **1** |
| `autocomplete="current-password"` | **0** | **1** |
| `data-testid="error-message"` | **0** | 0 |

The three zeros are measurements, not a broken detector: the same three greps return 1 / 1 / 1 against
the login page. The authenticated admin page is the admin page — not the login page served at 200, and
not the error boundary.

#### The plant, and the half that discriminates

**The unauthenticated 307 above does NOT by itself prove the new gate row is live**, and saying so is
the point of this row. The admin protected layout has always issued the same 307 to the same target,
so hook and layout are indistinguishable from outside on that arm. The discriminating observation is
the **authenticated login-page bounce**, which the admin login page cannot produce on its own: it sits
outside the `(protected)` group and its `+page.server.ts` exports `actions` and no `load`.

| Field | Value |
|---|---|
| **Control** | The admin row deleted from the gate table in the RUNNING application, `Object.freeze([CANDIDATE_GATE, ADMIN_GATE])` → `Object.freeze([CANDIDATE_GATE])`, and the SSR module allowed to reload. |
| **Planted at** | `apps/frontend/src/lib/routes/appGates.ts`. |
| **Removed** | `git checkout -- apps/frontend/src/lib/routes/appGates.ts`, module reloaded, request replayed. |

```
=== WITH THE ADMIN ROW REMOVED (live) ===
authenticated /admin/login   200  location=<none>
authenticated /admin         200  location=<none>
unauthenticated /admin       307  location=http://localhost:5273/admin/login?errorMessage=loginFailed
unauthenticated /admin/jobs  307  location=http://localhost:5273/admin/login?errorMessage=loginFailed

=== ROW RESTORED (live) ===
authenticated /admin/login   303  location=http://localhost:5273/admin
authenticated /admin         200  location=<none>
```

**Read it in two halves.**

1. **The discriminating half.** Authenticated `/admin/login` flips **303 → 200 → 303** as the row is
   removed and restored. Nothing else in the application produces that redirect. **The new gate row is
   live, and this is the observation that establishes it.**
2. **The half that does NOT discriminate, recorded because omitting it would overstate the result.**
   The unauthenticated `/admin` and `/admin/jobs` bounces stay at **307** with the row removed, because
   the admin protected layout still issues them. On the unauthenticated arm the hook row is
   **defence in depth**, not the only gate — it refuses one layer earlier, before the root layout load
   and before the layout's `getUserData` round trip. Nothing was loosened; a second, earlier gate was
   added, and the two agree on status and target because the row was written to reproduce the layout's
   pair exactly.

### Section C closing state

```
$ git status --porcelain apps tests scripts
(empty)

$ yarn workspace @openvaa/frontend vitest run src/lib/routes
Test Files  4 passed (4)
     Tests  103 passed (103)

$ yarn workspace @openvaa/frontend test:unit
Test Files  77 passed (77)
     Tests  1443 passed (1443)

$ yarn typecheck ; yarn lint:check
exit 0 ; exit 0
```

No plant survives. Every plant was removed by deleting the directory it created or by
`git checkout --` on the single file it touched; no blanket working-tree reset was used, and
`git clean` was not run. The temporary dev server on `:5273` was stopped; the pre-existing server on
`:5173` was never touched, and no database row was created or deleted by this run.

---

## Section D — no-session-in-server-loads controls (D10 criterion 13)

Guard under test: `scripts/assert-no-session-in-loads.mjs`, the last link of the `yarn lint:check`
chain as of plan 13. Four checks, and **one control per check**, because a control aimed at "the
script" rather than at a check proves only that the script can be made to exit non-zero.

Command used for every row:

```
node scripts/assert-no-session-in-loads.mjs
```

**Baseline before any plant**, verbatim, exit **0**:

```
No-session-in-server-loads guard (phase 158: D10-C13) — corpus: 10 server-load module(s) under apps/frontend/src/routes (floor 10).
No-session-in-server-loads guard (phase 158: D10-C13) — 10 module(s), 463 line(s) scanned; 0 violation(s) in the real corpus; self-test flagged 5 line(s) in scripts/fixtures/assert-no-session-in-loads.input.ts (matching the committed expectation); 0 violation(s) in total.
```

Note what that baseline already carries: the guard reports **10** as its corpus size on the same
line as the zero, and it reports that its own fixture was flagged **5** times in the same
invocation. A run in which the fixture were silently not flagged would say so, and its zero over
the real corpus would be visibly worthless.

| # | Control | Check targeted | Planted at | Observed failure message | Removed, green again |
|---|---|---|---|---|---|
| D1 | The admin subtree load restored to the session-returning shape, `return { session }`. | Check 1 (the pair) | `apps/frontend/src/routes/admin/+layout.server.ts:21` | 1 violation in the real corpus, naming the file, the line, the binding and the member. Verbatim in D1 below. **Exit 1.** | `git checkout --` on that one file; 0 violations, exit 0. |
| D2 | NEGATIVE CONTROL. A member spelled `session`, returned from a corpus module, that was NOT taken from the verified-session call. | Check 1's precision | `apps/frontend/src/routes/(voters)/(located)/+layout.server.ts:23-24` | **Never reported.** Present in the SAME run as D1's plant, in which exactly one violation was reported and it was D1's. Verbatim in D2 below. | Plant removed with D1's; the tree's own clean runs are its green. |
| D3 | NEGATIVE half: the root server loader's docstring, which names both credential fields in prose, left untouched. POSITIVE half: the same field name planted in CODE in a corpus module. | Check 2 (comment blindness) | negative half `apps/frontend/src/routes/+layout.server.ts:16`, no plant; positive half `apps/frontend/src/routes/candidate/+layout.server.ts:21` | Both halves in one run: 1 violation, and it is the CODE mention; the prose mention is not reported. Verbatim in D3 below. Separately, the same clean tree scanned with the mask DISABLED reports **6** violations against three files that are all correct. **Exit 1** both times. | `git checkout --` on the one planted file, and the mask restored from a pre-edit copy; 0 violations, exit 0. |
| D4 | The corpus pointed at a directory that contains no server load at all. | Check 0 (anti-vacuity) | `scripts/assert-no-session-in-loads.mjs`, `ROUTES_DIR_REL` repointed to `apps/frontend/src/lib/cookies` | Corpus size printed as **0**, four violations, and an explicit refusal to report a clean scan. Verbatim in D4 below. **Exit 1.** | The constant restored from a pre-edit copy; corpus size **10**, 0 violations, exit 0. |

### D1 — Check 1's pair matcher, and D2 — its precision, in ONE run

Both plants were in the working tree for a **single** invocation. That is the point of pairing
them: a red that is not accompanied by an observed green somewhere it should not fire tells you
the guard is loud, not that it is right.

| Field | Value |
|---|---|
| **Control D1** | The two-line pre-plan-13 shape restored: `const { session } = await locals.safeGetSession();` then `return { session };`. |
| **Planted at** | `apps/frontend/src/routes/admin/+layout.server.ts`, replacing the projection. |
| **Control D2** | `const session = supabaseCookies.length > 0 ? 'present' : null;` then `return { supabaseCookies, session };` — a top-level returned member spelled exactly like the credential-bearing one, from a source that is not the verified-session call. |
| **Planted at** | `apps/frontend/src/routes/(voters)/(located)/+layout.server.ts`, after the cookie filter. |
| **Run** | 1 violation, **exit 1**. |
| **Removed** | `git checkout -- apps/frontend/src/routes/admin/+layout.server.ts "apps/frontend/src/routes/(voters)/(located)/+layout.server.ts"`. No blanket reset; `git clean` was not run. |
| **Re-run** | `10 module(s), 463 line(s) scanned; 0 violation(s) in the real corpus`, **exit 0**. |

**Observed output, verbatim, one run with BOTH plants present:**

```
No-session-in-server-loads guard (phase 158: D10-C13) — corpus: 10 server-load module(s) under apps/frontend/src/routes (floor 10).
[ERROR] scripts/assert-no-session-in-loads.mjs: apps/frontend/src/routes/admin/+layout.server.ts:21 returns the binding 'session', which this module took straight out of 'safeGetSession()', as the 'session' member of a server load's returned object (D10-C13). Everything a server load returns is serialised into the hydration payload in the HTML body, so this puts an access token and a long-lived REFRESH TOKEN into the document of every page under this route, for every signed-in user. Return the PROJECTION instead — '{ userId, expiresAt }', taking the identifier from the separately VERIFIED user 'safeGetSession()' also returns — exactly as 'apps/frontend/src/routes/admin/+layout.server.ts' does, and read that file's docstring for the reason.
    session
No-session-in-server-loads guard (phase 158: D10-C13) — 10 module(s), 460 line(s) scanned; 1 violation(s) in the real corpus; self-test flagged 5 line(s) in scripts/fixtures/assert-no-session-in-loads.input.ts (matching the committed expectation); 1 violation(s) in total.
```

**Read both halves.** The count is **1**, not 2. The line that WAS flagged is D1's, in the admin
load. D2's plant — a `session` member returned out of a corpus module in the same run — is not in
the output anywhere. Check 1 is therefore a PAIR test and not two independent greps, which is what
keeps the real `routes/candidate/(protected)/+layout.server.ts` silent: that load genuinely
destructures a session for its own guard and returns none of it, and a two-grep implementation
would have flagged it on the day it landed.

**A false positive this control caught before the guard shipped.** The first implementation
collected session bindings per FILE rather than per BLOCK, and flagged the guard's own fixture at
`assert-no-session-in-loads.input.ts:67` — a negative case in which `session` is read off
`url.searchParams` in a function that has no verified-session call in it at all. The binding
destructured in an *earlier* function was still in the file-scoped set. `enclosingBlock()` and the
`inScope` filter were written in response, and the fixture's expected-violations list is what
records the outcome: five lines, not six.

### D3 — Check 2's comment blindness, both halves in one run

| Field | Value |
|---|---|
| **Negative half** | `apps/frontend/src/routes/+layout.server.ts:16` — the root server loader's docstring, which names `access_token` and `refresh_token` IN PROSE as part of the explanation for why the session is not there. Untouched. |
| **Positive half** | `const echoedToken: string \| null = session?.access_token ?? null;` planted at `apps/frontend/src/routes/candidate/+layout.server.ts:21`. |
| **Run** | 1 violation, **exit 1**. |
| **Removed** | `git checkout -- apps/frontend/src/routes/candidate/+layout.server.ts`. |
| **Re-run** | 0 violations, **exit 0**. |

**Observed output, verbatim, one run:**

```
No-session-in-server-loads guard (phase 158: D10-C13) — corpus: 10 server-load module(s) under apps/frontend/src/routes (floor 10).
[ERROR] scripts/assert-no-session-in-loads.mjs: apps/frontend/src/routes/candidate/+layout.server.ts:21 names the credential field 'access_token' in CODE inside a server load module (D10-C13). A server load's return value is serialised into the HTML body; a credential named here is one edit away from being in it. Naming it in a COMMENT is fine and is deliberately not flagged — the root server loader's docstring explains the whole class in prose. If a credential genuinely must be read server-side, read it somewhere that is not a load, and never return it.
    const echoedToken: string | null = session?.access_token ?? null;
No-session-in-server-loads guard (phase 158: D10-C13) — 10 module(s), 465 line(s) scanned; 1 violation(s) in the real corpus; self-test flagged 5 line(s) in scripts/fixtures/assert-no-session-in-loads.input.ts (matching the committed expectation); 1 violation(s) in total.
```

The count is **1**. `routes/+layout.server.ts:16` is not in it, and that line does carry the field
names — proven by an instrument outside the guard, in the same tree:

```
$ grep -nE 'access_token|refresh_token' apps/frontend/src/routes/+layout.server.ts | cut -c1-140
16: * This load used to return `locals.safeGetSession()`'s whole `Session` — `access_token`, **`refresh_token`**, `expires_at` and the full
```

**The second half of D3, and it revises the plan's own estimate upward.** The plan predicted that
an unfiltered scan would wrongly flag ONE file. Measured, with `maskComments` temporarily stubbed
to `return source` and NO plant anywhere in the tree:

```
[ERROR] … apps/frontend/src/routes/+layout.server.ts:16 names the credential field 'access_token' …
[ERROR] … apps/frontend/src/routes/+layout.server.ts:16 names the credential field 'refresh_token' …
[ERROR] … apps/frontend/src/routes/admin/+layout.server.ts:8 names the credential field 'access_token' …
[ERROR] … apps/frontend/src/routes/admin/+layout.server.ts:8 names the credential field 'refresh_token' …
[ERROR] … apps/frontend/src/routes/candidate/+layout.server.ts:8 names the credential field 'access_token' …
[ERROR] … apps/frontend/src/routes/candidate/+layout.server.ts:8 names the credential field 'refresh_token' …
No-session-in-server-loads guard (phase 158: D10-C13) — 10 module(s), 463 line(s) scanned; 6 violation(s) in the real corpus; self-test flagged 9 line(s) in scripts/fixtures/assert-no-session-in-loads.input.ts (NOT matching the committed expectation); 7 violation(s) in total.
```

**Exit 1. Six violations, against three files, every one of which is correct** — and two of the
three are the loads this very plan narrowed, because their new docstrings explain the class in the
same prose the root loader does. The stub was restored from a pre-edit copy and the run returned
to 0 violations, exit 0. Note also that the fixture count moved 5 → 9 in that run: the fixture's
own docstring names both fields in prose on purpose, precisely so that a broken mask is visible
there too.

### D4 — Check 0's anti-vacuity

| Field | Value |
|---|---|
| **Control** | `ROUTES_DIR_REL` repointed from `apps/frontend/src/routes` to `apps/frontend/src/lib/cookies`, a real directory that contains no server-load module. |
| **Planted at** | `scripts/assert-no-session-in-loads.mjs`, one constant. |
| **Run** | 4 violations and an explicit refusal, **exit 1**. |
| **Removed** | The constant restored from a pre-edit copy of the file. |
| **Re-run** | `corpus: 10 server-load module(s) under apps/frontend/src/routes (floor 10)` … `0 violation(s) in total`, **exit 0**. |

**Observed output, verbatim (message bodies truncated at 300 columns for width; the head of each
line is exact):**

```
No-session-in-server-loads guard (phase 158: D10-C13) — corpus: 0 server-load module(s) under apps/frontend/src/lib/cookies (floor 10).
[ERROR] scripts/assert-no-session-in-loads.mjs: 'apps/frontend/src/lib/cookies' contains no server-load module, so every check below would report a vacuous zero. Either the route tree moved, in which case update ROUTES_DIR_REL in this file, or the corpus is genuinely gone, in which case this guard h…
[ERROR] scripts/assert-no-session-in-loads.mjs: the anchor 'apps/frontend/src/lib/cookies/+layout.server.ts' is not in the scanned corpus. This guard is therefore scanning something other than the route tree it was written for, and its zero would be vacuous. Update ANCHOR_FILES in this file when the…
[ERROR] scripts/assert-no-session-in-loads.mjs: the anchor 'apps/frontend/src/lib/cookies/admin/+layout.server.ts' is not in the scanned corpus. …
[ERROR] scripts/assert-no-session-in-loads.mjs: the anchor 'apps/frontend/src/lib/cookies/candidate/+layout.server.ts' is not in the scanned corpus. …

scripts/assert-no-session-in-loads.mjs: CHECK 0 FAILED — the corpus is not the one this guard was written for, so no result below is evidence. Refusing to report a clean scan over a broken corpus.
```

**The corpus size is printed on the failing run too**, as `0`, which is the property that makes
the whole guard readable: a run's first line always says how much it looked at. And the script
**refuses to continue** — checks 1, 2 and 3 do not run at all, so no zero from a broken corpus can
be mistaken for a clean tree.

### Section D closing state

```
$ git status --porcelain apps packages tests scripts
(empty)

$ node scripts/assert-no-session-in-loads.mjs
No-session-in-server-loads guard (phase 158: D10-C13) — corpus: 10 server-load module(s) under apps/frontend/src/routes (floor 10).
No-session-in-server-loads guard (phase 158: D10-C13) — 10 module(s), 463 line(s) scanned; 0 violation(s) in the real corpus; self-test flagged 5 line(s) in scripts/fixtures/assert-no-session-in-loads.input.ts (matching the committed expectation); 0 violation(s) in total.
exit 0
```

No plant survives. Every plant was removed by `git checkout --` on the single file it touched, or
by restoring the guard from a pre-edit copy; no blanket working-tree reset was used, `git clean`
was not run, and `git stash` was not used.

---

## Section E — OB-1 controls: the subtree cookie-load spec, and the concurrency claim itself (D10-C08, D10-C11)

Appended by plan 14. **This section does not test a lint-chain guard**, which is what sections A–D
do; it records controls for a unit spec and for a *behavioural* claim — that de-serialising a
nested load actually deconflicts it. Both belong here for the same reason the guard controls do:
neither the spec's zero nor the plan's "runs in parallel again" means anything unless the same
instrument was seen producing the other answer.

Nothing in this section changes the sign-off baseline of nine plants; the completeness table's
own note invites later plans to append sections of their own.

| # | Control | What it targets | Planted at | Observed result | Removed, green again |
|---|---|---|---|---|---|
| E1 | Both subtree loads stubbed to `return { supabaseCookies: [] }` — the vacuity shape a broken filter actually produces. | Whether the spec's absence assertions can pass trivially. | both new `+layout.server.ts`, before the real filter was written | **9 of 15 failed.** Every case carrying a positive control failed; the 6 that passed are the two registry lemmas (which drive no load) and the two per-load cases whose *expected* answer genuinely is `[]`. | Real filter written; **15/15**. |
| E2 | Both subtree loads stubbed to spell `startsWith('sb-')` instead of reading the injected constant. | Whether the spec detects a *spelled prefix literal* — `OB-1`'s named fail-open shape — as opposed to only an empty array. | both new `+layout.server.ts` | **7 of 15 failed**, including, by name, `excludes a decoy that begins with the vendor prefix but is not the storage key` on both loads. Note the contrast with E1: the concurrency case now PASSES, so the two controls fail different sets and neither is a proxy for the other. | Constant restored; **15/15**. |
| E3 | The plan's comment-filtering grep run over a fixture whose only `await parent()` occurrences sit on an indented `//` line and on a docstring ` * ` line, plus one on a code line. | Whether `grep -v "^\s*[*/]"` actually strips comments on this platform's grep (`\s` is not POSIX BRE). | `/tmp` fixture, never in the tree | Unfiltered **3**, comment-filtered **1**. The filter works; a 0 from it is not a 0 from a broken pattern. | n/a — fixture only. |
| E4 | The same comment-filtered grep run over `HEAD~2`'s copy of the real universal load, i.e. the file *before* this plan. | Whether the post-change 0 is attributable to the change. | `git show HEAD~2:…/argument-condensation/+layout.ts` | **1** before, **0** after. | n/a — read-only. |
| E5 | Positive control for the spelled-prefix grep: the new server load with `SUPABASE_COOKIE_PREFIX` replaced by `'sb-'`. | Whether the acceptance grep would fire at all. | `/tmp` copy, never in the tree | **1**; the real pair reports **0**. | n/a — copy only. |
| E6 | Two live route arms, in ONE run on ONE server: an `await parent()` child and an own-`+layout.server.ts` child, both under a 400 ms blocking ancestor. | **The concurrency claim itself.** See below. | `apps/frontend/src/routes/__ob1probe/`, one-off dev server, `FRONTEND_PORT=5273` | Serialised arm: child work starts at the blocker's **END**. Parallel arm: child work starts at the blocker's **START**, 401 ms of measured overlap. Verbatim below. | Probe directory deleted; `git status` clean apart from the plan's own files. Port 5273 released; the user's `:5173` server and the database were never touched. |

### E6 — the overlap, measured rather than inferred

`OB-1` is a claim about *concurrency*, and a rendered page proves nothing about it: the page
renders whether the loads overlap or not. The unmeasured link in the chain was never our code —
it was the framework: **does a nested universal load that omits `await parent()` genuinely start
before its ancestor finishes, in this SvelteKit version?** Every argument in this phase rests on
that, and nobody had watched it.

Both arms were built to be identical except for the one line under test, and both ran against the
same server process in the same minute, so the difference is attributable to that line and to
nothing else.

- **Blocker** (`__ob1probe/+layout.ts`): logs `blocker:start`, awaits 400 ms, logs `blocker:end`.
- **Arm A** (`__ob1probe/await-parent/+layout.ts`): `await parent()`, then logs `awaitParent:workStart`.
- **Arm B** (`__ob1probe/own-data/`): its own `+layout.server.ts` returning `{ ownData: 'present' }`,
  and a `+layout.ts` that takes `data` and logs `ownData:workStart` with what it received.

**Observed, verbatim (epoch ms), two requests per arm:**

```
OB1PROBE {"tag":"blocker:start","t":1788340007320}
OB1PROBE {"tag":"awaitParent:enter","t":1788340007321}
OB1PROBE {"tag":"blocker:end","t":1788340007723}
OB1PROBE {"tag":"awaitParent:workStart","t":1788340007723}
OB1PROBE {"tag":"blocker:start","t":1788340009802}
OB1PROBE {"tag":"awaitParent:enter","t":1788340009802}
OB1PROBE {"tag":"blocker:end","t":1788340010204}
OB1PROBE {"tag":"awaitParent:workStart","t":1788340010204}
OB1PROBE {"tag":"blocker:start","t":1788340011245}
OB1PROBE {"tag":"ownData:enter","t":1788340011245}
OB1PROBE {"tag":"ownData:workStart","t":1788340011245,"got":"present"}
OB1PROBE {"tag":"blocker:end","t":1788340011646}
OB1PROBE {"tag":"blocker:start","t":1788340012686}
OB1PROBE {"tag":"ownData:enter","t":1788340012686}
OB1PROBE {"tag":"ownData:workStart","t":1788340012686,"got":"present"}
OB1PROBE {"tag":"blocker:end","t":1788340013088}
```

Read the deltas from `blocker:start` to the child's `workStart`:

| Arm | Run 1 | Run 2 | Reading |
|---|---:|---:|---|
| A — `await parent()` | **+403 ms** | **+402 ms** | The child's work begins at the blocker's end, to the millisecond. **Serialised.** |
| B — own `+layout.server.ts` | **+0 ms** | **+0 ms** | The child's work begins at the blocker's start and finishes 401 ms before it. **Overlapping.** |

Both arms `enter` at +0/+1 ms — SvelteKit *starts* every load concurrently in both shapes, so an
entry timestamp alone would have shown no difference and would have been the wrong instrument.
`awaitParent:workStart` is the one that moves.

`"got":"present"` is the mechanism in the same line as the timing: arm B already holds its own
server load's return at the moment it starts, which is exactly why it needs no ancestor.

### ⚠ What E6 does NOT establish, stated so a later plan does not over-read it

E6 measures the **framework mechanism** on purpose-built routes, not the admin route end to end.
The real `/admin/**` chain could not be driven here: `appGateHandle` bounces an unauthenticated
caller with **307 before any load runs**, so an authenticated admin session is required, and
creating one means writing an auth user and a `project_admin` row into the developer's database —
which this plan declined to do. The admin-route half is therefore carried by two facts measured
separately: E4 and the plan's comment-filtered greps establish that both admin feature loads have
arm B's shape (`await parent()` count **0**, comment-filtered, against **1** before the change),
and E6 establishes that arm B's shape overlaps. **The composition of the two is an inference, not
an observation**, and the observation belongs with criterion 11's admin E2E spec (`158-16`), which
will already be holding an authenticated admin session on the cold-entry path where it bites.

---

## Section F — response-seam and admin-job controls (OB-5 deliverables 2–4, operator ruling `thrown-pin`)

Appended by plan `158-15`. Sections A through E above are untouched.

**Read the arm first.** `158-SWALLOWED-ERROR-MEASUREMENT.md` records, from live observation, that
OB-5's stated mechanism does **not** reproduce at this HEAD: `UniversalAdapter.fetch` throws on a
refused response before `parseResponse` is ever handed one. The operator selected **`thrown-pin` +
the asymmetry**, with maximum consistency as the governing principle. The four rows below are that
answer's evidence, and each red half is the real defect rather than a synthetic stand-in.

| Row | What it establishes | Red half produced by |
|---|---|---|
| F1 | A refused response never reaches a parser, and the property is pinned rather than incidental | Deleting the adapter's refusal check |
| F2 | The parsing helper refuses a refused response ITSELF, rather than relying on its caller | The pre-change helper, run directly |
| F3 | An invalid job identifier is refused before any job machinery exists | Removing the guard from one of the two features |
| F4 | Both admin form actions answer an upstream failure with one shape, carrying no internal detail | The pre-change actions, run directly |

### F1 — the seam: delete the adapter's refusal check

1. **The control** — the whole `if (isRefusedResponse(response)) { … throw … }` block deleted from
   `UniversalAdapter.fetch`, so a refused response is returned to `get`/`post` and handed onward.
2. **Where** — `apps/frontend/src/lib/api/base/universalAdapter.ts`, inside `fetch`.
3. **The command** — `yarn workspace @openvaa/frontend vitest run src/lib/api/base/universalAdapter.test.ts`
4. **The observed failure, verbatim:**

   ```
   × UniversalAdapter > the refusal seam > get: a refused response never reaches the parser
     → expected "parseResponse" to not be called at all, but actually been called 1 times
   × UniversalAdapter > the refusal seam > delete: a refused response never reaches the parser
     → expected "parseResponse" to not be called at all, but actually been called 1 times
   × UniversalAdapter > the refusal seam > post: a refused response never reaches the parser
     → expected "parseResponse" to not be called at all, but actually been called 1 times
   × UniversalAdapter > the refusal seam > put: a refused response never reaches the parser
     → expected "parseResponse" to not be called at all, but actually been called 1 times
   × UniversalAdapter > the refusal seam > fetch refuses '403 Forbidden' exactly when the shared predicate does
     → promise resolved "{ ok: false, status: 403, …(1) }" instead of rejecting
   ```

   Ten cases failed in all: the four verb pins, the three refusing rows of the predicate-agreement
   table, and the three pre-existing not-ok cases that have guarded this line since before the phase.

   **The pin names the parser, which the pre-existing case cannot.** `should throw error when
   response is not ok` also went red here — but only because *nothing* was thrown. Had the check been
   moved to *after* the parse rather than deleted, that case would have stayed green while the
   refusal's body had already been handed to a parser. The four `never reaches the parser` cases are
   the ones that fail in both shapes.

   **A second reading, worth recording.** Even with the adapter's check gone, the caller still
   received an error — raised by `parseResponse`'s own new contract. That is the whole point of
   deliverable 2: the class is now closed at two independent layers, and this row is the observation
   that the second layer holds when the first is removed.

5. **Removal confirmed green** — the file restored from a pre-plant copy; same command:
   `Test Files 1 passed (1) / Tests 48 passed (48)`.

### F2 — the parsing helper's own contract, run directly

1. **The control** — none planted. The red half is the **pre-change helper itself**, called directly
   with a refused response, with no adapter in the frame.
2. **Where** — `apps/frontend/src/lib/api/utils/parseResponse.ts` at commit `aa1f2c620` (the spec's
   RED commit, before `6788813a2` landed the refusal).
3. **The command** — `yarn workspace @openvaa/frontend vitest run src/lib/api/utils/parseResponse.test.ts`,
   plus one throwaway probe spec (removed; the tree was verified clean afterwards) that printed the
   returned value rather than asserting on it.
4. **The observed failure, verbatim** — nine cases failed:

   ```
   × parseResponse > refusing a response the server refused > throws instead of parsing a refused json response, and never calls the parser
     → expected [Function] to throw an error
   × parseResponse > refusing a response the server refused > refuses before it validates the parser, so no refused response can reach the switch
     → expected [Function] to throw error matching /refused/i but got 'Invalid parse option: invalid'
   × parseResponse > refusing a response the server refused > parseResponse refuses '403 Forbidden' exactly when the shared predicate does
     → expected [Function] to throw an error
   ```

   **The VALUE the pre-change helper returned**, printed by the probe rather than described:

   ```
   ROW2-RETURNED-VALUE: {"error":"Forbidden"}
   ```

   That is a 403's body, handed back as an ordinary parsed value, by the helper, on a direct call.
   It is the evidence that the class existed **at the helper** and was closed only by the arrangement
   of its two callers.

5. **Removal confirmed green** — the refusal landed at `6788813a2`; same command:
   `Test Files 1 passed (1) / Tests 20 passed (20)`.

### F3 — the job-identifier guard, removed from one feature

1. **The control** — `assertValidJobId(jobId);` deleted from `condenseArguments` only, leaving its
   sibling `generateQuestionInfo` intact, so the run also shows that the two features are asserted
   independently rather than from one shared shortcut.
2. **Where** — `apps/frontend/src/lib/server/admin/features/condenseArguments.ts`, first statement.
3. **The command** — `yarn workspace @openvaa/frontend vitest run src/lib/server/admin/features/adminJobLifetime.test.ts`
4. **The observed failure, verbatim:**

   ```
   × … > condensation: rejects 'an absent' jobId ahead of the pipeline, the recorder and the writer
     → expected [Function] to throw error matching /jobId/ but got 'the data load must not be reached at …'
   × … > condensation: rejects 'an empty' jobId ahead of the pipeline, the recorder and the writer
     → expected [Function] to throw error matching /jobId/ but got 'the data load must not be reached at …'
   × … > condensation: rejects 'a whitespace-only' jobId ahead of the pipeline, the recorder and the writer
     → expected [Function] to throw error matching /jobId/ but got 'the data load must not be reached at …'
   ```

   Exactly the three condensation cases; the three `questionInfo` cases stayed green, which is the
   per-feature discrimination the spec was written for.

   **The identifier reaching the pipeline controller, observed rather than inferred.** The failure
   above stops at the throw assertion, which is upstream of the ordering assertions. So the red half
   was re-run once more with that first assertion relaxed to a `.catch(…)`, leaving the ordering
   assertions to speak. The pipeline-controller record then read, verbatim:

   ```
   × … > condensation: rejects 'an absent' jobId …        → expected [ undefined ] to deeply equal []
   × … > condensation: rejects 'an empty' jobId …         → expected [ '' ] to deeply equal []
   × … > condensation: rejects 'a whitespace-only' jobId … → expected [ '   ' ] to deeply equal []
   ```

   `new PipelineController(undefined)`, `new PipelineController('')` and `new PipelineController('   ')`
   were all constructed. That is the defect in one line.

5. **Removal confirmed green** — both files restored from pre-plant copies; same command:
   `Test Files 1 passed (1) / Tests 11 passed (11)`.

### F4 — the two admin form actions' divergent failure shape

This row is the operator ruling's deliverable 3, which was **not** in OB-5 — it was found by
`158-12` Task 1's live measurement and folded into the ruling under "maximum consistency".

1. **The control** — none planted. The red half is the **pre-change actions themselves**, driven as a
   verified admin against a job-start endpoint that refuses with 409 and with 500, so the gate is not
   what is under test.
2. **Where** — `apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts` and
   its sibling `question-info/+page.server.ts`, at commit `60081e5a0` (the spec's RED commit).
3. **The command** — `yarn workspace @openvaa/frontend vitest run src/lib/server/admin/requireAdminIdentity.test.ts`
4. **The observed failure, verbatim** — four cases failed; the deep-equal diff carries the asymmetry:

   ```
   AssertionError: expected { type: 'error', …(1) } to deeply equal { type: 'error', …(1) }

   - Expected
   + Received

     {
   -   "error": "Internal server error",
   +   "error": "Error with UniversalAdapter.fetch when parsing response from '/api/admin/jobs/start': 409 • An active job for this feature is already running",
       "type": "error",
     }
   ```

   and the leak itself:

   ```
   × … > neither action lets the adapter-internal detail reach the caller on a 409
     → expected '{"type":"error","error":"Error with U…' not to match /UniversalAdapter|\/api\/admin\//
   ```

   The received string is `argument-condensation`'s; `question-info` produced the expected generic
   string for the identical failure. One sibling leaked an internal class name and an internal API
   route to the client; the other did not; neither reported anything a caller could act on.

   **Anti-vacuity.** The pattern standing for "internal detail" is itself asserted, in its own case,
   against the message the adapter actually produces — so a non-match in the two cases above is the
   action withholding the detail, not a pattern that could never have seen it.

5. **Removal confirmed green** — the harmonisation landed at `fcc21f55f`; same command:
   `Test Files 1 passed (1) / Tests 22 passed (22)`.

### The census reconciliation — two numbers, one subject, and why they differ

| | Trial census (`158-12` § 3) | Landed census (`158-15`) |
|---|---|---|
| Shape applied to `parseResponse` | `Promise<{ok:true;value:unknown} \| {ok:false;status:number}>` — a discriminated result callers must narrow | a **throw**, ahead of the parser switch; the return type is untouched |
| Command | `yarn typecheck --force` | `yarn typecheck --force` |
| Result | **exit 1** — `svelte-check found 11 errors and 0 warnings in 2 files` | **exit 0** — `svelte-check found 0 errors and 0 warnings`, 22/22 tasks |
| Call sites requiring an edit | **11**, in `universalDataWriter.ts` and `apiRouteAdapter.ts` | **0** |

**They differ because the two censuses measure two different changes, not because either is wrong.**
The trial measured the *discriminated-result* shape; the operator selected the *throw* shape. A throw
does not alter `ParsedResponse<TParser>`, so no `as SomeDomainType` cast at any call site is
invalidated and the compiler has nothing to reject. The trial's 11 remains the correct answer to the
question it was asked — "who must change if the seam returns a result" — and stands as the recorded
cost of the arm that was not taken.

**Both of the trial's caveats survive and are re-stated, because a zero here is easy to over-read.**

- The trial's **11 was a floor, not a ceiling**: every rejected site was an `as SomeDomainType` cast
  acting as a firewall, so changing the writers' declared return types too would have grown it. That
  caveat is about the arm not taken.
- The landed **0 is not a claim that nothing is affected**. It is the compiler's answer to "which
  call site fails to type-check", and a throw is invisible to the type system by construction. What
  establishes that no consumer broke is the *runtime* evidence, run alongside it: the full frontend
  unit suite, **80 files / 1540 tests, all passing**, up from 1502 at the wave-5 baseline with no
  pre-existing case altered.
- The trial covered only the `'json' | undefined` arm. The landed change covers **all four parser
  arms**, including `'text' | 'blob' | 'none'`, because the refusal sits ahead of the switch rather
  than inside one of its cases — so on this axis the landed change is *wider* than the trial's, even
  though its census is smaller.

### Section F closing state

| Gate | Result |
|---|---|
| `yarn typecheck --force` | exit 0 — 22/22 tasks, `svelte-check found 0 errors and 0 warnings` |
| `yarn workspace @openvaa/frontend test:unit` | exit 0 — **80 files, 1540 tests passed** |
| `yarn lint:check` | exit 0 — all chained guards clean |
| `git status --porcelain apps packages tests scripts` | *(empty)* — every plant removed |
| `grep -cE 'setTimeout\|setInterval\|vi\.useFakeTimers\|Promise\.race' …/adminJobLifetime.test.ts` | **0** — no ordering construct entered a file whose docstring records that it has none |

Collected case counts, before this plan and after:

| Spec | Before | After |
|---|---:|---:|
| `parseResponse.test.ts` | 9 | 20 |
| `universalAdapter.test.ts` | 34 | 48 |
| `adminJobLifetime.test.ts` | 3 | 11 |
| `requireAdminIdentity.test.ts` | 18 | 22 |
| frontend unit suite, total | 1502 | 1540 |

No pre-existing case was removed or had an assertion changed. Eight fixtures in
`parseResponse.test.ts` gained `ok: true` — a field every real `Response` carries and these partial
mocks omitted; the assertions above them are byte-identical.

---

## Section G — the admin job's own credential (D10-C12)

Appended by plan `158-17`. Sections A through F above are untouched.

**What changed, so the red halves below can be read.** Until `6888a531c` each long-running admin
job built its writer from the INITIATING REQUEST's client — the cookie-bearing `createServerClient`
`hooks.server.ts` puts on `event.locals` — and held it for a run measured in minutes, on a response
the job outlives. It now resolves the verified session ONCE at job start and builds its own client
from that session's credential, with session persistence and automatic renewal both disabled and no
storage adapter at all.

**The red half of both mechanism rows IS the coupling itself.** Neither is a synthetic plant: the
rows below were observed against the real pre-change construction, restored byte-for-byte from
`f6ff905ec` with `git show f6ff905ec:<path> > <path>`, and the change restored with
`git checkout HEAD -- <path>` afterwards (`git diff --stat HEAD` empty).

| Row | What it establishes | Red half produced by |
|---|---|---|
| G1 | Every writer call a job makes executes under the token the job's own session lookup returned | The pre-change construction, which built the writer from the request's client |
| G2 | No write to the request's session store is attempted anywhere on the job's path | The same pre-change construction, whose client carries an adapter onto that store |
| G3 | The SERVED application executes the new module, and the admin end-to-end spec is the instrument that sees it | An unconditional raise planted in `createSupabaseJobClient` |

Command used for G1 and G2:

```
yarn workspace @openvaa/frontend vitest run src/lib/server/admin/features/adminJobLifetime.test.ts
```

Collected case count: **11 before this plan, 17 after** (three new cases, each run against both
features). Baseline before the new cases: 11 tests, 11 passed.

### G1 — the credential: the pre-change construction, restored

| Field | Value |
|---|---|
| **Control** | Both job features restored to their pre-change construction, in which the writer and the data reads are built from the initiating request's `source` rather than from a client of the job's own. |
| **Planted at** | `apps/frontend/src/lib/server/admin/features/condenseArguments.ts` and `generateQuestionInfo.ts`, restored from `f6ff905ec` (verified: `grep -c 'createAdminWriter(source)'` printed `1` for each). |
| **Run** | 17 tests, **10 failed** / 7 passed. |
| **Observed failure** | `condensation: every writer call executes under the token the session lookup returned` — `AssertionError: expected [] to deeply equal [ 'A' ]`, with `- [ "A", ]` expected and `+ []` received: the pre-change job never asked the verification path at all. The same assertion failed identically for `questionInfo`. The pre-existing isolation case reported the credential itself: `- "observedTag": "job:session-token-of-B"` against `+ "observedTag": "request:B"`. |
| **Removed** | `git checkout HEAD -- apps/frontend/src/lib/server/admin/features/{condenseArguments,generateQuestionInfo}.ts`; `git diff --stat HEAD` for both paths printed nothing. |
| **Re-run** | 17 tests, **17 passed**. |

### G2 — the session store: the same restoration, the other field

| Field | Value |
|---|---|
| **Control** | The same restored pre-change construction. One control, two independent readings — the fake records both fields on every write, so neither row needs its own plant. |
| **Planted at** | As G1. |
| **Run** | 17 tests, **10 failed** / 7 passed (the same run as G1). |
| **Observed failure** | `condensation: no write to the request’s session store is attempted on the job’s path` — `AssertionError: expected [ { jobId: 'job-A', …(1) } ] to deeply equal [ { jobId: 'job-A', …(1) } ]`, diffing `- "carriesJarAdapter": false` against `+ "carriesJarAdapter": true`. Identical for `questionInfo`. |
| **Removed** | As G1. |
| **Re-run** | 17 tests, **17 passed**. |

### G3 — the served application: an unconditional raise in the job-client factory

**Why this row exists.** G1 and G2 are unit-level: they prove the JOB chose a different source. They
do not prove the SERVED application executes the new module, and they cannot — a green end-to-end
run against a stale module graph is indistinguishable from a green one against a live graph. This
row is that distinction, measured.

| Field | Value |
|---|---|
| **Control** | `if (true) throw new Error('PLANT-158-17: the served application reached createSupabaseJobClient.');` inserted at the head of the factory body. |
| **Planted at** | `apps/frontend/src/lib/supabase/job.ts`. |
| **Run** | `npx playwright test -c ./tests/playwright.config.ts ./tests --project=admin-access --no-deps --reporter=list`, against `admin_jobs` emptied first. **1 failed.** |
| **Observed failure** | `Error: exactly one admin_jobs row, authored by this run's admin, recording the failure it caused — an empty array means the submission reached one of the two branches that complete without writing`, diffing the expected single row against `+ Array []`. The dev server's own log carried the plant by name: `[Admin App argument condensation] PLANT-158-17: the served application reached createSupabaseJobClient.`, immediately after `[vite] (ssr) page reload src/lib/supabase/job.ts`. |
| **Removed** | `git checkout HEAD -- apps/frontend/src/lib/supabase/job.ts`; `git diff --stat HEAD` printed nothing. |
| **Re-run** | 1 passed (4.3s), and the row is present: `select count(*), author, end_status from admin_jobs group by author, end_status` returned `1 \| test-e2e-admin@test.openvaa.local \| failed`. |

**⚠ THE FIRST ATTEMPT AT G3 WAS VACUOUS, and the reason is worth carrying.** Run with the plant in
place but WITHOUT emptying `admin_jobs` first, the spec **passed**. It passed because the read-back
filters on `author` and `election_id` and matched the row the PREVIOUS run of the same loop had
left: the `--no-deps` loop has no teardown, so a planted run is scored against its predecessor's
row. The response-envelope assertion above the read-back cannot separate the two cases either —
"the job raised before writing anything" and "the job wrote its row and then raised" both produce
`{transport: 200, type: 'failure', status: 500, generic: true}`. Emptying `admin_jobs` between runs
is what makes the loop's job-write assertion mean anything.

**⚠ A SECOND `--no-deps` HAZARD, also measured.** After the planted run, three consecutive
UNPLANTED runs failed the same way — and the dev server's log showed the reason was not the code
under test: `Error with UniversalAdapter.fetch when parsing response from '/api/admin/jobs/start':
409`. The action starts its job in an IN-MEMORY store before calling the feature; the planted run
raised before the job recorder existed, leaving that job registered and running forever, so every
later start conflicted. The residue lives in the dev-server process and is cleared only by
restarting it. A `--no-deps` loop that has once gone red needs a server restart before its next
green means anything.

### The end-to-end gate, before and after

The plan requires this gate on BOTH sides of the change, because a mechanism change to a credential
path run only afterwards proves the tree is green rather than that this change kept it green.

```
npx playwright test -c ./tests/playwright.config.ts ./tests --project=admin-access --grep-invert @probe
```

`--reporter=list` was appended to both runs, and only that. It changes what is printed, not what is
selected: the project, the grep and the config are the plan's own.

| | BEFORE | AFTER |
|---|---|---|
| Tree | `56a5608f4` — this plan's HEAD, before any of its commits | this plan's work, through `6888a531c` plus the uncommitted task-3 spec |
| Prerequisite | `yarn db:reset` (plain), one warm dev server on `:5173` | the same, re-established |
| Result | **130 passed (10.3m)**, exit 0 | **130 passed (10.6m)**, exit 0 |
| `admin-access` itself | ✓ in 1.6s | ✓ in 1.7s |
| Its teardown | ✓ | ✓ — `remove the admin identity and the job rows it caused` |

Same command, same prerequisites, same collected count, zero failures on either side. The AFTER run
was taken on a dev server restarted and warmed for it, because the `--no-deps` debugging loop above
had left an unreachable job in the in-memory store — see the second hazard note in G3.

**Why the BEFORE run is 130 tests rather than one.** `admin-access` takes a dependency edge on the
tail of the perm serial chain, so an isolated `--project=admin-access` invocation pulls the whole
chain transitively. That cost is recorded in `158-ADMIN-E2E-SCHEDULING.md` as accepted.

**A false start, recorded so the number is not misread.** The BEFORE run was first attempted after
`yarn db:reset-with-data` and was killed at 2 failures (`eperm07-term-trigger`, `voter-journey`) —
the known default-template contamination the 157.2 deferred-items file describes, in which the
voter app sees two elections. The recorded BEFORE is the re-run after a plain `yarn db:reset`, which
is what this plan's own precondition asks for.

---

## Closing audit — the gate's own reading of this ledger

**Written by:** `158-09`, Task 2, at HEAD `c074bb04d`, branch `integration/ship-12-squash`.
**Method:** an audit, not a re-run. Sections A–G are untouched by this section; nothing above this
line was edited.

### The count, taken from the ledger's own headings rather than from a plan

`158-09-PLAN.md`'s amended acceptance criterion asserts **twenty-one** controls and enumerates them
as *"nine from the route, cookie and login work, three from the application-gate table, four from
the session-projection guard, three from the response-seam and job-identifier work, and two from
the job-credential change."* The criterion also instructs the auditor to verify the count **against
the ledger's own section headings** and to *"report any discrepancy rather than reconciling it
silently."* It is reported here.

**The measured count is THIRTY.**

| Section | Subject | Controls | Plan's figure | Delta |
|---|---|--:|--:|--:|
| A | route-pattern (`REVIEW-RT-04`) | 3 | — | — |
| B | cookie-name (`REVIEW-RT-02`) | 6 | — | — |
| A + B together | the "route, cookie and login work" | **9** | 9 | 0 |
| C | app-gate table (`D10-C09`) | **4** | 3 | **+1** |
| D | session projection (`D10-C13`) | **4** | 4 | 0 |
| E | OB-1 subtree loads + the concurrency claim | **6** | *absent* | **+6** |
| F | response seam / job identifier (OB-5 2–4) | **4** | 3 | **+1** |
| G | job credential (`D10-C12`) | **3** | 2 | **+1** |
| **Total** | | **30** | 21 | **+9** |

`21 + 1 + 6 + 1 + 1 = 30`. The arithmetic closes on the four discrepancies rather than leaving a
residue, which is what distinguishes a miscount from a missing control.

**Two counting instruments, agreeing.** Neither alone is sufficient, and the reason is worth
recording because it is the same instrument failure this phase has hit repeatedly:

1. **`### <ID> —` headings: 24.** This UNDERCOUNTS by six. Section D's heading `### D1 — Check 1's
   pair matcher, and D2 — its precision, in ONE run` carries two controls under one heading, and
   Section E gives a `###` heading only to `E6`, carrying `E1`–`E5` as rows of its summary table.
2. **Table rows whose first cell is a control id (`^\| *[A-G][0-9]+ *\|`): 23** — B 6, D 4, E 6,
   F 4, G 3. This UNDERCOUNTS differently, missing A and C entirely because those sections carry
   their controls as headings with no summary table.

Neither instrument sees all thirty; the union of the two does, and each section's count was then
read back against its own prose. **The plan's own first `<automated>` verify, `grep -cE '^\|'`,
returns 226 — it counts every table line in the file, including 33 header/separator rows and every
non-control table. It is a formatting census, not a control count, and it is reported here as a
WEAK GATE rather than leaned on.**

### The four field checks

| Check | Instrument | Result |
|---|---|---|
| Every row quotes an OBSERVED output, not a predicted one | `grep -cE '\b(would fail\|will fail\|should fail\|is expected to\|expected to fail)\b'` over the whole ledger | **0** — no conditional or future phrasing survives anywhere in the file |
| Section B's shape: four red-then-green plants, two green negative controls | B1–B4 are plants; B5 (the Supabase SSR bridge, exempt by SHAPE not by path) and B6 (the rewritten client-side write) are the two green negative controls | **holds as the criterion states** |
| No plant residue in the source, test or script trees | `git status --porcelain apps packages tests scripts` | **empty** |
| The `__ob1probe` route directory Section E planted is gone | `ls -d apps/frontend/src/routes/__ob1probe` | **No such file or directory** |

### Both edge-coverage arithmetics, computed from their own ledgers — reported SEPARATELY, never summed

**Criteria 1–7** (`158-01-PLAN.md` § "Edge-coverage ledger"): the table carries **14** numbered
rows; rows 7 and 14 are marked `unresolved — flagged assumption`. So **14 == 12 authored + 2
flagged.** ✓ — matches the plan's assertion exactly.

**Criteria 8–13, the D10 widening** (`158-D10-DISPOSITIONS.md` § 2): `grep -cE '^\| *EDGE-'`
returns **26**, of which 4 are `flagged`. So **26 == 22 authored + 4 flagged.** The plan asserts
25 == 21 + 4; the dispositions ledger itself already records and justifies the divergence (the
plan's stated plan-range excluded `158-17`, which carries three `D10-C12` edges, and its in-range
authored count was two low). **The gate confirms the computed 26 and confirms the plan's own
`<automated>` floor of 25 is met.** The two totals are not added: 14 and 26 are censuses of
different populations.

### The full-suite result this ledger's guards were built for

Recorded here because sections A–G each end by claiming a guard works, and the suite is the only
evidence the guarded behaviour survived.

```
yarn test:e2e   →   153 passed (10.7m)     exit 0
                    0 failed · 0 flaky · 0 skipped · 0 did-not-run
```

Preflight: `E2E PREFLIGHT OK …/apps/frontend (verified against …/voting-advice-application-gsd)` —
the served application is provably this checkout. The three admin projects ran at positions
**124/153, 125/153 and 126/153**, precisely where `158-ADMIN-E2E-SCHEDULING.md`'s reading 2 placed
them.

### One thing this closing section does NOT establish

**The `PLAYWRIGHT_BANK_AUTH`-gated projects did not run**, here or anywhere since `158-03` rewrote
the cookie names. Section B's six controls prove the cookie-name GUARD fires; they do not prove the
OIDC cookie round trip still completes end to end, which is what `bank-auth` and
`bank-auth-journey` would show. That gap is logged, not closed — see `158-09-SUMMARY.md` § "The
bank-auth gap" and `WINDOWS.md`.
