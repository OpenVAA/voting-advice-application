---
created: 2026-08-27T16:05:00.000Z
title: Twelve candidate routes outside the (protected) family are still unscanned — and none of them needs authentication
area: E2E / a11y
severity: medium
source: Phase 147 (147-SCOUT-INVENTORY.md § 6 "Out of family"; filed by 147-05)
files:
  - tests/tests/specs/a11y/candidate-a11y.spec.ts
  - .planning/REQUIREMENTS.md
---

## The gap

Phase 147 wired the candidate `(protected)` family into the blocking axe scan and the raw-i18n-key
gate — **seven surfaces × two themes = 14 scans**. That is the whole of CSCAN-01's wording
("candidate `(protected)` routes"), and it is discharged.

It is **not** the whole of the candidate app. Re-derived from disk at Phase 147's close
(`find apps/frontend/src/routes/candidate -name '+page.svelte' | grep -v '(protected)'`):

| # | route module |
|---|---|
| 1 | `candidate/login/+page.svelte` |
| 2 | `candidate/help/+page.svelte` |
| 3 | `candidate/privacy/+page.svelte` |
| 4 | `candidate/forgot-password/+page.svelte` |
| 5 | `candidate/password-reset/+page.svelte` |
| 6 | `candidate/register/+page.svelte` |
| 7 | `candidate/register/password/+page.svelte` |
| 8 | `candidate/preregister/+page.svelte` |
| 9 | `candidate/preregister/(authenticated)/elections/+page.svelte` |
| 10 | `candidate/preregister/(authenticated)/constituencies/+page.svelte` |
| 11 | `candidate/preregister/(authenticated)/email/+page.svelte` |
| 12 | `candidate/preregister/status/+page.svelte` |

**Twelve leaf routes, none of them scanned.** Their a11y state is unknown for exactly the reason the
`(protected)` ones were unknown until Phase 147: nothing has ever pointed axe at them.

> **Count corrected in the filing.** `147-SCOUT-INVENTORY.md` § 6 says *"11 further unscanned
> candidate surfaces"* while **naming twelve**. The named set is identical to the measured set
> above; the prose count was an arithmetic slip and the enumeration was right. Recorded rather than
> propagated — a wrong count is the shape of premise this phase spent a plan retiring.

## Why they are outside Phase 147 rather than left out of it

They fall outside **CSCAN-01's wording**, not outside the coverage hole. The scout flagged them for
the discussion to decide, and the discussion scoped the phase to `(protected)`.

## What makes this cheaper than it looks

**None of these routes needs authentication.** The hard part of Phase 147 — ungating `auth-setup`,
paying for the project-dependency reordering it forces, and proving the reordering did not perturb
the suite — is not needed here at all. These twelve could ride the **voter-shaped** scan path (empty
storage state, plain `goto`), which is the cheaper of the two halves.

Two of them do carry state: `preregister/(authenticated)/*` sits behind a preregistration session,
and `password-reset` needs a live reset token.

## Solution

Extend the route table with the routes that need no state (login, help, privacy, forgot-password,
register, register/password, preregister, preregister/status), in both themes, over the **same**
`assertAxeScan` core — never a second copy of the gate. Then decide separately whether the three
stateful preregister surfaces and `password-reset` are worth their fixtures.

**Expect fallout.** Phase 147 got a free ride because the `(protected)` surfaces measured zero
before it started. These have never been measured, and a new scan owns whatever it finds (the
Phase 135 GUARD-02 precedent). Measure before planning the fix, as Phase 147 did.
