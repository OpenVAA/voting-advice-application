# Phase 59: E2E Fixture Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 59-e2e-fixture-migration
**Areas discussed:** Baseline & parity methodology, seed-test-data.ts rewrite shape, Fixture deletion + adminClient finalization, Rollback / failure handling

---

## Baseline & parity methodology

### Q1: How do we capture the pre-swap baseline?
| Option | Description | Selected |
|--------|-------------|----------|
| Checkout main, run full suite, save JSON report | Mechanical baseline capture | ✓ |
| Use the CI baseline from the last main build | Artifact-based | |
| Generate baseline on a fresh branch before swap commit | Multi-commit proof trail | |

**User's choice:** Checkout main, run `yarn dev:reset && yarn dev && yarn test:e2e`, save the Playwright JSON report

### Q2: Where does the baseline artifact live?
| Option | Description | Selected |
|--------|-------------|----------|
| Committed under `.planning/phases/59-.../baseline/` | Permanent reference | ✓ |
| CI-only artifact, referenced by URL | Avoids committing JSON | |
| Both — committed summary + CI artifact | Best of both | |

**User's choice:** Committed under `.planning/phases/59-e2e-fixture-migration/baseline/`

### Q3: Exact pass/fail delta rule for 'zero regression'?
| Option | Description | Selected |
|--------|-------------|----------|
| Pass set locked; fail set may shift within data-race pool only | Matches E2E-03 literal | ✓ |
| Identical pass/fail set — no shifts allowed | Stricter | |
| Pass count ≥ baseline; fail count ≤ baseline (aggregate) | Count-based | |

**User's choice:** All currently-passing tests MUST still pass; fail set may shift within the 19 data-race pool

### Q4: Exact Playwright invocation + env for both runs?
| Option | Description | Selected |
|--------|-------------|----------|
| `yarn dev:reset && yarn dev & wait-for-healthy && yarn test:e2e --reporter=json,list` | Controlled run, serialize workers | ✓ |
| Use existing `yarn test:e2e` without modification | Minimize drift | |
| Parallel runs (--workers=4) | Realistic; race variance | |

**User's choice:** Controlled run with --reporter=json,list (--workers=1 implied)

---

## seed-test-data.ts rewrite shape

### Q1: Shape of the rewritten `tests/seed-test-data.ts`?
| Option | Description | Selected |
|--------|-------------|----------|
| Thin wrapper: `await seedDatabase({ template: 'e2e' })` | ~20 lines; all logic in package | ✓ |
| Thin wrapper with explicit per-test overrides | Adds API surface | |
| Inline pipeline construction | Violates package-API-is-contract | |

**User's choice:** Thin wrapper

### Q2: How does Playwright teardown integrate?
| Option | Description | Selected |
|--------|-------------|----------|
| Replace existing `clearTestData()` with package teardown API | Consistent with package contract | ✓ |
| Keep existing + add seed:teardown afterward | Belt-and-suspenders | |
| No teardown between tests; reset between Playwright setups | Slowest; most isolated | |

**User's choice:** Replace existing `clearTestData()` with a call to `seed:teardown` equivalent

### Q3: How to catch drift if `e2e` template diverges from spec expectations?
| Option | Description | Selected |
|--------|-------------|----------|
| Fail fast inside spec — testId assertions throw natural errors | No pre-flight checker | ✓ |
| Pre-flight sanity check in seed-test-data.ts | Assert known testIds exist post-seed | |
| Snapshot golden file; assert template matches | Maintenance-heavy | |

**User's choice:** Fail fast inside the spec

---

## Fixture deletion + adminClient finalization

### Q1: When exactly do legacy JSON fixtures get deleted?
| Option | Description | Selected |
|--------|-------------|----------|
| Same PR, final commit, only after CI green on swap | Atomic, revertable | ✓ |
| Separate PR after the swap PR merges | Safer; risk of forgotten cleanup | |
| Same commit as the swap | Smallest history; harder to revert | |

**User's choice:** Same PR as the swap, final commit: only after parity check passes locally AND in CI

### Q2: How do we verify zero remaining references to deleted fixture files?
| Option | Description | Selected |
|--------|-------------|----------|
| Grep + TypeScript/tsc compile errors | Use existing tools | ✓ |
| Automated check script in phase dir | Overkill for one-shot | |
| Manual review only | Error-prone | |

**User's choice:** Grep for fixture filenames; TypeScript catches import errors

### Q3: Does D-24's split stay as-is in Phase 59?
| Option | Description | Selected |
|--------|-------------|----------|
| Keep split; only document + verify zero circular deps | E2E-04 is documentation requirement | ✓ |
| Move auth/email helpers to dev-seed (full consolidation) | Violates D-24 | |
| Move bulk-write back to tests/ (undo D-24) | Hollows out dev-seed | |

**User's choice:** Keep the D-24 split; Phase 59 only verifies zero circular deps and documents

---

## Rollback / failure handling

### Q1: What if post-swap parity check shows a regression?
| Option | Description | Selected |
|--------|-------------|----------|
| Fix forward: debug, adjust, re-run; no rollback | Phase stays open until parity | ✓ |
| Hard rollback: revert swap, re-open as blocked | Conservative; breaks autonomous chain | |
| Time-boxed fix-forward, then rollback | Arbitrary threshold | |

**User's choice:** Fix forward: debug the failure, adjust e2e template or seed-test-data.ts, re-run parity

### Q2: Are the 19 pre-existing data-race failures in scope for Phase 59?
| Option | Description | Selected |
|--------|-------------|----------|
| Out of scope; Svelte 5 Cleanup milestone owns them | Tight scope | ✓ |
| In scope if trivial to fix | Scope creep risk | |
| Try to fix at least one as proof | Mixes milestones | |

**User's choice:** Out of scope — document preserved as-is; fixing belongs to Svelte 5 Migration Cleanup

### Q3: Git branching strategy for Phase 59?
| Option | Description | Selected |
|--------|-------------|----------|
| Phase branch continues on feat-gsd-roadmap; one commit per plan | Matches Phases 56-58 pattern | ✓ |
| New branch per plan; merge back on completion | Isolation; ceremony | |
| Squash all commits before merge | Cleaner main; loses traceability | |

**User's choice:** Phase branch continues off current `feat-gsd-roadmap`

---

## Claude's Discretion

- Circular-dep verification tool choice (madge, depcruise, typecheck)
- Whether `baseline/summary.md` is generated by script or hand-written
- Exact `wait-for-healthy` implementation (curl retry, wait-on, custom Node script)
- Whether to amend commit 3 into commit 4 vs keep separate (delete timing)
- Which Playwright teardown entry gets swapped (global-teardown vs per-spec vs both)

## Deferred Ideas

- Fixing the 19 data-race E2E failures (Svelte 5 Migration Cleanup)
- Moving auth/email helpers to dev-seed (rejected)
- Hard rollback on parity failure (rejected)
- Pre-flight drift detector (rejected)
- Removing `--workers=1` from normal E2E flow
- Pruning `tests/tests/data/assets/`
