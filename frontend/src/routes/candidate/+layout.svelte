<script lang="ts">
  import Navigation from '$lib/components/navigation/Navigation.svelte';
  import AuthenticationProvider from '$lib/components/authentication/AuthenticationProvider.svelte';
</script>

<AuthenticationProvider>
  <Navigation>
    <slot />
  </Navigation>
</AuthenticationProvider>
