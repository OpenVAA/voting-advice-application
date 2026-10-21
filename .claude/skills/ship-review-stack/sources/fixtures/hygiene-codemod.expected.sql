-- 10-schema-migrations.test.sql: see phase 22 + see phase 27 schema migration tests
--   customization JSONB column on app_settings
--   admin_jobs table with admin-only RLS
-- Phase 1: Create persistent helper functions (outside transaction)

select plan(2);

-- customization column on app_settings
select has_column('public', 'app_settings', 'customization', 'SCHM-01 column exists');

select ok(true, 'Phase 22 D-05 label inside a string literal survives');

select * from finish();
