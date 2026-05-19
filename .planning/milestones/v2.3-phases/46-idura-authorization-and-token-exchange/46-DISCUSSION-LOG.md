# Phase 46: Idura Authorization and Token Exchange - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 46-idura-authorization-and-token-exchange
**Areas discussed:** Callback route path (batch discussion across phases 45-48)

---

## Callback Route Path

Decided in batch with Phase 45: `/api/oidc/callback` as API-style route. Old signicat/oidc/callback deleted.

## Authorization and Token Exchange

No gray areas — implementation plan in `.planning/idura-ftn-auth-plan.md` covers JAR construction and private_key_jwt in detail. Decisions carried forward from plan.

---

## Claude's Discretion

- State/nonce generation approach
- Error handling for JAR failures
- Callback route implementation (page vs server route)

## Deferred Ideas

None
