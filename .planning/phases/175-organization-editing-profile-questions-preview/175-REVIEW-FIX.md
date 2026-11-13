---
phase: 175-organization-editing-profile-questions-preview
step: review-fix
batch: review-fix-B
findings_fixed: [IN-06]
findings_out_of_scope: [all others in 175-REVIEW.md]
base: 19374478c
gates: tests/e2e-runs/179-gates/review-fix-B-r3
e2e_close: tests/e2e-runs/179-e2e/review-fix-B-r2
status: complete
---

# Phase 175 review fix: IN-06

Fixed in review-fix batch B, with phases 173, 176 and 177. The other findings of `175-REVIEW.md` were not in this batch.

## IN-06: `questionsReady` stays false for good when a nominated election is missing from the data root

**Disposition:** fixed, once, as 176 IN-01. The full record is in `176-REVIEW-FIX.md`.

**Verified:** `dr.getElection` threw for an id that is not loaded, the catch set the selected elections to `[]`, and the rollup wrote `questionsReady` false, so the task state of an entity with a nomination was never known.

**Red** (c32a3c9fa): `contestantContext.svelte.test.ts`, **exit 1**, 2 of 114 failed.

**Fix** (267bb8254): the review's first remedy, "skip the elections that cannot be resolved instead of emptying the list", for the elections and the constituencies alike, each skipped id logged. Where none of an entity's nominations names an election the data root holds, the entity is asked no question and `questionsReady` is true with empty lists, as the server's preview gate reads it.

**Green:** vitest over `src/lib/contexts`, `src/lib/contestant` and the contestant routes **exit 0**, 2812 passed.

## Gates and E2E close of batch B

- **Gate set `review-fix-B`**, on 444778c0e: 20 of 22 rows exit 0. `lint` and `unit` were red for one cause: the new adapter source `utils/rpcAnswer.ts` was in neither list of `assert-project-scoped-queries.mjs` (the guard itself, and dev-seed `projectScopingGate.test.ts`); fixed in a633bf167. Before the second run, WR-01 of phase 177 was narrowed to new and moved nominations (3ca2fa7bf red, 456b5ee17 fix, migration `00007`).
- **Gate set `review-fix-B-r2`**, on 456b5ee17: all 22 rows exit **0**; `179-verdict gates review-fix-B`: **PASS**, no Sleep entry in the window.
- The stack was restarted (`yarn db:stop && yarn db:start` through the key filter, exit 0; the edge runtime up) before the E2E.
- **E2E close `review-fix-B`**, on 456b5ee17, under `caffeinate`: **red, not void** (no Sleep entry, no void marker): 2 failed, 383 did not run, 228 passed of 613. The two failures were `contestant-entity-selection`'s draft tests: its fixture read a draft at `<stem>-<type>-<id>`, the key form before 173 WR-01 added the user; the 383 are the perm chain anchored on that project. Fixed in the fixture (a9f7c2511), which finds the one key that ends `-<type>-<id>`.
- **E2E close `review-fix-B-r2`**, on a9f7c2511, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects, 16.2 min. Wrapper exit 0, the restore ran (`db:stop`, `db:start`, edge runtime running). Not void; `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-B --same-projects-as review-fix-A`: **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0.
- **Gate set `review-fix-B-r3`**, on a9f7c2511, the tree the E2E close ran on: all 22 rows exit **0**; `179-verdict gates review-fix-B`: **PASS**, not stale, no Sleep entry in the window. This is the gate verdict of record for batch B.
- `yarn db:seed:default` exit 0 afterwards.


---

# Review-fix batch C: WR-02, WR-03, WR-04, IN-01, IN-02, IN-03, IN-04, IN-05

Fixed in review-fix batch C (base e93f172bb), with phases 170, 171, 172, 174.1 and 179. The batch's gate set and E2E close are given at the end of this section. WR-01 was not in this batch: it is the operator's. IN-06 was fixed in batch B.

| Finding | Disposition | Commits |
| --- | --- | --- |
| WR-02 | fixed | 8ef916f5b (red), b9321736c (fix) |
| WR-03 | fixed: dead branches removed | 3a93612a4 |
| WR-04 | fixed | 07f7a289b (red), fdfc20fe3 (fix) |
| IN-01 | fixed, documentation | 4076471ba |
| IN-02 | fixed | fcacd8488 (red), b3fca93a2 (refactor) |
| IN-03 | fixed | 65a161c57 |
| IN-04 | no change needed | none |
| IN-05 | fixed | 8b6bba9b8 (red), 99dacd267 (fix) |

## WR-02: a stored colour with no default-theme colour is no colour

**Verified.** `validate_entity_color` accepts an empty object, `{ dark }` alone and `normal: null`. The client's `StoredColorSchema` required `normal`, so every read of such a row logged an error, `_getEntityUserData` handed the raw object to the store, and `comparableColor` threw a `TypeError` out of `setProperty` when the colour was edited.

**One shape.** The database's rule is kept (a trigger change would refuse values seeds or admins may hold); the client reads an object with no default-theme colour as no colour.

**Red** (8ef916f5b): vitest over the store, `parseJsonbColumn` and the data writer: **exit 1**, 8 of 356 failed (staging over the three stored forms threw; `parseColorColumn` reported each as malformed; `getEntityUserData` handed `{ dark }` and `'red'` on unparsed).

**Fix** (b9321736c):
- `parseColorColumn` accepts `normal` as nullish and answers `absent`, with no record, for a value with no default-theme colour; a `normal` that is no colour is still `malformed` with nothing preserved.
- `comparableColor` reads a colour without a string `normal` as no colour.
- `_getEntityUserData` parses the colour with `parseColorColumn`, as the read-back after a write does.
- The `getUserEntities` case that counted `{ dark }` alone as malformed now asserts it is no colour and reports nothing.

**Green:** vitest over `src/lib/contexts` and `src/lib/api`: **exit 0**, 1652 passed; `svelte-check`: 0 errors.

## WR-03: the property writer's unreachable image branches are gone

The `image === null` branch (clear the column) and the `image.url` branch (write the application `Image`, a `data:` URL for a picked file, into a `StoredImage` column) could not run behind `updateEntityProperties`' guard, and the select-only read-back ran only for a `file` that is not a `File`. All three are removed: an image is uploaded and its path stored, and an image whose file is not a `File` is refused before anything is uploaded or written. Clearing an image stays unsupported; adding it is a feature, not this fix. The two cases of the removed read-back became one refusal case (3a93612a4). No red: the branches were unreachable through the public method. **Green:** vitest over the data writer and the contestant contexts: **exit 0**, 455 passed.

## WR-04: what a save stored is unstaged before its next write

**Red** (07f7a289b): `contestantUserDataState.svelte.test.ts`: **exit 1**, 1 of 76 failed; after the logo and colour write was stored and the name write rejected, the logo and the colour stayed staged and the next save uploaded the logo again.

**Fix** (fdfc20fe3): each write's properties are unstaged as soon as its result is merged. The rejection still carries on, so the page reports the save as failed and does not re-read the entity list; the partial result the review offers as its second option would need a new page outcome and message. The case that pinned "keeps everything staged" after such a partial save (written with 175-07, no recorded decision behind it) now asserts that the names and the answers draft stay staged and the stored properties do not.

**Green:** vitest over the contestant contexts and routes: **exit 0**, 1295 passed.

## IN-01: an editor's colour replaces both theme colours, documented

Keeping the stored `dark` would reverse D-04 ("The user picks one colour, stored as `normal`; the dark-theme colour is derived on read"). The review's other option was taken (4076471ba): the developers' page on entity selection and the publishers' guide page on final election list data say that an editor's colour replaces the stored dark-theme colour. The in-app info line was not changed: it is a string in seven locales.

## IN-02: one colour normalisation

**Red** (fcacd8488): `toHexColor.test.ts`: **exit 1**, the module did not exist.

**Refactor** (b3fca93a2): `$lib/utils/color/toHexColor.ts` holds `toHexColor` and `HEX_COLOR`; `Input`, `storedColorOf`, `comparableColor` and `ensureColors` use them, and each site still checks its own accepted form first. The helper refuses a functional `rgb()` channel above 255, which `rgbToHex` would carry into the next channel (`rgb(300, 0, 0)` became `#2c0000`). **Green:** vitest over the colour utilities, `Input`, the data writer and the contestant contexts: **exit 0**, 680 passed.

## IN-03: names by locale are read by a fact of their own

`LOCALIZED_NAME_TYPES` says which served types have localized name columns, and `_getEntityUserData` asks it instead of the write-permission map (65a161c57). No behaviour change, so no red. **Green:** the data writer **exit 0**, 266 passed.

## IN-04: no change needed

**Verified not real.** `getLocalized` (`packages/app-shared/src/data/getLocalized.ts`) is typed `string | null` and returns `null` for a nullish or non-object value and when no locale holds a string; it never returns `undefined`. So `saved.shortName` is `null` for a short name no locale holds, as `SavedEntityProps.shortName` says. The existing case "stores a short name with no entry left as null" asserts `properties: { shortName: null }`. Nothing was changed.

## IN-05: the colour picker is described and marked invalid

**Red** (8b6bba9b8): `Input.color.svelte.test.ts`: **exit 1**, 5 of 44 failed; the picker carried neither `aria-describedby` nor `aria-invalid`.

**Fix** (99dacd267): the picker carries the field's `aria-describedby` and `aria-invalid`. **Green:** vitest over `src/lib/components/input`: **exit 0**, 170 passed.

## Gates and E2E close of batch C

- **Gate set `review-fix-C`**, on a756755c0: all 22 rows exit **0** on the first run (unit: frontend 6544 passed and 33 skipped, dev-seed 1210 passed; pgTAP 51 files and 2699 tests, PASS; integration 208 passed; schema equivalence equal). `179-verdict gates review-fix-C`: **PASS**, not stale (a756755c0 is tree-equal to HEAD outside `.planning/`), no Sleep entry in the window. This is the gate verdict of record for batch C, on the tree the E2E close ran on.
- The stack was restarted before the E2E run (`yarn db:stop && yarn db:start` through the key filter, exit 0; `supabase_edge_runtime_openvaa-local` Up).
- **E2E close `review-fix-C`**, on a756755c0, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects, 15.6 min. Wrapper exit 0, `restore: ok`. Not void; `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-C --same-projects-as review-fix-B-r2`: **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0 (the batch adds assertions to existing tests, not tests).
- A control run for 174.1 WR-01, on a756755c0 with the protected layout's focus call removed: `tests/e2e-runs/179-controls/review-fix-C-174.1-wr01-unfixed`, `--project contestant-journey`, exit 1, the new focus step failed; see `174.1-REVIEW-FIX.md`.
- `yarn db:seed:default` exit 0 afterwards. `179-verdict hygiene`: PASS.
