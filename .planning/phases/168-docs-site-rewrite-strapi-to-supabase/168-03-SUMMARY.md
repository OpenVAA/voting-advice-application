---
phase: 168-docs-site-rewrite-strapi-to-supabase
plan: 03
subsystem: docs-content
status: complete
tags: [docs, supabase, auth, grants, rls, edge-functions, email, dev-seed, supabase-types, claims-ledger]

requires:
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-02: the seven pages at their final URLs with their final H1s, redirect stubs for every absorbed Strapi page"
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-01: validate-links --check/--scope, check-claims.mjs ledger/commands, base-rev.txt"
  - phase: 166-retire-auth-user-id-entity-identity-from-grants
    provides: "grant-only entity identity: caller_entity_ids, ERR_ENTITY_IDENTITY_AMBIGUOUS, idx_grants_one_candidate_editor, invite-candidate writes only the grant, identity-callback finds candidates by grant"
provides:
  - "Backend (Supabase) section written from the code: Backend overview, Authentication and authorisation, Edge Functions, Email, Data import and deletion, Generated types"
  - "Seed data (dev-seed) page: seed.sql baseline, dev-seed commands/options, BUILT_IN_TEMPLATES groups, teardown, test users"
  - "168-03-CLAIMS.md: 15 page verdicts, 404 content-anchored claims (check-claims ledger exit 0), findings F1-F9, sweep-exception record (none)"
affects: [168-04, 168-06, 168-08, 169]

estimate:
  tokens: 70000
actuals:
  tokens: 35089
  tasks: 3
  commits: 3
plan_head_before: 9fe1863ab849ab766926d86012239b001b868ca9
plan_head_after: 70ddd6a7a485eb93204353476d3371defc144849

tech-stack:
  added: []
  patterns:
    - "Claims rows are generated from a (page, kind, claim, anchor file, anchor) list and refused at generation time if an anchor holds a pipe or a backtick, so every row is checker-shaped before check-claims runs"
    - "A negative fact (a route that does not exist, a caller nobody calls) is stated on the page and carried in ## Findings for todos with the grep that proves it, because a content anchor cannot prove absence"

key-files:
  created:
    - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-03-CLAIMS.md
  modified:
    - "apps/docs/src/routes/(content)/developers-guide/backend/intro/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/backend/email/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/backend/data-import-and-deletion/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/backend/generated-types/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/development/seed-data/+page.md"

key-decisions:
  - "Edge Function callers are named as the code has them (the data writer's pre-registration method, the admin writer's sendEmail), even though no route or component calls those methods at this HEAD; the gap is finding F2, not a page claim"
  - "invite-candidate's redirect is stated as /candidate/complete-registration with a note that no page exists there (finding F3), rather than glossed as 'the Candidate App'"
  - "Seed data states yarn db:reset as when seed.sql runs and quotes seed.sql's own header for the first supabase start; CLAUDE.md's 'seeded automatically on supabase start' is recorded as F6, not repeated"
  - "Test credentials from seed.sql (admin@openvaa.test, candidate@openvaa.test, password123) are shown on the Seed data page: they are local-only fixtures already in a tracked file, not secrets"

patterns-established:
  - "Backend pages link the owning schema file on GitHub and summarise; they do not restate every policy or column"

requirements-completed: []

coverage:
  - id: D1
    description: "Backend (Supabase) section and Seed data page written from the post-166/167 code, H1s unchanged, every link/anchor/GitHub path valid"
    requirement: "DOCS-01"
    verification:
      - kind: other
        ref: "yarn workspace @openvaa/docs validate:links --check --scope <each of the 7 routes> (exit 0, 0 findings in all seven classes)"
        status: pass
      - kind: other
        ref: "H1 check: Backend overview / Authentication and authorisation / Edge Functions / Email / Data import and deletion / Generated types / Seed data (dev-seed)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/docs check (653 files, 0 errors, 0 warnings)"
        status: pass
    human_judgment: true
    rationale: "Completeness and accuracy of prose against the code is the 168-08 gsd-doc-verifier's independent pass (D-09); the automated gates prove links, anchors, commands and anchors-in-code, not that every sentence is right"
  - id: D2
    description: "Claims ledger with content anchors for every command, env name, path and flow, re-checked by script; every yarn command resolves"
    requirement: "DOCS-04"
    verification:
      - kind: other
        ref: "node scripts/check-claims.mjs ledger 168-03-CLAIMS.md (exit 0, 404 rows)"
        status: pass
      - kind: other
        ref: "node scripts/check-claims.mjs commands <7 pages> (exit 0, all yarn commands resolve)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No D-21 sweep hit, no docker hit, no D-17 version, no auth_user_id, no key-shaped value on the seven pages; Prettier clean"
    requirement: "DOCS-03"
    verification:
      - kind: other
        ref: "git grep sweeps over the 7 pages (each exit 1 = no hit), docker grep exit 1, eyJ/sb_ grep exit 1, auth_user_id grep exit 1"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/docs exec prettier --check <7 pages> (exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every absorbed Strapi page has a recorded fate (merged/deleted/replaced), and code contradictions are recorded as findings, not fixed"
    requirement: "DOCS-01"
    verification:
      - kind: manual_procedural
        ref: "168-03-CLAIMS.md ## Page verdicts (15 rows) and ## Findings for todos (F1-F9)"
        status: pass
    human_judgment: true
    rationale: "Verdict wording and finding dispositions feed 168-08's ledger and todo reconciliation; a human or the verifier should confirm F2/F3/F7 before they become todos"

duration: 28min
completed: 2026-10-02
---

# Phase 168 Plan 03: Backend (Supabase) and Seed Data Summary

**The six Backend (Supabase) pages and the Seed data page now describe the Supabase backend from its schema, functions and scripts: the two SQL directories and parity gate, grant-only identity through `public.grants`, the access-token hook and `user_can`, RLS and column grants, the three Edge Functions as 166 left them, Supabase Auth and `send-email` mail, the bulk RPCs, `@openvaa/supabase-types`, and the `seed.sql` + `@openvaa/dev-seed` layers. 404 claims are anchored in code and re-checked by script, and every page gate is green.**

## Performance

- **Duration:** about 28 min
- **Started:** 2026-10-02T09:51:09Z
- **Completed:** 2026-10-02T10:19:00Z
- **Tasks:** 3 of 3
- **Files modified:** 8 (7 pages, 1 claims ledger)

## Accomplishments

- **Backend overview** (tracer): Supabase as Postgres + Auth + Storage + Edge Functions in `@openvaa/supabase`. It covers `schema/` against the single generated migration, the schema number ranges derived from the file names, the edit → `schema:regenerate` → `db:reset` → `db:types` sequence, `assert:schema-migration-parity`, project scoping (`public.accounts`/`public.projects`, `open_for_voters`, `PUBLIC_PROJECT_ID`, the adapter's no-fallback throw), pgTAP and SQL lint (including lint-schema's third check, 9001), local ports, and a section map.
- **Authentication and authorisation:** `@supabase/ssr` cookie sessions (`httpOnly: false`, as the code sets it), `safeGetSession`, the PKCE callback route with `verifyOtp`, and the session-only gate in `hooks.server.ts`. Then `public.grants` columns and the role × permission matrix from `grant_role_permissions`, the access-token hook and its config, `user_can`'s verb + reach with its two named exceptions, and grant-only entity identity (`get_candidate_user_data`, `caller_entity_ids`, `ERR_ENTITY_IDENTITY_AMBIGUOUS`, `idx_grants_one_candidate_editor`). It ends with RLS, column grants, storage policies, and where the service-role key is and is not used.
- **Edge Functions:** a caller/check/writes table, the env model (`requireEnv`, `functions/.env.example`, `[edge_runtime.secrets]`, the four twins, `yarn check:env-local`), step-by-step post-166 flows for `identity-callback` (grant lookup, compensating delete) and `invite-candidate` (grant-only write, full rollback), `send-email`, and tests.
- **Email:** Supabase Auth invitation/recovery mail (templates, callback links, redirect allow-list, confirmations, SMTP), `resolve_email_variables` and its placeholders, `send-email` SMTP settings, and reading mail in the local email testing server.
- **Data import and deletion, Generated types, Seed data:** these three pages cover the bulk RPC shapes and their RLS behaviour, and the generated vs hand-kept type files with their nullability gate. They also cover the seed.sql contents and when it runs, the dev-seed commands and options, the `BUILT_IN_TEMPLATES` groups, teardown, and the two seeded test users.
- **Ledger:** 15 page verdicts (7 written + 8 absorbed), 404 claims, findings F1-F9 including `configurable-mock-data.md` satisfied (F9) for 168-08.

## Task Commits

1. **Task 1 (tracer): Backend overview** - `6ee28de2c` (docs). Tracer gate: the verify was re-run on the committed tree (exit 0 / exit 0), then expanded.
2. **Task 2: auth, Edge Functions, email** - `eb3eee08b` (docs)
3. **Task 3: data import, generated types, seed data** - `70ddd6a7a` (docs)

**Plan metadata:** recorded in the docs commit that adds this summary.

## Files Created/Modified

- `apps/docs/src/routes/(content)/developers-guide/backend/intro/+page.md` - Backend overview
- `apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md` - sessions, grants, hook, `user_can`, identity, RLS, storage, service-role key
- `apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md` - the three functions
- `apps/docs/src/routes/(content)/developers-guide/backend/email/+page.md` - Auth email, `send-email`, local mail
- `apps/docs/src/routes/(content)/developers-guide/backend/data-import-and-deletion/+page.md` - bulk RPCs, admin RPC
- `apps/docs/src/routes/(content)/developers-guide/backend/generated-types/+page.md` - `@openvaa/supabase-types`
- `apps/docs/src/routes/(content)/developers-guide/development/seed-data/+page.md` - seed.sql and dev-seed
- `.planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-03-CLAIMS.md` - verdicts, claims, findings, sweep exceptions

## Decisions Made

See `key-decisions` in the frontmatter. In short:

- Negative facts are stated on the page and carried as findings: callers with no live UI (F2), and an invite redirect to a missing route (F3).
- What runs `seed.sql` is stated as the code shows it, and CLAUDE.md's claim is recorded rather than repeated (F6).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 2's prettier verify command ran outside the workspace's paths**
- **Found during:** Task 2 verify
- **Issue:** The Task 2 `<automated>` command passes `apps/docs/…` paths to `yarn workspace @openvaa/docs exec prettier --check`. That command runs in `apps/docs`, so it found no files and exited 2. The `<page_gate>` and the Task 1/3 commands strip the `apps/docs/` prefix.
- **Fix:** Ran the same check with the prefix stripped, as `<page_gate>` specifies (exit 0). No file changed.
- **Verification:** The Task 3 verify, which strips the prefix, passed over all seven pages.
- **Committed in:** n/a (gate invocation only)

**2. [Rule 1 - Accuracy] Several draft sentences were corrected against the code before commit**
- **Found during:** Tasks 1-3 (re-reading each claim's anchor)
- **Issue:** Some draft sentences did not match the code:
  - "lint-schema checks two things" (it checks three).
  - "an entity grant reaches only that entity" (`user_can` has two named branches).
  - "every RLS decision calls user_can" (account reads use `user_has_account_grant`).
  - "grants are written by dev-seed" (dev-seed writes none).
  - "tests import supabase-types" (they do not).
  - "`{{ organization.name }}` is the candidate's party" (it is the nominating organization on the parent nomination).
- **Fix:** Each sentence was rewritten to what the anchor shows.
- **Files modified:** the affected pages, before their task commits

---

**Total deviations:** 2 (1 blocking gate-invocation fix, 1 accuracy correction pass)
**Impact on plan:** None on scope. Only this plan's files were touched.

## Issues Encountered

- None blocking. Findings that look wrong in the code or in other docs are in `168-03-CLAIMS.md` § Findings for todos and were not fixed (D-18):
  - F1/F5: `apps/supabase/README.md` drift (pgTAP count and command, lint checks, "candidate role").
  - F2: `invite-candidate`/`send-email` have no live UI caller. Dormant or unwired is UNCONFIRMED.
  - F3: the invite redirect path has no route. Its effect is UNCONFIRMED.
  - F4: a callback docblock says "httpOnly" while the cookies are not.
  - F6: CLAUDE.md's seeding claim. First-start seeding is UNCONFIRMED.
  - F7: the `.env.example` `E2E_PROJECT_ID` comment looks stale (UNCONFIRMED).
  - F8: dev-seed creates no sign-in users.
  - F9: configurable-mock-data is satisfied.

## Known Stubs

None. Every page is fully written. No placeholder text or TODO was added.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 168-08 can copy the 15 verdicts into `168-DOCS-AUDIT.md`, take F9 to close `configurable-mock-data.md`, and decide which of F1-F8 become todos. The sweep-exceptions table records no hit on these pages.
- 168-06 should read F2, F3 and F8 before writing the Pre-registration/Registration pages. 168-04 should read F7 before writing Environment variables.
- DOCS-01, DOCS-03 and DOCS-04 stay Pending; they are shared with sibling plans.

## Self-Check: PASSED

- FOUND: all 7 pages and `168-03-CLAIMS.md`
- FOUND: commits `6ee28de2c`, `eb3eee08b`, `70ddd6a7a`
- MEASURED: `git rev-list --count 9fe1863ab..HEAD` = 3 before the metadata commit
