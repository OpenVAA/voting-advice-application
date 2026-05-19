# Phase 83: Test Reliability Follow-ups (Image-Upload Cascade + Voter-App Flakes) + v2.10 Milestone-Close Hygiene - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 83-test-reliability-follow-ups-image-upload-cascade-voter-app-flakes-v2.10-milestone-close-hygiene
**Areas discussed:** DETERM-06 mitigation choice, DETERM-07 strategy per flake (a + b), Phase 82 WR-01 approach
**Areas skipped (defaults applied):** Plan structure + verification gate

---

## Gray-Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| DETERM-06 mitigation choice | Pick (a) selector-drift fix only / (b) selector + 500ms pre-filechooser settle delay / (c) selector + imgproxy re-enable. ProfilePage.ts:34 targets a removed `<label tabindex="0">` — Input.svelte:532 is now a `<button>`. (a) recommended. | ✓ |
| DETERM-07 strategy per flake | voter-matching > 'worst match' is in PASS_LOCKED today (line 160); voter-detail > 'party detail drawer' is in FAILURE-CLASS. For each: fix race / test.skip() with rationale / move to (or keep in) FAILURE-CLASS. | ✓ |
| Plan structure + verification gate | Single plan covering all 7 SCs vs split (test-reliability / advisory hygiene). 3-run cold-start regen always vs only on PASS_LOCKED shift. May need agent-inline ~3h gate per Phase 79 D-11. | (defaults applied) |
| Phase 82 WR-01 approach | Roadmap locks the location (after variant-hidden-required.ts:156). Choose (a) inline hygiene comment only (reviewer + roadmap recommendation) vs (b) extend overlay to also delete required-empty-1 answer + assert count===2 in candidate-required-info.spec.ts. | ✓ |

**Notes:** User selected 3 of 4 areas. Plan structure was skipped — Claude applied defaults documented in CONTEXT.md D-08..D-11 (single PLAN.md, regen only on PASS_LOCKED shift, agent-inline gate per Phase 79 D-11).

---

## DETERM-06: image-upload cascade mitigation

| Option | Description | Selected |
|--------|-------------|----------|
| (a) Selector-drift fix only | Update ProfilePage.uploadImage to use imageArea.getByRole('button').first() + refresh the stale jsdoc comment. Phase 70 P03 already refactored the file-trigger from `<label tabindex="0">` to `<button type="button">` at Input.svelte:532. Cheapest, structural, matches Phase 76 deferred-items recommendation. | |
| (b) Selector fix + 500ms pre-filechooser settle delay | Adds the Phase 76 P01 mitigation pattern as belt-and-suspenders. Useful only if (a) alone proves flaky on macOS Chromium. Defer to (b) only after (a) fails its 1-run cold-start smoke. | |
| (c) Selector fix + imgproxy re-enable | Uncomment [storage.image_transformation] in apps/supabase/supabase/config.toml:130-131. Most invasive — affects cold-start parity, may shift other DATA_RACE-pool tests. Only if (a)+(b) both fail. | |
| Run (a) first, escalate if cascade reproduces | Plan a 2-step ladder: land (a) first, run 1-run cold-start smoke, escalate to (b) then (c) per Phase 76 deferred-items §1's cheapest-first ordering. Avoids over-investing if (a) is sufficient. | ✓ |

**User's choice:** Run (a) first, escalate if cascade reproduces.
**Notes:** Locks the cheapest-first ladder. CONTEXT.md D-01a..D-01e capture the ladder + the 1-run cold-start smoke as the per-step escalation gate (per Phase 79 D-12 precedent). D-01a includes the jsdoc refresh + `playwright/no-raw-locators` exemption drop as cleanup hygiene. D-01b and D-01c are authored as contingent tasks in PLAN.md but only executed on smoke failure.

---

## DETERM-07a: voter-matching 'worst match' flake

| Option | Description | Selected |
|--------|-------------|----------|
| Investigate + fix the race | Likely a results-page hydration / sort-order race — the test reads cards.last() before the matching algorithm's final ordering settles. Adds a settled-state poll. Keeps test in PASS_LOCKED — no anchor regen needed if fix holds across 3 runs. | ✓ |
| test.skip() with rationale until fixed | Mark with test.skip() + 'TODO Phase 84: flake under post-DETERM-04 timing' comment. Demotes from PASS_LOCKED. Surfaces the regression as visible tech-debt; loses test coverage. | |
| Move to FAILURE-CLASS pool | Add to the deterministic-failure rationale block. Per D-09 binding, the DATA_RACE pool MUST NOT grow (NOT IMGPROXY-tied). FAILURE-CLASS is the only legal non-fix demotion. Loses both the test AND the anchor it provided. | |

**User's choice:** Investigate + fix the race.
**Notes — operator's RCA hint (captured verbatim):** *"very unlikely that the order be indeterministic. Perhaps also make sure the number of results shown is complete."* This is a domain-expert root-cause hint: the `@openvaa/matching` algorithm is deterministic given fixed seeds; the flake is partial-hydration — `cards.last()` is asserted before the full result-list has finished hydrating. CONTEXT.md D-02 captures this as the shared hypothesis for both DETERM-07 surfaces; D-03a captures the fix shape (`expect(cards).toHaveCount(EXPECTED_CARD_COUNT)` BEFORE `.last()` indexing).

---

## DETERM-07b: voter-detail 'party detail drawer' flake

| Option | Description | Selected |
|--------|-------------|----------|
| Investigate + fix, then promote to PASS_LOCKED | Apply the same hydration-completeness lens as DETERM-07a: hypothesis is drawer-open races results-page hydration / entity-list reactivity. Fix → verify across 3 cold-start runs → promote to PASS_LOCKED. Requires constants regen (PASS_LOCKED +1, FAILURE-CLASS −1 narrative). Matches DETERM-07a approach symmetrically. | ✓ |
| Leave as FAILURE-CLASS, just update the rationale | Phase 83 only documents (does not investigate) the flake — narrows scope. Anchor preserved without regen. Risks the flake becoming permanent tech debt; visible in v2.11+. | |
| Investigate only if DETERM-07a fix surfaces the shared root cause | Try DETERM-07a fix first. If the hydration-completeness fix generalizes (same root cause class), apply to DETERM-07b and promote. If different root cause, leave DETERM-07b as FAILURE-CLASS and file a v2.11+ todo. Time-boxed investigation. | |

**User's choice:** Investigate + fix, then promote to PASS_LOCKED.
**Notes:** Symmetric treatment with DETERM-07a. Same hydration-completeness hypothesis (D-02). CONTEXT.md D-03b captures the fix shape (assert entity-list hydrated BEFORE the drawer-open click). D-04 captures the PASS_LOCKED promotion shape: strike from FAILURE-CLASS rationale block at `diff-playwright-reports.ts:80-90`, add to `PASS_LOCKED_TESTS` in alphabetical position.

---

## Phase 82 WR-01: variant-hidden-required cross-spec coupling

| Option | Description | Selected |
|--------|-------------|----------|
| (a) Inline hygiene comment only | Add maintainer-facing comment at variant-hidden-required.ts:156 noting that Phase 82 added test-question-required-empty-1 with custom_data.required:true, and that the overlay does NOT mutate/delete it (Alpha keeps the seeded sentinel answer; SETTINGS-03 count stays 1). DO-NOT-DELETE warning for future maintainers. Reviewer's recommended minimum-diff fix. | |
| (b) Extend overlay + update spec assertion | Modify the candidate-row mapper to also delete 'test-question-required-empty-1' from Alpha's answers, AND update candidate-required-info.spec.ts:114 (or wherever) to assert unansweredRequiredInfoQuestions.length === 2. More work, but eliminates the implicit additive coupling. Note: this surface is currently CASCADE-pooled — won't run in baseline today, only after DETERM-06 unblocks variant-hidden-required-candidate. | ✓ |

**User's choice:** (b) Extend overlay + update spec assertion.
**Notes:** User chose the structural elimination over the maintainer-facing-comment workaround. CONTEXT.md D-05 captures the fix shape (overlay deletion + spec assertion tighten to `=== 2`). Important downstream ordering constraint: WR-01 (b) MUST land before DETERM-06's selector-drift fix unblocks the variant-hidden-required-candidate CASCADE chain, or the spec assertion will fail in the post-fix cold-start gate. CONTEXT.md D-08 task ordering ensures WR-01 (b) lands FIRST in PLAN.md task sequence.

---

## Claude's Discretion

User explicitly skipped "Plan structure + verification gate" gray area. Claude applied defaults documented in CONTEXT.md:
- **D-08:** Single PLAN.md covering all 7 SCs with 9 tasks ordered to satisfy WR-01 (b)-before-DETERM-06 ordering constraint.
- **D-09:** Verification gate fires IF PASS_LOCKED shifts (almost certain — DETERM-07b promotion +1, IN-02 backfill +2, potential DETERM-06 cascade-unblock +5 — total ~83-86 PASS_LOCKED).
- **D-10:** Gate execution via agent-inline Bash run_in_background per Phase 79 D-11 (~162 min wall time, autonomous).
- **D-11:** Phase 79 anchor at SHA `ff0334f856…` is absorbed; Phase 83's regen produces the new v2.10-close anchor.

Additional Claude's-discretion items (captured in CONTEXT.md `<decisions>`):
- Alphabetical insertion positions for IN-02 backfill + DETERM-07b promotion entries.
- Helper-extraction question for hydration-completeness guard (inline vs. `expectResultsHydrated(page, expectedCount)` helper).
- Exact verbatim test titles for IN-02 backfill (planner reads live `test(...)` declarations at PLAN.md time).
- Derivation of `EXPECTED_CARD_COUNT` / `expectedPartyCount` (module-scope constant vs. function vs. existing fixture export).
- Commit-shape for WR-01 (b) (1 commit covering overlay + spec, or 2 commits).
- WR-01 spec-assertion shape (`expect(unansweredRequiredInfoQuestions.length).toBe(2)` vs. `expect(infoBadge).toHaveText('2')` — planner reads the existing spec body to decide).

## Deferred Ideas

- **Project-wide hydration-completeness assertion sweep** — Phase 83 fixes 2 surfaces; v2.11+ could sweep the rest.
- **Phase 70 P03 Input.svelte refactor — broader page-object audit** — search the page-object tree for similar drifted selectors.
- **DATA_RACE pool growth re-examination** — Phase 73 D-09 binding semantics may need v2.11+ re-evaluation if D-01c imgproxy re-enable lands.
- **FAILURE-CLASS rationale-block audit** — verify the remaining "~11 tests deterministically FAIL × 3" narrative entries are still accurate at v2.11 baseline.
