<script lang="ts">
  import {AuthenticationProvider, RequireLogin} from '$lib/components/authentication';
  import {AnswerProvider} from '$candidate/components/answers';
</script>

<AuthenticationProvider>
  <RequireLogin showLogin>
    <!-- Load answers for all routes under /candidate -->
    <AnswerProvider>
      <slot />
    </AnswerProvider>
  </RequireLogin>
</AuthenticationProvider>
