---
phase: "189"
slug: "documentation-and-closure"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-20"
---

# Phase 189 — Validation Strategy

> Seeded from `189-RESEARCH.md` § Validation Architecture (below); the planner fills the per-task map.

---


### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (per workspace via turbo; root suites `tests/vitest.config.ts`, `infra/vitest.config.ts`); Playwright for E2E |
| Config file | `apps/frontend/vitest.config.ts`, `packages/dev-seed` (vitest run), `infra/vitest.config.ts` (`include: ['scripts/**/*.test.ts']`) |
| Quick run command | `yarn workspace @openvaa/frontend vitest run src/lib/server/startup src/lib/analytics`; `yarn test:unit:infra hosted-settings-reference`; `yarn workspace @openvaa/dev-seed vitest run tests/deploymentTemplates.test.ts tests/analyticsEnvTemplates.test.ts` |
| Full suite command | `yarn test:unit` (needs the local stack), `yarn lint:check`, `yarn format:check`, docs gates, full E2E wrapper run |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOCS-01 | guide on the Terraform/Supabase path, OpenTofu sentence, links resolve | docs gates + grep | `yarn workspace @openvaa/docs validate:links --check && yarn workspace @openvaa/docs build`; `git grep -n -i opentofu -- apps/docs` non-empty | partial (gates exist) |
| DOCS-02 | every hosted setting / function secret on the page | unit | `yarn test:unit:infra hosted-settings-reference` | ❌ Wave 0 |
| DOCS-03 | no unverified hosted statement | recorded search | the two `git grep` commands in § C-02, output classified in VERIFICATION | n/a (manual classification) |
| DOCS-04 | every task/required/analytics variable on the env page | unit | `yarn workspace @openvaa/frontend vitest run src/lib/server/startup` | ❌ Wave 0 (sibling of `taskEnvironment.test.ts`) |
| DOCS-05 | catalogue equals `EVENT_NAMES`; no "no consent" statement | unit + grep | `yarn workspace @openvaa/frontend vitest run src/lib/analytics`; `! git grep -n -i -E "(no|not) consent (is )?(required|needed)\|consent is not (required\|needed)\|does not (require\|need) consent" -- apps/docs` | ❌ Wave 0 |
| DOCS-06 | ops page covers the seven procedures + cost | manual review + link gate | `validate:links --check`; H-01 sittings' evidence rows | — |
| DOCS-07 | Render gone, orphan compose gone, production image builds | grep + unit + build | `test ! -e render.example.yaml && test ! -e apps/frontend/docker-compose.dev.yml`; `! git grep -n -E "render\.example\|render\.com\|fromGroup" -- ':!.planning' ':!scripts/fixtures'`; `! grep -n "AS development" apps/frontend/Dockerfile`; dev-seed tests green; `docker build … --target production` exit 0 | existing tests edited |
| DOCS-08 | seven closure records | file checks | `for f in <six files>; do test -f .planning/todos/completed/$f && grep -q '^status: completed' … && grep -q '^## Closed (phase 189)' …; done`; `test ! -e .planning/todos/pending/<f>` | — |
| B-03 | variables gone, no reader | grep + unit + targeted E2E | `! git grep -n FRONTEND_URL -- ':!.planning'`; frontend unit; wrapper runs `--project bank-auth`, `contestant-identity-provider`, `voter-journey` | — |

### Sampling Rate
- **Per task commit:** the guard's own vitest file, red then green; `yarn workspace @openvaa/docs validate:links --check` after any docs edit.
- **Per plan:** `yarn lint:check`, `yarn format:check`, `yarn test:unit` (stack up), targeted E2E only in the B-03 plan.
- **Phase gate:** full E2E run green, judged against 729 + Δ0; both C-02 searches recorded and classified.

### Wave 0 Gaps
- [ ] `infra/scripts/hosted-settings-reference.test.ts` — DOCS-02
- [ ] `apps/frontend/src/lib/server/startup/environmentReference.test.ts` (name at discretion) — DOCS-04
- [ ] `apps/frontend/src/lib/analytics/eventCatalogue.test.ts` (name at discretion) — DOCS-05
- Each red first against the current (or absent) page, which they must fail by naming the missing items.

### Manual / operator-only
- H-01(1): fresh read-only probe run (`node infra/scripts/probe-hosted.mjs --root infra/envs/staging/supabase`, Step 23) for G-04(c) — the latest recorded probe on the persistent project is 2026-11-14 (supabase README l.1884), before the 2026-11-19 function redeploy (l.1887); optional `dig` of `_dmarc.openvaa.org` (S18) and the `has_table_privilege` read (S27).
- H-01(2): the backups read (E-02).
- H-01(3): the origin-secret apply with health polled (E-03).
- Reading the docs pages as a deployer (DOCS-01/06 completeness).


---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky* — filled by the planner.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
