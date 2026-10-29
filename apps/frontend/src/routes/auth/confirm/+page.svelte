<!--@component

# The confirm page between a mailed link and its verification

A mailed link opens this page, which verifies nothing. Its form holds the link's token, type and next path in hidden fields, and Continue posts it to this route's action, which verifies the link and lands the user. So a mail scanner or a prefetcher that only fetches the link spends nothing.

- The page belongs to neither app and renders under the root layout alone, as the error page does.
- The sentence under the title says what Continue does for the link's type.
- In a browser that is signed in, a notice says so and that continuing signs that account out, and Cancel, a link beside Continue, leads back to that account's app. The notice names no account: the page cannot know whose the link is until it is verified.
- A second press while a post runs sends nothing.

-->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { t } from '$lib/i18n';
  import { getUUID } from '$lib/utils/components';
  import type { SubmitFunction } from '@sveltejs/kit';
  import type { TranslationKey } from '$types';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  /** The sentence under the title, for each type of link the page is opened for. */
  const INTRO: Record<PageData['type'], TranslationKey> = {
    magiclink: 'authConfirm.intro.magiclink',
    recovery: 'authConfirm.intro.recovery',
    email_change: 'authConfirm.intro.email_change'
  };

  const formId = getUUID();

  let submitting = $state(false);

  /**
   * Called with a submit of the form before it is posted. Cancels a post made while another runs, and otherwise lets the action's redirect be followed.
   */
  function handleSubmit({ cancel }: Parameters<SubmitFunction>[0]): ReturnType<SubmitFunction> {
    if (submitting) {
      cancel();
      return;
    }
    submitting = true;
    return async ({ update }) => {
      await update();
      submitting = false;
    };
  }
</script>

<main class="bg-base-300 flex min-h-dvh flex-col">
  <MainContent title={t('authConfirm.title')} data-testid="auth-confirm-page" data-type={data.type}>
    <p class="text-center">{t(INTRO[data.type])}</p>

    {#if data.signedIn}
      <p class="mt-md text-center font-bold" data-testid="auth-confirm-signed-in">{t('authConfirm.signedIn')}</p>
    {/if}

    <form id={formId} method="POST" use:enhance={handleSubmit}>
      <input type="hidden" name="token_hash" value={data.tokenHash} />
      <input type="hidden" name="type" value={data.type} />
      {#if data.next}
        <input type="hidden" name="next" value={data.next} />
      {/if}
    </form>

    {#snippet primaryActions()}
      <Button
        type="submit"
        form={formId}
        variant="main"
        text={t('authConfirm.continue')}
        loading={submitting}
        data-testid="auth-confirm-continue" />
      {#if data.signedIn}
        <Button href={data.cancelRoute} text={t('authConfirm.cancel')} data-testid="auth-confirm-cancel" />
      {/if}
    {/snippet}
  </MainContent>
</main>
