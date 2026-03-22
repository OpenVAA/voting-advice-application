# Phase 39: CI/CD and Documentation - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Update GitHub Actions, CLAUDE.md, deployment config, and docs to reflect the Supabase-only architecture. Add skill-drift-check CI job (after Phase 29 skills are in place).

</domain>

<decisions>
## Implementation Decisions

### GitHub Actions (CICD-01)
- **D-01:** Remove `backend-validation` job (Strapi build/lint) from main.yaml
- **D-02:** Add `pgTAP` job — runs `supabase start` and `supabase test` in CI
- **D-03:** Update E2E job to use `supabase start` instead of Docker Compose stack
- **D-04:** Add `skill-drift-check` job from parallel branch — audits whether skills are stale when source targets change
- **D-05:** Keep current Node 22 and Yarn 4.13 versions (do NOT regress to parallel branch's Node 20/Yarn 4.6)
- **D-06:** Keep Turborepo remote caching (TURBO_TOKEN, TURBO_TEAM)

### CLAUDE.md (CICD-02)
- **D-07:** Rewrite for Supabase-only development workflow — Phase 38 handles the bulk of this, Phase 39 verifies completeness
- **D-08:** Document: `supabase start`, migrations, Edge Functions, pgTAP testing, Mailpit email
- **D-09:** Remove Docker development section (replaced with supabase CLI workflow)
- **D-10:** Update Backend section from Strapi to Supabase (schema, RLS, Edge Functions, auth)

### Deployment config (CICD-03)
- **D-11:** Update Render blueprint for frontend-only deployment with Supabase env vars
- **D-12:** Remove Strapi service from deployment config
- **D-13:** Document Supabase Cloud project setup as the backend deployment path

### Documentation site (CICD-04)
- **D-14:** Update docs site pages — zero references to Strapi as active backend
- **D-15:** Historical mentions acceptable ("migrated from Strapi") but not instructions for using Strapi

### Skill-drift-check
- **D-16:** Add skill-drift-check only after confirming Phase 29 skills are in place (they are — Phase 29 completed)
- **D-17:** Copy `audit-skill-drift.sh` script from parallel branch if not already present
- **D-18:** CI job runs on every PR to catch stale skills

### Claude's Discretion
- Exact pgTAP CI job configuration (supabase start timing, test command)
- Whether to add Supabase CLI installation step to CI or use GitHub Action
- Documentation site page structure for Supabase content
- Whether skill-drift-check needs adaptation for current branch skill locations

</decisions>

<specifics>
## Specific Ideas

- CI must keep Node 22 + Yarn 4.13 — parallel branch versions are outdated
- skill-drift-check is a good addition — catches skills becoming stale as code evolves
- CLAUDE.md rewrite should be comprehensive — it's the primary developer onboarding doc

</specifics>

<canonical_refs>
## Canonical References

### Parallel branch CI
- `git show feat-gsd-supabase-migration:.github/workflows/main.yaml` — Supabase-era CI (skill-drift, pgTAP, E2E with supabase CLI)
- `git show feat-gsd-supabase-migration:.claude/scripts/audit-skill-drift.sh` — Skill drift check script

### Current branch CI
- `.github/workflows/main.yaml` — Current CI (backend-validation job, Docker E2E)
- `.github/workflows/release.yml` — Release workflow (may need Supabase awareness)

### Documentation
- `CLAUDE.md` — Primary dev guide (needs Supabase rewrite after Phase 38)
- `apps/docs/` — Documentation site

### Deployment
- `render.yaml` or equivalent — Render blueprint (if exists)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Parallel branch CI is a good reference but needs version updates (Node 22, Yarn 4.13)
- Turborepo remote caching config already in place — preserve it
- release.yml workflow may not exist on parallel branch — keep current version

### Established Patterns
- CI uses `threeal/setup-yarn-action@v2` for Yarn setup
- `actions/setup-node@v4` with cache: "yarn"
- Turbo env vars for remote caching

### Integration Points
- Phase 38 does the bulk of CLAUDE.md rewrite — Phase 39 verifies and adds CI-specific docs
- Phase 29 skills must be in place before skill-drift-check (they are)
- pgTAP job depends on `apps/supabase/` workspace from Phase 30

</code_context>

<deferred>
## Deferred Ideas

- Architect/Components/LLM skills (SKILL-A, SKILL-C, SKILL-L) — separate milestone, but skill-drift-check will flag when they're needed
- Changeset bot for PR reminders — BOT-01
- Trusted publishing for npm — PUB-01

</deferred>

---

*Phase: 39-ci-cd-and-documentation*
*Context gathered: 2026-03-22*
