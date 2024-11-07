<script lang="ts">
  import { RequireAnswers, RequireLogin } from '$lib/candidate/components/candidateContext';
</script>

<RequireLogin showLogin>
  <RequireAnswers>
    <slot />
  </RequireAnswers>
</RequireLogin>
