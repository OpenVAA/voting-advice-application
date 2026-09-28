# Phase 68 Plan 02 — Deferred Tech Debt

**Created:** 2026-05-08
**Status:** Open — track for follow-up phase
**Origin:** Plan 68-02 (ESLint cleanup) Option C decision — accept and defer

## Context

Plan 68-02 added two new ESLint rules (`unused-imports/no-unused-imports` + `no-restricted-imports`
preferring `$lib` over deep relatives) and the `apps/frontend/src/lib/paraglide/**` ignore to
`packages/shared-config/eslint.config.mjs`. The `yarn lint:fix` auto-fix sweep applied all
auto-fixable changes monorepo-wide and 4 manual `func-style` fixes were applied.

After landing the new rules, the next `yarn lint:check` surfaced **95 pre-existing ESLint errors**
in `apps/frontend/` plus pre-existing SQL `warning extra` entries from Supabase. None of these
were introduced by Plan 68-02 — they pre-date Phase 68 (likely accumulated through Phases 60–67).

Per the user's Option C decision (2026-05-08), Plan 68-02 closes with the new rules + auto-fix
sweep landed; the deeper cleanup is deferred to a follow-up phase.

---

## Deferred Tech Debt — Phase 68

### 1. 95 pre-existing ESLint errors in `apps/frontend/`

Captured at HEAD `441b0ab54` (post-Plan-68-02 commit). Per-rule breakdown from
`yarn eslint --no-warn-ignored 'src/**/*.{ts,svelte}'`:

| Count | Rule                                          | Notes |
| ----: | --------------------------------------------- | ----- |
|    67 | `@typescript-eslint/no-explicit-any`          | Concentrated in Supabase adapter + auth code; many genuinely unknown types from external SDKs (Supabase client types, OIDC SDK callbacks). Careful per-call audit needed; some will turn into `unknown` + narrow, others into proper external-type imports |
|    13 | `@typescript-eslint/naming-convention`        | Mixed snake_case / PascalCase / camelCase mismatches (likely DB-row passthrough — needs naming-convention rule tuning OR per-line `eslint-disable` justifications) |
|    11 | `func-style`                                  | Arrow functions assigned to top-level `const`s in route handlers + a few utilities; convert to function declarations |
|     3 | `@typescript-eslint/consistent-type-imports`  | Type-only imports not using `import type`; mechanical fix via auto-fix already applied where possible — these 3 likely have edge cases (e.g., type used both as type AND value) |
|     1 | `@typescript-eslint/no-unused-expressions`    | Single occurrence; likely a mis-typed assertion or stray expression statement |

**Plus 27 `unused-imports/no-unused-vars` warnings** (severity=`warn`, do not fail `lint:check`):
unused function parameters that should be prefixed with `_` per the new rule's
`argsIgnorePattern: '^_'` config.

**Estimated effort to clear all 95 errors:** 2–4 hours focused work. The `no-explicit-any` cluster
is the largest single chunk; an audit + replacement pass of the Supabase adapter typing alone
will resolve ~50 of them.

**Recommendation:** File as Phase 69 (or v2.8 milestone item) — **frontend strict-typing
migration**. Pair with a brief decision note on how to handle external SDK callback shapes
(import the SDK's own type vs. define a narrow project-local type vs. use `unknown` + narrow at
call site).

### 2. `@openvaa/supabase` lint script bug (SQL linter conflated with ESLint pipeline)

**Symptom:** `yarn workspace @openvaa/supabase lint` runs `supabase db lint --schema public --fail-on warning`
(SQL/PL/pgSQL linter) instead of (or in addition to) ESLint on the workspace's TypeScript files.
This conflates SQL linting with the JS lint pipeline.

**Impact on Plan 68-02:** The `yarn lint:check` task at the monorepo root delegates to
`yarn workspace @openvaa/supabase lint` via Turborepo, which then runs `supabase db lint` and
fails on pre-existing SQL `warning extra` entries (see deferred item #3). This causes
`yarn lint:check` to fail even when ESLint itself reports zero errors.

**Recommendation:** Separate cleanup phase to either:
- Rename the supabase workspace's `lint` script to `lint:sql` (preserve existing semantics) and
  add a real `lint` script that runs ESLint on the workspace's own TypeScript files
- Or remove the supabase workspace from the Turborepo `lint` task entirely (its TypeScript files
  are already covered by the workspace-glob in the root config)

The rename is the cleaner option (preserves the SQL lint as a deliberately-callable target).

### 3. Pre-existing SQL `warning extra` entries from Supabase migrations

The `apps/supabase/supabase/migrations/` schema has 4 known SQL warnings reported by
`supabase db lint --schema public --fail-on warning`:

1. `public.is_localized_string` — `warning extra: never read variable "p_key"`
2. `public._bulk_upsert_record` — `warning: unused variable "rel_key"`
3. `public.resolve_email_variables` — `warning extra: unused parameter "p_template_body"`
4. `public.resolve_email_variables` — `warning extra: unused parameter "p_template_subject"`

**Pre-existing:** Through Phase 67 close (verified — no Plan 68-02 code changes touch SQL).

**Why not fixed in Plan 68-02:** Out of scope (SQL linting is OoS per `68-CONTEXT.md` "Out of
scope" §3 — *SQL linting/formatting tooling (separate todo; explicit OoS per REQUIREMENTS.md)*).

**Recommendation:** Either fix the SQL functions to use the parameters (likely some signatures
must remain stable for caller compatibility, in which case prefix with `_` if the SQL linter
respects that convention) or downgrade `--fail-on warning` to `--fail-on error` in the supabase
workspace's lint script. The latter is the smaller change and removes the failure without
hiding the warnings — they still print, but don't block CI.

---

## Plan 68-02 Static Gates — Status

- `yarn build`: PASS (exit 0; 14/14 tasks; 13 cached)
- `yarn test:unit`: PASS (exit 0; 19/19 tasks; 14 cached)
- `yarn lint:check`: **DEFERRED** (95 pre-existing frontend errors + 4 SQL warnings; both pre-date
  Phase 68; user-approved Option C deferral)

## v2.6 Parity Gate — Status

- **DEFERRED to verifier (`gsd-verifier`).** The parity gate requires `yarn dev` (long-running
  background) + Playwright E2E + `node .planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs`,
  none of which the executor can launch interactively per `<execution_context>` constraints. The
  verifier (which runs after all 3 plans land) will execute the full v2.6 parity gate at HEAD
  `2c7ad2dea` per ROADMAP SC-4.
