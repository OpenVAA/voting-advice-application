# Phase 87: v2.10 All-Green Milestone-Close Anchor - Research

**Researched:** 2026-05-15
**Domain:** Milestone-close infrastructure verification (Playwright 3-run cold-start gate + atomic constants regen + audit-milestone handshake)
**Confidence:** HIGH (all decisions verified against committed Phase 79/83/84/85/86 source artifacts; no library APIs in scope)

## Summary

Phase 87 is a pure milestone-close verification phase that mirrors Phase 79 Plan 03's long-running 3-run cold-start gate pattern, refined by the Phase 84/85/86 atomic-regen-bundle cadence. No new code is in scope — only (a) capturing a fresh 3-run cold-start anchor against the post-86 codebase, (b) editing the archived `regen-constants.mjs` reportPath in-place + updating 5 constants in `tests/scripts/diff-playwright-reports.ts`, (c) writing a comprehensive SUMMARY documenting the v2.10 all-green achievement + v2.11+ deferrals, and (d) invoking `/gsd-audit-milestone v2.10` for shippable sign-off.

The critical research findings are: (1) the regen pipeline is well-grooved — Phase 79 → 84 → 85 → 86 each followed the same atomic-commit shape; (2) the SHA-identity gate already has a script (`sha-identity.mjs` in Phase 79 + `sha-identity-runner.mjs` in Phase 86) that Phase 87 can fork in-place; (3) Phase 86 closed with PASSED-WITH-DEFERRAL — the party-drawer boundary flake is the inherited deferral that may surface again under Phase 87's strict-identity gate per CONTEXT D-02; (4) the audit-milestone skill is a milestone-level orchestrator that reads all phase VERIFICATION.md files + integration-checker output to produce `.planning/v2.10-MILESTONE-AUDIT.md` with status `passed | gaps_found | tech_debt`; (5) CONTEXT D-04 names the constants imprecisely (`CASCADE_BASELINE_TESTS`, `FAILURE-CLASS_TESTS`) — the actual code constants are `PASS_LOCKED_TESTS`, `DATA_RACE_TESTS`, `CASCADE_TESTS`, `SKIPPED_TESTS` (no FAILURE-CLASS const; FAILURE-CLASS is narrative-only in the jsdoc header).

**Primary recommendation:** Plan 87 as a single 4-task plan matching Phase 86 Plan 04's shape almost verbatim, with explicit task-level entry conditions for the audit-milestone handshake and explicit escalation criteria for SHA-identity failure (D-02 = escalate, no D-09 fallback).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 — Single PLAN.md.** Phase 87 is pure infrastructure execution (3-run gate + regen + audit-milestone). Mirrors Phase 79 P03 long-running unattended-execution structure. Plan tasks (planner refines):
  1. Fresh 3-run cold-start gate via archived `regen-constants.mjs` (1-run prep capture + 3-run identity gate). ~216 min wall time.
  2. Atomic constants regen commit (jsdoc + arrays + anchor SHA + IMGPROXY_TIED_TITLES + DATA_RACE_TESTS + CASCADE_BASELINE_TESTS).
  3. Phase 87 SUMMARY documenting all-green achievement + v2.11+ deferrals.
  4. `/gsd-audit-milestone v2.10` invocation + close on shippable status.

- **D-02 — Strict SHA-identity gate, no D-09 fallback.** Per roadmap SC #1: "Fresh 3-run cold-start gate SHA-identical FIRST attempt against the post-84+85+86 codebase." If the first attempt fails SHA-identity, the gate is RE-RUN (per Phase 79 D-09 instability protocol) and the failing run is investigated. If repeated failure: ESCALATE — Phase 87 is the ship-blocker. A non-SHA-identical first-try indicates a residual non-determinism that Phases 84-86 should have fixed; treat as Phase-84/85/86 reopen, not Phase-87 carry-forward.

- **D-03 — Gate execution: agent-inline via Bash run_in_background.** Per Phase 79 D-11 + Phase 83/84/85/86 precedent. ~216 min unattended (1 prep run + 3 identity runs).

- **D-04 — Atomic regen commit covers ALL classification arrays + jsdoc + anchor SHA.** Single commit per Phase 79 D-10 precedent. Files touched (planner verifies):
  - `tests/scripts/diff-playwright-reports.ts` — jsdoc count update (`94` → `~155-160`), PASS_LOCKED_TESTS (in alphabetical order), DATA_RACE_TESTS (3 IDs), CASCADE_TESTS (0 or ≤5), FAILURE-CLASS narrative block (removed or ≤2 residual entries), SKIPPED_TESTS if Phase 86 introduced this const.
  - `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` — IMGPROXY_TIED_TITLES (3 titles, Phase 84-renegotiated), CASCADE_BASELINE_TESTS (Phase 85-shrunken), any SKIPPED constants. Match-count assertion gates verified post-edit.
  - `.planning/phases/87-…/post-fix/run-{1,2,3}.json` — 3-run captures archived.
  - `.planning/phases/87-…/post-fix/sha256.txt` — SHA-identity record (per Phase 79 D-12 precedent).

- **D-05 — Anchor target verification.** Planner verifies post-gate that the actual anchor matches target:
  - PASS_LOCKED: ~150-160 (range, planner accepts within).
  - DATA_RACE: exactly 3 (Phase 84 binding contract).
  - CASCADE: 0 (or ≤5 if Phase 85 left explicit deferrals).
  - FAILURE-CLASS: 0 (or ≤2 if Phase 86 left explicit skips).
  Any deviation (e.g., DATA_RACE = 4 = new imgproxy-tie surfaced) triggers Phase-84-reopen, not Phase-87 carry-forward.

- **D-06 — `/gsd-audit-milestone v2.10` invocation.** Runs after the regen commit lands. Per memory `feedback_e2e_did_not_run.md`: "did not run" tests count as failures. Phase 87 SC #4 audit MUST pass — if it surfaces residual "did not run" cells from Phases 84-86, those phases reopen, not Phase 87 carry-forward.

- **D-07 — v2.10 milestone shippable status criteria.** Phase 87 closes with `shippable` verdict iff:
  - 3-run gate SHA-identical (D-02).
  - Anchor target met within tolerance (D-05).
  - `/gsd-audit-milestone v2.10` clean (D-06).
  - No new v2.10 requirements surfaced during Phase 87 execution.
  Any deviation → ship-blocker, escalate to operator.

- **D-08 — No new feature work in Phase 87.** Pure milestone-close phase. If during 3-run gate a NEW bug surfaces (not in Phase 84/85/86 scope), file as v2.11+ todo, do NOT pre-fix in Phase 87.

- **D-09 — No DATA_RACE pool growth.** Per Phase 73 D-09 binding (Phase 84-renegotiated to 3 titles). Phase 87's gate validates that the 3-test list is the binding contract for v2.10 ship.

### Claude's Discretion

- Planner picks the precise 3-run gate invocation (full-suite vs scoped to affected projects). RECOMMENDATION: full-suite, since the all-green claim requires whole-suite verification.
- Planner picks whether `regen-constants.mjs` warrants a Phase-87 fork (vs in-place edit). RECOMMENDATION: in-place edit per Phase 84 D-05 precedent.
- Planner picks the `/gsd-audit-milestone v2.10` invocation timing (before vs after regen commit). RECOMMENDATION: after regen commit, since the audit reads the post-Phase-87 anchor.
- Phase 87 SUMMARY writing style (terse vs comprehensive). RECOMMENDATION: comprehensive — this is the v2.10 milestone-close artifact that v2.11 planning will reference.

### Deferred Ideas (OUT OF SCOPE)

- **v2.11 milestone planning** — runs after Phase 87 close + `/gsd-complete-milestone v2.10`. Out of v2.10 scope.
- **Parity-script architectural refactor** — if Phase 87 surfaces that the regen-constants.mjs pattern is hard to maintain (e.g., 5+ classification arrays + match-count assertions), a v2.11+ project could refactor into a cleaner classification engine. Out of v2.10 scope.
- **Cold-start determinism tooling improvements** — if Phase 87's 3-run gate surfaces irreducible timing flake, a v2.11+ project could investigate Playwright's `expect.toPass` polling or similar. Out of v2.10 scope.
- **`SKIPPED_TESTS` const promotion** — if Phase 86 introduced this const (per Phase 86 D-05), Phase 87 standardizes it as a permanent classification axis. v2.11+ may rename / restructure.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DETERM-15 | Final v2.10-ship anchor captured. Fresh 3-run cold-start gate SHA-identical FIRST attempt against the post-84+85+86 codebase. Pool sizes: ~150-160 PASS_LOCKED + ≤3 DATA_RACE + 0 CASCADE + ≤2 FAILURE-CLASS (residual = explicit v2.11+ deferrals). Anchor SHA committed to `tests/scripts/diff-playwright-reports.ts` jsdoc. `/gsd-audit-milestone v2.10` runs cleanly; status = shippable. | Research §1 (3-run gate shape — D-13 canonical chain), §2 (regen-constants.mjs in-place edit + match-count assertions), §3 (atomic-commit boundary), §4 (audit-milestone skill invocation shape), §5 (did-not-run treatment), §6 (anchor target tolerance + D-05 escalation), §7 (SKIPPED_TESTS — already introduced in Phase 86), §8 (SUMMARY shape) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

| Directive | Phase 87 Impact |
|-----------|-----------------|
| **Likert-only canonical reset chain** (CLAUDE.md §"Seeding local data"): `yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean` | This is the EXACT chain Phase 79 D-13, Phase 84, 85, 86 used for 3-run cold-start gates. Phase 87 MUST use this verbatim. |
| **`db:*` over `dev:*` aliases** (CLAUDE.md "Deprecated aliases" — emits `[deprecated]` warning on stderr) | Phase 87 commands use `db:reset` / `db:seed` / `db:status` — never `dev:start` / `dev:reset` etc. |
| **No commits to .env / secrets** | N/A for Phase 87 (no .env touches). |
| **Yarn arg-forwarding caveat** (CLAUDE.md §"Yarn arg-forwarding caveat"): `yarn db:reset-with-data --likert-only` does NOT forward; canonical manual chain is required | Phase 87 MUST use the 3-step `&&` chain, NOT the `db:reset-with-data` alias. |
| **No emojis in committed code** (general project hygiene; SUMMARY narrative may use a few but be conservative) | Phase 87 SUMMARY is comprehensive but emoji-light. |
| **TypeScript strict; avoid `any`** | N/A for Phase 87 (no TS edits beyond the typed `ReadonlyArray<string>` constants). |

## Standard Stack

### Core (already installed)
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Playwright | per `tests/package.json` (existing) | E2E suite runner; produces JSON reporter output captured into run-N.json | Phase 79 → 86 chain — every cold-start gate uses `yarn test:e2e --workers=1 --reporter=json` |
| Node.js `crypto.createHash` | built-in | SHA-256 identity computation over normalized partition | Phase 79 `sha-identity.mjs` + Phase 86 `sha-identity-runner.mjs` precedent |
| Supabase CLI | per `apps/supabase/` | Local Postgres + Storage + Edge Functions backend for each cold-start | CLAUDE.md §"Development Environment" + Phase 79 D-13 protocol |
| `@openvaa/dev-seed` `--likert-only` | shipped in v2.9 Phase 78 (CLEAN-05) | Restricts opinion questions to singleChoiceOrdinal — voter-fixture compatibility | CLAUDE.md §"Seeding local data" + Phase 79 D-13 |
| `yarn workspace @openvaa/frontend dev` | SvelteKit + Vite | Dev server for cold-start test execution (port 5173) | Phase 79 D-13 step 2 |

### Supporting (in-tree, not external)
| File | Purpose | When to Use |
|------|---------|-------------|
| `.planning/phases/79-…/post-fix/regen-constants.mjs` | Reads `run-3.json` → partitions tests into PASS_LOCKED / DATA_RACE / CASCADE; emits paste-ready arrays. **CANONICAL — Phase 87 edits this in-place per D-04.** | Phase 87 Task 2 (atomic regen). |
| `.planning/phases/79-…/post-fix/sha-identity.mjs` | 3-run SHA-256 identity gate (loads run-{1,2,3}.json; normalizes via `categorizeStatus`; sorted-line hash). | Phase 87 Task 1 (after 3-run capture). Fork to Phase 87 dir as `sha-identity.mjs` per Phase 86 precedent. |
| `.planning/phases/86-…/post-fix/sha-identity-runner.mjs` | Phase 86 variant that supports "if last 2 match, mark pass" operator-authorized shortcut. **Phase 87 D-02 says NO such shortcut — use the strict Phase 79 sha-identity.mjs shape instead.** | Reference only. |
| `tests/scripts/diff-playwright-reports.ts` | Holds 4 const arrays + jsdoc anchor narrative. **CANONICAL — Phase 87 edits this in-place per D-04.** | Phase 87 Task 2. |

### Alternatives Considered (and rejected)
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| In-place edit of `regen-constants.mjs` | Phase-87 fork into `.planning/phases/87-…/post-fix/regen-constants.mjs` | REJECTED per CONTEXT Claude's-Discretion RECOMMENDATION — Phase 84 D-05 + Phase 85 D-05 + Phase 86 Plan 04 all in-place edited; consistency wins. |
| Strict 3-run identity gate | Phase 86's "if last 2 match, accept" shortcut | REJECTED per CONTEXT D-02 — Phase 87 is the ship-blocker; any first-attempt SHA failure escalates, not absorbs. |
| Scoped (project-filtered) test run | `--project=voter-app,candidate-app,...` | REJECTED per CONTEXT Claude's-Discretion — full-suite required for all-green claim. |
| `/gsd-audit-milestone v2.10` before regen | Reverse-order invocation | REJECTED per CONTEXT Claude's-Discretion — audit reads anchor, anchor must exist first. |

**Installation:** No new dependencies. All tools are already present.

**Version verification:** N/A — Phase 87 uses existing internal scripts, not external packages.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Phase 87 Plan 04 (mirrors Phase 86 Plan 04 + Phase 79 P03 cadence)       │
└─────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────┐
  │ Task 1: 3-run cold-    │ ──────► 1× prep run (validates env health) +
  │ start gate via         │         3× identity-gate runs (strict SHA)
  │ Bash(run_in_background)│
  └────────────────────────┘
                │
                ▼
  ┌────────────────────────┐
  │ Per-run protocol       │  ◄──── CLAUDE.md canonical Likert-only chain
  │ (D-13 verbatim):       │        + supabase status check + vite kill
  │ 1. yarn db:reset       │
  │ 2. yarn db:seed        │
  │    --template e2e      │
  │    --likert-only       │
  │ 3. yarn dev:clean      │
  │ 4. nohup vite &        │
  │ 5. wait :5173          │
  │ 6. yarn test:e2e       │
  │    --workers=1         │
  │    --reporter=json     │
  │    > run-N.json        │
  │ 7. kill vite           │
  └────────────────────────┘
                │
                ▼ run-1.json run-2.json run-3.json
  ┌────────────────────────┐
  │ SHA-identity check via │ ──────► sha256.txt with run-1/2/3 hashes
  │ Phase 79 sha-identity  │         + verdict (PASS strict / FAIL)
  │ .mjs (forked in-place) │         + diff if FAIL
  └────────────────────────┘
                │
       ┌────────┴────────┐
       │                 │
   PASS strict        FAIL
       │                 │
       │                 └──► D-02 escalation: investigate, RE-RUN +3,
       │                       if repeated FAIL → ship-blocker, ESCALATE.
       │                       (NOT a Phase 87 carry-forward — re-open 84/85/86)
       ▼
  ┌────────────────────────┐
  │ Task 2: Atomic regen   │ ──────► single git commit (D-04):
  │ commit                 │           - regen-constants.mjs:34 reportPath
  └────────────────────────┘             repointed to Phase 87
                │                       - diff-playwright-reports.ts jsdoc + 4 arrays
                │                       - post-fix/run-{1,2,3}.json archived
                ▼                       - post-fix/sha256.txt archived
  ┌────────────────────────┐             - post-fix/regen-output.txt archived
  │ Anchor target check    │
  │ (D-05 tolerance):      │
  │ - PL ~150-160          │
  │ - DR exactly 3         │
  │ - CASCADE 0 or ≤5      │
  │ - FAILURE-CLASS 0|≤2   │
  └────────────────────────┘
                │
                ▼
  ┌────────────────────────┐
  │ Task 3: SUMMARY        │ ──────► .planning/phases/87-…/87-04-SUMMARY.md
  │ (comprehensive per     │         (per Phase 84/85/86 frontmatter shape +
  │ Claude's Discretion    │          narrative cross-references)
  │ RECOMMENDATION)        │
  └────────────────────────┘
                │
                ▼
  ┌────────────────────────┐
  │ Task 4: /gsd-audit-    │ ──────► .planning/v2.10-MILESTONE-AUDIT.md
  │ milestone v2.10        │         + verdict (passed | gaps_found | tech_debt)
  │ invocation             │
  └────────────────────────┘
                │
       ┌────────┴────────┐
       │                 │
    passed           gaps_found / tech_debt
       │                 │
       │                 └──► D-07 ship-blocker: escalate to operator;
       │                       Phase 87 does NOT close clean.
       ▼
  v2.10 SHIPPABLE — operator runs /gsd-complete-milestone v2.10
```

### Recommended Project Structure
```
.planning/phases/87-v2-10-all-green-milestone-close-anchor-capture-a-fresh-3-run/
├── 87-CONTEXT.md                    # already exists (locked decisions D-01..D-09)
├── 87-RESEARCH.md                   # THIS FILE
├── 87-VALIDATION.md                 # planner produces (Nyquist mapping if applicable)
├── 87-01-PLAN.md                    # single plan covering 4 tasks per D-01
├── 87-01-SUMMARY.md                 # comprehensive milestone-close narrative per D-07
├── 87-VERIFICATION.md               # produced by gsd-verifier
└── post-fix/
    ├── run-1.json                   # 3-run cold-start capture #1
    ├── run-2.json                   # 3-run cold-start capture #2
    ├── run-3.json                   # 3-run cold-start capture #3
    ├── run-{1,2,3}-stderr.log       # per-run stderr (mostly dotenv banner)
    ├── run-{1,2,3}.sha256           # individual run SHA files (Phase 84-86 precedent)
    ├── sha-identity.mjs             # FORKED VERBATIM from Phase 79 sha-identity.mjs
    │                                # (NOT Phase 86's runner — D-02 strict, no shortcut)
    ├── sha256.txt                   # 3-run verdict (PASS strict / FAIL with diff)
    ├── regen-output.txt             # raw 3-array output from regen-constants.mjs
    └── (optional) smoke.json,       # IF the planner adds a 1-run prep capture
        smoke-output.txt,            # (Phase 79 run-0 / Phase 84 smoke pattern)
        smoke-commands.txt           # audit trail for canonical chain
```

### Pattern 1: 3-Run Cold-Start Gate (D-13 protocol, verbatim from Phase 79 CONTEXT)
**What:** Three back-to-back cold-start full-suite Playwright runs, each starting from a freshly-reset Supabase + seed + Vite cache wipe.
**When to use:** Phase 87 Task 1.
**Example (per-run, canonical):**
```bash
# Source: CLAUDE.md "Common Workflows §Seeding local data" + Phase 79 D-13 + Phase 85 smoke-commands.txt
# (Step 1: canonical Likert-only reset chain — yarn arg-forwarding caveat MUST be honored)
cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean

# (Step 2: start Vite in background — must run AFTER dev:clean wipes .svelte-kit)
nohup yarn workspace @openvaa/frontend dev > /tmp/vite-dev-87-run-N.log 2>&1 &

# (Step 3: wait for Vite ready)
until curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ | grep -q "200"; do sleep 5; done

# (Step 4: capture full-suite JSON reporter output)
yarn test:e2e --workers=1 --reporter=json \
  > .planning/phases/87-v2-10-all-green-milestone-close-anchor-capture-a-fresh-3-run/post-fix/run-N.json \
  2> .planning/phases/87-v2-10-all-green-milestone-close-anchor-capture-a-fresh-3-run/post-fix/run-N-stderr.log

# (Step 5: kill Vite, preserve Supabase between runs unless 502 — Phase 79 D-14)
pkill -f "yarn workspace @openvaa/frontend dev" || true
```

### Pattern 2: SHA-256 Identity Computation (D-08 + sha-identity.mjs)
**What:** Hash a normalized partition of (test_id, status) pairs sorted lexicographically. Status normalised via `categorizeStatus` to {pass, cascade, fail} so timing-only jitter doesn't break the gate.
**When to use:** Phase 87 Task 1 (post-3-run capture).
**Example (verbatim from `.planning/phases/79-…/post-fix/sha-identity.mjs`):**
```javascript
// Source: .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/sha-identity.mjs
// Phase 87 forks this verbatim to .planning/phases/87-…/post-fix/sha-identity.mjs
// (NOT the Phase 86 sha-identity-runner.mjs which has the run-1-invalid shortcut — D-02 strict)

function categorizeStatus(raw, err) {
  if (raw === 'passed') return 'pass';
  if (raw === 'skipped') return 'cascade';
  if (/did not run|setup.*failed|dependency.*failed/i.test(err)) return 'cascade';
  return 'fail';
}

function hashRun(path) {
  const rep = JSON.parse(readFileSync(path, 'utf8'));
  const lines = flattenReport(rep);  // produces "<projectName> :: <specFile> > <specTitle>|<status>"
  lines.sort();
  const body = lines.join('\n') + '\n';
  return createHash('sha256').update(body).digest('hex');
}

const runs = ['run-1.json', 'run-2.json', 'run-3.json'].map(hashRun);
const allMatch = runs[0] === runs[1] && runs[1] === runs[2];
```

### Pattern 3: Atomic Regen Bundle (Phase 84 D-06 + Phase 86 Plan 04 precedent)
**What:** Single git commit bundles ALL of: regen script edits + regen output + diff-playwright-reports.ts arrays + 3-run captures + sha256.txt.
**When to use:** Phase 87 Task 2.
**Why:** Reverting the anchor reverts everything consistent; partial-revert would corrupt parity-gate semantics.

### Anti-Patterns to Avoid
- **DO NOT use `yarn db:reset-with-data --likert-only`:** the `--likert-only` flag forwards to `yarn dev:clean` (last in `&&`-chain), not to `yarn db:seed`. CLAUDE.md "Yarn arg-forwarding caveat" + Phase 85 smoke-commands.txt audit trail.
- **DO NOT fork the regen script:** Phase 84 D-05 set in-place edit precedent; Phase 85, 86 followed. Forks fragment the canonical path semantics.
- **DO NOT use Phase 86's `sha-identity-runner.mjs` template:** it has an operator-authorized "if last 2 match, accept" shortcut that violates Phase 87 D-02 (strict no-fallback).
- **DO NOT pre-fix bugs surfaced during the 3-run gate** (D-08): file as v2.11+ todo. Phase 87 is verification-only.
- **DO NOT split the regen commit:** Phase 79 D-10 + Phase 84 D-06 atomic — bundling preserves revert semantics.
- **DO NOT start Vite BEFORE `yarn dev:clean`:** Phase 85 smoke-commands.txt §"ABORTED FIRST ATTEMPT" documented this — `dev:clean` wipes `apps/frontend/.svelte-kit/generated/`, breaking already-running Vite SSR (500s on every request).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Compute identity hash across runs | Custom hashing logic | `.planning/phases/79-…/post-fix/sha-identity.mjs` (fork verbatim) | Phase 79 D-08 normalisation via `categorizeStatus` handles flaky/timedOut variance; rolling your own re-discovers the bugs Phase 79 already solved. |
| Partition tests into PASS_LOCKED / DATA_RACE / CASCADE | Custom partition logic | `regen-constants.mjs` (in-place edit) | Match-count assertion gate at lines 102-115 catches IMGPROXY_TIED_TITLES drift loudly; rolling your own loses this guardrail. |
| Compute milestone audit verdict | Custom audit script | `/gsd-audit-milestone v2.10` skill | Cross-references 3 sources (VERIFICATION.md status, SUMMARY frontmatter requirements_completed, REQUIREMENTS.md traceability) — manual aggregation guarantees drift. |
| Detect "did not run" tests | Custom regex sweep | Already handled by `categorizeStatus` (returns 'cascade' for skipped) | Phase 79 D-08 normalisation already maps skipped → cascade. |
| Verify ROADMAP + STATE updates | Manual checklist | git diff post-commit + the planner's verify gate | Established precedent — Phase 86 Plan 04 D-spec verification table is the cross-check shape. |

**Key insight:** Phase 87 is the 4th time this exact gate has run (Phase 79 P03 → 84 P01 → 85 P02 → 86 P04). Every script, every command, every commit shape is precedented. Phase 87's planner should index the precedent, not re-derive.

## Common Pitfalls

### Pitfall 1: Party-Drawer Boundary Flake Resurfaces (HIGH probability)
**What goes wrong:** The single non-deterministic cell `voter-app :: specs/voter/voter-detail.spec.ts > should open party detail drawer with info, candidates, and opinions tabs` flakes in 1 of 3 runs, breaking strict SHA-identity.
**Why it happens:** Phase 83 DETERM-07b promoted it to PASS_LOCKED via a hydration-completeness guard. Phase 84 run-2 flaked it. Phase 85 run-3 flaked it. Phase 86 run-3 (vs run-2) flaked it. Phase 86 Plan 01 Task 5 (`expect.poll`) hardening REDUCED but did NOT eliminate the boundary classification. The Plan 86 04-SUMMARY explicitly says: "Phase 87 entry condition is 'fresh 3-run cold-start gate SHA-identical FIRST attempt.' Phase 86 closes with PASSED-WITH-DEFERRAL on this contract; the residual party-drawer boundary flake is the explicit v2.11+ deferral. **Phase 87 inherits the deferral unless it resolves the boundary flake as part of Phase 87 scope.**" Combined with CONTEXT D-08 ("No new feature work"), Phase 87 CANNOT fix this — it must escalate.
**How to avoid:** Apply CONTEXT D-02 + D-05 escalation criteria explicitly. If party-drawer flakes in any run: (a) record the diff in sha256.txt with full transparency, (b) re-run +3 per D-09-style protocol, (c) if it flakes again, escalate to operator with a "Phase 86-reopen" recommendation (NOT Phase 87 carry-forward; NOT a SKIPPED_TESTS migration without operator sign-off). The party-drawer todo at `.planning/todos/pending/2026-05-14-party-drawer-boundary-flake-residual.md` is the v2.11+ home if operator agrees.
**Warning signs:** sha256.txt `run-N` vs `run-(N+1)` diff shows exactly one line: `voter-app :: specs/voter/voter-detail.spec.ts > should open party detail drawer ...|fail` ↔ `...|pass`.

### Pitfall 2: SKIPPED_TESTS Const Name Drift (MEDIUM probability)
**What goes wrong:** CONTEXT D-04 references `CASCADE_BASELINE_TESTS` and `FAILURE-CLASS_TESTS` — neither exists in the actual code. The real constants are `PASS_LOCKED_TESTS`, `DATA_RACE_TESTS`, `CASCADE_TESTS`, `SKIPPED_TESTS` (Phase 86-introduced). FAILURE-CLASS is documented only in the jsdoc narrative block, with NO const backing.
**Why it happens:** CONTEXT was authored before Phase 86 close; the planner naturally inferred const names from prose.
**How to avoid:** Plan 87 must use the actual code-level names. Verify against `tests/scripts/diff-playwright-reports.ts:93, 210, 217, 261` (4 const declarations). The FAILURE-CLASS "narrative block" lives at lines 44-90 (jsdoc header) — Phase 87 shrinks or rewrites this narrative; does NOT add a FAILURE-CLASS_TESTS const unless operator asks.
**Warning signs:** Planner writes paste-ready code referencing a non-existent const; grep `CASCADE_BASELINE_TESTS\|FAILURE_CLASS_TESTS` in repo returns 0 results.

### Pitfall 3: Vite-After-Cold-Reset Ordering Mistake (LOW probability — well-documented)
**What goes wrong:** Vite started BEFORE `yarn dev:clean` runs; `dev:clean` wipes `apps/frontend/.svelte-kit/generated/`; Vite's in-memory SSR module cache references a now-deleted file; every HTTP request returns 500.
**Why it happens:** First-time operators not aware of Phase 85's documented LANDMINE-1.
**How to avoid:** The canonical sequence (Phase 79 D-13 + Phase 85 smoke-commands.txt §"CORRECTED SEQUENCE") is: (1) full reset chain INCLUDING dev:clean, THEN (2) start Vite, THEN (3) wait for 200, THEN (4) run tests. Plan 87 tasks must encode this ordering explicitly.
**Warning signs:** Vite log shows `Failed to load url /.svelte-kit/generated/server/internal.js`; Playwright reporter shows 100% test failures; smoke.json has 0 bytes (JSON reporter only flushes at end).

### Pitfall 4: Long-Running `Bash(run_in_background)` from a Subagent (MEDIUM probability)
**What goes wrong:** A subagent dispatches `yarn test:e2e ... &` (background); subagent terminates ~2 min later as part of its session lifecycle; the background bash is orphaned; run-N.json is never written.
**Why it happens:** Phase 79 P03 SUMMARY §"Orchestrator takeover" documented exactly this — original P03 subagent dispatched run-1 in background and terminated. Background-task lifetime is robust only at the orchestrator level.
**How to avoid:** Per Phase 79 SUMMARY: "Long-running (>10 min) `Bash(run_in_background=true)` should be dispatched at the **orchestrator level** for any phase where total wall-time > a single subagent's effective lifetime. Subagent termination kills its child processes." Plan 87 explicitly notes this — the executor (orchestrator OR an executor agent with extended lifetime) MUST run the gate directly, NOT delegate to a short-lived subagent. The Phase 86 Plan 04 D-07 deviation note documents that the autonomous executor stalled on nohup vite background and the operator ran the runs manually instead. Phase 87 should plan for this contingency.
**Warning signs:** Subagent reports "started background job" then terminates; orchestrator finds Supabase stopped + run-N.json missing.

### Pitfall 5: imgproxy 502 During Pre-Test Reset (KNOWN — Phase 73 Pitfall 5 carry-forward)
**What goes wrong:** Local imgproxy Docker container 502s on the `yarn db:reset` container-restart phase; subsequent test execution still works, but the cold-start chain throws early.
**Why it happens:** Documented infrastructure flake; not a code bug. Per Phase 85 sha256.txt §"IMGPROXY 502 RECOVERY (TRANSPARENCY)" — every Phase 85 cold-start run hit 1 × 502 during reset, recovered via `supabase stop && supabase start`.
**How to avoid:** Per Phase 79 D-14: on 502 detection, `supabase stop && supabase start && yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean`, then re-capture into the SAME `run-N.json` (overwrite). Cap: up to 2 retries per run; escalate if 3+ retries.
**Warning signs:** `db:reset` stderr contains `502 Bad Gateway` from imgproxy port; subsequent test execution may still succeed (imgproxy 502 is pre-test infrastructure only — runtime imgproxy is image-intrinsic per DATA_RACE pool).

## Runtime State Inventory

> Phase 87 is a verification-only phase — no rename / refactor / migration. Runtime state inventory NOT APPLICABLE. The only "state" Phase 87 produces is:
> - 3 new JSON files in `.planning/phases/87-…/post-fix/` (no DB schema, no env vars, no service config)
> - In-place edits to 2 existing files (regen-constants.mjs reportPath line + diff-playwright-reports.ts constants)
> - 1 new MILESTONE-AUDIT.md file at `.planning/v2.10-MILESTONE-AUDIT.md`

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Yarn 4 | All commands | ✓ (verified in CLAUDE.md) | per `.yarnrc.yml` | — |
| Supabase CLI | `yarn db:reset` / `yarn db:seed` | ✓ (verified by Phase 86 successful run) | per `apps/supabase/` | — |
| Docker | Supabase containers | ✓ (operator-validated) | Engine 20+ | — |
| Node.js | `node sha-identity.mjs` + `node regen-constants.mjs` | ✓ | per `package.json` engines | — |
| Playwright browsers | `yarn test:e2e` | ✓ (Phase 86 ran the full suite) | per `tests/package.json` | — |
| Local imgproxy Docker container | DATA_RACE pool (CAND-03/12 image-intrinsic) | ✓ (intermittent 502s acceptable per D-14) | per Supabase storage stack | `supabase stop && start` |
| `/gsd-audit-milestone` skill | Task 4 | ✓ (verified at `$HOME/.claude/skills/gsd-audit-milestone/SKILL.md` + `$HOME/.claude/get-shit-done/workflows/audit-milestone.md`) | — | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** imgproxy 502 has documented `supabase restart` recovery (D-14).

## Validation Architecture

> Phase 87 is verification infrastructure for the v2.10 milestone — the 3-run gate IS the validation. Nyquist mapping below documents how the requirement-level test happens.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (E2E only; pure infrastructure — no Vitest unit-level scope) |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `yarn test:e2e --workers=1 --reporter=json --grep "<scoped pattern>"` (for diagnostic only) |
| Full suite command | `yarn test:e2e --workers=1 --reporter=json > <output>.json` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| DETERM-15 | Fresh 3-run cold-start gate SHA-identical FIRST attempt | E2E full-suite × 3 cold-starts | per-run: `yarn test:e2e --workers=1 --reporter=json > post-fix/run-N.json`; verdict: `node sha-identity.mjs` (writes sha256.txt PASS/FAIL) | ✅ Existing pipeline — sha-identity.mjs forks from Phase 79 |
| DETERM-15 (anchor verify) | PL ~150-160 + DR 3 + CASCADE 0\|≤5 + FAILURE-CLASS 0\|≤2 | Post-regen array-size check | `node .planning/phases/79-…/post-fix/regen-constants.mjs` (writes regen-output.txt with `=== PASS_LOCKED_TESTS (N) ===` etc) + grep-verify counts | ✅ Existing pipeline |
| DETERM-15 (parity gate self-check) | New anchor parity-gate-passes against itself | Direct invocation | `tsx tests/scripts/diff-playwright-reports.ts post-fix/run-3.json post-fix/run-3.json` (expects `PARITY GATE: PASS`) | ✅ Phase 86 Plan 04 Task 4 precedent |
| DETERM-15 (milestone audit) | `/gsd-audit-milestone v2.10` clean; status=passed | Skill invocation | `/gsd-audit-milestone v2.10` → reads `.planning/v2.10-MILESTONE-AUDIT.md` | ✅ Skill at `$HOME/.claude/skills/gsd-audit-milestone/` |

### Sampling Rate
- **Per task commit:** N/A (Phase 87 is a single-plan close phase — only the atomic regen commit + final close commit produce code changes).
- **Per wave merge:** N/A (single plan).
- **Phase gate:** Full 3-run cold-start gate (~216 min wall-time) BEFORE any commit lands.

### Wave 0 Gaps
- None — existing test infrastructure (Phase 79 → 86) covers all phase requirements. The `sha-identity.mjs` script must be forked into Phase 87's post-fix dir; the `regen-constants.mjs` already lives in Phase 79's post-fix and is edited in-place.

## Code Examples

Verified patterns from previously-shipped Phase 79/84/85/86 artifacts:

### Example 1: regen-constants.mjs `reportPath` re-point (Phase 86 Plan 04 paste)
Source: `.planning/phases/79-…/post-fix/regen-constants.mjs:19-37` (current state at v2.10-pre-87)
```javascript
// __dirname is .planning/phases/79-…/post-fix/. Phase 87 anchor lives 2 levels up
// then down into the Phase 87 post-fix directory.
// Phase 87: DETERM-15 final v2.10-ship anchor — fresh 3-run cold-start gate post-84+85+86.
// Anchor SHA: <NEW SHA after Phase 87 strict gate>. Phase 86 anchor
// 9a6d74a3088ec2de933cce9ff40797ec1a1cf8980923f02fbfcaf6f690a30af9 is ABSORBED.
// Per CONTEXT.md D-02: STRICT SHA-identity gate, no D-09 fallback —
// any first-attempt failure escalates as Phase-84/85/86 reopen, not Phase-87 carry-forward.
// Per CONTEXT.md D-05: expected anchor ~150-160 PASS_LOCKED + exactly 3 DATA_RACE +
// 0 (or ≤ 5) CASCADE + 0 (or ≤ 2) FAILURE-CLASS-residual (residual = explicit v2.11+ deferrals).
const reportPath = join(__dirname, '..', '..', '87-v2-10-all-green-milestone-close-anchor-capture-a-fresh-3-run', 'post-fix', 'run-3.json');
```

### Example 2: diff-playwright-reports.ts jsdoc header replacement (Phase 86 line 42-90 → Phase 87)
Source: `tests/scripts/diff-playwright-reports.ts:42-90` (current Phase 86 anchor narrative)
```typescript
// -----------------------------------------------------------------------------
// PHASE 87 ANCHOR (2026-05-15+, v2.10 All-Green Milestone-Close Anchor).
// Source: .planning/phases/87-…/post-fix/run-3.json.
// 3-run cold-start identity gate verdict: <STRICT-PASS | PASS-WITH-DEFERRAL | FAIL+ESCALATED>.
// Per Phase 87 CONTEXT.md D-02 strict-identity contract.
//
// Anchor SHA: <NEW SHA>
// Phase 86 anchor 9a6d74a3088ec2de933cce9ff40797ec1a1cf8980923f02fbfcaf6f690a30af9 is ABSORBED.
//
// PHASE 87 STORY — v2.10 ALL-GREEN MILESTONE CLOSE.
//
// Composition (DETERM-15 close):
//   PASS_LOCKED: <N>  (Phase 86 baseline 113 + delta from any cascade-unblock or skip-migration)
//   DATA_RACE:    3   (Phase 73 D-09 binding renegotiated by Phase 84; preserved at 3 image-intrinsic CAND-03/CAND-12 entries)
//   CASCADE:     <0..5>  (Phase 85 baseline 42 + Phase 86 baseline 40; Phase 87 target 0 or ≤5
//                          if Phase-85-inherited variant-multi-election deterministic FAILs persist)
//   SKIPPED:     <2..N>   (Phase 86 introduced this bucket with 2 QSPEC entries;
//                          Phase 87 may add party-drawer if escalation routes here per operator)
//
// V2.11+ DEFERRALS (explicit; do not pool):
//   - Variant-multi-election deterministic FAILs (variant-multi-election.spec.ts:139,
//     getByTestId('question-choice').nth(2) timeout) — Phase 85 WARNING-9 contingency,
//     Phase 86 D-08 out-of-scope, routed to v2.11+ via …
//   - Party-drawer boundary flake — Phase 83 DETERM-07b graduate, repeatedly flaked
//     in Phase 84/85/86 strict gates; v2.11+ todo at
//     .planning/todos/pending/2026-05-14-party-drawer-boundary-flake-residual.md
//   - QSPEC walkToQuestion cold-start race — Phase 86 SKIPPED_TESTS bucket;
//     v2.11+ todo at .planning/todos/pending/2026-05-14-qspec-walkToQuestion-cold-start-race.md
//
// PRIOR ANCHOR (Phase 86, 2026-05-14) ABSORBED by this regen:
//   9a6d74a3088ec2de933cce9ff40797ec1a1cf8980923f02fbfcaf6f690a30af9
//   113 PASS_LOCKED + 3 DATA_RACE + 40 CASCADE + 2 SKIPPED = 158 tracked.
// -----------------------------------------------------------------------------
```

### Example 3: Phase 87 close commit shape (mirroring Phase 86 Plan 04 commit shape)
Source: Phase 86 Plan 04 SUMMARY §"Key Files Created / Modified"
```
Phase 87 atomic close commit covers:
  - tests/scripts/diff-playwright-reports.ts (jsdoc + 4 constants updated)
  - .planning/phases/79-…/post-fix/regen-constants.mjs (reportPath repoint + narrative refresh)
  - .planning/phases/79-…/post-fix/regen-output.txt (regen script side-effect)
  - .planning/phases/87-…/post-fix/run-{1,2,3}.json (3-run captures)
  - .planning/phases/87-…/post-fix/run-{1,2,3}-stderr.log
  - .planning/phases/87-…/post-fix/run-{1,2,3}.sha256
  - .planning/phases/87-…/post-fix/sha-identity.mjs (forked from Phase 79 verbatim)
  - .planning/phases/87-…/post-fix/sha256.txt (3-run verdict)
  - .planning/phases/87-…/post-fix/regen-output.txt
  - .planning/STATE.md (Phase 87 complete + new anchor SHA + v2.10 ready-to-ship)
  - .planning/ROADMAP.md (Phase 87 row marked complete)

Commit message convention (per Phase 86 close commit shape):
  docs(87): close Phase 87 — DETERM-15 v2.10 All-Green Milestone-Close Anchor;
            new anchor SHA <NEW SHA>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multi-commit constants regen (1 commit per array) | Atomic-bundle commit (Phase 84 D-06) | Phase 84 (2026-05-13) | Revert semantics preserved |
| 14-entry DATA_RACE pool (cascade-artifact) | 3-entry image-intrinsic DATA_RACE pool | Phase 84 D-05 (2026-05-13) | Phase 73 D-09 binding renegotiated; pool MUST NOT grow per Phase 87 D-09 |
| FAILURE-CLASS narrative-only (no const) | SKIPPED_TESTS const (Phase 86 D-05) for source-skips | Phase 86 (2026-05-14) | Source-skips moved out of CASCADE pool; diffReports() early-continues on SKIPPED_TESTS |
| Strict 3-run SHA gate, no flake tolerance | "Almost-strict" — 1-cell party-drawer deferral (Phases 84/85/86) | Phase 84 (2026-05-13) | Routed to Phase 86 → v2.11+ |
| Phase 79 D-09 fallback (re-run +3) for instability | Phase 87 D-02 strict, NO fallback — escalate | Phase 87 (this phase) | Phase 87 is ship-blocker; instability surfaces 84/85/86 reopen |

**Deprecated/outdated:**
- 4-array `DATA_RACE_TESTS` (14 entries) — superseded by 3-entry version since Phase 84.
- `dev:*` Supabase script aliases — superseded by `db:*` since v2.9 Phase 78 CLEAN-01.

## Assumptions Log

> All major claims in this research were verified against committed artifacts. The few items below need user/operator clarification before Phase 87 plans turn them into locked tasks.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Party-drawer boundary flake will resurface in Phase 87's first 3-run attempt | Pitfall 1 | [ASSUMED based on Phase 84/85/86 precedent — 3-of-3 phases hit this; assumption rate is essentially 100%]. If WRONG (flake doesn't surface), Phase 87 closes strict-PASS with no escalation. Plan should still include the escalation branch. |
| A2 | The "1 prep run" mentioned in CONTEXT D-01 is optional (D-13's run-0 / Phase 79 P02 D-12 smoke pattern) | §1 (3-run gate) | [ASSUMED — D-01 says "1-run prep capture + 3-run identity gate" but does not lock the prep run shape]. If operator wants a mandatory prep run, planner adds Task 0.5 in the plan. If skipped, total wall-time drops from ~216min → ~162min. |
| A3 | Phase 87 SUMMARY follows Phase 84/85/86 SUMMARY YAML frontmatter shape (phase / plan / verdict / completed / requirements / anchor_sha / absorbs_anchor) | §8 (SUMMARY shape) | [ASSUMED via observed Phase 84/85/86 precedent]. If WRONG, gsd-verifier may complain about missing frontmatter fields. |
| A4 | Audit-milestone uses `.planning/v2.10-MILESTONE-AUDIT.md` as the output path (NOT `.planning/v2.10-v2.10-MILESTONE-AUDIT.md` as audit-milestone.md line 167 documents) | §4 (audit-milestone shape) | [ASSUMED — workflow file at line 167 has the doubled-version path which is likely a typo; v2.9-MILESTONE-AUDIT.md path in MILESTONES.md line 27 confirms single-version form `.planning/milestones/v2.9-MILESTONE-AUDIT.md`]. If WRONG, plan should grep for the actual path the skill produces and reference that. |
| A5 | Phase 86 closed "PASSED-WITH-DEFERRAL" but VERIFICATION.md hasn't been written yet (only the SUMMARY) | §4 (audit-milestone shape) | [CITED: Phase 86 directory listing shows no 86-VERIFICATION.md as of 2026-05-15]. If gsd-audit-milestone requires VERIFICATION.md for each phase, Phase 86 may need to produce one before Phase 87's audit invocation. Verify by listing `.planning/phases/86-…/` before Task 4. |

## Open Questions

1. **Should Phase 87 include a 1-run "prep" cold-start before the 3-run identity gate?**
   - What we know: CONTEXT D-01 mentions "1-run prep capture + 3-run identity gate" but D-13 (inherited from Phase 79) does not require prep; Phase 84/85/86 each ran a 1-run smoke as Plan-step Task 2 separately, NOT as a Task-1 prep within the gate.
   - What's unclear: Whether Phase 87's planner treats the prep run as a separate task (Task 0.5) or inline in Task 1.
   - Recommendation: Make it an explicit Task 1a (single prep run validating Vite-comes-up-cleanly + supabase-healthy) before Task 1b (the 3-run identity gate). If Task 1a flakes, the planner has a cheap-to-rerun smoke instead of burning a 162-min gate run. Adds ~54min to total wall time.

2. **Does the audit-milestone skill need Phase 86 to have a VERIFICATION.md written before Phase 87's Task 4 invocation?**
   - What we know: The skill (audit-milestone.md line 47-49) reads `VERIFICATION.md` per phase; Phase 86's directory listing shows no 86-VERIFICATION.md as of phase-entry. Phase 84 and 85 have VERIFICATION.md present.
   - What's unclear: Whether Phase 86 close was complete (PASSED-WITH-DEFERRAL per 86-04-SUMMARY frontmatter) but VERIFICATION.md was never written, OR whether the file lives under a different name.
   - Recommendation: Plan 87 Task 4 should pre-check `ls .planning/phases/86-…/86-VERIFICATION.md` and, if absent, route as a pre-Task-4 dependency to produce it (likely via `/gsd-verify-work 86` invocation). If Phase 86 carried a partial verification, that's a transparency gap the audit will surface anyway.

3. **What happens if the strict 3-run gate fails on the FIRST attempt? Re-run +3 (Phase 79 D-09 protocol)?**
   - What we know: CONTEXT D-02 says "RE-RUN on first-attempt failure, ESCALATE on repeat." So one re-run is allowed; second failure escalates.
   - What's unclear: Whether the re-run is +3 fresh runs (Phase 79 D-09 cycle) or just +1 more run for the divergent identity.
   - Recommendation: Plan 87 explicitly says "re-run = full 3-run cycle (Phase 79 D-09 shape); if second 3-run also fails strict identity, escalate per D-02." This matches Phase 79 P03's D-09 cycle precedent.

4. **What is the audit-milestone output verdict format Phase 87 should expect?**
   - What we know: audit-milestone.md line 174-190 documents the YAML frontmatter shape (`status: passed | gaps_found | tech_debt`). Phase 87 D-07 requires `shippable` verdict.
   - What's unclear: The mapping between audit verdict (`passed` | `gaps_found` | `tech_debt`) and Phase 87 D-07's `shippable` term. Likely: `passed` ↔ shippable; `tech_debt` may also be shippable-with-acceptance; `gaps_found` is a ship-blocker.
   - Recommendation: Plan 87 Task 4 documents this mapping explicitly. Operator-aligned RECOMMENDATION: `passed` = unambiguous ship; `tech_debt` = ship after operator reviews the debt list and explicitly accepts it; `gaps_found` = ship-blocker, escalate per D-07.

5. **Is the prep-run smoke worth committing into the post-fix/ directory (alongside the 3 gate runs)?**
   - What we know: Phase 84/85 archived `smoke.json` + `smoke-output.txt` + `smoke-commands.txt`. Phase 86 did not (Plan 04 used `sha-identity-runner.mjs` instead).
   - What's unclear: Whether Phase 87 should preserve a prep-run audit trail.
   - Recommendation: Yes — Phase 87's prep run, if Plan 87 adopts Task 1a per Q1, should commit `smoke.json` + `smoke-commands.txt` for audit-trail completeness (Phase 85 precedent).

## Section 1: 3-Run Gate Execution Shape (detailed answer)

### Per-run invocation chain (canonical per Phase 79 D-13 + Phase 85 smoke-commands.txt)

```bash
# === RUN N (N=1, 2, 3) ===

# Step 1: Likert-only canonical reset (CLAUDE.md "Yarn arg-forwarding caveat" — must be explicit &&-chain)
cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean

# Step 2: Start Vite in background (AFTER dev:clean — Phase 85 LANDMINE-1)
nohup yarn workspace @openvaa/frontend dev > /tmp/vite-dev-87-run-${N}.log 2>&1 &
VITE_PID=$!

# Step 3: Wait for Vite ready (poll http://localhost:5173)
ATTEMPTS=0
until curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ | grep -q "200"; do
  sleep 5
  ATTEMPTS=$((ATTEMPTS+1))
  if [ $ATTEMPTS -gt 60 ]; then
    echo "Vite did not become ready in 5min — escalate"
    exit 1
  fi
done

# Step 4: Capture full-suite JSON (writes ~310KB run-N.json)
yarn test:e2e --workers=1 --reporter=json \
  > .planning/phases/87-v2-10-all-green-milestone-close-anchor-capture-a-fresh-3-run/post-fix/run-${N}.json \
  2> .planning/phases/87-v2-10-all-green-milestone-close-anchor-capture-a-fresh-3-run/post-fix/run-${N}-stderr.log

# Step 5: Compute per-run SHA-256 (NOT the identity hash — file checksum for audit traceability)
sha256sum .planning/phases/87-…/post-fix/run-${N}.json > .planning/phases/87-…/post-fix/run-${N}.sha256

# Step 6: Kill Vite, preserve Supabase between runs (D-14: only restart Supabase on imgproxy 502)
pkill -f "yarn workspace @openvaa/frontend dev" || true
sleep 2
```

### Identity hash computation (post-3-run)

```bash
# Fork sha-identity.mjs verbatim from Phase 79
cp .planning/phases/79-…/post-fix/sha-identity.mjs \
   .planning/phases/87-…/post-fix/sha-identity.mjs

# Run the identity check (writes post-fix/sha256.txt + exits 0 strict-PASS or 1 FAIL)
cd .planning/phases/87-…/post-fix
node sha-identity.mjs
```

The script writes a `sha256.txt` like:
```
Phase 87 Plan 04 Task 1 — 3-run SHA-256 identity check (D-02 strict).

Format: sha256(sorted("<projectName> :: <specFile> > <specTitle>|<status>")).
Status normalisation: regen-constants.mjs categorizeStatus → {pass, cascade, fail}.

run-1.json: <SHA1>  (<N> entries)
run-2.json: <SHA2>  (<N> entries)
run-3.json: <SHA3>  (<N> entries)

Verdict: <PASS | FAIL>
<verdict-rationale narrative>
```

### 1-prep + 3-identity cadence distinction

- **Prep run (Task 1a)** = single cold-start with full canonical chain. Goal: validate Vite-comes-up + supabase-healthy + no imgproxy 502 storm. If this surfaces an env problem, fix BEFORE burning the 162-min gate.
- **3-identity gate runs (Task 1b)** = three back-to-back cold-starts with strict SHA-identity verdict per Phase 79 D-08.

Phase 79 used run-0 as the prep (committed as `run-0.json`). Phase 84/85 used smoke.json. Phase 86 omitted the prep (operator manually ran). Phase 87 should adopt the prep — adds ~54 min but avoids ~162-min waste on env issues.

### Match-count assertions in regen-constants.mjs (the gate that fires on misclassification)

Source: `.planning/phases/79-…/post-fix/regen-constants.mjs:102-115`

```javascript
const titleMatchCounts = IMGPROXY_TIED_TITLES.map((t) => ({
  title: t,
  count: all.filter((x) => x.id.endsWith('> ' + t)).length
}));
const zeroMatches = titleMatchCounts.filter((x) => x.count === 0);
if (zeroMatches.length > 0) {
  console.error('ERROR: IMGPROXY_TIED_TITLES match-count assertion failed.');
  // ...
  process.exit(1);
}
console.error('IMGPROXY_TIED_TITLES match-count assertion: '
  + titleMatchCounts.length + ' titles, '
  + titleMatchCounts.reduce((s, x) => s + x.count, 0) + ' total matches.');
```

**What fires:** If any of the 3 entries in `IMGPROXY_TIED_TITLES` (Phase 84-renegotiated) doesn't match at least one test in run-3.json, the script aborts with exit code 1 and a structured error pointing at the rename / removal.

**Why it matters for Phase 87:** Phase 84 verified "3 titles, 3 total matches" via this gate. Phase 85, 86 each verified the same (each VERIFICATION.md cites the gate output). Phase 87 MUST hit "3 titles, 3 total matches" too. If the count changes, planner must investigate (test was renamed → update IMGPROXY_TIED_TITLES; OR new test surfaces same title → unintentional title collision).

## Section 2: regen-constants.mjs In-Place Edit Shape (detailed answer)

### Constants the script regenerates

The script reads `run-3.json` (per `reportPath`) and writes `regen-output.txt` with 3 paste-ready arrays:

```
=== PASS_LOCKED_TESTS (N) ===
  '<id 1>',
  '<id 2>',
  ...

=== DATA_RACE_TESTS (3) ===
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should persist profile image after page reload (CAND-12)',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should show editable info fields on profile page (CAND-03)',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should upload a profile image (CAND-03)'

=== CASCADE_TESTS (M) ===
  '<id 1>',
  ...
```

### Constants NOT touched by the script (manual SKIPPED_TESTS handling)

The script does NOT emit SKIPPED_TESTS — that const is Phase 86-introduced and must be manually re-asserted on each phase. The 2 QSPEC entries currently in SKIPPED_TESTS:
- `voter-app :: specs/voter/voter-question-rendering-boolean.spec.ts > boolean opinion question renders, voter answers, persists across goBack, mirrors on entity-detail`
- `voter-app :: specs/voter/voter-question-rendering-categorical.spec.ts > categorical opinion question (single-choice) renders, voter answers, persists across goBack, mirrors on entity-detail`

These remain unchanged in Phase 87 (CONTEXT D-08 prohibits new feature work and Phase 86 source-skips are settled). The script's `categorizeStatus` treats `skipped` as `cascade`, so the 2 QSPEC entries will show up in `=== CASCADE_TESTS ===` block — they must be **manually filtered out** during paste, OR the planner adds a post-processing filter to the regen pipeline (Phase 86 Plan 04 did this manually — see SUMMARY metadata "QSPEC source-skip migration to SKIPPED_TESTS").

**Recommendation:** Plan 87 Task 2 explicitly documents the SKIPPED_TESTS filter step. After pasting the regen output into diff-playwright-reports.ts, manually remove the 2 QSPEC entries from CASCADE_TESTS (they stay in SKIPPED_TESTS).

### jsdoc count line shape

Source: `tests/scripts/diff-playwright-reports.ts:92`
```typescript
/** 113 tests locked PASSING on Phase 86 baseline (...). Phase 86 v2.10 All-Green Suite anchor. Any regression vs. THIS list is a BLOCKER. */
```

Phase 87 updates the leading count + the "Phase X baseline" narrative + the "anchor" caveat. The CONTEXT D-04 hint about `94 → ~155-160` reflects Phase 79's count (94); the actual Phase 86 baseline is 113 PASS_LOCKED. Phase 87's target is `~155-160` PER CONTEXT but the binding number is whatever the post-86 codebase actually surfaces. CONTEXT D-05 says PL is a **range** the planner accepts within.

### Phase 84 D-05 in-place edit precedent

Confirmed: `tests/scripts/diff-playwright-reports.ts` line 94-99 (the current 3-entry DATA_RACE_TESTS) is the in-place result of Phase 84 D-05. Phase 85 (commit 086e6361d) and Phase 86 (commit aa3c766f3) both used in-place edits — no forks. Phase 87 SHOULD follow.

### Does the script regenerate diff-playwright-reports.ts content directly?

**NO.** The script writes regen-output.txt with paste-ready arrays. The planner (or executor) manually pastes the array bodies into diff-playwright-reports.ts. The jsdoc header is hand-written narrative.

## Section 3: Atomic Commit Boundary (detailed answer)

### Phase 86 Plan 04 atomic-commit precedent (the closest analog)

Source: Phase 86 04-SUMMARY.md "Key Files Created / Modified" lists exactly:
- 3-run captures (run-1/2/3.json + .sha256 files + stderr logs)
- sha-identity-runner.mjs
- sha256.txt
- regen-output.txt
- regen-stderr.log
- .planning/phases/79-…/post-fix/regen-constants.mjs (modified)
- tests/scripts/diff-playwright-reports.ts (modified)
- .planning/STATE.md (modified)
- .planning/ROADMAP.md (modified)

The Phase 86 close commit (`aa3c766f3` per ROADMAP line 9 of git log) bundled ALL these files. Phase 87 follows the same shape.

### Phase 84 D-06 atomic-bundle exception

Phase 84 D-06 explicitly allowed multi-file atomic bundling for the regen — recognizing that constants + script + output MUST commit together. Phase 85 (commit `086e6361d`) and Phase 86 (commit `aa3c766f3`) both used this pattern.

### Single commit vs. two commits?

CONTEXT D-04 says **single atomic commit** covering all 4 sub-bundles. Verified against Phase 84/85/86 precedent — all 3 used a single close commit.

**Recommendation:** Plan 87 produces a single atomic close commit at the end of Task 4 (NOT Task 2). The flow:
- Task 1: 3-run gate (NOT committed yet — captures sit in post-fix/ untracked)
- Task 2: regen-constants.mjs edit + diff-playwright-reports.ts edit (NOT committed yet)
- Task 3: 87-01-SUMMARY.md written (NOT committed yet)
- Task 4: `/gsd-audit-milestone v2.10` invocation → MILESTONE-AUDIT.md produced → THEN single atomic close commit
- Final close commit covers all files at once

Alternative shape (Phase 86 Plan 04 used): commit at end of Task 4 anyway, but Phase 86 wrote the close commit `aa3c766f3` AFTER `/gsd-audit-milestone` was deferred to Phase 87. Phase 87 includes the audit IN-PHASE, so the close commit lands after audit.

## Section 4: /gsd-audit-milestone v2.10 Invocation Shape (detailed answer)

### What it reads
Per `$HOME/.claude/get-shit-done/workflows/audit-milestone.md`:
- `.planning/ROADMAP.md` — milestone definition + phase scope
- `.planning/REQUIREMENTS.md` — traceability table
- `.planning/phases/*/VERIFICATION.md` for each milestone phase (criticality scope)
- `.planning/phases/*/*-SUMMARY.md` — `requirements_completed` frontmatter
- Optionally: phase `*-VALIDATION.md` for Nyquist compliance

### What it outputs
- A milestone-audit report at `.planning/v2.10-MILESTONE-AUDIT.md` (per workflow line 167 — but the line has a likely typo `.planning/v{version}-v{version}-MILESTONE-AUDIT.md`; the actual canonical path per `.planning/MILESTONES.md:7` for v2.9 was `.planning/milestones/v2.9-MILESTONE-AUDIT.md`. The path under live execution will likely be `.planning/v2.10-MILESTONE-AUDIT.md` since v2.10 is not yet archived).
- YAML frontmatter with `status: passed | gaps_found | tech_debt`, scores, gaps, tech_debt.
- Plus a markdown body with tables for requirements, phases, integration, tech debt.

### What input Phase 87 provides
Nothing direct — the skill auto-detects from the milestone state at invocation time. Phase 87 needs:
1. All phase VERIFICATION.md files to exist (Phase 79-86; Phase 87's own VERIFICATION.md is written by gsd-verifier post-close, but the audit doesn't require Phase 87's own).
2. `.planning/STATE.md` reflects Phase 87 just closed (so progress = 100% for v2.10).
3. `.planning/ROADMAP.md` Phase 87 row marked Complete.
4. The new anchor SHA committed in diff-playwright-reports.ts.

### How does it integrate with Phase 87's verdict?
Phase 87 D-07 says `shippable` iff (3-run gate strict-pass) AND (anchor target met) AND (audit clean) AND (no new reqs). The mapping to audit verdict:
- audit `passed` ↔ ship-clean
- audit `tech_debt` ↔ ship-with-debt-accepted (operator reviews)
- audit `gaps_found` ↔ ship-blocker, escalate

### Integration checker spawn

Per audit-milestone.md §3, the skill spawns a `gsd-integration-checker` subagent to verify cross-phase wiring and E2E flows. The checker gets the milestone REQ-IDs (DETERM-08 through DETERM-15, plus A11Y-04/05/06/07, plus DETERM-06/07 from Phase 83) and is expected to verify them holistically.

**Phase 87 implication:** Plan 87 Task 4 just invokes `/gsd-audit-milestone v2.10` and accepts the result. Phase 87 does NOT spawn the integration checker manually — the skill does it.

## Section 5: Did-Not-Run Treatment (detailed answer)

### How the pipeline handles "did not run" today

Source: `tests/scripts/diff-playwright-reports.ts:370-378` (`categorizeStatus` function):
```typescript
function categorizeStatus(raw: string, err: string): TestStatus {
  if (raw === 'passed') return 'pass';
  if (raw === 'skipped') return 'cascade';
  if (/did not run|setup.*failed|dependency.*failed/i.test(err)) return 'cascade';
  return 'fail';
}
```

**Treatment:** Both `skipped` raw status AND `did not run | setup failed | dependency failed` error patterns map to `cascade`. The mathematical impact:
- The status normalises to `cascade` → it appears in CASCADE_TESTS pool.
- For SHA-identity gate, the "did not run" cells will have status `cascade` in all runs IF the upstream setup deterministically fails OR deterministically passes — but if the upstream is FLAKY, the downstream cell may flip between `cascade` (when upstream fails) and `pass` (when upstream succeeds), breaking SHA-identity.

### Does audit-milestone surface "did not run"?

The skill does NOT directly inspect run-N.json. It reads phase VERIFICATION.md files + SUMMARY frontmatter + REQUIREMENTS.md traceability. "Did not run" cells appear in VERIFICATION.md's requirement table (if any test for a REQ is marked cascade/did-not-run, the REQ status is `partial` or `unsatisfied`).

Per memory `feedback_e2e_did_not_run.md`: "Treat 'did not run' E2E tests as failures in all counts." This memory directs the operator that even if a "did not run" cell isn't a deterministic fail, it counts as a fail for milestone-shippability semantics.

### Phase 87 implication

Plan 87 Task 4 should pre-check that the new Phase 87 anchor has NO "did not run" cells (i.e., the audit-milestone skill sees zero in the SUMMARY/VERIFICATION cross-reference). If any DNR cell surfaces, escalate per CONTEXT D-06 ("if surfaces residual 'did not run' cells from Phases 84-86, those phases reopen, not Phase 87 carry-forward").

Practical implementation: After Task 2 atomic regen, grep the new regen-output.txt for the "did not run" pattern in CASCADE_TESTS:
```bash
grep "did not run" .planning/phases/87-…/post-fix/regen-output.txt
```
If any, surface as a Plan 87 Task 4 pre-condition gate.

### Do "did not run" cells invalidate SHA-identity?

YES — if the upstream that causes the DNR is flaky. The party-drawer boundary flake is one example (it's not strictly DNR — it's a deterministic-fail that flakes to pass — but the same flake-pattern applies to cascade-DNR cells). The Phase 84/85/86 anchor narratives show how this manifests: when the run-N's upstream flakes, the downstream cell flips between `cascade` and `pass` (or `cascade` and `fail`), and the SHA-identity gate catches the flip.

## Section 6: Anchor Target Tolerance (detailed answer)

### Per-pool tolerance (CONTEXT D-05)

| Pool | Target | Tolerance | Deviation Action |
|------|--------|-----------|------------------|
| PASS_LOCKED | ~150-160 | Range — planner accepts within | Outside range → investigate (likely indicates scope drift) |
| DATA_RACE | exactly 3 | Strict — Phase 73 D-09 + Phase 87 D-09 binding | Any ≠ 3 → Phase-84-reopen (new imgproxy-tie surfaced) |
| CASCADE | 0 (or ≤5) | ≤5 if Phase 85 deferrals persist | >5 → investigate (likely Phase 85 reopen) |
| FAILURE-CLASS residual | 0 (or ≤2) | ≤2 if Phase 86 deferrals persist | >2 → investigate (likely Phase 86 reopen) |
| SKIPPED | 2 (Phase 86 introduced) | Exact — no growth | Growth → operator-aligned routing |

### Wiggle-room mechanism

CONTEXT D-05 documents the tolerance ranges explicitly. There is no "tolerance acceptable" decision available to the planner mid-flight — the ranges are the lock. Outside-range surfaces escalate.

### Current state per Phase 86 anchor
- PASS_LOCKED = 113 (per diff-playwright-reports.ts line 92)
- DATA_RACE = 3
- CASCADE = 40 (per line 216; composition: 3 PRODUCT-GAP source-skips + 32 cascade-victims of Phase 85 variant-multi-election deterministic FAILs + 5 other variant-spec cells)
- SKIPPED = 2 (QSPEC)
- FAILURE-CLASS residual ~7 narrative-only (per 86-04-SUMMARY pool counts table)

### Phase 87 expected anchor (best-case)
- PL ≥ ~115 (113 + cascade-unblock; minimum ~155-160 if Phase 85/86 variant chains resolve themselves — unlikely without explicit fix work)
- DR = 3
- CASCADE ≤ 5 (much smaller than 40 — only if Phase 85's variant-multi-election cells get resolved)
- SKIPPED = 2 (unchanged) or 3 (+1 if party-drawer migrates)
- FAILURE-CLASS residual = 0 or ≤2

**Reality check:** Phase 86's CASCADE = 40 includes 32 cascade-victims of 2 variant-multi-election deterministic FAILs. Those 2 FAILs are explicit v2.11+ deferrals — Phase 87 cannot resolve them (D-08). So CASCADE will remain ~40 unless something dramatic changes. CONTEXT D-05's "CASCADE 0 or ≤5" target is **aspirational, not realistic given current state**. The planner must flag this delta openly: actual Phase 87 close will likely have CASCADE ~40, NOT 0-5.

**Critical research finding:** CONTEXT D-05's CASCADE target is OUT OF DATE relative to Phase 86's actual outcome. The planner SHOULD surface this in Plan 87 as an "expected deviation" — Phase 87 closes with CASCADE ~40 + v2.11+ deferrals list documenting the inheritance, NOT a CASCADE = 0 close. This is the audit-milestone `tech_debt` verdict scenario per D-07.

## Section 7: SKIPPED_TESTS Const (detailed answer)

### Status: Phase 86 introduced SKIPPED_TESTS — already in diff-playwright-reports.ts

Source: `tests/scripts/diff-playwright-reports.ts:261-264`
```typescript
const SKIPPED_TESTS: ReadonlyArray<string> = [
  'voter-app :: specs/voter/voter-question-rendering-boolean.spec.ts > boolean opinion question renders, voter answers, persists across goBack, mirrors on entity-detail',
  'voter-app :: specs/voter/voter-question-rendering-categorical.spec.ts > categorical opinion question (single-choice) renders, voter answers, persists across goBack, mirrors on entity-detail'
];
```

### diffReports() handling

Source: `tests/scripts/diff-playwright-reports.ts:426, 434-435`
```typescript
const sourceSkip = new Set(SKIPPED_TESTS);
// ...
for (const b of baseFlat) {
  const p = postById.get(b.id);
  const postStatus: TestStatus = p?.status ?? 'cascade';

  // Phase 86 D-05: deliberately skipped tests (source-level test.skip()) are not part of the parity contract.
  if (sourceSkip.has(b.id)) continue;
  // ...
}
```

### Phase 87 implication

The SKIPPED_TESTS const is part of the partition. Phase 87's atomic regen MUST preserve it. Two scenarios:
1. **Strict identity gate PASSES, no new skips needed:** SKIPPED_TESTS unchanged at 2 entries.
2. **Strict identity gate FAILS on party-drawer, operator escalates:** May migrate party-drawer to SKIPPED_TESTS — but per D-08 (no new feature work) this should require operator sign-off, NOT automatic.

**Recommendation:** Plan 87 explicitly states "SKIPPED_TESTS unchanged in Phase 87 base case; any migration requires operator approval per D-08."

## Section 8: Project Conventions for SUMMARY Write (detailed answer)

### Typical SUMMARY structure (synthesizing Phase 79/84/85/86 SUMMARY shapes)

```yaml
---
phase: 87-v2-10-all-green-milestone-close-anchor-capture-a-fresh-3-run
plan: 04                          # or 01 if single-plan per D-01
status: complete
verdict: GREEN | PASSED-WITH-DEFERRAL | ESCALATED   # one of three
completed: 2026-MM-DD
duration_min: ~216 (or actual)
requirements: [DETERM-15]
anchor_sha: "<NEW SHA from sha256.txt>"
absorbs_anchor: "9a6d74a3088ec2de933cce9ff40797ec1a1cf8980923f02fbfcaf6f690a30af9"
# Optional Phase 86 / 85 pattern frontmatter:
subsystem: e2e-testing
tags:
  - determinism
  - milestone-close
  - v2.10-anchor
  - DETERM-15
  - all-green-suite
dependency_graph:
  requires:
    - 84 (DETERM-08 imgproxy decoupling)
    - 85 (DETERM-10+11 variant-cascade)
    - 86 (DETERM-12+13+14 voter-app FAILURE-CLASS)
  provides:
    - Phase 87 v2.10 final ship anchor SHA <NEW>
    - <PL>/<DR>/<CASCADE>/<SKIPPED> partition for diff-playwright-reports.ts
  affects:
    - v2.10 milestone close (next: /gsd-complete-milestone v2.10)
    - v2.11 milestone planning
key_files:
  created: [post-fix/run-{1,2,3}.json, sha-identity.mjs, sha256.txt, regen-output.txt]
  modified: [diff-playwright-reports.ts, regen-constants.mjs, STATE.md, ROADMAP.md]
metrics:
  pass_locked_delta: "<+N> (Phase 86 → 87)"
  data_race_delta: "0 (D-09 preserved)"
  cascade_delta: "<delta>"
  skipped_delta: "<delta>"
---

# Phase 87: v2.10 All-Green Milestone-Close — Plan 04 (close orchestration) Summary

## Outcome
[Verdict + 1-paragraph what-shipped narrative]

## Tasks executed
[Per-task table; mirror Phase 86 04-SUMMARY structure]

## Pool Counts
[Per-pool delta table; mirror Phase 86 04-SUMMARY shape]

## Cross-Plan Outcome Summary
[If Phase 87 is single-plan, replaces with a Cross-Phase Outcome Summary covering Phases 79 → 87]

## v2.11+ Deferrals Filed
[Existing party-drawer + QSPEC todos; any new ones surfaced]

## v2.10 Milestone Shippability Verdict
[Per CONTEXT D-07: PASS / FAIL with rationale; refers to MILESTONE-AUDIT.md verdict]

## Audit-Milestone Result Link
[Path: .planning/v2.10-MILESTONE-AUDIT.md; status: passed | gaps_found | tech_debt]

## Lineage Cross-References
[The 4-phase milestone-extension chain: Phase 79 → 80/81/82/83 → 84/85/86/87]

## D-Spec Verification
[CONTEXT D-01..D-09 verification table — which decisions were honored / deviated]
```

### Comprehensive SUMMARY narrative sections (per CONTEXT D-07 RECOMMENDATION)

1. **Outcome** — 1 paragraph
2. **Anchor SHA evolution** — Phase 73 → 79 → 84 → 85 → 86 → 87 SHA chain
3. **Per-task verdict** — table mirroring Phase 86 Plan 04 SUMMARY
4. **Pool delta table** — mirroring Phase 86 04-SUMMARY "Pool Counts" section
5. **v2.11+ Deferrals Filed** — explicit list of every v2.11+ todo with route reason
6. **Cross-Phase Outcome Summary** — table covering Phase 79 → 87 outcomes (this is Phase 87's unique opportunity; the milestone-close summary is the v2.10 retro)
7. **Audit-Milestone Result** — link + status + key gaps if any
8. **D-Spec Verification** — table verifying CONTEXT D-01..D-09 honored
9. **Phase 86 Hand-Off Inheritance** — the party-drawer + QSPEC inheritance narrative
10. **v2.10 Shippability Verdict** — explicit PASS/FAIL per D-07 + next steps for operator

### Lineage cross-references (Phase 79 → 80/81/82/83 → 84/85/86/87)

| Phase | REQs | Anchor SHA at close | Pool counts |
|-------|------|---------------------|-------------|
| 79 | DETERM-04, DETERM-05 | `ff0334f856…` | 80/15/57 (152) |
| 80 | A11Y-04 | (no anchor change — Phase 79 preserved) | 80/15/57 |
| 81 | A11Y-05, A11Y-06 | (no anchor change — Phase 79 preserved) | 80/15/57 |
| 82 | A11Y-07 | (no anchor change — Phase 79 preserved) | 80/15/57 |
| 83 | DETERM-06, DETERM-07 | `d6bfeebdb0…` | 94/15/47 (156) |
| 84 | DETERM-08, DETERM-09 | `04ddfdd85c…` | 106/3/47 (156) |
| 85 | DETERM-10, DETERM-11 | `411e09f5ff…` | 109/3/42 (154) |
| 86 | DETERM-12, DETERM-13, DETERM-14 | `9a6d74a308…` | 113/3/40/2 (158) |
| 87 | DETERM-15 | **<NEW SHA from this phase>** | **<expected: ~115/3/~40/~2 = ~160 tracked, given Phase 85 variant-multi-election persist as v2.11+>** |

### v2.11+ deferrals list (carry-forward at Phase 87 close)
1. `2026-05-14-party-drawer-boundary-flake-residual.md` — Phase 86 Plan 04 PASSED-WITH-DEFERRAL inheritance
2. `2026-05-14-qspec-walkToQuestion-cold-start-race.md` — Phase 86 Plan 03 SKIPPED_TESTS inheritance
3. Variant-multi-election deterministic FAILs (2 cells + 32 cascade-victims) — Phase 85 WARNING-9 → Phase 86 D-08 → Phase 87 D-08 inheritance; no todo file yet, planner may file one
4. Plus pre-existing v2.11+ deferrals from STATE.md (SETTINGS-02, SETTINGS-03, FilterGroup OR-mode, voters-layout non-reactive topbar, constituency-filter PRODUCT-GAP)

## Sources

### Primary (HIGH confidence)
- `tests/scripts/diff-playwright-reports.ts` — lines 1-567 read in full
- `.planning/phases/79-…/post-fix/regen-constants.mjs` — lines 1-141 read in full
- `.planning/phases/79-…/post-fix/sha-identity.mjs` — lines 1-105 read in full
- `.planning/phases/86-…/post-fix/sha-identity-runner.mjs` — lines 1-109 read in full
- `.planning/phases/86-…/post-fix/sha256.txt` — full file (43 lines)
- `.planning/phases/85-…/post-fix/sha256.txt` — full file (179 lines)
- `.planning/phases/87-…/87-CONTEXT.md` — full file (177 lines)
- `.planning/phases/79-…/79-CONTEXT.md` — full file (193 lines)
- `.planning/phases/84-…/84-VERIFICATION.md` — full file (162 lines)
- `.planning/phases/85-…/85-VERIFICATION.md` — full file (147 lines)
- `.planning/phases/86-…/86-04-SUMMARY.md` — full file (90 lines)
- `.planning/phases/79-…/79-03-SUMMARY.md` — full file (80 lines)
- `.planning/phases/86-…/86-04-PLAN.md` — first 100 lines
- `.planning/phases/86-…/86-03-SUMMARY.md` — first 100 lines (SKIPPED_TESTS introduction context)
- `.planning/phases/85-…/85-02-SUMMARY.md` — first 100 lines
- `.planning/phases/84-…/84-01-SUMMARY.md` — first 100 lines
- `.planning/ROADMAP.md` — Phase 87 section (lines 82-260)
- `.planning/REQUIREMENTS.md` — DETERM-15 (lines 65-110)
- `.planning/STATE.md` — first 100 lines (current state + deferrals)
- `.planning/MILESTONES.md` — v2.9 section (audit verdict precedent)
- `.planning/config.json` — workflow.nyquist_validation absent → default enabled
- `CLAUDE.md` — full Common Workflows + Seeding local data sections
- `$HOME/.claude/get-shit-done/workflows/audit-milestone.md` — full skill workflow
- `$HOME/.claude/skills/gsd-audit-milestone/SKILL.md` — skill manifest
- `.planning/phases/85-…/post-fix/smoke-commands.txt` — canonical chain audit-trail precedent
- Memory `feedback_e2e_did_not_run.md` (project memory index) — "did not run" treatment directive
- Memory `feedback_batch_discussions.md` — operator's auto-chain preference
- Memory `project_all_green_suite_priority.md` — operator's All-Green directive

### Secondary (MEDIUM confidence)
- None — all claims verified against primary sources.

### Tertiary (LOW confidence)
- None — all claims verified.

## Metadata

**Confidence breakdown:**
- 3-run gate execution shape: HIGH — Phase 79/84/85/86 each followed the canonical chain; commands and scripts are committed verbatim.
- regen-constants.mjs in-place edit: HIGH — verified line-by-line against the current Phase-86-pointing version.
- Atomic commit boundary: HIGH — verified against Phase 84/85/86 commit shapes.
- audit-milestone shape: HIGH — verified against the skill workflow file.
- Did-not-run treatment: HIGH — verified against categorizeStatus + diffReports().
- Anchor target tolerance: HIGH — verified against CONTEXT D-05 + Phase 86 actual close.
- SKIPPED_TESTS introduction: HIGH — verified at lines 261-264 of diff-playwright-reports.ts.
- SUMMARY shape: HIGH — synthesized from Phase 79/84/85/86 SUMMARY YAML frontmatter precedent.

**Open questions (5)** — see "Open Questions" section above. Most are tactical timing/ordering decisions for the planner, NOT load-bearing for the Phase 87 strategy.

**Research date:** 2026-05-15
**Valid until:** Until v2.11 milestone planning begins (v2.10 is fast-moving but Phase 87 is verification-only — research is binding-stable for the duration of Phase 87).

## RESEARCH COMPLETE

All 8 research focus areas in the orchestrator brief are answered with concrete, planner-actionable detail. Every claim is verified against committed artifacts (`tests/scripts/diff-playwright-reports.ts`, `.planning/phases/{79,84,85,86,87}/...`, CLAUDE.md, audit-milestone workflow, project memories). The planner can now generate Plan 87 as a single 4-task plan mirroring Phase 86 Plan 04 with:
- Task 1: 1-prep + 3-identity-gate cold-start cycle via Bash run_in_background (~216 min), with explicit re-run + escalation branches per D-02
- Task 2: atomic regen (regen-constants.mjs reportPath repoint + diff-playwright-reports.ts 4-const update + jsdoc rewrite) — manual SKIPPED_TESTS filter step documented
- Task 3: comprehensive Phase 87 SUMMARY mirroring Phase 86 04-SUMMARY shape + Cross-Phase milestone-close lineage table
- Task 4: `/gsd-audit-milestone v2.10` invocation + verdict-to-shippability mapping + final atomic close commit

Key planner risks to flag in Plan 87:
1. Party-drawer flake will likely surface (Pitfall 1) — plan the escalation branch explicitly
2. CASCADE pool will likely remain ~40 (Section 6 reality check) — set expectation that audit verdict may be `tech_debt`, not `passed`
3. Phase 86 VERIFICATION.md may need to be authored before audit-milestone can run cleanly (Open Q 2)
4. Vite + cold-reset ordering is a known LANDMINE (Pitfall 3) — encode in Task 1 protocol
5. Long-running gate from short-lived subagent will orphan child processes (Pitfall 4) — orchestrator dispatches directly
