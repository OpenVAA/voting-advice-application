<script lang="ts">
  import {t} from '$lib/i18n';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {CandidateDetailsCard} from '$lib/components/candidates';
  import {SingleCardPage} from '$lib/templates/singleCardPage';
  import type {PageServerData} from './$types';

  export let data: PageServerData;

  const {candidate} = data;
</script>

<SingleCardPage title={GetFullNameInOrder(candidate.firstName, candidate.lastName)}>
  <Button
    slot="banner"
    class="!text-neutral"
    variant="icon"
    icon="close"
    href={getRoute(Route.Candidates)}
    text={$t('header.back')} />
  <CandidateDetailsCard {candidate} />
</SingleCardPage>
