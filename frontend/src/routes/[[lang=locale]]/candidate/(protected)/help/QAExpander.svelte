<script lang="ts">
  import Expander from '$lib/components/expander/Expander.svelte';
  import type {QAExpanderProps} from './QAExpander.type';

  type $$Props = QAExpanderProps;

  export let question: $$Props['question'];
  export let answer: $$Props['answer'];
</script>

<!-- 
  @component
  A component for the expander used on the help page of the candidate app. 
  It takes the text for the question and the answer and displays them on the page.

  ### Properties

  - `question`: Question text. Used as the title of the Expander and always visible. 
  - `answer`: Answer text. Displayed below the question when the expander is activated.

  ### Usage

  ```tsx
  <QAExpander 
    question="Example question"
    answer="Example answer" />
  ```
-->

<Expander title={question} variant="question">
  <p>{answer}</p>
</Expander>
