---
phase: 79
slug: determinism-recovery-cascading-race-fix-constants-regen
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-12
---

# Phase 79 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from RESEARCH §"Validation Architecture" (lines 889-934).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (catalog-managed; `@playwright/test` in root `package.json:57`) + vitest (catalog-managed; `vitest.workspace.ts` at repo root) |
| **Config file (E2E)** | `tests/playwright.config.ts` |
| **Config file (unit)** | `vitest.workspace.ts` |
| **Quick run command** | `yarn test:e2e --project=candidate-app-mutation --workers=1 -g "should register the fresh candidate via email link" --reporter=line` |
| **Full suite command** | `yarn test:e2e --workers=1 --reporter=json > .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-N.json` |
| **Estimated runtime** | Quick: ~6-10 min (single-test isolated); Full suite: ~54 min (cold-start per run; 3-run gate = ~162 min) |

**Note (L8 correction):** `test:e2e` is a ROOT script (`package.json:28`), invoked as `yarn test:e2e ...`. The CONTEXT D-13 wording `yarn workspace @openvaa/tests test:e2e ...` is NOT a valid workspace target (there is no `@openvaa/tests` workspace). Plan 03's Bash script uses the root form.

---

## Sampling Rate

- **Per Plan 01 task commit (RCA instrumentation):** `yarn test:e2e --project=candidate-app-mutation --workers=1 -g "should register" --reporter=line` (~6-10 min; isolated registration test only).
- **Per Plan 02 task commit (frontend fix):** Quick command above + `yarn test:unit --filter=@openvaa/frontend` if touching frontend code (~30s).
- **Per Plan 02 close (D-12 1-run cold-start confirm):** Full per-run cold-start chain (~54 min). Capture: `post-fix/run-0.json`.
- **Plan 03 gate (D-11 3-run cold-start gate):** Full 3-run cold-start (~162 min) via agent-inline `Bash(run_in_background=true)`. Captures: `post-fix/run-{1,2,3}.json`.
- **Phase gate (`/gsd-verify-work`):** SHA-256 identity check + 3-pair parity gate + IMGPROXY audit (all artifacts already committed by Plan 03).
- **Max feedback latency:** ~10 min for quick smokes; ~54 min for cold-start confirm; ~162 min for full 3-run gate.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 79-01-01 | 01 | 1 | DETERM-04 | — | Auth session cookie + JWT state captured at set-password → /login redirect (H1 evidence) | E2E + Playwright tracing | `yarn test:e2e --project=candidate-app-mutation --workers=1 -g "should register" --reporter=line` (+ trace.zip artifacts to `post-fix/rca-traces/`) | ✓ existing spec | ⬜ pending |
| 79-01-02 | 01 | 1 | DETERM-04 | — | ToU checkbox render timing + Svelte hydration state captured (H2 evidence) | E2E + custom `window.__phase79RcaHydrated` flag | same as 79-01-01 | ✓ existing spec | ⬜ pending |
| 79-01-03 | 01 | 1 | DETERM-04 | — | RCA-FINDINGS.md documents confirmed hypothesis + disproof evidence per D-06 | Manual (doc review) | grep `post-fix/rca-traces/RCA-FINDINGS.md` for required sections | ❌ W0 — created in Plan 01 | ⬜ pending |
| 79-01-04 | 01 | 1 | DETERM-04 | — | RCA instrumentation reverted before Plan 02 begins (clean git state) | Bash | `git status` shows no `// RCA` markers in `apps/frontend/**` after commit | ✓ via git diff | ⬜ pending |
| 79-02-01 | 02 | 1 | DETERM-04 | — | Targeted fix lands at confirmed-hypothesis site; isolated registration test passes 3× | E2E quick smoke | `for i in 1 2 3; do yarn test:e2e --project=candidate-app-mutation --workers=1 -g "should register" --reporter=line; done` | ✓ existing spec | ⬜ pending |
| 79-02-02 | 02 | 1 | DETERM-04 | — | Full `candidate-app-mutation` project completes without cascade in describe block | E2E project run | `yarn test:e2e --project=candidate-app-mutation --workers=1 --reporter=line` | ✓ existing spec | ⬜ pending |
| 79-02-03 | 02 | 1 | DETERM-04 | — | D-12 1-run cold-start confirm: zero cascade-skips in candidate-profile describe block downstream | E2E cold-start (manual harness) | per "3-Run Cold-Start Gate Protocol" run-0 capture | ✓ harness defined in RESEARCH | ⬜ pending |
| 79-02F-01 | 02-fallback | 1 | DETERM-04 | — | `register-fresh-candidate.setup.ts` exists; mirrors `auth.setup.ts:23-57` retry-tolerance | E2E + grep | `test -f tests/tests/setup/register-fresh-candidate.setup.ts && grep -q "waitForTouCheckbox" tests/tests/setup/register-fresh-candidate.setup.ts` | ❌ W0 — created if Plan 02-fallback triggers | ⬜ contingent |
| 79-02F-02 | 02-fallback | 1 | DETERM-04 | — | `playwright.config.ts` has new project + `candidate-app-mutation` repointed | grep | `grep -A2 "register-fresh-candidate-setup" tests/playwright.config.ts` | ✓ existing config | ⬜ contingent |
| 79-02F-03 | 02-fallback | 1 | DETERM-04 | — | Registration test removed from `candidate-profile.spec.ts`; downstream tests start with `loginAsCandidate` | grep | `grep -L "should register the fresh candidate via email link" tests/tests/specs/candidate/candidate-profile.spec.ts` (should NOT match) | ✓ existing spec | ⬜ contingent |
| 79-02F-04 | 02-fallback | 1 | DETERM-04 | — | 1-run cold-start cascade-skip count is zero | E2E cold-start | per protocol | ✓ harness | ⬜ contingent |
| 79-03-01 | 03 | 1 | DETERM-05 | — | `regen-constants.mjs` copied to `post-fix/`; `reportPath` updated to `run-3.json` (L11 mitigation) | Bash | `test -f .planning/phases/79-.../post-fix/regen-constants.mjs && grep -q "run-3.json" .planning/phases/79-.../post-fix/regen-constants.mjs` | ❌ W0 — created in Plan 03 Task 1 | ⬜ pending |
| 79-03-02 | 03 | 1 | DETERM-05 | — | STATUS.md created with initial DETERM-04 GREEN, DETERM-05 IN-PROGRESS state | grep | `test -f .planning/phases/79-.../STATUS.md && grep -q "DETERM-04" .planning/phases/79-.../STATUS.md` | ❌ W0 — created in Plan 03 Task 1 | ⬜ pending |
| 79-03-03 | 03 | 2 | DETERM-05 | — | run-1.json captured (~54 min); STATUS.md updated | Bash | `test -f .planning/phases/79-.../post-fix/run-1.json` | ❌ W0 — captured in Plan 03 Task 2 | ⬜ pending |
| 79-03-04 | 03 | 2 | DETERM-05 | — | run-2.json captured; STATUS.md updated | Bash | `test -f .planning/phases/79-.../post-fix/run-2.json` | ❌ W0 — captured in Plan 03 Task 3 | ⬜ pending |
| 79-03-05 | 03 | 2 | DETERM-05 | — | run-3.json captured; STATUS.md updated | Bash | `test -f .planning/phases/79-.../post-fix/run-3.json` | ❌ W0 — captured in Plan 03 Task 4 | ⬜ pending |
| 79-03-06 | 03 | 3 | DETERM-05 | — | SHA-256 identity check across 3 runs PASSES (D-08) | Bash + shasum | per §"SHA-256 Identity Computation" in RESEARCH; emit to `post-fix/sha256.txt` | ❌ W0 — computed in Plan 03 Task 5 | ⬜ pending |
| 79-03-07 | 03 | 3 | DETERM-05 | — | If SHA fails → D-09 protocol triggers (3 more runs OR escalate via STATUS.md) | Manual + Bash | per D-09 | — | ⬜ contingent |
| 79-03-08 | 03 | 3 | DETERM-05 | — | IMGPROXY_TIED_TITLES audit clean (zero collisions) | regen-constants.mjs internal assertion | `node .planning/phases/79-.../post-fix/regen-constants.mjs` (assertion at lines 84-96 fires on collision; exit 1 = fail) | ✓ assertion exists in archived script | ⬜ pending |
| 79-03-09 | 03 | 3 | DETERM-05 | — | Constants updated in `tests/scripts/diff-playwright-reports.ts:94-199`; regen header comment block appended at lines 42-92 | grep + diff | `grep -c "Phase 79 REGEN" tests/scripts/diff-playwright-reports.ts` ≥ 1 | ✓ file exists | ⬜ pending |
| 79-03-10 | 03 | 3 | DETERM-05 | — | Self-identity smoke: `tsx tests/scripts/diff-playwright-reports.ts post-fix/run-3.json post-fix/run-3.json` emits `PARITY GATE: PASS` | Bash + tsx | command above | ✓ script exists | ⬜ pending |
| 79-03-11 | 03 | 3 | DETERM-05 | — | 3-pair parity gate: 1v2, 2v3, 1v3 all emit `PARITY GATE: PASS` | Bash + tsx | per §"Constants Regen Execution" Step 6 in RESEARCH | ✓ script exists | ⬜ pending |
| 79-03-12 | 03 | 3 | DETERM-05 | — | One atomic commit per D-10 contains: 3 run JSONs + sha256.txt + regen-output.txt + constants update + imgproxy-audit.txt | git | `git log -1 --stat` shows all 5 artifact classes | — | ⬜ pending |
| 79-03-13 | 03 | 3 | DETERM-04 + DETERM-05 | — | STATUS.md final state: GREEN; "what to do on return" section populated | grep | `grep -q "DETERM-05.*GREEN" .planning/phases/79-.../STATUS.md` | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · contingent = only if Plan 02-fallback triggers OR D-09 triggers*

---

## Wave 0 Requirements

- [ ] `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/` — directory created by Plan 01 Task 1 (RCA artifact landing zone) + Plan 03 Task 1 (regen artifacts).
- [ ] `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/rca-traces/` — created by Plan 01 Task 1 (trace.zip + state JSONs).
- [ ] `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` — copied verbatim from `.planning/milestones/v2.9-phases/73-determinism-baseline/post-fix/regen-constants.mjs` at Plan 03 Task 1; `reportPath` updated to `run-3.json`.
- [ ] `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/STATUS.md` — created at Plan 03 Task 1 (could be earlier if operator wants Plan 01/02 progress visibility — recommended at Plan 01 Task 1).
- [ ] `tests/tests/setup/register-fresh-candidate.setup.ts` — ONLY IF restructure path triggers (Plan 02-fallback). Mirrors `auth.setup.ts:23-57` retry-tolerance pattern.

**Framework install:** None — Playwright + vitest already installed at HEAD per `package.json` + `tests/playwright.config.ts`. No new dependencies.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Operator pre-departure setup (D-15): kill Vite (port 5173); Supabase stays up | DETERM-05 prerequisite | Pre-condition for the unattended-agent gate; operator action, not agent-executable | Operator: `lsof -ti:5173 \| xargs kill -9` (or `pkill -f vite`); verify `supabase status` shows healthy services |
| Wake-up: operator returns, reads `STATUS.md` + recent `git log` to assess phase state | DETERM-05 handoff | Human assessment after long-running gate | Operator: open `.planning/phases/79-.../STATUS.md`; check sections "DETERM-04 status", "DETERM-05 status", "What to do on return"; `git -c core.hooksPath=/dev/null log --oneline -20` |
| RCA findings narrative (Plan 01 Task 3): operator reviews `RCA-FINDINGS.md` for clarity before Plan 02 fix authoring | DETERM-04 | Empirical evidence interpretation has judgment call | Operator: read `post-fix/rca-traces/RCA-FINDINGS.md`; confirm or contest the confirmed hypothesis |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies — verified via per-task verification map above
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify — verified (every task has a Bash/grep/E2E check)
- [ ] Wave 0 covers all MISSING references — 5 Wave 0 items enumerated above
- [ ] No watch-mode flags — verified (no `--watch` in any command)
- [ ] Feedback latency < ~54 min per quick smoke / ~162 min for full gate
- [ ] `nyquist_compliant: true` set in frontmatter — pending plan-checker pass

**Approval:** pending (set after gsd-plan-checker confirms Dimension 8 coverage)
