# Phase 65: Svelte 5 Audit Sweeps - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 65-svelte-5-audit-sweeps
**Areas discussed:** Audit deliverable format, Context-destructure rule, Smoke scope, {#key} threshold

---

## Audit Deliverable Format

| Option | Description | Selected |
|--------|-------------|----------|
| Inline only | Each retained `bind:*` site gets a Svelte comment / `// $bindable annotation`. No separate doc. 93 sites → just inline; single source of truth. | ✓ |
| Inline + AUDIT.md table | Per-site comment AND a 65-AUDIT.md table mapping path:line → classification + reason. Better for reviewers but creates two surfaces to keep in sync. | |
| AUDIT.md only | Centralized table; no inline comments. Cleaner code but readers won't see context at the site. | |

**User's choice:** Inline only (Recommended)
**Notes:** Single source of truth at the site; 93 entries is too many to fork between code and a doc.

---

## Context-Destructure Rule

| Option | Description | Selected |
|--------|-------------|----------|
| CLAUDE.md guideline | "Use direct `ctx.X` for reactive reads; destructuring fine for one-shot/setup reads." Lower friction; matches Phase 61's actual fix shape. | ✓ |
| Lint rule (banned) | Custom ESLint or svelte-eslint rule banning ObjectPattern over `getContext()` / `use*Context()` returns. Strict but might over-fire on legitimate one-shot reads. | |
| Both: lint + escape comment | Banned by lint with `// eslint-disable-next-line — one-shot read` allowed for legit cases. Most robust, most boilerplate. | |

**User's choice:** CLAUDE.md guideline (Recommended)
**Notes:** Lint deferred. Phase 61 fix shape is the canonical pattern; broken-but-working sites either rewritten or annotated.

---

## Smoke Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Voter 9-step + candidate light | 9-step voter smoke + 3-4 step candidate-app sanity (login, view question, save). Matches ROADMAP SC-1 phrasing. | ✓ |
| Voter 9-step only | Skip candidate; bind:* changes mostly hit candidate-app components though. Higher regression risk. | |
| Full voter + full candidate | Both apps fully exercised. Highest confidence; most user time. | |

**User's choice:** Voter 9-step + candidate light (Recommended)
**Notes:** Candidate-app smoke non-optional given bind:* distribution skews toward candidate components.

---

## {#key} Sweep Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Audit existing 2 only | Both sites already deliberate — verify justification + add inline comment. | |
| Existing + missing-key sweep | Also audit `{#each}` blocks for missing key expressions (positional-reuse hazards). Bigger scope; potentially surfaces real bugs but inflates phase. | |
| Existing + each-block conversion check | Look for `{#key item}` *inside* `{#each items as item}` — replaceable with keyed each. Already removed from EntityList in Phase 64; sweep checks for residue. | ✓ |

**User's choice:** Existing + each-block conversion check
**Notes:** Bounded scope — verify the 2 known sites, plus catch any leftover `{#key}`-inside-`{#each}` patterns that should be keyed-each instead.

---

## Claude's Discretion

- Specific wording of the CLAUDE.md context-destructure guideline
- Inline comment phrasing for the 93 `bind:*` sites
- Whether to fold candidate-app smoke into Plan 65-03 or split it out
- Specific bind:* migration targets for deep two-way bindings

## Deferred Ideas

- ESLint rule for context-destructure ban (deferred from D-02 alternative)
- Missing-`{#key}` bug sweep (out of v2.7 scope per D-04)
- `bind:*` migration to `$bindable()`-flow patterns (deferred unless audit surfaces specific hazard)
- Wider Svelte 5 idiom audit (`$effect.pre`, `$state.raw`, `$state.snapshot`) — explicit OoS in REQUIREMENTS.md
- Centralized `bind:*` migration playbook for future Svelte upgrades
