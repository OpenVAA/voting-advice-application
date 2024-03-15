<script lang="ts">
  export let photoURL: string | undefined;
  export let imgAlt = 'Candidate';
  export let imgWidth = 64;
  export let imgHeight = 64;
  export let title = 'Candidate';
</script>

{#if photoURL}
  <img class="rounded-sm" src={photoURL} alt={imgAlt} width={imgWidth} height={imgHeight} />
{:else}
  <div class="avatar placeholder">
    <div class="w-[3.125rem] rounded-full bg-base-300">
      <span class="text-2xl">{title.charAt(0)}</span>
    </div>
  </div>
{/if}
