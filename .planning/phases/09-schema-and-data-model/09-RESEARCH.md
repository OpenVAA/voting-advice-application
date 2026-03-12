# Phase 9: Schema and Data Model - Research

**Researched:** 2026-03-12
**Domain:** PostgreSQL schema design, JSONB localization, multi-tenant database architecture, @openvaa/data extension
**Confidence:** HIGH

## Summary

This phase creates the complete Supabase/PostgreSQL schema modeled on @openvaa/data entities, adds multi-tenant structure (accounts/projects), implements JSONB-based localization with a `get_localized()` SQL function, provides both JSONB and relational answer storage as alternative migrations with trigger validation, and extends @openvaa/data with a QuestionTemplate class.

The @openvaa/data package provides a well-defined entity model with clear type hierarchies: Entity variants (Candidate, Organization, Faction, Alliance), Question variants (8 types grouped by simple/single-choice/multiple-choice), Elections, Constituencies/ConstituencyGroups, Nominations (4 variants), and QuestionCategories. Each entity inherits from DataObjectData which provides: id, name, shortName, info, color (normal/dark), image (url/alt/formats), order, subtype, customData, isGenerated. The existing Strapi schemas show the current data flow: JSON fields for localized content (name, shortName, info), JSON blob for answers on candidate/party records, and QuestionType as a separate entity with name/settings/info.

**Primary recommendation:** Use multiple topical migration files (one per logical domain), JSONB columns for all localizable fields matching the existing `{"en":"...","fi":"..."}` pattern, and JSONB for choices on questions (simpler trigger validation, matches template defaults). Enable pg_jsonschema extension for answer validation triggers.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Localization strategy: JSONB columns for all localizable fields (same pattern as Strapi: `{"en": "...", "fi": "..."}`). A reusable SQL function `get_localized(jsonb, locale, default_locale)` handles fallback: requested locale -> default locale -> first available key. Default locale configured per project in app_settings. Locale parameter set as session variable per request; views/functions use it. Voter-facing queries return resolved strings only. Candidate/admin apps query base tables directly.
- Answer storage -- JSONB alternative: Answers stored as JSONB blob on candidate/organization records (`Record<QuestionId, Answer>`). Trigger validation against question template's expected type and constraints.
- Answer storage -- Relational alternative: Separate `answers` table with one row per entity-question pair. Single `value jsonb` column. Columns: entity_id, entity_type, question_id, value (jsonb), open_answer (text), project_id. Trigger validates answer value against question's template. Consider materialized/regular views for bulk reads.
- QuestionTemplate design: First-class DataObject in @openvaa/data (extends DataObject, lives in DataRoot collection). Based on existing QuestionType enum values. Defines: answer type, settings, default choices, info. Template is optional for questions.
- Multi-tenant hierarchy: `accounts` table, `projects` table linked to accounts, all content tables via `project_id` FK. Users belong to accounts. Single-tenant deployment: seed data auto-creates default account + project.
- App settings: One row per project with single `settings jsonb` column.
- Deferred tables: Feedback and AdminJob deferred to Phase 12.

### Claude's Discretion
- Whether choices for choice-type questions use a separate table or JSONB on the question -- pick based on how it interacts with trigger validation
- Whether voter-facing reads need a materialized view or if regular joins/views suffice -- evaluate during implementation
- How to split user role/membership table creation between Phase 9 and Phase 10
- Exact column definitions and constraints for each table (derived from @openvaa/data types)
- Migration file organization (one big migration vs multiple topical migrations)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCHM-01 | All content tables use snake_case naming with camelCase type mapping layer | Entity type analysis provides complete field inventory; snake_case conventions documented below |
| SCHM-02 | Schema models @openvaa/data entities -- elections, candidates, questions, answers, parties, constituencies, question_templates, app_settings | Full DataObjectData hierarchy mapped; every entity's fields documented in Architecture section |
| SCHM-03 | Localization strategy with locale-filtered queries | get_localized() function pattern, session variable approach, and view-based resolution documented |
| SCHM-04 | RLS enabled on every table with at least one policy per table | Placeholder "deny all" policies for Phase 9; real policies in Phase 10 |
| SCHM-05 | B-tree indexes on all RLS-referenced columns (project_id, user references) | Index strategy documented in Architecture Patterns |
| SCHM-06 | Both JSONB and relational answer storage schemas drafted as alternative migrations | Both alternatives fully specified with trigger validation |
| SCHM-07 | App settings stored as typed table with JSONB columns per section (one row per project) | Single `settings jsonb` column per CONTEXT.md decision |
| MTNT-01 | `accounts` table representing organizations | accounts table design documented |
| MTNT-02 | `projects` table linked to accounts | projects table design with account_id FK documented |
| MTNT-03 | All content tables linked to project via `project_id` | project_id on every content table documented |
| MTNT-07 | Single-tenant deployment works as degenerate case | Seed data creates default account + project |
| DATA-01 | @openvaa/data extended with QuestionTemplate concept | QuestionTemplate class design documented with DataObject extension pattern |
| DATA-02 | QuestionTemplate defines default properties, answer type, configuration | Type interface, class structure, and test approach documented |

</phase_requirements>

## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|-------------|---------|---------|--------------|
| PostgreSQL | 15 | Database engine | Configured in Phase 8 config.toml `major_version = 15` |
| Supabase CLI | ^2.78.1 | Migration management, type gen | Already installed in devDependencies |
| pg_jsonschema | latest (extension) | JSONB validation in triggers/constraints | Supabase-maintained extension for JSON Schema validation |
| vitest | ^2.1.8 | Unit tests for QuestionTemplate | Already used across @openvaa/data package |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @openvaa/core | workspace:^ | Base types (Id, HasId, MISSING_VALUE) | QuestionTemplate depends on these |
| tsx | ^4.19.3 | TypeScript execution for tooling | Already in @openvaa/data devDependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pg_jsonschema CHECK | Pure PL/pgSQL validation | pg_jsonschema is more declarative and maintainable; PL/pgSQL gives more control but requires manual type checking |
| JSONB choices on questions | Separate `choices` table | Separate table enables FK constraints but complicates trigger validation and template defaults significantly |

## Architecture Patterns

### Recommended Migration File Organization

Use multiple topical migration files with Supabase timestamp naming. This allows independent rollback of answer storage alternatives and clearer git history.

```
apps/supabase/supabase/migrations/
  YYYYMMDDHHMMSS_create_multi_tenant_tables.sql          # accounts, projects
  YYYYMMDDHHMMSS_create_localization_functions.sql        # get_localized(), session helpers
  YYYYMMDDHHMMSS_create_content_tables.sql                # elections, constituencies, constituency_groups, organizations, candidates, factions, alliances, question_templates, question_categories, questions, nominations
  YYYYMMDDHHMMSS_create_app_settings.sql                  # app_settings table
  YYYYMMDDHHMMSS_create_answers_jsonb.sql                 # JSONB answer storage + triggers
  YYYYMMDDHHMMSS_create_answers_relational.sql            # Relational answer storage + triggers
  YYYYMMDDHHMMSS_create_indexes.sql                       # B-tree indexes on project_id, FKs
  YYYYMMDDHHMMSS_enable_rls.sql                           # Enable RLS + placeholder policies
```

The two answer migrations are alternatives -- only one should be applied at a time. They must be structured so either can be applied and rolled back independently.

### Entity-to-Table Mapping

All tables inherit a common column set from DataObjectData:

```
Common columns (from DataObjectData):
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
  project_id    uuid NOT NULL REFERENCES projects(id)
  name          jsonb          -- localizable (or text for non-localizable entities)
  short_name    jsonb          -- localizable
  info          jsonb          -- localizable
  color         text           -- CSS color string (normal theme)
  color_dark    text           -- CSS color string (dark theme)
  image         jsonb          -- {url, alt, urlDark, formats}
  sort_order    integer        -- "order" is reserved in SQL, use sort_order
  subtype       text
  custom_data   jsonb
  is_generated  boolean DEFAULT false
  created_at    timestamptz DEFAULT now()
  updated_at    timestamptz DEFAULT now()
```

**IMPORTANT: `order` is a reserved word in SQL.** Use `sort_order` as the column name, map to `order` in the TypeScript layer.

### Complete Table Designs

**accounts**
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
name          text NOT NULL
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
```

**projects**
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
account_id    uuid NOT NULL REFERENCES accounts(id)
name          text NOT NULL
default_locale text NOT NULL DEFAULT 'en'
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
```

**elections** (from ElectionData)
```sql
-- Common columns + project_id
-- name: jsonb (localizable, required)
-- short_name: jsonb (localizable)
-- info: jsonb (localizable)
election_date         date           -- maps to ElectionData.date
election_start_date   date           -- from Strapi, not in @openvaa/data but useful
election_type         text           -- subtype from DataObjectData
multiple_rounds       boolean DEFAULT false
current_round         integer DEFAULT 1  -- maps to ElectionData.round
```

**constituency_groups** (from ConstituencyGroupData)
```sql
-- Common columns + project_id
-- name: jsonb (localizable)
-- Uses a join table for constituency membership:
```

**constituency_group_constituencies** (join table)
```sql
constituency_group_id  uuid REFERENCES constituency_groups(id) ON DELETE CASCADE
constituency_id        uuid REFERENCES constituencies(id) ON DELETE CASCADE
PRIMARY KEY (constituency_group_id, constituency_id)
```

**election_constituency_groups** (join table)
```sql
election_id            uuid REFERENCES elections(id) ON DELETE CASCADE
constituency_group_id  uuid REFERENCES constituency_groups(id) ON DELETE CASCADE
PRIMARY KEY (election_id, constituency_group_id)
```

**constituencies** (from ConstituencyData)
```sql
-- Common columns + project_id
-- name: jsonb (localizable, required)
keywords      jsonb           -- array of strings (localizable array)
parent_id     uuid REFERENCES constituencies(id)
```

**organizations** (from OrganizationData -- maps to Strapi "party")
```sql
-- Common columns + project_id
-- name: jsonb (localizable, required)
-- answers: handled by answer storage alternative
```

**candidates** (from CandidateData)
```sql
-- Common columns + project_id
first_name       text NOT NULL
last_name        text NOT NULL
organization_id  uuid REFERENCES organizations(id)
-- answers: handled by answer storage alternative
-- Note: auth_user_id added in Phase 10
```

**factions** (from FactionData)
```sql
-- Common columns + project_id
-- No additional fields beyond DataObjectData
```

**alliances** (from AllianceData)
```sql
-- Common columns + project_id
-- No additional fields beyond DataObjectData
```

**question_templates** (new -- maps to Strapi QuestionType concept)
```sql
-- Common columns + project_id
-- name: jsonb (localizable, e.g., "5-point Likert")
-- info: jsonb (localizable)
type             text NOT NULL    -- QuestionType enum value (text, number, boolean, singleChoiceOrdinal, etc.)
settings         jsonb            -- type-specific config (min/max for number, format options, etc.)
default_choices  jsonb            -- Array<Choice> for choice-type templates (Likert defaults, etc.)
```

**question_categories** (from QuestionCategoryData)
```sql
-- Common columns + project_id
-- name: jsonb (localizable)
category_type    text DEFAULT 'opinion'  -- 'opinion' | 'info' | 'default'
-- Filter fields stored as JSONB arrays for flexibility:
election_ids     jsonb            -- FilterValue<Id>
election_rounds  jsonb            -- FilterValue<number>
constituency_ids jsonb            -- FilterValue<Id>
entity_type      jsonb            -- FilterValue<EntityType>
```

**questions** (from QuestionData + ChoiceQuestionData + NumberQuestionData + DateQuestionData)
```sql
-- Common columns + project_id
-- name: jsonb (localizable, required -- this is the question text)
-- info: jsonb (localizable)
type              text NOT NULL     -- QuestionType enum value
category_id       uuid NOT NULL REFERENCES question_categories(id)
template_id       uuid REFERENCES question_templates(id)  -- optional
choices           jsonb             -- Array<Choice> for choice-type questions, overrides template defaults
settings          jsonb             -- type-specific: {min, max, format} for number/date questions
-- Filter fields:
election_ids      jsonb
election_rounds   jsonb
constituency_ids  jsonb
entity_type       jsonb
-- Additional Strapi fields worth keeping:
allow_open        boolean DEFAULT true
required          boolean DEFAULT true
```

**nominations** (from NominationData)
```sql
-- Common columns + project_id
entity_type           text NOT NULL       -- 'candidate' | 'organization' | 'faction' | 'alliance'
entity_id             uuid NOT NULL       -- FK determined by entity_type, enforced by trigger
election_id           uuid NOT NULL REFERENCES elections(id)
constituency_id       uuid NOT NULL REFERENCES constituencies(id)
election_round        integer DEFAULT 1
election_symbol       text
parent_nomination_id  uuid REFERENCES nominations(id)
parent_entity_type    text
unconfirmed           boolean DEFAULT false  -- from Strapi, useful for candidate management
```

**app_settings** (per CONTEXT.md decision)
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id    uuid NOT NULL UNIQUE REFERENCES projects(id)
settings      jsonb NOT NULL DEFAULT '{}'::jsonb
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
```

### JSONB Answer Storage Alternative

```sql
-- Add answers column to candidates and organizations tables
ALTER TABLE candidates ADD COLUMN answers jsonb DEFAULT '{}'::jsonb;
ALTER TABLE organizations ADD COLUMN answers jsonb DEFAULT '{}'::jsonb;

-- Trigger function that validates answer values against question templates
CREATE OR REPLACE FUNCTION validate_answers_jsonb()
RETURNS TRIGGER AS $$
DECLARE
  question_id text;
  answer_value jsonb;
  question_record record;
BEGIN
  -- Only validate if answers changed
  IF NEW.answers IS NOT DISTINCT FROM OLD.answers THEN
    RETURN NEW;
  END IF;

  FOR question_id, answer_value IN SELECT * FROM jsonb_each(NEW.answers)
  LOOP
    -- Look up the question and its template
    SELECT q.type, q.template_id, q.choices,
           qt.default_choices, qt.settings AS template_settings
    INTO question_record
    FROM questions q
    LEFT JOIN question_templates qt ON q.template_id = qt.id
    WHERE q.id = question_id::uuid
      AND q.project_id = NEW.project_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Question % not found in project', question_id;
    END IF;

    -- Validate answer value against question type
    PERFORM validate_answer_value(
      answer_value,
      question_record.type,
      COALESCE(question_record.choices, question_record.default_choices)
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Relational Answer Storage Alternative

```sql
CREATE TABLE answers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES projects(id),
  entity_id       uuid NOT NULL,
  entity_type     text NOT NULL CHECK (entity_type IN ('candidate', 'organization')),
  question_id     uuid NOT NULL REFERENCES questions(id),
  value           jsonb,           -- the answer value (type depends on question)
  open_answer     text,            -- optional open-ended text
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (entity_id, question_id)  -- one answer per entity-question pair
);

-- Trigger validates answer against question type/template
-- Same validate_answer_value() function used by both alternatives
```

### Pattern: get_localized() SQL Function

```sql
CREATE OR REPLACE FUNCTION get_localized(
  val jsonb,
  locale text,
  default_locale text DEFAULT 'en'
)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  -- Try requested locale
  IF val ? locale THEN
    RETURN val ->> locale;
  END IF;
  -- Fall back to default locale
  IF val ? default_locale THEN
    RETURN val ->> default_locale;
  END IF;
  -- Fall back to first available key
  RETURN (SELECT val ->> k FROM jsonb_object_keys(val) AS k LIMIT 1);
END;
$$;
```

### Pattern: Session Variable for Locale

```sql
-- Set at the start of each request (in PostgREST middleware or Edge Function):
SELECT set_config('app.locale', 'fi', TRUE);  -- TRUE = local to transaction

-- In views/functions:
SELECT get_localized(
  name,
  current_setting('app.locale', TRUE),
  (SELECT default_locale FROM projects WHERE id = content_table.project_id)
);
```

### Pattern: Localized View for Voter-Facing Queries

```sql
CREATE OR REPLACE VIEW elections_localized AS
SELECT
  id,
  project_id,
  get_localized(name, current_setting('app.locale', TRUE),
    (SELECT default_locale FROM projects WHERE id = elections.project_id)) AS name,
  get_localized(short_name, current_setting('app.locale', TRUE),
    (SELECT default_locale FROM projects WHERE id = elections.project_id)) AS short_name,
  get_localized(info, current_setting('app.locale', TRUE),
    (SELECT default_locale FROM projects WHERE id = elections.project_id)) AS info,
  election_date,
  multiple_rounds,
  current_round,
  sort_order
FROM elections;
```

### Pattern: snake_case to camelCase Type Mapping

The Supabase type generator produces snake_case types. A thin mapping layer in TypeScript converts between the two conventions. This layer lives alongside the future data adapter (Phase v3+) but the column naming convention is set now.

Key mappings:
| Database (snake_case) | TypeScript (camelCase) |
|-----------------------|------------------------|
| sort_order | order |
| short_name | shortName |
| custom_data | customData |
| is_generated | isGenerated |
| color_dark | (part of Colors.dark) |
| first_name | firstName |
| last_name | lastName |
| organization_id | organizationId |
| category_id | categoryId |
| template_id | templateId |
| election_ids | electionIds |
| constituency_ids | constituencyIds |
| entity_type | entityType |
| entity_id | entityId |
| election_id | electionId |
| constituency_id | constituencyId |
| election_round | electionRound |
| election_symbol | electionSymbol |
| parent_nomination_id | parentNominationId |
| parent_entity_type | parentNominationType |
| project_id | (not in @openvaa/data -- multi-tenant concern) |
| account_id | (not in @openvaa/data -- multi-tenant concern) |

### Anti-Patterns to Avoid

- **Using `order` as column name:** It is a SQL reserved word. Use `sort_order` instead.
- **Separate typed columns for answer values:** The decision is to use a single `value jsonb` column in the relational alternative. Do NOT create separate `value_text`, `value_number` columns.
- **Hardcoding locale fallback:** The default locale comes from the project's `default_locale` column, not a hardcoded value.
- **Foreign key on nominations.entity_id without type discrimination:** Since entity_id can reference candidates, organizations, factions, or alliances, a simple FK constraint is impossible. Use trigger validation or a CHECK constraint instead.
- **Putting RLS policies with JWT logic in Phase 9:** Phase 9 only enables RLS and adds placeholder "deny all except service_role" policies. Real role-based policies are Phase 10.

### Discretion Decision: Choices as JSONB on Questions

**Recommendation: Use JSONB on the questions table** (not a separate `choices` table).

Rationale:
1. **Template defaults pattern:** QuestionTemplate defines `default_choices` as JSONB. Questions either inherit these or override with their own `choices` JSONB. A separate table would require duplicating template choices into rows for every question that uses defaults.
2. **Trigger validation simplicity:** The trigger can COALESCE question choices with template defaults directly from JSONB without joins.
3. **Atomic reads:** Choices are always read together with their question. JSONB avoids an extra join.
4. **Strapi precedent:** The existing Strapi schema stores question settings (including type info that implies choices) as JSON.
5. **Trade-off accepted:** Choices cannot have FK constraints, but they are validated by triggers and are always scoped to a single question.

### Discretion Decision: User Role Tables

**Recommendation: Defer user_roles/account_members to Phase 10.** Phase 9 creates the schema for accounts and projects but the role assignment tables (user_roles, account_members) depend on auth.users which is Phase 10's domain. Phase 9 only needs project_id on content tables, not user-project relationships.

### Discretion Decision: Migration File Organization

**Recommendation: Multiple topical migrations** (7-8 files as shown in the structure above). Benefits:
- Answer alternatives can be applied/rolled back independently
- Git diffs are meaningful
- Each migration is self-contained and testable

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSONB schema validation | Custom PL/pgSQL type checking | pg_jsonschema `jsonb_matches_schema()` | Handles JSON Schema spec, maintained by Supabase |
| UUID generation | Custom ID generation | `gen_random_uuid()` (built-in PG 15) | Standard, performant, no extension needed |
| Timestamp management | Manual timestamp updates | `created_at DEFAULT now()` + trigger for `updated_at` | Standard pattern, trigger-based is reliable |
| Session variable management | Custom state tables | `set_config()` / `current_setting()` | Built-in PostgreSQL, transaction-scoped |
| JSONB key extraction | Custom parsing functions | `->>`  and `->` operators | Built-in PostgreSQL operators, well-optimized |

## Common Pitfalls

### Pitfall 1: JSONB Locale Fallback Returns NULL
**What goes wrong:** `val ->> locale` returns NULL if the key doesn't exist, and queries silently return NULL names.
**Why it happens:** JSONB extraction doesn't throw on missing keys.
**How to avoid:** The `get_localized()` function implements COALESCE-style fallback. Always use it instead of raw `->>` for localizable fields.
**Warning signs:** NULL values in voter-facing query results.

### Pitfall 2: Answer Validation Trigger on INSERT Without OLD
**What goes wrong:** `IF NEW.answers IS NOT DISTINCT FROM OLD.answers` fails on INSERT because OLD is NULL.
**Why it happens:** INSERT triggers don't have an OLD record.
**How to avoid:** Use `TG_OP` to distinguish INSERT from UPDATE: `IF TG_OP = 'UPDATE' AND NEW.answers IS NOT DISTINCT FROM OLD.answers THEN RETURN NEW; END IF;`
**Warning signs:** Trigger errors on first answer save.

### Pitfall 3: Polymorphic FK on nominations.entity_id
**What goes wrong:** Trying to add a FOREIGN KEY constraint on `entity_id` that references different tables based on `entity_type`.
**Why it happens:** PostgreSQL doesn't support conditional FK targets.
**How to avoid:** Use trigger-based validation: look up the entity in the correct table based on entity_type. Alternatively, accept the denormalization since nominations are always queried with their entity.
**Warning signs:** Migration errors when trying to create the FK.

### Pitfall 4: GIN Index on JSONB Localization Columns
**What goes wrong:** Creating GIN indexes on name/info JSONB columns expecting them to speed up `get_localized()` calls.
**Why it happens:** GIN indexes are for containment queries (`@>`, `?`), not key-value extraction (`->>`).
**How to avoid:** Don't index localization JSONB columns with GIN. The `get_localized()` function accesses specific keys by name, which JSONB handles efficiently without indexes.
**Warning signs:** Large index size with no query speedup.

### Pitfall 5: Missing RLS on Join Tables
**What goes wrong:** Enabling RLS on main tables but forgetting join tables (election_constituency_groups, constituency_group_constituencies).
**Why it happens:** Join tables feel like "internal" tables.
**How to avoid:** Enable RLS on EVERY table including join tables. Phase 9 adds placeholder policies; Phase 10 makes them meaningful.
**Warning signs:** `supabase db lint` warnings about missing RLS.

### Pitfall 6: set_config Scope with Connection Pooling
**What goes wrong:** Locale set via `set_config('app.locale', 'fi', FALSE)` leaks to next request on pooled connection.
**Why it happens:** `FALSE` means session-scoped, and pooled connections are reused.
**How to avoid:** Always use `TRUE` (transaction-local) for per-request variables: `set_config('app.locale', 'fi', TRUE)`.
**Warning signs:** Wrong locale returned for some requests.

## Code Examples

### QuestionTemplate Class Design (for @openvaa/data)

```typescript
// packages/data/src/objects/questions/template/questionTemplate.type.ts
import type { Choice, DataObjectData, QuestionType } from '../../../internal';

export interface QuestionTemplateData extends DataObjectData {
  /**
   * Name is required for templates (e.g., "5-point Likert Scale").
   */
  name: string;
  /**
   * The question type this template defines defaults for.
   */
  type: QuestionType;
  /**
   * Type-specific configuration (e.g., {min: 1, max: 10} for number questions).
   */
  settings?: Record<string, unknown> | null;
  /**
   * Default choices for choice-type templates (e.g., Likert scale labels).
   * Questions using this template inherit these unless they override.
   */
  defaultChoices?: Array<Choice<unknown>> | null;
}
```

```typescript
// packages/data/src/objects/questions/template/questionTemplate.ts
import { DataObject } from '../../../internal';
import type { DataRoot, QuestionTemplateData, ObjectType } from '../../../internal';

// Add to OBJECT_TYPE: QuestionTemplate: 'questionTemplate'

export class QuestionTemplate extends DataObject<QuestionTemplateData> {
  readonly objectType: ObjectType = 'questionTemplate' as ObjectType;

  constructor({ data, root }: { data: QuestionTemplateData; root: DataRoot }) {
    super({ data, root });
  }

  get type() {
    return this.data.type;
  }

  get settings() {
    return this.data.settings ?? {};
  }

  get defaultChoices() {
    return this.data.defaultChoices ?? [];
  }
}
```

### Shared validate_answer_value() Function

```sql
-- Used by both JSONB and relational answer triggers
CREATE OR REPLACE FUNCTION validate_answer_value(
  answer_val jsonb,
  question_type text,
  valid_choices jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  answer_value jsonb;
  choice_ids jsonb;
BEGIN
  -- Extract the 'value' key from the answer (answers are {value: ..., info?: ...})
  answer_value := answer_val -> 'value';

  -- NULL/missing value is always valid (represents unanswered)
  IF answer_value IS NULL OR answer_value = 'null'::jsonb THEN
    RETURN;
  END IF;

  CASE question_type
    WHEN 'text' THEN
      IF jsonb_typeof(answer_value) != 'string' THEN
        RAISE EXCEPTION 'Answer for text question must be a string';
      END IF;
    WHEN 'number' THEN
      IF jsonb_typeof(answer_value) != 'number' THEN
        RAISE EXCEPTION 'Answer for number question must be a number';
      END IF;
    WHEN 'boolean' THEN
      IF jsonb_typeof(answer_value) NOT IN ('true', 'false') THEN
        RAISE EXCEPTION 'Answer for boolean question must be a boolean';
      END IF;
    WHEN 'date' THEN
      IF jsonb_typeof(answer_value) != 'string' THEN
        RAISE EXCEPTION 'Answer for date question must be a date string';
      END IF;
    WHEN 'singleChoiceOrdinal', 'singleChoiceCategorical' THEN
      IF jsonb_typeof(answer_value) != 'string' THEN
        RAISE EXCEPTION 'Answer for choice question must be a choice ID string';
      END IF;
      IF valid_choices IS NOT NULL THEN
        SELECT jsonb_agg(c -> 'id') INTO choice_ids FROM jsonb_array_elements(valid_choices) AS c;
        IF NOT choice_ids @> to_jsonb(answer_value #>> '{}') THEN
          RAISE EXCEPTION 'Answer choice ID not in valid choices';
        END IF;
      END IF;
    WHEN 'multipleChoiceCategorical' THEN
      IF jsonb_typeof(answer_value) != 'array' THEN
        RAISE EXCEPTION 'Answer for multiple choice question must be an array';
      END IF;
    WHEN 'multipleText' THEN
      IF jsonb_typeof(answer_value) != 'array' THEN
        RAISE EXCEPTION 'Answer for multipleText question must be an array';
      END IF;
    WHEN 'image' THEN
      IF jsonb_typeof(answer_value) != 'object' THEN
        RAISE EXCEPTION 'Answer for image question must be an object';
      END IF;
    ELSE
      RAISE EXCEPTION 'Unknown question type: %', question_type;
  END CASE;
END;
$$;
```

### updated_at Trigger Pattern

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to each table:
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON elections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Seed Data for Single-Tenant Default

```sql
-- Create default account and project for single-tenant deployments
INSERT INTO accounts (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Account')
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, account_id, name, default_locale)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Default Project',
  'en'
)
ON CONFLICT (id) DO NOTHING;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Strapi JSON fields for localization | JSONB columns with SQL function extraction | Phase 9 | Same storage pattern, but extraction happens at DB level rather than app level |
| Strapi QuestionType content type | QuestionTemplate as @openvaa/data DataObject | Phase 9 | Template is a first-class data entity with TypeScript types and DB table |
| Strapi single-type app settings | One row per project with JSONB settings | Phase 9 | Supports multi-tenant (one settings row per project) |
| Strapi auto-increment IDs | UUID primary keys | Phase 9 | Better for distributed systems, no sequential ID leakage |

## Open Questions

1. **Materialized view for voter-facing bulk reads in relational alternative**
   - What we know: Regular views with joins work for small datasets. At 5K+ candidates with 30+ questions each, the join could be slow.
   - What's unclear: Whether a materialized view is needed or if proper indexing suffices.
   - Recommendation: Start with a regular view. Phase 11 load testing will determine if materialization is needed.

2. **Constituency-Alliance relationship**
   - What we know: Strapi has a constituency->alliance relationship. @openvaa/data doesn't model this directly.
   - What's unclear: Whether this relationship is needed in the new schema.
   - Recommendation: Omit for now; alliances are connected to elections and organizations, not constituencies directly. The Strapi relationship appears to be a display convenience.

3. **Candidate firstName/lastName localization**
   - What we know: Strapi stores firstName and lastName as plain text (not JSON/localizable). @openvaa/data also has them as plain strings.
   - What's unclear: Whether names should ever be localizable (transliteration scenarios).
   - Recommendation: Keep as plain text columns. Names are typically not translated.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^2.1.8 |
| Config file | `packages/data/vitest.config.ts` (exists, empty default) |
| Quick run command | `cd packages/data && npx vitest run --reporter=verbose` |
| Full suite command | `yarn test:unit` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | QuestionTemplate class extends DataObject | unit | `cd packages/data && npx vitest run src/objects/questions/template/questionTemplate.test.ts -x` | Wave 0 |
| DATA-02 | QuestionTemplate defines defaults, type, settings | unit | Same as DATA-01 | Wave 0 |
| SCHM-01 | snake_case tables visible in Supabase Studio | smoke | `cd apps/supabase && npx supabase db reset` | Manual verification |
| SCHM-02 | All entity tables created | smoke | `cd apps/supabase && npx supabase db reset` | Manual verification |
| SCHM-03 | get_localized returns correct locale | smoke | SQL test in seed or manual | Manual verification |
| SCHM-04 | RLS enabled on every table | lint | `cd apps/supabase && npx supabase db lint` | Phase 8 infra |
| SCHM-05 | B-tree indexes on project_id columns | smoke | `supabase db reset` + introspect | Manual verification |
| SCHM-06 | Both answer alternatives can be applied/rolled back | smoke | Apply each migration, verify, rollback | Manual verification |
| SCHM-07 | app_settings table with JSONB settings | smoke | `supabase db reset` + verify | Manual verification |
| MTNT-01 | accounts table exists | smoke | `supabase db reset` | Manual verification |
| MTNT-02 | projects table with account_id FK | smoke | `supabase db reset` | Manual verification |
| MTNT-03 | All content tables have project_id | lint | `supabase db lint` | Phase 8 infra |
| MTNT-07 | Seed creates default account + project | smoke | `supabase db reset` | Seed file |

### Sampling Rate
- **Per task commit:** `cd apps/supabase && npx supabase db reset` (validates all migrations apply cleanly)
- **Per wave merge:** `yarn test:unit` (validates QuestionTemplate TypeScript changes)
- **Phase gate:** Full suite green + `supabase db reset` clean + `supabase db lint` clean

### Wave 0 Gaps
- [ ] `packages/data/src/objects/questions/template/questionTemplate.test.ts` -- covers DATA-01, DATA-02
- [ ] `packages/data/src/objects/questions/template/questionTemplate.ts` -- QuestionTemplate class
- [ ] `packages/data/src/objects/questions/template/questionTemplate.type.ts` -- QuestionTemplateData interface

## Sources

### Primary (HIGH confidence)
- @openvaa/data source code -- complete entity type hierarchy (DataObjectData, EntityData, QuestionData, ChoiceQuestionData, NominationData, ElectionData, ConstituencyData, etc.)
- Strapi content type schemas (15 entities) -- reference field mappings and relationships
- Supabase config.toml from Phase 8 -- PostgreSQL 15, local dev configuration
- PostgreSQL 15 documentation -- JSON functions, set_config, current_setting

### Secondary (MEDIUM confidence)
- [pg_jsonschema Supabase docs](https://supabase.com/docs/guides/database/extensions/pg_jsonschema) -- JSON Schema validation extension usage
- [Supabase JSON docs](https://supabase.com/docs/guides/database/json) -- JSONB operator usage and best practices
- [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- RLS policy patterns
- [Supabase custom claims](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) -- JWT claims in RLS context
- [PostgreSQL session variables](https://www.postgresql.org/docs/current/config-setting.html) -- set_config/current_setting for per-request locale

### Tertiary (LOW confidence)
- [Multi-tenant RLS patterns](https://dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2) -- community patterns, verified against Supabase docs
- [GIN vs B-tree indexing](https://pganalyze.com/blog/gin-index) -- index strategy for JSONB columns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- PostgreSQL 15 and Supabase CLI already configured in Phase 8
- Architecture: HIGH -- @openvaa/data types provide exact field definitions; Strapi schemas provide reference implementation
- Pitfalls: HIGH -- based on verified PostgreSQL documentation and Supabase-specific patterns
- QuestionTemplate design: MEDIUM -- new class following established DataObject patterns, but no prior implementation to reference

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable domain -- PostgreSQL and Supabase patterns change slowly)
