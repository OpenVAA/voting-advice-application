-- Storage RLS policies, cleanup triggers, and helper functions
--
-- Depends on:
--   012-auth-hooks.sql  (can_access_project, has_role)
--   011-auth-tables.sql (published columns on entity tables)
--   003-entities.sql    (candidates, organizations with auth_user_id)
--   002-elections.sql   (elections, constituency_groups, constituencies)
--   004-questions.sql   (question_templates, question_categories, questions)
--   005-nominations.sql (nominations)
--
-- Provides:
--   pg_net extension for async HTTP triggers
--   is_storage_entity_published()  - check published status by storage path
--   delete_storage_object()        - delete a file via Storage API (pg_net)
--   cleanup_entity_storage_files() - AFTER DELETE trigger for entity tables
--   cleanup_old_image_file()       - BEFORE UPDATE trigger for image columns
--   RLS policies on storage.objects for public-assets and private-assets buckets

--------------------------------------------------------------------------------
-- pg_net extension (async HTTP from triggers)
--------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

--------------------------------------------------------------------------------
-- storage_config: configuration table for storage cleanup triggers
--
-- Stores supabase_url and service_role_key needed by pg_net triggers to call
-- the Storage API. Seeded in seed.sql with local dev defaults.
-- In production, update values for the actual Supabase URL and service role key.
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS storage_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

-- Only service_role and postgres can access storage_config (not exposed via API)
ALTER TABLE storage_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE storage_config FROM anon, authenticated, public;
GRANT SELECT ON TABLE storage_config TO service_role;

--------------------------------------------------------------------------------
-- is_storage_entity_published: check if the entity owning a storage path is published
--
-- Path format: {project_id}/{entity_type}/{entity_id}/filename.ext
-- entity_type_segment maps directly to the table name.
-- Special cases:
--   'project' -> project-level files, always accessible
--   'question_templates' -> no published flag, always accessible
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_storage_entity_published(entity_type_segment text, entity_id_segment text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_published boolean;
BEGIN
  -- Project-level files are always accessible
  IF entity_type_segment = 'project' THEN
    RETURN true;
  END IF;

  -- question_templates have no published flag (admin-only content)
  IF entity_type_segment = 'question_templates' THEN
    RETURN true;
  END IF;

  -- For all other entity types, check published = true on the owning entity
  EXECUTE format(
    'SELECT published FROM public.%I WHERE id = $1',
    entity_type_segment
  ) INTO is_published USING entity_id_segment::uuid;

  -- If entity not found, deny access
  RETURN COALESCE(is_published, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- =====================================================================
-- Storage RLS policies on storage.objects
--
-- Path format: {project_id}/{entity_type}/{entity_id}/filename.ext
--   (storage.foldername(storage.objects.name))[1] = project_id
--   (storage.foldername(storage.objects.name))[2] = entity_type
--   (storage.foldername(storage.objects.name))[3] = entity_id
--
-- IMPORTANT: Always use storage.objects.name (not bare 'name') to avoid
-- ambiguity with entity tables that have a jsonb 'name' column.
--
-- Uses (SELECT auth.uid()) and (SELECT auth.jwt()) for optimizer caching,
-- consistent with the existing 79 content table RLS policies.
-- =====================================================================

-- =====================================================================
-- public-assets bucket: SELECT policies
-- =====================================================================

-- Anon: can read files for published entities only
CREATE POLICY "anon_select_public_assets" ON storage.objects FOR SELECT TO anon
  USING (
    bucket_id = 'public-assets'
    AND is_storage_entity_published(
      (storage.foldername(storage.objects.name))[2],
      (storage.foldername(storage.objects.name))[3]
    )
  );

-- Authenticated: can read published entity files, own entity files, or admin project files
CREATE POLICY "authenticated_select_public_assets" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'public-assets'
    AND (
      -- Published entities are readable by all authenticated users
      is_storage_entity_published(
        (storage.foldername(storage.objects.name))[2],
        (storage.foldername(storage.objects.name))[3]
      )
      -- Admins can always see project files
      OR (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
      -- Entity owners can see their own files (candidates and organizations have auth_user_id)
      OR (
        (storage.foldername(storage.objects.name))[2] IN ('candidates', 'organizations')
        AND EXISTS (
          SELECT 1 FROM public.candidates c
          WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
            AND c.auth_user_id = (SELECT auth.uid())
          UNION ALL
          SELECT 1 FROM public.organizations o
          WHERE o.id = (storage.foldername(storage.objects.name))[3]::uuid
            AND o.auth_user_id = (SELECT auth.uid())
        )
      )
    )
  );

-- =====================================================================
-- private-assets bucket: SELECT policies
-- =====================================================================

-- Authenticated: can read own entity files or admin project files
CREATE POLICY "authenticated_select_private_assets" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'private-assets'
    AND (
      -- Admins can see all project files
      (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
      -- Entity owners can see their own files
      OR (
        (storage.foldername(storage.objects.name))[2] IN ('candidates', 'organizations')
        AND EXISTS (
          SELECT 1 FROM public.candidates c
          WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
            AND c.auth_user_id = (SELECT auth.uid())
          UNION ALL
          SELECT 1 FROM public.organizations o
          WHERE o.id = (storage.foldername(storage.objects.name))[3]::uuid
            AND o.auth_user_id = (SELECT auth.uid())
        )
      )
    )
  );

-- =====================================================================
-- public-assets bucket: INSERT policies
-- =====================================================================

-- Candidates can upload to their own entity folder
CREATE POLICY "candidate_insert_public_assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'public-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  );

-- Admins can upload to any entity folder in their project
CREATE POLICY "admin_insert_public_assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'public-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  );

-- =====================================================================
-- private-assets bucket: INSERT policies
-- =====================================================================

-- Candidates can upload to their own entity folder
CREATE POLICY "candidate_insert_private_assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'private-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  );

-- Admins can upload to any entity folder in their project
CREATE POLICY "admin_insert_private_assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'private-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  );

-- =====================================================================
-- public-assets bucket: UPDATE policies
-- =====================================================================

-- Candidates can update their own entity files
CREATE POLICY "candidate_update_public_assets" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'public-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    bucket_id = 'public-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  );

-- Admins can update any file in their project
CREATE POLICY "admin_update_public_assets" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'public-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  )
  WITH CHECK (
    bucket_id = 'public-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  );

-- =====================================================================
-- private-assets bucket: UPDATE policies
-- =====================================================================

-- Candidates can update their own entity files
CREATE POLICY "candidate_update_private_assets" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'private-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    bucket_id = 'private-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  );

-- Admins can update any file in their project
CREATE POLICY "admin_update_private_assets" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'private-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  )
  WITH CHECK (
    bucket_id = 'private-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  );

-- =====================================================================
-- public-assets bucket: DELETE policies
-- =====================================================================

-- Candidates can delete their own entity files
CREATE POLICY "candidate_delete_public_assets" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'public-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  );

-- Admins can delete any file in their project
CREATE POLICY "admin_delete_public_assets" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'public-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  );

-- =====================================================================
-- private-assets bucket: DELETE policies
-- =====================================================================

-- Candidates can delete their own entity files
CREATE POLICY "candidate_delete_private_assets" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'private-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  );

-- Admins can delete any file in their project
CREATE POLICY "admin_delete_private_assets" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'private-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  );

-- =====================================================================
-- Storage file deletion helper (via pg_net async HTTP)
-- =====================================================================

--------------------------------------------------------------------------------
-- delete_storage_object: delete files via the Storage API
--
-- Uses pg_net for async HTTP. Requires app.supabase_url and app.service_role_key
-- custom settings (set in seed.sql for local dev, Vault or env vars in production).
-- Gracefully degrades (logs WARNING) if settings are not configured.
-- Accepts either a single file path or a directory prefix (ending with /).
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_storage_object(bucket text, file_path text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  base_url text;
  service_key text;
BEGIN
  -- Read configuration from storage_config table
  SELECT value INTO base_url FROM public.storage_config WHERE key = 'supabase_url';
  SELECT value INTO service_key FROM public.storage_config WHERE key = 'service_role_key';

  IF base_url IS NULL OR service_key IS NULL THEN
    RAISE WARNING 'Storage cleanup skipped: missing supabase_url or service_role_key in storage_config';
    RETURN;
  END IF;

  -- Use pg_net async HTTP POST to the Storage API batch delete endpoint
  -- The endpoint accepts a JSON body with a "prefixes" array
  PERFORM net.http_post(
    url := base_url || '/storage/v1/object/' || bucket,
    body := jsonb_build_object('prefixes', jsonb_build_array(file_path)),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type', 'application/json'
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Storage cleanup failed for %/%: %', bucket, file_path, SQLERRM;
END;
$$;

-- =====================================================================
-- Entity deletion cleanup trigger
-- =====================================================================

--------------------------------------------------------------------------------
-- cleanup_entity_storage_files: AFTER DELETE trigger
--
-- When an entity row is deleted, removes all storage files under its path prefix
-- in both public-assets and private-assets buckets.
-- Uses pg_net (via delete_storage_object) for async, non-blocking cleanup.
-- pg_net requests only fire after the transaction commits.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_entity_storage_files()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  path_prefix text;
BEGIN
  -- Construct path prefix: {project_id}/{entity_type}/{entity_id}/
  -- TG_TABLE_NAME gives the table name which matches the entity_type path segment
  path_prefix := OLD.project_id || '/' || TG_TABLE_NAME || '/' || OLD.id || '/';

  -- Clean up files in both buckets
  PERFORM public.delete_storage_object('public-assets', path_prefix);
  PERFORM public.delete_storage_object('private-assets', path_prefix);

  RETURN OLD;
END;
$$;

-- Attach entity deletion cleanup trigger to all entity tables with project_id
CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON candidates
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON organizations
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON factions
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON alliances
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON elections
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON constituencies
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON constituency_groups
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON nominations
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON question_templates
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON question_categories
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON questions
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

-- =====================================================================
-- Image column update cleanup trigger
-- =====================================================================

--------------------------------------------------------------------------------
-- cleanup_old_image_file: BEFORE UPDATE trigger
--
-- When an entity's image JSONB column is updated, deletes the old file(s)
-- from storage. Checks both 'path' and 'pathDark' keys in the old image.
-- Only fires if the image column actually changed.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_old_image_file()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  old_path text;
  old_path_dark text;
BEGIN
  -- Only act if the image column actually changed
  IF OLD.image IS NOT DISTINCT FROM NEW.image THEN
    RETURN NEW;
  END IF;

  -- Delete old image path if it existed
  IF OLD.image IS NOT NULL AND OLD.image ? 'path' THEN
    old_path := OLD.image ->> 'path';
    IF old_path IS NOT NULL AND old_path != '' THEN
      PERFORM public.delete_storage_object('public-assets', old_path);
    END IF;
  END IF;

  -- Delete old dark mode image path if it existed
  IF OLD.image IS NOT NULL AND OLD.image ? 'pathDark' THEN
    old_path_dark := OLD.image ->> 'pathDark';
    IF old_path_dark IS NOT NULL AND old_path_dark != '' THEN
      PERFORM public.delete_storage_object('public-assets', old_path_dark);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach image cleanup trigger to all entity tables with an image column
CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON factions
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON alliances
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON elections
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON constituencies
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON constituency_groups
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON nominations
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON question_templates
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON question_categories
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

-- Note: supabase_url and service_role_key values must be seeded in the
-- storage_config table. See seed.sql for the default local dev values.
-- In production, update the storage_config table with actual values.
