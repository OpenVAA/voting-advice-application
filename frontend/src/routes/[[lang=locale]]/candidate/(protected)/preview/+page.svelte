<!--@component

# Candidate app preview own profile page

Used to show a preview of the candidate’s own profile using the `EntityDetails` component.

## Settings

- See the `EntityDetails` component.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { translateLocalizedCandidate } from '$lib/api/utils/translateLocalizedCandidate';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Icon } from '$lib/components/icon';
  import { Loading } from '$lib/components/loading';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { EntityDetails } from '$lib/dynamic-components/entityDetails';
  import { logDebugError } from '$lib/utils/logger';
  import SingleCardContent from '../../../SingleCardContent.svelte';
  import type { Candidate } from '@openvaa/data';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { dataRoot, getRoute, locale, t, userData } = getCandidateContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Get the candidate object
  ////////////////////////////////////////////////////////////////////

  let status: ActionStatus = 'loading';
  let entity: Candidate | undefined;

  $: {
    loadCandidate();
    // React to locale changes
    $locale; // eslint-disable-line @typescript-eslint/no-unused-expressions
  }

  /**
   * Reload the candidate data, provide it to `DataRoot` and save the `Candidate` to `entity`
   */
  async function loadCandidate(): Promise<void> {
    status = 'loading';
    const result = await userData.reloadCandidateData().catch((e) => {
      logDebugError(`Error with reloadCandidateData: ${e?.message}`);
      return undefined;
    });
    if (!result) {
      status = 'error';
      return;
    }
    try {
      $dataRoot.provideEntityData([translateLocalizedCandidate(result, $locale)]);
      entity = $dataRoot.getCandidate(result.id);
      status = 'success';
    } catch (e) {
      logDebugError(`Error providing candidate data to dataRoot or  getting the object: ${e}`);
      status = 'error';
      return;
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    actions: {
      return: 'show',
      returnButtonLabel: $t('candidateApp.preview.close'),
      returnButtonCallback: () => goto($getRoute('CandAppHome'))
    }
  });
</script>

<SingleCardContent title={$t('candidateApp.preview.title')}>
  <svelte:fragment slot="note">
    <Icon name="info" />
    {$t('candidateApp.preview.tip')}
  </svelte:fragment>
  <!-- The card -->
  {#if status === 'success' && entity}
    <EntityDetails {entity} />
  {:else if status === 'error'}
    <ErrorMessage inline message={$t('candidateApp.preview.notFound')} />
  {:else}
    <Loading showLabel />
  {/if}
</SingleCardContent>
