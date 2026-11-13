---
created: 2026-10-09T00:00:00.000Z
title: The browser's copy of an entity stays as last loaded — the home, the menu and the task state are stale after a nomination changes, until the entity-level load reruns
area: Contestant app / data
severity: minor
source: Phase 176 plans 06, 08, 10 and 12 (each summary's § For Phase 177); 176-UI-SPEC.md § UI Considerations, the row "An entry that the browser shows open and the server has closed"; filed by 176-19
owner: Phase 177, whose own write of a nomination must rerun the entity-level load
files:
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.server.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/+layout.server.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
---

## What is so today

The entity's nominations reach the browser through one load, the entity-level `+layout.server.ts`. It depends on the two entity params alone and has **no dependency key**, so it reruns when the selected entity changes and on a full page load, and at no other time.

Everything that follows a nomination reads that load's data:

- `contestantCtx.nominations` is derived from page data (`page.data.contestantUserData?.nominations`), not from the store.
- `contestantCtx.taskState`, with `tasks`, `nextStep`, `previewOpen` and `profileComplete`, takes "has a nomination" from that list.
- The question data is read by the same load, for the elections of those nominations.
- The store's `reloadEntityData` reads with `loadNominations: false` and updates none of these.
- The two election effects of the context still read `userData.current.nominations`, the list `init` was given.

The server is right all the same: the group's load and the preview's load each `await parent()`, which reruns the parent loads on the server in that request, so the gate decides on fresh rows. What is stale is the browser's copy.

## What a user meets

After an administrator adds, confirms or removes a nomination while the user has the app open:

- the home, the menu and the nominations view show the state of the last load until the next full load;
- an entry the browser shows open and the server has closed leads, when followed, to the home with nothing said (asserted by the stale-entry tests of `perm-no-nomination`);
- an entry the server has opened stays disabled in the browser until the next full load.

Phase 176 accepts this: no page of the phase writes a nomination.

## What Phase 177 must do

A nomination written by the user must **rerun the entity-level load** — `invalidateAll()`, or a dependency key on that load and `invalidate(key)` — for the list, the question read, the task state and the gate to follow. Inside the `(nominated)` group nothing reruns the group's load at all. The write has to reach both `contestantCtx.nominations` (page data) and `userData.current.nominations` (the store), or the two election effects and the view disagree.

## Not decided

Whether the browser should also notice an administrator's change without a full load (a poll, a re-read on focus, or a message on the home when a followed entry was refused). Nothing asks for it today.

## Update 2026-10-11 — the user's own nomination write reruns the entity-level load; an administrator's change still waits for a full load (Phase 177 close)

The nomination editor's save calls `invalidateAll()` after `setEntityNominations`, whatever the write answered, which reruns the entity-level load: the home, the menu, the task state, the nominations view and the editor's guard follow the user's **own** change to its nominations without a full page load. Held in a browser by `follow: after a first save the home, the nominations view and the questions follow without a full page load` and `follow: a question that no longer applies is neither asked nor counted, and its answer returns with the nomination` of `tests/tests/specs/perm/contestant-nominations.spec.ts`. The entity-level load was given no dependency key. **What stays open:** a change an administrator makes (a nomination added, removed or confirmed, a lock set) is still seen only when a load reruns: at the next full page load, or at the user's next save in the editor. A lock an administrator sets while the editor is open is met at the save (`stale:` and `closing:` of the same spec). A consequence that is new with the editor is filed as `2026-10-11-177-a-save-built-on-nominations-an-administrator-changed.md`.
