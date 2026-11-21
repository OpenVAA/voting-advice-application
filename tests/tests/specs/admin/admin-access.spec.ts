import { expect, test } from '@playwright/test';
import { createAdminLoginPage } from '../../fixtures/admin/adminLoginPage.fixture';
import { createHeaderLogout } from '../../fixtures/shared/headerLogout.fixture';
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from '../../utils/adminCredentials';
import { buildRoute } from '../../utils/buildRoute';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import type { Page } from '@playwright/test';

/**
 * # The Admin App's first end-to-end coverage
 *
 * Zero specs touched the admin surface before this one. That is why two green full-suite runs said
 * nothing at all about a total admin outage: the suite had no opinion about `/admin/**` to be wrong
 * about. This file is that opinion.
 *
 * ## What kind of spec this is
 *
 * A **REGRESSION** spec over a working path, not the proof half of a fix. The measured arm in the phase record `158-ADMIN-BASELINE.md` is **GREEN**: at the HEAD it was taken against, an authenticated admin already got 200 on direct entry to `/admin`, 200 on refresh, and 200 on `/api/admin/jobs/active`. So a failure HERE is a NEW defect, not a known one — and the residual risk that arm accepted (it rested on one manual observation per database state, so an intermittent break would have been invisible) is exactly what this spec, running on every full suite, is the mitigation for.
 *
 * ## The five things it guards, and which failure each one catches
 *
 * 1. **Cold entry** — a fresh document load of the admin home. Catches the universal-load defect class in which a server-rendered entry bounces an authenticated admin to the login page.
 * 2. **Reload** — a real browser reload, which produces a NEW server-rendered request. This is the half that matters most and the only reason the walk is written this way: a warm client-side navigation re-runs the universal load IN THE BROWSER, where the session is present regardless, so a navigation-only spec would pass while the defect it guards was live.
 * 3. **The hook gate, on its discriminating arm** — an AUTHENTICATED request for the admin login page must answer 303 to the admin home. The unauthenticated 307 is NOT a proof of anything: the admin protected layout has always emitted that identical bounce to that identical target, so hook and layout are indistinguishable on that arm. This one is not: with the admin row removed from `APP_GATES` the login page answers 200 and stays put.
 * 4. **The endpoint** — an authenticated call to a jobs endpoint through this context's own cookies. Its refusal statuses are two different facts and the failure message says which one arrived: 401 means no session reached the endpoint, 403 means the identity was not an admin.
 * 5. **The rendered payload** — this application's browser-script-inaccessible cookies are seeded into the jar with recognisable values, and none of those values may appear in what the server renders. The session-cookie name that DOES appear is the positive control, in the same expectation, because an empty payload would satisfy the absences trivially.
 * 6. **The job-write round trip** — a failure-path form submission that reaches a real `admin_jobs` insert under the admin's own credentials, WITHOUT reaching a language-model provider.
 *
 * ## Why status codes are never asserted alone
 *
 * Measured on this phase: after a bare `yarn db:reset` (no dataset), every admin page answers **200** — because the app renders its generic error boundary at 200 when the data layer comes back empty. `GET /` does the same, which is what identifies it as a database-state artifact rather than an admin defect. A `toBe(200)` therefore passes against a broken page. Every status assertion below is paired with an assertion about content or about a settled address.
 */

/**
 * A question identifier that resolves to nothing.
 *
 * The observation point. `condenseArguments` resolves selected questions with `dataRoot.getQuestion`, which RAISES for an unknown id — and it does so upstream of the language-model provider's construction and downstream of both branches that complete successfully without writing anything.
 */
const UNRESOLVABLE_QUESTION_ID = '00000000-0000-4000-8000-00000000dead';

/**
 * The cookies this application sets `httpOnly`, spelled here rather than imported.
 *
 * `apps/frontend/src/lib/cookies/index.ts` is the single declaration of the names, but it does not say which of them are `httpOnly`. The copy is not unguarded: the unit spec `apps/frontend/src/routes/admin/(protected)/subtreeCookieFilter.server.test.ts` pins that map's names, so a newly registered cookie reddens there rather than slipping past here unnoticed.
 */
const HTTP_ONLY_COOKIE_NAMES = [
  'oidc_state',
  'oidc_nonce',
  'oidc_code_verifier',
  'oidc_entity_type',
  'identity_provider_arrival',
  'registered'
] as const;

/**
 * Resolve ONE election that belongs to the project this admin's role is scoped to.
 *
 * NO IDENTIFIER IS NAMED HERE, and that is a correction the run itself forced. The first draft named the base dataset's `test-e2e-base-el-reg` by external id; MEASURED, it resolved to **0 rows** at this project's position in the schedule. The perm setups pre-clear the `test-` prefix on their way in — 25 such pre-clears run between `data-setup-base` and the chain's tail — so by the time the admin projects run, the base dataset is gone and only the last perm dataset is live. Naming ANY dataset's row would therefore couple this spec to which project happens to run before it.
 *
 * What actually matters for the write under test is narrower than an identity: `admin_jobs`'s row-level policy admits an insert only when `user_can('project', project_id, …)` holds, and this client's reads are already scoped to that same project — so any election it can see is one whose `project_id` the admin's project-scope grant covers. Which election it is is irrelevant.
 *
 * Hoisted to module level, as `waitForLoginForm` is in the candidate auth setup, so the branch on the lookup's settled result does not sit inside the walk itself — the branch reports on a SETTLED result and is not a race-mask, but `playwright/no-conditional-in-test` cannot tell the two apart and is right not to try.
 *
 * @param client - The service-role admin client, whose reads are project-scoped.
 * @returns `outcome` describing what the lookup found, plus the id and external id when it found one.
 */
async function resolveElection(client: SupabaseAdminClient): Promise<{
  outcome: string;
  id: string;
  externalId: string;
}> {
  const { data, error } = await client.query('elections').limit(1);
  if (error) return { outcome: `lookup failed: ${error.message}`, id: '', externalId: '' };
  const rows = data ?? [];
  if (rows.length !== 1) return { outcome: `${rows.length} elections in this project`, id: '', externalId: '' };
  return { outcome: 'one election', id: rows[0].id as string, externalId: String(rows[0].external_id) };
}

test.describe('admin-access (D10-C11 / D10-C08 / D10-C12)', () => {
  test('an authenticated admin: cold entry, reload, the gate, the endpoint, the payload, and a real job write', async ({
    page,
    context,
    baseURL
  }) => {
    const client = new SupabaseAdminClient();
    const adminHome = buildRoute({ route: 'AdminAppHome', locale: 'en' });
    const adminLogin = buildRoute({ route: 'AdminAppLogin', locale: 'en' });
    const argumentCondensation = buildRoute({ route: 'AdminAppArgumentCondensation', locale: 'en' });

    // The negative half of every positive assertion below. A redirect is followed silently, so an address assertion on its own cannot tell a landing from a bounce that came back.
    const loginAddress = new RegExp(`${adminLogin}(\\?|$)`);
    const postGateContent = page.getByRole('button', { name: 'Jobs Monitoring' });

    // ---------------------------------------------------------------------
    // 1. COLD ENTRY — a fresh document load, never a click-through.
    // ---------------------------------------------------------------------
    await page.goto(adminHome);
    await expect(page).toHaveURL(new RegExp(`${adminHome}$`));
    await expect(page).not.toHaveURL(loginAddress);
    await expect(postGateContent).toBeVisible();

    // ---------------------------------------------------------------------
    // 2. RELOAD — a real browser reload, which issues a NEW server-rendered request.
    //
    // A `page.goto` from inside the app, or any in-app link click, would be a client-side navigation: the universal load then re-runs in the browser, where the session is already present, and the spec would pass while a broken server-rendered entry shipped. Only a reload re-exercises the cold path. Do not replace this with a navigation.
    // ---------------------------------------------------------------------
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`${adminHome}$`));
    await expect(page).not.toHaveURL(loginAddress);
    await expect(postGateContent).toBeVisible();

    // ---------------------------------------------------------------------
    // 3. THE HOOK GATE, ON THE ARM THAT DISCRIMINATES.
    //
    // An authenticated caller asking for the admin LOGIN page must be bounced to the admin home.
    // The load of `admin/login/+page.server.ts` returns no data, so the login page itself cannot produce this answer — only `appGateHandle`'s `whenAuthenticatedOnLogin` descriptor can. With the admin row deleted from `APP_GATES` this is a 200 on the login page instead.
    //
    // `maxRedirects: 0` is what makes the observation the FIRST response rather than wherever the chain settles; the request context is the page's own, so it carries this context's cookies.
    // ---------------------------------------------------------------------
    const loginBounce = await page.request.get(adminLogin, { maxRedirects: 0 });
    expect(
      { status: loginBounce.status(), location: loginBounce.headers()['location'] ?? '(absent)' },
      'an authenticated GET of the admin login page must be bounced to the admin home by the hook gate. ' +
        'A 200 here means the gate is not deciding this request — the login page rendered instead.'
    ).toEqual({ status: 303, location: expect.stringContaining(adminHome) });

    // ---------------------------------------------------------------------
    // 4. THE JOBS ENDPOINT, through this context's own cookies.
    // ---------------------------------------------------------------------
    const activeJobs = await page.request.get('/api/admin/jobs/active');
    const activeJobsStatus = activeJobs.status();
    expect(
      activeJobsStatus,
      activeJobsStatus === 401
        ? 'the jobs endpoint answered 401 Unauthorized — NO session reached it, so the stored admin session is not being sent'
        : activeJobsStatus === 403
          ? 'the jobs endpoint answered 403 Forbidden — a session DID reach it but the identity is not an admin, so the role row is missing or mis-scoped'
          : `the jobs endpoint answered ${activeJobsStatus}`
    ).toBe(200);
    expect(await activeJobs.json()).toBeInstanceOf(Array);

    // ---------------------------------------------------------------------
    // 5. THE RENDERED PAYLOAD — the observation half of the serialisation obligation.
    //
    // Seed the jar with the browser-script-inaccessible cookie names carrying values nothing else in this run could produce, then read what the server rendered. Everything a server load returns is serialised into the document and is readable by client JavaScript, so any of these values appearing there would defeat the `httpOnly` flag outright.
    // ---------------------------------------------------------------------
    const nonce = `leak-canary-${Date.now()}`;
    await context.addCookies(
      HTTP_ONLY_COOKIE_NAMES.map((name) => ({ name, value: `${name}-${nonce}`, url: baseURL as string }))
    );

    // The positive control's subject: the session cookie's NAME, which the forwarded cookie array legitimately carries into the payload. Read from the jar rather than spelled, because the Supabase storage key is derived from the project URL.
    const sessionCookieName = (await context.cookies()).map(({ name }) => name).find((name) => name.startsWith('sb-'));
    expect(
      sessionCookieName,
      'the browser context carries no sb-* cookie at all, so the positive control below would be vacuous'
    ).toBeDefined();

    await page.goto(argumentCondensation);
    await expect(page).not.toHaveURL(loginAddress);
    const rendered = await page.content();

    // ONE expectation, one absence per name and one presence. Without the presence half, a payload carrying nothing whatsoever would satisfy `leaked: []` trivially.
    expect({
      leaked: HTTP_ONLY_COOKIE_NAMES.filter((name) => rendered.includes(`${name}-${nonce}`)),
      sentinelPresent: rendered.includes(sessionCookieName as string)
    }).toEqual({ leaked: [], sentinelPresent: true });

    // ---------------------------------------------------------------------
    // 6. THE JOB-WRITE ROUND TRIP.
    //
    // Resolve the election from the database at run time — never transcribe an identifier of any kind, and never name one belonging to another project: `admin_jobs`'s row-level policy admits this identity only for the project its `project_admin` role is scoped to, so a foreign election would fail the insert for a reason unrelated to what is under test. See `resolveElection` for why naming a dataset row by external id was MEASURED to resolve to nothing at this project's position in the schedule.
    // ---------------------------------------------------------------------
    const resolved = await resolveElection(client);
    expect(
      resolved.outcome,
      'no election resolved in the project this admin is scoped to — the submission below would name nothing'
    ).toBe('one election');
    const electionId = resolved.id;

    // The failure-path submission. Question RESOLUTION raises for an id that resolves to nothing, and it raises UPSTREAM of the language-model provider's construction — so the whole write path runs and no completion is ever requested. That is deliberate on both counts: a real provider call in an end-to-end walk is non-deterministic AND a real charge.
    //
    // It is also DOWNSTREAM of the two branches that would make this gate vacuous: the feature returns success WITHOUT any write when no supported question survives filtering, and again when no nominated entity is found. Asserting the written row rather than the response is what makes those two indistinguishable-by-response outcomes fail here.
    const submission = await page.request.post(argumentCondensation, {
      headers: { 'x-sveltekit-action': 'true', accept: 'application/json' },
      form: { electionId, questionIds: UNRESOLVABLE_QUESTION_ID }
    });
    const envelope = (await submission.json()) as { type?: string; status?: number; data?: string };
    expect(
      {
        transport: submission.status(),
        type: envelope.type,
        status: envelope.status,
        generic: envelope.data?.includes('Internal server error') ?? false
      },
      'the failure-path submission must be REFUSED by the action, not succeed — a success here means the ' +
        'unresolvable question id resolved and the write below would be measuring something else. ' +
        'MEASURED: the transport is 200 BY DESIGN. A SvelteKit action answered with `x-sveltekit-action` ' +
        'returns 200 and carries its own status inside the envelope, so an assertion on the HTTP status ' +
        'alone asserts the transport rather than the action — it read 200 against an expected 500 on a ' +
        'run where the action had in fact refused correctly and written its row.'
    ).toEqual({ transport: 200, type: 'failure', status: 500, generic: true });

    // Read the row back. The response alone proves nothing: both vacuous branches also answer without writing, and one of them answers with success.
    const { data: jobRows, error: jobError } = await client
      .query('admin_jobs')
      .eq('author', TEST_ADMIN_EMAIL)
      .eq('election_id', electionId);
    expect(jobError, `reading admin_jobs back failed: ${jobError?.message ?? ''}`).toBeNull();
    expect(
      (jobRows ?? []).map((row) => ({
        author: row.author,
        endStatus: row.end_status,
        jobType: row.job_type,
        namedTheQuestion: (row.input as { questionIds?: Array<string> } | null)?.questionIds?.includes(
          UNRESOLVABLE_QUESTION_ID
        )
      })),
      "exactly one admin_jobs row, authored by this run's admin, recording the failure it caused — " +
        'an empty array means the submission reached one of the two branches that complete without writing'
    ).toEqual([
      {
        author: TEST_ADMIN_EMAIL,
        endStatus: 'failed',
        jobType: 'ArgumentCondensation',
        namedTheQuestion: true
      }
    ]);

    // The row is deliberately LEFT for `data-teardown-admin-access` to remove. Nothing else in the suite can reach it: `admin_jobs` is not in the prefix-counting teardown's table list, carries no external identifier, and its election reference is nulled rather than cascaded.
  });
});

// Each test signs in through the form, with a session of its own. Signing out ends only the session of this browser, so the stored admin session stays valid for the projects that read it.
test.describe('the header’s Log out in the Admin App', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('a signed-in admin sees Log out in the header, and it signs the admin out to the login page', async ({
    page
  }) => {
    const adminLoginPage = createAdminLoginPage(page);
    const headerLogout = createHeaderLogout(page);

    await adminLoginPage.goToPage();
    await adminLoginPage.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await headerLogout.expectAbsent();

    await adminLoginPage.submit();
    await adminLoginPage.expectAdminHome();
    await headerLogout.expectShown();

    await headerLogout.press();
    await adminLoginPage.expectOnLoginPage();
    await headerLogout.expectAbsent();
  });

  test("the Admin App's Log out leaves no Contestant App draft in the browser", async ({ page }) => {
    const adminLoginPage = createAdminLoginPage(page);
    const headerLogout = createHeaderLogout(page);

    await adminLoginPage.goToPage();
    await headerLogout.seedContestantDraft();
    await adminLoginPage.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await adminLoginPage.submit();
    await adminLoginPage.expectAdminHome();
    await headerLogout.expectShown();

    await headerLogout.press();
    await adminLoginPage.expectOnLoginPage();
    await headerLogout.expectNoContestantDraft();
  });

  test("the header's Log out shows that a slow sign-out is under way: a spinner, and the button disabled until it ends", async ({
    page
  }) => {
    const adminLoginPage = createAdminLoginPage(page);
    const headerLogout = createHeaderLogout(page);

    await adminLoginPage.goToPage();
    await adminLoginPage.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await adminLoginPage.submit();
    await adminLoginPage.expectAdminHome();
    await headerLogout.expectShown();

    await headerLogout.holdSignOut();
    await headerLogout.press();
    await headerLogout.expectInProgress();

    await headerLogout.releaseSignOut();
    await adminLoginPage.expectOnLoginPage();
    await headerLogout.expectAbsent();
  });

  test('a sign-out that fails shows the message above the page, whose Close closes it, and a later press signs the admin out to the login page', async ({
    page
  }) => {
    const adminLoginPage = createAdminLoginPage(page);
    const headerLogout = createHeaderLogout(page);

    await adminLoginPage.goToPage();
    await adminLoginPage.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await adminLoginPage.submit();
    await adminLoginPage.expectAdminHome();
    await headerLogout.expectShown();

    await headerLogout.failSignOut();
    await headerLogout.press();
    await headerLogout.expectFailureMessage();
    await headerLogout.expectFailureMessagePressable();
    await headerLogout.closeFailureMessage();
    await headerLogout.expectNoFailureMessage();

    await headerLogout.press();
    await headerLogout.expectFailureMessage();

    await headerLogout.restoreSignOut();
    await headerLogout.press();
    await adminLoginPage.expectOnLoginPage();
    await headerLogout.expectAbsent();
    await headerLogout.expectNoFailureMessage();
  });

  test("the failed sign-out's message is named apart from Log out and has one Close", async ({ page }) => {
    const adminLoginPage = createAdminLoginPage(page);
    const headerLogout = createHeaderLogout(page);

    await adminLoginPage.goToPage();
    await adminLoginPage.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await adminLoginPage.submit();
    await adminLoginPage.expectAdminHome();
    await headerLogout.expectShown();

    await headerLogout.failSignOut();
    await headerLogout.press();
    await headerLogout.expectFailureMessage();
    await headerLogout.expectFailureMessageNamedOnce();
  });

  test('a sign-out that fails with the session alive: Back to the login page ends on the home with the message still there, and a press there says so', async ({
    page
  }) => {
    const adminLoginPage = createAdminLoginPage(page);
    const headerLogout = createHeaderLogout(page);

    await adminLoginPage.goToPage();
    await adminLoginPage.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await adminLoginPage.submit();
    await adminLoginPage.expectAdminHome();
    await headerLogout.expectShown();

    await headerLogout.failSignOut();
    await headerLogout.press();
    await headerLogout.expectFailureMessage();
    const length = await headerLogout.historyLength();

    await test.step('Back to the login page ends on the home, keeps the message and writes no history', async () => {
      // The sign-in writes one history entry, the home's, so one Back reaches the login page's entry.
      await adminLoginPage.goBackToHomeOrLoginForm();
      await expect(page).toHaveURL(new RegExp(`${buildRoute({ route: 'AdminAppLogin', locale: 'en' })}$`));
      await adminLoginPage.expectHomeShownAtAnyAddress();
      await headerLogout.expectFailureMessage();
      expect(await headerLogout.historyLength()).toBe(length);
      await adminLoginPage.expectGateSendsASessionHome();
    });

    await test.step('a press there that fails says so', async () => {
      await headerLogout.closeFailureMessage();
      await headerLogout.press();
      await headerLogout.expectFailureMessage();
    });

    await test.step('a press that works signs the admin out to the login page', async () => {
      await headerLogout.restoreSignOut();
      await headerLogout.press();
      await adminLoginPage.expectOnLoginPage();
      await headerLogout.expectAbsent();
      await headerLogout.expectNoFailureMessage();
    });
  });

  test('on a phone, the message of a sign-out that fails lies inside the viewport', async ({ page }) => {
    const adminLoginPage = createAdminLoginPage(page);
    const headerLogout = createHeaderLogout(page);

    await adminLoginPage.goToPage();
    await adminLoginPage.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await adminLoginPage.submit();
    await adminLoginPage.expectAdminHome();
    await headerLogout.expectShown();

    await headerLogout.failSignOut();
    await headerLogout.press();
    await headerLogout.expectFailureMessage();
    await headerLogout.expectFailureMessageInsideThePhoneViewport();
  });
});

/**
 * Sign in through the form, sign out with the header's Log out, and sign in again in another tab, which then closes. The page stays on the login form, whose data still reads no session, while the cookies hold a live one.
 *
 * @param page - The tab that signs out and stays.
 */
async function signOutHereAndSignInInAnotherTab(page: Page): Promise<void> {
  const adminLoginPage = createAdminLoginPage(page);
  const headerLogout = createHeaderLogout(page);

  await adminLoginPage.goToPage();
  await adminLoginPage.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
  await adminLoginPage.submit();
  await adminLoginPage.expectAdminHome();
  await headerLogout.expectShown();
  await headerLogout.press();
  await adminLoginPage.expectOnLoginPage();

  const otherTab = await page.context().newPage();
  const otherTabLogin = createAdminLoginPage(otherTab);
  await otherTabLogin.goToPage();
  await otherTabLogin.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
  await otherTabLogin.submit();
  await otherTabLogin.expectAdminHome();
  await otherTab.close();
}

// Each test signs in through the form, with a session of its own, as the describe above does.
test.describe("the Admin App's protected load", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('a read of the user data that fails at sign-in ends on the error page, with no request to the login page, and a reload reaches the home once the read works', async ({
    page
  }) => {
    const adminLoginPage = createAdminLoginPage(page);

    await adminLoginPage.goToPage();
    await adminLoginPage.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await adminLoginPage.failUserDataRead();
    await adminLoginPage.submit();
    await adminLoginPage.expectErrorPageSays('default');
    await adminLoginPage.expectNoLoginPageRequest();

    await adminLoginPage.restoreUserDataRead();
    await adminLoginPage.reload();
    await adminLoginPage.expectAdminHome();
  });

  test('the error page of a failed read speaks the language of the page', async ({ page }) => {
    const adminLoginPage = createAdminLoginPage(page);

    await adminLoginPage.goToPage('fi');
    await adminLoginPage.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await adminLoginPage.failUserDataRead();
    await adminLoginPage.submit();
    await adminLoginPage.expectErrorPageSays('default', 'fi');
  });

  test('after a sign-out here and a sign-in in another tab: after Back, a reload reaches the home', async ({
    page
  }) => {
    const adminLoginPage = createAdminLoginPage(page);
    const headerLogout = createHeaderLogout(page);

    await signOutHereAndSignInInAnotherTab(page);
    await adminLoginPage.goBackToHomeOrLoginForm();

    await adminLoginPage.reload();
    await adminLoginPage.expectAdminHome();
    await headerLogout.expectShown();
  });

  test('after a sign-out here and a sign-in in another tab, a sign-in on the form after Back reaches the home', async ({
    page
  }) => {
    const adminLoginPage = createAdminLoginPage(page);

    await signOutHereAndSignInInAnotherTab(page);
    await adminLoginPage.goBackFromLoginFormToLoginForm();
    await adminLoginPage.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await adminLoginPage.submit();
    await adminLoginPage.expectAdminHome();
  });

  test('the login form labels its email field, and typing enables the sign-in', async ({ page }) => {
    const adminLoginPage = createAdminLoginPage(page);

    await adminLoginPage.goToPage();
    await adminLoginPage.expectEmailFieldLabelled();
    await adminLoginPage.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
  });

  test('after a sign-out here and a sign-in in another tab, a link stands on the login form, and a reload reaches the home', async ({
    page
  }) => {
    const adminLoginPage = createAdminLoginPage(page);
    const headerLogout = createHeaderLogout(page);

    await signOutHereAndSignInInAnotherTab(page);
    await adminLoginPage.followLinkInsideTheApp(buildRoute({ route: 'AdminAppHome', locale: 'en' }));
    await adminLoginPage.expectLoginAddressSaysLoginFailed();
    await adminLoginPage.expectLoginFormStandsWithNoMessage();

    await adminLoginPage.reload();
    await adminLoginPage.expectAdminHome();
    await headerLogout.expectShown();
  });

  test('a session ended elsewhere with no signal to this tab: a link from the login form into the app reaches the login form, and so does a reload', async ({
    page
  }) => {
    const adminLoginPage = createAdminLoginPage(page);
    const headerLogout = createHeaderLogout(page);

    await adminLoginPage.goToPage();
    await adminLoginPage.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await adminLoginPage.submit();
    await adminLoginPage.expectAdminHome();

    await headerLogout.endSessionWithNoSignal();

    // The sign-in writes one history entry, the home's, so one Back reaches the login form.
    await adminLoginPage.goBackToHomeOrLoginForm();
    await adminLoginPage.expectOnLoginPage();
    await adminLoginPage.followLinkInsideTheApp(buildRoute({ route: 'AdminAppHome', locale: 'en' }));
    await adminLoginPage.expectOnLoginPage();
    await adminLoginPage.expectLoginAddressSaysLoginFailed();

    await adminLoginPage.reload();
    await adminLoginPage.expectOnLoginPage();
  });

  test('a sign-out in another tab sends this tab at once to a login page that says why', async ({ page }) => {
    const adminLoginPage = createAdminLoginPage(page);

    await adminLoginPage.goToPage();
    await adminLoginPage.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await adminLoginPage.submit();
    await adminLoginPage.expectAdminHome();

    const otherTab = await page.context().newPage();
    const otherTabLogin = createAdminLoginPage(otherTab);
    const otherTabLogout = createHeaderLogout(otherTab);
    await otherTabLogin.goToHome();
    await otherTabLogin.expectAdminHome();
    await otherTabLogout.press();
    await otherTabLogin.expectOnLoginPage();
    await otherTab.close();

    await adminLoginPage.expectOnLoginPage();
    await adminLoginPage.expectSaysWhy('loggedOutElsewhere');
  });

  // The count is written, not driven: no page of the Admin App writes one, and the Contestant App's logout modal, which does, is driven in `contestant-entity-selection`.
  test('a count the browser has let run out ends the session at the next request, on a login page that says why', async ({
    page
  }) => {
    const adminLoginPage = createAdminLoginPage(page);

    await adminLoginPage.goToPage();
    await adminLoginPage.fillAwaitingScript(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await adminLoginPage.submit();
    await adminLoginPage.expectAdminHome();

    await adminLoginPage.writeRunOutCount();
    await adminLoginPage.followLinkInsideTheApp(buildRoute({ route: 'AdminAppQuestionInfo', locale: 'en' }));

    await adminLoginPage.expectOnLoginPage();
    await adminLoginPage.expectSaysWhy('loggedOutAutomatically');
  });
});
