---
phase: 160-agent-docs-skills-refresh
plan: 02
subsystem: docs
tags: [skills, data-model, constituency, nomination, link-integrity]

requires:
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 01's `.claude/scripts/audit-skill-links.sh`, which audited every path citation this plan wrote and the ten it inherited"
  - phase: 156-schema-rename
    provides: the post-rename `Organization` / `OrganizationNomination` naming the party-list addition uses
  - phase: 152-comment-and-naming-hygiene
    provides: the planning-reference scan in `yarn lint:check` that every line written here satisfies
provides:
  - "`.claude/skills/data/object-model.md` § Key Relationships states the one-constituency-per-election and non-contradiction selection rules, attributed to the product owner's review and explicitly not model-enforced"
  - "The same section states the child-implies-parent selection consequence of `parentConstituency` nesting"
  - "The same section names the party-list pattern as an `OrganizationNomination` with `CandidateNomination` children"
  - "A measured answer to RESEARCH assumption A2: no enforcement exists, but three named helpers (`impliedBy`, `getImpliedConstituency`, `getCombinedElections`) and one read-site guard (`getApplicableConstituency`) do"
  - "`data/object-model.md` at 0 dangling citations (was 10 of 11) — a −10 delta against Plan 01's corpus baseline of 350"
affects: [160-03, 160-04, 160-08]

actuals:
  tokens: 1878
  tasks: 2
  commits: 2
plan_head_before: 103b51d4913ccc6d5ec2c06f6da376052e8634ff

tech-stack:
  added: []
  patterns:
    - "A skill fact that cannot be read off a source file carries its provenance inline (who asserted it) and an explicit non-enforcement note, instead of the file's `Source: <path>` line, which asserts the opposite"
    - "Package-relative citations inside a domain skill are rewritten repo-relative, because no reader or tool resolves them"

key-files:
  created: []
  modified:
    - .claude/skills/data/object-model.md

key-decisions:
  - "Both new constituency bullets carry an inline `-- selection semantics, not a model invariant` qualifier rather than a `Source:` path, per the plan's prohibition; the code that exists is described in a note after the list as machinery a selector uses, never as enforcement."
  - "RESEARCH assumption A2 was re-measured and is PARTLY WRONG: no code enforces either rule, but `ConstituencyGroup.impliedBy()`, `ConstituencyGroup.getImpliedConstituency()` and `DataRoot.getCombinedElections()` implement the implication machinery, and `Election.getApplicableConstituency()` throws on an ambiguous selection. Suppressing that finding to keep the plan's premise intact would have been the same defect the phase exists to close, so it is recorded in the skill — as capability, not assurance."
  - "The ten inherited dangling citations were repaired inside this plan rather than deferred, because Task 1's own acceptance criterion demands `audit-skill-links.sh` exit 0 for this file."
  - "Class names in the new bullets are left unbackticked, matching the dominant register of the list's existing bullets; method names in the trailing note are backticked, matching the `entity.getAnswer(question)` bullet."

patterns-established:
  - "Provenance-qualified bullet: `- **<Rule> -- selection semantics, not a model invariant:** <consequence>` — the register for a product rule living in a code-derived reference."
  - "The enforcement question is answered explicitly (what enforces it; what merely supports it; what guards it at one call site) rather than left to the reader's inference."

requirements-completed: [REVIEW-DOC-01]

coverage:
  - id: D1
    description: "§ Key Relationships states that the voter selects one constituency per election, and that selections colliding through a shared constituency group or through nesting cannot be contradictory"
    requirement: REVIEW-DOC-01
    verification:
      - kind: other
        ref: "grep -ci 'one constituency per election' .claude/skills/data/object-model.md -> 1; grep -ni 'contradict' -> line 135, which also names 'share a constituency group' and 'nested'"
        status: pass
    human_judgment: false
  - id: D2
    description: "§ Key Relationships states that selecting a child constituency implies its parent, so only the child need be selected"
    requirement: REVIEW-DOC-01
    verification:
      - kind: other
        ref: "grep -niE 'imply|implied|implies' -> line 137, which also names `parentConstituency` and 'the parent'"
        status: pass
    human_judgment: false
  - id: D3
    description: "§ Key Relationships names the party list as the common case of an `OrganizationNomination` carrying `CandidateNomination` children"
    requirement: REVIEW-DOC-01
    verification:
      - kind: other
        ref: "grep -ci 'party list' -> 1; the matching line (141) contains both `OrganizationNomination` and `CandidateNomination`"
        status: pass
    human_judgment: false
  - id: D4
    description: "Neither selection rule is presented as model-enforced: no `Source:` path is attached to them, and the trailing note states non-enforcement explicitly"
    requirement: REVIEW-DOC-01
    verification:
      - kind: other
        ref: "sed -n '/^## Key Relationships/,/^## Factory Functions/p' | grep -c '^Source:' -> 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every backticked path citation in the file resolves, and every class name in § Key Relationships resolves to a declaration in `packages/data/src`"
    requirement: REVIEW-DOC-01
    verification:
      - kind: other
        ref: "bash .claude/scripts/audit-skill-links.sh .claude/skills/data/object-model.md -> Checked: 12  Dangling: 0, exit 0"
        status: pass
      - kind: other
        ref: "class-token loop over the region: 0 ABSENT among the 23 class-shaped tokens; every `*Nomination` token resolves"
        status: pass
    human_judgment: false
  - id: D6
    description: "The wording of the two selection rules faithfully expresses the product owner's intent, and the described code machinery is not read by a future agent as an enforcement guarantee"
    verification: []
    human_judgment: true
    rationale: "Whether a reader takes 'the model enforces neither; here is what it does supply' as a clear non-guarantee is a reading judgement no grep can make. The product owner is also the only authority on whether the restated rule matches the product rule he asserted."

duration: 21 min
completed: 2026-09-13
status: complete
---

# Phase 160 Plan 02: Object-Model Relationship Additions Summary

**Three reviewer-requested relationship facts added to `data/object-model.md` in its own bullet register — the two constituency-selection rules carried as product-owner-attributed semantics with an explicit non-enforcement note naming the four helpers that actually exist, and the file taken from 10 dangling citations to 0.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-09-13T16:39:02Z
- **Completed:** 2026-09-13T17:00:15Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- **All three reviewer additions landed**, each immediately after the bullet it extends, so the list's top-down order (election-to-constituency, then nesting, then nomination shapes) is unchanged.
- **The enforcement question was re-measured, not inherited.** RESEARCH assumption A2 said no enforcing code exists. That is right about *enforcement* and wrong about *support*: four named symbols in `@openvaa/data` bear directly on these rules. The skill now says both halves.
- **The file is mechanically clean.** `audit-skill-links.sh` went from `Dangling: 10 of 11` to `Checked: 12  Dangling: 0`, exit 0.
- **The whole 12-bullet listing was re-checked** against `packages/data/src` with a per-bullet disposition (below), which is criterion 2's reflexive self-check applied to this plan's own change.

## Task Commits

1. **Task 1: State the constituency selection semantics in the relationship map** — `5317362a1` (docs)
2. **Task 2: Name the party-list pattern, and re-check the whole relationship listing** — `92d6b5c2e` (docs)

## The enforcing-code search in `packages/data/src` — result

The plan instructed a task-time re-check of RESEARCH assumption A2 ("no enforcing code found; write the rules as selection semantics"), and to cite enforcing code if any turned up. **A2 holds on enforcement and is incomplete on support.** Nothing in `@openvaa/data` rejects a contradictory pair of constituency selections; there is no validation at data provision and no invariant on `Constituency`, `ConstituencyGroup` or `Election`. But four symbols exist that a constituency selector uses to honour the rules:

| Symbol | Location | What it actually does | Bearing on the rules |
|---|---|---|---|
| `Election.getApplicableConstituency()` | `packages/data/src/objects/election/election.ts:154-163` | Filters a passed constituency array to those in the election's groups; **throws `DataTypeError`** when more than one matches | The nearest thing to enforcement of one-per-election — but it is a **read-site guard** on an already-made selection, not an invariant |
| `ConstituencyGroup.impliedBy()` | `packages/data/src/objects/constituency/constituencyGroup.ts:41-61` | True when every constituency in this group is a member or parent of one in the other group, and vice versa | The collision case: two groups that imply one another are one choice |
| `ConstituencyGroup.getImpliedConstituency()` | `packages/data/src/objects/constituency/constituencyGroup.ts:68-80` | Walks a constituency's parent lineage and returns this group's member on it | Child-implies-parent, implemented |
| `DataRoot.getCombinedElections()` | `packages/data/src/root/dataRoot.ts:547-587` | Collapses single-group elections whose groups imply one another into `CombinedElections`; its own docstring says this is "so that they need not pick `Constituency`s for each `Election`" | The mechanism by which contradictions are avoided — by asking once, not by rejecting a second answer |

**How this is written into the skill.** The two bullets carry `-- selection semantics, not a model invariant` in their bolded prefix; a note after the list attributes them to the product owner's PR #874 review, states that `@openvaa/data` enforces neither, and then names the four symbols as what a selector is given to work with. No `Source:` line is attached to either rule — that shape means "read off this file" everywhere else in this document, and asserting it here would be the false assurance the plan's T-160-04 prohibits.

**On the reviewer's hedge.** All three source comments are phrased "Perhaps add …". The roadmap converts them to mandatory criteria (`ROADMAP.md` § Phase 160, criterion 1) and the roadmap wording is binding; the hedge is noise. Stated here rather than in the skill, per the plan's "near the additions or in the plan summary".

## Listing re-check record — all 12 § Key Relationships bullets

Every bullet was read against `packages/data/src` at execution time. Disposition per bullet:

| # | Bullet | Evidence | Disposition |
|---|---|---|---|
| 1 | `Election -> ConstituencyGroup(s) -> Constituency(ies)` | `election.ts:67` `get constituencyGroups()`; `constituencyGroup.ts:20` `get constituencies()` | checked |
| 2 | One constituency per election (new) | see the enforcing-code table above | added, checked |
| 3 | `Constituency -> parentConstituency` | `constituency.ts:20` `get parentConstituency(): Constituency \| null` | checked |
| 4 | Child implies parent (new) | `constituencyGroup.ts:68` `getImpliedConstituency()` | added, checked |
| 5 | `Nomination links Entity + Election + Constituency` | `nomination.ts:86/93/114` — `constituency`, `election`, `entity` getters; class docstring says the same | checked |
| 6 | `CandidateNomination -> Candidate` | `candidateNomination.ts:13` extends `Nomination<Candidate…>`; base `entity` getter is typed to it | checked |
| 7 | `OrganizationNomination -> Organization` | `organizationNomination.ts:15` "A nomination for an `Organization`, most often a party"; `:84` `candidateNominations`, `:91` `factionNominations` | **corrected** — "Links to the party/association" became "Links to the nominated Organization, most often a party", the post-156 name and the docstring's own gloss |
| 8 | Party list (new) | `candidateNomination.ts:10` and `organizationNomination.ts:15` both use the phrase "party list"; `:33` `get list()`, `:84` `get candidateNominations()` | added, checked |
| 9 | `AllianceNomination -> Alliance` | `allianceNomination.ts:77` `get lists()`, `:84` `get organizationNominations()` | checked |
| 10 | `FactionNomination -> Faction` | `factionNomination.ts:72` `candidateNominations`; `:79` `get list(): OrganizationNomination` (non-nullable — the "must be part of" claim) | checked |
| 11 | `Question -> QuestionCategory` | `question.ts:62-63` `get category()` resolving a single `data.categoryId` — hence "exactly one" | checked |
| 12 | `Entity has Answers` | `entity.ts:33` `get answers(): Answers`; `:96` `getAnswer(question)`; `answer.type.ts:17` `Answers = Record<Id, Answer \| null \| undefined>` | checked |

Plus a mechanical sweep of the region: 23 class-shaped tokens extracted, every one resolving to a `class`/`interface`/`type`/`const` declaration under `packages/data/src` (the only non-resolving tokens were English words from the headings — `Factory`, `Functions`, `Links`, `Relationships`).

**The drift guard is deliberately not cited as evidence here.** `audit-skill-drift.sh` goes green mechanically for a phase that commits inside the `data` skill directory, because this plan's own commits reset that skill's baseline. The table above is the evidence.

## Link-audit numbers for this file — before and after

| Run | Result |
|---|---|
| Before (inherited from Plan 01's baseline) | `Checked: 11  Dangling: 10`, exit 1 |
| After | `Checked: 12  Dangling: 0  Skipped: 2`, exit 0 |

The ten were nine package-relative citations (`root/dataRoot.ts`, `core/objectTypes.ts`, the four `objects/**` ones, `utils/parseFullVaaData.ts`) made repo-relative under `packages/data/src/`, and one non-path token, `data.type` — a property expression the checker reads as a bare filename with a `.type` extension — exempted with an inline `<!-- skill-link-allow: data.type -->` marker, which is exactly the escape hatch Plan 01 shipped for this shape.

**Against Plan 01's corpus baseline of 350 dangling / 672:** this plan removes 10, all from the `data` skill (which was 33). Citation *count* rose 11 -> 12 because the new trailing note cites three source files; all three resolve.

## Files Created/Modified

- `.claude/skills/data/object-model.md` — 3 bullets added, 1 bullet corrected, 1 explanatory note added after § Key Relationships, 10 citations repaired, 1 allow-marker added. 18 insertions, 11 deletions.

## Decisions Made

See `key-decisions` in the frontmatter. The load-bearing one is the second: the plan's own premise (A2, "no enforcing code") was measured and found half-wrong, and the resolution was to write BOTH facts — no enforcement, but named machinery — rather than either suppress the finding or upgrade it into the `Source:`-shaped assurance the plan forbids.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Ten inherited dangling citations blocked Task 1's own acceptance gate**

- **Found during:** Task 1
- **Issue:** Task 1 requires `audit-skill-links.sh .claude/skills/data/object-model.md` to exit 0, and the plan's must_have requires every backticked path citation in the file to resolve. The file arrived at `Dangling: 10 of 11` — the package-relative habit Plan 01's baseline describes. Nothing this plan wrote could clear that gate without repairing them.
- **Fix:** Nine citations re-anchored at the repo root (`packages/data/src/<path>`), each target confirmed present on disk; `data.type` exempted with the `skill-link-allow` marker rather than rewritten, because it is a property expression, not a path.
- **Files modified:** `.claude/skills/data/object-model.md`
- **Verification:** `bash .claude/scripts/audit-skill-links.sh .claude/skills/data/object-model.md` -> `Checked: 12  Dangling: 0`, exit 0
- **Committed in:** `5317362a1`

**2. [Rule 1 - Bug] RESEARCH assumption A2 is half-wrong, and the plan's premise inherited the error**

- **Found during:** Task 1 (the plan's own instruction to re-check for enforcing code at execution time)
- **Issue:** A2, and the `must_haves.truths` clause built on it, state that "no enforcing code exists in `@openvaa/data`". Four symbols bearing directly on these rules do exist (table above). Writing only "not enforced" would have been true but would have withheld from the reader the very machinery an implementer needs; writing "enforced" would have been false.
- **Fix:** Both facts stated. The bullets carry the non-invariant qualifier; the trailing note names the machinery as what a selector is *given*, and calls `getApplicableConstituency()` what it is — a read-site check. No `Source:` line was added, so the plan's prohibition and its region-scoped negative grep both hold.
- **Files modified:** `.claude/skills/data/object-model.md`
- **Verification:** region `grep -c '^Source:'` -> 0; `grep -ci 'one constituency per election'` -> 1; each cited path resolves under the link auditor
- **Committed in:** `5317362a1`

**3. [Rule 1 - Bug] Two acceptance criteria specify an `awk` range that collapses to a single line**

- **Found during:** Task 1 (running the criteria)
- **Issue:** The criteria extract the region with `awk '/## Key Relationships/,/^## /'`. In awk a range expression tests the end pattern on the same record when the start pattern matched it, and `## Key Relationships` matches `^## ` — so the range is the heading line alone. Both criteria therefore return 0 regardless of the file's content: the `Source:` criterion passes vacuously, and the bullet-count criterion (`previous + 2`, i.e. 11) is unsatisfiable.
- **Fix:** The criteria were evaluated against the region they plainly intend, extracted with `sed -n '/^## Key Relationships/,/^## Factory Functions/p'`. Both then pass on their merits: `^Source:` count 0; bullet count 9 before (measured on `git show HEAD:<file>`) and 11 after Task 1 — exactly +2. No file content was changed to accommodate the defective idiom.
- **Files modified:** none (a verification-instrument correction)
- **Verification:** the awk form returns 1 line and is shown to be degenerate; the sed form returns the 12-bullet region used throughout this summary
- **Committed in:** n/a — recorded here

**4. [Rule 1 - Bug] The `OrganizationNomination` bullet's gloss predated the Phase 156 rename**

- **Found during:** Task 2
- **Issue:** "Links to the party/association" names neither the class nor the docstring's wording, and "party" as the primary noun is the pre-156 vocabulary the plan flags as a correction candidate.
- **Fix:** "Links to the nominated Organization, most often a party" — the class name first, the gloss second, matching `organizationNomination.ts:15`.
- **Files modified:** `.claude/skills/data/object-model.md`
- **Verification:** row 7 of the re-check table; `yarn lint:check` exit 0
- **Committed in:** `92d6b5c2e`

---

**Total deviations:** 4 (2 x Rule 1 bug in content, 1 x Rule 1 in a verification instrument, 1 x Rule 3 blocking).
**Impact on plan:** No scope creep — every edit landed in the single file named in `files_modified`. Deviation 2 is the one to read closely: it is a correction to a premise the plan states as a `must_haves.truths` clause, and the reconciliation appendix in `160-04-PLAN.md` should record that the "no enforcing code exists" rationale is now measured as "no enforcement, but named supporting machinery" — the prohibition itself is unchanged and honoured.

## Issues Encountered

- **The plan's `<read_first>` names `packages/data/src/objects/nomination/`; the directory is `objects/nominations/`** (plural). Read from the real path; no other consequence.

## Verification

| Check | Result |
|---|---|
| `bash .claude/scripts/audit-skill-links.sh .claude/skills/data/object-model.md` | `Checked: 12  Dangling: 0  Skipped: 2`, **exit 0** |
| `yarn lint:check` | **exit 0** (23/23 tasks; all 11 in-tree guards at 0 violations, including the Phase 152 comment-hygiene scan) |
| `grep -ci 'one constituency per election'` | 1 |
| `grep -ni 'contradict'` | line 135, which also names a shared constituency group and nesting |
| `grep -niE 'imply\|implied\|implies'` | line 137, which also names `parentConstituency` |
| `grep -ci 'party list'` | 1; line 141 contains both `OrganizationNomination` and `CandidateNomination` |
| Region `grep -c '^Source:'` | 0 |
| Region `grep -c '^- \*\*'` | 9 before -> 11 after Task 1 (+2, as specified) -> 12 after Task 2 |
| `*Nomination` token loop over the region | no `MISSING` lines |
| Adjacency | `ConstituencyGroup` bullet at 134, new bullet at 135; `parentConstituency` bullet at 136, new bullet at 137; `OrganizationNomination` bullet at 140, party-list bullet at 141 |

**Not run: the E2E suite and unit tests.** `git diff 103b51d49..HEAD --stat` is one Markdown file under `.claude/`; no application, test, config or package source was touched, so no test outcome can differ. Recorded rather than silently skipped.

**Not claimed: CI verification.** `.github/workflows/main.yaml` carries `paths-ignore: "**.md"`, so a Markdown-only change does not trigger it at all. A green `audit-skill-drift.sh` is likewise not evidence — this phase's own commits reset its per-skill baseline. The evidence for this plan is the local runs above.

## Known Stubs

None.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change. T-160-04's mitigation is discharged and asserted mechanically (region `^Source:` count 0); T-160-01's is discharged by the 12-row re-check table above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **REVIEW-DOC-01 is satisfied** and each of the three facts is greppable by its own phrase.
- **Plan 04's reconciliation appendix needs one amendment:** this plan's `must_haves.truths` clause "because no enforcing code exists in `@openvaa/data`" is now measured as "no enforcement exists, but four named supporting symbols do". The prohibition it justifies is unchanged; the rationale is more precise.
- **Plan 08 measures −10 dangling from this plan**, all inside the `data` skill (33 -> 23), against Plan 01's 350 baseline. Citation count for this file rose 11 -> 12.
- **Plan 03 inherits a live example** of the provenance-qualified bullet, should any extension-pattern step need to state a rule the code does not enforce.
- **No blockers.** `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` and `.planning/STATE.md` are unmodified by this plan, per CONTEXT.md § 0.1(c).

---

_Phase: 160-agent-docs-skills-refresh_
_Completed: 2026-09-13_

## Self-Check: PASSED

- `key-files.modified` present on disk: `.claude/skills/data/object-model.md` FOUND.
- SUMMARY present on disk: `.planning/phases/160-agent-docs-skills-refresh/160-02-SUMMARY.md` FOUND.
- All three commits resolve in `git log --oneline --all`: `5317362a1`, `92d6b5c2e`, `6a733bee3`.
- Task 2's SUMMARY criterion: `grep -c 'checked\|corrected'` -> 14 (>= the 12 bullets).
- Prohibition honoured: `git diff --name-only 103b51d49..HEAD` names only the skill file and this summary — no `ROADMAP` / `REQUIREMENTS` / `STATE` path.
