---
phase: 168
review: 168-REVIEW.md
recorded: 2026-10-02
---

# Phase 168 — Code-review disposition

The code-review gate is advisory. All findings concern docs build tooling (no product code, no runtime surface); none is a security vulnerability.

| ID | Severity | Finding | Disposition |
|----|----------|---------|-------------|
| WR-01 | warning | `move-generated.ts` removes `dest` before the replacement is built; no assertion that `dest` is under `src/routes` | open — tooling hardening candidate |
| WR-02 | warning | `docs-scripts.config.ts` roots depend on `process.cwd()`; a wrong cwd yields 0 components and the prune then wipes generated pages | open |
| WR-03 | warning | `generate-navigation-config.ts` `eval`s the current config and falls back to `[]` on failure, losing flags/titles | open (pre-existing pattern) |
| WR-04 | warning | `resolvePage` lets a decoded `%2f` segment bypass the `..` check (link checker only; no served path) | open |
| WR-05 | warning | `replaceLink` passes a string replacement (`$&` patterns interpreted) and drops the `<url>` form | open |
| WR-06 | warning | Generators never clear `.temp`; `scripts/.temp` not git-ignored | open |
| IN-01..IN-08 | info | README link regex edge cases, dead `DIRS_ONLY` branch, duplicated mapping, `findTypeFile`, nominal 308 on an SPA (documented decision), unused `eslint-config-prettier` devDependency and duplicate `typecheck`/`check` scripts, nav-generator inconsistencies, link-checker edge cases | open |

A single follow-up todo should batch WR-01..WR-06 as "docs tooling hardening"; the unused `eslint-config-prettier` devDependency is a natural pickup for Phase 169's dependency pass.
