---
phase: 160-agent-docs-skills-refresh
plan: 01
subsystem: docs
tags: [bash, guard-script, claude-md, skills, link-integrity]

requires:
  - phase: 152-comment-and-naming-hygiene
    provides: the planning-reference scan in `yarn lint:check` that every doc line written here must satisfy
  - phase: 156-schema-rename
    provides: the banded schema filenames the checker resolves positionally
  - phase: 157-adapter-boundary
    provides: the corrected local-adapter wording in `apps/frontend/src/lib/api/README.md` copied here
  - phase: 158-routing-and-auth
    provides: the `$lib/routes` surface and the route tree the repaired citations name
  - phase: 159-component-and-context-consolidation
    provides: the post-consolidation line numbers every anchor in this plan was re-derived against
  - phase: 163-ci-gates
    provides: the already-landed sqlfluff half of the `db:lint:sql` correction (plan 163-09)
provides:
  - "`.claude/scripts/audit-skill-links.sh` — a link/path-integrity checker over `.claude/skills/**` + `CLAUDE.md`, landed unwired"
  - "A recorded whole-corpus dangling-citation baseline (350 of 672) that later plans are measured against"
  - "`CLAUDE.md` with zero dangling path citations, asserted mechanically"
  - "The `skill-link-allow` inline-marker convention, usable in any Markdown file in the corpus"
affects: [160-02, 160-03, 160-04, 160-05, 160-06, 160-07, 160-08, 163-ci-wiring]

actuals:
  tokens: 6706
  tasks: 3
  commits: 3
plan_head_before: 051d016d329ea35e5e79ac9352be7f79baa411b1

tech-stack:
  added: []
  patterns:
    - "Guard scripts in `.claude/scripts/` imitate `audit-skill-drift.sh`'s argument/output/exit contract and carry an incident-naming docblock in the style of `scripts/assert-a11y-scan-wiring.mjs`"
    - "Citations in the agent-facing corpus are repo-relative; package-relative and alias-relative paths are not resolvable by any reader or tool"

key-files:
  created:
    - .claude/scripts/audit-skill-links.sh
  modified:
    - CLAUDE.md

key-decisions:
  - "Bare filenames are checked by basename-existence anywhere in the tracked tree, not by repo-root path — a bare `tsconfig.json` names a file KIND far more often than a location, and root-resolving it made `package.json` pass only by accident."
  - "`[` and `]` are deliberately NOT treated as glob metacharacters: in this repo a bracketed segment is almost always a SvelteKit route parameter, and exempting them would blind the guard to the frontend's most-cited paths — including the very citation this plan repaired."
  - "Package-relative citations (`src/index.ts` inside the `filters` skill) are reported as dangling rather than suffix-resolved. Suffix resolution would also silently forgive `frontend/src/lib/components/`, one of BOUNDARIES.md's five moved-under-`apps/` rows — the exact class the guard exists to catch."
  - "Fenced code blocks are excluded from token extraction: their contents are sample code and shell transcripts, not citations."
  - "The guard is landed unwired — no CI job, no package.json script. Wiring is Phase 163's recorded scope."

patterns-established:
  - "skill-link-allow: an inline `<!-- skill-link-allow: <token> -->` marker exempts exactly the token it names, for the file it appears in."
  - "Red-then-green on a real defect is the acceptance evidence for a new guard, not a synthetic fixture."

requirements-completed: [REVIEW-DOC-04]

coverage:
  - id: D1
    description: "`.claude/scripts/audit-skill-links.sh` exists, is executable, and matches its sibling's shebang / `set -euo pipefail` / banner / summary / exit-1 contract"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "test -x .claude/scripts/audit-skill-links.sh; head -1; grep -c 'set -euo pipefail'; grep -c 'audit-skill-drift.sh'; grep -c 'skill-link-allow'"
        status: pass
    human_judgment: false
  - id: D2
    description: "The checker caught one real dangling path citation in `CLAUDE.md` and confirmed its repair — red before, green after"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "bash .claude/scripts/audit-skill-links.sh <pre-repair CLAUDE.md> -> Dangling: 7, exit 1"
        status: pass
      - kind: other
        ref: "bash .claude/scripts/audit-skill-links.sh CLAUDE.md -> Dangling: 0, exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "The optional single-argument mode works for a skill directory and for a single file, and a nonexistent argument prints a not-found message and exits 1"
    verification:
      - kind: other
        ref: "bash .claude/scripts/audit-skill-links.sh __no_such_skill__ -> 'Skill or file not found', exit 1; ... filters -> per-file verdicts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Both remaining code citations in the Svelte-context section resolve, and their cited line ranges contain the text the citation claims"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "sed -n '44,45p' candidateContext.svelte.ts | grep -c 'Destructure-trap contract' -> 1; sed -n '131,134p' | grep -c 'tracking scope' -> 1; sed -n '40,41p' elections/+page.svelte | grep -c 'derived.by' -> 1"
        status: pass
    human_judgment: false
  - id: D5
    description: "The `db:lint:sql` description names only linters present in the repo, with their real flags and the live-Postgres requirement"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "awk '/Database & Stack Commands/,/^## /' CLAUDE.md | grep -ci sqlfluff -> 0; grep -c lint-schema.mjs -> 1; grep -c 'fail-on warning' -> 1"
        status: pass
    human_judgment: false
  - id: D6
    description: "The `@openvaa/app-shared` bullet describes exactly the module formats `tsup.config.ts` emits"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "sed -n '/@openvaa\\/app-shared/p' CLAUDE.md | grep -c CommonJS -> 0, grep -c ESM -> 1; measured against packages/app-shared/tsup.config.ts format: ['esm']"
        status: pass
    human_judgment: false
  - id: D7
    description: "The whole-corpus baseline is recorded as a concrete number and per-file table for Plan 08 to measure against"
    verification:
      - kind: other
        ref: "bash .claude/scripts/audit-skill-links.sh -> Checked: 678  Dangling: 350  Skipped: 191, exit 1"
        status: pass
    human_judgment: false
  - id: D8
    description: "The corpus-wide judgement that the residual 350 dangling citations are the package-relative habit rather than guard defects, and that this is the right baseline to carry into Plan 08"
    verification: []
    human_judgment: true
    rationale: "The classification of each residual citation as 'package-relative, resolvable by a human who knows the skill's package' versus 'genuinely broken' is a reading judgement the guard cannot make. The counts are mechanical; the interpretation is not."

duration: 14 min
completed: 2026-09-13
status: complete
---

# Phase 160 Plan 01: Link-Integrity Checker + CLAUDE.md Repairs Summary

**A 297-line `audit-skill-links.sh` that asserts every backticked repo-relative path citation in the agent-docs corpus resolves — landed unwired, proven red-then-green on 7 real dangling citations in `CLAUDE.md`, and leaving a recorded corpus baseline of 350 dangling of 672.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-09-13T16:34:32Z
- **Completed:** 2026-09-13T16:48:14Z
- **Tasks:** 3
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- **The tracer works end to end.** A guard script was written, run against the corpus, caught a real defect, the defect was fixed, and the guard confirmed the fix — on the first slice, before any expansion work.
- **`CLAUDE.md` is mechanically clean.** 58 path citations, 0 dangling, 22 deliberately skipped. It was 7 dangling before.
- **Seven real dangling citations repaired**, not the one the plan predicted. The plan named the results-layout path; the checker found six more of the same class.
- **Three stale factual claims corrected** against their measured source chains: the `db:lint:sql` linter description, the `@openvaa/app-shared` module-format claim, and the client-side-local-adapter claim.
- **A corpus baseline is on record** — per file, with a class breakdown — so Plan 08 measures a delta rather than re-deriving one.

## Task Commits

1. **Task 1: End-to-end link-integrity audit — one dangling path, caught and fixed** — `4019c0658` (feat)
2. **Task 2: Repair the drifted in-tree-explanation citation** — `5af33664e` (fix)
3. **Task 3: Correct the confirmed stale factual claims** — `385fa0333` (docs)

## Red-then-green evidence (Task 1)

Both runs use the shipped checker. The red run is reproduced against the pre-repair
`CLAUDE.md` (`git show 051d016d3:CLAUDE.md`), so the instrument is identical across both.

**RED — before the repair:**

```
Skill Link Audit
================

  …/CLAUDE.pre.md                               DANGLING  7 of 51 citations
    apps/frontend/src/lib/voter  (no such file: apps/frontend/src/lib/voter)
    apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte:61-79  (no such file: apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte)
    apps/supabase/functions/  (no such file: apps/supabase/functions/)
    apps/supabase/migrations/  (no such file: apps/supabase/migrations/)
    apps/supabase/seed.sql  (no such file: apps/supabase/seed.sql)
    apps/supabase/tests/  (no such file: apps/supabase/tests/)
    src/index.ts  (no such file: src/index.ts)

---
Checked: 51  Dangling: 7  Skipped: 22

Dangling citations point agents at files that do not exist.
Correct the path, or exempt a deliberately hypothetical one with an
inline <!-- skill-link-allow: <token> --> marker naming that token.
EXIT=1
```

**GREEN — at the end of the plan:**

```
Skill Link Audit
================

  CLAUDE.md                                     OK        (58 citations, 22 skipped)

---
Checked: 58  Dangling: 0  Skipped: 22
EXIT=0
```

(The citation count rose from 51 to 58 across the plan: Task 2 added a second
`candidateContext.svelte.ts` citation and Task 3 added four adapter-path citations.)

## Whole-corpus BASELINE — the number Plan 08 measures against

`bash .claude/scripts/audit-skill-links.sh` (no argument, whole corpus) at the end of this plan:

```
Checked: 678  Dangling: 350  Skipped: 191
EXIT=1
```

Exit 1 is **expected** and is recorded by the plan as such. Per-file verdicts:

| File | Verdict | Dangling / checked |
|---|---|---:|
| `architect/SKILL.md` | OK | 0 / 0 |
| `BOUNDARIES.md` | DANGLING | 5 / 13 |
| `components/SKILL.md` | OK | 0 / 0 |
| `data/extension-patterns.md` | DANGLING | 16 / 26 |
| `data/object-model.md` | DANGLING | 10 / 11 |
| `data/SKILL.md` | DANGLING | 7 / 30 |
| `database/extension-patterns.md` | DANGLING | 12 / 17 |
| `database/rls-policy-map.md` | OK | 0 / 6 |
| `database/schema-reference.md` | OK | 0 / 2 |
| `database/SKILL.md` | DANGLING | 13 / 57 |
| `filters/extension-patterns.md` | DANGLING | 13 / 21 |
| `filters/SKILL.md` | DANGLING | 8 / 23 |
| `matching/algorithm-reference.md` | DANGLING | 22 / 23 |
| `matching/extension-patterns.md` | DANGLING | 7 / 11 |
| `matching/SKILL.md` | DANGLING | 11 / 35 |
| `ship-review-stack/SKILL.md` | DANGLING | 7 / 32 |
| `spike-findings-…/SKILL.md` | DANGLING | 19 / 38 |
| `spike-findings-…/references/` (8 files) | DANGLING | 90 / 119 |
| `spike-findings-…/sources/` (16 files) | DANGLING | 110 / 153 |
| `CLAUDE.md` | OK | 0 / 58 |

Per-skill totals:

| Skill | Dangling |
|---|---:|
| `spike-findings-voting-advice-application-gsd` | 219 |
| `matching` | 40 |
| `data` | 33 |
| `database` | 25 |
| `filters` | 21 |
| `ship-review-stack` | 7 |
| `BOUNDARIES.md` (corpus root) | 5 |
| `CLAUDE.md` | 0 |

**Composition of the 350 — read this before treating it as 350 broken links.** The
dominant class is **package-relative citation**: a domain skill cites paths relative to the
package it documents (`data/object-model.md` citing `root/dataRoot.ts`, meaning
`packages/data/src/root/dataRoot.ts`; `filters/SKILL.md` citing `src/index.ts`, meaning
`packages/filters/src/index.ts`). These resolve for a human who knows the skill's package
and for nobody else. The guard reports them deliberately — see the decision above on why
suffix-resolving them was rejected.

Two smaller classes make up the rest: irreducible shape noise (a date `10/5/2023`, a branch
name `integration/ship-12-squash`, placeholder examples `foo.ts`), for which the
`skill-link-allow` marker is the intended answer; and genuinely dangling paths, of which
BOUNDARIES.md's 5 moved-under-`apps/` directory rows are the confirmed instance.

**219 of the 350 (63%) sit in `spike-findings-voting-advice-application-gsd`** — the skill
Plan 07 holds a delete decision on. If that decision is DELETE, the baseline drops to 131
without a single citation being repaired. Plan 08 must account for that before reading any
improvement into a falling number.

## Files Created/Modified

- `.claude/scripts/audit-skill-links.sh` (new, 297 lines) — the checker. Four checks
  (existence; one-sided line-range overrun; bare filenames, with schema names resolved
  positionally under `apps/supabase/supabase/schema/` and others by basename; shape-based
  exemptions), one `skill-link-allow` escape hatch, and an incident-naming docblock.
- `CLAUDE.md` — 13 lines changed across three tasks (7 citation repairs, 2 anchor repairs,
  3 factual corrections, 1 alias-table addition).

## Decisions Made

See `key-decisions` in the frontmatter. The load-bearing one is the third: refusing to
suffix-resolve package-relative citations keeps a 350-line baseline instead of a ~40-line
one, and that is the right trade — the forgiving version would have silently passed
`frontend/src/lib/components/`, one of the five rows the guard was commissioned to catch.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Six more dangling citations in `CLAUDE.md` than the plan predicted**

- **Found during:** Task 1
- **Issue:** The plan named one dangling citation (the results `+layout.svelte` path). The
  checker's first run found seven. Task 1's own acceptance criterion requires
  `Dangling: 0` for `CLAUDE.md`, so repairing only the named one could not clear the gate.
- **Fix:** Repaired all seven — four `apps/supabase/{migrations,functions,tests}/` and
  `apps/supabase/seed.sql` paths missing their nested `supabase/` segment (the correct
  form was already used twice elsewhere in the same file); the `$voter` alias row, whose
  target directory does not exist and which no source file imports (rewritten to say so,
  and `$layouts` — a real Phase-159 alias absent from the table — added); and a generic
  `src/index.ts` in the canonical-package paragraph, made concrete as
  `packages/core/src/index.ts`.
- **Files modified:** `CLAUDE.md`
- **Verification:** `bash .claude/scripts/audit-skill-links.sh CLAUDE.md` → `Dangling: 0`
- **Committed in:** `4019c0658`

**2. [Rule 1 - Bug] The guard's own docblock asserted a defect inventory that was no longer true**

- **Found during:** Task 1
- **Issue:** The plan specifies the docblock cite "15 distinct schema filenames that no
  longer exist, cited in 51 places" and "6 package-script references". Re-measured at
  execution: the `0NN-` schema class **has already been repaired** — the `database` skill
  now cites the banded names (`102-entities.sql`, `200-indexes.sql`) and all 25 schema
  files exist; only `000-enums.sql` and `010-utility-functions.sql` are still cited bare,
  and both exist. The package-script class is not in this corpus at all (it lives in
  `apps/docs/package.json`), so the guard does not catch it and claiming it would be false.
  Shipping either claim would put a stale assertion inside the guard built to prevent them.
- **Fix:** Rewrote the docblock's incident block: the four classes are attributed to Phase
  160's research at HEAD `db220cb5f`, followed by an explicit re-measurement at landing
  time recording which had since been repaired and which were still live. The
  package-script bullet was removed. The drifted-line-range class is now described
  accurately as real but **not** detectable by this guard (check 2 is one-sided, and the
  cited file is long enough that the stale range still lands inside it).
- **Files modified:** `.claude/scripts/audit-skill-links.sh`
- **Verification:** `ls apps/supabase/supabase/schema/` (25 banded files);
  `grep -rhoE '`0[0-9]{2}-[a-z0-9-]+\.sql`' .claude/skills/database/` → only
  `000-enums.sql` (×2) and `010-utility-functions.sql` (×2), both present on disk
- **Committed in:** `4019c0658`

**3. [Rule 2 - Missing Critical] The extraction rule as specified produced a false-positive class that would have made the baseline meaningless**

- **Found during:** Task 1
- **Issue:** The plan's extraction rule keeps any token with "a filename extension of two to
  five lowercase characters", resolved against the repo root. Applied literally, that flags
  every generic file-KIND reference in the corpus (`tsconfig.json`, `tsup.config.ts`,
  `seed.sql`) as dangling, while `package.json` passes only because a root one happens to
  exist — an inconsistency that would have put noise into the baseline Plan 08 measures.
- **Fix:** Bare filenames (no `/`) are resolved by basename against `git ls-files` rather
  than against the repo root, except the `NNN-*.sql` schema case, which stays positional.
  Four further shape exemptions were added for tokens that are path-shaped but not
  repo-relative citations: absolute paths and server routes (`/@fs`), build aliases and
  runes (`$lib/…`, `$derived.by`), import specifiers (`./x`, `../x`), quoted code literals
  (`'./filter'`), bare extensions (`.js`), and `<placeholder>` segments. Each is documented
  in the docblock with its reason. Conversely, `[`/`]` were **removed** from the glob
  metacharacter set, because SvelteKit route parameters would otherwise have exempted the
  very path this plan repaired.
- **Files modified:** `.claude/scripts/audit-skill-links.sh`
- **Verification:** Smoke fixture exercising every declared `<behavior>` (range overrun,
  npm scope, glob, URL, rune, alias, bare extension, version string, gone-schema name,
  allow-marker, real bracketed route path) → `Checked: 4  Dangling: 1  Skipped: 7`, with
  the one dangling being the gone-schema name and the allow-marked token skipped
- **Committed in:** `4019c0658`

**4. [Rule 2 - Missing Critical] Per-file verdict lines were labelled by basename**

- **Found during:** Task 1 (whole-corpus run)
- **Issue:** A whole-corpus run prints 9 rows called `SKILL.md` and 16 called `README.md`,
  making the baseline table unreadable and unusable as a per-file record.
- **Fix:** Label by path with the `.claude/skills/` prefix stripped.
- **Files modified:** `.claude/scripts/audit-skill-links.sh`
- **Verification:** the per-file table above
- **Committed in:** `4019c0658`

**5. [Rule 2 - Missing Critical] The third stale claim in the todo (`CLAUDE.md:191`, the local adapter) was left unowned**

- **Found during:** Task 3
- **Issue:** Task 3's action names two claims. Claim 1 (sqlfluff) had already been
  corrected by Phase 163 at plan 163-09, so only one of the two remained — while the todo
  read in `<read_first>` states explicitly that **claims 2 and 3 remain open for Phase
  160**. Claim 3 was measured false: `apps/frontend/src/lib/api/adapters/` holds only
  `apiRoute` and `supabase`, and `apps/frontend/src/lib/api/dataProvider.ts` reaches
  unconditionally for the Supabase one — there is no client-side local adapter — while a
  local adapter **does** exist server-side under `lib/server/api/adapters/local/`, selected
  by `staticSettings.dataAdapter.type` in `lib/server/api/dataProvider.ts`.
- **Fix:** Corrected the data-flow bullet and the key-directories row, following the
  wording Phase 157 already landed in `apps/frontend/src/lib/api/README.md:10` as the todo
  instructs.
- **Files modified:** `CLAUDE.md`
- **Verification:** `ls apps/frontend/src/lib/api/adapters/` → `apiRoute supabase`;
  `ls apps/frontend/src/lib/server/api/adapters/` → `local`;
  `sed -n '1,18p' apps/frontend/src/lib/server/api/dataProvider.ts` → the `switch (type)`
  on `staticSettings.dataAdapter`
- **Committed in:** `385fa0333`

**6. [Rule 1 - Bug] The `db:lint:sql` line was missing the flags and the Postgres requirement its own acceptance criterion demands**

- **Found during:** Task 3
- **Issue:** Phase 163 had already removed `sqlfluff`, but the remaining text named neither
  `--schema public --fail-on warning` nor the full path to `lint-schema.mjs`, and stated
  the Postgres requirement without saying what connects or to where. Task 3's criteria
  require `fail-on warning` to be present.
- **Fix:** The comment now names the exact invocation, the full script path, and the
  `DATABASE_URL` default (`127.0.0.1:54322`) both halves connect to.
- **Files modified:** `CLAUDE.md`
- **Verification:** `awk '/Database & Stack Commands/,/^## /' CLAUDE.md` → `sqlfluff` 0,
  `lint-schema.mjs` 1, `fail-on warning` 1
- **Committed in:** `385fa0333`

---

**Total deviations:** 6 auto-fixed (2 × Rule 1 bug, 3 × Rule 2 missing-critical, 1 × Rule 1
in the guard's own prose).
**Impact on plan:** All six were necessary for correctness. Two (2 and 3) changed the
shipped artifact's behaviour relative to the plan's literal specification and are the ones
to read closely; both are documented in the script's own docblock. No scope creep: every
edit landed in a file already named in `files_modified`.

## Issues Encountered

- **The plan's `yarn`-command audit one-liner reports three false positives.** Its
  `grep -oE '^yarn [a-z0-9:_-]+'` captures `yarn install`, `yarn workspace` and
  `yarn playwright`, which are yarn built-ins and binaries, not `package.json` scripts.
  Every actual `yarn <script>` cited in `CLAUDE.md` resolves. Research's finding of
  "25 distinct commands cited, 0 missing" still holds after Phases 152–159.
- **A vestigial alias was found but not fixed.** `apps/frontend/svelte.config.js:13`
  declares `$voter` → `./src/lib/voter`, a directory that does not exist; nothing imports
  the alias (0 hits under `apps/frontend/src`). Fixing `svelte.config.js` is outside this
  plan's `files_modified`; `CLAUDE.md` now records the fact instead. Worth a todo in
  Plan 04.

## Verification

| Check | Result |
|---|---|
| `bash .claude/scripts/audit-skill-links.sh CLAUDE.md` | `Dangling: 0`, **exit 0** |
| `bash .claude/scripts/audit-skill-links.sh` (whole corpus) | `Checked: 678  Dangling: 350  Skipped: 191`, exit 1 — **expected**, recorded as the baseline |
| `yarn lint:check` | **exit 0** (23/23 tasks, all 11 in-tree guards at 0 violations, including the Phase 152 comment-hygiene scan) |
| `npx prettier --check CLAUDE.md` | clean |
| Every Task 1–3 acceptance criterion | PASS (run individually; outputs above) |

**Not run: the E2E suite.** This plan changed two files — `CLAUDE.md` and a new standalone
shell script with no callers. `git diff 051d016d3..HEAD --stat` confirms no application,
test or config source was touched, so no E2E outcome can differ. The phase's suite gate is
Plan 08's, and this is recorded rather than silently skipped.

**Not claimed: CI verification.** `.github/workflows/main.yaml` carries
`paths-ignore: "**.md"`, so an all-Markdown change does not trigger it. A green
`audit-skill-drift.sh` is likewise not evidence here — this plan's commits reset its
per-skill baseline. The evidence for this plan is the local runs tabulated above.

## Known Stubs

None. The checker is complete and exercised against the whole corpus; it is deliberately
unwired from CI (Phase 163's scope, recorded in Plan 04), which is a scope boundary rather
than a stub.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change. T-160-07's
assertion holds: `grep -c 'PUBLIC_SUPABASE_[A-Z_]*=' CLAUDE.md` → 0; no env value was added.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 08 has its baseline**: 350 dangling of 672 checked, per file and per skill, with
  the composition analysed. Re-run `bash .claude/scripts/audit-skill-links.sh` and diff
  against the table above — but subtract the `spike-findings` skill's 219 first if Plan 07
  decides DELETE, or the delta will read as an improvement that nobody made.
- **Plans 02–07 have a mechanical check** for every path citation they write. Run
  `bash .claude/scripts/audit-skill-links.sh <skill>` before committing. Note that
  package-relative paths will be reported dangling — write repo-relative citations.
- **Plan 05's relocation targets are re-derived and correct** as of this commit:
  `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:63-70`,
  `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:44-45` and `:131-134`,
  `apps/frontend/src/routes/(voters)/elections/+page.svelte:40-41`. Carry these, not the
  planning-time numbers.
- **Plan 04 inherits two todo candidates**: the vestigial `$voter` alias in
  `svelte.config.js`, and the corpus-wide package-relative-citation habit (350 citations)
  which no REVIEW-DOC id owns.
- **No blockers.** `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` and
  `.planning/STATE.md` are unmodified by this plan, per CONTEXT.md § 0.1(c).

---

_Phase: 160-agent-docs-skills-refresh_
_Completed: 2026-09-13_

## Self-Check: PASSED

- `key-files.created` present on disk: `.claude/scripts/audit-skill-links.sh` FOUND.
- `key-files.modified` present on disk: `CLAUDE.md` FOUND.
- All four commits resolve in `git log --oneline --all`: `4019c0658`, `5af33664e`,
  `385fa0333`, `36ae9450b`.
- Prohibition honoured: `git diff --name-only 051d016d3..HEAD` matches no
  `ROADMAP` / `REQUIREMENTS` / `STATE` path.
