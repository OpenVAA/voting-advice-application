<!--@component

# Candidate app preview own profile page

Used to show a preview of the candidate's own profile using the `EntityDetails` component.

## Settings

- See the `EntityDetails` component.
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { goto } from '$app/navigation';
  import { SingleCardContent } from '$layouts/main';
  import { translateLocalizedCandidate } from '$lib/api/utils/translateLocalizedCandidate';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Icon } from '$lib/components/icon';
  import { Loading } from '$lib/components/loading';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { EntityDetails } from '$lib/dynamic-components/entityDetails';
  import type { Candidate } from '@openvaa/data';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const ctx = getCandidateContext();
  const { getRoute, t, userData } = ctx;
  // `locale` is a scalar, value-replacing accessor, so a read alias over it is safe. `dataRoot` is NOT: it is identity-stable behind a `#version` bridge, so an alias hands back the same reference on every bump and Svelte skips downstream notification. It is read at its point of use in `loadCandidate` instead (spike 024, CLAUDE.md carve-out).
  const locale = $derived(ctx.locale);
  const { pageStyles, topBarSettings } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // Get the candidate object
  ////////////////////////////////////////////////////////////////////

  let status = $state<ActionStatus>('loading');
  let entity = $state<Candidate | undefined>(undefined);

  $effect(() => {
    // Read locale via store subscription to create reactive dependency.
    // Locale is constant within a page lifecycle (changes trigger full page reload), so this effect runs loadCandidate() once on mount.
    void locale;
    loadCandidate();
  });

  /**
   * Reload the candidate data, provide it to `DataRoot` and save the `Candidate` to `entity`
   */
  async function loadCandidate(): Promise<void> {
    status = 'loading';
    const result = await userData.reloadCandidateData().catch((e) => {
      log.error(`Error with reloadCandidateData: ${e?.message}`);
      return undefined;
    });
    if (!result) {
      status = 'error';
      return;
    }
    try {
      // Use locale (store subscription) to get the string value. `dataRoot` is read directly here, past the await, so this runs outside the effect's tracking scope and no intermediate alias is bound over the identity-stable accessor.
      const dataRoot = ctx.dataRoot;
      dataRoot.provideEntityData([translateLocalizedCandidate(result, locale)]);
      entity = dataRoot.getCandidate(result.id);
      status = 'success';
    } catch (e) {
      log.error(`Error providing candidate data to dataRoot or  getting the object: ${e}`);
      status = 'error';
      return;
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
  topBarSettings.use({
    actions: {
      return: 'show',
      returnButtonLabel: t('candidateApp.preview.close'),
      returnButtonCallback: () => goto(getRoute.current('CandAppHome'))
    }
  });
</script>

<SingleCardContent title={t('candidateApp.preview.title')}>
  {#snippet note()}
    <Icon name="info" />
    {t('candidateApp.preview.tip')}
  {/snippet}
  <!-- The card -->
  <div data-testid="candidate-preview-container">
    {#if status === 'success' && entity}
      <EntityDetails {entity} />
    {:else if status === 'error'}
      <ErrorMessage inline message={t('candidateApp.preview.notFound')} />
    {:else}
      <Loading showLabel />
    {/if}
  </div>
</SingleCardContent>
