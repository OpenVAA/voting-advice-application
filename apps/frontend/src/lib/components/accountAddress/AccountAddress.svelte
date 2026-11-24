<!--
@component An account's address under its label, centred and in bold, as the account screens show it.

### Properties

- `label`: The label shown above the address.
- `address`: The address to show.
- `data-testid`: The test id of the address, set on the `<dd>` holding it.
- Any valid attributes of a `<dl>` element.

### Accessibility

- The address is a `<dd>` under its label, so it is announced with the label. It is never hyphenated or translated, and it wraps at any character rather than overflowing.

### Usage

```tsx
<AccountAddress
  label={t('common.account.signedInAs')}
  address={email}
  data-testid="set-password-email" />
```
-->

<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import type { AccountAddressProps } from './AccountAddress.type';

  let { label, address, 'data-testid': testId, ...restProps }: AccountAddressProps = $props();
</script>

<dl {...concatClass(restProps, 'my-lg text-center')}>
  <dt class="small-label">{label}</dt>
  <dd class="font-bold wrap-anywhere hyphens-none" translate="no" data-testid={testId}>{address}</dd>
</dl>
