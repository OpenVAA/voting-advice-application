---
phase: 156
slug: supabase-schema-corrections-naming-constraints-grants
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-28
---

# Phase 156 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `156-RESEARCH.md` § Validation Architecture (measured 2026-08-28).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pgTAP (via Supabase CLI) · vitest (unit) · Playwright (E2E) |
| **Config file** | `apps/supabase/supabase/config.toml` (`[db] major_version = 15`) |
| **Quick run command** | `cd apps/supabase && npx supabase test db` |
| **Full suite command** | `yarn db:reset-with-data && cd apps/supabase && npx supabase test db && cd - && yarn db:lint:sql && yarn lint:check && yarn test:unit && yarn test:e2e` |
| **Estimated runtime** | pgTAP in-transaction: fast. `db:reset-with-data`: NOT MEASURED — the executor must time it once and record the figure. E2E: full-suite run required (cardinal rule). |
| **Baseline** | 11 pgTAP files, **264 planned assertions** (the count is the silent-skip detector) |
| **CI** | `.github/workflows/main.yaml:106-138` — `supabase-tests` job, `paths-filter` on `apps/supabase/**` + `packages/supabase-types/**` |

**No pgTAP root alias exists.** `apps/supabase/package.json` `"test:unit": "vitest run"` is Edge-Function
unit tests, not pgTAP. Do not substitute one for the other.

---

## Sampling Rate

- **After every task commit (SQL waves):** `cd apps/supabase && npx supabase test db`
- **After the schema/migrations wave:** `yarn db:reset-with-data` **then** `npx supabase test db`.
  *Order matters* — the reset is what makes the pgTAP run test the **edited** schema rather than the old one.
- **After the types/frontend wave:** `yarn db:types && yarn lint:check && yarn test:unit`
- **Before `/gsd-verify-work` (phase gate):** `yarn db:reset-with-data` → `npx supabase test db`
  (≥ 264 + N green) → `yarn db:lint:sql` → `yarn lint:check` → `yarn test:unit` → **`yarn test:e2e` fully green**
- **Max feedback latency:** pgTAP quick run — seconds. Full gate — minutes.

**E2E prerequisites** (project memory): one fresh dev server on `:5173` (no Playwright `webServer`;
a stale server steals the port) and a clean DB. Disk space is a live risk (ENOSPC voids full-suite runs).

---

## Per-Task Verification Map

*Populated by `/gsd-validate-phase` once PLAN task IDs exist. The criterion → test mapping below is the
authority the per-task rows must satisfy.*

| Criterion | Behaviour | Test type | Automated command | File exists |
|---|---|---|---|---|
| 1 | enum member is `'organization'`; zero `'party'` in either SQL copy | pgTAP + grep | `npx supabase test db`; `grep -rn "'party'" apps/supabase/supabase/{schema,migrations}` → 0 | ✅ / ❌ W0 (enum-members assertion) |
| 1 (gate) | seed runs clean on the renamed schema | integration | `yarn db:reset-with-data` | ✅ |
| 1 (fanout) | generated types carry `organization` | typecheck | `yarn db:types && yarn typecheck` | ✅ |
| 2 | `user_roles.scope_type` is an enum; `has_role` params are enums | pgTAP schema-shape | `col_type_is(...)` + `has_function(...)` | ✅ / ❌ W0 |
| 2 (behaviour) | existing role checks still gate correctly | pgTAP | renamed `05-organization-admin.test.sql` stays green | ✅ |
| 3 | insert with `election_round = 0` is rejected | pgTAP `throws_ok '23514'` | `npx supabase test db` | ✅ / ❌ W0 |
| 4 | `is_image` exists; valid image accepted, each malformed shape rejected | pgTAP | `has_function('public','is_image',ARRAY['jsonb'])` + `lives_ok`/`throws_ok` | ❌ **W0 — no image-shape coverage exists today** |
| 5 | 6 `authenticated` tamper attempts denied (2 tables × 3 columns) | pgTAP `throws_ok '42501'` | `09-column-restrictions.test.sql`, `plan(15)` → `plan(21)` | ✅ file + pattern at `:35-43`; ❌ W0 (6 assertions) |
| 5 (HTTP corroboration) | real PostgREST path unbroken | E2E | `yarn test:e2e` | ✅ |
| 6 | an organization's answers can be upserted by its own role | pgTAP | extend `10-schema-migrations.test.sql` | ✅ / ❌ W0 |
| 6 | renamed/generalised `merge_custom_data` exists at its new shape; old shape gone | pgTAP `has_function` + vitest | `10-schema-migrations.test.sql:489-576` + adminWriter/dataWriter unit tests | ✅ |
| 7 | `candidates.name` absent; `get_candidate_user_data` still returns its declared shape | pgTAP `hasnt_column` + `has_function` | `npx supabase test db` | ✅ / ❌ W0 |
| 7 (fanout) | frontend/dev-seed compile against the narrowed type | typecheck | `yarn db:types && yarn lint:check` | ✅ |
| 8 | five answers on the record; two implemented | **inspection** | `156-DISPOSITIONS.md` has 5 entries + the `merge_custom_data` choice; todos filed; benchmarks moved with SHA quoted; port caveat documented | n/a |
| *(rec.)* | deleting a project cascades to `app_settings` | pgTAP `lives_ok` | `npx supabase test db` | ❌ W0 if adopted |
| *(rec.)* | `schema/` and `migrations/` agree | script | schema↔migration parity check | ❌ W0 if adopted |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `09-column-restrictions.test.sql` — 6 new `throws_ok '42501'` assertions; `plan(15)` → `plan(21)` — criterion 5
- [ ] `10-schema-migrations.test.sql` — `user_role_type` enum-members assertion; `col_type_is` for `user_roles.scope_type`; `has_function` signature update for `has_role`; `hasnt_column` for `candidates.name`; renamed `merge_custom_data` strings (7 sites) — criteria 1, 2, 6, 7
- [ ] `08-triggers.test.sql` (or `10-`) — `throws_ok '23514'` for `election_round = 0` — criterion 3
- [ ] **New `is_image` coverage** — no image-shape assertions exist anywhere today — criterion 4
- [ ] `05-party-admin.test.sql` → `05-organization-admin.test.sql` — file rename + 44 in-file `party` occurrences
- [ ] `00-helpers.test.sql` — `:196-197` claim values, `:312` `user_roles` insert row, the `party_a` fixture key
- [ ] *(if adopted)* schema↔migration parity check wired into `yarn lint:check`
- [ ] Framework install: **none needed** — pgTAP, vitest and Playwright are all present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Criterion 8 dispositions | criterion 8 | Document deliverables, not code behaviour | Read `156-DISPOSITIONS.md`: five numbered entries, each with a disposition; the `merge_custom_data` choice recorded; 4 files under `.planning/todos/pending/`; `apps/supabase/benchmarks/` removed with its archival SHA quoted; `config.toml` port caveat documented |
| `db:reset-with-data` duration | criterion 1 gate | Never measured — the researcher deliberately did not reset a live DB | Executor times one run and records the figure in the phase SUMMARY |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] pgTAP planned-assertion count rises from 264 and every file still runs (silent-skip detector)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
