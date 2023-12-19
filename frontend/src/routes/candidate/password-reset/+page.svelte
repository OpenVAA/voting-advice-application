<script lang="ts">
  import {page} from '$app/stores';
  import {goto} from '$app/navigation';
  import {candidateAppRoute} from '$candidate/placeholder.json';
  import PasswordResetPage from './PasswordResetPage.svelte';

  const codeParam = $page.url.searchParams.get('code');
  let code: string;

  async function checkParam() {
    if (!codeParam) {
      await goto(candidateAppRoute);
      return;
    }
    code = codeParam;
  }
</script>

{#await checkParam() then}
  <PasswordResetPage {code} />
{/await}
