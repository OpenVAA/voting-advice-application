# Phase 143: `svelte/store` Guard — App-Wide Reach + Fallout Triage - Pattern Map

**Mapped:** 2026-08-22
**Files analyzed:** 6 (2 product, 1 new artifact, 3 record targets) + 3 plan documents to be authored
**Analogs found:** 6 / 6 — every file in this phase has an in-tree analog. Nothing is invented.

> **Weighting note.** This phase's code surface is two files and zero runtime bytes. Its *evidence*
> surface is the whole phase. The highest-value patterns below are therefore §§ 1–3 (ledger schema,
> plan shape, threat model) and § 6 (record-correction phrasing) — not the source excerpts.
> RESEARCH.md § Code Examples already carries the validated config/spec text; this document does **not**
> restate it. It maps each artifact to the in-tree precedent whose *shape* it must copy.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/frontend/eslint.config.mjs` (MODIFIED — D-05 glob, D-06+D-06a `no-restricted-syntax`) | config | build-time transform | **itself**, `:83-86` — the `no-restricted-imports` REPLACE-trap comment + verbatim `patterns` re-inclusion | exact (self-analog: the same trap, one rule over) |
| `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` (MODIFIED — D-04 matrix, D-06 probes, D-06a enum case, D-12a header) | test | request-response (lintText in → messages out) | **itself** (apparatus + invariants) for structure; `apps/frontend/src/params/etPl.test.ts` + `apps/frontend/src/lib/utils/multiChoiceValidity.test.ts` for the `it.each` table house style | exact + role-match |
| `.planning/phases/143-…/143-NEGATIVE-CONTROL-LEDGER.md` (CREATED — D-13) | artifact (evidence) | batch measurement record | `142.1-NEGATIVE-CONTROL-LEDGER.md` (naming + rows-first rule + gate section); `141-ASSERT10-LEDGER.md` (row schema + restore proof) | exact (two-parent) |
| `143-01/02/03-PLAN.md` (to be authored — D-03) | plan | serial pipeline | `142.1-01-PLAN.md` / `142.1-02-PLAN.md` / `142.1-03-PLAN.md` | exact |
| `.planning/ROADMAP.md` (MODIFIED — D-12 targets 1–3) | record | correction | `ROADMAP.md:388` — the F-140-01 provenance correction | exact |
| `.planning/REQUIREMENTS.md` (MODIFIED — D-12 target 5) | record | correction | `REQUIREMENTS.md` ASSERT-10 parenthetical (`:62`-area) + ASSERT-11 evidence clause | exact |
| `.planning/todos/pending/2026-06-04-extend-svelte-store-eslint-guard-app-wide.md` → `completed/` (D-12 target 4) | record | correction | `.planning/todos/completed/provider-getidtokenclaims-duplication.md` | role-match |

---

## Pattern Assignments

### 1. `143-NEGATIVE-CONTROL-LEDGER.md` (artifact, batch measurement) — TWO parents

**Primary analog (naming + ordering + gate section):**
`.planning/phases/142.1-provider-getidtokenclaims-duplication-make-a-07-reach-produc/142.1-NEGATIVE-CONTROL-LEDGER.md`
**Schema analog (row shape + restore proof):**
`.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-ASSERT10-LEDGER.md`

#### 1a. The 141 row schema, verbatim (`141-ASSERT10-LEDGER.md:77-88`)

```markdown
| Row | Branch exercised | Injection site | Exit | Outcome |
|-----|------------------|----------------|------|---------|
| A | none — clean baseline | — | **0** | `Total: 143 tests in 94 files` |
| B | equality collision (`:220` → throw `:221`) | `tests/tests/setup/perm/zz-scratch-b.teardown.ts` | **1** | names both files + the shared prefix |
| E | legitimate exclusion — must NOT fire | `tests/tests/setup/perm/zz-scratch-e.teardown.ts` | **0** | `Total: 143 tests in 94 files` |
| I | clean revert | — | **0** | `Total: 143 tests in 94 files` — identical to row A |
```

Note the three structural properties Phase 143 must copy, not just the columns:

- **Row A is the clean baseline and is the restoration target.** 141 states it explicitly:
  *"**This number is this plan's restoration target.** Row I must reproduce it exactly, or the tree was
  not restored and some row's scratch file survived."* Phase 143's analog restoration target is the
  blob hash `f6cea0a65cdd8d7cd77d734a17929b35510fe796` (RESEARCH § Pitfall 4), plus a clean
  `TURBO_FORCE=true yarn lint:check` exit 0.
- **A must-NOT-fire row exists** (row E). Phase 143's is the rune negative control and D-11's
  measured-dead ignore.
- **A clean-revert row closes the register** (row I), reproducing row A byte for byte.

#### 1b. The extended header this phase needs (research-recommended, +2 columns)

RESEARCH § Wave 0 Gaps requires two columns 141 did not need: per-row `HEAD` (because D-03 puts a
commit between the halves — the 142.1 precedent) and `turbo verdict` (because a cache HIT is a false
green — D-02a). Concretely:

```markdown
| Row | Site (D-05/D-06 gap or SC-1 dir) | Injection file | Command | HEAD | turbo verdict | Exit | Errors | Outcome |
|-----|---------------------------------|----------------|---------|------|---------------|------|--------|---------|
| A | none — clean baseline, untouched tree | — | `TURBO_FORCE=true yarn lint:check` | `<143-01 HEAD>` | `cache miss, executing <hash>` | **0** | 0 errors (1 pre-existing warning) | restoration target |
| B1 | `lib/components` · `.ts` · pre-115 scope | `…/__store_guard_inject__.ts` | `TURBO_FORCE=true yarn lint:check` | `<143-01 HEAD>` | `cache miss, executing <hash>` | **0** | 0 | **GREEN (blind)** |
| … | | | | | | | | |
| N1 | `lib/components` · `.ts` · shipped scope | same file | `TURBO_FORCE=true yarn lint:check` | `<143-02 HEAD>` | `cache miss, executing <hash>` | **1** | 1 `no-restricted-imports` naming the file | **RED (catch)** |
| Z | clean revert | — | `TURBO_FORCE=true yarn lint:check` | `<143-02 HEAD>` | `cache miss, executing <hash>` | **0** | 0 | identical to row A |
```

Two column-count rules carried from 142.1's own preamble (`142.1-NEGATIVE-CONTROL-LEDGER.md:147-175`):
the width delta from the analog is **declared on the ledger's face** with its reason, and any extra
sub-fact goes **inside an existing cell**, never as an unannounced extra column:

> *"That is **nine columns against the analog's five** (`141-ASSERT10-LEDGER.md:75-88` uses
> `Row · Branch · Injection site · Exit · Outcome`). The width is deliberate and locked…"*

`Errors` is a separate cell from `Exit` for the same reason 142.1 split `NEW-assertion outcome` from
`File outcome`: RESEARCH § Code Examples 4 measured a pre-existing `unused-imports/no-unused-vars`
**warning** in every run — *"ledger rows should count **errors**, not problems."*

#### 1c. The restore proof — 141's three-assertion form, verbatim (`141-ASSERT10-LEDGER.md:515-522`)

```
git status --porcelain -- tests          → (empty)
git diff --exit-code -- tests/playwright.config.ts → exit 0   (D-15 read-only constraint held)
find tests -name 'zz-scratch*'           → (no matches)
```

with its rationale, also verbatim (`:521-522`):

> *"The `find` is deliberately broader than the `git status` check: `git status` would miss a scratch
> file that had somehow been staged, and `find` would miss nothing under `tests/`. Both are empty."*

Phase 143's substitution (RESEARCH § Pitfall 4 — this is an **addition** to D-02's `git diff`, never a
substitution for it):

```bash
git diff --exit-code -- apps/frontend/eslint.config.mjs
git status --porcelain -- apps/frontend
find apps/frontend/src -name '__store_guard_inject__*'
git hash-object apps/frontend/eslint.config.mjs   # == f6cea0a65cdd8d7cd77d734a17929b35510fe796
```

#### 1d. The 142.1 header block — the fields to copy field-for-field (`142.1-…:15-40`)

```markdown
- **Phase:** 142.1 (…)
- **Requirement:** ASSERT-11
- **Opened by:** `142.1-01-PLAN.md` (wave 1). Every row is created here, before the phase's first
  injection; the OLD-half cells are filled by this same plan, and the NEW-half cells by `142.1-02`.
- **Corpus:** exactly **8 pairs** (**D-18**) …
- **Baseline for OLD halves:** none inherited. **`cited` is not a legal value in any cell of this
  ledger** (**D-19**, criterion 4) — every row carries a log path and the HEAD its own half was taken
  at. See § Measurement, never citation.
- **HEAD at ledger creation:** `e936f3bbc` … **OLD and NEW rows legitimately carry different HEADs**,
  because the collapse (`142.1-02`) lands *between* the two halves (**D-20**).
- **Machine:** developer Mac, host Node … No container: this ledger records vitest exit codes and
  assertion messages only, never a visual baseline, so the milestone's container rule for baselines
  does not apply.
- **Resolved `$TMPDIR`:** … Recorded here for the same reason 139 recorded its own: a log path that
  cannot be resolved later is not evidence.
```

Phase 143 substitutions: requirement **ASSERT-08/09**; corpus **8 halves at 4 SC-1 sites × 2
extensions, plus the 2 gap probes and the enum regression case**; `cited` likewise illegal (nothing
exists to cite — the pre-115 scope has not existed since 2026-06-13); "OLD and NEW rows legitimately
carry different HEADs, because the config change (`143-02`) lands *between* the two halves"; and the
`$TMPDIR` sentence copied for the `gsd-143/` log directory.

**Precedent-chain sentence** (`142.1-…:60-67`) — append, do not restart:

> **`143-NEGATIVE-CONTROL-LEDGER.md` → `142.1-NEGATIVE-CONTROL-LEDGER.md` → `142-NEGATIVE-CONTROL-LEDGER.md`
> → `141-ASSERT10-LEDGER.md` → `138-NEGATIVE-CONTROL.md` → `137-NEGATIVE-CONTROL.md` →
> `136-VISUAL-DISCRIMINATION-EVIDENCE.md`.**

#### 1e. The gate section D-14 needs six rows in — analog `142.1-…:487-860`

Per-gate shape, verbatim field set:

```markdown
| Field | Value |
|---|---|
| **Exit code** | **0** |
| **HEAD** | `79038ac81` |
| **Log** | `${TMPDIR:-/tmp}/gsd-142.1/e2e-bankauth-journey-1.log` |
| **Counts** | **115 passed** (115/115), 0 failed, 0 skipped, 0 flaky, 0 "did not run" |
| **Duration** | **10.4 min** (wall clock 626 s) |
| **Proves** | … |
```

and the closing **Gate verdict** paragraph, whose two properties Phase 143 must reproduce:

> *"**All eight gate runs green, first attempt on their final configuration, none retried, none
> annotated as flaky, none skipped.** … **Two disclosures, so "first attempt" is not read as more than
> it is.**"*
> *"**Not one gate was weakened to obtain a green.**"*

For Phase 143, gate 2 (`TURBO_FORCE=true yarn lint:check`) additionally carries the short-circuit
disclosure from RESEARCH § Pitfall 3 — a RED row must state that the `eslint tests` and
`typecheck:tests` steps **never ran**.

---

### 2. `143-01/02/03-PLAN.md` (plan, serial pipeline)

**Analog:** `142.1-01-PLAN.md` (663 lines) · `142.1-02-PLAN.md` (1212) · `142.1-03-PLAN.md` (608)

#### 2a. Section order, copy as-is

`142.1-01`: `<objective>` → `<inversion>` → `<artifacts_this_phase_produces>` → `<execution_context>` →
`<context>` → `<hygiene_loop>` → `<injection_register>` → `<expected_old_half_outcomes>` → `<tasks>` →
`<threat_model>` → `<verification>` → `<success_criteria>` → `<output>`.

`142.1-02` adds `<ordering_hazard>` immediately after `<objective>`. **Phase 143's `143-02` needs the
same block** — its hazard is D-06a (the `no-restricted-syntax` REPLACE trap), which is the exact
structural analog: a change that produces zero errors while removing enforcement.

`142.1-03` opens with `<gate_preconditions>` ("⚠ Nothing in this plan may run until `142.1-02`'s last
revert and last post-gate") and carries an inlined `<gate_runbook>` — *"a mid-gate runbook hunt is where
the port mismatch bites"*. D-15's `yarn db:reset` + one fresh `:5173` server belongs **inlined there**,
not cited.

#### 2b. How 142.1 made measure-before-change **structural**, not asserted

This is the pattern D-03/SC-2 depends on. Three mechanisms, all in `142.1-01-PLAN.md`:

1. **Task 1 creates the artifact with every row present and every measurement cell `pending`**, and
   ends: *"**Commit this task before Task 2 begins.** No injection runs against an uncommitted ledger."*
   (`142.1-01-PLAN.md:419`)
2. **Task 1's `<precondition>` proves the tree is untouched before the first command runs:**
   `` `git status --porcelain -- apps tests packages` prints nothing — this plan's first command runs on a tree byte-identical to HEAD. ``
3. **The acceptance criteria are greppable counts on the artifact, not prose:**
   - `` grep -E '^\| ' … | grep -c 'pending'` is at least **24** — three unfilled measurement cells per row … plus an unfilled `Verdict`, **before any injection** ``
   - `` grep -E '^\| ' … | grep -c 'cited'` is **0** — the word may appear only in the header prose that forbids it, never in a table row ``
   - *"The table header line has **exactly nine** `|`-delimited columns…"*

   **Phase 143 lift:** `143-01`'s acceptance criteria must assert a `pending` count over the OLD-half
   and NEW-half cells, a `cited` count of **0**, and the extended column count from § 1b.

#### 2c. The `<hygiene_loop>` — one injection live at a time

`142.1-01-PLAN.md:141-190`, notably:

```
# 2. INJECT with Edit, located by CONTENT, never by line number.
#    Marker text `INJECTED (142.1)` where a comment is legal; a pure deletion carries no marker.
```

**Located by CONTENT, never by line number** is directly load-bearing here: RESEARCH § Code Examples
opens with *"Line numbers cited in comments are pre-change and **will move**; locate by content"*, and
B-3/§ 5.2 already found three off-by-one line citations in CONTEXT.md.

#### 2d. `<threat_model>` block shape (`142.1-01-PLAN.md:606-630`)

Three parts, in order:

```markdown
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| … | … |

**Proportionality statement:** this plan makes **no durable source change at all** — its whole product
surface is eight transient injections into authentication code. The register is therefore about
*injection containment*, not about a shipped behaviour. ASVS level 1; block on **high**.

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-142.1-01 | Tampering | … | **high** | mitigate | … |
| T-142.1-SC | Tampering | npm/pip/cargo installs | low | accept | **No install task exists in this plan or anywhere in this phase.** … `[SLOP]` none, `[SUS]` none |
```

**Phase 143's register is pre-populated by RESEARCH § Security Domain** — its five threat patterns map
one-to-one onto rows (silent weakening of a build-time guard → Tampering/high; false-green evidence
from a cached task → Repudiation; guard-scope regression → Tampering; ban bypass via an unguarded
specifier form → Tampering; injection file left behind → Tampering). Copy `T-142.1-SC` verbatim in
shape: RESEARCH § Package Legitimacy Audit records `[SLOP]` none / `[SUS]` none. Proportionality
sentence for this phase: *zero runtime bytes ship; the whole product surface is one lint-config file and
one vitest spec, plus transient injections.* ASVS level 1; block on **high** — as the prompt specifies
and as V14 Configuration in RESEARCH already argues.

---

### 3. `apps/frontend/eslint.config.mjs` (config, build-time transform)

**Analog: the file itself, `:83-86`** — the trap is being hit a second time, one rule over, so the
mitigation must be *the same artifact shape at the new site*:

```js
  // Flat config REPLACES (does not merge) the `no-restricted-imports` array for in-scope files,
  // so the inherited deep-relative-`lib` `patterns` ban (shared-config/eslint.config.mjs:147-152)
  // is re-included VERBATIM here. Omitting it would silently drop that ban for these
  // files, because the replacement is total rather than additive.
```

The prettier-canonical replacement text (D-05 glob + the two-entry `no-restricted-syntax` with the
paired comment) is **already written and measured** at `143-RESEARCH.md` § Code Examples 1 — copy it
from there. Two non-negotiables the analog implies:

- The new comment must state **both** facts, as RESEARCH's canonical text does: the rule split ("Edit
  both or neither") and the REPLACE re-inclusion.
- `npx prettier --write apps/frontend/eslint.config.mjs` runs **in the same task as the edit**
  (RESEARCH § Pitfall 6 — a hand-formatted patch measurably failed `prettier --check`).

---

### 4. `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` (test, request-response)

**Analog for apparatus and invariants: the file as it stands.** The three correctness invariants at
`:20-29` MUST survive the rewrite (D-04). Quoted verbatim:

```ts
 * Correctness invariants (RESEARCH Pitfalls 1-2):
 * - `probePath` MUST resolve under `apps/frontend/src/**` so the
 *   `files: ['src/**\/*.{ts,svelte}']` guard scope applies — a filePath outside
 *   `src/` gives a false PASS.
 * - `new ESLint({ flags: ['v10_config_lookup_from_file'] })` is MANDATORY so the
 *   test loads the real `apps/frontend/eslint.config.mjs` (matches the repo `lint`
 *   script exactly; omitting it risks config-resolution drift).
 * - Filter messages by `ruleId === 'no-restricted-imports'` (NOT a bare
 *   `errorCount`) — the violating fixture also trips an unrelated
 *   `import/newline-after-import` rule.
```

The second bullet's glob text becomes stale under D-05 — restate the invariant without pinning the glob
(RESEARCH § 4.3 recommendation for `:12`: a stable anchor, not a line number). Also preserved: the
apparatus lines `:32` (module-level `ESLint` instance) and `:34-36` (the "probe path is virtual — no
file is written there" comment).

**Stale claims corrected in the same edit (D-12a, exact current text at `:8`, `:11`, `:12`, `:39`):**

| Line | Current text | Correction |
|---|---|---|
| `:8` | `* Traceability:.3 (met-via-Phase-115).` | name **ASSERT-08** + the `7c47b35b7` / Phase-115 supersession |
| `:11` | ``* `src/**\/*.{ts,svelte}` and clearing every `svelte/store` import — already landed`` | glob becomes `src/**/*.{ts,js,mjs,cjs,svelte}` |
| `:12` | ``* earlier (see phase 115, and `apps/frontend/eslint.config.mjs` lines 77-84). This`` | drop the line citation → stable anchor |
| `:39` | `describe('svelte/store ESLint guard (RUNES-03 lock-in)', …)` | agree with `:8`'s requirement ID |

**Analog for the table-driven matrix — house style.** The repo has 8 `*.each` specs; the two closest in
role (pure input→verdict matrices, frontend, vitest) are:

`apps/frontend/src/params/etPl.test.ts:15-31` — array-of-arrays + printf title, one `expect`:

```ts
describe('etPl matcher', () => {
  it.each([
    ['candidates', true],
    ['organizations', true],
    ['candidate', false],
    ['', false],
    ['CANDIDATES', false] // case-sensitive
  ])('match(%p) === %p', (input, expected) => {
    expect(match(input)).toBe(expected);
  });
});
```

`apps/frontend/src/lib/utils/multiChoiceValidity.test.ts:14-25` — `describe` grouping wrapping
`it.each`, with a leading block comment naming the matrix's axes:

```ts
describe('isMultiChoiceCountValid', () => {
  describe('explicit minSelections=2, maxSelections=3, choiceCount=5', () => {
    it.each([
      [0, false],
      [2, true],
      [4, false]
    ])('count %i → %s', (count, expected) => {
      expect(isMultiChoiceCountValid({ count, minSelections: 2, maxSelections: 3, choiceCount: 5 })).toBe(expected);
    });
  });
});
```

**House-style verdict:** array-of-arrays + printf-style title tokens (`%s` / `%p` / `%i`), grouped under
a `describe` whose title names the matrix axis, with a file-head block comment naming the axes. That is
**exactly** the shape RESEARCH § Code Examples 6 validated (`describe.each(cases)('guard reach:
src/%s/__store_guard_probe__%s', …)` over a `flatMap`ped array-of-arrays) — and it independently
dissolves Pitfall 7's quoted-object title rendering. Copy the RESEARCH block; it is already in house
style.

**One addition the analogs do not carry, forced by D-06a:** after D-06 both bans share
`ruleId === 'no-restricted-syntax'`, so the dynamic-import and enum cases must disambiguate on the
**`message` substring** (`'svelte/store is banned'` vs `'const assertion'`) — the existing `ruleId`
filter discipline, one level down.

---

### 5. `.planning/todos/pending/2026-06-04-…-app-wide.md` → `completed/` (record correction)

**Analog:** `.planning/todos/completed/provider-getidtokenclaims-duplication.md` (142.1's own todo
closure) — a `git mv` into `completed/`, frontmatter retained, with a closing section naming the
resolving commit.

Frontmatter to retain and extend (current file, `:1-7`): `created`, `title`, `area`, `files`, `source`,
`resolves_phase: 143`. The claim the closure must explicitly retire is `:22-24`, verbatim:

> *"Expect this to surface existing `svelte/store` usages outside the migrated context/route scope —
> triage each (migrate to runes vs explicitly allow)."*

Per D-12: cite `7c47b35b7`, state it was superseded **nine days after filing**, and that it surfaced
**nothing** (0 real imports — RESEARCH § 5.1's strict grep).

---

## Shared Patterns

### S-1. Record correction — "wrong when written", never a silent overwrite

**Source:** `.planning/ROADMAP.md:388` (the F-140-01 provenance correction, Phase 141)
**Apply to:** all five D-12 record targets.

The exact phrasing, verbatim:

> **RESOLVED 2026-08-18 (Phase 141), and its original wording was wrong when written.** It claimed no
> config-load prefix-uniqueness guard existed. In fact Phase 140 built one in the same phase:
> `abe1fabb0` landed the `TEARDOWN-PREFIX-UNIQUENESS GUARD` at `tests/playwright.config.ts:138-240` …
> Prefix disjointness has therefore been enforced, not conventional, since 2026-08-15. What F-140-01
> actually left outstanding was the **negative-control evidence** the milestone's standing acceptance
> rule demands: the guard was built but never observed failing.

The four-move structure to copy at each target:

1. **Name the correction date and the phase making it**, inline in the original sentence.
2. **State the false claim explicitly** ("It claimed …") — do not delete it.
3. **State the fact with its commit and file:line** ("In fact Phase 140 built one … `abe1fabb0` …").
4. **Name what was *genuinely* outstanding** ("What F-140-01 actually left outstanding was …").

Phase 143's substitution is one-to-one: the false claim is *"Widen the ESLint guard from
contexts/routes to all of `apps/frontend/src/**`"* (`ROADMAP.md:264`) and *"Widening is run against the
untouched tree first"* (SC-2); the fact is `7c47b35b7`, 2026-06-13, Phase 115,
`apps/frontend/eslint.config.mjs:88`; what was genuinely outstanding is **ASSERT-08's proof clause**
under the standing acceptance rule.

**REQUIREMENTS.md variant of the same move** — the parenthetical form, verbatim from ASSERT-10:

> _(… **Provenance corrected 2026-08-18:** this parenthetical previously said the guard against a
> *future* duplicate "was never built", which was false. Phase 140 built it in `abe1fabb0` … What was
> genuinely missing was the negative-control evidence, which Phase 141 supplies in
> `141-ASSERT10-LEDGER.md` …)_

### S-2. The evidence clause — 141 / 142.1 house style

**Source:** `.planning/REQUIREMENTS.md` ASSERT-11 status line
**Apply to:** ASSERT-08 and ASSERT-09 at `REQUIREMENTS.md:62-63`.

Shape: `— Evidence: <ledger path> (**<counts, bolded, in one pipe-separated run>**).` then the measured
claims, then `Gates, all green, each with command, exit code, counts and log path in the ledger's gate
section: …`, then `**Residue named rather than closed**, as standing todos: …`, then the checkbox-timing
parenthetical.

Canonical count run to imitate:

> `(**8 pairs · 8 OLD halves measured here · 8 NEW halves measured here · 0 cited · 0 withdrawn**)`

Phase 143's analog run: **8 measured halves · 0 cited · 4 SC-1 sites × 2 extensions · 2 gaps closed ·
16 exclusion entries before, 16 after, 0 additions**.

Residue clause targets, already enumerated: **D-07** (`svelte/motion`, 2 live `tweened` call sites),
**D-08** (five config files outside every lint gate), and the computed-specifier `import(n)` residue
RESEARCH § 2.2 requires be stated rather than over-claimed.

Checkbox-timing parenthetical, verbatim from ASSERT-11 — copy the *practice*, not just the words:

> _(Checkbox flipped **after** the gates ran, by `142.1-03` — `142.1-02` deliberately reverted a
> premature tick, and ASSERT-07's early flip is the pattern that was being avoided.)_

### S-3. The three-targets-that-disagree rule

**Source:** `.planning/ROADMAP.md:620-622`, and reused as 142.1's final-counts framing sentence
**Apply to:** every count this phase states in more than one place.

> *three targets that disagree are worse than one that is silent, because each looks authoritative.*

Operationally: the ledger's final-counts table, `REQUIREMENTS.md`'s evidence clause, and `ROADMAP.md`'s
phase status line must carry the **same** numbers, derived **once**. 142.1 enforced this by giving its
final-counts table a `Derivation — what the number actually means` column
(`142-NEGATIVE-CONTROL-LEDGER.md:177-186`). Phase 143 has five counts in this class: the two grep
counts (D-09a), the exclusion-list size (D-11a), the halves count, and the gate counts.

### S-4. Amend-at-source, never annex

**Source:** the standing rule invoked by D-09a/D-11a/D-12a; `feedback_reverify_amend_missing_list`
**Apply to:** CONTEXT.md B-8/B-9/B-3 (RESEARCH § 5.2 found three off-by-one/entry-count errors that
CONTEXT.md still carries in its own text at `:83-85`).

RESEARCH § Open Question 3 resolves the mechanism: **amend CONTEXT.md B-8/B-9 in `143-01`, in the same
commit that opens the ledger**, and record the delta in the ledger. This is a third instance of the
shape D-09a and D-12a already establish, and needs no new decision.

### S-5. Cache-busting as an evidence primitive

**Source:** no in-tree analog — 141 and 142.1 both measured through **uncached** instruments
(`playwright --list`, `vitest` with `turbo.json:9-12` `"cache": false`).
**Apply to:** every ledger-bearing lint invocation.

This is the one place where Phase 143 has **no precedent to copy** and must establish one:
`TURBO_FORCE=true yarn lint:check`, with turbo's verdict line (`cache miss, executing <hash>` /
`cache hit, replaying logs <hash>`) recorded per row. RESEARCH § 3.3 measured the hazard and the fix;
**`yarn lint:check --force` does not work** (yarn appends the arg to the end of the `&&` chain).

The nearest *conceptual* analog is 142.1's `cited`-is-illegal rule: both are prohibitions on a row whose
value was not produced by an execution in this phase. Phrase the ledger clause the same way —
*"a row that cannot show `executing` is not a measurement"* (RESEARCH § Pitfall 2, item 2).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | **None.** Every artifact in this phase has an in-tree analog, most of them two. The only *mechanism* without precedent is S-5 (turbo cache-busting as an evidence primitive), which is a new rule inside an existing artifact class, not a new artifact. |

---

## Metadata

**Analog search scope:** `.planning/phases/141-*`, `.planning/phases/142.1-*`, `.planning/ROADMAP.md`,
`.planning/REQUIREMENTS.md`, `.planning/todos/{pending,completed}/`, `apps/frontend/src/lib/_guards/`,
plus a repo-wide `git grep -l 'describe\.each|it\.each|test\.each' -- apps packages tests` (8 hits, 2
read).
**Files scanned:** 14 read; 8 quoted.
**Pattern extraction date:** 2026-08-22
**Not re-derived here:** the config text, the matrix spec body, the injection fixtures, and every
measurement — all live in `143-RESEARCH.md` § Code Examples and § Detailed Findings. This document maps
shapes; it does not restate content.
