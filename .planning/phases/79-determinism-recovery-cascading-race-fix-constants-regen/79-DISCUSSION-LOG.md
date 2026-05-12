# Phase 79: Determinism Recovery (Cascading-Race Fix + Constants Regen) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 79-determinism-recovery-cascading-race-fix-constants-regen
**Areas discussed:** Fix path for cascading race, Root-cause investigation depth, Constants regen mechanism (DETERM-05), 3-run cold-start gate execution

---

## Fix path for cascading race

### Q1: Which fix path resolves DETERM-04's cascading race?

| Option | Description | Selected |
|--------|-------------|----------|
| Restructure to setup project | Extract registration + ToU acceptance into `register-fresh-candidate.setup.ts`. Roadmap-suggested; cheapest to ship; unblocks Phases 80-82 fastest. File frontend-race RCA as separate todo. | (fallback) |
| Frontend race fix | RCA the post-set-password redirect race (auth session vs ToU hydration). Patch at the app layer. Higher upside (fixes real candidate-registration UX). | ✓ (primary) |
| Both (restructure + frontend RCA) | Restructure for cascade-immunity AND fix the underlying race. Belt-and-suspenders; longest critical path. | |

**User's choice:** "2 and if it doesn't work 1" — frontend race fix primary; restructure as contingent fallback.
**Notes:** User prioritises fixing the real bug (which affects real candidates on first registration) over the cheapest-test-only path, but wants a deterministic fallback to ensure Phases 80-82 unblock even if the frontend RCA stalls.

### Q2: What budget triggers the fallback to test restructure if the frontend fix doesn't land?

| Option | Description | Selected |
|--------|-------------|----------|
| Time-boxed (1 RCA plan + 1 fix plan) | If after ~2 plans the cold-start cascade still repros 3/3, fall back. Deterministic exit criterion. | ✓ |
| Empirical (failed 3-run cold-start) | RCA + fix attempted unboundedly until the gate's run-1 still cascades. Risk: open-ended. | |
| Hypothesis-bounded (try both top-2 hypotheses) | Try both ToU-hydration AND auth-session-propagation. Pivot if neither resolves. | |

**User's choice:** Time-boxed (1 RCA plan + 1 fix plan).
**Notes:** Caps investigation cost; deterministic exit; aligns with the Phase 73 1-plan-then-decide pattern.

### Q3: If we fall back to restructure, what gets extracted into the setup project?

| Option | Description | Selected |
|--------|-------------|----------|
| Registration + ToU only | `register-fresh-candidate.setup.ts` extracts steps 1-7. Mirrors auth.setup.ts retry-tolerance. Downstream tests just loginAsCandidate(). | ✓ |
| Full unauth-to-authed bootstrap | Setup also saves `fresh-candidate.json` storageState; skip per-test re-login. | |
| Only registration (ToU stays inline) | Minimal extraction; doesn't fully resolve cascade if ToU hydration is the race. | |

**User's choice:** Registration + ToU only.
**Notes:** Smallest blast radius; preserves existing test names; keeps the registration assertion.

### Q4: How should the RCA plan instrument the race?

| Option | Description | Selected |
|--------|-------------|----------|
| Both hypotheses in parallel | Single RCA plan instruments BOTH auth-session-propagation + ToU-hydration paths. Picks root cause empirically. | ✓ |
| Sequence: ToU hydration first | Focus on hypothesis 2; pivot if disproven. | |
| Sequence: auth session first | Focus on hypothesis 1; pivot if disproven. | |

**User's choice:** Both hypotheses in parallel.
**Notes:** One plan, two evidence streams. Avoids wasting a plan if hypothesis 1 (or 2) is dead-on-arrival.

---

## Root-cause investigation depth

### Q1: How should RCA findings be preserved during the investigation?

| Option | Description | Selected |
|--------|-------------|----------|
| Committed traces + RESEARCH section | Network panel + console logs + screenshots into `post-fix/rca-traces/`; RESEARCH.md §"DETERM-04 RCA". Forensic-grade evidence. | ✓ |
| Inline SUMMARY only | RCA findings in plan SUMMARY.md only; no separate traces. | |
| Findings-only (no traces, no SUMMARY section) | Commit message + follow-up todo. Minimal docs. | |

**User's choice:** Committed traces + RESEARCH section.
**Notes:** User explicitly values future-proofing — if the race ever reopens, the disproof evidence informs the new RCA.

### Q2: If RCA confirms one hypothesis and disproves the other, what happens to the disproven path?

| Option | Description | Selected |
|--------|-------------|----------|
| Document disproof + move on | RESEARCH.md records WHY disproven (with evidence pointers). Fix focuses on confirmed root cause. | ✓ |
| Continue instrumenting both | Defensive belt-and-suspenders; risks scope creep. | |
| No documentation — just fix the confirmed one | Saves time; loses negative-evidence audit trail. | |

**User's choice:** Document disproof + move on.
**Notes:** Preserves negative-evidence audit trail without doubling fix-plan scope.

---

## Constants regen mechanism (DETERM-05)

### Q1: Which mechanism regenerates the PASS_LOCKED / DATA_RACE / CASCADE constants?

| Option | Description | Selected |
|--------|-------------|----------|
| Copy regen-constants.mjs into Phase 79 post-fix/ | Mirror Phase 73 self-contained pattern; copy verbatim. | ✓ |
| Use the archived script in-place | Run `.planning/milestones/v2.9-phases/73-...` directly. Couples to v2.9 archive. | |
| In-place manual edit of diff-playwright-reports.ts | Hand-edit 95 entries. Error-prone. | |

**User's choice:** Copy regen-constants.mjs into Phase 79 post-fix/.
**Notes:** Self-contained Phase 79 artifact; archive stays intact as v2.9 historical record.

### Q2: What's the gating condition for running the regen after the cascade fix lands?

| Option | Description | Selected |
|--------|-------------|----------|
| Strict SHA-256 identity across 3 cold-start runs | All 3 hashes must match. Phase 75 precedent. | ✓ |
| Pass-set identity (status-tier sorted; flake-tolerant) | DATA_RACE pool churn permitted. | |
| Majority-rules (2/3 runs must match) | Loosest gate; risks transient pass lock-in. | |

**User's choice:** Strict SHA-256 identity across 3 cold-start runs.
**Notes:** Strongest determinism guarantee; matches Phase 75 SC #4 (recorded hash `7084db872e3e...`).

### Q3: If the 3-run SHA-256 identity check FAILS, what's the protocol?

| Option | Description | Selected |
|--------|-------------|----------|
| Re-run + investigate the flake first | Pause regen. Add 3 more cold-start runs. If flake reproduces, escalate. | ✓ |
| Treat the flake as new DATA_RACE pool candidate | Violates Phase 73 D-09 "pool MUST NOT grow" contract. | |
| Accept the majority + file rationale | Loosens the determinism contract; faster. | |

**User's choice:** Re-run + investigate the flake first.
**Notes:** Cap at one re-run cycle (6 total runs); surfaces unknown races before they're baked into the anchor.

### Q4: How should the regen results be committed?

| Option | Description | Selected |
|--------|-------------|----------|
| One atomic commit per DETERM-05 plan | Single commit: run JSONs + sha256.txt + regen-output + constants + IMGPROXY audit. | ✓ |
| Split: capture commit + constants commit | Evidence vs action split. | |
| Three commits: per-run capture + constants | Maximally granular; commit noise. | |

**User's choice:** One atomic commit per DETERM-05 plan.
**Notes:** Reverting constants reverts everything; preserves Phase 73 self-contained pattern.

---

## 3-run cold-start gate execution

### Q1: Who runs the 3 cold-start full-suite captures, and when?

| Option | Description | Selected |
|--------|-------------|----------|
| Agent-inline via run_in_background | Agent runs ~162 min total + supervision. Autonomous. | ✓ |
| Operator checkpoint | Hand off; operator runs ~162 min on their own schedule. | |
| Hybrid (1 confirm + 2 operator) | Agent confirms; operator validates SHA-256 identity. | |

**User's choice:** Agent-inline (implicit from "the agent should run all tests inline but I'm gonna be away").
**Notes:** User confirmed they're going away during execution; agent runs autonomously. Operator pre-departure: kill the Vite dev server (port 5173); Supabase stays up; agent will `db:reset` between runs and only recycle Supabase on imgproxy 502.

### Q2: Should DETERM-04's fix plan end with a 1-run cold-start confirm BEFORE handing off to DETERM-05's 3-run gate?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — 1 confirm run, then 3-run gate | ~216 min worst-case; saves ~162 min on broken fix. | ✓ |
| No — trust per-plan smokes, go straight to 3-run gate | ~54 min savings if fix is correct; ~162 min cost if not. | |
| Confirm + first gate run combined | Treat gate run-1 as implicit confirm; abort after run-1 if cascade. | |

**User's choice:** Yes — 1 confirm run, then 3-run gate.
**Notes:** Aligns with time-boxed 1 RCA + 1 fix plan budget; avoids burning ~162 min on a broken fix.

### Q3: If imgproxy 502 hits mid-run (the documented intermittent infrastructure flake), how does the agent recover?

| Option | Description | Selected |
|--------|-------------|----------|
| Restart Supabase + re-run the same run-N | `supabase stop && supabase start && ...`; overwrite same run-N.json. Up to 2 retries. | ✓ |
| Accept imgproxy-cascaded tests — they go to DATA_RACE pool anyway | Risk: 502 may affect non-IMGPROXY tests. | |
| Abort and escalate to operator on any 502 | Conservative; risks stalled run. | |

**User's choice:** Restart Supabase + re-run the same run-N.
**Notes:** Cap at 2 retries per run; escalate via STATUS.md if a single run needs 3+ retries.

### Q4: When the agent finishes (or hits a hard stop) while you're away, what's the wake-up artifact?

| Option | Description | Selected |
|--------|-------------|----------|
| Single STATUS.md at phase root + commit log | Agent writes structured journal at every wake-up. One file to check. | ✓ |
| Per-plan summaries + final phase summary | Multiple files; no dashboard. | |
| Markdown checkpoint after each major milestone | Timestamped checkpoint files; verbose history. | |

**User's choice:** Single STATUS.md at phase root + commit log.
**Notes:** User wants a compact, structured return surface. STATUS.md gets updated at every agent wake-up with DETERM-04 progress, DETERM-05 progress, escalation flags, and "what to do on return."

---

## Claude's Discretion

- Exact instrumentation tooling for the RCA plan (Playwright tracing API, custom console hooks, Supabase admin API session inspection).
- Whether to retain the `loginIfRedirectedToLoginPage` helper under both fix paths.
- Whether to add a regression test for post-fix behavior (defer to planner).
- Final naming of the new setup project under the restructure path.

## Deferred Ideas

- Regression test for post-fix ToU hydration timing (future a11y/UX hardening pass).
- Generalization of `updateUser({password})` redirect race fix to other auth flows (e.g., candidate-password.spec.ts).
- Splitting `candidate-profile.spec.ts` into separate files (Phase 76 deferred-items §2 §Recommendation #3 alternative; NOT chosen for Phase 79).

---

*Discussion completed 2026-05-12. Decisions locked in 79-CONTEXT.md.*
