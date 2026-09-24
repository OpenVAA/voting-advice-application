---
created: "2026-09-01T00:00:00.000Z"
title: Harmonise Candidate-App preregistration election/constituency selection with the Voter App
area: apps/frontend/src/routes/candidate/preregister
severity: medium
source: PR #870 review comment (kaljarv) at apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte:1 — filed per Phase 158 decision D-G5 step 1
files:
  - apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte
  - apps/frontend/src/routes/(voters)/elections/+page.svelte
  - apps/frontend/src/routes/(voters)/constituencies/+page.svelte
  - apps/frontend/src/routes/(voters)/constituencies/+page.ts
  - apps/frontend/src/lib/components/electionSelector
  - apps/frontend/src/lib/components/constituencySelector
related_phase: 158
---

# Preregistration election/constituency selection: harmonise with the Voter App

> **Related, 2026-09-15:** this is a sub-problem of
> [`2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md`](2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md),
> which restructures the whole candidate/entity registration flow and nomination selection to Phase
> 162's model. Kept separate because the measured detail below — zero `startFromConstituencyGroup`
> sites on the candidate side against four on the voter side, and `perm-startfromcg.spec.ts` as the
> existing regression surface — is what that larger item needs and does not repeat. **Do this as part
> of it, not before it**, and note that the design question § 2 below raises ("what is the candidate
> equivalent of implying the constituency when nominations already constrain the answer?") is
> partly answered there: under Phase 162 an entity user creates its own nominations, so the
> constraint runs the other way.

**Filed:** 2026-09-01, during Phase 158. The filename carries `2026-08-28`, the date the review
comments were bucketed in `.planning/PRE-SHIP-REVIEW-TRIAGE.md`; `created` carries the filing date.

**Classification: NON-BLOCKING.** The reviewer wrote *"Add a follow-up task: harmonise election and
constituency selection logic with the Voter App (mainly `startFromConstituencyGroup` option)."* —
explicitly a follow-up, with no blocking marker. Severity is `medium` rather than `minor` because the
gap is a **behavioural divergence between two apps over the same setting**, not a code-shape
preference; see the regression surface below.

## The comment

> Add a follow-up task: harmonise election and constituency selection logic with the Voter App
> (mainly `startFromConstituencyGroup` option).

## Anchor, verified at HEAD `3c958cccc`

`apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte:1` — a
file-level anchor (`:1` is `<script lang="ts">`; the comment is about the file, not a line). The file
exists and is the Candidate-App preregistration election selector. It imports
`ElectionSelector` from `$lib/components/electionSelector` and `getCandidateContext`, and — measured
— **contains no reference to `startFromConstituencyGroup` at all.**

## The divergence, measured

`git grep -n "startFromConstituencyGroup" -- apps/frontend/src` returns 11 production lines. **Every
one is Voter-App or shared-component code. None is under `routes/candidate/`.**

The Voter App honours the setting in four places:

| File:line | What it does |
|---|---|
| `routes/(voters)/constituencies/+page.ts:34` | `if (appSettings.elections?.startFromConstituencyGroup) return;` — suppresses constituency implication, because if the setting is on the constituency must be chosen |
| `routes/(voters)/constituencies/+page.svelte:47`, `:110` | selects the single offered group and changes the Continue target |
| `routes/(voters)/elections/+page.svelte:42` | branches the Continue route and its params |
| `lib/dynamic-components/navigation/voter/VoterNav.svelte:52,57,62` | reorders nav items and changes disabled conditions |

The setting's documented contract (`apps/docs/…/publishers-guide/app-settings/+page.md:128`):

> If `true` and there are multiple elections, the constituency selection page with this
> `ConstituencyGroup` as the only option will be shown first and the possible election selection only
> afterwards. Only those elections that are applicable to the selected constituency or its ancestors
> are shown.

**The Candidate-App preregistration flow implements none of this.** A deployment that sets
`startFromConstituencyGroup` gets one ordering for voters and a different one for candidates
pre-registering for the same elections.

## Cross-reference — the regression surface is already covered by a spec

**`tests/tests/specs/perm/perm-startfromcg.spec.ts`**, with its setup at
`tests/tests/setup/perm/perm-startfromcg.setup.ts`, already exercises this setting end to end. It is
Voter-App-scoped today.

**This is named here deliberately**, so whoever picks the task up sees the regression surface before
touching the shared selectors: `ElectionSelector` and `ConstituencySelector` are used by *both* apps
(`ConstituencySelector.svelte:12` and `ConstituencySelector.type.ts:23` both document the
`useSingleGroup` prop as *"to be used when the `elections.startFromConstituencyGroup` setting is
set"*). A harmonisation that changes those components to suit the candidate flow can silently break
the voter flow, and `perm-startfromcg.spec.ts` is the spec that would catch it. Extend that spec to
the candidate side rather than writing a parallel one.

## Why it is not being done in Phase 158

Two reasons, both substantive:

1. **It is a design problem, not a refactor.** The Voter App's ordering logic is spread across a
   `+page.ts` load-time redirect table, two page components and the nav component. Porting it means
   deciding what the candidate equivalent of "imply the constituency" is when the candidate's
   nominations already constrain the answer — a question no decision in `158-CONTEXT.md` settles.
2. **Phase 158 is the routing and auth surface.** `D-G5`'s rejected option (b) — implementing all six
   follow-ups inside 158/159 — was rejected in part on exactly this item: *"pulls in a
   Voter-App/Candidate-App harmonisation that is its own design problem."*
