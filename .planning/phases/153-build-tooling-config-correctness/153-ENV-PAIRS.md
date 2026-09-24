# Cross-runtime environment pairs — the register, the two guards, and what neither can see

**Phase 153, plan 10 (operator-requested).** Carries no `REVIEW-CFG-*` id; it contributes an
artefact row to the phase ledger rather than a criterion row.

---

## 1. The four pairs

Four environment variables exist **twice**, once for the Deno Edge Function runtime and once for
the SvelteKit frontend:

| Pair | Deno Edge Function reads | Frontend reads | Why two spellings |
|---|---|---|---|
| `SUPABASE_URL` | `SUPABASE_URL` | `PUBLIC_SUPABASE_URL` | injected by the Edge runtime / embedded in the client bundle |
| `SUPABASE_ANON_KEY` | `SUPABASE_ANON_KEY` | `PUBLIC_SUPABASE_ANON_KEY` | injected by the Edge runtime / embedded in the client bundle |
| `IDENTITY_PROVIDER_CLIENT_ID` | `IDENTITY_PROVIDER_CLIENT_ID` | `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` | function secret env / embedded in the client bundle |
| `IDENTITY_PROVIDER_TYPE` | `IDENTITY_PROVIDER_TYPE` | `PUBLIC_IDENTITY_PROVIDER_TYPE` | function secret env / embedded in the client bundle |

Three further identity variables — `IDENTITY_PROVIDER_ISSUER`, `IDENTITY_PROVIDER_JWKS_URI` and
`IDENTITY_PROVIDER_DECRYPTION_JWKS` — are **single-source**: the same spelling is read by both
runtimes. They are not pairs, they derive no pair, and they need nothing.

**This is not a hypothetical class.** The frontend and Deno copies of the identity-provider
configuration have drifted apart **twice**, both times undetected — caught once by a code review
and once by a plan that happened to re-measure. Phase 155's verifier recorded the missing drift
guard as the residual risk that survived that phase.

### The pairs are DERIVED, not listed

Neither script contains a list of the four names. A pair is any `NAME` such that:

- `apps/supabase/supabase/functions/**/*.ts` contains `Deno.env.get('NAME')` **in code**, and
- `apps/frontend/src/**/*.{ts,js,svelte}` contains the identifier `PUBLIC_NAME` **in code**.

A hand-kept list would rot in exactly the way the two configurations it guards already drifted
twice, and the fifth pair would be discovered the way the first four were.

**Measured derivation, on the tree at plan close:**

```
source scanned: 17 Deno file(s) under apps/supabase/supabase/functions,
                1342 frontend file(s) under apps/frontend/src;
env reads found in code: 24 Deno, 118 PUBLIC_;
pairs derived: 4 (IDENTITY_PROVIDER_CLIENT_ID, IDENTITY_PROVIDER_TYPE,
                  SUPABASE_ANON_KEY, SUPABASE_URL);
.env.example assignments: 33. 0 violation(s).
```

`24` Deno reads in code against `28` raw occurrences: the four excluded are precisely the phase-155
docblocks that quote `Deno.env.get('X') || fallback` in prose to explain the shape that phase
abolished. Comment exclusion (via the shared `scripts/lib/comment-spans.mjs` classifier) is
load-bearing in both directions, and both directions were flip-tested — see §5.

---

## 2. Why the pairs are NOT unified

Recorded so a later reader does not "simplify" this away.

- **`SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected automatically by the Supabase Edge
  runtime.** Deployed functions receive them without configuration. Switching the Deno side to read
  `PUBLIC_SUPABASE_URL` would mean configuring, in every environment, something the platform
  already provides — a downgrade, not a simplification.
- **`PUBLIC_` is a bundling contract, not a naming convention.** In SvelteKit/Vite it means *this
  value is embedded in client JavaScript*. It is the one signal that tells a reviewer whether a
  value is browser-safe. Reusing it in a server-only Deno runtime, where it means nothing, erodes
  that signal and invites a later author to prefix a secret because "that is what we do for shared
  vars".
- Unifying the other way — the frontend reading the un-prefixed names — is not possible: Vite will
  not expose an unprefixed variable to the browser bundle, so the client breaks.

If unification is ever revisited it is a **decision for the operator with a threat model**, not a
refactor — the same standing phase 155 gave to collapsing the Deno/frontend identity copies.

---

## 3. The two scripts answer different questions

**A build-time check cannot compare values.** CI has no secrets, and nothing guarantees both
members are set at build time. So this plan ships two scripts, and neither is presented as the
other. Each says which it is in its own docblock, first paragraph.

| | `scripts/assert-env-pair-registry.mjs` | `scripts/assert-env-pairs-agree.mjs` |
|---|---|---|
| Proves | the pairing **contract** | the **values** |
| Reads | source + `.env.example` | one env file named on the command line |
| Needs secrets | no | yes — both members must be set |
| Runs in `lint:check` | **yes** (link 11 of 11) | **never** |
| Catches | "someone added `PUBLIC_FOO` and a `Deno.env.get('FOO')` and told nobody" | actual value drift between the two spellings |
| Blind to | every value; it cannot see drift at all | anything absent from the file it was handed |

Invocation:

```bash
node scripts/assert-env-pair-registry.mjs          # or: yarn assert:env-pair-registry
node scripts/assert-env-pairs-agree.mjs .env       # or: yarn check:env-pairs-agree .env
```

The checker's script key is deliberately `check:env-pairs-agree` and **not** `assert:*`: every
existing `assert:*` key is a `lint:check` chain link, and a ninth one that was not would read as an
omission somebody would later "fix" by appending it.

**Shipping only the registry guard while calling it a drift guard would be the exact failure this
milestone kept finding: a gate that examines nothing and reports green.** That is why both exist,
and why the census lines below are part of the deliverable rather than decoration.

---

## 4. What NEITHER script can see — the residual gap, named

This section is the point of the document. Both guards are honest only if their blind spots are
written down rather than implied.

1. **THE BIG ONE — cross-*host* drift is not covered.** The agreement checker compares values that
   are present **in one env file**. In deployment there is no such file: the Deno functions read
   their values from the deployed Supabase project's function-secrets environment, and the frontend
   reads its values from wherever the frontend host (Render, a container, a CI secret store) was
   configured. **Those two stores are configured separately, by different means, and nothing in
   this repository compares them.** The drift class that actually bit twice is precisely
   "somebody updated one side" — and the checker closes it only if it is run *inside a deploy
   pipeline that can see both sides*, which no pipeline in this repository currently does. Until
   then, this remains open, and it should be read as the reason to run the checker in deployment
   rather than as a reason to consider the class closed.
2. **The registry guard cannot see a value, therefore cannot see drift.** Its green means "every
   twin is documented", never "the twins agree". A tree can be fully registered and completely
   misconfigured.
3. **The agreement checker cannot see an absent member as drift**, deliberately. Absent is reported
   as *unconfigured*, naming which member is missing. The operator's own root env file recently
   lacked four variables phase 155 made required; reporting that as "drift" would send someone
   hunting for a mismatch that does not exist. The cost is that a pair which *should* be set on
   both sides and is set on neither passes as a skip. (A run in which **no** pair was comparable
   exits 1 for exactly this reason — see §5.)
4. **Neither script sees consumers outside the two scan roots.** There are at least two more, both
   in node-land, both reading `SUPABASE_URL` from `process.env`, and neither derives a pair:

   - `tests/tests/utils/supabaseAdminClient.ts:55` — the Playwright harness, which defaults to a
     **different host spelling** (`localhost`) from the one the template documents, and then
     derives a frontend origin from it by port substitution. Filed as
     `.planning/todos/pending/2026-08-29-153-supabase-url-host-spelling-drift.md`.
   - `packages/dev-seed/src/cli/seed.ts:43-44` — which **already implements this pair's contract at
     runtime**: `if (!process.env.SUPABASE_URL && process.env.PUBLIC_SUPABASE_URL) process.env.SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;`,
     under a comment at line 36 stating "URL is identical between the two namespaces". That is an
     independent, pre-existing assertion of exactly the contract this register now makes checkable
     — corroboration rather than a gap, and worth knowing about before anyone "simplifies" it.

   Widening the scan roots to cover these would widen the pair set beyond the cross-runtime class
   this register is about, so they stay out and are named here instead.
5. **Neither script validates a value's *shape*.** Two members can agree on a value that is wrong
   for both. Value-shape validation is `requireEnv`'s job at function start-up (phase 155,
   REVIEW-EDGE-02), not this register's.
6. **`.env.example` is a template, not a configuration.** The registry guard proves the template
   documents every pair. It says nothing about any real `.env`, which it never reads.

---

## 5. The proofs, and how to reproduce them

A gate that examines nothing also reports green, so each half of each guard was flip-tested and
both halves recorded. The verbatim captures live in `153-10-SUMMARY.md`; the reproductions are:

| Property | How to reproduce |
|---|---|
| Registry guard CATCHES | append `Deno.env.get("FOO")` to an Edge Function and `env.PUBLIC_FOO` to `apps/frontend/src/lib/utils/constants.ts`, with no `.env.example` entry → exit 1 naming `FOO`, `pairs derived` 4 → 5. Revert → exit 0. |
| Comment exclusion is load-bearing | make the same injection **inside comments only** → `pairs derived` stays 4, reads stay 24/118, exit 0. |
| Chain membership is asserted | delete `&& yarn assert:env-pair-registry` from `lint:check` → `packages/dev-seed/tests/assertEnvPairRegistryGate.test.ts` fails. Restore → passes. |
| Checker never discloses | point it at an env file whose disagreeing members hold two distinguishable synthetic secrets → exit 1 naming both variables, **zero** occurrences of either secret across stdout and stderr. |
| Checker distinguishes absent from disagreeing | an env file with one member unset and one set-but-empty → both reported `SKIP … unconfigured`, naming which member, exit 0. |
| A run that compared nothing FAILS | an env file with only one member of one pair → `compared: 0`, exit **1**. |

The census line of each script is what makes a zero readable. This is not theoretical: the first
version of the registry guard captured the wrong regex group and printed
`pairs derived: 0 … 0 violation(s)`, exit 0, over a tree with four live pairs. A bare zero would
have read as success. The census is why it read as a bug.

---

## 6. `.env.example` — the co-located block

All eight members now sit in **one contiguous block at the top of `.env.example`**, each pair's two
members adjacent, under a header that states the same-value contract and names both scan roots.
The registry guard asserts all four of those properties (assigned, assigned exactly once,
contiguous and adjacent, header states the contract) — the block cannot silently disperse again.

The only variable **added** to the template was `SUPABASE_URL`, whose value is identical to its
twin's; no pre-existing key or value changed, verified by diffing the sorted `key=value` sets
against `HEAD`.
