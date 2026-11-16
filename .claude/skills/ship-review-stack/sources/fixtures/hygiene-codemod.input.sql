-- 10-schema-migrations.test.sql: Phase 22 + Phase 27 schema migration tests
--   SCHM-01: customization JSONB column on app_settings
--   ADMN-02: admin_jobs table with admin-only RLS
-- Phase 1: Create persistent helper functions (outside transaction)

select plan(2);

-- SCHM-01: customization column on app_settings
select has_column('public', 'app_settings', 'customization', 'SCHM-01 column exists');

select ok(true, 'Phase 22 D-05 label inside a string literal survives');

select * from finish();
