# Phase 165: Results Navigation Redraw - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-23
**Phase:** 165-results-navigation-redraw
**Areas discussed:** A Branch and integration, B The four validated fixes, C Route restructure,
D Drawer host, E Scroll and tab behaviour, F Verification and evidence, G Scaffolding removal,
H Requirements and documentation, plus todo cross-reference

---

## Form of this discussion

Not an interactive per-area Q&A. The operator was given a single checkbox document —
`165-DISCUSSION-POINTS.md`, 24 decisions across 8 sections, each listing its options with exactly
one marked `★ RECOMMENDED` — and filled it in one pass. The document's own rule: **leaving a
decision unticked accepts the ★; a tick overrules; free text beats every box.**

**Result of the fill:** 21 decisions left unticked (★ accepted), 3 ticked.

| Ticked | Box ticked | Outcome |
|---|---|---|
| `C-2` | Redirect `/results/{election}` → `/results/{election}/{defaultPlural}` | **Superseded by the operator's own NOTE** — resolved interactively, see below |
| `C-3` | Canonicalise aggressively | **Superseded by the operator's own NOTE** — resolved interactively, see below |
| `D-1` | The ★ itself (payload + context bridge) | Explicit confirmation rather than an overrule |

Only two questions were put to the operator interactively, both because a tick and its
accompanying NOTE contradicted each other. A third question covered todo cross-reference, which
the checkbox document did not cover.

---

## C-2 — The implied-tab remount

The operator ticked the redirect option **and** wrote: *"Instead of redirect, can't we just keep
the routeParams optional, rendering both their layouts with implied defaults and the list in the
innermost layout/page? And when a param is missing and cannot be implied, make that layout show
the picker instead of children?"*

Before putting the question, the current route tree was inspected: `+page.svelte` exists at only
**one** level under four optional params, which is why one list instance survives every URL shape
today. The spike's `results-layered/` tree used **required** params with a `+page.svelte` at three
levels — that file split, not the nesting, is what produced the measured remount. The note was
therefore structurally sound, and was presented as the recommended option.

| Option | Description | Selected |
|--------|-------------|----------|
| The NOTE's variant | Nested layout files as criterion 4 asks, but all four params stay OPTIONAL; innermost page renders the list, so it matches every shape and stays one instance; no redirect anywhere; a layout whose param cannot be implied renders the picker instead of `children()`. Cost: the two `+page.ts` guards do NOT disappear and must be carried forward. | ✓ |
| The ticked redirect option | Required params; redirect `/results/{e}` → `/results/{e}/{defaultPlural}`. Cost: reintroduces the force-fill the Post-88-02 fix removed; safe only if every emitter changes in the same commit; one miss is a production navigation loop. | |
| The ★ as written | Render the list from the `[electionTab]` level; `[entityTab]` only selects the type. Also one instance, also no redirect — but `[entityTab]` becomes thin, trimming the organisational win. | |

**User's choice:** The NOTE's variant.
**Notes:** Recorded as CONTEXT.md D-08, an operator ruling that supersedes the tick. It forces a
correction to `C-4`'s ★ — that option assumed required params make the guarded URLs unroutable,
which is no longer true, so both guards are kept (D-10) rather than deleted.

---

## C-3 — Backward compatibility for existing `/results` URLs

The operator ticked "canonicalise aggressively" with the NOTE *"See above + no urls are published
anywhere."* Aggressive canonicalisation means redirects, which the C-2 ruling excludes — so the
tick and the note could not both stand.

| Option | Description | Selected |
|--------|-------------|----------|
| Back-compat is a non-goal | Read "no urls are published anywhere" as: do not spend the phase proving legacy shapes resolve. The route test enumerates only shapes the app itself emits; the cross-type `organizations/candidate/{id}` edge is kept only if a current emitter produces it, else dropped with the drop recorded. No redirects. | ✓ |
| Full ★ enumeration | Every shape that resolves today keeps resolving, each pinned in a route test. More test surface, no runtime cost either way. | |
| Genuinely canonicalise | Redirect non-canonical shapes to the fullest form — would force C-2 back to the redirect option and re-open the 88-02 risk. | |

**User's choice:** Back-compat is a non-goal.
**Notes:** Recorded as CONTEXT.md D-09.

---

## Todo cross-reference

`todo.match-phase 165` returned **153** matches. 149 matched on generic keywords (`frontend`,
`routes`, `svelte`, `lib`) or a bare area tag; four were genuinely on this phase's surface and
were read in full before being put to the operator.

| Option | Description | Selected |
|--------|-------------|----------|
| Fix view transition flicker in Results section | Its two symptoms ARE this phase: scroll lost after drawer close (criterion 2 verbatim) and drawer tab-switch flicker (the parked deferred idea). | ✓ |
| Cold direct navigation to /results crashes the dev server | High priority and certain to be hit by this phase's work, but the cause is `cookies.set()` after response generation in the SSR auth surface, not navigation redraw. | Write-up only |
| Results URL refactor follow-ups | Shorter IDs, multi-election/constituency, upstream voter routes — carried from Phase 62, which created the shape this phase restructures. Separate capabilities. | |
| Disable hover and pointer on disabled Results header button | Results-adjacent by name only; a disabled-anchor affordance bug. | |

**User's choice:** Fold the VT-flicker todo; *"do the context write up for 2 you suggested"* — i.e.
record the cold-`/results` dev-server crash as a known hazard rather than folding it.
**Notes:** The folded todo closes only half outright; its drawer-tab-switch half maps onto the
phase's already-parked deferred idea, so CONTEXT.md requires it be resolved as *closed with a named
residue* rather than silently marked done. The URL-refactor todo is recorded as reviewed-not-folded
with a note that the restructure makes its Phase-62 route snippet stale. The button todo was left
pending and untouched.

---

## Areas accepted at their ★ without discussion

21 decisions. Their alternatives and the cost of each are preserved in
`165-DISCUSSION-POINTS.md`, which remains the reference if a plan wants to reopen one:

- **A-1** branch off `integration/ship-12-squash`, re-apply by hand · **A-2** keep the spike branch as the reproduction rig
- **B-1** loader fix alone, delete `keepReady` · **B-2** self-contained negative control · **B-3** keep the param-keyed predicate, pin it with a unit test · **B-4** keep the `vt-no-names` rule beside the reduced-motion rule
- **C-1** do the restructure · **C-4** (amended by the C-2 ruling — the two guards are kept, not dropped)
- **D-2** both halves of teardown safety · **D-3** move question-info to the host and make it exercisable via the seed · **D-4** reuse `DELAY` + `fly`, skip the animation under reduced motion
- **E-1** three named navigations keep scroll; election change scrolls to top
- **F-1** committed Playwright spec, not `forensics.mjs` · **F-2** one negative-control pair per fix · **F-3** assert node identity · **F-4** run the visual project first, re-capture only an explained diff
- **G-1** delete everything plus a standing grep assertion · **G-2** leave the node scripts under `.planning/spikes/`
- **H-1** register RNAV-01…06 in the existing REQUIREMENTS.md (and correct STATE.md in the same commit) · **H-2** add a `results-redraw` domain to the findings skill · **H-3** one CLAUDE.md subsection

## Claude's Discretion

The operator ruled on all 24 decisions; nothing was returned as "you decide". Left open by
construction: the internal file split of the new route tree within D-08's shape, the naming and
placement of the new test files, plan sequencing and which plan carries which negative-control
pair, and the wording of the RNAV requirement text provided the mapping stays one-to-one.

## Deferred Ideas

- Element-scoped VT (or a plain CSS fade) on the drawer's tab panel, instead of the whole-viewport
  root cross-fade for the in-drawer tab switch — spike 032's open nit, cosmetic. This is the
  residue half of the folded todo.
- A second routed overlay of any kind — would force B-3's predicate to generalise.
- Shorter / slug IDs, multi-election and multi-constituency selection — the reviewed-not-folded
  Phase-62 todo.
