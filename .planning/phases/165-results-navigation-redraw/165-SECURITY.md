---
phase: "165"
slug: "results-navigation-redraw"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-09-24"
---

# Phase 165 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register assembled from the `<threat_model>` blocks of 165-01..08 (165-05.1 carries none); SUMMARY threat flags: none raised.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| browser URL -> `(located)` universal load | `?next=` deferred target built from path + query | attacker-influenceable path/query text |
| browser URL -> results route params | `entityTab` / `entity` / `id` reach page components, `isOverlayNavigation`, the drawer derivation | attacker-supplied route segments |
| module scope -> SSR request | `drawerHostState.svelte.ts` holds a module-level `$state` singleton shared across server requests | drawer payload (entity/question content + opener contexts) |
| questions route subtree -> root-layout host | hosted payload rendered outside its creating tree via `ContextBridge` | opener's Svelte context map |
| test harness -> served application | E2E runs must hit this checkout, scoped to the seeded project | test evidence integrity |
| working tree -> committed history | negative controls inject regressions then restore | product source |
| repository -> future branches | spike scaffolding could re-arrive via merge | lab code |
| planning docs / CLAUDE.md -> future agents | counters and invariants read by every later run | project record |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-165-01 | Tampering | `?next=` open-redirect allowlist, `(located)/+layout.ts` | high | mitigate | Allowlist regex and `nextKv` construction identical to base `4d023c587` (only the variable source moved into `untrack`); comment at line 42 names the threat | closed |
| T-165-02 | Tampering / Info disclosure | attacker-supplied route segment | medium | mitigate | `etPl`/`etSg` matchers still on `[[entityTab=etPl]]`/`[[entity=etSg]]`; leaf matcher-fallthrough 404 pinned by `page.guards.test.ts` (8/8 green 2026-09-24) | closed |
| T-165-03 | DoS (self-inflicted) | navigation loop from force-filled params | medium | mitigate | No redirect added; leaf `+page.ts` byte-identical to base (VERIFICATION criterion 4); 307 target asserted free of force-filled plural in `page.guards.test.ts` | closed |
| T-165-04 | Info disclosure | module-level singleton, `drawerHostState.svelte.ts` | high | mitigate | `if (!browser) return;` is the first statement of `open()`; no write to `drawerHost.current` outside the class (grep, 2026-09-24) | closed |
| T-165-05 | Tampering | branch base selection (D-01) | medium | mitigate | `git merge-base --is-ancestor`: base `4d023c587` IS an ancestor of HEAD; `spike/results-redraw` is NOT | closed |
| T-165-06 | Info disclosure | 165-01 cold SSR probe | low | accept | Unauthenticated local request; no credential captured | closed (accepted) |
| T-165-07 | Spoofing | E2E run against a foreign / wrongly-scoped server | medium | mitigate | `tests/scripts/e2e-run.sh` spawns and owns its server (exit 5 on occupied port) and exits 6 on missing preflight success line; G-7/G-8/G-9 record `preflight successes 1` | closed |
| T-165-08 | Info disclosure | re-homed statistics route (D-25) | low | mitigate | `results/statistics/+page.svelte` stays inside the `(located)` voter group; no gate added or removed | closed |
| T-165-09 | Info disclosure | contexts re-provided around hosted payload | medium | mitigate | `ContextBridge` re-provides only `payload.contexts` (the opener's own `getAllContexts()`), bridge re-mounted per payload via `{#key shown.key}` in `DrawerHost.svelte` | closed |
| T-165-10 | Tampering | injected regression surviving a negative control | high | mitigate | `git status --porcelain` empty; `git diff --name-only 9536af4e7..HEAD -- apps packages tests` empty; unit guards 23/23 green on restored tree | closed |
| T-165-11 | Tampering | lab scaffolding arriving via future merge | medium | mitigate | `apps/frontend/src/lib/_guards/spike-scaffolding.test.ts` (5/5 green; NC-3 observed it failing on four injections) | closed |
| T-165-12 | Repudiation | a green gate that measured nothing | medium | mitigate | `165-NEGATIVE-CONTROL.md` § 18: every gate row carries exit code, full counts, `Cached: 0 cached` | closed |
| T-165-13 | Tampering | visual baseline blessed without explanation | low | mitigate | G-9 produced no differing baseline; nothing re-captured; operator confirmed in UAT test 10 | closed |
| T-165-14 | Repudiation | half-applied counter edit | medium | mitigate | 165-08 commit `cfa15cfc1` couples REQUIREMENTS/STATE/ROADMAP; counters re-derived, recorded in commit message | closed |
| T-165-15 | Tampering | stale invariant in CLAUDE.md | low | mitigate | CLAUDE.md § Results Navigation Invariants names `viewTransition.ts` and `layout.tracking.test.ts` as the implementing/guarding files | closed |
| T-165-SC | Tampering | npm/pip/cargo installs | low | accept | No package installed in any plan (`165-RESEARCH.md` Package Legitimacy Audit) | closed (accepted) |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-165-01 | T-165-06 | Probe is one unauthenticated request to a local dev server reading only a status code and local log | 165-01 plan threat model | 2026-09-23 |
| AR-165-02 | T-165-SC | No external package installed in this phase; no registry surface | 165-01..08 plan threat models | 2026-09-23 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-24 | 16 | 16 | 0 | /gsd-secure-phase 165 (orchestrator, ASVS L1 grep-depth; auditor not spawned per short-circuit rule) |

## Security Audit 2026-09-24

| Metric | Count |
|--------|-------|
| Threats found | 16 |
| Closed | 16 |
| Open | 0 |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-24
