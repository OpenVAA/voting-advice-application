---
created: 2026-06-06T15:31:46.122Z
title: Fix broken default seed template
area: tooling
priority: high
files:
  - packages/dev-seed/src/templates/default.ts
  - packages/dev-seed/src/templates/index.ts
resolves_phase: 145
resolved: 2026-08-24
resolved_by: 145-08
status: resolved
---

> **CLOSED by Phase 145 (2026-08-24).** See § Resolution below. The three symptoms are
> annotated **in place** rather than edited away: symptom 2 reproduced and is fixed;
> symptoms 1 and 3 are disproved by measurement, each with the row that disproved it.

## Problem

The **default** seed template (the one used by `yarn db:reset-with-data`,
`yarn db:seed:default`, and `yarn db:seed --template default` — the Finnish demo
dataset, NOT the `e2e/*` templates) is broken. Three symptoms observed:

1. **0 parties in results** — the voter results page shows no organizations/parties
   for the default-seeded data.

   > ⚠ **DISPROVED by measurement (Phase 145, 2026-08-24).** This symptom did not
   > reproduce. Measured against the **pre-fix** template in the running app, the
   > results page rendered **8 party cards** (ledger row `A2-PRE`, screenshot
   > `app-before-parties.png`, header `8 parties in constituency Pirkanmaa`), and **8
   > again** after the fix (`A2-POST`) — a must-NOT-fire row that held in both
   > directions. It had already been closed by `49a23512e` (2026-06-15,
   > *"fix(119-02): reconcile default.ts docstrings + defensive hideIfMissingAnswers
   > (UNBLK-03)"*), **nine days after this todo was filed**. The symptom text is kept
   > rather than deleted so the record shows what was believed alongside what was
   > measured.

2. **Candidates tab not shown** — the results entity-type tabs don't render the
   candidates tab (likely tied to `appSettings.results.sections` / nominations not
   being seeded, or matches coming back empty for the default dataset).

   > ✅ **CONFIRMED, and fixed (Phase 145).** The tab really was absent: observed tab
   > set, verbatim, `["Parties","Alliances"]` (row `A1-RED`), becoming
   > `["Candidates","Parties","Alliances"]` with 48 candidate cards (`A1-GREEN`).
   > ⚠ **But the guessed mechanism in the parenthesis is DISPROVED on both counts:**
   > `app_settings.results.sections` **does** contain the `candidate` entity type, and
   > nominations **are** seeded (377 of them, alongside 8 organizations). The real
   > cause was an **RLS-predicate asymmetry**: the seed pipeline's `PUBLISHABLE_TABLES`
   > auto-default stamps `published = true`, but anon SELECT on `candidates` needs
   > three clauses (`published = true AND terms_of_use_accepted IS NOT NULL AND
   > terms_of_use_accepted < now()`), so every seeded candidate satisfied 1 of 3 and
   > was invisible to the role the voter app uses. Because `get_nominations` drops
   > entity-less rows, that invisibility presented as a **missing tab** rather than an
   > empty list — which is exactly why it looked like a `results.sections` problem.

3. **Mixed naming of constants** — the template mixes naming conventions for its
   constants (inconsistent with the `e2e/base` template's conventions), which makes
   the data shape hard to reason about and may be contributing to 1 & 2.

   > ⚠ **DISPROVED as stated (Phase 145).** The **constants** were measured and are
   > already consistent UPPER_SNAKE in *both* templates. What genuinely diverged was
   > the **`external_id` idiom**, and only in **two typecodes** of seven hand-authored
   > collections. That was reconciled in `145-06` (5 constituency + 8 organization
   > identifiers adopting their generators' typecodes; 52 occurrences of the retired
   > families → 0), with the four deliberate divergences from `e2e/base` documented in
   > `default.ts`'s own header. ⚠ **And the speculation that it was "contributing to 1
   > & 2" is disproved too** — naming had no causal connection to either symptom.

This is the developer-facing "first run" dataset, so a broken default template is a
bad onboarding/demo experience. High priority.

Surfaced during v2.11 Phase 101 (milestone-close) while debugging the voter results
flow — note this is the DEFAULT template, separate from the `e2e/base` template the
E2E suite uses (that one renders parties/candidates correctly), so the bug is scoped
to `default.ts`, not the shared results-rendering path.

## Resolution — CLOSED by Phase 145 (2026-08-24)

**Status: resolved.** One of the three symptoms reproduced; the other two are annotated
as disproved in place above, along with the guessed mechanisms that turned out to be
wrong. The investigation checklist below is kept verbatim as the record of what was
believed at filing time — **three of its four items were answered "already true"**.

**What was actually wrong:** the `PUBLISHABLE_TABLES` auto-default in the seed pipeline
satisfied 1 of the 3 clauses of the `candidates` anon RLS predicate, so `yarn
db:reset-with-data` produced 327 candidates that the voter app's anon client could not
read at all. Fixed by emitting `terms_of_use_accepted` on every candidate row the
`default` template's override produces (`eab07013f`). A second, **independent latent
defect** had to be fixed before the results page would render at all: the synthetic
answer emitter drew `number` answers 0–100 regardless of each question's declared range,
putting 294 of 327 candidate answers outside the declared `[0, 10]` so
`normalizeCoordinate` threw (`9f12a6c94`). It was latent precisely *because* anon had
never been able to see a candidate answer.

**Why it survived ~11 weeks under a green suite:** every assertion in the existing
`packages/dev-seed` suite authenticates as **service_role, which bypasses RLS entirely**
— so the suite was structurally incapable of noticing that the dataset it had just
written was unreadable by the app. That blindness is now closed by a standing guard that
reads the seeded database as a genuinely-**anon** client, fronted by an `accounts` role
control so it cannot pass vacuously.

**Evidence — rows, artifacts and exit codes, not prose:**
`.planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md`
(30 rows · 0 placeholder cells · 0 borrowed observations · 0 cache replays admitted as
evidence · 4 measured pairs · 3 must-NOT-fire rows, all held · 1 deferred row). The
app-level before/after is § Criterion 1 — before and after (four screenshots, two run
logs, two exit codes); the cause is § Root cause, named (criterion 3); the rename and its
durability proof are § TMPL-04 — the idiom and its divergence and § Strand proof. All
seven standing gates green at one HEAD `8372d0dff`, cardinal E2E gate last: 135 passed,
0 failed / 0 flaky / 0 skipped / 0 did-not-run.

**Related, filed rather than fixed:**
`.planning/todos/pending/2026-08-24-cold-results-navigation-crashes-dev-server.md` — a
cold session-less hit to `/results` kills the dev server. Surfaced on the same
first-run path this todo is about, but it is an `apps/frontend` cookie-lifecycle bug
with no connection to seed data.

## Solution

TBD. Investigate `packages/dev-seed/src/templates/default.ts`:
- Confirm it seeds organizations/parties + their nominations for the election(s).
- Confirm `app_settings.results.sections` includes both `candidate` and
  `organization` (drives which entity tabs render).
- Reconcile constant naming with the `e2e/base` template conventions.
- Verify against the live results page after `yarn db:reset-with-data` (0 parties /
  no candidates tab should both be gone).
Cross-ref: [[2026-05-31-edit-the-seed-utility-to-use-strict-typing-for-the-templates]]
(strict template typing would likely have caught the const-naming drift).
