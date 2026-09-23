---
created: 2026-08-28
source: Phase 154 (CONTEXT O-4)
resolves_phase: null
severity: low
area: packages/dev-seed templates
---

# Hand-authored dev-seed templates hardcode an election date that is already in the past

## The hole

Twenty-two hand-authored `fixed[]` election rows across the dev-seed template tree carry the
literal `election_date: '2026-06-15'`. That date was already in the past when Phase 154 ran
(2026-08-28), and it recedes further every day. Every one of the 22 sites is under
`packages/dev-seed/src/templates/**`; nothing outside that tree carries the literal.

**The 22 sites, re-measured on this tree (see the note below — the line numbers in
`154-RESEARCH.md` R10 are stale):**

```
packages/dev-seed/src/templates/default.ts:51
packages/dev-seed/src/templates/_helpers/buildMinimal.ts:207
packages/dev-seed/src/templates/e2e/base.ts:346
packages/dev-seed/src/templates/e2e/base.ts:358
packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts:47
packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts:59
packages/dev-seed/src/templates/e2e/perm/perm-2e-asymmetric.ts:41
packages/dev-seed/src/templates/e2e/perm/perm-2e-asymmetric.ts:53
packages/dev-seed/src/templates/e2e/perm/perm-2e-shared.ts:38
packages/dev-seed/src/templates/e2e/perm/perm-2e-shared.ts:50
packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts:41
packages/dev-seed/src/templates/e2e/perm/perm-disable-election-1co.ts:45
packages/dev-seed/src/templates/e2e/perm/perm-disable-election-1co.ts:57
packages/dev-seed/src/templates/e2e/perm/perm-disable-election-2co.ts:45
packages/dev-seed/src/templates/e2e/perm/perm-disable-election-2co.ts:57
packages/dev-seed/src/templates/e2e/perm/perm-disjoint-1co.ts:45
packages/dev-seed/src/templates/e2e/perm/perm-disjoint-1co.ts:57
packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts:102
packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts:68
packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts:64
packages/dev-seed/src/templates/e2e/perm/perm-startfromcg.ts:47
packages/dev-seed/src/templates/e2e/perm/perm-startfromcg.ts:59
```

Reproduce with `grep -rn "election_date: '2026-06-15'" packages/dev-seed/src` — 22 hits, 14 files.

**Line-number provenance.** `154-RESEARCH.md` R10 lists the same 22 sites with a different set of
line numbers (`default.ts:79`, `buildMinimal.ts:241`, `base.ts:418`/`:430`, …). Those were correct
when R10 was measured and are now stale: the comment-hygiene sweep shortened every one of these
files afterwards. The **file set and the per-file counts are identical** between the two
measurements — only the offsets moved. Navigate by the literal, not by the line number.

## Why it was not fixed in-phase

**This is a deliberate defer, not an oversight.** No decision in the phase's decision set covers
refreshing these rows and no phase success criterion asks for it. The phase's brief was date
*determinism* — making generated dates independent of the wall clock — which is a different problem
from a hand-authored literal being stale.

**The fixed reference constant this phase introduced does NOT address this, and it is worth being
blunt about why.** Phase 154 added `SEED_REF_DATE = '2027-01-01T00:00:00.000Z'` and threaded it
through `ElectionsGenerator`'s `faker.date.future` call, so *synthetic* elections now land in 2027
regardless of when the seed runs. But **no built-in template emits a synthetic election at all** —
all 30 built-ins declare `elections.count: 0`, measured in plan 03 across the full registry. The
constant therefore has **zero demo-visible impact today**. Every election date a user actually sees
in the Finnish demo comes from `default.ts:51`, a hardcoded row. The past-date problem belongs
*entirely* to the 22 rows listed above, and reading the phase as having fixed it would be wrong.

**Why a refresh is a real change rather than a find-and-replace.** These templates are the datasets
the permission-scenario E2E projects seed from: `tests/seed-test-data.ts:12` imports
`BUILT_IN_TEMPLATES` from `@openvaa/dev-seed`, and `tests/playwright.config.ts` wires a serial DAG
of `data-setup-perm-*` projects (`perm-2e-shared`, `perm-2e-asymmetric`, `perm-startfromcg`,
`perm-disjoint-1co`, `perm-disable-election-1co`, `perm-disable-election-2co`,
`perm-not-located-2e2cg`) that seed exactly these rows. Changing the literal changes the seeded
dataset under the whole perm chain, so any refresh requires a full-suite run before it can be
trusted.

Two measurements sharpen that, and both cut against the inherited framing — record them so whoever
picks this up does not chase a coupling that is not there:

- **No E2E spec asserts the date in any rendering.** `grep -rn "2026-06-15" tests/` returns 0 files,
  as do greps for the Finnish (`15.6.2026`), English (`June 15, 2026`) and US (`6/15/2026`)
  renderings. R10's caution that "several perm specs may assert against the date" was a hedge
  ("may"), and it is **not borne out** — the coupling is through the *data*, not through assertion
  text. This is the same shape as the correction plan 03 made to this phase's E2E-decline route:
  dev-seed reaches E2E through what it seeds, not through what anything imports or asserts.
- **The frontend does not branch on the date.** `election_date` is mapped to `date` at
  `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:155` and
  rendered through the `dynamic.info.dateInfo` translation at
  `apps/frontend/src/routes/(voters)/info/+page.svelte:48`. No past/future comparison was found.
  So the user-visible defect is cosmetic — a stale date on the info page — not a behavioural one.

That is why this needs a decision rather than a patch: the mechanical edit is trivial and safe, but
*what to replace the literal with* is an unmade product choice, and whichever answer is picked will
be re-litigated the next time it goes stale.

**Related wrinkle, folded in here rather than filed separately.** The only `date`-typed question in
the repository is a date of birth (`packages/dev-seed/src/templates/e2e/base.ts`, the
`[qu-info-date] Info: date of birth.` question). `faker.date.recent()` was already rendering it as a
nonsense "born yesterday" value before Phase 154; anchored to a 2027 reference date it becomes a
nonsense *future* date of birth. It is not a regression in kind — nonsense before, nonsense after —
and it **fires under no built-in template**, because that question is pre-answered. Worth folding
into whatever pass refreshes the dates, not worth a phase of its own.

**Not blocking.** Nothing is broken; a date is stale.

## The decision required

- **Option A — refresh the literal to a new fixed future date.** Smallest diff: 22 sites, one
  `sed`, one full-suite run. Recommended for whoever wants this closed today. Its cost is that it
  buys time rather than solving the problem — the new date goes stale on its own schedule and this
  todo gets refiled.
- **Option B — anchor the hardcoded rows to `SEED_REF_DATE`.** **Recommended.** Replace the literal
  with a value derived from the same exported constant the synthetic path already uses, so the
  hand-authored rows and the generated rows share one knob and one era. This is what makes the
  problem stop recurring: there is then exactly one date to move, and the template-level `refDate`
  override already exists for any template that wants a different era. Larger diff, and it needs a
  decision about the derived value's shape (a second exported constant for the fixed rows, or an
  offset from the anchor).
- **Option C — leave it.** Defensible while the visible consequence is one stale line on an info
  page nobody demos. Costs nothing now; costs the same conversation again later.

## After the decision

1. Pick the replacement value or derivation, and record it — the value is the decision, the edit is
   not.
2. Apply it at all 22 sites. Navigate by the literal
   (`grep -rn "election_date: '2026-06-15'" packages/dev-seed/src`), not by the line numbers above,
   which will have moved again.
3. Fold in the date-of-birth wrinkle if Option B is taken, since it is the same anchor.
4. Run `yarn workspace @openvaa/dev-seed test:unit` and `yarn test:unit`.
5. Run the **full** E2E suite. The perm chain seeds from exactly these rows, so this is the gate
   that matters — a filtered subset is not the trusted signal in this project.
6. Confirm the info page renders the new date in the default template before closing.

## Related

- Phase 154 `154-CONTEXT.md` — open item O-4, where the deferral was recorded
- Phase 154 `154-RESEARCH.md` — R10 (the original 22-site measurement; line numbers now stale) and
  R6.1 (the `SEED_REF_DATE` value rationale and the date-of-birth wrinkle)
- Phase 154 `154-03-SUMMARY.md` — the 30-built-in dataset-invariance measurement that establishes
  the constant has zero demo-visible impact
- `.planning/WINDOWS.md` — entry 142, the correction establishing that dev-seed reaches E2E through
  the data rather than the dependency graph
