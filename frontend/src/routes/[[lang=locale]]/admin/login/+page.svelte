<!--@component
# Admin Login Page

Handles admin authentication
-->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Button } from '$lib/components/button';
  import { Input } from '$lib/components/input';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';

  const { t } = getAppContext();
  const { topBarSettings } = getLayoutContext(() => {});

  // Hide top bar actions on login page
  topBarSettings.push({
    actions: {
      logout: 'hide'
    }
  });

  let email = '';
  let password = '';
  let error: string | null = null;

  const handleSubmit = () => {
    return async ({ result }: { result: { type: string } }) => {
      if (result.type === 'success') {
        goto('/admin');
      } else if (result.type === 'failure') {
        error = 'Invalid credentials';
      }
    };
  };
</script>

<div class="flex min-h-screen flex-col items-center justify-center p-4">
  <div class="w-full max-w-md space-y-8">
    <div class="text-center">
      <h1 class="text-2xl font-bold">Election Compass</h1>
      <h2 class="mt-2 text-xl">Administration</h2>
    </div>

    <form method="POST" class="mt-8 space-y-6" use:enhance={handleSubmit}>
      <div class="space-y-4">
        <Input type="text" name="email" bind:value={email} label="Email" required autocomplete="email" />

        <Input
          type="text"
          name="password"
          bind:value={password}
          label="Password"
          required
          autocomplete="current-password" />

        {#if error}
          <p class="text-sm text-red-600">{error}</p>
        {/if}
      </div>

      <Button text="Login" type="submit" variant="main" />

      <div class="text-center">
        <a href="/admin/forgot-password" class="text-primary-600 hover:text-primary-500 text-sm"> Forgot Password? </a>
      </div>
    </form>
  </div>
</div>
