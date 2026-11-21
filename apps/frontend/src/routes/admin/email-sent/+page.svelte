<!--@component

# Admin app "email sent" page

Shown after the forgot-password page asked for a link. It renders the shared `EmailSentScreen` over the admin context's entry flow.

- The page shows the one link request the entry flow holds, in its recovery wording, with the address the user typed. Nothing of a request's answer is read.
- A reload or a visit by address finds the entry flow empty, so the page's load answers it with a redirect to the login page before anything is rendered (`+page.ts`). While the entry flow holds no request after a client-side navigation, the page renders nothing and leads to the login page in place of this history entry.
- "Use another email address" leads back to the forgot-password page.

-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { getAdminContext } from '$lib/contexts/admin';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { EmailSentScreen } from '$lib/dynamic-components/accountScreens';

  // Stable references are destructured. `entryFlow` is a reactive accessor, read as `ctx.entryFlow` inside each tracking scope: see CLAUDE.md "Context Destructuring Rule".
  const ctx = getAdminContext();
  const { getRoute, resendEntryLink, t } = ctx;
  const { pageStyles } = getLayoutContext();

  $effect(() => {
    if (!ctx.entryFlow?.request) void goto(getRoute.current('AdminAppLogin'), { replaceState: true });
  });

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
</script>

<EmailSentScreen
  appName={t('adminApp.login.appSubtitle')}
  request={ctx.entryFlow?.request}
  {resendEntryLink}
  addressScreenHrefs={{ forgotPassword: getRoute.current('AdminAppForgotPassword') }}
  returnHref={getRoute.current('AdminAppLogin')}
  testId="admin-email-sent" />
