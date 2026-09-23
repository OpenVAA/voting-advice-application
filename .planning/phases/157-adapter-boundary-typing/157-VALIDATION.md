---
phase: 157
slug: adapter-boundary-typing
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-28
---

# Phase 157 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `157-RESEARCH.md` § Validation Architecture. The Per-Task
> Verification Map is seeded from the requirement→test map and is filled in
> with concrete task ids once the PLAN.md files exist.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | **vitest** (catalog `^3.2.4`) for unit; **pgTAP** for database; **Playwright** for E2E |
| **Config file** | `apps/frontend/vitest.config.ts` (jsdom, `globals: true`, `$lib`/`$types`/`$voter`/`$candidate` aliases, `$env/dynamic/public` + `$app/*` mocks) · `packages/app-shared/vitest.config.ts` (`export default {}`, discovery only via `vitest.workspace.ts:1`) · `tests/playwright.config.ts` · pgTAP files under `apps/supabase/supabase/tests/database/` |
| **Quick run command** | `yarn workspace @openvaa/app-shared test:unit` / `yarn workspace @openvaa/frontend test:unit` |
| **Full suite command** | `yarn build && yarn test:unit && yarn lint:check` then `cd apps/supabase && npx supabase test db` then `yarn test:e2e` |
| **Estimated runtime** | ~30s per-workspace unit · ~3 min full unit + lint · ~2 min pgTAP · ~10 min E2E |

**Framework install required: none.** vitest, ESLint + `@typescript-eslint/parser` + `svelte-eslint-parser`, `zod@4.3.6` and pgTAP are all already present in the tree.

---

## Sampling Rate

- **After every task commit:** Run the owning workspace's `test:unit` (≤ 30s), plus `yarn lint:check` if the task touched ESLint config, `package.json` scripts, or comments.
- **After every plan wave:** Run `yarn build && yarn test:unit && yarn lint:check`. For the SQL wave, additionally `npx supabase test db` and `yarn db:lint:sql` against a freshly reset DB.
- **Before `/gsd-verify-work`:** `yarn db:reset-with-data` → ONE fresh `yarn dev` on :5173 → full `yarn test:e2e`, green. Per CLAUDE.md § E2E Hard Rule this is a cardinal gate; a "did not run" spec counts as a failure.
- **Max feedback latency:** 30 seconds (per-task unit run).

---

## Per-Task Verification Map

Seeded from `157-RESEARCH.md` § Validation Architecture → "Phase Requirements → Test Map". Task ids are filled in by the executor as plans land; the Requirement / Test Type / Command / File-Exists columns are the binding contract.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | 0 | REVIEW-ADP-01 | — | Each stored JSONB shape parses; `{}` parses; an unknown key at EACH nesting level is rejected | unit | `yarn workspace @openvaa/app-shared test:unit` | ❌ W0 — `packages/app-shared/src/data/schemas/*.test.ts` | ⬜ pending |
| TBD | TBD | 2 | REVIEW-ADP-01 | — | Provider degrades to the smart default rather than throwing on a malformed row | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ W0 — extend `supabaseDataProvider.test.ts` (exists) | ⬜ pending |
| TBD | TBD | 2 | REVIEW-ADP-01 | — | Zero `as Json as unknown as` casts on adapter reads in `lib/api/adapters/supabase/**` | grep-guard | `yarn assert:adapter-casts` (new, chained into `lint:check`) | ❌ W0 — `scripts/assert-adapter-casts.mjs` | ⬜ pending |
| TBD | TBD | 2 | REVIEW-ADP-02 | — | `convertFilterValue`: scalar → `[v]`, array → array, `undefined` → `[null]` | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ W0 — `adapters/supabase/utils/convertFilterValue.test.ts` | ⬜ pending |
| TBD | TBD | 1 | REVIEW-ADP-02 | — | `get_nominations` with `p_election_round` returns only matching rows; NULL returns all | pgTAP | `cd apps/supabase && npx supabase test db` | ❌ W0 — no `get_nominations` pgTAP exists at all | ⬜ pending |
| TBD | TBD | 1 | REVIEW-ADP-03 | — | `get_questions` returns categories AND questions in one call | pgTAP | same | ❌ W0 — `tests/database/11-question-rpcs.test.sql` | ⬜ pending |
| TBD | TBD | 1 | REVIEW-ADP-03 | — | Filter branches × 3 axes: NULL param → all; NULL/empty column → included; non-matching → excluded | pgTAP | same | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | REVIEW-ADP-03 | T-157-RPC | RPC is `SECURITY INVOKER` (`prosecdef` false) and granted only to `anon, authenticated` | pgTAP | same | ❌ W0 — copy shape from `07-rpc-security.test.sql:33-47` | ⬜ pending |
| TBD | TBD | 2 | REVIEW-ADP-03 | — | Adapter's question read produces the same `{categories, questions}` shape as before | unit | `yarn workspace @openvaa/frontend test:unit` | ✅ extend `supabaseDataProvider.test.ts` | ⬜ pending |
| TBD | TBD | gate | REVIEW-ADP-03 | — | Voter question flow still renders end-to-end | E2E | `yarn test:e2e` | ✅ existing voter journey specs | ⬜ pending |
| TBD | TBD | 3 | REVIEW-ADP-04 | — | `grep -rin 'withauth'` → 0 AND `grep -rn 'WithOptionalAuth'` → 0 | grep-guard | phase VERIFICATION | ❌ W0 (or one-time recorded check) | ⬜ pending |
| TBD | TBD | 3 | REVIEW-ADP-04 | T-157-PWD | `setPassword` forwards / does not forward the current password, per the chosen § D.5 branch | unit | `yarn workspace @openvaa/frontend test:unit` | ✅ `supabaseDataWriter.test.ts:173-195` exists — inverts | ⬜ pending |
| TBD | TBD | gate | REVIEW-ADP-04 | T-157-PWD | Candidate can still change their password | E2E | `yarn test:e2e` | ✅ candidate journey; a11y anchor `candidate-a11y.spec.ts:322` | ⬜ pending |
| TBD | TBD | 0 | REVIEW-ADP-05 | — | `getLocalized`'s 3-tier fallback, from its new home in app-shared | unit | `yarn workspace @openvaa/app-shared test:unit` | ✅ moves — `getLocalized.test.ts`, 9 cases | ⬜ pending |
| TBD | TBD | 3 | REVIEW-ADP-05 | — | Both OIDC providers still resolve their own claim config after the split | unit | `yarn workspace @openvaa/frontend test:unit` | ✅ `signicat.test.ts:152-153`, `idura.test.ts:149-150` | ⬜ pending |
| TBD | TBD | 4 | REVIEW-ADP-06 | — | The guard FIRES on an import AND on a member access, in `.ts` and `.svelte`, in each guarded dir | unit (ESLint-in-vitest) | `yarn workspace @openvaa/frontend test:unit` | ❌ W0 — `lib/_guards/eslint-adapter-boundary-guard.test.ts` | ⬜ pending |
| TBD | TBD | 4 | REVIEW-ADP-06 | — | The guard is SILENT in the allowed loci (adapter, `lib/supabase`) — discriminating, not constant | unit | same | ❌ W0 | ⬜ pending |
| TBD | TBD | 4 | REVIEW-ADP-06 | — | The inherited bans survive (flat-config REPLACE-not-MERGE regression) | unit | same | ❌ W0 | ⬜ pending |
| TBD | TBD | 4 | REVIEW-ADP-06 | — | The guard fails on a 9th site, and was blind before it was installed | negative control | recorded in a ledger | ❌ W0 — `157-NEGATIVE-CONTROL-LEDGER.md` | ⬜ pending |
| TBD | TBD | 0 | REVIEW-ADP-06 | — | Logger emits a conformant record at/above level, drops below it; `err` serialises `name`/`message`/`stack` | unit | `yarn workspace @openvaa/app-shared test:unit` | ❌ W0 — `packages/app-shared/src/logging/logger.test.ts` | ⬜ pending |
| TBD | TBD | 5 | REVIEW-ADP-06 | — | `grep -rn 'logDebugError'` → 0 across `apps/` and `packages/` | grep | phase VERIFICATION | ❌ one-time | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/app-shared/src/data/schemas/*.test.ts` — REVIEW-ADP-01, one file per JSONB column, at least one rejection case **per nesting level** (`.strict()` does not descend — `packages/dev-seed/src/template/schema.ts:35-41`)
- [ ] `scripts/assert-adapter-casts.mjs` plus a `lint:check` chain-MEMBERSHIP assertion — REVIEW-ADP-01
- [ ] `apps/frontend/src/lib/api/adapters/supabase/utils/convertFilterValue.test.ts` — REVIEW-ADP-02
- [ ] `apps/supabase/supabase/tests/database/11-question-rpcs.test.sql` — REVIEW-ADP-02 and 03. Must also carry the **first-ever** `get_nominations` result-shape coverage; none exists today.
- [ ] `apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts` — REVIEW-ADP-06, with the `beforeAll` ESLint warm-up at `120_000` (the `eslint-store-guard.test.ts` precedent)
- [ ] `.planning/phases/157-adapter-boundary-typing/157-NEGATIVE-CONTROL-LEDGER.md` — REVIEW-ADP-06, rows created **before** the first injection (the Phase 143 rule)
- [ ] `packages/app-shared/src/logging/logger.test.ts` — REVIEW-ADP-06
- [ ] Framework install: **none required.**

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GoTrue `current_password` gate behaviour (accepted? enforced? config key exists at the pinned CLI?) | REVIEW-ADP-04 | Server-side auth behaviour of a third-party service; not observable from a unit test, and the outcome selects between plan branches (a) and (b) for the candidate-settings field | Run the § D.5 spike against the local stack before the settings-form task: (1) `updateUser({password, current_password})` typechecks at `@supabase/auth-js` 2.99.3; (2) a `config.toml` key mapping to `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD` exists at `supabase: ^2.78.1`; (3) with the gate off, GoTrue rejects / ignores / errors on a wrong `current_password`. **If any of the three fails, take branch (a).** |
| ESLint flat-config REPLACE semantics across **two overlapping** config objects for the same rule | REVIEW-ADP-06 | The research flags this as reasoned rather than measured; getting it wrong silently deletes an inherited ban | 5-minute `lintText` probe using the `eslint-store-guard.test.ts` apparatus, before committing to the one-block-vs-two-block guard shape. Encode the answer as a permanent regression case in the guard self-test. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
