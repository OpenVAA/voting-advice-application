---
phase: 189-documentation-and-closure
fixed_at: 2026-11-21T13:18:17Z
review_path: .planning/workstreams/deployment/phases/189-documentation-and-closure/189-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 189: Code Review Fix Report

**Fixed at:** 2026-11-21T13:18:17Z
**Source review:** `.planning/workstreams/deployment/phases/189-documentation-and-closure/189-REVIEW.md`
**Iteration:** 1
**Scope:** all findings, Info and the necessity finding included, following the operator's phase-188 direction ("fix everything")

**Summary:**

- Findings in scope: 8 (CR-01, WR-01 to WR-04, IN-01 to IN-03)
- Fixed: 8
- Skipped: 0

Every fix was made and committed on the main checkout of `feat/deployment-terraform-supabase`. By instruction, no worktree was created. Every gate below ran in the main checkout, so its numbers can be reproduced from this tree. Nothing was pushed. `.planning/workstreams/deployment/config.json` and `.verification-ledger.json` were left unstaged.

## Fixed Issues

### CR-01: The Overview child breaks peer navigation and the active highlight on every page under Deployment

**Files modified:** `apps/docs/src/lib/utils/navigation.ts`, `apps/docs/src/lib/components/NavigationItem.svelte`, `apps/docs/src/lib/utils/navigation.test.ts` (new)
**Commits:** c0075be1c (the fix and its test), 53f41dad9 (joins the new TSDoc's wrapped lines, which the comment-hygiene guard's forced-line-break rule refused)
**Status:** fixed: requires human verification (matching logic; the unit tests run against the real config, but nobody has looked at the rendered site)
**Applied fix:** `findCurrentLeaf` picks the menu leaf that stands for the current page. That is the leaf whose route equals the path or, when no leaf's route does, the leaf with the longest route the path lies below. So a page outside the menu still highlights its nearest leaf, as it did before. `getPeerNavigation` takes its index from that leaf. A sidebar leaf is marked current only through `isCurrentLeaf`, which is true for exactly one leaf in the whole menu. A disclosure still opens on the prefix rule.

The test was written first and failed 5 of its 9 cases on the old code:
- `/developers-guide/deployment/hosted-settings` must have prev Overview and next Operations, and Operations must have prev Hosted settings.
- prev and next are walked over every leaf of every section of the real `navigation.config.ts`.
- a page below Operations but outside the menu resolves to Operations.
- the Deployment disclosure is rendered with `svelte/server` for each of its three pages, and exactly one link may carry `menu-active`.

After the fix all 9 pass.

### WR-01: The env-reference guard checks one direction only and does not read the two `constants` modules

**Files modified:** `apps/frontend/src/lib/server/startup/environmentReference.test.ts`, `apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md`
**Commit:** 4a05fe3b2
**Applied fix:** Every key of `$lib/utils/constants` and `$lib/server/constants` is now a name the page must list.

The reverse check looks at every backticked token that has the shape of a variable name (`^[A-Z][A-Z0-9_]*[A-Z0-9]$`, so a prefix like `PUBLIC_` is skipped) in a table row or list item of the page. Each one must be declared by one of these:
- the required, task, analytics, constants or bootstrap sets;
- an Edge Function's `Deno.env.get('…')` (this source is needed because `SMTP_USER` and `SMTP_PASS` appear in neither template);
- the root `.env.example`;
- the functions' `.env.example`, where commented-out `# NAME=` lines count.

Prose is not checked, so the libpq `PGHOST` … names stay allowed. While any source is unreadable, only the file problem is reported. The page's sentence describing the test now names both directions.

New fixture cases:
- a stale `PUBLIC_BROWSER_FRONTEND_URL` list item;
- a stale table row;
- a constants key the page leaves out;
- template-only and function-only names, which are accepted;
- prefix and prose tokens;
- absent templates.

Red on the real tree: with a stale `PUBLIC_BROWSER_FRONTEND_URL` list item on the page and a new `NEW_SERVER_FLAG` key in the server constants, the repository case failed and named both. Then restored with `git checkout`. The page and the code agree today.

### WR-02: The hosted-settings guard checks neither stale rows nor values, and reads a hand-kept copy of the secret names

**Files modified:** `infra/scripts/hosted-settings-reference.test.ts`
**Commit:** 9c2a24eea
**Applied fix:**
- **Reverse:** every row of the settings table must name a setting the sources yield, or `statement_timeout` (`NON_MODULE_SETTINGS`). A row is a table line whose second cell starts with a backticked token.
- **Values:** each non-object leaf of `hosted-settings.json` and each `optional(number, N)` default of `auth_rate_limits` is compared with the leading backticked tokens of its row's Value cell:
  - a number or boolean as written;
  - a string as itself, with the empty string written as `""`;
  - an array as its items, in order.

  A listed leaf with no row of its own is a problem.
- **Secrets:** names are read from the `{ name = "…" }` entries of `supabase_edge_function_secrets.this`. The `function_secret_names` local must list the same names in the same order.

The fixtures now have the page's three-column shape, and new cases cover each direction. Red on the real tree:
- `max_rows` set to `1000`;
- `rate_limit_token_refresh` defaulting to `200`;
- an extra `SMTP_EXTRA` in the resource only;
- (in a separate run, because a secret mismatch stops the reverse check) `external_apple_enabled` deleted from the JSON while its row stays.

Each was named, and each was restored. The page's values agree with the sources today.

### WR-03: The event-catalogue guard does not tie the "Sensitive" and consent column to `SENSITIVE_EVENTS`

**Files modified:** `apps/frontend/src/lib/analytics/eventCatalogue.test.ts`
**Commit:** f20d1993b
**Applied fix:** `catalogueRows` returns each row's event name and its last cell. The last cell must contain the word `sensitive` exactly when the event is in `SENSITIVE_EVENTS`. A row that disagrees is a problem in either direction. New fixture cases flip one mark each way and check that `sensitive` in another cell does not count. Red on the real tree: adding `menu_open` to the set and removing `answer_delete` named both events. Restored afterwards.

### WR-04: A touched comment block keeps its historical narrative (comment hygiene)

**Files modified:** `apps/frontend/src/lib/server/admin/features/condenseArguments.ts`, `apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts`
**Commit:** a52ee3d83
**Applied fix:** The writer comment is now in the present tense. The job's client renews no session and has no cookie adapter, so it never emits a `Set-Cookie`. So a gateway that times out first cannot lose a renewed session, and a late write such as `insertJobResult` on an aborted job cannot hit the `cookies.set` that SvelteKit makes throw after the response. The open question stays as one line: what a job does when the admin's session expires mid-run. The account of the earlier request-bound writer moved to the commit message.

Three change-narrative clauses in neighbouring comments of the same two files were removed too: "which is the coupling this removes", "the point of the whole change is", "everything else was duplicated verbatim until it moved". These are comment-only changes.

### IN-01: A test fixture still names the deleted `render.example.yaml`

**Files modified:** `scripts/fixtures/assert-test-keys-scope.input.txt`
**Commit:** 649890bf2
**Applied fix:** The directive is now `# @as infra/modules/frontend-service/task-environment.json`. `assert-test-keys-scope.expected.violations` names fixture lines (`input.txt:24: mock issuer`), not the placed paths, so no line there needed changing. `--self-test` passes, 10 of 10. With the line placed under `tests/` instead, it fails on line 24, so the case is still exercised. `git grep render.example` outside `.planning/` now finds nothing.

### IN-02: The bootstrap reader silently skips any `\getenv` that is not in canonical form

**Files modified:** `apps/frontend/src/lib/server/startup/environmentReference.test.ts`
**Commit:** 5230c96ad
**Applied fix:** Every line that begins with `\getenv` is either read as `\getenv <psql variable> <name>` or reported with its line number and text. Fixture cases cover a quoted name, a second meta-command and a missing argument. Red on the real tree: quoting the default-locale read in `infra/scripts/bootstrap.sql` failed the repository case at line 87. Restored afterwards.

### IN-03: Generality without instantiation: the `frontend` Docker stage now has a single consumer (necessity)

**Files modified:** `apps/frontend/Dockerfile`
**Commit:** 4847ca056
**Status:** fixed: requires human verification (a necessity finding: code removed)
**Applied fix:** `production` is now `FROM base AS production` and takes the two `COPY --from=shared` lines itself. The repeated `WORKDIR /opt` was dropped. `AS production`, `CMD` and the working directory are unchanged.

Nothing referenced the `frontend` stage. These were checked: `.github/workflows/*` (`--target production`), `infra/scripts/build-push-image.sh` (`BUILD_TARGET="production"`), `docker-compose.dev.yml` (`target: production`), `packages/dev-seed/tests/ciDockerImageBuildGate.test.ts` (asserts `AS production`), the docs pages and `infra/local/`. `docker build --progress=plain --file apps/frontend/Dockerfile --target production --tag openvaa-frontend:in03 .` from the root exited 0, and the image's CMD was `["node","./apps/frontend/build/index.js"]` with WORKDIR `/opt`. The temporary tag was removed afterwards.

## Gates

All gates ran in the main checkout at `4847ca056`, one after another in the background. Each wrote its own log under `/private/tmp/claude-501/-Users-kallejarvenpaa-Desktop-OpenVAA-voting-advice-application-infra/ecb1568e-fe84-4bc9-b7d4-3eb8f72c7be8/scratchpad/gates/` (`final-*.log`). Every exit status was read from the command itself, never through a pipe.

| Gate | Result |
| --- | --- |
| `yarn lint:check` | exit 0. One warning, in `tests/tests/support/mockOidcIssuerEntry.ts` (an unused `eslint-disable`). That file is untouched by these fixes. |
| `yarn format:check` | exit 0 |
| `yarn workspace @openvaa/docs format:check` | exit 0 |
| `yarn workspace @openvaa/docs test:unit` | exit 0; 9 files, 50 tests |
| `yarn workspace @openvaa/docs check` | exit 0; 0 errors, 0 warnings |
| `yarn workspace @openvaa/docs build` | exit 0 |
| `yarn workspace @openvaa/frontend test:unit` | exit 0; 325 files passed, 1 skipped; 8470 tests passed, 33 skipped |
| `yarn test:unit:infra` | exit 0; 17 files, 458 tests |
| dev-seed `ciDockerImageBuildGate`, `deploymentTemplates`, `analyticsEnvTemplates` | exit 0; 3 files, 45 tests |
| `node scripts/assert-test-keys-scope.mjs --self-test` | exit 0 |
| `yarn assert:comment-hygiene` (also inside `lint:check`) | exit 0; 0 violations |
| `docker build --file apps/frontend/Dockerfile --target production .` | exit 0 |

E2E was not run, by instruction. The only change to code the E2E suite is served is comment-only: the two admin feature modules under `apps/frontend/src/lib/server/admin/features/`. The other frontend changes are unit-test files and the Dockerfile. Nothing under `tests/` or `apps/frontend/src/routes/` changed.

---

_Fixed: 2026-11-21T13:18:17Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
