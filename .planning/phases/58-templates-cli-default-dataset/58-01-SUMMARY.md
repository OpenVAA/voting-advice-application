---
phase: 58-templates-cli-default-dataset
plan: 01
subsystem: testing
tags: [e2e-audit, playwright, dev-seed, d-58-15, d-58-16, phase-58-wave-1]

# Dependency graph
requires:
  - phase: 56-generator-foundations-plumbing
    provides: bulk_import / bulk_delete / findData / fixed[] pipeline surfaces consumed by future e2e template
  - phase: 57-latent-factor-answer-model
    provides: latent emitter (informational — e2e template will use deterministic fixed answers, not latent)
provides:
  - grep-verified inventory of every external_id asserted on by Playwright specs
  - display-name contracts (election/constituency/party names)
  - candidate→organization→constituency→election relational triangles
  - explicit Section 4 exclusion list of fixture-only items Plan 08 MUST NOT carry forward
  - row-count summary (§7) scoping the e2e template's fixed[] arrays
  - 8 open-question flags with Plan 08 resolution guidance
affects: [58-08-e2e-template, 58-10-integration-docs, 59-migrate-seed-test-data]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Audit document as single source of truth — Plan 08 reads this without re-grepping specs"
    - "Grey-area rubric: comment-only grep hits → Section 8; runtime assertions → Sections 1–3"
    - "Ordering-invariant flagging — defaultDataset.candidates[0] and addendum ordering recorded as load-bearing contracts"
    - "Overlay boundary clarification — base e2e template covers default+voter+addendum only; overlays are a Phase 59/60 concern"

key-files:
  created:
    - .planning/phases/58-templates-cli-default-dataset/58-E2E-AUDIT.md
  modified: []

key-decisions:
  - "Audit scoped to base (default + voter + addendum) datasets; overlay templates deferred to Phase 59/60"
  - "Section 4 explicitly lists test-question-date/-number/-boolean as DROP candidates (0 spec references)"
  - "test-question-text RETAINED (voter-detail.spec.ts:88 asserts on alphaAnswers['test-question-text'].value.en)"
  - "Ordering invariants documented: defaultDataset.candidates[0] MUST be test-candidate-alpha; candidateAddendum.candidates[0]/[1] ordering fixed"
  - "Likert-5 choice LABELS (Fully disagree/Somewhat disagree/...) NOT spec-asserted — only the shape (5 choices, keys '1'-'5') is load-bearing"
  - "mock.candidate.2@openvaa.org is the ONLY literal email that is load-bearing for auth flows"

patterns-established:
  - "Audit-driven template authoring — D-58-15 mandates grep-verified inventory before e2e template construction"
  - "Positive inclusion list (Sections 1–3) + negative exclusion list (Section 4) pattern for template scoping"

requirements-completed: [TMPL-05]

# Metrics
duration: 35min
completed: 2026-04-23
---

# Phase 58 Plan 01: E2E Playwright Spec Audit Summary

**Grep-verified Playwright spec inventory — 21 spec files, 34 runtime external_id references catalogued, 17 relational triangles mapped, and 25 fixture-only items flagged for omission from the forthcoming e2e template (D-58-15).**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-04-23T07:28:00Z (approx)
- **Completed:** 2026-04-23T08:03:35Z
- **Tasks:** 1
- **Files modified:** 1 (created)

## Accomplishments

- Produced `.planning/phases/58-templates-cli-default-dataset/58-E2E-AUDIT.md` — the single authoritative inventory Plan 58-08 will consume to author `packages/dev-seed/src/templates/e2e.ts`
- Enumerated every external_id, display-name, and relational triangle with spec file:line citations
- Section 4 "Implicit Invariants NOT carried forward" list identifies exactly which JSON-fixture rows (test-question-date, -number, -boolean, sundry `info` markdown blocks on non-Alpha candidates, and the overlay-only rows) Plan 08 must omit
- Section 7 Row-Count Summary gives Plan 08 the canonical sizing for `organizations: { count: 2, fixed: [...] }`-style blocks across all 8 non-system tables
- Flagged 7 open questions (Section 8) — scoped so Plan 08 can resolve each during its own authoring (base-vs-overlay boundary, answersByExternalId writer wiring, test-voter-cand-hidden double-belt-and-braces pattern, customData.allowOpen propagation, comment-only grep noise, bank-auth scope, visual/perf spec dependencies)

## Task Commits

1. **Task 1: Enumerate external IDs, names, and relational contracts** — `a8af6a01d` (docs)

## Files Created/Modified

- `.planning/phases/58-templates-cli-default-dataset/58-E2E-AUDIT.md` (created) — 8-section audit inventory with frontmatter, external-ID table (§1), display-name contracts (§2), relational triangles (§3), implicit-invariant exclusion list (§4), testId informational note (§5), auth/registration contracts (§6), row-count summary (§7), open questions (§8), and a Plan 08 checklist

## Decisions Made

- **Scope boundary (§8.1):** Base e2e template covers only default+voter+addendum content. Overlays (constituency, startfromcg, multi-election) are deferred to a later phase. This keeps Plan 08's `fixed[]` arrays tractable and avoids bundling setup-file concerns into the template itself.
- **Drop decision for fixture-only question types (§4.1):** test-question-date, test-question-number, test-question-boolean have 0 spec references and can be safely OMITTED. voter-matching.spec.ts's filter on `type === 'singleChoiceOrdinal'` remains satisfied regardless (8 ordinal questions in the default set either way).
- **Choice-label lock decision (§4):** The exact Likert-5 labels ("Fully disagree" etc.) are NOT spec-asserted — only the 5-choice shape with keys "1"-"5" is required. Plan 08 may regenerate labels; parity preservation is a style choice, not a contract.
- **Password value non-contract (§6):** Recorded the `TestPassword123!` vs `Password1!` mismatch between `tests/seed-test-data.ts` and `tests/tests/utils/testCredentials.ts` as informational — it's a Phase 59 reconciliation, out of scope here. The e2e template has no password literal.

## Deviations from Plan

None - plan executed exactly as written. The task action (produce 58-E2E-AUDIT.md with 8 sections per the plan's hardcoded spec) was followed verbatim. All acceptance criteria pass.

## Issues Encountered

- **Heading-level rename:** Initial draft used `## Section` top-level headings; plan's automated acceptance criterion specifies `grep -c '^### Section' returns exactly 8`. Promoted 8 top-level sections to `### Section` and demoted sub-sections to `#### Section x.y` to satisfy the grep invariant precisely. Not a deviation — a template-format correction during verification.

## Self-Check: PASSED

**File existence:**
- `.planning/phases/58-templates-cli-default-dataset/58-E2E-AUDIT.md` — FOUND

**Commit existence:**
- `a8af6a01d` (docs(58-01): e2e Playwright spec audit inventory) — FOUND in `git log`

**Acceptance criteria (from 58-01-PLAN.md):**
- File exists at specified path — OK
- `grep -q 'doc: e2e-audit' 58-E2E-AUDIT.md` — OK
- `grep -c '^### Section' 58-E2E-AUDIT.md == 8` — OK (exactly 8)
- Section 1 contains required external IDs (`test-candidate-alpha`, `test-election-1`, `test-constituency-alpha`, `test-cg-municipalities`, `test-election-2`, `test-constituency-e2`, `test-voter-cand-agree`, `test-voter-cand-oppose`, `test-voter-cand-partial`) — ALL PRESENT
- Section 1 rows cite `tests/tests/specs/*.spec.ts:N` file:line — 56 citations present
- Section 3 contains >= 2 relational triangles — 17 triangle lines found
- Section 4 is NON-EMPTY — 25 table rows present
- Section 6 mentions `mock.candidate.2@openvaa.org` — OK
- Section 7 has >= 8 table entries — exactly 8 non-system tables listed
- Zero TODO/TBD/XXX markers — 0 found

## Next Phase Readiness

- **Plan 58-08 (E2E template):** Has everything it needs. The §1–3 inclusion list, §4 exclusion list, §6 auth contract, §7 row-count sizing, and §8 open-question resolutions collectively let Plan 08 author `packages/dev-seed/src/templates/e2e.ts` without re-grepping the spec files.
- **Plan 58-10 (integration docs):** The audit will be referenced from the package README (DX-01) as the canonical "what contracts does the e2e template preserve" index.
- **Phase 59 (migrate seed-test-data.ts):** When Phase 59 switches `tests/seed-test-data.ts` to invoke the e2e template, this audit is the parity check — any Section 1–3 contract that breaks indicates a regression.

## Open Items for Plan 08

Plan 08 is expected to resolve the following during its own authoring (recorded in §8 of the audit):
1. Confirm scope boundary: base-only vs. base+overlays (recommendation: base-only).
2. Verify `SupabaseAdminClient.importAnswers` handles `answersByExternalId` from `fixed[]` candidate rows; extend writer if needed (Rule 2).
3. Preserve the test-voter-cand-hidden double-invariant (no `termsOfUseAccepted` + nomination `unconfirmed: true`).
4. Preserve `customData.allowOpen: true` on test-question-1.
5. Decide whether Likert-5 labels match current fixtures verbatim (style) or regenerate (freshness).

---
*Phase: 58-templates-cli-default-dataset*
*Completed: 2026-04-23*
