---
phase: "186"
slug: "deployed-smoke-entry"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-11-15"
---

# Phase 186 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| served page and health answer → the gate | The target's own answers are untrusted input to the identity checks | build SHA, project id, Supabase URL (public) |
| run environment → the gate and specs | Inputs set by a workstation shell or a pipeline step | base URL, expected SHA, contestant address and password (secret) |
| tests tree → the smoke entry | Shared fixtures could pull a service-role client in | code imports |
| workflows → the hosted project | A remote-seed switch would arm prefix deletes | workflow env |
| operator workstation → hosted Auth and database | The single contestant write (plan 08) | address, password, grant (secret) |
| run artifacts and transcript → repository / CI artifacts | Reports, logs and error context may carry typed values | credentials (secret) |
| documentation → whoever runs the smoke | Copied commands run with real credentials | credential handling instructions |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-186-01 | Spoofing | ref and project-id checks | high | mitigate | Expected values read only from `infra/envs/staging/supabase/terraform.tfvars` in `tests/tests/utils/deployedTarget.ts`; "no input widens the ref" case in `deployedTarget.test.ts` | closed |
| T-186-02 | Elevation of privilege | service-role-key-absent check | high | mitigate | Gate fails on a non-blank `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` (`deployedTarget.ts`); `PASS service-role-key-absent` in the green run | closed |
| T-186-03 | Information disclosure | FAIL lines and thrown messages | medium | mitigate | "(value withheld)" in `deployedTarget.ts`; withheld-value unit cases | closed |
| T-186-04 | Information disclosure | contestant spec traces, screenshots, video | high | mitigate | `trace/screenshot/video: 'off'` in `contestant.smoke.ts`; HTML reporter removed (CR-01); `PLAYWRIGHT_NO_COPY_PROMPT=1` in `playwright.deployed.config.ts` and form emptied before assertions (closes the plan-02 threat flag on `error-context.md`) | closed |
| T-186-05 | Elevation of privilege | local `.env` reaching a hosted run | high | mitigate | `playwright.deployed.config.ts` and `deployed-global-setup.ts` load no environment file; guard "no env-file loader in the entry"; ESLint bans `dotenv`; gate refuses the key variables | closed |
| T-186-06 | Tampering | red run made green by retrying | medium | mitigate | `retries: 0` in `playwright.deployed.config.ts`; shape guard pins it | closed |
| T-186-07 | Tampering | writes to the hosted project during the voter walk | low | accept | See Accepted Risks Log | closed |
| T-186-08 | Elevation of privilege | service-role client reachable from the smoke entry | high | mitigate | ESLint lock in `tests/eslint.config.mjs`; value-import walk in `deployedSmokeGuards.test.ts` | closed |
| T-186-09 | Tampering | remote-seed switch in a workflow or the entry | high | mitigate | Unit scan of `.github/` and the entry in `deployedSmokeGuards.test.ts`; grep of `.github/` finds no switch | closed |
| T-186-10 | Information disclosure | address in process list or server log | medium | mitigate | Bound parameter and `log_parameter_max_length_on_error` in `infra/scripts/grant-smoke-contestant.sql` / staging README Step 22; keychain-sourced inputs | closed |
| T-186-11 | Elevation of privilege | grant reaching the wrong or a second user | high | mitigate | Exactly-one-user match and refusals in `grant-smoke-contestant.sql`; one entity-scope editor grant | closed |
| T-186-12 | Tampering | re-run duplicating rows | low | mitigate | `ON CONFLICT … DO NOTHING` in `grant-smoke-contestant.sql` | closed |
| T-186-13 | Information disclosure | password on a command line while stored in the keychain | medium | mitigate | `security -i` on standard input, documented in the staging Supabase README | closed |
| T-186-14 | Repudiation | a control counted that failed for another reason | medium | mitigate | `186-05-controls.md`: each control shows its own single FAIL line and `1 of 4 checks failed` | closed |
| T-186-15 | Information disclosure | local and hosted keys in evidence or logs | medium | mitigate | JWT-shape search over evidence (0 hits, per verification § Prohibitions) | closed |
| T-186-16 | Information disclosure | documented commands handling contestant credentials | medium | mitigate | `tests/README.md` reads credentials from the keychain without echo and says a failed contestant run dir is never published | closed |
| T-186-17 | Repudiation | green claim from a void or partial run | medium | mitigate | `e2e-spec-verdict.mjs --no-flaky` verdicts; `RED_RUNS=0`, `E2E_VOID_RUNS=0` on record | closed |
| T-186-18 | Information disclosure | root `.env` read | medium | mitigate | Only `test -f .env` used (186-07-SUMMARY) | closed |
| T-186-19 | Tampering | the write reaching another project | high | mitigate | Ref read from committed tfvars (`cofbsatfrdysyphajsky`); `s22c_ref=ok` check in the plan-08 sitting | closed |
| T-186-20 | Elevation of privilege | hosted write without approval | high | mitigate | Bound-approval re-reads exit 0 before Task 3 (186-08-SUMMARY); no subagent holds a credential (process claim, accepted by operator in UAT test 4) | closed |
| T-186-21 | Information disclosure | address, password or token in evidence, README or transcript | high | mitigate | Keychain-held values; `CREDENTIAL_LEAK_CHECK=clean` exact-value search plus address/JWT-shape search | closed |
| T-186-22 | Spoofing | password account on a public sign-in form | medium | mitigate | 32 random bytes base64url; single entity editor grant; every smoke run signs out; removal documented in Step 22 | closed |
| T-186-SC | Tampering | npm installs | high | mitigate | No dependency added: `package.json`, `tests/package.json` and `yarn.lock` show no new package since `a7a4222a8` | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-186-01 | T-186-07 | The voter walk answers in the browser and reads anonymously; staging's analytics relay is not configured until phase 188, so the walk writes nothing to the hosted project. Accepted at plan time (186-02 threat model). | plan-time disposition (186-02) | 2026-11-15 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-15 | 23 | 23 | 0 | /gsd-secure-phase (orchestrator, ASVS L1 grep-depth; auditor skipped per short-circuit rule) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-15
