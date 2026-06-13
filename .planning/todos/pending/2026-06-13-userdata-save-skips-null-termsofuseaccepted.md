---
created: "2026-06-13T00:00:00.000Z"
title: "userData save() silently skips persisting termsOfUseAccepted: null"
area: frontend
priority: medium
files:
  - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts
source: Phase 111 code review (WR-01) — pre-existing bug surfaced by CLASS-06 refactor, deferred to preserve behaves-identically contract
---

## Problem

`candidateUserDataStore` `save()` uses a **truthy guard** at two points that silently drops a
`null`-valued `termsOfUseAccepted` edit:

**Line 150 — `#unsavedProperties` computation:**
```typescript
this.#editedTermsOfUseAccepted ? 'termsOfUseAccepted' : undefined
```
When `setTermsOfUseAccepted(null)` is called, `#editedTermsOfUseAccepted` is `null` (falsy), so
`'termsOfUseAccepted'` never appears in `#unsavedProperties`. No "unsaved changes" indicator is
shown to the user.

**Line 276 — `save()` RPC guard:**
```typescript
if (image || termsOfUseAccepted) {
```
Same falsy check: `termsOfUseAccepted` is `null` → condition is `false` → the `updateEntityProperties`
RPC is never called → the `null` edit is silently discarded. `resetTermsOfUseAccepted()` then clears
the edit at line 291, so the user believes the value was saved when it was not.

The `#current` derived (line 78) correctly uses `?? termsOfUseAccepted` (nullish coalescing), so the
composite render correctly shows `null` as the effective value — making the inconsistency harder to
notice: the UI looks correct but saving does nothing.

The bug is pre-existing (preserved verbatim by the Phase 111 CLASS-06 refactor). Deferred from Phase
111 to keep the "behaves-identically" migration contract.

## Solution

Replace both truthy checks with `!== undefined` discriminants, which is the correct sentinel for
"no edit pending" (`undefined` = no edit; `null` = explicit null edit).

**Line 150 fix:**
```typescript
[
  this.#editedImage !== undefined ? 'image' : undefined,
  this.#editedTermsOfUseAccepted !== undefined ? 'termsOfUseAccepted' : undefined
].filter((p) => p !== undefined) as Array<keyof LocalizedCandidateData>
```

**Line 276 fix:**
```typescript
if (image !== undefined || this.#editedTermsOfUseAccepted !== undefined) {
```

Note: `#editedImage` uses `undefined` as the "no edit" sentinel (line 219:
`resetImage = () => { this.#editedImage = undefined; }`), so `!== undefined` aligns both branches
to the same discriminant pattern.
