-- Entity tables: organizations, candidates, factions, alliances
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  auth_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  is_generated boolean DEFAULT false,
  -- Read by 162-08 as the ENTITY-LEVEL term of section 11.2's rule: an entity is public only through a confirmed nomination AND only when it is itself confirmed. Defaults unconfirmed, because nobody has vouched for this identity yet; the seeding paths set it true, which is today's behaviour. ⚠ AS OF 162-13 THIS COLUMN IS INSIDE THE AUTHENTICATED UPDATE GRANT IN 303-column-grants.sql AND THE PROTECTION IS A TRIGGER: `enforce_entity_immutability()`'s rule 1 refuses any change to it, in either direction, by an authenticated caller who does not hold `entity.confirm` on the row. The grant had to give way because a single global pair against one role also refused the project administrator who holds that permission -- measured as a live 42501. Do not read the allow-list as the protection here.
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  answers jsonb DEFAULT '{}'::jsonb,
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- 162-13's conditional identity freeze and confirmation gate, registered here beside the audit stamp and declared once in 011-validation-functions.sql, in the one-body-many-tables form `enforce_external_id_immutability` already uses eleven times in 500-external-id.sql. The `UPDATE OF` list is the early exit: a column-restricted trigger fires only when one of its columns appears in the statement's SET list, decided once per statement from the parse tree rather than once per row. The ARGUMENTS are this table's protected name columns and nothing else; the confirmation column is in the `UPDATE OF` list and in no argument list, because it carries the same name on all four entity tables and is the subject of the other rule.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
confirmed ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name');

CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  is_generated boolean DEFAULT false,
  -- Read by 162-08 as the ENTITY-LEVEL term of section 11.2's rule: an entity is public only through a confirmed nomination AND only when it is itself confirmed. Defaults unconfirmed, because nobody has vouched for this identity yet. The one runtime path that sets it is `functions/identity-callback/candidateRecord.ts` (D-10, D-22), where a strong identity check has already happened. ⚠ AS OF 162-13 THIS COLUMN IS INSIDE THE AUTHENTICATED UPDATE GRANT IN 303-column-grants.sql AND THE PROTECTION IS A TRIGGER: `enforce_entity_immutability()`'s rule 1 refuses any change to it, in either direction, by an authenticated caller who does not hold `entity.confirm` on the row. The grant had to give way because a single global pair against one role also refused the project administrator who holds that permission -- measured as a live 42501. Do not read the allow-list as the protection here.
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  auth_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  -- Terms-of-use acceptance tracking: nullable timestamptz NULL = not yet accepted. Set by candidate when accepting ToU.
  terms_of_use_accepted timestamptz,
  answers jsonb DEFAULT '{}'::jsonb,
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- 162-13's conditional identity freeze and confirmation gate, registered here beside the audit stamp and declared once in 011-validation-functions.sql. THE `UPDATE OF` LIST IS THE EARLY EXIT AND IT IS WHAT KEEPS THE CANDIDATE APPLICATION'S HOTTEST WRITE FREE: a column-restricted trigger fires only when one of its columns appears in the statement's SET list, decided once per statement from the parse tree rather than once per row, so `upsert_answers` -- which sets only the answers column -- never enters the function at all. The ARGUMENTS are this table's protected name columns and nothing else; the confirmation column is in the `UPDATE OF` list and in no argument list, because it carries the same name on all four entity tables and is the subject of the other rule. This is the only entity table whose protected set has two members.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF first_name,
last_name,
confirmed ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('first_name', 'last_name');

CREATE TABLE public.factions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- Section 11.8's required faction-to-organization edge, declared here in the CREATE TABLE body rather than appended as an ALTER, and copying the form of the `project_id` line above it. The delete action is a ruling rather than a default: NOT NULL forecloses SET NULL outright, RESTRICT would block deleting an organization that has factions, and CASCADE is how `project_id` already behaves on this same table. Accepted consequence, recorded because the table had no data-loss path before: deleting an organization now deletes its factions and, through the nominations foreign keys, their nominations. 162-12 reads this column when it tightens `validate_nomination()` from *an* organization nomination to *the* faction's own organization's nomination.
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  is_generated boolean DEFAULT false,
  -- Read by 162-08 as the ENTITY-LEVEL term of section 11.2's rule: an entity is public only through a confirmed nomination AND only when it is itself confirmed. Defaults unconfirmed. 162-10 gave this table its first column-grant block and 162-13 completed it. ⚠ AS OF 162-13 THIS COLUMN IS INSIDE THE AUTHENTICATED UPDATE GRANT IN 303-column-grants.sql AND THE PROTECTION IS A TRIGGER: `enforce_entity_immutability()`'s rule 1 refuses any change to it, in either direction, by an authenticated caller who does not hold `entity.confirm` on the row. The grant had to give way because a single global pair against one role also refused the project administrator who holds that permission -- measured as a live 42501. Do not read the allow-list as the protection here.
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- 162-13's conditional identity freeze and confirmation gate, registered here beside the audit stamp and declared once in 011-validation-functions.sql, in the one-body-many-tables form `enforce_external_id_immutability` already uses eleven times in 500-external-id.sql. The `UPDATE OF` list is the early exit: a column-restricted trigger fires only when one of its columns appears in the statement's SET list, decided once per statement from the parse tree rather than once per row. The ARGUMENTS are this table's protected name columns and nothing else; the confirmation column is in the `UPDATE OF` list and in no argument list, because it carries the same name on all four entity tables and is the subject of the other rule.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
confirmed ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name');

CREATE TABLE public.alliances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  is_generated boolean DEFAULT false,
  -- Read by 162-08 as the ENTITY-LEVEL term of section 11.2's rule: an entity is public only through a confirmed nomination AND only when it is itself confirmed. Defaults unconfirmed. 162-10 gave this table its first column-grant block and 162-13 completed it. ⚠ AS OF 162-13 THIS COLUMN IS INSIDE THE AUTHENTICATED UPDATE GRANT IN 303-column-grants.sql AND THE PROTECTION IS A TRIGGER: `enforce_entity_immutability()`'s rule 1 refuses any change to it, in either direction, by an authenticated caller who does not hold `entity.confirm` on the row. The grant had to give way because a single global pair against one role also refused the project administrator who holds that permission -- measured as a live 42501. Do not read the allow-list as the protection here.
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- 162-13's conditional identity freeze and confirmation gate, registered here beside the audit stamp and declared once in 011-validation-functions.sql, in the one-body-many-tables form `enforce_external_id_immutability` already uses eleven times in 500-external-id.sql. The `UPDATE OF` list is the early exit: a column-restricted trigger fires only when one of its columns appears in the statement's SET list, decided once per statement from the parse tree rather than once per row. The ARGUMENTS are this table's protected name columns and nothing else; the confirmation column is in the `UPDATE OF` list and in no argument list, because it carries the same name on all four entity tables and is the subject of the other rule.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
confirmed ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name');
