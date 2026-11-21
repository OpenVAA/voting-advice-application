---
phase: "180"
slug: "edge-functions-typecheck-shared-modules"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-11-13"
---

# Phase 180 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| spike branch → this branch | spike files written on another branch enter this one and, through the evidence push, the public repository | source and captured outputs (two hold a home-directory path) |
| E2E report → the totals check | a run's `summary.json` decides whether a run counts as green | test totals (integrity) |
| npm registry → the repository | `deno@2.9.6` and its platform binaries enter `yarn.lock` and every `node_modules` | third-party binaries (supply chain) |
| environment → Edge Function | each function reads configuration through `requireEnv`, now from `_shared/` | configuration, secrets by reference |
| signed-in caller → `send-email` | the caller-authority gate stays in `send-email/` | authorisation decision |
| this worktree ↔ `-infra` | one shared local Supabase stack, two worktrees | local stack availability |
| local repository → public GitHub repository | the `ci-evidence/180-deno` push publishes a source tree | source (public) |
| local tree → `edge-runtime` container | bundle passes mount an export into Docker | tracked files only |
| local → hosted staging project | no crossing in this phase (D-27) | none |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-180-01 | Tampering | spike sources brought over | low | mitigate | `git checkout 796e610a7 -- <paths>`; `180-01-t1-verify.sh` (`git diff --quiet 796e610a7 HEAD` per directory; reference equal with its added section cut out) exit 0, also on final HEAD — 180-01-SUMMARY | closed |
| T-180-02 | Information disclosure | two captured outputs holding a home-directory path | medium | mitigate | kept on the branch (D-03); home-path scan found exactly the two captures; operator chose `push-without-home-paths` (180-03-push-decision.txt, 2026-11-13T09:55:37Z) | closed |
| T-180-03 | Repudiation | a short or partial E2E run judged green | medium | mitigate | `180-totals.mjs` present, reads only `180-` delta rows; red/green controls recorded in 180-01-SUMMARY | closed |
| T-180-04 | Tampering | `deno@2.9.6` + `@deno/<platform>` (supply chain) | high | mitigate | `apps/supabase/package.json` pins `"deno": "2.9.6"` exactly; `.yarnrc.yml` `npmMinimalAgeGate: 7d`, `enableScripts: false`; no `deno` entry under `dependenciesMeta`; RESEARCH.md § Package Legitimacy Audit [OK] | closed |
| T-180-05 | Tampering | `_shared/envConfig.ts` gaining an env default unnoticed | medium | mitigate | env-default guard covers `_shared/`; control 180-02-6 (planted `?? 'planted-default'`) exit 1 with violations at `_shared/envConfig.ts:34` | closed |
| T-180-06 | Elevation of privilege | `send-email` caller-authority gate | low | mitigate | `send-email/callerAuthority.ts` unmoved; `send-email/flowConformance.test.ts` pins `import { callerMayOnProject } from './callerAuthority.ts'` | closed |
| T-180-07 | Information disclosure | ignored `functions/.env` | medium | mitigate | never read, listed or staged (180-02-SUMMARY Threat Flags); paths named per commit | closed |
| T-180-08 | Denial of service | shared stack serving wrong tree / taken from `-infra` | high | mitigate | D-26 checkpoint (Task 6) answered before any stack use; stack check recorded migrations, functions mount, edge runtime — 180-02-SUMMARY | closed |
| T-180-09 | Tampering | type-only change altering runtime behaviour | low | accept | see Accepted Risks Log AR-180-01 | closed |
| T-180-10 | Information disclosure | `ci-evidence/180-deno` pushed to public repository | high | mitigate | `origin/ci-evidence/180-deno` (1ed7c6d28) holds 0 paths under `.planning/`, `.bg-shell/`, `tests/e2e-runs/` and no `CAND-APP-PLAN.md`; home-path captures excluded; one push on the operator's go (D-28) | closed |
| T-180-11 | Tampering | dev-only `deno.json` changing deployed artefact | medium | mitigate | `180-03-bundles-compare.txt`: `cmp identical` for all three functions with and without `deno.json`; no test file in bundles | closed |
| T-180-12 | Tampering | a hosted deploy from this phase | high | mitigate | no `supabase functions deploy` / `link` / `--project-ref` run (D-27; 180-03-SUMMARY "nothing deployed") | closed |
| T-180-13 | Information disclosure | ignored `functions/.env` mounted into a container | medium | mitigate | bundle passes and LSP probe ran on `git archive` exports under the scratchpad, never the working tree — 180-03-SUMMARY | closed |
| T-180-14 | Denial of service | shared stack taken while `-infra` uses it | high | mitigate | D-26 checkpoint (Task 4) before every stack use — 180-03-SUMMARY Threat Flags | closed |
| T-180-SC | Tampering | npm/pip/cargo installs | high | mitigate (02) / accept (01, 03) | plan 02's single install audited [OK] (see T-180-04); plans 01 and 03 install nothing — AR-180-02 | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-180-01 | T-180-09 | `SupabaseClient` type changes are erased at runtime; the bank-auth and identity-provider E2E projects exercise `identity-callback` | plan 180-02 threat model | 2026-11-13 |
| AR-180-02 | T-180-SC | plans 180-01 and 180-03 install no package | plans 180-01, 180-03 threat models | 2026-11-13 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-13 | 15 | 15 | 0 | /gsd-secure-phase (orchestrator, ASVS L1 grep-depth; auditor skipped per short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-13
