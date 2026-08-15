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

| Site | Injected line | Half | Assertion outcome | File outcome | Failing `file:line` | Failure text |
|---|---|---|---|---|---|---|
| **1** `authorize-endpoint.test.ts` | `idura.ts:74` | RUN 1 (pre-repair) | **PASS** (blind) | FAIL (4/9) | `authorize-endpoint.test.ts:147:33` | `TypeError: Cannot read properties of null (reading 'split')` |
| **1** `authorize-endpoint.test.ts` | `idura.ts:74` | RUN 2 (repaired) | **FAIL** (caught) | FAIL (4/9) | `authorize-endpoint.test.ts:144:84` | `AssertionError: authorize URL is missing the 'request' (JAR) parameter: expected null to deeply equal StringMatching{…}` |

<!-- Rows for sites 2 and 3 are appended by 140-01 task 2. -->

**Read the assertion column, and read the two `file:line` values.** The file outcome is FAIL in both
halves — that column distinguishes nothing here, which is exactly why the TWO-COLUMN RULE
(`139-VERDICTS.md` § 3.2) exists. The discrimination lives in (a) the assertion column, PASS → FAIL, and
(b) the failing line, `:147` → `:144`. **The two `file:line` values differ.** A table in which they were
equal would not be evidence.

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

### 5.7 Sites 2 and 3

<!-- Appended by 140-01 task 2. -->

---

## 6. What this pair does and does not prove

<!-- F19 lane written by 140-01 task 3; later lanes appended by 140-02/03/04/06. -->

## 7/8. Verdict — evidence mapped to ROADMAP criteria

<!-- Written by 140-01 task 3 for criterion 2; criteria 1/3/4/5 marked as owned by later plans. -->

### What is explicitly NOT discharged by this document

<!-- Written by 140-01 task 3. -->

### Reproducibility and non-contamination

<!-- Written by 140-01 task 3. -->
