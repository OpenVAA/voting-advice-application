<script lang="ts">
  import '../app.css';
  import { staticSettings } from '@openvaa/app-shared';
  import { isValidResult } from '$lib/api/utils/isValidResult';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { initComponentContext } from '$lib/contexts/component';
  import { initI18nContext } from '$lib/contexts/i18n';
  import { initLayoutContext } from '$lib/contexts/layout';
  import { MaintenancePage } from '$lib/templates/maintenance';
  import { logDebugError } from '$lib/utils/logger';
  import type { DPDataType } from '$lib/api/base/dataTypes';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  ////////////////////////////////////////////////////////////////////
  // Initialize globally used contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = initI18nContext();
  initComponentContext();
  initLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // Check appSettings and appCustomization
  ////////////////////////////////////////////////////////////////////

  let error: Error | undefined;
  let ready: boolean;
  let underMaintenance: boolean;
  $: {
    // If data is updated, we want to prevent loading the slot until the promises resolve
    error = undefined;
    ready = false;
    underMaintenance = false;
    Promise.all([data.appSettingsData, data.appCustomizationData]).then((data) => {
      error = update(data);
    });
  }
  $: if (error) logDebugError(error.message);

  /**
   * Handle the update inside a function so that we don't track $dataRoot, which would result in an infinite loop.
   * @returns `Error` if the data is invalid, `undefined` otherwise.
   */
  function update([appSettingsData, appCustomizationData]: [
    DPDataType['appSettings'] | Error,
    DPDataType['appCustomization'] | Error
  ]): Error | undefined {
    if (!isValidResult(appSettingsData, { allowEmpty: true })) return new Error('Error loading app settings data');
    if (!isValidResult(appCustomizationData, { allowEmpty: true })) return new Error('Error app customization data');
    underMaintenance = appSettingsData.underMaintenance ?? false;
    // We don't do anything else with the data if they're okay, because the relevant stores will pick them up from $page.data
    ready = true;
  }

  ////////////////////////////////////////////////////////////////////
  // Other global effects
  ////////////////////////////////////////////////////////////////////

  const fontUrl =
    staticSettings.font?.url ?? 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap';
</script>

<svelte:head>
  <title>{underMaintenance ? $t('maintenance.title') : $t('dynamic.appName')}</title>
  <meta
    name="theme-color"
    content={staticSettings?.colors?.light?.['base-300'] ?? '#d1ebee'}
    media="(prefers-color-scheme: light)" />
  <meta
    name="theme-color"
    content={staticSettings?.colors?.dark?.['base-300'] ?? '#1f2324'}
    media="(prefers-color-scheme: dark)" />
  {#if fontUrl.indexOf('fonts.googleapis') !== -1}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="true" />
  {/if}
  <link href={fontUrl} rel="stylesheet" />
</svelte:head>

{#if error}
  <ErrorMessage class="h-screen bg-base-300" />
{:else if !ready}
  <Loading class="h-screen bg-base-300" showLabel />
{:else if underMaintenance}
  <MaintenancePage />
{:else}
  <slot />
{/if}
