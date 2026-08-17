# Phase 47: Edge Function Provider Support - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 47-edge-function-provider-support
**Areas discussed:** Edge Function naming, Existing user migration (batch discussion across phases 45-48)

---

## Edge Function Naming

| Option | Description | Selected |
|--------|-------------|----------|
| Rename to identity-callback | Single function, provider-agnostic. Old function name disappears. | ✓ |
| Keep both functions | Create identity-callback for Idura, keep signicat-callback as-is. | |
| Keep name, update code | Keep signicat-callback name but make code provider-agnostic. | |

**User's choice:** Rename to identity-callback
**Notes:** Single provider-agnostic function

## Existing User Migration

User rejected all proposed options and provided custom approach:
- No migration needed — clean break
- Configurable `identityMatchProp` for claim-based matching
- `firstNameProp` / `lastNameProp` for candidate name extraction
- `extractClaims` for additional metadata
- Store matching prop name, value, and extracted claims in app_metadata

---

## Claude's Discretion

- Provider config structure within Edge Function
- Error messages for missing/invalid claims
- Debug logging

## Deferred Ideas

None
