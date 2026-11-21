---
phase: 178-sign-in-email-code-registration
plan: 10
subsystem: frontend
tags: [svelte5, components, radio-group, countdown, aria-disabled, live-region, contestant-context, runes, vitest, contestant-app]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-08: the flow module ($lib/contestant/entryFlow), the message keys of contestantApp.emailSent and contestantApp.register.modes, the registry's test ids, the writer's requestPasswordRecovery; plan 178-09: the field pattern and the component-test form; plan 178-01: the gate driver and the verdict script"
provides:
  - "RegistrationModeSelector: native radios in a fieldset named by its legend, the chosen mode's panel (a snippet) under its radio and nowhere else; export focusFirst()"
  - "EmailSentPanel: the 'email sent' body — fixed sentences by wording, the typed address as text, a polite status region"
  - "EmailSentResend: a 'Send again' button that is aria-disabled and still a tab stop while seconds are left or a request is in flight, with the line that counts"
  - "ResendCountdown: a rune class computing the seconds from the settlement time and the clock; status 'requested' and 'ready'"
  - "Contestant context: entryFlow (reactive accessor), holdEntryCode, sendEntryLink, resendEntryLink, clearEntryFlow, and the forwards checkInvitationCode, requestSignInLink, requestPasswordRecovery"
  - "Two rows of the contestant component library's README; the regenerated listing with three new pages (111 to 114 components)"
affects: [178-13, 178-14, 178-15, 178-16, 178-17, 178-18, 178-19, 178-21, 178-22, 178-23]

actuals:
  tokens: 25863
  tasks: 3
  commits: 4
plan_head_before: 2e0c725e4d6dd5c2f463301b7e76745f4d318d34
plan_head_after: e67a4bfc6479172dac3c7d1f6b24f83f85b654a9

tech-stack:
  added: []
  patterns:
    - "A one-of-many selector renders its panel from a caller's snippet inside an {#if} on the chosen value, so a closed panel is not in the document; what a panel's field holds lives in the caller's state"
    - "A button that must keep focus while unavailable is aria-disabled with a guarded handler, never natively disabled: Button's own loading and disabled forms set the native attribute and tabindex -1"
    - "A count is a rune class holding the present time as $state, refreshed by an interval and on visibilitychange; the seconds are a pure function of two times, and the status changes only in the clock reading that sees the count reach 0"
    - "Flow state on a context is a private $state.raw field replaced whole by a few arrow-field methods and read through a getter-only prototype accessor"
    - "A request whose outcome no screen may read is awaited through settledOrBounded over an async wrapper, so a synchronous throw, a rejection, a fulfilment and no answer all resolve alike"

key-files:
  created:
    - apps/frontend/src/lib/contestant/components/registrationModeSelector/RegistrationModeSelector.svelte
    - apps/frontend/src/lib/contestant/components/registrationModeSelector/RegistrationModeSelector.type.ts
    - apps/frontend/src/lib/contestant/components/registrationModeSelector/index.ts
    - apps/frontend/src/lib/contestant/components/registrationModeSelector/RegistrationModeSelector.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentPanel.svelte
    - apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentPanel.type.ts
    - apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentResend.svelte
    - apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentResend.type.ts
    - apps/frontend/src/lib/contestant/components/emailSentPanel/resendCountdown.svelte.ts
    - apps/frontend/src/lib/contestant/components/emailSentPanel/index.ts
    - apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentPanel.svelte.test.ts
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/{emailSentPanel/EmailSentPanel,emailSentPanel/EmailSentResend,registrationModeSelector/RegistrationModeSelector}/+page.md
  modified:
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/README.md
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md

key-decisions:
  - "EmailSentResend does not use Button's loading prop: that prop sets the native disabled attribute and tabindex -1, which drops the focus the button holds. In flight the button reads t('common.loading'), is aria-disabled and aria-busy, and shows no spinner"
  - "RegistrationModeSelector's rest props are the attributes of a fieldset, the element they reach, not of a div; with fewer than two modes no element carries them"
  - "With one mode RegistrationModeSelector does not write selected: the page reads the one mode from its own list"
  - "#entryFlow is $state.raw: the held object is replaced whole on every write and is not a deep proxy; entryFlow is readonly on the type and has no setter"
  - "sendEntryLink keeps the held code only when the request is made with that same code; any other request replaces the whole flow"
  - "A link request with neither an address nor a code calls no writer method, and still settles and is held like any other"
  - "ResendCountdown answers 0 seconds while there is no settlement time, and also reads the clock on visibilitychange"
  - "The status of ResendCountdown is set in the clock reading that sees the count go from above 0 to 0, not derived, so it does not flip to ready while a pressed request is in flight"

patterns-established:
  - "A red-first run over a class is made with inert stand-in members inside the class, replaced before anything is committed"
  - "A component-test mount helper that takes several components types its parameter as Component<never>"

requirements-completed: [REG-03, REG-10, REG-09]

coverage:
  - id: D1
    description: "RegistrationModeSelector: one fieldset named by its legend, a native radio per listed mode under the name registrationMode in the order given, none chosen on arrival; the chosen mode's panel is the only panel in the document; one mode renders its panel directly and no mode renders nothing; a group error is an alert named as the fieldset's description and is cleared by a choice; no role, tabindex or form is added; focusFirst()"
    requirement: REG-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/components/registrationModeSelector/RegistrationModeSelector.svelte.test.ts — 23 cases; red over a stand-in (178-10-t1-red.log, 21 of 23 failed, each on an expectation), green after"
        status: pass
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-10-t1-verify.sh — exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "ResendCountdown: 65 at the settlement, 1 at 64 999 ms, 0 and ready at 65 000 ms; right after a jump of the clock; starts again from a new settlement; status nothing at first, requested on markRequested(), ready when the count ends, unchanged while it runs and while a request is in flight"
    requirement: REG-10
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentPanel.svelte.test.ts — 15 cases of the class under a fake clock"
        status: pass
    human_judgment: false
  - id: D3
    description: "EmailSentPanel and EmailSentResend: the sentence of each wording, the address block only with a typed address and rendered as text, the asked-again sentence, one polite status region with two messages; a button that is aria-disabled, never natively disabled and still a tab stop while seconds are left or loading, described by a line that is not live, and that calls onresend once when available"
    requirement: REG-10
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentPanel.svelte.test.ts — 20 cases of the two components; the file's red run over stand-ins (178-10-t2-red.log, 33 of 35 failed, each on an expectation), green after"
        status: pass
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-10-t2-verify.sh — exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The contestant context holds the entry flow in a private rune field of the instance: undefined on a new context, never shared by two instances, in no storage, cookie, URL or history state, cleared by clearEntryFlow() and by a logout; sendEntryLink makes the writer call its origin decides, resolves alike on fulfilment, rejection, a synchronous throw and the ten-second bound, holds nothing of the answer, keeps the held code beside a request made with it and marks a request asked again inside 65 seconds of the last settlement; resendEntryLink repeats the held request; the three writer calls are forwarded"
    requirement: REG-09
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts — describe 'contestantContext — the entry flow', 32 cases; red over stand-in members (178-10-t3-red.log, 30 of the 32 failed), green after (107 of 107 in the file)"
        status: pass
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-10-t3-verify-restated.sh — exit 0. The plan's own block (178-10-t3-verify.sh) exits 1 on two stages that misread pre-existing code; see Deviations 2"
        status: pass
    human_judgment: false
  - id: D5
    description: "The committed tree is green on the seven closing gate rows; the README names the new components and the generated listing holds 114"
    verification:
      - kind: other
        ref: "tests/e2e-runs/178-gates/178-10-close — typecheck, lint, unit, check-frontend, build, format, docs-links all 0; 178-verdict gates 178-10-close --rows …: PASS"
        status: pass
    human_judgment: false
  - id: D6
    description: "On a rendered screen: the arrow keys move and choose among the modes and Tab goes from the group to the open panel's field; 'Send again' is announced as unavailable with its line as the reason, keeps focus when pressed, and the status region is spoken on a press and when the count ends; the count outlasts the server's minute"
    verification: []
    human_judgment: true
    rationale: "No screen renders the components yet and no browser has run them. The components' halves are unit cases (one radio name, no tabindex, document order, aria-disabled with tabindex 0, the region's text). The screens are plans 178-13 to 178-16 and 178-19, the scans and phone widths 178-21 and 178-22, the resend against the server's slot 178-17, and whether a page's clock can drive the count 178-12."

duration: 21min
completed: 2026-10-12
status: complete
---

# Phase 178 Plan 10: The Registration-Mode Selector, the "Email Sent" Body with Its Resend Control, and the Entry Flow's State on the Contestant Context — Summary

**Three new components and one rune class of the Contestant App's own library — a native-radio selector that keeps only the chosen mode's panel in the document, the "email sent" body, and a "Send again" control that is unavailable yet keeps focus while a count computed from the request's settlement runs — and, on the contestant context, a private per-instance field for the flow with one method that sends a link request and tells its caller nothing of the outcome. Nothing renders or calls any of it yet.**

## Read this first

- **Everything is green, and one commit is a fix of the one before it.** Four commits for three tasks. Task 2's commit `f7212f546` went in with 20 `svelte-check` errors, all in the new test file's mount helper, because my commit script read `svelte-check`'s status through a pipe. `ff7c4d150` fixes the helper's type; no component changed. See *Deviations* 1. Every status after that was read from the command itself.
- **Task 3's verify block exits 1 as written, on two stages that misread code older than this plan**; the same chain with those two stages restated exits 0. See *Deviations* 2. Tasks 1 and 2's blocks exit 0 as written.
- **"Send again" has no spinner while a request is in flight.** `Button`'s `loading` prop sets the native `disabled` attribute and `tabindex="-1"`, which the plan forbids for this button and which would drop its focus. The control reads "Loading…", is `aria-disabled` and `aria-busy`, and stays a tab stop. See *Decisions Made*.
- **No E2E run was made**: the plan has none and its commits are additive. The predecessor label for the next full run stays `178-07-close`.
- **Three generated pages outside the plan's `files_modified` are in Task 2's commit**, as in plan 178-09: the generator writes one page per component.
- **Items U-03, U-04, U-14, U-19 and U-20 were read by the operator on 2026-10-11 and stand at their recommended options**; all five are built so.
- **The assumption of the plan's ruling 6 is still unresolved**: that 65 seconds from a request's settlement outlasts the server's 60-second slot, and that a page's clock can drive the count in a browser test. Neither was run here. Plans 178-17 and 178-12 are where each is met.

## Performance

- **Duration:** about 21 min
- **Started:** 2026-10-12T19:48:12Z
- **Completed:** 2026-10-12T20:09Z
- **Tasks:** 3
- **Files modified:** 19 (14 created, 5 modified)

## Task Commits

1. **Task 1: `RegistrationModeSelector`** — `04c7b4f6a` (feat)
2. **Task 2: the "email sent" body, the resend control and the count; the README and the listing** — `f7212f546` (feat), and `ff7c4d150` (fix: the type of the test's mount helper)
3. **Task 3: the flow state in the contestant context** — `e67a4bfc6` (feat)

## Each task's verify command, with its real exit status

Each `<automated>` block was written byte for byte to `tests/e2e-runs/178-unit/178-10-t<N>-verify.sh` by a script and run with `bash`; its log, exit status and head are beside it.

| Task | Script | Exit | Notes |
|---|---|---|---|
| 1 | `178-10-t1-verify.sh` | 0 | Its unit command has `--`, so the whole frontend suite ran: 215 files passed, 1 skipped; 4445 tests passed, 31 skipped |
| 2 | `178-10-t2-verify.sh` | 0 | Run at head `ff7c4d150`. Whole suite: 216 files passed, 1 skipped; 4480 passed, 31 skipped |
| 3 | `178-10-t3-verify.sh` | **1** | Prints "#reset does not clear the flow state" and "names sessionStorage". Both are the check's own misreadings of pre-existing code (*Deviations* 2) |
| 3 | `178-10-t3-verify-restated.sh` | 0 | The same chain with those two stages restated; ends on the gate verdict: PASS, not stale, no Sleep entry in the run window |

The filtered runs, by a positional path with no `--`: the selector's directory 23 of 23; the email-sent directory 35 of 35; the whole component library 13 files, 186 of 186; `src/lib/contexts/contestant` 2 files, 176 of 176.

## Red before green

Each red-first run was made over inert stand-ins — an empty `<div>` for a component, members that do nothing for a class — so that the test file imports. The stand-ins were replaced before anything was committed.

| Run | Exit | What failed |
|---|---|---|
| `178-10-t1-red` | 1 | 21 of 23, each an assertion. The 2 that passed hold of an empty stand-in too: "has no mode chosen and no panel in the document on arrival" and "puts the radios in no form of its own" |
| `178-10-t2-red` | 1 | 33 of 35, each an assertion. The 2 that passed are the two "calls nothing when it is pressed" cases |
| `178-10-t3-red` | 1 | 30 of the 32 new cases: 29 assertions, and one `TypeError` raised by `expect().resolves` itself because the stand-in forward answered `undefined` where the case expects a promise. The 2 new cases that passed hold of a context that does nothing: "is `undefined` on a new context" and "hold nothing: a direct call leaves the flow as it was". The file's 75 older cases passed |

No failure in any red run was an import, compile or timeout failure.

## The components as built

### `RegistrationModeSelector` — `$contestant/components/registrationModeSelector`

| Prop | Type | Default | |
|---|---|---|---|
| `modes` | `ReadonlyArray<RegistrationMode>` | required | in the order they are shown |
| `selected` | `RegistrationMode \| undefined` | `undefined` | bindable; written only by a choice among several modes |
| `panel` | `Snippet<[mode: RegistrationMode]>` | required | rendered for the chosen mode alone, and directly for a single mode |
| `error` | `string` | — | bindable; cleared when a mode is chosen |
| `id` | `string` | generated | the fieldset's id; the error is `<id>-error` |
| any `<fieldset>` attribute | | | onto the fieldset, `class` merged; a given `aria-describedby` is kept before the error's id |

Export: `focusFirst(): void` (the first radio; nothing with fewer than two modes). Markup with several modes, as the plan's step 2 gives it: `fieldset.flex.w-full.max-w-md.min-w-0.flex-col.gap-lg` › `legend.mb-md.text-center.font-bold` › per mode `div.bg-base-100.rounded-lg[data-testid=register-mode-option][data-mode]` › `label.gap-sm.p-lg.min-h-touch.flex.cursor-pointer.items-center` holding `input[type=radio].radio.radio-primary[name=registrationMode][data-testid=register-mode-input]` and a `span`; then, only for the chosen mode, `div.px-lg.pb-lg[data-testid=register-mode-panel][data-mode]`; then `ErrorMessage inline role="alert" data-testid="register-modes-error"`. The radios are bound with `bind:group`. Reads the component context's `t` and nothing else. No transition, no role, no `tabindex`, no form.

### `EmailSentPanel` — `$contestant/components/emailSentPanel`

| Prop | Type | Default | |
|---|---|---|---|
| `wording` | `EntryWording` (`'signIn' \| 'recovery' \| 'code'`) | required | the first sentence |
| `email` | `string` | — | shown trimmed under "Sent to"; absent or blank shows no address block |
| `askedAgain` | `boolean` | `false` | adds the asked-again sentence |
| `status` | `EmailSentStatus` (`'requested' \| 'ready'`) | — | the status region's text; empty without one |
| any `<div>` attribute | | | onto the root (`flex w-full flex-col items-center`) |

In order: the intro `p.text-center`; with an address the `dl.my-lg.text-center` (`dt.small-label`, `dd` with the address block's classes, `translate="no"`, `email-sent-address`); `newest`; `notFound.withAddress` or `.withoutAddress`; with `askedAgain` the sentence with `email-sent-asked-again`; and `p.sr-only[role=status][aria-live=polite][data-testid=email-sent-status]`, always rendered.

### `EmailSentResend` — same directory

| Prop | Type | Default | |
|---|---|---|---|
| `secondsLeft` | `number` | required | unavailable while above 0 |
| `loading` | `boolean` | `false` | unavailable, reads `common.loading`, `aria-busy` |
| `onresend` | `() => void \| Promise<void>` | required | called once per press while available |
| any `<div>` attribute | | | onto the root (`flex w-full flex-col items-center`) |

A `Button` (`type="button"`, default variant, `email-sent-resend`) with `aria-disabled="true"` while unavailable and `aria-describedby` naming the line while seconds are left; under it, only while seconds are left, `p.small-info.mt-sm.text-center[data-testid=email-sent-countdown]` holding `t('contestantApp.emailSent.resendWait', { seconds })`. The line has no role and is not live.

### `ResendCountdown` — `resendCountdown.svelte.ts`, exported from the same barrel

`new ResendCountdown(settledAt: () => number | undefined)`. Reactive getters `secondsLeft: number`, `ready: boolean`, `status: EmailSentStatus | undefined`; methods `markRequested()`, `start()`, `stop()`. `start()` begins a one-second interval and a `visibilitychange` listener, both ended by `stop()`; a second `start()` does nothing. Everything is a private field of the instance; the module holds no binding.

The barrel also exports the types `EmailSentPanelProps`, `EmailSentResendProps` and `EmailSentStatus`.

## The flow state as built

`#entryFlow = $state.raw<EntryFlow | undefined>(undefined)`, declared beside `#newUserEmail`. Its shape is the flow module's `EntryFlow`: `{ code?: { code, status: 'valid' | 'used' }, request?: { origin, email?, code?, wording, settledAt, askedAgain } }`. A key that has no value is absent, not `undefined`.

| Member | Kind | What it writes |
|---|---|---|
| `entryFlow` | getter-only prototype accessor; `readonly` on the type | — |
| `holdEntryCode(code)` | arrow field | `{ code }` — a held request goes |
| `sendEntryLink(request)` | arrow field, `async` | after the bounded wait: `{ code: <held code>, request }` when the request carries the held code, else `{ request }` |
| `resendEntryLink()` | arrow field, `async` | through `sendEntryLink`, with the held request's origin, address and code; nothing when no request is held |
| `clearEntryFlow()` | arrow field | `undefined` |
| `#reset` | the existing private arrow | `undefined`, beside `#newUserEmail` |
| `checkInvitationCode`, `requestSignInLink`, `requestPasswordRecovery` | arrow fields in the form of `checkRegistrationKey` | nothing: plain forwards to `prepareDataWriter()` |

`sendEntryLink` in order: `askedAgainTooSoon(held request, request, Date.now())`; the writer call, started synchronously through the private `async` `#requestLink` — `requestPasswordRecovery({ email, locale })` for the origin `forgotPassword`, else `requestSignInLink` with `{ email, locale }`, `{ email, code, locale }` or `{ code, locale }`, in the context's locale read at the call; `await settledOrBounded(…)`; then the one write, with `settledAt: Date.now()` of that moment and `wordingOf(request)`. It has no `try`, logs nothing, and keeps nothing of the answer.

The state is assigned in four places (`holdEntryCode`, `sendEntryLink`, `clearEntryFlow`, `#reset`). `#newUserEmail` is untouched in its three places and its one caller.

### The plan's anchors in the context file

None of the anchors the plan names had been moved by Phase 177: `#newUserEmail` is a `$state` field, is cleared in `#reset`, and has a prototype getter and setter. The plan counts "four places" with "the logout wrapper"; the wrapper (`#logout`, reached through the getter `logout`) names the field nowhere — it calls `#reset` after its `goto`. So the flow state is cleared on logout by `#reset`, as the address is. What Phase 177 added to the file since the plans were begun: the forwards `setEntityNominations` and `getNominationParentOptions` with `#selectedEntityTarget`, between the writer forwards and the logout override, and in the test file the `writerBox` seam over `prepareDataWriter` that this plan's cases use.

## The unit cases, by title

### `RegistrationModeSelector.svelte.test.ts` — 23

- **no mode and one mode:** renders nothing when no mode is listed · renders the one mode’s panel directly: no fieldset, no legend, no radio and no option block · renders the one panel for whichever mode is the one listed
- **several modes:** renders one fieldset named by its legend · renders one native radio per mode, in the order given, all under the name `registrationMode` · keeps the order it is given, whatever that order is · has no mode chosen and no panel in the document on arrival · puts each radio in an option block that carries its mode, inside a label holding the option’s text · merges the caller’s class into the fieldset
- **choosing:** renders the chosen mode’s panel inside its option block and hands the parent the mode · puts the panel after its radio’s label in the document · removes the first panel and renders the second when another mode is chosen · shows the panel of a mode the parent selected · leaves focus on the radio when a mode is chosen
- **the group’s error:** renders no alert and describes the group by nothing without an error · renders the error as an alert under the options and names it as the fieldset’s description · clears a bound error when a mode is chosen
- **what the group does not add:** gives no element a role but the alert’s · sets no `tabindex` on a radio, so the group is one tab stop · puts the radios in no form of its own
- **the export and the ids:** focuses the first radio on `focusFirst()` · gives two instances different ids for their errors · uses an id it was given for the fieldset, and builds the error’s id from it

### `EmailSentPanel.svelte.test.ts` — 35

- **ResendCountdown — the count (11):** is the whole wait at the settlement and is not ready · counts down with the clock · is 1 and not ready a millisecond before the wait ends, and 0 and ready when it ends · stays at 0 after the wait has ended · shows the right remainder on its next reading of the clock after the clock jumped forward · reads the clock at once when the page becomes visible again · is ready at once when the clock jumped past the end of the wait · starts again from the whole wait when it is given a new settlement time · has no wait while there is no settlement time · runs one timer however often it is started, and none once it is stopped · keeps two counts apart
- **ResendCountdown — the status (4):** is nothing at first and stays nothing while the count runs · is `ready` once the count reaches 0 · is `requested` after `markRequested()` · stays `requested` while the request is in flight and while the next count runs, and is `ready` when that count ends
- **EmailSentPanel — the sentences (7):** shows the sign-in sentence, the address, the newest-link sentence and the sentence that mentions the typed address · shows the recovery sentence for the recovery wording · shows the registered-address sentence, no address and no mention of a typed address for the code wording · shows no address block for an address that is blank · renders the address as text that is neither translated nor hyphenated, under its label · adds the asked-again sentence, with its test id, after the others · merges the caller’s class into its root
- **EmailSentPanel — the status region (4):** is one polite status region that is empty at first and shown to assistive technology alone · holds the requested message when a new email was asked for · holds the ready message when a new email can be asked for · changes the text of the same region when the status changes
- **EmailSentResend — while seconds are left (4):** renders a button that is marked unavailable and is still a tab stop · describes the button by a line that holds the seconds and is not live · calls nothing when it is pressed · keeps focus when it becomes unavailable while focused
- **EmailSentResend — with no seconds left (3):** renders the button available and no line · calls `onresend` once when it is pressed · submits no form it stands in
- **EmailSentResend — while a request is in flight (2):** is marked unavailable, reads as loading, and is still a tab stop that is not natively disabled · calls nothing when it is pressed

### `contestantContext.svelte.test.ts`, describe "the entry flow" — 32 new, 107 in the file

- **the state (4):** is `undefined` on a new context · is held by one instance alone: a second context holds none of it · is in no web storage, cookie, URL or history state · reaches an effect that reads it off the context
- **holdEntryCode (2):** holds the code with its status · removes a held request
- **the three calls the flow makes (2):** forwards each to the writer with what it was given and answers what the writer answers · hold nothing: a direct call leaves the flow as it was
- **sendEntryLink — which request is made (5):** asks for a sign-in link with the address and the context’s locale, and no code, from the sign-in form · passes the address and the code from the screen that takes the address for a valid code · passes the code and no address from the screen that signs in the holder of a used code · asks for a password-recovery link, and for no sign-in link, from the forgot-password page · acts on its context when it was taken off it
- **sendEntryLink — what its caller and the state learn (6):** resolves to nothing and holds the request with its wording and the time it settled when the request fulfils · resolves to nothing and holds the same when the request rejects · resolves to nothing and holds the same when the writer throws before it returns a promise · resolves at the ten-second bound, and not before, when the request neither fulfils nor rejects · holds nothing that tells a fulfilled request from a rejected one or from one that never answered · holds the wording of the screen the request was made from
- **sendEntryLink — the held code (2):** keeps the held code beside a request made with it · replaces the whole flow, a held code included, with a request made without a code
- **sendEntryLink — a request asked again (5):** marks a second request for the same address made less than the wait after the first settled · does not mark a second request for the same address made once the wait has passed · does not mark a request for another address · marks a second request with the same code made inside the wait · judges it from the time the first request settled, not from when it was made
- **resendEntryLink (4):** repeats the held sign-in request through the same writer call and records a new settlement time · repeats a held recovery request as a recovery request · resolves alike, with a new settlement time, when the repeated request rejects · does nothing when no request is held
- **the end of the flow (2):** `clearEntryFlow()` forgets the code and the request · a logout forgets the code and the request

## The gate rows

`bash $P/178-gates.sh 178-10-close --rows typecheck,lint,unit,check-frontend,build,format,docs-links`, in the background, polled; head `e67a4bfc6`.

| Row | Exit | Seconds |
|---|---|---|
| typecheck | 0 | 21 |
| lint | 0 | 48 |
| unit | 0 | 38 |
| check-frontend | 0 | 10 |
| build | 0 | 17 |
| format | 0 | 20 |
| docs-links | 0 | 2 |

`node $P/178-verdict.mjs gates 178-10-close --rows …`: PASS — 7 expected, 7 recorded; not stale (the run's head is tree-equal to HEAD outside `.planning/`); no Sleep entry inside the run window. The host was on AC power at 100 %.

Beside the gate set, each status read from the command itself: `svelte-check` 0 errors and 0 warnings before Task 1's and Task 3's commits and before the fix commit; `eslint` on the touched files exit 0; `prettier --check` exit 0; `yarn assert:comment-hygiene` exit 0 before each commit; `yarn workspace @openvaa/docs validate:links` 0 findings; `bash .claude/scripts/audit-skill-links.sh components` exit 0.

## Decisions Made

- **"Send again" is unavailable by `aria-disabled` alone, in flight too.** `Button` computes `isDisabled = disabled || loading` and then sets the native `disabled` attribute and `tabindex="-1"` on its `<button>`. The plan says this button "never carries the native `disabled` attribute", stays a tab stop and keeps focus when pressed, and also that in flight it is "in its loading form". Both cannot hold through `Button`'s `loading`. The focus rule is the accessibility truth, so the control passes neither `loading` nor `disabled`: it swaps the text for `t('common.loading')`, sets `aria-disabled` and `aria-busy`, and its handler returns at once. What is lost is the spinner, for the few milliseconds a request takes.
- **The selector's rest props are a fieldset's.** The plan says "the attributes of a `<div>`"; they are spread onto the `fieldset`, and a `div`'s typed event handlers are not assignable to a fieldset's, so the type says what is true. Every attribute a `div` takes is still accepted.
- **`selected` is not written for a single mode.** Writing a bindable prop at mount would need an effect; the page already knows its one mode.
- **`$state.raw` for the flow.** Every write replaces the object, no consumer should change it in place, and a plain object is what a test compares strictly. The type marks `entryFlow` `readonly`, and the class has no setter: the four methods are the only writers.
- **The held code stays only beside a request made with it.** `{ code }` equal to the request's code is kept; a request without a code, or with another, replaces the whole flow.
- **`#requestLink` is `async`.** A writer that throws at the call then answers with a rejection, which the bounded wait takes like any other outcome, without a `try` in the context. The writer is still called synchronously inside `sendEntryLink`.
- **The count's status is set, not derived.** While a pressed request is in flight the old settlement is still the held one, so the count reads 0 and a derived status would say "ready" straight after "requested". The class sets `ready` only in the clock reading that sees the count go from above 0 to 0.
- **The count also reads the clock on `visibilitychange`**, so a tab brought back from the background is right at once and not at its next tick.
- **A request with neither an address nor a code calls no writer method** and is held like any other; the screens validate before they send, so this is the answer for a caller's mistake that still tells a screen nothing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task 2 was committed with 20 type errors in its test file, because a gate's status was read through a pipe**
- **Found during:** Task 2, reading the commit script's log after the commit
- **Issue:** my commit script ran `yarn workspace @openvaa/frontend check | tail -1` under `set -e`, which takes `tail`'s status. `svelte-check` had exited 1 with 20 errors, all at the calls of the test file's mount helper, whose parameter was typed `Parameters<typeof mount>[0]` — a type a component with required props is not assignable to. The unit run, ESLint and Prettier were green, so the commit `f7212f546` was made.
- **Fix:** the helper takes `Component<never>`. `svelte-check` 0 errors after. Committed as its own commit, with every gate's status read from the command; the earlier commit was not rewritten. No component and no assertion changed.
- **Files modified:** `EmailSentPanel.svelte.test.ts`
- **Verification:** `svelte-check` exit 0; the directory's 35 cases green; Task 2's verify block exit 0 at `ff7c4d150`; the `typecheck` and `check-frontend` gate rows 0
- **Committed in:** `ff7c4d150`

**2. [Rule 3 - Blocking] Two stages of Task 3's verify block misread code that this plan did not write**
- **Found during:** Task 3, before its commit
- **Issue:** (a) the stage for "`#reset` clears the flow state" slices from the first mention of `#reset` in code to the next `};`. The first mention is the reference in the logout wrapper, `.then(this.#reset);`, so the slice is `#reset);\n  };` and can hold nothing. (b) the stage `if(/sessionStorage/.test(code))` matches the pre-registration state's `sessionStorageState` — an import and two fields that are on the tree at the plan's base and are Phase 179's.
- **Fix:** the code was not bent to either. `178-10-t3-verify.sh` was run as written: exit 1, printing exactly those two lines. `178-10-t3-verify-restated.sh` is the same chain with (a) read from the definition `#reset = (` to its closing `};` and (b) restated as: the lines naming `sessionStorage`, `localStorage` or `document.cookie` are the same four lines as in the file at the base commit, and none of them names the flow. Exit 0: "storage lines: 4 now, 4 at the base; assignments of the flow state: 4", then the gate verdict PASS. That the flow reaches no storage is also a unit case.
- **Files modified:** none on the tree
- **Committed in:** —

**3. [Rule 3 - Blocking] The generator writes a page per component**
- **Found during:** Task 2, step 5
- **Issue:** the plan's `files_modified` names the generated listing alone; `generate:docs` also wrote three new pages.
- **Fix:** the new sources were staged first, so the generator exited 0 on its first run. The diff was read: three entries added to the listing, its total from 111 to 114, three new pages, nothing else. All four generated files are in Task 2's commit.
- **Committed in:** `f7212f546`

**4. [Rule 1 - Bug] A helper of the new count test passed `undefined` into a default parameter**
- **Found during:** Task 2, the first green run (34 of 35)
- **Issue:** `startCount(undefined)` took the helper's default settlement time, so "has no wait while there is no settlement time" measured a count with one.
- **Fix:** the helper takes its argument as a rest tuple and tells "no argument" from "`undefined`". The class was not changed.
- **Committed in:** `f7212f546`

### Other departures, none of them a fix

- **No spinner on "Send again" in flight**, and **the selector's rest props typed as a fieldset's** — both under *Decisions Made*.
- **Task 2 has two commits**, and the README's table was re-aligned by Prettier because a new first-column cell is wider, so every row of it shows in the diff.
- **The unit commands with `--` ran the whole frontend suite**, as the dispatch notes.
- **`aria-busy` on the button in flight** is an addition the plan does not name.
- **The windows ledger was not appended to.** `.planning/WINDOWS.md` was last written by Phase 172 and no plan of this phase has used it; nothing here is a stub, a skipped test or an unrun verify.

**Total deviations:** 4 auto-fixed (2 bugs in this plan's own test file, one of them committed for one commit; 2 blocking), 5 other. No scope was added.

## Issues Encountered

None beyond the above. One shell slip without effect: a `node -e` edit of the test file threw on its own anchor before writing anything; the edit was then made with the editor.

## The code-review checklist

| Item | Outcome |
|---|---|
| The changes solve what they set out to | Yes: the selector, the "email sent" pieces and the flow's state exist, tested alone, documented and listed |
| OWASP top 10 | The code and the address are held in memory only, a unit case reads both storages, the cookie, the URL and the history state; nothing of either is logged; the address is rendered as text (a case mounts an address holding markup); no `{@html}`; the state is per instance, a unit case builds two. `ErrorMessage` logs the group error it shows, a catalogue string |
| Code style guide | Followed: type files beside components, barrels, TSDoc on every prop and member, `concatClass` on every root |
| No `any` | None. Tests cast mount props with `as never` and type the shared mount helper `Component<never>` |
| No repeated code | The three writer forwards repeat the form of `checkRegistrationKey`, as that file's own comment says its typing requires. `resendEntryLink` goes through `sendEntryLink`. The count uses the flow module's `secondsLeft` |
| New entities documented | Yes: `@component` docblocks, the class's docblock with a usage, TSDoc on the eight context members and a section of the provider's class comment |
| Repo markdown updated | The library's README; the generated listing and pages |
| Tracking events | None needed: nothing is available to a user yet |
| Svelte component guidelines | Runes only, props from a co-located type, snippets, no `export let`, no `<slot>`; `svelte-check` 0 warnings |
| Errors handled and logged | `sendEntryLink` deliberately neither catches nor logs: the bounded wait swallows every outcome so that no screen can read it. The forwards reject as the writer does; their callers handle it |
| Failing checks | None on HEAD. One commit of the plan, `f7212f546`, fails `svelte-check` on its test file (*Deviations* 1) |
| Parts sharing dependencies not unduly affected | The context gained members and lost none; `newUserEmail`, `checkRegistrationKey` and `register` are untouched; the type check finds no typed fixture missing a member; the whole unit suite and the build are green |
| WCAG A and AA | Native radios in a fieldset with a legend; the group's error an alert named as its description; the address under its label; a polite status region; an unavailable button that stays focusable with its reason as its description. No axe scan can run until a screen renders them |
| Keyboard and screen reader | One radio name and no `tabindex`, so one tab stop and native arrow keys; the panel follows its radio; "Send again" is never out of the tab order. Not driven in a browser yet |
| Developers' and Publishers' Guides | The generated component pages. The components skill is behind (*Not done*) |
| Comment hygiene | `yarn assert:comment-hygiene` 0 violations before each commit; every comment added was read: none tells history or names a plan, decision or proposal |
| Commit history | Four commits; one fixes the test file of the one before it and was not squashed |
| Formatting-only changes | The README table's re-alignment rides with the two rows that caused it |
| `[db]` | Not applicable |

## Prohibitions

| Id | Outcome | Evidence |
|---|---|---|
| PROH-178-28 | Held | `EmailSentPanel` takes a wording, an address, a flag and a status; `EmailSentResend` takes a number, a flag and a callback; `ResendCountdown` takes a time. None takes an answer. `sendEntryLink` writes the same state after fulfilment, rejection, a synchronous throw and the bound — four unit cases, and one comparing three outcomes key for key. The status is set by the press and by the clock |
| PROH-178-29 | Held | One private field, written in four places of the class; a unit case compares both storages, the cookie, the URL and the history state before and after a held code and a sent request; the count's module holds no binding (Task 2's verify) |
| PROH-178-30 | Held | No role, no key handler, no transition, no `tabindex`; the panel is inside `{#if selected === mode}`. Task 1's verify refuses each, and three unit cases hold them |

## Observed, and inferred

- **Observed:** every unit case, red and green; the four verify exits; the seven gate rows; the generated diff; `svelte-check` with 20 errors on `f7212f546`'s test file and 0 from `ff7c4d150` on; that `Button` renders `disabled` and `tabindex="-1"` for `loading` (read in its source) and, given `aria-disabled` as a rest prop, renders a `<button>` with `tabIndex` 0 that keeps `document.activeElement` across the change (jsdom); that a radio's `click()` in jsdom drives `bind:group`.
- **Inferred, not observed:** that a browser keeps focus on an `aria-disabled` button and moves it to `<body>` for one that becomes natively disabled (the reason for the decision; jsdom does not model it); that the arrow keys move and choose among the radios in a real browser; that `Button`'s `group-aria-disabled` label colour reads as unavailable on a ghost button; that a screen reader speaks the status region's two changes and not the line; that 65 seconds from settlement outlasts the server's slot.

## Not done, or not verified

- **No browser has rendered these components.** No axe scan, no phone-width check, no keyboard walk and no screen-reader check was possible; they belong to the screens (178-13 to 178-16, 178-19), the scans (178-21, 178-22) and the person's list (178-24).
- **The components skill was not edited.** `.claude/skills/components/context-reactivity.md` § 1 lists neither `entryFlow` among the reactive accessors nor the seven new stable functions; `SKILL.md`'s measured counts are behind by this plan's three components on top of plan 178-09's four. Both files are outside this plan's `files_modified`; `audit-skill-links.sh components` exits 0. `178-EXECUTION-RULES.md` § *Code rules* already states the rule for the eight members, and the type file's TSDoc states it at each.
- **The assumption of ruling 6** — the margin over the server's minute, and a page's clock driving the count — is unmeasured.
- **`requirements-completed` copies the plan's three ids** as the template asks. This plan builds pieces of REG-03, REG-10 and REG-09 and no screen; whether any is complete is the orchestrator's to mark.

## The state the local stack is left in

Untouched. This plan ran no database command, no reset, no probe and no E2E run, and started no server. No Docker reading was taken for a gate set without database rows. Power: AC, 100 %.

## For later plans

- **Predecessor label for the next full run is still `178-07-close`** (444 tests, 116 projects). This plan made no full run and adds no E2E test.
- **Importing:** `$contestant/components/registrationModeSelector` (`RegistrationModeSelector`); `$contestant/components/emailSentPanel` (`EmailSentPanel`, `EmailSentResend`, `ResendCountdown`, and the type `EmailSentStatus`).
- **178-16 (C) — the selector.**
  ```svelte
  <RegistrationModeSelector modes={listed} bind:selected bind:error={modesError} bind:this={selector}>
    {#snippet panel(mode)} … the mode's sentence and its form … {/snippet}
  </RegistrationModeSelector>
  ```
  - **A closed panel is removed from the document, and with it its inputs.** "What was typed in a panel is kept while the page is shown" (C3) therefore needs each field's value bound to state the page holds (`bind:value={email}`, `bind:value={code}`), not left in the DOM.
  - **With one mode the component writes nothing to `selected`.** Derive the mode in play: `const mode = $derived(listed.length === 1 ? listed[0] : selected)`. `data-mode-selected` is that, or `''`.
  - Continue with none chosen: `modesError = t('contestantApp.register.modes.required'); selector.focusFirst();`. Choosing a mode clears `modesError`.
  - The fieldset already has `w-full max-w-md`; it is rendered only with several modes, so with one mode the page's own form carries the width (the contract's `flex w-full max-w-md flex-col gap-md`).
  - The radios have no ids and are in no form; a fixture reaches one by `register-mode-input` filtered on `value`, or through its option block's `data-mode`.
- **178-13, 178-15, 178-16, 178-19 — asking for a link.** `const { sendEntryLink } = contestantCtx;` then `await sendEntryLink({ origin, email, code }); await goto(…E…)`. No `try`, no result. Origins: `'signIn'` (B), `'register'` (C's email panel), `'registerEmail'` (D1, address and the held code), `'registerSignIn'` (D2, the held code and no address), `'forgotPassword'`. **Pass trimmed values**: the context sends and holds what it is given. Leave an absent address or code out of the object. The loading state is the page's own flag around the `await`.
- **178-16 — the code.** `const status = await checkInvitationCode({ code })` (it rejects on a failed request: catch it and treat it as not confirmed), then `holdEntryCode({ code, status })` for `'valid'` and `'used'` before navigating. `holdEntryCode` removes a held request.
- **178-15 (D1, D2).** The code is `contestantCtx.entryFlow?.code`; a page without one redirects. A request made with the held code keeps the held code beside the request, so "Use another email address" back to D1 still finds it. A request made **without** a code replaces the whole flow, the held code included.
- **178-13 (E).**
  ```ts
  const countdown = new ResendCountdown(() => contestantCtx.entryFlow?.request?.settledAt);
  onMount(() => { countdown.start(); return () => countdown.stop(); });
  let resending = $state(false);
  async function handleResend() {
    countdown.markRequested();
    resending = true;
    await resendEntryLink();
    resending = false;
  }
  ```
  `<EmailSentPanel wording={request.wording} email={request.email} askedAgain={request.askedAgain} status={countdown.status} />` and, in the actions, `<EmailSentResend secondsLeft={countdown.secondsLeft} loading={resending} onresend={handleResend} />`. `data-resend` is `countdown.ready ? 'ready' : 'waiting'`; `data-address` follows `request.email`. Read `contestantCtx.entryFlow` inside the tracking scope (`const request = $derived(contestantCtx.entryFlow?.request)` is safe: the object is replaced on every write). `start()` touches `document`, so it belongs in `onMount` or an effect. For the wording `code` pass no `email`. The count shows 0 and the button is available when no request is held, so E must redirect before it renders.
- **178-14, 178-19 — the end of the flow.** `clearEntryFlow()` where a screen signs the user in. A logout clears it through `#reset`, after the logout's `goto` resolves.
- **Every plan that reads the flow:** `entryFlow` is a reactive accessor and `readonly`; never destructure it. `holdEntryCode`, `sendEntryLink`, `resendEntryLink`, `clearEntryFlow`, `checkInvitationCode`, `requestSignInLink` and `requestPasswordRecovery` are stable arrow fields and may be destructured. A screen calls `sendEntryLink`, never the two link forwards.
- **A test that fakes the contestant context for a page** needs the members that page reads; `svelte-check` found no typed fake missing one today. A test that runs the real provider answers `requestSignInLink`, `requestPasswordRecovery` and `checkInvitationCode` on the writer in `writerBox`; under fake timers the bound is `await vi.advanceTimersByTimeAsync(LINK_REQUEST_SETTLE_BOUND_MS)`.
- **178-12 — driving the count in a browser:** the class reads `Date.now()` at construction, on a one-second `setInterval` and on `visibilitychange`. A page clock that advances both timers and `Date` moves it; one that only fast-forwards `Date` needs a tick or a `visibilitychange` after it.
- **178-21, 178-22 — to look at on the rendered screens:**
  1. The status region is the body's last child, so the last visible sentence keeps a paragraph's 16 px bottom margin above the actions, where other screens end at 0.
  2. "Send again" while unavailable: `Button` greys the label through `group-aria-disabled`, but the ghost button's hover background and pointer cursor remain.
  3. In flight it reads "Loading…" with no spinner.
  4. The countdown line is the control's last child and has no bottom margin; `ContactSupport class="mt-lg"` follows as the contract gives it, and the actions move up by the line's height when the count ends.
  5. A radio and its label at 320 px with the longest translation: the label has no `whitespace-normal` because it does not carry DaisyUI's `label` class; the text wraps in a plain `span`.
- **178-23 — documentation now out of date:** `.claude/skills/components/context-reactivity.md` § 1a and § 1b (the eight members); `SKILL.md`'s counts (three more components calling `$props()` with a type file and `concatClass`, on top of plan 178-09's four — re-measure); the Developers' Guide wherever it lists the contestant context's members.
- **Reading a status:** in a script under `set -e`, `command | tail` takes `tail`'s status. Redirect to a log and read `$?`, as *Deviations* 1 learned again.
- **Timing on this host today:** the component library's unit tests 2 s; the context's 1 s; `svelte-check` 10 s; the seven gate rows 2 min 36 s.

## Threat register

| Id | Disposition | What was done |
|---|---|---|
| T-178-55 | mitigated | the components take no answer; `sendEntryLink` resolves alike on four outcomes and holds the same state, each a unit case; the count is a function of a time and the same for every address |
| T-178-56 | mitigated | a private rune field written in four places; a unit case reads both storages, the cookie, the URL and the history state around a held code and a sent request. The verify's own storage stage is defective and was restated (*Deviations* 2) |
| T-178-57 | mitigated | a field of the instance, with a unit case over two instances; the count's class holds no module-level binding (Task 2's verify) and a case keeps two counts apart |
| T-178-58 | mitigated, unmeasured | 65 seconds from settlement, computed from the two times and re-read on `visibilitychange`; that it outlasts the server's slot is ruling 6's assumption |
| T-178-59 | mitigated | the ten-second bound, a unit case at 9 999 ms and at 10 000 ms |
| T-178-60 | mitigated | only the chosen panel is in the document and the radios are in no form, each a unit case |
| T-178-SC | accepted | no package was installed |

No security-relevant surface outside the plan's threat model was added.

## Known Stubs

None. The components and the context members are complete; that nothing renders or calls them yet is the plan's own boundary.

## Next Phase Readiness

Plans 178-13 to 178-16 and 178-19 can build their screens on the selector, the "email sent" pieces and the context's flow members. No blocker.

## Self-Check: PASSED

- The 14 created and 5 modified files exist and are tracked (`git ls-files --error-unmatch` on each, exit 0).
- The four commits are ancestors of HEAD: `04c7b4f6a`, `f7212f546`, `ff7c4d150`, `e67a4bfc6`.
- `git rev-list --count 2e0c725e4..HEAD` at the time of writing: 4.
