---
phase: 75-question-rendering-specs
plan: 02a
artifact: dedup-audit
requirements: [QSPEC-01, QSPEC-02]
created: 2026-05-11
---

# Phase 75 — Unified Dedup Audit

Unified Phase 75 dedup audit per CONTEXT D-04 + ROADMAP SC #3. Consolidates Plan 01 boolean (QSPEC-01) findings + Plan 02a categorical (QSPEC-02) findings into a single Nyquist-compliant persistent record per B-03 revision. Plan 02b's `75-VERIFICATION.md §"Dedup Audit"` references THIS file as the single source of truth.

## Grep Inputs

| # | Grep Command | Target Files |
|---|--------------|--------------|
| 1 | `grep -nE "BooleanQuestion\|isBooleanQuestion\|test-question-boolean" packages/matching/tests/*.test.ts tests/tests/specs/voter/voter-matching.spec.ts` | matching package unit tests + voter-matching spec |
| 2 | `grep -nE "singleChoiceCategorical\|directional\|test-question-directional\|Option [A-C]" tests/tests/specs/voter/voter-matching.spec.ts tests/tests/specs/voter/voter-detail.spec.ts` | voter-matching + voter-detail specs |
| 3 | `grep -rnE "Categorical\|SingleChoice" packages/matching/ --include="*.test.ts"` | matching package source + tests |

## Audit Table — Per-Grep-Hit Classification

Classification values:
- `NEW` — the QSPEC spec adds NEW assertion coverage; no analog exists.
- `DELEGATED` — the analog test owns this contract; QSPEC delegates / does NOT duplicate.
- `FALSE-POSITIVE` — grep flagged the file but no actual assertion overlap.

| Source spec/test file | Line(s) | Overlap classification | Rationale | Verdict |
|-----------------------|---------|------------------------|-----------|---------|
| `tests/tests/specs/voter/voter-matching.spec.ts` | 40-43 | DELEGATED | Ordinal-only filter `singleChoiceOrdinal` (`!q.external_id.startsWith('test-voter-')`) — explicitly EXCLUDES booleans + categoricals from the matching ranking checks. Orthogonal contract: matching-ranking vs render-shape. | No duplicate. |
| `tests/tests/specs/voter/voter-matching.spec.ts` | 93-103 | DELEGATED | `MatchingAlgorithm` instantiation with `DISTANCE_METRIC.Manhattan` + Likert-5 ordinal `OrdinalQuestion.fromLikert` setup. Algorithm-distance contract — QSPEC-01/02 assert render shape, not distance. | No duplicate. |
| `tests/tests/specs/voter/voter-matching.spec.ts` | 167-191 | DELEGATED (LEVERAGED, not asserted) | Skip-Next fallback `navigateToResults` (Phase 74 P05 + Phase 75 P01 bumped to 3-iter loop). QSPEC-01 verifies sort 18 boolean walk-through; QSPEC-02 walks through sort 17 (categorical) + sort 18 (boolean). No assertion duplicated — the helper is leveraged, not re-asserted. | No duplicate. |
| `tests/tests/specs/voter/voter-matching.spec.ts` | 201-246 | DELEGATED | Ranking-order assertions (`should display candidates in correct match ranking order`, `top result`, `last result`, `partial-answer score`). Algorithm-output contract — QSPEC asserts render shape. | No duplicate. |
| `tests/tests/specs/voter/voter-detail.spec.ts` | 197-296 | DELEGATED | E2E-05 4-case `voter-detail answer cases` block (Phase 74 P05). Cases (a)/(b) use `test-question-1` (ordinal); cases (c)/(d) use `test-question-directional-1`. QSPEC-02's entity-detail mirror uses the same DOM patterns but on a DIFFERENT walk path (voter manually walks to categorical at sort 17 + answers it; E2E-05 case (c) has voter NOT answer + Alpha answer). The assertion contracts differ: case (c) asserts entity-only; QSPEC-02 asserts ASYMMETRIC voter≠Alpha (both rows present, on DIFFERENT buttons). | No duplicate. |
| `tests/tests/specs/voter/voter-detail.spec.ts` | 298-376 | DELEGATED | E2E-07 per-category SubMatch block (`getByRole('meter', { name })` for Manhattan + directional metric path categories). ROADMAP line 203 explicitly excludes per-category SubMatch from QSPEC-02's scope. | No duplicate. |
| `packages/matching/tests/question.test.ts` | 3, 8, 16 | DELEGATED | `CategoricalQuestion` unit tests — algorithm-level question-shape contract (id, values, normalization). QSPEC-02 asserts user-flow + render shape. | No duplicate. |
| `packages/matching/tests/algorithms.test.ts` | 7, 115-150 | DELEGATED | `categorical questions` test suite — `MatchingAlgorithm` dispatching to `CategoricalQuestion` directional/Manhattan distance. Pure algorithm contract — QSPEC-02 asserts render + flow. | No duplicate. |
| `packages/matching/tests/distance.test.ts` | 36-138 | DELEGATED | `directionalKernel` + `directionalDistance` unit tests — pure distance-math contract. QSPEC-02 asserts render-shape contract. | No duplicate. |
| `packages/matching/tests/` — boolean references | (zero grep hits) | NEW (no analog) | `grep -rnE "BooleanQuestion\|isBooleanQuestion" packages/matching/tests/` returns 0 lines (no `BooleanQuestion` algorithm-level test cases in matching package today). QSPEC-01 asserts render contract; absence of matching-algorithm tests for booleans is a separate coverage observation (not a duplication concern). | No duplicate (no analog exists). |
| `tests/tests/specs/voter/voter-matching.spec.ts` | 176-183 | FALSE-POSITIVE | Comment block referring to `test-question-boolean-1` — pure documentation, not an assertion against the boolean's contract. No overlap. | No duplicate. |
| `tests/tests/specs/voter/voter-detail.spec.ts` | 178-296 (case c+d) | FALSE-POSITIVE for QSPEC-02 same-button overlap | The directional question is the marker for cases (c) and (d), but the assertion shape (entity-only / both-missing) differs from QSPEC-02's voter-answered + Alpha-answered (asymmetric DIFFERENT-buttons). The grep hit is on the same external_id; the contracts are non-overlapping. | No duplicate. |

## Contract Split Statement

QSPEC-01 (boolean) + QSPEC-02 (single-choice categorical) assert the user-flow + render-shape + browser-back-persistence + entity-detail-mirror contracts (Playwright's strength: walking the voter from Home through question rendering through results-drawer rendering and asserting DOM state at each step). The matching-algorithm distance / normalization / ranking contracts are asserted by `packages/matching/tests/*.test.ts` unit tests + `voter-matching.spec.ts` ordinal-filter chain (which intentionally EXCLUDES booleans + categoricals from ranking checks). The per-category SubMatch contract for the directional metric path is asserted by E2E-07 (Phase 74 P05) in `voter-detail.spec.ts:298-376` via `getByRole('meter', { name })` per-category accessibility nodes — explicitly out of scope for QSPEC-02 per ROADMAP line 203. The 4-case voter-vs-entity matrix on the directional marker (case (c) entity-only, case (d) both-missing) is asserted by E2E-05 in `voter-detail.spec.ts:197-296` — different contracts from QSPEC-02's asymmetric voter-answered + Alpha-answered both-present shape. No assertion in either QSPEC spec duplicates an existing assertion.

## Cross-Plan Flow

Per B-03 revision: Plan 01 Task 5 contributed BOOLEAN dedup findings to `.planning/phases/75-question-rendering-specs/75-01-SUMMARY.md §"Dedup Audit Findings (BOOLEAN — feeds Plan 02a's unified artifact)"`. Plan 02a Task 2 (this artifact) consolidates BOTH boolean + categorical findings into a single Nyquist-compliant persistent file. Plan 02b `75-VERIFICATION.md §"Dedup Audit"` references THIS file as the single source of truth; the per-plan SUMMARY sections remain as audit-flow records but the unified artifact is the canonical reference. The trailing `AUDIT COMPLETE` token below is the automated grep-gate.

## Cross-Links

- CONTEXT D-04 — `.planning/phases/75-question-rendering-specs/75-CONTEXT.md` (deduplication strategy)
- RESEARCH §5 Dedup audit — `.planning/phases/75-question-rendering-specs/75-RESEARCH.md`
- Plan 01 SUMMARY §"Dedup Audit Findings (BOOLEAN — feeds Plan 02a's unified artifact)" — `.planning/phases/75-question-rendering-specs/75-01-SUMMARY.md`
- Plan 02b VERIFICATION (forward reference — written by Plan 02b) — `.planning/phases/75-question-rendering-specs/75-VERIFICATION.md` §"Dedup Audit"
- ROADMAP §"Phase 75" SC #3 (deduplication preserved) — `.planning/ROADMAP.md:197-207`
- Phase 74 P05 SUMMARY (E2E-07 per-category SubMatch — out of scope for QSPEC-02) — `.planning/phases/74-high-leverage-e2e-coverage/74-05-SUMMARY.md`

---

AUDIT COMPLETE
