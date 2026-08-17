# Phase 151: Ship v0.2 Akita — Review Stack & Commit-History Restructure - Pattern Map

**Mapped:** 2026-08-16
**Files analyzed:** 10 (7 Wave-0 scripts + 1 codemod + 2 markdown record artifacts + 1 skill)
**Analogs found:** 9 / 10 (1 no-analog: `slice-overlap-matrix.sh`)

> **Phase shape:** this phase produces **tooling and records**, not product code. "Role" below is
> read as tooling-role (build script, verify script, codemod, record artifact, skill), and "data flow"
> as what the artifact consumes and emits (git-plumbing streams, file-tree traversal, prose tables).

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `151-.../scripts/build-rename-commit.sh` | build script | git-plumbing stream → commit OID | `tests/scripts/e2e-run.sh` (shell house style only) | role-match (style only) |
| `151-.../scripts/build-slice.sh` | build script | git-plumbing stream → commit OID | `tests/scripts/e2e-run.sh` (style) + `apps/supabase/benchmarks/scripts/swap-schema.sh` | role-match (style only) |
| `151-.../scripts/verify-identity.sh` | verify script (exit-code gate) | two refs → pass/fail + verbatim record | `.claude/scripts/audit-skill-drift.sh` | exact |
| `151-.../scripts/verify-commit-taxonomy.sh` | verify script (exit-code gate) | `git log` → class assertions | `.claude/scripts/audit-skill-drift.sh` | exact |
| `151-.../scripts/hygiene-grep-report.sh` | report script (counts table) | `git grep` → occ/files table | `.claude/scripts/audit-skill-drift.sh` (printf table + counters) | exact |
| `151-.../scripts/slice-overlap-matrix.sh` | report script (pairwise matrix) | file lists → N×N overlap | **none** — see § No Analog Found | none |
| `151-.../scripts/hygiene-codemod.mjs` | codemod (dry-run/apply) | repo file tree → in-place rewrite + report | `apps/frontend/scripts/store-to-state-codemod.mjs` | exact |
| `151-DISPOSITION.md` | record artifact (matrix) | per-item × per-slice verdict + evidence | `.planning/v2.14-E2E-COVERAGE-PLAN.md` § coverage maps | exact |
| `151-BYTE-IDENTITY-PROOF.md` / `151-HYGIENE-REPORT.md` / `151-STACK-MANIFEST.md` | record artifact (evidence) | recorded command output | `.planning/v2.15-PARTIAL-AUDIT.md` (YAML-frontmatter + verdict prose) | role-match |
| `.claude/skills/<ship-procedure>/SKILL.md` (D-25) | skill definition | agent-loaded procedure doc | `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md` + `.claude/skills/architect/SKILL.md` | exact |

---

## Pattern Assignments

### `scripts/hygiene-codemod.mjs` (codemod, tree-traversal → in-place rewrite)

**Analog:** `apps/frontend/scripts/store-to-state-codemod.mjs` (223-line sibling
`flatten-current-codemod.mjs` is the same shape; store-to-state is the tighter template).
**This is the highest-value analog in the phase.** Both are the "two existing in-repo codemods"
RESEARCH.md § Architecture Patterns Pattern 4 refers to.

> **Correction for the planner:** `151-VALIDATION.md` says "`APPLY`-flag convention". The
> in-repo convention is a **`--apply` CLI flag** parsed into a `const APPLY` — there is **no
> `APPLY` environment variable** in either precedent. Write the task as `--apply`.

**CLI-arg / dry-run gate** (`store-to-state-codemod.mjs:93-97`):

```js
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const filesArgIdx = args.indexOf('--files');
const FILES_GLOB = filesArgIdx >= 0 ? args[filesArgIdx + 1] : 'src/**/*.{ts,svelte}';

const REPO_ROOT = resolve(process.cwd());
```

**File enumeration** — `globSync` from `node:fs`, **not** `git ls-files`, with an explicit
empty-match hard failure (`store-to-state-codemod.mjs:56, 155-159`; the flatten sibling adds a
`SKIP_PATH_RE` filter at `:154-155`):

```js
import { readFileSync, writeFileSync, globSync } from 'node:fs';
import { resolve, relative } from 'node:path';
// …
const files = globSync(FILES_GLOB, { cwd: REPO_ROOT });
if (files.length === 0) {
  console.error(`No files matched: ${FILES_GLOB}`);
  process.exit(1);
}
```

> Deviation to plan for: RESEARCH's anti-pattern list requires **NUL-safe** handling because one
> tracked path contains a space. `globSync` sidesteps the parsing hazard entirely (no shell
> tokenisation) — prefer it over `git ls-files` piping, matching the precedent.

**String-literal guard** — the mechanism that keeps a regex codemod from editing program behaviour.
Directly reusable for D-16's "must only touch comment spans" requirement
(`store-to-state-codemod.mjs:99-129`):

```js
function quotedRanges(line) {
  const ranges = [];
  let quote = null, start = -1;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote && line[i - 1] !== '\\') { ranges.push([start, i + 1]); quote = null; }
    } else if (ch === "'" || ch === '"' || ch === '`') { quote = ch; start = i; }
  }
  if (quote) ranges.push([start, line.length]);   // unterminated (multi-line template)
  return ranges;
}
function isInQuotes(col, ranges) { return ranges.some(([s, e]) => col >= s && col < e); }
```

**Per-line rewrite + hit collection** (`store-to-state-codemod.mjs:131-152`):

```js
function rewriteFile(filepath) {
  const original = readFileSync(filepath, 'utf-8');
  const lines = original.split('\n');
  const hits = [];
  const out = lines.map((line, idx) => {
    const ranges = quotedRanges(line);
    let result = line;
    for (const [from, to] of RENAMES) {
      result = result.replace(new RegExp(`\\b${from}\\b`, 'g'), (match, offset) => {
        if (isInQuotes(offset, ranges)) return match;   // skip string literals
        hits.push({ line: idx + 1, from, to });
        return to;
      });
    }
    return result;
  });
  return { original, changed: out.join('\n'), hits };
}
```

**Report shape + write gate + summary** (`store-to-state-codemod.mjs:161-188`) — copy this
verbatim in structure; it is the "greppable proof" D-16 asks for:

```js
console.log(`PHASE 114 — store→state codemod ${APPLY ? '(APPLIED)' : '(DRY-RUN)'}\n`);
for (const filepath of files) {
  const abs = resolve(REPO_ROOT, filepath);
  const { changed, hits } = rewriteFile(abs);
  if (hits.length === 0) continue;
  console.log(`▸ ${relative(REPO_ROOT, abs)}  (${hits.length})`);
  for (const h of hits) console.log(`    L${h.line}  ${h.from}  →  ${h.to}`);
  if (APPLY) writeFileSync(abs, changed);
}
console.log('\n── Summary ──');
console.log(`  Files scanned:  ${files.length}`);
console.log(`  Files changed:  ${filesChanged}`);
console.log(`  Total rewrites: ${totalHits}`);
console.log(`\n${APPLY ? '✓ Changes written.' : 'Dry-run only. Re-run with --apply to write.'}`);
process.exit(0);
```

**Docblock convention** — both precedents open with a long `/** … */` header carrying, in order:
phase + task ID, what/why, an **ordered allowlist rationale**, **HARD EXCLUSIONS with reasons**,
an explicit **idempotency guarantee** paragraph, and a `Usage:` block with three example
invocations (`flatten-current-codemod.mjs:1-52`, `store-to-state-codemod.mjs:1-53`). The hygiene
codemod's header must carry the same five parts — the exclusion set is RESEARCH's Stage-2 residue
(non-comment matches, `console.warn` strings, test titles, the eslint `message:`), and
idempotency must be argued structurally.

**Aggregate summary object** — for the richer multi-pattern report the hygiene codemod needs
(per-pattern counts), use the flatten sibling's shape (`flatten-current-codemod.mjs:157-165`):

```js
const summary = {
  filesScanned: files.length, filesChanged: 0, totalHits: 0,
  filesWithTraps: 0, totalTraps: 0,
  byHandle: Object.fromEntries(HANDLE_FLATTENS.map((h) => [h, 0]))
};
```

Map `byHandle` → `byPattern` keyed on the seven hygiene patterns.

**Warn-only second pass** — `flatten-current-codemod.mjs` PASS 2 (`detectDestructureTraps`,
reported as `⚠ DESTRUCTURE TRAP …` per hit) is the exact precedent for **flagging the D-16 agent
residue without rewriting it**. The hygiene codemod should emit its 126 non-comment-span matches
and 65 TODO/FIXME sites the same way: printed, counted, never written.

---

### `scripts/verify-identity.sh` · `verify-commit-taxonomy.sh` · `hygiene-grep-report.sh` (verify/report scripts)

**Analog:** `.claude/scripts/audit-skill-drift.sh` — the CI-referenced repo script
(`.github/workflows/main.yaml` job `skill-drift-check`). It is the house shape for a
"walk a set, print an aligned table, count, exit non-zero if any bad".

**Header + strict mode + usage-as-comment** (`audit-skill-drift.sh:1-11`):

```bash
#!/usr/bin/env bash
# Audit skill drift: checks if source code targets have changed since a skill was last updated.
# Usage: .claude/scripts/audit-skill-drift.sh [skill-name]
# Without arguments, audits all skills.

set -euo pipefail

SKILLS_DIR=".claude/skills"
DRIFTED=0
CHECKED=0
SKIPPED=0
```

**Aligned report row** (`audit-skill-drift.sh:53, 100-102`) — the printf-column form the hygiene
grep report and the taxonomy report should adopt:

```bash
printf "  %-14s  SKIP  (no targets defined)\n" "$skill_name"
printf "  %-14s  DRIFT  %d commits, %d files since %s\n" \
  "$skill_name" "$total_commits" "$changed_files" "$skill_date"
```

**Failure signalling — counter, banner, exit 1** (`audit-skill-drift.sh:126-135`). This is the
convention every Wave-0 verify script must copy: the summary line is always printed, the
non-zero exit is conditional on the counter, and a human-readable "what to do" precedes it:

```bash
echo ""
echo "---"
echo "Checked: $CHECKED  Drifted: $DRIFTED  Skipped: $SKIPPED"

if [[ "$DRIFTED" -gt 0 ]]; then
  echo ""
  echo "Drifted skills may contain outdated information."
  echo "Review target changes and update skill files as needed."
  exit 1
fi
```

**Set-vs-single argument dispatch** (`audit-skill-drift.sh:112-125`) — directly applicable to
`verify-identity.sh` (whole stack vs one slice) and `hygiene-grep-report.sh` (all paths vs one):

```bash
if [[ $# -gt 0 ]]; then
  skill_dir="$SKILLS_DIR/$1"
  if [[ ! -d "$skill_dir" ]]; then echo "Skill not found: $1"; exit 1; fi
  audit_skill "$skill_dir"
else
  for skill_dir in "$SKILLS_DIR"/*/; do
    [[ -d "$skill_dir" ]] && audit_skill "$skill_dir"
  done
fi
```

> RESEARCH § Code Examples already supplies `verify-identity.sh` verbatim. Wave 0 should lift that
> body and **wrap it in this analog's shell** — the `set -euo pipefail` header comment block, the
> printf-aligned output, and the counter→banner→`exit 1` tail. RESEARCH's draft already ends with
> `… || { echo "MISMATCH ❌"; exit 1; }`, which is the same contract in compressed form; prefer the
> analog's expanded form so the failure carries remediation prose.

---

### `scripts/build-rename-commit.sh` · `build-slice.sh` (build scripts)

**Analog for the mechanism: none in repo** — no existing script does git plumbing/tree surgery.
RESEARCH § Code Examples supplies both bodies verbatim and they were executed successfully this
session; Wave 0 lifts them. **Analog for the house style:** `tests/scripts/e2e-run.sh` — the most
recent, most carefully written shell script in the tree, and the one that states the convention
explicitly.

**The stated convention** (`tests/scripts/e2e-run.sh:41-43`) — quoted because it is the repo's own
declaration of house style for a new shell script:

> `Style follows apps/supabase/benchmarks/scripts/run-benchmarks.sh (shebang form, header block,
> `set -euo pipefail`, script-location-relative paths, "${VAR:-default}" env defaults).`

**Header block: usage, prerequisites, numbered behaviour, exit-code table**
(`tests/scripts/e2e-run.sh:1-68`). The exit-code table is the load-bearing part — build/verify
scripts here document a branchable status:

```bash
#!/usr/bin/env bash
#
# e2e-run.sh -- Perform exactly ONE preflight-confirmed E2E run and leave behind a
#               complete, machine-readable evidence directory (Phase 138, D-10/D-12).
#
# Usage:
#   tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/run-01
# …
# Exit codes -- the caller must be able to branch on the status alone:
#   0  the run completed and Playwright reported success
#   1  Playwright reported failures
#   2  usage error
# …
set -euo pipefail
```

**cwd-independence** (`tests/scripts/e2e-run.sh:70-75`) — mandatory for the slice scripts, which
will be invoked from the phase directory and from the repo root:

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$TESTS_DIR/.." && pwd)"
```

**Env defaults** (`tests/scripts/e2e-run.sh:80-83`) — the `"${VAR:-default}"` form; RESEARCH's
drafts already use it (`BASE="${1:-ac30f132a}"`, `TARGET="${1:-feat-gsd-roadmap}"`) plus the
**required-var** form `: "${GIT_INDEX_FILE:?export a dedicated index path}"`, which has no
in-repo precedent but is the correct idiom and consistent with the analog's spirit:

```bash
FRONTEND_PORT="${FRONTEND_PORT:-5273}"
SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
READINESS_TIMEOUT_S="${READINESS_TIMEOUT_S:-120}"
```

**Usage-from-header, and value-taking-flag guard** (`tests/scripts/e2e-run.sh:101-124`) — adopt
only if the slice scripts take named flags; RESEARCH's drafts use positionals + env, which is
simpler and acceptable:

```bash
usage() { sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'; }
require_value() {
  if [ "$2" -lt 2 ]; then echo "e2e-run.sh: $1 requires a value" >&2; usage >&2; exit 2; fi
}
```

**Phase-specific must-add, no analog:** `set -o pipefail` is already implied by `set -euo pipefail`
but RESEARCH Pitfall 3 calls it out separately because the failure mode (a silently-empty slice)
is invisible. Keep the redundant explicit line from RESEARCH's draft with its `# REQUIRED — see
Pitfall 3` comment; it is documentation, not duplication.

**Script placement:** repo convention is **co-located with the consumer** — `.claude/scripts/`
(agent/CI tooling), `tests/scripts/`, `apps/supabase/scripts/`, `apps/supabase/benchmarks/scripts/`,
`apps/frontend/scripts/`. There is **no repo-root `scripts/`**. RESEARCH's proposed
`.planning/phases/151-…/scripts/` has direct precedent:
`.planning/milestones/v2.7-phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs` — a phase-local
script directory beside the phase's PLAN/SUMMARY files. Its header shows the phase-local
convention (`diff-parity.mjs:1-6`):

```js
#!/usr/bin/env node
// Phase 65 inline parity diff — reads two playwright-report.json files, counts
// tests by status, and exits 0 if counts match the v2.6 contract within ±1.
// Reusable for v2.7+ parity gates. Anchored on Phase 64's flattenReport pattern
// (regen-constants.mjs:26-50) and Phase 64's PASS verdict in diff.md
// ("Baseline: 67p / 1f / 34c, Post: 67p / 1f / 34c, PARITY GATE: PASS").
```

Note the one-line `//` header (phase-local scripts) vs. the long block header (shipped scripts) —
and note that this header is itself the kind of dense planning citation D-14 collapses. Because
the phase scripts live under `.planning/`, they are **D-15 exempt** and may keep full citations.

---

### `151-DISPOSITION.md` (record artifact, per-item × per-slice matrix)

**Analog:** `.planning/v2.14-E2E-COVERAGE-PLAN.md` — the repo's canonical
requirement × verdict × evidence table, and the closest thing to a disposition matrix that exists.
Match the shape rather than inventing one.

**Table header** (`v2.14-E2E-COVERAGE-PLAN.md:59-60`):

```markdown
| Req | Verdict | Confirming-or-target spec path | Action | Evidence / notes |
|-----|---------|-------------------------------|--------|------------------|
```

**Row shape** (`v2.14-E2E-COVERAGE-PLAN.md:61, 68`) — note the house conventions the planner should
carry over: bolded ID, bolded verdict token, a `— confirmed covered, no new code` qualifier on
positives, and evidence given as **file path + line numbers**, never as a claim:

```markdown
| **EPERM-08** `matching.minimumAnswers` gating results availability | **COVERED** — confirmed covered, no new code | `tests/tests/specs/voter/voter-journey.spec.ts` | none | Min-answers gate confirmed: questions-intro `questionsStart` shows `/Answer 4/` and is **disabled** until enough categories selected (lines 493–498); results-link/banner is disabled before the gate and enabled after enough answers, and re-disables when an answer is deleted (lines 600–620). |
```

**Verdict vocabulary in use:** `**COVERED**` / `**PARTIAL**` / `**MISSING**`, with
`**DEFERRED → <phase>**` as an action token. D-17 specifies **met / fixed / deferred** plus D-20's
**not-swept (with reason)**. Keep D-17's vocabulary but adopt the analog's **bold-token +
em-dash qualifier + parenthetical evidence-with-line-numbers** formatting.

**Header block** (`v2.14-E2E-COVERAGE-PLAN.md:1-5`) — created/phase/status with an explicit
approval-gate line; `151-DISPOSITION.md` should carry the same, with the D-24 suite result and the
D-23 tree hashes as its status evidence:

```markdown
# v2.14 E2E Coverage Plan

**Created:** 2026-06-14
**Phase:** 118 — E2E Coverage Audit + Coverage Plan
**Status:** ✅ APPROVED (operator, 2026-06-14) — Phase 118 gate CLOSED; …
```

**Also copy:** the `## CRITICAL — Catalog path correction` blockquote-plus-two-column-table pattern
(`v2.14-E2E-COVERAGE-PLAN.md:20-27`) for recording stale-path findings — checklist item 7's 12-file
/ 18-occurrence `docs/src/routes/…` set is exactly this shape:

```markdown
| Stale reference | ACTUAL path (verified on disk) |
|-----------------|-------------------------------|
| `apps/frontend/tests/` | `tests/` (repo root) |
```

---

### `151-BYTE-IDENTITY-PROOF.md` · `151-HYGIENE-REPORT.md` · `151-STACK-MANIFEST.md` (evidence records)

**Analog:** `.planning/v2.15-PARTIAL-AUDIT.md` — the house shape for a machine-parseable evidence
record: **YAML frontmatter carrying the structured verdict**, then prose.

**Frontmatter** (`v2.15-PARTIAL-AUDIT.md:1-13`):

```yaml
---
milestone: v2.15
milestone_name: Trustworthy Foundations — Guards, Seed Data & CI Coverage
audit_type: partial
audit_scope: Phases 137-139 only (3 of 14 complete); …
audited: 2026-08-14
status: tech_debt
scores:
  requirements: 7/7 in-scope satisfied …
  phases: 3/3 verified
gaps:
  requirements: []
---
```

For `151-BYTE-IDENTITY-PROOF.md` the equivalent keys are the two tree hashes, the changed-file
count, the target ref and the stack tip — i.e. the structured form of D-23's two one-liners, with
the verbatim command output below in a fenced block. **Note the analog's habit of recording an
*unproven* claim as unproven** (`v2.15-PARTIAL-AUDIT.md` tech_debt item T-137-11: "has never been
observed passing on a real GitHub Actions runner … Blocked by construction"). That is precisely
D-20's "declared elsewhere" discipline and D-18's "never launder a blind spot as met" — the record
already has house precedent for it.

---

### `.claude/skills/<ship-procedure>/SKILL.md` (D-25, written last)

**Analog:** `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md` (content-bearing)
and `.claude/skills/architect/SKILL.md` (frontmatter completeness).

**Frontmatter — content-bearing skill** (`spike-findings-…/SKILL.md:1-4`). Note: **no `targets:` key**,
which makes `audit-skill-drift.sh` report it `SKIP (no targets defined)`:

```markdown
---
name: spike-findings-voting-advice-application-gsd
description: Implementation blueprint from spike experiments. Requirements, proven patterns, and verified knowledge for two domains — (1) … (2) …. Auto-loaded during implementation work.
---
```

**Frontmatter — with drift targets** (`architect/SKILL.md:1-5`). The ship-procedure skill **should
declare `targets:`** so `audit-skill-drift.sh` (the CI `skill-drift-check` job) actually audits it —
an empty `[]` is the opt-out:

```markdown
---
name: architect
description: 'Domain expert for the whole OpenVAA application architecture. … Activate when planning cross-cutting changes, …'
targets: []
---
```

The parser that consumes this is `audit-skill-drift.sh:24-49` — a hand-rolled YAML frontmatter
reader that accepts only `targets:` followed by `  - <path>` lines, or an inline `[]`. Write the
frontmatter to that grammar exactly; anything fancier is silently skipped.

**Body shape** (`spike-findings-…/SKILL.md:6-8+`): opens with a `<context>` XML-ish block containing
`## Project: <name>`, a prose statement of the problem domain, an enumerated session/source list,
and a bolded "second-domain context" paragraph per domain. Directory layout of that skill —
`SKILL.md` + `sources/<NNN-slug>/<artifact>` — is the precedent for the ship skill carrying the
six Wave-0 scripts as its `sources/`.

**Also note** `.claude/skills/BOUNDARIES.md` exists alongside the skill directories — check it
before adding a new skill so the new skill's scope does not overlap a declared boundary.

---

## Shared Patterns

### Strict-mode shell header
**Source:** `.claude/scripts/audit-skill-drift.sh:1-6`, `tests/scripts/e2e-run.sh:1-68`
**Apply to:** all six `scripts/*.sh`
`#!/usr/bin/env bash` → comment block (purpose, `Usage:` line, exit-code table for anything a caller
branches on) → blank line → `set -euo pipefail` → counters/config as UPPER_SNAKE with
`"${VAR:-default}"`.

### Counter → summary banner → conditional `exit 1`
**Source:** `.claude/scripts/audit-skill-drift.sh:126-135`
**Apply to:** `verify-identity.sh`, `verify-commit-taxonomy.sh`, and the catch-all-empty assertion
in `build-slice.sh`. The summary prints unconditionally; the exit code is derived from a counter;
remediation prose precedes the exit.

### Dry-run-by-default with `--apply`
**Source:** `apps/frontend/scripts/store-to-state-codemod.mjs:93-97, 185-188`;
`apps/frontend/scripts/flatten-current-codemod.mjs:80-84`
**Apply to:** `hygiene-codemod.mjs`. Default run writes nothing and exits 0; the final line always
states which mode ran.

### Evidence as path + line numbers, never as claim
**Source:** `.planning/v2.14-E2E-COVERAGE-PLAN.md:61-88` (every cell); `.planning/v2.15-PARTIAL-AUDIT.md`
tech_debt entries
**Apply to:** `151-DISPOSITION.md` and every `[VERIFIED: …]` annotation in the phase records. The
in-repo convention is `` `path/to/file.ts` (lines 493–498) `` inline in the evidence cell.

### Declaring a blind spot rather than laundering it
**Source:** `.planning/v2.15-PARTIAL-AUDIT.md` frontmatter `tech_debt` → T-137-11
**Apply to:** every D-20 "not-swept" cell and every D-18 reach check. Precedent exists for recording
"blocked by construction / never observed" as a first-class verdict.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `scripts/slice-overlap-matrix.sh` | report script | N file lists → pairwise N×N overlap counts | No pairwise-set-comparison reporter exists anywhere in the repo. Nearest neighbour is `.planning/milestones/v2.7-phases/65-…/scripts/diff-parity.mjs` (two-report comparison, `comm`-like semantics in JS) — but it compares **two** artifacts on **status counts**, not **N** file-sets on **membership**. RESEARCH § Slice Anatomy supplies the primitive (`comm -12` over sorted `--name-only` lists); adopt the `audit-skill-drift.sh` printf-table + counter shell for its output and write the pairing loop fresh. |
| `scripts/build-rename-commit.sh`, `scripts/build-slice.sh` | build script | git-plumbing | **Mechanism** has no analog — no script in the repo touches `git update-index`, `write-tree`, or `commit-tree`. Bodies come verbatim from `151-RESEARCH.md` § Code Examples (executed and measured this session). Only the **shell style** is analog-driven (`tests/scripts/e2e-run.sh`). |

---

## Metadata

**Analog search scope:** `.claude/scripts/`, `.claude/skills/`, `apps/frontend/scripts/`,
`apps/supabase/scripts/`, `apps/supabase/benchmarks/scripts/`, `tests/scripts/`,
`.planning/*.md`, `.planning/milestones/**/scripts/`, `.planning/archive/`
**Files scanned:** 34 tracked `.sh`/`.mjs` outside `node_modules` + 18 `.planning` root artifacts +
8 skill directories
**Analogs read in full or in targeted ranges:** 9
**Pattern extraction date:** 2026-08-16
