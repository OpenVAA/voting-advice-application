# `apps/frontend/src/lib/utils/` — a sections-level move proposal

**Re-measured:** 2026-09-01, at HEAD `3c958cccc`.
**Produced by:** `158-08`, Task 4.
**Authorised by:** decision **D-G1**'s operator NOTES — *"Also, sweep other content of lib/utils and
make a proposal of other sections to move directly to lib."*

> ## ⚠ This document moves nothing.
>
> It is a **proposal**. It contains no migration order, no codemod, and no task list, because those
> read as authorisation and **this document authorises nothing**. See the closing statement.

---

## 1. The re-measured inventory

Measured today so the next reader does not have to measure again. `158-CONTEXT.md`'s inventory was
taken on 2026-08-28, on a tree that eight other phases have since edited; where the two disagree,
**the figures below are the current ones** and the difference is explained.

### Subdirectories — 5, holding 24 files

| Directory | Files | Contents |
|---|--:|---|
| `aria/` | 1 | `focus.ts` |
| `color/` | 8 | `adjustContrast.ts` · `ensureColors.ts` · `luminance.ts` · `parseColors.ts` · `parseColorString.ts` · `PreviewColorContrast.svelte` · `rgb.ts` · `rgbToHex.ts` |
| `matching/` | 10 | `imputeParentAnswers.ts` (+`.test.ts`, +`.type.ts`) · `mean.ts` (+`.test.ts`) · `median.ts` (+`.test.ts`) · `mode.ts` (+`.test.ts`) · `index.ts` |
| `questions/` | 2 | `electionTags.ts` · `index.ts` |
| `text/` | 3 | `abbreviate.ts` · `toNameCase.ts` · `ucFirst.ts` |

### Top level — 29 files, 1,393 lines (24 modules + 5 colocated test files)

| Lines | File | | Lines | File |
|--:|---|---|--:|---|
| 191 | `settings.test.ts` | | 42 | `email.ts` |
| 121 | `logLevel.test.ts` | | 42 | `onKeyboardFocusOut.ts` |
| 117 | `matches.ts` | | 40 | `hashIds.test.ts` |
| 113 | `image.test.ts` | | 38 | `entityCards.ts` |
| 77 | `sorting.ts` | | 34 | `viewTransition.ts` |
| 71 | `links.ts` | | 30 | `entities.ts` |
| 69 | `logLevel.ts` | | 27 | `image.ts` |
| 65 | `multiChoiceValidity.test.ts` | | 26 | `freeze.ts` |
| 52 | `components.ts` | | 26 | `multiChoiceValidity.ts` |
| 52 | `entityDetails.ts` | | 23 | `getAllianceSummary.ts` |
| 43 | `settings.ts` | | 17 | `constants.ts` |
| | | | 16 | `hashIds.ts` |
| | | | 15 | `purgeNullish.ts` |
| | | | 11 | `breakpoints.ts` |
| | | | 11 | `sanitize.ts` |
| | | | 11 | `timing.ts` |
| | | | 7 | `regexp.ts` |
| | | | 6 | `removeDuplicates.ts` |

### What changed since the CONTEXT's measurement, and why

| | CONTEXT (2026-08-28) | Measured (2026-09-01) |
|---|---|---|
| Subdirectories | 6 — `aria` `color` `matching` `questions` **`route`** `text` | **5** — `route/` is gone |
| Top-level files | 28 | **29** |
| Top-level lines | 1,194 | **1,393** |

Three causes, all measured:

1. **`route/` (8 files) left entirely.** `158-01` moved the whole directory to
   `apps/frontend/src/lib/routes/` — a widening of D-G1's letter (which named two files) on the
   operator's `whole-directory` answer. `apps/frontend/src/lib/utils/route/` no longer exists.
2. **`logger.ts` (13 lines) is gone, and did not merely move within the frontend.** `157-17`
   (`6aaeaed46`) deleted it **with no re-export shim**; the logger now lives at
   `packages/app-shared/src/logging/logger.ts`.
3. **`logLevel.ts` (69) and `logLevel.test.ts` (121) arrived** with `157.1`'s log-level work. The
   residual line-count difference is `152-14`'s unwrap of 3,411 forced line breaks, which changed
   line counts throughout without changing any file's content.

### The siblings this proposal reasons against

`apps/frontend/src/lib/` holds: `_guards` · `admin` · `api` · `auth` · `candidate` · `components` ·
`contexts` · `dynamic-components` · `i18n` · `paraglide` · **`routes`** · `server` · `supabase` ·
`types` · `utils`.

`routes/` is new — this phase created it. It is the worked example the criteria below are calibrated
against.

---

## 2. The selection criteria — stated before any verdict

So that this reads as a decision framework rather than a list of opinions. **A section leaves the
shared-utility directory and becomes a `lib/` sibling when all three hold:**

> **C1 — It names a DOMAIN CONCEPT, not a MECHANISM.**
> A reader looks for it by *what it is about* ("routes", "cookies", "entities"), not by *how it
> works* ("freeze an object", "escape a regex"). `lib/routes` passes: someone hunting for where route
> strings are defined types "routes". `removeDuplicates.ts` fails: nobody searches the tree for a
> directory called "array helpers".
>
> **C2 — It has at least three members, or is expected to grow.**
> A `lib/` sibling is a promise that more will arrive. A two-file directory promoted out of `utils/`
> is a rename with extra steps. "Expected to grow" must be justified by a named forthcoming
> requirement, not by optimism.
>
> **C3 — No existing sibling is already the obvious owner. If one is, ABSORB into it.**
> This is the criterion that does the real work, and it is what distinguishes **this phase's two own
> additions from a promotion**: `lib/routes/` and `lib/cookies/` were created because **no sibling
> owned route definitions or cookie names** — `utils/route/` was the only home and it was the wrong
> one. A helper whose owner already exists does not need a new directory; it needs to be moved into
> the directory that already owns it.

**All three must hold.** C1 and C2 without C3 produces the failure mode this whole exercise is meant
to avoid: a `lib/` root that grows a new sibling every time someone finds three related files.

**A fourth rule, on the residue:** a proposal that empties `utils/` is wrong by construction — see
§ 3.6.

---

## 3. The sections, with verdicts

Six sections. Verdict vocabulary: **RECOMMEND** (promote to a `lib/` sibling) · **ABSORB** (move into
an existing sibling, no new directory) · **KEEP** (stays in `utils/`).

### 3.1 — Colour and theme → **RECOMMEND** `lib/theme/`

**Members:** all 8 of `color/`, plus `breakpoints.ts` (11) and `timing.ts` (11).

Colour is a domain concept in this application specifically, not a generic mechanism: the app ships a
publisher-configurable palette from `staticSettings.colors`, a dark/light split, and a **WCAG 2.1 AA
contrast obligation** that `adjustContrast.ts`, `luminance.ts` and `PreviewColorContrast.svelte`
exist to discharge. A developer asked "where does the app decide whether this text is readable on
this background" should find that by typing "theme", and today must know to look under "utils". C1
holds. Eight members, C2 holds comfortably. No sibling owns theming — `components/` consumes colours
but does not define them, and `@openvaa/app-shared` holds the *values* (`staticSettings.colors`)
while these hold the *derivations over* them. C3 holds.

`breakpoints.ts` and `timing.ts` join because they are the same kind of thing — design tokens the app
reads rather than computes — and because both carry a **cross-boundary consistency hazard** that a
named home makes visible: `breakpoints.ts`'s own comment records that its values *"are hardcoded and
should be manually kept in line with the Tailwind definitions."* A token that must agree with a
config file elsewhere should not be filed under "miscellaneous".

The `.svelte` component in `color/` is a wrinkle worth naming rather than hiding: a directory that is
otherwise pure functions carries one preview component. It is a legitimate member of a `theme/`
concept and an awkward member of a `utils/` one, which is a small point in favour of the move.

### 3.2 — Entity and nomination helpers → **RECOMMEND** `lib/entities/`

**Members:** `entities.ts` (30) · `entityCards.ts` (38) · `entityDetails.ts` (52) · `matches.ts`
(117) · `sorting.ts` (77) · `getAllianceSummary.ts` (23) · `image.ts` (27) + `image.test.ts`.

**This is the strongest case in the document.** These seven are one cohesive body of code about the
`@openvaa/data` object model as this frontend consumes it: unwrapping `MaybeWrappedEntity`, finding
nominations, ordering entities and questions, summarising alliances, resolving `Image` format URLs,
assembling card content. They already import each other — `entityDetails.ts` imports from
`./entities` and `./matches`; `matches.ts` imports from `./entities` and `./sorting`; `sorting.ts`
imports from `./entities`. **The cluster is already a module in everything but name and location.**

C1 holds decisively: "entities" is the central noun of this application's domain. 294 lines across
seven modules; C2 holds. C3 is the one to argue: `lib/dynamic-components/entityCard/` and
`lib/components/` exist and consume these — but they are *presentation* directories, and pushing
domain logic into a component directory inverts the dependency this cluster currently has right. No
sibling owns "how this frontend reads the data model". C3 holds.

⚠ **One naming hazard to settle before adopting, not after:** `entities.ts` and `entityCards.ts`
sit either side of the domain/presentation line, and `entityCards.ts` imports `InfoAnswerProps` from
`$lib/components/infoAnswer`. Whether the card-content assembler belongs in a domain directory at all
is a real question and the proposal does not pretend to answer it.

### 3.3 — Matching maths → **RECOMMEND** `lib/statistics/`, **NOT** `lib/matching/`

**Members:** all 10 of `matching/` — `mean` · `median` · `mode` (each with a test) ·
`imputeParentAnswers` (+ test + type) · `index.ts`.

The section qualifies on all three criteria, but **the obvious name is unavailable and the collision
must be addressed rather than discovered later.**

`@openvaa/matching` is a workspace package — one of the five core logic packages, the home of
`MatchingAlgorithm`, `MatchingSpace` and the distance metrics. Creating
`apps/frontend/src/lib/matching/` produces two directories named `matching` at different layers of
the same monorepo, imported side by side in the same files (`entities.ts` already imports `isMatch`
from `@openvaa/matching`). An import block reading `from '@openvaa/matching'` next to
`from '$lib/matching'` is a standing invitation to reach for the wrong one, and neither the compiler
nor a reviewer will flag it — both resolve.

**Three ways out, and the proposal's preference:**

| Option | Assessment |
|---|---|
| **`lib/statistics/`** — *preferred* | Honest about the contents: three descriptive statistics plus one imputation routine. No collision. Weakness: `imputeParentAnswers` is not a statistic, it is a data-model operation |
| **`lib/answers/`** | Stronger for `imputeParentAnswers` (it is about answers, and imputation is the domain concept). Weakness: `mean`/`median`/`mode` are not about answers |
| **Split** — statistics to `lib/statistics/`, `imputeParentAnswers` to § 3.2's `lib/entities/` | Cleanest by concept. Weakness: breaks the existing `index.ts` barrel and separates code that currently travels together |

⚠ **A prior question the operator may want to settle first:** three of the four members are generic
descriptive statistics with no frontend specificity. **They may belong in `@openvaa/core` or
`@openvaa/matching` rather than in the frontend at all**, in which case this section's fate is a
package decision and not a `lib/` layout decision. That is outside this proposal's remit.

### 3.4 — Accessibility → **RECOMMEND** `lib/a11y/`, **conditionally**

**Members:** `aria/focus.ts` (1 file) + `onKeyboardFocusOut.ts` (42).

C1 holds: accessibility is a first-class concern in this project — `CLAUDE.md` states the app "must
be WCAG 2.1 AA compliant", and there are dedicated a11y specs (`tests/tests/specs/a11y/`) and a
scan-wiring assertion in `lint:check`. A reader looking for the app's focus-management primitives
should find them under a name that says so; `utils/aria/` holding one file does not.

**C2 does not hold on today's count — two members — and the verdict rests entirely on the "expected
to grow" clause.** The justification is named rather than assumed: spikes 013-016 established
`afterNavigate(focus({ preventScroll: true }))` plus an `aria-live` route announcer and reduced-motion
handling as the standing navigation-a11y pattern, and obligation **OB-1** records a live WCAG 2.1 AA
focus failure (`a11y-smoke.spec.ts:300`, NAVA11Y-02) whose fix touches exactly this surface. That is
concrete forthcoming work in this directory, not optimism.

**If the operator does not accept that growth argument, the correct verdict is KEEP** — a
two-file `lib/` sibling is a rename with extra steps, per C2. This section is the one place in the
document where the verdict genuinely turns on a judgement the operator may make differently.

### 3.5 — Absorb into existing siblings → **ABSORB**, no new directory

**This section is criterion C3 doing its work.** Five modules whose owner already exists. Each is a
*proposal to move into a sibling*, not to promote:

| Module | Proposed owner | Reason |
|---|---|---|
| `settings.ts` (43) + `settings.test.ts` (191) | **`@openvaa/app-shared`**, beside `src/settings/` | It is `mergeSettings` over `StaticSettings`/`DynamicSettings` — types it already imports from that package. The merge semantics ("overwritten by root key unless the key is nullish") are a property of the settings model, and they currently live one layer away from the model they describe. The 191-line test is the largest single file in `utils/` and is testing app-shared's contract |
| `logLevel.ts` (69) + `logLevel.test.ts` (121) | **`@openvaa/app-shared`**, beside `src/logging/` | `157-17` already moved the logger there. `resolveLogLevel` is that logger's **configuration half** — it decides the level the logger is configured with — and it is a pure function of its three arguments (`hooks.server.ts` passes them in), so nothing frontend-specific holds it here. Leaving it behind splits one concern across a package boundary for no reason |
| `components.ts` (52) | **`lib/components/`** | `getUUID` for element ids and its siblings are consumed by components and are about components. The owner is unambiguous and already exists |
| `multiChoiceValidity.ts` (26) + test (65) | **`lib/components/questions/`** | Its own docblock names its consumer: *"the single source of truth for the multi-choice categorical selection-count validity used by `OpinionQuestionInput`."* ⚠ **Verify before moving:** the same docblock says it is used "transitively" by the voter persistence gate and the candidate Save gate. If those consume it directly rather than through the input component, a component directory is the wrong home and this row becomes a KEEP |
| `sanitize.ts` (11) | **`text/`** (see § 3.6) | An 11-line DOMPurify wrapper. It is string handling, and `text/` is where this directory's string handling lives |

**None of these five earns a new `lib/` sibling.** Promoting any of them would be C1 and C2 satisfied
with C3 ignored — the exact failure the third criterion exists to prevent.

### 3.6 — The residue → **KEEP**, and this is the point

**Members:** `text/` (3 files, + `sanitize.ts` absorbed from above) · `questions/` (2) ·
`constants.ts` (17) · `email.ts` (42) · `freeze.ts` (26) · `hashIds.ts` (16) + test (40) ·
`links.ts` (71) · `purgeNullish.ts` (15) · `regexp.ts` (7) · `removeDuplicates.ts` (6) ·
`viewTransition.ts` (34).

**A proposal that empties the utility directory is wrong, and the residue is the proof that the
directory earns its name.** Every member here fails **C1** in the same way and for the same good
reason: they are *mechanisms*, not domain concepts. Freeze an object. Escape a regex. Dedupe an
array. Strip nullish keys. Hash ids for change detection. Build a `mailto:`. Nobody searches this
tree for a directory that owns "removing duplicates from an array", and a `lib/` sibling for each
would be 20 directories of one file.

**`text/` is the strongest argument for a directory continuing to be called `utils`.** `abbreviate`,
`toNameCase`, `ucFirst` — three string transforms, no domain content whatsoever. They are the
platonic case of a utility: reusable, mechanical, owned by nothing. Under these criteria `text/`
would fail C1 as a promotion candidate, and that is the correct result, not a gap.

Two members with a note:

- **`questions/`** (2 files) holds `electionTags.ts` and a barrel. If a `lib/questions/` concept ever
  gathers real members it would qualify — but two files fail C2 today with no named forthcoming work,
  so it stays.
- **`viewTransition.ts`** is closer to a concept than the rest (its docblock: *"the single
  `shouldAnimate()` gate + a typed `startViewTransition` guard"*, consumed by the root layout and the
  entity-detail Tabs wrapper). It is a plausible future member of a navigation or a11y grouping —
  spikes 013-016 tie View Transitions and reduced-motion to the same surface as § 3.4. **One file is
  not a section**, so it stays; noted so a later reader sees the adjacency rather than rediscovering
  it.

---

## 4. Not proposed — two members with special dispositions

Recorded explicitly so a reader does not look for them in § 3 and conclude they were overlooked.

### `logger.ts` — **no home is proposed, and none is needed**

Phase 157's decision **D-F5** operator NOTES placed the logger in **`packages/app-shared`**, not in
the frontend. This proposal therefore proposes no home for it — the disposition is not this
document's to make.

⚠ **Measured today, and stronger than the plan anticipated: it is not a pending disposition, it is
done.** `apps/frontend/src/lib/utils/logger.ts` **no longer exists**. `157-17` (`6aaeaed46`,
*"delete the frontend logger module, with no re-export shim"*) removed it, and the logger lives at
`packages/app-shared/src/logging/logger.ts` with call sites migrated to `log.error(…)` and friends.
`find apps/frontend/src -name "logger*"` returns nothing.

Its configuration half, `logLevel.ts`, is the § 3.5 row that proposes following it.

### `route/` — **resolved by this phase, not a proposal item**

`apps/frontend/src/lib/utils/route/` is listed here as **RESOLVED**, not as something to consider.
`158-01` moved the whole directory — all eight files, plus `routes/loginRedirectTarget.ts` — to
`apps/frontend/src/lib/routes/`, under decision **D-G1**, widened from the decision's two-file letter
on the operator's explicit `whole-directory` answer. `lib/utils/route/` does not exist at
`3c958cccc`.

It is named here because it is the **worked example the § 2 criteria are calibrated against**: route
definitions are a domain concept (C1), there were nine modules (C2), and **no sibling owned them**
(C3) — which is precisely why a new sibling was the right answer there and is the wrong answer for
the five modules in § 3.5.

---

## 5. Summary of verdicts

| § | Section | Verdict | Destination |
|---|---|---|---|
| 3.1 | Colour, theme and design tokens | **RECOMMEND** | `lib/theme/` |
| 3.2 | Entity and nomination helpers | **RECOMMEND** | `lib/entities/` |
| 3.3 | Matching maths | **RECOMMEND**, name unresolved | `lib/statistics/` (not `lib/matching/` — package collision) |
| 3.4 | Accessibility | **RECOMMEND**, conditional on the growth argument | `lib/a11y/` |
| 3.5 | Five modules with existing owners | **ABSORB** | `@openvaa/app-shared` ×2 · `lib/components/` ×2 · `utils/text/` ×1 |
| 3.6 | The residue | **KEEP** | `apps/frontend/src/lib/utils/` |
| 4 | `logger.ts` | **not proposed** | already at `packages/app-shared` (157-17) |
| 4 | `route/` | **resolved by this phase** | `lib/routes/` (158-01) |

Four named groupings recommended for promotion; one absorb set; one residue that keeps the directory
honest.

---

## 6. Closing statement — what this document does not do

**Nothing in this document is executed by Phase 158.** No file under
`apps/frontend/src/lib/utils/` other than the `route/` directory changes path in this phase, and that
one move was authorised by decision D-G1 itself, not by this proposal.

This document deliberately contains **no migration order, no codemod, and no task list.** That
omission is the point: a proposal that ships with a ready-to-run sequence reads as authorisation, and
the next executor to open it would find something that looks like a plan. **Acting on any verdict
here is a separate decision, for the operator to make and for a later phase to own.**

Three of the four RECOMMEND verdicts also carry a question the proposal does not settle — § 3.3's
name and possible package-level home, § 3.4's growth argument, § 3.2's domain/presentation boundary
for `entityCards.ts` — and two of the five ABSORB rows carry a "verify before moving" caveat. Those
are open on purpose. **A proposal is allowed to leave a question open; a migration is not.**
