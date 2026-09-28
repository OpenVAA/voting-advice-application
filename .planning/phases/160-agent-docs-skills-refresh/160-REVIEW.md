---
phase: 160-agent-docs-skills-refresh
reviewed: 2026-09-14T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - .claude/scripts/audit-skill-routing.sh
  - .claude/scripts/audit-skill-links.sh
  - apps/docs/scripts/generate-navigation-config.ts
  - apps/docs/src/lib/navigation.config.ts
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 160: Code Review Report

**Reviewed:** 2026-09-14
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Both guard scripts were read in full and exercised live against the corpus (not just read), and
their sibling `audit-skill-drift.sh` was read for contract comparison. The scripts are, on the
whole, carefully written: `set -euo pipefail` is honored throughout, every `local var=$(cmd)`
double-assignment trap (which silently defeats `set -e`) is avoided by declaring and assigning on
separate lines, every loop that needs to accumulate counters reads via process substitution
(`< <(...)`) rather than piping into `while` (which would run the loop in a subshell and lose the
counters), every `grep -c` that can legitimately return zero is guarded with `|| true` so a
"nothing found" result is never confused with a script error, and the exit-status-through-a-pipe
trap this project has been burned by before does not appear in either file's own gating logic. The
generator fix in `generate-navigation-config.ts` was verified against its actual diff
(`dd117c31d`) and does what the phase claims: it changed the *source* of the JSDoc header, not just
the checked-in output, so a fresh `tsx generate-navigation-config.ts` run will not re-introduce the
Phase 152 comment-hygiene violation the plan describes.

Two Warning-level defects were found by exercising the scripts against the live corpus rather than
just reading them, both in the routing guard's core measurement and in the link guard's environment
independence — the two properties this review was told to weigh most heavily. Neither currently
flips a reported verdict, but both undermine the precision the tools claim for themselves. Two Info
items are lower-stakes documentation/contract-shape observations.

## Warnings

### WR-01: `audit-skill-links.sh` omits the `command grep` hardening its own sibling requires in this exact repo

**File:** `.claude/scripts/audit-skill-links.sh:210, 218, 243, 257, 262`
**Issue:** `audit-skill-routing.sh` (landed in the same phase, plan 09) calls `command grep`
everywhere and states why in its header (`.claude/scripts/audit-skill-routing.sh:190-194`): "In
this repository `grep` is a shell function wrapping `ugrep`, whose output differs..., and a guard
whose verdict depends on which grep the caller happens to have exported is not a guard." That is
not a hypothetical for this project — verified live in this session:

```
$ type grep
grep is a shell function from /Users/kallejarvenpaa/.claude/shell-snapshots/snapshot-zsh-....sh
$ grep --version
ugrep 7.8.4 ...
```

`audit-skill-links.sh` never adopts this hardening; all five of its `grep` call sites use the bare
name. Plan 09's own commit touched this exact file (to add check 3c) in the same plan that
discovered and fixed the hazard in the sibling script, so this is not an oversight from before the
hazard was known — it is an inconsistency introduced by the same plan that fixed it elsewhere.
Tested: a script invoked as `bash file.sh` from this session's zsh does not currently inherit the
zsh function (`bash -c 'type grep'` inside a fresh script resolves to `/usr/bin/grep`), so there is
no live exploit today. But the guard's own sibling treats "does not currently exploit" as
insufficient assurance and hardens anyway (proving it via a poisoned exported function, per its
plan's SUMMARY) — the same standard was not applied here, in a file that shares "the same
argument/output/exit contract" by its own docblock's claim (`.claude/scripts/audit-skill-links.sh:47-49`).
**Fix:**
```bash
GREP="command grep"
# ... then use $GREP everywhere in place of the bare `grep` at lines 210, 218, 243, 257, 262
```

### WR-02: `audit-skill-routing.sh`'s hop/pointer detector miscounts real source-code citations as routing hops

**File:** `.claude/scripts/audit-skill-routing.sh:230-245` (the `harvest()` function)
**Issue:** The script's own design principle, stated in its header, is that "Citations of SOURCE
CODE (`.ts`, `.svelte`, `.sql`) are deliberately NOT hops" — this is load-bearing for the whole
density methodology. `harvest()` implements this only by checking the file *extension* of a
matched token, not by respecting Markdown code-span boundaries or verifying the token names a file
actually inside the corpus. Two concrete manifestations exist in the reviewed corpus today:

1. **The `[[...]]` wiki-alias regex (line 237, `/\[\[[A-Za-z0-9_.-]+\]\]/`) fires inside inline
   backtick citations of real SvelteKit optional-route-segment paths**, because
   `[[electionTab]]` (a literal path segment, not a wiki-alias) satisfies the same shape. Confirmed
   live:
   ```
   $ bash .claude/scripts/audit-skill-routing.sh components
        9.1%     1/11    content   components/context-reactivity.md :: ## 2. Canonical pattern
   ```
   The section's *only* pointer line is the false hit from
   `.claude/skills/components/context-reactivity.md:62` (`` `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:63-70` ``),
   which cites a `.svelte` file — exactly the class the header says is excluded. A second
   instance is `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md:133`
   (`` `results/[[electionTab]]/+layout.svelte` ``).
2. **The bare `.md` regex (line 241, `/[A-Za-z0-9_.$@\/-]+\.md/`) excludes `(`, `)` and `+` from
   its character class**, so it does not fail closed on a real citation containing them — it
   silently truncates to a garbage token. Reproduced directly:
   ```
   $ echo '`apps/docs/src/routes/(content)/.../generated/+page.md`' | awk '{ while (match($0,/[A-Za-z0-9_.$@\/-]+\.md/)) { print substr($0,RSTART,RLENGTH); $0=substr($0,RSTART+RLENGTH) } }'
   page.md
   ```
   This is the exact citation present at `.claude/skills/README.md:302` and
   `.claude/skills/components/SKILL.md:101`. The bogus `page.md` token is counted as a pointer line
   (confirmed live: `components/SKILL.md :: ## The component listing — linked, never copied` scores
   1/12, and that section's only `.md`-shaped substring is this citation) even though the string
   names a real file that is unambiguously not a corpus document, and even though it isn't a corpus
   citation at all in the sense the rule defines a hop.

Neither case currently flips a reported verdict (both scores are far under the 50% threshold), and
the direction of the error is inflation, not suppression — so it is not the "guard silently passes"
failure mode this review was told to weigh heaviest, but it does directly contradict the tool's own
stated invariant, and it corrupts the density numbers that the file-level and section-level
threshold derivation in the header cites as "measured." A future edit that adds a few more such
citations to a short section could push a genuinely-content section over the 50% line and produce a
false `INDEX` verdict that a maintainer would have to spend time disproving.
**Fix:** Either (a) strip inline and fenced code spans before running `harvest()` (the same
exclusion already applied to fenced ` ``` ` blocks, extended to single-backtick spans), so a
citation embedded in code is never scanned for wiki-alias/`.md` shape at all — consistent with the
stated principle that source-code citations are not hops; or at minimum (b) widen the `.md`
character class to include `(`, `)`, and `+` so a real citation is captured whole rather than
truncated to a token that can never be self-consistent with what a human reading the line would
call "the pointer."

## Info

### IN-01: The three sibling guards' docblocks claim an argument contract they do not actually share

**File:** `.claude/scripts/audit-skill-links.sh:47-49`, `.claude/scripts/audit-skill-routing.sh:14-18`
**Issue:** Both headers assert "same directory, same audience, same argument/output/exit contract"
with `audit-skill-drift.sh`. In fact the three diverge: `audit-skill-drift.sh` accepts only a bare
skill name (`$SKILLS_DIR/$1`); `audit-skill-links.sh` accepts a skill name or a file path;
`audit-skill-routing.sh` additionally accepts an arbitrary directory path. Reproduced:
```
$ bash .claude/scripts/audit-skill-links.sh .claude/skills/data
Skill or file not found: .claude/skills/data      # exit 1
$ bash .claude/scripts/audit-skill-routing.sh .claude/skills/data
...                                                # scoped audit, exit 0
```
This is documented and deliberate per the phase's own plan summary (routing.sh is a "superset"),
and it never breaks a call that works on the narrower siblings, so it is not a functional defect —
but a caller who reads either header's "same contract" claim and assumes the directory-path mode
works on all three will hit a wrong error message on the two that don't support it.
**Fix:** Soften the claim to "same output/exit contract; `audit-skill-routing.sh`'s argument mode
is a superset of the other two's" in both headers, or narrow `audit-skill-routing.sh`'s argument
handling to match its siblings exactly.

### IN-02: Pre-existing `eval()` in the navigation generator, untouched by this phase but in the required-reading file

**File:** `apps/docs/scripts/generate-navigation-config.ts:77`
**Issue:** `loadCurrentConfig()` reads back the previously generated `navigation.config.ts` and
parses its exported array via `return eval(`(${match[1]})`);`, with a comment asserting "safe in
this context." This line is unchanged by phase 160 (the phase's only edit to this file is the
JSDoc-header join at line ~510, verified against commit `dd117c31d`), so it is not a regression
introduced here — but `eval` on file content is exactly the pattern this review's scope calls out,
and the file was named as required reading in full. Practically low-risk (a local dev/build script
operating on the project's own tracked, code-reviewed file), but a corrupted or maliciously-edited
`navigation.config.ts` merged into the tree would execute arbitrary code the next time anyone runs
the generator.
**Fix:** Not phase 160's to fix, but worth filing: replace with a small regex/AST-based extraction
of the array literal, or have the generator dynamically `import()` the compiled config instead of
re-parsing its own textual output.

---

_Reviewed: 2026-09-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
