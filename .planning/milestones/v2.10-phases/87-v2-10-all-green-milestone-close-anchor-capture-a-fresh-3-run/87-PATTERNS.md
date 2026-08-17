# Phase 87: v2.10 All-Green Milestone-Close Anchor — Pattern Map

**Mapped:** 2026-05-15
**Files in scope:** 11 surfaces (2 in-place EDIT scripts + 6 CREATE artifact files + 2 NEW markdown files + 1 MILESTONE-AUDIT.md output of `/gsd-audit-milestone`)
**Analogs found:** 11 / 11 — every surface has a precedent in Phase 79, 84, 85, or 86 (no surface lacks a direct analog)

Phase 87 creates NO new source code. It (a) EDITS two scripts in-place (`regen-constants.mjs` + `diff-playwright-reports.ts`), (b) CREATES capture / verdict artifacts in `.planning/phases/87-…/post-fix/`, (c) CREATES the Phase 87 SUMMARY narrative, and (d) lets `/gsd-audit-milestone v2.10` produce `.planning/v2.10-MILESTONE-AUDIT.md`. The richest precedent pool is Phase 86 (most recent close); Phase 84 / 85 supply the smoke-prep artifact shape; Phase 79 supplies the script archetypes.

## File Classification

| File (NEW or MODIFIED) | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `.planning/phases/79-…/post-fix/regen-constants.mjs` (MODIFY in-place) | infra-script | file-I/O (read run-3.json → write regen-output.txt) | same file at its current Phase-86-anchored state (`reportPath` line 37, jsdoc lines 19-37, `IMGPROXY_TIED_TITLES` lines 94-98) | exact (self-analog) |
| `tests/scripts/diff-playwright-reports.ts` (MODIFY in-place) | infra-script | const-array partition + parity-gate diff logic | same file lines 42-90 (PHASE 86 ANCHOR jsdoc), 92 (count line), 93-207 (PASS_LOCKED), 209-214 (DATA_RACE), 216-258 (CASCADE), 260-264 (SKIPPED) | exact (self-analog) |
| `.planning/phases/87-…/post-fix/run-{1,2,3}.json` (CREATE) | test capture | Playwright JSON reporter output | `.planning/phases/86-…/post-fix/run-{1,2,3}.json` (313KB / 309KB shape; ~165 entries each) | exact |
| `.planning/phases/87-…/post-fix/run-{1,2,3}-stderr.log` (CREATE) | capture-stderr | log stream (mostly dotenv banner) | `.planning/phases/86-…/post-fix/run-{1,2,3}-stderr.log` | exact |
| `.planning/phases/87-…/post-fix/run-{1,2,3}.sha256` (CREATE) | per-run file checksum (audit-trail) | `sha256sum` text output | `.planning/phases/86-…/post-fix/run-{1,2,3}.sha256` | exact |
| `.planning/phases/87-…/post-fix/sha-identity.mjs` (CREATE — fork verbatim) | infra-script | reads run-{1,2,3}.json → writes sha256.txt | `.planning/phases/79-…/post-fix/sha-identity.mjs` (Phase 79 D-08 strict shape; NOT the Phase 86 `sha-identity-runner.mjs` variant — that has the "last 2 match" shortcut which D-02 prohibits) | exact (verbatim fork) |
| `.planning/phases/87-…/post-fix/sha256.txt` (CREATE) | identity-verdict | sha-identity.mjs output | `.planning/phases/86-…/post-fix/sha256.txt` (rich verdict + diff narrative shape) | exact |
| `.planning/phases/87-…/post-fix/regen-output.txt` (CREATE — script side-effect) | regen-output | regen-constants.mjs writes the 3 paste-ready arrays | `.planning/phases/85-…/post-fix/regen-output.txt` (note: file lives in Phase 79 post-fix until reportPath repoint commit — see Pattern 1 below) | exact |
| `.planning/phases/87-…/post-fix/smoke.json` + `smoke-stderr.log` + `smoke-commands.txt` (OPTIONAL — Task 1a prep run per Research §1 + Open-Q 1 + Open-Q 5) | prep-capture + audit-trail | 1-run Playwright JSON + canonical-chain transcript | `.planning/phases/85-…/post-fix/smoke.json` + `smoke-commands.txt` (Phase 84/85 precedent; Phase 86 omitted) | exact |
| `.planning/phases/87-…/87-01-SUMMARY.md` (CREATE) | summary narrative | YAML frontmatter + prose body | `.planning/phases/86-…/86-04-SUMMARY.md` (90 lines; verdict/anchor_sha/absorbs_anchor frontmatter shape + Pool Counts + Cross-Plan Outcome + D-Spec Verification sections) | exact |
| `.planning/v2.10-MILESTONE-AUDIT.md` (CREATE — written by `/gsd-audit-milestone v2.10`, NOT by the executor) | milestone audit | skill-emitted markdown | `.planning/milestones/v2.9-MILESTONE-AUDIT.md` (path precedent per `MILESTONES.md:7`) | role-match (skill auto-produces; Phase 87 only invokes) |

**Note on naming:** CONTEXT D-04 references `CASCADE_BASELINE_TESTS` and `FAILURE-CLASS_TESTS` — neither exists. Use the actual code names: `PASS_LOCKED_TESTS`, `DATA_RACE_TESTS`, `CASCADE_TESTS`, `SKIPPED_TESTS`. FAILURE-CLASS lives ONLY in the jsdoc narrative block (no const backing).

---

## Pattern Assignments

### 1. `regen-constants.mjs` in-place reportPath repoint + narrative refresh

**Analog:** Same file at its current state. Phase 87 mutates exactly 3 zones — jsdoc lines 19-37, `reportPath` line 37, and (if any IMGPROXY title was renamed) the `IMGPROXY_TIED_TITLES` array lines 94-98. NO behavioral logic changes.

**Reference excerpt — current state (jsdoc + reportPath):**

```javascript
// Source: .planning/phases/79-…/post-fix/regen-constants.mjs:19-37
const __dirname = dirname(fileURLToPath(import.meta.url));
// __dirname is .planning/phases/79-…/post-fix/. Phase 86 anchor lives 2 levels up
// then down into the Phase 86 post-fix directory.
// Phase 86: DETERM-12 + DETERM-13 + DETERM-14 voter-app FAILURE-CLASS cleanup.
// Plans 01-03 landed 8 deterministic fixes + 2 QSPEC test.skip()+rationale entries
// (Phase 75 PASS-WITH-DEFERRAL inheritance) + 1 project-config testIgnore exclusion
// (voter-visibility-required from voter-app project). 3-run cold-start gate:
// run-1 invalidated by operator (mistake during execution); run-2 vs run-3 differ
// by exactly 1 cell — the documented party-drawer boundary flake (same Phase-83
// DETERM-07b boundary graduate that flaked in Phase 84 run-2 + Phase 85 run-3).
// Plan 01 Task 5 hardening (commit 9cc115469) reduced but did not fully eliminate
// the boundary classification; residual deferred to v2.11+ via
// .planning/todos/pending/2026-05-14-party-drawer-boundary-flake-residual.md.
// Per Phase 85 D-06 precedent: run-3.json is canonical regen source (party-drawer
// PASSED in run-3). New Phase 86 v2.10 All-Green Suite anchor SHA:
// 9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9
// Phase 85 anchor 411e09f5ffb15015ca57a7405619f127f3950c402c082e2599f6782601158ac5
// is ABSORBED by this regen. See .planning/phases/86-…/post-fix/sha256.txt
// for the full audit + ALMOST-strict verdict rationale.
const reportPath = join(__dirname, '..', '..', '86-voter-app-failure-class-cleanup-investigate-and-resolve-the-', 'post-fix', 'run-3.json');
```

**Phase 87 paste-ready replacement (planner fills `<NEW SHA>` and `<verdict>` post-gate):**

```javascript
// Phase 87: DETERM-15 final v2.10-ship anchor — fresh 3-run cold-start gate post-84+85+86.
// Anchor SHA: <NEW SHA from .planning/phases/87-…/post-fix/sha256.txt>
// 3-run cold-start identity gate verdict: <STRICT-PASS | ALMOST-STRICT | FAIL+ESCALATED>.
// Per CONTEXT.md D-02: STRICT SHA-identity gate, no D-09 fallback —
// any first-attempt failure escalates as Phase-84/85/86 reopen, not Phase-87 carry-forward.
// Per CONTEXT.md D-05: expected anchor ~150-160 PASS_LOCKED + exactly 3 DATA_RACE +
// 0 (or ≤ 5) CASCADE + 0 (or ≤ 2) FAILURE-CLASS-residual (residual = explicit v2.11+ deferrals).
// REALITY CHECK (RESEARCH §6): CASCADE ~40 is expected — Phase 85's variant-multi-election
// deterministic FAILs cascade-block 32 downstream cells (out of Phase 87 scope per D-08).
// Phase 86 anchor 9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9 is ABSORBED.
// See .planning/phases/87-…/post-fix/sha256.txt for the full 3-run audit + verdict rationale.
const reportPath = join(__dirname, '..', '..', '87-v2-10-all-green-milestone-close-anchor-capture-a-fresh-3-run', 'post-fix', 'run-3.json');
```

**Match-count assertion (lines 102-115) — UNCHANGED contract:** the gate MUST emit `IMGPROXY_TIED_TITLES match-count assertion: 3 titles, 3 total matches.` Any deviation triggers Phase-84-reopen per CONTEXT D-05 (`DATA_RACE = exactly 3 strict`).

```javascript
// Source: regen-constants.mjs:102-116 (UNCHANGED — must continue to pass)
const titleMatchCounts = IMGPROXY_TIED_TITLES.map((t) => ({
  title: t,
  count: all.filter((x) => x.id.endsWith('> ' + t)).length
}));
const zeroMatches = titleMatchCounts.filter((x) => x.count === 0);
if (zeroMatches.length > 0) {
  console.error('ERROR: IMGPROXY_TIED_TITLES match-count assertion failed.');
  // … (exit 1)
}
console.error('IMGPROXY_TIED_TITLES match-count assertion: ' + titleMatchCounts.length + ' titles, ' + titleMatchCounts.reduce((s, x) => s + x.count, 0) + ' total matches.');
```

**SKIPPED_TESTS gotcha (Research §7 + Phase 86 Plan 04 lesson):** the script does NOT emit SKIPPED_TESTS — `categorizeStatus` maps `skipped → cascade`, so the 2 QSPEC source-skip entries surface in `=== CASCADE_TESTS ===` block of regen-output.txt. Planner MUST manually filter them out of the CASCADE paste and preserve them in the existing `SKIPPED_TESTS` const at `diff-playwright-reports.ts:261-264`. Document this filter step explicitly in Plan 87 Task 2.

---

### 2. `diff-playwright-reports.ts` jsdoc + 4-const update

**Analog:** Same file lines 42-90 (jsdoc anchor block), 92 (count line), 93-207 (PASS_LOCKED — 113 entries), 209-214 (DATA_RACE — 3 entries), 216-258 (CASCADE — 40 entries), 260-264 (SKIPPED — 2 entries).

**Reference excerpt — current PHASE 86 ANCHOR jsdoc header (lines 42-90):**

```typescript
// Source: tests/scripts/diff-playwright-reports.ts:42-90
// -----------------------------------------------------------------------------
// PHASE 86 ANCHOR (2026-05-14, v2.10 All-Green Suite). Source: post-fix/run-3.json.
// 3-run cold-start identity gate verdict: ALMOST-STRICT (run-1 invalidated by
// operator mistake; run-2 vs run-3 differ by EXACTLY ONE cell — the documented
// party-drawer boundary flake, same Phase-83-DETERM-07b boundary that flaked in
// Phase 84 run-2 + Phase 85 run-3). Per Phase 85 D-06 precedent, run-3.json is
// the canonical regen source (party-drawer PASSED in run-3). Anchor SHA:
//   9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9
// Phase 85 anchor 411e09f5ffb15015ca57a7405619f127f3950c402c082e2599f6782601158ac5
// is ABSORBED. See `.planning/phases/86-…/post-fix/sha256.txt` for the full
// audit + ALMOST-strict verdict rationale.
// […PHASE 86 STORY narrative — DETERM-12/13/14 cluster outcomes…]
// PRIOR ANCHOR (Phase 85, 2026-05-14) ABSORBED by this regen:
//   411e09f5ffb15015ca57a7405619f127f3950c402c082e2599f6782601158ac5
//   109 PASS_LOCKED + 3 DATA_RACE + 42 CASCADE. Phase 86 anchor:
//   9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9
//   113 PASS_LOCKED (+4 net) + 3 DATA_RACE (UNCHANGED per D-09) +
//   40 CASCADE (-2 from QSPEC source-skip migration to SKIPPED_TESTS) +
//   2 SKIPPED (new bucket) = 158 tracked.
// -----------------------------------------------------------------------------
```

**Phase 87 paste-ready replacement (planner fills `<NEW SHA>`, `<verdict>`, pool counts post-gate):**

```typescript
// -----------------------------------------------------------------------------
// PHASE 87 ANCHOR (2026-05-15+, v2.10 All-Green Milestone-Close).
// Source: post-fix/run-3.json.
// 3-run cold-start identity gate verdict: <STRICT-PASS | ALMOST-STRICT | FAIL+ESCALATED>.
// Per Phase 87 CONTEXT.md D-02: strict-identity contract, no Phase-79-D-09 fallback —
// first-attempt failure escalates as Phase-84/85/86 reopen, not Phase-87 carry-forward.
// Anchor SHA:
//   <NEW SHA>
// Phase 86 anchor 9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9
// is ABSORBED. See `.planning/phases/87-…/post-fix/sha256.txt` for the full audit.
//
// PHASE 87 STORY — v2.10 ALL-GREEN MILESTONE CLOSE.
//
// Composition (DETERM-15 close):
//   PASS_LOCKED: <N>  (Phase 86 baseline 113 + delta from any cascade-unblock or skip-migration)
//   DATA_RACE:    3   (Phase 73 D-09 binding renegotiated by Phase 84; preserved at 3 image-intrinsic CAND-03/CAND-12 entries)
//   CASCADE:     <N>  (Phase 86 baseline 40; Phase 87 expected ~40 because Phase 85's
//                      variant-multi-election deterministic FAILs cascade-block 32 cells —
//                      out of Phase 87 scope per D-08)
//   SKIPPED:     <N>  (Phase 86 baseline 2 QSPEC; Phase 87 may add party-drawer ONLY with operator sign-off per D-08)
//
// V2.11+ DEFERRALS (explicit; do not pool):
//   - Variant-multi-election deterministic FAILs (variant-multi-election.spec.ts:139,
//     getByTestId('question-choice').nth(2) timeout) — Phase 85 WARNING-9 contingency,
//     Phase 86 D-08 out-of-scope, Phase 87 D-08 out-of-scope.
//   - Party-drawer boundary flake — Phase 83 DETERM-07b graduate, repeatedly flaked
//     in Phase 84/85/86 strict gates; v2.11+ todo at
//     .planning/todos/pending/2026-05-14-party-drawer-boundary-flake-residual.md.
//   - QSPEC walkToQuestion cold-start race — Phase 86 SKIPPED_TESTS bucket;
//     v2.11+ todo at .planning/todos/pending/2026-05-14-qspec-walkToQuestion-cold-start-race.md.
//
// PRIOR ANCHOR (Phase 86, 2026-05-14) ABSORBED by this regen:
//   9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9
//   113 PASS_LOCKED + 3 DATA_RACE + 40 CASCADE + 2 SKIPPED = 158 tracked.
// -----------------------------------------------------------------------------
```

**Count line update (line 92):**

```typescript
// Phase 86 (current):
/** 113 tests locked PASSING on Phase 86 baseline (…). Phase 86 v2.10 All-Green Suite anchor. Any regression vs. THIS list is a BLOCKER. */

// Phase 87 paste shape:
/** <N> tests locked PASSING on Phase 87 baseline (Phase 86 baseline 113 + <delta from re-classification or cascade-unblock>). Phase 87 v2.10 All-Green Milestone-Close anchor. Any regression vs. THIS list is a BLOCKER. */
```

**4 const-array update shape:** all 4 consts are `ReadonlyArray<string>` of `'<projectName> :: <specFile> > <specTitle>'` strings, alphabetically sorted, one per line, indented 2 spaces, single-quoted with escaped inner single-quotes. Paste verbatim from `regen-output.txt`. SKIPPED_TESTS preserved manually (Phase 86's 2 QSPEC entries — see Pattern 1 SKIPPED gotcha).

**Negative invariants:**
- DATA_RACE_TESTS MUST remain exactly 3 entries (CONTEXT D-09 binding + IMGPROXY_TIED_TITLES match-count assertion enforcement).
- No const may shrink such that a previously-passing test moves to an unclassified pool (CONTEXT D-10 precedent from Phase 86 = "CASCADE no regression; cascade-unblocks ARE PASS_LOCKED promotions, not pool exits").

---

### 3. `sha-identity.mjs` verbatim fork (D-02 strict shape)

**Analog:** `.planning/phases/79-…/post-fix/sha-identity.mjs` (105 lines). Fork verbatim. CONTEXT D-02 explicitly prohibits the Phase 86 `sha-identity-runner.mjs` variant (which has an operator-authorized "if last 2 match, accept" shortcut at lines 67-75).

**Reference excerpt — Phase 79 strict shape (the one Phase 87 forks):**

```javascript
// Source: .planning/phases/79-…/post-fix/sha-identity.mjs:66-105 (verdict + diff emission)
const runs = ['run-1.json', 'run-2.json', 'run-3.json'].map((f) => hashRun(join(__dirname, f)));

const allMatch = runs[0].sha === runs[1].sha && runs[1].sha === runs[2].sha;
const verdict = allMatch ? 'PASS' : 'FAIL';

const out = [
  `Phase 79 Plan 03 Task 5 — 3-run SHA-256 identity check (D-08).`,
  ``,
  `Format: sha256(sorted("<projectName> :: <specFile> > <specTitle>|<status>")).`,
  `Status normalisation: regen-constants.mjs categorizeStatus → {pass, cascade, fail}.`,
  ``,
  ...runs.map((r) => `${r.path}: ${r.sha}  (${r.count} entries)`),
  ``,
  `Verdict: ${verdict}`,
  allMatch ? `All 3 hashes identical — D-08 strict identity gate PASSED. Regen allowed.` : `Hashes differ — D-09 instability protocol triggers (add 3 fresh cold-start runs).`
].join('\n');

writeFileSync(join(__dirname, 'sha256.txt'), out + '\n');
// […diff-emission block if !allMatch…]
process.exit(allMatch ? 0 : 1);
```

**Phase 87 paste-ready header tweak (only the leading comment + the "Phase 79 Plan 03 Task 5" string updates; everything else verbatim):**

```javascript
// Phase 87 Plan 01 Task 1 — 3-run SHA-256 identity check (CONTEXT D-02 strict).
//
// Forked VERBATIM from .planning/phases/79-…/post-fix/sha-identity.mjs.
// Per CONTEXT D-02: no D-09 fallback. The "last 2 match" shortcut from
// .planning/phases/86-…/post-fix/sha-identity-runner.mjs is DELIBERATELY EXCLUDED.
// First-attempt SHA divergence → re-run +3 (per D-02); second divergence → escalate.
//
// Output: writes post-fix/sha256.txt with all 3 hashes + verdict (PASS / FAIL).

// […then the rest of Phase 79's sha-identity.mjs verbatim…]
```

**Anti-pattern (do NOT copy):** `.planning/phases/86-…/post-fix/sha-identity-runner.mjs` lines 67-75 add a `last2Match` operator-authorized acceptance branch. CONTEXT D-02 prohibits this for Phase 87.

---

### 4. `sha256.txt` verdict file (rich narrative shape)

**Analog (best):** `.planning/phases/86-…/post-fix/sha256.txt` (43 lines — most recent precedent with rich narrative). Phase 85 sha256.txt also good (179 lines with aggregate per-run pool counts).

**Reference excerpt — Phase 86 sha256.txt:**

```
Phase 86 Plan 04 Task 2 — 3-run SHA-256 identity check.

Format: sha256(sorted("<projectName> :: <specFile> > <specTitle>|<status>")).
Status normalisation: regen-constants.mjs categorizeStatus → {pass, cascade, fail}.

run-1.json: bb610ca15a48d4cbb21a19a0192591d5300cdfdce67257766c68fd19b6b31adf  (165 entries)  [OPERATOR FLAGGED INVALID — mistake during execution; not part of identity comparison]
run-2.json: ea9c039b0e2182f1f55c9e3ad797de1e93d78b162f5e29aab3e4fda89b8e61db  (165 entries)
run-3.json: 9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9  (165 entries)

Verdict: ALMOST-STRICT (Phase 85 precedent inheritance — party-drawer boundary flake)

Diff (run-2 vs run-3, exactly 1 cell):
-2 voter-app :: specs/voter/voter-detail.spec.ts > should open party detail drawer with info, candidates, and opinions tabs|fail
+3 voter-app :: specs/voter/voter-detail.spec.ts > should open party detail drawer with info, candidates, and opinions tabs|pass

Rationale (per RESEARCH §3.11 + Plan 04 Task 2 escalation path + Phase 85 precedent):
[…full rationale block, ~25 lines…]

Phase 86 v2.10 All-Green Suite anchor = SHA-256 of run-3.json normalized partition:
  9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9

Phase 85 anchor 411e09f5ffb15015ca57a7405619f127f3950c402c082e2599f6782601158ac5 ABSORBED.
```

**Phase 87 paste-ready header (planner fills the 3 SHAs + verdict + rationale after the gate):**

```
Phase 87 Plan 01 Task 1 — 3-run SHA-256 identity check (CONTEXT D-02 strict).

Format: sha256(sorted("<projectName> :: <specFile> > <specTitle>|<status>")).
Status normalisation: regen-constants.mjs categorizeStatus → {pass, cascade, fail}.

run-1.json: <SHA1>  (<N> entries)
run-2.json: <SHA2>  (<N> entries)
run-3.json: <SHA3>  (<N> entries)

Verdict: <STRICT-PASS | FAIL+ESCALATED>
[…rationale block — if STRICT-PASS, document the v2.10-ship anchor;
   if FAIL, document the divergent cell(s) + escalation path per D-02…]

Phase 87 v2.10 All-Green Milestone-Close anchor = SHA-256 of run-3.json normalized partition:
  <NEW SHA>

Phase 86 anchor 9a6d74a3088ec2de933cce9ff40797ec1a1cf8980923f02fbfcaf6f690a30af9 ABSORBED.
```

**Note on D-02 escalation narrative:** Phase 86's "ALMOST-STRICT" verdict explicitly invoked the operator-authorized last-2 shortcut. Phase 87 CANNOT use that language — verdict is binary `STRICT-PASS` or `FAIL+ESCALATED`. The rationale block documents the strict-identity result OR the escalation per D-02 ("Phase 87 is ship-blocker, not carry-forward home").

---

### 5. Per-run capture + stderr + per-file sha256 trio

**Analog (best):** `.planning/phases/86-…/post-fix/run-{1,2,3}.json` + `.sha256` + `-stderr.log` triples.

**Shape:**
- `run-N.json` — Playwright JSON reporter output (~310KB; 165-ish entries). Possibly preceded by `[dotenv@…] injecting env …` banner; the `sha-identity.mjs` `loadRun` handles strip.
- `run-N-stderr.log` — mostly dotenv + Playwright progress noise. NOT load-bearing for the identity gate, but archived for audit transparency.
- `run-N.sha256` — single line `<file-sha256>  <relative-path>` produced by `sha256sum`. NOT the identity hash (which lives in `sha256.txt`); this is the raw-file checksum for audit-trail integrity.

**Production command** (per Research §1 per-run protocol step 5):
```bash
sha256sum .planning/phases/87-…/post-fix/run-${N}.json > .planning/phases/87-…/post-fix/run-${N}.sha256
```

---

### 6. Smoke prep artifacts (OPTIONAL — Task 1a, per Research §1 + Open-Q 1 + Open-Q 5)

**Analog (best):** `.planning/phases/85-…/post-fix/smoke.json` + `smoke-output.txt` + `smoke-stderr.log` + `smoke-commands.txt` (Phase 84 / 85 precedent). Phase 86 omitted these — operator ran cold-starts manually.

**Reference excerpt — Phase 85 `smoke-commands.txt:13-32` (the "CORRECTED SEQUENCE" — encodes Phase 85's LANDMINE-1 audit-trail):**

```
# --- CORRECTED SEQUENCE ---
cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd

# Step 1: Run canonical Likert-only reset chain. This wipes apps/frontend/.svelte-kit/ (dev:clean
# is the last step of the &&-chain).
yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean

# Step 2: AFTER the reset chain, start Vite (it regenerates .svelte-kit/generated/ on first
# request). Background process; wait for http://localhost:5173 to return HTTP 200.
nohup yarn workspace @openvaa/frontend dev > /tmp/vite-dev-85-02-final.log 2>&1 &

# Step 3: Run the 1-run smoke against the now-healthy Vite + freshly-seeded Supabase.
yarn test:e2e --workers=1 --reporter=json > .planning/phases/85-…/post-fix/smoke.json 2> .planning/phases/85-…/post-fix/smoke-stderr.log

# Confirms canonical form per CLAUDE.md §"Yarn arg-forwarding caveat" (BLOCKER 4).
# Negative invariant: the deprecated `db:reset-with-data` alias paired with `--likert-only`
# (the LANDMINE-9 form per CLAUDE.md §"Yarn arg-forwarding caveat") was NOT used.
```

**Phase 87 paste shape** (planner fills script header + run timestamp):

```
# Phase 87 Plan 01 Task 1a — 1-run smoke (prep) before 3-run identity gate.
# Captured: <YYYY-MM-DDTHH:MM:SSZ>
# Pre-flight: Supabase containers were already healthy from prior Phase 86 close. The db:reset below restarts them.
# RECOMMENDATION (Research §1 + Open-Q 5): commit smoke artifacts to preserve audit trail (Phase 84/85 precedent).

cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd

# Step 1: Canonical Likert-only reset chain (CLAUDE.md §"Yarn arg-forwarding caveat" — explicit &&-chain).
yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean

# Step 2: Start Vite AFTER reset (Phase 85 LANDMINE-1).
nohup yarn workspace @openvaa/frontend dev > /tmp/vite-dev-87-smoke.log 2>&1 &

# Step 3: Wait for Vite ready (poll http://localhost:5173).
until curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ | grep -q "200"; do sleep 5; done

# Step 4: 1-run smoke (full suite, JSON reporter).
yarn test:e2e --workers=1 --reporter=json \
  > .planning/phases/87-…/post-fix/smoke.json \
  2> .planning/phases/87-…/post-fix/smoke-stderr.log
```

**Anti-pattern explicit:** the `db:reset-with-data --likert-only` 1-liner does NOT forward `--likert-only` to `db:seed` (CLAUDE.md "Yarn arg-forwarding caveat"). Plan 87 MUST use the 3-step `&&` chain verbatim.

---

### 7. Phase 87 SUMMARY YAML frontmatter + body

**Analog (best):** `.planning/phases/86-…/86-04-SUMMARY.md` (90 lines — most recent precedent with v2.10-anchor / DETERM-NN tagging). Phase 85 `85-02-SUMMARY.md` also matches the shape.

**Reference excerpt — Phase 86 frontmatter (lines 1-11):**

```yaml
---
phase: 86-voter-app-failure-class-cleanup
plan: 04
status: complete
verdict: PASSED-WITH-DEFERRAL
completed: 2026-05-14
duration_min: ~190 (~162 unattended 3-run gate + ~28 orchestration)
requirements: [DETERM-12, DETERM-13, DETERM-14]
anchor_sha: "9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9"
absorbs_anchor: "411e09f5ffb15015ca57a7405619f127f3950c402c082e2599f6782601158ac5"
---
```

**Reference excerpt — Phase 85 02-SUMMARY frontmatter (richer; lines 1-45):**

```yaml
---
phase: 85-variant-project-cascade-rca-fix-investigate-and-close-the-47
plan: 02
subsystem: e2e-testing
tags:
  - determinism
  - playwright-config
  - cascade-decouple
  - v2.10-anchor
  - DETERM-11
  - all-green-suite
dependency_graph:
  requires:
    - 85-01 (RCA findings: chain head = voter-app-popups; H0 confirmed)
    - Phase 84 D-06 atomic-bundle pattern
    …
  provides:
    - Phase 85 v2.10 All-Green Suite anchor SHA `411e09f5ff…`
    - 109 PASS_LOCKED + 3 DATA_RACE + 42 CASCADE partition for diff-playwright-reports.ts
    …
  affects:
    - Phase 86 (DETERM-12 + 2 new variant-FAILs + 32 cascade-victims routed in)
    - Phase 87 (acceptance gate references the new 411e09f5… anchor)
tech_stack:
  added: []
  patterns:
    - …
key_files:
  created:
    - …
---
```

**Phase 87 paste-ready frontmatter shape (CONTEXT D-07 RECOMMENDATION = comprehensive):**

```yaml
---
phase: 87-v2-10-all-green-milestone-close-anchor-capture-a-fresh-3-run
plan: 01
status: complete
verdict: <GREEN | PASSED-WITH-DEFERRAL | ESCALATED>
completed: 2026-MM-DD
duration_min: <actual> (~216 expected — 1 prep + 3 identity runs)
requirements: [DETERM-15]
anchor_sha: "<NEW SHA>"
absorbs_anchor: "9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9"
subsystem: e2e-testing
tags:
  - determinism
  - milestone-close
  - v2.10-anchor
  - DETERM-15
  - all-green-suite
dependency_graph:
  requires:
    - 84 (DETERM-08 + DETERM-09 imgproxy decoupling — DATA_RACE pool shrunk to 3)
    - 85 (DETERM-10 + DETERM-11 variant-cascade RCA + Path B decouple)
    - 86 (DETERM-12 + DETERM-13 + DETERM-14 voter-app FAILURE-CLASS cleanup)
  provides:
    - Phase 87 v2.10 final ship anchor SHA <NEW>
    - <N>/<3>/<N>/<N> (PASS_LOCKED/DATA_RACE/CASCADE/SKIPPED) partition for diff-playwright-reports.ts
  affects:
    - v2.10 milestone close (next: /gsd-complete-milestone v2.10)
    - v2.11 milestone planning
tech_stack:
  added: []
  patterns:
    - 3-run cold-start identity gate (Phase 79 D-13 protocol — strict per Phase 87 D-02)
    - Atomic-bundle close commit (Phase 84 D-06 + Phase 85 + 86 precedent)
    - /gsd-audit-milestone v2.10 handshake (NEW — Phase 87 first invocation)
key_files:
  created:
    - .planning/phases/87-…/post-fix/run-{1,2,3}.json
    - .planning/phases/87-…/post-fix/run-{1,2,3}-stderr.log
    - .planning/phases/87-…/post-fix/run-{1,2,3}.sha256
    - .planning/phases/87-…/post-fix/sha-identity.mjs (forked verbatim from Phase 79)
    - .planning/phases/87-…/post-fix/sha256.txt
    - .planning/phases/87-…/post-fix/regen-output.txt
    - .planning/phases/87-…/87-01-SUMMARY.md
    - .planning/v2.10-MILESTONE-AUDIT.md (produced by /gsd-audit-milestone v2.10)
  modified:
    - .planning/phases/79-…/post-fix/regen-constants.mjs (reportPath + jsdoc)
    - tests/scripts/diff-playwright-reports.ts (jsdoc + 4 const arrays)
    - .planning/STATE.md
    - .planning/ROADMAP.md
metrics:
  pass_locked_delta: "<+N> (Phase 86 → 87)"
  data_race_delta: "0 (D-09 preserved at 3 image-intrinsic CAND-03/CAND-12)"
  cascade_delta: "<delta from Phase 86 baseline 40>"
  skipped_delta: "<delta from Phase 86 baseline 2>"
---
```

**Body section order (Research §8 — comprehensive per CONTEXT D-07):**

1. **Outcome** — 1-paragraph verdict narrative
2. **Anchor SHA evolution** — Phase 73 → 79 → 84 → 85 → 86 → 87 chain
3. **Per-task verdict** — table matching Phase 86 04-SUMMARY "Per-Task Verdict"
4. **Pool Counts** — delta table matching Phase 86 04-SUMMARY "Pool Counts"
5. **Cross-Phase Outcome Summary** — Phase 79 → 87 retrospective table (Research §8 has the canonical row data for Phases 79-87)
6. **v2.11+ Deferrals Filed** — explicit todo-file list (party-drawer + QSPEC walkToQuestion + variant-multi-election + existing STATE.md deferrals)
7. **Audit-Milestone Result** — link to `.planning/v2.10-MILESTONE-AUDIT.md` + verdict + key gaps if any
8. **D-Spec Verification** — table covering CONTEXT D-01..D-09 (per Phase 86 04-SUMMARY pattern)
9. **Phase 86 Hand-Off Inheritance** — party-drawer + QSPEC + variant-multi-election inheritance narrative
10. **v2.10 Shippability Verdict** — explicit PASS/FAIL per D-07 + operator next-step (`/gsd-complete-milestone v2.10`)

---

### 8. `/gsd-audit-milestone v2.10` invocation (Task 4)

**Analog:** `.planning/milestones/v2.9-MILESTONE-AUDIT.md` (per MILESTONES.md line 27 — path precedent). The `/gsd-audit-milestone` skill auto-produces the audit file; Phase 87 only invokes the skill.

**Pre-conditions (Research §4):**
1. All Phase 79-86 VERIFICATION.md files exist. **Open Q 2 risk:** Phase 86 has no `86-VERIFICATION.md` as of 2026-05-15 — Plan 87 Task 4 MUST pre-check `ls .planning/phases/86-…/86-VERIFICATION.md` and, if absent, route as a pre-Task-4 dependency (`/gsd-verify-work 86` invocation).
2. `.planning/STATE.md` reflects Phase 87 complete (progress = 100% for v2.10).
3. `.planning/ROADMAP.md` Phase 87 row marked Complete.
4. The new anchor SHA committed in `diff-playwright-reports.ts` jsdoc.

**Invocation shape:**
```
/gsd-audit-milestone v2.10
```

**Output file (path per MILESTONES.md precedent):** `.planning/v2.10-MILESTONE-AUDIT.md` (likely; the workflow file at line 167 has a doubled-version typo per Research Assumption A4).

**Verdict mapping (Phase 87 D-07):**
- audit `passed` ↔ shippable (unambiguous ship)
- audit `tech_debt` ↔ shippable-with-acceptance (operator reviews debt list and explicitly accepts)
- audit `gaps_found` ↔ ship-blocker, escalate per D-07

**Expected verdict:** likely `tech_debt` (Research §6 reality check — CASCADE = ~40 is the inherited Phase 85 variant-multi-election cascade-tail, NOT clean `passed`). Plan 87 should set this expectation explicitly.

---

## Shared Patterns

### A. Atomic close commit boundary (CONTEXT D-04 + Phase 79 D-10 + Phase 84 D-06 + Phase 85 + 86 precedent)

**Source:** Phase 86 close commit `aa3c766f3` (per ROADMAP git log) — single commit covered ALL of:
- 3-run captures (run-{1,2,3}.json + .sha256 + -stderr.log)
- sha-identity script + sha256.txt
- regen-output.txt
- regen-constants.mjs (modified)
- diff-playwright-reports.ts (modified)
- STATE.md (modified)
- ROADMAP.md (modified)
- SUMMARY.md (created)

**Apply to:** Phase 87 final close commit at end of Task 4 (NOT at end of Task 2 — Research §3 confirmed). The audit-milestone output (`.planning/v2.10-MILESTONE-AUDIT.md`) is committed in the SAME atomic commit, OR in a follow-up commit if the skill commits autonomously.

**Commit message shape (per Phase 86 commit `aa3c766f3` precedent):**
```
docs(87): close Phase 87 — DETERM-15 v2.10 All-Green Milestone-Close Anchor;
          new anchor SHA <NEW SHA>; Phase 86 anchor 9a6d74a308… absorbed
```

**Anti-pattern:** Do NOT split into multiple commits (script edit / array paste / SUMMARY write separately). Atomic-bundle preserves revert semantics; Phase 79 D-10 + Phase 84 D-06 binding.

### B. Per-run cold-start protocol (Research §1 + CLAUDE.md "Seeding local data" + Phase 79 D-13)

**Source:** `.planning/phases/85-…/post-fix/smoke-commands.txt:13-32` (the "CORRECTED SEQUENCE" — encodes the LANDMINE-1 audit trail).

**Apply to:** Every cold-start run in Plan 87 Task 1 (prep run 1a + identity runs 1b × 3). Order is load-bearing:
1. `yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean` (Likert-only canonical chain — `&&` form is REQUIRED per CLAUDE.md "Yarn arg-forwarding caveat")
2. `nohup yarn workspace @openvaa/frontend dev > /tmp/vite-dev-87-run-${N}.log 2>&1 &` (Vite AFTER `dev:clean` per Phase 85 LANDMINE-1)
3. Poll http://localhost:5173 until HTTP 200 (5-min cap; escalate if exceeded)
4. `yarn test:e2e --workers=1 --reporter=json > post-fix/run-${N}.json 2> post-fix/run-${N}-stderr.log`
5. `sha256sum post-fix/run-${N}.json > post-fix/run-${N}.sha256`
6. `pkill -f "yarn workspace @openvaa/frontend dev"` (preserve Supabase between runs per Phase 79 D-14; only restart on imgproxy 502)

**Anti-patterns:**
- `yarn db:reset-with-data --likert-only` (CLAUDE.md "Yarn arg-forwarding caveat" — `--likert-only` does NOT forward through the `&&`-chain; goes to `dev:clean` not `db:seed`).
- Starting Vite BEFORE `dev:clean` (Phase 85 LANDMINE-1 — every HTTP request returns 500).
- Dispatching `yarn test:e2e ... &` from a short-lived subagent (Phase 86 D-07 deviation + Research Pitfall 4 — orphans child processes; orchestrator-level `Bash(run_in_background)` only).

### C. SKIPPED_TESTS manual preservation (Research §7 + Phase 86 Plan 04 Task 2 lesson)

**Source:** `tests/scripts/diff-playwright-reports.ts:261-264` (current 2 QSPEC entries).

**Apply to:** Plan 87 Task 2 (atomic regen). The regen script does NOT emit `SKIPPED_TESTS`; instead `categorizeStatus` maps `skipped → cascade`, so the 2 QSPEC source-skip entries surface in `=== CASCADE_TESTS ===` block. Planner MUST:
1. Manually remove the 2 QSPEC entries from the CASCADE_TESTS paste.
2. Preserve `SKIPPED_TESTS` const at lines 261-264 verbatim (no growth without operator sign-off per CONTEXT D-08).
3. Document this filter step explicitly in Plan 87 Task 2 acceptance criteria.

### D. v2.11+ deferral todo file shape (Phase 86 04-SUMMARY §"v2.11+ Deferrals Filed" + existing todos)

**Source:** `.planning/todos/pending/2026-05-14-party-drawer-boundary-flake-residual.md` + `2026-05-14-qspec-walkToQuestion-cold-start-race.md` (existing files referenced by Phase 86 SUMMARY).

**Apply to:** If Phase 87 surfaces a new v2.11+ deferral (e.g., variant-multi-election deterministic FAILs need their own todo file — Research §8 v2.11+ Deferrals Filed item 3), Plan 87 produces a new `.planning/todos/pending/2026-MM-DD-<short>.md` and references it in 87-01-SUMMARY.md §"v2.11+ Deferrals Filed".

---

## No Analog Found

None — every surface has a Phase 79 / 84 / 85 / 86 precedent. The richest precedent is Phase 86 (most recent and structurally identical).

**Optional-by-discretion surfaces** (Research Open-Q 1 + 5; planner picks per Claude's Discretion in CONTEXT):
- `smoke.json` + `smoke-stderr.log` + `smoke-commands.txt` (prep run audit-trail). Phase 84/85 yes; Phase 86 no. RECOMMENDATION: yes — preserves prep audit trail and validates env health before burning ~162 min on identity gate.

---

## Metadata

**Analog search scope:**
- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/` (full directory listing + read of `regen-constants.mjs` + `sha-identity.mjs`)
- `.planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/post-fix/` (directory listing)
- `.planning/phases/85-variant-project-cascade-rca-fix-investigate-and-close-the-47/post-fix/` (directory listing + read of `smoke-commands.txt` + `sha256.txt` lines 1-80 + `85-02-SUMMARY.md`)
- `.planning/phases/86-voter-app-failure-class-cleanup-investigate-and-resolve-the-/post-fix/` (directory listing + read of `sha-identity-runner.mjs` + `sha256.txt` + `86-04-SUMMARY.md` + `86-PATTERNS.md` excerpt)
- `tests/scripts/diff-playwright-reports.ts` (lines 1-270 read in full)

**Files scanned:** 11 distinct artifact files across 4 predecessor phase directories + 1 production-code surface.

**Pattern extraction date:** 2026-05-15

**Key insight:** Phase 87 is the 4th iteration of the same milestone-close shape (Phase 79 P03 → 84 P01 → 85 P02 → 86 P04). Every script, every artifact, every commit boundary is precedented. The planner should index the precedent and apply, not re-derive.
