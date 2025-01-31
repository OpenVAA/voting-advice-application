<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import { getComponentContext } from '$lib/contexts/component';
  import type { QuestionExtendedInfoButtonProps } from './QuestionExtendedInfoButton.type';
  import QuestionExtendedInfoDrawer from './QuestionExtendedInfoDrawer.svelte';

  const { modalStack } = getAppContext();
  const { t } = getComponentContext();

  type $$Props = QuestionExtendedInfoButtonProps;

  export let question: $$Props['question'];

  function handleOpen() {
    modalStack.push(QuestionExtendedInfoDrawer, {
      question
    });
  }
</script>

<Button text={$t('components.questionExtendedInfoLauncher.title')} icon="info" iconPos="left" on:click={handleOpen} />
