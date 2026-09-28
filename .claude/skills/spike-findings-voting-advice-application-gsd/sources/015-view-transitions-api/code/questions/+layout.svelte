<!--
  Spike 015 — Questions layout (014b shape)
  Layout owns the render; per-element `view-transition-name` assignments
  let the browser pair old/new content during navigation.
-->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { trackMount } from '../../nav-forensics/mountLedger.svelte';

  let { children: _children } = $props();
  const ledger = trackMount('TransitionsQuestionsLayout');

  const QUESTIONS = [
    { id: 'q1', text: 'Should we expand renewable energy?', category: 'environment', emoji: '🌱' },
    { id: 'q2', text: 'Do you support universal childcare?', category: 'social', emoji: '👶' },
    { id: 'q3', text: 'Should defense spending increase?', category: 'security', emoji: '🛡️' }
  ];

  const questionId = $derived(page.params.questionId);
  const activeQuestion = $derived(QUESTIONS.find((q) => q.id === questionId));
  const activeIndex = $derived(QUESTIONS.findIndex((q) => q.id === questionId));
  const notr = $derived(page.url.searchParams.get('notr') === '1');

  let answers = $state<Record<string, boolean>>({});
  function answer(id: string): void {
    answers[id] = true;
  }

  function buildUrl(qid: string): string {
    return `/runes-test/nav-transitions/questions/${qid}${notr ? '?notr=1' : ''}`;
  }

  function handleNext(): void {
    const next = QUESTIONS[activeIndex + 1];
    if (next) goto(buildUrl(next.id), { noScroll: true });
  }
  function handlePrevious(): void {
    const prev = QUESTIONS[activeIndex - 1];
    if (prev) goto(buildUrl(prev.id), { noScroll: true });
  }
</script>

<svelte:head>
  <title>{activeQuestion ? activeQuestion.text : 'Questions'}</title>
</svelte:head>

<div class="ql" data-mount-id={ledger.instanceId}>
  <div class="info">
    <strong>questionId={questionId ?? '(none)'}</strong>
    • {notr ? 'NO transitions' : 'WITH transitions'}
    • progress {activeIndex >= 0 ? activeIndex + 1 : 0}/{QUESTIONS.length}
  </div>

  {#if activeQuestion}
    <div class="hero" style="view-transition-name: question-hero;">
      <span class="emoji">{activeQuestion.emoji}</span>
      Category: {activeQuestion.category}
    </div>
    <h1 class="title" style="view-transition-name: question-title;">
      Q{activeIndex + 1}. {activeQuestion.text}
    </h1>

    <div class="body" style="view-transition-name: question-body;">
      <p>This is the body content for question <code>{activeQuestion.id}</code>.</p>
      <p>It would contain the OpinionQuestionInput, info expander, etc.</p>
      <p class="mount-id">layout mount-id: <code>{ledger.instanceId}</code></p>
    </div>

    <div class="actions" style="view-transition-name: question-actions;">
      <button onclick={handlePrevious} disabled={activeIndex <= 0}>← Previous</button>
      <button class="answer" onclick={() => answer(activeQuestion.id)}>Answer (mock)</button>
      {#if answers[activeQuestion.id]}<span class="check">✓</span>{/if}
      <button class="primary" disabled={!answers[activeQuestion.id]} onclick={handleNext}>
        Next →
      </button>
    </div>
  {:else}
    <p class="empty">Pick a question from the nav.</p>
  {/if}
</div>

<style>
  .ql { border: 2px solid #ec4899; padding: 0.8rem; background: #fdf2f8; }
  .info {
    background: #fce7f3;
    padding: 0.4rem 0.6rem;
    margin-bottom: 0.6rem;
    border-radius: 4px;
    color: #9d174d;
    font-size: 0.85rem;
  }
  .hero {
    background: #fef9c3;
    text-align: center;
    padding: 0.6rem;
    border-radius: 4px;
    margin-bottom: 0.6rem;
    font-size: 1.1rem;
  }
  .emoji { font-size: 1.6rem; margin-right: 0.5rem; }
  .title {
    text-align: center;
    margin: 0 0 0.8rem 0;
    color: #9d174d;
  }
  .body {
    background: #fff;
    padding: 0.8rem;
    border-radius: 4px;
    border: 1px solid #fbcfe8;
  }
  .mount-id {
    color: #6b7280;
    font-size: 0.8rem;
    margin-top: 0.6rem;
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
    border: 1px solid #ec4899;
    border-radius: 4px;
    padding: 0.3rem 0.8rem;
    cursor: pointer;
  }
  button.answer { background: #f9a8d4; color: white; border-color: #f9a8d4; }
  button.primary { background: #ec4899; color: white; border-color: #ec4899; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .check { color: #16a34a; font-weight: bold; }
  .empty { text-align: center; color: #6b7280; padding: 2rem; }
</style>
