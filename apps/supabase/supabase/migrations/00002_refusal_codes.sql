--------------------------------------------------------------------------------
-- Each refusal a contestant's save tells apart has a SQLSTATE of its own
--
-- WHAT IT CHANGES. The refusals the Contestant App shows a message for raise codes no other error raises: OV001 for a changed name of a confirmed entity (public.enforce_entity_immutability), OV002 for a write while the project's contestant editing is `locked` (public.upsert_answers and public.set_entity_nominations), OV003 for a set computed from nominations that have changed since (public.set_entity_nominations), OV004 for one unconfirmed parent nomination more than a caller may originate (public.enforce_nomination_confirmation), OV005 for the removal or move of a nomination that others are listed under, which public.set_entity_nominations now asks private.nominations_listed_under, added here, before its delete, instead of meeting the foreign key, and OV006 for a write of nominations while the project's contestant editing is `nominationsLocked` (public.set_entity_nominations).
--
-- WHAT IT LEAVES. Every table and policy, every message text, and the signature, volatility, search_path and privileges of each function whose body is replaced.

--------------------------------------------------------------------------------
-- nominations_listed_under: is another nomination listed under one of these?
--
-- True when a nomination whose `parent_nomination_id` is one of p_ids exists and is not itself one of p_ids; false otherwise, and for a NULL or empty array. set_entity_nominations asks it before it deletes the given rows, so a delete the foreign key on `parent_nomination_id` would refuse is refused first, with a code of its own.
--
-- The nominations listed under a row are mostly other entities' rows, which the caller may not read, so the question cannot be asked as the caller. It says only whether such a row exists, never which, and only of the rows the caller is about to delete; the foreign key's own refusal would say as much.
--
-- `authenticated` alone holds EXECUTE: set_entity_nominations runs with its caller's rights, and the grant on the `private` schema above does not reach a function defined after it.
--
-- SECURITY DEFINER because row-level security hides other entities' nominations from the caller.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.nominations_listed_under (p_ids uuid[]) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations c
    WHERE c.parent_nomination_id = ANY (p_ids)
      AND c.id <> ALL (p_ids)
  );
$$;

REVOKE
EXECUTE ON FUNCTION private.nominations_listed_under (uuid[])
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.nominations_listed_under (uuid[]) TO authenticated;

--------------------------------------------------------------------------------
-- enforce_nomination_confirmation: the confirmation transition
--
-- Editing a nomination turns its confirmation off. The system sets the flag, so this is a trigger rather than a policy: a policy can refuse a row but cannot rewrite one. Three rules, in order:
--
--   1. On either verb, a row being confirmed while `nomination_requests_parent` holds for its custom_data is refused. A nomination with a NULL parent either stands on its own or waits for a parent that is not in the system yet, a party for a candidate and an alliance for an organization, and that key is the only difference. Confirming such a row would publish as standing on its own a nominee that asked for a parent.
--   2. On UPDATE, when the caller's effective database role is `authenticated` and the caller does not hold `nomination.confirm` on the row's project, an attempt to turn the flag on is refused by name, and any other edit has the flag forced off. The refusal is explicit so a client never believes an ignored request succeeded.
--   3. Otherwise the supplied value stands. That makes an admin's edit-and-confirm a single statement, and keeps a service-role re-seed from unconfirming every row it touches.
--
-- Rule 2 is scoped to the effective database role, not to "the caller has a token": PostgREST sets claims for the service role too, so a token test would make a second `yarn db:seed` unconfirm every row it upserted. 23-nominations-write.test.sql pins that behaviour (two seed runs, zero unconfirmed rows).
--
-- A project editor holds `nomination.edit` but not `nomination.confirm`, so its edits also turn confirmation off and only an admin can restore the flag. That is the review gate.
--
-- On INSERT it also repeats the policy cap on originated unconfirmed parent nominations, so the caller is told the limit. That refusal raises SQLSTATE OV004, a code no other refusal raises, so a client recognises it by the code alone.
--
-- SECURITY INVOKER, unlike validate_nomination: the role test must see the caller's effective role, which owner rights would replace. It reads no table directly; its authority questions go through `user_can` and the private cap-count helper.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_nomination_confirmation () RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  -- Rule 1: the free-text branch can never be confirmed, on either verb.
  IF NEW.confirmed
     AND public.nomination_requests_parent(NEW.custom_data) THEN
    RAISE EXCEPTION 'Nomination % cannot be confirmed while custom_data carries "requestedParentOrganization" (%): an admin must resolve the requested parent first, or confirming would publish as standing on its own a nominee who asked for a parent',
      COALESCE(NEW.id::text, '(new)'),
      NEW.custom_data ->> 'requestedParentOrganization';
  END IF;

  -- Rule 2: an entity user may edit, and editing unconfirms. Only a holder of nomination.confirm may turn the flag on, and an attempt to do so without it is refused rather than quietly dropped.
  IF TG_OP = 'UPDATE'
     AND current_user = 'authenticated'
     AND NOT public.user_can('project', NEW.project_id, 'nomination.confirm') THEN
    IF NEW.confirmed AND NOT OLD.confirmed THEN
      RAISE EXCEPTION 'Setting nomination % confirmed requires the nomination.confirm permission on project %; editing a nomination always turns its confirmation off',
        NEW.id, NEW.project_id;
    END IF;
    NEW.confirmed := false;
  END IF;

  -- The cap on originated unconfirmed parent nominations, at 10.
  --
  -- The `entity_insert_parent_nominations` policy enforces the cap, but a row-level security refusal names the policy and never the limit. A BEFORE INSERT trigger runs ahead of the policy's check, so this message, which names the limit, is the one the caller sees.
  --
  -- Scoped to the population the cap is about: an `authenticated` caller without `project.edit_nominations` inserting an unconfirmed nomination of an organization or of an alliance, the two kinds of row the count holds. Admins may create placeholder parents, and the service-role and owner paths run as other roles.
  IF TG_OP = 'INSERT'
     AND current_user = 'authenticated'
     AND NOT NEW.confirmed
     AND (NEW.organization_id IS NOT NULL OR NEW.alliance_id IS NOT NULL)
     AND NOT public.user_can('project', NEW.project_id, 'project.edit_nominations')
     AND private.caller_unconfirmed_originated_count() >= 10 THEN
    RAISE EXCEPTION 'A caller may originate at most 10 unconfirmed parent nominations; this caller already holds %. An administrator must confirm or reject some before more can be created.',
      private.caller_unconfirmed_originated_count()
      USING ERRCODE = 'OV004';
  END IF;

  -- Rule 3: the supplied value stands.
  RETURN NEW;
END;
$$;

--------------------------------------------------------------------------------
-- enforce_entity_immutability: the confirmation gate and the conditional identity freeze
--
-- A confirmed entity's name and short name are frozen for the entity user and stay correctable by a holder of `entity.edit_immutable`. That is a rule about the transition between two row states, which neither a column grant (one global pair per role, blind to the row) nor a policy (`USING` sees only OLD, `WITH CHECK` only NEW) can express. A BEFORE UPDATE row trigger sees both rows in one scope. It follows the shape of `enforce_external_id_immutability` in 500-external-id.sql: an OLD-row condition, an `IS DISTINCT FROM` comparison, a named exception carrying both values, and one body registered on several tables.
--
-- Two rules, in a fixed order:
--
--   1. The confirmation gate. A change to the confirmation flag, in either direction, by an `authenticated` caller who does not hold `entity.confirm` on the row is refused by name. Turning the flag off is refused too, because an entity user who could unconfirm could then rename.
--   2. The conditional freeze, read from the OLD row's flag. When the row was already confirmed before the statement, a change to any column named in TG_ARGV by an `authenticated` caller who does not hold `entity.edit_immutable` on the row is refused by name. Reading the OLD flag means a caller cannot unconfirm and rename in one statement, and because rule 1 runs first, such a statement is refused with the confirmation message.
--
-- The freeze is not absolute: on an unconfirmed row the entity user may still set their own name and short name, which the sign-up flow needs. 19-entity-immutability.test.sql asserts that outcome per protected column per table and pins the OLD-row guard on the function source.
--
-- Both rules bind only the effective `authenticated` role, as rule 2 of `enforce_nomination_confirmation` does. `user_can` reads the caller's rows of public.grants for `auth.uid()`, and the service role has no user id and so holds none, so an unscoped rule would refuse every re-seed, bulk import and pgTAP fixture write that changes a name or a confirmation flag. The cost is that the service role can rename a confirmed entity, the same latitude it has against row-level security and the column grants.
--
-- SECURITY INVOKER is required: a SECURITY DEFINER body reports the owner as `current_user`, so the role guard would never match and neither rule would bind.
--
-- The body names no entity type and no protected column. The protected columns arrive per registration in TG_ARGV and are compared through a JSONB projection of both rows, and the entity type is derived from TG_TABLE_NAME, so one body serves all four entity tables. The confirmation column is not a parameter: it has the same name on every entity table and is the subject of rule 1.
--
-- Each refusal starts with a stable prefix, so `throws_like` can match it and a seed log can tell the two apart. Both name the table, the row and both values; the immutability refusal also names the column, and its prefix says "name" for every protected column, the short name included. The immutability refusal raises SQLSTATE OV001, a code no other refusal raises, so a client recognises it by the code alone and never by its text.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_entity_immutability () RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_col text;
  v_old_row jsonb;
  v_new_row jsonb;
  v_entity_type public.entity_type;
BEGIN
  -- The role guard. Everything below binds the effective `authenticated` role and nothing else.
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  -- The row's entity type, which every entity-scope authority question names together with the id. It is the table's name without its plural s, the naming the four entity tables share; a table outside that naming fails the cast, so the update raises rather than being decided without a type.
  v_entity_type := left(TG_TABLE_NAME, -1)::public.entity_type;

  -- Rule 1: the confirmation gate, in both directions.
  IF NEW.confirmed IS DISTINCT FROM OLD.confirmed
     AND NOT public.user_can('entity', NEW.id, 'entity.confirm', v_entity_type) THEN
    RAISE EXCEPTION 'Entity confirmation requires the entity.confirm permission: %.% row % cannot change its confirmation flag (current: %, attempted: %)',
      TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.id, OLD.confirmed, NEW.confirmed;
  END IF;

  -- Rule 2: the conditional freeze, guarded on the OLD row's flag.
  IF OLD.confirmed THEN
    v_old_row := to_jsonb(OLD);
    v_new_row := to_jsonb(NEW);
    FOR i IN 0 .. TG_NARGS - 1 LOOP
      v_col := TG_ARGV[i];
      IF (v_old_row ->> v_col) IS DISTINCT FROM (v_new_row ->> v_col)
         AND NOT public.user_can('entity', NEW.id, 'entity.edit_immutable', v_entity_type) THEN
        RAISE EXCEPTION 'Entity name is immutable once confirmed: column %.%.% on row % cannot be changed (current: %, attempted: %); changing it requires the entity.edit_immutable permission',
          TG_TABLE_SCHEMA, TG_TABLE_NAME, v_col, NEW.id,
          COALESCE(v_old_row ->> v_col, '(none)'), COALESCE(v_new_row ->> v_col, '(none)')
          USING ERRCODE = 'OV001';
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

--------------------------------------------------------------------------------
-- upsert_answers: atomic answer write for a single entity
--
-- The entity is named by its type and id together, because the entity tables have independent primary keys and one UUID can name a candidate and an organization at once. The type selects the one table written: 'candidate' writes public.candidates and 'organization' writes public.organizations, the only two tables carrying an answers column. Any other type, and a NULL type, raises before any table is written.
--
-- p_overwrite = true replaces the stored answers with p_answers; otherwise p_answers is merged over them. Either way, keys whose value is JSON null are dropped.
--
-- SECURITY INVOKER: the UPDATE is gated by the named table's RLS policies, so a caller can update only the answers of an entity those policies let them edit. An id that matches no row the caller may update raises the not-found exception.
--
-- While the entity's project's contestant editing is `locked` (`private.project_contestant_editing`), a caller that does not hold `project.edit_entities` on the project is refused before any table is written, with SQLSTATE OV002 and `upsert_answers: answers are locked in this project`. OV002 is raised for the contestant-editing lock alone, so a client tells the lock apart from a row the caller may not write by the code. The entity's project is read as the caller: an entity the caller cannot read is not judged here and meets the not-found exception.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_answers (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_answers jsonb,
  p_overwrite boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  p_updated_answers jsonb;
  v_project_id uuid;
BEGIN
  v_project_id := CASE p_entity_type
    WHEN 'candidate' THEN (SELECT c.project_id FROM public.candidates c WHERE c.id = p_entity_id)
    WHEN 'organization' THEN (SELECT o.project_id FROM public.organizations o WHERE o.id = p_entity_id)
  END;

  IF v_project_id IS NOT NULL
     AND private.project_contestant_editing(v_project_id) = 'locked'
     AND NOT COALESCE(public.user_can('project', v_project_id, 'project.edit_entities'), false) THEN
    RAISE EXCEPTION 'upsert_answers: answers are locked in this project'
      USING ERRCODE = 'OV002';
  END IF;

  CASE p_entity_type
    WHEN 'candidate' THEN
      UPDATE public.candidates
      SET answers = (
        SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
        FROM jsonb_each(
          CASE WHEN p_overwrite THEN '{}'::jsonb ELSE COALESCE(public.candidates.answers, '{}'::jsonb) END
          || COALESCE(p_answers, '{}'::jsonb)
        ) AS t(k, v)
        WHERE v IS NOT NULL AND v != 'null'::jsonb
      )
      WHERE id = p_entity_id
      RETURNING public.candidates.answers INTO p_updated_answers;
    WHEN 'organization' THEN
      UPDATE public.organizations
      SET answers = (
        SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
        FROM jsonb_each(
          CASE WHEN p_overwrite THEN '{}'::jsonb ELSE COALESCE(public.organizations.answers, '{}'::jsonb) END
          || COALESCE(p_answers, '{}'::jsonb)
        ) AS t(k, v)
        WHERE v IS NOT NULL AND v != 'null'::jsonb
      )
      WHERE id = p_entity_id
      RETURNING public.organizations.answers INTO p_updated_answers;
    ELSE
      RAISE EXCEPTION 'Entity type % has no answers', p_entity_type;
  END CASE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entity not found or access denied: %', p_entity_id;
  END IF;

  RETURN p_updated_answers;
END;
$$;

GRANT
EXECUTE ON FUNCTION public.upsert_answers (public.entity_type, uuid, jsonb, boolean) TO authenticated;

--------------------------------------------------------------------------------
-- set_entity_nominations: write the whole set of nominations of ONE entity the caller edits, in one transaction
--
-- p_nominations states every nomination the candidate or organization named by p_entity_type and p_entity_id is to hold among the rows this function may write. The call inserts the nominations the set adds, updates the ones whose values differ, creates the nomination of a named party or alliance that has none at the contest, and deletes the ones the set leaves out. It is one statement of the caller's transaction, so either all of it is stored or none of it is.
--
-- SECURITY INVOKER: every statement runs as the caller, so the policies of public.nominations, its column grants and its triggers stay the only gate, and a direct write of the same rows meets the same refusals. The body holds one authority question, asked through `user_can` before anything is read: a caller that does not hold `nomination.edit` on the entity is refused with SQLSTATE 42501. While the entity's project's contestant editing (`private.project_contestant_editing`) is anything but `open`, a caller that does not hold `project.edit_nominations` on the project is refused next, whatever the set would write: under `locked` with SQLSTATE OV002 and `set_entity_nominations: editing is locked in this project`, and under `nominationsLocked` with SQLSTATE OV006 and `set_entity_nominations: nominations are locked in this project`. Each code is raised for its lock alone, so a client tells the two locks apart, and either from a row the caller may not write, by the code. search_path is pinned and every name in the body is schema-qualified.
--
-- p_expected_versions is the writable nominations as the caller read them, the read its set was computed from: a JSON object that maps the id of every writable nomination to its `updated_at`, as `get_entity_nominations` states both on the nominations whose `writable` is true, and `{}` for an entity with none. It is required and is refused with SQLSTATE 22023 when it is not such an object. Right after the writable nominations are read, before any object of the set is checked, the two are compared: a writable nomination that the expectation does not name, an id it names that is no writable nomination, and an `updated_at` that differs from the stored one each refuse the call with SQLSTATE OV003 and `set_entity_nominations: the nominations have changed since they were read`. A set computed from an older read therefore never deletes a nomination created since, and never writes back the values of one moved, edited or confirmed since. The writable nominations are read without a lock, so a write committed by another transaction between that read and this call's own statements is not seen by the comparison.
--
-- p_nominations is a JSON array of objects, and an empty array is a valid set. The keys of one object:
--   id              - a uuid: the object describes that nomination of the entity. Absent: it describes a new one.
--   election_id     - a uuid, required. With `id` it must be the stored row's.
--   constituency_id - a uuid, required. With `id`, a value other than the stored one moves the nomination.
--   election_symbol - a string or null. It is trimmed; a blank one is stored as NULL, and one longer than 50 characters is refused.
--   parent          - an object with a `kind`: `none` (no parent and no requested name), `entity` with `entity_type` and `entity_id` (stand under that organization's or alliance's nomination at the contest), `other` with `name` (store the name of a parent that is not in the system and link nothing) or `keep` (leave the row's parent and requested name as they are; only with an `id`, and not on a move).
-- Any other key is not read. A candidate names an organization and an organization an alliance. The name of `other` is trimmed, must not be blank and may hold at most 100 characters. Trimming removes leading and trailing white space of any kind, lengths are counted in characters, and a submitted value is compared with a stored one by exact equality after the trim.
--
-- A malformed argument or object is refused with SQLSTATE 22023 and a message that begins `set_entity_nominations: ` and, for an object, names it as `p_nominations[<index>]`, counted from zero. The whole argument is validated before anything is written. The array is checked by `private.nomination_list_checked` and the shape of each object by `private.nomination_object_checked`, which state those rules for every writer of nominations; the checks that read rows follow each object's shape check.
--
-- An object's constituency must be one of its election's constituencies, a constituency of a constituency group the election is linked to. The nomination trigger `validate_nomination` judges every new or moved nomination by that rule, for this function as for every writer, and refuses one at any other constituency with SQLSTATE 23514 when the row is inserted; a stored nomination that stays in its constituency is not judged again.
--
-- An array of more than 1000 nominations is refused before any object is read. A parent that is no entity of the entity's project, or an id that names no entity, is refused with SQLSTATE 22023 when the parent is resolved, so nothing the call wrote before it is stored.
--
-- The writable nominations: the function writes only the nominations of the entity that the caller can read and for which `private.nomination_writable` holds, those at their election's current round in an election whose nomination shape admits the entity's type. A writable nomination that the set does not name is deleted. Every other nomination of the entity is neither updated nor deleted, and an `id` that names one is refused. A new nomination is written at its election's current_round, read here: the argument carries no round.
--
-- An entity may hold several nominations of one election, at different constituencies or under different parents. The set holds them as it holds any others; what bounds them is the uniqueness key `nominations_entity_parent_contest_key`, which refuses a second nomination of the entity under the same parent at the same contest (SQLSTATE 23505), and the contest rules `validate_nomination` judges.
--
-- The order of the statements:
--   1. Delete the writable nominations that the set does not name, and the stored row of every move. A changed constituency is a delete and an insert, never an update of the row's contest, so a nomination that has nominations listed under it can be neither moved nor deleted. Before the delete, `private.nominations_listed_under` is asked whether any row to be deleted has such a nomination, and the call is then refused with SQLSTATE OV005, so the foreign key on `parent_nomination_id` is not what refuses it. The new row of a move carries the symbol and the parent the object states and nothing else of the old row.
--   2. Update each kept nomination whose symbol, parent or requested name differs from what is stored, naming only the columns that differ, and the confirmation wherever the custom data is written. A nomination whose values did not change is not written, so it keeps its confirmation and its updated_at; `enforce_nomination_confirmation` turns the confirmation of every row an entity's editor does write off.
--   3. Insert each new nomination with no parent, and then link it.
-- For `entity`, the parent's nomination at the contest is asked of `private.parent_nomination_resolved`, which runs as the caller and reads the row through `private.nomination_id_in_contest`, because the caller's own policies do not let it read that row. Where there is none, the parent's nomination is inserted, unconfirmed and carrying nothing but its contest, and asked for again. The caller's own row comes first because `entity_insert_parent_nominations` admits a parent's row only to a caller that already holds a nomination at that contest. Two callers that create the same parent's nomination at once are not reconciled: the second call is refused whole on the uniqueness key and succeeds when it is made again.
--
-- The requested name lives in `custom_data.requestedParentOrganization`. The custom data is written by merging, as `private.nomination_parent_target` states: `other` sets the key, `entity` and `none` remove it, and every other key is kept.
--
-- A nomination that carries a requested name cannot be confirmed, and `enforce_nomination_confirmation` judges that rule on the row as the statement writes it, before it turns an edited row's confirmation off. So every UPDATE that writes the custom data states the confirmation too: off where the custom data it writes carries a requested name, and as stored otherwise. A confirmed nomination can then be given a requested name, and is confirmed no longer.
--
-- Row-level security refuses an UPDATE and a DELETE without an error, by hiding the row: under the nominations lock such a statement affects no row. So the function reads how many rows each UPDATE and DELETE affected and raises SQLSTATE 42501 on a shortfall, and a caller is never answered that a locked or vanished row was saved. The writable rows are read with no locking clause, because under the lock the update policy hides them from a locking read.
--
-- Where an election's nomination shape requires a candidate's nomination to have a parent or a requested name, `validate_nomination_parent_required` judges it when the transaction ends. The function forces that constraint as its last statement and sets it back to deferred, so the refusal (SQLSTATE 23514) is raised inside the call, and no later statement of the transaction meets the constraint immediate. PostgreSQL offers no way to read a constraint's mode, so the function cannot restore the one it found: a caller that had set the constraint immediate finds it deferred after the call, for the rest of its transaction.
--
-- Returns `{"inserted", "updated", "deleted", "unchanged", "parents_created"}`, each a count of nominations. A move counts once under `deleted` and once under `inserted`; a nomination that is inserted and then linked counts once, under `inserted`; `parents_created` counts the nominations created for a party or an alliance.
--
-- A move leaves behind the nomination that an earlier call created for the parent at the old contest: it is not the caller's row, and the caller may not delete it.
--
-- 43-set-entity-nominations.test.sql asserts each rule above.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_entity_nominations (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_nominations jsonb,
  p_expected_versions jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  c_requested constant text := 'requestedParentOrganization';
  c_unwritten constant text := 'set_entity_nominations: a nomination could not be written; nominations are locked or the rows are no longer the caller''s';
  v_project_id uuid;
  v_parent_type public.entity_type;
  v_contestant_editing text;
  v_writable jsonb;
  v_plan jsonb := '[]'::jsonb;
  v_item jsonb;
  v_ordinality bigint;
  v_index bigint;
  v_checked jsonb;
  v_stored jsonb;
  v_id uuid;
  v_election_id uuid;
  v_constituency_id uuid;
  v_round integer;
  v_symbol text;
  v_kind text;
  v_parent_entity_id uuid;
  v_name text;
  v_is_new boolean;
  v_named_ids uuid[] := ARRAY[]::uuid[];
  v_kept_ids uuid[] := ARRAY[]::uuid[];
  v_delete_ids uuid[];
  v_rows bigint;
  v_row_id uuid;
  v_stored_symbol text;
  v_stored_parent uuid;
  v_stored_custom jsonb;
  v_target_parent uuid;
  v_target_custom jsonb;
  v_symbol_differs boolean;
  v_parent_differs boolean;
  v_custom_differs boolean;
  v_parent_created boolean;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_deleted integer := 0;
  v_unchanged integer := 0;
  v_parents_created integer := 0;
BEGIN
  IF p_entity_type IS NULL OR p_entity_id IS NULL OR p_nominations IS NULL THEN
    RAISE EXCEPTION 'set_entity_nominations: p_entity_type, p_entity_id and p_nominations must each be stated'
      USING ERRCODE = '22023';
  END IF;

  IF p_entity_type NOT IN ('candidate', 'organization') THEN
    RAISE EXCEPTION 'set_entity_nominations: p_entity_type must be candidate or organization'
      USING ERRCODE = '22023';
  END IF;

  v_project_id := private.entity_project_id(p_entity_type, p_entity_id);

  IF v_project_id IS NULL
     OR NOT COALESCE(public.user_can('entity', p_entity_id, 'nomination.edit', p_entity_type), false) THEN
    RAISE EXCEPTION 'set_entity_nominations: the caller does not hold nomination.edit on the named entity'
      USING ERRCODE = '42501';
  END IF;

  v_contestant_editing := private.project_contestant_editing(v_project_id);
  IF v_contestant_editing <> 'open'
     AND NOT COALESCE(public.user_can('project', v_project_id, 'project.edit_nominations'), false) THEN
    RAISE EXCEPTION USING
      MESSAGE = CASE v_contestant_editing
        WHEN 'nominationsLocked' THEN 'set_entity_nominations: nominations are locked in this project'
        ELSE 'set_entity_nominations: editing is locked in this project'
      END,
      ERRCODE = CASE v_contestant_editing WHEN 'nominationsLocked' THEN 'OV006' ELSE 'OV002' END;
  END IF;

  PERFORM private.nomination_list_checked(p_nominations, 'set_entity_nominations', 'p_nominations');

  IF jsonb_typeof(p_expected_versions) IS DISTINCT FROM 'object'
     OR EXISTS (
       SELECT 1
       FROM jsonb_each(p_expected_versions) AS x (key, value)
       WHERE (
         pg_input_is_valid(x.key, 'uuid')
         AND jsonb_typeof(x.value) = 'string'
         AND pg_input_is_valid(x.value #>> '{}', 'timestamptz')
       ) IS NOT TRUE
     ) THEN
    RAISE EXCEPTION 'set_entity_nominations: p_expected_versions must be a JSON object that maps each nomination id to its updated_at'
      USING ERRCODE = '22023';
  END IF;

  -- A candidate stands under an organization and an organization under an alliance.
  v_parent_type := CASE p_entity_type
    WHEN 'candidate' THEN 'organization'::public.entity_type
    ELSE 'alliance'::public.entity_type
  END;

  -- The writable nominations, keyed by nomination id, read as the caller and with no locking clause.
  SELECT COALESCE(
    jsonb_object_agg(
      n.id::text,
      jsonb_build_object(
        'election_id', n.election_id,
        'constituency_id', n.constituency_id,
        'election_symbol', n.election_symbol,
        'parent_nomination_id', n.parent_nomination_id,
        'custom_data', n.custom_data,
        'updated_at', n.updated_at)),
    '{}'::jsonb)
  INTO v_writable
  FROM public.nominations n
  JOIN public.elections e ON e.id = n.election_id
  WHERE (
      (p_entity_type = 'candidate' AND n.candidate_id = p_entity_id)
      OR (p_entity_type = 'organization' AND n.organization_id = p_entity_id)
    )
    AND private.nomination_writable(n, e, p_entity_type);

  -- The writable nominations the set was computed from must be the ones stored: the same ids, each last updated when the caller read it.
  IF EXISTS (
    SELECT 1
    FROM jsonb_each(v_writable) AS r (key, value)
    FULL JOIN jsonb_each_text(p_expected_versions) AS x (key, value) ON x.key::uuid = r.key::uuid
    WHERE r.key IS NULL
      OR x.key IS NULL
      OR (r.value ->> 'updated_at')::timestamptz IS DISTINCT FROM x.value::timestamptz
  ) THEN
    RAISE EXCEPTION 'set_entity_nominations: the nominations have changed since they were read'
      USING ERRCODE = 'OV003';
  END IF;

  -- Validate every object before anything is written, and note what each one asks for.
  FOR v_item, v_ordinality IN
    SELECT t.item, t.ordinality
    FROM jsonb_array_elements(p_nominations) WITH ORDINALITY AS t (item, ordinality)
  LOOP
    v_index := v_ordinality - 1;

    -- The shape of the object, then the checks that read rows.
    v_checked := private.nomination_object_checked(
      v_item, v_parent_type, 'set_entity_nominations', format('p_nominations[%s]', v_index));
    v_id := (v_checked ->> 'id')::uuid;
    v_election_id := (v_checked ->> 'election_id')::uuid;
    v_constituency_id := (v_checked ->> 'constituency_id')::uuid;
    v_symbol := v_checked ->> 'symbol';
    v_kind := v_checked ->> 'kind';
    v_parent_entity_id := (v_checked ->> 'parent_entity_id')::uuid;
    v_name := v_checked ->> 'name';

    v_stored := NULL;
    v_is_new := true;
    IF v_id IS NOT NULL THEN
      IF v_id = ANY (v_named_ids) THEN
        RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] names an id that another object of the set names', v_index
          USING ERRCODE = '22023';
      END IF;
      v_named_ids := v_named_ids || v_id;

      v_stored := v_writable -> v_id::text;
      IF v_stored IS NULL THEN
        RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] names an id that is no nomination of the entity this function may write', v_index
          USING ERRCODE = '22023';
      END IF;

      IF (v_stored ->> 'election_id')::uuid <> v_election_id THEN
        RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] names an election_id other than its nomination''s', v_index
          USING ERRCODE = '22023';
      END IF;

      -- A changed constituency is a move: the stored row is deleted and a new one inserted.
      v_is_new := (v_stored ->> 'constituency_id')::uuid <> v_constituency_id;
      IF NOT v_is_new THEN
        v_kept_ids := v_kept_ids || v_id;
      END IF;
    END IF;

    SELECT e.current_round INTO v_round
    FROM public.elections e
    WHERE e.id = v_election_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] names an election_id that is no election the caller can read', v_index
        USING ERRCODE = '22023';
    END IF;

    IF v_kind = 'keep' AND v_is_new THEN
      RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] keeps a parent, which only an object that names an id and does not change its constituency may', v_index
        USING ERRCODE = '22023';
    END IF;

    v_plan := v_plan || jsonb_build_object(
      'index', v_index,
      'id', v_id,
      'new', v_is_new,
      'election_id', v_election_id,
      'constituency_id', v_constituency_id,
      'round', v_round,
      'symbol', v_symbol,
      'kind', v_kind,
      'parent_entity_id', v_parent_entity_id,
      'name', v_name);
  END LOOP;

  -- 1. The writable rows that the set does not keep: the ones it leaves out and the stored row of every move.
  SELECT COALESCE(array_agg(k.id), ARRAY[]::uuid[]) INTO v_delete_ids
  FROM (SELECT r.key::uuid AS id FROM jsonb_object_keys(v_writable) AS r (key)) k
  WHERE k.id <> ALL (v_kept_ids);

  IF private.nominations_listed_under(v_delete_ids) THEN
    RAISE EXCEPTION 'set_entity_nominations: a nomination the set removes or moves has other nominations listed under it'
      USING ERRCODE = 'OV005';
  END IF;

  IF cardinality(v_delete_ids) > 0 THEN
    DELETE FROM public.nominations n
    WHERE n.id = ANY (v_delete_ids);
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> cardinality(v_delete_ids) THEN
      RAISE EXCEPTION USING MESSAGE = c_unwritten, ERRCODE = '42501';
    END IF;
    v_deleted := cardinality(v_delete_ids);
  END IF;

  -- 2 and 3. The kept rows first, then the new ones, each in the order of the set.
  FOR v_item IN
    SELECT t.item
    FROM jsonb_array_elements(v_plan) AS t (item)
    ORDER BY (t.item ->> 'new')::boolean, (t.item ->> 'index')::bigint
  LOOP
    v_is_new := (v_item ->> 'new')::boolean;
    v_election_id := (v_item ->> 'election_id')::uuid;
    v_constituency_id := (v_item ->> 'constituency_id')::uuid;
    v_round := (v_item ->> 'round')::integer;
    v_symbol := v_item ->> 'symbol';
    v_kind := v_item ->> 'kind';
    v_parent_entity_id := (v_item ->> 'parent_entity_id')::uuid;
    v_name := v_item ->> 'name';

    IF v_is_new THEN
      -- The caller's own row, with no parent. Its id is the caller's to read.
      v_stored_symbol := v_symbol;
      v_stored_parent := NULL;
      v_stored_custom := CASE WHEN v_kind = 'other' THEN jsonb_build_object(c_requested, v_name) END;

      INSERT INTO public.nominations (
        project_id, candidate_id, organization_id,
        election_id, constituency_id, election_round, election_symbol, custom_data
      )
      VALUES (
        v_project_id,
        CASE WHEN p_entity_type = 'candidate' THEN p_entity_id END,
        CASE WHEN p_entity_type = 'organization' THEN p_entity_id END,
        v_election_id, v_constituency_id, v_round, v_stored_symbol, v_stored_custom
      )
      RETURNING id INTO v_row_id;
      v_inserted := v_inserted + 1;
    ELSE
      v_row_id := (v_item ->> 'id')::uuid;
      v_stored := v_writable -> v_row_id::text;
      v_stored_symbol := v_stored ->> 'election_symbol';
      v_stored_parent := (v_stored ->> 'parent_nomination_id')::uuid;
      v_stored_custom := NULLIF(v_stored -> 'custom_data', 'null'::jsonb);
    END IF;

    -- What the row is to hold for the parent's kind.
    SELECT t.parent_nomination_id, t.custom_data
    INTO v_target_parent, v_target_custom
    FROM private.nomination_parent_target(v_kind, v_stored_parent, v_stored_custom, v_name) AS t;

    IF v_kind = 'entity' THEN
      -- The parent's nomination at the contest, created where it holds none.
      SELECT r.nomination_id, r.created
      INTO v_target_parent, v_parent_created
      FROM private.parent_nomination_resolved(
        v_project_id, v_parent_type, v_parent_entity_id, v_election_id, v_constituency_id, v_round,
        'set_entity_nominations', format('p_nominations[%s]', v_item ->> 'index')) AS r;

      IF v_parent_created THEN
        v_parents_created := v_parents_created + 1;
      END IF;
      IF v_target_parent IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = c_unwritten, ERRCODE = '42501';
      END IF;
    END IF;

    v_symbol_differs := v_symbol IS DISTINCT FROM v_stored_symbol;
    v_parent_differs := v_target_parent IS DISTINCT FROM v_stored_parent;
    v_custom_differs := v_target_custom IS DISTINCT FROM v_stored_custom;

    IF NOT (v_symbol_differs OR v_parent_differs OR v_custom_differs) THEN
      IF NOT v_is_new THEN
        v_unchanged := v_unchanged + 1;
      END IF;
      CONTINUE;
    END IF;

    -- One statement, naming only the columns that differ, and the confirmation wherever the custom data is written.
    IF v_symbol_differs AND v_parent_differs AND v_custom_differs THEN
      UPDATE public.nominations
      SET election_symbol = v_symbol, parent_nomination_id = v_target_parent, custom_data = v_target_custom,
          confirmed = confirmed AND NOT COALESCE(v_target_custom ? c_requested, false)
      WHERE id = v_row_id;
    ELSIF v_symbol_differs AND v_parent_differs THEN
      UPDATE public.nominations
      SET election_symbol = v_symbol, parent_nomination_id = v_target_parent
      WHERE id = v_row_id;
    ELSIF v_symbol_differs AND v_custom_differs THEN
      UPDATE public.nominations
      SET election_symbol = v_symbol, custom_data = v_target_custom,
          confirmed = confirmed AND NOT COALESCE(v_target_custom ? c_requested, false)
      WHERE id = v_row_id;
    ELSIF v_parent_differs AND v_custom_differs THEN
      UPDATE public.nominations
      SET parent_nomination_id = v_target_parent, custom_data = v_target_custom,
          confirmed = confirmed AND NOT COALESCE(v_target_custom ? c_requested, false)
      WHERE id = v_row_id;
    ELSIF v_symbol_differs THEN
      UPDATE public.nominations
      SET election_symbol = v_symbol
      WHERE id = v_row_id;
    ELSIF v_parent_differs THEN
      UPDATE public.nominations
      SET parent_nomination_id = v_target_parent
      WHERE id = v_row_id;
    ELSE
      UPDATE public.nominations
      SET custom_data = v_target_custom,
          confirmed = confirmed AND NOT COALESCE(v_target_custom ? c_requested, false)
      WHERE id = v_row_id;
    END IF;

    -- A row that row-level security hides is not an error and not a target: zero rows.
    IF NOT FOUND THEN
      RAISE EXCEPTION USING MESSAGE = c_unwritten, ERRCODE = '42501';
    END IF;

    IF NOT v_is_new THEN
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  -- Raise the end-of-transaction parent rule inside this call, and leave the constraint deferred.
  SET CONSTRAINTS public.validate_nomination_parent_required IMMEDIATE;
  SET CONSTRAINTS public.validate_nomination_parent_required DEFERRED;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'updated', v_updated,
    'deleted', v_deleted,
    'unchanged', v_unchanged,
    'parents_created', v_parents_created);
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.set_entity_nominations (public.entity_type, uuid, jsonb, jsonb)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.set_entity_nominations (public.entity_type, uuid, jsonb, jsonb) TO authenticated;
-- Admin RPC functions
--
-- Functions:
-- - merge_question_custom_data() - shallow JSONB merge on questions.custom_data
