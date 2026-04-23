---
phase: 58-templates-cli-default-dataset
doc: e2e-audit
audited: 2026-04-23
specs_scanned: 21
status: complete
---

# Phase 58 — E2E Playwright Spec Audit (D-58-15)

Grep-verified inventory of every seeded-data contract referenced by `tests/tests/specs/**/*.spec.ts` and the supporting data-loading scripts (`tests/seed-test-data.ts`, `tests/tests/setup/data.setup.ts`, variant setups). This document is the SOLE SOURCE OF TRUTH for Plan 58-08's `packages/dev-seed/src/templates/e2e.ts` authoring.

**D-58-15 mandate:** The e2e template MUST preserve every external_id / name / relational contract asserted on in Sections 1–3 VERBATIM. It MUST NOT inherit items listed in Section 4 (implicit invariants leaked by JSON fixtures but not depended on by any spec). Plan 08 is REQUIRED to treat Sections 1–3 as a positive inclusion list and Section 4 as an exclusion list.

**D-58-16 mandate:** The e2e template sets `generateTranslationsForAllLocales: false`. Only default-locale (`en`) values are recorded in this audit.

**Resolution rubric for grey-area grep hits:**
- A grep hit in a comment block (e.g. `// Test Election 2025 has candidates`) counts as a Section 2 entry ONLY when the spec elsewhere asserts against the string via `getByText`, `hasText`, a combobox `name`, or a role name regex. Pure documentation comments without runtime assertions are noted in Section 8 (informational only).
- Spec code that reads `candidate.firstName` / `candidate.lastName` / `candidate.email` etc. ties the TEMPLATE to each dataset row but does NOT constrain the LITERAL value — the spec is indirected through the JSON. These entries are listed in Section 2 with a note `literal value flows from template`; the template MUST preserve the external_id, and the name MAY differ as long as the dataset-as-shipped remains internally consistent for Section 1's reference pattern.

### Section 1 — External IDs Referenced by Specs

Every row below is a (externalId, spec-file:line) pair where a Playwright spec directly exercises the externalId through code (import + find, admin client query, or fixture traversal). Comments-only mentions are listed in Section 8.

| External ID | Table | Referenced In (file:line) | Reference Form |
|---|---|---|---|
| test-candidate-alpha | candidates | tests/tests/specs/voter/voter-detail.spec.ts:27 | `defaultDataset.candidates.find((c) => c.externalId === 'test-candidate-alpha')!` |
| test-candidate-alpha | candidates | tests/tests/setup/data.setup.ts:87 | `client.forceRegister('test-candidate-alpha', 'mock.candidate.2@openvaa.org', TEST_CANDIDATE_PASSWORD)` (ground-truth auth wiring consumed by every candidate spec via `TEST_CANDIDATE_EMAIL`/`TEST_CANDIDATE_PASSWORD`) |
| test-question-text | questions | tests/tests/specs/voter/voter-detail.spec.ts:88 | `alphaAnswers['test-question-text'].value` — spec asserts on the Alpha-specific slogan value via this question row |
| test-voter-cand-agree | candidates | tests/tests/specs/voter/voter-matching.spec.ts:123 | `voterDataset.candidates.find((c) => c.externalId === 'test-voter-cand-agree')!` |
| test-voter-cand-agree | candidates | tests/tests/specs/voter/voter-matching.spec.ts:202 | `const agreeName = \`${agreeCandidate.firstName} ${agreeCandidate.lastName}\`` — asserted as first-card content |
| test-voter-cand-oppose | candidates | tests/tests/specs/voter/voter-matching.spec.ts:124 | `voterDataset.candidates.find((c) => c.externalId === 'test-voter-cand-oppose')!` |
| test-voter-cand-oppose | candidates | tests/tests/specs/voter/voter-matching.spec.ts:212 | `const opposeName = ...` — asserted as last-card content |
| test-voter-cand-partial | candidates | tests/tests/specs/voter/voter-matching.spec.ts:122 | `voterDataset.candidates.find((c) => c.externalId === 'test-voter-cand-partial')!` |
| test-voter-cand-partial | candidates | tests/tests/specs/voter/voter-matching.spec.ts:221 | `const partialName = ...` — asserted as neither-first-nor-last card content |
| test-election-1 | elections | tests/tests/specs/variants/multi-election.spec.ts:135 | `adminClient.findData('elections', { externalId: { $eq: 'test-election-1' } })` |
| test-election-1 | elections | tests/tests/specs/variants/results-sections.spec.ts:171 | `client.findData('elections', { externalId: { $eq: 'test-election-1' } })` |
| test-election-2 | elections | tests/tests/specs/variants/multi-election.spec.ts:136 | `adminClient.findData('elections', { externalId: { $eq: 'test-election-2' } })` |
| test-election-2 | elections | tests/tests/specs/variants/results-sections.spec.ts:172 | `client.findData('elections', { externalId: { $eq: 'test-election-2' } })` |
| test-constituency-alpha | constituencies | tests/tests/specs/variants/multi-election.spec.ts:139 | `adminClient.findData('constituencies', { externalId: { $eq: 'test-constituency-alpha' } })` |
| test-constituency-alpha | constituencies | tests/tests/specs/variants/results-sections.spec.ts:173 | `client.findData('constituencies', { externalId: { $eq: 'test-constituency-alpha' } })` |
| test-constituency-e2 | constituencies | tests/tests/specs/variants/multi-election.spec.ts:140 | `adminClient.findData('constituencies', { externalId: { $eq: 'test-constituency-e2' } })` |
| test-constituency-e2 | constituencies | tests/tests/specs/variants/results-sections.spec.ts:174 | `client.findData('constituencies', { externalId: { $eq: 'test-constituency-e2' } })` |
| test-cg-municipalities | constituency_groups | tests/tests/specs/variants/startfromcg.spec.ts:47 | `client.findData('constituencyGroups', { externalId: { $eq: 'test-cg-municipalities' } })` — spec reads documentId and writes it into app_settings.elections.startFromConstituencyGroup |
| test-candidate-unregistered | candidates | tests/tests/specs/candidate/candidate-registration.spec.ts:29 | `const candidateExternalId = candidateAddendum.candidates[0].externalId` (= `'test-candidate-unregistered'`); used in `client.sendEmail({ candidateExternalId, ... })` |
| test-candidate-unregistered-2 | candidates | tests/tests/specs/candidate/candidate-profile.spec.ts:34 | `const candidateExternalId = candidateAddendum.candidates[1].externalId` (= `'test-candidate-unregistered-2'`); used in `client.sendEmail({ candidateExternalId, ... })` |
| test-voter-cand-hidden | candidates | tests/tests/specs/voter/voter-matching.spec.ts:121 | `voterDataset.candidates.find((c) => !c.termsOfUseAccepted)!` — the unique row lacking `termsOfUseAccepted`; contract = "exactly ONE voter-dataset candidate has `termsOfUseAccepted` absent" |
| test-voter-cand-hidden | candidates | tests/tests/specs/voter/voter-matching.spec.ts:238 | `const hiddenName = ...` — asserted as NOT present in candidate section |

#### Section 1.1 — Indirected external IDs (spec traverses the full dataset)

These external IDs are NOT directly named by specs but the specs iterate the whole dataset and the iteration shape requires them to exist with the specified `type` / `termsOfUseAccepted` / `answersByExternalId` coverage. Each entry cites the spec code that enforces the shape.

| External ID | Table | Enforced By (file:line) | Constraint |
|---|---|---|---|
| test-question-1..test-question-8 | questions | tests/tests/specs/voter/voter-matching.spec.ts:40-43 | `defaultDataset.questions.filter((q) => q.type === 'singleChoiceOrdinal')` — spec expects 8 ordinal (Likert-5) opinion questions in default dataset. Value asserted: `TOTAL_OPINION_QUESTIONS === 16` (8 default + 8 voter). |
| test-question-date, test-question-number, test-question-text, test-question-boolean | questions | tests/tests/specs/voter/voter-matching.spec.ts:41 + voter-detail.spec.ts:88 | Non-opinion question types (date/number/text/boolean) MUST exist so the ordinal filter yields exactly 8. `test-question-text` is additionally asserted on directly (see Section 1 top). The OTHER three are required as fillers so the filter result == 8 (not a specific count of info-type questions, but at least one each such that ordinal+info total == 12). |
| test-voter-q-1..test-voter-q-8 | questions | tests/tests/specs/voter/voter-matching.spec.ts:42 | `voterDataset.questions` spread without filter — all rows must be `singleChoiceOrdinal`. Count check: 8 voter questions. |
| test-candidate-beta, test-candidate-gamma, test-candidate-delta, test-candidate-epsilon | candidates | tests/tests/specs/voter/voter-matching.spec.ts:62-71 | `defaultDataset.candidates` iterated; each must have `termsOfUseAccepted` set and a full `answersByExternalId` map against test-question-1..8. The matching algorithm computes expected ranking tiers from these rows; Plan 08 MUST preserve 5 registered default-dataset candidates or the tier ordering will change. |
| test-voter-cand-close, test-voter-cand-neutral, test-voter-cand-mixed | candidates | tests/tests/specs/voter/voter-matching.spec.ts:66-70 | `voterDataset.candidates` — each must have `termsOfUseAccepted` + complete answer map on test-voter-q-1..8. Total visible voter-dataset candidates == 6. |
| test-voter-cand-hidden | candidates | tests/tests/specs/voter/voter-matching.spec.ts:121, 234-240 | Exactly ONE candidate in the combined dataset has `termsOfUseAccepted` absent; the spec asserts NOT visible in results. |
| test-party-a, test-party-b | organizations | tests/tests/specs/voter/voter-results.spec.ts:28 | `defaultDataset.organizations.length` spread into `totalPartyCount` count assertion (expects 2 from default). |
| test-voter-party-a, test-voter-party-b | organizations | tests/tests/specs/voter/voter-results.spec.ts:28 | `voterDataset.organizations.length` spread into `totalPartyCount`; expects 2 from voter-dataset (4 total). |
| test-cg-1 | constituency_groups | tests/tests/data/default-dataset.json:14 — referenced by elections._constituencyGroups; Playwright `voter.fixture.ts` drives default-locale voter journey relying on test-election-1 → test-cg-1 → test-constituency-alpha | Implicit: no spec names `test-cg-1` literally, but `voter/*.spec.ts` `answeredVoterPage` fixture navigates the voter journey successfully, which requires the election to have a non-empty constituencyGroups → constituencies chain. Default dataset provides this chain; e2e template MUST preserve the (name-agnostic) chain or all voter specs break. |
| test-voter-nom-agree..partial/hidden, test-nom-alpha..epsilon, test-voter-nom-org-party-a/b, test-nom-org-party-a/b | nominations | tests/tests/specs/voter/voter-matching.spec.ts (algorithm traversal) + voter-results.spec.ts:40-46 (card count == visible candidates) | Every visible candidate MUST have a nomination tying it to test-election-1 + test-constituency-alpha; voter-results counts candidate cards == `visibleCandidateCount` (11). Without nominations, candidates don't appear. Organization nominations are what create the 4 parties on the results page's "parties" tab. |
| test-nom-unregistered, test-nom-unregistered-2 | nominations | tests/tests/specs/candidate/candidate-profile.spec.ts + candidate-registration.spec.ts (via `sendEmail` flow: candidate must have a nomination so `inviteUserByEmail` finds a linked row) | Addendum nominations have `unconfirmed: true` — this is ASSERTED indirectly: voter-results counts visible candidates as `termsOfUseAccepted`-filtered; addendum candidates lack that flag so aren't counted, matching the spec's 11-count assertion. |

### Section 2 — Candidate / Party / Election / Constituency Names (display-text contracts)

Literal strings the specs assert on via `getByText`, `hasText`, combobox `name:`, or role `name:` regex.

| Name (en) | Entity Type | External ID | Referenced In (file:line) |
|---|---|---|---|
| Test Election 2025 | election (name) | test-election-1 | tests/tests/specs/variants/constituency.spec.ts:292 — `dialog.getByText(/Test Election 2025/)` asserted visible |
| Test Election 2026 | election (name) | test-election-2 | tests/tests/specs/variants/constituency.spec.ts:293 — `dialog.getByText(/Test Election 2026/)` asserted visible |
| Test Election 2025 | election (name) | test-election-1 | tests/tests/specs/variants/multi-election.spec.ts:247 — `electionAccordion.getByRole('option', { name: /2025/ })` — asserted as election-with-candidates |
| Municipalities | constituency_group (name) | test-cg-municipalities | tests/tests/specs/variants/startfromcg.spec.ts:141, 153 — `constituenciesList.getByRole('combobox', { name: /Municipalities/ })` asserted visible |
| Municipalities | constituency_group (name) | test-cg-municipalities | tests/tests/specs/variants/startfromcg.spec.ts:268 — second-invocation combobox on orphan flow |
| Municipalities | constituency_group (name) | test-cg-municipalities | tests/tests/specs/variants/constituency.spec.ts:119 — `constituenciesList.getByRole('combobox', { name: /Municipalities/ })` asserted visible (two comboboxes, one per election) |
| North Municipality A | constituency (name) | test-const-muni-north-a | tests/tests/specs/variants/startfromcg.spec.ts:157, 160 — filled into combobox + listbox option click |
| North Municipality A | constituency (name) | test-const-muni-north-a | tests/tests/specs/variants/constituency.spec.ts:124, 127, 132, 135 — filled/clicked twice (once per election) |
| Orphan Municipality | constituency (name) | test-const-muni-orphan | tests/tests/specs/variants/startfromcg.spec.ts:270, 273 — filled into combobox + listbox option click on orphan edge case |
| Alpha | candidate lastName substring | test-candidate-alpha | tests/tests/specs/candidate/candidate-questions.spec.ts:267 — `previewPage.container.getByText('Alpha', { exact: false })` asserted visible; matches `lastName: "Alpha"` on the pre-authenticated candidate |
| not available | (dialog helper text) | — (UI copy, not dataset) | tests/tests/specs/variants/constituency.spec.ts:294 — `/not available/` regex; this is a `sveltekit-i18n` string key rendered by the voter app, NOT a seeded-data contract. Documented for completeness. |

#### Section 2.1 — Candidate names via `${firstName} ${lastName}` indirection

These are asserted via template literal, not literal string. The template MUST set the external_id as shown; the literal firstName/lastName values are whatever the template emits (current fixtures use the values below for parity, recommended to preserve).

| External ID | Current firstName | Current lastName | Assertion mode | Referenced In (file:line) |
|---|---|---|---|---|
| test-voter-cand-agree | Fully | Agree | `firstCard.toContainText(agreeName)` | tests/tests/specs/voter/voter-matching.spec.ts:202-204 |
| test-voter-cand-oppose | Fully | Oppose | `lastCard.toContainText(opposeName)` | tests/tests/specs/voter/voter-matching.spec.ts:212-214 |
| test-voter-cand-partial | Partial | Answers | `candidateSection.toContainText(partialName)` + `not.toContainText` on first/last | tests/tests/specs/voter/voter-matching.spec.ts:221-231 |
| test-voter-cand-hidden | Hidden | NoTerms | `candidateSection.not.toContainText(hiddenName)` | tests/tests/specs/voter/voter-matching.spec.ts:234-240 |
| test-candidate-alpha | Test Candidate | Alpha | `page.getByTestId(testIds.voter.results.card).filter({ hasText: alphaCandidate.lastName })` | tests/tests/specs/voter/voter-detail.spec.ts:79 — uses `lastName` literal "Alpha" as filter; MUST match on literal "Alpha" (see Section 2 row) |

**Parity note:** Plan 08 should keep the current first/last names verbatim because:
1. `alphaCandidate.lastName` drives the voter-detail card filter (row above).
2. voter-matching asserts via template literal, so names could theoretically change — but the strings are short and distinctive, and rewriting them buys nothing.

#### Section 2.2 — Candidate/auth emails

| Email | External ID | Referenced In (file:line) |
|---|---|---|
| mock.candidate.2@openvaa.org | test-candidate-alpha | tests/tests/data/default-dataset.json:629 (source) + tests/tests/utils/testCredentials.ts:10 + tests/tests/setup/data.setup.ts:86-87 (forceRegister) + tests/tests/specs/candidate/candidate-auth.spec.ts:16 + candidate-password.spec.ts:23 + candidate-questions.spec.ts:11 (comment) + candidate-questions.spec.ts:258 (comment) — load-bearing: TEST_CANDIDATE_EMAIL is derived from `defaultDataset.candidates[0].email` so the email MUST be exactly `mock.candidate.2@openvaa.org` AND it MUST be the FIRST entry in `defaultDataset.candidates`. |
| test.unregistered@openvaa.org | test-candidate-unregistered | tests/tests/data/candidate-addendum.json:7 (source) + tests/tests/specs/candidate/candidate-registration.spec.ts:28 (via `candidateAddendum.candidates[0].email`) + tests/tests/setup/data.setup.ts:79 (unregisterCandidate) + tests/seed-test-data.ts:76 |
| test.unregistered2@openvaa.org | test-candidate-unregistered-2 | tests/tests/data/candidate-addendum.json:15 (source) + tests/tests/specs/candidate/candidate-profile.spec.ts:33 (via `candidateAddendum.candidates[1].email`) + tests/tests/setup/data.setup.ts:80 (unregisterCandidate) + tests/seed-test-data.ts:77 |

**Ordering invariant:** `defaultDataset.candidates[0]` MUST be the `test-candidate-alpha` row (testCredentials.ts:10); `candidateAddendum.candidates[0]` MUST be `test-candidate-unregistered` and `candidateAddendum.candidates[1]` MUST be `test-candidate-unregistered-2` (registration.spec.ts:28-29, profile.spec.ts:33-34). Plan 08's `fixed[]` arrays MUST maintain this ORDER, or template import ordering changes will break the specs.

### Section 3 — Relational Contracts

Candidate → Organization → Constituency → Election triangles (and nomination rows binding them) that specs explicitly depend on. Each row is grep-verified; nomination rows cited by external_id.

#### Section 3.1 — Default dataset triangles (dataset shipped as-is by Plan 08)

Used by every non-variant voter/candidate spec via `data.setup.ts` (imports default-dataset.json).

- test-candidate-alpha → test-party-a → test-constituency-alpha → test-election-1 (nomination: test-nom-alpha @ default-dataset.json:831-846; load-bearing — alpha is the authenticated candidate across all candidate specs)
- test-candidate-beta → test-party-a → test-constituency-alpha → test-election-1 (nomination: test-nom-beta @ default-dataset.json:849-864)
- test-candidate-gamma → test-party-b → test-constituency-alpha → test-election-1 (nomination: test-nom-gamma @ default-dataset.json:866-881)
- test-candidate-delta → test-party-b → test-constituency-alpha → test-election-1 (nomination: test-nom-delta @ default-dataset.json:883-898)
- test-candidate-epsilon → test-party-a → test-constituency-alpha → test-election-1 (nomination: test-nom-epsilon @ default-dataset.json:900-915)
- test-party-a → test-constituency-alpha → test-election-1 (organization nomination: test-nom-org-party-a @ default-dataset.json:917-929 — makes the party visible on the results parties tab)
- test-party-b → test-constituency-alpha → test-election-1 (organization nomination: test-nom-org-party-b @ default-dataset.json:931-943)

**Asserted by:** tests/tests/specs/voter/voter-results.spec.ts:40-46 (card count 11 = 5 default + 6 voter registered candidates); voter-detail.spec.ts:79 (alpha card filterable by last name "Alpha"); voter-matching.spec.ts:86-90 (ranking computation across combined candidate set).

#### Section 3.2 — Voter-dataset triangles (additive — shipped alongside default by data.setup.ts)

Required so voter-matching.spec.ts's algorithm verification sees the FULL 11-candidate set (5 default + 6 visible voter) and computes the correct tier ordering.

- test-voter-cand-agree → test-voter-party-a → test-constituency-alpha → test-election-1 (nomination: test-voter-nom-agree @ voter-dataset.json:736-751)
- test-voter-cand-close → test-voter-party-a → test-constituency-alpha → test-election-1 (nomination: test-voter-nom-close @ voter-dataset.json:753-768)
- test-voter-cand-neutral → test-voter-party-a → test-constituency-alpha → test-election-1 (nomination: test-voter-nom-neutral @ voter-dataset.json:770-785)
- test-voter-cand-oppose → test-voter-party-b → test-constituency-alpha → test-election-1 (nomination: test-voter-nom-oppose @ voter-dataset.json:787-802)
- test-voter-cand-mixed → test-voter-party-b → test-constituency-alpha → test-election-1 (nomination: test-voter-nom-mixed @ voter-dataset.json:804-819)
- test-voter-cand-partial → test-voter-party-b → test-constituency-alpha → test-election-1 (nomination: test-voter-nom-partial @ voter-dataset.json:821-836)
- test-voter-cand-hidden → test-voter-party-a → test-constituency-alpha → test-election-1 (nomination: test-voter-nom-hidden @ voter-dataset.json:838-854 — `unconfirmed: true` AND candidate lacks `termsOfUseAccepted` → never appears in results; spec voter-matching.spec.ts:234-240 asserts on this invisibility)
- test-voter-party-a → test-constituency-alpha → test-election-1 (organization nomination: test-voter-nom-org-party-a @ voter-dataset.json:856-868)
- test-voter-party-b → test-constituency-alpha → test-election-1 (organization nomination: test-voter-nom-org-party-b @ voter-dataset.json:870-882)

**Asserted by:** tests/tests/specs/voter/voter-matching.spec.ts:76-102 (candidate entity construction + algorithm match); voter-results.spec.ts:40-46 (11-card assertion).

#### Section 3.3 — Candidate-addendum triangles (unregistered candidates)

- test-candidate-unregistered → test-party-a → test-constituency-alpha → test-election-1 (nomination: test-nom-unregistered @ candidate-addendum.json:21-38; `unconfirmed: true`)
- test-candidate-unregistered-2 → test-party-a → test-constituency-alpha → test-election-1 (nomination: test-nom-unregistered-2 @ candidate-addendum.json:39-56; `unconfirmed: true`)

**Asserted by:** tests/tests/specs/candidate/candidate-registration.spec.ts:36-50 (sendEmail via candidateExternalId resolves a nominated, un-registered candidate row → inviteUserByEmail flow); candidate-profile.spec.ts:57-61 (same for `candidateAddendum.candidates[1]`). `unconfirmed: true` is load-bearing because:
  - It signals to the sendEmail/inviteUserByEmail code path that this candidate has never been registered (no auth_user_id), triggering the invite flow vs. the magic-link flow.
  - Absence of `termsOfUseAccepted` on addendum candidates is what keeps the candidate count at 11 (not 13) in voter-results.spec.ts.

### Section 4 — Implicit Invariants (NOT Carried Forward, per D-58-15)

Items present in the JSON fixtures that NO Playwright spec asserts on. D-58-15 REJECTS mechanical translation; Plan 08 MUST OMIT these from the e2e template unless it has an independent reason to include them (in which case, document that reason inline in the template file).

Grep methodology: for each candidate item, run `rg -l "${item}" tests/tests/specs --type ts`. Empty output (or matches only within comments/unrelated files) → item goes here.

| Fixture Item | Present In | Asserted By Specs? | Action |
|---|---|---|---|
| test-cg-1 (name "Test Constituency Group") | default-dataset.json:14-25 | NO literal reference; rg returns 0 hits in `tests/tests/specs/`. Chain is required structurally (election → cg → constituency) but the external_id and display name are never asserted. | KEEP the constituency_group row (structural necessity) but the **external_id `test-cg-1` and name "Test Constituency Group" MAY be regenerated** by Plan 08. Recommendation: preserve verbatim to minimize cross-file churn. |
| Candidate `answersByExternalId.test-question-date.value = "1985-03-15"` on Alpha | default-dataset.json:653-655 | NO — rg for `"1985-03-15"` in specs: 0 hits. | OMIT the date-type info answer. If Plan 08 retains `test-question-date` (see row below) it MAY leave the Alpha answer absent or regenerate. |
| Candidate `answersByExternalId.test-question-number.value = 8` on Alpha | default-dataset.json:656-658 | NO — rg for distinctive number-type answer reference: 0 hits. | OMIT if `test-question-number` is dropped. |
| Candidate `answersByExternalId.test-question-boolean.value = false` on Alpha | default-dataset.json:664-666 | NO — rg for distinctive boolean answer reference: 0 hits. | OMIT if `test-question-boolean` is dropped. |
| `info` markdown blocks on candidate answers (e.g. `"I believe progressive taxation helps reduce inequality."`, `"The transition must be balanced with economic realities."`, `"Healthcare is a fundamental right for everyone."` on Alpha) | default-dataset.json:634-648 | YES — voter-detail.spec.ts:107-112 iterates `openAnswerKeys` from the Alpha row and asserts each `info.en` substring appears in the opinions tab. | **KEEP** for test-candidate-alpha. The exact strings don't need to match the current fixtures — any non-empty `info.en` on opinion answers will satisfy the substring assertion. Plan 08 MAY regenerate info strings as long as Alpha has info text on at least one opinion-type answer. |
| `info` markdown on non-Alpha candidates (beta-epsilon, voter-dataset rows) | default-dataset.json:682-784 (sparse) + voter-dataset.json (0 info fields) | NO — voter-detail.spec.ts only asserts Alpha's openAnswerKeys. | OMIT info fields on non-Alpha candidates. Plan 08 need not populate these. |
| test-qt-likert5 (referenced only in a code comment) | voter-matching.spec.ts:38 | NO — mentioned only in explanatory comment; no grep hit on actual code. | OMIT — not a real external_id in any fixture. (Grep hit is a false-positive from a doc comment.) |
| test-bank-auth-sub-001, test-enc-1, test-sig-1, test-client-id, test-idp, https://test-idp.example.com | candidate-bank-auth.spec.ts:37,59,62,70,88-90 | These are JWT/JWE test key material IDs + test IdP config — NOT Supabase dataset external_ids. They live in the Edge Function configuration, not in `bulk_import`-ed tables. | OMIT from the e2e template — the bank-auth spec is disabled by default (gated on `PLAYWRIGHT_BANK_AUTH=1`, see candidate-bank-auth.spec.ts:16) and its identity-provider config is separate from the dev-seed surface. |
| test-voter-cat-economy, test-voter-cat-social (category names "Test Voter Category: Economy", "Test Voter Category: Social") | voter-dataset.json:4-32 | NO direct name/id literal in specs. | KEEP category rows (voter questions MUST belong to a category for the voter journey), but external_ids and names MAY be regenerated. Recommend preserving verbatim. |
| test-category-economy, test-category-social, test-category-info (default categories) | default-dataset.json:44-89 | NO direct name/id literal in specs. | KEEP 3 categories (1 info + 2 opinion) to preserve matching-spec's 8-ordinal filter result. External_ids and names MAY be regenerated. |
| Question choices `{ "id": "1", "key": "1", "normalizableValue": "1", "label": {"en": "Fully disagree"} }` — the exact Likert-5 choice schema | default-dataset.json:104-149 (and 10+ other questions) | PARTIAL — voter-matching.spec.ts:49 calls `OrdinalQuestion.fromLikert({ id: q.externalId, scale: LIKERT_SCALE })` where `LIKERT_SCALE = 5`, and maps dataset answer values `"1"..."5"` to `choice_1..choice_5` (line 80). So the LIKERT-5 shape is required, but the exact choice labels ("Fully disagree" etc.) are NEVER asserted on. | KEEP the Likert-5 choice shape (5 choices, keys "1"-"5"). MAY regenerate labels (current "Fully disagree"/"Somewhat disagree"/"Neutral"/"Somewhat agree"/"Fully agree" is parity-recommended but not spec-required). |
| Question `customData.allowOpen: true` | default-dataset.json:97-99 | PARTIAL — candidate-questions.spec.ts:67-69 comment says "available because test-question-1 has customData.allowOpen = true" and fills a comment. | KEEP `allowOpen: true` on at least one opinion question (the first in sort order) so candidate-questions.spec.ts's "Fill comment" step has a comment field to fill. Recommended: preserve on test-question-1 specifically. |
| `projectId: "00000000-0000-0000-0000-000000000001"` on every row | every fixture | Required by `bulk_import` schema; not a spec-asserted contract. | KEEP — this is infrastructure-level, handled by Phase 56's generator ctx. Plan 08's `fixed[]` rows should not hardcode it; the writer injects it. |
| `published: true` on every row | every fixture | Required so `findData()` queries return the rows (publish-filter on frontend queries); not a spec-asserted literal. | KEEP — structural requirement of the bulk_import/query infrastructure. |
| constituency-overlay.json rows: test-const-region-north/south, test-const-muni-north-a/south-a/east, test-const-q-north-1, test-const-e2-q-1/2, test-const-cand-north-1/2/south-1/muni-1/2, test-nom-const-*, test-cat-const-north, test-cat-e2-local | constituency-overlay.json (all rows) | YES — variants/constituency.spec.ts asserts on "North Municipality A" (Section 2), test-cat-const-north/test-cat-e2-local (comment only, no runtime assertion — Section 8), and Test Election 2025/2026 (Section 2). | **OVERLAY** — Plan 08's base e2e template is the NON-variant dataset (default + voter + addendum merged). Overlays are loaded by per-variant setup files and are OUT-OF-SCOPE for the base `e2e` template. Phase 59/60 may address overlay-driven templates. Plan 08 MUST NOT include overlay rows in the base e2e template. |
| startfromcg-overlay.json rows: test-const-muni-orphan, test-cat-sfcg-local, test-cat-sfcg-e2, test-sfcg-q-*, test-sfcg-cand-*, test-nom-sfcg-* | startfromcg-overlay.json (all rows) | YES — variants/startfromcg.spec.ts asserts on "Orphan Municipality" (Section 2) and test-cg-municipalities (Section 1). | **OVERLAY** — same treatment as constituency-overlay. Out of scope for the base `e2e` template. |
| multi-election-overlay.json rows: test-cg-e2, test-cat-e2-policy, test-e2-q-1/2, test-e2-cand-1/2/3, test-nom-e2-* | multi-election-overlay.json (all rows) | YES — variants/multi-election.spec.ts asserts on test-election-2, test-constituency-e2 (Section 1) and "2025"/"2026" names (Section 2). | **OVERLAY** — Plan 08 includes test-election-2 and test-constituency-e2 at the BASE level (Section 1) since results-sections and multi-election specs call findData on them. The other overlay-specific rows (test-cat-e2-policy, test-e2-q-*, test-e2-cand-*, test-nom-e2-*) stay in the overlay layer — Phase 59/60 concern. |

#### Section 4.1 — Fixture-only external IDs (0 spec hits, structural-only)

| External ID | Location | Grep result in specs |
|---|---|---|
| test-cg-1 | default-dataset.json:14 | `rg "test-cg-1\\b" tests/tests/specs --type ts` → 0 hits |
| test-question-date | default-dataset.json:548 | `rg "test-question-date" tests/tests/specs --type ts` → 0 hits |
| test-question-number | default-dataset.json:561 | `rg "test-question-number" tests/tests/specs --type ts` → 0 hits |
| test-question-boolean | default-dataset.json:587 | `rg "test-question-boolean" tests/tests/specs --type ts` → 0 hits |

**Decision for test-question-date / number / boolean:** These 3 question rows are NOT asserted on directly. BUT `voter-matching.spec.ts:40-43` filters `defaultDataset.questions.filter(q => q.type === 'singleChoiceOrdinal')` and expects exactly 8 results. That count is satisfied iff the dataset has 8 ordinal + N non-ordinal questions (N >= 0). Plan 08 MAY drop all non-ordinal questions AND the matching assertion still holds (8 ordinal questions × 8 ordinal filter = same result). Recommendation: **DROP** test-question-date, test-question-number, test-question-boolean. **KEEP** test-question-text because voter-detail.spec.ts:88 asserts on `alphaAnswers['test-question-text'].value.en` as the "campaign slogan". Test-question-text is required and must be `text`-type with Alpha having an `en` value present.

### Section 5 — Testid / DOM Contracts (informational)

The `testIds` map lives at `tests/tests/utils/testIds.ts` and is DATA-INDEPENDENT. Spec-level `testId` selectors drive DOM queries, not seeded-data queries — they render regardless of what rows Plan 08 seeds, as long as the seeded rows trigger the right UI components (a candidate card renders when a nominated candidate exists; a constituency combobox renders when a constituency group has N constituencies; etc.).

**Plan 08 MUST NOT add testIds to the e2e template.** The template declares data only. The frontend component layer adds testIds when rendering. The audit records testId-bearing fields only insofar as a testId filter combines with seeded data content (as in voter-detail.spec.ts:79: `page.getByTestId(testIds.voter.results.card).filter({ hasText: alphaCandidate.lastName })`).

Cross-reference: `tests/tests/utils/testIds.ts` for the full testId vocabulary. No action required from Plan 08 regarding this file.

### Section 6 — Auth / Registration Contracts

- **Authenticated candidate:** `mock.candidate.2@openvaa.org` / password driven by `TEST_CANDIDATE_PASSWORD` in `tests/tests/utils/testCredentials.ts:11` (current value `'Password1!'`). Linked to `test-candidate-alpha` by `tests/tests/setup/data.setup.ts:86-87` via `client.forceRegister('test-candidate-alpha', 'mock.candidate.2@openvaa.org', TEST_CANDIDATE_PASSWORD)`. **The forceRegister call is OUTSIDE the e2e template's `fixed[]` scope — it lives in the test-framework auth setup.** Plan 08 only needs to ensure a candidate row with `external_id: 'test-candidate-alpha'` and `email: 'mock.candidate.2@openvaa.org'` exists; the auth linking is orchestrated by Phase 59 when it rewrites tests/seed-test-data.ts.
- **Fresh registration candidates:**
  - `test.unregistered@openvaa.org` → `test-candidate-unregistered` (candidateAddendum.candidates[0])
  - `test.unregistered2@openvaa.org` → `test-candidate-unregistered-2` (candidateAddendum.candidates[1])
  - These must NOT have an auth_user_id on seed (Plan 08's fixed[] rows for candidates skip the auth link). `tests/tests/setup/data.setup.ts:79-80` calls `unregisterCandidate(email)` to clean stale auth users between test runs.
- **Discrepancy flagged (informational, not a blocker):** `tests/seed-test-data.ts:22` declares `TEST_CANDIDATE_PASSWORD = 'TestPassword123!'`, which DIFFERS from `tests/tests/utils/testCredentials.ts:11` (`'Password1!'`). `seed-test-data.ts` is the standalone manual-dev seed script; `testCredentials.ts` is the Playwright auth setup. Plan 08 only wires the candidate rows — password literal values are not part of the template. Phase 59 may reconcile the two scripts; out of scope here.

### Section 7 — Row-Count Summary (for Plan 08 `fixed[]` array sizing)

Aggregated minimum row counts by table, derived from Sections 1–3 references + Section 4 decisions. Plan 08 uses this as the SOURCE OF TRUTH for `organizations: { count: 2, fixed: [...] }`-style sizing.

| Table | Min Rows Required | Rationale (Section references) |
|---|---|---|
| elections | 2 | test-election-1 (§1 row 10) + test-election-2 (§1 row 12). test-election-2 is required at BASE because `results-sections.spec.ts:172` and `multi-election.spec.ts:136` call findData on it even though only the multi-election variant uses it behaviorally. Base dataset must include the row so the admin-client query doesn't fail. **CORRECTION:** On closer inspection, `multi-election.spec.ts` and `results-sections.spec.ts` both depend on `variant-multi-election` setup OR `multi-election-overlay.json` being applied — the multi-election setup file imports the overlay which contains test-election-2. So base e2e template needs ONLY test-election-1. Flagged in §8 for Plan 08 to resolve. |
| constituency_groups | 1 (base) / 1+ (with variants) | test-cg-1 (base) — required structurally. test-cg-municipalities is a variant-overlay row. |
| constituencies | 1 (base) | test-constituency-alpha (§3.1). test-constituency-e2 ships in the multi-election overlay. Base e2e template needs only test-constituency-alpha. |
| organizations | 4 | test-party-a, test-party-b (default-dataset) + test-voter-party-a, test-voter-party-b (voter-dataset) — voter-results.spec.ts:28 sums both counts. |
| candidates | 13 | 5 default registered + 6 voter registered + 1 voter hidden + 2 addendum unregistered. Breakdown:<br>• test-candidate-alpha, -beta, -gamma, -delta, -epsilon (5, `termsOfUseAccepted` set)<br>• test-voter-cand-agree, -close, -neutral, -oppose, -mixed, -partial (6, `termsOfUseAccepted` set)<br>• test-voter-cand-hidden (1, `termsOfUseAccepted` absent)<br>• test-candidate-unregistered, -unregistered-2 (2, `termsOfUseAccepted` absent)<br>voter-results.spec.ts asserts 11 visible = 5 + 6. |
| question_categories | 3 (default) + 2 (voter) = 5 | test-category-economy, test-category-social, test-category-info (default) + test-voter-cat-economy, test-voter-cat-social (voter). Matching spec requires ordinal-type questions to come from valid category rows. |
| questions | 9 (default opinion) + 8 (voter opinion) + 1 (default info: text) = 17 or 16 | Matching-spec filters `type === 'singleChoiceOrdinal'` → needs exactly 8 default opinion questions (test-question-1..8) + 8 voter opinion questions (test-voter-q-1..8) = 16 ordinal. voter-detail.spec.ts asserts on `test-question-text` → +1 info question. **DROP** test-question-date, -number, -boolean per §4.1 decision. Total: 16 ordinal + 1 text = **17 question rows**. If Plan 08 wants to be maximally conservative, keep 4 info questions (current fixture has 4: date/number/text/boolean) → 20 total, but 17 is correct per §4.1. |
| nominations | 18 | Default dataset: 5 candidate-nominations (alpha..epsilon) + 2 org-nominations (party-a/b) = 7. Voter dataset: 7 candidate-nominations (agree..hidden) + 2 org-nominations (voter-party-a/b) = 9. Addendum: 2 candidate-nominations (unregistered, -2) = 2. Total: 7 + 9 + 2 = 18. voter-results card-count assertion (11 visible) is satisfied by `termsOfUseAccepted`-filter on candidates, NOT by nomination count. |
| question_type_choices / choices (embedded as JSONB `choices` on questions) | N/A embedded | 5 choices per Likert-5 question (keys "1"-"5", ordered). Not a separate table in the current schema. |

**Answer counts (candidate answers JSONB):** 5 default candidates × 8 questions (alpha answers test-question-text + 4 opinion + 3 fixture-only; others answer test-question-1..8 fully) + 6 voter registered × 8 questions + 1 voter hidden × 8 questions + 2 addendum × 0 = ~91 `answersByExternalId` entries (but JSONB, so counted per candidate row, not per table). See §1.1 for per-candidate answer coverage requirements.

### Section 8 — Open Questions / Non-Resolvable Contracts

### 8.1 Is `test-election-2` a base-template or overlay-only row?

**Issue:** `tests/tests/specs/variants/multi-election.spec.ts:136` and `tests/tests/specs/variants/results-sections.spec.ts:172` both call `findData('elections', { externalId: { $eq: 'test-election-2' } })`. If the test-election-2 row is created only by `multi-election-overlay.json` (loaded by `variant-multi-election.setup.ts`), then the base `e2e` template from Plan 08 does NOT need test-election-2. If however the `results-sections` project depends on a combined dataset, it might need test-election-2 at base.

**Grep evidence:** `tests/tests/setup/variant-multi-election.setup.ts` merges default+voter+multi-election-overlay. Spec `results-sections.spec.ts` runs under which project? Check `playwright.config.ts`.

**Resolution recommendation for Plan 08:** The base `e2e` template creates ONLY the default+voter content (test-election-1 + test-constituency-alpha). Variant specs (multi-election, results-sections, constituency, startfromcg) are served by overlay-merged datasets — their setup files load the overlays on top. If Plan 08 is producing only the BASE e2e template, then `test-election-2` / `test-constituency-e2` / `test-cg-municipalities` etc. are Plan 59+ concerns (overlay template work).

If Plan 08 is producing a FULL e2e template that replaces ALL of default+voter+overlays in one shot, then §1 rows 11, 13, 15, 17, 18 and the overlay rows in §4 must be carried forward. **Plan 08 must resolve this at its authoring step based on its own scope boundary.** Recommendation: **SCOPE Plan 08 to the base (default+voter+addendum)**; defer overlay templates to Phase 59/60.

### 8.2 `answersByExternalId` JSONB structure under Plan 08's `fixed[]`

**Issue:** Phase 56's `candidates` generator accepts `fixed[]` rows, but the embedded `answersByExternalId` JSONB per candidate is a complex nested shape (values of type string | number | boolean | object, optional `info` sub-objects). Plan 08's template file must express this shape, and Phase 56/57's writer must handle the import correctly.

**Resolution recommendation for Plan 08:** Verify during implementation that the `SupabaseAdminClient.importAnswers` path is invoked for template-driven candidate rows (not only for JSON-fixture-loaded ones). If the writer doesn't yet import `answersByExternalId` from `fixed[]` candidate rows, Plan 08 must extend the writer (deviation: Rule 2 — missing critical functionality) before the template is functional.

### 8.3 Voter-dataset `test-voter-cand-hidden` fixture quirk

**Issue:** `voter-dataset.json:700-732` has `test-voter-cand-hidden` WITHOUT `termsOfUseAccepted`, and its nomination (`test-voter-nom-hidden`, lines 838-854) has `unconfirmed: true`. voter-matching.spec.ts:234-240 asserts this candidate is NOT visible. The distinction between "no termsOfUseAccepted" (candidate-level hidden) and "unconfirmed" (nomination-level hidden) is subtle — the spec references the candidate-level absence via `voterDataset.candidates.find((c) => !c.termsOfUseAccepted)`.

**Resolution:** Plan 08 MUST ship `test-voter-cand-hidden` with `termsOfUseAccepted: undefined/null/absent` AND `test-voter-nom-hidden` with `unconfirmed: true` (matching the double-belt-and-braces pattern of the current fixture). If only one dimension is preserved, the spec invariant degrades.

### 8.4 `customData.allowOpen: true` propagation to the frontend

**Issue:** candidate-questions.spec.ts:67-69 depends on the comment field being available in the UI when answering test-question-1. The fixture sets `customData.allowOpen: true` on test-question-1 (default-dataset.json:97-99). Plan 08 MUST preserve this `customData` field on at least one opinion question.

**Resolution:** Recommended — preserve `customData.allowOpen: true` on test-question-1 verbatim. Alternatively, add it to the first ordinal question the spec interacts with (index 0 in candidate-questions navigation order). This is a frontend-rendering invariant, not a matching invariant.

### 8.5 Comment-only spec references not recorded in Section 1

**Issue:** The following appear in spec source but only inside comment blocks — no runtime assertion:
- `test-cat-const-north` in tests/tests/specs/variants/constituency.spec.ts:210 (comment)
- `test-cat-e2-local` in tests/tests/specs/variants/constituency.spec.ts:211 (comment)
- `test-const-muni-orphan` in tests/tests/specs/variants/startfromcg.spec.ts:252 (comment)
- `test-question-1` in tests/tests/specs/candidate/candidate-questions.spec.ts:67 (comment)

These are DOCUMENTARY. The spec code elsewhere exercises the underlying contract (the category, the orphan row, the first-question allowOpen) without referencing the external_id literal. They don't need Section 1 entries because the runtime contract is expressed through other means (name, ordering, presence).

### 8.6 Bank-auth spec data dependencies

**Issue:** `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` creates a synthetic candidate via the identity-callback Edge Function; the specs do NOT read existing seeded candidate rows. The test-* identifiers in that spec are JWT/JWE key IDs and OIDC config values, NOT dataset external_ids. Moreover the bank-auth spec is disabled by default (gated on `PLAYWRIGHT_BANK_AUTH=1`).

**Resolution:** Plan 08 has NO obligations for the bank-auth spec. Section 4 treatment applies.

### 8.7 Visual regression & performance budget specs

**Issue:** `visual-regression.spec.ts` and `performance-budget.spec.ts` depend on the `answeredVoterPage` fixture, which drives the voter journey. They inherit all voter-spec data contracts but add no new external_id requirements.

**Resolution:** No Plan 08 action beyond satisfying Sections 1–3 for voter specs.

---

## Plan 08 Checklist (derived from this audit)

- [ ] e2e template `fixed[]` arrays cover Sections 1 + 2 + 3 (not Section 4)
- [ ] `test-candidate-alpha` is `defaultDataset.candidates[0]` (ordering invariant, §2.2)
- [ ] `test-candidate-unregistered` is `candidateAddendum.candidates[0]` and `test-candidate-unregistered-2` is `candidateAddendum.candidates[1]` (ordering invariant, §2.2) — or equivalent if the e2e template unifies addendum + base candidates
- [ ] test-candidate-alpha email = `mock.candidate.2@openvaa.org` verbatim (§2.2, load-bearing)
- [ ] test-candidate-alpha.`answersByExternalId['test-question-text'].value.en` is non-empty (voter-detail.spec.ts:88)
- [ ] At least one opinion answer on test-candidate-alpha has a non-empty `info.en` (voter-detail.spec.ts:107-112)
- [ ] test-question-1 has `customData.allowOpen: true` (§8.4)
- [ ] 8 default-dataset ordinal questions + 8 voter-dataset ordinal questions (§1.1, matching-spec count)
- [ ] test-question-text exists as `text`-type info question (§4.1)
- [ ] test-voter-cand-hidden lacks `termsOfUseAccepted` AND its nomination has `unconfirmed: true` (§8.3)
- [ ] Election names verbatim: "Test Election 2025" for test-election-1 (§2)
- [ ] Constituency-group name "Municipalities" for test-cg-municipalities (ONLY if Plan 08 includes variant overlays — see §8.1)
- [ ] Full relational wiring per §3.1 (5 default triangles + 2 org nominations), §3.2 (7 voter triangles + 2 org nominations), §3.3 (2 addendum triangles, unconfirmed)
- [ ] `generateTranslationsForAllLocales: false` in the template header (D-58-16)
- [ ] Document in the template file itself any deviations from this audit, citing the audit section number
