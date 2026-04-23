/**
 * `e2e` built-in template — TMPL-05.
 *
 * Shape matches what Playwright specs in `tests/tests/specs/**\/*.spec.ts`
 * depend on. Authored from `.planning/phases/58-templates-cli-default-dataset/58-E2E-AUDIT.md`
 * (Plan 01 output) — NOT from mechanical translation of the legacy JSON
 * fixtures. D-58-15 REJECTS mechanical port: Sections 1–3 of the audit are
 * a POSITIVE inclusion list; Section 4 is an EXCLUSION list.
 *
 * D-58-16: `generateTranslationsForAllLocales` is `false` — Playwright specs
 * run against a single locale and the 4x JSONB payload is pure overhead.
 *
 * Phase 59 rewrites `tests/seed-test-data.ts` to invoke this template; Plan
 * 08's scope stops at the template surface + registry + parity tests.
 * Plan 09's integration test verifies row counts + external_id presence
 * end-to-end against a live Supabase.
 *
 * ## External ID strategy
 *
 * Every `fixed[]` entry here carries its FULL literal external_id (e.g.
 * `'test-candidate-alpha'`). `externalIdPrefix` is `''` so Phase 56's
 * generators pass the id through verbatim
 * (`${externalIdPrefix}${fx.external_id}` → `''+fx.external_id`). This
 * matches the spec-asserted ids in audit §Section 1 without double-prefixing.
 *
 * ## Audit citations
 *
 * Every entry below has a citation to 58-E2E-AUDIT.md — a spec file:line that
 * depends on that exact external_id / name / relational triangle. Adding a
 * new entry without an audit update is a code-review flag.
 *
 * Sections referenced:
 *   §1   — external IDs referenced directly by specs (positive list)
 *   §1.1 — indirected IDs enforced by dataset-shape iteration
 *   §2   — display-text contracts (literal strings asserted by specs)
 *   §2.1 — candidate firstName/lastName via template literal
 *   §2.2 — candidate emails + ordering invariants
 *   §3.1 — default-dataset relational triangles
 *   §3.2 — voter-dataset relational triangles (additive)
 *   §3.3 — candidate-addendum triangles (unconfirmed nominations)
 *   §4.1 — fixture-only external IDs NOT carried forward (D-58-15 exclusion)
 *   §7   — row-count summary / minimum counts per table
 *   §8.1 — scope decision: base template includes overlay-level rows
 *          (test-election-2, test-constituency-e2, test-cg-municipalities)
 *          per Plan 08's must_haves.truths — the audit's §8.1 recommendation
 *          to defer these to Phase 59/60 is overridden by this plan.
 *
 * ## Question choice shape
 *
 * Ordinal questions use the Phase 56 LIKERT_5 convention (normalizableValue
 * per QuestionsGenerator.ts:56-62). The legacy fixtures duplicate `id` as
 * `key` and stringify `normalizableValue`; the canonical shape used here
 * drops the stringification (matches Phase 57's latent emitter which reads
 * `normalizableValue` numerically).
 */

import type { Template } from '../template/types';

/**
 * Shared Likert-5 choice array. Every singleChoiceOrdinal question in this
 * template uses this exact shape — satisfies the Phase 57 ordinal-dispatch
 * contract + the spec-invariant `LIKERT_SCALE = 5` read at
 * voter-matching.spec.ts:49 (audit §4 row "Likert-5 choice schema").
 *
 * The labels MAY be regenerated (§4 row flags this as parity-recommended but
 * not spec-required). Preserving verbatim minimizes cross-file churn.
 */
const LIKERT_5_EN: Array<{ id: string; label: { en: string }; normalizableValue: number }> = [
  { id: '1', label: { en: 'Fully disagree' }, normalizableValue: 1 },
  { id: '2', label: { en: 'Somewhat disagree' }, normalizableValue: 2 },
  { id: '3', label: { en: 'Neutral' }, normalizableValue: 3 },
  { id: '4', label: { en: 'Somewhat agree' }, normalizableValue: 4 },
  { id: '5', label: { en: 'Fully agree' }, normalizableValue: 5 }
];

export const e2eTemplate: Template = {
  seed: 42,
  externalIdPrefix: '', // D-58-15: full 'test-' literal ids pre-written in fixed[]
  generateTranslationsForAllLocales: false, // D-58-16

  // §1 rows 10 + 12 — test-election-1 + test-election-2. Names per §2
  // (constituency.spec.ts:292-293 asserts visibility of 'Test Election 2025'
  // and 'Test Election 2026' literals).
  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'test-election-1',
        name: { en: 'Test Election 2025' },
        short_name: { en: 'Election 2025' },
        election_type: 'general',
        election_date: '2025-06-15',
        sort_order: 0,
        is_generated: false,
        multiple_rounds: false,
        current_round: 1
      },
      {
        external_id: 'test-election-2',
        name: { en: 'Test Election 2026' },
        short_name: { en: 'Election 2026' },
        election_type: 'general',
        election_date: '2026-06-15',
        sort_order: 1,
        is_generated: false,
        multiple_rounds: false,
        current_round: 1
      }
    ]
  },

  // §4 row "test-cg-1" — structural chain requirement (no literal assertion
  // but voter journey navigation requires election → cg → constituency).
  // §1 row 18 — test-cg-municipalities with display name 'Municipalities'
  // asserted by startfromcg.spec.ts:141/153/268 + constituency.spec.ts:119.
  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: 'test-cg-1',
        name: { en: 'Test Constituency Group' },
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'test-cg-municipalities',
        name: { en: 'Municipalities' },
        sort_order: 1,
        is_generated: false
      }
    ]
  },

  // §1 rows 14 + 16 — test-constituency-alpha + test-constituency-e2.
  // Both referenced by multi-election.spec.ts + results-sections.spec.ts.
  constituencies: {
    count: 0,
    fixed: [
      {
        external_id: 'test-constituency-alpha',
        name: { en: 'Test Constituency Alpha' },
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'test-constituency-e2',
        name: { en: 'Test Constituency E2' },
        sort_order: 1,
        is_generated: false
      }
    ]
  },

  // §1.1 — 4 organizations total. voter-results.spec.ts:28 sums
  // `defaultDataset.organizations.length + voterDataset.organizations.length`
  // as `totalPartyCount` — 2 + 2 = 4.
  organizations: {
    count: 0,
    fixed: [
      {
        external_id: 'test-party-a',
        name: { en: 'Test Party A' },
        short_name: { en: 'TPA' },
        color: { normal: '#2546a8', dark: '#6b8dd6' },
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'test-party-b',
        name: { en: 'Test Party B' },
        short_name: { en: 'TPB' },
        color: { normal: '#a82525', dark: '#d67070' },
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'test-voter-party-a',
        name: { en: 'Voter Test Party Alpha' },
        short_name: { en: 'VPA' },
        color: { normal: '#1f8bc2', dark: '#6bb8dc' },
        sort_order: 2,
        is_generated: false
      },
      {
        external_id: 'test-voter-party-b',
        name: { en: 'Voter Test Party Beta' },
        short_name: { en: 'VPB' },
        color: { normal: '#d88b1e', dark: '#f0b96b' },
        sort_order: 3,
        is_generated: false
      }
    ]
  },

  // §4 row "test-category-economy/social/info + test-voter-cat-economy/social" —
  // external_ids MAY be regenerated but preserved here for parity. Total 5
  // categories: 3 default (1 info + 2 opinion) + 2 voter (both opinion) satisfies
  // matching spec's 8-ordinal filter across the full dataset.
  question_categories: {
    count: 0,
    fixed: [
      {
        external_id: 'test-category-economy',
        name: { en: 'Test Category: Economy' },
        category_type: 'opinion',
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'test-category-social',
        name: { en: 'Test Category: Social' },
        category_type: 'opinion',
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'test-category-info',
        name: { en: 'Test Category: Background Information' },
        category_type: 'info',
        sort_order: 2,
        is_generated: false
      },
      {
        external_id: 'test-voter-cat-economy',
        name: { en: 'Test Voter Category: Economy' },
        category_type: 'opinion',
        sort_order: 3,
        is_generated: false
      },
      {
        external_id: 'test-voter-cat-social',
        name: { en: 'Test Voter Category: Social' },
        category_type: 'opinion',
        sort_order: 4,
        is_generated: false
      }
    ]
  },

  // §1.1 — 17 questions total:
  //   • 8 default-dataset ordinal (test-question-1..8) — voter-matching.spec.ts:40-43
  //     filters `type === 'singleChoiceOrdinal'` expecting 8 from defaultDataset
  //   • 1 default-dataset text (test-question-text) — voter-detail.spec.ts:88
  //     reads `alphaAnswers['test-question-text'].value` as campaign slogan
  //   • 8 voter-dataset ordinal (test-voter-q-1..8) — voter-matching.spec.ts:42
  //     spreads all voterDataset.questions requiring singleChoiceOrdinal
  //
  // EXCLUDED (§4.1): test-question-date, test-question-number, test-question-boolean
  // — zero grep hits in specs; dropping preserves the 8-ordinal filter result.
  //
  // test-question-1 carries `custom_data.allowOpen: true` per §8.4 —
  // candidate-questions.spec.ts:67-69 depends on the comment field being
  // available when answering the first opinion question.
  questions: {
    count: 0,
    fixed: [
      // Default-dataset opinion questions (test-question-1..4 — Economy)
      {
        external_id: 'test-question-1',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 1: Should taxes on high incomes be increased?' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-economy' },
        custom_data: { allowOpen: true }, // §8.4 — load-bearing for candidate-questions.spec.ts
        allow_open: true,
        required: true,
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'test-question-2',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 2: Economy' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-economy' },
        allow_open: true,
        required: true,
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'test-question-3',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 3: Economy' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-economy' },
        allow_open: true,
        required: true,
        sort_order: 2,
        is_generated: false
      },
      {
        external_id: 'test-question-4',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 4: Economy' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-economy' },
        allow_open: true,
        required: true,
        sort_order: 3,
        is_generated: false
      },
      // Default-dataset opinion questions (test-question-5..8 — Social)
      {
        external_id: 'test-question-5',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 5: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-social' },
        allow_open: true,
        required: true,
        sort_order: 4,
        is_generated: false
      },
      {
        external_id: 'test-question-6',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 6: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-social' },
        allow_open: true,
        required: true,
        sort_order: 5,
        is_generated: false
      },
      {
        external_id: 'test-question-7',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 7: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-social' },
        allow_open: true,
        required: true,
        sort_order: 6,
        is_generated: false
      },
      {
        external_id: 'test-question-8',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 8: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-social' },
        allow_open: true,
        required: true,
        sort_order: 7,
        is_generated: false
      },
      // Default-dataset info question — voter-detail.spec.ts:88 asserts on
      // alphaAnswers['test-question-text'].value (campaign slogan).
      {
        external_id: 'test-question-text',
        type: 'text',
        name: { en: 'Campaign slogan' },
        category: { external_id: 'test-category-info' },
        allow_open: false,
        required: false,
        sort_order: 8,
        is_generated: false
      },
      // Voter-dataset opinion questions (test-voter-q-1..4 — Voter Economy)
      {
        external_id: 'test-voter-q-1',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 1: Economy' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-economy' },
        allow_open: true,
        required: true,
        sort_order: 9,
        is_generated: false
      },
      {
        external_id: 'test-voter-q-2',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 2: Economy' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-economy' },
        allow_open: true,
        required: true,
        sort_order: 10,
        is_generated: false
      },
      {
        external_id: 'test-voter-q-3',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 3: Economy' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-economy' },
        allow_open: true,
        required: true,
        sort_order: 11,
        is_generated: false
      },
      {
        external_id: 'test-voter-q-4',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 4: Economy' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-economy' },
        allow_open: true,
        required: true,
        sort_order: 12,
        is_generated: false
      },
      // Voter-dataset opinion questions (test-voter-q-5..8 — Voter Social)
      {
        external_id: 'test-voter-q-5',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 5: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-social' },
        allow_open: true,
        required: true,
        sort_order: 13,
        is_generated: false
      },
      {
        external_id: 'test-voter-q-6',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 6: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-social' },
        allow_open: true,
        required: true,
        sort_order: 14,
        is_generated: false
      },
      {
        external_id: 'test-voter-q-7',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 7: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-social' },
        allow_open: true,
        required: true,
        sort_order: 15,
        is_generated: false
      },
      {
        external_id: 'test-voter-q-8',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 8: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-social' },
        allow_open: true,
        required: true,
        sort_order: 16,
        is_generated: false
      }
    ]
  },

  // §1 + §2.1 + §2.2 — 13 candidates total.
  //
  // ORDERING INVARIANT (§2.2): test-candidate-alpha MUST be the first
  // registered candidate entry so `defaultDataset.candidates[0]` resolves to
  // it. testCredentials.ts:10 reads `defaultDataset.candidates[0].email` as
  // TEST_CANDIDATE_EMAIL. Phase 59 will consume this ordering when it
  // rewrites seed-test-data.ts.
  //
  // ORDERING INVARIANT (§2.2): test-candidate-unregistered must precede
  // test-candidate-unregistered-2 so registration.spec.ts:28-29 +
  // profile.spec.ts:33-34 can read addendum.candidates[0] / [1] by index.
  // Under the unified template, these are positions [11] and [12] — the
  // filtering by `terms_of_use_accepted` absence in Phase 59 setup code
  // restores the two-element addendum view.
  //
  // terms_of_use_accepted:
  //   • SET on 11 candidates (alpha + beta + gamma + delta + epsilon +
  //     voter-cand-agree/close/neutral/oppose/mixed/partial) — voter-results.spec.ts:40-46
  //     asserts 11 visible candidate cards (spec-asserted invariant).
  //   • ABSENT on 2 addendum + 1 voter-hidden = 3 candidates total hidden from
  //     results; voter-matching.spec.ts:234-240 asserts test-voter-cand-hidden
  //     NOT visible (candidate-level filter).
  //
  // email (§6 + §2.2):
  //   • mock.candidate.2@openvaa.org on test-candidate-alpha — load-bearing;
  //     Phase 59's data.setup.ts reads this via forceRegister.
  //   • test.unregistered@openvaa.org / test.unregistered2@openvaa.org on
  //     the two addendum rows — Phase 59's unregisterCandidate consumes.
  //   bulk_import drops unknown fields; `email` is preserved here as a
  //   Phase 59 hand-off payload (NOT a candidates-table column).
  candidates: {
    count: 0,
    fixed: [
      // Default-dataset registered candidates (test-candidate-alpha FIRST per §2.2)
      {
        external_id: 'test-candidate-alpha',
        first_name: 'Test',
        last_name: 'Candidate Alpha',
        email: 'mock.candidate.2@openvaa.org', // §6 — Phase 59 forceRegister target
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 0,
        is_generated: false,
        organization: { external_id: 'test-party-a' },
        // §1 row 3 + §4 row "info markdown on Alpha" — voter-detail.spec.ts:88
        // reads answersByExternalId['test-question-text'].value as slogan;
        // voter-detail.spec.ts:107-112 iterates Alpha's openAnswerKeys.
        answersByExternalId: {
          'test-question-1': {
            value: '4',
            info: { en: 'I believe progressive taxation helps reduce inequality.' }
          },
          'test-question-3': {
            value: '3',
            info: { en: 'The transition must be balanced with economic realities.' }
          },
          'test-question-5': {
            value: '5',
            info: { en: 'Healthcare is a fundamental right for everyone.' }
          },
          'test-question-7': { value: '4' },
          'test-question-text': { value: { en: 'Progress for all' } }
        }
      },
      {
        external_id: 'test-candidate-beta',
        first_name: 'Test',
        last_name: 'Candidate Beta',
        email: 'test.beta@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 1,
        is_generated: false,
        organization: { external_id: 'test-party-a' },
        answersByExternalId: {
          'test-question-1': { value: '5' },
          'test-question-2': { value: '5' },
          'test-question-3': { value: '4' },
          'test-question-4': { value: '5' },
          'test-question-5': { value: '4' },
          'test-question-6': { value: '5' },
          'test-question-7': { value: '5' },
          'test-question-8': { value: '4' }
        }
      },
      {
        external_id: 'test-candidate-gamma',
        first_name: 'Test',
        last_name: 'Candidate Gamma',
        email: 'test.gamma@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 2,
        is_generated: false,
        organization: { external_id: 'test-party-b' },
        answersByExternalId: {
          'test-question-1': { value: '2' },
          'test-question-2': { value: '1' },
          'test-question-3': { value: '2' },
          'test-question-4': { value: '1' },
          'test-question-5': { value: '2' },
          'test-question-6': { value: '1' },
          'test-question-7': { value: '2' },
          'test-question-8': { value: '1' }
        }
      },
      {
        external_id: 'test-candidate-delta',
        first_name: 'Test',
        last_name: 'Candidate Delta',
        email: 'test.delta@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 3,
        is_generated: false,
        organization: { external_id: 'test-party-b' },
        answersByExternalId: {
          'test-question-1': { value: '1' },
          'test-question-2': { value: '2' },
          'test-question-3': { value: '1' },
          'test-question-4': { value: '2' },
          'test-question-5': { value: '1' },
          'test-question-6': { value: '2' },
          'test-question-7': { value: '1' },
          'test-question-8': { value: '2' }
        }
      },
      {
        external_id: 'test-candidate-epsilon',
        first_name: 'Test',
        last_name: 'Candidate Epsilon',
        email: 'test.epsilon@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 4,
        is_generated: false,
        organization: { external_id: 'test-party-a' },
        answersByExternalId: {
          'test-question-1': { value: '3' },
          'test-question-2': { value: '3' },
          'test-question-3': { value: '3' },
          'test-question-4': { value: '3' },
          'test-question-5': { value: '3' },
          'test-question-6': { value: '3' },
          'test-question-7': { value: '3' },
          'test-question-8': { value: '3' }
        }
      },
      // Voter-dataset registered candidates (§2.1 firstName/lastName verbatim)
      {
        external_id: 'test-voter-cand-agree',
        first_name: 'Fully',
        last_name: 'Agree',
        email: 'voter.cand.agree@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 5,
        is_generated: false,
        organization: { external_id: 'test-voter-party-a' },
        // All voter-q-1..8 at Likert-5 "Fully agree" — voter-matching.spec.ts:202-204
        // asserts this candidate is firstCard (highest match).
        answersByExternalId: {
          'test-voter-q-1': { value: '5' },
          'test-voter-q-2': { value: '5' },
          'test-voter-q-3': { value: '5' },
          'test-voter-q-4': { value: '5' },
          'test-voter-q-5': { value: '5' },
          'test-voter-q-6': { value: '5' },
          'test-voter-q-7': { value: '5' },
          'test-voter-q-8': { value: '5' }
        }
      },
      {
        external_id: 'test-voter-cand-close',
        first_name: 'Mostly',
        last_name: 'Close',
        email: 'voter.cand.close@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 6,
        is_generated: false,
        organization: { external_id: 'test-voter-party-a' },
        answersByExternalId: {
          'test-voter-q-1': { value: '4' },
          'test-voter-q-2': { value: '4' },
          'test-voter-q-3': { value: '4' },
          'test-voter-q-4': { value: '4' },
          'test-voter-q-5': { value: '4' },
          'test-voter-q-6': { value: '4' },
          'test-voter-q-7': { value: '4' },
          'test-voter-q-8': { value: '4' }
        }
      },
      {
        external_id: 'test-voter-cand-neutral',
        first_name: 'Neutral',
        last_name: 'Middle',
        email: 'voter.cand.neutral@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 7,
        is_generated: false,
        organization: { external_id: 'test-voter-party-a' },
        answersByExternalId: {
          'test-voter-q-1': { value: '3' },
          'test-voter-q-2': { value: '3' },
          'test-voter-q-3': { value: '3' },
          'test-voter-q-4': { value: '3' },
          'test-voter-q-5': { value: '3' },
          'test-voter-q-6': { value: '3' },
          'test-voter-q-7': { value: '3' },
          'test-voter-q-8': { value: '3' }
        }
      },
      {
        external_id: 'test-voter-cand-oppose',
        first_name: 'Fully',
        last_name: 'Oppose',
        email: 'voter.cand.oppose@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 8,
        is_generated: false,
        organization: { external_id: 'test-voter-party-b' },
        // All voter-q-1..8 at Likert-5 "Fully disagree" — voter-matching.spec.ts:212-214
        // asserts this candidate is lastCard (lowest match).
        answersByExternalId: {
          'test-voter-q-1': { value: '1' },
          'test-voter-q-2': { value: '1' },
          'test-voter-q-3': { value: '1' },
          'test-voter-q-4': { value: '1' },
          'test-voter-q-5': { value: '1' },
          'test-voter-q-6': { value: '1' },
          'test-voter-q-7': { value: '1' },
          'test-voter-q-8': { value: '1' }
        }
      },
      {
        external_id: 'test-voter-cand-mixed',
        first_name: 'Mixed',
        last_name: 'Views',
        email: 'voter.cand.mixed@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 9,
        is_generated: false,
        organization: { external_id: 'test-voter-party-b' },
        answersByExternalId: {
          'test-voter-q-1': { value: '5' },
          'test-voter-q-2': { value: '1' },
          'test-voter-q-3': { value: '4' },
          'test-voter-q-4': { value: '2' },
          'test-voter-q-5': { value: '3' },
          'test-voter-q-6': { value: '4' },
          'test-voter-q-7': { value: '2' },
          'test-voter-q-8': { value: '5' }
        }
      },
      {
        external_id: 'test-voter-cand-partial',
        first_name: 'Partial',
        last_name: 'Answers',
        email: 'voter.cand.partial@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 10,
        is_generated: false,
        organization: { external_id: 'test-voter-party-b' },
        // Only 4 of 8 answered — voter-matching.spec.ts:221-231 asserts
        // this candidate is neither first nor last, but visible.
        answersByExternalId: {
          'test-voter-q-1': { value: '4' },
          'test-voter-q-3': { value: '3' },
          'test-voter-q-5': { value: '4' },
          'test-voter-q-7': { value: '3' }
        }
      },
      // Hidden / unregistered candidates (terms_of_use_accepted ABSENT per §8.3)
      {
        external_id: 'test-voter-cand-hidden',
        first_name: 'Hidden',
        last_name: 'NoTerms',
        email: 'voter.cand.hidden@openvaa.org',
        // terms_of_use_accepted DELIBERATELY absent — voter-matching.spec.ts:121
        // finds this via `!c.termsOfUseAccepted` filter + asserts NOT visible
        // at :234-240.
        sort_order: 11,
        is_generated: false,
        organization: { external_id: 'test-voter-party-a' },
        answersByExternalId: {
          'test-voter-q-1': { value: '5' },
          'test-voter-q-2': { value: '5' },
          'test-voter-q-3': { value: '5' },
          'test-voter-q-4': { value: '5' },
          'test-voter-q-5': { value: '5' },
          'test-voter-q-6': { value: '5' },
          'test-voter-q-7': { value: '5' },
          'test-voter-q-8': { value: '5' }
        }
      },
      // Addendum unregistered candidates — §2.2 ordering: addendum[0] then [1].
      // No terms_of_use_accepted, no answersByExternalId. Phase 59's
      // registration/profile specs target these via sendEmail → inviteUserByEmail.
      {
        external_id: 'test-candidate-unregistered',
        first_name: 'Test Candidate',
        last_name: 'Unregistered',
        email: 'test.unregistered@openvaa.org',
        sort_order: 12,
        is_generated: false,
        organization: { external_id: 'test-party-a' }
      },
      {
        external_id: 'test-candidate-unregistered-2',
        first_name: 'Test Candidate',
        last_name: 'Unregistered Two',
        email: 'test.unregistered2@openvaa.org',
        sort_order: 13,
        is_generated: false,
        organization: { external_id: 'test-party-a' }
      }
    ]
  },

  // §3 — 18 nominations total, one per relational triangle.
  //
  // §3.1 default-dataset: 5 candidate + 2 organization = 7
  // §3.2 voter-dataset:   7 candidate + 2 organization = 9
  // §3.3 addendum:        2 candidate (both unconfirmed: true) = 2
  //
  // Candidate-type nominations carry ONLY the candidate ref per
  // NominationsGenerator.ts comment + RESEARCH §9 (the legacy fixture's
  // redundant `organization` ref on candidate-type rows is dropped).
  // Party-candidate linkage flows through candidates.organization_id.
  //
  // Organization-type nominations (test-nom-org-*) make the 4 parties
  // visible on the voter results "parties" tab.
  //
  // ALL triangles point at test-election-1 + test-constituency-alpha per §3.
  // test-election-2 + test-constituency-e2 are not wired to any base-template
  // nomination — overlay variants (Phase 59/60) will add their own triangles.
  nominations: {
    count: 0,
    fixed: [
      // §3.1 — default-dataset candidate triangles
      {
        external_id: 'test-nom-alpha',
        candidate: { external_id: 'test-candidate-alpha' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-nom-beta',
        candidate: { external_id: 'test-candidate-beta' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-nom-gamma',
        candidate: { external_id: 'test-candidate-gamma' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-nom-delta',
        candidate: { external_id: 'test-candidate-delta' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-nom-epsilon',
        candidate: { external_id: 'test-candidate-epsilon' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      // §3.1 — default-dataset organization triangles
      {
        external_id: 'test-nom-org-party-a',
        organization: { external_id: 'test-party-a' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-nom-org-party-b',
        organization: { external_id: 'test-party-b' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      // §3.2 — voter-dataset candidate triangles
      {
        external_id: 'test-voter-nom-agree',
        candidate: { external_id: 'test-voter-cand-agree' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-voter-nom-close',
        candidate: { external_id: 'test-voter-cand-close' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-voter-nom-neutral',
        candidate: { external_id: 'test-voter-cand-neutral' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-voter-nom-oppose',
        candidate: { external_id: 'test-voter-cand-oppose' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-voter-nom-mixed',
        candidate: { external_id: 'test-voter-cand-mixed' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-voter-nom-partial',
        candidate: { external_id: 'test-voter-cand-partial' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      // §8.3 — double-belt-and-braces invisibility for test-voter-cand-hidden:
      // candidate lacks terms_of_use_accepted (candidate-level hidden) AND
      // the nomination carries `unconfirmed: true` (nomination-level hidden).
      // voter-matching.spec.ts:234-240 asserts NOT visible via candidate-level
      // absence; the nomination-level flag is preserved for robustness.
      {
        external_id: 'test-voter-nom-hidden',
        candidate: { external_id: 'test-voter-cand-hidden' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1,
        unconfirmed: true
      },
      // §3.2 — voter-dataset organization triangles
      {
        external_id: 'test-voter-nom-org-party-a',
        organization: { external_id: 'test-voter-party-a' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-voter-nom-org-party-b',
        organization: { external_id: 'test-voter-party-b' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      // §3.3 — addendum candidate triangles (unconfirmed: true required)
      {
        external_id: 'test-nom-unregistered',
        candidate: { external_id: 'test-candidate-unregistered' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1,
        unconfirmed: true
      },
      {
        external_id: 'test-nom-unregistered-2',
        candidate: { external_id: 'test-candidate-unregistered-2' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1,
        unconfirmed: true
      }
    ]
  }
};
