import { expect, test } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

/**
 * # Storage cleanup, observed in committed state
 *
 * The database triggers that delete a replaced photo have been measured in pgTAP (`apps/supabase/supabase/tests/database/31-storage-cleanup.test.sql`), but pgTAP rolls back, so it can only prove what a trigger ASKS Storage to do. This spec proves that Storage then does it: an object the row no longer references stops being served, and the object the row now references keeps being served (162.1 D-14).
 *
 * Its absence is how the broken cleanup went unnoticed. From `11f877913` (2026-08-17) the delete POSTed to a DELETE-only route, pg_net logged a 404 nobody read, and every replaced or deleted photo stayed stored and public (spike 029 F4). This spec was observed red on that tree before the fix landed.
 *
 * ## Why it polls
 *
 * pg_net enqueues the request inside the writing transaction and its worker sends it only after COMMIT, some time later. So the disappearance is awaited with a bounded `expect.poll`, never a fixed sleep. A deleted object's public URL answers HTTP 400, not 404 (measured on the local Storage).
 *
 * ## Isolation
 *
 * Everything here happens in {@link SCRATCH_PROJECT_ID}, a project nothing else uses, and every row carries {@link STORAGE_CLEANUP_EXTERNAL_ID_PREFIX}. Leftovers from an interrupted run are removed before the test and again after it.
 *
 * Rigidity contract: HARD assertions only (no expect.soft / try-catch / .catch around an expectation).
 */

/**
 * The project this spec creates rows and objects in. This spec is its only user: it is neither the default project nor the E2E project, so nothing this spec creates or removes can reach a row another spec depends on.
 */
const SCRATCH_PROJECT_ID = '00000000-0000-0000-0000-0000000005c1';

/**
 * The `external_id` prefix of every row this spec creates. Deliberately not named `PREFIX`: the config's teardown-prefix guard scans that name, and this spec owns no teardown project.
 */
const STORAGE_CLEANUP_EXTERNAL_ID_PREFIX = 'e2e-storage-cleanup-';

/** Same fallback the tests' admin client uses. */
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';

/** Storage does not inspect the content; four bytes shaped like an empty JPEG are enough to be an object. */
const OBJECT_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

/** How long the pg_net worker gets to send a committed DELETE before the test calls the object undeleted. */
const DELETE_POLL = { timeout: 30_000, intervals: [500, 1000, 2000] };

/**
 * The HTTP status of an anonymous GET of a `public-assets` object.
 * @param path - The object path inside the bucket.
 */
async function publicStatus(path: string): Promise<number> {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/public/public-assets/${path}`);
  return response.status;
}

/**
 * Every object this run uploaded. A test that deletes its candidate leaves no row whose folder a later cleanup could list, so a red run's objects are removed from this list instead.
 */
const uploadedPaths: Array<string> = [];

/**
 * Upload one object into a candidate's folder under a random UUID name, the upload convention the cleanup whitelist accepts, and remember it for {@link removeLeftovers}.
 * @param client - An admin client bound to the scratch project.
 * @param candidateId - The candidate whose folder receives the object.
 * @param externalId - The candidate's external id, used only in an upload error message.
 */
async function uploadObject(client: SupabaseAdminClient, candidateId: string, externalId: string): Promise<string> {
  const path = await client.uploadPortrait(candidateId, externalId, `${crypto.randomUUID()}.jpg`, OBJECT_BYTES);
  uploadedPaths.push(path);
  return path;
}

/**
 * Remove every candidate this spec created in the scratch project, objects first, because once the rows are gone nothing lists their folders.
 * @param client - An admin client bound to the scratch project.
 */
async function removeLeftovers(client: SupabaseAdminClient): Promise<void> {
  const ids = await client.listCandidateIdsByPrefix(STORAGE_CLEANUP_EXTERNAL_ID_PREFIX);
  await client.removePortraitStorageObjects([...(await client.listCandidatePortraitPaths(ids)), ...uploadedPaths]);
  await client.bulkDelete({ candidates: { prefix: STORAGE_CLEANUP_EXTERNAL_ID_PREFIX } });
  await client.bulkDelete({ questions: { prefix: STORAGE_CLEANUP_EXTERNAL_ID_PREFIX } });
  await client.bulkDelete({ question_categories: { prefix: STORAGE_CLEANUP_EXTERNAL_ID_PREFIX } });
}

/**
 * Import one candidate into the scratch project and return its id.
 * @param client - An admin client bound to the scratch project.
 * @param externalId - The candidate's external id, under {@link STORAGE_CLEANUP_EXTERNAL_ID_PREFIX}.
 */
async function importCandidate(client: SupabaseAdminClient, externalId: string): Promise<string> {
  await client.bulkImport({
    candidates: [
      { external_id: externalId, project_id: SCRATCH_PROJECT_ID, first_name: 'Storage', last_name: 'Cleanup' }
    ]
  });
  const ids = await client.listCandidateIdsByPrefix(externalId);
  expect(ids, 'exactly one candidate was imported under the spec prefix').toHaveLength(1);
  return ids[0];
}

test.describe('storage cleanup (committed state)', () => {
  let client: SupabaseAdminClient;

  test.beforeAll(async () => {
    client = new SupabaseAdminClient(undefined, undefined, SCRATCH_PROJECT_ID);
    await client.ensureProject();
    await removeLeftovers(client);
  });

  test.afterAll(async () => {
    await removeLeftovers(client);
  });

  test('replacing a candidate image deletes the old object and keeps the new one', async () => {
    const externalId = `${STORAGE_CLEANUP_EXTERNAL_ID_PREFIX}image-replace`;
    await client.bulkImport({
      candidates: [
        { external_id: externalId, project_id: SCRATCH_PROJECT_ID, first_name: 'Storage', last_name: 'Cleanup' }
      ]
    });
    const ids = await client.listCandidateIdsByPrefix(externalId);
    expect(ids, 'exactly one candidate was imported under the spec prefix').toHaveLength(1);
    const [id] = ids;

    const oldPath = await client.uploadPortrait(id, externalId, `${crypto.randomUUID()}.jpg`, OBJECT_BYTES);
    const newPath = await client.uploadPortrait(id, externalId, `${crypto.randomUUID()}.jpg`, OBJECT_BYTES);
    expect(await publicStatus(oldPath), 'the old object is served before the replace').toBe(200);

    await client.update('candidates', id, { image: { path: oldPath, alt: 'Storage Cleanup' } });
    await client.update('candidates', id, { image: { path: newPath, alt: 'Storage Cleanup' } });

    await expect
      .poll(() => publicStatus(oldPath), {
        ...DELETE_POLL,
        message: 'the replaced object must stop being served once the image no longer references it'
      })
      .toBe(400);
    expect(await publicStatus(newPath), 'the object the image now references is still served').toBe(200);
    expect(await client.listCandidatePortraitPaths([id]), 'the candidate folder holds only the new object').toEqual([
      newPath
    ]);
  });

  test('deleting a candidate deletes every object in its folder', async () => {
    const externalId = `${STORAGE_CLEANUP_EXTERNAL_ID_PREFIX}entity-delete`;
    const id = await importCandidate(client, externalId);

    const paths = [await uploadObject(client, id, externalId), await uploadObject(client, id, externalId)];
    for (const path of paths) expect(await publicStatus(path), 'the object is served before the delete').toBe(200);

    await client.bulkDelete({ candidates: { external_ids: [externalId] } });

    for (const path of paths) {
      await expect
        .poll(() => publicStatus(path), {
          ...DELETE_POLL,
          message: `the object ${path} must stop being served once its candidate is deleted`
        })
        .toBe(400);
    }
  });

  test('replacing an answer image deletes the old object and keeps the new one', async () => {
    const externalId = `${STORAGE_CLEANUP_EXTERNAL_ID_PREFIX}answer-replace`;
    const questionExternalId = `${STORAGE_CLEANUP_EXTERNAL_ID_PREFIX}image-question`;
    const categoryExternalId = `${STORAGE_CLEANUP_EXTERNAL_ID_PREFIX}image-category`;
    await client.bulkImport({
      question_categories: [
        {
          external_id: categoryExternalId,
          project_id: SCRATCH_PROJECT_ID,
          name: { en: 'Storage cleanup' },
          category_type: 'info'
        }
      ],
      questions: [
        {
          external_id: questionExternalId,
          project_id: SCRATCH_PROJECT_ID,
          type: 'image',
          name: { en: 'Photo' },
          category: { external_id: categoryExternalId }
        }
      ]
    });
    const questions = await client.findData('questions', { external_id: { $eq: questionExternalId } });
    expect(questions.type, 'the image question can be read back').toBe('success');
    expect(questions.data, 'exactly one image question was imported under the spec prefix').toHaveLength(1);
    const questionId = String(questions.data?.[0].id);
    const id = await importCandidate(client, externalId);

    const oldPath = await uploadObject(client, id, externalId);
    const newPath = await uploadObject(client, id, externalId);
    expect(await publicStatus(oldPath), 'the old object is served before the replace').toBe(200);

    await client.update('candidates', id, { answers: { [questionId]: { value: { path: oldPath } } } });
    await client.update('candidates', id, { answers: { [questionId]: { value: { path: newPath } } } });

    await expect
      .poll(() => publicStatus(oldPath), {
        ...DELETE_POLL,
        message: 'the replaced answer image must stop being served once the answer no longer references it'
      })
      .toBe(400);
    expect(await publicStatus(newPath), 'the object the answer now references is still served').toBe(200);
  });
});
