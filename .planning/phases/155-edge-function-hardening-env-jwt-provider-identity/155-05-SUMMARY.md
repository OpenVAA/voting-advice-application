---
phase: 155-edge-function-hardening-env-jwt-provider-identity
plan: 05
subsystem: build-verification
tags: [guard, lint-check, edge-functions, static-analysis, comment-classifier]
status: complete

requires:
  - '155-02 (invite-candidate SITE_URL throw, canonical envConfig.ts)'
  - '155-03 (identity-callback three throws)'
  - '155-04 (send-email three throws, second jwtSegment.ts copy)'
  - 'scripts/assert-comment-hygiene.mjs (phase 152, source of the shared classifier)'
provides:
  - 'scripts/assert-edge-env-defaults.mjs — the standing D-D2 class guard, live on every yarn lint:check'
  - 'scripts/lib/comment-spans.mjs — the shared comment-span classifier, now importable by any guard under scripts/'
  - 'yarn assert:edge-env-defaults — link 8 of 8 in lint:check'
  - 'packages/dev-seed/tests/edgeEnvDefaultsGate.test.ts — 4 tests holding the wiring'
affects:
  - 'scripts/assert-comment-hygiene.mjs (now imports the classifier rather than defining it)'
  - 'apps/supabase/supabase/functions/** (now gated; previously reached only by Prettier and this phase vitest files)'

tech-stack:
  added: []
  patterns:
    - 'Committed Node scan chained into lint:check, the house guard shape (fourth of its family)'
    - 'Structural comment exclusion by span index rather than by text mutation'
    - 'Chain MEMBERSHIP assertion, never terminal position (phase 144 b410d3a90 carried forward)'

key-files:
  created:
    - scripts/assert-edge-env-defaults.mjs
    - scripts/lib/comment-spans.mjs
    - packages/dev-seed/tests/edgeEnvDefaultsGate.test.ts
  modified:
    - package.json
    - scripts/assert-comment-hygiene.mjs

key-decisions:
  - 'Extracted the comment-span classifier to scripts/lib/comment-spans.mjs rather than hand-rolling a fourth copy or adding an entry-point guard to a live guard'
  - 'Check 2 uses a named two-entry roster, not auto-detection of every repeated basename, because auto-detection would ship the guard three violations red'
  - 'The guard is chained into lint:check ONLY, deliberately not into test:unit or test:e2e, and the omission is asserted so it reads as a decision'
  - 'Task 1 AC4 (imports begin with node:) revised into a criterion testing the property it protected, and flip-tested'

requirements-completed: []

coverage:
  - deliverable: 'The environment-default class is closed by a live check'
    verification:
      - kind: command
        ref: 'node scripts/assert-edge-env-defaults.mjs (0 violations over 17 files)'
        status: pass
      - kind: command
        ref: 'injected default -> exit 1 naming send-email/index.ts:216; reverted -> exit 0'
        status: pass
      - kind: command
        ref: 'yarn lint:check exit 0 end to end, guard as link 8 of 8'
        status: pass
    human_judgment: false
  - deliverable: 'Comments are excluded structurally, so the four docstrings this phase wrote do not redden the guard'
    verification:
      - kind: command
        ref: 'guard clean while 4 docstrings quote the forbidden shape; 12 prose mentions in an injected block comment not flagged while the real line 230 was'
        status: pass
    human_judgment: false
  - deliverable: 'The duplicated modules cannot drift undetected'
    verification:
      - kind: command
        ref: 'single-character drift in one envConfig.ts copy -> exit 1 naming both paths; reverted -> 0'
        status: pass
    human_judgment: false
  - deliverable: 'Modules the tests reach cannot lose their reachability'
    verification:
      - kind: command
        ref: 'URL import and Deno global each injected into templateVars.ts -> exit 1; reverted -> 0'
        status: pass
    human_judgment: false
  - deliverable: 'The guard cannot be silently unwired'
    verification:
      - kind: tests
        ref: 'packages/dev-seed/tests/edgeEnvDefaultsGate.test.ts (4 tests)'
        status: pass
      - kind: command
        ref: 'removing the chain link -> 1 failed / 3 passed; restoring -> 4/4; appending a later link -> still 4/4'
        status: pass
    human_judgment: false
  - deliverable: 'The classifier extraction changed no behaviour in phase 152 guard'
    verification:
      - kind: command
        ref: 'assert-comment-hygiene --self-test PASSED; whole-tree run byte-identical on stdout and stderr against pre-extraction capture'
        status: pass
    human_judgment: false

metrics:
  duration: 23 min
  completed: 2026-08-29
  tasks: 2
  files: 5

actuals:
  tokens: 18630
  tasks: 2
  commits: 3
---

# Phase 155 Plan 05: Edge-Function Environment-Default Guard Summary

A committed Node scan, live as link 8 of 8 in `yarn lint:check`, that closes decision D-D2's
**class** rather than its seven instances: no Edge Function may reintroduce a silent environment
default, the duplicated sibling modules may not drift, and the modules vitest reaches may not lose
the property that makes them reachable. Comments are excluded through the repository's shared
comment-span classifier, extracted here so the guard does not become a fourth opinion about what
a comment is.

## What shipped

| File | Role |
|---|---|
| `scripts/assert-edge-env-defaults.mjs` | The guard. Three checks, 17 files scanned, 0 violations. |
| `scripts/lib/comment-spans.mjs` | The shared classifier, extracted verbatim from the phase-152 guard. 7 exported symbols. |
| `packages/dev-seed/tests/edgeEnvDefaultsGate.test.ts` | 4 tests holding the wiring, the script, the classifier, and the deliberate omission. |
| `package.json` | `assert:edge-env-defaults` script entry, appended to `lint:check`. |
| `scripts/assert-comment-hygiene.mjs` | Now imports the classifier instead of defining it; `COPY RELATIONSHIP` docblock rewritten. |

The three checks: **check 1** — no `Deno.env.get(...)` followed by `??` or `||`; **check 2** —
`envConfig.ts` (3 copies) and `jwtSegment.ts` (2 copies) byte-identical; **check 3** — every
module with a `*.test.ts` beside it keeps no remote-URL import and no Deno global.

## The two prior plans' filed ACTION, discharged

155-03 and 155-04 both filed the same action: the guard must exclude comment lines or it fails on
the docstrings this phase itself wrote. **I measured it rather than inheriting it.** A
comment-blind scan over the functions tree returns **exactly 4 hits, all of them prose, none of
them code** — the four `envConfig.ts` / `envConfig.test.ts` docstrings that quote
``Deno.env.get('X') || fallback`` in order to declare why the shape is abolished. 155-04's count
of four was correct.

**A fifth trap the filed action did not name, found by measurement.** Check 3 has the identical
problem from the other direction: `envConfig.ts`, `claimConfig.ts` and `verifyConfig.ts` all
name the Deno global **in prose** ("no `Deno.env`, no `Deno.serve`, no URL imports from
deno.land") while containing none in code. A check-3 implementation without comment exclusion
would have reddened on the very docstrings that state the contract it enforces. Both checks use
the classifier for this reason.

## Deviations from Plan

### 1. [Rule 3 — Blocking] The classifier could not be reused without extracting it

- **Found during:** Task 1, before writing a line of the guard.
- **Issue:** The orchestrator forbade a fourth hand-rolled classifier and directed reuse of the
  existing one "if it fits". It did not fit as it stood: the classifier lived **inside**
  `scripts/assert-comment-hygiene.mjs` with no `export` on any symbol, in a module that
  self-executes a whole-tree scan on import. The only other copy is in
  `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs`, which phase 152 recorded as a
  D-15 exempt tree it may not touch.
- **Three routes considered, and why the chosen one wins on failure mode rather than on size:**
  - **(a) Hand-roll a stripper in the new guard.** Rejected: that is precisely the fourth copy.
  - **(b) Add an entry-point guard around `assert-comment-hygiene`'s `main()`** so it can be
    imported. A three-line edit, and **rejected anyway**: its failure mode is that phase 152's
    comment guard *silently stops running*. That is the examines-nothing-reports-green
    catastrophe this very phase is written against, and it would be **latent** — nothing would
    announce it.
  - **(c) Extract the classifier to `scripts/lib/comment-spans.mjs`, imported by both.**
    **Chosen.** Its failure mode is an ordinary refactor bug, and the detector for that is
    *already committed*: `assert-comment-hygiene --self-test` diffs committed fixtures against
    the live classifier.
- **Fix:** 7 symbols moved verbatim (`FAMILY_BY_EXT`, `OPENER_RE`, `commentSpans`, `extensionOf`,
  `familyFor`, `inSpans`, `openerEnd`); only `export` added and two stale "(copied)" annotations
  corrected. The `.claude/` copy stays a copy, and the lockstep obligation is now written in both
  files rather than only in one.
- **Proof it is inert, observed not assumed:** `--self-test` **PASSED**, and a whole-tree run
  diffed **byte-identical on both stdout and stderr** against the pre-extraction capture
  (1,576 files, 0 violations).
- **Proof it can still fail:** an injected `ä` comment escape exits 1 naming file and line;
  reverted, exits 0.
- **Scope note:** this took the plan past its declared `files_modified` (3 files) to 5.
- **Commit:** `e5e720b8e`. **Window 171.**

### 2. [Reported, not engineered around] Task 1 AC4 is unsatisfiable as literally written

The criterion requires `grep -cE "^import .* from '[^n]"` to be **0** — every import specifier
beginning with `n`. Reusing the shared classifier requires
`import { commentSpans, inSpans } from './lib/comment-spans.mjs'`, which scores **1**. What the
criterion forbids is exactly what the task requires: the genuine wall shape.

**I checked whether it could be revised into compliance before registering it**, per the standing
correction. It can — and the revision is not a loosening. The criterion's intent is the
*bootstrapping* property (no build step, no transpiler, no external dependency), which a relative
import of a sibling `.mjs` under `scripts/` does not touch at all.

**Revised criterion, and flip-tested rather than merely asserted:** every import specifier is
either `node:` or `./` → **0** exceptions on the shipped file; injecting
`import { x } from 'some-external-package'` raises it to **1**, proving the revised criterion
*can* fail; reverting returns it to 0. The alternative revision — inline the classifier to satisfy
the literal grep — was rejected as the forbidden fourth copy. **Window 170.**

### 3. [Rule 2 applied to the guard's own design] Check 2 uses a named roster, not auto-detection

Auto-detecting every repeated basename is the more elegant design and would have **shipped the
guard three violations red on day one** — the D-N1(c) shape this milestone rejected. Measured:
`index.ts` differs across all three directories (it is the function body), and the two
`jwtSegment.test.ts` files differ by 65 diff lines. That second difference is *deliberate and
documented in the file itself*: `send-email/jwtSegment.test.ts` states it is "deliberately NOT
shared with `invite-candidate/jwtSegment.test.ts`" because a copy without its own test can rot,
and its fixture exercises `project_admin`, the role only that function honours.

So the roster is a named constant — `['envConfig.ts', 'jwtSegment.ts']` — with `index.ts` and the
test files excluded **in the file, with their reasons beside them**. Excusing a case requires
editing the guard, which is then reviewed as the decision it is.

## The flip tests — every check, both halves

The guard reports **0 on the current tree**. A green from a gate that examines nothing looks
identical, so each check was made to fail and then to pass again, with `git status --porcelain`
confirming the tree clean after every revert.

| Injection | Result | Reverted |
|---|---|---|
| `Deno.env.get('SMTP_HOST') \|\| 'inbucket'` at send-email/index.ts:216 | exit 1, names **`send-email/index.ts:216`** | exit 0, tree clean |
| Same read with the operator **wrapped onto the next line**, below a 14-line block comment | exit 1 at the **exact real line 230**; the **12 prose mentions inside that comment were NOT flagged** | exit 0, tree clean |
| One character changed in one `envConfig.ts` copy | exit 1, **names both paths** | exit 0, tree clean |
| URL import added to a tested module | exit 1 | exit 0, tree clean |
| `Deno.env.get('PORT')` added to a tested module | exit 1 at the real line | exit 0, tree clean |
| 6 violations across 3 files | ordered **by file path then by position** (`identity-callback:31, :62, invite-candidate:31, :62, send-email:31, :62`), byte-identical stdout+stderr across two runs | exit 0, tree clean |
| Chain link removed from `lint:check` | membership test **1 failed / 3 passed** | 4/4 |
| A further link appended **after** it | **still 4/4** — proves membership, not position | — |

The second row is the important one: it proves three separate properties in a single observation —
the whole-file scan catches a wrapped operator a line-scoped scan would miss, comment exclusion
preserves exact line numbering, and the guard does not trip on prose describing the very pattern
it forbids.

**Evidence logs** were captured under `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/tmp.6cSR1dlfLs/`
(`edge-injected.{out,err}`, `edge-wrapped.{out,err}`, `edge-reverted.out`, `det1/det2.{out,err}`,
`m1/m2.{out,err}`, `hygiene-{before,after,injected}.{out,err}`, `selftest-{before,after}.out`).
That directory is ephemeral; each run above reproduces from the injection described in its row.

## Gates

| Gate | Baseline | Now |
|---|---|---|
| `yarn lint:check` | 22/22 tasks | **exit 0**, 22/22, four guards green, new guard link 8 of 8 |
| `yarn test:unit` | 25/25 tasks | **25/25**; new spec collected **by the turbo run** (dev-seed 584 tests / 50 files), not only by direct invocation |
| comment-hygiene | 0 / 1,576 | **0 / 1,577** — one more file, confirming the new test is genuinely scanned |
| `yarn prettier --check` | — | clean on all five touched files |
| new guard | — | **0 violations / 17 files** |

The 1,576 → 1,577 step is worth naming: the hygiene guard intersects its glob with `git ls-files`,
so an **untracked** new file is invisible to it. The first run after writing the test still said
1,576. Staging it first is what made the check real rather than vacuous.

## E2E — declined, and proven on this diff rather than asserted

The prompt required proving the decline on my own diff, since two prior plans found their inherited
reasoning did not transfer. Measured:

- **Files changed: 5. Under `apps/`: 0.** No application source was touched.
- **`package.json`:** two lines, both verification-chain. No dependency added, `yarn.lock`
  untouched, and no `dev` / `build` / `preview` / `start` / `test:e2e` script changed.
- **Reachability:** nothing under `apps/`, `packages/` or `tests/` *imports* the guards or the
  classifier. Every `apps/` hit for those names is a **prose mention inside a docstring**. The one
  genuine reference is my own test, which reads the guard as **text** via `readFileSync` rather
  than importing it.

No served-application byte changes, so a Playwright run would exercise identical application code.
The decline rests on that measurement, not on "static guards have no runtime surface".

## Known Stubs

None. Every check is live, and each was observed failing on an injected violation.

## Broken-windows ledger

| ID | Kind | Subject |
|---|---|---|
| 170 | `deviation` | Task 1 AC4 unsatisfiable as written; revised into a criterion testing the protected property, and flip-tested |
| 171 | `deviation` | Classifier extraction beyond `files_modified`; three routes weighed on failure mode; inertness proven both ways |
| 172 | `todo` | Self-referential docstrings in the byte-identical copies — inherent to byte-identity, fixable only as a reword landing in all copies at once |

Window 172 is a finding this plan surfaced and deliberately did **not** act on:
`send-email/jwtSegment.ts:6` says its byte-identical copy lives in `send-email/` — itself — and
the three `envConfig.ts` copies name "identity-callback/ and send-email/", which is correct read
from `invite-candidate/` but names itself and omits `invite-candidate/` read from
`identity-callback/`. This is **inherent to byte-identity**, not carelessness: one sentence cannot
correctly name "the other directories" from three vantage points. A per-file correction would
immediately redden check 2, so the fix is a reword landing in every copy in one commit. Pre-existing
(155-02 / 155-04), outside this plan's scope.

## Threat Flags

None. Every surface is covered by the plan's `<threat_model>`; no network endpoint, auth path, file
access pattern or schema change. T-155-25 through T-155-30 are mitigated as specified, and
**T-155-29 — "a guard that runs but cannot fail" — is the one discharged by observation rather than
by construction**: every check was watched failing and then passing again. T-155-SC holds: nothing
installed, `yarn.lock` untouched, Node built-ins and one relative sibling import only.

## Requirements

`requirements-completed` is deliberately **empty**. `requirements.ready-ids` reports **0/1 ready**:
`REVIEW-EDGE-02` is declared by all six plans in this phase and **155-06 has no SUMMARY yet**, so
the ID must not read `Complete` while a declaring sibling is still outstanding. This plan discharges
the requirement's *guard* half — the part D-D2 said the seven fixes were worthless without.

## Next

Phase 155 Plan 06. Two things it inherits: the guard is **live on `lint:check` from now on**, so any
Edge Function edit it makes must keep all three checks green (in particular, editing one
`envConfig.ts` or `jwtSegment.ts` copy without the others now fails the build, by design); and
`REVIEW-EDGE-02` becomes markable once 06 files its SUMMARY.

## Self-Check: PASSED

- `scripts/assert-edge-env-defaults.mjs` — FOUND
- `scripts/lib/comment-spans.mjs` — FOUND
- `packages/dev-seed/tests/edgeEnvDefaultsGate.test.ts` — FOUND
- `e5e720b8e`, `7cda70ea7`, `c22a60848` — all three present in `git log`
- All Task 1 and Task 2 acceptance criteria re-run and passing, except Task 1 AC4, which is
  reported above as unsatisfiable-as-written, revised, and flip-tested rather than engineered around
- Plan-level verification re-run: guard exit 0; `lint:check` exit 0; `test:unit` 25/25;
  `format:check` clean on the new files
