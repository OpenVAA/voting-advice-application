---
created: 2026-11-22
title: The voter consent prompt, a non-modal dialog fixed to the bottom, covers the last answer choice on desktop
area: frontend
severity: major
source: phase 189.1, plan 189.1-08 (evidence/189.1-08-prompt-on.md)
owner: a later frontend phase
files:
  - apps/frontend/src/lib/components/alert/Alert.svelte
  - apps/frontend/src/lib/dynamic-components/dataConsent/popup/DataConsentPopup.svelte
  - apps/frontend/src/routes/(voters)/+layout.svelte
  - apps/frontend/src/lib/components/modal/ModalContainer.svelte
  - apps/frontend/src/lib/utils/viewTransition.ts
---

## Problem

With a project's `analytics.trackEvents` true, the voters layout (`apps/frontend/src/routes/(voters)/+layout.svelte`) queues `DataConsentPopup`, which renders the `Collecting Usage Data` prompt through `Alert`: a `role="dialog"` with `aria-modal="false"`, fixed to the bottom of the viewport. Measured on staging (`https://staging.openvaa.org`, build `2ddc331d1`) on Desktop Chrome at 1280x720, three runs with identical numbers, the prompt open and unanswered, keyboard focus on the fifth (last) Likert choice of the first question:

```
A11Y_VIEWPORT=1280x720
A11Y_CHOICES=5
A11Y_FOCUSED_IS_LAST_CHOICE=yes
A11Y_INPUT_BOX=x=854.4,y=566.2,w=32.0,h=32.0
A11Y_LABEL_BOX=x=812.8,y=566.2,w=115.2,h=69.8
A11Y_DIALOG_BOX=x=304.0,y=526.0,w=672.0,h=174.0
A11Y_SCROLL_Y=0
A11Y_LABEL_INSIDE_DIALOG=full
A11Y_CENTER_HITS_DIALOG=yes
A11Y_CENTER_HITS_DIALOG_AT_FOCUS=no yes no
A11Y_ESCAPE_CLOSES=no
A11Y_FINDING=focus-entirely-obscured
```

- The focused choice's label and its input lie entirely inside the dialog's box, and focusing it does not scroll the page (`scrollY` 0): the choice is already inside the viewport, so nothing moves it clear of the fixed prompt.
- A hit test at the centre of the label and of the input lands inside the dialog once the page has settled, and a pointer click on that choice is intercepted by the dialog (the deployed voter smoke's red run, `intercepts pointer events`).
- Escape does not close the prompt: `components/alert/` has no Escape handler.

WCAG: 2.4.11 Focus Not Obscured (Minimum), AA in WCAG 2.2, fails a component entirely hidden by author-created content when it receives focus. W3C's understanding text says an entirely obscured focus indicator would likely also fail 2.4.7 Focus Visible, AA in WCAG 2.1, the project's standard. The instant hit test at focus differed between runs (it returned `html` once, most likely inside the navigation's document View Transition; that cause is unconfirmed); the boxes are the same in every reading.

## To do

- **The chosen fix (operator ruling, phase 189.1, `answer_wcag_fix=modal`): render the consent prompt as a modal dialog** through `apps/frontend/src/lib/components/modal/ModalContainer.svelte`, which opens with `showModal()` and closes on Escape through its document key handler.
  - Escape dismisses the prompt **without consent**: nothing beyond the pageview is sent, as for a decline today. Whether the prompt reappears on the next visit or the next page after an Escape dismissal is still to be decided.
  - The page under a modal dialog is inert and the dialog sits in the top layer, so focus cannot reach a covered answer choice at all and the pointer cannot click one.
  - The View Transition gate must cover a prompt that is open at load (`CLAUDE.md` § Results Navigation Invariants: a document View Transition must never run with names while a modal is open). `apps/frontend/src/lib/utils/viewTransition.ts` strips the names when `startViewTransition` finds a `dialog[open]`, and `shouldAnimate` decides whether a navigation animates at all; the prompt opens by itself on the first voter page, with no user navigation opening it, so check that a navigation started while it is open (or that it opens during) runs nameless or not at all, and add a test for it.
  - The deployed voter smoke's locator handler (`tests/tests/deployed/voter.smoke.ts`) keeps working because the dialog keeps its accessible name `Collecting Usage Data`; so do the local specs that drive the prompt by role and name. Rerun them.
- **Alternative: `scroll-padding`.** Bottom `scroll-padding` on the scrolling root, and bottom padding on the main layout, equal to the open prompt's height (174 px at 1280x720, more on a narrow screen where it spans the full width), applied only while the prompt is open. Focus then scrolls a covered choice clear of the prompt.
- **Alternative: `escape-closes`.** Escape closes the non-modal prompt. This brings in only the exemption of 2.4.11's second note (the user can reveal the focused component without moving focus), whose text speaks of content the user opened, while this prompt opens by itself, so Escape alone may not meet the criterion.
- **The a11y scan gap.** No axe scan runs with the voter prompt open: the local scans run on datasets where it does not show, or for the contestant opt-out. And axe would not detect obscured focus in any case, since it checks the DOM and not what a fixed overlay paints over. Whatever the fix, add an E2E assertion of its own: with the prompt shown, either the page under it is inert (modal) or the focused last choice's box lies clear of the prompt's box.
