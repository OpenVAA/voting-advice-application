---
created: 2026-10-02
title: README, code-comment and skill text that the Phase 168 docs writers found contradicted by code (one docs/comment pass)
area: documentation
severity: minor
source: Phase 168 (docs-site rewrite), `## Findings for todos` of 168-03, 168-04, 168-05, 168-06 and 168-07, collected by plan 168-08
related_phase: 168
files:
  - apps/supabase/README.md
  - apps/frontend/src/routes/api/candidate/auth/callback/+server.ts
  - .env.example
  - packages/app-shared/src/settings/staticSettings.type.ts
  - packages/app-shared/src/settings/dynamicSettings.type.ts
  - .claude/skills/components/SKILL.md
  - apps/docs/scripts/tsconfig.json
---

## Why this exists

Phase 168 wrote the docs site from the code and treated README, comment and skill prose as claims to check, not as anchors. Where
that prose disagreed with the code, the docs page states the code's version and the finding was recorded. Phase 168 is docs-only (D-18)
and its writers did not edit READMEs outside the docs workspace, code comments or skills, so these stay for one comment and README
pass. CLAUDE.md findings are in `2026-10-01-claude-md-stale-claims-found-by-docs-rewrite.md`. Every item below was re-checked at the
168-08 HEAD and quotes content anchors.

## README drift

1. **`apps/supabase/README.md` § Tests (168-03 F1).** It says `cd apps/supabase && npx supabase test db     # 11 pgTAP files`. The
   tree has 36 files under `apps/supabase/supabase/tests/database/`, and the workspace script is `test:db`
   (`apps/supabase/package.json`: `"test:db": "supabase test db"`). The docs Testing page uses `yarn workspace @openvaa/supabase test:db`.
2. **`apps/supabase/README.md` § "What `yarn db:lint:sql` does" (168-03 F1).** It says `scripts/lint-schema.mjs` runs "two Supabase
   Splinter-derived advisors: **0013** … ". The script implements three checks, `0013`, `0001` and `9001`
   (`apps/supabase/scripts/lint-schema.mjs`: `9001 Read/write permission separation`).
3. **`apps/supabase/README.md` § Edge Functions (168-03 F5).** It says `invite-candidate` "assigns the `candidate` role". The function
   writes an `(entity, candidate, <id>, editor)` grant, and the role enum has only `admin` and `editor`
   (`apps/supabase/supabase/schema/000-enums.sql`: `CREATE TYPE public.grant_role_type AS ENUM('admin', 'editor');`).

## Code-comment drift (comments only; behaviour unchanged)

4. **The auth callback's docblock (168-03 F4).** `apps/frontend/src/routes/api/candidate/auth/callback/+server.ts` says only the hook's
   client "writes the httpOnly cookies back onto the response". But `apps/frontend/src/lib/supabase/server.ts` sets
   `httpOnly: false, path: '/'` on every auth cookie, deliberately, as its own comment explains. The docblock should say "the session
   cookies".
5. **The `.env.example` `E2E_PROJECT_ID` comment (168-03 F7, 168-04 F3).** It says a live line "would silently re-point
   `yarn db:seed:default` -- and therefore `yarn db:reset-with-data` -- at the E2E project". But the seed CLI constructs
   `new Writer({ allowRemote: values['allow-remote'] === true })` with no project id, and `packages/dev-seed/src/supabaseAdminClient.ts`
   defaults to `this.projectId = projectId ?? TEST_PROJECT_ID;`. Nothing in `packages/dev-seed/src` outside `resolveE2eProjectId`
   reads `E2E_PROJECT_ID`, and the CLI does not call it. The comment looks stale. This was not run, so it is UNCONFIRMED: run
   `yarn db:seed:default` with the line live and see which project receives the rows before rewording it.
6. **`staticSettings.type.ts` `dataAdapter` comment (168-05 F1).** It says "When using the `local` adapter, check also that the
   `LOCAL_DATA_DIR` environment variable is set correctly". That reads as if `type: 'local'` switches the app's data source. It
   switches only the server-side adapter behind `/api/data/[collection]` and `/api/feedback`, and nothing in the app calls those
   routes. The behaviour question is tracked in `2026-08-28-reintroduce-the-local-data-adapter.md`; this item is only the wording.
7. **`results.showSurveyPopup` doc comment (168-06 F10).** `packages/app-shared/src/settings/dynamicSettings.type.ts` says the popup
   needs "the relevant `analytics.survey` settings". There is no `analytics.survey`. The survey settings are the top-level `survey` key,
   and the results layout starts the countdown only when `appSettings.survey.showIn.includes('resultsPopup')`
   (`apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte`).

## Skill drift

8. **`.claude/skills/components/SKILL.md` § "The component listing" (168-07 F1).** It still says "Several sibling `generate:*` scripts
   in `apps/docs/package.json` name files that do not exist; they are filed as a todo, not repaired here". 168-01.1 repaired them
   (`apps/docs/package.json`: `"generate:component-docs": "tsx scripts/generate-component-docs.ts"`), and the todo is closed
   (`.planning/todos/done/2026-08-28-broken-docs-script-references.md`). The skill's quote of the generated index intro is still
   accurate. Run the skill-drift check after editing.

## Tooling

9. **`tsc -p apps/docs/scripts/tsconfig.json --noEmit` fails (168-07 F2).** It reports `TS2307: Cannot find module 'unified'` inside
   `node_modules/mdsvex/dist/main.d.ts`. No gate runs that command (`check`, `lint` and `build` all pass), and the failure predates
   Phase 168. Either add `skipLibCheck` or declare the type dependency, or drop the tsconfig if nothing uses it.

## Recorded with no action (listed so no finding is dropped)

- **168-04 F8.** The old Troubleshooting page's Husky advice (`npx husky install`, editing `.husky/_/husky.sh`) was fixed on the page in
  168-04. It now says `yarn prepare`, matching `package.json` `"prepare": "husky"`. Nothing left to do.
- **168-04 F4.** This was a cross-reference to 168-03 F1, F5 and F6, which are items 1–3 above and item 1 of the CLAUDE.md todo.
