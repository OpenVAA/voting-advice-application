<!--
@component A utility component for displaying contestant app terms of use and privacy statement.

After the two dynamic texts it shows a section on usage data, `privacy.usageData.title` and `privacy.usageData.content`, when `analytics.trackEvents` is on and an analytics provider is configured (`projection.active` of the app context's `analyticsGate`). The keys are not dynamic, so an override of the dynamic texts does not remove the section. The visitor's own Global Privacy Control signal does not hide it: the terms are the same for every user.

### Dynamic component

Accesses `AppContext`: `appSettings` and `analyticsGate`.

### Usage

```tsx
<TermsOfUse />
```
-->

<script lang="ts">
  import { getAppContext } from '$lib/contexts/app';
  import { getComponentContext } from '$lib/contexts/component';
  import { sanitizeHtml } from '$lib/utils/sanitize';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();
  // Reactive members are read off the context object, never destructured.
  const ctx = getAppContext();

  ////////////////////////////////////////////////////////////////////
  // Build content
  ////////////////////////////////////////////////////////////////////

  const registryStatement = $derived(
    t('dynamic.contestantAppPrivacy.registryStatement.content', { appName: t('dynamic.appName') })
  );
  const termsOfUse = $derived(
    t('dynamic.contestantAppPrivacy.otherTermsOfUse.content', { appName: t('dynamic.appName') })
  );
  // With no provider configured nothing is kept, so a statement that usage is measured would be untrue.
  const showUsageData = $derived(ctx.appSettings.analytics.trackEvents && ctx.analyticsGate.current.projection.active);
</script>

{#if t('dynamic.contestantAppPrivacy.registryStatement.title') && registryStatement}
  <section>
    <h2>{t('dynamic.contestantAppPrivacy.registryStatement.title')}</h2>
    <div class="prose">
      {@html sanitizeHtml(registryStatement)}
    </div>
  </section>
{/if}
{#if t('dynamic.contestantAppPrivacy.otherTermsOfUse.title') && termsOfUse}
  <section>
    <h2>{t('dynamic.contestantAppPrivacy.otherTermsOfUse.title')}</h2>
    <div class="prose">
      {@html sanitizeHtml(termsOfUse)}
    </div>
  </section>
{/if}
{#if showUsageData}
  <section>
    <h2>{t('privacy.usageData.title')}</h2>
    <div class="prose">
      <p>{t('privacy.usageData.content')}</p>
    </div>
  </section>
{/if}
