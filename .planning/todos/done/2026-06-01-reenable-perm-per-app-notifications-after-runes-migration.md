# Re-enable skipped perm-per-app-notifications tests + verify popup management after full runes migration

**Filed:** 2026-06-01
**Source:** quick task `260601-hn9` (skip notification popup permutation tests + record todos)
**Home phase:** v2.11 Phase 101 — Suite Re-enable + Milestone-Close Green Gate (SUITE-01). `resolves_phase: 101`. (Gated on the full Svelte runes migration, Phases 95-100; popup-queueing settles via Phase 95 CTX-05 popupStore + the context migrations.)
**Effort:** ~0.5 phase (un-skip + end-to-end popup-management audit; larger if the audit surfaces a queueing redesign)

## Why deferred

The 2 notification popup tests in the permutations suite
(`tests/tests/specs/perm/perm-per-app-notifications.spec.ts` —
`voter route shows voter notification only` + `candidate route shows candidate
notification only`) are skipped via `test.describe.skip(...)` because the
popup-management lifecycle is still in flux pending the full Svelte runes
migration. The reactive popup queueing (mount timing, re-queue on settings
push, cross-route isolation of voter vs candidate notifications) does not
settle deterministically under the current pre-migration component shape, so
the cross-route absence assertions (`[notif-voter]` MUST NOT appear on the
candidate route and vice versa) are unstable.

The test bodies are left INTACT (not deleted) so the coverage intent is
preserved. After the runes migration completes:

1. Remove the `test.describe.skip` and restore it to `test.describe` in
   `tests/tests/specs/perm/perm-per-app-notifications.spec.ts`.
2. Audit / verify popup management end-to-end: notification queueing, mount
   lifecycle, and cross-route isolation of voter vs candidate notifications.
   Confirm each app's notification renders ONLY on its own route and that the
   opposite app's marker never leaks into the dialog.

## Cross-references

- Skipped spec (re-enable target): `tests/tests/specs/perm/perm-per-app-notifications.spec.ts`
- Related mount-lifecycle todo (same popup-queue root cause): `.planning/todos/pending/2026-05-21-candidate-settings-notifications-voterapp-mount-lifecycle.md`
