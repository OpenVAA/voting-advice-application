<!--
  Spike 014b — Questions layout (does ALL rendering)
  Mirrors production /results/[[electionTab]]/+layout.svelte pattern:
  - URL params drive everything
  - Optional [[questionId]] param means /questions and /questions/qN both match
  - +page.svelte exists ONLY because SvelteKit requires a leaf — it's empty
  - Layout decides whether to wrap content in {#key} (controlled by ?nokey=1)
-->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { trackMount } from '../../nav-forensics/mountLedger.svelte';
  import QuestionBody from './QuestionBody.svelte';

  let { children: _children } = $props();
  const ledger = trackMount('KeyedQuestionsLayout');

  const QUESTIONS = [
    { id: 'q1', text: 'Should we expand renewable energy?', category: 'environment' },
    { id: 'q2', text: 'Do you support universal childcare?', category: 'social' },
    { id: 'q3', text: 'Should defense spending increase?', category: 'security' }
  ];

  // CONVENTIONS.md §9 per-field reads on page.
  const questionId = $derived(page.params.questionId);
  const useKey = $derived(page.url.searchParams.get('nokey') !== '1');

  const activeQuestion = $derived(QUESTIONS.find((q) => q.id === questionId));
  const activeIndex = $derived(QUESTIONS.findIndex((q) => q.id === questionId));

  let answers = $state<Record<string, boolean>>({});
  function answer(id: string): void {
    answers[id] = true;
  }

  function handleNext(): void {
    const next = QUESTIONS[activeIndex + 1];
    if (next) {
      const qs = useKey ? '' : '?nokey=1';
      goto(`/runes-test/nav-keyed-content/questions/${next.id}${qs}`, { noScroll: true });
    }
  }
  function handlePrevious(): void {
    const prev = QUESTIONS[activeIndex - 1];
    if (prev) {
      const qs = useKey ? '' : '?nokey=1';
      goto(`/runes-test/nav-keyed-content/questions/${prev.id}${qs}`, { noScroll: true });
    }
  }
</script>

<svelte:head>
  <title>{activeQuestion ? activeQuestion.text : 'Questions'}</title>
</svelte:head>

<div class="ql" data-mount-id={ledger.instanceId}>
  <div class="info">
    <strong>questionId={questionId ?? '(none)'}</strong>
    {#if questionId}• <code>{useKey ? 'KEY MODE' : 'NO-KEY MODE'}</code>{/if}
    • progress {activeIndex >= 0 ? activeIndex + 1 : 0}/{QUESTIONS.length}
    • answered {Object.keys(answers).length}
  </div>

  {#if activeQuestion}
    <div class="hero">🗳️ Category: {activeQuestion.category}</div>
    <h1 class="title">Q{activeIndex + 1}. {activeQuestion.text}</h1>

    {#if useKey}
      <!-- Key-mode: forces remount of QuestionBody every questionId change -->
      {#key questionId}
        <QuestionBody questionId={activeQuestion.id} text={activeQuestion.text} />
      {/key}
    {:else}
      <!-- No-key mode: reactive update only — same component instance -->
      <QuestionBody questionId={activeQuestion.id} text={activeQuestion.text} />
    {/if}

    <div class="actions">
      <button onclick={handlePrevious} disabled={activeIndex <= 0}>← Previous</button>
      <button class="answer" onclick={() => answer(activeQuestion.id)}>Answer (mock)</button>
      {#if answers[activeQuestion.id]}<span class="check">✓</span>{/if}
      <button class="primary" disabled={!answers[activeQuestion.id] || activeIndex >= QUESTIONS.length - 1} onclick={handleNext}>
        Next →
      </button>
    </div>
  {:else}
    <p class="empty">Pick a question from the nav above.</p>
  {/if}
</div>

<style>
  .ql {
    border: 2px solid #6366f1;
    padding: 0.8rem;
    background: #f5f3ff;
  }
  .info {
    background: #e0e7ff;
    padding: 0.4rem 0.6rem;
    margin-bottom: 0.6rem;
    border-radius: 4px;
    color: #4338ca;
    font-size: 0.85rem;
  }
  .hero {
    background: #fef3c7;
    text-align: center;
    padding: 0.4rem;
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }
  .title {
    text-align: center;
    margin: 0 0 0.8rem 0;
    color: #4338ca;
  }
  .actions {
    margin-top: 0.6rem;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
  }
  button {
    background: #fff;
    border: 1px solid #6366f1;
    border-radius: 4px;
    padding: 0.3rem 0.8rem;
    cursor: pointer;
  }
  button.answer { background: #818cf8; color: white; border-color: #818cf8; }
  button.primary { background: #6366f1; color: white; border-color: #6366f1; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .check { color: #16a34a; font-weight: bold; }
  .empty { text-align: center; color: #6b7280; padding: 2rem; }
</style>
