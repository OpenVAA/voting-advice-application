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
</script>
<TermsOfUseForm bind:termsAccepted/>
```

## Source

[apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte)

[apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.type.ts)
