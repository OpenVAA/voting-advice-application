--------------------------------------------------------------------------------
-- caller_pending_email_taken: is the address the caller's account is changing to already another account's?
--
-- True when the caller's row of auth.users, the row `auth.uid()` names, holds a non-empty pending address (`email_change`) and another row's address equals it, both compared trimmed and lower-cased. False otherwise, for a caller with no pending address, and where no caller is signed in. get_user_entities in 503-entity-rpcs.sql calls it for its `pending_email_taken` key.
--
-- It answers for the caller alone. It takes no argument and reads one pending address, the caller's own, so each answer is about the one address the caller's account is changing to and never about an address the caller merely names: to ask about another address, a caller has to make it its own pending address first, which the application does only through the address-confirmation request that public.address_confirmation_request limits per account.
--
-- `authenticated` alone holds EXECUTE, stated here because the grant on the `private` schema above does not reach a function defined after it. get_user_entities runs with its caller's rights, so the role that may call it must be able to call this one.
--
-- SECURITY DEFINER because it reads auth.users, which no API role can.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.caller_pending_email_taken () RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT EXISTS (
        SELECT 1
        FROM auth.users other
        WHERE other.id <> me.id
          AND lower(btrim(other.email)) = lower(btrim(me.email_change))
      )
      FROM auth.users me
      WHERE me.id = (SELECT auth.uid())
        AND NULLIF(btrim(me.email_change), '') IS NOT NULL
    ),
    false
  );
$$;

REVOKE
EXECUTE ON FUNCTION private.caller_pending_email_taken ()
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.caller_pending_email_taken () TO authenticated;

--------------------------------------------------------------------------------
-- get_user_entities: every entity the caller edits in ONE project, as ONE object
--
-- Returns one jsonb object whose `entities` array holds one entry per candidate and per organization of p_project_id the caller holds an `(entity, <type>, <id>, editor)` grant on, read from public.grants through private.caller_entity_ids. Each entry carries what a card shows: `entity_type`, `id`, the names of its type (`first_name` and `last_name` for a candidate, `name` for an organization), `short_name`, `image`, `color` and `confirmed`. Candidates come first, then organizations, each by id.
--
-- The answer is one object, not a set of rows, so a caller with no entity still gets one row, whose `entities` is an empty array. The top level holds facts about the caller; every fact about an entity sits inside `entities`.
--
-- `password_set` is a fact about the caller: whether the caller's own account holds a password, as private.caller_password_set answers it for `auth.uid()`. It is there whether or not the caller edits anything, and it never says anything about another account, because nothing passed to this function reaches it.
--
-- `pending_email_taken` is a fact about the caller too: whether the address the caller's own account is changing to is already another account's, as private.caller_pending_email_taken answers it for `auth.uid()`; false when there is no pending address. Like `password_set` it is always there, and nothing passed to this function reaches it.
--
-- Only candidates and organizations are listed: factions and alliances have no arm. Project, account and global admins and holders of an entity-scope `admin` grant are listed with nothing, because only the editor grant makes an entity the caller's.
--
-- p_project_id is REQUIRED and carries no DEFAULT, because one identity may hold editor grants in several projects and only the project names which of them are asked for.
--
-- SECURITY INVOKER: the grant lookup, the password fact and the pending-address fact are the three definer calls on the path, each answering for `auth.uid()` alone, and which rows come back is still decided by the caller's own row-level security. An entity is therefore listed exactly when get_entity_user_data returns it.
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
    'password_set', private.caller_password_set(),
    'pending_email_taken', private.caller_pending_email_taken()
  );
$$;
