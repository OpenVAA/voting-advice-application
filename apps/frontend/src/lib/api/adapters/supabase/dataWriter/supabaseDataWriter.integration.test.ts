// @vitest-environment node
/**
 * The real `SupabaseDataWriter` against a live local Supabase, through a signed-in user's own session.
 *
 * What it proves:
 *
 * 1. **An organization's answers are saved by the application's own writer.** The organization's editor lists it, reads it and saves one answer; the row read back with a service-role client holds that answer.
 * 2. **A caller cannot write an entity it holds no editor grant on.** For a candidate's editor targeting an organization, a candidate's editor targeting another candidate, and an organization's editor targeting a candidate: an answer save and an image update with its upload are each refused, and the target's row and folder are what they were. The target is forged at the call site on purpose. The application's store never builds such a target, so these cases show that the database refuses the write, not the store.
 *
 * 3. **An entity's editor writes its names and colour, and the database freezes the names of a confirmed entity.** An unconfirmed organization's name, short name and colour, and an unconfirmed candidate's first and last name, are saved by the writer and read back with a service-role client. For a confirmed organization a changed name or short name comes back as the writer's name-refused result and the stored row is what it was, while its colour alone is saved. One case reads the refusal itself, through the editor's own client: the error code and the start of the message the writer recognises it by.
 *
 * 4. **A code sign-in puts its session on the caller's response.** Over a server-shaped client whose cookie callbacks record every write, the writer answers `used` for a claimed code, refuses a wrong password without writing a cookie, and with the right password has written the session cookies by the time the call resolves; a claim under that session then finds nothing to claim.
 *
 * 5. **An entity's editor reads its own nominations, and no one else's.** A candidate nominated under an organization's nomination reads one nomination with the organization's type, id and names, the election's and the constituency's names and its own state; the organization's editor reads the organization's one nomination, which has no parent; an entity with no nomination reads an empty list beside its entity; and another user's entity resolves to no user data, the database's function answering it with a null and no error.
 *
 * 6. **An entity's editor writes its nominations as one set, and reads the entities a nomination may be placed under.** A candidate's first save with a typed party name, a save that links a listed party with no nomination at the contest, and a repeat of the stored set come back as the writer's saved result with the function's counts. A removal of a nomination with a candidate listed under it, and a save that would create one unconfirmed parent nomination too many, come back as the writer's two named refusals, and each refusal is also read through the editor's own client: its code and what the writer recognises it by. Under the nominations lock, and for a candidate with neither a party nor a typed name in an election that requires one, the save rejects. Nothing of a refused or rejected save is stored. The parent options hold a confirmed organization with the contest it is nominated at and no unconfirmed one, an alliance for an organization, and resolve to no value for an entity the caller does not edit. One row is inserted past the writer, by the editor's own client: a candidate's nomination with no party in an election that requires one, which the database refuses when the request's transaction ends.
 *
 * 7. **A signed-in editor's user-level data says whether the account has a password, and what state its address is in.** An editor the file created with a password reads `passwordSet` as `true`, beside its address and the contestant role, through the read the database makes for the caller alone. The same editor, whom no identity provider made, reads its address as proved, nothing pending and no pending address taken.
 *
 * Every refusal asserts the rejection and the unchanged state separately, so a write that silently did nothing and a write that was refused cannot be mistaken for each other.
 *
 * Gating: `describe.skipIf(!process.env.SUPABASE_URL)`. The file skips where no local Supabase is declared, which includes the default unit run and every CI job. No CI job runs it. A run that is meant to execute it sets `CONTESTANT_WRITER_INTEGRATION_REQUIRED=1`, which makes the file throw at import when `SUPABASE_URL` is unset, so it cannot skip silently.
 *
 * To run it, with the local stack up: `SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… CONTESTANT_WRITER_INTEGRATION_REQUIRED=1 yarn workspace @openvaa/frontend vitest run supabaseDataWriter.integration`.
 *
 * It works in the default project of `seed.sql`, under identifiers unique to the run, and leaves nothing behind: the teardown removes the grants, the users, any stored object, the two nominations with their election, constituency and constituency group, the four entity rows and the one question with its category whether or not an assertion failed, and fails the run if any of them is still there. The nominations group and the invitation group remove their own rows in the same way, and the nominations group leaves the default project's settings as it found them: the one case that turns the nominations lock on turns it back in a `finally`.
 *
 * The Node environment is chosen because the image upload hands a `File` to the platform's own `fetch`.
 *
 * Timeout: a hang guard only. Nothing in this file asserts on time.
 */

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SupabaseDataWriter } from './supabaseDataWriter';
import type { Database, Json } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DesiredNomination, LocalizedAnswers } from '$lib/api/base/dataWriter.type';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const hasSupabase = Boolean(process.env.SUPABASE_URL);

if (process.env.CONTESTANT_WRITER_INTEGRATION_REQUIRED === '1' && !hasSupabase) {
  throw new Error(
    'CONTESTANT_WRITER_INTEGRATION_REQUIRED=1 but SUPABASE_URL is unset. This file is required to EXECUTE in this run; ' +
      'skipping it would silently drop the adapter-level proof of an organization save and of the refused writes. ' +
      'Start Supabase and export SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY, or unset the variable.'
  );
}

/** The project `seed.sql` creates. */
const DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
const BUCKET = 'public-assets';
const HANG_GUARD_MS = 120_000;

/** Unique to this run, so two runs never meet and the teardown can find exactly its own rows. */
const RUN_ID = crypto.randomUUID();
const PASSWORD = `Pw-${RUN_ID}`;

type EntityTable = 'candidates' | 'organizations';
type Target = { type: 'candidate' | 'organization'; table: EntityTable; id: string };

/** How the refusal of a changed name on a confirmed row begins, as `enforce_entity_immutability` raises it. */
const NAME_REFUSAL_PREFIX = 'Entity name is immutable once confirmed: column ';
/** The names the confirmed organization is created with, which no editor's write may change. */
const CONFIRMED_NAME = { en: `Writer integration confirmed ${RUN_ID}`, fi: `Vahvistettu ${RUN_ID}` };
const CONFIRMED_SHORT_NAME = { en: 'WIC' };

/** The names the fixture's election and constituency are created with. The constituency has no Finnish name, so a read in Finnish falls back to the default locale for it. */
const ELECTION_NAME = { en: `Writer integration election ${RUN_ID}`, fi: `Vaalit ${RUN_ID}` };
const CONSTITUENCY_NAME = { en: `Writer integration constituency ${RUN_ID}` };
/** The custom data the organization's nomination is created with. */
const NOMINATION_CUSTOM_DATA = { writerIntegration: RUN_ID };

/** How the refusal of one unconfirmed parent nomination too many begins, as `enforce_nomination_confirmation` raises it. */
const PENDING_CAP_REFUSAL_PREFIX = 'A caller may originate at most ';
/** The foreign key the database names when it refuses to remove a nomination that others are listed under. */
const PARENT_NOMINATION_FOREIGN_KEY = 'nominations_parent_nomination_id_fkey';
/** How the refusal of a candidate's nomination with neither a party nor a typed name begins, as `validate_nomination_parent_required` raises it. */
const PARENT_REQUIRED_REFUSAL_PREFIX = 'Nomination parent required: ';
/** The most unconfirmed parent nominations one caller may have originated. */
const PENDING_CAP = 10;

/** The settings of a project as its row stores them. */
type StoredSettings = Database['public']['Tables']['app_settings']['Row']['settings'];

/** A signed-in user holding one editor grant: its id, its own client and a writer over that client. */
type Editor = { userId: string; writer: SupabaseDataWriter; client: SupabaseClient<Database> };

/**
 * Create a confirmed user holding one editor grant, sign it in on a client of its own, and build a writer over that client.
 * @param service - A service-role client.
 * @param userIds - The list the new user's id is added to as soon as the user exists, so a teardown removes it whatever fails afterwards.
 * @param label - Distinguishes the user's address within the run.
 * @param target - The entity the user edits.
 * @returns The user's id, the writer, whose session token carries the grant, and the client it writes through.
 */
async function createEditor(
  service: SupabaseClient<Database>,
  userIds: Array<string>,
  label: string,
  target: Target
): Promise<Editor> {
  const email = `writer-integration-${label}-${RUN_ID}@example.test`;
  const { data, error } = await service.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error) throw new Error(`createUser failed: ${error.message}`);
  userIds.push(data.user.id);

  const { error: grantError } = await service.from('grants').insert({
    user_id: data.user.id,
    scope: 'entity',
    target_type: target.type,
    target_id: target.id,
    role: 'editor'
  });
  if (grantError) throw new Error(`insert grant failed: ${grantError.message}`);

  // Signed in after the grant was written, so the token the session carries holds it.
  const client = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInError) throw new Error(`signInWithPassword failed: ${signInError.message}`);

  return {
    userId: data.user.id,
    writer: new SupabaseDataWriter({ fetch, client, projectId: DEFAULT_PROJECT_ID }),
    client
  };
}

/** A one-pixel PNG. */
const PNG_BYTES = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='),
  (char) => char.charCodeAt(0)
);

describe.skipIf(!hasSupabase)('SupabaseDataWriter against the local database', () => {
  let service: SupabaseClient<Database>;
  let organization: Target;
  let confirmedOrganization: Target;
  let candidateA: Target;
  let candidateB: Target;
  let organizationEditor: SupabaseDataWriter;
  let confirmedOrganizationEditor: SupabaseDataWriter;
  /** The confirmed organization's editor's own client, for the one case that reads the database's refusal past the writer. */
  let confirmedOrganizationClient: SupabaseClient<Database>;
  let candidateEditor: SupabaseDataWriter;
  /** Candidate A's editor's own client, for the one case that reads the nominations function's refusal past the writer. */
  let candidateClient: SupabaseClient<Database>;
  // The nominations fixture: the confirmed organization nominated in an election and a constituency of the run's own, and candidate A nominated under that nomination.
  let electionId: string | undefined;
  let constituencyId: string | undefined;
  let constituencyGroupId: string | undefined;
  let organizationNominationId: string | undefined;
  let candidateNominationId: string | undefined;
  // The stored answers are validated against the project's questions, so the save needs a question of its own.
  let categoryId: string | undefined;
  let questionId: string;
  const userIds = new Array<string>();

  /**
   * Create an editor of one of this group's entities, whose user the group's teardown removes.
   * @param label - Distinguishes the user's address within the run.
   * @param target - The entity the user edits.
   * @returns The editor.
   */
  function editorOf(label: string, target: Target): Promise<Editor> {
    return createEditor(service, userIds, label, target);
  }

  /**
   * The stored answers and image of an entity, read past row-level security.
   * @param target - The entity to read.
   * @returns The two columns as stored.
   */
  async function storedColumns(target: Target): Promise<{ answers: Json; image: Json }> {
    const { data, error } = await service.from(target.table).select('answers, image').eq('id', target.id).single();
    if (error) throw new Error(`read of ${target.table} failed: ${error.message}`);
    return data;
  }

  /**
   * The stored names and colour of an organization, read past row-level security.
   * @param target - The organization to read.
   * @returns The three columns as stored.
   */
  async function storedOrganizationProperties(target: Target): Promise<{ name: Json; short_name: Json; color: Json }> {
    const { data, error } = await service
      .from('organizations')
      .select('name, short_name, color')
      .eq('id', target.id)
      .single();
    if (error) throw new Error(`read of organizations failed: ${error.message}`);
    return data;
  }

  /**
   * The stored names of a candidate, read past row-level security.
   * @param target - The candidate to read.
   * @returns The two columns as stored.
   */
  async function storedCandidateNames(target: Target): Promise<{ first_name: string; last_name: string }> {
    const { data, error } = await service
      .from('candidates')
      .select('first_name, last_name')
      .eq('id', target.id)
      .single();
    if (error) throw new Error(`read of candidates failed: ${error.message}`);
    return data;
  }

  /**
   * The names of the objects stored under an entity's folder, read past the storage policies.
   * @param target - The entity whose folder to list.
   * @returns The object names.
   */
  async function storedObjects(target: Target): Promise<Array<string>> {
    const { data, error } = await service.storage
      .from(BUCKET)
      .list(`${DEFAULT_PROJECT_ID}/${target.table}/${target.id}`);
    if (error) throw new Error(`listing the folder failed: ${error.message}`);
    return data.map((object) => object.name);
  }

  beforeAll(async () => {
    service = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: organizationRow, error: organizationError } = await service
      .from('organizations')
      .insert({ project_id: DEFAULT_PROJECT_ID, name: { en: `Writer integration ${RUN_ID}` } })
      .select('id')
      .single();
    if (organizationError) throw new Error(`insert organization failed: ${organizationError.message}`);
    organization = { type: 'organization', table: 'organizations', id: organizationRow.id };

    // Confirmed by the service role, which the freeze of a confirmed entity's names does not bind.
    const { data: confirmedRow, error: confirmedError } = await service
      .from('organizations')
      .insert({
        project_id: DEFAULT_PROJECT_ID,
        name: CONFIRMED_NAME,
        short_name: CONFIRMED_SHORT_NAME,
        confirmed: true
      })
      .select('id')
      .single();
    if (confirmedError) throw new Error(`insert confirmed organization failed: ${confirmedError.message}`);
    confirmedOrganization = { type: 'organization', table: 'organizations', id: confirmedRow.id };

    const { data: candidateRows, error: candidateError } = await service
      .from('candidates')
      .insert([
        { project_id: DEFAULT_PROJECT_ID, first_name: 'A', last_name: `Writer integration ${RUN_ID}` },
        { project_id: DEFAULT_PROJECT_ID, first_name: 'B', last_name: `Writer integration ${RUN_ID}` }
      ])
      .select('id, first_name');
    if (candidateError) throw new Error(`insert candidates failed: ${candidateError.message}`);
    const [rowA, rowB] = ['A', 'B'].map((firstName) => candidateRows.find((row) => row.first_name === firstName));
    if (!rowA || !rowB) throw new Error('the two candidates were not inserted');
    candidateA = { type: 'candidate', table: 'candidates', id: rowA.id };
    candidateB = { type: 'candidate', table: 'candidates', id: rowB.id };

    const { data: category, error: categoryError } = await service
      .from('question_categories')
      .insert({ project_id: DEFAULT_PROJECT_ID, name: { en: `Writer integration ${RUN_ID}` } })
      .select('id')
      .single();
    if (categoryError) throw new Error(`insert question category failed: ${categoryError.message}`);
    categoryId = category.id;
    const { data: question, error: questionError } = await service
      .from('questions')
      .insert({
        project_id: DEFAULT_PROJECT_ID,
        category_id: category.id,
        type: 'text',
        name: { en: `Writer integration ${RUN_ID}` }
      })
      .select('id')
      .single();
    if (questionError) throw new Error(`insert question failed: ${questionError.message}`);
    questionId = question.id;

    const { data: election, error: electionError } = await service
      .from('elections')
      .insert({ project_id: DEFAULT_PROJECT_ID, name: ELECTION_NAME })
      .select('id')
      .single();
    if (electionError) throw new Error(`insert election failed: ${electionError.message}`);
    electionId = election.id;
    const { data: constituency, error: constituencyError } = await service
      .from('constituencies')
      .insert({ project_id: DEFAULT_PROJECT_ID, name: CONSTITUENCY_NAME })
      .select('id')
      .single();
    if (constituencyError) throw new Error(`insert constituency failed: ${constituencyError.message}`);
    constituencyId = constituency.id;
    // A nomination's constituency must be a constituency of its election: one a constituency group linked to the election holds.
    const { data: constituencyGroup, error: constituencyGroupError } = await service
      .from('constituency_groups')
      .insert({ project_id: DEFAULT_PROJECT_ID, name: { en: `Writer integration group ${RUN_ID}` } })
      .select('id')
      .single();
    if (constituencyGroupError) throw new Error(`insert constituency group failed: ${constituencyGroupError.message}`);
    constituencyGroupId = constituencyGroup.id;
    const { error: groupLinkError } = await service
      .from('constituency_group_constituencies')
      .insert({ constituency_group_id: constituencyGroup.id, constituency_id: constituency.id });
    if (groupLinkError) throw new Error(`link constituency to group failed: ${groupLinkError.message}`);
    const { error: electionLinkError } = await service
      .from('election_constituency_groups')
      .insert({ election_id: election.id, constituency_group_id: constituencyGroup.id });
    if (electionLinkError) throw new Error(`link election to group failed: ${electionLinkError.message}`);

    // The parent first: a candidate's nomination names the organization's nomination it stands under.
    const { data: organizationNomination, error: organizationNominationError } = await service
      .from('nominations')
      .insert({
        project_id: DEFAULT_PROJECT_ID,
        organization_id: confirmedOrganization.id,
        election_id: election.id,
        constituency_id: constituency.id,
        confirmed: true,
        custom_data: NOMINATION_CUSTOM_DATA
      })
      .select('id')
      .single();
    if (organizationNominationError)
      throw new Error(`insert organization nomination failed: ${organizationNominationError.message}`);
    organizationNominationId = organizationNomination.id;
    const { data: candidateNomination, error: candidateNominationError } = await service
      .from('nominations')
      .insert({
        project_id: DEFAULT_PROJECT_ID,
        candidate_id: candidateA.id,
        election_id: election.id,
        constituency_id: constituency.id,
        election_symbol: '7',
        parent_nomination_id: organizationNomination.id
      })
      .select('id')
      .single();
    if (candidateNominationError)
      throw new Error(`insert candidate nomination failed: ${candidateNominationError.message}`);
    candidateNominationId = candidateNomination.id;

    organizationEditor = (await editorOf('organization', organization)).writer;
    ({ writer: confirmedOrganizationEditor, client: confirmedOrganizationClient } = await editorOf(
      'confirmed-organization',
      confirmedOrganization
    ));
    ({ writer: candidateEditor, client: candidateClient } = await editorOf('candidate-a', candidateA));
  }, HANG_GUARD_MS);

  afterAll(async () => {
    if (!service) return;
    const failures = new Array<string>();
    const targets = [organization, confirmedOrganization, candidateA, candidateB].filter((target): target is Target =>
      Boolean(target)
    );

    // Reverse order of creation: grants, users, the nominations with their election, constituency and constituency group (the links go with them), the question and its category, stored objects, entity rows.
    if (userIds.length > 0) {
      const { error } = await service.from('grants').delete().in('user_id', userIds);
      if (error) failures.push(`delete grants: ${error.message}`);
    }
    for (const userId of userIds) {
      const { error } = await service.auth.admin.deleteUser(userId);
      if (error) failures.push(`delete user: ${error.message}`);
    }
    // The child before its parent: a nomination that others stand under is not deleted.
    for (const nominationId of [candidateNominationId, organizationNominationId]) {
      if (!nominationId) continue;
      const { error } = await service.from('nominations').delete().eq('id', nominationId);
      if (error) failures.push(`delete nomination: ${error.message}`);
    }
    if (electionId) {
      const { error } = await service.from('elections').delete().eq('id', electionId);
      if (error) failures.push(`delete election: ${error.message}`);
    }
    if (constituencyId) {
      const { error } = await service.from('constituencies').delete().eq('id', constituencyId);
      if (error) failures.push(`delete constituency: ${error.message}`);
    }
    if (constituencyGroupId) {
      const { error } = await service.from('constituency_groups').delete().eq('id', constituencyGroupId);
      if (error) failures.push(`delete constituency group: ${error.message}`);
    }
    if (categoryId) {
      const { error: questionError } = await service.from('questions').delete().eq('category_id', categoryId);
      if (questionError) failures.push(`delete question: ${questionError.message}`);
      const { error } = await service.from('question_categories').delete().eq('id', categoryId);
      if (error) failures.push(`delete question category: ${error.message}`);
    }
    for (const target of targets) {
      const folder = `${DEFAULT_PROJECT_ID}/${target.table}/${target.id}`;
      const names = await storedObjects(target).catch(() => new Array<string>());
      if (names.length > 0) {
        const { error } = await service.storage.from(BUCKET).remove(names.map((name) => `${folder}/${name}`));
        if (error) failures.push(`remove objects: ${error.message}`);
      }
      const { error } = await service.from(target.table).delete().eq('id', target.id);
      if (error) failures.push(`delete ${target.table} row: ${error.message}`);
    }

    // Nothing the run created is left.
    const nominationIds = [candidateNominationId, organizationNominationId].filter((id): id is string => Boolean(id));
    if (nominationIds.length > 0) {
      const { count } = await service
        .from('nominations')
        .select('*', { count: 'exact', head: true })
        .in('id', nominationIds);
      if (count !== 0) failures.push(`${count} nomination(s) left`);
    }
    if (electionId) {
      const { count } = await service
        .from('elections')
        .select('*', { count: 'exact', head: true })
        .eq('id', electionId);
      if (count !== 0) failures.push('an election is left');
    }
    if (constituencyId) {
      const { count } = await service
        .from('constituencies')
        .select('*', { count: 'exact', head: true })
        .eq('id', constituencyId);
      if (count !== 0) failures.push('a constituency is left');
    }
    if (constituencyGroupId) {
      const { count } = await service
        .from('constituency_groups')
        .select('*', { count: 'exact', head: true })
        .eq('id', constituencyGroupId);
      if (count !== 0) failures.push('a constituency group is left');
    }
    if (categoryId) {
      const { count: questions } = await service
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);
      if (questions !== 0) failures.push(`${questions} question(s) left`);
      const { count: categories } = await service
        .from('question_categories')
        .select('*', { count: 'exact', head: true })
        .eq('id', categoryId);
      if (categories !== 0) failures.push(`${categories} question categor(ies) left`);
    }
    if (userIds.length > 0) {
      const { count } = await service.from('grants').select('*', { count: 'exact', head: true }).in('user_id', userIds);
      if (count !== 0) failures.push(`${count} grant(s) left`);
      for (const userId of userIds) {
        const { data } = await service.auth.admin.getUserById(userId);
        if (data?.user) failures.push('a user is left');
      }
    }
    for (const target of targets) {
      const { count } = await service
        .from(target.table)
        .select('*', { count: 'exact', head: true })
        .eq('id', target.id);
      if (count !== 0) failures.push(`a ${target.table} row is left`);
      const names = await storedObjects(target).catch(() => ['unlisted']);
      if (names.length > 0) failures.push(`${names.length} stored object(s) left under ${target.table}`);
    }
    if (failures.length > 0) throw new Error(`The teardown left something behind: ${failures.join('; ')}`);
  }, HANG_GUARD_MS);

  it(
    "saves an organization's answers through its editor's own session, and the stored row holds them",
    async () => {
      const listed = await organizationEditor.getUserEntities();
      expect(listed.map(({ type, id }) => ({ type, id }))).toEqual([{ type: 'organization', id: organization.id }]);

      const userData = await organizationEditor.getEntityUserData({ type: 'organization', id: organization.id });
      expect(userData?.entity.type).toBe('organization');
      expect(userData?.entity.id).toBe(organization.id);
      expect(userData?.entity.name).toBe(`Writer integration ${RUN_ID}`);

      const answers: LocalizedAnswers = { [questionId]: { value: 'An answer saved by the real writer' } };
      const saved = await organizationEditor.updateAnswers({
        target: { type: 'organization', id: organization.id },
        answers
      });
      expect(saved).toEqual(answers);

      expect((await storedColumns(organization)).answers).toEqual(answers);
    },
    HANG_GUARD_MS
  );

  it(
    "reads a signed-in editor's user-level data, with the account's password fact as a boolean",
    async () => {
      const user = await organizationEditor.getBasicUserData();

      expect(user.email).toBe(`writer-integration-organization-${RUN_ID}@example.test`);
      expect(user.role).toBe('contestant');
      expect(user.passwordSet).toBe(true);
    },
    HANG_GUARD_MS
  );

  it(
    "reads a signed-in editor's address as proved, with nothing pending and no pending address taken",
    async () => {
      const user = await organizationEditor.getBasicUserData();

      expect(user.addressState).toBe('proved');
      expect(user.pendingEmail).toBeNull();
      expect(user.pendingEmailTaken).toBe(false);
      expect(user.ownOrganizationUnnamed).toBe(false);
      expect(user.username).toBe(user.email);
    },
    HANG_GUARD_MS
  );

  /** The three pairings of a caller with an entity it holds no editor grant on, all inside one project. */
  const pairings = [
    {
      name: "a candidate's editor targeting an organization",
      writer: () => candidateEditor,
      target: () => organization
    },
    {
      name: "a candidate's editor targeting another candidate",
      writer: () => candidateEditor,
      target: () => candidateB
    },
    {
      name: "an organization's editor targeting a candidate",
      writer: () => organizationEditor,
      target: () => candidateA
    }
  ];

  describe.each(pairings)('$name', ({ writer, target }) => {
    it(
      'is refused an answer save, and the stored answers are what they were',
      async () => {
        const before = await storedColumns(target());

        await expect(
          writer().updateAnswers({
            target: { type: target().type, id: target().id },
            answers: { [questionId]: { value: 'A write that must not land' } }
          })
        ).rejects.toThrow(/access denied/);

        expect((await storedColumns(target())).answers).toEqual(before.answers);
      },
      HANG_GUARD_MS
    );

    it(
      'is refused an image update, with nothing stored under the folder and the image what it was',
      async () => {
        const before = await storedColumns(target());
        const file = new File([PNG_BYTES], 'forged.png', { type: 'image/png' });

        await expect(
          writer().updateEntityProperties({
            target: { type: target().type, id: target().id },
            // reason: the public option type names a stored image, and the file-carrying shape under test is the one the profile form produces.
            properties: { image: { file } as never }
          })
        ).rejects.toThrow(/^Image upload failed: /);

        expect(await storedObjects(target())).toEqual([]);
        expect((await storedColumns(target())).image).toEqual(before.image);
      },
      HANG_GUARD_MS
    );
  });

  describe("an editor's writes of its own entity's names and colour", () => {
    it(
      "the refusal a signed-in editor receives for a changed name on a confirmed row carries the trigger's code and the start of its message",
      async () => {
        const { data, error } = await confirmedOrganizationClient
          .from('organizations')
          .update({ name: { en: `Renamed ${RUN_ID}` } })
          .eq('id', confirmedOrganization.id)
          .select('name')
          .single();

        expect(data).toBeNull();
        expect(error?.code).toBe('P0001');
        expect(error?.message.startsWith(NAME_REFUSAL_PREFIX)).toBe(true);

        expect((await storedOrganizationProperties(confirmedOrganization)).name).toEqual(CONFIRMED_NAME);
      },
      HANG_GUARD_MS
    );

    it(
      'an unconfirmed organization saves its names and colour, and the stored row holds them',
      async () => {
        const name = { en: `Renamed ${RUN_ID}`, fi: `Uusi nimi ${RUN_ID}` };
        const shortName = { en: 'RN' };

        const result = await organizationEditor.updateEntityProperties({
          target: { type: 'organization', id: organization.id },
          properties: { name, shortName, color: { normal: '#2546A8' } },
          locale: 'fi'
        });

        expect(result).toEqual({
          type: 'saved',
          properties: { name: name.fi, shortName: shortName.en, color: { normal: '#2546a8' } },
          localizedNames: { name, shortName }
        });

        // The colour holds `normal` alone: the equality is exact.
        expect(await storedOrganizationProperties(organization)).toEqual({
          name,
          short_name: shortName,
          color: { normal: '#2546a8' }
        });

        const userData = await organizationEditor.getEntityUserData({
          type: 'organization',
          id: organization.id,
          locale: 'fi'
        });
        expect(userData?.localizedNames).toEqual({ name, shortName });
        expect(userData?.entity.name).toBe(name.fi);
      },
      HANG_GUARD_MS
    );

    it(
      "a confirmed organization's name is refused and its colour saved, the refused write changing neither",
      async () => {
        const target = { type: 'organization', id: confirmedOrganization.id } as const;
        const before = await storedOrganizationProperties(confirmedOrganization);

        // One call is one statement: the colour sent with a refused name is not stored either.
        const refused = await confirmedOrganizationEditor.updateEntityProperties({
          target,
          properties: { name: { ...CONFIRMED_NAME, en: `Renamed ${RUN_ID}` }, color: { normal: '#aa0000' } }
        });
        expect(refused).toEqual({ type: 'nameRefused' });
        expect(await storedOrganizationProperties(confirmedOrganization)).toEqual(before);

        const saved = await confirmedOrganizationEditor.updateEntityProperties({
          target,
          properties: { color: { normal: '#0a0' } }
        });
        expect(saved).toEqual({ type: 'saved', properties: { color: { normal: '#00aa00' } }, localizedNames: {} });
        expect(await storedOrganizationProperties(confirmedOrganization)).toEqual({
          ...before,
          color: { normal: '#00aa00' }
        });
      },
      HANG_GUARD_MS
    );

    it(
      "a confirmed organization's short name is refused, and the stored short name is what it was",
      async () => {
        const refused = await confirmedOrganizationEditor.updateEntityProperties({
          target: { type: 'organization', id: confirmedOrganization.id },
          properties: { shortName: { en: 'NEW' } }
        });
        expect(refused).toEqual({ type: 'nameRefused' });

        expect((await storedOrganizationProperties(confirmedOrganization)).short_name).toEqual(CONFIRMED_SHORT_NAME);
      },
      HANG_GUARD_MS
    );

    it(
      'an unconfirmed candidate saves its names, and the stored row holds them',
      async () => {
        const lastName = `Renamed ${RUN_ID}`;

        const result = await candidateEditor.updateEntityProperties({
          target: { type: 'candidate', id: candidateA.id },
          properties: { firstName: '  Ada ', lastName }
        });

        expect(result).toEqual({
          type: 'saved',
          properties: { firstName: 'Ada', lastName },
          localizedNames: {}
        });
        expect(await storedCandidateNames(candidateA)).toEqual({ first_name: 'Ada', last_name: lastName });
      },
      HANG_GUARD_MS
    );
  });

  it(
    "nominations: a candidate's editor reads its own nominations, with the party it stands for",
    async () => {
      const userData = await candidateEditor.getEntityUserData({
        type: 'candidate',
        id: candidateA.id,
        loadNominations: true,
        locale: 'fi'
      });

      expect(userData?.entity.type).toBe('candidate');
      expect(userData?.entity.id).toBe(candidateA.id);
      // The names are read in Finnish where it is stored and in the default locale where it is not.
      expect(userData?.nominations).toEqual([
        {
          id: candidateNominationId,
          electionId,
          electionName: ELECTION_NAME.fi,
          constituencyId,
          constituencyName: CONSTITUENCY_NAME.en,
          electionRound: 1,
          electionSymbol: '7',
          confirmed: false,
          customData: null,
          updatedAt: expect.any(String),
          parent: {
            entityType: 'organization',
            entityId: confirmedOrganization.id,
            name: CONFIRMED_NAME.fi,
            shortName: CONFIRMED_SHORT_NAME.en
          }
        }
      ]);
    },
    HANG_GUARD_MS
  );

  it(
    "nominations: an organization's editor reads its own nominations",
    async () => {
      const userData = await confirmedOrganizationEditor.getEntityUserData({
        type: 'organization',
        id: confirmedOrganization.id,
        loadNominations: true
      });

      expect(userData?.entity.type).toBe('organization');
      expect(userData?.entity.id).toBe(confirmedOrganization.id);
      expect(userData?.nominations).toEqual([
        {
          id: organizationNominationId,
          electionId,
          electionName: ELECTION_NAME.en,
          constituencyId,
          constituencyName: CONSTITUENCY_NAME.en,
          electionRound: 1,
          electionSymbol: '',
          confirmed: true,
          customData: NOMINATION_CUSTOM_DATA,
          updatedAt: expect.any(String)
        }
      ]);
      expect(userData?.nominations.every((nomination) => !Object.hasOwn(nomination, 'parent'))).toBe(true);
    },
    HANG_GUARD_MS
  );

  it(
    'nominations: an entity with no nomination has an empty list',
    async () => {
      const userData = await organizationEditor.getEntityUserData({
        type: 'organization',
        id: organization.id,
        loadNominations: true
      });

      expect(userData?.entity.type).toBe('organization');
      expect(userData?.entity.id).toBe(organization.id);
      expect(userData?.nominations).toEqual([]);
    },
    HANG_GUARD_MS
  );

  it(
    "nominations: another user's entity is not read",
    async () => {
      // Candidate A's editor asks for candidate B, which it does not edit, and for the organization whose nomination its own stands under.
      await expect(
        candidateEditor.getEntityUserData({ type: 'candidate', id: candidateB.id, loadNominations: true })
      ).resolves.toBeUndefined();
      await expect(
        candidateEditor.getEntityUserData({
          type: 'organization',
          id: confirmedOrganization.id,
          loadNominations: true
        })
      ).resolves.toBeUndefined();

      // The function itself, asked by the same user: a null and no error for an entity that is not the caller's, whether or not it has a nomination, and a list for the caller's own.
      function ask(type: 'candidate' | 'organization', id: string) {
        return candidateClient.rpc('get_entity_nominations', {
          p_project_id: DEFAULT_PROJECT_ID,
          p_entity_type: type,
          p_entity_id: id
        });
      }
      const { data: notEdited, error: notEditedError } = await ask('candidate', candidateB.id);
      expect(notEditedError).toBeNull();
      expect(notEdited).toBeNull();
      const { data: parentEntity, error: parentEntityError } = await ask('organization', confirmedOrganization.id);
      expect(parentEntityError).toBeNull();
      expect(parentEntity).toBeNull();
      const { data: own, error: ownError } = await ask('candidate', candidateA.id);
      expect(ownError).toBeNull();
      expect(Array.isArray(own)).toBe(true);
    },
    HANG_GUARD_MS
  );
});

describe.skipIf(!hasSupabase)(
  "an editor's nominations, written through setEntityNominations and read through getNominationParentOptions",
  () => {
    /** The names the listed party is created with. It has no Finnish short name, so a read in Finnish falls back to the default locale for it. */
    const LISTED_PARTY_NAME = { en: `Writer integration listed party ${RUN_ID}`, fi: `Listattu puolue ${RUN_ID}` };
    const LISTED_PARTY_SHORT_NAME = { en: 'WLP' };
    const ALLIANCE_NAME = { en: `Writer integration alliance ${RUN_ID}` };
    /** The name of a party the project does not list, as its candidate types it. */
    const TYPED_PARTY_NAME = `Typed party ${RUN_ID}`;

    let service: SupabaseClient<Database>;
    /** The default project's settings as the group found them, which it leaves them as. */
    let originalSettings: StoredSettings | undefined;
    // Two contests: one in an election whose candidates must stand for a party, one in an election of the default type.
    let closedListElectionId: string;
    let closedListConstituencyId: string;
    let openElectionId: string;
    let openConstituencyId: string;
    /** A confirmed organization nominated at the closed-list contest and not at the open one. */
    let listedParty: Target;
    /** A confirmed organization with no nomination. */
    let unnominatedParty: Target;
    /** An unconfirmed organization nominated at the closed-list contest, with the listed candidate's nomination under its own. */
    let unconfirmedParty: Target;
    let unconfirmedPartyNominationId: string;
    let allianceId: string;
    /** A candidate with no nomination, whose editor writes its first ones. */
    let candidate: Target;
    /** A candidate nominated under the unconfirmed party's nomination, with the symbol 3. */
    let listedCandidate: Target;
    let listedCandidateNominationId: string;
    /** A candidate with no nomination, whose editor has originated as many unconfirmed parent nominations as a caller may. */
    let cappedCandidate: Target;
    let candidateEditor: Editor;
    let listedCandidateEditor: Editor;
    let cappedCandidateEditor: Editor;
    let unconfirmedPartyEditor: Editor;
    const userIds = new Array<string>();
    const electionIds = new Array<string>();
    const constituencyIds = new Array<string>();
    const constituencyGroupIds = new Array<string>();
    const organizationIds = new Array<string>();
    const candidateIds = new Array<string>();
    const allianceIds = new Array<string>();

    /**
     * Insert one organization of the default project.
     * @param label - Distinguishes the organization's name within the run.
     * @param columns - The columns to state beside the project and the name.
     * @returns The organization.
     */
    async function insertOrganization(
      label: string,
      columns: Partial<Database['public']['Tables']['organizations']['Insert']> = {}
    ): Promise<Target> {
      const { data, error } = await service
        .from('organizations')
        .insert({ project_id: DEFAULT_PROJECT_ID, name: { en: `Writer integration ${label} ${RUN_ID}` }, ...columns })
        .select('id')
        .single();
      if (error) throw new Error(`insert organization failed: ${error.message}`);
      organizationIds.push(data.id);
      return { type: 'organization', table: 'organizations', id: data.id };
    }

    /**
     * Insert one candidate of the default project.
     * @param label - The candidate's first name, which distinguishes it within the run.
     * @returns The candidate.
     */
    async function insertCandidate(label: string): Promise<Target> {
      const { data, error } = await service
        .from('candidates')
        .insert({ project_id: DEFAULT_PROJECT_ID, first_name: label, last_name: `Writer integration ${RUN_ID}` })
        .select('id')
        .single();
      if (error) throw new Error(`insert candidate failed: ${error.message}`);
      candidateIds.push(data.id);
      return { type: 'candidate', table: 'candidates', id: data.id };
    }

    /**
     * Insert one election with a constituency of its own, in a constituency group of its own that the election is linked to.
     * @param label - Distinguishes the three names within the run.
     * @param columns - The columns of the election to state beside the project and the name.
     * @returns The ids of the election and the constituency.
     */
    async function insertContest(
      label: string,
      columns: Partial<Database['public']['Tables']['elections']['Insert']> = {}
    ): Promise<{ electionId: string; constituencyId: string }> {
      const name = { en: `Writer integration ${label} ${RUN_ID}` };
      const { data: election, error: electionError } = await service
        .from('elections')
        .insert({ project_id: DEFAULT_PROJECT_ID, name, ...columns })
        .select('id')
        .single();
      if (electionError) throw new Error(`insert election failed: ${electionError.message}`);
      electionIds.push(election.id);
      const { data: constituency, error: constituencyError } = await service
        .from('constituencies')
        .insert({ project_id: DEFAULT_PROJECT_ID, name })
        .select('id')
        .single();
      if (constituencyError) throw new Error(`insert constituency failed: ${constituencyError.message}`);
      constituencyIds.push(constituency.id);
      const { data: group, error: groupError } = await service
        .from('constituency_groups')
        .insert({ project_id: DEFAULT_PROJECT_ID, name })
        .select('id')
        .single();
      if (groupError) throw new Error(`insert constituency group failed: ${groupError.message}`);
      constituencyGroupIds.push(group.id);
      const { error: memberError } = await service
        .from('constituency_group_constituencies')
        .insert({ constituency_group_id: group.id, constituency_id: constituency.id });
      if (memberError) throw new Error(`link constituency failed: ${memberError.message}`);
      const { error: linkError } = await service
        .from('election_constituency_groups')
        .insert({ election_id: election.id, constituency_group_id: group.id });
      if (linkError) throw new Error(`link constituency group failed: ${linkError.message}`);
      return { electionId: election.id, constituencyId: constituency.id };
    }

    /**
     * Insert one nomination past row-level security.
     * @param columns - The row's columns beside the project.
     * @returns The nomination's id.
     */
    async function insertNomination(
      columns: Omit<Database['public']['Tables']['nominations']['Insert'], 'project_id'>
    ): Promise<string> {
      const { data, error } = await service
        .from('nominations')
        .insert({ project_id: DEFAULT_PROJECT_ID, ...columns })
        .select('id')
        .single();
      if (error) throw new Error(`insert nomination failed: ${error.message}`);
      return data.id;
    }

    /**
     * The stored nominations of an entity, read past row-level security.
     * @param target - The entity whose nominations to read.
     * @returns The rows, the oldest first.
     */
    async function storedNominations(target: Target) {
      const { data, error } = await service
        .from('nominations')
        .select(
          'id, election_id, constituency_id, election_symbol, parent_nomination_id, custom_data, confirmed, created_by, updated_at'
        )
        .eq(target.type === 'candidate' ? 'candidate_id' : 'organization_id', target.id)
        .order('created_at');
      if (error) throw new Error(`read of nominations failed: ${error.message}`);
      return data;
    }

    /**
     * The nominations of an entity as a write states the read it was computed from.
     * @param target - The entity.
     * @returns Each stored nomination's id with the time it was last updated.
     */
    async function readOf(target: Target) {
      return (await storedNominations(target)).map((row) => ({ id: row.id, updatedAt: row.updated_at }));
    }

    /**
     * Write the default project's settings past row-level security.
     * @param settings - The whole settings value to store.
     */
    async function writeSettings(settings: StoredSettings): Promise<void> {
      const { error } = await service.from('app_settings').update({ settings }).eq('project_id', DEFAULT_PROJECT_ID);
      if (error) throw new Error(`write of the settings failed: ${error.message}`);
    }

    /**
     * The default project's settings with the nominations lock on and every other member as it was found.
     * @returns The settings value to store.
     */
    function lockedSettings(): StoredSettings {
      const settings =
        typeof originalSettings === 'object' && originalSettings !== null && !Array.isArray(originalSettings)
          ? originalSettings
          : {};
      const access =
        typeof settings.access === 'object' && settings.access !== null && !Array.isArray(settings.access)
          ? settings.access
          : {};
      return { ...settings, access: { ...access, nominationsLocked: true } };
    }

    /**
     * One nomination in the form the writer is handed it.
     * @param contest - The election and the constituency.
     * @param rest - The symbol, the parent and, for a stored nomination, its id.
     * @returns The nomination.
     */
    function desired(
      contest: { electionId: string; constituencyId: string },
      rest: Omit<DesiredNomination, 'electionId' | 'constituencyId'>
    ): DesiredNomination {
      return { ...contest, ...rest };
    }

    beforeAll(async () => {
      service = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      const { data: settingsRow, error: settingsError } = await service
        .from('app_settings')
        .select('settings')
        .eq('project_id', DEFAULT_PROJECT_ID)
        .single();
      if (settingsError) throw new Error(`read of the settings failed: ${settingsError.message}`);
      originalSettings = settingsRow.settings;

      ({ electionId: closedListElectionId, constituencyId: closedListConstituencyId } = await insertContest(
        'closed list',
        { election_type: 'organization_list' }
      ));
      ({ electionId: openElectionId, constituencyId: openConstituencyId } = await insertContest('open list'));

      listedParty = await insertOrganization('listed party', {
        name: LISTED_PARTY_NAME,
        short_name: LISTED_PARTY_SHORT_NAME,
        confirmed: true
      });
      unnominatedParty = await insertOrganization('unnominated party', { confirmed: true });
      unconfirmedParty = await insertOrganization('unconfirmed party');
      const { data: alliance, error: allianceError } = await service
        .from('alliances')
        .insert({ project_id: DEFAULT_PROJECT_ID, name: ALLIANCE_NAME })
        .select('id')
        .single();
      if (allianceError) throw new Error(`insert alliance failed: ${allianceError.message}`);
      allianceIds.push(alliance.id);
      allianceId = alliance.id;

      candidate = await insertCandidate('First');
      listedCandidate = await insertCandidate('Listed');
      cappedCandidate = await insertCandidate('Capped');

      const closedList = { election_id: closedListElectionId, constituency_id: closedListConstituencyId };
      await insertNomination({ ...closedList, organization_id: listedParty.id, confirmed: true });
      // The parent first: the listed candidate's nomination names the nomination it stands under.
      unconfirmedPartyNominationId = await insertNomination({ ...closedList, organization_id: unconfirmedParty.id });
      listedCandidateNominationId = await insertNomination({
        ...closedList,
        candidate_id: listedCandidate.id,
        election_symbol: '3',
        parent_nomination_id: unconfirmedPartyNominationId
      });

      candidateEditor = await createEditor(service, userIds, 'nominations-candidate', candidate);
      listedCandidateEditor = await createEditor(service, userIds, 'nominations-listed-candidate', listedCandidate);
      cappedCandidateEditor = await createEditor(service, userIds, 'nominations-capped-candidate', cappedCandidate);
      unconfirmedPartyEditor = await createEditor(service, userIds, 'nominations-party', unconfirmedParty);

      // As many unconfirmed nominations of organizations as one caller may have originated, each recorded as created by the capped candidate's editor.
      for (let index = 0; index < PENDING_CAP; index++) {
        const filler = await insertOrganization(`filler party ${index}`);
        await insertNomination({
          election_id: openElectionId,
          constituency_id: openConstituencyId,
          organization_id: filler.id,
          created_by: cappedCandidateEditor.userId
        });
      }
    }, HANG_GUARD_MS);

    afterAll(async () => {
      if (!service) return;
      const failures = new Array<string>();

      // The settings first, so a run that failed inside the locked case does not leave the project locked.
      if (originalSettings !== undefined) await writeSettings(originalSettings).catch((e) => failures.push(String(e)));

      if (userIds.length > 0) {
        const { error } = await service.from('grants').delete().in('user_id', userIds);
        if (error) failures.push(`delete grants: ${error.message}`);
      }
      for (const userId of userIds) {
        const { error } = await service.auth.admin.deleteUser(userId);
        if (error) failures.push(`delete user: ${error.message}`);
      }
      // Every nomination of the two elections, the ones the cases wrote included. The children before their parents: a nomination that others stand under is not deleted.
      if (electionIds.length > 0) {
        const { error: childError } = await service
          .from('nominations')
          .delete()
          .in('election_id', electionIds)
          .not('parent_nomination_id', 'is', null);
        if (childError) failures.push(`delete nominations under a parent: ${childError.message}`);
        const { error } = await service.from('nominations').delete().in('election_id', electionIds);
        if (error) failures.push(`delete nominations: ${error.message}`);
      }
      const owned = [
        { table: 'elections', ids: electionIds },
        { table: 'constituencies', ids: constituencyIds },
        { table: 'constituency_groups', ids: constituencyGroupIds },
        { table: 'candidates', ids: candidateIds },
        { table: 'organizations', ids: organizationIds },
        { table: 'alliances', ids: allianceIds }
      ] as const;
      for (const { table, ids } of owned) {
        if (ids.length === 0) continue;
        const { error } = await service.from(table).delete().in('id', ids);
        if (error) failures.push(`delete ${table}: ${error.message}`);
      }

      // Nothing the group created is left, and the settings are what they were.
      if (electionIds.length > 0) {
        const { count } = await service
          .from('nominations')
          .select('*', { count: 'exact', head: true })
          .in('election_id', electionIds);
        if (count !== 0) failures.push(`${count} nomination(s) left`);
      }
      for (const { table, ids } of owned) {
        if (ids.length === 0) continue;
        const { count } = await service.from(table).select('*', { count: 'exact', head: true }).in('id', ids);
        if (count !== 0) failures.push(`${count} row(s) of ${table} left`);
      }
      if (userIds.length > 0) {
        const { count } = await service
          .from('grants')
          .select('*', { count: 'exact', head: true })
          .in('user_id', userIds);
        if (count !== 0) failures.push(`${count} grant(s) left`);
        for (const userId of userIds) {
          const { data } = await service.auth.admin.getUserById(userId);
          if (data?.user) failures.push('a user is left');
        }
      }
      if (originalSettings !== undefined) {
        const { data } = await service
          .from('app_settings')
          .select('settings')
          .eq('project_id', DEFAULT_PROJECT_ID)
          .single();
        if (JSON.stringify(data?.settings) !== JSON.stringify(originalSettings))
          failures.push('the settings are not what they were');
      }
      if (failures.length > 0) throw new Error(`The teardown left something behind: ${failures.join('; ')}`);
    }, HANG_GUARD_MS);

    it(
      'a first save of one nomination with a typed party name is saved as one insert, with no parent and the name in its custom data',
      async () => {
        const closedList = { electionId: closedListElectionId, constituencyId: closedListConstituencyId };

        const result = await candidateEditor.writer.setEntityNominations({
          target: { type: 'candidate', id: candidate.id },
          nominations: [
            desired(closedList, { electionSymbol: ' 12 ', parent: { kind: 'other', name: `  ${TYPED_PARTY_NAME} ` } })
          ],
          readFrom: []
        });

        expect(result).toEqual({ type: 'saved', inserted: 1, updated: 0, deleted: 0, unchanged: 0, parentsCreated: 0 });

        const userData = await candidateEditor.writer.getEntityUserData({
          type: 'candidate',
          id: candidate.id,
          loadNominations: true
        });
        expect(userData?.nominations).toHaveLength(1);
        // The symbol and the name are stored without their surrounding white space.
        expect(userData?.nominations[0]).toMatchObject({
          ...closedList,
          electionSymbol: '12',
          confirmed: false,
          customData: { requestedParentOrganization: TYPED_PARTY_NAME }
        });
        expect(Object.hasOwn(userData?.nominations[0] ?? {}, 'parent')).toBe(false);
      },
      HANG_GUARD_MS
    );

    it(
      'a save that links a listed party with no nomination at the contest creates that nomination, and the read states the party by its id',
      async () => {
        const closedList = { electionId: closedListElectionId, constituencyId: closedListConstituencyId };
        const open = { electionId: openElectionId, constituencyId: openConstituencyId };
        const [stored] = await storedNominations(candidate);
        expect(await storedNominations(unnominatedParty)).toEqual([]);

        const result = await candidateEditor.writer.setEntityNominations({
          target: { type: 'candidate', id: candidate.id },
          readFrom: await readOf(candidate),
          nominations: [
            desired(closedList, { id: stored.id, electionSymbol: '12', parent: { kind: 'keep' } }),
            desired(open, {
              electionSymbol: '4',
              parent: { kind: 'entity', entityType: 'organization', entityId: unnominatedParty.id }
            })
          ]
        });

        expect(result).toEqual({ type: 'saved', inserted: 1, updated: 0, deleted: 0, unchanged: 1, parentsCreated: 1 });

        // The party's nomination is at the candidate's contest, unconfirmed, and recorded as created by the candidate's editor.
        const created = await storedNominations(unnominatedParty);
        expect(created).toHaveLength(1);
        expect(created[0]).toMatchObject({
          election_id: openElectionId,
          constituency_id: openConstituencyId,
          parent_nomination_id: null,
          confirmed: false,
          created_by: candidateEditor.userId
        });

        const userData = await candidateEditor.writer.getEntityUserData({
          type: 'candidate',
          id: candidate.id,
          loadNominations: true
        });
        const linked = userData?.nominations.find((nomination) => nomination.electionId === openElectionId);
        expect(linked).toMatchObject({ ...open, electionSymbol: '4', confirmed: false });
        expect(linked?.parent?.entityType).toBe('organization');
        expect(linked?.parent?.entityId).toBe(unnominatedParty.id);
      },
      HANG_GUARD_MS
    );

    it(
      'a second save of the set that is stored leaves every nomination unchanged',
      async () => {
        const stored = await storedNominations(candidate);
        expect(stored).toHaveLength(2);
        const typed = stored.find((row) => row.election_id === closedListElectionId);
        const linked = stored.find((row) => row.election_id === openElectionId);

        const result = await candidateEditor.writer.setEntityNominations({
          target: { type: 'candidate', id: candidate.id },
          readFrom: stored.map((row) => ({ id: row.id, updatedAt: row.updated_at })),
          nominations: [
            desired(
              { electionId: closedListElectionId, constituencyId: closedListConstituencyId },
              { id: typed?.id, electionSymbol: '12', parent: { kind: 'other', name: TYPED_PARTY_NAME } }
            ),
            desired(
              { electionId: openElectionId, constituencyId: openConstituencyId },
              {
                id: linked?.id,
                electionSymbol: '4',
                parent: { kind: 'entity', entityType: 'organization', entityId: unnominatedParty.id }
              }
            )
          ]
        });

        expect(result).toEqual({ type: 'saved', inserted: 0, updated: 0, deleted: 0, unchanged: 2, parentsCreated: 0 });
        expect(await storedNominations(candidate)).toEqual(stored);
      },
      HANG_GUARD_MS
    );

    it(
      'a save computed from a read that is no longer current is refused as changed, and removes and writes nothing',
      async () => {
        const stored = await storedNominations(candidate);
        expect(stored).toHaveLength(2);
        const typed = stored.find((row) => row.election_id === closedListElectionId);

        // The read names one of the two nominations, at a time before its last update: the set leaves the other out.
        const result = await candidateEditor.writer.setEntityNominations({
          target: { type: 'candidate', id: candidate.id },
          readFrom: [{ id: typed?.id ?? '', updatedAt: '2000-01-01T00:00:00+00:00' }],
          nominations: [
            desired(
              { electionId: closedListElectionId, constituencyId: closedListConstituencyId },
              { id: typed?.id, electionSymbol: '13', parent: { kind: 'keep' } }
            )
          ]
        });

        expect(result).toEqual({ type: 'refused', reason: 'changed' });
        expect(await storedNominations(candidate)).toEqual(stored);
      },
      HANG_GUARD_MS
    );

    it(
      "an organization's editor removing the nomination a candidate is listed under is refused as hasCandidates, and the nomination is still there",
      async () => {
        const before = await storedNominations(unconfirmedParty);
        expect(before.map((row) => row.id)).toEqual([unconfirmedPartyNominationId]);

        const result = await unconfirmedPartyEditor.writer.setEntityNominations({
          target: { type: 'organization', id: unconfirmedParty.id },
          nominations: [],
          readFrom: await readOf(unconfirmedParty)
        });

        expect(result).toEqual({ type: 'refused', reason: 'hasCandidates' });
        expect(await storedNominations(unconfirmedParty)).toEqual(before);
        expect((await storedNominations(listedCandidate)).map((row) => row.parent_nomination_id)).toEqual([
          unconfirmedPartyNominationId
        ]);

        // The refusal itself, through the editor's own client: the code and the foreign key the writer recognises it by.
        const { data, error } = await unconfirmedPartyEditor.client.rpc('set_entity_nominations', {
          p_entity_type: 'organization',
          p_entity_id: unconfirmedParty.id,
          p_nominations: [],
          p_expected_reach: Object.fromEntries(before.map((row) => [row.id, row.updated_at]))
        });
        expect(data).toBeNull();
        expect(error?.code).toBe('23503');
        expect(error?.message).toContain(PARENT_NOMINATION_FOREIGN_KEY);
      },
      HANG_GUARD_MS
    );

    it(
      "a save that would create its caller's eleventh unconfirmed parent nomination is refused as tooManyPending, and stores nothing",
      async () => {
        const open = { electionId: openElectionId, constituencyId: openConstituencyId };
        const partyBefore = await storedNominations(listedParty);
        // The listed party is nominated at the closed-list contest alone, so linking it at the open contest would create its nomination there.
        expect(partyBefore.map((row) => row.election_id)).toEqual([closedListElectionId]);
        const nominations = [
          desired(open, {
            electionSymbol: '8',
            parent: { kind: 'entity', entityType: 'organization', entityId: listedParty.id }
          })
        ];

        const result = await cappedCandidateEditor.writer.setEntityNominations({
          target: { type: 'candidate', id: cappedCandidate.id },
          nominations,
          readFrom: []
        });

        expect(result).toEqual({ type: 'refused', reason: 'tooManyPending' });
        // The candidate's own nomination, written before the party's, went with the refused call.
        expect(await storedNominations(cappedCandidate)).toEqual([]);
        expect(await storedNominations(listedParty)).toEqual(partyBefore);

        // The refusal itself, through the editor's own client: the code and the start of the message the writer recognises it by.
        const { data, error } = await cappedCandidateEditor.client.rpc('set_entity_nominations', {
          p_entity_type: 'candidate',
          p_entity_id: cappedCandidate.id,
          p_nominations: [
            {
              election_id: openElectionId,
              constituency_id: openConstituencyId,
              election_symbol: '8',
              parent: { kind: 'entity', entity_type: 'organization', entity_id: listedParty.id }
            }
          ],
          p_expected_reach: {}
        });
        expect(data).toBeNull();
        expect(error?.code).toBe('P0001');
        expect(error?.message.startsWith(PENDING_CAP_REFUSAL_PREFIX)).toBe(true);
      },
      HANG_GUARD_MS
    );

    it(
      'with nominations locked a save that changes a symbol rejects and the stored symbol is what it was, and with the lock off the same save is stored',
      async () => {
        const target = { type: 'candidate', id: listedCandidate.id } as const;
        const nominations = [
          desired(
            { electionId: closedListElectionId, constituencyId: closedListConstituencyId },
            { id: listedCandidateNominationId, electionSymbol: '99', parent: { kind: 'keep' } }
          )
        ];

        const readFrom = await readOf(listedCandidate);

        await writeSettings(lockedSettings());
        try {
          await expect(
            listedCandidateEditor.writer.setEntityNominations({ target, nominations, readFrom })
          ).rejects.toThrow(
            /^setEntityNominations: set_entity_nominations: a nomination could not be written; nominations are locked /
          );
          expect((await storedNominations(listedCandidate)).map((row) => row.election_symbol)).toEqual(['3']);
        } finally {
          if (originalSettings !== undefined) await writeSettings(originalSettings);
        }

        // The same call with the lock off: the rejection above was the lock's.
        await expect(
          listedCandidateEditor.writer.setEntityNominations({ target, nominations, readFrom })
        ).resolves.toEqual({
          type: 'saved',
          inserted: 0,
          updated: 1,
          deleted: 0,
          unchanged: 0,
          parentsCreated: 0
        });
        expect((await storedNominations(listedCandidate)).map((row) => row.election_symbol)).toEqual(['99']);
      },
      HANG_GUARD_MS
    );

    it(
      "a candidate's save with neither a party nor a typed name in the closed-list election rejects, and stores nothing",
      async () => {
        await expect(
          cappedCandidateEditor.writer.setEntityNominations({
            target: { type: 'candidate', id: cappedCandidate.id },
            readFrom: [],
            nominations: [
              desired(
                { electionId: closedListElectionId, constituencyId: closedListConstituencyId },
                { electionSymbol: '5', parent: { kind: 'none' } }
              )
            ]
          })
        ).rejects.toThrow(new RegExp(`^setEntityNominations: ${PARENT_REQUIRED_REFUSAL_PREFIX}`));

        expect(await storedNominations(cappedCandidate)).toEqual([]);
      },
      HANG_GUARD_MS
    );

    it(
      "a candidate's parent options hold a confirmed organization with the contest it is nominated at, and no unconfirmed organization",
      async () => {
        const closedList = { electionId: closedListElectionId, constituencyId: closedListConstituencyId };
        const open = { electionId: openElectionId, constituencyId: openConstituencyId };

        const options = await listedCandidateEditor.writer.getNominationParentOptions({
          target: { type: 'candidate', id: listedCandidate.id },
          contests: [open, closedList],
          locale: 'fi'
        });

        // The name is read in Finnish where it is stored and the short name in the default locale. The party is nominated at one of the two contests asked about.
        expect(options?.find((option) => option.entity.id === listedParty.id)).toEqual({
          entity: {
            type: 'organization',
            id: listedParty.id,
            name: LISTED_PARTY_NAME.fi,
            shortName: LISTED_PARTY_SHORT_NAME.en
          },
          nominatedIn: [closedList]
        });
        expect(options?.every((option) => option.entity.type === 'organization')).toBe(true);
        // The organization the candidate's own nomination stands under is unconfirmed, and is not offered.
        expect(options?.some((option) => option.entity.id === unconfirmedParty.id)).toBe(false);
      },
      HANG_GUARD_MS
    );

    it(
      "an organization's parent options hold the alliance, and an entity the caller does not edit resolves to no options",
      async () => {
        const contests = [{ electionId: closedListElectionId, constituencyId: closedListConstituencyId }];

        const options = await unconfirmedPartyEditor.writer.getNominationParentOptions({
          target: { type: 'organization', id: unconfirmedParty.id },
          contests,
          locale: 'en'
        });
        expect(options?.find((option) => option.entity.id === allianceId)).toEqual({
          entity: { type: 'alliance', id: allianceId, name: ALLIANCE_NAME.en },
          nominatedIn: []
        });
        expect(options?.every((option) => option.entity.type === 'alliance')).toBe(true);

        // Another editor's candidate, and the organization a candidate stands under: neither is the caller's.
        await expect(
          candidateEditor.writer.getNominationParentOptions({
            target: { type: 'candidate', id: cappedCandidate.id },
            contests,
            locale: 'en'
          })
        ).resolves.toBeUndefined();
        await expect(
          listedCandidateEditor.writer.getNominationParentOptions({
            target: { type: 'organization', id: unconfirmedParty.id },
            contests,
            locale: 'en'
          })
        ).resolves.toBeUndefined();
      },
      HANG_GUARD_MS
    );

    it(
      "a candidate's nomination with no party, inserted past the writer into the closed-list election, is refused when the request ends, as an error with the code 23514",
      async () => {
        const response = await cappedCandidateEditor.client.from('nominations').insert({
          project_id: DEFAULT_PROJECT_ID,
          candidate_id: cappedCandidate.id,
          election_id: closedListElectionId,
          constituency_id: closedListConstituencyId
        });

        // What the API answered for a refusal raised when the request's transaction ends, kept in the run's output.
        console.info(
          `A refusal at the end of the request: status ${response.status}, code ${response.error?.code ?? 'none'}, message start "${response.error?.message.slice(0, PARENT_REQUIRED_REFUSAL_PREFIX.length) ?? ''}"`
        );

        expect(response.data).toBeNull();
        expect(response.error?.code).toBe('23514');
        expect(response.error?.message.startsWith(PARENT_REQUIRED_REFUSAL_PREFIX)).toBe(true);
        expect(await storedNominations(cappedCandidate)).toEqual([]);
      },
      HANG_GUARD_MS
    );
  }
);

describe.skipIf(!hasSupabase)('SupabaseDataWriter and the invitation contract against the local stack', () => {
  const email = `writer-integration-invitation-${RUN_ID}@example.test`;
  let service: SupabaseClient<Database>;
  let userId: string | undefined;
  let invitationId: string | undefined;
  let code: string;
  /** The server-shaped client the writer under test is built over. */
  let client: SupabaseClient<Database>;
  let writer: SupabaseDataWriter;
  /** The cookies the client holds, as a request's cookie jar would. The values are session tokens and are never printed. */
  const jar = new Map<string, string>();
  /** The names of the cookies of each write, in the order the writes happened. */
  const cookieWrites = new Array<Array<string>>();

  beforeAll(async () => {
    service = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: created, error: createError } = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true
    });
    if (createError) throw new Error(`createUser failed: ${createError.message}`);
    userId = created.user.id;

    // A project-scope promise with no address is a code invitation: the database generates the code and returns it once.
    const { data: seeded, error: seedError } = await service.rpc('create_invitations', {
      p_project_id: DEFAULT_PROJECT_ID,
      p_invitations: [{ scope: 'project', role: 'editor' }],
      p_confirm_entity: true
    });
    if (seedError) throw new Error(`create_invitations failed: ${seedError.message}`);
    const [row] = seeded as Array<{ id: string; code: string | null }>;
    if (!row?.id || !row.code) throw new Error('create_invitations returned no code invitation');
    invitationId = row.id;
    code = row.code;

    // Marked claimed by the user directly, so the group needs no mail: a used code is one whose row is claimed.
    const { error: claimError } = await service
      .from('invitations')
      .update({ claimed_by: userId, claimed_at: new Date().toISOString() })
      .eq('id', invitationId);
    if (claimError) throw new Error(`marking the invitation claimed failed: ${claimError.message}`);

    client = createServerClient<Database>(SUPABASE_URL, ANON_KEY, {
      cookies: {
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll: (cookies) => {
          cookieWrites.push(cookies.map(({ name }) => name));
          for (const { name, value } of cookies) {
            if (value) jar.set(name, value);
            else jar.delete(name);
          }
        }
      }
    });
    writer = new SupabaseDataWriter({ fetch, client, projectId: DEFAULT_PROJECT_ID });
  }, HANG_GUARD_MS);

  afterAll(async () => {
    if (!service) return;
    const failures = new Array<string>();

    if (invitationId) {
      const { error } = await service.from('invitations').delete().eq('id', invitationId);
      if (error) failures.push(`delete invitation: ${error.message}`);
    }
    if (userId) {
      const { error: grantError } = await service.from('grants').delete().eq('user_id', userId);
      if (grantError) failures.push(`delete grants: ${grantError.message}`);
      const { error } = await service.auth.admin.deleteUser(userId);
      if (error) failures.push(`delete user: ${error.message}`);
    }

    // Nothing the group created is left.
    if (invitationId) {
      const { count } = await service
        .from('invitations')
        .select('id', { count: 'exact', head: true })
        .eq('id', invitationId);
      if (count !== 0) failures.push(`${count} invitation(s) left`);
    }
    if (userId) {
      const { data } = await service.auth.admin.getUserById(userId);
      if (data?.user) failures.push('a user is left');
    }
    if (failures.length > 0) throw new Error(`The teardown left something behind: ${failures.join('; ')}`);
  }, HANG_GUARD_MS);

  it(
    'answers used for the code of a claimed invitation',
    async () => {
      expect(await writer.checkInvitationCode({ code })).toBe('used');
    },
    HANG_GUARD_MS
  );

  it(
    'refuses a code sign-in with a wrong password, and writes no cookie',
    async () => {
      const result = await writer.signInWithInvitationCode({ code, password: `not-${PASSWORD}` });

      expect(result).toStrictEqual({ type: 'failure' });
      expect(cookieWrites).toEqual([]);
      const {
        data: { session }
      } = await client.auth.getSession();
      expect(session).toBeNull();
    },
    HANG_GUARD_MS
  );

  it(
    'signs in with the code and the right password, and the session cookies are written when the call resolves',
    async () => {
      const result = await writer.signInWithInvitationCode({ code, password: PASSWORD });
      // Read with no wait after the call: the writes have happened by now or they are not part of the call.
      const writesWhenResolved = cookieWrites.length;

      expect(result).toStrictEqual({ type: 'success' });
      expect(writesWhenResolved).toBeGreaterThan(0);
      expect(cookieWrites.flat().every((name) => name.startsWith('sb-'))).toBe(true);

      const {
        data: { session }
      } = await client.auth.getSession();
      expect(session?.user.id).toBe(userId);

      // The next request holds only the cookies: a client reading nothing else is the signed-in user, verified by the auth service.
      const nextRequest = createServerClient<Database>(SUPABASE_URL, ANON_KEY, {
        cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: () => undefined }
      });
      const {
        data: { user }
      } = await nextRequest.auth.getUser();
      expect(user?.id).toBe(userId);
    },
    HANG_GUARD_MS
  );

  it(
    'claims nothing for that session, whose invitation is already claimed, and reports that the user has a password',
    async () => {
      expect(await writer.claimInvitations()).toStrictEqual({ claimed: [], skipped: [], passwordSet: true });
    },
    HANG_GUARD_MS
  );
});
