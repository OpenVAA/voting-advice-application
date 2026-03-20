# Localization in the Database

> **Migrated to Supabase.** The Strapi backend was removed in v3.0. This page previously documented the localization approach in Strapi.

## Supabase Equivalent

Localized strings are stored as JSONB columns in the database (e.g., `{"en": "Hello", "fi": "Hei"}`). The `get_localized()` SQL function extracts the best locale match from these columns. The same `LocalizedString` format from `@openvaa/app-shared` is used.

## References

- Supabase project: `apps/supabase/`
- Database conventions: `.claude/skills/database/SKILL.md`
- Migration commit: Phase 30 of v3.0 Frontend Adapter milestone
