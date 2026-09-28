# Phase 72: Package Hygiene Trio - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 72-package-hygiene-trio
**Areas discussed:** Plan split, supabase lint rename strategy, anchor doc location

---

## Plan split for the trio (SHARED-01 / SHARED-02 / LINT-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Three parallel plans, one per requirement | Plan-72-01: app-shared paradigm (SHARED-01). Plan-72-02: mergeSettings shim retire (SHARED-02). Plan-72-03: supabase lint rename (LINT-01). Independent diffs. | ✓ |
| Two plans: package paradigm pair + lint rename | Plan-72-01: app-shared + mergeSettings (related). Plan-72-02: supabase lint rename. | |
| One combined hygiene plan | All three in one plan. Lowest overhead; biggest single diff. | |

**User's choice:** Three parallel plans, one per requirement.
**Notes:** Same model as v2.7 P68 dev-tooling trio.

## Supabase lint-script rename strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Hard rename; remove yarn supabase:lint | Old name stops working. Update all callers (root package.json, turbo.json, CLAUDE.md, README, CI). Cleanest; one source of truth. | ✓ |
| Hard rename + deprecated alias logging warning | yarn supabase:lint stays but prints 'deprecated' before delegating. Removed in v2.9. | |
| Hard rename; alias kept silently for one milestone | yarn supabase:lint silently delegates to lint:sql for v2.8; remove in v2.9. | |

**User's choice:** Hard rename — no alias.
**Notes:** Anyone with muscle memory hits an error and fixes their command. Cleanest result.

## Anchor doc location for canonical paradigm

| Option | Description | Selected |
|--------|-------------|----------|
| CLAUDE.md — new section under Architecture | Add a 'Package paradigm' subsection in CLAUDE.md. Discoverable via the file Claude already reads at session start. | |
| packages/README.md (new file) | Create top-level packages/README.md. CLAUDE.md adds a 1-line pointer. | |
| Both: short paragraph in CLAUDE.md + detail in packages/README.md | CLAUDE.md gets a 1-paragraph anchor pointing to a longer packages/README.md. Discoverable + extensible. | ✓ (with bloat-judgment escape) |

**User's choice:** Both — UNLESS CLAUDE.md is getting bloated.
**Notes:** "New pkg creation is a rare task so it may not be useful in all task contexts." Planner has discretion to put it ONLY in packages/README.md if CLAUDE.md is at risk of bloating.

---

## Claude's Discretion

- Final SQL-script name (`lint:sql` vs `lint:db` vs `db:lint`) — per monorepo convention.
- Whether the dual-build justification lives in README or `package.json` description.
- Whether the canonical paradigm doc at `packages/README.md` includes a code-snippet template or stays prose-only.
- Whether to anchor the "no new re-export shims" rule via lint-config (probably not), via CLAUDE.md note (maybe), or via convention only (default).
- CLAUDE.md vs packages/README.md only decision (per the bloat-judgment escape hatch).

## Deferred Ideas

- **The 4 pre-existing SQL `warning extra` entries** from Supabase migrations — out of Phase 72 scope.
- **Lint enforcement against future re-export shims** — convention via CLAUDE.md note or PR-review attention.
- **Restructuring `@openvaa/app-shared`'s API surface** — out of scope.
- **Dropping the dual ESM+CJS build** — explicitly preserved.
- **npm publishing / version bumps** — paradigm changes are internal-only.
