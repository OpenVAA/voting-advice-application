---
phase: 178-sign-in-email-code-registration
plan: 06
subsystem: database
tags: [supabase, postgres, pgtap, security-definer, invitations, password-recovery, edge-functions, mail-templates, i18n]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-01: the gate driver and the verdict script; plan 178-02: probe rows P1 (held) and P2 (held); plan 178-05: private.invitation_mode_allowed, the conjunct this plan asks of an open invitation, and the form of a red pgTAP run over a stub"
provides:
  - "public.recovery_link_request (p_project_id uuid, p_email text) RETURNS jsonb: {\"email\", \"mail\": \"recovery\" | \"sign-in\"} or SQL null; SECURITY DEFINER, search_path '', executable by service_role alone; takes the address's link: slot and writes nothing else; in 506-invitation-rpcs.sql"
  - "private.email_holds_grant_in_project (p_project_id uuid, p_email text) RETURNS boolean: the grant-holder test, stated once and asked by invitation_link_request and recovery_link_request; STABLE, runs as its caller, executable by no API role"
  - "pgTAP: Section 23 of 39-invitations.test.sql (34 assertions titled RECOVERY), the exposure section naming the function (plan 293 to 329), and a census in 07-rpc-security.test.sql of the definer functions of public that the service role alone can execute (plan 39 to 40); the estate is 2431 assertions in 45 files"
  - "RECOVERY_MAIL_TEMPLATES and renderRecoveryMail in functions/account-access/mailTemplates.ts: the recovery mail in seven locales in the sign-in mail's five parts"
  - "The sign-in mail's fourth part reworded in seven locales: only the newest link asked for works; a new one is asked for in the application, with no page named"
  - "mailTemplates.test.ts: every completeness case over both mails, 142 tests"
affects: [178-07, 178-10, 178-13, 178-18, 178-19, 178-20, 178-23, 178-24]

actuals:
  tokens: 22810
  tasks: 3
  commits: 3
plan_head_before: 8535cc70fec388414ec7db0a3f9f4e8ff5a9ac82
plan_head_after: ea52187bb88b7a07fc14624b2b99a44164d1e68d

tech-stack:
  added: []
  patterns:
    - "A question two definer functions must answer alike is one private function that runs as its caller, revoked from every API role, and each caller asks it"
    - "Two requests that would stop each other's links take one throttle key, so the limit is on the address and not on the kind of request"
    - "A mail that names a control quotes the label the locale's message catalogue gives it, and a test reads the catalogue from disk and requires the mail to hold it"
    - "A red unit run over a symbol that does not exist yet is made over a blank stand-in in the working tree, replaced before anything is committed, so every failure is an expectation"

key-files:
  created: []
  modified:
    - apps/supabase/supabase/tests/database/39-invitations.test.sql
    - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
    - apps/supabase/supabase/schema/506-invitation-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts
    - apps/supabase/supabase/functions/account-access/mailTemplates.ts
    - apps/supabase/supabase/functions/account-access/mailTemplates.test.ts
    - .planning/todos/pending/2026-10-07-174-native-speaker-review-sign-in-mail.md

key-decisions:
  - "Probe row P1 reads held, so the first branch of the plan's ruling 2 is built: a grant holder is answered recovery whether or not the account has a password, and private.user_password_set is not asked"
  - "The grant-holder test is lifted into private.email_holds_grant_in_project and asked by both requests, not written a second time: the two requests share a slot because they decide about the same accounts, and one statement cannot drift from itself"
  - "An invitation earns the sign-in mail through its email column, as a sign-in request without a code is decided; a code row's pending address earns nothing here, as it earns nothing there"
  - "File 07 held no list a service-role-only function could join, so it gains a third census: the definer functions of public that the service role can execute and neither API role can"
  - "Items PL-08, PL-13 and U-24 were read by the operator on 2026-10-11 and stand at their recommended options; all three are built so"

patterns-established:
  - "A new SECURITY DEFINER function of public that only the service role may execute is added by name to the third census of 07-rpc-security.test.sql section 8c"
  - "Every assertion of a recovery or sign-in refusal is followed by a request that is answered, and a refused request is shown to have taken no slot by answering in the same minute once its cause is removed"

requirements-completed: [FIX-01, REG-10]

coverage:
  - id: D1
    description: "The database decides who is sent a recovery mail and which: recovery for the confirmed address of a grant holder in the project, sign-in for an address that has only an open invitation whose mode is allowed, null for everything else"
    requirement: FIX-01
    verification:
      - kind: other
        ref: "apps/supabase/supabase/tests/database/39-invitations.test.sql, Section 23, the 34 assertions titled RECOVERY — 17 red over a stub that answers NULL at head 8535cc70f with the tests in the working tree (tests/e2e-runs/178-unit/178-06-pgtap-red.log), 34 of 34 green in tests/e2e-runs/178-gates/178-06-db row pgtap at head e961ee3b7"
        status: pass
      - kind: other
        ref: "bash tests/e2e-runs/178-unit/178-06-t2-verify.sh (Task 2's automated block, byte for byte) — exit 0 at head e961ee3b7"
        status: pass
    human_judgment: false
  - id: D2
    description: "A recovery request and a sign-in request for one address share one slot in both orders, and invitation_link_release gives it back"
    requirement: REG-10
    verification:
      - kind: other
        ref: "39-invitations.test.sql — 'RECOVERY: a second request for the same address inside 60 seconds answers null', '…invitation_link_release gives the slot back', '…a sign-in request for an address a recovery request was just answered for answers null', '…the two kinds of request share one slot', '…a request answered recovery and one answered sign-in each hold the key a sign-in request for that address takes'"
        status: pass
    human_judgment: false
  - id: D3
    description: "The recovery decision creates no user, writes no grant, changes no column of any invitation and takes no slot for an address no mail would go to"
    requirement: FIX-01
    verification:
      - kind: other
        ref: "39-invitations.test.sql — 'RECOVERY: none of those requests, answered recovery, sign-in or null, created a user, wrote a grant or changed any column of any invitation', '…none of those refusals wrote a throttle key', '…the five answered requests wrote five throttle keys and nothing else'; Task 2's verify reads the function's body for INSERT and UPDATE and finds none"
        status: pass
    human_judgment: false
  - id: D4
    description: "The function is executable by the service role alone, takes a project and an address and nothing else, and is in both censuses"
    verification:
      - kind: other
        ref: "39-invitations.test.sql — the three catalogue assertions that end Section 23 and the four changed or added assertions of Section 21; 07-rpc-security.test.sql test 21; proacl read on the reset database: postgres and service_role"
        status: pass
    human_judgment: false
  - id: D5
    description: "The recovery mail exists in seven locales in five parts under the completeness test, and both mails say that only the newest link works and name no page"
    requirement: REG-10
    verification:
      - kind: unit
        ref: "apps/supabase/supabase/functions/account-access/mailTemplates.test.ts — 142 tests; 26 red over a blank stand-in record (tests/e2e-runs/178-unit/178-06-mail-red.log), 142 of 142 green after; yarn workspace @openvaa/supabase test:unit 534 of 534"
        status: pass
      - kind: other
        ref: "bash tests/e2e-runs/178-unit/178-06-t3-verify.sh (Task 3's automated block, byte for byte) — exit 0 at head ea52187bb"
        status: pass
    human_judgment: false
  - id: D6
    description: "The six non-English texts of the recovery mail and of the reworded sign-in sentence read correctly and naturally to a native speaker"
    verification: []
    human_judgment: true
    rationale: "Constructed from each catalogue's own words and read by no native speaker. The review todo 2026-10-07-174-native-speaker-review-sign-in-mail.md is extended to cover them and stays pending."
  - id: D7
    description: "The three outcomes are indistinguishable to whoever asked for a recovery mail"
    verification: []
    human_judgment: true
    rationale: "PROH-178-16 is verified by judgment: the function is unreachable by an API role (asserted), and its answer stays inside the Edge Function. The operation that calls it, and its uniform answer returned before the work, are plan 178-07's; nothing observable to a caller exists yet."

duration: 19min
completed: 2026-10-12
status: complete
---

# Phase 178 Plan 06: The Database Decides Who Is Sent a Recovery Mail and Which, on the Sign-In Mail's Slot; and the Recovery Mail's Texts in Seven Locales — Summary

**`public.recovery_link_request` answers `recovery` for the confirmed address of a user who holds a grant in the project, `sign-in` for an address that has only an open invitation the registration modes allow, and null for everything else, on the one slot a sign-in request takes and with nothing else written; the recovery mail exists in seven locales in the sign-in mail's five parts, and both mails now say that only the newest link works and name no page; 2431 pgTAP assertions green on a freshly reset database, ten gate rows at 0.**

## Read this first

- **Everything is green and nothing was retried.** Three commits, three verify blocks at exit 0, ten gate rows at 0. No E2E run was made, by the plan's ruling 5: the function has no caller until plan 178-07.
- **Probe row P1 reads `held`, and that branch is built**: a grant holder is answered `recovery` whether or not the account has a password.
- **The dispatch's point about the stack probe is settled without touching the probe: `recovery_link_request` leaves no throttle row for an unknown address.** It answers null before the slot is asked for whenever the address has neither a grant holder's account nor an open, allowed invitation in the project. Asserted ("RECOVERY: none of those refusals wrote a throttle key"). The probe's fresh `r178-probe-stack-recovery-…` address in the default project is such an address, so its cleanup of auth users is enough. **Observed at the database; inferred for the probe**, whose `request-recovery` has no operation to reach until plan 178-07.
- **`contract.ts` is untouched.** This plan did not add `'request-recovery'` to it, so the window in which the `stack` row is red by design opens with plan 178-07's own commit, not with any of these three. The `stack` row was not run.
- **Three departures worth a look** (section *Deviations*): file 07 had no list a service-role-only function could join, so it gained a third census; the grant-holder test was lifted into a private function of a name the rules' table does not hold; and the database was reset once through the gate driver before the red run.
- **The six non-English texts are constructed, not reviewed.** No native speaker has read the recovery mail in da, et, fi, fr, lb or sv, or the reworded sign-in sentence in those six. The review todo is extended and stays pending.

## Performance

- **Duration:** about 19 min
- **Started:** 2026-10-12T18:00:22Z
- **Completed:** 2026-10-12T18:19Z
- **Tasks:** 3
- **Files modified:** 8 (none created)

## Task Commits

1. **Task 1: Who may be sent a recovery mail, as assertions committed red** — `e53af9996` (test)
2. **Task 2: `recovery_link_request`, applied to the local database** — `e961ee3b7` (feat, `[db]`)
3. **Task 3: The recovery mail in seven locales, and the sign-in mail's fourth sentence** — `ea52187bb` (feat)

## Each task's verify command, with its real exit status

Each script is the plan's `<automated>` block byte for byte, written by `tests/e2e-runs/178-unit/178-05-extract-verify.mjs` and run with `bash`; its `.log`, `.exit` and `.head` are beside it. This was the first run of all three blocks and none has a defect.

| Task | Script | Head it ran at | Exit |
|---|---|---|---|
| 1 | `178-06-t1-verify.sh` | `e53af9996` | **0** |
| 2 | `178-06-t2-verify.sh` | `e961ee3b7` | **0** |
| 3 | `178-06-t3-verify.sh` | `ea52187bb` | **0** |

Task 1's and Task 2's blocks were not run again at the final head. Their stages hold there by construction — Task 3 changed no file under `apps/supabase/supabase/tests/database`, `schema`, `migrations` or `packages/supabase-types` — but that is inferred, not run.

## The function as built

**Which branch of probe row P1: `held`.** `178-PROBE-FINDINGS.md` prints `P1: held`: a recovery link verifies to a session for an account with a password and for one without, and the stored password is the same before and after. So the answer is `recovery` for every grant holder; `private.user_password_set` is not asked, and no grant holder falls to the sign-in arm. Asserted with a grant holder whose stored password is the empty string.

**The grant-holder test: lifted, not written twice.** `private.email_holds_grant_in_project (p_project_id uuid, p_email text) RETURNS boolean` holds the `EXISTS` over `auth.users` and `public.grants` that `invitation_link_request` held, moved character for character but for the name of the address variable. Both requests now ask it. Why lifted: the two requests share one slot precisely because they decide about the same accounts, and a rule stated twice can be changed in one place; the checklist's "no repeated code" asks the same. `invitation_link_request` behaves as before by its own assertions: Sections 17 to 19 and 22 of file 39, which ask it of a project-scope holder, an entity-scope holder, a root admin, an account admin, another project's editor and an unconfirmed holder, are green without a changed expectation. The function is `LANGUAGE sql STABLE`, runs as its caller with `search_path = ''`, compares the address as given (both callers pass it trimmed and lower-cased; the header says so) and is revoked from `PUBLIC`, `anon` and `authenticated`.

**The three answers.** A null project or a blank address: null. Else `recovery` when the grant-holder test is true. Else `sign-in` when the project holds an open, unexpired invitation whose `email` is the address and which `private.invitation_mode_allowed` admits. Else null. A non-null candidate then takes `'link:' || p_project_id::text || ':' || encode(sha256(convert_to(v_email, 'UTF8')), 'hex')` once in 60 seconds through `private.invitation_throttle_take`; a taken slot returns null. The answer is `jsonb_build_object('email', v_email, 'mail', v_mail)`.

**"Bound to that address" is the row's `email` column.** A code row whose pending address is the asked address earns nothing: that is how a sign-in request without a code is decided too, and the holder of a code presents the code. This is a reading of the plan's wording, made to keep the two requests alike.

Read from `pg_proc` on the reset database:

| Function | Arguments | Volatility | Definer | `proconfig` | `proacl` |
|---|---|---|---|---|---|
| `public.recovery_link_request` | 2 | volatile | yes | `search_path=""` | `postgres=X`, `service_role=X` |
| `private.email_holds_grant_in_project` | 2 | stable | no | `search_path=""` | `postgres=X` |

Other edits to `506-invitation-rpcs.sql`, all comments: the file's function list and its sentence on whose functions these are; the throttle table's description of a `link:` key ("the sign-in and recovery mails"); `invitation_link_request`'s header names the grant-holder test and says the slot is shared; `invitation_link_release`'s header says it serves both requests; the comment above the service role's `REVOKE` and `GRANT` says seven.

## File 39 and file 07: the plans, before and after

| File | `plan` before | `plan` after | What moved |
|---|---|---|---|
| `39-invitations.test.sql` | 293 | **329** | Section 23, 34 assertions; Section 21, two changed expectations and two added refusals |
| `07-rpc-security.test.sql` | 39 | **40** | one census added to section 8c; nothing existing changed |

**Section 23, "who may be sent a recovery mail"**, has its own seven candidates, eight users and four email invitations in project A, and sets project A's matrix to every mode on at its start. Its 34 assertions, each title beginning `RECOVERY: `:

- **Null** (8): an address the project knows nothing of; a user whose only grant is in the other project; a grant holder whose address is not confirmed; a root admin; an admin of the project's account; an address whose only invitation has expired; no project, no address and a blank address in one; and none of those wrote a throttle key.
- **The answers** (5): a project-scope holder, asked with an address in mixed case and padded, answers the whole object `{"email", "mail": "recovery"}` with the address normalised; an entity-scope holder; a grant holder whose stored password is the empty string; an address with no account and one open invitation answers `sign-in`, normalised too; the other project's editor is answered `recovery` there.
- **Nothing else written** (3): the count of `auth.users`, the count of `public.grants` and the count and an md5 of every column of every invitation are what they were before the fourteen requests; the two keys are the ones a sign-in request takes; the five answered requests wrote five throttle keys.
- **The slot** (8): a second request inside 60 seconds answers null; `invitation_link_release` gives the slot back; the next request is answered with no time moved; a sign-in request after a recovery request answered `recovery` answers null, and after one answered `sign-in` too; a sign-in request for an untouched invited address is answered and a recovery request after it answers null; the same for a grant holder.
- **The mode** (3): with the email mode off for candidates the invited address answers null and a grant holder is still answered; with the mode on again the invited address is answered in the same minute, so the refused request took no slot.
- **Invitation, then grant, then neither** (4): a confirmed account with no grant and an open invitation answers `sign-in`; that user claims the invitation; the same address answers `recovery`; with the grant deleted, the claimed invitation alone answers null.
- **Structure** (3): one signature taking a project and an address and nothing else, returning `jsonb`, definer with an empty `search_path`; executable by `service_role` and by neither `anon` nor `authenticated`; the grant-holder test is one function, in `private`, stable, running as its caller, executable by neither API role.

**Section 21, "exposure"**: the helpers' privilege list reads "the seven helpers" and ends `recovery_link_request false/false/true`; the definer count reads `11 true`; `anon` and a project admin as `authenticated` are each refused the call with 42501.

**File 07, section 8c**: a third census, "the SECURITY DEFINER functions in public that service_role can execute and neither anon nor authenticated can are exactly the nine listed": `delete_storage_object`, the six `invitation_` helpers, `recovery_link_request`, `resolve_email_variables`. The first two censuses and the count of policy-only helpers are untouched. See *Deviations* 1.

## Red before green

| Run | Head | Result |
|---|---|---|
| `yarn workspace @openvaa/supabase test:db`, tests in the working tree, schema unchanged, the function stood in for by a stub that answers NULL — `178-06-pgtap-red.{log,exit,head}` | `8535cc70f` | exit **1**: file 07 failed 1 of 40 (test 21), file 39 failed 21 of 329 (239, 241, 249, 256, 304–308, 310, 311, 314–316, 321–323, 325, 327–329); **no other file**; `Wstat: 0` on both, every failure a `have`/`want` pair or a missing 42501; 45 files, 2431 tests |
| the same command after `yarn db:reset` on the uncommitted schema — `178-06-t2-pgtap-green.log` | `e53af9996` + schema | exit **0**: 45 files, 2431 tests |
| `vitest run mailTemplates.test.ts`, the new tests over a recovery record of blank templates in the working tree — `178-06-mail-red.{log,exit}` | `e961ee3b7` + tests + stand-in | exit **1**: 26 failed, every one an `AssertionError`; among them the sign-in mail's literal and "names no sign-in page", red on the committed module itself |
| the same command over the real module — `178-06-mail-green.log` | `e961ee3b7` + tests + module | exit **0**: 142 of 142 |

Seventeen of Section 23's 34 assertions were green over the stub: the refusals, which a function answering null satisfies, and the assertions of what must not change. The red run was made on a database reset just before it, so the known finding on test 238 did not appear.

## The regenerated migration and the types

`00001_initial_schema.sql`: 128 lines changed, 8928 lines, byte-identical to the 29 schema files in order (`yarn assert:schema-migration-parity` 0). Its added and removed lines are exactly those of `506-invitation-rpcs.sql`'s own diff, compared by `diff` of the two. `packages/supabase-types/src/database.ts` gained one line, regenerated from the reset database: `recovery_link_request: { Args: { p_email: string; p_project_id: string }; Returns: Json };`. `yarn assert:rpc-nullability` 0.

## The mails

`RECOVERY_MAIL_TEMPLATES` is a frozen record over `SIGN_IN_MAIL_LOCALES`, built by the same `template(…)`, and `renderRecoveryMail(locale, link)` stands beside `renderSignInMail`; both renderers now call one private `render(templates, locale, link)`. The module imports nothing and names no Deno global; its header says so and is true. The type names `SignInMailLocale`, `SignInMailTemplate` and `SignInMail` are unchanged and serve both mails. The sign-in mail's seven subjects are unchanged.

The English texts are the UI contract's, character for character. **The strings constructed and not reviewed, by locale** — the sign-in mail's reworded fourth part, then the recovery mail's five parts:

| Locale | Sign-in, fourth part | Recovery: subject · intro · label · fourth part · last |
|---|---|---|
| `da` | Linket virker én gang og udløber snart, og kun det nyeste link, du har bedt om, virker. Hvis det ikke længere virker, kan du bede om et nyt i applikationen. | Nulstil din adgangskode til valgtesten · Åbn dette link for at logge ind og vælge en ny adgangskode: · Vælg en ny adgangskode · …kan du bede om et nyt med ”Glemt adgangskode?” i applikationen. · …Din adgangskode er ikke blevet ændret. |
| `et` | Link toimib ühe korra ja aegub peagi ning toimib ainult kõige uuem link, mille oled küsinud. Kui see enam ei toimi, küsi rakenduses uus link. | Valimiskompassi parooli lähtestamine · Sisselogimiseks ja uue parooli määramiseks ava see link: · Määra uus parool · …küsi rakenduses uus link valikuga „Unustasite salasõna?“. · …Sinu parooli ei ole muudetud. |
| `fi` | Linkki toimii yhden kerran ja vanhenee pian, ja vain uusin pyytämäsi linkki toimii. Jos se ei enää toimi, pyydä uusi linkki sovelluksessa. | Vaalikoneen salasanan palautus · Avaa tämä linkki kirjautuaksesi sisään ja asettaaksesi uuden salasanan: · Aseta uusi salasana · …pyydä uusi linkki sovelluksen kohdasta ”Unohditko salasanan?”. · …Salasanaasi ei ole muutettu. |
| `fr` | Le lien ne fonctionne qu'une seule fois et expire bientôt, et seul le dernier lien que vous avez demandé fonctionne. S'il ne fonctionne plus, demandez-en un nouveau dans l'application. | Réinitialisation de votre mot de passe pour la boussole électorale · Ouvrez ce lien pour vous connecter et définir un nouveau mot de passe : · Définir un nouveau mot de passe · …demandez-en un nouveau avec « Mot de passe oublié ? » dans l'application. · …Votre mot de passe n'a pas été modifié. |
| `lb` | De Link funktionéiert eemol a leeft geschwënn of, an nëmmen deen neiste Link, deen Dir ugefrot hutt, funktionéiert. Wann en net méi funktionéiert, frot an der Applikatioun en neien un. | Äert Passwuert fir de Wal-Kompass zrécksetzen · Maacht dëse Link op, fir Iech unzemellen an en neit Passwuert festzeleeën: · Neit Passwuert festleeën · …frot an der Applikatioun mat „Passwuert vergiess?“ en neien un. · …Äert Passwuert gouf net geännert. |
| `sv` | Länken fungerar en gång och upphör snart att gälla, och bara den senaste länken du har bett om fungerar. Om den inte längre fungerar kan du be om en ny i applikationen. | Återställ ditt lösenord till valkompassen · Öppna den här länken för att logga in och ställa in ett nytt lösenord: · Ställ in ett nytt lösenord · …kan du be om en ny med ”Glömt lösenord?” i applikationen. · …Ditt lösenord har inte ändrats. |

That is 36 strings: six sentences of the sign-in mail and thirty parts of the recovery mail. In each locale the recovery mail's fourth part begins with the same sentence as the sign-in mail's and its last part begins with the sign-in mail's last sentence; the table shows where they differ. The whole of each is in `mailTemplates.ts` and in the todo.

How they were constructed: "password" is each catalogue's `common.password`; "set a new password" follows `contestantApp.resetPassword.createNewPassword`; the control's name is `contestantApp.login.forgotPassword`, quoted; "in the application" uses the word the catalogue already uses for the application; the quotation marks follow each language's convention as I understand it, not a source.

Met while reading the catalogues, and not changed:

- **Estonian uses two words and two forms of address for the same thing.** `contestantApp.login.forgotPassword` is "Unustasite salasõna?" (formal, *salasõna*); `common.password`, the reset page and the mails say *parool* and address the reader informally. The mail quotes the label as it is.
- **The Swedish `common.login` and `contestantApp.login.title` read "Registrera dig".** The mails say "logga in". Already named in the todo.
- **The French and Luxembourgish `contestantApp.login.haveRegistrationCode` are in English.**

The todo `2026-10-07-174-native-speaker-review-sign-in-mail.md` has a section dated 2026-10-12 with all 36 strings in full and five points for the reviewer. It stays pending.

## The gate rows

**`tests/e2e-runs/178-gates/178-06-db`, head `e961ee3b7`** — `178-verdict.mjs gates … --rows db-reset,types-regen,types-clean,pgtap,sql-lint,integration`: **PASS**, six expected and six recorded, not stale, no Sleep entry in the window.

| Row | Status | Seconds |
|---|---|---|
| db-reset | 0 | 29 |
| types-regen | 0 | 2 |
| types-clean | 0 | 0 |
| pgtap | 0 | 6 |
| sql-lint | 0 | 3 |
| integration | 0 | 4 |

**`tests/e2e-runs/178-gates/178-06-close`, head `ea52187bb`** — `… --rows typecheck,lint,unit,format`: **PASS**, four expected and four recorded, not stale, no Sleep entry in the window.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 21 |
| lint | 0 | 48 |
| unit | 0 | 76 |
| format | 0 | 20 |

A third run, `tests/e2e-runs/178-gates/178-06-pre-reset` at head `8535cc70f`, holds the `db-reset` row alone, status 0 in 30 s (*Deviations* 4).

No full E2E run, so no totals, no per-project comparison and no axe finding: no surface changed. The predecessor label for the next full run is still **`178-05-close`**.

## Decisions Made

- **P1 held → the first branch**, as above. Read, not chosen.
- **The grant-holder test lifted**, as above. The plan left both forms open.
- **An invitation earns the sign-in mail through its `email` column only**, as above.
- **Items PL-08, PL-13 and U-24** were read by the operator on 2026-10-11 and stand at their recommended options: the census grows by one public function, the names are `recovery_link_request`, `RECOVERY_MAIL_TEMPLATES` and `renderRecoveryMail`, and the recovery mail has five parts with both mails saying that only the newest link works. Recorded, not chosen.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] File 07 had no list the new function could join**
- **Found during:** Task 1
- **Issue:** The plan has the census of `07-rpc-security.test.sql` gain `recovery_link_request` "in the form the other service-role-only invitation functions have", and its verify searches file 07 for the name. Those functions have no form there: section 8c lists the definer functions that `anon` can execute and those `authenticated` can, and a function revoked from both is in neither list. The six invitation helpers are not named anywhere in the file.
- **Fix:** A third census in section 8c: the definer functions of `public`, trigger functions and `test_` helpers apart, that `service_role` can execute and neither API role can. The list was read from the reset database (eight names) and the new function added. The section's comment and the file's header say what the third census catches.
- **Consequence for later plans:** a new SECURITY DEFINER function of `public` that only the service role may execute now fails this census until it is added by name. That is the section's stated purpose; before, such a function passed unnoticed.
- **Files modified:** `apps/supabase/supabase/tests/database/07-rpc-security.test.sql`
- **Verification:** red on its expectation in the red run (test 21), green after the schema
- **Committed in:** `e53af9996`

### Other departures, none of them a fix

2. **A name the rules' table does not hold: `private.email_holds_grant_in_project`.** The plan allows the lift and names nothing for it.
3. **Both red runs were made over a stand-in.** The pgTAP one over `public.recovery_link_request` as a one-line function returning `NULL::jsonb`, created directly in the local database and dropped after the run (`178-06-pgtap-red.sh` checks before that neither function exists and after that none is left); a call of a function that does not exist raises and the file errors instead of failing. The unit one over a recovery record of blank templates appended to `mailTemplates.ts` in the working tree and removed by `git checkout --` before the real module was written; a missing export would have failed the file at collection. Neither stand-in was ever staged.
4. **One gate run the plan does not list: `178-06-pre-reset`, the `db-reset` row alone, on the clean tree before any edit.** The database had been used by the full run `178-05-close`, on which test 238 of file 39 is red; the reset kept that known finding out of the red run. It went through the gate driver, with its in-flight check.
5. **`yarn db:reset`, `yarn db:types` and pgTAP were each run once directly**, on the uncommitted schema, as Task 2 step 2 lays out and the gate driver cannot do; the in-flight check was made first by `178-06-inflight-check.sh` (451 `started` markers, each with an `ended`; nothing on 5273; 15.86 GiB).
6. **Tests beyond the plan's list.** File 39: the control request in project B, the claim sequence, the mode-on-again request, the grant holder under a switched-off mode, the catalogue row of the grant-holder test. `mailTemplates.test.ts`: "has five parts, none of them blank"; "names no sign-in page" for both English mails; the two mails' subjects differ in every locale; and the recovery mail of each locale holds, once in its text and once in its html, the label read from that locale's `contestantApp.login.json`.
7. **`count` in `mailTemplates.test.ts` became a function declaration.** ESLint's `func-style` names the arrow form, at this plan's base as well; see *Issues Encountered*.
8. **The reading named in the plan's `<context>` was kept short.** Of `178-RESEARCH.md` I read the RQ-1 row and not § *Pattern 5* or § *Pitfall 5*; of `178-PATTERNS.md` the two named paragraphs of § *Schema* and not the templates' paragraphs; of `178-UI-SPEC.md` § *The mails* and § *Sentences that will not survive translation as written*. The plan's own text carried the rest.
9. **`.planning/WINDOWS.md` was not written to.** No stub, no skipped test, no verify that was not run.

---

**Total deviations:** 1 auto-fixed (1 blocking), 8 other departures
**Impact on plan:** The census is the one change that reaches past this plan: it tightens file 07 for every later plan that adds a service-role function. Nothing else changes scope.

## Issues Encountered

- **The lint gate does not read the Edge Functions' directory.** `yarn eslint` on `mailTemplates.test.ts` as it stood at this plan's base reports one `func-style` error, yet the `lint` row was green before and is green now: `apps/supabase` has no `lint` script, and the root `lint:check` lints `tests` and the workspaces that have one. There is no `tsconfig.json` under `apps/supabase` either, so the `typecheck` row does not read these files. I ran `eslint` on the two files myself (0) and type-checked them once with a workspace's compiler under ad hoc flags (0). Not fixed: a gate's reach is not this plan's.
- Nothing else. No gate set was running while a file of the tree was edited: every marker was waited for.

## The code-review checklist

| Item | Outcome |
|---|---|
| Solves the issue | partly, as planned: the eligibility rule and the mail's text exist; the operation that uses them, and so FIX-01 as a user meets it, is plans 178-07 and 178-19 |
| OWASP top 10 | A01: the function is executable by the service role alone, asserted three ways, and in a census. A04: the three outcomes are one function's answers and none is a reason; no slot, user, grant or invitation column is written for an address no mail goes to, asserted. A07: one mail per address per project per minute across both kinds of request, asserted in both orders. A03: the mail's only inserted value is the link, HTML-escaped in the html part, through a replacer function; both asserted for both mails |
| Code style guide | followed; one arrow-function helper in the touched test became a declaration |
| No `any` | none added |
| No repeated code | the grant-holder test is one function with two callers; the two renderers share one private `render`. The five-part form of the two mails is one `template(…)` |
| New entities documented | SQL headers on both functions in the file's form; TSDoc on `RECOVERY_MAIL_TEMPLATES`, `renderRecoveryMail`, `render` and the test's helpers |
| Repo documentation updated | **no — see "For later plans"**: the database skill and its reference have no row for the two functions and state six helpers; none is in this plan's files |
| Tracking events | not applicable |
| Svelte component guidelines | not applicable: no component |
| Errors handled and logged | a refusal is an answer: SQL null. The function raises nothing of its own |
| Failing checks | none at the close |
| Dependents not unduly affected | `invitation_link_request`'s own assertions are green without a changed expectation; the writer's integration test is green; `linkIssue.test.ts` and `signInLink.test.ts`, which import the mail module, are green (534 of 534) |
| WCAG, keyboard, screen reader | not applicable: nothing rendered changed. The mail's html part keeps one anchor with a text label |
| Developers' and Publishers' guides | as "Repo documentation updated" |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit; every touched comment read; no id of a decision, plan, item or probe row in a comment or a title |
| Commit history | three commits, one per task, none a fix of another |
| Formatting separate | no formatting-only change; the formatter touched only lines these commits wrote |
| `[db]` tag | on `e961ee3b7` |
| Supabase backend: definer functions pin `search_path = ''` and qualify calls | yes, asserted for `recovery_link_request`; the private function pins it too |
| Supabase backend: pgTAP in `BEGIN`/`ROLLBACK` over `create_test_data()` | yes, both files |
| Supabase backend: assertion patterns | `is` for answers and catalogue readings, `lives_ok` for the release, `throws_ok` for the two refused roles |
| Edge Functions: authority asked of the database | the eligibility rule is in the database and the function's module holds text only; `index.ts` is untouched |
| Supabase adapter | not touched |

## Observed, and inferred

- **Observed:** both red runs and what each failure was; pgTAP green on a reset database twice, once directly and once in the driver; the two functions' catalogue rows; all eleven gate rows of the three runs; the three verify blocks; the mail suite at 142 and the functions' suite at 534.
- **Observed at the database, not through the Edge Function:** every answer of `recovery_link_request`. Nothing calls it yet.
- **Inferred, not observed:** that the stack probe's `request-recovery` leaves nothing behind (from the assertion on an address the project knows nothing of); that a mail rendered from these templates arrives as written (no mail was sent; the running edge runtime still holds the module as it was when the stack started); that `invitation_link_request` is unchanged in every case its assertions do not cover.
- **Not judged by anyone who could:** the six non-English texts.

## Not done, or not verified

- Nothing of the plan is undone.
- **No E2E run**, by ruling 5. `178-07-close` is the first full run over this schema and these templates.
- **The `stack` row was not run.** The function's source in the tree now differs from what the running edge runtime serves, in `mailTemplates.ts` only; `contract.ts` is unchanged.
- **The stack was not restarted.** The reworded sign-in sentence is served only after plan 178-07's restart.
- **`check-frontend` and `build` were not run**: the plan's closing rows do not include them and no frontend file changed.
- **Documentation was not updated** (below).

## The state the local stack is left in

Up; not restarted. The database was reset three times by this plan (the driver's row before the red run, once directly on the uncommitted schema, the driver's row at `178-06-db`), then seeded with the default dataset: 2 auth users, 0 invitations, 2 projects, 0 rows in `private.invitation_link_witness`, 0 in `private.invitation_throttle`. No E2E run has touched it since the last reset, so pgTAP test 238 of file 39 is green on it. The stub of the red run is gone (dropped, and two resets since). Nothing listens on the E2E port 5273 and no `started` without an `ended` is under `tests/e2e-runs/` (451 read). Docker VM free space: 15.86 GiB at this plan's last own reading, before the direct reset. Power: AC throughout, 100 %.

## For later plans

- **Predecessor label for the next full run: still `178-05-close`** (444 tests, 116 projects). This plan made none.
- **178-07 — calling the function.** `rpc('recovery_link_request', { p_project_id, p_email })` as the service role; the generated type is `Returns: Json`. The answer is SQL null or `{ email, mail }` with `mail` exactly `'recovery'` or `'sign-in'`; `email` is the address trimmed and lower-cased, and it is the address to mail. A non-null answer has taken the address's slot: send exactly one mail of that kind, or call `invitation_link_release(p_project_id, p_email)` — the release that exists, with no code — when none is handed over.
- **178-07 — `sign-in` is for an address that may have no account.** The address has an open invitation and perhaps no user yet, so that arm needs what `request-link` does for a first-time invitee before a link can be minted. `recovery` is always an existing, confirmed account.
- **178-07 — the texts.** `renderRecoveryMail(locale, link)` returns `{ subject, text, html }` as `renderSignInMail` does; the locale type is still `SignInMailLocale`. `RECOVERY_LINK_EMAIL_SUBJECT` in `tests/tests/utils/invitationConstants.ts` already equals the English subject.
- **178-07 — the stack probe needs no cleanup of throttle rows** for its fresh recovery address: an address with no account and no invitation takes no slot. If the probe ever asks for an address that is eligible, it then holds a `link:` key for a minute.
- **178-07 — the `stack` row turns red with your own commit that adds `'request-recovery'` to `contract.ts`**, not before: this plan did not add it. The sign-in mail's reworded sentence is in the tree and not served until your restart.
- **Any plan that adds a SECURITY DEFINER function to `public` for the service role alone** (178-20, if `send_email_hook` is a definer function the service role can execute): add its name to the third census of `07-rpc-security.test.sql` section 8c, or revoke the service role's EXECUTE. A function whose name begins `invitation_` also moves two expectations of Section 21 of file 39.
- **Any plan that rewords, moves or removes `contestantApp.login.forgotPassword`** (178-13, 178-18, 178-23): `mailTemplates.test.ts` reads that key from all seven catalogues and requires each locale's recovery mail to hold the label once in its text and once in its html. Change the mail's fourth part in the same commit, or re-point the test at the key the control then reads.
- **178-10, 178-13, 178-19 — "only the newest link works" is now what both mails say**, in the words "only the newest link you asked for works"; a screen's sentence can say the same.
- **178-19 — a mail's body can be asserted only after the stack has been restarted**; until plan 178-07's restart the running function sends the earlier sentence.
- **pgTAP counts now:** 45 files, 2431 assertions; file 39 is `plan (329)`, file 07 `plan (40)`.
- **178-23 — documentation this plan made out of date, none of it edited:**
  - `.claude/skills/database/SKILL.md`: § 10 names six helpers behind `account-access` and says nothing of the recovery request or of the shared slot; § 4 describes two censuses of section 8c, now three; Service Patterns § 1 on `account-access`; the pgTAP counts.
  - `.claude/skills/database/schema-reference.md`: no row for `public.recovery_link_request` or `private.email_holds_grant_in_project`; the row of `invitation_link_request`; the description of a `link:` key.
  - `.claude/skills/database/rls-policy-map.md`, where it lists the service role's helpers.
  - The `apps/docs` pages `developers-guide/backend/authentication` and `backend/edge-functions`, and `apps/supabase/README.md` where it lists the invitation functions.
- **Outside this phase's plans, for whoever owns the gates:** the `lint` and `typecheck` rows do not read `apps/supabase/supabase/functions`.
- **Timing on this host today:** the red pgTAP run 4 s, the six database rows 44 s, the four closing rows 2 min 45 s.

## Prohibitions

| Id | Statement | Held | How |
|---|---|---|---|
| PROH-178-16 | the recovery decision never answers differently in a way a caller of the Edge Function could observe | yes, as far as this plan reaches | the three outcomes are the answers of one function no API role can execute (asserted in file 39 and in the census); it returns no reason, user id, grant or name; a refusal writes nothing. The uniform answer returned before the work is plan 178-07's to build; judged, not observed |
| PROH-178-17 | no mail text states a duration, a name, an address, the project's name or a caller's sentence, and no template promises a page or control a project's settings can remove | yes | the completeness cases forbid a digit and an `@` in every part of every template of both mails, and any marker but the link's; the function takes a project and an address and nothing else (asserted signature); the sign-in mail names no page, asserted for English and built so in all seven; the recovery mail names the forgot-password control, which whoever receives that mail has just used |
| PROH-178-18 | the six non-English texts are constructed, never described as translated by a native speaker, and the review todo is extended, not closed | yes | said so here, in the commit's message and in the todo's new section; the todo is in `pending/` |

## Threat Flags

None. The plan's register covers what was built: one function of `public` for the service role alone, one function in `private`, text in a pure module. No endpoint, table or path for an API role.

## Known Stubs

None. The two stand-ins of the red runs were never committed and are gone.

## Next Phase Readiness

Ready for plan 178-07. The database says which mail a recovery request earns, on the sign-in request's slot and with nothing else written; the mail's text exists in seven locales under the completeness test; the committed tree is green on ten gate rows. The operation that joins the two, the restart that serves it and the first full run over both are 178-07's.

## Self-Check: PASSED

- Commits `e53af9996`, `e961ee3b7` and `ea52187bb` are ancestors of HEAD; `git rev-list --count 8535cc70f..HEAD` was 3 before this file's commit.
- Found on disk: the eight modified files; both gate runs' `summary.tsv`; the two red logs with their exit statuses and the red head.
- Each `must_haves.artifacts` string is in its file (`FUNCTION public.recovery_link_request` — Task 2's verify; `export const RECOVERY_MAIL_TEMPLATES` — Task 3's), and each `key_links` pattern too (`'link:' || p_project_id::text` in file 506; `RECOVERY_MAIL_TEMPLATES` in the test).
- `git status --short` before this file was written: `?? CAND-APP-PLAN.md` and nothing else.
