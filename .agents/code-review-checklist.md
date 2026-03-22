# Code Review Checklist

When performing code review, double check all of the items below:

- [ ] Confirm that the changes solve the issues the PR is trying to solve partially or fully.
- [ ] Review the code in terms of the [OWASP top 10 security issues](https://owasp.org/Top10/).
- [ ] Verify that the code follows the [Code style guide](<docs/src/routes/(content)/developers-guide/contributing/code-style-guide/+page.md>).
- [ ] Avoid using `any` at all costs. If there is no way to circumvent using it, document the reason carefully and consider using `@ts-expect-error` instead.
- [ ] There is no code that is repeated within the PR or elsewhere in the repo.
- [ ] All new components, functions and other entities are documented
- [ ] The repo documentation markdown files are updated if the changes touch upon those.
- [ ] If the change adds functions available to the user, tracking events are enabled with new ones defined if needed.
- [ ] Any new Svelte components that have been created follow the [Svelte component guidelines](<docs/src/routes/(content)/developers-guide/contributing/code-style-guide/+page.md>).
- [ ] Errors are handled properly and logged in the code.
- [ ] Troubleshoot any failing checks in the PR.
- [ ] Check that parts of the application that share dependencies with the PR but are not included in it are not unduly affected.
- [ ] The changes pass the [WCAG A and AA requirements for accessibility](https://usability.yale.edu/web-accessibility/articles/wcag2-checklist).
- [ ] The changed parts of the app are fully usable with keyboard navigation and screen-reading.
- [ ] Documentation is added wherever necessary. This includes updating the possibly affected entries in the [Developers’](<docs/src/routes/(content)/developers-guide>) and [Publishers’ Guides](<docs/src/routes/(content)/publishers-guide>).
- [ ] The commit history is clean and linear, and the commits follow the [commit guidelines](<docs/src/routes/(content)/developers-guide/contributing/contribute/+page.md>)

### Supabase Backend

_Apply when changes touch `apps/supabase/` or database-related code._

- [ ] New content tables include all common columns (id, project_id, name, published, external_id, etc.) with correct types and defaults.
- [ ] RLS is enabled on new tables with at least the standard 5-policy pattern (anon_select, authenticated_select, admin_insert, admin_update, admin_delete).
- [ ] RLS policies use `(SELECT auth.uid())` and `(SELECT auth.jwt())` scalar subqueries — never bare function calls.
- [ ] RLS policies specify `TO anon` or `TO authenticated` — never omit the role target.
- [ ] New SECURITY DEFINER functions set `search_path = ''` and use schema-qualified calls.
- [ ] New tables have B-tree indexes on `project_id` and any FK columns.
- [ ] Triggers follow naming conventions: `set_updated_at`, `validate_{thing}`, `enforce_{constraint}`.
- [ ] pgTAP tests follow the transaction boundary pattern (BEGIN/ROLLBACK) and use `create_test_data()` for fixtures.
- [ ] pgTAP assertions use correct patterns: `ok()` for positive, `lives_ok()`+`is()` for silent RLS denial, `throws_ok()` for expected errors.

### Supabase Adapter

_Apply when changes touch `apps/frontend/src/lib/api/adapters/supabase/`._

- [ ] Adapter classes use the supabaseAdapterMixin with `init({ fetch })` for SSR compatibility.
- [ ] Row mapping uses COLUMN_MAP/PROPERTY_MAP from `@openvaa/supabase-types` for snake_case to camelCase conversion.
- [ ] Auth operations use `safeGetSession()` (not `getSession()`) for route guards.

### Edge Functions

_Apply when changes touch `apps/supabase/supabase/functions/`._

- [ ] Edge Functions verify caller is admin via JWT claims before performing privileged operations.
- [ ] Edge Functions use `createClient()` with `service_role` key for privileged database operations.
- [ ] Error responses include appropriate HTTP status codes and descriptive error messages.
