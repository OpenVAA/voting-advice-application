<!--
@component Show buttons opting in or out of data collection and possibly information about data collection.

### Dynamic component

Accesses `AppContext` to set and read `userPreferences`. The description names no analytics provider: its note is `privacy.dataCollection.info`. Whether the component is offered at all is decided by the page that renders it.

### Properties

- `description`: Whether and how to show the data consent description. Default: `'modal'`
  - `'none'`: Don't show the description.
  - `'inline'`: Show the consent description (`common.privacy.dataCollection.content` and `privacy.dataCollection.info`) and the current consent status above the buttons.
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

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';
  import { concatClass } from '$lib/utils/components';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { DataConsentInfoButton } from './';
  import type { ConsentStatus } from '$lib/contexts/app/userPreferences.type';
  import type { DataConsentProps } from './DataConsent.type';

  let { description = 'modal', onChange, ...restProps }: DataConsentProps = $props();

  const ctx = getAppContext();
  const { userPreferences, setDataConsent, t } = ctx;
  function handleChange(consent: ConsentStatus) {
    if (consent !== userPreferences.current.dataCollection?.consent) setDataConsent(consent);
    onChange?.(consent);
  }
</script>

<div {...concatClass(restProps, 'grid justify-items-center')}>
  {#if description === 'inline'}
    <div>
      <p>{@html sanitizeHtml(t('common.privacy.dataCollection.content'))}</p>
      <p>{t('privacy.dataCollection.info')}</p>
    </div>
    <p class="mt-md text-center font-bold">
      {t(
        assertTranslationKey(
          `privacy.dataConsentIntro.${userPreferences.current.dataCollection?.consent ?? 'indetermined'}`
        ),
        { consentDate: new Date(userPreferences.current.dataCollection?.date ?? '') }
      )}
    </p>
  {/if}
  <Button
    onclick={() => handleChange('granted')}
    variant="main"
    iconPos="left"
    disabled={userPreferences.current.dataCollection?.consent === 'granted'}
    icon={userPreferences.current.dataCollection?.consent === 'granted' ? 'check' : undefined}
    text={t('privacy.dataConsentLabel.granted')} />
  <Button
    onclick={() => handleChange('denied')}
    color="warning"
    iconPos="left"
    disabled={userPreferences.current.dataCollection?.consent === 'denied'}
    icon={userPreferences.current.dataCollection?.consent === 'denied' ? 'check' : undefined}
    text={t('privacy.dataConsentLabel.denied')} />
  {#if description === 'modal'}
    <DataConsentInfoButton color="neutral" variant="normal" />
  {/if}
</div>
