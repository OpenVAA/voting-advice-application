---
phase: 151-ship-v0-2-akita-review-stack
plan: 17
subsystem: release-engineering
tags: [review-stack, security, secret-scan, partition, publication, operator-decision]
status: complete

requires:
  - "151-16 (slices 09 and 10 cut; slice 10 unpushed; criterion 4.2 closed)"
  - "the operator's three decisions, taken at this plan's checkpoint"
provides:
  - "slice 11 cut — the twelve-slice stack is complete and reconstructs the branch tip byte for byte"
  - "criterion 4.1 satisfied by 384e7b40a; every cardinality clause of criterion 4 now closed"
  - "151-SECRET-SCAN.md — the phase's one security control, run, remediated and rescanned"
  - "PR #873 open — eleven of twelve PRs live, chain unbroken"
  - "F-21 decided (option a); PD-02's deadlock named; F-29 given an unblocking condition"
  - "slice 11's twelve checklist cells routed to 151-18"
affects:
  - "plan 151-18 (MUST re-cut slice 11 and rescan the delta before opening PR 12; owns slice 11's 12 cells + the 4 phase-level items; F-07, F-81, F-86)"
  - "plan 151-19 (three transferable scan lessons for the skill; PD-02 carve-out language)"

metrics:
  duration: "one session"
  completed: 2026-08-17

actuals:
  tokens: 24538   # chars/4 over the realized text diff (binaries excluded)
  tasks: 4
  commits: 6

tech-stack:
  added: []
  patterns:
    - "scan the publication surface (git archive of the pathspec), not the slice diff — a file in no diff still ships"
    - "assert scan coverage by set containment, not by a line-count proxy"
    - "classify a credential by recomputing its signature against the published reference secret, not by appearance"
    - "open archives before declaring a redaction complete — a working-tree grep is not a census"
    - "expect a scan report that lands inside its own scan scope to trip its own rules on the next pass"

key-files:
  created:
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-SECRET-SCAN.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/pr-bodies/10.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-17-SUMMARY.md
  modified:
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-STACK-MANIFEST.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-DISPOSITION.md
    - .planning/milestones/v1.0-phases/02-candidate-app-coverage/02-03-PLAN.md
    - .planning/milestones/v2.10-phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-RESEARCH.md
    - .planning/milestones/v2.10-phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/rca-traces/registration-rca.spec.ts
    - .planning/milestones/v2.10-phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/rca-traces/trace-run-1.zip
    - .planning/milestones/v2.10-phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/rca-traces/trace-run-2.zip
    - .planning/milestones/v2.10-phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/84-RCA-FINDINGS.md

key-decisions:
  - "The operator overruled this plan's `approve` recommendation with `remove-and-rescan` scoped to S-07, on better reasoning: the record had already made a re-cut mandatory, so the redaction was nearly free against an unbounded downside"
  - "S-08 deliberately NOT redacted — already public in PR #868 and PR #872, so redacting it would desynchronise the record from what ships"
  - "F-21 option (a): implement the two parameters rather than drop them, scheduled after this phase ships — the only route that greens the gate without breaking the live email flow"
  - "PD-02 needs an explicit carve-out: as written it blocks the very migration that would green its gate"
  - "Slice 11's twelve checklist cells routed to 151-18; D-20 still requires a MEASURED reason per N/A"
  - "The plan's 'slice 11 file count equals 2321 exactly' criterion is unsatisfiable by construction — the identity is the assertion, the literal is a snapshot"
---

# Phase 151 Plan 17: Cut, Scan and Publish the Last Slice Summary

**The twelve-slice stack is complete and reconstructs the branch tip byte for byte; the one pull
request nobody will read has been read exhaustively by two independent methods, found to contain a
credential-shaped literal in 32 places — 28 of them hidden inside archives — and remediated on the
operator's decision; and PR #873 takes the stack to eleven of twelve published.**

## What shipped

| | |
|---|---|
| slice 11 `ship/v0.2-akita-11-planning` | `384e7b40a` — **2,325 files, +880,314 / −104**, one commit, **unpushed** |
| criterion 4.1 | **satisfied**, evidence `384e7b40a`. With 4.2 (`2865b05b3`) and 4.3 (`545cc26c8`), **every cardinality clause of criterion 4 is now closed** |
| final catch-all | **`files=0`**, `EMPTY:` |
| full-stack identity | **BYTE-IDENTICAL** — 0 changed files, both trees `d94708d0d` |
| partition arithmetic | 4,508 = comparable total. **Gap: 0** |
| slice 10 published | `3aa503741` → [**#873**](https://github.com/OpenVAA/voting-advice-application/pull/873), base `ship/v0.2-akita-09-docs` |
| secret scan | **15 findings: 0 live, 1 remediated, 8 accepted, 6 false positive.** Verdict `pass-after-remediation` |

## The secret scan — the plan's own gate, and the three things that made it work

**Scan the publication surface, not the diff.** The corpus was a `git archive` of slice 11's
pathspec — **2,325 files against the diff's 2,324**. The extra one is `.claude/settings.json`, which
ships in slice 11's tree but appears in **no slice's diff** because it is byte-identical at
`origin/main`. That is precisely this phase's "reviewed by nobody" class, and scanning the diff
would have missed it. Coverage was then asserted by **set containment** rather than by the plan's
line-count proxy — the scanned set is a strict superset, and the corpus/diff line arithmetic closes
**exactly**, with the 8,324 newline bytes inside two binary `.zip` files, 231 unchanged lines in the
two modified files, and 51 files whose last line lacks a trailing newline all attributed.

**One scanner is not a scan.** TruffleHog 3.95.2 (all detectors) reported 13 findings covering
**2** distinct JWTs. An independent 24-rule sweep found **4**, adding the Supabase demo `anon` and
`service_role` tokens that no detector flagged, plus session cookies whose `refresh_token` is
base64-inside-a-cookie rather than a recognised token shape. Both extra tokens turned out to be
**published public constants — proven by recomputing their HMAC against Supabase's documented
local-development secret**, not judged by appearance. A single-scanner run would have published a
`service_role`-shaped token without ever classifying it.

**Zero cloud hosts, zero key material.** No `*.supabase.co/.in/.net` anywhere in 2,325 files; **zero**
JWK private components (`d`/`p`/`q`/…) — checked specifically because this repository documents
generating bank-authentication signing keys; 15 of 24 rules matched nothing.

## The operator overruled this plan, and was right

The plan recommended `approve`. **The operator selected `remove-and-rescan` scoped to S-07**, on an
argument this plan should have made itself: the scan record had *already* set
`slice_11_must_be_recut_before_push: true`, so a re-cut and delta rescan were mandatory regardless —
which made the redaction very nearly free, weighed against a downside that no in-repo measurement
can bound. **The cost argument for `approve` rested on a cost that was already being paid.**

**And the remediation immediately vindicated the decision in a way the analysis had not.** The
credential existed in **32 places, not the 4 a working-tree grep reports** — 28 were inside the two
Playwright trace archives, across `0-trace.trace`, `test.trace`, a `src@…txt` resource and the signup
POST body. *A grep over the working tree is not a census when the content includes archives.* Both
archives were rebuilt member-by-member with an **equal-length** token so the trace JSON and any
recorded offsets stay valid; `testzip()` OK, member counts unchanged (69, 74), **0 occurrences remain
anywhere**.

`S-08` was deliberately **not** redacted: it is already public in `testCredentials.ts` (PR #868) and
printed in the developers' guide (PR #872), so redacting it would be theatre that desynchronises the
record from what ships.

**The rescan tripped five rules that had matched nothing before** — `pgp-key-block` and
`ssh-private` went 0 → 1, `private-key-block` 2 → 4. **Every one is `151-SECRET-SCAN.md` quoting its
own ruleset.** Checked file by file, not inferred: 0 of the new hits are in any other file. Recorded
because a later plan re-running this sweep would otherwise see two brand-new key-block classes appear
in the planning slice and reasonably conclude something had leaked.

## What the empty catch-all proves — and what it does not

**It proves nothing about the partition.** The catch-all has no pathspec, so the union of slices
reproduces the target whether or not the split was correct; research measured that laundering live —
472 files absorbed, tree hash still matching. **The real evidence is the per-slice prediction checks
in 151-09 … 151-16**, each run while a wrong answer was still catchable, and the meaningful equality
closed one plan *earlier*: 151-16's post-slice-10 catch-all was 2,321 files with **zero** paths
outside slice 11's pathspec. The manifest now says this in prose so no later reader mistakes the
empty catch-all for evidence of a correct split.

## Deviations from Plan

### Wrong as written — the fourteenth and fifteenth in this phase

**1. [Rule 1] "Slice 11's file count equals 2321 exactly" is unsatisfiable by construction.** It
measured **2324** at the first cut. Every `.planning/` file any plan writes rides slice 11, and
151-16 committed three of its own artifacts *after* taking that measurement. This is the trap the
manifest already warned against — *"do not hard-code the number; the identity is the assertion, the
literal is a snapshot."* **The identity was checked instead** and holds exactly: at the same TARGET,
slice 11's pathspec claims 2,324 and the unrestricted remainder is 2,324, with 0 foreign paths. The
+3 rise is attributed by set difference, every file named, zero leaving; the +883 insertion delta
closes to the line.

**2. [Rule 1] The plan repeats research's Pitfall 7, which 151-16 had already refuted.** The plan's
"Corrections applied" states that PR 01a fails `skill-drift-check`. **Measured at run
`32017478048`: PR #863 reports exactly three failing jobs and `skill-drift-check` is not among
them**, because the workflow at 01a's head is `main`'s three-job version. The body states the
measured shape instead: four jobs arrive with slice 10, the script they need arrives with slice 11,
and that forward reference never fires because every stacked PR has a sibling base.

**3. [Rule 3] The plan's `lines_scanned` within-2% criterion fails in the safe direction.** The
archive-expanded figure is +3.63%. It is a **superset**, which is the wrong thing to penalise, so
set containment was asserted instead and both figures recorded.

**4. [Rule 3] TruffleHog's git mode cannot run here.** This checkout is a linked worktree, so `.git`
is a file and the scanner aborts with `failed to read index file: … not a directory`. Filesystem
mode over a `git archive` extraction was used — a **stronger** scope, and the reason the
diff-invisible file was caught.

**5. [Rule 2] Two unredacted literals reached this plan's own scan record and were removed** — one
in the S-07 residual-risk paragraph, one in the § 8 remediation heading. A scan report that leaks
what it found is the same defect one layer out (threat T-151-17-02), and it very nearly happened
here. Both were caught by a redaction check run against the record itself.

**6. [Rule 2] `gh pr list --head ship/v0.2-akita-11-planning` returned `HTTP 503` on four attempts.**
The assertion was met by two independent and stronger routes: the unfiltered open-PR listing
enumerates exactly eleven `ship/*` PRs forming an unbroken chain with none for slice 11, and
`git ls-remote` returns 11 refs with slice 11 absent.

### Corrections to the record

**7. The disposition's item-16 row carried a stale `420 shared paths`.** Measured over the complete
stack it is **628** (the gate's rename-aware extraction) and **682** under this record's own
`--no-renames` convention. The pair is reconciled rather than left to be distrusted: the gate uses
`git log --name-only` at git's default rename settings, so rename detection *inside the later slices*
hides 56 source paths. **Every shared path involves the rename base and none involves any pair of
later slices** — which follows decisively from the `C1..TIP` run's zero, not from inspection.

**8. 151-16 predicted slice 11 was "where the rename-detection gap will reappear". It did not.**
`-M` and `--no-renames` return identical triples, because slice 11 has **zero deletions** and rename
detection needs a delete to pair an add with. The prediction was made from size; the mechanism
depends on deletions.

**9. F-21's blast radius was misdescribed.** Warnings 1–2 are dead **local variables** with zero API
impact, not entangled with the signature question. pgTAP calls the RPC with **one** argument and
survives a drop; **the real breakage is `send-email/index.ts:134`**, which passes all three by name
under a comment noting PostgREST resolves overloads by named argument. And the record never
surfaced **option (a) — implement the parameters** — which greens the gate with no signature, grant,
type or caller-shape change. The operator took it.

## Known Stubs

None. Every deferral is a recorded finding with an owner.

## Open items handed to 151-18

- **Slice 11 MUST be re-cut and the delta rescanned before PR 12 opens.** This plan's own commits
  after `384e7b40a` are outside both the slice and its scan. `slice_11_must_be_recut_before_push`
  stays `true`. The branch is unpushed, so no force-push is involved.
- **Slice 11's twelve checklist cells** (now `P→18`) — D-20 requires a **measured** reason per `N/A`.
- **The four phase-level items** (1, 11, 12, 16), the **D-24 E2E run**, and **PR #860's repurpose**.
- **F-07, F-81, F-86** remain unowned; carried for routing.
- **PD-02's carve-out** for F-21's discharging migration, which **F-29** then rides.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.
**T-151-17-01** (credential in a planning artifact) is discharged by the scan and its remediation;
**T-151-17-02** (full value recorded in the report) by the redaction check, which caught two live
misses; **T-151-17-03** (empty catch-all read as proof) by the manifest's prose; **T-151-17-05**
(planning slice published before the identity proof) by PR 12 remaining closed.

## Verification

- [x] Slice 11 is exactly **1** commit — criterion 4.1, evidence `384e7b40a`
- [x] Final catch-all `files=0`; full-stack identity BYTE-IDENTICAL, tree `d94708d0d`
- [x] Partition arithmetic 4,508 = comparable total, gap 0
- [x] Taxonomy over `C1..TIP` **CONFORMING** (0 shared paths), whole-stack run recorded beside it
- [x] Secret scan: 2,325 files ⊇ 2,324 in the diff; 0 live findings; scan run **before** any push
- [x] S-07 redacted in all 32 places; 0 occurrences remain, plain or archived; rescan clean
- [x] No excerpt in the scan record carries a full candidate value
- [x] PR **#873** open, base `ship/v0.2-akita-09-docs`, headRefOid == local; GitHub's counts match
      the measured triple exactly (129 / +8,662 / −27,267)
- [x] PR 12 **not** opened; slice 11 unpushed; 11 remote `ship/*` refs
- [x] `origin/main` unmoved at `ac30f132a`; **#860 untouched**; no force-push, no `git clean`,
      no `git stash`; worktree clean throughout

## Self-Check: PASSED

`151-SECRET-SCAN.md` (389 lines), `pr-bodies/10.md` (263 lines) and this summary exist and are
non-empty. All six plan commits (`39a5af57c`, `b745bbee4`, `96a16d7fe`, `09b287b3a`, `5963632fd`,
and this one) plus both slice-11 cuts (`6f04fa023`, `384e7b40a`) resolve with `git cat-file -e`.
