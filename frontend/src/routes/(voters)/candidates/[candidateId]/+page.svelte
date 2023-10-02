<script lang="ts">
  import {CandidateDetailsCard} from '$lib/components/candidates';
  import type {PageServerData} from './$types';

  export let data: PageServerData;
</script>

<div class="flex w-full flex-grow flex-col items-center bg-base-300 lg:p-md lg:pb-0">
  <div class="w-full max-w-xl flex-grow rounded-t-lg bg-base-100 pb-[3.5rem] lg:shadow-xl">
    <CandidateDetailsCard candidate={data.candidate} />
  </div>
</div>
