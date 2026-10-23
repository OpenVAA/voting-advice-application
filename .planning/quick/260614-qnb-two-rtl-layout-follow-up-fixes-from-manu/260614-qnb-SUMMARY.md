---
status: complete
---

# Quick Task 260614-qnb: RTL layout follow-up fixes (manual QA)

Two layout tweaks found while testing the RTL (Arabic) build of the
`feat-rtl-locales` branch. Both are follow-ups to the standalone RTL/bidi phase
(`.planning/phases/rtl-bidi-support/`), implementing established DECISIONS.

## Fix 1 — Mirror the question-flow Skip icon under RTL

**Commit:** `162b51f75`

The `skip` icon is the "skip ahead" affordance in `QuestionActions.svelte`
(shown instead of `next` when a question can be skipped). Its glyph points toward
the reading-end, so it must mirror under RTL like `next`/`previous`.

- Added `skip` to `DIRECTIONAL_ICONS` in `frontend/src/lib/components/icon/icons.ts`
  (the `Icon` component then applies `rtl:-scale-x-100` automatically).
- Updated the doc comment to distinguish the question-flow `skip` (directional,
  mirrors) from the media-player controls `skipNext`/`skipPrevious` (do-not-mirror
  set — video chrome stays LTR, DECISIONS A6 gotcha #3).

## Fix 2 — Orient EntityInfo alliance/list value by UI direction

**Commit:** `cd367d23b`

On `EntityInfo`, the party + alliance/list value rendered LTR even under an RTL
UI, while the same content in the `EntityDetails` header (via `EntityCard`)
correctly followed the RTL direction.

**Cause:** `InfoItem`'s value wrapper had a blanket `dir="auto"` (added in P5).
For a Latin party name that auto-resolves to LTR, forcing the whole structural
value block (party `EntityTag` + link + UI parenthetical) to lay out LTR.

**Fix:**
- Added an `autoDir` prop to `InfoItem` (`InfoItem.svelte` + `InfoItem.type.ts`),
  default `true` — preserving `dir="auto"` for plain author-supplied text values
  (election/constituency names, info answers).
- Set `autoDir={false}` on the alliance/list `InfoItem` in `EntityInfo.svelte` so
  its layout follows the UI locale direction, matching the header. The
  author-supplied name still isolates its own direction via `EntityTag`'s inner
  `dir="auto"` span (DECISIONS A5/A8).

## Fix 2b — Align wrapped EntityTag names toward the adjacent icon

**Commits:** `57b1170c3` (first attempt), `113b5800e` (correction)

After Fix 2, long party/alliance names that wrap across lines still drifted away
from the icon. The name `<span>` in `EntityTag.svelte` is a flex item (blockified,
so it honours `text-align`).

The first attempt used `text-start` — but `text-start`/`text-end` resolve against
the span's **own** `dir="auto"` (the content direction). A Latin name in an RTL UI
resolves to LTR, so `text-start` aligned it to the content's left — away from the
icon, which follows the UI direction (right under RTL).

The correction gates alignment on the **UI** direction instead: `rtl:text-right`
keys off the root `dir="rtl"`, pinning wrapped lines to the icon side under RTL
regardless of the name's script, while LTR keeps the default start alignment (kept
`text-start` as the LTR/base). The text still carries `dir="auto"` for correct
per-name script rendering. Final class: `text-start rtl:text-right`.

Applied at the shared `EntityTag` level, so it covers both the party tag and the
recursive parent (alliance) tag everywhere they render.

## Verification

- `yarn workspace @openvaa/frontend lint:check` — clean for all touched files
  (the one remaining error is in `+layout.svelte`, a pre-existing uncommitted
  local change unrelated to this task).
- Pre-commit hooks (prettier + eslint) passed on both commits.
- Visual RTL confirmation by the user during their next QA pass is the final gate.

## Out of scope / untouched

`docker-compose.dev.yml` and `frontend/src/routes/[[lang=locale]]/+layout.svelte`
had pre-existing uncommitted local changes at task start; left as-is.
