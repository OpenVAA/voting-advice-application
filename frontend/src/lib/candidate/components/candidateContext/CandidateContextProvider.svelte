<script lang="ts">
  import type {CandidateAnswer} from '$lib/types/candidateAttributes';
  import {candidateContext} from '$lib/utils/candidateStore';
  import {onMount, setContext} from 'svelte';

  setContext('candidate', candidateContext);
  const token = candidateContext.token;

  onMount(() => {
    candidateContext.loadLocalStorage();
    $token && candidateContext.loadUserData();
  });

  let infoAnswers: Record<string, CandidateAnswer> | undefined;
  let infoQuestions: QuestionProps[] | undefined;

  candidateContext.infoAnswers.subscribe((value) => {
    infoAnswers = value;
    updateInfoAnswerStatistics();
  });
  candidateContext.infoQuestions.subscribe((value) => {
    infoQuestions = value;
    updateInfoAnswerStatistics();
  });

  function answerIsEmpty(question: QuestionProps, answer: AnswerPropsValue) {
    if (infoAnswers?.[question.id]) {
      if (question.type === 'boolean') {
        return answer === null;
      } else if (
        question.type === 'singleChoiceCategorical' ||
        question.type === 'singleChoiceOrdinal'
      ) {
        return answer === '' || answer === null;
      } else if (question.type === 'multipleChoiceCategorical') {
        return answer && Array.isArray(answer) && answer.length === 0;
      } else if (question.type === 'text' || question.type === 'link') {
        return (
          answer && !Object.entries(answer).some((value) => value[1] !== '' && value[1] !== null)
        );
      } else if (question.type === 'date') {
        return answer === '' || answer === null;
      }
    } else return false;
  }

  function updateInfoAnswerStatistics() {
    if (!infoQuestions || !infoAnswers) return;

    const unanswered = infoQuestions.filter((question) => {
      if (!question.required) return false;
      if (!infoAnswers?.[question.id]) return true;
      const answer = infoAnswers?.[question.id].value;
      return answerIsEmpty(question, answer);
    });

    candidateContext.unansweredRequiredInfoQuestions.set(unanswered);
  }

  let opinionAnswers: Record<string, CandidateAnswer> | undefined;
  let opinionQuestions: QuestionProps[] | undefined;

  candidateContext.opinionAnswers.subscribe((value) => {
    opinionAnswers = value;
    updateOpinionAnswerStatistics();
    updateProgress();
  });

  candidateContext.opinionQuestions.subscribe((value) => {
    opinionQuestions = value;
    updateOpinionAnswerStatistics();
    updateProgress();
  });

  function updateOpinionAnswerStatistics() {
    if (!opinionAnswers || !opinionQuestions) return;
    const unanswered = opinionQuestions.filter((question) => {
      return opinionAnswers && !Object.keys(opinionAnswers).includes(question.id);
    });
    candidateContext.unansweredOpinionQuestions.set(unanswered);
  }

  function updateProgress() {
    if (opinionAnswers && opinionQuestions) {
      const answeredQuestions = Object.entries(opinionAnswers).length;
      const totalQuestions = opinionQuestions.length;

      candidateContext.progress.set({
        progress: answeredQuestions,
        max: totalQuestions
      });
    }
  }
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
