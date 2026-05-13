# Phase 87: v2.10 All-Green Milestone-Close Anchor - Context

**Gathered:** 2026-05-13 (batched with Phase 84, 85, 86 per `feedback_batch_discussions.md` operator preference)
**Status:** Ready for planning (sequential after Phase 85 + Phase 86 both COMPLETE)

<domain>
## Phase Boundary

Capture the final v2.10-ship anchor after Phases 84-86 land. Run a fresh 3-run cold-start gate; confirm all-green deterministic state (target: ~150-160 PASS_LOCKED + ≤3 DATA_RACE + 0 CASCADE + ≤2 FAILURE-CLASS); produce the binding v2.10-ship anchor via the (Phase-84-renegotiated) archived `regen-constants.mjs`; run `/gsd-audit-milestone v2.10` for shippability sign-off. v2.10 milestone is shippable post-Phase-87.

4 success criteria across a SINGLE plan (planner refines tasks):

1. **DETERM-15 — Fresh 3-run cold-start gate SHA-identical on FIRST attempt.** Against the post-84+85+86 codebase. No Phase 79 D-09 instability protocol fallback — strict SHA-identity gate.

2. **Final v2.10-ship anchor committed.** Target: ~150-160 PASS_LOCKED + ≤3 DATA_RACE (Phase 84 binding renegotiation: 3 image-intrinsic tests) + 0 CASCADE (Phase 85 closure) + ≤2 FAILURE-CLASS (Phase 86 explicit v2.11+ deferrals). Anchor SHA committed to `tests/scripts/diff-playwright-reports.ts` jsdoc + the regen script's IMGPROXY_TIED_TITLES (3-title list) + DATA_RACE_TESTS (3 IDs) + CASCADE_BASELINE_TESTS (0 or ≤5) + jsdoc.

3. **Phase 87 SUMMARY documents the all-green achievement.** Lists explicit v2.11+ deferrals if any (FAILURE-CLASS residuals from Phase 86, CASCADE residuals from Phase 85). Cross-references the 4-phase milestone-extension lineage (Phase 79 → 80/81/82/83 → 84/85/86/87).

4. **`/gsd-audit-milestone v2.10` runs cleanly; status = shippable.** Per `feedback_e2e_did_not_run.md` memory + operator's All-Green Suite directive: NO "did not run" tests in the cold-start baseline; all in-scope tests have deterministic verdicts.

**Out of scope (deferred to v2.11+):**
- Any new variant / new feature / new architectural work — Phase 87 is pure milestone-close.
- v2.11 milestone planning — runs after `/gsd-audit-milestone v2.10` sign-off.
- New parity-script architecture (the regen-constants.mjs stays canonical; v2.11+ may revisit).

Phase 87 is the v2.10 milestone-close phase. After Phase 87, run `/gsd-complete-milestone v2.10` to archive.

</domain>

<decisions>
## Implementation Decisions

### Plan structure: single plan covering all 4 SCs

- **D-01 — Single PLAN.md.** Phase 87 is pure infrastructure execution (3-run gate + regen + audit-milestone). Mirrors Phase 79 P03 long-running unattended-execution structure. Plan tasks (planner refines):
  1. Fresh 3-run cold-start gate via archived `regen-constants.mjs` (1-run prep capture + 3-run identity gate). ~216 min wall time.
  2. Atomic constants regen commit (jsdoc + arrays + anchor SHA + IMGPROXY_TIED_TITLES + DATA_RACE_TESTS + CASCADE_BASELINE_TESTS).
  3. Phase 87 SUMMARY documenting all-green achievement + v2.11+ deferrals.
  4. `/gsd-audit-milestone v2.10` invocation + close on shippable status.

- **D-02 — Strict SHA-identity gate, no D-09 fallback.** Per roadmap SC #1: "Fresh 3-run cold-start gate SHA-identical FIRST attempt against the post-84+85+86 codebase." If the first attempt fails SHA-identity, the gate is RE-RUN (per Phase 79 D-09 instability protocol) and the failing run is investigated. If repeated failure: ESCALATE — Phase 87 is the ship-blocker. A non-SHA-identical first-try indicates a residual non-determinism that Phases 84-86 should have fixed; treat as Phase-84/85/86 reopen, not Phase-87 carry-forward.

- **D-03 — Gate execution: agent-inline via Bash run_in_background.** Per Phase 79 D-11 + Phase 83/84/85/86 precedent. ~216 min unattended (1 prep run + 3 identity runs).

### Anchor commit shape

- **D-04 — Atomic regen commit covers ALL classification arrays + jsdoc + anchor SHA.** Single commit per Phase 79 D-10 precedent. Files touched (planner verifies):
  - `tests/scripts/diff-playwright-reports.ts` — jsdoc count update (`94` → `~155-160`), PASS_LOCKED_TESTS (in alphabetical order), DATA_RACE_TESTS (3 IDs), CASCADE_TESTS (0 or ≤5), FAILURE-CLASS narrative block (removed or ≤2 residual entries), SKIPPED_TESTS if Phase 86 introduced this const.
  - `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` — IMGPROXY_TIED_TITLES (3 titles, Phase 84-renegotiated), CASCADE_BASELINE_TESTS (Phase 85-shrunken), any SKIPPED constants. Match-count assertion gates verified post-edit.
  - `.planning/phases/87-…/post-fix/run-{1,2,3}.json` — 3-run captures archived.
  - `.planning/phases/87-…/post-fix/sha256.txt` — SHA-identity record (per Phase 79 D-12 precedent).

- **D-05 — Anchor target verification.** Planner verifies post-gate that the actual anchor matches target:
  - PASS_LOCKED: ~150-160 (range, planner accepts within).
  - DATA_RACE: exactly 3 (Phase 84 binding contract).
  - CASCADE: 0 (or ≤5 if Phase 85 left explicit deferrals).
  - FAILURE-CLASS: 0 (or ≤2 if Phase 86 left explicit skips).
  Any deviation (e.g., DATA_RACE = 4 = new imgproxy-tie surfaced) triggers Phase-84-reopen, not Phase-87 carry-forward.

### Milestone close handshake

- **D-06 — `/gsd-audit-milestone v2.10` invocation.** Runs after the regen commit lands. Per memory `feedback_e2e_did_not_run.md`: "did not run" tests count as failures. Phase 87 SC #4 audit MUST pass — if it surfaces residual "did not run" cells from Phases 84-86, those phases reopen, not Phase 87 carry-forward.

- **D-07 — v2.10 milestone shippable status criteria.** Phase 87 closes with `shippable` verdict iff:
  - 3-run gate SHA-identical (D-02).
  - Anchor target met within tolerance (D-05).
  - `/gsd-audit-milestone v2.10` clean (D-06).
  - No new v2.10 requirements surfaced during Phase 87 execution.
  Any deviation → ship-blocker, escalate to operator.

### Anti-pattern guards

- **D-08 — No new feature work in Phase 87.** Pure milestone-close phase. If during 3-run gate a NEW bug surfaces (not in Phase 84/85/86 scope), file as v2.11+ todo, do NOT pre-fix in Phase 87.

- **D-09 — No DATA_RACE pool growth.** Per Phase 73 D-09 binding (Phase 84-renegotiated to 3 titles). Phase 87's gate validates that the 3-test list is the binding contract for v2.10 ship.

### Claude's Discretion

- Planner picks the precise 3-run gate invocation (full-suite vs scoped to affected projects). RECOMMENDATION: full-suite, since the all-green claim requires whole-suite verification.
- Planner picks whether `regen-constants.mjs` warrants a Phase-87 fork (vs in-place edit). RECOMMENDATION: in-place edit per Phase 84 D-05 precedent.
- Planner picks the `/gsd-audit-milestone v2.10` invocation timing (before vs after regen commit). RECOMMENDATION: after regen commit, since the audit reads the post-Phase-87 anchor.
- Phase 87 SUMMARY writing style (terse vs comprehensive). RECOMMENDATION: comprehensive — this is the v2.10 milestone-close artifact that v2.11 planning will reference.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap + REQUIREMENTS

- `.planning/ROADMAP.md` §"Phase 87: v2.10 All-Green Milestone-Close Anchor" — 4 success criteria, Phase 85 + 86 prerequisites.
- `.planning/REQUIREMENTS.md` — DETERM-15 (Phase 87 REQ).

### Phase 84 + 85 + 86 (predecessors)

- `.planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/84-VERIFICATION.md` (when written) — Phase 84 close anchor (3 DATA_RACE post-renegotiation).
- `.planning/phases/85-variant-project-cascade-rca-fix-investigate-and-close-the-47/85-VERIFICATION.md` (when written) — Phase 85 close anchor (0 or ≤5 CASCADE).
- `.planning/phases/86-voter-app-failure-class-cleanup-investigate-and-resolve-the-/86-VERIFICATION.md` (when written) — Phase 86 close anchor (0 or ≤2 FAILURE-CLASS).

### Verification mechanism + protocol

- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` — verification gate mechanism, in-place edited for Phase 87 final anchor.
- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-CONTEXT.md` §"3-Run Cold-Start Gate Execution" (D-11, D-12, D-13) — gate execution protocol.
- `tests/scripts/diff-playwright-reports.ts` — final anchor commit target (jsdoc + all classification arrays).

### Milestone close

- `.planning/MILESTONES.md` — v2.10 milestone definition + ship criteria.
- `/gsd-audit-milestone` skill — shippability sign-off mechanism.
- STATE.md "Deferred Items" — v2.11+ deferrals that survive Phase 87.

### Project conventions

- `CLAUDE.md` §"Common Workflows" — canonical Likert-only-reset chain.
- `.agents/code-review-checklist.md` — code review checklist.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **Phase 79 P03 long-running 3-run cold-start gate pattern** — Phase 87 mirrors directly.
- **Phase 79 archived `regen-constants.mjs`** (Phase-84-renegotiated) — Phase 87's verification gate mechanism.
- **Phase 79 D-12 1-run prep + 3-run identity gate cadence** — Phase 87 inherits.
- **Phase 83 atomic constants regen commit precedent** — Phase 87 follows.
- **Phase 79 D-09 instability protocol** — Phase 87 D-02 escalates rather than absorbs (Phase 87 is the ship-blocker, not a carry-forward home).

### Established Patterns

- **`feedback_batch_discussions.md` memory** — batched discussion with Phase 84/85/86.
- **`feedback_e2e_did_not_run.md` memory** — "did not run" tests count as failures; Phase 87 D-06 audit enforces this.
- **Phase 73 D-09 IMGPROXY_TIED_TITLES structural binding** (Phase 84-renegotiated to 3 titles) — DATA_RACE pool contract for v2.10 ship.
- **Atomic-commit-per-task pattern** (Phase 79 D-10 + Phase 83/84/85/86 precedent).

### Integration Points

- **Phase 85 + 86 anchor consumption:** Phase 87 measures against the later of Phase 85 / Phase 86 anchors. Sequential phase per ROADMAP — both 85 AND 86 must COMPLETE before Phase 87 starts.
- **`/gsd-complete-milestone v2.10` follow-up:** Phase 87 closes with shippable verdict → operator runs `/gsd-complete-milestone v2.10` to archive the milestone artifacts + prepare for v2.11.

</code_context>

<specifics>
## Specific Ideas

- **Operator's All-Green Suite directive** (per `project_all_green_suite_priority.md` memory): Phase 87 IS the directive's terminal artifact — the v2.10-ship anchor with all 3 non-green pools closed (DATA_RACE 15 → 3 / CASCADE 47 → 0 / FAILURE-CLASS ~10 → 0 or ≤2).

- **Operator's "ALL e2e tests passing" success criterion** — Phase 87 D-06 + D-07 enforce: shippable iff `/gsd-audit-milestone` clean (no "did not run", no flake, no deterministic-fail outside explicit v2.11+ deferrals).

- **Operator's batched-discussion + auto-chain directive** (2026-05-13): all 4 Phases (84-87) were discussed in one session; Phases 84-87 then auto-chain plan+execute. Phase 87 is the chain terminus before milestone close.

</specifics>

<deferred>
## Deferred Ideas

- **v2.11 milestone planning** — runs after Phase 87 close + `/gsd-complete-milestone v2.10`. Out of v2.10 scope.

- **Parity-script architectural refactor** — if Phase 87 surfaces that the regen-constants.mjs pattern is hard to maintain (e.g., 5+ classification arrays + match-count assertions), a v2.11+ project could refactor into a cleaner classification engine. Out of v2.10 scope.

- **Cold-start determinism tooling improvements** — if Phase 87's 3-run gate surfaces irreducible timing flake, a v2.11+ project could investigate Playwright's `expect.toPass` polling or similar. Out of v2.10 scope.

- **`SKIPPED_TESTS` const promotion** — if Phase 86 introduced this const (per Phase 86 D-05), Phase 87 standardizes it as a permanent classification axis. v2.11+ may rename / restructure.

### Reviewed Todos (not folded)

None — no open todos in `.planning/todos/pending/` are scoped-to-Phase-87 work. Phase 87 inputs come from ROADMAP.md + REQUIREMENTS.md + the predecessor phase anchors.

</deferred>

---

*Phase: 87-v2.10-All-Green-Milestone-Close-Anchor*
*Context gathered: 2026-05-13 (batched)*
