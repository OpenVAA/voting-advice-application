<!--@component

# Contestant app help page

Shows a FAQ and the support block, whose button opens an email to the support address. The block carries the anchor the support links of other pages lead to.

### Settings

- `admin.email`: The address the support block writes to.
-->

<script lang="ts">
  import { ContactSupport, SUPPORT_ANCHOR } from '$contestant/components/contactSupport';
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { Expander } from '$lib/components/expander';
  import { getContestantContext } from '$lib/contexts/contestant';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const ctx = getContestantContext();
  const { appCustomization, getRoute, t } = ctx;
  // appSettings is a reactive accessor — read via ctx.appSettings inside $derived, never destructure.
  const contestantAppName = $derived(getContestantAppName({ appSettings: ctx.appSettings, t }));
</script>

<MainContent title={t('contestantApp.help.title')}>
  <div class="mb-lg text-center">
    {t('contestantApp.help.ingress', { contestantAppName })}
  </div>

  {#each appCustomization.current.contestantAppFAQ ?? [] as faq}
    <Expander title={faq.question} variant="question-help">
      {faq.answer}
    </Expander>
  {:else}
    <p class="mt-lg text-secondary text-center">
      {t('contestantApp.help.noFAQ')}
    </p>
  {/each}

  <ContactSupport action="email" id={SUPPORT_ANCHOR} class="mt-lg" />

  {#snippet primaryActions()}
    <Button
      icon="next"
      variant="main"
      text={t('common.home')}
      href={getRoute.current(ctx.isAuthenticated ? 'ContestantAppHome' : 'ContestantAppLogin')}
      data-testid="contestant-help-home" />
  {/snippet}
</MainContent>
