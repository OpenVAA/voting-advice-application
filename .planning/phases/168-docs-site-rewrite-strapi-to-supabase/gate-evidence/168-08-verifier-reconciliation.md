# 168-08 — Independent verifier pass: reconciliation (D-09)

## The pass

- **Inputs.** 168-08 Task 1 copied each changed hand-written page (`git diff --name-only --diff-filter=AMR <base>..HEAD -- apps/docs/src/routes`,
  `+page.md|svelte`, generated pages excluded) to a uniquely named file under `.planning/tmp/docs-verify/` and listed the 58 names in
  `MANIFEST.txt`; `SOURCES.tsv` maps each copy to its page. Both are gitignored scratch, not committed.
- **Run.** The orchestrator spawned `gsd-doc-verifier` over all 58 entries at HEAD `6c9117378`, in 8 parallel batches of about 7–8 pages
  (not one agent per page). Each page still has its own result file, `.planning/tmp/verify-<copy>.json`; no result overwrote another.
- **Completeness.** Every manifest entry has a result and every result has `claims_checked > 0` (the smallest is 1, on two Publishers'
  Guide data-collection pages).
- **Totals.** 1022 claims checked, 1022 passed, **0 failures**. No result carries a BLOCKER or a FAIL.

**BLOCKER/FAIL count in the JSON files: 0. Dispositions recorded for BLOCKER/FAIL findings: 0.** The two counts match.

## Caveats the verifiers reported (recorded, not fixed)

1. **Mostly existence and grep checks.** The verifiers checked file paths, `yarn` scripts, symbols, config keys, env vars and anchors.
   Several said they **spot-checked** behaviour claims and prose rather than checking every one. Their `claims_checked` numbers are
   **hand tallies**, not counts produced by a tool.
2. **Runtime flows were not run.** Examples: what `yarn db:reset-with-e2e-data` does at run time, and the semantics of the Deployment
   page's feedback rate limit (five submissions per five minutes per client; the `behind_cloudflare` header choice). These are
   **unverifiable (WARNING)** in the D-09 sense, each with anchors that support it:
   - `db:reset-with-e2e-data`: `168-03-CLAIMS.md` #366 and `168-04-CLAIMS.md` #440 (`package.json`:
     `"db:reset-with-e2e-data": "yarn db:reset-with-data --template e2e/base"`).
   - The rate limit: `168-04-CLAIMS.md` #392–#396 (`apps/supabase/supabase/schema/107-feedback.sql`: `p_max_requests      integer  := 5;`,
     `p_window_secs       interval := interval '5 minutes';`, the `behind_cloudflare` lookup and default).

   `check-claims.mjs ledger` passes all of these rows (below). The D-11 runs in `168-08-d11-runs.md` observed `db:start`,
   `db:seed --template default`, the `yarn dev` start-up and the docs pipeline. `db:reset-with-e2e-data` is destructive (it resets the
   database), so it is not one of the D-11 commands.
3. **One item had no source: the `q-info` / `arg-cond` commit-prefix abbreviations on Contribute.** Resolved below.
4. **The claim ledgers are the anchor-level evidence; the verifier is the independent second look.** The per-plan ledgers
   (`168-03..07-CLAIMS.md`) carry one content-anchored row per command, path, port and flow, and `check-claims.mjs` re-checks them. Re-run
   at 168-08 Task 3 on the final tree, both pass:

   | Command | Exit | Output |
   | --- | --- | --- |
   | `node scripts/check-claims.mjs ledger 168-03-CLAIMS.md 168-04-CLAIMS.md 168-05-CLAIMS.md 168-06-CLAIMS.md 168-07-CLAIMS.md` | 0 | `Claim rows checked: 2176` / `All claim rows pass.` |
   | `node scripts/check-claims.mjs commands <the 83 hand-written pages>` | 0 | `yarn commands found: 201 in 83 page(s)`; 1 skipped placeholder (`yarn workspace <workspace-name> <script-name>` on `development/monorepo`); `All yarn commands resolve.` |

   The `commands` check resolves `yarn workspace …` scripts against each workspace's own `package.json`. That covers the verifier's known
   limit (Pitfall 3: it checks `yarn <script>` only against the root `package.json`). No verifier reported that limit as a failure this time.

## The item with no source: `q-info` / `arg-cond` (Contribute)

**Page:** `/developers-guide/contributing/contribute`, "Commit your update": "`refactor[q-info]: doo bar` (you can use the abbreviations
`q-info` and `arg-cond` for `question-info` and `argument-condensation`)".

**Finding.** The verifier found no source in the tree for the abbreviations.

**Source found, outside the tree: the commit history.** It is a team convention, and no code enforces it:

- No tool checks commit subjects. `.husky/pre-commit` runs only `git update-index -g`, the app-shared build and `lint-staged`, and
  `git grep -i -l commitlint -- ':!.planning' ':!yarn.lock'` finds nothing.
- The history uses the abbreviations consistently. `git log --format=%s | grep -c -E '\[q-info\]'` prints **10** and
  `… '\[arg-cond\]'` prints **14**, while `… '\[(question-info|argument-condensation)\]'` prints **1**. Examples include `33ac49313` `chore[arg-cond][q-info]: fix unit tests`,
  `6eaa0d58d` `refactor[q-info]: …` and `b8943894f` `fix[arg-cond]: …`.
- Both packages still exist under those names: `packages/question-info/package.json` has `"name": "@openvaa/question-info",` and
  `packages/argument-condensation/package.json` has `"name": "@openvaa/argument-condensation",`.
- The sentence is unchanged since the phase base `0ec229dfe` (`git grep -n 'q-info' 0ec229dfe -- apps/docs` returns the same line).

**Disposition: page correct, kept as written.** The package-name expansions are now anchored as `168-07-CLAIMS.md` rows #215–#216, which
`check-claims.mjs ledger` passes. The abbreviation itself is an editorial convention whose evidence is the commit history, so it stays a
recorded **unverifiable (convention)** item, not a fix. No page edit, so no `docs[docs]:` commit was needed.

## Per-page results

Owning ledger per D-19: 03 Backend + Seed data; 04 Quick start, Architecture, Development, Configuration except app-settings,
Deployment, Troubleshooting; 05 Frontend + Localization; 06 Candidate app, Admin app, both app-settings pages; 07 About, landing,
Contributing, Publishers' Guide except app-settings, About these docs.

| Page | Verifier copy (`.planning/tmp/docs-verify/`) | Owning ledger | Checked | Passed | BLOCKER/FAIL | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| `/about/association` | `about__association.md` | `168-07-CLAIMS.md` | 2 | 2 | 0 | none needed |
| `/about/features` | `about__features.md` | `168-07-CLAIMS.md` | 5 | 5 | 0 | none needed |
| `/about/project` | `about__project.md` | `168-07-CLAIMS.md` | 3 | 3 | 0 | none needed |
| `/about/roadmap` | `about__roadmap.md` | `168-07-CLAIMS.md` | 2 | 2 | 0 | none needed |
| `/developers-guide/about-these-docs` | `developers-guide__about-these-docs.md` | `168-07-CLAIMS.md` | 45 | 45 | 0 | none needed |
| `/developers-guide/admin-app` | `developers-guide__admin-app.md` | `168-06-CLAIMS.md` | 22 | 22 | 0 | none needed |
| `/developers-guide/architecture` | `developers-guide__architecture.md` | `168-04-CLAIMS.md` | 40 | 40 | 0 | none needed |
| `/developers-guide/backend/authentication` | `developers-guide__backend__authentication.md` | `168-03-CLAIMS.md` | 55 | 55 | 0 | none needed |
| `/developers-guide/backend/data-import-and-deletion` | `developers-guide__backend__data-import-and-deletion.md` | `168-03-CLAIMS.md` | 14 | 14 | 0 | none needed |
| `/developers-guide/backend/edge-functions` | `developers-guide__backend__edge-functions.md` | `168-03-CLAIMS.md` | 40 | 40 | 0 | none needed |
| `/developers-guide/backend/email` | `developers-guide__backend__email.md` | `168-03-CLAIMS.md` | 18 | 18 | 0 | none needed |
| `/developers-guide/backend/generated-types` | `developers-guide__backend__generated-types.md` | `168-03-CLAIMS.md` | 16 | 16 | 0 | none needed |
| `/developers-guide/backend/intro` | `developers-guide__backend__intro.md` | `168-03-CLAIMS.md` | 30 | 30 | 0 | none needed |
| `/developers-guide/candidate-app/bank-authentication` | `developers-guide__candidate-app__bank-authentication.md` | `168-06-CLAIMS.md` | 38 | 38 | 0 | none needed |
| `/developers-guide/candidate-app/login-and-password-reset` | `developers-guide__candidate-app__login-and-password-reset.md` | `168-06-CLAIMS.md` | 20 | 20 | 0 | none needed |
| `/developers-guide/candidate-app/password-validation` | `developers-guide__candidate-app__password-validation.md` | `168-06-CLAIMS.md` | 24 | 24 | 0 | none needed |
| `/developers-guide/candidate-app/pre-registration-and-invitation` | `developers-guide__candidate-app__pre-registration-and-invitation.md` | `168-06-CLAIMS.md` | 14 | 14 | 0 | none needed |
| `/developers-guide/candidate-app/registration` | `developers-guide__candidate-app__registration.md` | `168-06-CLAIMS.md` | 8 | 8 | 0 | none needed |
| `/developers-guide/configuration/app-customization` | `developers-guide__configuration__app-customization.md` | `168-04-CLAIMS.md` | 5 | 5 | 0 | none needed |
| `/developers-guide/configuration/app-settings` | `developers-guide__configuration__app-settings.md` | `168-06-CLAIMS.md` | 16 | 16 | 0 | none needed |
| `/developers-guide/configuration/environmental-variables` | `developers-guide__configuration__environmental-variables.md` | `168-04-CLAIMS.md` | 30 | 30 | 0 | none needed |
| `/developers-guide/configuration/intro` | `developers-guide__configuration__intro.md` | `168-04-CLAIMS.md` | 3 | 3 | 0 | none needed |
| `/developers-guide/configuration/static-settings` | `developers-guide__configuration__static-settings.md` | `168-04-CLAIMS.md` | 5 | 5 | 0 | none needed |
| `/developers-guide/contributing/ai-agents` | `developers-guide__contributing__ai-agents.md` | `168-07-CLAIMS.md` | 5 | 5 | 0 | none needed |
| `/developers-guide/contributing/code-style-guide` | `developers-guide__contributing__code-style-guide.md` | `168-07-CLAIMS.md` | 22 | 22 | 0 | none needed |
| `/developers-guide/contributing/contribute` | `developers-guide__contributing__contribute.md` | `168-07-CLAIMS.md` | 6 | 6 | 0 | none needed (the no-source `q-info`/`arg-cond` item is settled above: unverifiable convention; rows #215–#216 added) |
| `/developers-guide/contributing/issues` | `developers-guide__contributing__issues.md` | `168-07-CLAIMS.md` | 3 | 3 | 0 | none needed |
| `/developers-guide/contributing/pull-request` | `developers-guide__contributing__pull-request.md` | `168-07-CLAIMS.md` | 5 | 5 | 0 | none needed |
| `/developers-guide/contributing/recommended-ide-settings-code` | `developers-guide__contributing__recommended-ide-settings-code.md` | `168-07-CLAIMS.md` | 2 | 2 | 0 | none needed |
| `/developers-guide/contributing/workflows` | `developers-guide__contributing__workflows.md` | `168-07-CLAIMS.md` | 26 | 26 | 0 | none needed |
| `/developers-guide/deployment` | `developers-guide__deployment.md` | `168-04-CLAIMS.md` | 40 | 40 | 0 | none needed |
| `/developers-guide/development/monorepo` | `developers-guide__development__monorepo.md` | `168-04-CLAIMS.md` | 18 | 18 | 0 | none needed |
| `/developers-guide/development/requirements` | `developers-guide__development__requirements.md` | `168-04-CLAIMS.md` | 14 | 14 | 0 | none needed |
| `/developers-guide/development/running-the-development-environment` | `developers-guide__development__running-the-development-environment.md` | `168-04-CLAIMS.md` | 34 | 34 | 0 | none needed |
| `/developers-guide/development/seed-data` | `developers-guide__development__seed-data.md` | `168-03-CLAIMS.md` | 30 | 30 | 0 | none needed |
| `/developers-guide/development/testing` | `developers-guide__development__testing.md` | `168-04-CLAIMS.md` | 24 | 24 | 0 | none needed |
| `/developers-guide/frontend/components` | `developers-guide__frontend__components.md` | `168-05-CLAIMS.md` | 14 | 14 | 0 | none needed |
| `/developers-guide/frontend/contexts` | `developers-guide__frontend__contexts.md` | `168-05-CLAIMS.md` | 30 | 30 | 0 | none needed |
| `/developers-guide/frontend/data-api-and-adapters` | `developers-guide__frontend__data-api-and-adapters.md` | `168-05-CLAIMS.md` | 48 | 48 | 0 | none needed |
| `/developers-guide/frontend/intro` | `developers-guide__frontend__intro.md` | `168-05-CLAIMS.md` | 40 | 40 | 0 | none needed |
| `/developers-guide/frontend/routing` | `developers-guide__frontend__routing.md` | `168-05-CLAIMS.md` | 30 | 30 | 0 | none needed |
| `/developers-guide/frontend/styling` | `developers-guide__frontend__styling.md` | `168-05-CLAIMS.md` | 8 | 8 | 0 | none needed |
| `/developers-guide/localization/intro` | `developers-guide__localization__intro.md` | `168-05-CLAIMS.md` | 8 | 8 | 0 | none needed |
| `/developers-guide/localization/locale-resolution` | `developers-guide__localization__locale-resolution.md` | `168-05-CLAIMS.md` | 12 | 12 | 0 | none needed |
| `/developers-guide/localization/storing-multi-locale-data` | `developers-guide__localization__storing-multi-locale-data.md` | `168-05-CLAIMS.md` | 6 | 6 | 0 | none needed |
| `/developers-guide/localization/supported-locales` | `developers-guide__localization__supported-locales.md` | `168-05-CLAIMS.md` | 7 | 7 | 0 | none needed |
| `/developers-guide/localization/translations-and-overrides` | `developers-guide__localization__translations-and-overrides.md` | `168-05-CLAIMS.md` | 14 | 14 | 0 | none needed |
| `/developers-guide/quick-start` | `developers-guide__quick-start.md` | `168-04-CLAIMS.md` | 14 | 14 | 0 | none needed |
| `/developers-guide/troubleshooting` | `developers-guide__troubleshooting.md` | `168-04-CLAIMS.md` | 38 | 38 | 0 | none needed |
| `/publishers-guide/app-settings` | `publishers-guide__app-settings.md` | `168-06-CLAIMS.md` | 30 | 30 | 0 | none needed |
| `/publishers-guide/data-collection/data-from-final-election-lists` | `publishers-guide__data-collection__data-from-final-election-lists.md` | `168-07-CLAIMS.md` | 1 | 1 | 0 | none needed |
| `/publishers-guide/data-collection/initial-data` | `publishers-guide__data-collection__initial-data.md` | `168-07-CLAIMS.md` | 1 | 1 | 0 | none needed |
| `/publishers-guide/preparing/candidates-and-parties-data-be` | `publishers-guide__preparing__candidates-and-parties-data-be.md` | `168-07-CLAIMS.md` | 3 | 3 | 0 | none needed |
| `/publishers-guide/preparing/matching` | `publishers-guide__preparing__matching.md` | `168-07-CLAIMS.md` | 6 | 6 | 0 | none needed |
| `/publishers-guide/preparing/the-application-be-hosted` | `publishers-guide__preparing__the-application-be-hosted.md` | `168-07-CLAIMS.md` | 2 | 2 | 0 | none needed |
| `/publishers-guide/preparing/the-statements-or-questions-posed` | `publishers-guide__preparing__the-statements-or-questions-posed.md` | `168-07-CLAIMS.md` | 2 | 2 | 0 | none needed |
| `/publishers-guide/preparing/the-voter-see-when-using` | `publishers-guide__preparing__the-voter-see-when-using.md` | `168-07-CLAIMS.md` | 9 | 9 | 0 | none needed |
| `/` | `landing.md` | `168-07-CLAIMS.md` | 15 | 15 | 0 | none needed |
| **Total: 58 pages** | | | **1022** | **1022** | **0** | |
