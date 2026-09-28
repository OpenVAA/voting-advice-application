# Phase 92: E2E test infrastructure hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-02
**Phase:** 92-e2e-test-infrastructure-hardening
**Areas discussed:** Raw-locator scope, goToPage/expectPageVisible, Timeout taxonomy, Freshness-guard threshold

---

## Raw-locator scope (Workstream 1)

### getByRole policy

| Option | Description | Selected |
|--------|-------------|----------|
| Keep getByRole | Allow getByRole; only eliminate the 7 truly-raw (page.locator x2, getByText x1, chained .locator x4) | ✓ (refined) |
| Migrate getByRole → testId | Route all 115 getByRole through testIds | |
| Keep but only inside fixtures | getByRole allowed only in fixture files | |

**User's choice:** Keep getByRole — **refined**: "change all getByRoles where a testid is available to use it."
**Notes:** Not a blanket migration. getByRole stays allowed; but where an element already has a stable testId, switch that call to getByTestId. The 7 truly-raw locators are the only hard-forbidden set.

### Enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| Lint rule (error) | eslint rule forbidding page.locator/getByText/chained .locator, set to error | ✓ |
| One-time sweep only | Fix 7 now, rely on typecheck + review | |
| You decide | Let planner pick | |

**User's choice:** Lint rule (error) — answered together with the getByRole refinement above.
**Notes:** Lint rule guards the truly-raw patterns from regressing. The testId-preference sweep over getByRole is one-time + code-review (a lint rule cannot detect "a testId exists").

---

## goToPage / expectPageVisible (Workstream 2)

### Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Navigate + assert visible | goToPage navigates AND internally calls expectPageVisible(true) | ✓ |
| Navigate only | goToPage just navigates; tests call expectPageVisible separately | |
| You decide | Let planner choose | |

**User's choice:** Navigate + assert visible.
**Notes:** expectPageVisible stays public for explicit re-checks / visible=false negatives.

### Fixture rollout scope

| Option | Description | Selected |
|--------|-------------|----------|
| Every navigated/asserted page | Any page with a goto OR URL/visibility assertion gets a fixture; includes rebuilding voter-side fixtures | ✓ |
| Pages with explicit assertions only | Only currently-asserted pages get fixtures | |
| You decide | Let researcher enumerate | |

**User's choice:** Every navigated/asserted page.
**Notes:** Includes rebuilding the deleted voter-side page fixtures (home, intro, questions, results, entity-detail).

---

## Timeout taxonomy (Workstream 3)

### Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Semantic buckets | Single exported object of named buckets ({element,click,page,slowPage,testMax}) | ✓ |
| Flat named constants | Individual exported consts | |
| You decide | Let planner derive | |

**User's choice:** Semantic buckets.

### File location + exceptions

| Option | Description | Selected |
|--------|-------------|----------|
| helpers/ + inline rationale | tests/tests/helpers/timeouts.ts; single-test exceptions inline with // reason: | ✓ |
| constants/ + exceptions bucket | tests/tests/constants/timeouts.ts; exceptions as named entries | |
| You decide | Let planner pick | |

**User's choice:** helpers/ + inline rationale.

---

## Freshness-guard threshold (Workstream 5)

### Guard logic

| Option | Description | Selected |
|--------|-------------|----------|
| Seed-aware allowlist | Treat known default-seed baseline as fresh; flag only rows beyond it | ✓ (refined) |
| Count threshold | Flag only when non-test rows exceed a small number (e.g. > 5) | |
| You decide | Let researcher inspect seed | |

**User's choice:** Seed-aware.

### Default behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Keep warn-only default | Default warn-and-proceed; E2E_REQUIRE_FRESH_DB=true opts into hard-fail | ✓ |
| Hard-fail by default now | Flip default to throw on contaminated DBs | |
| You decide | Let planner choose | |

**User's choice:** Keep warn-only default — **refined**: "with the seed-awareness, perhaps prefix all auto-seeded rows with 'global-seed' or smth, and allow any of these."
**Notes:** Prefer a sentinel external_id prefix for auto/baseline-seeded rows over a hardcoded count or per-row allowlist; the guard allows any row with that prefix. Open item for research: dev-seed default already uses `seed_` and there is no entity-seeding seed.sql — decide whether to reuse `seed_` or introduce a dedicated `global-seed` sentinel, and pin down the origin of the ~2 false-positive rows.

---

## Claude's Discretion

- Exact eslint rule/config (plugin `no-raw-locators` vs custom).
- Canonical timeout bucket names/values (derived from current usages).
- Per-page stable testId chosen for each expectPageVisible.
- Voter-side fixture structure.
- How tests are typechecked (no tests/tsconfig.json today).

## Deferred Ideas

None — discussion stayed within phase scope. Four todo-matcher hits (party-app generalization, app-shared paradigm, mergeSettings re-exports, alliance-tab) were spurious keyword matches, unrelated to e2e infra hardening, and not folded.
