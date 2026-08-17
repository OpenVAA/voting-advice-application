---
phase: 85
plan: 04
slug: trace-visibility-cleanup
status: complete
verdict: PASSED
completed: 2026-05-15
duration_min: ~5 (mechanical edits + full-suite verification run captured post-cleanup)
reopens: 85
---

# Phase 85 Plan 04 — Trace visibility cleanup (SUMMARY)

## Outcome

PASSED. 11 active `test.use({ trace: 'off' })` overrides removed; the only
remaining `trace:.*off` matches in the tree are two **historical commentary
lines** inside `multi-election.spec.ts` (frozen by 85-03's own per-test page
fixture refactor — they describe the workaround that no longer exists).

The trace cleanup was originally classified as v2.11+ deferral work in
85-03 SUMMARY §"Out of scope". Operator pulled it forward at the start of
the Phase 87 pre-gate so that diagnosis of any v2.10 close-out failures has
full trace artifacts.

## Files modified (11 spec files)

```
tests/tests/specs/variants/1e-Nc.spec.ts
tests/tests/specs/variants/Ne-Nc.spec.ts
tests/tests/specs/variants/constituency.spec.ts
tests/tests/specs/variants/results-sections.spec.ts
tests/tests/specs/variants/startfromcg.spec.ts
tests/tests/specs/voter/voter-journey.spec.ts
tests/tests/specs/voter/voter-navigation.spec.ts
tests/tests/specs/voter/voter-not-located-redirect.spec.ts
tests/tests/specs/voter/voter-popup-hydration.spec.ts
tests/tests/specs/voter/voter-popups.spec.ts
tests/tests/specs/voter/voter-settings.spec.ts
```

Each edit deleted the leading rationale-comment block + the
`test.use({ trace: 'off' })` line; `storageState`/other co-located options on
the same `test.use(...)` call were preserved.

## Verification

### Grep gate

```
$ grep -rn "test.use.*trace.*off" tests/ --include='*.ts'
(no matches)

$ grep -rn "trace.*off\|trace:.*off" tests/ --include='*.ts'
tests/tests/specs/variants/multi-election.spec.ts:29:// (trace: 'on'); the prior `test.use({ trace: 'off' })` workaround was a side
tests/tests/specs/variants/multi-election.spec.ts:178:// `trace: 'off'` to work around Playwright 1.58.2's trace-writer ENOENT under
```

Both remaining hits are historical commentary lines explaining what 85-03
removed; neither is an active override.

### Full-suite e2e run (post-cleanup)

Ran `yarn test:e2e --reporter=json,line` against the running dev server (DB
reset via `yarn supabase:reset`):

```
duration:  524.8 s  (8.7 min)
expected:  110
unexpected: 13
skipped:    42   (6 source-skip + 36 cascade)
flaky:       0
```

JSON archived at `post-fix/run-with-traces-restored.json`. No ENOENT
regressions observed — the 13 failures are real test timeouts / locator
miss / behaviour gaps surfaced by removing the visibility blocker, not
trace-writer artifacts.

## Findings handed off to Phase 88

The post-cleanup run surfaced 13 failures + 36 cascades that the v2.10 close-out
must resolve before Phase 87 fires. Classified into 6 clusters in the operator
report, summarised here for Phase 88 scoping:

| Cluster | Fail count | Cascade count | Root cause hypothesis |
|---|---:|---:|---|
| variant-constituency chain blocker | 1 | 22 | `constituency.spec.ts:226` answer-loop hits non-Likert opinion question — same class as the variant-multi-election fix in 85-03 commit `26c187d93`, applied to a different setup |
| `answeredVoterPage` fixture regression | 8 | 5 | Default `data.setup.ts` still seeds mixed-type opinion questions; only `variant-multi-election.setup.ts` got `applyLikertOnlyFilter` in 85-03 |
| voter-feedback-persistence | 1 | 0 | Phase 86-02 fix didn't hold; possible new dialog-locator collision |
| voter-popup-hydration LAYOUT-03 | 1 | 0 | Phase 86 explicit DEFERRAL (PASS-WITH-DEFERRAL verdict) |
| voter-not-located-redirect CLEAN-02 | 1 | 4 | Phase 86 anchor classifies downstream cells as CASCADE_TESTS |
| candidate A11Y-01 image-type | 1 | 5 | Locator on profile heading times out — likely auth/page-load tail |

Routing: cluster #1 + #2 → Phase 88-01 (single `applyLikertOnlyFilter` extension
fixes both). Clusters #3, #4, #5, #6 → 88-02 / 88-03 (per-cell investigation + fix
or `test.skip()` + todo per Phase 86 D-03 1-hour-budget precedent).

## Out of scope (deferred)

- sharedPage → per-test page fixture refactor for Group A specs (5 variant
  specs). The 85-03 maneuver applied to multi-election.spec.ts could be
  replicated, but is only required if the post-cleanup run shows ENOENT
  noise — which it did NOT in this verification. Hold for v2.11+.
- Playwright 1.58.2 → 1.59+ upgrade. Mid-term; would moot the entire trace
  workaround lineage upstream.

## Threat flags

None. Test-only file edits. No production code touched. No new dependencies.
