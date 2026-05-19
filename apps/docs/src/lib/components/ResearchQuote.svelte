<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import ReferenceList from '$lib/components/ReferenceList.svelte';
  import Author from '$lib/components/Author.svelte';

  interface Props {
    title: string;
    references?: string[];
    author?: string;
    id?: string;
    children: Snippet;
  }

  let { title, references = [], author = '', id = crypto.randomUUID(), children }: Props = $props();
  let content: HTMLElement;
  let collapsible = $state(false);
  let expanded = $state(false);
  let fullHeight = $state('none');

  onMount(() => {
    if (content) {
      collapsible = content.clientHeight < content.scrollHeight;
      fullHeight = `${content.scrollHeight}px`;
    }
  });
</script>

{#snippet hgroup()}
  <hgroup class="mt-md">
    <p class="mt-0 mb-xs text-primary!">🔬 Research perspective</p>
    <h4 class="mt-0 text-lg font-bold text-primary!">{title}</h4>
  </hgroup>
{/snippet}

<blockquote
  bind:this={content}
  {id}
  aria-expanded={collapsible ? expanded : undefined}
  class:collapsible
  class:expanded
  style:--full-height={fullHeight}
  class="group/research-quote relative grid max-h-[12rem] overflow-hidden rounded-md bg-base-200 transition-all
    not-aria-expanded:before:absolute not-aria-expanded:before:right-0 not-aria-expanded:before:bottom-0
    not-aria-expanded:before:left-0 not-aria-expanded:before:h-lg not-aria-expanded:before:bg-linear-to-t not-aria-expanded:before:from-base-200
    not-aria-expanded:before:content-[''] aria-expanded:max-h-(--full-height) aria-expanded:overflow-y-auto aria-expanded:before:h-0
  ">
  <div class="col-start-1 row-start-1 p-md pe-lg">
    {#if collapsible}
      <button
        onclick={() => (expanded = !expanded)}
        aria-controls={id}
        aria-label={expanded ? 'Collapse this section' : 'Expand this section'}
        class="relative block w-full cursor-pointer text-start">
        {@render hgroup()}
        <span
          class="absolute top-md right-0 transition-transform group-aria-expanded/research-quote:rotate-180"
          aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>
    {:else}
      {@render hgroup()}
    {/if}

    {@render children()}

    {#if author}
      <Author>{author}</Author>
    {/if}

    {#if references.length}
      <ReferenceList {references} />
    {/if}
  </div>
</blockquote>
