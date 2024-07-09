<script lang="ts">
  import type {CandidateAnswer} from '$lib/types/candidateAttributes';
  import {candidateContext} from '$lib/utils/candidateStore';
  import {onMount, setContext} from 'svelte';
  import {get} from 'svelte/store';

  setContext('candidate', candidateContext);
  const token = candidateContext.tokenStore;

  onMount(() => {
    candidateContext.loadLocalStorage();
    $token && candidateContext.loadUserData();
  });

  let infoAnswers: Record<string, CandidateAnswer> | undefined;
  let infoQuestions: QuestionProps[] | undefined;

  candidateContext.infoAnswerStore.subscribe((value) => {
    infoAnswers = value;
    updateInfoAnswerRelations();
  });
  candidateContext.infoQuestionsStore.subscribe((value) => {
    infoQuestions = value;
    updateInfoAnswerRelations();
  });

  function updateInfoAnswerRelations() {
    if (!infoQuestions || !infoAnswers) return;

    const requiredInfoQuestions = infoQuestions.filter((question) => question.required);
    const requiredInfoQuestionsMap = requiredInfoQuestions.map((question) => {
      if (infoAnswers?.[question.id]) {
        const answer = infoAnswers[question.id].value;
        if (question.type === 'boolean') {
          return answer !== undefined;
        } else if (question.type === 'singleChoiceCategorical') {
          return answer !== '';
        } else if (question.type === 'multipleChoiceCategorical') {
          return answer.length > 0;
        } else if (question.type === 'text') {
          return Object.entries(answer).some((value) => value[1] !== '');
        } else if (question.type === 'date') {
          return answer !== '';
        }
      } else return false;
    });
    const allFilled = requiredInfoQuestionsMap.every((question) => question);
    const nofBasicQuestionsFilled = requiredInfoQuestionsMap.filter((value) => value).length;
    const infoQuestionsLeft = requiredInfoQuestions.length - nofBasicQuestionsFilled;

    candidateContext.nofUnansweredBasicInfoQuestionsStore.set(infoQuestionsLeft);
    candidateContext.basicInfoFilledStore.set(allFilled);
  }

  const updateNofUnansweredOpinionQuestions = () => {
    const answers = get(candidateContext.opinionAnswerStore);
    const questions = get(candidateContext.opinionQuestionsStore);
    if (answers && questions) {
      candidateContext.nofUnansweredOpinionQuestionsStore.set(
        Object.entries(questions).length - Object.entries(answers).length
      );
      const allFilled = Object.entries(questions).length - Object.entries(answers).length === 0;
      candidateContext.opinionQuestionsFilledStore.set(allFilled);
    }
  };

  const updateProgress = () => {
    const answers = get(candidateContext.opinionAnswerStore);
    const questions = get(candidateContext.opinionQuestionsStore);

    if (answers && questions) {
      const answeredQuestions = Object.entries(answers).length;
      const totalQuestions = Object.entries(questions).length;

      candidateContext.progressStore.set({
        progress: answeredQuestions,
        max: totalQuestions
      });
    }
  };

  candidateContext.opinionAnswerStore.subscribe(updateNofUnansweredOpinionQuestions);
  candidateContext.opinionQuestionsStore.subscribe(updateNofUnansweredOpinionQuestions);

  candidateContext.opinionAnswerStore.subscribe(updateProgress);
  candidateContext.opinionQuestionsStore.subscribe(updateProgress);
</script>

<!--
@component
Candidate context provider provides the candidate context to all its children.

### Contexts

- candidate: The candidate context

### Slots

- default: The children of the component

### Usage

```tsx
<CandidateContextProvider>
  <p>Example content</p>
</CandidateContextProvider>
```
-->

<slot />
