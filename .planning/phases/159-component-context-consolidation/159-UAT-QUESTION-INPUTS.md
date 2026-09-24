# Operator acceptance path — 2-choice and multi-select question inputs

**For:** the operator's own UAT of the two question-input capabilities named in the review comment on
`QuestionChoices.svelte:1`.
**Produced by:** Phase 159 plan 10, against post-extraction code (159-09 restructured the input component
immediately before this).

## When to run this, and what it does not block

The operator's instruction, verbatim:

> "I just need to UAT-check the UI for 2-choice and multi-select choices, but it should happen only at the
> end of the milestone."

So **this run is scheduled for milestone close (v2.15), not for Phase 159.** The path below is ready now;
the run is deliberately deferred. **Phase 159 does not wait on it**, no requirement is blocked pending it,
and it is not an outstanding work item inside this phase. Nothing here asks for code to be written — both
capabilities already exist and ship today. This document exists so the acceptance run costs minutes rather
than an afternoon of hunting.

## Prerequisites (about three minutes)

```bash
yarn db:reset                          # migrations + seed.sql bootstrap, DB only
yarn db:seed --template e2e/base       # the canonical base dataset
yarn dev                               # Supabase + package watcher + Vite
```

Then open **http://localhost:5173**. If port 5173 is taken, `yarn dev` now fails loudly rather than
drifting to another port; set `FRONTEND_PORT=<port>` in the root `.env` and use that port instead.

**Why `e2e/base` and not `default`.** `e2e/base` is the only template carrying all four shapes this run
needs: a boolean opinion question, a boolean info question, a multi-select question with a **range**
window (2 to 3), and a second multi-select question with an **exact** window (1 and only 1). The `default`
template has one multi-select question and no second window, so half the expectations below are
unreachable on it.

**Every seeded question shows its own identifier in its visible text**, for example
`[qu-opin-base-5-boolean] Base opinion 5 — Boolean.` You never have to guess which question you are
looking at; read the bracket.

---

## Path A — the voter app (no login, about five minutes)

This is the whole acceptance surface for both capabilities. Start at http://localhost:5173, pick any
election and constituency when asked, then start the questions and step forward with **Next** / **Skip**.
The four questions below are all in the first (main) opinion category, in this order.

### A1. The 2-choice UI — `[qu-opin-base-5-boolean]`

Two radio buttons, **No on the left, Yes on the right** (low to high, matching the ordinal questions'
left-to-right convention). Expect:

| # | What to do | What should happen |
|---|---|---|
| 1 | Click **Yes** | It selects, and after a short beat the app **advances by itself** to the next question. Boolean and single-choice questions auto-advance; nothing else does. |
| 2 | Come back with **Previous** | Your answer is still selected. |
| 3 | Click the already-selected choice again | It stays selected and the app advances again. It does not toggle off. |
| 4 | Press **Tab** until the pair takes focus | Focus lands on the **group as a whole**, not on one button at a time. |
| 5 | Press **←** / **→** | The focused choice changes **and selects at the same time** — this is standard radio-group behaviour, not a bug. |
| 6 | Press **Space** or **Enter**, or Tab out of the group | The answer is committed at that point. |
| 7 | With a screen reader on | Each button announces its own label ("No", "Yes") and the group announces the question text. |

### A2. Multi-select with a range window — `[qu-opin-base-7-multichoice]`

Four checkboxes, window **2 to 3**. Below the choices there is a helper line reading
**"Select 2 to 3 options."** Expect:

| # | What to do | What should happen |
|---|---|---|
| 1 | Tick **one** box | The answer is **not** saved. The action button still reads **Skip**, and the delete-answer control stays unavailable. The box stays ticked — your in-progress selection is never wiped out from under you. |
| 2 | Tick a **second** box | Now it is saved. The action button becomes **Next** and the delete-answer control becomes available. |
| 3 | Tick a **third** | Still saved, still Next. |
| 4 | Tick a **fourth** | Over the maximum. The tick **stays visible** — nothing is disabled or refused on screen — but the answer is no longer saved, so the button falls back to **Skip**. This is deliberate: the app never disables an unticked box, it tells you through the button instead. |
| 5 | Untick back down to **zero** | The answer is deleted; the button is **Skip** again. |
| 6 | Tick two, go to the next question, come back | Your two ticks are still there. |
| 7 | **Tab** through the choices | Each checkbox is reachable on its own (unlike the radio pair in A1), and **Space** toggles the focused one. |
| 8 | Nothing you do here should auto-advance | Multi-select never jumps forward on its own; you always move with Next or Skip. |

### A3. Multi-select with an exact window — `[qu-opin-base-8-multichoice-exact]`

Same control, window **exactly 1**. The helper line changes wording to the exact-count form. Expect
ticking one to save, and ticking a second to un-save it (two is over the maximum of one) while both ticks
remain visible.

**One known wording wart, not a regression.** The English helper string has no singular form, so this
question reads **"Select 1 options."** Every other locale carries its own wording. This is pre-existing
copy, unrelated to Phase 159 — please do not file it as a finding of this run unless you want the copy
changed.

### A4. The zero-selection rule

Across A2 and A3 the same rule should hold every time: **zero ticks is never a saved answer.** Emptying a
multi-select deletes the answer rather than storing an empty one, and the button returns to Skip. If you
ever reach a state where the app treats an empty multi-select as answered, that is a defect.

Phase 159 closed a hole in exactly this rule. A question could be authored with a minimum of zero, and the
app would then have accepted an empty answer as saved, contradicting its own stated rule. That authoring
is **not reachable from any seeded question** — nothing in `e2e/base` or `default` authors a zero minimum
— so this run cannot exercise that specific case by clicking. What you *can* observe is the same rule from
the user's side, which is A2 step 5 and A3. The unreachable half is held by a unit test
(`apps/frontend/src/lib/utils/multiChoiceValidity.test.ts`).

---

## Path B — the candidate app (optional, login required)

Worth ten minutes only if you want to see the **same two question kinds rendered by a different control**,
which is genuinely different UI rather than a repeat of Path A:

- **2-choice as an info question** renders as a **toggle switch**, not a pair of radio buttons.
- **Multi-select as an info question** renders as a **dropdown plus a row of removable chips**, not a
  column of checkboxes.
- **Opinion questions in the candidate app** use the same control as Path A, with a **Save** button in
  place of Next.

**The cost, stated honestly:** `e2e/base` seeds no candidate with a known password. Reaching the candidate
app means registering `unregistered-aa@test.openvaa.local` through the invite email and picking up the
link from Mailpit at http://127.0.0.1:54324. If that is more than you want to spend, Path A is the
acceptance run and Path B is optional.

Once in: the toggle and the chips both live on **/candidate/profile**; the opinion questions are under
**/candidate/questions**.

---

## What a failure looks like

Use this to tell a defect from behaviour that is merely surprising.

**These are correct, even though they look odd at first:**

- Arrow keys selecting as they move in the 2-choice pair. That is how radio groups work.
- A tick staying visible while the answer is not saved (A2 step 4). The app deliberately never disables an
  unticked box; it reports validity through the action button.
- Multi-select not auto-advancing while 2-choice does.
- "Select 1 options." in English.

**These are defects, please report them:**

- An empty multi-select treated as answered — the button reads Next with nothing ticked.
- An out-of-range selection surviving a reload, i.e. an invalid answer that actually persisted.
- Your ticks disappearing while you are still choosing.
- The helper line advertising a range the button then refuses — for instance "Select 0 to 3 options."
  while an empty selection will not save.
- The 2-choice pair not reachable by keyboard, or a screen reader not announcing the choice labels.
- Any answer that saves but reads back empty after a reload.

Anything you report is most useful with the bracketed question identifier from the screen, the locale you
were in, and whether you were using pointer or keyboard.
