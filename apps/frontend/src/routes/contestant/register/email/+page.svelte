<!--@component

# Contestant app email entry page of a registration code

Takes the email address that a holder of a registration code nobody has claimed wants to register with, and asks for a sign-in link to it.

- The page shows its screen only while the entry flow holds a registration code that was checked and found valid. Otherwise, as after a reload or a visit by address, it renders nothing and leads to the registration page in place of this history entry.
- The address is entered twice. A press of Continue with two fields that do not hold one usable address sends nothing: each field says what is wrong with it, and the first such field takes focus.
- With two matching addresses the page asks for a link with the trimmed address and the held code, and opens the "email sent" screen when the request has settled, whatever it settled as. Nothing of the request's answer is read.
- The code is read from the entry flow and passed to that request. It is in no field, attribute or text of the page, and in no address.
- The form is declared as a post although no server action answers it, so that a submit the page's script did not catch could not write an address into the address bar. Continue needs the page's script, so it is natively disabled until the page has mounted.

## Settings

- `contestantApp.entityTypes`: The entity types the project serves, which decide the app's name above the heading.

-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { EmailEntry } from '$contestant/components/emailEntry';
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getUUID } from '$lib/utils/components';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Stable references are destructured. `entryFlow` and `appSettings` are reactive accessors, read as `contestantCtx.X` inside each tracking scope: see CLAUDE.md "Context Destructuring Rule".
  const contestantCtx = getContestantContext();
  const { getRoute, sendEntryLink, t } = contestantCtx;
  const contestantAppName = $derived(getContestantAppName({ appSettings: contestantCtx.appSettings, t }));
  const { pageStyles } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // The held code
  ////////////////////////////////////////////////////////////////////

  /** The registration code the address is for: the held one, while it is one that was found valid. */
  const validCode = $derived.by(() => {
    const held = contestantCtx.entryFlow?.code;
    return held?.status === 'valid' ? held.code : undefined;
  });

  $effect(() => {
    if (!validCode) void goto(getRoute.current('ContestantAppRegister'), { replaceState: true });
  });

  ////////////////////////////////////////////////////////////////////
  // The form
  ////////////////////////////////////////////////////////////////////

  const formId = getUUID();

  let entry: EmailEntry | undefined = $state();
  let email = $state('');
  let mounted = $state(false);
  let requesting = $state(false);

  onMount(() => {
    mounted = true;
  });

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (requesting || !validCode || !entry?.validate()) return;
    requesting = true;
    await sendEntryLink({ origin: 'registerEmail', email: email.trim(), code: validCode });
    await goto(getRoute.current('ContestantAppEmailSent'));
    requesting = false;
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
</script>

{#if validCode}
  <MainContent title={t('contestantApp.register.emailEntry.title')} data-testid="contestant-register-email">
    {#snippet heading()}
      <HeadingGroup>
        <PreHeading>{contestantAppName}</PreHeading>
        <h1 tabindex="-1">{t('contestantApp.register.emailEntry.title')}</h1>
      </HeadingGroup>
    {/snippet}

    <p class="text-center">{t('contestantApp.register.emailEntry.ingress')}</p>

    <form id={formId} method="POST" novalidate onsubmit={handleSubmit} class="gap-md flex w-full flex-col">
      <EmailEntry bind:this={entry} bind:email />
    </form>

    {#snippet primaryActions()}
      <Button
        type="submit"
        form={formId}
        variant="main"
        text={t('common.continue')}
        disabled={!mounted}
        loading={requesting}
        data-testid="register-email-submit" />
      <Button
        href={getRoute.current('ContestantAppRegister')}
        text={t('common.return')}
        data-testid="register-email-return" />
    {/snippet}
  </MainContent>
{/if}
