# Phase 143 — `svelte/store` Guard: App-Wide Reach + Fallout Triage — Discussion Points

**Phase**: 143 · **Requirements**: ASSERT-08, ASSERT-09 · **Milestone**: v2.15 Trustworthy Foundations
**Baseline measured at HEAD**: `374af0bf6` (branch `feat-gsd-roadmap`), 2026-08-22
**Decisions**: 15 · **⚠ DECIDE (shape-changing)**: 4 — **B1**, **B2**, **C2**, **F1**

> **The headline, read § A first.** The roadmap line for this phase says *"Widen the ESLint guard from
> contexts/routes to all of `apps/frontend/src/**`"*. **That widening already landed** — commit
> `7c47b35b7 refactor(115-02): widen svelte/store ESLint guard to src/**/*.{ts,svelte} (SWEEP-03)`,
> 2026-06-13, Phase 115. And the fallout ASSERT-09 exists to triage is **measured zero**: not one real
> `svelte/store` import exists anywhere in the tracked repo. Phase 143 as written is a phase whose work
> is done and whose premise is stale. What is genuinely missing is the **negative-control evidence** the
> milestone's standing acceptance rule demands, four **measured reach gaps**, and a **record correction**
> across three targets. **B1** decides whether that is what Phase 143 becomes.
>
> This is the same shape as F-140-01 (Phase 140 built the guard; the roadmap said it hadn't; Phase 141
> supplied the evidence and corrected the record). The precedent is directly usable.

---

## How to fill this in

- Checkboxes sit next to each **option**. Exactly one option per decision carries **★ RECOMMENDED**.
- **Leave everything unchecked** and the ★ options are taken as chosen — you never tick to agree.
- **Tick a different box to overrule.** One box per decision.
- Free text (`**EDIT:**` / `**NOTE:**`, or a written-in option) beats every box.
- ⚠ DECIDE marks decisions that change the phase's shape, not just its details. Skim those first.

---

## § A — Re-verified factual baseline

Everything below was measured on the working tree at `374af0bf6`, not inherited from the roadmap's
restatement. Reach rows come from an ESLint-API probe run with `flags: ['v10_config_lookup_from_file']`
— the exact flag `apps/frontend/package.json:10` (`eslint --flag v10_config_lookup_from_file src/`) uses,
so the probe loads the same config resolution the real lint gate does.

### A.1 — What the guard is, and when it got that way

| Claim in the roadmap / todo | Actually on the tree | Evidence |
|---|---|---|
| Guard scoped to `lib/contexts/**` + `routes/**` | **False.** Scope is `src/**/*.{ts,svelte}` | `apps/frontend/eslint.config.mjs:88` |
| Widening is Phase 143's work | **Already done**, 2026-06-13 | `git blame -L 88` → `7c47b35b75`; `git log -L 86,88` shows the `contexts/routes` → `src/**` diff |
| Pre-existing usages will surface | **Zero exist** | `git grep "from 'svelte/store'"` → 2 hits, both inside `eslint-store-guard.test.ts` (a comment and a fixture string), 0 real imports repo-wide |
| Todo is pending | Pending but **superseded** 9 days after it was filed | `.planning/todos/pending/2026-06-04-extend-svelte-store-eslint-guard-app-wide.md` (created 2026-06-04) vs `7c47b35b7` (2026-06-13) |
| A guard self-test exists | **Yes, at one probe path only** | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:39-56` — positive + negative control, both anchored at `src/lib/_guards/__store_guard_probe__.ts` |

### A.2 — Measured reach: where the guard fires and where it is silent

| # | Probe | Result | Meaning |
|---|---|---|---|
| 1 | `src/lib/components/__p__.ts` | **FIRES** | SC-1 site 1 already covered |
| 2 | `src/lib/utils/__p__.ts` | **FIRES** | SC-1 site 2 already covered |
| 3 | `src/lib/dynamic-components/__p__.ts` | **FIRES** | SC-1 site 3 already covered |
| 4 | `src/lib/candidate/components/__p__.ts` | **FIRES** | SC-1 site 4 already covered |
| 5 | the same four as `.svelte` (script block) | **FIRES** ×4 | component files covered too |
| 6 | `src/lib/components/__p__.svelte.ts` | **FIRES** | rune-module naming covered (matches `*.ts`) |
| 7 | `import type { Writable } from 'svelte/store'` | **FIRES** | type-only imports are **not** exempt |
| 8 | `export { writable } from 'svelte/store'` | **FIRES** | re-export covered |
| 9 | `src/routes/__p__.ts` | **FIRES** | old scope still covered (no regression from widening) |
| 10 | **`src/lib/components/__p__.js`** | **silent** | **GAP** — glob is `{ts,svelte}`; a hand-written `.js`/`.mjs` under `src/` is unguarded → **C2** |
| 11 | **`await import('svelte/store')`** | **silent** | **GAP** — `no-restricted-imports` does not see dynamic `import()` → **C3** |
| 12 | **`import { tweened } from 'svelte/motion'`** | **silent** | store-shaped but a **different module**; in scope? → **C4** |
| 13 | **`apps/frontend/vite.config.probe.ts`** (outside `src/`) | **silent** | the lint script is `eslint src/` — nothing outside `src/` is linted at all → **C5** |
| 14 | `export const x = $state(0)` in `src/lib/components/` | silent | negative control holds — no false positive |

**On gap 10's blast radius:** the only `.js` files under `apps/frontend/src` today are the 12
paraglide-generated ones, all covered by `.gitignore` (`src/lib/paraglide/.gitignore` = `*`) **and**
already excluded from lint by `packages/shared-config/eslint.config.mjs:35` (`'**/src/lib/paraglide/**'`).
So closing gap 10 has no measured fallout — but that must be re-measured after the change, not assumed.

### A.3 — Exclusion list, as it stands

`apps/frontend/eslint.config.mjs:23-40` — **18 entries**, of which one is a negation (`'!**/.env.example'`)
and one, **`'**/_spikes-*/**'` (line 40)**, matches **nothing**: `find apps -type d -name "_spikes*"`
returns empty. It is dead weight from v2.13. SC-3 requires the list end no larger than it started → **E1**.

---

## § B — Phase shape

### B1 ⚠ DECIDE — What is Phase 143, given the widening already landed?

ASSERT-08's *substance* ("the guard covers the whole tree") is **true today** and provable in 8 of 8
probes at the four named directories. What is **not** satisfied is ASSERT-08's *proof clause*
("proven by injection") under the milestone's standing acceptance rule (`REQUIREMENTS.md:7-13`): the
guard has never been observed **blind** at those sites, only observed working. ASSERT-09's fallout is
measured zero. Meanwhile four reach gaps (A.2 rows 10-13) are real and were never enumerated anywhere.

- [x] **★ RECOMMENDED — Re-scope to "prove the reach, close the measured gaps, correct the record".**
      Phase keeps its number and both requirements, and delivers: (1) the two-run control at all four
      SC-1 sites, OLD half measured against a temporarily narrowed glob (**B2**); (2) closure of the
      reach gaps the discussion selects (**C2**/**C3**); (3) the standing four-site guard test (**C1**);
      (4) ASSERT-09 discharged as a **measured** zero with the command, HEAD and per-file disposition
      (**D1**); (5) the three-target record correction (**F1**). This is exactly the F-140-01 → Phase 141
      shape, which is in-tree precedent rather than an invention.
      *Cost:* the phase does real work but not the work its title implies — the title needs rewriting.
- [ ] Close 143 as a **pure record correction**: mark ASSERT-08/09 satisfied-by-Phase-115, cite
      `7c47b35b7`, correct the roadmap and the todo, build nothing.
      *Cost:* leaves ASSERT-08's "proven by injection" clause unmet against the milestone's own
      non-negotiable rule, and leaves four measured reach gaps documented-but-open. The milestone has
      already rejected this posture once, in writing, for F-140-01.
- [ ] **Drop Phase 143** entirely; fold the record correction into `/gsd-complete-milestone`'s sweep and
      file the reach gaps as todos.
      *Cost:* the gaps get filed at the exact moment attention leaves them, and ASSERT-08/09 ship
      unproven with no phase owning the evidence.
- [ ] **Widen the ambition**: make this "the frontend is store-free, enforced" — close every gap
      including `svelte/motion`, files outside `src/`, and the whole `tests/` tree.
      *Cost:* pulls `svelte/motion` migration and lint-script scope into a phase sized for neither;
      `svelte/motion` is a separate ban with separate fallout (see **C4**).

**EDIT:**

---

### B2 ⚠ DECIDE — How is the OLD (blind) half of SC-1's two-run control produced?

SC-1 requires the four injections to **PASS under the pre-change guard scope**. That scope has not
existed since 2026-06-13, so the blind half must be reconstructed. The milestone rule is explicit that
a requirement whose check has not been *observed* failing is not satisfied "however green the suite looks".

- [x] **★ RECOMMENDED — In-place narrow → measure → restore, recorded in a ledger.** Temporarily set
      `eslint.config.mjs:88` back to `['src/lib/contexts/**/*.{ts,svelte}', 'src/routes/**/*.{ts,svelte}']`,
      run the four injections through the real `yarn lint:check` (not the API), record all four GREEN
      (blind), restore, and prove the restore with `git diff --exit-code` on the config. This is Phase
      141's `141-ASSERT10-LEDGER.md` discipline verbatim — mutate, measure, restore, prove byte-identical
      — and it measures the **real gate**, which is what the requirement's wording ("fails
      `yarn lint:check`") actually names.
      *Cost:* the working tree is deliberately broken for the duration; the ledger must record HEAD and
      the restore proof or the evidence is worthless.
- [ ] **Synthesize the old scope in a fixture config** — a committed
      `src/lib/_guards/fixtures/eslint.old-scope.config.mjs` reproducing the pre-115 block, driven via
      ESLint's `overrideConfigFile`, so the blind half becomes a permanent test rather than a one-time
      measurement and the real config is never touched.
      *Cost:* the blind half is measured against a **reconstruction** of the old config, not the old
      config — a fidelity gap that must be stated. (Note: plain `overrideConfig` cannot do this; flat
      config merges additively, so the widened block would still fire. Only a replacement config file works.)
- [ ] **Cite `7c47b35b7`'s diff as historical evidence** and run only the new (catching) half.
      *Cost:* citing rather than measuring. The milestone permits citation (ASSERT-07 cited 8 of 13 OLD
      halves) — but only where a *recorded* OLD-half measurement exists. None does here; Phase 115 never
      ran the injection.

**EDIT:**

---

### B3 — Plan shape and wave structure

- [x] **★ RECOMMENDED — 3 plans, fully serial**, mirroring 142.1: **(1)** open the ledger with every row
      written **before** the first injection, then measure every OLD half on the untouched tree
      (satisfies SC-2's "untouched tree first" and the full pre-existing-usage inventory); **(2)** land
      the config change, the extended guard test and the record corrections together; **(3)** gates +
      reconciliation. Wave 2 is the only one that writes product bytes.
      *Cost:* three commits' ceremony for a small change — but SC-2 makes the measure-before-change
      ordering a criterion, not a preference.
- [ ] **1 plan.** Everything in one pass.
      *Cost:* the "recorded before any is changed" ordering becomes an honour-system claim inside a
      single commit rather than a structural fact of the plan sequence.
- [ ] **2 plans**: measure-then-change, with gates folded into plan 2.
      *Cost:* gates and the record reconciliation land in the same commit as the change they are meant
      to judge.

**EDIT:**

---

## § C — Reach gaps: which to close

### C1 — Does the standing guard test grow from one probe path to the four named sites?

`eslint-store-guard.test.ts` currently proves the guard at exactly one path,
`src/lib/_guards/__store_guard_probe__.ts`. SC-1 names four directories. A guard proven at one path is
not proven at four, and the glob could regress to a narrower one without that test noticing.

- [x] **★ RECOMMENDED — Table-driven over 4 dirs × {`.ts`, `.svelte`}, plus the existing negative
      control**, in the same file. Eight positive cases, one negative. Keeps the file's stated
      correctness invariants (virtual `filePath` under `src/**`, the `v10_config_lookup_from_file` flag,
      filtering on `ruleId === 'no-restricted-imports'`) and side-steps the flat-config REPLACE trap the
      file's header already documents.
      *Cost:* the spec grows from 2 cases to 9; runtime is negligible (ESLint API, no file writes).
- [ ] **Four dirs, `.ts` only.** Half the cases.
      *Cost:* `.svelte` script blocks go through a different parser path (`svelte-eslint-parser`) — the
      one place where the rule could plausibly fail to apply. Dropping it drops the interesting half.
- [ ] **Leave the test at one probe path**; rely on the ledger's one-time four-site measurement.
      *Cost:* nothing standing prevents a future narrowing of the glob from going unnoticed — the exact
      failure mode this phase exists to close.

**EDIT:**

---

### C2 ⚠ DECIDE — The `.js` / `.mjs` glob gap (A.2 row 10, measured silent)

`files: ['src/**/*.{ts,svelte}']` does not match `.js`, `.mjs` or `.cjs`. A hand-written
`src/lib/utils/foo.js` importing `svelte/store` lints clean today. Measured fallout of closing it: **zero**
— the only `.js` under `src/` is generated paraglide output, gitignored and already lint-excluded at
`packages/shared-config/eslint.config.mjs:35`.

- [x] **★ RECOMMENDED — Widen to `src/**/*.{ts,js,mjs,cjs,svelte}`** and re-measure `yarn lint:check` to
      confirm zero new violations (measured, not assumed). This is the one place where the phase's
      stated goal — *"the guard that claims the frontend is store-free actually covers the frontend"* —
      is literally, currently false, and the fix is one glob edit.
      *Cost:* the widened glob also applies the inherited deep-relative-`lib` `patterns` ban to `.js`
      files; measured fallout is zero but must be re-confirmed post-change.
- [ ] **Add `.js` only** (`{ts,js,svelte}`).
      *Cost:* leaves `.mjs`/`.cjs` open for no benefit; the next hole is the same hole.
- [ ] **Leave the glob; record the gap** as a named residue with the rationale that the frontend is a
      TS codebase and a hand-written `.js` under `src/` would not survive review.
      *Cost:* "would not survive review" is precisely the assurance this milestone exists to replace
      with a mechanism.

**EDIT:**

---

### C3 — Dynamic `import('svelte/store')` (A.2 row 11, measured silent)

`no-restricted-imports` inspects static `ImportDeclaration` nodes only. `await import('svelte/store')`
passes the gate.

- [x] **★ RECOMMENDED — Close it** with a `no-restricted-syntax` entry in the same config block —
      selector `ImportExpression[source.value='svelte/store']`, message pointing at the same rune
      guidance. Six lines; makes the "store-free" claim true for both import forms. Add one probe to the
      guard test so the closure is itself proven.
      *Cost:* a second rule now carries part of the ban, so a future reader must find both. Mitigate with
      a comment tying them together at the config site.
- [ ] **Record as named residue**, not closed: a dynamic import of `svelte/store` is not a plausible
      accidental reintroduction — the ban is a drift guard, not a security boundary.
      *Cost:* leaves a documented, trivially-reachable hole in a guard whose whole value is that it
      cannot be reached around.
- [ ] **Close it with a custom ESLint rule** covering static + dynamic + `require()` in one place.
      *Cost:* a bespoke rule to maintain for a ban that two built-in rules already express.

**EDIT:**

---

### C4 — `svelte/motion` (`tweened`, `spring`) — store-shaped, different module (A.2 row 12)

Both return store contracts and both have Svelte-5 class replacements (`Tween`, `Spring`). Neither is
`svelte/store`, and neither ASSERT-08 nor ASSERT-09 mentions them.

- [x] **★ RECOMMENDED — Out of scope.** Record the measurement in the ledger, file a todo for a
      `svelte/motion` ban as its own small phase (it carries its own migration fallout — any live
      `tweened`/`spring` call site must move to `Tween`/`Spring` before the ban can land green).
      *Cost:* a known store-shaped seam stays unguarded until that todo is picked up.
- [ ] **Fold it in**: ban `svelte/motion` in this phase and migrate whatever it surfaces.
      *Cost:* unmeasured fallout inside a phase whose fallout is otherwise exactly zero — it turns a
      clean evidence phase into a migration phase, and the scope guardrail says a new capability belongs
      in its own phase.
- [ ] **Ignore entirely** — no measurement, no todo.
      *Cost:* the one thing this milestone consistently refuses: an unrecorded known gap.

**EDIT:**

---

### C5 — Files outside `src/` are not linted at all (A.2 row 13)

`apps/frontend/package.json:10` runs `eslint src/`. `vite.config.ts`, `svelte.config.js`,
`vitest.config.ts`, `prettier.config.mjs` and `eslint.config.mjs` itself are outside every lint gate —
not just this guard's.

- [x] **★ RECOMMENDED — Out of scope; record it.** The phase boundary is `apps/frontend/src/**` in both
      ASSERT-08 and the roadmap goal. Name it in CONTEXT.md as a measured adjacent gap and file a todo
      for the lint-script scope, which is a broader question than this guard.
      *Cost:* the recorded gap is real and stays open.
- [ ] **Widen the lint script** to cover the config files in this phase.
      *Cost:* unmeasured lint fallout across five config files, in a phase that is otherwise
      fallout-free — and it is a lint-coverage decision, not a store-guard decision.

**EDIT:**

---

## § D — ASSERT-09: discharging a measured-zero fallout

### D1 — How is "triage every pre-existing usage" discharged when there are none?

`git grep "from 'svelte/store'"` over tracked files returns 2 hits, both in
`eslint-store-guard.test.ts` (line 14, a doc comment; line 42, the fixture string the positive control
lints). Three further files mention the module in prose only: `dataContext.type.ts:6`,
`contexts/utils/SettingsOverlay.svelte.ts:27`, `components/video/component-stores.svelte.ts:10`.

- [x] **★ RECOMMENDED — Record the measured zero with a per-file disposition table** covering all five
      mentions (each classified *prose* / *test fixture*, with `file:line`), the exact grep command, and
      the HEAD it was run at. ASSERT-09 is then satisfied *as written* — every pre-existing usage has a
      disposition; the set happens to be empty of real imports.
      *Cost:* a table of five rows that all say "not an import". That is the point: it is auditable.
- [ ] **Mark ASSERT-09 N/A** — nothing surfaced, nothing to triage.
      *Cost:* "N/A" is unfalsifiable a year from now; a recorded command + HEAD + count is not.
- [ ] Additionally **migrate the three prose mentions** to stop naming the module.
      *Cost:* deletes the historical explanation of *why* the seam was removed — the comments are the
      record, not residue.

**EDIT:**

---

### D2 — SC-4's "verified by grep independently of the lint rule": one-time or standing?

- [x] **★ RECOMMENDED — One-time, recorded.** SC-4 asks for a verification, not a gate. Record the
      command, HEAD and output in the ledger. The standing protection is the lint rule plus C1's
      four-site test.
      *Cost:* nothing re-runs the grep automatically; if the lint rule is ever disabled, only the guard
      test catches it (which is its job).
- [ ] **Standing grep test** — a vitest spec failing on any `svelte/store` occurrence under
      `apps/frontend/src`, with an allowlist for the five prose/fixture sites.
      *Cost:* a second guard needing its own allowlist, which drifts and eventually gets broadened to
      silence a legitimate mention — the exact anti-pattern SC-3 forbids for the exclusion list.

**EDIT:**

---

## § E — Exclusion-list discipline (SC-3)

### E1 — The dead `'**/_spikes-*/**'` ignore (`eslint.config.mjs:40`)

SC-3: *"No site is silenced by broadening the guard's own exclusion list; the exclusion list ends the
phase no larger than it started, or each addition is justified."* Nothing is added by any option here;
the question is whether to remove something dead.

- [x] **★ RECOMMENDED — Leave it; record it as measured-dead.** State in the ledger: exclusion list
      **18 entries before, 18 after, 0 additions**, and note that line 40 currently matches nothing
      (`find apps -type d -name "_spikes*"` → empty). SC-3 satisfied by an unchanged list, with the dead
      entry documented rather than silently carried.
      *Cost:* dead config stays. Low stakes — it excludes nothing.
- [ ] **Delete line 40** (and its two comment lines) so the list ends *smaller* than it started.
      *Cost:* a gratuitous edit to a config the phase otherwise touches at exactly one line, and it
      re-breaks anyone who reintroduces a `_spikes-*` fixture directory expecting the old exemption.
- [ ] **Leave it untouched and unmentioned.**
      *Cost:* SC-3 asks for the list's size to be *stated*; silence does not satisfy it.

**EDIT:**

---

## § F — Record correction

### F1 ⚠ DECIDE — Which records get corrected, and how far does the correction reach?

Four artefacts currently assert something false or stale about this guard. The milestone's own rule on
this — *"three targets that disagree are worse than one that is silent, because each looks
authoritative"* — was written for exactly this situation.

| Target | What it says | Actual |
|---|---|---|
| `ROADMAP.md:264` | "Widen the ESLint guard from contexts/routes to all of `apps/frontend/src/**`" | widened 2026-06-13, `7c47b35b7` |
| `ROADMAP.md` SC-1 (§ Phase 143) | "the same four injections PASS under the pre-change guard scope" | that scope no longer exists; must be reconstructed (**B2**) |
| `ROADMAP.md` SC-2/SC-3 | "widening is run against the untouched tree first"; "triage every pre-existing usage" | no widening to run; fallout is zero |
| `.planning/todos/pending/2026-06-04-…-app-wide.md` | open, "expect this to surface existing usages" | superseded 9 days after filing; surfaced nothing |

- [x] **★ RECOMMENDED — Correct all four, in-phase, with the superseding commit named at each site.**
      Move the todo to `completed/` citing `7c47b35b7`; rewrite the Phase 143 roadmap line and its
      success criteria to the re-scoped shape (**B1**); add evidence clauses to `REQUIREMENTS.md`
      ASSERT-08/09 in the 141/142.1 house style (ledger path, counts, HEAD). Follow Phase 141's
      correction convention: state plainly that the earlier wording was wrong **when written**, and why.
      *Cost:* editing a roadmap's own success criteria mid-phase needs care — the rewritten SC must be
      *harder* to satisfy than the original, not softer, or the correction reads as scope reduction.
- [ ] **Correct `REQUIREMENTS.md` only**; leave the roadmap and the todo.
      *Cost:* two authoritative-looking artefacts keep asserting work that is already done.
- [ ] **Correct everything except the roadmap's success criteria** — leave SC-1..4 verbatim and satisfy
      them as literally as reconstruction allows.
      *Cost:* SC-2 ("widening is run against the untouched tree first") cannot be satisfied literally at
      all; leaving it standing guarantees a verification finding.

**EDIT:**

---

### F2 — Where the evidence lives

- [x] **★ RECOMMENDED — `143-NEGATIVE-CONTROL-LEDGER.md`**, matching `141-ASSERT10-LEDGER.md` /
      `142-NEGATIVE-CONTROL-LEDGER.md` / `142.1-NEGATIVE-CONTROL-LEDGER.md`. Rows written **before** the
      first injection (the 142.1 D-19 rule), each carrying assertion site, command, exit code and the
      HEAD it ran at.
      *Cost:* none — it is the established shape.
- [ ] `143-GATES.md` (the Phase 140 naming).
      *Cost:* a fourth naming convention for the same artefact class in one milestone.

**EDIT:**

---

## § G — Gates

### G1 — Which gates close this phase?

The change surface is: one ESLint config file, one vitest spec, and planning documents. Zero runtime
bytes ship.

- [x] **★ RECOMMENDED — The five static gates + one full E2E run.** `yarn test:unit`, `yarn lint:check`,
      `yarn format:check`, `yarn build`, and `yarn workspace @openvaa/frontend check` (142.1's fifth —
      neither lint nor build typechecks `apps/frontend/src`), plus `yarn test:e2e` **once** under
      CLAUDE.md's cardinal rule. The full suite is the project's trusted signal and does not take long;
      a config-only change is exactly the kind that is assumed inert and occasionally is not.
      *Cost:* one E2E run (~135 tests) for a change that cannot plausibly affect it.
- [ ] **Static gates only**, with a written rationale that no runtime byte changed.
      *Cost:* the cardinal rule admits no "cannot plausibly affect it" exemption, and a skipped E2E run
      is the one thing this milestone's record has been consistently strict about.
- [ ] **Static gates + E2E ×3** (determinism posture).
      *Cost:* two extra runs buying nothing — this phase introduces no source of nondeterminism.

**EDIT:**

---

### G2 — Does the lint-config change need a `db:reset` / fresh dev server before the E2E gate?

Per the standing E2E execution prereqs (one fresh dev server on `:5173`, clean DB before the full-suite gate).

- [x] **★ RECOMMENDED — Yes, follow the standard prereq**: `yarn db:reset` + one fresh dev server, then
      the single suite run. Cheap, and it removes "stale server / dirty DB" from the list of things a
      red run could mean.
      *Cost:* a few minutes of setup.
- [ ] **Reuse whatever is running.**
      *Cost:* a red run becomes ambiguous, and the preflight only proves the server came from this
      checkout — not that the DB is clean.

**EDIT:**

---

## Fill status

| § | Decisions | ⚠ DECIDE | Ticked to overrule | Free-text edits |
|---|---|---|---|---|
| A — Factual baseline | (evidence, not a decision) | — | — | — |
| B — Phase shape | 3 (B1, B2, B3) | 2 (B1, B2) | | |
| C — Reach gaps | 5 (C1–C5) | 1 (C2) | | |
| D — ASSERT-09 discharge | 2 (D1, D2) | — | | |
| E — Exclusion list | 1 (E1) | — | | |
| F — Record correction | 2 (F1, F2) | 1 (F1) | | |
| G — Gates | 2 (G1, G2) | — | | |
| **Total** | **15** | **4** | | |

**Untouched = all 15 ★ RECOMMENDED options chosen.** That yields: a re-scoped Phase 143 that measures the
blind half against a temporarily narrowed glob, closes the `.js` and dynamic-`import()` reach gaps,
grows the guard test to eight positive cases across the four named directories, discharges ASSERT-09 as
an audited zero, leaves the exclusion list unchanged at 18 entries, corrects all four stale records, and
closes on five static gates plus one clean E2E suite — with `svelte/motion` and the outside-`src/` lint
scope filed as todos rather than absorbed.
