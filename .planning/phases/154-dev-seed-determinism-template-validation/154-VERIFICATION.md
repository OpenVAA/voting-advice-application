---
phase: 154-dev-seed-determinism-template-validation
verified: 2026-08-29T08:00:00Z
status: passed
score: 4/4 must-haves verified (ROADMAP success criteria 1-4)
behavior_unverified: 0
overrides_applied: 0
re_verification: null
requirements_note:
  - id: REVIEW-SEED-03
    finding: "SATISFIED by implementation evidence (parity test + re-run regression suite); REQUIREMENTS.md checkbox remains unticked because milestone.cjs's mark-complete matcher rejects the annotated Status cell. Not a phase gap — see 'Outstanding Operator Decisions'."
  - id: REVIEW-SEED-04
    finding: "SATISFIED by implementation evidence (negative control + absent/empty-string cases); same tooling limitation as REVIEW-SEED-03."
---

# Phase 154: dev-seed Determinism & Template Validation Verification Report

**Phase Goal:** The determinism contract dev-seed states in writing is true: the same seed yields the same dataset today, tomorrow and next year.
**Verified:** 2026-08-29T08:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

This report treats SUMMARY.md claims as hypotheses. Every load-bearing claim below was
independently re-derived from git history, source files, or a freshly executed command — not
copied from the SUMMARYs. Citations are file:line and commit SHA against the tree at HEAD
(`8ebc3ebe4`), not against the SUMMARYs' own (frequently stale, self-documented) citations.

## The Central Claim — Independently Re-Verified

**Half 1: the breach was demonstrated with no fix applied.**

```
git diff 6d4b4f151^..49b4c2a08 -- packages/dev-seed/src/
```
returns **empty**. `git diff --stat` over the same range touches exactly one file:
`packages/dev-seed/tests/determinism.test.ts` (+143/−1). 154-01's three commits
(`6d4b4f151`, `61f189368`, `49b4c2a08`) are all present in `git log`. **Confirmed: zero
production-code changes accompanied the negative-control commits.**

**Half 2: the fix genuinely replaced both wall-clock reads.**

```
packages/dev-seed/src/generators/ElectionsGenerator.ts:48
  election_date: faker.date.future({ years: 1, refDate }).toISOString().slice(0, 10),
packages/dev-seed/src/emitters/answers.ts:77
  return faker.date.recent({ refDate }).toISOString();
```
Both read from `refDate`, sourced from `packages/dev-seed/src/ctx.ts:26`
(`export const SEED_REF_DATE = '2027-01-01T00:00:00.000Z';`) resolved once per run at
`ctx.ts:78` (`refDate: new Date(template.refDate ?? SEED_REF_DATE)`). Commits `9342d9545`,
`597972df5`, `ae87dbd0b` are present at HEAD's ancestry. **Confirmed.**

**The subtle part — day-granularity is not enough, and the guard does not stop there.**
Read directly from `packages/dev-seed/tests/determinism.test.ts` at HEAD (lines 157-192):

- The eight-months-apart case asserts, in order: whole-pipeline `JSON.stringify(run1)
  toEqual JSON.stringify(run2)` (line 166), **then separately** `first.electionDate toEqual
  second.electionDate` and `first.dateAnswer toEqual second.dateAnswer` (lines 171-172).
- The one-millisecond case asserts `before.dateAnswer toEqual after.dateAnswer` **and**
  `before.electionDate toEqual after.electionDate` (lines 187-188) — at a real 1ms clock
  delta, the granularity at which 154-01 measured `election_date` staying byte-identical
  while the answer moved on unfixed code.

This is not restricted to the coarse `election_date` field. A guard that compared only
`election_date` would have gone green whether or not the answer-site fix existed; this guard
does not have that hole. **Confirmed by direct read, not by trusting the SUMMARY's prose
description of the test.**

**The inversion, read as a diff, not asserted.** `git diff 49b4c2a08..HEAD --
packages/dev-seed/tests/determinism.test.ts` shows exactly the two per-clock cases flipping
from `.not.toEqual` to `.toEqual` (and their `it()` names/comments updated to match), plus
one comment-wording change earlier in the file. The mechanism-level control ("negative
control: faker date draws follow the system clock without a reference date and are pinned
with one", lines 196-229) is **absent from this diff** — 0 changed lines, exactly as 154-03's
SUMMARY claims and as 154-01 required it to remain.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Both wall-clock date sites are replaced by generation from a fixed reference window (ROADMAP criterion 1 / REVIEW-SEED-01) | VERIFIED | `ElectionsGenerator.ts:48`, `answers.ts:77` both pass `refDate`; `grep -rnE 'faker\.date\.(future\|recent)\(' packages/dev-seed/src \| grep -vc refDate` → `0` (re-run independently) |
| 2 | The breach was proven real (differing output) before proven fixed (identical output), and a committed guard covers both day and millisecond granularity, at both sites separately (ROADMAP criterion 2 / REVIEW-SEED-02) | VERIFIED | Central-claim section above; test suite re-run, both cases pass (see Behavioral Spot-Checks) |
| 3 | Built-in and filesystem templates traverse the same `validateTemplate()` path (ROADMAP criterion 3 / REVIEW-SEED-03) | VERIFIED | `resolve-template.ts:60` reads `return validateTemplate(builtIn);` (re-measured, not `:84` as the roadmap/REQUIREMENTS text still says — see stale-citation note below); parity case `built-in and filesystem entry paths reject the same drifted template identically` exists at `tests/cli/resolve-template.test.ts:137` |
| 4 | `fixed[]` rows without a non-empty `external_id` are rejected with a field path, and a negative control shows the pre-hardening schema accepting the bad row (ROADMAP criterion 4 / REVIEW-SEED-04) | VERIFIED | `assertFixedRowsCarryExternalId` declared `schema.ts:136`, called unconditionally at `schema.ts:169`; negative control `TemplateSchema.safeParse(badRow).success` asserted `true` at `template.test.ts:129` alongside `validateTemplate` rejecting the same row |
| 5 | No other unseeded non-determinism source remains in `packages/dev-seed/src/` | VERIFIED | Independent sweep (below): no `Math.random`, no unseeded `new Faker()`, no other row-affecting `Date.now()`/`new Date()` read |

**Score:** 4/4 ROADMAP success criteria verified, plus one additional independently-derived
truth (row 5) supporting the phase's "same seed = same rows" contract more broadly.

### Independent sweep for other non-determinism sources

Run directly against the tree, not inherited from any SUMMARY:

- `grep -rn "Math.random" packages/dev-seed/src` → **0 hits**.
- `grep -rn "new Faker(" packages/dev-seed/src` → 4 sites (`ctx.ts:72`, `locales.ts:69`,
  `templates/defaults/candidates-override.ts:54,147`). All four call `.seed(...)`
  immediately after construction with a value derived from the template/base seed
  (`ctx.ts:72-73`, `locales.ts:68-69`, `candidates-override.ts:53-54` using
  `42 + LOCALE_SEED_OFFSETS[locale]`). No unseeded instance found.
- `grep -rn "Date.now()\|new Date()\|toISOString()" packages/dev-seed/src` → only
  `cli/seed.ts:94,107` (`Date.now()` for a CLI elapsed-time readout — confirmed, as F2
  stated, that neither reaches an emitted row) plus the two fixed `refDate` sites.
- `crypto.randomUUID` / `gen_random_uuid` — `pipeline.ts:173`'s docstring notes
  `nominations.id` is a Postgres `uuid DEFAULT gen_random_uuid()`, minted at INSERT time.
  This is a **database surrogate key**, not dev-seed emitted row content, and it predates
  this phase; `assignNominationSortOrder` (same file, `:181-189`) was added by an earlier
  phase specifically so ordering does not depend on it. Out of scope for "same seed = same
  rows" as the phase states that contract (row *content*, not DB-assigned ids) — correctly
  not touched by 154.

**Judgement: two was the right number.** The phase's own F1/F2 measurement (two live
`faker.date` sites, no other row-affecting wall-clock or RNG read) holds up under an
independent re-sweep of the current tree, not just at measurement time.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/dev-seed/src/ctx.ts` | `SEED_REF_DATE` const + required `Ctx.refDate` | VERIFIED | `:26` const, `:78` resolution, `refDate: Date` required field (no `?`) |
| `packages/dev-seed/src/generators/ElectionsGenerator.ts` | `refDate`-anchored `faker.date.future` | VERIFIED | `:48` |
| `packages/dev-seed/src/emitters/answers.ts` | `refDate`-anchored `faker.date.recent` | VERIFIED | `:77`, docstring at `:40` matches |
| `packages/dev-seed/src/template/types.ts` | `refDate?: string` template override field | VERIFIED | present, `TemplateSchema` mirror confirmed below |
| `packages/dev-seed/src/template/schema.ts` | strict-schema `refDate` key + `assertFixedRowsCarryExternalId` | VERIFIED | guard at `:136`, called at `:169`; `refDate` validated `z.iso.datetime()` per 154-03's flip-test |
| `packages/dev-seed/tests/determinism.test.ts` | cross-time stability guard, both granularities, both sites | VERIFIED | see Central Claim section |
| `packages/dev-seed/tests/cli/resolve-template.test.ts` | built-in/filesystem parity case | VERIFIED | `:137` |
| `packages/dev-seed/tests/template.test.ts` | `external_id` negative control + whitespace boundary | VERIFIED | `:129` (safeParse control), `:158` (whitespace boundary) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `template.refDate` (authoring type) | `ctx.refDate` (resolved) | `buildCtx` | WIRED | `ctx.ts:78`: `new Date(template.refDate ?? SEED_REF_DATE)` |
| `ctx.refDate` | `ElectionsGenerator` election_date | destructured `refDate` param | WIRED | `ElectionsGenerator.ts:48` |
| `ctx.refDate` | `answers.ts` date-branch emitter | explicit parameter | WIRED | `answers.ts:77`, signature widened per 154-03 SUMMARY, confirmed by grep above |
| `Template['refDate']` (type) | `TemplateSchema` (zod, `.strict()`) | schema key mirror | WIRED | accept/reject cases in `template.test.ts` pin the ISO-datetime validator specifically (154-03's flip-test: weakening to `z.string()` turned the reject case red while the accept case stayed green) |
| `tests/seed-test-data.ts` | `@openvaa/dev-seed` (`runPipeline`, `BUILT_IN_TEMPLATES`) | import | WIRED | `tests/seed-test-data.ts:12` — **confirmed by direct read**: `import { BUILT_IN_OVERRIDES, BUILT_IN_TEMPLATES, fanOutLocales, runPipeline, Writer } from '@openvaa/dev-seed';`. This is the mechanism by which dev-seed reaches the E2E suite through the seeded *data*, not through the app's dependency graph — confirming 154-03's corrected E2E-decline route. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| dev-seed unit suite, full re-run at HEAD | `yarn workspace @openvaa/dev-seed test:unit` | **580 passed across 49 files**, exit 0 (independently re-run, not read from a SUMMARY) | PASS |
| Root unit suite | `yarn test:unit` | 25/25 turbo tasks successful | PASS |
| Build | `yarn build` | 14/14 tasks successful (13 cached) | PASS |
| Lint (incl. comment-hygiene, i18n, a11y-wiring gates) | `yarn lint:check` | 22/22 tasks; comment-hygiene 0 violations; i18n 598 keys, 0 violations; a11y-wiring 0 violations | PASS |
| E2E cardinal gate — decoded report payload, not console tail | Extracted `<script id="playwrightReportBase64">` from `tests/e2e-runs/154-04-cardinal-gate/index.html`, unzipped, parsed `report.json` in a fresh Python process | `{"total": 150, "expected": 150, "unexpected": 0, "flaky": 0, "skipped": 0, "ok": true}` — matches the SUMMARY's claimed payload exactly, independently decoded rather than trusted | PASS |
| `total == expected` with `skipped: 0` | — | 150 == 150, skipped 0 | PASS (zero did-not-run, per CLAUDE.md's cardinal-failure rule) |

`yarn db:lint:sql` intentionally **not** re-run as a phase gate: pre-existing red by
construction (lints the live database, not a working-tree file), matches the CLAUDE.md
context's stated exception, and this phase touches no SQL.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|--------------|--------|----------|
| REVIEW-SEED-01 | 154-03 | Fixed reference window replaces wall-clock generation | SATISFIED, marked Complete in REQUIREMENTS.md | Confirmed both code and requirements-table state (see below) |
| REVIEW-SEED-02 | 154-01, 154-03 | Breach proven real then fixed, guard committed | SATISFIED, marked Complete in REQUIREMENTS.md | Central Claim section |
| REVIEW-SEED-03 | 154-02 | Built-in/filesystem validation parity | SATISFIED by implementation evidence; checkbox NOT ticked (tooling limitation, not a code gap) | `resolve-template.ts:60`; parity test at `resolve-template.test.ts:137`; see Outstanding Operator Decisions |
| REVIEW-SEED-04 | 154-02 | `fixed[]` `external_id` requirement + negative control | SATISFIED by implementation evidence; checkbox NOT ticked (same tooling limitation) | `schema.ts:136,169`; `template.test.ts:129` |

**REQUIREMENTS.md diff, independently checked against the phase's base commit** (`fee77f596`,
the 152-15 close, immediately before 154 began):

```
git diff fee77f596..HEAD -- .planning/REQUIREMENTS.md
```
shows **exactly two checkbox flips** (`[ ]`→`[x]` for REVIEW-SEED-01, REVIEW-SEED-02) and their
two matching traceability-table Status cells (`Pending`→`Complete`). **No other byte in the
file changed** — no requirement prose was edited, no line-number citation was corrected (the
`:58`/`:91` pair the file still carries for REVIEW-SEED-01 remains, exactly as the phase
records it was forbidden to touch). This is consistent with what the phase's SUMMARYs
describe as the sanctioned `requirements mark-complete` tool call, not hand-editing — the
distinction the phase's decisions repeatedly draw. (Note: the verification brief's framing
that "REQUIREMENTS.md is byte-identical across the whole phase" is not literally true — two
checkbox+status-cell flips did land, via the tool, in 154-03. The file's *prose* is
byte-identical; its two Complete-tracking cells are not, by design.)

### Anti-Patterns Found

None. Swept all files named in the four SUMMARYs' key-files/modified lists for
`TBD|FIXME|XXX`, `TODO|HACK|PLACEHOLDER`, empty-implementation and hardcoded-empty-data
patterns. Zero hits beyond documentation prose describing the *absence* of these patterns
(e.g. "No `TODO`/`FIXME`... this plan introduced no placeholder" in 154-04's own SUMMARY,
itself consistent with the code).

### Data-Flow Trace (Level 4)

Not applicable in the UI-rendering sense — this phase has no rendered output. The equivalent
trace here is the reference-date threading verified under Key Link Verification: `SEED_REF_DATE`
→ `ctx.refDate` → both emitter call sites, confirmed to be a live, non-static value that
changes when overridden (`template.refDate`) and is resolved exactly once per pipeline run
(the `Ctx.refDate: Date` field is **required**, not optional with a `?? new Date()` fallback
— confirmed by reading `ctx.ts`, which makes a wall-clock fallback a TypeScript compile error
rather than a latent branch).

## Judgement Questions (from the verification brief)

**1. Is the determinism contract actually true now, or only true for the cases the tests
cover?** True more broadly than the tests alone would prove, based on an independent sweep
(see "Independent sweep for other non-determinism sources" above) that found no unseeded
`Math.random`, no unseeded `Faker` instance, and no other row-affecting wall-clock read.
The one non-content non-determinism source found (`gen_random_uuid()`-assigned nomination
surrogate ids) is explicitly out of scope of the "same seed = same rows" contract as the
phase states it (row *content*), predates this phase, and is already mitigated by a prior
phase's `sort_order` assignment. **Two was the right number.**

**2. Do the phase's self-corrections hold up?** Spot-checked two independently:
`resolve-template.ts:60` (the SUMMARYs' corrected figure) reads `return
validateTemplate(builtIn);` — confirmed, not the roadmap/REQUIREMENTS' stale `:84`.
`assertFixedRowsCarryExternalId`'s declaration and call site were measured here at `:136` and
`:169` — close to but not identical to 154-02's stated `:130-144`/`:163` (a further ~6-line
drift, itself consistent with 154-03 adding the `refDate` schema key afterward, which is
exactly the class of staleness this phase repeatedly documents about itself). **Agreed: the
corrections were accurate at the time each was measured, and the pattern of continuous
small drift they warn about is itself observably real** — even this verification's own
citations will likely drift under a future edit.

**3. Does `tests/seed-test-data.ts:12` import `runPipeline`, and were 154-01/02's earlier
declines safe?** Confirmed by direct read: `tests/seed-test-data.ts:12` imports
`{ BUILT_IN_OVERRIDES, BUILT_IN_TEMPLATES, fanOutLocales, runPipeline, Writer }` from
`@openvaa/dev-seed`. 154-01 and 154-02's declines were safe for their own diffs because both
diffs were **entirely test-file changes** with zero lines under `packages/dev-seed/src/`
(independently confirmed via `git diff --stat` over each plan's commit range, above) — a
test-only diff cannot alter what the harness seeds regardless of whether the import path
exists. 154-03's diff changed production `src/`, which is exactly where the import path
starts to matter, and 154-03 correctly re-examined and replaced the route rather than
inheriting it.

## Outstanding Operator Decisions (not gaps)

Per the verification brief's explicit instruction, these are recorded rather than penalized
or escalated as blocking gaps — the operator is away overnight and both are process/tooling
matters, not implementation gaps:

1. **REVIEW-SEED-03/REVIEW-SEED-04 cannot be marked Complete by `requirements mark-complete`.**
   Confirmed present in `.planning/WINDOWS.md` (entries 139, 144). The tool's matcher rejects
   the annotated Status cell text (`Pending — measured 2026-08-28 as already satisfied by
   Phase 144 (…)`) because it matches only the bare word `Pending`. The underlying
   requirement is implementation-satisfied (see Requirements Coverage above); only the
   traceability checkbox is blocked. Needs either a matcher fix or an operator hand-edit
   (which would delete the "already satisfied by Phase 144" annotation — a real cost, not a
   trivial one).
2. **Two todos filed and confirmed present** at
   `.planning/todos/pending/2026-08-28-dev-seed-hardcoded-election-date-is-in-the-past.md`
   and `.../2026-08-28-dev-seed-whitespace-only-external_id-accepted.md` (verified: both
   files exist). Neither is a gap in this phase's own scope — both are pre-existing
   conditions this phase measured and declined to fix per D-N2/D-C1's stated constraints.

## Stale Citations Left in Place on Purpose

Confirmed present and unedited, exactly as the phase's WINDOWS entries (134, 135, 149) and
the four SUMMARYs describe: `REQUIREMENTS.md` REVIEW-SEED-01 prose still cites
`ElectionsGenerator.ts:58`/`answers.ts:91` (measured `:48`/`:77`); REVIEW-SEED-03/04 still
cite `resolve-template.ts:84` and `schema.ts:194`/`:227` (measured `:60` and `:136`/`:169`);
`ROADMAP.md`'s Phase 154 entry carries the same stale pairs in its criteria text. This
verifier did **not** treat these as gaps — the phase's plans are explicit that they are
forbidden from editing these two shared documents, the substance behind every citation is
independently confirmed true above, and the staleness itself is registered in
`.planning/WINDOWS.md`.

## Gaps Summary

**None found.** Both halves of the central claim, all four ROADMAP success criteria, the
suite-growth figures (570→574→578→580, independently re-run to 580/49 files), the E2E
cardinal gate (independently decoded to 150/150/0-skipped), the `tests/seed-test-data.ts:12`
import claim, and the "REQUIREMENTS.md untouched except two sanctioned checkbox flips" claim
all held up under independent re-derivation. The two items in "Outstanding Operator
Decisions" are process/tooling matters explicitly out of this phase's power to resolve, not
implementation gaps, and are recorded rather than blocking.

---

*Verified: 2026-08-29*
*Verifier: Claude (gsd-verifier)*
