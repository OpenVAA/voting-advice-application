---
title: "Playwright 1.63 trace recording costs ~350 ms per results render, and the CI performance spec has only ~400 ms of margin left"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: medium
suggested_phase: next E2E/CI-hardening phase, or earlier if `performance` goes red in CI
keywords: [playwright-1.63, trace, retain-on-failure, on-first-retry, performance-budget, ci, flake, timeToMatches]
re_check_trigger: "the next CI run whose `performance` timeToMatches exceeds ~4000 ms, or any CI e2e red in a fixed-window step"
---

# Trace cost and the thin CI performance margin (169-11)

## Measured

- Results reload (`performance` spec), idle dev server, 3 runs each, 2026-10-03: Playwright 1.58 traced 213–243 ms;
  Playwright 1.63 traced 584–611 ms, untraced 241–244 ms. The app did not get slower; the trace recorder did.
- `tests/playwright.config.ts` uses `trace: 'retain-on-failure'` globally, which records like `'on'` for every test, so
  every spec now runs under that browser-side cost — and on the ~4.3× slower CI runner it widens every fixed-window
  race. 169-11 turned tracing off for the `performance` project only (`f6bbc68ab`).
- CI `performance` (untraced): run 37142651706 measured `timeToMatches` 3045 ms (ttfb 290 ms); run 37144076939
  measured **4603 ms (ttfb 707 ms)** against the 5000 ms budget. The last pre-group-2 run (37115289953, traced, PW 1.58,
  Vite 7) measured 1329 ms (ttfb 51 ms). Where the CI gap comes from (Vite 8 dev server under parallel load is one
  candidate) was not isolated: UNCONFIRMED. Which part of the trace recorder costs the time (DOM snapshots or the
  screencast) is also UNCONFIRMED.

## Decisions for the operator

1. Trace mode: keep global `retain-on-failure`, or use `on-first-retry` in CI (CI has retries) so green first attempts
   run untraced; or report the overhead upstream with the measurement above.
2. Performance budget: do NOT raise the 5000 ms budget to make a red green (the spec forbids it). If `timeToMatches`
   keeps climbing, measure it per stage (SSR, hydration, the client fetches, matching) first.
