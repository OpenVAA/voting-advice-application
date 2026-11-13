---
created: 2026-10-11T00:00:00.000Z
title: A save in the nomination editor deletes a nomination an administrator added while the editor was open, and writes over a value the administrator changed — with no refusal
area: Contestant app / nomination editor
severity: major
source: Phase 177 item P-18 of 177-EXECUTION-RULES.md; operator item G18, answered (a) on 2026-10-11 with its tension against 177 U-02 stated; 177-18-SUMMARY.md § For plan 177-21; filed by 177-21
owner: unassigned — the operator accepted the behaviour as built; whoever revisits the editor's save takes the located change below
files:
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/+page.svelte
  - apps/frontend/src/lib/contestant/nominations/nominationDraft.ts
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - tests/tests/specs/perm/contestant-nominations.spec.ts
---

## What happens

The details step builds its cards from the entity's nominations as the entity-level load read them when the editor was opened. **Nothing is read again before the write**: `handleSubmit` hands `desiredSetOf(cards)` to `setEntityNominations`, and the database's function makes the stored rows in its reach equal to that set.

Between the load and the press an administrator may have changed the entity's nominations. Then:

| The administrator | The save |
|---|---|
| removed a nomination the user has a card for | is refused: the set names an `id` that is no longer a nomination the function may write. After the re-read the page finds that the nominations are no longer those the cards were built on, builds the cards again and says so (`changed`). **Observed** in a browser: `refused: nominations removed elsewhere are shown as they now are and the draft is dropped` |
| **added** a nomination in an election the editor reaches | **deletes it**: the row has no card, so the set does not name it, and a nomination in reach that the set does not name is deleted. No refusal, no message |
| **changed** a value of a nomination the user has a card for (the symbol, the parent) | **writes over it** with the card's value where the user changed that card; an unchanged card sends `keep` for the parent and the stored symbol as the card read it. No refusal, no message |
| set a lock | is refused by the policies; the re-read leads to the nominations view (`stale:`, `closing:`) |

Both writers are authorised, and a row the user writes returns to the confirmation queue. The UI contract's rule U-02, "the editor never merges, moves or drops a nomination it did not create", was written for the cards the user sees; a row added meanwhile has no card. The plan checker rated this a contradiction at the edge of that rule. The operator, shown it, kept the behaviour: G18 (a), recorded as the operator's acceptance against U-02's sentence.

## The change that would close it

Option (b) of P-18: **one re-read and one comparison before the write**, in the details page's `handleSubmit`. Read the entity's nominations again, compare them with the ones the cards were built on (`sameNominations` of `nominationDraft.ts` already makes that comparison after a refused save), and where they differ, rebuild and say `changed` without writing. That also turns a lock away before the database is asked. It narrows the window and does not close it: the write is still not conditional on what it read. A version or an `updated_at` of each row carried in the set and checked by `set_entity_nominations` would.

## Not established

The second and third rows of the table are read from the function's header and the handler, **not provoked in a test**: no pgTAP cell and no E2E test adds or changes a row between the editor's load and its save.
