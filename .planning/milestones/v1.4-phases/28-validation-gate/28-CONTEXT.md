# Phase 28: Validation Gate - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify the candidate app migration is complete — zero legacy Svelte 4 patterns in candidate routes, zero TypeScript errors in the frontend, and all 5 candidate-app E2E test files passing. This is a validation phase: run audits, type checks, and E2E tests. Fix any issues found inline (they are regressions or pre-existing infrastructure problems). This is the final gate before shipping v1.4.

Includes diagnosing and fixing the SES email infrastructure issue that causes 3 candidate-app-mutation tests to fail.

</domain>

<decisions>
## Implementation Decisions

### Global runes switch
- **D-01:** Do NOT flip `compilerOptions.runes: true` globally — 16 `.svelte` files (root layout, error page, admin routes, Banner, Header, MaintenancePage, color preview) haven't been migrated and would break
- **D-02:** Keep per-component `<svelte:options runes />` directives on all 151 migrated files — they serve as documentation and are harmless
- **D-03:** Global runes switch deferred to a future milestone when admin routes and remaining files are migrated

### Legacy pattern audit (VALD-01)
- **D-04:** Audit scope is `apps/frontend/src/routes/candidate/` only — voter routes and shared components already verified in Phase 26
- **D-05:** Legacy patterns to check: `$:`, `on:event` directives (not native `onclick`), `<slot`, `createEventDispatcher` — zero matches required
- **D-06:** Any legacy pattern found in candidate routes is a regression from Phase 27 and must be fixed inline

### TypeScript checking (VALD-02)
- **D-07:** Run `svelte-check` on the full frontend codebase (not just candidate routes) — catches cross-file type regressions from the migration
- **D-08:** Zero TypeScript errors required; compiler warnings are informational but non-blocking

### E2E testing (VALD-03)
- **D-09:** All 5 candidate-app E2E test files must execute and pass: candidate-auth, candidate-profile, candidate-questions, candidate-registration, candidate-settings
- **D-10:** The 3 failing candidate-app-mutation tests (registration, profile, auth — SES email infrastructure) should be investigated and fixed inline as part of Phase 28. The SES mailer has worked before and the failure is likely a config or LocalStack issue, not a code issue
- **D-11:** Docker stack (`yarn dev`) assumed already running — plan does not manage Docker lifecycle

### Claude's Discretion
- Order of validation steps (audit → type check → SES fix → E2E, or different)
- How to diagnose the SES email infrastructure issue
- Exact svelte-check command flags
- How to batch E2E test execution

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Validation tooling
- `tests/playwright.config.ts` — Playwright E2E test configuration
- `tests/tests/specs/candidate/` — 5 candidate E2E test files (candidate-auth, candidate-profile, candidate-questions, candidate-registration, candidate-settings)
- `apps/frontend/svelte.config.js` — Svelte compiler configuration (no global runes — per-component opt-in only)

### Audit scope
- `apps/frontend/src/routes/candidate/` — 25 candidate route files (audit target for VALD-01)

### SES email infrastructure
- `apps/strapi/` — Strapi backend sends registration/password emails via SES
- Docker compose config — LocalStack SES service on port 4566
- `.env` — `MAIL_*` env vars control email configuration

### Prior phase context
- `.planning/phases/27-candidate-route-migration/27-CONTEXT.md` — Migration decisions, lifecycle/context patterns
- `.planning/milestones/v1.3-phases/26-validation-gate/26-CONTEXT.md` — v1.3 validation gate patterns (direct predecessor)

### Known issues
- `.planning/todos/pending/2026-03-21-fix-candidate-app-mutation-e2e-tests-ses-email-infrastructure.md` — SES email todo (to be resolved in this phase)

### Requirements
- `.planning/REQUIREMENTS.md` — VALD-01, VALD-02, VALD-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Current State (from Phase 27 verification)
- **$: in candidate routes:** 0 occurrences (verified by Phase 27 verifier)
- **on:event in candidate routes:** 0 active instances (1 commented-out `on:change` in settings — stashed code)
- **<slot in candidate routes:** 0 occurrences
- **createEventDispatcher in candidate routes:** 0 occurrences
- **svelte-check:** 0 errors, 120 warnings (confirmed after Phase 27 smart quote fix)
- **E2E results:** 40 passed, 4 failed (1 voter-detail fixed, 3 SES email pre-existing)

### Integration Points
- E2E tests run against Docker stack (ports 1337, 5173, 5432, 4566)
- SES emails sent via LocalStack on port 4566
- `svelte-check` runs against full frontend at `apps/frontend/`

</code_context>

<specifics>
## Specific Ideas

- Run the legacy pattern audit FIRST — if clean (expected based on Phase 27 verification), focus on SES fix and E2E
- Investigate SES by checking: LocalStack container health, `MAIL_*` env vars in `.env`, Strapi email plugin config, `curl http://localhost:4566/_aws/ses/` for email retrieval
- The SES mailer worked earlier in the project — the failure is likely a config regression or LocalStack API change, not a fundamental infrastructure problem

</specifics>

<deferred>
## Deferred Ideas

- **Global `compilerOptions.runes: true`** — flip after admin routes and remaining 16 files are migrated
- **Strict compiler warnings mode** — enable `--compiler-warnings treat-as-errors` after all code is migrated
- **Context system rewrite** — TODO[Svelte 5] markers in 7 files (contexts, admin, layouts) — separate milestone

</deferred>

---

*Phase: 28-validation-gate*
*Context gathered: 2026-03-21*
