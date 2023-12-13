<script lang="ts">
  import {page} from '$app/stores';
  import PasswordResetPage from './PasswordResetPage.svelte';
  import {FrontPage} from '$lib/templates/frontPage';

  const code = $page.url.searchParams.get('code');
  let validCode = false;

  const checkCode = async () => {
    validCode = true;
    return;

    // TODO: Request code check from backend
  };
  const checkCodePromise = checkCode();
</script>

<!-- Show loading spinner while waiting for code check-->
{#await checkCodePromise}
  <FrontPage title="">
    <span class="loading loading-spinner loading-lg" />
  </FrontPage>
{:then}
  {#if code && validCode}
    <PasswordResetPage {code} />
  {:else}
    <!-- Redirect to /candidate in case of invalid code-->
    <FrontPage title="Password Reset" />
  {/if}
{/await}
