# Phase 176 — the cause of the `Error formatting nomination` line, as read in the application

Everything below was read from one run and from its own files. Where a sentence is an inference, it says so.

## The run

- Label `176-01-d9-reading`, directory `tests/e2e-runs/176-e2e/176-01-d9-reading`, made through `tests/scripts/e2e-run.sh` directly with `--no-db-reset --project perm-organization-editing`.
- Head `9e4f493cc0399d3f2723a7321e7dec3843cecafc`, which is tree-equal outside `.planning/` to the base commit `4c930217c`: the application is as Phase 175 left it. The working tree held two uncommitted probe tests and nothing else (`worktree-status.txt`: the two spec files and the operator's untracked file). Copies of both specs as the run ran them are kept beside the run directory.
- Started `2026-10-09T00:02:05Z`, ended `2026-10-09T00:08:15Z`. Wrapper exit 0; its `exit` file holds 0; no void marker; one preflight success, no preflight failure.
- 196 tests in 88 projects: 196 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run. 194 are the committed tests of the slice and 2 are the probes: `perm-organization-editing` 47 of 47 (46 and one probe), `perm-answers-locked` 4 of 4 (3 and one probe).

Each probe collected every console message of its page whose text holds the logger's phrase, printed what it collected once behind the prefix `D9-PROBE`, and asserted nothing. The printed lines are in the run's `stdout.log` and in `results.json` (the test's `stdout` and its attachment `d9-probe`); the same console lines, forwarded by the dev server with their full text, are in the run's `devserver.log`.

## Probe 1 — the unconfirmed candidate of the organization-editing dataset

Run in `perm-organization-editing.spec.ts` under the stored session of `e2e-perm-organization-editing-ca-unconfirmed`, after the state step that spec's own candidate tests begin with (`setCandidateState(…, { confirmed: false, …the seeded names })`). That candidate has exactly one nomination: the dataset's template gives it `nom-ca-unconfirmed` and no other, and the page listed one card.

**(a) A full load of the profile.** `page.goto('/en/contestant/profile')`, which ended on `/contestant/candidate/097b392f-0908-4de8-a5a3-3c7ffd4f5886/profile`; then a wait until the nominations section showed its constituency field; then three seconds more.

- Lines collected: **1**, 708 ms after the navigation began. It names election id `16a27d1a-4252-4581-990d-41b022fdc60f`.
- The card: resolved 1208 ms after the navigation began. One card, titled `[EL1] Organization-editing election`, its constituency field holding `[CO1] Only constituency`.

**(b) The same page entered from the home by a click.** `page.goto('/en/contestant')`, which ended on that candidate's home; a wait for the home's status message and its profile entry, then three seconds; a marker written on `window`; a click on `contestant-home-profile`; a wait for the profile URL and for the constituency field; three seconds more.

- Lines collected while the home loaded: 0.
- Lines collected since the click: **0**.
- The marker was still on `window` afterwards: the profile was reached in the document the home had loaded, by a client navigation and not by a page load.
- The card: resolved 114 ms after the click, the same card as in (a).

The forwarded line of this probe, from `devserver.log`:

```
[frontend] 3.07.52 [vite] (client) [console.error] {"level":50,"time":1791504472297,"msg":"Error formatting nomination: Error: Child in collection elections with id 16a27d1a-4252-4581-990d-41b022fdc60f not found","severityText":"ERROR"}
```

## Probe 2 — the candidate of the answers-locked dataset

Run in `perm-answers-locked.spec.ts` under that spec's own stored session, as the last test of its authenticated describe. `page.goto('/en/contestant/profile')`, which ended on `/contestant/candidate/8dda2504-7338-4044-97ce-48c7e30b4652/profile`; a wait until the nominations section listed a nomination; three seconds more. That candidate has one nomination (the template's builder gives one for each election, constituency and candidate, and it has one of each), and the page listed one card.

- Lines collected: **2**, 655 ms and 657 ms after the navigation began. Both name election id `ffce6a1f-513f-4ac6-968e-bee6cb0e8664`.
- The answers-locked warning was visible 289 ms after the navigation began; the nomination was listed at 678 ms.
- The card: one card, titled `[EL1] Election 1`, its constituency field holding `[CO1A] Only constituency`.
- The spec's committed profile test, which opens the same URL under the same session, ran 531 ms in this run and no line falls inside it.

The forwarded lines of this probe, from `devserver.log`:

```
[frontend] 3.04.58 [vite] (client) [console.error] {"level":50,"time":1791504298104,"msg":"Error formatting nomination: Error: Child in collection elections with id ffce6a1f-513f-4ac6-968e-bee6cb0e8664 not found","severityText":"ERROR"}
[frontend] 3.04.58 [vite] (client) [console.error] {"level":50,"time":1791504298106,"msg":"Error formatting nomination: Error: Child in collection elections with id ffce6a1f-513f-4ac6-968e-bee6cb0e8664 not found","severityText":"ERROR"}
```

## Every line of the run, by the test it fell inside

The run's `devserver.log` holds the line 50 times, every one from the browser's console and every one inside a test that loads a profile, matched by the line's own `time` against each test's start and duration in `results.json` (`tests/e2e-runs/176-e2e/176-01-d9-reading.lines-by-test.txt`). Phase 175's closing run holds it 47 times; the three more are the probes' three.

| Lines | Where | Spacing |
|---|---|---|
| 2 | `contestant-a11y-scan`: the profile scan and its dark twin, which run side by side | 183 ms apart |
| 1 | `perm-localisation-positive`: the localisation walk | |
| 40 | `perm-organization-editing`: its committed tests that load a profile, the two scans of the next row aside — 1, 2 or 4 lines inside a test | 384 ms or more apart inside a test |
| 2 and 2 | `perm-organization-editing`: the scan `org-profile-answers-locked` and its dark twin, each of a profile while the answers lock is on | **3 ms apart** in each |
| 2 | the probe of the answers-locked dataset | **2 ms apart** |
| 1 | the probe of the organization-editing dataset | |
| 0 | `contestant-journey`, which reaches the profile by a click | |
| 0 | the three committed tests of `perm-answers-locked` | |

Over the whole run, three pairs of consecutive lines are less than 50 ms apart — the probe's pair and the two scans' pairs, each pair naming one election id — and every other two consecutive lines are 183 ms or more apart. How many times each committed test loads a profile was not counted, so "one line for each page load" is read for the probes alone and inferred for the committed tests.

The same matching over Phase 175's closing run (`tests/e2e-runs/175-e2e/175-13-final`, read and not changed) gives the same picture: two pairs of consecutive lines less than 50 ms apart, both 2 ms and both inside its two `org-profile-answers-locked` scans, and every other two consecutive lines 78 ms or more apart.

## The four points

POINT 1: held

Probe 1 (a): one nomination, one line. The entity's one card named one election and the one line names one election id.

POINT 2: held

Probe 1 (a): after the page settled the card showed `[CO1] Only constituency` under `[EL1] Organization-editing election`. Probe 2's card resolved too, to `[CO1A] Only constituency` under `[EL1] Election 1`.

POINT 3: held

Probe 1 (b): no line since the click, in the same document as the home's load, and the card resolved. `contestant-journey` in the same run holds no line either.

POINT 4: held

**This verdict line was changed by the orchestrator on 2026-10-09, and the point it judges was restated.** As the plan first wrote the point — "the answers-locked profile, held open past hydration, logs one line" — the reading did not hold it: the run recorded two. The executor wrote that as its verdict, plan 176-01's verify exited 1 on it, and the phase stopped, as designed. The cause of the second line was then found and confirmed in a component test of the real components (the section "Supplementary reading — the second line under the answers lock" below, and `.planning/debug/nomination-line-twice-answers-locked.md`); it was not re-read in a browser. The point as restated, which the evidence holds:

> The answers-locked profile, held open past hydration, logs the line: one line for each formatting of a nomination's card that happens before the data root holds its election. With the answers lock off a card is formatted once in that window; with it on, twice — two lines for the profile's one nomination — because the user-data store's answers-lock effect runs between the entity layout's effect and the root layout's and replaces `userData.current` by an equal copy. The card resolves afterwards.

POINT 1 as written ("one line for each nomination") is true with the lock off only; with it on, the count is two for each nomination. The operator's ruling this reading serves (decision D9 (a) of 2026-10-08) asks that the cause be found before the code that logs the line is deleted: it is found. The new nominations view cannot inherit either condition — it resolves no name on the data root, and its list is derived from page data, not from `userData.current`. The defect the reading uncovered in the store (an equal copy written on every run of the lock effect) survives the block's deletion and is filed as a todo.

What the executor recorded for the point as first written:

Probe 2: the profile held open past hydration logged **two** lines, not one, for its one nomination. A line does appear once the page is held open: the first came 655 ms after the probe's navigation began, and the committed test of the same page lasts 531 ms from its start to its end and holds no line. So the page is not silent; but the number read is two.

## The cause, as this reading leaves it

**What the application showed.** On a full load the profile's nominations block is formatted before the data root holds the election, and again, resolved, a moment later: every card in both probes ended resolved, with its election's name and its constituency's name. Entering the same page by a client navigation logs nothing. So the line is produced at hydration, not by the data: no nomination was shown without its election once a page had settled.

**What the application did not show.** That a full load logs one line for each nomination. Probe 1 read that with the answers lock off, and outside the answers-locked state no two lines of the run are closer together than 183 ms. While `access.answersLocked` is on it does not hold: two lines arrived 2 to 3 ms apart, naming one election, in every profile the run loaded in that state — probe 2 and the two `org-profile-answers-locked` scans — and in the same two scans of Phase 175's closing run. *Inferred from the spacing and not observed:* the block is formatted twice before the election arrives. **Why the block is formatted a second time in that state is not established**: it was not read in the code and was not in the research's model, which logged exactly one line on a full load.

**The two research assumptions.**

- A2 (the mechanism in the application is the one reproduced in the model). Of its three falsifiers, two did not occur: no line on entry by a click, and no card that never resolves. The third did, in the answers-locked state: a number of lines that is not the number of nominations.
- A3 (the answers-locked spec's profile test logs nothing because its page closes before hydration). Its falsifier — no line from that profile when it is held open — did not occur: held open, the page logged from 655 ms after its navigation began, and the committed test lasts 531 ms and holds no line.

## What follows for the nominations view

The nominations view takes the names of an election and of a constituency from its own read and formats nothing against the data root; nothing in this reading speaks against that, and the reading shows why it is needed: a view that resolved names on the data root at hydration would log this line on every full load, and twice while answers are locked.

The plans delete the profile's nominations block only on a finding whose four points stand. The fourth does not stand as it is written. The phase stops at plan 176-01 with this finding as its report; what the second line under the answers lock means for the plans is the orchestrator's to decide, and nothing of the application was changed.

## Supplementary reading — the second line under the answers lock (2026-10-09)

Made after the reading above, at head `35f8df68a` (tree-equal outside `.planning/` to the base commit), by a component test and by reading the code. No E2E run was made and nothing of the application or of the tests was changed. The four verdict lines above are as plan 176-01 wrote them; what follows explains the fourth and proposes a wording for it, and changing the line is the orchestrator's to decide. The whole session is in `.planning/debug/nomination-line-twice-answers-locked.md`.

**Status: CONFIRMED in a component test of the real components; not re-read in a browser.** The doubling was reproduced on unmodified code, went away with a throwaway change aimed at the mechanism, and came back when the change was reverted.

### The mechanism

The second line is a second formatting of the **same card**, in place. It is not a second block, not a second page and not a remount.

1. *The first line's cause, as above.* On a full load the entity layout's effect fills the user-data store before the root layout's effect gives the data root its elections, and Svelte updates the profile's `{#each}` in between: the card is created, `parseNomination` throws and logs.
2. *What the lock adds.* The user-data store has an effect of its own that clears unsaved edits while answers are locked (`apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts`, the `$effect` in the constructor). It writes `draft.answers.set({})` and `#staged = {}` on every run, whether or not there is anything to clear. The store belongs to the contestant context, which the Contestant App's layout creates — an ancestor of the entity layout and a descendant of the root layout — so on a full load the effect's first run falls **between** the two effects of step 1.
3. *Why that formats the card again.* Each of the two writes puts a new object into a signal that the store's `current` is derived from, and `current` is a JSON clone. So `userData.current`, its nominations array and every nomination object in it are replaced by equal copies. The page's `{#each}` is unkeyed: it sets its item to the new object, the `{@const … = parseNomination(nomination)}` of that item recomputes — the data root still has no election — and logs the second line. Then the root layout's effect runs and the card resolves.

With the lock off the store's effect returns before it reads or writes anything, and there is one line.

So the second line is the first line's cause reached a second time, and what reaches it is a small defect of its own in the store: a replacement of `userData.current` that changes nothing.

### The evidence

**Read in the code:** the store's effect and what `current` reads; that `parseNomination` has one definition and one call; where each of the three effects is created; in the installed `svelte` 5.57.1, that a component's effects run after its descendants' and that `flush_queued_effects` updates the block effects one user effect dirtied before it runs the next.

**Measured, in a component test** (vitest, the frontend workspace). Mounted: the real profile page inside the real entity layout, under the real contestant context with its real user-data store, over the real data context and data root, with the real `MainContent`, `InputGroup` and `Input`. Stand-ins: a root component holding the root layout's data-root effect as that layout writes it; a component calling `initContestantContext()` where the Contestant App's layout does; a fake app context that forwards the data root from the real data context and holds the settings. The lock was set before the mount and nothing else differed between two cases of a pair. Recorded: every logged line holding the phrase, every call of `parseNomination`, the entity layout's and the root layout's writes to the data root, and the store effect's write.

| Case, on unmodified code | Lock off | Lock on |
|---|---|---|
| one nomination — lines | 1 | **2** |
| one nomination — calls of `parseNomination` | 2 (threw, resolved) | 3 (threw, threw, resolved) |
| two nominations — lines | 2 | **4** |
| two nominations — calls | 4 | 6 |
| one nomination, the data root given its elections before the page is created — lines | 0 | 0 |
| the same — calls | 1 (resolved) | 2 (resolved, resolved) |

The order recorded under the lock, one nomination: the entity layout's effect → the store's `init` → the first call throws, line 1, no card in the document yet → **the store's answers-lock effect writes** → the second call throws, line 2, one card in the document → the root layout's effect → the third call resolves. With the lock off the store's write and the second call are absent and the rest is the same.

In every case: the page was initialised once; no card after the mount and one card for each nomination after the flush, titled with its election's name, its constituency's name in the field and its state "confirmed"; the card that was in the document at line 2 is the same DOM node as the card after the flush. Line 1's stack comes from the `{#each}` creating its item; line 2's from an `{#if}` of the existing card being updated; both are inside one synchronous flush.

**The throwaway changes, each reverted with `git checkout --` on the store's file:**

| Change to the store's effect | Lock on, one nomination | Lock on, two nominations |
|---|---|---|
| none | 2 lines | 4 lines |
| both writes made only when there is something to clear | **1 line**, 2 calls | **2 lines**, 4 calls |
| reverted | 2 lines | 4 lines |
| only the draft's write guarded | 2 lines | 4 lines |
| only the staged properties' write guarded | 2 lines | 4 lines |

The lock-off cases read the same under every change. Either write alone is enough for the second line; guarding both removes it.

**What the browser runs show, and the mechanism accounts for:** two lines for one nomination in every profile loaded under the lock (the probe and the two `org-profile-answers-locked` scans here, the same two scans in Phase 175's closing run) and one line everywhere else; one election id in both lines of a pair; 2 to 3 ms between them, which is one flush; one card, resolved. And the lock alone decides it: under one describe, on one dataset and one election id, `org-profile-editable` holds one line and `org-profile-answers-locked` two.

**Not done.** The throwaway change was not run in a browser, so that it removes the second line in the application itself is inferred from the component test and from the fit above. The test mounts and does not hydrate. No entity with more than one nomination was loaded under the lock in a browser; the mechanism says two lines for each of its nominations. Whether a frame is painted between the lines and the resolved card was not measured in a browser.

### The candidates that the reading rules out

- *A second place or a second instance of the block under the lock:* one call site in the page; one page initialisation and one card in the test.
- *The block destroyed and created again at hydration:* the card at line 2 is the node that stays.
- *Two reactive computations:* one `{@const}`; both lines' stacks pass through it.
- *The datasets differ and not the lock:* one entity of one dataset, one line with the lock off and two with it on; in the test, identical data.
- *The settings arriving in a later flush:* they are in the app context's initial state and the warning is in the server-rendered markup. There is one more pass before the elections arrive, and it is the store's own effect.

### What it means

- **For the user:** nothing beyond the console. One card, the right names, no remount; the unresolved state and both lines lie inside the one flush that ends with the resolved card (measured in the test, inferred for the browser).
- **For the nominations view (plan 176-12):** it inherits neither cause. It resolves no name on the data root, and its list is the context's `nominations`, which plan 176-06 derives from page data and not from `userData.current`, so the store's replacement does not reach it. Nothing in the mechanism re-creates part of a page, so a view with no loading state has nothing to lose to it.
- **For `NotEditableNote` (plan 176-11):** not reached. It is rendered under the context's `answersLocked`, which follows the app settings.
- **Outside the block:** the store's replacement of `userData.current` survives the block's deletion. While answers are locked it happens once for each entity that is loaded, and everything that reads `userData.current` is updated once more to the same values. Nothing is remounted and nothing is lost, every field being locked in that state; it is wasted work, and the reason one line became two. It is a todo of its own and not part of this phase: write only when there is something to clear, both writes, with a test on the store.

### The fourth point, in words the evidence supports

Proposed, for the orchestrator's ruling — the line above is unchanged:

> The answers-locked dataset's profile, held open past hydration, logs the line: one line for each formatting of a nomination's card that happens before the data root holds its election. With the answers lock off a card is formatted once in that window; with it on, twice — two lines for the profile's one nomination — because the user-data store's answers-lock effect runs between the entity layout's effect and the root layout's and replaces `userData.current` by an equal copy. The card resolves afterwards.

The first point is true as written only with the lock off; with it on, a full load logs two lines for each nomination.
