---
phase: 29
plan: 2
status: complete
started: 2026-03-22
completed: 2026-03-22
one_liner: "Added 15 Supabase-era items to code review checklist (RLS, pgTAP, adapter, Edge Functions)"
---

## Execution Summary

### What Was Done
Updated `.agents/code-review-checklist.md` with 15 new checklist items across 3 sections:
- Supabase Backend (9 items): RLS policies, pgTAP tests, triggers, indexes, SECURITY DEFINER
- Supabase Adapter (3 items): mixin pattern, COLUMN_MAP/PROPERTY_MAP, safeGetSession
- Edge Functions (3 items): JWT verification, service_role, error handling

### Key Files
- `.agents/code-review-checklist.md` (31 total items: 16 original + 15 new)

### Deviations
None. Confirmed no Strapi-specific items existed to remove.

### Self-Check: PASSED
- 31 checkbox items total
- Zero Strapi references
- All original items preserved (OWASP, WCAG, code style)
