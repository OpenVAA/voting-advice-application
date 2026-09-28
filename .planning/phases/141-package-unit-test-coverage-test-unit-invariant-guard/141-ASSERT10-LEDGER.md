# Phase 141 — ASSERT-10 Injection Ledger: every branch of the shipped teardown-prefix guard, run red

- **Phase:** 141 (package-unit-test-coverage-test-unit-invariant-guard)
- **Requirement:** ASSERT-10
- **Plan:** `141-04-PLAN.md` (wave 1)
- **Guard under test:** `tests/playwright.config.ts:138-240` — **read-only to this phase (D-15)**
- **Guard built by:** phase 140, commit `abe1fabb0` (hardened by `bdb759575` IN-01, `c15e444e8` IN-02)
- **Run:** 2026-08-18 (UTC; first command issued `2026-08-18T15:58:40Z`)
- **HEAD at time of run:** `9b6d939a1`
- **Machine:** developer Mac, host Node + host Playwright. No container: this ledger records config-load
  exit codes only, never a visual baseline, so the milestone's container rule for baselines does not apply.

---

## Why this ledger exists — and what it does NOT claim

**This phase did not build the guard.** The guard already shipped at HEAD when Phase 141 opened. It was
landed by **Phase 140 itself** in `abe1fabb0`, then hardened twice (`bdb759575`, `c15e444e8`). Decision
**D-15** consequently makes `tests/playwright.config.ts` **read-only** for the whole of Phase 141, and
supersedes D-03/D-04/D-05, which had specified building a guard that already existed. Not one byte of
that file was modified by this plan — asserted below, and again at the end of plan 141-04's second task.

What Phase 140 shipped but never produced is the other half of the milestone's standing acceptance rule:

> **Standing acceptance rule for every v2.15 phase:** prove the guard fails before claiming it guards —
> negative control run twice (once against the old assertion to demonstrate blindness, once against the
> new one to demonstrate the catch).

A guard observed only green is indistinguishable from a guard that cannot fail. Phase 140 read the code
and accepted it; nobody ever made it throw. **This ledger is that missing evidence and nothing more.**
Phase 141's contribution to ASSERT-10 is (a) these nine rows and (b) the correction of three committed
statements that said the guard was never built. Construction belongs to Phase 140.

For an already-shipped guard the "demonstrate blindness" half cannot be a pre-change assertion — there is
no pre-change assertion left to run. Its faithful analogue is the **legitimate-exclusion and clean-baseline
pair**: the guard must be shown *not* to fire where it must not. Rows A, E, G2 and I are that half; rows
B, C, D, F and G1 are the catch half.

**Provenance of every row below.** Every exit code, every quoted message and every scan number in this
document was produced by a command executed inside plan 141-04, on the date above. `141-RESEARCH.md`
§ Injection Ledger is cited as the **template for this document's shape**, and is never the source of
truth for any outcome here — its rows were re-run, not copied.

**The guard fires at CONFIG LOAD, not in a test and not in setup.** Every row uses
`playwright test --list`, which resolves the config and enumerates tests but does **not** run
`globalSetup` and does not execute a single spec body. A check living in a fixture, a setup project or a
spec would be invisible to every command in this ledger. The stack traces recorded below terminate in
`loadUserConfig` / `loadConfigFromFile` (`node_modules/playwright/lib/common/configLoader.js`), which is
the direct observation of that placement rather than an inference from where the code sits in the file.

**Injection isolation.** Each row's scratch file was removed with a targeted `rm` of the exact path this
task created, and `git status --porcelain -- tests` was asserted empty between rows. **No `git checkout .`,
no `git stash`, no `git clean` was used at any point** — a sibling wave-1 plan (141-01) was operating
under `packages/` concurrently, and any blanket revert would have destroyed its live injection.

---

## The command

Every injection row uses the identical command:

```
npx playwright test -c ./tests/playwright.config.ts --list
```

**A note on "first line of output".** The literal first line of every run is dotenv's own banner
(`[dotenv@17.3.1] injecting env (25) from .env …`), which carries no verdict. The "first line" recorded
per row below is therefore the first **verdict-bearing** line — the `Error:` line for a throw, the
`Total:` line for a pass — with the dotenv banner filtered. This is stated rather than silently elided,
because a reader reproducing these rows will see the banner first and should not think the transcript
was doctored.

---

## Row register

| Row | Branch exercised | Injection site | Exit | Outcome |
|-----|------------------|----------------|------|---------|
| A | none — clean baseline | — | **0** | `Total: 143 tests in 94 files` |
| B | equality collision (`:220` → throw `:221`) | `tests/tests/setup/perm/zz-scratch-b.teardown.ts` | **1** | names both files + the shared prefix |
| C | containment overlap (`:230` → throw `:232`) | `tests/tests/setup/perm/zz-scratch-c.teardown.ts` | **1** | names shorter + longer file, quotes the `LIKE` scan |
| D | unparsed-declaration completeness (`:206` → throw `:207`) | `tests/tests/setup/perm/zz-scratch-d.teardown.ts` | **1** | names the file |
| E | legitimate exclusion — must NOT fire | `tests/tests/setup/perm/zz-scratch-e.teardown.ts` | **0** | `Total: 143 tests in 94 files` |
| F | enumeration scope outside `setup/` (`:220` → throw `:221`) | `tests/tests/zz-scratch-f.teardown.ts` | **1** | names a file with no `setup/` path segment |
| G1 | empty prefix **with** helper call → completeness (`:207`) | `tests/tests/setup/perm/zz-scratch-g.teardown.ts` | **1** | completeness branch, **not** containment |
| G2 | empty prefix **without** helper call → legitimate exclusion | `tests/tests/setup/perm/zz-scratch-g.teardown.ts` | **0** | `Total: 143 tests in 94 files` |
| H | equality semantics + ASCII scan (not an injection) | — | **0** | 0 non-ASCII, 0 normalisation-sensitive, of 27 |
| I | clean revert | — | **0** | `Total: 143 tests in 94 files` — identical to row A |

---

## Row A — clean baseline (blindness half)

**Injection:** none. Tree at HEAD `9b6d939a1`, `git status --porcelain -- tests` empty.

**Command:** `npx playwright test -c ./tests/playwright.config.ts --list`

**Exit code:** `0`

**First verdict-bearing line (here, the final line — the suite total):**

```
Total: 143 tests in 94 files
```

**This number is this plan's restoration target.** Row I must reproduce it exactly, or the tree was not
restored and some row's scratch file survived.

Per **D-02** the 27 declared prefixes are currently distinct and mutually non-prefixing, so this row was
expected to pass with no remediation commit ahead of it. It did. No remediation was performed inside this
phase, and none was owed.

---

## Row B — equality collision (catch half)

**Branch:** `a.prefix === b.prefix` at `tests/playwright.config.ts:220`, throwing at `:221`.

**Injected declaration (verbatim, `tests/tests/setup/perm/zz-scratch-b.teardown.ts`):**

```ts
// TRANSIENT ASSERT-10 injection (row B) — removed by rm in the same task.
import { test as teardown } from '@playwright/test';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-bankauth-notloc-';

teardown('zz scratch b', async () => {
  await runTeardownAsserted(PREFIX);
});
```

This is the ROADMAP Phase 141 success-criterion 5 injection performed literally: *"temporarily duplicating
an existing prefix (e.g. pointing a scratch teardown at `e2e-bankauth-notloc-`)"*.

**Command:** `npx playwright test -c ./tests/playwright.config.ts --list`

**Exit code:** `1`

**Message (verbatim):**

```
Error: Teardown prefix collision: 'setup/candidate/bank-auth-journey.teardown.ts' and 'setup/perm/zz-scratch-b.teardown.ts' both declare PREFIX = 'e2e-bankauth-notloc-'. The two data-teardown projects are not guaranteed to be ordered relative to each other, so their runTeardownAsserted before/after row counts can race nondeterministically (review CR-01). Give one of them its own dedicated prefix — and, if it reuses a shared dev-seed template, its own dedicated template registration too (see packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts for the pattern).
    at file:///Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/playwright.config.ts:221:13
    at ModuleJob.run (node:internal/modules/esm/module_job:430:25)
    at onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:661:26)
    at requireOrImport (…/node_modules/playwright/lib/transform/transform.js:223:12)
    at loadUserConfig (…/node_modules/playwright/lib/common/configLoader.js:107:46)
    at loadConfig (…/node_modules/playwright/lib/common/configLoader.js:119:22)
    at loadConfigFromFile (…/node_modules/playwright/lib/common/configLoader.js:331:10)
    at runTests (…/node_modules/playwright/lib/program.js:197:18)
```

**Throw site:** `tests/playwright.config.ts:221:13`. The frames below it are the decisive part of this
row: `loadUserConfig` → `loadConfig` → `loadConfigFromFile`, i.e. the failure happened while Playwright
was *loading the config file*, before any project was constructed and before any test was listed. This is
the direct observation that D-05's config-load placement holds.

**Fails BY NAME:** the message names both colliding files and the shared prefix, which is exactly the
property ROADMAP criterion 5 demands ("fails **by name**").

**Revert:** `rm tests/tests/setup/perm/zz-scratch-b.teardown.ts`; `git status --porcelain -- tests` → empty.

---

## Row C — containment overlap, not equality (catch half)

**Branch:** `a.prefix.startsWith(b.prefix) || b.prefix.startsWith(a.prefix)` at
`tests/playwright.config.ts:230`, throwing at `:232`.

This is the branch that distinguishes D-03's containment rule from plain equality, and it is the branch
that matters most in practice: `bulk_delete` matches by `external_id LIKE '<prefix>%'`, so a prefix that
merely *contains* another silently deletes the other's rows. Plain equality checking would pass this row.

**Injected declaration (verbatim, `tests/tests/setup/perm/zz-scratch-c.teardown.ts`):**

```ts
// TRANSIENT ASSERT-10 injection (row C) — removed by rm in the same task.
import { test as teardown } from '@playwright/test';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-orgmatch';

teardown('zz scratch c', async () => {
  await runTeardownAsserted(PREFIX);
});
```

`'e2e-perm-orgmatch'` is a **strict** string-prefix of the shipped `'e2e-perm-orgmatch-'`
(`perm-org-matching.teardown.ts:13`) and equal to no declared prefix — so only the containment branch can
catch it. It was chosen because it is a prefix of exactly ONE declared prefix, making the reported pair
deterministic (`'e2e-perm-not'`, by contrast, is a prefix of both `e2e-perm-notloc-` and `e2e-perm-notif-`,
and which pair the nested loop reported first would depend on `readdirSync` order).

**Command:** `npx playwright test -c ./tests/playwright.config.ts --list`

**Exit code:** `1`

**Message (verbatim):**

```
Error: Teardown prefix overlap: 'setup/perm/zz-scratch-c.teardown.ts' declares PREFIX = 'e2e-perm-orgmatch', which is a string-prefix of 'setup/perm/perm-org-matching.teardown.ts's PREFIX = 'e2e-perm-orgmatch-'. Both are matched by the SAME `external_id LIKE 'e2e-perm-orgmatch%'` scan, so the shorter prefix's teardown/count also touches the longer prefix's rows (review CR-01 + WR-06). Choose non-overlapping prefixes.
    at file:///Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/playwright.config.ts:232:13
    at ModuleJob.run (node:internal/modules/esm/module_job:430:25)
```

**Throw site:** `tests/playwright.config.ts:232:13`.

The message identifies the shorter and the longer file *by role*, not just by name, and reproduces the
concrete `external_id LIKE 'e2e-perm-orgmatch%'` scan that would do the damage — the reader is told the
mechanism, not merely that a rule was broken.

**Revert:** `rm tests/tests/setup/perm/zz-scratch-c.teardown.ts`; `git status --porcelain -- tests` → empty.

---

## Row D — unparsed-declaration completeness (catch half)

**Branch:** `unparsedTeardownPrefixFiles.length > 0` at `tests/playwright.config.ts:206`, throwing at
`:207`. This is the **WR-03** check that **D-04 never contemplated** — an enumeration guard with no
completeness check is the same failure mode as fake-guard finding F4 (a file that looks covered, is not
covered, and says nothing).

**Injected declaration (verbatim, `tests/tests/setup/perm/zz-scratch-d.teardown.ts`):**

```ts
// TRANSIENT ASSERT-10 injection (row D) — removed by rm in the same task.
import { test as teardown } from '@playwright/test';
import { runTeardownAsserted } from '../shared/assertTeardown';

let PREFIX = 'e2e-zz-scratch-d-';

teardown('zz scratch d', async () => {
  await runTeardownAsserted(PREFIX);
});
```

`let` rather than `const` — a mutable binding, which the extraction regex at `:199` deliberately does not
accept, while the file *does* call `runTeardownAsserted(`. Without the completeness branch this file's
prefix would simply be absent from the uniqueness comparison and a future collision on it would be
invisible.

**Command:** `npx playwright test -c ./tests/playwright.config.ts --list`

**Exit code:** `1`

**Message (verbatim):**

```
Error: Teardown prefix guard could not parse a `const PREFIX = '...'` declaration in setup/perm/zz-scratch-d.teardown.ts, but the file calls runTeardownAsserted — so its prefix is NOT covered by the uniqueness/overlap check below and a collision could reappear silently (review WR-03; same enumeration-drift shape as fake-guard finding F4). Make the declaration match `const PREFIX = '...'` (a plain top-level string literal), or widen the regex above to cover the new shape.
    at file:///Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/playwright.config.ts:207:9
    at ModuleJob.run (node:internal/modules/esm/module_job:430:25)
```

**Throw site:** `tests/playwright.config.ts:207:9`. The message names the offending file and offers both
remedies (fix the declaration, or widen the regex), which is the same error register the two sibling
guards in this file use.

**Revert:** `rm tests/tests/setup/perm/zz-scratch-d.teardown.ts`; `git status --porcelain -- tests` → empty.

---

## Row E — the legitimate exclusion (blindness half; the decisive row)

**Branch:** none — the guard must **not** fire.

A `*.teardown.ts` with no `const PREFIX` declaration **and** no `runTeardownAsserted(` call is a
legitimate exclusion, not a completeness failure: it performs no prefix-scoped delete, so it has no
prefix to collide with. **This shape ships today** —
`tests/tests/setup/candidate/candidate-journey.teardown.ts` only unregisters an auth user (see
`assertTeardown.ts`'s "27 of 28" accounting). A guard that fired here would be a false positive against a
file already in the tree, and would have to be reverted the day it landed.

**Injected declaration (verbatim, `tests/tests/setup/perm/zz-scratch-e.teardown.ts`):**

```ts
// TRANSIENT ASSERT-10 injection (row E) — removed by rm in the same task.
// Reproduces the candidate-journey.teardown.ts shape: no prefix-scoped delete,
// so no `const PREFIX` declaration and no runTeardownAsserted call.
import { test as teardown } from '@playwright/test';

teardown('zz scratch e', async () => {
  // no prefix-scoped delete
});
```

**Command:** `npx playwright test -c ./tests/playwright.config.ts --list`

**Exit code:** `0`

**Final line:**

```
Total: 143 tests in 94 files
```

Note that the total is **unchanged** from row A: the scratch file matches no project's `testMatch`
(they are file-specific regexes such as `/base\.teardown\.ts/`), so it contributed no test and no listed
file. The exit-0 here is the guard declining to fire, not the file being invisible to the config — the
guard reads every `*.teardown.ts` under `TESTS_DIR` regardless of whether any project runs it, as row F
demonstrates.

**Revert:** `rm tests/tests/setup/perm/zz-scratch-e.teardown.ts`; `git status --porcelain -- tests` → empty.

---

## Row F — enumeration scope: outside `setup/` (catch half)

**Branch:** equality, `tests/playwright.config.ts:220` → throw `:221` — but the point of this row is the
**scan scope** (review **IN-02**), not the branch.

All 28 `*.teardown.ts` files live under `setup/` today, so a `setup/`-only scan would look identical in
every other row of this ledger. It would nonetheless be wrong: the teardown projects' `testMatch`
patterns are **unanchored** regexes evaluated against the inherited `testDir` (`TESTS_DIR`), so a
`*.teardown.ts` added anywhere under it is picked up and run by Playwright. This row proves the scan
matches the runner's own scope.

**Injected declaration (verbatim, `tests/tests/zz-scratch-f.teardown.ts` — directly under `TESTS_DIR`,
no `setup/` segment):**

```ts
// TRANSIENT ASSERT-10 injection (row F) — removed by rm in the same task.
import { test as teardown } from '@playwright/test';
import { runTeardownAsserted } from './setup/shared/assertTeardown';

const PREFIX = 'test-e2e-base-';

teardown('zz scratch f', async () => {
  await runTeardownAsserted(PREFIX);
});
```

**Command:** `npx playwright test -c ./tests/playwright.config.ts --list`

**Exit code:** `1`

**Message (verbatim):**

```
Error: Teardown prefix collision: 'zz-scratch-f.teardown.ts' and 'setup/shared/base.teardown.ts' both declare PREFIX = 'test-e2e-base-'. The two data-teardown projects are not guaranteed to be ordered relative to each other, so their runTeardownAsserted before/after row counts can race nondeterministically (review CR-01). Give one of them its own dedicated prefix — and, if it reuses a shared dev-seed template, its own dedicated template registration too (see packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts for the pattern).
    at file:///Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/playwright.config.ts:221:13
    at ModuleJob.run (node:internal/modules/esm/module_job:430:25)
```

**Throw site:** `tests/playwright.config.ts:221:13`.

**The decisive detail** is the reported path: `'zz-scratch-f.teardown.ts'` — a bare filename with **no
`setup/` path segment**, where every other row reports `setup/…`. That is the recursive whole-`TESTS_DIR`
enumeration observed directly. A `setup/`-scoped scan would have exited 0 on this injection.

**Revert:** `rm tests/tests/zz-scratch-f.teardown.ts`; `git status --porcelain -- tests` → empty.

---

## Row G — the empty-prefix edge, both sub-cases

The hazard being probed: an empty string is a string-prefix of **all 27** declared prefixes. If an empty
declaration reached the containment branch at `:230`, that branch would fire — and would fire against
every one of the 27, producing a first-pair-wins error message that names an essentially arbitrary
victim file and tells the author nothing about the real defect (their own empty declaration).

**Result: it does not reach the containment branch, in either sub-case.** The extraction regex at `:199`
captures `([^'"]+)` — **one or more** characters between the quotes — so `const PREFIX = ''` does not match
the regex at all, and therefore never enters `teardownPrefixDeclarations`. The file's fate is then decided
entirely by whether it calls `runTeardownAsserted(`. Both sub-cases were run.

### Row G1 — empty prefix **WITH** a `runTeardownAsserted(` call

**Injected declaration (verbatim, `tests/tests/setup/perm/zz-scratch-g.teardown.ts`):**

```ts
// TRANSIENT ASSERT-10 injection (row G1) — removed by rm in the same task.
import { test as teardown } from '@playwright/test';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = '';

teardown('zz scratch g1', async () => {
  await runTeardownAsserted(PREFIX);
});
```

**Command:** `npx playwright test -c ./tests/playwright.config.ts --list`

**Exit code:** `1`

**Message (verbatim):**

```
Error: Teardown prefix guard could not parse a `const PREFIX = '...'` declaration in setup/perm/zz-scratch-g.teardown.ts, but the file calls runTeardownAsserted — so its prefix is NOT covered by the uniqueness/overlap check below and a collision could reappear silently (review WR-03; same enumeration-drift shape as fake-guard finding F4). Make the declaration match `const PREFIX = '...'` (a plain top-level string literal), or widen the regex above to cover the new shape.
    at file:///Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/playwright.config.ts:207:9
    at ModuleJob.run (node:internal/modules/esm/module_job:430:25)
```

**Branch that fired: COMPLETENESS (`:206`/`:207`) — not containment (`:230`/`:232`).** Two independent
facts in the transcript establish this rather than one: the throw site is `:207:9`, and the message names
**exactly one file** (the scratch file itself). A containment hit would have thrown at `:232` and named a
pair. The author is pointed at their own file, which is the actionable outcome.

**Revert:** `rm tests/tests/setup/perm/zz-scratch-g.teardown.ts`; `git status --porcelain -- tests` → empty.

### Row G2 — empty prefix **WITHOUT** a `runTeardownAsserted(` call

**Injected declaration (verbatim, `tests/tests/setup/perm/zz-scratch-g.teardown.ts`):**

```ts
// TRANSIENT ASSERT-10 injection (row G2) — removed by rm in the same task.
import { test as teardown } from '@playwright/test';

const PREFIX = '';

teardown('zz scratch g2', async () => {
  void PREFIX;
});
```

**Command:** `npx playwright test -c ./tests/playwright.config.ts --list`

**Exit code:** `0`

**Final line:**

```
Total: 143 tests in 94 files
```

**Branch that fired: none.** With no helper call the file performs no prefix-scoped delete, so it is the
legitimate exclusion of row E wearing an unparseable declaration. Exit 0 is correct: an unused empty
binding in a file that deletes nothing is not a hazard, and firing on it would be the false positive row E
guards against.

**Joint reading of G1 and G2:** the empty-prefix edge is closed not by a special case in the comparison
logic but by the extraction regex's `+` quantifier, one layer earlier. That is a stronger property than a
special case — there is no code path from an empty declaration to the containment loop to keep correct.

---

## Row H — equality semantics and the ASCII scan (not an injection)

**(a) Comparison semantics.** The guard compares prefixes with plain JavaScript `===`
(`tests/playwright.config.ts:220`) and `String.prototype.startsWith` (`:230`). Both operate on **UTF-16
code units** with **no Unicode normalisation** — no `.normalize()`, no locale-aware collation, no
case folding anywhere in `:179-240`. This is the correct semantics rather than merely the default one:
the invariant exists to protect an `external_id LIKE '<prefix>%'` scan in Postgres, which is itself a
byte-level comparison. A guard that normalised would diverge from the database in exactly the direction
that hides a real collision — two prefixes the guard called "equal enough" that the database would treat
as distinct, or worse, the reverse.

The residual risk of no-normalisation is the reverse case: two prefixes that are canonically equivalent
(NFC vs NFD) but differ byte-wise would pass the guard while the database also treats them as distinct —
harmless — but a *reader* comparing them visually could not tell them apart. That risk is only real if any
declared prefix contains non-ASCII, so it was measured.

**(b) ASCII scan over all 27 declared prefixes.**

**Command:**

```
node -e '
const fs=require("fs"),path=require("path");
const dir="tests/tests";
const files=fs.readdirSync(dir,{recursive:true}).map(String).filter(f=>f.endsWith(".teardown.ts"));
const decls=[];
for(const rel of files){
  const src=fs.readFileSync(path.join(dir,rel),"utf8");
  const m=/^\s*(?:export\s+)?const PREFIX(?:\s*:\s*string)?\s*=\s*[\x27"]([^\x27"]+)[\x27"]/m.exec(src);
  if(m) decls.push({file:rel,prefix:m[1]});
}
console.log("declared prefixes:",decls.length,"of",files.length,"teardown files");
const nonAscii=decls.filter(d=>!/^[\x20-\x7E]+$/.test(d.prefix));
console.log("non-ASCII (outside U+0020..U+007E):",nonAscii.length);
const notNfc=decls.filter(d=>d.prefix!==d.prefix.normalize("NFC")||d.prefix!==d.prefix.normalize("NFD"));
console.log("prefixes whose NFC and NFD forms differ from the raw literal:",notNfc.length);
'
```

Note the scan re-uses the guard's **own** extraction regex from `:199`, so it enumerates exactly the set
the guard compares — not a hand-maintained list that could drift from it.

**Output (verbatim):**

```
declared prefixes: 27 of 28 teardown files
non-ASCII (outside U+0020..U+007E): 0
prefixes whose NFC and NFD forms differ from the raw literal: 0
```

**Conclusion:** all 27 declared prefixes are pure printable ASCII. No NFC/NFD divergence can exist among
them, so no canonically-equivalent-but-byte-distinct pair can hide a collision that the database would
nonetheless treat as distinct. The `27 of 28` also independently reproduces `assertTeardown.ts`'s stated
accounting (`candidate-journey.teardown.ts` is the 28th, and declares no prefix — row E's shape).

---

## Row I — clean revert

**Injection:** none. All scratch files removed by targeted `rm`.

**Command:** `npx playwright test -c ./tests/playwright.config.ts --list`

**Exit code:** `0`

**Final line:**

```
Total: 143 tests in 94 files
```

**Identical to row A** — 143 tests in 94 files. The tree was restored, not merely left plausible: an
unreverted scratch teardown would have thrown (rows B/C/D/F/G1) or, in the exit-0 shapes, would still
have shown as an untracked path below.

**Tree assertions at the close of task 1:**

```
git status --porcelain -- tests          → (empty)
git diff --exit-code -- tests/playwright.config.ts → exit 0   (D-15 read-only constraint held)
find tests -name 'zz-scratch*'           → (no matches)
```

The `find` is deliberately broader than the `git status` check: `git status` would miss a scratch file
that had somehow been staged, and `find` would miss nothing under `tests/`. Both are empty.

---

## What this phase did NOT do

**Phase 141 did not build the teardown-prefix-uniqueness guard.** It was built by **Phase 140**:

| Commit | Contribution |
|--------|--------------|
| `abe1fabb0` | Landed the guard (review finding CR-01): enumeration, extraction, equality branch, containment branch, and the WR-03 unparsed-declaration completeness check |
| `bdb759575` | IN-01 hardening — the named `fs.existsSync` precondition on `teardownDir`, so a missing/renamed tests directory fails by name instead of on a raw `readdirSync` ENOENT |
| `c15e444e8` | IN-02 hardening — widened the enumeration from `TESTS_DIR/setup` to the whole of `TESTS_DIR`, matching the runner's own unanchored `testMatch` scope (the property row F observes) |

Phase 141's contribution to ASSERT-10 is exactly two things: **this ledger** (the negative-control
evidence the standing acceptance rule requires and Phase 140 never produced), and the **correction of the
three committed statements** that asserted the guard was never built (`ROADMAP.md` Phase 140 status line,
`REQUIREMENTS.md` ASSERT-10 parenthetical, and the stale `missing:` item in `140-VERIFICATION.md`).

This distinction is recorded prominently because the defect this plan repairs *is* a provenance defect. A
phase that quietly inherited credit for another phase's construction would corrupt the same chain whose
one broken link produced the false claims being fixed here — and would do so in a document whose entire
purpose is to make provenance checkable.

---

## D-04 superseded

D-04 specified the extraction regex to be written. The shipped regex is a **strict superset** of it, so
adopting D-04 as written would be a **functional downgrade**, not a refinement.

**Shipped (`tests/playwright.config.ts:199`):**

```js
/^\s*(?:export\s+)?const PREFIX(?:\s*:\s*string)?\s*=\s*['"]([^'"]+)['"]/m
```

**D-04's proposal (`141-CONTEXT.md:77`):**

```js
/^const PREFIX = '([^']+)';/m
```

**The four declaration shapes D-04 would stop accepting:**

| # | Shape | Example | D-04 | Shipped |
|---|-------|---------|------|---------|
| 1 | `export const` | `export const PREFIX = 'e2e-x-';` | rejected | accepted (`(?:export\s+)?`) |
| 2 | `: string` type annotation | `const PREFIX: string = 'e2e-x-';` | rejected | accepted (`(?:\s*:\s*string)?`) |
| 3 | leading whitespace | `  const PREFIX = 'e2e-x-';` | rejected | accepted (`^\s*`) |
| 4 | double quotes | `const PREFIX = "e2e-x-";` | rejected | accepted (`['"]…['"]`) |

Each of the four is a shape a future author could plausibly write — none is exotic, and #1 and #2 are
what a linter or an IDE refactor would produce unprompted.

**Why each rejection is a downgrade, not merely a stylistic narrowing.** A rejected declaration falls
into one of two outcomes, and neither is acceptable:

- **If the file still calls `runTeardownAsserted(`** it hits the completeness throw at `:207` — noisy,
  and a hard failure of the whole suite over a `: string` annotation. Rows D and G1 show exactly what
  that looks like.
- **If the file does not call `runTeardownAsserted(`** — e.g. it routes its delete through a helper
  wrapper, or the call moves behind an indirection — it is **silently skipped**. Its prefix never enters
  the comparison, and a collision on it can reappear invisibly. That is the **F4 failure mode**: an
  enumeration that looks complete, is not, and says nothing. It is precisely the failure class this
  milestone exists to remove, and D-04's regex would reintroduce it for four common shapes.

The shipped regex is therefore kept as-is, and **D-04 is recorded superseded** (formally by **D-15**,
which supersedes D-03/D-04/D-05 together). No edit to `tests/playwright.config.ts` was made or is owed.

---

## D-04's measurement does not reproduce

D-04's stated rationale for declaration-site extraction (rather than a whole-file scan) was a measurement:

> *"22 of the 27 prefixes appear textually in more than one teardown file"* — `141-CONTEXT.md:77`

**This phase's own cross-file occurrence scan measures 1 of 27, not 22 of 27.**

**Command:**

```
node -e '
const fs=require("fs"),path=require("path");
const dir="tests/tests";
const files=fs.readdirSync(dir,{recursive:true}).map(String).filter(f=>f.endsWith(".teardown.ts"));
const decls=[];
for(const rel of files){
  const src=fs.readFileSync(path.join(dir,rel),"utf8");
  const m=/^\s*(?:export\s+)?const PREFIX(?:\s*:\s*string)?\s*=\s*[\x27"]([^\x27"]+)[\x27"]/m.exec(src);
  if(m) decls.push({file:rel,prefix:m[1]});
}
const sources=files.map(rel=>({rel,src:fs.readFileSync(path.join(dir,rel),"utf8")}));
let multi=0; const multiList=[];
for(const d of decls){
  const hits=sources.filter(s=>s.src.includes(d.prefix)).map(s=>s.rel);
  if(hits.length>1){multi++;multiList.push(d.prefix+" -> "+hits.join(", "));}
}
console.log("prefixes appearing (as a substring) in MORE THAN ONE *.teardown.ts file:",multi,"of",decls.length);
multiList.forEach(l=>console.log("  "+l));
'
```

**Output (verbatim):**

```
prefixes appearing (as a substring) in MORE THAN ONE *.teardown.ts file: 1 of 27
  e2e-perm-notloc- -> setup/candidate/bank-auth-journey.teardown.ts, setup/perm/perm-not-located-2e2cg.teardown.ts
```

The single hit is itself instructive: `e2e-perm-notloc-` appears in `bank-auth-journey.teardown.ts` only
as a **residual mention** (that file's own declared prefix is `e2e-bankauth-notloc-`, the dedicated
namespace `700678a2d` created when Phase 140 fixed the CR-01 collision). So the one cross-file occurrence
is the historical scar of the very defect this guard was built for.

**What survives of D-04's rationale, and what does not.** The *cross-file* number does not reproduce and
should not be relied on by any later phase. The *intra-file* form of the observation is real and does
still justify declaration-site extraction over a whole-file scan: `perm-hide-election-tags.teardown.ts:4`
restates its own prefix in a docblock beside the declaration at `:11`, so a whole-file scan would find two
occurrences of one prefix within a single file and would need comment-stripping to disambiguate. The
shipped `/m`-anchored declaration-site regex sidesteps that without a comment stripper.

**Recorded, not corrected in place.** `141-CONTEXT.md:77` is left as written — it was the operator's
decision text at the time, and rewriting a decision record to match a later measurement destroys the trail
that makes drift visible. This section is where the number is superseded, and D-15 is where the decision is.

---

## Requirement discharge

**ASSERT-10** — a config-load guard fails **by name** when two `*.teardown.ts` sites declare the same
external-ID prefix, proven by injection and reverted; the current disjoint set passes clean.

| Element of the criterion | Row | Status |
|---|---|---|
| Fails by name on a duplicate prefix | B | exit 1, both files + prefix named |
| Proven by injection, then reverted | B, I | reverted; row I total identical to row A |
| Current disjoint set passes clean | A, I | exit 0, 143 tests in 94 files (D-02 reproduced) |
| Containment (not just equality) | C | exit 1 at `:232`, `LIKE` scan quoted |
| Completeness (WR-03) | D | exit 1 at `:207`, file named |
| Legitimate exclusion does not fire | E, G2 | exit 0 both |
| Enumeration scope is whole-`TESTS_DIR` (IN-02) | F | exit 1 on a file with no `setup/` segment |
| Empty-prefix edge, both sub-cases | G1, G2 | completeness / exit 0; containment unreachable |
| Encoding: no normalisation, all-ASCII | H | 0 non-ASCII, 0 normalisation-sensitive, of 27 |
| Config-load placement (D-05) | B, C, D, F, G1 | stacks terminate in `loadUserConfig`/`loadConfigFromFile` |
| `tests/playwright.config.ts` untouched (D-15) | I | `git diff --exit-code` exit 0 |

Nine rows, nine runs, all executed in plan 141-04 on 2026-08-18 at HEAD `9b6d939a1`.
