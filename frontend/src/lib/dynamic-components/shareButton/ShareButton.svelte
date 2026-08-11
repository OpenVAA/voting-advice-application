<!--@component

# Share button

A button that shares the app's root url. On devices that support the Web Share API (most mobile browsers) it opens the operating system's native share sheet, which offers the messaging apps the user actually has installed. Elsewhere — mainly desktop browsers — it falls back to a dialog listing the most commonly used sharing targets.

The button is rendered as a `responsive-icon`, i.e. icon-only on small screens and icon + label on larger ones.

### Dynamic component

Accesses `AppContext`.

### Properties

- `url`: The url to share. Default: the root url of the app, resolved from the current `location`
- Any valid properties of a `<Button>` component.

### Usage

```tsx
<ShareButton />
```
-->

<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { Button } from '$lib/components/button';
  import { Modal } from '$lib/components/modal';
  import { getAppContext } from '$lib/contexts/app';
  import type { IconName } from '$lib/components/icon';
  import type { ShareButtonProps } from './ShareButton.type';

  type $$Props = ShareButtonProps;

  export let url: $$Props['url'] = undefined;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t, track } = getAppContext();

  ////////////////////////////////////////////////////////////////////
  // Contents of the share
  ////////////////////////////////////////////////////////////////////

  /**
   * The root url of the app, i.e. the current origin combined with the possible `base` path. Resolved from `location` so that the same build works on any domain.
   */
  let sharedUrl: string;
  $: sharedUrl = url ?? new URL(`${base}/`, $page.url.origin).href;

  let title: string;
  $: title = $t('dynamic.appName');

  let text: string;
  $: text = $t('dynamic.frontPage.ingress');

  ////////////////////////////////////////////////////////////////////
  // Sharing targets used by the fallback dialog
  ////////////////////////////////////////////////////////////////////

  type ShareTarget = {
    /** Used both as the tracking label and, for the translated targets, as the translation key */
    id: string;
    label: string;
    icon: IconName;
    href: string;
  };

  let targets: Array<ShareTarget>;
  $: {
    const encodedUrl = encodeURIComponent(sharedUrl);
    const encodedText = encodeURIComponent(text);
    targets = [
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        icon: 'whatsapp',
        href: `https://wa.me/?text=${encodeURIComponent(`${text} ${sharedUrl}`)}`
      },
      {
        id: 'facebook',
        label: 'Facebook',
        icon: 'facebook',
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
      },
      {
        id: 'x',
        label: 'X',
        icon: 'x',
        href: `https://x.com/intent/post?url=${encodedUrl}&text=${encodedText}`
      },
      {
        id: 'email',
        label: $t('components.share.email'),
        icon: 'email',
        href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${sharedUrl}`)}`
      }
    ];
  }

  ////////////////////////////////////////////////////////////////////
  // Sharing
  ////////////////////////////////////////////////////////////////////

  let openModal: (() => void) | undefined;
  let copied = false;
  let copiedTimeout: ReturnType<typeof setTimeout> | undefined;

  /**
   * Open the native share sheet if the browser supports it and fall back to the dialog otherwise. NB. `navigator.share` must be called during the click event's user gesture, so we must not `await` anything before it.
   */
  function handleShare(): void {
    const data = { title, text, url: sharedUrl };
    if (typeof navigator !== 'undefined' && navigator.share && (navigator.canShare?.(data) ?? true)) {
      navigator
        .share(data)
        .then(() => track('share', { target: 'native' }))
        .catch((e: unknown) => {
          // The user dismissed the share sheet, which is not an error
          if (e instanceof Error && e.name === 'AbortError') return;
          // Some browsers advertise `share` but reject the call, e.g. when not served over https, in which case we show the fallback dialog instead
          openFallback();
        });
      return;
    }
    openFallback();
  }

  function openFallback(): void {
    copied = false;
    track('share_open');
    openModal?.();
  }

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(sharedUrl);
      copied = true;
      clearTimeout(copiedTimeout);
      copiedTimeout = setTimeout(() => (copied = false), 3000);
      track('share', { target: 'copyLink' });
    } catch {
      // Clipboard access can be denied, in which case the user can still copy the url shown at the bottom of the dialog
    }
  }
</script>

<Button
  on:click={handleShare}
  variant="responsive-icon"
  icon="share"
  text={$t('components.share.title')}
  {...$$restProps} />

<Modal bind:openModal title={$t('components.share.modalTitle')}>
  <div class="flex flex-col">
    {#each targets as { id, label, icon, href } (id)}
      <Button
        {href}
        target="_blank"
        rel="noopener noreferrer"
        text={label}
        {icon}
        on:click={() => track('share', { target: id })} />
    {/each}
    <Button
      on:click={copyLink}
      icon={copied ? 'check' : 'copyLink'}
      text={copied ? $t('components.share.linkCopied') : $t('components.share.copyLink')} />
  </div>
  <p class="sr-only" aria-live="polite">{copied ? $t('components.share.linkCopied') : ''}</p>
  <p class="mt-md break-all text-center text-sm text-secondary">{sharedUrl}</p>
</Modal>
