<script lang="ts">
  import {appName} from '$candidate/placeholder.json';
  import AuthenticationProvider from '$lib/components/authentication/AuthenticationProvider.svelte';
</script>

<AuthenticationProvider>
  <h1>Welcome to the {appName}</h1>
</AuthenticationProvider>
