# Phase 71 — Out-of-scope findings evaluation (v2.8 fixability triage)

**Compiled:** 2026-05-10 (post-Phase-71 close)
**Sources:** `71-REVIEW.md` §"Out-of-scope items observed but not flagged" + `71-VERIFICATION.md` §"Anti-Patterns Found"
**Purpose:** Surface findings that landed *outside* TYPING-01's scope but could still be cleaned up in v2.8 before milestone close. Each row carries an effort estimate, milestone-fit verdict, and recommended disposition.

---

## Triage table

| # | Finding | Source | Effort | v2.8 fit | Disposition |
|---|---------|--------|--------|----------|-------------|
| 1 | Duplicate JSDoc block at `apps/frontend/src/lib/components/input/Input.type.ts:45-54` (two adjacent `@typeParam` blocks) | REVIEW §OOS | ~5 min (delete duplicate) | ✅ FIT | Apply now (cosmetic, zero risk). |
| 2 | Broken `FilterGroupLike<TEntity>` alias at `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.ts:43` references un-imported `MaybeWrappedEntityVariant` | REVIEW §OOS + Phase 71-02 SUMMARY (logged) | ~10 min (verify zero consumers, delete or fix import) | ✅ FIT | Apply now if `git grep -nE "FilterGroupLike\b"` confirms zero consumers (RESEARCH-style verification, mirroring the `_Unused` deletion in Plan 71-02). |
| 3 | Pre-existing locale-extraction bug at `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:49` — `window.location.pathname.split('/')[1] \|\| 'en'` yields `'candidate'` for unprefixed candidate routes | REVIEW §OOS | ~30 min (write test, fix with proper i18n locale read, verify) | ⚠️ STRETCH | Real bug but adapter-internal — needs unit-test coverage of the affected paths. Could land as a small standalone fix in v2.8 OR carry to v2.9 with a dedicated todo. **Recommend: capture as todo, defer to v2.9** unless the locale-extraction is on a known critical path (current usage is image-upload key prefixing — affects storage-bucket layout, not user-facing UX). |
| 4 | Pre-existing `createRemoteJWKSet` mock shape at `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts:46` returns the keyset directly instead of a factory function | REVIEW §OOS | ~15 min (rewrite mock to match `jose` API surface) | ✅ FIT | Test-only fix; safe to land. The current mock works because the test code calls the result without awaiting the factory; tightening it brings the mock in line with the real `jose` API and makes it harder to write incorrect tests against the helper. |
| 5 | 27 `unused-imports/no-unused-vars` warnings in `apps/frontend/` (CONTEXT explicit: opportunistic, not gated) | CONTEXT D-04 deferred + REVIEW §OOS + VERIFICATION §Out-of-scope | ~30-60 min (mostly mechanical: rename to `_`-prefixed args per `argsIgnorePattern: '^_'`) | ✅ FIT | Mechanical sweep. Could land as a single small commit `chore(v2.8): clear apps/frontend unused-imports/unused-vars warnings`. **Recommend: apply now** to bring frontend warning count to 0 alongside the 0-error baseline. |
| 6 | 98 pre-existing playwright warnings in `tests/` (`playwright/no-conditional-in-test`, `no-raw-locators`, `no-networkidle`) | REVIEW §OOS + VERIFICATION §Out-of-scope | hours-to-days | ❌ NO FIT | These are not auto-fixable — each requires manual rewrite (replace `if (...)` branches with explicit assertions; lift raw locators to `getByRole`/`getByTestId`; replace `networkidle` with element-state waits). **Recommend: dedicated v2.9 hygiene phase** ("test infrastructure cleanup"). |
| 7 | 3 legacy un-justified `// eslint-disable-next-line @typescript-eslint/no-explicit-any` sites at `popupComponent.type.ts:26`, `components.ts:34`, `buildRoute.ts:58` | PATTERNS + REVIEW §OOS | ~15-30 min each (re-evaluate each: can we use the new `// reason:` convention? can we narrow to a real type now that the asSupabaseMock pattern is anchored? or do they genuinely need the disable?) | ✅ FIT | Each one is small. Now that D-04 (`// reason:`) is anchored project-wide and PATTERNS.md documents the analog patterns, retrofitting these 3 with either real types or `// reason:` annotations brings the codebase to 100% justified-disable parity. **Recommend: apply now** as a tiny `chore(v2.8): retrofit legacy any disables with // reason: justifications`. |
| 8 | WR-01 — Plan 71-03 auto-fix sweep changed `not.toBeVisible()` → `toBeHidden()` at 14 sites; Playwright treats them as equivalent but the change crossed test-behavior boundaries | REVIEW WR-01 + VERIFICATION §Anti-Patterns | already verified as project-conformant; needs operator confirmation via parity smoke | ✅ FIT | Confirmed via the bundled Phase 69 parity-gate follow-up todo (`.planning/todos/pending/2026-05-09-phase-69-parity-gate-followup.md`). No source change required beyond the already-applied `dialogCount → dialogLocator` rename at `voter-popups.spec.ts:217`. |
| 9 | IN-02 — Production adapter `// reason:` anchors are cluster-level (one anchor per file), not per-cast | REVIEW IN-02 | ~30 min to per-site-distribute the existing 1 anchor across 13 cast sites in `supabaseDataProvider.ts`, with parseStoredImage-vs-parseAnswers reason-text differentiation | ⚠️ STRETCH | Convention-tightening only. The grep gate (`≥ 7`) is satisfied (15 matches in `apps/frontend/src/`). A strict per-cast reading would expect ~15 distributed lines. **Recommend: defer to v2.9** unless the convention catches a future bug — easier to enforce uniformly going forward than to retrofit just the supabaseDataProvider.ts cluster. |
| 10 | IN-03 — `getRoute.svelte.ts:36-44` — pre-existing `setStore` cast at line 41 unrelated to phase 71 | REVIEW IN-03 ("No action required") | n/a | ❌ N/A | REVIEW explicitly marks "no action required". Skipping per reviewer guidance to avoid gold-plating. |
| 11 | IN-01 — Prettier glitches in 3 `tests/tests/setup/templates/variant-*.ts` files | REVIEW IN-01 + VERIFICATION §Anti-Patterns | ✅ APPLIED 2026-05-10 | — | Fixed in this v2.8 cleanup pass — `yarn prettier --write` applied to the 3 files. |

---

## Recommended v2.8 cleanup commit batch

The "✅ FIT" rows above translate to a small follow-up commit batch that can land before milestone close:

| Order | Commit subject | Items | Estimated total effort |
|-------|---------------|-------|------------------------|
| 1 | `chore(v2.8): apply prettier to 3 variant template files (REVIEW IN-01)` | #11 | ✅ done 2026-05-10 |
| 2 | `chore(v2.8): rename dialogCount → dialogLocator in voter-popups.spec.ts (REVIEW WR-01)` | #8 (the rename portion) | ✅ done 2026-05-10 |
| 3 | `chore(v2.8): delete duplicate JSDoc block in Input.type.ts (REVIEW OOS)` | #1 | ~5 min |
| 4 | `chore(v2.8): delete or fix broken FilterGroupLike alias (REVIEW OOS)` | #2 | ~10 min |
| 5 | `chore(v2.8): retrofit 3 legacy any disables with // reason: justifications (PATTERNS legacy)` | #7 | ~30-60 min |
| 6 | `chore(v2.8): clear 27 unused-imports/no-unused-vars warnings in apps/frontend/ (CONTEXT D-04 opportunistic)` | #5 | ~30-60 min |
| 7 | `test(v2.8): tighten createRemoteJWKSet mock shape (REVIEW OOS)` | #4 | ~15 min |

**Total estimated cleanup effort: ~2-3 hours.**

After this batch, the only remaining "real bug" is item #3 (locale-extraction bug at `supabaseDataWriter.ts:49`) and the convention-tightening item #9 — both recommended for v2.9.

---

## v2.9 candidate todos (carry-forward)

| Item | Source | Notes |
|------|--------|-------|
| Locale-extraction bug at `supabaseDataWriter.ts:49` | This file row #3 | Real bug; needs unit-test coverage. |
| 98 playwright warnings (`no-conditional-in-test`, `no-raw-locators`, `no-networkidle`) | This file row #6 | Dedicated test-infra hygiene phase. |
| `// reason:` per-cast distribution in supabaseDataProvider.ts (D-04 strict reading) | This file row #9 | Convention-tightening; non-gating. |
| `getRoute.svelte.ts` `setStore` cast cleanup | REVIEW IN-03 | Strictly OOS per reviewer; reviewer says "future cleanup pass might consolidate". |

These three should be captured as `.planning/todos/pending/` entries at v2.8 milestone close.

---

_Compiled by Claude (post-phase-71 cleanup pass)_
