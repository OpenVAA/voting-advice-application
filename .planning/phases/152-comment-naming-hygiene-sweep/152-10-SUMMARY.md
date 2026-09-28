---
phase: 152-comment-naming-hygiene-sweep
plan: 10
subsystem: frontend
tags:
  [sweep, judgement-pass, svelte5-reactivity, destructure-trap, supabase-adapter, behaviour-neutrality, codemod-residue-repair, two-route-completeness]

# Dependency graph
requires:
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-05's `assert-comment-only-diff.mjs` prover, the shared `hygiene-codemod.mjs` classifier, and `152-RESIDUE-REGISTER.md`'s seven-way prefix partition"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-06's finding that the shipped gate invocation exits 2 under a caller-supplied pathspec, and its reword-don't-strip precedent for numerals that carry meaning"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-07's memo items 10 and 11 — the gate is not a completeness test, and the register's per-plan queue is a floor"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-08's four added scanner classes and its assert-once-per-replacement applier"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-09's finding that an id-shaped scanner has a FLOOR, and its scaling rule naming this plan as the one that cannot be read end to end"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-09's WINDOWS 98 prover-range trap and the requirement to bound the range at the last refactor commit"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-05's discharged E2E cardinal gate (150 passed / 0 failed / 0 did-not-run), which is why a comment-only plan does not re-run the suite"
provides:
  - "the frontend library partition swept — contexts, dynamic components, the Supabase adapter surface, and the nine in-prefix directories the queue never listed"
  - "every Svelte 5 destructure-trap invariant preserved COMPLETE and citation-free, including the identity-stable `#version`-bridge carve-out"
  - "the data writer's 17-line deliberately-not-taken fix rewritten with its alternative, both measured reasons and its re-trigger condition intact"
  - "the Phase-157 half of the split adapter-typing review item on the record, with file, line range, the reviewer's question and the mapped roadmap goal"
  - "a FIFTH gate-vs-reality measurement, and the first taken per REWRITE SITE rather than per line: the gate reached 136 of 216, missing 37%"
  - "21 152-05-class codemod sentence breaks repaired, including six empty-paren identifiers"
  - "one FALSE claim corrected rather than de-cited (AdminNav's `getRoute` is not a store)"
  - "a negative finding on BOTH fenced operator questions (memo items 12 and 13): neither fires in this partition"
affects: [152-11, 152-12, 152-13, 152-14, 152-15, 157]

# Actuals (#2632)
actuals:
  tokens: 152000
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "assert-once-per-replacement applier, inherited from 152-06/07/08/09: a table of [file, old, new, expectedCount] verified against the ORIGINAL text in full BEFORE any byte is written; a drifted anchor aborts the whole batch rather than applying a subset (it aborted twice here, both times on indentation drift, and both times correctly)"
    - "TWO-ROUTE completeness, as 152-09 required of this plan by name: the widened scanner (nine gate rows + 152-07's grep + 152-08's four classes + ten more) AND a deliberate read of all 27 spans of seven lines and up"
    - "per-REWRITE-SITE attribution rather than per-line: a multi-line rewrite has one anchor and many collateral lines, so a per-line gap measurement over-reports the read-only share"
    - "flip-tested gate: nine injected tokens turn all nine rows red raw AND comment-scoped, reverting returns all nine to zero and the file to byte-identical"
    - "flip-tested SECOND instrument for the declaration-line criterion: comment-stripped +/- comparison, symmetric under a comment-only edit and asymmetric under a real declaration change"
    - "prover range BOUNDED at the last refactor commit, per WINDOWS 98 / memo item 16, with both numbers reported"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
    - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
    - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
    - apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts
    - apps/frontend/src/lib/contexts/data/dataContext.svelte.ts
    - apps/frontend/src/lib/contexts/utils/inheritContextMembers.ts
    - apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts
    - apps/frontend/src/lib/contexts/utils/settingsOverlay.svelte.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/utils/auth/providers/authConfig.ts
    - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte
    - apps/frontend/src/lib/_guards/eslint-store-guard.test.ts
    - apps/frontend/src/lib/utils/route/buildRoute.ts

key-decisions:
  - "The plan's `files_modified` lists three directories; the register's prefix rule assigns the WHOLE of `apps/frontend/src/lib/**` except `components/`. The prefix governs (memo items 1 and 11). 13 in-partition files the span-derived queue never listed were swept, in a third commit whose message says exactly that."
  - "The adapter's base-object comment at `supabaseDataProvider.ts:361-366` was NOT touched. It carries no planning reference, so it is not in this plan's class at all; its line-break half is 152-14's and its typing half is Phase 157's. Verified byte-identical over the plan range."
  - "The data writer's 17-line timing block was REWRITTEN, never deleted. All three elements the register named — the described alternative, the two measured reasons for not taking it, the re-trigger condition — survive. Before and after are recorded verbatim below."
  - "`AdminNav.svelte`'s claim that `getRoute` \"is still a store\" is FALSE at HEAD (the same file calls `getRoute.current(...)` at seven template sites). Corrected rather than de-cited, per memo item 6."
  - "`VT-03 JS layer` was REWORDED to what it denotes (the JS half of the reduced-motion gate, whose CSS half lives in the stylesheet) rather than stripped, per memo items 7 and 18."
  - "`D1 field-init order` (8 sites) reworded to `field-init order`: `D1` names a spike's ordering finding, not anything in the code, and the ordering rule it labels is real and stays."
  - "Five raw-gate survivors are `describe()` TITLES and were left alone: title renames are 152-13's by this plan's own prohibition, and all five are program bytes the zero-allow-entry prover forbids changing."
  - "`utils/sorting.ts:8`'s `@param target - .` was NOT fixed: `git log --follow -S` traces it to `6fe18ddfd` (a TSdoc-correction chore), not to any citation strip, so it falls outside this plan's scope boundary. Registered."

coverage:
  - deliverable: "apps/frontend/src/lib/contexts/** swept — 129 rules at 129 sites across 35 files, every destructure-trap invariant intact"
    verification:
      - kind: command
        ref: "node .planning/phases/152-comment-naming-hygiene-sweep/scripts/assert-comment-only-diff.mjs --range eb6225303~1..eb6225303 → 35 compared, 0 allowed, 0 violations, exit 0"
        status: pass
      - kind: command
        ref: "transcribed nine-row gate (comment-scoped) over apps/frontend/src/lib/contexts → 0 on every row"
        status: pass
      - kind: command
        ref: "git grep -ciE 'destructur' -- apps/frontend/src/lib/contexts → 33 before, 34 after (not lower)"
        status: pass
      - kind: command
        ref: "git grep -cinE '\\bsee\\s*$' -- apps/frontend/src/lib/contexts → 0 (no dangling pointer left behind)"
        status: pass
      - kind: command
        ref: "diff-grep for changed declaration lines under contexts → 0"
        status: pass
      - kind: test
        ref: "yarn workspace @openvaa/frontend test:unit → 54 files / 816 tests passed, count identical before and after"
        status: pass
    human_judgment: false
  - deliverable: "apps/frontend/src/lib/{dynamic-components,api}/** swept — 58 rules at 58 sites across 33 files, three named hard cases dispositioned"
    verification:
      - kind: command
        ref: "node …/assert-comment-only-diff.mjs --range 22d9c0d16~1..22d9c0d16 → 33 compared, 0 allowed, 0 violations, exit 0"
        status: pass
      - kind: command
        ref: "transcribed nine-row gate over both directories → 0 on every row"
        status: pass
      - kind: command
        ref: "git diff over supabaseDataProvider.ts shows no line touching 'Explicitly-typed shared DataObject' or 'union-suppressing'"
        status: pass
    human_judgment: false
  - deliverable: "the data writer's deliberately-not-taken fix survives as a compact citation-free statement"
    human_judgment: true
    rationale: "Whether the rewritten 18 lines still read as a usable instruction to a future maintainer is a judgement no test makes. Before and after are recorded verbatim below so a reviewer can check all three elements rather than take the claim."
  - deliverable: "the 13 in-prefix files the register queue never listed, swept — 29 rules at 29 sites across 16 files"
    verification:
      - kind: command
        ref: "node …/assert-comment-only-diff.mjs --range 5895b106a~1..5895b106a → 16 compared, 0 allowed, 0 violations"
        status: pass
      - kind: command
        ref: "comm over the register's 71 queue files vs the 84-file plan diff → 0 queue files missing, 13 extra, 0 out of partition"
        status: pass
    human_judgment: false
  - deliverable: "the gate-vs-reality gap measured at 37% on this partition, per rewrite site"
    human_judgment: true
    rationale: "The classification of each of the 216 rewrite sites into gate / wide / read is made by running three pattern sets over the site's ORIGINAL text; the boundary between 'wide' and 'read' depends on which patterns the wide set contains. The wide set is enumerated in full below so the number is reproducible rather than asserted."
  - deliverable: "21 152-05-class codemod sentence breaks repaired"
    verification:
      - kind: command
        ref: "each of the 21 anchor strings confirmed present as a removed line in git diff eb6225303~1..5895b106a"
        status: pass
    human_judgment: false
  - deliverable: "the Phase-157 adapter-typing handoff is on the record in a form the Phase-157 planner can find"
    verification:
      - kind: command
        ref: "recorded below under 'The Phase-157 handoff' and in .planning/WINDOWS.md entry 108, with file, line range, the reviewer's question and the roadmap goal"
        status: pass
    human_judgment: false
  - deliverable: "behaviour neutrality over the whole plan range"
    verification:
      - kind: command
        ref: "node …/assert-comment-only-diff.mjs --range eb6225303~1..5895b106a → 84 files changed, 84 compared, 0 allowed by name, 0 violations, exit 0"
        status: pass
      - kind: command
        ref: "yarn build → exit 0, 14 tasks successful"
        status: pass
      - kind: command
        ref: "yarn lint:check → exit 0, 22 tasks successful"
        status: pass
      - kind: command
        ref: "node scripts/assert-comment-hygiene.mjs → exit 0, 1560 files scanned, 0 violations"
        status: pass
    human_judgment: false

requirements-completed: [REVIEW-HYG-02]

duration: 40 min
completed: 2026-08-29
status: complete
---

# Phase 152 Plan 10: Frontend Library Sweep Summary

Swept `apps/frontend/src/lib/**` except `components/` — the largest partition of the seven
by file count, and the one whose comments most often *are* the invariant. Every Svelte 5
destructure-trap rule survives complete and citation-free, the data writer's
deliberately-not-taken fix survives with all three of its elements, the adapter's split
review item is on the record for Phase 157, and nothing but comment bytes changed.

**Duration:** 40 min · **Tasks:** 3 · **Commits:** 3 · **Files:** 84 · **Rewrite sites:** 216

---

## The two completeness numbers, and the route each site came from

152-09 named this plan by name: *"a 13-span partition should be read end to end; 152-10's
132 spans cannot be, so it needs the scanner AND a read of its long spans."* Both routes
were run, and every site is attributed to one of them.

### Route 1 — the widened scanner

The shipped `hygiene-grep-report.sh` **exits 2 under any caller pathspec** (memo item 2;
its own header says `SCOPE IS LOAD-BEARING`). The script was NOT modified. Its nine rows
were transcribed under a caller-supplied pathspec, twice: once raw (`git grep -P`) and
once **comment-scoped**, through the shared `hygiene-codemod.mjs` classifier's
`commentSpans()`. On top of that: 152-07's registered grep, 152-08's four added classes,
and ten more (`Group A-F`, `Wave N`, `Hypothesis X`, `finding N`, `NNN-PATTERNS`,
`Open Question`, `success criterion`, commit hashes, probe dates, `\b[A-Z][A-Z0-9]+-\d{1,3}[a-z]?\b`).

### Route 2 — a deliberate read

All **27 spans of seven lines and up** were read in full, plus every file whose only hits
were generic-English false positives. This is where the memo-17 class lives: planning
labels that name no artifact, which no id-shaped pattern can ever reach.

### The measurement, per REWRITE SITE

Measured per site, not per line: a multi-line rewrite has one anchor and many collateral
lines, so a per-line count inflates the read-only share (555 removed lines would have read
as 165 / 82 / 308). The honest unit is the site.

| Route | Sites | Share |
|---|---:|---:|
| Reachable by the **nine gate rows** | **136** | 63% |
| Reachable only by the **widened sweep** | **45** | 21% |
| Reachable by **neither** — found by reading | **35** | 16% |
| **Total rewrite sites** | **216** | |
| **Invisible to the gate** | **80** | **37%** |

The fifth such measurement in this phase: 152-07 ~27%, 152-08 64%, 152-09 54%, this one
37%. The share moves with the partition's prose style, not with the instrument; what does
not move is that **the gate alone is never the completeness test.**

### The 35 sites no scanner reached

Every one found by eye. They divide into two kinds.

**Planning labels naming no artifact** (14 sites): `D1 field-init order` ×8 (an ordering
finding's label; the ordering rule is real and stays), `Pattern 3 / L-2`, `A7`,
`A2 SEAM (research open-question A2 — RESOLVED)`, `A-02, stated so the collateral in the
negative-control ledger is not misread` ×2, `Group G`, `the spread-safety gate`,
`REACTIVE_ACCESSORS`, `to keep the audit grep clean`, `not the plan`, `the OLD code
ACCEPTED`, `Robustness gains vs StackedState` (a deleted class), `the two ad-hoc
mechanisms this block used to carry`.

**Codemod damage whose citation was already gone** (21 sites) — see the repair section.

One instructive near-miss: `EntityListControls.svelte:58` read `` `locale` is a rune handle
… post Phase `` / `` 97/98 store→rune migration ``. The phase number is on the NEXT LINE, so
the `phase-ref` row (`\bphases?\s+\d+`) does not match it and neither does the hyphenated-phase
class. Only reading found it.

---

## Whole-prefix ownership — fifth confirmation

The register's `152-10` queue lists **71 files**. The prefix rule
(`apps/frontend/src/lib/` after `apps/frontend/src/lib/components/`) covers **13 more**:

| File | What the queue missed |
|---|---|
| `admin/components/languageFeatures/LanguageSelector.svelte` | *"to keep the audit grep clean"* |
| `api/utils/auth/decryptAndVerifyIdToken.ts` | *"not the plan"* |
| `api/utils/auth/decryptAndVerifyIdToken.test.ts` | `Criterion 5`, *"the OLD code ACCEPTED"* |
| `contexts/admin/jobStates.svelte.ts` | `v2.13`, `CONVENTIONS`, `D1` |
| `contexts/app/popup/popupState.svelte.ts` | `v2.13`, `CONVENTIONS`, + a trailing-comma break |
| `contexts/auth/authContext.type.ts` | `Pitfall 1` |
| `contexts/candidate/candidateContext.svelte.test.ts` | `A2 SEAM`, `Plan 02` |
| `contexts/layout/VideoController.svelte.ts` | `Group F`, `v2.13` |
| `contexts/utils/paramState.svelte.ts` | `v2.13` + `get value ` empty-paren damage |
| `contexts/utils/persistedState.svelte.test.ts` | `CR-01` |
| `contexts/utils/settingsOverlay.svelte.test.ts` | *"the old index-based LIFO stack"* |
| `dynamic-components/navigation/admin/AdminNav.svelte` | `Plan 02` + a FALSE claim |
| `utils/viewTransition.ts` | `Plan 02`, `VT-03` |

71 + 13 = **84 files in the plan diff**. All 71 queue files appear in it. **0** paths outside
`apps/frontend/src/lib/`, **0** under `apps/frontend/src/lib/components/`, **0** under
`apps/frontend/src/routes/`.

---

## The data writer's timing block — before and after, verbatim

The register called this one of the two hardest judgement calls in the phase, and required
the before and after on the record. `supabaseDataWriter.ts`, seventeen lines at `:88-104`
(not the five lines CONTEXT.md records — `152-RESEARCH.md`'s correction confirmed at HEAD).

**Before:**

```
    // Future-reference note (see phase 86.1 ToU-406 chase): `auth.updateUser({ password })`
    // rotates the access token. The browser-side `createBrowserClient` instance is
    // expected to adopt the new token via its internal storage listener, but under
    // some Playwright timings the next PostgREST call from `SupabaseDataWriter` was
    // observed to send a stale/empty JWT, producing `auth.uid() = NULL` and a 406
    // "Cannot coerce" on the subsequent ToU UPDATE (RLS denies, 0 rows returned).
    // A targeted `await this.supabase.auth.refreshSession()` here would force the
    // in-memory client to re-read the freshly-issued session before the caller
    // proceeds, which should harmlessly close that race. NOT added now because:
    //  (a) the live failure was not reproduced under 20× repeat-each after the
    //      previous user-visible error surface was added — only Inbucket polling
    //      flake remained;
    //  (b) `refreshSession()` issues an extra network round-trip on every password
    //      set/reset, and rare edge cases (e.g. expired refresh token, network
    //      partition) could turn a working setPassword into a thrown error.
    // If the 406 reappears, add `await this.supabase.auth.refreshSession()` here
    // (and mirror in `_resetPassword` / `_register` above) and re-verify.
```

**After:**

```
    // Future-reference note. `auth.updateUser({ password })`
    // rotates the access token. The browser-side `createBrowserClient` instance is
    // expected to adopt the new token via its internal storage listener, but under
    // some Playwright timings the next PostgREST call from `SupabaseDataWriter` was
    // observed to send a stale/empty JWT, producing `auth.uid() = NULL` and a 406
    // "Cannot coerce" on the subsequent ToU UPDATE (RLS denies, 0 rows returned).
    // A targeted `await this.supabase.auth.refreshSession()` here would force the
    // in-memory client to re-read the freshly-issued session before the caller
    // proceeds, which should harmlessly close that race. It is deliberately NOT
    // added, for two measured reasons:
    //  (a) the live failure did not reproduce under 20× repeat-each once the
    //      user-visible error surface was in place — only Inbucket polling
    //      flake remained;
    //  (b) `refreshSession()` issues an extra network round-trip on every password
    //      set/reset, and rare edge cases (e.g. expired refresh token, network
    //      partition) could turn a working setPassword into a thrown error.
    // If the 406 reappears, add `await this.supabase.auth.refreshSession()` here
    // (and mirror in `_resetPassword` / `_register` above) and re-verify.
```

**All three required elements survive.** The **alternative**: `await
this.supabase.auth.refreshSession()` at this exact line. The **two measured reasons**: (a)
no repro under 20× `repeat-each`; (b) an extra round-trip that can turn a working
`setPassword` into a throw. The **re-trigger condition**: *"If the 406 reappears, add …
here (and mirror in `_resetPassword` / `_register` above) and re-verify."*

Exactly two things changed: the parenthetical citation is gone, and *"NOT added now
because"* — which dates the decision to a moment — became *"is deliberately NOT added, for
two measured reasons"*, which does not. One line longer (17 → 18) because the citation's
removal left the first line short; **no line-break join was performed anywhere in this
plan** (152-14 owns those under an operator decision).

---

## The Phase-157 handoff

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`
**Lines:** `361-366` (the comment above the `const base = { … }` object)
**Left byte-identical by this plan** — verified: no line in the plan-range diff touches
`Explicitly-typed shared DataObject` or `union-suppressing`.

The PR #869 review item on this comment has two halves. `152-RESEARCH.md` § 10.2 confirms
the split.

- **The typing half — Phase 157's.** The reviewer asked: *"Aren't the fields already typed
  by `toDataObject`? They should be."* The comment asserts *"Explicitly-typed shared
  DataObject fields … no union-suppressing cast"*, while the object immediately below it is
  a wall of `as string | null | undefined` casts plus two `reason:`-annotated JSONB casts.
  That contradiction maps directly onto Phase 157's roadmap goal: *"Data crossing the
  Supabase boundary is validated into its type rather than cast into it."* **Phase 157
  should rewrite this comment wholesale once the casts are replaced by validation** — which
  is why 152-10 left its sentence semantically unchanged rather than tidying it.
- **The line-break half — plan `152-14`'s**, under an operator decision. It carries no
  planning reference, so it was never in this plan's class.

Also recorded in `.planning/WINDOWS.md` entry 108, so the Phase-157 planner finds it from
either end.

---

## Per-span dispositions — every span of seven lines and up

All 27, with the line count before and after. Every one is a **rewrite**; nothing of seven
lines or more was deleted outright.

| File | Lines | Disposition | Reason |
|---|---:|---|---|
| `contexts/app/appContext.svelte.ts` (class docblock) | 49 → 44 | rewrite | The spread-safety discipline is the load-bearing rule of the file and survives in full, including *why* a prototype getter would be silently dropped by the three downstream spreads. Struck: the factory's line count, `success criterion 1/3`, `CONVENTIONS`, `109-PATTERNS finding 4`, `109-03`, four `see phase` citations and `v2.11`/`v2.13`. The `see phase 107/108` pointer became a pointer to the in-tree proof (`appContext.spread.svelte.test.ts`), which is a better pointer. |
| `contexts/admin/adminContext.svelte.ts` (class docblock) | 32 → 30 | rewrite | The getter-collision audit is a live safety argument (*"Do NOT add any `Object.assign` that carries an `isAuthenticated` key"*) and survives verbatim. Struck: `112-PATTERNS`, `Phase-111`, `Phase-109`, `v2.11`, `v2.13`, `Pitfall-2`. |
| `contexts/candidate/candidateContext.svelte.ts` (inheritance block) | 18 → 17 | rewrite | The SSR strict-mode `TypeError` mechanism is the reason the code excludes `logout` from the copy, and survives word for word. `LANDMINE FIX (111-03)` → `LANDMINE`; *"The Plan-02 reasoning was only half-right"* → *"'A prototype getter is not clobbered' is only half the story"* — same correction, no citation. |
| `api/…/supabaseDataWriter.ts` (timing block) | 17 → 18 | rewrite | See the verbatim section above. |
| `contexts/candidate/candidateContext.svelte.ts` (logout + destructure-trap) | 16 → 17 | rewrite | The destructure-trap contract is what CLAUDE.md calls the most-repeated defect in this codebase's history. *"the canonical Phase-61 destructure-trap diagnostic"* → *"the canonical example of the destructure trap"*; every word of the rule kept, and the CLAUDE.md pointer kept. |
| `contexts/component/componentContext.svelte.ts` (spread-safety) | 16 → 16 | rewrite | Kept the whole spread-safety argument and the stable-vs-reactive distinction. Struck `107-01`, `Group G`, two brittle line-number references (`line ~297`, `lines ~292/356`), and repaired `new DarkMode ` / `get darkMode `. |
| `contexts/voter/voterContext.svelte.ts` (class docblock) | 16 → 14 | rewrite | The shape decision (*prototype getters are fine here because nothing spreads voterContext*) is a live constraint and survives. Struck `110-PATTERNS`, `Phase-109`, `CONVENTIONS`, `v2.13`, `D1`. |
| `contexts/candidate/candidateContext.svelte.ts` (class docblock) | 16 → 14 | rewrite | Same shape as voterContext's. Struck `111-PATTERNS`, `Phase-109`, `Phase-107`, `CONVENTIONS`, `v2.13`. |
| `contexts/candidate/candidateUserDataState.svelte.ts` | 13 → 14 | rewrite | The `Impl`-suffix rule was stated as *"Per the D2 type-name-clash landmine"* — a citation with no content. Replaced by the reason itself: *"a class sharing the type's name would clash with it"*. Repaired the stray `unchanged, —`. |
| `api/utils/auth/__tests__/token-endpoint.test.ts` (out-of-scope block) | 13 → 13 | rewrite | The asymmetry between the Idura and Signicat describes is a real scoping decision the file must keep explaining, or it reads as half-migrated. Re-tensed out of *"which see phase 140 converted"* into what the two describes DO. |
| `contexts/candidate/candidateContext.svelte.test.ts` (harness header) | 10 → 10 | rewrite | The harness's mechanism (spy-on-collaborator under `$effect.root`) and its CLAUDE.md compliance note both stay. Struck `A2 SEAM`, `Plan 02`, and two brittle source line numbers (`:355-394`, `:378`); the assertion's PURPOSE (*"the blocks-path arg object carries `entityType`"*) is stated instead. |
| `contexts/admin/adminContext.svelte.ts` (constructor block) | 10 → 10 | rewrite | The no-exclusion-needed argument is load-bearing and stays. Struck `Phase-109`, `v2.11`, `see phase 113 CR-01`. |
| `contexts/utils/settingsOverlay.svelte.ts` (header) | 10 → 8 | rewrite | The two failure modes of an index-based stack are why the token-keyed registry exists, and both stay. Re-tensed from *"The superseded `StackedState` (deleted; see phase 98) implemented…"* into a statement of the shape being rejected, which stays true after the deleted class is forgotten. |
| `contexts/voter/voterContext.svelte.ts` (`$state` mirror rationale) | 9 → 8 | rewrite | The destructure-snapshot mechanism is the invariant. Re-tensed from *"The previous `$derived.by` pull-chain captured…"* to *"A `$derived.by` pull-chain here would capture…"* — the same fact as a live warning rather than a changelog. Repaired the dangling *"documented."* |
| `contexts/utils/settingsOverlay.svelte.ts` (class docblock) | 9 → 8 | rewrite | The reassigned-array-field rule and the one-permitted-`$effect` rule both stay; `Group F`, `v2.13`, `CONVENTIONS` and `see spike 020 finding A` go. |
| `contexts/app/tracking/trackingService.svelte.ts` (spread-safety) | 9 → 7 | rewrite | Repaired a DUPLICATED line the strip left (*"the spread-of-context fix (see phase 109) / spread-of-context fix lands"*) and kept the whole own-enumerability requirement. |
| `contexts/component/darkMode.svelte.ts` | 8 → 8 | rewrite | The prototype-getter-is-safe-here argument stays; repaired `get darkMode ` and `new DarkMode `. |
| `contexts/voter/voterContext.svelte.ts` (helper-store inlining) | 8 → 7 | rewrite | The cross-module invalidation failure is the reason the code is push-based. Repaired the dangling *"the candidate-side fix in)."* |
| `contexts/data/dataContext.svelte.ts` (version-bridge) | 8 → 7 | rewrite | *"Per this version-bridge is KEPT verbatim"* was a broken sentence (the noun after `Per` had been stripped). Rewritten to the claim it was making: the bridge does not simplify away, because it is intrinsic to wrapping a non-rune object. |
| `contexts/utils/persistedState.svelte.ts` (persist-on-init) | 8 → 6 | rewrite | The `sessionId` regression is the reason the constructor persists on init. Re-tensed from *"dropping to `set`/`update`-only persistence silently regressed…"* to *"Persisting ONLY on `set`/`update` would silently break…"*, and repaired the dangling `— * ).` |
| `contexts/admin/jobStates.svelte.ts` | 8 → 6 | rewrite | Prototype-getter reactivity rule kept; `v2.13`, `CONVENTIONS` and the closure-factory history go. |
| `utils/route/buildRoute.ts` | 7 → 7 | rewrite | The name-disjoint dissociation rule is a live routing invariant, restated at five sites; all five survive. Repaired the dangling *"surface; new in)."* |
| `contexts/voter/voterContext.svelte.ts` (why-on-voterContext) | 7 → 7 | rewrite | The redirect-loop mechanism is the reason `entityTab` is not force-filled, and stays; re-tensed from *"previous behavior auto-redirected"* into what force-filling does. |
| `contexts/utils/inheritContextMembers.ts` | 7 → 7 | rewrite | This helper exists BECAUSE `Object.assign` snapshots an accessor. The mechanism stays in full; *"the exact reactivity-loss bug see phase 113 exists to prevent — see CR-01"* becomes *"the exact reactivity-loss bug this helper exists to prevent"*. |
| `contexts/voter/voterContext.svelte.ts` (constructor inheritance) | 7 → 6 | rewrite | Same as candidateContext's; `L488`, `Phase-109`, `D1`, `see phase 113 CR-01` go, the live-accessor requirement stays. |
| `contexts/candidate/candidateContext.svelte.ts` (pull-chain diagnosis) | 7 → 6 | rewrite | The destructure-capture root cause — *"a DESTRUCTURED context-object property captures the getter's INITIAL return value as a plain local binding"* — is the single most important sentence in this partition and is untouched. Only `(see phase 61 Plan 03, Hypothesis A reactivity fix)` and *"verified in this plan"* went. |
| `_guards/eslint-store-guard.test.ts` (header) | 7 → 4 | rewrite | The CONSTRUCTION-vs-PROOF split is what the header is for and stays; the phase numbers, the commit hash and *"nine days after the todo asking for it was filed"* are changelog and went. |

---

## The 21 codemod repairs (memo item 14)

Pre-existing damage from earlier planning-reference strips, not damage caused here. Each was
found by reading; each anchor is confirmed present as a removed line in the plan-range diff.

**Dangling fragments (15).** `appContext.svelte.ts`: `handle` / `// . It must be created
here` (orphan period), `(see phase 113` / `// ), installed via`, `(replaces pageDatumState
per` / `// ).`, and `* the DB override is folded` (a decapitated sentence opening).
`appContext.type.ts`: `(see phase 113` / `* ).`. `persistedState.svelte.ts`: `NOT an
$effect —` / `* ).`, and `no format-migration shim,` / `* per) and persists`.
`layoutContext.svelte.ts`: `NOT an $effect on the class —` / `// );`.
`voterContext.svelte.ts`: `mirroring the candidateContext fix` / `// documented.`, and
`the candidate-side fix in). The behavior is`. `buildRoute.ts`: `surface; new in).`
`dataContext.svelte.ts`: `Per this version-bridge is KEPT verbatim` (dangling `Per`) and
`Replaces the previous former non-reactive` (doubled). `adminContext.svelte.ts`:
`// / Pitfall 2` (orphan slash). `popupState.svelte.ts`: `context-as-class migration,`
followed by an empty continuation line. `trackingService.svelte.ts`: a DUPLICATED
`spread-of-context fix` line. `candidateUserDataState.svelte.ts`: `PersistedStateImpl`
`` unchanged, — this `` (a stray comma before the dash).

**Empty-paren damage (6).** A strip left the identifier with a trailing space and no
parentheses: `new DarkMode ` ×2, `get darkMode `, `get value `, `Updatable.subscribe `,
`initXxxContext `.

**And no others.** A comment-scoped scan for seven damage signatures over the post-sweep
partition returns only false positives: English sentences ending `to.` / `from.` / `in.`,
em-dash line continuations, and `()` inside code identifiers.

---

## Two unsatisfiable acceptance criteria, both proven by a named, flip-tested route

### 1. *"The retargeted gate … reports 0 on every gate row"* (Tasks 1-3)

Over the **raw** tree, two rows cannot reach zero. All five survivors are `describe()`
**TITLES**:

| Row | Site | Title |
|---|---|---|
| `task-id` | `_guards/eslint-store-guard.test.ts:86` | `'svelte/store ESLint guard — ASSERT-08 app-wide reach'` |
| `task-id` | `contexts/candidate/candidateContext.svelte.test.ts:103` | `'candidateContext questionBlocks — Bug 1 (RUNES-05): …'` |
| `task-id` | `i18n/tests/translations.test.ts:218` | `'TranslationKey type safety (CLEAN-04)'` |
| `decision-id-bare` | `_guards/eslint-store-guard.test.ts:131` | `'extension reach (D-05)'` |
| `decision-id-bare` | `_guards/eslint-store-guard.test.ts:146` | `'dynamic import() closure (D-06)'` |

Doubly out of bounds: this plan's own prohibition assigns title renames to `152-13`, and all
five are program bytes `assert-comment-only-diff.mjs` forbids changing with zero allow
entries. **Proven instead** by the comment-scoped route — the same nine patterns through the
shared classifier's `commentSpans()` — which reads **0 on every gated row** over the whole
partition. **FLIP-TESTED:** injecting one token of each of the nine classes into one comment
in `utils/getAllianceSummary.ts` turns **all nine rows red**, raw and comment-scoped alike;
reverting returns all nine to 0 and the file to byte-identical. Registered as WINDOWS 99.

### 2. *"the declaration-line diff-grep returns 0"* (Task 2, criterion 6)

It returns **2**. One citation sat in a **trailing comment on a declaration line**:

```
let subcardsMaxOverride: number | undefined; // see phase 69: alliance branch overrides maxSubcards…
```

The grep matches the whole line, so a comment-only edit to a trailing comment is
indistinguishable from a declaration change *by that instrument*. Moving the comment above
the line would be a forced-line-break change — `152-14`'s, under an operator decision — so
it was not done. **Proven instead** by a comment-stripped comparison over the same grep
output (`sed -E 's@//.*$@@'`, then strip the `+`/`-` marker, then `sort | uniq -c`): a
comment-only edit yields **ONE distinct line with count 2** (symmetry). **FLIP-TESTED:**
temporarily widening the declaration to `number | undefined | null` yields **TWO distinct
lines with count 1 each** (asymmetry); reverting restores symmetry and the file to
byte-identical. Registered as WINDOWS 100.

Under contexts (Task 1) the same grep returns **0** as written.

---

## Memo items 12 and 13 — a negative finding on both, again

Both fenced operator questions were checked and **neither fires here.** Recorded because a
negative narrows the operator's question rather than adding to it (second such negative,
after 152-09).

- **Item 12 (E2E coverage ids).** `git grep -P` for `EFLOW-`/`EPERM-`/`TMPL-`/`EQTYP-`/
  `UNBLK-`/`VGATE-` over the partition returns **zero**. None of the 23 residual coverage ids
  reaches this tree; nothing to defer, nothing to strip. The three `task-id` survivors above
  are unrelated test titles and are registered as `152-13`'s work.
- **Item 13 (Markdown).** The partition contains **seven** `.md` files — `api/README.md`,
  `candidate/components/README.md`, `contexts/README.md`, `dynamic-components/README.md`,
  `i18n/README.md`, `server/admin/jobs/README.md`, `server/api/README.md`. All **nine gate
  rows over them report 0**, and a wide sweep (`RESEARCH`/`SUMMARY`/`CONVENTIONS`/`Pitfall`/
  `criterion N`/`this phase`/`Wave N`/`Group A-F`/`NNN-NN`) returns **0** as well. No `.md`
  byte needed to change and **none did**. The Markdown question stays exactly where 152-08
  left it: open, and still scoped to `packages/dev-seed/README.md`.

---

## What was deliberately not touched

| Target | Why |
|---|---|
| `supabaseDataProvider.ts:361-366` (the base-object comment) | Carries no planning reference. Line-break half is `152-14`'s; typing half is Phase 157's. Left semantically unchanged and byte-identical so Phase 157 can rewrite it wholesale. |
| Every `describe`/`it`/`test` title | `152-13` owns titles. Diff grep for title lines across the plan range: **0**. |
| `apps/frontend/src/lib/components/**` | A sibling's partition (`152-11`). **0** such paths in the plan diff — including the three copies of the *"to keep the audit grep clean"* comment in `Input.svelte`, `Video.svelte` and `SingleGroupConstituencySelector.svelte`, which are identical to the one swept in `lib/admin/` and were left alone. |
| `apps/frontend/src/routes/**` | Also `152-11`'s. **0** such paths in the plan diff. |
| `utils/sorting.ts:8` | `@param target - . The value to move to the front.` — a dangling shape, but `git log --follow -S` traces it to `6fe18ddfd` (a TSdoc-correction chore), not to any citation strip. Outside the scope boundary. Registered as WINDOWS 105. |
| Any line-break join | None performed. Every line-count reduction above is a content deletion or a repair of a strip-damaged line pair, never a join of two artificially-broken prose lines. |
| Any `.md` byte | See memo item 13 above. |

---

## Verification

| Check | Result |
|---|---|
| `assert-comment-only-diff.mjs --range eb6225303~1..5895b106a` (the plan's **sweep** range, **bounded at the last REFACTOR commit** per WINDOWS 98) | **84 files changed, 84 compared, 0 allowed by name, 0 violations, exit 0** |
| — the same prover run to **HEAD** (through the metadata commit) | reports one violation per `.planning/` Markdown file in the range; the classifier maps `md` to an empty comment family, so it reads every Markdown byte as code. **No allow entry was added.** Both numbers recorded so a reader can reproduce. |
| — per commit: `eb6225303~1..eb6225303` | 35 compared, 0 allowed, **0 violations** |
| — per commit: `22d9c0d16~1..22d9c0d16` | 33 compared, 0 allowed, **0 violations** |
| — per commit: `5895b106a~1..5895b106a` | 16 compared, 0 allowed, **0 violations** |
| transcribed nine-row gate, **comment-scoped**, over `apps/frontend/src/lib` minus `components/` | **0 on every row**, `milestone-ver` 0 |
| — the same, over `contexts/` alone | **0 on every row** |
| — the same, over `dynamic-components/` + `api/` | **0 on every row** |
| transcribed nine-row gate, **raw** | `decision-id-bare 2 / task-id 3` — all five `describe()` titles; see the unsatisfiable-criteria section |
| — **flip test** | injecting one token of each class into one comment turns **all 9 rows red** (raw and comment-scoped); reverting returns **all 9 to 0** and the file to byte-identical |
| widened id-shaped sweep, post-sweep | 2 residual lines, both read and classified as false positives (`Svelte issue #7549`, `RSA-OAEP-256`) |
| second-order narrative scan, post-sweep | 0 real lines |
| damage-signature scan, post-sweep | 0 real lines |
| out-of-partition paths in the plan diff | **0** |
| `apps/frontend/src/lib/components/` or `src/routes/` paths in the plan diff | **0** |
| register-queue files missing from the diff | **0** (all 71) |
| in-partition files the queue never listed, swept anyway | **13** |
| `git grep -ciE 'destructur' -- …/contexts` | **33** before, **34** after (criterion: not lower) |
| dangling `see`-at-end-of-line across `contexts/` | **0** |
| declaration lines changed under `contexts/` | **0** |
| declaration lines changed under `api/` + `dynamic-components/` | 2, comment-stripped-identical; see unsatisfiable criterion 2 |
| `.md` bytes changed | **0** |
| `yarn build` | **exit 0** — 14 tasks successful |
| `yarn workspace @openvaa/frontend test:unit` | **exit 0** — **54 files / 816 tests passed**, counts identical before and after |
| `yarn lint:check` | **exit 0** — 22 tasks successful |
| `node scripts/assert-comment-hygiene.mjs` | **exit 0** — 1,560 files scanned, 0 violations |
| `npx prettier --check` on every changed file | clean, all three commits |

**The E2E suite was not re-run**, per the plan's own `<verification>` and memo item 9. The
change is comment-only, `assert-comment-only-diff.mjs` with zero allow entries is the
stronger guarantee for a comment-only diff, and 152-05 discharged the phase's cardinal gate
at 150 passed / 0 failed / 0 flaky / 0 did-not-run. The prover confirms this plan changed
nothing the suite can observe.

---

## Deviations from Plan

### Auto-fixed

**1. [Rule 3 — blocker] The plan's gate invocation exits 2**
- **Found during:** Task 1
- **Issue:** memo item 2 — `hygiene-grep-report.sh` rejects any caller pathspec by design (`SCOPE IS LOAD-BEARING`)
- **Fix:** transcribed the same nine patterns under a caller-supplied pathspec, raw and comment-scoped, as 152-06, 152-08 and 152-09 did. The script was **not** modified.

**2. [Rule 2 — missing critical] Swept 13 in-partition files the plan's `files_modified` and the register queue both omit**
- **Found during:** Tasks 1 and 2, from the prefix rule rather than the queue
- **Issue:** memo items 1 and 11 — the queue is span-derived, ownership is a prefix rule
- **Fix:** swept all 13, in a separate third commit so the two diffs stay separable
- **Commit:** `5895b106a`

**3. [Rule 2 — missing critical] Repaired 21 broken sentences the plan did not anticipate**
- **Found during:** Tasks 1 and 2
- **Issue:** memo item 14 — 152-05-class strip damage sitting in this partition
- **Fix:** all 21 repaired, enumerated above and in WINDOWS 104
- **Commits:** `eb6225303`, `22d9c0d16`, `5895b106a`

**4. [Rule 1 — bug] Corrected a FALSE claim rather than de-citing it**
- **Found during:** Task 2
- **Issue:** memo item 6 — `AdminNav.svelte:33` claimed `getRoute` *"is still a store in this plan"*. It is a `{ readonly current }` rune handle, and the same file calls `getRoute.current(...)` at seven template sites.
- **Fix:** corrected the statement; deleting only the `Plan 02` citation would have left the falsehood standing more baldly
- **Commit:** `22d9c0d16`

### Registered, not engineered around

Two acceptance criteria proved unsatisfiable as written; both are proven by a named,
flip-tested alternate route and registered rather than restated as met. See the
unsatisfiable-criteria section above.

Ten items were recorded in `.planning/WINDOWS.md` (entries **99-108**):

1. **99** — the gate-row criterion, unsatisfiable over five `describe()` titles; comment-scoped route + flip test
2. **100** — the declaration-line criterion, unsatisfiable over one trailing comment; comment-stripped route + flip test
3. **101** — the prover range bounded at the last refactor commit, with both numbers
4. **102** — register queue vs prefix partition, FIFTH confirmation (13 extra files, enumerated)
5. **103** — the gate-vs-reality gap at 37%, measured per rewrite site
6. **104** — the 21 codemod repairs
7. **105** — `utils/sorting.ts:8`, pre-existing TSdoc damage, out of scope
8. **106** — the FALSE `getRoute`-is-a-store claim, corrected
9. **107** — memo items 12 and 13 do not fire in this partition (negative finding)
10. **108** — the Phase-157 adapter-typing handoff

**Total deviations:** 4 auto-fixed (1 tooling workaround, 1 scope expansion, 21 repairs, 1
false-claim correction). **Impact:** none on behaviour — the prover reports zero non-comment
byte changes with zero allow entries across all three commits and across the whole range.

---

## Issues Encountered

None beyond the two registered unsatisfiable criteria. The applier aborted twice on drifted
anchors (both indentation mismatches in `supabaseDataProvider.ts` and `NavGroup.svelte`);
both times it refused to apply a partial batch, which is the behaviour it exists for, and
both were corrected before any byte was written.

---

## Next Phase Readiness

Ready for `152-11`. Four notes it should carry:

1. **Your partition is adjacent to this one and shares its idioms.** `apps/frontend/src/lib/components/**`
   carries **three** copies of the *"to keep the audit grep clean"* comment (`Input.svelte`,
   `Video.svelte`, `SingleGroupConstituencySelector.svelte`) that this plan left untouched
   because they are yours. The reactive-accessor one-liners (`appSettings is a reactive
   accessor (see phase 113 flatten) — read via ctx.X`) recur throughout the routes too.
2. **Own your whole prefix.** Fifth confirmation: 13 of this plan's 84 files were in the
   prefix and in no queue.
3. **Bound the prover range at your last refactor commit** (WINDOWS 98 / memo item 16), and
   say so with both numbers.
4. **Both fenced questions stay fenced.** Neither fired here either, so both remain exactly
   as 152-07 and 152-08 left them.

For `152-13`: five `describe()` titles in this partition carry planning ids and are waiting
for you — `ASSERT-08`, `RUNES-05`, `CLEAN-04`, `D-05`, `D-06`. For `152-14`: one trailing
comment on a `let` declaration (`EntityCard.svelte:141`) is the shape your operator decision
governs. For **Phase 157**: see the handoff section.

## Self-Check: PASSED

- All 84 modified files exist on disk and appear in `git diff --name-only eb6225303~1..5895b106a`.
- All three commits found in `git log`: `eb6225303`, `22d9c0d16`, `5895b106a`.
- All acceptance criteria from all three tasks re-run; the two that cannot be satisfied as
  written are proven by named, flip-tested alternate routes and registered.
- The plan-level `<verification>` block re-run in full; results recorded in the Verification
  table above.
