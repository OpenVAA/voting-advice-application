# Phase 100 — Deferred Items (out of scope, do NOT fix here)

## svelte-check: `tabindex="-1"` on `QuestionHeading` — `Type 'string' is not assignable to type 'number'`

- **Discovered during:** Plan 100-02 Task 2 (svelte-check self-check, post-hoist).
- **Location (after hoist):** `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:225` (the Phase 99 `QuestionHeading` heading marker block).
- **Pre-existing, relocated — not introduced:** This error travelled VERBATIM with the Phase 99 a11y marker that was hoisted from the old `questions/[questionId]/+page.svelte:183`. The identical pattern still errors at `candidate/(protected)/questions/[questionId]/+page.svelte:277` (untouched by this phase). Net svelte-check error count for this marker is unchanged (1 occurrence, moved leaf→layout).
- **Why not fixed here:** Phase 100 mandates preserving every Phase 99 marker VERBATIM (NON-NEGOTIABLE constraint). Altering `tabindex="-1"` → `{-1}` to satisfy the `HTMLAttributes` numeric type would change the marker and risk the Phase 99 focus/announcer regression gate. `yarn build` (the plan's primary gate) is clean; svelte-check is advisory here.
- **Suggested future fix:** Type `QuestionHeading`'s forwarded `tabindex` prop to accept `string | number` (or coerce), then update both the voter layout and the candidate leaf together. Track as a `@openvaa/frontend` typing follow-up.

## svelte-check: pre-existing unrelated errors (not in scope of Phase 100 files)

These were already present on the tree before Plan 100-02 and touch files this plan does not modify:
- `src/routes/api/admin/jobs/start/+server.ts:20` — `cookies` not in fetch-options type.
- `src/routes/api/data/[collection]/+server.ts:5` + `src/routes/(voters)/constituencies/+page.svelte:15` — missing `@types/qs` declaration.
- `src/routes/runes-test/getroute-rune/getRouteRuneStore.svelte.ts:63` — implicit `any` param.
- `src/routes/candidate/(protected)/settings/+page.svelte:52,121` — password-field prop typing.
