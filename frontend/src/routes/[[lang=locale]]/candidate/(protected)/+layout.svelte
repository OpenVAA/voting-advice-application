<script lang="ts">
  import { RequireLogin, RequireAnswers } from '$lib/candidate/components/candidateContext';
</script>

<RequireLogin showLogin>
  <RequireAnswers>
    <slot />
  </RequireAnswers>
</RequireLogin>
