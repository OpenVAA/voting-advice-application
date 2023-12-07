<script lang="ts">
  import Navigation from '$lib/candidate/Navigation.svelte';
  import AuthenticationProvider from '$lib/components/authentication/AuthenticationProvider.svelte';
</script>

<AuthenticationProvider>
  <Navigation>
    <slot />
  </Navigation>
</AuthenticationProvider>
