<!--@component

# Admin app login page

- The `/admin` routes redirect here if there is no auth token in the cookie
- Shows login form for admin users

## Params

- `redirectTo`: The path to redirect to after successful login
- `errorMessage`: The error to show, if the user has been forcibly logged out after an error

-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { applyAction, enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { PasswordField } from '$lib/candidate/components/passwordField';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { getAdminContext } from '$lib/contexts/admin';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getAppContext } from '$lib/contexts/app';
  import { Footer } from '$lib/dynamic-components/footer';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getAppContext();
  const adminContext = getAdminContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Handle form and error messages
  ////////////////////////////////////////////////////////////////////

  const errorParam = $page.url.searchParams.get('errorMessage');
  const redirectTo = $page.url.searchParams.get('redirectTo');

  let canSubmit: boolean;
  let email = '';
  let errorMessage: string | undefined;
  let password = '';
  let status: ActionStatus = 'idle';

  if (errorParam) {
    errorMessage = errorParam === 'invalid' ? 'Invalid email or password' : 'An unknown error occurred';
  }
  if (errorMessage) status = 'error';

  $: canSubmit = !!(status !== 'loading' && email && password);

  ///////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
</script>

<MainContent title="Admin Login">
  <div class="flex w-full flex-col items-center">
    <div class="mb-lg text-center">
      <h1 class="text-primary">Election Compass</h1>
      <h2 class="text-base-content">Administration</h2>
      <p class="mt-md">Enter your login details.</p>
    </div>

    <form
      class="flex w-full flex-col flex-nowrap items-center"
      method="POST"
      action="login"
      use:enhance={() => {
        status = 'loading';
        return async ({ update, result }) => {
          await update();
          if (result.type === 'failure') {
            status = 'error';
            errorMessage = result.status === 400 ? 'Invalid email or password' : 'An unknown error occurred';
            return;
          }
          await applyAction(result);
          status = 'success';
        };
      }}>
      <div class="flex w-full flex-col items-center">
        <label for="email" class="hidden">Email</label>
        <input hidden name="redirectTo" value={redirectTo} />
        <input
          type="email"
          name="email"
          id="email"
          bind:value={email}
          class="input mb-md w-full max-w-md"
          placeholder="Email"
          autocomplete="email"
          required />
        <div class="mb-md w-full max-w-md">
          <PasswordField autocomplete="current-password" id="password" bind:password />
        </div>
        {#if status === 'error'}
          <ErrorMessage inline message={errorMessage} class="mb-md" />
        {/if}
        <Button
          type="submit"
          disabled={!canSubmit}
          loading={status === 'loading'}
          text="Login"
          variant="main"
          class="w-full max-w-md" />
      </div>

      <div class="mt-lg">
        <Button href="/admin/forgot-password" text="Forgot Password?" variant="normal" />
      </div>
    </form>

    <div class="mt-auto pt-lg text-center text-xs text-base-content/70">
      <p>
        Published by <span class="font-semibold">PubLogo</span> • Built with <span class="font-semibold">OpenVAA</span>
      </p>
    </div>
  </div>
</MainContent>
