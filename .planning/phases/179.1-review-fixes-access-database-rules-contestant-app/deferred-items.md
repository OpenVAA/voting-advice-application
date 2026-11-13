## Deferred Items

- Two docs sentences say the database does not enforce the answers lock; since 179.1-05 it does
  status: resolved
  **Resolved in:** 179.1-05, commit `73ae79500`, before the plan's close was made again (the first close, kept as `179.1-05-close-pre-spec`, was red on a spec that pinned the old rule).
  **Found by:** 179.1-05, Task 3 (code-review checklist, "repo documentation updated"), while its close run `179.1-05-close` was in flight.
  **What:** migrations `00015` and `00016` make the database refuse every entity-scope write while `access.answersLocked` holds. Two sentences of the developers' guide still state the opposite:
  - `apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md`: "`access.answersLocked` is enforced by the frontend alone. It closes the nomination editor in the same way, and the nominations view then shows a note of its own; the database does not refuse a nomination write for it."
  - `apps/docs/src/routes/(content)/developers-guide/contestant-app/defining-nominations/+page.md`, table "What the database enforces", row "The answers lock, `access.answersLocked`": "**No**: nothing in the database refuses a nomination write for it".
  **How it was settled:** the item was first held back because a docs commit after the close had started would have left that close stale; the close turned out red for another reason (a spec that pinned the old rule) and was made again, so the two sentences were corrected in a docs commit before the second close.

- The developers' guide does not yet say how a page reports a save the answers lock refused
  status: open
  **Found by:** 179.1-06, the code-review checklist ("repo documentation updated"), while its close run `179.1-06-close` was in flight. A docs commit after a close has started leaves that close stale.
  **What:** no sentence is false, but two places describe the lock without the behaviour 179.1-06 added:
  - `apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md`, the paragraph on `access.answersLocked`: it could add that a page opened before the lock came on says that answers are locked when its save is refused, rather than that the save failed. The data writer maps the refusal to `AnswersLockedError` from the answer setters and to the `answersLocked` refusal of `setEntityNominations`, and the question page and the profile page read the page data again after a failed save.
  - `apps/docs/src/routes/(content)/developers-guide/contestant-app/home-and-tasks/+page.md`, § The note: it could add that the question page and the profile page show the note after such a save, and that the nomination editor shows it with the reason `nominationsAnswersLocked` in its message region.
  **Where it fits:** any later plan of the phase that edits either page and closes on a full run after it.

- A docs page and two source comments still say row-level security reads the token's grants
  status: open
  **Found by:** 179.1-07, Task 2 (a search of the docs, the skills and the schema for text describing the old source), while its close run `179.1-07-close` was in flight. A commit under `apps/` after a close has started leaves that close stale.
  **What:** since migration `00017`, `user_can` and `user_has_account_grant` read the caller's rows of `public.grants`. Three texts outside this plan's files still describe the claim as what row-level security reads:
  - `apps/docs/src/routes/(content)/developers-guide/contestant-app/entity-selection/+page.md`, § Grants and the token: "The first two read the entity tables under row-level security, which reads the grants in the access token. A grant written after the token was issued is therefore fully served once the token refreshes. Until then: …", and the closing sentence that a flow granting an entity to a signed-in user "must refresh the session before its first read or write". Now a grant written after the token was issued is listed, read and written at once; only the app-entry gates wait for a refresh.
  - `apps/supabase/supabase/schema/400-storage.sql`, the comment above `storage_path_is_public`'s use ("Not `user_can`: an anon session carries no `grants` claim, so an authority-based allow decision here would deny everything"). The conclusion holds, the reason is now that anon has no `auth.uid()` and so holds no grant row. Tasks 1 and 2 of 179.1-07 may not edit `400-storage.sql`.
  - `apps/supabase/supabase/tests/database/00-helpers.test.sql`, the header of `set_test_retired_claim`: it says `24-legacy-removal.test.sql` compares the retired token with "the view of an authenticated caller carrying no authority claim at all". Since 179.1-07 the file compares it with the same identity's table-projected token. The execution rules forbid editing `00-helpers.test.sql`; reported, not edited.
  **Where it fits:** the docs sentence and the storage comment in any later plan that edits those files and closes on a full run after it. Plans 28–30 did not take them: 179.1-30's file list names only the authentication page, and its `style` commit `e6819f439` reformatted `entity-selection/+page.md` without changing a word. The helper comment stays as it is unless the rule on `00-helpers.test.sql` is lifted.

- `yarn format:check` flags `apps/supabase/supabase/tests/database/53-bulk-import-constituency-links.test.sql`
  status: resolved
  **Resolved in:** 179.1-30, commit `e6819f439` (`style(179.1-30): format the files the format check flags`), Prettier on this file and the three below; formatting only (the four files equal their previous text with whitespace and table-rule dashes removed). `yarn format:check` and the docs workspace's `format:check` exit 0 after it (`tests/e2e-runs/179.1-unit/179.1-30-format-after.log`); the pgTAP file is `ok` in `179.1-30-format-pgtap.log`.
  **Found by:** 179.1-07, a format check run before the docs commit (`tests/e2e-runs/179.1-unit/179.1-07-format-1.log`). The file was last changed by `9a7bae625` and not by this plan; no file this plan changed is flagged. Not one of this plan's gates.

- Seven docs pages still name `/api/auth/callback` as the mailed link's path or as the redirect allowlist's entries
  status: open
  **Found by:** 179.1-13, a search of the tree for the old path after the mails were moved to `/<locale>/auth/confirm` (`git grep -n "api/auth/callback" -- apps/docs`).
  **What:** the mails link to the confirm page, and the local and hosted allowlists admit `/auth/confirm` and `/*/auth/confirm` only. Pages that still say otherwise, under `apps/docs/src/routes/(content)/developers-guide/`:
  - `backend/authentication`, `contestant-app/login-and-password-reset`, `contestant-app/registration` (already listed for plan 30: the callback no longer verifies)
  - `backend/edge-functions` (the mailed link, and the deployment check's allowlist row), `backend/email` (the link of the sign-in and the recovery mail), `contestant-app/bank-authentication` (where the confirmation link lands), `contestant-app/pre-registration-and-invitation` (the link, and the table row of the auth callback's `verifyOtp`)
  - `deployment`: the two redirect URLs an operator allows in the hosted project's Auth URL configuration, and the deployment check's question. This one is operator-facing: a hosted project configured from it would refuse every mailed link.
  **Where it fits:** plan 30 owned `backend/authentication` only (its file list), and resolved it in `fb7eaf072`: the Sessions section now describes the confirm page, and the callback as a route that verifies nothing. The other six pages, `contestant-app/login-and-password-reset` and `contestant-app/registration` among them, are still open, `deployment` first because it is operator-facing: plan 32's review, or any later plan that edits them.

- The entry flow's `signIn` and `registerSignIn` origins and the "email sent" screen's `code` wording have no caller
  status: open
  **Found by:** 179.1-21. With the two sign-in screens' own link requests gone, no screen calls `sendEntryLink` with `origin: 'signIn'` or `origin: 'registerSignIn'` (`git grep -n "origin: '" -- apps/frontend/src ':!*.test.ts'` lists `forgotPassword`, `register` and `registerEmail` only).
  **What:** `EntryOrigin` in `apps/frontend/src/lib/contestant/entryFlow/entryFlow.ts` still lists both, `wordingOf` still answers `code` for `registerSignIn`, and `EmailSentPanel` and the email-sent page still render the `code` wording and its keys; the context's `#requestLink` still asks for a link with a code and no address. The developers' guide's "email sent" section still says that a request made with a code alone names no address. Nothing reaches these paths, and their unit tests still pass. Removing them touches the entry flow's types, the panel, the email-sent page, their tests and the catalogues, which plan 21 did not list.
  **Where it fits:** a later plan that edits the entry flow or the email-sent screen, or the close's review.

- `yarn format:check` also flags `apps/supabase/supabase/functions/account-access/signInLink.test.ts`
  status: resolved
  **Resolved in:** 179.1-30, commit `e6819f439`, with the two docs pages named under **Also**; the `account-access` tests pass after it (7 files, 735 tests, `tests/e2e-runs/179.1-unit/179.1-30-format-account-access.log`).
  **Found by:** 179.1-29, the gate run `179.1-29-docs` (`tests/e2e-runs/179.1-gates/179.1-29-docs/03-format.log`): the format row exits 1 on this file and on `53-bulk-import-constituency-links.test.sql` (above), and on nothing else. The file was last changed by `6b12f3535` (179.1-13), not by plan 29.
  **Also:** `yarn workspace @openvaa/docs format:check` (not a gate row; the root check does not flag them) flags `apps/docs/src/routes/(content)/developers-guide/contestant-app/entity-selection/+page.md` (last changed by `47d887ebf`, 179.1-16) and `…/contestant-app/home-and-tasks/+page.md` (last changed by `a5c1dde19`, 179.1-25).
  **Where it fits:** a formatting-only commit before the phase's closing gate (plan 32), which runs the format row.

## From plan 26 (recorded by the orchestrator)
- **Open-answer-only draft (inferred, not observed).** A draft holding only an open answer that survives the question page (e.g. across a reload) would be written as `{ info }` with no value by a later save on the profile page. The database accepts it and the question still counts as unanswered. The store was left as it is; see 179.1-26-SUMMARY.md.

## From plan 30

- Two lint messages in `apps/frontend/eslint.config.mjs` still name a plan
  status: open
  **Found by:** 179.1-30, Task 3: after its comment rewrite (`77b7fbd7e`) the plan's label search finds 2 lines, not 0, both in the `message` strings of the two clause-2 entries (`ADAPTER_INIT_DECLARATION_SCOPED` and `ADAPTER_INIT_DECLARATION_BROAD`): "reintroduces the two-step construction protocol `157.2-08` deleted". They are code, and the plan's Task 3 changes comments only and checks that it did, so they were left as they are (`tests/e2e-runs/179.1-unit/179.1-30-labels-after.txt`).
  **What:** `src/lib/_guards/eslint-adapter-singleton-guard.test.ts` matches the message by its prefix "An `init` member on an adapter class reintroduces the two-step construction protocol", so the label can go without a test change. The same test file, and the other three `eslint-*-guard.test.ts` files, also carry phase 157 plan labels in their comments; no plan of this phase lists them.
  **Where it fits:** the ship-time hygiene codemod, or a plan that may change code in the config.

- Two source comments still say the mails name the auth callback
  status: open
  **Found by:** 179.1-30, Task 1 (reading the code the docs page describes).
  **What:** the mails link to `/<locale>/auth/confirm` (`LINK_PATH` in `apps/supabase/supabase/functions/account-access/signInLink.ts`), but the header of `apps/frontend/src/routes/api/auth/callback/+server.ts` calls the route "the address a mailed link names", and the TSDoc of `verifyMailedLink` in `apps/frontend/src/lib/server/auth/mailedLink.ts` says "the auth callback, which the mails name, only hands the link to that page". The route now serves only a link that names it. Not this plan's files.
  **Where it fits:** any later plan that edits either file and closes on a full run after it.

- pgTAP file 37 reads the whole acceptances table, so it is red on a database that holds acceptances of other runs
  status: open
  **Found by:** 179.1-30, the pgTAP run made for its formatting commit (`tests/e2e-runs/179.1-unit/179.1-30-format-pgtap.{log,exit,head}`, exit 1): 56 of 57 files `ok`, the formatted `53-…` among them; file 37's test 41 "deleting an auth user removes that user's acceptance and leaves the other user's rows" fails with `have:` three user ids and `want:` one. Observed: the database held two acceptance rows of project `00000000-0000-0000-0000-0000000000e2` (the E2E suite's), written 2026-10-27, before the run; a pgTAP file runs in a transaction that is rolled back, so they are not the test's own. File 37 was not changed by this plan.
  **What:** the assertion aggregates `user_id` over all of `terms_of_use_acceptances` instead of over the fixture's projects, so it passes only on a freshly reset database. The phase's schema plans run `pgtap` after `db-reset`, which hides it.
  **Where it fits:** a plan that edits `37-terms-of-use-acceptances.test.sql` (scope the aggregate to the fixture's users or projects), red-first under the schema cycle.

## From plan 31

- CI's E2E run on the evidence tree is red on the scan `contestant-nav-reason-open` (2 failed, 392 did not run)
  status: open
  **Found by:** 179.1-31, Task 3, reading the `e2e-tests` job (id `123355279307`) of run `40846531438` on `ci-evidence/179.1-e4` (evidence commit `c7eb9a537`, the tree of `754a30b1f` without `.planning/`); recorded in `179.1-CI-E4.md` § *Why the job failed*.
  **What:** the preflight passed (the dev server's 500 of `2026-09-03-ci-e2e-ssr-500` did not recur in this run), and Playwright ended 249 passed, 2 failed, 392 did not run. Both failures, light and dark, are `tests/tests/specs/a11y/contestant-a11y.spec.ts:323`, the `reach` of the scan `contestant-nav-reason-open` (plan 23): `expect(getByTestId('contestant-entity-selection-group').last()).toHaveAttribute('data-entity-type', 'organization')` failed with `Timeout: 5000ms`, `element(s) not found`; the 392 are the projects behind `contestant-a11y-scan`. The same scan passes on this host (e.g. the held run `179.1-27-held-bind`, 643 of 643, ledger row `27-3`). The uploaded run directory holds no Playwright error context or trace, so the page the step saw is not known. Hypothesis, UNCONFIRMED: the step waits with the default 5000 ms `expect` timeout where the steps around it wait `TIMEOUTS.slowPage`, and CI's runner is several times slower than this host.
  **Where it fits:** before the phase's close (CLAUDE.md's E2E rule counts a red CI run, and its did-not-run tests, as failures): read the job's Playwright error context first (upload `tests/playwright-results/` with the run directory, or reproduce under CI's slowness), then fix red-first. Not E4's verdict: the wrapper printed both E4 lines before Playwright started.

- The Admin App's login page has a first-level heading that cannot take focus, so the post-navigation focus reset does nothing there
  status: open
  **Found by:** 179.1-33, Task 1, when `waitForNavigationFocusReset` timed out on that page in `tests/e2e-runs/179.1-e2e/179.1-33-red-admin-r2`.
  **What:** `apps/frontend/src/routes/admin/login/+page.svelte` supplies a `heading` snippet whose `<h1>` has no `tabindex="-1"`, where the Contestant App's login page has one and `MainContent`'s default heading has one. The timeout was observed; that the missing attribute causes it is inferred from reading the markup, and was not re-tested. A keyboard or screen-reader user arriving there is not moved to the heading (WCAG 2.4.3).
  **Where it fits:** a later plan that edits the admin login page. 179.1-33 kept to its scope and worked around it in its fixture.

- The visual project's tolerance cannot see a new header icon, and a re-capture of the two voter baselines differs from them
  status: open
  **Found by:** 179.1-33, Task 1, `tests/e2e-runs/179.1-visual/179.1-33-before-r2` (exit 0 against the old baselines, with the button rendered) and the pixel comparison under `tests/e2e-runs/179.1-visual/179.1-33-diff/`.
  **What:** `toHaveScreenshot` in `tests/playwright.config.ts` allows `maxDiffPixels: 200` and `maxDiffPixelRatio: 0.01`. The Log out icon is 100 differing pixels, inside both. Separately, a re-capture differs from `voter-results-desktop.png` and `voter-results-mobile.png` by 431 pixels, all in the search field's placeholder, also inside the tolerance. Why that text renders differently was not examined. The plan restored those two images as it requires.
  **Where it fits:** the next deliberate re-baseline of the voter images, and any decision to tighten the tolerance.

- The generated page of `EntitySelector` holds the docblock as it was before plan 34
  status: resolved
  **Resolved in:** 179.1-40, commit `140281c11`, by `yarn workspace @openvaa/docs generate:docs`, with the diff read; a second generation changes nothing.
  **Found by:** 179.1-34, walking the checklist.
  **What:** `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entitySelector/EntitySelector/+page.md` still reads the sentence on native radios from before the docblock changed. Plan 34 lists no docs file, so it was not regenerated.
  **Where it fits:** plan 40, with its gate rows, by `yarn workspace @openvaa/docs generate:docs`, reading the diff.

- The close the rules give for the gap-closure plans writes no `command` record, which the `e2e` verdict requires
  status: open
  **Found by:** 179.1-34, Task 2, `tests/e2e-runs/179.1-e2e/179.1-34-close.verdict-no-command.txt`.
  **What:** the rules run `tests/scripts/e2e-run.sh` directly for a close; `<run dir>/command` is written only by `179.1-e2e.sh`; and `179.1-verdict.mjs e2e` fails without it. Plan 33 passed by the `control --full` form, which does not read it and now refuses a committed tree. Plan 34 derived the file from the run's own log by the driver's own `grep` and `sed`.
  **Where it fits:** the orchestrator, before the close of plan 35: the rules gain that line, or the closes go through `179.1-e2e.sh`, whose guard now accepts the tree.

- A function binding's setter on `Input`'s value runs when the input mounts, so it cannot clear an error
  status: open
  **Found by:** 179.1-35, Task 1: `bind:value={() => password, handlePasswordEdited}`, as the plan wrote it, cleared the error a caller had set before the first paint (`PasswordSignIn.svelte.test.ts`, four cases red). Observed: `ensureValue`'s `value ??= ''` compiles to `value(value() ?? '')` (a compile of that one line with this repo's Svelte, 5.57.1), which calls the setter whatever the value is.
  **What:** the sign-in form uses a plain `bind:value`, and `Input`'s own `handleInput` clears the bound error on an edit. A caller whose setter does more than store the value is called at mount.
  **Where it fits:** plans 36 and 37, whose callers move next. `ensureValue` was not changed: it serves every kind.

- The generated pages of `Input` and `PasswordSignIn` hold the docblocks as they were before plan 35
  status: resolved
  **Resolved in:** 179.1-40, commit `140281c11`, by `yarn workspace @openvaa/docs generate:docs`, with the diff read; a second generation changes nothing.
  **Found by:** 179.1-35, walking the checklist.
  **What:** `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/` holds the old sentences, and `Input`'s page has no `password` kind. Plan 35 lists no docs file, so they were not regenerated.
  **Where it fits:** plan 40, with its gate rows, by `yarn workspace @openvaa/docs generate:docs`, reading the diff.

- An `Input` of the `select-multiple` kind logs an unhandled `TypeError` from its `$effect` in a contestant question page
  status: open
  **Found by:** 179.1-35, reading `tests/e2e-runs/179.1-e2e/179.1-35-green/devserver.log`: `Cannot read properties of undefined (reading 'map')`, `in $effect`, `in Input.svelte`, `in QuestionInput.svelte`, at the `select-multiple` effect. It is there twice in that run and twice in `179.1-34-close`, so plan 35 did not cause it. The suite stays green with it. That the cause is `value` being undefined while `options` is set, with `ordered` on, is inferred from reading the effect, and was not re-tested.
  **Where it fits:** a later plan that edits `Input`'s `select-multiple` effect, red-first.

- The focus ring of the password kind's toggle is cut at the top and the bottom by its row
  status: open
  **Found by:** 179.1-35, a look at the sign-in screen (`tests/e2e-runs/179.1-e2e/179.1-35-look-desktop-toggle-focused.png`, and the numbers in `179.1-35-look/stdout.log`). The toggle is as tall as the row, 44 px, the ring is drawn outside it with a 2 px offset, and the row is `overflow-hidden`, so only the left and right strokes show. The focus can still be seen; the screenshot is what shows it. The masked text also runs up to the toggle's left edge, with no gap.
  **What:** nothing was changed: the plan's close was already green, and a change here reaches every password field. No test asserts the ring.
  **Where it fits:** plan 36 or 37, which render the kind on more screens, or the operator's UAT of this form.

- The generated page of `PasswordSetter` holds the docblock as it was before plan 36
  status: resolved
  **Resolved in:** 179.1-40, commit `140281c11`, by `yarn workspace @openvaa/docs generate:docs`, with the diff read; a second generation changes nothing.
  **Found by:** 179.1-36, walking the checklist.
  **What:** `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/` has no `onShadedBg` on that page, and its Accessibility section still describes the old fields. Plan 36 lists no docs file, so it was not regenerated.
  **Where it fits:** plan 40, with its gate rows, by `yarn workspace @openvaa/docs generate:docs`, reading the diff.

- The generated docs still list the deleted password component
  status: resolved
  **Resolved in:** 179.1-40, commit `140281c11`, by `yarn workspace @openvaa/docs generate:docs`, with the diff read; a second generation changes nothing.
  **Found by:** 179.1-37, walking the checklist, as its plan expects.
  **What:** `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md` still lists `PasswordField`, and its own page is still under `generated/contestant/components/passwordField/`. Its links point at source files that no longer exist. Plan 37 lists no docs file, so they were not regenerated.
  **Where it fits:** plan 40, with its gate rows, by `yarn workspace @openvaa/docs generate:docs`, reading the diff and confirming the page is gone.

- A comment in the Admin App's auth setup says the password's test id comes from its component
  status: open
  **Found by:** 179.1-37, reading the file its Task 1 names.
  **What:** `tests/tests/setup/admin/admin-auth.setup.ts`, the `reason:` comment above the two locators, says "the shared test id its component DOES carry". The admin login page now gives the kind that id. The selector and the sign-in are unaffected, and the same sentence in `adminLoginPage.fixture.ts` was corrected. Plan 37 does not list the setup file, so it was left.
  **Where it fits:** any later plan that edits that file, or the ship-time hygiene pass.

- The Admin App's login shows two shapes in one form until phase 179.2 moves its email
  status: open
  **Found by:** 179.1-37, by its ruling that the email stays a native input.
  **What:** the password is now a row with its label in it, on a shaded page; the email is still a native input whose label is hidden and whose placeholder names it. That is read from the markup; no image was taken.
  **Where it fits:** phase 179.2, which edits that page next.

- No axe scan reaches the Admin App's login page
  status: open
  **Found by:** 179.1-37, walking the checklist: `git grep -E "AdminAppLogin|admin/login" -- tests/tests` finds no hit under `specs/a11y`, only `admin-access.spec.ts`, `perm-closed-project.spec.ts` and the admin fixture and setup. The password kind now renders there on `bg-base-300`, so the row's contrast on that page is not measured by any run.
  **Where it fits:** phase 179.2, which edits that page next, or the operator's UAT of the toggle's focus ring.

- Two intermittent client errors appear in the dev-server log of some green runs
  status: open
  **Found by:** 179.1-37, reading `tests/e2e-runs/179.1-e2e/179.1-37-close/devserver.log`.
  **What:** `TypeError: Cannot read properties of undefined (reading 'length')` from `DataRoot.provideData`, called from `provideConstituencyData`, and `Error with reloadEntityData: Failed to load entity data: TypeError: Failed to fetch`. Counts (`length`, `reloadEntityData`): `179.1-34-close` 0, 1; `179.1-35-close` 0, 0; `179.1-36-close` 1, 2; `179.1-37-green` 0, 0; `179.1-37-close` 1, 1. The first three runs predate this plan's change, so it did not introduce them; neither was diagnosed, and every one of those runs is green.
  **Where it fits:** a later plan that edits the data loading, red-first once the cause is known.

- The generated pages of `Input` and `ImagePart`, and of `Icon` if it lists its names, hold what they held before plan 38
  status: resolved
  **Resolved in:** 179.1-40, commit `140281c11`, by `yarn workspace @openvaa/docs generate:docs`, with the diff read; a second generation changes nothing.
  **Found by:** 179.1-38, walking the checklist.
  **What:** `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/` has no `imageAction` on `Input`'s page and no action on `ImagePart`'s. Plan 38 lists no docs file, so they were not regenerated. Whether `Icon`'s page lists the icon names was not read.
  **Where it fits:** plan 40, with its gate rows, by `yarn workspace @openvaa/docs generate:docs`, reading the diff.

- No run is known to scan the Trash with axe
  status: open
  **Found by:** 179.1-38, walking the checklist.
  **What:** the profile page is scanned (`cand-profile`, and the organization scans in `perm-organization-editing.spec.ts`), but the Trash renders only while an image is shown, and nothing in those scans' steps puts an image there on purpose. Whether a stored image happens to be there when a scan runs was not established. So the Trash's contrast rests on the debug session's probe of an injected element (7.1:1 light, 6.04:1 dark), and not on a scan of the component.
  **Where it fits:** a later plan that edits the profile's scans, or the operator's UAT of G-179.1-8.

- A one-project red control in `contestant-journey` stops the whole perm family
  status: open
  **Found by:** 179.1-38, `tests/e2e-runs/179.1-e2e/179.1-38-red-2` (exit 1, 1 failed, 131 did not run, verdict FAIL, kept).
  **What:** `data-setup-perm-1e1cg1co` depends on `contestant-journey`, and every perm project chains from it, so a `--project perm-*` run pulls the journey in. A held red step in the journey's spec keeps a perm project from running at all. A plan that holds red steps in both needs the journey's step out of the tree for the perm control, as `179.1-38-red-2-r2` did.
  **Where it fits:** any later plan that pairs the two, plans 39 and 40 included if they do.

- The header's Log out looks blue in the contestant-preview baselines, while the code passes `color="warning"`
  status: open
  **Found by:** 179.1-39, reading the four visual baselines.
  **What:** in `contestant-preview-desktop.png` and `contestant-preview-mobile.png`, last changed by `9db8b555d`, the Log out icon at the top of the page looks blue. `apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte` passes `color="warning"` to `Button`, and `Banner.svelte` passes no colour of its own. The colour was judged by eye from the image: no pixel was measured, and neither the live button nor the reason was examined. That the visual tolerance would pass such a difference is inferred from the 100 differing pixels of the item on the tolerance above.
  **Where it fits:** plan 40's visual run, or the next deliberate re-baseline of those images.

## From plan 40

- Plan 40's zero-budget measurement of the visual project: the Log out item and the voter placeholder item above
  status: open
  **Found by:** 179.1-40, two measurement-only overlays of the shipped config beside its gate run `tests/e2e-runs/179.1-visual/179.1-40-observe`, which exited 0.
  **What:** at the shipped `threshold` with `maxDiffPixels: 0` (`179.1-40-measure`), 8 of 8 passed. At `threshold: 0` as well (`179.1-40-measure-t0`), the two contestant-preview images passed, so the live header matches its baselines pixel for pixel, and the two voter images failed with 431 differing pixels each, in the same boxes plan 33 recorded: x 492..597, y 635..648 on desktop and x 150..255, y 672..685 on mobile. So the placeholder item recurs, and is unchanged. Why that text renders differently was not examined. Why the Log out icon looks blue was not examined either; what is known is that the live page draws what the baseline holds.
  **Where it fits:** the next deliberate re-baseline of the voter images; the Log out colour with the operator's UAT.

- `generate:component-docs` writes only to a temporary directory, so the plan's verify stage on it cannot see drift
  status: open
  **Found by:** 179.1-40, Task 3: the plan's command exited 0 and changed nothing tracked, because the pages reach the tree through `move-generated`, which only `generate:docs` runs. The plan's verify still holds `generate:component-docs` followed by `git diff --quiet HEAD -- apps/docs`, which that command can never turn red. The real check was made by `generate:docs` on the committed tree (`tests/e2e-runs/179.1-unit/179.1-40-docs-gen-4.log`, exit 0, `git diff --quiet HEAD -- apps/docs` exit 0).
  **Where it fits:** any later plan or gate that means to hold the generated docs to the components.

- Plan 33's kept host log holds the local stack's keys
  status: open
  **Found by:** 179.1-40, before writing its own host recipe: `tests/e2e-runs/179.1-visual/179.1-33-host.log`, one line, matched by the forms of a JSON web token and an `sb_secret` key. Only the forms were printed, not the values. `yarn db:reset` runs `yarn db:start`, and `supabase start` prints the stack's status when it is called. The directory is gitignored and nothing under `tests/e2e-runs/` is deleted, so it was left. Plan 40's recipe passes the reset through `tests/scripts/withhold-stack-keys.mjs`, and its log has no such line. Whether the values are this stack's local defaults was not established.
  **Where it fits:** the operator's decision on that one file; the visual recipe in the execution rules, which does not name the filter for the reset.

## From plan 42

None of these is fixed by plans 41 or 42.

- WR-01: the password kind, once revealed, is an ordinary text field for spellcheck and mobile keyboards
  status: open
  **Found by:** the code review of plans 33 to 40, `179.1-GAPS-REVIEW.md`.
  **What:** `apps/frontend/src/lib/components/input/Input.svelte`, the `password` kind: the toggle turns the control into `type="text"`, and it carries no `spellcheck`, `autocapitalize` or `autocorrect`; no password caller passes them (`PasswordSignIn`, `PasswordSetter`, the Admin App's login page). While revealed, a browser's cloud spellcheck can receive the password, and a phone keyboard can capitalise or correct what is typed, so the stored password differs from the one meant. **How far confirmed:** the markup is confirmed by reading; the browser effects are known platform behaviour and were not exercised.
  **Where it fits:** a later plan that edits the `password` kind of `Input`: the three attributes, with a case in `Input.password.svelte.test.ts`.

- WR-02: after the Trash, choosing the same file again does nothing
  status: open
  **Found by:** the code review of plans 33 to 40, `179.1-GAPS-REVIEW.md`.
  **What:** `apps/frontend/src/lib/components/input/parts/ImagePart.svelte`, with `Input.svelte` and the profile page's `handleImageRemove`: the hidden file input keeps its selection, because nothing clears its value after a file is read or the image is removed. A user who picks a file, presses Trash and picks the same file again gets no `change` event, so nothing happens and no message appears. It affects a file chosen during the same mount. **How far confirmed:** the missing reset is confirmed by reading; the missing event is the platform's rule and was not run.
  **Where it fits:** a later plan that edits `ImagePart`: clear the input before the dialog opens, on both the click and the keyboard path.

- WR-03: a revealed password is never masked again, even after `reset()` or when the control is disabled
  status: open
  **Found by:** the code review of plans 33 to 40, `179.1-GAPS-REVIEW.md`.
  **What:** `apps/frontend/src/lib/components/input/Input.svelte`, `passwordRevealed`, which has one writer, the toggle; `PasswordSetter.svelte` `reset`; the settings page. After a saved password `reset()` empties the fields and leaves them revealed, so the next password typed there shows in clear. A control disabled while revealed shows the password with its toggle disabled too. **How far confirmed:** by reading. The disabled half is latent: no caller disables a password field today, and the unit test checks the disabled state only while masked.
  **Where it fits:** a later plan that edits the `password` kind: mask whenever the control is disabled, and a `conceal()` that `PasswordSetter.reset()` calls on both fields.

- WR-04: the E2E step "past the count, the user is still signed in" cannot fail
  status: resolved
  **Resolved in:** 179.1-44, commit `584235657`: the step and test 1's step past the count now make a round trip the page must finish, `expectStillSignedIn`, then `expectNoSignOutRequest`. Shown by the mutation `179.1-44-mut-count`, a live count, red on both steps with `Expected: 200`, `Received: 303` in `expectStillSignedIn` (ledger row `44-13`). `expectNoSignOutRequest` stopped behind that line and was not seen red.
  **Found by:** the code review of plans 33 to 40, `179.1-GAPS-REVIEW.md`.
  **What:** `tests/tests/specs/contestant/contestant-entity-selection.spec.ts`, the step of that title, after `advancePastModalCount`: the timer fires, and the two assertions read a page that has not yet changed, while a logout that timer started would still have to post and navigate. So a live count would pass this step. Ledger row `33-5` shows the red control stopped earlier, at `expectDialogClosed`, so the step has never been seen red. The behaviour is pinned by a unit case in `LogoutButton.svelte.test.ts`; the fault is the spec's claim, not the product. **How far confirmed:** by reading; that a live count would pass is inferred from the ordering and was not run.
  **Where it fits:** a later plan that edits this spec: count the requests to the logout route across a round trip the page must finish, or delete the step and let the unit case carry it.

- IN-01: `handleLogout` still closes the modal twice, the fault its neighbouring comment warns about
  status: resolved
  **Resolved in:** 179.1-44, commit `584235657`, on the logout's path: `leave()` in `LogoutButton.svelte` closes the modal only while it is open, and `afterNavigate` does the same. `ModalContainer.handleClose` stays as it was, not idempotent, so another caller of it can still close a modal twice.
  **Found by:** the code review of plans 33 to 40, `179.1-GAPS-REVIEW.md`.
  **What:** `apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte` `handleLogout` and `modalOpen`, `TimedModal.svelte`, `ModalContainer.svelte` `handleClose`, which is not idempotent. On the count's path `TimedModal` closes the modal, then `handleLogout` closes it again. With a successful logout the button is unmounted and this does not matter; if the sign-out fails and the button stays mounted, a second close after the transition has ended loses the `hidden` class. **Its reach also includes** a refused prompt at the count's end, a state plan 41's ruling 2 keeps possible: a guard that becomes active behind the modal makes `logout` ask, and a refusal leaves the button mounted. **How far confirmed:** by reading; the visible effect is UNCONFIRMED, since a closed `<dialog>` may show nothing anyway.
  **Where it fits:** a later plan that edits `ModalContainer`: `handleClose` returns when the modal is not open, and `modalOpen` and its comment go.

- IN-02: the Trash leaves a stale file error on the field
  status: open
  **Found by:** the code review of plans 33 to 40, `179.1-GAPS-REVIEW.md`.
  **What:** the profile page, `handleImageRemove` and its image `Input`: after an oversize or invalid pick the field's error stays when the image is removed. Only a later successful pick clears it, and the page does not bind `error`. **How far confirmed:** by reading; not run.
  **Where it fits:** a later plan that edits the profile page: bind `error` on this `Input` and clear it in `handleImageRemove`.

- IN-03: two translation keys have no reader
  status: open
  **Found by:** the code review of plans 33 to 40, `179.1-GAPS-REVIEW.md`.
  **What:** `apps/frontend/messages/en/components.json`, `components.passwordInput.password` and `components.passwordInput.placeholder`: neither is read anywhere in `apps/frontend/src` outside the generated key list. `placeholder` lost its reader with `PasswordField`. **How far confirmed:** by a search; only the English catalogue was opened.
  **Where it fits:** a later plan that may edit the catalogues, in every locale. Plan 42 adds and edits no message key.

- IN-04: a test-credentials comment now undercounts
  status: open
  **Found by:** the code review of plans 33 to 40, `179.1-GAPS-REVIEW.md`.
  **What:** `tests/tests/utils/testCredentials.ts`, the **logout** item of the header: it says "the one spec case that signs out", and more cases than one now sign this user in. The order is safe: the project is `fullyParallel: false`, and the case that revokes this user's grant runs last of them. **Plan 41 makes it staler:** its cases sign `TEST_MULTI_ENTITY_EMAIL` in through the form as well and sign that session out, beside the **multi** item's statement that a spec signing the stored session out would end it for every reader; a local sign-out leaves that stored session alone (179.1-41's ruling 8). **How far confirmed:** by reading.
  **Where it fits:** any later plan that edits that file, or the ship-time hygiene pass: say "the spec cases that sign out", and name the form sign-ins of the multi-entity user.

- IN-05: why the header's Log out looks blue
  status: open
  **Found by:** the code review of plans 33 to 40, `179.1-GAPS-REVIEW.md`.
  **What:** `apps/frontend/src/lib/layouts/main/Banner.svelte`, the rule `.vaa-basicPage-actions > button:not([disabled])`, and `LogoutButton.svelte`: the rule sets `color: var(--headerIcon-color)`, which is `--color-primary`, on every enabled button directly in the actions container, and it is unlayered, so it beats the `text-warning` that `color="warning"` produces. **This answers the open item of plan 39 on the same colour**, "The header's Log out looks blue in the contestant-preview baselines", and plan 40's measurement above. **How far confirmed:** by reading the CSS; computed styles were not measured.
  **Where it fits:** the operator's UAT decides the colour: `!text-warning` on both header logout buttons, or drop the unused `color` there.

- IN-06: the border check's colour-scheme loop proves nothing
  status: open
  **Found by:** the code review of plans 33 to 40, `179.1-GAPS-REVIEW.md`.
  **What:** `tests/tests/fixtures/contestant/contestantNominationEditor.fixture.ts` `expectParentRadiosBordered`: it checks only `border-top-width`, which no colour scheme changes, so the second pass adds nothing, and it skips the reload that `inEachColourScheme` in `contestantHomePage.fixture.ts` says emulation needs. The colour comes from `radio-primary`, so no current defect follows. **How far confirmed:** by reading.
  **Where it fits:** a later plan that edits that fixture: assert `border-top-color` and reload after each change of scheme, or drop the loop and the words "both colour schemes" from the test's title.

- IN-07: the comment on the longer wait gives a cause the record does not support
  status: open
  **Found by:** the code review of plans 33 to 40, `179.1-GAPS-REVIEW.md`.
  **What:** `tests/tests/setup/shared/registerAndStoreSession.ts`, the comment above `TIMEOUTS.slowPage`: it justifies the wait by uncompiled routes, while `.planning/todos/pending/2026-11-01-e2e-intermittent-slow-first-route-load.md` says the cause is unconfirmed and that the raised wait still timed out in `179.1-39-green`. The code is otherwise sound. **How far confirmed:** by reading the comment and the todo.
  **Where it fits:** with that todo: the comment states only what is known and names the open cause, or the two are resolved together.

- `AdminLogoutButton` signs out through the admin context and then navigates, and its failure's message comes from the admin layout; phase 179.2 must bring a modal of its own if it mounts a guard
  status: open
  **Found by:** 179.1-41's ruling 6, and 179.1-42 on its read; reworded by 179.1-46 and 179.1-50.
  **What:** **Read:** `apps/frontend/src/lib/dynamic-components/logoutButton/LogoutButton.svelte` `handleLogout`, which awaits the admin context's `logout` and then `goto`, and asks nothing. Since 179.1-49 a rejected `logout` sets the context's `logoutFailed`, the button logs and stays, and `routes/admin/+layout.svelte` shows `common.logoutFailed`. After a sign-out that succeeded, a `goto` that rejects or does not move the page is followed by `leaveByFullLoad`, and a press while one runs does nothing. `Banner.svelte` mounts the button in the Admin App as `AdminLogoutButton`. **Run:** `git grep -q -F PreventNavigation -- apps/frontend/src/routes/admin`, exit 1, in plan 41's Task 3 verify, in plan 42's, and again at this rewording. So no Admin App page can refuse that navigation. A failed sign-out is driven in a browser on the Admin home, in `179.1-49-close`; a `goto` that rejects is held by unit cases with a faked `goto`, in `Banner.svelte.test.ts`, and no browser has walked it.
  **Where it fits:** phase 179.2: the function that asked through a guard is gone, so an account flow of the Admin App that mounts `PreventNavigation` needs the registry's `keepGuardedEdits` and `discardGuardedEdits`, in `$lib/components/preventNavigation/navigationGuards`, with a modal of its own, as the Contestant App's `LogoutButton` has.

- Log out on a page with no guard discards a draft restored from `localStorage` without asking
  status: open
  **Found by:** 179.1-42, reading what plan 41 left.
  **What:** **Read:** `#logout` and `#reset` in `contestantContext.svelte.ts`, and `reset` in `contestantUserDataState.svelte.ts`, which removes every persisted draft by its key prefix. `confirmLeave` asks only a guard that is mounted and active, and the guards are on the profile, question and nomination details pages. So a draft restored on another page, the home say, goes with `userData.reset()` and nothing mentions it. Where a count opens the logout modal, its sentences count unanswered questions and say nothing of a draft. **Run:** nothing; no test presses Log out with a restored draft and no guard. Plan 41 did not change this behaviour.
  **Where it fits:** the operator's UAT, and a later plan on the drafts if a question is wanted there.

- A sign-out that fails after a yes leaves the user signed in on the home with the edit gone and no message
  status: resolved
  **Resolved in:** 179.1-45, commit `eac3a85fd`: `AuthContext.logout` rejects, `#runLogout` holds the failure and rethrows before anything is discarded, navigated or reset, and the contestant layout shows `common.logoutFailed`. Shown by tests 8, 9 and 10 of `contestant-entity-selection`, red in `179.1-45-red` and green in `179.1-45-green` and `179.1-45-close`. The third row of the audit's table keeps something: with the auth service down and the access token expired the cookies stay, and read as signed in once the service is back, until the next Log out (`T-179.1-103`, accepted, not driven in a browser). What the fix leaves a user who walked away is the entry on `T-179.1-104` under `## From plans 43 to 45`.
  **Found by:** 179.1-41's threat `T-179.1-92`, accepted, and 179.1-42 on its read.
  **What:** **Read:** `AuthContextProvider.logout` in `authContext.svelte.ts`, which logs a rejected `dw.logout()` and resolves, so `#logout` goes on to the navigation and `#reset`; `_logout` in `supabaseDataWriter.ts`, which throws on the endpoint's non-2xx answer and keeps the session on both sides. By plan 41's reading of `appGateHandle`, a live session is sent from the login page to the home, whose header has Log out, so no screen claims a sign-out. A failed sign-out always behaved this way; what plan 41 adds is that the user had just agreed. **Run:** nothing; no run makes the endpoint fail after a yes, so the end state is inferred.
  **Where it fits:** a later plan on the logout path: `logout` reporting failure to `#logout`, which would then skip the reset and say so. It needs a message key in all seven locales.

- A user with an unsaved edit no longer sees the modal's count of what is left
  status: resolved
  **Resolved in:** 179.1-44, commit `584235657`: with an unsaved edit and a counted task left the modal says both, in `LogoutButton.svelte`. Shown by the E2E test `the header's Log out with an unsaved edit and tasks left: the modal says both, and its count ends the session` (ledger row `44-8`), and by the unit cases of `what it says` (`44-3`). The copy is on the UAT list of `179.1-46-SUMMARY.md`.
  **Found by:** 179.1-41's ruling 3, for the operator's UAT.
  **What:** **Read:** `triggerLogout` in `apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte`, whose condition starts with `!hasActiveNavigationGuard()`. **Run:** the E2E test `the header's Log out with an unsaved edit and tasks left: the prompt comes in place of the modal, and no count runs` in `contestant-entity-selection`, green in `179.1-41-close`. They are asked once, not twice, and they are not told how many questions are left. With nothing unsaved the modal and its count work as before, by the test beside it. The effect on a real user was not assessed.
  **Where it fits:** the operator's UAT of the header's Log out.

## From the code review of plans 41 and 42

The detail, and what was read and what was measured for each, is in `179.1-CR01-REVIEW.md` under the same id. Recorded by the orchestrator after the review, and none was fixed then. Each entry's status says where it stands now.

- WR-05: after the full-load fallback the flag clears and the reset runs before the document has left, so WebKit can ask a second time and stay on a reset page
  status: resolved
  **Resolved in:** 179.1-44, commit `243591b3d`: the reset runs first, and `leaveByFullLoad` returns a promise that never settles, so `leaveUnasked` keeps the guards stood down until the document has gone. Shown by `navigationGuards.test.ts` and `contestantContext — logout`, red in `179.1-44-unit-red-2` with `expected false to be true` at `isLeavingUnasked()` (ledger row `44-10`). The order is held by those tests alone, with a stubbed `location`: no browser run covers WebKit, and it is on the UAT list.
  **Where it fits:** the same change as WR-06 and WR-07, with the operator's reading of "the browser always leaves" (`179.1-VERIFICATION.md`, truth 12).

- WR-06: `#logout` is re-entrant, and one boolean is shared by overlapping calls
  status: resolved
  **Resolved in:** 179.1-44, commit `243591b3d`: overlapping calls share one promise, `#loggingOut`. Shown by `two overlapping calls make one sign-out, one navigation and one reset with no full load, and a later call signs out again`, red in `179.1-44-unit-red-2` (ledger row `44-11`).
  **Where it fits:** with WR-05.

- WR-07: a `goto` that rejects after a successful sign-out leaves a signed-out page reading as signed in, and a unit test pins that
  status: resolved
  **Resolved in:** 179.1-44, commit `243591b3d`: a navigation that rejects, whatever the address then says, is logged and followed by the reset and the full load. Shown by `a navigation that rejects, with the page where it was / with an address that changed, is logged and followed by the reset and the full load`, which inverts the old case (ledger row `44-12`). So "the browser always leaves" holds once the sign-out has succeeded, and a failed sign-out stays (plan 45). The guide says so since 179.1-46. No browser run makes a `goto` reject.
  **Where it fits:** with WR-05.

- WR-08: the E2E "asks once" stops listening at the first question, so a later dialog on the agreed path cannot fail it
  status: resolved
  **Resolved in:** 179.1-44, commit `584235657`: the tests of the header's Log out take the composition root's recording of native dialogs for the whole test, and end on `expect(nativeDialogs.types()).toEqual([])`. Shown by the mutation `179.1-44-mut-dialog`, red on that last line with `+ "confirm"`, `+ "beforeunload"` (ledger row `44-14`).
  **Where it fits:** with WR-05, whose second prompt this helper could not see. The same listener leaves test 5's "past the count" step unable to catch a live count (`179.1-CR01-VALIDATION.md`).

- IN-08: the guard read in `triggerLogout` sits outside the handler that logs failures
  status: open

- IN-09: the props' docs say `onCancel` and `onConfirm` belong to a navigation
  status: resolved
  **Resolved in:** 179.1-44's docblock in `PreventNavigation.svelte`, commit `584235657`, and 179.1-46's `PreventNavigation.type.ts`.

- IN-10: Log out during a nomination save asks nothing
  status: open

- IN-11: two `LogoutButton` test titles say more than they test
  status: resolved
  **Resolved in:** 179.1-44, commit `f4df48ad0`: both titles were rewritten in `LogoutButton.svelte.test.ts`.

## From plans 43 to 45

What plans 43 to 45 found and left. Each entry says what was read and what was run. Their browser runs are `179.1-44-close` and `179.1-45-close`, and neither drove any of these states unless the entry says so.

- `T-179.1-104`: a sign-out that fails at the count's end leaves a user who walked away signed in, with their draft in storage and the message on the screen
  status: accepted
  **Accepted by:** the operator, on UAT test 9 of `179.1-WR16-UAT.md`, 2026-11-06: "keep". Entered by plan 66 as `AR-179.1-13`. Plans 56 to 66 left it as it was: plan 63 clears the count's deadline before its own sign-out, so a sign-out that fails at the count's end still leaves the session where the cookies were kept. The text below is as plans 43 to 45 left it.
  **Found by:** 179.1-44 and 179.1-45, reading what the operator's rulings 1 and 2 leave together.
  **What:** **Read:** `#runLogout` in `contestantContext.svelte.ts`, which rethrows a failed sign-out before anything is discarded, navigated or reset; `leave` in `LogoutButton.svelte`, which logs and closes the modal; nothing retries by itself. **Run:** test 9 of `contestant-entity-selection` pins this state, green in `179.1-45-green` and `179.1-45-close`. So ruling 1's "nothing left on a shared computer" holds when the sign-out succeeds, and ruling 2 keeps the edits when it does not.
  **Where it fits:** the operator's to overrule, first on the UAT list of `179.1-46-SUMMARY.md`. Registered as accepted in plan 45's threat model.

- During a sign-out the modal's ✕ and Escape still close it without stopping the sign-out
  status: resolved
  **Resolved in:** 179.1-62, commit `04a6bccb5`, as `G-179.1-WR16-10`, on the operator's answer "hold them" to UAT test 10: while a sign-out runs the ✕ and Escape keep the modal open, held by a test in `contestant-entity-selection`. The text below is as plans 43 to 45 left it.
  **Found by:** 179.1-44, reading what its modal does in flight.
  **What:** **Read:** the actions in `LogoutButton.svelte`: Continue is `disabled={leaving}` and the modal's Log out shows `loading={leaving}`, while `ModalContainer` and `Modal` take no prop that holds their ✕ and Escape back. A user who pressed one may believe they stayed, yet on a successful sign-out they are signed out and the edit is gone. **Run:** the unit cases on Continue in `LogoutButton.svelte.test.ts`. The ✕ and Escape in flight were not run.
  **Where it fits:** the operator's UAT. Holding them back needs a prop through `ModalContainer` and `Modal`.

- A `POST` to the logout endpoint that never answers shows neither the message nor a departure
  status: open
  **Found by:** 179.1-45, reading the failure's paths.
  **What:** **Read:** `_logout` in `supabaseDataWriter.ts` awaits the `fetch` with no timeout, so `#runLogout` waits, `leaving` stays up and the modal's Log out stays in its loading state. **Run:** nothing. The tests fulfil the route, so none leaves a request unanswered.
  **Where it fits:** a later plan on the logout path, with a timeout and its own message if one is wanted.

- A user who aborts the full load keeps a reset page whose guards ask nothing (`T-179.1-100`)
  status: open
  **Found by:** 179.1-44's threat model.
  **What:** **Read:** `leaveByFullLoad` in `navigationGuards.ts`, whose promise never settles, so `leavingUnasked` stays up after the store's reset. No edit is left to lose, and a reload recovers. **Since 179.1-49 this reads for the Admin App's button too:** it awaits the same `leaveByFullLoad` with its own `leaving` flag up, so a user who aborts that load keeps a page whose Log out does nothing until a reload, with the session already over; the Admin App has no store to reset and no guard, so it has no edit to lose. **Run:** nothing. The full load itself was driven once, in Chromium under the mutation `179.1-44-mut-dialog`, in the Contestant App; no run aborts it, in either app.
  **Where it fits:** accepted in plan 44's threat model, which names the Contestant App; a later plan on the logout path if it matters.

- A second `LogoutButton` on the same page has its own leaving flag, so it can open its modal during the other's sign-out
  status: open
  **Found by:** 179.1-44, reading `leaving` in `LogoutButton.svelte`, whose scope is the one instance.
  **What:** **Read:** the second button's `triggerLogout` passes its own `leaving` check and can open its modal, and the navigation after a successful sign-out then closes it through `onNavigate`, since 179.1-47. The context's `logout` is still one run. That two such buttons are mounted on one page at once, the header's and the one in `NothingToEdit`, `ReadFailure` or the entity home, is read from their mounts; which of them can be pressed during a sign-out was not established. **Run:** nothing.
  **Where it fits:** a later plan that edits the button, if the operator's UAT finds it.

- No axe scan reaches the logout modal or the failed sign-out's message
  status: open
  **Found by:** 179.1-44 and 179.1-45, walking the checklist; 179.1-46 records it in the known-gaps table of `contestant-a11y.spec.ts`.
  **What:** **Read:** no entry's `reach` in `specs/a11y/` opens the modal or fails a sign-out, and a scan's lever must hold the page's clock, because a real count ending would sign out the session the project shares. **Run:** nothing beyond the existing scans. `Alert` has `role="alert"` and a named close button, and the modal's new text is plain paragraphs, by reading.
  **Where it fits:** the operator's UAT, and a later plan that adds the entry.

- Sentences in `+server.ts` and `supabaseDataWriter.ts` call the session cookies httpOnly, which `createSupabaseCookieAdapter` contradicts
  status: open
  **Found by:** 179.1-45, reading beside the two comments it corrected.
  **What:** **Read:** the header of `apps/frontend/src/routes/api/auth/logout/+server.ts` and the comment in `_logout` in `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` say httpOnly cookies; `createSupabaseCookieAdapter` writes `httpOnly: false`, and `apps/frontend/src/lib/supabase/server.test.ts` pins that. Plan 45 did not change these sentences. **Run:** nothing.
  **Where it fits:** a later plan that edits either file and closes on a full run after it.

- A link clicked while the count's sign-out is in flight raises the native question, and staying does not stop the sign-out already running
  status: resolved
  **Resolved in:** 179.1-62, commit `04a6bccb5`, as `G-179.1-WR16-10`: while a sign-out runs a link waits until it has settled, with no question, held by a test in `contestant-entity-selection`. The text below is as plans 43 to 45 left it.
  **Found by:** 179.1-44, reading the window before `#authLogout` returns.
  **What:** **Read:** `leaveUnasked` starts after the sign-out, so until then `beforeNavigate` in `PreventNavigation.svelte` asks as usual, while the sign-out already runs. A user who refuses stays on the page, and on a successful sign-out is then signed out with the edit discarded. The window is narrow. **Run:** nothing.
  **Where it fits:** the operator's UAT of a slow sign-out.

## From plans 47 to 50

What plans 47 to 50 resolved, what they found, and what they left. Each entry says what was read and what was run. The closes are `179.1-47-close-r2` (the first close, `179.1-47-close`, was red, and the operator decided the one rerun), `179.1-48-close` and `179.1-49-close`. The detail of each finding is in `179.1-RULINGS-REVIEW.md` under the same id.

- CR-02: with the logout modal open on a question page, a navigation to a route with no question threw in the header and the next page was not rendered
  status: resolved
  **Resolved in:** 179.1-47, commit `025ec8f21`.
  **Found by:** the code review of plans 43 to 46, in a harness; measured in a real browser at planning.
  **What:** **Read:** `heldInfo` in the question page now reads the route, with `heldOpenAnswer?.info ?? null`, because the verifier's comparison alone reads `.info` off an undefined holder on such a route. `LogoutButton` closes its modal in `onNavigate`, before the new page is written. **Run:** red in `179.1-47-unit-red-1` and `179.1-47-red`, green in `179.1-47-green`; `179.1-47-mut-page` and `179.1-47-mut-button` show each layer holding alone; green in `179.1-47-close-r2`.

- WR-09: a close the platform makes left the count running, so the session later ended with the edit discarded and no modal on screen
  status: resolved
  **Resolved in:** 179.1-47, commit `cd4b4553d`, in the code. **Its device half stays open:** Android's back gesture is on the operator's UAT list.
  **Found by:** the code review of plans 43 to 46, and the security audit's first note.
  **What:** **Read:** `handleNativeClose` in `ModalContainer.svelte` honours a dialog's `close` event only while the component holds the modal open and the dialog is closed. The second check is what the proposal lacked: `179.1-47-unit-red-3` shows the proposal's `if (isOpen) handleClose()` closing a dialog just reopened. **Run:** `dialog.requestClose()` stands in for the gesture in Chromium, red in `179.1-47-red-2` and green in `179.1-47-green-2`, then in `179.1-47-close-r2`. That the gesture reaches this path rests on the HTML standard and Chrome's documentation: no run had a device. It reaches every modal, and only this plan's test drives a platform close; the other modals' `onClose` were read.

- WR-10: the failure message was not withdrawn when the session ended
  status: resolved
  **Resolved in:** 179.1-48, commit `662d99675`, for the path through a link that reaches the gate. The code review of plans 47 to 50 found its route arm wrong in both directions, as `WR-14` and `WR-15`, and 179.1-51 and 179.1-52 close them: see `## From plans 51 to 53`.
  **Found by:** the code review of plans 43 to 46.
  **What:** As plan 48 left it, which plans 51 and 52 changed: **Read:** the effect in `routes/contestant/+layout.svelte` clears the flag on the login route, or when the session reads as gone. The route's arm is what the proposal lacked: the session's load reads nothing SvelteKit tracks, so a link does not run it again and `isAuthenticated` stays true on the path the finding was written for. **Run:** `179.1-48-mut-session` builds the proposal alone and is red at `expectNoFailureMessage`, `Received: 1`; `179.1-48-mut-any-link` shows the message has to survive a link while the session is alive; green in `179.1-48-close`. Only a unit case covers the session's arm: no browser run drives it. That the message does not follow into the next sign-in is inferred, and no test signs in again after that.

- WR-11: the Admin App's message was painted under positioned page content, its Close included
  status: resolved
  **Resolved in:** 179.1-49, commit `872f74d2d`.
  **Found by:** the code review of plans 43 to 46, measured on one static page.
  **What:** **Measured at planning, beyond the review:** on the Admin home and the jobs page neither Close could be pressed, and on a phone the box started at `x = 328` of 390, so the sentence could not be read. **Read:** `Alert` moved into `routes/admin/+layout.svelte`, outside `Layout`, with `logoutFailed` and `clearLogoutFailure` on the admin context, and the Contestant layout's effect beside it. **Run:** `179.1-49-red` shows both buttons covered on the Admin home and the right side outside at 390 by 600; green in `179.1-49-green` and `179.1-49-close`. The jobs page was not read in a run of plan 49, and the phone test resizes desktop Chromium after a press at desktop size. The layout's withdrawal is held by unit cases alone.

- WR-12: a screen-reader user was not told what the modal says when it opens
  status: resolved
  **Resolved in:** 179.1-48, commit `03ceff726`, in the markup and in what the browser computes. **What a reader says stays open, on the operator's UAT list:** no run establishes it.
  **Found by:** the code review of plans 43 to 46; the operator added it to this run as a fix.
  **What:** **Read:** `LogoutButton` gives its dialog `aria-describedby`, onto a hidden copy from the snippet `whatIsAtStake` and the count's sentence at its full length, so the description never holds the number that ticks. **Run:** `toHaveAccessibleDescription` in `179.1-48-red-2`, `Received string: ""`, and in `179.1-48-green-2`; `179.1-48-mut-description` shows the number moving when the mutation lets it; green in `179.1-48-close`. VoiceOver, NVDA and TalkBack were not run.

- WR-13: the Admin App's handler left a rejected `goto` unhandled, and overlapping presses were two sign-outs
  status: resolved
  **Resolved in:** 179.1-49, commit `872f74d2d`.
  **Found by:** the code review of plans 43 to 46.
  **What:** **Read:** `handleLogout` in `dynamic-components/logoutButton/LogoutButton.svelte` has a `leaving` flag, a check that the page moved, and `leaveByFullLoad`; it also logs a `goto` that resolved without moving. **Run:** unit cases in `Banner.svelte.test.ts` with a faked `goto`, red in `179.1-49-unit-red-1`, with the mutations `179.1-49-unit-mut-always-full-load`, `-stays-leaving`, `-no-address-check` and `-rejection-reads-address`. No run makes a `goto` reject in a browser. That a press during a real full load stays ignored is inferred: the unit cases use a promise that settles.

- IN-12: the guide and the docblock said `keep` does what no page wires
  status: resolved
  **Resolved in:** 179.1-50, the commit `docs(179.1-50): the logout modal's dismissals and the Admin App's Log out, in the guide and the component pages`.
  **Found by:** the code review of plans 43 to 46.
  **What:** **Read:** `git grep -n onCancel -- apps/frontend/src/routes` has no hit; the profile and question pages pass `onConfirm` and the nomination details neither. So Continue keeps a change because nothing is done to it, and `keepGuardedEdits` runs an `onCancel` no page has; the function stays. The guide says so, the docblock's example is an `active` callback with `onConfirm`, and its typo is corrected in the docblock and the generated page. **Run:** a second `generate:docs` changes nothing. No behaviour changed.

- IN-15: two Log out tests did not record native dialogs
  status: resolved
  **Resolved in:** 179.1-48, commit `e917b5593`.
  **Found by:** the code review of plans 43 to 46.
  **What:** **Run:** `179.1-48-mut-native` reds all 17 tests of the describe `the header's Log out` at their last lines, with test 6 no longer clearing its list; green in `179.1-48-green-3` and `179.1-48-close`. A native dialog raised after a test's last line is not seen. Log out tests in other specs, the Admin App's among them, do not record.

- IN-13: a `#reset` that throws on the full-load path stops the browser leaving
  status: open
  **Found by:** the code review of plans 43 to 46.
  **What:** **Read:** `#runLogout` in `contestantContext.svelte.ts` calls `this.#reset()` just before `leaveByFullLoad` with no `try`, where `discardGuardedEdits` has one. A throw from the store or from storage would reject out of `leaveUnasked`, the user gets no message, and the guide's "always leaves" would not hold. Re-read at this plan's head. **Run:** nothing. Not in the gaps, and unlikely, by the review's reading.
  **Where it fits:** a later plan on the logout path: the same `try` and `log.error` as the discard, with a case.

- IN-14: a `goto` that never settles after the sign-out holds `#loggingOut` and `leaving`, with the reset not run
  status: open
  **Found by:** the code review of plans 43 to 46.
  **What:** **Read:** `goto(loginRoute, { invalidateAll: true })` waits for every load. If one hangs after a sign-out that succeeded, the guards stay down, `#reset` never runs, a draft on a page with no guard stays in storage, and Log out does nothing further. **Run:** nothing. Not in the gaps.
  **Where it fits:** with the `POST`'s timeout, when *A `POST` to the logout endpoint that never answers…* is taken.

- IN-16: `failSignOutAfterClearingCookies` keeps the endpoint's success body under the failure status
  status: open
  **Found by:** the code review of plans 43 to 46.
  **What:** **Read:** `route.fulfill({ response, status: SIGN_OUT_FAILURE.status })` in `headerLogout.fixture.ts` sends the real answer's body with a failure status, and `_logout` reads only `response.ok`, so the test that uses it is correct today. A writer that read the body would be driven by a response the endpoint never sends. Re-read at this plan's head. **Run:** nothing. Not in the gaps, and this plan changes no test.
  **Where it fits:** a later plan that edits that fixture.

- After a session has gone, the login screen's header still shows Log out until the session's load runs again
  status: open
  **Found by:** the planner of plans 47 to 50, measured in `179.1-planning-probe-2`; reported again by 179.1-48.
  **What:** **Measured at planning:** the header shows Log out on the login screen on the path of `failSignOutAfterClearingCookies`. **Read:** `routes/contestant/+layout.server.ts` reads nothing tracked, so a link does not refresh `page.data.session`. A press there finds no session, answers 200, and falls through to the full load. **Not driven:** no run pressed it, so that it is harmless is by reading only. No test asserts the header either way. **That reading holds for the row where the cookies were cleared.** In the outage row the header still shows Log out, a press answers 502, the flag is set, and the effect clears it at once on an entry route, so a press there says nothing, as `T-179.1-131` accepts: read by the security audit, not driven. With a live session the screen cannot be stood on any more, since 179.1-51 and 179.1-52.
  **Where it fits:** the operator's UAT list in `179.1-53-SUMMARY.md`: keep it, or schedule it.

- A second tab keeps and re-stores a user's data after a sign-out
  status: resolved
  **Resolved in:** 179.1-60, commit `6b30cfbb9`, as `G-179.1-WR16-11A`, on the operator's answer "Fix all of the three" to UAT test 11: a persisted handle follows another document's change of its storage, and a browser sign-out sends the other open tabs to the login page; a two-tab test holds it. The text below is as plans 47 to 50 left it.
  **Found by:** the security audit, `179.1-RULINGS-SECURITY.md`, its second note and its unregistered flags. No plan here touched it.
  **What:** **Read, by the audit:** the first tab's reset removes the drafts from storage; the second tab's handle in `persistedState.svelte.ts` keeps its value and stores it again on its next edit, and the frontend has no `storage` listener. **Run:** nothing. No test opens two tabs.
  **Where it fits:** the operator: record it as accepted, or schedule it.

- The Admin App's Log out leaves Contestant App drafts
  status: resolved
  **Resolved in:** 179.1-61, commit `7e33fe208`, as `G-179.1-WR16-11B`, on the operator's answer to UAT test 11 and their ruling of 2026-11-06, browser sign-outs only: every browser sign-out removes the drafts, in both apps. The text below is as plans 47 to 50 left it.
  **Found by:** the security audit, `179.1-RULINGS-SECURITY.md`, its second note and its unregistered flags. No plan here changed it.
  **What:** **Read, by the audit, and again in 179.1-49:** neither the Admin App's Log out nor `handleError` in `routes/admin/(protected)/+layout.ts` runs the contestant store's `#reset`. **Run:** nothing.
  **Where it fits:** the operator: record it as accepted, or schedule it.

- `T-179.1-103`, as the security audit corrects it: cookies kept during an auth outage read as signed in once the service is back, for whoever opens the app next, until someone presses Log out
  status: accepted
  **Accepted by:** the operator, on UAT test 9 of `179.1-WR16-UAT.md`, 2026-11-06, apart from the settled outage row: "keep". Entered by plan 66 as `AR-179.1-14`. Plans 56 to 66 left it as it was. The text below is as plans 47 to 50 left it.
  **Found by:** plan 45's threat model; corrected by `179.1-RULINGS-SECURITY.md`, its third note. No plan here changed it.
  **What:** **Measured by the audit, with `fetch` stubbed against the installed auth libraries:** with an expired token during an outage a press answers 502 with the cookies kept, a second press the same, and a press after recovery 200 with the cookies cleared. **Its corrections:** the window includes a 90-second margin (`EXPIRY_MARGIN_MS`); the user is told only while the document stays and until a link reaches the gate, and a user who walked away is not told; and no record shows the operator accepting the risk. **Not driven** in a browser.
  **Where it fits:** the outage row itself is settled as `T-179.1-131`, by the operator's ruling 2 of 2026-11-03. The operator's rulings on `T-179.1-103` other than the outage row stay open: the operator's UAT list in `179.1-53-SUMMARY.md`: keep it, or overrule it.

- `T-179.1-104`, as the security audit corrects it: the entry under `## From plans 43 to 45` is worded for two of the three rows
  status: accepted
  **Accepted by:** the operator, on UAT test 9 of `179.1-WR16-UAT.md`, 2026-11-06: "keep". Entered by plan 66 as `AR-179.1-13`, which takes in the audit's correction. The text below is as plans 47 to 50 left it.
  **Found by:** `179.1-RULINGS-SECURITY.md`, its third note. No plan here changed it.
  **What:** **Read, by the audit:** in the row where the cookies were cleared, nobody is signed in, though the page reads so; a save fails, by plan 45's reading; and after a reload the login screen has no Log out, so the draft stays until someone signs in. In the other two rows the user who walked away stays signed in. A `POST` that hangs shows no message until the browser gives up. **Run:** test 9 of `contestant-entity-selection` pins the state, and its draft line has never been seen red, by ledger row `45-7`.
  **Where it fits:** the first item of the operator's UAT list in `179.1-50-SUMMARY.md`: keep it, or overrule it.

- The UI review's warnings outside `WR-11` and `WR-12`
  status: open
  **Found by:** `179.1-RULINGS-UI-REVIEW.md`, where they stay.
  **What:** **Read, by the review:** among them "Loading…" during a sign-out. Each needs new copy or a visual change, which the operator's waiver does not cover, so plans 47 to 50 changed none of them. **Run:** nothing here.
  **Where it fits:** the operator's UAT list in `179.1-50-SUMMARY.md`.

- The coverage audit's PARTIAL rows these plans did not close
  status: open
  **Found by:** `179.1-RULINGS-VALIDATION.md` § *What would close the PARTIAL rows*, where they stay.
  **What:** **Closed by these plans, of that list:** the wording and the check of truth 46-5 (179.1-50), `nativeDialogs` in N1 and N2 (179.1-48), a direct press with a failing sign-out in a browser (179.1-48), and a failing sign-out in the Admin App in a browser (179.1-49). **Still open there,** among them: a failing sign-out on a gate, a forced `goto` failure in a browser for the unmutated full load, and Stay by Escape and by the ✕ past the count.
  **Where it fits:** a later plan on these tests. This plan adds none.

## From plans 51 to 53

The operator's four rulings of 2026-11-03, verbatim and locked:

1. **WR-10 fix: server loads.** Give the entry routes that lack one a no-data server `load`, so a client-side navigation reaches the gate and a live session is sent home, in dev and production alike. Withdraw the message on every entry route of the app's gate through one shared exported function used by both layouts (the review's `isEntryRoute(routeId)` in `appGates.ts`, IN-20). The alternative of re-reading the session on entering the route is rejected.
2. **The auth-outage row (cookies kept, service down): record as accepted, no code.** Register it as an accepted risk. Correct T-179.1-103's wording (the user is told only while the document stays "and until a link reaches the gate") and the guide. Do not make the session read distinguish "no session" from "could not check".
3. **UI safety gate: waiver extended to this gap plan,** limited to no new component, no new or edited message key, and no visual change. If execution finds it needs one of these, the plan STOPS and returns to the operator instead of proceeding. There is no UI-SPEC and none is to be generated. The behaviour change the operator accepted: when the message appears, and that Back to a login screen with a live session lands on the home.
4. **Take `email-sent` off the list.** Remove `ContestantAppEmailSent` from the Contestant row's `entryRoutes` in `APP_GATES`, with no load on it. A signed-in user who asks for a link on the forgot-password page keeps seeing the truthful "email sent" screen. The operator accepted these consequences when ruling: a live session can stand on that screen, including by address, where the gate redirects it today; and after cleared cookies, Back there could still show the false failed-sign-out message until the next entry route.

The operator's later rulings, of 2026-11-03 and 2026-11-04, each settled and none an open question:

- `supabase_storage_openvaa-local` was removed once with the operator's approval, by the orchestrator, because the Docker VM was under the driver's floor. That approval does not extend.
- `179.1-51-mut-push`'s verify names both red titles, and the plan line changed on the operator's ruling. The second red's cause is UNCONFIRMED.
- Plan 52 Task 2's criterion reads lines scanned, on the operator's ruling. `c528153f3` went in with the original wording unmet.
- The driver's `docker builder prune -af` is authorised as written for this phase's remaining runs. No volume or image may be removed, and the driver's floor stands.

What plans 51 to 53 resolved, accepted, found and left. Each entry says what was measured and what was only read. Dev server runs are under `tests/e2e-runs/179.1-e2e/`, driven production runs under `tests/e2e-runs/179.1-prod/`, and the closes are `179.1-51-close-r2`, `179.1-52-close` and `179.1-53-final`. "Measured at planning" means the runs `179.1-planning-r4-dev-2` and `179.1-planning-r4-prod-1`, a dev server and a production build, which no verdict reads.

- WR-14: the message was withdrawn on the login route with the session alive, and a sign-out that failed there showed nothing
  status: resolved
  **Resolved in:** 179.1-51, commit `8d49b4e19`, for the Contestant App's login route; 179.1-52, commit `c528153f3`, for the Contestant App's sign-in screen and the Admin App's login page.
  **Found by:** the code review of plans 47 to 50, `179.1-REGAPS-REVIEW.md`, by reading and a harness.
  **What:** **Read:** every entry route of `APP_GATES` has a server load, each of the three new ones returning an empty object, so a client-side navigation to one is a request the gate answers. **Run:** on a dev server, `179.1-51-red-r2` is red at spec lines 1049 and 1130, `179.1-51-mut-no-load` shows the load is what closes it, and `179.1-51-close-r2` and `179.1-52-close` are green. In a production build, `179.1-52-prod-red` is red at `Jobs Monitoring`, spec line 311 of `admin-access`, and at spec line 1041 of `contestant-entity-selection`; `179.1-52-prod-green` passes 16 of 16, and its manifest shows a load on every entry route. **Driven in a production build:** the Admin App's login page and the Contestant App's sign-in screen. **Not driven there:** the other entry routes, whose claim rests on the manifest.

- WR-15: the sign-in screen, reached by Back after a failure that cleared the cookies, kept the message, and it followed into the next sign-in
  status: resolved
  **Resolved in:** 179.1-51, commit `8d49b4e19`.
  **Found by:** the code review of plans 47 to 50, `179.1-REGAPS-REVIEW.md`, by reading.
  **What:** **Read:** the Contestant layout's effect clears the flag through `isEntryRoute`. **Run:** test 2 of plan 51, `the header's Log out when the sign-out answers with a failure and the cookies are gone`, signs in again. It is red in `179.1-51-red-r2` at spec line 1096, red alone under `179.1-51-mut-one-route`, which shows the shared function is what closes it, and green in `179.1-51-close-r2`, `179.1-52-prod-green` and `179.1-52-close`.

- IN-20: the withdrawal's condition and the message were repeated in the two layouts
  status: resolved
  **Resolved in:** for the condition, 179.1-51, commit `8d49b4e19`, and 179.1-52, commit `c528153f3`: `isEntryRoute` in `appGates.ts` is one function, and both layouts use it.
  **Found by:** the code review of plans 47 to 50, `179.1-REGAPS-REVIEW.md`.
  **What:** **Read:** the request hook keeps its own comparison against the row it has already resolved, because calling `isEntryRoute` would resolve the row a second time and change the auth path for no behaviour (plan 51's ruling 6). The `Alert` block and the after-sign-out sequence stay repeated: the first because a shared component is outside the operator's waiver, the second because these plans change neither handler. **Run:** `179.1-51-unit-mut-arm`, `179.1-52-unit-mut-admin-arm` and `179.1-52-unit-mut-admin-any-route` show each layout's cases able to fail.

- `T-179.1-131`: during an auth outage with the cookies kept, the message is withdrawn on an entry route though it is still true
  status: accepted
  **Found by:** the security audit, `179.1-REGAPS-SECURITY.md`, its first note. Accepted by the operator's ruling 2 of 2026-11-03, no code: `AR-179.1-09`.
  **What:** With the cookies kept and the service down, the session read finds no session, the gate lets the request through, and on an entry route the message goes though it is still true. The client cannot tell this row from the cleared-cookies row. A press of the header's Log out there answers 502, and the effect clears the flag at once, so the press says nothing. The cookies read as signed in once the service is back, until the next Log out. **Read, and re-measured by the security audit against the installed auth library with `fetch` stubbed. Not driven in a browser.**
  **Where it fits:** stated in the guide and on the auth page. The session read does not tell the two rows apart, by decision.

- `T-179.1-134`: after a failure that cleared the cookies, Back to the "email sent" screen still shows the message, and it also stays on Help, Privacy and the forgot-password page
  status: accepted
  **Found by:** the planner of plans 51 to 53, measuring the operator's ruling 4, whose second consequence this is; the code review of plans 51 to 53, `179.1-ENTRY-REVIEW.md`, as `WR-17`, for the three pages. Accepted by two rulings: the operator's ruling 4 of 2026-11-03 for the screen, and the operator's ruling of 2026-11-04 for the three pages: `AR-179.1-10`.
  **What:** The message stands there, with the header's Log out, until the next entry route, and the same message stays on Help, Privacy and the forgot-password page, which have no server load and are not entry routes, until the next entry route. The screen's way back reaches the login screen, which withdraws it. Its "Use another email address" can lead to the forgot-password page, which keeps it, and that page's way back reaches the sign-in screen, which withdraws it. **Run:** test 5 of plan 51, `after a sign-out that failed with the cookies gone`, is red under `179.1-51-mut-no-arm` and green in `179.1-51-close-r2`, `179.1-52-close` and, in a production build, `179.1-52-prod-green`; it shows the way back and the next sign-in. **Measured at planning, in both builds, and in no committed test:** the path through "Use another email address". **Read, and shown only on the path that begins from the screen:** that every way to a sign-in passes an entry route or a new document. **Read, and not driven in a browser:** the message on Help, Privacy and the forgot-password page, whose unit case is `WR-17`'s entry in `## From plans 54 and 55`.
  **Where it fits:** stated in the guide and on the auth page.

- `T-179.1-135`: a live session may stand on the "email sent" screen, where the gate sent it home before
  status: accepted
  **Found by:** the planner of plans 51 to 53, measuring the operator's ruling 4, whose first consequence this is. Accepted by that ruling: `AR-179.1-11`.
  **What:** **This is narrower than the consequence the operator accepted,** which said "including by address". A live session stands on the screen only after asking for a link in this tab. By its address or on a reload no request is held, and the page leads through the login route to the home, with no loop. With a live session the message stays there and is true, and a failed press there says so. **Run:** test 4 of plan 51, `a signed-in user who asks for a link on the forgot-password page`, walks the asked-for path, the address and the failed press; red under `179.1-51-mut-sent-back`, green in `179.1-51-close-r2`, `179.1-52-close` and `179.1-52-prod-green`. **Measured at planning, in both builds, and in no committed test:** the reload, and that no later navigation follows in four seconds.
  **Where it fits:** stated in the guide and on the auth page.

- The address bar after a Back the gate redirects keeps the entry route's address until the next navigation (`T-179.1-125`)
  status: open
  **Found by:** the planner of plans 51 to 53.
  **What:** **Measured at planning, in both builds:** `location.pathname` reads the entry route while the page is the home, and a reload lands on the home. **Read:** the framework's behaviour on a popped navigation. **Run:** the tests do not read the address, on purpose. They read what the page shows, and that the length of history holds.
  **Where it fits:** the operator's UAT list in `179.1-53-SUMMARY.md`: keep it, or schedule a fix.

- The Admin App's sign-in writes two history entries for the home
  status: open
  **Found by:** the planner of plans 51 to 53.
  **What:** **Read:** the login form's handler calls `update()` and then `applyAction`. **Measured at planning, and not fixed.** **Run:** the Admin App's test of plan 52 goes Back twice and says why; `179.1-52-prod-red` and `179.1-52-prod-green` show the first Back on the home.
  **Where it fits:** the operator's UAT list in `179.1-53-SUMMARY.md`: keep it, or schedule it.

- A protected load sends a live session to the login page, and the gate sends it back (T-179.1-130)
  status: resolved
  **Resolved in:** 179.1-54, commit `a0c192b14`.
  **Found by:** the planner of plans 51 to 53, for a failed sign-out; the code review of plans 51 to 53, `179.1-ENTRY-REVIEW.md`, as `WR-16`, for a failed read.
  **What:** **Measured in `179.1-planning-probe-wr16-*`, and seen red in plan 54's runs:** the failed read looped, in both builds, as the review read it, and ended on `Internal Error`. A failed sign-out looped too, in `handleError` and in `signOutToLogin`. **The loop on the driven paths is not a regression of plan 52:** with the load removed from the Admin App's login page at HEAD (`179.1-planning-probe-wr16-noload-prod`) each path read the same. The limit is that it was HEAD with one load removed, not a build of `8c1c435a2`. The verification's word "regression" and the review's table are not edited, and the drive does not bear them out. Plan 52's ruling 7 and plan 53's text stay as the history of what was read then.
  **Where it fits:** closes as mitigated by the operator's ruling R2 of 2026-11-04, which reverses the acceptance in plan 52's row. No accepted residue of this loop is left. See `## From plans 54 and 55`.

- The message's box can cover a control
  status: open
  **Found by:** `179.1-planning-probe-5` and `179.1-planning-r4-prod-1`.
  **What:** **Measured at planning:** `179.1-planning-probe-5` measured the `fixed` alert taking the click meant for the sign-in screen's submit button at desktop size, and the fix keeps the message off that screen. `179.1-planning-r4-prod-1` measured it over the "email sent" screen's two links at desktop size: a press of the pointer lands on the box, a keyboard follows the links, and closing the message clears the way, which also withdraws it. On other pages it can still cover a control until closed. **Run:** test 5 of plan 51 follows the way back by keyboard.
  **Where it fits:** the UI review's territory, and the operator's UAT list in `179.1-53-SUMMARY.md`. A change is outside the operator's waiver.

- `storage.objects` holds 327 rows of the default project with no file behind them
  status: open
  **Found by:** 179.1-51, after the volume's removal the operator approved.
  **What:** **Read from the database and the volume:** 327 rows of project `00000000-0000-0000-0000-000000000001`, dated 2026-11-02, with 0 files on the volume after `179.1-51-close-r2`. **Inferred, and not opened in a browser:** broken portraits on `yarn dev` until a re-seed.
  **Where it fits:** the operator's. A re-seed resets the database shared with the `-infra` worktree, so no plan re-seeds for this.

- The wrapper's status 9 on `179.1-52-green`
  status: open
  **Found by:** 179.1-52.
  **What:** **Read from the run:** `yarn db:start` exited 1 after 61 s, and `restore-db-start.log` ends with empty container logs for analytics and vector and `Stopping containers...`. The cause is UNCONFIRMED. `179.1-52-close`'s own restore read `ok`.
  **Where it fits:** the operator's UAT list in `179.1-53-SUMMARY.md`.

- `E2E-03` in `REQUIREMENTS.md` stays unmarked by plans 51 and 52
  status: open
  **Found by:** 179.1-51 and 179.1-52.
  **What:** **Read:** that file discharges it at Phase 179, and the execution rules allow no other edit of it.
  **Where it fits:** the operator may overrule: the UAT list in `179.1-53-SUMMARY.md`.

- IN-17: two E2E assertions no longer read what the user sees, because of the hidden description
  status: open
  **Found by:** the code review of plans 47 to 50, `179.1-REGAPS-REVIEW.md`, where the detail stays.
  **What:** **Read and measured there on a static page. Run here:** nothing: plans 51 to 53 did not edit these lines.
  **Where it fits:** a later plan that edits `headerLogout.fixture.ts`.

- IN-18: the moved check takes another navigation's address as the logout's own, in the Admin App too
  status: open
  **Found by:** the code review of plans 47 to 50, `179.1-REGAPS-REVIEW.md`, where the detail stays.
  **What:** **Read there. Run here:** nothing: plans 51 to 53 did not edit these lines.
  **Where it fits:** a later plan on the logout path.

- IN-19: a sentence plan 49 rewrote still names a constructor call the class does not make
  status: open
  **Found by:** the code review of plans 47 to 50, `179.1-REGAPS-REVIEW.md`, where the detail stays.
  **What:** **Read there. Run here:** nothing: plans 51 to 53 did not edit these lines.
  **Where it fits:** a later plan that edits `adminContext.svelte.ts`.

## From plans 54 and 55

The operator's rulings of 2026-11-04.

**Verbatim:** "Fix wr-16, accept wr-17"

**R1, not verbatim, as the orchestrator reports the operator's answers:** no new load: `routes/admin/(protected)/+layout.server.ts` is not added. The operator gave this ruling and then reconfirmed it on the measured terms. (a) After a sign-out in one tab and a sign-in in another, the first tab shows the login form with no message, and a reload reaches the home from both addresses; after Back a sign-in there ends on the error page, which also happens at HEAD. (b) With the session ended in another tab, a navigation inside `/admin` shows the error page in place of the login form it shows at HEAD, and a reload reaches the form. The form and the reload are recorded as an accepted risk. The error page in (b) and the sign-in failure were shown to the operator and stay undecided items on their UAT list, not rulings.

**R2, not verbatim, as the orchestrator reports the operator's answer:** the failed-sign-out loop is fixed in both apps: a protected load redirects to login only if the session has gone, otherwise a translated error page; `signOutToLogin` logs the failure; `T-179.1-130` closes as mitigated. It reverses the acceptance in plan 52's threat row.

**The waiver, as extended on 2026-11-04:** no new component, no new or edited message key, and no visual change. No UI-SPEC exists and none is generated. If execution finds it needs one of these, the plan stops and returns to the operator.

What plans 54 and 55 resolved, accepted, found and left. Each entry says what was measured and what was only read. "Measured at planning" means the runs `179.1-planning-probe-wr16-*`, under `tests/e2e-runs/179.1-prod/` and `tests/e2e-runs/179.1-e2e/`, which no verdict reads. Plan 54's own runs are `179.1-54-*` under the same directories, and its close is `179.1-54-close`, 678 of 678.

- WR-16: a read of the user's data that fails in the Admin App's protected load redirected a live session to the login page, and the gate sent it back
  status: resolved
  **Resolved in:** 179.1-54, commit `a0c192b14`.
  **Found by:** the code review of plans 51 to 53, `179.1-ENTRY-REVIEW.md`, by reading.
  **What:** **Measured at planning, in both builds:** the form's sign-in with the read answered 500 looped, with 44 data requests and 22 reads, and ended on the root error page titled `Internal Error`; with the fix it makes 2 data requests, none to the login page, and the title is `error.default` in the reader's locale. **Measured in plan 54's runs:** `179.1-54-prod-red-r2` and `179.1-54-dev-red-admin-r2` read `Expected: "Jotakin meni pieleen, anteeksi!"`, `Received: "Internal Error"`; `179.1-54-prod-green` and `179.1-54-close` are green. **The fix:** the load reads `session` from `parent()`, redirects only when it reads none, and answers a read that failed with a 503 under `error.default`, with no new load and nobody signed out. **What guards it in the suite that gates:** two tests in `admin-access`, and `routes/admin/(protected)/layout.test.ts`. **What no committed test drives:** a document request with the read failing, which was driven once at planning under a temporary fault and is held by that unit file, because a browser test cannot fail a server's own request.
  **Where it fits:** done, by the operator's ruling. `T-179.1-130` is the wider row, restated in place in `## From plans 51 to 53`.

- The stale tab: after a sign-out in one tab and a sign-in in another, the Admin App's login form stands over a live session (`T-179.1-136`)
  status: accepted
  **Found by:** the code review of plans 51 to 53, `179.1-ENTRY-REVIEW.md`, whose second path of `WR-16` read it as a loop; the first drives refuted that. Accepted by the operator's ruling R1, which they reconfirmed on the measured terms: `AR-179.1-12`.
  **What:** **The form shows no message.** **A reload reaches the home, from both addresses:** two committed tests in `admin-access` hold it, green in `179.1-54-prod-green` and `179.1-54-close`, each shown red by a mutation in `179.1-54-prod-mut-no-gate` and `179.1-54-prod-mut-cookies`. **No loop, measured at planning in both builds.** **After Back a sign-in there ends on the error page:** `T-179.1-140`, below, which this row names and does not take in. **With the session ended elsewhere a navigation inside `/admin` shows the error page:** `T-179.1-137`, below, likewise. **Why the form shows no message, read and UNCONFIRMED:** the page reads its message once, when it is created, and on these paths it is not created again.
  **Where it fits:** stated on the auth page. No server load is added to the Admin App's protected group.

- A sign-in on the standing form after Back ends on the error page (`T-179.1-140`)
  status: resolved
  **Resolved in:** 179.1-64, commit `f990e578a`, as `G-179.1-WR16-4` on the operator's answer "schedule" to UAT test 4 of `179.1-WR16-UAT.md`: the form posts to the login route by its full path, and a sign-in after Back reaches the home, held by a test in `admin-access`. The text below is as plans 54 and 55 left it.
  **Found by:** the planner of plans 54 and 55.
  **What:** **Measured at planning, at HEAD and with the fix alike:** after Back a sign-in ends on the root error page, titled with a parser's message in English, and a reload then reaches the home. After a link a sign-in reaches the home. It also happens at HEAD, and plan 54 did not drive it again. No committed test pins it, because a test that asserts a parser's message would hold a defect in place. **Why, read and UNCONFIRMED:** the form's relative action. It was shown to the operator when they reconfirmed R1, it is undecided, and it is not a ruling.
  **Where it fits:** for the operator, on the UAT list in `179.1-55-SUMMARY.md`: keep it, or schedule it. A fix is a `.svelte` file.

- A session ended in another tab: a navigation inside `/admin` ends on the error page (`T-179.1-137`)
  status: resolved
  **Resolved in:** 179.1-59, commit `9c534470b`, and 179.1-60, commit `6b30cfbb9`, as `G-179.1-WR16-3` on the operator's answer "do the fix" to UAT test 3: after a failed read the load asks the request's own client whether a session is left and goes to the login form when none is, and a browser sign-out sends the other open tabs there at once. The text below is as plans 54 and 55 left it.
  **Found by:** the planner of plans 54 and 55.
  **What:** **Measured in both builds:** a navigation inside `/admin` ends on the error page, titled `error.default`, where HEAD showed the login form, and a reload reaches the login form, in plan 54's runs: `179.1-54-prod-red-r2` read `Received: "Election Compass"` before the fix, and `179.1-54-prod-green` and `179.1-54-close` are green after it. **Measured at planning alone:** a navigation from outside `/admin` goes to the login form, with its message. **The test that holds it:** the one in `admin-access`, in the describe `the Admin App's protected load`. **Why, read and UNCONFIRMED:** the page data still reads the session alive in `parent()`, and the read then fails. It was shown to the operator when they reconfirmed R1, it is undecided, and it is not a ruling.
  **Where it fits:** for the operator, on the UAT list in `179.1-55-SUMMARY.md`: keep it, or schedule it.

- The word "regression" for the loop of `T-179.1-130`
  status: resolved
  **Resolved in:** 179.1-54, by measuring, with no code of its own.
  **Found by:** `179.1-VERIFICATION.md` and the review's table, each by reading.
  **What:** **Measured at planning:** with the load removed from the Admin App's login page at HEAD, in `179.1-planning-probe-wr16-noload-prod`, every looping row read the same, so the loop on the driven paths is not a regression of plan 52. **The limit:** that is HEAD with one load removed, not a build of `8c1c435a2`. The title at the loop's end is `Internal Error`, not `Redirect loop` as the review read.
  **Where it fits:** the verification's word and the review's table are not edited, and the drive does not bear them out on those paths.

- `signOutToLogin`'s docstring said a failed sign-out is logged, and an answer of `{ error }` left no line; the Admin App's path did not have the flaw
  status: resolved
  **Resolved in:** 179.1-54, commit `a0c192b14`.
  **Found by:** the planner of plans 54 and 55, by a drive under a temporary fault.
  **What:** **Measured at planning, in a production server's log:** `179.1-planning-probe-wr16-ssr-head` holds no line `Error logging out`, and `179.1-planning-probe-wr16-ssr-fix` holds `[Contestant App protected layout] Error logging out: probe`. **Measured in the browser's console on the Admin App's path:** `Error logging out: The logout endpoint answered 502`, because `_logout` in `supabaseDataWriter.ts` turns an answer of `{ error }` into a thrown error. **Run:** `signOutToLogin.test.ts` holds both forms, and `179.1-54-unit-mut-unlogged` shows the case can fail. The docstring now says what the code does.
  **Where it fits:** done. The Contestant App's failed sign-out is on the UAT list as a path no committed test drives.

- WR-17: after a sign-out that failed with the cookies cleared, the false message also stays on Help, Privacy and the forgot-password page
  status: accepted
  **Found by:** the code review of plans 51 to 53, `179.1-ENTRY-REVIEW.md`, by reading. Accepted by the operator's ruling of 2026-11-04, "Fix wr-16, accept wr-17".
  **What:** The three pages have no server load and are not entry routes, so nothing there can tell whether the session has gone, and the message stays until the next entry route. The next sign-in stays safe: it shows none, as the review reads it and as test 2 of plan 51 shows on the path it walks. **Read, and not driven in a browser on these three pages:** the effect, the route directories and `ContestantNav`. **Run:** `routes/contestant/layout.svelte.test.ts` states the behaviour on each of the three routes, and `179.1-55-unit-mut-three-pages` shows that case can fail. **On record:** the override on truth 16 in `179.1-VERIFICATION.md`, the row `T-179.1-134` in `179.1-51-PLAN.md`, and `AR-179.1-10` in `179.1-SECURITY.md`. No code: no session read on those pages, and no layout withdraws more than it did.
  **Where it fits:** stated in the guide and on the auth page. The verifier's next run reads the override. The ruling says nothing of the outage row, of a live session, where the message is true, or of `IN-21`.

- `error.403` reads English in the `fr` and `lb` catalogues
  status: resolved
  **Resolved in:** 179.1-56, commit `f203c2ae1`, as `G-179.1-WR16-5`: machine-translated, with no native-reader check, on the operator's answer to UAT test 5. The text below is as plans 54 and 55 left it.
  **Found by:** the planner of plans 54 and 55, by reading the catalogues.
  **What:** **Read:** both hold the English sentence, shown on the new 403 page and already on the login page. No key is edited here: the operator's waiver rules it out.
  **Where it fits:** for the operator, on the UAT list in `179.1-55-SUMMARY.md`: keep it, or schedule the translation.

- IN-21: "never stands on an entry route" is more than holds
  status: resolved
  **Resolved in:** 179.1-66, as `G-179.1-WR16-6`, on the operator's answer "Reword" to UAT test 6: the guide's sentence is reworded, and `IN-21` reads `fixed`. The text below is as plans 54 and 55 left it.
  **Found by:** the code review of plans 51 to 53, `179.1-ENTRY-REVIEW.md`, where the detail stays.
  **What:** **Read there. Run here:** nothing: plans 54 and 55 did not edit the guide's sentence. The stale tab, `T-179.1-136`, is one more place where that sentence says more than holds.
  **Where it fits:** the operator's list; a later plan that edits the guide's § *Logout*.

- IN-22: the Admin App's E2E test and the sign-in step of the Contestant App's test 1 cannot fail on a dev server for the defect they name
  status: open
  **Found by:** the code review of plans 51 to 53, `179.1-ENTRY-REVIEW.md`, where the detail stays.
  **What:** **Read there. Run here:** nothing: plans 54 and 55 did not edit the comments of those two tests.
  **Where it fits:** the operator's list; a later plan on those tests.

- IN-23: `expectGateSendsASessionHome` also accepts a redirect to the login page
  status: open
  **Found by:** the code review of plans 51 to 53, `179.1-ENTRY-REVIEW.md`, where the detail stays.
  **What:** **Read there. Run here:** nothing: plans 54 and 55 did not edit that step, though plan 54 added steps beside it.
  **Where it fits:** the operator's list; a later plan that edits `adminLoginPage.fixture.ts`.

- IN-24: the hook's comparison repeats `isEntryRoute`'s, with nothing holding the two together
  status: open
  **Found by:** the code review of plans 51 to 53, `179.1-ENTRY-REVIEW.md`, where the detail stays.
  **What:** **Read there. Run here:** nothing: `hooks.server.ts` equals its state before plans 54 and 55.
  **Where it fits:** the operator's list; a later plan that touches the hook.

## From plan 56

- D-56-1: `about.organizationMatching.content` answers with its own key for the default setting
  status: open
  **Found by:** plan 56, while deriving the population of variant messages for the compiled-message guard.
  **What:** **Observed:** the compiled message, called with `partyMatchingMethod: 'impute'` (the default of `dynamicSettings.ts`, `OrganizationMatchingMethod` is `'none' | 'answersOnly' | 'impute'`), returns `about.organizationMatching.content` in `en`; `answersOnly` returns its text. Its variants are `partyMatchingMethod=answersOnly`, `=imputed` and `=other`, all literals: the ICU source was a `select` whose `other` was the catch-all, and the conversion made `other` a literal. The voters' About page renders it whenever `organizationMatching !== 'none'`. **Inferred:** the page shows the raw key under its heading for the default setting. Not a plural, so outside the ruling of 2026-11-06 and outside this plan's grant; no catalogue line was changed. The guard of `compiledMessages.test.ts` does not catch it, because it passes a select input only the literals its variants name.
  **Where it fits:** the operator's ruling: `partyMatchingMethod=other` becoming `partyMatchingMethod=*` in the seven catalogues changes no wording and restores the ICU source; whether `imputed` should read `impute` is a second question.

## From plan 65

- D-65-1: `yarn format:check` is red on `apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts`
  status: resolved
  **Resolved in:** 179.1-66, commit `34fa9ba30`: Prettier's layout of one function signature, whitespace only, after `npx prettier --check` on the file answered 1 (`tests/e2e-runs/179.1-unit/179.1-66-d651-check.log`); the `format` row of `179.1-66-gates` is green. The text below is as plan 65 left it.
  **Found by:** plan 65, Task 2 step 3 (`tests/e2e-runs/179.1-unit/179.1-65-gate-format.log`, status 1).
  **What:** **Observed:** Prettier reports code style issues in that one file, which this plan did not touch; it was last changed by `e8c0b8ffb` (plan 60). Every file this plan touched passes `prettier --check`. Out of this plan's scope, so the file was not reformatted.
  **Where it fits:** plan 66's gates, or a `yarn format` of that one file in a later plan.

## From plans 56 to 66

The round of the 18 gaps of `179.1-WR16-UAT.md`, closed by plans 56 to 66.

**The operator's rulings of 2026-11-06, as the gaps' `missing` lines record them:** 8A **app-wide**: the size rule for `.input`, `.btn`, `.select` and `.textarea` revived, so bare buttons and selects go from 14 to 15 px, the visual change and the visual-regression baseline updates accepted. 11B **browser sign-outs only**: every browser-side sign-out (both apps' Log out, the Admin App's `handleError` browser path, the cross-tab `SIGNED_OUT` signal) removes drafts, and a load that merely finds no session removes none, so a lapsed session keeps its draft. 3 **add a sign-out listener**: one browser `onAuthStateChange` `SIGNED_OUT` subscriber sends a stale tab to its app's login form at once, shared with 11A. 7D **fix all plus a guard**: the comma separator in every multi-selector key, `feedback.rating.valueLabel`, the unreachable zero variants (the ICU exact matches restored) and French `many`; a unit test that fails when a compiled message returns its own key; `@inlang/plugin-message-format` pinned to an exact version.

**The UAT's answers and decisions, as its `reported` and `decision` fields record them:** test 1 option (b), for both apps (test 3's scope); test 2 retitle, test code only; test 3 "do the fix", one form for both apps; test 4 schedule, the test asserting the home and never the error message; test 5 machine translation of `error.403`, no native-reader check; test 6 "Reword"; test 10 hold the ✕, Escape and a link's navigation while a sign-out runs; test 11 "Fix all of the three"; test 15 a spinner on Log out. And the decisions this round does not re-decide: test 8 passed (Android's back gesture). Test 9 kept `T-179.1-104` and `T-179.1-103` (apart from the settled outage row), to be entered in the accepted-risks log: `AR-179.1-13` and `AR-179.1-14`. Test 12 kept the two plan-line edits. Test 13 was skipped by the operator, so `179.1-47-close`, plan 46's red row, the status 9 and the slow first route load stay as they were, and the todo stays pending and blocking. Test 14 confirmed the waiver and accepted `B1` to `B3` and `WR-04` to `WR-08` of the earlier round. Test 15 kept items 1 to 5. Test 16: no re-seed. Test 17: `E2E-03` marked in `REQUIREMENTS.md` on the operator's ruling of 2026-11-06. Test 18 passed.

**The UI waiver, replaced gap by gap (the round's rule 4):** visual changes in 8A (app-wide), 15 (the spinner), 7C, 8C and 7B, and nowhere else; message edits in 7D and 5, and new or reworded copy only as plan 56's copy checkpoint approved it; no new component; no UI-SPEC. Machine translation stands on the G-5 precedent, and no native-reader check was filed for the strings of this round.

Each entry says what was measured, what was only read, and which runs. Every run is under `tests/e2e-runs/`: closes under `179.1-e2e/`, unit runs under `179.1-unit/`, production drives under `179.1-prod/` and visual runs under `179.1-visual/`. The chain of closes runs from `179.1-56-close` (678 passed) to `179.1-65-close` (695 passed), each judged against its predecessor's close, and each close that stands is green: `179.1-64-close` was red, and `179.1-64-close-r2` stands for it.

- G-179.1-WR16-1: after a failed sign-out, a protected load goes to the login page when no session is left, in both apps
  status: resolved
  **Resolved in:** 179.1-59, commit `9c534470b`, with the rule in `fde3fe084`.
  **What:** **Measured on a dev server:** a user who is no administrator and whose sign-out fails after clearing the cookies, on a link into the Admin App, ends on the login page, red in `179.1-59-dev-red-entity` and green in `179.1-59-green` and `179.1-59-close`. **Measured in a production build:** `179.1-prod/179.1-59-prod-mut-contestant-plan` green and the extended mutation `179.1-prod/179.1-59-prod-mut-contestant` red on the error page, judge PASS. **Unit only:** the Contestant App's failed sign-out on the server, in `signOutToLogin.test.ts` and `sessionGone.test.ts`; no browser run fails a server's own request.
  **Where it fits:** done. The server-side path is on the UAT list of `179.1-66-SUMMARY.md`.

- G-179.1-WR16-2: the Back test's title says only what it can fail on
  status: resolved
  **Resolved in:** 179.1-64, commit `f990e578a`, test code only.
  **What:** **Run:** the title reads `after a sign-out here and a sign-in in another tab: after Back, a reload reaches the home`, with `expectLoginFormStandsWithNoMessage` dropped from it; `179.1-64-close-r2` pins the old title at 0 and the new at 1.
  **Where it fits:** done.

- G-179.1-WR16-3: with the session ended in another tab, a navigation inside either app's protected area reaches its login form, with no new load
  status: resolved
  **Resolved in:** 179.1-59, commit `9c534470b` (after a failed read the Admin App's protected load asks the request's own client whether a session is left), and 179.1-60, commit `6b30cfbb9` (the sign-out listener, for the paths that make no request).
  **What:** **Measured on a dev server:** `a session ended elsewhere with no signal to this tab: a link from the login form into the app reaches the login form, and so does a reload` in `admin-access`, red in `179.1-59-dev-red-admin`; `… a link in the Contestant App whose page makes a request reaches the login page` in `contestant-entity-selection`, red in `179.1-59-dev-red-entity`; the two-tab tests of plan 60, red in `179.1-60-dev-red-admin` and `179.1-60-dev-red-entity-r2`, green in `179.1-60-close`. No load was added to the Admin App. **Not measured:** WebKit and Firefox.
  **Where it fits:** done. A sign-out made only by a server leaves a residue, below.

- G-179.1-WR16-4: a sign-in on the Admin App's form standing at `/admin` after Back reaches the home
  status: resolved
  **Resolved in:** 179.1-64, commit `f990e578a`; its test's Back step made deterministic by `dd89ee36a`.
  **What:** **Cause confirmed by the diagnosis's differential** (`.planning/debug/179.1-wr16-signout-session-end.md`): the form's relative action. The form now posts to the login route by its full path. **Run:** `after a sign-out here and a sign-in in another tab, a sign-in on the form after Back reaches the home` in `admin-access`, red in `179.1-64-dev-red-admin`; the first close `179.1-64-close` was red on that test's Back (669 passed, 1 failed, 24 did not run), and `179.1-64-close-r2` is green with 694. **Read, not driven:** the register page's `?/dismissRegistered` stays query-only, as no redirect draws that page at another address.
  **Where it fits:** done. Plan 64's reading of the register page is below.

- G-179.1-WR16-5: `error.403` reads in French and in Luxembourgish
  status: resolved
  **Resolved in:** 179.1-56, commit `f203c2ae1`.
  **What:** **Run:** the catalogues hold the translations and `compiledMessages.test.ts` calls every compiled message. Machine-translated, no native-reader check, by the operator's answer. **Not seen:** the page itself in either locale.
  **Where it fits:** done. The pages in use stay on the UAT list.

- G-179.1-WR16-6: the guide no longer says a live session "never stands on an entry route"
  status: resolved
  **Resolved in:** 179.1-66, the commit `docs(179.1-66): the guide's sentence on entry routes, and the component pages in step`, on the operator's answer "Reword" to UAT test 6, which plan 66's ruling 1 takes as lifting `PROH-179.1-24` for this sentence alone.
  **What:** the sentence of § *Logout* says a live session is sent to the app's home whenever a request reaches the gate, and that a page making no request can still stand on an entry route: a page restored from the back-forward cache, a form left open while the user signed in in another tab, and the stale tab of `AR-179.1-12`. **Run:** the docs-links row of `179.1-66-gates`. Nothing else is run: a sentence.
  **Where it fits:** done. `IN-21` reads `fixed`; `IN-22` to `IN-24` stay open.

- G-179.1-WR16-7: the logout modal over an unsaved edit is named by its warning
  status: resolved
  **Resolved in:** 179.1-58, commit `dbef4c445`.
  **What:** **Measured in Chromium:** the dialog's accessible name over an unsaved edit is the warning, red in `179.1-58-dev-red-entity` and `179.1-58-unit-red-2`, green in `179.1-58-close`. **Not established:** what VoiceOver, NVDA or TalkBack say on entry; the late-write cause was eliminated by the diagnosis's measurement, and VoiceOver's reading of descriptions is UNCONFIRMED for this version.
  **Where it fits:** done in the markup; the VoiceOver re-check the gap asks for is on the UAT list.

- G-179.1-WR16-7B: the failed sign-out's message reads its title and Close once each, and a loading button is named once
  status: resolved
  **Resolved in:** 179.1-57, commit `65eaae7bd` (a loading button named once), and 179.1-58, commit `dbef4c445` (one Close for assistive technology, a title distinct from the button).
  **What:** **Measured in Chromium:** one Close and the new title, `the failed sign-out's message is named apart from Log out and has one Close` in `admin-access` and its twin in `contestant-entity-selection`, red in `179.1-58-dev-red-admin` and `179.1-58-dev-red-entity`; `Button.svelte.test.ts`, red in `179.1-57-unit-red-1`. **UNCONFIRMED:** why VoiceOver doubled the title; the Admin App, where no focus moves, is the differential, on the UAT list. **Read:** an `Alert` with no actions, such as a `Notification`, now hides its ✕ from assistive technology.
  **Where it fits:** done in the markup; the reader checks are on the UAT list.

- G-179.1-WR16-7C: the Admin App's login screen uses the shared field for its email
  status: resolved
  **Resolved in:** 179.1-64, commit `f990e578a`.
  **What:** **Run:** `the login form labels its email field, and typing enables the sign-in` in `admin-access`, red in `179.1-64-dev-red-admin`, green in `179.1-64-close-r2`. The visible label is 7C's granted visual change. **Not seen by anyone:** its look in both themes at 320 to 390 px.
  **Where it fits:** done; the look is on the UAT list.

- G-179.1-WR16-7D: every compiled message answers with text, and a guard fails when one returns its key
  status: resolved
  **Resolved in:** 179.1-56, commits `49a6b4a10` and `f203c2ae1`.
  **What:** **Run:** the comma separator in every multi-selector key, the ICU exact matches restored, French `many`, the plugin pinned; `compiledMessages.test.ts`, one case per message key, red in `179.1-56-unit-red-1` and `179.1-56-unit-red-2`, green since. The modal's count of what is left reads a sentence. Copy decisions C1 to C6 were taken as (a) at plan 56's checkpoint.
  **Where it fits:** done. Two findings of the same work are open below, and `D-56-1` under `## From plan 56`.

- G-179.1-WR16-8A: the typed text and the controls are at the body's size, app-wide
  status: resolved
  **Resolved in:** 179.1-65, commit `e811fd2f1`.
  **What:** **Run:** `sign-in screen: the typed text and the button are at the body's size` in `contestant-entry-scan`, red in `179.1-65-dev-red-entry`; the visual baselines `voter-results-desktop.png` and `voter-results-mobile.png` regenerated in the container (`179.1-visual/179.1-65-visual-red-r2` red on pixels, `-rebaseline`, `-visual-green`). **Measured by a probe:** the blast radius, in Chromium and WebKit at 390 x 844. **Not measured:** iOS Safari's 16 px floor and zoom on focus.
  **Where it fits:** done. The blast radius is below, for the operator.

- G-179.1-WR16-8B: the password field neither capitalises nor corrects
  status: resolved
  **Resolved in:** 179.1-64, commit `f990e578a`, in the markup.
  **What:** **Run:** `Input.password.svelte.test.ts`, `asks the platform not to capitalise, correct or spell-check, masked and revealed`, red in `179.1-64-unit-red-1`. **Not measured:** iOS Safari, masked and revealed.
  **Where it fits:** done in the markup; iOS is on the UAT list.

- G-179.1-WR16-8C: a press of the password toggle leaves focus on the field with nothing selected
  status: resolved
  **Resolved in:** 179.1-64, commit `f990e578a`.
  **What:** **Run:** the cases of `Input.password.svelte.test.ts` on focus, caret and selection, in both directions, and a pointer press that does not take focus. **Not measured:** iOS selection on the programmatic focus, and whether the keyboard stays up.
  **Where it fits:** done; iOS is on the UAT list.

- G-179.1-WR16-10: while a sign-out runs, the ✕ and Escape keep the modal open and a link waits without a question
  status: resolved
  **Resolved in:** 179.1-62, commit `04a6bccb5`.
  **What:** **Run in Chromium on a dev server:** two tests in `contestant-entity-selection`, red in `179.1-62-dev-red-entity` and `179.1-62-dev-red-entity-2`, green in `179.1-62-close`; unit cases in `ModalContainer`, `TimedModal`, `navigationGuards` and `PreventNavigation`. **Read, not run:** a Back during a sign-out that then fails is followed forward with `goto`, not back in the history. **Not measured:** Escape, the back gesture and a forced close outside Chromium.
  **Where it fits:** done; the browsers and readers are on the UAT list.

- G-179.1-WR16-11A: a second open tab neither keeps the user's data after a sign-out nor stores the drafts again
  status: resolved
  **Resolved in:** 179.1-60, commit `6b30cfbb9`.
  **What:** **Run in Chromium on a dev server:** `a sign-out in another tab sends this tab to the login screen at once, and its draft is not stored again` in `contestant-entity-selection` and `a sign-out in another tab sends this tab to the login page at once` in `admin-access`; unit cases on `onSignOut` and on a persisted handle following another document's change. **Not measured:** WebKit and Firefox, a long-backgrounded or frozen tab receiving the signal.
  **Where it fits:** done; the browsers are on the UAT list.

- G-179.1-WR16-11B: every browser sign-out removes the Contestant App's drafts, in both apps
  status: resolved
  **Resolved in:** 179.1-61, commit `7e33fe208`.
  **What:** **Run on a dev server:** `the Admin App's Log out leaves no Contestant App draft in the browser` in `admin-access`; `a user who is no administrator, on a link into the Admin App, is signed out with no draft left` and the renamed `… ends on the login page, with no draft left` in `contestant-entity-selection`; red in `179.1-61-dev-red-admin` and `179.1-61-dev-red-entity`. **Within the ruling's bounds, read:** a lapsed session keeps its draft, and so do a server-side sign-out (a full load of `/admin` by a non-administrator among them) and a failed sign-out with the session left (`T-179.1-104`).
  **Where it fits:** done, browser sign-outs only, as ruled.

- G-179.1-WR16-11C: a user who walks away during the count is signed out even when its timer does not run
  status: resolved
  **Resolved in:** 179.1-63, commit `04065a3ae`. The re-verification of 2026-11-07 reopened it (`CR-01` of `179.1-WR16G-REVIEW.md`), and 179.1-67 (`30f55496e`) and 179.1-68 (`4f351c6f3`) resolved it again: see § `From plans 67 to 69`. The text below is as plan 66 left it.
  **What:** **Run on a dev server:** a count left in a tab that closes ends the session at the browser's next request, with no draft left, and a count whose timer did not run signs out when the tab is shown again, both in `contestant-entity-selection`, red in `179.1-63-dev-red-entity` and `-2`; the count follows the wall clock, in `TimedModal.svelte.test.ts`. **Not induced:** a real frozen tab, a locked phone, a closed lid. **Read, not run:** where the server's clock and the browser's disagree, a document can clear the cookie without removing drafts the server's sign-out already ended the session of; a document restored from the back-forward cache before the deadline clears the cookie while its modal may still count.
  **Where it fits:** done for the closed and the resumed tab. A browser that never returns keeps its session: the hosted bound is below.

- G-179.1-WR16-15: Log out shows a spinner and is disabled while the sign-out runs, in both apps
  status: resolved
  **Resolved in:** 179.1-57, commit `65eaae7bd`.
  **What:** **Run on a dev server:** one test in `admin-access` and one in `contestant-entity-selection`, red in `179.1-57-dev-red-admin` and `179.1-57-dev-red-entity`, green in `179.1-57-close`. **Inferred, not run:** where the Contestant App's Log out opens the modal, the header trigger also spins while the modal's sign-out runs.
  **Where it fits:** done; the look at 320 to 390 px and in dark is on the UAT list.

What the round leaves, for the operator. No ruling is attributed to them on any of these.

- Plan 60's residue: a sign-out made only by a server in another tab reaches an open tab only at its next request
  status: open
  **Found by:** 179.1-59 and 179.1-60.
  **What:** **Read:** a server-only sign-out sends no browser signal, so in a tab that stays open a navigation that makes no request and runs no load shows the page as it stood, in both apps, until the tab's next request reaches the gate. Browser sign-outs reach every open tab at once, measured. Stated on the auth page's Known residuals.
  **Where it fits:** the operator's: keep it, or ask for a signal from the server to an open tab, which nothing sends today.

- The hosted session bound of plan 63
  status: open
  **Found by:** 179.1-63.
  **What:** **Read:** a browser that never returns keeps its session; the outer bound would be the hosted `[auth.sessions]` time-box or inactivity timeout, Pro-only and acting at the next refresh. Recorded, not configured: no `config.toml` edit in this round.
  **Where it fits:** the operator's, with the deployment.

- Plan 64's reading of the register page
  status: open
  **Found by:** 179.1-64, on G-4's third `missing` line.
  **What:** **Read, not driven:** the register page's Dismiss posts to `?/dismissRegistered`, which resolves against the address the page stands at; no redirect under `apps/frontend/src` draws that page at another address, so nothing was changed and no test was written.
  **Where it fits:** the operator's: accept the reading, or ask for a drive.

- The blast radius of plan 65's size rule
  status: open
  **Found by:** 179.1-65.
  **What:** **Measured by a probe in Chromium and WebKit at 390 x 844:** bare `.btn`, `.select`, `.textarea` and `.input` go from 14 to 15 px app-wide, `.btn-sm` controls among them (a modal's ✕, the Jobs feature's small buttons); the table is in `179.1-65-SUMMARY.md`. **Not seen by anyone:** the pages at 320 to 390 px in light and dark.
  **Where it fits:** the operator's look, on the UAT list.

- The device and reader checks no run of this round establishes
  status: open
  **Found by:** the round's rule 15.
  **What:** what VoiceOver, NVDA or TalkBack say; iOS Safari and Android Chrome; a real frozen tab, a locked phone and a closed lid; WebKit and Firefox for the two-tab paths and Escape. **Run:** none of them.
  **Where it fits:** the UAT list of `179.1-66-SUMMARY.md`, item by item.

- The open findings of the two reviews
  status: open
  **Found by:** `179.1-WR16-REVIEW.md` (`WR-04`, `IN-01` to `IN-05`) and `179.1-ENTRY-REVIEW.md` (`IN-22` to `IN-24`), where the detail stays.
  **What:** **Run here:** nothing; their lines were left word for word, by the round's rule 17.
  **Where it fits:** the operator's list, each with what its review proposes.

- `questions.category.numQuestions` at -1 reads empty
  status: closed (operator 2026-11-10, `179.1-WR16I-UAT.md` test 10: confirmed empty)
  **Found by:** 179.1-56, restoring the ICU exact matches.
  **What:** **Read, in plan 56's catalogue diff:** the ICU original's `=-1 {}` is restored in the seven catalogues, so the message the category page passes -1 to when it has no question block now reads empty, as its source did, where it read `-1 questions`. No wording was invented.
  **Where it fits:** the operator's: confirm, or overrule with a wording.

## From plans 67 to 69

The gap the re-verification of 2026-11-07 left in `179.1-VERIFICATION.md`, `G-179.1-WR16-11C` (its four `missing` lines, and the `behavior_unverified_items` entry on plan 63's truths 3 and 4), with `CR-01`, `WR-01` to `WR-03` and `IN-08` of `179.1-WR16G-REVIEW.md`, the code review of plans 56 to 66. Closed by plans 67 and 68; plan 69 holds the records, the gates, the production drive and the final run.

**The operator's answer at 179.1-67's checkpoint (Task 2, on `WR-01`, `WR-02` and `WR-03`), word for word, as `179.1-67-SUMMARY.md` records it:** `a`

`179.1-67-SUMMARY.md` reads it as option a of plan 67: Log out is browser-wide and the browser keeps the deadline; `WR-01` and `WR-03` are fixed, and `WR-02` is accepted as designed. No other ruling is attributed to the operator in this section.

Each entry says what was measured, what was only read, and which runs. Every run is under `tests/e2e-runs/`: closes and dev-server controls under `179.1-e2e/`, unit runs under `179.1-unit/`. The chain of closes: `179.1-67-close` (697 passed, head `63a0b5b5d`), judged against `179.1-66-final-r2` with `--except contestant-entity-selection=2`; `179.1-68-close` (699 passed, head `1463eb898`), judged against `179.1-67-close` with `--except contestant-entity-selection=2`; neither has a void marker. Plan 69's gates, production drive and final run are in `179.1-69-SUMMARY.md`.

- G-179.1-WR16-11C (CR-01): a tab that met the deadline sign-out through a client-side request signs in again and keeps the session
  status: resolved
  **Resolved in:** 179.1-67, commit `30f55496e` (the server settles a deadline it has acted on, so a sign-in after it keeps its session), carried onto the two cookies by 179.1-68, commit `4f351c6f3`.
  **What:** **Measured on a dev server:** `the header's Log out: once a count left in a closed tab has signed out a tab that was already open, a sign-in there keeps the session, with no draft and no deadline left` in `contestant-entity-selection`, red in `179.1-67-dev-red-entity-r2` (`Error: expect(page).toHaveURL(expected) failed` at `expectLedToSettings`), green in `179.1-67-green`, `179.1-67-close` and `179.1-68-close`. **Unit:** `settleLogoutDeadline` and `handle — the logout deadline`, red in `179.1-67-unit-red-1`; the mutations `179.1-67-unit-mutation-1` and `-3` red. **Read, not run:** the identity provider's callback and the Admin App's sign-in after a deadline sign-out pass through the same hook. **Not run:** WebKit, Firefox, a real closed browser.
  **Where it fits:** done. The gap's fourth `missing` line was decided by the operator's `a`.

- The clearing truths of plan 63 (truths 3 and 4, the gap's `behavior_unverified_items` entry)
  status: resolved
  **Resolved in:** 179.1-67, commit `87fce5c4e`, test code only.
  **What:** **Measured on a dev server:** Continue, the ✕, Escape, a close the platform makes and a navigation each remove the cookie, and a failed sign-out at the count's end leaves none: steps added to three tests of `contestant-entity-selection` whose titles did not change, and the new `the header's Log out with tasks left: a reload of the tab during the count removes the deadline, and the session stays`. The four titles were red at `expectNoLogoutDeadline` under the mutation `179.1-67-dev-mut-entity-r2` and green in `179.1-67-dev-green-entity`, `179.1-67-close` and `179.1-68-close`. **Unit:** `LogoutButton — the deadline's cookie` (9 cases), red under `179.1-67-unit-mutation-2`. **Reached by no mutation run:** the Stay test's step after the modal's Log out, pinned by the unit case `the modal's Log out finds it gone when \`logout\` is called`.
  **Where it fits:** done.

- WR-01: the deadline is the expiry the browser keeps, so no clock disagreement moves it
  status: resolved
  **Resolved in:** 179.1-68, commit `4f351c6f3`, its failing cases first in `4abbf775c`.
  **What:** **Measured on a dev server:** `the header's Log out with tasks left: with the page's clock five minutes behind the server's, a request made while the modal counts keeps the session` in `contestant-entity-selection`, red in `179.1-68-dev-red-entity` (`Received: 303` at `expectStillSignedIn`), green in `179.1-68-dev-green-entity`, `179.1-68-green` and `179.1-68-close`. **Unit:** `logoutDeadline.test.ts` rewritten for the two cookies, red in `179.1-68-unit-red-1`; the mutation `179.1-68-unit-mutation-1` red. **Not run:** a device whose operating-system clock is off; the test moves the page's JavaScript clock. **Read, not run:** `logout-deadline` lives for the count plus 10 s while the modal's own count runs on the page's timers, so a page whose timers are throttled past those 10 s is signed out by the server rather than by its own flow, as before.
  **Where it fits:** done; a device whose clock is off is on the UAT list.

- WR-03: only the tab that held the modal removes its count
  status: resolved
  **Resolved in:** 179.1-68, commit `4f351c6f3`, its failing cases first in `f5882f1ea`.
  **What:** **Measured on a dev server:** `the header's Log out on a question with an unsaved answer: a page opened in another tab during the count leaves it, and the count's tab, closed, still ends the session at the browser's next request` in `contestant-entity-selection`, red in `179.1-68-dev-red-entity-2` (`Error: the cookies of the logout modal's count` at the second tab's `expectLogoutDeadlineSet`), green in `179.1-68-green` and `179.1-68-close`; plan 67's reload test stays green on the two cookies. The mutation `179.1-68-dev-mut-entity` turned exactly three titles red at the login-screen step. **Unit:** `logoutDeadline.test.ts` › `the tab that held the modal` (9 cases), red in `179.1-68-unit-red-2`. **Unit only, not driven:** a page restored from the back-forward cache with its modal still counting keeps its count.
  **Where it fits:** done; the back-forward cache is open below.

- IN-08: a copy of the deadline cookie planted for a parent domain
  status: resolved
  **Resolved in:** 179.1-68, commit `4f351c6f3`.
  **What:** **Unit only:** more than one `logout-pending` value signs nothing out, and every copy of both cookies is expired, host-only and for each parent domain (`logoutDeadline.test.ts`, `hooks.server.test.ts`); no E2E origin has a parent domain. **The bound:** a copy planted with a path other than `/` is reached by no removal, and the `__Host-` prefix that would close it over HTTPS is not built; the auth page says so. That residue is open below.
  **Where it fits:** done within that bound.

- WR-02: closing the tab that held the modal ends the session in every tab of that browser, and removes their drafts
  status: accepted
  **Accepted on:** the operator's answer `a` at 179.1-67: Log out is browser-wide. The accepted-risk row is `AR-179.1-15` (threat `T-179.1-181`) in `179.1-SECURITY.md`; the guide's § Logout states it, by `f432ac66a`.
  **What:** **Measured on a dev server:** the closed-tab half of WR-03's test above, and plan 63's `a count left in a tab that closes ends the session`, green on the two cookies in `179.1-68-close`. **Not run:** a real closed browser, WebKit and Firefox.
  **Where it fits:** accepted, as ruled.

What the round leaves, for the operator. No ruling is attributed to them on any of these.

- A `logout-pending` copy planted with a path other than `/`
  status: open
  **Found by:** 179.1-68, the bound of IN-08.
  **What:** **Read:** no removal reaches such a copy; the `__Host-` prefix would close it over HTTPS and is not built. Stated on the auth page.
  **Where it fits:** the operator's: keep it, or ask for the `__Host-` prefix.

- Safari's cap on the life of a cookie a page writes
  status: open
  **Found by:** 179.1-68.
  **What:** **Read, not run:** Safari caps the life of a cookie that a page's script writes, and `logout-pending` asks for 400 days. What the cap does to a count left in a closed tab is not established by any run.
  **Where it fits:** the operator's, on the UAT list.

- Two modals counting in two tabs at once
  status: open
  **Found by:** 179.1-68.
  **What:** **Read, not run:** both share one pair of cookies, and the last write stands.
  **Where it fits:** the operator's, on the UAT list.

- The identity provider's callback and the Admin App's sign-in after a deadline sign-out
  status: open
  **Found by:** 179.1-67 and 179.1-68.
  **What:** **Read, not run:** both are covered by the same hook, which runs before the gate on every request.
  **Where it fits:** the operator's, on the UAT list.

- A page restored from the back-forward cache with its modal still counting
  status: open
  **Found by:** 179.1-68.
  **What:** **Unit-tested, not driven:** the page keeps its count.
  **Where it fits:** the operator's, on the UAT list.

- IN-01: the deadline hook lets the request through when the sign-out fails
  status: open
  **Found by:** `179.1-WR16G-REVIEW.md`, where the detail stays.
  **What:** **Read, the finding's present state and not a ruling:** plan 67's hook writes no marker after a failed sign-out, so the next request tries again; the request that met the failure goes through with its session. The review proposes stating that in the hook's docblock, or removing the session cookies in that branch.
  **Where it fits:** the operator's, with the other open findings of that review.

## From plans 70 to 79

The seven gaps of `179.1-WR16H-UAT.md` § Gaps, `G-179.1-WR16H-1`, `-2`, `-3`, `-5`, `-9`, `-10` and `-11`, with `WR-01` and `WR-02` of `179.1-WR16H-REVIEW.md` (the code review of plans 67 to 69) and `WR-04` and `WR-06` of `179.1-WR16G-REVIEW.md` (the code review of plans 56 to 66). Closed by plans 70 to 78 and the gap-closure plan 80; plan 79 holds the records, the gates, the production drive and the final run.

**The operator's rulings at the WR16H UAT, word for word, as its `reported` lines record them:**

- Test 1: `all ★ — schedule the review's fix: withdraw every count at any sign-out or sign-in the application makes, in one shared helper so hooks.server.ts stays untouched`
- Test 2: `all ★ — fix: include the host itself in every removal (page and server) and correct the auth guide's sentence; IN-08 no longer reads fixed`
- Test 3: `all ★ — raise a copy and announcement item: the login page says why after a deadline sign-out or a sign-out from another tab`
- Test 5: `all ★ — schedule WR-06 (password toggle keeps keyboard focus, exposes aria-pressed) and WR-04 (a held Back replayed as a traversal); accept IN-01 to IN-06 of the 67-69 review and WR-05, IN-01 to IN-07 of the 56-66 review`
- Test 9: `all ★ — fix the untranslated French Admin login line (measured: the whole fr and lb adminApp.login catalogue is identical to en)`
- Test 10: `all ★ — raise the 320 px logo overlap on the admin login and the wrapped "Mot de passe" label as cosmetic fixes`
- Test 11: `all ★ — apply the wording-free fix: partyMatchingMethod=other becomes the catch-all in the seven catalogues`

**The operator's answer at 179.1-70's checkpoint, word for word, as `179.1-70-SUMMARY.md` § The decisions records it:** `approved for all * except for C5 use (b) (translate now)`

`179.1-70-SUMMARY.md` reads it as `C1` to `C9` = a, except `C5` = b: the eight other `adminApp.*` files are translated in this round, by plan 80. No other ruling is attributed to the operator in this section.

Each entry says what was measured, what was only read, and which runs. Every run is under `tests/e2e-runs/`: closes, targeted runs and dev-server controls under `179.1-e2e/`, unit runs under `179.1-unit/`. The chain of closes: `179.1-70-close` (699 passed, head `e85114081`) against `179.1-69-final`; `179.1-80-close-r2` (699, `ef05f76be`) against `179.1-70-close`; `179.1-71-close` (700, `12257e980`), `179.1-72-close` (701, `6f2145fc1`), `179.1-73-close` (702, `9756e3857`) and `179.1-74-close` (702, `ff1fd4160`), each against the one before. Plans 75 to 78 made no full run, by the operator's ruling of 2026-11-09 (rule 20 of plan 70); each made its targeted green runs: plan 75 one per project (`179.1-75-targeted-<project>`), and plans 76 to 78 one `perm-closed-project` run each, `179.1-76-targeted-perm-closed-project` (703 passed), `179.1-77-targeted-perm-closed-project` (705) and `179.1-78-targeted-perm-closed-project` (707), each reaching the whole suite. The round's full run is `179.1-79-final`, in `179.1-79-SUMMARY.md`.

- G-179.1-WR16H-1 (`WR-01` of the review of plans 67 to 69): a sign-in after an explicit Log out keeps its session
  status: resolved
  **Resolved in:** 179.1-71, commits `330fbf71e` (failing cases) and `bbd00a2c7` (a Log out withdraws every logout count); 179.1-72, commits `506039868`, `75896279f` and `c37d91ce8` (failing cases) and `47057aa42` (every sign-in withdraws the logout count, through one helper); 179.1-73, commits `361829f73` and `74eed2b63` (failing cases) and `d5688275e` (every server sign-out withdraws the logout count); the guide by `32964dddd` and `8e0c75aae`. The fix leaves `hooks.server.ts` untouched: the round's one edit of that file is plan 71's, the list of domains in `logoutDeadlineHandle`'s `'duplicated'` branch, for `G-179.1-WR16H-2`.
  **What:** **Measured on a dev server**, in `contestant-entity-selection`: `a Log out in another tab withdraws the count of a closed tab, so a sign-in after it keeps the session`, red in `179.1-71-dev-red-entity` (`Error: the cookies of the logout modal's count` at `expectNoLogoutDeadline`), green in `179.1-71-close`; `once the session has ended with no Log out, a sign-in withdraws the count of a closed tab and keeps the session`, red in `179.1-72-dev-red-entity`, green in `179.1-72-close`; `a sign-out the server makes removes the count of a closed tab at once`, red in `179.1-73-dev-red-entity`, green in `179.1-73-close`; all three green in `179.1-74-close` and in the targeted runs of plans 76 to 78. **Unit:** `withdrawAnyCount`, `withdrawLogoutCount` and the sign-in and sign-out sites' `the logout count` cases, red in `179.1-71-unit-red-1`, `179.1-72-unit-red-1`, `-2` and `-3`, `179.1-73-unit-red-1` and `-2`. **Unit-tested or read, not driven:** the identity provider's callback, the confirm page's sign-in and the Admin App's sign-in withdrawing a count. **Not run:** WebKit, Firefox, a real device.
  **Where it fits:** done; the paths not driven are on the operator's UAT list.

- G-179.1-WR16H-2 (`WR-02` of the review of plans 67 to 69): a copy planted for the host's own domain is removed
  status: resolved
  **Resolved in:** 179.1-71, commits `0efc55c14` (failing cases) and `bbd00a2c7` (every removal reaches the host's own domain, page and server); the auth guide's sentence by `32964dddd`.
  **What:** **Unit only:** `removalDomainsOf` (7 cases) and the hook's apex case, `on an apex host, two different pending ids sign nothing out and expire both names host-only and for the host's own domain`, red in `179.1-71-unit-red-2`, green in `179.1-71-unit-green-2`. **Not run:** no E2E origin has a domain to plant for (every origin is `localhost` or `127.0.0.1`). The bound of a copy with a path other than `/` stays, recorded in § `From plans 67 to 69`.
  **Where it fits:** done within that bound; a real apex deployment is on the operator's UAT list.

- G-179.1-WR16H-3: the login page says why after a deadline sign-out or a sign-out made in another tab
  status: resolved
  **Resolved in:** 179.1-74, commits `2d1a1ef68` (the two sentences, seven locales), `263179203` (failing cases) and `43b82444e` (the Contestant App, the server's sign-out at a count's end); 179.1-75, commits `a5f2a5aff` (failing cases) and `21882d8f8` (a count's end in its own tab and a followed sign-out); 179.1-76, commits `e7a72fb7d` and `136226de3` (failing cases) and `00915097b` (the Admin App); the guide by `0e2bdf08f`, `854dae874` and `c951a46f6`.
  **What:** **Measured on a dev server:** in `contestant-entity-selection`, the renamed `… on a login screen that says why, with no draft left`, red in `179.1-74-dev-red-entity` (`getByTestId('login-notice')` not visible), green in `179.1-74-close`; the renamed `a sign-out in another tab sends this tab at once to a login screen that says why, …` and `… the end of its count leaves a login screen that says why`, red with four rewritten titles in `179.1-75-dev-red-entity`, green in `179.1-75-dev-green-entity` and the targeted runs; in `admin-access`, the renamed `a sign-out in another tab sends this tab at once to a login page that says why` and the new `a count the browser has let run out ends the session at the next request, on a login page that says why`, red in `179.1-76-dev-red-admin` and `-2`, green in `179.1-76-dev-green-admin-2` and the targeted runs. **Asserted as Chromium computes it, not heard:** the alert and the heading's description. **Not established:** what VoiceOver, NVDA or TalkBack say; a tab that reaches the login page after another tab met the server's sign-out shows no reason (C3), open below.
  **Where it fits:** done; the screen reader and the sentences on screen are on the operator's UAT list.

- G-179.1-WR16H-5 (`WR-06` and `WR-04` of the review of plans 56 to 66): the password toggle keeps keyboard focus and says whether it is pressed; a held Back is followed as a Back
  status: resolved
  **Resolved in:** 179.1-77, commits `3746f78d7` and `6eb7b1be5` (failing cases) and `6e3e0b8c5` (the fix, with `LogoutButton.svelte`'s per-instance navigation callback); the guide by `5c22dbc82`.
  **What:** **Measured on a dev server:** `the sign-in form's password toggle, pressed from the keyboard, keeps the focus and says whether it is pressed` in `contestant-email-registration`, red in `179.1-77-dev-red-reg` (`toBeFocused()` after Space), green in `179.1-77-dev-green-reg`; `the header's Log out when the sign-out fails: a Back pressed while it runs is followed as a Back, and Forward returns to the page` in `contestant-entity-selection`, red in `179.1-77-dev-red-entity` and `-2`, green in `179.1-77-dev-green-entity`; both green in `179.1-77-targeted-perm-closed-project` and `179.1-78-targeted-perm-closed-project`. **Unit:** `Input.password.svelte.test.ts` and `navigationGuards.test.ts`, red in `179.1-77-unit-red-1` and `-2`. **Unit only, not driven:** a Back held during the logout modal's own sign-out. **Not run:** VoiceOver, NVDA, TalkBack, WebKit, Firefox, a phone's back gesture.
  **Where it fits:** done; those are on the operator's UAT list.

- G-179.1-WR16H-9: the Admin App's login page, and its other pages, in French and Luxembourgish
  status: resolved
  **Resolved in:** 179.1-70, commits `60471c738` (failing case) and `aa689f973` (`adminApp.login`, 13 strings); 179.1-80, commits `948cf8bf4` (the approved-strings check reads every plan's strings), `1f256159c` (failing case) and `1bbb80e65` (the eight other `adminApp.*` files, 108 strings), by the answer C5 = b.
  **What:** **Unit:** `translations.test.ts` › `no catalogue file of another locale is a copy of the base locale's`, red in `179.1-70-unit-red-2` and `179.1-80-unit-red-1`, green after; `179.1-approved-strings.mjs` equal for every string (`179.1-80-strings-green`, 324 compared). **Not established:** nobody has seen these strings on screen, and no native reader has read them; the todo `2026-11-10-179-1-fr-lb-strings-native-reader.md` names every key.
  **Where it fits:** done; the screens and the native reader are on the operator's UAT list. No `adminApp.*` file is left untranslated, so there is no open entry for them.

- G-179.1-WR16H-10: the French password label stays on one line, and the Admin App's illustration leaves the logo clear
  status: resolved
  **Resolved in:** 179.1-78, commit `f0748186d`.
  **What:** **Measured on a dev server:** in `contestant-entry-phone`, `phone 390: in French, the password label stays on one line beside the reveal toggle`, red in `179.1-78-dev-red-phone`, and `phone 320: the Admin App's login illustration leaves the header's logo clear`, red in `179.1-78-dev-red-phone-2`; both green in `179.1-78-dev-green-phone-3` and `179.1-78-targeted-perm-closed-project`. The visual project green with no baseline changed (`179.1-78-visual-final`). Every hero image now starts below the top bar. **Not run:** a real phone, WebKit, Firefox, a deployment's own poster or header image settings, the settings page's rows.
  **Where it fits:** done; plan 78's screenshots and those items are on the operator's UAT list.

- G-179.1-WR16H-11: the About page explains party matching for the default method
  status: resolved
  **Resolved in:** 179.1-70, commits `026fea316` (failing cases) and `47b491ed4` (`=imputed` became `=impute` and `=other` became `=*` in the seven catalogues, no wording changed).
  **What:** **Unit:** `compiledMessages.test.ts` › `the party-matching sentence, for every method the About page passes` (14 cases), red in `179.1-70-unit-red-1`. **Measured on a dev server:** the rewritten fixture step `expectOrgMatchingDisclosure` in `perm-org-matching`, red in `179.1-70-dev-red-org-r3`, green in `179.1-70-dev-green-org` and `179.1-70-close`. **Not established:** the sentence on screen in a locale other than English.
  **Where it fits:** done.

- WR-01 of the review of plans 67 to 69
  status: resolved
  **Resolved in:** see `G-179.1-WR16H-1` above.

- WR-02 of the review of plans 67 to 69
  status: resolved
  **Resolved in:** see `G-179.1-WR16H-2` above.

- WR-04 of the review of plans 56 to 66
  status: resolved
  **Resolved in:** see `G-179.1-WR16H-5` above.

- WR-06 of the review of plans 56 to 66
  status: resolved
  **Resolved in:** see `G-179.1-WR16H-5` above.

- IN-08 of the review of plans 56 to 66: a domain-scoped deadline cookie
  status: resolved
  **Resolved in:** 179.1-68, commit `4f351c6f3`, for the proper parent domains, and 179.1-71, commit `bbd00a2c7`, for the host's own domain; by the answer C9 = a.
  **What:** 179.1-68 closed it only partly, as `WR-02` of the review of plans 67 to 69 found: a copy for the host's own domain was never removed. 179.1-71 closed the rest (`G-179.1-WR16H-2` above). The bound of a copy with a path other than `/` is still recorded, open in § `From plans 67 to 69`. `179.1-WR16G-REVIEW-DISPOSITION.md` reads `disposition: fixed` with that note.
  **Where it fits:** done within that bound.

- IN-01 to IN-06 of the review of plans 67 to 69, and WR-05 and IN-01 to IN-07 of the review of plans 56 to 66
  status: accepted
  **Accepted on:** the operator's ruling at UAT test 5, word for word: `all ★ — schedule WR-06 (password toggle keeps keyboard focus, exposes aria-pressed) and WR-04 (a held Back replayed as a traversal); accept IN-01 to IN-06 of the 67-69 review and WR-05, IN-01 to IN-07 of the 56-66 review`. The register rows the audits leave open on these findings alone are `AR-179.1-16` (`T-179.1-180`), `AR-179.1-17` (`T-179.1-175`) and `AR-179.1-18` (`T-179.1-182`) in `179.1-SECURITY.md`. The two disposition files read `disposition: accepted` for each.
  **What:** not worked on, as rule 15 of plan 70 says; the lines they name are left as they were, except the list of domains of the hook's `'duplicated'` loop that `IN-04` names, which plan 71 changed for `G-179.1-WR16H-2`. The IN-01 entry of § `From plans 67 to 69` above is this ruling's `IN-01` of the review of plans 56 to 66.
  **Where it fits:** accepted, as ruled.

What the round leaves, for the operator. No ruling is attributed to them on any of these.

- A tab that reaches the login page after another tab has already met the server's sign-out shows no reason (C3)
  status: open
  **Found by:** 179.1-70's checkpoint item C3, answered a: no reason cookie is added.
  **What:** as `179.1-70-SUMMARY.md` records C3 = a: "A tab that reaches the login page after another tab has already met the server's sign-out shows no reason. No reason cookie is added." No run drives such a tab.
  **Ruled:** confirmed as designed by the operator 2026-11-10 (`179.1-WR16I-UAT.md` test 9).

- `questions.category.numQuestions` at -1 reads empty
  status: closed (operator 2026-11-10, `179.1-WR16I-UAT.md` test 10: confirmed empty)
  **Found by:** UAT test 11, not ruled: "Also `questions.category.numQuestions` at -1 reading empty."
  **What:** **Read:** the message returns `''` for -1 by an explicit branch. Nothing in this round changed it.
  **Where it fits:** the operator's.

- Screen-reader pass (VoiceOver; NVDA and TalkBack where at hand) of the logout modal, the failed sign-out message, the loading button, the password toggle and the login page after a sign-out by a count
  status: deferred
  **Deferred at:** 2026-11-08, UAT test 6, as the UAT's § Deferred Follow-Ups records it.
  **Where it fits:** kept deferred 2026-11-10 (`179.1-WR16I-UAT.md` tests 12-14) and promoted to ROADMAP Phase 999.2.

- iOS Safari: 16 px fields with no zoom on focus, the password field; the back gesture and Escape during a sign-out on Android Chrome, Safari and Firefox
  status: deferred
  **Deferred at:** 2026-11-08, UAT test 7, as the UAT's § Deferred Follow-Ups records it.
  **Where it fits:** kept deferred 2026-11-10 (`179.1-WR16I-UAT.md` tests 12-14) and promoted to ROADMAP Phase 999.3.

- The logout count on real hardware: a closed browser, device clock skew, a frozen tab, a locked phone, a closed lid, Safari's cap on page-written cookies; T-179.1-166 (a browser that never returns keeps its session) has no ruling
  status: deferred
  **Deferred at:** 2026-11-08, UAT test 8, as the UAT's § Deferred Follow-Ups records it.
  **Where it fits:** kept deferred 2026-11-10 (`179.1-WR16I-UAT.md` tests 12-14) and promoted to ROADMAP Phase 999.4.

## From plans 81 to 85

The six gaps of `179.1-WR16I-UAT.md` § Gaps, `G-179.1-WR16I-1`, `-2`, `-3`, `-4`, `-5` and `-7`, and the five findings of `179.1-WR16I-REVIEW.md` (the code review of plans 70 to 80), `WR-01`, `WR-02`, `IN-01`, `IN-02` and `IN-03`. Closed by plans 81 to 84; plan 85 holds the records, the gates, the production drive and the round's one full run.

**The operator's rulings at the WR16I UAT, word for word, as its `reported` lines record them:**

- Test 1: `all ★ — A1: schedule the review's fix: a follower shows loggedOutElsewhere only after a BroadcastChannel announcement within about 5 s; any other SIGNED_OUT leaves to the login page with no reason; no new copy`
- Test 2: `all ★ — A2: schedule the review's fix: signOutToLogin withdraws after the outcome is known, the OIDC callback after verifyOtp succeeds; /api/auth/logout unchanged`
- Test 3: `all ★ — A3: correct the overImgBgColor docblock and the settings documentation; no behaviour change`
- Test 4: `all ★ — A4: schedule per-value comparison with an allowlist of legitimately identical strings`
- Test 5: `all ★ — A5: schedule with A2: signOutToLogin takes one event parameter including locals`
- Test 7: `all ★ — B2: add a unit case running the page's removal under https://example.org/ and https://app.example.org/, red with the Domain= loop removed`

**The operator's answer at 179.1-81's checkpoint, word for word, as `179.1-81-SUMMARY.md` § The decisions records it** (`tests/e2e-runs/179.1-unit/179.1-81-decisions.txt`): line 1 `approved`; line 2 `A`; line 3, the edit as given, `lb questions.json questions.arguments.proCategory: Dofir: {option}`. The same section records the operator's ruling on the red targeted run `179.1-81-targeted-r2`, word for word: `a`. No other ruling is attributed to the operator in this section.

Each entry says what was measured, what was only read, and which runs. Every run is under `tests/e2e-runs/`: E2E runs under `179.1-e2e/`, unit runs under `179.1-unit/`. Plans 81 to 84 made no full run, by the operator's ruling of 2026-11-09 (rule 10 of plan 81); each made its targeted green run, judged against `179.1-79-final` (707 of 707 on `3c379d3d5`): `179.1-81-targeted-r3` (`contestant-entry-phone`, 68 of 68), none for plan 82 (its ruling 6: a unit-only change), `179.1-83-targeted` and `179.1-84-targeted` (`perm-closed-project`, 707 of 707 each, every one of 128 projects equal to `179.1-79-final`'s). The round's full run is `179.1-85-final`, in `179.1-85-SUMMARY.md`.

- G-179.1-WR16I-1 (`WR-01` of the review of plans 70 to 80): the login page names another tab only after that tab announced its Log out
  status: resolved
  **Resolved in:** 179.1-83, commits `e7caf84f0`, `d1c17b49c` and `7a9475e8e` (failing cases), `0670bcba8` (the announcement module, which nothing read yet) and `5c730a593` (a Log out announces itself on the channel `openvaa-logout`; a follower names the other tab only when it heard an announcement within 5 000 ms, and otherwise leaves to the login page with no reason); the guide by `e6dd95264`. No message key was added (`common.loggedOutElsewhere` as it stands).
  **What:** **Unit:** `logoutAnnouncement.test.ts` (10 cases), red in `179.1-83-unit-red-1` (`Failed to resolve import "./logoutAnnouncement"`), green in `-unit-green-1`; the `authContext`, `contestantContext` and `adminContext` cases, red in `-unit-red-2` and `-unit-red-3` (`expected "vi.fn()" to be called … times, but got 0 times`), green in `-unit-green-2` and `-3`, and shown red with their expectations inverted in `-inverted-1` and `-2`. **Measured on a dev server:** `179.1-83-held-entity` (`contestant-entity-selection` 51 of 51, the change held), and `179.1-83-targeted`, where the two existing titles `a sign-out in another tab sends this tab at once to a login page that says why` (`admin-access`) and `… to a login screen that says why` (`contestant-entity-selection`) appear once each and pass with the announcement in place. No E2E spec changed. **Unit-tested, not driven:** a `SIGNED_OUT` the auth client makes by itself leaving to the login page with no reason; a browser without `BroadcastChannel`. **Not run:** Safari, Firefox, WebKit, a phone; a Log out slower than the window.
  **Where it fits:** done; the paths not driven are open below and on the operator's UAT list.

- G-179.1-WR16I-2 (`WR-02` of the review of plans 70 to 80): `signOutToLogin` and the identity provider's callback withdraw the logout count only once the outcome is known
  status: resolved
  **Resolved in:** 179.1-84, commits `75e292cad` and `f213f3431` (failing cases) and `14f66b431` (the protected loads' sign-out withdraws after a sign-out that worked or a session read that finds none; the callback withdraws right after `verifyOtp` succeeds); the auth guide by `da65e4bd3`. `apps/frontend/src/hooks.server.ts` and `routes/api/auth/logout/+server.ts` equal `3c379d3d5`'s.
  **What:** **Unit:** `signOutToLogin.test.ts` › `the logout count` (7 cases), `layout.server.test.ts` (2 cases) and `callback-endpoint.test.ts` (2 cases and one renamed), red in `179.1-84-unit-red-1` (`expected "vi.fn()" to be called 1 times, but got 0 times`) and `-unit-red-2` (`expected 243 to be greater than 255`), green in `-unit-green-1` and `-2`. **Measured on a dev server:** `179.1-84-targeted` (`perm-closed-project`, 707 of 707, `contestant-identity-provider` 42 of 42); no E2E spec changed, so this shows nothing that passed before stopped passing. **Unit-tested, not driven:** a protected load's failed sign-out with a session left, which keeps the count for the hook's sign-out at the next request; the callback failing early with a live session.
  **Where it fits:** done; the two paths not driven are open below and on the operator's UAT list.

- G-179.1-WR16I-3 (`IN-01` of the review of plans 70 to 80): `overImgBgColor` is documented as it works
  status: resolved
  **Resolved in:** 179.1-82, commit `1ee209e67` (both docblocks in `dynamicSettings.type.ts` and the publishers' guide: the top bar's colour on a page with a header image).
  **What:** **Read only:** text, no behaviour change, as A3 ruled. `179.1-82-t2-links` exit 0 with 0 link findings. No run observes a docblock.
  **Where it fits:** done; reading the guide's sentence is on the operator's UAT list.

- G-179.1-WR16I-4 (`IN-02` of the review of plans 70 to 80): each `fr` and `lb` string is compared with the base locale's
  status: resolved
  **Resolved in:** 179.1-81, commits `4c3802423` (failing cases: per-value comparison with an allowlist of strings that are the same word), `b4652a0f5` (the copy as approved at the checkpoint) and `abd0b366a` (the select's placeholder and the argument lists in French and Luxembourgish, nine values).
  **What:** **Unit:** `translations.test.ts`, three titles, red in `179.1-81-unit-red-1` (`strings equal to the base locale’s that the allowlist does not name: fr/components.json components.select.placeholder; …`), green in `-unit-green-1` and `-2`; three mutations, each red: `179.1-81-mut-1` (an English value in `fr/common.json`), `-mut-2` (a whole `lb` file equal to `en`'s) and `-mut-3` (an allowlist entry no longer equal). `179.1-approved-strings.mjs` equal for every string. **Measured on a dev server:** `179.1-81-targeted-r2` red (1 failed, 24 did not run: `passwordless-session.setup.ts` timed out at `authConfirmPage.fixture.ts:41`, the slow first route load's signature, with another Supabase stack up); the operator ruled `a`; `179.1-81-targeted-r3` green, 68 of 68. **Not established:** the strings on screen; any native reader; `da`, `et`, `fi` and `sv` value by value (open below).
  **Where it fits:** done; the screens and the native reader are on the operator's UAT list.

- G-179.1-WR16I-5 (`IN-03` of the review of plans 70 to 80): `signOutToLogin` takes one event parameter that carries `locals`
  status: resolved
  **Resolved in:** 179.1-84, commits `75e292cad` (failing cases, the call form `signOutToLogin(makeEvent(), 'en', code)`) and `14f66b431` (one `event` parameter, its caller in the contestant protected layout updated).
  **What:** **Unit:** the eight cases of `signOutToLogin.test.ts` › `signOutToLogin`, rewritten to the one-event call form with their titles and expectations unchanged, and the cases of `G-179.1-WR16I-2` above, which assert the withdrawal on the request's own event; `179.1-84-t2-check` (0 errors) types every caller. **Measured on a dev server:** `179.1-84-targeted`, as above.
  **Where it fits:** done.

- G-179.1-WR16I-7: the page's removal of the logout count is verified at a host with a domain
  status: resolved
  **Resolved in:** 179.1-82, commits `2b3e9c175` (`logoutDeadline.apexHost.test.ts` at `https://example.org/` and `logoutDeadline.subdomainHost.test.ts` at `https://app.example.org/`, three cases each) and `c44e44e54` (ledger rows `82-1` and `82-2`).
  **What:** **Unit only:** green in `179.1-82-green-1` and `-2` (6 passed); with the `Domain=` loop of `expireEveryCopy` removed, red in `179.1-82-mut-1` (4 failed: `the expiries written for logout-pending: expected [ 'host-only' ] to deeply equal [ 'host-only', 'Domain=example.org' ]`). jsdom's jar merges a `Domain=<host>` copy with the host-only one, so "one expiry per domain" rests on the written strings. **No E2E run** (plan 82's ruling 6): every E2E origin is `localhost` or `127.0.0.1`. **Not run:** a real browser on a real apex deployment.
  **Where it fits:** done at unit level; the browser on a real apex deployment is open below and on the operator's UAT list.

- WR-01 of the review of plans 70 to 80
  status: resolved
  **Resolved in:** see `G-179.1-WR16I-1` above.

- WR-02 of the review of plans 70 to 80
  status: resolved
  **Resolved in:** see `G-179.1-WR16I-2` above.

- IN-01 of the review of plans 70 to 80
  status: resolved
  **Resolved in:** see `G-179.1-WR16I-3` above.

- IN-02 of the review of plans 70 to 80
  status: resolved
  **Resolved in:** see `G-179.1-WR16I-4` above.

- IN-03 of the review of plans 70 to 80
  status: resolved
  **Resolved in:** see `G-179.1-WR16I-5` above.

What the round leaves, for the operator. No ruling is attributed to them on any of these.

- `da`, `et`, `fi` and `sv` are not compared value by value
  status: open
  **Found by:** plan 81's ruling 2: the per-value comparison and its allowlist read `fr` and `lb` alone.
  **What:** **Read:** a value of those four locales equal to `en`'s is caught only when the whole file equals `en`'s. No run compares them value by value.

- A Log out whose request takes longer than the window gives the other tab no reason (`T-179.1-217`)
  status: open
  **Found by:** plan 83's threat register, `T-179.1-217`, accepted there as low.
  **What:** **Read:** the follower names the other tab only when it heard the announcement within 5 000 ms before `SIGNED_OUT`; a slower request leaves the other tab on the login page with no reason, the drafts still discarded. No run makes a request slower than the window.

- A sign-out the auth client makes by itself is unit-tested and not driven in a browser
  status: open
  **Found by:** rule 17 of plan 81.
  **What:** **Unit:** the two contexts' `with no announcement heard, leaves to the login route with no errorMessage`. No run makes the auth client drop a session by itself (a hosted project's time-box, a revoked session).

- A browser without `BroadcastChannel` names no other-tab cause
  status: open
  **Found by:** plan 83, `logoutAnnouncement.test.ts` › `does nothing and throws nothing where BroadcastChannel is undefined`.
  **What:** **Unit only:** the announcement is silent there, so a follower in such a browser always leaves with no reason. No browser run lacks the channel.

- The page's removal of a planted copy on a real apex deployment, in a browser
  status: open
  **Found by:** rule 17 of plan 81; plan 82 verified it at two hosts at unit level.
  **What:** **Unit only** (`G-179.1-WR16I-7` above). jsdom's jar merges a `Domain=<host>` copy with the host-only one, so the unit cases read the written strings, not a browser's jar.

- Plan 84's two failure paths are unit-tested and not driven
  status: open
  **Found by:** rule 17 of plan 81.
  **What:** **Unit only:** a protected load's failed sign-out with a session left keeps both cookies of the count and ends on the error page, and the hook signs out at the next request; the identity provider's callback failing before `verifyOtp` succeeds, with a live session, keeps the count. No run fails a sign-out or the callback that way.

- Plan 81's nine strings wait for a native reader
  status: open
  **Found by:** rule 5 of plan 81.
  **What:** machine translations approved at plan 81's checkpoint, the operator's edit `Dofir: {option}` among them. Each is listed, with its text, in `.planning/todos/pending/2026-11-10-179-1-fr-lb-strings-native-reader.md` § `Added by plan 179.1-81`.

- The E2E driver's disk-space step parses a `df` output that a first `docker run alpine` pull pollutes
  status: open
  **Found by:** `179.1-81-targeted` (exit 3, no test ran): the image pull's lines were mixed into the output the step parses.
  **What:** **Measured once**, on a host without `alpine:latest`; with the image present the step passes. Not changed in this round (records and runs only in plan 85).

- The slow first route load, again in a one-project run
  status: open
  **Found by:** `179.1-81-targeted-r2`, red with another Supabase stack up; `-r3` green with it stopped.
  **What:** both runs are in the Record of `.planning/todos/pending/2026-11-01-e2e-intermittent-slow-first-route-load.md` (`eec5b1f5e`). The cause stays UNCONFIRMED.

- The time a follower last heard an announcement survives the last listener's stop
  status: open
  **Found by:** `179.1-83-SUMMARY.md` § For plan 85.
  **What:** **Read** in `logoutAnnouncement.ts`: `lastHeardAt` is not cleared when the last listener stops and the channel closes, so `heardLogoutAnnouncement()` still answers `true` within 5 000 ms of an announcement heard before then. No case or run drives it.

- A sleep in the window of `179.1-84-targeted` left no void marker
  status: open
  **Found by:** `179.1-84-SUMMARY.md` § For plan 85: a 606-second clamshell sleep, and the run took 31 minutes.
  **What:** **Measured** by the orchestrator: Playwright ran 10:04:40Z to 10:24:52Z, the heartbeat ends at the same instant, and the sleep began 10:25:12Z, during the wrapper's post-run restore. The heartbeat covers only the test window, so no test ran during the sleep and the run is not void. A sleep during the restore is outside what the heartbeat watches.

- The verify stage of plan 83's Task 2 that compares `apps/frontend/messages` with `3c379d3d5`
  status: open
  **Found by:** `179.1-83-SUMMARY.md` § For plan 85: the stage fails on plan 81's approved values.
  **What:** **Measured by plan 85:** against each plan's own start head, `apps/frontend/messages` and `translationKey.ts` changed in plan 81 alone (the nine approved values, no key added, removed or renamed) and not at all in plans 82 to 84; `en` and `translationKey.ts` equal `3c379d3d5`'s. The stale stage is in a closed plan and is not edited.

## From plans 86 to 90

The eight gaps of `179.1-WR16J-UAT.md` § Gaps, `G-179.1-WR16J-1` to `-8`, the six findings of `179.1-WR16J-REVIEW.md` (the code review of plans 81 to 85), `WR-01`, `WR-02` and `IN-01` to `IN-04`, and the unregistered flag of `179.1-WR16J-SECURITY.md`, registered by plan 89 as `T-179.1-223`. Closed by plans 86 to 89; plan 90 holds the records, the gates, the production drive and the round's one full run.

**The operator's rulings at the WR16J UAT, word for word, as its `reported` lines record them:**

- Test 1 (A1 — WR-01): `all ★`
- Test 2 (A2 — WR-02): `all ★`
- Test 3 (A3 — IN-01): `all ★`
- Test 4 (A4 — IN-02): `all ★`
- Test 5 (A5 — IN-03): `all ★`
- Test 6 (A6 — IN-04): `all ★`
- Test 7 (B1): `all ★`
- Test 13 (C5): `all ★`

**The ★ texts those lines accept, word for word, as `179.1-WR16J-UAT-POINTS.md` states them:**

- A1: ★ RECOMMENDED — **Schedule the review's fix.** Post `'start'` before the request and `'end'` after it. A sign-out counts as announced while a start is outstanding (capped at 30 s) or within 5 s of an `'end'`. Add unit cases for a slow Log out, a start with no end that runs past the cap, and an end with no start. Restate T-179.1-215/216/217 to match (the audit notes that a forged `'start'` widens what T-216 accepts to the cap). No new copy is needed.
- A2: ★ RECOMMENDED — **Schedule the fix and register the threat.** In `/auth/confirm`, withdraw only when no session is held, or after the held sign-out has worked or `isSessionGone` confirms the session is gone. On a failed sign-out with a session left, show the failure and keep the count. Diagnose the three gated sign-in actions in the same plan and fix them the same way if the reading holds. Add unit cases that are red first. Register the threat as T-179.1-223, mitigated. The guide sentence then stays true.
- A3: ★ RECOMMENDED — **Schedule it with A1.** Announce before that sign-out, using the same start/end pair as A1, and add one unit case.
- A4: ★ RECOMMENDED — **Reword the comments**, using "announcement" only for the channel message, as part of the A1 plan.
- A5: ★ RECOMMENDED — **Move the shared body into `logoutDeadline.testUtils.ts`**, leaving each file with its environment options and constants. Prove it by the mutation that already turns these files red.
- A6: ★ RECOMMENDED — **Fix all three** (the order, the TSDoc, and a check that a variant has the variant shape, not just a `match` key). These are unit-test-only changes.
- B1: ★ RECOMMENDED — **Record all of them in `179.1-SECURITY.md`'s log.** Use AR-179.1-19 and -20 as proposed, restated if A1 changes the window, and add the four rows of plans 70 to 80. This is a docs-only change and goes in the first plan of the next round.
- C5: ★ RECOMMENDED — **Extend the guard to every non-en locale.** First list the values in those four that equal en's, then rule on that list at a checkpoint. Each one is either allowlisted with a reason or translated, with any new strings going through the copy checkpoint. The change is unit-test-only, plus whatever strings the list turns up.

**The operator's answer at 179.1-87's checkpoint, word for word, as `179.1-87-SUMMARY.md` § The decisions records it** (`tests/e2e-runs/179.1-unit/179.1-87-decisions.txt`, its one line): `approved`. The same section records no edit.

The UAT also passed B2, C3, C4, C6, C8 and C9 (`all ★`), and deferred C1, C2 and C7 to backlog Phases 999.2 to 999.4. Nothing in this round was done for them beyond what C9's ★ text makes true through A2. No other ruling is attributed to the operator in this section.

Each entry says what was measured, what was only read, and which runs. Every run is under `tests/e2e-runs/`: E2E runs under `179.1-e2e/`, unit runs under `179.1-unit/`. Plans 86 to 89 made no full run, by the operator's ruling of 2026-11-09 (rule 10 of plan 86). Plan 86 made no targeted run (its rule 10: no spec, fixture or route it serves changed). Plans 87 to 89 each made a targeted green run, judged against `179.1-85-final` (read as `179.1-85-final-r3`, 707 of 707 on `8405a5894`): `179.1-87-targeted` (`perm-localisation-positive`, 247 of 247), `179.1-88-targeted-r3` (`perm-closed-project`, 707 of 707, after `-targeted` exit 9 at the stack restore and `-r2` void) and `179.1-89-targeted-r2` (`perm-closed-project`, 707 of 707, the operator's one rerun after `-targeted` was red in the manner of the slow first route load). The round's full run is `179.1-90-final`, in `179.1-90-SUMMARY.md`.

- G-179.1-WR16J-1 (`WR-01` of the review of plans 81 to 85): the other-tab sentence does not depend on a Log out's request latency
  status: resolved
  **Resolved in:** 179.1-88, commits `4fe4ffd29` and `8e155651c` (failing cases) and `d6456b79c` (a Log out announces `'start'` before its sign-out and `'end'` after it; a sign-out counts as another tab's while a start is outstanding, for at most `LOGOUT_IN_FLIGHT_CAP_MS` = 30 000 ms, or within `LOGOUT_ANNOUNCEMENT_WINDOW_MS` = 5 000 ms of an end); the guide by `4918e5c67`; `T-179.1-215` to `-217` restated in place in `179.1-83-PLAN.md` by `c33637d52`. No message key was added (`common.loggedOutElsewhere` as it stands).
  **What:** **Unit:** `logoutAnnouncement.test.ts`, five cases added (among them `still counts a start 8 000 ms later while no end has come, as a slow Log out` and `counts a start with no end at 30 000 ms and not at 30 001 ms`) and three rewritten; `authContext.svelte.test.ts`, two rewritten. Red in `179.1-88-unit-red-1` (`expected undefined to be 30000`) and `-unit-red-2` (`expected [ [] ] to deeply equal [ [ 'start' ], [ 'end' ] ]`), green in `-unit-green-1` and `-2`; two mutations red, `179.1-88-mut-1` and `-mut-2`. **Measured on a dev server:** `179.1-88-held-entity` (`contestant-entity-selection`, 59 of 59) and `179.1-88-targeted-r3`, where the two titles `a sign-out in another tab sends this tab at once to a login page that says why` (`admin-access`) and `… to a login screen that says why` (`contestant-entity-selection`) appear once each and pass. No E2E spec changed, and no run makes a Log out slower than 5 s. **Not run:** a Log out slower than 30 s; Safari, Firefox, WebKit, a phone.
  **Where it fits:** done; the paths not driven are open below and on the operator's UAT list.

- G-179.1-WR16J-2 (`WR-02` of the review of plans 81 to 85, and the audit's flag, `T-179.1-223`): a closed tab's logout count is withdrawn only once a sign-in's or the confirm page's outcome is known
  status: resolved
  **Resolved in:** 179.1-89, commits `c110fdd08` and `9aab545c1` (the confirm page withdraws only once the link's verification has set the session, and ends on the root error page with `error.default`, the count kept, when the sign-out of a held session leaves it), `8c65104c1` and `95bdd3987` (the Admin App's and the Contestant App's password sign-ins withdraw once the helper has admitted the session), `5edf84c46` and `d41dd93fa` (the code sign-in, the same), and `352040842` (the auth guide's sentences, true of every path, ruling C9). `T-179.1-223` is registered in plan 89's threat register, mitigated by those commits; `AR-179.1-24`'s clause names it. `apps/frontend/src/hooks.server.ts` and `routes/api/auth/logout/+server.ts` equal `3c379d3d5`'s.
  **What:** **Unit:** `routes/auth/confirm/page.server.test.ts` › `the logout count` (five cases added, two rewritten), `lib/server/auth/mailedLink.test.ts` (five), `routes/admin/login/page.server.test.ts` (four), and the two contestant sign-in files (four each, rewritten). Red in `179.1-89-unit-red-1` to `-3` (`expected [ 'withdrawLogoutCount', … ] to deeply equal [ 'verifyOtp', … ]` and its two sign-in forms), green in `-unit-green-1` to `-3`; `179.1-89-mut-1` red. **Measured on a dev server:** `179.1-89-targeted` red (1 failed, 24 did not run: `Error: Back settled neither on the home nor on the login form` in `admin-access`, the slow first route load's shape, under another project's load on the host); the operator's one rerun `179.1-89-targeted-r2` green, 707 of 707. No E2E spec changed, so the runs show that nothing that passed before stopped passing. **Unit-tested, not driven:** the confirm page's 503 after a failed sign-out of a held session; the four sign-ins during an auth outage.
  **Where it fits:** done; the paths not driven are open below and on the operator's UAT list.

- G-179.1-WR16J-3 (`IN-01` of the review of plans 81 to 85): the Admin App's sign-out of a user who is no administrator is announced
  status: resolved
  **Resolved in:** 179.1-88, commits `8721c7eb5` (failing case) and `d6456b79c` (`routes/admin/(protected)/+layout.ts` signs that user out between a start and an end announcement).
  **What:** **Unit:** `routes/admin/(protected)/layout.test.ts` › `in the browser, a user who is no administrator is signed out between a start and an end announcement`, red in `179.1-88-unit-red-3` (`expected [] to deeply equal [ [ 'start' ], [ 'end' ] ]`), green in `-unit-green-2`. **Not driven:** no run signs a non-administrator into the Admin App with another tab open.
  **Where it fits:** done at unit level; the browser path is open below and on the operator's UAT list.

- G-179.1-WR16J-4 (`IN-02` of the review of plans 81 to 85): "announcement" names only the channel message in comments
  status: resolved
  **Resolved in:** 179.1-88, commit `d6456b79c` (the comments of `supabaseDataWriter.ts`, `dataWriter.type.ts`, `contestantContext.svelte.ts`, `adminContext.svelte.ts` and `routes/admin/(protected)/+layout.ts` reworded so that "announcement" names the channel message and the client's `SIGNED_OUT` is a report).
  **What:** **Read only:** comments, no behaviour of their own. `yarn assert:comment-hygiene` reported 0 violations before each commit that touched comments (`179.1-88-SUMMARY.md`). Ruling A4 named comments: unit-test titles that still say the auth library announces a sign-out are open below.
  **Where it fits:** done.

- G-179.1-WR16J-5 (`IN-03` of the review of plans 81 to 85): the apex and subdomain removal tests share one body
  status: resolved
  **Resolved in:** 179.1-86, commit `2ccb13c7c` (`describeRemovalAt({ origin, domains, hostKind })` in `logoutDeadline.testUtils.ts`; each file keeps its environment options and constants).
  **What:** **Unit:** the six cases, titles unchanged, green; with the `Domain=` loop of `expireEveryCopy` removed, red in `179.1-86-mut-1` (`the expiries written for logout-pending: expected [ 'host-only' ] to deeply equal [ 'host-only', 'Domain=example.org' ]`), as ruling A5 asked. **No E2E run** (plan 86's rule 10).
  **Where it fits:** done.

- G-179.1-WR16J-6 (`IN-04` of the review of plans 81 to 85): the new test files have ordered headers, TSDoc on the walk's helpers, and a variant check on shape
  status: resolved
  **Resolved in:** 179.1-86, commits `aaaae94b7` (failing case: the walk takes an object for a variant message only when it has a variant's shape) and `bdd339a66` (the TSDoc, the shape check, and the header of `layout.server.test.ts` in order).
  **What:** **Unit:** `translations.test.ts` › `the walk takes an object for a variant message only when it has a variant’s shape`, red in `179.1-86-unit-red-1` (`the strings of a namespace holding a key named match: expected [ [ 'results#0/label', 'Your match' ] ] to deeply equal [ …(2) ]`), green after. The header order and the TSDoc are read only.
  **Where it fits:** done.

- G-179.1-WR16J-7: the accepted risks of plans 70 to 85 are in the phase's log
  status: resolved
  **Resolved in:** 179.1-86, commit `674faf1cb` (`AR-179.1-19` to `AR-179.1-24` in `179.1-SECURITY.md`'s Accepted Risks Log, nothing else of that file changed).
  **What:** **Read only:** records. `AR-179.1-19` and `-20` were written ahead of plan 88's code, and plan 88's verify read them against `LOGOUT_IN_FLIGHT_CAP_MS` and `LOGOUT_ANNOUNCEMENT_WINDOW_MS`; `-24`'s clause on `T-179.1-223` was written ahead of plan 89's, which made it true.
  **Where it fits:** done.

- G-179.1-WR16J-8: no English string in `da`, `et`, `fi` or `sv` but those the allowlist names
  status: resolved
  **Resolved in:** 179.1-87, commits `d75acbed1` (failing cases: every locale but `en` compared value by value, alone and behind its locale's tag, with `SAME_AS_BASE_LOCALE` grown to 87 entries with their reasons) and `c41d66d84` (nine `da` and `sv` values translated as approved, and `en`'s `feedback.error.emailSubject` spelled `Feedback`). No key added, removed or renamed.
  **What:** **Unit:** `translations.test.ts` › `no string of another locale equals the base locale's, alone or behind a locale tag, but those the allowlist names`, red in `179.1-87-unit-red-1` (`strings equal to the base locale’s that the allowlist does not name: da/common.json common.website; …`), green in `-unit-green-1`; two mutations red, `179.1-87-mut-1` (`et`) and `-mut-2` (`da`). `179.1-approved-strings.mjs` equal for every string. **Measured on a dev server:** `179.1-87-targeted` (`perm-localisation-positive`, 247 of 247), which shows the catalogues compile and the locale switch works; no spec reads a changed key. **Not established:** the strings on screen; any native reader.
  **Where it fits:** done; the screens and the native reader are open below and on the operator's UAT list.

- WR-01 of the review of plans 81 to 85
  status: resolved
  **Resolved in:** see `G-179.1-WR16J-1` above.

- WR-02 of the review of plans 81 to 85
  status: resolved
  **Resolved in:** see `G-179.1-WR16J-2` above.

- IN-01 of the review of plans 81 to 85
  status: resolved
  **Resolved in:** see `G-179.1-WR16J-3` above.

- IN-02 of the review of plans 81 to 85
  status: resolved
  **Resolved in:** see `G-179.1-WR16J-4` above.

- IN-03 of the review of plans 81 to 85
  status: resolved
  **Resolved in:** see `G-179.1-WR16J-5` above.

- IN-04 of the review of plans 81 to 85
  status: resolved
  **Resolved in:** see `G-179.1-WR16J-6` above.

What the round leaves, for the operator. No ruling is attributed to them on any of these.

- A Log out whose requests take longer than 30 s, or whose tab closes before its `end`, gives the other tab no reason (`T-179.1-217`, `AR-179.1-20`)
  status: open
  **Found by:** plan 88's restated `T-179.1-217` and `AR-179.1-20`.
  **What:** **Read:** a start counts for at most 30 000 ms, and an end for 5 000 ms after it; past the cap with no end, or after a tab that announced its start closed before its end, the follower leaves to the login page with no reason, the drafts still discarded. **Unit:** `counts a start with no end at 30 000 ms and not at 30 001 ms`. No run makes a Log out slower than 30 s.

- A sign-out the auth client makes by itself is unit-tested and not driven in a browser
  status: open
  **Found by:** rule 17 of plan 86.
  **What:** **Unit:** the two contexts' cases that leave to the login route with no `errorMessage` when no announcement is counted. No run makes the auth client drop a session by itself (a hosted project's time-box, a revoked session). Within 5 s of a failed Log out's end, or within 30 s of a closed tab's start, such a sign-out reads as the other tab's (`T-179.1-215`, as plan 88 restated it).

- A browser without `BroadcastChannel` names no other-tab cause
  status: open
  **Found by:** plan 83, `logoutAnnouncement.test.ts` › `does nothing and throws nothing where BroadcastChannel is undefined`, carried by plan 88.
  **What:** **Unit only:** neither the start nor the end is posted there, so a follower in such a browser always leaves with no reason. No browser run lacks the channel.

- The Admin App's announced sign-out of a user who is no administrator is unit-tested and not driven
  status: open
  **Found by:** plan 88's `For plan 90`; rule 17 of plan 86.
  **What:** **Unit only** (`G-179.1-WR16J-3` above). No run follows it in another tab.

- The confirm page's 503 after a failed sign-out of a held session, and the four sign-ins during an auth outage, are unit-tested and not driven
  status: open
  **Found by:** plan 89's `For plan 90`; rule 17 of plan 86.
  **What:** **Unit only** (`G-179.1-WR16J-2` above). No run fails the auth service's sign-out or sign-in that way.

- Plan 87's `da` and `sv` strings wait for a native reader
  status: open
  **Found by:** rule 5 of plan 86.
  **What:** machine translations approved at plan 87's checkpoint, listed with their text in `.planning/todos/pending/2026-11-11-179-1-da-sv-strings-native-reader.md` § `Added by plan 179.1-87`. The same todo names `sv` `components.video.unmute`, `Avslöja`, which plan 87 observed and left: no comparison reads it, because it is not `en`'s value.

- Unit-test titles in `supabaseDataWriter.test.ts` still say the auth library announces a sign-out
  status: open
  **Found by:** plan 90's ruling 2: ruling A4 named comments.
  **What:** **Read:** four titles of `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` (`reports a sign-out the auth library announces while this writer signs out as made here` and the three after it) use "announce" for auth-js's `SIGNED_OUT`. Titles, not comments; not changed.

- The stop function leaves the outstanding start and the last end as they are
  status: open
  **Found by:** `179.1-88-SUMMARY.md` § For plan 90 (rule 15): the residue `The time a follower last heard an announcement survives the last listener's stop` of § `From plans 81 to 85`, in the start and end form.
  **What:** **Read** in `logoutAnnouncement.ts`. No case or run drives it.

- The slow first route load, again in a targeted run
  status: open
  **Found by:** `179.1-89-targeted`, red under another project's load on the host; `-r2` green with the contention removed.
  **What:** both runs are in the Record of `.planning/todos/pending/2026-11-01-e2e-intermittent-slow-first-route-load.md` (`a8395140f`). The cause stays UNCONFIRMED.

- The shared stack's `yarn db:start` failed once at the end of a run under load
  status: open
  **Found by:** `179.1-88-targeted`, status 9 (`yarn db:start` exit 1 after 63 s); Playwright had finished 707 of 707.
  **What:** **Measured once.** The run was made again (`-r2` void, `-r3` green). No cause read.

- Plan 86's verify stage that compares `apps/frontend/messages` with `3c379d3d5`
  status: open
  **Found by:** `179.1-86-SUMMARY.md` and `179.1-87-SUMMARY.md` § For plan 90: the stage fails on plan 81's and plan 87's approved values, and plans 87 and 89 met it again.
  **What:** **Measured:** each failed run of it was followed by the restated split (`179.1-86-t3-verify-restated.sh`), exit 0. The stale stage is in closed plans and is not edited.
