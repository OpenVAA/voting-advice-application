--------------------------------------------------------------------------------
-- Answers lock: an entity's own editor cannot change the entity's row while its project's answers are locked
--
-- WHAT IT ADDS. `private.project_answers_locked`, which reads the app setting `access.answersLocked` as `private.project_nominations_locked` reads `access.nominationsLocked`, a conjunct of it on the four entity self-update policies, and a refusal of it in `upsert_answers` for a caller without `project.edit_entities` on the entity's project.
--
-- WHAT IT LEAVES. Every project-, account- and global-scope policy: a project editor and a project admin write the same rows while answers are locked.
--
-- The blanket grant of 301-auth-functions.sql reaches only the private functions defined before it, so the helper's EXECUTE is granted here by name.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- project_answers_locked: are this project's answers locked?
--
-- The lock is the app setting `access.answersLocked`, stored in the project's row of public.app_settings. While it holds, an entity's own editor cannot change the entity's row, its answers and profile fields included: it is a conjunct of the entity self-update policies of the four entity tables, and `upsert_answers` refuses an entity's editor with SQLSTATE 42501. The project-scope policies do not read it, so a project editor and a project admin still write while answers are locked.
--
-- It reads as project_nominations_locked does. A missing project reads as locked, so a missing project never unlocks anything; a project with no settings row, or a row that does not hold the key, reads as unlocked. Only the JSON boolean true locks: the value is compared as jsonb, so the string "true", a number and a JSON null are unlocked.
--
-- SECURITY DEFINER because public.projects and public.app_settings both have row-level security enabled, and an inline read would also ask whether the caller can see the project and its settings row.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.project_answers_locked (p_project_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT COALESCE(
        (SELECT s.settings #> '{access,answersLocked}' = 'true'::jsonb
           FROM public.app_settings s
          WHERE s.project_id = p.id),
        false
      )
      FROM public.projects p
      WHERE p.id = p_project_id
    ),
    true
  );
$$;

GRANT
EXECUTE ON FUNCTION private.project_answers_locked (uuid) TO anon,
authenticated,
service_role;

DROP POLICY "entity_update_own_candidates" ON public.candidates;

-- Entity self-update: whoever holds `entity.edit_answers` on this row may update it. For an entity grant user_can's reach is equality with the granted entity, type and id both.
--
-- The `'entity'` scope literal is the whole safety argument: written `'project'`, it would let any entity editor in the project rewrite every candidate in it. 18-entity-policies.test.sql asserts that same-type, same-project denial.
--
-- Structural columns (project_id, external_id, ...) are protected by this table's column grants in 303-column-grants.sql, because row-level security cannot admit a row while withholding a column.
--
-- The entity's own editor updates no row while its project's answers are locked (`private.project_answers_locked`, the app setting `access.answersLocked`), and a project grant holder writes through the project-scope policies, which do not read the lock. The self-update policies of the other three entity tables carry the same conjunct.
CREATE POLICY "entity_update_own_candidates" ON public.candidates
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'candidate'::public.entity_type
        )
    )
    AND NOT (
      SELECT
        private.project_answers_locked (project_id)
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'candidate'::public.entity_type
        )
    )
    AND NOT (
      SELECT
        private.project_answers_locked (project_id)
    )
  );

DROP POLICY "entity_update_own_organizations" ON public.organizations;

CREATE POLICY "entity_update_own_organizations" ON public.organizations
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'organization'::public.entity_type
        )
    )
    AND NOT (
      SELECT
        private.project_answers_locked (project_id)
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'organization'::public.entity_type
        )
    )
    AND NOT (
      SELECT
        private.project_answers_locked (project_id)
    )
  );

DROP POLICY "entity_update_own_factions" ON public.factions;

-- Entity self-update: a faction grantee holding `entity.edit_answers` may update its own row, which keeps the four entity tables one shape. The columns it may write are bounded in 303-column-grants.sql.
CREATE POLICY "entity_update_own_factions" ON public.factions
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'faction'::public.entity_type
        )
    )
    AND NOT (
      SELECT
        private.project_answers_locked (project_id)
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'faction'::public.entity_type
        )
    )
    AND NOT (
      SELECT
        private.project_answers_locked (project_id)
    )
  );

DROP POLICY "entity_update_own_alliances" ON public.alliances;

-- Entity self-update: an alliance grantee holding `entity.edit_answers` may update its own row. The columns it may write are bounded in 303-column-grants.sql.
CREATE POLICY "entity_update_own_alliances" ON public.alliances
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'alliance'::public.entity_type
        )
    )
    AND NOT (
      SELECT
        private.project_answers_locked (project_id)
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'alliance'::public.entity_type
        )
    )
    AND NOT (
      SELECT
        private.project_answers_locked (project_id)
    )
  );

--------------------------------------------------------------------------------
-- upsert_answers: atomic answer write for a single entity
--
-- The entity is named by its type and id together, because the entity tables have independent primary keys and one UUID can name a candidate and an organization at once. The type selects the one table written: 'candidate' writes public.candidates and 'organization' writes public.organizations, the only two tables carrying an answers column. Any other type, and a NULL type, raises before any table is written.
--
-- p_overwrite = true replaces the stored answers with p_answers; otherwise p_answers is merged over them. Either way, keys whose value is JSON null are dropped.
--
-- SECURITY INVOKER: the UPDATE is gated by the named table's RLS policies, so a caller can update only the answers of an entity those policies let them edit. An id that matches no row the caller may update raises the not-found exception.
--
-- While the entity's project's answers are locked (`private.project_answers_locked`), a caller that does not hold `project.edit_entities` on the project is refused before any table is written, with SQLSTATE 42501 and `upsert_answers: answers are locked in this project`, so the lock is told apart from a row the caller may not write. The entity's project is read as the caller: an entity the caller cannot read is not judged here and meets the not-found exception.
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
     AND private.project_answers_locked(v_project_id)
     AND NOT COALESCE(public.user_can('project', v_project_id, 'project.edit_entities'), false) THEN
    RAISE EXCEPTION 'upsert_answers: answers are locked in this project'
      USING ERRCODE = '42501';
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
