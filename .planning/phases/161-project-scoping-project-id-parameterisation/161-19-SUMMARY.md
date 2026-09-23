---
phase: 161-project-scoping-project-id-parameterisation
plan: 19
subsystem: testing
tags: [static-analysis, lint-gate, regex, negative-controls, re-verification, supabase, vitest]

# Dependency graph
requires:
  - phase: 161-project-scoping-project-id-parameterisation
    provides: "161-17's corpus-axis closure (COMPUTED_INVOKE_RE / COMPUTED_FUNCTIONS_RE / CORPUS_OF) and 161-18's receiver-depth closure (the promoted CLIENT_BINDING_RE) — this plan MEASURES both rather than extending either"
provides:
  - "The fourth re-verification's two end-to-end reproductions, re-run verbatim against the landed tree, each breaking what it previously left green"
  - "NEGATIVE_CONTROLS: every shape whose job is to stay unreported, named and asserted present, with membership MEASURED by deletion rather than reasoned"
  - "FIXTURE_TAILS: all four fixture tails asserted on their own, closing the substring shadow that covered two of four"
  - "A demonstrated red for the residual list's both-directions binding, at six phrases rather than four"
  - "The closing numbers of the whole gap-closure cycle, each quoted beside the command that produced it"
affects: [phase-162, project-scoped-query-guard, gsd-verify-work-161]

actuals:
  tokens: 17400
  tasks: 3
  commits: 3 # MEASURED: git rev-list --count e01f5c6bea3bdd04129091fa7635fe02fd07b17d..HEAD (1 task commit + the docs commit carrying this file + the docs commit carrying STATE/ROADMAP; tasks 1 and 3 are measurement-only and edit no file BY DESIGN)
  plan_head_before: e01f5c6bea3bdd04129091fa7635fe02fd07b17d

tech-stack:
  added: []
  patterns:
    - "Negative-control membership as a MEASURED property: a shape earns its place on the control list by being deleted from its fixture on disk and leaving the guard's summary byte-identical at exit 0, with off-list shapes put through the same measurement to prove the instrument reads something"
    - "Presence-assertion over sweep-re-run: the deletion sweep needs 20 on-disk mutations to say what it says, so the committed assertion is the PRESENCE half — the half that survives a maintainer tidying the fixtures, and the half that goes red when one does"
    - "One reader, two inputs: the residual-section derivation is parameterised so the mutated copy is read by the same function the pinning case reads, never a second derivation free to disagree"

key-files:
  created: []
  modified:
    - packages/dev-seed/tests/projectScopingGate.test.ts

key-decisions:
  - "The closure is re-derived by RUNNING the verifier's own two injections, not by reading 161-17's and 161-18's counts — both CRs existed because a prior round's positive claim was carried forward on a SUMMARY's word"
  - "NEGATIVE_CONTROLS carries 20 shape entries rather than the plan's enumerated 17: the extra three (`scopedFrom` in both class fixtures, `scopedTableRead` in `clean.fixture.ts`) were MEASURED to be controls, and the plan's own acceptance criterion asks for at least 20"
  - "The control assertion is presence-only. A suite that rewrites the guard's own fixtures on every run is a suite that can leave them rewritten; the deletion sweep is the derivation, run once here and transcribed, not the standing gate"
  - "The residual-deletion case reads the text rather than running `selfTestOf`: deleting a docblock bullet changes no behaviour, so a self-test over it comes back green and would be measuring the wrong thing — confirmed by running exactly that (SELFTEST_EXIT=0 with the bullet gone)"
  - "No committed count, matcher or fixture was edited. The guard's behaviour at this HEAD is byte-identical to what 161-18 left"

patterns-established:
  - "Prove the red before trusting the green: every assertion added here was driven red on purpose, and the red was required to be UNIQUE where the point was that nothing else catches it"
  - "A reproduction is reverted in the same task that makes it, with `git status --porcelain scripts/` asserted empty between the two, so the second injection measures the committed tree rather than the first injection's residue"

requirements-completed: []

coverage:
  - id: D1
    description: "CR-01 (corpus axis) re-verified end-to-end: the verifier's exact computed-invoke probe, appended to `outside-boundary.clean.fixture.ts`, now breaks the self-test where it previously printed the committed expectation and exited 0"
    requirement: PRESHIP-01
    verification:
      - kind: command
        ref: "node scripts/assert-project-scoped-queries.mjs --self-test under the CR-01 injection → EXIT=1, `2 expectation(s) FAILED`, outside-clean `0 … (2 site(s))` → `1 … (3 site(s))`"
        status: pass
    human_judgment: false
  - id: D2
    description: "CR-02 (receiver-depth axis) re-verified end-to-end: the verifier's exact sub-object-alias probe, appended to `violation.fixture.ts`, now breaks the self-test on three named counts"
    requirement: PRESHIP-01
    verification:
      - kind: command
        ref: "node scripts/assert-project-scoped-queries.mjs --self-test under the CR-02 injection → EXIT=1, `3 expectation(s) FAILED`, sites 32→33, escape hatches 14→15, alias count 5→6"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every negative control this cycle's closure rests on is asserted present by name, so tidying one away is a named failure rather than a silently weakened measurement (WR-04)"
    requirement: PRESHIP-01
    verification:
      - kind: test
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#keeps every negative control the fixtures rest on"
        status: pass
      - kind: command
        ref: "renaming `optionalCallBucketUpload` in outside-boundary.clean.fixture.ts → that case red by name, while the guard's own self-test stays at exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The residual list's both-directions binding is demonstrated red at six phrases rather than described, and the four-fixture existence assertion no longer covers two of four by substring"
    requirement: PRESHIP-01
    verification:
      - kind: test
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#reddens when a stated residual is deleted from the docblock"
        status: pass
      - kind: command
        ref: "unwrapping the chosen bullet onto one line → the new case red UNIQUELY (sibling count case ✓, self-test exit 0); deleting the bullet from disk → 3 tests red with the self-test still at exit 0"
        status: pass
      - kind: test
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#keeps the self-test fixtures the guard proves itself against, and keeps the guard pointed at them"
        status: pass
    human_judgment: false
  - id: D5
    description: "All five repository gates green at the closing HEAD, read unpiped, and nothing under `apps/` changed across the whole gap-closure cycle"
    requirement: PRESHIP-01
    verification:
      - kind: command
        ref: "self-test / live guard / gate spec / yarn test:unit / yarn lint:check — all EXIT=0; `git diff db1530ca1..HEAD --stat -- apps/` and `-- package.json yarn.lock` both empty"
        status: pass
    human_judgment: false

duration: 15 min
completed: 2026-09-07
---

# Phase 161 Plan 19: Re-Verification by Reproduction Summary

The fourth re-verification's two end-to-end injections were re-run verbatim against what 161-17 and 161-18
landed, and **each now breaks the guard where it previously printed `matching the committed expectation` and
exited 0** — CR-01 on two expectations, CR-02 on three, both reverted with the tree proven clean between
them; and the negative controls that closure rests on are now named and asserted present, with the residual
list's both-directions binding demonstrated red at six phrases rather than described.

**Duration:** 15 min (2026-09-07T07:01Z → 2026-09-07T07:16Z)
**Tasks:** 3 (two measurement-only by design, one committed)
**Files changed:** 1 (`packages/dev-seed/tests/projectScopingGate.test.ts`, +157 −19)

---

## Why this plan exists, and what it was allowed to change

`161-VERIFICATION.md` `gaps[0].missing[2]` asks for the two reproductions to be re-run **"against whatever
lands, rather than trusting a SUMMARY's count — that is the standard this phase has applied to itself at
every prior round, and both gaps here were found exactly because a prior round's positive claim was not
independently re-derived."**

So this plan measures. **No committed count, matcher or fixture was edited.** The guard's behaviour at this
HEAD is byte-identical to what 161-18 left; the only committed change is to the gate spec's presence
assertions. Two of the three tasks produce no commit at all, by design.

---

## Baseline, measured before anything was touched

Every number the plan stated as a premise was re-measured as the first act of the run, per the plan's own
`<baseline>` stop condition. **All of them agreed with what 161-17 and 161-18 recorded.** No finding.

| Premise | Command | Measured |
|---|---|---|
| self-test `32 / 0 / 11 / 0` against sites `32 / 8 / 11 / 2` | `node scripts/assert-project-scoped-queries.mjs --self-test` | matches, EXIT 0 |
| live `5 / 2 / 7 / 550 / 1 / 0` | `node scripts/assert-project-scoped-queries.mjs` | matches, EXIT 0 |
| gate spec 110 tests | `yarn workspace @openvaa/dev-seed vitest run tests/projectScopingGate.test.ts` | `110 passed (110)` |
| `RESIDUAL_PHRASES` 6, docblock `STATED RESIDUALS` 6 bullets | read from disk | 6 and 6 |
| `MATCHER_NAMES` 9, `CALL_SHAPES` 9, `REDUNDANT_CELLS` 2 | read from disk | 9, 9, 2 |

---

## Reproduction A — CR-01, the corpus axis

### The injection, verbatim from `161-VERIFICATION.md` § "Finding 1 (CR-01)"

```
$ cat >> scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts <<'EOF'
export function verifierProbeComputedInvoke(locals: RequestLocals): Promise<unknown> {
  return locals.supabase.functions['invoke']('probe_undispositioned_function', { body: {} });
}
EOF
```

Appended AFTER `nearMissFunctionsPrefixedKey`, at top level, character for character — not tidied, not
renamed, not made to compile against the fixture's own `RequestLocals`.

### The run, verbatim and unpiped

```
$ node scripts/assert-project-scoped-queries.mjs --self-test; echo "EXIT=$?"
[ERROR] scripts/assert-project-scoped-queries.mjs: self-test expectation failed — scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts yielded 3 site(s), expected exactly 2 (the bucket accesses must be excluded).
[ERROR] scripts/assert-project-scoped-queries.mjs: self-test expectation failed — scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts produced 1 violation(s): scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts:87: computed member on the client's `functions` object. The Edge Function behind it is named by a key this guard cannot read, so its written disposition is never checked and the site would be uncounted by the invocation family. Name the member: `.functions.invoke('<function>', …)`..
Project-scoped query guard — self-test flagged 32 line(s) in scripts/fixtures/project-scoped-queries/violation.fixture.ts (32 access(es)) and 0 in scripts/fixtures/project-scoped-queries/clean.fixture.ts (8 access(es)), plus 11 line(s) in scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts (11 site(s)) and 1 in scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts (3 site(s)), 2 expectation(s) FAILED.
EXIT=1
```

### What moved, and which expectations broke

| | Fourth re-verification (BEFORE) | This run (AFTER) |
|---|---|---|
| exit status | `0` | **`1`** |
| summary tail | `matching the committed expectation` | **`2 expectation(s) FAILED`** |
| outside-clean | `0 … (2 site(s))` | **`1 … (3 site(s))`** |

The two broken expectations, named rather than merely counted:

1. `outsideCleanCount === 2` (`scripts/assert-project-scoped-queries.mjs:1292`) — the outside-clean fixture's
   site count, which the guard's own comment says must be exact precisely so "a number one higher than
   expected means a bucket was read as a table and a zero means nothing was checked".
2. `outsideCleanMessages.length === 0` (`:1332`) — the clean-corpus-produces-no-violations expectation, whose
   failure message carries the reported site verbatim, at `:87`, naming the rule that caught it.

**CR-01 is CLOSED.** The shape the verifier appended to the clean corpus is now both **reported** and
**counted** at the boundary address — the address `INVOKE_RE` was unanchored specifically to reach.

### Revert, proven

```
$ git checkout -- scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts
$ git status --porcelain scripts/
$ node scripts/assert-project-scoped-queries.mjs --self-test; echo "EXIT=$?"
Project-scoped query guard — self-test flagged 32 line(s) in scripts/fixtures/project-scoped-queries/violation.fixture.ts (32 access(es)) and 0 in scripts/fixtures/project-scoped-queries/clean.fixture.ts (8 access(es)), plus 11 line(s) in scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts (11 site(s)) and 0 in scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts (2 site(s)), matching the committed expectation.
EXIT=0
```

`git status --porcelain scripts/` printed **nothing**. The tree was proven back to its committed state at
`32 / 0 / 11 / 0` before the second reproduction touched it — the two injections never overlapped, because a
run that reddens under both says nothing about which one moved it.

---

## Reproduction B — CR-02, the receiver-depth axis

### The injection, verbatim from `161-VERIFICATION.md` § "Finding 2 (CR-02)"

```
$ cat >> scripts/fixtures/project-scoped-queries/violation.fixture.ts <<'EOF'
export function verifierProbeSubObjectAlias(): void {
  const fns = this.supabase.functions;
  fns.invoke('probe_undispositioned_function_2', { body: {} });
}
EOF
```

Appended AFTER the closing brace of `ViolationFixture`, at TOP LEVEL, exactly as the verifier wrote it. The
`this` outside a class is not valid TypeScript semantics and was left that way deliberately: the guard reads
TEXT, and rewriting the probe to compile would be re-verifying a shape the reviewer never injected.

### The run, verbatim and unpiped

```
$ node scripts/assert-project-scoped-queries.mjs --self-test; echo "EXIT=$?"
[ERROR] scripts/assert-project-scoped-queries.mjs: self-test expectation failed — scripts/fixtures/project-scoped-queries/violation.fixture.ts yielded 33 site(s), expected exactly 32 (the bucket accesses must be excluded).
[ERROR] scripts/assert-project-scoped-queries.mjs: self-test expectation failed — scripts/fixtures/project-scoped-queries/violation.fixture.ts yielded 15 escape-hatch site(s), expected exactly 14.
[ERROR] scripts/assert-project-scoped-queries.mjs: self-test expectation failed — scripts/fixtures/project-scoped-queries/violation.fixture.ts produced 6 check-6 aliased-client violation(s), expected exactly 5 (the plain alias, the nullish-coalesced one, the optional-receiver one, the sub-object one and the bound scalar member).
Project-scoped query guard — self-test flagged 33 line(s) in scripts/fixtures/project-scoped-queries/violation.fixture.ts (33 access(es)) and 0 in scripts/fixtures/project-scoped-queries/clean.fixture.ts (8 access(es)), plus 11 line(s) in scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts (11 site(s)) and 0 in scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts (2 site(s)), 3 expectation(s) FAILED.
EXIT=1
```

### What moved

| Count | Fourth re-verification (BEFORE) | Plan's required AFTER | Measured |
|---|---|---|---|
| exit status | `0` | `1` | **`1`** |
| summary tail | `matching the committed expectation` | `expectation(s) FAILED` | **`3 expectation(s) FAILED`** |
| violation fixture sites | 27, unmoved | 33 | **33** |
| escape-hatch family | unmoved | 15 | **15** |
| alias count | unmoved | 6 | **6** |

All three of the plan's predicted movements landed on the exact predicted numbers. **CR-02 is CLOSED.** A
sub-object alias inside the guard's own strictest corpus is now both reported and counted, and it is counted
in the escape-hatch family, so the per-family non-vacuity floor can see that family go silent.

### Revert, proven

```
$ git checkout -- scripts/fixtures/project-scoped-queries/violation.fixture.ts
$ git status --porcelain scripts/
$ node scripts/assert-project-scoped-queries.mjs --self-test; echo "EXIT=$?"
Project-scoped query guard — self-test flagged 32 line(s) in scripts/fixtures/project-scoped-queries/violation.fixture.ts (32 access(es)) and 0 in scripts/fixtures/project-scoped-queries/clean.fixture.ts (8 access(es)), plus 11 line(s) in scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts (11 site(s)) and 0 in scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts (2 site(s)), matching the committed expectation.
EXIT=0
$ git status --porcelain -- apps/ packages/
$ echo "EXIT=$?"
EXIT=0
```

`git status --porcelain scripts/` printed nothing; `git status --porcelain -- apps/ packages/` printed
nothing. No injection, probe or scratch fixture survived either reproduction.

---

## The negative controls, held in place by name

### Membership is measured, not reasoned

The plan asks for the controls to be named and their presence asserted. Before naming any of them, each
candidate was put through the property that makes it a control: **deleted from its fixture on disk on its
own, the guard's self-test re-run, and its summary line required back byte-identical at exit 0.** Twenty
shapes passed that measurement. Three shapes deliberately kept OFF the list were put through the identical
measurement and each moved the counts to exit 1, which is what says the instrument was reading something
rather than reporting a uniform silence:

```
CONTROL (counts unmoved)     clean.fixture.ts :: scopedFrom
CONTROL (counts unmoved)     clean.fixture.ts :: bucketUpload
CONTROL (counts unmoved)     clean.fixture.ts :: scopedTableRead
CONTROL (counts unmoved)     clean.fixture.ts :: destructuredCallResult
CONTROL (counts unmoved)     clean.fixture.ts :: nonTableClientCall
CONTROL (counts unmoved)     clean.fixture.ts :: nearMissSuffixedFunctions
CONTROL (counts unmoved)     clean.fixture.ts :: nearMissFunctionsPrefixedKey
MOVES (exit 1)               clean.fixture.ts :: dispositionedRpc
MOVES (exit 1)               clean.fixture.ts :: deploymentScopedInvocation
CONTROL (counts unmoved)     outside-boundary.clean.fixture.ts :: bucketUpload
CONTROL (counts unmoved)     outside-boundary.clean.fixture.ts :: viaAdapterSurface
CONTROL (counts unmoved)     outside-boundary.clean.fixture.ts :: collectRows
CONTROL (counts unmoved)     outside-boundary.clean.fixture.ts :: optionalChainedBucketUpload
CONTROL (counts unmoved)     outside-boundary.clean.fixture.ts :: viaOptionalAdapterSurface
CONTROL (counts unmoved)     outside-boundary.clean.fixture.ts :: optionalCallBucketUpload
CONTROL (counts unmoved)     outside-boundary.clean.fixture.ts :: nearMissSuffixedFunctions
CONTROL (counts unmoved)     outside-boundary.clean.fixture.ts :: nearMissFunctionsPrefixedKey
MOVES (exit 1)               outside-boundary.clean.fixture.ts :: deploymentScopedInvocation
CONTROL (counts unmoved)     violation.fixture.ts :: scopedFrom
CONTROL (counts unmoved)     violation.fixture.ts :: bucketUpload
CONTROL (counts unmoved)     violation.fixture.ts :: optionalChainedBucketUpload
CONTROL (counts unmoved)     violation.fixture.ts :: optionalCallBucketUpload
CONTROL (counts unmoved)     violation.fixture.ts :: scopedTableRead
MOVES (exit 1)               violation.fixture.ts :: subObjectAliasedClient

CONTROL count = 20
```

`git status --porcelain scripts/` was empty after the sweep. The sweep script itself is a scratch artefact
and is **not** committed — see the decision below on why the standing assertion is presence rather than a
re-run of this.

`destructuredCallResult` — the live `this.supabase.auth.getUser()` shape at
`apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:166`, and the one control
CR-02's closure turns on — is present in `clean.fixture.ts` and stays unreported: the clean fixture's site
count is unmoved at 8 and it produces zero violations, at every measurement in this plan.

### The committed assertion

`NEGATIVE_CONTROLS` names 3 fixtures and **20 shape entries** (12 distinct names, several of them held at
more than one address on purpose). `it('keeps every negative control the fixtures rest on')` asserts the
instrument before the measurement — non-empty fixture text, non-empty shape list — then asserts each shape
name is present, one at a time, so the failure message says WHICH control went missing.

**Demonstrated red rather than assumed.** Renaming one control in its fixture:

```
$ (rename optionalCallBucketUpload -> tidiedAwayControl in outside-boundary.clean.fixture.ts)
 × the project-scoped query guard is wired into lint:check > keeps every negative control the fixtures rest on
   → outside-boundary.clean.fixture.ts :: optionalCallBucketUpload: expected '/**\n * Fixture: the call shapes `scr…' to contain 'optionalCallBucketUpload'
      Tests  1 failed | 111 passed (112)
```

The measurement sweep above already showed that this same shape's **deletion leaves the guard's own
self-test at exit 0**. That is the whole point: this case is the only thing in the repository that catches
it. WR-04's failure mode is now a named failure.

### The smaller instance of the same shape, closed

`keeps the self-test fixtures the guard proves itself against` iterated
`['violation.fixture.ts', 'clean.fixture.ts']`. Both strings are SUBSTRINGS of the two `outside-boundary.*`
filenames, so the outside pair was covered by neither the file read (which resolved the short names) nor the
`toContain` (which the long names satisfy incidentally). It now iterates `FIXTURE_TAILS`, all four, each
asserted on its own with the tail in the failure message. Demonstrated red by removing the outside-clean
fixture:

```
 × keeps the self-test fixtures the guard proves itself against, and keeps the guard pointed at them
   → ENOENT: no such file or directory, open '…/scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts'
```

---

## The residual list's red, demonstrated at six phrases

`it('reddens when a stated residual is deleted from the docblock')` takes `GUARD_SOURCE`, finds the bullet
carrying 161-17's phrase (`a computed member whose key is not a string literal is unreported` — the newest,
and the least likely to be load-bearing anywhere else), deletes the WHOLE bullet from an in-memory copy
(its own line plus the continuation lines that wrap it), and asserts four things:

1. the copy differs from `GUARD_SOURCE` — the instrument first, because a deletion that changed nothing
   would re-measure the unmutated guard;
2. its `STATED RESIDUALS` bullet count is `RESIDUAL_PHRASES.length - 1`;
3. the phrase is absent from the copy's residual prose;
4. the phrase is still present in the real one, so a failure above is a statement about the DELETION rather
   than about a phrase that had already gone.

The copy is never written to disk and never handed to `selfTestOf` — and that decision was **measured, not
assumed**: deleting the bullet from the guard on disk leaves `node scripts/assert-project-scoped-queries.mjs
--self-test` at `SELFTEST_EXIT=0`. A self-test run over a docblock mutation comes back green and measures the
wrong thing entirely.

**Both directions, demonstrated on disk.** Deleting that residual bullet from the real guard:

```
$ (delete the bullet from scripts/assert-project-scoped-queries.mjs)
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯
      Tests  3 failed | 109 passed (112)
$ node scripts/assert-project-scoped-queries.mjs --self-test >/dev/null 2>&1; echo "SELFTEST_EXIT=$?"
SELFTEST_EXIT=0
```

Three tests red; the guard itself still green. The gate spec is the only thing that catches a residual
being stated away, and it does so at six phrases.

**The new case's red is UNIQUE where that matters.** Unwrapping the chosen bullet onto a single line leaves
the sibling count case green (the bullet count is unchanged at 6) and the guard green, and reddens only the
new case:

```
 ✓ every punctuator … > states exactly the residuals the matrix pins, and no others
 × every punctuator … > reddens when a stated residual is deleted from the docblock
   → the chosen bullet wraps, so its deletion must span more than one line: expected 60 to be greater than 60
      Tests  1 failed | 111 passed (112)
$ node scripts/assert-project-scoped-queries.mjs --self-test >/dev/null 2>&1; echo "SELFTEST_EXIT=$?"
SELFTEST_EXIT=0
```

The residual derivation was parameterised for this — `moduleDocblockOf(source)`, `residualSectionOf(source)`,
`residualProseOf(section)`, `residualBulletCountOf(section)` — so the mutated copy is read by the SAME reader
the pinning case reads, never a second derivation free to disagree with it. `states exactly the residuals`
was moved onto `residualBulletCountOf` in the same commit for that reason.

---

## Closing gates, each read unpiped at the closing HEAD

All five run at `91746f3b3`, each with `; echo "EXIT=$?"` and no pipe — `cmd | grep …` reports grep's status,
and this repository has lost two commits to exactly that.

### 1. `node scripts/assert-project-scoped-queries.mjs --self-test` → **EXIT 0**

```
Project-scoped query guard — self-test flagged 32 line(s) in scripts/fixtures/project-scoped-queries/violation.fixture.ts (32 access(es)) and 0 in scripts/fixtures/project-scoped-queries/clean.fixture.ts (8 access(es)), plus 11 line(s) in scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts (11 site(s)) and 0 in scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts (2 site(s)), matching the committed expectation.
```

`32 / 0 / 11 / 0` against site counts `32 / 8 / 11 / 2`, `matching the committed expectation` present.
**Unmoved from 161-18.**

### 2. `node scripts/assert-project-scoped-queries.mjs` → **EXIT 0**

```
Project-scoped query guard — 5 guarded source(s), 0 deferred, 5 adapter source(s) on disk, 5 raw client call(s) examined, 2 Edge Function invocation(s), 7 client-touching site(s) in all, 550 source(s) outside the adapter directory walked, 1 outside site(s) examined, 0 violation(s); self-test flagged 32 line(s) … matching the committed expectation.
```

Live summary `5 / 2 / 7 / 550 / 1 / 0`. **Unmoved.**

### 3. `yarn workspace @openvaa/dev-seed vitest run tests/projectScopingGate.test.ts` → **EXIT 0**

```
 ✓ tests/projectScopingGate.test.ts (112 tests) 1283ms
 Test Files  1 passed (1)
      Tests  112 passed (112)
```

**110 → 112**, 0 failed. The plan requires at least 2 above 161-18's 110; it grew by exactly 2 (the control
presence case and the residual-deletion case).

### 4. `yarn test:unit` → **EXIT 0**

```
 Tasks:    25 successful, 25 total
Cached:    14 cached, 25 total
  Time:    18.928s
```

Run because the gate spec is a unit test and a green single-file run says nothing about the suite. Also run
BEFORE the task commit, per 161-17's and 161-18's recorded lesson that a suite left transiently red across
commits is a defect of the commit boundary rather than of the code.

### 5. `yarn lint:check` → **EXIT 0**

Read directly from the chain's own status, never through a pipe. All 18 links pass, including
`assert-comment-hygiene.mjs` — the link 161-18 found red across two commits, and the one most exposed by this
plan, since its whole diff is new prose:

```
Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 1662; vendored files excluded by name: 2; rules live: 2 of 2 (unicode-escape-in-comment; forced-line-break). 0 violation(s).
```

The 24 pre-existing warnings (`unused-imports/no-unused-vars` in `packages/dev-seed/src/generators/**`,
`playwright/prefer-to-have-length` in `tests/**`) are untouched by this plan.

### Ranged tree hygiene

The base SHA, recorded so the fifth verification pass runs the identical command rather than guessing at it:

- **Cycle base — `db1530ca1f51eb84306251607309c67733c3e270`**, the `plan_head_before` recorded in
  `161-17-SUMMARY.md`, i.e. HEAD before 161-17, 161-18 and 161-19 landed. This is the `$PRE_PLAN_HEAD` the
  plan's prohibition names.
- Plan-local base — `e01f5c6bea3bdd04129091fa7635fe02fd07b17d`, HEAD before this plan's own first action.

```
git diff db1530ca1f51eb84306251607309c67733c3e270..HEAD --stat -- apps/                  → 0 bytes (EMPTY)
git diff db1530ca1f51eb84306251607309c67733c3e270..HEAD --stat -- package.json yarn.lock  → 0 bytes (EMPTY)
git diff e01f5c6bea3bdd04129091fa7635fe02fd07b17d..HEAD --stat -- apps/                   → 0 bytes (EMPTY)
git diff e01f5c6bea3bdd04129091fa7635fe02fd07b17d..HEAD --stat
  packages/dev-seed/tests/projectScopingGate.test.ts | 176 ++++++++++++++++++---
  1 file changed, 157 insertions(+), 19 deletions(-)
git status --porcelain  → only .planning/ paths (config.json, state.json, milestone.lock), all pre-existing
```

Ranged rather than bare, deliberately: a bare `git diff` passes vacuously the moment a change is committed.
Criteria c1/c3/c4 of `161-VERIFICATION.md` rest on the `apps/` tree being untouched across every gap-closure
cycle. It is, across all three plans of this one. No package-manager install occurred and no dependency was
added (T-161-19-SC).

### Closing structural counts, MEASURED from the file on disk

| Constant | Command | Measured |
|---|---|---|
| `MATCHER_NAMES` | array-literal slice of the gate spec | **9** |
| `CALL_SHAPES` | same | **9** |
| `REDUNDANT_CELLS` | same | **2** |
| `RESIDUAL_PHRASES` | same | **6** |
| `FIXTURE_TAILS` (new) | same | **4** |
| `NEGATIVE_CONTROLS` (new) | same | **3 fixtures / 20 shape entries / 12 distinct names** |
| `violationTally` | `grep -n "violationTally\.… ===" scripts/assert-project-scoped-queries.mjs` | **`{ accesses: 8, escapeHatches: 14, invocations: 5, schemaHops: 5 }`** |

`8 + 14 + 5 + 5 = 32`, which is the violation fixture's site count in gate 1. The decomposition is a
partition of it.

### Why no E2E run was made this cycle

Stated with its reason rather than left to read as an omission. The guard, its four fixtures and the gate
spec are **lint-time source**: never imported, never built, never executed by the application. Nothing under
`apps/` changed across the whole cycle — `git diff db1530ca1..HEAD --stat -- apps/` is empty — so a fresh E2E
run would exercise nothing any of the three plans touched. The phase's closing E2E run
(`tests/e2e-runs/161-13-close`, exit 0, 155/0/0/0) remains the relevant evidence, unaffected. That empty
ranged diff IS the argument; it is not a claim that E2E was skipped for convenience.

---

## Accomplishments

1. **Both of the fourth re-verification's end-to-end reproductions re-run verbatim and each broke the
   guard.** CR-01 on two named expectations (outside-clean site count 2 → 3, clean-corpus-produces-nothing);
   CR-02 on three (sites 32 → 33, escape hatches 14 → 15, aliases 5 → 6). Measured in isolation, reverted in
   isolation, with a green self-test and an empty `git status --porcelain scripts/` between them.
2. **`NEGATIVE_CONTROLS` — 20 measured shapes across three fixtures, asserted present by name.** The half of
   every fixture pair that was held by nothing is now held by a named failure. WR-04 closed for the controls
   this cycle rests on and for the pre-existing ones the review named.
3. **The four-fixture existence assertion no longer covers two of four by substring.**
4. **The residual list's both-directions binding demonstrated red at six phrases**, with the demonstration's
   own uniqueness proven (the sibling case and the guard both stay green under the mutation that reddens it).
5. **All five repository gates green at the closing HEAD, unpiped**, and nothing under `apps/`,
   `package.json` or `yarn.lock` changed across the whole three-plan cycle.

---

## Deviations from Plan

### 1. [Rule 1 - Bug] The plan's `NEGATIVE_CONTROLS` enumeration lists 17 shapes; its own acceptance criterion requires at least 20

- **Found during:** Task 2
- **Issue:** The plan enumerates the controls explicitly — 5 in `clean.fixture.ts`, 8 in
  `outside-boundary.clean.fixture.ts`, 4 in `violation.fixture.ts` — which totals **17**, while its
  acceptance criterion reads "names at least 20 shapes across the three fixtures listed above". The two
  cannot both be satisfied from the plan's own list.
- **Fix:** Rather than pad the list or lower the criterion, the control property was MEASURED across every
  candidate shape in the three fixtures (the sweep transcribed above). Exactly **20** shapes satisfy it. The
  three the plan's enumeration omits are `scopedFrom` in both class fixtures and `scopedTableRead` in
  `clean.fixture.ts` — the sanctioned route the guard steers callers toward, and the stub it goes through,
  each measured to leave the guard's summary byte-identical at exit 0 when deleted. The committed list
  carries all 20, so the criterion is met by measurement rather than by arithmetic.
- **Files modified:** `packages/dev-seed/tests/projectScopingGate.test.ts`
- **Verification:** `NEGATIVE_CONTROLS` holds 20 shape entries (measured from the array literal on disk);
  every one verified present in its fixture by the committed case, which passes.
- **Commit:** `91746f3b3`

### 2. [Rule 2 - Missing critical] The residual derivation was not parameterised, so the demonstration would have needed a second copy of it

- **Found during:** Task 2
- **Issue:** `RESIDUAL_SECTION` was an IIFE over a `MODULE_DOCBLOCK` const, both closed over `GUARD_SOURCE`.
  The new case must derive the same section from a MUTATED copy. Writing that derivation out again beside it
  would leave two readers free to disagree — the exact defect class this file exists to prevent, and the
  reason `matcherSpanOf` and `functionBodyOf` already take a `source` parameter.
- **Fix:** Extracted `moduleDocblockOf(source = GUARD_SOURCE)`, `residualSectionOf(source = GUARD_SOURCE)`,
  `residualProseOf(section)` and `residualBulletCountOf(section)` in the house style, and moved the
  pre-existing `states exactly the residuals the matrix pins, and no others` case onto
  `residualBulletCountOf` in the SAME commit — so the case that pins the count and the case that demonstrates
  it falling read one counter, not two.
- **Files modified:** `packages/dev-seed/tests/projectScopingGate.test.ts`
- **Verification:** gate spec 112 passed / 0 failed; the pinning case verified still green under the mutation
  that reddens the new one, which is what says the two are reading the same section from different inputs.
- **Commit:** `91746f3b3`

### 3. [Rule 2 - Missing critical] `FIXTURE_TAILS` extracted rather than inlining four literals

- **Found during:** Task 2
- **Issue:** The plan says to extend the iterated list to all four tails. Inlining them would leave the
  substring hazard undocumented at the one place a future editor would shorten the list again.
- **Fix:** Declared `FIXTURE_TAILS` with a docblock naming the hazard explicitly — the two `outside-boundary.*`
  names each CONTAIN one of the other two — so the reason the list must stay at four travels with it.
- **Files modified:** `packages/dev-seed/tests/projectScopingGate.test.ts`
- **Verification:** demonstrated red by removing the outside-clean fixture; the case names the tail.
- **Commit:** `91746f3b3`

**Total deviations:** 3 auto-fixed (1 bug, 2 missing critical). **Impact:** none on the guard's behaviour —
no matcher, fixture or committed count was touched, and gates 1 and 2 are byte-identical to what 161-18 left.
All three deviations are confined to the gate spec's own instrument.

**Not a deviation, but worth recording:** Tasks 1 and 3 produce **no commit**. Both are measurement-only by
the plan's own design ("No file is edited in this task unless a gate fails"), and both left
`git status --porcelain scripts/ apps/ packages/` empty. `actuals.commits` is 1 and that is the measured
value, not a shortfall.

---

## Findings against the two SUMMARYs being re-verified

The plan required every number it states to be re-measured against the real tree rather than trusted, and
any disagreement reported prominently rather than adjusted for.

**There were none.** Every premise agreed: self-test `32 / 0 / 11 / 0` against `32 / 8 / 11 / 2`, live
`5 / 2 / 7 / 550 / 1 / 0`, gate spec 110, `RESIDUAL_PHRASES` 6 and 6 docblock bullets, `MATCHER_NAMES` 9,
`CALL_SHAPES` 9, `REDUNDANT_CELLS` 2, `violationTally` `{ 8, 14, 5, 5 }`. Both 161-17 and 161-18 recorded
their tree accurately, including the five and four auto-fixed deviations they each carried. This is stated as
a measurement, not as a compliment: the re-derivation was run precisely because a prior round's accurate-
looking claim is exactly what the two CRs slipped past.

---

## Issues Encountered

None.

---

## Deferred Issues

None introduced. The two residuals this cycle's closures stated (161-17's runtime-computed key; 161-18's
bound scalar member reported as an alias) remain stated in the docblock and pinned in both directions at six
phrases, which this plan measured rather than assumed. The four follow-ups under `.planning/todos/pending/`
are untouched.

---

## Known Stubs

None. No shape in this plan's diff is a placeholder: `NEGATIVE_CONTROLS` is populated from measurement, and
every assertion added was driven red on purpose before being trusted green.

---

## Threat Flags

None. The diff touches one test file and introduces no network endpoint, auth path, file-access pattern or
schema change. `git diff <cycle base>..HEAD --stat -- apps/` is empty.

---

## Next Phase Readiness

`161-VERIFICATION.md` `gaps[0].missing` had three items. All three now have on-disk answers:

| Item | Answered by | Re-derived here |
|---|---|---|
| CR-01, corpus axis | 161-17 | **Yes** — Reproduction A, exit 1, 2 expectations broken |
| CR-02, receiver-depth axis | 161-18 | **Yes** — Reproduction B, exit 1, 3 expectations broken |
| Re-verify by re-running both reproductions against whatever lands | **this plan** | It IS the re-derivation |

Ready for `/gsd-verify-work 161` (fifth pass). The fifth pass should re-run both injections verbatim from the
transcripts above and compare against the recorded exits and counts, and should re-run
`git diff db1530ca1f51eb84306251607309c67733c3e270..HEAD --stat -- apps/` rather than a bare `git diff`.
`PRESHIP-01` is deliberately left at `Gaps Found` in `.planning/REQUIREMENTS.md` — flipping it is the
verifier's call, not this plan's.

## Self-Check: PASSED

- `packages/dev-seed/tests/projectScopingGate.test.ts` — FOUND on disk, modified, committed.
- `.planning/phases/161-project-scoping-project-id-parameterisation/161-19-SUMMARY.md` — FOUND on disk.
- Commit `91746f3b3` — FOUND in `git log`.
- `git status --porcelain` clean beyond pre-existing `.planning/` paths.
- All five gates re-run at the closing HEAD: EXIT 0, EXIT 0, EXIT 0, EXIT 0, EXIT 0.
