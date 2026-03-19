# Phase 29: E2E Test Migration - Research

**Researched:** 2026-03-19
**Domain:** Playwright E2E test infrastructure migration from Strapi to Supabase
**Confidence:** HIGH

## Summary

Phase 29 replaces all Strapi-dependent E2E test infrastructure with Supabase equivalents. The migration touches 17 files that import `StrapiAdminClient`, 4 JSON dataset files (plus 3 overlay files), 1 email helper utility, and the Playwright config. The core transformation is: StrapiAdminClient (HTTP API calls to Strapi) becomes SupabaseAdminClient (`@supabase/supabase-js` with service_role key calling bulk_import/bulk_delete RPCs and Admin Auth API). Email testing switches from LocalStack SES to Inbucket (built into Supabase CLI at localhost:54324). Test data JSON files are converted from Strapi camelCase format to Supabase snake_case format with `project_id` per item.

The existing `bulk_import` and `bulk_delete` RPCs provide direct replacements for Strapi's Admin Tools endpoints. The Supabase Admin Auth API (`supabase.auth.admin.createUser`, `deleteUser`, `updateUserById`) replaces Strapi's user management. A new generic `merge_jsonb_column` RPC is needed for deep-merging app_settings JSONB fields (replacing Strapi's content-manager PUT which was a full replace).

**Primary recommendation:** Build the SupabaseAdminClient as a stateless wrapper around `@supabase/supabase-js` with service_role key. Convert test datasets to Supabase-native snake_case format offline (no runtime mapping). Use Inbucket REST API v1 for email testing -- it's significantly simpler than LocalStack SES parsing.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Convert all JSON datasets (default-dataset.json, voter-dataset.json, candidate-addendum.json, overlay files) to full Supabase-native format with snake_case field names, Supabase table names, and project_id per item
- Datasets should be directly passable to bulk_import RPC with no runtime mapping
- Update mergeDatasets.ts utility to work with the new snake_case format and Supabase collection names
- New SupabaseAdminClient uses @supabase/supabase-js with service_role key
- Replaces StrapiAdminClient across all 17 consumer files
- Data operations: call bulk_import and bulk_delete RPCs via supabase.rpc()
- Auth operations: use Supabase Admin Auth API (supabase.auth.admin.createUser(), deleteUser(), updateUserById())
- For candidate-user linking, use service_role queries against the data tables
- Use Supabase-native method names where a clear Supabase concept exists (e.g., bulkImport, bulkDelete)
- Keep existing names for operations without a Supabase-specific equivalent (e.g., setPassword, forceRegister, unregisterCandidate)
- Move toward generic CRUD methods like update(collection, data) for regular table operations
- app_settings gets a special method since it's a single-row-per-project table
- Create a general-purpose merge_jsonb_column(table_name, column_name, row_id, partial_data) database RPC for deep-merging JSONB fields
- Switch from LocalStack SES to Inbucket (built into Supabase CLI local dev at localhost:54324)
- Rewrite emailHelper.ts to use Inbucket's REST API
- E2E test pipeline runs against supabase start (test pipeline only)
- General yarn dev Docker Compose stack stays unchanged until Phase 30
- Playwright config updated to point to Supabase-backed frontend (adapter type = supabase)

### Claude's Discretion
- Whether to use a hardcoded test project UUID from seed data or create/find project at runtime for test datasets
- Exact Inbucket REST API integration details (endpoint structure, email parsing)
- SupabaseAdminClient constructor parameters (URL, service_role key from env vars)
- How to handle the sendForgotPassword test helper (Admin Auth API password reset vs custom approach)
- Test parallelism adjustments (Strapi had admin rate limiting; Supabase may not need worker limits)

### Deferred Ideas (OUT OF SCOPE)
- Full dev environment switch to supabase CLI (yarn dev) -- Phase 30
- Strapi adapter code removal -- Phase 30
- Docker Compose simplification -- Phase 30
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEST-01 | Test infrastructure migrated from StrapiAdminClient to Supabase admin client | SupabaseAdminClient architecture, bulk_import/bulk_delete RPC interface, Admin Auth API patterns |
| TEST-02 | Data seeding via SQL/RPCs instead of Strapi API | Dataset format conversion (camelCase to snake_case), bulk_import RPC input format, project_id injection |
| TEST-03 | Auth setup using Supabase sessions in Playwright tests | Browser-based auth setup unchanged (UI login), service_role Admin Auth API for programmatic user management |
| TEST-04 | All existing E2E tests passing against Supabase backend | Consumer file migration patterns, email helper rewrite, app_settings merge RPC, Playwright config updates |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.99.1 | Supabase client for service_role admin operations | Already in frontend workspace; provides typed client with Admin Auth API |
| @playwright/test | ^1.58.2 | E2E test framework | Already the project's E2E framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cheerio | ^1.0.0 | HTML parsing for email link extraction | Already in root devDependencies; still needed for Inbucket HTML parsing |
| dotenv | ^16.4.7 | Environment variable loading | Already in root devDependencies; used by playwright.config.ts |

### Removed Dependencies
| Library | Why Removed |
|---------|-------------|
| mailparser | No longer needed -- Inbucket REST API returns parsed body (text/html) directly. LocalStack SES required raw MIME parsing; Inbucket does not |

**Installation:**
```bash
# @supabase/supabase-js needs to be added to root devDependencies (currently only in frontend)
yarn add -D @supabase/supabase-js
```

**Version verification:**
- `@supabase/supabase-js`: 2.99.3 (npm registry, 2026-03-19)
- `@playwright/test`: 1.58.2 (npm registry, already installed)
- `cheerio`: 1.2.0 (npm registry), project uses ^1.0.0 -- compatible

## Architecture Patterns

### Recommended Project Structure
```
tests/
  tests/
    utils/
      supabaseAdminClient.ts    # NEW: Replaces strapiAdminClient.ts
      emailHelper.ts             # REWRITE: Inbucket REST API instead of LocalStack SES
      mergeDatasets.ts           # UPDATE: snake_case field names (external_id not externalId)
      testCredentials.ts         # UNCHANGED: credential constants
      buildRoute.ts              # UNCHANGED
      testIds.ts                 # UNCHANGED
      testsDir.ts                # UNCHANGED
      voterNavigation.ts         # UNCHANGED
    data/
      default-dataset.json       # CONVERT: Supabase-native format
      voter-dataset.json         # CONVERT: Supabase-native format
      candidate-addendum.json    # CONVERT: Supabase-native format
      overlays/
        multi-election-overlay.json     # CONVERT
        constituency-overlay.json       # CONVERT
        startfromcg-overlay.json        # CONVERT
    setup/
      data.setup.ts              # UPDATE: SupabaseAdminClient
      data.teardown.ts           # UPDATE: SupabaseAdminClient
      auth.setup.ts              # UNCHANGED: browser-based login still works
      variant-*.setup.ts         # UPDATE: SupabaseAdminClient
      variant-data.teardown.ts   # UPDATE: SupabaseAdminClient
    specs/
      candidate/                 # UPDATE: import path changes only (except registration/profile)
      voter/                     # UPDATE: import path changes + remove Pitfall 2 workaround
      variants/                  # UPDATE: import path changes + findData -> query method
    fixtures/
      index.ts                   # UNCHANGED
      auth.fixture.ts            # UNCHANGED
      voter.fixture.ts           # UNCHANGED
    pages/                       # UNCHANGED: page objects interact with UI, not backend
  playwright.config.ts           # UPDATE: worker count comment, possibly increase workers
apps/supabase/supabase/
  schema/
    016-bulk-operations.sql      # UPDATE: add merge_jsonb_column RPC
```

### Pattern 1: SupabaseAdminClient with service_role
**What:** A stateless client wrapping `@supabase/supabase-js` initialized with the service_role key. Unlike StrapiAdminClient which needed `login()` + JWT token management, the Supabase client authenticates via the service_role key in the constructor.

**When to use:** All test setup/teardown and spec files that need backend admin operations.

**Example:**
```typescript
// Source: Verified against @supabase/supabase-js docs and project's bulk_import RPC
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseAdminClient {
  private client: SupabaseClient;
  private projectId: string;

  constructor(
    url?: string,
    serviceRoleKey?: string,
    projectId?: string
  ) {
    this.client = createClient(
      url ?? process.env.SUPABASE_URL ?? 'http://localhost:54321',
      serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    // Hardcoded from seed.sql -- the default project UUID
    this.projectId = projectId ?? '00000000-0000-0000-0000-000000000001';
  }

  // No login() needed -- service_role key is self-authenticating
  // No dispose() needed -- no request context to clean up
}
```

**Key differences from StrapiAdminClient:**
- No `login()` / `dispose()` lifecycle -- constructor-initialized, stateless
- No `ensureAuthenticated()` guard -- always authenticated via service_role
- No Playwright `request.newContext()` -- uses @supabase/supabase-js client directly

### Pattern 2: Dataset Format Conversion
**What:** Convert Strapi camelCase JSON datasets to Supabase snake_case format with project_id injection.

**Current Strapi format:**
```json
{
  "questionTypes": [{ "externalId": "test-qt-likert5", "name": "Likert-5", ... }],
  "parties": [{ "externalId": "test-party-a", "name": { "en": "Test Party A" }, "shortName": { "en": "TPA" } }],
  "candidates": [{ "externalId": "test-candidate-alpha", "firstName": "Test Candidate", ... }],
  "nominations": [{ "candidate": { "externalId": "test-candidate-alpha" }, "party": { "externalId": "test-party-a" }, ... }]
}
```

**New Supabase format:**
```json
{
  "questions": [{ "external_id": "test-qt-likert5", "type": "singleChoiceOrdinal", "project_id": "00000000-0000-0000-0000-000000000001", ... }],
  "organizations": [{ "external_id": "test-party-a", "name": { "en": "Test Party A" }, "short_name": { "en": "TPA" }, "project_id": "00000000-0000-0000-0000-000000000001" }],
  "candidates": [{ "external_id": "test-candidate-alpha", "first_name": "Test Candidate", "project_id": "00000000-0000-0000-0000-000000000001", ... }],
  "nominations": [{ "candidate": { "external_id": "test-candidate-alpha" }, "organization": { "external_id": "test-party-a" }, "project_id": "00000000-0000-0000-0000-000000000001", ... }]
}
```

**Critical mapping changes:**
| Strapi Name | Supabase Name | Notes |
|-------------|---------------|-------|
| `questionTypes` | (no collection) | Supabase uses `question_type` enum on `questions` table directly; `type` field |
| `parties` | `organizations` | Supabase unified entity model |
| `questionCategories` | `question_categories` | snake_case |
| `constituencyGroups` | `constituency_groups` | snake_case |
| `externalId` | `external_id` | snake_case |
| `firstName` | `first_name` | snake_case |
| `lastName` | `last_name` | snake_case |
| `shortName` | `short_name` | snake_case |
| `electionDate` | `election_date` | snake_case; verify actual column name |
| `electionStartDate` | `election_start_date` | snake_case |
| `termsOfUseAccepted` | `terms_of_use_accepted` | snake_case |
| `questionType.externalId` ref | `type` enum value directly | No separate table; inline the settings into question `choices`/`settings` |
| `party` (nomination ref) | `organization` (nomination ref) | Relationship key name change |
| `answersByExternalId` | (special handling) | Must resolve to `answers` JSONB on candidates via question UUID lookup or separate seeding |

### Pattern 3: Inbucket Email Helper
**What:** Replace LocalStack SES email fetching with Inbucket REST API v1.

**Inbucket REST API v1 endpoints (verified from official docs):**
- `GET /api/v1/mailbox/{name}` -- List messages for a mailbox (name = email local part)
- `GET /api/v1/mailbox/{name}/{id}` -- Get specific message with parsed body
- `GET /api/v1/mailbox/{name}/latest` -- Get most recent message (convenience)
- `DELETE /api/v1/mailbox/{name}` -- Purge all messages in mailbox

**Key insight:** Inbucket organizes by mailbox name = the local part of the email address (before @). So `mock.candidate.2@openvaa.org` goes to mailbox `mock.candidate.2`.

**Response format for GET message:**
```json
{
  "mailbox": "mock.candidate.2",
  "id": "20260319T120000-0000",
  "from": "noreply@openvaa.org",
  "subject": "Registration",
  "date": "2026-03-19T12:00:00.000Z",
  "size": 1234,
  "body": {
    "text": "Plain text version",
    "html": "<html>HTML version with <a href='...'>link</a></html>"
  },
  "header": { ... },
  "attachments": []
}
```

**Major simplification over LocalStack SES:**
- No MIME parsing needed (mailparser library can be removed)
- Body is pre-parsed into `text` and `html` fields
- Direct mailbox-based access (no scanning all messages)
- `latest` shortcut eliminates reverse-chronological iteration
- Cheerio still needed for link extraction from HTML body

### Pattern 4: App Settings Deep Merge via RPC
**What:** A generic `merge_jsonb_column` RPC for deep-merging partial JSONB updates into app_settings.

**Why needed:** Strapi's content-manager PUT was a full replace (Pitfall 2 in multiple spec comments). The new Supabase approach should use deep merge to avoid that pitfall entirely. With deep merge, spec files only need to send the settings they want to change, not ALL sibling settings.

**Existing pattern:** `merge_custom_data` in 016-bulk-operations.sql uses `||` (shallow merge). The new generic RPC should use `jsonb_deep_merge` for recursive merging.

**Example RPC:**
```sql
CREATE OR REPLACE FUNCTION merge_jsonb_column(
  p_table_name text,
  p_column_name text,
  p_row_id uuid,
  p_partial_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = jsonb_recursive_merge(%I, $1) WHERE id = $2',
    p_table_name, p_column_name, p_column_name
  ) USING p_partial_data, p_row_id;
END;
$$;
```

**Impact on spec files:** The `IMPORTANT` comments in voter-settings.spec.ts, voter-popups.spec.ts, and candidate-settings.spec.ts about "Pitfall 2 where Strapi content-manager PUT replaces entire components" become obsolete. With deep merge, specs can send only the settings they modify.

### Pattern 5: Auth User Management
**What:** Compose Supabase Admin Auth API + service_role data queries to replace Strapi's user management endpoints.

**Method mapping:**

| Strapi Method | Supabase Equivalent | Implementation |
|---------------|---------------------|----------------|
| `setPassword({ documentId, password })` | `auth.admin.updateUserById(userId, { password })` | Look up auth_user_id from candidates table by external_id, then update |
| `forceRegister({ documentId, password })` | `auth.admin.createUser({ email, password, email_confirm: true })` + insert user_role + update candidates.auth_user_id | Compose: create user, assign candidate role, link to candidate record |
| `unregisterCandidate(email)` | Find user by email, delete user_role, clear auth_user_id, `auth.admin.deleteUser(userId)` | Reverse of forceRegister: unlink, remove role, delete auth user |
| `sendEmail({ candidateId, subject, content })` | Call `invite-candidate` Edge Function or use `auth.admin.inviteUserByEmail()` | Edge Function approach matches Phase 28 integration |
| `sendForgotPassword({ documentId })` | `auth.admin.generateLink({ type: 'recovery', email })` + send via GoTrue | GoTrue handles password reset emails natively |
| `findData(collection, filters)` | `supabase.from(collection).select().match(filters)` | Direct PostgREST query with service_role |
| `updateAppSettings(data)` | `supabase.rpc('merge_jsonb_column', ...)` | Deep merge into settings JSONB |

### Anti-Patterns to Avoid
- **Using Playwright request context for Supabase calls:** The StrapiAdminClient used `@playwright/test`'s `request.newContext()` for HTTP calls. The SupabaseAdminClient should use `@supabase/supabase-js` directly -- it provides typed queries, automatic auth headers, and proper error handling.
- **Runtime dataset mapping:** Do NOT build a runtime camelCase-to-snake_case mapper. Convert datasets statically in the JSON files. Runtime mapping adds complexity and failure modes.
- **Re-implementing login() lifecycle:** The service_role key is stateless. Do not add `login()`/`dispose()` methods -- the client is ready immediately after construction.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Supabase HTTP requests | Custom fetch/axios wrapper | `@supabase/supabase-js` createClient | Handles auth headers, types, retries, error formatting |
| MIME email parsing | mailparser integration | Inbucket REST API v1 body.html | Inbucket returns pre-parsed HTML; no raw MIME to decode |
| Bulk data import | Custom INSERT loops | `bulk_import` RPC | Handles dependency ordering, FK resolution, upsert semantics |
| Bulk data deletion | Custom DELETE queries | `bulk_delete` RPC | Handles reverse dependency ordering, prefix/id/external_id modes |
| User password management | Direct SQL against auth.users | `auth.admin.updateUserById()` | GoTrue handles password hashing, validation, session invalidation |

**Key insight:** The Supabase infrastructure (RPCs + Admin Auth API) already provides almost everything the Strapi Admin Tools plugin did. The SupabaseAdminClient is primarily a thin adapter mapping test-oriented method names to Supabase primitives.

## Common Pitfalls

### Pitfall 1: questionTypes Collection Does Not Exist in Supabase
**What goes wrong:** The Strapi datasets include a `questionTypes` collection with entries like `{ externalId: "test-qt-likert5", settings: { type: "singleChoiceOrdinal", choices: [...] } }`. Supabase has no `question_types` table -- question type is an enum (`question_type`) on the `questions` table directly. The `choices` and `settings` data lives on the question itself.
**Why it happens:** Strapi had a separate questionTypes content type; Supabase inlined this into the questions table.
**How to avoid:** In the converted datasets, remove the `questionTypes` collection entirely. Instead, each question entry must include `type` (the enum value), `choices` (from the questionType.settings.choices), and `settings` (from the questionType.settings) directly.
**Warning signs:** `bulk_import` raises "Unknown collection: question_types".

### Pitfall 2: Strapi Pitfall 2 (Full Component Replace) Is SOLVED, Not Carried Forward
**What goes wrong:** Multiple spec files have extensive comments about "Pitfall 2 where Strapi content-manager PUT replaces entire components". If the migration blindly preserves these workarounds, it adds unnecessary complexity.
**Why it happens:** Strapi's PUT endpoint replaced entire JSON objects. The new `merge_jsonb_column` RPC deep-merges.
**How to avoid:** When migrating spec files, REMOVE the "include ALL sibling settings" workaround. The new `updateAppSettings` method uses deep merge, so specs only need to send the settings they want to change.
**Warning signs:** Spec files sending redundant settings (questions + entities + notifications + analytics) in every updateAppSettings call.

### Pitfall 3: project_id Must Be in Every Dataset Item
**What goes wrong:** `bulk_import` RPC requires `project_id` on every item for RLS enforcement. Missing project_id causes: `'project_id is required in each item (collection: X, external_id: Y)'`.
**Why it happens:** Strapi Admin Tools handled project scoping internally; Supabase enforces it per-item.
**How to avoid:** Every JSON dataset item must include `"project_id": "00000000-0000-0000-0000-000000000001"`. The hardcoded UUID comes from seed.sql and is stable across all local dev environments.
**Warning signs:** RPC error about missing project_id.

### Pitfall 4: candidates Need published=true for Voter Tests
**What goes wrong:** Voter-facing queries use anon role with RLS that requires `published = true`. If dataset candidates don't have `published: true`, voter tests see empty results.
**Why it happens:** Strapi's bootstrap auto-published everything. Supabase defaults `published` to `false`.
**How to avoid:** Add `"published": true` to all entities in test datasets (candidates, organizations, questions, elections, nominations, constituencies, constituency_groups, question_categories).
**Warning signs:** Voter tests show no candidates/questions, empty results page.

### Pitfall 5: Inbucket Mailbox Name Is the Local Part
**What goes wrong:** Fetching from `GET /api/v1/mailbox/mock.candidate.2@openvaa.org` returns 404 or empty.
**Why it happens:** Inbucket uses the email local part (before @) as the mailbox name.
**How to avoid:** Extract local part: `email.split('@')[0]` to get the mailbox name. For `mock.candidate.2@openvaa.org`, the mailbox is `mock.candidate.2`.
**Warning signs:** Empty mailbox responses despite emails being sent.

### Pitfall 6: answersByExternalId Needs Question UUID Resolution
**What goes wrong:** The current dataset uses `answersByExternalId` which maps question externalIds to answers. Supabase stores answers as a JSONB object keyed by question UUID on the `candidates.answers` column.
**Why it happens:** Strapi Admin Tools resolved externalId references internally during import. bulk_import handles FK refs but not JSONB key resolution.
**How to avoid:** Two options: (a) Handle answersByExternalId resolution inside bulk_import (add special case logic), or (b) Seed answers in a separate step after questions are imported (query question UUIDs, build answers JSONB, update candidates). Option (b) is cleaner -- keep bulk_import generic, add an `importAnswers` method to SupabaseAdminClient that resolves external_ids to UUIDs and updates candidates.answers.
**Warning signs:** Candidates imported with no answers; voter matching returns all zeros.

### Pitfall 7: Missing forceRegister/unregisterCandidate in Current StrapiAdminClient
**What goes wrong:** `data.setup.ts` calls `client.forceRegister()` and `client.unregisterCandidate()` but these methods don't exist on the current StrapiAdminClient (326 lines, no such methods). The tests may be incomplete.
**Why it happens:** These were planned but not yet implemented for Strapi.
**How to avoid:** The SupabaseAdminClient MUST implement these methods using Admin Auth API. forceRegister = createUser + assign role + link to candidate. unregisterCandidate = delete user + remove role + clear auth_user_id.
**Warning signs:** TypeScript compilation errors if methods are missing.

### Pitfall 8: constituency_groups M:N Relationship via Elections
**What goes wrong:** Strapi datasets define `elections[].constituencyGroups` as a relationship. In Supabase, the constituency_groups table has a separate structure -- check if there's a join table or if election_ids are stored on constituency_groups.
**Why it happens:** Schema differences between Strapi and Supabase.
**How to avoid:** Verify the actual Supabase schema for election-constituency_group relationships. The bulk_import RPC's relationship mapping only handles direct FK columns, not M:N join tables.
**Warning signs:** Elections imported without constituency group associations.

## Code Examples

### SupabaseAdminClient Core Methods
```typescript
// Source: Verified against bulk_import RPC signature and @supabase/supabase-js Admin Auth API

async bulkImport(data: Record<string, Array<unknown>>): Promise<BulkImportResult> {
  const { data: result, error } = await this.client.rpc('bulk_import', {
    data: data as any  // JSONB parameter
  });
  if (error) throw new Error(`Bulk import failed: ${error.message}`);
  return result;
}

async bulkDelete(collections: Record<string, { prefix?: string; ids?: string[]; external_ids?: string[] }>): Promise<BulkDeleteResult> {
  const { data: result, error } = await this.client.rpc('bulk_delete', {
    data: {
      project_id: this.projectId,
      collections
    }
  });
  if (error) throw new Error(`Bulk delete failed: ${error.message}`);
  return result;
}

async setPassword(email: string, password: string): Promise<void> {
  // Look up user by email via Admin Auth API
  const { data: { users }, error: listError } = await this.client.auth.admin.listUsers();
  if (listError) throw new Error(`List users failed: ${listError.message}`);
  const user = users.find(u => u.email === email);
  if (!user) throw new Error(`No user found with email ${email}`);

  const { error } = await this.client.auth.admin.updateUserById(user.id, { password });
  if (error) throw new Error(`Set password failed: ${error.message}`);
}

async forceRegister(candidateExternalId: string, email: string, password: string): Promise<void> {
  // 1. Create auth user
  const { data: { user }, error: createError } = await this.client.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (createError) throw new Error(`Create user failed: ${createError.message}`);

  // 2. Look up candidate ID by external_id
  const { data: candidate } = await this.client
    .from('candidates')
    .select('id')
    .eq('external_id', candidateExternalId)
    .eq('project_id', this.projectId)
    .single();

  // 3. Assign candidate role
  await this.client.from('user_roles').insert({
    user_id: user!.id,
    role: 'candidate',
    scope_type: 'candidate',
    scope_id: candidate!.id
  });

  // 4. Link auth user to candidate
  await this.client
    .from('candidates')
    .update({ auth_user_id: user!.id })
    .eq('id', candidate!.id);
}

async unregisterCandidate(email: string): Promise<void> {
  // 1. Find auth user by email
  const { data: { users } } = await this.client.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  if (!user) return; // Already unregistered

  // 2. Clear auth_user_id on candidate
  await this.client
    .from('candidates')
    .update({ auth_user_id: null })
    .eq('auth_user_id', user.id);

  // 3. Delete user roles
  await this.client
    .from('user_roles')
    .delete()
    .eq('user_id', user.id);

  // 4. Delete auth user
  await this.client.auth.admin.deleteUser(user.id);
}
```

### Inbucket Email Helper
```typescript
// Source: Verified against Inbucket REST API v1 docs (book.inbucket.org)

const INBUCKET_URL = process.env.INBUCKET_URL ?? 'http://localhost:54324';

interface InbucketMessage {
  mailbox: string;
  id: string;
  from: string;
  subject: string;
  date: string;
  size: number;
  body?: { text: string; html: string };
}

function getMailboxName(email: string): string {
  return email.split('@')[0];
}

export async function fetchEmails(recipientEmail: string): Promise<InbucketMessage[]> {
  const mailbox = getMailboxName(recipientEmail);
  const response = await fetch(`${INBUCKET_URL}/api/v1/mailbox/${mailbox}`);
  if (!response.ok) return [];
  return response.json();
}

export async function getLatestEmailHtml(
  recipientEmail: string,
  skipCount = 0
): Promise<string | undefined> {
  const messages = await fetchEmails(recipientEmail);
  if (messages.length <= skipCount) return undefined;

  // Get the most recent message after skipping
  const target = messages[messages.length - 1 - skipCount]; // Note: might need adjustment
  const mailbox = getMailboxName(recipientEmail);
  const response = await fetch(`${INBUCKET_URL}/api/v1/mailbox/${mailbox}/${target.id}`);
  if (!response.ok) return undefined;

  const message: InbucketMessage = await response.json();
  return message.body?.html ?? undefined;
}

export async function countEmailsForRecipient(recipientEmail: string): Promise<number> {
  const messages = await fetchEmails(recipientEmail);
  return messages.length;
}

export async function purgeMailbox(recipientEmail: string): Promise<void> {
  const mailbox = getMailboxName(recipientEmail);
  await fetch(`${INBUCKET_URL}/api/v1/mailbox/${mailbox}`, { method: 'DELETE' });
}
```

### App Settings Update with Deep Merge
```typescript
// Source: Derived from app_settings schema (007-app-settings.sql) and merge pattern

async updateAppSettings(partialSettings: Record<string, unknown>): Promise<void> {
  // Get the app_settings row ID for this project
  const { data: row, error: fetchError } = await this.client
    .from('app_settings')
    .select('id')
    .eq('project_id', this.projectId)
    .single();
  if (fetchError) throw new Error(`Fetch app_settings failed: ${fetchError.message}`);

  // Deep merge via RPC
  const { error } = await this.client.rpc('merge_jsonb_column', {
    p_table_name: 'app_settings',
    p_column_name: 'settings',
    p_row_id: row.id,
    p_partial_data: partialSettings
  });
  if (error) throw new Error(`Update app settings failed: ${error.message}`);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Strapi Admin Tools API (HTTP) | Supabase RPC + Admin Auth API | Phase 29 | All test infra migrated |
| LocalStack SES + mailparser | Inbucket REST API v1 | Phase 29 | Simpler email testing, remove mailparser dep |
| camelCase dataset format | snake_case Supabase-native format | Phase 29 | Datasets directly passable to bulk_import |
| Full-replace app settings (Pitfall 2) | Deep merge via merge_jsonb_column RPC | Phase 29 | Spec files simplified, no sibling settings needed |
| Strapi JWT auth for admin client | service_role key (stateless) | Phase 29 | No login/dispose lifecycle |

**Deprecated/outdated:**
- `StrapiAdminClient`: Replaced by `SupabaseAdminClient`. File can be deleted after Phase 29 (or left for Phase 30 cleanup).
- `mailparser` dependency: No longer needed with Inbucket. Can be removed from root package.json devDependencies.
- Pitfall 2 workarounds: All "include ALL sibling settings" patterns in spec files become unnecessary with deep merge.

## Open Questions

1. **answersByExternalId Resolution Strategy**
   - What we know: Current datasets use `answersByExternalId` mapping question external IDs to answer objects. Supabase `candidates.answers` column is keyed by question UUIDs. bulk_import does not resolve JSONB object keys.
   - What's unclear: Whether to handle this in bulk_import (add special case) or in a separate step in SupabaseAdminClient.
   - Recommendation: Separate step in SupabaseAdminClient. After bulk_import creates questions and candidates, an `importAnswers` method queries question UUIDs by external_id, builds the answers JSONB, and updates each candidate. This keeps bulk_import generic.

2. **Election-ConstituencyGroup M:N Relationship**
   - What we know: Strapi datasets have `elections[].constituencyGroups` as a relationship. The bulk_import RPC's relationship mapping does not include constituency_groups on elections.
   - What's unclear: How the Supabase schema represents this relationship (FK on constituency_groups? Join table? JSONB array on elections?).
   - Recommendation: Check the elections and constituency_groups table schemas. The planner must verify the relationship model before converting datasets.

3. **sendEmail / sendForgotPassword via Edge Functions vs Admin Auth API**
   - What we know: Phase 28 integrated the `invite-candidate` and `send-email` Edge Functions. The Admin Auth API has `generateLink({ type: 'recovery' })` for password reset.
   - What's unclear: Whether to use Edge Functions (matching the production flow) or Admin Auth API (simpler for tests).
   - Recommendation: For `sendForgotPassword`, use Admin Auth API `generateLink({ type: 'recovery', email })` which returns a link directly -- simpler than sending an email and extracting the link. For registration emails, use the `invite-candidate` Edge Function to match the production flow (GoTrue invite).

4. **Test Project UUID: Hardcode vs Runtime**
   - What we know: seed.sql creates project `00000000-0000-0000-0000-000000000001`. This UUID is stable across all `supabase start` instances.
   - What's unclear: Whether hardcoding is fragile if seed data changes.
   - Recommendation: Hardcode. The seed UUID is a well-known constant used across the codebase. Add it as a named constant `TEST_PROJECT_ID` in the admin client or a shared constants file.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright ^1.58.2 |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `npx playwright test -c tests/playwright.config.ts --project=voter-app` |
| Full suite command | `npx playwright test -c tests/playwright.config.ts` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | SupabaseAdminClient replaces StrapiAdminClient | integration (E2E) | `npx playwright test -c tests/playwright.config.ts --project=data-setup` | Exists (needs update) |
| TEST-02 | Data seeding via bulk_import RPC | integration (E2E) | `npx playwright test -c tests/playwright.config.ts --project=data-setup` | Exists (needs update) |
| TEST-03 | Auth setup with Supabase sessions | integration (E2E) | `npx playwright test -c tests/playwright.config.ts --project=auth-setup` | Exists (unchanged) |
| TEST-04 | All E2E tests pass against Supabase | e2e | `npx playwright test -c tests/playwright.config.ts` | Exists (needs migration) |

### Sampling Rate
- **Per task commit:** `npx playwright test -c tests/playwright.config.ts --project=data-setup --project=data-teardown` (verify setup/teardown work)
- **Per wave merge:** `npx playwright test -c tests/playwright.config.ts` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/supabase/supabase/schema/016-bulk-operations.sql` -- add `merge_jsonb_column` RPC
- [ ] `@supabase/supabase-js` added to root devDependencies
- [ ] Supabase local dev running (`supabase start` in apps/supabase/) for test execution

## Sources

### Primary (HIGH confidence)
- `apps/supabase/supabase/schema/016-bulk-operations.sql` -- bulk_import/bulk_delete RPC signatures, input format, dependency ordering
- `apps/supabase/supabase/schema/015-external-id.sql` -- external_id columns, composite unique indexes
- `apps/supabase/supabase/schema/011-auth-tables.sql` -- user_roles table, candidate-user linking model
- `apps/supabase/supabase/schema/012-auth-hooks.sql` -- Custom access token hook, can_access_project, has_role
- `apps/supabase/supabase/schema/007-app-settings.sql` -- app_settings table (project_id, settings JSONB)
- `apps/supabase/supabase/schema/004-questions.sql` -- questions table with question_type enum, choices, settings columns
- `apps/supabase/supabase/schema/000-functions.sql` -- question_type enum values
- `apps/supabase/supabase/seed.sql` -- Default project UUID, test user setup, role assignments
- `apps/supabase/supabase/config.toml` -- Inbucket config (port 54324, smtp 54325, pop3 54326)
- `tests/tests/utils/strapiAdminClient.ts` -- All 10 methods to replace (326 lines)
- `tests/tests/setup/data.setup.ts` -- Data setup pattern, app settings config, auth restoration
- `tests/playwright.config.ts` -- Full project dependency graph (17+ projects)

### Secondary (MEDIUM confidence)
- [Inbucket REST API v1 docs](https://book.inbucket.org/rest/get-mailbox.html) -- Mailbox listing format, message structure
- [Inbucket REST API v1 docs](https://book.inbucket.org/rest/get-message.html) -- Message body format (text/html fields)
- [Supabase Admin Auth API docs](https://supabase.com/docs/reference/javascript/admin-api) -- createUser, deleteUser, updateUserById, generateLink

### Tertiary (LOW confidence)
- None -- all critical findings verified against source code and official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use or verified against npm registry
- Architecture: HIGH -- SupabaseAdminClient patterns derived directly from existing RPC signatures and schema
- Pitfalls: HIGH -- identified from direct code analysis of 17 consumer files and schema differences
- Dataset conversion: MEDIUM -- some edge cases (answersByExternalId, election-CG relationship) need verification during implementation

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable infrastructure, no fast-moving dependencies)
