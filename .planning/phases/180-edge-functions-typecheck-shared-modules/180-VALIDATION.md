---
phase: "180"
slug: "edge-functions-typecheck-shared-modules"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-12"
---

# Phase 180 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Source: `180-RESEARCH.md` § Validation Architecture, as the plans and `180-EXECUTION-RULES.md` instantiate it. Draft: the counts in it are planning measurements, and every one is re-measured at run time.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Deno 2.9.6 `deno check` (new, `@openvaa/supabase#typecheck`); vitest (`apps/supabase`, `packages/dev-seed`, every workspace through turbo); Node gate scripts (`yarn lint:check` chain); Playwright through `tests/scripts/e2e-run.sh`; the `edge-runtime:v1.76.2` image standalone for bundles; the Deno language server for the editor probe |
| **Config file** | `apps/supabase/supabase/functions/deno.json` (new); `apps/supabase/vitest.config.ts` (unchanged); `tests/playwright.config.ts` (unchanged) |
| **Quick run command** | `yarn workspace @openvaa/supabase typecheck` · `yarn workspace @openvaa/supabase test:unit` · `yarn assert:edge-env-defaults` (stack-free, about 10 s warm) |
| **Full suite command** | `yarn lint:check` · `yarn format:check` · `yarn test:unit` (needs the stack) · `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/180/<label> --no-db-reset` (needs the stack, about 21 minutes) |
| **Estimated runtime** | quick ~10 s; the stack-free unit suite a few minutes; each of the phase's two E2E runs ~21 minutes |

---

## Sampling Rate

- **After every task commit:** the quick commands plus `yarn assert:comment-hygiene` when a comment changed; before every commit that changes a file outside `.planning/`, the full unit suite: `UNIT_STACKFREE` before the plan's D-26 checkpoint, `yarn test:unit` after it (execution rules § The unit suites).
- **Per plan (operator ruling 2026-11-09, D-29):** plan 01 makes no E2E run; plan 02 makes one targeted green run, `--project perm-closed-project`, which holds every function-driving project (thirteen per-project runs measured at ~50 minutes against ~21); plan 03 makes the phase's one full run. Each is judged against `179.2-final-4` (729/729) with the summed deltas (none expected).
- **Before `/gsd-verify-work`:** plan 03's full run, the CI job, the bundle passes and the probe, all green on the final tree.
- **Max feedback latency:** 60 seconds for the quick commands.

---

## Per-Task Verification Map

| Task | Criterion / decision | Test type | Automated command (summary; the plan's `<automated>` block is binding) | Exists at planning | Status |
|------|----------------------|-----------|--------------------------------------------------------------------------|--------------------|--------|
| 180-01 T1 | D-03, router (resolution 1) | static | per-directory `git diff --quiet 796e610a7 HEAD` of `sources/037…040`; the reference with its branch section cut out equals the spike's bytes; SKILL.md and CLAUDE.md anchors; `UNIT_STACKFREE` | ✅ git, node | ⬜ pending |
| 180-01 T2 | D-02, D-24, D-29 | instrument controls | the A1 text check; `180-totals.mjs` green/red/rows/unreadable; `180-run-checks.mjs` green/red-restore/red-project/unreadable on `179.2-final-3` / `-final-4` | ❌ Wave 0 (this task) | ⬜ pending |
| 180-02 T1 | SC-1; D-04, D-07 to D-10 | gate + control | `cmp` of `deno.json`; pin and script by `node -e`; cold `DENO_DIR` run with one `Check` line per tracked non-test module (26); turbo `--dry=json` lists `@openvaa/supabase#typecheck`; root `yarn typecheck` 0; the tracer plant red through the root `yarn typecheck`; no `any` left | ❌ until the task | ⬜ pending |
| 180-02 T2 | SC-3; D-14 | static + unit | neither decoder file tracked; no decoder reference outside `.planning/` and the spike's skill; the 2026-10-07 record names no absent module; `UNIT_SUPA`, `UNIT_STACKFREE` before the commit | ❌ until the task | ⬜ pending |
| 180-02 T3 | SC-3; D-13, D-15 to D-17 | static + unit | `_shared/` holds exactly four files; one copy per module; every importer on `../_shared/`; the scoped prose gate empty; the parity case title kept; guard `checks live: 2 of 2`; cold count 22; `UNIT_SUPA`, `UNIT_STACKFREE` | ❌ until the task | ⬜ pending |
| 180-02 T4 | SC-2 (docs); D-12, D-18 | static | editor-setup anchors (enablePaths, `deno.path`, never `deno.enable`, Prettier, `editor.defaultFormatter`) in the README and the docs page; no `.vscode/`; D-12 proxy: no `fmt` key in `deno.json` and `yarn prettier --check apps/supabase/supabase/functions` 0; docs links 0; the commit touches only the two docs | ❌ until the task | ⬜ pending |
| 180-02 T5 | SC-1, SC-3 controls; SC-2 static | control + gate | plants in `_shared/envConfig.ts` (red), `send-email/index.ts` (red), `callerAuthority.test.ts` (green); turbo FULL TURBO then cache-miss red; guard plant red with two violations; parity drift red with the failing case `is declared once in apps/frontend/…/identityProviderAccount.ts, with the same literal` named on a failure line (a run that collects no test file does not count); `yarn lint:check`, `yarn format:check`, `UNIT_STACKFREE` 0; one tracked Deno config outside the spike's sources; no `.vscode/`, no `"deno.enable"` | ❌ until the task | ⬜ pending |
| 180-02 T6 | D-26 | checkpoint | the operator's word; `$U/180-02-stack.txt` absent until it is given | — | ⬜ pending |
| 180-02 T7 | SC-5 (local), E2E-03; D-23, D-24 | unit + E2E | the stack record; `yarn test:unit` 0 with the integration file run; the derived function-project record; `180-totals.mjs --slice`, `e2e-spec-verdict.mjs --no-flaky --passed contestant-bank-auth.spec.ts --passed contestant-identity-provider.spec.ts`, `180-run-checks.mjs --projects`; head check | ✅ wrapper, evidence, verdict | ⬜ pending |
| 180-03 T1 | SC-4, SC-2 (editor); D-19, D-20 | Docker + LSP | `180-verify-bundles.sh` on exports with and without `deno.json`: bundle exit 0, `_shared/` set equal to the entry points' imports (and to D-20's list), no test file, `cmp` identical, `OPTIONS 200`; probe S8 vanilla 0/7, S9 above 0; the evidence commit's checks | ❌ Wave 0 (this task writes both scripts) | ⬜ pending |
| 180-03 T2 | D-28 | checkpoint | the operator's push decision, with the home-path scan | — | ⬜ pending |
| 180-03 T3 | SC-5 (CI); D-22, D-25, D-06, D-12 | CI + records | the run of the pushed commit has `frontend-and-shared-module-validation` `success`; its Type-check step prints one `@openvaa/supabase:typecheck` `Check` line per non-test module (22) and registry downloads; the todos moved and annotated; the Phase 174 note; the reference's after-phase section, with D-12 recorded as documented, not observed, and no `fmt` key | ❌ needs the D-28 go | ⬜ pending |
| 180-03 T4 | D-26 | checkpoint | the operator's word; no stack record before it | — | ⬜ pending |
| 180-03 T5 | SC-4 (restarted stack), SC-5, E2E-03 | gates + E2E | `yarn build`, `yarn test:unit`, `yarn lint:check`, `yarn format:check`, `test:db`, `db:lint:sql`, docs links, `assert:e2e-coverage-tags`, Prettier over the functions tree 0, `audit:deps` 0 or no Deno finding; every root `assert:*` traced to `lint:check`, `test:unit` (`assert:unit-coverage`) or its own green run; no `fmt` key; the full run: `180-totals.mjs --full`, the verdict with both bank-auth spec files, `180-run-checks.mjs` (`restore.txt` `OPTIONS <fn>: 200` per function), head check | ✅ wrapper, evidence, verdict | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `180-EXECUTION-RULES.md` — written at planning: the D-26 checkpoint and stack check in place of 179.2's "stack is free" paragraph, D-27 to D-29, the unit-suite rule, the targeted-run choice, the evidence channel.
- [ ] `180-E2E-DELTAS.md` (header only), `180-totals.mjs`, `180-run-checks.mjs` — plan 01 Task 2, each shown red and green.
- [ ] `180-CONTROL-LEDGER.md` — plan 02 Task 1.
- [ ] `180-function-projects.md` — plan 02 Task 7, derived at run time.
- [ ] `180-verify-bundles.sh`, `180-lsp-probe.mjs` (adapted copies; the spike's `sources/` stay verbatim) — plan 03 Task 1.
- No new test framework, config or spec (resolution 4: no wiring spec).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| An editor with the documented setting still formats this tree with Prettier, not `deno fmt` | D-12 (criterion 2) | Documented, not observed: no editor runs in the agent environment, and the language-server probe measures diagnostics, not the formatter an editor picks. The `fmt` exclude is not used (`deno.json` keeps D-08's keys; resolution 2), so nothing enforces the editor's choice; the README and the docs page tell the contributor to keep Prettier as `editor.defaultFormatter`. Recorded the same way in the spike reference's branch section (plan 03) | In VS Code with `"deno.enablePaths": ["apps/supabase/supabase/functions"]` and Prettier as `editor.defaultFormatter` for TypeScript, format `apps/supabase/supabase/functions/send-email/index.ts`: the file is unchanged. Automated proxy (plans 02 and 03): `$FN/deno.json` has no `fmt` key, `yarn prettier --check apps/supabase/supabase/functions` exits 0, and `yarn format:check` is green. |
| A relative `deno.path` (`node_modules/.bin/deno`) is accepted by the VS Code Deno extension | D-18 (documented as optional and unverified) | No editor observed (research Assumption A3) | Set it, reload, and check the extension's output channel names Deno 2.9.6. |
| The answers to the three checkpoints (D-26 twice, D-28 once) | D-26, D-28 | Operator decisions | Recorded verbatim with their times in the plan SUMMARYs. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s for the quick commands
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
