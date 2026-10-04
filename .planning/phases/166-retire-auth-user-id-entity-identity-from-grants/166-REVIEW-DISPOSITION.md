---
phase: 166
review: 166-REVIEW.md
recorded: 2026-10-02
---

# Phase 166 — Code-review disposition

The code-review gate is advisory. Every finding is recorded here with what happened to it.

| ID | Severity | Finding | Disposition |
|----|----------|---------|-------------|
| WR-01 | warning | `writeEntityGrant` idempotency relies on PostgreSQL checking `grants_user_scope_target_role_key` before `idx_grants_one_candidate_editor` (index OID order); pinned by pgTAP only on a fresh reset | open — candidate fix: upsert with `ignoreDuplicates` on the grant's own key (both `entityGrant.ts` copies); surfaced to the operator |
| WR-02 | warning | A concurrent first login can create two candidates for one identity; later requests then raise `ERR_ENTITY_IDENTITY_AMBIGUOUS` with no self-repair | open — deferred by D-12 (no write-time per-user constraint); recorded as a backstop truth in 166-02 |
| IN-01 | info | `get_candidate_user_data` raises the ambiguity error for entity types with no arm (`faction`, `alliance`) | open — no caller passes them |
| IN-02 | info | `forceRegister` fails on a stale editor grant without naming the holder | open |
| IN-03 | info | `testCredentials.ts` still calls CA-AA-1 the "perfect-match candidate", contradicting the swept `base.ts` comment | open |
