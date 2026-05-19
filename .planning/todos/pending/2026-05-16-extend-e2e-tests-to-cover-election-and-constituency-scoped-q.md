---
created: 2026-05-16T17:49:26.001Z
updated: 2026-05-18T18:34:45.249Z
title: Extend e2e tests to cover election- and constituency-scoped questions
area: testing
status: blocked-by-backend
files:
  - tests/tests/specs/variants/constituency.spec.ts:226
  - tests/tests/specs/variants/multi-election.spec.ts
  - tests/tests/setup/templates/variant-multi-election.ts:218-244
  - tests/tests/setup/templates/variant-constituency.ts
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
  - packages/dev-seed/src/templates/e2e.ts
  - packages/data/src/objects/election/election.ts
  - packages/app-shared/src/settings/
---

## Problem

The e2e suite has seeded fixtures for **election-scoped** and
**constituency-scoped** questions, but no test currently asserts the actual
scoping behaviour — i.e. that a question authored to be visible only in
{election X, constituency Y} actually surfaces in /questions when that scope
is selected and is absent otherwise.

Concretely:

- **`variant-multi-election`** (`tests/tests/setup/templates/variant-multi-election.ts:218-244`)
  declares `test-e2-q-1` and `test-e2-q-2` inside category
  `test-cat-e2-policy`, scoped to `test-election-2`. The suite never asserts
  these two questions are present when Election-2 is selected and absent when
  only Election-1 is selected.

- **`variant-constituency`** (`tests/tests/setup/templates/variant-constituency.ts:216-275`)
  declares `test-cat-const-north` (region-north scoped) and `test-cat-e2-local`
  (election-2-local scoped) plus the corresponding `test-q-const-north-*`
  and `test-q-e2-local-*` questions. The current test at
  `constituency.spec.ts:226` only asserts `questionCount >= 8` (a coarse
  total-count check) — it neither identifies which specific scoped questions
  rendered nor verifies the implication chain
  (`muni-north-a` → `region-north` → `test-cat-const-north` visible) actually
  fired.

This gap means a regression in voterContext's question-filtering chain
(e.g. `voterContext.opinionQuestions` $derived over
`selectedElections`/`selectedConstituencies`) could silently drop
scoped questions and pass the suite (total count would shift but stay
≥ 8 in most permutations).

## Solution

Add focused assertions (likely in `constituency.spec.ts` and/or
`multi-election.spec.ts`, or a new `tests/specs/variants/question-scoping.spec.ts`)
that walk specific election × constituency permutations and verify, by
external_id or by rendered question text, that:

1. **Election scoping** — when only Election-1 is selected, `test-e2-q-*`
   questions are absent. When both elections are selected (or only
   Election-2), they appear in the expected order.

2. **Constituency hierarchical implication** — selecting `muni-north-a`
   surfaces `test-cat-const-north`'s questions; selecting `muni-south-a`
   does NOT (region-south does not have that category); selecting
   `muni-orphan` skips region-implied categories entirely.

3. **Combined scoping** — `test-cat-e2-local` (Election-2 ∩ municipalities CG)
   appears only when Election-2 is selected AND a municipality is chosen for
   it, and is absent in single-Election-1 + region-only flows.

Suggested locator strategy: the question card already exposes question text
via the answer-option label; use `page.getByText(/<distinctive substring of
question name>/)` scoped to the question container. If question text is too
fragile across locale fan-out, consider exposing a stable
`data-testid="question-{external_id}"` on the question card.

Out of scope: voter context unit tests over the same scoping logic — the e2e
gap is the one captured here. Unit-level scoping coverage may already exist
in `apps/frontend/src/lib/contexts/voter/voterContext.test.ts`-equivalent
files and is a separate audit.

## Origin

Surfaced during Phase 86.1 post-fix work on `constituency.spec.ts:226`
(missing-nominations modal handling). Reviewing the test's `questionCount >= 8`
assertion exposed that the suite knows the scoped fixtures exist but never
checks they actually take effect through the voterContext filter chain.

## Blocker (added 2026-05-18)

This work is **blocked by a backend schema fix** before the assertions can be
authored. `question_categories` (and/or `questions`) currently lacks effective
per-scope filtering columns. The required `jsonb` columns are:

- `election_ids`     — array of election external_ids the category/question applies to
- `election_rounds`  — array of election rounds it applies to (per-election keyed)
- `constituency_ids` — array of constituency external_ids it applies to
- `entity_type`      — array of entity types (`candidate` / `organization` / `faction` / `alliance`)

Until these are wired end-to-end:

1. **Schema migration** in `apps/supabase/migrations/` adding the four `jsonb`
   columns to `question_categories` (or `questions` if scoping is per-question
   rather than per-category) with sensible empty defaults.
2. **Type generation** — re-run `yarn supabase:types`; update
   `packages/dev-seed/src/templates/e2e.ts` and the variant templates'
   `Template` shape so `fixed[]` rows can author the new fields.
3. **`@openvaa/data`** — extend `election.getQuestions({ constituency, entityType, type })`
   (`packages/data/src/objects/election/election.ts`) to filter on the new
   scoping columns rather than the implicit-all behaviour current shipping.
4. **`@openvaa/app-shared`** — propagate any new types/utilities.
5. **`voterContext`** — verify `opinionQuestions` / `infoQuestions` `$derived`
   chains call the filtering path with the active election + constituency
   tuple.

Only after the above lands can the e2e assertions actually verify the
scoping. The existing variant fixtures already carry the *intent*
(`test-cat-const-north`, `test-cat-e2-local`, `test-e2-q-{1,2}` etc.), but
without the runtime filter columns they are effectively visible to every
election:constituency tuple and asserting their absence in non-target scopes
would fail today.

## Specific assertion ideas (post-unblock)

Once the schema fix lands, add — at minimum — these focused assertions in
`tests/tests/specs/variants/constituency.spec.ts` over the new disjoint-
municipality template
(`tests/tests/setup/templates/variant-constituency.ts`):

- Add two Likert (`singleChoiceOrdinal`) opinion questions in the variant
  template, one scoped to **SE Municipality** and one scoped to **NE
  Municipality**.
- When the voter selects **SE** for Election 1, assert the SE-scoped question
  IS rendered in the `/questions` flow and the NE-scoped question is NOT.
- Mirror with NE selection for the inverse.

The disjoint-group shape introduced in Phase 86.1 (NE+SE in
`test-cg-east-municipalities`, NW+SW in `test-cg-west-municipalities`) is the
right substrate for this assertion — same-group different-constituency
filtering is the most subtle case the suite must cover.
