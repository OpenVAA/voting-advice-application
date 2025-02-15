<!--@component

# Candidate app terms of use

A utility component for displaying candidate app terms of use and privacy statement.


-->

<script lang="ts">
  import { Button } from '$lib/components/button';
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
    termsOfUse = $t('dynamic.candidateAppPrivacy.termsOfUse.content', { appName });
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
{#if $t('dynamic.candidateAppPrivacy.termsOfUse.title') && termsOfUse}
  <section>
    <h2>{$t('dynamic.candidateAppPrivacy.termsOfUse.title')}</h2>
    <div class="prose">
      {@html sanitizeHtml(termsOfUse)}
    </div>
    <Button
      href="https://nuorisoala.fi/palvelut/yhdenvertaisuus/turvallisemman-tilan-periaatteet-ja-vihapuheesta-vapaan-keskustelun-saannot/"
      target="_blank"
      text={$t('common.info')}
      class="mt-md justify-self-center" />
  </section>
{/if}
