---
phase: 72
slug: package-hygiene-trio
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-09
---

# Phase 72 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + Playwright (E2E parity baseline) |
| **Config file** | apps/frontend/vitest.config.ts, packages/*/vitest.config.ts; playwright.config.ts |
| **Quick run command** | `yarn build && yarn lint:check` |
| **Full suite command** | `yarn build && yarn lint:check && yarn test:unit && yarn supabase:lint:sql && yarn test:e2e` |
| **Estimated runtime** | ~6–10 min (full suite incl. Playwright; ~30s for build+lint+unit only) |

---

## Sampling Rate

- **After every task commit:** Run `yarn build` (workspace-scoped where possible) + targeted grep verifications declared in each task's `<acceptance_criteria>`.
- **After every plan wave:** Run `yarn build && yarn lint:check && yarn test:unit`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** ≤30s for build + lint + unit; ≤10min for full suite incl. Playwright parity.

---

## Per-Task Verification Map

> Filled in by the planner per-task. Each row maps a task to its verification command and per-task acceptance criterion. Phase 72 is a refactor / package-hygiene phase — verification is dominated by `grep`-based criteria and existing `yarn build` / `yarn test:unit` / `yarn lint:check` / `yarn supabase:lint:sql` runs. No new test files are written by phase scope.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 72-01-01 | 01 | 1 | SHARED-01 | T-72-01-01, T-72-01-03, T-72-01-04 | Strip 20 `.js` extensions; delete stale tsbuildinfo; preserve dual ESM+CJS build | grep + build + lint + unit | `grep -rEn "from ['\"]\.+/.*\.js['\"]" packages/app-shared/src/ \| wc -l \| tr -d ' ' \| grep -q '^0$' && test ! -f packages/app-shared/tsconfig.tsbuildinfo && yarn workspace @openvaa/app-shared build && test -f packages/app-shared/dist/index.js && test -f packages/app-shared/dist/index.cjs && test -f packages/app-shared/dist/index.d.ts && test ! -f packages/app-shared/tsconfig.tsbuildinfo && yarn workspace @openvaa/app-shared lint && yarn workspace @openvaa/app-shared test:unit` | ✅ existing | ⬜ pending |
| 72-01-02 | 01 | 1 | SHARED-01 | T-72-01-01, T-72-01-02 | Add truthful `description`; rewrite README dual-build justification (no stale strapi reference) | jq + grep + lint | `cat packages/app-shared/package.json \| jq -e '.description \| length > 50' && cat packages/app-shared/package.json \| jq -e '.private == true' && cat packages/app-shared/package.json \| jq -e '.main == "./dist/index.cjs"' && cat packages/app-shared/package.json \| jq -e '.exports["."].require.default == "./dist/index.cjs"' && cat packages/app-shared/package.json \| jq -e '.scripts."test:unit" == "vitest run --passWithNoTests"' && ! grep -q "@openvaa/strapi" packages/app-shared/README.md && grep -q "Dual ESM + CommonJS build" packages/app-shared/README.md && grep -q "future-compatibility hedge" packages/app-shared/README.md && yarn workspace @openvaa/app-shared lint` | ✅ existing | ⬜ pending |
| 72-01-03 | 01 | 1 | SHARED-01 | T-72-01-02 | Create canonical paradigm doc + CLAUDE.md anchor | grep + lint + unit | `test -f packages/README.md && grep -q "@openvaa/core" packages/README.md && grep -q "tiebreaker" packages/README.md && grep -q "@openvaa/app-shared" packages/README.md && grep -q "packages/README.md" CLAUDE.md && grep -q "Canonical package paradigm" CLAUDE.md && yarn workspace @openvaa/app-shared lint && yarn workspace @openvaa/app-shared test:unit` | ✅ existing | ⬜ pending |
| 72-02-01 | 02 | 1 | SHARED-02 | T-72-02-02 | Audit `apps/frontend/src/lib/utils/` for shape-equivalent shims (D-07); confirm only `merge.ts` qualifies | grep | `test "$(grep -lE \"^export .* from ['\\\"]@openvaa/\" apps/frontend/src/lib/utils/*.ts \| wc -l \| tr -d ' ')" = "1" && grep -lE "^export .* from ['\\\"]@openvaa/" apps/frontend/src/lib/utils/*.ts \| grep -q "merge.ts$"` | ✅ existing | ⬜ pending |
| 72-02-02 | 02 | 1 | SHARED-02 | T-72-02-01, T-72-02-03 | Rewrite 3 import sites to use `@openvaa/app-shared` directly (workspace resolution validates target string) | grep + git grep | `grep -q "from '@openvaa/app-shared'" apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts && ! grep -q "from '\$lib/utils/merge'" apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts && grep -q "from '@openvaa/app-shared'" apps/frontend/src/lib/contexts/layout/layoutContext.type.ts && ! grep -q "from '\$lib/utils/merge'" apps/frontend/src/lib/contexts/layout/layoutContext.type.ts && test "$(git grep -nE \"['\\\"]\\\$lib/utils/merge['\\\"]\" apps/frontend/ tests/ packages/ -- ':!apps/frontend/src/lib/utils/merge.ts' \| wc -l \| tr -d ' ')" = "0"` | ✅ existing | ⬜ pending |
| 72-02-03 | 02 | 1 | SHARED-02 | T-72-02-02, T-72-02-03 | Delete shim file; verify zero references remain (strict + broad grep); frontend build + tests pass | git grep + build + unit | `test ! -f apps/frontend/src/lib/utils/merge.ts && test "$(git grep -nE \"['\\\"]\\\$lib/utils/merge['\\\"]\" apps/frontend/ tests/ packages/ \| wc -l \| tr -d ' ')" = "0" && yarn workspace @openvaa/frontend build && yarn workspace @openvaa/frontend test:unit` | ✅ existing | ⬜ pending |
| 72-03-01 | 03 | 1 | LINT-01 | T-72-03-01, T-72-03-02 | Hard-rename `apps/supabase/package.json` `lint` → `lint:sql`; update `lint:all` self-reference | jq + grep | `cat apps/supabase/package.json \| jq -e '.scripts.lint == null' && cat apps/supabase/package.json \| jq -re '.scripts."lint:sql"' \| grep -qE "^supabase db lint --schema public --fail-on warning$" && cat apps/supabase/package.json \| jq -re '.scripts."lint:all"' \| grep -qE "^yarn lint:sql " && cat apps/supabase/package.json \| jq -e '.scripts."lint:schema"' \| grep -q "lint-schema.mjs"` | ✅ existing | ⬜ pending |
| 72-03-02 | 03 | 1 | LINT-01 | T-72-03-01, T-72-03-04 | Hard-rename root `supabase:lint` → `supabase:lint:sql`; update CLAUDE.md line 63 | jq + grep | `cat package.json \| jq -e '.scripts."supabase:lint" == null' && cat package.json \| jq -re '.scripts."supabase:lint:sql"' \| grep -qE "^yarn workspace @openvaa/supabase lint:all$" && grep -q "yarn supabase:lint:sql" CLAUDE.md && test "$(grep -cE 'yarn supabase:lint(\s\|$)' CLAUDE.md)" = "0"` | ✅ existing | ⬜ pending |
| 72-03-03 | 03 | 1 | LINT-01 | T-72-03-03 | E2E gate — `yarn lint:check` no longer pulls SQL linter; `turbo.json` and CI workflows untouched | grep + git diff | `test "$(grep -c '"supabase:lint":' package.json)" = "0" && test "$(grep -c '"supabase:lint:sql":' package.json)" = "1" && test "$(grep -c '"lint":' apps/supabase/package.json)" = "0" && test "$(grep -c '"lint:sql":' apps/supabase/package.json)" = "1" && test "$(grep -c 'yarn supabase:lint:sql' CLAUDE.md)" -ge "1" && test "$(grep -cE 'yarn supabase:lint(\s\|$)' CLAUDE.md)" = "0" && test -z "$(git diff --stat turbo.json)"` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*No new test infrastructure required — existing `yarn build` / `yarn test:unit` / `yarn lint:check` / `yarn supabase:lint:sql` (after rename) / `yarn test:e2e` covers all phase requirements. The phase-close verification gate composes existing commands.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dual ESM+CJS build outputs both formats correctly | SHARED-01 | Need to inspect `dist/` after build to confirm both ESM and CJS bundles emitted | After `yarn workspace @openvaa/app-shared build`: `ls packages/app-shared/dist/` should show both `.js` (ESM) and `.cjs` (CJS) files; or whatever the canonical paradigm produces |
| CI workflow run on feature branch verifies LINT-01 doesn't break CI | LINT-01 | CI files reference may be missed by static grep; pushing the branch and observing CI is the only ground truth | Push the phase branch to remote; verify GitHub Actions runs to green |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (N/A — none required)
- [x] No watch-mode flags
- [x] Feedback latency < 30s (quick) / 10min (full)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** signed-off
