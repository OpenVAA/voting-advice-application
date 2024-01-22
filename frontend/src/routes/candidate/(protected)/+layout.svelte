<script lang="ts">
  import AuthenticationProvider from '$lib/components/authentication/AuthenticationProvider.svelte';
  import RequireLogin from '$lib/components/authentication/RequireLogin.svelte';
</script>

<AuthenticationProvider>
  <RequireLogin showLogin>
    <slot />
  </RequireLogin>
</AuthenticationProvider>
