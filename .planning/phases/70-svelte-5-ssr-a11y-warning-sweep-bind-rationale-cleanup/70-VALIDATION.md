---
phase: 70
slug: svelte-5-ssr-a11y-warning-sweep-bind-rationale-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-09
---

# Phase 70 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Hygiene phase — fix-then-prove gates dominate; per-fix unit tests are NOT required (CONTEXT.md D-03 + RESEARCH.md verdict: 0 user-visible-bug-history sites).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 1.x (workspace) + Playwright (E2E parity) + svelte-check (warning gate) |
| **Config file** | `apps/frontend/vitest.config.ts`, `apps/frontend/playwright.config.ts`, `apps/frontend/svelte.config.js` |
| **Quick run command** | `yarn workspace @openvaa/frontend check` (svelte-check; ~30s) |
| **Full suite command** | `yarn workspace @openvaa/frontend build && yarn test:unit` (~3 min) |
| **Estimated runtime** | ~30s quick / ~3 min full / ~6 min cold-start (with `.svelte-kit` wipe) |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/frontend check` (must not regress beyond v2.7-close baseline of 160 errors / 12 warnings; warnings reduce as Phase 70 lands)
- **After every plan wave:** Run `yarn workspace @openvaa/frontend build` (zero un-justified Svelte 5 / SSR / a11y warnings across A/B/C/D)
- **After Plan-70-05 BIND-strip:** Run `git grep -nE "// bind: (keep|ok|justified)" apps/frontend/src/lib/` (must return zero matches; the `// bind: migrate —` block at `Input.svelte:214-217` is preserved and is NOT matched by this grep)
- **Before `/gsd-verify-work`:** Cold-start protocol — `rm -rf apps/frontend/.svelte-kit node_modules/.vite/ && yarn dev`, then voter-flow happy-path navigation, must surface zero un-justified A/B/C/D warnings; `yarn build && yarn test:unit && yarn test:e2e` (parity baseline) must remain green
- **Max feedback latency:** 30 seconds for the per-task svelte-check gate; ~6 min for the cold-start verification

---

## Per-Task Verification Map

> Concrete file/line/col commands per RESEARCH.md §"Concrete Warning Site Enumeration"; Plan IDs follow CONTEXT.md D-02 (5 plans: A/B/C/D/BIND).

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 70-01-01 | 01 (Cat A) | 1 | WARN-01 SC-1 | — | N/A (hygiene) | static | `yarn workspace @openvaa/frontend check 2>&1 \| grep "state_referenced_locally" \| wc -l` returns `0` | ✅ existing infra | ⬜ pending |
| 70-01-02 | 01 (Cat A) | 1 | WARN-01 SC-1 | — | reactivity preserved | smoke | manual: open Expander, EnumeratedEntityFilter, NumericEntityFilter — verify expand/collapse + filter interaction continue to work | ✅ manual | ⬜ pending |
| 70-02-01 | 02 (Cat B) | 1 | WARN-01 SC-2 | — | N/A (hygiene) | static | `yarn workspace @openvaa/frontend check 2>&1 \| grep -E "slot_element_deprecated\|missing render tag" \| wc -l` returns `0` | ✅ existing infra | ⬜ pending |
| 70-02-02 | 02 (Cat B) | 1 | WARN-01 SC-2 | — | render preserved | smoke | manual: voter-flow navigation through `(voters)/(located)/results/` and `nominations` paths — children render correctly | ✅ manual | ⬜ pending |
| 70-03-01 | 03 (Cat C) | 1 | WARN-01 SC-3 | — | a11y compliant | static | `yarn workspace @openvaa/frontend check 2>&1 \| grep "a11y_no_noninteractive_element_interactions" \| wc -l` returns `0` (or accepted with `// svelte-warning: accepted —`) | ✅ existing infra | ⬜ pending |
| 70-03-02 | 03 (Cat C) | 1 | WARN-01 SC-3 | — | label-for-input association | manual | keyboard: tab into Input.svelte focus chain; screen-reader: label announces with input | ✅ manual | ⬜ pending |
| 70-04-01 | 04 (Cat D) | 1 | WARN-01 SC-1b/D | — | N/A (hygiene) | dynamic | cold `yarn workspace @openvaa/frontend dev` 2>&1 \| grep "fetch.*eagerly" \| wc -l` returns `0` (after WithPolling.svelte fix moves `startPolling()` into `onMount`) | ✅ existing infra | ⬜ pending |
| 70-04-02 | 04 (Cat D) | 1 | WARN-01 SC-1b/D | — | polling still works | smoke | manual: navigate to admin/jobs route — polling fetches still trigger and update UI | ✅ manual | ⬜ pending |
| 70-05-01 | 05 (BIND) | 2 | BIND-01 SC-4 | — | N/A (comment-only) | static | `git grep -nE "// bind: (keep\|ok\|justified)" apps/frontend/src/lib/ \| wc -l` returns `0`; `git grep -n "// bind: migrate" apps/frontend/src/lib/input/Input.svelte` returns the preserved 3-line block at lines 214-217 | ✅ existing infra | ⬜ pending |
| 70-05-02 | 05 (BIND) | 2 | BIND-01 SC-4 | — | bind directives untouched | static | `git diff --stat HEAD~1 HEAD apps/frontend/src/lib/**/*.svelte` shows comment-only changes (no `bind:` line additions/removals) | ✅ existing infra | ⬜ pending |
| 70-VR-01 | verify | close | WARN-01 + BIND-01 SC-5 | — | regression-free | full | `yarn workspace @openvaa/frontend build && yarn test:unit && yarn test:e2e` exits 0; v2.7-close Playwright parity baseline preserved | ✅ existing infra | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*None — existing infrastructure covers all phase requirements.* Vitest, Playwright, and svelte-check are already wired up monorepo-wide; no new fixtures or test scaffolding is required (per CONTEXT.md D-03 + RESEARCH.md audit: 0 of 9 Cat A sites have user-visible-bug history, so no per-fix unit tests are added).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Expander/EnumeratedEntityFilter/NumericEntityFilter reactivity preserved post-Cat-A rewrite | WARN-01 SC-1 | Cat A fixes wrap reads in `$derived` or move to direct property access; the warning-gone gate proves the warning is fixed but does not prove user-visible reactivity is preserved | Open the relevant components in voter app: expand/collapse Expander; toggle filter values in EnumeratedEntityFilter; adjust slider in NumericEntityFilter — UI updates as expected |
| `<slot />` → `{@render children()}` renders correctly | WARN-01 SC-2 | The compiler warning catches the deprecation; visual confirmation that children render is manual | Voter-flow navigation through results and nominations paths — child content visible at each route |
| Input.svelte keyboard + screen-reader behavior | WARN-01 SC-3 | A11y fixes change DOM structure; automated lint catches the rule violation but not lived UX | Tab into and out of Input components; verify label announces; verify keyboard activation matches the original click handler |
| WithPolling.svelte still polls after onMount fix | WARN-01 SC-1b/D | Moving `startPolling()` into `onMount` preserves runtime behavior but the warning-gone gate doesn't prove polling still works | Navigate to admin/jobs route in browser; observe polling network requests in DevTools; observe job status updates in UI |
| Cold-start happy-path warning sweep | WARN-01 SC-1..3 | Some categories (especially D) only fire at runtime; static svelte-check misses dev-server-only warnings | `rm -rf apps/frontend/.svelte-kit node_modules/.vite/ && yarn dev`; navigate voter-flow happy path; observe terminal — zero un-justified A/B/C/D warnings |
| Playwright parity baseline | WARN-01 SC-5 + BIND-01 SC-5 | E2E suite gates regression introduction by warning fixes / comment strip | `yarn dev:reset && yarn dev` (separate terminal), then `yarn test:e2e` — passes at v2.7-close parity baseline |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (per-task gates use `yarn check`, `git grep`, or manual smoke; no Wave 0 needed)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (every plan has its category-specific grep gate)
- [ ] Wave 0 covers all MISSING references (none — pre-existing infra)
- [ ] No watch-mode flags (all gates are one-shot)
- [ ] Feedback latency < 30s (svelte-check; cold-start is end-of-phase only)
- [ ] `nyquist_compliant: true` set in frontmatter (set after gsd-plan-checker passes)

**Approval:** pending
