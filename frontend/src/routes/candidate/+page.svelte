<script lang="ts">
  import {appName} from '$candidate/placeholder.json';
  import RequireLogin from '$lib/components/authentication/RequireLogin.svelte';
</script>

<RequireLogin showLogin>
  <h1>Welcome to the {appName}</h1>
</RequireLogin>
