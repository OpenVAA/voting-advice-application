---
phase: 179-identity-provider-registration-coverage-close
plan: 24
subsystem: closing-gate
tags: [closing-gate, code-review, e2e-03, identity-provider, oidc, account-access, docs]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-01..179-23: the identity-provider registration flow, its harness, its specs, the coverage census and the closing chain of full runs"
provides:
  - "The code review checklist walked over the phase's whole difference, with nine findings fixed in their own commits"
  - "Gate run tests/e2e-runs/179-gates/179-24-final-r3: all 22 rows at 0, on head c478b7078"
  - "Final run tests/e2e-runs/179-e2e/179-24-final: 613/613 on head c478b7078, after a restart of the edge runtime; PASS against 179-23-close and against the baseline with the chain's summed exceptions"
  - "identityProviderEntityType in registrationOffer.ts: the one type decision both OIDC endpoints ask"
affects: [milestone-audit, verify-phase]

tech-stack:
  added: []
  patterns:
    - "A service-role client is made lazily by the first effect that needs it, after the caller's own token was read with the public key"

key-files:
  created:
    - .planning/phases/179-identity-provider-registration-coverage-close/179-24-SUMMARY.md
  modified:
    - scripts/assert-no-preregister.mjs
    - scripts/fixtures/assert-no-preregister.input.ts
    - scripts/fixtures/assert-no-preregister.expected.ts.violations
    - tests/tests/fixtures/contestant/contestantIdentityProviderGate.fixture.ts
    - apps/supabase/supabase/functions/account-access/index.ts
    - apps/supabase/supabase/functions/account-access/flowConformance.test.ts
    - apps/frontend/src/lib/contestant/utils/registrationOffer.ts
    - apps/frontend/src/lib/contestant/utils/registrationOffer.test.ts
    - apps/frontend/src/routes/api/oidc/authorize/+server.ts
    - apps/frontend/src/routes/api/oidc/callback/+server.ts
    - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
    - apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts
    - apps/frontend/src/routes/contestant/register/+page.svelte
    - apps/frontend/src/routes/contestant/register/page.svelte.test.ts
    - apps/frontend/src/lib/api/utils/auth/providers/types.ts
    - "apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.server.ts"
    - "apps/frontend/src/routes/admin/(protected)/question-info/+layout.server.ts"
    - "apps/frontend/src/routes/admin/(protected)/layout.server.test.ts"
    - tests/tests/setup/shared/assertTeardown.ts
    - "apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/contestant-app/bank-authentication/+page.md"
    - apps/supabase/README.md
    - .claude/skills/database/schema-reference.md
    - .claude/skills/database/rls-policy-map.md
    - .planning/phases/179-identity-provider-registration-coverage-close/179-e2e.sh

key-decisions:
  - "Three code-review items were defects and are fixed: the service-role client built before the token check (checklist, Edge Functions), the callback's own type resolution (the binding rule that only listedRegistrationModes and identityProviderEntityTypes decide what registration offers; it also closes the callback's missing answers-lock check), and CI1's logOut hydration race"
  - "The remaining code-review items stay as residuals: the anonymous settings read repeated in four places and UUID_PATTERN in four copies across two runtimes"
  - "The placeholder domain stays a literal in identityProviderFlow.fixture.ts: the frontend copy imports $lib and the Deno copy is outside the test tree, and a drift would turn every scenario that looks a user up by its placeholder red"
  - "A defect the first gate run found (format) was fixed in its own commit and every closing run was made again; the gate set was made a third time on the final run's head so both runs record one head"

requirements-completed: [E2E-03]

estimate:
  tokens: 60000
actuals:
  tokens: 21000
  tasks: 3
  commits: 15
plan_head_before: 919044454bbf8c21254b129a7fc74813117fe667
plan_head_after: c478b7078d1b9ca4465ab36f0857e13da715b483
metrics:
  duration: "about 2 h 15 min of host clock (13:42Z to 15:58Z, 2026-10-22), a host restart at about 14:51Z included (resumed 15:05Z)"
  completed: 2026-10-22
---

# Phase 179 Plan 24: The closing gate Summary

**The phase closes on one tree, c478b7078. The code review checklist was walked over the whole difference from 320bd265b; nine findings became fifteen commits, three of them code. All 22 gate rows exit 0 (`tests/e2e-runs/179-gates/179-24-final-r3`). After a restart of the edge runtime, the final run `tests/e2e-runs/179-e2e/179-24-final` holds 613/613 with no failed, flaky, skipped or did-not-run test, is not void, and restored the stack. It equals `179-23-close` project by project, and it equals the baseline `179-01-baseline-r5` (548) by exactly the tests the phase's plans added, summed project by project.**

## Task commits

| # | Commit | What |
|---|---|---|
| 1 | e045c68dd | `fix`: the no-preregister guard also reports `PREREGIST` (the rule is `[Pp]reregist\|PREREGIST`); the self-test fixture holds two capitals spellings the old rule missed and an underscored form it leaves alone |
| 2 | 2e8b45f8f | `docs`: the two admin cookie filters' comments no longer list the deleted `id_token` cookie |
| 3 | 62ff6276a | `docs`: `providers/types.ts` no longer says the Idura nonce is verified |
| 4 | 0d9235b49 | `docs`: `assertTeardown.ts` names `identity-provider.teardown.ts`, not the deleted journey teardown |
| 5 | 6fd0bc824 | `docs`: the admin layout test's docblock follows Comment Hygiene (no phase, finding or criterion ids, no history, no plan references) |
| 6 | b10768af7 | `docs`: the authentication page (the false residual removed, F's rule, the confirmation link, `pending_email_taken`, the link text) |
| 7 | cddb14e16 | `docs`: the environment-variables page lists `IDENTITY_CALLBACK_SERVER_SECRET` |
| 8 | 578e88792 | `docs`: `apps/supabase/README.md`'s account-access and identity-callback bullets (179-22's replacement text) |
| 9 | 85056280d | `docs`: `schema-reference.md` and `rls-policy-map.md` gain the two 179-03 functions |
| 10 | b1bfaa9f9 | `test`: `contestantIdentityProviderGate.logOut()` waits for the main button to be enabled before pressing Log Out (held) |
| 11 | b201e4910 | `fix`: `account-access` reads the caller with the public key and makes the service-role client lazily (held) |
| 12 | bd89c0042 | `fix`: both OIDC endpoints decide the type by `identityProviderEntityType` (held) |
| 13 | 1c744d8ee | `docs`: the bank-authentication guide says the callback refuses every type while answers are locked |
| 14 | 6839f1c57 | `style`: `register/+page.svelte` and its unit spec prettier-clean (found by the first gate run) |
| 15 | c478b7078 | `docs` (`.planning/` only): `179-e2e.sh`'s header step (e) no longer relies on `PLAYWRIGHT_BANK_AUTH` |

## Task 1: the code review checklist

Read against `.agents/code-review-checklist.md` over `git diff 320bd265b HEAD -- . ':(exclude).planning'` (330 files, +18 740 / −5 650 at the start). Every touched comment of this plan was read against Comment Hygiene. `yarn assert:comment-hygiene` exits 0 (0 violations). `179-verdict hygiene`: PASS.

### General

| Item | Outcome |
|---|---|
| Solves the issues | Yes. REG-04..REG-08 and REG-14 by the requirement map below; E2E-01/02 by the census; E2E-03 by the final run |
| OWASP top 10 | **Finding, fixed (b201e4910):** `confirm-address` made the service-role client before refusing a missing token. **Finding, fixed (bd89c0042):** the OIDC callback did not read the answers lock (broken access control in a narrow window: authorize refuses while locked, but a lock set between authorize and callback was not honoured). The accepted email-existence oracle is a recorded residual (operator, 2026-10-22). No secret in any log, title or kept evidence was found |
| Code style guide | Followed. Prettier: **finding, fixed (6839f1c57)** — two files unformatted since 3f9b1ea93 (179-16), found by the format row of the first gate run |
| `any` | None added by the phase in application code |
| No repeated code | **Finding, fixed (bd89c0042):** the callback re-derived the provider's types from the matrix; both endpoints now share `identityProviderEntityType`. **Residual:** the anonymous settings read is repeated in four places (`registrationGuard.ts`, CI2's load, the authorize endpoint, the callback); `UUID_PATTERN` has four copies across the Deno and frontend runtimes with no equality test. Neither is a defect of behaviour |
| New entities documented | Yes; the new function has TSDoc |
| Repo docs updated | **Findings, fixed (6–9, 13):** the authentication page, the env-variables page, the Supabase README, the database skill's two references and the bank-authentication guide |
| Tracking events | The new pages are in `pageviewRoutes.ts` (changed by the phase); no other event was added |
| Svelte component guidelines | No component added by this plan; the phase's components were walked by the plans that added them |
| Errors handled and logged | Yes; the function's failures log name and code only |
| Failing checks | The format row; fixed. All 22 rows 0 at the close |
| Shared dependencies unaffected | The type decision moved into `registrationOffer.ts`; its other readers (registration screen, guard, menu) are unchanged and their tests pass |
| WCAG A/AA | The axe scans of every new surface pass in the final run (light and dark) |
| Keyboard and screen reader | Automated focus assertions pass; the full walk is a backstop check for a person (below) |
| Developers' and publishers' guides | Updated (179-22 and this plan) |
| Comment Hygiene | **Finding, fixed (2–5):** the four stale or historical comments. **Left:** `apps/frontend/eslint.config.mjs`'s allowlist comments keep `157-*` / `158-*` labels and "Phase 158"; they predate the phase across hundreds of lines and belong to the ship-time codemod of `Skill("ship-review-stack")`. That skill's `hygiene-grep-report.sh --assert-clean` exits 1 over the whole repository (7 rows, 273 references, pre-existing); a scan of the lines this phase added under `apps/`, `packages/` and `tests/` finds no decision id, plan number, `.planning/` path or bare phase or spike reference |
| Commit history | Linear; conventional subjects. The branch holds fix-of-self commits (for example 340b8aafe, d4dfe33f2) that are squash candidates at ship time |
| Formatting separate | 6839f1c57 is formatting only |
| `[db]` tag | No database change in this plan; the phase's three migration commits carry it |

### Supabase backend

No table, policy, trigger or index added by the phase. The two definer functions (`address_confirmation_request`, `private.caller_pending_email_taken`) set `search_path = ''`, schema-qualify every call and grant EXECUTE to one role each; pgTAP passes (gate row `pgtap`), and the schema equivalence of the appended migrations holds (`equivalence`).

### Supabase adapter

The adapter files the phase changed (`userEntities.ts`, `supabaseDataWriter.ts`, `invitationAccess.ts`) add reads and writer methods to existing classes; no adapter class or route guard was added. `assert:adapter-casts` and `assert:no-session-in-loads` pass inside `lint`.

### Edge Functions

- `account-access`'s `confirm-address` asks no authority question (it acts for the caller's own account, read from the caller's token), and now refuses before any service-role client exists (b201e4910). The conformance test pins the lazy client and the order, and fails on the previous source (`tests/e2e-runs/179-unit/179-24-aa-control-old-index.{log,exit}`: 4 failures).
- `identity-callback` refuses without the server's secret before it reads its body, configuration or token; `fn-closed` (live refusal) and `stack` pass.
- Error responses carry fixed result codes and statuses.

## Carried items settled by this plan

| Row | Outcome |
|---|---|
| 179-19 / 179-20: CI1 `logOut()` hydration race | **Fixed**, b1bfaa9f9 (held green) |
| 179-22: `assert-no-preregister` misses capitals | **Fixed**, e045c68dd; the self-test was seen failing on the old rule first (`179-unit/179-24-prereg-red.{log,exit}`: exit 1, 2 expected findings not reported) and passes after (12/12); the repository scan: 0 findings |
| 179-22 / 179-11 / 179-19: authentication page (l. 151, F's rule, confirmation link, link text) | **Fixed**, b10768af7 |
| 179-15 / 179-22: env-variables page | **Fixed**, cddb14e16 |
| 179-10 / 179-13 / 179-22: `apps/supabase/README.md` bullets | **Fixed**, 578e88792 |
| 179-03 / 179-22: `schema-reference.md`, `rls-policy-map.md` | **Fixed**, 85056280d |
| 179-05 / 179-14: `PLAYWRIGHT_BANK_AUTH` in `base.setup.ts`, `179-e2e.sh` (e), `assertTeardown.ts` | `base.setup.ts` already held none (settled earlier). `179-e2e.sh` header: c478b7078 (its preflight line still records the variable's value, `unset`, which is harmless). `assertTeardown.ts`: 0d9235b49 |
| 179-23: admin layout comments (`id_token`) | **Fixed**, 2e8b45f8f |
| 179-23: `providers/types.ts` nonce sentence | **Fixed**, 62ff6276a |
| 179-21: older phase ids in docblocks 179-21 touched | The admin layout test: **fixed**, 6fd0bc824. `eslint.config.mjs`: **left** for the ship-time codemod (above) |
| 179-08 / 179-14: placeholder domain in the test tree | **Decided: stays.** `identityProviderFlow.fixture.ts` keeps the literal; `bankAuthJourneyConstants.ts` no longer exists. The frontend copy imports `$lib` and the Deno copy lives in the function's tree, so neither is importable from the fixture as the fixture imports today. A drift is not silent: every scenario that looks a user up by `${sub}@<domain>` (registration, teardown) would fail |
| 179-23: todos `2026-08-28-edge-runtime-secrets-local-wiring.md` and `2026-10-07-174-hosted-project-auth-settings-…` | **Already updated** by 179-15 (each holds an "Update 2026-10-22 (Phase 179, plan 179-15)" section: identity-callback reads no `PUBLIC_PROJECT_ID`; `IDENTITY_CALLBACK_SERVER_SECRET` on two services). Nothing to add |
| 179-23: `.planning/WINDOWS.md` rows 217, 220, 221, 222 | **Left** — not on this plan's files; for the operator (below) |
| Code review: service-role client before the token check (179-10) | **Fixed**, b201e4910 |
| Code review: type resolution in two places (179-14, 179-16) | **Fixed**, bd89c0042 |
| Code review: callback's missing answers-lock check (179-07, 179-16, 179-20) | **Fixed** by the same commit: the shared function returns no type while answers are locked; unit case fails on the previous callback (`179-unit/179-24-cb-control-old-callback.{log,exit}`) |
| Code review: anonymous settings read in four places (179-06/07/14) | **Residual** (above) |
| Code review: `UUID_PATTERN` copies (179-09/11) | **Residual** (above) |
| 179-21: not-found page `<title>` "500 – …" for a 404 | **Not reached** by this review's fixes; stays for the operator (pre-existing) |

## Task 2: the closing runs

### Order

1. Review fixes 1–9 committed (not browser-observable). Fixes 10–12 held together and run: `tests/e2e-runs/179-e2e/179-24-held`, **613/613**, wrapper exit 0, `restore: ok`; `179-verdict control 179-24-held --full --same-projects-as 179-23-close --dirty-only apps/frontend/src/ --dirty-only apps/supabase/supabase/functions/account-access/ --dirty-only <the fixture> --green`: **PASS**, 128 projects, 0 not as expected (`_drivers/179-24-held.verdict.log`). Kept copies `179-24-held.<path>.kept`, each `cmp`-equal to what b1bfaa9f9, b201e4910 and bd89c0042 committed.
2. Edge runtime restarted: `yarn db:stop`, `yarn db:start`, each through `withhold-stack-keys.mjs` (`179-unit/179-24-db-{stop,start}.*`).
3. Gate run `179-24-final` on 1c744d8ee: 21 rows 0, **`format` 1** (two files). A closing run that found a defect: fixed in 6839f1c57, and every closing run made again.
4. Edge runtime restarted again (`179-unit/179-24-db-{stop,start}-r2.exit`: 0, 0). Gate run `179-24-final-r2` on 6839f1c57: **22/22 at 0**, verdict PASS.
5. Final run `179-24-final` on c478b7078 (c478b7078 changes only `.planning/`).
6. Gate run `179-24-final-r3` on c478b7078, so the gate run and the final run record one head (the plan's verify compares the two heads literally): **22/22 at 0**, verdict PASS, no Sleep entry in its window.

### Gate rows (`tests/e2e-runs/179-gates/179-24-final-r3`, head c478b7078)

| Row | Exit | Row | Exit |
|---|---|---|---|
| typecheck | 0 | docs-links | 0 |
| lint (incl. REG-14's `assert:no-preregister`) | 0 | name-gate-self-test | 0 |
| db-reset | 0 | test-keys-scope | 0 |
| types-regen | 0 | preregister-gone-self-test | 0 |
| types-clean | 0 | coverage-tags | 0 |
| pgtap | 0 | auth-config | 0 |
| sql-lint | 0 | auth-config-self-test | 0 |
| integration | 0 | fn-closed | 0 |
| unit (the functions' included) | 0 | stack | 0 |
| check-frontend | 0 | equivalence | 0 |
| build (the frontend production build included) | 0 | format | 0 |

`179-verdict gates 179-24-final` → `179-24-final-r3`: **PASS**; not stale (tree-equal to HEAD outside `.planning/`). Cookie, edge-environment, signup-closed and catalogue-namespace gates run inside `lint`; scan-wiring likewise.

### The final run (`tests/e2e-runs/179-e2e/179-24-final`)

- **613 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run**, 128 projects, 14.9 min; driver and wrapper exit 0; `prepare: ok`, `restore: ok` (port 9443 free); `sleep_entries_in_window: 0`; not void; head c478b7078. On battery (operator's authorisation), 76 % at the start.
- Identity-provider projects, fully passed: `contestant-identity-provider` 40/40, `bank-auth` 11/11, `data-setup-identity-provider` 1/1, `data-teardown-identity-provider` 1/1.
- **Against `179-23-close`:** `179-verdict e2e 179-24-final --same-projects-as 179-23-close --expect-project contestant-identity-provider --expect-project bank-auth`: **PASS**, 128 compared, 0 not as expected (`_drivers/179-24-final.verdict.log`).
- **Against the baseline `179-01-baseline-r5` (548):** `--except bank-auth=11 --except contestant-entry-phone=2 --except contestant-entry-scan=6 --except contestant-identity-provider=40 --except data-setup-identity-provider=1 --except data-teardown-identity-provider=1 --except perm-closed-project=4`: **PASS**, 128 compared, 0 not as expected (`_drivers/179-24-final.verdict-baseline.log`). 548 + 65 = 613. The journey's three projects are absent from both runs (opt-in at the baseline, deleted by 179-14), so their exception is 0.

**Where each exception comes from** (per-project deltas between consecutive close runs, read from each run's `summary.json`; every close passed its own verdict with the plan's stated exceptions):

| Close | Delta |
|---|---|
| 179-05 | bank-auth +6; journey +1, its setup +1, its teardown +1 |
| 179-06 | contestant-entry-phone +2, contestant-entry-scan +6, contestant-identity-provider +2, its setup +1, its teardown +1 |
| 179-13 | bank-auth +3 |
| 179-14 (close-r2) | contestant-identity-provider +3; journey −1, its setup −1, its teardown −1 |
| 179-15 | bank-auth +2 |
| 179-16 | contestant-identity-provider +10, perm-closed-project +4 |
| 179-17 | contestant-identity-provider +7 |
| 179-18 | contestant-identity-provider +12 |
| 179-19 | contestant-identity-provider +3 |
| 179-20 | contestant-identity-provider +3 |
| 179-03, 04, 07, 10, 11, 12, harness-keys, 21, 23, 24 | none |

The sums match the figures the summaries record (179-13: bank-auth 6 → 9; 179-15: 9 → 11; 179-16: 572 → 588 with perm-closed-project +4; 179-17..20: 588 → 595 → 607 → 610 → 613). No plan closed on another figure.

### Task verify blocks (`tests/e2e-runs/179-unit/179-24-t{1,2,3}-verify.{sh,log,exit,head}`)

- **Task 2** (byte for byte): exit **0** — both verdicts, the census (6 of 6 tags), the REG-14 check (0 findings), one head for both runs, and no change outside `.planning/`.
- **Task 1** byte for byte fails at `yarn -s` (Yarn 4.18.1 rejects `-s`); restated with `yarn assert:comment-hygiene > /dev/null`, it **exits 1 at `179-verdict scope`**, which reports exactly one refusal: `CLAUDE.md is changed`. The two commits that changed it are the orchestrator's at the operator's request (6de18b9c6, f99182682), not an executor's. `hygiene` passes. Reported, not edited (operator's notes).
- **Task 3**: run after this summary's commit (result in the hand-off report).

## Requirement-to-test map (titles from the final run, every one passed)

- **REG-04** — `contestant-identity-provider` › registration › *a new candidate identifies at the provider, gives the address they will sign in with and goes straight to editing; the mailed link proves the address* (the tracer); › a link that confirms an address › *an identity that proved its address signs out, asks the sign-in screen for a link to it, and the mailed link leads to the view asking for a password and then to its home* (sign-in by email); `bank-auth` › *creates an account, a confirmed candidate, its grant and its record for a new identity*.
- **REG-05** — › a returning identity › *an identity with a proved address and a password is told that it has registered and to sign in with its address next time, and goes on to its home without being asked for an address*; › *an identity that gave no address is told that it has registered and asked for an address before any protected page, its settings page opened directly included*; › *an identity whose grant an administrator removed is shown its pending address once, gets no new candidate and is told there is nothing to edit, with no address shown*; › an address awaiting its link › *an identity that gave an address and did not open its link is shown the address once, can have the link sent again, and is reminded of it on its home*; › an account given a second candidate › *… comes back to its own, gets no third, and meets the profile selection listing both*.
- **REG-06** — › both entity types registered with the provider › *a party is chosen, identified, named in the default locale and given an address, and waits unconfirmed for an administrator*; › what the type cookie and the matrix refuse › *a type forged in the type cookie while the browser is at the provider is refused, and nothing is written for the identity*; › *a mode switched off while the registration screen shows it is refused on Continue, in the class trying again cannot cure, with Return and no Try again*; `perm-closed-project` › *the identity provider mode allowed for organizations alone …*; `bank-auth` › *refuses a type the project does not allow and creates no account for the identity*.
- **REG-07** — › both entity types registered with the provider › *a party is chosen, identified, named in the default locale and given an address, and waits unconfirmed for an administrator*; › *an identity that registered a candidate and gave an address comes back choosing a party, names it, and meets the profile selection with both*.
- **REG-08** — › identification failures › *a cancel at the provider shows the cancel, offers Try again and makes no account*; › *an error at the provider shows a failure that trying again may cure*; the CI2 scans `contestant-entry-scan` › *axe accessibility scan — entry-identity-provider-error-cancelled*, *… -retry*, *… -no-retry* (light and dark); `contestant-entry-phone` › *phone 320 / 390: the identity provider's error screen in its no-retry class does not overflow*.
- **REG-14** — `assert:no-preregister` in `lint:check` (gate row `lint` 0) with its self-test (row `preregister-gone-self-test` 0); the repository scan: 2 941 tracked files, 0 findings.
- **E2E-01 / E2E-02** — the census `yarn assert:e2e-coverage-tags` (row `coverage-tags` 0): `@reg-idp`, `@reg-email`, `@reg-code`, `@org-registration`, `@entity-selection`, `@nomination-definition`, each with a test of the final run (for example *register: an invited candidate registers by email through the mode selector*, *register: an invited organization registers with a code*).
- **E2E-03** — the final run itself, 613/613.

## Backstop checks for a person (not made by this plan)

1. **Long text:** the new strings in six locales at 320 px, the type answers and CI2's titles — read by a person; filed with the native-review todo.
2. **Long text:** a long address on CI1, the reminder and settings wraps at any character inside the column, as on E and F.
3. **Autofill:** CI1's and settings' address fields carry `autocomplete="email"` as `EmailEntry` sets it; a person checks that a password manager offers the user's addresses.
4. **Keyboard:** C → provider → CI1 → G by keyboard and with a screen reader, in `en`, with the mock issuer.
5. **UI:** CI1 V2 at 320 px with three locales of name fields — the phone check measures overflow; a person judges the length of the form.

## Flagged assumptions, carried to verification

| Assumption | What was built against it |
|---|---|
| The Signicat leg of the type cookie and the server-held verifier (research A5) | The authorize endpoint makes the verifier and stores it with the type in httpOnly cookies; unit cases cover the Signicat branch. No Signicat mock exists, so the round trip is unobserved |
| The page-cache restore after Back from the provider (N-5) | A `pageshow` handler ends C's loading state; unit-tested only |
| Probe row P4 / U-16's no-session sentence | Observed: the second link opened with no session ends on the login page with the taken-address notice (scenario above). That the callback reads any auth 500 without a code on `email_change` as "taken" is inferred (179-19) |
| CI's run of the default-on specs (PL-16) | Not observed; todo `2026-10-21-179-observe-default-on-identity-provider-specs-in-ci.md` |
| A user in state none cannot sign in while answers are locked (U-13 ★'s residual) | Unchanged, and now also true at the callback (bd89c0042); todo `2026-10-21-179-identity-provider-sign-in-while-answers-locked.md` |

## Residuals (not closed)

- The identity lookup pages every auth user (`findUser`, 1 000 a page) — todo filed by 179-23.
- The callback does not compare the Idura nonce with the token's claim (the mock issuer mints none) — todo re-anchored by 179-23.
- The verifier copy: the ID token is verified by a fourth copy of the verifier (todo `2026-08-22-edge-function-fourth-idtoken-verifier-copy.md`, untouched by the phase).
- The anonymous settings read in four places and `UUID_PATTERN` in four copies (above).
- The compensating delete of `identity-callback` can itself fail, leaving a grant, record or entity behind — todo re-anchored by 179-23.
- U-13's locked case (above).
- CI unobserved (above).
- The auth service's email-existence answer to a user's own address change: **accepted residual**, operator decision 2026-10-22 (settled, not open).
- The local stack does not enforce the 30-per-5-minutes verification budget; the identity-provider spec spends about 95 verifications a run unpaced (179-17/18; stated in `tests/README.md`).

## The round (J1–J7, U-01..U-24, the research's recommendations)

Every item stands as read at 179-01 (operator rulings 2026-10-21; no OPERATOR-ROUND file; PL-01 accepted): J1–J7 at the context's proposals, U-01..U-24 at ★, the ninth code `configuration_error`, U-16 with the caller-only fact. The other option of each, and where it lands, is the table in `179-EXECUTION-RULES.md` § *Items built at the recommended option* and § *The planner's items*, unchanged:

- J1 — one disjunct of the gate predicate (`gates.ts`, `identityProvider`) and V4's markup (`IdentityProviderGate.svelte`).
- J2 — not located (a server-written marker would be a new operation).
- J3 — migration `00002_claim_excludes_identity_provider_accounts.sql` not written.
- J4 — `requireEnv` of the secret and the header check in `identity-callback/index.ts`.
- J5 — one comparison in `parseIdentityCallbackRequest` (`identity-callback/requestContract.ts`).
- J6 — one branch of `resolveOwnEntity` (`identity-callback/ownEntity.ts`).
- J7 — the route key and the folder `register/identity-provider/error`.
- U-01..U-24 — the blocks `179-UI-SPEC.md` § *PROPOSED* tables.
- Ninth code — one row of `oidcErrorFromFunction` (`oidcError.ts`).
- U-16 (b) — the `pending_email_taken` key of `get_user_entities` and its read in the callback.

## CLAUDE.md (not edited; reported)

The orchestrator updated the wrapper, project-scoping and Auth sentences at the operator's request (6de18b9c6, f99182682): `identity-callback` reads no project from its environment and answers the frontend server alone. One sentence the phase made false remains:

- § Backend, **Auth**: "a signed-in user with no password meets the Contestant App's set-password gate before any protected page". Proposed: "a signed-in user with no password and a confirmed address meets the Contestant App's set-password gate before any protected page; an account the identity provider created is first asked by its own view for an address, and meets the set-password gate once that address is confirmed".

## User setup

**`IDENTITY_CALLBACK_SERVER_SECRET`**: one random value of at least 32 bytes per deployment (`openssl rand -hex 32`), the same value in the root `.env` (the frontend server) and in `apps/supabase/supabase/functions/.env`; on a hosted project, a function secret and a private variable of the frontend service. The operator reported it set locally ("the env is now fixed"); this plan did not read `.env` to check. E2E runs generate their own.

## Milestone audit

The milestone audit is `/gsd-audit-milestone`'s (D-24), not this plan's.

## Deviations from Plan

### Auto-fixed issues

1. **[Rule 1 - Bug] The format row failed on the first gate run.** `register/+page.svelte` (one `$derived` line in the script block) and `register/page.svelte.test.ts` were unformatted since 3f9b1ea93 (179-16); the chain ran the format row only at the baseline. Fixed in 6839f1c57; every closing run made again.
2. **[Rule 1 - Bug] Review findings in code** (b1bfaa9f9, b201e4910, bd89c0042), each held and run before its commit, as Task 1 directs. Two unit tests whose fixed text pinned the old shape were updated with the code: `flowConformance.test.ts` (the client count 2 → 3, the `admin()` call form) and `authorize-endpoint.test.ts` (the spy moved to `identityProviderEntityType`, now called with the named type).
3. **[Rule 3 - Blocking] `yarn -s`.** Yarn 4.18.1 rejects it; the Task 1 verify block is restated with `> /dev/null`.
4. **[Rule 3 - Blocking] zsh has no `PIPESTATUS`.** The first `yarn db:stop` ran in zsh, so its status was not recorded (the containers were gone afterwards: stopped). Every later stop and start ran under `bash -c` with `PIPESTATUS[0]` recorded: 0.
5. **A third gate run.** `179-e2e.sh`'s header fix (c478b7078, `.planning/` only) landed between the second gate run and the final run, so the two recorded different heads, tree-equal outside `.planning/`. The plan's verify compares the heads literally, so the gate set was made again on c478b7078 (`-r3`, green). Nothing outside `.planning/` was committed after the first closing run except the format fix the closing run asked for.
6. **Host restart at about 14:51Z** mid-review; the orchestrator restored the stack and the root-pin guard. The working tree was re-read file by file before each commit.

### Files touched that the plan did not list

Every file in `key-files.modified` except this summary (the plan lists only the summary; each is a review finding).

## Operator's notes

- **`179-verdict scope` refuses only `CLAUDE.md`**, changed by 6de18b9c6 and f99182682 at the operator's request. The Task 1 verify block cannot exit 0 while that holds; the check was not edited.
- **`.planning/WINDOWS.md` rows 217, 220, 221, 222** are ready to retire (the bank-auth round trip runs default-on and green: 179-24-final). Row 218 (the 158-03 checklist walk) is separate. Not on this plan's files.
- **`apps/frontend/eslint.config.mjs`** comments carry Phase 157/158 planning labels; for the ship-time hygiene codemod. `hygiene-grep-report.sh --assert-clean` is red repository-wide (pre-existing).
- **Not-found page `<title>`** reads "500 – …" for a 404 (179-21's note; pre-existing).
- **The docs' authentication page** now has a section on the placeholder address; a reader of `pre-registration-and-invitation` still finds the folder name (the page's address is unchanged, by 179-22's decision).

## Statements observed and inferred

- **Observed:** every run, verdict, gate row, control and count above; the two negative controls (old `account-access/index.ts`: 4 conformance failures; old callback: the locked case fails); the no-preregister self-test red then green; `cmp` of every held copy.
- **Inferred:** that the callback's lock check closes the window between authorize and callback (unit case only; no spec flips the lock mid-flow); that the placeholder-domain drift would turn the scenarios red (read from the fixture's two uses).

## Known Stubs

None.

## Threat Flags

None. The plan narrows two surfaces (the service-role client's lifetime, the callback's type decision) and adds none.

## Self-Check: PASSED

- The fifteen commits of the table are ancestors of HEAD; `git rev-list --count 919044454..c478b7078` = 15.
- `tests/e2e-runs/179-e2e/179-24-held`, `tests/e2e-runs/179-e2e/179-24-final` and `tests/e2e-runs/179-gates/179-24-final-r3` exist, with their verdict logs.
- `git status --short` before this summary's commit: this summary and the operator's `CAND-APP-PLAN.md` only.
- STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT, RESEARCH, PATTERNS, UI-SPEC, CLAUDE.md and `179-CARRIED-ITEMS.md` were not touched by this plan.
