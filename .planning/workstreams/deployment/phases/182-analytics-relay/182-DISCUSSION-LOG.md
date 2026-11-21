# Phase 182: Analytics Relay - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-11
**Phase:** 182-Analytics Relay
**Areas discussed:** 182-1 server pageview, 182-2 a consenting visitor's answers, 182-3 sensitive events, 182-4 vocabulary, 182-5 event shape, 182-6 where the modes live, 182-7 relay and `trackEvents`, 182-8 settings migration, 182-9 transport, 182-10 relay path, 182-11 `Sec-GPC`, 182-12 Contestant and Admin, 182-13 privacy and terms text, 182-14 tests

---

## How this discussion was held

The discussion was not interactive. Every decision of phases 181, 182 and 183 was written into one document,
`.planning/workstreams/deployment/v2.17-181-183-DISCUSSION-POINTS.md`, with its options as checkboxes and one
option marked ★ RECOMMENDED. The operator filled it in one pass on 2026-10-11. An unticked decision takes its ★;
a note beats a box. That document holds every option presented, with its cost, and the table "Rulings as read,
2026-10-11" at its end. It is the full record and is not repeated here.

## The operator's choices

Ten decisions were left unticked and took the ★. Ticked on the ★ with a note: 182-1, 182-2. Overruled: 182-1b (the pageview is recorded whenever a provider is configured, whatever `trackEvents` says), 182-12 prompt (terms acceptance counts as consent), 182-12 gap (fixed in the baseline before the freeze).

## Notes the operator wrote

- **182-1:** "Include duration, and all other route params except those which identify the entity or nomination."
- **182-2:** "We can keep the wording bc we won't be able to connect the session to the user."
- **182-12 prompt:** "Add a second opt-out checkbox to the ToU acceptance page if tracking is enabled."

Six readings of these notes are listed in the discussion document under "Six readings I made of the notes" and marked **(reading)** in `182-CONTEXT.md`. The operator has not yet confirmed them. Requirements RELAY-10 and RELAY-15 and criterion 3 of the roadmap were reworded on the same day to follow ruling 182-1b.

## Claude's Discretion

See the "Claude's Discretion" list of `182-CONTEXT.md`.

## Deferred Ideas

See the "Deferred Ideas" section of `182-CONTEXT.md`.
