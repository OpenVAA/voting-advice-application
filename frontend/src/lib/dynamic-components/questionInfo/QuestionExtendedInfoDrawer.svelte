<script lang="ts">
  import { Drawer } from '$lib/components/modal/drawer';
  import QuestionExtendedInfo from '$lib/components/questions/QuestionExtendedInfo.svelte';
  import type { QuestionExtendedInfoDrawerProps } from './QuestionExtendedInfoDrawer.type';

  type $$Props = QuestionExtendedInfoDrawerProps;

  export let question: $$Props['question'];
  const customData: CustomData['Question'] | null | undefined = question.customData;
</script>

<Drawer title={question.text}>
  <QuestionExtendedInfo info={question.info} infoSections={customData?.infoSections} />
</Drawer>
