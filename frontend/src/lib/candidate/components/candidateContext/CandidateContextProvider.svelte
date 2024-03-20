<script lang="ts">
  import {candidateContext} from '$lib/utils/candidateStore';
  import {onMount, setContext} from 'svelte';
  import {get} from 'svelte/store';

  setContext('candidate', candidateContext);
  const token = candidateContext.token;

  onMount(() => {
    candidateContext.loadLocalStorage();
    $token && candidateContext.loadUserData();
  });

  candidateContext.user.subscribe((user) => {
    const {motherTongues, birthday, manifesto} = user?.candidate ?? {};
    const allFilled = !!motherTongues && motherTongues.length > 0 && !!birthday && !!manifesto;
    candidateContext.basicInfoFilled.set(allFilled);
  });

  const updateNofUnansweredQuestions = () => {
    const answers = get(candidateContext.answers);
    const questions = get(candidateContext.questions);
    if (answers && questions) {
      candidateContext.nofUnansweredQuestions.set(
        Object.entries(questions).length - Object.entries(answers).length
      );
    }
  };

  candidateContext.answers.subscribe(updateNofUnansweredQuestions);
  candidateContext.questions.subscribe(updateNofUnansweredQuestions);
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
