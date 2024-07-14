<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import { get } from 'svelte/store';
  import { candidateContext } from '$lib/utils/candidateStore';

  setContext('candidate', candidateContext);
  const token = candidateContext.tokenStore;

  onMount(() => {
    candidateContext.loadLocalStorage();
    $token && candidateContext.loadUserData();
  });

  candidateContext.userStore.subscribe((user) => {
    let { gender, motherTongues, birthday, manifesto } = {
      gender: {
        id: undefined
      },
      manifesto: {},
      ...user?.candidate
    };
    const allFilled =
      !!gender?.id &&
      !!motherTongues &&
      motherTongues.length > 0 &&
      !!birthday &&
      Object.values(manifesto).some((value) => value !== '');
    candidateContext.basicInfoFilledStore.set(allFilled);

    const nofBasicQuestionsFilled = [
      !!gender?.id,
      !!motherTongues && motherTongues.length > 0,
      !!birthday,
      Object.values(manifesto).some((value) => value !== '')
    ].filter((n) => n).length;
    candidateContext.nofUnansweredBasicInfoQuestionsStore.set(4 - nofBasicQuestionsFilled);
  });

  const updateNofUnansweredQuestions = () => {
    const answers = get(candidateContext.answersStore);
    const questions = get(candidateContext.questionsStore);
    if (answers && questions) {
      candidateContext.nofUnansweredOpinionQuestionsStore.set(
        Object.entries(questions).length - Object.entries(answers).length
      );
      const allFilled = Object.entries(questions).length - Object.entries(answers).length === 0;
      candidateContext.opinionQuestionsFilledStore.set(allFilled);
    }
  };

  const updateProgress = () => {
    const answers = get(candidateContext.answersStore);
    const questions = get(candidateContext.questionsStore);

    if (answers && questions) {
      const answeredQuestions = Object.entries(answers).length;
      const totalQuestions = Object.entries(questions).length;

      candidateContext.progressStore.set({
        progress: answeredQuestions,
        max: totalQuestions
      });
    }
  };

  candidateContext.answersStore.subscribe(updateNofUnansweredQuestions);
  candidateContext.questionsStore.subscribe(updateNofUnansweredQuestions);

  candidateContext.answersStore.subscribe(updateProgress);
  candidateContext.questionsStore.subscribe(updateProgress);
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
