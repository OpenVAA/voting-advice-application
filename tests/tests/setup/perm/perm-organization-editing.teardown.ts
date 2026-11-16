/**
 * perm-organization-editing data-teardown project.
 *
 * Removes what `data-setup-perm-organization-editing` left: the three auth users it registered, with their grants; every row under `e2e-perm-organization-editing-`, with an assertion that the delete accounted for all of them and left none; and the three storage-state files.
 *
 * `runTeardown` deletes the seeded rows and not the auth users, so each user is unregistered here by its address; a user left behind would hold a real editor grant under a known password.
 *
 * Stored images: deleting an entity row fires the database's `cleanup_entity_storage_files` trigger, which deletes every object in that entity's own storage folder through the Storage API after the delete commits. A logo a test uploads for one of the two organizations is removed that way, asynchronously, and nothing here waits for it or asserts it. `runTeardown` itself removes the stored portraits of the prefix's candidates and of no other entity type.
 */

import { expect, test as teardown } from '@playwright/test';
import fs from 'fs';
import {
  CONFIRMED_ORGANIZATION_EDITOR_EMAIL,
  CONFIRMED_ORGANIZATION_STORAGE_STATE,
  ORGANIZATION_EDITING_PREFIX,
  UNCONFIRMED_CANDIDATE_EDITOR_EMAIL,
  UNCONFIRMED_CANDIDATE_STORAGE_STATE,
  UNCONFIRMED_ORGANIZATION_EDITOR_EMAIL,
  UNCONFIRMED_ORGANIZATION_STORAGE_STATE
} from '../../utils/permOrganizationEditingData';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

// A plain string literal: the Playwright configuration reads it from this file's text to check that no two teardowns own overlapping prefixes.
const PREFIX = 'e2e-perm-organization-editing-';

teardown('delete perm-organization-editing dataset', async () => {
  expect(PREFIX, 'the prefix deleted here is the one the dataset is seeded under').toBe(ORGANIZATION_EDITING_PREFIX);

  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(CONFIRMED_ORGANIZATION_EDITOR_EMAIL);
  await client.unregisterCandidate(UNCONFIRMED_ORGANIZATION_EDITOR_EMAIL);
  // The candidate's editor.
  await client.unregisterCandidate(UNCONFIRMED_CANDIDATE_EDITOR_EMAIL);

  await runTeardownAsserted(PREFIX, client);

  for (const storageStatePath of [
    CONFIRMED_ORGANIZATION_STORAGE_STATE,
    UNCONFIRMED_ORGANIZATION_STORAGE_STATE,
    UNCONFIRMED_CANDIDATE_STORAGE_STATE
  ]) {
    if (fs.existsSync(storageStatePath)) fs.unlinkSync(storageStatePath);
  }
});
