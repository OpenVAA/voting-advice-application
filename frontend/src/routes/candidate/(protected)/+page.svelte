<script lang="ts">
  import {appName} from '$candidate/placeholder.json';
  import {LogoutButton} from '$lib/candidate/components/logoutButton';
  import RequireLogin from '$lib/components/authentication/RequireLogin.svelte';
  import {BasicPage} from '$lib/templates/basicPage';
</script>

<RequireLogin showLogin>
  <BasicPage title="Welcome to the {appName}">
    <svelte:fragment slot="banner">
      <LogoutButton />
    </svelte:fragment>
  </BasicPage>
</RequireLogin>
