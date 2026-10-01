---
phase: "168"
slug: "docs-site-rewrite-strapi-to-supabase"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-01"
---

# Phase 168 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Filled at planning (2026-10-01); the
> per-task map below mirrors the `<verify>` blocks of `168-01..08-PLAN.md`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No unit-test suite in `apps/docs`. Validation is gate scripts plus recorded negative controls (REQUIREMENTS.md *Standing acceptance rule*; 167-D08 precedent: temporary working-copy injections, never committed). |
| **Config file** | none — plan 168-01 (Wave 0 equivalent) builds the instruments: `apps/docs/scripts/validate-links.ts --check`, `apps/docs/scripts/check-research-quotes.ts`, `.planning/phases/168-…/scripts/check-claims.mjs`, the docs `lint` script |
| **Quick run command** | `yarn workspace @openvaa/docs validate:links --check` (plus `--scope <route>` per page in plans 03–07) |
| **Full suite command** | the D-22 gate set: `yarn workspace @openvaa/docs generate:docs` + `git diff --exit-code -- apps/docs`, `check:research-quotes --base <base>`, `validate:links --check`, docs `check`, `build`, `lint:full`, root `yarn lint:check`, `yarn format:check`, the D-21 sweeps — each exit status read directly, never through a pipe |
| **Estimated runtime** | quick: ~30 s; full: ~6 min (build, root lint:check and format:check dominate) |

All `<automated>` commands are bash. Under a zsh session run them with `bash -c '…'`; list variables are written `$(echo $F)` and
multi-file commands first assert every file exists, so a non-splitting shell fails loudly instead of checking nothing.

---

## Sampling Rate

- **After every task commit:** `validate:links --check` (scoped to the task's pages in 03–07) and `check-claims.mjs ledger` / `commands` for the plan's claims file.
- **After every plan wave:** wave 1 → `yarn lint:check`; wave 2 → `validate:links --check --only md-link,svelte-href,nav-route,stub,inbound`; wave 3 → each plan's full scoped page gate; wave 4 → `generate:docs` + `check:research-quotes` + unscoped `validate:links --check`.
- **Before `/gsd-verify-work`:** the full D-22 set (168-08 Task 1) must be green.
- **Max feedback latency:** quick checks under 60 s.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 168-01-01 | 01 | 1 | DOCS-07 | T-168-02 | `--check` never writes | gate + NC | upstream precondition; `validate:links --check --only github-path` exits 1 on real dead links; `--only nosuchclass` exits 2; `git diff --exit-code -- apps/docs/src` | ❌ W0 (built here) | ⬜ pending |
| 168-01-02 | 01 | 1 | DOCS-07, DOCS-04 | T-168-01 | stub targets internal, literal, no chains | gate + NC | `validate:links --check --only svelte-href,nav-route,stub` = 0 and `--only anchor` = 1 at base; ≥ 9 `exit=1` NC records; `yarn workspace @openvaa/docs build` | ❌ W0 | ⬜ pending |
| 168-01-03 | 01 | 1 | DOCS-02, DOCS-08 | T-168-03 | research spans frozen | gate + NC | `check:research-quotes --base <base>` = 0; no `--base` = 2; `yarn workspace @openvaa/docs lint`; `yarn lint:check`; ledger row count = derived page count | ❌ W0 | ⬜ pending |
| 168-01-04 | 01 | 1 | DOCS-06 | T-168-SC, T-168-04 | no new advisory; no key in evidence | gate + NC | root `docs:*` targets exist (node one-liner); no typedoc; `yarn docs:components && yarn docs:routes`; `yarn workspace @openvaa/dev-seed test:unit`; `yarn lint:check` | ✅ | ⬜ pending |
| 168-02-01 | 02 | 2 | DOCS-01, DOCS-07 | T-168-06 | stub is a literal internal redirect | tracer (build + browser probe) | `generate:navigation` + prettier + `git diff --exit-code` + no markers; `validate:links --check --only md-link,nav-route,stub && build`; probe file has `REDIRECT OK` and `NO REDIRECT` | ✅ | ⬜ pending |
| 168-02-02 | 02 | 2 | DOCS-01, DOCS-02 | T-168-06 | — | gate | 26 mapped stubs, no extra `+page.ts`, no Strapi nav title; nav consistency; `--only md-link,svelte-href,nav-route,stub` = 0 | ✅ | ⬜ pending |
| 168-02-03 | 02 | 2 | DOCS-07 | T-168-07 | binding checklist link resolves | gate | `--only md-link,svelte-href,nav-route,stub,inbound` = 0; no in-repo link to a stubbed URL; `build && yarn lint:check` | ✅ | ⬜ pending |
| 168-03-01 | 03 | 3 | DOCS-01, DOCS-04 | T-168-08 | — | page gate | `--check --scope /developers-guide/backend/intro`; `check-claims.mjs ledger` / `commands`; prettier (workspace); sweep + version greps; H1 | ✅ | ⬜ pending |
| 168-03-02 | 03 | 3 | DOCS-04, DOCS-03 | T-168-08, T-168-09, T-168-10 | no insecure auth guidance; no key values | page gate | scoped `--check` for auth / edge-functions / email; claims; commands; prettier; grep for Strapi/SES/`auth_user_id`/key-shaped values = exit 1 | ✅ | ⬜ pending |
| 168-03-03 | 03 | 3 | DOCS-01, DOCS-03, DOCS-04 | — | — | page gate | all seven pages: scoped `--check`, claims, commands, prettier; D-21 + D-17 greps = exit 1 | ✅ | ⬜ pending |
| 168-04-01 | 04 | 3 | DOCS-01, DOCS-04 | — | — | page gate | `--scope /developers-guide/quick-start`; claims; commands; prettier; no 1337 / admin/admin / Docker Compose / version | ✅ | ⬜ pending |
| 168-04-02 | 04 | 3 | DOCS-01, DOCS-04 | — | — | page gate | five pages: scoped `--check`, claims, commands, prettier; Strapi / Docker Compose / version (Yarn included) greps = exit 1 | ✅ | ⬜ pending |
| 168-04-03 | 04 | 3 | DOCS-01, DOCS-03, DOCS-04 | T-168-11, T-168-12, T-168-13 | service-role key never on the frontend; no key values | page gate | twelve pages: scoped `--check`, claims, commands, prettier; D-21, D-17, 167-removed-name and key-value greps = exit 1 | ✅ | ⬜ pending |
| 168-05-01 | 05 | 3 | DOCS-01, DOCS-04 | — | — | page gate | `--scope /developers-guide/frontend/intro`; claims; commands; prettier; Svelte 4 idioms / versions = exit 1; H1 | ✅ | ⬜ pending |
| 168-05-02 | 05 | 3 | DOCS-01, DOCS-04 | T-168-14, T-168-15 | reads stay RLS-scoped | page gate | five pages: scoped `--check`, claims, commands, prettier; cache-proxy / Strapi / Svelte 4 / `[[lang` greps = exit 1 | ✅ | ⬜ pending |
| 168-05-03 | 05 | 3 | DOCS-01, DOCS-03, DOCS-04 | — | — | page gate | eleven pages: scoped `--check`, claims, commands, prettier; D-21 + D-17 greps = exit 1 | ✅ | ⬜ pending |
| 168-06-01 | 06 | 3 | DOCS-05, DOCS-04 | T-168-16 | verification steps attributed to server | page gate | `--scope …/pre-registration-and-invitation`; claims; commands; prettier; Strapi / registrationKey / `auth_user_id` = exit 1 | ✅ | ⬜ pending |
| 168-06-02 | 06 | 3 | DOCS-05, DOCS-04 | T-168-17, T-168-18 | no key material on pages | page gate | five pages: scoped `--check`, claims, commands, prettier; private-key / JWT greps = exit 1; both D-18 findings in the claims file | ✅ | ⬜ pending |
| 168-06-03 | 06 | 3 | DOCS-01, DOCS-03, DOCS-04 | — | — | page gate | eight pages: scoped `--check`, claims, commands, prettier; D-21 + D-17 greps = exit 1; both app-settings pages link `dynamicSettings.type.ts` | ✅ | ⬜ pending |
| 168-07-01 | 07 | 4 | DOCS-06 | T-168-20 | generated pages never hand-edited | tracer (regenerate) | no `EntityCardAction`; generated index exists; `--check --scope '…/generated/**'` = 0; no typedoc; About these docs page gate | ✅ | ⬜ pending |
| 168-07-02 | 07 | 4 | DOCS-01, DOCS-04 | T-168-21 | checklist / PR-template anchors resolve | page gate | contributing + about + landing scoped `--check`; `--only inbound` = 0; claims; commands; Svelte 4 / IconBase = exit 1; ≤ 1 Strapi line under About | ✅ | ⬜ pending |
| 168-07-03 | 07 | 4 | DOCS-02, DOCS-06 | T-168-19 | research spans frozen | gate | `generate:docs && git diff --exit-code -- apps/docs && check:research-quotes --base <base> && validate:links --check`; no `pending` verdict | ✅ | ⬜ pending |
| 168-08-01 | 08 | 5 | DOCS-02, DOCS-03, DOCS-07, DOCS-08 | — | — | full gate set | the nine D-22 gates; `yarn lint:check && yarn format:check`; verifier manifest non-empty, unique, copies present | ✅ | ⬜ pending |
| 168-08-02 | 08 | 5 | DOCS-04 | — | — | checkpoint:human-action (orchestrator spawns `gsd-doc-verifier`) | every manifest entry has `.planning/tmp/verify-<name>.md.json` with `claims_checked` > 0 | n/a | ⬜ pending |
| 168-08-03 | 08 | 5 | DOCS-04, DOCS-05, DOCS-06 | T-168-22, T-168-23, T-168-24 | no secret in evidence; Supabase left as found | gate | todo moves and residue todos exist; secret scan = exit 1; ledger sections present, no `pending`; final `validate:links --check`, `check:research-quotes`, `lint:check`, `format:check` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Plan 168-01 is this phase's Wave 0: every later gate depends on instruments it builds and proves red first.

- [ ] `validate:links --check` with seven classes and `--only` / `--scope` (168-01 Tasks 1–2), each class observed red on an injection
- [ ] `check:research-quotes --base <rev>` with base and head extracts and three red controls (168-01 Task 3)
- [ ] `scripts/check-claims.mjs` `ledger` and `commands` with recorded controls (168-01 Task 2)
- [ ] docs `lint` script in the root gate, observed red on an injected violation (168-01 Task 3)
- [ ] `move-generated.ts` destination clear, observed before/after (168-01 Task 4)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Independent reader of every changed page | DOCS-04 | `gsd-executor` cannot spawn agents; the `gsd-doc-verifier` pass is orchestrated at the top level (168-08 Task 2) | For each line of `.planning/tmp/docs-verify/MANIFEST.txt`, spawn `gsd-doc-verifier` with `doc_path` = that copy; resume when every result JSON exists |
| Factual accuracy of prose beyond anchored claims | DOCS-04 | A grep can prove an anchor exists, not that a sentence reads it correctly | Verifier findings are reconciled against the claim ledgers in 168-08 Task 3; residual WARNINGs listed in the ledger |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are the one checkpoint whose verification is a file-existence check
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (168-01 builds them; tick at execution)
- [x] No watch-mode flags
- [x] Feedback latency < 60 s for the quick command
- [ ] `nyquist_compliant: true` set in frontmatter (set by validate-phase)

**Approval:** pending
