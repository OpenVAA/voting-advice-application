# 58-E2E-AUDIT.md addendum: QSPEC-01 + QSPEC-02 external_id and display-text contracts

**Captured:** 2026-05-12 (Phase 75 close)
**Source:** Phase 75 CONTEXT.md Claude's Discretion §5 + Plan 02b operator checkpoint approval
**Status:** Optional (recommended-but-not-blocking)

## Scope

Add Phase 75 spec-anchored external_id + display-text contracts to `.planning/milestones/v2.5-phases/58-templates-cli-default-dataset/58-E2E-AUDIT.md`:

### New entries to add to §1 (External IDs)

- `test-question-boolean-1` (NEW in Phase 75 Plan 01) — referenced by `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts` for the boolean question render contract; voter answers via the `<input type="radio">` boolean branch in `OpinionQuestionInput.svelte:100-111`.
- `test-category-boolean` (NEW in Phase 75 Plan 01) — referenced indirectly via `category: { external_id: 'test-category-boolean' }` on `test-question-boolean-1` in the e2e template; not directly grep-hit by specs but anchors the boolean question into a dedicated category for question-flow organization (mirrors `test-category-directional` from Phase 74 Plan 05).

### New entries to add to §2 (Display text)

- The boolean question's choice labels are i18n-resolved via `t('common.answer.no')` + `t('common.answer.yes')` (verified present in en/fi/sv/da per `apps/frontend/src/i18n/en/common.json:6-9`). The QSPEC-01 spec currently uses literal English `'Yes'` / `'No'` per Phase 75 W-03 deferred-todo; if/when i18n hardening lands (Phase 78 CLEAN-04 Order B), the audit should reflect the i18n-key contract.

### Additionally — existing entries to spec-anchor

- `test-question-directional-1` (added Phase 74 Plan 05; already in §1) — now ALSO spec-anchored by `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` (Phase 75 Plan 02a). Add a cross-reference: "QSPEC-02 single-choice categorical render contract" alongside the existing "E2E-07 directional-metric SubMatch breakdown" anchor.

## Why this is optional

Per CONTEXT D-04 dedup audit + Plan 02a's unified `75-02-DEDUP-AUDIT.md` artifact, the spec-anchoring contract is already documented at the phase level. The 58-E2E-AUDIT.md addendum is a project-level cross-reference — useful for future seed-extension audits but not blocking for phase-level coverage.

## Suggested scope

- ~10-15 lines of additions to 58-E2E-AUDIT.md (1 new external_id row + 1 new category row + 2 display-text rows + 1 cross-reference update).
- Single small commit; could be folded into any future v2.9 hygiene phase OR closed standalone.

## Cross-references

- Phase 75 CONTEXT.md `### Claude's Discretion` §5
- Phase 75 Plan 02b operator checkpoint approval (2026-05-12)
- `.planning/phases/75-question-rendering-specs/75-VERIFICATION.md` Follow-ups
- `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md`
- Phase 74 Plan 05 SUMMARY.md (`test-question-directional-1` original addition)
- `.planning/milestones/v2.5-phases/58-templates-cli-default-dataset/58-E2E-AUDIT.md` (target file)

## Decision deferred at phase close

Operator approved Phase 75 close with this todo filed (vs. inline 58-E2E-AUDIT.md edit). Disposition: address whenever convenient — no v2.9 deadline.
