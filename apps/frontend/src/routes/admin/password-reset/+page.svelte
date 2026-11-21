<!--@component

# Admin app reset password page

Lets a signed-in user set a new password, through the shared `PasswordResetScreen`. A mailed password-recovery link the Admin App asked for lands its user here.

- The page's server load decides whether it is shown: a visitor with no session is redirected to the Admin App's login page before any of it is rendered. It asks for no current password.
- A saved password leaves the user signed in and leads to the Admin home, with the loads rerun, where the Admin App's own gate decides whether the user may use it. A failed save is reported as an alert, and the form stays with what was typed.

## Data

- `email`: The address of the signed-in user, from the page's server load.

-->

<script lang="ts">
  import { getAdminContext } from '$lib/contexts/admin';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { PasswordResetScreen } from '$lib/dynamic-components/accountScreens';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const { getRoute, setPassword, t } = getAdminContext();
  const { pageStyles } = getLayoutContext();

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
</script>

<PasswordResetScreen
  appName={t('adminApp.login.appSubtitle')}
  email={data.email}
  {setPassword}
  homeHref={getRoute.current('AdminAppHome')}
  testId="admin-password-reset" />
