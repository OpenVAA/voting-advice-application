# Phase 28: Validation Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-21
**Phase:** 28-validation-gate
**Areas discussed:** Global runes switch, Known test failures, Audit scope

---

## Global Runes Switch

| Option | Description | Selected |
|--------|-------------|----------|
| Keep deferring (Recommended) | Don't flip global switch. 16 non-runes files would break. Per-component directives work fine. | ✓ |
| Flip globally + opt-out | Set runes: true globally, add runes={false} to 16 unmigrated files. | |
| You decide | Claude determines approach. | |

**User's choice:** Keep deferring
**Notes:** 16 files without runes include root layout, error page, admin routes, Banner, Header, MaintenancePage.

---

## Known Test Failures

### SES email test handling

| Option | Description | Selected |
|--------|-------------|----------|
| Accept known failures | Pass validation if questions/settings pass. Track registration/profile/auth as tech debt. | |
| Require all green | Block until all 5 files pass. | |
| You decide | Claude determines approach. | |

**User's choice:** Other — "Let's try to once more to get them running. The SES mailer has worked earlier and should not have been broken."
**Notes:** User wants to investigate and fix SES email infrastructure as part of Phase 28.

### Fix timing

| Option | Description | Selected |
|--------|-------------|----------|
| Fix inline in Phase 28 (Recommended) | Include SES diagnosis and fix in Phase 28 plans. | ✓ |
| Fix before Phase 28 | Investigate SES now, before planning the validation gate. | |

**User's choice:** Fix inline in Phase 28

---

## Audit Scope

### Legacy pattern audit (VALD-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Candidate routes only (Recommended) | Audit apps/frontend/src/routes/candidate/ only. Voter/shared already verified in Phase 26. | ✓ |
| Full frontend codebase | Audit everything. More thorough but flags intentional legacy in admin/context. | |
| You decide | Claude determines boundary. | |

**User's choice:** Candidate routes only

### TypeScript checking (VALD-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Full frontend (Recommended) | svelte-check on entire frontend. Catches cross-file regressions. | ✓ |
| Candidate routes only | Faster but might miss shared code type errors. | |

**User's choice:** Full frontend

---

## Claude's Discretion

- Validation step ordering
- SES email diagnosis approach
- svelte-check command flags
- E2E test batching strategy

## Deferred Ideas

- Global compilerOptions.runes: true (future milestone)
- Strict compiler warnings mode (future milestone)
- Context system rewrite (separate milestone)
