# Results Redraw — View Transitions, the `(located)` load, and the per-app drawer host

Implementation blueprint for the voter **results** section: why navigating
inside it used to redraw the whole subtree, why the page used to paint on top
of an open drawer, and what the shipped fixes actually are. Distilled from
spikes 031, 032, 033, 034 and from Phase 165, which landed them in production
and deleted the lab they were prototyped in.

This domain **supersedes [[page-navigation-and-transitions]] in detail** for
anything results-shaped. That reference is still right about the Q→Q symptom
(the perceived "redraw" there is content-node regeneration, not remount, and
View Transitions are the load-bearing fix). Results was a different animal: a
genuine full-subtree remount on every navigation, with a document View
Transition painting the page over the drawer on top of it.

## The two invariants

These two outlive the code. Everything else in this file is mechanism.

### 1. A document View Transition must never run with names while a modal is open.

**Mechanism.** A modal `<dialog>` opened with `showModal()` lives in the
**top layer**, which paints above the entire document. A document View
Transition captures the page as a `root` snapshot, and every element carrying a
`view-transition-name` becomes **its own group, painted above `root`** — top
layer included. So for the duration of the transition the page under the dialog
is drawn on top of it: spike 031 saw the header flash over the backdrop, and
the results list cover the drawer during a drawer-tab switch.

**The shipped fix is a class on the document element, toggled before the
transition starts.** `startViewTransition` in
`apps/frontend/src/lib/utils/viewTransition.ts` checks for `dialog[open]`, adds
`VT_NO_NAMES_CLASS` (`'vt-no-names'`) to `document.documentElement` **before**
calling `document.startViewTransition`, and removes it in
`transition.finished.finally(...)`. The matching CSS rule lives in the root
layout's stylesheet.

**`!important` on that rule is load-bearing, not decoration.** The named
elements carry their `view-transition-name` as an **inline `style` attribute**,
and an inline style beats a class selector in the cascade. Drop the
`!important` and the class is applied, the rule matches, and the names survive
anyway — a failure that looks exactly like the fix working. Phase 165's NC-5
injected precisely that: with the strip class still on `<html>`, five names came
back.

### 2. The `(located)` load must not read the URL tracked.

**Mechanism.** SvelteKit reruns a universal `load` whenever a `url` property it
read **tracked** changes. `routes/(voters)/(located)/+layout.ts` untracks its
`parseParams({ url })` call — but it also builds an open-redirect-safe `next=`
target from `url.pathname` and `url.search`, and those reads sat **outside**
the `untrack`. One tracked read defeats the surrounding untrack completely: the
load reran on every results tab / entity-drawer navigation, re-streamed the
question and nomination data, `(located)/+layout.svelte` flipped its `ready`
flag to `false`, `<Loading/>` replaced the whole subtree for a frame, and
everything remounted — intro redraw, scroll clamped to 0, list flicker.

**The shipped fix is one line**: the pathname and search are read inside
`untrack` too, because they only ever feed the redirect target. The allowlist
regex and the `next=` construction are byte-identical to the pre-fix form on
purpose — that is the one security-relevant line the change touches.

**The guard is a unit test, not an E2E test.**
`routes/(voters)/(located)/layout.tracking.test.ts` drives the real `load` with
a `Proxy`-wrapped `url` that records every property read and whether it happened
inside the provided `untrack`, and fails on any tracked read. It carries its own
control case, which asserts the Proxy records at all — without it, every
assertion in the file would be `[] === []` and would pass against a load that
reads everything tracked.

## What else this domain knows

- **An overlay navigation gets NO document transition at all** — not a nameless
  one. `isOverlayNavigation(from, to)` returns true when either end's params
  carry both `entity` and `id`, and the root layout skips
  `startViewTransition` entirely for those. The overlay's own open/close motion
  *is* the transition; a nameless whole-viewport cross-fade on top of it is a
  second, competing animation. The name-strip path is the fallback for VTs that
  run **while** a modal is already open (a drawer-tab switch), not a substitute
  for the exemption. ⚠ The predicate assumes the entity drawer is the
  **only routed overlay in the application** — a second one would force it to
  generalise (a route-id allowlist, or an overlay flag on the route data). The
  unit test pins the contract but cannot detect a new overlay being added; that
  is a review obligation.
- **One host per app, mounted below that app's contexts, is what lets one
  dialog serve two openers with no context bridge.** `DrawerHost.svelte` owns
  the only `<dialog>` and is mounted in `routes/(voters)/+layout.svelte`, below
  `initVoterContext()`; openers render nothing in place and call
  `drawerHost.open(payload)` with `{key, title, content, onDismiss, testId}`.
  The snippet renders inside the voter app, so it resolves the voter and filter
  contexts itself. A root-layout host would lose them and need the opener's
  `getAllContexts()` re-provided around the content — spike 034 built that
  bridge, spike 035 measured it away (all three alternatives green; the
  per-app mount smallest). Enabling drawers in the candidate app is one more
  `<DrawerHost />` in its root layout; `drawerHost.register()` warns on a second
  concurrent host and `open()` warns when none is mounted. The one host serves
  both the entity-details and the extended-question-info drawer, and an A → B
  entity navigation is a content **swap** rather than a close-and-reopen.
- **A hosted payload must render from a last-defined value, because the host
  outlives its opener.** The host keeps rendering `content` through its close
  animation — after the opener is destroyed and its `entity` prop already reads
  `undefined`. Rendering straight from the prop crashes the consumer mid-flush,
  which **aborts the close and hangs the dialog open with no way out** (spike
  034). The opener therefore keeps `let shownEntity = $state.raw(entity)` fed by
  an `$effect.pre`, and the snippet renders from that. A `<svelte:boundary>`
  around the payload in the host is the second half of the net: a `try/catch`
  cannot do this job, because it cannot intercept an error raised inside
  Svelte's render flush.
- **"Did not remount" is asserted by a node's identity, not by a mount
  counter.** Tag a DOM node before the navigation, assert `document.contains()`
  is still true for that same node afterwards. It needs zero production
  instrumentation, and it is literally what the claim means. ⚠ Aim it at the
  right node: in this tree `voter-results-list` sits on a component the layout
  remounts **on purpose** via `{#key \`${electionId}:${entityType}\`}` so a
  scope change discards per-scope filter UI state. Asserting identity on it
  across a tab switch produces a test that fails for a *correct* reason and
  then gets "fixed" by weakening it. The container above that key is the node
  whose survival means "the subtree did not remount".
- **Keep every route param optional and put the list on ONE page node.** Spike
  033 measured the alternative directly: a layered tree with a `+page.svelte` at
  each level remounted the list on the first switch away from an implied tab,
  because the implied shape and the explicit shape were served by different
  component instances in different route files. The shipped tree is
  `[[electionTab]]/+layout.svelte` → `[[entityTab=etPl]]/+layout.svelte` →
  `[[entity=etSg]]/[[id]]/+page.svelte`, with the list on the innermost page and
  a layout whose param is missing-and-unimplied rendering the picker instead of
  its children. No redirect anywhere.
- **Scroll asymmetry is deliberate and must stay commented.** Entity open,
  entity close and entity-tab switch pass `{ noScroll: true }`; an **election**
  change deliberately does not, because switching election replaces the whole
  list with content the voter has not seen. It reads as inconsistent beside the
  tab behaviour, which is exactly why the absence carries a comment saying it is
  deliberate.

## What to avoid

- **Do not "fix" the drawer-over-page symptom by reordering the DOM.** The
  results layout used to carry a comment claiming the drawer is rendered before
  the main content so it paints first on a cold deeplink. Under an app-wide
  host that claim is false: a modally-opened dialog sits in the top layer
  regardless of source order. Source order is not in that race at all.
- **Do not weaken the name-strip rule's `!important`** on the theory that a
  class selector is enough. See invariant 1.
- **Do not read any `url` property tracked in a `(located)` load** — including
  in a branch you believe is cold. See invariant 2.
- **Do not assume the reduced-motion / unsupported-browser skip path works
  because it "obviously" does.** As of Phase 165 close, **no run has ever taken
  it**: no test has made `document.startViewTransition` absent or
  `prefers-reduced-motion: reduce` true. "It skips rather than fails" is true by
  construction only.

## Known residue at Phase 165 close

Stated so a later reader does not mistake a green suite for an absence of
defects.

- **The document VT still intercepts pointer events on `<html>` for ~235-256 ms**
  during a transition. The suite is green with that interception live, on a
  14-CPU host; a slower host could still exceed a 2 s click budget.
- **A second throw escapes the host's `<svelte:boundary>`** — the payload's
  `title()` getter is read in `DrawerHost.svelte`'s own `aria-label` binding,
  which sits outside the boundary.
- **A load rerun from some other cause** — a locale change, an explicit
  `invalidate()` — still collapses the `(located)` subtree to its loading
  state. The untrack fix removes the *params* cause, not every cause.
- **The in-drawer tab switch still uses the whole-viewport root cross-fade.**
  An element-scoped transition (or a plain CSS fade) on the drawer's tab panel
  is the parked improvement.

## Origin

- Spike 031 `results-nav-flicker-forensics` — all four symptoms attributed:
  the remount to the tracked `url.pathname` read, the paint-over to document
  VTs painting named groups above the top-layer dialog. Route restructure
  found **not** required for any of them.
- Spike 032 `results-redraw-hardened-fixes` — the fixes in final form with the
  Proxy-url unit guard and its control; legacy → hardened measured 4 → 0
  remounts, scroll 700 → 0 vs 700 → 700, drawer never under the page.
- Spike 033 `layout-shaped-results-routes` — the parallel layered tree.
  Equivalent behaviour, organisational win; measured the one-extra-remount
  failure that forces "list on a single innermost page node".
- Spike 034 `global-drawer-host` — the host + payload + `getAllContexts()`
  bridge, and the teardown crash that hangs the dialog.
- Spike 035 `drawer-context-scoping` — named context carriers, a per-app host
  and a portal compared, each on the full E2E suite; the per-app host replaced
  the bridge. Spike 036 audits what the separate contexts buy.

Write-ups: `.planning/spikes/031-*`, `032-*`, `033-*`, `034-*` — the canonical
and only copy (see SKILL.md § Source Files). Production landing and its
evidence: `.planning/phases/165-results-navigation-redraw/`, in particular
`165-NEGATIVE-CONTROL.md` §§ 7, 9-13 and its § *Residue accepted by this phase*.
