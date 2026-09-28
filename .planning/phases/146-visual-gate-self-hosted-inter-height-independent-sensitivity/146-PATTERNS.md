# Phase 146: Visual Gate — Self-Hosted Inter, Height-Independent Sensitivity, Re-baseline — Pattern Map

**Mapped:** 2026-08-25
**Files analysed:** 5 new + 3 modified + 1 asset set
**Analogs found:** 7 / 8 (one genuinely has none — see § *No Analog Found*)

**Scope note.** `146-RESEARCH.md` §§ *Architecture Patterns*, *Code Examples* and *Don't Hand-Roll*
already carry the mechanism, the verified `docker run` invocation, the `unicode-range` values and the
`--update-snapshots=all` semantics. **None of that is restated here.** This document answers only the
narrower question the research did not: *for each new file, which existing in-repo file establishes its
shape, and what must be copied vs. deliberately diverged?* Every analog below was read at the cited
line range in this working tree.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `tests/scripts/visual-container.sh` | script (test infra) | batch / process-orchestration | `tests/scripts/e2e-run.sh` | **exact** (same dir, same role, same author-generation) |
| Node TCP forwarder (committed, `.mjs`) | utility (test infra) | streaming (socket relay) | `apps/supabase/scripts/lint-schema.mjs` (shape only) | **partial** — shape yes, behaviour no (see § *No Analog Found*) |
| `apps/frontend/static/fonts/*.woff2` + `OFL.txt` | static asset + licence | file-I/O (served at origin root) | `apps/frontend/static/images/` + `packages/dev-seed/src/assets/portraits/LICENSE.md` | **role-match** (two analogs, one per half) |
| `apps/frontend/static/fonts/inter.css` | config (stylesheet) | request-response | none in-repo (`static/` holds no CSS) | **no analog** |
| `tests/playwright.noise.config.ts` | config (throwaway overlay) | config | `.planning/milestones/v2.10-phases/84-*/rca-capture/playwright.rca.config.ts` | **role-match, archived precedent** |
| `146-VISUAL-NOISE-LEDGER.md` | doc artefact | ledger/register | `145-NEGATIVE-CONTROL-LEDGER.md` | **exact** |
| `146-NEGATIVE-CONTROL.md` | doc artefact | ledger/register | `145-NEGATIVE-CONTROL-LEDGER.md` + `144-NEGATIVE-CONTROL-LEDGER.md` | **exact** |
| `tests/playwright.config.ts` (mod) | config | — | its own neighbouring comments `:293-320` | in-file convention |
| `visual-regression.spec.ts` (mod) | test | — | its own docblock `:1-44,55-70` + `beforeEach`-less test bodies `:78-95` | in-file convention |
| `staticSettings.ts` (mod) | config | — | its own `font` block `:41-45` | in-file convention |

---

## Pattern Assignments

### 1. `tests/scripts/visual-container.sh` (script, batch)

**Analog: `tests/scripts/e2e-run.sh` — confirmed.** The research's claim holds: it is the only
non-archived shell script under `tests/scripts/` besides `determinism-batch.sh`, both are `-rwxr-xr-x`
(mode 0755 — **commit the new script executable**), and `e2e-run.sh:44-46` explicitly names its own
style ancestor, making the lineage a deliberate house convention rather than an accident.

**Header + shebang + exit-code table** (`e2e-run.sh:1-67`):

```bash
#!/usr/bin/env bash
#
# e2e-run.sh -- Perform exactly ONE preflight-confirmed E2E run and leave behind a
#               complete, machine-readable evidence directory (see phase 138).
#
# Usage:
#   tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/run-01
#   FRONTEND_PORT=5273 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/run-01
#
#   --run-dir <path>   REQUIRED. Where every artifact for this run lands. A relative
#                      path is resolved against the REPO ROOT, never against $PWD, so
#                      the script behaves identically from any working directory.
#
# Prerequisites:
#   - ...
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0  the run completed and Playwright reported success
#   1  Playwright reported failures
#   2  usage error
#   ...
# 130  the run was INTERRUPTED (SIGINT/SIGTERM). Never 0: ...

set -euo pipefail
```

**Repo-root location** (`:70-74`) — note it derives `REPO_ROOT` from the script's own location, never
`$PWD`, with the reason stated inline:

```bash
# Auto-detect paths from script location -- cwd-independence is not optional here:
# the Playwright config already had a spawn-cwd incident (playwright.config.ts:1135-1147).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$TESTS_DIR/.." && pwd)"
```

**Env defaults** (`:80-83`) — `"${VAR:-default}"`, one per line, each with a comment where the value is
non-obvious:

```bash
FRONTEND_PORT="${FRONTEND_PORT:-5273}"
SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
READINESS_TIMEOUT_S="${READINESS_TIMEOUT_S:-120}"
```

**`--help` — yes, and it is self-extracting from the header, not duplicated** (`:102-108`):

```bash
usage() {
  # Delimit the header block rather than hardcoding a line range: the previous
  # `sed -n '2,Np'` truncated the exit-code table the header tells the caller to
  # branch on, and drifted further every time the header grew.
  sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'
}
```

**Arg parsing — `while [ $# -gt 0 ]` + `case`, with a `require_value` guard** (`:110-149`). Copy the
guard verbatim, including its rationale comment; it exists because `shift 2` under `set -euo pipefail`
turns a typo into exit 1, which the exit-code table already assigns to "Playwright reported failures":

```bash
require_value() {
  if [ "$2" -lt 2 ]; then
    echo "e2e-run.sh: $1 requires a value" >&2
    usage >&2
    exit 2
  fi
}

while [ $# -gt 0 ]; do
  case "$1" in
    --project)
      require_value --project $#
      PROJECT="$2"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "e2e-run.sh: unknown argument '$1'" >&2
      usage >&2
      exit 2
      ;;
  esac
done
```

**Reporters, `PLAYWRIGHT_JSON_OUTPUT_FILE`, and exit-code propagation** (`:382-409`) — this is the
single most copy-worthy block, and it is exactly the mechanism D-04's noise readout needs:

```bash
PW_ARGS=(test -c "$TESTS_DIR/playwright.config.ts")
if [ -n "$PROJECT" ]; then
  PW_ARGS+=(--project="$PROJECT")
fi
PW_ARGS+=(--reporter=html,json)

echo "e2e-run.sh: npx playwright ${PW_ARGS[*]}"
set +e
(
  cd "$REPO_ROOT" &&
    PLAYWRIGHT_JSON_OUTPUT_FILE="$RUN_DIR/results.json" \
      PLAYWRIGHT_HTML_OUTPUT_DIR="$RUN_DIR/html" \
      PLAYWRIGHT_HTML_OPEN=never \
      FRONTEND_PORT="$FRONTEND_PORT" \
      npx playwright "${PW_ARGS[@]}" 2>&1
) | tee "$RUN_DIR/stdout.log"
# The PLAYWRIGHT status, not tee's.
PW_STATUS="${PIPESTATUS[0]}"
set -e
echo "$PW_STATUS" > "$RUN_DIR/exit"
```

Note also `:412-420`: after the run it re-reads the *observed* worker/retry posture out of
`results.json` with an inline `node -e`, rather than restating the config — "so the retry/worker claim
can be audited, not taken on trust". Phase 146's ledgers make the same kind of claim about
`--workers=1 --retries=0`; the same read-back belongs in `visual-container.sh`.

**Logging style:** bare `echo "e2e-run.sh: <message>"` to stdout for progress,
`echo "e2e-run.sh: FATAL -- <message>" >&2` before a non-zero exit (`:376-377`). No colour, no `log()`
helper, no timestamps prefix. Prefix every line with the script's own filename.

**Copy this:**
- `#!/usr/bin/env bash`, `set -euo pipefail`, mode 0755.
- The full header block: purpose + Usage examples + Prerequisites + the numbered *Exit codes* table.
- `SCRIPT_DIR`/`TESTS_DIR`/`REPO_ROOT` derivation from `BASH_SOURCE`.
- `usage()` as a `sed`-extraction of the header, and `-h|--help` → `usage; exit 0`.
- `require_value` + the `while`/`case` loop; unknown arg → usage + **exit 2**.
- `"${VAR:-default}"` env defaults with inline rationale.
- `set +e` / `tee` / `PIPESTATUS[0]` / `set -e` for the Playwright invocation, and writing the exit
  code to a file in the run dir.
- `--reporter=html,json` + `PLAYWRIGHT_JSON_OUTPUT_FILE` per-run isolation.

**Diverge here:**
- **Does not own a dev server.** `e2e-run.sh:22-24` and its steps 5/8 spawn, own, and trap-teardown the
  Vite server, and refuse to adopt a foreign listener. `visual-container.sh` runs *inside* a container
  against a *host* server it cannot own — so its Prerequisites block must **assert** the host-side
  sequence (`yarn build` → `yarn db:*` → `yarn workspace @openvaa/frontend dev --host 0.0.0.0`) rather
  than perform it. Say so explicitly in the header; the research flags spawning it as the anti-pattern.
- **Does not run `yarn db:reset`.** Steps 3/4 of `e2e-run.sh` are host-side concerns here.
- **New exit codes.** `e2e-run.sh`'s table is phase-138-specific (3 = db:reset, 4 = readiness poll,
  5 = dev server, 6 = preflight verdict, 7 = preflight-literal drift). Reserve 0/1/2/130 with the same
  meanings and assign fresh numbers for: docker unavailable, image digest mismatch, forwarder failed to
  bind, **egress `curl` control did NOT fail** (a passing curl under `--block-egress` must abort before
  the suite — D-11's "before, not after").
- **New flags** (D-15's required surface): `--update-snapshots=all` passthrough, `--block-egress`,
  `--ci-literal`, and a run-dir. `determinism-batch.sh:7-33` is the precedent for how a looping caller
  documents its flags if D-04's n=10 gets its own wrapper — including its `--runs <N>` strict validation
  and the "a ledger from a scoped run is stamped as scoped so it can never be mistaken for gate
  evidence" convention, which is directly reusable for the measurement-vs-gate distinction in this phase.

---

### 2. The committed Node TCP forwarder

**Established shape for in-repo Node helper scripts** — three data points, all read:

| Path | Extension | Invoked from | Shebang | Typechecked? | Linted? |
|---|---|---|---|---|---|
| `apps/supabase/scripts/lint-schema.mjs` | `.mjs` | `apps/supabase/package.json:13` — `"lint:schema": "node scripts/lint-schema.mjs"` | `#!/usr/bin/env node` | no | via workspace eslint |
| `scripts/assert-unit-test-coverage.mjs` | `.mjs` | root `package.json:25` — `"assert:unit-coverage": "node scripts/assert-unit-test-coverage.mjs"` | — | no | — |
| inline `node -e '…'` | — | `tests/scripts/e2e-run.sh:414` | — | no | no |

**Verdict: `.mjs`, ESM `import`, `#!/usr/bin/env node`, sibling `scripts/` directory.** No `.cjs`
helper exists outside `.yarn/releases`. Every `.js`-ish helper in this repo is `.mjs`.

**Header excerpt to mirror** (`apps/supabase/scripts/lint-schema.mjs:1-20`):

```js
#!/usr/bin/env node

/**
 * Custom schema lint script derived from Supabase Splinter advisors.
 *
 * ...
 *
 * Usage:
 *   node scripts/lint-schema.mjs [--strict]
 *
 * Exit codes:
 *   0 - No errors (warnings may be present)
 *   1 - At least one ERROR-level issue found (or WARNING in --strict mode)
 */

import { execSync } from 'node:child_process';
```

Note `node:`-prefixed builtin imports and the same *Usage* + *Exit codes* docblock discipline the shell
scripts use.

**Is it typechecked by `yarn typecheck:tests`?** **No.** `tests/tsconfig.json:15` is
`"include": ["tests/**/*.ts", "*.ts", "../apps/frontend/src/lib/types/global.d.ts"]` — `.ts` only, and
`tests/scripts/` is not under `tests/tests/`. Root `package.json:35` runs
`tsc -p tests/tsconfig.json --noEmit`. So a `tests/scripts/*.mjs` forwarder is **outside** the
typecheck. It *is* inside `eslint --flag v10_config_lookup_from_file tests` (`package.json:33`), whose
config `tests/eslint.config.mjs:14` applies rules to `files: ['**/*.ts']` — so an `.mjs` there picks up
only `@openvaa/shared-config/eslint`'s base rules. **Placing it at `tests/scripts/tcp-forward.mjs`
therefore costs no typecheck and no Playwright-rule surface.**

**Copy this:** `.mjs` + `#!/usr/bin/env node` + docblock with *Usage* and *Exit codes* + `node:` import
prefixes + `process.argv` parsing (`lint-schema.mjs:29` uses `process.argv.includes('--strict')` — fine
for a flag, but the forwarder takes port pairs, so prefer positional `host:port` args documented in the
Usage block).

**Diverge here:** `lint-schema.mjs` is a one-shot batch process that exits. The forwarder is a
**long-lived server** started in the background by `visual-container.sh` and killed by it. That means it
needs what no existing analog has: a ready signal (print a line the shell can `grep`/wait on, or simply
have the shell poll the port as `e2e-run.sh:360-378` polls the dev server), and clean `SIGTERM`
handling. The research's dual-stack requirement (`server.listen(port)` with no host) has **no in-repo
precedent at all** — see § *No Analog Found*.

---

### 3. `apps/frontend/static/fonts/` — the woff2 files, and `OFL.txt`

**Precedent for committed binary assets under `apps/frontend/static/`: YES, ample.** The directory
already holds only committed binaries and vector assets — nothing generated, nothing gitignored:

```
apps/frontend/static/favicon.png            (8,389 B)
apps/frontend/static/images/hero.png
apps/frontend/static/images/hero-origins.png
apps/frontend/static/images/hero-admin.png
apps/frontend/static/images/hero-candidate.png
apps/frontend/static/images/e2e-test-image-1.jpg
apps/frontend/static/images/error.svg
apps/frontend/static/icons/{list,vote,tip,publisher}.svg
```

**Gitignore / lint check — run, clean.** Root `.gitignore` and `tests/.gitignore` contain no rule
matching `apps/frontend/static/**`; `git check-ignore` returns non-matching for that tree. No
`.gitattributes` LFS rule, no image-lint step. A new `apps/frontend/static/fonts/` subdirectory of
binaries is exactly the existing shape — one subdirectory per asset class (`images/`, `icons/`), so
`fonts/` is the natural third.

**Precedent for a licence file committed beside a vendored third-party asset: YES, exactly one, and it
is a strong one** — `packages/dev-seed/src/assets/portraits/LICENSE.md`, sitting beside
`portrait-01.jpg … portrait-30.jpg`. Its structure (read in full):

```markdown
# Portrait Assets — Licensing Disclosure

**Source:** https://thispersondoesnotexist.com (AI-generated, StyleGAN-based)
**Count:** 30 portraits, `portrait-01.jpg` through `portrait-30.jpg`
**Purpose:** Candidate profile placeholders for the `@openvaa/dev-seed` default template. ...
**Generated on:** 2026-04-23 (one-off maintainer fetch via `packages/dev-seed/scripts/download-portraits.ts`)

## Legal Posture
...
## Intended Use
- **Allowed:** ...
- **NOT recommended:** ...
## Refreshing the Pool
Run `yarn workspace @openvaa/dev-seed tsx scripts/download-portraits.ts` ...
## Switching Sources
...
```

Also note the four package-level `LICENSE` files (`packages/{core,data,matching,filters}/LICENSE`) —
those are *our* outbound licence, a different thing; the portraits file is the inbound-vendored one and
is the correct analog.

**Copy this:**
- Location: licence lives **in the same directory as the assets it covers**, not at repo root.
- The `**Source:** / **Count:** / **Purpose:** / **Generated on:**` provenance header — four bold
  key-value lines before any prose. For Inter this becomes: source `@fontsource/inter@5.3.0` (with the
  sha256s the research recovered), count 4, purpose, and the fetch date.
- A `## Refreshing` section naming the exact command to re-fetch, so the vendoring is reproducible
  rather than archaeological.

**Diverge here:**
- **Filename.** D-09 A names the file `OFL.txt`, not `LICENSE.md`. Keep `OFL.txt` — SIL OFL 1.1 has a
  canonical verbatim text that must be committed **unmodified** (its own terms require it), and Markdown
  headings would be a modification. So: commit `OFL.txt` verbatim, and put the repo-specific provenance
  (source, sha256s, refresh command) in a **separate** short `README.md` beside it, following the
  portraits file's structure. That splits what the portraits analog merges, for a reason the analog did
  not face.
- **Legal posture section is not applicable.** The portraits file exists because its source publishes
  *no* licence. Inter's is unambiguous — replace `## Legal Posture` / `## Switching Sources` with a
  one-line statement of SIL OFL 1.1 and a pointer to `OFL.txt`.

---

### 4. `apps/frontend/static/fonts/inter.css`

**No in-repo analog.** `apps/frontend/static/` contains zero `.css` files, and the app's only
stylesheet (`apps/frontend/src/app.css`) is a bundler-processed Tailwind entry, not a static asset —
its conventions (`@theme`, `--font-weight-*` tokens at `:93,222-223`) do not transfer to a plain
`@font-face` sheet served at origin root.

Use `146-RESEARCH.md` § N-5 for the content (the `unicode.json` `unicode-range` values, woff2-only
`src`). The only in-repo constraint worth carrying: `app.css:226` hardcodes the family as
`--font-base: 'Inter', system-ui, …`, so the `font-family` in every `@font-face` rule **must be exactly
`Inter`** — matched also by `settleFonts`' `document.fonts.check('1em Inter')`.

---

### 5. `tests/playwright.noise.config.ts` (throwaway overlay, **must not be committed**)

**Precedent exists, but only in `.planning/` archives** — two files, both from v2.10 Phase 84:

```
.planning/milestones/v2.10-phases/84-imgproxy-decoupling-.../rca-capture/playwright.rca.config.ts
.planning/milestones/v2.10-phases/84-imgproxy-decoupling-.../rca-capture/playwright.profile.config.ts
.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/repro/playwright.config.ts
```

The convention those establish: an overlay config lives in a **phase-owned subdirectory** (`rca-capture/`,
`repro/`) — *not* at `tests/` root — and is preserved as evidence after the fact.

**⚠ Gitignore finding — this needs care.** Measured:

```
$ git check-ignore -v tests/playwright.noise.config.ts
$ echo $?
1                    # NOT ignored
```

`tests/.gitignore` contains `playwright*/` — a **trailing slash, directories only**. It matches
`tests/playwright-report/`, `tests/playwright-results/`, `tests/playwright/`; it does **not** match a
`.ts` file. Root `.gitignore` covers `playwright-report/`, `playwright-results/`, `raw.json` and
`tests/e2e-runs/` — none of which match either. So a file at `tests/playwright.noise.config.ts` would
show up in `git status` as untracked and is one `git add -A` away from being committed. It would also be
**typechecked** (`tests/tsconfig.json:15` includes `*.ts` at the `tests/` root) and **linted** with the
full Playwright rule set (`tests/eslint.config.mjs:14`, `files: ['**/*.ts']`).

**Recommendation (two options, either is consistent with the repo):**
1. **Preferred — put it under `tests/e2e-runs/`**, which root `.gitignore` already ignores wholesale
   ("Phase 138 per-run E2E evidence dirs … Raw dev-server logs, per-run HTML reports and traces live
   here and are NEVER committed; only the derived, reviewed per-run table under `.planning/` is"). That
   comment states this phase's exact policy for the noise overlay: the config and its raw output are
   throwaway; the derived table in `146-VISUAL-NOISE-LEDGER.md` is the artefact. `tests/eslint.config.mjs:7-11`
   also already ignores `e2e-runs`, so no lint or typecheck surface either. Pass it with
   `npx playwright test -c tests/e2e-runs/146-noise/playwright.noise.config.ts`.
2. If it must sit at `tests/` root, **add an explicit `.gitignore` line for it in the same plan that
   creates it**, and delete the file in the plan's last task.

**`tests/e2e-runs/` is:** a gitignored, already-populated per-run evidence directory (currently holds
`140-cr01-gates`, `140-f3-*`, `140-f9-after`, … from Phase 140). Naming convention is
`<phase>-<purpose>[-<runN>]`. Phase 146's runs should follow it: `146-noise-run01` … `146-noise-run10`,
`146-negctl-1a`, `146-egress`, `146-det-run01` …

**Diverge here:** unlike the archived Phase-84 overlays, this one is **deleted, not preserved** —
D-04's zero-tolerance knob is "a measurement-only configuration, never shipped", and leaving it on disk
invites a later run to pick it up. Preserve the *invocation string* in the ledger instead.

---

### 6 & 7. `146-VISUAL-NOISE-LEDGER.md` and `146-NEGATIVE-CONTROL.md`

**Analogs: `.planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md` (1,050
lines) and `.planning/phases/144-seed-template-strict-typing-unknown-prop-guard/144-NEGATIVE-CONTROL-LEDGER.md`
(1,353 lines).** Both were read; they share one structure, and 145 explicitly inherits it from 144 and
144 from 143/142.1/139. Extract it verbatim.

**The register's columns — 144 and 145 agree exactly, nine of them:**

`145:174` / `144:247`

```markdown
| Row | Site | Injection / instrument | Instrument + command | HEAD | Cache verdict | Exit | Assertion outcome | Outcome |
|---|---|---|---|---|---|---|---|---|
```

(144 names column 3 `Injection / fixture`; 145 generalised it to `Injection / instrument`. Use 145's.)
Both preface the table with the sentence *"Nine columns, in this order: `Row · Site · …`"* — copy that
sentence.

**How a "half" is recorded.** Row IDs encode the class: `-OLD` (the blindness half), `-PRE` (diagnostic),
`-RED` / `-GREEN` (the two halves of a proof pair), plus must-NOT-fire rows and strand-proof rows. Each
pair's GREEN half must carry an **instrument-identity proof** — a `git hash-object`/`git rev-parse` blob
hash showing the instrument is byte-identical to the RED half's, so "this check catches this defect" is
a two-directional measurement rather than a recollection. Verbatim from `145` row `P1-GREEN`:

> **The instrument is byte-identical to `P1-RED`'s:** `git rev-parse` of
> `tests/integration/default-template.integration.test.ts` returns `62b9f0eac777bb…` at **both**
> `2e5262d4a` (the `P1-RED` HEAD) and `eab07013f`, and `git diff 2e5262d4a..HEAD` over that path is empty

**Provenance capture.** Four mechanisms, all mandatory:
1. **Header block** (`145:16-53`) — bulleted: `Phase` · `Requirements` · `Opened by` (which plan, and
   the assertion that every row was created before the first measurement) · `Corpus` (the exact row
   count) · `Protocol source` · `Baseline for OLD halves` · `Run date` · `HEAD at ledger creation` ·
   `Machine` (OS/arch/node versions verbatim) · resolved `$TMPDIR`, because *"a log path that cannot be
   resolved later is not evidence"*.
2. **Restoration blob hashes table** (`145:114-125`) — `| Path | git hash-object at ledger creation |`
   for every file the phase edits, taken *before* any injection exists, plus the ⚠ warning that a
   post-fix injection must record **its own** restore target rather than restoring against the stale
   creation-time hash.
3. **Per-row `HEAD` and `Cache verdict` cells.** The cache-verdict rule (`145:169-172`): turbo-mediated
   rows must show `cache bypass, force executing` and be invoked with `TURBO_FORCE=true`; non-turbo rows
   record `n/a — vitest` / `n/a — REST` / `n/a — playwright`. **"That cell is never left blank."**
4. **The `pending` placeholder discipline** (`145:9-14`): the *only* legal value for an unfilled
   measurement cell is the single lower-case word `pending`; the placeholder count is asserted
   arithmetically (`30 rows × 5 unfilled cells = 150`) and decremented plan by plan as a running
   assertion.

**How a verdict is expressed.** Column 9 (`Outcome`) opens with a bolded verdict token —
`**RED (catch)**`, `**GREEN**`, or, for a blindness half, `**The green IS the finding, not the health.**`
— followed by prose explaining *why the observation is diagnostic rather than anecdotal*. Column 8
(`Assertion outcome`) carries the raw numbers and the **log filename**, never a summary.

**Closing sections, in order** (`145:984-1022` + `144:1102`): `## Completeness` (a
`| Class | Count | Rows |` table asserting the corpus about itself — *"a corpus that is not asserted
about itself can be quietly extended, and an extended corpus is no longer a negative control"*),
`## Final counts`, `### Pairs by outcome class`, `### Non-pair rows` (`| Row(s) | What they are | Result |`),
`## Gates`, `## Residue`. 145 also demonstrates the disclosure norm: `### ⚠ The first gate-1 attempt was
RED, and it is disclosed rather than deleted` (`:873`).

**Copy this:** the nine columns and their order; the row-ID scheme; the header bullet block; the
restoration-blob-hash table; the `pending` discipline with its arithmetic assertion; the byte-identity
proof on every GREEN half; the `## Completeness` self-assertion; disclosure of failed attempts.

**Diverge here — what Phase 146 adds that neither analog has:**
- **A 40-cell noise matrix** (4 baselines × 10 runs, D-04). This does **not** fit the nine-column
  register; it is a *second* table. Give it its own section with a
  `| Run | voter-results-desktop | voter-results-mobile | candidate-preview-desktop | candidate-preview-mobile |`
  shape (10 data rows + a `max` row from which `cap = max × 10` is computed in the open, per D-05). The
  nine-column register still carries one row per *invocation class*; the matrix carries the per-run
  counts. Both cite the same log paths.
- **A font-delta row** (N-1). This belongs in the nine-column register as a diagnostic row (suggest
  `F1-DELTA-PRE`), with `Assertion outcome` carrying all four diff counts including the zeros, and
  `Outcome` stating whether the two `candidate-preview` baselines — recorded at *exactly* 0 px across
  every v2.14 run — moved. Note both analogs record the raw numbers even when the finding is "nothing
  moved"; do the same.
- **Container provenance in the `Machine` bullet.** 145's ledger says *"No container baseline: this
  ledger records vitest, REST, seed-CLI and Playwright exit codes only, never a visual baseline, so the
  milestone's container rule for baselines does not apply."* Phase 146 is the inverse: the `Machine`
  bullet must carry image **RepoDigest** (via `docker image inspect … {{.RepoDigests}}` — M-13 records
  that `docker images --digests` prints `<none>` here), `--platform`, `uname -m`, `/etc/os-release`, and
  `node -v`, so the numbers stay comparable to `136-VISUAL-DISCRIMINATION-EVIDENCE.md:23-24`.
- **The egress controls as rows** (N-8): two of them, `curl` exit 7 and Chromium
  `net::ERR_CONNECTION_REFUSED` — different claims, so two rows, not one.

**Splitting note (Claude's discretion per CONTEXT):** the two analogs are each a single file. Splitting
into `146-VISUAL-NOISE-LEDGER.md` (noise matrix + font delta + the D-05 arithmetic) and
`146-NEGATIVE-CONTROL.md` (the nine-column register: four D-07 halves, the D-06 height-independence
control, the egress controls, the D-14 observation, the six D-17 determinism runs) is consistent — but
each file must then carry its **own** `## Completeness` self-assertion and its own header block. Do not
let one file's corpus assertion cover the other's rows.

---

## Modified Files — the in-file conventions they must respect

### `tests/playwright.config.ts:293-320` (the `maxDiffPixels` comment)

The house style in this region is a `/* … */` block **above** the setting, one blank-line-free
paragraph, stating the *constraint and its source*, not the value. Two live examples:

```ts
  /* Screenshot baselines stored alongside specs in a git-trackable directory */
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}{ext}',

  /* Per-test timeout — 90s ceiling required for full-suite render-pressured fixtures.
   * Under --workers=1 full-suite contention the answer-loop + post-loop waitForURL can
   * exceed lower budgets, so the per-test wrapper timeout is the binding constraint.
   * Single source of the 90s ceiling: TIMEOUTS.testMax (tests/tests/helpers/timeouts.ts). */
  timeout: TIMEOUTS.testMax,
```

Note the continuation-line ` * ` alignment, the em-dash after the short title, and the closing
"single source" pointer. The block being changed (`:314-319`) currently reads:

```ts
  /* Default visual comparison thresholds for toHaveScreenshot */
  expect: {
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixelRatio: 0.01
    }
  },
```

**Copy this:** the `/* … * … */` block form, the em-dash title, and the "single source of X is Y"
closing pointer — here the pointer is to `146-VISUAL-NOISE-LEDGER.md` for the measured noise and the
`cap = max(noise) × 10` arithmetic (D-05), and to `comparators.js:88-96` for the `Math.min` rule.
Per D-03, re-document `maxDiffPixelRatio` as the *small-baseline floor* using the research's concrete
number (`candidate-preview-mobile`, 3,603) rather than in the abstract.

**Diverge here:** the `timeout` comment points at a TS constant; there is no importable constant for
the cap. Write the literal with the arithmetic in the comment — D-02 A requires the derivation to live
at the setting.

### `tests/tests/specs/visual/visual-regression.spec.ts`

**Docblock convention** (`:1-44`): one file-level `/** … */` with `##`-prefixed Markdown subheadings
inside it (`## Re-baselining (see phase 136 plan 05)`), a `Fixtures:` bullet list, and indented literal
commands. That is the block D-15 replaces with a pointer to `visual-container.sh` and D-18/N-2 rewrites.

**`settleFonts` docblock** (`:55-70`) — the function-level convention: rationale first, mechanism
second, then a paragraph beginning "The `check` assertion is deliberate:" that states what failure mode
it converts into a named assertion. N-2 says that final paragraph was never true. **Keep the shape,
replace the claim** — the rewritten paragraph should state the measured coverage table (face status
`error` → caught; zero `@font-face` rules → **not** caught) and hand the uncovered case to the D-12
guard by name.

**⚠ There is no `beforeEach` in this file.** Measured: the spec has four `describe` blocks
(`:78`, `:97`, `:116`, `:136`), each with `describe.configure({ mode: 'serial' })` and a `use({ viewport … })`,
and each test body follows the identical four-step shape:

```ts
voterTest('screenshot matches baseline', async ({ answeredVoterPage: page }) => {
  await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible' });
  await selectElectionByName(page, /Regional/i);
  await settleFonts(page);

  await voterTest.expect(page).toHaveScreenshot('voter-results-desktop.png', {
    fullPage: true,
    animations: 'disabled'
  });
});
```

So the D-12 guard has **no existing `beforeEach` to hook into**. The pattern the file already
establishes for cross-cutting per-test work is a **module-level `async function` taking `page`, called
as the last step before the capture** — exactly `settleFonts`. **Follow that:** add a sibling
`async function guardThirdPartyFonts(page: Page): Promise<void>` with its own rationale docblock, and
call it in all four test bodies. A `page.on('request')` listener must be attached *before* navigation,
which for `answeredVoterPage`/`candidatePreviewPage` fixtures means either a `beforeEach` (new
convention for this file) or attaching inside the fixture — flag this as the one genuine shape decision
in the spec edit, and prefer the four-call `settleFonts` mirror if the guard can be written as a
post-hoc assertion over `page.context()` requests rather than a live listener.

**Also copy:** every `toHaveScreenshot` call passes `{ fullPage: true, animations: 'disabled' }` and
nothing else (D-01 keeps it that way); the two `candidateTest` blocks use bare `expect(...)` while the
two `voterTest` blocks use `voterTest.expect(...)` — an existing inconsistency; **do not "fix" it** in a
phase whose whole point is that the pixels and the invocation stay comparable to v2.14.

### `packages/app-shared/src/settings/staticSettings.ts:41-45`

Read `:1-70`. **Finding: the file has zero comments.** It is one flat `export const staticSettings:
StaticSettings = { … }` object literal, sections in a fixed order (`admin`, `appVersion`, `dataAdapter`,
`colors`, `font`, `supportedLocales`, `analytics`), two-space indent, single quotes, no trailing commas
on the last property. The `font` block:

```ts
  font: {
    name: 'Inter',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
    style: 'sans'
  },
```

**There is no documented convention for changing a default here** — no comment, no changelog marker, no
`@deprecated` tag anywhere in the file. The documentation surface is external: `CLAUDE.md` § Settings
Architecture (*"hardcoded in packages/app-shared/src/settings/staticSettings.ts (colors, locales,
fonts, admin email). Edit these to customize your VAA instance"*) and the type in
`./staticSettings.type`.

**Copy this:** change the one string, change nothing else. Match the existing formatting exactly.

**Diverge here — deliberately, and this is a judgement call for the planner:** D-08's reversibility is
flagged **costly** (a published framework default). Given the file's zero-comment norm, adding the
*first* comment in the file is a visible break. Recommended resolution: keep `staticSettings.ts`
comment-free and record the change's rationale where the file's documentation actually lives —
`CLAUDE.md` § Settings Architecture and/or the new `apps/frontend/static/fonts/README.md`. If the
planner judges an inline comment necessary, keep it to a single `//` line above `font:` pointing at the
phase record, and say in the plan that it is knowingly the file's first comment. Note also that D-08
leaves `name` and `style` untouched (M-6: both dead) — do not tidy them; that is explicitly deferred.

---

## Shared Patterns

### Docblock-with-exit-codes (applies to `visual-container.sh` and the Node forwarder)
**Sources:** `tests/scripts/e2e-run.sh:1-67`, `tests/scripts/determinism-batch.sh:1-45`,
`apps/supabase/scripts/lint-schema.mjs:3-19`.
Every executable helper in this repo opens with *purpose → Usage examples → Prerequisites → numbered
Exit codes*, and the exit-code table is written so *"the caller must be able to branch on the status
alone"*. Both new executables must carry one.

### Evidence over restatement (applies to both ledgers and to `visual-container.sh`)
**Sources:** `e2e-run.sh:412-414` (re-reads observed workers/retries out of `results.json` rather than
restating the config); `145-NEGATIVE-CONTROL-LEDGER.md:20-24` (*"No cell in this register may be filled
from a document, from a prior session, or from RESEARCH.md's measurement tables"*).
Anything the ledger claims about how a run was configured must be read back out of the run's own
machine-readable output, not copied from the config or the plan.

### `.planning/`-derived, `tests/e2e-runs/`-raw
**Source:** root `.gitignore`, the `tests/e2e-runs/` stanza — *"Raw dev-server logs, per-run HTML
reports and traces live here and are NEVER committed; only the derived, reviewed per-run table under
`.planning/` is."*
This settles where every Phase-146 artefact goes: raw Playwright output, JSON reports, the throwaway
noise config → `tests/e2e-runs/146-*`; the derived tables → the two ledgers under `.planning/phases/146-*/`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| Node TCP forwarder (`tests/scripts/tcp-forward.mjs`) — its **behaviour** | utility | streaming | The repo has **no long-lived socket server, no `node:net` usage, and no background-process helper** anywhere outside `node_modules`. `lint-schema.mjs` supplies the *file shape* (`.mjs`, shebang, docblock, `node:` imports) and nothing else. The dual-stack `server.listen(port)` requirement, the `SIGTERM` teardown and the ready-signal handshake with the shell all have to come from `146-RESEARCH.md` § N-3 and Node's own docs. Treat this as the phase's one genuinely new mechanism and give it its own tracer/verification step. |
| `apps/frontend/static/fonts/inter.css` | config (stylesheet) | request-response | `apps/frontend/static/` holds no CSS; `apps/frontend/src/app.css` is a Tailwind-processed bundler entry with no transferable convention. Content comes from `146-RESEARCH.md` § N-5. Only in-repo constraint: family must be exactly `Inter` (`app.css:226`, `settleFonts`). |

---

## Metadata

**Analog search scope:** `tests/scripts/`, `tests/` root, `apps/frontend/static/`, `apps/supabase/scripts/`,
`scripts/`, `packages/**/assets/`, `packages/app-shared/src/settings/`, `.planning/phases/14{4,5}-*/`,
`.planning/milestones/**` (config-overlay precedent only), root + `tests/` `.gitignore` and
`eslint.config.mjs`, root `package.json`, `tests/tsconfig.json`.
**Files read at cited line ranges:** 12. **Commands run for classification (read-only):** `ls`, `find`,
`grep`, `wc`, `git check-ignore`.
**Pattern extraction date:** 2026-08-25.
