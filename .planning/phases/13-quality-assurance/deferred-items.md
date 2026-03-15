# Deferred Items - Phase 13

## From Plan 02 (2026-03-15)

- **cleanup_entity_storage_files search_path bug**: The function in 014-storage.sql uses `SET search_path = ''` but calls `delete_storage_object(...)` without the `public.` schema prefix, making it unresolvable. All entity table DELETEs fail in local test environment. Fix: add `public.` prefix to the function call in cleanup_entity_storage_files().
