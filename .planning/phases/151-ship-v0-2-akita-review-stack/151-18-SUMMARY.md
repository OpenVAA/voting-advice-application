---
phase: 151-ship-v0-2-akita-review-stack
plan: 18
subsystem: release-engineering
tags: [review-stack, byte-identity, commit-taxonomy, e2e-gate, cardinal-failure, publication, force-push, operator-decision]
status: complete

requires:
  - "151-17 (twelve slices cut; eleven PRs live; slice 11 unpushed and requiring a re-cut)"
  - "the operator's fix-and-recut decision and a narrow, named force-push authorisation for six branches"
provides:
  - "criterion 6 APPROVED by the operator — the stack reads as a followable narrative"
  - "criterion 7 proven by command — 0 changed files, equal tree hashes, reproducible without trusting the record"
  - "criterion 4 proven — taxonomy CONFORMING over C1..TIP; both runs recorded with the 4.4 proxy named"
  - "criterion 5 re-verified at the END of the review, not only at its start"
  - "criterion 1 — all 163 disposition cells filled, blank_cells 0, cells_pending 0"
  - "D-24's collective green signal: 135 passed / 0 / 0 / 0, after a real fix rather than a waiver"
  - "the complete stack published: 12 slices, 12 PRs (#863-#874), chain unbroken"
  - "PR #860 repurposed as the stack's umbrella entry point, head fast-forwarded"
  - "F-88 raised and routed"
affects:
  - "plan 151-19 (the D-25 skill; F-88's owner; F-07, F-81, F-86; two gsd-tools defects; PD-02's carve-out)"
  - "whoever merges the stack — skill-drift-check will be red on the first PR to main afterwards"

metrics:
  duration: "one session"
  completed: 2026-08-17

actuals:
  tokens: 27100   # chars/4 over the realized text diff
  tasks: 5
  commits: 11

tech-stack:
  added: []
  patterns:
    - "diagnose a red gate with the spec's OWN diagnostics before touching anything — the load-independent guard and the server/client split decided this one"
    - "re-test a root-cause diagnosis in isolation before accepting it, then keep the red record as the diagnosis rather than tidying it away"
    - "measure a force-push's real cost by hashing each slice's OWN patch (parent..self), not its cumulative tree"
    - "confirm a named authorisation list against your actual target list BEFORE acting, and dry-run every push"
    - "never global-find-and-replace a record that contains historical statements — line-scope the edit"

key-files:
  created:
    - .planning/phases/151-ship-v0-2-akita-review-stack/pr-bodies/11.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-18-SUMMARY.md
  modified:
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-BYTE-IDENTITY-PROOF.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-DISPOSITION.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-STACK-MANIFEST.md
    - tests/tests/specs/perf/performance-budget.spec.ts

key-decisions:
  - "The cardinal gate went red and was reported red rather than rationalised; the operator chose fix-and-recut over a waiver"
  - "The perf budget was NOT raised — the fix moves a dev-server artefact out of the measured window and leaves the threshold and its calibration intact"
  - "PD-01 was applied and found NO target: the real candidate (f91356687) was checked and disproved, so nothing was reverted"
  - "Slice 11's twelve cells are 4 MET / 2 DEFERRED / 6 N/A — not the all-N/A column its shape predicted"
  - "PR #860 repurposed, not closed; its head update is a fast-forward and was verified as one before pushing"
  - "Criterion 7 is proven AS OF a named commit and is RED AT REST — stated plainly, not implied"
  - "Re-scoping verify-identity.sh to ignore .planning/ was DECLINED — the third gate-massage declined in this phase"
  - "The LAST slice-11 re-cut is bound to 151-19; the six-branch force-push grant is SPENT"
---

# Phase 151 Plan 18: Close the Proofs, Green the Gate, Publish the Stack — Summary

**Criteria 4, 5 and 7 are proven by command with reproducible output; the cardinal E2E gate went RED,
was diagnosed to a test defect rather than an application regression, FIXED at the source rather than
waived, and is now green at 135/135; and the complete twelve-slice stack is published as PRs
#863–#874 with #860 repurposed as its entry point.**

## The gate went red, and that is the most useful thing this plan did

The 43 specs had never been run in this phase. They ran here, and **run 1 failed** — `1 failed, 134
passed`, exit 1, on `performance-budget.spec.ts:105`, `timeToMatches 7536` against a 5,000 ms budget.

All three prerequisites were met first, which is what made the red worth acting on rather than an
artefact of the setup: `db:reset` from migrations (exit 0), a port that was **unoccupied** before
exactly one fresh dev server started on it, and a preflight that emitted its **positive** assertion
line proving the served application came from this checkout via `/@fs`.

**The spec's own two diagnostics decided the diagnosis**, which is why the docblock puts them there:

| signal | calibrated | run 1 | verdict |
|---|---|---|---|
| `resultsFetches` — the *load-independent* regression guard | 11 invariant, budget ≤ 13 | **11** | fetch shape unchanged |
| `ttfb` — the server-side term | 30–173 ms warm, ~428 ms cold | **5,718 ms** — **76% of the window** | server-side |
| `timeToMatches` | 296–522 idle, 821–1,504 contended | 7,536 ms | over budget |

Then, because a diagnosis is a hypothesis until it is re-tested: **three isolation runs on a warm
server — 256 / 414 / 270 ms**, 12–20× under budget, `resultsFetches` **11 in all four runs**.

**PD-01 was applied and found no target.** The candidate was real and was checked rather than waved
past: `f91356687` (151-15) edits `results/[[electionTab]]/+layout.svelte` — the exact route under
measurement. A regression there would surface as more fetches or a client-side climb with flat TTFB.
Neither was observed. Reverting it would have reintroduced a genuine reactivity bug and moved this
metric not at all.

**I did not fix it unilaterally, and that was the right call.** The spec lives in slice 05, *published*
as PR #868, with five published slices chained above it — a fix meant force-pushing six branches, which
the phase forbids without a fresh operator decision. That is a decision about other people's open pull
requests, not an implementation detail.

## The fix — calibration, not weakening

The operator chose **fix-and-recut**. `0c24e87dd` adds an **unmeasured warm-up reload** before the
measured one, so Vite's one-time on-demand SSR transform of the route falls outside the window. It also
**resets the request counter between the two loads** — without which the count doubles and the N+1
guard silently inverts from a regression detector into a false positive.

**The budget was not raised.** `TIME_TO_MATCHES_BUDGET_MS` is still `5000`, `RESULTS_FETCH_BUDGET` still
`13`; no retry, no extended timeout, nothing marked flaky or skipped. The spec's own rule — *"never
raise a budget to make a red test green"* — is the one that was followed.

Verified on a genuinely cold server before landing, same 13-card set as the failure: **264 ms, ttfb
28 ms, resultsFetches 11.**

**Run 2: `135 passed`, 0 failed, 0 skipped, 0 did-not-run, exit 0, 10.7 min.** The previously failing
spec, in-suite under the same 6-worker contention: **540 ms** against the unchanged budget, ttfb 54 ms,
`resultsFetches` still **11** — which is the proof the warm-up did not blind the guard.

**Run 1's red record is kept in full.** It is the diagnosis that produced the fix; deleting it would
hide that this gate caught something real.

## The proofs

| criterion | result |
|---|---|
| **7 — byte-identity** | **0 changed files**, both trees **`47b31e092`** at the published cut. Two independent checks, different code paths, both reproducible by one-liner. |
| **4 — taxonomy** | **CONFORMING** over `C1..TIP`, exit 0, 0 shared paths. `origin/main..TIP` exit 1 / **628** shared paths — recorded beside it, all under `apps/`, **independently recomputed by a different method** (`uniq -d` over every commit's `--name-only`) which matched the gate exactly. That is D-11's design in path terms, not a defect. **4.4's proxy is named on every run** so no record can overclaim. |
| **5 — the history survives** | Backup worktree at **`fe91f3099`**, still detached, still clean, equal to the recorded `pre_sweep_tip` — re-verified at the **end** of the review, not only at its start. |
| **1 — structural completeness** | **163 / 163 cells filled**, `blank_cells: 0`, `cells_pending: 0`. |
| **partition** | Σ per-slice **4,511** = comparable total, **gap 0**; catch-all **`files=0`**. |
| **C-12** | `origin/main` **unmoved** at `ac30f132a`, still an ancestor, 0 commits ahead — so the identity claim needed no "as of the merge" qualifier. |

**The phase's one outstanding bookkeeping item is closed.** 151-09's unattributed 4257 → 4274
re-baseline is reconciled by set difference: **+17 entered, 0 left**, all seventeen named — every one a
`.planning/` artifact written by plans 151-06/07/08. The structural fact that makes it sound, which
151-09 could have stated instead of a bare arithmetic identity: every rise is a `.planning/` file, all
of them ride slice 11 by pathspec, and **no file has ever left the set** at any checkpoint measured.

## Slice 11's twelve cells — not the all-`N/A` column its shape predicted

D-20 exists for exactly this column, and measuring it changed the answer: **4 MET, 2 DEFERRED, 6 N/A.**

- **Item 3 — MET by a real gate.** `.prettierignore` excludes only `.planning/`, so `prettier --check .`
  genuinely reaches `.claude/`, `.agents/` and `CLAUDE.md` — **104 of 2,329 files** — and all pass.
  **Negative-controlled**: a deliberately malformed probe in a *tracked* dot-directory was reported,
  then removed with the worktree verified clean. (A first probe in `.turbo/` gave a false negative
  because Prettier 3.7.4 honours `.gitignore` — the check was wrong before the content was.)
- **Item 4 — DEFERRED**, 3 real `any` annotations in 2 frozen spike sources, none documented.
- **Item 5 — DEFERRED**, measured by blob-OID identity: 16 duplicate groups / 20 redundant files, of
  which **12 are determinism evidence where byte-identity IS the finding** and only **3 are genuine
  code duplication**.
- **Item 8 — N/A measured, not assumed**: the 2 `startEvent|analytics` matches were opened and are both
  comments, one of them a note that tracking was *deliberately omitted*. Zero call sites.
- **Items 9, 13, 14 — N/A on a scope measurement**: 46 `.svelte` files exist and **0 are compiled by
  anything** — no `tsconfig`, `vite`, `svelte` or `vitest` config references any path in the slice.

## F-88 — a trap laid for whoever merges next

**`skill-drift-check` exits 1 at the branch tip** (`Checked: 4  Drifted: 2  Skipped: 3` — `data` and
`database` drifted past 2026-08-10). The job arrives with slice 10, its script with slice 11, and
`main.yaml` fires only on PRs targeting `main` — where the workflow is still the older three-job
version. **So no PR in this stack shows it, and the first PR to `main` afterwards will be red on a job
nobody has seen fail.** Named in both PR #874's and PR #860's bodies. It was found only by *running the
script* rather than reading the workflow.

This is Pitfall 7's fourth appearance and the first time it was anything but refuted — the research
prediction (that it fails PR 01a) stays **false**, measured again here: PR 01a's actual failing jobs are
`e2e-tests`, `backend-validation` and `frontend-and-shared-module-validation`.

## Publication

**Twelve slices, twelve PRs, chain unbroken.** All 12 remote refs equal their local tips, 0 mismatches.

- **PR #874** (12/12) opened for slice 11, base `ship/v0.2-akita-10-root-config`, head `45a7438bf`.
- **Six branches force-pushed** — `05` through `10`. The authorised list was **confirmed against my
  actual target list before anything was pushed**, and **all seven pushes were dry-run first** (6 forced
  updates, 1 clean `[new branch]`). `--force-with-lease` throughout. Slices 01a–04, `main` and the
  backup worktree untouched.
- **The force-push's real cost, measured**: for **five of the six**, each slice's **own patch**
  (`parent..self`) hashes **identically** before and after — only the parent pointer moved, so
  reviewer-visible content is unchanged. Slice 05 changed by exactly the fix. PR #873's 5 inline bot
  comments are orphaned, as the operator anticipated.
- **PR #860 repurposed, not closed** — retitled and re-bodied as the umbrella entry point linking all
  twelve, head fast-forwarded `97f55cb41..0784d5a7d`, **verified a strict ancestor with 0 commits
  behind** before pushing.
- **Delta secret rescan** over the 4 files entering since the scanned cut: **0 live findings**. The one
  raw PEM-pattern hit was opened and read — pre-existing F-14 prose *describing* a detector defect, no
  key material, 0 base64 key blocks.
- **Ruleset `8477541` read back as `active`**, equal to the recorded `untouched-active`. It was never
  suspended, so there was nothing to restore.

## Deviations from Plan

**1. [Rule 1] Task 1's acceptance criterion was unsatisfiable in Task 1.** It requires
`cells_filled == cells_expected`, but items 11 and 12 are dispositioned on the D-24 run, which is
Task 2. Slice 11's twelve cells were filled in Task 1 (147 → 159) and the four phase-level cells in
Task 2 (159 → 163); the completeness check ran once both were done.

**2. [Rule 1] Task 3's scripted options all presupposed a green suite.** With the gate red, Task 4's
precondition was unmet, so nothing was auto-approved and the real fork was put to the operator instead
of the scripted one.

**3. [Rule 1] I corrupted the manifest with a global find-and-replace, and reverted it.** Updating the
slice table's SHAs with a whole-file replace rewrote **eight historical statements** in the per-plan
sections — sentences like *"`PARENT`, unchanged and pushed by this plan: `545cc26c8`"*, which were true
records of what plans 151-13 … 151-17 did. That is falsifying the record, not updating it. Reverted with
`git checkout --` on the single file and redone line-scoped. **Every per-plan section still carries the
SHAs that plan actually cut.**

**4. [Rule 1] Two of my own verification checks were wrong before the content was.** The force-push
impact check compared *cumulative trees* and reported "1 changed file" for slices 06–10 — that file was
the inherited perf spec; the own-patch comparison is the right one. And a `2>&1 >/dev/null` stderr
measurement was a **zsh MULTIOS artefact** reporting 734 bytes of stderr that did not exist; re-measured
under bash it is 0. Both recorded, because this phase's standing lesson is to establish *which* of check
and content is at fault before believing either.

**5. [Rule 1] A hypothesis about `((X++))` under `set -e` was refuted by testing it.** I suspected a
latent abort in `audit-skill-drift.sh`; a direct test showed the status is 1 but `set -e` does not fire.
Recorded as refuted rather than published as a finding.

**6. PR #874's first body carried pre-final counts.** Written against a 2,328-file cut; the published
head is 2,329 because the body file itself entered the slice. Corrected on GitHub and in-repo, with the
reconciliation stated so a reader meeting two numbers is not left guessing.

## Known Stubs

None.

## Open items handed to 151-19

- **F-88** — `skill-drift-check` red post-merge. Needs an owner; fixing it means updating
  `.claude/skills/{data,database}/SKILL.md` for schema changes shipping in slices 02–03.
- **F-07** — the NBSP in `.agents/code-review-checklist.md:8` makes the `any` item an untickable
  non-checkbox and defeats every `^- \[ \] ` census.
- **F-81** — `.bg-shell/manifest.json`, a literal `[]` referenced by nothing and not gitignored.
- **F-86** — root `package.json` declares `"engine"` (singular), so its Node/yarn floor is inert.
- **Two `gsd-tools` defects** — `state.add-decision` writes `[Phase ?]` (256 pre-existing entries);
  `state.update-progress` finds no Progress field in `STATE.md`.
- **PD-02's carve-out** for F-21's discharging migration, which **F-29** then rides.
- **The structural staleness note**: every `.planning/` file rides slice 11, so this summary itself is
  outside the published cut `45a7438bf`. Stated in PR #874's body rather than left to be discovered.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.
T-151-18-01 (a repudiable green signal) is discharged by the three prerequisites and by counting a
did-not-run as a failure; T-151-18-02 (a policy left suspended) by reading the ruleset back as `active`;
T-151-18-03 (loss of the reiterative history) by re-verifying the backup at the end; T-151-18-04
(publishing the planning slice) by the scan plus the delta rescan, and by deferring publication until
after both the identity proof and the suite gate passed; T-151-18-05 (an agent reinterpreting the #860
decision) by executing the recorded `repurpose` verbatim and verifying the fast-forward; T-151-18-06
(a stale comparison target) by re-resolving `origin/main`.

## Verification

- [x] Identity **BYTE-IDENTICAL** — 0 changed files, both trees `47b31e092`, catch-all `files=0`
- [x] Taxonomy **CONFORMING** over `C1..TIP`; whole-stack run recorded and explained beside it
- [x] Backup worktree intact, detached, at `fe91f3099`; hooks-path override `/dev/null` intact
- [x] Σ **4,511** = comparable total, gap 0; 151-09's re-baseline reconciled file by file
- [x] Disposition **163/163**, 0 blank, 0 pending
- [x] **E2E 135 passed / 0 failed / 0 skipped / 0 did-not-run**, exit 0 — after a fix, not a waiver
- [x] 12 remote refs == 12 local tips; PRs #863–#874 open and chained; PR #874 base correct
- [x] Force-push confined to the six authorised branches; all pushes dry-run first
- [x] PR #860 repurposed (not closed) via fast-forward; ruleset `active`; no `git clean`/`stash`;
      `main` unmoved; worktree clean throughout

## Task 5 — criterion 6 APPROVED, and criterion 7's honest standing

**The operator read the stack bottom-up and approved it.** Each pull request is reviewable without
changing viewpoint partway, and no pull request shows work a later one undoes. **Criterion 6 closes.**

**And the operator reproduced the identity check rather than trusting this record — which is exactly
what criterion 7 exists for — and it came back RED.** Reproduced here independently before recording:

```
changed files: 4        target tree 811c1eb2d   vs   stack tree 47b31e092   → exit 1
  .planning/STATE.md · 151-18-SUMMARY.md · 151-STACK-MANIFEST.md · pr-bodies/11.md
```

All four are `.planning/` artifacts **this plan wrote after cutting slice 11**. No application code
differs. The correct claim, now stated plainly in the manifest instead of left implied:

> **Criterion 7 is proven AS OF commit `45a7438bf`** — 0 changed files, both trees `47b31e092` — and is
> **RED at rest**, because slice 11's pathspec contains `.planning/`, so the record of the work lives
> inside the thing it describes.

Structural and recursive, not an oversight: every plan in this phase invalidated it the moment it
wrote a planning file. I flagged the mechanism twice while it was happening; what I had not done was
say **the gate is red right now**, which is the part a reader needs.

### The third declined gate-massage — the pattern is the lesson

Re-scoping `verify-identity.sh` to ignore `.planning/` was available and was **declined**. It would
have made the board green and the guarantee weaker.

| # | Available | Decision |
|---|---|---|
| 1 | Raise the perf budget to green a red test | **Declined** — fixed the measurement; threshold untouched |
| 2 | Waive the red E2E gate and ship | **Declined** — fixed the defect, re-cut six branches |
| 3 | Re-scope the identity gate past `.planning/` | **Declined** — recorded the honest standing |

**When a gate is red, the question is whether the gate or the content is wrong — and "make the gate
stop asking" answers neither.** That belongs in 151-19's skill write-up more than any individual
decision here does.

### Binding handoff — the LAST re-cut is 151-19's

Set in `151-STACK-MANIFEST.md` frontmatter, the same mechanism 151-17 used to hand this plan its own
obligation, so it cannot be missed:

| key | value |
|---|---|
| `slice_11_must_be_recut_before_push` | **`true`** — still |
| `slice_11_final_recut_owner` | **`151-19`**, after its final planning write |
| `slice_11_final_recut_requires` | re-cut · delta secret-rescan · re-prove identity |
| `force_push_authorisation_151_19` | **`["ship/v0.2-akita-11-planning"]` — one branch, nothing else** |
| `force_push_authorisation_151_18_spent` | **`true`** |

**The six-branch authorisation from this plan's checkpoint is spent and does not carry forward.** If
151-19's re-cut appears to need any other branch, that is a signal something is wrong — stop and ask.

### One error worth carrying into the skill

Of the three I self-reported, the **global find-and-replace that rewrote eight historical statements**
about what plans 151-13 … 151-17 cut is the one that generalises: **a mechanical rewrite over a record
that contains history will rewrite the history too.** It is the same species as the codemod damage
F-42 tracked, applied to prose about the past rather than to code — and it was caught only because the
replace reported 8 occurrences where the table has 1.

## Self-Check: PASSED

All six key files exist and are non-empty (`151-18-SUMMARY.md` 263 lines, `pr-bodies/11.md` 178,
`151-BYTE-IDENTITY-PROOF.md` 798, `151-DISPOSITION.md` 3,264, `151-STACK-MANIFEST.md` 1,594, the
patched spec 220). All eight plan commits resolve with `git cat-file -e`: `861532f95`, `798c952f6`,
`0c24e87dd`, `f31bd43f8`, `062a7d692`, `0784d5a7d`, `b585ca2d9`, `fe8f8b342`. **12 remote `ship/*`
refs**, each equal to its local tip; PR #874's head `45a7438bf` resolves remotely.

*(A first ref-count check printed `0` — a quoting artefact in the glob, not a missing ref. Re-run
correctly it reports 12. Recorded per this phase's rule that a failing check is investigated rather
than believed.)*
