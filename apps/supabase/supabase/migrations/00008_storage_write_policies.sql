--------------------------------------------------------------------------------
-- One storage write policy per verb, across both buckets and both scopes
--
-- WHAT IT CHANGES. Replaces the twelve write policies of storage.objects, one per verb, bucket and scope, with three: authenticated_insert_assets, authenticated_update_assets and authenticated_delete_assets. Each admits a write to either bucket when public.storage_path_can answers yes for the write verb at entity scope or at project scope, which is the union the twelve permissive policies granted.
--
-- WHAT IT LEAVES. The three read policies of storage.objects, public.storage_path_can and public.storage_path_is_public, and every table, policy and function.
--------------------------------------------------------------------------------

DROP POLICY "entity_insert_public_assets" ON storage.objects;

DROP POLICY "project_insert_public_assets" ON storage.objects;

DROP POLICY "entity_insert_private_assets" ON storage.objects;

DROP POLICY "project_insert_private_assets" ON storage.objects;

DROP POLICY "entity_update_public_assets" ON storage.objects;

DROP POLICY "project_update_public_assets" ON storage.objects;

DROP POLICY "entity_update_private_assets" ON storage.objects;

DROP POLICY "project_update_private_assets" ON storage.objects;

DROP POLICY "entity_delete_public_assets" ON storage.objects;

DROP POLICY "project_delete_public_assets" ON storage.objects;

DROP POLICY "entity_delete_private_assets" ON storage.objects;

DROP POLICY "project_delete_private_assets" ON storage.objects;

CREATE POLICY "authenticated_insert_assets" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id IN ('public-assets', 'private-assets')
    AND (
      (
        SELECT
          storage_path_can (
            'entity',
            (storage.foldername (storage.objects.name)) [1],
            (storage.foldername (storage.objects.name)) [2],
            (storage.foldername (storage.objects.name)) [3],
            'write'
          )
      )
      OR (
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
  );

CREATE POLICY "authenticated_update_assets" ON storage.objects
FOR UPDATE
  TO authenticated USING (
    bucket_id IN ('public-assets', 'private-assets')
    AND (
      (
        SELECT
          storage_path_can (
            'entity',
            (storage.foldername (storage.objects.name)) [1],
            (storage.foldername (storage.objects.name)) [2],
            (storage.foldername (storage.objects.name)) [3],
            'write'
          )
      )
      OR (
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
  )
WITH
  CHECK (
    bucket_id IN ('public-assets', 'private-assets')
    AND (
      (
        SELECT
          storage_path_can (
            'entity',
            (storage.foldername (storage.objects.name)) [1],
            (storage.foldername (storage.objects.name)) [2],
            (storage.foldername (storage.objects.name)) [3],
            'write'
          )
      )
      OR (
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
  );

CREATE POLICY "authenticated_delete_assets" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id IN ('public-assets', 'private-assets')
    AND (
      (
        SELECT
          storage_path_can (
            'entity',
            (storage.foldername (storage.objects.name)) [1],
            (storage.foldername (storage.objects.name)) [2],
            (storage.foldername (storage.objects.name)) [3],
            'write'
          )
      )
      OR (
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
);
