<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import { getComponentContext } from '$lib/contexts/component';
  import QuestionExtendedInfoDrawer from './QuestionExtendedInfoDrawer.svelte';
  import type { QuestionExtendedInfoButtonProps } from './QuestionExtendedInfoButton.type';

  type $$Props = QuestionExtendedInfoButtonProps;

  export let question: $$Props['question'];

  const { modalStack } = getAppContext();
  const { t } = getComponentContext();

  function handleOpen(): void {
    modalStack.push(QuestionExtendedInfoDrawer, {
      question
    });
  }
</script>

<Button text={$t('components.questionExtendedInfo.title')} icon="info" iconPos="left" on:click={handleOpen} />
