# Phase 94: Final E2E suite polish — de-planning + reformat + README triage - Context

**Gathered:** 2026-06-03
**Status:** Ready for planning
**Source:** Operator decisions resolving ROADMAP scope contradictions surfaced by 94-RESEARCH.md (Open Q#1–4)

<domain>
## Phase Boundary

Mechanical, parallelizable cleanup of the E2E test suite and dev-seed templates. **No architecture changes.** After this phase:
- Every `test()` / `describe()` title is a plain-language description of the behaviour under test — no `Phase`/`Plan`/`D-NN`/`FLAG-`/`TIR`/`SCOPE` references, no ticket/plan IDs.
- Comments explain current intent/rationale only — all planning-archaeology comments (phase refs, plan IDs, decision/flag tags, change-history narration) are removed; functional directive comments (`eslint-disable`, `@ts-expect-error`, `// svelte-warning: accepted`, `// reason:` blocks, ARIA-contract notes) are preserved.
- Manually line-wrapped comment prose is collapsed to single logical lines (IDE soft-wraps).
- The 4 advisory code-review follow-ups from Phase 93 (WR-01..WR-04) are resolved, **as amended by D-03 below**.
- READMEs reflect only current state, zero planning references.

**Scope fence (HARD):** `tests/` and `packages/dev-seed/src/templates` only. The wider `packages/dev-seed/src` tree is OUT of scope (see D-01).

</domain>

<decisions>
## Implementation Decisions

### Scope boundary
- **D-01 — dev-seed scope is `packages/dev-seed/src/templates` ONLY (33 files).** The ROADMAP verification-gate phrasing "grep empty in `packages/dev-seed/src`" is superseded: the residual-token grep gate is scoped to `packages/dev-seed/src/templates`, NOT the whole `src/` tree. The ~42 design-docstring files in `packages/dev-seed/src/` (generators, writer, emitters, CLI) carrying `D-XX`/`Phase NN` rationale are left untouched.

### diff-playwright-reports tool
- **D-02 — DELETE `tests/scripts/diff-playwright-reports.ts` entirely** (`git rm`) and remove every reference/mention to it (package.json scripts, other scripts, docs, README mentions, any import). The parity/determinism diff tool is retired: from now on, any failure in `yarn test:e2e` is itself the regression signal — there is no separate baseline-diff gate. This supersedes the RESEARCH recommendation to "carve it out of the gate". Because the file is deleted, the `tests/`-wide residual grep needs NO carve-out for it.

### WR-02 (REVERSES ROADMAP scope)
- **D-03 — Do NOT remove the `perm-per-app-notifications` playwright projects.** The ROADMAP WR-02 directive ("remove the 3 dead projects + the downstream dependency on its skipped spec") is **reversed by operator decision**. The 3 projects, their skipped spec, setup/teardown, template, and `index.ts` registration all STAY in place (still quarantined / `describe.skip`). No dependency rewiring is performed. Instead, add a clear re-enable TODO so the quarantine is tracked:
  - Add an inline `// TODO: re-enable perm-per-app-notifications projects + spec after the Svelte 5 runes migration` marker at the skipped projects in `tests/playwright.config.ts` (and/or at the skipped spec).
  - This TODO references the runes migration (current intent), NOT a planning phase — it is allowed under the de-planning rules.
  - **Net effect:** WR-02 has zero wiring risk now; the only WR-02 work is adding the tracking TODO. The post-WR-02 `--list` baseline equals the current baseline (84 tests / 72 files) since nothing is removed.

### READMEs
- **D-04 — DELETE both spec journey READMEs** (`git rm`): `tests/tests/specs/voter/voter-journey.README.md` and `tests/tests/specs/candidate/candidate-journey.README.md`. Rationale: in-code comments suffice; these doc-maps are redundant archaeology (voter-journey is the single densest archaeology file at 79 tokens). Deleting them is required for the `tests/`-wide residual grep to reach empty.
- **D-05 — `tests/tests/helpers/README.md`: KEEP + REWRITE.** It documents live helper *contracts* (`settleNetworkIdle` doesn't swallow timeouts; `iterateSelectOptions` cites the `combobox+listbox` ARIA contract; `walkVoterIteration` default `maxSteps=6`), which is genuine maintainer value, not archaeology. Strip every Phase/RESEARCH-doc citation and the "Cite" section; keep the contracts.
- **D-06 — `tests/README.md`: REWRITE** (ROADMAP-mandated) to reflect current suite status — structure, how to run, templates (`e2e/base`, `--likert-only`) — with zero mentions of planning, phases, or past versions of the tests.

### WR-01 / WR-03 / WR-04 (unchanged from ROADMAP)
- **WR-01 — DELETE** `packages/dev-seed/tests/templates/variant-app-settings.test.ts` (always-green skipped husk; base contract covered by `base-app-settings.test.ts`). Note: this file lives under `packages/dev-seed/tests/`, exempt from the D-01 templates-only fence because it is an explicit named WR target.
- **WR-03 — Add an explicit template-name guard** in `tests/tests/setup/shared/setupFromTemplate.ts` so ONLY `e2e/base` maps onto the `test-e2e-base-` teardown fallback; fail loudly (throw) for any other empty-prefix template.
- **WR-04 — Make `buildMinimal`'s ordinal default answer data-driven** instead of hardcoded `value:'3'` — mirror the existing categorical branch (compute the median/middle ordinal option from the question's options rather than literal `'3'`). Likert-5 must still resolve to `'3'`.

### Functional-content carve-outs (de-planning landmines — do NOT touch)
- Functional string literals that contain gate tokens but are NOT archaeology: template names (`e2e/base`), external-id prefixes / seed prefixes (`test-e2e-base-`, `e2e-perm-*`, `test-perm-*`), `INFO_QUESTION_ANSWERS` keys. These must NOT be rewritten by the de-planning sweep.
- Functional directive comments: `eslint-disable`, `@ts-expect-error`, `// svelte-warning: accepted`, `// reason:` blocks (51 functional ones in the suite). Preserve.

### Claude's Discretion
- Wave carving (the researcher proposed ~7 directory-aligned parallel waves + 1 small WR wave). Planner picks the final wave layout.
- Exact title rewrites per spec (use the RESEARCH before→after pattern table as the guide).
- Whether WR-01/03/04 land in one sequential wave or are split.
- Canonical location/format of the WR-02 re-enable TODO (inline comment vs. also a STATE.md follow-up note), as long as it does not reference a planning phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research + scope source
- `.planning/phases/94-final-e2e-suite-polish-de-planning-reformat-readme-triage/94-RESEARCH.md` — full per-directory/per-file residual-token inventory, WR-01..04 exact locations with quoted code, WR-02 dependency graph, title-reformat before→after table, functional carve-out list, baseline counts.
- `.planning/ROADMAP.md` (Phase 94 section) — original scope + verification gates. **Note: WR-02 directive is superseded by D-03; the dev-seed grep boundary is narrowed by D-01.**

### Project guidance
- `CLAUDE.md` — dev-seed template authoring notes, `db:seed --template e2e/base` canonical dataset, `--likert-only` caveats, `// svelte-warning: accepted` format, `// reason:` block convention.

</canonical_refs>

<specifics>
## Specific Ideas

- **Residual-token grep pattern (gate):** `Phase|Plan|D-[0-9]|FLAG-|TIR|baseV1|mega` (note: `baseV1` and `mega` already at zero post-Phase-93). Scoped to: `tests/` (with `diff-playwright-reports.ts` DELETED per D-02, so no carve-out needed) + `packages/dev-seed/src/templates` (per D-01). Documented functional carve-outs: the string literals + directive comments listed above.
- **Baseline (post-WR-02 = current, since D-03 removes nothing):** `npx playwright test --list` → 84 tests / 72 files. "No dropped specs" gate target = 84/72 (unchanged).
- **No test title is a `--grep` anchor** — reformatting titles is safe (verified in RESEARCH).

</specifics>

<deferred>
## Deferred Ideas

- Re-enabling the `perm-per-app-notifications` projects + spec after the Svelte 5 runes migration (tracked via the D-03 inline TODO).
- Optional future de-planning of the wider `packages/dev-seed/src/` design docstrings (~42 files) — out of scope this phase per D-01.

</deferred>

---

*Phase: 94-final-e2e-suite-polish-de-planning-reformat-readme-triage*
*Context resolved: 2026-06-03 via operator decisions on 94-RESEARCH.md open questions*
