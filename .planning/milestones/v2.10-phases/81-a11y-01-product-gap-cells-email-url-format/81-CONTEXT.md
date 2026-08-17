# Phase 81: A11Y-01 PRODUCT-GAP Cells — Email + URL Format - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the 2 PRODUCT-GAP cells in `.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md` that Phase 76 deferred — A11Y-05 (email-format) + A11Y-06 (URL-format) — by:

1. **Schema** — exercise the EXISTING `Question.subtype` dispatch on text-typed info questions. `subtype === 'link'` (URL dispatch) is already consumed at `apps/frontend/src/lib/components/input/QuestionInput.svelte:65` + `apps/frontend/src/lib/components/infoAnswer/InfoAnswer.svelte:65,79`; Phase 81 adds `subtype === 'email'` as the parallel dispatch value for email-format validation.
2. **Component** — extend `apps/frontend/src/lib/components/input/Input.svelte` `handleChange` with an `else if (type === 'email')` branch mirroring the URL branch at lines 286-296 (regex check → `handleError('components.input.error.invalidEmail')` on fail → bad value preserved by returning BEFORE the `value =` assignment). Add `'email'` to the `Input.type.ts` `InputProps['type']` discriminated union.
3. **Dispatch** — extend `QuestionInput.svelte:63-75` `$derived.by` block with one additional line parallel to the existing `'link' → 'url'` mapping: `if (question.type === QUESTION_TYPE.Text && question.subtype === 'email') t = 'email';`.
4. **i18n** — add the NEW `components.input.error.invalidEmail` key to all 4 locales (en/fi/sv/da `messages/*/components.json`); English string default `"The email address is not valid."` mirrors the existing `invalidUrl` shape `"The URL is not valid."`.
5. **e2e fixture** — at `packages/dev-seed/src/templates/e2e.ts`: (a) RETROFIT the existing sort-21 `test-question-social-1` info question with `subtype: 'link'` so the URL dispatch path becomes REACHABLE in the candidate-profile fixture (Alpha's existing `https://example.com/sentinel-76` answer remains valid; no seed conflict); (b) ADD a NEW sort-23 `test-question-email-1` info question with `subtype: 'email'` + Alpha answer (disjoint from 'alpha' substring per the e2e.ts:753-762 value-disjointness invariant). Sort 22 (`test-question-number-1`, Phase 77 SETTINGS-01 NumberFilter anchor) is NOT touched.
6. **Spec** — extend `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` with 2 new cells under the existing `A11Y-01 candidate profile validation` describe: cell 5 (email-format rejection — types a bad email → asserts `invalidEmail` error visible + value preserved) + cell 6 (URL-format rejection — types a bad URL on the now-retrofitted social-link → asserts `invalidUrl` error visible + value preserved). Pattern mirrors the existing Phase 76 P01 cells 1-3 (image-type / image-size / name-too-long): `loginAsCandidate(page)` → `page.goto(CandAppProfile)` → settle on profile heading → `getByLabel(/question name regex/i)` → `fill(bad value)` → assert.

After Phase 81: the candidate profile route has end-to-end email + URL format-rejection coverage that exercises validation paths reachable from REAL candidate-profile editable info questions. The 5 first-run a11y violations resolved in Phase 80 stay green; the Phase 76 P01 cells 1-3 + Phase 76 P02 reload-persistence anchors continue to pass; Phase 79 v2.10 verification anchor at SHA `ff0334f856…` (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE) holds.

Phase 81 is validation-surface extension on existing rendering paths — NOT new product behavior, NOT framework migration, NOT UI redesign. Component changes are additive (new `'email'` branch in Input.svelte + new `'email'` discriminant in `Input.type.ts` + 1 new line in QuestionInput.svelte dispatch); schema changes are convention-by-string-value (no migration, no type changes — `Question.subtype` is already DB-typed `text | null` with no CHECK constraint); i18n changes are 1 new key per locale. Verification MUST confirm the Phase 79 v2.10 anchor holds through these changes; new test additions (+2 PASS_LOCKED entries expected) MAY require constants regen via Phase 79 P03 path.

Phase 81 is structurally independent of Phase 80 (disjoint code surfaces: navigation a11y vs. form validation). Phase 79 (DETERM-04 green) is a HARD prerequisite — A11Y-01 cells extend `candidate-profile-validation.spec.ts` which was cascade-blocked pre-79.

</domain>

<decisions>
## Implementation Decisions

### Schema dispatch mechanism

- **D-01 — Reuse the EXISTING `Question.subtype` field (NOT a new `customData.format` enum).** `Question.subtype` is already wired end-to-end TODAY: the `questions.subtype` DB column exists (`packages/supabase-types/src/database.ts:964/991/1018`, `text | null`, no CHECK constraint); `DataObject.subtype` getter at `packages/data/src/core/dataObject.ts:96-98` surfaces it on every Question instance via inheritance; consumers already dispatch on it at `apps/frontend/src/lib/components/input/QuestionInput.svelte:65` (`subtype === 'link'` → 'url') and `apps/frontend/src/lib/components/infoAnswer/InfoAnswer.svelte:65,79` (`'link'` + `'linkList'`). The `customData.format` alternative would require: (a) a new field on `CustomData.Question` in `packages/app-shared/src/data/customData.type.ts:22-83`; (b) consumer updates across QuestionInput + InfoAnswer; (c) a divergent dispatch path duplicating a concept the codebase already has. **REJECTED:** "new `customData.format` enum" (duplicates `subtype`); "hybrid (subtype keeps 'link', customData.format takes 'email')" (ships two divergent mechanisms for the same concept, guaranteed consolidation work later). The ROADMAP's phrasing "restored `Question.subtype` field" is a minor misnomer — `subtype` was never removed; it is the canonical mechanism already.

- **D-02 — `subtype` value for email dispatch is `'email'`.** Short, single-word, lowercase — parallel to the existing `'link'` / `'linkList'` family at `InfoAnswer.svelte:65,79`. Reads naturally as a sibling of `'link'`. **REJECTED:** `'emailAddress'` (breaks the short-string convention); `'mailto'` (the URL-family conventions don't say `'http'`; `'mailto'` is less self-documenting in dispatch reads like `subtype === 'mailto'`).

- **D-03 — `subtype` value for the URL retrofit is `'link'`.** Reuse the EXISTING dispatch value the codebase already understands. `QuestionInput.svelte:65` reads `subtype === 'link'` to set `t = 'url'` TODAY. The retrofit just sets the field on the existing sort-21 row; no dispatch code change for URL.

- **D-04 — `QuestionInput.svelte` dispatch extension is a single new line.** Concrete change at lines 63-75:

  ```svelte
  const type = $derived.by<InputProps['type']>(() => {
      let t = INPUT_TYPES[question.type];
      if (question.type === QUESTION_TYPE.Text && question.subtype === 'link') t = 'url';
      // NEW: parallel dispatch for email format. Lines below leave 'url' / 'email' alone:
      //   - customData.longText only re-maps 'text' / 'text-multilingual'.
      //   - !disableMultilingual only re-maps 'text' / 'textarea'.
      // 'email' is never re-mapped by those blocks; it falls through as-is.
      if (question.type === QUESTION_TYPE.Text && question.subtype === 'email') t = 'email';
      // ...existing longText + multilingual blocks unchanged
      return t;
    });
  ```

  Order matters but is safe: the `longText` + `!disableMultilingual` blocks below this line only re-map `'text'` / `'textarea'` / `'text-multilingual'` / `'textarea-multilingual'` (per current code at QuestionInput.svelte:66-73) — `'email'` and `'url'` both fall through unchanged. No `INPUT_TYPES` map change needed (dispatch is inline, parallel to the `'link' → 'url'` line).

### Email validation strategy

- **D-05 — Programmatic regex inside `Input.svelte` `handleChange` (NOT HTML5 native `type="email"`).** Mirror the URL validation surface at `apps/frontend/src/lib/components/input/Input.svelte:286-296` byte-for-byte in structure. Concrete change:

  ```svelte
  } else if (type === 'url') {
    // existing URL branch at 286-296 — unchanged
  } else if (type === 'email') {
    // NEW: parallel email branch. Mirrors URL's preserve-on-fail contract.
    const currentValue = currentTarget.value.trim();
    if (currentValue === '') {
      value = '';
    } else {
      if (!EMAIL_REGEX.test(currentValue)) return handleError('components.input.error.invalidEmail');
      value = currentValue;
    }
  } else {
    value = currentTarget.value;
  }
  ```

  The `return` BEFORE the `value =` assignment is the value-preservation contract — same as the URL branch's `return undefined` shape. The `error = undefined;` reset on line 301 keeps the error-clearing behavior consistent. **REJECTED:** HTML5 `<input type="email">` + `validity.typeMismatch` ("foo@bar" is technically valid per the HTML5 spec — too lax for VAA candidate emails; UX diverges from the URL programmatic-check path; cross-UA validity quirks). **REJECTED:** "both HTML5 input type + programmatic" (more code; the programmatic check covers the contract; mobile-keyboard UX is a nice-to-have — `Input.svelte` text-input render at line 441 currently emits `<input type="text">` for the text branch; Phase 81 keeps that DOM shape unchanged — the dispatched `'email'` type only drives the validation branch, not the DOM `type` attribute).

- **D-06 — Email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (pragmatic shape).** Rejects `foo` / `foo@bar` / `foo @bar.co` / `foo@bar .co`; accepts `a@b.co` / `name+tag@example.org` / Unicode locals like `ä@b.co`. Mirrors `checkUrl`'s "pragmatic catches the obvious typos, server-side does final validation" philosophy. **REJECTED:** "HTML5 spec regex (WHATWG verbatim)" (longer, RFC-aligned but maintenance cost for marginal correctness gain); "allow `a@b` (no domain dot)" (looser; not appropriate for a public-facing VAA). Constant location: planner's call (Claude's Discretion) — likely a top-of-file `const EMAIL_REGEX = /.../;` inside `Input.svelte` `<script>` block, parallel to how `checkUrl` is imported from `$lib/utils/links`. If the regex feels heavy enough to extract, planner MAY add `export function checkEmail(email: string): string | undefined` to `apps/frontend/src/lib/utils/links.ts` (it's actually about input format checks, not just links — name TBD by planner; OR add to a new `apps/frontend/src/lib/utils/email.ts` to keep `links.ts` URL-scoped). Default: inline regex in `Input.svelte`.

### e2e fixture extension

- **D-07 — Retrofit sort-21 `test-question-social-1` IN-PLACE with `subtype: 'link'`.** The existing sort-21 row at `packages/dev-seed/src/templates/e2e.ts:621-630` has NO `subtype` field today (see the comment block at lines 617-620: "PRODUCT-GAP-PARTIAL: url-format validation deferred"). Phase 81 adds `subtype: 'link'`. Effect: `QuestionInput.svelte:65` dispatch becomes reachable on this row → the candidate-profile field at the social-link question now renders as `<input type='url'>` (or rather as the 'url' branch in `Input.svelte`) and is subject to the URL validation at lines 286-296. Alpha's existing answer `'test-question-social-1': { value: { en: 'https://example.com/sentinel-76' } }` at e2e.ts:767 remains a VALID URL — the seed pipeline does NOT run candidate-profile validation against pre-seeded answers (validation runs only via `Input.svelte handleChange` on user input). So no fixture conflict. **REJECTED:** "two all-new rows at sort 23 (URL) + sort 24 (email)" (leaves sort-21 social-link still unreachable for URL dispatch — latent gap perpetuates the PRODUCT-GAP-PARTIAL state Phase 76 P02 explicitly flagged); "renumber sort 22 NumberFilter to sort 24" (invasive cross-phase change; touches Phase 77 SETTINGS-01 anchor + voter-fixture sort-order references for cosmetic ROADMAP alignment to the literal "sort 22" hint).

- **D-08 — NEW sort-23 `test-question-email-1` info question.** Concrete shape (planner refines exact text at PLAN.md time):

  ```typescript
  // After sort-22 test-question-number-1 (Phase 77 SETTINGS-01 NumberFilter anchor).
  // Phase 81 A11Y-05 anchor — email-format dispatch via Question.subtype='email'.
  // QuestionInput.svelte dispatches subtype==='email' → 'email' input type, which
  // routes through Input.svelte's new email validation branch (mirrors the URL
  // branch at Input.svelte:286-296 — pragmatic regex check + handleError on fail
  // + value-preservation by returning before value=assignment).
  //
  // VALUE-DISJOINTNESS INVARIANT (Phase 76 P01 fixture-extension fix):
  // Alpha's answer value MUST NOT contain the substring 'Alpha' / 'alpha'
  // (case-insensitive). The candidate-questions.spec.ts CAND-06 assertion at
  // line 271 reads strict-mode getByText('Alpha', { exact: false }) — adding
  // a cell whose preview-rendered value contains 'alpha' would break that
  // single-anchor lookup. Sentinel-style value below stays disjoint.
  //
  // sort_order: 23 — placed AFTER Phase 77's test-question-number-1 (sort 22).
  // Voter fixture's default voterAnswerCount=16 Likert loop is unaffected:
  // sort 23 > 16, voter never encounters this info question.
  {
    external_id: 'test-question-email-1',
    type: 'text',
    subtype: 'email',
    name: { en: 'Email address (Phase 81 A11Y-05 anchor)' },
    category: { external_id: 'test-category-info' },
    allow_open: false,
    required: false,
    sort_order: 23,
    is_generated: false
  }
  ```

  Alpha answer cell: `'test-question-email-1': { value: { en: 'sentinel-81@example.com' } }` (added at `e2e.ts:772` Alpha `answersByExternalId` block, parallel to the existing `test-question-number-1` answer at line 772). The sentinel-style value is disjoint from 'alpha' substring per the value-disjointness invariant.

- **D-09 — Sort-21 retrofit value-shape change.** The existing sort-21 row at e2e.ts:621-630 gains a single new field. Concrete change:

  ```typescript
  // BEFORE (e2e.ts:621-630)
  {
    external_id: 'test-question-social-1',
    type: 'text',
    name: { en: 'Social link (Phase 76 anchor)' },
    category: { external_id: 'test-category-info' },
    allow_open: false,
    required: false,
    sort_order: 21,
    is_generated: false
  },

  // AFTER (Phase 81 — adds subtype:'link' for URL dispatch reachability)
  {
    external_id: 'test-question-social-1',
    type: 'text',
    subtype: 'link', // Phase 81 — enables URL dispatch via QuestionInput.svelte:65
    name: { en: 'Social link (Phase 76 anchor)' },
    category: { external_id: 'test-category-info' },
    allow_open: false,
    required: false,
    sort_order: 21,
    is_generated: false
  },
  ```

  The comment block at e2e.ts:617-620 should be updated by the planner to note "Phase 81 lifts the PRODUCT-GAP-PARTIAL to FULL via subtype:'link' dispatch" — preserving the historical context. The DB seed pipeline serializes the `subtype` field via the existing `packages/dev-seed/src/writer.ts` path (no writer change expected — `subtype` is part of the question Insert shape per `packages/supabase-types/src/database.ts:991`; if a writer-side change IS required, that's a single-line addition the planner picks up at PLAN.md authoring time).

### i18n key additions

- **D-10 — Add NEW `components.input.error.invalidEmail` key to all 4 locales.** Phase 80 D-05 (B) reused an EXISTING key (`common.closeDialog`); Phase 81 ADDS a new key — `components.input.error.invalidEmail` did not exist pre-Phase-81 (verified: only `invalidFile`, `oversizeFile`, `fileLoadingError`, `invalidUrl` exist at `apps/frontend/messages/en/components.json:17-22`). Concrete addition (planner picks the exact translations; English default below):

  ```json
  // apps/frontend/messages/en/components.json (insert in input.error block)
  "invalidEmail": "The email address is not valid.",
  ```

  Mirror in `fi/sv/da/components.json`. Localized strings are planner / translation-step responsibility (Claude's Discretion) — defaults the planner MAY use:
  - en: `"The email address is not valid."` (mirrors `invalidUrl`'s shape)
  - fi: `"Sähköpostiosoite ei kelpaa."` (mirrors the Finnish `invalidUrl` shape)
  - sv: `"E-postadressen är ogiltig."` (mirrors the Swedish `invalidUrl` shape)
  - da: `"E-mailadressen er ugyldig."` (mirrors the Danish `invalidUrl` shape)

  Per Phase 78 / CLEAN-04 the i18n wrapper enforces `TranslationKey` typing — adding the key to all 4 locales is required to type-check `t('components.input.error.invalidEmail')`. If the planner observes a missing key in any locale at PLAN.md time, that's a blocker (must add before the spec assertion can compile).

### Spec extension at candidate-profile-validation.spec.ts

- **D-11 — Add 2 new cells (5 + 6) under the existing `A11Y-01 candidate profile validation` describe.** Mirror the Phase 76 P01 cell-3 (name-too-long) pattern at `tests/tests/specs/candidate/candidate-profile-validation.spec.ts:213-247` byte-for-byte in structure: `loginAsCandidate(page)` → `page.goto(CandAppProfile)` → settle on profile heading at line 218-220 → `getByLabel(/question name regex/i)` → fill bad value → assert error UI + value preservation. Concrete cell shapes:

  ```typescript
  // Add to TEXT_CELLS array (currently at lines 112-119)
  const TEXT_CELLS = [
    {
      name: 'name-too-long caps input value at maxlength=50 on display-name',
      // existing cell 3 from Phase 76 — unchanged
    },
    {
      // NEW — Phase 81 cell 5
      name: 'A11Y-05 email-format rejection surfaces invalidEmail error',
      fieldLabel: /Email address \(Phase 81 A11Y-05 anchor\)/i,
      badValue: 'not-an-email',
      expectedErrorText: /The email address is not valid/i,
      kind: 'email-format'
    },
    {
      // NEW — Phase 81 cell 6
      name: 'A11Y-06 url-format rejection surfaces invalidUrl error',
      fieldLabel: /Social link \(Phase 76 anchor\)/i,
      badValue: 'not a url',
      expectedErrorText: /The URL is not valid/i,
      kind: 'url-format'
    }
  ] as const;
  ```

  The existing `for (const cell of TEXT_CELLS)` loop at line 213-247 needs a slight refactor to accommodate the new `kind` discriminant: the `maxlength` cell's HTML5-cap-only contract (assert value caps + no error UI) is different from the new `'email-format'` / `'url-format'` cells (assert error UI visible + value preserved as-typed). Planner picks the exact refactor shape (two parallel `for` loops by `kind`, OR a single loop with a `kind`-discriminated branch). Default: two parallel loops to keep the existing cell-3 contract isolated.

  Test-title prefix MUST stay `A11Y-01 ` (matches the existing cells) — but cells 5 / 6 carry the requirement-ID infix `A11Y-05` / `A11Y-06` in the name string for traceability (per the Phase 75 / Phase 76 D-04 scope-marked filename pattern, here applied to test-title scope-marking).

- **D-12 — IMGPROXY_TIED_TITLES safety.** Same as Phase 80 D-13 — Phase 81's new test titles MUST NOT end with any of the 14 bound patterns at `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs:64-78`. Verified at CONTEXT authoring: titles `A11Y-05 email-format rejection surfaces invalidEmail error` + `A11Y-06 url-format rejection surfaces invalidUrl error` do NOT match any IMGPROXY_TIED_TITLES entry (the bound list is entity-image-upload-related, e.g., `should upload a profile image`, `should update a profile image`, etc.). Planner re-verifies at PLAN.md authoring time.

### Determinism + parity considerations

- **D-13 — Inherit Phase 80 D-09 / D-11 determinism contract:** 3-run cold-start `--workers=1` verification at Plan 01 close (mandatory per Phase 73 P06 + Phase 76 D-09 + Phase 80 D-09); vite-cache wipe before the 3-run gate (`yarn db:reset && yarn db:seed --template e2e && yarn dev:clean` per Phase 78 CLEAN-01 + Phase 80 D-11). Per the Yarn arg-forwarding caveat in CLAUDE.md, the chained-form `yarn db:reset-with-data --likert-only` does NOT forward `--likert-only` — Phase 81's verification uses the canonical 3-command chain (Phase 81 is NOT a Likert-only run; the e2e template's non-ordinal opinion questions are not in the assertion path of `candidate-profile-validation.spec.ts`, so the default e2e template seed is correct).

- **D-14 — Phase 79 v2.10 anchor at SHA `ff0334f856…` MUST hold through Phase 81 changes.** The anchor at Phase 79 close was 80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE (per `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-VERIFICATION.md`). Phase 80 closed yesterday (2026-05-13) with the anchor preserved (per `.planning/phases/80-a11y-axe-cite-and-fix/80-VERIFICATION.md`). Phase 81 expects +2 new PASS_LOCKED entries (the 2 new cells) — these are NET ADDITIONS, not transitions of existing tests between pools. If 3-run cold-start surfaces ANY PRE-EXISTING test transitioning between PASS_LOCKED / DATA_RACE / CASCADE pools, parity-script constants regen is required via the Phase 79 P03 path (`regen-constants.mjs` OR in-place edit at `tests/scripts/diff-playwright-reports.ts`).

- **D-15 — Parity-script self-identity smoke (D-12 from Phase 80) inherited.** Run `npx tsx tests/scripts/diff-playwright-reports.ts | diff <expected-template> -` at HEAD-pre-changes; re-run post-fix to confirm constants regen is not required (or to surface the new +2 PASS_LOCKED additions which would require an additive constants update — Plan 01 close should fold this in if needed).

- **D-16 — IMGPROXY_TIED_TITLES list NOT touched.** Per `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:11-32` (Phase 80 D-13 inheritance) — the 15-entry DATA_RACE pool remains structurally bound. Phase 81's surface (Input.svelte email branch + QuestionInput.svelte:65 +1 line + Input.type.ts +1 union member + 2 fixture rows + 2 spec cells) does NOT collide with the entity-image-upload paths.

### UI spec skip (memory precedent)

- **D-17 — Skip `/gsd-ui-phase` auto-spawn.** Per `feedback_skip_ui_spec_for_a11y_only_phases.md` memory precedent (Phase 76 + Phase 80 precedent): structural a11y / cite-and-fix / validation-extension phases with no visual redesign skip the UI-SPEC auto-spawn step. Phase 81 is a validation-surface extension on existing rendering paths — the `<input>` DOM shape, label, error message rendering, and overall layout are UNCHANGED. The only user-visible new behavior is: (a) typing a bad email/URL surfaces an inline error message (using existing error UI at `Input.svelte` error-render path); (b) the social-link field starts performing URL validation (it didn't before; the field was rendered as plain text). No new components, no new styles, no new accessibility patterns to design. Phase 80 confirmed this precedent; Phase 81 follows.

### Plan grouping / sequence (Claude's Discretion — user did not select this gray area)

- **D-18 — Default: 1 bundled plan; planner may split into 2 if scope exceeds per-plan ceiling.** User did not select "Plan grouping / split" as a gray area — defaulting to the cite-and-fix-todo recommendation (`.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md` §"Estimated effort" — single plan covers both email + URL). Concrete default:

  - **Plan 01 — Schema dispatch extension + Input.svelte email branch + i18n key + e2e fixture extension + spec cells 5 + 6 + verification gate.** All changes bundled into a single plan because:
    1. The spec assertion gate FAILS until all 5 component changes land (dispatch + Input.svelte branch + i18n key + fixture rows + spec cells). Splitting creates a dependency chain.
    2. Email + URL share the dispatch mechanism (`Question.subtype`) — they are NOT independent surfaces.
    3. Total LOC budget: ~100 LOC across ~6 files (Input.svelte ~10 lines + Input.type.ts ~2 lines + QuestionInput.svelte +1 line + 4 × locale JSON +1 line each + e2e.ts ~30 lines for 2 rows + 1 retrofit + 1 Alpha answer + spec ~50 lines for 2 cells + refactor). Tightly coupled, small change set.

  Planner MAY split into 2 plans if PLAN.md authoring surfaces scope concerns (e.g., if the Input.svelte refactor to accommodate a shared validator helper turns out to need scaffolding). Default: 1 plan.

### Locator + lint convention

- **D-19 — Inherits Phase 80 D-14 / Phase 76 D-11a / Phase 75 D-06 / Phase 73 IN-03.** Role/aria locators by default; NO new test-id additions expected — the existing testIds registry covers everything Phase 81 needs (the new cells use `page.getByLabel(...)` per Phase 76 P01 cell-3 precedent, not testIds). `playwright/no-raw-locators` lint rule at `'error'` is non-negotiable; the modified spec MUST pass `yarn lint:check`.

### Claude's Discretion

- **Email regex extraction shape** (D-06 location): inline `const EMAIL_REGEX = /.../;` in `Input.svelte` `<script>` block (default), OR extract to `apps/frontend/src/lib/utils/email.ts` (or add `checkEmail` to `links.ts` — its name suggests link-only scope, so a sibling util is cleaner). Planner picks at PLAN.md time.
- **i18n string translations** (D-10): English default `"The email address is not valid."` mirrors `invalidUrl`. Finnish/Swedish/Danish translations follow native conventions — planner may copy from existing translation resources in the repo (the `invalidUrl` row in each locale is the closest reference) or defer to a translation pass.
- **Spec refactor shape** (D-11): the existing `for (const cell of TEXT_CELLS)` loop assumes a single contract (HTML5 maxlength cap). Phase 81 adds 2 cells with a different contract (error UI surface + value preserved). Default: 2 parallel loops by `kind` discriminant. Planner may pick a single loop with branch-by-kind if the LOC overhead is small.
- **Plan count** (D-18): default 1 bundled plan; planner may split into 2 if scope exceeds per-plan ceiling.
- **dev-seed writer subtype passthrough**: `packages/dev-seed/src/writer.ts` is expected to already serialize `subtype` to the DB (the column exists; the Insert shape includes it per `packages/supabase-types/src/database.ts:991`). If the writer's question-insert path explicitly omits `subtype` today (planner verifies at PLAN.md authoring time), a single-line addition lands in the same Plan 01.
- **Comment update on sort-21 row** (D-09): the existing comment block at `e2e.ts:617-620` mentions "PRODUCT-GAP-PARTIAL: url-format validation deferred". Phase 81 SHOULD update that comment to note "Phase 81 lifts the PRODUCT-GAP-PARTIAL to FULL via `subtype:'link'` dispatch" — preserves the historical narrative.
- **Test title `A11Y-05` / `A11Y-06` infix**: cells 5 + 6 use `A11Y-01 A11Y-05 ...` / `A11Y-01 A11Y-06 ...` — the `A11Y-01` prefix groups them under the validation-cells describe; the `A11Y-05` / `A11Y-06` infix marks the closed requirement IDs. Planner may simplify to just `A11Y-05 ...` / `A11Y-06 ...` if the prefix duplication reads heavy. Default: keep `A11Y-01 ` prefix for grouping consistency with the existing 3 cells.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 81 anchors (REQUIREMENTS / ROADMAP / STATE / PROJECT)

- `.planning/REQUIREMENTS.md` §A11Y-05 + §A11Y-06 — locked success criteria for the 2 PRODUCT-GAP cells; the per-requirement-ID contract.
- `.planning/ROADMAP.md` §"Phase 81: A11Y-01 PRODUCT-GAP Cells — Email + URL Format" — phase goal + dependencies + 5 success criteria + UI hint (yes, but skipped per D-17).
- `.planning/STATE.md` — v2.10 milestone state; Phase 80 closed 2026-05-13; Phase 81 ready to plan.
- `.planning/PROJECT.md` §"Current Milestone: v2.10" — milestone framing + 5-phase shape.
- `.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md` — original PRODUCT-GAP scope document (filed at Phase 76 P02 close); per-cell effort sizing. Phase 81 IS this todo's email + URL resolution (cells 5 + 6); Phase 82 resolves cell 4 (required-empty).

### Phase 76 PRODUCT-GAP origin + persistence anchors

- `.planning/milestones/v2.9-phases/76-profile-a11y/76-CONTEXT.md` D-03 PRODUCT-GAP path + RESEARCH LANDMINE-2 — origin of the deferral; Phase 81 lifts the deferral.
- `.planning/milestones/v2.9-phases/76-profile-a11y/76-A11Y-BASELINE.md` — Phase 76 baseline (PRESERVED as Phase 80 D-07 cross-link target).
- `.planning/milestones/v2.9-phases/76-profile-a11y/76-02-PLAN.md` — Phase 76 P02 (reload-persistence anchors at `test-question-displayname` + `test-question-bio` + `test-question-social-1` sort 19/20/21); Phase 81 retrofits the sort-21 row.

### Phase 80 (most recent A11Y closure — direct inheritance)

- `.planning/phases/80-a11y-axe-cite-and-fix/80-CONTEXT.md` D-09 / D-11 / D-12 / D-13 / D-14 — determinism contract + vite-cache wipe + parity-script self-identity smoke + IMGPROXY_TIED_TITLES safety + locator convention. Phase 81 inherits verbatim.
- `.planning/phases/80-a11y-axe-cite-and-fix/80-VERIFICATION.md` — Phase 80 verdict (GREEN, 5/5 SCs PASS, 2026-05-13). Confirms v2.10 anchor at SHA `ff0334f856…` preserved through Phase 80.

### Phase 79 determinism anchor (v2.10 binding)

- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-VERIFICATION.md` — Phase 79 verdict (passed-with-deferral, 2026-05-13); locks v2.10 anchor at SHA `ff0334f856…` (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE). Phase 81 verification asserts this anchor holds.
- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` — Phase 79's constants-regen tool; bind-source if Phase 81 verification surfaces PASS / DATA_RACE / CASCADE shifts (or for the additive +2 PASS_LOCKED case if Plan 01 close folds the new cells into the anchor).
- `tests/scripts/diff-playwright-reports.ts` — parity-script restored in Phase 73 P06; Phase 81 verification invokes the self-identity smoke (D-15).

### Determinism + parity contract inheritance

- `.planning/milestones/v2.9-phases/73-determinism-baseline/73-CONTEXT.md` D-01..D-10 — binding determinism contract (3-run `--workers=1` cold-start identical pass/fail; vite-cache wipe recipe). Phase 81 inherits via D-13 / D-15.
- `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:11-32` — IMGPROXY_TIED_TITLES list; D-16 confirms Phase 81 does not collide.

### Cleanup + i18n inheritance

- `.planning/milestones/v2.9-phases/78-cleanup-hygiene-phase/78-CONTEXT.md` (CLEAN-04) — i18n wrapper `TranslationKey` tightening. Phase 81 D-10 relies on `TranslationKey` typing to catch missing-key typos at compile time.

### Component fix surfaces (Phase 81 will modify)

- `apps/frontend/src/lib/components/input/Input.svelte:286-296` — existing URL validation branch (template for the new email branch at D-05). Phase 81 adds a parallel `else if (type === 'email')` branch immediately before the `else { value = currentTarget.value; }` fallback at line 297-300.
- `apps/frontend/src/lib/components/input/Input.svelte:166-168` — `ensureValue()` "Empty string values" block currently lists `'text' | 'textarea' | 'url'`. Phase 81 adds `'email'` to the union: `if (type === 'text' || type === 'textarea' || type === 'url' || type === 'email')`.
- `apps/frontend/src/lib/components/input/Input.type.ts:7-34` — `InputProps['type']` discriminated union. Phase 81 adds a new variant: `{ type: 'email'; value?: string; ...common-text-input-props }` (planner copies the shape from the `'url'` variant at lines 10-12 verbatim).
- `apps/frontend/src/lib/components/input/QuestionInput.svelte:63-75` — `$derived.by` dispatch block. Phase 81 adds one new line per D-04: `if (question.type === QUESTION_TYPE.Text && question.subtype === 'email') t = 'email';` immediately after the existing `'link' → 'url'` line.

### i18n surface (Phase 81 will modify)

- `apps/frontend/messages/en/components.json:17-22` — `input.error.{invalidFile,oversizeFile,fileLoadingError,invalidUrl}` block. Phase 81 adds `"invalidEmail": "The email address is not valid."` per D-10.
- `apps/frontend/messages/fi/components.json` `input.error.*` block — Phase 81 adds Finnish translation.
- `apps/frontend/messages/sv/components.json` `input.error.*` block — Phase 81 adds Swedish translation.
- `apps/frontend/messages/da/components.json` `input.error.*` block — Phase 81 adds Danish translation.

### e2e fixture surface (Phase 81 will modify)

- `packages/dev-seed/src/templates/e2e.ts:621-630` — sort-21 `test-question-social-1` info question. Phase 81 D-07 retrofits with `subtype: 'link'`.
- `packages/dev-seed/src/templates/e2e.ts:617-620` — comment block above sort-21 row. Phase 81 D-09 updates the "PRODUCT-GAP-PARTIAL: url-format validation deferred" line to reflect Phase 81 closure.
- `packages/dev-seed/src/templates/e2e.ts` (after sort-22 row at line ~666-667) — NEW sort-23 `test-question-email-1` row per D-08.
- `packages/dev-seed/src/templates/e2e.ts:767` (Alpha `answersByExternalId` block) — Phase 81 adds `'test-question-email-1': { value: { en: 'sentinel-81@example.com' } }`.

### Test surface (Phase 81 will modify)

- `tests/tests/specs/candidate/candidate-profile-validation.spec.ts:112-119` (`TEXT_CELLS` constant) — Phase 81 D-11 adds 2 new cells with a new `kind` discriminant.
- `tests/tests/specs/candidate/candidate-profile-validation.spec.ts:213-247` (`for (const cell of TEXT_CELLS)` loop) — Phase 81 D-11 refactors to branch by `kind` (HTML5 cap vs. error-UI assertion).
- `tests/tests/specs/candidate/candidate-profile-validation.spec.ts:23-29` (deferred-cells docstring) — Phase 81 should update to note A11Y-05 + A11Y-06 are NOW resolved (A11Y-07 remains deferred to Phase 82).
- `tests/playwright.config.ts:124` — `candidate-(registration|profile|profile-validation)\.spec\.ts` regex already includes `profile-validation`. NO config change needed.

### Schema reference surfaces (read-only — Phase 81 verifies)

- `packages/data/src/core/dataObject.ts:96-98` — `DataObject.subtype` getter. Confirms `Question.subtype` inheritance is in place; no override needed in `TextQuestion`.
- `packages/data/src/objects/questions/variants/textQuestion.ts` — `TextQuestion` class; minimal (`_ensureValue` only). NO change expected (subtype is inherited).
- `packages/data/src/core/dataObject.type.ts:35-37` — `DataObject.subtype` type definition (`subtype?: string | null`). Confirms no CHECK constraint at the type level; any string value (`'link'` / `'email'` / etc.) is valid.
- `packages/supabase-types/src/database.ts:940-1018` — `questions` table Row/Insert/Update shapes. `subtype: string | null` (no enum constraint). Confirms DB-side support for any subtype string.
- `apps/supabase/migrations/` — verified at scout time: NO CHECK constraint on `questions.subtype`. Phase 81 needs NO migration.

### Consumer-side surfaces (verified read-only — Phase 81 does NOT modify)

- `apps/frontend/src/lib/components/infoAnswer/InfoAnswer.svelte:65,79` — existing `subtype === 'link'` / `subtype === 'linkList'` consumers. Phase 81 does NOT modify; the InfoAnswer dispatch is independent of QuestionInput dispatch (InfoAnswer renders SAVED answers; QuestionInput renders editable inputs). NO need to add an InfoAnswer `'email'` branch in Phase 81 — that's an answer-rendering surface, not a validation surface. If a downstream phase wants to render saved email addresses as `mailto:` links, that's a Phase 82+ candidate.
- `apps/frontend/src/lib/utils/links.ts` — `checkUrl` precedent (D-05 mirror). Phase 81 may or may not add `checkEmail` (Claude's Discretion).
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` — candidate profile route; consumes `QuestionInput` indirectly via the InfoQuestion render path. NO route-level change; Phase 81 changes are at the component layer only.

### Project-level conventions

- `CLAUDE.md` §"Development Commands" — `db:*` canonical commands (Phase 78 CLEAN-01 + Phase 80 D-11). Phase 81 verification uses `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean`.
- `CLAUDE.md` §"Important Implementation Notes" — "Localization — all user-facing strings must support multiple locales" (drives D-10 4-locale key addition); "Use TypeScript strictly — avoid `any`, prefer explicit types" (drives Input.type.ts discriminated-union addition over a loose string typing).
- `CLAUDE.md` §"Svelte Warning-Accepted Format" — applies if any Phase 81 change triggers a vite-plugin-svelte warning. NOT expected — additive changes only.
- `.agents/code-review-checklist.md` — apply at PLAN.md authoring time + per-plan close.
- `tests/eslint.config.mjs` — post-Phase-73 lint config; `playwright/no-raw-locators` + `playwright/no-conditional-in-test` at `'error'`. The modified spec MUST pass `yarn lint:check`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`Question.subtype` field** — already DB-typed (`text | null`), already wired through `DataObject.subtype` getter (`packages/data/src/core/dataObject.ts:96-98`), already consumed by 2 components (`QuestionInput.svelte:65`, `InfoAnswer.svelte:65,79`). Phase 81 reuses; NO schema migration, NO type changes.
- **Input.svelte URL validation branch** (`apps/frontend/src/lib/components/input/Input.svelte:286-296`) — template for the new email branch (D-05). Pragmatic regex + handleError + value-preservation pattern is the contract Phase 81 mirrors.
- **`handleError(key)` helper** (`Input.svelte:318-320`) — already drives all `components.input.error.*` keys via the `t` callable. Phase 81's new `invalidEmail` key plugs in identically.
- **`checkUrl` precedent** (`apps/frontend/src/lib/utils/links.ts:18-41`) — Phase 81's email-regex extraction (if planner picks the util-function path per D-06 Claude's Discretion) mirrors the shape.
- **`getByLabel(/regex/i)` locator** (`candidate-profile-validation.spec.ts:229`) — already in use for the Phase 76 P01 cell-3 (name-too-long). Phase 81's cells 5 + 6 reuse the same locator pattern; NO new test-ids needed.
- **`loginAsCandidate(page)` module-level helper** (`candidate-profile-validation.spec.ts:67-74`) — already hoisted, reusable across cells. Phase 81 cells reuse.
- **Existing 4-locale `input.error.invalidUrl` key** — Phase 81's `invalidEmail` key follows the same shape across en/fi/sv/da locale files.
- **e2e template Alpha `answersByExternalId` block** (`e2e.ts:730-773`) — Phase 81 D-08 adds 1 new entry following the value-disjointness invariant (no 'alpha' substring).
- **`A11Y-01 candidate profile validation` describe scope** (`candidate-profile-validation.spec.ts:121-249`) — already serial + already covers `loginAsCandidate` + profile-heading settle gate. Phase 81 cells slot in directly.

### Established Patterns

- **Phase 76 P01 fixture-extension additive contract** (e2e.ts:753-762) — value-disjointness from 'alpha' substring required. Phase 81 D-08 inherits.
- **Phase 76 P01 cell-3 spec pattern** (`candidate-profile-validation.spec.ts:213-247`) — `getByLabel(/regex/i).fill(value)` + assert. Phase 81 D-11 mirrors for cells 5 + 6.
- **Phase 76 D-04 / Phase 75 D-04 scope-marked filename pattern** — applied to test-title scope-marking in Phase 81 (`A11Y-01 A11Y-05 ...` / `A11Y-01 A11Y-06 ...`).
- **Phase 80 D-09 / D-11 / D-12 determinism contract** — 3-run cold-start + vite-cache wipe + parity-script self-identity. Phase 81 inherits.
- **Phase 80 D-13 IMGPROXY_TIED_TITLES safety** — verified at CONTEXT authoring; Phase 81 titles don't collide.
- **Phase 80 D-14 locator + lint convention** — role/aria + `playwright/no-raw-locators` `'error'`. Phase 81 inherits.
- **Inline `// reason:` justification** (v2.8 P70 / v2.8 P71 / Phase 73 IN-03 / Phase 80 D-14). Phase 81 may use on the new Input.svelte email branch (`// reason: pragmatic regex catches obvious typos; server-side does final validation`) — planner's call.
- **i18n key REUSE where canonical key already exists** (Phase 80 D-05 (B) reused `common.closeDialog`). Phase 81 ADDS the missing `invalidEmail` key — no existing key to reuse.
- **Convention-by-string-value (loose `subtype` typing)** — Phase 81 D-01 reuses the pattern already established by `'link'` / `'linkList'` dispatch. No enum constraint at the DB or type level.

### Integration Points

- **`apps/frontend/src/lib/components/input/Input.svelte`** — Plan 01 modifies: D-05 (new email branch in handleChange) + ensureValue empty-string list extension (line 166).
- **`apps/frontend/src/lib/components/input/Input.type.ts`** — Plan 01 modifies: D-04 (new `'email'` variant in InputProps['type'] discriminated union).
- **`apps/frontend/src/lib/components/input/QuestionInput.svelte`** — Plan 01 modifies: D-04 (one new dispatch line in `$derived.by` block).
- **`apps/frontend/messages/{en,fi,sv,da}/components.json`** — Plan 01 modifies: D-10 (add `invalidEmail` key to all 4 locales).
- **`packages/dev-seed/src/templates/e2e.ts`** — Plan 01 modifies: D-07 (sort-21 retrofit) + D-08 (new sort-23 row) + D-09 (comment update) + Alpha answer cell.
- **`tests/tests/specs/candidate/candidate-profile-validation.spec.ts`** — Plan 01 modifies: D-11 (2 new TEXT_CELLS entries + loop refactor by `kind` discriminant + docstring update).
- **`.planning/phases/81-a11y-01-product-gap-cells-email-url-format/81-VERIFICATION.md`** — NEW artifact at Plan 01 close. Follows the Phase 80 verdict shape (5 SCs assessed + verdict + follow-up todos if any).
- **NO changes to:** `apps/supabase/migrations/` (no schema change; `subtype` column already exists + no CHECK constraint); `packages/data/src/objects/questions/variants/textQuestion.ts` (subtype is inherited from DataObject base — no override needed); `apps/frontend/src/lib/components/infoAnswer/InfoAnswer.svelte` (rendering saved answers is independent of validation surface); `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` (component-layer changes only); `tests/playwright.config.ts` (`profile-validation` regex already matches); `tests/scripts/diff-playwright-reports.ts` (additive constants update only if 3-run cold-start surfaces the new +2 PASS_LOCKED entries — planner folds in at Plan 01 close).

</code_context>

<specifics>
## Specific Ideas

- **`Question.subtype` dispatch values used in Phase 81:** `'link'` (URL retrofit, already in production semantic — InfoAnswer.svelte:65) + `'email'` (NEW, parallel to 'link'). No enum at the type level; convention-by-string-value matches the existing `'link'` / `'linkList'` family.

- **Email regex (D-06):**
  ```typescript
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  ```
  Rejects: `''` (empty handled separately), `' '`, `'foo'`, `'foo@'`, `'foo@bar'`, `'foo @bar.co'`, `'foo@bar .co'`, `'foo@bar.'`.
  Accepts: `'a@b.co'`, `'name+tag@example.org'`, `'first.last@sub.domain.co.uk'`, `'ä@b.co'`.
  Location: planner's call — inline in `Input.svelte` script block (default), OR extracted to `apps/frontend/src/lib/utils/email.ts` / `apps/frontend/src/lib/utils/links.ts` (rename note: `links.ts` is URL-scoped per current naming, so a sibling util reads cleaner).

- **Input.svelte email branch shape (D-05):**
  ```svelte
  } else if (type === 'email') {
    const currentValue = currentTarget.value.trim();
    if (currentValue === '') {
      value = '';
    } else {
      if (!EMAIL_REGEX.test(currentValue)) return handleError('components.input.error.invalidEmail');
      value = currentValue;
    }
  } else {
    value = currentTarget.value;
  }
  ```
  The `return` before `value =` is the value-preservation contract; matches URL branch at line 293.

- **QuestionInput.svelte dispatch shape (D-04):** one new line, parallel to the existing `'link' → 'url'` line at QuestionInput.svelte:65.

- **i18n keys (D-10) — defaults (planner refines):**
  - en: `"The email address is not valid."`
  - fi: `"Sähköpostiosoite ei kelpaa."`
  - sv: `"E-postadressen är ogiltig."`
  - da: `"E-mailadressen er ugyldig."`

- **e2e fixture sort-23 row shape (D-08):** see D-08 above for the concrete TypeScript shape; Alpha answer `{ en: 'sentinel-81@example.com' }`.

- **Spec cells 5 + 6 (D-11):** see D-11 above for the concrete TypeScript shape; bad values `'not-an-email'` / `'not a url'`.

- **Planner re-baseline at PLAN.md time:** Re-run `yarn test:e2e --project=candidate-app-mutation -g "A11Y-01"` at Phase 81 start to confirm the existing 3 cells (image-type / image-size / name-too-long) PASS pre-changes. If any of those 3 cells fail at HEAD-pre-changes, surface as a Phase 81 blocker before authoring the new cells (Phase 79 cascade-fix should have made all 3 deterministic, but verify).

- **Risk: `subtype` not surfaced through dev-seed writer.** Verified at CONTEXT scout: `subtype` is part of the Insert shape per `packages/supabase-types/src/database.ts:991`. Phase 81 expects `packages/dev-seed/src/writer.ts` to already serialize it; if not, single-line addition lands in Plan 01.

- **Risk: existing answers contain values that would FAIL the new validation.** Verified at CONTEXT scout: Alpha's existing `test-question-social-1` answer `'https://example.com/sentinel-76'` is a VALID URL (passes `checkUrl`). The new sort-23 email row's Alpha answer `'sentinel-81@example.com'` is a VALID email (passes the new regex). No fixture conflict.

- **Risk: `subtype` field surfaces in the dataProvider Question mapping.** Verified at scout: `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:521-546` uses `toDataObject(row, locale, defaultLocale)` which preserves all row fields (including `subtype`). No explicit pass-through needed; the generic mapping pipeline carries `subtype` to the Question instance. Confirmed by the fact that `subtype === 'link'` already works in production today on questions that have it set.

</specifics>

<deferred>
## Deferred Ideas

- **`InfoAnswer.svelte` email rendering** — If a downstream phase wants saved email addresses to render as `mailto:` links (parallel to the existing `subtype === 'link'` → href rendering at InfoAnswer.svelte:65), that's a Phase 82+ candidate. Phase 81 scope is the VALIDATION surface (editable inputs), not the RENDERING surface (saved answers).
- **`Question.subtype` as a typed enum** — The current convention is loose string typing (`'link'` / `'linkList'` / `'email'` are convention, not type-constrained). Future work could introduce a `QuestionSubtype` union type at the `@openvaa/data` level for compile-time safety. Out of v2.10 scope; trivial follow-up todo if it surfaces.
- **`tel` / `postal` / other format dispatches** — The Phase 81 pattern (`subtype` → input type dispatch + validation branch) extends naturally to other formats. Out of v2.10 scope; future a11y / question-spec phases.
- **Centralized validator helper (`Input.svelte` shared validation registry)** — If `Input.svelte` accumulates a 5th, 6th, ... format-validation branch, the inline `else if` chain in `handleChange` may warrant extraction to a registry pattern (`VALIDATORS = { url: checkUrl, email: checkEmail, ... }`). Out of v2.10 scope; the current 2-branch shape (URL + email) doesn't justify the abstraction yet — see CLAUDE.md "Don't add features, refactor, or introduce abstractions beyond what the task requires."
- **HTML5 `<input type="email">` for mobile keyboard UX** — Phase 81 keeps the DOM `<input type="text">` shape. A future enhancement could conditionally emit `<input type="email">` for mobile-keyboard semantics (`inputmode='email'`). Out of v2.10 scope; nice-to-have.
- **Phase 82 required-empty cell** — A11Y-07 remains deferred (per ROADMAP Phase 82). Phase 81 does NOT cover empty-required-save behavior; that's Phase 82's embedded product decision (REJECT vs. SOFT-WARN-ONLY per Phase 82 ROADMAP framing).
- **`apps/frontend/messages/*/components.json` i18n key audit** — Phase 78 CLEAN-04 tightened the i18n wrapper but did not run a full key-coverage audit across all 4 locales. Phase 81's `invalidEmail` addition is a single key; a full audit (e.g., does every key in en exist in fi/sv/da?) is out of scope. Could be a Phase 82+ follow-up todo.

### Reviewed Todos (not folded)

`gsd-sdk query todo.match-phase 81` not invoked during this discussion (the cross-reference step is automated in workflow; no auto-folding occurred). The single most-relevant todo is folded directly as the source of truth:

- `.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md` — IS the cite-and-fix source for Phase 81 (cells 5 + 6) + Phase 82 (cell 4). Phase 81 closure moves the email + URL portions of this todo to `.planning/todos/done/` (or a partial-close marker if the planner prefers to keep the file alive until Phase 82 closes A11Y-07).

All OTHER keyword-matched todos that surfaced for Phase 80 (the 30 listed in `.planning/phases/80-a11y-axe-cite-and-fix/80-CONTEXT.md` Reviewed Todos section) route to OTHER phases per `.planning/STATE.md §"Deferred Items"` — same routing applies to Phase 81. Folding any of them into Phase 81 would create scope conflict.

</deferred>

---

*Phase: 81-A11Y-01 PRODUCT-GAP Cells — Email + URL Format*
*Context gathered: 2026-05-13*
