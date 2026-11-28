# `expect.soft` rigidity-contract drift — three sibling files (F10 class)

**Filed:** 2026-08-15, during Phase 140 planning
**Origin:** scoped OUT of Phase 140 deliberately. Phase 140 fixes F10 in `voter-journey.spec.ts`
only; these three carry the same drift class but were not in the sweep's findings list and
widening the phase to cover them was rejected as scope creep.
**Class:** documentation drift — a file's stated assertion contract contradicts its contents.
Same class as F10 / ASSERT-06.

## The finding

Three files declare a rigidity contract they do not honour. Counts verified at HEAD on
2026-08-15 (`grep -o 'expect\.soft(' <file> | wc -l`):

| File | Declares | Actual `expect.soft(` |
|---|---|---|
| `tests/tests/specs/candidate/candidate-journey.spec.ts:48` | `- 0 expect.soft` | **3** |
| `tests/tests/fixtures/candidate/candidateHomePage.fixture.ts:23` | ``NO `expect.soft` `` | **4** (lines 54, 57, 69, 71) |
| `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:43` | ``NO `expect.soft` `` | **6** |

## Boundary — this is contained, not systemic

A full scan of every `tests/` file carrying a rigidity-contract comment was run at filing
time. Every other claimant is **accurate**: all eleven `perm-*.spec.ts` files declaring
"no expect.soft" genuinely have 0, and `tests/tests/utils/voterIntro.ts` likewise. So the
drift is three files, not a pattern — do not plan this as a sweep.

## Why it matters

The rigidity contract is load-bearing: `expect.soft` continues past failure, so a soft
assertion inside a file whose header promises hard-only assertions is a guard that can fail
without stopping the run — the exact blindness class the v2.14/v2.15 fake-guard work exists
to close. A reader trusting the header will mis-read the file's failure semantics.

## Two viable repairs (same either/or as ASSERT-06)

1. **Make the header true** — correct each declaration to the real count, and state why the
   softs are there.
2. **Make the file true** — promote the soft assertions to hard where the contract was the
   real intent. For `candidateHomePage.fixture.ts` the four softs are task-enablement and
   status checks that look genuinely intended as soft (a task list where you want all
   mismatches reported at once); for the other two this needs a look.

Prefer (2) where the contract was intent and (1) where the softs are deliberate — decide
per file, not globally.

## Do NOT

Do not "fix" this by deleting the contract comments. A file with no stated contract is
worse than one with a wrong contract: the wrong one is falsifiable, the absent one is not.

## Suggested guard

Phase 140 plan 02 builds a config-load counted guard for `voter-journey.spec.ts`. If that
guard generalises cheaply to a per-file declared-vs-actual check, these three become its
first additional subjects — that would close the class rather than the instances. Check
what Phase 140 actually shipped before assuming it generalises.
