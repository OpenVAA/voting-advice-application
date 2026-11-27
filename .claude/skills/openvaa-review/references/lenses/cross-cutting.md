# Lens: Cross-cutting interactions · ID prefix `XC`

**Applies when** the PR adds or changes a feature that touches any vertical below. That is nearly every feature PR. It is skipped only for pure refactors, styling, docs or test-only changes.

OpenVAA is layered: database (RLS, RPCs) → Edge Functions and SvelteKit server routes → Supabase adapter → contexts → components, across three apps (voter, contestant, admin). It is also cut across by verticals every feature must respect: the project a request is scoped to, who may act, what voters may see, how many elections and constituencies there are, which entity variants exist, the server/client boundary, how contestants arrive, and whether the behaviour should be configurable. Bugs hide in the **combinations**. This lens asks, for each vertical, what the new feature does there, and then which pairs interact.

## List

A matrix with one row per vertical the PR touches: _vertical_ → _how the feature interacts with it_ → _where_ (file:line) → _handled / not handled / N/A_. Leave out verticals that are genuinely N/A, but say in one line why a vertical you might expect is N/A.

When the PR adds or changes an authority check, also list an **authority matrix**: one row per gated operation, one column per layer that reaches it (UI or app gate, SvelteKit server route, RPC, RLS policy, Edge Function), and in each cell the check that layer makes, with file:line.

## Evaluate (criterion slugs)

- `xc-project-scope`: every query is scoped to the project. The adapter takes `PUBLIC_PROJECT_ID` with no fallback, and server code uses the project the request names, never an environment default. A new query that reads rows without a project filter, or that a project id could be swapped into, is `critical`. `yarn assert:project-scoped-queries` is the mechanical half; read the new queries for the rest.
- `xc-authority`: authority comes from the grants model — `user_can` in the database, the grants JWT claim, RLS policies, and for Edge Functions `callerMayOnProject` asked through the caller's own token. Fill the authority matrix and compare its rows:
  - The UI gate, the server route, the RLS policy and the Edge Function must agree. A gate in only one layer is a bypass; two layers that disagree are two sources of truth.
  - An Edge Function refuses before any service-role client exists, and never decides authority by reading the claim in TypeScript.
  - An admin of project A must not be able to act on project B's rows through the new path.
- `xc-visibility`: what voters see follows the all-of rule — the project is open for voters, the nomination is confirmed, and every entity that nomination links is confirmed. A new voter-visible read must go through it. A new per-row publication flag, or a read that checks only one of the three, is `critical`.
- `xc-election-cardinality`: the feature works with one election and with several, with constituency groups, with implied elections, and with an entity nominated in several elections or constituencies. Look for `[0]` on `selectedElections` / `selectedConstituencies`, and for copy that assumes a single election.
- `xc-entity-variants`: candidates, organizations, alliances and factions, and the nominations of each. Does the feature handle every variant it can meet, or silently only candidates? Check switches over entity type for a missing branch.
- `xc-session-ssr`: server-only code stays in `apps/frontend/src/lib/server/`; route guards use `safeGetSession()`; no `load` reads the session (`yarn assert:no-session-in-loads`); adapters are initialised with `init({ fetch })` so they work under SSR.
- `xc-registration-modes`: contestants arrive by invitation, by email registration or through the identity provider (bank authentication), under registration modes set per project and entity type. A change to one path is checked against the others, and against the set-password and address gates the apps apply before protected pages.
- `xc-settings-merit`: does the feature merit its own setting? Work both directions:
  - **Missing setting.** Behaviour a deployment would plausibly want different — something election-specific, a feature some VAAs leave out, copy or a threshold that varies by country — is hard-coded. Name the layer it belongs in: `staticSettings` for deployment-time configuration in code, or `dynamicSettings` / per-project `app_settings` when an admin should change it, and then whether the admin app exposes it.
  - **New setting.** Its default leaves existing projects unchanged, the default is declared in `dynamicSettings.ts`, the publishers' guide documents it, and both apps honour it.
  - A setting with a single value nobody varies is owned by complexity-reuse (`cpx-overbuilt`), not here.
- `xc-combination`: interactions between verticals. Name the specific combination and the concrete failure, e.g.:
  - an organization nominated in two elections, viewed by an anonymous voter in Swedish → which nomination's answers show?
  - a contestant invited to two projects signs in through the identity provider → which project's gate applies?
  - a setting turned off for a project while a contestant has the affected page open → what does the next write do?

  Only raise combinations the PR's code paths actually reach.

Tracking events are owned by the Analytics lens; localization by the i18n lens.

## Where to look

`apps/frontend/src/lib/admin/gates/`, `apps/frontend/src/lib/routes/` (app gates), `apps/frontend/src/hooks.server.ts`, `apps/frontend/src/lib/server/`, `apps/supabase/supabase/functions/send-email/callerAuthority.ts`, `apps/supabase/supabase/migrations/00017_user_can_reads_grants.sql`, `apps/supabase/supabase/migrations/00022_grants_reaching_a_project.sql`, `packages/app-shared/src/settings/`, `.claude/skills/database/rls-policy-map.md`, and the CLAUDE.md sections on project scoping and on the backend auth flow.

## Promote to

`.agents/code-review-checklist.md` § Supabase Backend and § Edge Functions; `.claude/skills/database/SKILL.md`; CLAUDE.md only if a new invariant emerges.
