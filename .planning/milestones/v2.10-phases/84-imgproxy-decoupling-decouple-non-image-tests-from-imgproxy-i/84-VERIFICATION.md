---
phase: 84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i
verified: 2026-05-14T00:00:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
deferred:
  - truth: "Strict 3-run SHA-identity gate (run-1 ≡ run-2 ≡ run-3)"
    addressed_in: "Phase 86"
    evidence: "Phase 86 success criteria DETERM-12: 'Popups + hydration cluster (~2 tests) deterministically pass'. Run-2 divergent cell is voter-detail party-drawer — a pre-existing Phase 83 PASS_LOCKED-boundary graduate (DETERM-07b hydration-guard), not Phase 84 scope, and explicitly routed to Phase 86 in SUMMARY + sha256.txt + diff-playwright-reports.ts jsdoc."
human_verification: []
---

# Phase 84: Imgproxy Decoupling — Verification Report

**Phase Goal:** Decouple non-image tests from the Supabase imgproxy infrastructure flake so DATA_RACE shrinks 15 → ≤3 (only CAND-03 image-upload + CAND-12 readback + CAND-03 image-rendered-on-page remain). Renegotiate the Phase 73 D-09 IMGPROXY_TIED_TITLES binding contract; capture a fresh v2.10 anchor that supersedes Phase 83's SHA `d6bfeebdb0…`.
**Verified:** 2026-05-14
**Status:** passed (with deferral — run-2 voter-detail party-drawer flake routed to Phase 86)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | DETERM-08 closed: post-login candidate-home + candidate-app-settings pages do not synchronously await imgproxy on initial paint; gating mechanism (per RESEARCH D-02 branch 2 = project-graph cascade repoint) actually delivered. | ✓ VERIFIED | `tests/playwright.config.ts:148-152` — re-auth-setup project has `dependencies: ['candidate-app']` (was `['candidate-app-mutation']`); Phase 84 DETERM-08 comment block present at lines 135-147. Rule 1 deviation fix delivered at `tests/tests/specs/candidate/candidate-settings.spec.ts:75-87` (file-scoped re-auth in `test.beforeAll`). 3-run gate shows all 11 candidate-app-settings + 2 password + 2 re-auth-dual tests PASS deterministically (sha256.txt lines 80-104). |
| 2 | DETERM-09 (config-knob tuning) is FALLBACK only — triggered iff DETERM-08 alone does NOT reach DATA_RACE ≤ 3. Plan 02 correctly skipped. | ✓ VERIFIED | `84-02-SUMMARY.md` documents `status: not_executed`, `contingent_trigger_fired: false`. `apps/supabase/supabase/config.toml:137-138` still reads `[storage.image_transformation]\nenabled = true` (Phase 83 D-01c state preserved; no sub-knobs added). `git log --all -- apps/supabase/supabase/config.toml` last commit is `11157a4c3` (Phase 83); zero Phase 84 commits touched this file. |
| 3 | DATA_RACE pool 15 → 3, surviving entries are EXACTLY the 3 image-intrinsic tests. | ✓ VERIFIED | `tests/scripts/diff-playwright-reports.ts:246-250` shows `DATA_RACE_TESTS` with exactly 3 entries: `should persist profile image after page reload (CAND-12)`, `should show editable info fields on profile page (CAND-03)`, `should upload a profile image (CAND-03)` — all scoped under `candidate-app-mutation`. The 4 re-auth-dual + 11 candidate-app-settings + 2 password entries are NO LONGER in DATA_RACE_TESTS (they migrated to PASS_LOCKED_TESTS lines 137-243). Regen-output.txt header at line 110: `=== DATA_RACE_TESTS (3) ===`. |
| 4 | Phase 73 D-09 structural binding renegotiated: IMGPROXY_TIED_TITLES shrunk 14 → 3. | ✓ VERIFIED | `.planning/phases/79-…/post-fix/regen-constants.mjs:82-86` shows exactly 3 array elements matching the spec, with the renegotiation comment block at lines 68-81 citing "Phase 84 DETERM-08 + Phase 73 D-09 renegotiation". The match-count assertion gate at lines 91-103 is preserved byte-identical (still calls `process.exit(1)` on zero-match). Live behavioral spot-check (Step 7b): `node regen-constants.mjs` against run-3.json reports "IMGPROXY_TIED_TITLES match-count assertion: 3 titles, 3 total matches." |
| 5 | Fresh 3-run cold-start gate captured; new v2.10 anchor SUPERSEDES Phase 83 SHA `d6bfeebdb0…`. | ⚠️ VERIFIED-with-deferral | `post-fix/sha256.txt`: run-1 = run-3 = `04ddfdd85cfbcd6505626eb8fb50f3e6f35c11e5385df1f4c8695b22ed0655aa`; run-2 differs by ONE cell only — the voter-detail party-drawer test (a pre-existing Phase 83 DETERM-07b PASS_LOCKED graduate, not Phase 84 scope, transparently disclosed in sha256.txt:15-25 + diff-playwright-reports.ts jsdoc lines 114-129 + SUMMARY §"Run-2 Party-Drawer Flake"). Routed to Phase 86 (DETERM-12 voter-app FAILURE-CLASS cleanup). All Phase-84-scope tests deterministic-PASS × 3. New anchor SHA committed in `tests/scripts/diff-playwright-reports.ts:86`. Phase 83 anchor explicitly "ABSORBED" at line 83. |

**Score:** 5/5 must-haves verified (SC #5 = passed-with-deferral; the deferred item is the run-2 party-drawer flake, addressed in Phase 86 per ROADMAP.md DETERM-12 scope).

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|--------------|----------|
| 1 | Strict-identity 3-run gate (run-1 ≡ run-2 ≡ run-3) for the voter-detail party-drawer test | Phase 86 | Phase 86 success criterion #1: "DETERM-12 closed: Popups + hydration cluster (~2 tests) deterministically pass OR `test.skip()`+rationale." Per `84-RCA-FINDINGS.md` (instrumented capture) + sha256.txt:29-39, the party-drawer flake fetches ZERO `/storage/v1/*` requests → NOT imgproxy-related → out of Phase 84 (DETERM-08) scope. The test was promoted to PASS_LOCKED in Phase 83 via DETERM-07b hydration-completeness guard; Phase 84's run-2 flake is a PASS_LOCKED-boundary graduate regression that lives in the voter-app hydration cluster — exactly Phase 86's stated cluster. |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/playwright.config.ts` | re-auth-setup project entry dependency repointed to `['candidate-app']` | ✓ VERIFIED | Line 151 reads `dependencies: ['candidate-app']`; preceding comment block (lines 135-147) explicitly cites "Phase 84 DETERM-08"; no occurrence of `['candidate-app-mutation']` for re-auth-setup remains. |
| `tests/tests/specs/candidate/candidate-settings.spec.ts` | Rule 1 deviation: file-scoped re-auth in `test.beforeAll` | ✓ VERIFIED | Lines 75-87 implement the documented `test.beforeAll` pattern (fresh browser context + UI login + storageState overwrite). Comment block at lines 54-74 documents Rule 1 root cause (Alpha refresh-token revocation from candidate-registration.spec.ts setPassword) and rationale (minimal blast-radius vs. dep-graph redesign / dedicated ToU-setup / reorder). Matches SUMMARY §"Rule 1 — File-Scoped Re-Auth Fix". |
| `.planning/phases/79-…/post-fix/regen-constants.mjs` | IMGPROXY_TIED_TITLES shrunk 14 → 3 in-place; match-count assertion preserved | ✓ VERIFIED | Lines 82-86: exactly 3 string entries matching SC #4. Comment block lines 68-81 cites "Phase 84 DETERM-08 + Phase 73 D-09 renegotiation (2026-05-13): pool shrunk 14 → 3." Reportpath at line 25 re-pointed at Phase 84's run-3.json. Match-count assertion at lines 91-103 byte-identical; `node --check` exits 0. |
| `tests/scripts/diff-playwright-reports.ts` | Phase 84 anchor section: jsdoc + 3 arrays | ✓ VERIFIED | Jsdoc block at lines 42-133 fully replaced with "PHASE 84 REGEN" narrative. PASS_LOCKED_TESTS = 106 entries (lines 137-242), DATA_RACE_TESTS = 3 entries (246-249), CASCADE_TESTS = 47 entries (253-300). New anchor SHA `04ddfdd85c…` at line 86; Phase 83 anchor `d6bfeebdb0…` ABSORBED at lines 82-84. Run-2 party-drawer flake transparently disclosed at lines 114-129. |
| `post-fix/sha256.txt` | 3-run identity record + party-drawer flake disclosure | ✓ VERIFIED | Lines 4-6 record 3 SHA values. Lines 15-25 document run-1 ≡ run-3 identity; lines 17-23 explicitly list the 1-cell divergence (voter-detail party-drawer). Lines 78-111 enumerate Phase-84-scope tests with `✓✓✓ (3/3 passed)` for all 11 settings + 2 password + 2 re-auth-dual + 3 image-intrinsic + 16 mutation tests. |
| `post-fix/regen-output.txt` | Phase 84 regen array output | ✓ VERIFIED | Headers at lines 2/110/115 match `=== PASS_LOCKED_TESTS (106) ===` / `=== DATA_RACE_TESTS (3) ===` / `=== CASCADE_TESTS (47) ===`. Sizes match `diff-playwright-reports.ts` arrays. |
| `post-fix/run-{1,2,3}.json` + `run-{1,2,3}.sha256` | 3-run captures + per-run hash files | ✓ VERIFIED | All 6 files present; JSON files ~323 KB each (non-empty); sha256 files contain the 3 hash values matching `sha256.txt`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|------|------|--------|---------|
| `tests/playwright.config.ts` re-auth-setup project | `candidate-app` project (NOT `candidate-app-mutation`) | `dependencies: ['candidate-app']` | ✓ WIRED | Line 151 reads exactly `dependencies: ['candidate-app']` — matches plan pattern `dependencies:\s*\['candidate-app'\]`. |
| `regen-constants.mjs` IMGPROXY_TIED_TITLES const | DATA_RACE classification rule | `isImgproxyTied(id)` helper at line 87 | ✓ WIRED | `isImgproxyTied` helper present line 87; used by partition logic at lines 111-113 (`passLocked = ...filter(... !isImgproxyTied(t.id))`, `dataRace = ...filter(isImgproxyTied(t.id) || rawStatus === 'flaky')`). |
| `diff-playwright-reports.ts` DATA_RACE_TESTS array | 3 image-intrinsic IDs | regen-output.txt paste (Task 6 atomic regen) | ✓ WIRED | Array at lines 246-250 contains exactly the 3 IDs matching the shrunk IMGPROXY_TIED_TITLES; same 3 IDs appear in regen-output.txt's `=== DATA_RACE_TESTS (3) ===` block. |
| `regen-constants.mjs` reportPath | Phase 84 `run-3.json` | `join(__dirname, '..', '..', '84-…', 'post-fix', 'run-3.json')` | ✓ WIRED | Line 25 explicitly re-pointed at the Phase 84 run-3 capture; comment block lines 19-24 documents the re-point and notes run-1 ≡ run-3 identity. |

### Data-Flow Trace (Level 4)

Not applicable — Phase 84 modifies test-infrastructure config files (playwright.config.ts), test scripts (regen-constants.mjs / diff-playwright-reports.ts), and a single E2E spec (candidate-settings.spec.ts). No frontend artifacts render dynamic data as part of this phase's scope.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `node --check` validates regen-constants.mjs is parseable | `node --check .planning/phases/79-…/post-fix/regen-constants.mjs` | exit 0 (SYNTAX-OK) | ✓ PASS |
| `regen-constants.mjs` runs against Phase 84 run-3.json and emits expected partition sizes | `node .planning/phases/79-…/post-fix/regen-constants.mjs` | "IMGPROXY_TIED_TITLES match-count assertion: 3 titles, 3 total matches." + `=== PASS_LOCKED_TESTS (106) ===` + `=== DATA_RACE_TESTS (3) ===` + `=== CASCADE_TESTS (47) ===` | ✓ PASS |
| Array entry counts in `diff-playwright-reports.ts` match SUMMARY figures (106 + 3 + 47 = 156) | `awk` line-range count per array | 106 / 3 / 47 (total 156) | ✓ PASS |
| `apps/supabase/supabase/config.toml [storage.image_transformation]` unchanged from Phase 83 D-01c | `grep -A 1 "\[storage.image_transformation\]" apps/supabase/supabase/config.toml` | `enabled = true` (no sub-knobs added) | ✓ PASS |
| Phase 84 commits do NOT touch out-of-scope files (STATE.md / ROADMAP.md / config.toml) | `git log 9f4daffda 9c87144f6 c60200c36 606d76d59 86e94d3d1 067b01dee 752967db6 93050e4fb 11975ad6c df79a3d18 --name-only` | Only test/planning/post-fix artifacts; zero hits on STATE.md / ROADMAP.md / config.toml | ✓ PASS |

### Probe Execution

Phase 84 PLAN/SUMMARY does not declare formal `scripts/*/tests/probe-*.sh` probes; the project's probe-style verification is the 3-run cold-start gate (D-08), which the agent cannot re-run within the verifier's 10-second budget (each cold-start is ~54 minutes). Verifier relies on:
1. **Captured gate evidence**: sha256.txt lines 4-6 + run-{1,2,3}.sha256 files (run-1 == run-3 = `04ddfdd85c…`).
2. **Behavioral spot-check** of the regen script against the captured run-3.json (passes; emits 106 + 3 + 47).
3. **Cross-check of array sizes** against the regen-output.txt header lines.

| Probe | Command | Result | Status |
|-------|---------|--------|--------|
| (none declared as `scripts/*/tests/probe-*.sh`) | — | — | SKIPPED (no formal probes; 3-run gate captured & cross-checked instead) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DETERM-08 | 84-01-PLAN.md | Non-image tests decoupled from imgproxy infrastructure flake; DATA_RACE 15 → ≤3 | ✓ SATISFIED | re-auth-setup repointed (tests/playwright.config.ts:148-152); DATA_RACE 15 → 3 verified (diff-playwright-reports.ts:246-250); dual-project re-auth + 11 settings + 2 password entries migrated from DATA_RACE → PASS_LOCKED. |
| DETERM-09 | 84-02-PLAN.md (contingent fallback) | `apps/supabase/supabase/config.toml [storage.image_transformation]` tuned for cold-start resilience as PARALLEL LEVER to DETERM-08 (not a substitute) | ✓ SATISFIED (as DEFERRED-UNNECESSARY) | Per the REQUIREMENT's own phrasing ("Parallel lever to DETERM-08; not a substitute for the structural decoupling"), DETERM-09 is a fallback knob that does NOT require unconditional application. CONTEXT.md D-04 + D-03 cheapest-first ladder explicitly halt at Plan 01 if DETERM-08 alone reaches DATA_RACE ≤ 3. DATA_RACE landed at 3 → trigger condition NOT fired → 84-02-SUMMARY.md records `status: not_executed`, `auto_complete: skipped-ladder-halted-at-plan-01`. config.toml unchanged. Knob-tune prescription documented in 84-02-PLAN.md remains available for future cold-start hits per Phase 73 Pitfall 5. |

### Anti-Patterns Found

Scan run on Phase 84-modified files (`tests/playwright.config.ts`, `tests/tests/specs/candidate/candidate-settings.spec.ts`, `.planning/phases/79-…/post-fix/regen-constants.mjs`, `tests/scripts/diff-playwright-reports.ts`).

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none found) | — | — | — | No `TBD`, `FIXME`, `XXX`, placeholder, or stub patterns in Phase 84-modified surfaces. All TODOs in unrelated files are pre-existing. |

---

## Locked-Decisions Cross-Check (CONTEXT.md D-01..D-08)

| Decision | Locked | Delivered | Verdict |
|----------|--------|-----------|---------|
| D-01: Scout-then-decide via research agent's empirical instrumentation | Yes | RCA-FINDINGS.md captures cold-start network surface with zero `/storage/v1/*` on candidate-home/settings paths; RESEARCH.md cites the same evidence at §"Root-Cause Verdict" | ✓ HONORED |
| D-02: Branch 2 (dependency-chain cascade fix via project-graph repoint) | Yes (at planning time per RCA verdict) | tests/playwright.config.ts:148-152 repoints re-auth-setup → candidate-app; commit 93050e4fb | ✓ HONORED |
| D-03: Cheapest-first ladder — DETERM-08 → 1-run smoke → DETERM-09 only if pool > 3 | Yes | Plan 01 Task 2 1-run smoke + Task 3 checkpoint; smoke surfaced Rule 1 latent bug (commit 86e94d3d1) and post-fix re-smoke confirmed DATA_RACE = 3 (commit 606d76d59); D-03 verdict = `approved` → Plan 02 NOT triggered | ✓ HONORED |
| D-04: DETERM-09 atomic 4-knob tune as contingent fallback | Yes | Plan 02 (84-02-PLAN.md) defines the 4-knob atomic tune; trigger condition NOT met; auto_complete = skipped-ladder-halted-at-plan-01 | ✓ HONORED (deferred-unnecessary) |
| D-04b: `[storage.image_transformation] enabled = true` preservation | Yes | apps/supabase/supabase/config.toml:137-138 unchanged from Phase 83 D-01c | ✓ HONORED |
| D-05: In-place edit of IMGPROXY_TIED_TITLES in archived regen-constants.mjs (NOT forked) | Yes | regen-constants.mjs:82-86 edited in-place (commit c60200c36); no Phase-84 fork created | ✓ HONORED |
| D-06: Atomic-commit-per-task + regen-bundle exception | Yes | Task 6 atomic regen (commit 11975ad6c) bundles exactly 4 files: regen-constants.mjs + regen-output.txt (Phase 79 dir) + regen-output.txt (Phase 84 dir) + diff-playwright-reports.ts | ✓ HONORED |
| D-07: Anchor expectation ~108 PASS_LOCKED (actual count binds) | Yes | Actual = 106 PASS_LOCKED. SUMMARY §"Anchor Count Delta vs Expected" documents the −2 delta (8 settings + 2 password + 2 re-auth-dual = 12, not 14, because the 7 wave-A SETTINGS-01 tests were already PASS_LOCKED in Phase 83 baseline) | ✓ HONORED |
| D-08: 3-run gate via run_in_background + strict identity | Yes (with documented absorbed mismatch on a single non-phase-scope cell) | sha256.txt captures run-1 ≡ run-3 identity (04ddfdd85c…); run-2 differs by 1 cell (voter-detail party-drawer) — pre-existing Phase 83 graduate, routed to Phase 86 per ROADMAP.md | ✓ HONORED-with-deferral |

---

## Phase 86 Hand-Off Note

The run-2 voter-detail party-drawer flake is explicitly documented as a Phase 86 entry:
- `84-01-SUMMARY.md` §"Run-2 Party-Drawer Flake (Transparent Disclosure)" + §"Phase 86 Follow-Up Hand-Off" — recommends extending DETERM-07b hydration-guard to assert drawer's first tab `[role="tab"]` interactive-state.
- `tests/scripts/diff-playwright-reports.ts:114-129` — jsdoc transparently discloses the run-2 divergence and routes to Phase 86 DETERM-12.
- `post-fix/sha256.txt:15-25, 56-77` — full per-test diff + operator-aligned checkpoint decision (path (a) ACCEPT with disclosure).

This deferral does NOT block Phase 84 SC closure because:
1. All Phase-84-scope tests are deterministic-PASS × 3 (verified via sha256.txt lines 78-111).
2. The flake is NOT imgproxy-related (RCA-FINDINGS confirmed zero `/storage/v1/*` requests for party-drawer).
3. Phase 86 (DETERM-12 voter-app FAILURE-CLASS cleanup, popups + hydration cluster) explicitly owns this surface per ROADMAP.md.

---

## Gaps Summary

**No gaps blocking phase close.** All 5 success criteria are achieved. The single SC #5 caveat (3-run strict-identity gate) is an explicit deferral to Phase 86 with documented rationale, not a Phase 84 failure — Phase 84's structural goal (DETERM-08 closed, DATA_RACE 15 → 3, IMGPROXY_TIED_TITLES 14 → 3, v2.10 anchor regenerated) is fully delivered.

### Out-of-Scope Modification Audit

| File | Should be touched? | Actually touched by Phase 84 commits? | Verdict |
|------|--------------------|----------------------------------------|---------|
| `.planning/STATE.md` | No (orchestrator owns) | No | ✓ CLEAN |
| `.planning/ROADMAP.md` | No (orchestrator owns) | No | ✓ CLEAN |
| `apps/supabase/supabase/config.toml` | No (Plan 02 territory; not triggered) | No | ✓ CLEAN |

---

## Human Verification Required

None. All success criteria verified programmatically against codebase, captured run-N.json files, sha256.txt audit, and behavioral spot-checks of the regen pipeline. The single accepted-deferral (run-2 party-drawer flake) is transparently disclosed in 3 different artifacts (SUMMARY, sha256.txt, diff-playwright-reports.ts jsdoc) and explicitly routed to Phase 86's owned scope.

---

*Verified: 2026-05-14*
*Verifier: Claude (gsd-verifier, goal-backward verification mode)*
