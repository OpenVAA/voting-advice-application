# Phase 80: A11Y Axe Cite-and-Fix - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 80-A11Y Axe Cite-and-Fix
**Areas discussed:** `list` + `aria-required-parent` root-cause fix, `button-name` fix on floating-icon Drawer close, Regression assertion strategy + post-fix baseline

User skipped "Plan grouping / sequence" as a gray area — defaulted to 1 bundled plan per cite-and-fix-todo recommendation (Claude's Discretion, captured in CONTEXT D-08).

---

## `list` + `aria-required-parent` root-cause fix

### Q1: Screen-reader convention clarification (mid-flow)

User initially asked for clarification before answering the structural-fix question: "What's the most screen-reader friendly convention for navigation element structures? We can drop ul/li completely if it adds no benefit."

Claude researched + responded with:
- `<nav>` landmark = always announced (regardless of inner markup)
- `<ul>` / `<li>` OR `role="list"` / `role="listitem"` = SR announces count + position ("List with 6 items. 1 of 6, Home") — meaningfully useful for nav menus
- Safari `list-style: none` quirk (Scott O'Hara, 2019) means even native `<ul>` needs explicit `role="list"` to survive — ARIA bridge is defensive, not redundant
- WAI-ARIA APG + GOV.UK + GitHub + MDN all use `<nav><ul><li><a>` for primary nav — list semantics ARE the standard

**Verdict shared with user:** dropping list semantics would reduce SR-friendliness; the choice is implementation shape (ARIA bridge vs native HTML), not whether to have list semantics.

### Q2: Structural fix shape (re-asked after clarification)

| Option | Description | Selected |
|--------|-------------|----------|
| Targeted ARIA: keep `role="list"`, hoist h4, mark NavItem standalone-aware | NavGroup: hoist h4 outside role="list" + aria-labelledby. NavItem: `standalone` prop to drop listitem role when outside a NavGroup. Smallest blast radius; preserves NavGroup flexible-children contract. | ✓ |
| Native HTML: switch to `<ul>` / `<li>` + keep h4 outside | Replace section/div with `<ul>` / `<li>` (Safari-defensive role="list" on ul). Same SR experience; larger refactor; constrains NavGroup child set. | |
| Auto-detect via Svelte context (no `standalone` prop) | NavGroup setContext, NavItem getContext to decide. Zero consumer-side changes; structural detection. | |

**User's choice:** Targeted ARIA with explicit `standalone` prop variant.
**Notes:** User selected the recommended option with the preview showing h4 hoist + aria-labelledby + explicit standalone prop pattern. (Subsequent Q3 pivoted to auto-detect — see below.)

### Q3: Consumer-side sweep scope

| Option | Description | Selected |
|--------|-------------|----------|
| Sweep all 3 nav consumers | Add `standalone` to VoterNav:57 + CandidateNav:40 + AdminNav:37. Closes same root cause in candidate / admin routes. | |
| Voter-only (axe-baselined surface) | Add `standalone` only to VoterNav:57. Strictly inside Phase 80 SC scope. Leaves identical bug in candidate / admin. | |
| Defensive: NavItem auto-detects + no consumer changes | NavGroup pushes context, NavItem reads it. Zero consumer-site changes; auto-propagates to voter / candidate / admin. | ✓ |

**User's choice:** Defensive: NavItem auto-detects + no consumer changes needed.
**Notes:** User pivoted from explicit `standalone` prop (Q2 preview) to auto-detect via Svelte context after seeing CandidateNav.svelte:40 + AdminNav.svelte:37 had the identical orphan close-button pattern. Captured in CONTEXT D-03 + D-04.

---

## `button-name` fix on floating-icon Drawer close

### Q4: Fix layer + i18n shape

| Option | Description | Selected |
|--------|-------------|----------|
| Generalize Button + i18n at call site | (A) Button.svelte:183 — extend aria-label to include `'floating-icon'` variant. (B) Drawer.svelte:99 — change `text="close"` to `text={t('common.closeDialog')}`. Reuses existing i18n key in 4 locales. | ✓ |
| Call-site only (Drawer-local fix) | Add explicit `aria-label={t('common.closeDialog')}` at Drawer call site only. Smallest blast radius; leaves Button variant a future footgun. | |
| Button-only fix; preserve `text="close"` | Generalize Button.svelte:183 only. Ships hidden i18n regression — fi/sv/da users hear "close" in English. | |

**User's choice:** Generalize Button + i18n at call site (Recommended).
**Notes:** Two-part fix at the right layer for each problem. The `common.closeDialog` i18n key already exists in all 4 locales (verified `apps/frontend/messages/en/common.json:20`). Captured in CONTEXT D-05.

---

## Regression assertion strategy + post-fix baseline

### Q5: Assertion shape in `a11y-smoke.spec.ts`

| Option | Description | Selected |
|--------|-------------|----------|
| Both: global zero + per-rule trio | Per route: 3 per-rule filter assertions (aria-required-parent, list, button-name) + global `expect(violations).toHaveLength(0)`. Satisfies both SC #4 clauses literally. | ✓ |
| Per-rule only | 3 per-rule filter assertions only. Narrower; matches SC #4 "per-rule" clause but lets new rule-IDs slip through. | |
| Global zero only | Single `expect(violations).toHaveLength(0)`. Strictest; doesn't document which Phase 76 findings drove the gate. | |

**User's choice:** Both: global zero + per-rule trio (Recommended).
**Notes:** Smoke is `PLAYWRIGHT_A11Y=1` opt-in, so brittleness on global-zero is acceptable; per-rule trio documents intent permanently. Captured in CONTEXT D-06.

### Q6: Post-fix baseline artifact location

| Option | Description | Selected |
|--------|-------------|----------|
| New `80-A11Y-BASELINE.md` + back-link | Phase-local artifact + cross-link backward to `76-A11Y-BASELINE.md` (preserves Phase 76 baseline as historical evidence). Matches Phase 73 / Phase 76 phase-local-artifact precedent. | ✓ |
| In-place update to `76-A11Y-BASELINE.md` | Mutate Phase 76 artifact. Single source of truth; rewrites history; conflates two phases' verification states. | |
| Promote to project-level `.planning/A11Y-BASELINE.md` | Top-level project artifact. Premature — only 1 a11y baseline shipped so far. | |

**User's choice:** New `80-A11Y-BASELINE.md` + back-link (Recommended).
**Notes:** Captured in CONTEXT D-07.

---

## Claude's Discretion

- **Plan grouping / sequence** — user did not select this gray area; defaulted to 1 bundled plan per cite-and-fix-todo "1-2 plans" estimate. Planner may split into 2 if PLAN.md authoring surfaces scope concerns. Captured in CONTEXT D-08.
- **Svelte 5 `titleId` generation idiom for NavGroup** — `$props.id()` vs `crypto.randomUUID()` vs module-scoped counter; planner picks at PLAN.md time per current Svelte 5 docs.
- **Test-name prefix on regression assertions** — rename `A11Y-03` → `A11Y-04` in `a11y-smoke.spec.ts` to reflect current requirement ID, OR preserve historical Phase 76 prefix. Default: rename.
- **Symbol-keyed module-scoped context module path** — `apps/frontend/src/lib/dynamic-components/navigation/navGroupContext.ts` is the suggested location; planner confirms at PLAN.md time.
- **`// reason:` annotation on Button.svelte:183 aria-label extension** — default YES (1-line block anchoring "include floating-icon — axe button-name").
- **`<section>` element preservation comment in NavGroup.svelte** — default YES (1-line anchoring "preserved for `:before` line-separator CSS; role=list migrated to inner div for axe `list` rule compliance").

## Deferred Ideas

Captured in CONTEXT.md `<deferred>` section. Summary:
- Multi-locale axe coverage (en only for Phase 80; 4-locale extension out of v2.10 scope)
- CI gating promotion (smoke remains `PLAYWRIGHT_A11Y=1` opt-in after Phase 80)
- Native `<ul>` / `<li>` refactor (REJECTED — out of scope; future candidate if ARIA bridge accumulates findings)
- Axe smoke extension to candidate / admin routes (out of v2.10 scope)
- Heading-level audit across nav (latent post-fix risk; global-zero gate catches if surfaces)
- Visual regression sanity check after Drawer text-prop change (planner courtesy; no visible change expected)
- `getByRole('listitem')` lint guard (trivial follow-up if it surfaces)
