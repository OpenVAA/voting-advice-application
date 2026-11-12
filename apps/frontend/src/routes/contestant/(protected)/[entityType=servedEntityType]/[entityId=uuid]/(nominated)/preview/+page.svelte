<!--@component

# Contestant app preview own profile page

Shows the entity the user edits a preview of its own profile, using the `EntityDetails` component. What differs between the entity types is read from the entity's descriptor: the note above the card, the tabs the card leaves out, and whether the card begins with a line that shows how the entity is marked beside its candidates.

## Settings

- See the `EntityDetails` component.
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { goto } from '$app/navigation';
  import { SingleCardContent } from '$layouts/main';
  import { translateLocalizedEntity } from '$lib/api/utils/translateLocalizedEntity';
  import { EntityTag } from '$lib/components/entityTag';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Icon } from '$lib/components/icon';
  import { Loading } from '$lib/components/loading';
  import { entityDescriptorOf } from '$lib/contestant/utils/entityDescriptor';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { EntityDetails } from '$lib/dynamic-components/entityDetails';
  import { ensureColors } from '$lib/utils/color/ensureColors';
  import type { AnyEntityVariant } from '@openvaa/data';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const ctx = getContestantContext();
  const { getRoute, t, userData } = ctx;
  // `locale` is a scalar, value-replacing accessor, so a read alias over it is safe. `dataRoot` is NOT: it is identity-stable behind a `#version` bridge, so an alias hands back the same reference on every bump and Svelte skips downstream notification. It is read at its point of use in `loadEntity` instead (spike 024, CLAUDE.md carve-out).
  const locale = $derived(ctx.locale);
  const { pageStyles, topBarSettings } = getLayoutContext();

  // Everything on this page that differs by entity type. `selectedEntity` is a reactive accessor, read on the context.
  const descriptor = $derived(entityDescriptorOf(ctx.selectedEntity?.type));

  ////////////////////////////////////////////////////////////////////
  // Get the entity object
  ////////////////////////////////////////////////////////////////////

  let status = $state<ActionStatus>('loading');
  let entity = $state<AnyEntityVariant | undefined>(undefined);

  // Which entity is loaded, as a string, so that the effect below reruns when the entity changes and not when a reload stores a new copy of the same entity's data.
  const loadedEntityKey = $derived.by(() => {
    const saved = userData.savedEntityData;
    return saved ? `${saved.type}/${saved.id}` : undefined;
  });

  $effect(() => {
    // Read locale via store subscription to create reactive dependency.
    // Locale is constant within a page lifecycle (changes trigger full page reload), so this effect runs loadEntity() once for the loaded entity.
    void locale;
    // The layout loads the entity into the store in an effect of its own, which runs after this one on mount: wait for it.
    if (!loadedEntityKey) return;
    loadEntity();
  });

  /**
   * Reload the entity data, provide it to `DataRoot` and save the entity object to `entity`
   */
  async function loadEntity(): Promise<void> {
    status = 'loading';
    const result = await userData.reloadEntityData().catch((e) => {
      log.error(`Error with reloadEntityData: ${e?.message}`);
      return undefined;
    });
    if (!result) {
      status = 'error';
      return;
    }
    try {
      // Use locale (store subscription) to get the string value. `dataRoot` is read directly here, past the await, so this runs outside the effect's tracking scope and no intermediate alias is bound over the identity-stable accessor.
      const dataRoot = ctx.dataRoot;
      const data = translateLocalizedEntity(result, locale);
      // The entity's own row holds its colour as it is stored: it is adjusted for contrast here, as the data provider adjusts the colours of the public data.
      dataRoot.provideEntityData([data.color ? { ...data, color: ensureColors(data.color) } : data]);
      entity = dataRoot.getEntity(result.type, result.id);
      status = 'success';
    } catch (e) {
      log.error(`Error providing entity data to dataRoot or getting the object: ${e}`);
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
      returnButtonLabel: t('contestantApp.preview.close'),
      returnButtonCallback: () => goto(getRoute.current('ContestantAppEntityHome'))
    }
  });
</script>

<SingleCardContent title={t('contestantApp.preview.title')}>
  {#snippet note()}
    <Icon name="info" />
    {t(descriptor.previewTip)}
  {/snippet}
  <!-- The card -->
  <div data-testid="contestant-preview-container">
    {#if status === 'success' && entity}
      {#if descriptor.previewTagLine.shown}
        <div class="mx-lg mt-lg gap-sm flex flex-wrap items-center" data-testid="contestant-preview-tag">
          <span>{t(descriptor.previewTagLine.label)}</span>
          <EntityTag {entity} variant="short" />
        </div>
      {/if}
      <EntityDetails {entity} excludeTabs={descriptor.previewExcludeTabs} />
    {:else if status === 'error'}
      <ErrorMessage inline message={t('contestantApp.preview.notFound')} />
    {:else}
      <Loading showLabel />
    {/if}
  </div>
</SingleCardContent>
