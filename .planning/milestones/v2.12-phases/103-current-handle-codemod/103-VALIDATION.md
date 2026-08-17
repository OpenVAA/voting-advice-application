---
phase: 103
slug: current-handle-codemod
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-09
---

# Phase 103 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `103-RESEARCH.md` → "## Validation Architecture". Highest-blast-radius phase of v2.12 (~428 `.current` reads + ~128 destructure sites + 5 write sites across the migrated handles).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (`vitest run`); runes specs `*.svelte.test.ts`. Configs `apps/frontend/vitest.config.ts` + `vite.config.ts`. E2E: Playwright (`tests/playwright.config.ts`). |
| **Config file** | `apps/frontend/vitest.config.ts`; `tests/playwright.config.ts` |
| **Quick run command** | `yarn build --filter=@openvaa/frontend` (exit 0 = the binding green gate, per 102 PoC) |
| **Full suite command** | `yarn test:e2e` (requires `yarn db:reset && yarn dev` healthy) |
| **Estimated runtime** | build ~30–90s · unit `--run appContext` ~10s · full E2E ~several min |

> **LM-4 (binding gate):** `yarn workspace @openvaa/frontend check` (svelte-check) has a **pre-existing 147-error baseline** and will never exit 0. The green gate is `vite build` exit 0, NOT `check` exit 0. Use `check` only for a NET-NEW-error delta (the fold must add zero new errors).

---

## Sampling Rate

- **After every task commit (cheap):** `yarn build --filter=@openvaa/frontend` (exit 0) + targeted grep for the handles touched in that commit. Add `yarn workspace @openvaa/frontend test:unit --run appContext` when appContext is touched.
- **After the mechanical codemod commit (D-02):** build green + idempotency check (`--apply` again → `git diff --quiet`) + full zero-residual `.current` assertion (per migrated handle) + destructure-trap grep + codemod Pass-4 audit = 0 traps.
- **Mid-chain (K3, right after the codemod lands):** ONE full E2E pass against a fresh server — `yarn db:reset && yarn dev` (wait healthy) `&& yarn test:e2e`. **This is the Phase-103 obligation** (do NOT defer the first regression check to GATE-01/Phase 105).
- **Before `/gsd-verify-work`:** Full E2E suite green.
- **Max feedback latency:** build < ~90s per commit; E2E once at K3.

> **LM-5 (HMR staleness):** restart `yarn dev` before trusting any E2E result during codemod debug; the K3 pass runs against a fresh server + `yarn db:reset` (project memory `project_e2e_hmr_staleness_restart.md`).

---

## Per-Task Verification Map

> Authored against the research's "Phase Requirements → Test Map". Plan/Task IDs finalize when PLAN.md lands; rows below are the requirement→check contract every plan task must satisfy.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 103-A-* (declarations conform) | A | 1 | HANDLE-02 | — | N/A (mechanical idiom fold; no auth/data-exposure change) | build + typecheck-delta | `yarn build --filter=@openvaa/frontend` (exit 0); `check` shows no NEW errors vs 147 baseline | ✅ | ⬜ pending |
| 103-A-* (PoC round-trip survives fold) | A | 1 | HANDLE-02 | — | N/A | unit | `yarn workspace @openvaa/frontend test:unit --run appContext` | ⚠️ W0 (retarget PoC test off `_poc*`) | ⬜ pending |
| 103-B-* (idempotent codemod) | B | 2 | HANDLE-03 | — | N/A | scripted | `node <codemod> --apply && git diff --quiet` | ✅ (script — W0) | ⬜ pending |
| 103-B-* (zero residual `.current`) | B | 2 | HANDLE-03 | — | N/A | grep | per-handle zero-residual assertion (allowlist, excludes E1–E4) | ✅ | ⬜ pending |
| 103-B-* (green at every commit boundary) | B | 2 | HANDLE-03 | — | N/A | build | `yarn build --filter=@openvaa/frontend` at each commit | ✅ | ⬜ pending |
| 103-B-* (destructure-trap intact) | B | 2 | HANDLE-03 | — | Auth state must drive nav re-render (no stale snapshot — AdminNav-class) | grep + audit | destructure grep (keyed on `getAppContext`/`getVoterContext`/`getCandidateContext`/`getAdminContext`, excl. `getComponentContext`) + Pass-4 audit = 0 | ✅ | ⬜ pending |
| 103-B-* (existing E2E green) | B | 2 | HANDLE-03 | — | Auth-gated nav + voter question/results flow still react | e2e | `yarn test:e2e` (single full pass — K3) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

> **Minimum-sufficient check set (no redundancy):** (1) `yarn build` exit 0 every commit; (2) zero-residual grep → criterion 1; (3) idempotency `git diff --quiet` → criterion 2; (4) destructure grep + Pass-4 audit = 0 → criterion 4 (trap); (5) single full E2E (K3) → criterion 4 (E2E green) + reactivity regressions static checks can't catch. `yarn lint:check` runs alongside (D-01 gate), secondary to build for the green boundary.

---

## Wave 0 Requirements

- [ ] **Retarget** `apps/frontend/src/lib/contexts/app/appContext.poc.svelte.test.ts` off `_pocDarkMode`/`_pocAppType`/`_pocGetRoute` onto the canonical folded names (`ctx.darkMode`/`ctx.appType`/`ctx.getRoute`) — or fold its assertions into a canonical `appContext.svelte.test.ts`. It is the only unit proof of the idiom round-trip and must survive the fold.
- [ ] **Author the codemod script** (extend `.planning/archive/spike-009-store-codemod.mjs`) with: the per-handle allowlist (A1–A12 reads, B13–B18 read+write, E1–E4 excluded), Pass-3 destructure rewrite keyed on context-call name (LM-2), and extended `REACTIVE_ACCESSORS`. Codemod glob must include `lib/contexts/**/*.svelte.ts`, not just `.svelte` (LM-1), excluding `*.test.ts`/`*.poc.*`.
- [ ] No new framework install — Vitest + Playwright + svelte-check all present.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Test-file `.current`/`.set` references on migrated handles (`*.test.ts` excluded from `--apply`) | HANDLE-03 | Auto-rewriting test bodies risks invalidating intentional assertions | Hand-edit affected test expectations as D-02 separate commits; re-run `yarn workspace @openvaa/frontend test:unit` |
| `popupQueue` `get head()` residual `.current` (Open Item A3) | HANDLE-02 | Documented retained exception — accept residual per decision-record default | Confirm the 4 head-reads are the only residual and are on the retained-exception handle, not a missed migration |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (PoC-test retarget + codemod script)
- [ ] No watch-mode flags
- [ ] Feedback latency: build < ~90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
