# Phase 26: Validation Gate - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify the entire voter app and shared component layer is fully Svelte 5 idiomatic with zero regressions. This is a validation phase — run E2E tests, type checks, and a legacy pattern audit. Fix any issues found inline (they are regressions from Phases 22-25). This is the final gate before shipping v1.3.

</domain>

<decisions>
## Implementation Decisions

### Global runes switch
- Do NOT flip `compilerOptions.runes: true` globally in svelte.config.js — candidate routes, admin components, and context files still use Svelte 4 patterns and would break
- Keep per-component `<svelte:options runes />` directives on all migrated files — they serve as documentation and are harmless
- Global runes switch deferred to v1.4 after candidate + context migration is complete

### Type checking (VAL-02)
- Run `svelte-check` and ensure zero TypeScript errors in voter app routes and shared components
- Svelte compiler warnings (deprecations, accessibility) are informational but non-blocking for v1.3
- Add a TODO for future milestone: enable `--compiler-warnings treat-as-errors` strict mode once all code is migrated

### Audit boundary (VAL-03)
- **In scope:** `apps/frontend/src/routes/(voters)/` (all voter route files), `apps/frontend/src/lib/components/`, `apps/frontend/src/lib/dynamic-components/`
- **Out of scope:** `apps/frontend/src/routes/candidate/`, `apps/frontend/src/lib/candidate/`, `apps/frontend/src/lib/admin/`, `apps/frontend/src/lib/contexts/`, `apps/frontend/src/routes/+layout.svelte` (root layout)
- Legacy patterns to check: `$:` (ALL occurrences — including comments/strings), `on:event` directives (not native `onclick`), `<slot`, `$$restProps`, `$$slots`, `$$Props`, `createEventDispatcher`
- Any legacy pattern found in an in-scope file is a regression from Phases 22-25 and MUST be fixed in this phase

### E2E testing (VAL-01)
- Assume Docker stack (`yarn dev`) is already running — plan does not manage Docker lifecycle
- E2E failures are migration regressions and must be fixed inline in this phase
- All 92 E2E tests must pass (test files in `tests/tests/specs/`)
- Run with standard Playwright config at `tests/playwright.config.ts`

### Claude's Discretion
- How to batch E2E test execution (all at once vs. by spec file)
- Exact svelte-check command flags
- Order of validation steps (audit → type check → E2E, or different)
- How to diagnose and fix any failures found

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Validation tooling
- `tests/playwright.config.ts` — Playwright E2E test configuration
- `tests/tests/specs/` — All E2E test spec files (voter, candidate, variants, visual, perf)
- `apps/frontend/svelte.config.js` — Svelte compiler configuration (no global runes currently)

### Audit scope boundaries
- `apps/frontend/src/routes/(voters)/` — Voter route files (in scope for VAL-03)
- `apps/frontend/src/lib/components/` — Shared components (in scope for VAL-03)
- `apps/frontend/src/lib/dynamic-components/` — Dynamic components (in scope for VAL-03)

### Prior phase context
- `.planning/phases/22-leaf-component-migration/22-CONTEXT.md` — Per-component runes opt-in, global switch deferral
- `.planning/phases/24-voter-route-migration/24-CONTEXT.md` — Route migration patterns, $page → page rune

### Requirements
- `.planning/REQUIREMENTS.md` — VAL-01, VAL-02, VAL-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Current State (from codebase scout)
- **$: in voter routes:** 0 occurrences (clean)
- **<slot in voter routes:** 0 occurrences (clean)
- **$$restProps/$$slots/$$Props in shared:** 0 occurrences (clean)
- **createEventDispatcher in shared:** 0 occurrences (clean)
- **svelte-check:** Available (v4.4.5)
- **Playwright:** Config at `tests/playwright.config.ts`, 18 spec files
- **compilerOptions.runes:** Not set in svelte.config.js (per-component opt-in only)

### Integration Points
- E2E tests run against Docker stack (`yarn dev` on ports 1337, 5173, 5432, 4566)
- `svelte-check` runs against the full frontend codebase
- Unit tests (`npx vitest run`) already passing (410 tests, verified in Phase 25)

### Risk Assessment
- Codebase scout shows zero legacy patterns remaining — the audit may find nothing to fix
- E2E tests are the highest-risk item — they test the full stack and may surface runtime regressions not caught by unit tests
- Type checking may surface issues in files touched during migration that weren't caught during per-phase verification

</code_context>

<specifics>
## Specific Ideas

- Run the legacy pattern audit FIRST — if it's clean (likely), the phase focuses on E2E and type checking
- Consider running `svelte-check` scoped to voter routes and shared components only (not the full codebase) for VAL-02, since candidate/admin/context files have intentional legacy patterns
- Mark a TODO for future: enable strict compiler warning mode after v1.4 candidate + context migration

</specifics>

<deferred>
## Deferred Ideas

- **Global `compilerOptions.runes: true`** — flip after v1.4 candidate + context migration
- **Strict compiler warnings mode** — enable `--compiler-warnings treat-as-errors` after all code is migrated
- **Candidate app E2E regression** — candidate tests should pass but any failures from shared component API changes were addressed in Phase 25

</deferred>

---

*Phase: 26-validation-gate*
*Context gathered: 2026-03-19*
