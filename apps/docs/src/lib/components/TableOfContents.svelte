<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    maxLevel?: number;
    contentId: string;
  }

  let { maxLevel = 3, contentId }: Props = $props();

  interface TocItem {
    text: string;
    id: string;
    level: number;
  }

  /**
   * Left padding for each heading level. Level 2 is the top level of the list, since level 1 is the page title.
   */
  const LEVEL_INDENT: Record<number, string> = {
    2: 'pl-0',
    3: 'pl-16',
    4: 'pl-32',
    5: 'pl-48',
    6: 'pl-64'
  };

  let headings = $state<TocItem[]>([]);
  let activeId = $state<string>('');

  const filteredHeadings = $derived(headings.filter((h) => h.level <= maxLevel));

  onMount(() => {
    // Extract headings from the DOM
    const article = document.querySelector(`#${contentId}`);
    if (article) {
      const headingElements = article.querySelectorAll('h2, h3, h4, h5, h6');
      headings = Array.from(headingElements).map((el) => {
        const level = parseInt(el.tagName.substring(1));
        return {
          text: el.textContent || '',
          id: el.id,
          level
        };
      });
    }

    // Track which heading is currently visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeId = entry.target.id;
          }
        });
      },
      {
        rootMargin: '-100px 0px -66%',
        threshold: 0
      }
    );

    filteredHeadings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  });

  function scrollToHeading(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update URL without triggering a page reload
      history.pushState(null, '', `#${id}`);
    }
  }
</script>

{#if filteredHeadings.length > 0}
  <nav
    class="toc sticky top-xl max-h-[calc(100vh-8rem)] overflow-y-auto border-l-2 border-l-base-300 pl-16 text-(length:--text-sm)"
    aria-label="Table of contents">
    <h2 class="mt-0 mb-16 text-(length:--text-sm) font-semibold tracking-wider text-base-content uppercase">
      On this page
    </h2>
    <ul class="not-prose">
      {#each filteredHeadings as heading (heading.id)}
        <li class={LEVEL_INDENT[heading.level]}>
          <button
            type="button"
            onclick={() => scrollToHeading(heading.id)}
            class="block w-full cursor-pointer border-none bg-transparent py-6 text-left leading-[1.4] text-secondary no-underline transition-colors duration-200 hover:text-primary aria-[current=location]:font-medium aria-[current=location]:text-primary"
            aria-current={activeId === heading.id ? 'location' : undefined}>
            {heading.text}
          </button>
        </li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  /* The scrollbar is a browser-generated pseudo-element, which Tailwind has no utility for. */
  .toc::-webkit-scrollbar {
    width: 4px;
  }

  .toc::-webkit-scrollbar-track {
    background: transparent;
  }

  .toc::-webkit-scrollbar-thumb {
    background: var(--color-base-300);
    border-radius: 2px;
  }

  .toc::-webkit-scrollbar-thumb:hover {
    background: var(--color-secondary);
  }
</style>
