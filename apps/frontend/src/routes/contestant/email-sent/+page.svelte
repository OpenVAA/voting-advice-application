<!--@component

# Contestant app "email sent" page

Shown after a link was asked for by email, whichever screen asked: the sign-in screen, the registration screens or the forgot-password page. It renders the shared `EmailSentScreen` over the contestant context's entry flow.

- The page shows the one link request the entry flow holds. Its wording follows the screen the request was made on, its address is the one the user typed, and its count runs on this tab's clock. Nothing of a request's answer is read, so the page is the same whatever became of the request.
- A reload or a visit by address finds the entry flow empty, so the page's load answers it with a redirect to the login screen before anything is rendered (`+page.ts`). While the entry flow holds no request after a client-side navigation, the page renders nothing and leads to the login screen in place of this history entry. A signed-in user goes on from the login screen to the app's home.
- The page is open to a signed-in user too, and is no entry route of the app's gate.
- "Use another email address" leads back to the screen the address was typed on: the sign-in screen, the registration screen, the screen that takes the address for a valid code, or the forgot-password page.

-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { EmailSentScreen } from '$lib/dynamic-components/accountScreens';

  // Stable references are destructured. `entryFlow` and `appSettings` are reactive accessors, read as `contestantCtx.X` inside each tracking scope: see CLAUDE.md "Context Destructuring Rule".
  const contestantCtx = getContestantContext();
  const { getRoute, resendEntryLink, t } = contestantCtx;
  const contestantAppName = $derived(getContestantAppName({ appSettings: contestantCtx.appSettings, t }));
  const { pageStyles } = getLayoutContext();

  /** The screen an address was typed on, by the origin of the request made there. An origin with no entry has no such screen. */
  const addressScreenHrefs = $derived({
    signIn: getRoute.current('ContestantAppLoginEmail'),
    register: getRoute.current('ContestantAppRegister'),
    registerEmail: getRoute.current('ContestantAppRegisterCodeEmail'),
    forgotPassword: getRoute.current('ContestantAppForgotPassword')
  });

  $effect(() => {
    if (!contestantCtx.entryFlow?.request) void goto(getRoute.current('ContestantAppLogin'), { replaceState: true });
  });

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
</script>

<EmailSentScreen
  appName={contestantAppName}
  request={contestantCtx.entryFlow?.request}
  {resendEntryLink}
  {addressScreenHrefs}
  returnHref={getRoute.current('ContestantAppLogin')}
  testId="contestant-email-sent" />
