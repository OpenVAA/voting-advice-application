---
created: '2026-09-13T00:00:00.000Z'
title: Six documentation script references name scripts and files that do not exist
area: tooling
files:
  - package.json
  - apps/docs/package.json
  - apps/docs/scripts/generate-component-docs.ts
  - apps/frontend/svelte.config.js
  - .planning/ROADMAP.md
resolves_phase: null
related_phase: 163
---

## Problem

Six references in the documentation build name a script or a source file that does not exist. Each
row below was re-derived at `e8052177c` on 2026-09-13 by comparing the root `scripts` block against
`apps/docs`'s own `scripts` block and against `ls apps/docs/scripts/`.

### Root scripts delegating to workspace scripts that do not exist

| Anchor              | Script                  | Delegates to                              | Real name                                       |
| ------------------- | ----------------------- | ----------------------------------------- | ----------------------------------------------- |
| `package.json:54`   | `docs:generate`         | `@openvaa/docs generate`                  | `generate:docs` (`apps/docs/package.json:21`)   |
| `package.json:55`   | `docs:typedoc`          | `@openvaa/docs generate:typedoc`          | no such script — typedoc generation is absent   |
| `package.json:56`   | `docs:typedoc-frontend` | `@openvaa/docs generate:typedoc-frontend` | no such script — typedoc generation is absent   |
| `package.json:57`   | `docs:components`       | `@openvaa/docs generate:components`       | `generate:component-docs`                       |
| `package.json:58`   | `docs:routes`           | `@openvaa/docs generate:routes`           | `generate:route-map` (`apps/docs/package.json:24`) |

### A workspace script naming a generator source file that does not exist

`apps/docs/package.json:22` is `"generate:component-docs": "tsx scripts/extract-component-docs.ts"`.
There is no `extract-component-docs.ts` in `apps/docs/scripts/`; the real generator is
`apps/docs/scripts/generate-component-docs.ts`. The script is therefore broken even when invoked by
its correct workspace name.

### The one entry point that does work

`yarn workspace @openvaa/docs generate:docs` (`apps/docs/package.json:21`) runs
`apps/docs/scripts/generate-all-docs-and-validate.ts`, whose five sub-scripts all exist:
`generate-component-docs.ts`, `generate-route-map.ts`, `move-generated.ts`,
`generate-navigation-config.ts`, `validate-links.ts`. Note that it reaches the component generator
by **file path**, not through the broken `generate:component-docs` script name — which is why the
documentation pipeline works at all and why nobody noticed these five root scripts are dead.

Two of the five root rows (`docs:typedoc`, `docs:typedoc-frontend`) have no live counterpart at
all, so fixing them means either writing typedoc generation or deleting the scripts. The other three
are renames.

## Riders

Three items ride along because they share an owner and a diagnosis: a declaration naming something
that does not exist.

### Rider 1 — `glob` is declared at the repo root, not in the workspace that imports it

`glob` is declared at `package.json:80` (`"glob": "^11.0.0"`) and is **not** declared in
`apps/docs/package.json`. It is imported at three sites inside the documentation workspace:
`apps/docs/scripts/generate-component-docs.ts:6`, `apps/docs/scripts/generate-route-map.ts:6`, and
`apps/docs/scripts/utils/routes.ts:5`. It resolves today only through Yarn's hoisting. Any change
that stops hoisting it — a `nmHoistingLimits` setting, a workspace-local dependency conflict, a move
to PnP strict mode — breaks the one documentation entry point that currently works, with an error
naming `glob` rather than the missing declaration.

### Rider 2 — the false SQL-linter premise has a second home in the roadmap

`.planning/ROADMAP.md:1547` (Phase 163 criterion 1) reads *"A deliberate **sqlfluff** violation
pushed to a migration turns the GitHub Actions build red…"*. There is no sqlfluff anywhere in this
repository; `db:lint:sql` is `supabase db lint` (plpgsql_check) plus two Splinter-derived advisors
in `apps/supabase/scripts/lint-schema.mjs`, and the linter reads the applied database rather than a
migration file. The `CLAUDE.md` half of this same false premise was corrected — by Phase 163 plan 09
for the `db:lint:sql` line, and `grep -c 'sqlfluff' CLAUDE.md` now returns 0 — but the roadmap half
was never edited, because every plan that met it is prohibited from editing `.planning/ROADMAP.md`.
Phase 160 inherits that prohibition (its own `must_haves.prohibitions`, on the grounds that the
roadmap is another agent's concurrent surface), so it is filed here rather than corrected. A reader
arriving at that criterion should read "sqlfluff" as "the SQL linter".

### Rider 3 — a SvelteKit alias pointing at a directory that does not exist

`apps/frontend/svelte.config.js:13` declares `$voter: path.resolve('./src/lib/voter')`.
`apps/frontend/src/lib/voter` does not exist, and `grep -rn '\$voter' apps/frontend/src` returns 0
importers. The alias is inert today, but it is an assertion the build config makes about the tree
that is not true — and an author who trusts it will create files under a path the rest of the
codebase does not use. Either create the directory or drop the alias line. Found during Phase 160
plan 01, which recorded the fact in `CLAUDE.md` rather than the dead path, and left the config edit
outside its own surface.

## Declined option carried here from Phase 160

Phase 160's Judgement 3 (`.claude/skills/README.md`, § *Judgements*) evaluated four mechanisms for
keeping the `components` skill's component listing in sync with the docs, and **declined "generate
the listing into the skill"**. The mechanism itself is small — `generate-component-docs.ts` already
builds a table of contents and writes it, so a second write target is a few lines. It was declined
because it must first reckon with the six broken references above, and because wiring a generator
into CI belongs to the CI phase rather than to a documentation phase. **It becomes cheap once the
references above are repaired**, and should be reconsidered at that point.

## Owner

`resolves_phase: null`. Operator decision `O4` (`.planning/v2.15-DISCUSSION-POINTS.md:1051`) names
**Phase 153** as the owner of build- and tooling-level assertions, which is exactly this class. But
Phase 153 completed (11/11), as did Phase 163, so there is no scheduled slot to name and writing one
in would make this read as work that is coming when it is not. `related_phase: 163` is recorded
because Rider 2's correction lands in that phase's roadmap criterion, and because Phase 163 owns the
CI wiring the declined option would need.
