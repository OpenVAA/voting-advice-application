# TermsOfUseForm

Show the terms of use along with a checkbox for accepting them.

### Dynamic component

Accesses `CandidateContext`.

### Properties

- `termsAccepted`: Bindable: Whether the terms are accepted. Default: `false`
- Any valid attributes of a `<section>` element

### Usage

```tsx
<script lang="ts">
  let termsAccepted: boolean;
  $: console.info('termsAccepted:', termsAccepted);
</script>
<TermsOfUseForm bind:termsAccepted/>
```

## Source

[frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte)

[frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.type.ts)
