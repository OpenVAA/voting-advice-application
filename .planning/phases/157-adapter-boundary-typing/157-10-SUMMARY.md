---
phase: 157-adapter-boundary-typing
plan: 10
subsystem: auth
tags: [supabase, gotrue, i18n, paraglide, a11y, svelte5, dataWriter, security-copy]

requires:
  - phase: 157-09
    provides: the three-item Supabase `current_password` spike and the operator's recorded BRANCH DECISION (§ 6 of 157-AUTH-SHIM-DISPOSITION.md, commit 259f26b79)
provides:
  - "`setPassword` chain with no `currentPassword` parameter at any of its four links"
  - "`error.changePassword` copy that makes only claims the system enforces, in seven locales, in BOTH catalog trees"
  - "`candidate-a11y.spec.ts` `cand-settings` anchor re-pointed to `settings.newPassword`"
  - "the measured fact that `apps/frontend/messages/` (not `src/lib/i18n/translations/`) is the runtime catalog `t()` renders"
affects: [157-11 authToken sweep, 157-17 logging codemod, 157-18 phase E2E gate, 152 comment sweep]

actuals:
  tokens: 8756
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Type-level RED gate: for a signature-deletion refactor the failing check is `svelte-check`, not vitest — write the call sites in the new shape first, prove 2 typecheck errors, then implement."

key-files:
  created: []
  modified:
    - "apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte"
    - "apps/frontend/src/lib/contexts/auth/authContext.svelte.ts"
    - "apps/frontend/src/lib/contexts/auth/authContext.type.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts"
    - "apps/frontend/src/lib/api/base/dataWriter.type.ts"
    - "apps/frontend/src/lib/api/base/universalDataWriter.ts"
    - "apps/frontend/messages/{en,da,et,fi,fr,lb,sv}/candidateApp.settings.json"
    - "apps/frontend/src/lib/i18n/translations/{en,da,et,fi,fr,lb,sv}/candidateApp.settings.json"
    - "apps/frontend/src/lib/types/generated/translationKey.ts"
    - "tests/tests/utils/testIds.ts"
    - "tests/tests/specs/a11y/candidate-a11y.spec.ts"

key-decisions:
  - "Executed branch (a) — delete the field — per the operator verdict recorded 2026-08-30 in § 6 of 157-AUTH-SHIM-DISPOSITION.md. Not re-opened."
  - "Rewrote the copy in FOURTEEN catalog files, not the seven the plan named: `apps/frontend/messages/` is the Paraglide runtime catalog that `t()` actually renders. Editing only the type-source tree would have left the false claim on users' screens."
  - "Retained `authToken` across the `setPassword` chain. Removing it here would collide with 157-11's sweep on the same signature — the plan states this collision risk itself, and the disposition table assigns `_setPassword`'s `authToken` to 157-11 class 1."
  - "Re-anchored the a11y `cand-settings` case rather than deleting it, and left an in-file note recording where the anchor came from and why the replacement holds the same property."

patterns-established:
  - "Two-tree i18n edits: a catalog key change must land in both `apps/frontend/messages/<locale>/` (runtime, Paraglide-compiled, guarded by assert-i18n-catalog-namespaces) and `apps/frontend/src/lib/i18n/translations/<locale>/` (type-union source, feeds the generated TranslationKey), then the generator is re-run."

requirements-completed: [REVIEW-ADP-04]

coverage:
  - id: D1
    description: "`_setPassword` carries no `currentPassword` at any of the four links: form, authContext, DataWriter interface + universal wrapper, Supabase adapter."
    requirement: "REVIEW-ADP-04"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit — 53 files / 807 tests passed"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend typecheck — 2690 files, 0 errors, 0 warnings"
        status: pass
      - kind: other
        ref: "grep -rn 'currentPassword' apps/frontend/src/lib/api -> 0 lines; grep -c 'currentPassword' settings/+page.svelte -> 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "`error.changePassword` no longer claims the current password was checked, in all seven locales, in both catalog trees."
    requirement: "REVIEW-ADP-04"
    verification:
      - kind: other
        ref: "cross-locale key-set parity script from apps/frontend/messages/README.md — PARITY OK"
        status: pass
      - kind: other
        ref: "yarn lint:check (includes assert:i18n-catalog-namespaces) — exit 0, candidateApp.* 159 keys vs floor 60"
        status: pass
    human_judgment: true
    rationale: "Seven human languages of user-facing security copy. The automated gates prove the key set is intact and parity holds; they cannot judge whether each translation reads naturally or whether the new wording is the one the project wants. A native reader should sign off on da/et/fi/fr/lb/sv."
  - id: D3
    description: "The a11y `cand-settings` anchor is re-pointed to `settings.newPassword` and still gates the scan on a mounted form input."
    verification:
      - kind: other
        ref: "yarn assert:a11y-scan-wiring — 0 violations; yarn typecheck:tests — exit 0"
        status: pass
      - kind: e2e
        ref: "tests/tests/specs/a11y/candidate-a11y.spec.ts cand-settings case — run by the orchestrator at the 157-18 phase gate"
        status: unknown
    human_judgment: false

duration: 12min
completed: 2026-08-30
status: complete
---

# Phase 157 Plan 10: Candidate `currentPassword` Disposition Summary

**Deleted the unverifiable current-password field from the candidate settings form and every link of the `setPassword` chain, and stopped the app telling users in seven languages that a check it never performs had failed.**

## Performance

- **Duration:** ~12 min (15:56Z start, 16:08Z last commit)
- **Tasks:** 3/3
- **Commits:** 3 (`134fc75d3` RED, `006f5a7b2` GREEN, `a3b430acf` copy + collateral)

## Task 1 — The branch, restated from the record

The plan carries Task 1 as `checkpoint:decision` with `gate="blocking-human"`. **It was already taken by the operator on 2026-08-30** and is recorded in § 6 of `157-AUTH-SHIM-DISPOSITION.md`, committed as `259f26b79` (`docs(157-09): record the operator verdict — delete the current-password field`). The orchestrator released this plan with the verdict restated and an explicit instruction not to re-open it. No source file was modified by this task and it carries no commit.

**Branch executed: (a) — DELETE THE FIELD.**

### The three spike verdicts behind it (157-09, measured against the live local stack)

| Item | Question | Verdict |
|------|----------|---------|
| 1 | Does `updateUser({ password, current_password })` typecheck at `@supabase/auth-js` 2.99.3? | **PASS** — `current_password?: string` is on `UserAttributes`; `tsc --strict` exit 0, with a bogus-property negative control proving the check is real (TS2353, exit 2). |
| 2 | Is there a `config.toml` key mapping to `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD` at the pinned CLI? | **FAIL** — the string `current_password` does not occur anywhere in the Supabase CLI v2.83.0 binary. The one `GOTRUE_SECURITY_UPDATE_PASSWORD_*` variable it emits is `…_REQUIRE_REAUTHENTICATION`, bound to `secure_password_change` — the nonce/email-OTP mechanism, which this form does not implement. |
| 3 | With the gate off, does GoTrue reject, ignore, or error on a wrong `current_password`? | **FAIL — it IGNORES it.** `PUT /auth/v1/user` with a deliberately wrong `current_password` returned **HTTP 200**, the password changed, the old password stopped working. Reproduced twice: raw HTTP, then through `supabase-js` (`error: null`). |

**2 of 3 failed.** The plan's own rule ("if ANY of the three failed, take branch (a)") selects (a), and the operator's verdict matches it. Branch (b) is not merely more expensive here — it is **not implementable in this repository**: it requires a gate with no `config.toml` key, and without that gate the server measurably ignores the value. A third option (verifying in-app via `signInWithPassword` before `updateUser`) was put to the operator alongside (a) and (b) and was **declined**.

### File set touched, and the set branch (b) would have touched instead

**Touched (branch (a)) — 24 files.** Source chain: `settings/+page.svelte`, `authContext.svelte.ts`, `authContext.type.ts`, `dataWriter.type.ts`, `universalDataWriter.ts`, `supabaseDataWriter.ts`. Tests: `supabaseDataWriter.test.ts`, `tests/tests/utils/testIds.ts`, `tests/tests/specs/a11y/candidate-a11y.spec.ts`. Localization: fourteen `candidateApp.settings.json` catalogs (see the discrepancy section) and the generated `translationKey.ts`.

**NOT touched — what branch (b) would have needed.** `apps/supabase/supabase/config.toml` — no gate key was set, because item 2 measured that no such key exists at the pinned CLI. Under (b), the seven catalogs, `testIds.ts`, `candidate-a11y.spec.ts` and `translationKey.ts` would all have been left alone; that is the measured reason (b) is cheaper in test churn, and it is exactly the churn this plan paid instead.

**Also not touched, deliberately:** `_resetPassword` (`git diff` on `supabaseDataWriter.ts` shows zero `_resetPassword` lines), and `authToken` anywhere — see Deviation 2.

## Task 2 — The chain (TDD)

**RED (`134fc75d3`).** Rewrote both `setPassword` call sites in `supabaseDataWriter.test.ts` into the post-change shape and renamed the test title. `svelte-check` then reported exactly two errors:

```
ERROR src/.../supabaseDataWriter.test.ts 175:47 "Argument of type '{ password: string; authToken: string; }'
  is not assignable to parameter of type 'WithAuth & { currentPassword: string; password: string; }'.
  Property 'currentPassword' is missing …"
ERROR src/.../supabaseDataWriter.test.ts 190:39 (same)
COMPLETED 2690 FILES 2 ERRORS 0 WARNINGS 1 FILES_WITH_PROBLEMS
```

Baseline immediately before was `2690 FILES 0 ERRORS`, so the two errors are attributable to the RED edit alone.

`:172` was **renamed**, not argument-stripped — 157-09 measured it as a test TITLE. It went from `'calls updateUser with new password, ignoring currentPassword and authToken'` to `'calls updateUser with the new password only, ignoring authToken'`.

**GREEN (`006f5a7b2`).** Removed `currentPassword` from all four links:

| Link | Before | After |
|------|--------|-------|
| `settings/+page.svelte` | `let currentPassword = $state('')`, `setPassword({ currentPassword, password })`, success-path reset, the whole `data-testid="settings-current-password"` block with its `<label>` and `<PasswordField>` | all gone; the now-unused `PasswordField` import removed |
| `authContext.type.ts` / `.svelte.ts` | `setPassword: (opts: { currentPassword?: string; password: string })`, forwarding `currentPassword: opts.currentPassword ?? ''`, JSDoc describing the parameter as a no-op shim | `setPassword: (opts: { password: string })`; JSDoc now states authorisation comes from the active session |
| `dataWriter.type.ts` / `universalDataWriter.ts` | `WithAuth & { currentPassword: string; password: string }` on the interface member, the public wrapper and the abstract `_setPassword`; `@param currentPassword` | `WithAuth & { password: string }` at all three; the `@param` line deleted |
| `supabaseDataWriter.ts` | `_setPassword({ password }: { password: string; currentPassword: string; authToken: string })` + a two-line shim comment | `_setPassword({ password }: { password: string; authToken: string })` + a one-line comment naming only `authToken` |

The register (`candidate/register/password/+page.svelte:79`) and post-recovery reset (`candidate/password-reset/+page.svelte:63`) flows already called `setPassword({ password })`, so narrowing the context type is source-compatible with both — checked before the edit, and confirmed by the clean typecheck after.

**CLAUDE.md Context Destructuring Rule:** honoured. `authContext.svelte.ts` was edited only inside the `setPassword` arrow field; no reactive accessor was destructured, and `settings/+page.svelte` destructures only stable members (`getRoute`, `setPassword`, `t`, `userData`) from `getCandidateContext()` — unchanged by this plan.

## Task 3 — The copy and the collateral

**`error.changePassword`, all seven locales, verdict recorded.** Before, every locale asserted the check: en *"Password change failed. Make sure that your current password is correct."*, and its da/et/fi/fr/lb/sv equivalents (all at `:5` of the type-source tree, `:6` of the runtime tree). Item 3 proves that check does not happen. All seven now say only that the change failed, with an actionable next step, matching the "contact support" button the same form already renders:

| Locale | New string |
|--------|-----------|
| en | Password change failed. Please try again, or contact support if the problem persists. |
| da | Ændring af adgangskode mislykkedes. Prøv igen, eller kontakt support hvis problemet fortsætter. |
| et | Parooli vahetamine ebaõnnestus. Proovi uuesti või võta ühendust toega, kui probleem püsib. |
| fi | Salasanan vaihto epäonnistui. Yritä uudelleen tai ota yhteyttä tukeen, jos ongelma jatkuu. |
| fr | Échec du changement de mot de passe. Veuillez réessayer ou contacter l’assistance si le problème persiste. |
| lb | Passwuert konnt net geännert ginn. Probéiert wgl. nach eng Kéier, oder kontaktéiert de Support, wann de Problem bestoe bleift. |
| sv | Lösenordsändringen misslyckades. Försök igen, eller kontakta supporten om problemet kvarstår. |

**Key removals.** `password.current` and `password.currentDescription` removed from every locale in both trees. `currentDescription` was already dead (its only reference was a commented-out `<p>` in the settings page, deleted with the block in Task 2).

**Generated type map.** Regenerated with `yarn workspace @openvaa/frontend generate:translation-key-type`, never hand-edited. The diff is exactly two removed union members and nothing else:

```
-  | 'candidateApp.settings.password.current'
-  | 'candidateApp.settings.password.currentDescription'
```

**a11y anchor RE-ANCHORED, not deleted.** `candidate-a11y.spec.ts` `cand-settings` moved from `testIds.candidate.settings.currentPassword` to `testIds.candidate.settings.newPassword`. `settings-new-password` is rendered by the same form template, in the same `<section>`, on the same load, so it holds the identical "inputs mount with the candidate's own data, unlike the static 'Settings' heading" property the surrounding comment relies on. A note in the spec records where the anchor came from and why the replacement is equivalent. `postLoginTestId` (`settings.updateButton`) is unaffected. `testIds.ts` lost its current-password entry, with an NB comment in the file's existing convention for removed entries (cf. the `confirmPassword` note directly below it).

## Verification — commands run and their real output

| Command | Result |
|---------|--------|
| `yarn workspace @openvaa/frontend typecheck` (baseline, pre-change) | `COMPLETED 2690 FILES 0 ERRORS 0 WARNINGS` |
| `yarn workspace @openvaa/frontend typecheck` (RED) | `COMPLETED 2690 FILES 2 ERRORS 0 WARNINGS 1 FILES_WITH_PROBLEMS` — the intended failure |
| `yarn workspace @openvaa/frontend typecheck` (final) | `COMPLETED 2690 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `yarn workspace @openvaa/frontend test:unit` | `Test Files 53 passed (53) / Tests 807 passed (807)` — matches the stated 807 baseline exactly |
| `yarn workspace @openvaa/app-shared test:unit` | `Test Files 10 passed (10) / Tests 79 passed (79)` — matches the stated 79 baseline |
| `yarn test:unit` (monorepo) | `Tasks: 25 successful, 25 total`, **exit 0** — matches the stated 25/25 |
| `yarn lint:check` | **exit 0**. `svelte-check found 0 errors and 0 warnings`; `Tasks: 22 successful, 22 total` |
| `yarn assert:i18n-catalog-namespaces` (inside lint:check) | `total keys: 596; candidateApp.*: 159, adminApp.*: 121, other: 316. 0 violation(s).` — 159 vs the docblock's previously-observed 161, i.e. exactly the two deleted keys, far above the floor of 60 |
| `yarn assert:comment-hygiene` (inside lint:check) | `files scanned: 1576 … 0 violation(s)` |
| `yarn assert:a11y-scan-wiring` (inside lint:check) | `0 violation(s)` |
| `yarn typecheck:tests` | exit 0 |
| cross-locale key-set parity (the script in `apps/frontend/messages/README.md`) | `PARITY OK` |

### Branch-specific acceptance greps

| Criterion | Result |
|-----------|--------|
| `grep -c 'currentPassword' settings/+page.svelte` | **0** |
| `grep -rn 'currentPassword' apps/frontend/src/lib/api` | **0 lines** |
| `grep -c 'ignoring currentPassword' supabaseDataWriter.test.ts` | **0** |
| `git diff supabaseDataWriter.ts \| grep -c '_resetPassword'` | **0** — untouched |
| `grep -rc 'settings-current-password' tests` | **0** (see Deviation 4) |
| `grep -c 'settings.newPassword' candidate-a11y.spec.ts` | **1** |
| `grep -rl 'password.current' apps/frontend/src/lib/i18n/translations` | **0 files** |
| `grep -rl '"current"\|"currentDescription"' apps/frontend/messages` | **0 files** |

### What I could NOT verify

- **The full E2E suite.** Not run, per the orchestrator's instruction — it owns that gate at `157-18`. Plausibility was checked instead: the only E2E consumer of the settings password form is the `cand-settings` a11y case, which is re-anchored and passes `assert:a11y-scan-wiring` and `typecheck:tests`; `grep -rn 'settings-current-password' tests` is 0, so no journey fills the deleted field; and there is **no visual baseline for the candidate settings route** (`tests/tests/specs/visual/__screenshots__/` holds only candidate-preview and voter-results shots), so removing a form field carries no screenshot-baseline risk.
- **A live candidate password change end to end.** That is the plan's declared `backstop` truth and is the E2E suite's job at the phase gate.
- **Native-speaker judgement on six of the seven new strings.** Flagged as `human_judgment: true` on D2.
- **`yarn db:lint:sql` and the pgTAP suite** — not run, per instruction (pre-existing exit 1 since phase 151). The database was not touched at all.

## Deviations from Plan

### 1. [Rule 2 — missing critical functionality] The copy fix needed FOURTEEN catalog files, not seven

- **Found during:** Task 3 `read_first`, while locating `assert-i18n-catalog-namespaces`'s input.
- **Issue:** The plan, `157-RESEARCH.md` § D.5 and `157-AUTH-SHIM-DISPOSITION.md` § 5(ii)/§ 6 all name exactly one catalog tree, `apps/frontend/src/lib/i18n/translations/<locale>/candidateApp.settings.json`, and describe it as where the false claim lives. There is a **second, parallel tree**: `apps/frontend/messages/<locale>/candidateApp.settings.json`, same seven locales, same keys, namespace-wrapped instead of bare.
- **Why it matters:** `apps/frontend/messages/` is the one users read. `apps/frontend/src/lib/i18n/wrapper.ts` resolves `t()` against `$lib/paraglide/messages`, which Paraglide compiles from `messages/`; `scripts/assert-i18n-catalog-namespaces.mjs` also reads `apps/frontend/messages/en`. The `src/lib/i18n/translations/` tree is consumed **only** by `tools/translationKey/generateTranslationKeyType.ts` to build the `TranslationKey` union. **Had I edited only the tree the plan named, the type union would have changed and every gate would have gone green while the false security claim stayed on screen in all seven languages** — precisely the defect T-157-24 exists to close.
- **Fix:** Applied the `changePassword` rewrite and both key deletions to **both** trees, 14 files. Re-verified with the cross-locale parity script from `messages/README.md` (`PARITY OK`) in addition to the namespace guard.
- **Commit:** `a3b430acf`.
- **For the phase record:** any later plan that edits a catalog key must touch both trees. This is worth carrying into `157-11`/`157-17` and the phase-gate review.

### 2. [Scope, deliberate] `authToken` retained on the `setPassword` chain

- **Issue:** The plan's branch-(a) `<behavior>` bullet says "`_setPassword({ password })` takes no `currentPassword` **and no `authToken`**", while the same task's `<action>` paragraph enumerates only `currentPassword` removals. The two disagree.
- **Resolution:** Removed `currentPassword` only. `authToken` stays on `WithAuth`, on the interface member, the wrapper, the abstract, `_setPassword`'s destructured type, and `authContext`'s `authToken: ''` argument.
- **Reasoning:** The plan itself warns, in the branch-(b) paragraph, that removing `authToken` here "is `157-11`'s wave, and doing it in two places would collide on the same signature". `157-AUTH-SHIM-DISPOSITION.md` § 2 class 1 assigns `supabaseDataWriter.ts` `_setPassword`'s `authToken` and `authContext.svelte.ts:72` to `157-11`, and § 6's enumerated branch-(a) collateral lists **only** `currentPassword` sites. `157-11` must also delete the `WithAuth` type itself and re-express 10 option types, so doing a partial removal here would fragment that sweep across two plans and two waves. No acceptance criterion of this plan requires `authToken`'s removal.
- **Consequence for `157-11`:** `_setPassword` is now `{ password: string; authToken: string }`; `authContext.setPassword` forwards `{ password, authToken: '' }`; the writer tests pass `{ password, authToken: '' }`. All three remain in `157-11`'s class-1 scope, unchanged in kind.

### 3. [Rule 3 — blocking] Removed the now-unused `PasswordField` import

- Deleting the current-password block orphaned `import { PasswordField } from '$lib/candidate/components/passwordField'` in the settings page, which `unused-imports/no-unused-vars` would flag and which `lint:check` gates. Removed in the same commit. `PasswordSetter` (the new-password control) is untouched.

### 4. [Minor, self-corrected] Comment wording adjusted so the acceptance grep reads literally 0

- My first `testIds.ts` note quoted the deleted value verbatim, which made `grep -rc 'settings-current-password' tests` return 1 rather than the criterion's 0 — a documentation comment, not a live reference, but the criterion is literal. Reworded to name the entry without the raw string. The criterion now passes literally **and** the removal stays documented. `candidate-a11y.spec.ts`'s note still names the previous anchor (`settings.currentPassword`); no criterion forbids that, and it is the note's whole point.

## Frontmatter-vs-body file-set discrepancy (as instructed, recorded explicitly)

`157-10-PLAN.md`'s `files_modified:` frontmatter lists **seven** files — the source chain plus the writer test. That list is **under-declared for branch (a)**. The plan's own body at `:146-148` states the authoritative branch-(a) set, adding `tests/tests/utils/testIds.ts`, `tests/tests/specs/a11y/candidate-a11y.spec.ts`, the seven `candidateApp.settings.json` catalogs, and the generated `translationKey.ts`.

Both are short of what the change actually required. Realized: **24 files.**

| Source | Count | Gap |
|--------|-------|-----|
| Frontmatter `files_modified` | 7 | omits every Task-3 collateral file |
| Plan body `:146-148` (authoritative) | 17 | counts the catalogs once; there are two trees |
| **Actually modified** | **24** | +7 runtime Paraglide catalogs (Deviation 1) |

## Known Stubs

None. No placeholder, empty-literal or TODO was introduced. No test was skipped. Every `<verify>` in the plan was run and is reported above with its real output, except the E2E backstop, which the orchestrator owns.

## Threat Flags

None. This plan removes surface rather than adding it: one form field, one option-type member across four signatures, two locale keys. No new endpoint, auth path, file access or schema change. `T-157-PWD` and `T-157-24` are both discharged — the app no longer claims a check it does not perform. `T-157-26` is discharged by the re-anchor rather than a deletion. `T-157-25` is untouched (the settings page still logs an interpolated message string, not an object). `T-157-SC` holds: zero packages installed.

## Deferred / observed, not fixed

- **`candidateApp.settings.password.areSame` is dead.** `grep -rn 'areSame' apps/frontend/src` (excluding the generated union) returns nothing — the key exists in all seven locales in both trees and is rendered nowhere. Its wording ("The new password is the same as the current password") is also now the only remaining catalog string that mentions a current password. Out of this plan's scope: the plan named only `password.current` and `password.currentDescription`, and this is not a defect my changes caused. Worth a line in a later catalog-hygiene pass.
- **One pre-existing lint warning**, unrelated and untouched: `candidateContext.svelte.test.ts:19:9 'question' is assigned a value but never used`.

## Self-Check: PASSED

- `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte` — FOUND
- `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts` — FOUND
- `apps/frontend/src/lib/contexts/auth/authContext.type.ts` — FOUND
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — FOUND
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` — FOUND
- `apps/frontend/src/lib/api/base/dataWriter.type.ts` — FOUND
- `apps/frontend/src/lib/api/base/universalDataWriter.ts` — FOUND
- `apps/frontend/src/lib/types/generated/translationKey.ts` — FOUND
- `tests/tests/utils/testIds.ts` — FOUND
- `tests/tests/specs/a11y/candidate-a11y.spec.ts` — FOUND
- 14 × `candidateApp.settings.json` (both trees, 7 locales each) — FOUND
- Commit `134fc75d3` — FOUND
- Commit `006f5a7b2` — FOUND
- Commit `a3b430acf` — FOUND
