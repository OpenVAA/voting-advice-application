<!--@component

# Candidate app terms of use form

Show the terms of use along with a checkbox for accepting them.

## Dynamic component

Accesses `CandidateContext`.

## Usage

```tsx
<script lang="ts">
  let termsAccepted: boolean;
  $: console.info('termsAccepted:', termsAccepted);
</script>
<TermsOfUseForm bind:termsAccepted/>
```
-->

<script lang="ts">
  import { Expander } from '$lib/components/expander';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { TermsOfUse } from '.';
  import type { TermsOfUseFormProps } from './TermsOfUseForm.type';

  type $$Props = TermsOfUseFormProps;

  export let termsAccepted: $$Props['termsAccepted'] = false;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();
</script>

<section {...concatClass($$restProps, 'flex flex-col items-center')}>
  <div class="mb-lg text-center">
    {@html sanitizeHtml($t('dynamic.candidateAppPrivacy.consent.ingress'))}
  </div>
  <Expander title={$t('dynamic.candidateAppPrivacy.consent.title')} contentClass="prose bg-base-100 rounded-lg">
    <div class="m-lg">
      <TermsOfUse />
    </div>
  </Expander>
  <label class="label mb-md mt-sm cursor-pointer justify-start gap-sm !p-0">
    <input type="checkbox" class="checkbox" name="termsAccepted" bind:checked={termsAccepted} />
    <span class="label-text">{$t('dynamic.candidateAppPrivacy.consent.acceptLabel')}</span>
  </label>
</section>
