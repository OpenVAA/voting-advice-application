<script lang="ts">
  import { page } from '$app/stores';
  import { getPeerNavigation } from '$lib/utils/navigation';

  $: peerNav = getPeerNavigation($page.url);
</script>

{#if peerNav.prev || peerNav.next}
  <nav class="w-full max-w-[60rem] border-t border-t-base-300 pt-lg" aria-label="Page navigation">
    <div class="flex justify-between gap-md">
      {#if peerNav.prev}
        <a
          href={peerNav.prev.route}
          class="flex max-w-[48%] flex-col items-start rounded-lg bg-base-200 p-16 no-underline transition-colors duration-200 hover:bg-base-300">
          <span class="mb-4 text-(length:--text-sm) text-base-content opacity-70">Previous</span>
          <span class="font-semibold text-base-content">{peerNav.prev.title}</span>
        </a>
      {:else}
        <div></div>
      {/if}

      {#if peerNav.next}
        <a
          href={peerNav.next.route}
          class="ms-auto flex max-w-[48%] flex-col items-end rounded-lg bg-base-200 p-16 no-underline transition-colors duration-200 hover:bg-base-300">
          <span class="mb-4 text-(length:--text-sm) text-base-content opacity-70">Next</span>
          <span class="font-semibold text-base-content">{peerNav.next.title}</span>
        </a>
      {/if}
    </div>
  </nav>
{/if}
