---
resolves_phase: 131
---

# Cell #3 candidate-settings notifications.voterApp — mount-lifecycle / appContext queueing redesign

**Filed:** 2026-05-21
**Source:** Phase 86.3 v2 baseline (commit 0a34dfbc7 — revert(86.3-01): cell #3 notifications.voterApp reactive $effect → onMount); Phase 87 v2.10 ship anchor SUMMARY §6 v2.11+ Deferrals Filed
**Home phase:** v2.11+ (target phase TBD)
**Effort:** ~0.5 phase (focused mount-lifecycle reorder + appContext popup queue extraction)

## Why deferred

Cell #3 of the SETTINGS-01 wave A series (`candidate-settings.spec.ts > SETTINGS-01 wave A — notifications.voterApp`) is hard-coded `test.skip()` via the `skipReason` field on the v2.10 ship baseline. The cell was briefly FIX-PASS in the Phase 86.3 v1 reactive `$effect` rewrite (Plan 86.3-01) but reverted via commit 0a34dfbc7 because the reactive popup re-queue (re-evaluating notifications.voterApp on every settings push) blocked the `answeredVoterPage` fixture in downstream voter-app specs (e.g. voter-results.spec.ts:173 — the fixture races against a transient popup overlay that re-mounts when the candidate-app overlay settings push fires).

This is a test-infra conflict, not a product bug — the reactive popup re-queue is correct production behavior but interacts poorly with Playwright's fixture-init order. v2.11+ closure path requires one of two structural changes:

- **Mount-lifecycle reorder** — defer the candidate-app overlay settings push until the voter-app fixture has fully mounted (`page.waitForLoadState('networkidle')` + explicit popup-stable assertion). Cleaner option but requires re-architecting the candidate-app overlay timing relative to voter-app test setup.
- **Move popup queueing into appContext** — extract the popup queue from the reactive `$effect` into the appContext lifecycle (queue on appContext init, flush after fixture ready signal). Larger refactor but eliminates the race entirely.

Phase 87 (v2.10 ship close) operator-accepted this as a documented v2.11+ deferral. The 4 hard-coded skips (cells #3 / #5 / #7 / #8) are the v2.10 SKIPPED_TESTS const-array baseline; cell #3 lives there until v2.11+ chooses one of the two closure paths.

## Phase 87 anchor binding

The v2.10 ship anchor `bc1c94957b8dcadfd79ff7464b39db42685387ae27dc24d69f417a32cfd03cee` includes cell #3 in SKIPPED_TESTS (4 entries total: cells #3 / #5 / #7 / #8). Pool growth without operator sign-off is prohibited per Phase 87 CONTEXT D-08 — if cell #3 closure surfaces during v2.11+ but introduces a new SKIP, escalate via Phase-86.3-reopen, not Phase 87 carry-forward.

## Cross-references

- Phase 86.3 SUMMARY: `.planning/phases/86.3-implement-skipped-tests-close-7-source-skipped-voter-app-can/86.3-SUMMARY.md` §"v2 baseline cell #3 re-disposition"
- Phase 87 SUMMARY: `.planning/phases/87-v2-10-all-green-milestone-close-anchor-capture-a-fresh-3-run/87-01-SUMMARY.md` §6 v2.11+ Deferrals Filed
- v2.10 SHIP anchor jsdoc: `tests/scripts/diff-playwright-reports.ts` PHASE 87 v2.10 SHIP ANCHOR block (cells #3 / #5 / #7 / #8 enumerated)
- Related cold-deeplink race todos (cells #5 / #7 / #8 share root cause, but cell #3 is a separate mount-lifecycle race):
  - `.planning/todos/pending/2026-05-14-qspec-walkToQuestion-cold-start-race.md` (cells #7 + #8)
  - `.planning/todos/pending/2026-05-16-voter-feedback-persistence-second-pass.md` (cell #5)
- Closure pattern precedent: Phase 86.3-04 cell #6 closure via answeredVoterPage fixture (commit 52a2f077a — navigation-from-home redesign). v2.11+ Recommendation #3 landed early during 86.3-v2 — same approach may apply to cell #3 closure.

## Disposition: CLOSED-AS-STALE

**Triaged:** Phase 131 Plan 01 (2026-07-22) · **Disposition:** CLOSED-AS-STALE (terminal).

The v2.14 suite rebuild deleted the original hard-coded `test.skip()` cell (`candidate-settings.spec.ts` SETTINGS-01 wave A cell #3) and the entire `SKIPPED_TESTS` skip mechanism — there is nothing left to un-skip. The load-bearing `notifications.voterApp` mount-lifecycle behavior it guarded (per-app notification isolation) is now asserted by the current covering spec **`tests/tests/specs/perm/perm-per-app-notifications.spec.ts`**: the voter route surfaces ONLY the `[notif-voter]` dialog and the candidate route surfaces ONLY the `[notif-cand]` dialog, each with strict cross-route absence enforcement. The companion **`perm-access-disable.spec.ts`** (EPERM-11) covers the three `access.*` app-availability gates against the same seeded singleton. Coverage **parity CONFIRMED** by reading both specs (Discussion §3.7) — no gap, so no assertion was added. The original `$effect`→`onMount` re-queue race that forced the v2.10 skip (commit 0a34dfbc7 revert) was resolved by the Svelte-5 runes lifecycle work in Phases 123/124; the reactive popup re-queue is now deterministic and no longer races the `answeredVoterPage` fixture. Both covering specs were run **3× cold-start in this phase** (fresh DB via `yarn db:reset` per iteration, single `:5173` dev server, no Playwright `webServer`) with result **pass/pass/pass** (47 tests each run, zero did-not-run) — evidence at `.planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/post-fix/131-notifications-3x.txt`. Zero new `test.skip` introduced.

**Source:** `.planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/131-01-PLAN.md` (Task 2) · evidence: `post-fix/131-notifications-3x.txt` (this-phase-dated).
