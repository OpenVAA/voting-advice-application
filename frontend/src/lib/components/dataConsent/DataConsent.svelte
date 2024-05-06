<script lang="ts">
  import {t} from '$lib/i18n';
  import {concatClass} from '$lib/utils/components';
  import {sanitizeHtml} from '$lib/utils/sanitize';
  import {setDataConsent, userPreferences} from '$lib/utils/stores';
  import {Modal} from '$lib/components/modal';
  import {Button} from '$lib/components/button';
  import type {DataConsentProps} from './DataConsent.type';

  type $$Props = DataConsentProps;

  export let infoModal: $$Props['infoModal'] = true;

  let closeModal: () => void;
  let openModal: () => void;

  function onChange(this: HTMLInputElement) {
    const consentGiven = !this.checked;
    if (consentGiven !== $userPreferences.dataCollection?.consent) setDataConsent(consentGiven);
  }
</script>

<!--
@component
Show a checkbox for opting out of data collection and a possibly a button that opens a modal displaying information about data collection.

### Properties

- `infoModal`: Whether to show an info button that opens a modal displaying information about data collection. @default `true`
- Any valid attributes of a `<label>` element.

### Usage

```tsx
<DataConsent/>
<DataConsent enable/>

```
-->

<label {...concatClass($$restProps, 'label cursor-pointer px-0 py-0 my-md')}>
  <input
    on:change={onChange}
    checked={$userPreferences.dataCollection?.consent === false}
    type="checkbox"
    class="checkbox-neutral checkbox bg-base-100" />
  <div class="small-label label-text ms-md flex flex-row items-center hyphens-none text-neutral">
    {$t('privacy.dataConsentLabel')}
    {#if infoModal}
      <Button
        variant="icon"
        icon="info"
        on:click={openModal}
        text={$t('privacy.dataConsentInfoButton')}
        class="inline" />
    {/if}
  </div>
</label>

{#if infoModal}
  <Modal bind:closeModal bind:openModal title={$t('privacy.dataTitle')}>
    {@html sanitizeHtml($t('privacy.dataContent'))}
    <div slot="actions" class="mx-auto flex w-full max-w-md flex-col">
      <Button on:click={closeModal} text={$t('common.close')} variant="main" />
    </div>
  </Modal>
{/if}
