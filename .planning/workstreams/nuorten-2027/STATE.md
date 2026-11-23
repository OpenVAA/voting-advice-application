---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 191
current_plan: 6
status: complete
stopped_at: Phase 191 verified (passed)
last_updated: "2026-11-23T18:42:05.372Z"
last_activity: 2026-11-23
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 6
  completed_plans: 6
  percent: 20
---

# Project State

## Current Position

Phase: 191 (Instance overlay (upstream)) — COMPLETE (verified 2026-11-23)
Plan: 6 of 6
**Status:** Phase 191 complete and verified; next is Phase 192 in OpenVAA/deploy-nuortenvaalikone
**Current Phase:** 191
**Last Activity:** 2026-11-23
**Last Activity Description:** Phase 191 verification passed (3/3 success criteria)

## Progress

**Phases Complete:** 1
**Current Plan:** 6 of 6

## Session Continuity

**Stopped At:** Phase 191 verified (passed)
**Resume File:** None

## Accumulated Context

### Roadmap Evolution

- Roadmap drafted: Phases 191–195. Upstream prerequisite: deployment Phase 190 (multi-deployment bootstrap and parameterised workflows).

### Decisions

- 191-01: StaticSettingsSchema parity compares both the plain and the DeepRequired forms of the schema type and StaticSettings, because plain mutual assignability misses a dropped optional key.
- 191-01: StaticSettingsSchema and resolveStaticSettings stay out of the app-shared barrel, so the dist is byte-identical without an overlay.
- 191-01: an overlay that sets dataAdapter is rejected before the merge, because the hosted-settings guards read it from staticSettings.ts.
- 191-02: the app.css theme transform checks every mapped declaration for exactly-one occurrence, set or not, so app.css drift fails the build even without an overlay.
- 191-02: AppLogo's static tier (no publisherLogo url, a staticSettings.logo url) alone falls back to t('dynamic.appName') for alt; the publisher tier keeps its empty alt.
- 191-02: visual-regression is judged by its CI-literal run in the pinned Playwright container; host runs cannot reproduce its baselines, with or without the plan.
- 191-03: instance/static is laid over apps/frontend/static through a fingerprinted merged copy at apps/frontend/.instance/static, selected as kit.files.assets only when instance/static holds a regular file; symlinks refused before any write.
- 191-04: instance/messages/<locale>.json files are validated against the base en catalogue (key exists, placeholder set, HTML tag set, compiled-locale file name, no symlinks) and laid over it through a generated apps/frontend/.instance/project.inlang that lists them last; paraglide.options.ts also fails when staticSettings.supportedLocales offers a locale with no compiled catalogue.
- [Phase 191]: 191-05: a turbo cache hit leaves stale files in apps/frontend/build; remove build/ after deleting an overlay file (documented in instance/README.md)
- [Phase 191]: 191-05: the frontend build hashes instance/static/** and instance/messages/**; the image copies instance/ in the base stage
- [Phase 191]: Phase 191 gate: full-run reference is the 8f2bb68a7 --list (744 listed, 742 gated); the d5216b03 record is on a diverged history
- [Phase 191]: Phase 191 gate: three host-only unit/lint failures (tcpForward blackhole, Deno CA vars stripped by turbo strict env, workflow-errexit x6) predate the phase and are deferred

### Performance Metrics

| Plan | Duration | Tasks | Files |
| ---- | -------- | ----- | ----- |
| 191-01 | ~15 min | 2 | 10 |
| 191-02 | ~38 min | 2 | 6 |
| 191-03 | ~31 min | 2 | 7 |
| 191-04 | ~35 min | 2 | 7 |
| Phase 191 P05 | 95min | 3 tasks | 13 files |
| Phase 191 P06 | ~100min | 2 tasks | 3 files |
