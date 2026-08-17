# Phase 81: A11Y-01 PRODUCT-GAP Cells — Email + URL Format - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 81-A11Y-01 PRODUCT-GAP Cells — Email + URL Format
**Areas discussed:** Schema dispatch mechanism, Email validation strategy, e2e fixture shape

---

## Gray area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Schema dispatch mechanism | Reuse existing Question.subtype field vs. add new customData.format enum. The ROADMAP explicitly flags this as the embedded product decision. | ✓ |
| Email validation strategy | HTML5 type='email' native vs. programmatic regex in Input.svelte mirroring checkUrl, or external validator lib. Drives when invalidEmail fires and what counts as 'bad'. | ✓ |
| e2e fixture shape | Retrofit test-question-social-1 (sort 21) in-place to set URL dispatch vs. add a dedicated URL question; where to slot the new email question given sort 22 is taken by SETTINGS-01 NumberFilter anchor. | ✓ |
| Plan grouping / split | Default 1 bundled plan vs. 2-plan split for independent email + URL risk surfaces. | (Not selected — defaults to Claude's Discretion: 1 bundled plan per D-18) |

---

## Schema dispatch mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Extend Question.subtype (Recommended) | Reuse the EXISTING DataObject.subtype field (DB column already present, no migration). Today QuestionInput.svelte:65 already dispatches subtype==='link' → 'url' input type. Add subtype:'email' → 'email' input type, plus retrofit social-link with subtype:'link' to make existing URL dispatch reachable. Zero schema migration. Convention-by-string-value (loose typing). | ✓ |
| Add customData.format enum | Introduce new field on CustomData.Question type: format?: 'email' \| 'url' \| 'tel'. Typed (TS union), self-documenting, lives alongside maxlength/longText/required. But: (a) requires app-shared type change and consumer updates; (b) duplicates concept with subtype (which already exists, has DB column, has consumers); (c) divergent dispatch paths in QuestionInput.svelte. | |
| Both (subtype keeps 'link', new format takes 'email') | Hybrid: leave 'link' dispatch alone; add customData.format only for 'email'. Avoids touching the existing subtype path but ships two divergent mechanisms for the same concept. Likely to need consolidation later. | |

**User's choice:** Extend Question.subtype (Recommended).
**Notes:** Aligns with scout finding that `Question.subtype` is already wired end-to-end (DB column → DataObject getter → 2 production consumers at QuestionInput.svelte:65 + InfoAnswer.svelte:65,79). The `customData.format` alternative would duplicate an existing mechanism and require type-system + consumer updates without delivering new capability. Captured as D-01 in CONTEXT.md.

---

### Schema dispatch — follow-up: subtype value for email

| Option | Description | Selected |
|--------|-------------|----------|
| 'email' (Recommended) | Short, single-word, lowercase — matches the existing 'link'/'linkList' family at InfoAnswer.svelte:65,79. Reads naturally as a parallel of 'link'. QuestionInput.svelte dispatch becomes: subtype==='email' → 'email' input type, parallel to subtype==='link' → 'url'. | ✓ |
| 'emailAddress' | More explicit, but breaks the short-string convention from 'link'/'linkList' and is longer than needed. | |
| 'mailto' | Aligns with URL scheme naming. Diverges from the 'link' family (which doesn't say 'http') and is less self-documenting. | |

**User's choice:** 'email' (Recommended).
**Notes:** Captured as D-02 in CONTEXT.md. URL retrofit uses the EXISTING value 'link' (captured as D-03).

---

## Email validation strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Programmatic regex in Input.svelte handleChange (Recommended) | Mirror the URL branch at Input.svelte:286-296: add 'else if (type === "email")' that runs a regex on the trimmed value, fires handleError('components.input.error.invalidEmail') on fail, preserves the bad value in the input (returns BEFORE 'value = ...' assignment). Regex: a pragmatic /^[^\s@]+@[^\s@]+\.[^\s@]+$/ shape (rejects 'foo@bar', accepts 'a@b.co'). Same UX as URL today; one validation surface to maintain. | ✓ |
| HTML5 type="email" + browser ValidityState | Set <input type="email"> in Input.svelte's text branch, read currentTarget.validity.typeMismatch to fire handleError. Browser-native (different rules per UA; 'foo@bar' is technically valid per HTML5 spec — lax). No regex to maintain but UX diverges from URL path. | |
| Both layers (HTML5 input type + programmatic check) | Use input type='email' for mobile keyboards + autocomplete, AND run the programmatic regex on change. Defense-in-depth but more code. Reasonable if mobile-keyboard UX matters. | |

**User's choice:** Programmatic regex in Input.svelte handleChange (Recommended).
**Notes:** Same UX shape as the existing URL validation surface — one mental model for users, one validation pattern to maintain. Captured as D-05 in CONTEXT.md.

---

### Email validation — follow-up: regex shape

| Option | Description | Selected |
|--------|-------------|----------|
| Pragmatic shape: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ (Recommended) | Rejects 'foo' / 'foo@bar' / 'foo @bar.co' / 'foo@bar .co'; accepts 'a@b.co' / 'name+tag@example.org' / Unicode like 'ä@b.co'. Mirrors checkUrl pragmatism: catches the obvious typos without litigating RFC 5321 edge cases. Server-side and email-delivery do final validation; this is UX-level inline feedback only. | ✓ |
| HTML5 spec regex (verbatim from WHATWG) | Full HTML5 email pattern — stricter, RFC-aligned, longer regex string. Differs in edge cases (rejects unicode locals, accepts quoted strings). Maintenance cost: nobody touches it. | |
| Allow '@bar' too (no domain dot) | Looser than pragmatic. 'a@b' passes. Useful if intranet/dev addresses matter — likely not for a public-facing VAA candidate profile. | |

**User's choice:** Pragmatic shape (Recommended).
**Notes:** Captured as D-06 in CONTEXT.md. Mirrors the `checkUrl` pragmatism philosophy.

---

## e2e fixture shape

| Option | Description | Selected |
|--------|-------------|----------|
| Retrofit sort 21 (URL) in-place + new sort 23 (email) (Recommended) | Set the chosen schema-dispatch field (subtype:'link' OR customData.format:'url') on the EXISTING test-question-social-1 (sort 21) so the URL dispatch path becomes reachable in the candidate profile — preserves the Phase 76 P01 persistence anchor + Alpha's https://example.com/sentinel-76 answer (still a VALID URL, no fixture conflict). Add NEW sort 23 'test-question-email-1' for email. Leaves Phase 77 sort 22 NumberFilter anchor untouched. | ✓ |
| Two all-new rows at sort 23 (URL) + sort 24 (email) | Don't retrofit sort 21 — add 2 new rows. Keeps sort 21 as persistence-only anchor unchanged but means the URL dispatch path is exercised on a fresh fixture row only; sort 21 social-link STAYS unreachable for URL dispatch (latent gap). | |
| Renumber sort 22 NumberFilter to sort 24, claim sort 22 for email | Match the ROADMAP's literal 'sort 22' suggestion by shifting SETTINGS-01 NumberFilter (sort 22 → 24). Touches Phase 77's anchor + voter-fixture sort_order=22 references — invasive cross-phase change for cosmetic ROADMAP alignment. | |

**User's choice:** Retrofit sort 21 (URL) in-place + new sort 23 (email) (Recommended).
**Notes:** The retrofit closes the latent PRODUCT-GAP-PARTIAL on the existing social-link anchor while preserving Phase 77's SETTINGS-01 sort-22 NumberFilter anchor verbatim. Alpha's existing answer is a VALID URL so no seed conflict. Captured as D-07 / D-08 / D-09 in CONTEXT.md.

---

## Claude's Discretion

- **Plan count (D-18):** user did not select "Plan grouping / split" as a gray area — defaults to 1 bundled plan per the source todo's estimate. Planner may split into 2 if scope exceeds per-plan ceiling at PLAN.md authoring time.
- **Email regex extraction shape (D-06 location):** inline `const EMAIL_REGEX = /.../;` in `Input.svelte` `<script>` block (default), OR extract to `apps/frontend/src/lib/utils/email.ts` (sibling to `links.ts`). Planner picks at PLAN.md time based on whether the regex constant feels load-bearing enough to extract.
- **i18n string translations (D-10):** English default `"The email address is not valid."` mirrors `invalidUrl`. Finnish / Swedish / Danish translations follow native conventions — planner may copy from existing translation resources in the repo (the `invalidUrl` row in each locale is the closest reference) or defer to a translation pass.
- **Spec refactor shape (D-11):** the existing `for (const cell of TEXT_CELLS)` loop assumes a single contract (HTML5 maxlength cap). Phase 81 adds 2 cells with a different contract (error UI surface + value preserved). Default: 2 parallel loops by `kind` discriminant. Planner may pick a single loop with branch-by-kind if the LOC overhead is small.
- **dev-seed writer subtype passthrough:** `packages/dev-seed/src/writer.ts` is expected to already serialize `subtype` to the DB. If the writer's question-insert path explicitly omits `subtype` today (planner verifies at PLAN.md authoring time), a single-line addition lands in the same Plan 01.
- **Comment update on sort-21 row (D-09):** the existing comment block at `e2e.ts:617-620` mentions "PRODUCT-GAP-PARTIAL: url-format validation deferred". Phase 81 SHOULD update that comment to note Phase 81 lifts the PRODUCT-GAP-PARTIAL to FULL.
- **Test title `A11Y-05` / `A11Y-06` infix:** cells 5 + 6 use `A11Y-01 A11Y-05 ...` / `A11Y-01 A11Y-06 ...`. Planner may simplify to just `A11Y-05 ...` / `A11Y-06 ...` if the prefix duplication reads heavy. Default: keep `A11Y-01 ` prefix for grouping consistency.
- **Skip `/gsd-ui-phase` auto-spawn (D-17):** Phase 81 is a validation-surface extension on existing rendering paths — no visual redesign. Skipped per `feedback_skip_ui_spec_for_a11y_only_phases.md` memory precedent (Phase 76 + Phase 80 precedent).

## Deferred Ideas

- `InfoAnswer.svelte` email rendering as `mailto:` links — future phase.
- `Question.subtype` as a typed enum (compile-time safety) — future phase.
- Additional format dispatches (`tel`, `postal`, etc.) — future a11y / question-spec phases.
- Centralized validator helper (`Input.svelte` shared validation registry) — premature abstraction at 2 branches; trigger when 5+ accumulate.
- HTML5 `<input type="email">` for mobile-keyboard UX — nice-to-have.
- Full 4-locale i18n key coverage audit — Phase 82+ candidate.
- Phase 82 required-empty cell (A11Y-07) — separate phase with its own embedded product decision.
