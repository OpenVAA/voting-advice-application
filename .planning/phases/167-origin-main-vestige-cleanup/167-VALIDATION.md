---
phase: "167"
slug: "origin-main-vestige-cleanup"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-01"
---

# Phase 167 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (catalog `vitest: ^3.2.4`) for frontend and packages; Playwright 1.58.2 for E2E |
| **Config file** | `apps/frontend/vitest.config.ts`, `vitest.workspace.ts`, `tests/playwright.config.ts` |
| **Quick run command** | `cd apps/frontend && yarn vitest run src/lib/supabase/safeGetSession.test.ts` (about 1 s) |
| **Full suite command** | `yarn test:unit` (runs `assert:unit-coverage`, then `turbo run test:unit`); E2E: `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/167-gate` (background + poll) |
| **Estimated runtime** | quick ≈ 1 s; per-task workspace checks ≈ 30–120 s; `yarn test:unit` several minutes; full E2E ≈ 5–11 min |

---

## Sampling Rate

- **After every task:** the task's own `<automated>` commands (each with its `<fails_when>`), plus `yarn workspace @openvaa/frontend check` for any frontend edit and `yarn workspace @openvaa/docs check` for any docs edit
- **After every plan:** `yarn test:unit` and `yarn lint:check` (read each exit directly; a red early `lint:check` link hides the later guards)
- **Before `/gsd-verify-work`:** the full D-26 set in 167-06 — typecheck, `lint:check`, `format:check`, `test:unit`, `TURBO_FORCE=true yarn build`, docs `check`, the D-25 audit set comparison, then one clean full E2E run
- **Max feedback latency:** about 120 seconds for per-task checks (E2E excluded; it runs once, last)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 167-01-01 | 01 | 1 | VEST-01 | T-167-01, T-167-02 | any client access other than `auth.getSession` / `auth.getUser` throws `UnexpectedClientAccess` (V3 observed red) | unit + negative control | `cd apps/frontend && yarn vitest run src/lib/supabase/safeGetSession.test.ts`; `git diff --exit-code -- apps/frontend/src/lib/supabase/safeGetSession.ts` | ✅ | ✅ green |
| 167-01-02 | 01 | 1 | VEST-01 | T-167-01, T-167-02, T-167-03 | exact `getUser`/`getSession` pins in every case; V1, V2-old, V2-new observed red; auth source unchanged | unit + negative control | same vitest command; `grep -c 'expect(getSession).toHaveBeenCalledTimes('` vs `grep -c "it('"` | ✅ | ✅ green |
| 167-02-01 | 02 | 2 | VEST-03 | T-167-04, T-167-05 | the unauthenticated `/api/cache` route is gone; `fetch` passes the URL unchanged | typecheck + unit + grep | `yarn workspace @openvaa/frontend check`; `yarn workspace @openvaa/frontend test:unit`; `git grep -n -E "cachifyUrl\|cacheProxy\|hasAuthHeaders\|disableCache" -- apps/frontend/src` (exit 1) | ✅ | ✅ green |
| 167-02-02 | 02 | 2 | VEST-02, VEST-03 | T-167-SC | no removed env key read or mocked; lockfile removal-only | grep + unit + lockfile diff | removed-key `git grep` (exit 1); frontend `check` + `test:unit`; `git diff -U0 HEAD -- yarn.lock` has no added `resolution:` | ✅ | ✅ green |
| 167-02-03 | 02 | 2 | VEST-02, VEST-03 | T-167-06, T-167-07 | layout docblocks keep the no-token-in-payload rule; templates carry no cache entry | whole-tree grep + gates | D-09 whole-tree `git grep` (exit 1); `yarn lint:check`; `yarn format:check`; `yarn test:unit`; `yarn build` | ✅ | ✅ green |
| 167-03-01 | 03 | 3 | VEST-04 | T-167-08, T-167-09, T-167-SC | no new package version locked; js-yaml external in llm dist | lockfile diff + build output + runtime import | `git diff -U0 HEAD -- yarn.lock` (no version/resolution line); `grep -c 'YAMLException' packages/llm/dist/index.js` → 0; consumer `import('@openvaa/llm')` exit 0 | ✅ | ✅ green |
| 167-03-02 | 03 | 3 | VEST-04 | T-167-09 | consumers build and test with js-yaml declared | build + unit | `yarn workspace @openvaa/llm test:unit`; `TURBO_FORCE=true yarn build`; `yarn test:unit` | ✅ | ✅ green |
| 167-04-01 | 04 | 4 | VEST-04 | T-167-10, T-167-SC | lint rules still fire after ESLint-dependency removal; effective config unchanged | before/after diff + lint-red | normalised lint JSON diff (empty); print-config diffs; `yarn workspace @openvaa/frontend lint` with probe (exit 1, both rule ids) and without (exit 0); frontend `test:unit` | ✅ | ✅ green |
| 167-04-02 | 04 | 4 | VEST-04 | T-167-11, T-167-12 | baseline hand-edited, never regenerated; note count consistent | script + unit | `node -e` baseline/note consistency check; `yarn workspace @openvaa/dev-seed test:unit`; per-package `test:unit` | ✅ | ✅ green |
| 167-04-03 | 04 | 4 | VEST-04 | T-167-10, T-167-13, T-167-SC | docs rules fire through the probe config before and after; no probe committed | lint-red + gates | docs probe eslint runs (0 / 1 naming both rules); `yarn workspace @openvaa/docs check`; `yarn lint:check`; `yarn format:check`; `yarn test:unit`; `yarn build` | ✅ | ✅ green |
| 167-05-01 | 05 | 5 | VEST-05 | — | N/A | svelte-check + grep | `yarn workspace @openvaa/docs check`; `git grep -n -F '$app/stores' -- apps packages` (exit 1) | ✅ | ✅ green |
| 167-05-02 | 05 | 5 | VEST-05 | T-167-14, T-167-15 | N/A (rendered output unchanged for both call sites) | render probe + sweep + build | sweep #14 loop with `-P` and a phase-base positive control (all 0, rc 1); render before/after diff; `grep -l 'fill-primary' apps/docs/build/_app/immutable/assets/*.css` | ✅ | ✅ green |
| 167-05-03 | 05 | 5 | VEST-06 | — | N/A | grep + check | `git grep -n -F 'over \`apps/frontend\`' -- apps/frontend/vite.config.ts` (exit 1); comment-only diff check; `yarn workspace @openvaa/frontend check`; `yarn assert:comment-hygiene` | ✅ | ✅ green |
| 167-06-01 | 06 | 6 | VEST-07 | T-167-16, T-167-18 | no gate-evidence value recorded or committed; tracked kxi files untouched | filesystem + diff | `test ! -e …/gate-evidence`; `git status --porcelain -- …/gate-evidence` empty; `git diff --exit-code PHASE_BASE -- <kxi files>` | n/a | ✅ green |
| 167-06-02 | 06 | 6 | VEST-09 | T-167-17, T-167-19 | E2E proves this checkout and project; audit compared at one moment | gates + audit + E2E | `yarn typecheck`; `yarn lint:check`; `yarn format:check`; `yarn test:unit`; `TURBO_FORCE=true yarn build`; docs `check`; audit `comm -13` (empty); `results.json` stats (0 unexpected / flaky / skipped) | ✅ | ✅ green |
| 167-06-03 | 06 | 6 | VEST-03, VEST-06, VEST-08 | — | N/A | file presence + hygiene delta | todo presence checks; `paste` baseline/after TSV `awk` (no rising gate row); `yarn assert:comment-hygiene` | n/a | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. The only test-file change is the in-place strengthening of
`apps/frontend/src/lib/supabase/safeGetSession.test.ts` (D-06). No docs test file is added: `apps/docs` has no
`test:unit` script, and `scripts/assert-unit-test-coverage.mjs` Check 1 would then demand one.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Touched comments carry no historical narrative and no planning reference | VEST-08 (also VEST-03's docblocks, VEST-06's comment) | historical narrative is invisible to `hygiene-grep-report.sh`; only reading catches it (CLAUDE.md § Comment Hygiene) | executor lists every added comment line (`git diff -U0 PHASE_BASE..HEAD -- apps packages tests`) and records a disposition per line in `167-06-SUMMARY.md` |
| gate-evidence contents classified by category | VEST-07 | deciding whether a log line is a credential needs reading; the scan only counts pattern hits | executor reads the files D-23 names and records categories only (167-06 Task 1) |

All other phase behaviours have automated verification. These two are agent-performed reads, recorded in the SUMMARY, not human checkpoints (D-28).

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 167s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** {pending / approved YYYY-MM-DD}
