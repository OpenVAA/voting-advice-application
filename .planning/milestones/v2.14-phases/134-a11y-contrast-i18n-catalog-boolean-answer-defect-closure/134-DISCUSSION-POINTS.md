# Phase 134 — Discussion Points

**Phase:** 134 — A11y Contrast + i18n Catalog + Boolean-Answer Defect Closure
**Status:** discussion in progress — tick the boxes, then I'll write `134-CONTEXT.md`
**Date:** 2026-08-10

> Every option is a checkbox. `(Rec)` marks my recommendation. Tick one per
> question unless the question says otherwise. Edit freely — free-text notes
> under a question are fine and I'll read them.

---

## 0. Ground truth established during scouting

I ran a settled-DOM axe scan and a computed-colour probe against the live dev
server with `e2e/base` seeded, and diffed the two i18n catalogs, before locking
anything. Three of the audit's premises moved.

| # | Audit claim | Verified state |
|---|---|---|
| **FIX-01** | "12/12 FAIL at 3.69:1" on the elections selector | ❌ **STALE — already fixed.** `apps/frontend/src/app.css:492` `.label { color: inherit }` landed in commit `0eb27c677` (2026-06-22 19:59), *after* the debug doc the audit cited (`e144768e0`, 15:25). Settled scan of `/en/elections`: **0 total violations, 0 color-contrast, light AND dark.** Option spans compute `rgb(51,51,51)` on `#fff` (12.6:1) and `rgb(204,204,204)` on `#000` (15.8:1), `opacity: 1`. |
| **FIX-02** | 2 keys missing from the runtime catalog | ✅ Live — **but it is 7 keys, not 2.** See §3. |
| **FIX-03** | truthiness guard; "and in the completion gating that reads the same helper" | ✅ Live at `questions/+page.svelte:58` — **but the completion-gating half is wrong.** `candidateContext.svelte.ts:233` uses `isEmptyValue()`, which already handles `false`/`0` correctly. Single site, not two. |

**Also corrected:** the audit says `NumericEntityFilter`'s `text-label` spans have
"no colour override at all". True — `text-label` matches no rule and no
`--color-label` token exists — but since `.label { color: inherit }` landed they
inherit full-strength `#333`, so they are **not** currently a contrast defect.
They are a dead class, not a live violation.

---

## 1. FIX-01 re-scope — ✅ DECIDED

- [x] **Re-scope to gate + cleanup (Rec)** — keep FIX-01 as a requirement, rewrite it: app fix already in, so the deliverable is (a) a settled-DOM regression gate that would actually have caught it, (b) `text-label` cleanup, (c) corrected ROADMAP / REQUIREMENTS / audit text recording that `0eb27c677` closed the app-side defect.
- [ ] Close as already-satisfied — mark Complete, correct the audit, nothing else; phase shrinks to FIX-02 + FIX-03.
- [ ] Broaden to a full app-wide `.label` audit.

**`text-label` dead class** (`NumericEntityFilter.svelte:85,98,113`):

- [x] **Replace with `small-label` (Rec)** — the project's own opaque muted-label token (`app.css:384` → `text-secondary text-xs font-normal uppercase`), already used by `ConstituencySelector` and `QuestionChoices`. Removes the dead class, expresses the original intent, AA-safe.
- [ ] Just delete the class (inherit; zero visual change).
- [ ] Define a `--color-label` theme token.

**`app.css:492` global `.label { color: inherit }` override:**

- [x] **Leave as-is (Rec)** — shipped, documented with rationale, verified AA-clean both themes. Narrowing risks re-opening the defect.
- [ ] Narrow to per-component explicit colours.

---

## 2. A11y gate hardening — OPEN

The gate is weak, and that weakness is *why* the audit reached a stale
conclusion. `a11y-smoke.spec.ts:150-163`: the `elections-selector` and
`constituencies-selector` entries `settle` on
`page.getByRole('heading').first()`, then `awaitAnimationsSettled`. The debug
doc proved that at heading-visible the option span **"DOES NOT EXIST YET"** —
the labels are data-driven and render later. So the scan can pass against a DOM
that does not contain the content the scan exists to check.

### 2.1 Settle strategy

- [ ] **Per-route content-presence settle (Rec)** — each `UNLOCATED_ROUTES` entry waits for its own data-driven testid (elections → `election-selector-option-label`, constituencies → the constituency option) *before* `awaitAnimationsSettled`. Minimal diff, directly closes the hole.
- [x] **Typed route contract** — add a required `contentTestId` field to the route entry type so a future route physically cannot be added to the scan set without declaring what "loaded" means. Stronger, slightly larger.
- [ ] Leave `settle` alone; add a separate standalone settled-DOM assertion test.

### 2.2 Do the filter surfaces get axe coverage?

`NumericEntityFilter` / `EnumeratedEntityFilter` live behind the results-page
filter drawer and are currently scanned by nothing.

- [x] **Yes — add a filter-drawer route to the scan set (Rec)** — needs a fixture path (navigate to results, open filters). Real coverage gain; these are the surfaces the audit flagged.
- [ ] No — out of scope, file a backlog todo.

### 2.3 Contrast-specific regression guard beyond axe?

- [x] **axe global-zero gate only (Rec)** — `assertAxeGates` already asserts `violations.length === 0`; with 2.1 fixed that is a genuine gate.
- [ ] Belt-and-braces: also assert the computed colour of the election option span (pins `rgb(51,51,51)` / `rgb(204,204,204)`), so a regression names itself instead of surfacing as a generic axe failure.

### 2.4 If hardening the settle surfaces NEW pre-existing violations on other routes

Real risk: routes may currently be passing for the same reason elections was.

- [x] **Fix them in this phase (Rec)** — the E2E cardinal rule means we cannot ship with the suite red, and a violation surfaced by our own gate is ours to close.
- [ ] Quarantine to a follow-up phase; keep the loose settle on those specific routes with a documented reason.
- [ ] Decide when we see what actually surfaces (defer to execution, checkpoint to you).

---

## 3. FIX-02 message shape — OPEN

**Scope correction.** The runtime catalog is missing **7** live keys, not 2. All
7 are authored in all 7 locales in the type-gen source and all 7 render the raw
key string today:

| Key | Call site | User impact |
|---|---|---|
| `questions.multiChoice.selectExact` | `QuestionChoices.svelte:421` | visible helper text |
| `questions.multiChoice.selectRange` | `QuestionChoices.svelte:422` | visible helper text |
| `components.accordionSelect.listboxAriaLabel` | `AccordionSelect.svelte:84` | **`aria-label`** — screen readers announce the literal key. This is a WCAG defect, not just cosmetic. |
| `components.multipleTextInput.add` | `MultipleTextInput.svelte:206` | visible button text |
| `components.multipleTextInput.moveUp` | `MultipleTextInput.svelte:176` | visible button text |
| `components.multipleTextInput.moveDown` | `MultipleTextInput.svelte:183` | visible button text |
| `components.multipleTextInput.remove` | `MultipleTextInput.svelte:191` | visible button text |

Parity check is otherwise clean: 0 keys in `messages/` that are absent from
`translations/`. (`messages/en/lang.json` has no `translations/` counterpart —
expected, it's the locale-name catalog.)

### 3.1 Scope

- [x] **Fix all 7 (Rec)** — same defect, same mechanism, same commit shape; one of them is an a11y defect. Leaving 5 known-broken keys in place to satisfy a REQ-ID's literal wording would be bookkeeping over product.
- [ ] Fix only the 2 named in FIX-02; file the other 5 as a separate todo.

### 3.2 Message format

The runtime catalog authors plural-sensitive messages as inlang MF2 declaration
arrays (see `questions.category.numQuestions`). Plain interpolation is a bare
string with `{param}`.

- [ ] **Plain interpolation strings, mirroring the type-gen source verbatim (Rec)** — the roadmap says "mirror the values already authored there"; keeps the two catalogs byte-identical so future drift is detectable by diff. Accepts that `selectExact` reads "Select 1 options." at count=1 (a pre-existing wording issue in the source, not one this phase introduces).
- [x] MF2 plural declarations for `selectExact` only — grammatically correct at count=1, but the two catalogs now differ in shape, which is exactly the divergence that caused this bug.
- [ ] MF2 plurals in **both** catalogs — correct grammar *and* parity, but touches the type-gen source and 7 locales' wording. Largest diff.

### 3.3 Prevent the whole defect class?

- [x] **Add a key-set parity check (Rec)** — a unit test (or lint script) asserting `translations/{locale}` and `messages/{locale}` have identical key sets. It's ~30 lines, it just found 7 real bugs in one run, and it makes this class of defect structurally impossible to reintroduce. Note: it will hard-fail until 3.1 is done, so it lands after the fix.
- [ ] Mirror and move on; file a todo for catalog unification.
- [ ] Go further — unify to a single catalog so the duplication disappears entirely. *(I'd push back: that's a refactor phase, not defect closure.)*

### 3.4 Where does the restored assertion live?

`candidate-journey.spec.ts:803-813` is the deliberately-withheld one.

- [x] **Restore `/2.*3/` at `candidate-journey.spec.ts:813` + strip the now-obsolete BLOCKER-130-05 comment block (Rec)**, and add assertions for the newly-fixed keys only where a spec already visits them.
- [ ] Restore the E2E assertion only; no new coverage for the other 5 keys.
- [ ] E2E + a unit test asserting all 7 keys resolve to non-key text in all 7 locales *(pairs naturally with 3.3 if you take the parity check)*.

**FYI, not a question:** `apps/frontend/src/lib/paraglide/` is gitignored
(`apps/frontend/.gitignore:19`, 0 files tracked) — generated output is not
committed, so no regeneration artefacts land in the diff.

---

## 4. FIX-03 lock + sweep — OPEN

### 4.1 The guard itself

The roadmap prescribes `== null`. But the sibling code path 30 lines away in
`candidateContext.svelte.ts:233` uses `isEmptyValue()` (`@openvaa/core`), which
returns `true` for `null`/`undefined`/`''`/`[]`/empty objects and `false` for
`false` and `0`.

If we use `== null`, a saved answer of `''` or `[]` starts rendering as
**answered** on the overview while `unansweredOpinionQuestions` still counts it
unanswered — we'd trade one inconsistency for another.

- [x] **Use `isEmptyValue(localizedAnswer?.value)` (Rec)** — fixes `false`/`0`, keeps the overview consistent with the completion gating, reuses the canonical helper. Deviates from the roadmap's literal `== null` wording; I'd note the deviation in CONTEXT.md.
- [ ] Use `== null` exactly as the roadmap specifies — smallest possible diff, matches the written criterion, accepts the `''`/`[]` divergence.
- [ ] You decide — let research/planning weigh it.

### 4.2 Sweep

I grepped for sibling truthiness guards on answer values across
`apps/frontend/src`: **`questions/+page.svelte:58` is the only one.** The audit's
"and in the completion gating" claim does not hold.

- [ ] **Point fix; record the sweep result as evidence (Rec)** — the sweep is already done and came back clean, so there is nothing further to fix.
- [x] Widen the sweep to a repo-wide `!x.value` / falsy-guard audit across packages too.

### 4.3 Locking it

- [x] **E2E (Rec)** — candidate answers a boolean opinion question "No", returns to the overview, sees it rendered as answered. Exercises the real save→reload→render path, which is where the bug lives.
- [ ] Unit test on `getSavedAnswer` — cheaper and more targeted, but the function is module-local to a `+page.svelte` and would need extraction to be testable.
- [ ] Both.

---

## 5. Verification gate — OPEN

Roadmap criterion 4: "Full E2E suite green to the 3× determinism standard;
svelte-check stays 0/0; lint + prettier + `typecheck:tests` clean."

- [x] **Keep 3× (Rec)** — this phase touches the a11y settle logic, which is exactly the kind of change that has produced parallel-pressure-dependent flakes here before (see the 2026-06-22 debug doc: the original flake reproduced only under `--workers>1`).
- [ ] Reduce to 1× — the product diff is genuinely small (7 JSON keys, one guard, three class swaps).
- [ ] 3× only if 2.2 (filter-drawer scan) is taken; 1× otherwise.

---

## 6. Out of scope — confirming these stay out

Roadmap already excludes both. Ticked = agreed, leave them out.

- [x] `preview/+page.svelte:32` `dataRoot` alias-indirection warning (audit §4.4) — pre-existing, does not currently manifest.
- [x] DEF-120-03-01 feedback rate-limit teardown (audit §4.5).

---

## 7. Deferred ideas raised during discussion

*(none yet — I'll append anything that comes up)*

---

## Open free-text

Anything I missed, or a decision you want to phrase yourself:

>
