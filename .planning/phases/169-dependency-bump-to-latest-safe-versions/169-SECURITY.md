---
phase: "169"
slug: "dependency-bump-to-latest-safe-versions"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-04"
---

# Phase 169 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry → `yarn.lock` / installs | Every resolved version is third-party code run at build, test and (for runtime deps) production time; lint plugins and allowed postinstalls run on every machine | third-party executable code |
| `yarn npm audit` → audit gate → `security/audit-baseline.json` | The gate trusts the audit's output; the baseline decides which known advisories do not redden the build | advisory findings / accept list |
| Docker Hub `node:24-alpine`, `mcr.microsoft.com/playwright` → images | Production runtime base image and the pinned visual-test container | runtime images |
| Yarn release download → `.yarn/releases` | The vendored Yarn binary every install executes | executable |
| local repository → public GitHub remote (`ci-evidence/**`) | Evidence pushes publish a tree | source tree; `.planning/` must never cross |
| ESLint config → repository guards | Guards implemented as ESLint rules disarm silently if the config drops rules | rule configuration |
| user-authored HTML → `sanitize.ts` → SSR output | DOMPurify over jsdom is the server-side XSS control | untrusted HTML |
| bundler (Rolldown/Oxc) → SSR/client bundles; repo-root `.env` → dev server | Bundler output ships to server and browser; the restart plugin watches a secrets file | code; secrets file path (never contents) |
| Supabase CLI → local service images; RLS → anon/authenticated callers | CLI version selects PostgREST/GoTrue/Postgres; pgTAP is the authority on who reads what | DB rows under RLS |
| browser cookies → SvelteKit hooks → Supabase Auth | `@supabase/ssr` encodes/decodes the session; the adapter writes auth cookies and cache headers | session tokens |
| IdP JWE/JWT → `identity-callback`; function input → SMTP; Deno runtime → npm | jose decrypts bank-auth tokens; nodemailer builds mail; `npm:` imports resolve at boot outside `yarn.lock` | identity claims, email content |
| admin job → LLM provider API; LLM output → database | API keys and prompts leave the server; generated objects come back and are stored after validation | API keys, prompts, generated content |
| third-party Actions → CI runners | Actions run with the workflow token and permissions | `GITHUB_TOKEN`, repo write |
| `sv` migrator → working tree; SvelteKit request handling | A fetched migrator would run against the tree; Kit defaults own CSRF, body-size and cookie handling | source; HTTP requests |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-169-01 | Tampering | `yarn up -R` refresh pulling a freshly compromised release | high | mitigate | `.yarnrc.yml` `npmMinimalAgeGate: 7d`; no `npmPreapprovedPackages`; binding proof in EVIDENCE § 5 "Age gate binding proof" (`YN0016 … quarantined`) | closed |
| T-169-02 | Repudiation | `scripts/assert-dependency-audit.mjs` passing when the audit never ran | high | mitigate | `scripts/lib/audit-run.mjs` `classifyAuditRun` (empty output + non-zero/null status → `did-not-run`), imported and called by `runAudit` in the gate; unit cases in `packages/dev-seed/tests/auditBaselineShape.test.ts`; NC-1..NC-5 in EVIDENCE § 5 "Audit liveness" | closed |
| T-169-03 | Tampering | `--update-baseline` rewriting the baseline from a failed audit | high | mitigate | `runAudit` calls `cannotRun` (`process.exit(2)`) on `did-not-run` before `updateBaseline` runs; both modes go through `runAudit`; NC-4 shows the file untouched | closed |
| T-169-04 | Information disclosure | gate and E2E logs | low | mitigate | `.gitignore` `tests/e2e-runs/`; `git ls-files tests/e2e-runs` empty; ledger records statuses/counts only ("No env value recorded") | closed |
| T-169-SC | Tampering | npm installs, all groups (incl. Deno pins) | high | mitigate | age gate (T-169-01); `enableScripts: false` with root `dependenciesMeta.built` = esbuild, supabase, unrs-resolver only; legitimacy check per group in EVIDENCE § 2 (0 SLOP; SUS only `too-new`/`unknown-downloads` on established packages, as 169-01 permits); boxes A/B/C ticked in `169-LEGITIMACY-APPROVALS.md`; Deno pins exact; 169-11/169-13 scope accepted (AR-169-04) | closed |
| T-169-05 | Denial of service | `apps/frontend/Dockerfile` production runtime | high | mitigate | isolated Node commit `77d3ce8bf` (8 files, no lockfile); gates 12/12, image build, `node -v` v24.21.0, HTTP 200 smoke, E2E 171/171, CI run 3 success (EVIDENCE § 4). Render watch follow-up closed by operator ruling `69f2fa662` (nothing deployed; first deploy starts on `FROM node:24-alpine`) | closed |
| T-169-06 | Tampering | `.yarn/releases/yarn-4.18.1.cjs` | medium | mitigate | ledger § 2 records sha256 `a28ad591…970907e`, which matches the file on HEAD; Dockerfile `ENV YARN_VERSION=4.18.1` + `corepack prepare yarn@${YARN_VERSION}` | closed |
| T-169-07 | Information disclosure | ci-evidence push (169-02) | high | mitigate | scratch-index source-only trees; re-checked: `91e58711a`, `3eaa31396`, `2cf0e8416` have 0 `.planning/`/`.bg-shell/` paths, parent `59f8dacdd` (0 `.planning/` paths) | closed |
| T-169-08 | Tampering | `engines.node` floor | medium | mitigate | root `package.json` `engines.node ">=24.15.0"`, `preinstall: node scripts/assert-node-engine.mjs`; guard rejected v24.14.1 and v22.22.1 (EVIDENCE § 5) | closed |
| T-169-09 | Tampering | `packages/shared-config/eslint.config.mjs` migration | high | mitigate | `import-x/first`, `newline-after-import`, `no-duplicates`, `consistent-type-specifier-style` set to error; no FlatCompat/`@eslint/eslintrc`; planted proof 4/4 with negative controls (`169-planted-import-rules.sh`, EVIDENCE § 5) | closed |
| T-169-10 | Elevation of privilege | `unrs-resolver` postinstall | medium | mitigate | box A ticked; postinstall source printed in EVIDENCE § 2 (169-03) before install; 1.12.2 at 136.9 d; allow-listed only via `dependenciesMeta` | closed |
| T-169-11 | Tampering | frontend ESLint guard tests after the flag removal | high | mitigate | four `apps/frontend/src/lib/_guards/eslint-*-guard.test.ts` keep "fires … on the violation" cases, 0 `.skip/.only/.todo`; 390/390 on ESLint 10.11.0 (EVIDENCE § 6, 169-03 Task 2) | closed |
| T-169-12 | Tampering (XSS) | `apps/frontend/src/lib/utils/sanitize.ts` on DOMPurify 4 / jsdom 30 | high | mitigate | `DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })` via isomorphic-dompurify 4.4.0 / jsdom 30.1.1; `sanitize.test.ts` covers script, `onerror`, `javascript:`; root `resolutions` removed after its origin was traced (EVIDENCE § 6, 169-04 Task 2) | closed |
| T-169-13 | Repudiation | unit gate after the Vitest major | high | mitigate | root `test:unit` runs `assert:unit-coverage` (`scripts/assert-unit-test-coverage.mjs`) first; per-workspace count equality "11 workspaces equal" (EVIDENCE § 6, 169-04 Task 1) | closed |
| T-169-14 | Tampering | `PW_IMAGE` | medium | mitigate | `tests/scripts/visual-container.sh` defaults to `mcr.microsoft.com/playwright@sha256:eff16c30…a4a27`; `docker image inspect` failure → `fatal "pinned image digest not present locally" 4` (refuses to pull) | closed |
| T-169-15 | Tampering | frontend SSR/client bundles under Rolldown | high | mitigate | build-output diff recorded (EVIDENCE § 6, 169-05); no `build.target`/rollup override in `apps/frontend/vite.config.ts`; visual + full E2E green | closed |
| T-169-16 | Information disclosure | `restartOnRootEnv` | low | mitigate | `apps/frontend/vite.restartOnRootEnv.ts`: `apply: 'serve'`, only `watcher.add` + path compare + `server.restart()`; no read or log of the file | closed |
| T-169-17 | Denial of service | SvelteKit body-size advisory | medium | mitigate | `@sveltejs/kit` 2.70.3 in `yarn.lock`; baseline `accepted: []` (Kit row 1116433 dropped) | closed |
| T-169-18 | Information disclosure | RLS under new PostgREST/GoTrue/Postgres | high | mitigate | pgTAP `Files=36, Tests=1335` PASS after CLI commit (PG 15.8) and at final head on PG 17.6, census `36-entity-identity.test.sql` + `16-anon-visibility.test.sql` ok; CI `supabase-tests` PASS | closed |
| T-169-19 | Denial of service | hosted deploy of a PG17-only migration | high | mitigate | the only executable SQL change in the phase is `is_valid_choice_id` `IMMUTABLE` → `STABLE` (ruling R1; valid on PG15); `config.toml` keeps a hosted-major guard ("every migration must stay valid on the hosted major … `SHOW server_version;`"). PG15 constraint and hosted-upgrade todo superseded by ruling `69f2fa662`: nothing is deployed, so no PG15 host exists | closed |
| T-169-20 | Repudiation | PG17 gate reading config, not the server | medium | mitigate | `show server_version` → 17.6 recorded at each PG17 gate; `.temp/postgres-version` recorded absent (EVIDENCE § 4, § 6) | closed |
| T-169-21 | Tampering | `database.ts` drift between CLI and CI | medium | mitigate | `packages/dev-seed/tests/rpcNullabilityGate.test.ts` "pins every setup-cli step to exactly that version" (reads `supabase@npm` from `yarn.lock`); 6 × `version: 2.118.0` in `main.yaml`; regenerated with no drift | closed |
| T-169-22 | Spoofing | session cookies after ssr 0.12 | high | mitigate | `assert:cookie-names` in `lint:check`; `apps/frontend/src/lib/supabase/safeGetSession.test.ts` round-trip counts unchanged; `auth-setup` login 3/3; tarball comparison shows the same `base64-` encoding, so old sessions still read (EVIDENCE § 6, 169-07) | closed |
| T-169-23 | Information disclosure | caching of auth-cookie responses | medium | mitigate | `apps/frontend/src/lib/supabase/server.ts` `setAll` forwards ssr headers via `event.setHeaders`, once per name (`forwardedHeaders`); `server.test.ts` covers forward, no repeat, none-when-empty | closed |
| T-169-24 | Spoofing | `identity-callback` on jose 6 | high | mitigate | `npm:jose@6.2.12`; RSA-OAEP family confirmed (removed RSA1_5 unused); `verifyConfig.test.ts` "is the exact version the Edge Function pins"; bank-auth 8/8 ×3 and journey 131/131 ×3 on PG15 and PG17 (`tests/e2e-runs/169-pg17-bankauth-*`, exit 0) | closed |
| T-169-25 | Tampering | `send-email` SMTP header/command injection | high | mitigate | `send-email/index.ts` `import nodemailer from 'npm:nodemailer@10.0.11'` (≥ 10.0.6); live `gh api /advisories?…affects=nodemailer@10.0.11` → 0 (re-run 2026-10-04) | closed |
| T-169-26 | Tampering | transitive npm deps of Deno `npm:` imports | medium | accept | AR-169-01 | closed |
| T-169-28 | Repudiation | visual/test baselines after a seed change | medium | mitigate | seed diff at seed 42 recorded first (EVIDENCE § 6, 169-08); 0 `*.png` changed across the phase | closed |
| T-169-29 | Tampering | dev-seed writer reaching a non-local DB | low | accept | AR-169-02 | closed |
| T-169-30 | Information disclosure | `llmProvider.ts` error paths | medium | mitigate | `packages/llm/src/llm-providers/llmProvider.ts`: keys only via `createOpenAI/createGoogle({ apiKey: config.apiKey })`; no `console` or logger; errors rethrown or message-only | closed |
| T-169-31 | Tampering | structured-output validation | medium | mitigate | `generateObject({ … schema: options.schema })` keeps zod as validator; no `any` cast in the provider; package tests green | closed |
| T-169-32 | Information disclosure | `dotenv` in `tests/playwright.config.ts` | low | mitigate | dotenv held at 17.4.2, line unchanged in the phase; `--list` config load showed no `.env` value or banner (`t2-dotenv-list.log`, EVIDENCE § 4). Quietness is dotenv's default, not an explicit `quiet: true`; the held-18.x todo requires re-checking default logging | closed |
| T-169-33 | Tampering | `promptRegistry.ts` YAML loading | low | mitigate | `packages/llm/src/prompts/promptRegistry.ts` `yaml.load(content)` with the default (safe) schema on js-yaml 5.4.2 | closed |
| T-169-34 | Elevation of privilege | `changesets/action` v2 in `release.yml` | medium | mitigate | `github-token: ${{ secrets.GITHUB_TOKEN }}` input; job `permissions` block unchanged in the phase diff; inputs checked against v2 `action.yml` (EVIDENCE § 6, 169-11) | closed |
| T-169-35 | Tampering | Action major tags (mutable refs) | medium | accept | AR-169-03 | closed |
| T-169-36 | Information disclosure | ci-evidence push (169-11) | high | mitigate | `origin/ci-evidence/169-deps` = `59607e5cd`, plus `3a27c98fc`, `d69c5d62a`: 0 `.planning/`/`.bg-shell/` paths each, parent `59f8dacdd` | closed |
| T-169-37 | Tampering | `sv` migrator | high | mitigate | Kit 3 HELD by the age rule (169-12 outcome); `sv` never run; 0 `sv@` entries in `yarn.lock`. Re-audit when the pending `2026-10-03-sveltekit-3-held-by-the-age-rule.md` lands | closed |
| T-169-38 | Spoofing | Kit 3 security defaults | medium | mitigate | vector absent on HEAD: `@sveltejs/kit` 2.70.3, adapter-node 5.5.7, adapter-static 3.0.10. Re-audit with Kit 3 | closed |
| T-169-39 | Repudiation | `security/audit-baseline.json` rewrite | high | mitigate | `auditBaselineShape.test.ts` "carries no REVIEW REQUIRED rationale …"; baseline `accepted: []`; row-by-row reconciliation (EVIDENCE § 6, 169-13 Task 1) | closed |
| T-169-40 | Denial of service | hosted deploy after the phase | medium | mitigate | `config.toml` hosted-major guard comment present; Render and hosted-PG todos closed with Resolved sections by ruling `69f2fa662` (nothing deployed; first deploy on Node 24 / PG17) | closed |
| T-169-41 | Tampering | final E2E evidence | medium | mitigate | `tests/e2e-runs/169-e2e/169-13-final/provenance.txt`: head `be000f31a`, full default suite, `db-reset: yes` (gates and pgTAP at the same head); `169-nodemailer-pin`: head `637955cc1`, `db-reset: yes` | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*
*T-169-27 is unused in every plan register (numbering gap, not a threat). T-169-SC was declared in all 13 plans and is merged here.*
*Unregistered flags: none from SUMMARY `## Threat Flags` (169-07..11 and RULINGS map to registered IDs; 169-01..06, 12, 13 have no such section). Informational, from `169-REVIEW-DISPOSITION.md`: WR-01, a pre-existing prompt-injection surface (candidate text in a system message). It is now an explicit opt-in: `allowSystemInMessages: options.allowSystemInMessages ?? false` in `llmProvider.ts`, with opt-ins in `condenser.ts` and `infoGeneration.ts`. The structural fix is tracked by the pending todo `2026-10-03-llm-move-system-template-to-instructions.md`.*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-169-01 | T-169-26 | Top-level Deno `npm:` pins are exact (`@supabase/supabase-js@2.117.2` ×3, `jose@6.2.12`, `nodemailer@10.0.11`). Transitive resolution belongs to the edge runtime. The audit blind spot is tracked by the pending todo `2026-10-03-deno-edge-imports-invisible-to-audit-deps.md` | plan-time disposition (169-07) | 2026-10-01 |
| AR-169-02 | T-169-29 | The dev-seed writer's non-local refusal is unchanged. In the phase diff, `writer.ts` only adds an error `cause`, and `localityGuard.test.ts` changes only its timeouts, not its assertions. The seed dump script is offline | plan-time disposition (169-08) | 2026-10-01 |
| AR-169-03 | T-169-35 | Actions stay on major tags. Every action bumped in the phase is from an official publisher (`actions/*`, `changesets/action`, `trufflesecurity/trufflehog`). trufflehog is pinned exactly (`v3.97.9`). SHA pinning is out of scope | plan-time disposition (169-11) | 2026-10-01 |
| AR-169-04 | T-169-SC (169-11, 169-13 scope) | These plans install no npm package. The Actions supply chain is covered by T-169-35 | plan-time disposition (169-11, 169-13) | 2026-10-01 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-04 | 41 | 41 | 0 | gsd-security-auditor |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-04
