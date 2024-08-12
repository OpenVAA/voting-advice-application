<script lang="ts">
  import {page} from '$app/stores';
  import {goto} from '$app/navigation';
  import {getRoute, ROUTE} from '$lib/utils/navigation';
  import PasswordResetPage from './PasswordResetPage.svelte';

  const codeParam = $page.url.searchParams.get('code');
  let code: string;

  async function checkParam() {
    if (!codeParam) {
      await goto($getRoute(ROUTE.CandAppHome));
      return;
    }
    code = codeParam;
  }
</script>

{#await checkParam() then}
  <PasswordResetPage {code} />
{/await}
