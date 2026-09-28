# Phase 142 — deferred items (found during execution, deliberately NOT fixed)

Phase 142 is an assertion-design phase whose plans forbid durable product changes. Where a
strengthened assertion exposed a **product** defect, it is recorded here and left in place.
The authoritative record for each entry is the matching row in `142-NEGATIVE-CONTROL-LEDGER.md`
(§ Deferred product findings).

## P-1 — `data.arguments` is nested one level deeper than its declared type

- **Found by:** plan `142-02`, Task 1 (F15-C), green clean-tree probe, 2026-08-20.
- **Site:** `packages/argument-condensation/src/core/condensation/condenser.ts:205`
  (+ `src/core/types/condensation/condensationResult.ts:32`).
- **Finding:** `CondensationRunResult.data.arguments` is declared `Array<Argument>` but is
  `Array<Array<Argument>>` at runtime for any plan whose final step is a **single-batch MAP** — the
  shape `handleQuestion` builds for the `condenseQuestions.test.ts` fixtures. The structure
  bookkeeping reports `'list'` (`planValidation.ts:149`, `batchCount > 1 ? 'listOfLists' : 'list'`)
  while the payload is still physically nested, and `condenser.ts:205`'s `as Array<Argument>` cast
  hides the discrepancy from the type checker. A consumer writing
  `result.data.arguments.map((a) => a.text)` receives `[undefined]`.
  `condenserStandalone.test.ts` is unaffected — its plan ends in a REDUCE, which collapses the nesting.
- **Why not fixed here:** collapsing the list-of-lists changes `Condenser.run()`'s observable output
  for every consumer — a Rule-4-class product change — and `142-02`'s success criteria state that no
  product source is durably modified. The test documents the nesting inline and uses `flat()`, so it
  asserts real content either way and will keep passing once the product is fixed.
- **Suggested owner:** a follow-up `argument-condensation` phase, not Phase 142.

## D-01-i / D-01-ii / D-01-iii — D-01's three named scope exclusions (D-19 iii)

- **Found by:** plan `142-01`, Task 2 (the `autonomous: false` checkpoint), 2026-08-20/21.
- **Status:** **deliberate scope boundaries, not oversights.** The operator approved D-01's minimal
  change (`approve`) *with these three explicitly named and deferred rather than absorbed*.
- **D-01-i — the question's `info` text never reaches the prompt.** Measured against the real
  pipeline: `prompt contains the question info text: false`. Site:
  `packages/question-info/src/core/infoGeneration.ts:75-82` plus the three `en/` prompt YAMLs.
  Outside D-01's named scope of type-plus-choice-labels.
- **D-01-ii — no locale variants of the type label.** `questionType` reaches the prompt as its raw
  discriminant string (e.g. `singleChoiceCategorical`), not as human-readable or localised text.
  Not fixable today: `packages/question-info/src/prompts/` has only an `en/` directory, so a
  localised type label needs a locale-aware prompt tree first.
- **D-01-iii — the ordinal scale distinction is not closed by the type string alone.** A 5-point and
  a 7-point ordinal are both `'singleChoiceOrdinal'`. Substantially mitigated rather than open: the
  new `choices` variable supplies the discriminating information for ordinal questions (five labels
  vs seven). The residual is that the scale *semantics* remain implicit.
- **Suggested owner:** a follow-up `question-info` phase. `142-06` captures all three via
  `/gsd-capture` per D-19 iii.

## P-2 — the two OIDC providers duplicate `getIdTokenClaims`, uncoded (from `142-04`)

- **Found by:** plan `142-04`, Task 3, while checking `getIdTokenClaims`'s consumers, 2026-08-21.
- **Site:** `apps/frontend/src/lib/api/utils/auth/providers/idura.ts:114-122` and
  `apps/frontend/src/lib/api/utils/auth/providers/signicat.ts:77-85`.
- **Finding:** both providers carry their **own duplicated copy** of `getIdTokenClaims`'s logic —
  the same `JSON.parse` of `IDENTITY_PROVIDER_DECRYPTION_JWKS` and the same uncoded
  `throw new Error("Cannot decode ID token: JWK not found: kid=...")`. A-07's two-code split
  (`ERR_JWKS_EMPTY` / `ERR_JWK_KID_MISMATCH`) was applied to the shared helper only, so the two
  provider implementations still collapse the misconfiguration and key-rotation cases into one
  indistinguishable failure.
- **Why this one matters most:** the production `/api/oidc/token` route calls
  `provider.getIdTokenClaims(idToken)` — the **provider** method, not the helper that was fixed.
- **Why not fixed here:** outside the surface approved at `142-04`'s checkpoint, which named
  `getIdTokenClaims.ts` specifically. No test asserts codes on the provider path, so strengthening
  there needs a fresh negative-control pair rather than a carry-over of this one.
- **Suggested owner:** a follow-up auth phase — ideally one that de-duplicates the three copies
  rather than tripling the split.

## P-3 — `apps/frontend/tsconfig.tsbuildinfo` is a tracked generated artifact (from `142-04`)

- **Found by:** plan `142-04`, Task 3, post-`tsc` post-gate, 2026-08-21.
- **Finding:** running `npx tsc --noEmit` rewrites the tracked file `apps/frontend/tsconfig.tsbuildinfo`,
  dirtying the working tree and tripping the phase's own `git status --porcelain` post-gate. Restored
  with `git checkout HEAD --` twice during this plan.
- **Why not fixed here:** repo-hygiene change unrelated to any assertion in this phase; removing it from
  the index affects every contributor's tree.
- **Suggested owner:** a repo-hygiene pass.

## B-1 — BLOCKED: `SUPABASE_ANON_KEY` could not be added to `.env` / `.env.example` (from `142-04`)

- **Found by:** plan `142-04`, Task 3, 2026-08-21. **This is a blocked operator instruction, not a
  deferral by choice.**
- **Instruction:** add `SUPABASE_ANON_KEY` to the local `.env` (value = `PUBLIC_SUPABASE_ANON_KEY`'s)
  and add the key to `.env.example` with a placeholder plus a one-line comment naming what needs it,
  so the bank-auth specs stop being un-runnable-by-default.
- **Blocker:** every access path to `.env` and `.env.example` is refused by this environment's
  permission settings — the `Read` tool returns "File is in a directory that is denied by your
  permission settings", and Bash `grep` / `awk` / `ls` on either path are denied. **No circumvention
  was attempted** (e.g. reading the tracked copy via `git show`), since the deny plainly exists to
  protect env files.
- **Confirmed safe to attempt, so the block is on access and not on judgement:**
  `git check-ignore -v .env` returns `.gitignore:3:.env`, so no key value was ever at risk of being
  committed; only `.env.example` would have been.
- **Consequence for `142-06`:** the A-05 bank-auth run MUST export `SUPABASE_ANON_KEY` inline
  (`candidate-bank-auth.spec.ts:48-50` throws at module load without it).
- **Needs:** the operator to apply it by hand, or to grant access.

## P-2 (half 2) — the provider tests that let the duplication drift, a NEW finding of the sweep's own class (from `142-06`)

- **Found by:** plan `142-06`, while verifying P-2's scope before recording it. Independently
  measured, not inherited from `142-04`'s report — `142-04` recorded the duplicated *implementations*
  but not the tests that were supposed to pin them.
- **Site:** `apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts:90-91` and
  `providers/signicat.test.ts:54-55`.
- **Finding:** both read `expect(typeof provider.getIdTokenClaims).toBe('function')` under a title
  claiming the method is *implemented*. That is a **wiring-only assertion of exactly the class
  ASSERT-07 remediates** — it asserts a property of the object graph, never an output. It was **never
  part of the twelve-finding corpus** (the 2026-08-11 sweep did not enumerate these two files), and it
  is almost certainly *why* the duplicated provider copies drifted from the shared helper without
  anything going red. The same shape covers `getAuthorizeUrl` and `exchangeCodeForToken` on both
  providers.
- **Why not fixed here:** `142-06` runs the gates and propagates the record; it modifies no product or
  test source. Strengthening these is a **fresh negative-control pair** (nothing in 139's record to
  cite, so both halves must be measured), not a carry-over.
- **Recorded in three places:** here, `.planning/WINDOWS.md` (id 48), and
  `.planning/todos/pending/provider-getidtokenclaims-duplication.md`, which carries both halves of P-2.
- **What this means for A-07, stated plainly:** the **phase criterion is met** — D-11 E6 asks that
  F20-3's two *tests* differ observably, and they now do, against the helper they exercise — **but the
  production path is untouched.** `/api/oidc/token/+server.ts:26` calls `provider.getIdTokenClaims`,
  i.e. `providers/idura.ts:114` / `providers/signicat.ts:77`, **not** the helper A-07 split. The
  operational benefit of the two-code split does not yet reach `/api/oidc/token`. **The highest-value
  follow-up of the phase.**
