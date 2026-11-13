---
phase: 179-identity-provider-registration-coverage-close
plan: 12
subsystem: contestant-app
tags: [frontend, svelte5, identity-provider, gates, email-entry, a11y, vitest, e2e]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-06: the contestantApp.identityProvider message keys in seven locales; 179-11: BasicUserData addressState / pendingEmail / ownOrganizationUnnamed / pendingEmailTaken, hasDefaultLocaleName, the CI1 endpoint POST /api/contestant/identity-provider (UNIVERSAL_API_ROUTES.identityProviderRegistration) with intents save / resend / acknowledge"
provides:
  - "EmailEntry.showEmailError(message): a message at the address field as an alert with data-reason=\"in-use\", focus there, removed by the next edit of either field or by validate()"
  - "EmailField errorReason prop, written on its error message as data-reason"
  - "$F/lib/contestant/gates/IdentityProviderGate.svelte: CI1 in every variant (V1-V6 and the address-taken notice), with data-variant, data-address-state, data-asks, data-gate-state; rendered by nothing yet"
  - "IdentityProviderGate.svelte.test.ts: 34 cases over the variants, the never-shown addresses, both Continue paths, Send again and its count, the address switch and Log Out"
affects: [179-14, 179-17, 179-18, 179-19]

tech-stack:
  added: []
  patterns:
    - "A gate view reads the arrival marker from page.data through $app/state and narrows it to its two values"
    - "A view with its own resend button reuses ResendCountdown from emailSentPanel with its own settlement time"

key-files:
  created:
    - apps/frontend/src/lib/contestant/gates/IdentityProviderGate.svelte
    - apps/frontend/src/lib/contestant/gates/IdentityProviderGate.svelte.test.ts
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/termsOfUse/TrackingOptOut/+page.md
  modified:
    - apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.svelte
    - apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/emailField/EmailField.svelte
    - apps/frontend/src/lib/contestant/components/emailField/EmailField.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/emailField/EmailField.type.ts
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/emailEntry/EmailEntry/+page.md
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/emailField/EmailField/+page.md
    - "apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/ (seven pages of pre-existing drift, see Deviation 2)"
    - apps/docs/src/routes/(content)/developers-guide/frontend/routing/generated/+page.md

key-decisions:
  - "The in-use reason reaches the error element through a new EmailField prop errorReason; EmailEntry passes it only while the message is one showEmailError put there"
  - "CI1 reuses ResendCountdown (the email-sent screen's clock and two announcements) with a settlement time of its own, not the component EmailSentResend, whose test ids are the email-sent screen's"
  - "Send again starts the count from the settlement of every request whatever the endpoint answers, as the email-sent screen does, so a throttled request reads the same as a sent one"
  - "The view sends no locale: the endpoint takes the mail's locale from the request's locale on the server"
  - "The party's names are sent with their blank locale entries left out; the abbreviation is left out of the request when it has no text"
  - "The view's name Input is uncontrolled (onChange copies the value), so the base Input never mutates a parent-owned state object"

patterns-established:
  - "Gate view state attributes: data-variant / data-address-state / data-asks / data-gate-state on the MainContent container"

requirements-completed: []

actuals:
  tokens: 19700
  tasks: 2
  commits: 2
plan_head_before: f3bada976c8f9d6a4594c775b98989ced89342f5
plan_head_after: bd0f5cf13f1d290bc77cf7fef78c81904bacff52

coverage:
  - id: D1
    description: "EmailEntry shows a server's answer at its address field: alert, data-reason=in-use, aria-invalid, focus, removed by the next edit of either field"
    requirement: "REG-04"
    verification:
      - kind: unit
        ref: "tests/e2e-runs/179-unit/179-12-t1-red.{log,exit} (exit 1, 6 failed); 179-12-t1-red-field (exit 1, 1 failed); green in 179-12-t1-unit (6279 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "CI1 in every variant with its events: V1-V6, the address-taken notice, Continue with and without a form, Send again with its count, Use another email address, Log Out"
    requirement: "REG-05"
    verification:
      - kind: unit
        ref: "tests/e2e-runs/179-unit/179-12-t2-red.{log,exit,junit.xml} (exit 1, 30 of 34 failed against a stub); green in 179-12-t2-unit (6313 passed)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/179-e2e/179-12-close (569/569; 179-verdict e2e --same-projects-as 179-11-close PASS, 131 projects; restore ok; 0 sleep entries)"
        status: pass
    human_judgment: false

duration: about 25 min (03:03Z to 03:28Z host clock)
completed: 2026-10-22
---

# Phase 179 Plan 12: CI1's view in every variant Summary

**`IdentityProviderGate.svelte` is finished and asserted but not yet rendered. It covers the email form; the party's names and abbreviation, before the address or on their own; the returning variants with the pending address under "Awaiting confirmation" or the proved address under "Your sign-in email address"; and the notice for an address another account has since taken. Continue saves through the 179-11 endpoint and reruns the loads. An address another account holds is reported at its field through the new `EmailEntry.showEmailError`. Any other failure is one alert under the form.**

## Performance

- **Duration:** about 25 minutes (host clock 03:03Z to 03:28Z).
- **Tasks:** 2 of 2. **Commits:** 2, counted from the ledger.
- **Power:** the host was on AC for every gate and for the close run (99% to 100%), so the battery override was not used.

## Variants as built

| Variant | Facts | Title | Lead | Body | `data-asks` |
|---|---|---|---|---|---|
| V1 | none, marker absent or `created`, no unnamed party | Complete your registration | `identified` (the 👍 hero only with `created`) | `emailIntro` + `EmailEntry` | `email` |
| V2 | as V1, party unnamed | Complete your registration | `identified` | the party sentence (`…name.editable.organization`), Name (`requiredLocale` = default), its error, Abbreviation, then the email part | `name email` |
| V3 | none, `existing` | You have already registered | `alreadyRegistered.none` | the form, with the names if the party is unnamed | `email` / `name email` |
| V4 | pending, nothing else to ask | the marker's title | `alreadyRegistered.pending` | the address in a `<dd>` under `awaitingConfirmation`, Send again + count line, Use another email address, an sr-only status region; Continue is a plain button that acknowledges | `''` |
| V4 switched | after "Use another email address" | unchanged | unchanged | the address, resend and switch are replaced in place by the email form; focus on its first field | `email` |
| V5 | proved, nothing else to ask | the marker's title | `alreadyRegistered.proved` | the address under `signInEmail`; Continue acknowledges | `''` |
| V6 | pending or proved, party unnamed | the marker's title | `nameIntro` | the name part alone | `name` |
| Taken | none with `pendingEmailTaken` | the marker's title | `emailTakenNotice` | the form | `email` (+ `name`) |
| Answers locked | any | — | — | no name part in any variant (U-08) | name never asked |

`data-variant` is `returning` with the marker `existing` and `new` otherwise. `data-address-state` is the user-level address state, and `data-gate-state` is `idle`, `saving` or `failed`.

## Events as built

- **Continue with a form:** the default-locale name is judged with `hasDefaultLocaleName`, and then `EmailEntry.validate()` runs. When the name is missing, its alert (`nameRequired` with `{language}` = `lang.<default>`) is added to the control's `aria-describedby` and focus moves to `<nameId>-<defaultLocale>` after `validate()` has focused the address. Nothing is sent. A complete form posts `{ intent: 'save', name?, shortName?, email? }` as JSON and the button reads "Saving…". `saved` leads to `invalidateAll()`. `in-use` leads to `showEmailError(emailInUse)`, and the button becomes available again. Anything else, including an unknown answer or an unreachable endpoint, shows the `saveFailed` alert, keeps the typed values and leaves focus on Continue. A second press sends the request again.
- **Continue without a form (V4, V5):** posts `acknowledge`. `acknowledged` leads to `invalidateAll()`; anything else shows the `saveFailed` alert.
- **Send again:** posts `resend`. On the press it writes `resendRequested` into the status region, and from the request's settlement the count runs for `RESEND_WAIT_SECONDS`. During the count the button is `aria-disabled`, still a tab stop that keeps focus, and described by the count line. When the count ends the region says `resendReady`.
- **Log Out:** calls `logout()` and sends nothing.
- **The placeholder address:** never rendered. The view renders only `user.pendingEmail` (V4) and `user.email` (V5), and the user-level data never holds a placeholder in either. Unit cases cover the states none, none returning, pending, and pending with the party unnamed.

## Runs

| Run | Tree | Result |
|---|---|---|
| `179-unit/179-12-t1-red` | EmailEntry cases, component without the export | exit 1: 6 failed and 25 passed. The 7th new case, "marks no message with a reason before it is called", is a control and passes |
| `179-unit/179-12-t1-red-field` | EmailField case, field without the prop | exit 1: 1 failed and 19 passed |
| `179-unit/179-12-t1-unit` | Task 1 tree | exit 0: 6279 passed, 32 skipped |
| `179-unit/179-12-t2-red` (+ `.junit.xml`) | the 34 cases against a stub view rendering an empty container | exit 1: 30 failed and 4 passed. The four passing are the placeholder cases, which are controls a blank view also passes |
| `179-unit/179-12-t2-unit` | Task 2 tree | exit 0: 6313 passed, 32 skipped (+34) |
| `179-unit/179-12-t2-check2`, `179-12-t2-lint2` | Task 2 tree | exit 0, exit 0 (the first check and lint, `t2-check` / `t2-lint`, found one type error and five lint errors in the new test and view; they were fixed before the commit) |
| `179-e2e/179-12-close` | committed `bd0f5cf13` | **569/569**, wrapper exit 0, `restore: ok`, 0 sleep entries; `179-verdict e2e 179-12-close --same-projects-as 179-11-close` **PASS** (131 projects equal) |

**Why a close run:** `EmailEntry` and `EmailField` are rendered by existing pages, for example `register/email`, so their change could be seen in a browser even though no existing caller calls the new export (close-run rule, "if in doubt"). The view itself is rendered by nothing. The run is the same 569 tests as 179-11-close; the plan adds no E2E test.

## Verify blocks (`tests/e2e-runs/179-unit/179-12-t{1,2}-verify*.{sh,log,exit,head}`)

- **Task 1:** run byte for byte it exits 1 at `yarn -s` (Yarn 4.18.1: `Unsupported option name ("-s")`, probe kept as `179-12-yarn-s-probe.log`). Restated with `yarn` and nothing else changed, it exits 0.
- **Task 2:** run byte for byte it exits 1 at the same stage. Restated with `yarn` in place of `yarn -s`, it exits 0. Every grep stage passes in both forms. `RESEND_WAIT_SECONDS` is named in the view's docstring and in the comment on its settlement time, because the count is that constant's (see Deviation 3).

## Task Commits

1. **5701281c1** `feat(179-12)`: the email-entry component can show a server's answer at its address field (Task 1)
2. **bd0f5cf13** `feat(179-12)`: the identity provider's success view in every variant (Task 2)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The error element belongs to `EmailField`, so `data-reason` needed a prop there**
- **Found during:** Task 1. `EmailEntry` does not render the address's error; `EmailField` does, and it had no way to put an attribute on it.
- **Fix:** `EmailField` gains `errorReason`, which is written as `data-reason` on its `ErrorMessage` and left out when absent. This changes its type, its docstring and one new unit case, a red-first case of its own. Three files that are not on the plan's list. Commit 5701281c1.

**2. [Rule 3 - Blocking] `generate:docs` regenerated pre-existing drift in the generated docs**
- **Found during:** Task 1. The generator rewrote seven pages that this plan did not cause: `TrackingOptOut` (new page and index entry, total 114 → 115), `TermsOfUse`, `DataConsent`, `DataConsentInfoButton`, `EntityListControls`, `Feedback`, `QuestionExtendedInfo(Button)`, and the routing map (`identity-provider/`, `diagnostics/`, `health/`, `usage/`, `register/identity-provider/error`).
- **Fix:** I read all of them and they are plain regeneration from docstrings and directories already on the tree. They are committed with Task 1 because the plan's verify asks for `git diff --quiet HEAD -- apps/docs`, and the generated listing is meant to match the tree. Commit 5701281c1.

**3. Reused `ResendCountdown` in place of reading `RESEND_WAIT_SECONDS` and `secondsLeft` directly (a correct implementation in another form)**
- The plan asks for "the resend rule over `RESEND_WAIT_SECONDS` and `secondsLeft` with the page's clock". `ResendCountdown`, already exported by `emailSentPanel`, is exactly that rule: it calls `secondsLeft`, reads `Date.now` once a second and on visibility, and holds the two moments of announcement. Writing it again would duplicate code. The view therefore names `RESEND_WAIT_SECONDS` only in its documentation of the count. The verify's grep stage passes on that docstring and comment; no code was written to satisfy it.

**4. [Rule 3 - Blocking] `yarn -s` is refused by Yarn 4.18.1 (recurring).** I ran both verify blocks restated as well; see above.

**5. [Rule 1 - Bug] Type and lint findings in the new files before the commit:** a tuple-typed `mock.calls.map` parameter (`check`); `func-style` arrows in the test and an unsorted import block in the view (`lint:check`). I fixed them before the commit.

**Total deviations:** 5 (3 blocking, 1 bug, 1 alternative form). **Impact:** three `EmailField` files and seven pages of generated docs fall outside the plan's file list. `EmailEntry`'s and `EmailField`'s existing callers get unchanged behaviour: the close run is 569/569 with the same projects as before.

## Code-review checklist (`.agents/code-review-checklist.md`)

- **Solves the issue:** yes. CI1 is a finished view waiting for its gate entry (179-14). `requirements-completed` is empty, as the plan says.
- **OWASP:** a typed or pending address is rendered as text in a `<dd>` (T-179-123), and nothing goes through `{@html}`. The view posts JSON to a same-origin endpoint that checks Origin and content type. The view has no condition that removes itself; only a rerun load does (T-179-121, PROH-179-19). The placeholder is never rendered (T-179-122, unit cases).
- **Style guide / `any`:** no `any`. `page.data.arrival` (typed `any` by SvelteKit) is read into `unknown` and narrowed to its two values. The test has one `as BasicUserData` fixture cast and one tuple cast of a mock call.
- **Repetition:** the resend clock and announcements reuse `ResendCountdown`. The resend button markup repeats `EmailSentResend`'s 15 lines because that component hard-codes the email-sent screen's test ids. It could become a prop-driven shared component when the reminder (179-18) and settings need the same button.
- **Documentation:** `@component` docstrings with the sections Dynamic component / Properties / Accessibility / Usage. `EmailEntry`'s and `EmailField`'s docstrings name the new export and prop. Generated docs regenerated; `validate:links` exit 0.
- **Tracking:** none added. Gate views have no route and no events, as is the case for F and G.
- **Svelte guidelines / context rule:** `user` and `answersLocked` are read as `contestantCtx.X` inside each `$derived`. Only `logout` and `t` are destructured. No `view-transition-name`, no `<dialog>`, no numeric spacing class (verify grep).
- **Errors handled and logged:** a failed request is logged by `log.error` with the error object and no address. A failed `invalidateAll` is logged.
- **Shared dependencies:** `EmailEntry`'s only page caller (`register/email`) is unchanged; the close run is green.
- **WCAG / keyboard:** every control is labelled. The name's error is an alert named by the control's `aria-describedby`, and focus moves to the default-locale control. Send again is a tab stop while `aria-disabled` and is described by its count. The status region is polite and always present in the pending state. The axe scans of CI1 arrive with its gate (179-14 onward).
- **Comment hygiene:** `assert:comment-hygiene` exit 0 before each commit. The comments carry no plan or decision ids.
- **Commits:** linear and atomic, with no `[db]` change.

## Components skill re-check

1. `IdentityProviderGate.svelte` has an `@component` docstring. Like `SetPasswordGate`, it has no `*.type.ts` and no barrel: the gates directory is outside the three libraries and the view takes no props. `EmailEntry` and `EmailField` keep their co-located types and barrels.
2. `generate:docs` was re-run after each task, and its diff was read. The run after Task 2 changed nothing, because the gates directory is not scanned.
3. `yarn workspace @openvaa/docs validate:links` exit 0.
4. `SKILL.md` and `context-reactivity.md`: no claim was invalidated. No component was added to or removed from the three directories, convention 1's counts are unchanged in kind (`$props()` and `*.type.ts` are paired), and no cited path moved.
5. `bash .claude/scripts/audit-skill-links.sh components` exit 0.

## Statements observed and inferred

- **Observed:** every exit status, count and verdict above; the red runs; the 569/569 close run with `restore: ok`; that `yarn -s` is refused.
- **Inferred:**
  - That CI1's behaviour inside the protected layout (focus to its `<h1>` on replacing F, the route announcement) matches F's. The view does not render until 179-14.
  - That the browser's change event on a name field fires before an implicit Enter submission, as it does on a Continue click. This was tested only through dispatched events.

## Items to report rather than edit

- **179-UI-SPEC.md** § *Existing components changed* names only `EmailEntry`. `EmailField` changed too, gaining `errorReason` (Deviation 1).
- **179-UI-SPEC.md** says the component count after the phase is 114. The generated listing now reads 115 before the `preregisteredNotification` removal, because `TrackingOptOut` was missing from the listing.
- **Send again after a refused request** (the throttle) is announced as "A new email has been requested.", as on the email-sent screen (U-17 ★). If the operator wants the throttle told apart, it is a located change in `handleResend`.
- **The plan's Task 2 sentence "posts `save` with the names and the address and the locale"**: the endpoint built by 179-11 reads the locale on the server, so the view sends none.
- **Carried items:** none of the open rows of `179-CARRIED-ITEMS.md` falls in this plan's files.

## Known Stubs

None. The view is complete. That nothing renders it is the plan's intent: 179-14 adds the gate entry and its view in one commit.

## Threat Flags

None beyond the plan's threat model (T-179-121, T-179-122 and T-179-123 are mitigated as above). The view calls an endpoint 179-11 added, and adds no new endpoint, auth path or schema.

## Self-Check: PASSED

- Files: `IdentityProviderGate.svelte` and its test exist and are tracked. `EmailEntry`, `EmailField` and the generated pages are committed, and `git status` shows only the operator's `CAND-APP-PLAN.md`.
- Commits 5701281c1 and bd0f5cf13 are ancestors of HEAD; `git rev-list --count f3bada976..HEAD` = 2.
- `tests/e2e-runs/179-e2e/179-12-close` holds `summary.json` and `restore.txt` ending `restore: ok`, and its `head` is bd0f5cf13.
- STATE.md, ROADMAP.md and REQUIREMENTS.md were not touched.
