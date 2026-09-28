---
created: "2026-09-01T00:00:00.000Z"
title: Admin login route reaches Supabase directly — make it backend-independent behind the adapter
area: apps/frontend/src/routes/admin/login
severity: blocking
source: PR #870 review comment (kaljarv) at apps/frontend/src/routes/admin/login/+page.server.ts:27 — subject re-measured to :22 at HEAD 3c958cccc; filed per Phase 158 decision D-G5 steps 1-2
files:
  - apps/frontend/src/routes/admin/login/+page.server.ts
  - apps/frontend/src/routes/candidate/login/+page.server.ts
  - apps/frontend/eslint.config.mjs
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
related_phase: 158
---

# Admin login: make the sign-in backend-independent

**Filed:** 2026-09-01, during Phase 158. The filename carries `2026-08-28`, the date the review
comments were bucketed in `.planning/PRE-SHIP-REVIEW-TRIAGE.md`; `created` carries the filing date.

**Classification: BLOCKING — and the word is the reviewer's own, not an executor's judgement.** The
comment reads *"Add as a **blocking** follow-up task a way to make this supabase independent in
routes."* `severity: blocking` is the register's existing dialect (it is already in use at
`candidate-journey-135-intermittent.md`), not a field invented for this entry.

## The comment, verbatim

> Add as a blocking follow-up task a way to make this supabase independent in routes. It should be
> handled by the SupabaseAdapter. We can structure the abstracted model on supabase, though. Also,
> add a source test for ensuring that no adapter-specifics find their way into routes, components or
> anywhere not especially allowed, such as the specific adapter's implementation and hand-picked
> locations.

## ⚠ Anchor drift

The review anchor is `admin/login/+page.server.ts:27`. **At HEAD `3c958cccc` line 27 is blank.**

| | Line | Content |
|---|---|---|
| **Review era** (`0a7939aff`) | `:27` | `const { error } = await locals.supabase.auth.signInWithPassword({ email, password });` |
| **HEAD `3c958cccc`** | `:22` | the same call, unchanged |

**Cause of the drift:** `157-17` replaced `logDebugError` with `log.error` (dropping an import) and
`152-14`'s line-break unwrap collapsed the comment blocks above. The call itself is byte-identical.

**Anchor as an expression:** the sole `locals.supabase.auth.signInWithPassword({ email, password })`
in this file.

## The ask has two halves. They have different fates.

### Half (b) — the source test: **DISCHARGED UPSTREAM**

*"add a source test for ensuring that no adapter-specifics find their way into routes, components or
anywhere not especially allowed, such as the specific adapter's implementation and hand-picked
locations."*

This is word-for-word **`REVIEW-ADP-06`** (`.planning/REQUIREMENTS.md:137`), Phase 157's criterion 6,
resolved by decision **D-F4** as an ESLint `no-restricted-imports` block plus a member-access
selector, with an **explicit `files`-scoped allowlist** and enforcement in `yarn lint:check`.

**Measured delivered at HEAD `3c958cccc`:** `apps/frontend/eslint.config.mjs` carries
`ADAPTER_BOUNDARY_ALLOWLIST`, split into an adapter/seam group and a second group of grandfathered
sites, each annotated with its Phase-158 disposition. `157-18-SUMMARY.md` records
`requirements-completed: [… REVIEW-ADP-06]`, and `157-16` shrank the list by one entry with a firing
negative control at the struck path (`eslint-adapter-boundary-guard.test.ts`).

**Nothing is owed on this half. Do not re-implement it.**

### Half (a) — backend independence: **OPEN, and the upstream branch that decides it has resolved**

*"make this supabase independent in routes. It should be handled by the SupabaseAdapter."*

When Phase 158's research was written, this half's fate was conditional on an unresolved Phase 157
question (`157-CONTEXT.md` `<open>` #3): would 157 **grandfather** the eight adapter-leakage sites, or
**drive the allowlist to zero**? The two answers gave opposite outcomes for this entry — grandfathered
meant it stays open, driven-to-zero meant it was discharged with the source test.

**Measured at HEAD `3c958cccc`: 157 GRANDFATHERED it.** This file is entry #6 of the second allowlist
group, at `apps/frontend/eslint.config.mjs:50`, carrying the annotation:

```
// 158-HARD: identical to the candidate login path, and the file a recorded cookie-loss incident was fixed in.
'src/routes/admin/login/+page.server.ts',
```

The group's own header calls the nine entries *"a worklist, not an oversight."*

**So this half is OPEN, it is Phase 158's, and the allowlist entry is the receipt.**

## Current state of the route, measured

`apps/frontend/src/routes/admin/login/+page.server.ts` reaches Supabase at four points:

| Line | Call |
|---|---|
| `:22` | `locals.supabase.auth.signInWithPassword({ email, password })` |
| `:29` | `locals.safeGetSession()` |
| `:36-39` | inline `atob` decode of `session.access_token`, then a role-membership test over `payload.user_roles` |
| `:42` | `locals.supabase.auth.signOut({ scope: 'local' })` |

The role triple at `:39` — `['project_admin', 'account_admin', 'super_admin']` — is **duplicated** at
`apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:194`. There is no
`lib/auth/roles.ts`; `lib/auth/` holds only `getUserData.ts` and `index.ts`.

**Do not create a third copy of that array.** Consume the shared module `158-05` introduces.

## Why Phase 158 files this rather than implementing it here

**Because this plan (`158-08`) declares a dependency on the work that closes it, and cannot both
depend on it and do it.** `158-08` is a records plan: it produces the classification table that makes
the operator's *"implement the blocking ones"* instruction actionable. The implementation is
`158-05`'s — the login collapse, which rewrites both login entry points onto one shared helper and is
where the four Supabase calls above either move behind the adapter or are consciously kept.

Per D-G5's binding reading (NOTES beats box), the blocking item is implemented **within 158/159**.
This entry exists so that the item is findable by anchor and by `severity: blocking` if `158-05`'s
scope changes, and so that its two-halves structure survives beyond the phase.

## Closing condition

This entry is closed when **both** are true:

1. The route no longer contains `locals.supabase.*` — verified by the ESLint guard **firing** at this
   path after `apps/frontend/eslint.config.mjs:50` is struck. Striking the annotation without
   striking the Supabase use is the failure mode `157-16` explicitly avoided, and a stale
   `files`-scoped allowlist **fails open**.
2. The role check reads a shared roles module rather than an inline array, with the
   `supabaseDataWriter.ts:194` duplicate collapsed into it too.

Half (b) is already closed and must not be re-litigated at closing time.

---

## STATUS AT 2026-09-02 — condition 2 discharged, condition 1 open. **ENTRY STAYS OPEN.**

Recorded by `158-05` Task 4, measured on the tree rather than inferred from a plan. `severity:
blocking` is deliberately **unchanged**: one of the two closing conditions is met, which does not
discharge the item.

### Condition 2 — **DISCHARGED by `158-05`**

`apps/frontend/src/lib/auth/roles.ts` now declares `ADMIN_ROLES` and `CANDIDATE_ROLES` exactly once,
each `satisfies ReadonlyArray<Enums<'user_role_type'>>` so a migration rename is a compile error, and
its docblock states that the database's row-level policies are the authoritative boundary and the set
is an app-entry gate. Three consumers read it and none carries a literal array any more:

- `routes/admin/login/+page.server.ts` — via `ADMIN_ROLES` passed to the shared helper
- `routes/candidate/login/+page.server.ts` — via `CANDIDATE_ROLES`, same call
- `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — the `_getBasicUserData` role
  derivation, which held a THIRD copy of BOTH sets (the admin triple this entry names, and the
  candidate pair alongside it), now `hasAnyRole(userRoles, CANDIDATE_ROLES)` / `…, ADMIN_ROLES)`

The claims decode is also collapsed for the two login files, into `readUserRoles`, which fails closed
on a malformed token where the four inline copies threw. The writer's own decode was left in place:
this entry names the role array, and widening the diff further into the adapter was not this plan's.

### Condition 1 — **OPEN, and measured still load-bearing**

The collapse concentrated the Supabase use rather than removing it. Each wrapper hands the helper this
request's own auth surface — `context: { auth: locals.supabase.auth, getSession: locals.safeGetSession }`
— which is exactly ONE `.supabase` member access per file, kept there on purpose: the sign-in must be
issued on the caller's own client so the session cookies land on the caller's response.

Copied verbatim to a non-allowlisted path under `src/routes/` and linted there, the rewritten admin
wrapper still fires the guard (`17:24 error A \`.supabase\` access reaches through the adapter
boundary`), so `apps/frontend/eslint.config.mjs:50` is **not** yet a dormant entry and striking it today
would turn `yarn lint:check` red. The probe file was deleted in the same run.

What did NOT need an entry: `lib/auth/passwordLogin.ts` names an `auth` port structurally rather than a
client, so the shared helper stays outside the allowlist. Whoever closes condition 1 changes the
wrappers' one line and that port's implementation, not the helper's contract — which is what the port
was shaped for.

### Anchor refresh

`apps/frontend/eslint.config.mjs:50` still holds this file's allowlist entry, verbatim. The route's own
line anchors in the table above are **all stale** after the rewrite: the file is 28 lines, its single
Supabase access is the `context:` line, and there is no `atob` decode and no `signOut` call in it any
more. Address the file by the expression, not by line.
