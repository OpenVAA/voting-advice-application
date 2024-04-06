<script lang="ts">
  import {CandidateContextProvider} from '$lib/candidate/components/candidateContext';
  import {appType} from '$lib/utils/stores';
  $appType = 'candidate';
</script>

<CandidateContextProvider>
  <slot />
</CandidateContextProvider>
