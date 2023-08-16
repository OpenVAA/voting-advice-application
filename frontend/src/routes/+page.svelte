<script lang="ts">
  import {gotoRoute, PageType} from '$lib/navigation/gotoRoute';

  // TO DO: Check whether we have more than one Election and display items accordingly.

  function gotoElections() {
    gotoRoute({page: PageType.SelectElections});
  }
</script>

<div>
  <h1 class="ml-2.5 mt-14 text-3xl font-medium leading-6 text-gray-500">
    Welcome to Voting Advice Application!
  </h1>
  <button class="btn" on:click={gotoElections}>Select Election</button> <br />
  <!-- <a href="/candidates"><span class="badge ml-4 mt-4">View candidates</span></a> <br />
  <a href="/parties"><span class="badge ml-4 mt-4">View parties</span></a> -->
</div>
