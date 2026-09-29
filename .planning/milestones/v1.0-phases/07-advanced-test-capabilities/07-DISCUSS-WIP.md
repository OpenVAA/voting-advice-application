# Phase 7: Advanced Test Capabilities - Discussion WIP

**Status:** Paused mid-discussion (screenshot comparison tuning)
**Paused:** 2026-03-11

## Completed Areas

### Visual Regression Scope (DONE)
- **Pages:** Minimal — voter results page + candidate preview page only
- **Capture:** Full-page screenshots (entire scrollable page)
- **Data:** Reuse existing datasets (default-dataset.json + voter-dataset.json), no dedicated visual dataset
- **Masking:** Mask dynamic areas (timestamps, avatars, non-deterministic content) using Playwright's mask option

## In Progress

### Screenshot Comparison Tuning (IN PROGRESS — 1 of 4 questions asked)
- Pixel diff threshold: NOT YET DECIDED (user paused before answering)
- Remaining questions: animation/timing handling, viewport/font consistency, baseline storage

## Not Started

### Performance Metrics & Budgets
- Which metrics (TTI, LCP, FCP, custom), time budgets, variance handling

### Gating Strategy
- Exclusion from default runs, CI integration, baseline update workflow

## Prior Decisions Applied
- Tags on test.describe() blocks (Phase 6)
- testIgnore for excluding files from default runs (Phase 1)
- answeredVoterPage fixture for voter results access (Phase 3)
- Desktop Chrome device for all projects (all phases)

## Codebase Context
- Playwright 1.58.2 with built-in toHaveScreenshot()
- No existing visual/performance tests
- 16 spec files across candidate/voter/variants directories
- Project dependency pattern well-established
- @smoke, @voter, @candidate, @variant tags exist (Phase 6)
