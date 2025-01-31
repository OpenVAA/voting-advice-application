<script lang="ts">
  import { Drawer } from '$lib/components/drawer';
  import QuestionExtendedInfo from '$lib/components/questions/QuestionExtendedInfo.svelte';
  import type { QuestionExtendedInfoDrawerProps } from './QuestionExtendedInfoDrawer.type';

  type $$Props = QuestionExtendedInfoDrawerProps;

  export let question: $$Props['question'];
  let { customData }: { customData: CustomData['Question'] } = question;
</script>

<Drawer title={question?.text ?? ''}>
  <QuestionExtendedInfo
    info={question.info}
    infoSections={Object.values(customData.infoSections ?? {})
      .filter(({ visible }) => !!visible)
      .map(({ title, text }) => ({
        title: title ?? '',
        content: text ?? ''
      }))} />
</Drawer>
