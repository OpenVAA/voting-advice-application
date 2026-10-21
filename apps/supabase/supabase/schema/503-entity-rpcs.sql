-- Entity RPC functions
--
-- Functions:
-- - get_nominations() - return nominations with entity data
-- - get_entity_basic_data() - basic-data projection of an entity the caller holds nomination.read on
-- - get_user_entities() - every candidate and organization the caller holds an editor grant on in one project, as one object that also says whether the caller's account has a password
-- - get_entity_user_data() - the editable row of one entity the caller holds an editor grant on, or no row
-- - get_entity_nominations() - the nominations of one entity the caller holds an editor grant on, each with its parent resolved, or NULL
-- - get_nomination_parent_options() - the entities one entity the caller holds an editor grant on may name as its parent, or NULL
-- - upsert_answers() - atomic answer write for a single entity
-- - private.nomination_list_checked() - whether an argument is a nominations array a writer may take: an array of at most 1000 members
-- - private.nomination_object_checked() - the shape of one nomination object, refused or answered with its normalised values
-- - private.parent_nomination_resolved() - a named parent's nomination at a contest, found or created bare, as the caller
-- - set_entity_nominations() - write the whole set of nominations of one entity the caller holds nomination.edit on, in one transaction
--------------------------------------------------------------------------------
-- get_nominations RPC: returns nominations with entity data in a single round trip
--
-- p_project_id is REQUIRED and carries no DEFAULT. Every other filter defaults to NULL, meaning no filter, so a defaulted project would let a caller that omits the argument read every project's nominations. It comes first because PostgreSQL forbids a parameter without a default from following one that has a default.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_nominations (
  p_project_id uuid,
  p_election_id uuid DEFAULT NULL,
  p_constituency_id uuid DEFAULT NULL,
  p_include_unconfirmed boolean DEFAULT false,
  p_election_round integer DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  entity_type public.entity_type,
  candidate_id uuid,
  organization_id uuid,
  faction_id uuid,
  alliance_id uuid,
  election_id uuid,
  constituency_id uuid,
  election_round integer,
  election_symbol text,
  parent_nomination_id uuid,
  entity_id uuid,
  entity_name jsonb,
  entity_short_name jsonb,
  entity_info jsonb,
  entity_color jsonb,
  entity_image jsonb,
  entity_sort_order integer,
  entity_subtype text,
  entity_custom_data jsonb,
  entity_answers jsonb,
  entity_first_name text,
  entity_last_name text
) LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT
    n.id, n.name, n.short_name, n.info, n.color, n.image,
    n.sort_order, n.subtype, n.custom_data,
    n.entity_type,
    n.candidate_id, n.organization_id, n.faction_id, n.alliance_id,
    n.election_id, n.constituency_id, n.election_round, n.election_symbol,
    n.parent_nomination_id,
    COALESCE(n.candidate_id, n.organization_id, n.faction_id, n.alliance_id) AS entity_id,
    COALESCE(o.name, f.name, a.name) AS entity_name,
    COALESCE(c.short_name, o.short_name, f.short_name, a.short_name) AS entity_short_name,
    COALESCE(c.info, o.info, f.info, a.info) AS entity_info,
    COALESCE(c.color, o.color, f.color, a.color) AS entity_color,
    COALESCE(c.image, o.image, f.image, a.image) AS entity_image,
    COALESCE(c.sort_order, o.sort_order, f.sort_order, a.sort_order) AS entity_sort_order,
    COALESCE(c.subtype, o.subtype, f.subtype, a.subtype) AS entity_subtype,
    COALESCE(c.custom_data, o.custom_data, f.custom_data, a.custom_data) AS entity_custom_data,
    COALESCE(c.answers, o.answers) AS entity_answers,
    c.first_name AS entity_first_name,
    c.last_name AS entity_last_name
  FROM public.nominations n
  -- The project term belongs in the JOIN condition, not the WHERE clause. These are LEFT joins and three of the four aliases are NULL on any row, so a WHERE predicate on a right-hand table would discard every nomination whose entity is of another type. In the ON clause a non-matching entity resolves to NULL, which the trailing COALESCE filter handles.
  LEFT JOIN public.candidates c ON n.candidate_id = c.id AND c.project_id = p_project_id
  LEFT JOIN public.organizations o ON n.organization_id = o.id AND o.project_id = p_project_id
  LEFT JOIN public.factions f ON n.faction_id = f.id AND f.project_id = p_project_id
  LEFT JOIN public.alliances a ON n.alliance_id = a.id AND a.project_id = p_project_id
  -- The project predicate is an unconditional equality rather than the `IS NULL OR` shape the other filters use: there is no every-project case.
  WHERE n.project_id = p_project_id
    AND (p_election_id IS NULL OR n.election_id = p_election_id)
    AND (p_constituency_id IS NULL OR n.constituency_id = p_constituency_id)
    AND (p_include_unconfirmed OR n.confirmed)
    -- nominations.election_round is a scalar integer, so this is an equality rather than the array containment that get_questions uses against the JSONB election_rounds on questions and question categories.
    AND (p_election_round IS NULL OR n.election_round = p_election_round)
    -- SECURITY INVOKER means the LEFT JOINs run with the caller's permissions, so RLS-hidden entity rows return NULL on the entity-side columns. Drop rows where every entity-side join resolved to NULL. With the join predicates above, this filter also drops a nomination whose entity belongs to another project.
    AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL
  ORDER BY n.sort_order NULLS LAST, n.id;
$$;

GRANT
EXECUTE ON FUNCTION public.get_nominations (uuid, uuid, uuid, boolean, integer) TO anon,
authenticated;

--------------------------------------------------------------------------------
-- get_entity_basic_data: an entity's BASIC data for a caller holding nomination.read on it
--
-- An entity grantee reads a related entity's basic data through is_child_nominee, but not its answers unless they are public. Row-level security cannot express that, because a SELECT policy that admits a row returns every column of it, so the entity SELECT policies carry no `nomination.read` disjunct (302-rls.sql) and the parent's reach is granted here instead.
--
-- The gate is ONE `user_can ('entity', p_entity_id, 'nomination.read', p_entity_type)` call, so the matrix is asked rather than re-derived: the child-nominee hop is user_can's named branch 2, and every project-scope role holding nomination.read passes through the ordinary reach rules.
--
-- The entity is named by its type and id together, because the four entity tables have independent primary keys and one uuid can name two entities in two projects. The type selects the one table probed, and the gate asks about that same entity.
--
-- The projection is an ALLOW-LIST, not `to_jsonb(row) - <deny-list>`: a column added to an entity table later is withheld until someone decides it is basic data. Withheld today: answers, custom_data, external_id and the two timestamps.
--
-- Returns NULL -- never raises -- when the caller lacks the permission, when the type is NULL, or when the named table holds no row with that id, so the answer does not distinguish "does not exist" from "not yours".
--
-- SECURITY DEFINER because the whole point is to return a row the caller's own SELECT policy refuses; search_path is pinned as on every definer function in this schema. EXECUTE is authenticated only: anon carries no grants claim, so user_can would deny it on every call anyway.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_entity_basic_data (
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_entity_id IS NULL OR NOT public.user_can('entity', p_entity_id, 'nomination.read', p_entity_type) THEN
    RETURN NULL;
  END IF;

  CASE p_entity_type
    WHEN 'candidate' THEN
      SELECT jsonb_build_object(
          'entity_type', 'candidate', 'id', c.id, 'project_id', c.project_id,
          'first_name', c.first_name, 'last_name', c.last_name,
          'short_name', c.short_name, 'info', c.info, 'color', c.color, 'image', c.image,
          'sort_order', c.sort_order, 'subtype', c.subtype, 'confirmed', c.confirmed)
        INTO result
        FROM public.candidates c WHERE c.id = p_entity_id;
    WHEN 'organization' THEN
      SELECT jsonb_build_object(
          'entity_type', 'organization', 'id', o.id, 'project_id', o.project_id,
          'name', o.name, 'short_name', o.short_name, 'info', o.info, 'color', o.color, 'image', o.image,
          'sort_order', o.sort_order, 'subtype', o.subtype, 'confirmed', o.confirmed)
        INTO result
        FROM public.organizations o WHERE o.id = p_entity_id;
    WHEN 'faction' THEN
      SELECT jsonb_build_object(
          'entity_type', 'faction', 'id', f.id, 'project_id', f.project_id,
          'organization_id', f.organization_id,
          'name', f.name, 'short_name', f.short_name, 'info', f.info, 'color', f.color, 'image', f.image,
          'sort_order', f.sort_order, 'subtype', f.subtype, 'confirmed', f.confirmed)
        INTO result
        FROM public.factions f WHERE f.id = p_entity_id;
    WHEN 'alliance' THEN
      SELECT jsonb_build_object(
          'entity_type', 'alliance', 'id', a.id, 'project_id', a.project_id,
          'name', a.name, 'short_name', a.short_name, 'info', a.info, 'color', a.color, 'image', a.image,
          'sort_order', a.sort_order, 'subtype', a.subtype, 'confirmed', a.confirmed)
        INTO result
        FROM public.alliances a WHERE a.id = p_entity_id;
  END CASE;
  RETURN result;
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.get_entity_basic_data (public.entity_type, uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_entity_basic_data (public.entity_type, uuid) TO authenticated;

--------------------------------------------------------------------------------
-- get_user_entities: every entity the caller edits in ONE project, as ONE object
--
-- Returns one jsonb object whose `entities` array holds one entry per candidate and per organization of p_project_id the caller holds an `(entity, <type>, <id>, editor)` grant on, read from public.grants through private.caller_entity_ids. Each entry carries what a card shows: `entity_type`, `id`, the names of its type (`first_name` and `last_name` for a candidate, `name` for an organization), `short_name`, `image`, `color` and `confirmed`. Candidates come first, then organizations, each by id.
--
-- The answer is one object, not a set of rows, so a caller with no entity still gets one row, whose `entities` is an empty array. The top level holds facts about the caller; every fact about an entity sits inside `entities`.
--
-- `password_set` is a fact about the caller: whether the caller's own account holds a password, as private.caller_password_set answers it for `auth.uid()`. It is there whether or not the caller edits anything, and it never says anything about another account, because nothing passed to this function reaches it.
--
-- Only candidates and organizations are listed: factions and alliances have no arm. Project, account and global admins and holders of an entity-scope `admin` grant are listed with nothing, because only the editor grant makes an entity the caller's.
--
-- p_project_id is REQUIRED and carries no DEFAULT, because one identity may hold editor grants in several projects and only the project names which of them are asked for.
--
-- SECURITY INVOKER: the grant lookup and the password fact are the two definer calls on the path, each answering for `auth.uid()` alone, and which rows come back is still decided by the caller's own row-level security. An entity is therefore listed exactly when get_entity_user_data returns it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_entities (p_project_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER
SET
  search_path = '' AS $$
  SELECT jsonb_build_object(
    'entities',
    COALESCE(
      (
        SELECT jsonb_agg(e.entity ORDER BY e.type_order, e.id)
        FROM (
          SELECT 1 AS type_order, c.id,
                 jsonb_build_object(
                   'entity_type', 'candidate', 'id', c.id,
                   'first_name', c.first_name, 'last_name', c.last_name,
                   'short_name', c.short_name, 'image', c.image, 'color', c.color,
                   'confirmed', c.confirmed) AS entity
          FROM public.candidates c
          WHERE c.project_id = p_project_id
            AND c.id IN (SELECT private.caller_entity_ids (p_project_id, 'candidate'))
          UNION ALL
          SELECT 2 AS type_order, o.id,
                 jsonb_build_object(
                   'entity_type', 'organization', 'id', o.id,
                   'name', o.name,
                   'short_name', o.short_name, 'image', o.image, 'color', o.color,
                   'confirmed', o.confirmed) AS entity
          FROM public.organizations o
          WHERE o.project_id = p_project_id
            AND o.id IN (SELECT private.caller_entity_ids (p_project_id, 'organization'))
        ) e
      ),
      '[]'::jsonb
    ),
    'password_set', private.caller_password_set()
  );
$$;

REVOKE
EXECUTE ON FUNCTION public.get_user_entities (uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_user_entities (uuid) TO authenticated;

--------------------------------------------------------------------------------
-- get_entity_user_data: the editable row of ONE entity the caller edits, or no row
--
-- Returns the row of the candidate or organization named by p_entity_type and p_entity_id when it lies in p_project_id and the caller holds an `(entity, <type>, <id>, editor)` grant on it, read from public.grants through private.caller_entity_ids. The entity is named by its type and id together, because the entity tables have independent primary keys and one uuid can name a candidate and an organization at once.
--
-- Returns no row -- never raises -- for an entity that is not the caller's, a type that does not match the id, an entity of another project and an id that does not exist, so the answer does not distinguish "does not exist" from "not yours". A faction or an alliance has no arm and returns no row.
--
-- One column list serves both types: `name` is NULL for a candidate, and `first_name` and `last_name` are NULL for an organization.
--
-- No parameter carries a DEFAULT: the project, the type and the id are each stated by the caller.
--
-- SECURITY INVOKER: the grant lookup is the one definer call on the path, and the row comes back only when the caller's own row-level security admits it too. The condition is `id IN (the caller's entity ids)` on the entity table itself, so a row that row-level security hides is not returned.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_entity_user_data (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS TABLE (
  id uuid,
  project_id uuid,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  answers jsonb,
  first_name text,
  last_name text
) LANGUAGE sql STABLE SECURITY INVOKER
SET
  search_path = '' AS $$
  SELECT c.id, c.project_id, NULL::jsonb, c.short_name, c.info,
         c.color, c.image, c.sort_order, c.subtype,
         c.custom_data, c.answers,
         c.first_name, c.last_name
  FROM public.candidates c
  WHERE p_entity_type = 'candidate'
    AND c.id = p_entity_id
    AND c.project_id = p_project_id
    AND c.id IN (SELECT private.caller_entity_ids (p_project_id, 'candidate'))
  UNION ALL
  SELECT o.id, o.project_id, o.name, o.short_name, o.info,
         o.color, o.image, o.sort_order, o.subtype,
         o.custom_data, o.answers,
         NULL::text, NULL::text
  FROM public.organizations o
  WHERE p_entity_type = 'organization'
    AND o.id = p_entity_id
    AND o.project_id = p_project_id
    AND o.id IN (SELECT private.caller_entity_ids (p_project_id, 'organization'));
$$;

REVOKE
EXECUTE ON FUNCTION public.get_entity_user_data (uuid, public.entity_type, uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_entity_user_data (uuid, public.entity_type, uuid) TO authenticated;

--------------------------------------------------------------------------------
-- get_entity_nominations: the nominations of ONE entity the caller edits, each with the parent it stands under
--
-- Returns a jsonb array holding one object per nomination of the candidate or organization named by p_entity_type and p_entity_id in p_project_id, confirmed or not, ordered by sort_order with nulls last and then by id. An entity with no nomination gets an empty array.
--
-- The gate is the caller's own `(entity, <type>, <id>, editor)` grant, read from public.grants through private.caller_entity_ids. That is the lookup get_entity_user_data uses, so the two agree on whose entity it is. `user_can` is not asked: it answers yes for project, account and global admins, and through the child-nominee hop for the editor of a parent organization, who would then learn which other parties its candidate stands for. Only candidates and organizations are served: a faction or an alliance is refused even to its own editor.
--
-- The entity is named by its type and id together, because the entity tables have independent primary keys and one uuid can name a candidate and an organization at once. The type selects the one foreign key matched, so the nominations of the other entity carrying that id are not returned. No parameter carries a DEFAULT: the project, the type and the id are each stated by the caller.
--
-- The projection is an ALLOW-LIST built key by key, not `to_jsonb(row) - <deny-list>`: `id`, `election_id`, `election_name`, `constituency_id`, `constituency_name`, `election_round`, `election_symbol`, `confirmed`, `custom_data` and `parent`. The two names are the localized `name` columns as stored. `parent` is a JSON null when the nomination has none, and otherwise an object of exactly `entity_type`, `entity_id`, `name` and `short_name` of the entity the parent nomination nominates. Withheld: `created_by`, every other column of the parent entity and every column of the parent's nomination.
--
-- Returns NULL -- never raises -- when a parameter is NULL, when the type is not served, and when the caller holds no editor grant on the named entity in the named project, which covers another user's entity, an entity of another project and an id that does not exist. The answer therefore does not distinguish "does not exist" from "not yours", and NULL is a different answer from the empty array. The condition refuses on anything other than a positive match, so a NULL comparison refuses too.
--
-- SECURITY DEFINER because a parent is returned where the caller's own SELECT policies refuse both its nomination and its entity row: an unconfirmed parent, and any parent in a project that is not open for voters. search_path is pinned as on every definer function in this schema. EXECUTE is authenticated only.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_entity_nominations (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  IF p_project_id IS NULL OR p_entity_type IS NULL OR p_entity_id IS NULL
     OR (
       p_entity_type IN ('candidate', 'organization')
       AND p_entity_id IN (SELECT private.caller_entity_ids(p_project_id, p_entity_type))
     ) IS NOT TRUE THEN
    RETURN NULL;
  END IF;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', n.id,
          'election_id', n.election_id, 'election_name', e.name,
          'constituency_id', n.constituency_id, 'constituency_name', c.name,
          'election_round', n.election_round, 'election_symbol', n.election_symbol,
          'confirmed', n.confirmed, 'custom_data', n.custom_data,
          'parent', CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object(
            'entity_type', p.entity_type,
            'entity_id', COALESCE(p.organization_id, p.faction_id, p.alliance_id),
            'name', COALESCE(po.name, pf.name, pa.name),
            'short_name', COALESCE(po.short_name, pf.short_name, pa.short_name)) END)
        ORDER BY n.sort_order NULLS LAST, n.id)
      FROM public.nominations n
      JOIN public.elections e ON e.id = n.election_id
      JOIN public.constituencies c ON c.id = n.constituency_id
      LEFT JOIN public.nominations p ON p.id = n.parent_nomination_id
      LEFT JOIN public.organizations po ON po.id = p.organization_id
      LEFT JOIN public.factions pf ON pf.id = p.faction_id
      LEFT JOIN public.alliances pa ON pa.id = p.alliance_id
      WHERE n.project_id = p_project_id
        AND (
          (p_entity_type = 'candidate' AND n.candidate_id = p_entity_id)
          OR (p_entity_type = 'organization' AND n.organization_id = p_entity_id)
        )
    ),
    '[]'::jsonb
  );
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.get_entity_nominations (uuid, public.entity_type, uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_entity_nominations (uuid, public.entity_type, uuid) TO authenticated;

--------------------------------------------------------------------------------
-- get_nomination_parent_options: the entities ONE entity the caller edits may name as its parent
--
-- Returns a jsonb array holding one object per entity the candidate or organization named by p_entity_type and p_entity_id may stand under in p_project_id: for a candidate every confirmed organization of the project, for an organization every alliance of the project, confirmed or not. The array is ordered by sort_order with nulls last and then by id. A project that holds no such entity gets an empty array.
--
-- The gate is the one get_entity_nominations asks: the caller's own `(entity, <type>, <id>, editor)` grant, read from public.grants through private.caller_entity_ids, which keeps only entities that lie in p_project_id. The project whose entities are listed is therefore always one in which the caller edits the named entity: p_project_id selects among the caller's own grants and cannot point the read at another project. `user_can` is not asked, so a project admin and the editor of a parent organization are refused; they read the entity tables through their own policies. Only candidates and organizations are served: a faction stands under the organization it belongs to and an alliance under nothing.
--
-- No parameter carries a DEFAULT: the project, the type, the id and the contests are each stated by the caller. p_contests is a JSON array of objects, each naming an `election_id` and a `constituency_id`; any other key of such an object is not read. An empty array is admitted.
--
-- The projection is an ALLOW-LIST built key by key, not `to_jsonb(row) - <deny-list>`: `id`, `entity_type`, `name`, `short_name`, `color`, `image` and `nominated`. `name`, `short_name`, `color` and `image` are the columns as stored, a JSON null where the column is NULL. `nominated` is a JSON array of `{election_id, constituency_id}` objects: those of the asked contests at which the option holds a nomination at the election's current_round, each once, in the order asked. A contest whose election is not one of p_project_id is never among them. Withheld: answers, custom_data, info, external_id, confirmed, subtype, sort_order, project_id, the two timestamps and every column of the option's nominations.
--
-- Returns NULL -- never raises -- when one of the first three parameters is NULL, when the type is not served, when the caller holds no editor grant on the named entity in the named project, and when p_contests is NULL, is not a JSON array, or holds a member that is not an object whose `election_id` and `constituency_id` are strings that read as uuids. NULL is a refusal and a different answer from the empty array, which says that the project lists nothing the entity may name. Each condition refuses on anything other than a positive match, so a NULL comparison refuses too.
--
-- SECURITY DEFINER because an entity's editor cannot read the project's organizations and alliances through its own SELECT policies -- none of them in a project that is not open for voters, and nowhere one that has no confirmed nomination -- and a policy that admitted those rows would return every column of them. search_path is pinned as on every definer function in this schema. EXECUTE is authenticated only.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_nomination_parent_options (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_contests jsonb
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  IF p_project_id IS NULL OR p_entity_type IS NULL OR p_entity_id IS NULL
     OR (
       p_entity_type IN ('candidate', 'organization')
       AND p_entity_id IN (SELECT private.caller_entity_ids(p_project_id, p_entity_type))
     ) IS NOT TRUE THEN
    RETURN NULL;
  END IF;

  IF jsonb_typeof(p_contests) IS DISTINCT FROM 'array' THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_contests) AS m (contest)
    WHERE (
      jsonb_typeof(m.contest) = 'object'
      AND jsonb_typeof(m.contest -> 'election_id') = 'string'
      AND jsonb_typeof(m.contest -> 'constituency_id') = 'string'
      AND pg_input_is_valid(m.contest ->> 'election_id', 'uuid')
      AND pg_input_is_valid(m.contest ->> 'constituency_id', 'uuid')
    ) IS NOT TRUE
  ) THEN
    RETURN NULL;
  END IF;

  RETURN COALESCE(
    (
      WITH asked AS (
        SELECT k.election_id, k.constituency_id, e.current_round, min(k.ord) AS ord
        FROM (
          SELECT (m.contest ->> 'election_id')::uuid AS election_id,
                 (m.contest ->> 'constituency_id')::uuid AS constituency_id,
                 m.ord
          FROM jsonb_array_elements(p_contests) WITH ORDINALITY AS m (contest, ord)
        ) k
        JOIN public.elections e ON e.id = k.election_id AND e.project_id = p_project_id
        GROUP BY k.election_id, k.constituency_id, e.current_round
      ),
      listed AS (
        SELECT 'organization'::public.entity_type AS entity_type,
               o.id, o.name, o.short_name, o.color, o.image, o.sort_order
        FROM public.organizations o
        WHERE p_entity_type = 'candidate' AND o.project_id = p_project_id AND o.confirmed
        UNION ALL
        SELECT 'alliance'::public.entity_type AS entity_type,
               a.id, a.name, a.short_name, a.color, a.image, a.sort_order
        FROM public.alliances a
        WHERE p_entity_type = 'organization' AND a.project_id = p_project_id
      )
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', l.id, 'entity_type', l.entity_type,
          'name', l.name, 'short_name', l.short_name, 'color', l.color, 'image', l.image,
          'nominated', COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object('election_id', k.election_id, 'constituency_id', k.constituency_id)
                ORDER BY k.ord)
              FROM asked k
              WHERE private.nomination_exists_in_contest(
                l.entity_type, l.id, k.election_id, k.constituency_id, k.current_round)
            ),
            '[]'::jsonb))
        ORDER BY l.sort_order NULLS LAST, l.id)
      FROM listed l
    ),
    '[]'::jsonb
  );
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.get_nomination_parent_options (uuid, public.entity_type, uuid, jsonb)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_nomination_parent_options (uuid, public.entity_type, uuid, jsonb) TO authenticated;

--------------------------------------------------------------------------------
-- upsert_answers: atomic answer write for a single entity
--
-- The entity is named by its type and id together, because the entity tables have independent primary keys and one UUID can name a candidate and an organization at once. The type selects the one table written: 'candidate' writes public.candidates and 'organization' writes public.organizations, the only two tables carrying an answers column. Any other type, and a NULL type, raises before any table is written.
--
-- p_overwrite = true replaces the stored answers with p_answers; otherwise p_answers is merged over them. Either way, keys whose value is JSON null are dropped.
--
-- SECURITY INVOKER: the UPDATE is gated by the named table's RLS policies, so a caller can update only the answers of an entity those policies let them edit. An id that matches no row the caller may update raises the not-found exception.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_answers (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_answers jsonb,
  p_overwrite boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  p_updated_answers jsonb;
BEGIN
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
-- nomination_list_checked: is this a nominations array a writer may take
--
-- Raises SQLSTATE 22023 with `<p_prefix>: <p_label> must be a JSON array` for anything that is not a JSON array, an SQL NULL included, and with `<p_prefix>: <p_label> holds more than 1000 nominations` for an array of more than 1000 members. It reads no member, so a writer asks it before it checks any object: the bound limits the work one call can ask of the checks and the writes that follow. Every writer of a nominations array asks it, so the bound is stated here and nowhere else.
--
-- The writers are SECURITY INVOKER and call it as their caller, so `authenticated` and `service_role` hold EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.nomination_list_checked (p_list jsonb, p_prefix text, p_label text) RETURNS void LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  c_max_nominations constant integer := 1000;
BEGIN
  IF jsonb_typeof(p_list) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION '%: % must be a JSON array', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_array_length(p_list) > c_max_nominations THEN
    RAISE EXCEPTION '%: % holds more than % nominations', p_prefix, p_label, c_max_nominations
      USING ERRCODE = '22023';
  END IF;
END;
$$;

REVOKE
EXECUTE ON FUNCTION private.nomination_list_checked (jsonb, text, text)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.nomination_list_checked (jsonb, text, text) TO authenticated,
service_role;

--------------------------------------------------------------------------------
-- nomination_object_checked: the shape of ONE nomination object
--
-- Checks the keys of one object of a nominations array, in this order, and raises SQLSTATE 22023 with a message that begins `<p_prefix>: <p_label> ` at the first fault: the object itself, `election_id` and `constituency_id` (each a string that reads as a uuid), `id` (absent, or a string that reads as a uuid; a JSON null is refused), `election_symbol` (a string or null, at most 50 characters after the trim), and `parent`, an object whose `kind` is `none`, `entity`, `other` or `keep`. For `entity` the parent's `entity_type` must be p_parent_type and its `entity_id` a uuid; for `other` the `name` must be a string that is not blank and holds at most 100 characters after the trim. Any other key is not read. p_parent_type is named in the message that refuses another type.
--
-- Trimming removes leading and trailing white space of any kind, the Unicode white-space characters and the byte order mark, and lengths are counted in characters. The white-space class, the trim and the two caps are stated here and nowhere else.
--
-- It checks the shape alone. Whatever depends on the rows -- whether an `id` names a nomination the writer may write, whether the election can be read, whether `keep` is allowed -- is the writer's to check after it.
--
-- Answers `{"id", "election_id", "constituency_id", "symbol", "kind", "parent_entity_id", "name"}`: `id` null when the object names none, `symbol` trimmed with a blank one as null, `parent_entity_id` only for `entity` and `name`, trimmed, only for `other`; every other value is null.
--
-- STABLE because `pg_input_is_valid` is. The writers are SECURITY INVOKER and call it as their caller, so `authenticated` and `service_role` hold EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.nomination_object_checked (
  p_object jsonb,
  p_parent_type public.entity_type,
  p_prefix text,
  p_label text
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  -- White space of any kind: the Unicode white-space characters and the byte order mark.
  c_blank constant text := '[\u0009-\u000d\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]';
  c_trim constant text := '^' || c_blank || '+|' || c_blank || '+$';
  v_symbol text;
  v_parent jsonb;
  v_kind text;
  v_parent_entity_id uuid;
  v_name text;
BEGIN
  IF jsonb_typeof(p_object) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION '%: % must be a JSON object', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_object -> 'election_id') IS DISTINCT FROM 'string'
     OR NOT pg_input_is_valid(p_object ->> 'election_id', 'uuid') THEN
    RAISE EXCEPTION '%: % needs an election_id that is a uuid', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_object -> 'constituency_id') IS DISTINCT FROM 'string'
     OR NOT pg_input_is_valid(p_object ->> 'constituency_id', 'uuid') THEN
    RAISE EXCEPTION '%: % needs a constituency_id that is a uuid', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;

  IF p_object ? 'id' THEN
    IF jsonb_typeof(p_object -> 'id') <> 'string'
       OR NOT pg_input_is_valid(p_object ->> 'id', 'uuid') THEN
      RAISE EXCEPTION '%: % has an id that is not a uuid', p_prefix, p_label
        USING ERRCODE = '22023';
    END IF;
  END IF;

  IF jsonb_typeof(p_object -> 'election_symbol') NOT IN ('string', 'null') THEN
    RAISE EXCEPTION '%: % has an election_symbol that is neither a string nor null', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;
  v_symbol := NULLIF(regexp_replace(p_object ->> 'election_symbol', c_trim, '', 'g'), '');
  IF char_length(v_symbol) > 50 THEN
    RAISE EXCEPTION '%: % has an election_symbol longer than 50 characters', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;

  v_parent := p_object -> 'parent';
  IF jsonb_typeof(v_parent) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION '%: % needs a parent that is a JSON object', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(v_parent -> 'kind') IS DISTINCT FROM 'string'
     OR (v_parent ->> 'kind') NOT IN ('none', 'entity', 'other', 'keep') THEN
    RAISE EXCEPTION '%: % has a parent whose kind is not none, entity, other or keep', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;
  v_kind := v_parent ->> 'kind';

  IF v_kind = 'entity' THEN
    IF jsonb_typeof(v_parent -> 'entity_type') IS DISTINCT FROM 'string'
       OR (v_parent ->> 'entity_type') IS DISTINCT FROM p_parent_type::text THEN
      RAISE EXCEPTION '%: % names a parent whose entity_type is not %', p_prefix, p_label, p_parent_type
        USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(v_parent -> 'entity_id') IS DISTINCT FROM 'string'
       OR NOT pg_input_is_valid(v_parent ->> 'entity_id', 'uuid') THEN
      RAISE EXCEPTION '%: % names a parent whose entity_id is not a uuid', p_prefix, p_label
        USING ERRCODE = '22023';
    END IF;
    v_parent_entity_id := (v_parent ->> 'entity_id')::uuid;
  ELSIF v_kind = 'other' THEN
    IF jsonb_typeof(v_parent -> 'name') IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION '%: % names a parent whose name is not a string', p_prefix, p_label
        USING ERRCODE = '22023';
    END IF;
    v_name := regexp_replace(v_parent ->> 'name', c_trim, '', 'g');
    IF v_name = '' THEN
      RAISE EXCEPTION '%: % names a parent whose name is blank', p_prefix, p_label
        USING ERRCODE = '22023';
    END IF;
    IF char_length(v_name) > 100 THEN
      RAISE EXCEPTION '%: % names a parent whose name is longer than 100 characters', p_prefix, p_label
        USING ERRCODE = '22023';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'id', (p_object ->> 'id')::uuid,
    'election_id', (p_object ->> 'election_id')::uuid,
    'constituency_id', (p_object ->> 'constituency_id')::uuid,
    'symbol', v_symbol,
    'kind', v_kind,
    'parent_entity_id', v_parent_entity_id,
    'name', v_name);
END;
$$;

REVOKE
EXECUTE ON FUNCTION private.nomination_object_checked (jsonb, public.entity_type, text, text)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.nomination_object_checked (jsonb, public.entity_type, text, text) TO authenticated,
service_role;

--------------------------------------------------------------------------------
-- parent_nomination_resolved: a named parent's nomination at ONE contest, found or created
--
-- Answers `nomination_id`, the nomination the organization or alliance named by p_parent_type and p_parent_entity_id holds at the election, constituency and round given, as `private.nomination_id_in_contest` finds it, and `created`, whether this call inserted it. Where the parent holds none, the call inserts the parent's row -- the project, the parent, the election, the constituency and the round, and nothing else, so it is unconfirmed and carries no symbol, parent or custom data -- and asks for it again; the caller may be unable to read the new row, so its id is asked for and not returned by the insert. `nomination_id` is null when that second lookup still finds nothing, and for a parent type other than organization and alliance, which has no such row; the writer then raises its own refusal.
--
-- A parent that is no entity of p_project_id, an id that names no entity included, is refused first with SQLSTATE 22023 and `<p_prefix>: <p_label> names a parent that is no entity of the nomination's project`, before anything is read or written.
--
-- SECURITY INVOKER: the insert runs as the caller, so the insert policies of public.nominations decide who may create a party's or an alliance's row, and an entity's editor meets the cap on the unconfirmed parent nominations it originates.
--
-- Two calls that create the same parent's nomination at the same moment are decided by the uniqueness key `nominations_entity_parent_contest_key`: the second call's insert is refused, its writer's whole call with it, and the call succeeds when it is made again.
--
-- The writers are SECURITY INVOKER and call it as their caller, so `authenticated` and `service_role` hold EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.parent_nomination_resolved (
  p_project_id uuid,
  p_parent_type public.entity_type,
  p_parent_entity_id uuid,
  p_election_id uuid,
  p_constituency_id uuid,
  p_election_round integer,
  p_prefix text,
  p_label text,
  OUT nomination_id uuid,
  OUT created boolean
) LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET
  search_path = '' AS $$
BEGIN
  IF private.entity_project_id(p_parent_type, p_parent_entity_id) IS DISTINCT FROM p_project_id THEN
    RAISE EXCEPTION '%: % names a parent that is no entity of the nomination''s project', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;

  created := false;
  nomination_id := private.nomination_id_in_contest(
    p_parent_type, p_parent_entity_id, p_election_id, p_constituency_id, p_election_round);

  IF nomination_id IS NULL THEN
    IF p_parent_type = 'organization' THEN
      INSERT INTO public.nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES (p_project_id, p_parent_entity_id, p_election_id, p_constituency_id, p_election_round);
      created := true;
    ELSIF p_parent_type = 'alliance' THEN
      INSERT INTO public.nominations (project_id, alliance_id, election_id, constituency_id, election_round)
      VALUES (p_project_id, p_parent_entity_id, p_election_id, p_constituency_id, p_election_round);
      created := true;
    END IF;

    IF created THEN
      nomination_id := private.nomination_id_in_contest(
        p_parent_type, p_parent_entity_id, p_election_id, p_constituency_id, p_election_round);
    END IF;
  END IF;
END;
$$;

REVOKE
EXECUTE ON FUNCTION private.parent_nomination_resolved (
  uuid,
  public.entity_type,
  uuid,
  uuid,
  uuid,
  integer,
  text,
  text
)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.parent_nomination_resolved (
  uuid,
  public.entity_type,
  uuid,
  uuid,
  uuid,
  integer,
  text,
  text
) TO authenticated,
service_role;

--------------------------------------------------------------------------------
-- set_entity_nominations: write the whole set of nominations of ONE entity the caller edits, in one transaction
--
-- p_nominations states every nomination the candidate or organization named by p_entity_type and p_entity_id is to hold among the rows this function may write. The call inserts the nominations the set adds, updates the ones whose values differ, creates the nomination of a named party or alliance that has none at the contest, and deletes the ones the set leaves out. It is one statement of the caller's transaction, so either all of it is stored or none of it is.
--
-- SECURITY INVOKER: every statement runs as the caller, so the policies of public.nominations, its column grants and its triggers stay the only gate, and a direct write of the same rows meets the same refusals. The body holds one authority question, asked through `user_can` before anything is read: a caller that does not hold `nomination.edit` on the entity is refused with SQLSTATE 42501. search_path is pinned and every name in the body is schema-qualified.
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
-- An array of more than 1000 nominations is refused before any object is read. A parent that is no entity of the entity's project, or an id that names no entity, is refused with SQLSTATE 22023 when the parent is resolved, so nothing the call wrote before it is stored.
--
-- The reach: the function writes only the nominations of the entity that the caller can read, whose election_round is their election's current_round, in an election for whose type `nomination_shape_rule` admits the entity's type. A nomination in reach that the set does not name is deleted. Every other nomination of the entity is neither updated nor deleted, and an `id` that names one is refused. A new nomination is written at its election's current_round, read here: the argument carries no round.
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
-- Where an election's type requires a candidate's nomination to have a parent or a requested name, `nominations_parent_required` judges it when the transaction ends. The function forces that constraint as its last statement and sets it back to deferred, so the refusal (SQLSTATE 23514) is raised inside the call, and no later statement of the transaction meets the constraint immediate.
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
  p_nominations jsonb
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

  PERFORM private.nomination_list_checked(p_nominations, 'set_entity_nominations', 'p_nominations');

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
        'custom_data', n.custom_data)),
    '{}'::jsonb)
  INTO v_reach
  FROM public.nominations n
  JOIN public.elections e ON e.id = n.election_id
  WHERE (
      (p_entity_type = 'candidate' AND n.candidate_id = p_entity_id)
      OR (p_entity_type = 'organization' AND n.organization_id = p_entity_id)
    )
    AND n.election_round IS NOT DISTINCT FROM e.current_round
    AND public.nomination_shape_rule(e.election_type, p_entity_type) IN ('admitted', 'parent_required');

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

REVOKE
EXECUTE ON FUNCTION public.set_entity_nominations (public.entity_type, uuid, jsonb)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.set_entity_nominations (public.entity_type, uuid, jsonb) TO authenticated;
