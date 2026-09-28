# Phase 138 — Discussion Log

**Date:** 2026-08-13
**Phase:** 138 — DEF-135-04 — `EPERM-07` Root Cause + Cardinal-Rule Waiver Discharge
**Mode:** default (interactive), two batched question rounds

> Human reference only. Downstream agents (researcher, planner, executor) consume
> `138-CONTEXT.md`, not this file.

## Scout findings presented before questions

- The failure is a **latency signal, not an absence signal** — the failure's own page snapshot showed
  the heading rendered at the moment `expect(termTrigger.first()).toBeVisible()` timed out at 2 s.
- The preceding heading assertion is `expect.soft`, so a mis-timed Base-3 arrival surfaces at the
  term check rather than where it is explainable.
- The cold-start-Vite hypothesis was already tested and **disproved** (4 first-after-restart runs
  passed, 3 of them on a cold Vite cache). Tally: 1 failure in 8 full-suite runs.
- `tests/playwright.config.ts:133` already sets `trace: 'on'`; there is no `video` setting.
- Suspect surface: `apps/frontend/src/lib/components/term/Term.svelte` (line 127 emits the testid)
  and `apps/frontend/src/lib/api/utils/translateQuestionTerms.ts`.

## Round 1

### Area: Forcing mechanism (criterion 1 — reproduce on demand)

Options presented:
- **Throttle + shrink budget** (recommended) — CDP CPU/network throttling on the Base-2 → Base-3
  transition plus a temporarily shrunken `TIMEOUTS.element`; no app code touched; the amplified
  budget doubles as the negative-control knob.
- Inject delay in app path — test-only artificial delay in the term-parsing/mount path.
- Defer to research-phase — lock only the requirement, let the researcher choose after reading traces.

**Selected:** Throttle + shrink budget → D-01, D-02.

### Area: Repro scope — what counts as a valid reproduction

Options presented:
- **Isolated minimal spec** (recommended) — drives only Base-1 → Base-2 → Base-3; seconds per
  iteration instead of ~10.5 min.
- Full voter-journey spec only — highest fidelity, minutes per iteration.
- Both — hunt in isolation, confirm in the full run.

**Selected:** Isolated minimal spec → D-03. Its known risk (may not carry the full suite's contention
conditions) was recorded as D-04 rather than dropped.

### Area: Fix shape (criterion 2 — pre-fix FAILS, post-fix PASSES) — multi-select

Options presented:
- **Fix the app race** (recommended) — fix `Term.svelte` / `translateQuestionTerms.ts` if the
  mechanism is a real mount/parse race.
- Harden the test's wait — explicit readiness condition instead of a bare visibility race.
- Make the upstream heading assertion hard — diagnostic improvement.
- Raising the timeout alone — included only if the operator wanted it permitted.

**Selected:** Fix the app race only. The other three were left unselected, which drove the two
follow-up questions in Round 2.

### Area: 16-run determinism gate (criterion 3)

Options presented:
- **Serial local, one unattended batch** (recommended) — ~3 h wall clock, matches the environment
  where the 1-in-8 was observed.
- Containerized runs — cleaner isolation, different environment.
- Interleave across Phases 139–150 — near-zero added cost, delays discharge.

**Selected:** Serial local unattended batch → D-13, D-14, D-15.

## Round 2 — follow-ups arising from the Round-1 fix-shape selection

### Q: If the mechanism proves genuinely test-side?

Options presented:
- **Stop and escalate to the operator** (recommended) — record the diagnosis, do not apply a
  test-side fix unilaterally.
- Allow explicit readiness wait — conditionally restore the declined option.
- Treat as app defect regardless — hardest line.

**Selected:** Stop and escalate → D-06.

### Q: Promote the upstream `expect.soft` heading assertion to hard?

Options presented:
- **Yes — diagnostic improvement** (recommended) — as `deferred-items.md` already suggests.
- No — leave it soft, keep blast radius minimal.
- Only if the diagnosis needs it.

**Selected:** Yes, unconditionally → D-08. (This restores, on its own merits, one of the fix-shape
options that Round 1 left unselected.)

### Q: Forensic capture landing before the hunt (Plan 01) — multi-select

Options presented:
- **Video on the term-trigger path** (recommended) — trace exists, video does not.
- Dev-server log retention.
- Browser console + network capture.
- Durable per-run result log — a cross-phase accumulating ledger.

**Selected:** Video + dev-server logs + console/network → D-09, D-10, D-11. The durable cross-phase
ledger was **not** selected; recorded as D-12 (the 16-run gate still needs a phase-local run log for
criterion-3 evidence) and as a deferred idea.

## Claude's discretion (operator did not constrain)

- Exact throttle factors and shrunk-timeout value for the forcing harness.
- Shape of the isolated minimal spec (fixture and seed-template reuse).
- Whether video retention is scoped narrowly or enabled more broadly.
- Plan count and split, subject to forensic capture landing before the hunt.

## Deferred ideas raised

- Durable cross-phase run-results ledger (declined here; own phase if wanted).
- DEF-135-05 — concurrent turbo build graphs racing on `packages/*/dist`; unrelated, stays deferred.
- Suite-wide video retention, if artifact size proves acceptable during this phase.

## Scope creep

None — the discussion stayed inside the diagnosis boundary.
