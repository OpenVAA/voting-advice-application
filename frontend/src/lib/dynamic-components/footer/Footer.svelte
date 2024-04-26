<!--
@component
A template part that is used to show the application's common footer, shown on some pages.

### Dynamic component

- Accesses `appCustomization` from `AppContext`.

### Properties

- Any valid attributes of the `<footer>` element.

### Usage

```tsx
<Footer/>
```
-->

<script lang="ts">
  import { OpenVAALogo } from '$lib/components/openVAALogo';
  import { getAppContext } from '$lib/contexts/app';
  import { concatClass } from '$lib/utils/components';
  import { AppLogo } from '../appLogo';
  import type { FooterProps } from './Footer.type';

  type $$Props = FooterProps; // eslint-disable-line @typescript-eslint/no-unused-vars

  const { appCustomization, darkMode, locale, t } = getAppContext();
</script>

<div class="my-lg">
  <h3 class="my-lg text-center">{$t('common.inCooperation')}</h3>
  <div class="vaa-frontpage-logos align-center flex flex-row flex-wrap items-center justify-center gap-x-xl gap-y-lg">
    <OpenVAALogo />
    <AppLogo size="sm" />
    <img
      src="/images/kone-logo-{$darkMode ? 'white' : 'black'}-{$locale ?? 'fi'}.svg"
      alt="Koneen Säätiö, Konestiftelsen, Kone Foundation" />
    <img src="/images/sitra-logo-{$darkMode ? 'white' : 'black'}.svg" alt="Sitra" class="!max-w-[6rem]" />
  </div>
</div>

<footer {...concatClass($$restProps, 'mt-lg pl-safelgl pr-safelgr pb-safelgb text-center small-info')}>
  {#if $appCustomization.publisherName}
    {$t('common.publishedBy', { publisher: $appCustomization.publisherName })} •
  {/if}
  <!-- The OpenVAA logo cannot be inserted as translation payload because it contains a Svelte component.
       NB. Make sure not to have any space between the closing </a> tag and the suffix text. -->
  {$t('common.madeWithPrefix')}
  <a href="https://github.com/OpenVAA/voting-advice-application/" target="_blank"
    ><OpenVAALogo color="secondary" size="xs" /></a
  >{$t('common.madeWithSuffix')}
</footer>
