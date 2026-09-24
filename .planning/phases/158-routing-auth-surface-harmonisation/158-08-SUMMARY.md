---
phase: 158-routing-auth-surface-harmonisation
plan: 08
subsystem: planning-records
tags: [triage, todo-register, requirements-traceability, anchor-drift, git-grep, adapter-boundary, lib-layout]

requires:
  - phase: 157.2-adapter-instancing
    provides: "the upstream deletion of `/api/auth/login` (OB-2) and the grandfathered ADAPTER_BOUNDARY_ALLOWLIST that decides the blocking follow-up's fate"
  - phase: 158-routing-auth-surface-harmonisation
    provides: "158-01's `$lib/routes/` move and 158-04's candidate-home/layout hygiene — both of which changed the tree this plan measures"
provides:
  - "`158-API-LOGIN-CALLER-MEASUREMENT.md` — the verified ABSENCE of the generic login route, four searches at zero with six non-zero positive controls taken in the same run"
  - "`158-REQUIREMENT-DISCREPANCY-REGISTER.md` — ten re-measured contradictions between the requirement text and the tree, with the intent-versus-coordinates reading rule"
  - "`158-TRIAGE-DISPOSITIONS.md` — the blocking/non-blocking classification table that gives the operator's 'implement the blocking ones' a referent, plus a disposition for all seven unbucketed comments"
  - "`158-LIB-UTILS-MOVE-PROPOSAL.md` — a sections-level proposal with stated criteria that authorises and moves nothing"
  - "Six `.planning/todos/pending/` entries, findable by anchor and by `severity:`, one of them BLOCKING"
  - "The settled enumeration: which review comments Phase 158 owns, and which belong to 157 and 159"
affects: [158-02, 158-05, 158-07, 158-12, 159, 157 (its unfiled local-adapter follow-up), any verifier tracing REVIEW-RT-01..07]

actuals:
  tokens: 23145
  tasks: 4
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Absence measurement with a same-run positive control: point the identical search shape at a live sibling; a zero whose control also reads zero is an instrument failure, not a fact"
    - "Expression anchors instead of line numbers for files with a measured drift history (hooks.server.ts, per C1(a)/OB-4)"
    - "Register entries record review-era line, HEAD line and the cause of the drift, rather than silently substituting a fresh number"

key-files:
  created:
    - .planning/phases/158-routing-auth-surface-harmonisation/158-API-LOGIN-CALLER-MEASUREMENT.md
    - .planning/phases/158-routing-auth-surface-harmonisation/158-REQUIREMENT-DISCREPANCY-REGISTER.md
    - .planning/phases/158-routing-auth-surface-harmonisation/158-TRIAGE-DISPOSITIONS.md
    - .planning/phases/158-routing-auth-surface-harmonisation/158-LIB-UTILS-MOVE-PROPOSAL.md
    - .planning/todos/pending/2026-08-28-admin-login-supabase-independence.md
    - .planning/todos/pending/2026-08-28-banner-static-component-arbitrary-header-content.md
    - .planning/todos/pending/2026-08-28-header-style-settings-refactor.md
    - .planning/todos/pending/2026-08-28-questions-layout-start-param-e2e-coverage.md
    - .planning/todos/pending/2026-08-28-preregister-election-constituency-selection-harmonisation.md
    - .planning/todos/pending/2026-08-28-hooks-supabase-handle-parameterisation.md
  modified:
    - .planning/phases/158-routing-auth-surface-harmonisation/158-DISCUSSION-LOG.md

key-decisions:
  - "The D-G5 enumeration is settled reading (ii): the star prose was right that two blocking items exist across the review set; the six-item table was wrong about which items the set contains"
  - "No new `blocking:` boolean field was added — `severity: blocking` already exists in the register and is already greppable, so research's proposed schema addition was NOT made"
  - "Requirements REVIEW-RT-01..07 were deliberately NOT marked complete, because this plan traces against them and completes none — and the register it produced flags REVIEW-RT-05 as already over-ticked"
  - "hooks.server.ts is anchored by expression only; no replacement line number was transcribed, on the fifth-drift argument"
  - "The move proposal recommends `lib/statistics/` over `lib/matching/` because of the collision with the @openvaa/matching workspace package"

patterns-established:
  - "Positive control per search shape, in the same run: the S3 control caught a real false zero (git grep -E does not honour \\b) that would otherwise have been recorded as a pass"
  - "Correction-of-a-correction discipline: when a planning document's REASON for an anchor correction goes stale, record that the reason is stale and the anchor still holds, so the next reader does not re-correct a correct correction"

requirements-completed: []

coverage:
  - id: D1
    description: "The deleted generic /api/auth/login route's absence is verified, with a positive control per search shape proving the zeros are facts about the tree rather than artefacts of the search"
    requirement: REVIEW-RT-01
    verification:
      - kind: other
        ref: "4 searches (git grep -nF/-nw/-nE) → 0 each; 6 controls against the live logout sibling → 1,10,1,1,99,2. Reproduced in 158-API-LOGIN-CALLER-MEASUREMENT.md"
        status: pass
      - kind: other
        ref: "find apps/frontend/src/routes/api/auth -type f → logout/+server.ts only; git log --diff-filter=D → 8ecfc9002"
        status: pass
    human_judgment: false
  - id: D2
    description: "Ten measured contradictions between REQUIREMENTS.md:141-147 and the tree are recorded with file-and-line evidence, without editing the requirement file"
    requirement: REVIEW-RT-02
    verification:
      - kind: other
        ref: "git status --porcelain .planning/{REQUIREMENTS,ROADMAP,STATE}.md → empty at 87660e961"
        status: pass
      - kind: manual_procedural
        ref: "Each of the ten rows re-opened in Task 1; anchors listed per row in 158-REQUIREMENT-DISCREPANCY-REGISTER.md"
        status: pass
    human_judgment: true
    rationale: "The register's value is whether a verifier reading it traces correct work correctly. That is a judgement about the document's usefulness to a human reader, which no automated check reaches."
  - id: D3
    description: "Six follow-up comments filed in the register's existing dialect, each anchor opened and confirmed, exactly one carrying the reviewer's own blocking classification"
    requirement: REVIEW-RT-05
    verification:
      - kind: other
        ref: "ls .planning/todos/pending/2026-08-28-*.md → 21 (6 new); grep -c '^severity:' per new file → 1×6; grep -c '^blocking:' → 0×6"
        status: pass
      - kind: other
        ref: "grep -rl '^severity: blocking' .planning/todos/pending/ → 2, of which exactly one is of the six (admin-login)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every one of the seven unbucketed triage comments carries a reasoned disposition, and the arithmetic sums to seven"
    requirement: REVIEW-RT-04
    verification:
      - kind: other
        ref: "grep -c 'CROSS-REFERENCE|DECLINE|DEFER|FOLD' 158-TRIAGE-DISPOSITIONS.md → 10 (≥7); Section 2 row count → exactly 7"
        status: pass
    human_judgment: false
  - id: D5
    description: "A sections-level lib/utils move proposal with criteria stated before any verdict, which moves nothing"
    requirement: REVIEW-RT-03
    verification:
      - kind: other
        ref: "git status --porcelain apps/frontend/src/lib/utils → empty; git diff --name-status HEAD~4 HEAD | grep -c 'lib/utils/' → 0; grep -cE '^\\s*(git mv|sed |[0-9]+\\. Move)' → 0"
        status: pass
      - kind: other
        ref: "6 named groupings (### 3.x); criteria at line 85, first verdict at line 121"
        status: pass
    human_judgment: true
    rationale: "Whether the proposed groupings are the RIGHT groupings is a design judgement for the operator; §3.3's name, §3.4's growth argument and §3.2's boundary are left open on purpose."

duration: 18min
completed: 2026-09-01
status: complete
---

# Phase 158 Plan 08: Record Deliverables Summary

**Five phase artifacts and six register entries, all re-measured at HEAD `3c958cccc` — including an absence measurement whose own positive control caught a false zero produced by `git grep -E` silently ignoring `\b`, and a settled enumeration that moves two review comments out of this phase's bucket and one blocking item into it.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-09-01T20:05:03Z
- **Completed:** 2026-09-01T20:23:29Z
- **Tasks:** 4
- **Files created/modified:** 11 (10 created, 1 modified)

## Accomplishments

- **The generic login route's absence is verified and non-vacuous.** Four searches at zero, six positive controls non-zero in the same run. Records that `REVIEW-RT-01`'s removal clause fired **upstream** at `8ecfc9002` (`157.2-04`), so a verifier finds the answer rather than an apparent gap.
- **Ten requirement discrepancies recorded without editing a shared file.** The plan owed six; nine of the ten are the same failure — a line number read as an identity — and the tenth is a genuine finding (§ below).
- **The D-G5 enumeration is settled on the record with the evidence reproduced**, so the resolution survives the phase instead of being re-derived by the next reader.
- **All seven unbucketed triage comments dispositioned**, 1 folded + 1 deferred + 3 declined + 2 cross-referenced = 7, each with a reason citing a file, a line or a requirement id.
- **A move proposal that moves nothing**, with three selection criteria stated before the first verdict and the `lib/matching` ↔ `@openvaa/matching` collision named rather than left to be discovered mid-migration.

## The follow-up classification table (reproduced inline per D-G5 step 2)

The operator's binding NOTES — *"Implement the blocking ones within 158/9 or so"* — requires the classification to appear in **both** the register front matter and this summary. It does.

| # | Anchor (review-era) | Owning phase | Classification | Disposition |
|--:|---|---|---|---|
| 1 | `routes/Banner.svelte:9` ✅ exact | **158** | non-blocking | FILED — `…banner-static-component-arbitrary-header-content.md` |
| 2 | `routes/Header.svelte:44` ✅ exact | **158** | non-blocking | FILED — `…header-style-settings-refactor.md`, cross-referenced to 159's `REVIEW-CMP-01` census |
| 3 | `…/questions/+layout.svelte:144` ⚠ → `:122-131` | **158** | non-blocking | FILED — `…questions-layout-start-param-e2e-coverage.md` |
| 4 | `candidate/preregister/(authenticated)/elections/+page.svelte:1` ✅ | **158** | non-blocking | FILED — `…preregister-election-constituency-selection-harmonisation.md`, cross-referenced to `perm-startfromcg.spec.ts` |
| 5 | `admin/login/+page.server.ts:27` ⚠ → `:22` | **158** | **BLOCKING** | FILED — `…admin-login-supabase-independence.md`. Source-test half discharged upstream; independence half open, owned by `158-05` |
| 6 | `hooks.server.ts:17` ⚠ expression anchor only | **158** | non-blocking | FILED — `…hooks-supabase-handle-parameterisation.md` |
| — | `lib/components/questions/QuestionChoices.svelte:1` | **159** | **BLOCKING** | CROSS-REFERENCE — 159 owns the file and the filing |
| — | real anchor `lib/server/api/dataProvider.ts:12` | **157** | non-blocking | CROSS-REFERENCE — sits in 157's bucket; corrected anchor recorded so 157 need not re-derive it |

**This plan implements ZERO of them directly**, and the reason is structural rather than an omission: the one blocking item Phase 158 owns has its source-test half already delivered as `REVIEW-ADP-06`, and its independence half scheduled into `158-05` — a plan that `158-08` **declares a dependency on** and therefore cannot both depend on and perform.

## The enumeration resolution, with its evidence

`158-CONTEXT.md` carried a six-item table and a ★ rationale that contradicted each other; `<open>` #2 offered three readings and left the choice to this deliverable. Reading the bucket verbatim settles it — **reading (ii)**, with (iii) applying to *half* the admin-login ask:

1. **The local-adapter comment is NOT in this phase's bucket.** It sits above the `## Phase 158` heading, in 157's, and `157-CONTEXT.md:56` and `:264` claim it explicitly. The CONTEXT table put an upstream comment in its sixth slot.
2. **The admin-login comment IS in this phase's bucket and DOES carry the reviewer's literal word.** *"Add as a **blocking** follow-up task a way to make this supabase independent in routes."*
3. **The local-adapter comment's cited anchor cannot exist as written.** `lib/api/dataProvider.ts:12` is a `createSupabaseAnonClient` re-export in a 78-line adapter-seam module. The content matches `lib/server/api/dataProvider.ts:12`, the `default:` arm of the adapter switch. ⚠ **And a second correction on top of the CONTEXT's:** `<open>` #3 justifies the re-anchoring by saying the file *"is one line"* — 157.2 rebuilt it, so the **correction is right and its stated reason is stale**. Recorded so nobody re-corrects a correct correction.

**So the ★ prose was right about there being two blocking items across the review set; the enumerated table was wrong about which items the set contains.**

## Register schema: no addition was made

The plan permitted a dedicated anchor field *alongside* the existing ones, recorded as a deliberate schema addition. **None was added, and none was needed.** Measured: `severity:` already carries seven values in the register including `severity: blocking` (in use at `candidate-journey-135-intermittent.md`), and **no `blocking:` boolean exists anywhere** (`grep -rl '^blocking:' .planning/todos/pending/` → 0). Provenance already lives on the `source:` line, so the review's file-and-line anchor went there. Research had proposed a boolean on the assumption that no convention existed; the measured answer is that one does.

## Task Commits

1. **Task 1: Login-route absence measurement + requirement discrepancy register** — `ab725164b` (docs)
2. **Task 2: Six register entries with anchors and severity** — `68d70c911` (docs)
3. **Task 3: Triage dispositions + discussion-log verification** — `253eb4402` (docs)
4. **Task 4: `lib/utils` sections move proposal** — `87660e961` (docs)

**Plan metadata:** see the final commit (docs: complete plan)

## Files Created/Modified

- `158-API-LOGIN-CALLER-MEASUREMENT.md` — the absence, its controls, the recorded instrument failure, and where `REVIEW-RT-01`'s removal clause actually fired
- `158-REQUIREMENT-DISCREPANCY-REGISTER.md` — ten rows, intent-versus-coordinates reading rule, four candidate corrections routed to the operator
- `158-TRIAGE-DISPOSITIONS.md` — the classification table, the seven unbucketed dispositions with arithmetic, and the three upstream 157 assumptions now resolved
- `158-LIB-UTILS-MOVE-PROPOSAL.md` — re-measured inventory, three criteria, six sections with verdicts, two special dispositions, closing fence
- `158-DISCUSSION-LOG.md` — *modified*: pointer verified against the target's headings; closes `158-CONTEXT.md` `<open>` #7
- Six `.planning/todos/pending/2026-08-28-*.md` entries

## Decisions Made

- **Reading (ii) of the D-G5 enumeration**, per the evidence above.
- **No `blocking:` boolean.** The register's existing dialect was measured and used.
- **No replacement line-number triple for `hooks.server.ts`.** The register's row states the expressions and states that the requirement's numbers are stale, per C1(a)/OB-4 — a fifth transcription would repeat the mistake the ban exists to stop.
- **`lib/statistics/` proposed over `lib/matching/`.** Two directories named `matching` at different layers of one monorepo, imported side by side in the same files, is a standing invitation to reach for the wrong one that neither the compiler nor a reviewer would flag.
- **The residue is a deliverable, not a leftover.** A proposal that empties `utils/` is wrong by construction; `text/` is the strongest argument for a directory continuing to be called `utils`.

## Deviations from Plan

### 1. [Rule 1 — Bug] A search that returned a false zero was caught by its own control and re-run

- **Found during:** Task 1
- **Issue:** S3 was first run as `git grep -nE "\bLoginParams\b|\bLoginResult\b"` and returned 0. **Its positive control, the same pattern shape over `DataApiActionResult`, also returned 0 — for a type with 99 occurrences.** Git's ERE engine does not honour `\b`, so the pattern matched nothing anywhere and the zero was an artefact of the regex.
- **Fix:** Re-ran with git's own word-boundary flag: `git grep -nw -e LoginParams -e LoginResult` → 0 (genuine); control `git grep -nw DataApiActionResult` → 99 (fires).
- **Verification:** Both recorded verbatim in the artifact's § "The instrument failure, recorded", rather than quietly corrected — `\b` in a `git grep -E` pattern will silently return a false zero for any future measurement that uses it.
- **Committed in:** `ab725164b`

### 2. [Rule 3 — Blocking] `grep -r` scope replaced with `git grep`

- **Found during:** Task 1
- **Issue:** The first search pass matched `apps/frontend/tsconfig.tsbuildinfo`, a 440 KB single-line build artifact excluded by no directory name, making the output unreadable.
- **Fix:** Switched to `git grep`, which searches tracked files only and excludes every untracked build product by construction.
- **Verification:** All searches re-run and reproducible; the scope is stated in one clause in the artifact rather than as nine `--exclude-dir` flags.
- **Committed in:** `ab725164b`

### 3. [Rule 2 — Missing Critical] `REVIEW-RT-01..07` were deliberately NOT marked complete

- **Found during:** state updates
- **Issue:** The plan's `requirements:` frontmatter lists all seven, and the standard flow would call `requirements mark-complete` on them. **This plan completes none of them** — it is a records plan that traces *against* them. `REVIEW-RT-01`'s collapse half and `REVIEW-RT-02` entirely are unbuilt at this HEAD (no `lib/cookies` exists), and the register this plan just produced flags `REVIEW-RT-05` as **already over-ticked**.
- **Fix:** `requirements-completed: []`, and no `requirements mark-complete` call. Recorded here so the omission reads as deliberate rather than forgotten.
- **Verification:** `git status --porcelain .planning/REQUIREMENTS.md` empty; the plan's own prohibition (*"The requirement, roadmap and state files are not edited by this phase"*) forbids the edit independently.
- **Committed in:** n/a — an omission, not a change

### 4. [Rule 1 — Bug] Two plan expectations were contradicted by the tree and recorded rather than followed

- **Found during:** Tasks 3 and 4
- **Issue:** (a) The plan expects `questions/[questionId]/+page.svelte:1` to cite a spike, making it the comment-sweep phase's to resolve. **Measured: it no longer does** — `0a7939aff:1` read *"(results shape / see spike 014b)"*; Phase 152's purge removed it. (b) The plan directs reading `apps/frontend/src/lib/utils/logger.ts` and proposing no home for it. **Measured: the file does not exist** — `157-17` (`6aaeaed46`) deleted it with no re-export shim.
- **Fix:** Both recorded as divergences with evidence rather than transcribed as written. The spike sub-item is marked **discharged, not pending**; the logger is listed under "not proposed" as **already resolved upstream** rather than as a pending disposition.
- **Verification:** `git grep -n "spike" -- ".../questions/"` → empty; `find apps/frontend/src -name "logger*"` → empty.
- **Committed in:** `253eb4402`, `87660e961`

---

**Total deviations:** 4 (2 Rule 1, 1 Rule 2, 1 Rule 3)
**Impact on plan:** No scope creep. Deviation 1 is the plan's own instrument-proving instruction firing for real and is the single most load-bearing correction in the plan. Deviation 3 prevents this plan from committing the exact error its own register documents.

## Issues Encountered

- **Four of the six register anchors had drifted**, by 3 to 21 lines. Each entry records the review-era line, the HEAD line and the cause (`152-14`'s 3,411-line unwrap; `157-17`'s logger migration), rather than substituting a fresh number silently. The one file with a four-drift history is anchored by expression only.
- **`158-DISCUSSION-LOG.md` already existed**, contrary to `158-CONTEXT.md` `<open>` #7. Verified rather than created: the pointer resolves, the target carries `## G. Phase 158` at `:530` and G1-G5 at `:532/549/561/575/585`. Noted that § G4's own heading cites the stale `hooks.server.ts:68`.

## Threat Flags

None — this plan modified no source file. `git status --porcelain apps/frontend/src` is empty across all four commits.

## Known Stubs

None. No source file was created or modified.

## User Setup Required

None.

## Next Phase Readiness

**Ready, and three plans have a measured input they did not have before:**

- **`158-05`** (login collapse) consumes `158-API-LOGIN-CALLER-MEASUREMENT.md` as a **verification**, not a deletion — its blocking decision checkpoint was retired when the route went upstream. It also inherits the blocking follow-up's independence half, and the measured fact that **157 grandfathered** `admin/login/+page.server.ts` at `eslint.config.mjs:50` rather than driving the allowlist to zero.
- **`158-02`** (cookie const module) should re-measure `158-RESEARCH.md` § C.1's coordinates: its *totals* (18 sites / 6 files / 4 names) are confirmed correct, but **17 of its 18 line numbers have drifted**.
- **`158-07`** owns the folded OIDC error typing; the callback carries 6 `redirect(303, …)` calls, 5 with `?error=` slugs.

**One item for the operator, informational, no gate:** `158-REQUIREMENT-DISCREPANCY-REGISTER.md` § "For the operator". Its first row is the only one that can cause harm — **`REQUIREMENTS.md:145` (`REVIEW-RT-05`) is ticked while its shared permissions utility is unbuilt and its role triple is still duplicated across two production files.** A ticked requirement stops being re-checked.

**One item that stays open by design:** the ⚠ standing warning in `158-TRIAGE-DISPOSITIONS.md` § 3 — whichever plan performs the `/api` move relocates two `ADAPTER_BOUNDARY_ALLOWLIST` paths, and a stale `files`-scoped ESLint allowlist **fails open**.

---
*Phase: 158-routing-auth-surface-harmonisation*
*Completed: 2026-09-01*

## Self-Check: PASSED

All 12 claimed files found on disk; all 4 claimed commits found in git history;
`git diff --name-only HEAD~4 HEAD` outside `.planning/` is empty, confirming no source file changed.
