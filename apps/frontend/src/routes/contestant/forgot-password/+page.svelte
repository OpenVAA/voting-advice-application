<!--@component

# Contestant app forgot password page

Takes an email address and asks for a mail with which to set a new password, through the shared `ForgotPasswordScreen`.

- A press of the main button with an address that cannot be used sends nothing: the field says what to enter and takes focus.
- With a usable address the page asks for a password-recovery link with the trimmed address, and opens the "email sent" screen when the request has settled, whatever it settled as. Nothing about the address is looked up, and nothing of the request's answer is read: the page shows the same to every visitor, whether or not the address has an account.
- The request names no app, so its link lands in the Contestant App.
- The page is open to a signed-in user too.

## Params

- `email`: An address to fill the field with when the page is opened, as the sign-in screens' links pass the address typed there. It is read once, when the page is created, and only fills the field: nothing is asked for until the main button is pressed.

## Settings

- `contestantApp.servedEntityTypes`: The entity types the project serves, which decide the app's name above the heading.

-->

<script lang="ts">
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { ForgotPasswordScreen } from '$lib/dynamic-components/accountScreens';

  // Stable references are destructured. `appSettings` is a reactive accessor, read as `contestantCtx.appSettings` inside its tracking scope: see CLAUDE.md "Context Destructuring Rule".
  const contestantCtx = getContestantContext();
  const { getRoute, sendEntryLink, t } = contestantCtx;
  const contestantAppName = $derived(getContestantAppName({ appSettings: contestantCtx.appSettings, t }));
  const { pageStyles } = getLayoutContext();

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
</script>

<ForgotPasswordScreen
  appName={contestantAppName}
  {sendEntryLink}
  emailSentHref={getRoute.current('ContestantAppEmailSent')}
  returnHref={getRoute.current('ContestantAppLoginEmail')}
  testId="contestant-forgot-password" />
