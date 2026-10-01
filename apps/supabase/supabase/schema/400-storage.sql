-- Storage RLS policies, cleanup triggers, and helper functions
--
-- Depends on:
-- - 000-enums.sql (grant_scope_type, grant_permission, storage_verb)
-- - 101-elections.sql (elections, constituency_groups, constituencies)
-- - 102-entities.sql (candidates, organizations, factions, alliances)
-- - 103-questions.sql (question_categories, questions)
-- - 104-nominations.sql (nominations)
-- - 301-auth-functions.sql (user_can, and the visibility helpers project_open_for_voters, entity_has_confirmed_nomination and nomination_entities_confirmed)
--
-- Provides:
-- - the pg_net extension, for async HTTP from triggers
-- - storage_config - the Storage API URL and service-role key the cleanup triggers use
-- - storage_path_can() - may this caller do this verb to this path; the storage layer's authority decision, delegated to user_can
-- - storage_path_is_public() - whether the object at a path is anon-readable; the tables' visibility rule, asked of a path
-- - delete_storage_object() - delete one whitelisted object via the Storage API (pg_net)
-- - referenced_storage_paths() - the object paths a row still references
-- - cleanup_entity_storage_files() - AFTER DELETE trigger for entity tables
-- - cleanup_old_image_file() - BEFORE UPDATE trigger for image columns
-- - cleanup_old_answer_files() - BEFORE UPDATE trigger for photos stored in answers
-- - RLS policies on storage.objects for the public-assets and private-assets buckets
--------------------------------------------------------------------------------
-- pg_net extension (async HTTP from triggers)
--------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_net
WITH
  SCHEMA extensions;

--------------------------------------------------------------------------------
-- storage_config: configuration table for storage cleanup triggers
--
-- One row per setting: `key` names it, `supabase_url` or `service_role_key`, and `value` holds it. The pg_net cleanup triggers read both to call the Storage API. seed.sql sets local dev defaults; in production, set the project's actual Supabase URL and service role key.
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storage_config (key text PRIMARY KEY, value text NOT NULL);

-- Only service_role and postgres can access storage_config (not exposed via API)
ALTER TABLE public.storage_config ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.storage_config
FROM
  anon,
  authenticated,
  public;

GRANT
SELECT
  ON TABLE public.storage_config TO service_role;

--------------------------------------------------------------------------------
-- storage_path_can: may this caller do this verb to this path, at this scope?
--
-- The storage layer's whole authority decision, delegated to `user_can` (301-auth-functions.sql) with the path's scope and id, and at entity scope with the entity type the type segment names. Fourteen of the fifteen policies on storage.objects call it and carry no predicate of their own; the anon read routes through storage_path_is_public instead, for the reason stated there.
--
-- The mapping describes the storage layout. For each of the eleven values the type segment can take (the ten tables carrying `cleanup_entity_storage_files`, whose path prefix is TG_TABLE_NAME, plus `project` for the project-level path), it names the permission that table's own policies ask, and `user_can` answers it. The role x permission matrix lives only in `grant_role_permissions`. An unrecognised segment denies.
--
-- The verb is an argument the body branches on, so read and write are separate questions. 20-storage-authority.test.sql asserts two read-but-not-write cases: an entity grantee reads another entity's publicly visible asset but may not write it, and a holder of `project.read_structure` without `project.edit_structure` reads an election's asset but may not write it.
--
-- Every segment is caller-controlled text, because the caller chooses `storage.objects.name`. So the id arguments are `text` and are cast only inside this function, whose exception arm denies. A policy casting segment [3] to uuid would raise on the project-level path, whose segment [3] is not a uuid, and abort the caller's whole statement instead of hiding one row.
--
-- The row must exist in the table the type segment names, and its own project must be the project the path claims. Without the lookup, a path could claim one entity type while carrying another type's id, and a project-scope caller could write into a path that names their project but carries another project's entity id.
--
-- SECURITY DEFINER with an empty search_path, so the type/id lookup reads the table itself rather than the rows the caller's row-level security admits; the authority answer still comes from `user_can` and the caller's own claim. `%I` quotes a table name the CASE has already restricted to ten literals, so the dynamic name is not caller-controlled.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.storage_path_can (
  p_scope public.grant_scope_type,
  p_project text,
  p_type text,
  p_id text,
  p_verb public.storage_verb
) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_permission public.grant_permission;
  v_project_id uuid;
  v_entity_id uuid;
  v_row_project uuid;
  v_entity_type public.entity_type;
BEGIN
  IF p_scope IS NULL OR p_type IS NULL OR p_verb IS NULL THEN
    RETURN false;
  END IF;

  -- The mapping. Each arm's two permissions are the ones that segment's own table policies ask: the four entity tables ask entity.read_answers / entity.edit_answers at entity scope and project.read_entities / project.edit_entities at project scope; elections, constituencies and constituency_groups ask project.read_structure / project.edit_structure; questions and question_categories ask project.read_structure / project.edit_questions; nominations ask project.read_entities / project.edit_nominations; and the project-level path is app_settings' own pair, project.read_structure / project.edit_app_settings.
  IF p_scope = 'entity' THEN
    -- Only the four entity tables have an entity-scope answer. The other seven segments are reachable at project scope only, so here they fall through and deny.
    v_permission := CASE
      WHEN p_type IN ('candidates', 'organizations', 'factions', 'alliances') THEN
        (CASE p_verb WHEN 'read' THEN 'entity.read_answers' ELSE 'entity.edit_answers' END)
      ELSE NULL
    END::public.grant_permission;
    v_entity_type := CASE p_type
      WHEN 'candidates' THEN 'candidate'
      WHEN 'organizations' THEN 'organization'
      WHEN 'factions' THEN 'faction'
      WHEN 'alliances' THEN 'alliance'
    END::public.entity_type;
  ELSIF p_scope = 'project' THEN
    v_permission := CASE
      WHEN p_type IN ('candidates', 'organizations', 'factions', 'alliances') THEN
        (CASE p_verb WHEN 'read' THEN 'project.read_entities' ELSE 'project.edit_entities' END)
      WHEN p_type IN ('elections', 'constituencies', 'constituency_groups') THEN
        (CASE p_verb WHEN 'read' THEN 'project.read_structure' ELSE 'project.edit_structure' END)
      WHEN p_type IN ('questions', 'question_categories') THEN
        (CASE p_verb WHEN 'read' THEN 'project.read_structure' ELSE 'project.edit_questions' END)
      WHEN p_type = 'nominations' THEN
        (CASE p_verb WHEN 'read' THEN 'project.read_entities' ELSE 'project.edit_nominations' END)
      WHEN p_type = 'project' THEN
        (CASE p_verb WHEN 'read' THEN 'project.read_structure' ELSE 'project.edit_app_settings' END)
      ELSE NULL
    END::public.grant_permission;
  ELSE
    -- account and global are not scopes a path names. A grant held at either still counts, because user_can asked at project or entity scope reaches down from the scopes above.
    RETURN false;
  END IF;

  -- The fall-through: an unrecognised type segment denies.
  IF v_permission IS NULL THEN
    RETURN false;
  END IF;

  v_project_id := p_project::uuid;

  -- The project-level path names no row, so there is nothing to pair it against.
  IF p_scope = 'project' AND p_type = 'project' THEN
    RETURN public.user_can('project', v_project_id, v_permission);
  END IF;

  v_entity_id := p_id::uuid;

  EXECUTE format('SELECT project_id FROM public.%I WHERE id = $1', p_type)
  INTO v_row_project
  USING v_entity_id;

  -- No row in the table the segment names: the type/id pairing refusal.
  IF v_row_project IS NULL THEN
    RETURN false;
  END IF;

  -- The row exists but lives in another project: the path-forgery refusal.
  IF v_row_project <> v_project_id THEN
    RETURN false;
  END IF;

  IF p_scope = 'entity' THEN
    RETURN public.user_can('entity', v_entity_id, v_permission, v_entity_type);
  END IF;

  RETURN public.user_can('project', v_project_id, v_permission);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

--------------------------------------------------------------------------------
-- storage_path_is_public: is the object at this path readable by the anonymous caller?
--
-- The public visibility rule, asked of a path instead of a row. Each branch restates, over path segments, the anon SELECT policy of the table its segment names, composed from 301-auth-functions.sql's helpers `project_open_for_voters`, `entity_has_confirmed_nomination` and `nomination_entities_confirmed`. It adds no rule of its own, so storage gives the same answer as the tables.
--
-- Not `user_can`: it denies a caller whose JWT carries no `grants` key, which is every anon caller, so an anon policy built on it would deny everything and the public application would render blank. The anon policy therefore asks about visibility, and the other fourteen ask about authority.
--
-- The project-level path is anon-readable only while the project is open for voters, like every other path. 20-storage-authority.test.sql asserts both directions.
--
-- The candidate branch carries the terms-of-use guards because `anon_select_candidates` does, and only `candidates` has the column. Without them a candidate's photo would be anon-fetchable while the candidate row stayed hidden.
--
-- An anon list request pays for this function on every object it reads. That cost is accepted because `public-assets` is a public bucket: Storage serves its downloads (`/object/public/...`, which the voter app uses, and `/object/authenticated/...`) without evaluating `storage.objects` RLS, only an anon `list` consults it, and no application code lists `public-assets` as anon. If the bucket is made private, every download becomes a policy evaluation, and the cost must be measured before that change ships.
--
-- The same hardening, and the same deny on a missing row or a raised error, as storage_path_can.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.storage_path_is_public (p_project text, p_type text, p_id text) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_project_id uuid;
  v_entity_id uuid;
  v_row_visible boolean;
BEGIN
  IF p_type IS NULL THEN
    RETURN false;
  END IF;

  v_project_id := p_project::uuid;

  -- The conjunct every branch carries, and the only one the project-level path has.
  IF NOT public.project_open_for_voters(v_project_id) THEN
    RETURN false;
  END IF;

  IF p_type = 'project' THEN
    RETURN true;
  END IF;

  v_entity_id := p_id::uuid;

  -- The five project-structure tables: their anon policies carry the project conjunct and nothing else, so the row need only exist in this project.
  IF p_type IN ('elections', 'constituencies', 'constituency_groups', 'questions', 'question_categories') THEN
    EXECUTE format('SELECT true FROM public.%I WHERE id = $1 AND project_id = $2', p_type)
    INTO v_row_visible
    USING v_entity_id, v_project_id;
    RETURN COALESCE(v_row_visible, false);
  END IF;

  -- nominations: anon_select_nominations' own three conjuncts.
  IF p_type = 'nominations' THEN
    SELECT n.confirmed AND private.nomination_entities_confirmed(n.id)
    INTO v_row_visible
    FROM public.nominations n
    WHERE n.id = v_entity_id AND n.project_id = v_project_id;
    RETURN COALESCE(v_row_visible, false);
  END IF;

  -- The four entity tables: the entity's own confirmation flag, the terms-of-use guards where the table has them, and a confirming nomination in this project.
  IF p_type IN ('candidates', 'organizations', 'factions', 'alliances') THEN
    EXECUTE format(
      'SELECT e.confirmed %s FROM public.%I e WHERE e.id = $1 AND e.project_id = $2',
      CASE WHEN p_type = 'candidates'
        THEN 'AND e.terms_of_use_accepted IS NOT NULL AND e.terms_of_use_accepted < now()'
        ELSE '' END,
      p_type
    )
    INTO v_row_visible
    USING v_entity_id, v_project_id;

    IF NOT COALESCE(v_row_visible, false) THEN
      RETURN false;
    END IF;

    RETURN private.entity_has_confirmed_nomination(
      (CASE p_type
        WHEN 'candidates' THEN 'candidate'
        WHEN 'organizations' THEN 'organization'
        WHEN 'factions' THEN 'faction'
        ELSE 'alliance'
      END)::public.entity_type,
      v_entity_id,
      v_project_id
    );
  END IF;

  RETURN false;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- =====================================================================
-- Storage RLS policies on storage.objects
--
-- Path format: {project_id}/{entity_type}/{entity_id}/filename.ext
-- - (storage.foldername(storage.objects.name))[1] = project_id
-- - (storage.foldername(storage.objects.name))[2] = entity_type
-- - (storage.foldername(storage.objects.name))[3] = entity_id
--
-- IMPORTANT: Always use storage.objects.name (not bare 'name') to avoid ambiguity with entity tables that have a jsonb 'name' column.
--
-- Every policy below is a bucket comparison plus helper calls and nothing else: none re-derives a rule `user_can` answers, names an entity type, compares an identity column or reads a publication flag.
--
-- Two questions, two functions. `storage_path_can` answers authority (may this caller do this verb to this path) and delegates to `user_can`; `storage_path_is_public` answers visibility (is this path's object public at all). The fourteen authenticated policies ask the first and the anon policy asks the second, because `user_can` denies every anon caller. The authenticated read of the public bucket also asks the second, since either answer admits that read.
--
-- Each write verb has an entity-scope and a project-scope policy per bucket, and PostgreSQL ORs them. The scope literal is the only difference within a pair: with the bucket literal replaced, a verb's expressions reduce to one string per scope, which 20-storage-authority.test.sql asserts from `pg_policies`.
--
-- The `(SELECT fn (...))` wrapping is this codebase's convention for helper calls in policies, as on the content-table policies.
-- =====================================================================
-- =====================================================================
-- public-assets bucket: SELECT policies
-- =====================================================================
-- Anon: the public visibility rule, asked of a path.
--
-- Not `user_can`: an anon session carries no `grants` claim, so an authority-based allow decision here would deny everything (see storage_path_is_public).
CREATE POLICY "anon_select_public_assets" ON storage.objects FOR
SELECT
  TO anon USING (
    bucket_id = 'public-assets'
    AND (
      SELECT
        storage_path_is_public (
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3]
        )
    )
  );

-- Authenticated: anything the anon reader can see, plus anything this caller has the authority to read at either scope. Three disjuncts, three helper calls, no predicate of its own.
CREATE POLICY "authenticated_select_public_assets" ON storage.objects FOR
SELECT
  TO authenticated USING (
    bucket_id = 'public-assets'
    AND (
      (
        SELECT
          storage_path_is_public (
            (storage.foldername (storage.objects.name)) [1],
            (storage.foldername (storage.objects.name)) [2],
            (storage.foldername (storage.objects.name)) [3]
          )
      )
      OR (
        SELECT
          storage_path_can (
            'entity',
            (storage.foldername (storage.objects.name)) [1],
            (storage.foldername (storage.objects.name)) [2],
            (storage.foldername (storage.objects.name)) [3],
            'read'
          )
      )
      OR (
        SELECT
          storage_path_can (
            'project',
            (storage.foldername (storage.objects.name)) [1],
            (storage.foldername (storage.objects.name)) [2],
            (storage.foldername (storage.objects.name)) [3],
            'read'
          )
      )
    )
  );

-- =====================================================================
-- private-assets bucket: SELECT policies
-- =====================================================================
-- Authenticated: authority only. Nothing in the private bucket is public, so there is no visibility disjunct: a path whose object would be anon-visible in the public bucket confers nothing here. There is no anon policy on this bucket.
CREATE POLICY "authenticated_select_private_assets" ON storage.objects FOR
SELECT
  TO authenticated USING (
    bucket_id = 'private-assets'
    AND (
      (
        SELECT
          storage_path_can (
            'entity',
            (storage.foldername (storage.objects.name)) [1],
            (storage.foldername (storage.objects.name)) [2],
            (storage.foldername (storage.objects.name)) [3],
            'read'
          )
      )
      OR (
        SELECT
          storage_path_can (
            'project',
            (storage.foldername (storage.objects.name)) [1],
            (storage.foldername (storage.objects.name)) [2],
            (storage.foldername (storage.objects.name)) [3],
            'read'
          )
      )
    )
  );

-- =====================================================================
-- The twelve write policies: three verbs x two scopes x two buckets
--
-- Each name leads with the scope its helper call asks at (`entity_` or `project_`), not with an entity type or an actor: the entity type is an argument of the helper, and the project-scope write permissions are held by project editors as well as admins.
-- =====================================================================
CREATE POLICY "entity_insert_public_assets" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id = 'public-assets'
    AND (
      SELECT
        storage_path_can (
          'entity',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "project_insert_public_assets" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id = 'public-assets'
    AND (
      SELECT
        storage_path_can (
          'project',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "entity_insert_private_assets" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id = 'private-assets'
    AND (
      SELECT
        storage_path_can (
          'entity',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "project_insert_private_assets" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id = 'private-assets'
    AND (
      SELECT
        storage_path_can (
          'project',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "entity_update_public_assets" ON storage.objects
FOR UPDATE
  TO authenticated USING (
    bucket_id = 'public-assets'
    AND (
      SELECT
        storage_path_can (
          'entity',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  )
WITH
  CHECK (
    bucket_id = 'public-assets'
    AND (
      SELECT
        storage_path_can (
          'entity',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "project_update_public_assets" ON storage.objects
FOR UPDATE
  TO authenticated USING (
    bucket_id = 'public-assets'
    AND (
      SELECT
        storage_path_can (
          'project',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  )
WITH
  CHECK (
    bucket_id = 'public-assets'
    AND (
      SELECT
        storage_path_can (
          'project',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "entity_update_private_assets" ON storage.objects
FOR UPDATE
  TO authenticated USING (
    bucket_id = 'private-assets'
    AND (
      SELECT
        storage_path_can (
          'entity',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  )
WITH
  CHECK (
    bucket_id = 'private-assets'
    AND (
      SELECT
        storage_path_can (
          'entity',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "project_update_private_assets" ON storage.objects
FOR UPDATE
  TO authenticated USING (
    bucket_id = 'private-assets'
    AND (
      SELECT
        storage_path_can (
          'project',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  )
WITH
  CHECK (
    bucket_id = 'private-assets'
    AND (
      SELECT
        storage_path_can (
          'project',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "entity_delete_public_assets" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'public-assets'
  AND (
    SELECT
      storage_path_can (
        'entity',
        (storage.foldername (storage.objects.name)) [1],
        (storage.foldername (storage.objects.name)) [2],
        (storage.foldername (storage.objects.name)) [3],
        'write'
      )
  )
);

CREATE POLICY "project_delete_public_assets" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'public-assets'
  AND (
    SELECT
      storage_path_can (
        'project',
        (storage.foldername (storage.objects.name)) [1],
        (storage.foldername (storage.objects.name)) [2],
        (storage.foldername (storage.objects.name)) [3],
        'write'
      )
  )
);

CREATE POLICY "entity_delete_private_assets" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'private-assets'
  AND (
    SELECT
      storage_path_can (
        'entity',
        (storage.foldername (storage.objects.name)) [1],
        (storage.foldername (storage.objects.name)) [2],
        (storage.foldername (storage.objects.name)) [3],
        'write'
      )
  )
);

CREATE POLICY "project_delete_private_assets" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'private-assets'
  AND (
    SELECT
      storage_path_can (
        'project',
        (storage.foldername (storage.objects.name)) [1],
        (storage.foldername (storage.objects.name)) [2],
        (storage.foldername (storage.objects.name)) [3],
        'write'
      )
  )
);

-- =====================================================================
-- Storage file deletion helper (via pg_net async HTTP)
-- =====================================================================
--------------------------------------------------------------------------------
-- delete_storage_object: delete one object via the Storage API
--
-- One object per call, through the single-object route: `DELETE <storage_config.supabase_url>/storage/v1/object/<bucket>/<path>`, sent by pg_net with only `Authorization: Bearer <service_role_key>`. The bulk route accepts only a DELETE with a JSON body, which pg_net's `http_delete` cannot send. Storage never expands a folder prefix, so a caller that means a folder enumerates its objects and calls this once per object.
--
-- The path is untrusted and goes into a URL sent with the service-role key: a stored image path is written by the entity's own editor, and pg_net (libcurl) resolves `..` segments before sending and keeps a query string, so an unchecked path could reach any Storage route, or with enough `..` any Kong route, as a service-role request. So before any URL is built, the bucket must be `public-assets` or `private-assets` and the path must match the upload convention exactly: `<uuid>/<table>/<uuid>/<uuid>.<ext>`, every uuid canonical lowercase, `<table>` one of the ten tables that carry the cleanup triggers, and `<ext>` one of `jpg jpeg png webp gif avif` (the `ALLOWED_IMAGE_EXTENSIONS` set in `supabaseDataWriter.ts`). Anything else, including a folder prefix, a dev-seed name that is not a uuid, an uppercase uuid or a trailing slash, raises a WARNING and sends nothing. A legitimate object under another name is therefore never deleted: that leak is recoverable, where a forged delete is not.
--
-- Not callable by any API role. EXECUTE is revoked from PUBLIC, anon and authenticated below; otherwise the default privileges would publish it as `/rest/v1/rpc/delete_storage_object` and let any caller delete any object with the service-role key. Only the SECURITY DEFINER cleanup triggers call it, and they run as the owner.
--
-- Object names are random UUIDs (`supabaseDataWriter.#uploadCandidateFile`), and cleanup deletes the object a row stops referencing. A file that was public stays reachable by its URL after its entity is unpublished, because unpublishing cannot recall copies already taken; that is accepted.
--
-- The triggers act on row changes as they happen. No sweep removes objects orphaned without a triggering change.
--
-- Degrades to a WARNING and no request when `storage_config` lacks `supabase_url` or `service_role_key`, and when pg_net raises.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_storage_object (p_bucket text, p_file_path text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  base_url text;
  service_key text;
BEGIN
  -- The whitelist runs before anything reads the config or builds a URL.
  IF p_bucket IS NULL
    OR p_bucket NOT IN ('public-assets', 'private-assets')
    OR p_file_path IS NULL
    OR p_file_path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(alliances|candidates|constituencies|constituency_groups|elections|factions|nominations|organizations|question_categories|questions)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|gif|avif)$'
  THEN
    RAISE WARNING 'Storage cleanup refused a path outside the upload convention: bucket %, path %', p_bucket, p_file_path;
    RETURN;
  END IF;

  SELECT value INTO base_url FROM public.storage_config WHERE key = 'supabase_url';
  SELECT value INTO service_key FROM public.storage_config WHERE key = 'service_role_key';

  IF base_url IS NULL OR service_key IS NULL THEN
    RAISE WARNING 'Storage cleanup skipped: missing supabase_url or service_role_key in storage_config';
    RETURN;
  END IF;

  PERFORM net.http_delete(
    url := base_url || '/storage/v1/object/' || p_bucket || '/' || p_file_path,
    headers := jsonb_build_object('Authorization', 'Bearer ' || service_key)
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Storage cleanup failed for %/%: %', p_bucket, p_file_path, SQLERRM;
END;
$$;

--------------------------------------------------------------------------------
-- referenced_storage_paths: every object path a row still references
--
-- The distinct non-empty strings among the row's `image.path` and `image.pathDark` and, for every entry of its `answers` object whose `value` is an object, that value's `path` and `pathDark`; an empty array when there are none. The cleanup triggers never delete a path this returns for the NEW row, which is what keeps a swap of `path` and `pathDark`, an `alt`-only edit or a photo moved into an answer from destroying a file still in use.
--
-- It reads the row as jsonb so one helper serves every table: the image trigger is attached to ten tables and only `candidates` and `organizations` carry an `answers` column, and a missing key reads as no reference.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.referenced_storage_paths (p_row jsonb) RETURNS text[] LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT coalesce(array_agg(DISTINCT refs.p) FILTER (WHERE refs.p IS NOT NULL AND refs.p <> ''), ARRAY[]::text[])
  FROM (
    SELECT p_row -> 'image' ->> 'path' AS p
    UNION ALL
    SELECT p_row -> 'image' ->> 'pathDark'
    UNION ALL
    SELECT a.value -> 'value' ->> k.key
    FROM jsonb_each(CASE WHEN jsonb_typeof(p_row -> 'answers') = 'object' THEN p_row -> 'answers' ELSE '{}'::jsonb END) AS a
    CROSS JOIN (VALUES ('path'), ('pathDark')) AS k (key)
    WHERE jsonb_typeof(a.value -> 'value') = 'object'
  ) AS refs (p);
$$;

-- Only the SECURITY DEFINER cleanup triggers call these two; the owner keeps EXECUTE.
REVOKE
EXECUTE ON FUNCTION public.delete_storage_object (text, text)
FROM
  PUBLIC,
  anon,
  authenticated;

REVOKE
EXECUTE ON FUNCTION public.referenced_storage_paths (jsonb)
FROM
  PUBLIC,
  anon,
  authenticated;

-- =====================================================================
-- Entity deletion cleanup trigger
-- =====================================================================
--------------------------------------------------------------------------------
-- cleanup_entity_storage_files: AFTER DELETE trigger
--
-- When an entity row is deleted, deletes every object in its own folder `<OLD.project_id>/<TG_TABLE_NAME>/<OLD.id>/` in both `public-assets` and `private-assets`, one single-object DELETE per object via `delete_storage_object` (pg_net, sent only after the deleting transaction commits).
--
-- The folder is enumerated because Storage deletes exact object names only and never expands a prefix: the trigger reads the folder's object names from `storage.objects` and calls `delete_storage_object` once per name.
--
-- `starts_with`, not LIKE. `_` is a LIKE wildcard and two of the ten tables carry it (`constituency_groups`, `question_categories`), so `name LIKE prefix || '%'` would also match a lookalike folder such as `<project>/constituencyXgroups/<id>/`. `starts_with` compares the prefix literally.
--
-- Every name still passes the whitelist. Each enumerated name goes through `delete_storage_object`'s bucket and upload-convention check, so a stray name in the folder (a `notes.txt`, a dev-seed name that is not a uuid) is left in place with a WARNING: a leak, never a destroy. The enumeration never leaves the deleted row's own folder, and no second URL-building path exists.
--
-- One `storage.objects` scan per deleted row, so a bulk delete of many entities scans once per row.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_entity_storage_files () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  path_prefix text;
  bucket text;
  object_name text;
BEGIN
  -- The row's own folder: {project_id}/{TG_TABLE_NAME}/{id}/, the table name being the entity-type path segment.
  path_prefix := OLD.project_id::text || '/' || TG_TABLE_NAME || '/' || OLD.id::text || '/';

  FOREACH bucket IN ARRAY ARRAY['public-assets', 'private-assets']
  LOOP
    FOR object_name IN
      SELECT o.name
      FROM storage.objects AS o
      WHERE o.bucket_id = bucket
        AND starts_with(o.name, path_prefix)
    LOOP
      PERFORM public.delete_storage_object(bucket, object_name);
    END LOOP;
  END LOOP;

  RETURN OLD;
END;
$$;

-- Attach entity deletion cleanup trigger to all entity tables with project_id
CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.elections FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.constituencies FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.constituency_groups FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.question_categories FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.questions FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

-- =====================================================================
-- Image column update cleanup trigger
-- =====================================================================
--------------------------------------------------------------------------------
-- cleanup_old_image_file: BEFORE UPDATE trigger
--
-- When an entity's `image` changes, deletes the old `path` and `pathDark` objects the NEW row does not use. It acts only when the image column changed.
--
-- Own folder only. An old path is deleted only when it starts with the row's own folder `<OLD.project_id>/<TG_TABLE_NAME>/<OLD.id>/`. A stored path is written by the entity's editor, so without this a candidate could point its image at another candidate's, another table's or another project's public photo and then replace it, and the trigger would delete the victim's file with the service-role key. `delete_storage_object` then checks the exact upload convention on top.
--
-- Never a path the NEW row still references. The NEW row's references come from `referenced_storage_paths (to_jsonb (NEW))`: its `image.path`, `image.pathDark` and every answer value's `path` and `pathDark`. So swapping `path` and `pathDark`, changing only `alt`, or moving the photo into an answer deletes nothing. It reads `to_jsonb (NEW)` rather than `NEW.answers` because this trigger is attached to ten tables and only two of them carry `answers`.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_old_image_file () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  own_folder text;
  still_referenced text[];
  old_path text;
BEGIN
  -- Only act if the image column actually changed
  IF OLD.image IS NOT DISTINCT FROM NEW.image THEN
    RETURN NEW;
  END IF;

  IF OLD.image IS NULL OR jsonb_typeof(OLD.image) <> 'object' THEN
    RETURN NEW;
  END IF;

  own_folder := OLD.project_id::text || '/' || TG_TABLE_NAME || '/' || OLD.id::text || '/';
  still_referenced := public.referenced_storage_paths(to_jsonb(NEW));

  FOR old_path IN
    SELECT DISTINCT candidate_path
    FROM unnest(ARRAY[OLD.image ->> 'path', OLD.image ->> 'pathDark']) AS old_paths (candidate_path)
    WHERE candidate_path IS NOT NULL AND candidate_path <> ''
  LOOP
    IF starts_with(old_path, own_folder) AND NOT (old_path = ANY (still_referenced)) THEN
      PERFORM public.delete_storage_object('public-assets', old_path);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Attach image cleanup trigger to all entity tables with an image column
CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.elections FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.constituencies FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.constituency_groups FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.question_categories FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.questions FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

-- =====================================================================
-- Answer photo cleanup trigger
-- =====================================================================
--------------------------------------------------------------------------------
-- cleanup_old_answer_files: BEFORE UPDATE trigger on candidates and organizations
--
-- When a row's `answers` change, deletes every old answer photo the NEW row does not reference: each `value.path` and `value.pathDark` of an OLD answer whose `value` is an object. That covers a replaced photo, a removed answer key and the key `cascade_question_delete_to_jsonb_answers` strips when a question is deleted.
--
-- Detected by value shape, never by a `questions` join. An answer holds a photo when its `value` is a JSON object (the StoredImage shape `validate_image` accepts); no other answer type stores an object there. Asking `questions.type = 'image'` instead would miss the cascade case: the strip is an UPDATE run by an AFTER DELETE trigger on `questions`, so the question row is already gone when this trigger sees the change.
--
-- The same two limits as `cleanup_old_image_file`. An old path is deleted only when it starts with the row's own folder `<OLD.project_id>/<TG_TABLE_NAME>/<OLD.id>/`, so an answer pointed at another entity's or project's photo can never get it deleted, and only when `referenced_storage_paths (to_jsonb (NEW))` does not return it, so a photo moved into `image` or into another answer stays. `delete_storage_object` then checks the bucket and the exact upload convention on top.
--
-- BEFORE UPDATE is safe because no BEFORE UPDATE trigger on either table assigns `NEW.answers` or `NEW.image` (`enforce_entity_immutability`, `enforce_external_id_immutability`, `update_updated_at`, `validate_answers_jsonb` and `cleanup_old_image_file` only read or raise), so the NEW row seen here is the row that is written; if the statement later fails, its enqueued request is rolled back with it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_old_answer_files () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  own_folder text;
  still_referenced text[];
  old_path text;
BEGIN
  -- Only act if the answers column actually changed
  IF OLD.answers IS NOT DISTINCT FROM NEW.answers THEN
    RETURN NEW;
  END IF;

  own_folder := OLD.project_id::text || '/' || TG_TABLE_NAME || '/' || OLD.id::text || '/';
  still_referenced := public.referenced_storage_paths(to_jsonb(NEW));

  FOR old_path IN
    SELECT unnest(public.referenced_storage_paths(jsonb_build_object('answers', OLD.answers)))
  LOOP
    IF starts_with(old_path, own_folder) AND NOT (old_path = ANY (still_referenced)) THEN
      PERFORM public.delete_storage_object('public-assets', old_path);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Attach answer photo cleanup trigger to the two tables that carry answers
CREATE TRIGGER cleanup_answer_files_on_update
BEFORE UPDATE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_answer_files ();

CREATE TRIGGER cleanup_answer_files_on_update
BEFORE UPDATE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_answer_files ();

-- Note: the cleanup triggers need supabase_url and service_role_key in storage_config. seed.sql sets the local dev values; in production, set the actual values.
