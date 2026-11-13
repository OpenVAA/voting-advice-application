<!--@component

# Contestant app reset password page

Lets a signed-in user set a new password, through the shared `PasswordResetScreen`. A mailed password-recovery link the Contestant App asked for lands its user here.

- The page's server load decides whether it is shown: a visitor with no session is redirected to the login page before any of it is rendered. It is shown to every signed-in user, however they arrived, and asks for no current password.
- The address of the account is shown as text and handed to the password form. It comes from the page's server load, so it is in the server's markup.
- A saved password leaves the user signed in and leads to the app root, with the loads rerun. A failed save is reported as an alert, and the form stays with what was typed.

## Data

- `email`: The address of the signed-in user, from the page's server load. When the account has none, the label and the address are left out together.

## Settings

- `contestantApp.entityTypes`: The entity types the project serves, which decide the app's name above the heading.

-->

<script lang="ts">
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { PasswordResetScreen } from '$lib/dynamic-components/accountScreens';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Stable references are destructured. `appSettings` is a reactive accessor, read as `contestantCtx.appSettings` inside its tracking scope: see CLAUDE.md "Context Destructuring Rule".
  const contestantCtx = getContestantContext();
  const { getRoute, setPassword, t } = contestantCtx;
  const contestantAppName = $derived(getContestantAppName({ appSettings: contestantCtx.appSettings, t }));
  const { pageStyles } = getLayoutContext();

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
</script>

<PasswordResetScreen
  appName={contestantAppName}
  email={data.email}
  {setPassword}
  homeHref={getRoute.current('ContestantAppHome')}
  testId="contestant-password-reset" />
