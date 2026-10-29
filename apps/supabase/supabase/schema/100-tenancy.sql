-- Multi-tenant foundation: accounts and projects
--
-- All content tables reference projects via project_id FK with ON DELETE CASCADE.
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Plain text, not a localized string.
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.accounts FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts (id) ON DELETE CASCADE,
  -- Plain text, not a localized string.
  name text NOT NULL,
  -- The locale code a localized string falls back to when it has no entry for the requested locale.
  default_locale text NOT NULL DEFAULT 'en',
  -- Whether voters can read the project: an anonymous reader sees a row only when this is true, its nomination is confirmed and every entity that nomination links is confirmed. Defaults to false so a new project is not public. seed.sql sets it to true on the local stack's project, and SupabaseAdminClient.ensureProject on the project it ensures. A deployment's project row, this column included, is written by the bootstrap script `infra/scripts/bootstrap.sql`.
  open_for_voters boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.projects FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();
