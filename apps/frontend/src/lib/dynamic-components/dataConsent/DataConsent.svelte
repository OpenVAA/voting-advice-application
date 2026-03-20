<!--
@component
Show buttons opting in or out of data collection and possibly information about data collection.

### Dynamic component

Accesses `AppContext` to set and read `userPreferences`.

### Properties

- `description`: Whether and how to show the data consent description. Default: `'modal'`
  - `'none'`: Don't show the description.
  - `'inline'`: Show the consent description above the buttons.
  - `'modal'`: Show a button that opens the description in a modal.
- Any valid attributes of a `<div>` element.

### Callback Props

- `onChange`: Called when the user changes their data collection consent. Receives the new `consent` value.

### Usage

```tsx
<DataConsent/>
<DataConsent description="none"/>
```
-->

<svelte:options runes />

<script lang="ts">
  import { staticSettings } from '@openvaa/app-shared';
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';
  import { concatClass } from '$lib/utils/components';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { DataConsentInfoButton } from './';
  import type { ConsentStatus } from '$lib/contexts/app/userPreferences.type';
  import type { DataConsentProps } from './DataConsent.type';

  let {
    description = 'modal',
    onChange,
    ...restProps
  }: DataConsentProps = $props();

  const { appSettings, userPreferences, setDataConsent, t } = getAppContext();

  // Construct the analytics link for privacy translations
  const analyticsLink = staticSettings.analytics?.platform?.infoUrl
    ? `<a href="${staticSettings.analytics.platform.infoUrl}" target="_blank">${
        staticSettings.analytics.platform.name.charAt(0).toUpperCase() + staticSettings.analytics.platform.name.slice(1)
      }</a>`
    : '';

  function handleChange(consent: ConsentStatus) {
    if (consent !== $userPreferences.dataCollection?.consent) setDataConsent(consent);
    onChange?.(consent);
  }
</script>

<div {...concatClass(restProps, 'grid justify-items-center')}>
  {#if description === 'inline' && $appSettings.analytics.platform}
    <div>
      <p>{@html sanitizeHtml(t('common.privacy.dataCollection.content'))}</p>
      <p>
        {@html sanitizeHtml(
          t(assertTranslationKey(`privacy.dataCollection.platform.${$appSettings.analytics.platform.name}`), {
            analyticsLink
          })
        )}
      </p>
    </div>
    <p class="mt-md text-center font-bold">
      {t(
        assertTranslationKey(`privacy.dataConsentIntro.${$userPreferences.dataCollection?.consent ?? 'indetermined'}`),
        { consentDate: new Date($userPreferences.dataCollection?.date ?? '') }
      )}
    </p>
  {/if}
  <Button
    onclick={() => handleChange('granted')}
    variant="main"
    iconPos="left"
    disabled={$userPreferences.dataCollection?.consent === 'granted'}
    icon={$userPreferences.dataCollection?.consent === 'granted' ? 'check' : undefined}
    text={t('privacy.dataConsentLabel.granted')} />
  <Button
    onclick={() => handleChange('denied')}
    color="warning"
    iconPos="left"
    disabled={$userPreferences.dataCollection?.consent === 'denied'}
    icon={$userPreferences.dataCollection?.consent === 'denied' ? 'check' : undefined}
    text={t('privacy.dataConsentLabel.denied')} />
  {#if description === 'modal'}
    <DataConsentInfoButton color="neutral" variant="normal" />
  {/if}
</div>
