<script lang="ts">
  import MultilangTextInput from '$lib/candidate/components/textArea/MultilangTextInput.svelte';
  import type {User} from '$lib/types/candidateAttributes';

  export let question: QuestionProps;
  export let questionsLocked: boolean | undefined;
  export let user: User | null;

  export let text: LocalizedString = {};
  let textArea: MultilangTextInput; // Used to clear the local storage from the parent component
  let savedText = user?.candidate?.manifesto; // Used to detect changes in the manifesto
</script>

<MultilangTextInput
  locked={questionsLocked}
  id={question.text}
  localStorageId={`candidate-app-${question.text}`}
  previouslySavedMultilang={savedText}
  placeholder="—"
  bind:multilangText={text}
  bind:this={textArea} />
