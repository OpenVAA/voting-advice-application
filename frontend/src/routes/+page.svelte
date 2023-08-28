<script lang="ts">
  import {resetLocalStorage} from '$lib/utils/stores';
</script>

<div>
  <h1 class="ml-2.5 mt-14 text-3xl font-medium leading-6 text-gray-500">
    Welcome to Voting Advice Application!
  </h1>
  <a href="/questions"><span class="badge ml-4 mt-4">Answer questions</span></a> <br />
  <a href="/candidates"><span class="badge ml-4 mt-4">View candidates</span></a> <br />
  <a href="/parties"><span class="badge ml-4 mt-4">View parties</span></a>
  <div>
    <button on:click={resetLocalStorage} class="text-warn btn-ghost btn"
      >Reset local storage</button>
  </div>
</div>
