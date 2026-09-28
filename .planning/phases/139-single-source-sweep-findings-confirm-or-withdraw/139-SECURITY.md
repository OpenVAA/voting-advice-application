---
phase: 139
slug: single-source-sweep-findings-confirm-or-withdraw
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-14
---

# Phase 139 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Register origin:** authored at plan time. All seven plans (139-01 … 139-07) carry a
`<threat_model>` block; this file is their union, de-duplicated by threat id.

**What made this phase a security surface at all.** Phase 139 shipped *documentation only* — its
product deliverable is `139-VERDICTS.md`. But its method deliberately injected fifteen regressions
into live source across nine files (including two ASVS V2 authentication paths and one V6
token-verification path) to test whether existing assertions could see them. Every injection was
transient and reverted inside the task that applied it. The security question for this phase is
therefore not "what did the new code introduce" but **"did any injection survive"** — plus the
integrity of the audit record that Phases 140/141/142 read as scope.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| working tree → git history | A transient injection surviving its task would be committed. The phase commits documentation only, so any diff under `apps`, `packages` or `tests` in the phase range is a leak | Source code (auth providers, token verification, input validation, library code) |
| working tree → running process | An injection surviving into a `yarn dev` or E2E run would put a weakened application on a live port; both are forbidden phase-wide | Live request/response over a weakened auth flow |
| browser → `/api/oidc/authorize` | The JAR request object crosses here; the 139-04 task-1 injection removed it from the authorize URL | OIDC authorization request object (signed) |
| server → Idura token endpoint | The client assertion crosses here; the 139-04 task-2 injection removed it from the token request body | Private-key JWT client assertion |
| ID token → `getIdTokenClaims` | Signature, audience and issuer verification happen here; 139-05 task-2 short-circuited the path and replaced a rejection reason | ID token claims (identity assertions) |
| runner output → repository | Injection-run logs could carry captured output into a committed file | Test-runner stdout/stderr |
| audit record → Phases 140 / 141 / 142 | Downstream phases plan remediation from `139-VERDICTS.md`, `REQUIREMENTS.md` and `ROADMAP.md`; a fabricated, merged or mis-columned verdict silently shrinks or misdirects their scope | Verdict rows, ASSERT-07 scope enumeration |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-139-01 | Spoofing / Elevation of Privilege | `apps/frontend/src/lib/api/utils/auth/providers/idura.ts:74` — JAR request object removed from authorize URL (ASVS V2) | critical | mitigate | HYGIENE-LOOP in 139-04 task 1: in-task revert, `git diff --exit-code` on the file, scoped porcelain gate, marker grep. Verified: file identical to pre-phase HEAD | closed |
| T-139-02 | Spoofing / Elevation of Privilege | `apps/frontend/src/lib/api/utils/auth/providers/idura.ts:102` — client assertion removed from token-exchange body (ASVS V2) | critical | mitigate | Same loop in 139-04 task 2, plus the six-file frontend vehicle re-run to its 52-test baseline. Verified: 52/52 at phase close, file identical to HEAD | closed |
| T-139-03 | Tampering | `packages/argument-condensation/src/api.ts:118-122` — `supportedLocales` allow-list check removed (ASVS V5) | medium | mitigate | Injected and reverted inside 139-02 task 1's first HYGIENE-LOOP iteration; scoped porcelain + marker grep asserted in `<verify>`. Verified: no diff | closed |
| T-139-04 | Spoofing | `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts:39-46` and `:29` — ID-token verification short-circuited, rejection reason replaced (ASVS V6) | high | mitigate | Two HYGIENE-LOOP iterations in 139-05 task 2, one live injection at a time; `git diff --exit-code` on the file. Verified: no diff; the file's 5 tests green at close | closed |
| T-139-05 | Tampering | The working tree across all fifteen injection windows (plans 01-05), reconciled at phase close (plan 07) | high | mitigate | Per-iteration `git checkout --` + three-part post-gate; `<precondition>` pre-gate on every injection task; plan 07 task 3 phase-level reconciliation pasted into § 9.3. **Verified independently:** `git diff --name-only <pre-phase>..HEAD` returns zero paths outside `.planning/` | closed |
| T-139-06 | Repudiation | `139-VERDICTS.md` — a verdict recorded without an executed run | medium | mitigate | Every `### 5.x` record carries a verbatim invocation (5.N.3) and verbatim runner output (5.N.4). Verified: all 15 records carry subsections .1–.6 | closed |
| T-139-07 | Tampering | `packages/dev-seed/src/supabaseAdminClient.ts` (select column list) and `templates/defaults/candidates-override.ts` (locale block size) | low | accept | Seed-data developer tooling; no production auth or data-exposure surface. Reverted in-task regardless; residual risk accepted (AR-01) | closed |
| T-139-08 | Information Disclosure | Runner output logs | low | mitigate | Logs written to `${TMPDIR:-/tmp}/gsd-139/`, outside the repository, so no log can be committed; the corpus contacts no network, Supabase or secret store. Verified: no `.log` path in the phase diff or working tree | closed |
| T-139-09 | Tampering | `packages/argument-condensation/src/core/utils/condensation/planValidation.ts:169` — an invariant's error message replaced | low | accept | No security control depends on the message; the `throw` itself preserved by design. Reverted in-task; residual risk accepted (AR-02) | closed |
| T-139-10 | Tampering | `packages/argument-condensation/src/core/condensation/condenser.ts:205` — condensation output emptied | low | accept | Developer-tooling package with no production consumer in this phase; reverted in-task; residual risk accepted (AR-03) | closed |
| T-139-11 | Repudiation | `139-VERDICTS.md` § 5.15 — a withdrawal produced by the rejected removal-injection | medium | mitigate | The rejected design is recorded in § 5.15.2 with its reason ("that red would withdraw a valid finding"); the accepted `+` line still contains a `throw new Error(` call. Verified both present | closed |
| T-139-12 | Tampering | `packages/data/src/objects/nominations/variants/variants.ts` — `parseNominationTree` returning `[]` or a wrong election id | medium | mitigate | `@openvaa/data` is frontend-consumed, so a survivor would silently break nomination parsing app-wide. Injected and reverted inside 139-03 task 2 with scoped porcelain + marker grep in `<verify>`. Verified: no diff | closed |
| T-139-13 | Tampering | `packages/question-info/src/core/infoGeneration.ts` — prompt question text emptied | low | accept | Experimental AI package, no production consumer wired into the app; reverted in-task; residual risk accepted (AR-04) | closed |
| T-139-14 | Repudiation | `139-VERDICTS.md` § 5.1 — an unrecorded injection substitution | medium | mitigate | § 5.1.2 carries the ⚠ "THIS IS A SUBSTITUTE, NOT THE AUDIT'S NAMED REGRESSION" callout, § 5.1.1 the verbatim un-injectability grep, plus the considered-and-not-used alternative; plan 06 lifted it into § 7 limit 2. Verified all three | closed |
| T-139-15 | Spoofing | A dev server or E2E run overlapping an authentication-injection window | high | mitigate | No `yarn dev`, `yarn test:e2e` or Playwright command permitted anywhere in the phase; every external surface `vi.mock`ed. Verified: § 9.4 statement 2 asserts no such run occurred; all observations came from in-package `npx vitest run` | closed |
| T-139-16 | Repudiation | `139-VERDICTS.md` §§ 5.7-5.9 — a withdrawal produced by reading the process exit code | high | mitigate | TWO-COLUMN RULE (§ 3.2) mandatory. Verified: § 4's table carries distinct **Assertion outcome** and **File outcome** columns, and rows 7-9 (F19a/b/c) each record `PASS (blind)` against `FAIL (red)` with the failing `file:line` — no merged outcome field | closed |
| T-139-17 | Information Disclosure / Error Handling | `apps/frontend/src/routes/api/oidc/authorize/+server.ts:22` — an input-validation 400 turned into a 500 (ASVS V5/V7) | medium | mitigate | Injected and reverted inside 139-05 task 1's first iteration; `git diff --exit-code` over the file asserted in `<verify>`. Verified: no diff | closed |
| T-139-18 | Tampering | `apps/frontend/src/lib/i18n/overrides.ts:36` — ICU fallback emptied | low | accept | Presentation-layer fallback with no security control attached; reverted in-task; residual risk accepted (AR-05) | closed |
| T-139-19 | Tampering | `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte` — injected effect loop in a rendered component | low | accept | No security surface; the risk is a wasted iteration, not a vulnerability; reverted in-task; residual risk accepted (AR-06) | closed |
| T-139-20 | Repudiation | `139-VERDICTS.md` § 5.5 — presenting F17's degenerate green run as a discriminating experiment | medium | mitigate | § 5.5.1 states the import-graph fact first and standing on its own; § 5.5.4 carries "**This run is CORROBORATION of § 5.5.1(a), not a discriminating experiment**"; § 4 row 5 reads "confirmed (on the import graph, not the run)". Verified | closed |
| T-139-21 | Tampering | `139-VERDICTS.md` § 4 — a merged, reordered or dropped verdict row | high | mitigate | Plan 06 task 1's ordering audit walked the fifteen rows against §§ 5.1-5.15 position by position. Verified: 15 rows, 15 `### 5.x` records, no `pending` row, and the verbatim enumeration sentence present | closed |
| T-139-22 | Repudiation | `139-VERDICTS.md` § 8 — a prediction silently corrected to match its observation | medium | mitigate | § 8.2 "Overturned predictions" exists and is mandatory; the standing rule records an overturned prediction **beside** the original rather than rewriting it. Verified: § 8.2 present with divergences listed (F15-C viz-test sub-prediction, F16 inj. A) | closed |
| T-139-23 | Information Disclosure | `139-VERDICTS.md` § 7 — a green injection read as a defect report about the shipped application | medium | mitigate | § 7 limit 1 states it explicitly ("proves the assertion blind, not the product broken") and cites § 2's environment stamp plus the per-record post-gates as the restoration evidence. Verified | closed |
| T-139-24 | Tampering | `.planning/ROADMAP.md` — a whole-file `Write` destroying phase blocks outside the Phase 142 edit window | high | mitigate | The `<action>` mandated scoped `Edit` calls and forbade `Write`. Verified: `### Phase ` heading count 14 before and 14 after the phase; diff is +34/-3 lines, confined to the edit window | closed |
| T-139-25 | Repudiation | `.planning/audits/2026-08-11-fake-guard-sweep.md` — a withdrawn finding deleted rather than annotated | medium | mitigate | Strike form non-destructive by construction (heading marker + appended blockquote). Verified: all six `### F15`…`### F20` headings still present. Note: the withdrawal set came out **empty** (15/15 confirmed), so no strike was applied — the mitigation held vacuously and by construction | closed |
| T-139-26 | Tampering | ASSERT-07's scope shrinking without a record | high | mitigate | § 6.2 names all **three** propagation targets (the audit file, `REQUIREMENTS.md`, and `.planning/ROADMAP.md` — the third being one criterion 4's wording omits) and records for each what was *done*: with an empty withdrawal set, "inspected, and deliberately left unchanged". Part D's reconciliation grep is pasted as closing evidence. Verified | closed |
| T-139-SC | Tampering | npm/pip/cargo installs (supply chain) | n/a | accept | No package-manager install ran in any of the seven plans; RESEARCH § Environment Availability recorded zero missing dependencies, and D-05 forbade even adding a `test:unit` script. Verified: zero changes to any `package.json` or lockfile across the phase range. No package-legitimacy gate required (AR-07) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-139-07 | Seed-data developer tooling (`dev-seed` select column list, locale block size). No production auth or data-exposure surface; reverted in-task | Phase 139 plan 01 threat model | 2026-08-14 |
| AR-02 | T-139-09 | `planValidation.ts:169` invariant *message* replaced, the `throw` itself preserved. No security control depends on the message string | Phase 139 plan 02 threat model | 2026-08-14 |
| AR-03 | T-139-10 | `condenser.ts:205` output emptied in a developer-tooling package with no production consumer in this phase | Phase 139 plan 02 threat model | 2026-08-14 |
| AR-04 | T-139-13 | `question-info` is an experimental AI package with no production consumer wired into the app | Phase 139 plan 03 threat model | 2026-08-14 |
| AR-05 | T-139-18 | `i18n/overrides.ts:36` is a presentation-layer ICU fallback with no security control attached | Phase 139 plan 05 threat model | 2026-08-14 |
| AR-06 | T-139-19 | An injected effect loop in `EntityListWithControls.svelte` has no security surface; worst case is a wasted iteration | Phase 139 plan 05 threat model | 2026-08-14 |
| AR-07 | T-139-SC | No package-manager install runs anywhere in Phase 139, so there is no supply-chain surface to gate | Phase 139 plans 01-07 threat models | 2026-08-14 |

*Accepted risks do not resurface in future audit runs.*

**All seven accepted risks share one property:** the accepted component was reverted inside the task
that injected it regardless of its `accept` disposition, so the acceptance covers only the residual
risk *during* the injection window — not a shipped condition. Nothing on this list is present in the
tree at phase close.

---

## Verification Evidence

Re-derived independently of the phase's own record, at HEAD `b042a19cb` on `feat-gsd-roadmap`:

```
$ git diff --name-only c69ba7ae..HEAD | grep -v '^\.planning/'
(no output; exit 1)

$ git diff --stat c69ba7ae..HEAD -- apps packages tests
(no output)

$ git status --porcelain -- apps tests packages
(no output)

$ grep -rn 'INJECTED (139)' apps packages tests
(no output; exit 1)
```

Twenty-eight files changed across the phase range, **all** under `.planning/`. The phase's own
close gate (`139-VERDICTS.md` § 9) additionally records all seven test vehicles returning their exact
pre-phase baselines — 113/113 passed, 0 failed, 0 skipped — which is what distinguishes a true revert
from a partial one that would still show an empty scoped diff at a different `file:line`.

The bare `git status --porcelain` is non-empty (`.vscode/settings.json`, `supabase/.temp/cli-latest`)
and is **not** the gate: both were dirty before Phase 139 began in this linked worktree and neither
was committed or touched by the phase. The scoped form over `apps`, `tests`, `packages` is the
load-bearing check.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-14 | 27 | 27 | 0 | /gsd-secure-phase (orchestrator, ASVS L1 grep-depth) |

**Audit method.** ASVS level 1 with `block_on: high`. The register was authored at plan time across
all seven plans, so this run **verified that the registered mitigations exist** rather than scanning
for new threats (retroactive-STRIDE mode not applicable). Per the L1 short-circuit, no
`gsd-security-auditor` subagent was spawned: `threats_open: 0` at classification,
`register_authored_at_plan_time: true`, and `asvs_level == 1` — grep-depth verification is sufficient
at this level. Raising `workflow.security_asvs_level` to 2 or 3 would force a deep auditor pass here.

**Coverage caveat, stated rather than implied.** The strongest evidence in this file (zero source diff
across the phase range) proves that **no injection survived**. It does not, and is not claimed to,
constitute a security review of the assertions Phase 139 verdicted or of the remediation Phases
140/141/142 will write. Those are separate surfaces owned by those phases.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-14
