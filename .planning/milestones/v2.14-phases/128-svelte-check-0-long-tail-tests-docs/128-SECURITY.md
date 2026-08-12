---
phase: 128
slug: svelte-check-0-long-tail-tests-docs
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-17
---

# Phase 128 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| client → candidate SSR load (`+layout.server.ts`) | Supabase server client injected server-side from `hooks.server.ts`; phase only re-typed the already-passed handle | Authenticated session (cookies) |
| candidate → password-change API | Settings page submits a password change; phase changed only the static type shape | Credentials (new password; currentPassword UI-collected) |
| user (keyboard/AT) → Term tooltip trigger | Accessibility semantics; element must stay operable by keyboard and screen readers | None (UI interaction only) |
| user (touch/keyboard) → docs carousel | Accessible interaction is via buttons; touch handlers are enhancement only | None (UI interaction only) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-128-01-01 | Tampering | `_spikes-020` directory deletion | low | mitigate | Pre-deletion importer grep gate (D-05) run by mapper, executor, and verifier — zero importers; findings preserved in `.planning/spikes/` + spike skill; unit suite green post-deletion | closed |
| T-128-01-02 | Repudiation | Test mock retyping hiding a real runtime bug | low | accept | Mocks typed to verified real signatures (D-04, no any-casts); `yarn test:unit` green before and after | closed |
| T-128-02-01 | Information Disclosure | Concrete Supabase type at the SSR seam | low | accept | Type-only annotation; serverClient already injected/consumed at runtime (D-01); universal layer untouched | closed |
| T-128-02-02 | Spoofing / Elevation | `setPassword` currentPassword collected but not backend-verified | medium | transfer | Pre-existing Supabase session-model behavior; flagged in 128-02-SUMMARY + 128-REVIEW WR-05; owned by the Strapi-era auth-flow backlog investigations (`password-reset-code-method`, `register-page-registrationkey-method`) | closed |
| T-128-02-03 | Tampering | Removal of dead `settings-confirm-password` testIds entry | low | mitigate | Grep-confirmed unreferenced by any spec; two subsequent full-green E2E runs (125/0/0) prove nothing consumed it | closed |
| T-128-03-01 | Denial of Service | viewTransition.ts built-in swap dropping the feature-check | low | mitigate | Runtime `'startViewTransition' in document` feature-check kept (128-03-SUMMARY); full E2E green | closed |
| T-128-03-02 | Tampering | EntityInfo dead-branch collapse masking a real logic bug | low | mitigate | Narrowing verified (`ENTITY_TYPE.Organization === 'organization'`, enclosing `{#if}` narrows) — confirmed dead branch, not a masked bug | closed |
| T-128-04-01 | Denial of Service (a11y) | Term.svelte role change dropping keyboard operability | medium | mitigate | Strengthened beyond plan: W3C APG toggletip rework (real `<button>`, click/Enter/Space toggle, Escape dismiss in place, aria-expanded + aria-describedby); svelte-check 0/0, E2E 125/0/0 ×2, manual keyboard UAT passed 2026-07-17 | closed |
| T-128-04-02 | Denial of Service (a11y) | docs carousel role annotation misrepresenting the region | low | accept | `role="group"` chosen (`region` was redundant on `<section>` — a11y_no_redundant_roles); accessible button navigation untouched | closed |
| T-128-05-01 | Repudiation | E2E gate false-green (did-not-run cascade counted as pass) | high | mitigate | Cardinal rule demonstrably enforced in-phase: the post-fix run (1 failed / 78 did-not-run / 46 passed) was REJECTED, the WR-03 regression root-caused and reverted, and only the trusted 125/0/0 full run accepted | closed |
| T-128-05-02 | Tampering | Environment wedge (stale server / 502 / orphaned stacks) masking results | medium | mitigate | Fresh single dev server on :5173 + `yarn db:reset` protocol followed for every trusted run; 502-wedge remedy (stop/start cycle, port-squat check) exercised successfully | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-128-01 | T-128-01-02 | Typed-to-real-signature mocks cannot hide a runtime bug the unit + E2E suites would surface; both green | orchestrator (plan-time disposition) | 2026-07-17 |
| AR-128-02 | T-128-02-01 | Type-only SSR annotation; no new data exposure — runtime unchanged | orchestrator (plan-time disposition) | 2026-07-17 |
| AR-128-03 | T-128-04-02 | Carousel `role="group"` declares grouping semantics only; button navigation remains the accessible path | orchestrator (plan-time disposition) | 2026-07-17 |

*Transfer note: T-128-02-02 (server-side current-password verification) is transferred to the backlog auth-flow investigations, not accepted silently — see 128-REVIEW.md WR-05 for the OWASP A07 awareness flag.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-17 | 11 | 11 | 0 | secure-phase orchestrator (ASVS L1 short-circuit — plan-time register, all dispositions evidence-verified) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-17
