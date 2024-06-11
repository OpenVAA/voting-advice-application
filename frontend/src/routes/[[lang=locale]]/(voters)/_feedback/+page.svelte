<script lang="ts">
  export let data;

  data.feedback.then((f) => console.info(f));
</script>

{#await data.feedback}
  <p>Loading...</p>
{:then f}
  <textarea class="textarea h-[20rem] w-full">{JSON.stringify(f, null, 2)}</textarea>
{/await}
