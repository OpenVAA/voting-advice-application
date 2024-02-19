<script lang="ts">
  import {AuthenticationProvider, RequireLogin} from '$lib/components/authentication';
</script>

<AuthenticationProvider>
  <RequireLogin showLogin>
    <slot />
  </RequireLogin>
</AuthenticationProvider>
