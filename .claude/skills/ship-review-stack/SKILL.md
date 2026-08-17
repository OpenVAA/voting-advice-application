---
name: ship-review-stack
description: 'Procedure for taking a large, reiteratively-developed branch to a reviewable stack of stacked pull requests off the default branch, without changing a byte of its final state. Covers index-level tree surgery to build slices, pure-rename commit reconstruction, path-partition dry runs with a catch-all tripwire, comment-hygiene codemod plus residue pass, per-slice checklist disposition, and the byte-identity, commit-taxonomy and collective-suite proofs. Activate when restructuring commit history for review, splitting a long-lived branch into stacked PRs, proving a reconstructed history is byte-identical to its source, or planning a large ship/release sweep -- not for ordinary feature branches, which need none of this.'
targets:
  - .agents
  - .claude/scripts
  - .planning/phases/151-ship-v0-2-akita-review-stack/scripts
---

<context>
## Project: voting-advice-application-gsd

This procedure was written **after** running it, from v2.15 Phase 151, which took the v0.2 "Akita"
body of work -- roughly 2,400 commits of reiterative development on `feat-gsd-roadmap`, 4,511 changed
files against `origin/main` -- to twelve stacked pull requests (#863-#874, entry point #860) whose top
commit reconstructs the branch's tree **byte for byte**.

It is deliberately not the brief the phase started from. The brief did not know that a path partition
reproduces the target exactly, that the catch-all launders partition bugs rather than catching them,
that the rebase conflict resolves itself, or that the hygiene surface was 1.75x the estimate. Those
are the parts worth carrying, and they only existed at the end.

**When this applies.** A branch too large to review as one pull request, whose history is a record of
how the work was discovered rather than a case for its correctness, and where the reviewer needs to
read the _outcome_ rather than the search. If the branch is small enough that a reviewer can follow
its real history, use its real history -- everything below is overhead.

**What it costs.** Phase 151 took nineteen plans over seventeen waves. The mechanism itself runs in
seconds; the cost is in the sweep, the disposition record, and the proofs.

Sources, all under `.planning/phases/151-ship-v0-2-akita-review-stack/`:

- `151-CONTEXT.md` -- the 25 locked decisions (D-01 ... D-25) this procedure generalises
- `151-RESEARCH.md` -- the seven pitfalls, four of which fired live
- `151-STACK-MANIFEST.md` -- the slice table, the dry-run evidence, the per-plan cut record, and the
  declined-gate-massage table
- `151-BYTE-IDENTITY-PROOF.md` -- criterion 7, both checks, verbatim
- `151-DISPOSITION.md` -- 163 cells of checklist disposition, and the 88 findings
- `151-HYGIENE-REPORT.md` -- the comment-hygiene before/after, and the deliberately-red gate
- `151-SECRET-SCAN.md` -- the scan of the one pull request nobody will read
- `151-MEASUREMENTS.md`, `151-BASELINE.md` -- gate reach re-measured rather than assumed
- `151-01-SUMMARY.md` ... `151-19-SUMMARY.md` -- what each plan actually hit

`sources/` carries the seven scripts, byte-identical to the phase originals. They are the mechanism;
without them this file is prose about a procedure rather than the procedure.
</context>

## The mechanism, in one paragraph

**Index-level tree surgery, not rebasing.** Each slice is built by taking `git diff --raw` between the
current stack tip and the merge target, restricted to a pathspec, feeding it to
`git update-index --index-info` against a **scratch index**, then `git write-tree | git commit-tree`.
Two plumbing primitives, no working tree touched, no conflicts possible, the whole twelve-slice stack
in seconds. Because every slice pulls content **from the target**, the final tip reconstructs the
target's tree by construction -- byte-identity becomes a structural property, not an assertion checked
afterwards. `sources/build-slice.sh` is 40 lines of that; the other 90 lines of the file are the
comment explaining which four details are load-bearing.

## The procedure, in the order it actually ran

**1. Prove the mechanism end to end on throwaway refs, before anything real exists.**
A tracer that builds the whole stack -- rename commit, every slice, catch-all, identity check -- into
unreferenced commits with a scratch `GIT_INDEX_FILE`. This is where four of the seven known pitfalls
fired, at zero cost. Do not start the sweep until the tracer is green, and re-run the tracer's own
verification before expanding: a failing tracer means the foundation is wrong, and pouring nine more
slices onto it only buries the evidence.

**2. Pin the backup.** A sibling worktree at the pre-sweep tip, detached, never written to. The
reiterative history must survive **for the duration of the review**, which is longer than the phase.
Re-verify it at the **end** as well as at the start -- an intact-at-the-start backup proves nothing
about the state you are handing over.

**3. Capture baselines, and re-measure every gate's reach.**
Build, unit, lint, format, plus the phase-local scripts. Record exact numbers (`1522 passed / 149
files`; `0 errors / 20 warnings`; format red on exactly _these two_ files), because "unchanged" is
only checkable against a number. Run under `TURBO_FORCE=1` -- a bare re-run can be a cache replay
rather than a measurement.
Then, separately and more importantly: **measure what each cited gate actually reaches.** The a11y
scan covered 7 route entries resolving to 5 URLs, leaving 31 of 36 route surfaces unscanned. Cite the
gate _and name its complement in the same cell_, always.

**4. Define the partition, and dry-run it until the catch-all is empty.**
One line per slice: id, branch, subject, pathspec. Machine-readable, in one file, read by every later
step -- **no step hard-codes a pathspec**. Then dry-run the whole build and assert two things:

- **Sum of per-slice file counts == the independently-measured total** (no path counted twice)
- **The catch-all slice, whose pathspec is `.`, produces `files=0`** (no path counted zero times)

Together those two make the partition exact. Get an explicit human decision on the split before
cutting, against one question: _does each slice's title describe every file in it, without an "and
also"?_

**5. Materialise the merge target as a real commit.**
If the stack must target a moved default branch, the identity target is "the branch **merged with**
the default branch", not the branch tip. Make that a commit (`git commit-tree` with two parents) and
point every later step at it, so the claim is about an object rather than about a description. The
merge conflict, if any, is usually resolvable once, by hand, into its own commit and its own row in
the record.

**6. Run the mechanical hygiene pass, then the judgement pass.**
Split the authority: a codemod owns what is deterministic (strip artifact paths, section anchors,
plan numbers, decision IDs, milestone tags, inside comment spans only), and agents own the residue
file by file against a written rule. In Phase 151, 126 matched lines were **not comment-shaped** --
including a runtime `console.warn` a user sees, Playwright test titles, and an ESLint rule `message:`.
A regex-only pass over those would have edited program behaviour.

**7. Sweep and cut bottom-up, one slice at a time, and lag the pull requests by one slice.**
Fix on the **source branch first**, then cut the slice from the fixed tip. Open a slice's PR only once
the slice _above_ it has also been swept. A cross-slice finding is then a script invocation instead of
a force-push to a pull request under review -- which is exactly what happened once, and cost nothing.

**8. Scan the unreviewable slice before publishing it.**
The planning/agent-config slice is approvable without reading, which is the point of putting it at the
top and out of every other diff -- and is precisely why it needs a secret scan the others do not.

**9. Prove it: identity, taxonomy, and the collective suite.**
`verify-identity.sh` (two independent checks), `verify-commit-taxonomy.sh` over the stack's own range,
and one full end-to-end suite run against the post-sweep branch tip. Per-PR CI is **not** the gate --
intermediate stack states are expected to be broken, and saying so in the PR body is part of the job.

**10. Publish, then codify.**
Push bottom-up, verify each remote ref equals its local tip, and check each PR's base is the slice
below it. Write the procedure last, from what happened.

**11. Re-cut the slice that contains the record -- last.**
See "The recursion", below. This is the step that is easiest to get wrong by doing it early.

## The recursion: a slice containing the record cannot settle while you are still writing

If the planning directory ships as a slice, then **every artifact written about the work invalidates
the identity of the slice that contains it.** The proof is a statement about a commit, not a standing
property of the working tree, and the gate is red at rest between the cut and the next write.

Say this plainly in the record rather than letting a reader discover it:

> Identity is proven **as of commit X**, where the check exits 0 with 0 changed files and equal tree
> hashes. It is **red at rest** and will be red again after any later write to that slice's pathspec.

The fixpoint is reached by **moving the record of the last cut out of the cut**: perform the final
re-cut after the last artifact is committed, and record its resulting SHA somewhere the slice does not
contain -- the pull request body, the phase-close report -- rather than in a file the slice owns.
Otherwise the recording re-breaks what it records, forever.

The wrong fix, which will be offered: re-scope the identity check to ignore that directory. That makes
the board green and the guarantee weaker, and removes the only check that would catch a real drift
there.

## Lessons, each with the failure it prevents

Nine that generalise beyond this repository, then the ones this environment taught.

**1. The catch-all is a laundering surface, not a safety net.**
It makes the tree hash match whether or not the partition is correct. Research measured it live: two
broken slices, **472 files silently absorbed**, tree hash still matching, identity check green. The
per-slice file-count prediction is the real evidence. _Prevents:_ reading a green identity banner as
"the slices are right" when it only ever meant "the union is right".

**2. Derive a pure-rename commit by rule, never by rename detection.**
Re-path the base tree with an explicit mapping and re-use the identical blob OIDs. Similarity matching
at 1,316 files produces confident nonsense pairs. Verify at `diff.renameLimit=1`, the most hostile
setting -- exact renames survive it because they are found by blob-OID hash, so a single-row `R`
taxonomy there is the strongest available statement that nothing but paths moved. _Prevents:_ a
"rename-only" first PR that silently pairs unrelated files.

**3. Parse every git stream NUL-safely.**
Use `-z` and split on NUL, never on whitespace. One tracked path in this repository contained a space,
and whitespace splitting corrupts the index-info stream silently. The path was later renamed as a
review finding, and the NUL split stays mandatory anyway: `git diff` output is not a whitespace-
delimited format. _Prevents:_ a corrupted file set that reports success.

**4. Fix on the source branch first, then cut from the fixed tip.**
The alternative -- fixing inside the stack and redefining the baseline -- makes the identity claim
circular. One-way, and worth its cost. _Prevents:_ proving your reconstruction matches a target you
edited to match your reconstruction.

**5. Sweep bottom-up and lag PR opening by one slice.**
A late cross-slice fix then only re-cuts slices that are cut but unopened. _Prevents:_ force-pushing
a pull request that a human is part-way through reviewing.

**6. Never launder a blind spot as met.**
Measure a cited gate's reach against the tree being swept, and name its complement in the same cell.
Anything outside the reachable set is recorded as _not swept, with the reason_. _Prevents:_ a
disposition record that says "met -- the a11y gate is green" about 31 routes the gate never visits.

**7. Write the escape hatch before you need it.**
The rule for what happens when a sweep fix collides with the project's cardinal test rule must exist
_before_ the collision. _Prevents:_ inventing a waiver under pressure, at the exact moment judgement
is worst.

**8. The one pull request nobody will read is the one that needs a scanner.**
_Prevents:_ shipping credentials inside the diff that was approved precisely because it was too large
to read.

**9. Splitting a pure-rename commit from its content changes makes both self-evident.**
1,316 renames in one commit and the content edits in later ones renders as moves rather than as 1,316
delete/add pairs. _Prevents:_ a first pull request whose diff is unreadable for reasons that have
nothing to do with the change.

### On gates

**10. An honestly-red gate with enumerated exceptions beats a gate massaged until it passes.**
Three massages were available in Phase 151 and all three were declined: raise a performance budget to
green a red test; waive a red end-to-end suite and ship; re-scope the identity check past the one
directory that always differs. **Every one would have produced a green board and a weaker guarantee.**
When a gate is red, the question is whether the _gate_ or the _content_ is wrong -- and "make the gate
stop asking" answers neither. _Prevents:_ the whole class of green boards that mean nothing.

**11. A gate may be red by design -- but then write down the exact expected red.**
"Exactly these two rows, and any other row is a real failure." _Prevents:_ a reader who cannot tell
red-by-design from red-by-regression, which is the same as having no gate.

**12. A gate that has never run is not a passing gate.**
The schema linter had been "passing" against a database port that does not exist in this project,
while its FK check reported every single-column foreign key as unindexed (a 1-based `smallint[]`
compared against a 0-based `int2vector`). A workspace's format check had never run because the root
one short-circuits. _Prevents:_ citing coverage you do not have. Corollary, learned writing this very
file: **a drift target that is a file rather than a directory is skipped by the auditor**, which then
reports `OK` forever. Declaring the seven scripts individually would have produced a green,
permanently inert audit -- so the targets above are directories that genuinely change.

**12a. Copying a file across a directory boundary changes which gates reach it.**
These seven scripts lived under an ignored directory and had therefore never met the repository's
format gate. Copying them into `sources/` -- a checked directory -- made one of them a **third**
format-check failure against a baseline whose whole value is "red on exactly these two files". The
resolution was to format the original and the copy together so they stay byte-identical, and to prove
the transform unchanged by running the codemod's committed fixtures rather than asserting it.
_Prevents:_ a copy that silently moves a baseline, and the worse fix of reformatting only the copy so
that `diff -r` no longer means anything.

### On verification

**13. Never trust an internal identity as proof of coverage.**
Six artifacts in Phase 151 were self-consistent and wrong: a `hits + residue == total` balance while
six occurrences matched no rule at all; two YAML duplicate-key collisions, silently last-wins, one of
which would have reported an open criterion as closed; a `--name-status` assertion that a _correct_
pure-rename slice cannot satisfy; a static registry parse returning a reproducible 31 where
`Object.keys` returns 30. **Reconcile against a second, independent method.** _Prevents:_ a check that
proves only that it agrees with itself.

**14. An enumeration is only as complete as its key.**
Keying on `get*Context()` found 1 reactivity violation; enumerating all destructure sites found 2.
_Prevents:_ a census that measures your search term.

**15. A grep over the working tree is not a census when the content includes archives.**
One pattern existed in 32 places; a working-tree grep found 4. The other 28 were inside test trace
archives. _Prevents:_ a "we removed all of them" claim that removed 12%.

**16. Scan the publication surface, not the diff.**
The only reason the "reviewed by nobody" file was seen at all. _Prevents:_ reviewing what changed
while shipping what exists.

**17. One scanner is not a scan.**
An off-the-shelf secret scanner found 2 JWTs; an independent 24-rule sweep found 4, including
`service_role`-shaped tokens no detector flagged. _Prevents:_ a clean report from a tool with a blind
spot you did not measure.

**18. The catch-all catches a dropped PATH, never a dropped FINDING.**
1,202 files shipped inside the stack with their content in no slice's diff; 120 were claimed by no
pathspec at all. Byte-identity held throughout. **It is not a review-coverage guarantee**, and a
file no pathspec claims cannot even be _fixed_ without amending the partition. _Prevents:_ confusing
"the bytes are all there" with "the bytes were all looked at".

**19. When a check fails, first establish whether the CHECK or the CONTENT is wrong.**
About fifteen plan-encoded claims in Phase 151 were wrong as written -- including an acceptance
criterion requiring a substring count of zero in files whose _history_ legitimately contains that
word, which could only be satisfied by falsifying the record. One research prediction was refuted
three separate times and tried to enter a public PR body each time. _Prevents:_ editing correct
content to satisfy an incorrect assertion.

**20. The mechanism being right does not make the signature right, and the signature is all a reviewer
sees.** A CI failure was correctly predicted and published against the wrong step name; two live PR
bodies needed correcting. _Prevents:_ a true statement a reader cannot match to what they are looking
at.

### On mechanical edits

**21. Dry-run first, always.**
Four corrupting regex bugs were caught pre-commit. The worst would have deleted the `()` of every
arrow function in the test suite. _Prevents:_ a codemod that is discovered by its damage.

**22. "The reference is gone" and "the sentence still parses" are different properties.**
The hygiene codemod left 38 broken comments in the test tree, 28 in the routing surface and 6 in the
frontend library -- **after** an all-clear on the strip patterns. _Prevents:_ passing a grep while
leaving prose that reads as garbage.

**23. A mechanical rewrite over a record containing history will rewrite the history too.**
A global find-and-replace updating a table's SHAs silently rewrote eight historical sentences about
what _earlier_ plans had cut. That is falsifying the record, not updating it. Line-scope the edit; it
was caught only because the replace reported 8 occurrences where the table has 1. _Prevents:_ a
record that lies about its own past.

**24. An authorised abbreviation is only authorised when it survives on one line.**
Collapsing a reference across a line break moved an approved criterion's state. _Prevents:_ a
reflow changing meaning.

### On this shell environment specifically

**25. The agent's inline shell is `zsh`; put verification in `bash` script files.**
zsh does **not** word-split an unquoted `$pathspec`, which silently built 8 of 11 slices EMPTY across
two dry runs -- only the catch-all caught it. zsh also eats `:a` / `:d` as parameter modifiers, so
`"$TREE:apps/..."` becomes an absolute-path expansion and four checks reported `MISSING` for content
that was present. Write `${TREE}:path`. In bash, `IFS=$'\t' read` persists into the loop body. Script
shell here is bash **3.2.57** (no `declare -A`); host Python is **3.9.16**.

**26. `git merge-tree --write-tree` exits 1 on success here.** Inspect the tree, never the status.

**27. `git grep -E '\b...'` returns 0** -- git's ERE does not honour `\b`. `-P` is load-bearing, and so
is `-I` whenever binaries are in range. Note also that `grep -P '\xc2\xa0'` matches _codepoints_
U+00C2 U+00A0 in a UTF-8 locale, not the two bytes; use `\x{00a0}`.

## The seven scripts

In `sources/`, byte-identical to
`.planning/phases/151-ship-v0-2-akita-review-stack/scripts/` (assert with `diff -r`).

| Script                      | What it does                                                                                                                                                                                          | Exit codes                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `build-slice.sh`            | One slice: `diff --raw` between tip and target restricted to a pathspec, through a scratch index, to a commit. **One invocation == one pull request.**                                                | 0 built or empty, 2 usage        |
| `build-rename-commit.sh`    | Reconstructs the pure-rename base commit by re-pathing the base tree **by rule**, reusing blob OIDs. Prints its own taxonomy at `renameLimit=1`.                                                      | 0 built, 2 usage                 |
| `verify-identity.sh`        | Criterion 7: `diff` empty **and** tree hashes equal, two independent code paths, both printed as values.                                                                                              | 0 identical, 1 mismatch, 2 usage |
| `verify-commit-taxonomy.sh` | The commit-structure clauses as an exit code: class membership, class cardinality, the database-tag implication, shared-path detection.                                                               | 0 conforming, 1 violation        |
| `hygiene-grep-report.sh`    | Comment hygiene as a before/after occurrence table, with `--assert-clean` to make it a gate and `--save-baseline` to make the two runs one record.                                                    | 0 clean, 1 residue               |
| `slice-overlap-matrix.sh`   | Pairwise N x N file-set overlap across slices, plus `--self-test`. Off-diagonal cells must be 0.                                                                                                      | 0, 1 on overlap                  |
| `hygiene-codemod.mjs`       | The deterministic half of comment hygiene: ordered rules inside classified comment spans only, **dry-run by default**, `--apply` to write, warn-only second pass reporting what it declines to touch. | 0                                |

Standing conventions in all of them, each earned: `set -euo pipefail` **plus** an explicit
`set -o pipefail` (`set -e` does not fire inside a pipeline); `--abbrev=40` on `diff --raw` (git
abbreviates by default and `update-index` then dies with `fatal: malformed index info`);
`-c diff.renameLimit=20000` on every rename-sensitive invocation so a measurement never silently
degrades; a usage block and an exit-code table so a caller can branch on status alone.

## What this procedure does not do

- **It does not make the intermediate stack states build or pass.** They are not expected to. In Phase
  151 the root workspace globs were stale from the first slice until the last, so no intermediate
  state could even install. Say so in the pull request bodies; a reviewer meeting an unexplained red
  CI run will reasonably read it as a broken PR.
- **It does not review the content.** It produces a shape a reviewer can read. The sweep is separate
  work, and the disposition record is what makes it auditable.
- **It does not survive contact with an unauthorised force-push.** Every force-push in Phase 151 was
  against a **named, closed, exhaustive** branch list, confirmed against the actual target list before
  acting, and dry-run first. A grant is spent when used; it never extends by implication. Measure a
  force-push's real cost by hashing each slice's **own patch** (`parent..self`), not its cumulative
  tree -- for five of six branches the reviewer-visible content was unchanged and only the parent
  pointer moved.
