<!--@component

# Candidate app terms of use

A utility component for displaying candidate app terms of use and privacy statement.

## Usage

```tsx
<TermsOfUse />
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { sanitizeHtml } from '$lib/utils/sanitize';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Build content
  ////////////////////////////////////////////////////////////////////

  let registryStatement: string;
  let termsOfUse: string;

  $: {
    const appName = $t('dynamic.appName');
    registryStatement = $t('dynamic.candidateAppPrivacy.registryStatement.content', { appName });
    termsOfUse = $t('dynamic.candidateAppPrivacy.otherTermsOfUse.content', { appName });
  }
</script>

{#if $t('dynamic.candidateAppPrivacy.registryStatement.title') && registryStatement}
  <section>
    <h2>{$t('dynamic.candidateAppPrivacy.registryStatement.title')}</h2>
    <div class="prose">
      {@html sanitizeHtml(registryStatement)}
    </div>
  </section>
{/if}
{#if $t('dynamic.candidateAppPrivacy.otherTermsOfUse.title') && termsOfUse}
  <section>
    <h2>{$t('dynamic.candidateAppPrivacy.otherTermsOfUse.title')}</h2>
    <div class="prose">
      {@html sanitizeHtml(termsOfUse)}
    </div>
  </section>
{/if}
