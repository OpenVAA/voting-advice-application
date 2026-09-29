---
phase: 164
slug: returns-table-nullability-audit-single-override-mechanism
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-28
---

# Phase 164 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded by `/gsd-plan-phase 164` from `164-RESEARCH.md` § Validation Architecture (`:1051-1107`).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (`catalog:` pin, root `package.json` devDependencies); Playwright `catalog:` for E2E |
| **Config file** | per-workspace; frontend `test:unit` = `vitest run` (`apps/frontend/package.json`) |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit supabaseDataProvider` |
| **Full suite command** | `yarn test:unit` (= `yarn assert:unit-coverage && turbo run test:unit`, root `package.json:28`) |
| **Static-assert layer** | `scripts/assert-*.mjs`, wired via `assert:*` into `test:unit` / `test:e2e` / `lint:check` |
| **Typecheck** | `yarn typecheck` (`turbo run typecheck`) + `yarn workspace @openvaa/frontend check` |
| **Full E2E** | `yarn test:e2e` |
| **Estimated runtime** | quick ~30 s · unit suite ~2–4 min · E2E ~15 min |

---

## Sampling Rate

- **After every task commit:** `yarn workspace @openvaa/frontend test:unit supabaseDataProvider`
  **and** `node scripts/assert-rpc-return-nullability.mjs` (both < 30 s)
- **After every plan wave:** `yarn typecheck` + `yarn workspace @openvaa/frontend check` + `yarn test:unit`
- **Before `/gsd-verify-work`:** the full ladder with `yarn test:e2e` **last**, after `yarn db:reset`
- **Max feedback latency:** 30 seconds

---

## Requirement → Verification Map

| Req | Behaviour | Layer | Automated command | Exists? |
|---|---|---|---|---|
| CIGATE-04 | The 3 RPCs and their columns are derived from `apps/supabase/supabase/schema/**`, not prose | static script | `node scripts/assert-rpc-return-nullability.mjs` | ❌ Wave 0 |
| CIGATE-04 | The committed enumeration matches the derivation | static script | script `--write` + `git diff --exit-code -- packages/supabase-types/RPC-NULLABILITY.md` | ❌ Wave 0 |
| CIGATE-04 | A 4th RPC / new column is caught | static script (negative control) | inject → expect exit 1 → revert | ❌ Wave 0 |
| CIGATE-05 | `parent_nomination_id` reads `string \| null` at the consumer | typecheck | `yarn workspace @openvaa/frontend check` | ✅ command exists; assertion new |
| CIGATE-05 | A root nomination yields `parentNominationId: null` and no `parentNominationType` | unit | `yarn workspace @openvaa/frontend test:unit supabaseDataProvider` | ❌ Wave 0 (fixture `orgNomRow` exists at `:1488`) |
| CIGATE-05 | Removing the null-guard **fails** | typecheck mutation | `164-NEGATIVE-CONTROL.md` `NC-1` | ❌ Wave 0 |
| CIGATE-05 | No ad-hoc RPC-return nullability cast survives | static script | the discriminating grep inside the script | ❌ Wave 0 |
| CIGATE-05 | The override file itself is typechecked | typecheck | `yarn typecheck` after adding `"typecheck": "tsc --noEmit"` to `packages/supabase-types/package.json` | ❌ Wave 0 — script absent today |
| CIGATE-04/05 | Regeneration does not silently revert | CI + local | `yarn db:start && yarn db:types && git diff --exit-code -- packages/supabase-types/src/database.ts` | ❌ Wave 0 |
| CIGATE-04/05 | The drift job is not silently deletable | unit (repo-meta) | vitest assertion over `.github/workflows/main.yaml` | ❌ Wave 0 |
| — | No behavioural regression in the app | E2E | `yarn test:e2e` | ✅ exists |

---

## Per-Task Verification Map

*Filled by `/gsd-validate-phase` once PLAN task IDs exist. Every task must map to one row of the
Requirement → Verification Map above; no 3 consecutive tasks may pass without an automated verify.*

| Task ID | Plan | Wave | Requirement | Threat Ref | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------|-------------------|--------|
| TBD | — | — | CIGATE-04 / CIGATE-05 | — | — | — | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `scripts/assert-rpc-return-nullability.mjs` — CIGATE-04 + CIGATE-05 (grep half)
- [ ] `packages/supabase-types/RPC-NULLABILITY.md` — CIGATE-04's committed enumeration artifact
- [ ] `packages/supabase-types/src/database.overrides.ts` — CIGATE-05 (the single override locus)
- [ ] `packages/supabase-types/src/database.merged.ts` — CIGATE-05
- [ ] `packages/supabase-types/package.json` — add `"typecheck": "tsc --noEmit"`
      **(hard prerequisite — without it `turbo run typecheck` skips the package and the
      renamed-column-breaks-loudly property is inert)**
- [ ] `packages/supabase-types/src/index.ts:1` — split into two export lines (barrel re-point)
- [ ] root `package.json` — add `assert:rpc-nullability`; append it to `lint:check`
- [ ] new `it(...)` in `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts`
- [ ] repo-meta vitest assertion for the CI job + the `lint:check` link
- [ ] `.github/workflows/main.yaml` — `supabase-types-drift` job (**sequenced after Phase 163**)
- [ ] `.planning/phases/164-*/164-NEGATIVE-CONTROL.md` — the `NC-1` / `NC-2` / `NC-3` ledger

*No new framework install is needed — vitest, turbo and the `assert-*.mjs` pattern all exist.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `yarn db:types` regeneration survives the override locally | CIGATE-04/05, criterion 4 | needs a running local Supabase (`--local`); the CI job automates it, but criterion 4 says "regeneration is performed and observed" | `yarn db:start` → `yarn db:types` → `git diff --exit-code -- packages/supabase-types/src/database.ts` → `yarn typecheck` |
| Negative control `NC-1` | CIGATE-05, criterion 2 | a deliberate source mutation that must be reverted; cannot live in the committed suite | remove the `!= null` guard → `yarn workspace @openvaa/frontend check` → expect TS error → revert |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30 s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
