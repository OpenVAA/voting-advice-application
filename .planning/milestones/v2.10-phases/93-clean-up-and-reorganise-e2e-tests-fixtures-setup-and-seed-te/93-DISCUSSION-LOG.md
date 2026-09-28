# Phase 93: Clean up and reorganise E2E tests, fixtures, setup, and seed templates - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-03
**Phase:** 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
**Areas discussed:** Seed e2e/ restructure, Setup/ taxonomy + old-dataset fate, Rename breadth (mega + baseV1), Fixture placement (shared vs voter)

---

## Seed e2e/ restructure

### Invocable template name
| Option | Description | Selected |
|--------|-------------|----------|
| e2e/base | Invoke as `--template e2e/base`; resolve-template maps to e2e/base.ts; old bare `e2e` retired | ✓ |
| Keep 'e2e' as alias | `--template e2e` resolves to e2e/base.ts under the hood | |
| base | Drop the e2e prefix at invocation entirely | |

### Old dev-seed e2e tests (assert deleted e2e.ts shape)
| Option | Description | Selected |
|--------|-------------|----------|
| Retarget to new base | Rewrite e2e.test.ts + e2e-app-settings.test.ts against new base + rename | ✓ |
| Delete (baseV1 already covered) | Remove if baseV1 dev-seed coverage already exists | |
| You decide | Inspect coverage, then retarget-or-delete | |

### A11y data source
| Option | Description | Selected |
|--------|-------------|----------|
| Reuse base setup chain | Depend on the existing base (formerly baseV1) data-setup project; no new setup files | ✓ |
| Dedicated a11y setup | Own setup/teardown project seeding base independently | |
| You decide | Researcher picks based on ordering/teardown conflicts | |

### Canonical external_id prefix
| Option | Description | Selected |
|--------|-------------|----------|
| test-e2e-base- | Align prefix with e2e/base path; update freshness-guard allowlist | ✓ |
| Keep test-baseV1- | Minimize churn; diverges from new naming | |
| You decide | Lowest-churn prefix consistent with template + guard | |

**Notes:** All four sub-decisions chose the consistency-maximizing option — the new base dataset is fully renamed (path, template name, prefix) rather than aliased. Old e2e.ts content is discarded; baseV1 content survives as the one canonical base.

---

## Setup/ taxonomy + old-dataset fate

### Base setup (data.setup e2e vs baseV1.setup now seed same data)
| Option | Description | Selected |
|--------|-------------|----------|
| Merge into one base setup | Collapse data.setup/teardown into base setup/teardown; repoint visual/bank/perf/auth | ✓ |
| Keep both, repoint data.setup | Two projects seeding same data; more isolation, redundant | |
| You decide | Researcher determines sharing safety | |

### Shared-infra directory
| Option | Description | Selected |
|--------|-------------|----------|
| shared/ | auth, setupFromTemplate, base setup+teardown, data helpers → setup/shared/ | ✓ |
| shared/ but base → voter/ | Base seed into setup/voter/ | |
| You decide | Planner assigns best-fit | |

### playwright.config rewrite depth
| Option | Description | Selected |
|--------|-------------|----------|
| Full rename + path update | Update testMatch regexes AND project keys; verify graph green | ✓ |
| Minimal (paths only) | Only what's needed to match/run; leave 'mega' in project names | |
| You decide | Whatever keeps graph green + honors 'remove mega' | |

**Notes:** Merge eliminates the now-duplicate e2e-dataset chain. shared/ = cross-role infra; perm/candidate/voter dirs hold role-specific setup.

---

## Rename breadth (mega + baseV1)

### 'Remove all mentions of mega' scope
| Option | Description | Selected |
|--------|-------------|----------|
| Everywhere incl. data prefixes | Specs, fixtures, setup basenames, project names, external_id prefixes, comments — zero mega tokens | ✓ |
| Files + config, keep data prefixes | Rename files/config but leave external_id prefixes | |
| You decide | Remove where visible without breaking invariants | |

### Rename baseV1?
| Option | Description | Selected |
|--------|-------------|----------|
| Rename baseV1 → base | Files, project keys, template export → base; fully consistent with e2e/base + test-e2e-base- | ✓ |
| Keep baseV1 name | Leave identifier; minimizes diff but mismatched | |
| You decide | Lowest-confusion name | |

### Canonical journey naming
| Option | Description | Selected |
|--------|-------------|----------|
| voter-journey / candidate-journey | Uniform across specs, fixtures, setup, project keys | ✓ |
| Other token | Different label (-flow/-e2e/-full) | |

**Notes:** Maximal consistency directive — no `mega`, `baseV1`, or bare-`e2e` token survives anywhere, including data-row prefixes.

---

## Fixture placement (shared vs voter)

### Root-level voter-app fixtures
| Option | Description | Selected |
|--------|-------------|----------|
| All → voter/ | entityDetails, entityFilters, resultsPage, views, voter-journey root → fixtures/voter/; shared/ reserved for cross-app | ✓ |
| Split voter vs shared | views + resultsPage (multi-perm-consumer) → shared/ | |
| You decide | Planner places by best-fit | |

### minimalVoterResultsPage
| Option | Description | Selected |
|--------|-------------|----------|
| voter/, rewrite only if needed | Extract to voter/; rewrite for minimal datasets only if coupling surfaces | ✓ |
| voter/, rewrite proactively | Rewrite up front to decouple from full journey | |
| You decide | Decide after inspecting data dependency | |

**Notes:** shared/ kept strictly cross-app. views stays separate (used by 6 perm specs + resultsPage + candidate root). Candidate→shared (email/langSelector/multilingualText) and candidate→voter (voterNav) moves are explicit in ROADMAP.

---

## Claude's Discretion
- Exact file/symbol names within chosen conventions, the commit sequencing of renames+moves, and how the playwright dependency graph is re-expressed — provided suite + lint + typecheck stay green at every commit.
- Whether the unrelated dev-seed `seed_` default prefix needs any touch (only if it intersects the freshness-guard allowlist work).

## Deferred Ideas
None — discussion stayed within phase scope. Four spurious todo-matcher hits (party-app, candidate answer-store, app-shared paradigm, mergeSettings) reviewed and not folded (see CONTEXT.md `<deferred>`).
