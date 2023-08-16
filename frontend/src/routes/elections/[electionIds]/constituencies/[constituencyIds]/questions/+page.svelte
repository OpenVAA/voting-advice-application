<script lang="ts">
  import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
  import {
    availableMatchableQuestionCategories,
    availableMatchableQuestions
  } from '$lib/stores/stores';
  import {gotoRoute, PageType} from '$lib/navigation';
  import {page} from '$app/stores';

  let selectedQuestionCategoryIds: string[] = [];

  function gotoQuestions() {
    const categoryIds = selectedQuestionCategoryIds.join(',');
    const firstQuestionId = $availableMatchableQuestions.sorted.filter((q) =>
      categoryIds.includes(q.parent.id)
    )[0]?.id;
    if (firstQuestionId == null) {
      throw new Error('First question must have an id');
    }
    gotoRoute({
      page: PageType.ShowQuestion,
      questionCategoryIds: selectedQuestionCategoryIds,
      questionId: firstQuestionId,
      currentUrl: $page.url.pathname
    });
  }
</script>

<h1>Select Question Categories</h1>

{#if $availableMatchableQuestionCategories?.nonEmpty}
  {#each $availableMatchableQuestionCategories.sorted as category}
    <label class="block">
      <input
        type="checkbox"
        class="checkbox"
        name="questionCategoryId"
        value={category.id}
        bind:group={selectedQuestionCategoryIds} />
      {category.name}
      <!-- {#if !$isSingleElection}
        (for {category.elections.sorted.map((e) => e.shortName).join(', ')})
      {/if} -->
    </label>
  {:else}
    <p>No availableQuestionCategories found! This should not happen</p>
  {/each}
  <button on:click={gotoQuestions} class="btn" disabled={selectedQuestionCategoryIds.length === 0}
    >Continue to Questions</button>
{:else}
  <LoadingIndicator />
{/if}
