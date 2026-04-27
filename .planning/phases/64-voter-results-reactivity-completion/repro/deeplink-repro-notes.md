# Phase 64 Plan 02 — Deeplink Reproduction Notes

**Reproduced:** 2026-04-27
**Stack:** `yarn dev` already running (Vite on :5173, Supabase on :54321 — verified via `lsof`)
**Plan reference:** `.planning/phases/64-voter-results-reactivity-completion/64-02-PLAN.md` Task 1
**Wave 1 baseline:** Plan 64-01 (commit `c5d4578e4`) — dev-seed parent_nomination wiring + Supabase
adapter `parentNominationType` derivation already landed.

---

## Harvested Deeplink Targets

Re-seeded via `yarn dev:seed --template e2e` (the full DB had been wiped between Plan 64-01 close
and Plan 64-02 start; the same e2e template re-applied cleanly with all Plan 64-01 changes in tree).

```
electionId       = 406120fd-72c8-4eb4-8415-d10a8cff4760  ("Test Election 2025")
constituencyId   = 7b46796d-2f90-469c-894e-337da46a7b11  ("Test Constituency Alpha")
candidateId      = 415c717c-3378-4b60-8e2a-ed26f32021bc  (Candidate "Test ..." — entity id, not nomination id)
nominationId     = bb2c9af9-a857-4df6-b8ee-37ae15b43728  (test-nom-alpha; parented to a party org)
```

The candidate is wired to a parent party nomination via the Plan 64-01 dev-seed extension
(`packages/dev-seed/src/templates/e2e.ts` adds `parent_nomination` external_id refs to 11
visible candidate nominations), so the deeplink rendering path traverses the full
`parentNominationId → parentNominationType` derivation in the Supabase adapter that Plan 64-01
introduced. This is the highest-fidelity test of the deeplink chain at the post-Wave-1 baseline.

**Source query:**

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
  SELECT n.id AS nomination_id, n.election_id, n.constituency_id, c.id AS candidate_id, c.first_name
  FROM nominations n JOIN candidates c ON c.id = n.candidate_id
  WHERE n.entity_type='candidate' AND n.unconfirmed = false LIMIT 3;
"
```

---

## Reproduction Commands

The repro-only Playwright config is committed at
`.planning/phases/64-voter-results-reactivity-completion/repro/playwright.config.ts`. It has no
`projects:` block (so no data-setup / auth-setup project chain runs) and no `webServer:` block
(so it relies on a separately-started Vite dev server). The temporary spec
`deeplink-repro.spec.ts` was created in the same directory, executed 5x, then deleted per Step 6
cleanup. Per Step 6 the `playwright.config.ts` itself is preserved as an audit record.

### Independent reproduction (Step 3 — repro-only spec, bypasses fixture)

```bash
# RUN 1
yarn playwright test \
  -c .planning/phases/64-voter-results-reactivity-completion/repro/playwright.config.ts \
  --workers=1 --reporter=line --retries=0 --timeout=30000 \
  2>&1 | tee .planning/phases/64-voter-results-reactivity-completion/repro/deeplink-repro.log

# RUNS 2-5 (appended to the same log)
for i in 2 3 4 5; do
  echo "=== RUN $i ==="
  yarn playwright test \
    -c .planning/phases/64-voter-results-reactivity-completion/repro/playwright.config.ts \
    --workers=1 --reporter=line --retries=0 --timeout=30000 \
    2>&1 | tee -a .planning/phases/64-voter-results-reactivity-completion/repro/deeplink-repro.log
done
```

### Targeted Playwright re-verification (Step 5 — full fixture path)

```bash
yarn playwright test -c ./tests/playwright.config.ts \
  --grep "deeplink list\\+drawer|deeplink edge case|drawer paints before list on cold deeplink" \
  --workers=1 --reporter=line --retries=0 \
  2>&1 | tee /tmp/64-02-targeted-run-1.log
# Repeated 5x; results captured in /tmp/64-02-targeted-runs-2-5.log + run-1 log.
```

---

## Outcomes Per Shape

### Shape 3 — `/results/candidates/candidate/<candidateId>?electionId=...&constituencyId=...`

**Independent reproduction (5x):**

| Run | Outcome | Duration |
| --- | ------- | -------- |
| 1   | P (PASS) | 3.3s     |
| 2   | P (PASS) | 2.7s     |
| 3   | P (PASS) | 2.6s     |
| 4   | P (PASS) | 2.6s     |
| 5   | P (PASS) | 2.6s     |

5/5 deterministic PASS. Drawer (`voter-results-drawer`) and list-container
(`voter-results-list-container`) both visible within 5s of `domcontentloaded` on cold-nav
without the answeredVoterPage fixture.

**Standard fixture-driven test (5x):**

| Run | Total | Named test | Duration |
| --- | ----- | ---------- | -------- |
| 1   | 6 passed | shape 3 ✓ | 1.0m |
| 2   | 6 passed | shape 3 ✓ | 1.0m |
| 3   | 6 passed | shape 3 ✓ | 57.2s |
| 4   | 6 passed | shape 3 ✓ | 57.2s |
| 5   | 6 passed | shape 3 ✓ | 1.0m |

5/5 deterministic PASS through the answeredVoterPage fixture too.

**Classification:** **Outcome P** (deeplink rendering path is sound; both fixture-driven and
fixture-bypass paths return the rendered drawer + list).

### Shape 4 — `/results/organizations/candidate/<candidateId>?electionId=...&constituencyId=...`

**Independent reproduction (5x):**

| Run | Outcome | Duration |
| --- | ------- | -------- |
| 1   | P (PASS) | 3.3s |
| 2   | P (PASS) | 2.7s |
| 3   | P (PASS) | 2.6s |
| 4   | P (PASS) | 2.6s |
| 5   | P (PASS) | 2.6s |

5/5 deterministic PASS. Drawer (`voter-results-drawer`) and party-section
(`voter-results-party-section`) both visible — confirming the cross-type deeplink correctly
renders an organizations list underneath while the drawer holds a candidate entity.

**Standard fixture-driven test (5x):**

| Run | Total | Named test | Duration |
| --- | ----- | ---------- | -------- |
| 1   | 6 passed | shape 4 ✓ | 1.0m |
| 2   | 6 passed | shape 4 ✓ | 1.0m |
| 3   | 6 passed | shape 4 ✓ | 57.2s |
| 4   | 6 passed | shape 4 ✓ | 57.2s |
| 5   | 6 passed | shape 4 ✓ | 1.0m |

5/5 deterministic PASS.

**Classification:** **Outcome P**.

### Test 10 — `drawer paints before list on cold deeplink (D-10)` (regression watch)

**Standard fixture-driven test (5x — same combined-grep run as shapes 3+4):**

| Run | Test 10 | Notes |
| --- | ------- | ----- |
| 1   | ✓ | drawer-before-list source order preserved; computedStyle list-container `content-visibility: auto` |
| 2   | ✓ | (same) |
| 3   | ✓ | (same) |
| 4   | ✓ | (same) |
| 5   | ✓ | (same) |

5/5 PASS. Phase 62 D-10 source-order contract NOT regressed by Plan 64-01's changes.

---

## Fix Scope Selected

**NONE — Plan 64-01 fixture-flake fix closes shape 3+4 by removing the upstream fixture timeout.
Production code unchanged in Plan 64-02.**

All 5 of 5 repro runs of both shapes returned Outcome P. The deeplink rendering path
(`+layout.svelte` `drawerEntity` $derived → `getEntityAndTitle` → `EntityDetailsDrawer`) is
sound on cold-nav independent of the answeredVoterPage fixture. This rules out the three
hypothesized failure surfaces in CONTEXT D-05:

- **F-A** (component-side `voterCtx.matches` unpopulated on cold-nav, drawer fails to render): NOT
  reproduced. The drawer is visible within 3s of `domcontentloaded` in every run, both with and
  without fixture pre-warming. `voterCtx.matches` is populated by the time the layout's
  `$derived.by` evaluates `getEntityAndTitle` — Phase 62 Option B's load-chain produces matches
  before component mount.
- **F-B** (load-function redirect strips state on cold deeplinks): NOT reproduced. The 4-segment
  URL with `?electionId=&constituencyId=` is preserved end-to-end; the page lands on the original
  URL with both drawer and list-container rendered.
- **F-C** (testid override at `EntityListWithControls.svelte:143` prevents `voter-results-list`
  from resolving): NOT reproduced. The independent repro asserts `voter-results-list-container`
  (the `<div>` testid set in `+layout.svelte:349`, which is NOT affected by the
  EntityListWithControls override). The standard fixture path additionally exercises
  `voter-results-list` and the test passes — confirming the override theory was already
  empirically falsified at the Plan 64-01 baseline.

The conclusion is that **Plan 64-01's downstream fixes (e2e seed parent_nomination wiring,
Supabase adapter `parentNominationType` derivation, spec interaction-race hardening) ALSO close
D-08 shapes 3+4 — even though the original failure was attributed to a fixture-timeout-induced
upstream cascade**. With the seed now wiring candidates to parties and the adapter correctly
materializing the parent type, every deeplink that lands during the answeredVoterPage fixture
test reaches a fully-rendered page without timing out at any of the upstream steps. The
fixture-driven shape 3 + shape 4 tests (which previously failed at `voter.fixture.ts:68` setup
per Phase 63 JSON ground truth) now complete in ~57s end-to-end with no flake observed in 5
consecutive runs.

This matches the CONTEXT D-13 default-outcome prediction: "the default outcome of Plan 64-02 may
be NONE (no production code change required) if Plan 64-01's fixes already close shapes 3+4. The
plan must EMPIRICALLY DISAMBIGUATE before deciding." The empirical disambiguation has been
performed; the answer is NONE.

---

## Verification Plan for Task 2

Task 2 branch = **NONE** (no production-code modifications). The acceptance gates run as follows:

1. **D-01 acceptance gate:** `grep -rn "from 'svelte" packages/filters/src/` returns 0 — preserved
   from Plan 64-01 baseline; no Plan 64-02 mutation can touch this.
2. **Plan 64-01 boundary preservation:** `git diff apps/frontend/src/lib/contexts/filter/`,
   `git diff packages/filters/src/`, `git diff apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts`
   all return empty.
3. **Targeted Playwright (3 tests):** the targeted invocation in Plan 64-02 verify already showed
   `6 passed` (data-setup + 3 named tests + 2 data-teardown) deterministically across 5 runs;
   Task 2's verify will reproduce that result.
4. **Drawer-first source-order contract:** Test 10 stays green (verified above, 5/5).
5. **Production-code diff:** `git diff apps/frontend/src/routes/(voters)/(located)/results/`
   should return empty for Branch NONE.

Task 2 produces no commits; the SUMMARY documents this empirical conclusion.

---

## Summary

- **Independent reproduction outcome:** Both shapes Outcome P (PASS), 5/5 consecutive runs in
  ~2.6-3.3s each.
- **Standard fixture-driven outcome:** Both shapes pass through the answeredVoterPage fixture,
  5/5 consecutive runs in ~57s-1.0m each. Test 10 (D-10 source-order regression watch) stays
  green in the same combined-grep invocations.
- **Fix Scope Selected:** NONE — Plan 64-01's fixture-flake fix closes shapes 3+4 fully.
- **D-01 acceptance gate:** preserved (PASS at baseline; no Plan 64-02 change can affect it).
- **Plan 64-02 production-code change:** none required.
