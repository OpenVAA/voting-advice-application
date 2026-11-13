# Quick task 261010 — the operator's replies F1 (b) and the B2 edit

Written by the orchestrator from the executor's report, 2026-10-10 (the executor's write of this file
was refused by its tool). Source of the task: the operator's replies of 2026-10-10 —
`.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` § F1, option (b), with its closing "Read on
2026-10-10" paragraph, and the two "Operator's … 2026-10-10" blocks of
`.planning/quick/261009-b2-b3-b6-operator-replies/SUMMARY.md`.

## The verdict on F1

**Not reproduced, n = 5.** Five full-suite runs on the reverted tree, each with the host's 1-minute
load average held at a mean of 30.0 to 31.7, were all green: 341 of 341, no failure at the helper's
wait. By the brief's decision rule the wait is left reverted: `registerAndStoreSession` waits the
default five seconds for the URL to leave the login page
(`tests/tests/setup/shared/registerAndStoreSession.ts`, the `not.toHaveURL(/.*login.*/)` wait). The
diagnosis behind `2872bbf9e` remains unconfirmed, and it is not refuted either: see *What the five
runs do and do not show*.

## Commits

| Hash | Subject |
|---|---|
| `b76d994b6` | docs(todos): 12 more constructed sentences of the registry statement for a native reader |
| `453406bca` | fix(i18n): the registry statement says what the identifiers are used for |
| `d01e2a4fa` | docs(todos): four of the six words for the identification number are everyday words |
| `07910ef6f` | docs(todos): the operator's direction for the multiple-text rows at 320 px |
| `3a80c5506` | revert: the sign-in helper's wait to leave the login page is the default again |

Base `87d6a7e89`. Commits of other sessions landed in between and touch `.planning/` only. The tree
outside `.planning/` is the same at `3a80c5506` and at `d228b52bc`, the head of every gate below
(`git diff --quiet`, exit 0).

## Part 1 — section 5 of the registry statement

Key `dynamic.contestantAppPrivacy.registryStatement.content`, seven catalogues.

**Section 5, first paragraph, its last sentence — before**

> For a person who has identified themselves through a bank or another identity provider, the registry
> also stores their date of birth.

**After**

> For a person who has identified themselves through a bank or another identity provider, the registry
> also stores their date of birth or national identification number. These identifiers are not
> disclosed to the public. They are used only to calculate the person's age on the election date and
> to verify their nomination.

The apostrophe is the straight one the message already uses ("individual's", "compass's").

Measured by a script over the seven files against their predecessors (exit 0): one key differs; the 46
tags, the ten headings and the placeholders (`DATA_CONTROLLER`, `DATA_CONTACT_PERSON`, the mail
address, `{appName}`, `DATA_STORAGE_TERM_EG_5_YRS`) are byte-equal; only the fifth of the twelve
paragraphs differs; every word of the old paragraph survives in order; each file is byte-equal outside
the one value. In `lb` the new words go inside the old sentence, whose verb comes last.

The six other locales, each sentence's ending as written:

- **da** — `…fødselsdatoen eller personnummeret. Disse identifikationsoplysninger videregives ikke til offentligheden. De bruges kun til at beregne personens alder på valgdatoen og til at verificere personens opstilling.`
- **et** — `…sünniaeg või isikukood. Neid tunnuseid üldsusele ei avalikustata. Neid kasutatakse üksnes isiku vanuse arvutamiseks valimispäeva seisuga ja tema kandidatuuri kontrollimiseks.`
- **fi** — `…syntymäaika tai henkilötunnus. Näitä tunnistetietoja ei luovuteta julkisuuteen. Niitä käytetään vain henkilön vaalipäivän mukaisen iän laskemiseen ja hänen ehdokkuutensa varmentamiseen.`
- **fr** — `…sa date de naissance ou son numéro d’identification national. Ces identifiants ne sont pas communiqués au public. Ils sont utilisés uniquement pour calculer l’âge de la personne à la date de l’élection et pour vérifier sa candidature.`
- **lb** — `…de Gebuertsdatum oder déi national Identifikatiounsnummer am Register gespäichert. Dës Identifikatiounsdonnéeë ginn net un d’Ëffentlechkeet weiderginn. Si ginn nëmme benotzt, fir den Alter vun der Persoun um Waldatum auszerechnen a fir hir Nominatioun ze verifizéieren.`
- **sv** — `…födelsedatum eller personbeteckning. Dessa identifierande uppgifter lämnas inte ut till allmänheten. De används endast för att beräkna personens ålder vid valets datum och för att verifiera personens nominering.`

Words reused: each catalogue's verb for a disclosure from section 7 of the same statement, its noun
for a nomination (`common.nomination` as the contestant app uses it) and its word for the election
date (`dynamic.info.dateInfo`). No catalogue had a word for a national identification number: `da`,
`et`, `fi` and `sv` use the country's everyday word, which names one country's number; `fr` and `lb`
build one.

**For the native reader:** 2 new sentences in each of 6 locales, 12, and 1 already-listed sentence
extended in each, 6. The todo
`todos/pending/2026-10-09-175-native-speaker-review-organization-editing-strings.md` now counts 36
constructed sentences of the statement where it counted 24, lists the choices and holds each paragraph
as written (compared with the catalogues by script).

Not done: no locale's statement was opened in a browser; no lawyer and no native speaker read it.

### The operator's sentence against the code — read, not observed

Everything in this subsection was read in the source. Nothing was run, no token was decoded and no
row of a running stack was looked at. The statement was not changed on any of it.

What the code does with the date of birth and the Finnish personal identity code:

- **Stored where.** `identity-callback/index.ts` spreads the extracted claims into the auth user's
  `app_metadata` when it **creates** the user: `birthdate` with `signicat-ftn`; `birthdate` **and**
  `hetu` with `idura-ftn` (`claimConfig.ts`, `extractClaims`). They are never written again, and no
  table of `public` holds either.
- **Read by nothing.** No migration, Edge Function, package or frontend file reads
  `app_metadata.birthdate` or `app_metadata.hetu`. The frontend's server extracts the same claims
  (and `country`, with Idura) and hands only the first and last name to the page.

Uses the sentence "used only to calculate the person's age on the election date and to verify their
nomination" does not cover, or names without the code doing them:

1. **Neither named use exists in the code.** Nothing calculates an age from the stored date, and
   nothing verifies a nomination with either value. No function of the application computes an age at
   all. As the code stands the two values are stored and not used; the sentence describes a purpose,
   not a behaviour.
2. **The provider's subject identifier is not covered.** `sub` is kept as
   `app_metadata.identity_match_value` and as the local part of the account's placeholder address
   (`<sub>@bank-auth.placeholder`). It is neither a date of birth nor, as stored, a national
   identification number: for Signicat the code's own note says it is a hash the provider derives from
   the national identity number, for Idura a persistent pseudonym. Its use is matching a returning
   person to their account at sign-in, which is neither of the two named uses. The new text covers it
   in neither respect.
3. **"Date of birth or national identification number"**: with `idura-ftn` both are stored, not one or
   the other.
4. **The name.** The first and last name from the provider create the candidate row, which is public.
   The sentence is about "these identifiers" and does not claim otherwise; it is listed because it is
   the one thing from the provider that the code does publish.

What bears on "not disclosed to the public":

- **Nothing was found that shows either value to another person.** No view, function or policy reads
  `raw_app_meta_data`; the SQL functions that read `auth.users` take the address, the confirmation
  time or whether a password is set.
- **They do travel to the person's own browser.** The auth server puts `app_metadata` into the access
  token, and `custom_access_token_hook` adds the grants to the claims it is given and removes nothing.
  The session cookies are written `httpOnly: false` and are passed to the page as `supabaseCookies`. So
  for a person created through `idura-ftn` the personal identity code would sit in a token that script
  in that person's own browser can read, and that is sent with every request to the API. That is not
  disclosure to the public. It is wider than "stored in the registry" suggests, and it rests on the
  auth server's documented behaviour, not on a token decoded here.
- **The placeholder address carries `sub`.** `resolve_email_variables` reads a user's address to
  address mail; no path was found that shows one user's address to another user. Not followed further.
- **A date of birth a deployment asks for as a question** is a voluntary answer and is published with
  the profile. It is not the provider's value; the statement's list covers it as a voluntary response.

## Part 2 — the 8 px overflow todo

`todos/pending/2026-10-09-175-multiple-text-row-overflows-a-320px-profile-by-8px.md` has a new section,
*The operator's direction, 2026-10-10*, with the two notes in the operator's words:

- Change inputs to render on two rows within narrow containers
- Remove left margin from multiple text inputs (or what looks like a margin)

Under them, marked as the agent's reading and not confirmed: the first is the direction of the todo's
option 2 and says containers, not viewports; "what looks like a margin" is, by the measured boxes, the
transparent language label at 30 to 94 px, which option 1 drops; the direction asks for both.

## Part 3 — F1 (b)

### The revert

`3a80c5506` reverts `2872bbf9e`, with a message that says it is reverted on operator decision F1 (b)
pending reproduction. The line's comment is "Wait for navigation away from the login page". The
Playwright configuration sets no `expect` timeout, so the wait is the default 5 s.

### What failed originally

Read from `176-14-SUMMARY.md` and `tests/e2e-runs/176-e2e/176-14-precommit` (trace kept at
`tests/e2e-runs/176-unit/176-14-precommit-red-trace/`):

- Project `data-setup-entity-selection`, test "register + authenticate as a user whose only grant is
  then removed", `expect(page).not.toHaveURL(/.*login.*/)` in `registerAndStoreSession.ts`.
- **The red run was not a full run.** It ran 223 tests on 6 workers: the `perm-no-nomination` project
  with what it depends on. The decisions file's "one full run" is not what the run directory holds.
- In that shape four sign-ins through the helper start together 11 s into the run, on a dev server
  that has compiled nothing: two of `auth-setup` and two of `data-setup-entity-selection`. They took
  11.1 to 12.9 s.
- In a full run only the two of `auth-setup` start on the cold server. The two of
  `data-setup-entity-selection` start 70 to 120 s in, when the login routes are compiled.

### The load

- **Host:** 14 cores (10 performance, 4 efficiency), `hw.ncpu` 14.
- **Generator:** `tests/e2e-runs/261010-f1-load/load-hold.sh`. CPU burners (one `perl` busy loop each)
  added or removed every 10 s so that the 1-minute average moves toward 31. Whatever else runs on the
  host is counted, so the burners fill what is missing.
- **Measured in two dry runs:** a burner raises this host's average by about two, not one. 10 to 16
  burners with the suite held the average near 30, with the processors 0 to 3 % idle in most samples.
- **Per run:** `uptime` before the load, at the run's start, at its end and after the load was
  stopped (`load-uptime.txt`); the average every 10 s (`load-held.log`); raw `uptime` and the
  processors' idle share once a minute (`load-uptime-minutely.log`); the core count (`load-host.txt`);
  every burner's PID (`load-pids.log`). All in the run directory.
- **Stopping:** three independent ways — a flag file every burner checks, a deadline every burner
  carries, and the controller's exit trap. After every run `pgrep -f F1LOAD261010` found nothing
  (`load-stopped.txt`).

### The five loaded full-suite runs

All through `176-e2e.sh <label>` (the wrapper with `--no-db-reset`), under
`tests/e2e-runs/176-e2e/`. Tree outside `.planning/`: `3a80c5506`'s in every run. AC power, no Sleep
entry in any window, no void marker.

| Run directory | 1-minute load in the window: min / mean / max | Samples at 25 or more | Burners, mean | Exit | Totals | What failed |
|---|---|---|---|---|---|---|
| `261010-f1-loaded-1` | 21.0 / 30.5 / 37.5 | 62 of 69 | 12.3 | 0 | 341 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run | nothing |
| `261010-f1-loaded-2` | 23.6 / 31.7 / 47.7 | 60 of 65 | 10.8 | 0 | 341 / 0 / 0 / 0 / 0 | nothing |
| `261010-f1-loaded-3` | 25.2 / 31.2 / 42.5 | 65 of 65 | 11.1 | 0 | 341 / 0 / 0 / 0 / 0 | nothing |
| `261010-f1-loaded-4` | 24.0 / 30.7 / 37.5 | 60 of 61 | 10.4 | 0 | 341 / 0 / 0 / 0 / 0 | nothing |
| `261010-f1-loaded-5` | 23.4 / 30.0 / 36.8 | 55 of 59 | 10.8 | 0 | 341 / 0 / 0 / 0 / 0 | nothing |

113 projects each. Each run took 10.1 to 11.4 minutes of Playwright time, against 8.4 unloaded.

**By the decision rule: not reproduced in 5 loaded runs.** The wait stays reverted. No longer wait was
re-applied, so there were no confirming runs and nothing is confirmed about the fix.

### What the five runs do and do not show

Whole-test durations of the sign-in setups, in seconds (`results.json`; the wait's own share of a
passing test is not recorded):

| Run | `auth-setup`, on the cold server | `data-setup-entity-selection` |
|---|---|---|
| `176-14-precommit` (the red run) | 12.9, 11.1 | 11.2, **12.6 failed** — on the cold server too |
| `261009-b2-b3-b6-final` (unloaded, yesterday) | 5.4, 5.3 | 2.7, 1.7 |
| loaded-1 | 10.8, 10.4 | 3.5, 2.3 |
| loaded-2 | 7.0, 7.0 | 6.7, 9.2 |
| loaded-3 | 14.4, 14.7 | 1.7, 1.9 |
| loaded-4 | 7.3, 7.2 | 1.7, 1.8 |
| loaded-5 | 6.8, 7.0 | 3.1, 3.8 |

- **Shown:** under a held average of 30 the cold sign-ins of a full run take 1.3 to 2.8 times their
  unloaded time, longer in loaded-3 than in the red run, and the helper's five-second wait held in all
  ten of them and in the ten warm ones.
- **Not shown:** how close the wait came. A passing test keeps no trace, so the wait's duration in
  these runs is unknown.
- **Not shown:** that the red run's condition was met. It had four sign-ins on the cold server at
  once; a full run has two. And its load came from other sessions' work — an editor's indexer, a
  second dev server — not from processor-bound loops; what that load did to the disk or to the dev
  server's compiling was never recorded and is not imitated here.

### Two more loaded runs, in the red run's own shape — outside the five

Because the red run was a slice, two runs were made as `176-e2e.sh <label> --project
perm-no-nomination` under the same load. They are not counted in the verdict above, and nothing was
changed on their result. The intent was up to five; the session ended at two when the host was put to
sleep (see *The host*).

| Run directory | Load: min / mean / max | Exit | Totals | What happened |
|---|---|---|---|---|
| `261010-f1-slice-1` | 25.3 / 30.9 / 38.7 | **1** | 267 total: 73 passed, **1 failed**, 193 did not run | **Red on something else.** The four cold sign-ins passed (4.3 to 5.5 s). |
| `261010-f1-slice-2` | 23.5 / 28.2 / 33.0 | **8** | void | `VOID-host-suspend.txt`: a 6.3 s gap at 08:15:04Z, the lid closed. Not evidence; not remade. Its four sign-ins had passed (4.6 to 5.2 s) before the gap. |

**The red run, `261010-f1-slice-1`** — recorded, not diagnosed, not fixed, not repeated:

- **Test:** `voter-journey` › "full voter journey end-to-end", in
  `tests/tests/specs/voter/voter-journey.spec.ts` (`expectCategoryIntroAndAdvance`).
- **Error:** `expect(locator).toHaveText(expected)` on `voter-questions-category-intro`, timeout
  2000 ms (`TIMEOUTS.element`): expected `/Opinion Questions for Regional Elections Only/i`, received
  "[qg-opin-opt-b-Skipped] Optional Opinion Questions B  1 question" in all 21 polls. The heading of
  the category before was still on the page two seconds after the step that should have advanced it.
- **When:** the test ran 08:08:04Z to 08:08:28Z, starting 6 s into the run on the cold dev server,
  beside the four sign-ins.
- **No void marker; the largest heartbeat gap of the run was 73 ms.** By the rule it is a failure.
- **The host's log has one entry inside the test's window:** 11:08:15 local, "Entering DarkWake state
  due to 'Idle Sleep'", on AC power. Whether it slowed anything is not known.
- **Kept:** trace, video and error context under
  `tests/e2e-runs/176-e2e/261010-f1-slice-1/kept-playwright-results/`.
- **Not known:** whether the cause is the load, the DarkWake entry, both or neither. One occurrence.
  The same test passed in all five loaded full runs, where it starts about 50 s in, and in `slice-2`
  (38.9 s, started 5 s in).
- **Filed by the orchestrator** as
  `todos/pending/2026-10-10-voter-journey-category-intro-red-under-load-on-a-cold-server.md`.

### The host

- 07:05Z to 08:10Z: AC power. The six runs of that span were **not** started under `caffeinate`,
  which the phase's execution rules ask for; the five full runs logged no Sleep entry, `slice-1` the
  one above.
- 08:11Z: `slice-2` started under `caffeinate -dimsu`. At 08:14:49Z the lid was closed and the power
  disconnected ("Clamshell Sleep"); the wrapper ended the run as void.
- 08:15Z to 11:52Z: the host slept. The executor's session was also cut by a connection error and
  was resumed by the orchestrator.
- From 11:52Z: awake, **on battery**. Part 4 ran on battery, 100 % falling to 85 %, under
  `caffeinate`.
- After the last loaded run and again before and after Part 4: `pgrep -f F1LOAD261010` empty, no
  controller, no listener on the wrapper's port. `uptime` at 11:53Z: 8.9, 14.4, 21.8; at 12:08Z:
  5.7, 8.9, 14.8.

## Part 4 — closing gates, unloaded

All on `d228b52bc`, whose tree outside `.planning/` is `3a80c5506`'s. Each status read from its own
file: `tests/e2e-runs/176-gates/261010-f1-b2-final/summary.tsv` and
`tests/e2e-runs/176-e2e/261010-f1-b2-final/exit`. Battery power; no Sleep entry in either window; the
load generator dead.

| Gate | Exit | Detail |
|---|---|---|
| `yarn lint:check` | 0 | |
| `yarn format:check` | 0 | |
| `yarn test:unit` | 0 | 25 tasks, 0 cached; frontend 3575 passed, 20 skipped |
| `yarn build` | 0 | 14 tasks, 0 cached |
| `yarn workspace @openvaa/frontend check` | 0 | 2808 files, 0 errors, 0 warnings |
| full E2E, `176-e2e.sh 261010-f1-b2-final` | 0 | 341 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, 113 projects; 11:57:10Z to 12:06:22Z; no void marker |
| per project against `261009-b2-b3-b6-final` | — | 113 compared, 0 different |

The gate rows ran through `176-gates.sh --rows lint,unit,check-frontend,build,format`, which sets
`TURBO_FORCE=true`.

## Not measured

- The duration of the helper's wait in any passing run.
- The red run's condition as it was: four cold sign-ins at once under the load of other sessions.
  Two runs of that shape were made; one is red on another test and one is void.
- Anything about the statement on a running stack: no token decoded, no `auth.users` row read, no
  locale opened in a browser.
- Whether a real identity provider sends `hetu`; the code extracts it when it is present.
- The six translations, by a native reader; any text of the statement, by a lawyer.
- Whether the DarkWake entry of `slice-1` slowed the host.

## Departures from the brief

1. **Two loaded runs beyond the five**, in the red run's shape, because the record showed the red run
   was a slice. They decide nothing and changed nothing. Cut short at two of an intended five.
2. **`slice-2` is void and was not made again.** The host was asleep, and the orchestrator's
   instruction on resuming was to finish.
3. **The runs went through `176-e2e.sh`**, so their directories are under `tests/e2e-runs/176-e2e/`.
   The load records are copied into each; the launchers and the dry runs are in
   `tests/e2e-runs/261010-f1-load/`.
4. **The first six loaded runs were not under `caffeinate`.**
5. **Part 4 ran on battery.** The brief asks for AC power; the host had been unplugged.
6. **The todo commit `b76d994b6` precedes the catalogue commit `453406bca`** it describes: a shell
   chain broke between them. `d01e2a4fa` corrects a count in the todo that the same break left wrong.
7. **The load was held at a mean of 30 to 32, not at 30 throughout.** Single samples range from 21.0
   to 47.7; 302 of 319 samples of the five windows are at 25 or more.
8. **This file was not written by the executor:** its tool refused the write.

## Left with the operator and the orchestrator

- **F1:** the wait is at the default five seconds and the cause of the red run is still unconfirmed.
  Phase 177's pre-commit runs are slices of the red run's shape. Whether five green full runs are
  enough for a phase to rely on the helper, or whether slice-shaped loaded runs on AC power should
  come first, is not decided here.
- **`voter-journey`, `expectCategoryIntroAndAdvance`:** one red loaded run, cause unknown, trace kept.
- **The statement:** whether it should say that the two values are stored and not yet used, name the
  provider's subject identifier and its use, and say "and" where `idura-ftn` stores both. And whether
  the personal identity code should be in `app_metadata`, which the session token carries, at all.
