-- Terms-of-use acceptances: `public.terms_of_use_acceptances`, its index, its RLS, its two policies and its privileges.
--
-- A row says that one user has accepted the terms of use of one project. The row's presence is the acceptance: the table holds no boolean and no version. Acceptance belongs to a user and a project and to no entity, so an acceptance for one project is not an acceptance for another.
--
-- Depends on:
-- - 100-tenancy.sql (projects)
-- - auth.users and auth.uid() (Supabase Auth)
--------------------------------------------------------------------------------
-- terms_of_use_acceptances table
--------------------------------------------------------------------------------
-- The database supplies who and when. `user_id` defaults to the caller and `accepted_at` to the server clock, and an API caller holds INSERT on `project_id` alone (see the grants below), so it can state neither. Deleting the user or the project deletes the row.
CREATE TABLE public.terms_of_use_acceptances (
  user_id uuid NOT NULL DEFAULT auth.uid () REFERENCES auth.users (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, project_id)
);

-- The lookup by project, who has accepted here, which the primary key cannot serve because it leads with user_id. No index on user_id alone: the primary key leads with it, which covers that foreign key for lint-schema.mjs's unindexed-foreign-key advisor.
CREATE INDEX idx_terms_of_use_acceptances_project_id ON public.terms_of_use_acceptances (project_id);

--------------------------------------------------------------------------------
-- RLS on terms_of_use_acceptances
--
-- Two policies, both for `authenticated`, and no UPDATE or DELETE policy: a user records their own acceptance and reads it back, and has no path to change or withdraw it. `anon` reaches nothing. A service-role caller bypasses row-level security and keeps its table privileges, so it can read and remove rows.
--
-- Both policies ask who the caller is and nothing else. Acceptance is a statement a user makes about themself, so no grant decides it. The INSERT policy checks who and not which project: a user can record an acceptance for any existing project, including one they hold no grant in. That unlocks nothing: no policy and no function reads this table, and every protected read and write is decided by the grant model alone.
--------------------------------------------------------------------------------
ALTER TABLE public.terms_of_use_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_terms_of_use_acceptances" ON public.terms_of_use_acceptances FOR
SELECT
  TO authenticated USING (
    user_id = (
      SELECT
        auth.uid ()
    )
  );

CREATE POLICY "authenticated_insert_terms_of_use_acceptances" ON public.terms_of_use_acceptances FOR INSERT TO authenticated
WITH
  CHECK (
    user_id = (
      SELECT
        auth.uid ()
    )
  );

--------------------------------------------------------------------------------
-- Privileges on terms_of_use_acceptances
--
-- Approach: REVOKE every table-level privilege, then GRANT SELECT on the table and INSERT on `project_id` only.
-- (A new table in the public schema is granted ALL to anon and authenticated by default, and a column-level grant restricts nothing while the table-level privilege exists.)
--
-- An insert that states `user_id` or `accepted_at` is refused for lack of privilege on that column, before any policy is consulted. `authenticated` holds no UPDATE and no DELETE, and `anon` holds nothing. An upsert must be the DO NOTHING form: the DO UPDATE form needs the UPDATE privilege.
--------------------------------------------------------------------------------
REVOKE ALL ON TABLE public.terms_of_use_acceptances
FROM
  anon,
  authenticated,
  public;

GRANT
SELECT
  ON TABLE public.terms_of_use_acceptances TO authenticated;

GRANT INSERT (project_id) ON TABLE public.terms_of_use_acceptances TO authenticated;
