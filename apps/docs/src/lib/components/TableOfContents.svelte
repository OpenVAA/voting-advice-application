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

  let headings = $state<TocItem[]>([]);
  let activeId = $state<string>('');

  // Filter headings based on maxLevel
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

    // Observe all headings
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
  <nav class="toc top-xl" aria-label="Table of contents">
    <h2 class="toc-title">On this page</h2>
    <ul class="toc-list">
      {#each filteredHeadings as heading (heading.id)}
        <li class="toc-item toc-item-level-{heading.level}" class:active={activeId === heading.id}>
          <button
            type="button"
            onclick={() => scrollToHeading(heading.id)}
            class="toc-link"
            aria-current={activeId === heading.id ? 'location' : undefined}>
            {heading.text}
          </button>
        </li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .toc {
    position: sticky;
    max-height: calc(100vh - 8rem);
    overflow-y: auto;
    border-left: 2px solid var(--color-base-300);
    font-size: 0.875rem;
    padding-left: 1rem;
  }

  .toc-title {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-base-content);
    margin-top: 0rem;
    margin-bottom: 1rem;
  }

  .toc-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .toc-item {
    margin: 0;
    padding: 0;
  }

  .toc-link {
    display: block;
    padding: 0.375rem 0;
    color: var(--color-secondary);
    text-decoration: none;
    transition: color 0.2s;
    text-align: left;
    border: none;
    background: none;
    cursor: pointer;
    width: 100%;
    line-height: 1.4;
  }

  .toc-link:hover {
    color: var(--color-primary);
  }

  .toc-item.active .toc-link {
    color: var(--color-primary);
    font-weight: 500;
  }

  /* Indentation for different heading levels */
  .toc-item-level-2 {
    padding-left: 0;
  }

  .toc-item-level-3 {
    padding-left: 1rem;
  }

  .toc-item-level-4 {
    padding-left: 2rem;
  }

  .toc-item-level-5 {
    padding-left: 3rem;
  }

  .toc-item-level-6 {
    padding-left: 4rem;
  }

  /* Scrollbar styling for webkit browsers */
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
