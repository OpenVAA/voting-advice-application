# Phase 48: Backward Compatibility and Testing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 48-backward-compatibility-and-testing
**Areas discussed:** E2E test strategy (batch discussion across phases 45-48)

---

## E2E Test Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Unit tests only | Test provider abstraction, JAR, private_key_jwt, Edge Function with unit tests. No E2E for OIDC redirect. | ✓ |
| Mock OIDC server | Stand up local mock OIDC endpoint simulating Idura. More coverage but significant infra. | |
| Edge Function E2E only | Call identity-callback directly with synthetic JWE tokens. Backend only. | |

**User's choice:** Unit tests only
**Notes:** OIDC redirect requires real identity provider — unit tests cover the logic, E2E covers email-based registration regression

---

## Claude's Discretion

- Test file organization
- Test fixture design for JWE/JWT
- Vitest mocks vs manual test doubles

## Deferred Ideas

None
