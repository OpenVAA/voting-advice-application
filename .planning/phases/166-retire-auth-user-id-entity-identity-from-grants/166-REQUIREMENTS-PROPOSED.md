# Phase 166 — Proposed requirement IDs

The roadmap entry says "Requirements: TBD — registered at planning". The planner does not edit
`.planning/REQUIREMENTS.md` (other planners run concurrently in this worktree); the orchestrator registers
these IDs, adds an "Entity Identity" section and nine Traceability rows, and updates the rollup.

The prefix `AUTHID-` is unused in `.planning/REQUIREMENTS.md`. The IDs are the ones `166-RESEARCH.md`
§ Phase Requirements proposed, adopted without change. Each one is subject to the file's *Standing
acceptance rule*: the check that guards it is observed failing on a realistic regression before it
counts — the plans record those runs as NC-1..NC-7 in `166-NEGATIVE-CONTROLS.md`.

| ID | Description | Success criterion / decisions | Plans |
|----|-------------|-------------------------------|-------|
| AUTHID-01 | `get_candidate_user_data` resolves the caller's own entity from an `(entity, <type>, editor)` grant row read from the table through the private SECURITY DEFINER helper `private.caller_entity_ids`, filtered by project and never through `user_can`; more than one match in a project raises SQLSTATE `P0001` with HINT `ERR_ENTITY_IDENTITY_AMBIGUOUS`; both the candidate and the organization arm | SC1 · D-03, D-05, D-06, D-07 | 166-01 |
| AUTHID-02 | `identity-callback` looks a returning identity up by its candidate-editor grant (two service-role queries, project filter inside the lookup), `createCandidate` writes no auth link, and a grant-write failure on the create branch deletes the just-created candidate before rethrowing | SC2 · D-08, D-09 | 166-02 |
| AUTHID-03 | `invite-candidate` writes the grant only: the link step and its rollback arm are removed, `rollbackInvite` is kept for the grant failure, `flowConformance.test.ts` counts one rollback call, and the steps are renumbered | SC3 · D-10 | 166-02 |
| AUTHID-04 | One user per candidate: the partial unique index `idx_grants_one_candidate_editor` on `grants (target_id)` for candidate-editor rows; organizations stay multi-editor; `writeEntityGrant` (both copies) treats a unique violation as success only when it names `grants_user_scope_target_role_key`; no fixture grants two users one candidate | SC4 · D-11, D-12 | 166-01 |
| AUTHID-05 | The link column is gone from `candidates` and `organizations` with its two indexes, schema comments, `seed.sql` value, dev-seed permitted keys and absence test, `column-map.ts` entry, regenerated migration and types, pgTAP fixtures and vacuous guards, and the E2E admin client and both bank-auth specs | SC5 · D-13, D-14, D-16, D-17, D-18 | 166-02, 166-03 |
| AUTHID-06 | `anon` can read no auth user id from any table except the one named exemption `nominations.created_by`: a pgTAP catalog census plus a behavioural check, observed failing against the tree with the column present before the drop lands | SC6 (narrowed by D-02) · D-02, D-15 | 166-01, 166-03 |
| AUTHID-07 | Every file the phase touches passes `CLAUDE.md` § Comment Hygiene as a whole, and no comment narrates the retirement of the link | SC7 · D-19 | 166-01, 166-02, 166-03 |
| AUTHID-08 | Gates green in order: `yarn lint:check` → `yarn test:unit` → `yarn db:reset` + pgTAP → the candidate E2E projects → `bank-auth` and `bank-auth-journey` three times each → the full E2E suite, with "did not run" counted as failure | SC8 · D-20 | 166-04 |
| AUTHID-09 | `.claude/skills/database/*` (four files) describe the grant as the only user→entity link; the saved-answers todo is annotated with the grant-based lookup; the two named residues (`nominations.created_by` readable by anon; a failed compensating delete in `identity-callback`) are filed as todos | D-04 · `<deferred>` | 166-04 |
