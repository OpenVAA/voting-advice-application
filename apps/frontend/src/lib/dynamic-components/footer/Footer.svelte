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
  import type { FooterProps } from './Footer.type';

  let { ...restProps }: FooterProps = $props();

  const { appCustomization, t } = getAppContext();
</script>

<footer {...concatClass(restProps, 'mt-lg pl-safelgl pr-safelgr pb-safelgb text-center small-info')}>
  {#if $appCustomization.publisherName}
    {t('common.publishedBy', { publisher: $appCustomization.publisherName })} &bull;
  {/if}
  {t('common.madeWithPrefix')}
  <a href="https://github.com/OpenVAA/voting-advice-application/" target="_blank"
    ><OpenVAALogo color="secondary" size="xs" /></a
  >{t('common.madeWithSuffix')}
</footer>
