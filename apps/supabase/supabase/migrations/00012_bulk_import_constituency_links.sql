--------------------------------------------------------------------------------
-- bulk_import: import collection-keyed JSON data with transactional guarantee
--
-- Input format: an object keyed by collection name, each value an array of items. For example:
-- - "elections": [{"external_id": "election-2024", "name": {...}, ...}]
-- - "factions": [{"external_id": "fac-001", "organization": {"external_id": "org-sdp"}, ...}]
-- - "nominations": [{"external_id": "nom-001", "candidate": {"external_id": "cand-001"}, ...}]
--
-- Each item MUST include:
--   - "external_id": unique identifier within the project
--   - "project_id": UUID of the target project (for RLS enforcement)
--
-- Relationship fields (e.g., "organization", "election") are expressed as {"external_id": "..."} objects and resolved to UUIDs internally.
--
-- Two keys are links rather than columns:
--   - "constituency_groups" on an elections item: the constituency groups the election is held in, written to election_constituency_groups;
--   - "constituencies" on a constituency_groups item: the constituencies of the group, written to constituency_group_constituencies.
-- Each is a JSON array of references in a form resolve_external_ref reads, every one of which must name a row of the item's own project. The key is taken off the item before the upsert, so it never reaches a column and never counts as one, and its links are written once the constituencies collection is done, whether or not the payload holds one, and before any nomination: a nomination is judged against its election's constituencies when it is inserted. A link that already exists is left as it is, and no link is ever removed.
--
-- Returns: {"elections": {"created": N, "updated": M}, ...}
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bulk_import (p_data jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  collection_name text;
  collection_data jsonb;
  item jsonb;
  result jsonb := '{}'::jsonb;
  created_count integer;
  updated_count integer;
  item_project_id uuid;
  was_inserted boolean;

  -- The link keys taken off the items, written after the constituencies collection
  link_key text;
  link_refs jsonb;
  pending_links jsonb := '[]'::jsonb;
  link jsonb;
  link_ref jsonb;
  link_project_id uuid;
  owner_id uuid;
  target_id uuid;

  -- Supported collections in dependency order
  processing_order text[] := ARRAY[
    'elections', 'constituency_groups', 'constituencies',
    'organizations', 'alliances', 'factions', 'candidates',
    'question_categories', 'questions',
    'nominations', 'app_settings'
  ];
  col_name text;
BEGIN
  -- Validate no unknown collections were passed
  FOR collection_name IN SELECT * FROM jsonb_object_keys(p_data)
  LOOP
    IF NOT collection_name = ANY(processing_order) THEN
      RAISE EXCEPTION 'Unknown collection: %', collection_name;
    END IF;
  END LOOP;

  -- Process collections in dependency order
  FOREACH col_name IN ARRAY processing_order
  LOOP
    -- The links, once every election, constituency group and constituency of the payload is written and before the first nomination. Row-level security applies to the join tables as to every other write.
    IF col_name = 'organizations' THEN
      FOR link IN SELECT * FROM jsonb_array_elements(pending_links)
      LOOP
        link_project_id := (link ->> 'project_id')::uuid;
        owner_id := public.resolve_external_ref(
          jsonb_build_object('external_id', link ->> 'external_id'), link ->> 'collection', link_project_id
        );

        FOR link_ref IN SELECT * FROM jsonb_array_elements(link -> 'refs')
        LOOP
          IF link ->> 'collection' = 'elections' THEN
            target_id := public.resolve_external_ref(link_ref, 'constituency_groups', link_project_id);
            IF target_id IS NULL OR NOT EXISTS (
              SELECT 1 FROM public.constituency_groups cg WHERE cg.id = target_id AND cg.project_id = link_project_id
            ) THEN
              RAISE EXCEPTION 'Collection "%" item %: % names a row that is not a constituency_groups row of the item''s project',
                link ->> 'collection', link ->> 'external_id', link ->> 'key';
            END IF;
            INSERT INTO public.election_constituency_groups (election_id, constituency_group_id)
            VALUES (owner_id, target_id)
            ON CONFLICT DO NOTHING;
          ELSE
            target_id := public.resolve_external_ref(link_ref, 'constituencies', link_project_id);
            IF target_id IS NULL OR NOT EXISTS (
              SELECT 1 FROM public.constituencies c WHERE c.id = target_id AND c.project_id = link_project_id
            ) THEN
              RAISE EXCEPTION 'Collection "%" item %: % names a row that is not a constituencies row of the item''s project',
                link ->> 'collection', link ->> 'external_id', link ->> 'key';
            END IF;
            INSERT INTO public.constituency_group_constituencies (constituency_group_id, constituency_id)
            VALUES (owner_id, target_id)
            ON CONFLICT DO NOTHING;
          END IF;
        END LOOP;
      END LOOP;
    END IF;

    IF NOT p_data ? col_name THEN CONTINUE; END IF;
    collection_data := p_data -> col_name;

    IF jsonb_typeof(collection_data) != 'array' THEN
      RAISE EXCEPTION 'Collection "%" must be a JSON array', col_name;
    END IF;

    created_count := 0;
    updated_count := 0;

    FOR item IN SELECT * FROM jsonb_array_elements(collection_data)
    LOOP
      -- Extract project_id from each item (required for RLS)
      IF NOT item ? 'project_id' THEN
        RAISE EXCEPTION 'project_id is required in each item (collection: %, external_id: %)',
          col_name, item ->> 'external_id';
      END IF;
      item_project_id := (item ->> 'project_id')::uuid;

      -- An election's constituency groups and a constituency group's constituencies are links: taken off the item here and written after the constituencies collection.
      link_key := CASE col_name
        WHEN 'elections' THEN 'constituency_groups'
        WHEN 'constituency_groups' THEN 'constituencies'
      END;
      IF link_key IS NOT NULL AND item ? link_key THEN
        link_refs := item -> link_key;
        IF jsonb_typeof(link_refs) IS DISTINCT FROM 'array' THEN
          RAISE EXCEPTION 'Collection "%" item %: % must be a JSON array of references',
            col_name, item ->> 'external_id', link_key;
        END IF;
        item := item - link_key;
        pending_links := pending_links || jsonb_build_array(jsonb_build_object(
          'collection', col_name,
          'key', link_key,
          'external_id', item ->> 'external_id',
          'project_id', item_project_id,
          'refs', link_refs
        ));
      END IF;

      -- Upsert the record
      was_inserted := public._bulk_upsert_record(col_name, item, item_project_id);

      IF was_inserted THEN
        created_count := created_count + 1;
      ELSE
        updated_count := updated_count + 1;
      END IF;
    END LOOP;

    result := result || jsonb_build_object(
      col_name, jsonb_build_object('created', created_count, 'updated', updated_count)
    );
  END LOOP;

  RETURN result;
END;
$$;
