<script lang="ts">
  import {candidateContext} from '$lib/utils/candidateStore';
  import {onMount, setContext} from 'svelte';
  import {get} from 'svelte/store';

  setContext('candidate', candidateContext);
  const token = candidateContext.tokenStore;

  onMount(() => {
    candidateContext.loadLocalStorage();
    $token && candidateContext.loadUserData();
  });

  candidateContext.userStore.subscribe((user) => {
    const {motherTongues, birthday, manifesto} = user?.candidate ?? {};
    const allFilled = !!motherTongues && motherTongues.length > 0 && !!birthday && !!manifesto;
    candidateContext.basicInfoFilledStore.set(allFilled);
  });

  const updateNofUnansweredQuestions = () => {
    const answers = get(candidateContext.answersStore);
    const questions = get(candidateContext.questionsStore);
    if (answers && questions) {
      candidateContext.nofUnansweredQuestionsStore.set(
        Object.entries(questions).length - Object.entries(answers).length
      );
    }
  };

  candidateContext.answersStore.subscribe(updateNofUnansweredQuestions);
  candidateContext.questionsStore.subscribe(updateNofUnansweredQuestions);
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
