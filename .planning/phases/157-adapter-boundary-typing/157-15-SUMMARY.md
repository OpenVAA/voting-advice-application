---
phase: 157-adapter-boundary-typing
plan: 15
subsystem: tooling/lint-guards
tags: [eslint, flat-config, adapter-boundary, negative-control, guard-self-test]
status: complete
requires:
  - 157-14 (PROBE VERDICT REPLACE; the named + hashed injection targets; the pre-change config blob)
  - 157-RESEARCH.md § F.1-F.8 (the existing block, the inherited entries, the lintable predicates, the measured selectors, the per-file difficulty scores, the control matrix)
  - apps/frontend/src/lib/_guards/eslint-store-guard.test.ts (the self-test apparatus and its four correctness invariants)
provides:
  - "the paired adapter-boundary ban in apps/frontend/eslint.config.mjs (2 no-restricted-imports patterns + 2 no-restricted-syntax selectors)"
  - "ADAPTER_BOUNDARY_ALLOWLIST — 5 boundary-inside entries + 10 annotated grandfathered entries"
  - "eslint-adapter-boundary-guard.test.ts — 82 assertions proving the pair fires, stays silent, and keeps the inherited bans"
  - "157-NEGATIVE-CONTROL-LEDGER.md closed: 31 pending cells filled, 0 remaining"
affects:
  - 157-16 (strikes allowlist entry #1, taking the list from ten to nine)
  - 158 (the annotated allowlist is its machine-checked worklist)
tech-stack:
  added: []
  patterns:
    - "guard shape measured with `npx eslint --print-config`, not asserted from reading the config"
    - "allowlist expressed as a named, per-entry-annotated const consumed as the guard block's `ignores`"
    - "row C discrimination check: byte-identical source at an allowed vs a guarded virtual filePath"
key-files:
  created:
    - apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts
  modified:
    - apps/frontend/eslint.config.mjs
    - .planning/phases/157-adapter-boundary-typing/157-NEGATIVE-CONTROL-LEDGER.md
decisions:
  - "Both halves of the ban live in the NARROW block, not just the access half — deviation from the plan's literal instruction, because the broad src/** block covers the adapter, which imports @supabase/* directly."
  - "Decision A executed: an explicit ten-entry allowlist annotated per entry with its Phase-158 disposition, plus five boundary-inside entries that are permanent by construction."
  - "The REPLACE trap is closed by measurement (`eslint --print-config` on a file matched by both globs), not by reading the config."
metrics:
  duration: ~40 min
  completed: 2026-08-30
actuals:
  tokens: 13700
  tasks: 3
  commits: 3
---

# Phase 157 Plan 15: The ESLint Adapter-Boundary Guard Summary

Installed the paired adapter-boundary ban, proved it fires with an 82-assertion self-test, and closed the
negative-control register — 31 `pending` cells filled, zero remaining. The tree that was measurably blind
to a ninth Supabase leak at HEAD `a38969a17` now fails `yarn lint:check` on the byte-identical injection.

## The config shape chosen, and why it deviates from the plan

**Two blocks, and the NEW block carries BOTH rules.**

- **Block 1** — the existing `svelte/store` block at `files: ['src/**/*.{ts,js,mjs,cjs,svelte}']`.
  **Unmodified.**
- **Block 2** — new, `files: ['src/**/*.{ts,js,mjs,cjs,svelte}']` with
  `ignores: ADAPTER_BOUNDARY_ALLOWLIST`. Carries the four new entries **and re-includes all four
  inherited entries byte-identically**.

The plan's literal instruction was to add the two `no-restricted-imports` patterns to **block 1** and put
only the access half in block 2. **That is not implementable, and I deviated.** Block 1 spans all of
`src/**`, which includes the adapter and the client factories, and those files import `@supabase/*`
directly — measured, `grep -rln "from '@supabase/" apps/frontend/src` returns 10 files, **8 of them
inside the boundary**. Adding `^@supabase/` to the broad block would have turned `yarn lint:check` red on
the adapter itself: precisely `T-157-37`, the guard blocking all work. Both halves therefore live in the
narrow block. Because that block sets both rules, the REPLACE verdict applies to both, so all four
inherited entries are re-included there — a strictly larger obligation than the plan anticipated, not a
smaller one.

### The measurement proving no inherited entry was dropped

Not asserted from reading the config — enumerated from ESLint's **own resolved configuration** via
`npx eslint --print-config <file>`, at HEAD `c02448bba`:

| File | Matched by | `no-restricted-imports` | `no-restricted-syntax` |
|------|-----------|-------------------------|------------------------|
| `src/routes/admin/+layout.server.ts` (**guarded**) | block 1 **and** block 2 | paths: `svelte/store` ✔ · patterns: `^(\.\./){2,}lib(/\|$)` ✔, `^@supabase/`, `^\$lib/(supabase\|api/adapters)(/\|$)` | `TSEnumDeclaration` ✔, `ImportExpression[source.value='svelte/store']` ✔, `MemberExpression[property.name='supabase']`, `ObjectPattern > Property[key.name='supabase']` |
| `src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` (**allowlisted**) | block 1 only | paths: `svelte/store` ✔ · patterns: `^(\.\./){2,}lib(/\|$)` ✔ | `TSEnumDeclaration` ✔, `ImportExpression[source.value='svelte/store']` ✔ |

The ✔ entries are the four inherited ones. **All four survive for the file matched by both globs** — the
REPLACE trap is closed, and closed by measurement. The allowlisted file keeps the inherited four and
gains none of the guard's four.

All ten Group-2 allowlist globs were separately confirmed to match their files (2 selectors in the
resolved config instead of 4), including the two whose path text contains glob-adjacent characters:
`routes/candidate/(protected)/+layout.server.ts` and the `+page.server.ts` / `+server.ts` forms. A
mistyped allowlist path would have shown 4 selectors and gone unnoticed until the gate turned red on an
untouched file.

Independently, `eslint-store-guard.test.ts` stayed **30/30 green** through the change.

## The shipped allowlist, verbatim

Declared as `ADAPTER_BOUNDARY_ALLOWLIST` at the top of `apps/frontend/eslint.config.mjs`, consumed as the
guard block's `ignores`. Every entry named explicitly; no wildcard stands in for a file.

**Group 1 — the boundary's own inside. Five entries, permanent by construction.**

| Entry | Annotation |
|-------|-----------|
| `src/lib/api/adapters/**` | The Supabase adapter itself. Supabase specifics are exactly what this directory is for. |
| `src/lib/supabase/**` | The browser and server Supabase client factories the adapter is built on. |
| `src/lib/api/dataProvider.ts` | Three one-line re-export selectors that name the adapter path; they are the seam, not a leak. |
| `src/lib/api/dataWriter.ts` | (same) |
| `src/lib/api/feedbackWriter.ts` | (same) |

**Group 2 — the ten grandfathered sites, each annotated with its Phase-158 disposition.**

| # | Entry | Annotation as shipped |
|---|-------|----------------------|
| 1 | `src/routes/candidate/preregister/+layout.server.ts` | 158-EASY, and `157-16` removes it: a plain `app_settings` read that `SupabaseDataProvider._getAppSettings` already implements. |
| 2 | `src/routes/candidate/auth/callback/+server.ts` | 158-MEDIUM: `auth.verifyOtp` then `auth.getUser`, both needing new adapter methods that do not exist on `DataWriter` today. |
| 3 | `src/routes/candidate/auth/logout/+server.ts` | 158-EASY, with a caveat: `SupabaseDataWriter._logout` already does this, but it `fetch`es THIS route, so moving it creates a cycle Phase 158 must break first. |
| 4 | `src/routes/candidate/(protected)/+layout.server.ts` | 158-MOSTLY-PERMANENT: two of its three sites hand the cookie-capable client to the adapter, which has to happen somewhere outside the adapter; only the third is true leakage. |
| 5 | `src/routes/candidate/login/+page.server.ts` | 158-HARD: `signInWithPassword` plus an inline JWT role decode; the heart of Phase 158's three-login-paths-into-one collapse. |
| 6 | `src/routes/admin/login/+page.server.ts` | 158-HARD: identical to the candidate login path, and the file a recorded cookie-loss incident was fixed in. |
| 7 | `src/routes/api/candidate/preregister/+server.ts` | 158-MEDIUM: `functions.invoke('identity-callback')` plus `auth.verifyOtp`; `SupabaseDataWriter._preregister` already establishes the Edge-Function pattern. |
| 8 | `src/routes/api/auth/logout/+server.ts` | 158-EASY: a bare `auth.signOut()`. |
| 9 | `src/hooks.server.ts` | 158-OWNED, outside criterion 6's stated scope: this file POPULATES `event.locals.supabase`, which is the structural reason the eight route files above can reach Supabase without importing it. |
| 10 | `src/app.d.ts` | 158-OWNED, and unreachable by this guard on purpose: this file DECLARES `supabase` on the global `App.Locals` interface, which is a type declaration rather than an import or a member access, so the guard should not pretend to reach it. |

Ten entries at close; `157-16` takes it to nine. That is what makes it a shrinking target rather than a
permanent amnesty.

## The guard self-test — 82 assertions and the trim rationale

`apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts`, **82 assertions**:

| Group | Count | What it proves |
|-------|-------|----------------|
| Matrix: 3 guarded dirs x 2 extensions x 4 violation fixtures x 3 assertions | 72 | Each fixture FIRES its rule (filtered by `ruleId` **and** message substring), the clean interface call stays SILENT, and the violating fixture PARSES without a fatal message |
| Allowed-locus silence + no-fatal, 2 loci x 2 | 4 | Adapter-internal `this.supabase` and a `@supabase/ssr` import stay silent inside the boundary |
| Grandfathered-allowlist probes | 2 | The REAL allowlisted paths `routes/candidate/(protected)/+layout.server.ts` and `hooks.server.ts` stay silent — this catches a mistyped allowlist entry |
| Inherited-ban standing regressions | 4 | `TSEnumDeclaration`, deep-relative-`lib` `patterns`, `svelte/store` `paths`, `ImportExpression` — one per inherited ban, not just the enum one |

**Trim rationale** (stated in the file header): `157-RESEARCH.md` § F.4 specifies 6 dirs x 2 ext x 4
fixtures x 3 assertions ≈ 150 assertions and recommends trimming rather than shipping assertions nobody
reads. The trim kept is **three guarded directories** — one server-route tree (`routes/candidate`), one
API-route tree (`routes/api`) and one component tree (`lib/components`) — the three structurally distinct
loci the boundary can be crossed from. The dropped directories differ from a kept one only in their path
text, and the `files` glob is measured by the kept probes rather than quoted.

All four store-guard correctness invariants are carried over in substance, plus a fifth (a standing
REPLACE regression **per inherited ban**). The `beforeAll` warm-up runs at a `120_000` ms hook timeout.
`errorCount` appears **zero** times in the file.

## The five newly measured ledger rows

| Row | Command | Exit | Result | HEAD |
|-----|---------|------|--------|------|
| `A-NEW` | `TURBO_FORCE=true yarn lint:check` | **1** | 1 error, `no-restricted-syntax` at **`9:26`** — the injected line. Message: `A \`.supabase\` access reaches through the adapter boundary…` | `0c1a1a63c` |
| `B-NEW` | `TURBO_FORCE=true yarn lint:check` | **1** | 1 error, `no-restricted-imports` at **`1:1`**. Message: `'@supabase/ssr' import is restricted… Supabase packages are banned outside the adapter…` | `0c1a1a63c` |
| `C` | `npx eslint <adapter + client factories>` | **0** | **0 errors, 0 warnings** against 9 `this.supabase` accesses | `0c1a1a63c` |
| `D` | `git checkout --` + `git hash-object` + `git status --porcelain apps` | **0** | both injections match their pre-injection blobs; config at the post-change target | `0c1a1a63c` |
| `E-RED` / `E-GREEN` | `vitest run …eslint-adapter-boundary-guard.test.ts` | **1** / **0** | `24 failed \| 58 passed (82)` / `82 passed (82)` | `c02448bba` / `0c1a1a63c` |

Every run carries a verified `cache bypass, force executing` marker with a distinct turbo input hash:
clean `21d900c93b319d8e`, `A-NEW` `f71d40529e20d5f4`, `B-NEW` `b8f2af0e48046763` — none of them a replay.

**Note it is the import half that fires in `B-NEW` and the access half in `A-NEW`.** Neither rule alone
would have caught both rows. That is the measured reason the ban ships as a pair.

**Row C's `0` is non-vacuous.** A guard scoped to nothing produces the same `0`, so the exit code alone
is not evidence. The **byte-identical** source of `supabaseDataProvider.ts` was passed to `lintText`
twice, changing **only** the virtual `filePath`: **0** boundary messages at its real allowlisted path,
**9** at a guarded path. Same bytes, same config, opposite verdict.

**Row E's RED is the honest TDD gate.** The plan orders the config (Task 1) before the test (Task 2), so
a literal RED-before-GREEN was unavailable in task order. Instead the implementation was deleted under an
existing test: the whole adapter-boundary config object was removed (config blob
`741858549d5dad864d3525586c00284336ab9b5b`), and **exactly the 24 "fires" assertions failed and no
others**. The 58 that stayed green are the silence probes, the no-fatal probes and the four
inherited-ban regressions — all of which *should* stay green when only the guard's own entries are
removed. A RED that had also taken down the inherited-ban regressions would have meant the manipulation
removed more than the guard.

### Restoration, proven

| File | Pre-injection blob | Post-restoration blob | Match |
|------|--------------------|-----------------------|-------|
| `apps/frontend/src/routes/admin/+layout.server.ts` | `02bf748322c834fe553f58f01aaf019473e7c2ec` | `02bf748322c834fe553f58f01aaf019473e7c2ec` | ✔ |
| `apps/frontend/src/lib/components/input/shared.ts` | `c1b2d1e99955faa73dd6aaf18d07403fac6ed288` | `c1b2d1e99955faa73dd6aaf18d07403fac6ed288` | ✔ |
| `apps/frontend/eslint.config.mjs` (E-RED strip) | `4afd03a5af9a86271a1c0477781fcf12aeafccff` | `4afd03a5af9a86271a1c0477781fcf12aeafccff` | ✔ |

`git status --porcelain apps` → **empty**. Pre-change config blob `10bcf84c37bb69497ad139c74f1e84747e250bee`
→ post-change `4afd03a5af9a86271a1c0477781fcf12aeafccff`, recorded in the ledger header's placeholder.

## Verification

| Check | Result |
|-------|--------|
| `yarn lint:check` exits 0 on the clean tree | **PASS** — exit 0, `@openvaa/frontend:lint: ✖ 1 problem (0 errors, 1 warning)`, the exact pre-existing-warning baseline string; `Tasks: 22 successful, 22 total` |
| `yarn workspace @openvaa/frontend test:unit`, three consecutive runs | **PASS** — exit 0 x3, `Tests 889 passed (889)` x3, **zero** timeout messages. 889 = 807 baseline + 82 new |
| Ledger rows `A-NEW`, `B-NEW`, `C`, `D`, `E` populated with own command and HEAD | **PASS** — `grep -c 'pending — 157-15'` → **0** (was 31) |
| Row `C` records 0 errors inside the adapter | **PASS**, with a discrimination check making the 0 non-vacuous |
| Row `E` records RED then GREEN | **PASS** — 24 failed / 82 passed |
| `git status --porcelain apps` empty | **PASS** — 0 lines |
| `grep -c "MemberExpression\[property.name='supabase'\]"` | **1** |
| `grep -c "ObjectPattern > Property\[key.name='supabase'\]"` | **1** |
| `grep -c '\^@supabase/'` | **1** |
| `grep -c 'PROBE VERDICT'` in the config | **1** — the comment cites `157-14`'s verdict and states the inherited entries were re-included and why |
| `grep -c 'v10_config_lookup_from_file'` in the self-test | **2** |
| `grep -c '120_000\|120000'` in the self-test | **1** |
| `grep -c 'errorCount'` in the self-test | **0** |
| `eslint-store-guard.test.ts` unaffected | **PASS** — 30/30 |
| Comment-hygiene guard | **PASS** — 0 violations (2 caught and fixed during Task 1) |
| Prettier `--check` on all three files | **PASS** |
| Database untouched | **PASS** — no `db:*`, no pgTAP, no `db:lint:sql` |

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — the plan's literal instruction would have broken the build] Both halves of the ban moved into the narrow block**

- **Found during:** Task 1, before writing any config.
- **Issue:** the plan directed the two `no-restricted-imports` patterns into the **existing** `src/**`
  block, reasoning that "extending the existing arrays sidesteps the REPLACE trap for this half
  entirely". It does — but that block also covers `src/lib/api/adapters/**` and `src/lib/supabase/**`,
  and those files import `@supabase/ssr` and `@supabase/supabase-js` directly. Measured:
  `grep -rln "from '@supabase/" apps/frontend/src` → 10 files, 8 inside the boundary. `yarn lint:check`
  would have gone red on the adapter itself.
- **Fix:** both halves live in the narrow, allowlist-scoped block. This makes the REPLACE obligation
  **larger** than the plan expected, not smaller: block 2 sets both rules, so **all four** inherited
  entries are re-included there byte-identically, and all four carry a standing regression case.
- **Why this is the correct call:** it is exactly threat `T-157-37` (the guard firing inside the adapter
  and blocking all work), and row `C` is the measurement that the fix holds.
- **Files modified:** `apps/frontend/eslint.config.mjs`. **Commit:** `c02448bba`.

**2. [Rule 3 — blocking] Comment-hygiene rule 2 (D-A4) on the allowlist group headers**

- **Found during:** Task 1 verification.
- **Issue:** `// --- GROUP 1: … ---` ends with `-`, not terminal punctuation, and the next line continues
  the comment at the same indent. `scripts/assert-comment-hygiene.mjs` failed `lint:check` with exit 1 on
  two lines.
- **Fix:** headers rewritten as complete sentences ending in `.` (`// GROUP 1 of 2, the boundary's own
  inside, permanent by construction.`). Guard back to 0 violations.
- **Files modified:** `apps/frontend/eslint.config.mjs`. **Commit:** `c02448bba`.

**3. [Rule 2 — measurement integrity] Row C given a discrimination check the plan did not ask for**

- **Found during:** Task 3.
- **Issue:** row C as specified records "0 errors against an unmodified adapter file". But a guard scoped
  to nothing produces the same `0`, and the plan's own threat register (`T-157-37`) names that failure
  mode. The bare `0` would not have distinguished a working allowlist from an inert guard.
- **Fix:** the byte-identical adapter source was linted twice via `lintText`, changing only the virtual
  `filePath` — 0 boundary messages at its real allowlisted path, 9 at a guarded path. Recorded in the
  ledger as the row's real proof, with the bare `0` kept as the headline observation.
- **Files modified:** ledger only. **Commit:** `c3e2d2c26`.

**4. [Rule 1 — stale inherited framing] The ledger's opening paragraph amended rather than left standing**

- **Found during:** Task 3, writing the ledger.
- **Issue:** the ledger opens "Phase 157's adapter-boundary guard **does not exist yet**", which was true
  at `157-14` and is false at `157-15` close. Leaving it would have propagated a false premise into
  `157-16` and Phase 158 — the failure mode the standing "re-verification must amend, not merely append"
  rule exists to prevent.
- **Fix:** a `REGISTER STATUS: CLOSED` block added above it, stating that the paragraph is `157-14`'s
  framing preserved verbatim because it records the condition the OLD halves were taken under, and is not
  a description of the tree today. The `Opened by` and `Decisions discharged` bullets were likewise
  amended to name `157-15` as the closing plan. **No measured cell of `157-14`'s was altered.**
- **Files modified:** ledger only. **Commit:** `c3e2d2c26`.

### Scope note

The plan's Task 2 is marked `tdd="true"`, but the plan orders the implementation (Task 1) before the test
(Task 2), so a literal RED-before-GREEN was unavailable. Ledger row `E` is the plan's own designated
substitute and was executed as a genuine gate: the implementation was deleted under the existing test and
the failure was observed and characterised (24 of 82, exactly the "fires" assertions), then restored and
re-observed green. Nothing else departed from the plan.

## Known Stubs

None. No hardcoded empty value, placeholder string, `TODO`/`FIXME`, or unwired data source was
introduced. The ten grandfathered allowlist entries are **not** stubs: they are the measured, annotated
inventory of pre-existing leaks that Phase 158 owns, each one named with its disposition, and `157-16`
strikes the first of them.

## Threat Flags

None. This plan added no network endpoint, auth path, file-access pattern or schema change. It touched no
runtime source file — every source change was a temporary injection, restored byte-identically and proven
so by `git hash-object`. The two persisted files are a lint configuration and a test.

Threats closed by measurement: `T-157-36` (rows `A-NEW`/`B-NEW`), `T-157-19` (row `E`), `T-157-37`
(row `C` plus its discrimination check), `T-157-38` (four standing regressions plus the `--print-config`
enumeration), `T-157-39` (three consecutive full-suite runs, zero timeouts). `T-157-SC` holds: no package
was installed.

## Self-Check: PASSED

- `FOUND: apps/frontend/eslint.config.mjs` (blob `4afd03a5af9a86271a1c0477781fcf12aeafccff`)
- `FOUND: apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts`
- `FOUND: .planning/phases/157-adapter-boundary-typing/157-NEGATIVE-CONTROL-LEDGER.md`
- `FOUND: c02448bba` — `feat(157-15): install the paired adapter-boundary ESLint ban with an explicit annotated allowlist`
- `FOUND: 0c1a1a63c` — `test(157-15): prove the adapter-boundary guard fires, stays silent, and keeps the inherited bans`
- `FOUND: c3e2d2c26` — `docs(157-15): measure the negative control's NEW halves and close the register`
- `grep -c 'pending — 157-15'` in the ledger → **0** (was 31)
- `git status --porcelain apps` → **0 lines**
