---
phase: 166
review: 166-REVIEW.md
recorded: 2026-10-02
---

# Phase 166 — Code-review disposition

The code-review gate is advisory. Every finding is recorded here with what happened to it.

| ID | Severity | Finding | Disposition |
|----|----------|---------|-------------|
| WR-01 | warning | `writeEntityGrant` idempotency relies on PostgreSQL checking `grants_user_scope_target_role_key` before `idx_grants_one_candidate_editor` (index OID order); pinned by pgTAP only on a fresh reset | **fixed** in review-fix batch D: `44f66d311` (red), `519fd57bc` (fix). Both writers of a grant name the grant key as the conflict target: `writeEntityGrant` upserts with `ignoreDuplicates`, and `claim_invitations` inserts with `ON CONFLICT ON CONSTRAINT grants_user_scope_target_role_key DO NOTHING` (migration `00010`). pgTAP `52` rebuilds the key to reverse the probe order. See `166-REVIEW-FIX.md` |
| WR-02 | warning | A concurrent first login can create two candidates for one identity; later requests then raise `ERR_ENTITY_IDENTITY_AMBIGUOUS` with no self-repair | open — deferred by D-12 (no write-time per-user constraint); recorded as a backstop truth in 166-02; an operator decision, not taken up in review-fix batch D |
| IN-01 | info | `get_candidate_user_data` raises the ambiguity error for entity types with no arm (`faction`, `alliance`) | **no change needed** (batch D): `get_candidate_user_data` was replaced by `get_entity_user_data`, which takes the type and id together and never raises |
| IN-02 | info | `forceRegister` fails on a stale editor grant without naming the holder | **no change needed** (batch D): `grantEntityToUser` already names the candidate and its current editor before the insert |
| IN-03 | info | `testCredentials.ts` still calls CA-AA-1 the "perfect-match candidate", contradicting the swept `base.ts` comment | **fixed** in review-fix batch D: `5a0bdeadf` (comment) |
