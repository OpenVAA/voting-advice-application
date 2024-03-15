<script lang="ts">
  import {t} from '$lib/i18n';
  import {formatName} from '$lib/utils/internationalisation';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {EntityDetails} from '$lib/components/entityDetails';
  import {SingleCardPage} from '$lib/templates/singleCardPage';
  import type {PageServerData} from './$types';
  import type {LayoutServerData} from '../$types';

  export let data: PageServerData & LayoutServerData;

  let candidate: CandidateProps;
  let questions: QuestionProps[];
  let infoQuestions: QuestionProps[];
  $: {
    candidate = data.candidate;
    questions = data.questions;
    infoQuestions = data.infoQuestions;
  }
</script>

<SingleCardPage title={formatName(candidate)}>
  <Button
    slot="banner"
    class="!text-neutral"
    variant="icon"
    icon="close"
    href={$getRoute(Route.Candidates)}
    text={$t('header.back')} />
  <EntityDetails entity={candidate} opinionQuestions={questions} {infoQuestions} />
</SingleCardPage>
