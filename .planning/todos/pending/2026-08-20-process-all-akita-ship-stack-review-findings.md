---
created: 2026-08-20T05:46:32.635Z
title: Process ALL Akita ship stack review findings before merge
area: review / ship stack
severity: major
files:
  - .planning/phases/151-ship-v0-2-akita-review-stack/151-DISPOSITION.md
  - .planning/phases/151-ship-v0-2-akita-review-stack/151-STACK-MANIFEST.md
  - .agents/code-review-checklist.md
  - apps/supabase/migrations/
---

## Problem

The v0.2 "Akita" ship stack is 12 open PRs (**#863–#874**, branches
`ship/v0.2-akita-01a-layout-move` … `-11-planning`). Phase 151 is marked
`status: complete`, `approval: operator-approved` — but "complete" there means the
*record* is complete, NOT that every finding is resolved. `151-DISPOSITION.md`
tallies **85 findings: 40 dispositioned DEFERRED, 45 FIXED**. Merging the stack
without a deliberate pass over the deferrals silently converts "recorded and
knowingly shipped" into "forgotten".

When the review findings for this stack are processed, ALL THREE of these streams
must be evaluated and handled — not just the one that happens to be in front of us:

1. **Every Copilot review comment** on all 12 PRs.
2. **Every operator (Kalle) comment** on all 12 PRs.
3. **Every deferred item from Claude's own reviews**, i.e. all 40 `DEFERRED`
   verdicts in `151-DISPOSITION.md` — not only the three quoted below, which are
   examples, not the list.

Three named examples, quoted verbatim from the operator's capture:

- **F-29 — two join-table FKs lack a covering index.**
  `constituency_group_constituencies.constituency_id` and
  `election_constituency_groups.constituency_group_id` are the *trailing* columns
  of the two join tables' composite primary keys. A composite PK indexes its
  leading column only, so the reverse lookup and the `ON DELETE CASCADE` from the
  referenced side are **sequential scans**. Deferred because the fix is a
  migration, and PD-02 makes migrations `[BLOCKING]` on `yarn db:lint:sql`
  exiting 0 — a gate that was red for the unrelated F-21. **F-21 has since been
  DECIDED (option (a): implement the parameters, scheduled after the phase
  ships)**, so F-29's stated blocker is discharged the moment F-21 lands.
  Frontmatter records this as `f_29_unblocked_by`. Gate: `lint-schema.mjs`
  check 0001.

- **F-30 — 22 of 52 triggers use undocumented naming prefixes.**
  `cleanup_*` / `cascade_*` / `check_*`, outside the three prefixes
  `.agents/code-review-checklist.md` names. Usage is *consistent*; it is the
  convention that is undocumented. Two remedies, both the operator's call: a
  migration renaming 22 triggers, or widening the checklist — which is the very
  artifact the phase's 31-item census was measured against, so widening it
  retroactively moves the yardstick.

- **F-32 — `public.storage_config` stores a service-role key in plaintext.**
  `service_role_key` is a plain `text` column read by the pg_net storage-cleanup
  triggers. **Fail-closed today**: RLS on, zero policies,
  `REVOKE ALL … FROM anon, authenticated, public`, `GRANT SELECT … TO service_role`
  only — and `seed.sql:20` seeds the *published* Supabase local-dev demo key, which
  is not a secret. The exposure is prospective: `400-storage.sql:529-531` tells
  operators to "update the `storage_config` table with actual values" in
  production, which puts a live service-role key in a queryable column. Production
  remedy is **Supabase Vault** (`vault.create_secret`) — an architectural change,
  deferred under Rule 4.

## Solution

TBD in detail, but the shape is fixed — a disposition pass, not a fix-what-we-notice pass:

1. **Enumerate before fixing.** For each PR #863–#874, pull every review comment
   (`gh pr view <n> --comments`, plus `gh api repos/:owner/:repo/pulls/<n>/comments`
   for inline threads — the two return different sets). Separate Copilot from
   operator comments; both streams count.
2. **Cross-check against the record.** Reconcile that list with the 40 `DEFERRED`
   rows in `151-DISPOSITION.md`. A finding present in one and absent from the other
   is itself a finding.
3. **Give every item a terminal disposition** — fixed, or consciously re-deferred
   *with the reason and the discharging condition named*. "Still deferred" without
   a named unblocker is not a disposition.
4. **Unblock the DB items first.** F-21 is decided; landing it turns
   `yarn db:lint:sql` green, which un-gates F-29's migration under PD-02. Doing
   F-21 → F-29 in that order avoids the "blocking gate cannot be shown green"
   trap that caused the original deferral.
5. **F-30 needs a decision, not code** — pick rename-migration vs. widen-checklist
   before writing anything.
6. **F-32 is a production-readiness item, not a bug** — it is safe today. Decide
   whether Vault migration blocks the v0.2 tag or is tracked as a release-note
   caveat with a follow-up.

**Do not** treat the three examples above as the scope. They were offered as
illustrations of the class; the scope is all 40 deferrals plus both comment streams.
