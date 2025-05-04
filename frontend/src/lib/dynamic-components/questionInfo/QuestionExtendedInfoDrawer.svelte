<script lang="ts">
  import { getCustomData } from '@openvaa/app-shared';
  import { Drawer } from '$lib/components/modal/drawer';
  import { QuestionExtendedInfo } from '$lib/components/questions';
  import type { QuestionExtendedInfoDrawerProps } from './QuestionExtendedInfoDrawer.type';
  import type { QuestionInfoSection } from '@openvaa/app-shared';

  type $$Props = QuestionExtendedInfoDrawerProps;

  // Define the argument type
  interface Argument {
    topic: string;
    argument: string;
  }
  // Define the extended custom data type that includes argumentSummary
  interface ExtendedCustomData {
    allowOpen?: boolean;
    disableMultilingual?: boolean;
    fillingInfo?: string;
    filterable?: boolean;
    infoSections?: Array<QuestionInfoSection>;
    terms?: Array<any>;
    locked?: boolean;
    longText?: boolean;
    maxlength?: number;
    required?: boolean;
    vertical?: boolean;
    video?: any;
    argumentSummary?: {
      pros?: Argument[];
      cons?: Argument[];
    };
  }


  export let question: $$Props['question'];
  // Cast the customData to our extended type
  const customData = getCustomData(question) as ExtendedCustomData;
  
  // Create info sections for arguments if they exist
  let combinedInfoSections: QuestionInfoSection[] = [...(customData?.infoSections || [])];

    
  // Process pro arguments if they exist
  if (customData?.argumentSummary?.pros?.length) {
    const prosContent = customData.argumentSummary.pros.map((arg: Argument) => 
      `<li>${arg.argument}</li>`
    ).join('<br>');
    
    combinedInfoSections.push({
      title: 'Arguments For',
      content: prosContent,
      visible: true
    });
  }
  
  // Process con arguments if they exist
  if (customData?.argumentSummary?.cons?.length) {
    const consContent = customData.argumentSummary.cons.map((arg: Argument) => 
      `<li>${arg.argument}</li>`
    ).join('<br>');
    
    combinedInfoSections.push({
      title: 'Arguments Against',
      content: consContent,
      visible: true
    });
  }
</script>

<Drawer title={question.text}>
  <QuestionExtendedInfo info={question.info} infoSections={combinedInfoSections} />
</Drawer>
