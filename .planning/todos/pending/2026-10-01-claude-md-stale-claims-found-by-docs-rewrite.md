---
created: 2026-10-02
title: CLAUDE.md statements the Phase 168 docs writers found contradicted by code (seeding on start, theme colours, the Render env set)
area: documentation
severity: minor
source: Phase 168 (docs-site rewrite), the `## Findings for todos` of 168-03..07, collected by plan 168-08 (D-04 residue)
related_phase: 168
files:
  - CLAUDE.md
---

## Why this exists

Phase 168 rewrote the docs site from the code. Its writers treated `CLAUDE.md` and README prose as claims to check, never as anchors.
Where a `CLAUDE.md` sentence disagreed with the code, the docs page states what the code does and the finding was recorded instead of
repeated. This todo collects those findings. Each item quotes the `CLAUDE.md` text (content anchors, not line numbers) and the code
that contradicts it. Nothing here was changed in Phase 168: its writers did not edit `CLAUDE.md`.

## Items

### 1. "The database is seeded automatically on `supabase start`" (168-03 F6): partly wrong; the start case is UNCONFIRMED

- **CLAUDE.md** (§ Development Environment): `**Seed data**: The database is seeded automatically on \`supabase start\` via \`apps/supabase/supabase/seed.sql\`.`
- **Code:**
  - `apps/supabase/supabase/config.toml` `[db.seed]`: `# If enabled, seeds the database after migrations during a db reset.`
  - `apps/supabase/supabase/seed.sql` header: `Runs after all migrations on first \`supabase start\` and on every \`supabase db reset\``.
- **Reading.** `seed.sql` reliably runs on `yarn db:reset`, which is the command CLAUDE.md's own command list (`yarn db:reset`, "migrations
  + seed.sql") and the docs Seed data page give. "Seeded automatically on `supabase start`" is right only for the **first** start of a
  fresh database, and only if the file header is right. A plain restart of an existing database does not reseed. That last point was not
  run, so it is UNCONFIRMED.
- **Suggested wording.** "`seed.sql` runs after the migrations on `yarn db:reset` (and on the first `supabase start` of a fresh
  database)."

### 2. "Theme colors defined in `packages/app-shared/src/settings/staticSettings.ts`" (168-05 F2): wrong for the rendered theme

- **CLAUDE.md** (§ Frontend › Styling): `Theme colors defined in \`packages/app-shared/src/settings/staticSettings.ts\`.` The same idea
  appears under § Key Architectural Patterns (settings): `StaticSettings` … "(colors, …) Edit these to customize your VAA instance".
- **Code:** the DaisyUI themes are hard-coded in `apps/frontend/src/app.css` (`--color-primary: #2546a8;` for light, `--color-primary: #6887e3;`
  for dark, under `[data-theme='light']` / `[data-theme='dark']`). `StaticSettings.colors` carries the same values but feeds only the
  `theme-color` meta tags (`apps/frontend/src/routes/+layout.svelte`: `content={staticSettings.colors.light['base-300']}`) and the
  contrast background in `apps/frontend/src/lib/utils/color/ensureColors.ts` (`staticSettings.colors?.light?.['base-300']`).
- **Reading.** Editing `staticSettings.ts` alone does **not** change the app's theme. The docs Styling page documents both places.
  Whether one should be generated from the other is an open design question, UNCONFIRMED as intended. That makes it a code-todo
  candidate, separate from the wording fix.

### 3. The Render reference deployment's environment set omits `PUBLIC_PROJECT_ID` (168-04 F1): CLAUDE.md is incomplete, and so is the template

- **CLAUDE.md** (§ Deployment): `` `render.example.yaml` is the reference deployment: the frontend service with its `PUBLIC_SUPABASE_URL`
  and `PUBLIC_SUPABASE_ANON_KEY` environment variables, and the domain.`` CLAUDE.md's own § Development Environment says `PUBLIC_PROJECT_ID`
  has "deliberately **no fallback**".
- **Code:** `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` throws `PUBLIC_PROJECT_ID is required but not set.`;
  `git grep -n PUBLIC_PROJECT_ID -- render.example.yaml docker-compose.dev.yml` exits 1.
- **Reading.** A service built from the reference template as written would fail on its first Supabase read. That was not run, so it is
  UNCONFIRMED. The docs Deployment page tells operators to add the variable. Fixing the template itself is tracked in
  `2026-10-02-deployment-config-gaps-found-by-docs-rewrite.md`. Once the template is fixed, the CLAUDE.md sentence should name the
  variable too.

## Checked and not found (so the list is complete for what Phase 168 looked at)

- **Cache disk / cache proxy.** CLAUDE.md at the 168-08 HEAD has no cache-disk or cache-proxy claim:
  `grep -n -i -E 'disk|/var/data' CLAUDE.md` matches nothing about a cache. The Phase 167 removal is reflected.
- **app-shared module format.** CLAUDE.md now says `**ESM-only**` for `@openvaa/app-shared`, which matches `tsup.config.ts`. The older
  pending todo `2026-08-26-146-claude-md-app-shared-esm-only.md` therefore looks already done, and can be closed after a check.
- **The local adapter.** CLAUDE.md's "A local adapter for static data does still exist on the **server** side … selected at runtime
  by `staticSettings.dataAdapter.type === 'local'`" matches the code. 168-05 F1 adds that nothing in the app calls those server
  routes; that is tracked under `2026-08-28-reintroduce-the-local-data-adapter.md`, not as a CLAUDE.md error.

## Done when

Items 1 and 2 are reworded in CLAUDE.md to match the code (or the code changes to match them), and item 3 names `PUBLIC_PROJECT_ID`.
