# Phase 172 — Deferred Items

Out-of-scope discoveries logged by executors. Nothing here was fixed.

## From plan 172-04

1. **The header's logout button is never rendered, in the Contestant App or the Admin App.**
   `apps/frontend/src/lib/layouts/main/Banner.svelte` renders it under
   `topBarSettings.current.actions.logout == 'show' && page.data.token`. Both app layouts set
   `logout: 'show'`, but no load in `apps/frontend/src/routes` returns a `token` member
   (`git grep -n -w "token" -- 'apps/frontend/src/routes/**/+layout*.ts' 'apps/frontend/src/routes/**/+page*.ts'`
   finds comments only), so the second operand is always falsy. Observed in a browser on the
   terms-of-use gate and on the contestant home: zero logout buttons inside the header's action row,
   one on the page. Whether the button should come back (keyed on `page.data.session`) or the dead
   branch and the `logout` top-bar setting should go is a product call. It is why 172-04-PLAN.md's
   stated consequence 3 ("the header's logout signs out directly on the gate") has nothing to
   observe.
2. **A click on the login page's "Log in" button before hydration submits the empty login form.**
   `routes/contestant/login/+page.svelte` renders `data-testid="login-show"` inside the `<form>` with
   no `type="button"`, so before the click handler is attached the browser treats it as a submit:
   the action answers 400 (`Candidate login failed: missing email or phone` in the server log) and
   the page comes back in its error state with the form shown. Seen only in a project whose settings
   hide the form behind that button (the `default` dataset; the E2E base shows the form directly),
   and only when a script clicks faster than hydration.

## From plan 172-07

1. **`packages/supabase-types/src/database.overrides.ts` has five `@typescript-eslint/naming-convention`
   findings** (type parameters `F`, `K` and `Row`, on the three helper types above
   `FunctionReturnOverrides`). `yarn eslint` on the file reports them; `yarn lint:check` does not,
   because the package's lint script does not reach the file. None is on a line 172-07 changed.
2. **The hand-written line citations in sections 1 and 2 of
   `packages/supabase-types/RPC-NULLABILITY.md` are stale** against the schema files and
   `src/database.ts` (for example `503-entity-rpcs.sql:58`, `:84`, `src/database.ts:691`). The gate
   compares the RPC and column map only, never a line number, so nothing reports them. 172-07
   corrected the citations of section 3, whose table it had to rewrite, and regenerated the derived
   region, which refreshed the declaration lines of all three RPCs.
3. **The comment above the candidates fixture insert in `00-helpers.test.sql` says `candidate_a2`
   "must stay visible to anon".** `candidate_a2` has no nomination, so no anon policy admits it. The
   sentence was there before this phase and was left as it was.
4. **`tests/tests/setup/perm/perm-closed-project.setup.ts` cites decision ids in its docblock**
   (`162.1 D-21`, `162.1 D-16`), a form the comment-hygiene rule forbids. 172-07 rewrote the last
   sentence of that docblock only.

## From plan 172-08

1. **`scripts/assert-a11y-scan-wiring.mjs` still says the contestant scan project holds 14 scans**, in
   its docblock (twice) and in the message of check 1. The project holds 16 since 172-08. The script
   was left unmodified because 172-08-PLAN.md makes that an acceptance criterion; its four checks do
   not count scans, so nothing is wrong in what it enforces.
2. **The "RANKING CONTRACT" comment in `tests/tests/specs/voter/voter-journey.spec.ts` describes the
   hidden candidate as a card.** It says CA-AA-1 and CA-AA-Hidden carry "full polar-MAX answers" and
   that "Hidden Candidate AA" ranks at "100% match" with one of the two "appearing first in DOM
   order". CA-AA-Hidden is unconfirmed and never in the list (the same step asserts 0 such cards),
   and `e2e/base.ts` gives both rows the `GENERIC` answer set. The comment is not about acceptance,
   so 172-08's sweep left it.
3. **A comment in `tests/playwright.config.ts` says "TWO projects consume the candidate
   storageState"** (`visual-regression` and `contestant-a11y-scan`). A third does:
   `cold-entry-dataroot-contestant` declares `storageState: STORAGE_STATE`. It was so before this
   phase.
4. **`playwright/no-conditional-in-test` and `playwright/expect-expect` are switched off for
   `**/setup/**/*.setup.ts` and `*.teardown.ts`** (`tests/eslint.config.mjs`). A setup body free of
   conditionals is therefore a convention ESLint does not check; 172-08-PLAN.md's criterion "no `if`
   inside either setup body (ESLint passes on the file)" was checked by reading the file, not by
   ESLint.

Item 4 of the 172-07 list above is resolved: 172-08 removed the two decision ids from the docblock of
`perm-closed-project.setup.ts`.

## From plan 172-09

1. **The first attempt of the closing E2E run was red** (`tests/e2e-runs/172/172-09-final`: 77 passed, 9
   failed, 94 did not run) on a dev server that took 161 s to become ready, and the second attempt on the
   same commit, with nothing changed, was green (`172-09-final-r2`: 180 of 180). What slowed the host is
   not identified. Filed as
   `.planning/todos/pending/2026-10-06-172-full-suite-red-on-a-slow-dev-server-start.md`.
2. **`bash .claude/scripts/audit-skill-links.sh database` exits 1** on the phase's start tree and after
   172-09 alike, with the same 31 dangling citations (15 in `SKILL.md`, 5 in `rls-policy-map.md`, 11 in
   `extension-patterns.md`, none in `schema-reference.md`). 172-09-PLAN.md makes exit 0 an acceptance
   criterion; it cannot hold on this tree. The standing todo is
   `.planning/todos/pending/2026-08-28-dangling-schema-citations-database-skill.md`.
3. **`.claude/skills/database/SKILL.md` is stale outside the one statement 172-09 corrected.** Its
   frontmatter description says "17-table", "102 RLS policies" and "a 1086-assertion pgTAP estate"; its
   overview says 97 policies, 264 planned assertions across 11 files and 24 schema files; § _Reviewing
   Database Changes_ item 3 asks every new table for the five-policy pattern and item 13 says nothing
   checks that `migrations/` and `schema/` agree; § _Key Source Locations_ says `migrations/` holds 3
   files. Measured on the applied database and the tree on 2026-10-06: 20 tables in `public`, 104
   policies, 38 pgTAP files with 1385 tests, 27 schema files, one migration file, and a parity gate in
   `lint:check`. 172-09-PLAN.md limits the edit to the grant-model statement.
4. **`.claude/skills/database/schema-reference.md` does not list `admin_jobs` or `feedback`,** two of the
   20 tables in `public`. Its opening sentence now says so.
5. **The docs page `developers-guide/frontend/data-api-and-adapters` names neither `acceptTermsOfUse` nor
   the scoped helper's `upsert`** (172-03's deferred item 1). Nothing it says is false; D-19 names two
   other pages and 172-09 edited those.
6. **`.planning/todos/pending/2026-09-03-datawriter-row-erasure-absorbs-rpc-nullability.md` lists
   `terms_of_use_accepted` among the columns `get_candidate_user_data` returns.** The RPC returns 13
   columns since 172-07 and the override widens four. The todo's point stands for those four.
7. **`172-e2e.sh` has no `--require-project` option** (Phase 171's runner has one). `172-bankauth.sh`
   makes that check itself, from `summary.json`.
