# Phase 122: E2E Specs — Bank-Auth Round-Trip - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-16
**Phase:** 122-e2e-specs-bank-auth-round-trip
**Areas discussed:** EFLOW-10b dataset
**Note:** Discussed in batch with Phase 121. The mock approach (Option B) and the EFLOW-10 deterministic-green-gate were already operator-LOCKED at the Phase 118 approval gate (2026-06-14) and are recorded in CONTEXT.md as pre-decided, not re-litigated. Only the EFLOW-10b dataset pin was open.

---

## EFLOW-10b dataset (needs >1 election + selectable constituencies)

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse 2-election perm dataset shape | Point bank-auth-journey setup at an existing multi-election perm dataset shape; no new data-setup pair | ✓ |
| New dedicated data-setup pair | Purpose-seeded multi-election candidate-registration setup/teardown; cleaner isolation, more seed surface | |

**User's choice:** Reuse 2-election perm dataset shape (Recommended)
**Notes:** Avoids a new data-setup pair. Confirm at build time the chosen dataset seeds >1 election AND selectable constituencies so the election/constituency steps render.

---

## Claude's Discretion

- Exact existing 2-election perm dataset to point the setup at.
- Mock issuer as `webServer` entry vs global-setup spawn.
- candidate-preregister page-object shape (elections → constituencies → email/ToU → register).

## Deferred Ideas

None — discussion stayed within phase scope.
