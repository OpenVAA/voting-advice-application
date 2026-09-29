# Phase 69: Alliance Card Lane A - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 69-alliance-card-lane-a
**Areas discussed:** Alliance card shape (cardContents union, drawer tabs, summary placement)

---

## Selection Round (multi-phase batch)

| Option | Description | Selected |
|--------|-------------|----------|
| P69 Alliance card shape | cardContents.alliance union, drawer tab structure, card visual treatment | ✓ |
| P70 Sweep scope/split + tests | Category D scope, plan split, regression tests | ✓ |
| P71 Typing cleanup approach | Plan split, naming-convention strategy, no-explicit-any policy | ✓ |
| P72 Plan split + lint rename | Trio plan split, supabase lint rename, anchor doc location | ✓ |

**User's choice:** All four areas — discussed in batch per the "discuss multiple independent phases together" preference.

---

## Alliance Card Shape — Initial Question (rejected by user, replaced with clarification)

The initial multi-question batch (cardContents union shape / drawer tab structure / summary placement) was rejected for clarification. The user provided a richer answer covering:

- Type rename: `'candidates'` → `'children'` on cardContents.organization (NOT just adding `'organizations'` to alliance — semantic-uniform rename across both Organization AND Alliance variants).
- Need for matching score calculation for Alliances using a cascading `imputeParentAnswers` pattern (candidates → organizations → alliances).
- New deferred todo: "Rewrite parent answer imputation logic so that entity answers are not overwritten ad hoc."

This clarification reframed the discussion around concrete implementation requirements, not abstract "what to add" choices.

---

## Alliance Card Shape — Refined Questions (after clarification)

### Quick-fix impute strategy for cascading candidates→orgs→alliances

| Option | Description | Selected |
|--------|-------------|----------|
| Write imputed org answers back to entity, then impute alliance | Run imputeParentAnswers for orgs, copy proxy answers to org entities (in-memory only), then run imputeParentAnswers for alliances reading from org entities. Quick — ~1 commit. The "Rewrite parent answer imputation logic..." todo captures the proper refactor. | |
| Extend imputeParentAnswers to accept proxy-children | Generalize the helper so the alliance pass reads from the org proxies (no entity overwrite). More code now, cleaner result — partially does the deferred refactor inline. | ✓ |
| You decide — planner picks based on diff size | Planner reads the impute call-site, sizes both options, picks the smallest correct fix. | |

**User's choice:** Extend imputeParentAnswers to accept proxy-children.
**Notes:** No entity-answer writes. The deferred todo still gets captured for the broader imputation paradigm refactor.

### Alliance detail drawer tab structure

| Option | Description | Selected |
|--------|-------------|----------|
| Single 'Info' tab (no tabs) | Drawer renders flat: name, summary, member-orgs sub-list. No tab strip. | |
| Mirror Organization drawer minus opinions | Whatever the Organization drawer renders today, minus the opinions tab. Planner audits the Org drawer and clones the structure. | ✓ |
| Two tabs: Info + Members | Info tab and Members tab. Closest to candidate-detail tabbed pattern. | |

**User's choice:** Mirror Organization drawer minus opinions.
**Notes:** ALSO change the type `OrganizationDetailsContent` → `ParentEntityDetailsContent` with `'children'` as its allowed value (semantic-uniform with the cardContents rename).

### "X candidates across N parties" summary placement

| Option | Description | Selected |
|--------|-------------|----------|
| Card only (below name, above member-orgs) | Card shows summary; drawer omits because the full member-org list there already conveys the count. | |
| Both card and drawer header | Visible on the card (compact line) and in drawer header (continuity). | ✓ |
| You decide — planner / UI agent picks | Planner decides during UI design. | |

**User's choice:** Both card and drawer header.
**Notes:** ADDITIONAL — when displaying the members in the results list (alliance card subcards), always display ALL members of an alliance, not just the first 3.

---

## Claude's Discretion

- Exact wording / format of the "X candidates across N parties" summary (i18n key naming, plural rules per locale, fallback when X = 0 or N = 1).
- Exact Alliance drawer tab label text and ordering.
- Whether to extend `EntityDetails.svelte`'s tab-array typing inline or factor a helper.
- Exact name of the new optional `imputeParentAnswers` param (`childProxies` vs `childProxyMap` vs `proxyChildren`).
- Plan count (1 / 2 / 3 plans depending on diff cohesion).

## Deferred Ideas

- **NEW TODO:** "Rewrite parent answer imputation logic so that entity answers are not overwritten ad hoc" — capture at phase verification time. Broader refactor of the imputation paradigm beyond the proxy-children extension.
- Lane B (drop alliance from sections) and Lane C (conditional render guard) — explicitly rejected per REQUIREMENTS Out-of-Scope.
- New unit tests in `@openvaa/matching` / `@openvaa/filters` for Alliance — per Phase 67 D-03; manual UI smoke is the validation surface.
