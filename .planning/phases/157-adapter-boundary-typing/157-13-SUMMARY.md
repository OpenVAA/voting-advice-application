---
phase: 157-adapter-boundary-typing
plan: 13
subsystem: frontend-auth
tags: [oidc, identity-providers, claim-mapping, docs, todo-triage]
status: complete
requires:
  - apps/frontend/src/lib/api/utils/auth/providers/types.ts (the AuthConfig type, unmoved)
provides:
  - per-provider claim-mapping configs colocated with their own provider
  - .planning/todos/pending/2026-08-28-reintroduce-the-local-data-adapter.md
affects:
  - apps/frontend/src/lib/api/utils/auth/providers/
  - apps/frontend/src/lib/api/README.md
tech-stack:
  added: []
  patterns:
    - "provider modules own their own configuration; no shared per-provider config module"
    - "env defaults applied once, at the constants layer, never re-applied downstream"
key-files:
  created:
    - .planning/todos/pending/2026-08-28-reintroduce-the-local-data-adapter.md
  modified:
    - apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
    - apps/frontend/src/lib/api/utils/auth/providers/idura.ts
    - apps/frontend/src/lib/api/utils/auth/providers/index.ts
    - apps/frontend/src/lib/api/utils/auth/providers/types.ts
    - apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts
    - apps/frontend/src/lib/api/README.md
    - .planning/todos/pending/2026-08-28-claude-md-stale-factual-claims.md
  deleted:
    - apps/frontend/src/lib/api/utils/auth/providers/authConfig.ts
decisions:
  - "Split shape: the two constants were INLINED into signicat.ts and idura.ts rather than split into sibling signicat.config.ts / idura.config.ts. The plan allowed either. Inlining was chosen because each config is consumed only by its own provider (five reads each, all in getIdTokenClaims plus the interface field), so a sibling module would add a file and an import edge to carry a constant with exactly one consumer."
  - "Removing the second provider default changes behaviour only for PUBLIC_IDENTITY_PROVIDER_TYPE='' — that case now throws instead of silently selecting Signicat."
metrics:
  duration: ~13 min
  completed: 2026-08-30
actuals:
  tokens: 9319
  tasks: 3
  commits: 3
---

# Phase 157 Plan 13: authConfig split, redundant default, orphan triage — Summary

Each OIDC provider now declares its own claim-mapping config in its own module, the doubly-applied `'signicat'` default in `getActiveProvider` is gone, and both orphan triage comments are dispositioned — one fixed, one filed.

## What Was Built

**Task 1 — the split (commit `4c17e9210`).** `SIGNICAT_AUTH_CONFIG` moved into `signicat.ts` and `IDURA_AUTH_CONFIG` into `idura.ts`, each with its full JSDoc, and `providers/authConfig.ts` was deleted. Both constants remain exported, preserving their importability; `AuthConfig` the TYPE did not move and is still re-exported from `providers/index.ts`.

The measured premise held: there were zero cross-provider imports before the split, so the "interdependence" the reviewer named was file-level colocation only. After the split, `grep -c SIGNICAT_AUTH_CONFIG idura.ts` and `grep -c IDURA_AUTH_CONFIG signicat.ts` both return 0 — neither provider pulls the other's config into its module graph.

**The production-defect warning survived verbatim.** Its three mechanism clauses are present at the Signicat config's new home and were grepped individually: the Edge Function twin (`identity-callback/claimConfig.ts`), the `app_metadata.identity_match_value` lookup key and placeholder-email local part, and the birthdate account collision. Note for the record: Phase 152's criterion-2 sweep had ALREADY landed on this comment — the text in the tree reads "Keyed on `sub`, and it MUST NOT be keyed on `birthdate`…", not the "Keyed on `sub` since Phase 142.1…" form quoted in 157-RESEARCH.md § E.4. Per the plan's instruction to "move it as 152 leaves it", the post-152 form was moved unchanged. No rewriting was done by this plan.

**Task 2 — the redundant default (commit `55c9c07e9`).** `|| 'signicat'` removed from `getActiveProvider`. The `default:` throw branch is unchanged. `apps/frontend/src/lib/utils/constants.ts` was not touched.

**Task 3 — README and todo (commit `c2e3dad17`).** The `lib/api/README.md` line now states that `adapters/` holds only `apiRoute/` and `supabase/`, that there is no client-side local adapter, and that the surviving local adapter is server-side under `$lib/server/api/adapters/local/`, selected by `staticSettings.dataAdapter.type === 'local'`. The D-N2 todo was filed, anchored to the file rather than the stale line 12. The identical claim as it appears at `CLAUDE.md:191` was appended as a third numbered claim to the existing `2026-08-28-claude-md-stale-factual-claims.md` (whose title and "Two claims" opener were updated to "three"); `CLAUDE.md` itself was not edited.

## The Exact Behaviour Delta from Removing the Default

`constants.PUBLIC_IDENTITY_PROVIDER_TYPE` is defined as `env.PUBLIC_IDENTITY_PROVIDER_TYPE ?? 'signicat'`. `??` passes the empty string through; `||` catches it. So the removed `|| 'signicat'` could fire in exactly one case: the env var explicitly set to `""`.

- **Unset env var:** no change. The constants layer still yields `'signicat'`.
- **`PUBLIC_IDENTITY_PROVIDER_TYPE='signicat'` or `'idura'`:** no change.
- **`PUBLIC_IDENTITY_PROVIDER_TYPE=''`:** previously selected Signicat silently. Now falls through to the existing `default:` branch and throws ``Unknown identity provider type: . Expected 'signicat' or 'idura'.``

That is the whole delta. A deployment that had an empty `PUBLIC_IDENTITY_PROVIDER_TYPE` and was relying on the silent fallback will now fail loudly at provider selection — which is the intended outcome for a misconfiguration, and is what makes this a real fix rather than a cosmetic one. `.env.example` sets the variable, so no in-repo configuration hits the changed branch.

Two JSDoc paragraphs in `providers/index.ts` claimed the module defaults to `'signicat'` "when the env var is unset or empty". Both were corrected in the same commit — leaving them would have left the file documenting behaviour it no longer has.

## Phase 155 Wording Coordination

Phase 155's criterion 2 removes `??` and `||` environment defaults in the Edge Functions — a different tree with the same class of defect. **157 closed exactly one site**, `providers/index.ts`, and neither phase closes the class repository-wide.

`apps/frontend/src/lib/utils/constants.ts` was deliberately left alone. It carries eleven similar defaults and is a separate, larger question; touching it here would have collided with Phase 155's reasoning. Anyone reading either phase's summary should not conclude that env-default doubling is eliminated in the frontend — it is not, and `constants.ts` is where the rest of it lives. The lint gate that exists today (the "Edge-function environment-default guard", phase 155) scans 17 Deno files under `apps/supabase/supabase/functions` only; it does not see `apps/frontend/src` at all, so nothing prevents a new frontend env default from being added.

## In Scope, Not Criterion-Mandated

Both Task 3 items are **in scope for this plan but not mandated by a numbered phase criterion**. Recording this explicitly so a verifier does not mark the phase incomplete for the reverse reason:

| Item | Status |
|------|--------|
| `lib/api/README.md` local-adapter correction | Decision E(i); in scope, not criterion-mandated |
| `2026-08-28-reintroduce-the-local-data-adapter.md` filed | Decision D-N2; in scope, not criterion-mandated |

The criterion-mandated work in this plan is criterion 5's second half (REVIEW-ADP-05), which Task 1 and Task 2 close.

## Deviations from Plan

**1. [Rule 1 - Bug] `providers/types.ts` comment repointed (not in `files_modified`)**

- **Found during:** Task 1
- **Issue:** `types.ts:30` documented `AuthConfig.identityMatchProp` with "Keying Signicat on `'birthdate'` does exactly that -- see `authConfig.ts` for the full account of what it costs." Deleting `authConfig.ts` would have left that pointer dangling, pointing readers of the type's most safety-critical field at a file that no longer exists. `157-RESEARCH.md` § E.4 enumerated every consumer of the constants but classified `types.ts` as "neither — declares the interface field", so this comment reference was not in the plan's inventory.
- **Fix:** Repointed to "see `SIGNICAT_AUTH_CONFIG` in `signicat.ts`". Comment-only, one line.
- **Why not deferred:** The dangling reference is caused directly by this task's deletion, and the pointer it carries is to the birthdate-collision record — the exact thing the plan's must-haves protect.
- **Prohibition check:** The prohibition is on MOVING the `AuthConfig` type out of `types.ts`. The type did not move; `grep -c 'AuthConfig' types.ts` returns 6.
- **Commit:** `4c17e9210`

**2. [Rule 1 - Bug] Cross-provider symbol name removed from an `idura.ts` comment**

- **Found during:** Task 1 verification
- **Issue:** The Idura config JSDoc I first wrote pointed at Signicat's config by name ("see `signicat.ts`'s `SIGNICAT_AUTH_CONFIG`"), which made `grep -c 'SIGNICAT_AUTH_CONFIG' idura.ts` return 1 and failed the task's own acceptance criterion. The criterion is right and my comment was wrong: a per-provider split whose comments still name the other provider's symbol is a weaker split.
- **Fix:** Repointed to `AuthConfig.identityMatchProp` in `types.ts`, which itself carries the pointer onward to the Signicat config. Same information, one hop, zero cross-provider symbol references.
- **Commit:** `4c17e9210` (caught before commit)

**3. [Scope note] `providers/index.ts` JSDoc updated alongside the code change**

The plan's Task 2 named only the `|| 'signicat'` removal. Two JSDoc paragraphs in the same file asserted the now-removed behaviour ("Defaults to `'signicat'` … unset or empty"). Both were corrected in the same commit. Same file, already in `files_modified`; leaving stale documentation of a behaviour change would have been the defect this phase exists to fix.

No architectural (Rule 4) decisions arose. No packages were installed. No checkpoints or auth gates were hit.

## Verification Results

All commands run from the worktree root. Real output:

| Command | Result |
|---------|--------|
| `yarn workspace @openvaa/frontend test:unit` (after Task 1) | **53 files passed, 807 passed (807)** — matches the stated 807 baseline exactly |
| `yarn workspace @openvaa/frontend test:unit` (after Task 2) | **53 files passed, 807 passed (807)** |
| `yarn workspace @openvaa/frontend typecheck` | `COMPLETED 2093 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `yarn lint:check` (after Task 1, and again after Task 3) | **exit 0** both times; all seven guards report 0 violations, including the comment-hygiene guard (1563 files scanned) |
| `npx prettier --check` on all edited files | "All matched files use Prettier code style!" |

`signicat.test.ts` (16 tests) and `idura.test.ts` (16 tests) both pass **unchanged** — confirmed by `git status`, which never listed either test file as modified. That is the backstop for the must-have "both OIDC providers still resolve their own claim config".

Plan-level verification checks:

| Check | Result |
|-------|--------|
| `ls .../providers/authConfig.ts` exits non-zero | Yes — "No such file or directory" |
| `grep -c 'SIGNICAT_AUTH_CONFIG' idura.ts` | `0` |
| `grep -c 'IDURA_AUTH_CONFIG' signicat.ts` | `0` |
| Warning mechanism sentences at the new home | `identity-callback/claimConfig.ts` → 1, `identity_match_value` → 1, "collapses every candidate sharing a date of birth into a single Supabase auth account" → 1 |
| `grep -c 'authConfig.ts' decryptAndVerifyIdToken.ts` | `0`; its diff is comment-only (verified by reading the diff — one JSDoc line) |
| `grep -c 'AuthConfig' providers/types.ts` | `6` |
| `grep -c "\|\| 'signicat'" providers/index.ts` | `0` |
| `grep -c 'local adapter available for static data' lib/api/README.md` | `0` |
| `git diff --name-only` lists `constants.ts` | **No** |
| `git diff --name-only` lists `CLAUDE.md` | **No** |
| D-N2 todo exists with valid frontmatter | Yes — `created`, `title`, `area`, `priority`, `files`, `source`, `related_phase` |
| Todo `files:` names `dataProvider.ts` without a line number | Yes |
| Todo `## Problem` records the H.3(i) server-side-adapter finding | Yes, with the `staticSettings.dataAdapter.type` switch quoted |

Deletions across the plan: exactly one, `providers/authConfig.ts` — intentional. No untracked files were produced; `.planning/state.json` was already untracked before this plan started and was not touched.

Notes on the environment: the database was not needed and was not touched, `yarn db:types` was not run, `yarn db:lint:sql` was not run (pre-existing exit 1 since phase 151), and the pgTAP suite was not run. The spurious `TS7006` first-build failure warned about in the brief did not occur — no full `yarn build` was needed for this plan; `lint:check` builds the packages it depends on and did so cleanly.

## Known Stubs

None. This plan produced no stubbed values, no skipped tests, and no unrun `<verify>` blocks.

## Threat Flags

None. The plan's register was satisfied rather than extended:

- **T-157-31** (Signicat config drifting from its Edge Function twin): mitigated — the warning moved intact and was grepped clause by clause.
- **T-157-32** (the split becoming an excuse to reorganise JWE/JWS handling): mitigated — `decryptAndVerifyIdToken.ts`'s diff is one JSDoc line and no key handling changed.
- **T-157-33** (a misconfigured provider silently falling back): mitigated — the empty-string case now throws with a message naming the expected values.
- **T-157-SC** (package installs): no packages installed.

No new network endpoints, auth paths, file-access patterns or schema changes were introduced.

## Self-Check: PASSED

Created files verified present on disk:

- `FOUND: .planning/todos/pending/2026-08-28-reintroduce-the-local-data-adapter.md`

Deleted file verified absent:

- `ABSENT (as intended): apps/frontend/src/lib/api/utils/auth/providers/authConfig.ts`

Commits verified in `git log`:

- `FOUND: 4c17e9210` — refactor(157-13): split authConfig.ts so each provider owns its claim mapping
- `FOUND: 55c9c07e9` — refactor(157-13): remove the doubly-applied provider default in getActiveProvider
- `FOUND: c2e3dad17` — docs(157-13): correct the api README local-adapter claim and file the D-N2 todo
