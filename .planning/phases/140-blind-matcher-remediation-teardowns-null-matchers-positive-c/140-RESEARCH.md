# Phase 140: Blind-Matcher Remediation — Teardowns, Null-Matchers, Positive Controls - Research

**Researched:** 2026-08-15
**Domain:** Test-assertion design (Playwright E2E + vitest unit), seed-data topology, guard construction
**Confidence:** HIGH on the four findings' current shape and mechanisms (every site re-read from the live tree this session); MEDIUM on the recommended F3 matcher (its correctness depends on one measurement the phase must take in Plan 01); HIGH on F19 (Phase 139 already ran the negative controls and pre-specified the repair).

## Summary

This phase repairs four assertions that cannot fail, and the four repairs are **not** the same
difficulty. **F19 is essentially solved on paper**: Phase 139 ran the injections at all three sites,
observed the blind `toBeDefined()` pass against a live `null`, and pre-specified the exact repair
(`.not.toBeNull()`, or better `toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/)`), the exact injection diffs, and
the exact expected failure lines. Phase 140 applies the diff and re-runs the recorded control. **F10 is
a small, well-bounded job** whose only surprise is that the real `expect.soft` count is **136, not the
137 the ROADMAP and the audit both assert** — verified by count this session — which is itself the
argument for a counted guard over a corrected comment. **F9 is a design problem** with a clean answer
hiding in the seed data: each of the two perm datasets can be made to render the *complementary* tag,
so each spec gets its own in-dataset positive control and the pair goes red when the tags stop
rendering — exactly the criterion's wording, achieved with two template edits and two assertions.

**F3 is the one that will bite.** The obvious repair — swap `toBeGreaterThanOrEqual(0)` for
`toBeGreaterThan(0)` — is very likely **wrong for most of the 27 sites**, and the mechanism is
structural rather than incidental. Every perm setup calls `runTeardown('e2e-perm-', client)` as an
`extraTeardownPrefix` pre-clear before seeding its own prefix, while Playwright's `teardown:` key
defers each teardown project until every transitive dependent of its setup has finished — and the perm
family is one long serial chain. The consequence is that by the time most perm teardowns execute, a
downstream setup has already wiped their rows wholesale, so `rowsDeleted === 0` is the *correct*
outcome, not a leak. A blanket `toBeGreaterThan(0)` would turn most of the perm teardown family red on
a full-suite run. Separately, `e2e-perm-notloc-` is owned by **two** teardown files, so one of them is
guaranteed a legitimate zero whenever both run. The phase must therefore **measure** the per-site
`rowsDeleted` before choosing the matcher, and should prefer a **before/after invariant** (rows existed
under the prefix ⇒ they are gone, and the delete accounted for them) over a bare positivity floor.

**Primary recommendation:** Sequence the phase F19 → F10 → F9 → F3, land the shared-helper for F3 in
its own wave preceded by an instrumented measurement run, and use `tests/scripts/e2e-run.sh` as the
sole vehicle for every E2E evidence run so the Phase-137 preflight verdict is captured mechanically
rather than asserted.

## User Constraints

**No `CONTEXT.md` exists for this phase.** `/gsd-discuss-phase` was not run, so there are **no locked
decisions** and **no deferred-ideas list**. Every design call in this phase is Claude's discretion,
bounded by the ROADMAP success criteria and by `CLAUDE.md`. The four genuinely open calls the operator
has not ruled on are enumerated in `## Open Questions` with a recommendation and evidence for each; the
planner should treat those four as the phase's decision checkpoints rather than settling them silently.

## Project Constraints (from CLAUDE.md)

| # | Directive | Consequence for this phase |
|---|---|---|
| C-1 | **E2E Hard Rule — cardinal failure.** No task may proceed, complete, or be marked done while any E2E test is failing. No "known-flaky" exemptions; a "did not run" counts as a failure. | Every commit in this phase must leave the suite green. The F3 matcher change is the one edit capable of reddening ~26 projects at once — it must not be committed before the measurement in Plan 01. |
| C-2 | **Prefer E2E for interim verification; run the whole suite** (`yarn test:e2e`). | Per-project smokes are for iteration; the phase-gate evidence is a full-suite run. |
| C-3 | **E2E preflight is unskippable** (Playwright global setup, `tests/global-setup.ts`). Every evidence run must satisfy it. | Use `tests/scripts/e2e-run.sh`, which captures the preflight verdict as a positive fact (exit 6 if it finds no success line). |
| C-4 | **One fresh dev server on :5173, no Playwright `webServer`; clean DB (`yarn db:reset`) before the full-suite gate.** | `e2e-run.sh` already spawns and owns its own dev server and runs `db:reset` — do not hand-roll this. |
| C-5 | **Never commit sensitive data.** | The F19 injections strip live OIDC authentication material (`&request=`, `client_assertion`). They are transient-only: inject → run → revert inside the same task, never committed, and **no `yarn dev` / Playwright command may run while one is live**. |
| C-6 | **Use TypeScript strictly — avoid `any`, prefer explicit types.** | `yarn typecheck:tests` is part of `yarn lint:check`; any new helper under `tests/` must typecheck. |
| C-7 | **Always check work against `.agents/code-review-checklist.md`.** | Applies to the shared teardown helper and any new guard module. |
| C-8 | Svelte 5 Context Destructuring Rule; `dataRoot` `#version`-bridge carve-out. | Only relevant if F9's positive control requires touching `QuestionHeading.svelte` — it should not. The F9 injection *does* edit that file transiently; the edit must be a deletion of the `{#if}` block, not a refactor of the `ctx` reads. |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **ASSERT-02 (F3)** | The 27 `*.teardown.ts` row-count assertions assert the expected count; a teardown that deletes nothing fails. | § *F3 — the 27 teardown assertions* below: exact site inventory (27 of 28 files), the `countDeletedRows` mechanism proving unfailability, the **teardown-ordering hazard** that rules out `toBeGreaterThan(0)`, the duplicate-prefix hazard, the shared-helper design that satisfies "by construction", and the measurement that must precede the matcher choice. |
| **ASSERT-03 (F19)** | The `toBeDefined()` sites on `URLSearchParams.get()` / `FormData.get()` assert an actual value; a missing parameter fails. | § *F19 — three null-blind matchers*: all three sites re-read with line numbers, Phase 139's pre-specified injections and expected failure lines, the two-layer blindness at the third site (`!` non-null assertion), and the matcher-form analysis that makes the failure *name the parameter* rather than throw downstream. |
| **ASSERT-05 (F9)** | A positive control exists for the two absence assertions; a tag that never renders fails the pair. | § *F9 — absence-only tag assertions*: the render gate (`getElectionsToShow` returns `[]` below 2 elections), the settings matrix across `shared.ts` / the two perm templates / `base.ts`, and three candidate positive-control designs with a recommendation that makes **the pair itself** go red. |
| **ASSERT-06 (F10)** | `voter-journey.spec.ts`'s documented budget matches the actual count, or the budget is enforced. | § *F10 — the `expect.soft` budget*: the stated budget quoted verbatim with its line, the **corrected count (136, not 137)**, the three sibling files with the same drift, and two guard shapes with in-repo precedent. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| F3 row-count assertion | **E2E harness** (`tests/tests/setup/**`) | `packages/dev-seed` (`runTeardown` return contract) | The assertion is a Playwright teardown-project concern. `runTeardown` already returns the number; the fix is *what the harness asserts about it*, not a change to the deletion RPC. Pushing the assertion into `dev-seed` would make a library throw on a caller's policy. |
| F3 "by construction" coverage | **E2E harness — one shared module** under `tests/tests/setup/shared/` | — | 27 call sites must not each carry a hand-edited matcher. A single exported assertion helper is the only shape in which the 27th file is covered by construction. |
| F19 matcher repair | **Frontend unit tests** (`apps/frontend/src/lib/api/utils/auth/**`) | — | Pure vitest assertion edits. No product code changes. The *injections* touch `providers/idura.ts` transiently and are reverted. |
| F9 positive control | **Seed data** (`packages/dev-seed/src/templates/e2e/perm/*`) + **E2E spec** (`tests/tests/specs/perm/*`) | Frontend render path (injection target only) | The criterion says "seeded data, not a comment": the control's precondition is a dataset in which the tag *must* render. That precondition is a template property; the assertion that reads it is a spec property. |
| F10 budget truth | **E2E harness** — the spec's own header + a counted guard | Playwright config (config-load throw) or vitest (unit test) | The stated budget is documentation on the spec; the enforcement is a check. Repo precedent puts harness-invariant checks at config-load time (`playwright.config.ts:34-48`). |
| Two-run control evidence | **`tests/scripts/e2e-run.sh` / `determinism-batch.sh`** for E2E; **`npx vitest run <file>`** from inside the workspace for unit | — | Phase 137 built the preflight-verdict capture into `e2e-run.sh`; Phase 139 built the HYGIENE-LOOP around the vitest form. Neither should be re-derived. |

## Standard Stack

No new dependencies. Every mechanism this phase needs already exists in the tree.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | 1.58.2 `[VERIFIED: npx playwright --version → "Version 1.58.2"]` | E2E runner; `expect` in teardown projects; project `teardown:` graph | Already the suite's runner; the F3 assertion lives inside a `teardown()` test. |
| `vitest` | 3.2.4 `[VERIFIED: node -e require('./node_modules/vitest/package.json').version]` | Unit runner for the three F19 sites and any new guard unit test | Already the repo's unit runner (`yarn test:unit` → `turbo run test:unit`). |
| `eslint-plugin-playwright` | ^2.9.0 `[VERIFIED: package.json:59]` | Existing lint posture on `tests/`; candidate host for an `expect.soft` ban | Already wired in `tests/eslint.config.mjs`. |
| `@openvaa/dev-seed` `runTeardown` | workspace | Returns `{ rowsDeleted, storageRemoved }` | The value the 27 assertions assert about. |

### Supporting

| Module | Path | Purpose | When to Use |
|---|---|---|---|
| `e2e-run.sh` | `tests/scripts/e2e-run.sh` | ONE preflight-confirmed E2E run into an evidence directory | Every E2E run used as phase evidence. Exit 6 = "no preflight success line" — do not treat a green Playwright exit alone as evidence. |
| `determinism-batch.sh` | `tests/scripts/determinism-batch.sh` | Loops `e2e-run.sh` N times | The phase-close gate if the operator wants more than one clean run. |
| `assertServedApp` | `tests/tests/support/preflight.ts` | The Phase-137 served-app gate; invoked from `tests/global-setup.ts:52` | Nothing to do — it fires automatically. Just don't bypass `e2e-run.sh`. |
| `setupFromTemplate` | `tests/tests/setup/shared/setupFromTemplate.ts` | Seeds a named template; pre-clears prefixes | Read `:184-196` before touching F3 — this is where the wholesale `e2e-perm-` pre-clear happens. |
| `SupabaseAdminClient` (tests) | `tests/tests/utils/supabaseAdminClient.ts:101` | Extends the dev-seed client; exposes `query(collection)` (PostgREST builder) at `:194` | A residue/before-count probe for the F3 repair would be built on `client.query('<table>').like('external_id', prefix + '%')`. |
| `listCandidateIdsByPrefix` | `packages/dev-seed/src/supabaseAdminClient.ts:839` | Candidate UUIDs matching a prefix | The audit's suggested residue probe — note it covers **candidates only**, not the other 9 tables. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A shared assertion helper for F3 | 27 hand-edited call sites | Explicitly ruled out by ROADMAP criterion 1 ("by construction rather than by 27 hand edits nobody re-checks"). |
| A config-load throw for the F10 guard | A vitest unit test under `tests/` | The config-load throw fires on *every* `playwright test` and `--list` invocation (proven by the orphan-probe guard); a vitest test only fires under `yarn test:unit`, and `tests/` is not currently a `test:unit` workspace. Config-load is the stronger reach. |
| A counted guard for F10 | `playwright/no-restricted-matchers` with a `soft` modifier entry | The rule's own description is "Disallow specific matchers **& modifiers**" `[VERIFIED: node -e require('eslint-plugin-playwright').rules['no-restricted-matchers'].meta.docs.description]`, but whether `soft` is an accepted key is unverified. A lint ban is also all-or-nothing — it cannot express "136 is the budget". |
| A new `perm-show-tags` project for F9 | Positive controls inside the existing pair | A new project adds a setup + teardown + spec + a link in the serial perm chain (≈4 files + config edits) for one assertion, and it would *not* make the criterion's "the pair go red" literally true. |

**Installation:** none. No package is added, removed, or upgraded by this phase.

## Package Legitimacy Audit

**Not applicable — this phase installs zero external packages.** Every module it touches is either
already a declared dependency (`@playwright/test`, `vitest`, `eslint-plugin-playwright`) or an in-repo
workspace (`@openvaa/dev-seed`). No `npm install` / `yarn add` appears in any recommended action, so the
Package Legitimacy Gate has no input to run against.

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

---

## Finding-by-finding: what is actually there

### F3 — the 27 teardown row-count assertions

**Inventory, measured this session.** There are **28** `*.teardown.ts` files under `tests/tests/setup/`;
**27** carry the assertion. The one that does not is
`tests/tests/setup/candidate/candidate-journey.teardown.ts` — it only calls `unregisterCandidate` and
never calls `runTeardown`. `[VERIFIED: find tests -name "*.teardown.ts" → 28 files; grep -rn "rowsDeleted" tests/ → 27 distinct files]`

The 27 break down as 25 under `setup/perm/`, plus `setup/shared/base.teardown.ts` and
`setup/candidate/bank-auth-journey.teardown.ts`.

**The assertion, verbatim** `[VERIFIED: tests/tests/setup/perm/perm-hide-category-tags.teardown.ts:13-17]`:

```ts
teardown('delete perm-hide-category-tags dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
```

All 27 are byte-identical on the `expect` line.

**Why it cannot fail, from the source of truth** `[VERIFIED: packages/dev-seed/src/cli/teardown.ts:146-155]`:

```ts
function countDeletedRows(result: Record<string, unknown>): number {
  let total = 0;
  for (const value of Object.values(result)) {
    if (value && typeof value === 'object' && 'deleted' in (value as Record<string, unknown>)) {
      const n = (value as { deleted: unknown }).deleted;
      if (typeof n === 'number' && Number.isFinite(n)) total += n;
    }
  }
  return total;
}
```

`total` initialises to `0` and only ever accumulates finite numbers, so the return value is always a
non-negative number. The assertion's own failure message — *"runTeardown returned non-numeric
rowsDeleted"* — names a state this function provably cannot produce.

**There is no shared helper today.** Each of the 27 files imports `runTeardown` from `@openvaa/dev-seed`
and writes its own `expect`. `tests/tests/setup/shared/` contains exactly four files —
`auth.setup.ts`, `base.setup.ts`, `base.teardown.ts`, `setupFromTemplate.ts` `[VERIFIED: ls tests/tests/setup/shared/]` — none of
which is a teardown-assertion helper. **The "shared helper" the ROADMAP criterion refers to does not
exist yet; creating it is part of the deliverable.**

#### The hazard that reshapes this finding

Two independent mechanisms make `rowsDeleted === 0` a *legitimate* outcome at most of the 27 sites.

**Mechanism 1 — every perm setup wipes the whole `e2e-perm-` family before seeding.**
`[VERIFIED: tests/tests/setup/perm/perm-hide-category-tags.setup.ts:12-16]`:

```ts
setup('import perm-hide-category-tags dataset', async () => {
  await setupFromTemplate('perm-hide-category-tags', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
```

and `[VERIFIED: tests/tests/setup/shared/setupFromTemplate.ts:184-196]`:

```ts
  if (options?.extraTeardownPrefix) {
    const prefixes = Array.isArray(options.extraTeardownPrefix)
      ? options.extraTeardownPrefix
      : [options.extraTeardownPrefix];
    for (const extra of prefixes) {
      await runTeardown(extra, client);
    }
  }

  // 1b. Pre-clear any stale state from a prior run. runTeardown's 2-char
  //     guard requires prefix.length >= 2; the base dataset uses
  //     'test-e2e-base-' (empty-prefix fallback above).
  await runTeardown(teardownPrefix, client);
```

So setup N deletes every `e2e-perm-*` row in the database — including perm N-1's, N-2's, … — before
seeding its own.

**Mechanism 2 — `teardown:` defers each teardown past its setup's transitive dependents.** The perm
family is one serial chain: each perm setup's `dependencies` names the *previous perm spec*, e.g.
`[VERIFIED: tests/playwright.config.ts:1017-1034]`:

```ts
    {
      name: 'data-setup-perm-hide-category-tags',
      testMatch: /perm-hide-category-tags\.setup\.ts/,
      teardown: 'data-teardown-perm-hide-category-tags',
      dependencies: ['perm-hide-election-tags']
    },
```

`tests/README.md` states the semantics plainly `[VERIFIED: tests/README.md, "Concurrency model"]`:

> `teardown: '<project>'` runs the named teardown project after this project and all its transitive dependents complete.

Combining the two: setup N is a transitive dependency of the entire downstream chain, so
`data-teardown-perm-<N>` does not run until the chain finishes — by which time every downstream setup
has already wiped `e2e-perm-*`. **Expected `rowsDeleted` for most perm teardowns in a full-suite run is
therefore 0.**

**Mechanism 3 (independent, smaller) — a duplicated prefix.** Two teardown files own the *same*
prefix `[VERIFIED: grep -rn "^const PREFIX" tests/tests/setup/**/*.teardown.ts]`:

```
candidate/bank-auth-journey.teardown.ts:26:const PREFIX = 'e2e-perm-notloc-';
perm/perm-not-located-2e2cg.teardown.ts:11:const PREFIX = 'e2e-perm-notloc-';
```

Whichever runs second necessarily deletes 0 rows. `bank-auth-journey` is opt-in
(`PLAYWRIGHT_BANK_AUTH`), so this only bites on bank-auth runs — but it bites deterministically.

**Consequence:** `toBeGreaterThan(0)` — the audit's first suggestion — is **not a safe blanket repair**.
Committing it without measurement would very likely redden ~26 teardown projects in one commit, a
direct cardinal-rule violation (C-1).

#### Repair shapes, ranked

| # | Shape | Fails when the delete matches nothing? | Order-independent? | Notes |
|---|---|---|---|---|
| **A (recommended)** | **Before/after invariant in a shared helper**: count rows under `PREFIX` before the delete, assert `rowsDeleted === before` **and** `after === 0`, with a message naming the prefix and both numbers | **Yes** — a prefix typo or a silent RPC no-op gives `before > 0, rowsDeleted 0` → fail | **Yes** — legitimately passes when `before === 0` | Directly satisfies ASSERT-02's "assert the **expected count**". Needs a row-count probe across the 10 tables (or a representative subset). |
| B | Post-delete residue only: `expect(await listCandidateIdsByPrefix(PREFIX)).toHaveLength(0)` | **No** — a typo'd prefix yields 0 residue *under the typo* while the real rows leak | Yes | The audit's second suggestion. Weaker, and candidate-table-only. |
| C | `expect(rowsDeleted).toBeGreaterThan(0)` | Yes | **No** — breaks on mechanisms 1–3 | The audit's first suggestion. Only viable if the measurement disproves the ordering hazard. |
| D | Per-site expected constant (`toBe(N)`) | Yes | No — brittle to any template row-count change | Rejected: 27 magic numbers is worse than what it replaces. |
| E | Delete the `expect` entirely ("the throw is the guard") | n/a | n/a | Rejected: ASSERT-02 requires an assertion on the count. |

**Shape A satisfies "by construction"**: all 27 call sites import one helper, e.g.

```ts
// tests/tests/setup/shared/assertTeardown.ts  (NEW — shape only, not final)
export async function runTeardownAsserted(prefix: string, client: SupabaseAdminClient): Promise<void> { … }
```

and the injection for the two-run control mutates **the helper**, once. The 27th file is covered
because it calls the helper, not because someone remembered to edit it.

#### The measurement Plan 01 must take before choosing the matcher

Instrument the helper (or a temporary wrapper) to record `{ prefix, before, rowsDeleted, after }` for
every teardown invocation during **one** full preflight-confirmed suite run via
`tests/scripts/e2e-run.sh`, and write the table into the phase record. That table is what turns the
matcher choice from a guess into a decision. It also directly produces the "sample spanning the shared
helper and the 27 call sites" that criterion 1 asks for.

---

### F19 — three null-blind matchers

All three sites re-read this session; all three are **line-exact** to Phase 139's citations.

**Site 1** `[VERIFIED: apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:141-148]`:

```ts
    // Extract the request param from the URL
    const url = new URL(authorizeUrl);
    const requestParam = url.searchParams.get('request');
    expect(requestParam).toBeDefined();

    // JWT has 3 dot-separated segments
    const parts = requestParam!.split('.');
    expect(parts).toHaveLength(3);
```

**Site 2** `[VERIFIED: apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts:145-152]` — note the
path: this file is **not** under `__tests__/`, it sits beside the provider:

```ts
      // Extract the request parameter from the URL
      const url = new URL(result.authorizeUrl);
      const requestParam = url.searchParams.get('request');
      expect(requestParam).toBeDefined();

      // The request parameter should be a valid JWT (3 base64url segments)
      const parts = requestParam!.split('.');
      expect(parts).toHaveLength(3);
```

**Site 3** `[VERIFIED: apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:165-171]`:

```ts
    expect(capturedFetchBody).not.toBeNull();
    const assertion = capturedFetchBody!.get('client_assertion')!;
    expect(assertion).toBeDefined();

    // JWT has 3 dot-separated segments
    const parts = assertion.split('.');
    expect(parts).toHaveLength(3);
```

**Mechanism.** `URLSearchParams.get()` returns `string | null` — `null`, never `undefined`, for an
absent parameter — and `toBeDefined()` fails only on `undefined`. Site 3 is blind on a *second*
independent layer: the `!` at `:166` is a compile-time claim the runtime does not enforce, so the type
system has been told `null` is impossible while `null` is exactly what arrives.

Note site 3's `:165` — `expect(capturedFetchBody).not.toBeNull()` — is the **correct idiom, one line
above**, applied to the container instead of the value. The repair matches the file's own neighbour.

**Phase 139 already ran the controls.** Recorded verdicts: all three `confirmed`, with the assertion
column PASS and the file column FAIL at the `split('.')` line in each case
`[CITED: .planning/phases/139-.../139-VERDICTS.md §§ 5.7.4, 5.8, 5.9.4]`. The pre-specified injections:

| Site | Injection (re-apply verbatim) | Expected failing line **today** |
|---|---|---|
| 1 + 2 (shared) | `apps/frontend/src/lib/api/utils/auth/providers/idura.ts:74` — `` `&request=${requestObject}`; `` → `` ``; `` | `authorize-endpoint.test.ts:147:33` / `idura.test.ts:151` — `TypeError: Cannot read properties of null (reading 'split')` |
| 3 | `providers/idura.ts:101-102` — delete the `client_assertion` entry entirely and drop the preceding trailing comma | `token-endpoint.test.ts:170:29` — same `TypeError` |

**Do NOT use the `undefined as unknown as string` variant** at site 3. Phase 139 measured that
`new URLSearchParams({ b: undefined })` stringifies to the four-character string `"undefined"`, so
`.get()` returns a non-empty string and the run models a *malformed* assertion rather than a missing
one — recorded as rejected design R-6 `[CITED: 139-VERDICTS.md § 5.9.2]`.

**Making the failure name the parameter (criterion 2's real requirement).** Three candidate forms:

| Form | Fails on `null`? | Fails on `""`? | Fails on `"undefined"`? | Message names the parameter? |
|---|---|---|---|---|
| `expect(x).not.toBeNull()` | Yes | No | No | Only via the optional message argument |
| `expect(x).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/)` | Yes (non-string) | Yes | Yes | Shows the received value; error text is matcher-generic |
| `expect(x, '<message>').not.toBeNull()` / `expect(x, '<message>').toMatch(…)` | as above | as above | as above | **Yes — explicitly** |

Vitest's `expect(actual, message)` second-argument form is already used in this repo — the 27 teardown
assertions use it `[VERIFIED: perm-hide-category-tags.teardown.ts:16 — expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted')]`.
**Recommendation:** use the message form with `toMatch` at all three sites, e.g.

```ts
const requestParam = url.searchParams.get('request');
expect(requestParam, "authorize URL is missing the 'request' (JAR) parameter").toMatch(
  /^[\w-]+\.[\w-]+\.[\w-]+$/
);
```

This fails **at the assertion line**, names the missing parameter in the message, subsumes the existing
`toHaveLength(3)` check, and is red under both the absence and the malformed-value axes. At site 3, drop
the trailing `!` at `:166` in the same edit — keeping it re-asserts at the type level exactly what the
new matcher exists to check at runtime.

**Ownership seam:** Phase 139 records that Phase 140 owns this repair under ASSERT-03 and Phase 142
owns the F19 line of ASSERT-07, and that **one diff serves both**
`[CITED: 139-VERDICTS.md §§ 5.7.6, 5.8.6, 5.9.6]`. The planner should note in the phase record that
Phase 142's F19 obligation is discharged here so 142 does not redo it.

---

### F9 — absence-only tag assertions

**The two specs, each a single assertion**
`[VERIFIED: tests/tests/specs/perm/perm-hide-category-tags.spec.ts:21-22 and perm-hide-election-tags.spec.ts:22-23]`:

```ts
    await navigateToFirstQuestion(page);
    await expect(page.getByTestId(testIds.shared.categoryTag)).toHaveCount(0);
```
```ts
    await navigateToFirstQuestion(page);
    await expect(page.getByTestId(testIds.shared.electionTag)).toHaveCount(0);
```

**The testids exist and are used nowhere else in `tests/`.** `grep -rn "categoryTag\|electionTag" tests/`
returns exactly six hits: the two assertions, two doc-comment mentions, and the two definitions
`[VERIFIED: tests/tests/utils/testIds.ts:373 — `electionTag: 'election-tag',`; :377 — `categoryTag: 'category-tag',`]`.
Their render sites: `apps/frontend/src/lib/components/electionTag/ElectionTag.svelte:43` and
`categoryTag/CategoryTag.svelte:42` `[VERIFIED: grep -rn "category-tag\|election-tag" apps/frontend/src]`.

**The render gate — this is the fact that constrains the design**
`[VERIFIED: apps/frontend/src/lib/utils/questions/electionTags.ts:6-15]`:

```ts
export function getElectionsToShow({
  question,
  elections
}: {
  question: AnyQuestionVariant;
  elections: Array<Election>;
}): Array<Election> {
  if (elections.length < 2) return [];
  return elections.filter((e) => question.appliesTo({ elections: [e] }));
}
```

and the heading `[VERIFIED: apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte:80-93]`:

```svelte
    {#if appSettings.elections.showElectionTags}
      {#each getElectionsToShow({ question, elections }) as election}
        <ElectionTag {election} {onShadedBg} />
      {/each}
    {/if}
    {#if appSettings.questions.showCategoryTags}
      <CategoryTag … />
    {:else if blockWithStats}
      {t('common.question')}
      <span class="text-secondary">{blockWithStats.index + 1}/{numQuestions}</span>
    {/if}
```

**So `ElectionTag` needs ≥2 elections in scope, not merely the flag.** The election-tags spec's own
docstring already knows this — *"With 2 elections in the dataset the tag would normally render"*
`[VERIFIED: perm-hide-election-tags.spec.ts:3-4]` — and the template supplies them.

**The settings matrix, read from the three template sources:**

| Dataset | `questions.showCategoryTags` | `elections.showElectionTags` | elections | Source |
|---|---|---|---|---|
| perm shared baseline | **false** | **true** | 1 (buildMinimal default) | `[VERIFIED: packages/dev-seed/src/templates/e2e/perm/shared.ts:96 — "showCategoryTags: false,"; :110 — "showElectionTags: true"]` |
| `perm-hide-category-tags` | false (overlay, redundant with baseline) | true (inherited) | **1** | `[VERIFIED: packages/dev-seed/src/templates/e2e/perm/perm-hide-category-tags.ts:20-28 — buildMinimal({ externalIdPrefix: P, candidates: 1, opinionQuestions: 1, infoQuestions: 0, settingsOverlay: { questions: { showCategoryTags: false } } })]` |
| `perm-hide-election-tags` | false (inherited) | **false** (overlay) | **2** | `[VERIFIED: packages/dev-seed/src/templates/e2e/perm/perm-hide-election-tags.ts:21-30 — same call plus `elections: 2` and `settingsOverlay: { elections: { showElectionTags: false } }`]` |
| `e2e/base` | **true** | **true** | **2** (`el-reg`, `el-mun`) | `[VERIFIED: packages/dev-seed/src/templates/e2e/base.ts:209 — "showCategoryTags: true,"; :234 — "showElectionTags: true"; :411 / :423 — external_ids 'test-e2e-base-el-reg' and 'test-e2e-base-el-mun']` |

**The walk selects all elections by default**
`[VERIFIED: tests/tests/utils/voterNavigation.ts, the elections branch of advanceVoterFlow — "// Accept the default selection (all elections pre-checked)."]`,
and `voter-journey.spec.ts:691` has an explicit step *"continue with the default election selection"*
whose body ensures both are selected. So in both `e2e/base` and `perm-hide-election-tags`, two elections
reach `getElectionsToShow`.

#### Three positive-control designs

| # | Design | Makes **the pair** go red on a tag-render deletion? | Cost | Risk |
|---|---|---|---|---|
| **A (recommended)** | **Complementary-tag control inside each existing perm spec.** Give `perm-hide-category-tags` `elections: 2` (its baseline already has `showElectionTags: true`) and assert `electionTag` count **> 0** alongside the existing `categoryTag === 0`. Give `perm-hide-election-tags` a `questions: { showCategoryTags: true }` overlay and assert `categoryTag > 0` alongside `electionTag === 0`. | **Yes, literally.** Deleting the `<CategoryTag>` render reds `perm-hide-election-tags`; deleting `<ElectionTag>` reds `perm-hide-category-tags`; deleting both reds both. | 2 template edits + 2 spec assertions. No new project, no config change. | Bumping `perm-hide-category-tags` to 2 elections adds the election-selector page to its walk — handled generically by `advanceVoterFlow`. Must be verified by running the project once. |
| B | Add positive assertions to `voter-journey.spec.ts` (base dataset, both flags true, 2 elections) — the audit's suggestion. | Only if "the pair" is read loosely as "the suite". The two perm specs themselves stay green. | 2 lines. | Cheapest, but it does not satisfy the criterion's literal wording, and it parks the control in a 1869-line serial walk where a failure is least legible — the exact legibility problem F10 is about. |
| C | New `perm-show-tags` project: template with both flags true + 2 elections, its own setup/teardown/spec, spliced into the serial perm chain. | Yes (a third project reds). | ~4 new files + 3 config blocks + a chain re-link. | Highest cost; and it still leaves the pair green, same as B. |

**Recommendation: A, with B's two lines added as cheap redundancy** if the planner wants the base
dataset covered too. A is the only design under which the ROADMAP's sentence — *"`perm-hide-category-tags`
/ `perm-hide-election-tags` FAIL when the tag element stops rendering anywhere"* — is literally true.

**The injection for the two-run control:** delete the `{#if appSettings.elections.showElectionTags}`
block and/or the `{#if appSettings.questions.showCategoryTags}` `<CategoryTag>` branch from
`QuestionHeading.svelte:80-89`, run the two perm projects, revert. Before the change both stay green;
after, the corresponding spec goes red.

**One thing to verify empirically before writing the assertion (the audit's own stated uncertainty —
"Confidence: medium … I have not confirmed the tags actually render under the base dataset's flag
values"):** run each modified perm project once and confirm the positive assertion is *non-vacuous*,
i.e. it is green because a tag rendered, not because the locator resolved oddly. A count assertion of
`> 0` that is green is only meaningful if the same assertion is red under the deletion injection —
which is precisely what the two-run control establishes. Do not accept the positive control on the
green half alone.

---

### F10 — the `expect.soft` budget

**The stated budget, verbatim** `[VERIFIED: tests/tests/specs/voter/voter-journey.spec.ts:13-14]`:

```
 * dataset-conditional walk logic. Genuinely soft assertions use
 * `expect.soft` (3-slot budget honored).
```

**The real count is 136, not 137.** `[VERIFIED: grep -o 'expect\.soft(' tests/tests/specs/voter/voter-journey.spec.ts | wc -l → 136; grep -c → 136; no line carries two occurrences]`
The ROADMAP criterion 4, `REQUIREMENTS.md:59` and the audit all say **137**
`[CITED: .planning/audits/2026-08-11-fake-guard-sweep.md, F10 — "grep -c ... → 137"]`. The file has
drifted by one since 2026-08-11. **This is the finding in miniature**: a number written into a comment
in four documents was already stale four days later. It is the strongest available argument for the
counted-guard option over the corrected-number option, and the planner must not hard-code 137 — the
budget constant is whatever the count is at implementation time.

**Three sibling files carry the same drift, unlisted by the audit** `[VERIFIED: grep -rc "expect\.soft(" tests/tests + grep -n "Rigidity contract" on each]`:

| File | Declared posture | Actual `expect.soft` count |
|---|---|---|
| `tests/tests/specs/candidate/candidate-journey.spec.ts:47-48` | `* Rigidity contract:` / `*   - 0 expect.soft` | **3** (`:389`, `:396`, `:524`) |
| `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:43-44` | `**Rigidity contract:** NO \`expect.soft\`, …` | **6** (`:119, :123, :129, :132, :163, :174`) |
| `tests/tests/fixtures/candidate/candidateHomePage.fixture.ts:23-24` | `**Rigidity contract:** NO \`expect.soft\`, …` | **4** (`:54, :57, :69, :71`) |

68 files in `tests/` carry a "Rigidity contract" header `[VERIFIED: grep -rln "Rigidity contract" tests/tests | wc -l → 68]`.
ASSERT-06's scope is `voter-journey.spec.ts` only, so these three are **out of scope** — but a guard
built repo-wide catches all four for the same effort, and a guard built for one file leaves three live
false statements in the tree. The planner should make this an explicit scope decision rather than an
accident.

#### Two guard shapes, with in-repo precedent

**Shape 1 — config-load throw (recommended).** Precedent: the Phase-136 orphan-probe guard, which the
ROADMAP itself cites as "already proven to discriminate"
`[VERIFIED: tests/playwright.config.ts:33-47]`:

```ts
const probesDir = path.join(TESTS_DIR, 'specs/_probes');
if (fs.existsSync(probesDir)) {
  const orphans = fs
    .readdirSync(probesDir)
    .filter((f) => f.endsWith('.probe.spec.ts'))
    .filter((f) => !PROBE_TEST_MATCH.test(f));
  if (orphans.length > 0) {
    throw new Error(
      `Orphaned probe spec(s) in tests/specs/_probes — they match NO Playwright project and run ` +
        …
    );
  }
}
```

Its docstring states the design principle this phase is built on, verbatim
`[VERIFIED: tests/playwright.config.ts:29-31]`:

> A comment asking future authors to keep the list in sync would be the same kind of non-guard this
> phase exists to remove, so the invariant is CHECKED.

An `expect.soft` budget guard in the same file, reading the spec and throwing when the count exceeds the
declared budget, fires on **every** `playwright test` and `--list` invocation.

**Shape 2 — vitest unit test**, precedent `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:39-55`,
which pairs a named positive control with a named negative control. Its reach is narrower: `tests/` is
not currently a `test:unit` workspace (`yarn test:unit` = `turbo run test:unit` `[VERIFIED: package.json:25]`),
so such a test would need a home — and Phase 141, not 140, owns `test:unit` wiring.

**Recommendation:** do **both** halves of criterion 4 — (a) rewrite the header to state the real
posture and *why* (a long serial walk where soft assertions keep one broken card from hiding 130 other
checks), stating the budget as a named constant rather than a prose number, and (b) add a config-load
counted guard pinned to the measured count with an explanatory message. Then criterion 4's observable —
"add one more `expect.soft` and the guard fails" — is executable, and the corrected-number option's
weakness (it goes stale again, as it already has) is closed.

---

## Architecture Patterns

### System Architecture Diagram

```
                      ┌──────────────────────────────────────────────┐
   operator ────────► │ tests/scripts/e2e-run.sh                     │
                      │  db:reset → spawn+own dev server → playwright │
                      └───────────────┬──────────────────────────────┘
                                      │ (exit 6 if no preflight success line)
                                      ▼
                      ┌──────────────────────────────────────────────┐
                      │ tests/global-setup.ts → assertServedApp()    │  ◄── Phase 137 gate
                      └───────────────┬──────────────────────────────┘      (unskippable)
                                      ▼
        ┌─────────────────────────────┴────────────────────────────────┐
        │                    Playwright project graph                   │
        │                                                               │
        │  data-setup-base ─► voter-journey ──────────────┐             │
        │       │  (F10 guard reads this spec at CONFIG-LOAD, before    │
        │       │   any of this graph is constructed)                   │
        │       └─► … ─► perm chain (serial):                          │
        │              setup-N ─► spec-N ─► setup-N+1 ─► spec-N+1 …     │
        │                 │ extraTeardownPrefix ['test-','e2e-perm-']   │
        │                 │  ── wipes ALL e2e-perm-* rows ──┐           │
        │                 │                                 ▼           │
        │              teardown-N  (deferred until every transitive     │
        │                          dependent finishes ⇒ runs at the END)│
        │                     │                                          │
        │                     └─► runTeardown(PREFIX) ─► rowsDeleted     │
        │                              │                                 │
        │                              ▼                                 │
        │              ┌────────────────────────────────────┐            │
        │              │ NEW shared assertion helper (F3)   │            │
        │              │  before-count → delete → after=0   │            │
        │              │  27 call sites, ONE matcher        │            │
        │              └────────────────────────────────────┘            │
        │                                                               │
        │  perm-hide-election-tags spec ──┐                             │
        │  perm-hide-category-tags spec ──┤ each asserts BOTH            │
        │                                 │  absence(own tag) = 0        │
        │                                 │  presence(other tag) > 0  ◄── F9
        │                                 ▼                             │
        │                    QuestionHeading.svelte {#if} blocks         │
        │                    (transient injection target)               │
        └───────────────────────────────────────────────────────────────┘

    Separate lane (vitest, no dev server, no Playwright):
      providers/idura.ts  ──(transient injection)──►  3 auth test files (F19)
```

### Component Responsibilities

| Component | Path | Responsibility in this phase |
|---|---|---|
| Shared teardown assertion helper | `tests/tests/setup/shared/assertTeardown.ts` *(new)* | Owns the single F3 matcher; the "by construction" coverage of all 27 sites |
| 27 teardown files | `tests/tests/setup/{perm,shared,candidate}/*.teardown.ts` | Call the helper; carry no matcher of their own after the change |
| `runTeardown` | `packages/dev-seed/src/cli/teardown.ts:104-137` | Unchanged. Returns `{ rowsDeleted, storageRemoved }` |
| Two perm templates | `packages/dev-seed/src/templates/e2e/perm/perm-hide-{category,election}-tags.ts` | Carry the F9 positive-control precondition (seeded data) |
| Two perm specs | `tests/tests/specs/perm/perm-hide-{category,election}-tags.spec.ts` | Carry the F9 presence assertion beside the existing absence assertion |
| `voter-journey.spec.ts` header | `:13-14` | Restated posture + named budget constant (F10) |
| `playwright.config.ts` | top-of-file guard block | Counted `expect.soft` guard (F10), sibling to the orphan-probe guard |
| 3 auth test files | `apps/frontend/src/lib/api/utils/auth/**` | F19 matcher repairs |
| `providers/idura.ts` | `:74`, `:101-102` | **Transient injection target only.** Never committed modified. |

### Pattern 1: The two-run control — unit lane (F19)

Reuse Phase 139's HYGIENE-LOOP verbatim; it is the repo's proven procedure
`[CITED: .planning/phases/139-.../139-VERDICTS.md § 3.1]`:

```bash
# 1. PRE-GATE — scoped, never the bare form (3 tracked files are dirty in this worktree)
git status --porcelain -- apps tests packages          # MUST print nothing

# 2. INJECT — the recorded diff, with an `INJECTED (140)` marker where a comment is legal

# 3. RUN — from inside the workspace dir, log OUTSIDE the repo
mkdir -p "${TMPDIR:-/tmp}/gsd-140"
cd "$(git rev-parse --show-toplevel)/apps/frontend" \
  && npx vitest run src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts \
     2>&1 | tee "${TMPDIR:-/tmp}/gsd-140/f19a-after.log"

# 4. REVERT
git checkout -- apps/frontend/src/lib/api/utils/auth/providers/idura.ts

# 5. POST-GATE — all three must hold before the next site
git status --porcelain -- apps/frontend/src/lib/api/utils/auth/providers/idura.ts   # (a) empty
git status --porcelain -- apps tests packages                                       # (b) empty
! grep -rn 'INJECTED (140)' apps packages tests                                     # (c)
```

**The two columns.** Phase 139's TWO-COLUMN RULE applies unchanged: record the **assertion outcome**
(did the specific expression pass?) separately from the **file outcome** (did the file exit green?),
plus the failing `file:line`. For F19 the *point* of the repair is that the failing line moves from
`:147`/`:151`/`:170` (a `TypeError` on `.split`) up to the assertion line itself — so "the file went
red both times" is not evidence. **The failing line number is the evidence.**

**Ordering for the before/after pair:** run the injection against the **unrepaired** file first
(observe: assertion PASS, failure at the `split` line), revert, apply the repair, re-inject, re-run
(observe: assertion FAIL at the assertion line, message naming the parameter), revert. Two runs per
site, three sites, six runs.

**Hard constraint (C-5):** no `yarn dev`, `yarn test:e2e`, or any Playwright command may run while an
`idura.ts` injection is live — these injections strip live OIDC authentication material and a
concurrent E2E run would go red for a manufactured reason.

### Pattern 2: The two-run control — E2E lane (F3, F9, F10)

The E2E equivalent cannot use `npx vitest`; it must go through the preflight-confirmed wrapper:

```bash
# BEFORE half — pre-change assertion, mutated scenario ⇒ expect PASS (blindness)
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/140-f9-before --project=perm-hide-category-tags

# apply the repair, re-run the same mutated scenario ⇒ expect FAIL (the catch)
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/140-f9-after  --project=perm-hide-category-tags
```

Each run directory carries the preflight verdict, the dev-server log, and the JSON reporter output.
`e2e-run.sh` exits **6** when it finds no preflight success line — so "the run was preflight-confirmed"
is a positive machine-checked fact, not an operator claim `[VERIFIED: tests/scripts/e2e-run.sh header, exit-code table]`.

**Scoping a run to one project still pulls in its dependency chain** (`tests/README.md` § Run), so a
`--project=perm-hide-category-tags` run executes the full perm prefix chain ahead of it. Budget for it.

### Pattern 3: Leaving no mutation scaffolding behind

Three admissible mechanisms, in descending preference:

1. **Scratch working-copy mutation, reverted in the same task** (Phase 139's HYGIENE-LOOP). Nothing
   reaches a commit; the evidence is the captured log plus the `git diff` taken while the injection was
   live. Use for every F19 and F9 injection and for the F3 helper mutation.
2. **A checked-in guard self-test with named positive + negative controls** — the
   `eslint-store-guard.test.ts` shape. Admissible only where the control can be exercised without
   mutating product code (i.e. the F10 counted guard, whose "one more `expect.soft`" case can be
   simulated against a fixture string rather than by editing the real spec).
3. **A temporary spec file, deleted in the same task.** Least preferred — it must be added to a
   Playwright project to run at all, and the orphan-probe guard at `playwright.config.ts:33-47` will
   throw on any unmatched file under `specs/_probes`.

**Never** leave a `test.skip`, a retry annotation, an env-gated "control mode", or a commented-out
injection in the tree. Phase 138 discharged the project's only cardinal-rule waiver; there is no
successor.

### Anti-Patterns to Avoid

- **Editing 27 files by hand for F3.** Ruled out by criterion 1's own wording. If the helper cannot
  cover a site (e.g. `base.teardown.ts` also calls `unregisterCandidate`, `bank-auth-journey.teardown.ts`
  does three extra things), the helper still owns the *assertion*; the extra steps stay in the file.
- **Choosing the F3 matcher before the measurement.** See the three mechanisms above.
- **Reading the process exit code as the assertion outcome.** Phase 139 wrote the TWO-COLUMN RULE
  precisely because that mistake would have withdrawn all three F19 findings.
- **Accepting a positive control on its green half.** A `> 0` assertion that has never been observed
  red is indistinguishable from a locator that happens to match something else.
- **Fixing F10 by writing "136" into the comment.** It was "137" four days ago and "3" before that.
- **Widening a spec's dataset for F9 without re-running its own walk.** `perm-hide-category-tags` going
  from 1 to 2 elections inserts an election-selector page into its navigation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Proving an E2E run drove this checkout | A port check, a curl, a "did the server answer" loop | `tests/scripts/e2e-run.sh` (which invokes `tests/global-setup.ts` → `assertServedApp`) | Phase 137 built and negative-controlled exactly this. A wildcard shadow-bind defeats every naive check; the `/@fs` response-content assertion is the one that catches it. |
| Starting a dev server + DB for an evidence run | `yarn db:reset` + `yarn dev` by hand in two terminals | `e2e-run.sh` | It refuses to adopt a foreign listener, owns its process group, kills from a trap, and records provenance (HEAD, cleanliness, timestamps). Hand-driving reintroduces the stale-server class the operator memory already flags. |
| Repeating a run N times for determinism | A bash `for` loop around `yarn test:e2e` | `tests/scripts/determinism-batch.sh` | It enforces the validity rules per run rather than counting green exits. |
| A transient source injection + revert discipline | Ad-hoc edit + "remember to revert" | Phase 139's HYGIENE-LOOP (§ 3.1) | The scoped `git status` pre/post gates and the marker grep are what make "no scaffolding left behind" checkable rather than promised. |
| Counting rows deleted by a teardown | A new SQL function or RPC | `runTeardown`'s existing `{ rowsDeleted }` + `client.query('<table>').like('external_id', prefix + '%')` for the before/after probe | `bulk_delete` already returns per-collection `deleted` counts (`packages/dev-seed/src/supabaseAdminClient.ts:216-228`); the tests' client already exposes a PostgREST builder at `supabaseAdminClient.ts:194`. |
| A "keep this list in sync" comment for the F10 budget | A comment | A config-load throw, per `playwright.config.ts:29-31`'s own stated principle | The file the guard would live in already argues this case in prose. |

**Key insight:** every apparatus this phase needs was built by Phases 136–139 and is negative-controlled
already. The phase's engineering risk is concentrated almost entirely in **one decision** — the F3
matcher — and that decision is a measurement away from being safe.

## Runtime State Inventory

This phase changes seeded data (F9 template edits) and the deletion assertions that clean it up (F3), so
the inventory is non-trivial.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | Supabase rows under `e2e-perm-hide-cattags-` and `e2e-perm-hide-eltags-` are re-generated from the templates on every setup. Changing `perm-hide-category-tags` to `elections: 2` and adding a `showCategoryTags: true` overlay to `perm-hide-election-tags` changes the row set and the `app_settings` singleton those setups write. | **Code edit only, no data migration.** Each setup calls `runTeardown(teardownPrefix)` before seeding (`setupFromTemplate.ts:196`), so the next run rebuilds from scratch. Operators with a warm local DB should run `yarn db:reset` once after pulling. |
| **Live service config** | `app_settings` is a **singleton row** mutated by every perm setup via `merge_jsonb_column`, and `setupFromTemplate.ts:256-260` REPLACEs it and asserts exact equality post-seed. A `settingsOverlay` change on either perm template changes what that assertion expects. | Verify the post-seed `app_settings` assertion still passes for both modified templates — it is an exact-equality check, so an overlay change that is not mirrored in the expectation fails the **setup**, not the spec. |
| **OS-registered state** | None. No task scheduler, launchd, pm2, or systemd registration references anything this phase touches. Verified by absence of any such registration in the repo's scripts. | None. |
| **Secrets / env vars** | `FRONTEND_PORT` (preflight alternate-port hatch), `PLAYWRIGHT_BANK_AUTH`, `SUPABASE_SERVICE_ROLE_KEY`, `E2E_REQUIRE_FRESH_DB`. None is renamed or read differently by this phase. The F19 injections touch OIDC material **in source only**, never in `.env`. | None. Do not commit an injected `idura.ts`. |
| **Build artifacts / installed packages** | `packages/dev-seed` is built by turbo and consumed by `tests/` via `@openvaa/dev-seed`. Template edits require a rebuild before the E2E suite picks them up. | `yarn build` (or let `yarn dev`'s watcher handle it) after any `packages/dev-seed/src/templates/**` edit, **before** running the perm projects. A stale build silently seeds the old template and produces a false green on the F9 positive control. |

## Common Pitfalls

### Pitfall 1: `toBeGreaterThan(0)` reddens the perm teardown family

**What goes wrong:** the obvious F3 repair is committed, the next full-suite run reds ~26 teardown
projects, and the cardinal rule is violated in one commit.
**Why it happens:** every perm setup pre-clears the whole `e2e-perm-` family
(`setupFromTemplate.ts:184-192`), and `teardown:` defers each teardown until every transitive dependent
of its setup completes — so by teardown time the rows are already gone. `rowsDeleted === 0` is correct.
**How to avoid:** measure `{ prefix, before, rowsDeleted, after }` at all 27 sites in one instrumented
full-suite run **before** choosing the matcher; prefer the before/after invariant (shape A).
**Warning signs:** a repair whose only justification is "the audit suggested it"; a teardown assertion
that passes in a single-project smoke and fails in the full suite.

### Pitfall 2: `e2e-perm-notloc-` is owned by two teardowns

**What goes wrong:** on a `PLAYWRIGHT_BANK_AUTH=1` run, whichever of
`bank-auth-journey.teardown.ts` / `perm-not-located-2e2cg.teardown.ts` executes second deletes 0 rows —
deterministically, not flakily.
**Why it happens:** both files declare `const PREFIX = 'e2e-perm-notloc-';` because the bank-auth setup
deliberately reuses the `perm-not-located-2e2cg` template (`bank-auth-journey.setup.ts:9-15`).
**How to avoid:** the shape-A invariant handles it naturally (`before === 0` ⇒ pass). Any positivity
floor must special-case these two, which is itself an argument against the floor.
**Warning signs:** an F3 repair validated only on the default suite, where bank-auth never runs.

### Pitfall 3: The `expect.soft` count is not 137

**What goes wrong:** the guard, the header, or the phase record is pinned to 137 and is wrong on day one.
**Why it happens:** the number was measured on 2026-08-11 and the file changed. Four documents repeat it.
**How to avoid:** re-count at implementation time (`grep -o 'expect\.soft(' <file> | wc -l`), pin the
guard to the measured value, and record the correction in the phase record so ROADMAP criterion 4 and
`REQUIREMENTS.md:59` are reconciled rather than silently contradicted.
**Warning signs:** any artifact in this phase containing the literal `137`.

### Pitfall 4: The `ElectionTag` render gate is a count, not a flag

**What goes wrong:** a positive control asserting `electionTag > 0` is added to a 1-election dataset and
is red for a reason unrelated to the tag component.
**Why it happens:** `electionTags.ts:13` — `if (elections.length < 2) return [];`. `showElectionTags: true`
is necessary but not sufficient.
**How to avoid:** any dataset hosting an election-tag positive control needs `elections: 2` **and** both
selected by the walk (`advanceVoterFlow` accepts the default all-selected state).
**Warning signs:** a positive control added to `perm-hide-category-tags` without bumping its `elections`.

### Pitfall 5: A stale `dev-seed` build silently seeds the old template

**What goes wrong:** F9's template edits are made, the perm project is run, the positive control is
green — against the *old* dataset, proving nothing.
**Why it happens:** `tests/` consumes `@openvaa/dev-seed` as a built workspace package
(CLAUDE.md § Module Resolution: "NPM/Node requires built `.js` files").
**How to avoid:** `yarn build` after every `packages/dev-seed/src/**` edit and before the E2E run;
`e2e-run.sh` does **not** build for you.
**Warning signs:** a positive control that is green but whose negative-control injection does not turn it red.

### Pitfall 6: Reading the file exit code as the assertion outcome (F19)

**What goes wrong:** the repair is declared done because "the file went red under the injection" — but
it went red at `:147` before the repair too.
**Why it happens:** vitest reports per-file and per-test outcomes, not per-assertion outcomes.
**How to avoid:** record the failing `file:line` for every run and require it to *move* to the assertion
line. Phase 139's TWO-COLUMN RULE exists for exactly this.
**Warning signs:** an F19 evidence table with a single outcome column.

### Pitfall 7: Running Playwright while an `idura.ts` injection is live

**What goes wrong:** the E2E suite goes red for a manufactured reason, and under C-1 that is a cardinal
failure that costs a debugging cycle to attribute.
**Why it happens:** the F19 injections break real OIDC request construction in `apps/frontend/src/`.
**How to avoid:** serialize the lanes. Do the F19 unit work in a wave with no E2E task in it.
**Warning signs:** a plan wave that contains both an `idura.ts` injection task and an `e2e-run.sh` task.

### Pitfall 8: `expect(null).toMatch(...)` message legibility

**What goes wrong:** the matcher is upgraded to `toMatch` and the failure reads as a type complaint
about the received value rather than "the parameter is missing".
**Why it happens:** `toMatch` on a non-string produces a generic received-value error.
**How to avoid:** use vitest's second-argument message form, which this repo already uses in all 27
teardown assertions: `expect(requestParam, "authorize URL is missing the 'request' parameter").toMatch(…)`.
**Warning signs:** an F19 evidence log whose failure text does not contain the parameter name.

## Code Examples

### F19 repair (all three sites, same shape)

```ts
// apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:143-148
// Source: repair pre-specified by 139-VERDICTS.md § 5.7.6 (`.not.toBeNull()`, "stronger still" toMatch)
const url = new URL(authorizeUrl);
const requestParam = url.searchParams.get('request');
expect(requestParam, "authorize URL is missing the 'request' (JAR) parameter").toMatch(
  /^[\w-]+\.[\w-]+\.[\w-]+$/
);
// `toHaveLength(3)` on the split segments is now subsumed — remove or keep as a redundant check.
```

```ts
// apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:165-167
// NOTE the dropped `!` at :166 — keeping it re-asserts at the type level exactly what
// the new matcher exists to check at runtime (139-VERDICTS.md § 5.9.6).
expect(capturedFetchBody).not.toBeNull();
const assertion = capturedFetchBody!.get('client_assertion');
expect(assertion, "token request body is missing 'client_assertion'").toMatch(
  /^[\w-]+\.[\w-]+\.[\w-]+$/
);
```

### F19 injections (transient — revert in the same task)

```diff
  apps/frontend/src/lib/api/utils/auth/providers/idura.ts:74   # sites 1 AND 2
-      `&request=${requestObject}`;
+      ``; // INJECTED (140): the JAR request object is dropped from the authorize URL
```

```diff
  apps/frontend/src/lib/api/utils/auth/providers/idura.ts:101-102   # site 3
-        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
-        client_assertion: clientAssertion
+        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' // INJECTED (140): the client_assertion entry is deleted entirely
```

### F3 shared helper (shape — final matcher pending the measurement)

```ts
// tests/tests/setup/shared/assertTeardown.ts  (NEW)
// The single owner of the F3 assertion. All 27 teardown files call this and carry
// no matcher of their own, so the 27th file is covered by construction.
import { expect } from '@playwright/test';
import { runTeardown } from '@openvaa/dev-seed';
import type { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

export async function runTeardownAsserted(prefix: string, client: SupabaseAdminClient): Promise<void> {
  const before = await countRowsByPrefix(client, prefix);   // see § Don't Hand-Roll for the probe
  const { rowsDeleted } = await runTeardown(prefix, client);
  const after = await countRowsByPrefix(client, prefix);

  // The delete accounted for everything that was there …
  expect(
    rowsDeleted,
    `teardown('${prefix}') deleted ${rowsDeleted} rows but ${before} matched the prefix — ` +
      `prefix mismatch, or bulk_delete silently no-opped`
  ).toBe(before);

  // … and nothing under the prefix survives it.
  expect(after, `teardown('${prefix}') left ${after} rows behind`).toBe(0);
}
```

Call site after the change:

```ts
// tests/tests/setup/perm/perm-hide-category-tags.teardown.ts
teardown('delete perm-hide-category-tags dataset', async () => {
  await runTeardownAsserted(PREFIX, new SupabaseAdminClient());
});
```

### F9 positive control (design A)

```ts
// packages/dev-seed/src/templates/e2e/perm/perm-hide-category-tags.ts
export const permHideCategoryTagsTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 1,
  opinionQuestions: 1,
  infoQuestions: 0,
  elections: 2,                      // NEW — the ElectionTag render gate needs >= 2 (electionTags.ts:13)
  settingsOverlay: {
    questions: { showCategoryTags: false }
    // elections.showElectionTags stays TRUE from MINIMAL_BASE_APP_SETTINGS (shared.ts:110)
  }
});
```

```ts
// tests/tests/specs/perm/perm-hide-category-tags.spec.ts
await navigateToFirstQuestion(page);
// Negative: the setting under test suppresses the category tag.
await expect(page.getByTestId(testIds.shared.categoryTag)).toHaveCount(0);
// POSITIVE CONTROL (ASSERT-05): the heading's tag-rendering path is alive. If CategoryTag /
// ElectionTag stop rendering anywhere, the absence assertion above becomes vacuously true —
// this line is what turns that into a failure.
await expect(page.getByTestId(testIds.shared.electionTag)).not.toHaveCount(0);
```

Mirror on `perm-hide-election-tags`: add `questions: { showCategoryTags: true }` to its
`settingsOverlay` and assert `categoryTag` is `.not.toHaveCount(0)`.

### F9 injection (transient)

```diff
  apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte:80-89
-    {#if appSettings.elections.showElectionTags}
-      {#each getElectionsToShow({ question, elections }) as election}
-        <ElectionTag {election} {onShadedBg} />
-      {/each}
-    {/if}
-    {#if appSettings.questions.showCategoryTags}
-      <CategoryTag … />
-    {:else if blockWithStats}
+    {#if blockWithStats}
       …
```

### F10 counted guard (config-load, sibling to the orphan-probe guard)

```ts
// tests/playwright.config.ts — beside the ORPHAN-PROBE GUARD block at :18-47
// Source: the same argument this file already makes at :29-31 — "A comment asking future
// authors to keep the list in sync would be the same kind of non-guard this phase exists
// to remove, so the invariant is CHECKED."
const SOFT_ASSERTION_BUDGETS: Record<string, number> = {
  'specs/voter/voter-journey.spec.ts': 136 // RE-MEASURE at implementation time. Was 137 on 2026-08-11.
};
for (const [rel, budget] of Object.entries(SOFT_ASSERTION_BUDGETS)) {
  const file = path.join(TESTS_DIR, rel);
  const count = (fs.readFileSync(file, 'utf8').match(/expect\.soft\(/g) ?? []).length;
  if (count !== budget) {
    throw new Error(
      `${rel} declares an expect.soft budget of ${budget} but contains ${count}. ` +
        `Soft assertions do not fail fast, so a growing budget silently degrades failure ` +
        `legibility in a serial walk. Convert the new assertion to a hard expect(), or raise ` +
        `the budget here AND in the file's header with the reason (fake-guard sweep 2026-08-11, F10).`
    );
  }
}
```

Note the guard asserts **equality**, not a ceiling — so it also fires when someone *removes* a soft
assertion without updating the declared posture, keeping the header honest in both directions.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| "The listener on the port is a `node` process" as the E2E integrity check | Response-content assertion via Vite `/@fs`, enforced from `globalSetup`, no bypass | Phase 137 (2026-08-13) | Every evidence run in this phase is preflight-gated automatically; the operator cannot forget it |
| Ad-hoc `for` loops around `yarn test:e2e` for determinism | `tests/scripts/e2e-run.sh` (one owned run + evidence dir) and `determinism-batch.sh` | Phase 138 (2026-08-14) | Evidence is machine-readable and the preflight verdict is a positive captured fact (exit 6 otherwise) |
| A "keep in sync" comment as the guard for an enumerated list | Config-load `throw` that names the offending file | Phase 136 (`playwright.config.ts:18-47`) | Direct precedent + rationale for the F10 counted guard |
| Findings asserted from an audit document | Findings re-read against the live tree with an executed injection per site (HYGIENE-LOOP / TWO-COLUMN / COLLATERAL rules) | Phase 139 (2026-08-14) | F19's repair, injection and expected failure line are pre-specified; Phase 140 executes rather than re-derives |
| A cardinal-rule waiver covering `EPERM-07` | Waiver discharged unrenewed | Phase 138 | No exemption exists for a red suite in this phase |

**Deprecated / outdated:**

- **"137 `expect.soft` in `voter-journey.spec.ts`"** — measured 2026-08-11; the count is **136** as of
  2026-08-15. Present in the ROADMAP criterion 4, `REQUIREMENTS.md:59`, and the audit's F10 section.
- **"27 `*.teardown.ts` files"** as a file count — there are **28** teardown files; 27 carry the
  assertion. `candidate-journey.teardown.ts` never calls `runTeardown`.
- **The audit's `toBeGreaterThan(0)` suggestion for F3** — superseded by the teardown-ordering and
  duplicate-prefix mechanisms documented above.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| **A1** | Playwright's `teardown:` semantics — "runs after this project and all its transitive dependents complete" — combined with the serial perm chain means most perm teardowns execute after downstream setups have wiped `e2e-perm-*`, so `rowsDeleted === 0` is expected. Quoted from `tests/README.md`, **not** measured. | F3 hazard | **High.** If wrong, shape C (`toBeGreaterThan(0)`) becomes viable and the phase is much smaller. This is exactly why Plan 01's measurement is non-negotiable — it settles A1 empirically either way. |
| **A2** | `bulk_delete` reports per-collection `deleted` counts that sum to the number of rows removed under the prefix, so a `before`-count probe and `rowsDeleted` are directly comparable. | F3 shape A | Medium. If the RPC's counting differs (e.g. cascades counted once), `toBe(before)` is too strict and must become `after === 0` plus a looser accounting assertion. Settled by the same measurement. |
| **A3** | `eslint-plugin-playwright`'s `no-restricted-matchers` accepts `soft` as a restrictable **modifier**. The rule's description says "matchers & modifiers" but the accepted key set was not verified. | F10 alternatives | Low — it is listed as an *alternative*, not the recommendation. A 5-minute check settles it. |
| **A4** | Bumping `perm-hide-category-tags` from 1 to 2 elections does not otherwise perturb its walk, because `advanceVoterFlow` handles the election selector generically and accepts the all-selected default. | F9 design A | Medium. Mitigation: run the project once immediately after the template edit, before adding the assertion. |
| **A5** | `getElectionsToShow`'s `question.appliesTo({ elections: [e] })` filter returns true for `buildMinimal`-generated questions (they carry no election scoping), so both election tags render. | F9 design A | Medium. If a generated question is election-scoped, only one tag renders — the `> 0` assertion still holds. Low practical risk. |
| **A6** | The `app_settings` exact-equality post-seed assertion in `setupFromTemplate.ts:256-260` will accept the two F9 overlay changes once the templates declare them, without a separate expectation edit. | Runtime State Inventory | Medium. The assertion compares against the template's own declared settings, so a template-side overlay should be self-consistent — but this was not executed. Surfaces immediately as a **setup** failure, not a silent pass. |
| **A7** | No OS-registered state, scheduler entry, or external service config references anything this phase renames or changes. Asserted from the absence of such registrations in the repo, not from an exhaustive host scan. | Runtime State Inventory | Low. This phase renames nothing user-visible. |

## Open Questions (RESOLVED)

These are the four design calls the ROADMAP left open (no CONTEXT.md exists). Each carries a
recommendation; the planner should convert each into an explicit decision or a `checkpoint:` task.

### 1. (a) F10 — correct the number, or add a counted guard?

- **What we know:** the stated budget is `3-slot budget honored` at `voter-journey.spec.ts:14`; the real
  count is **136**, not the 137 asserted in three planning documents. Three sibling files declare "0
  expect.soft" / "NO expect.soft" while carrying 3, 6 and 4 respectively. The repo has a proven
  config-load guard precedent at `playwright.config.ts:33-47`.
- **What's unclear:** whether the operator wants the guard scoped to `voter-journey.spec.ts` (ASSERT-06's
  literal scope) or repo-wide (which would also close the three sibling drifts, out of scope for
  ASSERT-06 but free at the margin).
- **Recommendation:** do **both** halves — restate the header with the real posture and a named budget
  constant, *and* add the equality-checked config-load guard. Scope the guard's table to
  `voter-journey.spec.ts` for ASSERT-06 compliance, and file the three sibling files as a recorded
  follow-up rather than absorbing them silently. Criterion 4's observable ("add one more `expect.soft`,
  observe the failure, then accept the guard") is then executable.

### 2. (b) F3 — sample width and the shared helper

- **What we know:** there is **no** shared helper today; 27 files each carry an identical inline
  `expect`. `runTeardown` (in `packages/dev-seed`) is shared, but it is a library function and should
  not carry a caller's assertion policy. All 27 call sites are structurally identical apart from
  `base.teardown.ts` (also calls `unregisterCandidate`) and `bank-auth-journey.teardown.ts` (also does
  three extra cleanup steps) — both of which can still delegate the *assertion*.
- **What's unclear:** the correct matcher, pending the measurement; and whether any site legitimately
  needs to opt out.
- **Recommendation:** create `tests/tests/setup/shared/assertTeardown.ts` exporting one function; codemod
  all 27 call sites to it; **zero** sites bypass it. The two-run control then mutates the helper once and
  is observed at a sample of sites (recommend 3: one perm mid-chain, `base.teardown.ts`, and
  `bank-auth-journey.teardown.ts` — the three structurally distinct shapes), with the remaining 24
  covered by construction. Precede all of it with the instrumented measurement run.

### 3. (c) F9 — the positive-control mechanism

- **What we know:** the render gate is a count, not just a flag (`electionTags.ts:13`); the perm shared
  baseline already has `showElectionTags: true` and `showCategoryTags: false`; `e2e/base` has both true
  with 2 elections; the walk accepts the all-selected election default.
- **What's unclear:** whether the operator reads criterion 3's "the pair go red" literally (design A) or
  as "the suite goes red" (design B).
- **Recommendation:** design **A** — complementary-tag control inside each existing perm spec, backed by
  two template edits. It is the only design under which the criterion's sentence is literally true, it
  costs four small edits, and it makes each spec independently non-vacuous. Optionally add design B's
  two lines to `voter-journey` as cheap redundancy on the base dataset.

### 4. (d) F19 — assertion form and site inventory

- **What we know:** three sites, all re-read and line-exact: `authorize-endpoint.test.ts:144`,
  `providers/idura.test.ts:148`, `token-endpoint.test.ts:167`. Phase 139 ran and recorded the injections
  and the expected failure lines. Site 3 is blind on a second layer (the `!` at `:166`).
- **What's unclear:** whether to take the minimal `.not.toBeNull()` or the stronger
  `toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/)`.
- **Recommendation:** take the **stronger form with vitest's message argument**. `.not.toBeNull()` alone
  is blind to the empty string and to the literal `"undefined"` that Phase 139 measured under its
  injection A. The message argument is what makes the failure *name the parameter* — criterion 2's actual
  requirement — rather than merely fail at the right line. Drop the `!` at `token-endpoint.test.ts:166`
  in the same edit. There are four other `toBeDefined()` calls in these two files (`authorize-endpoint:124,
  179, 180`; `token-endpoint:233, 239`) — these are on **object properties**, not on `.get()` returns, so
  they are correct and **out of scope**; the planner should say so explicitly so a reviewer does not read
  them as missed sites.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node / Yarn 4 workspaces | everything | ✓ | repo-pinned | — |
| `@playwright/test` | E2E lanes (F3, F9, F10) | ✓ | 1.58.2 | — |
| Playwright browsers | E2E lanes | assumed installed (`yarn playwright install`) | — | `yarn playwright install` |
| `vitest` | F19 lane | ✓ | 3.2.4 | — |
| Docker + Supabase CLI | `e2e-run.sh` step 3 (`yarn db:reset`) | required by `e2e-run.sh` header | — | none — E2E evidence is impossible without it |
| A free port 5173 (or `FRONTEND_PORT`) | preflight + dev server | operator-dependent | — | `FRONTEND_PORT=<n>` in root `.env` or as a command prefix |
| `lsof` | preflight failure diagnostics only | best-effort | — | Section omitted from the failure block; not an error |

**Missing dependencies with no fallback:** none identified — this phase adds nothing to the environment.
**Missing dependencies with fallback:** port 5173 → `FRONTEND_PORT`.

**Not required:** `mcr.microsoft.com/playwright:v1.58.2-noble` (that is Phase 146's visual-gate
constraint; nothing in Phase 140 captures screenshots) and `PLAYWRIGHT_BANK_AUTH` (opt-in; needed only
if the planner chooses to exercise the duplicate-`e2e-perm-notloc-` path deliberately).

## Validation Architecture

Nyquist validation is **enabled** (`.planning/config.json` has no `workflow.nyquist_validation` key ⇒
treated as enabled).

### Test Framework

| Property | Value |
|----------|-------|
| Unit framework | vitest 3.2.4 |
| Unit config | per-workspace; `apps/frontend/vite.config.ts` for the F19 files |
| E2E framework | `@playwright/test` 1.58.2 |
| E2E config | `tests/playwright.config.ts` (globalSetup `./global-setup.ts`) |
| Quick unit run | `cd apps/frontend && npx vitest run src/lib/api/utils/auth/__tests__/<file>` |
| Quick E2E run | `tests/scripts/e2e-run.sh --run-dir <dir> --project=<name>` |
| Full unit suite | `yarn test:unit` |
| Full E2E suite | `tests/scripts/e2e-run.sh --run-dir <dir>` (no `--project`) — **not** bare `yarn test:e2e`, because only the wrapper captures the preflight verdict |
| Lint / typecheck | `yarn lint:check` (includes `yarn typecheck:tests`) |

### Phase Requirements → Test Map

Because this phase is *about* making assertions capable of failing, every row below names **the
observable that proves failure is now possible**, not merely a command that exits 0.

| Req ID | Behavior | The observable that proves it can fail | Test type | Automated command | Exists? |
|--------|----------|----------------------------------------|-----------|-------------------|---------|
| ASSERT-02 (F3) | A teardown whose delete matches nothing fails **by name** | Under a mutated helper (prefix forced to a non-matching value with rows present), the run fails and the message contains the prefix and both counts. **Same mutation against the pre-change `toBeGreaterThanOrEqual(0)` passes.** | E2E teardown project | `tests/scripts/e2e-run.sh --run-dir <d> --project=data-teardown-perm-<name>` ×2 (before/after) | ❌ Wave 0 — helper does not exist |
| ASSERT-02 (F3) | The 27th file is covered by construction | `grep -c "runTeardownAsserted" tests/tests/setup/**/*.teardown.ts` = 27 **and** `grep -rn "toBeGreaterThanOrEqual(0)" tests/tests/setup/` = 0 | static | one grep pair | ❌ Wave 0 |
| ASSERT-02 (F3) | The matcher is chosen against data | A committed `{prefix, before, rowsDeleted, after}` table for all 27 sites from one instrumented full-suite run | measurement | `e2e-run.sh --run-dir <d>` with the instrumented helper | ❌ Wave 0 |
| ASSERT-03 (F19) | A missing `request` param fails **at the assertion line** | Under the `idura.ts:74` injection: **before** — failure at `authorize-endpoint.test.ts:147` (`TypeError … 'split'`); **after** — failure at `:144`, message contains `request` | unit | `cd apps/frontend && npx vitest run src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` ×2 | ✅ file exists; assertion changes |
| ASSERT-03 (F19) | Same at site 2 | Same injection; **before** failure at `idura.test.ts:151`, **after** at `:148` | unit | `… npx vitest run src/lib/api/utils/auth/providers/idura.test.ts` ×2 | ✅ |
| ASSERT-03 (F19) | Same at site 3 | Under the `idura.ts:101-102` deletion: **before** failure at `token-endpoint.test.ts:170`, **after** at `:167`, message contains `client_assertion` | unit | `… npx vitest run src/lib/api/utils/auth/__tests__/token-endpoint.test.ts` ×2 | ✅ |
| ASSERT-05 (F9) | A tag that never renders fails the pair | Under the `QuestionHeading.svelte:80-89` deletion: **before** — both perm projects green; **after** — the corresponding project(s) red on the `.not.toHaveCount(0)` line | E2E | `e2e-run.sh --run-dir <d> --project=perm-hide-category-tags` and `--project=perm-hide-election-tags`, ×2 each | ❌ Wave 0 — positive assertions do not exist |
| ASSERT-05 (F9) | The control is seeded data | The two templates declare the precondition (`elections: 2`; `showCategoryTags: true`) and `dev-seed` is rebuilt before the run | static + build | `grep` the two template files; `yarn build` | ❌ Wave 0 |
| ASSERT-06 (F10) | The stated budget is true **or** enforced | Add one `expect.soft(true).toBe(true)` to `voter-journey.spec.ts` ⇒ **any** Playwright invocation (including `--list`) throws naming the file and both numbers. Remove it ⇒ passes. Both observed **before** the guard is accepted. | config-load guard | `cd tests && npx playwright test --list` ×2 (with / without the extra soft assertion) | ❌ Wave 0 |
| Criterion 5 | Suites green after the edits, preflight satisfied | `e2e-run.sh` exits 0 **and** its evidence dir records ≥1 preflight success line and 0 failure lines; `yarn test:unit` exits 0; `yarn lint:check` exits 0 | full suite | `tests/scripts/e2e-run.sh --run-dir <d>` + `yarn test:unit` + `yarn lint:check` | ✅ infrastructure exists |

### Sampling Rate

| Point | What runs | Why this rate |
|---|---|---|
| **Per task commit (unit lane, F19)** | `npx vitest run <the one file>` from inside `apps/frontend` | Sub-second; the HYGIENE-LOOP post-gate (`git status --porcelain -- apps tests packages` empty + no `INJECTED (140)` marker) runs with it |
| **Per task commit (E2E lane)** | `e2e-run.sh --project=<the one project>` | A single perm project still pulls its dependency chain; this is the smallest trustworthy E2E unit |
| **Per two-run control** | Exactly **two** runs of the same command, before/after, both recorded with the failing `file:line` and both outcome columns | One run cannot distinguish "the guard caught it" from "something else was already red" |
| **Per wave merge** | `yarn test:unit` + `yarn lint:check` (includes `typecheck:tests`) | Catches cross-workspace breakage from the `dev-seed` template edits and the new `tests/` helper |
| **Phase gate** | One full `e2e-run.sh` with no `--project`, green, preflight-confirmed; plus `yarn test:unit` and `yarn lint:check` green | Criterion 5. Under C-1 this must be **all** green — zero failed, zero did-not-run |
| **F3 specifically — additional gate** | One full-suite run **after** the helper lands, compared against the pre-change instrumented measurement table | The F3 change is the one edit capable of reddening ~26 projects; a single-project smoke cannot see the ordering hazard |

### Wave 0 Gaps

- [ ] `tests/tests/setup/shared/assertTeardown.ts` — the shared F3 assertion helper (does not exist)
- [ ] A row-count-by-prefix probe usable from `tests/` (build on `client.query('<table>').like('external_id', prefix + '%')`; `listCandidateIdsByPrefix` covers candidates only)
- [ ] Instrumented measurement pass producing the `{prefix, before, rowsDeleted, after}` table for all 27 sites — **must precede** the matcher choice
- [ ] Positive assertions in the two perm specs + the two template preconditions (F9)
- [ ] The F10 counted guard block in `tests/playwright.config.ts` + the rewritten header
- [ ] A phase evidence document (`140-NEGATIVE-CONTROL.md`, following `137-NEGATIVE-CONTROL.md` / `138-NEGATIVE-CONTROL.md`) recording all two-run pairs with both outcome columns and the failing `file:line`

*No new test framework or config is needed — vitest and Playwright are both already wired.*

## Security Domain

`security_enforcement` is not set to `false` in `.planning/config.json`, so this section is required.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | **yes** (test-side only) | The F19 sites test OIDC JAR construction and `private_key_jwt` client authentication. The repair *strengthens* the assertions guarding that material; the injections transiently *remove* it. Control: HYGIENE-LOOP revert + scoped `git status` post-gate, and a hard prohibition on running `yarn dev` / Playwright while an injection is live. |
| V3 Session Management | no | Nothing in this phase touches session or cookie handling. |
| V4 Access Control | no | RLS, roles and route guards are untouched. |
| V5 Input Validation | **partial** | Not product input validation — but the F19 repair is literally a validation-strength change (`toBeDefined()` → a shape-checked `toMatch`), which is the same principle applied to test inputs. |
| V6 Cryptography | **yes (read-only)** | The three F19 tests exercise RS256 JAR signing and JWT structure. Nothing is hand-rolled; `jose` does the work and the tests only assert. No key material is generated, stored, or committed by this phase — `authorize-endpoint.test.ts:73-83` generates an ephemeral in-test keypair, unchanged. |
| V14 Configuration | **yes** | The F10 guard and the F3 helper change harness configuration. Control: both are additive, both fail loudly, neither introduces a bypass env var. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| A committed injection leaves OIDC auth material stripped in `providers/idura.ts` | Spoofing / Elevation | HYGIENE-LOOP POST-GATE: three checks (per-path, scoped-tree, `INJECTED (140)` marker grep) before the next task starts. Phase 139 precedent. |
| A running dev server serves the injected build to a real browser | Information disclosure | Serialize the lanes: no E2E/dev task in the same wave as an `idura.ts` injection (Pitfall 7). |
| A weakened teardown assertion leaves test rows in a shared database | Tampering (test-data contamination) | This phase *strengthens* the teardown assertion. The residue half of shape A (`after === 0`) is the direct control. |
| A test secret or key committed by an evidence artifact | Information disclosure | Evidence logs are written to `${TMPDIR}/gsd-140/` (outside the repo) for the unit lane; `e2e-run.sh` writes into `tests/e2e-runs/<dir>` — the planner must confirm that path is gitignored or the artifacts are excluded before committing. |
| The preflight is bypassed and evidence comes from a foreign server | Spoofing | Phase 137's `assertServedApp` from `globalSetup`; `e2e-run.sh` exit 6 when no success line is found. No bypass exists. |

**One concrete action for the planner:** confirm `tests/e2e-runs/` is gitignored (or that the evidence
directories are placed outside the repo) before the first `e2e-run.sh` invocation, so run artifacts —
which include a dev-server log — do not become an untracked-file hygiene problem or a commit.

## Sources

### Primary (HIGH confidence) — live tree, read this session

- `tests/tests/setup/perm/perm-hide-category-tags.teardown.ts` (and the full 27-site grep) — the F3 assertion
- `packages/dev-seed/src/cli/teardown.ts:104-155` — `runTeardown` + `countDeletedRows`
- `tests/tests/setup/shared/setupFromTemplate.ts:97-200, 256-260` — the `extraTeardownPrefix` pre-clear
- `tests/playwright.config.ts:1-60, 994-1055` — orphan-probe guard; the two perm tag projects; the chain
- `tests/tests/specs/perm/perm-hide-{category,election}-tags.spec.ts` — the two absence assertions
- `packages/dev-seed/src/templates/e2e/perm/{shared.ts, perm-hide-category-tags.ts, perm-hide-election-tags.ts}`, `templates/e2e/base.ts` — the settings matrix
- `apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte:78-101` and `src/lib/utils/questions/electionTags.ts` — the render gate
- `tests/tests/specs/voter/voter-journey.spec.ts:1-21` + the `expect.soft` count — F10
- `apps/frontend/src/lib/api/utils/auth/__tests__/{authorize,token}-endpoint.test.ts`, `providers/idura.test.ts` — the three F19 sites
- `tests/global-setup.ts`, `tests/scripts/e2e-run.sh` header — the Phase-137 gate and the evidence wrapper
- `tests/README.md` § Run / § Concurrency model / § Setup & teardown specs
- `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` — the positive/negative control precedent
- `package.json:24-33` — the script surface

*Reading method note: files were read via `cat -n` / `sed -n` in Bash (per this session's operating
mode) rather than the `Read` tool. Every quoted block above is a verbatim paste of that output, and
every line number cited is the line number that output printed.*

### Secondary (MEDIUM confidence) — planning record, cross-checked against the tree

- `.planning/phases/139-.../139-VERDICTS.md` §§ 3.1-3.4 (HYGIENE-LOOP, TWO-COLUMN, COLLATERAL), 5.7-5.9 (F19a/b/c) — verdicts, injections, pre-specified repairs. Cross-checked: all three cited line numbers are still exact.
- `.planning/audits/2026-08-11-fake-guard-sweep.md` §§ F3, F9, F10 — the original findings. **Two of its numbers are now stale** (see § State of the Art).
- `.planning/ROADMAP.md` Phase 140 + the v2.15 standing acceptance rule
- `.planning/REQUIREMENTS.md:54-61, 143-151, 168-173`
- `.planning/phases/137-.../137-VERIFICATION.md` — open risk T-137-11 (CI-runner half of criterion 3 unobserved; does **not** affect local evidence runs)

### Tertiary (LOW confidence)

- `eslint-plugin-playwright` rule inventory (obtained by introspecting the installed module) — used only to note `no-restricted-matchers` as an unrecommended alternative for F10. Whether `soft` is an accepted key was **not** verified (A3).

## Metadata

**Confidence breakdown:**

- Site inventory + mechanisms: **HIGH** — every site re-read from the live tree this session with verbatim quotes and line numbers.
- F19 repair + control: **HIGH** — Phase 139 executed the injections and recorded the outcomes; this phase re-applies a pre-specified diff.
- F10: **HIGH** on the count (136) and the guard precedent; **MEDIUM** on the scope decision (repo-wide vs one file), which is an operator call.
- F9 design: **MEDIUM-HIGH** — the render gate, settings matrix and walk behaviour are all verified; A4/A5 (walk perturbation, question scoping) need one confirming run.
- F3 matcher: **MEDIUM** — the hazard mechanisms are read from source with high confidence, but the *expected* per-site `rowsDeleted` values are inferred from Playwright's documented `teardown:` semantics rather than measured (A1). The recommended shape A is chosen to be correct under **either** answer, which is why it is the recommendation.

**Research date:** 2026-08-15
**Valid until:** 2026-09-14 (30 days — the tree is stable and no external dependency is in play). Two
values are already known to drift and must be re-measured at implementation time: the `expect.soft`
count and the per-site `rowsDeleted` table.
