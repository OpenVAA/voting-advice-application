<!--@component

# Admin app forgot password page

Takes an email address and asks for a mail with which to set a password, through the shared `ForgotPasswordScreen`. The login page's "Forgot Password?" and "I have not set a password yet" both lead here.

- A press of the main button with an address that cannot be used sends nothing: the field says what to enter and takes focus.
- With a usable address the page asks for a recovery link made for the Admin App, so that the mailed link lands in the Admin App, and opens the "email sent" page when the request has settled, whatever it settled as. The page shows the same to every visitor, whether or not the address has an account: an address with an account is mailed a recovery link, an address with only an invitation a sign-in link, and any other address nothing.
- The page is open to a signed-in user too.

## Params

- `email`: An address to fill the field with when the page is opened, as the login page's links pass the address typed there.

-->

<script lang="ts">
  import { getAdminContext } from '$lib/contexts/admin';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { ForgotPasswordScreen } from '$lib/dynamic-components/accountScreens';

  const { getRoute, sendEntryLink, t } = getAdminContext();
  const { pageStyles } = getLayoutContext();

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
</script>

<ForgotPasswordScreen
  appName={t('adminApp.login.appSubtitle')}
  {sendEntryLink}
  emailSentHref={getRoute.current('AdminAppEmailSent')}
  returnHref={getRoute.current('AdminAppLogin')}
  testId="admin-forgot-password" />
