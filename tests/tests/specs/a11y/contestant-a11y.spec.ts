/**
 * axe accessibility smoke — the CANDIDATE half of the two-file scan family.
 *
 * Scans fifteen surfaces in both themes (30 scans), over the SHARED scan core in `tests/tests/utils/axeScan.ts`: the eight candidate `(protected)` surfaces a user who has accepted the terms of use reaches, the password-reset page as that user is shown it, the terms-of-use view a user who has not accepted is shown in their place, the profile selection screen and the open menu of a user who edits several entities, the view a user with nothing to edit is shown, and the set-password view a user whose account has no password is shown, as it opens and with its confirmation in error. The voter half is `a11y-smoke.spec.ts` in this same directory; neither file declares a gate of its own, so the two halves differ only in their route tables.
 *
 * Runs AUTHENTICATED: the `contestant-a11y-scan` project supplies the stored candidate session (`STORAGE_STATE`, written by `auth-setup`) as its `storageState`, which is what makes `(protected)` reachable at all. That is the one structural difference from the voter half, and it is why this is a separate FILE rather than more entries in the voter table: a Playwright project selects by directory and filename, so a family that needs its own `storageState` and its own dependency edges needs its own file to match on.
 *
 * The terms-of-use view is scanned under a SECOND stored session, `TERMS_PENDING_STORAGE_STATE`, which `auth-setup` also writes: the session of a user who has not accepted. One `describe` at the foot of this file swaps it in with `test.use`; the project's own `storageState` is unchanged.
 *
 * Two more stored sessions, both written by `data-setup-entity-selection` and both READ-ONLY for the run, are swapped in the same way, each by its own `describe`: `MULTI_ENTITY_STORAGE_STATE`, the session of a user who edits two candidates and an organization, for the profile selection screen and for the menu of an entity home that user reaches; and `NO_ENTITY_STORAGE_STATE`, the session of a user who edits nothing, for the "nothing to edit" view. No scan under either accepts, saves, changes a grant or signs out.
 *
 * A fifth stored session, `PASSWORDLESS_STORAGE_STATE`, written by `data-setup-passwordless-session` and READ-ONLY for the run, is swapped in by the last `describe`: the session of a user who signed in through a mailed link and has never set a password, for the set-password view. The account was made by the application's own link request, never registered with a password, so the view scanned is the one such a user meets. No scan under it saves a password or signs out.
 *
 * ## The reach proof
 *
 * The auth fixture reporting success is not evidence of reach, so every scan takes its own: `assertContestantReach` reads the SETTLED URL, asserts it is inside the contestant application and is not the login route, and asserts a per-entry marker that only the authenticated surface renders. It attaches both to the test's own output, so the evidence lives in the run rather than in a summary.
 *
 * It runs inside every entry's `settle`, i.e. BEFORE the scan — a silently-redirected scan therefore fails by name instead of reporting a confident zero about a login page. `toScanEntry` composes it onto every entry at the runner, so an entry physically cannot be added without it.
 *
 * The reach proof, `toScanEntry` and `declareScans`, which declares an entry's light scan and its dark twin, are in `tests/tests/utils/contestantAxeScan.ts`. They are the same functions for every spec that scans a surface of the Contestant App; this file holds its entry tables and the sessions they run under.
 *
 * ============================================================================
 * PARITY WITH THE VOTER HALF
 * ============================================================================
 *
 * ## Identical by construction
 *
 * Not "equivalent", not "kept in sync" — literally the same functions, imported from `tests/tests/utils/axeScan.ts` by both this file and `a11y-smoke.spec.ts`:
 *
 * | what | symbol |
 * |---|---|
 * | the WCAG 2.1 AA tag set | `WCAG_TAGS` (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) |
 * | the per-rule regression trio | `assertAxeGates` — `aria-required-parent`, `list`, `button-name`, each asserted at 0 |
 * | the global zero-violation gate | `assertAxeGates` — `expect(results.violations).toHaveLength(0)` |
 * | the animation settle before the scan | `awaitAnimationsSettled` |
 * | the REQUIRED data-driven content anchor | `AxeRouteBase.contentTestId`, a required field |
 * | the one scan body | `assertAxeScan` — settle → anchor → settle animations → raw-key verdict → axe → gates |
 * | the raw-i18n-key gate | `collectRawI18nKeyFindings`, reported by `assertAxeScan` |
 *
 * `assertAxeGates` takes no per-surface parameter that could relax it, and this file declares no violation assertion of its own. So the parity is checkable by reading the symbols listed above against the ones `a11y-smoke.spec.ts` pulls from the same module — there is no second copy of a gate that could drift, and any future difference between the two halves can only be a difference in their ROUTE TABLES.
 *
 * ## Divergences, each with its reason
 *
 * 1. **These scans carry a stored candidate session; the voter scans run with an
 *    empty storage state.** Not a choice: every scanned surface sits behind `(protected)/+layout.server.ts`'s `redirect(307, ContestantAppLogin)`. This is also the only reason the two halves need separate projects at all.
 * 2. **The dark-theme guard runs on ALL FIFTEEN dark twins here; on the voter side
 *    it runs only on the fixture-driven ones.** A deliberate strictness INCREASE, not a mismatch. The voter raw twins emulate dark before their own `goto`, so there is no walked-in-light document to strand; here the context is born dark and every twin is checked anyway. Cost: one probe-node read per scan.
 * 3. **`cand-preview` anchors on the entity-details article, not on
 *    `contestant-preview-container` — the testid the visual baselines use.**
 *    MEASURED: the container wraps the loading, error and success branches of the same template, so it resolves while `<Loading>` is still inside it (anchorText "Loading…", no h1). It is a fake settle. A screenshot of a spinner fails; a scan of one passes, which is why the visual suite can use the container and this one cannot.
 * 4. **`contestant-nav-menu` opens the drawer through `navMenu.fixture`, never a
 *    click.** MEASURED: a bare `nav-menu-toggle` click is a no-op at 1280×720 AND 390×844, on the contestant app AND the voter app — `aria-expanded` stays `"false"` and `nav-menu` stays `display: none`, sampled at 0/30/80/150/400/1200 ms. It is the documented SSR→hydration gap; the fixture owns the retry.
 * 5. **axe's `incomplete` ("needs review") results are outside the gate.** This
 *    is a SHARED posture rather than a divergence — the voter gate asserts only on `violations` too — but it is recorded because a measurement of the 14 scans under the base candidate's session found **72** such nodes, all `color-contrast`, all on `<span class="uc-first">` inside a button label or on a `!bg-transparent` `<select>`. The already-green voter surfaces produce the same class (voter-home 3, voter-elections 1). A reader who finds the 72 deserves to know they were seen and left out deliberately, and that gating them on this half alone would be the actual parity break.
 *
 * ## Known gaps — recorded as unknowns, never as zeros
 *
 * The zero above covers eight surfaces and the password-reset page in the state the base candidate's user puts them in, the terms-of-use view as a user who has not accepted meets it, the profile selection screen and the open menu as a user who edits three entities meets them, the "nothing to edit" view as a user with no grant meets it, and the set-password view as a user with no password meets it.
 * These are NOT covered, and none of them is claimed to be 0.
 *
 * ### Reachable-but-not-scanned STATES of routes that are otherwise scanned
 *
 * | state | why not reached with these identities/this dataset | the lever that would reach it |
 * |---|---|---|
 * | `/contestant/questions` empty-state intro (`contestant-questions-intro`) | every `e2e/base` candidate carries answers (0 hits for `answersByExternalId: {}` across 31 declarations) | a template change, or a runtime answer wipe |
 * | logout confirmation modal | the modal appears only when answers are INCOMPLETE; CA-AA-1 is complete | as above |
 * | the "not editable" note with its answers-locked sentence (`contestant-answers-locked-warning`) on the home, the questions list and a question page | an `app_settings` scenario owned by the `perm-answers-locked` chain | none for the component: the same note in the same slot is scanned with this sentence on a profile by `org-profile-answers-locked` in `specs/perm/perm-organization-editing.spec.ts`, and with its nominations-locked sentence on the nominations view by `no-nomination-nominations-locked` and `nominated-nominations-pending-locked` in `specs/perm/perm-no-nomination.spec.ts`; these three pages add no markup to it |
 * | `PreventNavigation` unsaved-changes modal (profile, question) | requires a dirty form plus a navigation attempt | one extra step in the entry's `reach` |
 * | error paths — portrait-upload error (the shared `input-error` node inside `profile-image-upload`), preview `notFound` | failure paths, not states of a successful load | out of scope for a route-family scan; would need fault injection |
 * | the selection screen listing one entity type (no group headings) | the multi-entity user edits both types, so both groups and their headings render | a second identity with several entities of one type |
 * | the open menu over an organization's pages | every entity page scanned here is a candidate's: the project's user edits one candidate, and `contestant-nav-menu-switch` picks the first card, a candidate | an entry that picks the organization's card |
 *
 * An organization's profile and preview are scanned by `specs/perm/perm-organization-editing.spec.ts`, on that spec's own dataset and under its own sessions, through the same helpers and the same gate. The home, the nominations view and the open menu of a candidate with no nomination, the home of one with a nomination and something left to do, and the nominations view while nominations are locked are scanned in the same way by `specs/perm/perm-no-nomination.spec.ts`: no identity of `e2e/base` lacks a nomination, and this project runs before any setting is changed.
 *
 * ### Candidate routes OUTSIDE the `(protected)` family — not scanned by this file
 *
 * The password-reset page is outside the family and is scanned here, because it needs a session. The others need none: `login`, `login/email`, `email-sent`, `help`, `privacy`, `forgot-password`, `register`, `register/email`, `register/sign-in`, `preregister` and its `elections` / `constituencies` / `email` / `status` steps. This file runs under a stored session and scans none of them. `specs/contestant/contestant-entry-scan.spec.ts` scans the login, sign-in, registration, code, "email sent" and forgot-password screens with no session, and `specs/perm/perm-closed-project.spec.ts` scans the login page and the registration page of a closed project; `help`, `privacy` and the pre-registration steps are the same coverage hole as the states above, and their a11y state is unknown for the same reason: nothing scans them.
 *
 * ### The four stated limits of the zero itself
 *
 * 1. **One operating system.** Measured on macOS against local Chromium. CI runs
 *    an ubuntu runner. Colour values are computed rather than rendered so contrast should transfer; layout-dependent rules were not re-observed there.
 * 2. **One contention profile.** The measurement was taken inside the real
 *    suite, which covers the recorded run but not every future scheduling shape — scan-timing pressure is exactly what produced phantom `color-contrast` failures on the voter side (see `awaitAnimationsSettled`).
 * 3. **One identity per surface, on one dataset.** The user of CA-AA-1 for the eight surfaces and the password-reset page, a user with no terms-of-use acceptance for the terms-of-use view, a user who edits two candidates and an organization for the selection screen and its menu, a user with no grant for the "nothing to edit" view, and a user with no password and a project-scope grant for the set-password view, all on `e2e/base`. Every state in the table above is unmeasured.
 * 4. **One viewport.** 1280×720 (`devices['Desktop Chrome']`), matching the voter
 *    family. Mobile candidate layouts are not scanned — nor are mobile voter ones.
 */

import { expect, test } from '@playwright/test';
import { createContestantHomePage } from '../../fixtures/contestant/contestantHomePage.fixture';
import { createContestantPasswordResetPage } from '../../fixtures/contestant/contestantPasswordResetPage.fixture';
import { createContestantPasswordSetter } from '../../fixtures/contestant/contestantPasswordSetter.fixture';
import { createContestantQuestionsOverviewPage } from '../../fixtures/contestant/contestantQuestionsOverviewPage.fixture';
import { createContestantSetPasswordGate } from '../../fixtures/contestant/contestantSetPasswordGate.fixture';
import { createNavMenu } from '../../fixtures/shared/navMenu.fixture';
import { TIMEOUTS } from '../../helpers';
import { declareScans } from '../../utils/contestantAxeScan';
import { contestantHomeUrlRe, contestantUrlRe } from '../../utils/contestantEntityUrl';
import {
  MULTI_ENTITY_STORAGE_STATE,
  NO_ENTITY_STORAGE_STATE,
  PASSWORDLESS_STORAGE_STATE,
  TERMS_PENDING_STORAGE_STATE,
  TEST_CANDIDATE_EMAIL,
  TEST_PASSWORDLESS_EMAIL
} from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';
import type { ContestantAxeRoute } from '../../utils/contestantAxeScan';

const CONTESTANT_AXE_ROUTES: ReadonlyArray<ContestantAxeRoute> = [
  {
    // Anchor on the home status message, NOT on the page frame: its content is computed from the candidate's completion state, so it exists only once the candidate's own answers have loaded. A frame-level anchor would resolve while the layout's data promises were still pending.
    // Marker: the logout button, which the app renders only for a live session.
    // State: the home of an entity whose every task is complete. The main action leads to the preview only then, so the reach fails when the dataset's candidate is left with something to do, in place of scanning another home.
    name: 'cand-home',
    fixture: 'raw',
    routeId: 'ContestantAppHome',
    contentTestId: testIds.contestant.home.statusMessage,
    postLoginTestId: testIds.contestant.home.logout,
    reach: async (page) => {
      await createContestantHomePage(page).expectNextStep('preview');
    }
  },
  {
    // The nominations view with the candidate's one nomination: a confirmed card that holds every row a card can hold, while nominations can be edited, so with the link to the editor under the main button.
    // Anchor on the card, which the view renders only for a list the server returned.
    // Marker: the view's container, which the protected nominations route alone renders.
    // The reach reads the container's three state attributes and the card's own, so a card without its parent or its symbol row, an unconfirmed card, a locked view and a view that offers no entry to the editor each fail here. The main button says what it does only once the entity's tasks are known in the browser, which is also when the view's shaded background is in place; it returns to the home, because this candidate has no task left to continue to.
    name: 'cand-nominations',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominations.card,
    postLoginTestId: testIds.contestant.nominations.page,
    reach: async (page) => {
      const view = page.getByTestId(testIds.contestant.nominations.page);
      await expect(view).toHaveAttribute('data-nominations-state', 'listed', { timeout: TIMEOUTS.slowPage });
      await expect(view).toHaveAttribute('data-nominations-locked', 'false');
      await expect(view).toHaveAttribute('data-nominations-editable', 'true');
      await expect(view.getByTestId(testIds.contestant.nominations.edit)).toBeVisible();
      const card = view.getByTestId(testIds.contestant.nominations.card);
      await expect(card).toHaveCount(1);
      await expect(card).toHaveAttribute('data-confirmed', 'true');
      await expect(card.getByTestId(testIds.contestant.nominations.parent)).toBeVisible();
      await expect(card.getByTestId(testIds.contestant.nominations.electionSymbol)).toBeVisible();
      await expect(view.getByTestId(testIds.contestant.nominations.continue)).toHaveAttribute('data-action', 'return', {
        timeout: TIMEOUTS.slowPage
      });
    }
  },
  {
    // Anchor on a profile info item — one per editable info question, several in the base dataset — rather than on the profile heading, which renders from a static i18n title before any of the candidate's own data mounts.
    // Marker: the identity section, which the protected profile alone renders.
    name: 'cand-profile',
    fixture: 'raw',
    routeId: 'ContestantAppProfile',
    contentTestId: testIds.contestant.profile.infoItem,
    postLoginTestId: testIds.contestant.profile.identity
  },
  {
    // Anchor on a question CARD, and expand every category expander first.
    // This is not a convenience: `Expander` renders its body only when open and `defaultExpanded` is true only for categories with unanswered questions, so on a complete candidate every card is ABSENT FROM THE DOM until expanded.
    // Anchoring on the list wrapper instead would resolve against an accordion of collapsed headers and scan a surface with no cards in it.
    // Marker: the list wrapper itself, which the protected route alone renders.
    name: 'cand-questions',
    fixture: 'raw',
    routeId: 'ContestantAppQuestions',
    contentTestId: testIds.contestant.questions.card,
    postLoginTestId: testIds.contestant.questions.list,
    reach: async (page) => {
      await page
        .getByTestId(testIds.contestant.questions.list)
        .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
      await expandEveryCategory(page);
    }
  },
  {
    // Reached by WALKING the expanded overview through the questions-overview fixture, never by a constructed URL: `/contestant/questions/[questionId]` carries the internal database id, and the suite knows candidates and questions by seed `external_id` only — there is no fixture that could build this path. The fixture's `goToQuestion` owns the expand-all-then-click walk.
    // Anchor on a question choice, which exists only once the question's input has mounted; the question heading renders from the loader before it.
    // Marker: the save button, which only the editing (authenticated) view has.
    name: 'cand-question',
    fixture: 'raw',
    routeId: 'ContestantAppQuestions',
    contentTestId: testIds.voter.questions.answerOption,
    postLoginTestId: testIds.contestant.questions.saveButton,
    reach: async (page) => {
      await page
        .getByTestId(testIds.contestant.questions.list)
        .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
      await createContestantQuestionsOverviewPage(page).goToQuestion(0);
      await page.waitForURL(contestantUrlRe('/questions', 'child'), { timeout: TIMEOUTS.slowPage });
    }
  },
  {
    // Anchor on the rendered entity-details article, NOT on `contestant-preview-container`. MEASURED: the preview template wraps its loading, error and success branches in that one container, so the container testid resolves while `<Loading>` is still inside it (anchorText "Loading…", no h1) and the scan reads a spinner. The article renders only on the success branch of the same template, so it is the anchor that means what the container appears to mean. The visual baselines' use of the container is not a precedent here — a screenshot of a spinner fails, a scan of one passes.
    // Marker: the container, which is a fine IDENTITY proof (the protected preview route is the only thing that renders it) even though it is a bad ANCHOR.
    name: 'cand-preview',
    fixture: 'raw',
    routeId: 'ContestantAppPreview',
    contentTestId: testIds.voter.results.entityDetails,
    postLoginTestId: testIds.contestant.preview.container
  },
  {
    // Anchor on the new-password field: the settings form's inputs mount with the candidate's own settings data, while the "Settings" heading is a static i18n title that renders before it.
    // `newPassword` is rendered by the same form template, in the same section, on the same load, so it has the mounts-with-data property the line above relies on. The anchor is load-bearing: without it the scan would run against the static heading.
    // Marker: the update-password submit, which only the authenticated form has.
    name: 'cand-settings',
    fixture: 'raw',
    routeId: 'ContestantAppSettings',
    contentTestId: testIds.contestant.settings.newPassword,
    postLoginTestId: testIds.contestant.settings.updateButton
  },
  {
    // The nav drawer, opened over the candidate home route THROUGH THE FIXTURE.
    // A bare `getByTestId('nav-menu-toggle').click()` is a measured NO-OP at both 1280×720 and 390×844, on both halves of the app: the toggle is server-rendered before its `onclick` is hydrated, so a click inside that gap does nothing and `nav-menu` stays hidden (sampled at 0/30/80/150/400/1200 ms — it never opens). The fixture wraps click-and-assert in a retrying block and owns that race, as it does for two journeys. Anchor on a nav menu item, which exists only once the drawer is actually open.
    // Marker: the candidate settings nav item, rendered by ContestantNav — the authenticated app's own navigation, not the public header.
    name: 'contestant-nav-menu',
    fixture: 'raw',
    routeId: 'ContestantAppHome',
    contentTestId: testIds.shared.navigation.menuItem,
    postLoginTestId: testIds.contestant.nav.settings,
    reach: async (page) => {
      await page
        .getByTestId(testIds.contestant.home.statusMessage)
        .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
      await createNavMenu(page).openMobileNav();
    }
  },
  {
    // The password-reset page, which a signed-in user reaches by a mailed recovery link; it is opened at its own address under the project's session, as it is shown after such a link.
    // Anchor on the account's address, which the page renders from the user its server load returns.
    // Marker: the page's root, which its load renders only for a signed-in user: with no session the load leads to the login page.
    name: 'contestant-password-reset',
    fixture: 'raw',
    routeId: 'ContestantAppResetPassword',
    contentTestId: testIds.contestant.passwordReset.email,
    postLoginTestId: testIds.contestant.passwordReset.page,
    reach: async (page) => {
      const passwordResetPage = createContestantPasswordResetPage(page);
      await passwordResetPage.expectShown();
      await passwordResetPage.expectAddress(TEST_CANDIDATE_EMAIL);
    }
  }
];

/**
 * The entries scanned under the stored session of the user who has NOT accepted the terms of use.
 *
 * A table of its own, so the main loop, which runs under the project's session, does not also emit them: that session's user has accepted and never sees these surfaces.
 */
const TERMS_PENDING_AXE_ROUTES: ReadonlyArray<ContestantAxeRoute> = [
  {
    // The terms-of-use view replaces the page at every protected URL, so it is opened at the home route, and the home markers the other entries use are not rendered.
    // Anchor on the acceptance checkbox, which the view's form renders.
    // Marker: the view's submit button, which only the protected layout renders, and only for a signed-in user who has not accepted.
    name: 'contestant-terms-gate',
    fixture: 'raw',
    routeId: 'ContestantAppHome',
    contentTestId: testIds.contestant.terms.checkbox,
    postLoginTestId: testIds.contestant.terms.submit
  }
];

/**
 * The entries scanned under the stored session of the user who edits several entities.
 *
 * A table of its own for the reason the terms-pending table is one: the project's session belongs to a user with a single entity, whom the app root redirects to that entity's home and whose menu holds no switch item.
 */
const MULTI_ENTITY_AXE_ROUTES: ReadonlyArray<ContestantAxeRoute> = [
  {
    // The profile selection screen is what the app root renders for this user, so no home marker is on the page.
    // Anchor on an entity card: the screen shows a loading indicator until the cards it lists have been provided, so a card exists only once the user's entities have rendered.
    // Marker: the wrapper of the screen's groups, which the selection screen alone renders.
    name: 'contestant-entity-selection',
    fixture: 'raw',
    routeId: 'ContestantAppHome',
    contentTestId: testIds.voter.results.card,
    postLoginTestId: testIds.contestant.entitySelection.list
  },
  {
    // The nav drawer of a user with several entities, opened over the home of the first entity the selection screen lists, and reached as that user reaches it: by activating the card. The drawer opens through the fixture, for the reason given at `contestant-nav-menu`.
    // Anchor on a nav menu item, which exists only once the drawer is open.
    // Marker: the switch item, which the menu renders only for a user who edits several entities and only on an entity's pages.
    name: 'contestant-nav-menu-switch',
    fixture: 'raw',
    routeId: 'ContestantAppHome',
    contentTestId: testIds.shared.navigation.menuItem,
    postLoginTestId: testIds.contestant.nav.switchEntity,
    reach: async (page) => {
      await page
        .getByTestId(testIds.contestant.entitySelection.list)
        .getByTestId(testIds.voter.results.cardAction)
        .first()
        .click();
      await page.waitForURL(contestantHomeUrlRe(), { timeout: TIMEOUTS.slowPage });
      await page
        .getByTestId(testIds.contestant.home.statusMessage)
        .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
      const navMenu = createNavMenu(page);
      await navMenu.openMobileNav();
      await navMenu.expectSwitchEntityItem();
    }
  }
];

/**
 * The entries scanned under the stored session of the user who edits no entity.
 */
const NO_ENTITY_AXE_ROUTES: ReadonlyArray<ContestantAxeRoute> = [
  {
    // The "nothing to edit" view is what the app root renders for this user, so no home marker is on the page.
    // Anchor on the signed-in email, which the view renders from the user the protected load returns.
    // Marker: the view's own logout button, which only this view renders.
    name: 'contestant-nothing-to-edit',
    fixture: 'raw',
    routeId: 'ContestantAppHome',
    contentTestId: testIds.contestant.nothingToEdit.email,
    postLoginTestId: testIds.contestant.nothingToEdit.logout
  }
];

/** A password the form accepts and a confirmation that differs from it, so the form refuses the pair at the confirmation. */
const MISMATCHED_PASSWORDS = Object.freeze({ password: 'Mismatch-One-7q!', confirmation: 'Mismatch-Two-8r?' });

/**
 * The entries scanned under the stored session of the user whose account has no password.
 *
 * Neither entry saves a password: the first presses nothing, and the second presses the main button with a confirmation that differs from the password, which the form refuses before anything is sent. So every reader of the session meets the view.
 */
const PASSWORDLESS_AXE_ROUTES: ReadonlyArray<ContestantAxeRoute> = [
  {
    // The set-password view replaces the page at every protected URL, so it is opened at the home route; the reach asserts that it names this session's account.
    // Anchor on the view's root, which the protected layout renders in place of the page.
    // Marker: the same root, which only a signed-in user whose account has no password is shown.
    name: 'contestant-set-password-gate',
    fixture: 'raw',
    routeId: 'ContestantAppHome',
    contentTestId: testIds.contestant.setPasswordGate.container,
    postLoginTestId: testIds.contestant.setPasswordGate.container,
    reach: async (page) => {
      const setPasswordGate = createContestantSetPasswordGate(page);
      await setPasswordGate.expectShown();
      await setPasswordGate.expectAddress(TEST_PASSWORDLESS_EMAIL);
    }
  },
  {
    // The same view after its main button was pressed with a confirmation that differs from the password: the confirmation's field in error, with focus on it. Nothing is saved.
    // Anchor on the view's root, as above.
    // Marker: the confirmation's error, which the form shows only after it refused the pair.
    name: 'contestant-set-password-gate-invalid',
    fixture: 'raw',
    routeId: 'ContestantAppHome',
    contentTestId: testIds.contestant.setPasswordGate.container,
    postLoginTestId: testIds.contestant.passwordSetter.confirmationError,
    reach: async (page) => {
      const setPasswordGate = createContestantSetPasswordGate(page);
      await setPasswordGate.expectShown();
      await setPasswordGate.expectAddress(TEST_PASSWORDLESS_EMAIL);
      await setPasswordGate.submit(MISMATCHED_PASSWORDS.password, MISMATCHED_PASSWORDS.confirmation);
      await createContestantPasswordSetter(page).expectFieldError('confirmation');
    }
  }
];

/**
 * Expand EVERY category expander on the questions overview.
 *
 * Mirrors `contestantQuestionsOverviewPage.goToQuestion`'s first step rather than reaching for a private helper: an already-open expander's checkbox is left checked by `check()`, so this is idempotent. The loop is bounded by a count read once up front — no polling, no fixed-duration wait.
 */
async function expandEveryCategory(page: Page): Promise<void> {
  const expanders = page.getByTestId(testIds.contestant.questions.categoryExpander);
  const expanderCount = await expanders.count();
  for (let index = 0; index < expanderCount; index++) {
    const checkbox = expanders.nth(index).getByRole('checkbox').first();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  }
}

for (const entry of CONTESTANT_AXE_ROUTES) {
  declareScans(entry);
}

// The session is scoped HERE rather than on the project. The project's session belongs to a user who has accepted the terms of use; the terms-of-use view is reached only by one who has not. The path is declared once, in `testCredentials.ts`, and imported by the setup that writes the file and by this spec, so no session path is spelled in this file.
test.describe(() => {
  test.use({ storageState: TERMS_PENDING_STORAGE_STATE });

  for (const entry of TERMS_PENDING_AXE_ROUTES) {
    declareScans(entry);
  }
});

// The session is scoped here for the same reason: the selection screen and the switch item exist only for a user who edits several entities, and the project's user edits one. The scans read this session and leave it as it is: every reader of the run loads the same file.
test.describe(() => {
  test.use({ storageState: MULTI_ENTITY_STORAGE_STATE });

  for (const entry of MULTI_ENTITY_AXE_ROUTES) {
    declareScans(entry);
  }
});

// The "nothing to edit" view is reached only by a signed-in user with no grant. The scans read this session and leave it as it is: the view's logout button is the reach marker and is never pressed.
test.describe(() => {
  test.use({ storageState: NO_ENTITY_STORAGE_STATE });

  for (const entry of NO_ENTITY_AXE_ROUTES) {
    declareScans(entry);
  }
});

// The set-password view is reached only by a signed-in user whose account has no password. The session was made through a mailed link and is read-only for the run: no entry here saves a password or signs out.
test.describe(() => {
  test.use({ storageState: PASSWORDLESS_STORAGE_STATE });

  for (const entry of PASSWORDLESS_AXE_ROUTES) {
    declareScans(entry);
  }
});
