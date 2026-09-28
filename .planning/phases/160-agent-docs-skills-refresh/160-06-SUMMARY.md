---
phase: 160-agent-docs-skills-refresh
plan: 06
subsystem: docs
tags: [claude-md, skills, routing, svelte5, context-reactivity, trim, ablation]

requires:
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 05's `.claude/skills/components/context-reactivity.md` — the committed relocation destination this plan removes the source of, and its measurement of the 39 in-code references that constrained how"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 04's `.claude/skills/README.md` — the recorded trim decision, the deliberately-kept list, and the one-level routing rule this file's routing section now demonstrates"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 01's `.claude/scripts/audit-skill-links.sh` and its repaired `CLAUDE.md` baseline of `Checked: 58  Dangling: 0`"
  - phase: 158-routing-and-auth
    provides: "`apps/frontend/src/lib/routes/` — the route-building barrel the key-directories list now names"
  - phase: 159-component-and-context-consolidation
    provides: "`apps/frontend/src/lib/layouts/` and the `$layouts` alias the path-alias list now carries"
provides:
  - "A `CLAUDE.md` trimmed to commands and hard conventions: 30,555 B / 437 lines -> 28,038 B / 341 lines, with the invariant reached in one hop"
  - "A 7-line compressed context-reactivity pointer that keeps the exact heading `### Context Destructuring Rule (Svelte 5)` findable, so all 39 in-code references across 32 files still resolve"
  - "A `## Skill Routing` section rebuilt as a single flat routing layer: 7 entries, every one reaching content in one hop, every invoked skill present on disk"
  - "Path-alias and key-directory lists re-derived from `apps/frontend/svelte.config.js` and the live post-158/159 tree, two-way checked"
  - "Three stale factual claims corrected in passing: the Edge Function names, the i18n library, and how pre-registration reaches the backend"
affects: [160-07, 160-08, 160-09]

actuals:
  tokens: 7010 # chars/4 over the one file actually changed (CLAUDE.md, 28,038 B). See "On the estimate" below — the 32,000-token estimate priced the read-and-verify work, not the written bytes.
  tasks: 2
  commits: 2
plan_head_before: bc88065db54ba8404ed5e85e53a6d1df4a5eb335

tech-stack:
  added: []
  patterns:
    - "A relocation keeps the SOURCE HEADING as the pointer's heading when in-code comments cite the rule by that name; the body moves, the anchor does not."
    - "A routing section that claims one-level depth states the claim in its own lead paragraph, so the rule is visible to the reader it binds."
    - "A tense-bound claim about another plan's deletion is rewritten tense-neutral: `CLAUDE.md` must be true at every commit, not only after the phase ends."

key-files:
  created: []
  modified:
    - CLAUDE.md

key-decisions:
  - "The heading `### Context Destructuring Rule (Svelte 5)` was KEPT VERBATIM rather than renamed to match the destination file. 39 source comments across 32 files in `apps/frontend/src` cite the rule by that exact name and name `CLAUDE.md` as where it lives; renaming the heading would have dangled all 39 while satisfying every other criterion. The body moved; the anchor stayed."
  - "The routing section got SEVEN entries, not the three the plan's must_have names. The architecture entry tells a reader to use `that subsystem's skill below`, which is a false promise if the domain skills are not listed — and a routing layer that omits five of the seven live skills silently implies they do not exist. The four package domains and `ship-review-stack` were added for that reason."
  - "The architecture entry's closing sentence was rewritten tense-neutral before commit. The first draft said the `architect` skill `was deleted rather than maintained` — but Plan 07 has not run, the directory still exists, and `CLAUDE.md` would have carried a false claim for the length of a wave. It now says there is deliberately no architecture skill because a stub whose body is a pointer back here routes nothing."
  - "The data-model and matching paragraphs were replaced by pointers at the CONCRETE resource files (`object-model.md`, `algorithm-reference.md`) alongside the `Skill(...)` invocation, not at the `SKILL.md` routing layers alone — so the pointer lands on content in one hop even for a reader who follows the path rather than invoking the skill."
  - "`$voter` was kept in the alias list with its dead-target annotation intact, unbackticked. The two-way check demands every alias declared in `svelte.config.js` appear in the block; the annotation is what stops the block resurrecting a directory that does not exist and has zero importers."

patterns-established:
  - "Section-preserving rewrite: kept regions are re-emitted from the original file by line range (`sed -n`) rather than retyped, so `byte for byte` is a property of the method rather than a claim about care."
  - "Every acceptance-criterion extraction idiom is run and read before being relied on; a criterion whose idiom is defective is substituted and the substitution recorded per criterion."

requirements-completed: [REVIEW-DOC-03, REVIEW-DOC-04]

coverage:
  - id: D1
    description: "The relocation is complete: the invariant body is gone from `CLAUDE.md`, a compressed pointer states the rule, and the full reference is one hop away"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "grep -c 'FLATTEN-02' CLAUDE.md -> 0; grep -ci 'destructur' CLAUDE.md -> 5; grep -c 'context-reactivity.md' CLAUDE.md -> 1"
        status: pass
      - kind: other
        ref: "pointer span, lead-in to next heading exclusive: awk range | sed '$d' | wc -l -> 7 (budget 8)"
        status: pass
      - kind: other
        ref: "ordering: git log --diff-filter=A -- .claude/skills/components/context-reactivity.md -> 9268b977d; git merge-base --is-ancestor 9268b977d HEAD -> exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The 39-reference regression is resolved: every in-code comment citing `CLAUDE.md`'s Context Destructuring Rule still lands on a named rule and reaches the full text in one hop"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "post-trim: grep -rn 'Context Destructuring Rule' apps/frontend/src | wc -l -> 39; -l | wc -l -> 32 (unchanged); grep -n 'Context Destructuring Rule' CLAUDE.md -> 283 (the heading, kept verbatim)"
        status: pass
      - kind: other
        ref: "one hop: test -f .claude/skills/components/context-reactivity.md -> OK, named in the pointer's closing sentence"
        status: pass
    human_judgment: false
  - id: D3
    description: "All four deliberately-kept hard conventions survive the trim intact, not merely mentioned"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "for p in 'CARDINAL FAILURE' 'preflight' 'FRONTEND_PORT' 'svelte-warning: accepted'; do grep -qF \"$p\" CLAUDE.md || echo MISSING; done -> prints nothing; all four patterns matched as written, no adjustment needed"
        status: pass
      - kind: other
        ref: "db:* vs dev:* split: the Database & Stack Commands region carries 'Harmonised naming' 1, '--- Database only' 1, '--- Full stack' 1, 'db:reset' 4"
        status: pass
      - kind: other
        ref: "git diff 32a5633de^..32a5633de -- CLAUDE.md touches no line of the E2E, preflight, db/dev or svelte-warning regions (re-emitted by line range, not retyped)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The path-alias and key-directory lists describe the post-158/159 tree"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "two-way alias check: CLAUDE.md {$candidate $layouts $types $voter} vs svelte.config.js {$candidate $layouts $types $voter}; diff -> empty"
        status: pass
      - kind: other
        ref: "key-directories loop over 11 backticked paths (-d for trailing-slash entries, -e for hooks.server.ts) -> prints nothing; new entries lib/routes (Phase 158), lib/layouts (Phase 159), lib/server"
        status: pass
    human_judgment: false
  - id: D5
    description: "The stale forward-looking roadmap block is gone and no environment-variable value was introduced"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "grep -c '^## Roadmap' CLAUDE.md -> 0; grep -cE 'PUBLIC_SUPABASE_[A-Z_]+=[^ ]' CLAUDE.md -> 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "`## Skill Routing` is a single flat routing layer: the folded architecture content as prose, a discriminative components entry, a record pointer, and every invoked skill present on disk"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "awk '/^## Skill Routing/,0' | grep -ci architect -> 1; grep -c 'Skill(\"components\")' -> 1; grep -c '.claude/skills/README.md' -> 1; grep -c 'Skill(\"architect\")' -> 0"
        status: pass
      - kind: other
        ref: "existence loop over every Skill(\"x\") in the section -> components, data, database, filters, matching, ship-review-stack, spike-findings-voting-advice-application-gsd all OK; no NO SUCH SKILL line"
        status: pass
      - kind: other
        ref: "architecture entry names 5 concrete skill destinations plus two sections of this file (15 backticked tokens on the line, budget 2); components entry contains 'destructure trap' and 'dataRoot'"
        status: pass
    human_judgment: false
  - id: D7
    description: "Repo gates green and no dangling citation introduced"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "bash .claude/scripts/audit-skill-links.sh CLAUDE.md -> Checked: 67  Dangling: 0  Skipped: 25, exit 0 (baseline after Plan 01: 58/0/22)"
        status: pass
      - kind: other
        ref: "yarn lint:check -> exit 0, read from $? on the command itself, never through a pipe; 23/23 turbo tasks, every in-tree guard 0 violations"
        status: pass
      - kind: other
        ref: "npx prettier --check CLAUDE.md -> clean"
        status: pass
    human_judgment: false
  - id: D8
    description: "The compressed pointer does not mislead a reader who never follows the link, and no trimmed paragraph lost its home"
    verification: []
    human_judgment: true
    rationale: "The plan's own <human-check>. A grep proves the taxonomy and both prohibitions are present and that the trimmed paragraphs' destinations exist; only a human reading the pointer against `.claude/skills/components/context-reactivity.md`, and the compressed architecture/backend/workflow blocks against the domain skills, can judge that nothing normative was softened and nothing was deleted whose content now has no home."

duration: ~55 min
completed: 2026-09-13
status: complete
---

# Phase 160 Plan 06: The CLAUDE.md trim, the relocation's removal half, and the routing rewrite Summary

**`CLAUDE.md` cut from 30,555 B / 437 lines to 28,038 B / 341 lines — the Svelte-context essay replaced by a 7-line compressed pointer under its own unchanged heading, so all 39 in-code references across 32 files still resolve; the four hard conventions re-emitted by line range rather than retyped; and `## Skill Routing` rebuilt as a 7-entry flat layer in which every entry reaches content in one hop and every invoked skill exists on disk.**

## Performance

- **Duration:** ~55 min
- **Completed:** 2026-09-13
- **Tasks:** 2
- **Files modified:** 1 (`CLAUDE.md`)

## Accomplishments

- **The relocation is complete and the invariant was never absent from the tree.** The destination's add-commit `9268b977d` is an ancestor of both of this plan's commits, asserted rather than assumed.
- **The 39-reference regression Plan 05 flagged is resolved at zero cost to the 32 files.** The heading `### Context Destructuring Rule (Svelte 5)` was kept verbatim; a reader arriving from any of those comments lands on the rule, stated compressed, and reaches the full text in one hop.
- **The four deliberately-kept conventions survive by construction, not by care.** Every kept region was re-emitted from the original file by line range, so the commit diff cannot touch them.
- **Both hand-written lists were wrong and are now right.** The path-alias list gained `$layouts` (Phase 159) and the key-directory list gained `lib/routes` (Phase 158), `lib/layouts` and `lib/server`; the alias list is two-way checked against `apps/frontend/svelte.config.js`.
- **Three stale factual claims fell out of the rewrite** — the Edge Function names, the i18n library, and how pre-registration reaches the backend. None was in the plan; all three were false against the live tree.
- **The link audit denominator grew by 9 with zero new dangling citations** (58 -> 67 checked, 0 -> 0 dangling).

## Task Commits

1. **Task 1: Complete the relocation and trim the descriptive prose** — `32a5633de` (docs)
2. **Task 2: Rewrite the routing section** — `09062d40a` (docs; amended once pre-report to remove a tense-bound claim, see Decisions)

## Before / after

| | Bytes | Lines |
|---|---:|---:|
| Baseline (Plan 01's `CLAUDE.md`, at `bc88065db`) | 30,555 | 437 |
| After Task 1 (the trim alone) | 24,664 | 324 |
| **After Task 2 (as shipped)** | **28,038** | **341** |
| Net change | **−2,517 (−8.2%)** | **−96 (−22.0%)** |

The trim removed 19.3% of the file's bytes; the routing rewrite put 13.7% back, because the folded architecture content and five previously-unlisted skills are new text. **A byte count is the wrong headline for this plan** and is recorded because the plan asked for it: the relocated essay was 52 dense lines, and what replaced it across both tasks is a routing layer. The line count is the better signal.

## Per-section trim disposition

| Section | Disposition | Where the content went |
|---|---|---|
| `# CLAUDE.md`, `## Overview` | **kept**, byte for byte | — |
| `## Development Commands` (Setup, Building, Testing, E2E Hard Rule, E2E preflight, Linting, Workspaces, Database & Stack Commands, Single Test Development) | **kept**, byte for byte | — (the commands-and-hard-conventions class the finding says to inline) |
| `### Monorepo Structure` | **kept**, byte for byte | — |
| `### Module Resolution & Dependencies` | **kept**, byte for byte | — (carries Plan 01's corrected ESM-only claim and the canonical-package-paradigm pointer this plan's own pointer copies) |
| `### Build System` | **compressed** 9 lines -> 3 | operative facts only: `turbo.json` is the config, `.turbo/` is not committed. The three bullets restated what the Building block already says. |
| Data Model Philosophy | **pointed** | `.claude/skills/data/object-model.md` + `Skill("data")`. The `MISSING_VALUE` half stays inline under Important Implementation Notes, where it already was. |
| Matching Algorithm Paradigm | **pointed** | `.claude/skills/matching/algorithm-reference.md` + `Skill("matching")` |
| Instance Checks | **kept** | — |
| Frontend Data Flow | **kept**, minus its two routing bullets | the routing bullets moved to § *Frontend (SvelteKit)*, where routing lives; they were duplicated across the two sections |
| Settings Architecture | **kept** | — |
| `## Development Environment` | **kept**, byte for byte | — (ports, URLs, the `PUBLIC_PROJECT_ID` no-fallback contract) |
| `## Frontend (SvelteKit)` | **rewritten** | aliases and key directories re-derived from `apps/frontend/svelte.config.js` and the live tree |
| `## Backend (Supabase)` | **compressed** to four bullets **and pointed** | schema/RLS/claims detail -> `.claude/skills/database/schema-reference.md`, `.claude/skills/database/rls-policy-map.md`, `Skill("database")` |
| `## Common Workflows` | **compressed** 51 lines -> 22 | the three E2E paragraphs collapsed to one keeping the two facts the commands block does NOT carry: that the wrapper sets `PUBLIC_PROJECT_ID` to the suite's project, and that clearing the database is not a precondition |
| `## Important Implementation Notes` | **kept**, byte for byte | — |
| `### Context Destructuring Rule (Svelte 5)` | **relocated**, heading kept | body -> `.claude/skills/components/context-reactivity.md` (Plan 05, `9268b977d`); 7-line compressed pointer left behind |
| `### Svelte Warning-Accepted Format` | **kept**, byte for byte | — |
| `## Deployment` | **compressed** 9 lines -> 3 | absorbed the `docker-compose.dev.yml` line from Development Environment's tail so the deployment facts sit together |
| `## Troubleshooting` | **compressed** to four bullets | added the `strictPort` fact and `PUBLIC_PROJECT_ID` to the two entries that were incomplete |
| `## Roadmap` | **deleted** | nothing — it listed as 2026 future work a Svelte 5 upgrade this codebase completed, so it was a stale claim as well as a trim candidate |
| `## Code Review` | **kept**, byte for byte | — |
| `## Skill Routing` | **rewritten** (Task 2) | see below |

**Nothing was deleted whose content has no home**, with one deliberate exception: the roadmap block, whose only content was a claim that is false.

## The kept-item grep mapping

The plan told me to adjust each pattern to the wording actually present and record the mapping. **No adjustment was needed — all four patterns matched as written.**

| Plan's pattern | Matches | Adjusted? |
|---|---|---|
| `CARDINAL FAILURE` | `CLAUDE.md:48`, the blockquote — *"Failing E2E tests are a CARDINAL FAILURE…"*, with its no-flaky-exemption bullet at `:50` and the did-not-run bullet at `:52` | no |
| `preflight` | the `#### E2E preflight (served-application gate)` heading at `:54` and 5 body occurrences | no |
| `FRONTEND_PORT` | `:60`, the alternate-port escape hatch with both working forms | no |
| `svelte-warning: accepted` | the fenced literal at `:297` and the prose that scopes it at `:299` | no |

The database-only versus full-stack split survives with all three of its markers: the `**Harmonised naming:**` lead, the `# --- Database only …` banner and the `# --- Full stack …` banner, inside a region carrying 4 `db:reset` occurrences.

## The 39-reference resolution, re-run after the trim

```
grep -rn 'Context Destructuring Rule' apps/frontend/src | wc -l   ->  39   (unchanged)
grep -rln 'Context Destructuring Rule' apps/frontend/src | wc -l  ->  32   (unchanged)
grep -n  'Context Destructuring Rule' CLAUDE.md                   ->  283: ### Context Destructuring Rule (Svelte 5)
```

**The resolution is the one the blocking finding and the plan's own `must_have` both point at, and it cost nothing outside `files_modified`.** Those 39 comments read *"per CLAUDE.md's Context Destructuring Rule"* and *"See CLAUDE.md § Context Destructuring Rule, the `dataRoot` version-bridge carve-out"*. Keeping the heading verbatim means each still lands on a heading it recognises; the seven lines beneath it carry the two-class taxonomy, both prohibitions and the mechanism in one sentence each, and close by naming `.claude/skills/components/context-reactivity.md`. A reader who stops at the pointer knows the rule; a reader who follows it gets the accessor list, the canonical pattern and the four spike and debug references.

No alternative resolution was considered necessary. Repointing 32 files is the expensive alternative Plan 05 named, and it is unnecessary while the anchor holds.

## The two-way alias check

```
in CLAUDE.md: $candidate $layouts $types $voter
in config   : $candidate $layouts $types $voter
diff        : (empty)  -> TWO-WAY MATCH
```

`$layouts` is new to this file (Phase 159). `$voter` is carried with its annotation intact: **declared in `svelte.config.js`, target directory `src/lib/voter` does not exist, 0 importers** (re-measured this session: `grep -rn "from '\$voter" apps/frontend/src` -> 0). The annotation is deliberately unbackticked so the link audit does not chase a path the file is telling you is dead. Phase 158's `lib/routes` has no alias — it is reached as `$lib/routes`, and the key-directories list says so.

## Acceptance-criterion idioms: what I had to substitute

Four of this plan's criteria could not be run as written. Recorded per criterion, per the phase's standing rule that a vacuous pass is never reported as a pass.

| Criterion | Defect | Substitute used |
|---|---|---|
| Task 1, pointer span | `head -n -1` is a GNU extension; BSD `head` on macOS rejects a negative count and the pipeline returned `0`, which would have read as a passing span | `awk '/^\*\*Two property classes…/,/^### Svelte Warning-Accepted Format/' CLAUDE.md \| sed '$d' \| wc -l` -> **7** |
| Task 1, `db:*` vs `dev:*` | `awk '/Database & Stack Commands/,/^## /'` does not collapse (the `### ` heading does not match `^## `), but it over-spans to the next `## ` heading — `## Architecture` — pulling in Single Test Development | terminated the range at `### Single Test Development` instead, then counted the three markers separately |
| Task 1, key directories | the block cites `apps/frontend/src/hooks.server.ts`, a file; a bare `test -d` loop fails on it | `-d` for entries ending `/`, `-e` otherwise |
| Task 1, key directories (my own first attempt) | extracting the paths with `tr -d '\`- '` strips hyphens *inside* the path — `dynamic-components` became `dynamiccomponents` and reported a false `NOT A DIR` | `sed -nE 's/^- \`([^\`]+)\`.*/\1/p'` |

Task 2's criteria all use `awk '/^## Skill Routing/,0'`, which is sound, and ran as written.

## The routing section as shipped

Seven entries, and a lead paragraph stating the rule they obey:

1. **Application architecture** — prose, **no skill invocation**. Names its destinations: § *Architecture* and § *Frontend (SvelteKit)* in this file, and the five domain skills for a single subsystem.
2. **Svelte components and context reactivity** -> `Skill("components")`. Names the destructure trap and the `dataRoot` carve-out explicitly, so it is discriminative for the relocated content.
3. **The package domains** — four sub-entries -> `Skill("data")`, `Skill("matching")`, `Skill("filters")`, `Skill("database")`, each selected by the package the file is in.
4. **Restructuring a long-lived branch** -> `Skill("ship-review-stack")`.
5. **Why the skill corpus is shaped this way** -> `.claude/skills/README.md`, pointed at for what the README itself holds — the measurement, the judgements, the one-level rule, the conventions for adding a skill. Explicitly *not* a route to a skill.
6. **Spike findings** — **left byte-identical**, see below.

**Why the spike-findings entry was left alone.** Its removal is bound to the deletion of the skill it names, and that deletion is gated by an explicit `checkpoint:decision` in Plan 07. Removing the pointer here would orphan a live skill if the checkpoint says keep, or split one unit of work across two waves if it says delete. Plan 07 owns both halves.

## Decisions Made

- **The heading stays; the body moves.** Recorded in full above. It is the difference between a documentation trim and a 32-file regression.
- **Seven routing entries, not three.** The architecture entry promises "that subsystem's skill below"; listing only `components` would have made that a false promise and left five live skills unnamed in the repo's only routing index.
- **Pointers name the concrete resource file, not just the skill.** `.claude/skills/data/object-model.md` alongside `Skill("data")`, so the hop lands on content whichever way the reader follows it. This is what Plan 09's Check A will score.
- **The architecture entry was rewritten tense-neutral before commit.** The draft asserted the `architect` skill "was deleted" — but `.claude/skills/architect/` still exists until Plan 07 runs, so `CLAUDE.md` would have carried a false claim for a whole wave. The shipped wording ("there is deliberately no architecture skill: a stub whose entire body is a pointer back to this file routes nothing") is true before and after the deletion. Task 2's commit was amended, pre-report, to carry the correction.
- **No CI claim is made.** `.github/workflows/main.yaml` carries `paths-ignore: "**.md"` on every trigger, and this plan is a single-Markdown-file change. It did not run and could not have. A green `audit-skill-drift.sh` would not be evidence either.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Three stale factual claims corrected while rewriting the sections that carried them**

- **Found during:** Task 1, while re-deriving the Backend and Frontend sections against the live tree
- **Issue:** (a) `## Backend` named the Edge Functions as *"preregister, send-email, admin"*; `ls apps/supabase/supabase/functions` returns `identity-callback`, `invite-candidate`, `send-email` — two of the three named do not exist. (b) The key-directory list described `lib/i18n/` as *"Internationalization (sveltekit-i18n)"*; there is no `sveltekit-i18n` dependency anywhere in the tree, and `apps/frontend/src/lib/i18n/README.md:3` states the library is Paraglide JS, wrapped by a local `t()`. (c) *"Pre-registration via Supabase Edge Function"* named no function; `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:128` invokes `invite-candidate`.
- **Fix:** all three rewritten against the measured source.
- **Files modified:** `CLAUDE.md`
- **Verification:** directory listing, dependency grep, call-site grep — each named above.
- **Committed in:** `32a5633de`

**2. [Rule 3 - Blocking] A package-relative citation I introduced, caught by the link gate before commit**

- **Found during:** Task 1, at the first `audit-skill-links.sh` run on the draft
- **Issue:** the alias paragraph I wrote said "everything else under `src/lib`", and `src/lib` is exactly the package-relative-citation class the guard deliberately refuses to forgive. `Dangling: 1 of 58`, exit 1.
- **Fix:** rewritten to `apps/frontend/src/lib/`.
- **Files modified:** `CLAUDE.md`
- **Verification:** re-run -> `Checked: 58  Dangling: 0`, exit 0.
- **Committed in:** `32a5633de` (the fix landed before the task's commit; no dangling citation ever reached git)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking).
**Impact on plan:** none on scope. Deviation 1 is the class the phase exists to remove and was found inside the sections the plan already told me to rewrite. Deviation 2 is a gate doing its job on my own draft.

## Issues Encountered

- **The stale copy of `CLAUDE.md` in my own context.** The project-instructions copy injected at session start predates Plan 01's repairs — it still shows `$voter -> apps/frontend/src/lib/voter` as a live alias and the ESM+CommonJS claim. Every edit was made against the on-disk file read fresh; the injected copy was treated as stale throughout. Worth knowing for Plans 07–09, which will receive the same stale injection.
- **Nothing else.** No checkpoint, no auth gate, no architectural decision.

## On the estimate

The plan estimated 32,000 tokens; `actuals.tokens` records **7,010**, which is `chars/4` over the single file changed, as the instrument specifies. **The two numbers measure different things and the gap is not an under-run.** This plan's cost was reading — 14 required documents, `CLAUDE.md` in full, `apps/frontend/svelte.config.js`, the live `lib/` tree, three skill files and the link auditor's source — plus two full `yarn lint:check` runs. The written artifact is one 28 KB file. Recorded unrounded rather than adjusted toward the estimate.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 07 has two edits in `CLAUDE.md § Skill Routing`, not one.** If the checkpoint says DELETE, remove the final bullet — the whole `- **Spike findings for voting-advice-application-gsd**` entry and its three indented lines — and nothing else; the other six entries name skills Plan 07 keeps. The architecture entry is already worded so that deleting `.claude/skills/architect/` requires **no** edit here: it invokes no skill and asserts nothing about when the stub was removed.
- **`.claude/skills/architect/` is still on disk and still routed-to by nothing.** After this plan, no file in the tree invokes `Skill("architect")`; the deletion is now pointer-free and safe in either order.
- **Plan 08 (`BOUNDARIES.md`) inherits two corrections made here** it should not re-derive from CONTEXT.md: `lib/routes` and `lib/layouts` exist and are named in `CLAUDE.md`'s key-directory list, and the Svelte 4 component claim that `BOUNDARIES.md:64` still carries is contradicted by both `CLAUDE.md` and the rewritten `components` skill.
- **Plan 09's Check A sees a conformant `CLAUDE.md § Skill Routing`.** Seven entries; each points at either a section of `CLAUDE.md` itself, a concrete resource file, or a `SKILL.md`. The one entry pointing at `.claude/skills/README.md` points at it for its own content, not as a route onward. The remaining depth violation is the spike-findings chain alone, subject to Plan 07.
- **Plan 09's link baseline for this file moved for a benign reason:** `CLAUDE.md` now reports `Checked: 67  Dangling: 0  Skipped: 25`, up from `58 / 0 / 22`. The denominator grew by this plan's 9 new citations; the dangling count is unchanged at 0.
- **Plan 09's Check B is unaffected by this plan** — it reads `SKILL.md` frontmatter descriptions, none of which this plan touched. Re-derive the stem count rather than carrying Plan 05's 5-of-8.
- **No blockers.** `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` and `.planning/STATE.md` are unmodified by this plan, per CONTEXT.md § 0.1(c).

---

_Phase: 160-agent-docs-skills-refresh_
_Completed: 2026-09-13_

## Self-Check: PASSED

- `key-files.modified` present on disk: `CLAUDE.md` FOUND.
- Both commits resolve in `git log --oneline --all`: `32a5633de`, `09062d40a`.
- `commits: 2` is MEASURED: `git rev-list --count bc88065db..HEAD` at SUMMARY-write time -> 2. `plan_head_before: bc88065db54ba8404ed5e85e53a6d1df4a5eb335`.
- All Task 1 and Task 2 acceptance criteria re-run at SUMMARY time; every one passes, with four idiom substitutions recorded above.
- Plan-level verification re-run: `audit-skill-links.sh CLAUDE.md` exit 0, alias two-way match empty, every invoked skill's directory exists, `yarn lint:check` exit 0 read from `$?` directly.
- Prohibition honoured: `git diff --name-only bc88065db..HEAD` lists only `CLAUDE.md` — no `ROADMAP`, `REQUIREMENTS` or `STATE` path.
