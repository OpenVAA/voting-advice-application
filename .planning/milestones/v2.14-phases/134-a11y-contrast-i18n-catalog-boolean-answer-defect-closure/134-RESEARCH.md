# Phase 134: A11y Contrast + i18n Catalog + Boolean-Answer Defect Closure - Research

**Researched:** 2026-08-10
**Domain:** In-repo defect closure — Playwright/axe a11y gate hardening, Paraglide/inlang i18n runtime catalog, Svelte 5 falsy-guard fix
**Confidence:** HIGH (every claim below was verified against the live codebase this session; the a11y findings come from an actual axe run against the running dev server + `e2e/base`-seeded DB)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**FIX-01 — re-scope to gate + cleanup**

- **D-01 (Keep FIX-01 as a requirement, rewritten):** Do NOT close it as already-satisfied and do NOT broaden it to an app-wide `.label` audit. The deliverable is three-part: (a) a **settled-DOM regression gate** that would actually have caught the original defect (see D-04), (b) the `text-label` dead-class cleanup (D-02), (c) corrected ROADMAP / REQUIREMENTS / `v2.14-MILESTONE-AUDIT.md` text recording that commit `0eb27c677` closed the app-side contrast defect and that the 12/12-FAIL figure was stale.
- **D-02 (`text-label` → `small-label`):** Replace the dead `text-label` class at `NumericEntityFilter.svelte:85,98,113` with the project's own opaque muted-label token `small-label` (`app.css:384` → `text-secondary text-xs font-normal uppercase`), already used by `ConstituencySelector` and `QuestionChoices`. Expresses the original intent, AA-safe. Not a bare delete, not a new `--color-label` theme token.
- **D-03 (Leave `app.css:492` as-is):** The global `.label { color: inherit }` override stays. It is shipped, documented with rationale, and verified AA-clean in both themes. Narrowing it to per-component explicit colours risks re-opening the defect.

**A11y gate hardening — the real FIX-01 deliverable**

- **D-04 (Typed route contract — the chosen settle strategy):** Add a **required `contentTestId` field to the route-entry type** so a future route physically cannot be added to the scan set without declaring what "loaded" means; each entry waits for its own data-driven testid (elections → `election-selector-option-label`, constituencies → the constituency option) **before** `awaitAnimationsSettled`. Chosen over the minimal per-route settle patch and over a separate standalone assertion test — the type makes the guarantee structural rather than per-site discipline.
- **D-05 (Add a filter-drawer route to the scan set):** `NumericEntityFilter` / `EnumeratedEntityFilter` live behind the results-page filter drawer and are currently scanned by **nothing**. Add a scan route with a fixture path (navigate to results, open filters). These are exactly the surfaces the audit flagged — real coverage gain, not a backlog todo.
- **D-06 (axe global-zero gate only):** `assertAxeGates` already asserts `violations.length === 0`; with D-04 in place that is a genuine gate. Do **not** add a belt-and-braces computed-colour assertion pinning `rgb(51,51,51)` / `rgb(204,204,204)`.
- **D-07 (New violations surfaced by the harden are fixed in-phase):** Hardening the settle may reveal that other routes were passing for the same reason elections was. Those are ours to close **in this phase** — the E2E cardinal rule means we cannot ship with the suite red. Do NOT quarantine to a follow-up phase, do NOT keep a loose settle on those routes with a documented reason, and do NOT checkpoint the decision back to the operator. (If the volume turns out to be genuinely out of budget, escalate honestly with the gate left RED — never annotated around.)

**FIX-02 — i18n runtime catalog**

- **D-08 (Fix all 7 keys, not 2):** All 7 are authored in all 7 locales in the type-gen source (`src/lib/i18n/translations/`) and all 7 render the raw key string today. Add them to the **runtime Paraglide catalog** `apps/frontend/messages/{locale}/*.json` (registered at `project.inlang/settings.json:53`).

  | Key | Call site | User impact |
  |---|---|---|
  | `questions.multiChoice.selectExact` | `QuestionChoices.svelte:421` | visible helper text |
  | `questions.multiChoice.selectRange` | `QuestionChoices.svelte:422` | visible helper text |
  | `components.accordionSelect.listboxAriaLabel` | `AccordionSelect.svelte:84` | **`aria-label`** — screen readers announce the literal key. WCAG defect, not cosmetic. |
  | `components.multipleTextInput.add` | `MultipleTextInput.svelte:206` | visible button text |
  | `components.multipleTextInput.moveUp` | `MultipleTextInput.svelte:176` | visible button text |
  | `components.multipleTextInput.moveDown` | `MultipleTextInput.svelte:183` | visible button text |
  | `components.multipleTextInput.remove` | `MultipleTextInput.svelte:191` | visible button text |

  Reverse-parity is clean: 0 keys in `messages/` absent from `translations/` (`messages/en/lang.json` has no counterpart — expected, it is the locale-name catalog).
- **D-09 (MF2 plural declaration for `selectExact` only):** Author `selectExact` as an inlang **MF2 plural declaration** in the runtime catalog (the shape used by `questions.category.numQuestions`), so it is grammatically correct at count=1 rather than rendering "Select 1 options.". The remaining 6 keys are plain interpolation strings mirroring the type-gen source verbatim. **Accepted tradeoff:** the two catalogs now differ in shape for this one key, so a byte-diff no longer detects drift for it — D-10's parity check (key-set, not value-shape) is what carries drift detection instead. Do NOT push MF2 plurals back into the type-gen source or the 7 locales' wording.
- **D-10 (Key-set parity check — lands after the fix):** Add a unit test (or lint script) asserting `translations/{locale}` and `messages/{locale}` have **identical key sets**. ~30 lines; it just found 7 real bugs in one run; it makes the class structurally unreinventable. It will hard-fail until D-08 is complete, so sequence it after.
- **D-11 (Restore the withheld assertion + strip the obsolete comment):** Restore `/2.*3/` at `candidate-journey.spec.ts:813` **and strip the now-obsolete BLOCKER-130-05 comment block** (`candidate-journey.spec.ts:803-813`). Add assertions for the newly-fixed keys only where a spec already visits them — no new spec files for coverage's sake.
- **FYI (not a decision):** `apps/frontend/src/lib/paraglide/` is gitignored (`apps/frontend/.gitignore:19`, 0 files tracked) — generated output is not committed, so no regeneration artefacts land in the diff.

**FIX-03 — boolean answer guard**

- **D-12 (`isEmptyValue()`, NOT `== null` — documented roadmap deviation):** Use `isEmptyValue(localizedAnswer?.value)` (`@openvaa/core`) at `candidate/(protected)/questions/+page.svelte:58`. The roadmap's literal wording prescribes `== null`, but the sibling completion-gating path 30 lines away (`candidateContext.svelte.ts:233`) already uses `isEmptyValue()`, which returns `true` for `null`/`undefined`/`''`/`[]`/empty objects and `false` for `false` and `0`. With `== null`, a saved answer of `''` or `[]` would start rendering as **answered** on the overview while `unansweredOpinionQuestions` still counted it unanswered — trading one inconsistency for another. **This deviation is deliberate and operator-approved; record it in the SUMMARY and correct the roadmap/requirement wording accordingly.**
- **D-13 (Widen the sweep repo-wide):** A frontend-only grep for sibling truthiness guards on answer values already came back with `questions/+page.svelte:58` as the **only** site (the audit's "and in the completion gating" claim does not hold). Per operator decision, widen to a **repo-wide `!x.value` / falsy-guard audit across `packages/` too**, not just `apps/frontend/src`. Record the sweep result as evidence; fix any genuine `false`/`0`-swallowing guard found on answer-like values, and list anything deliberately left alone with a reason.
- **D-14 (Lock with E2E):** A candidate answers a boolean opinion question "No", returns to the overview, and sees it rendered as **answered**. This exercises the real save→reload→render path, which is where the bug lives. No unit test on `getSavedAnswer` (it is module-local to a `+page.svelte` and would need extraction to be testable).

**Verification gate**

- **D-15 (Keep 3× determinism):** Full E2E suite green to the **3×** standard — fresh `:5173` dev server and clean DB (`yarn db:reset`) per run, 0 failed / 0 did-not-run, count restarts from 0 after any fix. Not reduced to 1×: this phase touches the a11y settle logic, exactly the kind of change that has produced parallel-pressure-dependent flakes here before (the 2026-06-22 debug doc's original flake reproduced only under `--workers>1`).
- **D-16 (Static gates):** svelte-check stays **0/0**; `lint:check`, prettier `format:check`, and `typecheck:tests` clean. Unit suite green (D-10's parity check runs here).

### Claude's Discretion

- Exact naming/placement of the `contentTestId` field and how the route-entry type is expressed (interface vs. discriminated union), provided it is **required**.
- The fixture mechanics for reaching the filter-drawer scan route (D-05) — reuse an existing results-page fixture path if one fits.
- Whether the key-set parity check (D-10) is a vitest unit test or a lint script, and where it lives — provided it runs in the standard `yarn test:unit` / CI path.
- Plan decomposition and wave structure, subject to the single-`:5173` serialization constraint (E2E gate plans cannot parallelize) and to D-10 landing after D-08.

### Deferred Ideas (OUT OF SCOPE)

- **Catalog unification** — collapsing `translations/` and `messages/` into a single source so the duplication disappears. Explicitly rejected for this phase (refactor, not defect closure); D-10's parity check is the interim guard.
- **MF2 plurals in both catalogs** — correct grammar *and* shape parity, but touches the type-gen source and 7 locales' wording. Not now (D-09 takes the runtime-only variant).
- **A `--color-label` theme token** — considered and rejected for D-02 in favour of the existing `small-label`.
- **App-wide `.label` audit** — rejected scope broadening for FIX-01 (D-01).
- **`preview/+page.svelte:32` `dataRoot` alias-indirection warning** (audit §4.4) — out of scope, pre-existing, does not currently manifest.
- **DEF-120-03-01 feedback rate-limit teardown** (audit §4.5) — out of scope.

</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID | Description (current text — itself in-scope to correct per D-01c) | Research Support |
|----|-------------------------------------------------------------------|------------------|
| FIX-01 | "No primary-content text inherits DaisyUI `.label`'s 60%-alpha color. Settled axe scans on the elections selector return 0 color-contrast violations (currently 12/12 FAIL at 3.69:1…)." (`REQUIREMENTS.md:92`) | §A (a11y gate) — the 12/12-FAIL premise is **empirically disproved** this session (§A.1); the re-scoped deliverable is the typed `contentTestId` contract (§A.3), the `text-label` cleanup (§A.6), and the bookkeeping correction (§E). **New**: the harden surfaces one genuine AA violation (§A.5) — the D-07 budget. |
| FIX-02 | "`questions.multiChoice.selectExact` / `selectRange` resolve to real text in all 7 locales — added to the runtime Paraglide catalog…" (`REQUIREMENTS.md:93`) | §B — exact on-disk layout, the 7×7 verbatim values to mirror, the MF2 template, the Paraglide compile mechanics, and the parity-check host file. |
| FIX-03 | "A saved boolean opinion answer of `false` renders as answered on the candidate questions overview (`questions/+page.svelte:58` explicit null check)." (`REQUIREMENTS.md:94`) | §C — the exact guard + surrounding function, `isEmptyValue()` semantics and import path, the completed repo-wide sweep (1 hit), and the exact E2E step to convert into the lock. |

</phase_requirements>

---

## Summary

Three of the four premises this phase inherits were checked against running code this session, and the results reshape the plan more than CONTEXT.md anticipated.

**FIX-01 is confirmed already fixed app-side, and CONTEXT.md's re-scope is correct** — a settled-DOM axe scan of `/elections` (waiting for the data-driven `election-selector-option-label` before `awaitAnimationsSettled`) returns **0 violations in light AND dark**. So does `/` (home), the `/questions` intro, `/results` with entity cards rendered, and — newly scanned — the results **filter drawer with every filter row expanded**, in both themes. The `text-label` spans compute `rgb(51, 51, 51)` at `opacity: 1` (12.6:1), confirming the dead-class diagnosis exactly.

**But the harden does surface real fallout, and it is not where CONTEXT.md predicted.** Two findings change the plan:

1. **The `constituencies-selector` scan route has never scanned a constituency selector.** A raw `page.goto('/constituencies')` with no `electionId` is 307-redirected by `constituencies/+page.ts:60` to `/elections`. The existing entry settles on `getByRole('heading').first()` — which resolves on the *election* page — so the scan silently duplicates the elections scan. Verified: final URL `http://localhost:5173/elections`, `voter-constituencies-list` count 0, `election-selector-option-label` count 2.
2. **Once the route is made to actually reach the constituency selector, it fails the AA gate: `color-contrast` × 2 nodes, 1.52:1 (light) / 1.46:1 (dark).** Root cause is *not* the DaisyUI `.label` mechanism — it is `ConstituencySelector.svelte:296` `class:faded={!sections[sectionIndex].selectedId}`, and `.faded` is `@apply opacity-30` (`app.css:356-358`). `text-secondary` `#666666` at 30% opacity composites to `#d1d1d1` on white. This is steady state, not an in-flight animation, so `awaitAnimationsSettled` cannot clear it. **This directly conflicts with a CONTEXT.md out-of-scope line** ("Any change to `ConstituencySelector` (already uses opaque `.small-label`)") and with ROADMAP criterion 1's "`ConstituencySelector` is NOT affected — do not change it". See §A.5 and §F for the adjudication.

**FIX-02's key list is exactly right** — a full key-set diff of both catalogs across all 7 locales returns precisely the 7 keys in D-08's table, identically in every locale, with the only reverse-direction diff being the expected `lang.*` group. **FIX-03's single-site claim is confirmed** — a repo-wide falsy-guard sweep across `apps/` and `packages/` returns exactly one hit.

**Primary recommendation:** Harden the settle FIRST (it is the schedule risk and it has already been measured: the fallout is one component, two nodes). Sequence D-08 → D-10. Escalate the ConstituencySelector `.faded` conflict as a plan checkpoint rather than silently overriding a locked out-of-scope line.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Settled-DOM axe scan contract (`contentTestId`) | E2E test harness (`tests/tests/specs/a11y/`) | Product testids (`apps/frontend/src`) | The guarantee is a test-side type; it consumes testids the product already emits — no new product testids are required (see §A.4). |
| Muted-label token swap (`text-label` → `small-label`) | Browser / CSS-in-component (`NumericEntityFilter.svelte`) | Global theme (`app.css`, unchanged per D-03) | Purely a class swap onto an existing token; no theme token added. |
| Faded implied-constituency readout contrast | Browser / CSS-in-component (`ConstituencySelector.svelte`) | Global theme (`.faded` in `app.css`) | The `opacity-30` utility is global; the *use* is single-site (only consumer in the repo). Fix at the call site, not the token. |
| Runtime message resolution | Build-time codegen (Paraglide vite plugin → `src/lib/paraglide/`) | Static catalog files (`apps/frontend/messages/`) | `t()` reads compiled Paraglide output; the catalog JSON is the only editable source. No runtime/API tier involved. |
| Compile-time key typing | Build-time codegen (`tools/translationKey/generateTranslationKeyType.ts`) | Static catalog files (`src/lib/i18n/translations/`) | A **separate** generator with a **separate** source — this asymmetry IS the FIX-02 defect. |
| Catalog key-set parity guard | Frontend unit tests (vitest, `src/lib/i18n/tests/`) | — | Pure filesystem assertion; no browser, no DB. Belongs where the existing catalog tests already live. |
| Saved-answer emptiness predicate | Shared data package (`@openvaa/core` → re-exported by `@openvaa/data`) | Frontend route component | The predicate is canonical and already load-bearing in `candidateContext`; the route must consume it, not re-implement. |

---

## Project Constraints (from CLAUDE.md)

Directives extracted from `./CLAUDE.md` that bind this phase. Treat with the same authority as locked decisions.

| # | Directive | Bearing on this phase |
|---|-----------|-----------------------|
| C-1 | **E2E Hard Rule (cardinal failure):** no task may proceed or complete while any E2E test is failing. No "known-flaky" exemptions; a "did not run" counts as a failure. | The D-07 fallout (§A.5) MUST be closed in-phase; a `.skip`/`.fixme` on the constituencies scan is forbidden. |
| C-2 | **Prefer running the whole suite** (`yarn test:e2e`) for interim verification. | The 3× gate (D-15) is a full-suite run, not `--project=a11y-smoke`. |
| C-3 | **Test accessibility — app must be WCAG 2.1 AA compliant.** | Directly the FIX-01 subject; also makes the raw-key `aria-label` (`components.accordionSelect.listboxAriaLabel`) a genuine defect, not cosmetic. |
| C-4 | **Use TypeScript strictly — avoid `any`, prefer explicit types.** | The `contentTestId` field must be a real required field, not `Record<string, unknown>`. |
| C-5 | **Localization — all user-facing strings must support multiple locales.** | All 7 keys × 7 locales, no English-only stopgap. |
| C-6 | **Context Destructuring Rule (Svelte 5):** reactive accessors (`appSettings`, `dataRoot`, `locale`, `opinionQuestions`, …) must be read via `ctx.X`, never destructured. `dataRoot` additionally must be read **directly** inside the consuming tracking scope (no intermediate `$derived` alias). | `questions/+page.svelte` (FIX-03) already complies (`candCtx.X` reads at lines 41-43, 79, 114, 131, 136, 142). Do not regress it. `ConstituencySelector.svelte` takes `elections` as a prop — no context reads to break. |
| C-7 | **Svelte Warning-Accepted format:** `// svelte-warning: accepted — <rationale>` immediately above the offending line; use sparingly, prefer fixing at source. | Only relevant if a fix introduces a compiler warning; svelte-check must stay 0/0 (D-16). |
| C-8 | **Always check code against `.agents/code-review-checklist.md`.** | Notably: "changes pass WCAG A and AA"; "no repeated code within the PR or elsewhere"; "all new components/functions documented"; "avoid `any`". |
| C-9 | **Never commit sensitive data.** | No bearing (no secrets touched). |
| C-10 | **`db:*` scripts touch only the database; `dev:*` drive the full stack.** No `supabase:*` scripts. | Gate runbook must use `yarn db:reset`, never bare `npx supabase start` (see §D.3). |

---

## Standard Stack

No new packages are introduced by this phase. Every tool required is already a workspace dependency, verified present in the repo this session.

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@axe-core/playwright` | already a `tests` dep | WCAG 2.1 AA scanning inside Playwright | The existing `a11y-smoke` project is built on it; `AxeBuilder({ page }).withTags([...])` is the in-repo idiom `[VERIFIED: tests/tests/specs/a11y/a11y-smoke.spec.ts:35,207]` |
| `@playwright/test` | already a dep | E2E harness | The a11y gate + all fixtures `[VERIFIED: tests/playwright.config.ts]` |
| `@inlang/paraglide-js` (vite plugin) | already a dep | Compiles `messages/{locale}/*.json` → `src/lib/paraglide/` at dev/build time | `paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide', strategy: ['url','cookie','baseLocale'] })` `[VERIFIED: apps/frontend/vite.config.ts:10-14]` |
| `@inlang/plugin-message-format@4` + `@inlang/plugin-m-function-matcher@2` | pinned via CDN in project config | Message format + `m.*` function matching | `[VERIFIED: apps/frontend/project.inlang/settings.json:4-7]` |
| `vitest` | already a dep | Frontend unit suite (host for D-10) | `apps/frontend` `test:unit: vitest run` `[VERIFIED: apps/frontend/package.json scripts]` |
| `@openvaa/core` / `@openvaa/data` | workspace | `isEmptyValue()` | `[VERIFIED: packages/core/src/matching/missingValue.ts:18-26]`, re-exported `[VERIFIED: packages/data/src/internal.ts:19]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vitest unit test for D-10 | standalone lint script in `package.json` | Discretion allows either. **Recommend vitest** — `apps/frontend/src/lib/i18n/tests/translations.test.ts` already contains a battle-tested `flattenKeys` that handles inlang variant arrays as leaves (§B.6), so the parity check is a ~30-line addition with zero new plumbing and it lands automatically in `yarn test:unit` and CI. |
| `expect(...).toEqual(sortedKeys)` diff | set-difference with named directions | **Recommend explicit two-direction set difference** with the missing keys printed. A raw `toEqual` on two 1000+-key arrays produces an unreadable failure. |

**Installation:** none required.

---

## Package Legitimacy Audit

This phase installs **no external packages**. Every dependency it touches is already resolved in `yarn.lock` and in active use in the repo.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | — | No new packages |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram — the two-catalog i18n split (the FIX-02 mechanism)

```
                    ┌──────────────────────────────────────────┐
                    │  apps/frontend/src/lib/i18n/translations/ │
                    │  {locale}/{namespace}.json                │
                    │  (UNWRAPPED — namespace = FILENAME)       │
                    └───────────────┬──────────────────────────┘
                                    │  read at codegen time
                                    ▼
                    ┌──────────────────────────────────────────┐
                    │ tools/translationKey/                     │
                    │ generateTranslationKeyType.ts             │
                    │  · reads locales[0] only                  │
                    │  · flattens to dot-paths                  │
                    │  · appends lang.{locale} for each locale   │
                    └───────────────┬──────────────────────────┘
                                    ▼
                    src/lib/types/generated/translationKey.ts
                    → `type TranslationKey = 'a.b' | 'c.d' | …`
                                    │
                                    │  COMPILE-TIME ONLY
                                    ▼
   t(key: TranslationKey, params?)  ← wrapper.ts:20   ✅ key TYPE-CHECKS
                    │
                    ├── 1. getOverride(key)  ── backend translationOverrides ── hit? → return
                    │
                    ├── 2. (m as MessageModule)[key] ── compiled Paraglide message
                    │            │
                    │            └── SOURCE: apps/frontend/messages/{locale}/{ns}.json
                    │                        (WRAPPED — top-level key IS the filename,
                    │                         dotted namespaces are ONE literal key)
                    │                        ──▶ paraglideVitePlugin ──▶ src/lib/paraglide/
                    │                                                    (GITIGNORED)
                    │
                    └── 3. MISS → `return key`   ❌ RAW KEY RENDERED TO THE USER
```

The defect class: a key added only to the LEFT branch type-checks and ships, and silently renders its own name. `[VERIFIED: apps/frontend/src/lib/i18n/wrapper.ts:20-42]`, `[VERIFIED: apps/frontend/tools/translationKey/generateTranslationKeyType.ts]`

### System Architecture Diagram — the a11y scan settle contract (the FIX-01 mechanism)

```
  playwright project `a11y-smoke`  (depends: data-setup-base → e2e/base seed)
                    │
                    ▼
  page.goto(buildRoute({route, locale:'en'}))
                    │
                    ├── ⚠ +page.ts load() may 307-REDIRECT  ← the constituencies hole (§A.2)
                    ▼
  route.settle(page)          ← TODAY: getByRole('heading').first()
                    │            heading renders from a STATIC i18n title, so it
                    │            resolves BEFORE any data-driven content mounts
                    │
                    │  D-04: settle on route.contentTestId (data-driven anchor)
                    ▼
  awaitAnimationsSettled(page)   ← rAF, then await every FINITE Web Animation
                    │              (infinite loops excluded or the promise never settles)
                    │              ⚠ does NOT clear STEADY-STATE opacity (`.faded`) — §A.5
                    ▼
  new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()
                    ▼
  assertAxeGates(results, testInfo, name)
      · attach axe-violations-<name>.json
      · per-rule gates: aria-required-parent / list / button-name === 0
      · GLOBAL gate: results.violations.length === 0
      · defensive shape checks
```

`[VERIFIED: tests/tests/specs/a11y/a11y-smoke.spec.ts:85-99, 142-164, 171-209]`

### Pattern 1: The route-entry type as it exists today

```typescript
// Source: tests/tests/specs/a11y/a11y-smoke.spec.ts:135-164 (VERBATIM)
interface UnlocatedAxeRoute {
  name: string;
  routeId: Route;
  /** Role-based content settle BEFORE axe scan (never a network-idle settle) */
  settle: (page: Page) => Promise<void>;
}

const UNLOCATED_ROUTES: ReadonlyArray<UnlocatedAxeRoute> = [
  {
    name: 'home',
    routeId: 'Home',
    settle: async (page) => {
      await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 10000 });
    }
  },
  {
    name: 'elections-selector',
    routeId: 'Elections',
    settle: async (page) => {
      await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 10000 });
    }
  },
  {
    name: 'constituencies-selector',
    routeId: 'Constituencies',
    settle: async (page) => {
      await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 10000 });
    }
  }
];
```

### Pattern 2: Recommended shape after D-04

**What:** make `contentTestId` required, and make the free-form `settle` optional (extra steps only, e.g. opening a drawer).
**When to use:** every entry in the scan table, unlocated and located alike.

```typescript
// Recommended — planner's discretion on naming; the REQUIRED-ness is the contract.
interface AxeRoute {
  name: string;
  routeId: Route;
  /**
   * REQUIRED. The data-driven testid that proves the route's real content is in
   * the DOM. A route-level heading is NOT acceptable: headings render from a
   * static i18n title and resolve before any data-driven content mounts, which is
   * exactly how the elections scan passed against a DOM with no option labels.
   */
  contentTestId: string;
  /** OPTIONAL extra interaction AFTER the content settle (e.g. open a drawer). */
  settle?: (page: Page) => Promise<void>;
}
```

Runner body becomes:

```typescript
await page.goto(buildRoute({ route: route.routeId, locale: 'en' }));
await page.getByTestId(route.contentTestId).first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
await route.settle?.(page);
await awaitAnimationsSettled(page);
```

**Call sites to update:** exactly the three literals in `UNLOCATED_ROUTES` (`a11y-smoke.spec.ts:142-164`) plus the runner at `:198-227`. The three *located* scans (`:231`, `:243`, `:255`) are hand-written `voterJourneyTest` bodies, not table-driven — they are NOT covered by the type. **Recommendation:** either extend the table to cover them too (a `fixture` discriminant), or add an explicit in-file comment stating why they are exempt. Leaving them silently uncovered re-opens the same "structural vs. per-site discipline" hole D-04 exists to close.

### Anti-Patterns to Avoid

- **Settling an axe scan on `getByRole('heading')`:** the heading comes from a static i18n page title, so it is visible before any data-driven content mounts. This is the exact hole D-04 closes.
- **Assuming `page.goto(route)` lands on that route:** `+page.ts` `load()` can `redirect(307, …)`. Verified live for `/constituencies` (§A.2). Any new scan entry must be checked for loader redirects.
- **Relying on `awaitAnimationsSettled` to clear low contrast:** it only awaits *finite Web Animations*. A steady-state `opacity-30` class is invisible to it (§A.5).
- **Adding a key to `src/lib/i18n/translations/` only:** it type-checks and ships broken. This is the FIX-02 defect class.
- **Recursing into inlang variant arrays when flattening message keys:** an MF2 declaration is an ARRAY value and must be treated as a LEAF, or the parity check will produce phantom keys like `questions.category.numQuestions.0.match.…`. The existing helper already does this correctly (§B.6).
- **Destructuring reactive context accessors** (CLAUDE.md C-6) — none of the touched files currently do; do not introduce it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Flattening message catalogs to comparable key sets | A new recursive flattener | `flattenKeys` at `apps/frontend/src/lib/i18n/tests/translations.test.ts:23-34` | Already handles the inlang variant-array-as-leaf case, which a naive flattener gets wrong. `[VERIFIED: apps/frontend/src/lib/i18n/tests/translations.test.ts:23-34]` |
| "Is this answer empty?" | `== null`, `!value`, `value === ''` | `isEmptyValue()` from `@openvaa/data` (re-export of `@openvaa/core`) | Canonical, unit-tested, already the completion-gating predicate. Handles `''`/`[]`/`{}`/whitespace/invalid Date and correctly returns `false` for `false` and `0`. `[VERIFIED: packages/core/src/matching/missingValue.ts:18-26]` |
| Opening the results filter drawer in a test | Ad-hoc `getByTestId('entity-list-filter').click()` | `createEntityFilters(page).openFilterDialog()` | Handles the two-conditional-render `.first()` invariant and the documented `getByTestId('entity-filter-dialog')` unreliability by falling back to `getByRole('dialog', { name: /Filters/i })`. `[VERIFIED: tests/tests/fixtures/voter/entityFilters.fixture.ts:318-336]` |
| Expanding a collapsed filter row | Clicking the Expander header | `dialog.getFilter(target)` (auto-expands via the `expand or collapse` checkbox) | The Expander toggle is an internal checkbox; the fixture already encodes the correct interaction. `[VERIFIED: tests/tests/fixtures/voter/entityFilters.fixture.ts:216-236]` |
| Walking the voter to `/results` | New navigation code | `answeredVoterPage` fixture | Already consumed by two a11y scans. `[VERIFIED: tests/tests/specs/a11y/a11y-smoke.spec.ts:243,255]` |
| A muted-label colour token | A new `--color-label` theme variable | `.small-label` (`app.css:384`) | D-02 locks this; the token already exists and is AA-safe in both themes (§A.6). |

**Key insight:** every mechanism this phase needs already exists in-repo. The work is *wiring and correcting*, not building. The one genuinely new artefact is the cross-catalog parity assertion (D-10), and even that is a ~30-line addition to a file that already imports the right helpers.

---

## A. A11y scan harness (D-04, D-05, D-07)

### A.1 — Empirical baseline (measured this session)

Method: a throwaway probe spec was added under `tests/tests/specs/a11y/`, run via `npx playwright test -c ./tests/playwright.config.ts --project=a11y-smoke --grep probe134 --workers=1` against the live dev server on `:5173` and the `data-setup-base`-seeded DB, then **deleted** (`git status` verified clean afterwards). Each probe used the D-04 hardened settle (wait for the data-driven testid → `awaitAnimationsSettled`) and reported `AxeBuilder(...).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()` violations instead of asserting.

| Scan | Settled on | Light | Dark |
|------|-----------|-------|------|
| home (`/`) | `voter-home` | **0 violations** | **0 violations** |
| elections (`/elections`) | `election-selector-option-label` | **0 violations** | **0 violations** |
| questions intro | `voter-questions-start` | **0 violations** | (not re-run; existing scan is dark-less) |
| results **with entity cards rendered** | `entity-card` | **0 violations** | (n/a) |
| results **filter drawer, all rows expanded** | `entity-card` → `openFilterDialog()` → expand all | **0 violations** | **0 violations** |
| constituencies (raw `page.goto`) | — | **redirects to `/elections`** (§A.2) | same |
| constituencies (**really reached**) | `voter-constituencies-list` | **1 violation, `color-contrast` × 2 nodes** | **1 violation, `color-contrast` × 2 nodes** |

**Consequences:**

- **CONTEXT.md's FIX-01 correction is CONFIRMED.** `/elections` is 0-violation in both themes under a genuinely settled DOM. The `12/12 FAIL` figure in ROADMAP/REQUIREMENTS/audit is stale. Commit `0eb27c677` is `fix(a11y): override daisyUI .label muted text to pass WCAG 2.1 AA contrast`, dated `Mon Jun 22 19:59:14 2026 +0300` `[VERIFIED: git log 0eb27c677]`.
- **D-05's coverage gain is real but 0-fallout.** The filter drawer had never been scanned; it is clean in both themes.
- **D-07's fallout is exactly one component, two nodes** — but it is on a route CONTEXT.md declared out of scope. See §A.5 and §F.

### A.2 — 🔴 The `constituencies-selector` scan route has never scanned a constituency selector

`constituencies/+page.ts` `load()`:

```typescript
// Source: apps/frontend/src/routes/(voters)/constituencies/+page.ts:59-62 (VERBATIM)
  if (electionId && impliedConstituencyId) _redirect('Questions', nextForward);
  if (!electionId) _redirect('Elections', nextForward);
  // Show election selector
  return;
```

A raw `page.goto(buildRoute({ route: 'Constituencies', locale: 'en' }))` carries no `electionId`; `getImpliedElectionIds` cannot imply one for the 2-election `e2e/base` dataset, so line 60 fires `redirect(307, …'Elections')`. Measured: `finalURL=http://localhost:5173/elections`, `constituencyList=0`, `electionLabels=2`. The Playwright page snapshot on the failed wait shows the *election* selector heading and both election checkboxes.

**So the existing `constituencies-selector` test is a duplicate of the `elections-selector` test.** Its `getByRole('heading').first()` settle resolves on the election page's `<h1>Select an election</h1>` and it passes — twice per theme, for nothing.

Additionally, `ConstituencySelector.svelte:238` `data-testid="constituency-selector"` is **shadowed at the call site**: `constituencies/+page.svelte:184` passes `data-testid="voter-constituencies-list"` into `restProps`, which `concatClass(restProps, …)` spreads *after* the literal attribute. The live testid on that root `<div>` is `voter-constituencies-list`. The same shadowing applies on the elections page (`election-selector` → `voter-elections-list`, `elections/+page.svelte:118`). `[VERIFIED: apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte:238; apps/frontend/src/routes/(voters)/constituencies/+page.svelte:184; apps/frontend/src/lib/components/electionSelector/ElectionSelector.svelte:53; apps/frontend/src/routes/(voters)/elections/+page.svelte:118]`

**Recommended fix for the planner:** convert the constituencies entry to a *located* scan. The cheapest deterministic path, measured working this session:

```typescript
await page.goto(buildRoute({ route: 'Elections', locale: 'en' }));
await page.getByTestId(testIds.voter.elections.label).first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
await page.getByTestId(testIds.voter.elections.continue).click();
await page.waitForURL(/\/constituencies/, { timeout: TIMEOUTS.slowPage });
await page.getByTestId(testIds.voter.constituencies.list).first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
```

Resulting URL (measured): `http://localhost:5173/constituencies?electionId[0]=<uuid>&electionId[1]=<uuid>`. Both elections are pre-checked by `elections/+page.svelte:65-67`, so `Continue` is enabled immediately.

### A.3 — Exact current shape of the harness (all quoted verbatim in §Pattern 1 / below)

- **Route-entry type:** `interface UnlocatedAxeRoute { name: string; routeId: Route; settle: (page: Page) => Promise<void>; }` — `[VERIFIED: tests/tests/specs/a11y/a11y-smoke.spec.ts:135-140]`
- **`UNLOCATED_ROUTES`:** 3 entries (`home`/`Home`, `elections-selector`/`Elections`, `constituencies-selector`/`Constituencies`), each with the identical `getByRole('heading').first().waitFor({ state: 'visible', timeout: 10000 })` settle — `[VERIFIED: …:142-164]`
- **`settle` signature:** `(page: Page) => Promise<void>` — `[VERIFIED: …:139]`
- **`assertAxeGates(results, testInfo, routeName)`:** attaches `axe-violations-${routeName}.json`, asserts per-rule 0 for `aria-required-parent`, `list`, `button-name`, then the global `expect(results.violations).toHaveLength(0)`, then two defensive shape checks — `[VERIFIED: …:171-194]`
- **`awaitAnimationsSettled(page)`:** `page.evaluate` → one rAF → `document.documentElement.getAnimations({ subtree: true })` filtered to animations whose computed `endTime` is a finite number → `Promise.all(a.finished.catch(…))`. Infinite (looping) animations are deliberately excluded — `[VERIFIED: …:85-99]`
- **Runner:** module-level `for (const route of UNLOCATED_ROUTES)` emitting a light test and a `(dark)` test that `page.emulateMedia({ colorScheme: 'dark' })` first — `[VERIFIED: …:198-227]`
- **Located scans:** `questions` (`locatedVoterPage`, settles on `getByRole('heading').first()`), `results` (`answeredVoterPage`, settles on `getByRole('tablist').first()`), `voter-detail-drawer` (`answeredVoterPage`, settles on `tablist` → `entity-card` visible → click → `getByRole('dialog')` visible) — `[VERIFIED: …:231-278]`
- **Playwright project:** `{ name: 'a11y-smoke', testDir: './tests/specs/a11y', use: { ...devices['Desktop Chrome'] }, dependencies: ['data-setup-base'] }`, default-on, opt-out via `PLAYWRIGHT_NO_A11Y` — `[VERIFIED: tests/playwright.config.ts:151-161]`
- **Doc drift (cosmetic):** the spec's header comment says routes are `/en`, `/en/elections`, … but `buildRoute` (`tests/tests/utils/buildRoute.ts:10-19`) maps `[[lang=locale]]` segments — and `ROUTE.Home` is `'/(voters)'` with no locale segment — so the actual URLs are `/`, `/elections`, `/constituencies`. Paraglide's `url` strategy handles locale. Worth correcting alongside the settle work. `[VERIFIED: tests/tests/utils/buildRoute.ts:10-19; apps/frontend/src/lib/utils/route/route.ts:11-16]`

### A.4 — The data-driven testids to declare (exact strings, from the components)

| Scan route | `contentTestId` | Source of truth |
|---|---|---|
| home | `voter-home` (`testIds.voter.home.page`) | `MainContent title=… data-testid="voter-home"` `[VERIFIED: apps/frontend/src/routes/(voters)/+page.svelte:42]` — note this is *not* strictly data-driven; home has no data-gated content beyond the survey banner. It is still the correct "page content loaded" anchor and is documented as such at `tests/tests/utils/testIds.ts:149-154`. |
| elections | `election-selector-option-label` (`testIds.voter.elections.label`) | `<label class="label …" data-testid="election-selector-option-label">` inside `{#each elections as { id, name }}` `[VERIFIED: apps/frontend/src/lib/components/electionSelector/ElectionSelector.svelte:54-58]`; constant `[VERIFIED: tests/tests/utils/testIds.ts:159]` |
| constituencies | `voter-constituencies-list` (`testIds.voter.constituencies.list`) | The call-site testid that shadows `constituency-selector`, rendered only inside `{#if elections.length}` (page) → `{#if sections.length}` (component) `[VERIFIED: apps/frontend/src/routes/(voters)/constituencies/+page.svelte:170,179-184; ConstituencySelector.svelte:237-238]`; constant `[VERIFIED: tests/tests/utils/testIds.ts:164]` |
| questions intro (located) | `voter-questions-start` (`testIds.voter.questions.startButton`) | `[VERIFIED: tests/tests/utils/testIds.ts:211]`; the fixture already settles on it, so this is a no-op hardening |
| results (located) | `entity-card` (`testIds.voter.results.card`) | `[VERIFIED: tests/tests/utils/testIds.ts:250]` — **stricter than today's `tablist`**; measured 0 violations |
| filter drawer (NEW, D-05) | `entity-card` + `settle` = `createEntityFilters(page).openFilterDialog()` then expand every `entity-filter-row` | `[VERIFIED: tests/tests/utils/testIds.ts:250,274; tests/tests/fixtures/voter/entityFilters.fixture.ts:318-336, 216-236]` |
| voter-detail drawer (located) | keep `entity-card` then `getByRole('dialog')` (already correct) | `[VERIFIED: tests/tests/specs/a11y/a11y-smoke.spec.ts:258-263]` |

> There is **no per-option testid on the constituency selector.** `SingleGroupConstituencySelector.svelte` delegates to `<Select>` and emits none. `constituency-selector` on the root `<div>` is shadowed at the call site. So D-04's phrase "constituencies → the constituency option" resolves to `voter-constituencies-list`, which *is* data-gated (`{#if sections.length}`) and therefore a valid content anchor. `[VERIFIED: apps/frontend/src/lib/components/constituencySelector/SingleGroupConstituencySelector.svelte:71-78]`

### A.5 — 🔴 The D-07 fallout: `ConstituencySelector` `.faded` fails AA (2 nodes, both themes)

Measured on the *really reached* constituency selector:

```
constituencies-located:      total=1 :: color-contrast(serious) x2
  .mt-xs > .small-label:nth-child(1)  →  contrast 1.52  (fg #d1d1d1, bg #ffffff, 8.6pt/11.5px, normal)
  .small-label:nth-child(3)           →  contrast 1.52  (fg #d1d1d1, bg #ffffff, 8.6pt/11.5px, normal)
constituencies-located-dark: total=1 :: color-contrast(serious) x2
  same two nodes                       →  contrast 1.46  (fg #2a2a2a, bg #000000)
```

Root cause, verbatim:

```svelte
<!-- Source: apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte:293-303 (VERBATIM) -->
          {#if applicableElections.length > 1}
            <div
              class="mt-xs gap-x-md gap-y-sm grid w-full max-w-md grid-cols-2 items-center place-self-center transition-opacity"
              class:faded={!sections[sectionIndex].selectedId}>
              {#each applicableElections.toReversed() as election}
                {@const constituencyId = selected[election.id]}
                <div class="small-label">{election.shortName}</div>
                <div>{constituencyId ? getConstituency(constituencyId).name : '—'}</div>
              {/each}
            </div>
          {/if}
```

```css
/* Source: apps/frontend/src/app.css:356-358 (VERBATIM) */
  .faded {
    @apply opacity-30;
  }
```

`.faded` is the **only** `faded` usage in the whole frontend (`grep -rn faded apps/frontend/src` → one hit outside `app.css`). `text-secondary` is `#666666` (light) / `#8c8c8c` (dark) `[VERIFIED: apps/frontend/src/app.css:16,47]`; at `opacity: 0.3` these composite to `#d1d1d1` on white and `#2a2a2a` on black — exactly the measured values.

**Critical property:** this is a **steady state**, not an entrance animation. `awaitAnimationsSettled` awaits finite Web Animations; there is no animation running once the page settles. So no amount of settle hardening removes this — it needs a product change.

**Fix options for the planner (all AA-clearing):**

| Option | Change | Cost | Notes |
|---|---|---|---|
| **A (recommended)** | Gate the block on selection: `{#if applicableElections.length > 1 && sections[sectionIndex].selectedId}` and drop `class:faded` | 2-line diff | Removes the element from the a11y tree entirely when it has no content to show. Loses the "preview of what will be filled in" affordance and the `transition-opacity`. |
| B | Keep the block, replace `opacity-30` with a genuinely AA-safe muted treatment (e.g. keep `text-secondary` at full opacity and mark the row `aria-hidden` only when empty) | small | axe still scans `aria-hidden` subtrees for contrast in some configurations — must be re-measured, not assumed. |
| C | Raise `.faded` opacity until AA passes | 1-line | `#666` on white needs ~0.85 opacity to clear 4.5:1 — at which point "faded" is no longer visually meaningful. Also changes a global token used nowhere else. |
| D | Leave the violation and keep the constituencies scan pointed at the redirect target | — | **Forbidden.** Violates D-04 (the entry would declare a testid on a page it never reaches) and C-1/C-3. |

**⚠ This conflicts with two locked statements** — CONTEXT.md's out-of-scope list ("Any change to `ConstituencySelector` (already uses opaque `.small-label`)") and ROADMAP criterion 1 ("`ConstituencySelector` is NOT affected (uses opaque `.small-label`) — do not change it"). Both are written on the premise *"not affected by the DaisyUI `.label` alpha mechanism"*, which is **true** — this is a different mechanism (`opacity-30` on the parent). See §F for the recommended handling.

### A.6 — D-02: the `text-label` dead class, verified dead

```svelte
<!-- Source: apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte:84-85, 97-98, 112-113 (VERBATIM) -->
      <label class="label gap-xs !px-0">
        <span class="text-label min-w-[6rem] text-start">{t('entityFilters.numeric.minLabel')}</span>
…
      <label class="label gap-xs !px-0">
        <span class="text-label min-w-[6rem] text-start">{t('entityFilters.numeric.maxLabel')}</span>
…
      <label class="label gap-xs !px-0">
        <span class="text-label min-w-[6rem] justify-start text-start">{t('entityFilters.missingValue')}</span>
```

- `grep -rn "color-label\|--color-label" apps/frontend/src packages/app-shared/src` → **0 hits**. There is no `--color-label` token, so Tailwind generates no `.text-label` utility.
- Measured live in the open filter drawer: `textLabelSpans=2` (the min/max pair; the missing-values row does not render for this dataset), computed `["rgb(51, 51, 51) op=1","rgb(51, 51, 51) op=1"]` → `#333` on `#fff` ≈ 12.6:1. **Dead class confirmed; not a live violation.**
- **Line numbers:** CONTEXT.md's `85, 98, 113` are correct. ROADMAP/REQUIREMENTS say `84, 97, 112` — off by one (those are the enclosing `<label>` lines). Correct this as part of D-01c.
- **The swap changes appearance.** `.small-label` is `@apply text-secondary text-xs font-normal uppercase` `[VERIFIED: apps/frontend/src/app.css:384-386]`. So the labels go from `#333` at inherited size to `#666` at ~11.5px, **UPPERCASE**. Contrast after the swap: `#666666` on `#ffffff` = **5.74:1** ✓ AA; `#8c8c8c` on `#000000` = **6.24:1** ✓ AA. Preserve the sibling utilities: `class="small-label min-w-[6rem] text-start"` and `class="small-label min-w-[6rem] justify-start text-start"`.
- **`EnumeratedEntityFilter.svelte:198`** — `<label class="label gap-sm cursor-pointer !items-start !p-0" data-testid="entity-filter-option">`; its inner span carries no muted class and measured clean. Per D-02/CONTEXT, do not change. `[VERIFIED: apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte:198]`

### A.7 — D-05: the filter drawer, measured

- Reached via `answeredVoterPage` → wait `entity-card` → `createEntityFilters(page).openFilterDialog()`.
- **3 filter rows** render for `e2e/base` (candidates tab): `Party` (enumerated), `[qu-info-multipleChoiceCategorical] Info: pick multiple categories that apply.` (enumerated), `[qu-info-number] Info: years of experience.` (**numeric**).
- After expanding all rows and allowing the lazy `{#await import('./numeric')}` chunk to resolve: `numericInputs=1`. **`NumericEntityFilter` DOES render** with the base seed — the `filterable: true` flag on `test-e2e-base-qu-info-number` (`custom_data: { filterable: true, min: 0, max: 80 }`) is what puts it there. `[VERIFIED: packages/dev-seed/src/templates/e2e/base.ts:698-708; apps/frontend/src/lib/contexts/voter/filters/filterState.svelte.ts:62-69; apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte:61-64]`
- ⚠ **Timing pitfall:** the filter body components are dynamically imported (`{#await import('./numeric') then …}`). Counting immediately after clicking the Expander toggle returns 0. The scan must wait for a concrete inner locator (e.g. `entity-filter-numeric-min`) — or at minimum for `entity-filter-option` — before `awaitAnimationsSettled`. Encode this in the route's optional `settle`, not as a `waitForTimeout`.
- **Result: 0 violations, light and dark, with every row expanded.** D-05 is a pure coverage gain with no fallout.

### A.8 — D-07 risk inventory: which other routes race their content today

| Scan | Current settle | Data-driven content it may miss | Measured under hardened settle | Risk |
|---|---|---|---|---|
| home | `heading` | survey banner only (`{#if appSettings.survey?.showIn…}`) | 0 violations both themes | **LOW** |
| elections | `heading` | `{#if elections.length}` → ingress + `ElectionSelector` options | 0 violations both themes | **LOW** (already fixed by `0eb27c677`) |
| constituencies | `heading` | **never reached — redirects** | 1 violation × 2 nodes, both themes | **🔴 HIGH — the D-07 budget** |
| questions intro | `heading` | `{#if allowCategorySelection}` category list, `voter-questions-start` | 0 violations | **LOW** — the fixture already waits for `voter-questions-start` (`walkUntilQuestionsIntro`) |
| results | `tablist` | entity cards, match scores, list controls | 0 violations with `entity-card` settle | **LOW** |
| voter-detail drawer | `tablist` → `entity-card` → `dialog` | drawer body tabs/opinions | already the tightest settle in the file | **LOW** |
| filter drawer | *(does not exist)* | all filter bodies | 0 violations both themes | **LOW** |

**Total measured D-07 fallout: 1 component, 2 nodes, 4 test variants (light+dark × the constituencies scan).** That is a small, bounded budget — a materially better position than CONTEXT.md's "D-07 is the schedule risk in this phase" assumed.

> Caveat: these measurements were taken at `--workers=1` against a warm dev server. The 3× gate runs the full suite under parallel pressure, which is historically where a11y timing flakes surface (the 2026-06-22 debug doc's flake reproduced only at `--workers>1`). Treat the numbers as "no *latent contrast defects* beyond the one found", not as "no timing flakes possible".

---

## B. i18n catalogs (D-08, D-09, D-10)

### B.1 — The two catalogs' on-disk layout (structurally different — this matters for D-10)

| | Runtime (Paraglide) | Type-gen source |
|---|---|---|
| Path | `apps/frontend/messages/{locale}/{namespace}.json` | `apps/frontend/src/lib/i18n/translations/{locale}/{namespace}.json` |
| Locales | `da en et fi fr lb sv` (7 dirs) | same 7 dirs + `index.ts`, `translations.type.ts` |
| Files per locale | **47** | **46** (`lang.json` is runtime-only) |
| Top-level shape | **WRAPPED** — one top-level key equal to the filename, dotted namespaces are ONE literal key | **UNWRAPPED** — namespace comes from the filename |
| Values | string **or inlang MF2 variant ARRAY** | string only (ICU inline for plurals) |

Concrete proof:

```jsonc
// apps/frontend/messages/en/questions.json  (WRAPPED)
{ "questions": { "additionalActions": "Further actions for this question", … } }

// apps/frontend/src/lib/i18n/translations/en/questions.json  (UNWRAPPED)
{ "additionalActions": "Further actions for this question", … }

// apps/frontend/messages/en/candidateApp.questions.json  — dotted namespace is ONE key
{ "candidateApp.questions": { "answerQuestion": "Answer this question", … } }
```

`[VERIFIED: apps/frontend/messages/en/questions.json:1-3; apps/frontend/src/lib/i18n/translations/en/questions.json:1-2; apps/frontend/messages/en/candidateApp.questions.json:1-3]`

**Flattening rule for a parity check:** for a file `X.json`, the runtime key set is `flatten(messages/{loc}/X.json)` (already prefixed, because the top-level key IS `X`), and the type-gen key set is `X + '.' + flatten(translations/{loc}/X.json)`. Arrays are leaves.

### B.2 — `project.inlang/settings.json` — registration and constraints

```jsonc
{
  "baseLocale": "en",
  "locales": ["en", "fi", "sv", "da", "et", "fr", "lb"],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@2/dist/index.js"
  ],
  "plugin.inlang.messageFormat": { "pathPattern": [ "./messages/{locale}/about.json", … 47 entries … ] }
}
```

`[VERIFIED: apps/frontend/project.inlang/settings.json:1-59]`

- **`pathPattern` is an explicit 47-entry allowlist, not a glob.** Line 53 is `"./messages/{locale}/questions.json"` and line 38 is `"./messages/{locale}/components.json"` — both already registered, so **D-08 requires no `settings.json` edit**. A future *new namespace file* would.
- **7 locale codes:** `en fi sv da et fr lb` (declaration order; the `messages/` dirs sort as `da en et fi fr lb sv`).
- **Naming constraint:** file-per-namespace, and the file's single top-level key must byte-match the filename minus `.json`. Nesting below that is free.

### B.3 — Exactly where each of the 7 keys goes

| # | Key | Target file (× 7 locales) | Insert under |
|---|---|---|---|
| 1 | `questions.multiChoice.selectExact` | `apps/frontend/messages/{loc}/questions.json` | new `"multiChoice"` object under `"questions"`, between `"intro"` and `"next"` (alphabetical) |
| 2 | `questions.multiChoice.selectRange` | same | same object |
| 3 | `components.accordionSelect.listboxAriaLabel` | `apps/frontend/messages/{loc}/components.json` | existing `"components" → "accordionSelect"` (currently holds only `collapsedAriaInfo`) |
| 4 | `components.multipleTextInput.add` | same | **new** `"multipleTextInput"` object under `"components"` |
| 5 | `components.multipleTextInput.moveUp` | same | same object |
| 6 | `components.multipleTextInput.moveDown` | same | same object |
| 7 | `components.multipleTextInput.remove` | same | same object |

`messages/{loc}/components.json` top-level keys today: `accordionSelect, constituencySelector, headingGroup, input, matchScore, passwordInput, preHeading, preventNavigation, select, video, questionExtendedInfo`. Mostly alphabetical with `questionExtendedInfo` appended last — so the file is *not* strictly sorted and prettier does not sort JSON keys. Alphabetical placement is the dominant convention; either is defensible. `[VERIFIED: apps/frontend/messages/en/components.json]`

### B.4 — Verbatim values to mirror (all 7 keys × all 7 locales, read from `translations/`)

```
questions.multiChoice.selectExact
  en: "Select {count} options."
  fi: "Valitse {count} vaihtoehtoa."
  sv: "Välj {count} alternativ."
  da: "Vælg {count} muligheder."
  et: "Vali {count} valikut."
  fr: "Sélectionnez {count} options."
  lb: "Wielt {count} Optiounen."

questions.multiChoice.selectRange
  en: "Select {min} to {max} options."
  fi: "Valitse {min}–{max} vaihtoehtoa."
  sv: "Välj {min}–{max} alternativ."
  da: "Vælg {min}-{max} muligheder."
  et: "Vali {min}–{max} valikut."
  fr: "Sélectionnez {min} à {max} options."
  lb: "Wielt {min} bis {max} Optiounen."

components.accordionSelect.listboxAriaLabel
  en: "Select an option"     fi: "Valitse vaihtoehto"     sv: "Välj ett alternativ"
  da: "Vælg en mulighed"     et: "Valige suvand"          fr: "Sélectionner une option"
  lb: "Wielt eng Optioun"

components.multipleTextInput.add
  en: "Add item"     fi: "Lisää kohde"     sv: "Lägg till objekt"   da: "Tilføj element"
  et: "Lisa kirje"   fr: "Ajouter un élément"                       lb: "Element derbäisetzen"

components.multipleTextInput.moveUp
  en: "Move up"      fi: "Siirrä ylös"     sv: "Flytta upp"         da: "Flyt op"
  et: "Liiguta üles" fr: "Déplacer vers le haut"                    lb: "No uewen réckelen"

components.multipleTextInput.moveDown
  en: "Move down"    fi: "Siirrä alas"     sv: "Flytta ner"         da: "Flyt ned"
  et: "Liiguta alla" fr: "Déplacer vers le bas"                     lb: "No ënnen réckelen"

components.multipleTextInput.remove
  en: "Remove item"  fi: "Poista kohde"    sv: "Ta bort objekt"     da: "Fjern element"
  et: "Eemalda kirje" fr: "Supprimer l'élément"                     lb: "Element ewechhuelen"
```

`[VERIFIED: apps/frontend/src/lib/i18n/translations/{da,en,et,fi,fr,lb,sv}/{questions,components}.json — read programmatically this session]`

**None are missing from `translations/`** — all 7 keys are present in all 7 locales. Note the `–` (en dash) vs `-` (hyphen) inconsistency in `selectRange` (`da` uses a hyphen; `fi/sv/et` use en dashes). Mirror **verbatim** per D-09; do not normalise.

### B.5 — D-09: the MF2 plural template, verbatim

`questions.category.numQuestions` uses an identical shape in all 7 locales — `one` / `other` only, no locale-specific extra categories:

```jsonc
// Source: apps/frontend/messages/en/questions.json:16-28 (VERBATIM)
    "category": {
      "numQuestions": [
        {
          "declarations": ["input numQuestions", "local numQuestionsPlural = numQuestions: plural"],
          "selectors": ["numQuestionsPlural"],
          "match": {
            "numQuestionsPlural=other": "{numQuestions} questions",
            "numQuestionsPlural=one": "1 question"
          }
        }
      ],
      "skip": "Skip This Category"
    },
```

fi/sv/da/et/fr/lb are byte-identical in structure with only the strings differing (verified programmatically — e.g. `fr` uses `{"numQuestionsPlural=other": "{numQuestions} questions", "numQuestionsPlural=one": "1 question"}`; **no `many` category**, `other` acts as the catch-all).

The call site passes `count`:

```svelte
<!-- Source: apps/frontend/src/lib/components/questions/QuestionChoices.svelte:418-427 (VERBATIM) -->
{#if mode === 'answer' && multiConstraints}
  <p class="small-label text-secondary mt-md text-center" data-testid="question-choice-helper">
    {multiConstraints.effectiveMin === multiConstraints.effectiveMax
      ? t('questions.multiChoice.selectExact', { count: multiConstraints.effectiveMax })
      : t('questions.multiChoice.selectRange', {
          min: multiConstraints.effectiveMin,
          max: multiConstraints.effectiveMax
        })}
  </p>
{/if}
```

So the D-09 `selectExact` entry mirrors the template with `count`:

```jsonc
"multiChoice": {
  "selectExact": [
    {
      "declarations": ["input count", "local countPlural = count: plural"],
      "selectors": ["countPlural"],
      "match": {
        "countPlural=other": "Select {count} options.",
        "countPlural=one": "Select 1 option."
      }
    }
  ],
  "selectRange": "Select {min} to {max} options."
}
```

⚠ **Two things the planner should verify at build time, not assume:** (a) that `count` is an acceptable MF2 input name (it is not obviously reserved, but no in-repo precedent uses it — every existing declaration uses a `numX`/`minX` name); (b) that the singular wording per locale is grammatically right (e.g. `fi` "Valitse 1 vaihtoehto", `fr` "Sélectionnez 1 option."). A `checkpoint:human-verify` on the 7 singular strings is proportionate. The existing test `inlang variant syntax is used for plural messages (not ICU inline)` only inspects `results.json`, so it will not catch a malformed declaration here — a rendering check does.

### B.6 — D-10: key-set parity — the concrete implementation

**Host file: `apps/frontend/src/lib/i18n/tests/translations.test.ts`.** It already loads `messagesDir` and defines the exact flattener needed:

```typescript
// Source: apps/frontend/src/lib/i18n/tests/translations.test.ts:19-40 (VERBATIM)
/**
 * Recursive function to extract leaf keys, handling inlang variant arrays.
 * Variant arrays (array values) are treated as leaf nodes (same as string values).
 */
function flattenKeys(obj: unknown, prefix: string): Array<string> {
  const res: Array<string> = [];
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    // Leaf node (string, number, or variant array)
    res.push(prefix);
  } else {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      res.push(...flattenKeys(value, prefix ? `${prefix}.${key}` : key));
    }
  }
  return res.sort();
}

function getMessageKeys(locale: string, filename: string): Array<string> {
  const filePath = path.join(messagesDir, locale, filename);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return flattenKeys(content, filename.replace('.json', ''));
}
```

That `flattenKeys` handles D-09's array-shaped `selectExact` as a leaf, so it stays key-set-comparable with the string-shaped type-gen entry. This is precisely why D-09's shape divergence is safe.

Recommended addition (sketch — planner owns final form):

```typescript
const translationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)), '..', 'translations'
);

/** Type-gen source: namespace comes from the FILENAME, so prefix it in. */
function getTranslationKeys(locale: string): Array<string> {
  return fs
    .readdirSync(path.join(translationsDir, locale))
    .filter((f) => f.endsWith('.json'))
    .flatMap((filename) =>
      flattenKeys(
        JSON.parse(fs.readFileSync(path.join(translationsDir, locale, filename), 'utf8')),
        filename.replace('.json', '')
      )
    )
    .sort();
}

/**
 * `messages/{locale}/lang.json` (the locale display-name catalog) has no
 * `translations/` counterpart by design — `generateTranslationKeyType.ts`
 * synthesises `lang.{locale}` directly. It is the ONLY expected asymmetry.
 */
const EXPECTED_MESSAGES_ONLY = new Set(translationLocales.map((l) => `lang.${l}`));

describe.each(translationLocales)('catalog key-set parity — %s', (locale) => {
  test('every type-gen key exists in the runtime Paraglide catalog', () => {
    const runtime = new Set(
      fs.readdirSync(path.join(messagesDir, locale)).flatMap((f) => getMessageKeys(locale, f))
    );
    const missing = getTranslationKeys(locale).filter((k) => !runtime.has(k));
    expect(missing, `keys authored in translations/ but ABSENT from messages/ — t() will render the raw key`).toEqual([]);
  });

  test('every runtime key exists in the type-gen source', () => {
    const typegen = new Set(getTranslationKeys(locale));
    const extra = [...new Set(
      fs.readdirSync(path.join(messagesDir, locale)).flatMap((f) => getMessageKeys(locale, f))
    )].filter((k) => !typegen.has(k) && !EXPECTED_MESSAGES_ONLY.has(k));
    expect(extra, `keys in messages/ with no translations/ counterpart — TranslationKey will not type them`).toEqual([]);
  });
});
```

**Measured baseline before the fix** (run programmatically this session, identical in all 7 locales):

- in `translations/` but NOT in `messages/` (**7**): `components.accordionSelect.listboxAriaLabel`, `components.multipleTextInput.add`, `components.multipleTextInput.moveDown`, `components.multipleTextInput.moveUp`, `components.multipleTextInput.remove`, `questions.multiChoice.selectExact`, `questions.multiChoice.selectRange`
- in `messages/` but NOT in `translations/` (**7**): `lang.da`, `lang.en`, `lang.et`, `lang.fi`, `lang.fr`, `lang.lb`, `lang.sv` — the expected `lang.*` exclusion, and nothing else
- file-set diff: only `lang.json` is messages-only; `translations/` has no messages-less file

**This exactly reproduces D-08's 7-key list and D-08's "reverse-parity is clean" claim.** ✅

Non-JSON siblings in `translations/` (`index.ts`, `translations.type.ts`) must be filtered — hence `.filter(f => f.endsWith('.json'))`.

**Sequencing (hard):** D-10 fails by construction until D-08 lands. Put D-08 and D-10 in different waves, or the same plan with D-08's task strictly before D-10's.

**Existing frontend unit baseline (measured this session):** `yarn workspace @openvaa/frontend test:unit` → **54 files / 759 tests, all passing, ~3.5 s**. `yarn test:unit` at the root is `turbo run test:unit` across `packages/*` + `apps/*`, `dependsOn: ["build"]`, `cache: false`. `[VERIFIED: turbo.json:8-11; package.json scripts]`

### B.7 — Paraglide regeneration mechanics (D-08's "does this need a codegen command?")

**No manual codegen step.** `paraglideVitePlugin` compiles `messages/**` into `src/lib/paraglide/` as part of the normal Vite pipeline — so `yarn dev` and `yarn workspace @openvaa/frontend build` both regenerate. `[VERIFIED: apps/frontend/vite.config.ts:7-20]`

- `src/lib/paraglide/` is gitignored (`apps/frontend/.gitignore` → `# Paraglide generated output` / `src/lib/paraglide/`) — CONTEXT's FYI is confirmed; no generated artefacts in the diff. `[VERIFIED: apps/frontend/.gitignore:18-19]`
- ⚠ **HMR caveat:** editing a message JSON while `yarn dev` is running may serve a stale compiled module (a documented recurring gotcha in this repo — `project_e2e_hmr_staleness_restart`). **Restart the dev server before any E2E verification of the i18n fix.**
- The *type* side needs its own command if `translations/` changes: `yarn workspace @openvaa/frontend generate:translation-key-type`. **D-08 does not touch `translations/`**, so `translationKey.ts` needs no regeneration.
- Unit tests never see real Paraglide output — `vitest.config.ts` aliases `$lib/paraglide/{runtime,messages}` to mocks. So D-10 must be a **filesystem** assertion, not a `t()` call. `[VERIFIED: apps/frontend/vitest.config.ts:16-23]`

### B.8 — D-11: the withheld assertion and the comment block to strip

```typescript
// Source: tests/tests/specs/candidate/candidate-journey.spec.ts:802-815 (VERBATIM)
      // NOTE (BLOCKER-130-05 — runtime i18n gap, NOT asserted here): the helper's
      // TEXT currently renders the raw key `questions.multiChoice.selectRange`
      // rather than "Select 2 to 3 options.". The 129-06 helper-text work added
      // `questions.multiChoice.{selectRange,selectExact}` to the type-gen source
      // (`src/lib/i18n/translations/`, which is why the key type-checks) but NOT
      // to the runtime Paraglide catalog (`apps/frontend/messages/{locale}/
      // questions.json`), so `t()` (wrapper.ts) falls through to the raw key. This
      // is a real product i18n gap surfaced by this step; a `/2.*3/` content
      // assertion is deliberately withheld because (a) this is a specs-only phase
      // that must not patch product to make an assertion pass, and (b) asserting
      // the raw-key text would lock in the bug. Tracked as a blocker for a
      // follow-up product fix (add the two multiChoice keys to messages/).
      const helper = page.getByTestId(testIds.voter.questions.choiceHelper);
      await expect(helper).toBeVisible();
```

Strip lines 802-813 and add the restored content assertion immediately after line 815. The question under test is `[qu-opin-base-7-multichoice]` with `effectiveMin=2, effectiveMax=3`, so `selectRange` (not `selectExact`) renders → `/2.*3/` matches "Select 2 to 3 options.". `[VERIFIED: tests/tests/specs/candidate/candidate-journey.spec.ts:782-830]`

**Other newly-fixed keys already visited by existing specs** (D-11 says assert only where a spec already goes):

- `components.multipleTextInput.*` — the MultipleText round-trip is already covered; testids `multiple-text-{add,remove,move-up,move-down}` exist `[VERIFIED: tests/tests/utils/testIds.ts:202-206]`. Those Buttons render `text={t('components.multipleTextInput.…')}`, so an accessible-name assertion is a natural, zero-new-file lock.
- `components.accordionSelect.listboxAriaLabel` — `AccordionSelect` is rendered on the **results** route when `dataRoot.elections.length > 1` (`data-testid="voter-results-election-select"`), with no `aria-label` in `restProps`, so the fallback `t()` runs and the listbox is currently named with the raw key. `[VERIFIED: apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:349-358; AccordionSelect.svelte:82-85]` A `getByRole('listbox', { name: 'Select an option' })` assertion on the results route is the cheapest lock.

---

## C. FIX-03 (D-12, D-13, D-14)

### C.1 — ⚠ Path correction: there is no `[[lang=locale]]` route directory

CONTEXT.md, ROADMAP and the audit all cite `apps/frontend/src/routes/[[lang=locale]]/candidate/(protected)/questions/+page.svelte`. **That path does not exist.** The real file is:

```
apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte
```

`ROUTE.CandAppQuestions` is `` `${CANDIDATE_PROT}/questions` `` = `/candidate/(protected)/questions` — no locale segment anywhere in `ROUTE`. Locale is handled by Paraglide's `url` strategy, not a route param. CLAUDE.md's "Routing → Optional locale in all routes: `[[lang=locale]]`" is likewise stale. `[VERIFIED: apps/frontend/src/lib/utils/route/route.ts:1-6,46-56; filesystem]` The `[[lang=locale]]` string does survive in `tests/tests/utils/buildRoute.ts:14` as a defensive no-op mapping.

### C.2 — The guard and its surrounding function, verbatim

```svelte
<!-- Source: apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:52-65 (VERBATIM) -->
  /**
   * A utility for getting the saved answer for a given question, translating it if necessary, because the saved answers are `LocalizedAnswer`s.
   * NB. This makes answers non-reactive.
   */
  function getSavedAnswer(question: AnyQuestionVariant): Answer | undefined {
    const localizedAnswer = userData.savedCandidateData?.answers?.[question.id];
    if (!localizedAnswer?.value) return undefined;
    const { value, info } = localizedAnswer;
    const answer = {
      value: isLocalizedString(value) ? translate(value) : value,
      info: isLocalizedString(info) ? translate(info) : info
    };
    return question.ensureAnswer(answer);
  }
```

**Observable symptom** (from the consuming template): `{#if answer != null}` gates the display input at `:158`, and the card action Button at `:165-176` picks `t('candidateApp.questions.answerQuestion')` + `variant="main"` when `answer == null`, versus `t('candidateApp.questions.editAnswer')` otherwise. So a saved `false` shows **no answer readout** and an **"Answer this question"** primary CTA — while the page-level `completion` derived (`:40-46`, driven by `candCtx.unansweredOpinionQuestions`) already counts it as answered. That internal contradiction is the bug's signature. `[VERIFIED: apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:40-46,143,158-176]`

**Downstream is already `false`-safe:** `ensureAnswer(answer)` → `ensureValue(false)` → `value == null` is false → `BooleanQuestion._ensureValue(false)` → `ensureBoolean(false)` → `false`; `isMissingValue(false)` is `false`, so `{ ...answer, value: false }` is returned. Only line 58 discards it. `[VERIFIED: packages/data/src/objects/questions/base/question.ts:96-111; packages/data/src/objects/questions/variants/booleanQuestion.ts:21-23]`

### C.3 — `isEmptyValue()` — definition, semantics, import path

```typescript
// Source: packages/core/src/matching/missingValue.ts:14-26 (VERBATIM)
/**
 * Checks if the value is empty across different data types. Note that this is different from strictly checking for `MISSING_VALUE`.
 * NB. Will return `true` for strings containing only spaces, empty arrays and objects containing only empty properties.
 */
export function isEmptyValue(value: unknown | typeof MISSING_VALUE): boolean {
  if (value == null) return true;
  if (value instanceof Date) return isNaN(value.getTime());
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object')
    return Object.keys(value).length === 0 || Object.values(value).every((v) => isEmptyValue(v));
  if (typeof value === 'string') return value.trim() === '';
  return false;
}
```

`false` and `0` fall through every branch to `return false` → **not empty**. ✅ Exactly the D-12 semantics.

**⚠ Import-path nuance:** CONTEXT.md says `@openvaa/core`. That is where it is *defined* and it is exported from the core barrel (`packages/core/src/index.ts:15`). But the sibling site imports it from **`@openvaa/data`**:

```typescript
// Source: apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:2 (VERBATIM)
import { ENTITY_TYPE, isEmptyValue, QUESTION_CATEGORY_TYPE } from '@openvaa/data';
```

re-exported at `packages/data/src/internal.ts:19`:

```typescript
export { isValidId, isMissingValue, isEmptyValue, MISSING_VALUE, normalizeCoordinate, COORDINATE } from '@openvaa/core';
```

**Recommendation: import from `@openvaa/data`** to match the sibling and avoid adding a second import source in the same feature area. (`+page.svelte` already imports `AnyQuestionVariant`/`Answer` types from `@openvaa/data` at line 25.) `[VERIFIED: apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:2; packages/data/src/internal.ts:19; packages/core/src/index.ts:15]`

### C.4 — The sibling completion-gating path, verbatim (D-12's consistency target)

```typescript
// Source: apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:230-238 (VERBATIM)
  #unansweredOpinionQuestions = $derived.by(() => {
    const savedData = this.#userData.savedCandidateData;
    if (!savedData) return this.#opinionQuestions;
    return this.#opinionQuestions.filter((q) => isEmptyValue(savedData.answers?.[q.id]?.value));
  });

  #profileComplete = $derived(
    this.#unansweredRequiredInfoQuestions.length === 0 && this.#unansweredOpinionQuestions.length === 0
  );
```

Line 233 exactly as CONTEXT.md states. Line 227 (`#unansweredRequiredInfoQuestions`) uses the same predicate. **The audit's "and in the completion gating that reads the same helper" claim is therefore wrong** — the completion gating is already correct. Confirms CONTEXT correction #3.

### C.5 — D-13: repo-wide falsy-guard sweep — RESULTS (already executed this session)

Patterns run across `apps/**/src` and `packages/*/src`, excluding `node_modules` and `*.test.*`:

| # | Pattern | Hits |
|---|---|---|
| 1 | `grep -rnE '!\w+(\?)?\.value\b'` | **1** |
| 2 | `grep -rnE '(if\|\?\|&&\|\|\|\|return\|!)\s*!?(\w+\.)*answers\?*\.?\[[^]]+\]\??(\.value)?\b'` (minus `isEmptyValue`/`isMissingValue` lines) | 1 |
| 3 | `grep -rnE 'if \(!\w*[Aa]nswer'` | 10 |
| 4 | `grep -rnE '\.value \|\|'` | 0 |

Classification of every hit:

| Site | Guard | Verdict |
|---|---|---|
| `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:58` | `if (!localizedAnswer?.value) return undefined;` | 🔴 **GENUINE — the FIX-03 site. The only one.** |
| `apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts:108` | `if (proxy) return proxy.answers[question.id]?.value;` | benign — guards the *proxy object*, returns the value including `false` |
| `apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts:274` | `if (!updatedAnswers) throw new Error(…)` | benign — guards the answers *map* |
| `apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts:90` | `if (!hasAllAnswers)` | benign — boolean predicate |
| `apps/frontend/src/lib/api/utils/parseAnswers.ts:14,17` | `if (!answers) return undefined;` / `if (!answer) return;` | benign — guard the container / the answer object |
| `packages/argument-condensation/src/core/utils/condensation/getAndSliceComments.ts:55` | `if (!answer?.info?.trim())` | benign — `info` is a free-text string; empty string is correctly skipped |
| `packages/data/src/objects/questions/base/question.ts:97` | `if (!answer) return undefined;` | benign — guards the answer *object*; `ensureValue` then handles `false` correctly (§C.2) |
| `packages/dev-seed/src/supabaseAdminClient.ts:268,302` | `if (!answersByExtId) continue;` | benign — guards the lookup map |
| `packages/filters/src/filter/base/filter.ts:65` | `if (!hasAnswers(entity)) throw …` | benign — boolean predicate |

**Sweep conclusion: exactly ONE genuine `false`/`0`-swallowing guard on an answer-like value repo-wide.** Confirms D-13's expectation and disproves the audit's "two sites". The planner should re-run these greps as a recorded task (evidence for the SUMMARY) rather than trusting this document.

### C.6 — D-14: the exact spec + step to convert into the lock

`tests/tests/specs/candidate/candidate-journey.spec.ts`, **step 18.6** — it already walks the boolean question and already documents the defect while deliberately avoiding it:

```typescript
// Source: tests/tests/specs/candidate/candidate-journey.spec.ts:881-900 (VERBATIM)
      // Boolean (qu-opin-base-5): boolean → exactly 2 RADIO choices.
      await candidateQuestionsOverviewPage.goToQuestion(/\[qu-opin-base-5-boolean\]/);
      await expect(page).toHaveURL(/\/candidate\/questions\/[^/]+/, { timeout: TIMEOUTS.slowPage });
      const boolId = currentQuestionId(page);
      await expect(scopedChoicesByType(page, boolId, 'radio')).toHaveCount(2);
      await expect(scopedChoicesByType(page, boolId, 'checkbox')).toHaveCount(0);
      // Select the "yes" choice (index 1 → value `true`). OpinionQuestionInput
      // synthesizes boolean choices as ['no'→false, 'yes'→true]; the overview
      // card's getSavedAnswer treats a saved `false` as unanswered
      // (`if (!localizedAnswer?.value) return undefined` — +page.svelte:58, a
      // pre-existing falsy-value quirk), so a `false` answer would render no
      // display markup and defeat the answered-card round-trip below. Selecting
      // the truthy option keeps the round-trip observable without touching product.
      await candidateQuestionPage.selectChoice(1);
      await candidateQuestionPage.expectContinueEnabled();
      await candidateQuestionPage.clickContinue();
      await page.goto('/en/candidate/questions');
      const boolCard = candidateQuestionsOverviewPage.getQuestionCard(/\[qu-opin-base-5-boolean\]/);
      await expect(boolCard.first()).toBeVisible();
      await expect(boolCard.first().getByTestId('question-choice').first()).toBeVisible();
```

**Recommended edit (extend in place, do NOT add a new spec file):**

1. `selectChoice(1)` → `selectChoice(0)` — index 0 is the `false` ("no") choice.
2. Replace the 8-line workaround comment (`:887-893`) with a FIX-03 lock note.
3. Keep the two existing round-trip assertions — with `false` saved they now *prove* the fix (they fail on the unfixed build).
4. Add the discriminating assertion the current step lacks: the card action must read `editAnswer`, not `answerQuestion`:
   ```typescript
   await expect(boolCard.first().getByTestId(testIds.candidate.questions.cardAction))
     .toHaveText(/Edit Your Answer/i);
   ```
   (`testIds.candidate.questions.cardAction === 'candidate-questions-card-action'` `[VERIFIED: tests/tests/utils/testIds.ts:51]`; the English strings are `candidateApp.questions.editAnswer` = "Edit Your Answer" / `answerQuestion` = "Answer this question" `[VERIFIED: apps/frontend/messages/en/candidateApp.questions.json:2,5]`.)

**The seed data supports it:** `e2e/base` has a boolean **opinion** question `test-e2e-base-qu-opin-base-5-boolean` — `type: 'boolean'`, `name.en: '[qu-opin-base-5-boolean] Base opinion 5 — Boolean.'`, category `QG-Opin-Base`. `[VERIFIED: packages/dev-seed/src/templates/e2e/base.ts:843-845, 784]`

**Ripple check before committing:** with `false` saved, step 19 (`walkRemainingOpinionQuestions`) still sees the question as answered (`isEmptyValue(false) === false`), so completion/`profileComplete` are unaffected. Step 21 (preview) asserts opinion answers render — verify it does not assert the *specific* "yes" label. Also note `DEFAULT_OPINION_ANSWERS` in the seed sets `test-e2e-base-qu-opin-base-5-boolean: { value: false }` for some seeded candidates already (`base.ts:336,358`), so `false` values are already exercised elsewhere in the dataset.

---

## D. Verification gate (D-15, D-16)

### D.1 — Exact commands

| Gate | Command | Notes |
|---|---|---|
| Full E2E (3×) | `yarn test:e2e` → `playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe` | Includes `a11y-smoke` + `performance` by default (opt-out via `PLAYWRIGHT_NO_A11Y` / `PLAYWRIGHT_NO_PERF`) `[VERIFIED: package.json scripts; tests/playwright.config.ts:118-161]` |
| A11y only (iteration) | `npx playwright test -c ./tests/playwright.config.ts --project=a11y-smoke` | Pulls `data-setup-base` only; ~35 s for 6 scans at `--workers=1` (measured). **Not** a substitute for the 3× gate (C-2). |
| svelte-check 0/0 | `yarn workspace @openvaa/frontend check` → `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --fail-on-warnings` | `--fail-on-warnings` is what makes it a 0/0 gate `[VERIFIED: apps/frontend/package.json scripts]` |
| Lint + tests typecheck | `yarn lint:check` → `turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests` | `lint:check` **already runs `typecheck:tests`** `[VERIFIED: package.json scripts]` |
| Tests typecheck alone | `yarn typecheck:tests` → `tsc -p tests/tsconfig.json --noEmit` | |
| Prettier | `yarn format:check` → builds `@openvaa/app-shared…` then `prettier --check .` + docs | Covers the edited `messages/**/*.json` |
| Unit | `yarn test:unit` → `turbo run test:unit` (`dependsOn: build`, `cache: false`) | Frontend-only iteration: `yarn workspace @openvaa/frontend test:unit`. **Baseline measured this session: 54 files / 759 tests green.** |

### D.2 — Preconditions (D-15)

Per Phase 132 D-04/D-05 `[VERIFIED: .planning/phases/132-milestone-close-green-gate-svelte-check-zero-flip/132-CONTEXT.md:54-67]`:

- 3 **consecutive** full-suite runs, each with a **fresh** `:5173` dev server and a **clean DB** (`yarn db:reset` — no `default`-template pollution).
- No Playwright `webServer`; a stale server steals the port. Kill and relaunch between runs.
- **Any** failure → root-cause, fix, then **restart the count at 0**.
- "Did not run" = failure (cascade failures included).
- A NEW flake surfacing mid-gate is in-scope fix work, not an exemption.

### D.3 — Environment-wedge recovery runbook (D-15 / Phase 132 D-07)

- Repeated `db:reset` → storage **502**: `yarn db:stop && yarn db:start && yarn db:reset`, then assert the `public-assets` bucket exists.
- imgproxy 502: restart the stack.
- **NEVER** run bare `npx supabase start` from the repo root — it steals `:54322`.
- A run invalidated by a known infra wedge is **discarded and re-run**, not counted as a failure — but the discard must be logged.

`[VERIFIED: .planning/phases/132-milestone-close-green-gate-svelte-check-zero-flip/132-CONTEXT.md:65-67, 201-202]`

### D.4 — HMR staleness (repo-specific, applies squarely here)

Vite HMR can serve a stale SSR/large module mid-debug — a documented recurring gotcha in this repo. Because this phase edits **Paraglide message JSON** (compiled by a Vite plugin) and **CSS classes**, restart the dev server before trusting any E2E result. Fold this into each gate run's precondition list.

---

## E. Bookkeeping corrections (D-01c) — exact files and line ranges

| File | Lines | Stale claim | Correction |
|---|---|---|---|
| `.planning/ROADMAP.md` | **695** (criterion 1) | "the current state is 12/12 FAIL against a suite that passes only by missing the render window"; surfaces list `NumericEntityFilter.svelte:84,97,112`; "`ConstituencySelector` is NOT affected … do not change it" | 12/12-FAIL is **stale** — closed by `0eb27c677` (2026-06-22 19:59), measured 0 violations light+dark. Line numbers are `85,98,113`. The `ConstituencySelector` clause is true *for the `.label` mechanism* but the component has a **separate** `.faded`/`opacity-30` AA violation (§A.5) — rewrite so it does not read as a blanket exemption. |
| `.planning/ROADMAP.md` | **697** (criterion 3) | "uses an explicit null check (`== null`)" | Superseded by D-12 → `isEmptyValue()`. Also the cited path `candidate/(protected)/questions/+page.svelte:58` is correct here (no `[[lang=locale]]`). |
| `.planning/ROADMAP.md` | 696 (criterion 2) | scoped to 2 keys | Widen to the 7 keys of D-08 (`questions.json` **and** `components.json`). |
| `.planning/ROADMAP.md` | 691, 704 | "Plans: 0 plans" / "TBD" | Normal post-planning update. |
| `.planning/REQUIREMENTS.md` | **92** (FIX-01) | "currently 12/12 FAIL at 3.69:1"; `NumericEntityFilter.svelte:84,97,112` | Same corrections as ROADMAP:695. |
| `.planning/REQUIREMENTS.md` | **93** (FIX-02) | names only `selectExact`/`selectRange`, only `questions.json` | 7 keys across `questions.json` + `components.json`. |
| `.planning/REQUIREMENTS.md` | **94** (FIX-03) | "explicit null check" | → `isEmptyValue()` (D-12). |
| `.planning/REQUIREMENTS.md` | 201-203 | `Pending` | Flip to `Complete` at phase close. |
| `.planning/v2.14-MILESTONE-AUDIT.md` | **19** | frontmatter finding quote: "Settled axe scans fail 12/12; a11y-smoke passes only by intermittently missing the scan window." | Stale — record the `0eb27c677` closure and the measured 0/0. |
| `.planning/v2.14-MILESTONE-AUDIT.md` | **§4.1, 109-129** — esp. **119**, **121**, **124**, **127** | 119: "#858585 on #ffffff = 3.69:1"; 121: "settled axe scans failing 12/12"; 124: `NumericEntityFilter.svelte:84, 97, 112`; 127: "`ConstituencySelector` is **not** affected" | 119/121 stale (fixed `0eb27c677`); 124 line numbers → `85, 98, 113` and note the class is **dead**, not a live violation (measured `rgb(51,51,51)` at `opacity:1`); **127 is materially incomplete** — the constituency selector does carry an AA contrast failure via `.faded`, just not via `.label`. |
| `.planning/v2.14-MILESTONE-AUDIT.md` | **§4.3, 148-156** — esp. **156** | "and in the completion gating that reads the same helper. **Fix:** `if (localizedAnswer?.value == null)`" | The completion gating (`candidateContext.svelte.ts:227,233`) already uses `isEmptyValue()` and is correct — **single site**. Fix is `isEmptyValue()`, not `== null` (D-12). |
| `.planning/v2.14-MILESTONE-AUDIT.md` | §4.2, 131-146 | scoped to 2 keys | Widen to 7 (D-08). |
| `CLAUDE.md` (optional, out of scope but noted) | "Routing → Optional locale in all routes: `[[lang=locale]]`" | Stale — no such directory exists (§C.1) | Not in this phase's scope; worth a `/gsd-capture` todo. |

---

## Common Pitfalls

### Pitfall 1: Settling on a route that redirected away
**What goes wrong:** the scan passes against a completely different page.
**Why it happens:** `+page.ts` `load()` can `redirect(307, …)` based on `appSettings` and URL params; a role-based settle resolves on whatever page you landed on.
**How to avoid:** after `page.goto`, assert `page.url()` matches the intended route *or* wait on a testid unique to that route. D-04's `contentTestId` does the latter automatically — which is exactly how this was discovered.
**Warning signs:** a scan that has never failed, on a route with data-driven content.

### Pitfall 2: Expecting `awaitAnimationsSettled` to fix contrast
**What goes wrong:** you harden the settle, the violation persists, and you burn time re-hardening.
**Why it happens:** the helper only awaits *finite Web Animations*; a steady-state `opacity` utility is not an animation.
**How to avoid:** read the axe `failureSummary` — a composited colour like `#d1d1d1` on `#ffffff` at a token that is really `#666666` means an **ancestor opacity**, then find the class.
**Warning signs:** identical violation with and without the settle; a `class:` directive bound to component state.

### Pitfall 3: Counting lazily-imported filter inputs too early
**What goes wrong:** `numericInputs=0` even though the filter is there.
**Why it happens:** `EntityFilters.svelte` renders bodies via `{#await import('./numeric') then …}`.
**How to avoid:** wait for a concrete inner locator (`entity-filter-numeric-min` / `entity-filter-option`) before scanning. Never `waitForTimeout` in the shipped spec.
**Warning signs:** first observed this session — the initial probe reported 0 numeric filters; a 2 s pause revealed 1.

### Pitfall 4: Recursing into MF2 variant arrays when flattening
**What goes wrong:** phantom keys (`…numQuestions.0.match.numQuestionsPlural=one`) make parity fail spuriously and mask real drift.
**How to avoid:** treat `Array.isArray(value)` as a leaf — the in-repo `flattenKeys` already does.

### Pitfall 5: Forgetting the `lang.*` exclusion in the parity check
**What goes wrong:** the reverse-direction assertion reports 7 false positives per locale.
**Why it happens:** `messages/{locale}/lang.json` has no `translations/` counterpart by design; `generateTranslationKeyType.ts` synthesises `lang.{locale}` from the locale directory list.
**How to avoid:** an explicit, documented `EXPECTED_MESSAGES_ONLY` set — never a blanket "ignore file `lang.json`", which would also hide a real regression inside it.

### Pitfall 6: Editing message JSON with `yarn dev` running and trusting the result
**What goes wrong:** the browser serves a stale compiled Paraglide module; you "verify" a fix that is not loaded.
**How to avoid:** restart the dev server after touching `messages/**` before any E2E verification.

### Pitfall 7: Assuming `data-testid` on a component root is what the test sees
**What goes wrong:** locators target `constituency-selector` / `election-selector` and never resolve.
**Why it happens:** `{...concatClass(restProps, …)}` spreads *after* the literal attribute, so a call-site `data-testid` **overrides** the component's. Both selector components are affected.
**How to avoid:** check the call site, not just the component.

### Pitfall 8: `.small-label` is an appearance change, not just a colour change
**What goes wrong:** the filter drawer's min/max labels silently become UPPERCASE and ~11.5 px.
**How to avoid:** flag it in the plan (and, if the repo runs visual regression on that surface, refresh baselines). It is still AA-safe: 5.74:1 light / 6.24:1 dark.

---

## Runtime State Inventory

Not applicable — this is a defect-closure phase, not a rename/refactor/migration. No stored data, live-service config, OS registrations, secrets, or build artefacts embed a string being changed.

- **Stored data:** None — no DB values change. The `e2e/base` seed is read-only for this phase.
- **Live service config:** None.
- **OS-registered state:** None.
- **Secrets/env vars:** None.
- **Build artefacts:** `apps/frontend/src/lib/paraglide/` regenerates from the edited `messages/**` on the next `vite dev`/`vite build`; it is gitignored and never committed. No stale artefact risk beyond the HMR caveat (§B.7).

---

## Environment Availability

Probed live this session.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Frontend dev server `:5173` | E2E / a11y scans | ✓ | HTTP 200 on `/en` | — (must be freshly restarted per 3× run) |
| Supabase local API `:54321` | `data-setup-base`, all E2E | ✓ | HTTP 200 on `/rest/v1/` | — |
| `e2e/base` seed | a11y-smoke `dependencies: ['data-setup-base']` | ✓ | Applied automatically by the Playwright project chain (observed running) | — |
| `npx playwright` + Chromium | E2E | ✓ | ran 12 tests successfully | `yarn playwright install` |
| `@axe-core/playwright` | a11y scans | ✓ | resolved in probe run | — |
| `vitest` (frontend) | unit gate + D-10 | ✓ | 54 files / 759 tests green in 3.5 s | — |
| `node` / `yarn 4` | everything | ✓ | workspaces resolve | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

---

## Validation Architecture

`workflow.nyquist_validation` is **absent** from `.planning/config.json` → treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework (E2E) | `@playwright/test`, config `tests/playwright.config.ts` |
| Framework (unit) | `vitest` — frontend config `apps/frontend/vitest.config.ts` (jsdom, `globals: true`), orchestrated by `turbo run test:unit` |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` (~3.5 s) · `npx playwright test -c ./tests/playwright.config.ts --project=a11y-smoke` (~35 s) |
| Full suite command | `yarn test:e2e` + `yarn test:unit` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FIX-01 | Elections selector is 0-violation under a **settled** DOM, light + dark | e2e (axe) | `npx playwright test -c ./tests/playwright.config.ts --project=a11y-smoke -g "elections"` | ✅ `tests/tests/specs/a11y/a11y-smoke.spec.ts` (settle to harden) |
| FIX-01 | A scan route cannot be added without declaring `contentTestId` | compile-time | `yarn typecheck:tests` | ✅ same file (type to add) |
| FIX-01 | Constituency selector is scanned **and** 0-violation, light + dark | e2e (axe) | `… --project=a11y-smoke -g "constituenc"` | ⚠️ exists but scans the wrong page — **must be repointed** (§A.2) |
| FIX-01 | Filter drawer (numeric + enumerated) is scanned, 0-violation, light + dark | e2e (axe) | `… --project=a11y-smoke -g "filter"` | ❌ **Wave 0** — new scan entry |
| FIX-01 | `NumericEntityFilter` labels use `small-label` | e2e (axe) + visual | covered by the filter-drawer scan | ❌ Wave 0 (same entry) |
| FIX-02 | Multi-choice helper renders real text, not the raw key | e2e | `yarn test:e2e --project=candidate-journey -g "18.5"` | ✅ `tests/tests/specs/candidate/candidate-journey.spec.ts:782` (restore `/2.*3/`) |
| FIX-02 | `MultipleTextInput` buttons carry translated accessible names | e2e | existing MultipleText round-trip step | ✅ existing spec (add name assertion) |
| FIX-02 | Results election listbox has a translated `aria-label` | e2e | `… --project=a11y-smoke -g "results"` or the voter journey | ✅ existing scan (add `getByRole('listbox', { name: 'Select an option' })`) |
| FIX-02 | Catalog key sets are identical (drift guard) | unit | `yarn workspace @openvaa/frontend test:unit -t "parity"` | ❌ **Wave 0** — add to `src/lib/i18n/tests/translations.test.ts` |
| FIX-03 | A saved boolean `false` renders as answered on the overview | e2e | `yarn test:e2e --project=candidate-journey -g "18.6"` | ✅ `candidate-journey.spec.ts:865` (flip `selectChoice(1)`→`(0)`, add cardAction text assertion) |
| FIX-03 | No falsy guard swallows `false`/`0` on answer values repo-wide | manual (grep, recorded) | the 4 greps in §C.5 | manual-only — justified: a lint rule for this shape would be a phase of its own; the sweep is recorded as evidence per D-13 |

### Sampling Rate

- **Per task commit:** `yarn workspace @openvaa/frontend test:unit` (3.5 s) + `yarn typecheck:tests`
- **Per wave merge:** `--project=a11y-smoke` (a11y waves) / `--project=candidate-journey` (i18n + FIX-03 waves) + `yarn lint:check`
- **Phase gate:** full `yarn test:e2e` **3×** (D-15) + `yarn test:unit` + `yarn workspace @openvaa/frontend check` (0/0) + `yarn format:check`

### Wave 0 Gaps

- [ ] New filter-drawer scan entry in `tests/tests/specs/a11y/a11y-smoke.spec.ts` — covers FIX-01 (`NumericEntityFilter` / `EnumeratedEntityFilter`)
- [ ] Repointed constituencies scan entry (located walk) — covers FIX-01 and surfaces the D-07 fallout
- [ ] Cross-catalog parity test in `apps/frontend/src/lib/i18n/tests/translations.test.ts` — covers FIX-02 (**must land after D-08**)
- [ ] No framework install needed — Playwright, axe, and vitest are all present and green.

---

## Security Domain

`security_enforcement` is absent from `.planning/config.json` → treated as enabled. This phase is a UI/i18n/test defect closure with no auth, network, or data-boundary surface, so most categories are N/A — recorded explicitly rather than omitted.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth code touched. The candidate-journey spec authenticates, but via existing fixtures. |
| V3 Session Management | no | Untouched. |
| V4 Access Control | no | Untouched. `constituencies/+page.ts`'s `VOTER_ROUTE_WHITELIST` open-redirect guard is adjacent to the constituencies work — **do not modify it**; §A.2's fix drives the UI, not the loader. |
| V5 Input Validation | **partial** | i18n message values are static build-time content compiled by Paraglide, not user input. Interpolation placeholders (`{count}`, `{min}`, `{max}`) are numbers from `multiConstraints`. No `{@html}` involved — `QuestionChoices.svelte:419-426` renders text nodes. |
| V6 Cryptography | no | Untouched. |
| V7 Error Handling / Logging | no | Untouched. |
| V14 Configuration | **partial** | `project.inlang/settings.json` is a build-config allowlist; adding to it (not needed for D-08) would widen what gets compiled into the client bundle. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via a translation string rendered with `{@html}` | Tampering | Not applicable here — the 7 call sites all render text nodes / `aria-label` / Button `text` props. Keep it that way; never route a new message through `{@html}`. |
| Open redirect via `?next=` on the constituency/election selectors | Tampering | Already mitigated by the `VOTER_ROUTE_WHITELIST` re-check at `constituencies/+page.svelte:130-134` (defence-in-depth over the `(located)/+layout.ts` entry-point check). §A.2's change must not touch this path. |
| Accessibility failure as an exclusion harm | (WCAG, not STRIDE) | The AA gate itself — 0 axe violations across all scanned routes in both themes. |
| Supply chain (new dependency) | Tampering | N/A — no packages added. |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.label` renders muted via daisyUI `color-mix(… 60%, transparent)` | Global `.label { color: inherit }` override in `app.css @layer utilities` | commit `0eb27c677`, 2026-06-22 | The FIX-01 app-side defect is **already closed**; the ROADMAP/audit text predates it |
| a11y settle via `getByRole('heading')` | (this phase) required `contentTestId` per route entry | Phase 134 | Makes "the scan saw the real content" structural, not per-site discipline |
| ICU inline plurals (`{n, plural, …}`) in message catalogs | inlang MF2 variant declarations (`declarations`/`selectors`/`match`) | pre-existing; enforced by `translations.test.ts:83-94` for `results.json` | D-09's `selectExact` must use the MF2 shape in `messages/`, ICU stays in `translations/` |
| `[[lang=locale]]` route param | Paraglide `url` locale strategy, no locale route segment | pre-Phase-134 (Paraglide migration) | Every doc citing `routes/[[lang=locale]]/…` is stale (§C.1) |
| Truthiness guards on answer values | `isEmptyValue()` as the canonical predicate | Phase 113-era `candidateContext` | FIX-03 brings the last outlier in line |

**Deprecated/outdated:**
- `text-label` — a class with no CSS rule anywhere; replaced by `small-label` (D-02).
- `testIds.voter.constituencies.selector` (`'constituency-selector'`) and the literal `election-selector` — both shadowed by call-site testids; effectively dead at their only call sites.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `count` is an acceptable MF2 `input` variable name for the inlang message-format plugin (no in-repo precedent — every existing declaration uses `numX`/`minX`). | §B.5 | The `selectExact` message fails to compile or renders wrong; caught immediately by a dev-server render or the restored E2E assertion. |
| A2 | The proposed singular wordings for `selectExact` in the 6 non-English locales are grammatically correct (they are my constructions from the existing plural strings, **not** authored translations). | §B.5 | Grammatically odd UI text in a non-English locale. **Recommend a `checkpoint:human-verify` on the 7 singular strings.** |
| A3 | The `.faded` contrast fix will not regress the constituency-selection UX in a way the operator objects to. | §A.5 | Rework. Mitigated by presenting options A–C at a checkpoint rather than picking silently. |
| A4 | The 0-violation measurements hold under full-suite parallel pressure (they were taken at `--workers=1` on a warm server). | §A.1, §A.8 | A timing flake appears during the 3× gate. Mitigated by the `contentTestId` settle being *stricter* than today's, and by D-15's restart-the-count rule. |
| A5 | Prettier will accept the hand-authored JSON formatting of the new message blocks without reflowing them into a diff the author did not intend. | §B.3 | `format:check` fails; trivially fixed by `yarn format`. |
| A6 | Step 21 (candidate preview) does not assert the *specific* "yes" label of the boolean opinion answer, so flipping step 18.6 to `false` will not cascade. | §C.6 | Step 21 fails. Cheap to check before editing — read `candidate-journey.spec.ts:967-990`. |

---

## Open Questions

1. **Does the `ConstituencySelector` `.faded` fix fall inside or outside this phase's scope?**
   - What we know: it is a genuine, measured WCAG 2.1 AA failure (1.52:1 / 1.46:1, 2 nodes, both themes) on a route that D-04 forces into honest coverage. D-07 says surfaced violations are fixed in-phase and explicitly says *do not checkpoint the decision back to the operator*.
   - What's unclear: CONTEXT.md's out-of-scope list and ROADMAP criterion 1 both say "do not change `ConstituencySelector`". Those statements were written on the premise "not affected by the `.label` alpha mechanism" — which remains true. A different mechanism arguably falls outside the exclusion's stated rationale.
   - Recommendation: **fix it in-phase (D-07 wins), but insert a `checkpoint:human-verify` on the *fix option* (A/B/C in §A.5), not on the decision to fix.** That honours D-07's "don't ask permission to fix" while respecting that a locked out-of-scope line is being crossed on a technicality. Record the reasoning in the SUMMARY alongside the D-12 deviation.

2. **Should the three *located* a11y scans also be driven by the typed table?**
   - What we know: D-04 mandates a required `contentTestId` on "the route-entry type"; only the 3 `UNLOCATED_ROUTES` entries are table-driven today.
   - What's unclear: whether the intent extends to the hand-written located scans.
   - Recommendation: extend the table (a `fixture` discriminant, e.g. `'raw' | 'located' | 'answered'`) so the guarantee is uniform. If that proves awkward, at minimum add an explicit in-file comment naming the exemption — silence re-opens the hole.

3. **Does the `constituencies-selector` scan keep its name once repointed?**
   - Recommendation: rename to something unambiguous (e.g. `constituencies-selector-located`) so the attachment filenames (`axe-violations-<name>.json`) and any downstream triage do not silently inherit the old, misleading identity.

---

## Sources

### Primary (HIGH confidence — read this session)

- `tests/tests/specs/a11y/a11y-smoke.spec.ts` (full file) — route-entry type, settle, `assertAxeGates`, `awaitAnimationsSettled`, located scans
- `tests/playwright.config.ts:87-190` — project wiring, `a11y-smoke` dependencies, opt-out envs
- `tests/tests/utils/testIds.ts` (full file) — every testid constant quoted
- `tests/tests/utils/buildRoute.ts` (full file) — URL construction
- `tests/tests/fixtures/voter/entityFilters.fixture.ts:1-120, 200-360` — `openFilterDialog`, `getFilter` auto-expand
- `tests/tests/fixtures/voter/voter-journey.fixture.ts` (grepped structure) — `walkUntilQuestionsIntro`, `answeredVoterPage`, `locatedVoterPage`
- `tests/tests/fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts` (grepped API) — `getQuestionCard`, `goToQuestion`
- `tests/tests/specs/candidate/candidate-journey.spec.ts:780-940` — steps 18.5 / 18.6, the withheld assertion, the BLOCKER-130-05 comment
- `apps/frontend/src/lib/components/electionSelector/ElectionSelector.svelte` (full file)
- `apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte` (full file) + `SingleGroupConstituencySelector.svelte:1-78`
- `apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte` (full file)
- `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte:185-215`
- `apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte` (full file)
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte:410-430`
- `apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte:75-95`
- `apps/frontend/src/lib/components/input/MultipleTextInput.svelte:170-210`
- `apps/frontend/src/routes/(voters)/elections/+page.svelte`, `.../constituencies/+page.svelte`, `.../constituencies/+page.ts`, `.../+page.svelte` (home), `.../(located)/results/[[electionTab]]/+layout.svelte:340-365`
- `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:1-205`
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:2, 215-250`
- `apps/frontend/src/lib/contexts/voter/filters/filterState.svelte.ts:30-90`
- `apps/frontend/src/app.css:16,47,356-358,378-396,480-495`
- `apps/frontend/src/lib/i18n/{init,overrides,wrapper}.ts`, `tools/translationKey/generateTranslationKeyType.ts`, `src/lib/i18n/translations/index.ts`
- `apps/frontend/src/lib/i18n/tests/translations.test.ts` (full file)
- `apps/frontend/{vite,vitest}.config.ts`, `apps/frontend/package.json`, `apps/frontend/.gitignore`, `apps/frontend/project.inlang/settings.json`
- `apps/frontend/messages/{7 locales}/{questions,components,candidateApp.questions}.json` + full key diff of all 47×7 files
- `apps/frontend/src/lib/i18n/translations/{7 locales}/{questions,components}.json` + full key diff
- `packages/core/src/matching/missingValue.ts`, `packages/core/src/index.ts:15-16`, `packages/data/src/internal.ts:19`, `packages/data/src/objects/questions/base/question.ts:80-130`, `packages/data/src/objects/questions/variants/booleanQuestion.ts`
- `packages/dev-seed/src/templates/e2e/base.ts:693-760, 784, 843-856, 995`
- `turbo.json`, root `package.json`
- `.planning/{ROADMAP,REQUIREMENTS,STATE,v2.14-MILESTONE-AUDIT}.md`, `.planning/phases/132-…/132-CONTEXT.md`, `.planning/phases/134-…/134-CONTEXT.md`
- `CLAUDE.md`, `.agents/code-review-checklist.md`
- `git log -1 0eb27c677` / `git show --stat 0eb27c677`

### Live measurement (HIGH confidence — executed this session)

- Throwaway probe spec run under `--project=a11y-smoke --workers=1` against the running `:5173` dev server + `data-setup-base`-seeded DB, two rounds, 12 + 6 tests. Probe file and its `playwright-results/` artefacts **deleted**; `git status` verified clean.
- `yarn workspace @openvaa/frontend test:unit` → 54 files / 759 tests green.
- Programmatic cross-catalog key diff over all 7 locales × 47/46 files.
- Repo-wide falsy-guard greps (4 patterns) over `apps/` + `packages/`.
- `curl` probes of `:5173` and `:54321`.

### Secondary (MEDIUM confidence)

- WCAG 2.1 AA contrast ratios for `#666666`/`#8c8c8c` (5.74:1 / 6.24:1) — computed from the relative-luminance formula, not measured by axe. The axe-measured figures quoted (1.52 / 1.46 / 12.6 / 3.69) are tool output.

### Tertiary (LOW confidence)

- Assumption A1 (MF2 `count` input name) and A2 (non-English singular wordings) — see the Assumptions Log. No external source consulted; these are the only claims in this document not verified against a tool or file this session.

---

## F. Sequencing, risk, and CONTEXT corrections — planner action list

### F.1 Hard sequencing constraints

1. **D-08 (add the 7 keys) → D-10 (parity check).** D-10 fails by construction otherwise. Different waves, or one plan with strict task order.
2. **Harden the settle EARLY** (CONTEXT §specifics). The D-07 fallout is now known and bounded (§A.5), but the fix option needs operator input — get that question asked in the first wave, not during the 3× gate.
3. **E2E gate plans serialize.** One `:5173` server; no parallel E2E waves (CONTEXT integration-points).
4. **Restart the dev server** after any `messages/**` or CSS edit before E2E verification (§B.7, §D.4).

### F.2 Recommended checkpoints

| Checkpoint | Why |
|---|---|
| `checkpoint:human-verify` — **which `.faded` fix option (A/B/C)** for `ConstituencySelector` | Crosses a locked out-of-scope line on a technicality; the options differ in UX, not just code (§A.5, Open Question 1). |
| `checkpoint:human-verify` — **the 7 singular strings for `selectExact`** | Non-English grammar the agent cannot verify (Assumption A2). |
| (optional) `checkpoint:human-verify` — **`small-label` UPPERCASE appearance change** in the filter drawer | Visual change to a shipped surface (§A.6, Pitfall 8). |

### F.3 CONTEXT.md statements that did NOT hold when checked against code

Stated plainly, as requested — no papering over:

| CONTEXT.md statement | Verdict | Evidence |
|---|---|---|
| FIX-01 correction: "the app-side defect is already fixed … 0 total violations, 0 color-contrast, light AND dark" | ✅ **CONFIRMED** | §A.1 — measured 0/0 on `/elections` in both themes with a hardened settle |
| "`NumericEntityFilter`'s `text-label` spans … are a **dead class, not a live violation**" | ✅ **CONFIRMED** | §A.6 — measured `rgb(51,51,51) op=1` |
| FIX-02: "it is 7 keys, not 2" + the exact 7-key table + "reverse-parity is clean" | ✅ **CONFIRMED EXACTLY** | §B.6 — full 7-locale key diff reproduces the list byte-for-byte |
| FIX-03: "Single site, not two" | ✅ **CONFIRMED** | §C.4, §C.5 — completion gating already uses `isEmptyValue`; repo-wide sweep returns 1 hit |
| D-04: "constituencies → **the constituency option**" | ⚠️ **PARTLY WRONG** | There is no per-option testid; the correct anchor is `voter-constituencies-list`. More importantly the route **never reaches the selector** — it 307-redirects to `/elections` (§A.2). D-04 cannot be satisfied on this route without converting it to a located walk. |
| D-05: "`NumericEntityFilter` / `EnumeratedEntityFilter` … are currently scanned by **nothing**" | ✅ **CONFIRMED**, and the new coverage is **0-violation** in both themes | §A.7 — 3 filter rows including 1 numeric; clean |
| Out of scope: "**Any change to `ConstituencySelector`** (already uses opaque `.small-label`)" | 🔴 **CANNOT HOLD alongside D-04 + D-07** | §A.5 — a `.faded`/`opacity-30` AA violation (1.52:1 / 1.46:1, 2 nodes) surfaces the moment the route is honestly scanned. The exclusion's stated rationale (`.small-label` is opaque) is true; the conclusion (therefore no change needed) is not. |
| D-12: "`isEmptyValue()` (`@openvaa/core`)" | ⚠️ **IMPRECISE** | Defined in `@openvaa/core`, but the sibling site imports it from `@openvaa/data` (`candidateContext.svelte.ts:2`). Recommend matching the sibling (§C.3). |
| Canonical ref: `apps/frontend/src/routes/[[lang=locale]]/candidate/(protected)/questions/+page.svelte:58` | ⚠️ **PATH WRONG** | No `[[lang=locale]]` directory exists. Real path: `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:58` (line number correct) (§C.1). |
| Canonical ref: `NumericEntityFilter.svelte:85,98,113` | ✅ **CORRECT** (ROADMAP/REQUIREMENTS' `84,97,112` are the enclosing `<label>` lines) | §A.6 |
| Canonical ref: `candidate-journey.spec.ts:803-813` comment block, `:813` assertion site | ✅ **CORRECT** (the assertion lands after `:815`) | §B.8 |
| Canonical ref: `project.inlang/settings.json:53` | ✅ **CORRECT** — `"./messages/{locale}/questions.json"`; `components.json` is line 38, also already registered | §B.2 |
| Canonical ref: `app.css:384` (`small-label`) and `:492` (`.label { color: inherit }`) | ✅ **BOTH CORRECT** | §A.6, §Sources |
| Canonical ref: `candidateContext.svelte.ts:233` | ✅ **CORRECT** | §C.4 |
| "`apps/frontend/src/lib/paraglide/` is gitignored … no regeneration artefacts land in the diff" | ✅ **CONFIRMED** | §B.7 |

---

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — no new packages; every tool verified present and exercised this session.
- Architecture / mechanisms: **HIGH** — both the i18n two-catalog split and the a11y settle contract were read end-to-end and reproduced experimentally.
- A11y findings: **HIGH** — measured by an actual axe run against the running app in both themes, not inferred. The one residual uncertainty is behaviour under parallel pressure (Assumption A4).
- i18n key inventory + values: **HIGH** — programmatic diff of all 7 locales; values quoted verbatim from disk.
- FIX-03: **HIGH** — guard, predicate, downstream `ensureAnswer` path, seed data, and the exact E2E step all read directly.
- MF2 `selectExact` authoring details: **MEDIUM** — the template is verbatim in-repo, but the `count` input name and the non-English singular wordings are unverified (A1, A2).

**Research date:** 2026-08-10
**Valid until:** 2026-09-09 (30 days — all findings are in-repo and stable; re-verify the a11y measurements if any CSS/theme or `e2e/base` seed change lands first)
