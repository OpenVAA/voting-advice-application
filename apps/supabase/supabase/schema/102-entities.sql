-- Entity tables: organizations, candidates, factions, alliances
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- Localized string `{ "<locale>": string }`.
  name jsonb,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data: `{ normal, dark? }`, colour strings for the default and dark themes.
  color jsonb,
  -- `StoredImage` from @openvaa/app-shared: storage paths in the public-assets bucket, not URLs.
  image jsonb,
  -- Ascending display order, nulls last.
  sort_order integer,
  -- A free-text label that tells apart objects of the same kind, such as a constituency association among parties.
  subtype text,
  -- A free-form JSON object, read by the frontend as `customData`.
  custom_data jsonb,
  -- Whether the identity has been vouched for: an entity is public only when this is true and it has a confirmed nomination. Only a holder of `entity.confirm` on the row may change it, in either direction; the enforce_entity_immutability trigger enforces this, because the column is inside the authenticated UPDATE grant in 303-column-grants.sql.
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- `StoredAnswers` from @openvaa/app-shared: `{ "<question id>": { value, info? } }`, validated per changed key by validate_answers_jsonb (105-answers.sql).
  answers jsonb DEFAULT '{}'::jsonb,
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- Gates the confirmation flag and freezes the name of a confirmed entity; the function is declared in 011-validation-functions.sql. The `UPDATE OF` list makes the trigger fire only when a statement sets one of these columns, and the argument names the protected name column.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
confirmed ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name');

CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data: `{ normal, dark? }`, colour strings for the default and dark themes.
  color jsonb,
  -- `StoredImage` from @openvaa/app-shared: storage paths in the public-assets bucket, not URLs.
  image jsonb,
  -- Ascending display order, nulls last.
  sort_order integer,
  -- A free-text label that tells apart objects of the same kind.
  subtype text,
  -- A free-form JSON object, read by the frontend as `customData`.
  custom_data jsonb,
  -- Whether the identity has been vouched for: an entity is public only when this is true and it has a confirmed nomination. The identity-callback Edge Function (`candidateRecord.ts`) sets it after a strong identity check. Only a holder of `entity.confirm` on the row may change it, in either direction; the enforce_entity_immutability trigger enforces this, because the column is inside the authenticated UPDATE grant in 303-column-grants.sql.
  confirmed boolean NOT NULL DEFAULT false,
  -- When the candidate accepted the terms of use; null until then. An anonymous reader sees the candidate only once this is set and not in the future.
  terms_of_use_accepted timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- `StoredAnswers` from @openvaa/app-shared: `{ "<question id>": { value, info? } }`, validated per changed key by validate_answers_jsonb (105-answers.sql).
  answers jsonb DEFAULT '{}'::jsonb,
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- Gates the confirmation flag and freezes the names of a confirmed candidate; the function is declared in 011-validation-functions.sql. The `UPDATE OF` list makes the trigger fire only when a statement sets one of these columns, so `upsert_answers`, which sets only the answers column, never enters it. The arguments name the two protected name columns.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF first_name,
last_name,
confirmed ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('first_name', 'last_name');

CREATE TABLE public.factions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- The organization the faction belongs to. Deleting the organization deletes its factions and, through the nominations foreign keys, their nominations; validate_nomination requires a faction nomination's parent to be this organization's nomination.
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  -- Localized string `{ "<locale>": string }`.
  name jsonb,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data: `{ normal, dark? }`, colour strings for the default and dark themes.
  color jsonb,
  -- `StoredImage` from @openvaa/app-shared: storage paths in the public-assets bucket, not URLs.
  image jsonb,
  -- Ascending display order, nulls last.
  sort_order integer,
  -- A free-text label that tells apart objects of the same kind.
  subtype text,
  -- A free-form JSON object, read by the frontend as `customData`.
  custom_data jsonb,
  -- Whether the identity has been vouched for: an entity is public only when this is true and it has a confirmed nomination. Only a holder of `entity.confirm` on the row may change it, in either direction; the enforce_entity_immutability trigger enforces this, because the column is inside the authenticated UPDATE grant in 303-column-grants.sql.
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- Gates the confirmation flag and freezes the name of a confirmed entity; the function is declared in 011-validation-functions.sql. The `UPDATE OF` list makes the trigger fire only when a statement sets one of these columns, and the argument names the protected name column.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
confirmed ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name');

CREATE TABLE public.alliances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- Localized string `{ "<locale>": string }`.
  name jsonb,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data: `{ normal, dark? }`, colour strings for the default and dark themes.
  color jsonb,
  -- `StoredImage` from @openvaa/app-shared: storage paths in the public-assets bucket, not URLs.
  image jsonb,
  -- Ascending display order, nulls last.
  sort_order integer,
  -- A free-text label that tells apart objects of the same kind.
  subtype text,
  -- A free-form JSON object, read by the frontend as `customData`.
  custom_data jsonb,
  -- Whether the identity has been vouched for: an entity is public only when this is true and it has a confirmed nomination. Only a holder of `entity.confirm` on the row may change it, in either direction; the enforce_entity_immutability trigger enforces this, because the column is inside the authenticated UPDATE grant in 303-column-grants.sql.
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- Gates the confirmation flag and freezes the name of a confirmed entity; the function is declared in 011-validation-functions.sql. The `UPDATE OF` list makes the trigger fire only when a statement sets one of these columns, and the argument names the protected name column.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
confirmed ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name');
