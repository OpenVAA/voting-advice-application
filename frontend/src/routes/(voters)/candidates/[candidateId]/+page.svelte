<script lang="ts">
  import {CandidateDetailsCard} from '$lib/components/candidates';
  import type {PageServerData} from './$types';

  export let data: PageServerData;
</script>

<CandidateDetailsCard candidate={data.candidate} />
