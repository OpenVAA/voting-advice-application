---
phase: 178-sign-in-email-code-registration
plan: 08
subsystem: frontend
tags: [i18n, paraglide, message-catalogue, test-ids, supabase-adapter, account-access, password-recovery, registration-modes, pure-module, vitest]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-07: the request-recovery operation of the account-access Edge Function and its wire; plan 178-05: getEffectiveRegistrationModes pinned to the server's rule by a truth table; plan 178-01: the gate driver and the verdict script"
provides:
  - "Forty-five new message keys in each of the seven catalogues, sixteen of them in the new namespace contestantApp.emailSent, with the regenerated TranslationKey union"
  - "The registry's fifty-three new test ids for the login, sign-in, registration, email-entry, email-sent, set-password, forgot-password and password-reset surfaces"
  - "ButtonBaseElementProps.form"
  - "requestPasswordRecovery({ email, locale }) on the writer contract, the base class and the Supabase adapter; RequestPasswordRecoveryOptions; parsePasswordRecoveryRequest; the operation 'request-recovery' in the adapter's one invocation method"
  - "lib/contestant/utils/registrationOffer.ts: listedRegistrationModes(settings), signInLinkOffered(settings), RegistrationOfferSettings"
  - "lib/contestant/entryFlow/: RESEND_WAIT_SECONDS, LINK_REQUEST_SETTLE_BOUND_MS, EntryOrigin, EntryWording, EntryLinkRequest, EntryHeldCode, EntryHeldRequest, EntryFlow, wordingOf, secondsLeft, settledOrBounded, askedAgainTooSoon"
affects: [178-09, 178-10, 178-11, 178-12, 178-13, 178-14, 178-15, 178-16, 178-17, 178-18, 178-19, 178-23]

actuals:
  tokens: 18594
  tasks: 3
  commits: 4
plan_head_before: ade50cb4ea5d067458ae84292a39e05db4265dfa
plan_head_after: 9920af9e1733366bb3b5b3228d0a718de7462523

tech-stack:
  added: []
  patterns:
    - "A rule several surfaces share is one pure function of the settings object, so a component passes its context's settings and a server load passes the settings it loaded"
    - "A countdown is a function of two times, never a counter: the seconds left are computed from the settlement and the present"
    - "A wait on a request that may never answer is bounded by a constant of a module, and the function that waits attaches its own rejection handler"
    - "Catalogue edits in seven locales are one scripted pass that reads the English strings from the contract's table, so they cannot differ from it by a character"

key-files:
  created:
    - apps/frontend/messages/en/contestantApp.emailSent.json (and the same file in da, et, fi, fr, lb, sv)
    - apps/frontend/src/lib/contestant/utils/registrationOffer.ts
    - apps/frontend/src/lib/contestant/utils/registrationOffer.test.ts
    - apps/frontend/src/lib/contestant/entryFlow/entryFlow.ts
    - apps/frontend/src/lib/contestant/entryFlow/entryFlow.test.ts
    - apps/frontend/src/lib/contestant/entryFlow/index.ts
  modified:
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/{common,contestantApp.login,contestantApp.register,contestantApp.setPassword}.json
    - apps/frontend/project.inlang/settings.json
    - apps/frontend/src/lib/i18n/tests/translations.test.ts
    - apps/frontend/src/lib/types/generated/translationKey.ts
    - tests/tests/utils/testIds.ts
    - apps/frontend/src/lib/components/button/Button.type.ts
    - apps/frontend/src/lib/api/base/dataWriter.type.ts
    - apps/frontend/src/lib/api/base/universalDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/invitationAccess.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/invitationAccess.test.ts

key-decisions:
  - "The settings parameter of the two offer functions is a type of its own, RegistrationOfferSettings: the Contestant App's configuration input widened by an optional access.answersLocked, so the merged settings, a provider's stored settings and {} all pass"
  - "secondsLeft is clamped at both ends: never negative and never more than the whole wait, so a clock that moved backwards cannot show a count longer than 65"
  - "askedAgainTooSoon compares codes as it compares addresses, trimmed and without regard to case, because the code field's own hint says capital and small letters are treated the same; an absent or blank member is the same as nothing"
  - "The two link operations of account-access share one acceptance schema in invitationAccess.ts (AcceptedRequestSchema), each parser naming its own operation in its error"
  - "Swedish says logga in for sign in although common.login reads Registrera dig there; Estonian keeps each file's own register (formal in the login namespace, informal elsewhere) and uses parool; Luxembourgish says umellen and never aloggen"

patterns-established:
  - "A new message namespace is registered in one place, the pathPattern list of apps/frontend/project.inlang/settings.json, and moves one pinned number, the files-per-locale count of translations.test.ts"
  - "A frontend unit run is filtered by a positional path with no -- before it; with -- the whole suite runs"

requirements-completed: [REG-01, REG-02, REG-03, REG-10, REG-13, FIX-01]

coverage:
  - id: D1
    description: "Every new string of the entry flow exists in all seven locales under the contract's forty-five keys, with one key set and one placeholder set, E's in the namespace contestantApp.emailSent and none in contestantApp.common; the TranslationKey union holds them"
    requirement: REG-13
    verification:
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-08-t1-verify.sh (the plan's block): 45 keys read from the contract's table, each found in 7 locales, equal key sets in 5 namespaces, {seconds} in each emailSent file, contestantApp.common unchanged since the base, namespace gate 0 — exit 0, twice"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/i18n/tests/translations.test.ts — 'each locale has 51 message files', 'every message file of the base locale is listed for compilation, and no other', the per-locale 'has same message keys' cases, 'the generated TranslationKey union matches the base-locale message keys'; 432 of 432 in src/lib/i18n"
        status: pass
    human_judgment: false
  - id: D2
    description: "The six non-English catalogues' 264 new strings read naturally and correctly to a native speaker"
    verification: []
    human_judgment: true
    rationale: "The strings are constructed from each catalogue's existing terms by a non-native writer and are not reviewed. Only a native reader of each language can judge them; they join the native-speaker review (plan 178-23 extends the todo)."
  - id: D3
    description: "No new string tells a user whether they were invited, whether an address is registered or whether a mail was sent; the flow says sign in and registration code"
    verification: []
    human_judgment: true
    rationale: "A prohibition verified by judgment (PROH-178-22). The English strings are the contract's table character for character, and a scan of the new strings of all seven locales found no log-in, key or the Luxembourgish aloggen wording, but wording is read, not asserted."
  - id: D4
    description: "The registry holds every new id of the Locator Contract and still holds the two ids whose pages are not rebuilt yet; Button's type admits form"
    verification:
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-08-t2-verify.sh: 22 literal ids searched in testIds.ts, the form prop in Button.type.ts — exit 0; yarn typecheck:tests 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "requestPasswordRecovery({ email, locale }) makes the adapter's one invocation of account-access with the operation request-recovery, this adapter's project, the address and the locale and nothing else; it resolves to a bare success for the acceptance and rejects for a transport error and for any other answer"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts — the seven cases of 'the invitation contract > requestPasswordRecovery'; utils/invitationAccess.test.ts — the five cases of 'parsePasswordRecoveryRequest'; ten of the twelve red over two stand-ins (178-08-writer-red.log), green after"
        status: pass
      - kind: other
        ref: "178-08-t2-verify.sh: exactly one functions.invoke( outside comments in supabaseDataWriter.ts and 'request-recovery' named there; yarn assert:project-scoped-queries 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "listedRegistrationModes(settings) lists the identity provider where candidates may use it, then email and code where any served type may, each once and in that order whatever is stored; nothing while answers are locked, for empty settings and for a matrix whose only mode is the provider's for organizations. signInLinkOffered(settings) is true for the email mode or the provider's mode of any served type and does not read the lock"
    requirement: REG-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/utils/registrationOffer.test.ts — 30 cases: 'lists the offered modes for %s' over sixteen stored shapes, 'lists a mode allowed for both served types once', 'answers with none, one or several modes', 'asks for the identity provider’s mode for candidates and for no other entity type', 'answers for %s' over eleven shapes; red over stand-ins, green after"
        status: pass
    human_judgment: false
  - id: D7
    description: "The flow's arithmetic is one stateless module: 65 seconds from settlement, 1 second left at 64 999 ms and none at 65 000; a link request counts as settled when it settles, when it rejects, or at 10 000 ms, and raises no unhandled rejection; asked-again is judged with the same 65-second constant"
    requirement: REG-10
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/entryFlow/entryFlow.test.ts — 41 cases under 'the constants', 'wordingOf', 'secondsLeft', 'settledOrBounded', 'askedAgainTooSoon'; red over stand-ins (178-08-modules-red.log, 68 of 71 failed, each on an expectation), green after; a mutant without the rejection handler red in the two rejection cases (178-08-mutant-rejection.log)"
        status: pass
      - kind: other
        ref: "178-08-t3-verify.sh: both constants at their values, no module-level let, no Svelte import, rune or route key in the flow module — exit 0"
        status: pass
    human_judgment: false
  - id: D8
    description: "The committed tree is green on the six closing gate rows"
    verification:
      - kind: other
        ref: "tests/e2e-runs/178-gates/178-08-close — typecheck, lint, unit, check-frontend, build, format all 0; 178-verdict gates 178-08-close --rows …: PASS"
        status: pass
    human_judgment: false

duration: 22min
completed: 2026-10-12
status: complete
---

# Phase 178 Plan 08: What the Entry Flow's Screens Share and Nothing Renders Yet — the Copy in Seven Locales, the Markers, the Writer's Recovery Method, One List of What Registration Offers and the Flow's Arithmetic — Summary

**Forty-five new message keys in each of seven catalogues (sixteen in the new namespace `contestantApp.emailSent`), fifty-three new test ids, `form` on `Button`'s type, `requestPasswordRecovery` on the writer through the adapter's one invocation of `account-access`, and two pure, tested modules: `listedRegistrationModes(settings)` with `signInLinkOffered(settings)`, and the flow's constants and arithmetic — a 65-second wait counted from settlement and a ten-second bound on a request that does not settle. No screen changed and no spec reads any of it.**

## Read this first

- **Everything is green and nothing was retried.** Four commits, three verify blocks at exit 0, six gate rows at 0. No E2E run was made: the plan has none, its commits are additive, and the predecessor label for the next full run stays `178-07-close`.
- **Three files outside the plan's `files_modified` were changed**, each for a reason the plan's own steps reach: `apps/frontend/project.inlang/settings.json` and `apps/frontend/src/lib/i18n/tests/translations.test.ts` (registering the namespace — Task 1 step 4 says "wherever the tree registers one"), and `invitationAccess.test.ts` (the new parser's own cases).
- **The six non-English catalogues' new strings are constructed, not reviewed**: 44 keys in each of da, et, fi, fr, lb and sv — 264 keys, 270 sentences counting the two forms of `resendWait`. They join the native-speaker review; see *The constructed strings*.
- **The plan's unit commands with `--` do not filter.** `yarn workspace @openvaa/frontend test:unit -- src/lib/api` ran the whole frontend suite (208 files). Both forms' statuses are in *Deviations* 2.
- **Each catalogue held 704 keys before this plan and holds 749 now**, not the 649 and 683 of the UI contract's *Arithmetic*: Phase 177's 55 landed first, and this plan adds 45 and removes none (the eleven removals are plan 178-23's).

## Performance

- **Duration:** about 22 min
- **Started:** 2026-10-12T19:03:29Z
- **Completed:** 2026-10-12T19:25Z
- **Tasks:** 3
- **Files modified:** 51 (12 created)

## Task Commits

1. **Task 1: The forty-five new keys in seven catalogues, and the regenerated key type** — `4bc1b90d6` (feat)
2. **Task 2: The registry's new ids, `form` on `Button`, and the writer's recovery method** — `760798927` (test, the registry), `603e5e6be` (feat, the type and the writer)
3. **Task 3: What registration offers, and the flow's arithmetic** — `9920af9e1` (feat)

## Each task's verify command, with its real exit status

Each script is the plan's `<automated>` block byte for byte, written by `tests/e2e-runs/178-unit/178-05-extract-verify.mjs` and run with `bash`; its `.log`, `.exit` and `.head` are beside it under `tests/e2e-runs/178-unit/`.

| Task | Script | Head it ran on | Exit |
|---|---|---|---|
| 1 | `178-08-t1-verify.sh` | `4bc1b90d6` | **0** |
| 1, again | the same | `9920af9e1` | **0** |
| 2 | `178-08-t2-verify.sh` | `603e5e6be` | **0** |
| 3 | `178-08-t3-verify.sh` | `9920af9e1` | **0** |

None of the three blocks has a defect that changes its verdict. The last stage of Task 2's block runs the whole frontend unit suite where it means the API directory (*Deviations* 2); it passed either way.

## The catalogues: key counts before and after

Counted as the UI contract's *Arithmetic* counts (every leaf of a file, a plural message as one), the same in all seven locales:

| Namespace file | Before | After | Added |
|---|---|---|---|
| `common.json` | 73 | 74 | 1 |
| `contestantApp.login.json` | 6 | 15 | 9 |
| `contestantApp.register.json` | 18 | 34 | 16 |
| `contestantApp.setPassword.json` | 6 | 9 | 3 |
| `contestantApp.emailSent.json` (new) | — | 16 | 16 |
| **The whole catalogue of one locale** | **704** in 50 files | **749** in 51 files | **45** |

The namespace gate prints `total keys: 749; contestantApp.*: 298, adminApp.*: 121, other: 330. 0 violation(s)`. No existing key was reworded, moved or removed: compared key by key against the dispatch base for the five namespaces in seven locales, 0 changed and 0 removed. `contestantApp.common.json` is untouched in every locale.

**The English strings are the contract's table, character for character.** The pass (`178-08-catalogues.mjs`, kept in the session's scratch directory, not in the tree) parses the *New messages* table of `178-UI-SPEC.md` and writes the last cell of each row; nothing was typed by hand. `resendWait` is the one exception in form: its cell holds the two English sentences, written as the two plural forms.

**`contestantApp.emailSent.resendWait`** is a plural message in the form of `contestantApp.home.taskStatus.incompleteCount`: `declarations: ["input seconds", "local secondsPlural = seconds: plural"]`, `selectors: ["secondsPlural"]`, and the forms `one` and `other` in every locale — the two cardinal forms each of the seven languages has for the numbers a count can show. A caller writes `t('contestantApp.emailSent.resendWait', { seconds })`.

**Key order.** Each new key was inserted before the first existing key that sorts after it, so a sorted file stays sorted; the files that were not sorted (`contestantApp.login.json` ends with `answersLockedInfo`) keep their existing order with the new keys in between.

### Where the namespace was registered

One place registers a namespace, and one pinned number moves with it:

- `apps/frontend/project.inlang/settings.json` → `plugin.inlang.messageFormat.pathPattern`: the line `./messages/{locale}/contestantApp.emailSent.json`, between `contestantApp.common` and `contestantApp.entitySelection`. The key-type generator and Paraglide both read their file list from it.
- `apps/frontend/src/lib/i18n/tests/translations.test.ts`: the case `each locale has 50 message files` now reads 51, in its title and its expectation.

`scripts/assert-i18n-catalog-namespaces.mjs` registers nothing by name: it reads every file of the English directory and holds three floors, all cleared.

## The constructed strings, for the native-speaker review

**One line for the todo plan 178-23 extends:** *the 44 new keys of plan 178-08 in each of da, et, fi, fr, lb and sv — nine under `contestantApp.login`, sixteen under `contestantApp.register`, fifteen under `contestantApp.emailSent` (all but `heroEmoji`), three under `contestantApp.setPassword` and `common.emailConfirmation` — were constructed from each catalogue's existing terms and have not been read by a native speaker.*

The strings themselves are in the catalogue files of commit `4bc1b90d6` and are not repeated here. The 44 keys, the same in each locale:

- `contestantApp.login.` `signInWithEmail`, `noPasswordYet`, `noPasswordYetInfo`, `emailRequired`, `emailRequiredFirst`, `passwordRequired`, `linkFailed`, `signedOut`, `noProfile`
- `common.emailConfirmation`
- `contestantApp.register.` `modes.legend`, `modes.identityProvider`, `modes.email`, `modes.code`, `modes.required`, `emailInfo`, `codeFormat`, `codeRequired`, `codeUnconfirmed`, `emailEntry.title`, `emailEntry.ingress`, `emailEntry.mismatch`, `signIn.title`, `signIn.ingress`, `signIn.failed`, `signIn.noPasswordYetInfo`
- `contestantApp.emailSent.` `title`, `intro.signIn`, `intro.recovery`, `intro.code`, `sentTo`, `newest`, `notFound.withAddress`, `notFound.withoutAddress`, `support`, `resend`, `resendWait` (two forms), `resendRequested`, `resendReady`, `changeAddress`, `askedAgain`
- `contestantApp.setPassword.` `title`, `why`, `error`

`contestantApp.emailSent.heroEmoji` is the envelope in every locale and is not a translation.

What a reviewer of each locale should look at first:

| Locale | Terms taken from the catalogue | Judgement calls |
|---|---|---|
| fi | *kirjautua* / *kirjaudu* (`common.login`), *kirjautumislinkki* (the mail), *salasana*, *rekisteröintikoodi*, *pankkitunnuksilla* (`preregister.identification`) | The question and its three answers are in the adessive: *Miten haluat rekisteröityä?* — *Pankkitunnuksilla*, *Sähköpostiosoitteellani*, *Rekisteröintikoodilla*. "The email" is *viesti* after the first mention, and the intro sentences repeat the noun (*viestissä olevaa linkkiä*). |
| sv | *logga in*, *inloggningslänk* (the mail), *lösenord*, *registreringskod*, *bank-id* | **"Sign in" is *logga in*, not the catalogue's `common.login`, which reads "Registrera dig"** — the oddity plan 178-06 met. A screen that shows `common.login` beside these sentences reads inconsistently until that key is corrected. "The email" is *e-postmeddelande* / *meddelandet*. |
| da | *log ind*, *loginlink* (the mail), *adgangskode*, *registreringskode*, *BankID* | "Set a password" follows the catalogue's *vælge adgangskode*. `setPassword.title` (*Vælg en adgangskode*) is close to the existing button label `setPassword.setPassword` (*Vælg adgangskode*). |
| et | *sisse logima*, *sisselogimislink* (the mail), *parool* (`common.password`, `setPassword.*`), *registreerimiskood*, *pangatunnustega* | **The form of address follows each file's existing strings**: formal (*teie*) in `contestantApp.login`, informal (*sina*) in `register`, `setPassword` and the new `emailSent`, which follows the mail. The catalogue was already mixed; a reviewer may want one form throughout. The existing `login.forgotPassword` says *salasõna*; the new strings say *parool*. The question and its answers are in the comitative. |
| fr | *se connecter*, *lien de connexion* (the mail), *mot de passe*, *code d’inscription*, *Bank ID* | Inclusive forms with the median point where the catalogue uses them (*inscrit·e*, *déconnecté·e*, *connecté·e*). The intro sentences repeat the noun (*le lien que contient cet e-mail*). Typographic apostrophes throughout. |
| lb | *umellen* (`common.login`), *Umelllink* (the mail), *Passwuert*, *Aschreiwungscode* (`register.code`), *Bank ID* | **"Sign in" is *umellen* everywhere and never *aloggen***, which the catalogue uses in `answersLockedInfo` and `loggedInWarning`. "Signed out" is *ausgeloggt*, the word of `common.logout`. "Registered" is *registréiert*, as `register.didYouAlreadyRegister` has it, while the act is *aschreiwen*. |

In every locale: the example in `register.codeFormat` is `ABCD-EFGH-JKMN` as written (one occurrence in each of the seven files); `login.linkFailed` names no page and no button; the three answers of `register.modes` fit the one question of `modes.legend`.

**Catalogue oddities met and left alone**, none in a key this plan gives a value: Swedish `common.login` and `login.title` ("Registrera dig"), Estonian `login.forgotPassword` (*salasõna*), French and Luxembourgish `login.haveRegistrationCode` (in English) — the three of the dispatch — and, read here for the first time: Swedish `common.return` reads "Returnera", Swedish `common.saving` lacks the ellipsis the other six have, Luxembourgish `register.wrongRegistrationCode` says *Registréierungscode* where `register.code` says *Aschreiwungscode*, and Luxembourgish `login.answersLockedInfo` says *Umeldung* for "registration". `contestantApp.login.forgotPassword` is untouched in all seven, so `mailTemplates.test.ts` needs nothing.

## Every id added to the registry

Fifty-three, under the keys the Locator Contract gives. Each new id has a one-line comment saying what it marks and which state attributes it carries.

| Block | Keys added | Ids |
|---|---|---|
| `contestant.login` (11) | `page`, `signInLink`, `notice`, `helpLink`, `voterAppLink`, `signInPage`, `emailError`, `passwordError`, `requestLink`, `forgotPasswordLink`, `return` | `contestant-login`, `login-sign-in-link`, `login-notice`, `login-help-link`, `login-voter-app-link`, `contestant-sign-in`, `login-email-error`, `login-password-error`, `login-request-link`, `login-forgot-password-link`, `login-return` |
| `contestant.forgotPassword` (3) | `page`, `emailError`, `return` | `contestant-forgot-password`, `forgot-password-email-error`, `forgot-password-return` |
| `contestant.register` (20) | `page`, `modeOption`, `modeInput`, `modePanel`, `modesError`, `email`, `emailError`, `codeError`, `loginLink`, `return`, `emailEntryPage`, `emailEntrySubmit`, `emailEntryReturn`, `signInPage`, `signInSubmit`, `signInError`, `signInPasswordError`, `signInForgotPasswordLink`, `signInRequestLink`, `signInReturn` | `contestant-register`, `register-mode-option`, `register-mode-input`, `register-mode-panel`, `register-modes-error`, `register-email`, `register-email-error`, `register-code-error`, `register-login-link`, `register-return`, `contestant-register-email`, `register-email-submit`, `register-email-return`, `contestant-register-sign-in`, `register-sign-in-submit`, `register-sign-in-error`, `register-sign-in-password-error`, `register-sign-in-forgot-password-link`, `register-sign-in-request-link`, `register-sign-in-return` |
| `contestant.emailEntry` (new, 4) | `email`, `confirmation`, `emailError`, `confirmationError` | `email-entry-email`, `email-entry-confirmation`, `email-entry-email-error`, `email-entry-confirmation-error` |
| `contestant.emailSent` (new, 8) | `page`, `address`, `resend`, `countdown`, `status`, `askedAgain`, `changeAddress`, `return` | `contestant-email-sent`, `email-sent-address`, `email-sent-resend`, `email-sent-countdown`, `email-sent-status`, `email-sent-asked-again`, `email-sent-change-address`, `email-sent-return` |
| `contestant.setPasswordGate` (new, 4) | `container`, `email`, `error`, `logout` | `contestant-set-password-gate`, `set-password-email`, `set-password-error`, `set-password-logout` |
| `contestant.passwordReset` (1) | `page` | `contestant-password-reset` |
| `contestant.passwordSetter` (2) | `passwordError`, `confirmationError` | `password-setter-password-error`, `password-setter-confirmation-error` |

**Kept:** every id the file held, `login.showLogin` (`login-show`), `login.preregister` (`login-preregister`) and `passwordReset.submit` among them. Four of the new ids name an element a page already renders with that raw string — `login-help-link`, `login-voter-app-link`, `login-forgot-password-link` and `forgot-password-return`; the others are rendered by nothing yet.

## The writer's recovery method

- `dataWriter.type.ts`: `RequestPasswordRecoveryOptions = { email: string; locale: string }`, and `requestPasswordRecovery` beside the four invitation methods, whose TSDoc says a success means only that the request was received and never tells whether the address has an account, nor whether a mail is sent.
- `universalDataWriter.ts`: the public method and the abstract `_requestPasswordRecovery`.
- `supabaseDataWriter.ts`: the operation union of `#accountAccess` is `'check-code' | 'request-link' | 'code-sign-in' | 'request-recovery'`; `_requestPasswordRecovery({ email, locale })` passes exactly those two fields and narrows the answer. **Still one `functions.invoke(` in the file.**
- `invitationAccess.ts`: `parsePasswordRecoveryRequest(raw): void`. The schema both link parsers use is one constant, renamed `AcceptedRequestSchema`; each parser names its own operation in the error.

`requestForgotPasswordEmail` and `resetPassword` are untouched, on the writer and on both contexts, as the plan's ruling 5 lays out. The comment in `_setPassword` is untouched.

## The two modules' unit cases, by title

### `registrationOffer.test.ts` — 30 tests

`listedRegistrationModes`:
- `lists the offered modes for %s`, sixteen stored shapes: `undefined settings`; `null settings`; `settings that store nothing`; `a matrix whose rows are empty`; `both types served with every mode`; `candidates with the code mode alone`; `candidates with the email mode alone`; `the identity provider for candidates alone`; `the identity provider for organizations alone`; `the identity provider for organizations and a code for candidates`; `the email and code modes for organizations alone`; `a mode stored twice and the modes stored in another order`; `a row stored for an entity type the project does not serve`; `a full matrix while answers are locked`; `a full matrix while answers are not locked`; `a full matrix with no stored lock`
- `lists a mode allowed for both served types once`
- `answers with none, one or several modes`
- `asks for the identity provider’s mode for candidates and for no other entity type`

`signInLinkOffered`:
- `answers for %s`, eleven shapes: `undefined settings`; `settings that store nothing`; `the code mode alone`; `the email mode for candidates`; `the email mode for organizations alone`; `the identity provider for candidates`; `the identity provider for organizations alone`; `both the email mode and the identity provider`; `the email mode stored for an entity type the project does not serve`; `the email mode while answers are locked`; `the code mode alone while answers are locked`

### `entryFlow.test.ts` — 41 tests

- `the constants`: `waits 65 seconds before another email may be asked for`; `treats a link request as settled after 10 000 milliseconds`
- `wordingOf`: `words a request made from %s as %s` for the five origins (`signIn`, `register` and `registerEmail` → `signIn`; `registerSignIn` → `code`; `forgotPassword` → `recovery`); `reads the origin alone, whatever else the request holds`
- `secondsLeft`: `at %i milliseconds after the settlement leaves %i seconds` at 0, 1, 999, 1 000, 1 001, 30 000, 64 000, 64 001, 64 999, 65 000, 65 001 and 3 600 000 ms (65, 65, 65, 64, 64, 35, 1, 1, 1, 0, 0, 0); `answers with whole seconds`; `is never negative and never more than the whole wait, also for a clock that moved backwards`; `is computed from the two times alone, so one late reading is as right as a reading every second`
- `settledOrBounded`, under fake timers: `resolves when the request fulfils, before the bound`; `resolves to nothing of what the request answered`; `resolves at once when the request rejects, and never rejects itself`; `leaves no timer behind when the request settles first`; `holds until the bound for a request that never settles, and resolves at it` (not resolved at 9 999 ms, resolved at 10 000); `raises no unhandled rejection for a request that rejects, before the bound or after it`
- `askedAgainTooSoon`: `is false when no request is held`; `is true for the same address inside the wait`; `compares addresses trimmed and without regard to case`; `is false for another address`; `is true for the same code inside the wait`; `compares codes trimmed and without regard to case`; `is true for the same code with another address`; `is false for another code`; `is false when the two requests share neither an address nor a code`; `does not read two absent or blank members as the same`; `is true at 64 999 milliseconds after the settlement and false at 65 000`; `ends with the count: it is true exactly while seconds are left`

## Red before green

| Run | Tree | Result |
|---|---|---|
| The writer's and the parser's test files over two stand-ins — `178-08-writer-red.{log,exit,head}` | `4bc1b90d6` + the uncommitted registry and `Button` type, the tests, the contract's types, the base method and the stand-ins | exit **1**: 10 failed of 260, every one an `AssertionError` (4 "resolved instead of rejecting", 3 "expected to throw", 2 "to strictly equal", 1 "to be called 1 times") |
| the same after the method and the parser were written — `178-08-writer-green.log` | the same + the implementation | exit **0**: 260 of 260 |
| The two modules' test files over wrong-valued stand-ins — `178-08-modules-red.{log,exit,head}` | `603e5e6be` + the tests and the stand-ins | exit **1**: 68 failed of 71, every printed error an `AssertionError`; no `TypeError`, import failure, timeout or unhandled error |
| the same after the modules were written — `178-08-modules-green.log` | `603e5e6be` + the five files | exit **0**: 71 of 71 |

The stand-ins: a `_requestPasswordRecovery` answering `{ type: 'failure' }` without invoking, a parser that accepts everything; `listedRegistrationModes` answering `['code', 'code']`, `signInLinkOffered` and `askedAgainTooSoon` answering a non-boolean, both constants 0, `wordingOf` answering `'none'`, `secondsLeft` answering −1, and a `settledOrBounded` with no bound that passes a value on. None was staged; each was replaced by the real code before its commit. The three module cases that passed over the stand-ins are the ones a no-bound stand-in also satisfies (fulfils before the bound, leaves no timer, raises no unhandled rejection).

**One mutant, beyond the plan:** `settledOrBounded` with its rejection handler removed (`.then(settle)`), made from a copy of the module kept outside the repository with its digest recorded and compared after — exit **1**, red in exactly `resolves at once when the request rejects, and never rejects itself` and `raises no unhandled rejection …` (the listener was called twice), 39 of 41 passing. So the unhandled-rejection case is not vacuous.

## The gate rows

**`tests/e2e-runs/178-gates/178-08-close`, head `9920af9e1`** — `178-verdict.mjs gates 178-08-close --rows typecheck,lint,unit,check-frontend,build,format`: **PASS**, six expected and six recorded, not stale, no Sleep entry in the window; AC power, 100 %.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 21 |
| lint | 0 | 48 |
| unit | 0 | 81 |
| check-frontend | 0 | 9 |
| build | 0 | 18 |
| format | 0 | 20 |

The frontend's unit suite in that row: 209 files passed and 1 skipped, 4 340 tests passed and 31 skipped (4 257 passed before this plan: 12 added in Task 2, 71 in Task 3). The skipped file is `supabaseDataWriter.integration.test.ts`, which runs only in the gate driver's `integration` row; that row and the database rows were not run, since no schema, function or adapter read changed.

Before each commit, on the working tree: `yarn assert:comment-hygiene` 0 (before each of the four commits, new files staged), `eslint` on the touched files 0, `yarn workspace @openvaa/frontend check` 0, `yarn assert:unit-coverage` 0, `yarn assert:project-scoped-queries` 0, `yarn typecheck:tests` 0.

## Decisions Made

- **`RegistrationOfferSettings`** is `NonNullable<ContestantAppConfigInput> & { access?: { answersLocked?: boolean | null } | null }`, or null, or undefined. The lock is read by truthiness, as the contestant context reads it.
- **The identity provider's condition is `isRegistrationModeAllowed(settings, 'candidate', 'identity_provider')`** and the other two are `isRegistrationModeAllowedForAnyType`. The option that keeps D-19's letter (item U-29 (b)) is that one condition; item J5 (b) is the first line of the function.
- **`secondsLeft` has an upper clamp** the plan does not ask for. "65 at the moment of settlement" still holds.
- **Codes are compared trimmed and without regard to case.** The plan says "with the same code"; the code field's hint, written in this plan, says capital and small letters are treated the same, so the tab's judgement follows it.
- **`wordingOf` takes the whole `EntryLinkRequest`** and reads its origin.
- **One schema for the two link answers**, since the function answers both with one body.
- Items U-01, U-04, U-19, U-20, U-28, U-29, J5 and PL-17 were read by the operator on 2026-10-11 and stand at their recommended options; each is built so. The plan's `<output>` calls them unanswered, which was true when it was written.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Registering the namespace needs two files the plan does not list**
- **Found during:** Task 1, step 4
- **Issue:** a message file is compiled, and its keys reach the `TranslationKey` union, only when `project.inlang/settings.json` lists it; and `translations.test.ts` pins fifty files per locale and that every base-locale file is listed.
- **Fix:** one line in the `pathPattern` list; the pinned count and its title read 51.
- **Files modified:** `apps/frontend/project.inlang/settings.json`, `apps/frontend/src/lib/i18n/tests/translations.test.ts`
- **Verification:** the i18n tests 432 of 432; Task 1's verify 0
- **Committed in:** `4bc1b90d6`

**2. [Rule 3 - Blocking] The plan's unit commands with `--` filter nothing**
- **Found during:** Tasks 1, 2 and 3, step 5 / 4 of each
- **Issue:** `yarn workspace @openvaa/frontend test:unit -- src/lib/api` hands vitest the path after a `--`, and the whole suite runs. The same holds for `-- src/lib/i18n` and `-- src/lib/contestant`. Plan 178-07 met this in the functions' workspace.
- **Fix:** the per-task checks were run in the form `yarn workspace @openvaa/frontend test:unit <path>`.
- **Both statuses:** the plan's form, inside Task 2's verify block on `603e5e6be`: exit 0, 207 files passed and 1 skipped, 4 269 tests. The filtered form: `src/lib/i18n` exit 0 (3 files, 432 tests); `src/lib/api` exit 0 (40 files passed and 1 skipped, 849 tests); `src/lib/contestant` exit 0 (20 files, 607 tests).
- **Impact:** none on a verdict; a verify block that means one directory costs about a minute more.

### Other departures, none of them a fix

3. **Five parser cases in `invitationAccess.test.ts`**, a file the plan does not list: the new exported parser has its own cases beside its three siblings'.
4. **The red runs were made over stand-ins**, as plans 178-06 and 178-07 made theirs, so that every failure is an expectation and not a call of `undefined`.
5. **Two defects of my own were caught before their commit and never committed**: `wordingOf` first took `Pick<EntryLinkRequest, 'origin'>`, which the frontend's type check refused for a test's object literal; and four arrow-function helpers failed `func-style`. Both were corrected in the working tree; no commit fixes another.
6. **The existing ids `login.email`, `login.submit` and `login.errorMessage` got no new comment.** The Locator Contract's comment for the third says it carries `data-status`; the page does not render that attribute yet, and a comment describes the code as it is. Plan 178-13 adds the attribute and can say so then. The contract's words "Kept" and "Replaces …" are in no comment.
7. **`testIds.contestant.emailSent.askedAgain`'s comment** says "before the wait had passed", not the contract's "inside a minute", after the sign-off's third ruling.
8. **Tests beyond the plan's list**: for the list, nine more stored shapes and the spy case that shows which entity type the provider's mode is asked for; for the arithmetic, the upper clamp, whole seconds, a late reading, "resolves to nothing of the answer", "leaves no timer behind", a rejection after the bound, code comparison, blank members, and the agreement of `askedAgainTooSoon` with `secondsLeft`.
9. **`Skill("components")` was loaded after the edit of `Button.type.ts`, not before it**, and read then as a check: the type's new member has its JSDoc, and the component's docstring already covers it ("Any valid attributes of either an `<a>` or `<button>` element"), so neither the component nor the generated listing changes. No `.svelte` file and no context consumer was edited.
10. **The reading.** Whole: the dispatch, the plan, the execution rules, `execute-plan.md`, the summary template and `178-07-SUMMARY.md`. By section: the UI contract's *Copywriting Contract*, *Locator Contract*, the "one list" premise, S7's "Send again" and "A second request" bullets and the *Checker Sign-Off*; the research's Pattern 3 and Pitfalls 4, 7 and 12; the pattern map's writer section and its *Messages* rows; decision D-09 of the context. The "for later plans" sections of summaries 01 to 06 were **not** opened: the dispatch's "After 178-NN" sections were taken as their statement.
11. **`.planning/WINDOWS.md` was not written to.** No stub, no skipped test, no verify that was not run.

---

**Total deviations:** 2 auto-fixed (2 blocking), 9 other departures
**Impact on plan:** none on scope. Deviation 2 is a command form later plans' verify blocks repeat.

## Issues Encountered

None beyond the two own defects of *Deviations* 5. No gate set or check was in flight while a file of the tree was edited: every marker was waited for.

## The code-review checklist

| Item | Outcome |
|---|---|
| Solves the issue | the shared half of the entry flow: copy, markers, one type, the writer's recovery method (FIX-01's client half), the list (REG-01, REG-03), the link button's condition (REG-02), the wait and the bound (REG-10), the seven-locale strings (REG-13). Nothing renders or calls any of it until plans 178-10 to 178-19 |
| OWASP top 10 | A01/A04: the list asks for the provider's mode for candidates only, so no surface can send an organization's user into a flow that creates a candidate; one function for four surfaces, so none can offer what another refuses. A04, an account oracle: `settledOrBounded` passes nothing of an answer on and resolves alike for a fulfilment, a rejection and the bound; `wordingOf` reads the origin alone; the writer returns a bare success. A05: the flow module holds no state, so nothing a second request on the server could read. A08: the recovery request goes through the one invocation site that writes `operation` and `project_id` after the caller's fields. A09: the parser's error names the operation and the refused path and never a value |
| Code style guide | followed; `eslint` 0 on every touched file, the `lint` row 0 |
| No `any` | none added |
| No repeated code | the two link parsers share one schema and `narrow`; both comparisons of `askedAgainTooSoon` share `sameText`; the list is built from the accessors of `@openvaa/app-shared` and writes no rule of its own |
| New entities documented | TSDoc on every exported constant, type and function of the two modules, on `RegistrationOfferSettings`, `RequestPasswordRecoveryOptions`, `requestPasswordRecovery`, `parsePasswordRecoveryRequest` and `form`; both modules have a header saying what they hold and that they keep no state |
| Repo documentation updated | **no — see "For later plans"**: none of the documentation is in this plan's files |
| Tracking events | not applicable: nothing a user can reach yet |
| Svelte component guidelines | no component created; `Button.type.ts` keeps the co-located type's form, and the skill's conventions were checked against it |
| Errors handled and logged | the writer throws for a transport error and for an answer that is not the acceptance, naming the operation; `settledOrBounded` handles the request's rejection itself |
| Failing checks | none at the close |
| Dependents not unduly affected | no existing key, id, method or type member changed or was removed; the frontend's type check finds no object typed as the writer that lacks the new method; unit suite 4 340 passed |
| WCAG, keyboard, screen reader | not applicable: nothing rendered changed. `form` is what lets a main button outside its form submit it by Enter in a field |
| Developers' and Publishers' guides | as "Repo documentation updated" |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit; every added comment read; no id of a decision, plan, item or proposal and no history in a comment or a test title |
| Commit history | four commits, none a fix of another |
| Formatting separate | no formatting-only change; `prettier` rewrote only the files the pass wrote |
| `[db]` tag | not applicable |
| Supabase adapter: mixin and `init({ fetch })` | unchanged; the new method uses the adapter's own client |
| Supabase adapter: row mapping | not applicable: the method reads no row |
| Supabase adapter: `safeGetSession()` | not applicable: the request needs no session |
| Supabase backend, Edge Functions | not touched |

## Observed, and inferred

- **Observed:** the three verify blocks' statuses; the key counts before and after; the key-by-key comparison with the base (0 changed, 0 removed); the red and green runs; the mutant; the six gate rows and the verdict; the whole-suite run inside Task 2's verify.
- **Inferred, not observed:** that the Paraglide compiler accepts the new plural message as a caller will use it (the build row compiled the catalogue and passed, but nothing calls the message yet); that `requestPasswordRecovery` reaches the served function with the body the function expects (the unit cases pin the body against plan 178-07's wire; no live call was made — the stack probe's own request is the live witness of the operation); that a browser treats `form` on `Button` as it does on a plain `<button>` (the component spreads its rest props onto the element; no component test was added, and the first screen plan to use it is its first observation).
- **Not reviewed:** the 264 constructed strings.

## Not done, or not verified

- Nothing of the plan is undone.
- **No E2E run**, by the plan: its commits are additive and no spec reads a new id or key.
- **Documentation was not updated** (below).
- The `integration`, `stack` and database gate rows were not run.

## The state the local stack is left in

Untouched by this plan: no reset, no restart, no request to the function, no probe. Thirteen `openvaa-local` containers are up, as plan 178-07 left them; the database holds what `178-07-close` left (so pgTAP test 238 of file 39 is red on it until the next reset, the known finding). Nothing listens on the E2E port 5273. Docker VM free space: 16.6 GiB. Power: AC throughout, 100 %.

## For later plans

- **Predecessor label for the next full run is still `178-07-close`** (444 tests, 116 projects). This plan made no full run and adds no E2E test.
- **178-10, 178-13 to 178-19 — the list.** `import { listedRegistrationModes, signInLinkOffered } from '$lib/contestant/utils/registrationOffer'`. Both take the settings object: `listedRegistrationModes(contestantCtx.appSettings)` inside a tracking scope (never a destructured `appSettings`), or the settings a server load loaded. The answer is a `ReadonlyArray<RegistrationMode>` in the order `identity_provider`, `email`, `code`; empty means nothing offers registration. `data-modes` of C is `listed.join(' ')`. The parameter type is `RegistrationOfferSettings`, exported from the same file.
- **178-13, 178-15 — the link button.** `signInLinkOffered(settings)` does not read the answers lock.
- **178-10 — the flow.** `import { … } from '$lib/contestant/entryFlow'`. `secondsLeft(settledAt, Date.now())`; `await settledOrBounded(writer.requestSignInLink(…))` resolves to nothing and never rejects, so the caller needs no `try`; then `settledAt = Date.now()`. `askedAgainTooSoon(previous, next, Date.now())` is asked **before** the held request is replaced. `wordingOf(request)` takes the request. `EntryHeldRequest` is the request plus `wording`, `settledAt` and `askedAgain`. Under fake timers a test of the bound advances 10 000 ms; `settledOrBounded` leaves no timer once the request settles.
- **178-10 — the countdown's message** is `t('contestantApp.emailSent.resendWait', { seconds })`, a plural message with the forms `one` and `other`.
- **178-10, 178-19 — the writer.** `requestPasswordRecovery({ email, locale })` resolves `{ type: 'success' }` and throws for a transport error or an unexpected answer. Anything that mocks the whole writer contract needs the member; the type check finds no such mock today.
- **Every screen plan — `Button`.** `<Button type="submit" form="<the form's id>" …>` type-checks now.
- **178-12 and the spec plans — the registry.** `testIds.contestant.login.email`, `.submit` and `.errorMessage` are unchanged and uncommented; the plan that renders `data-status` on the refusal says so in the comment. `login.showLogin` and `login.preregister` are still there for 178-18 to remove. `passwordReset.submit` (`password-reset-submit`) is still there beside the new `page`.
- **Any plan that adds a message namespace:** one line in `apps/frontend/project.inlang/settings.json`, and the count in `translations.test.ts` (51 now).
- **Any plan that rewords or removes a key (178-13, 178-16, 178-18, 178-19, 178-23):** each catalogue holds 749 keys; after the contract's eleven removals, 738. Keys are found by their full path; `contestantApp.login.forgotPassword` is still read by `mailTemplates.test.ts`.
- **Running one directory of the frontend's unit tests:** `yarn workspace @openvaa/frontend test:unit src/lib/contestant` — no `--`. A plan's verify block that has the `--` runs the whole suite, about 75 seconds, and its verdict is the same.
- **178-23 — the native-speaker review:** the one line under *The constructed strings*, with the per-locale table. Two things a reviewer should rule on rather than merely read: the Swedish `common.login` ("Registrera dig") beside the new *logga in* sentences, and the Estonian form of address.
- **178-23 — documentation this plan made out of date, none of it edited:** wherever the docs list the writer's methods or the function's callers (`apps/docs` `developers-guide/backend/authentication`, the data-API pages if they name the invitation methods); the Developers' Guide's localization page if it counts namespace files; nothing in `.claude/skills/` names a count this plan moved, and `apps/frontend/messages/README.md` states none.
- **Timing on this host today:** the catalogue pass under a second; the i18n tests 1 s; the frontend's whole unit suite about 75 s; `svelte-check` 9 s; the six gate rows 3 min 17 s.

## Prohibitions

| Id | Statement | Held | How |
|---|---|---|---|
| PROH-178-22 | no string of the entry flow tells a user that they were or were not invited, that an address is or is not registered, or that an email was or was not sent; the UI says "sign in", never "log in", and "registration code", never "key" | yes, by judgment | the English strings are the contract's table character for character, whose sentences are the same for every address; each translation renders its English sentence and adds no fact. A scan of the new strings of all seven locales for "log in", "login" and "key" in English, *aloggen* in Luxembourgish, *salasõna* in Estonian and each language's word for "key" found nothing. `register.signIn.ingress` ("It seems you have already registered") is the contract's sentence for the holder of a used code, shown on the code's status and not on an address |
| PROH-178-23 | the six non-English catalogues' new strings are constructed from each catalogue's existing terms and are never described as reviewed; the three answers to C's question are one question and three answers in each locale's own grammar; the example code is left as written | yes | this summary and the commit say constructed; the per-locale table gives the case of the answers; `ABCD-EFGH-JKMN` is once in each of the seven `register` files |
| PROH-178-24 | the flow's module holds no state: no module-level `let`, no mutable binding, nothing a second request on the server could read | yes | `entryFlow.ts` exports two `const` numbers, six types and four functions of their arguments, and has one private function; Task 3's verify refuses a module-level `let`, a rune, a Svelte import and a route key, and passed. The one timer lives inside the promise `settledOrBounded` returns |

## Threat Flags

None. The plan's register covers what was built: strings, markers, one more operation name on the one invocation site, and two modules that read settings and numbers. No endpoint, auth path, file access or schema was added.

## Known Stubs

None. The stand-ins of the two red runs were never staged and are gone. A test id that nothing renders and a key that nothing shows are the plan's stated output, each read by the plan that builds its screen.

## Next Phase Readiness

Ready for plan 178-09. Everything the screens of the entry flow share is on the tree and tested, the committed tree is green on six gate rows, and no surface a browser can observe has changed.

## Self-Check: PASSED

- Commits `4bc1b90d6`, `760798927`, `603e5e6be` and `9920af9e1` are ancestors of HEAD; `git rev-list --count ade50cb4e..HEAD` was 4 before this file's commit.
- Found on disk: the seven `contestantApp.emailSent.json` files, the five files of the two modules, `tests/e2e-runs/178-gates/178-08-close/summary.tsv`, and under `tests/e2e-runs/178-unit/` the three verify scripts with their logs, statuses and heads, both red logs with their statuses and heads, both green logs and the mutant's log with its digest.
- Each `must_haves.artifacts` string is in its file (`resendWait` in `en/contestantApp.emailSent.json`, `export function listedRegistrationModes` in `registrationOffer.ts`, `RESEND_WAIT_SECONDS` in `entryFlow.ts`, `request-recovery` in `supabaseDataWriter.ts`) and each `key_links` pattern too (`isRegistrationModeAllowedForAnyType` in `registrationOffer.ts`, `'request-recovery'` in `supabaseDataWriter.ts`).
- `git status --short` before this file was written: `?? CAND-APP-PLAN.md` and nothing else.
