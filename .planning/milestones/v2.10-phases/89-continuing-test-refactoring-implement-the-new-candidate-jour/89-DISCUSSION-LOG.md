# Phase 89: Continuing test refactoring — implement the new candidate journey (and related edits) per TEST-INVENTORY-REFACTOR-4.md - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 89-continuing-test-refactoring-implement-the-new-candidate-jour
**Areas discussed:** Plan partition, Fixture pattern, baseV1 mutation vs fork, Old specs + emailBucket

---

## baseV1 mutation vs fork

| Option | Description | Selected |
|--------|-------------|----------|
| Mutate baseV1 in place | Single template. Voter mega-journey and candidate mega-journey share one source of truth. TIR4:25-32 + 99 already require voter mega-journey to assert new hero/info/filtered-info — so any benefit of a fork is moot. Risk: voter-mega-journey must absorb the new assertions in lockstep. | ✓ |
| Fork to baseV2 | Candidate mega-journey gets isolation, voter mega-journey stays frozen on current baseV1. Cost: two templates to maintain. TIR4:25-32 still requires voter mega-journey to test new hero/info — so we'd need to update it to consume baseV2 anyway, defeating isolation. | |

**User's choice:** Mutate baseV1 in place (Recommended)
**Notes:** Decision is consistent with TIR4's explicit requirement that voter mega-journey assertions on hero/info/filtered-info content land in the same data shape as the candidate mega-journey's requirements. Phase 88-04's seed-time `cardContents` resolver convention (ADR-88-04-01) is preserved.

---

## Fixture pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Function-fixtures, fresh | All 12 authored as function-fixtures (createCandidateLoginPage(page), etc.) in tests/tests/fixtures/candidate/*.fixture.ts, composed into a new fixtures/candidate-mega.ts root — mirrors the Phase 88-04 views.ts pattern. Legacy 7 classes stay UNTOUCHED while old candidate specs still consume them (parallel landing). Retire legacy classes only after old specs are deleted. | ✓ |
| Extend legacy classes | Add 5 new PageObject classes (emailBucket, ToU, ForgotPassword, PasswordSetter, LogoutButton) to tests/tests/pages/candidate/, extend the existing 7 with new methods per TIR4 (e.g., ProfilePage.fillPortrait), wire all 12 into fixtures/index.ts. Lower churn; but solidifies the legacy pattern rather than converging on function-fixtures. | |
| Mixed (legacy classes + new function-fixtures) | Extend the 7 legacy classes for the overlap; author the 5 brand-new ones as function-fixtures in fixtures/candidate/. Pragmatic but leaves the candidate test surface with two coexisting styles long-term. | |

**User's choice:** Function-fixtures, fresh (Recommended)
**Notes:** Converges on the Phase 88-04 function-fixture pattern. Legacy `tests/tests/pages/candidate/*Page.ts` classes coexist during 89-01..89-04 and are pruned (only those whose consumers are deleted) in 89-LAST.

---

## Plan partition

| Option | Description | Selected |
|--------|-------------|----------|
| 5 plans as proposed | 89-01 baseV1 extensions + voter-mega assertions → 89-02 candidate fixtures → 89-03 candidate mega-journey → 89-04 settings perms (parallel-safe) → 89-LAST legacy retirement. | ✓ |
| Merge fixtures + spec (4 plans) | 89-01 baseV1 + voter-mega → 89-02 candidate fixtures AND mega-journey spec in one plan → 89-03 perms → 89-LAST retire. Risk: 89-02 becomes a very large plan (~12 fixtures + 200+-step spec). | |
| Split baseV1 from voter-mega (6 plans) | 89-01 baseV1 extensions → 89-02 voter-mega assertions for new content → 89-03 candidate fixtures → 89-04 candidate mega → 89-05 perms → 89-LAST retire. Cleaner isolation; more commit overhead. | |

**User's choice:** 5 plans as proposed (Recommended)
**Notes:** Dependency order is data → fixtures → spec → independent perms → retirement. 89-04 perms are parallel-safe with 89-02/89-03 via per-template `externalIdPrefix` decoupling (Phase 88-03 lineage).

---

## Old specs disposition (89-LAST scope)

| Option | Description | Selected |
|--------|-------------|----------|
| Delete fully-absorbed; keep deferred-only | 89-LAST deletes the 5 specs absorbed by mega-journey + perms (auth, password, registration, questions, required-info) AND the absorbed cases (7.1.2/3/4) from candidate-settings.spec.ts. KEEP the 4 specs with TIR5-deferred tests (settings residual, profile, profile-validation, translation, bank-auth) until those phases land. | ✓ |
| Delete only fully-redundant specs (5 files) | Delete only the 5 fully-absorbed specs. Leave candidate-settings.spec.ts untouched (don't excise 7.1.2/3/4) — those then run BOTH in the old spec and as perms. Simpler diff, accepts some duplicate coverage during transition. | |
| Defer all retirement to a future 90-LAST | 89 lands new fixtures + mega-journey + perms ONLY. Legacy 10 candidate specs stay 100% intact. Retirement happens after TIR5 items are also rewritten in a future milestone (matches 88-NN-style parallel-only landing). | |

**User's choice:** Delete fully-absorbed; keep deferred-only (Recommended)
**Notes:** Avoids duplicate coverage of 7.1.2/3/4 (now covered by 89-04 perms) while preserving TIR5-deferred coverage that hasn't been migrated. Legacy PageObject classes pruned ONLY when their last consumer is deleted.

---

## emailBucket fixture scope

| Option | Description | Selected |
|--------|-------------|----------|
| emailBucket wraps emailHelper | New emailBucket function-fixture exposes expectEmail/getEmail/getLinksInEmail per TIR4:58-63 and internally calls existing emailHelper.ts utilities (getLatestEmailHtml, extractLinkFromHtml, countEmailsForRecipient). No churn to emailHelper; new code consumes the fixture; legacy candidate-registration.spec.ts continues using emailHelper directly until deleted. | |
| Rewrite emailHelper into emailBucket only | Replace emailHelper.ts entirely with the emailBucket fixture. Forces all consumers (including any kept legacy specs) to switch in 89-02. Higher churn; risks breaking specs we're intentionally leaving in place. | |
| Both coexist long-term | Keep emailHelper.ts AND build emailBucket as a separate fixture. No internal coupling. Pragmatic but leaves two ways to do the same thing indefinitely. | ✓ |

**User's choice:** Both coexist long-term — "but we'll retire all the legacy stuff at the end of the milestone."
**Notes:** Operator's verbatim qualifier: legacy emailHelper.ts is NOT retired in 89-LAST. End-of-milestone (v2.10 close or v2.11+ cleanup) is the scheduled retirement window — once all legacy consumers (including TIR5-kept-alive specs) are migrated or replaced. Researcher is free to choose whether 89-02's emailBucket is implemented as a thin wrapper over emailHelper OR stand-alone.

---

## Claude's Discretion

The operator deferred the following details to researcher / planner:
- Exact filenames and playwright-project names for the new candidate fixture composition root, the candidate-mega spec, the 3 perm templates/setups/teardowns/specs, and the 3 perm playwright-project triples.
- Whether the candidate-mega spec is one `test()` block or one `test.describe('...', { mode: 'serial' })` with N sub-tests (match the shape 88-01/88-04 settled on for voter-mega-journey).
- Wiring strategy for the new function-fixtures (separate composition root file vs. extension of `fixtures/views.ts`).
- Internal implementation of `emailBucket` (wrap `emailHelper.ts` or stand-alone).
- Exact testid additions to existing candidate-app Svelte components (login, ToU, password-setter, forgot-password, profile-portrait, candidate-home task tiles, questions-overview category-expanders, preview-page).
- Whether 88-04's v2.11+ `QuestionInCardContent` follow-up should be re-surfaced during 89-01 baseV1 mutations if a similar election-specificity gap appears (flag-only; does NOT block 89).

## Deferred Ideas

- All TIR5 "STILL TO BE ADDED LATER" items (localisation, hero video, extended question info, a11y, visual drift, performance, 7.1.1, 3.3.1, 4.2.5-7, 5.1.1-6, 7.1.7/8, 7.1.10/11/13-17, 27.1.1, 28.1.1-3, 34.*, 35.*, 36.*, 37.*).
- `emailHelper.ts` retirement → end-of-milestone (v2.10 close / v2.11+).
- Phase 88-04 `QuestionInCardContent` election-specificity TODO → v2.11+.
- Phase 88-04 `e2e.test.ts:431` `questions.fixed.length` drift → already deferred; 89-01 may aggravate but does not fix.
- Legacy PageObject classes in `tests/tests/pages/candidate/` → pruned only when their last consumer is deleted.
