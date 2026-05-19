# Phase 45: Provider Abstraction and Configuration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 45-provider-abstraction-and-configuration
**Areas discussed:** Callback route path, Edge Function naming, Existing user migration, E2E test strategy (batch discussion across phases 45-48)

---

## Callback Route Path

| Option | Description | Selected |
|--------|-------------|----------|
| /preregister/oidc/callback | Clean, standard OIDC convention. Drop the signicat/ prefix. | |
| /preregister/auth/callback | Shorter, more generic. Not OIDC-specific. | |
| /api/oidc/callback | API-style path alongside the existing /api/oidc/token endpoint | ✓ |

**User's choice:** /api/oidc/callback
**Notes:** Groups all OIDC operations under /api/oidc/

## Old Path Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect | SvelteKit redirect from old path to new — safe for existing Signicat configurations | |
| Remove it | Just delete the old route — deployments will update their IdP config | ✓ |

**User's choice:** Remove it
**Notes:** No backward compat needed for the old route

## Identity Matching

User provided custom approach instead of selecting from options:
- Configurable `identityMatchProp` defines which claim to match on
- `extractClaims` for additional metadata
- `firstNameProp` and `lastNameProp` for candidate name extraction
- No migration for existing users — clean break

---

## Claude's Discretion

- TypeScript interface shape for providers
- Auth config structure (inline vs separate file)
- Exact env var naming for Idura-specific vars

## Deferred Ideas

None
