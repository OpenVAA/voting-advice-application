<script lang="ts">
  import PasswordResetPage from './PasswordResetPage.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { getRoute, Route } from '$lib/utils/navigation';

  const codeParam = $page.url.searchParams.get('code');
  let code: string;

  async function checkParam() {
    if (!codeParam) {
      await goto($getRoute(Route.CandAppHome));
      return;
    }
    code = codeParam;
  }
</script>

{#await checkParam() then}
  <PasswordResetPage {code} />
{/await}
