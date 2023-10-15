<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import type {PageServerData} from './$types';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import {SingleCardPage} from '$lib/components/singleCardPage';
  import {AddToListIcon, HelpIcon} from '$lib/components/icons';
  import {IconButton} from '$lib/components/iconButton';
  import {CandidateDetailsCard} from '$lib/components/candidates';

  export let data: PageServerData;

  const {candidate, questions} = data;

  // TODO: Create an error page and use it if there's an error
  const title = candidate
    ? GetFullNameInOrder(candidate.firstName, candidate.lastName)
    : $_('candidates.notFound');
</script>

<SingleCardPage {title}>
  <svelte:fragment slot="secondaryActions">
    <IconButton href="/list" aria-label={$page.data.appLabels.actionLabels.addToList}>
      <AddToListIcon />
    </IconButton>
    <IconButton href="/help" aria-label={$page.data.appLabels.actionLabels.help}>
      <HelpIcon />
    </IconButton>
  </svelte:fragment>

  {#if candidate}
    <CandidateDetailsCard {candidate} {questions} />
  {:else}
    {$_('candidates.notFound')}
  {/if}
</SingleCardPage>
