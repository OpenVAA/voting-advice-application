# Phase 11: Package Publishing - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Make core, data, matching, and filters publishable to npm with correct metadata, builds, and dependency resolution. Includes tsup migration for all packages, npm metadata, license files, workspace protocol resolution, and automated CI publishing. This phase does NOT cover publishing additional packages beyond the four (deferred to REL-02), or remote caching/dependency alignment (Phase 12).

</domain>

<decisions>
## Implementation Decisions

### License
- MIT license for the 4 publishable packages (core, data, matching, filters)
- Each publishable package gets its own MIT LICENSE file
- Root repository stays GPL-3.0 (split licensing — standard open-source practice)
- Package descriptions: Claude generates concise, accurate npm descriptions per package

### Version numbers
- All 4 publishable packages target 1.0.0 as the first published version
- Don't manually bump in package.json — let Changesets handle the 0.1.0 → 1.0.0 bump via a major changeset
- All start at the same version (1.0.0), then diverge naturally via independent versioning

### Build tooling
- ESM-only output for published packages — no CommonJS
- Migrate ALL packages to tsup (not just publishable ones) for unified build tooling
- app-shared's CJS dual output is temporary (Strapi compatibility) — don't over-invest in it; tsup can handle it simply but it gets removed during Strapi → Supabase migration
- Removes tsc-esm-fix dependency across all packages

### npm org and access
- @openvaa npm org already exists on npmjs.com
- Public access — anyone can `npm install @openvaa/core`
- Update Changesets config from `access: "restricted"` to `access: "public"`
- Automated publishing via CI — configure NPM_TOKEN as GitHub secret, uncomment publish step in release workflow
- Merging a version PR automatically publishes to npm

### Claude's Discretion
- Exact tsup configuration (entry points, output format, dts generation)
- How to handle app-shared's temporary CJS output in tsup config
- Package.json `files` field contents (what to include/exclude in published tarball)
- Repository, homepage, bugs field values in package.json
- How to verify packages work in a fresh Node.js project (PUB-06)
- Whether to bundle dependencies or keep them as peer/external

</decisions>

<specifics>
## Specific Ideas

- Changeset bot is now installed (VER-04 complete as of 2026-03-13)
- The tsup migration should be clean — all packages currently use the same tsc + tsc-esm-fix pattern, so the migration is uniform
- app-shared CJS workaround should be minimal effort — it's being removed when Strapi is migrated to Supabase

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- All 4 packages have identical build setup: `tsc --build && tsc-esm-fix`, output to `./build/`
- Shared TypeScript base config at `packages/shared-config/tsconfig.base.json` (target: es2020, module: ESNext, moduleResolution: Bundler)
- Turborepo already configured with `build/**` and `dist/**` as cached outputs
- Changesets already configured with `@changesets/changelog-github` plugin

### Established Patterns
- All packages: `"type": "module"`, exports via `{ "import": "./build/index.js" }`
- TypeScript project references for inter-package dependencies (composite: true)
- Dependency chain: core → data/matching → filters → app-shared
- `workspace:^` protocol for all inter-package dependencies (Yarn resolves these to real versions on publish)

### Integration Points
- 4 publishable package.json files need: license, description, repository, files, publishConfig, remove `private: true`
- `.changeset/config.json` — change access to "public"
- `.github/workflows/release.yml` — uncomment publish step, add NPM_TOKEN secret reference
- Root `package.json` — add tsup as devDependency (or per-package)
- `turbo.json` — may need output path updates if tsup uses `dist/` instead of `build/`

</code_context>

<deferred>
## Deferred Ideas

- License review for the entire project (not just publishable packages) — consider as future roadmap item
- Publishing additional packages beyond core/data/matching/filters (REL-02)

</deferred>

---

*Phase: 11-package-publishing*
*Context gathered: 2026-03-13*
