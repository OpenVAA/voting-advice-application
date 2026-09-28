# Phase 152 — UK/US Symbol-Name Audit

> **Requirement:** `REVIEW-HYG-04` · **Decision:** `D-A6` · **Produced by:** plan `152-04`
> **Instrument:** `.planning/phases/152-comment-naming-hygiene-sweep/scripts/uk-identifier-audit.mjs` (committed by plan `152-02`)
> **Measured at:** 2026-08-29, branch `integration/ship-12-squash`

---

## 1. The rule this artefact exists under, stated first

**This audit is committed even when its answer is "none found."**

That is criterion 4's own wording, and it governs the artefact's *existence*, not merely this run's
contents. A future re-run that reports zero hits is still committed — the point is that the next reader
inherits a result instead of re-deriving one. Re-derivation is exactly where this audit goes wrong: the
first derivation produced **874 hits of which roughly 98% were false** (§ 2).

So: if you are reading this because you wondered whether the repo has UK-spelled symbols, **do not
re-derive.** Run the one command in § 2 and compare against § 3.

---

## 2. The method, and the exact command

```bash
node .planning/phases/152-comment-naming-hygiene-sweep/scripts/uk-identifier-audit.mjs
```

Exit codes: `0` = no in-scope UK-spelled identifier; `1` = at least one hit, **or** a precondition failure
(a file or the tracked-file set it could not read). It fails closed — an input it cannot read is spelling
it cannot check, and is never reported as clean.

### What it does

For every tracked `.ts .tsx .js .mjs .cjs .svelte .sql` file under `apps/`, `packages/` and `tests/`
(1,521 files at time of writing), it:

1. **Blanks comments** using the phase's shared comment-span classifier (the same state machine
   `hygiene-codemod.mjs` and `assert-comment-hygiene.mjs` use — one implementation, not three copies).
2. **Blanks string literals and regex literals**, preserving template-literal `${…}` interpolations,
   which are code.
3. For `.svelte`, keeps **only `<script>` regions**; markup text and attribute names are not symbols.
4. **Tokenizes identifiers** and splits each on camelCase boundaries and on `_` and `$`.
5. Matches each resulting word **as a whole word** against a curated **62-stem UK list**.

**Whole words over split identifiers — not substrings.** That distinction is the whole instrument.

### Why the broad approach was discarded, and the four traps the curated list excludes

A broad stem match over all lines returned **874 occurrences, roughly 98% of them false**. Four trap
classes account for nearly all of it, and the committed word list deliberately omits each:

| Trap | Why it is excluded |
|---|---|
| `disc` | matches `discover`, `disconnect`, `discourse` — ordinary English, not UK spelling |
| `axe` | matches **the a11y tool** (`axe-core`, `axe` scans). Renaming it breaks the accessibility harness |
| `analys` (as a noun stem) | **`analysis` is US spelling too** — `FactorAnalysis` is correct as written. Only the verb forms (`analyse`/`analysed`/`analyser`) are UK-only, and only those are in the list |
| `labelled` | matches **`aria-labelledby`**, a W3C attribute name that must **never** be renamed. It is additionally out of reach by construction, because `.svelte` markup and attribute names are never scanned |

A later reader who adds `analys*` or a bare `disc` to the word list will reproduce the 874-hit result.

---

## 3. The in-scope result

### Before (measured at `d206dc31a`, pre-rename)

```
UK/US identifier audit (phase 152: REVIEW-HYG-04) — files scanned: 1521;
in-scope hits: 16 occurrence(s) over 3 distinct identifier(s) in 3 file(s).
```

| Before | After | Sites | Files | Blast radius |
|---|---|---|---|---|
| `describeOffence` (fn) | `describeOffense` | `:63, :99, :101` | `packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts` | file-local, not exported |
| `offences` (local `const`, ×2 scopes) | `offenses` | `:81, :90, :99, :101, :106, :165, :166, :169` | same file | file-local |
| `permLocalisationPositiveTemplate` (exported `const`) | `permLocalizationPositiveTemplate` | `:79, :212` and `:38, :85, :167` | `packages/dev-seed/src/templates/e2e/perm/perm-localisation-positive.ts`, `packages/dev-seed/src/templates/index.ts` | 5 sites, 2 files, one workspace |

**16 occurrences, not 14.** `152-RESEARCH.md` contradicts itself: § 9.1's own tool output reads
`8x offences · 5x permLocalisationPositiveTemplate · 3x describeOffence` (= 16), while § 9.2's
hand-written table lists `offences` at six sites, omitting `:99` and `:101` — the two lines that read
`offences.push(describeOffence(…))` and therefore carry **both** identifiers, which § 9.2 attributed to
one identifier each. `152-02` measured 16 two ways and recorded the correction; `152-04`'s own
acceptance criterion still inherited 14, and sized the rename against 16. The instrument was **not**
adjusted to reproduce 14.

### After (post-rename)

```
UK/US identifier audit (phase 152: REVIEW-HYG-04) — files scanned: 1521;
in-scope hits: 0 occurrence(s) over 0 distinct identifier(s) in 0 file(s).
No UK-spelled identifier found. Recorded as such — "none found" is a result.
```

Exit code `0`. **Zero in-scope hits remain.** REVIEW-HYG-04 is closed on the identifier surface.

---

## 4. The deliberate identifier-vs-key spelling mismatch, and why

**The repo now contains `permLocalizationPositiveTemplate` (US) bound to `'perm-localisation-positive'`
(UK). This is deliberate. Do not "fix" it.**

The key string is simultaneously:

- the `--template` CLI argument (`yarn db:seed --template e2e/perm/perm-localisation-positive`),
- the module's own filename (`packages/dev-seed/src/templates/e2e/perm/perm-localisation-positive.ts`),
- a seed `external_id` stem,
- and the stem of **more than ten** Playwright project names, `testMatch` regexes, setup/teardown names
  and spec filenames in `tests/playwright.config.ts`.

All of those are **strings and paths, not symbols**, and are therefore outside `D-A6`'s scope, which
scopes this audit to symbol names. Renaming them would be an E2E-suite-wide change, and CLAUDE.md's
cardinal E2E rule makes that an unacceptable rider on a comment-hygiene phase.

Proof the boundary held: `git diff --stat -- tests/` is **empty** across this plan's commits, the key
string count in `templates/index.ts` is unchanged at 1, and the module filename is byte-identical.

**The alternative that was not taken:** leave all five identifier sites UK-spelled, so identifier and key
agree. That was defensible — a self-consistent UK family reads better than a split one. It was rejected
because `D-A6` scopes the requirement to symbols, and declining the only in-scope symbol rename in the
family to preserve cosmetic agreement with an out-of-scope string would have left the requirement
unmet in order to protect something the requirement does not cover. Criterion 4 requires that whichever
was chosen is written down with its reason; this section is that record.

---

## 5. The out-of-scope register — enumerated, so it is not re-audited

Everything below carries a UK spelling **and is deliberately left alone**. Each is excluded
*structurally* by the instrument (comments, strings, markup and filenames are blanked or never
scanned), not by a word-list special case a later edit could drop.

### 5a. Comments and prose — `organisation(s)`

**32 occurrences** of `organisation(s)` exist in source-extension files across the three trees. Of those,
2 are fixture inputs (§ 5d) and 2 are `test.step` titles (§ 5f), leaving **28 comment/prose occurrences**:

- `packages/dev-seed/src/templates/e2e/perm/*.ts` topology docblocks — 14 files
  (`* Topology: 1 election, 1 CG with 1 CO, 2 organisations, …`)
- `packages/dev-seed/src/templates/_helpers/buildMinimal.ts:15, 97, 269, 430`
- `packages/dev-seed/src/templates/e2e/base.ts:36`
- `tests/tests/specs/perm/perm-localisation-positive.spec.ts:5`
- `tests/tests/specs/perm/perm-org-matching.spec.ts:11, 26`
- `tests/tests/specs/voter/voter-journey.spec.ts:1170, 1183`

(`152-RESEARCH.md` § 9.3 reports 27; the measured figure here is 28. Recorded as measured, not smoothed.)

### 5b. Comments and prose — `offences`

- `packages/dev-seed/src/template/permittedKeys.ts:101` — prose inside a docblock.
- `packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts:34, 62, 113, 115, 149, 173` — comment
  prose using the singular `offence`, left in place beside the renamed `describeOffense` / `offenses`
  identifiers. The resulting prose/identifier spelling split is a **known, accepted consequence** of
  scoping this requirement to symbols; comment text in this phase belongs to the wave-4 judgement pass
  in plan `152-10`, and mixing a prose edit into an identifier-rename commit would defeat the
  behaviour-neutrality prover in plan `152-05`.

### 5c. Component `<!--@component-->` docstrings

`colour(s)` / `behaviour` / `grey` / `cancelled` / `labelling` / `practises`, in:

- `apps/frontend/src/lib/components/icon/Icon.svelte:13` (+ `Icon.type.ts:15`)
- `apps/frontend/src/lib/components/openVAALogo/OpenVAALogo.svelte:13` (+ `.type.ts:22`),
  and the docs-app copy at `apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte:13`
- `apps/frontend/src/lib/components/infoBadge/InfoBadge.svelte:9` (+ `.type.ts:11`)
- `apps/frontend/src/lib/components/preventNavigation/PreventNavigation.svelte:8` (+ `.type.ts:7`)
- `apps/frontend/src/lib/components/video/Video.svelte:19`
- `apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte:13`
- `apps/frontend/src/lib/components/term/Term.svelte:72, 114, 117`
- `apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte:297`
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte:9, 195, 206`
- `apps/frontend/src/lib/components/modal/ModalContainer.svelte:89`
- `apps/frontend/src/lib/dynamic-components/appLogo/AppLogo.svelte:3`
- `apps/frontend/src/lib/contexts/utils/inheritContextMembers.ts:24, 47`
- the translation editor (`editTranslations.ts`)

### 5d. Deliberate negative-test inputs — **changing these silently weakens a passing test**

Both verified by direct read before being recorded here:

- `apps/frontend/src/params/etSg.test.ts:22` → `['organisation', false]`
- `apps/frontend/src/params/etPl.test.ts:23` → `['organisations', false]`

Each asserts that the param matcher **rejects** the UK spelling. Respelling the input to
`organization` / `organizations` would turn a real assertion into a tautology that can never fail, while
still showing green. **These are the most dangerous hits in the register.**

### 5e. Usage-example docstring

`apps/frontend/src/lib/components/input/Input.svelte:46, 52` —
`label="Favourite colours"` and `info="Select any number of colours in the order you prefer them."`,
inside the ```` ```tsx ```` usage block of the component docstring. Example copy, not a symbol.

### 5f. Strings that are titles, routes or rendered copy

- `tests/tests/specs/voter/voter-journey.spec.ts:1180, 1492` — two `test.step` titles beginning
  `'organisation matching …'` / `'organisation details …'`. Strings. This intersects the test-title
  question owned by plan `152-13`, whose prohibitions explicitly decline to respell them and point here.
- `apps/docs/src/routes/+page.svelte:143, 189` — `localisable` in **rendered user-facing copy**
  (`<span>🌍 Fully localisable</span>`). Changing it is a copy decision, not a hygiene one.
- `apps/docs/src/lib/navigation.config.ts:159, 160` — `title: 'Customized behaviour'` and
  `route: '/developers-guide/backend/customized-behaviour'`. The route string is **load-bearing**: it
  maps to the directory `apps/docs/src/routes/(content)/developers-guide/backend/customized-behaviour/`.
  Renaming the identifier-free string would be a routing change, not a spelling one.

### 5g. Markdown outside the three swept trees

- `packages/data/README.md:71` — `## Source file organisation`
- `apps/docs/src/routes/(content)/**/*.md` — 11 files carrying `organisation` / `behaviour` /
  `colours` / `licence`, including the generated component pages (which are regenerated from the
  docstrings in § 5c and would need the docstrings fixed first).

---

## 6. Pointers

- **The instrument:** `.planning/phases/152-comment-naming-hygiene-sweep/scripts/uk-identifier-audit.mjs`
  — carries the 62-stem word list verbatim, with each omission's reason beside it.
- **The shared classifier:** `.planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-codemod.mjs`
  (exports `commentSpans`, `enumerateTrackedFiles`, `REPO_ROOT`, `SCAN_ROOTS`).
- **The plan that produced this artefact:** `.planning/phases/152-comment-naming-hygiene-sweep/152-04-PLAN.md`
- **Its summary, with the deviations:** `.planning/phases/152-comment-naming-hygiene-sweep/152-04-SUMMARY.md`
- **The 16-vs-14 correction, first recorded:** `152-02-SUMMARY.md` § "Corrections", and `.planning/WINDOWS.md` entry 69.
- **Upstream research (internally inconsistent at § 9.1 vs § 9.2 — prefer this file):**
  `152-RESEARCH.md` §§ 9.1–9.5.
