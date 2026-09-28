<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { trackMount } from '../../nav-forensics/mountLedger.svelte';

  let { children: _children } = $props();
  const ledger = trackMount('A11yQuestionsLayout');

  const QUESTIONS = [
    { id: 'q1', text: 'Should we expand renewable energy?', category: 'environment' },
    { id: 'q2', text: 'Do you support universal childcare?', category: 'social' },
    { id: 'q3', text: 'Should defense spending increase?', category: 'security' }
  ];

  const questionId = $derived(page.params.questionId);
  const activeQuestion = $derived(QUESTIONS.find((q) => q.id === questionId));
  const activeIndex = $derived(QUESTIONS.findIndex((q) => q.id === questionId));
  const notr = $derived(page.url.searchParams.get('notr') === '1');

  let answer = $state<Record<string, number>>({});

  function buildUrl(qid: string): string {
    return `/runes-test/nav-a11y/questions/${qid}${notr ? '?notr=1' : ''}`;
  }

  function handleNext(): void {
    const next = QUESTIONS[activeIndex + 1];
    if (next) goto(buildUrl(next.id), { noScroll: true });
  }
</script>

<svelte:head>
  <title>{activeQuestion ? `Q${activeIndex + 1}: ${activeQuestion.text}` : 'Questions'}</title>
</svelte:head>

<div class="ql" data-mount-id={ledger.instanceId}>
  {#if activeQuestion}
    <h1 class="title" data-focus-on-nav tabindex="-1" style="view-transition-name: question-title;">
      Q{activeIndex + 1}. {activeQuestion.text}
    </h1>

    <div class="body" style="view-transition-name: question-body;">
      <p>Category: <strong>{activeQuestion.category}</strong></p>

      <fieldset>
        <legend>Likert (1=strongly disagree, 5=strongly agree)</legend>
        <div class="likert" role="radiogroup" aria-labelledby="likert-label-{activeQuestion.id}">
          <span id="likert-label-{activeQuestion.id}" class="sr-only">
            Rate {activeQuestion.text} from 1 to 5
          </span>
          {#each [1, 2, 3, 4, 5] as n}
            <label>
              <input
                type="radio"
                name="answer-{activeQuestion.id}"
                value={n}
                checked={answer[activeQuestion.id] === n}
                onchange={() => (answer[activeQuestion.id] = n)} />
              {n}
            </label>
          {/each}
        </div>
      </fieldset>

      <p class="hint">
        Answer (Likert state) for this Q: <strong>{answer[activeQuestion.id] ?? '—'}</strong>
        • All answers: <code>{JSON.stringify(answer)}</code>
      </p>
    </div>

    <div class="actions">
      <button
        type="button"
        disabled={!answer[activeQuestion.id]}
        onclick={handleNext}
        aria-label={activeIndex < QUESTIONS.length - 1
          ? `Next question, Q${activeIndex + 2} of ${QUESTIONS.length}`
          : 'Finish'}>
        {activeIndex < QUESTIONS.length - 1 ? 'Next →' : 'Finish'}
      </button>
    </div>
  {:else}
    <h1 data-focus-on-nav tabindex="-1">Questions index</h1>
    <p>Pick a question.</p>
  {/if}
</div>

<style>
  .ql { border: 2px solid #ef4444; padding: 0.8rem; background: #fef2f2; }
  .title {
    text-align: center;
    margin: 0 0 0.8rem 0;
    color: #991b1b;
    outline: none;
  }
  .title:focus-visible {
    outline: 3px solid #3b82f6;
    outline-offset: 4px;
    border-radius: 4px;
  }
  .body { background: #fff; padding: 0.8rem; border-radius: 4px; border: 1px solid #fecaca; }
  fieldset { border: 1px dashed #ef4444; padding: 0.5rem; }
  legend { color: #991b1b; padding: 0 0.4rem; }
  .likert { display: flex; gap: 0.8rem; padding: 0.4rem 0; }
  .likert label {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
  }
  .actions { margin-top: 0.6rem; display: flex; justify-content: center; }
  button {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.4rem 1.2rem;
    cursor: pointer;
    font-size: 0.95rem;
  }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  button:focus-visible {
    outline: 3px solid #3b82f6;
    outline-offset: 2px;
  }
  .hint { color: #6b7280; font-size: 0.85rem; margin-top: 0.5rem; }
  .sr-only {
    position: absolute;
    width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
  }
</style>
