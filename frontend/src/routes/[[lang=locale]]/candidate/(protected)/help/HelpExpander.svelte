<script lang="ts">
  import Expander from '$lib/components/expander/Expander.svelte';
  import type {HelpExpanderProps} from './HelpExpander.type';

  type $$Props = HelpExpanderProps;

  export let question: $$Props['question'];
  export let solution: $$Props['solution'];
</script>

<!-- 
  @component
  A component for expanders used in the help page in the candidate app. 
  It takes the text for question and solution and displays them on the page.

  ### Properties

  - `question`: Question text. Used as the title of the Expander and always visible. 
  - `solution`: Solution text. Displayed below the question when the expander is activated.

  ### Usage

  ```tsx
  <HelpExpander 
    question="Example question"
    solution="Example solution" />
  ```
-->

<Expander title={question} variant="question">
  <p>{solution}</p>
</Expander>
