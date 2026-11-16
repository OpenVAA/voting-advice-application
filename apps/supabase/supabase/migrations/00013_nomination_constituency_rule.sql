--------------------------------------------------------------------------------
-- validate_nomination: enforce the election-type rule, hierarchy and election/constituency consistency
--
-- Election-type rule:
--   The row's entity type must be one its election's type admits, as `nomination_shape_rule` answers. A refusal is `Nomination shape refused: ...` with SQLSTATE 23514.
--   It binds every writer, on INSERT and on UPDATE: an entity's own editor, an admin, the service role and the owner of the tables alike. The function reads no role.
--   It is asked when a nomination is written. Nothing re-checks the nominations an election holds when its type is changed, so a later write of a row the new type refuses is refused.
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
--   The nomination's constituency must be a constituency of its election: one a constituency group linked to the election holds. A refusal is `Nomination constituency <id> is no constituency of its election <id>` with SQLSTATE 23514. It binds every writer, as the election-type rule does, and is asked on INSERT and on an UPDATE that changes the row's election or constituency. A stored nomination whose constituency is unlinked from its election later is not judged again until it is moved, so it can still be edited where it is.
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
  p_election_type public.nomination_shape;
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

  -- The election-type rule: the matrix is asked with the entity type derived above, because the generated `entity_type` column is NULL in a BEFORE trigger. Only 'admitted' and 'parent_required' let the row through, so an answer of NULL is a refusal. Checked for every writer, as the tenancy rule above is, and before the return below, which would otherwise let every row without a parent pass unasked.
  SELECT e.election_type INTO p_election_type
  FROM public.elections e
  WHERE e.id = NEW.election_id;

  p_shape_rule := public.nomination_shape_rule(p_election_type, p_child_type);

  IF p_shape_rule IS NULL OR p_shape_rule NOT IN ('admitted', 'parent_required') THEN
    RAISE EXCEPTION 'Nomination shape refused: % cannot be nominated in an election of type % (election %)',
      CASE
        WHEN p_child_type IS NULL THEN 'a row that names no entity'
        WHEN p_child_type IN ('organization', 'alliance') THEN 'an ' || p_child_type::text
        ELSE 'a ' || p_child_type::text
      END,
      p_election_type,
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
