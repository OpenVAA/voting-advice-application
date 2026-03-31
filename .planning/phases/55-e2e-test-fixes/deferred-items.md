# Deferred Items - Phase 55

## Data Loading Race Condition in (located)/+layout.svelte

**Found during:** 55-01, Task 2 investigation
**Severity:** High (blocks all voter journey E2E tests)
**File:** `apps/frontend/src/routes/(voters)/(located)/+layout.svelte`

**Description:**
The `(located)` layout loads question and nomination data asynchronously, provides it to the DataRoot via `$dataRoot.update()`, waits for nominations to settle via `$effect.root`, then sets `ready = true` to render children. The reactive propagation chain through the `toStore`/`fromStore` bridge between DataContext (rune-based version counter) and VoterContext (derived values) has latency. When the questions layout renders, `opinionQuestions` may still be empty because the `$derived` chain hasn't fully propagated.

**Impact:**
- ALL voter journey E2E tests fail (19 direct + 55 cascade)
- Candidate tests also affected (candidate login/questions pages stuck in Loading state)
- Blocks verification of the 4 fixme'd test fixes from Phase 55

**Suggested fix approaches:**
1. Make DataContext fully rune-native (eliminate `toStore`/`fromStore` bridge)
2. Add a synchronization mechanism between DataRoot update and downstream `$derived` values
3. Move data provision from `$effect` callback to synchronous component initialization
4. Use `flushSync()` after `$dataRoot.update()` to force synchronous propagation

**Not fixed because:** Architectural change (Rule 4) -- requires restructuring the DataContext or the data loading flow in the `(located)` layout.
