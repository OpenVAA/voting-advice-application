/**
 * Typed constants derived from the Phase 58 `e2e` template
 * (@openvaa/dev-seed templates/e2e.ts).
 *
 * Replaces direct JSON-fixture imports (the three legacy fixture files in
 * `tests/tests/data/`) per Phase 59 E2E-01/02. Property names match
 * TablesInsert<'...'> (snake_case) — consumers that
 * previously read camelCase (e.g. `.externalId`, `.firstName`) must migrate
 * to snake_case (`.external_id`, `.first_name`).
 *
 * Single source of truth: `packages/dev-seed/src/templates/e2e.ts`.
 * Adding a new E2E constant here means updating the e2e template in
 * lockstep — see 58-E2E-AUDIT.md for the spec-id contract.
 *
 * @see .planning/phases/59-e2e-fixture-migration/59-PATTERNS.md
 * @see .planning/phases/58-templates-cli-default-dataset/58-E2E-AUDIT.md
 */

import { BUILT_IN_TEMPLATES } from '@openvaa/dev-seed';

/**
 * Shape of a candidate row as authored in the `e2e` template's
 * `candidates.fixed[]` array. Intentionally a superset of
 * `TablesInsert<'candidates'>` because the template carries two handoff
 * fields not present on the candidates table:
 *   - `email` (used by Phase 59 forceRegister / inviteUserByEmail)
 *   - `answersByExternalId` (consumed by `importAnswers` post-insert)
 *   - `organization` (sentinel resolved post-topo to `organization_id`)
 */
export type TemplateCandidate = {
  external_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  terms_of_use_accepted?: string | null;
  sort_order?: number;
  is_generated?: boolean;
  organization?: { external_id: string };
  answersByExternalId?: Record<
    string,
    { value: string | number | { en: string }; info?: { en: string } }
  >;
};

/**
 * Shape of a question row as authored in the `e2e` template's
 * `questions.fixed[]` array. `type` is the discriminator used by spec-side
 * filters (e.g., `q.type === 'singleChoiceOrdinal'`).
 */
export type TemplateQuestion = {
  external_id: string;
  type: string;
  [key: string]: unknown;
};

/**
 * Shape of an organization (party) row as authored in the `e2e` template's
 * `organizations.fixed[]` array.
 */
export type TemplateOrganization = {
  external_id: string;
  [key: string]: unknown;
};

const template = BUILT_IN_TEMPLATES.e2e;

if (!template) {
  throw new Error(
    'e2eFixtureRefs: BUILT_IN_TEMPLATES.e2e is undefined. ' +
      'Phase 58 should have registered it — see packages/dev-seed/src/templates/index.ts.'
  );
}

/**
 * ALL candidates in the e2e template, in declared order.
 * Order is load-bearing: position [0] is `test-candidate-alpha` per
 * 58-E2E-AUDIT.md §2.2 ordering invariant.
 */
export const E2E_CANDIDATES: ReadonlyArray<TemplateCandidate> = Object.freeze(
  (template.candidates?.fixed ?? []) as ReadonlyArray<TemplateCandidate>
);

/**
 * Addendum candidates — the two "unregistered" candidates whose
 * registration is exercised by candidate-registration.spec.ts and
 * candidate-profile.spec.ts. Filtered by external_id prefix per
 * 58-E2E-AUDIT.md §3.3.
 *
 * Order invariant: [0] is `test-candidate-unregistered`, [1] is
 * `test-candidate-unregistered-2` (both specs index by position).
 */
export const E2E_ADDENDUM_CANDIDATES: ReadonlyArray<TemplateCandidate> = Object.freeze(
  E2E_CANDIDATES.filter((c) => c.external_id.startsWith('test-candidate-unregistered'))
);

/**
 * Voter-dataset candidates — the agree/close/neutral/oppose/mixed/partial/hidden
 * cohort. Filtered by external_id prefix per 58-E2E-AUDIT.md §3.2.
 */
export const E2E_VOTER_CANDIDATES: ReadonlyArray<TemplateCandidate> = Object.freeze(
  E2E_CANDIDATES.filter((c) => c.external_id.startsWith('test-voter-cand'))
);

/**
 * Default-dataset registered candidates — alpha/beta/gamma/delta/epsilon.
 * Filtered by external_id prefix per 58-E2E-AUDIT.md §3.1 (excludes the
 * `test-candidate-unregistered*` addendum rows).
 */
export const E2E_DEFAULT_CANDIDATES: ReadonlyArray<TemplateCandidate> = Object.freeze(
  E2E_CANDIDATES.filter(
    (c) =>
      c.external_id.startsWith('test-candidate-') &&
      !c.external_id.startsWith('test-candidate-unregistered')
  )
);

/**
 * ALL questions in the e2e template.
 */
export const E2E_QUESTIONS: ReadonlyArray<TemplateQuestion> = Object.freeze(
  (template.questions?.fixed ?? []) as ReadonlyArray<TemplateQuestion>
);

/**
 * ALL organizations (parties) in the e2e template.
 */
export const E2E_ORGANIZATIONS: ReadonlyArray<TemplateOrganization> = Object.freeze(
  (template.organizations?.fixed ?? []) as ReadonlyArray<TemplateOrganization>
);

/**
 * Alpha candidate email — `mock.candidate.2@openvaa.org` — the
 * forceRegister target enforced by auth-setup.ts.
 * Sourced from E2E_CANDIDATES[0] (ordering-invariant-protected position).
 *
 * Throws at module load if the ordering invariant or email presence is
 * violated — drift surfaces loudly, not silently.
 */
export const TEST_CANDIDATE_ALPHA_EMAIL: string = (() => {
  const alpha = E2E_CANDIDATES[0];
  if (!alpha || alpha.external_id !== 'test-candidate-alpha') {
    throw new Error(
      `e2eFixtureRefs: E2E_CANDIDATES[0] is ${alpha?.external_id ?? 'undefined'}, expected 'test-candidate-alpha'. ` +
        "58-E2E-AUDIT.md §2.2 ordering invariant violated — Phase 58's e2e template has drifted."
    );
  }
  if (!alpha.email) {
    throw new Error('e2eFixtureRefs: E2E_CANDIDATES[0].email is missing. See 58-E2E-AUDIT.md §6.');
  }
  return alpha.email;
})();

/**
 * The two unregistered-candidate emails the setup/teardown flows unregister.
 */
export const TEST_UNREGISTERED_EMAILS: ReadonlyArray<string> = Object.freeze(
  E2E_ADDENDUM_CANDIDATES.map((c) => c.email).filter(
    (e): e is string => typeof e === 'string' && e.length > 0
  )
);
