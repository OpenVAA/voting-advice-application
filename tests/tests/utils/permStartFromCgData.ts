import path from 'path';
import { TEST_CANDIDATE_PASSWORD } from './testCredentials';
import { TESTS_DIR } from './testsDir';
import type { ElectionTypeName } from './permContestantNominationsData';
import type { EntityGrantTarget } from './supabaseAdminClient';

/**
 * The start-from-constituency dataset as the suite's contestant tests name it: the rows of the `perm-startfromcg` template they address, and the one user that edits a candidate of it.
 *
 * The dataset is seeded by `data-setup-perm-startfromcg` and removed by `data-teardown-perm-startfromcg`. It holds two elections: one held over two regions, and one held over five municipalities, four of which lie in a region and one of which lies in none. The municipalities are the constituency group a test names in `elections.startFromConstituencyGroup`; the template itself leaves that setting out. Every candidate is seeded with one nomination. The editor has accepted the terms of use and edits one candidate alone, so signing in lands on that candidate's home.
 *
 * The values are literals that repeat `packages/dev-seed/src/templates/e2e/perm/perm-startfromcg.ts`, so that a change to the template cannot make this module throw at import. A drifted external id fails the setup's registration by name, and a drifted name fails the test that reads it.
 *
 * SECURITY: the email is a local, E2E-only address on the `test.openvaa.local` domain, registered against a local Supabase instance alone.
 */

/** The `external_id` prefix of every row of the dataset, and the prefix its teardown deletes. */
export const START_FROM_CG_PREFIX = 'e2e-perm-startfromcg-';

/** The password of the candidate's editor: the suite's shared test password. */
export const START_FROM_CG_PASSWORD = TEST_CANDIDATE_PASSWORD;

// ---------------------------------------------------------------------------
// The constituency group that is chosen first, and three of the constituencies.
// ---------------------------------------------------------------------------

/** `external_id` of the group of the five municipalities: the group a test names in `elections.startFromConstituencyGroup`. */
export const FIRST_GROUP_EXTERNAL_ID = `${START_FROM_CG_PREFIX}cg-2`;

/** The name the group of the municipalities is seeded with. */
export const FIRST_GROUP_NAME = '[CG2] Leaf municipalities';

/** `external_id` of a municipality that lies in a region, so both elections are held in it. */
export const CHILD_CONSTITUENCY_EXTERNAL_ID = `${START_FROM_CG_PREFIX}co-1a1`;

/** The name the municipality that lies in a region is seeded with. */
export const CHILD_CONSTITUENCY_NAME = '[CO1A1] Municipality A1';

/** `external_id` of the region that municipality lies in: the constituency the regions' election takes for it. */
export const PARENT_CONSTITUENCY_EXTERNAL_ID = `${START_FROM_CG_PREFIX}co-1a`;

/** The name the region is seeded with. */
export const PARENT_CONSTITUENCY_NAME = '[CO1A] Region A';

/** `external_id` of the municipality that lies in no region, so the municipalities' election alone is held in it. */
export const ORPHAN_CONSTITUENCY_EXTERNAL_ID = `${START_FROM_CG_PREFIX}co-1c`;

/** The name the municipality that lies in no region is seeded with. */
export const ORPHAN_CONSTITUENCY_NAME = '[CO1C] Orphan municipality';

// ---------------------------------------------------------------------------
// The two elections.
// ---------------------------------------------------------------------------

/** `external_id` of the election held over the two regions. It is the first election of the dataset. */
export const REGIONS_ELECTION_EXTERNAL_ID = `${START_FROM_CG_PREFIX}el-1`;

/** The name the regions' election is seeded with. */
export const REGIONS_ELECTION_NAME = '[EL1] CG-1 parents';

/** `external_id` of the election held over the five municipalities. It is the second election of the dataset, and the only one held in the municipality that lies in no region. */
export const MUNICIPALITIES_ELECTION_EXTERNAL_ID = `${START_FROM_CG_PREFIX}el-2`;

/** The name the municipalities' election is seeded with. */
export const MUNICIPALITIES_ELECTION_NAME = '[EL2] CG-2 leaves';

/** The type each election is seeded with, by the election's `external_id`: what a test that changes a type puts back. */
export const SEEDED_ELECTION_TYPES: Readonly<Record<string, ElectionTypeName>> = Object.freeze({
  [REGIONS_ELECTION_EXTERNAL_ID]: 'organization_list_and_independents',
  [MUNICIPALITIES_ELECTION_EXTERNAL_ID]: 'organization_list_and_independents'
});

// ---------------------------------------------------------------------------
// The candidate the contestant tests sign in as the editor of.
// ---------------------------------------------------------------------------

/** `external_id` of the candidate whose editor the contestant tests sign in as. It is seeded with one nomination, in the regions' election. */
export const CANDIDATE_EXTERNAL_ID = `${START_FROM_CG_PREFIX}ca-1-1b`;

/** The entity the candidate's editor is registered on. */
export const CANDIDATE_GRANT: EntityGrantTarget = Object.freeze({
  entityType: 'candidate',
  externalId: CANDIDATE_EXTERNAL_ID
});

/** Email of the candidate's editor. */
export const CANDIDATE_EDITOR_EMAIL = `${CANDIDATE_EXTERNAL_ID}@test.openvaa.local`;

/** Where the session of the candidate's editor is stored. Written by the dataset's setup and removed by its teardown. */
export const CANDIDATE_STORAGE_STATE = path.join(TESTS_DIR, '../playwright/.auth/perm-startfromcg-candidate.json');
