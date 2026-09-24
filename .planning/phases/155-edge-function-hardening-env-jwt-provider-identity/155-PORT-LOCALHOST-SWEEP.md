# Phase 155 — Repo-Wide Hard-Coded Port and Loopback Sweep

The second half of **REVIEW-EDGE-02**: *"A repo-wide search for hard-coded ports and localhost URLs
is performed **and its results dispositioned**."* The first half — the seven Edge Function
environment-default sites — was discharged by Plans 01 to 04 and guarded by Plan 05. This document
is the second half, and it is the artefact that keeps the criterion from being satisfied by a
sentence in a summary.

- **Phase:** 155 (edge-function-hardening-env-jwt-provider-identity)
- **Plan:** 155-06, Task 1
- **Run:** 2026-08-29, HEAD `f1f575b62`, branch `integration/ship-12-squash`
- **Machine:** developer Mac, Darwin 25.5.0 arm64, `git version 2.51.0` (Apple git-154)
- **Disposition rule source:** `155-RESEARCH.md` § *The repo-wide port / localhost sweep*, adopted
  here as the phase's rule (see § 1). `155-CONTEXT.md` `<open>` item 5 — *"the sweep has no
  disposition rule"* — is **discharged by this document**.

---

## 1. The disposition rule, stated before any table

Adopted verbatim from `155-RESEARCH.md` as the phase's rule, so that labels are applied from a rule
rather than invented per row:

| Label | Applies when | Consequence |
|---|---|---|
| **FIXED IN THIS PHASE** | the hit is one of criterion 2's **seven Edge Function sites** | already closed by Plans 01–04; the row records the closure |
| **FILED** | the hit is a **silent default that changes where bytes go** — a missing environment variable substituted with a host or port, so a misconfigured run succeeds against the wrong target | a file under `.planning/todos/pending/` carrying its own `file:line` anchor, per decision **D-N2** |
| **HANDED TO PHASE 156** | the hit lives in `apps/supabase/supabase/config.toml` | named in a filed todo, **not edited**; `REVIEW-DB-08` owns it |
| **NO ACTION** | the hit is help text, an error-message interpolation, a test fixture, a benchmark or developer-tooling literal, documentation prose, or an already-visible shell-parameter default | recorded here with its reason, so the absence of action is legible rather than indistinguishable from an oversight |

> **The invariant this document asserts: no hit may be unlabelled.** The sweep is not complete until
> every one of the 273 hits carries exactly **one** of the four labels above. § 3 proves the
> partition is exhaustive by construction, with a tripwire that exits non-zero if it is not.

---

## 2. The exact commands, and why they are spelled the way they are

```bash
LOOP='localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]'
PORTS='\b(5173|2500|8083|3000|8000|5432[0-9])\b'
SCOPE=(apps packages tests scripts docker-compose.dev.yml render.example.yaml \
       .env.example package.json turbo.json)

git grep -nIP "$LOOP|$PORTS" -- "${SCOPE[@]}" | sort
```

The full partitioning script, including the exhaustiveness tripwire, is reproduced in § 3.

**`-P`, not `-E`, is load-bearing — see § 5, blind spot 1.**
**`-I` skips binaries** — without it `packages/dev-seed/src/assets/portraits/portrait-26.jpg` matches
the port half on raw bytes and enters the corpus as an unreadable row.

**Corpus:** every **tracked text file** under the four scan roots plus the five root configuration
files. Tracked, not on-disk: see § 5, blind spot 3, and the staging check in § 6.

---

## 3. Counts, and the exhaustiveness tripwire

```
TOTAL=273
  EDGE = 0     apps/supabase/supabase/functions/**
  B    = 15    apps/supabase/supabase/config.toml
  C    = 11    root configuration files
  D    = 96    tests/ and scripts/
  Dx   = 100   *.test.* / *.spec.* / tests|__mocks__|__tests__ under apps and packages
  A    = 51    everything else — production source, tooling, package docs
SUM=273
TRIPWIRE: partition exhaustive -- every hit lands in exactly one bucket
```

The partition is evaluated as a **residue chain**: each bucket is subtracted from the remainder
before the next selector runs, so no line can land in two buckets, and the final bucket `A` is the
catch-all. The tripwire compares `SUM` against `TOTAL` and exits 1 on any mismatch. This is the
phase-152 lesson applied: a partitioned scan whose partitions do not sum to the whole is a scan that
silently drops whatever falls between the selectors.

```bash
grep -E  '^apps/supabase/supabase/functions/'  all.txt > EDGE.txt ; grep -vE ... > r1.txt
grep -E  '^apps/supabase/supabase/config\.toml:' r1.txt > B.txt   ; grep -vE ... > r2.txt
grep -E  '^(docker-compose\.dev\.yml|render\.example\.yaml|\.env\.example|package\.json|turbo\.json):' r2.txt > C.txt ; grep -vE ... > r3.txt
grep -E  '^(tests/|scripts/)'                    r3.txt > D.txt   ; grep -vE ... > r4.txt
grep -E  '\.(test|spec)\.|/(tests|__mocks__|__tests__)/' r4.txt > Dx.txt ; grep -vE ... > A.txt
SUM=$(cat EDGE.txt B.txt C.txt D.txt Dx.txt A.txt | wc -l)
[ "$SUM" -ne "$(wc -l < all.txt)" ] && { echo "TRIPWIRE: partition is NOT exhaustive"; exit 1; }
```

### Against RESEARCH's numbers, which were measured before five plans changed the tree

RESEARCH reported **784 raw lines**. This run reports **273**. The difference is corpus, not tree
churn: RESEARCH's raw grep was unpartitioned and unfiltered, this one is restricted to tracked text
files. The two are not comparable and **this document does not claim they are** — every count below
is this run's own.

What **is** comparable is the bucket shape, and one number in it is the point of the whole phase.

---

## 4. Bucket tables — every hit labelled

### Bucket EDGE — the Edge Functions tree: **0 hits**

```
$ git grep -nIP "$LOOP|$PORTS" -- apps/supabase/supabase/functions
$ echo $?
1                       # no matches
```

| Site (at RESEARCH time) | Content then | Label |
|---|---|---|
| `identity-callback/index.ts:361` | `` `${Deno.env.get('SITE_URL') \|\| 'http://127.0.0.1:5173'}/candidate` `` | **FIXED IN THIS PHASE** — criterion-2 site 3, closed by Plan 03 (`465cc4bdd`) |
| `send-email/index.ts:211` | `Deno.env.get('SMTP_PORT') \|\| 2500` (development SMTP port) | **FIXED IN THIS PHASE** — criterion-2 site 5, closed by Plan 04 (`bcae09a05`) |

**The production-source bucket contains no Edge Function row, and that is the measured result rather
than an expectation carried over.** The plan required that if it were otherwise, the discrepancy be
named rather than smoothed over. It is not otherwise: the whole `functions/` tree scores **zero** on
both halves of the pattern — the loopback redirect origin and the development SMTP port were the
only two, and both are gone.

That zero is only worth something because § 5's flip-tests show the same command going red on an
injected instance in the same directory.

### Bucket A — production source, tooling, package documentation: **51 hits**

**FILED — 4 sites.** Each is `env-var ?? host-literal`: a missing variable silently substituted with
a target, so a misconfigured run succeeds against the wrong database or API.

| File:line | Content | Filed as |
|---|---|---|
| `packages/dev-seed/src/supabaseAdminClient.ts:31` | `const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';` | todo 2 |
| `packages/dev-seed/src/cli/seed.ts:184` | `const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';` | todo 2 |
| `apps/supabase/scripts/lint-schema.mjs:25` | `const DB_URL = process.env.DATABASE_URL \|\| 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';` | todo 5 |
| `apps/supabase/benchmarks/k6/config.js:12` | `export const SUPABASE_URL = __ENV.SUPABASE_URL \|\| 'http://127.0.0.1:54321';` | todo 5 |

The last two are **not in RESEARCH's bucket A at all** — RESEARCH's bucket A had eight rows, all
under `packages/dev-seed/src` plus the one Edge Function site and one frontend mock. `apps/supabase/scripts/`
and `apps/supabase/benchmarks/` were outside the shape it enumerated. They are the same defect class
by the rule in § 1, so they are filed, and a fifth todo exists because of them (§ 7, deviation 1).

**Also worth recording: every RESEARCH line number in this bucket is stale**, by 6 to 32 lines —
`supabaseAdminClient.ts` `:42`→`:31`, `seed.ts` `:216`→`:184`, `teardown.ts` `:224`→`:178`,
`writer.ts` `:98`→`:66`, `cli/help.ts` `:39`→`:36`, `cli/teardown-help.ts` `:27`→`:24`. Phase 152's
comment sweep moved them. Every anchor in the filed todos was re-measured this session; none was
transcribed.

**NO ACTION — 47 hits**, by class:

| Class | Count | Representative | Reason |
|---|---|---|---|
| Documentation prose (`apps/docs/src/**/+page.md`, `apps/docs/README.md`, `apps/supabase/README.md`, `packages/dev-seed/README.md`) | 17 | `apps/docs/…/quick-start/+page.md:15` — *"Access the backend at http://localhost:5173/"* | documentation of a local address, visible to its reader by definition |
| Benchmark scripts and their headers (`apps/supabase/benchmarks/pgbench/*.sql`, `benchmarks/scripts/*.sh`) | 15 | `pgbench/aggregation-jsonb.sql:7` — a `pgbench -h 127.0.0.1 -p 54322` invocation in a comment | copy-paste command lines and manually-run developer tooling; the value is visible in the file and failure is immediate |
| Shell-parameter defaults (`${DB_HOST:-127.0.0.1}`, `${DB_PORT:-54322}`, compose healthcheck) | 4 | `benchmarks/scripts/run-benchmarks.sh:31` | the idiomatic visible-default form; the default is written where the reader looks |
| Container port declarations (`apps/frontend/Dockerfile:40,52`, `apps/frontend/docker-compose.dev.yml:23`) | 3 | `EXPOSE 5173` | a port declaration is what the file is for |
| Error-message interpolation | 1 | `packages/dev-seed/src/cli/teardown.ts:178` — `` `Cannot reach Supabase at ${process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'}. Is 'supabase start' running?` `` | printing the **effective** URL is the diagnostic's whole purpose; it changes what a message says, not where bytes go |
| Help text | 3 | `packages/dev-seed/src/cli/help.ts:36` — `SUPABASE_URL … (e.g. http://127.0.0.1:54321)` | the example is the documentation |
| Format-validation literal | 1 | `packages/dev-seed/src/writer.ts:66` — `'Expected format: http://127.0.0.1:54321'` | an example inside a validation failure message |
| Documented escape-hatch default | 1 | `apps/frontend/vite.config.ts:33` — `Number(env.FRONTEND_PORT) \|\| 5173` | this is `FRONTEND_PORT`, the escape hatch `CLAUDE.md` documents and `tests/` preflight depends on; the default is deliberate and visible |
| Local-dev seed data | 1 | `apps/supabase/supabase/seed.sql:14` — `('supabase_url', 'http://kong:8000')` | a seeded row in the file `supabase db reset` replays locally; `kong:8000` is the Docker-internal gateway name and is never a deployed value. **Named rather than hidden** — it is the only hard-coded host inside `apps/supabase/supabase/` outside `config.toml` |
| **Regex false positive** | 1 | `apps/frontend/src/routes/(voters)/(located)/+layout.svelte:43` — `const NOMINATIONS_SETTLE_TIMEOUT = 3000;` | **not a port.** `3000` is milliseconds. Recorded rather than silently dropped, because a sweep that quietly discards its own false positives cannot be audited for the ones it discarded wrongly |

> **The `teardown.ts:178` judgment is recorded because a mechanical selector disagrees with it.** A
> purely syntactic selector for `env-var ?? literal` returns **5** rows in bucket A, not 4 — it
> collects the error-message interpolation too. The four-label rule is applied by reading what the
> expression does, and that row does not change where bytes go. The disagreement is written down so
> the judgment is reviewable rather than buried in a count.

### Bucket B — `apps/supabase/supabase/config.toml`: **15 hits** → **HANDED TO PHASE 156**

```
:10   port = 54321                :91   port = 54323                :164  site_url = "http://127.0.0.1:5173"
:29   port = 54322                :93   api_url = "http://127.0.0.1" :166  additional_redirect_urls = [...]
:31   shadow_port = 54320         :102  port = 54324                 :169  (comment naming the default API URL)
:41   port = 54329                :104  smtp_port = 54325            :374  inspector_port = 8083
:72   allowed_cidrs = ["0.0.0.0/0"] :105 pop3_port = 54326           :383  port = 54327
```

All 15 carry the single label **HANDED TO PHASE 156**. `REVIEW-DB-08` already owns them
(*"the `config.toml` hard-coded ports resolved from env or documented as a caveat"*), and
`155-CONTEXT.md` `<open>` item 5 names the collision explicitly. **This phase deliberately did not
edit the file**; the hand-off is todo 3, and the assertion that it stayed a hand-off is in § 6.

Note `:72 allowed_cidrs = ["0.0.0.0/0"]` is not a port at all — it is a CIDR block in the local
database-settings section. It carries the same label because it lives in the handed-off file, and
splitting it out would mean editing the file to move it.

### Bucket C — root configuration files: **11 hits** → **NO ACTION**

| File | Hits | Reason |
|---|---|---|
| `.env.example` | 7 | This file **is** the documentation of the values. Three of the seven (`SITE_URL`, `SMTP_PORT`, and the comment at `:112` explaining the removed fallbacks) were **written by this phase**, Plan 01, precisely so the removed defaults are visible somewhere a human reads |
| `docker-compose.dev.yml` | 4 | `${VAR:-default}` shell-parameter form throughout; the default is visible in the file. Bucket C of RESEARCH, same disposition |

### Bucket D — `tests/` and `scripts/`: **96 hits** → **NO ACTION**

Test infrastructure, and parameterised where it matters. The largest contributors:
`tests/IDURA-TEST-RUNBOOK.md` (23 — the bank-auth recipe, which is documentation of local addresses
and which Plan 01 updated), `tests/scripts/visual-container.sh` (12), `tests/tests/support/mockOidcIssuer.ts`
(8 — a deliberately local mock issuer), `tests/scripts/tcp-forward.mjs` (8), `tests/playwright.config.ts`
(5 — the `FRONTEND_PORT` escape hatch `CLAUDE.md` documents).

### Bucket Dx — test and mock files under `apps` and `packages`: **100 hits** → **NO ACTION**

Fixtures and mocks. Largest: `idura.test.ts` (13), `supabaseDataProvider.test.ts` (13),
`signicat.test.ts` (12), `token-endpoint.test.ts` (12), `authorize-endpoint.test.ts` (11). A test
that asserts against a loopback URL is asserting against its own fixture.

---

## 5. What this scan **cannot** see — three blind spots, each demonstrated

A clean zero is worth nothing until it is shown able to be non-zero, and worth less still if the
reader is not told what the zero excludes. Each blind spot below was **measured**, not reasoned.

### Flip-test — both halves of the pattern, in the bucket that reported zero

| Injection | Site | Loopback half | Port half | Result |
|---|---|---|---|---|
| baseline | — | 0 | 0 | EDGE bucket empty |
| `const FLIP_LOOPBACK = 'http://127.0.0.1:9999';` | `send-email/index.ts:28` | **1 — RED** | — | detected at the exact real line |
| reverted | — | 0 | — | `git status --porcelain` clean |
| `const FLIP_PORT = Number('54321');` | `invite-candidate/index.ts:10` | **0 — MISSED** | **1 — RED** | detected by the port half **only** |
| reverted | — | 0 | 0 | `git status --porcelain` clean |

The fourth row is the one that earns its place: a bare port literal with **no loopback host** is
invisible to the loopback half and caught only by the port half, so the two halves are independently
load-bearing rather than one being a superset of the other. Reverts used `git checkout --` on a
single named file, with the tree already clean under the scan roots.

### Blind spot 1 — `git grep -E` has no `\b` on this machine, and says so by returning zero

```
$ git grep -cE '\b54321\b' -- apps/supabase/supabase/config.toml
                                      # no output, exit 1
$ git grep -cP '\b54321\b' -- apps/supabase/supabase/config.toml
apps/supabase/supabase/config.toml:1
```

`config.toml:10` is literally `port = 54321`. The `-E` form reports **no matches over a file with
real matches**, with no error and no warning — the exact shape phase 152 caught reporting
`bare = 0 … OK` over 40 live violations. **The first draft of this sweep used `-E` and reported
`ports = 0` across the entire repository.** `-P` is therefore not a stylistic choice; a future
re-run that drops it will silently lose the whole port half.

### Blind spot 2 — the pathspec glob `packages/*/src` matches nothing, silently

```
$ git grep -clP 'localhost' -- 'packages/*/src'    | wc -l
0
$ git grep -clP 'localhost' -- packages/dev-seed/src | wc -l
1
```

Git's default pathspec globbing does not let `*` cross a `/`, so `packages/*/src` matches no path at
all and returns a clean zero. **The first draft of bucket A used that glob and reported one hit
instead of 51.** Every scan root in § 2 is therefore a literal directory, never a glob.

### Blind spot 3 — an untracked file is invisible (the 155-05 staging lesson)

```
$ printf "const X = 'http://127.0.0.1:54321';\n" > packages/dev-seed/src/__flip_untracked.ts
$ git grep -clP '127\.0\.0\.1' -- packages/dev-seed/src | wc -l   # 5   <- misses it
$ grep   -rlP '127\.0\.0\.1'    packages/dev-seed/src  | wc -l   # 6
$ git add -N packages/dev-seed/src/__flip_untracked.ts
$ git grep -clP '127\.0\.0\.1' -- packages/dev-seed/src | wc -l   # 6   <- now visible
```

`git grep` intersects with the index. A new file that has not been staged is invisible to it, which
is how Plan 05's first hygiene run under-reported by exactly one file. **Staging is what makes the
count real rather than vacuous** — the check that this run was not under-reporting is in § 6.

### Blind spots stated but not demonstrated

- **Untracked and gitignored trees** are outside the corpus by construction: `node_modules`, `.turbo`,
  `build`, `.svelte-kit`, `tests/e2e-runs`. Compiled `dist/` output can contain a loopback literal
  that its source does not — but its source is in the corpus, so the source is what gets labelled.
- **Computed and split hosts.** `'127.' + '0.0.1'`, `String.fromCharCode(...)`, a host assembled from
  a config object, a port stored in a JSON fixture and read at runtime — none of these match a text
  pattern. This sweep finds **literals**, and that is its entire claim.
- **Ports outside the enumerated set.** `PORTS` names nine literals drawn from this project's known
  services. A hard-coded `:9000` is not in the pattern and would not be found. Widening the pattern
  to all four-and-five-digit integers was tried and rejected: it collects timeouts, pixel widths and
  currency amounts at a rate that makes the result undispositionable — `NOMINATIONS_SETTLE_TIMEOUT = 3000`
  in the table above is what a single such false positive already costs.
- **Non-ASCII and percent-encoded host spellings** (`%31%32%37…`, IDN forms) are not covered.

**For the EDGE bucket's zero to be false, one of these would have to be true:** a loopback host or
one of the nine ports is present in `apps/supabase/supabase/functions/` under a *computed* rather
than literal spelling; or under a port number outside the nine; or in a file that is untracked. The
third is excluded by § 6's staging check. The first two are the honest residual, and neither is
closed by this sweep.

---

## 6. Assertions this document makes about the tree

| Assertion | Command | Result |
|---|---|---|
| The hand-off did not become an edit | `git status --porcelain apps/supabase/supabase/config.toml` | *(empty)* |
| The count is not vacuous — nothing under the scan roots is unstaged or untracked | `git status --porcelain -- apps packages tests scripts` | *(empty)* |
| The Edge Functions tree is clean on both halves | `git grep -nIP "$LOOP\|$PORTS" -- apps/supabase/supabase/functions` | exit 1, no output |
| The partition is exhaustive | tripwire in § 3 | `SUM=273 == TOTAL=273` |

---

## 7. Filed follow-ups

Per decision **D-N2**, everything this phase surfaced and did not fix is a file under
`.planning/todos/pending/` with its own `file:line` anchor — not a sentence in a summary.

| # | Todo | Class | Severity |
|---|---|---|---|
| 1 | `2026-08-29-edge-function-non-null-env-assertions.md` | 13 non-null `Deno.env.get(...)!` assertions over 8 lines in the Edge Functions tree — the same consequence class as REVIEW-EDGE-02 under a different operator, invisible to the new guard by design | medium |
| 2 | `2026-08-29-dev-seed-silent-supabase-url-defaults.md` | the two dev-seed silent `SUPABASE_URL` defaults, which also disagree with each other on the loopback spelling | medium |
| 3 | `2026-08-29-config-toml-hard-coded-ports-phase-156.md` | the 15 `config.toml` port and host literals, handed to Phase 156 criterion 8 / `REVIEW-DB-08` | low |
| 4 | `2026-08-29-identity-callback-unreferenced-seed-project-constant.md` | `DEFAULT_SEED_PROJECT_ID` left declared and unreferenced by Plan 03, handed to Phase 161 | low |
| 5 | `2026-08-29-supabase-tooling-silent-database-url-defaults.md` | **deviation, § 8** — the two silent defaults in `apps/supabase/scripts/` and `apps/supabase/benchmarks/` that RESEARCH's bucket A did not contain | low |

---

## 8. Deviation — a fifth todo, because the rule demanded it

The plan specifies four todos. The sweep found **two silent env-defaults outside every shape
RESEARCH enumerated** (`apps/supabase/scripts/lint-schema.mjs:25`,
`apps/supabase/benchmarks/k6/config.js:12`). Under § 1's rule they are FILED, not NO ACTION.

Folding them into todo 2 was rejected: that todo is titled for `packages/dev-seed`, and burying two
`apps/supabase` anchors inside it would make them unfindable by the search a future reader actually
runs. So a fifth file exists. **[Rule 2 — missing critical functionality]**: the rule the plan
adopted requires a filed anchor for exactly this class, and the plan's count of four was written
from RESEARCH's bucket A, which did not contain them.

---

## 9. Observation, recorded because the operator needs it — not a defect, not acted on

**Neither `send-email` nor `invite-candidate` has a live caller**, in the product or in the suite.
Re-measured by Plan 04 rather than inherited from RESEARCH:

- `functions.invoke` appears **zero** times anywhere under `tests/`.
- The string `send-email` appears **zero** times under `tests/`.
- The suite's own `sendEmail` helper (`tests/tests/utils/supabaseAdminClient.ts:474`) calls
  `auth.admin.generateLink` / `auth.admin.inviteUserByEmail` **directly from the Node test process**;
  Supabase Auth's own mailer delivers to Mailpit. The Edge Function is never entered.
- The sole frontend callers — `supabaseAdminWriter.sendEmail` and
  `supabaseDataWriter.preregisterWithApiToken` — are each referenced only by their own mocked unit
  test. No route and no `.svelte` component reaches either.

This is **context for deciding what those functions are for**, not a defect, and this phase does not
act on it. It is why the default E2E suite's counts are expected to be unchanged by this phase, and
it is registered as window 169. The functions were **not** deleted.

---

*Phase 155, Plan 06, Task 1. Written 2026-08-29 at HEAD `f1f575b62`.*
*`155-CONTEXT.md` `<open>` item 5 discharged. REVIEW-EDGE-02's disposition half discharged.*
