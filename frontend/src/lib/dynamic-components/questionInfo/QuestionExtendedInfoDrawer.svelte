<script lang="ts">
  import { getCustomData } from '@openvaa/app-shared';
  import { Drawer } from '$lib/components/modal/drawer';
  import { QuestionExtendedInfo } from '$lib/components/questions';
  import type { QuestionExtendedInfoDrawerProps } from './QuestionExtendedInfoDrawer.type';

  type $$Props = QuestionExtendedInfoDrawerProps;

  export let question: $$Props['question'];
  const customData = getCustomData(question);
</script>

<Drawer title={question.text}>
  <QuestionExtendedInfo info={question.info} infoSections={customData?.infoSections} />
</Drawer>
