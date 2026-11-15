---
phase: "188"
slug: "relay-on-the-deployed-stack-and-the-per-caller-limit"
status: planned
nyquist_compliant: true
wave_0_complete: false
created: "2026-11-15"
planned: "2026-11-15"
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
| 188-01-T1 | 01 | 1 | RELAY-04 | T-188-01, T-188-03 | An invalid interval refuses start by name and its value is never echoed | unit + terraform test | `yarn workspace @openvaa/frontend test:unit src/lib/server/analytics src/lib/server/startup` · `terraform -chdir=infra/modules/frontend-service test` | ✅ extend | ⬜ pending |
| 188-02-T1 | 02 | 2 | RELAY-04 | T-188-04 | Stop timeout 40 reaches the container | terraform validate/test | `terraform -chdir=infra/envs/staging/aws validate` · module test | ✅ | ⬜ pending |
| 188-02-T2 | 02 | 2 | RELAY-04 | T-188-04 | The example root asserts 40 | terraform test | `terraform -chdir=infra/envs/example/aws test` | ✅ extend | ⬜ pending |
| 188-03-T1 | 03 | 3 | RELAY-09 | T-188-06 | Off: no ACL, `web_acl_id` null; on: one rule on `/api/usage` | terraform test | `terraform -chdir=infra/modules/frontend-service test` | ✅ new runs | ⬜ pending |
| 188-03-T2 | 03 | 3 | RELAY-09 | T-188-06, T-188-07 | Bounds refused; staging tfvars never set it | terraform test + guard | module test · staging validate · negated grep (guard) | ✅ | ⬜ pending |
| 188-03-T3 | 03 | 3 | RELAY-09 | T-188-06 | The example root plans no ACL | terraform test | `terraform -chdir=infra/envs/example/aws test` | ✅ extend | ⬜ pending |
| 188-04-T1 | 04 | 1 | OBS-09 | T-188-09, T-188-10, T-188-12, T-188-13 | Trust only flag + present + parseable; unknown project and absent header write no row; service_role only; no mask widening | pgTAP | `yarn db:reset` · `yarn workspace @openvaa/supabase test:db` · `yarn assert:schema-migration-parity` | ❌ W0 `48-invitation-caller-limit.test.sql`, written first in the task | ⬜ pending |
| 188-04-T2 | 04 | 1 | OBS-09 | T-188-11 | [BLOCKING] local schema push; equivalence, types, lint | script | `yarn check:schema-equivalence` · `yarn db:types` · `yarn db:lint:sql` · `yarn assert:rpc-nullability` | ✅ | ⬜ pending |
| 188-05-T1 | 05 | 2 | OBS-09 | T-188-14, T-188-15, T-188-16, T-188-17 | Header read once; one 429 body for all operations; no address logged; fail closed | unit + local curl | `yarn workspace @openvaa/supabase test:unit account-access` · evidence lines | ❌ W0 `callerLimit.test.ts`, written first in the task | ⬜ pending |
| 188-05-T2 | 05 | 2 | OBS-09 | T-188-11 | Docs state the limit, its trust rule and what is stored | format + negated grep | `prettier --check` of three pages · three negated sentences | ✅ | ⬜ pending |
| 188-06-T1 | 06 | 2 | RELAY-09 | T-188-20 | Allowlisted target; dropped events never reach the provider | unit + local run | `yarn test:unit:infra relay-refusals` · evidence lines | ❌ W0 `relay-refusals.test.ts`, written first in the task | ⬜ pending |
| 188-06-T2 | 06 | 2 | RELAY-04 | T-188-18, T-188-19 | The key is never printed; counts only | unit | `yarn test:unit:infra posthog-read` | ❌ W0 `posthog-read.test.ts`, written first in the task | ⬜ pending |
| 188-07-T1 | 07 | 2 | OBS-11 | T-188-23 | k6 pinned by digest, digest re-read | local dry run | `bash -n infra/scripts/load-check.sh` · evidence lines | — | ⬜ pending |
| 188-07-T2 | 07 | 2 | OBS-11 | T-188-21 | Guards refuse a foreign, unconfirmed or over-cap run | unit | `yarn test:unit:infra load-check` | ❌ W0 `load-check.test.ts`, written in the task | ⬜ pending |
| 188-07-T3 | 07 | 2 | OBS-11 | T-188-22 | The extractor copies no header or cookie | unit | `yarn test:unit:infra load-check` | ✅ (from T2) | ⬜ pending |
| 188-20-T1 | 20 | 2 | RELAY-09 | T-188-02 | A tick is skipped while a flush hangs; shutdown still flushes | unit | `yarn workspace @openvaa/frontend test:unit src/lib/server/analytics/queue.test.ts` | ✅ new case | ⬜ pending |
| 188-20-T2 | 20 | 2 | RELAY-04 | — | Every template names the variable | unit | `yarn workspace @openvaa/dev-seed test:unit tests/analyticsEnvTemplates.test.ts` | ✅ extend | ⬜ pending |
| 188-08-T1 | 08 | 4 | all four | T-188-24 | Every repository gate green on the closing tree | full gates | `yarn lint:check` · `yarn format:check` · `yarn test:unit` · `yarn build` · two terraform tests | ✅ | ⬜ pending |
| 188-08-T2 | 08 | 4 | all four | T-188-24 | One full E2E green; its tree is the deployed half's reference | E2E | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/188-close-<UTC> --no-db-reset` · `e2e-spec-verdict.mjs --no-flaky` | ✅ | ⬜ pending |
| 188-09-T1–T3 | 09 | 5 | RELAY-04 | T-188-25, T-188-26, T-188-27 | IP discard read back; key never printed; limit recorded | operator sitting + read | evidence lines of each task | — | ⬜ pending |
| 188-10-T1–T3 | 10 | 6 | RELAY-04, OBS-09 | T-188-28 to T-188-31 | Migration before function; key as a secret; no `.planning/` published | pipeline run (one-way, gated) | evidence lines of each task | — | ⬜ pending |
| 188-11-T1–T3 | 11 | 7 | RELAY-04, RELAY-09 | T-188-32 to T-188-34 | Every presence count 0; 5 of 5 batched; 9 of 9 refusals | operator sitting + read | evidence lines of each task | — | ⬜ pending |
| 188-16-T1–T3 | 16 | 7 | OBS-09 | T-188-43 to T-188-45 | Trust flag read as `true` before the sitting, a miss stops with nothing called; one caller refused, another answered; no address recorded | operator sitting (CloudShell) | evidence lines of each task | — | ⬜ pending |
| 188-12-T1–T3 | 12 | 8 | RELAY-04 | T-188-35, T-188-36 | 7 of 7 queued events delivered at SIGTERM; restored | hand applies | evidence lines of each task | — | ⬜ pending |
| 188-13-T1–T3 | 13 | 9 | RELAY-09 | T-188-37, T-188-38 | 1000 kept, at least 50 dropped, memory flat; restored | hand applies | evidence lines of each task | — | ⬜ pending |
| 188-14-T1–T3 | 14 | 10 | RELAY-04 | T-188-39, T-188-40 | Smoke green with PostHog unreachable; restored | hand applies | evidence lines of each task | — | ⬜ pending |
| 188-15-T1–T3 | 15 | 11 | RELAY-04 | T-188-41, T-188-42 | Same digest, no build, zero events under `none`; restored | hand applies | evidence lines of each task | — | ⬜ pending |
| 188-17-T1–T3 | 17 | 12 | RELAY-09 | T-188-46, T-188-47 | Off: no change; on: one ACL; never applied; cost dated | read-only plans | evidence lines of each task | — | ⬜ pending |
| 188-18-T1–T3 | 18 | 13 | OBS-11 | T-188-48 to T-188-50 | Capped, aborting load; journey secret-free; figure with bound | operator sitting + k6 | evidence lines of each task | — | ⬜ pending |
| 188-19-T1–T3 | 19 | 14 | all four | T-188-51, T-188-52 | End state per tfvars; final plan no change; key settled | read-only + operator | evidence lines of each task | — | ⬜ pending |

Wave 0 note: each ❌ file is written first inside the task that needs it (test before code), so no separate Wave 0 plan exists; `wave_0_complete` turns true when plans 188-04 to 188-07 are done.

---

## Manual-Only Verifications

Every operator input (188-DISCUSSION-POINTS.md § G) and outward action (§ H) is an operator checkpoint, each through `attempt.sh` with a key `188-NN-2`.

| Input or action | Plan | Checkpoint |
|---|---|---|
| G1, G2, G3, G4 (H1, H2, H3); G5; the ★ fill | 188-09 | Task 2, checkpoint:human-action |
| G6: 187's first green run and 187-22, and 186-08 | every plan | precondition of Task 1: the literal `test -f` of the three SUMMARY.md files |
| H5: the push to `deploy/staging`, the first hosted append, the new function | 188-10 | Task 2, checkpoint:decision (one-way) |
| H8, H9: the consenting journey, the PostHog reads, the batch and the refusal run | 188-11 | Task 2, checkpoint:human-action |
| H6, H7: flush 600000 and ceiling 1, the stop | 188-12 | Task 2, checkpoint:decision |
| H6, H9: provider `log`, the burst | 188-13 | Task 2, checkpoint:decision |
| H6: unreachable host | 188-14 | Task 2, checkpoint:decision |
| H6: provider `none` | 188-15 | Task 2, checkpoint:decision |
| H12: the CloudShell caller | 188-16 | Task 2, checkpoint:human-action |
| H10: the WAF plans | 188-17 | Task 2, checkpoint:decision |
| H6, H11: provider `log`, the load check | 188-18 | Task 2, checkpoint:decision |
| The personal key's revocation; the final plan | 188-19 | Task 2, checkpoint:human-action |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (no `MISSING` sentinel is used; each new test file is written first in its task)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planner, 2026-11-15; the plan checker confirms
