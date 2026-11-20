--------------------------------------------------------------------------------
-- The column that holds an election's nomination shape is named for it
--
-- WHAT IT CHANGES. The column of public.elections that holds an election's nomination shape takes the name of its type, nomination_shape. Its type, default, NOT NULL and position are unchanged. The three functions whose bodies read the column are replaced to read it by that name: public.validate_nomination, public.validate_nomination_parent_required and public.set_entity_nominations, and the refusal of public.validate_nomination names the election's nomination shape in those words. What each answers and refuses is unchanged.
--
-- WHAT IT LEAVES. Every other table, column, policy and function, and the signature, volatility, search_path and privileges of the three functions replaced.
--------------------------------------------------------------------------------
ALTER TABLE public.elections
RENAME COLUMN election_type TO nomination_shape;

--------------------------------------------------------------------------------
-- validate_nomination: enforce the nomination-shape rule, hierarchy and election/constituency consistency
--
-- Nomination-shape rule:
--   The row's entity type must be one its election's nomination shape admits, as `nomination_shape_rule` answers. A refusal is `Nomination shape refused: ...` with SQLSTATE 23514.
--   It binds every writer, on INSERT and on UPDATE: an entity's own editor, an admin, the service role and the owner of the tables alike. The function reads no role.
--   It is asked when a nomination is written. Nothing re-checks the nominations an election holds when its nomination shape is changed, so a later write of a row the new shape refuses is refused.
--   Whether a candidate that needs a parent has one is not asked here: `validate_nomination_parent_required` asks it when the transaction ends.
--
-- Hierarchy rules:
--   alliance    -> no parent allowed
--   organization -> parent must be alliance (or none for standalone)
--   faction     -> parent MUST be organization
--   candidate   -> parent must be organization or faction (or none for standalone)
--
-- Consistency rules:
--   The nomination's election and constituency must belong to the nomination's own project.
--   The nomination's constituency must be a constituency of its election: one a constituency group linked to the election holds. A refusal is `Nomination constituency <id> is no constituency of its election <id>` with SQLSTATE 23514. It binds every writer, as the nomination-shape rule does, and is asked on INSERT and on an UPDATE that changes the row's election or constituency. A stored nomination whose constituency is unlinked from its election later is not judged again until it is moved, so it can still be edited where it is.
--   If parent_nomination_id is set, election_id, constituency_id, and election_round must match the parent nomination. A round that is not stored is round 1 on either side.
--   A faction's parent must be the nomination of that faction's own organization, not merely of some organization. The exception names both organization ids.
--
-- SECURITY DEFINER with an empty search_path, because an entity user may insert nominations and cannot read every parent it may point at. Under invoker rights the parent lookup would run under that user's row-level security, and the `NOT FOUND` branch would report an unreadable parent as a missing one. 23-nominations-write.test.sql has an entity user insert a child under a parent that user cannot read.
--
-- The messages disclose whether a supplied identifier names a nomination, and of what type. That is accepted: the identifiers are unguessable UUIDs, so the disclosure needs knowledge that already implies access, and specific messages keep seed and import failures diagnosable.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_nomination () RETURNS TRIGGER SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  p_parent_type public.entity_type;
  p_parent_election_id uuid;
  p_parent_constituency_id uuid;
  p_parent_election_round integer;
  p_parent_organization_id uuid;
  p_child_type public.entity_type;
  p_faction_organization_id uuid;
  p_nomination_shape public.nomination_shape;
  p_shape_rule text;
  p_contest_judged boolean;
BEGIN
  -- Derive entity_type from the FK columns
  p_child_type := CASE
    WHEN NEW.candidate_id IS NOT NULL THEN 'candidate'::public.entity_type
    WHEN NEW.organization_id IS NOT NULL THEN 'organization'::public.entity_type
    WHEN NEW.faction_id IS NOT NULL THEN 'faction'::public.entity_type
    WHEN NEW.alliance_id IS NOT NULL THEN 'alliance'::public.entity_type
  END;

  -- Tenancy: the nomination's election and constituency must belong to the nomination's own project. The foreign keys name the rows, not their project, so without this an entity grantee of project A could write or move a nomination into project B's contest. Checked for every writer, admins and service_role included, because a cross-project nomination is corrupt data whoever wrote it. The entity's own project is checked by the entity write policies in 302-rls.sql, not here, because 07-rpc-security.test.sql builds a cross-project entity row as a negative control.
  IF NOT EXISTS (
    SELECT 1 FROM public.elections e WHERE e.id = NEW.election_id AND e.project_id = NEW.project_id
  ) THEN
    RAISE EXCEPTION 'Nomination election % does not belong to the nomination''s project %', NEW.election_id, NEW.project_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.constituencies c WHERE c.id = NEW.constituency_id AND c.project_id = NEW.project_id
  ) THEN
    RAISE EXCEPTION 'Nomination constituency % does not belong to the nomination''s project %', NEW.constituency_id, NEW.project_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- The nomination-shape rule: the matrix is asked with the entity type derived above, because the generated `entity_type` column is NULL in a BEFORE trigger. Only 'admitted' and 'parent_required' let the row through, so an answer of NULL is a refusal. Checked for every writer, as the tenancy rule above is, and before the return below, which would otherwise let every row without a parent pass unasked.
  SELECT e.nomination_shape INTO p_nomination_shape
  FROM public.elections e
  WHERE e.id = NEW.election_id;

  p_shape_rule := public.nomination_shape_rule(p_nomination_shape, p_child_type);

  IF p_shape_rule IS NULL OR p_shape_rule NOT IN ('admitted', 'parent_required') THEN
    RAISE EXCEPTION 'Nomination shape refused: % cannot be nominated in an election whose nomination shape is % (election %)',
      CASE
        WHEN p_child_type IS NULL THEN 'a row that names no entity'
        WHEN p_child_type IN ('organization', 'alliance') THEN 'an ' || p_child_type::text
        ELSE 'a ' || p_child_type::text
      END,
      p_nomination_shape,
      NEW.election_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- The constituency rule: the row's constituency must be held by a constituency group its election is linked to. Checked for every writer, an entity's editor, an admin, the service role and `bulk_import` alike, and before the return below, which would otherwise let every row without a parent pass unasked. An INSERT is judged, and an UPDATE only when it changes the row's election or constituency: a stored nomination that stays where it is is not judged again, so its editor can still edit it after its constituency is unlinked from its election.
  IF TG_OP = 'INSERT' THEN
    p_contest_judged := true;
  ELSE
    p_contest_judged := NEW.election_id IS DISTINCT FROM OLD.election_id
      OR NEW.constituency_id IS DISTINCT FROM OLD.constituency_id;
  END IF;

  IF p_contest_judged AND NOT EXISTS (
    SELECT 1
    FROM public.election_constituency_groups ecg
    JOIN public.constituency_group_constituencies cgc ON cgc.constituency_group_id = ecg.constituency_group_id
    WHERE ecg.election_id = NEW.election_id
      AND cgc.constituency_id = NEW.constituency_id
  ) THEN
    RAISE EXCEPTION 'Nomination constituency % is no constituency of its election %', NEW.constituency_id, NEW.election_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.parent_nomination_id IS NULL THEN
    -- Top-level: faction must have a parent
    IF p_child_type = 'faction' THEN
      RAISE EXCEPTION 'Faction nominations must have a parent organization nomination';
    END IF;
    RETURN NEW;
  END IF;

  -- Look up parent nomination
  SELECT
    CASE
      WHEN p.candidate_id IS NOT NULL THEN 'candidate'::public.entity_type
      WHEN p.organization_id IS NOT NULL THEN 'organization'::public.entity_type
      WHEN p.faction_id IS NOT NULL THEN 'faction'::public.entity_type
      WHEN p.alliance_id IS NOT NULL THEN 'alliance'::public.entity_type
    END,
    p.election_id,
    p.constituency_id,
    p.election_round,
    p.organization_id
  INTO p_parent_type, p_parent_election_id, p_parent_constituency_id, p_parent_election_round, p_parent_organization_id
  FROM public.nominations p
  WHERE p.id = NEW.parent_nomination_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent nomination % not found', NEW.parent_nomination_id;
  END IF;

  -- Validate parent-child entity type combination
  CASE p_child_type
    WHEN 'alliance' THEN
      RAISE EXCEPTION 'Alliance nominations cannot have a parent';
    WHEN 'organization' THEN
      IF p_parent_type != 'alliance' THEN
        RAISE EXCEPTION 'Organization nomination parent must be an alliance nomination, got %', p_parent_type;
      END IF;
    WHEN 'faction' THEN
      IF p_parent_type != 'organization' THEN
        RAISE EXCEPTION 'Faction nomination parent must be an organization nomination, got %', p_parent_type;
      END IF;
      -- The parent must be the nomination of the faction's own organization, not of any organization. The parent's organization comes from the SELECT ... INTO above; this reads the faction's.
      --
      -- The message names both organizations, so a seed log tells this failure apart from the parent-type error above; the two need different fixes.
      SELECT f.organization_id INTO p_faction_organization_id
      FROM public.factions f
      WHERE f.id = NEW.faction_id;

      IF p_faction_organization_id IS DISTINCT FROM p_parent_organization_id THEN
        RAISE EXCEPTION 'Faction nomination parent must be the nomination of the faction''s OWN organization (faction belongs to organization %, parent nomination carries organization %)',
          COALESCE(p_faction_organization_id::text, '(none)'),
          COALESCE(p_parent_organization_id::text, '(none)');
      END IF;
    WHEN 'candidate' THEN
      IF p_parent_type NOT IN ('organization', 'faction') THEN
        RAISE EXCEPTION 'Candidate nomination parent must be an organization or faction nomination, got %', p_parent_type;
      END IF;
  END CASE;

  -- Validate election/constituency/round consistency with parent
  IF NEW.election_id != p_parent_election_id THEN
    RAISE EXCEPTION 'Nomination election_id must match parent (expected %, got %)',
      p_parent_election_id, NEW.election_id;
  END IF;

  IF NEW.constituency_id != p_parent_constituency_id THEN
    RAISE EXCEPTION 'Nomination constituency_id must match parent (expected %, got %)',
      p_parent_constituency_id, NEW.constituency_id;
  END IF;

  IF COALESCE(NEW.election_round, 1) <> COALESCE(p_parent_election_round, 1) THEN
    RAISE EXCEPTION 'Nomination election_round must match parent (expected %, got %)',
      p_parent_election_round, NEW.election_round;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- validate_nomination_parent_required: a candidate that needs a parent has one when the transaction ends
--
-- The function of the constraint trigger `nominations_parent_required` (104-nominations.sql). Where `nomination_shape_rule` answers 'parent_required' for a candidate, the candidate's nomination must have a parent nomination or carry `requestedParentOrganization` in its custom data as a string that is not blank. A refusal is `Nomination parent required: ...` with SQLSTATE 23514.
--
-- It runs at the end of the transaction and not at the statement, so a writer may insert the candidate's row, then its party's row, then point the first at the second: only a row that is still without a parent when the transaction ends is refused.
--
-- It reads the row again by its id and never judges the row the queued event carries. The event carries the row as that statement wrote it, so judging it would refuse the three-statement order above. A row that is gone by then is not judged at all.
--
-- A function that must report the refusal inside its own call forces the constraint and puts it back before it returns: `SET CONSTRAINTS public.nominations_parent_required IMMEDIATE;` and then `SET CONSTRAINTS public.nominations_parent_required DEFERRED;`. While the constraint is immediate, a candidate's row without a parent is refused at its own statement, so the second statement is not optional.
--
-- SECURITY DEFINER with an empty search_path, as `validate_nomination` is: the re-read must find the row whatever row-level security the writer carries. The rule binds every writer, and the function reads no role.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_nomination_parent_required () RETURNS TRIGGER SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_candidate_id uuid;
  v_parent_nomination_id uuid;
  v_custom_data jsonb;
  v_election_id uuid;
  v_nomination_shape public.nomination_shape;
BEGIN
  -- Scalar variables, not a row of the table's type: this file is applied before the table exists, and a declaration is resolved when the function is created.
  SELECT n.candidate_id, n.parent_nomination_id, n.custom_data, n.election_id
  INTO v_candidate_id, v_parent_nomination_id, v_custom_data, v_election_id
  FROM public.nominations n
  WHERE n.id = NEW.id;

  IF NOT FOUND
     OR v_candidate_id IS NULL
     OR v_parent_nomination_id IS NOT NULL
     OR (
       jsonb_typeof(v_custom_data -> 'requestedParentOrganization') = 'string'
       AND (v_custom_data ->> 'requestedParentOrganization') ~ '[^[:space:]]'
     ) THEN
    RETURN NULL;
  END IF;

  SELECT e.nomination_shape INTO v_nomination_shape
  FROM public.elections e
  WHERE e.id = v_election_id;

  IF public.nomination_shape_rule(v_nomination_shape, 'candidate') = 'parent_required' THEN
    RAISE EXCEPTION 'Nomination parent required: candidate nomination % in election % has neither a parent nomination nor a requested parent organization',
      NEW.id, v_election_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- set_entity_nominations: write the whole set of nominations of ONE entity the caller edits, in one transaction
--
-- p_nominations states every nomination the candidate or organization named by p_entity_type and p_entity_id is to hold among the rows this function may write. The call inserts the nominations the set adds, updates the ones whose values differ, creates the nomination of a named party or alliance that has none at the contest, and deletes the ones the set leaves out. It is one statement of the caller's transaction, so either all of it is stored or none of it is.
--
-- SECURITY INVOKER: every statement runs as the caller, so the policies of public.nominations, its column grants and its triggers stay the only gate, and a direct write of the same rows meets the same refusals. The body holds one authority question, asked through `user_can` before anything is read: a caller that does not hold `nomination.edit` on the entity is refused with SQLSTATE 42501. While the entity's project's answers are locked (`private.project_answers_locked`), a caller that does not hold `project.edit_nominations` on the project is refused next, with SQLSTATE 42501 and `set_entity_nominations: answers are locked in this project`, whatever the set would write. search_path is pinned and every name in the body is schema-qualified.
--
-- p_expected_reach is the reach as the caller read it, the read its set was computed from: a JSON object that maps the id of every nomination in reach to its `updated_at`, as `get_entity_nominations` states both, and `{}` for an entity with none. It is required and is refused with SQLSTATE 22023 when it is not such an object. Right after the reach is read, before any object of the set is checked, the two are compared: a nomination in reach that the expectation does not name, an id it names that is no nomination in reach, and an `updated_at` that differs from the stored one each refuse the call with SQLSTATE 40001 and `set_entity_nominations: the nominations have changed since they were read`. A set computed from an older read therefore never deletes a nomination created since, and never writes back the values of one moved, edited or confirmed since. The reach is read without a lock, so a write committed by another transaction between that read and this call's own statements is not seen by the comparison.
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
-- The reach: the function writes only the nominations of the entity that the caller can read, whose election_round is their election's current_round, in an election for whose nomination shape `nomination_shape_rule` admits the entity's type. A round that is not stored, on either side, is round 1, as the application reads it. A nomination in reach that the set does not name is deleted. Every other nomination of the entity is neither updated nor deleted, and an `id` that names one is refused. A new nomination is written at its election's current_round, read here: the argument carries no round.
--
-- Several nominations of one election are accepted only where each names a stored row by `id`: an object without an `id` must be the only object of its election.
--
-- The order of the statements:
--   1. Delete the nominations in reach that the set does not name, and the stored row of every move. A changed constituency is a delete and an insert, never an update of the row's contest, so the foreign key on `parent_nomination_id` refuses to move, as it refuses to delete, a nomination that has nominations listed under it (SQLSTATE 23503). The new row of a move carries the symbol and the parent the object states and nothing else of the old row.
--   2. Update each kept nomination whose symbol, parent or requested name differs from what is stored, naming only the columns that differ, and the confirmation wherever the custom data is written. A nomination whose values did not change is not written, so it keeps its confirmation and its updated_at; `enforce_nomination_confirmation` turns the confirmation of every row an entity's editor does write off.
--   3. Insert each new nomination with no parent, and then link it.
-- For `entity`, the parent's nomination at the contest is asked of `private.parent_nomination_resolved`, which runs as the caller and reads the row through `private.nomination_id_in_contest`, because the caller's own policies do not let it read that row. Where there is none, the parent's nomination is inserted, unconfirmed and carrying nothing but its contest, and asked for again. The caller's own row comes first because `entity_insert_parent_nominations` admits a parent's row only to a caller that already holds a nomination at that contest. Two callers that create the same parent's nomination at once are not reconciled: the second call is refused whole on the uniqueness key and succeeds when it is made again.
--
-- The requested name lives in `custom_data.requestedParentOrganization`. The custom data is written by merging: `other` sets the key, `entity` and `none` remove it, and every other key is kept.
--
-- A nomination that carries a requested name cannot be confirmed, and `enforce_nomination_confirmation` judges that rule on the row as the statement writes it, before it turns an edited row's confirmation off. So every UPDATE that writes the custom data states the confirmation too: off where the custom data it writes carries a requested name, and as stored otherwise. A confirmed nomination can then be given a requested name, and is confirmed no longer.
--
-- Row-level security refuses an UPDATE and a DELETE without an error, by hiding the row: under the nominations lock such a statement affects no row. So the function reads how many rows each UPDATE and DELETE affected and raises SQLSTATE 42501 on a shortfall, and a caller is never answered that a locked or vanished row was saved. The rows in reach are read with no locking clause, because under the lock the update policy hides them from a locking read.
--
-- Where an election's nomination shape requires a candidate's nomination to have a parent or a requested name, `nominations_parent_required` judges it when the transaction ends. The function forces that constraint as its last statement and sets it back to deferred, so the refusal (SQLSTATE 23514) is raised inside the call, and no later statement of the transaction meets the constraint immediate. PostgreSQL offers no way to read a constraint's mode, so the function cannot restore the one it found: a caller that had set the constraint immediate finds it deferred after the call, for the rest of its transaction.
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
  p_expected_reach jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  c_requested constant text := 'requestedParentOrganization';
  c_unwritten constant text := 'set_entity_nominations: a nomination could not be written; nominations are locked or the rows are no longer the caller''s';
  v_project_id uuid;
  v_parent_type public.entity_type;
  v_reach jsonb;
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

  IF private.project_answers_locked(v_project_id)
     AND NOT COALESCE(public.user_can('project', v_project_id, 'project.edit_nominations'), false) THEN
    RAISE EXCEPTION 'set_entity_nominations: answers are locked in this project'
      USING ERRCODE = '42501';
  END IF;

  PERFORM private.nomination_list_checked(p_nominations, 'set_entity_nominations', 'p_nominations');

  IF jsonb_typeof(p_expected_reach) IS DISTINCT FROM 'object'
     OR EXISTS (
       SELECT 1
       FROM jsonb_each(p_expected_reach) AS x (key, value)
       WHERE (
         pg_input_is_valid(x.key, 'uuid')
         AND jsonb_typeof(x.value) = 'string'
         AND pg_input_is_valid(x.value #>> '{}', 'timestamptz')
       ) IS NOT TRUE
     ) THEN
    RAISE EXCEPTION 'set_entity_nominations: p_expected_reach must be a JSON object that maps each nomination id to its updated_at'
      USING ERRCODE = '22023';
  END IF;

  -- A candidate stands under an organization and an organization under an alliance.
  v_parent_type := CASE p_entity_type
    WHEN 'candidate' THEN 'organization'::public.entity_type
    ELSE 'alliance'::public.entity_type
  END;

  -- The reach, keyed by nomination id, read as the caller and with no locking clause.
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
  INTO v_reach
  FROM public.nominations n
  JOIN public.elections e ON e.id = n.election_id
  WHERE (
      (p_entity_type = 'candidate' AND n.candidate_id = p_entity_id)
      OR (p_entity_type = 'organization' AND n.organization_id = p_entity_id)
    )
    AND COALESCE(n.election_round, 1) = COALESCE(e.current_round, 1)
    AND public.nomination_shape_rule(e.nomination_shape, p_entity_type) IN ('admitted', 'parent_required');

  -- The reach the set was computed from must be the reach stored: the same ids, each last updated when the caller read it.
  IF EXISTS (
    SELECT 1
    FROM jsonb_each(v_reach) AS r (key, value)
    FULL JOIN jsonb_each_text(p_expected_reach) AS x (key, value) ON x.key::uuid = r.key::uuid
    WHERE r.key IS NULL
      OR x.key IS NULL
      OR (r.value ->> 'updated_at')::timestamptz IS DISTINCT FROM x.value::timestamptz
  ) THEN
    RAISE EXCEPTION 'set_entity_nominations: the nominations have changed since they were read'
      USING ERRCODE = '40001';
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

      v_stored := v_reach -> v_id::text;
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

  -- An object without an id must be the only object of its election.
  SELECT min((a.item ->> 'index')::bigint) INTO v_index
  FROM jsonb_array_elements(v_plan) AS a (item)
  WHERE a.item ->> 'id' IS NULL
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(v_plan) AS b (item)
      WHERE b.item ->> 'election_id' = a.item ->> 'election_id'
        AND (
          (b.item ->> 'index')::bigint < (a.item ->> 'index')::bigint
          OR ((b.item ->> 'index')::bigint > (a.item ->> 'index')::bigint AND b.item ->> 'id' IS NOT NULL)
        )
    );
  IF v_index IS NOT NULL THEN
    RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] is a new nomination in an election for which the set holds another object', v_index
      USING ERRCODE = '22023';
  END IF;

  -- 1. The rows in reach that the set does not keep: the ones it leaves out and the stored row of every move.
  SELECT COALESCE(array_agg(k.id), ARRAY[]::uuid[]) INTO v_delete_ids
  FROM (SELECT r.key::uuid AS id FROM jsonb_object_keys(v_reach) AS r (key)) k
  WHERE k.id <> ALL (v_kept_ids);

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
      v_stored := v_reach -> v_row_id::text;
      v_stored_symbol := v_stored ->> 'election_symbol';
      v_stored_parent := (v_stored ->> 'parent_nomination_id')::uuid;
      v_stored_custom := NULLIF(v_stored -> 'custom_data', 'null'::jsonb);
    END IF;

    -- What the row is to hold: `keep` leaves the parent and the custom data, `other` sets the requested name, and `entity` and `none` remove it. Every other key of the custom data is kept.
    IF v_kind = 'keep' THEN
      v_target_parent := v_stored_parent;
      v_target_custom := v_stored_custom;
    ELSIF v_kind = 'other' THEN
      v_target_parent := NULL;
      v_target_custom := CASE WHEN jsonb_typeof(v_stored_custom) = 'object' THEN v_stored_custom ELSE '{}'::jsonb END
        || jsonb_build_object(c_requested, v_name);
    ELSE
      v_target_parent := NULL;
      v_target_custom := CASE WHEN jsonb_typeof(v_stored_custom) = 'object' THEN v_stored_custom - c_requested ELSE v_stored_custom END;

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
  SET CONSTRAINTS public.nominations_parent_required IMMEDIATE;
  SET CONSTRAINTS public.nominations_parent_required DEFERRED;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'updated', v_updated,
    'deleted', v_deleted,
    'unchanged', v_unchanged,
    'parents_created', v_parents_created);
END;
$$;
