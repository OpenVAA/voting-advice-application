<!--
  Spike 014a — Questions layout
  HOISTS MainContent + hero + heading + primaryActions OUT of the child page,
  into the layout. The child page provides only the body via {@render children()}.

  Active question is derived from page.params.questionId (per Spike 012 +
  CONVENTIONS.md §9 per-field reads pattern).
-->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import MainContentMock from './MainContentMock.svelte';
  import QuestionActionsMock from './QuestionActionsMock.svelte';
  import { trackMount } from '../../nav-forensics/mountLedger.svelte';

  let { children } = $props();
  const ledger = trackMount('PromotedQuestionsLayout');

  // Mock the questions data — in production this comes from voterCtx.selectedQuestionBlocks
  const QUESTIONS = [
    { id: 'q1', text: 'Should we expand renewable energy?', category: 'environment' },
    { id: 'q2', text: 'Do you support universal childcare?', category: 'social' },
    { id: 'q3', text: 'Should defense spending increase?', category: 'security' }
  ];

  // CONVENTIONS.md §9: per-field reads on page (not the proxy as a whole).
  const questionId = $derived(page.params.questionId);

  const activeQuestion = $derived(QUESTIONS.find((q) => q.id === questionId));
  const activeIndex = $derived(QUESTIONS.findIndex((q) => q.id === questionId));

  // Track which questions have been "answered" — proves layout-owned state
  // survives Q→Q nav. In production this is voterCtx.answers.
  let answers = $state<Record<string, boolean>>({});

  function answer(id: string): void {
    answers[id] = true;
  }

  function handleNext(): void {
    const next = QUESTIONS[activeIndex + 1];
    if (next) {
      goto(`/runes-test/nav-promoted-layout/questions/${next.id}`, { noScroll: true });
    }
  }

  function handlePrevious(): void {
    const prev = QUESTIONS[activeIndex - 1];
    if (prev) {
      goto(`/runes-test/nav-promoted-layout/questions/${prev.id}`, { noScroll: true });
    }
  }
</script>

<div class="ql" data-mount-id={ledger.instanceId}>
  <div class="progress">
    Progress: {activeIndex + 1} / {QUESTIONS.length} • Answered: {Object.keys(answers).length}
  </div>

  {#if activeQuestion}
    <MainContentMock title={activeQuestion.text}>
      {#snippet hero()}
        <div>🗳️ Category: {activeQuestion.category}</div>
      {/snippet}

      {#snippet heading()}
        <h1>Q{activeIndex + 1}. {activeQuestion.text}</h1>
        <div class="muted">questionId={activeQuestion.id}</div>
      {/snippet}

      <!-- Page-provided body slots in here -->
      {@render children?.()}

      <!-- Hint: the answer "input" lives in the layout too, since it's
           the same UI shape across all questions. -->
      <div class="input-row">
        <button class="answer-btn" onclick={() => answer(activeQuestion.id)}>
          Answer (mock)
        </button>
        {#if answers[activeQuestion.id]}<span class="check">✓ Answered</span>{/if}
      </div>

      {#snippet primaryActions()}
        <QuestionActionsMock
          onPrevious={handlePrevious}
          onNext={handleNext}
          answered={!!answers[activeQuestion.id]} />
      {/snippet}
    </MainContentMock>
  {:else}
    <div class="empty">Pick a question (Q1/Q2/Q3) from the nav.</div>
  {/if}
</div>

<style>
  .ql {
    border: 2px solid #6366f1;
    padding: 0.8rem;
  }
  .progress {
    background: #e0e7ff;
    padding: 0.4rem 0.6rem;
    margin-bottom: 0.8rem;
    border-radius: 4px;
    color: #4338ca;
    font-size: 0.85rem;
  }
  .muted {
    color: #6b7280;
    font-size: 0.8rem;
  }
  .input-row {
    margin-top: 0.6rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .answer-btn {
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.3rem 0.8rem;
    cursor: pointer;
  }
  .check {
    color: #16a34a;
    font-weight: bold;
  }
  .empty {
    padding: 2rem;
    text-align: center;
    color: #6b7280;
  }
</style>
