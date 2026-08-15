# Phase 140 — Negative Control: the blind matchers, made able to fail

**Two runs per site, both halves observed on one machine in one session, against a byte-identical
injection.** Each F19 site was run once with the tree UNREPAIRED (to demonstrate that the pre-repair
`toBeDefined()` is blind to a live `null`) and once with the tree REPAIRED (to demonstrate that the new
matcher catches the same absence at its own line). Every outcome below traces to a captured log under
`${TMPDIR}/gsd-140/`; no outcome in this document was reconstructed, inferred or predicted.

- **Date:** 2026-08-15
- **Plan:** `140-01-PLAN.md` (wave 1) — later sections appended by `140-02`/`03`/`04`/`06`
- **Decisions discharged:** D-01 (F10 count = 136, derived from measurement not quotation), D-02 (F3 measures before it chooses a matcher), D-03 (no UI-SPEC — this phase ships no visual change)
- **Requirements:** ASSERT-02 (F3), ASSERT-03 (F19), ASSERT-05 (F9), ASSERT-06 (F10)
- **Precedent followed:** `.planning/phases/138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg/138-NEGATIVE-CONTROL.md` (which follows `137-NEGATIVE-CONTROL.md`, which follows `136-VISUAL-DISCRIMINATION-EVIDENCE.md`)

---

## 1. Why this run existed

The v2.15 milestone carries a standing acceptance rule, quoted verbatim from `.planning/STATE.md`:

> **Standing acceptance rule for every v2.15 phase:** prove the guard fails before claiming it guards —
> negative control run twice (once against the old assertion to demonstrate blindness, once against the
> new one to demonstrate the catch).

The ROADMAP success criterion this document's F19 lane discharges, blockquoted verbatim from
`.planning/ROADMAP.md` § Phase 140:

> 2. **F19** — removing the `request` / `client_assertion` value from each of the three fixtures makes
>    the assertion itself fail naming the missing parameter (not a downstream `TypeError` from the
>    following line), and passes under the old `toBeDefined()`. The two-run control is run at all three
>    sites.

**Why an observation must be written down.** A run does not survive the session that produced it. The
distinguishing fact in this control is not "the suite is green" — the suite was already green before
these edits, and the prohibition in `140-01-PLAN.md` forbids using greenness as the evidence. The
distinguishing fact is a *pair* of outcomes taken under the *same* injection, and a pair only exists if
both halves are recorded with enough detail — the assertion outcome, the file outcome, and the failing
`file:line` — that a reader can tell them apart. A single column collapses to the process exit code,
which in this corpus reports FAIL for both halves and therefore distinguishes nothing.

## 2. Environment

```
date (UTC):        2026-08-15T10:37:05Z
date (local):      2026-08-15 13:37:05 EEST
repo root:         /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:          568b1dfeae2cd5aa950b0f2a73f8aea96fbcf991
git branch:        feat-gsd-roadmap  (linked worktree)
git status:        scoped `-- apps tests packages` → empty at PRE-GATE and at every POST-GATE
OS:                macOS 26.5.1
kernel:            Darwin 25.5.0
Node:              v24.14.1
Yarn:              4.13.0
vitest:            3.2.4  (root hoist)
Vite:              7.3.0  (root hoist)
runner cwd:        <repo root>/apps/frontend
log directory:     ${TMPDIR}/gsd-140/   (OUTSIDE the repository, by design)
```

> **Why the dirty tracked files are inert to this control.** The bare `git status --porcelain` is
> non-empty in this worktree at session start: `.vscode/settings.json` and `supabase/.temp/cli-latest`
> are tracked and modified, and `.planning/STATE.md` is modified by the GSD orchestrator during
> execution. None is imported, read or executed by `vitest`, by the three test files under control, or
> by `apps/frontend/src/lib/api/utils/auth/providers/idura.ts`. The bare form is therefore **never a
> gate in this phase** — a gate that never passes is a gate that gets disabled. The gate that carries
> the claim is the scoped form `git status --porcelain -- apps tests packages`, which is Phase 138's
> precedent (`138-NEGATIVE-CONTROL.md` § 4.1) and which was empty at the PRE-GATE and at every
> POST-GATE recorded below.

### Port allocation

| Port | Held by | Role in this control |
|---|---|---|
| 5173 | an unrelated Docker container (pre-existing, not started by this phase) | **none** — no dev server was started |
| 54321/54323 | local Supabase, not started for this control | **none** — no database access |

**No port was bound by this control.** The F19 lane is pure `vitest` against mocked module boundaries:
`authorize-endpoint.test.ts:38-40,64-68` mocks `$lib/utils/constants`, and the token-exchange site stubs
`fetch` outright. There is no server, no database and no network. An `lsof` table would list nothing
this control owns, so none is reproduced; the honest statement is the one above.

> **The C-5 constraint, stated once and honoured throughout.** No `yarn dev`, `yarn test:e2e` or any
> Playwright command was run at any point in this plan. The injections strip live OIDC authentication
> material from production source (`idura.ts`); a concurrent E2E run would have gone red for a
> manufactured reason, and under the cardinal E2E rule — unwaived since Phase 138 closed
> `.planning/v2.14-CARDINAL-RULE-WAIVER.md` — that costs a debugging cycle to attribute. Plan `140-01`
> is deliberately alone in wave 1 and contains no E2E task.

## 3. The injection — rebuildable on any machine

### Prerequisites

```bash
cd /path/to/voting-advice-application-gsd
git rev-parse HEAD                                     # 568b1dfeae2cd5aa950b0f2a73f8aea96fbcf991
git status --porcelain -- apps tests packages          # MUST print nothing (HYGIENE-LOOP PRE-GATE)
mkdir -p "${TMPDIR:-/tmp}/gsd-140"
```

### The injection diff — site 1 and site 2 (shared)

One edit to the `authorizeUrl` construction at
`apps/frontend/src/lib/api/utils/auth/providers/idura.ts:74` is the regression for **both** site 1
(`authorize-endpoint.test.ts`, which reaches the provider through the route handler) and **site 2**
(`idura.test.ts`, which exercises the provider directly). Carried forward verbatim from
`139-VERDICTS.md` § 5.7.2, with the phase marker updated to `INJECTED (140)`:

```diff
  apps/frontend/src/lib/api/utils/auth/providers/idura.ts:74
-      `&request=${requestObject}`;
+      ``; // INJECTED (140): the JAR request object is dropped from the authorize URL
```

The signed request object is still constructed at `:57-69`; only its *delivery* to the authorize URL is
removed. The injection therefore removes the authentication material **in transit** rather than the code
that builds it — the narrowest form of the regression the finding names.

**Authentication-material handling.** This injection strips the JAR request object from a live OIDC
authorize URL. It was applied, run, and reverted inside the task that created it; it reached no commit,
no branch and no running process. The three-check POST-GATE below is what proves that, rather than
asserting it.

### The HYGIENE-LOOP, verbatim

```bash
# 1. PRE-GATE
git status --porcelain -- apps tests packages          # MUST print nothing
# 2. INJECT (diff above)
# 3. RUN, from inside the workspace, combined output to a log OUTSIDE the repo
cd "$(git rev-parse --show-toplevel)/apps/frontend" \
  && npx vitest run <file> 2>&1 | tee "${TMPDIR:-/tmp}/gsd-140/<site>.log"
# 4. REVERT
git checkout -- apps/frontend/src/lib/api/utils/auth/providers/idura.ts
# 5. POST-GATE — all three must hold
git status --porcelain -- apps/frontend/src/lib/api/utils/auth/providers/idura.ts   # (a) empty
git status --porcelain -- apps tests packages                                       # (b) empty
grep -rn 'INJECTED (140)' apps packages tests                                       # (c) no match
```

### What the knobs do, and the one that weakens the oracle

There is exactly one knob: **whether the tree is repaired**. Everything else — the injection bytes, the
invocation, the working directory, the runner version — is held identical between the two halves. That
is the whole design: if any second variable moved, a difference in outcome would not be attributable to
the repair.

**The knob that would weaken the oracle, named so it is visibly not used:** injecting
`client_assertion: undefined as unknown as string` instead of deleting the entry. Phase 139 measured
that `new URLSearchParams({ b: undefined })` stringifies to the four-character string `"undefined"`, so
`.get()` returns a non-empty string and the run would model a MALFORMED value rather than a MISSING one.
That variant is recorded as **rejected design R-6** in `139-VERDICTS.md` § 5.9.2 and is not used here.

---

## 4. RUN 1 — blindness: the pre-repair assertion

### 4.1 Provenance — proof the tree was genuinely unrepaired

RUN 1 was taken with `authorize-endpoint.test.ts` at its HEAD (`568b1dfe`) content, before any repair
edit. The three-line shape under control, verbatim with pre-repair line numbers:

```ts
143    const requestParam = url.searchParams.get('request');
144    expect(requestParam).toBeDefined();
145
146    // JWT has 3 dot-separated segments
147    const parts = requestParam!.split('.');
148    expect(parts).toHaveLength(3);
```

The mechanism, as matcher semantics: `URLSearchParams.get()` returns `string | null` — it returns
`null`, never `undefined`, for an absent parameter. `expect(null).toBeDefined()` **passes**, because
`toBeDefined()` fails only on `undefined`. There is no input to `url.searchParams.get('request')` for
which `:144` can fail.

### 4.2 The invocation, verbatim

```bash
mkdir -p "${TMPDIR:-/tmp}/gsd-140"
cd "$(git rev-parse --show-toplevel)/apps/frontend" \
  && npx vitest run src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts 2>&1 \
  | tee "${TMPDIR:-/tmp}/gsd-140/f19a-before.log"
```

### 4.3 Observed — verbatim, not paraphrase

Pasted unedited from `${TMPDIR}/gsd-140/f19a-before.log` (ANSI colour codes stripped, nothing else
changed):

```
 ❯ src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts (9 tests | 4 failed) 44ms
   ✓ POST /api/oidc/authorize > returns 200 with an authorizeUrl in the response 5ms
   ✓ POST /api/oidc/authorize > authorizeUrl contains client_id query parameter 1ms
   × POST /api/oidc/authorize > authorizeUrl contains a signed JWT request parameter 3ms
     → Cannot read properties of null (reading 'split')
   × POST /api/oidc/authorize > JAR is signed with RS256 algorithm 1ms
     → Invalid Token or Protected Header formatting
   × POST /api/oidc/authorize > JAR payload contains required OIDC fields 1ms
     → JWTs must use Compact JWS serialization, JWT must be a string
   × POST /api/oidc/authorize > JAR signature is verifiable with the signing public key 1ms
     → Compact JWS must be a string or Uint8Array
   ✓ POST /api/oidc/authorize > sets oidc_state cookie when provider returns state 2ms
   ✓ POST /api/oidc/authorize > sets oidc_nonce cookie when provider returns nonce 1ms
   ✓ POST /api/oidc/authorize > returns 400 when redirectUri is missing 1ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts > POST /api/oidc/authorize > authorizeUrl contains a signed JWT request parameter
TypeError: Cannot read properties of null (reading 'split')
 ❯ src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:147:33
    145| 
    146|     // JWT has 3 dot-separated segments
    147|     const parts = requestParam!.split('.');
       |                                 ^
    148|     expect(parts).toHaveLength(3);
    149|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/4]⎯

 Test Files  1 failed (1)
      Tests  4 failed | 5 passed (9)
```

**Benign stderr, recorded rather than diagnosed.** Every run of this file — clean, RUN 1 and RUN 2
alike — prints the deliberate negative-path log from the `returns 400 when redirectUri is missing`
test (`Failed to construct authorization request: HttpError { status: 400, ... }`). It is present
identically in all runs and therefore distinguishes nothing.

### 4.4 The finding

| Column | Value |
|---|---|
| Assertion outcome | **PASS** (blind — `expect(null).toBeDefined()`) |
| File outcome | **FAIL** (4 failed / 5 passed of 9) |
| Failing `file:line` | `authorize-endpoint.test.ts:147:33` |
| Failure text | `TypeError: Cannot read properties of null (reading 'split')` |

The assertion outcome is read **from the reported failure location, not from the exit code**. The runner
names `:147:33`, three lines *below* the assertion. A test body executes top-to-bottom, so `:144` was
evaluated and did not throw. The one assertion in the file whose title promises the request parameter is
present passed while that parameter was `null`.

**Collateral (COLLATERAL RULE, `139-VERDICTS.md` § 3.3): three tests** — `JAR is signed with RS256
algorithm`, `JAR payload contains required OIDC fields`, `JAR signature is verifiable with the signing
public key`. None is a site under control; each fails because `jose` rejects the now-missing request
parameter. **They bear on no verdict.** They do serve as an independent liveness proof that the edit
reached the module in the process that reported `:144` green.

---

## 5. RUN 2 — the catch: the repaired assertion, same scenario

### 5.1 Provenance — the post-repair source

RUN 2 was taken with `authorize-endpoint.test.ts` carrying the repair and `idura.ts` carrying the
**byte-identical** injection from § 3. The repaired shape, verbatim with post-repair line numbers:

```ts
142    const url = new URL(authorizeUrl);
143    const requestParam = url.searchParams.get('request');
144    expect(requestParam, "authorize URL is missing the 'request' (JAR) parameter").toEqual(
145      expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/)
146    );
```

The pre-repair `const parts = requestParam!.split('.')` / `expect(parts).toHaveLength(3)` pair and its
`// JWT has 3 dot-separated segments` comment were **removed**: the anchored three-segment regex
subsumes the split check, and leaving the non-null assertion (`!`) in place would re-assert at the type
level exactly what the new matcher exists to check at runtime.

**Clean-tree control (the third run, and the one that proves the matcher is not merely strict).** With
the injection reverted and the repair in place, the same invocation returned `Test Files 1 passed (1) /
Tests 9 passed (9)`. A real RS256-signed JAR matches `/^[\w-]+\.[\w-]+\.[\w-]+$/`; the repair does not
redden the clean tree.

### 5.2 The invocation, verbatim

Identical to § 4.2 except the log filename — the invocation is a held-constant, not a knob:

```bash
cd "$(git rev-parse --show-toplevel)/apps/frontend" \
  && npx vitest run src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts 2>&1 \
  | tee "${TMPDIR:-/tmp}/gsd-140/f19a-after.log"
```

### 5.3 Observed — verbatim, not paraphrase

Pasted unedited from `${TMPDIR}/gsd-140/f19a-after.log` (ANSI codes stripped):

```
 ❯ src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts (9 tests | 4 failed) 76ms
   ✓ POST /api/oidc/authorize > returns 200 with an authorizeUrl in the response 5ms
   ✓ POST /api/oidc/authorize > authorizeUrl contains client_id query parameter 1ms
   × POST /api/oidc/authorize > authorizeUrl contains a signed JWT request parameter 4ms
     → authorize URL is missing the 'request' (JAR) parameter: expected null to deeply equal StringMatching{…}
   × POST /api/oidc/authorize > JAR is signed with RS256 algorithm 1ms
     → Invalid Token or Protected Header formatting
   × POST /api/oidc/authorize > JAR payload contains required OIDC fields 1ms
     → JWTs must use Compact JWS serialization, JWT must be a string
   × POST /api/oidc/authorize > JAR signature is verifiable with the signing public key 1ms
     → Compact JWS must be a string or Uint8Array
   ✓ POST /api/oidc/authorize > sets oidc_state cookie when provider returns state 2ms
   ✓ POST /api/oidc/authorize > sets oidc_nonce cookie when provider returns nonce 1ms
   ✓ POST /api/oidc/authorize > returns 400 when redirectUri is missing 1ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts > POST /api/oidc/authorize > authorizeUrl contains a signed JWT request parameter
AssertionError: authorize URL is missing the 'request' (JAR) parameter: expected null to deeply equal StringMatching{…}

- Expected: 
StringMatching /^[\w-]+\.[\w-]+\.[\w-]+$/

+ Received: 
null

 ❯ src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:144:84
    142|     const url = new URL(authorizeUrl);
    143|     const requestParam = url.searchParams.get('request');
    144|     expect(requestParam, "authorize URL is missing the 'request' (JAR)…
       |                                                                                    ^
    145|       expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/)
    146|     );
```

### 5.4 The two halves side by side — THE LOAD-BEARING TABLE

| Site | Injected line | RUN 1 assertion | RUN 1 file | RUN 1 failing `file:line` | RUN 2 assertion | RUN 2 file | RUN 2 failing `file:line` |
|---|---|---|---|---|---|---|---|
| **1** `authorize-endpoint.test.ts` | `idura.ts:74` | **PASS** (blind) | FAIL (4/9) | `authorize-endpoint.test.ts:147:33` | **FAIL** (caught) | FAIL (4/9) | `authorize-endpoint.test.ts:144:84` |
| **2** `idura.test.ts` | `idura.ts:74` (shared with site 1) | **PASS** (blind) | FAIL (2/13) | `idura.test.ts:151:35` | **FAIL** (caught) | FAIL (2/13) | `idura.test.ts:148:86` |
| **3** `token-endpoint.test.ts` | `idura.ts:101-102` (entry deleted) | **PASS** (blind) | FAIL (4/10) | `token-endpoint.test.ts:170:29` | **FAIL** (caught) | FAIL (4/10) | `token-endpoint.test.ts:167:75` |

The failure **text** for each half, which is the other thing that moved:

| Site | RUN 1 failure text (pre-repair) | RUN 2 failure text (repaired) |
|---|---|---|
| **1** | `TypeError: Cannot read properties of null (reading 'split')` | `AssertionError: authorize URL is missing the 'request' (JAR) parameter: expected null to deeply equal StringMatching{…}` |
| **2** | `TypeError: Cannot read properties of null (reading 'split')` | `AssertionError: authorize URL is missing the 'request' (JAR) parameter: expected null to deeply equal StringMatching{…}` |
| **3** | `TypeError: Cannot read properties of null (reading 'split')` | `AssertionError: token request body is missing 'client_assertion': expected null to deeply equal StringMatching{…}` |

Clean-tree runs, all three repaired, no injection: 9/9, 13/13, 10/10 — all green.

**Read the assertion column, and read the two `file:line` values in each row.** The file outcome is FAIL in both
halves — that column distinguishes nothing here, which is exactly why the TWO-COLUMN RULE
(`139-VERDICTS.md` § 3.2) exists. The discrimination lives in (a) the assertion column, PASS → FAIL, and
(b) the failing line, which moved at every site (`:147`→`:144`, `:151`→`:148`, `:170`→`:167`). **In
every row the two `file:line` values differ.** A row in which they were equal would not be evidence —
it would mean the file was already red for a reason the repair did not supply.

### 5.5 The finding

Under an identical absence of the JAR request object:

1. The pre-repair assertion at `:144` **passed** and the file was rescued three lines later by an
   incidental `TypeError` on `requestParam!.split('.')` — a line that was never written as a guard.
2. The post-repair assertion at `:144` **failed at its own line**, and the failure text names the
   missing parameter: `authorize URL is missing the 'request' (JAR) parameter`.

The cost the repair removes is diagnosis time. A maintainer who drops the request parameter previously
saw `Cannot read properties of null (reading 'split')` — a message pointing at the test's own
string-splitting step rather than at the missing authentication material. They now see a sentence naming
the parameter, at the line whose title promises it.

### 5.6 Discarded block — intermediate implementations, recorded rather than hidden

**The pre-specified matcher was `toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/)`. It was measured, found to drop
the custom message on the one input that matters, and replaced.** This is recorded rather than quietly
corrected, because the plan's own must-have truth ("the failure message naming the missing parameter")
is what the substitution exists to satisfy.

`139-VERDICTS.md` § 5.7.6 pre-specified `.not.toBeNull()` and offered `toMatch(...)` as the stronger
form; `140-01-PLAN.md` selected `toMatch(...)`. Applied literally, RUN 2 produced:

```
TypeError: .toMatch() expects to receive a string, but got object
 ❯ src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:144:84
```

The failure moved to the assertion line as intended — but the failure **text** is a raw runner
`TypeError`, and the custom message is absent from it. Vitest's `toMatch` type-guards its received value
and throws before the `expect(value, message)` message is attached, so the message survives only in the
printed code frame, not in the assertion error. On `null` — the exact regression F19 names — the
pre-specified form fails at the right line with the wrong message.

A direct measurement was run to choose between candidate forms (a throwaway probe file, run once and
deleted; log at `${TMPDIR}/gsd-140/f19-matcher-probe.log`). Seven inputs, two matcher forms, same regex:

| Input | `toMatch(re)` | `toEqual(expect.stringMatching(re))` |
|---|---|---|
| `null` (the regression) | FAIL — `TypeError: .toMatch() expects to receive a string, but got object`; **message dropped** | FAIL — `AssertionError: authorize URL is missing the 'request' (JAR) parameter: expected null to deeply equal StringMatching{…}`; **message present** |
| `''` (empty string) | FAIL, message present | FAIL, message present |
| `'undefined'` (the R-6 four-character string) | FAIL, message present | FAIL, message present |
| `'aaa.bbb'` (two segments) | FAIL | FAIL |
| `'aaa.bbb.ccc.ddd'` (four segments) | FAIL | FAIL |
| `'eyJhbGc-x.eyJzdWI_y.SflKxwRJ-z'` (three base64url segments) | PASS | PASS |
| real RS256-signed JAR (clean tree, 9/9) | PASS | PASS |

The two forms are **identical in discrimination** — same regex, same anchoring, same accept/reject set
across all seven inputs — and differ only in whether the custom message survives on `null`. The
substitution therefore strengthens the assertion's diagnostic value and weakens nothing, which keeps it
inside the plan's standing prohibition ("this phase must NOT weaken any assertion").

`expect.stringMatching(/^…$/)` is additionally the **house form already in the frontend suite**:
`apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:283,298` both use an
anchored `expect.stringMatching(/^…$/)`. No new idiom was introduced.

**Consequence for the plan's grep-shaped acceptance criteria.** Criteria written as
`grep -n "toMatch(/\^\[\\w-\]+"` no longer match; the equivalent check is
`grep -n 'stringMatching(/\^\[\\w-\]+'`, which returns exactly one line per repaired file. The
substance the criteria encode — one anchored three-segment regex per site, carrying a second-argument
message naming the parameter — holds unchanged and is verified in `140-01-SUMMARY.md`.

### 5.7 Site 2 — `providers/idura.test.ts`

**Same injection, different vehicle.** Site 2 shares site 1's injection target exactly
(`idura.ts:74`) — one edit reddens both files, because site 1 reaches the provider through the route
handler (`routes/api/oidc/authorize/+server.ts` → `getActiveProvider()` → `iduraProvider`) while site 2
calls `iduraProvider.getAuthorizeUrl()` directly. The control was nevertheless run against site 2's
**own** file so the recorded `file:line` is unambiguous.

#### 5.7.1 Provenance

Pre-repair shape, verbatim with pre-repair line numbers:

```ts
147      const requestParam = url.searchParams.get('request');
148      expect(requestParam).toBeDefined();
149
150      // The request parameter should be a valid JWT (3 base64url segments)
151      const parts = requestParam!.split('.');
152      expect(parts).toHaveLength(3);
```

Post-repair shape, verbatim:

```ts
146      const url = new URL(result.authorizeUrl);
147      const requestParam = url.searchParams.get('request');
148      expect(requestParam, "authorize URL is missing the 'request' (JAR) parameter").toEqual(
149        expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/)
150      );
```

#### 5.7.2 The invocation, verbatim (both halves, identical but for the log name)

```bash
cd "$(git rev-parse --show-toplevel)/apps/frontend" \
  && npx vitest run src/lib/api/utils/auth/providers/idura.test.ts 2>&1 \
  | tee "${TMPDIR:-/tmp}/gsd-140/f19b-before.log"     # RUN 2: f19b-after.log
```

#### 5.7.3 Observed

RUN 1, from `${TMPDIR}/gsd-140/f19b-before.log` (ANSI stripped):

```
 FAIL  src/lib/api/utils/auth/providers/idura.test.ts > Idura provider > getAuthorizeUrl (JAR-based) > includes a signed JWT request parameter in the URL
TypeError: Cannot read properties of null (reading 'split')
 ❯ src/lib/api/utils/auth/providers/idura.test.ts:151:35
    149|
    150|       // The request parameter should be a valid JWT (3 base64url segm…
    151|       const parts = requestParam!.split('.');
       |                                   ^
    152|       expect(parts).toHaveLength(3);
    153|     });
```

RUN 2, from `${TMPDIR}/gsd-140/f19b-after.log`:

```
 FAIL  src/lib/api/utils/auth/providers/idura.test.ts > Idura provider > getAuthorizeUrl (JAR-based) > includes a signed JWT request parameter in the URL
AssertionError: authorize URL is missing the 'request' (JAR) parameter: expected null to deeply equal StringMatching{…}

- Expected:
StringMatching /^[\w-]+\.[\w-]+\.[\w-]+$/

+ Received:
null

 ❯ src/lib/api/utils/auth/providers/idura.test.ts:148:86
    146|       const url = new URL(result.authorizeUrl);
    147|       const requestParam = url.searchParams.get('request');
    148|       expect(requestParam, "authorize URL is missing the 'request' (JA…
       |                                                                                      ^
    149|         expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/)
    150|       );
```

Clean tree, repaired, injection reverted: `Test Files 1 passed (1) / Tests 13 passed (13)`.

#### 5.7.4 The finding

Assertion outcome moved **PASS → FAIL**; the failing line moved **`:151:35` → `:148:86`**; the failure
text moved from a `TypeError` about `split` to a sentence naming the `request` (JAR) parameter.

**Collateral (COLLATERAL RULE): one test** — `signed request object contains correct claims`
(`idura.test.ts:182`, `jose.decodeJwt` rejecting the now-missing parameter). It is not a site under
control and **bears on no verdict**; it is a second liveness proof that the edit reached the module.

### 5.8 Site 3 — `__tests__/token-endpoint.test.ts`

#### 5.8.1 The injection — a DIFFERENT diff, and the variant deliberately not used

Site 3 exercises the token-exchange path, so its injection targets the token-request
`URLSearchParams` object at `apps/frontend/src/lib/api/utils/auth/providers/idura.ts:101-102`. The
`client_assertion` entry is **deleted outright**, and the preceding trailing comma is dropped so
`client_assertion_type` becomes the final entry:

```diff
  apps/frontend/src/lib/api/utils/auth/providers/idura.ts:101-102
-        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
-        client_assertion: clientAssertion
+        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' // INJECTED (140): the client_assertion entry is deleted from the token request body
       }).toString()
```

**The variant NOT used, and why.** `client_assertion: undefined as unknown as string` was rejected:
Phase 139 measured that `new URLSearchParams({ b: undefined })` stringifies the value to the
four-character string `"undefined"`, so `.get()` returns a **non-empty string**. That run would model a
MALFORMED assertion rather than a MISSING one — a different regression from the one F19 names. Recorded
as rejected design **R-6** in `139-VERDICTS.md` § 5.9.2.

#### 5.8.2 Provenance

Pre-repair shape, verbatim with pre-repair line numbers — note that the **correct idiom already sat one
line above the defect**:

```ts
165      expect(capturedFetchBody).not.toBeNull();
166      const assertion = capturedFetchBody!.get('client_assertion')!;
167      expect(assertion).toBeDefined();
168
169      // JWT has 3 dot-separated segments
170      const parts = assertion.split('.');
171      expect(parts).toHaveLength(3);
```

Post-repair shape, verbatim:

```ts
165      expect(capturedFetchBody).not.toBeNull();
166      const assertion = capturedFetchBody!.get('client_assertion');
167      expect(assertion, "token request body is missing 'client_assertion'").toEqual(
168        expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/)
169      );
```

Three things changed and one deliberately did not:

- `:165`'s `expect(capturedFetchBody).not.toBeNull()` is **untouched** — it guards a different value
  (the captured body itself) and is the correct matcher for it.
- The **trailing** `!` on `capturedFetchBody!.get('client_assertion')!` is dropped. Keeping it would
  re-assert at the type level exactly what the new matcher exists to check at runtime.
- The **leading** `capturedFetchBody!` stays — it is guarded by `:165` one line above.
- The subsumed `assertion.split('.')` / `toHaveLength(3)` pair and its comment are removed.

#### 5.8.3 The invocation, verbatim

```bash
cd "$(git rev-parse --show-toplevel)/apps/frontend" \
  && npx vitest run src/lib/api/utils/auth/__tests__/token-endpoint.test.ts 2>&1 \
  | tee "${TMPDIR:-/tmp}/gsd-140/f19c-before.log"     # RUN 2: f19c-after.log
```

#### 5.8.4 Observed

RUN 1, from `${TMPDIR}/gsd-140/f19c-before.log`:

```
 FAIL  src/lib/api/utils/auth/__tests__/token-endpoint.test.ts > POST /api/oidc/token (Idura - private_key_jwt) > sends a valid JWT as client_assertion
TypeError: Cannot read properties of null (reading 'split')
 ❯ src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:170:29
    168|
    169|     // JWT has 3 dot-separated segments
    170|     const parts = assertion.split('.');
       |                             ^
    171|     expect(parts).toHaveLength(3);
    172|   });
```

RUN 2, from `${TMPDIR}/gsd-140/f19c-after.log`:

```
 FAIL  src/lib/api/utils/auth/__tests__/token-endpoint.test.ts > POST /api/oidc/token (Idura - private_key_jwt) > sends a valid JWT as client_assertion
AssertionError: token request body is missing 'client_assertion': expected null to deeply equal StringMatching{…}

- Expected:
StringMatching /^[\w-]+\.[\w-]+\.[\w-]+$/

+ Received:
null

 ❯ src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:167:75
    165|     expect(capturedFetchBody).not.toBeNull();
    166|     const assertion = capturedFetchBody!.get('client_assertion');
    167|     expect(assertion, "token request body is missing 'client_assertion…
       |                                                                           ^
    168|       expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/)
    169|     );
```

Clean tree, repaired, injection reverted: `Test Files 1 passed (1) / Tests 10 passed (10)`.

#### 5.8.5 The finding

Assertion outcome moved **PASS → FAIL**; the failing line moved **`:170:29` → `:167:75`**; the failure
text names `client_assertion`.

Note the fact that makes this site's blindness sharpest: **`:165`'s `.not.toBeNull()` passed in both
halves.** `capturedFetchBody` is a populated `URLSearchParams` — the body was captured fine; it is the
`client_assertion` *entry within it* that was gone. A guard on the container cannot see an absent
member, which is precisely why `:167` had to be repaired rather than leaned on its neighbour.

**Collateral (COLLATERAL RULE): three tests** — `client assertion has RS256 algorithm in header`,
`client assertion has correct iss, sub, aud claims`, `client assertion has exp within 5 minutes and a
jti`. None is a site under control; each fails because `jose` rejects the now-missing assertion. **They
bear on no verdict.**

### 5.9 The three sites, and what the pattern shows

All three sites are the same defect in the same shape: a `.get()` return typed `string | null`, guarded
by a matcher that fails only on `undefined`. All three now fail at their own line with a sentence naming
the missing parameter. In all three the failing `file:line` **moved** between the halves, which is the
single fact that distinguishes "the guard caught it" from "something else was already red" — and in all
three the file outcome was FAIL in *both* halves, so the file column distinguishes nothing.

**Ordering note (`must_haves.flagged_assumptions[0]`, recorded not dropped).** The `ordering` edge
category is **unresolved and flagged** for ASSERT-03. Each F19 site extracts exactly ONE named
query/form parameter by key; it produces no collection and no output order, so no ordering semantics
exist to assert. Writing an acceptance criterion here would mean inventing a predicate to hit a count.
It is recorded as a flagged assumption rather than silently omitted.

**Concurrency (backstop).** The three repaired assertions are independent of vitest's file-level
parallelism: each test constructs its own request material inside its own `it()` body (a fresh
`createMockRequestEvent(...)` or a direct `iduraProvider.getAuthorizeUrl(...)` call), and no repaired
assertion reads state written by another test file. The injections were nevertheless run one file at a
time so that each recorded `file:line` is attributable to a single vehicle.

---

## 6. What this pair does and does not prove

### 6.1 The F19 lane (ASSERT-03) — written by `140-01`

**What it proves.**

- Each of the three assertions **now fails at its own line**, and the failure text **names the missing
  parameter** (`request` at sites 1-2, `client_assertion` at site 3), under the recorded absence
  injection. Observed, twice per site, with the failing `file:line` captured for both halves.
- The **pre-repair form was blind to the same absence**: `expect(null).toBeDefined()` passed at every
  site while the parameter was genuinely `null`. This is what makes the pair evidence rather than a
  single observation — it separates "the guard caught it" from "something else was already red".
- The file was rescued in the pre-repair half only by an **incidental downstream `TypeError`** on a
  `.split('.')` that was never written as a guard. Criterion 2's phrasing — "not a downstream
  `TypeError` from the following line" — is met by construction now: that line no longer exists.
- The repair **does not redden the clean tree**: 9/9, 13/13 and 10/10 with the injections reverted, so
  a real RS256-signed JAR and a real client assertion both match the anchored regex.
- The matcher is **strictly stronger than the `.not.toBeNull()` that Phase 139 pre-specified**: measured
  across seven inputs (§ 5.6), it additionally rejects the empty string, the literal four-character
  string `"undefined"` that R-6 would have produced, a two-segment value and a four-segment value.
  `[\w-]` is ASCII-only (`\w` is `[A-Za-z0-9_]`, no `u` flag) and exactly spans the base64url alphabet,
  so a legitimate JWT segment never fails for an encoding reason.

**What it does NOT prove.**

- It does **not** prove the matcher rejects every malformed JWT shape in the wild. It asserts a
  three-segment base64url *shape*, not a valid signature, valid claims or a live IdP round trip. A
  value like `aaa.bbb.ccc` passes the matcher and is not a usable JAR. The signature and claim checks
  live in the sibling tests (`JAR signature is verifiable with the signing public key`), which are out
  of this lane's scope.
- It does **not** exercise the CI runner. Every run above was local, on one macOS machine, in one
  session.
- It does **not** speak to the F3, F9 or F10 lanes. Those are ASSERT-02, ASSERT-05 and ASSERT-06,
  owned by plans `140-05`/`06`, `140-03`/`04` and `140-02` respectively, and are appended below as
  those plans run.
- It does **not** establish that the three assertions are the *only* blind matchers in these files.
  See § 7.3 — the surviving `toBeDefined()` calls are enumerated and argued individually rather than
  waved through.

---

## 7/8. Verdict — evidence mapped to ROADMAP criteria

### 7.1 The verdict table

| ROADMAP criterion | Discharged by | Status |
|---|---|---|
| **1 — F3** (teardown delete matching nothing FAILS by name; pre-change form PASSES; sample spans helper + 27 call sites) | plans `140-05` (measurement + helper + codemod) and `140-06` (matcher adjudicated against the measured table, two-run control) | **owned by a later plan** — not attempted here, not silently absent |
| **2 — F19** (removing `request` / `client_assertion` makes the assertion itself fail naming the missing parameter, not a downstream `TypeError`; passes under the old `toBeDefined()`; two-run control at all three sites) | **this plan (`140-01`)** — §§ 4, 5, 5.4, 5.7, 5.8 | **DISCHARGED** |
| **3 — F9** (perm specs FAIL when the tag stops rendering anywhere; positive control is seeded data, not a comment) | plans `140-03` (seeded preconditions + blindness half) and `140-04` (positive controls, catch half) | **owned by a later plan** |
| **4 — F10** (stated `expect.soft` budget matches the real count **136**, or a counted guard enforces it and fails when one more is added, with the addition made and the failure observed) | **plan `140-02`** — Part II §§ 9, 10, 11, 11.5, 12 | **DISCHARGED — on BOTH alternatives.** The header now states the real posture and restates no number, AND `SOFT_ASSERTION_BUDGETS` + a counted config-load guard enforce the measured 136. The addition was made and the failure observed (§ 11.3) after the unguarded half (§ 10.3) and before the guard was accepted — order followed, not retrofitted (§ 12.1) |
| **5 — suites green after the edits, Phase-137 preflight satisfied on every evidence run** | plan `140-06` (phase gate). **Partially advanced here:** `yarn test:unit` (21/21 tasks, frontend 773 tests / 54 files) and `yarn lint:check` (0 errors, incl. `typecheck:tests`) both exit 0 at this plan's HEAD, and `svelte-check` reports 0 errors / 0 warnings across 2683 files. **No E2E evidence** — see § 7.4. | **partially advanced; owned by `140-06`** |

### 7.2 The ownership seam — Phase 142 does not redo this

**Phase 142's F19 obligation under ASSERT-07 is discharged by THIS diff.** `139-VERDICTS.md` §§ 5.7.6,
5.8.6 and 5.9.6 each record that Phase 140 owns the F19 repair under **ASSERT-03** while Phase 142 owns
the F19 line of **ASSERT-07**, and that **one diff serves both** — the repair and its negative control
are the same artifact. The control recorded in this document (reds after the fix at the assertion's own
line, passes before it) is precisely the discrimination Phase 142's ASSERT-07 lane would otherwise have
to re-establish.

**Phase 142 should therefore cite this document for F19 rather than re-running the injections.** What it
must NOT do is re-apply the `idura.ts` injections to "confirm" a result already observed here — that
would put live OIDC authentication material back into the working tree for no new information.

### 7.3 Out of scope, and why — the surviving `toBeDefined()` calls

`toBeDefined()` is **not wrong everywhere**; it is wrong on a `.get()` return, whose type is
`string | null`. Every surviving call in these files is on an **object property**, where the type
genuinely admits `undefined` and `toBeDefined()` is the correct matcher. Enumerated so a reviewer does
not read them as missed sites:

| File | Line | Call | Value under assertion | Why `toBeDefined()` is correct |
|---|---|---|---|---|
| `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` | 124 | `expect(data.authorizeUrl).toBeDefined()` | property of the parsed JSON response body | an absent JSON key reads as `undefined`, not `null` |
| `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` | 177 | `expect(payload.state).toBeDefined()` | decoded JWT payload claim | an absent claim reads as `undefined` |
| `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` | 178 | `expect(payload.nonce).toBeDefined()` | decoded JWT payload claim | as above |
| `apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts` | 231 | `expect(payload.exp).toBeDefined()` | decoded JWT payload claim | as above |
| `apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts` | 237 | `expect(payload.jti).toBeDefined()` | decoded JWT payload claim | as above |

**Count check.** `grep -c 'toBeDefined()'` over those two `__tests__/` files returns **3 + 2 = 5**, and
this table lists **5**. (The plan text anticipated "four"; the measured number is five, and the count
the table must match is the measured one.)

**Two further calls in the third repaired file**, listed for completeness though the plan's criterion
scopes the count to the two `__tests__/` files:
`apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts:126` (`expect(result.state).toBeDefined()`)
and `:136` (`expect(result.nonce).toBeDefined()`) — both properties of the `getAuthorizeUrl` return
object, same reasoning.

**Also deliberately untouched:** the three remaining `capturedFetchBody!.get('client_assertion')!`
reads at `token-endpoint.test.ts:186`, `:205` and `:227`. Each belongs to a *different* test whose own
assertion is a `jose` decode of the value; those tests are not blind (they throw on absence) and are not
F19 sites. Repairing them would widen this plan beyond ASSERT-03.

### What is explicitly NOT discharged by this document

An evidence document that records only confirmations is advocacy, not evidence. For the F19 lane:

- **No CI run.** Every run recorded here is local, macOS 26.5.1, Node v24.14.1, vitest 3.2.4, one
  session. The GitHub Actions runner has not executed these assertions. This mirrors the standing
  Phase-137 CI gap already carried in `.planning/STATE.md` § Deferred Items (`main.yaml` triggers only
  on push/PR to `main`, and `feat-gsd-roadmap` is thousands of commits ahead).
- **No full-suite E2E evidence.** That is ROADMAP criterion 5 and is owned by plan `140-06`. This plan
  ran **no** `yarn dev`, **no** `yarn test:e2e` and **no** Playwright command — deliberately, under
  C-5 / research Pitfall 7, because live `idura.ts` injections strip OIDC material from production
  source and a concurrent E2E run would have gone red for a manufactured reason.
- **No coverage of the three sibling `Rigidity contract` drift files.** See the recorded follow-up
  below. ASSERT-06's scope is `voter-journey.spec.ts` only; these three are a separate, verified drift
  and are **not** absorbed into this phase.
- **No claim about F3, F9 or F10.** Those lanes are empty in this document until plans `140-02`
  through `140-06` append to it.
- **No claim that the suite being green is evidence.** The suite was already green before these edits.
  Requirement satisfaction here is "the assertion can now fail", never "the run is now green".

### Recorded follow-up — three sibling `Rigidity contract` drift files

Found while scoping F10's declared-vs-real `expect.soft` count. **Measured at HEAD `568b1dfe`, not
quoted** — each figure below was produced by `grep -c 'expect\.soft(' <file>` this session:

| File | Declares | Actually carries |
|---|---|---|
| `tests/tests/specs/candidate/candidate-journey.spec.ts:47-48` | `Rigidity contract: - 0 expect.soft` | **3** |
| `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:43-44` | `**Rigidity contract:** NO \`expect.soft\`` | **6** |
| `tests/tests/fixtures/candidate/candidateHomePage.fixture.ts:23-24` | `**Rigidity contract:** NO \`expect.soft\`` | **4** |

This is the same drift class F10 exists to close — a header that states a contract the file no longer
honours — but **ASSERT-06's scope is `voter-journey.spec.ts` only**. Widening plan `140-02` to absorb
three more files would pad a scoped requirement with adjacent work. Filed rather than fixed, following
the precedent of the `tests/README.md` concurrency-claim item already carried in `.planning/STATE.md`.
Also filed to `.planning/WINDOWS.md` so it is visible at ship time.

### Reproducibility and non-contamination

**Reproducible.** Every ingredient is recorded: the HEAD (`568b1dfeae2cd5aa950b0f2a73f8aea96fbcf991`),
the two injection diffs verbatim (§ 3, § 5.8.1), the exact invocations (§ 4.2, § 5.2, § 5.7.2, § 5.8.3),
and the environment (§ 2). A reader on another machine can rebuild both halves at every site.

**Non-contaminating — proven, not asserted.** The three-check HYGIENE-LOOP POST-GATE ran after every
injection at every site, and all three checks held each time:

```
(a) git status --porcelain -- apps/frontend/src/lib/api/utils/auth/providers/idura.ts   → empty
(b) git status --porcelain -- apps tests packages                                        → repairs only
(c) grep -rn 'INJECTED (140)' apps packages tests                                        → no match
```

No injection reached a commit, a branch or a running process. Every run log lives under
`${TMPDIR}/gsd-140/`, **outside** the repository, so no log could become untracked-file noise or trip
check (b). The one throwaway probe file created for the § 5.6 measurement
(`.../__tests__/zz-probe.test.ts`) was deleted in the same task and is covered by the same gate.

**Honesty of the record.** Every outcome in §§ 4, 5, 5.4, 5.7 and 5.8 traces to a captured log
containing a real failing `file:line`. No outcome was reconstructed, inferred or predicted. Where the
pre-specified implementation was replaced, the replaced version and the measurement that motivated the
replacement are recorded in § 5.6 rather than removed.

---

# Part II — the F10 lane (ASSERT-06): the unguarded soft-assertion budget

**Written by `140-02-PLAN.md` (wave 2).** Same document, same standing acceptance rule, different
adversary. The F19 lane above injected an *absence* into production source and asked whether a matcher
noticed. This lane injects an *addition* into a test file and asks whether the harness notices — the
mirror-image question, because F10 is a drift defect rather than a blindness defect: the file's header
stated a contract the file had stopped honouring, and nothing in the repository could tell.

- **Date:** 2026-08-15
- **Plan:** `140-02-PLAN.md`
- **Requirement:** ASSERT-06 — ROADMAP criterion 4 (fake-guard sweep 2026-08-11, finding F10)
- **Decision in force:** D-01 — the count is **136**, and the guard must derive it from a measurement, not quote it from a planning document

> **Every appearance of `137` in this Part is one of exactly two things**, and neither presents it as the
> file's current count. Either (a) a **provenance** sentence attributing 137 to the 2026-08-11 sweep,
> when it was true; or (b) the **adversary count** — `136 + 1` — measured while the injection was live,
> which is the number the guard is *supposed* to report. **The file's current count is 136.** This note
> exists because D-01 forbids carrying 137 forward as a current count, and a reader grepping for the
> literal deserves to be told which of the two they have found.

---

## 9. F10 — measurement, and the adversary

### 9.1 The measurement, and why the algorithm matters

Taken at this plan's HEAD, in the working tree, at the time of the task — not quoted:

```
$ git rev-parse HEAD
5f12d86158023ec17c060782d1a003a4f6d0c69a

$ grep -o 'expect\.soft(' tests/tests/specs/voter/voter-journey.spec.ts | wc -l
     136

$ grep -c 'expect\.soft(' tests/tests/specs/voter/voter-journey.spec.ts
136
```

**The measured value is 136, which agrees with D-01.** No divergence to record.

**The two commands agree today and are nonetheless different algorithms**, which is why the guard may
not be built on the second one. `grep -o … | wc -l` counts **occurrences**; `grep -c` counts **matching
lines**. They coincide at HEAD only because no line in this file currently carries two soft-assertion
calls. The day someone writes such a line, `grep -c` silently undercounts and a ceiling built on it
silently widens. The guard landed in § 10 therefore counts occurrences —
`(contents.match(/expect\.soft\(/g) ?? []).length` — and this paragraph is the reason.

**Provenance of the superseded number.** 137 was the correct count when the sweep measured it on
2026-08-11. Phase 138's `bea9fc97a` promoted one soft assertion to a hard `expect()` at
`voter-journey.spec.ts:858`, taking 137 → 136. `.planning/audits/2026-08-11-fake-guard-sweep.md` and the
completed-todo entry still say 137 and were **deliberately left untouched** — they were true when
written, and rewriting a dated record to match today's tree is how provenance is destroyed.
`git diff --stat .planning/audits/2026-08-11-fake-guard-sweep.md` is empty for this phase.

### 9.2 The adversary — one added soft assertion, rebuildable

The knob is a single one: **whether the counted guard exists**. The injection bytes, the injection site,
the invocation and the working directory are held identical across both halves.

```diff
  tests/tests/specs/voter/voter-journey.spec.ts:609  (inside the existing
  test.step('home page renders with a start button', …) body)

       await voterHomePage.goToPage('en');
       await expect.soft(page.getByTestId(testIds.voter.home.startButton)).toBeVisible();
+      expect.soft(true, 'budget adversary').toBe(true); // INJECTED (140)
     });
```

The added assertion is **trivially true**, so it cannot change any test outcome. That is deliberate: an
adversary that could itself fail would confound "the harness noticed the count changed" with "the added
check went red". The only thing that changes is the population, from 136 to 137.

Verified under injection, before any run:

```
$ grep -o 'expect\.soft(' tests/tests/specs/voter/voter-journey.spec.ts | wc -l
     137
```

### 9.3 The HYGIENE-LOOP for this lane, verbatim

```bash
# 1. PRE-GATE
git status --porcelain -- apps tests packages                       # MUST print nothing
mkdir -p "${TMPDIR:-/tmp}/gsd-140"
# 2. INJECT (diff in § 9.2)
# 3. RUN, combined output to a log OUTSIDE the repo
cd "$(git rev-parse --show-toplevel)/tests" \
  && npx playwright test --list > "${TMPDIR:-/tmp}/gsd-140/f10-<half>.log" 2>&1; echo "EXIT=$?"
# 4. REVERT
git checkout -- tests/tests/specs/voter/voter-journey.spec.ts
# 5. POST-GATE — all three must hold
git status --porcelain -- tests/tests/specs/voter/voter-journey.spec.ts   # (a) empty
git status --porcelain -- apps tests packages                            # (b) empty
grep -rn 'INJECTED (140)' apps packages tests                            # (c) no match
```

**Why `--list` and not a test run.** `--list` loads `playwright.config.ts` in full and then enumerates
the suite **without starting a browser, a dev server or a database**. Port 5173 is held by an unrelated
Docker container in this environment and no dev server was started by this lane — consistent with the
C-5 constraint recorded in § 2. `--list` is therefore both the safest and the *strictest* vehicle:
strictest because it is the invocation with the least machinery between the shell and the config, so a
guard that fires under `--list` fires under every heavier invocation too.

**And `--list` is precisely the invocation the Phase-137 preflight cannot reach.** `--list` does not run
`globalSetup`, which is where the served-application preflight lives — recorded and deliberately
preserved in `137-NEGATIVE-CONTROL.md` § "The `--list` exemption is correct and deliberate — do not
'fix' it". An F10 invariant implemented as a test, or inside `globalSetup`, would inherit that same
blind spot. Implemented as module-level code in `playwright.config.ts`, it fires on `--list` anyway.
That reach — not convenience — is why the guard lives at config load.

### 9.4 Environment (delta from § 2)

```
date (UTC):        2026-08-15T12:56:53Z
date (local):      2026-08-15 15:56:53 EEST
git HEAD:          5f12d86158023ec17c060782d1a003a4f6d0c69a   (post-140-01)
git branch:        feat-gsd-roadmap  (linked worktree)
Playwright:        1.58.2
runner cwd:        <repo root>/tests
log directory:     ${TMPDIR}/gsd-140/   (OUTSIDE the repository, by design)
ports bound:       none — no dev server, no database, no browser
```

---

## RUN 1 — blindness: the unguarded config

### 10.1 Provenance — proof the config was genuinely unguarded

RUN 1 was taken at HEAD `5f12d861`, **before** any edit to `tests/playwright.config.ts`. At that HEAD
the file's only module-level guard was the ORPHAN-PROBE GUARD (`:18-47`); `SOFT_ASSERTION_BUDGETS` did
not exist anywhere in the repository:

```
$ grep -rn 'SOFT_ASSERTION_BUDGETS' tests/
(no match)
```

The ordering is load-bearing and is not retrofittable: once the guard is committed, the unguarded half
can never again be observed on this tree without deleting it. This is why the plan places the blind half
in task 1, before the guard lands in task 2.

### 10.2 The invocation, verbatim

```bash
cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests \
  && npx playwright test --list > "${TMPDIR:-/tmp}/gsd-140/f10-before.log" 2>&1; echo "EXIT=$?"
```

### 10.3 Observed — verbatim, not paraphrase

```
EXIT=0
```

Head of `${TMPDIR}/gsd-140/f10-before.log`, verbatim:

```
[dotenv@17.3.1] injecting env (0) from .env -- tip: 🤖 agentic secret storage: https://dotenvx.com/as2
Listing tests:
  [data-teardown-perm-analytics-tracking] › setup/perm/perm-analytics-tracking.teardown.ts:15:1 › delete perm-analytics-tracking dataset
  [data-teardown-perm-org-matching] › setup/perm/perm-org-matching.teardown.ts:15:1 › delete perm-org-matching dataset
  [data-teardown-perm-interactive-info] › setup/perm/perm-interactive-info.teardown.ts:15:1 › delete perm-interactive-info dataset
  [data-teardown-perm-question-video] › setup/perm/perm-question-video.teardown.ts:22:1 › delete perm-question-video dataset
```

Tail, verbatim:

```
  [voter-prefs-tracking] › specs/voter/voter-prefs-tracking.spec.ts:212:3 › voter-prefs-tracking (EFLOW-08) › user-preferences round-trip: consent + feedback + survey survive a reload
Total: 143 tests in 94 files
EXIT=0
```

A complete, normal listing — 143 tests in 94 files, exit 0 — produced while the file carried **137**
soft assertions against a header claiming a three-slot budget.

**The absence, measured rather than asserted.** "No error mentioning a budget" is a negative claim, so
it is stated as a command and its output:

```
$ grep -c 'Error' "${TMPDIR}/gsd-140/f10-before.log"
0
$ grep -ci 'SOFT_ASSERTION' "${TMPDIR}/gsd-140/f10-before.log"
0
$ grep -ci 'budget' "${TMPDIR}/gsd-140/f10-before.log"
1
```

**The one `budget` hit is not an error, and saying so matters more than hiding it.** It is a test title:

```
$ grep -in 'budget' "${TMPDIR}/gsd-140/f10-before.log"
112:  [performance] › specs/perf/performance-budget.spec.ts:105:3 › Performance budgets › voter results page renders matches within budget
```

A naive `grep -i budget` over the log is therefore **non-zero in the blind half**, which would make it a
worthless discriminator between the two halves. The discriminators that do work — and that § 11.4 uses
— are the **exit code** and the presence of a **thrown error naming the spec path and both numbers**.
Recording this is the difference between evidence and advocacy: the obvious grep was tried, it does not
discriminate, and that is written down rather than quietly replaced.

### 10.4 The revert and the three-check POST-GATE

```
$ git checkout -- tests/tests/specs/voter/voter-journey.spec.ts
$ git status --porcelain -- tests/tests/specs/voter/voter-journey.spec.ts   # (a)
(empty)
$ git status --porcelain -- apps tests packages                            # (b)
(empty)
$ grep -rn 'INJECTED (140)' apps packages tests                            # (c)
no match
$ grep -o 'expect\.soft(' tests/tests/specs/voter/voter-journey.spec.ts | wc -l
     136
```

### 10.5 The finding

**With no counted guard, adding a soft assertion to `voter-journey.spec.ts` costs nothing and is seen by
nothing.** The suite listed cleanly, exit 0, no warning, no error. The file's own header still claimed a
three-slot budget while the file carried 137 — and the repository contained no mechanism capable of
producing that contradiction.

This is the mechanism behind F10 itself, reproduced on demand rather than argued from the audit record:
the budget did not drift from 3 to 136 through a single careless commit, it drifted one honest addition
at a time, and each of those additions ran exactly the run recorded above — green, silent, and
indistinguishable from a change that honoured the contract. A guard that only fires when someone
*chooses* to check is not a guard; the count claim in the header was documentation of an intent, and
documentation cannot fail.

---

## 11. RUN 2 — the catch: the guarded config

### 11.1 Provenance — the post-guard HEAD

RUN 2 was taken at HEAD `7a259e548a2bc748e066389ab18b66e95251ca4d`, the commit that landed
`SOFT_ASSERTION_BUDGETS` and the counted guard, with the **byte-identical** adversary from § 9.2
re-applied to the same site. The guard as landed:

```
$ grep -n 'SOFT_ASSERTION_BUDGETS\|SOFT-ASSERTION BUDGET GUARD' tests/playwright.config.ts
59:const SOFT_ASSERTION_BUDGETS: Record<string, number> = {
64: * SOFT-ASSERTION BUDGET GUARD (Phase 140 plan 02, fake-guard sweep finding F10).
89:for (const [rel, budget] of Object.entries(SOFT_ASSERTION_BUDGETS)) {
94:        `file, or drop its entry from SOFT_ASSERTION_BUDGETS in this file. A budget pointing at ` +
103:        `in SOFT_ASSERTION_BUDGETS in this file AND state the reason in that spec's header. A ` +
```

The re-applied diff, confirmed identical to RUN 1's before the run:

```
$ git --no-pager diff -- tests/tests/specs/voter/voter-journey.spec.ts
+      expect.soft(true, 'budget adversary').toBe(true); // INJECTED (140)

$ grep -o 'expect\.soft(' tests/tests/specs/voter/voter-journey.spec.ts | wc -l
     137
```

The line number the diff hunk reports moved from `@@ -607,6` (RUN 1) to `@@ -620,6` (RUN 2) because the
rewritten header is longer. The **bytes injected are the same**; only their offset in the file changed.
That is the one difference between the halves that is not the knob, and it is recorded rather than
elided — it affects nothing the guard reads, since the guard counts occurrences over the whole file and
never looks at a line number.

### 11.2 The invocation, verbatim

```bash
cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests \
  && npx playwright test --list > "${TMPDIR:-/tmp}/gsd-140/f10-after.log" 2>&1; echo "EXIT=$?"
```

Byte-identical to § 10.2 apart from the log filename.

### 11.3 Observed — verbatim, not paraphrase

Complete contents of `${TMPDIR}/gsd-140/f10-after.log`:

```
[dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
Error: Soft-assertion budget diverged in specs/voter/voter-journey.spec.ts — the declared budget is 136 but the file carries 137. Convert the new assertion to a hard `expect()`, or change the budget in SOFT_ASSERTION_BUDGETS in this file AND state the reason in that spec's header. A budget edited to match whatever the file happens to contain is not a budget (fake-guard sweep 2026-08-11, finding F10).
    at file:///Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/playwright.config.ts:100:11
    at ModuleJob.run (node:internal/modules/esm/module_job:430:25)
    at onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:661:26)
    at requireOrImport (/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/node_modules/playwright/lib/transform/transform.js:223:12)
    at loadUserConfig (/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/node_modules/playwright/lib/common/configLoader.js:107:46)
    at loadConfig (/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/node_modules/playwright/lib/common/configLoader.js:119:22)
    at loadConfigFromFile (/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/node_modules/playwright/lib/common/configLoader.js:331:10)
    at runTests (/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/node_modules/playwright/lib/program.js:197:18)
    at i.<anonymous> (/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/node_modules/playwright/lib/program.js:70:7)
EXIT=1
```

**Three things in that output, each doing work:**

1. **The message carries all three identifying values** — the `TESTS_DIR`-relative path
   `specs/voter/voter-journey.spec.ts`, the declared budget `136`, and the actual count `137`. A
   maintainer reading only this line knows which file, which direction and by how much, without opening
   the planning record.
2. **`loadConfigFromFile` → `loadUserConfig` → `playwright.config.ts:100:11`.** The stack shows the throw
   happened while *loading the config*, before `runTests` reached suite construction. There is **no
   listing** in this log — not a truncated one, none at all. The project graph was never built.
3. **Exit 1, and `--list` at that** — the invocation that does not run `globalSetup` and therefore never
   reaches the Phase-137 preflight. The guard fired anyway, which is the reach § 9.3 argued for.

### 11.4 The third observation — the guard is discriminating, not always-on

A guard that threw unconditionally would produce output 11.3 as well. So the injection was reverted and
the identical invocation re-run on the clean tree:

```
$ git checkout -- tests/tests/specs/voter/voter-journey.spec.ts
$ grep -o 'expect\.soft(' tests/tests/specs/voter/voter-journey.spec.ts | wc -l
     136
$ cd tests && npx playwright test --list > "${TMPDIR:-/tmp}/gsd-140/f10-reverted.log" 2>&1; echo "EXIT=$?"
```

Tail of `${TMPDIR}/gsd-140/f10-reverted.log`:

```
Total: 143 tests in 94 files
EXIT=0
```

Same 143 tests in 94 files as the blind half. **The guard's verdict tracks the adversary, not the
guard's own presence.**

### 11.5 The three runs side by side — THE LOAD-BEARING TABLE

| Half | git HEAD | Guard present | Adversary (the added soft assertion) | Invocation | Exit | Observed |
|---|---|---|---|---|---|---|
| **RUN 1 — blind** | `5f12d861` (post-`140-01`) | **no** | **yes** — count 137 | `npx playwright test --list` | **0** | Full listing, `Total: 143 tests in 94 files`. No error, no warning. `grep -c 'Error'` over the log → **0** |
| **RUN 2 — catch** | `7a259e54` (post-guard) | **yes** | **yes** — count 137, byte-identical injection | `npx playwright test --list` | **1** | `Error: Soft-assertion budget diverged in specs/voter/voter-journey.spec.ts — the declared budget is 136 but the file carries 137.` Thrown at `playwright.config.ts:100:11` during `loadConfigFromFile`. **No listing produced at all** |
| **RUN 3 — reverted** | `7a259e54` (post-guard) | **yes** | **no** — count back to 136 | `npx playwright test --list` | **0** | Full listing, `Total: 143 tests in 94 files`. No error |

**Read the exit column.** It is `0 → 1 → 0`. The two halves are distinct there, which is what the F19
lane above could *not* achieve (its file outcome was FAIL in both halves, so its discrimination had to
live in the assertion column and the failing `file:line`). Here the process exit code itself
discriminates, because the defect class is different: F19 was a matcher too weak to notice a value, F10
was an invariant that did not exist at all.

**RUN 3 is the row that makes rows 1 and 2 mean something.** Without it, "guard present → exit 1" is
consistent with a guard that throws on every invocation, which would be worse than no guard. With it,
the only variable that moved is the adversary.

### 11.6 The finding

Under a byte-identical addition of one soft assertion to `voter-journey.spec.ts`:

1. **Before the guard**, every Playwright invocation succeeded and said nothing. The header's contract
   and the file's contents disagreed by 133 and no mechanism in the repository could say so.
2. **After the guard**, the same addition aborts **every** Playwright invocation — including `--list`,
   the lightest one, which does not even start `globalSetup` — with a message naming the file, the
   declared budget and the real count.

What the guard buys is not detection of a bug; the added assertion was trivially true and broke nothing.
It buys the *impossibility of silent drift*. The next person to add a soft assertion here must make a
decision in the open: convert it to a hard `expect()`, or raise the budget in `SOFT_ASSERTION_BUDGETS`
and say why in the spec's header. Both are fine. Neither can now happen by accident, which is the only
thing that distinguishes a budget from a wish.

**And the equality direction matters symmetrically.** Phase 138's `bea9fc97a` promoted one soft
assertion to hard and took the count 137 → 136 — a good change that, under a ceiling-style guard, would
have passed unnoticed and quietly widened the headroom. Under equality it would have thrown, forcing the
improvement to be recorded. The budget therefore ratchets in the direction of fewer soft assertions
rather than drifting in the direction of more.

---

## 12. Verdict — the F10 lane (ASSERT-06)

### 12.1 The verdict row

The § 7.1 table above has been updated in place; the criterion-4 row is reproduced here with its
reasoning spelled out.

| ROADMAP criterion | Discharged by | Status |
|---|---|---|
| **4 — F10** (stated soft-assertion budget matches the real count **136**, **or** a counted guard enforces it and fails when one more is added, with the addition made and the failure observed) | plan `140-02` — §§ 9, 10, 11, 11.5 | **DISCHARGED — on BOTH alternatives, not one** |

**Both halves were delivered, and the criterion only asked for one.** Criterion 4 is disjunctive ("budget
matches its real count **or** a counted guard enforces it"). Satisfying only the first — editing `3` to
`136` — would have reproduced the defect on a slower clock: it was 3 once, 137 four days ago, 136 today.
So the header was rewritten to state the *posture* and name `SOFT_ASSERTION_BUDGETS` as the number's
authority (stating no number of its own), **and** the guard was added to enforce the measured value.

**The criterion's own procedural observable was satisfied in order, not retrofitted.** Criterion 4
requires "the addition is made and the failure observed *before* the guard is accepted". The commit
sequence shows this is what happened rather than what is claimed:

| Commit | What it contains |
|---|---|
| `7bb36c6b3` | the measurement and RUN 1 — taken on a tree where `grep -rn 'SOFT_ASSERTION_BUDGETS' tests/` returned no match |
| `7a259e548` | the guard and the header rewrite |
| RUN 2 / RUN 3 | run against `7a259e548`, recorded in this commit |

The blind half is not reproducible after `7a259e548` without deleting the guard, which is precisely why
it had to be taken first. Its evidence was committed before the guard existed.

### 12.2 What the F10 pair proves

- **The guard fires on the adversary and only on the adversary.** Three runs, exit `0 → 1 → 0`, one
  variable moved.
- **It fires at config load**, which is the earliest reachable point and the only one that covers
  `--list`. Observed: the stack in § 11.3 shows the throw inside `loadConfigFromFile`, before
  `runTests`, and the log contains no listing whatsoever.
- **The message is self-sufficient** — file, declared budget, actual count, both remedies, and the
  provenance citation `(fake-guard sweep 2026-08-11, finding F10)` — so a future divergence is
  diagnosable without the planning record.
- **The number is derived from a measurement, not a quotation** (D-01). `136` was measured at
  `5f12d861` two ways (§ 9.1), and the guard re-measures the file on every config load rather than
  trusting the constant.
- **The declared posture is now honest and cannot silently rot**, in both directions: adding a soft
  assertion throws, and removing one throws.

### 12.3 What the F10 pair does NOT prove — the honest gaps

- **The guard is scoped to `voter-journey.spec.ts` alone.** `SOFT_ASSERTION_BUDGETS` has exactly one
  entry. Every other spec and fixture in the suite remains entirely unbudgeted and unguarded.
- **The three sibling `Rigidity contract` drift files remain unguarded and unfixed** —
  `tests/tests/specs/candidate/candidate-journey.spec.ts` (declares 0, carries 3),
  `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts` (declares NO soft assertions, carries
  6), `tests/tests/fixtures/candidate/candidateHomePage.fixture.ts` (declares NO soft assertions,
  carries 4). These are the **same defect class** that F10 names, they were measured this phase, and
  they are deliberately **out of scope**: ASSERT-06's scope is `voter-journey.spec.ts`. They are the
  recorded follow-up filed by plan `140-01` task 3 (§ "Recorded follow-up" above, and
  `.planning/WINDOWS.md`). Nothing in this plan reduces their drift.
- **No CI run has exercised the guard.** Every run recorded in Part II is local — macOS 26.5.1, Node
  v24.14.1, Playwright 1.58.2, one session, one machine. The GitHub Actions runner has never loaded
  this config. This is the same standing Phase-137 CI gap carried in `.planning/STATE.md` § Deferred
  Items.
- **No test was executed at all in this lane.** `--list` loads the config and enumerates; it runs no
  browser, no dev server, no database. This lane therefore says **nothing** about whether the voter
  journey passes, and nothing about ROADMAP criterion 5 — that is plan `140-06`'s phase gate.
- **The guard does not evaluate whether any given soft assertion *should* be soft.** It counts. A
  maintainer who converts a load-bearing hard assertion into a soft one and lowers a hard assertion's
  count elsewhere could hold the total at 136 and pass. The budget constrains the population, not the
  judgement behind each member.
- **Per-worker re-evaluation is argued, not measured.** Playwright re-imports the config in each worker
  process; the guard only reads one file and throws, so it is idempotent and side-effect-free by
  inspection of its own source. No run in this lane spawned workers (`--list` does not), so this
  property is established by construction rather than by observation, and is recorded as such.

# Part III — the F9 lane (ASSERT-05): the absence-only tag assertions

> **Ownership of this Part is split across two plans, deliberately.** Plan `140-03` lands the seeded
> precondition and writes **RUN 1 (blindness)** — §§ 13-15 below. Plan `140-04` adds the presence
> assertions and writes **RUN 2 (the catch)**, re-running the *byte-identical* injection recorded in
> § 13.3 so that the only variable between the halves is the new assertion. The split is the point:
> RUN 1 is taken while the specs are still absence-only, which cannot be reconstructed after plan
> `140-04` edits them.

## 13. F9 — the defect, the precondition, and the adversary

### 13.1 The defect, stated exactly

Two perm specs each carried exactly one assertion, and each was of the form "count is zero":

```
tests/tests/specs/perm/perm-hide-category-tags.spec.ts:22
  await expect(page.getByTestId(testIds.shared.categoryTag)).toHaveCount(0);

tests/tests/specs/perm/perm-hide-election-tags.spec.ts:23
  await expect(page.getByTestId(testIds.shared.electionTag)).toHaveCount(0);
```

`toHaveCount(0)` is satisfied by a page on which the setting under test worked. It is **equally**
satisfied by a page on which the tag component stopped rendering everywhere, by a page whose testid
was renamed, and by a page that failed to render the question heading at all. The assertion cannot
distinguish "the setting suppressed the tag" from "there was never a tag to suppress" — so it does not
in fact test the setting. That is finding F9 / requirement ASSERT-05.

The remedy is **not** a stronger matcher. No count matcher can distinguish those cases, because the
observable is identical in all of them. The remedy is a **complementary positive control in the same
dataset**: a second tag, of the same component family, that the same page is expected to *render*. A
render-path deletion then makes the positive half red even though the negative half stays green.

### 13.2 The seeded precondition — what plan `140-03` landed first

ROADMAP criterion 3 requires the positive control's precondition to be **seeded data**, not spec prose.
Each perm dataset therefore received the property its sibling already carried — a literal
cross-transplant, one property each way (commit `4c0bf5839`):

| Template | Was | Now | Why this property |
|---|---|---|---|
| `packages/dev-seed/src/templates/e2e/perm/perm-hide-category-tags.ts` | 1 election; overlay `questions.showCategoryTags: false` | **2 elections**; same overlay, untouched | `getElectionsToShow` returns `[]` when `elections.length < 2` (`apps/frontend/src/lib/utils/questions/electionTags.ts:13`). The perm baseline already sets `elections.showElectionTags: true` (`packages/dev-seed/src/templates/e2e/perm/shared.ts`), so the missing ingredient was the election **count**, not the flag. At one election an ElectionTag presence assertion would be red for a reason unrelated to the tag component. |
| `packages/dev-seed/src/templates/e2e/perm/perm-hide-election-tags.ts` | 2 elections; overlay `elections: { showElectionTags: false }` | same, plus **`questions: { showCategoryTags: true }`** in the *extended* overlay | Overrides the perm baseline's `showCategoryTags: false` so the complementary CategoryTag renders. The existing `showElectionTags: false` entry is extended, not replaced. |

Neither edit introduces a new option key: `elections` and `settingsOverlay` are both first-class
`BuildMinimalOptions` fields (`packages/dev-seed/src/templates/_helpers/buildMinimal.ts:77-107`), and
the overlay is applied by JSONB-safe **deep** merge, so `questions.showCategoryTags` overrides that one
key without disturbing `questions.categoryIntros`, `questions.questionsIntro` or
`questions.showResultsLink`.

Both doc blocks were rewritten in the same commit. Leaving a header describing only the absence
assertion — which becomes false the moment the complementary tag renders — while remediating a sibling
header drift is exactly the F10 failure mode this phase is closing.

### 13.3 The adversary — deletion of the tag-render path, rebuildable

The adversary is a deletion of **both** `{#if}` blocks that render the two tags, applied to production
frontend source. The `{:else if blockWithStats}` branch is promoted to a plain `{#if blockWithStats}`
so the markup remains valid Svelte. Per **D-03** this is a deletion of the rendering blocks **only** —
the component's `ctx` reads, `appSettings` access patterns and `$derived` declarations are untouched, so
neither the Svelte 5 context-destructuring rule nor the `dataRoot` `#version`-bridge carve-out is in
play. The now-unused `ElectionTag` / `CategoryTag` / `getElectionsToShow` imports were deliberately left
in place: removing them would be a refactor, not the minimal mutation.

```diff
diff --git a/apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte b/apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte
index d2d618bfd..dbf93ba0d 100644
--- a/apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte
+++ b/apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte
@@ -77,17 +77,8 @@ This is a dynamic component, because it accesses the settings via `AppContext` a

 <HeadingGroup {...concatClass(restProps, 'relative')}>
   <PreHeading class="gap-sm flex flex-row flex-wrap items-center justify-center">
-    {#if appSettings.elections.showElectionTags}
-      {#each getElectionsToShow({ question, elections }) as election}
-        <ElectionTag {election} {onShadedBg} />
-      {/each}
-    {/if}
-    {#if appSettings.questions.showCategoryTags}
-      <CategoryTag
-        category={question.category}
-        suffix={blockWithStats ? `${blockWithStats.indexInBlock + 1}/${blockWithStats.block.length}` : undefined}
-        {onShadedBg} />
-    {:else if blockWithStats}
+    <!-- INJECTED (140) - both tag-render blocks deleted for the F9 negative control -->
+    {#if blockWithStats}
       {t('common.question')}
       <span class="text-secondary">{blockWithStats.index + 1}/{numQuestions}</span>
     {/if}
```

**Marker exemption: none.** An HTML comment is syntactically legal at the injection site, so the
`INJECTED (140)` marker was placed on a `+` line and the marker grep is available as a supplement to
the two git gates. No position in this injection required an omission.

### 13.4 The HYGIENE-LOOP for this lane, verbatim

Per `139-VERDICTS.md` § 3.1 (D-03), adapted to a Playwright vehicle:

```bash
# 1. PRE-GATE
git status --porcelain -- apps tests packages          # MUST print nothing
grep -rn 'INJECTED (140)' apps packages tests          # MUST print nothing

# 2. INJECT (diff in § 13.3)

# 3. RUN, combined output to a log OUTSIDE the repo
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/140-f9-before \
  --project perm-hide-category-tags > "$SCRATCH/f9-before.log" 2>&1

# 4. REVERT
git checkout -- apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte

# 5. POST-GATE - all three must hold
git status --porcelain -- apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte
git status --porcelain -- apps tests packages
! grep -rn 'INJECTED (140)' apps packages tests
```

**The C-5 constraint recorded in § 2 does not apply to this lane, and its inverse does.** Part I forbade
any Playwright command because its injections stripped live OIDC material from production source. This
lane's vehicle **is** Playwright: the F9 observable is a rendered DOM, and there is no unit-level
substitute for it. The run is scoped to one project chain and the injection window is bounded by steps
2 and 4 above, with the revert and all three gates executed inside the same task.

**The bare `git status --porcelain` is again not a gate**, for the reason given in § 2: `.vscode/settings.json`
and `supabase/.temp/cli-latest` are tracked and dirty in this linked worktree at session start, and
`.planning/STATE.md` is written by the orchestrator during execution. The scoped form
`-- apps tests packages` is the gate that carries the claim, and the per-path form is the gate that
carries the byte-restoration claim.

### 13.5 Environment (delta from § 2)

```
date (UTC):        2026-08-15T13:18:19Z .. 2026-08-15T13:25:29Z  (the RUN 1 window)
git HEAD:          4c0bf5839b8fee87c233e56b6cc92dbf21ce5b94
git branch:        feat-gsd-roadmap  (linked worktree)
Node:              v24.14.1
Playwright:        1.58.2
runner:            tests/scripts/e2e-run.sh (spawns and owns its own dev server)
FRONTEND_PORT:     5273  (e2e-run.sh default; 5173 was NOT used)
Supabase:          local, reset by the runner via `yarn db:reset` at the head of each run
workers / retries: 6 / 0  (observed, from env-posture.txt)
evidence dirs:     tests/e2e-runs/140-f9-precondition/  and  tests/e2e-runs/140-f9-before/
                   (both gitignored at .gitignore:44)
log directory:     $SCRATCH  (OUTSIDE the repository, by design)
```

Unlike Part I and Part II, this lane **does** bind a port and **does** use the database: the dev server
on 5273 and the local Supabase stack, both started and torn down by `e2e-run.sh` within each run.

## 14. RUN 0 — the precondition confirmation (not a control half)

Recorded because it is load-bearing for the interpretation of RUN 1, and explicitly labelled **not** a
half of the two-run control: no adversary was present.

Bumping `perm-hide-category-tags` from one election to two inserts an election-selector page into its
voter walk. Taken **before** any assertion was added, this run establishes that the widened walk still
completes — so a red in plan `140-04` cannot be confused with a walk regression introduced here.

```bash
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/140-f9-precondition \
  --project perm-hide-category-tags
```

```
exit:                 0
head:                 d66467616dded03ef9fd2237e05d879ea0003a7a
started / ended:      2026-08-15T13:09:55Z / 2026-08-15T13:17:07Z
preflight successes:  1
preflight failures:   0
totals:               86 expected, 0 unexpected, 0 flaky, 0 skipped
```

Per-project outcomes for the pair, from `results.json`:

| Project | Title | Status |
|---|---|---|
| `data-setup-perm-hide-election-tags` | import perm-hide-election-tags dataset | expected |
| `perm-hide-election-tags` | showElectionTags=false: election-tag absent on /questions | expected |
| `data-setup-perm-hide-category-tags` | import perm-hide-category-tags dataset | expected |
| `perm-hide-category-tags` | showCategoryTags=false: category-tag absent on /questions | expected |

Two things this confirms beyond the walk:

1. **The single-invocation transitive-coverage claim is observed, not assumed.** `tests/playwright.config.ts:1081`
   declares `data-setup-perm-hide-category-tags` → `dependencies: ['perm-hide-election-tags']`, so one
   `--project perm-hide-category-tags` invocation executes **both** specs. The table above is the
   observation.
2. **Both post-seed `app_settings` EXACT-equality assertions passed** (`setupFromTemplate.ts:256-260`).
   That assertion `toEqual`s the persisted singleton against the template's own declared settings after
   a REPLACE, so an overlay change not mirrored in the template's expectation fails the **setup**, loudly,
   rather than contaminating a downstream perm silently. Both setups are `expected`, so both edited
   templates are internally self-consistent.

## 15. RUN 1 — blindness: absence assertions against a dead render path

### 15.1 Provenance - proof the specs were genuinely still absence-only

The run was taken at HEAD `4c0bf5839b8fee87c233e56b6cc92dbf21ce5b94`, which is the template-edit commit
from § 13.2. At that HEAD:

```console
$ git log -1 --format='%h %ad %s' --date=short -- tests/tests/specs/perm/perm-hide-category-tags.spec.ts
e4de205c4 2026-06-03 refactor(94-03): de-plan + retitle the 22 perm specs
$ git log -1 --format='%h %ad %s' --date=short -- tests/tests/specs/perm/perm-hide-election-tags.spec.ts
e4de205c4 2026-06-03 refactor(94-03): de-plan + retitle the 22 perm specs

$ git show 4c0bf5839:tests/tests/specs/perm/perm-hide-category-tags.spec.ts | grep -n 'toHaveCount'
22:    await expect(page.getByTestId(testIds.shared.categoryTag)).toHaveCount(0);
$ git show 4c0bf5839:tests/tests/specs/perm/perm-hide-election-tags.spec.ts | grep -n 'toHaveCount'
23:    await expect(page.getByTestId(testIds.shared.electionTag)).toHaveCount(0);
```

Neither spec had been touched since 2026-06-03, ten weeks before this phase, and each carried exactly
one assertion — the absence one. **No presence assertion existed anywhere in either file.**

And the template edits WERE present, so the two halves are comparable:

```console
$ git show 4c0bf5839:packages/dev-seed/src/templates/e2e/perm/perm-hide-category-tags.ts | grep -n 'elections: 2'
40:  elections: 2,
$ git show 4c0bf5839:packages/dev-seed/src/templates/e2e/perm/perm-hide-election-tags.ts | grep -n 'showCategoryTags: true'
38:    questions: { showCategoryTags: true }
```

The injection was live for the whole run, evidenced by the runner's own pre-run capture
(`tests/e2e-runs/140-f9-before/worktree-status.txt`), written before Playwright starts:

```
 M .vscode/settings.json
 M apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte
 M supabase/.temp/cli-latest
```

Note what is **absent** from that capture: the two templates, because they were already committed. The
only source difference between RUN 0 and RUN 1 is the injection.

### 15.2 The invocation, verbatim

```bash
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/140-f9-before \
  --project perm-hide-category-tags
```

### 15.3 Observed - verbatim, not paraphrase

```
  86 passed (6.6m)
e2e-run.sh: playwright exit 0
e2e-run.sh: preflight failures 0, successes 1
E2E_EXIT=0
```

```
exit:                 0
head:                 4c0bf5839b8fee87c233e56b6cc92dbf21ce5b94
started / ended:      2026-08-15T13:18:19Z / 2026-08-15T13:25:29Z
preflight successes:  1
preflight failures:   0
observed_workers:     6
observed_retries:     0
totals:               86 expected, 0 unexpected, 0 flaky, 0 skipped
```

Per-project outcomes for the pair, from `tests/e2e-runs/140-f9-before/results.json`, **while both tags
were unrenderable**:

| Project | Title | Status | Failing `file:line` |
|---|---|---|---|
| `data-setup-perm-hide-election-tags` | import perm-hide-election-tags dataset | expected | — |
| `perm-hide-election-tags` | showElectionTags=false: election-tag absent on /questions | **expected (PASS)** | — |
| `data-setup-perm-hide-category-tags` | import perm-hide-category-tags dataset | expected | — |
| `perm-hide-category-tags` | showCategoryTags=false: category-tag absent on /questions | **expected (PASS)** | — |

There is no failing `file:line` to record, in either spec, because nothing failed. That absence is the
observation.

`e2e-run.sh` exits **6** if it finds no preflight SUCCESS line, so the `exit: 0` above is itself the
machine-checked proof that the served application was this checkout and the run is admissible evidence.

### 15.4 The revert and the three-check POST-GATE

```console
$ git checkout -- apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte

$ git status --porcelain -- apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte
                                        # (a) empty - PASS
$ git status --porcelain -- apps tests packages
                                        # (b) empty - PASS
$ grep -rn 'INJECTED (140)' apps packages tests
                                        # (c) no matches - PASS

$ grep -c 'showElectionTags' apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte
1
$ grep -c 'showCategoryTags' apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte
2
```

The component is byte-restored. Gate (a) — an empty per-path `git status --porcelain` — is the
definitive proof of that, since it asserts equality with HEAD across the whole file rather than at two
grep sites. The two counts are recorded because plan `140-03` named them as acceptance criteria; on the
measured file the `showCategoryTags` count is **2**, not the 1 the plan predicted, because the
component's own `### Settings` doc block at line 18 also names the setting. Both counts are identical
to their pre-injection values by construction (gate (a)).

### 15.5 The finding

**With the tag-render path deleted from production source, both perm specs stayed green, and so did the
other 84 tests in the chain.**

`expect(tag).toHaveCount(0)` reports "the setting suppressed the tag" and "the component that would
render the tag no longer exists" with the same green. It measures the *absence of an element*, which is
the state the page is in for at least four distinct reasons, only one of which is the one under test.
An assertion whose pass condition is satisfied by the component's deletion is not testing the setting;
it is testing that the page loaded.

The sharper form of the finding is the 86: the entire perm chain plus `voter-journey` and
`candidate-journey` executed against a build in which **no question heading anywhere renders any tag**,
and the suite reported success. The blind spot is not confined to the two specs that name the tags —
it is the suite's, and the two specs are merely where it is named.

This is why the remedy in plan `140-04` is a complementary **presence** assertion in the same dataset
rather than a stronger matcher: the seeded preconditions from § 13.2 make each dataset render the tag
its sibling suppresses, so this same deletion must make the positive half red while the negative half
stays green. RUN 2 tests exactly that.

### 15.6 COLLATERAL RULE - applied, and empty

Per `139-VERDICTS.md` § 3.3, any test other than the two enumerated sites that goes red under this
injection is collateral: recorded verbatim, explicitly not bearing on the verdict.

**There was none.** `results.json` reports 0 unexpected, 0 flaky and 0 skipped across all 86 tests; a
programmatic filter for any outcome other than `expected` returned an empty list. Deleting the tag
render path plausibly perturbs `voter-journey` and other perm specs, and those specs **did** execute in
this run (the chain is serial and `perm-hide-category-tags` sits near its end) — they simply did not
notice. The collateral column is empty not because the blast radius was scoped away, but because
nothing in the suite detects the deletion.

### 15.7 What this half does NOT discharge

- **It does not discharge ROADMAP criterion 3.** Criterion 3 requires the named pair to FAIL when the
  tag element stops rendering anywhere. This half establishes only the "before" — that they currently do
  **not** fail. The catch is plan `140-04`'s RUN 2, and until that run is recorded with a real failing
  `file:line`, criterion 3 is open.
- **It does not directly observe the rendered DOM.** The run observes that no assertion in the suite
  detected the deletion. It does not, on its own, prove the served page lacked the tags — that the
  mutation reached the browser is established by construction (the runner spawns its own dev server
  *after* the injection is on disk, refuses to adopt a foreign listener, and its preflight asserts the
  served app is this checkout) rather than by a DOM-level observation. **Plan `140-04`'s RUN 2 is what
  converts this to a direct observation**: under the byte-identical injection the new presence
  assertions must go red. If they do not, this half's premise is retroactively invalid and must be
  re-examined rather than explained away.
- **It says nothing about whether the two settings actually work.** Both specs passing under the
  injection means the suite currently has no evidence either way that `showCategoryTags: false` and
  `showElectionTags: false` suppress anything. That evidence arrives only with the positive controls.
- **It is scoped to one project chain and to one tag pair.** `--project perm-hide-category-tags` runs
  86 of the suite's tests, not all of them. The visual gate, the `@probe` family and any project outside
  this dependency chain were not executed. And the same absence-only shape may exist in perm specs this
  phase never examined; ASSERT-05's scope is these two.
- **No CI run has exercised any of this.** Both runs are local — macOS 26.5.1, Node v24.14.1, Playwright
  1.58.2, one machine, one session — which is the same standing Phase-137 CI gap carried in
  `.planning/STATE.md` § Deferred Items.
- **The `elections: 2` widening is proven safe for one walk, once.** RUN 0 shows the category-tags walk
  survives the inserted election-selector page on a single execution at 0 retries. It is not a
  determinism claim; nothing here establishes a repeat rate.

---

<!-- Part III §§ 13-15 written by plan 140-03 (F9 RUN 1). § 16 (F9 RUN 2 + verdict) is appended by
     plan 140-04; the F3 lane (ASSERT-02) is appended by plans 140-05 and 140-06. -->
