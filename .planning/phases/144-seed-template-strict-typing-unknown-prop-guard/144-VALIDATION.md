---
phase: 144
slug: seed-template-strict-typing-unknown-prop-guard
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-23
validated: 2026-08-25
---

# Phase 144 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `144-RESEARCH.md` § Validation Architecture. Every command below was measured.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `vitest` **3.2.4** (root `vitest.workspace.ts` discovers `packages/dev-seed/vitest.config.ts`, an intentional empty stub) |
| **Config file** | `packages/dev-seed/vitest.config.ts` |
| **Typecheck** | `tsc` **5.9.3** via `packages/dev-seed/tsconfig.json`, extending `@openvaa/shared-config/ts` |
| **Quick run command** | `yarn workspace @openvaa/dev-seed test:unit` |
| **Full suite command** | `yarn test:unit` |
| **Typecheck gate** | `TURBO_FORCE=true npx turbo run typecheck` (22 tasks) — **not in any gate today; D-06 adds it** |
| **Estimated runtime** | quick ~10s · full unit suite ~2min · typecheck ~20s · E2E ~15min |

---

## Sampling Rate

- **After every task commit:** `yarn workspace @openvaa/dev-seed test:unit` (fast, no DB), **plus**
  `TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/dev-seed` once `144-02` has landed.
- **After every plan wave:** `yarn test:unit` + `TURBO_FORCE=true yarn lint:check`.
- **Before `/gsd-verify-work`:** the full seven-gate set green at one HEAD.
- **Max feedback latency:** ~20 seconds at task granularity.

**⚠ D-06b applies to every evidence-bearing run.** `turbo`'s `lint` **and** `typecheck` tasks are
both cached (`turbo.json:18-22`, no `"cache": false`). A replayed green is a claim about a *previous*
tree. Evidence runs force; the shipped gate need not. `yarn lint:check --force` is **forbidden** —
yarn appends the argument past the `&&` chain and it silently does nothing.

---

## Per-Task Verification Map

| Req | Behaviour | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|
| TMPL-01 | `elections._constituencies` / `candidates._elections` are type errors; `questions._elections` is **not** | typecheck (`@ts-expect-error` + clean case) | `TURBO_FORCE=true npx turbo run typecheck` | ✅ `tests/template/strictRowTypes.type-test.ts` | ✅ green |
| TMPL-01 | Every legal field casing is admitted (`firstName` yes, `sortOrder` no) | unit | `… test:unit tests/template/permittedKeys.test.ts` | ✅ landed | ✅ green |
| TMPL-02 | Unknown row prop throws naming `external_id` + key + collection | unit (pure, no DB) | `… test:unit tests/assertKnownRowProps.test.ts` | ✅ landed | ✅ green |
| TMPL-02 | Pass 0 is wired ahead of `bulkImport` | unit (mocked writer) | `… test:unit tests/writer.test.ts` | ✅ exists; new cases | ✅ green |
| TMPL-02 | All 30 built-ins pass the guard (**must-NOT-fire** control) | unit | `… test:unit tests/assertKnownRowProps.builtins.test.ts` | ✅ landed | ✅ green |
| TMPL-02 | Criterion 2 on the real `--template ./custom.ts` path | **manual, DB-backed** | `yarn db:seed --template "$PWD/…"` | ✅ fixtures landed | ⚠ manual — both halves measured in the ledger |
| criterion 4 | `planLinks` dispatches exactly the hand-enumerated pairs (**all 10**, the 3 bare forms included) | unit (pure) | `… test:unit tests/template/linkSentinels.test.ts` | ✅ landed | ✅ green |
| **source (4)** | All 10 relationship-reference pairs are admitted; drift from the RPC's SQL map is checked or its gap filed | unit | `… test:unit tests/assertKnownRowProps.test.ts` | ✅ landed | ✅ green |
| D-03a | Both collection keyings resolve to one entry; **an unrecognised collection throws** | unit | `… test:unit tests/assertKnownRowProps.test.ts` | ✅ landed | ✅ green |
| D-09 | `entity_type` is denied; `project_id` / `id` / `created_at` / `updated_at` are **excluded, not denied** | unit | `… test:unit tests/assertKnownRowProps.test.ts` | ✅ landed | ✅ green |
| ASSERT-04 | The **4** blind sites fail on schema-field removal, pass with it present — both directions observed per site | unit (two-run, injected) | `… test:unit tests/template.test.ts tests/template/latent.schema.test.ts` | ✅ exist | ✅ green |
| ASSERT-04 | All 30 built-ins pass the strict schema (D-04 + D-07 together) | unit | `… test:unit tests/cli/resolve-template.test.ts` (extend) | ✅ exists | ✅ green |

| **beyond plan** | The `lint:check` chain still carries `typecheck:tests` — the D-06 gate cannot be silently narrowed | unit | `… test:unit tests/ciTypecheckGate.test.ts` | ✅ landed (not in the plan) | ✅ green |
| **beyond plan** | `LINK_SENTINELS` rule shapes are type-pinned | typecheck | `TURBO_FORCE=true npx turbo run typecheck` | ✅ `tests/template/linkSentinelRules.type-test.ts` | ✅ green |
| **beyond plan** | `entityType` camel form cannot bypass the `entity_type` deny-list (review finding CR-01) | unit | `… test:unit tests/assertKnownRowProps.test.ts` | ✅ `tests/fixtures/negctl-questions-entity-type-camel.ts` | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ⚠ manual*

---

## Wave 0 Requirements

- [x] `packages/dev-seed/tests/template/permittedKeys.test.ts` — TMPL-01 derivation + casing
- [x] `packages/dev-seed/tests/template/strictRowTypes.type-test.ts` — the `@ts-expect-error` control + the D-01 legality case
- [x] `packages/dev-seed/tests/template/linkSentinels.test.ts` — criterion 4 derivation, hand-enumerated
- [x] `packages/dev-seed/tests/assertKnownRowProps.test.ts` — TMPL-02 + source (4) + D-03a keying + deny-list
- [x] `packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts` — the 30-template must-NOT-fire control
- [x] `packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts`, `negctl-questions-answers.ts` — D-08 fixtures
- [x] `packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts` — D-09 fixture

**No framework install needed.** ⚠ Residue to file: `packages/dev-seed/package.json`'s lint script is
`eslint … src/`, so every new `tests/` spec above is **unlinted** — the same class of gap as Phase
143's D-08 (frontend lint-script scope). File as a standing todo; do not widen it in this phase.

---

## Manual-Only Verifications

| Behaviour | Requirement | Why Manual | Test Instructions |
|---|---|---|---|
| Criterion 2's OLD (blind) half — a pre-change seed run **completes and silently drops** the key | TMPL-02 | The `--template ./custom.ts` CLI path writes to a **live DB** and has no dry-run flag. The OLD half must be observed on the untouched tree, before the behaviour-changing commit | `yarn db:reset`, then `yarn db:seed --template "$PWD/<fixture>.ts"` on the pre-change tree; confirm exit 0 and query the DB to show the key absent. Record in the ledger with the HEAD it ran at |
| Criterion 2's NEW (catching) half | TMPL-02 | same path | same command post-change; confirm the throw names `external_id` + key + collection |
| Full E2E cardinal gate | all | Requires one fresh dev server on `:5173` and a clean DB | `yarn db:reset` → single `yarn dev` → `yarn test:e2e` |

---

## Validation Audit 2026-08-25

| Metric | Count |
|--------|-------|
| Requirements audited | TMPL-01, TMPL-02, criterion 4, source (4), D-03a, D-09, ASSERT-04 |
| Gaps found | 0 |
| Resolved | 0 (none needed) |
| Escalated | 0 |

Every ❌ W0 reference in the map above **landed**, and three tests landed *beyond* the plan:
`ciTypecheckGate.test.ts` (the D-06 gate cannot be narrowed without going red),
`linkSentinelRules.type-test.ts`, and the `negctl-questions-entity-type-camel.ts` fixture that closes
review finding CR-01. Measured at HEAD 2026-08-25:

| Gate | Result |
|------|--------|
| `yarn workspace @openvaa/dev-seed test:unit` | 49 files · **558 tests · 0 failed · 0 skipped** |
| `TURBO_FORCE=true yarn test:unit` | **25/25 tasks · 0 cached** |
| `TURBO_FORCE=true npx turbo run typecheck` | **22/22 tasks · 0 cached · 0 errors** |
| `TURBO_FORCE=true yarn lint:check` | **22/22 tasks · 0 cached** |

Phase 145 landed between the plan-time strategy and this audit and writes a **new key** across the
Pass 0 boundary this phase built (`terms_of_use_accepted` on every generated candidate row). It is on
the derived allow-list, so it is admitted rather than bypassing the guard — and 145's green suite is
an independent re-exercise of the TMPL-02 must-NOT-fire control on a template shape Phase 144 never
saw. Neither `permittedKeys.ts` nor `writer.ts` was touched.

**Known limitation, tracked not fixed.** `packages/dev-seed/package.json`'s lint script is
`eslint … src/`, so every spec under `tests/` — including all seven this phase added — is **unlinted**.
Filed as `.planning/todos/pending/2026-08-23-dev-seed-lint-script-covers-only-src.md`; the sibling
frontend gap is `2026-08-22-frontend-lint-script-covers-only-src.md`. Not widened here, per the
plan's own residue note.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or a Wave 0 dependency
- [x] Sampling continuity: no 3 consecutive tasks without an automated verify
- [x] Wave 0 covers all ❌ references above — every one landed, plus two beyond plan
- [x] No watch-mode flags
- [x] Every evidence-bearing `lint`/`typecheck` run is `TURBO_FORCE=true` (D-06b)
- [x] Feedback latency < 30s at task granularity (measured ~10s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-25
