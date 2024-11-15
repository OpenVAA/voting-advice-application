<script lang="ts">
  import { OpenVAALogo } from '$lib/components/openVAALogo';
  import { t } from '$lib/i18n';
  import { customization } from '$lib/legacy-stores';
  import { concatClass } from '$lib/utils/components';
  import type { FooterProps } from './Footer.type';

  type $$Props = FooterProps; // eslint-disable-line @typescript-eslint/no-unused-vars
</script>

<!--
@component
A template part that is used to show the application's common footer.

### Properties

- Any valid attributes of the `<footer>` element.

### Usage

```tsx
<Footer/>
```
-->

<footer {...concatClass($$restProps, 'mt-lg pl-safelgl pr-safelgr pb-safelgb text-center text-sm text-secondary')}>
  {#if $customization.publisherName}
    {$t('common.publishedBy', { publisher: $customization.publisherName })} •
  {/if}
  <!-- The OpenVAA logo cannot be inserted as translation payload because it contains a Svelte component.
       NB. Make sure not to have any space between the closing </a> tag and the suffix text. -->
  {$t('common.madeWithPrefix')}
  <a href="https://github.com/OpenVAA/voting-advice-application/" target="_blank"
    ><OpenVAALogo color="secondary" size="xs" /></a
  >{$t('common.madeWithSuffix')}
</footer>
