---
phase: 168
review: 168-REVIEW.md
recorded: 2026-10-02
---

# Phase 168 — Code-review disposition

The code-review gate is advisory. All findings concern docs build tooling (no product code, no runtime surface); none is a security vulnerability.

| ID | Severity | Finding | Disposition |
|----|----------|---------|-------------|
| WR-01 | warning | `move-generated.ts` removes `dest` before the replacement is built; no assertion that `dest` is under `src/routes` | **fixed** in review-fix batch D: `5ac3d56e3` (red), `94dfa8cbd` (fix) — staging directory swapped in; destination must lie under `src/routes/(content)` |
| WR-02 | warning | `docs-scripts.config.ts` roots depend on `process.cwd()`; a wrong cwd yields 0 components and the prune then wipes generated pages | **fixed** in review-fix batch D: `5ac3d56e3` (red), `5e18ce797` (fix) — roots anchored on the config file; an empty component directory throws |
| WR-03 | warning | `generate-navigation-config.ts` `eval`s the current config and falls back to `[]` on failure, losing flags/titles | **fixed** in review-fix batch D: `5ac3d56e3` (red), `4bd9b1ca2` (fix) — the config is imported; only a missing file starts empty |
| WR-04 | warning | `resolvePage` lets a decoded `%2f` segment bypass the `..` check (link checker only; no served path) | **fixed** in review-fix batch D: `5ac3d56e3` (red), `19cde7320` (fix) |
| WR-05 | warning | `replaceLink` passes a string replacement (`$&` patterns interpreted) and drops the `<url>` form | **fixed** in review-fix batch D: `5ac3d56e3` (red), `59e5f44a8` (fix) |
| WR-06 | warning | Generators never clear `.temp`; `scripts/.temp` not git-ignored | **fixed** in review-fix batch D: `5ac3d56e3` (red), `402cb9faa` (fix) — generators clear their output; `apps/docs/scripts/.temp/` ignored |
| IN-01..IN-08 | info | README link regex edge cases, dead `DIRS_ONLY` branch, duplicated mapping, `findTypeFile`, nominal 308 on an SPA (documented decision), unused `eslint-config-prettier` devDependency and duplicate `typecheck`/`check` scripts, nav-generator inconsistencies, link-checker edge cases | **fixed** in review-fix batch D, after `08078d2aa` (scripts made importable): IN-01 `868f6b87b`; IN-02 `39f9c6189`; IN-03 `ff5e028fe`; IN-04 `61fc803ce`; IN-05 `ef63d5b7b` (docs; the prerendered meta-refresh alternative left to the operator); IN-06 `2361a2cb7`; IN-07 `285711b34` (isSecondary: no change, the section type has no such flag); IN-08 `dbf2979a5`; reds in `5ac3d56e3`. See `168-REVIEW-FIX.md` |

A single follow-up todo should batch WR-01..WR-06 as "docs tooling hardening"; the unused `eslint-config-prettier` devDependency is a natural pickup for Phase 169's dependency pass.
