-- Storage RLS policies, cleanup triggers, and helper functions
--
-- Depends on: 301-auth-functions.sql  (user_can, and the three visibility helpers project_open_for_voters, entity_has_confirmed_nomination, nomination_entities_confirmed) 000-enums.sql       (grant_scope_type, grant_permission, storage_verb) 102-entities.sql    (candidates, organizations, factions, alliances) 101-elections.sql   (elections, constituency_groups, constituencies) 103-questions.sql   (question_categories, questions) 104-nominations.sql (nominations)
--
-- Provides: pg_net extension for async HTTP triggers storage_path_can()             - MAY THIS CALLER DO THIS VERB TO THIS PATH: the storage layer's whole authority decision, delegated to user_can storage_path_is_public()       - is this path's object anon-readable: section 3.4's rule, asked of a path delete_storage_object()        - delete ONE whitelisted object via the Storage API (pg_net) referenced_storage_paths()     - the object paths a row still references cleanup_entity_storage_files() - AFTER DELETE trigger for entity tables cleanup_old_image_file()       - BEFORE UPDATE trigger for image columns cleanup_old_answer_files()     - BEFORE UPDATE trigger for photos stored in answers RLS policies on storage.objects for public-assets and private-assets buckets
--------------------------------------------------------------------------------
-- pg_net extension (async HTTP from triggers)
--------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_net
WITH
  SCHEMA extensions;

--------------------------------------------------------------------------------
-- storage_config: configuration table for storage cleanup triggers
--
-- Stores supabase_url and service_role_key needed by pg_net triggers to call the Storage API. Seeded in seed.sql with local dev defaults.
-- In production, update values for the actual Supabase URL and service role key.
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
-- storage_path_can: MAY THIS CALLER DO THIS VERB TO THIS PATH, at this scope?
--
-- The storage layer's whole authority decision, delegated to `user_can` (301-auth-functions.sql) and to nothing else. Fourteen of the fifteen policies on storage.objects call this and carry no predicate of their own; the fifteenth is the anon read, which routes through storage_path_is_public below for the reason stated there.
--
-- THE MAPPING IS A STATEMENT ABOUT THE STORAGE LAYOUT, NOT A ROW OF SECTION 3.3. It names WHICH question to ask -- for each of the eleven values the type path segment can take, the permission that segment's OWN table policy asks -- and `user_can` answers it. The role x permission matrix lives in `grant_role_permissions` and in no other function body, this one included; every arm below was read off the applied `pg_policies` catalogue for the table it names, cell by cell, rather than inferred.
-- Ratified 2026-09-16, 162-CHECKPOINT-DECISIONS.md section 7 item T-2, option (A): all eleven segments, one CASE, fall-through denies. The vocabulary is ELEVEN values and not the four the operator's A4 note names -- the ten tables carrying `cleanup_entity_storage_files`, which builds the path prefix from TG_TABLE_NAME, plus `project` for the project-level path.
--
-- THE VERB IS A DECLARED ARGUMENT THE BODY BRANCHES ON, which is what makes read and write separable (K2's operator amendment). The two read-but-not-write identities in 20-storage-authority.test.sql are what that separability is worth: an entity grantee READS another entity's publicly visible asset and may not write it, and a caller holding `project.read_structure` and not `project.edit_structure` READS an election's asset and may not write it. The second exists only because the type segment maps to a permission rather than to a boolean.
--
-- EVERY SEGMENT ARRIVES AS ATTACKER-CONTROLLED TEXT. `storage.objects.name` is chosen by the caller, which is what distinguishes this file from the eighty-nine table policies where the object identity is a typed column. So both id arguments are `text` and NOTHING is cast outside the exception arm: measured on this database before this function was written, a policy casting segment [3] straight to uuid raises `invalid input syntax for type uuid: "settings"` on the project-level path, which aborts the caller's WHOLE statement and hides every legitimate row with it rather than hiding one.
--
-- THE ROW MUST EXIST IN THE TABLE THE TYPE SEGMENT NAMES, and its own project must be the project the path claims. Asking `user_can` on the bare uuid would provide neither, and would admit a path claiming one entity type while carrying another type's id -- a forgery the caller's own grant would then authorise. The second is the consistency conjunct ratified at 162-CHECKPOINT-DECISIONS.md section 7 item T-3, option (A), and it closes a gap that exists TODAY: the project-scope policies check segment [1] and never check that the entity the path names is in that project, so an admin of one project can write into a path naming their project and carrying another project's entity id. One comparison, on a lookup that already runs. Measured risk bound before it was added: of 327 seeded objects, zero carry a segment [1] that disagrees with the named row's project_id.
--
-- `%I` over a value the CASE above has already restricted to ten literal table names, so the dynamic name is not caller-controlled by the time it reaches `format`.
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
BEGIN
  IF p_scope IS NULL OR p_type IS NULL OR p_verb IS NULL THEN
    RETURN false;
  END IF;

  -- The mapping. Each arm's two permissions are the ones that segment's own table policy asks, read from pg_policies: the four entity tables ask entity.read_answers / entity.edit_answers at entity scope and project.read_entities / project.edit_entities at project scope; elections, constituencies and constituency_groups ask project.read_structure / project.edit_structure; questions and question_categories ask project.read_structure / project.edit_questions; nominations ask project.read_entities / project.edit_nominations; and the project-level path is app_settings' own pair, project.read_structure / project.edit_app_settings.
  IF p_scope = 'entity' THEN
    -- Only the four entity tables have an entity-scope answer at all. The other seven segments are reachable at project scope only, which is what they have today; here they fall through and deny.
    v_permission := CASE
      WHEN p_type IN ('candidates', 'organizations', 'factions', 'alliances') THEN
        (CASE p_verb WHEN 'read' THEN 'entity.read_answers' ELSE 'entity.edit_answers' END)
      ELSE NULL
    END::public.grant_permission;
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
    -- account and global are not scopes a path names. user_can reaches downward from them anyway.
    RETURN false;
  END IF;

  -- The fall-through. An unrecognised type segment is a DENIAL and never a project-scope free-for-all.
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

  -- No row in the table the segment NAMES: the type/id pairing refusal.
  IF v_row_project IS NULL THEN
    RETURN false;
  END IF;

  -- The row exists but lives in another project: the path-forgery refusal (T-3).
  IF v_row_project <> v_project_id THEN
    RETURN false;
  END IF;

  IF p_scope = 'entity' THEN
    RETURN public.user_can('entity', v_entity_id, v_permission);
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
-- 162-IMPLEMENTATION-BRIEF.md section 3.4, asked of a path instead of a row, and composed from the two visibility helpers 162-08 defined -- `project_open_for_voters` and `entity_has_confirmed_nomination` -- plus `nomination_entities_confirmed` for the nominations segment. It adds no RULE of its own: each branch below is the anon SELECT policy of the table that segment names, read from pg_policies and restated here over path segments. The storage layer therefore gives the same answer as the table layer, which is the whole of criterion 6.
--
-- WHY THIS IS NOT `user_can`. 162-04 resolved the `empty` edge by denying a caller whose JWT carries no `grants` key, and that is EVERY anon caller. An anon policy whose allow decision is a `user_can` call therefore denies everything and the public application renders blank. So the anon policy routes through visibility and the other fourteen route through authority, and "one mechanism, not a parallel implementation" holds because this function is the ONLY statement of the visibility rule this file makes -- it composes 301-auth-functions.sql's helpers and states nothing of its own. D-27, and 162-14's flagged assumptions.
--
-- THE PROJECT-LEVEL PATH IS A TIGHTENING, STATED AS ONE. The `project` segment was answered `true` unconditionally before this wave, which made a CLOSED project's assets world-readable.
-- Section 3.4 says project structure is anon-readable only when the project is open for voters, so the project conjunct now applies to it as it does to everything else. Both directions are asserted in 20-storage-authority.test.sql so the tightening cannot become a blanket denial unnoticed.
--
-- THE CANDIDATE BRANCH CARRIES THE TERMS-OF-USE GUARDS because `anon_select_candidates` does, and only `candidates` has the column. Composing the three helpers WITHOUT them would make a candidate's photo anon-fetchable while the candidate row itself stayed hidden -- storage disagreeing with tables, in the one direction a passing read test cannot report.
--
-- RESIDUAL (b) IS ACCEPTED, AND THE ACCEPTANCE IS COUPLED (162.1 D-04). This function makes an anon storage list read about 6.4x slower than the pre-grant-model policy (4.890 ms to about 31.2 ms, measured in 162-14), and it is kept as it is because nothing the application does pays that cost. `public-assets` is a public bucket, so Storage serves its downloads -- `/object/public/...`, which the voter app uses, and `/object/authenticated/...` alike -- without evaluating `storage.objects` RLS at all (spike 027, observed with this policy forced to `USING (false)`); only an anon `list` request consults it, and no application code lists `public-assets` as anon.
--
-- ⚠ IF THE BUCKET IS EVER MADE PRIVATE, THIS ACCEPTANCE LAPSES. Every download then becomes a policy evaluation, residual (b) becomes a cost on the voter's image path, and it must be re-measured before that change ships.
--
-- Same hardening and the same deny-on-no-row, deny-on-raise posture as storage_path_can above.
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

  -- The six project-structure families: their anon policies carry the project conjunct and nothing else, so the row need only exist IN THIS PROJECT.
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

  -- The four entity tables: the entity's own confirmation flag, the terms-of-use guards where the table has them, and a confirming nomination IN THIS PROJECT.
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
-- Path format: {project_id}/{entity_type}/{entity_id}/filename.ext (storage.foldername(storage.objects.name))[1] = project_id (storage.foldername(storage.objects.name))[2] = entity_type (storage.foldername(storage.objects.name))[3] = entity_id
--
-- IMPORTANT: Always use storage.objects.name (not bare 'name') to avoid ambiguity with entity tables that have a jsonb 'name' column.
--
-- EVERY ONE OF THE FIFTEEN POLICIES BELOW IS A BUCKET COMPARISON AND A HELPER CALL, AND NOTHING ELSE.
-- Not one of them re-derives a rule `user_can` already answers, names an entity type, compares an identity column, or reads a publication flag. Before this wave, eight routed through the legacy project predicate and seven did not; twelve inline self-ownership comparisons sat in eight of them, four of those inside policies that ALSO called the predicate. All three figures are now zero, read from `pg_policies` on the applied database rather than from this file (162-14, D-03, A3(a)).
--
-- TWO QUESTIONS, TWO FUNCTIONS, AND THE SPLIT IS NOT A HEDGE. `storage_path_can` answers AUTHORITY -- may this caller do this verb to this path -- and delegates it to `user_can`. `storage_path_is_public` answers VISIBILITY -- is this path's object public at all -- and composes 162-08's helpers. The fourteen authenticated policies ask the first; the anon policy asks the second, because `user_can` denies a caller whose JWT carries no `grants` key and that is every anon caller (D-27). A public-bucket read by an authenticated caller is legitimately either question, so that one policy asks both -- which is two different questions of two different functions, not a re-derivation.
--
-- THE SCOPE LITERAL IS THE ONLY DIFFERENCE BETWEEN A PAIR. Each write verb has an entity-scope policy and a project-scope policy per bucket; PostgreSQL ORs them. Normalised by replacing the bucket literal, the expressions of a verb collapse to exactly ONE string per scope -- D-21 made structural, by the same technique 162-10 used on the table dimension, asserted from `pg_policies` in 20-storage-authority.test.sql rather than argued here.
--
-- The `(SELECT fn (...))` wrapping is this codebase's optimizer convention, as on the eighty-nine content table policies.
-- =====================================================================
-- =====================================================================
-- public-assets bucket: SELECT policies
-- =====================================================================
-- Anon: the public visibility rule of 162-IMPLEMENTATION-BRIEF.md section 3.4, asked of a path.
--
-- Deliberately NOT `user_can`. See storage_path_is_public's own header: an anon session carries no `grants` claim, so an authority-based allow decision here denies everything and the public application renders blank.
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
-- Authenticated: AUTHORITY ONLY, and the absence of a visibility disjunct here is the point. Nothing in the private bucket is public, so a path whose object would be anon-visible in the public bucket confers nothing here. There is no anon policy on this bucket at all.
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
-- RENAMED under D-21's naming clause (162-CHECKPOINT-DECISIONS.md section 7 item T-4, names approved).
-- The six `candidate_*` names carried an entity type the predicate now takes as an argument; the six `admin_*` names carried an actor the conversion makes untrue, because a project EDITOR holds the project-scope write permissions under section 3.3. The actor segment is now the SCOPE the predicate asks at, which is what each expression actually says.
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
-- delete_storage_object: delete ONE object via the Storage API
--
-- ONE OBJECT PER CALL, THROUGH THE SINGLE-OBJECT ROUTE. The request is `DELETE <storage_config.supabase_url>/storage/v1/object/<bucket>/<path>`, sent by pg_net with nothing but `Authorization: Bearer <service_role_key>`; a live probe of that route answered `200 {"message":"Successfully deleted"}` and the object row was gone within about three seconds. The bulk route this function used to call accepts only DELETE with a JSON body, which pg_net 0.14's `http_delete` cannot send, so every call from `11f877913` (2026-08-17) until 162.1 was a POST that Storage answered 404 and nothing deleted (spike 029 F4). Storage never expands a folder prefix on either route, so a caller that means a folder must enumerate its objects and call this once per object.
--
-- ⚠ THE PATH IS UNTRUSTED AND GOES INTO A SERVICE-ROLE URL (162.1 D-20). A stored image path is written by the entity's own editor, and this function puts it into a URL sent with the service-role key. pg_net (libcurl) resolves `..` segments before sending and keeps a query string: a probe of `.../object/public/public-assets/x/../../../../rest/v1/elections?select=id&limit=1` arrived as `Route GET:/rest/v1/elections?select=id&limit=1`, so an unchecked path reaches any Storage route and, with enough `..`, any Kong route, as a service-role DELETE. So BEFORE any URL is built, the bucket must be `public-assets` or `private-assets` and the path must be EXACTLY the upload convention: `<uuid>/<table>/<uuid>/<uuid>.<ext>`, every uuid canonical lowercase, `<table>` one of the ten tables that carry the cleanup triggers, `<ext>` one of `jpg jpeg png webp gif avif` (the set `ALLOWED_IMAGE_EXTENSIONS` in `supabaseDataWriter.ts` uploads under). Anything else, including a folder prefix, a dev-seed name that is not a uuid, an uppercase uuid or a trailing slash, raises a WARNING and sends nothing. A legitimate object under another name is therefore never deleted by this function: that is a leak, which is recoverable, where a forged delete is not.
--
-- NOT CALLABLE BY ANY API ROLE. EXECUTE is revoked from PUBLIC, anon and authenticated directly below; without that, the default privileges would publish it as `/rest/v1/rpc/delete_storage_object` and let any caller delete any object with the service-role key. Only the SECURITY DEFINER cleanup triggers call it, and they run as the owner.
--
-- POLICY C1+ (162.1 D-10). Object names are random UUIDs (the status quo in `supabaseDataWriter.#uploadCandidateFile`), and cleanup deletes the object a row stops referencing. The ACCEPTED residual is S2: a file that was public stays reachable by its URL after its entity is unpublished, because unpublishing cannot recall copies already taken (spike 029).
--
-- KNOWN RESIDUE (162.1 D-18). Objects orphaned between `11f877913` (2026-08-17) and this fix are still stored and public. These triggers act on future changes only, and no sweep is run.
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
-- THE FOLDER IS ENUMERATED, BECAUSE STORAGE NEVER EXPANDS A PREFIX (162.1 D-12). Storage deletes exact object names only, so this trigger reads the folder's object names from `storage.objects` and calls `delete_storage_object` once per name. Until 162.1 it passed the folder prefix itself, which Storage never expanded and which the D-20 whitelist now refuses, so an entity delete deleted nothing and every deleted candidate's photos stayed stored and public (spike 029 S5).
--
-- `starts_with`, NOT LIKE. `_` is a LIKE wildcard and two of the ten tables carry it (`constituency_groups`, `question_categories`), so `name LIKE prefix || '%'` would also match a lookalike folder such as `<project>/constituencyXgroups/<id>/`. `starts_with` compares the prefix literally.
--
-- EVERY NAME STILL PASSES THE WHITELIST. Each enumerated name goes through `delete_storage_object`'s bucket and upload-convention check, so a stray name in the folder (a `notes.txt`, a dev-seed name that is not a uuid) is left in place with a WARNING: a leak, never a destroy. The enumeration never leaves the deleted row's own folder, and no second URL-building path exists.
--
-- ONE `storage.objects` SCAN PER DELETED ROW. A bulk delete of many entities scans once per row; that is accepted at current scale (162.1 RESEARCH A6).
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
-- When an entity's `image` changes, deletes the old `path` and `pathDark` objects that the row no longer uses. Only fires if the image column actually changed.
--
-- OWN FOLDER ONLY (162.1 D-20). An old path is deleted only when it starts with the row's own folder `<OLD.project_id>/<TG_TABLE_NAME>/<OLD.id>/`. A stored path is written by the entity's editor, so without this a candidate could point its image at another candidate's, another table's or another project's public photo and then replace it, and the trigger would delete the victim's file with the service-role key. `delete_storage_object` then checks the exact upload convention on top.
--
-- NEVER A PATH THE NEW ROW STILL REFERENCES (162.1 D-20). The NEW row's references come from `referenced_storage_paths (to_jsonb (NEW))`: its `image.path`, `image.pathDark` and every answer value's `path` and `pathDark`. So swapping `path` and `pathDark`, changing only `alt`, or moving the photo into an answer deletes nothing. `to_jsonb (NEW)` rather than `NEW.answers`, because this trigger is attached to ten tables and only two of them carry `answers`.
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
-- When a row's `answers` change, deletes every old answer photo the row no longer references: each `value.path` and `value.pathDark` of an OLD answer whose `value` is an object. That covers a replaced photo, a removed answer key and the key `cascade_question_delete_to_jsonb_answers` strips when a question is deleted. Before 162.1 only `image` was cleaned, so every photo a candidate ever stored as an answer stayed stored and public forever (spike 029 S4, 162.1 D-13).
--
-- DETECTED BY VALUE SHAPE, NEVER BY A `questions` JOIN. An answer holds a photo when its `value` is a JSON object (the StoredImage shape `validate_image` accepts); no other answer type stores an object there. Asking `questions.type = 'image'` instead would miss exactly the cascade case: the strip is an UPDATE run by an AFTER DELETE trigger on `questions`, so the question row is already gone when this trigger sees the change.
--
-- THE SAME TWO LIMITS AS `cleanup_old_image_file` (162.1 D-20). An old path is deleted only when it starts with the row's own folder `<OLD.project_id>/<TG_TABLE_NAME>/<OLD.id>/`, so an answer pointed at another entity's or project's photo can never get it deleted, and only when `referenced_storage_paths (to_jsonb (NEW))` no longer returns it, so a photo moved into `image` or into another answer stays. `delete_storage_object` then checks the bucket and the exact upload convention on top.
--
-- BEFORE UPDATE is safe because no BEFORE UPDATE trigger on either table assigns `NEW.answers` or `NEW.image` (checked in 162.1-03: `enforce_entity_immutability`, `enforce_external_id_immutability`, `update_updated_at`, `validate_answers_jsonb` and `cleanup_old_image_file` only read or raise), so the NEW row seen here is the row that is written; if the statement later fails, its enqueued request is rolled back with it.
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

-- Note: supabase_url and service_role_key values must be seeded in the storage_config table. See seed.sql for the default local dev values.
-- In production, update the storage_config table with actual values.
