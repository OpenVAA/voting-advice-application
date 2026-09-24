---
phase: 152
slug: comment-naming-hygiene-sweep
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-28
---

# Phase 152 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `152-RESEARCH.md` § "Validation Architecture" (measured at HEAD `22c2542e3`).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest `^3.2.4` (root catalog) · Playwright (`@playwright/test`) for E2E |
| **Config file** | root `vitest.config.ts`; `apps/frontend/vitest.config.ts`; per-package `vitest.config.ts`; `tests/playwright.config.ts` |
| **Quick run command** | `node scripts/assert-comment-hygiene.mjs` (guard, once it exists) + workspace-scoped `test:unit` for any workspace touched |
| **Full suite command** | `yarn build && yarn lint:check && yarn test:unit`, then full `yarn test:e2e` |
| **Estimated runtime** | guard < 30 s · `yarn test:unit` minutes · `yarn test:e2e` ~11 min (150 specs, per Phase 147 record) |

**Guard-only commands:** `node scripts/assert-comment-hygiene.mjs` · `node scripts/assert-comment-hygiene.mjs --self-test`

---

## Sampling Rate

- **After every task commit:** `node scripts/assert-comment-hygiene.mjs` (once it exists) + the workspace-scoped `test:unit` for any workspace touched.
- **After every plan wave:** `yarn lint:check` + `yarn test:unit`.
- **Before `/gsd-verify-work`:** `yarn build` → `yarn lint:check` → `yarn test:unit` → full `yarn test:e2e` green, after `yarn db:reset` and one fresh dev server on :5173 (per `project_e2e_execution_devserver_prereq`).
- **Max feedback latency:** < 30 s for the guard; wave-level gates are the slower ring.

---

## Per-Requirement Verification Map

Task-level IDs are filled in by the planner; this table is the requirement-level contract the plans must satisfy.

| Requirement | Behaviour | Threat Ref | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|---|
| REVIEW-HYG-01 | Scan finds zero forced line breaks + zero comment-scoped `\uXXXX` escapes | T-152-05 (green-while-dirty) | guard | `node scripts/assert-comment-hygiene.mjs` | ❌ Wave 0 | ⬜ pending |
| REVIEW-HYG-01 | Scan's own rules are correct on known inputs (`.ts`/`.svelte`/`.sql`/`.sh` fixtures) | — | unit (fixtures) | `node scripts/assert-comment-hygiene.mjs --self-test` | ❌ Wave 0 | ⬜ pending |
| REVIEW-HYG-01 | Scan is a blocking link of the `lint:check` chain (MEMBERSHIP, not position — `b410d3a90`) | T-152-05 | unit | `yarn workspace @openvaa/dev-seed test:unit -t 'comment-hygiene'` | ⚠ extend `packages/dev-seed/tests/ciTypecheckGate.test.ts` | ⬜ pending |
| REVIEW-HYG-01 | Guard **catches** a reintroduction (HYG1-OLD → HYG1-NEW flip, per Phase 147's `AX1` pattern) | T-152-05 | negative control | re-wrap a swept site; `yarn lint:check` exits 1 naming it; revert; exits 0 | ❌ final wave | ⬜ pending |
| REVIEW-HYG-02 | No planning reference survives in `packages/**`, `apps/**`, `tests/**` | T-152-01 | guard | retargeted `hygiene-grep-report.sh --assert-clean` asserting **`occ = 0`**, not `bare = 0` | ⚠ retarget (RESEARCH § 4.3) | ⬜ pending |
| REVIEW-HYG-02 | The sweep changed no program behaviour | T-152-02 | residue pass | `hygiene-codemod.mjs --residue-out <p>`, then hand-review every `not-a-comment-span` row (**98** measured) | ✓ mechanism exists | ⬜ pending |
| REVIEW-HYG-02 | Exemplar matches D-A2 line for line | — | manual read | diff `apps/frontend/src/routes/(voters)/+layout.svelte` against RESEARCH § 7's table | manual-only (no automatable oracle for a prose disposition) | ⬜ pending |
| REVIEW-HYG-03 | No dangling reference after the three renames | — | typecheck | `TURBO_FORCE=true npx turbo run typecheck` | ✓ existing | ⬜ pending |
| REVIEW-HYG-03 | Renamed specs still run and pass | — | unit | `yarn test:unit` | ✓ existing | ⬜ pending |
| REVIEW-HYG-03 | Build green after each rename | — | build | `yarn build` | ✓ existing | ⬜ pending |
| REVIEW-HYG-04 | Audit exists and is committed even if "none found" | — | artefact check | `test -f .planning/phases/152-comment-naming-hygiene-sweep/152-SPELLING-AUDIT.md` | ❌ Wave 1 | ⬜ pending |
| REVIEW-HYG-04 | No UK-spelled identifier remains in scope | — | script | committed `uk-identifier-audit.mjs` → 0 in-scope hits | ❌ Wave 0 | ⬜ pending |
| all | E2E cardinal gate | — | e2e | `yarn test:e2e` — 0 failed, 0 did-not-run | ✓ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/assert-comment-hygiene.mjs` — REVIEW-HYG-01, with `--self-test` and committed fixtures for `.ts` / `.svelte` / `.sql` / `.sh` (mirror `hygiene-codemod.mjs`'s fixture layout). Reuse that script's comment-span classifier; do not re-derive one.
- [ ] `.planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-codemod.mjs` — the retargeted copy (rule 6 **inverted**: remove the reference rather than collapsing it to `see phase N`; fixtures extended for the changed rule).
- [ ] `.planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-grep-report.sh` — the retargeted gate asserting `occ = 0`.
- [ ] `.planning/phases/152-comment-naming-hygiene-sweep/scripts/uk-identifier-audit.mjs` — REVIEW-HYG-04, promoted from RESEARCH § 9's prototype so the next audit is a re-run, not a re-derivation.
- [ ] Extend `packages/dev-seed/tests/ciTypecheckGate.test.ts` with the chain-membership assertion for the new guard.
- [ ] `152-SPELLING-AUDIT.md` — the committed audit artefact.

**Framework install:** none needed — vitest, Playwright, prettier, eslint and turbo are all present.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|---|---|---|---|
| The exemplar's line-by-line disposition (`:36-45` deleted, `:46-47` compressed to one line stating the `ctx.appSettings` invariant, `:59-75` gone, `:92-106` → one line justifying `onMount`, `:109` removed, `:116` **kept**) | REVIEW-HYG-02 | A prose disposition has no automatable oracle | Read `apps/frontend/src/routes/(voters)/+layout.svelte` against RESEARCH § 7's line-exact table |
| Rewrite-vs-delete judgement over the 642 planning-reference spans | REVIEW-HYG-02 | D-A1 assigns it explicitly to a human/agent pass; a regex-only pass would edit program behaviour | Batch by file concentration; every span visited; live invariants rewritten, pure narrative deleted |
| The 98 declined residue rows are each genuinely non-comment-shaped | REVIEW-HYG-02 | Criterion 5's proof obligation | Hand-review each `not-a-comment-span` row in the residue report |
| Guard negative control (HYG1-OLD/NEW flip) | REVIEW-HYG-01 | Requires a deliberate reintroduction and revert | Re-wrap a swept comment, run `yarn lint:check`, observe exit 1 naming the site, revert, observe exit 0 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all ❌ MISSING references above
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s for the guard ring
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
