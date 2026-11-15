---
phase: "188"
slug: "relay-on-the-deployed-stack-and-the-per-caller-limit"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-15"
---

# Phase 188 — Validation Strategy

> Seeded from `188-RESEARCH.md` § Validation Architecture (below); the planner fills the per-task map.

---

### Test Framework
| Property | Value |
|----------|-------|
| Frameworks | vitest (frontend, functions under Node, infra scripts); pgTAP (`supabase test db`); `terraform test` (mock providers); Playwright E2E via `tests/scripts/e2e-run.sh` |
| Config files | `apps/frontend/vite(st) config`, `apps/supabase/vitest.config.ts`, `infra/vitest.config.ts`, `apps/supabase/supabase/tests/database/*.test.sql`, `infra/modules/frontend-service/tests/frontend_service.tftest.hcl`, `tests/playwright.config.ts` |
| Quick run commands | `yarn workspace @openvaa/frontend test:unit src/lib/server/analytics` · `yarn workspace @openvaa/supabase test:unit account-access` · `yarn workspace @openvaa/supabase test:db` · `terraform -chdir=infra/modules/frontend-service test` · `yarn test:unit:infra load-check` |
| Full suite command | `yarn lint:check && yarn test:unit && tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/188-close --no-db-reset` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RELAY-04 | Flush interval resolves, bounds refuse, startup names it | unit | `yarn workspace @openvaa/frontend test:unit src/lib/server/analytics/config.test.ts` | ✅ (extend) |
| RELAY-04 | Contract: every place lists the new name | unit | `yarn workspace @openvaa/frontend test:unit src/lib/server/startup/taskEnvironment.test.ts` | ✅ (extend) |
| RELAY-04 | Task receives 17 entries | terraform test | `terraform -chdir=infra/modules/frontend-service test` | ✅ (extend) |
| RELAY-04 | Shutdown flush, batching | unit | `… test:unit src/lib/server/analytics/queue.test.ts` | ✅ |
| RELAY-04 | Deployed capture, SIGTERM, fail-open, none | manual-only (operator sittings H5–H8) | named lines in evidence | — |
| RELAY-09 | Tick skipped while a flush hangs | unit | `… queue.test.ts` | ✅ (new case) |
| RELAY-09 | WAF off: no ACL; on: shape; bounds refuse | terraform test | `terraform -chdir=infra/modules/frontend-service test` | ✅ (new runs) |
| RELAY-09 | Refusal script parses its flags, prints named lines | unit + local run | `yarn test:unit:infra relay-refusals` | ❌ Wave 0 |
| RELAY-09 | Deployed refusals, full queue, WAF plan | manual-only (H9, H10) | named lines | — |
| OBS-09 | RPC: 30 then refused, trust and skip rules, /64, project check, grants | pgTAP | `yarn workspace @openvaa/supabase test:db` | ❌ Wave 0 (`48-…test.sql`) |
| OBS-09 | Census pins updated | pgTAP | same | ✅ (edit 07, 39) |
| OBS-09 | Header read, 429 body, take precedes branches, no address in logs | unit (vitest) | `yarn workspace @openvaa/supabase test:unit account-access` | ❌ Wave 0 (`callerLimit.test.ts`); ✅ edit `flowConformance`, `contract` |
| OBS-09 | Schema and migrations build the same database | script | `yarn check:schema-equivalence` | ✅ |
| OBS-09 | Hosted: one caller limited, another not | manual-only (H12) | named lines | — |
| OBS-11 | k6 script options/thresholds present, wrapper refuses an unconfirmed or foreign target | unit + local dry run | `yarn test:unit:infra load-check` | ❌ Wave 0 |
| OBS-11 | Capacity figure | manual-only (H11) | JSON summary in evidence | — |

### Sampling Rate
- **Per task commit:** the quick command of the touched area (seconds to a minute; pgTAP about a minute).
- **Per plan:** the area's full command plus `yarn lint:check` (background it if it nears the watchdog).
- **Phase gate:** `yarn test:unit` (stack running) and one full E2E run green, then the deployed smoke run after each staging rollout.

### Wave 0 Gaps
- [ ] `apps/supabase/supabase/tests/database/48-invitation-caller-limit.test.sql`: covers OBS-09.
- [ ] `apps/supabase/supabase/functions/account-access/callerLimit.test.ts`: covers OBS-09.
- [ ] `infra/scripts/relay-refusals.test.ts`: covers RELAY-09's script.
- [ ] `infra/scripts/load-check.test.ts`: covers OBS-11's script and wrapper.
- No framework install is needed.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|

---

## Manual-Only Verifications

Every operator input (188-DISCUSSION-POINTS.md § G) and outward action (§ H) is an operator checkpoint.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
