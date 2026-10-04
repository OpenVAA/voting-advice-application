---
phase: "168"
slug: "docs-site-rewrite-strapi-to-supabase"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-04"
---

# Phase 168 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| repo content -> link checker | Page text, redirect stubs and outside READMEs are parsed as data; a crafted link or stub must not make the checker write files or accept an off-site redirect (168-01). | Untrusted markdown / `+page.ts` source (low) |
| tooling output -> gate-evidence (committed) | Lint, audit, link-check and D-11 run output (`supabase start` / `db:status` print the anon key, service-role key, JWT secret and S3 keys) is committed with the planning docs (168-01, 168-01.1, 168-08). | Local credentials (high) |
| npm registry -> yarn.lock | Dependency removals re-resolve the lockfile (168-01.1). | Third-party packages (medium) |
| browser on an old URL -> stub `load()` | Stubs run client-side for any visitor arriving from search results or newsletters (168-02). | URL / navigation (medium) |
| repo READMEs, review checklist, PR template -> docs routes | Contributors and the binding review checklist follow these links and anchors (168-02, 168-07). | Link targets (low) |
| docs page -> developer's deployment / `.env` / Render / Supabase Cloud | Readers copy auth, RLS, env and deployment guidance into real deployments (168-03, 168-04). | Security guidance, secret placement (high) |
| writer -> claims ledger | A writer's belief becomes a published statement unless a second check catches it (168-03). | Factual claims (medium) |
| docs page -> contributor's frontend code | Readers follow the data-access and context guidance (168-05). | Data-access guidance (medium) |
| email link -> candidate auth callback; identity provider -> identity-callback | The pages describe where invitation/recovery links and bank-auth tokens are verified and how keys are handled (168-06). | Auth flow guidance, key material (high) |
| frontend docstrings -> generated pages; research content -> published guide | Regeneration publishes what `@component` blocks and the route tree say; ResearchQuote blocks carry cited research that must not change (168-07). | Generated docs, cited research (medium) |
| verifier agent -> pages | Verifier findings drive page edits; a wrong finding must not rewrite a correct page or change code (168-08). | Page content / product code (medium) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-168-01 | Spoofing | redirect stubs validated by `parseStubTarget` | medium | mitigate | `apps/docs/scripts/utils/links.ts` `export function parseStubTarget`: exactly one `redirect(` call, status `301`/`308`, single string literal excluding `\`, `$` and backtick, target must start with `/` and not `//` ("is not an internal route"). Wired into `validateStubs` in `validate-links.ts` (`Invalid redirect stub:`). Negative controls in `gate-evidence/168-01-link-checker-nc.md` "Probe (DOCS-07 chain; T-168-01)" (external, protocol-relative, non-literal, wrong status, chain all red). Re-run at HEAD: `validate:links --check` exit 0, `stub: 0`. | closed |
| T-168-02 | Tampering | `--check` mode in `validate-links.ts` | medium | mitigate | Sole `fs.writeFile` in `validate-links.ts` sits inside `if (!options.check) {` in `validateMarkdownFile`; `utils/links.ts` and `utils/routes.ts` have no write calls. NC (b) in `168-01-link-checker-nc.md` (`git hash-object` identical). Re-run at HEAD left `git status` clean. | closed |
| T-168-03 | Tampering | `<ResearchQuote>` spans and the three frozen components | high | mitigate | `apps/docs/scripts/check-research-quotes.ts`: `SPAN` regex compared in order against `git show <base>:<path>`, fail-closed on empty base set, `COMPONENT_PATHS` (`ResearchQuote.svelte`, `ReferenceList.svelte`, `Author.svelte`) diffed against `--component-base`. Injections observed red in `gate-evidence/168-01-rq-nc.md`. Re-run at HEAD with recorded base/component base: exit 0, 22/22 spans, components identical. | closed |
| T-168-04 | Information disclosure | `gate-evidence/` records (168-01) | medium | mitigate | Secret scan `grep -r -E 'eyJ[A-Za-z0-9_-]{20,}\|sb_(secret\|publishable)_[A-Za-z0-9_-]+' gate-evidence` re-run at HEAD: exit 1. All 32+ hex strings present are 40-char git SHAs. `git log -G` of the same pattern over `gate-evidence` history: no commit. | closed |
| T-168-05 | Elevation of privilege | docs ESLint config | low | accept | Developer-tooling-only change; see Accepted Risks Log AR-168-01. Shared-config change confirmed as one named export: `packages/shared-config/eslint.config.mjs` `export { tsParser };`, consumed by `apps/docs/eslint.config.js`. | closed |
| T-168-06 | Spoofing | the 26 `+page.ts` redirect stubs | medium | mitigate | All 26 page-less `+page.ts` under `apps/docs/src/routes` contain exactly one `redirect(308, '/developers-guide/…')` literal; `grep -E '\burl\b\|searchParams\|params'` over every `+page.ts` exits 1. `stub` class (T-168-01) runs in `validate:links --check`: `stub: 0` at HEAD. | closed |
| T-168-07 | Repudiation | `.agents/code-review-checklist.md` code-style-guide link | medium | mitigate | `contributing/*` pages present (`code-style-guide`, `contribute`, `pull-request`). `validateInboundReferences` scans tracked files outside `apps/docs` (`listTrackedPaths` / `git ls-files`) and checks anchors via `checkAnchor`. `validate:links --check --only inbound` at HEAD: exit 0, 42 refs, `inbound: 0`. | closed |
| T-168-08 | Elevation of privilege | Authentication and authorisation page | high | mitigate | `developers-guide/backend/authentication/+page.md`: "only the editor grant makes the user that entity", "## The service-role key" / "never reaches the browser". Claims rows `168-03-CLAIMS.md` #131, #135, #136 (anchor `only the editor grant makes the caller that entity.` in `503-entity-rpcs.sql`), #100 pass `check-claims.mjs` at HEAD; independent verifier pass in `gate-evidence/168-08-verifier-reconciliation.md` (0 BLOCKER/FAIL). | closed |
| T-168-09 | Information disclosure | env and key examples on Edge Functions / Email pages | high | mitigate | `git grep -E 'eyJ[A-Za-z0-9_-]{20,}\|sb_(secret\|publishable)_…'` over `apps/docs/src/routes`: exit 1; no `KEY=/SECRET=/PASS=/TOKEN=/JWKS=` value assignments; `backend/edge-functions` and `backend/email` pages list names only (`SUPABASE_SERVICE_ROLE_KEY`, `SMTP_USER`, `SMTP_PASS`). | closed |
| T-168-10 | Tampering | stale `auth_user_id` flow described as current | medium | mitigate | `git grep auth_user_id -- apps/docs`: exit 1. | closed |
| T-168-11 | Information disclosure | Deployment page's frontend env list | high | mitigate | `developers-guide/deployment/+page.md` lists exactly the six `- key:` entries of `render.example.yaml` and states "Never set `SUPABASE_SERVICE_ROLE_KEY` on the frontend service." Claims rows `168-04-CLAIMS.md` #380–#386 anchor each key. `git grep SERVICE_ROLE -- apps/frontend/src`: exit 1 (frontend never reads it). | closed |
| T-168-12 | Information disclosure | Environment variables page examples | medium | mitigate | Same secret-shape scan exit 1 over all docs routes; `configuration/environmental-variables/+page.md` states "both are ignored by Git. Never commit a `.env` file, and never put a real key into a template." | closed |
| T-168-13 | Tampering | stale env names (167 removals) taught as current | medium | mitigate | `git grep -E 'PUBLIC_CACHE_ENABLED\|CACHE_(DIR\|TTL\|LRU_SIZE\|EXPIRATION_INTERVAL)\|BACKEND_API_TOKEN\|PUBLIC_(BROWSER\|SERVER)_BACKEND_URL\|flat-cache\|/api/cache' -- apps/docs` (wider than the twelve pages): exit 1. | closed |
| T-168-14 | Elevation of privilege | Data API and adapters page | medium | mitigate | `developers-guide/frontend/data-api-and-adapters/+page.md` "**Project scope.**" (`scopedFrom`, `PUBLIC_PROJECT_ID`, no fallback) and "**Row-level security.**" ("The service-role key is never read under `apps/frontend/src`"). Claims rows `168-05-CLAIMS.md` #253–#256 anchor `createDataProvider` and the writer factories; pass at HEAD. | closed |
| T-168-15 | Tampering | stale cache-proxy guidance (167 removal) | low | mitigate | `git grep -E 'api/cache\|PUBLIC_CACHE_ENABLED\|flat-cache\|disableCache\|PUBLIC_BROWSER_BACKEND_URL\|PUBLIC_SERVER_BACKEND_URL' -- apps/docs`: exit 1. | closed |
| T-168-16 | Spoofing | Pre-registration / Login pages' description of link verification | high | mitigate | `candidate-app/pre-registration-and-invitation/+page.md` attributes `token_hash` + `verifyOtp` to the server route; `168-06-CLAIMS.md` #8, #49–#54 anchored in `apps/frontend/src/routes/api/candidate/auth/callback/+server.ts` (`await locals.supabase.auth.verifyOtp({ token_hash, type });`); login rows #104–#116 anchored in `candidate/login/+page.server.ts`. All pass at HEAD. | closed |
| T-168-17 | Information disclosure | Bank authentication page (key material) | high | mitigate | `candidate-app/bank-authentication/+page.md` links `docs/key-generation.md` (tracked) and shows env names only (`IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDURA_SIGNING_JWKS`, …). `grep -E 'BEGIN\|PRIVATE KEY\|eyJ\|"kty"\|"d":'` on the page: exit 1; `-----BEGIN … PRIVATE KEY` over all routes: exit 1. | closed |
| T-168-18 | Tampering | stale registration-key guidance | medium | mitigate | `candidate-app/registration/+page.md` presents `checkRegistrationKey` as throwing (quoted message, table row "throws"); `168-06-CLAIMS.md` #98 anchored on `checkRegistrationKey is not supported by the Supabase adapter.` in `supabaseDataWriter.ts` passes; todo `register-page-registrationkey-method.md` is in `.planning/todos/done/`. | closed |
| T-168-19 | Tampering | `<ResearchQuote>` spans in the six Publishers' Guide pages | high | mitigate | Same gate as T-168-03 re-run at HEAD `01ad0a4bc` with `--base 0ec229dfe… --component-base 6090476cc…`: exit 0, 22 spans at base, 22 now, frozen components identical. | closed |
| T-168-20 | Tampering | generated pages | medium | mitigate | Generated-dir commits in the phase are `78369e329` (regenerate) and `12d04f015`, which changes `generate-component-docs.ts` / `generate-route-map.ts` together with their output (generator-driven, not hand edits). Idempotence recorded: `gate-evidence/168-07-pipeline.txt` (two runs, `git diff --exit-code -- apps/docs` exit 0) and `168-08-d11-runs.md` row 5. Not re-run by this audit (generator writes files). | closed |
| T-168-21 | Repudiation | code-review checklist / PR template anchors | medium | mitigate | `.github/PULL_REQUEST_TEMPLATE` links `/contributing/pull-request#self-review` and `/contributing/contribute#commit-your-update`; headings `### Self-review` and `### Commit your update` exist; `validate:links --check --only inbound` at HEAD exit 0, `inbound: 0`. | closed |
| T-168-22 | Information disclosure | D-11 run logs in `gate-evidence/` | high | mitigate | `gate-evidence/168-08-d11-runs.md` header: output captured outside the repo, key tables omitted (filter gap for `│`-separated S3 rows disclosed and handled by omission). Secret scan at HEAD exit 1; no 32/64-char hex key strings (only 40-char git SHAs); known local default secrets absent; `git log -G` over history: no hit. | closed |
| T-168-23 | Tampering | verifier-driven page fixes | medium | mitigate | `gate-evidence/168-08-verifier-reconciliation.md` "Caveats the verifiers reported (recorded, not fixed)", 0 BLOCKER/FAIL. All four `168-08` commits touch `.planning/` only. Phase-range diff `0ec229dfe..aff2fbcac` outside `apps/docs`/`.planning` is READMEs, root `package.json`, the shared-config named export and `security/audit-baseline.json`; no product runtime code (PROH-05). | closed |
| T-168-24 | Denial of service | the unrelated Supabase stack on this host | medium | mitigate | `168-08-d11-runs.md` rows 2 and 4: project stack already running, not started or stopped; `yarn dev` stopped by process group; "Supabase was left running, as found." `168-08-SUMMARY.md`: "no Docker restart, no supabase stop --all". Root `db:start`/`db:stop` are workspace-scoped (`yarn workspace @openvaa/supabase start/stop`). | closed |
| T-168-25 | Information disclosure | `gate-evidence/168-01.1-*` logs | low | mitigate | Covered by the same gate-evidence secret scan (exit 1 at HEAD and in history). | closed |
| T-168-SC | Tampering | npm installs (168-01.1 removals + `glob` declaration; `yarn install` in D-11) | low | mitigate (168-01.1) / accept (168-01, 02–07, 08) | 168-01.1: `@typescript-eslint/parser` not declared in `apps/docs/package.json` (named `tsParser` export used instead); `glob` declared at the root range (root and docs both `^13.0.6` at HEAD after Phase 169's move); `gate-evidence/168-01.1-audit-deps.md`: `comm -13 before after` (GHSA ids only in after) empty. Accept portions: Accepted Risks Log AR-168-02. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

**Audit notes (informational, not threats):**

- `check-claims.mjs ledger` over `168-03..07-CLAIMS.md` at HEAD `01ad0a4bc` checks 2176 rows and fails 9. Later commits caused all 9 failures: Phase 169 dependency and workflow moves, and quick task `261004-hzy`, which changed `SMTP_PORT` from 2500 to 1025. The failing rows are 03 #272, 04 #156/#166/#182/#223/#235/#301 and 07 #17/#169. They cover the SMTP port, the Vite `.env` restart, the `lint:check` script text, `vitest.workspace.ts` and GitHub Action versions. None of them backs T-168-08/11/14/16/18; every row cited above passes. A ledger or page refresh belongs to docs maintenance, not to this register.
- The `168-REVIEW-DISPOSITION.md` items WR-01..WR-06 and IN-01..08 are about hardening the docs build tooling (for example, `resolvePage` and `%2f` in the link checker, and `move-generated.ts` removing `dest`). The review marks none of them as a vulnerability, and none of them maps to a registered threat whose mitigation is missing.
- Unregistered threat flags: none. `168-08-SUMMARY.md` `## Threat Flags` says "None"; no other SUMMARY has the section.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-168-01 | T-168-05 | The lint config only affects developer tooling. The shared-config change is one named export (`tsParser`) of an object the config already imports. | plan-time disposition (168-01.1) | 2026-10-04 |
| AR-168-02 | T-168-SC | Plans 168-01 and 168-02 through 168-07 install no package and change no manifest dependency (168-01 adds only a `scripts` entry). In 168-08, `yarn install` re-installs the locked tree from `yarn.lock`; `168-08-d11-runs.md` row 1 records no lockfile or manifest change. | plan-time disposition (168-01, 168-02, 168-03, 168-04, 168-05, 168-06, 168-07, 168-08) | 2026-10-04 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-04 | 26 | 26 | 0 | gsd-security-auditor |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-04
