# Phase 159 — deferred items

Out-of-scope discoveries made during execution. Each is logged rather than fixed, per the executor scope
boundary: only issues directly caused by the current task's own changes are auto-fixed.

## 1. `PasswordSetter.svelte.test.ts` fails `prettier --check` — re-encountered, ALREADY FILED

- **Found during:** 159-10 Task 1, when a whole-repo `yarn format` surfaced it alongside this plan's own
  files. It was reverted out of the working tree rather than absorbed into a 159-10 commit.
- **File:** `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte.test.ts:108`
- **Detail:** the `if (!confirmation) throw new Error(...)` line is 121 characters, past the configured
  print width. `npx prettier --check` on the file exits 1; `yarn lint:check` exits 0.
- **Introduced by:** `65ba96fdc refactor(159-02): derive PasswordSetter's outputs behind a change callback`.
- **Already filed as `.planning/WINDOWS.md` entry 232** by 159-09, which hit the same thing. **Not
  re-filed here** — a second ledger row for one defect makes the ship gate count it twice.

## 2. Stale sub-branch numbering in `Input.svelte`'s markup comments

- **Found during:** 159-10 Task 2, while re-measuring the branch that renders the boolean input kind.
- **File:** `apps/frontend/src/lib/components/input/Input.svelte:449,459,474`
- **Detail:** 159-09's extraction renumbered the top-level markup branches to 1 through 6, but the three
  sub-branch comments inside the last one still read `5.1 Boolean`, `5.2 Select`, `5.3 All other inputs`.
  They now sit under branch **6**, so the numbering points at a parent that moved. Comments only — no
  behaviour, no assertion, nothing a gate reads.
- **Why not fixed here:** outside this plan's blast radius, and 159-10 changes nothing in `Input.svelte`.
  A comment-only correction there would put an unrelated file in a validity-fix commit.
- **Suggested owner:** whichever plan next edits `Input.svelte`.

## 3. Line anchors cited by 159-10's own plan had drifted (recorded, not deferred)

Recorded here so the pattern stays visible across the phase rather than only in one summary. The plan and
`159-RESEARCH.md` cite `Input.type.ts:31` for the boolean kind and `Input.svelte:602`/`:596` for the branch
that renders it. Measured at 159-10: the declaration is at `Input.type.ts:37` and the branch at
`Input.svelte:450` — and `Input.svelte` is 540 lines, so line 602 does not exist. 159-09 added two kinds
above the boolean entry and shortened the component by 134 lines. Every anchor was re-measured before being
cited in `159-UAT-QUESTION-INPUTS.md` and the register entry; nothing was copied forward. This is the
seventh consecutive plan in this phase to find drifted anchors.
