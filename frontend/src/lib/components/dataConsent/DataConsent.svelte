<script lang="ts">
  import {createEventDispatcher} from 'svelte';
  import {t} from '$lib/i18n';
  import {concatClass} from '$lib/utils/components';
  import {sanitizeHtml} from '$lib/utils/sanitize';
  import {setDataConsent, settings, userPreferences} from '$lib/utils/stores';
  import {Button} from '$lib/components/button';
  import {DataConsentInfoButton} from './';
  import type {DataConsentEvents, DataConsentProps} from './DataConsent.type';

  type $$Props = DataConsentProps;

  export let description: $$Props['description'] = 'modal';

  const dispatchEvent = createEventDispatcher<DataConsentEvents>();

  function onChange(consent: UserDataCollectionConsent) {
    if (consent !== $userPreferences.dataCollection?.consent) setDataConsent(consent);
    dispatchEvent('change', {consent});
  }
</script>

<!--
@component
Show buttons opting in or out of data collection and possibly information about data collection.

### Properties

- `description`: Whether and how to show the data consent description. @default `modal`
  - `none`: Don’t show the description.
  - `inline`: Show the consent description above the buttons.
  - `modal`: Show a button that opens the description in a modal.
- Any valid attributes of a `<div>` element.

### Events

- `change`: Fired when the user changes their data collection consent. The event `detail` cóntains:
  - `consent`: the new consent value.

### Usage

```tsx
<DataConsent/>
<DataConsent description="none"/>
```
-->

<div {...concatClass($$restProps, 'grid justify-items-center')}>
  {#if description === 'inline' && $settings.analytics.platform}
    <div>
      <p>{@html sanitizeHtml($t('privacy.dataContent'))}</p>
      <p>
        {@html sanitizeHtml($t(`privacy.dataContentPlatform.${$settings.analytics.platform.name}`))}
      </p>
    </div>
    <p class="mt-md text-center font-bold">
      {$t(
        `privacy.dataConsentIntro.${$userPreferences.dataCollection?.consent ?? 'indetermined'}`,
        {consentDate: new Date($userPreferences.dataCollection?.date ?? '')}
      )}
    </p>
  {/if}
  <Button
    on:click={() => onChange('granted')}
    variant="main"
    iconPos="left"
    disabled={$userPreferences.dataCollection?.consent === 'granted'}
    icon={$userPreferences.dataCollection?.consent === 'granted' ? 'check' : undefined}
    text={$t('privacy.dataConsentLabel.granted')} />
  <Button
    on:click={() => onChange('denied')}
    color="warning"
    iconPos="left"
    disabled={$userPreferences.dataCollection?.consent === 'denied'}
    icon={$userPreferences.dataCollection?.consent === 'denied' ? 'check' : undefined}
    text={$t('privacy.dataConsentLabel.denied')} />
  <!-- <Button 
    on:click={() => onChange('indetermined')}
    color="secondary"
    iconPos="left"
    icon={$userPreferences.dataCollection?.consent == null || $userPreferences.dataCollection?.consent === 'indetermined' ? 'check' : undefined}
    text="ZXXX"/> -->
  {#if description === 'modal'}
    <DataConsentInfoButton color="neutral" variant="normal" />
  {/if}
</div>
