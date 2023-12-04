<script>
  import RequireLogin from '$lib/components/authentication/RequireLogin.svelte';
</script>

<RequireLogin showLogin>
  <slot />
</RequireLogin>
